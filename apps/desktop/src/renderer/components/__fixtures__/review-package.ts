import type { ReviewPackage } from "../../useReview.js";

/**
 * A complete open Review Package.
 *
 * Shared rather than duplicated: the App-level tests need a `review.get` that
 * actually resolves — a never-resolving double leaves the Work Item Studio in
 * its loading state, where the controls those tests drive do not exist.
 */
export const timestamp = "2026-09-09T12:00:00.000Z";
export const acceptedContent: ReviewPackage["reviewedRevision"]["content"] = {
  title: "Review product intent",
  outcome: "Teams discuss proposed intent",
  opportunity: "Make decisions visible",
  targetUsers: ["Product lead"],
  assumptions: ["Teams need a shared review"],
  guardrails: ["Keep data local"],
  nonGoals: ["Automatic approval"],
  confidence: "medium",
  openQuestions: ["Who pilots first?"],
};
export const proposedContent: ReviewPackage["reviewedRevision"]["content"] = {
  ...acceptedContent,
  outcome: "Teams approve explicit, reviewable intent",
  targetUsers: ["Product lead", "Designer"],
};
export const acceptedRevision: ReviewPackage["reviewedRevision"] = {
  id: "accepted-revision-1",
  artifactId: "artifact-1",
  schemaVersion: "1",
  content: acceptedContent,
  producer: "human",
  transformationId: null,
  inputRevisionIds: ["input-revision-1", "input-revision-2"],
  status: "accepted",
  createdAt: timestamp,
};
export const proposedRevision: ReviewPackage["reviewedRevision"] = {
  ...acceptedRevision,
  id: "proposal-revision-2",
  content: proposedContent,
  producer: "deterministic",
  transformationId: "strategy.frame-product-intent",
  status: "proposed",
};
export const packageWithBaseline: ReviewPackage = {
  review: {
    id: "review-1",
    workspaceId: "workspace-1",
    artifactId: "artifact-1",
    revisionId: "proposal-revision-2",
    artifactTitle: "Product Intent",
    artifactType: "product-intent",
    reason: "Review requested",
    producer: "deterministic",
    status: "open",
    createdAt: timestamp,
    unresolvedQuestionCount: 1,
  },
  workspace: {
    id: "workspace-1",
    name: "Product team",
    blueprintId: "product-development",
    blueprintVersion: "1",
    installedCapabilityPacks: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  initiativeTitle: "Build Agent-Ready Studio",
  artifactTitle: "Product Intent",
  artifactType: "product-intent",
  reviewedRevision: proposedRevision,
  acceptedRevision,
  inputs: [
    {
      id: "input-revision-1",
      artifactId: "input-1",
      artifactType: "input-packet",
      schemaVersion: "1",
      content: {
        objective: "Frame a reviewable product intent",
        sourceNotes: "Interview notes from the product team",
        targetUsers: ["Product lead", "Designer"],
        knownContext: ["Local-first desktop app"],
        constraints: ["No cloud dependency"],
        nonGoals: ["Replace source control"],
        expectedOutputArtifactType: "product-intent",
      },
      createdAt: timestamp,
    },
    {
      id: "input-revision-2",
      artifactId: "input-2",
      artifactType: "input-packet",
      schemaVersion: "1",
      content: {
        objective: "Preserve decision lineage",
        sourceNotes: "Architecture constraints",
        targetUsers: ["Product lead"],
        knownContext: [],
        constraints: ["Use the narrow preload API"],
        nonGoals: [],
        expectedOutputArtifactType: "product-intent",
      },
      createdAt: timestamp,
    },
  ],
  evidence: [
    {
      id: "evidence-1",
      kind: "evidence-for",
      sourceRevisionId: "input-revision-1",
      targetRevisionId: "proposal-revision-2",
      label: "Product interview evidence",
    },
  ],
  comments: [],
  decisions: [],
  changedFields: ["outcome", "targetUsers"],
  execution: {
    id: "execution-1",
    executorKind: "deterministic",
    status: "completed",
    startedAt: timestamp,
    completedAt: timestamp,
    inputRevisionIds: ["input-revision-1", "input-revision-2"],
    outputRevisionId: "proposal-revision-2",
    events: [
      {
        sequence: 1,
        kind: "completed",
        message: "Product Intent proposed",
        occurredAt: timestamp,
      },
    ],
  },
};
