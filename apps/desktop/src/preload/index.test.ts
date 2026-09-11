import { PassThrough } from "node:stream";
import {
  type StudioMethod,
  type StudioRequestParams,
  StudioTransport,
  StudioTransportError,
} from "@agent-ready/protocol";
import { describe, expect, it, vi } from "vitest";

const electronMock = vi.hoisted(() => ({
  exposeInMainWorld: vi.fn(),
  invoke: vi.fn(),
}));

vi.mock("electron", () => ({
  contextBridge: { exposeInMainWorld: electronMock.exposeInMainWorld },
  ipcRenderer: { invoke: electronMock.invoke },
}));

import {
  createStudioRequestHandler,
  type ManagedStudioConnection,
  StudioMainClient,
  type StudioTransportPort,
} from "../main/index.js";
import { createStudioPreloadApi, type StudioCallFailureKind } from "./index.js";

describe("Studio preload boundary", () => {
  it("AC-34 exposes only frozen purpose-specific domain methods", () => {
    const api = createStudioPreloadApi(async () => ({
      ok: true,
      value: { kind: "workspaces", items: [] },
    }));

    expect(Object.keys(api).sort()).toEqual([
      "artifact",
      "execution",
      "review",
      "workspace",
    ]);
    expect(Object.keys(api.workspace).sort()).toEqual([
      "create",
      "get",
      "home",
      "list",
      "seedDemo",
    ]);
    const allKeys = [
      ...Object.keys(api),
      ...Object.values(api).flatMap((group) => Object.keys(group)),
    ];
    for (const forbidden of [
      "ipc",
      "invoke",
      "send",
      "process",
      "spawn",
      "exec",
      "shell",
      "filesystem",
      "fs",
      "readFile",
      "writeFile",
    ])
      expect(allKeys).not.toContain(forbidden);
    expect(Object.isFrozen(api)).toBe(true);
    expect(Object.values(api).every(Object.isFrozen)).toBe(true);
    expect(electronMock.exposeInMainWorld).toHaveBeenCalledWith(
      "studio",
      expect.any(Object),
    );
  });

  it("AC-34 refuses invalid parameters before IPC dispatch", async () => {
    const invoke = vi.fn();
    const api = createStudioPreloadApi(invoke);

    const outcome = await (
      api.workspace.create as (input: unknown) => Promise<unknown>
    )({ name: "" });

    expect(outcome).toMatchObject({
      ok: false,
      error: { kind: "invalid-response" },
    });
    expect(invoke).not.toHaveBeenCalled();
  });

  it("AC-34 refuses a method-valid result returned for another method", async () => {
    const api = createStudioPreloadApi(async () => ({
      ok: true,
      value: { kind: "health", status: "ok", protocolVersion: "1" },
    }));

    await expect(api.workspace.list()).resolves.toMatchObject({
      ok: false,
      error: { kind: "invalid-response" },
    });
  });

  it("AC-33 turns an unavailable main IPC channel into disconnected", async () => {
    const api = createStudioPreloadApi(async () => {
      throw new Error("raw IPC failure");
    });

    await expect(api.workspace.list()).resolves.toEqual({
      ok: false,
      error: {
        kind: "disconnected",
        message: "Studio main is disconnected",
        code: null,
        data: null,
      },
    });
  });

  it("AC-49 preserves a real transport timeout across main and preload", async () => {
    const serviceOutput = new PassThrough();
    const serviceInput = new PassThrough();
    const transport = new StudioTransport(
      { readable: serviceOutput, writable: serviceInput },
      20,
    );
    serviceInput.on("data", (chunk) => {
      const request = JSON.parse(String(chunk).trim()) as {
        id: string;
        method: string;
      };
      if (request.method === "system.hello")
        serviceOutput.write(
          `${JSON.stringify({
            jsonrpc: "2.0",
            id: request.id,
            result: {
              kind: "hello",
              protocolVersion: "1",
              serviceVersion: "test",
            },
          })}\n`,
        );
    });
    const client = new StudioMainClient(async () =>
      managedTransportConnection(transport),
    );
    const handler = createStudioRequestHandler(client);
    const api = createStudioPreloadApi(async (channel, request) => {
      expect(channel).toBe("studio:request");
      return handler(request);
    });

    const timeout = await api.workspace.list();
    expect(timeout).toMatchObject({
      ok: false,
      error: {
        kind: "timeout",
        code: null,
        message: "Studio Service request timed out after 20 ms",
      },
    });

    const otherKinds = await Promise.all(
      (["service", "disconnected", "incompatible"] as const).map((kind) =>
        preloadFailureKind(kind),
      ),
    );
    expect(timeout.ok ? "success" : timeout.error.kind).toBe("timeout");
    expect(otherKinds).toEqual(["service", "disconnected", "incompatible"]);
    await client.shutdown();
  });
});

function managedTransportConnection(
  transport: StudioTransport,
): ManagedStudioConnection {
  const port: StudioTransportPort = {
    handshake: (client) => transport.handshake(client),
    request: (method: StudioMethod, params: unknown) =>
      transport.request(method, params as StudioRequestParams<typeof method>),
    shutdown: () => transport.shutdown(),
  };
  return {
    transport: port,
    exited: Promise.resolve({ code: 0, signal: null, error: null }),
    terminate: () => true,
  };
}

async function preloadFailureKind(
  kind: Exclude<StudioCallFailureKind, "timeout" | "invalid-response">,
): Promise<StudioCallFailureKind | "success"> {
  const error = new StudioTransportError(
    kind,
    `${kind} fixture`,
    "failure-request",
    kind === "incompatible" ? "system.hello" : "workspace.list",
    kind === "incompatible" ? -32001 : kind === "service" ? -32000 : null,
    kind === "incompatible"
      ? { kind: "protocol-version", expected: "1", received: "2" }
      : null,
  );
  const client = new StudioMainClient(async () =>
    managedConnectionForFailure(kind, error),
  );
  const handler = createStudioRequestHandler(client);
  const api = createStudioPreloadApi((_channel, request) => handler(request));
  const outcome = await api.workspace.list();
  await client.shutdown();
  return outcome.ok ? "success" : outcome.error.kind;
}

function managedConnectionForFailure(
  kind: "service" | "disconnected" | "incompatible",
  error: StudioTransportError,
): ManagedStudioConnection {
  return {
    transport: {
      handshake: async () => {
        if (kind === "incompatible") throw error;
      },
      request: async () => {
        throw error;
      },
      shutdown: () => undefined,
    },
    exited: Promise.resolve({ code: 0, signal: null, error: null }),
    terminate: () => true,
  };
}
