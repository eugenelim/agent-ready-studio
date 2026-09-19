import {
  STUDIO_REQUEST_CHANNEL,
  type StudioMethod,
  type StudioRequestParams,
  type StudioResult,
  validateRequest,
  validateResult,
} from "@agent-ready/protocol";
import { contextBridge, ipcRenderer } from "electron";

export type StudioCallFailureKind =
  | "timeout"
  | "disconnected"
  | "incompatible"
  | "invalid-response"
  | "service";

export type StudioCallFailure = Readonly<{
  kind: StudioCallFailureKind;
  message: string;
  code: number | null;
  data: unknown;
}>;

export type StudioCallOutcome<M extends StudioMethod> =
  | Readonly<{ ok: true; value: StudioResult<M> }>
  | Readonly<{ ok: false; error: StudioCallFailure }>;

export type StudioInvoke = (
  channel: string,
  request: unknown,
) => Promise<unknown>;

type WorkspaceCreateInput = Readonly<{
  name: string;
  description?: string;
}>;

type ExecutionStartInput = Readonly<{
  workspaceId: string;
  inputRevisionIds: string[];
}>;

export type StudioPreloadApi = Readonly<{
  workspace: Readonly<{
    create(
      input: WorkspaceCreateInput,
    ): Promise<StudioCallOutcome<"workspace.create">>;
    list(): Promise<StudioCallOutcome<"workspace.list">>;
    get(id: string): Promise<StudioCallOutcome<"workspace.get">>;
    home(workspaceId?: string): Promise<StudioCallOutcome<"home.get">>;
    seedDemo(workspaceId: string): Promise<StudioCallOutcome<"demo.seed">>;
  }>;
  artifact: Readonly<{
    revise(
      input: StudioRequestParams<"artifact.revise">,
    ): Promise<StudioCallOutcome<"artifact.revise">>;
  }>;
  execution: Readonly<{
    start(
      input: ExecutionStartInput,
    ): Promise<StudioCallOutcome<"execution.start">>;
  }>;
  /**
   * The inspection surface's three methods. `connect` carries the submitted
   * URL and nothing else: AC-0106 puts no credential on the form, so there is
   * no credential to pass, and adding an optional field here would be the
   * first place one could appear.
   */
  source: Readonly<{
    connect(
      input: StudioRequestParams<"source.connect">,
    ): Promise<StudioCallOutcome<"source.connect">>;
    get(sourceId: string): Promise<StudioCallOutcome<"source.get">>;
    cancel(sourceId: string): Promise<StudioCallOutcome<"source.cancel">>;
  }>;
  review: Readonly<{
    list(workspaceId?: string): Promise<StudioCallOutcome<"review.list">>;
    get(id: string): Promise<StudioCallOutcome<"review.get">>;
    resolve(
      input: StudioRequestParams<"review.resolve">,
    ): Promise<StudioCallOutcome<"review.resolve">>;
  }>;
}>;

export function createStudioPreloadApi(invoke: StudioInvoke): StudioPreloadApi {
  const request = async <M extends StudioMethod>(
    method: M,
    params: StudioRequestParams<M>,
  ): Promise<StudioCallOutcome<M>> => {
    const requestValidation = validateRequest({
      jsonrpc: "2.0",
      id: "preload-validation",
      method,
      params,
    });
    if (!requestValidation.ok)
      return invalidBoundaryOutcome(
        "Studio request failed preload validation",
        requestValidation.error,
      );

    try {
      const response = await invoke(STUDIO_REQUEST_CHANNEL, { method, params });
      return validateOutcome(method, response);
    } catch {
      return {
        ok: false,
        error: Object.freeze({
          kind: "disconnected",
          message: "Studio main is disconnected",
          code: null,
          data: null,
        }),
      };
    }
  };

  return Object.freeze({
    workspace: Object.freeze({
      create: (input: WorkspaceCreateInput) =>
        request("workspace.create", {
          ...input,
          blueprintId: "product-development",
          blueprintVersion: "1",
        }),
      list: () => request("workspace.list", {}),
      get: (id: string) => request("workspace.get", { id }),
      home: (workspaceId?: string) =>
        request("home.get", workspaceId === undefined ? {} : { workspaceId }),
      seedDemo: (workspaceId: string) => request("demo.seed", { workspaceId }),
    }),
    artifact: Object.freeze({
      revise: (input: StudioRequestParams<"artifact.revise">) =>
        request("artifact.revise", input),
    }),
    execution: Object.freeze({
      start: (input: ExecutionStartInput) =>
        request("execution.start", {
          ...input,
          transformationId: "strategy.frame-product-intent",
          executorKind: "deterministic",
        }),
    }),
    source: Object.freeze({
      connect: (input: StudioRequestParams<"source.connect">) =>
        request("source.connect", input),
      get: (sourceId: string) => request("source.get", { sourceId }),
      cancel: (sourceId: string) => request("source.cancel", { sourceId }),
    }),
    review: Object.freeze({
      list: (workspaceId?: string) =>
        request(
          "review.list",
          workspaceId === undefined ? {} : { workspaceId },
        ),
      get: (id: string) => request("review.get", { id }),
      resolve: (input: StudioRequestParams<"review.resolve">) =>
        request("review.resolve", input),
    }),
  });
}

function validateOutcome<M extends StudioMethod>(
  method: M,
  input: unknown,
): StudioCallOutcome<M> {
  if (!isRecord(input) || typeof input.ok !== "boolean")
    return invalidBoundaryOutcome("Studio main returned an invalid outcome");
  if (input.ok) {
    const result = validateResult(method, input.value);
    if (result.success) {
      // The method-specific runtime schema established this generic correlation.
      const value = result.data as StudioResult<M>;
      return { ok: true, value };
    }
    return invalidBoundaryOutcome(
      `Studio main returned an invalid ${method} result`,
    );
  }
  const failure = validateFailure(input.error);
  return failure
    ? { ok: false, error: failure }
    : invalidBoundaryOutcome("Studio main returned an invalid failure");
}

function validateFailure(input: unknown): StudioCallFailure | null {
  if (
    !isRecord(input) ||
    !isFailureKind(input.kind) ||
    typeof input.message !== "string" ||
    !(typeof input.code === "number" || input.code === null) ||
    !("data" in input)
  )
    return null;
  if (input.kind === "incompatible" && input.code !== -32001) return null;
  if (
    (input.kind === "timeout" || input.kind === "disconnected") &&
    input.code !== null
  )
    return null;
  return Object.freeze({
    kind: input.kind,
    message: input.message,
    code: input.code,
    data: input.data,
  });
}

function invalidBoundaryOutcome<M extends StudioMethod>(
  message: string,
  data: unknown = null,
): StudioCallOutcome<M> {
  return {
    ok: false,
    error: Object.freeze({
      kind: "invalid-response",
      message,
      code: null,
      data,
    }),
  };
}

function isFailureKind(input: unknown): input is StudioCallFailureKind {
  return (
    input === "timeout" ||
    input === "disconnected" ||
    input === "incompatible" ||
    input === "invalid-response" ||
    input === "service"
  );
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

contextBridge.exposeInMainWorld(
  "studio",
  createStudioPreloadApi((channel, request) =>
    ipcRenderer.invoke(channel, request),
  ),
);
