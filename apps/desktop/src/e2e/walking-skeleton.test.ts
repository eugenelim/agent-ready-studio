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

import { openStorage } from "../../../../packages/storage-sqlite/src/index.js";
import {
  createStudioRequestHandler,
  type ManagedStudioConnection,
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

describe("Product Development walking skeleton", () => {
  it("AC-28 retains an approved decision across the real desktop boundary and restart", async () => {
    const directory = mkdtempSync(join(tmpdir(), "agent-ready-e2e-"));
    temporaryDirectories.push(directory);
    const databasePath = join(directory, "studio.db");
    const first = createRealDesktopBoundary(databasePath);

    const created = await first.api.workspace.create({
      name: "End-to-end workspace",
      description: "Real preload, process, service, and SQLite",
    });
    expect(created).toMatchObject({
      ok: true,
      value: {
        kind: "workspace",
        workspace: {
          name: "End-to-end workspace",
          blueprintId: "product-development",
          blueprintVersion: "1",
          installedCapabilityPacks: [],
        },
      },
    });
    if (!created.ok) throw new Error("Expected workspace creation to succeed");
    const workspaceId = created.value.workspace.id;

    const seeded = await first.api.workspace.seedDemo(workspaceId);
    expect(seeded).toMatchObject({
      ok: true,
      value: {
        kind: "demo-seed",
        workspaceId,
        initiativeArtifactId: expect.any(String),
        inputPacketRevisionId: expect.any(String),
      },
    });
    if (!seeded.ok) throw new Error("Expected demo seed to succeed");
    expect(seeded.value.initiativeArtifactId.length).toBeGreaterThan(0);
    expect(seeded.value.inputPacketRevisionId.length).toBeGreaterThan(0);
    const seededStorage = openStorage(databasePath);
    try {
      expect(
        seededStorage.getArtifact(seeded.value.initiativeArtifactId),
      ).toMatchObject({
        workspaceId,
        artifactType: "initiative",
      });
      expect(
        seededStorage.getRevision(seeded.value.inputPacketRevisionId),
      ).toMatchObject({
        workspaceId,
        artifactType: "input-packet",
      });
    } finally {
      seededStorage.close();
    }

    const execution = await first.api.execution.start({
      workspaceId,
      inputRevisionIds: [seeded.value.inputPacketRevisionId],
    });
    expect(execution).toMatchObject({
      ok: true,
      value: {
        kind: "execution",
        status: "completed",
        outputRevisionId: expect.any(String),
        reviewId: expect.any(String),
      },
    });
    if (!execution.ok) throw new Error("Expected transformation to succeed");
    const reviewId = execution.value.reviewId;
    if (reviewId === null)
      throw new Error("Expected transformation to open a review");

    const pendingHome = await first.api.workspace.home(workspaceId);
    expect(pendingHome).toMatchObject({
      ok: true,
      value: {
        needsDecision: [
          {
            id: reviewId,
            initiativeTitle: "Build Agent-Ready Studio",
            artifactType: "product-intent",
            status: "decision-needed",
          },
        ],
      },
    });
    const pendingReview = await first.api.review.get(reviewId);
    expect(pendingReview).toMatchObject({
      ok: true,
      value: {
        package: {
          initiativeTitle: "Build Agent-Ready Studio",
          review: { id: reviewId, status: "open" },
          reviewedRevision: {
            id: execution.value.outputRevisionId,
            inputRevisionIds: [seeded.value.inputPacketRevisionId],
          },
          inputs: [
            {
              id: seeded.value.inputPacketRevisionId,
              artifactType: "input-packet",
            },
          ],
        },
      },
    });

    const resolved = await first.api.review.resolve({
      reviewId,
      action: "approve",
    });
    expect(resolved).toMatchObject({
      ok: true,
      value: { reviewId, status: "accepted" },
    });
    if (!resolved.ok) throw new Error("Expected approval to succeed");

    const homeBeforeRestart = await first.api.workspace.home(workspaceId);
    const reviewBeforeRestart = await first.api.review.get(reviewId);
    expect(homeBeforeRestart).toMatchObject({
      ok: true,
      value: {
        needsDecision: [],
        recentlyCompleted: [{ id: reviewId, status: "completed" }],
      },
    });
    expect(reviewBeforeRestart).toMatchObject({
      ok: true,
      value: {
        package: {
          review: { id: reviewId, status: "resolved" },
          acceptedRevision: {
            id: resolved.value.revisionId,
            status: "accepted",
          },
          decisions: [
            {
              id: resolved.value.decisionId,
              actorName: "Local human",
              action: "approve",
            },
          ],
        },
      },
    });
    if (!homeBeforeRestart.ok || !reviewBeforeRestart.ok)
      throw new Error("Expected authoritative state before restart");

    await shutdownWithinFiveSeconds(first.client);

    const restarted = createRealDesktopBoundary(databasePath);
    const homeAfterRestart = await restarted.api.workspace.home(workspaceId);
    const reviewAfterRestart = await restarted.api.review.get(reviewId);
    expect(homeAfterRestart).toEqual(homeBeforeRestart);
    expect(reviewAfterRestart).toEqual(reviewBeforeRestart);
    await shutdownWithinFiveSeconds(restarted.client);
  });

  it("AC-33 reports a killed service as disconnected and recovers on the next request", async () => {
    const directory = mkdtempSync(join(tmpdir(), "agent-ready-e2e-kill-"));
    temporaryDirectories.push(directory);
    const databasePath = join(directory, "studio.db");
    const connections: ManagedStudioConnection[] = [];
    const boundary = createRealDesktopBoundary(databasePath, connections);

    const created = await boundary.api.workspace.create({
      name: "Disconnect workspace",
    });
    if (!created.ok) throw new Error("Expected workspace creation to succeed");
    const workspaceId = created.value.workspace.id;
    expect(connections).toHaveLength(1);

    // Kill the live child and immediately issue a request, without waiting for
    // the exit to be observed. This is the window the transport cannot see
    // through its readable: the write lands on a broken pipe. Before the
    // writable gained an error listener this raised an uncaught exception in
    // the host process rather than producing a disconnected outcome.
    const first = connections[0];
    if (first === undefined) throw new Error("Expected a spawned connection");
    first.terminate("SIGKILL");
    const duringKill = await boundary.api.workspace.home(workspaceId);
    expect(duringKill.ok).toBe(false);
    if (duringKill.ok) throw new Error("Expected the killed service to refuse");
    expect(duringKill.error.kind).toBe("disconnected");

    // The client must recover by spawning a fresh child, and the database the
    // killed process was holding must still serve the same workspace.
    const recovered = await boundary.api.workspace.home(workspaceId);
    expect(recovered).toMatchObject({ ok: true, value: { kind: "home" } });
    expect(connections.length).toBeGreaterThan(1);
    await shutdownWithinFiveSeconds(boundary.client);
  });
});

function createRealDesktopBoundary(
  databasePath: string,
  observedConnections?: ManagedStudioConnection[],
): {
  api: StudioPreloadApi;
  client: StudioMainClient;
} {
  const serviceEntry = fileURLToPath(
    new URL("../../../studio-service/dist/service.js", import.meta.url),
  );
  const client = new StudioMainClient(async () => {
    const connection = await spawnStudioConnection({
      databasePath,
      serviceEntry,
    });
    observedConnections?.push(connection);
    return connection;
  });
  openClients.push(client);
  const handler = createStudioRequestHandler(client);
  const api = createStudioPreloadApi(async (channel, request) => {
    expect(channel).toBe("studio:request");
    return handler(request);
  });
  return { api, client };
}

async function shutdownWithinFiveSeconds(
  client: StudioMainClient,
): Promise<void> {
  const startedAt = Date.now();
  await client.shutdown();
  expect(Date.now() - startedAt).toBeLessThan(5_000);
}
