import { protocolVersion, type StudioMethod } from "./validator.js";

const timestamp = "2026-09-09T12:00:00.000Z";

/** A Home item in the shape the projection produces: always a review. */
const homeItem = (
  id: string,
  status: "decision-needed" | "revision-needed" | "completed",
) => ({
  kind: "review" as const,
  id,
  workspaceId: "workspace-1",
  workspaceName: "Product team",
  initiativeTitle: "Build Agent-Ready Studio",
  title: "Product Intent",
  artifactType: "product-intent",
  reason:
    status === "decision-needed"
      ? "Review requested"
      : status === "revision-needed"
        ? "Revision requested"
        : "Decision completed",
  producer: "strategy.frame-product-intent",
  transformationId: "strategy.frame-product-intent",
  status,
  createdAt: timestamp,
  unresolvedQuestionCount: 0,
});
const productIntent = {
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
const workspace = {
  id: "workspace-1",
  name: "Workspace",
  blueprintId: "product-development",
  blueprintVersion: "1",
  installedCapabilityPacks: [],
  createdAt: timestamp,
  updatedAt: timestamp,
};
const reviewSummary = {
  id: "review-1",
  workspaceId: "workspace-1",
  artifactId: "artifact-1",
  revisionId: "revision-2",
  artifactTitle: "Intent",
  artifactType: "product-intent",
  reason: "Review requested",
  producer: "deterministic",
  status: "open",
  createdAt: timestamp,
  unresolvedQuestionCount: 0,
};
const productIntentRevision = {
  id: "revision-2",
  artifactId: "artifact-1",
  schemaVersion: "1",
  content: productIntent,
  producer: "deterministic",
  transformationId: "strategy.frame-product-intent",
  inputRevisionIds: ["revision-1"],
  status: "proposed",
  createdAt: timestamp,
};
const inputPacketRevision = {
  id: "revision-1",
  artifactId: "input-packet-1",
  artifactType: "input-packet",
  schemaVersion: "1",
  content: {
    objective: "Frame the intent",
    sourceNotes: "Fixture",
    targetUsers: ["Product team"],
    knownContext: [],
    constraints: [],
    nonGoals: [],
    expectedOutputArtifactType: "product-intent",
  },
  createdAt: timestamp,
};

export const validRequestFixtures: Record<StudioMethod, unknown> = {
  "system.hello": {
    jsonrpc: "2.0",
    id: "1",
    method: "system.hello",
    params: { protocolVersion, client: "desktop" },
  },
  "health.get": { jsonrpc: "2.0", id: "2", method: "health.get", params: {} },
  "blueprint.list": {
    jsonrpc: "2.0",
    id: "3",
    method: "blueprint.list",
    params: {},
  },
  "workspace.create": {
    jsonrpc: "2.0",
    id: "4",
    method: "workspace.create",
    params: {
      name: "Workspace",
      blueprintId: "product-development",
      blueprintVersion: "1",
    },
  },
  "workspace.list": {
    jsonrpc: "2.0",
    id: "5",
    method: "workspace.list",
    params: {},
  },
  "workspace.get": {
    jsonrpc: "2.0",
    id: "6",
    method: "workspace.get",
    params: { id: "workspace-1" },
  },
  "home.get": { jsonrpc: "2.0", id: "7", method: "home.get", params: {} },
  "demo.seed": {
    jsonrpc: "2.0",
    id: "8",
    method: "demo.seed",
    params: { workspaceId: "workspace-1" },
  },
  "execution.start": {
    jsonrpc: "2.0",
    id: "9",
    method: "execution.start",
    params: {
      workspaceId: "workspace-1",
      transformationId: "strategy.frame-product-intent",
      inputRevisionIds: ["revision-1"],
      executorKind: "deterministic",
    },
  },
  "review.list": {
    jsonrpc: "2.0",
    id: "10",
    method: "review.list",
    params: {},
  },
  "review.get": {
    jsonrpc: "2.0",
    id: "11",
    method: "review.get",
    params: { id: "review-1" },
  },
  "artifact.revise": {
    jsonrpc: "2.0",
    id: "12",
    method: "artifact.revise",
    params: {
      artifactId: "artifact-1",
      baseRevisionId: "revision-1",
      content: productIntent,
    },
  },
  "review.resolve": {
    jsonrpc: "2.0",
    id: "13",
    method: "review.resolve",
    params: { reviewId: "review-1", action: "approve" },
  },
  "source.connect": {
    jsonrpc: "2.0",
    id: "14",
    method: "source.connect",
    params: { url: "https://github.com/owner/repository" },
  },
  "source.get": {
    jsonrpc: "2.0",
    id: "15",
    method: "source.get",
    params: { sourceId: "source-1" },
  },
  "source.cancel": {
    jsonrpc: "2.0",
    id: "16",
    method: "source.cancel",
    params: { sourceId: "source-1" },
  },
};

const sourceInspection = {
  kind: "source-inspection",
  sourceId: "source-1",
  phase: null,
  verdict: "agent-ready",
  condition: "ok",
  versionUnverified: false,
  owner: "owner",
  repository: "repository",
  requestedRef: null,
  resolvedSha: "a".repeat(40),
  inspectedAt: timestamp,
  declaredVersionMarker: null,
  inspectorContractVersion: "1",
  diagnostics: "",
  stopReason: null,
  waitWindow: null,
  secondaryDiagnostic: null,
};

export const validResultFixtures: Record<StudioMethod, unknown> = {
  "system.hello": { kind: "hello", protocolVersion, serviceVersion: "1.0.0" },
  "health.get": { kind: "health", status: "ok", protocolVersion },
  "blueprint.list": { kind: "blueprints", items: [] },
  "workspace.create": {
    kind: "workspace",
    workspace,
  },
  "workspace.list": { kind: "workspaces", items: [] },
  "workspace.get": { kind: "workspace", workspace },
  // One item per group, deliberately. The ajv cross-check validates only these
  // fixtures, so three empty arrays leave `$defs/homeItem` and the three
  // per-group item definitions unexercised — the canonical `status` enum could
  // be widened back to five values, or `kind` back to `review | execution`, with
  // every gate green. The Zod mirror is held by real data because the service
  // validates every result; this is what holds the canonical schema to it.
  "home.get": {
    kind: "home",
    needsDecision: [homeItem("review-1", "decision-needed")],
    blocked: [homeItem("review-2", "revision-needed")],
    recentlyCompleted: [homeItem("review-3", "completed")],
  },
  "demo.seed": {
    kind: "demo-seed",
    workspaceId: "workspace-1",
    actorId: "actor-1",
    initiativeArtifactId: "initiative-1",
    inputPacketRevisionId: "revision-1",
  },
  "execution.start": {
    kind: "execution",
    executionId: "execution-1",
    status: "completed",
    outputRevisionId: "revision-2",
    reviewId: "review-1",
  },
  "review.list": { kind: "reviews", items: [] },
  "review.get": {
    kind: "review-package",
    package: {
      review: reviewSummary,
      workspace,
      initiativeTitle: "Initiative",
      artifactTitle: "Intent",
      artifactType: "product-intent",
      reviewedRevision: productIntentRevision,
      acceptedRevision: null,
      inputs: [inputPacketRevision],
      evidence: [],
      comments: [],
      decisions: [],
      changedFields: [],
      execution: null,
    },
  },
  "artifact.revise": {
    kind: "artifact-revision",
    revisionId: "revision-2",
    reviewId: "review-2",
  },
  "review.resolve": {
    kind: "review-resolution",
    reviewId: "review-1",
    revisionId: "revision-2",
    decisionId: "decision-1",
    status: "accepted",
  },
  // A settled, verdict-bearing result: `phase` is null because no progress
  // state applies, and the qualifier sits beside the verdict rather than
  // replacing it. The two axes are exercised as two fields.
  "source.connect": sourceInspection,
  "source.get": {
    ...sourceInspection,
    verdict: "no-verdict",
    condition: "malformed",
    versionUnverified: true,
    declaredVersionMarker: "0.4",
  },
  // In flight, so the verdict is absent and `phase` carries the progress state.
  "source.cancel": {
    ...sourceInspection,
    phase: "inspecting",
    verdict: null,
    condition: "cancelled",
  },
};

export const validNotificationFixtures = {
  "workspace.created": {
    protocolVersion,
    occurredAt: timestamp,
    workspaceId: "workspace-1",
  },
  "execution.started": {
    protocolVersion,
    occurredAt: timestamp,
    executionId: "execution-1",
  },
  "execution.progressed": {
    protocolVersion,
    occurredAt: timestamp,
    executionId: "execution-1",
    sequence: 1,
    message: "Working",
  },
  "artifact.revision.proposed": {
    protocolVersion,
    occurredAt: timestamp,
    artifactId: "artifact-1",
    revisionId: "revision-1",
  },
  "review.requested": {
    protocolVersion,
    occurredAt: timestamp,
    reviewId: "review-1",
    revisionId: "revision-1",
  },
  "decision.recorded": {
    protocolVersion,
    occurredAt: timestamp,
    decisionId: "decision-1",
    reviewId: "review-1",
    revisionId: "revision-1",
    action: "approve",
  },
  "artifact.revision.accepted": {
    protocolVersion,
    occurredAt: timestamp,
    artifactId: "artifact-1",
    revisionId: "revision-1",
  },
  "execution.completed": {
    protocolVersion,
    occurredAt: timestamp,
    executionId: "execution-1",
  },
  "execution.failed": {
    protocolVersion,
    occurredAt: timestamp,
    executionId: "execution-1",
    message: "Failed",
  },
} as const;

/**
 * One error response per code the contract declares, for the cross-validation
 * in `contracts.test.ts`.
 *
 * The zod table in `validator.ts` is a transcription of the contract's nine
 * `data` shapes, and nothing bound the two together: the transport discards a
 * payload its declared shape does not admit, so drift in either direction
 * silently deletes a valid diagnostic or admits what the contract forbids.
 * That drift had already happened on the emitting side and no test saw it.
 */
export const validErrorFixtures: Record<string, unknown> = {
  "-32700": {
    kind: "validation",
    issues: [{ path: "$", message: "bad json" }],
  },
  "-32600": {
    kind: "validation",
    issues: [{ path: "id", message: "missing" }],
  },
  "-32601": { kind: "resource", resourceType: "method", id: "no.such" },
  "-32602": {
    kind: "validation",
    issues: [{ path: "params", message: "bad" }],
  },
  "-32603": { kind: "internal", requestId: "request-1" },
  "-32001": { kind: "protocol-version", expected: "1", received: "2" },
  "-32002": { kind: "resource", resourceType: "workspace", id: "ws-1" },
  "-32003": {
    kind: "conflict",
    resourceType: "review",
    id: "rev-1",
    currentStatus: "stale-review",
  },
  "-32004": {
    kind: "conflict",
    resourceType: "artifact-revision",
    id: "ar-1",
    currentStatus: "draft",
  },
};
