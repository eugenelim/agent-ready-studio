import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { openStorage } from "./storage.js";

describe("SQLite storage", () => {
  it("retains an accepted revision pointer and its decision after close and reopen", () => {
    const directory = mkdtempSync(join(tmpdir(), "agent-ready-storage-"));
    const path = join(directory, "studio.db");
    const first = openStorage(path);
    const now = "2026-09-09T00:00:00.000Z";
    first.transaction((tx) => {
      tx.createWorkspace({
        id: "workspace-1",
        name: "Persistent workspace",
        description: null,
        blueprintId: "product-development",
        blueprintVersion: "1",
        createdAt: now,
        updatedAt: now,
      });
      tx.createActor({
        id: "actor-1",
        workspaceId: "workspace-1",
        name: "Local human",
        kind: "human",
      });
      tx.createArtifact({
        id: "artifact-1",
        workspaceId: "workspace-1",
        artifactType: "product-intent",
        title: "Persistent artifact",
        seedKey: null,
        acceptedRevisionId: null,
      });
      tx.insertRevision({
        id: "revision-1",
        artifactId: "artifact-1",
        schemaVersion: "1",
        content: { outcome: "Retain this decision" },
        producer: "human",
        transformationId: null,
        inputRevisionIds: [],
        createdAt: now,
      });
      tx.appendLifecycleState({
        revisionId: "revision-1",
        status: "accepted",
        occurredAt: now,
      });
      tx.openReview({
        id: "review-1",
        revisionId: "revision-1",
        status: "resolved",
        createdAt: now,
      });
      tx.recordDecision({
        id: "decision-1",
        reviewId: "review-1",
        revisionId: "revision-1",
        actorId: "actor-1",
        action: "approve",
        comment: null,
        createdAt: now,
      });
      tx.updateAcceptedRevision("artifact-1", "revision-1");
    });
    first.close();

    const reopened = openStorage(path);
    expect(reopened.getArtifact("artifact-1")).toEqual({
      id: "artifact-1",
      workspaceId: "workspace-1",
      artifactType: "product-intent",
      title: "Persistent artifact",
      seedKey: null,
      acceptedRevisionId: "revision-1",
    });
    const reviewState = reopened.getReviewState("review-1");
    expect(reviewState).not.toBeNull();
    if (reviewState === null)
      throw new Error("Expected persisted review state");
    expect(reviewState.decisions).toEqual([
      {
        id: "decision-1",
        reviewId: "review-1",
        revisionId: "revision-1",
        actorId: "actor-1",
        actorName: "Local human",
        actorKind: "human",
        action: "approve",
        comment: null,
        createdAt: now,
      },
    ]);
    expect(reviewState.review).toEqual({
      id: "review-1",
      revisionId: "revision-1",
      status: "resolved",
      createdAt: now,
    });
    reopened.close();
    rmSync(directory, { recursive: true, force: true });
  });
});
