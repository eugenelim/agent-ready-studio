// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { VerdictSurface } from "./VerdictSurface.js";

afterEach(cleanup);

const defaults = {
  versionUnverified: false,
  owner: "acme",
  repository: "widgets",
  resolvedSha: "abc1234def5678",
  diagnostics: "",
} as const;

describe("AC-0114 the composition rule assigns the roles", () => {
  it("gives the verdict the primary role and the condition the secondary one", () => {
    render(
      <VerdictSurface
        {...defaults}
        verdict="agent-ready"
        condition="malformed"
      />,
    );
    const verdict = document.querySelector('[data-verdict="agent-ready"]');
    expect(verdict?.className).toContain("inspection-verdict--primary");
    const condition = document.querySelector('[data-state="malformed"]');
    expect(condition?.className).toContain("inspection-badge--secondary");
  });

  it("gives the condition the primary role when the verdict is no-verdict", () => {
    render(
      <VerdictSurface
        {...defaults}
        verdict="no-verdict"
        condition="inspector-unavailable"
      />,
    );
    const condition = document.querySelector(
      '[data-state="inspector-unavailable"]',
    );
    expect(condition?.className).toContain("inspection-badge--primary");
    // No verdict badge at all: an empty one would claim a result that was not
    // reached, and AC-0157 gives this verdict no label.
    expect(document.querySelector("[data-verdict]")).toBeNull();
  });

  it("renders the revision identity subordinate to the primary element", () => {
    render(
      <VerdictSurface {...defaults} verdict="agent-ready" condition={null} />,
    );
    expect(
      document.querySelector('[data-identity="repository"]')?.textContent,
    ).toBe("acme/widgets");
    expect(
      document.querySelector('[data-identity="resolved-sha"]')?.textContent,
    ).toBe("abc1234def5678");
  });
});

describe("AC-0119 a degraded condition never renders a generic success treatment", () => {
  it("keeps the verdict's own identity treatment at the subordinate role", () => {
    // The criterion says this explicitly: a verdict under a degraded condition
    // keeps its identity and does not violate the rule. Dropping to a neutral
    // treatment here would be a generic success treatment by omission.
    render(
      <VerdictSurface
        {...defaults}
        verdict="agent-ready"
        condition="malformed"
      />,
    );
    const verdict = document.querySelector('[data-verdict="agent-ready"]');
    expect(verdict).not.toBeNull();
    expect(verdict?.getAttribute("data-shape")).toBe("check-badge");
    expect(
      within(verdict as HTMLElement).getByText("Agent-Ready"),
    ).toBeDefined();
  });
});

describe("AC-0113 the cancelled state", () => {
  it("tells the lead they stopped it and how to restart", () => {
    // `cancelled` is not a degraded condition, so the projection's four
    // sentences do not apply to it and the badge alone would read "Cancelled"
    // with no author and no way forward.
    render(
      <VerdictSurface
        {...defaults}
        verdict="no-verdict"
        condition="cancelled"
      />,
    );
    const detail = document.querySelector('[data-state-detail="cancelled"]');
    expect(detail).not.toBeNull();
    // They stopped it -- attribution to the lead, not to Studio or the network.
    expect(detail?.textContent).toMatch(/you stopped this inspection/i);
    // And how to start again, naming the control that does it.
    expect(detail?.textContent).toMatch(/connect repository/i);
  });
});

describe("AC-0115 and AC-0116 non-originated values", () => {
  const hostile = "<script>alert(1)</script>";

  it("renders every non-originated value as literal text", () => {
    render(
      <VerdictSurface
        {...defaults}
        owner={hostile}
        repository={hostile}
        resolvedSha={hostile}
        diagnostics={hostile}
        verdict="agent-ready"
        condition={null}
      />,
    );
    expect(document.querySelectorAll("script")).toHaveLength(0);
    expect(
      document.querySelector('[data-identity="repository"]')?.textContent,
    ).toContain(hostile);
    expect(
      document.querySelector('[data-diagnostics="raw"]')?.textContent,
    ).toBe(hostile);
  });

  it("puts no non-originated value into a URL or navigation sink", () => {
    render(
      <VerdictSurface
        {...defaults}
        owner="acme"
        repository="widgets"
        resolvedSha="abc1234def5678"
        verdict="agent-ready"
        condition={null}
      />,
    );
    // The prohibition is over the class of sink, so the assertion is over the
    // DOM rather than over the components that happen to exist today: no
    // anchor, no iframe, no element carrying a src or href at all.
    expect(document.querySelectorAll("a[href]")).toHaveLength(0);
    expect(document.querySelectorAll("[src]")).toHaveLength(0);
    expect(document.querySelectorAll("[href]")).toHaveLength(0);
    expect(
      document.querySelectorAll("iframe, embed, object, form[action]"),
    ).toHaveLength(0);
  });
});

describe("AC-0088, AC-0091, AC-0092, AC-0097 and AC-0099 reach the lead", () => {
  it("AC-0088 composes the stop reason with the state's label", () => {
    render(
      <VerdictSurface
        {...defaults}
        verdict="no-verdict"
        condition="inspection-stopped"
        stopReason="resolution-timeout"
      />,
    );
    // The label says what happened; the reason says why, composed into the
    // same label by `project`. Before the result carried the reason,
    // `inspection-stopped` rendered alone and the lead was told an inspection
    // stopped with no way to know which of thirteen causes fired.
    const badge = document.querySelector('[data-state="inspection-stopped"]');
    expect(badge?.textContent).toBe(
      "Inspection stopped: Finding the latest commit took too long",
    );
    // And the bare label alone is no longer what the surface shows.
    expect(screen.queryByText("Inspection stopped")).toBeNull();
  });

  it("AC-0091 and AC-0092 take attribution and retryability per reason", () => {
    // The same state, two reasons, two different answers. `project()` supplies
    // these only when a reason is passed, so dropping the reason silently made
    // both criteria unanswerable for this state -- and attributing a network
    // timeout to the repository is the crossing AC-0093 forbids.
    const attributionFor = (
      reason: "resolution-timeout" | "remote-ref-charset",
    ) => {
      const { unmount } = render(
        <VerdictSurface
          {...defaults}
          verdict="no-verdict"
          condition="inspection-stopped"
          stopReason={reason}
        />,
      );
      const value = document
        .querySelector("[data-attribution]")
        ?.getAttribute("data-attribution");
      unmount();
      return value;
    };
    expect(attributionFor("resolution-timeout")).toBe("network");
    expect(attributionFor("remote-ref-charset")).toBe("repository");
  });

  it("AC-0097 shows the wait window the transport reported", () => {
    render(
      <VerdictSurface
        {...defaults}
        verdict="no-verdict"
        condition="source-rate-limited"
        waitWindow="about 40 minutes"
      />,
    );
    expect(
      document.querySelector('[data-wait-window="true"]')?.textContent,
    ).toContain("about 40 minutes");
  });

  it("AC-0097 says so when the transport reported no wait window", () => {
    render(
      <VerdictSurface
        {...defaults}
        verdict="no-verdict"
        condition="source-rate-limited"
      />,
    );
    // Not silence: "Studio was not told" is a different fact from a known
    // window, and the lead can act on knowing which they have.
    expect(
      document.querySelector('[data-wait-window="true"]')?.textContent,
    ).toMatch(/not told/i);
  });

  it("AC-0099 puts the protocol identifier only on the secondary surface", () => {
    render(
      <VerdictSurface
        {...defaults}
        verdict="no-verdict"
        condition="inspection-stopped"
        stopReason="request-identifier-mismatch"
        secondaryDiagnostic="request smoke-0001 did not match"
        diagnostics=""
      />,
    );
    const secondary = document.querySelector('[data-diagnostics="secondary"]');
    expect(secondary?.textContent).toBe("request smoke-0001 did not match");
    // Collapsed, and absent from the copy above it.
    expect((document.querySelector("details") as HTMLDetailsElement).open).toBe(
      false,
    );
    expect(
      document.querySelector(".verdict-surface__detail")?.textContent ?? "",
    ).not.toContain("smoke-0001");
  });

  it("AC-0095 offers the lead actions on a result, not only before connecting", () => {
    render(
      <VerdictSurface
        {...defaults}
        verdict="no-verdict"
        condition="source-unavailable"
      />,
    );
    const actions = document.querySelector('[data-lead-actions="true"]');
    expect(actions).not.toBeNull();
    expect(actions?.querySelectorAll("li").length).toBeGreaterThan(0);
  });
});

describe("AC-0117 and AC-0118 secondary surfaces", () => {
  it("collapses raw child-process output by default", () => {
    render(
      <VerdictSurface
        {...defaults}
        diagnostics="git: fatal: repository not found"
        verdict="no-verdict"
        condition="source-unavailable"
      />,
    );
    const disclosure = document.querySelector("details");
    expect(disclosure).not.toBeNull();
    expect((disclosure as HTMLDetailsElement).open).toBe(false);
    expect(screen.getByText("Diagnostics")).toBeDefined();
  });

  it("AC-0118 renders no chart on any surface", () => {
    render(
      <VerdictSurface
        {...defaults}
        verdict="agent-ready"
        condition="malformed"
      />,
    );
    expect(
      document.querySelectorAll("canvas, svg[role='img'], [role='figure']"),
    ).toHaveLength(0);
  });
});

describe("AC-0127 heading structure", () => {
  it("exposes a semantic heading for the verdict surface", () => {
    render(
      <VerdictSurface {...defaults} verdict="agent-ready" condition={null} />,
    );
    expect(
      screen.getByRole("heading", { name: /inspection result/i }),
    ).toBeDefined();
  });
});

describe("the version qualifier composes rather than replaces", () => {
  it("renders alongside whatever verdict and condition were reached", () => {
    render(
      <VerdictSurface
        {...defaults}
        versionUnverified
        verdict="agent-ready"
        condition="malformed"
      />,
    );
    expect(
      document.querySelector('[data-qualifier="version-unverified"]')
        ?.textContent,
    ).toBe("Version Studio cannot confirm");
    expect(
      document.querySelector('[data-verdict="agent-ready"]'),
    ).not.toBeNull();
    expect(document.querySelector('[data-state="malformed"]')).not.toBeNull();
  });
});
