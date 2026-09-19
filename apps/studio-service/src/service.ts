import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";
import { pathToFileURL } from "node:url";
import { productDevelopmentBlueprint } from "@agent-ready/blueprint-product-development";
import {
  createProposal,
  type Decision,
  type ProductIntent,
  productIntentSchema,
  type Revision,
  resolveReview as resolveDomainReview,
  reviseArtifact as reviseDomainArtifact,
} from "@agent-ready/domain";
import {
  frameProductIntent,
  type InputPacket,
} from "@agent-ready/executor-fake";
import {
  protocolVersion,
  requestSchemas,
  type StudioMethod,
  type StudioNotification,
  validateNotification,
  validateRequest,
  validateResult,
} from "@agent-ready/protocol";
import {
  type ExecutionEventRecord,
  type HomeProjection,
  openStorage,
  type ReviewProjection,
  type Storage,
  type StorageTransaction,
} from "@agent-ready/storage-sqlite";
import {
  createDefaultTransport,
  createSourceInspections,
  inspectInRuntime,
  type SourceInspections,
} from "./source-inspection.js";

const FRAME_PRODUCT_INTENT = "strategy.frame-product-intent" as const;
const DEMO_INITIATIVE = "demo-initiative";
const DEMO_INPUT_PACKET = "demo-input-packet";
const PRODUCT_INTENT = "product-intent";

export type CreateWorkspaceCommand = {
  name: string;
  description?: string;
  actorId?: never;
};
export type Workspace = {
  id: string;
  name: string;
  description: string | null;
  blueprintId: "product-development";
  blueprintVersion: "1";
  installedCapabilityPacks: [];
  createdAt: string;
  updatedAt: string;
  actor: { id: string; name: string; kind: "human" };
};
export type DemoSeed = {
  actorId: string;
  initiativeArtifactId: string;
  inputPacketRevisionId: string;
};
export type ExecutionStartCommand = {
  workspaceId: string;
  transformationId: typeof FRAME_PRODUCT_INTENT;
  inputRevisionIds: string[];
  executorKind: "deterministic";
  actorId?: never;
};
export type ExecutionStartResult = {
  executionId: string;
  status: "completed" | "failed";
  proposal: {
    id: string;
    artifactId: string;
    status: "proposed";
    inputRevisionIds: string[];
    content: ProductIntent;
  } | null;
  review: {
    id: string;
    status: "open";
  } | null;
  acceptedRevisionId: string | null;
  events: string[];
};
export type ServiceRefusalCode =
  | "invalid-actor"
  | "invalid-comment"
  | "invalid-input"
  | "stale-review"
  | "stale-base"
  | "conflict";
export type ServiceResult =
  | { ok: true; decisionId: string; status: "accepted" | "revision-needed" }
  | { ok: false; code: ServiceRefusalCode };
export type RevisionResult =
  | { ok: true; revisionId: string; reviewId: string }
  | { ok: false; code: ServiceRefusalCode | "invalid-content" };

export type IdFactory = (prefix: string) => string;
export type Clock = () => string;
export type StudioService = ReturnType<typeof createStudioService>;
export type NotificationPublisher = (notification: StudioNotification) => void;
export type DispatchResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data: unknown;
  };
};

export function dispatchRequest(
  service: StudioService,
  request: unknown,
  /**
   * Where an unexpected failure is recorded. Optional so every existing caller
   * is unchanged, defaulting to stderr — which AC-32 reserves for diagnostics,
   * keeping stdout to one protocol message per line.
   */
  diagnostic: Pick<Writable, "write"> = process.stderr,
): DispatchResponse {
  const id = requestId(request);
  if (
    isRecord(request) &&
    request.method === "system.hello" &&
    isRecord(request.params) &&
    typeof request.params.protocolVersion === "string" &&
    request.params.protocolVersion !== protocolVersion
  )
    return errorResponse(id, -32001, "Incompatible protocol version", {
      kind: "protocol-version",
      expected: protocolVersion,
      received: request.params.protocolVersion,
    });
  if (
    isRecord(request) &&
    typeof request.method === "string" &&
    !(request.method in requestSchemas)
  )
    return errorResponse(id, -32601, "Method not found", {
      kind: "resource",
      resourceType: "method",
      id: request.method,
    });
  const validation = validateRequest(request);
  if (!validation.ok)
    return {
      jsonrpc: "2.0",
      id,
      error: validation.error,
    };
  const message = validation.value as {
    method: StudioMethod;
    params: Record<string, unknown>;
  };
  try {
    const result = invoke(service, message.method, message.params);
    const resultValidation = validateResult(message.method, result);
    if (!resultValidation.success)
      return errorResponse(id, -32603, "Internal error", {
        kind: "internal",
        requestId: String(id ?? "unknown"),
      });
    return { jsonrpc: "2.0", id, result: resultValidation.data };
  } catch (error) {
    if (error instanceof DispatchFailure)
      return errorResponse(id, error.code, error.message, error.data);
    // An unexpected throw. The caller gets an opaque internal error on purpose —
    // a stack trace is not a protocol payload — but it must not vanish: without
    // this line a production failure left no record anywhere, in the process or
    // on disk, and the only signal was a renderer request that timed out.
    diagnostic.write(
      `Studio Service internal error on ${message.method} (request ${String(
        id ?? "unknown",
      )}): ${error instanceof Error ? error.message : String(error)}\n`,
    );
    return errorResponse(id, -32603, "Internal error", {
      kind: "internal",
      requestId: String(id ?? "unknown"),
    });
  }
}

export function createStudioService(dependencies: {
  storage: Storage;
  idFactory?: IdFactory;
  clock?: Clock;
  publish?: NotificationPublisher;
  /**
   * Injected by tests so the connect path composes without reaching a remote.
   * Built lazily in production: constructing it resolves `git`, and a service
   * created for a workspace that never connects a repository should not need
   * git present to start.
   */
  sourceInspections?: SourceInspections;
}) {
  const { storage } = dependencies;
  const publish = dependencies.publish ?? (() => undefined);
  const id =
    dependencies.idFactory ?? ((prefix: string) => `${prefix}-${randomUUID()}`);
  const now = dependencies.clock ?? (() => new Date().toISOString());

  let sources = dependencies.sourceInspections;
  const sourceInspections = (): SourceInspections => {
    sources ??= createSourceInspections({
      transport: createDefaultTransport(),
      inspect: inspectInRuntime,
    });
    return sources;
  };

  return {
    /**
     * The connect path. These three are the composition the slice's other
     * modules were built for; before them a submitted URL reached no
     * inspection, which the retraction entry in the verification ledger
     * records.
     */
    sourceConnect(url: string, requestedRef?: string) {
      return sourceInspections().connect(url, requestedRef);
    },
    sourceGet(sourceId: string) {
      return sourceInspections().get(sourceId);
    },
    sourceCancel(sourceId: string) {
      return sourceInspections().cancel(sourceId);
    },
    createWorkspace(command: CreateWorkspaceCommand): Workspace {
      if ("actorId" in command)
        throw new Error("Caller-supplied actor identity is not allowed");
      const createdAt = now();
      const workspaceId = id("workspace");
      const actorId = id("actor");
      storage.transaction((tx) => {
        tx.createWorkspace({
          id: workspaceId,
          name: command.name,
          description: command.description ?? null,
          blueprintId: "product-development",
          blueprintVersion: "1",
          createdAt,
          updatedAt: createdAt,
        });
        tx.createActor({
          id: actorId,
          workspaceId,
          name: "Local human",
          kind: "human",
        });
      });
      const workspace: Workspace = {
        id: workspaceId,
        name: command.name,
        description: command.description ?? null,
        blueprintId: "product-development",
        blueprintVersion: "1",
        installedCapabilityPacks: [],
        createdAt,
        updatedAt: createdAt,
        actor: { id: actorId, name: "Local human", kind: "human" },
      };
      publishNotification(publish, "workspace.created", createdAt, {
        workspaceId,
      });
      return workspace;
    },

    seedDemo(workspaceId: string): DemoSeed {
      return storage.transaction((tx) => {
        const workspace = tx.getWorkspace(workspaceId);
        const actor = tx.getLocalHumanActor(workspaceId);
        if (!workspace || !actor) throw new Error("workspace not found");
        const existingInitiative = tx.findArtifactBySeedKey(
          workspaceId,
          DEMO_INITIATIVE,
        );
        const existingPacket = tx.findArtifactBySeedKey(
          workspaceId,
          DEMO_INPUT_PACKET,
        );
        if (existingInitiative && existingPacket?.acceptedRevisionId)
          return {
            actorId: actor.id,
            initiativeArtifactId: existingInitiative.id,
            inputPacketRevisionId: existingPacket.acceptedRevisionId,
          };

        const occurredAt = now();
        const initiativeArtifactId = id("artifact");
        const initiativeRevisionId = id("revision");
        const packetArtifactId = id("artifact");
        const packetRevisionId = id("revision");
        createSeedArtifact(tx, {
          artifactId: initiativeArtifactId,
          revisionId: initiativeRevisionId,
          workspaceId,
          artifactType: "initiative",
          title: "Build Agent-Ready Studio",
          seedKey: DEMO_INITIATIVE,
          producer: actor.id,
          content: {
            title: "Build Agent-Ready Studio",
            desiredOutcome:
              "Turn uncertain product inputs into explicit, reviewable decisions.",
          },
          occurredAt,
        });
        createSeedArtifact(tx, {
          artifactId: packetArtifactId,
          revisionId: packetRevisionId,
          workspaceId,
          artifactType: "input-packet",
          title: "Agent-Ready Studio Input Packet",
          seedKey: DEMO_INPUT_PACKET,
          producer: actor.id,
          content: demoInputPacket,
          occurredAt,
        });
        return {
          actorId: actor.id,
          initiativeArtifactId,
          inputPacketRevisionId: packetRevisionId,
        };
      });
    },

    executionStart(command: ExecutionStartCommand): ExecutionStartResult {
      const executionId = id("execution");
      if ("actorId" in command) return failedExecution(executionId);
      const [inputRevisionId] = command.inputRevisionIds;
      if (
        command.transformationId !== FRAME_PRODUCT_INTENT ||
        command.executorKind !== "deterministic" ||
        inputRevisionId === undefined ||
        command.inputRevisionIds.length !== 1 ||
        new Set(command.inputRevisionIds).size !==
          command.inputRevisionIds.length
      )
        return failedExecution(executionId);
      const inputRevision = storage.getRevision(inputRevisionId);
      if (
        !inputRevision ||
        inputRevision.workspaceId !== command.workspaceId ||
        inputRevision.artifactType !== "input-packet"
      )
        return failedExecution(executionId);
      const packet = inputPacketFrom(inputRevision.content);
      if (!packet) return failedExecution(executionId);

      const occurredAt = now();
      const proposalRevisionId = id("revision");
      const reviewId = id("review");
      const relationIds = command.inputRevisionIds.map(() => id("relation"));
      const existingArtifact = storage.findArtifactBySeedKey(
        command.workspaceId,
        PRODUCT_INTENT,
      );
      const artifactId = existingArtifact?.id ?? id("artifact");
      const content = productIntentSchema.parse(frameProductIntent(packet));
      const events: ExecutionEventRecord["kind"][] = [
        "started",
        "progress",
        "result",
        "completed",
      ];

      try {
        storage.transaction((tx) => {
          const proposal = createProposal(
            {
              artifact: {
                id: artifactId,
                acceptedRevisionId:
                  existingArtifact?.acceptedRevisionId ?? null,
              },
              knownInputRevisionIds: command.inputRevisionIds,
              revisions: [],
              relations: [],
              review: null,
              lifecycle: [],
            },
            {
              revisionId: proposalRevisionId,
              content,
              producer: "deterministic",
              transformationId: FRAME_PRODUCT_INTENT,
              inputRevisionIds: command.inputRevisionIds,
              now: occurredAt,
            },
          );
          if (!proposal.ok) throw new Error(proposal.code);
          if (!existingArtifact)
            tx.createArtifact({
              id: artifactId,
              workspaceId: command.workspaceId,
              artifactType: PRODUCT_INTENT,
              title: content.title,
              seedKey: PRODUCT_INTENT,
              acceptedRevisionId: null,
            });
          tx.insertExecution({
            id: executionId,
            workspaceId: command.workspaceId,
            transformationId: FRAME_PRODUCT_INTENT,
            inputRevisionIds: command.inputRevisionIds,
            outputRevisionId: null,
            status: "running",
            startedAt: occurredAt,
            completedAt: null,
          });
          for (const [sequence, kind] of events.entries())
            tx.appendExecutionEvent(executionId, {
              sequence,
              kind,
              message: executionEventMessage(kind),
              occurredAt,
            });
          const revision = proposal.state.revisions.at(-1);
          if (!revision) throw new Error("proposal revision missing");
          tx.insertRevision({
            id: revision.id,
            artifactId: revision.artifactId,
            schemaVersion: revision.schemaVersion,
            content: revision.content,
            producer: revision.producer,
            transformationId: revision.transformationId,
            inputRevisionIds: revision.inputRevisionIds,
            createdAt: revision.createdAt,
          });
          const lifecycleState = proposal.state.lifecycle.at(-1);
          if (!lifecycleState) throw new Error("proposal lifecycle missing");
          tx.appendLifecycleState(lifecycleState);
          for (const [index, relation] of proposal.state.relations.entries()) {
            const relationId = relationIds[index];
            if (!relationId) throw new Error("proposal relation ID missing");
            tx.insertRelation({
              id: relationId,
              ...relation,
              label: "Execution input",
            });
          }
          tx.openReview({
            id: reviewId,
            revisionId: proposalRevisionId,
            status: "open",
            createdAt: occurredAt,
          });
          tx.updateExecution({
            executionId,
            status: "completed",
            outputRevisionId: proposalRevisionId,
            completedAt: occurredAt,
          });
        });
      } catch {
        return failedExecution(executionId);
      }
      publishNotification(publish, "execution.started", occurredAt, {
        executionId,
      });
      publishNotification(publish, "execution.progressed", occurredAt, {
        executionId,
        sequence: 1,
        message: "Framing Product Intent",
      });
      publishNotification(publish, "artifact.revision.proposed", occurredAt, {
        artifactId,
        revisionId: proposalRevisionId,
      });
      publishNotification(publish, "review.requested", occurredAt, {
        reviewId,
        revisionId: proposalRevisionId,
      });
      publishNotification(publish, "execution.completed", occurredAt, {
        executionId,
      });
      return {
        executionId,
        status: "completed",
        proposal: {
          id: proposalRevisionId,
          artifactId,
          status: "proposed",
          inputRevisionIds: [...command.inputRevisionIds],
          content,
        },
        review: { id: reviewId, status: "open" },
        acceptedRevisionId: existingArtifact?.acceptedRevisionId ?? null,
        events,
      };
    },

    resolveReview(input: {
      reviewId: string;
      revisionId: string;
      action: "approve" | "request-revision";
      comment?: string;
      actorId?: never;
    }): ServiceResult {
      if ("actorId" in input) return { ok: false, code: "invalid-actor" };
      const decisionId = id("decision");
      const commentId =
        input.action === "request-revision" ? id("comment") : null;
      const occurredAt = now();
      const result = storage.transaction<ServiceResult>((tx) => {
        const persisted = tx.getReviewState(input.reviewId);
        if (!persisted) return { ok: false, code: "stale-review" };
        const actor = tx.getLocalHumanActor(persisted.artifact.workspaceId);
        if (!actor) return { ok: false, code: "invalid-actor" };
        const state = {
          artifact: {
            id: persisted.artifact.id,
            acceptedRevisionId: persisted.artifact.acceptedRevisionId,
          },
          review: {
            id: persisted.review.id,
            revisionId: persisted.review.revisionId,
            status: persisted.review.status,
          },
          revisions: persisted.revisions.map(domainRevision),
          decisions: persisted.decisions.map(domainDecision),
          lifecycle: [...persisted.lifecycle],
        };
        const resolved = resolveDomainReview(state, {
          reviewId: input.reviewId,
          revisionId: input.revisionId,
          action: input.action,
          actor,
          comment: input.comment,
          now: occurredAt,
          decisionId,
        });
        if (!resolved.ok) return { ok: false, code: resolved.code };
        const decision = resolved.state.decisions.at(-1);
        const approvedRevisionId =
          input.action === "approve"
            ? resolved.state.artifact.acceptedRevisionId
            : null;
        if (
          !decision ||
          (input.action === "approve" && approvedRevisionId === null)
        )
          return { ok: false, code: "conflict" };
        tx.recordDecision({
          id: decision.id,
          reviewId: decision.reviewId,
          revisionId: decision.revisionId,
          actorId: decision.actor.id,
          action: decision.action,
          comment: decision.comment,
          createdAt: decision.createdAt,
        });
        if (commentId && decision.comment)
          tx.insertReviewComment({
            id: commentId,
            reviewId: decision.reviewId,
            actorId: decision.actor.id,
            body: decision.comment,
            createdAt: decision.createdAt,
          });
        for (const entry of resolved.state.lifecycle.slice(
          state.lifecycle.length,
        ))
          tx.appendLifecycleState(entry);
        tx.updateReviewStatus(input.reviewId, resolved.state.review.status);
        if (approvedRevisionId !== null)
          tx.updateAcceptedRevision(persisted.artifact.id, approvedRevisionId);
        return {
          ok: true,
          decisionId,
          status: input.action === "approve" ? "accepted" : "revision-needed",
        };
      });
      if (result.ok) {
        publishNotification(publish, "decision.recorded", occurredAt, {
          decisionId,
          reviewId: input.reviewId,
          revisionId: input.revisionId,
          action: input.action,
        });
        if (input.action === "approve") {
          const persisted = storage.getRevision(input.revisionId);
          if (persisted)
            publishNotification(
              publish,
              "artifact.revision.accepted",
              occurredAt,
              {
                artifactId: persisted.artifactId,
                revisionId: input.revisionId,
              },
            );
        }
      }
      return result;
    },

    reviseArtifact(input: {
      artifactId: string;
      baseRevisionId: string;
      content: ProductIntent;
      actorId?: never;
    }): RevisionResult {
      if ("actorId" in input) return { ok: false, code: "invalid-actor" };
      const revisionId = id("revision");
      const reviewId = id("review");
      const relationId = id("relation");
      const occurredAt = now();
      const result = storage.transaction<RevisionResult>((tx) => {
        const artifact = tx.getArtifact(input.artifactId);
        const base = tx.getRevision(input.baseRevisionId);
        if (!artifact || !base || base.artifactId !== artifact.id)
          return { ok: false, code: "stale-base" };
        const actor = tx.getLocalHumanActor(artifact.workspaceId);
        if (!actor) return { ok: false, code: "invalid-actor" };
        const priorReview = tx.getReviewByRevision(base.id);
        const revised = reviseDomainArtifact(
          {
            artifact: {
              id: artifact.id,
              acceptedRevisionId: artifact.acceptedRevisionId,
            },
            knownInputRevisionIds: [base.id],
            revisions: [domainRevision(base)],
            relations: [],
            review: priorReview
              ? {
                  id: priorReview.id,
                  revisionId: priorReview.revisionId,
                  status: priorReview.status,
                }
              : null,
            lifecycle: [],
          },
          {
            revisionId,
            baseRevisionId: base.id,
            content: input.content,
            actor,
            now: occurredAt,
            reviewId,
          },
        );
        if (!revised.ok) return { ok: false, code: revised.code };
        const revision = revised.state.revisions.at(-1);
        if (!revision) return { ok: false, code: "conflict" };
        tx.insertRevision({
          id: revision.id,
          artifactId: revision.artifactId,
          schemaVersion: revision.schemaVersion,
          content: revision.content,
          producer: revision.producer,
          transformationId: revision.transformationId,
          inputRevisionIds: revision.inputRevisionIds,
          createdAt: revision.createdAt,
        });
        for (const entry of revised.state.lifecycle)
          tx.appendLifecycleState(entry);
        tx.insertRelation({
          id: relationId,
          sourceRevisionId: base.id,
          targetRevisionId: revision.id,
          kind: "input-to",
          label: "Human revision base",
        });
        if (priorReview?.status === "open")
          tx.updateReviewStatus(priorReview.id, "superseded");
        tx.openReview({
          id: reviewId,
          revisionId,
          status: "open",
          createdAt: occurredAt,
        });
        return { ok: true, revisionId, reviewId };
      });
      if (result.ok) {
        publishNotification(publish, "artifact.revision.proposed", occurredAt, {
          artifactId: input.artifactId,
          revisionId,
        });
        publishNotification(publish, "review.requested", occurredAt, {
          reviewId,
          revisionId,
        });
      }
      return result;
    },

    workspaceList() {
      return storage.listWorkspaces();
    },
    workspaceGet(workspaceId: string) {
      return storage.getWorkspace(workspaceId);
    },
    reviewList(workspaceId?: string) {
      return storage.listReviews(workspaceId);
    },
    homeGet(workspaceId?: string): HomeProjection {
      return storage.readHome(workspaceId);
    },
    reviewGet(reviewId: string): ReviewProjection | null {
      return storage.readReview(reviewId);
    },
    countInitiatives(workspaceId: string): number {
      return storage.countArtifactsByType(workspaceId, "initiative");
    },
    close(): void {
      storage.close();
    },
  };
}

const demoInputPacket: InputPacket = {
  objective: "Build Agent-Ready Studio",
  sourceNotes: "Decision-oriented local desktop product",
  targetUsers: ["Multidisciplinary product teams"],
  knownContext: ["Local-first"],
  constraints: ["No provider required"],
  nonGoals: ["Remote dispatch"],
  expectedOutputArtifactType: "product-intent",
};

function createSeedArtifact(
  storage: StorageTransaction,
  input: {
    artifactId: string;
    revisionId: string;
    workspaceId: string;
    artifactType: string;
    title: string;
    seedKey: string;
    producer: string;
    content: unknown;
    occurredAt: string;
  },
): void {
  storage.createArtifact({
    id: input.artifactId,
    workspaceId: input.workspaceId,
    artifactType: input.artifactType,
    title: input.title,
    seedKey: input.seedKey,
    acceptedRevisionId: null,
  });
  storage.insertRevision({
    id: input.revisionId,
    artifactId: input.artifactId,
    schemaVersion: "1",
    content: input.content,
    producer: input.producer,
    transformationId: null,
    inputRevisionIds: [],
    createdAt: input.occurredAt,
  });
  storage.appendLifecycleState({
    revisionId: input.revisionId,
    status: "accepted",
    occurredAt: input.occurredAt,
  });
  storage.updateAcceptedRevision(input.artifactId, input.revisionId);
}

function inputPacketFrom(content: unknown): InputPacket | null {
  if (!isRecord(content)) return null;
  const expected = content.expectedOutputArtifactType;
  if (
    typeof content.objective !== "string" ||
    typeof content.sourceNotes !== "string" ||
    !stringArray(content.targetUsers) ||
    !stringArray(content.knownContext) ||
    !stringArray(content.constraints) ||
    !stringArray(content.nonGoals) ||
    expected !== "product-intent"
  )
    return null;
  return {
    objective: content.objective,
    sourceNotes: content.sourceNotes,
    targetUsers: content.targetUsers,
    knownContext: content.knownContext,
    constraints: content.constraints,
    nonGoals: content.nonGoals,
    expectedOutputArtifactType: expected,
  };
}

function domainRevision(revision: {
  id: string;
  artifactId: string;
  schemaVersion: string;
  content: unknown;
  producer: string;
  transformationId: string | null;
  inputRevisionIds: string[];
  status: Revision["status"];
  createdAt: string;
}): Revision {
  const content = productIntentSchema.safeParse(revision.content);
  // A typed refusal, not an exception. `artifact.revise` against an artifact
  // that is not a Product Intent used to throw a raw ZodError out of the domain
  // mapping and land in the catch-all as an opaque internal error.
  if (!content.success)
    throw new DispatchFailure(-32004, "Revision base is not a Product Intent", {
      kind: "resource",
      resourceType: "artifact-revision",
      id: revision.id,
    });
  return { ...revision, content: content.data };
}

function domainDecision(decision: {
  id: string;
  reviewId: string;
  revisionId: string;
  actorId: string;
  actorName: string;
  actorKind: Decision["actor"]["kind"];
  action: Decision["action"];
  comment: string | null;
  createdAt: string;
}): Decision {
  return {
    id: decision.id,
    reviewId: decision.reviewId,
    revisionId: decision.revisionId,
    actor: {
      id: decision.actorId,
      name: decision.actorName,
      kind: decision.actorKind,
    },
    action: decision.action,
    comment: decision.comment,
    createdAt: decision.createdAt,
  };
}

function executionEventMessage(kind: string): string {
  switch (kind) {
    case "started":
      return "Execution started";
    case "progress":
      return "Framing Product Intent";
    case "result":
      return "Product Intent proposed";
    default:
      return "Execution completed";
  }
}

function failedExecution(executionId: string): ExecutionStartResult {
  return {
    executionId,
    status: "failed",
    proposal: null,
    review: null,
    acceptedRevisionId: null,
    events: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function stringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function requestId(request: unknown): string | number | null {
  if (!isRecord(request)) return null;
  return typeof request.id === "string" || typeof request.id === "number"
    ? request.id
    : null;
}

function errorResponse(
  id: string | number | null,
  code: number,
  message: string,
  data: unknown,
): DispatchResponse {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

class DispatchFailure extends Error {
  readonly code: number;
  readonly data: unknown;

  constructor(code: number, message: string, data: unknown) {
    super(message);
    this.name = "DispatchFailure";
    this.code = code;
    this.data = data;
  }
}

function invoke(
  service: StudioService,
  method: StudioMethod,
  params: Record<string, unknown>,
): unknown {
  switch (method) {
    case "system.hello":
      return {
        kind: "hello",
        protocolVersion,
        serviceVersion: "0.1.0",
      };
    case "health.get":
      return { kind: "health", status: "ok", protocolVersion };
    case "blueprint.list":
      return {
        kind: "blueprints",
        items: [
          {
            id: productDevelopmentBlueprint.id,
            version: productDevelopmentBlueprint.version,
            name: productDevelopmentBlueprint.name,
            modules: productDevelopmentBlueprint.modules.map(
              (module) => module.id,
            ),
          },
        ],
      };
    case "workspace.create":
      return {
        kind: "workspace",
        workspace: protocolWorkspace(
          service.createWorkspace({
            name: params.name as string,
            description: params.description as string | undefined,
          }),
        ),
      };
    case "workspace.list":
      return {
        kind: "workspaces",
        items: service.workspaceList().map(protocolWorkspace),
      };
    case "workspace.get": {
      const workspace = service.workspaceGet(params.id as string);
      if (!workspace)
        throw new DispatchFailure(-32002, "Workspace not found", {
          kind: "resource",
          resourceType: "workspace",
          id: params.id,
        });
      return {
        kind: "workspace",
        workspace: protocolWorkspace(workspace),
      };
    }
    case "home.get":
      return { kind: "home", ...service.homeGet(params.workspaceId as string) };
    case "demo.seed": {
      const workspaceId = params.workspaceId as string;
      return {
        kind: "demo-seed",
        workspaceId,
        ...service.seedDemo(workspaceId),
      };
    }
    case "execution.start": {
      const execution = service.executionStart({
        workspaceId: params.workspaceId as string,
        transformationId:
          params.transformationId as typeof FRAME_PRODUCT_INTENT,
        inputRevisionIds: params.inputRevisionIds as string[],
        executorKind: params.executorKind as "deterministic",
      });
      return {
        kind: "execution",
        executionId: execution.executionId,
        status: execution.status,
        outputRevisionId: execution.proposal?.id ?? null,
        reviewId: execution.review?.id ?? null,
      };
    }
    case "source.connect":
      return service.sourceConnect(
        params.url as string,
        params.ref as string | undefined,
      );
    case "source.get": {
      const held = service.sourceGet(params.sourceId as string);
      if (held === undefined)
        throw new DispatchFailure(-32002, "Source not found", {
          kind: "resource",
          resourceType: "source",
          id: params.sourceId,
        });
      return held;
    }
    case "source.cancel": {
      const cancelled = service.sourceCancel(params.sourceId as string);
      if (cancelled === undefined)
        throw new DispatchFailure(-32002, "Source not found", {
          kind: "resource",
          resourceType: "source",
          id: params.sourceId,
        });
      return cancelled;
    }
    case "review.list":
      return {
        kind: "reviews",
        items: service.reviewList(params.workspaceId as string | undefined),
      };
    case "review.get": {
      const review = service.reviewGet(params.id as string);
      if (!review)
        throw new DispatchFailure(-32002, "Review not found", {
          kind: "resource",
          resourceType: "review",
          id: params.id,
        });
      return {
        kind: "review-package",
        package: protocolReviewPackage(review),
      };
    }
    case "artifact.revise": {
      const revised = service.reviseArtifact({
        artifactId: params.artifactId as string,
        baseRevisionId: params.baseRevisionId as string,
        content: params.content as ProductIntent,
      });
      if (!revised.ok)
        throw new DispatchFailure(-32004, "Artifact revision conflict", {
          kind: "conflict",
          resourceType: "artifact",
          id: params.artifactId,
          currentStatus: revised.code,
        });
      return { kind: "artifact-revision", ...revised };
    }
    case "review.resolve": {
      const reviewId = params.reviewId as string;
      const review = service.reviewGet(reviewId);
      if (!review)
        throw new DispatchFailure(-32002, "Review not found", {
          kind: "resource",
          resourceType: "review",
          id: reviewId,
        });
      const resolved = service.resolveReview({
        reviewId,
        revisionId: review.reviewedRevision.id,
        action: params.action as "approve" | "request-revision",
        comment: params.comment as string | undefined,
      });
      if (!resolved.ok)
        throw new DispatchFailure(
          resolved.code === "stale-review" ? -32003 : -32004,
          resolved.code === "stale-review"
            ? "Stale review"
            : "Review resolution conflict",
          {
            kind: "conflict",
            resourceType: "review",
            id: reviewId,
            currentStatus: resolved.code,
          },
        );
      return {
        kind: "review-resolution",
        reviewId,
        revisionId: review.reviewedRevision.id,
        decisionId: resolved.decisionId,
        status: resolved.status,
      };
    }
  }
}

function publishNotification(
  publish: NotificationPublisher,
  method: StudioNotification["method"],
  occurredAt: string,
  params: Record<string, unknown>,
): void {
  const body = { protocolVersion, occurredAt, ...params };
  const validation = validateNotification(method, body);
  if (!validation.success)
    throw new Error(`Invalid ${method} notification payload`);
  publish({
    jsonrpc: "2.0",
    method,
    params: validation.data,
  });
}

function protocolWorkspace(workspace: {
  id: string;
  name: string;
  description: string | null;
  blueprintId: string;
  blueprintVersion: string;
  createdAt: string;
  updatedAt: string;
}): Record<string, unknown> {
  return {
    id: workspace.id,
    name: workspace.name,
    ...(workspace.description === null
      ? {}
      : { description: workspace.description }),
    blueprintId: workspace.blueprintId,
    blueprintVersion: workspace.blueprintVersion,
    installedCapabilityPacks: [],
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };
}

function protocolReviewPackage(
  review: ReviewProjection,
): Record<string, unknown> {
  const content = productIntentSchema.parse(review.reviewedRevision.content);
  return {
    review: {
      ...review.review,
      workspaceId: review.workspace.id,
      artifactId: review.reviewedRevision.artifactId,
      artifactTitle: review.artifactTitle,
      artifactType: review.artifactType,
      reason: protocolReviewReason(review.review.status),
      producer: review.reviewedRevision.producer,
      unresolvedQuestionCount: content.openQuestions.length,
    },
    workspace: protocolWorkspace(review.workspace),
    initiativeTitle: review.initiativeTitle,
    artifactTitle: review.artifactTitle,
    artifactType: review.artifactType,
    reviewedRevision: protocolProductIntentRevision(review.reviewedRevision),
    acceptedRevision:
      review.acceptedRevision === null
        ? null
        : protocolProductIntentRevision(review.acceptedRevision),
    inputs: review.inputs
      .filter((input) => input.artifactType === "input-packet")
      .map((input) => ({
        id: input.id,
        artifactId: input.artifactId,
        artifactType: input.artifactType,
        schemaVersion: input.schemaVersion,
        content: input.content,
        createdAt: input.createdAt,
      })),
    evidence: review.evidence,
    comments: review.comments.map((comment) => ({
      id: comment.id,
      actorId: comment.actorId,
      body: comment.body,
      createdAt: comment.createdAt,
    })),
    decisions: review.decisions.map((decision) => ({
      id: decision.id,
      reviewId: decision.reviewId,
      revisionId: decision.revisionId,
      actorId: decision.actorId,
      actorName: decision.actorName,
      action: decision.action,
      comment: decision.comment,
      createdAt: decision.createdAt,
    })),
    changedFields: review.changedFields,
    execution:
      review.execution === null
        ? null
        : {
            id: review.execution.id,
            executorKind: "deterministic",
            status: review.execution.status,
            startedAt: review.execution.startedAt,
            completedAt: review.execution.completedAt,
            inputRevisionIds: review.execution.inputRevisionIds,
            outputRevisionId: review.execution.outputRevisionId,
            events: review.execution.events,
          },
  };
}

function protocolReviewReason(status: string): string {
  if (status === "open") return "Review requested";
  if (status === "revision-needed") return "Revision requested";
  return "Decision completed";
}

function protocolProductIntentRevision(revision: {
  id: string;
  artifactId: string;
  schemaVersion: string;
  content: unknown;
  producer: string;
  transformationId: string | null;
  inputRevisionIds: string[];
  status: Revision["status"];
  createdAt: string;
}): Record<string, unknown> {
  return {
    id: revision.id,
    artifactId: revision.artifactId,
    schemaVersion: revision.schemaVersion,
    content: revision.content,
    producer: revision.producer,
    transformationId: revision.transformationId,
    inputRevisionIds: revision.inputRevisionIds,
    status: revision.status,
    createdAt: revision.createdAt,
  };
}

export async function runStdioService(input: {
  databasePath: string;
  readable?: Readable;
  writable?: Writable;
  diagnostic?: Writable;
}): Promise<void> {
  const readable = input.readable ?? process.stdin;
  const writable = input.writable ?? process.stdout;
  const diagnostic = input.diagnostic ?? process.stderr;
  const storage = openStorage(input.databasePath);
  const service = createStudioService({
    storage,
    publish: (notification) => writeProtocol(writable, notification),
  });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    service.close();
  };
  const terminate = () => {
    close();
    readable.destroy();
    process.exitCode = 0;
  };
  process.once("SIGTERM", terminate);
  const lines = createInterface({
    input: readable,
    crlfDelay: Number.POSITIVE_INFINITY,
  });
  try {
    for await (const line of lines) {
      if (!line.trim()) continue;
      let request: unknown;
      try {
        request = JSON.parse(line);
      } catch {
        writeProtocol(
          writable,
          errorResponse(null, -32700, "Parse error", {
            kind: "validation",
            issues: [{ path: "", message: "Invalid JSON" }],
          }),
        );
        continue;
      }
      writeProtocol(writable, dispatchRequest(service, request, diagnostic));
    }
  } catch (error) {
    diagnostic.write(
      `${error instanceof Error ? error.message : "Studio Service failed"}\n`,
    );
    throw error;
  } finally {
    process.removeListener("SIGTERM", terminate);
    close();
  }
}

function writeProtocol(writable: Writable, message: unknown): void {
  writable.write(`${JSON.stringify(message)}\n`);
}

const serviceEntry = process.argv[1];
if (
  serviceEntry !== undefined &&
  import.meta.url === pathToFileURL(serviceEntry).href
)
  runStdioService({
    databasePath: process.env.STUDIO_DATABASE_PATH ?? "studio.db",
  }).catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Studio Service failed"}\n`,
    );
    process.exitCode = 1;
  });
