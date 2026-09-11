import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStorage } from "@agent-ready/storage-sqlite";
import { describe, expect, it } from "vitest";

import {
  createStudioService,
  dispatchRequest,
  type StudioService,
} from "./service.js";

describe("Studio Service protocol dispatch", () => {
  it("AC-21 refuses an incompatible system.hello before dispatching another method", () => {
    let dispatchCount = 0;
    const service = new Proxy({} as StudioService, {
      get: () => {
        dispatchCount += 1;
        return () => undefined;
      },
    });

    const response = dispatchRequest(service, {
      jsonrpc: "2.0",
      id: "hello-incompatible",
      method: "system.hello",
      params: { protocolVersion: "2", client: "transport-test" },
    });

    expect(response).toEqual({
      jsonrpc: "2.0",
      id: "hello-incompatible",
      error: {
        code: -32001,
        message: "Incompatible protocol version",
        data: {
          kind: "protocol-version",
          expected: "1",
          received: "2",
        },
      },
    });
    expect(dispatchCount).toBe(0);
  });

  it("AC-20 refuses method-specific param cross-talk without dispatch", () => {
    let dispatchCount = 0;
    const service = new Proxy({} as StudioService, {
      get: () => {
        dispatchCount += 1;
        return () => undefined;
      },
    });

    expect(
      dispatchRequest(service, {
        jsonrpc: "2.0",
        id: "health-cross-talk",
        method: "health.get",
        params: { workspaceId: "workspace-1" },
      }),
    ).toMatchObject({
      jsonrpc: "2.0",
      id: "health-cross-talk",
      error: { code: -32602, message: "Invalid params" },
    });
    expect(dispatchCount).toBe(0);
  });
});

describe("Studio Service unexpected failures", () => {
  it("answers an unexpected throw and records it where an operator can read it", () => {
    // The catch-all had no test at all, and wrote nothing anywhere. Two things
    // matter and both were unpinned: the caller must still get a well-formed
    // response, because without one every renderer request hangs to AC-47's
    // timeout, and the failure must leave a record — an opaque `-32603` with no
    // log is indistinguishable from a service that never saw the request.
    const service = new Proxy({} as StudioService, {
      get: () => () => {
        throw new Error("projection exploded");
      },
    });
    const written: string[] = [];
    const response = dispatchRequest(
      service,
      { jsonrpc: "2.0", id: "1", method: "home.get", params: {} },
      {
        write: (chunk: unknown) => {
          written.push(String(chunk));
          return true;
        },
      },
    );

    expect(response).toMatchObject({
      jsonrpc: "2.0",
      id: "1",
      error: {
        code: -32603,
        message: "Internal error",
        data: { kind: "internal", requestId: "1" },
      },
    });
    // The payload stays opaque — a stack trace is not a protocol value — while
    // the diagnostic names the method, the request and the cause.
    expect(JSON.stringify(response)).not.toContain("projection exploded");
    expect(written.join("")).toContain("home.get");
    expect(written.join("")).toContain("request 1");
    expect(written.join("")).toContain("projection exploded");
  });
});

describe("Studio Service execution.start", () => {
  it("turns the seeded Input Packet into a proposed Product Intent and open review", () => {
    const directory = mkdtempSync(join(tmpdir(), "agent-ready-service-unit-"));
    const storage = openStorage(join(directory, "studio.db"));
    let nextId = 0;
    const service = createStudioService({
      storage,
      idFactory: (prefix) => `${prefix}-${++nextId}`,
      clock: () => "2026-09-09T12:00:00.000Z",
    });
    const workspace = service.createWorkspace({ name: "Agent-Ready Studio" });
    const seed = service.seedDemo(workspace.id);

    const result = service.executionStart({
      workspaceId: workspace.id,
      transformationId: "strategy.frame-product-intent",
      inputRevisionIds: [seed.inputPacketRevisionId],
      executorKind: "deterministic",
    });

    expect(result).toMatchObject({
      status: "completed",
      proposal: {
        status: "proposed",
        inputRevisionIds: [seed.inputPacketRevisionId],
      },
      review: { status: "open" },
      acceptedRevisionId: null,
    });
    service.close();
    rmSync(directory, { recursive: true, force: true });
  });
});
