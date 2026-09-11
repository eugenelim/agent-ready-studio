// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HomeResult, InboxState } from "../useStudio.js";
import { ReviewInbox } from "./ReviewInbox.js";

afterEach(cleanup);

const baseItem = {
  id: "review-1",
  workspaceId: "workspace-1",
  workspaceName: "Product team",
  initiativeTitle: "Build Agent-Ready Studio",
  title: "Product Intent",
  artifactType: "product-intent",
  reason: "A product decision needs review",
  producer: "deterministic-executor",
  transformationId: "strategy.frame-product-intent",
  createdAt: "2026-09-09T12:00:00.000Z",
  unresolvedQuestionCount: 3,
} as const;

const populatedHome: HomeResult = {
  kind: "home",
  needsDecision: [{ ...baseItem, kind: "review", status: "decision-needed" }],
  blocked: [
    {
      ...baseItem,
      id: "review-2",
      kind: "review",
      status: "revision-needed",
    },
  ],
  recentlyCompleted: [
    {
      ...baseItem,
      id: "review-3",
      kind: "review",
      status: "completed",
    },
  ],
};

describe("ReviewInbox", () => {
  it("AC-14 renders every inbox group", () => {
    render(
      <ReviewInbox
        state={{ kind: "ready", home: populatedHome }}
        onRetry={() => undefined}
      />,
    );

    const inbox = screen.getByRole("region", { name: "Review inbox" });
    // Three groups, not four: this slice's execution is atomic, so nothing is
    // ever observable mid-flight and Home has no Running group.
    expect(within(inbox).getAllByRole("region")).toHaveLength(3);
    expect(
      screen.getByRole("heading", { name: "Needs your decision" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Blocked or revision requested" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Recently completed" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Running" })).toBeNull();
  });

  it("AC-14 renders every required field for each Home item", () => {
    render(
      <ReviewInbox
        state={{ kind: "ready", home: populatedHome }}
        onRetry={() => undefined}
      />,
    );

    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      const text = card.textContent ?? "";
      expect(text).toContain("Product team");
      expect(text).toContain("Build Agent-Ready Studio");
      expect(text).toContain("Product Intent");
      expect(text).toContain("product-intent");
      expect(text).toContain("A product decision needs review");
      expect(text).toContain("deterministic-executor");
      expect(text).toContain("strategy.frame-product-intent");
      expect(text).toContain("Status");
      expect(text).toContain("2026-09-09T12:00:00.000Z");
      expect(text).toContain("Unresolved questions");
      expect(text).toContain("3");
    }
  });

  it("AC-14 renders explicit fallbacks when initiative and transformation are absent", () => {
    const home: HomeResult = {
      kind: "home",
      needsDecision: [],
      blocked: [
        {
          ...baseItem,
          id: "review-without-context",
          initiativeTitle: null,
          kind: "review",
          status: "revision-needed",
          transformationId: null,
        },
      ],
      recentlyCompleted: [],
    };
    render(
      <ReviewInbox state={{ kind: "ready", home }} onRetry={() => undefined} />,
    );

    expect(screen.getByText("No initiative")).toBeTruthy();
    expect(screen.getByText("No transformation")).toBeTruthy();
  });

  const labeledStates = [
    [{ kind: "loading" }, "Loading"],
    [{ kind: "no-work" }, "No work"],
    [
      { kind: "execution-failed", message: "Execution stopped" },
      "Execution failed",
    ],
    [
      { kind: "service-disconnected", message: "Service unavailable" },
      "Service disconnected",
    ],
    [
      { kind: "protocol-incompatible", message: "Upgrade required" },
      "Protocol incompatible",
    ],
    [{ kind: "retrying" }, "Retrying"],
    [{ kind: "timed-out", message: "Request expired" }, "Timed out"],
  ] as const satisfies ReadonlyArray<readonly [InboxState, string]>;

  it.each(labeledStates)("AC-25 renders the %s state as %s", (state, label) => {
    render(<ReviewInbox state={state} onRetry={() => undefined} />);

    expect(screen.getByRole("heading", { name: label })).toBeTruthy();
  });

  it("AC-48 offers retry after a timeout", () => {
    const retry = vi.fn();
    render(
      <ReviewInbox
        state={{ kind: "timed-out", message: "Request expired" }}
        onRetry={retry}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
