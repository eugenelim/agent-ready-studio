/**
 * The connect path across the real desktop boundary: preload → main transport →
 * spawned Studio Service → back.
 *
 * This artifact exists because its absence let a whole slice ship unwired.
 * Every renderer test injects a fake preload, so all of them passed while
 * `service.ts` dispatched no `source.*` case at all and the built app answered
 * `-32603 Internal error` to every submission. A test at this level is the only
 * one that could have caught it, and the only one that keeps it caught.
 *
 * A refused URL reaches no remote: it is refused before any transport is
 * consulted, which is exactly the property AC-0108 depends on. **An accepted
 * URL does reach one** -- the spawned service resolves the ref for real -- so
 * the accepted cases are gated behind CONNECT_ORIENT_E2E_NETWORK=1 and the
 * offline suite runs the refusal and not-found paths only. An earlier version
 * of this file claimed the whole artifact reached no remote; it passed offline
 * only because nothing asserted the outcome of the request it made.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

const electronRegistration = vi.hoisted(() => ({
  exposeInMainWorld: vi.fn(),
  invoke: vi.fn(),
}));

vi.mock("electron", () => ({
  contextBridge: {
    exposeInMainWorld: electronRegistration.exposeInMainWorld,
  },
  ipcRenderer: { invoke: electronRegistration.invoke },
}));

import {
  createStudioRequestHandler,
  StudioMainClient,
  spawnStudioConnection,
} from "../main/index.js";
import {
  createStudioPreloadApi,
  type StudioPreloadApi,
} from "../preload/index.js";

const temporaryDirectories: string[] = [];
const openClients: StudioMainClient[] = [];

afterEach(async () => {
  for (const client of openClients.splice(0)) await client.shutdown();
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

function boundary(databasePath: string): StudioPreloadApi {
  const serviceEntry = fileURLToPath(
    new URL("../../../studio-service/dist/service.js", import.meta.url),
  );
  const client = new StudioMainClient(async () =>
    spawnStudioConnection({ databasePath, serviceEntry }),
  );
  openClients.push(client);
  const handler = createStudioRequestHandler(client);
  return createStudioPreloadApi(async (channel, request) => {
    expect(channel).toBe("studio:request");
    return handler(request);
  });
}

function freshBoundary(): StudioPreloadApi {
  const directory = mkdtempSync(join(tmpdir(), "connect-orient-e2e-"));
  temporaryDirectories.push(directory);
  return boundary(join(directory, "studio.db"));
}

function freshDatabase(): string {
  const directory = mkdtempSync(join(tmpdir(), "connect-orient-e2e-"));
  temporaryDirectories.push(directory);
  return join(directory, "studio.db");
}

const networked = process.env.CONNECT_ORIENT_E2E_NETWORK === "1";

describe("the connect path across the real desktop boundary", () => {
  it("answers source.connect rather than failing at the boundary", async () => {
    // The assertion that would have failed before the service was wired: the
    // method is dispatched and a validated source-inspection comes back.
    const api = freshBoundary();
    const outcome = await api.source.connect({
      url: "https://github.com/octocat/Hello-World",
    });

    expect(outcome.ok, `connect failed: ${JSON.stringify(outcome)}`).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.value.kind).toBe("source-inspection");
    expect(outcome.value.owner).toBe("octocat");
    expect(outcome.value.repository).toBe("Hello-World");
    // Accepted, so an inspection began rather than a refusal being returned.
    expect(outcome.value.phase).toBe("resolving");
    expect(outcome.value.sourceId.length).toBeGreaterThan(0);
  }, 30_000);

  it("refuses a URL it cannot use, with the reason the lead reads", async () => {
    // A refusal needs no transport, so this crosses the whole boundary and
    // still reaches no network.
    const api = freshBoundary();
    const outcome = await api.source.connect({
      url: "https://example.com/acme/widgets",
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.value.phase).toBe("url-rejected");
    expect(outcome.value.diagnostics).toBe(
      "Studio connects to public github.com repositories only",
    );
  }, 30_000);

  it("refuses embedded credentials distinguishably from a wrong host", async () => {
    const api = freshBoundary();
    const wrongHost = await api.source.connect({
      url: "https://example.com/acme/widgets",
    });
    const credentials = await api.source.connect({
      url: "https://user:token@github.com/acme/widgets",
    });

    expect(wrongHost.ok && credentials.ok).toBe(true);
    if (!wrongHost.ok || !credentials.ok) return;
    expect(credentials.value.phase).toBe("url-rejected");
    // AC-0108 across the real boundary: the two causes do not collapse.
    expect(credentials.value.diagnostics).not.toBe(wrongHost.value.diagnostics);
    expect(credentials.value.diagnostics).toContain("credentials");
  }, 30_000);

  it("reads back and cancels an inspection it started", async () => {
    const api = freshBoundary();
    const started = await api.source.connect({
      url: "https://github.com/octocat/Hello-World",
    });
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const sourceId = started.value.sourceId;

    const read = await api.source.get(sourceId);
    expect(read.ok, `get failed: ${JSON.stringify(read)}`).toBe(true);
    if (!read.ok) return;
    expect(read.value.sourceId).toBe(sourceId);

    const cancelled = await api.source.cancel(sourceId);
    expect(cancelled.ok, `cancel failed: ${JSON.stringify(cancelled)}`).toBe(
      true,
    );
    if (!cancelled.ok) return;
    expect(cancelled.value.condition).toBe("cancelled");
    expect(cancelled.value.phase).toBeNull();
  }, 30_000);

  it.skipIf(!networked)(
    "carries an accepted inspection through to a terminal state",
    async () => {
      // The step the previous version never bound. `resolving` is the
      // synchronous pre-pipeline return, so asserting it alone left the whole
      // post-dispatch path -- resolve, spawn the Runtime, materialize --
      // unexercised, and a Runtime child missing from the built bundle passed
      // a green run.
      const api = freshBoundary();
      const started = await api.source.connect({
        url: "https://github.com/octocat/Hello-World",
      });
      expect(started.ok).toBe(true);
      if (!started.ok) return;
      const sourceId = started.value.sourceId;

      const deadline = Date.now() + 120_000;
      let latest = started.value;
      while (Date.now() < deadline && latest.phase !== null) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const read = await api.source.get(sourceId);
        if (!read.ok) throw new Error(`get failed: ${JSON.stringify(read)}`);
        latest = read.value;
      }

      expect(
        latest.phase,
        "the inspection never reached a terminal state",
      ).toBeNull();
      expect(latest.resolvedSha).toMatch(/^[0-9a-f]{40}$/);
      // The Runtime materialized it and found no trusted inspector, which is
      // the honest outcome. A child that failed to spawn yields
      // `inspection-stopped` instead, which is how a broken built bundle
      // reddens here.
      expect(
        latest.condition,
        `expected inspector-unavailable, got ${latest.condition}: ${latest.diagnostics}`,
      ).toBe("inspector-unavailable");
    },
    180_000,
  );

  it.skipIf(!networked)(
    "AC-0100 to AC-0103 a result is still readable after a real restart",
    async () => {
      // The in-memory map is not the claim; surviving a process boundary is.
      // This runs one inspection to a terminal state, shuts the service down,
      // spawns a second one against the same database, and reads it back.
      const databasePath = freshDatabase();
      const first = boundary(databasePath);
      const started = await first.source.connect({
        url: "https://github.com/octocat/Hello-World",
      });
      expect(started.ok).toBe(true);
      if (!started.ok) return;
      const sourceId = started.value.sourceId;

      const deadline = Date.now() + 120_000;
      let latest = started.value;
      while (Date.now() < deadline && latest.phase !== null) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const read = await first.source.get(sourceId);
        if (!read.ok) throw new Error(`get failed: ${JSON.stringify(read)}`);
        latest = read.value;
      }
      expect(latest.phase).toBeNull();

      // Shut the first service down before the second reads, so nothing is
      // answered from a process that is still holding the result in memory.
      for (const client of openClients.splice(0)) await client.shutdown();

      const second = boundary(databasePath);
      const restored = await second.source.get(sourceId);
      expect(
        restored.ok,
        `restored read failed: ${JSON.stringify(restored)}`,
      ).toBe(true);
      if (!restored.ok) return;

      expect(restored.value.owner).toBe("octocat"); // AC-0100
      expect(restored.value.repository).toBe("Hello-World");
      expect(restored.value.resolvedSha).toBe(latest.resolvedSha); // AC-0101
      expect(restored.value.inspectedAt).not.toBeNull();
      expect(restored.value.verdict).toBe(latest.verdict); // AC-0102
      expect(restored.value.condition).toBe(latest.condition);
      // AC-0103: the restored result carries the time it was inspected, which
      // is what lets a surface show it as restored rather than as fresh.
      expect(restored.value.inspectedAt).toBe(latest.inspectedAt);
    },
    240_000,
  );

  it("reports an unknown source as not found rather than as an internal error", async () => {
    const api = freshBoundary();
    const outcome = await api.source.get("source-does-not-exist");
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    // A missing resource is the caller's mistake and says so; an internal
    // error would be Studio blaming itself for a well-formed request.
    expect(outcome.error.code).toBe(-32002);
  }, 30_000);
});
