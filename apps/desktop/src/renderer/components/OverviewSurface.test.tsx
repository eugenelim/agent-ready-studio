// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ReviewSummary } from "../useReviews.js";
import { OverviewSurface } from "./OverviewSurface.js";

afterEach(cleanup);

// Every review in this slice sits on a product-intent artifact; what varies is
// which artifact, and several reviews share one.
const summary = (
  id: string,
  artifactId: string,
  status: ReviewSummary["status"],
  unresolvedQuestionCount = 0,
): ReviewSummary => ({
  id,
  workspaceId: "workspace-1",
  artifactId,
  revisionId: `revision-${id}`,
  artifactTitle: `Title ${id}`,
  artifactType: "product-intent",
  reason: "Product Intent needs a decision",
  producer: "strategy.frame-product-intent",
  status,
  createdAt: "2026-09-09T12:00:00.000Z",
  unresolvedQuestionCount,
});

function pairs(region: HTMLElement): [string, string][] {
  return [...region.querySelectorAll("dl > div")].map((row) => [
    row.querySelector("dt")?.textContent ?? "",
    row.querySelector("dd")?.textContent ?? "",
  ]);
}

describe("OverviewSurface", () => {
  it("AC-51 states emptiness only when the workspace has no work", () => {
    // The pair is the point. Asserting the empty state alone cannot tell a
    // conditional apart from a constant that always says the same thing, which
    // is exactly what Overview rendered before it had content of its own.
    const { unmount } = render(
      <OverviewSurface
        state={{ kind: "ready", items: [] }}
        onRetry={() => undefined}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Overview is empty" }),
    ).toBeTruthy();
    unmount();

    render(
      <OverviewSurface
        state={{
          kind: "ready",
          items: [summary("a", "product-intent", "open")],
        }}
        onRetry={() => undefined}
      />,
    );
    expect(
      screen.queryByRole("heading", { name: "Overview is empty" }),
    ).toBeNull();
    expect(screen.getByRole("region", { name: "Overview" })).toBeTruthy();
  });

  it("AC-51 counts reviews as reviews and work items as distinct artifacts", () => {
    // The fixture is the shape the service actually emits. Reviews are opened in
    // exactly two places, both on a product-intent revision, and `executionStart`
    // reuses the workspace's one seed-keyed artifact — so several reviews share
    // an artifactId, and an `input-packet` review cannot exist. An earlier
    // fixture here invented four artifacts across two types, which is why the
    // surface could label review counts as work items unchallenged.
    render(
      <OverviewSurface
        state={{
          kind: "ready",
          items: [
            summary("a", "artifact-intent", "open", 2),
            summary("b", "artifact-intent", "resolved", 1),
            summary("c", "artifact-intent", "superseded"),
            summary("d", "artifact-second", "open", 3),
          ],
        }}
        onRetry={() => undefined}
      />,
    );

    const work = screen.getByRole("region", { name: "Work in this workspace" });
    // Two artifacts, four reviews. Counting rows would say four work items.
    expect(work.textContent).toContain("2 work items");
    expect(work.textContent).toContain("under 4 reviews");
    expect(work.textContent).toContain("2 awaiting a decision");

    // Each count is asserted beside its label. Asserting the labels alone would
    // let every number on the surface be replaced by a constant.
    const status = screen.getByRole("region", { name: "Reviews by status" });
    expect(pairs(status)).toEqual([
      ["Needs a decision", "2"],
      ["Decided", "1"],
      ["Superseded", "1"],
    ]);
    // Statuses with no rows are absent rather than shown as zero: a zero is a
    // claim about the workspace, and "Revision requested 0" reads as a measured
    // fact when it is really the absence of one.
    expect(within(status).queryByText("Revision requested")).toBeNull();

    const types = screen.getByRole("region", { name: "Work item types" });
    expect(pairs(types)).toEqual([["product-intent", "2"]]);

    const questions = screen.getByRole("region", {
      name: "Unresolved questions",
    });
    // 2 + 3 from the two open reviews; the resolved review's 1 is not counted,
    // because the number is scoped to work awaiting a decision.
    expect(questions.textContent).toContain(
      "5 unresolved on work awaiting a decision",
    );
  });

  it("AC-51 says so when there is work but nothing is awaiting a decision", () => {
    render(
      <OverviewSurface
        state={{
          kind: "ready",
          items: [summary("a", "artifact-intent", "resolved")],
        }}
        onRetry={() => undefined}
      />,
    );

    const work = screen.getByRole("region", { name: "Work in this workspace" });
    expect(work.textContent).toContain("1 work item");
    expect(work.textContent).toContain("none awaiting a decision");
    expect(
      screen.getByRole("region", { name: "Unresolved questions" }).textContent,
    ).toContain("No unresolved questions");
  });

  it("reports a failed load through the shared surface state, with a live retry", () => {
    // No AC label. AC-25 scopes its state list to Review Inbox and Work Item
    // Studio, and AC-48's retry clause is discharged where the retry re-issues a
    // request; both have their artifacts elsewhere. What is worth pinning here is
    // that Overview delegates to the shared state component and that its retry
    // is wired rather than decorative.
    const onRetry = vi.fn();
    render(
      <OverviewSurface
        state={{ kind: "timed-out", message: "Overview timed out" }}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByRole("heading", { name: "Timed out" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
