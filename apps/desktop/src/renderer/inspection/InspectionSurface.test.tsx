// @vitest-environment jsdom

import { SOURCE_REJECTION_REASONS } from "@agent-ready/protocol";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StudioPreloadApi } from "../../preload/index.js";
import { InspectionSurface } from "./InspectionSurface.js";
import type { Inspection } from "./useInspection.js";

afterEach(cleanup);

const base: Inspection = {
  kind: "source-inspection",
  sourceId: "source-1",
  phase: null,
  verdict: null,
  condition: "ok",
  versionUnverified: false,
  owner: "acme",
  repository: "widgets",
  requestedRef: null,
  resolvedSha: null,
  inspectedAt: null,
  declaredVersionMarker: null,
  declaredVersionState: "absent",
  inspector: null,
  inspectorContractVersion: null,
  diagnostics: "",
  stopReason: null,
  waitWindow: null,
  secondaryDiagnostic: null,
};

function apiReturning(
  connect: Inspection,
  rest: Partial<Record<"get" | "cancel", Inspection>> = {},
): StudioPreloadApi {
  return {
    source: {
      connect: vi.fn(async () => ({ ok: true as const, value: connect })),
      get: vi.fn(async () => ({
        ok: true as const,
        value: rest.get ?? connect,
      })),
      cancel: vi.fn(async () => ({
        ok: true as const,
        value: rest.cancel ?? connect,
      })),
    },
  } as unknown as StudioPreloadApi;
}

describe("AC-0105 to AC-0107 the connect action and its resting state", () => {
  it("provides a Connect repository action with a single URL field", () => {
    render(<InspectionSurface api={apiReturning(base)} />);
    expect(
      screen.getByRole("button", { name: /connect repository/i }),
    ).toBeDefined();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
  });

  it("AC-0106 exposes no credential input on the connect form", () => {
    render(<InspectionSurface api={apiReturning(base)} />);
    expect(screen.queryByLabelText(/token|password|credential/i)).toBeNull();
    // The shape obligation, not just the copy one: one field exists, so there
    // is no second field a credential could be typed into.
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
  });

  it("AC-0107 names what connecting will do before anything is connected", () => {
    render(<InspectionSurface api={apiReturning(base)} />);
    expect(screen.getByText(/No repository connected/)).toBeDefined();
    expect(screen.getByText(/never writes to it/i)).toBeDefined();
  });
});

describe("AC-0108 to AC-0110 refusal", () => {
  const rejected: Inspection = {
    ...base,
    phase: "url-rejected",
    diagnostics: "That host is not github.com",
  };

  it("renders url-rejected with a human reason, associated with the field", async () => {
    render(<InspectionSurface api={apiReturning(rejected)} />);
    await userEvent.type(
      screen.getByRole("textbox"),
      "https://example.com/a/b",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /connect repository/i }),
    );

    const field = await screen.findByRole("textbox");
    await waitFor(() =>
      expect(field.getAttribute("aria-invalid")).toBe("true"),
    );
    const describedBy = field.getAttribute("aria-describedby") ?? "";
    expect(describedBy).not.toBe("");
    const reason = document.getElementById(describedBy.split(" ")[0] as string);
    expect(reason?.textContent).toBe("That host is not github.com");
  });

  it("AC-0109 returns focus to the field it invalidated", async () => {
    render(<InspectionSurface api={apiReturning(rejected)} />);
    await userEvent.type(
      screen.getByRole("textbox"),
      "https://example.com/a/b",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /connect repository/i }),
    );
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("textbox")),
    );
  });

  it("AC-0110 renders echoed input as literal text, never as markup", async () => {
    const hostile = '<img src=x onerror="alert(1)">';
    render(
      <InspectionSurface
        api={apiReturning({
          ...rejected,
          diagnostics: `Cannot use ${hostile}`,
        })}
      />,
    );
    await userEvent.type(screen.getByRole("textbox"), "x");
    await userEvent.click(
      screen.getByRole("button", { name: /connect repository/i }),
    );

    const reason = await screen.findByText(/Cannot use/);
    // The bytes are present as text and produced no element. A renderer that
    // set innerHTML would pass a text match on the words alone, so the
    // assertion is over the DOM the string produced.
    expect(reason.textContent).toContain(hostile);
    expect(reason.querySelector("img")).toBeNull();
    expect(document.querySelectorAll("img")).toHaveLength(0);
  });
});

describe("AC-0111, AC-0112 and AC-0126 in flight", () => {
  const resolving: Inspection = { ...base, phase: "resolving" };
  const inspecting: Inspection = {
    ...base,
    phase: "inspecting",
    resolvedSha: "abc1234def5678",
  };

  it("disables the form, says an inspection is running, and points at cancel", async () => {
    render(<InspectionSurface api={apiReturning(resolving)} />);
    await userEvent.type(screen.getByRole("textbox"), "https://github.com/a/b");
    await userEvent.click(
      screen.getByRole("button", { name: /connect repository/i }),
    );

    await waitFor(() =>
      expect((screen.getByRole("textbox") as HTMLInputElement).disabled).toBe(
        true,
      ),
    );
    expect(screen.getByText(/an inspection is running/i).textContent).toMatch(
      /cancel inspection/i,
    );
  });

  it("AC-0126 moves focus to cancel when the disable takes the field", async () => {
    render(<InspectionSurface api={apiReturning(resolving)} />);
    await userEvent.type(screen.getByRole("textbox"), "https://github.com/a/b");
    await userEvent.click(
      screen.getByRole("button", { name: /connect repository/i }),
    );
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: /cancel inspection/i }),
      ),
    );
  });

  it("AC-0112 renders resolving and inspecting separately, with the SHA and a cancel", async () => {
    const { unmount } = render(
      <InspectionSurface api={apiReturning(resolving)} />,
    );
    await userEvent.type(screen.getByRole("textbox"), "https://github.com/a/b");
    await userEvent.click(
      screen.getByRole("button", { name: /connect repository/i }),
    );
    // Scoped to the progress surface: the live region carries the same label
    // by design, and a document-wide query would match the announcement too.
    const progress = await screen.findByRole("region", {
      name: /inspection in progress/i,
    });
    await waitFor(() =>
      expect(
        within(progress).getByText("Finding the latest commit"),
      ).toBeDefined(),
    );
    expect(within(progress).queryByText(/^Inspecting/)).toBeNull();
    expect(
      (
        screen.getByRole("button", {
          name: /cancel inspection/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    unmount();

    render(<InspectionSurface api={apiReturning(inspecting)} />);
    await userEvent.type(screen.getByRole("textbox"), "https://github.com/a/b");
    await userEvent.click(
      screen.getByRole("button", { name: /connect repository/i }),
    );
    const inspectingRegion = await screen.findByRole("region", {
      name: /inspection in progress/i,
    });
    await waitFor(() =>
      expect(
        within(inspectingRegion).getByText("Inspecting abc1234"),
      ).toBeDefined(),
    );
    expect(
      within(inspectingRegion).queryByText("Finding the latest commit"),
    ).toBeNull();
    expect(within(inspectingRegion).getByText("abc1234def5678")).toBeDefined();
  });
});

describe("AC-0128 and AC-0158 one announcement per transition", () => {
  it("writes exactly one polite region, carrying the entered state's label", async () => {
    render(
      <InspectionSurface api={apiReturning({ ...base, phase: "resolving" })} />,
    );
    const regions = screen.getAllByRole("status");
    expect(regions).toHaveLength(1);
    expect(regions[0]?.getAttribute("aria-live")).toBe("polite");

    await userEvent.type(screen.getByRole("textbox"), "https://github.com/a/b");
    await userEvent.click(
      screen.getByRole("button", { name: /connect repository/i }),
    );
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe(
        "Finding the latest commit",
      ),
    );
    // Still one region, holding one line: no exit announcement was added.
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("AC-0158 announces the verdict's label when a result carries one", async () => {
    render(
      <InspectionSurface
        api={apiReturning({
          ...base,
          verdict: "agent-ready",
          resolvedSha: "abc1234def",
        })}
      />,
    );
    await userEvent.type(screen.getByRole("textbox"), "https://github.com/a/b");
    await userEvent.click(
      screen.getByRole("button", { name: /connect repository/i }),
    );
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("Agent-Ready"),
    );
  });
});

describe("AC-0108 every refusal cause reaches the lead distinguishably", () => {
  it("renders each rejection reason as the service worded it", async () => {
    // The service already asserts the five reasons are distinct from one
    // another (source-identity.test.ts). What this adds is the renderer half:
    // a surface that collapsed them into one message would pass that test and
    // still leave the lead unable to tell which cause fired.
    const seen = new Set<string>();
    for (const reason of Object.values(SOURCE_REJECTION_REASONS)) {
      const { unmount } = render(
        <InspectionSurface
          api={apiReturning({
            ...base,
            phase: "url-rejected",
            diagnostics: reason,
          })}
        />,
      );
      await userEvent.type(
        screen.getByRole("textbox"),
        "https://example.com/a",
      );
      await userEvent.click(
        screen.getByRole("button", { name: /connect repository/i }),
      );
      const shown = await screen.findByText(reason);
      expect(shown.textContent).toBe(reason);
      seen.add(shown.textContent ?? "");
      unmount();
    }
    expect(seen.size).toBe(Object.keys(SOURCE_REJECTION_REASONS).length);
  });
});

describe("AC-0124 and AC-0127 keyboard operability and reading order", () => {
  it("reaches every control this slice introduces by keyboard, in reading order", async () => {
    // Each control is checked in the state where it is enabled. A disabled
    // control is correctly not a tab stop, so asserting one tab order across
    // both states would be asserting the wrong thing: at rest cancel has
    // nothing to cancel, and in flight the field is deliberately unavailable.
    const api = apiReturning(
      { ...base, phase: "resolving" },
      {
        cancel: {
          ...base,
          phase: null,
          verdict: "no-verdict",
          condition: "cancelled",
        },
      },
    );
    render(<InspectionSurface api={api} />);
    const field = screen.getByRole("textbox");
    const connect = screen.getByRole("button", { name: /connect repository/i });

    field.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(connect);

    await userEvent.click(connect);
    // In flight: the field and submit are disabled, and cancel is the way out.
    const cancel = await screen.findByRole("button", {
      name: /cancel inspection/i,
    });
    await waitFor(() =>
      expect((cancel as HTMLButtonElement).disabled).toBe(false),
    );
    cancel.focus();
    expect(document.activeElement).toBe(cancel);
    // Operable by keyboard, not pointer only.
    await userEvent.keyboard("{Enter}");
    // The observable post-condition: activating Cancel from the keyboard
    // reaches the cancelled result, which renders its own restart copy.
    await waitFor(() =>
      expect(screen.getByText(/You stopped this inspection/)).toBeDefined(),
    );
  });

  it("exposes a heading for the connect surface", () => {
    render(<InspectionSurface api={apiReturning(base)} />);
    expect(
      screen.getByRole("heading", { name: /connect repository/i }),
    ).toBeDefined();
  });

  it("submits from the keyboard alone", async () => {
    const api = apiReturning({ ...base, phase: "resolving" });
    render(<InspectionSurface api={api} />);
    screen.getByRole("textbox").focus();
    await userEvent.keyboard("https://github.com/acme/widgets{Enter}");
    // Keyboard submission produces the in-flight surface, which is the
    // contract; that the mock was called is an implementation detail.
    const region = await screen.findByRole("region", {
      name: /inspection in progress/i,
    });
    await waitFor(() =>
      expect(
        within(region).getByText("Finding the latest commit"),
      ).toBeDefined(),
    );
  });
});

describe("AC-0103 the inspection time reaches the rendered result", () => {
  it("carries inspectedAt from the inspection through to the surface", async () => {
    // `inspectedAt` is a required prop, so simply omitting it here is a
    // typecheck failure and needs no test. What the type does not catch is
    // this call site wiring the *wrong* field -- passing `resolvedSha`, or a
    // stale local -- which stays green everywhere else because every other
    // case renders VerdictSurface directly. This asserts the value that
    // crossed the boundary is the one the inspection carried.
    render(
      <InspectionSurface
        api={apiReturning({
          ...base,
          verdict: "agent-ready",
          resolvedSha: "abc1234def",
          inspectedAt: "2026-09-19T14:05:00.000Z",
        })}
      />,
    );
    await userEvent.type(screen.getByRole("textbox"), "https://github.com/a/b");
    await userEvent.click(
      screen.getByRole("button", { name: /connect repository/i }),
    );
    // Asserts the value that crossed the boundary, not how it is formatted --
    // the rendered format is pinned once, in VerdictSurface.test.tsx, so a
    // format change breaks one file rather than two.
    await waitFor(() =>
      expect(
        document
          .querySelector('[data-identity="inspected-at"] time')
          ?.getAttribute("dateTime"),
      ).toBe("2026-09-19T14:05:00.000Z"),
    );
  });
});
