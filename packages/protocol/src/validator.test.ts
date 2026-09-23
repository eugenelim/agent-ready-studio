import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";

import { describe, expect, it } from "vitest";

import { PARSE_NESTING_DEPTH_BOUND } from "./guarded-parse.js";
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

describe("StudioTransport guards the northbound envelope", () => {
  // AC-0056 and AC-0057 at the transport call site. The helper's own coverage
  // is in guarded-parse.test.ts; these drive the real transport, because a
  // guard proven only for the helper is not proven where it is used.

  it("AC-0056 refuses a line past the parse nesting-depth bound and yields no value", async () => {
    const responses = new PassThrough();
    const requests = new PassThrough();
    const transport = new StudioTransport(
      { readable: responses, writable: requests },
      100,
    );

    requests.once("data", () => {
      // Structurally a valid notification, so the pre-existing shape check
      // cannot be what answers it -- only the depth bound can. Without the
      // guard this parses, fails strict params validation, is dropped
      // silently, and the pending request times out instead.
      const depth = PARSE_NESTING_DEPTH_BOUND + 1;
      let params = "1";
      for (let level = 0; level < depth; level += 1) {
        params = `{"a":${params}}`;
      }
      responses.write(
        `{"jsonrpc":"2.0","method":"workspace.created","params":${params}}\n`,
      );
    });

    // The owner's recorded answer for a framing fault: the guard yields no
    // value and the existing disconnect stands, which rejects the in-flight
    // request rather than failing only that one line.
    await expect(transport.request("health.get", {})).rejects.toMatchObject({
      kind: "disconnected",
    });
    transport.shutdown();
  });

  it("AC-0057 drops an inadmissible key before the envelope is validated", async () => {
    const responses = new PassThrough();
    const requests = new PassThrough();
    const transport = new StudioTransport(
      { readable: responses, writable: requests },
      100,
    );

    const seen: Record<string, unknown>[] = [];
    const sentinelArrived = new Promise<void>((settle) => {
      transport.subscribe("workspace.created", (params) => {
        const received = params as unknown as Record<string, unknown>;
        seen.push(received);
        // Settle on the stream rather than on a fixed delay. The two
        // notifications are written to one stream in order, so the second
        // arriving means the first was already admitted or rejected; keying on
        // the sentinel rather than on a count keeps a removed guard a failed
        // assertion below instead of a timeout.
        if (received.workspaceId === "clean") {
          settle();
        }
      });
    });

    const base = {
      protocolVersion: "1",
      occurredAt: "2026-09-23T12:00:00.000Z",
    };
    // The hostile notification is valid apart from the inadmissible key. The
    // guard drops that key, so strict params validation admits it and the
    // subscriber sees it. Without the guard the extra own key survives, strict
    // validation rejects the notification, and it never arrives -- so its
    // arrival is what binds the guard here.
    responses.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        method: "workspace.created",
        params: {
          ...base,
          workspaceId: "hostile",
          ["__proto__"]: { polluted: true },
        },
      })}\n`,
    );
    responses.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        method: "workspace.created",
        params: { ...base, workspaceId: "clean" },
      })}\n`,
    );
    await sentinelArrived;

    const ids = seen.map((params) => params.workspaceId);
    expect(ids).toContain("clean");
    expect(ids).toContain("hostile");
    for (const params of seen) {
      expect(Object.hasOwn(params, "__proto__")).toBe(false);
    }
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    transport.shutdown();
  });

  it("AC-0056 admits a line at exactly the bound", async () => {
    const responses = new PassThrough();
    const requests = new PassThrough();
    const transport = new StudioTransport(
      { readable: responses, writable: requests },
      100,
    );

    requests.once("data", (chunk) => {
      const request = JSON.parse(String(chunk)) as { id: string };
      // Paired with the over-bound case above, so the comparison itself is
      // bound at this site and not only at the helper and the protocol-line
      // site. The envelope is the first level, so `params` carries the
      // remaining `bound - 1` and the line measures exactly the bound.
      let params = "1";
      for (let level = 0; level < PARSE_NESTING_DEPTH_BOUND - 1; level += 1) {
        params = `{"a":${params}}`;
      }
      responses.write(
        `{"jsonrpc":"2.0","method":"workspace.created","params":${params}}\n`,
      );
      responses.write(
        `${JSON.stringify({
          jsonrpc: "2.0",
          id: request.id,
          result: {
            kind: "health",
            status: "ok",
            protocolVersion: "1",
          },
        })}\n`,
      );
    });

    // The pending request is the observable. An admitted line is a valid
    // notification whose params fail validation, which returns quietly, so the
    // result behind it still resolves. A `>=` mutant refuses the line in the
    // guard instead, and a guard refusal at this site disconnects and rejects
    // every pending request -- so this settles as `disconnected` rather than
    // resolving. Asserting on a later notification could not bind it, because
    // `disconnect` does not stop the stream being consumed.
    await expect(transport.request("health.get", {})).resolves.toMatchObject({
      kind: "health",
    });
    transport.shutdown();
  });

  it("AC-0057 rebuilds the error payload a caller receives", async () => {
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
            data: { kind: "validation", issues: [{ path: "a", message: "b" }] },
          },
        })}\n`,
      );
    });

    const refusal = await transport.request("health.get", {}).then(
      () => undefined,
      (cause: unknown) => cause as { data?: unknown },
    );

    // The transport's second consumer boundary. `error.data` resolves to the
    // caller of `request`, so the guard's rebuild is observable here even
    // though it is not at the subscriber boundary, where strict validation
    // replaces the envelope first. This is the assertion that binds AC-0057's
    // null-prototype clause at this site: removing the rebuild leaves the
    // parsed subtree with an ordinary prototype and reddens it.
    expect(refusal?.data).toBeDefined();
    expect(Object.getPrototypeOf(refusal?.data as object)).toBeNull();
    transport.shutdown();
  });

  it("AC-0057 delivers a freshly normalized envelope, not the parsed line", async () => {
    const responses = new PassThrough();
    const requests = new PassThrough();
    const transport = new StudioTransport(
      { readable: responses, writable: requests },
      100,
    );

    let delivered: Record<string, unknown> | undefined;
    const arrived = new Promise<void>((settle) => {
      transport.subscribe("workspace.created", (params) => {
        delivered = params as unknown as Record<string, unknown>;
        settle();
      });
    });

    responses.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        method: "workspace.created",
        params: {
          protocolVersion: "1",
          occurredAt: "2026-09-23T12:00:00.000Z",
          workspaceId: "fresh",
          invented: "carried nowhere",
        },
      })}\n`,
    );
    responses.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        method: "workspace.created",
        params: {
          protocolVersion: "1",
          occurredAt: "2026-09-23T12:00:00.000Z",
          workspaceId: "fresh-2",
        },
      })}\n`,
    );
    await arrived;

    // AC-0057's third clause at this site. The guard rebuilds the parsed line
    // with a null prototype, and strict validation then builds the envelope a
    // subscriber receives from the schema's named fields alone. So the
    // delivered object carrying an ordinary prototype is what proves it is a
    // fresh construction rather than the parsed line handed on: handing
    // `message.params` to the listener instead of the validated value reddens
    // here, and nothing a line invented beyond the named fields can travel.
    expect(delivered).toBeDefined();
    expect(Object.getPrototypeOf(delivered as object)).not.toBeNull();
    // The first notification is the one that carried the invented field, and
    // strict validation refused the whole envelope rather than trimming it, so
    // the subscriber's first delivery is the clean one. That is what binds the
    // refuse-rather-than-trim behaviour; an assertion that the delivered
    // object lacks the invented field could not fail, because the envelope
    // carrying it never reaches a subscriber under any mutant.
    expect(delivered?.workspaceId).toBe("fresh-2");
    transport.shutdown();
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
