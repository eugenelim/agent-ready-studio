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
import { ReviewsList } from "./ReviewsList.js";

afterEach(cleanup);

const base = {
  workspaceId: "workspace-1",
  artifactId: "artifact-1",
  revisionId: "revision-1",
  artifactTitle: "Build Agent-Ready Studio",
  artifactType: "product-intent",
  reason: "Product Intent needs a decision",
  producer: "strategy.frame-product-intent",
  createdAt: "2026-09-09T12:00:00.000Z",
  unresolvedQuestionCount: 2,
} satisfies Omit<ReviewSummary, "id" | "status">;

const items: ReviewSummary[] = [
  { ...base, id: "review-open", status: "open" },
  { ...base, id: "review-revision", status: "revision-needed" },
  { ...base, id: "review-resolved", status: "resolved" },
];

describe("ReviewsList", () => {
  it("AC-50 groups every review by lifecycle status and states empty groups", () => {
    render(
      <ReviewsList
        state={{ kind: "ready", items }}
        onOpenReview={() => undefined}
        onRetry={() => undefined}
      />,
    );

    const list = screen.getByRole("region", { name: "All reviews" });
    expect(within(list).getAllByRole("region")).toHaveLength(4);
    for (const label of ["Open", "Revision needed", "Resolved", "Superseded"])
      expect(screen.getByRole("heading", { name: label })).toBeTruthy();

    // Superseded has no reviews here. It is stated rather than omitted, so the
    // reader can tell "none" from "not shown".
    const superseded = screen.getByRole("region", { name: "Superseded" });
    expect(
      within(superseded).getByText("No reviews in this group."),
    ).toBeTruthy();
    expect(
      within(screen.getByRole("region", { name: "Open" })).getAllByRole(
        "article",
      ),
    ).toHaveLength(1);
  });

  it("AC-50 shows the fields a reviewer chooses on, and opens the review", () => {
    const onOpenReview = vi.fn();
    render(
      <ReviewsList
        state={{ kind: "ready", items: [items[0] as ReviewSummary] }}
        onOpenReview={onOpenReview}
        onRetry={() => undefined}
      />,
    );

    const card = screen.getByRole("article");
    expect(within(card).getByText("Build Agent-Ready Studio")).toBeTruthy();
    expect(within(card).getByText("product-intent")).toBeTruthy();
    expect(
      within(card).getByText("Product Intent needs a decision"),
    ).toBeTruthy();
    expect(
      within(card).getByText("strategy.frame-product-intent"),
    ).toBeTruthy();
    expect(within(card).getByText("2")).toBeTruthy();
    expect(within(card).getByText("2026-09-09T12:00:00.000Z")).toBeTruthy();

    fireEvent.click(within(card).getByRole("button", { name: "Open review" }));
    expect(onOpenReview).toHaveBeenCalledWith("review-open");
  });

  it.each([
    ["loading", "Loading"],
    ["no-work", "No work"],
    ["retrying", "Retrying"],
  ] as const)("renders the %s state as %s", (kind, label) => {
    render(
      <ReviewsList
        state={{ kind }}
        onOpenReview={() => undefined}
        onRetry={() => undefined}
      />,
    );
    expect(screen.getByRole("heading", { name: label })).toBeTruthy();
  });

  it("AC-50 offers retry on a failed load", () => {
    const onRetry = vi.fn();
    render(
      <ReviewsList
        state={{ kind: "service-disconnected", message: "Service unavailable" }}
        onOpenReview={() => undefined}
        onRetry={onRetry}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
