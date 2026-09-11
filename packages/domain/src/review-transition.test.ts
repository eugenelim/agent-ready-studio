import { describe, expect, it } from "vitest";

import type { ReviewResolutionState } from "./review-transition.js";
import { resolveReview } from "./review-transition.js";

const content = {
  title: "Title",
  outcome: "Outcome",
  opportunity: "Opportunity",
  targetUsers: ["User"],
  assumptions: [],
  guardrails: [],
  nonGoals: [],
  confidence: "medium" as const,
  openQuestions: [],
};
const revision = {
  id: "revision-current",
  artifactId: "artifact-1",
  schemaVersion: "1",
  content,
  producer: "deterministic",
  transformationId: "strategy.frame-product-intent",
  inputRevisionIds: ["input-1"],
  status: "proposed" as const,
  createdAt: "2026-09-09T12:00:00.000Z",
};
const state = (): ReviewResolutionState => ({
  artifact: { id: "artifact-1", acceptedRevisionId: null },
  review: { id: "review-1", revisionId: revision.id, status: "open" },
  revisions: [revision],
  decisions: [],
  lifecycle: [],
});
const actor = { id: "actor-1", name: "Local human", kind: "human" as const };

describe("resolveReview", () => {
  it("AC-13 refuses a stale target revision without changing state", () => {
    const current = state();
    expect(
      resolveReview(current, {
        reviewId: "review-1",
        revisionId: "revision-stale",
        action: "approve",
        actor,
        now: "2026-09-09T12:00:00.000Z",
      }),
    ).toEqual({ ok: false, code: "stale-review", state: current });
  });

  // Both clauses of the guard, each with a case that reaches only it.
  // "supervisor" is not an actor kind at all, so it exercises the schema check;
  // the other three are known kinds that are simply not human. Without the
  // unknown case the schema clause could be deleted with the suite green.
  it.each([
    "agent",
    "deterministic",
    "external",
    "supervisor",
  ] as const)("refuses a %s actor, so the human-decision rule survives a second caller", (kind) => {
    const current = state();
    expect(
      resolveReview(current, {
        reviewId: "review-1",
        revisionId: revision.id,
        action: "approve",
        actor: { id: "actor-2", name: "Fake executor", kind: kind as "agent" },
        now: "2026-09-09T12:00:00.000Z",
      }),
    ).toEqual({ ok: false, code: "invalid-actor", state: current });
  });

  it("AC-17 approves atomically with an attributable decision and accepted lifecycle", () => {
    const approvingState = {
      ...state(),
      artifact: { id: "artifact-1", acceptedRevisionId: "revision-prior" },
      revisions: [
        { ...revision, id: "revision-prior", status: "accepted" as const },
        revision,
      ],
    };
    const result = resolveReview(approvingState, {
      reviewId: "review-1",
      revisionId: revision.id,
      action: "approve",
      actor,
      now: "2026-09-09T12:00:00.000Z",
      decisionId: "decision-1",
    });
    expect(result).toMatchObject({
      ok: true,
      state: {
        artifact: { acceptedRevisionId: revision.id },
        review: { status: "resolved" },
        decisions: [{ id: "decision-1", actor, action: "approve" }],
        lifecycle: [
          { revisionId: "revision-prior", status: "superseded" },
          { revisionId: revision.id, status: "accepted" },
        ],
      },
    });
  });

  it("AC-13 and AC-18 refuse duplicate decisions and blank revision comments without changing state", () => {
    const duplicate = {
      ...state(),
      decisions: [
        {
          id: "decision-0",
          reviewId: "review-1",
          revisionId: revision.id,
          actor,
          action: "approve" as const,
          comment: null,
          createdAt: "2026-09-09T12:00:00.000Z",
        },
      ],
    };
    expect(
      resolveReview(duplicate, {
        reviewId: "review-1",
        revisionId: revision.id,
        action: "approve",
        actor,
        now: "2026-09-09T12:00:00.000Z",
      }),
    ).toEqual({ ok: false, code: "conflict", state: duplicate });
    const current = state();
    expect(
      resolveReview(current, {
        reviewId: "review-1",
        revisionId: revision.id,
        action: "request-revision",
        actor,
        comment: "   ",
        now: "2026-09-09T12:00:00.000Z",
      }),
    ).toEqual({ ok: false, code: "invalid-comment", state: current });
  });

  it("AC-31 records a valid revision request without accepting the proposal", () => {
    const result = resolveReview(state(), {
      reviewId: "review-1",
      revisionId: revision.id,
      action: "request-revision",
      actor,
      comment: "Clarify scope",
      now: "2026-09-09T12:00:00.000Z",
    });
    expect(result).toMatchObject({
      ok: true,
      state: {
        artifact: { acceptedRevisionId: null },
        review: { status: "revision-needed" },
        decisions: [
          { action: "request-revision", comment: "Clarify scope", actor },
        ],
      },
    });
  });
});
