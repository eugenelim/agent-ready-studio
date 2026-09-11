import { describe, expect, it } from "vitest";

import { actorKindSchema, productIntentSchema } from "./model.js";
import {
  createProposal,
  type ProposalState,
  reviseArtifact,
} from "./review-transition.js";

const content = {
  title: "Title",
  outcome: "Outcome",
  opportunity: "Opportunity",
  targetUsers: ["User"],
  assumptions: [],
  guardrails: [],
  nonGoals: [],
  confidence: "medium",
  openQuestions: [],
};
const existing = {
  id: "revision-1",
  artifactId: "artifact-1",
  schemaVersion: "1",
  content: { ...content, confidence: "high" as const },
  producer: "human",
  transformationId: null,
  inputRevisionIds: ["input-1"],
  status: "accepted" as const,
  createdAt: "2026-09-09T12:00:00.000Z",
};
const state = (): ProposalState => ({
  artifact: { id: "artifact-1", acceptedRevisionId: existing.id },
  knownInputRevisionIds: ["input-1"],
  revisions: [existing],
  relations: [],
  review: null,
  lifecycle: [],
});

describe("proposal transitions", () => {
  it("AC-09 and AC-12 require every Product Intent field and admit the human executor kind", () => {
    for (const field of [
      "title",
      "outcome",
      "opportunity",
      "targetUsers",
      "assumptions",
      "guardrails",
      "nonGoals",
      "confidence",
      "openQuestions",
    ]) {
      const missing: Record<string, unknown> = { ...content };
      delete missing[field];
      expect(productIntentSchema.safeParse(missing).success).toBe(false);
    }
    expect(actorKindSchema.safeParse("human").success).toBe(true);
  });

  it("AC-10 creates an immutable proposed revision with exact unique lineage", () => {
    const result = createProposal(state(), {
      revisionId: "revision-2",
      content,
      producer: "deterministic",
      transformationId: "strategy.frame-product-intent",
      inputRevisionIds: ["input-1"],
      now: "2026-09-09T12:00:00.000Z",
    });
    expect(result).toMatchObject({
      ok: true,
      state: {
        artifact: { acceptedRevisionId: existing.id },
        revisions: [
          existing,
          {
            id: "revision-2",
            schemaVersion: "1",
            producer: "deterministic",
            transformationId: "strategy.frame-product-intent",
            inputRevisionIds: ["input-1"],
            status: "proposed",
          },
        ],
        relations: [
          {
            sourceRevisionId: "input-1",
            targetRevisionId: "revision-2",
            kind: "input-to",
          },
        ],
        lifecycle: [{ revisionId: "revision-2", status: "proposed" }],
      },
    });
  });

  it("AC-11 refuses missing, duplicate, or mismatched execution inputs without changing state", () => {
    const current = state();
    expect(
      createProposal(current, {
        revisionId: "revision-2",
        content,
        producer: "deterministic",
        transformationId: "strategy.frame-product-intent",
        inputRevisionIds: ["missing"],
        now: "2026-09-09T12:00:00.000Z",
      }),
    ).toEqual({ ok: false, code: "invalid-input", state: current });
    expect(
      createProposal(current, {
        revisionId: "revision-2",
        content,
        producer: "deterministic",
        transformationId: "strategy.frame-product-intent",
        inputRevisionIds: ["input-1", "input-1"],
        now: "2026-09-09T12:00:00.000Z",
      }),
    ).toEqual({ ok: false, code: "invalid-input", state: current });
  });

  it("AC-30 revises an accepted base without superseding its accepted lifecycle", () => {
    const result = reviseArtifact(state(), {
      revisionId: "revision-2",
      baseRevisionId: existing.id,
      content,
      actor: { id: "actor-1", name: "Local human", kind: "human" },
      now: "2026-09-09T12:00:00.000Z",
      reviewId: "review-2",
    });
    expect(result).toMatchObject({
      ok: true,
      state: {
        artifact: { acceptedRevisionId: existing.id },
        review: { revisionId: "revision-2", status: "open" },
        revisions: [
          existing,
          {
            id: "revision-2",
            status: "proposed",
            inputRevisionIds: [existing.id],
          },
        ],
        lifecycle: [{ revisionId: "revision-2", status: "proposed" }],
      },
    });
    const current = state();
    expect(
      reviseArtifact(current, {
        revisionId: "revision-2",
        baseRevisionId: "missing",
        content,
        actor: { id: "actor-1", name: "Local human", kind: "human" },
        now: "2026-09-09T12:00:00.000Z",
        reviewId: "review-2",
      }),
    ).toEqual({ ok: false, code: "stale-base", state: current });
  });

  it("AC-30 supersedes an outstanding proposal when a human revision replaces it", () => {
    const current: ProposalState = {
      ...state(),
      artifact: { id: "artifact-1", acceptedRevisionId: null },
      revisions: [{ ...existing, status: "proposed" }],
      review: {
        id: "review-1",
        revisionId: existing.id,
        status: "open",
      },
    };
    expect(
      reviseArtifact(current, {
        revisionId: "revision-2",
        baseRevisionId: existing.id,
        content,
        actor: { id: "actor-1", name: "Local human", kind: "human" },
        now: "2026-09-09T12:00:00.000Z",
        reviewId: "review-2",
      }),
    ).toMatchObject({
      ok: true,
      state: {
        lifecycle: [
          { revisionId: existing.id, status: "superseded" },
          { revisionId: "revision-2", status: "proposed" },
        ],
      },
    });
  });
});
