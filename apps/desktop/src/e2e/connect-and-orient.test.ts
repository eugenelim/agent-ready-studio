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
 * It reaches no remote. A refused URL is refused before any transport is
 * consulted, which is exactly the property that makes it testable here.
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
