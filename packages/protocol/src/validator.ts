import { z } from "zod";

export const protocolVersion = "1" as const;

const idSchema = z.union([z.string().min(1), z.number().int()]);
const emptyParamsSchema = z.object({}).strict();
const workspaceIdParamsSchema = z
  .object({ workspaceId: z.string().min(1) })
  .strict();
const idParamsSchema = z.object({ id: z.string().min(1) }).strict();
const sourceIdParamsSchema = z.object({ sourceId: z.string().min(1) }).strict();
/**
 * The connect-and-orient result. The two axes stay separate fields, and
 * `phase` is null when the result carries a verdict or a condition rather
 * than a progress state; every name is a row of *User-visible states*.
 */
const sourceInspectionResultSchema = z
  .object({
    kind: z.literal("source-inspection"),
    sourceId: z.string().min(1),
    phase: z
      .enum(["unconnected", "url-rejected", "resolving", "inspecting"])
      .nullable(),
    verdict: z
      .enum(["agent-ready", "not-agent-ready", "no-verdict"])
      .nullable(),
    condition: z.enum([
      "ok",
      "malformed",
      "inspector-unavailable",
      "source-unavailable",
      "source-rate-limited",
      "inspection-stopped",
      "cancelled",
      "incomplete",
    ]),
    versionUnverified: z.boolean(),
    owner: z.string(),
    repository: z.string(),
    requestedRef: z.string().nullable(),
    resolvedSha: z.string().nullable(),
    inspectedAt: z.string().nullable(),
    declaredVersionMarker: z.string().nullable(),
    inspectorContractVersion: z.string().nullable(),
    diagnostics: z.string(),
    /**
     * The reason an inspection stopped, where one applies. AC-0088 requires
     * the human reason be composed with the `inspection-stopped` label in both
     * the rendered surface and the announcement, and AC-0091 and AC-0092 take
     * their attribution and retryability **per reason** rather than per state
     * -- so the reason has to cross the boundary, not just the condition.
     */
    stopReason: z
      .enum([
        "remote-ref-charset",
        "head-mismatch",
        "request-identifier-mismatch",
        "result-invalid-studio",
        "result-invalid-repository",
        "result-too-large",
        "inspector-inside-target",
        "file-count",
        "resolution-timeout",
        "inspection-timeout",
        "parse-failure-studio",
        "parse-failure-repository-echoed",
        "parse-failure-declaration-file",
      ])
      .nullable(),
    /** AC-0097. What the transport reported, or null when it reported none. */
    waitWindow: z.string().nullable(),
    /**
     * AC-0099. A protocol identifier never appears as user-visible copy; it
     * appears only here, for the secondary diagnostic surface. Carried as its
     * own field precisely so no copy path can reach it.
     */
    secondaryDiagnostic: z.string().nullable(),
  })
  .strict();
const productIntentSchema = z
  .object({
    title: z.string().min(1),
    outcome: z.string().min(1),
    opportunity: z.string().min(1),
    targetUsers: z.array(z.string().min(1)).min(1),
    assumptions: z.array(z.string().min(1)),
    guardrails: z.array(z.string().min(1)),
    nonGoals: z.array(z.string().min(1)),
    confidence: z.enum(["low", "medium", "high"]),
    openQuestions: z.array(z.string().min(1)),
  })
  .strict();

export const requestSchemas = {
  "system.hello": z
    .object({
      jsonrpc: z.literal("2.0"),
      id: idSchema,
      method: z.literal("system.hello"),
      params: z
        .object({
          protocolVersion: z.literal(protocolVersion),
          client: z.string().min(1),
        })
        .strict(),
    })
    .strict(),
  "health.get": z
    .object({
      jsonrpc: z.literal("2.0"),
      id: idSchema,
      method: z.literal("health.get"),
      params: emptyParamsSchema,
    })
    .strict(),
  "blueprint.list": z
    .object({
      jsonrpc: z.literal("2.0"),
      id: idSchema,
      method: z.literal("blueprint.list"),
      params: emptyParamsSchema,
    })
    .strict(),
  "workspace.create": z
    .object({
      jsonrpc: z.literal("2.0"),
      id: idSchema,
      method: z.literal("workspace.create"),
      params: z
        .object({
          name: z.string().min(1).max(120),
          description: z.string().max(1000).optional(),
          blueprintId: z.literal("product-development"),
          blueprintVersion: z.string().min(1),
        })
        .strict(),
    })
    .strict(),
  "workspace.list": z
    .object({
      jsonrpc: z.literal("2.0"),
      id: idSchema,
      method: z.literal("workspace.list"),
      params: emptyParamsSchema,
    })
    .strict(),
  "workspace.get": z
    .object({
      jsonrpc: z.literal("2.0"),
      id: idSchema,
      method: z.literal("workspace.get"),
      params: idParamsSchema,
    })
    .strict(),
  "home.get": z
    .object({
      jsonrpc: z.literal("2.0"),
      id: idSchema,
      method: z.literal("home.get"),
      params: z.object({ workspaceId: z.string().min(1).optional() }).strict(),
    })
    .strict(),
  "demo.seed": z
    .object({
      jsonrpc: z.literal("2.0"),
      id: idSchema,
      method: z.literal("demo.seed"),
      params: workspaceIdParamsSchema,
    })
    .strict(),
  "execution.start": z
    .object({
      jsonrpc: z.literal("2.0"),
      id: idSchema,
      method: z.literal("execution.start"),
      params: z
        .object({
          workspaceId: z.string().min(1),
          transformationId: z.literal("strategy.frame-product-intent"),
          inputRevisionIds: z
            .array(z.string().min(1))
            .min(1)
            .refine((ids) => new Set(ids).size === ids.length),
          executorKind: z.literal("deterministic"),
        })
        .strict(),
    })
    .strict(),
  "review.list": z
    .object({
      jsonrpc: z.literal("2.0"),
      id: idSchema,
      method: z.literal("review.list"),
      params: z.object({ workspaceId: z.string().min(1).optional() }).strict(),
    })
    .strict(),
  "review.get": z
    .object({
      jsonrpc: z.literal("2.0"),
      id: idSchema,
      method: z.literal("review.get"),
      params: idParamsSchema,
    })
    .strict(),
  "artifact.revise": z
    .object({
      jsonrpc: z.literal("2.0"),
      id: idSchema,
      method: z.literal("artifact.revise"),
      params: z
        .object({
          artifactId: z.string().min(1),
          baseRevisionId: z.string().min(1),
          content: productIntentSchema,
        })
        .strict(),
    })
    .strict(),
  "review.resolve": z
    .object({
      jsonrpc: z.literal("2.0"),
      id: idSchema,
      method: z.literal("review.resolve"),
      params: z
        .object({
          reviewId: z.string().min(1),
          action: z.enum(["approve", "request-revision"]),
          comment: z.string().max(4000).optional(),
        })
        .strict()
        .superRefine((params, context) => {
          if (
            params.action === "request-revision" &&
            (!params.comment || !/\S/.test(params.comment))
          )
            context.addIssue({
              code: "custom",
              message: "A revision request requires a non-blank comment",
              path: ["comment"],
            });
        }),
    })
    .strict(),
  "source.connect": z
    .object({
      jsonrpc: z.literal("2.0"),
      id: idSchema,
      method: z.literal("source.connect"),
      params: z
        .object({ url: z.string().min(1), ref: z.string().min(1).optional() })
        .strict(),
    })
    .strict(),
  "source.get": z
    .object({
      jsonrpc: z.literal("2.0"),
      id: idSchema,
      method: z.literal("source.get"),
      params: sourceIdParamsSchema,
    })
    .strict(),
  "source.cancel": z
    .object({
      jsonrpc: z.literal("2.0"),
      id: idSchema,
      method: z.literal("source.cancel"),
      params: sourceIdParamsSchema,
    })
    .strict(),
} as const;

export type StudioMethod = keyof typeof requestSchemas;
export type StudioRequest<M extends StudioMethod> = z.infer<
  (typeof requestSchemas)[M]
>;
export type StudioRequestParams<M extends StudioMethod> =
  StudioRequest<M> extends { params: infer Params } ? Params : never;
export type ValidationIssue = { path: string; message: string };
export type ValidationError = {
  code: -32602;
  message: "Invalid params";
  data: { kind: "validation"; issues: ValidationIssue[] };
};
export type RequestValidationResult =
  | { ok: true; value: unknown }
  | { ok: false; error: ValidationError };

export function validateRequest(input: unknown): RequestValidationResult {
  if (
    !input ||
    typeof input !== "object" ||
    !("method" in input) ||
    typeof input.method !== "string" ||
    !(input.method in requestSchemas)
  )
    return validationFailure([{ path: "method", message: "Unknown method" }]);
  const result = requestSchemas[input.method as StudioMethod].safeParse(input);
  return result.success
    ? { ok: true, value: result.data }
    : validationFailure(
        result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      );
}

function validationFailure(issues: ValidationIssue[]): RequestValidationResult {
  return {
    ok: false,
    error: {
      code: -32602,
      message: "Invalid params",
      data: { kind: "validation", issues },
    },
  };
}

const homeItemSchema = z
  .object({
    kind: z.literal("review"),
    id: z.string(),
    workspaceId: z.string(),
    workspaceName: z.string(),
    initiativeTitle: z.string().nullable(),
    title: z.string(),
    artifactType: z.string(),
    reason: z.string(),
    producer: z.string(),
    transformationId: z.string().nullable(),
    // No `running` or `failed`. Execution in this slice commits or it does not,
    // so no execution is ever observable to Home; every Home item is a review.
    status: z.enum(["decision-needed", "revision-needed", "completed"]),
    createdAt: z.iso.datetime(),
    unresolvedQuestionCount: z.number().int().nonnegative(),
  })
  .strict();
const needsDecisionItemSchema = homeItemSchema.refine(
  (item) => item.status === "decision-needed",
);
const blockedItemSchema = homeItemSchema.refine(
  (item) => item.status === "revision-needed",
);
const completedItemSchema = homeItemSchema.refine(
  (item) => item.status === "completed",
);
const decisionSchema = z
  .object({
    id: z.string(),
    reviewId: z.string(),
    revisionId: z.string(),
    actorId: z.string(),
    actorName: z.string(),
    action: z.enum(["approve", "request-revision"]),
    comment: z.string().nullable(),
    createdAt: z.iso.datetime(),
  })
  .strict();
const workspaceSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    blueprintId: z.literal("product-development"),
    blueprintVersion: z.string().min(1),
    installedCapabilityPacks: z.array(z.string()),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
const reviewSummarySchema = z
  .object({
    id: z.string(),
    workspaceId: z.string(),
    artifactId: z.string(),
    revisionId: z.string(),
    artifactTitle: z.string(),
    artifactType: z.string(),
    reason: z.string(),
    producer: z.string(),
    status: z.enum(["open", "revision-needed", "resolved", "superseded"]),
    createdAt: z.iso.datetime(),
    unresolvedQuestionCount: z.number().int().nonnegative(),
  })
  .strict();
const inputPacketSchema = z
  .object({
    objective: z.string().min(1),
    sourceNotes: z.string().min(1),
    targetUsers: z.array(z.string()).min(1),
    knownContext: z.array(z.string()),
    constraints: z.array(z.string()),
    nonGoals: z.array(z.string()),
    expectedOutputArtifactType: z.literal("product-intent"),
  })
  .strict();
const productIntentRevisionSchema = z
  .object({
    id: z.string(),
    artifactId: z.string(),
    schemaVersion: z.string(),
    content: productIntentSchema,
    producer: z.string(),
    transformationId: z.string().nullable(),
    inputRevisionIds: z
      .array(z.string())
      .min(1)
      .refine((ids) => new Set(ids).size === ids.length),
    status: z.enum(["draft", "proposed", "accepted", "rejected", "superseded"]),
    createdAt: z.iso.datetime(),
  })
  .strict();
const inputRevisionSchema = z
  .object({
    id: z.string(),
    artifactId: z.string(),
    artifactType: z.literal("input-packet"),
    schemaVersion: z.string(),
    content: inputPacketSchema,
    createdAt: z.iso.datetime(),
  })
  .strict();
const evidenceRelationSchema = z
  .object({
    id: z.string(),
    kind: z.enum(["input-to", "evidence-for", "supersedes"]),
    sourceRevisionId: z.string(),
    targetRevisionId: z.string(),
    label: z.string(),
  })
  .strict();
const commentSchema = z
  .object({
    id: z.string(),
    actorId: z.string(),
    body: z.string(),
    createdAt: z.iso.datetime(),
  })
  .strict();
const executionEventSchema = z
  .object({
    sequence: z.number().int(),
    kind: z.enum(["started", "progress", "result", "completed", "failed"]),
    message: z.string(),
    occurredAt: z.iso.datetime(),
  })
  .strict();
const executionViewSchema = z
  .object({
    id: z.string(),
    executorKind: z.enum(["human", "agent", "deterministic", "external"]),
    status: z.enum(["running", "completed", "failed"]),
    startedAt: z.iso.datetime(),
    completedAt: z.iso.datetime().nullable(),
    inputRevisionIds: z
      .array(z.string())
      .refine((ids) => new Set(ids).size === ids.length),
    outputRevisionId: z.string().nullable(),
    events: z.array(executionEventSchema),
  })
  .strict();
const reviewPackageSchema = z
  .object({
    review: reviewSummarySchema,
    workspace: workspaceSchema,
    initiativeTitle: z.string(),
    artifactTitle: z.string(),
    artifactType: z.literal("product-intent"),
    reviewedRevision: productIntentRevisionSchema,
    acceptedRevision: productIntentRevisionSchema.nullable(),
    inputs: z.array(inputRevisionSchema),
    evidence: z.array(evidenceRelationSchema),
    comments: z.array(commentSchema),
    decisions: z.array(decisionSchema),
    changedFields: z.array(z.string()),
    execution: executionViewSchema.nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.review.status === "open" &&
      value.reviewedRevision.status !== "proposed"
    )
      context.addIssue({
        code: "custom",
        message: "An open review must target a proposed revision",
        path: ["reviewedRevision", "status"],
      });
    if (value.acceptedRevision && value.acceptedRevision.status !== "accepted")
      context.addIssue({
        code: "custom",
        message: "The accepted baseline must have accepted status",
        path: ["acceptedRevision", "status"],
      });
  });

export const resultSchemas = {
  "system.hello": z
    .object({
      kind: z.literal("hello"),
      protocolVersion: z.literal(protocolVersion),
      serviceVersion: z.string().min(1),
    })
    .strict(),
  "health.get": z
    .object({
      kind: z.literal("health"),
      status: z.literal("ok"),
      protocolVersion: z.literal(protocolVersion),
    })
    .strict(),
  "blueprint.list": z
    .object({
      kind: z.literal("blueprints"),
      items: z.array(
        z
          .object({
            id: z.string(),
            version: z.string(),
            name: z.string(),
            modules: z.array(z.string()),
          })
          .strict(),
      ),
    })
    .strict(),
  "workspace.create": z
    .object({
      kind: z.literal("workspace"),
      workspace: workspaceSchema,
    })
    .strict(),
  "workspace.list": z
    .object({ kind: z.literal("workspaces"), items: z.array(workspaceSchema) })
    .strict(),
  "workspace.get": z
    .object({ kind: z.literal("workspace"), workspace: workspaceSchema })
    .strict(),
  "home.get": z
    .object({
      kind: z.literal("home"),
      needsDecision: z.array(needsDecisionItemSchema),
      blocked: z.array(blockedItemSchema),
      recentlyCompleted: z.array(completedItemSchema),
    })
    .strict(),
  "demo.seed": z
    .object({
      kind: z.literal("demo-seed"),
      workspaceId: z.string(),
      actorId: z.string(),
      initiativeArtifactId: z.string(),
      inputPacketRevisionId: z.string(),
    })
    .strict(),
  "execution.start": z
    .object({
      kind: z.literal("execution"),
      executionId: z.string(),
      status: z.enum(["running", "completed", "failed"]),
      outputRevisionId: z.string().nullable(),
      reviewId: z.string().nullable(),
    })
    .strict(),
  "review.list": z
    .object({ kind: z.literal("reviews"), items: z.array(reviewSummarySchema) })
    .strict(),
  "review.get": z
    .object({
      kind: z.literal("review-package"),
      package: reviewPackageSchema,
    })
    .strict(),
  "artifact.revise": z
    .object({
      kind: z.literal("artifact-revision"),
      revisionId: z.string(),
      reviewId: z.string(),
    })
    .strict(),
  "review.resolve": z
    .object({
      kind: z.literal("review-resolution"),
      reviewId: z.string(),
      revisionId: z.string(),
      decisionId: z.string(),
      status: z.enum(["accepted", "revision-needed"]),
    })
    .strict(),
  "source.connect": sourceInspectionResultSchema,
  "source.get": sourceInspectionResultSchema,
  "source.cancel": sourceInspectionResultSchema,
} as const;

const eventBaseSchema = z.object({
  protocolVersion: z.literal(protocolVersion),
  occurredAt: z.iso.datetime(),
});
export const notificationSchemas = {
  "workspace.created": eventBaseSchema
    .extend({ workspaceId: z.string().min(1) })
    .strict(),
  "execution.started": eventBaseSchema
    .extend({ executionId: z.string().min(1) })
    .strict(),
  "execution.progressed": eventBaseSchema
    .extend({
      executionId: z.string(),
      sequence: z.number().int().nonnegative(),
      message: z.string().min(1),
    })
    .strict(),
  "artifact.revision.proposed": eventBaseSchema
    .extend({ artifactId: z.string(), revisionId: z.string() })
    .strict(),
  "review.requested": eventBaseSchema
    .extend({ reviewId: z.string(), revisionId: z.string() })
    .strict(),
  "decision.recorded": eventBaseSchema
    .extend({
      decisionId: z.string(),
      reviewId: z.string(),
      revisionId: z.string(),
      action: z.enum(["approve", "request-revision"]),
    })
    .strict(),
  "artifact.revision.accepted": eventBaseSchema
    .extend({ artifactId: z.string(), revisionId: z.string() })
    .strict(),
  "execution.completed": eventBaseSchema
    .extend({ executionId: z.string().min(1) })
    .strict(),
  "execution.failed": eventBaseSchema
    .extend({ executionId: z.string(), message: z.string().min(1) })
    .strict(),
} as const;

export type NotificationMethod = keyof typeof notificationSchemas;
export type StudioNotificationParams<M extends NotificationMethod> = z.infer<
  (typeof notificationSchemas)[M]
>;
export type StudioResult<M extends StudioMethod> = z.infer<
  (typeof resultSchemas)[M]
>;
export type StudioNotification = {
  jsonrpc: "2.0";
  method: NotificationMethod;
  params: unknown;
};

export function validateResult(method: StudioMethod, result: unknown) {
  return resultSchemas[method].safeParse(result);
}
export function validateNotification(
  method: NotificationMethod,
  params: unknown,
) {
  return notificationSchemas[method].safeParse(params);
}

export type TransportReadable = {
  on(event: string, listener: (...args: unknown[]) => void): unknown;
};
export type TransportWritable = {
  write(data: string): unknown;
  end(): unknown;
  // Required, not optional: a writable with no error listener turns a broken
  // pipe into an uncaught exception in the host process. Making this part of
  // the contract means a test double cannot omit it silently.
  on(event: string, listener: (...args: unknown[]) => void): unknown;
};
export type TransportStreams = {
  readable: TransportReadable;
  writable: TransportWritable;
};
export type TransportFailureKind =
  | "timeout"
  | "disconnected"
  | "incompatible"
  | "invalid-response"
  | "service";

export class StudioTransportError extends Error {
  readonly kind: TransportFailureKind;
  readonly requestId: string | number | null;
  readonly method: StudioMethod | null;
  readonly code: number | null;
  readonly data: unknown;

  constructor(
    kind: TransportFailureKind,
    message: string,
    requestId: string | number | null,
    method: StudioMethod | null,
    code: number | null = null,
    data: unknown = null,
  ) {
    super(message);
    this.name = "StudioTransportError";
    this.kind = kind;
    this.requestId = requestId;
    this.method = method;
    this.code = code;
    this.data = data;
  }
}

type PendingRequest = {
  method: StudioMethod;
  resolve(value: unknown): void;
  reject(reason: StudioTransportError): void;
  timer: ReturnType<typeof setTimeout>;
};

export class StudioTransport {
  private readonly pendingRequests = new Map<string | number, PendingRequest>();
  private readonly subscribers = new Map<
    NotificationMethod,
    Set<(params: unknown) => void>
  >();
  private buffer = "";
  private nextRequestId = 0;
  private acceptingRequests = true;
  private streamClosed = false;
  private readonly streams: TransportStreams;
  private readonly requestTimeoutMs: number;

  constructor(streams: TransportStreams, requestTimeoutMs = 5_000) {
    this.streams = streams;
    this.requestTimeoutMs = requestTimeoutMs;
    streams.readable.on("data", (...args: unknown[]) => {
      this.consume(String(args[0] ?? ""));
    });
    streams.readable.on("end", () => {
      this.disconnect("Studio Service ended its output stream");
    });
    streams.readable.on("close", () => {
      this.disconnect("Studio Service connection closed");
    });
    streams.readable.on("error", (...args: unknown[]) => {
      const error = args[0];
      this.disconnect(
        error instanceof Error
          ? error.message
          : "Studio Service connection failed",
      );
    });
    // A write to a dead child's stdin fails asynchronously with an `error`
    // event, not a synchronous throw, so the try/catch around `write` below
    // cannot see it. Without a listener here Node raises it as an uncaught
    // exception and takes the Electron main process with it, instead of
    // producing the AC-33 disconnected outcome. The window is real: the
    // transport learns the child died from the readable's end/close, which is
    // not synchronised with a write already in flight on the writable.
    streams.writable.on("error", (...args: unknown[]) => {
      const error = args[0];
      this.disconnect(
        error instanceof Error
          ? error.message
          : "Studio Service request stream failed",
      );
    });
  }

  handshake(client: string): Promise<StudioResult<"system.hello">> {
    return this.request("system.hello", { protocolVersion, client });
  }

  request<M extends StudioMethod>(
    method: M,
    params: StudioRequestParams<M>,
  ): Promise<StudioResult<M>> {
    if (!this.acceptingRequests)
      return Promise.reject(
        new StudioTransportError(
          "disconnected",
          "Studio Service is disconnected",
          null,
          method,
        ),
      );
    const id = String(++this.nextRequestId);
    return new Promise<StudioResult<M>>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (!this.pendingRequests.delete(id)) return;
        reject(
          new StudioTransportError(
            "timeout",
            `Studio Service request timed out after ${this.requestTimeoutMs} ms`,
            id,
            method,
          ),
        );
      }, this.requestTimeoutMs);
      this.pendingRequests.set(id, {
        method,
        resolve: (value) => resolve(value as StudioResult<M>),
        reject: (reason) => reject(reason),
        timer,
      });
      try {
        this.streams.writable.write(
          `${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`,
        );
      } catch (error) {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        this.acceptingRequests = false;
        reject(
          new StudioTransportError(
            "disconnected",
            error instanceof Error ? error.message : "Request write failed",
            id,
            method,
          ),
        );
        this.rejectPending("Studio Service request stream failed");
      }
    });
  }

  subscribe<M extends NotificationMethod>(
    method: M,
    listener: (params: StudioNotificationParams<M>) => void,
  ): () => void {
    const listeners = this.subscribers.get(method) ?? new Set();
    const validatedListener = (params: unknown) => {
      listener(params as StudioNotificationParams<M>);
    };
    listeners.add(validatedListener);
    this.subscribers.set(method, listeners);
    return () => {
      listeners.delete(validatedListener);
      if (listeners.size === 0) this.subscribers.delete(method);
    };
  }

  shutdown(): void {
    if (this.streamClosed) return;
    this.streamClosed = true;
    this.acceptingRequests = false;
    this.rejectPending("Studio Transport shut down");
    this.streams.writable.end();
  }

  private consume(chunk: string): void {
    this.buffer += chunk;
    for (;;) {
      const newline = this.buffer.indexOf("\n");
      if (newline < 0) return;
      const line = this.buffer.slice(0, newline).trim();
      this.buffer = this.buffer.slice(newline + 1);
      if (line.length === 0) continue;
      let message: unknown;
      try {
        message = JSON.parse(line);
      } catch {
        this.disconnect("Studio Service emitted malformed JSON");
        return;
      }
      this.receive(message);
    }
  }

  private receive(message: unknown): void {
    if (!isRecordValue(message) || message.jsonrpc !== "2.0") {
      this.disconnect("Studio Service emitted an invalid protocol message");
      return;
    }
    if (typeof message.method === "string" && !("id" in message)) {
      if (!(message.method in notificationSchemas)) return;
      const method = message.method as NotificationMethod;
      const validation = validateNotification(method, message.params);
      if (!validation.success) return;
      for (const listener of this.subscribers.get(method) ?? [])
        listener(validation.data);
      return;
    }
    if (typeof message.id !== "string" && typeof message.id !== "number")
      return;
    const pending = this.pendingRequests.get(message.id);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pendingRequests.delete(message.id);
    const hasResult = "result" in message;
    const hasError = "error" in message;
    if (hasResult === hasError) {
      pending.reject(
        new StudioTransportError(
          "invalid-response",
          `Invalid response envelope for ${pending.method}`,
          message.id,
          pending.method,
        ),
      );
      return;
    }
    if (hasResult) {
      const validation = validateResult(pending.method, message.result);
      if (validation.success) pending.resolve(validation.data);
      else
        pending.reject(
          new StudioTransportError(
            "invalid-response",
            `Invalid result for ${pending.method}`,
            message.id,
            pending.method,
          ),
        );
      return;
    }
    if (
      !isRecordValue(message.error) ||
      typeof message.error.code !== "number"
    ) {
      pending.reject(
        new StudioTransportError(
          "invalid-response",
          `Invalid error response for ${pending.method}`,
          message.id,
          pending.method,
        ),
      );
      return;
    }
    const errorMessage =
      typeof message.error.message === "string"
        ? message.error.message
        : "Studio Service returned an error";
    if (message.error.code === -32001) {
      if (
        !isRecordValue(message.error.data) ||
        message.error.data.kind !== "protocol-version" ||
        message.error.data.expected !== protocolVersion ||
        typeof message.error.data.received !== "string"
      ) {
        pending.reject(
          new StudioTransportError(
            "invalid-response",
            `Invalid incompatible response for ${pending.method}`,
            message.id,
            pending.method,
          ),
        );
        return;
      }
      this.acceptingRequests = false;
      pending.reject(
        new StudioTransportError(
          "incompatible",
          errorMessage,
          message.id,
          pending.method,
          message.error.code,
          message.error.data,
        ),
      );
      this.rejectPending("Studio Service protocol is incompatible");
      return;
    }
    pending.reject(
      new StudioTransportError(
        "service",
        errorMessage,
        message.id,
        pending.method,
        message.error.code,
        message.error.data,
      ),
    );
  }

  private disconnect(message: string): void {
    if (!this.acceptingRequests) return;
    this.acceptingRequests = false;
    this.rejectPending(message);
  }

  private rejectPending(message: string): void {
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(
        new StudioTransportError("disconnected", message, id, pending.method),
      );
    }
    this.pendingRequests.clear();
  }
}

function isRecordValue(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
