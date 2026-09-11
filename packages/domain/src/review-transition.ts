import {
  type Actor,
  type Artifact,
  type Decision,
  type LifecycleEntry,
  productIntentSchema,
  type Review,
  type Revision,
} from "./model.js";

export type ReviewResolutionState = {
  artifact: Artifact;
  review: Review;
  revisions: Revision[];
  decisions: Decision[];
  lifecycle: LifecycleEntry[];
};
export type ResolveReviewCommand = {
  reviewId: string;
  revisionId: string;
  action: "approve" | "request-revision";
  actor: Actor;
  comment?: string;
  now: string;
  decisionId?: string;
};
export type ResolveReviewResult =
  | { ok: true; state: ReviewResolutionState }
  | {
      ok: false;
      code: "stale-review" | "conflict" | "invalid-comment" | "invalid-actor";
      state: ReviewResolutionState;
    };

export function resolveReview(
  state: ReviewResolutionState,
  command: ResolveReviewCommand,
): ResolveReviewResult {
  if (
    state.review.id !== command.reviewId ||
    state.review.revisionId !== command.revisionId
  )
    return { ok: false, code: "stale-review", state };
  if (
    state.review.status !== "open" ||
    state.decisions.some((decision) => decision.reviewId === command.reviewId)
  )
    return { ok: false, code: "conflict", state };
  // One clause, because one is all that is reachable. An earlier version also
  // ran `actorKindSchema.safeParse` here and a comment claimed both halves
  // mattered; they do not — `!== "human"` already refuses every kind the schema
  // would reject and every known kind that is not human, so no input could reach
  // the transition and be caught by the schema check alone. It was unfailable
  // code justified by a comment.
  //
  // This transition is what discharges "never accept an executor-produced
  // proposal without an attributable human decision". The service resolves a
  // human actor before calling, but `resolveReview` is a public export and a
  // second caller is a real seam, so the rule named after the refusal owns it.
  if (command.actor.kind !== "human")
    return { ok: false, code: "invalid-actor", state };
  if (
    command.action === "request-revision" &&
    (!command.comment || !/\S/.test(command.comment))
  )
    return { ok: false, code: "invalid-comment", state };
  const reviewed = state.revisions.find(
    (revision) => revision.id === command.revisionId,
  );
  if (!reviewed || reviewed.status !== "proposed")
    return { ok: false, code: "stale-review", state };
  const decision: Decision = {
    id: command.decisionId ?? `decision-${state.decisions.length + 1}`,
    reviewId: command.reviewId,
    revisionId: command.revisionId,
    actor: command.actor,
    action: command.action,
    comment: command.comment ?? null,
    createdAt: command.now,
  };
  if (command.action === "request-revision")
    return {
      ok: true,
      state: {
        ...state,
        review: { ...state.review, status: "revision-needed" },
        decisions: [...state.decisions, decision],
      },
    };
  const lifecycle: LifecycleEntry[] = [...state.lifecycle];
  if (state.artifact.acceptedRevisionId)
    lifecycle.push({
      revisionId: state.artifact.acceptedRevisionId,
      status: "superseded",
      occurredAt: command.now,
    });
  lifecycle.push({
    revisionId: reviewed.id,
    status: "accepted",
    occurredAt: command.now,
  });
  return {
    ok: true,
    state: {
      ...state,
      artifact: { ...state.artifact, acceptedRevisionId: reviewed.id },
      review: { ...state.review, status: "resolved" },
      revisions: state.revisions.map((revision) =>
        revision.id === reviewed.id
          ? { ...revision, status: "accepted" }
          : revision,
      ),
      decisions: [...state.decisions, decision],
      lifecycle,
    },
  };
}

export type ProposalState = {
  artifact: Artifact;
  knownInputRevisionIds: string[];
  revisions: Revision[];
  relations: {
    sourceRevisionId: string;
    targetRevisionId: string;
    kind: "input-to" | "evidence-for" | "supersedes";
  }[];
  review: Review | null;
  lifecycle: LifecycleEntry[];
};
export function createProposal(
  state: ProposalState,
  input: {
    revisionId: string;
    content: unknown;
    producer: string;
    transformationId: string;
    inputRevisionIds: string[];
    now: string;
  },
):
  | { ok: true; state: ProposalState }
  | { ok: false; code: "invalid-input"; state: ProposalState } {
  if (
    !productIntentSchema.safeParse(input.content).success ||
    input.inputRevisionIds.length === 0 ||
    new Set(input.inputRevisionIds).size !== input.inputRevisionIds.length ||
    input.inputRevisionIds.some(
      (id) => !state.knownInputRevisionIds.includes(id),
    )
  )
    return { ok: false, code: "invalid-input", state };
  const revision: Revision = {
    id: input.revisionId,
    artifactId: state.artifact.id,
    schemaVersion: "1",
    content: input.content as Revision["content"],
    producer: input.producer,
    transformationId: input.transformationId,
    inputRevisionIds: [...input.inputRevisionIds],
    status: "proposed",
    createdAt: input.now,
  };
  return {
    ok: true,
    state: {
      ...state,
      revisions: [...state.revisions, revision],
      relations: [
        ...state.relations,
        ...input.inputRevisionIds.map((sourceRevisionId) => ({
          sourceRevisionId,
          targetRevisionId: revision.id,
          kind: "input-to" as const,
        })),
      ],
      lifecycle: [
        ...state.lifecycle,
        { revisionId: revision.id, status: "proposed", occurredAt: input.now },
      ],
    },
  };
}

export function reviseArtifact(
  state: ProposalState,
  input: {
    revisionId: string;
    baseRevisionId: string;
    content: unknown;
    actor: Actor;
    now: string;
    reviewId: string;
  },
):
  | { ok: true; state: ProposalState }
  | {
      ok: false;
      code: "stale-base" | "invalid-content";
      state: ProposalState;
    } {
  const base = state.revisions.find(
    (revision) => revision.id === input.baseRevisionId,
  );
  if (
    !base ||
    (state.artifact.acceptedRevisionId !== base.id &&
      state.review?.revisionId !== base.id)
  )
    return { ok: false, code: "stale-base", state };
  if (!productIntentSchema.safeParse(input.content).success)
    return { ok: false, code: "invalid-content", state };
  const revision: Revision = {
    ...base,
    id: input.revisionId,
    content: input.content as Revision["content"],
    producer: input.actor.id,
    transformationId: null,
    inputRevisionIds: [base.id],
    status: "proposed",
    createdAt: input.now,
  };
  const supersedesOutstandingProposal =
    state.review?.revisionId === base.id &&
    (state.review.status === "open" ||
      state.review.status === "revision-needed");
  return {
    ok: true,
    state: {
      ...state,
      revisions: [...state.revisions, revision],
      review: { id: input.reviewId, revisionId: revision.id, status: "open" },
      relations: [
        ...state.relations,
        {
          sourceRevisionId: base.id,
          targetRevisionId: revision.id,
          kind: "input-to",
        },
      ],
      lifecycle: [
        ...state.lifecycle,
        ...(supersedesOutstandingProposal
          ? [
              {
                revisionId: base.id,
                status: "superseded" as const,
                occurredAt: input.now,
              },
            ]
          : []),
        { revisionId: revision.id, status: "proposed", occurredAt: input.now },
      ],
    },
  };
}
