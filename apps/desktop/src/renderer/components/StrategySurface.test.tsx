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
import { StrategySurface } from "./StrategySurface.js";

afterEach(cleanup);

const summary = (
  id: string,
  artifactType: string,
  status: ReviewSummary["status"],
): ReviewSummary => ({
  id,
  workspaceId: "workspace-1",
  artifactId: `artifact-${id}`,
  revisionId: `revision-${id}`,
  artifactTitle: `Title ${id}`,
  artifactType,
  reason: "Product Intent needs a decision",
  producer: "strategy.frame-product-intent",
  status,
  createdAt: "2026-09-09T12:00:00.000Z",
  unresolvedQuestionCount: 0,
});

describe("StrategySurface", () => {
  it("AC-51 lists the workspace's Product Intent work and opens the studio", () => {
    const onOpenReview = vi.fn();
    render(
      <StrategySurface
        state={{
          kind: "ready",
          items: [
            summary("intent-1", "product-intent", "open"),
            summary("intent-2", "product-intent", "resolved"),
          ],
        }}
        onOpenReview={onOpenReview}
        onRetry={() => undefined}
      />,
    );

    const list = screen.getByRole("region", { name: "Strategy" });
    const cards = within(list).getAllByRole("article");
    expect(cards).toHaveLength(2);
    expect(within(list).getByText("Needs a decision")).toBeTruthy();
    expect(within(list).getByText("Decided")).toBeTruthy();

    const first = cards[0];
    if (!first) throw new Error("Expected a Product Intent card");
    fireEvent.click(within(first).getByRole("button", { name: "Open review" }));
    expect(onOpenReview).toHaveBeenCalledWith("intent-1");
  });

  it("AC-51 labels every review status the contract admits", () => {
    // All four, not just the two the happy path produces: an unlabelled status
    // would render a raw contract identifier at the user.
    render(
      <StrategySurface
        state={{
          kind: "ready",
          items: [
            summary("a", "product-intent", "open"),
            summary("b", "product-intent", "revision-needed"),
            summary("c", "product-intent", "resolved"),
            summary("d", "product-intent", "superseded"),
          ],
        }}
        onOpenReview={() => undefined}
        onRetry={() => undefined}
      />,
    );

    for (const label of [
      "Needs a decision",
      "Revision requested",
      "Decided",
      "Superseded",
    ])
      expect(screen.getByText(label)).toBeTruthy();
  });

  it("AC-51 says it is empty only when there is no Product Intent", () => {
    // A flat empty state would match the other module surfaces and be false the
    // moment the demo is seeded, so emptiness has to be conditional on the data.
    const { rerender } = render(
      <StrategySurface
        state={{ kind: "ready", items: [] }}
        onOpenReview={() => undefined}
        onRetry={() => undefined}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Strategy is empty" }),
    ).toBeTruthy();

    rerender(
      <StrategySurface
        state={{
          kind: "ready",
          items: [summary("intent-1", "product-intent", "open")],
        }}
        onOpenReview={() => undefined}
        onRetry={() => undefined}
      />,
    );
    expect(
      screen.queryByRole("heading", { name: "Strategy is empty" }),
    ).toBeNull();
  });

  it("AC-51 ignores work that is not a Product Intent", () => {
    render(
      <StrategySurface
        state={{
          kind: "ready",
          items: [summary("packet-1", "input-packet", "open")],
        }}
        onOpenReview={() => undefined}
        onRetry={() => undefined}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Strategy is empty" }),
    ).toBeTruthy();
  });

  it("reports a failed load with the shared surface state", () => {
    const onRetry = vi.fn();
    render(
      <StrategySurface
        state={{ kind: "service-disconnected", message: "Service unavailable" }}
        onOpenReview={() => undefined}
        onRetry={onRetry}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Service disconnected" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
