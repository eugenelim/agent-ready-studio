import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";

import { describe, expect, it } from "vitest";

import { StudioTransport, validateRequest } from "./validator.js";

describe("validateRequest", () => {
  it("rejects params from another method with a structured validation error", () => {
    const result = validateRequest({
      jsonrpc: "2.0",
      id: "request-1",
      method: "workspace.create",
      params: {
        reviewId: "review-1",
        action: "approve",
      },
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: -32602,
        message: "Invalid params",
        data: {
          kind: "validation",
          issues: expect.any(Array),
        },
      },
    });
  });
});

describe("StudioTransport", () => {
  it("AC-20 rejects a correlated result registered to another method", async () => {
    const responses = new PassThrough();
    const requests = new PassThrough();
    const transport = new StudioTransport(
      { readable: responses, writable: requests },
      100,
    );
    requests.once("data", (chunk) => {
      const request = JSON.parse(String(chunk)) as { id: string };
      responses.write(
        `${JSON.stringify({
          jsonrpc: "2.0",
          id: request.id,
          result: {
            kind: "workspace",
            workspace: {
              id: "workspace-1",
              name: "Wrong result",
              blueprintId: "product-development",
              blueprintVersion: "1",
              installedCapabilityPacks: [],
              createdAt: "2026-09-09T12:00:00.000Z",
              updatedAt: "2026-09-09T12:00:00.000Z",
            },
          },
        })}\n`,
      );
    });

    await expect(transport.request("health.get", {})).rejects.toMatchObject({
      kind: "invalid-response",
      method: "health.get",
    });
    transport.shutdown();
  });

  it("AC-47 times out, releases correlation, and serves the next request", async () => {
    const responses = new PassThrough();
    const requests = new PassThrough();
    const transport = new StudioTransport(
      { readable: responses, writable: requests },
      20,
    );
    const sentMethods: string[] = [];
    let healthRequestNumber = 0;
    const lateAnswers: (() => void)[] = [];
    requests.on("data", (chunk) => {
      const request = JSON.parse(String(chunk)) as {
        id: string;
        method: string;
      };
      sentMethods.push(request.method);
      if (request.method === "system.hello") {
        responses.write(
          `${JSON.stringify({
            jsonrpc: "2.0",
            id: request.id,
            result: {
              kind: "hello",
              protocolVersion: "1",
              serviceVersion: "0.1.0",
            },
          })}\n`,
        );
        return;
      }
      healthRequestNumber += 1;
      if (healthRequestNumber === 1) {
        // The realistic shape of a timeout is a slow service, not a silent one.
        // Hold this answer until after the deadline has fired, then deliver it:
        // it must be discarded rather than resolving a request that already
        // rejected, and it must not disturb the connection.
        lateAnswers.push(() =>
          responses.write(
            `${JSON.stringify({
              jsonrpc: "2.0",
              id: request.id,
              result: { kind: "health", status: "ok", protocolVersion: "1" },
            })}\n`,
          ),
        );
        return;
      }
      responses.write(
        `${JSON.stringify({
          jsonrpc: "2.0",
          id: request.id,
          result: { kind: "health", status: "ok", protocolVersion: "1" },
        })}\n`,
      );
    });

    await transport.handshake("timeout-test");
    await expect(transport.request("health.get", {})).rejects.toMatchObject({
      kind: "timeout",
      method: "health.get",
      code: null,
    });
    // The stalled response arrives after the request has settled. Without the
    // `if (!pending) return;` guard in `consume`, this is where a rejected
    // request would be resolved a second time, or an unrelated later request
    // correlated to a stale id. The two assertions that follow are the
    // observable proof that the correlation entry was released: the settled
    // rejection stands, and the same connection still serves.
    expect(lateAnswers).toHaveLength(1);
    for (const answer of lateAnswers) answer();
    await new Promise((resolve) => setImmediate(resolve));

    await expect(transport.request("health.get", {})).resolves.toEqual({
      kind: "health",
      status: "ok",
      protocolVersion: "1",
    });
    expect(sentMethods).toEqual(["system.hello", "health.get", "health.get"]);
    transport.shutdown();
  });

  it("correlates out-of-order results and publishes validated notifications", async () => {
    const responses = new PassThrough();
    const requests = new PassThrough();
    const transport = new StudioTransport(
      { readable: responses, writable: requests },
      100,
    );
    const sent: Array<{ id: string; method: string }> = [];
    requests.on("data", (chunk) => {
      sent.push(JSON.parse(String(chunk)) as { id: string; method: string });
      if (sent.length !== 2) return;
      const [first, second] = sent;
      if (!first || !second)
        throw new Error("Expected two correlated requests");
      responses.write(
        `${JSON.stringify({
          jsonrpc: "2.0",
          id: second.id,
          result: { kind: "blueprints", items: [] },
        })}\n`,
      );
      responses.write(
        `${JSON.stringify({
          jsonrpc: "2.0",
          id: first.id,
          result: { kind: "health", status: "ok", protocolVersion: "1" },
        })}\n`,
      );
    });
    const notifications: unknown[] = [];
    transport.subscribe("workspace.created", (params) => {
      notifications.push(params);
    });

    const health = transport.request("health.get", {});
    const blueprints = transport.request("blueprint.list", {});
    await expect(health).resolves.toMatchObject({ kind: "health" });
    await expect(blueprints).resolves.toEqual({
      kind: "blueprints",
      items: [],
    });
    responses.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        method: "workspace.created",
        params: {
          protocolVersion: "1",
          occurredAt: "2026-09-09T12:00:00.000Z",
          workspaceId: "workspace-1",
        },
      })}\n`,
    );
    expect(notifications).toHaveLength(1);
    responses.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        method: "workspace.created",
        params: {
          protocolVersion: "1",
          occurredAt: "2026-09-09T12:00:00.000Z",
        },
      })}\n`,
    );
    expect(notifications).toHaveLength(1);
    transport.shutdown();
  });

  it("AC-33 settles pending work as disconnected when the supplied stream ends", async () => {
    const responses = new PassThrough();
    const requests = new PassThrough();
    const transport = new StudioTransport(
      { readable: responses, writable: requests },
      100,
    );
    const pending = transport.request("health.get", {});
    responses.end();

    await expect(pending).rejects.toMatchObject({
      kind: "disconnected",
      method: "health.get",
    });
    transport.shutdown();
  });

  it("keeps service refusals distinct from transport failures", async () => {
    const responses = new PassThrough();
    const requests = new PassThrough();
    const transport = new StudioTransport(
      { readable: responses, writable: requests },
      100,
    );
    requests.once("data", (chunk) => {
      const request = JSON.parse(String(chunk)) as { id: string };
      responses.write(
        `${JSON.stringify({
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32602,
            message: "Invalid params",
            data: { kind: "validation", issues: [] },
          },
        })}\n`,
      );
    });

    await expect(transport.request("health.get", {})).rejects.toMatchObject({
      kind: "service",
      code: -32602,
      message: "Invalid params",
    });
    transport.shutdown();
  });

  it("AC-33 surfaces an incompatible handshake distinctly and blocks later dispatch", async () => {
    const responses = new PassThrough();
    const requests = new PassThrough();
    const transport = new StudioTransport(
      { readable: responses, writable: requests },
      100,
    );
    requests.once("data", (chunk) => {
      const request = JSON.parse(String(chunk)) as { id: string };
      responses.write(
        `${JSON.stringify({
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32001,
            message: "Incompatible protocol version",
            data: {
              kind: "protocol-version",
              expected: "1",
              received: "2",
            },
          },
        })}\n`,
      );
    });

    await expect(
      transport.handshake("incompatible-client"),
    ).rejects.toMatchObject({
      kind: "incompatible",
      code: -32001,
      data: { kind: "protocol-version", expected: "1", received: "2" },
    });
    await expect(transport.request("health.get", {})).rejects.toMatchObject({
      kind: "disconnected",
    });
    transport.shutdown();
  });
});

describe("StudioTransport writable failures", () => {
  // A write to a dead child's stdin fails with an asynchronous `error` event.
  // Node throws an unhandled `error` on an EventEmitter with no listener, so
  // this test fails loudly — it does not merely assert a nicer message — if the
  // transport stops listening on the writable. That is the whole point: the
  // uncaught exception it prevents would take the Electron main process down.
  it("AC-33 turns an asynchronous write failure into a disconnected outcome", async () => {
    const responses = new PassThrough();
    class FailingWritable extends EventEmitter {
      write(): boolean {
        // Same shape as a broken pipe: the call returns, the failure arrives
        // on the event loop afterwards.
        setImmediate(() => {
          this.emit("error", new Error("write EPIPE"));
        });
        return true;
      }
      end(): void {}
    }
    const requests = new FailingWritable();
    const transport = new StudioTransport(
      { readable: responses, writable: requests },
      1_000,
    );

    const pending = transport.request("workspace.list", {});
    await expect(pending).rejects.toMatchObject({
      kind: "disconnected",
      message: "write EPIPE",
    });

    // The connection is refused from then on rather than left half-open.
    await expect(transport.request("workspace.list", {})).rejects.toMatchObject(
      { kind: "disconnected" },
    );
  });
});
