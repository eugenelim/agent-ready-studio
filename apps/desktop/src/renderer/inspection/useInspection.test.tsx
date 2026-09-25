// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StudioPreloadApi } from "../../preload/index.js";
import { InspectionSurface, POLL_INTERVAL_MS } from "./InspectionSurface.js";
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

function api(overrides: Partial<StudioPreloadApi["source"]>): StudioPreloadApi {
  return {
    source: {
      connect: vi.fn(async () => ({ ok: true as const, value: base })),
      get: vi.fn(async () => ({ ok: true as const, value: base })),
      cancel: vi.fn(async () => ({ ok: true as const, value: base })),
      ...overrides,
    },
  } as unknown as StudioPreloadApi;
}

const failure = {
  ok: false as const,
  error: {
    kind: "service" as const,
    message: "Internal error",
    code: -32603,
    data: null,
  },
};

async function submit(url = "https://github.com/acme/widgets") {
  await userEvent.type(screen.getByRole("textbox"), url);
  await userEvent.click(
    screen.getByRole("button", { name: /connect repository/i }),
  );
}

describe("a Studio-side failure is attributed to Studio", () => {
  it("does not mark the lead's URL invalid when the service fails", async () => {
    // The shipped surface did the opposite: it wrote the transport error into
    // the rejection channel, so an internal error read as "your URL is wrong".
    render(
      <InspectionSurface api={api({ connect: vi.fn(async () => failure) })} />,
    );
    await submit();

    await waitFor(() =>
      expect(screen.getByText(/Studio cannot inspect/)).toBeDefined(),
    );
    const field = screen.getByRole("textbox");
    expect(field.getAttribute("aria-invalid")).not.toBe("true");
    expect(document.querySelector('[data-state="url-rejected"]')).toBeNull();
    expect(
      document.querySelector('[data-attribution="Studio"]'),
    ).not.toBeNull();
  });

  it("reports a failed cancel instead of discarding it", async () => {
    // A failed cancel previously left the form disabled and said nothing: the
    // lead pressed Cancel and the surface did not react at all.
    render(
      <InspectionSurface
        api={api({
          connect: vi.fn(async () => ({
            ok: true as const,
            value: { ...base, phase: "resolving" as const },
          })),
          cancel: vi.fn(async () => failure),
        })}
      />,
    );
    await submit();
    await userEvent.click(
      await screen.findByRole("button", { name: /cancel inspection/i }),
    );
    await waitFor(() =>
      expect(screen.getByText(/could not stop the inspection/i)).toBeDefined(),
    );
  });

  it("reports a failed refresh instead of discarding it", async () => {
    render(
      <InspectionSurface
        api={api({
          connect: vi.fn(async () => ({
            ok: true as const,
            value: { ...base, phase: "resolving" as const },
          })),
          get: vi.fn(async () => failure),
        })}
      />,
    );
    await submit();
    await userEvent.click(
      await screen.findByRole("button", { name: /refresh status/i }),
    );
    await waitFor(() =>
      expect(screen.getByText(/could not read the inspection/i)).toBeDefined(),
    );
  });
});

describe("one submission at a time", () => {
  it("does not start a second inspection while the first is in flight", async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const connect = vi.fn(async () => {
      await gate;
      return {
        ok: true as const,
        value: { ...base, phase: "resolving" as const },
      };
    });
    render(<InspectionSurface api={api({ connect })} />);

    await userEvent.type(screen.getByRole("textbox"), "https://github.com/a/b");
    const button = screen.getByRole("button", { name: /connect repository/i });
    await userEvent.click(button);
    await userEvent.click(button);
    await act(async () => {
      release?.();
      await gate;
    });

    // Two inspections against a Runtime with a single-in-flight guard is the
    // failure this prevents; the second would surface as a URL refusal.
    expect(connect).toHaveBeenCalledTimes(1);
  });
});

describe("AC-0128 a second refusal is announced", () => {
  it("announces again when a different URL is refused on the same state", async () => {
    // Both refusals land on `url-rejected`, so comparing state alone made the
    // second "no change": the reason under the field swapped silently and a
    // polite region does not re-read text that changed beneath it.
    const reasons = [
      "Studio connects to public github.com repositories only",
      "Remove the username or token from the URL — Studio never uses credentials",
    ];
    let call = 0;
    render(
      <InspectionSurface
        api={api({
          connect: vi.fn(async () => ({
            ok: true as const,
            value: {
              ...base,
              phase: "url-rejected" as const,
              diagnostics: reasons[call++] as string,
            },
          })),
        })}
      />,
    );

    await submit("https://example.com/a/b");
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe(
        "That URL cannot be used",
      ),
    );
    // Clear the region so a second announcement is distinguishable from the
    // first still being present.
    await submit("https://user:token@github.com/a/b");
    await waitFor(() =>
      expect(screen.getByText(reasons[1] as string)).toBeDefined(),
    );
    expect(screen.getByRole("status").textContent).toBe(
      "That URL cannot be used",
    );
  });
});

describe("an in-flight inspection advances on its own", () => {
  it("re-reads without the lead pressing anything, and stops when it settles", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      let answer: Inspection = {
        ...base,
        phase: "inspecting",
        resolvedSha: "abc1234def",
      };
      const get = vi.fn(async () => ({ ok: true as const, value: answer }));
      render(
        <InspectionSurface
          api={api({
            connect: vi.fn(async () => ({
              ok: true as const,
              value: { ...base, phase: "resolving" as const },
            })),
            get,
          })}
        />,
      );
      await submit();
      await waitFor(() => expect(screen.getByRole("status")).toBeDefined());

      const before = get.mock.calls.length;
      await act(async () => {
        vi.advanceTimersByTime(POLL_INTERVAL_MS * 2);
      });
      // It advanced without a click. A lead who connected previously sat on
      // `resolving` until they pressed Refresh status.
      expect(get.mock.calls.length).toBeGreaterThan(before);

      // And it stops once nothing is in flight, rather than polling a settled
      // result forever.
      answer = { ...base, verdict: "agent-ready" };
      await act(async () => {
        vi.advanceTimersByTime(POLL_INTERVAL_MS * 2);
      });
      const settledAt = get.mock.calls.length;
      await act(async () => {
        vi.advanceTimersByTime(POLL_INTERVAL_MS * 4);
      });
      expect(get.mock.calls.length).toBe(settledAt);
    } finally {
      vi.useRealTimers();
    }
  });
});
