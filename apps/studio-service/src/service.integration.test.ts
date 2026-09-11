import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import {
  type StudioNotification,
  StudioTransport,
} from "@agent-ready/protocol";
import { openStorage, type Storage } from "@agent-ready/storage-sqlite";
import { afterEach, describe, expect, it } from "vitest";

import {
  createStudioService,
  type ExecutionStartResult,
  type IdFactory,
  type NotificationPublisher,
  type StudioService,
} from "./service.js";

const timestamp = "2026-09-09T12:00:00.000Z";
const persistedExecutionEvents = [
  {
    sequence: 0,
    kind: "started",
    message: "Execution started",
    occurredAt: timestamp,
  },
  {
    sequence: 1,
    kind: "progress",
    message: "Framing Product Intent",
    occurredAt: timestamp,
  },
  {
    sequence: 2,
    kind: "result",
    message: "Product Intent proposed",
    occurredAt: timestamp,
  },
  {
    sequence: 3,
    kind: "completed",
    message: "Execution completed",
    occurredAt: timestamp,
  },
] as const;
const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe("Studio Service persistence integration", () => {
  it("AC-19 retains the accepted pointer and attributable decision after reopen", () => {
    const harness = createHarness();
    const workspace = harness.service.createWorkspace({
      name: "Persistent workspace",
      description: "Restart proof",
    });
    const seed = harness.service.seedDemo(workspace.id);
    const execution = start(
      harness.service,
      workspace.id,
      seed.inputPacketRevisionId,
    );
    const resolution = harness.service.resolveReview({
      reviewId: execution.review.id,
      revisionId: execution.proposal.id,
      action: "approve",
    });
    expect(resolution.ok).toBe(true);
    if (!resolution.ok) throw new Error("Expected approval to succeed");
    harness.service.close();

    const reopenedStorage = openStorage(harness.path);
    const reopened = createStudioService({
      storage: reopenedStorage,
      idFactory: sequentialIds(),
      clock: () => timestamp,
    });
    const review = reopened.reviewGet(execution.review.id);
    expect(review).toMatchObject({
      review: { status: "resolved" },
      acceptedRevision: { id: execution.proposal.id, status: "accepted" },
      decisions: [
        {
          id: resolution.decisionId,
          revisionId: execution.proposal.id,
          actorId: workspace.actor.id,
          actorName: "Local human",
          actorKind: "human",
          action: "approve",
        },
      ],
      execution: {
        id: execution.executionId,
        status: "completed",
      },
    });
    expect(reopened.homeGet(workspace.id).recentlyCompleted).toMatchObject([
      {
        id: execution.review.id,
        workspaceName: "Persistent workspace",
        status: "completed",
      },
    ]);
    reopened.close();
  });

  it("AC-22 publishes after commit and publishes nothing after rollback", () => {
    const ids = collisionIds("review");
    const notifications: StudioNotification[] = [];
    const committedAtPublication: boolean[] = [];
    let harness: ReturnType<typeof createHarness>;
    harness = createHarness(ids, (notification) => {
      notifications.push(notification);
      if (notification.method === "workspace.created") {
        const workspaceId = (notification.params as { workspaceId: string })
          .workspaceId;
        committedAtPublication.push(
          harness.storage.getWorkspace(workspaceId) !== null,
        );
      } else if (notification.method.startsWith("execution.")) {
        const executionId = (notification.params as { executionId: string })
          .executionId;
        committedAtPublication.push(
          countExecutionRows(harness.path, executionId) === 1,
        );
      } else if (notification.method === "artifact.revision.proposed") {
        const revisionId = (notification.params as { revisionId: string })
          .revisionId;
        committedAtPublication.push(
          harness.storage.getRevision(revisionId) !== null,
        );
      } else if (notification.method === "review.requested") {
        const reviewId = (notification.params as { reviewId: string }).reviewId;
        committedAtPublication.push(
          harness.storage.readReview(reviewId) !== null,
        );
      } else if (notification.method === "decision.recorded") {
        const reviewId = (notification.params as { reviewId: string }).reviewId;
        committedAtPublication.push(
          (harness.storage.readReview(reviewId)?.decisions.length ?? 0) > 0,
        );
      } else if (notification.method === "artifact.revision.accepted") {
        const revisionId = (notification.params as { revisionId: string })
          .revisionId;
        committedAtPublication.push(
          harness.storage.getRevision(revisionId)?.status === "accepted",
        );
      }
    });
    const workspace = harness.service.createWorkspace({
      name: "Rollback workspace",
    });
    const seed = harness.service.seedDemo(workspace.id);
    const first = start(
      harness.service,
      workspace.id,
      seed.inputPacketRevisionId,
    );
    expect(first.status).toBe("completed");
    expect(persistedEvents(harness.service, first.review.id)).toEqual(
      persistedExecutionEvents,
    );
    expect(committedAtPublication).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(
      harness.service.resolveReview({
        reviewId: first.review.id,
        revisionId: first.proposal.id,
        action: "approve",
      }),
    ).toMatchObject({ ok: true, status: "accepted" });
    expect(notifications.map((notification) => notification.method)).toEqual([
      "workspace.created",
      "execution.started",
      "execution.progressed",
      "artifact.revision.proposed",
      "review.requested",
      "execution.completed",
      "decision.recorded",
      "artifact.revision.accepted",
    ]);
    expect(committedAtPublication).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ]);
    const notificationCountBeforeRollback = notifications.length;

    const rolledBack = harness.service.executionStart({
      workspaceId: workspace.id,
      transformationId: "strategy.frame-product-intent",
      inputRevisionIds: [seed.inputPacketRevisionId],
      executorKind: "deterministic",
    });
    expect(rolledBack.status).toBe("failed");
    expect(countExecutionRows(harness.path, rolledBack.executionId)).toBe(0);
    const database = new DatabaseSync(harness.path, { readOnly: true });
    expect(
      database
        .prepare(
          "SELECT COUNT(*) AS eventCount FROM execution_events WHERE execution_id = ?",
        )
        .get(rolledBack.executionId),
    ).toEqual({ eventCount: 0 });
    database.close();
    expect(notifications).toHaveLength(notificationCountBeforeRollback);
    harness.service.close();
  });

  it("AC-17 approves and advances all review state in one transaction", () => {
    const harness = createHarness();
    const workspace = harness.service.createWorkspace({
      name: "Approval workspace",
    });
    const seed = harness.service.seedDemo(workspace.id);
    const first = start(
      harness.service,
      workspace.id,
      seed.inputPacketRevisionId,
    );
    expect(
      harness.service.resolveReview({
        reviewId: first.review.id,
        revisionId: first.proposal.id,
        action: "approve",
      }),
    ).toMatchObject({ ok: true, status: "accepted" });
    const second = start(
      harness.service,
      workspace.id,
      seed.inputPacketRevisionId,
    );
    const beforeContent = required(
      harness.service.reviewGet(first.review.id),
      "Expected first review package",
    ).reviewedRevision.content;
    const result = harness.service.resolveReview({
      reviewId: second.review.id,
      revisionId: second.proposal.id,
      action: "approve",
    });
    expect(result).toMatchObject({ ok: true, status: "accepted" });

    const state = required(
      harness.storage.getReviewState(second.review.id),
      "Expected persisted second review state",
    );
    expect(state.artifact.acceptedRevisionId).toBe(second.proposal.id);
    expect(state.review.status).toBe("resolved");
    expect(state.decisions).toHaveLength(1);
    expect(state.decisions[0]).toMatchObject({
      actorId: workspace.actor.id,
      action: "approve",
    });
    expect(state.lifecycle.slice(-2)).toEqual([
      {
        revisionId: first.proposal.id,
        status: "superseded",
        occurredAt: timestamp,
      },
      {
        revisionId: second.proposal.id,
        status: "accepted",
        occurredAt: timestamp,
      },
    ]);
    expect(state.revisions).toHaveLength(2);
    expect(
      required(
        harness.service.reviewGet(first.review.id),
        "Expected first review package after second approval",
      ).reviewedRevision.content,
    ).toEqual(beforeContent);
    expect(
      required(
        harness.service.reviewGet(second.review.id),
        "Expected second review package after approval",
      ).reviewedRevision.content,
    ).toEqual(second.proposal.content);
    harness.service.close();
  });

  it("AC-06 seeds a versioned Input Packet carrying every field with real content", () => {
    // Field presence alone would pass on a packet of empty strings and empty
    // arrays, which is exactly the placeholder AC-06 forbids, so each field is
    // asserted against its meaningful Agent-Ready Studio value.
    const harness = createHarness();
    const workspace = harness.service.createWorkspace({
      name: "Input packet workspace",
    });
    const seed = harness.service.seedDemo(workspace.id);
    const revision = harness.storage.getRevision(seed.inputPacketRevisionId);
    expect(revision).not.toBeNull();
    if (revision === null) throw new Error("Expected a seeded Input Packet");
    expect(revision.schemaVersion).toBe("1");
    expect(revision.content).toEqual({
      objective: "Build Agent-Ready Studio",
      sourceNotes: "Decision-oriented local desktop product",
      targetUsers: ["Multidisciplinary product teams"],
      knownContext: ["Local-first"],
      constraints: ["No provider required"],
      nonGoals: ["Remote dispatch"],
      expectedOutputArtifactType: "product-intent",
    });
    harness.service.close();
  });

  it("AC-05 and AC-39 seed exactly one Initiative, as a typed artifact carrying its desired outcome", () => {
    const harness = createHarness();
    const workspace = harness.service.createWorkspace({
      name: "Seed workspace",
    });
    const seed = harness.service.seedDemo(workspace.id);
    harness.service.seedDemo(workspace.id);
    expect(harness.service.countInitiatives(workspace.id)).toBe(1);

    // AC-05: the Initiative is an ordinary typed artifact. Its identity is the
    // `initiative` artifact type and its content, not a table of its own — the
    // absence of that table is pinned in the storage suite's schema census.
    const artifact = harness.storage.getArtifact(seed.initiativeArtifactId);
    expect(artifact).not.toBeNull();
    if (artifact === null) throw new Error("Expected a seeded Initiative");
    expect(artifact.artifactType).toBe("initiative");
    expect(artifact.workspaceId).toBe(workspace.id);
    expect(artifact.acceptedRevisionId).not.toBeNull();

    // AC-39: the desired outcome from the Ready brief, asserted as content
    // rather than assumed. Seeding a titled Initiative with no outcome would
    // otherwise satisfy the count above.
    const revision = harness.storage.getRevision(
      artifact.acceptedRevisionId ?? "",
    );
    expect(revision?.content).toEqual({
      title: "Build Agent-Ready Studio",
      desiredOutcome:
        "Turn uncertain product inputs into explicit, reviewable decisions.",
    });

    // Idempotent: the second seed above added neither artifact nor revision.
    expect(harness.service.countInitiatives(workspace.id)).toBe(1);
    harness.service.close();
  });

  it("AC-40 reconstructs every reachable Inbox group after reopen, from rows alone", () => {
    // AC-40's force is "every group", and every group this slice can produce is
    // asserted here from committed rows, with no fixture and no notification
    // history. Amendment 0004 removed the Running group from the contract and
    // from the projection, so the three below are the whole set.
    const harness = createHarness();
    const workspace = harness.service.createWorkspace({
      name: "Inbox workspace",
    });
    const seed = harness.service.seedDemo(workspace.id);

    // Recently completed: an approved review.
    const approved = start(
      harness.service,
      workspace.id,
      seed.inputPacketRevisionId,
    );
    expect(
      harness.service.resolveReview({
        reviewId: approved.review.id,
        revisionId: approved.proposal.id,
        action: "approve",
      }).ok,
    ).toBe(true);

    // Blocked: a review sent back for revision.
    const returned = start(
      harness.service,
      workspace.id,
      seed.inputPacketRevisionId,
    );
    expect(
      harness.service.resolveReview({
        reviewId: returned.review.id,
        revisionId: returned.proposal.id,
        action: "request-revision",
        comment: "Sharpen the guardrails.",
      }).ok,
    ).toBe(true);

    // Needs your decision: a review left open.
    const open = start(
      harness.service,
      workspace.id,
      seed.inputPacketRevisionId,
    );

    harness.service.close();

    const reopenedStorage = openStorage(harness.path);
    const reopened = createStudioService({
      storage: reopenedStorage,
      idFactory: sequentialIds(),
      clock: () => timestamp,
    });
    const home = reopened.homeGet(workspace.id);

    expect(home.needsDecision.map((item) => item.id)).toEqual([open.review.id]);
    expect(home.blocked).toMatchObject([
      { id: returned.review.id, reason: "Revision requested" },
    ]);
    expect(home.recentlyCompleted.map((item) => item.id)).toEqual([
      approved.review.id,
    ]);
    reopened.close();
  });

  it("AC-50 and AC-51 list every review in the workspace, and only that workspace's", () => {
    // The whole Reviews surface and the whole Strategy surface read from this one
    // query, and every renderer test for them supplies its own array. Completeness
    // across the four lifecycle statuses and the workspace predicate are properties
    // of the SQL, so they can only be asserted here.
    const harness = createHarness();
    const mine = harness.service.createWorkspace({ name: "Listed workspace" });
    const theirs = harness.service.createWorkspace({ name: "Other workspace" });
    const mySeed = harness.service.seedDemo(mine.id);
    const theirSeed = harness.service.seedDemo(theirs.id);

    // resolved
    const resolved = start(
      harness.service,
      mine.id,
      mySeed.inputPacketRevisionId,
    );
    expect(
      harness.service.resolveReview({
        reviewId: resolved.review.id,
        revisionId: resolved.proposal.id,
        action: "approve",
      }).ok,
    ).toBe(true);
    // revision-needed
    const returned = start(
      harness.service,
      mine.id,
      mySeed.inputPacketRevisionId,
    );
    expect(
      harness.service.resolveReview({
        reviewId: returned.review.id,
        revisionId: returned.proposal.id,
        action: "request-revision",
        comment: "Not yet.",
      }).ok,
    ).toBe(true);
    // superseded, and the open review that supersedes it
    const superseded = start(
      harness.service,
      mine.id,
      mySeed.inputPacketRevisionId,
    );
    const revised = harness.service.reviseArtifact({
      artifactId: superseded.proposal.artifactId,
      baseRevisionId: superseded.proposal.id,
      content: { ...superseded.proposal.content, outcome: "Revised outcome" },
    });
    expect(revised).toMatchObject({ ok: true });
    if (!revised.ok) throw new Error("Expected the revision to succeed");
    // Another workspace's review, which must not appear below.
    start(harness.service, theirs.id, theirSeed.inputPacketRevisionId);

    const listed = harness.service.reviewList(mine.id);
    expect([...new Set(listed.map((entry) => entry.status))].sort()).toEqual([
      "open",
      "resolved",
      "revision-needed",
      "superseded",
    ]);
    expect(new Set(listed.map((entry) => entry.workspaceId))).toEqual(
      new Set([mine.id]),
    );
    expect(listed.map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        resolved.review.id,
        returned.review.id,
        superseded.review.id,
        revised.reviewId,
      ]),
    );

    // The derived fields the surfaces render, which no query result carries.
    expect(
      listed.map((entry) => [entry.status, entry.reason] as const),
    ).toEqual(
      expect.arrayContaining([
        ["open", "Review requested"],
        ["revision-needed", "Revision requested"],
        ["resolved", "Decision completed"],
        ["superseded", "Decision completed"],
      ]),
    );
    for (const entry of listed) {
      expect(entry.artifactType).toBe("product-intent");
      expect(entry.artifactTitle).toBe("Build Agent-Ready Studio");
      expect(entry.unresolvedQuestionCount).toBe(0);
    }

    // The other workspace sees its own review and nothing of this one.
    const theirList = harness.service.reviewList(theirs.id);
    expect(theirList).toHaveLength(1);
    expect(theirList[0]?.workspaceId).toBe(theirs.id);

    // Unscoped, the list spans both workspaces.
    expect(
      new Set(harness.service.reviewList().map((entry) => entry.workspaceId)),
    ).toEqual(new Set([mine.id, theirs.id]));
    harness.service.close();
  });

  it("AC-14 projects the initiative title and unresolved-question count from rows", () => {
    // Both are derivations, not stored columns: the title comes from a correlated
    // subquery over `artifacts`, the count from parsing `openQuestions` out of
    // revision JSON. Every other assertion on these two fields in the build
    // supplies the value it then asserts, so a constant would have survived.
    const harness = createHarness();
    const workspace = harness.service.createWorkspace({
      name: "Derived workspace",
    });
    const seed = harness.service.seedDemo(workspace.id);
    const execution = start(
      harness.service,
      workspace.id,
      seed.inputPacketRevisionId,
    );

    // A human revision carrying open questions, so the count is non-zero.
    const revised = harness.service.reviseArtifact({
      artifactId: execution.proposal.artifactId,
      baseRevisionId: execution.proposal.id,
      content: {
        ...execution.proposal.content,
        openQuestions: ["Which team pilots first?", "What is the rollback?"],
      },
    });
    expect(revised).toMatchObject({ ok: true });
    if (!revised.ok) throw new Error("Expected the revision to succeed");

    expect(harness.service.homeGet(workspace.id).needsDecision).toMatchObject([
      {
        id: revised.reviewId,
        initiativeTitle: "Build Agent-Ready Studio",
        unresolvedQuestionCount: 2,
      },
    ]);
    harness.service.close();
  });

  it("AC-14 states a missing initiative rather than inventing one", () => {
    // The null branch of the same subquery. A workspace with work but no seeded
    // Initiative is reachable — `demo.seed` is an explicit action, and nothing
    // requires it before an artifact exists — and the renderer already renders
    // "No initiative" for it, against a hand-written fixture.
    const harness = createHarness();
    const workspace = harness.service.createWorkspace({
      name: "Bare workspace",
    });
    const now = timestamp;
    harness.storage.transaction((tx) => {
      tx.createArtifact({
        id: "artifact-bare",
        workspaceId: workspace.id,
        artifactType: "product-intent",
        title: "Unattached Product Intent",
        seedKey: null,
        acceptedRevisionId: null,
      });
      tx.insertRevision({
        id: "revision-bare",
        artifactId: "artifact-bare",
        schemaVersion: "1",
        content: { openQuestions: [] },
        producer: "human",
        transformationId: null,
        inputRevisionIds: [],
        createdAt: now,
      });
      tx.appendLifecycleState({
        revisionId: "revision-bare",
        status: "proposed",
        occurredAt: now,
      });
      tx.openReview({
        id: "review-bare",
        revisionId: "revision-bare",
        status: "open",
        createdAt: now,
      });
    });

    expect(harness.service.homeGet(workspace.id).needsDecision).toMatchObject([
      { id: "review-bare", initiativeTitle: null },
    ]);
    harness.service.close();
  });

  it("AC-41 reconstructs the complete Review Package after reopen, field for field", () => {
    const harness = createHarness();
    const workspace = harness.service.createWorkspace({
      name: "Package workspace",
    });
    const seed = harness.service.seedDemo(workspace.id);
    const first = start(
      harness.service,
      workspace.id,
      seed.inputPacketRevisionId,
    );
    // Accept a human revision rather than the executor's own output. The fake
    // executor is deterministic, so approving its proposal and running it again
    // yields byte-identical content and an empty change summary — the one field
    // AC-41 names that would then be reconstructed vacuously.
    const edited = harness.service.reviseArtifact({
      artifactId: first.proposal.artifactId,
      baseRevisionId: first.proposal.id,
      content: { ...first.proposal.content, outcome: "A clearer outcome" },
    });
    expect(edited).toMatchObject({ ok: true });
    if (!edited.ok) throw new Error("Expected the revision to succeed");
    expect(
      harness.service.resolveReview({
        reviewId: edited.reviewId,
        revisionId: edited.revisionId,
        action: "approve",
      }).ok,
    ).toBe(true);
    // A fresh executor proposal against that accepted baseline: it carries an
    // execution with events, and its content differs from what was accepted.
    const second = start(
      harness.service,
      workspace.id,
      seed.inputPacketRevisionId,
    );
    const before = harness.service.reviewGet(second.review.id);
    expect(before).not.toBeNull();
    if (before === null) throw new Error("Expected a review package");
    harness.service.close();

    const reopenedStorage = openStorage(harness.path);
    const reopened = createStudioService({
      storage: reopenedStorage,
      idFactory: sequentialIds(),
      clock: () => timestamp,
    });
    const after = reopened.reviewGet(second.review.id);

    // Equality with the live projection is the criterion: nothing the running
    // service could see is lost by going through the database and back.
    expect(after).toEqual(before);

    // Equality alone would also hold if both sides were empty, so each field
    // AC-41 enumerates is asserted to carry something.
    expect(after).not.toBeNull();
    if (after === null) throw new Error("Expected a reloaded review package");
    expect(after.reviewedRevision.content).not.toEqual({});
    expect(after.acceptedRevision?.id).toBe(edited.revisionId);
    expect(after.inputs.map((input) => input.id)).toEqual([
      seed.inputPacketRevisionId,
    ]);
    // `inputs` and `evidence` are derived by separate queries, so asserting the
    // first says nothing about the second: emptying `evidence` alone would leave
    // every other assertion here, including the equality above, untouched.
    expect(after.evidence).toMatchObject([
      {
        sourceRevisionId: seed.inputPacketRevisionId,
        targetRevisionId: second.proposal.id,
        kind: "input-to",
        label: "Execution input",
      },
    ]);
    expect(after.changedFields.length).toBeGreaterThan(0);
    expect(after.execution?.startedAt).toBe(timestamp);
    expect(after.execution?.completedAt).toBe(timestamp);
    expect(after.execution?.events.map((event) => event.kind)).toEqual([
      "started",
      "progress",
      "result",
      "completed",
    ]);
    reopened.close();
  });

  it("AC-08 and AC-29 persist byte-identical output and normalized event sequences", () => {
    const harness = createHarness();
    const workspace = harness.service.createWorkspace({
      name: "Deterministic workspace",
    });
    const seed = harness.service.seedDemo(workspace.id);
    const first = start(
      harness.service,
      workspace.id,
      seed.inputPacketRevisionId,
    );
    const second = start(
      harness.service,
      workspace.id,
      seed.inputPacketRevisionId,
    );
    expect(JSON.stringify(first.proposal.content)).toBe(
      JSON.stringify(second.proposal.content),
    );
    expect(first.proposal.content).toEqual({
      title: "Build Agent-Ready Studio",
      outcome: "Build Agent-Ready Studio",
      opportunity: "Decision-oriented local desktop product",
      targetUsers: ["Multidisciplinary product teams"],
      assumptions: ["Local-first"],
      guardrails: ["No provider required"],
      nonGoals: ["Remote dispatch"],
      confidence: "medium",
      openQuestions: [],
    });
    const firstEvents = persistedEvents(harness.service, first.review.id);
    const secondEvents = persistedEvents(harness.service, second.review.id);
    expect(JSON.stringify(firstEvents)).toBe(JSON.stringify(secondEvents));
    expect(firstEvents).toEqual(persistedExecutionEvents);
    expect(secondEvents).toEqual(persistedExecutionEvents);
    expect(
      required(
        harness.service.reviewGet(first.review.id),
        "Expected review package for deterministic execution",
      ).reviewedRevision.inputRevisionIds,
    ).toEqual([seed.inputPacketRevisionId]);
    expect(
      required(
        harness.service.reviewGet(first.review.id),
        "Expected review inputs for deterministic execution",
      ).inputs.map((input) => input.id),
    ).toEqual([seed.inputPacketRevisionId]);
    harness.service.close();
  });

  it("AC-02 and AC-46 persist the local actor and refuse caller identities", () => {
    const harness = createHarness();
    expect(() =>
      harness.service.createWorkspace({
        name: "Rejected workspace",
        actorId: "caller",
      } as never),
    ).toThrowError("Caller-supplied actor identity is not allowed");
    const workspace = harness.service.createWorkspace({
      name: "Actor workspace",
      description: "Actor proof",
    });
    expect(harness.storage.getWorkspace(workspace.id)).toMatchObject({
      name: "Actor workspace",
      description: "Actor proof",
      blueprintId: "product-development",
      blueprintVersion: "1",
    });
    expect(harness.storage.getLocalHumanActor(workspace.id)).toEqual({
      id: workspace.actor.id,
      workspaceId: workspace.id,
      name: "Local human",
      kind: "human",
    });
    const seed = harness.service.seedDemo(workspace.id);
    const execution = start(
      harness.service,
      workspace.id,
      seed.inputPacketRevisionId,
    );
    const before = harness.service.reviewGet(execution.review.id);
    expect(
      harness.service.resolveReview({
        reviewId: execution.review.id,
        revisionId: execution.proposal.id,
        action: "approve",
        actorId: "caller",
      } as never),
    ).toEqual({ ok: false, code: "invalid-actor" });
    expect(
      harness.service.reviseArtifact({
        artifactId: execution.proposal.artifactId,
        baseRevisionId: execution.proposal.id,
        content: execution.proposal.content,
        actorId: "caller",
      } as never),
    ).toEqual({ ok: false, code: "invalid-actor" });
    expect(harness.service.reviewGet(execution.review.id)).toEqual(before);
    harness.service.close();
  });

  it("AC-13 and AC-18 refuse stale, duplicate, and blank decisions without writes", () => {
    const harness = createHarness();
    const workspace = harness.service.createWorkspace({
      name: "Refusal workspace",
    });
    const seed = harness.service.seedDemo(workspace.id);
    const execution = start(
      harness.service,
      workspace.id,
      seed.inputPacketRevisionId,
    );
    const original = harness.service.reviewGet(execution.review.id);
    expect(
      harness.service.resolveReview({
        reviewId: execution.review.id,
        revisionId: "stale-revision",
        action: "approve",
      }),
    ).toEqual({ ok: false, code: "stale-review" });
    expect(harness.service.reviewGet(execution.review.id)).toEqual(original);
    expect(
      harness.service.resolveReview({
        reviewId: execution.review.id,
        revisionId: execution.proposal.id,
        action: "request-revision",
        comment: "   ",
      }),
    ).toEqual({ ok: false, code: "invalid-comment" });
    expect(harness.service.reviewGet(execution.review.id)).toEqual(original);
    expect(
      harness.service.resolveReview({
        reviewId: execution.review.id,
        revisionId: execution.proposal.id,
        action: "approve",
      }),
    ).toMatchObject({ ok: true });
    const resolved = harness.service.reviewGet(execution.review.id);
    expect(
      harness.service.resolveReview({
        reviewId: execution.review.id,
        revisionId: execution.proposal.id,
        action: "approve",
      }),
    ).toEqual({ ok: false, code: "conflict" });
    expect(harness.service.reviewGet(execution.review.id)).toEqual(resolved);
    harness.service.close();
  });

  it("refuses a nonexistent execution input without execution or proposal writes", () => {
    const harness = createHarness();
    const workspace = harness.service.createWorkspace({
      name: "Input workspace",
    });
    const result = harness.service.executionStart({
      workspaceId: workspace.id,
      transformationId: "strategy.frame-product-intent",
      inputRevisionIds: ["missing-revision"],
      executorKind: "deterministic",
    });
    expect(result).toMatchObject({
      status: "failed",
      proposal: null,
      review: null,
      events: [],
    });
    expect(countExecutionRows(harness.path, result.executionId)).toBe(0);
    expect(harness.service.homeGet(workspace.id)).toEqual({
      needsDecision: [],
      blocked: [],
      recentlyCompleted: [],
    });
    harness.service.close();
  });

  it("AC-07 and AC-11 refuse another workspace's input and a non-Input-Packet input", () => {
    // Cross-workspace isolation. The guard is one clause of one condition, and
    // removing it left the whole suite green: nothing else in the build stops a
    // transformation from taking a foreign workspace's revision as its lineage.
    const harness = createHarness();
    const mine = harness.service.createWorkspace({ name: "Guarded workspace" });
    const theirs = harness.service.createWorkspace({
      name: "Foreign workspace",
    });
    const theirSeed = harness.service.seedDemo(theirs.id);
    const mySeed = harness.service.seedDemo(mine.id);

    const foreign = harness.service.executionStart({
      workspaceId: mine.id,
      transformationId: "strategy.frame-product-intent",
      inputRevisionIds: [theirSeed.inputPacketRevisionId],
      executorKind: "deterministic",
    });
    expect(foreign).toMatchObject({
      status: "failed",
      proposal: null,
      review: null,
      events: [],
    });
    expect(countExecutionRows(harness.path, foreign.executionId)).toBe(0);

    // The artifact-type half of the same condition, isolated. Pointing at the
    // seeded Initiative would not isolate it: that content is not a valid Input
    // Packet either, so the refusal would survive the guard's removal and the
    // control would be inert. This revision carries Input Packet content byte for
    // byte and is typed as something else, so only the type check can refuse it.
    const packet = harness.storage.getRevision(mySeed.inputPacketRevisionId);
    expect(packet).not.toBeNull();
    harness.storage.transaction((tx) => {
      tx.createArtifact({
        id: "artifact-mistyped",
        workspaceId: mine.id,
        artifactType: "product-intent",
        title: "Input Packet content under the wrong type",
        seedKey: null,
        acceptedRevisionId: null,
      });
      tx.insertRevision({
        id: "revision-mistyped",
        artifactId: "artifact-mistyped",
        schemaVersion: "1",
        content: packet?.content,
        producer: "human",
        transformationId: null,
        inputRevisionIds: [],
        createdAt: timestamp,
      });
      tx.appendLifecycleState({
        revisionId: "revision-mistyped",
        status: "accepted",
        occurredAt: timestamp,
      });
    });
    const wrongType = harness.service.executionStart({
      workspaceId: mine.id,
      transformationId: "strategy.frame-product-intent",
      inputRevisionIds: ["revision-mistyped"],
      executorKind: "deterministic",
    });
    expect(wrongType).toMatchObject({
      status: "failed",
      proposal: null,
      review: null,
      events: [],
    });
    expect(countExecutionRows(harness.path, wrongType.executionId)).toBe(0);

    // Neither refusal left anything behind in either workspace.
    expect(harness.service.reviewList(mine.id)).toEqual([]);
    expect(harness.service.reviewList(theirs.id)).toEqual([]);
    harness.service.close();
  });

  it("AC-11 refuses an empty execution input set without writes", () => {
    const harness = createHarness();
    const workspace = harness.service.createWorkspace({
      name: "Empty input workspace",
    });

    const result = harness.service.executionStart({
      workspaceId: workspace.id,
      transformationId: "strategy.frame-product-intent",
      inputRevisionIds: [],
      executorKind: "deterministic",
    });

    expect(result).toMatchObject({
      status: "failed",
      proposal: null,
      review: null,
      events: [],
    });
    expect(countExecutionRows(harness.path, result.executionId)).toBe(0);
    expect(harness.service.homeGet(workspace.id)).toEqual({
      needsDecision: [],
      blocked: [],
      recentlyCompleted: [],
    });
    harness.service.close();
  });

  it("persists request-revision with its comment and attributable decision", () => {
    const harness = createHarness();
    const workspace = harness.service.createWorkspace({
      name: "Revision workspace",
    });
    const seed = harness.service.seedDemo(workspace.id);
    const execution = start(
      harness.service,
      workspace.id,
      seed.inputPacketRevisionId,
    );
    expect(
      harness.service.resolveReview({
        reviewId: execution.review.id,
        revisionId: execution.proposal.id,
        action: "request-revision",
        comment: "Clarify the release guardrail",
      }),
    ).toMatchObject({ ok: true, status: "revision-needed" });
    harness.service.close();

    const reopenedStorage = openStorage(harness.path);
    const review = reopenedStorage.readReview(execution.review.id);
    expect(review).toMatchObject({
      review: { status: "revision-needed" },
      reviewedRevision: { id: execution.proposal.id, status: "proposed" },
      acceptedRevision: null,
      comments: [
        {
          actorId: workspace.actor.id,
          body: "Clarify the release guardrail",
        },
      ],
      decisions: [
        {
          actorId: workspace.actor.id,
          action: "request-revision",
          comment: "Clarify the release guardrail",
        },
      ],
    });
    const reopenedService = createStudioService({
      storage: reopenedStorage,
      idFactory: sequentialIds(),
      clock: () => timestamp,
    });
    const home = reopenedService.homeGet(workspace.id);
    expect(home.needsDecision).toEqual([]);
    expect(home.blocked).toMatchObject([
      {
        id: execution.review.id,
        status: "revision-needed",
        reason: "Revision requested",
      },
    ]);
    reopenedService.close();
  });

  it("creates a human proposal from the exact base and supersedes its open review", () => {
    const harness = createHarness();
    const workspace = harness.service.createWorkspace({
      name: "Edit workspace",
    });
    const seed = harness.service.seedDemo(workspace.id);
    const execution = start(
      harness.service,
      workspace.id,
      seed.inputPacketRevisionId,
    );
    const content = {
      ...execution.proposal.content,
      outcome: "A clearer reviewed outcome",
    };
    const revised = harness.service.reviseArtifact({
      artifactId: execution.proposal.artifactId,
      baseRevisionId: execution.proposal.id,
      content,
    });
    expect(revised).toMatchObject({ ok: true });
    if (!revised.ok) throw new Error("Expected revision to succeed");
    expect(harness.service.reviewGet(execution.review.id)).toMatchObject({
      review: { status: "superseded" },
      reviewedRevision: { id: execution.proposal.id },
    });
    expect(harness.service.reviewGet(revised.reviewId)).toMatchObject({
      review: { status: "open" },
      reviewedRevision: {
        id: revised.revisionId,
        producer: workspace.actor.id,
        transformationId: null,
        inputRevisionIds: [execution.proposal.id],
        content,
      },
      acceptedRevision: null,
      inputs: [{ id: execution.proposal.id }],
    });
    expect(harness.service.homeGet(workspace.id)).toMatchObject({
      needsDecision: [{ id: revised.reviewId }],
      recentlyCompleted: [
        {
          id: execution.review.id,
          reason: "Review superseded",
          status: "completed",
        },
      ],
    });
    const before = harness.service.reviewGet(revised.reviewId);
    expect(
      harness.service.reviseArtifact({
        artifactId: execution.proposal.artifactId,
        baseRevisionId: "stale-base",
        content,
      }),
    ).toEqual({ ok: false, code: "stale-base" });
    expect(harness.service.reviewGet(revised.reviewId)).toEqual(before);
    harness.service.close();
  });
});

describe("Studio Service stdio process", () => {
  it("AC-32 serves, reloads, and closes cleanly within five seconds", async () => {
    const directory = mkdtempSync(
      join(tmpdir(), "agent-ready-service-process-"),
    );
    directories.push(directory);
    const databasePath = join(directory, "studio.db");
    const serviceEntry = fileURLToPath(
      new URL("../dist/service.js", import.meta.url),
    );
    const child = spawn(process.execPath, [serviceEntry], {
      env: { STUDIO_DATABASE_PATH: databasePath },
      stdio: ["pipe", "pipe", "pipe"],
    });
    if (!child.stdin || !child.stdout || !child.stderr)
      throw new Error("Expected all service stdio streams to be piped");
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    const transport = new StudioTransport(
      { readable: child.stdout, writable: child.stdin },
      2_000,
    );

    await expect(transport.handshake("studio-service-test")).resolves.toEqual({
      kind: "hello",
      protocolVersion: "1",
      serviceVersion: "0.1.0",
    });
    await expect(transport.request("health.get", {})).resolves.toEqual({
      kind: "health",
      status: "ok",
      protocolVersion: "1",
    });
    const workspaceResult = await transport.request("workspace.create", {
      name: "Spawned workspace",
      description: "Real child process",
      blueprintId: "product-development",
      blueprintVersion: "1",
    });
    const workspaceId = workspaceResult.workspace.id;
    const seed = await transport.request("demo.seed", { workspaceId });
    const execution = await transport.request("execution.start", {
      workspaceId,
      transformationId: "strategy.frame-product-intent",
      inputRevisionIds: [seed.inputPacketRevisionId],
      executorKind: "deterministic",
    });
    expect(execution.status).toBe("completed");
    const reviewId = execution.reviewId;
    if (reviewId === null)
      throw new Error("Expected completed execution to open a review");
    const home = await transport.request("home.get", { workspaceId });
    expect(home.needsDecision).toHaveLength(1);
    const review = await transport.request("review.get", {
      id: reviewId,
    });
    expect((review.package.review as { status: string }).status).toBe("open");
    // AC-41 requires the reconstructed Review Package to carry normalized
    // events. This is the only place the protocol projection of them is
    // observable — `service.reviewGet` returns the storage projection, and the
    // mapping onto the wire shape is a separate step the renderer's Run details
    // tab consumes.
    expect(
      (
        review.package.execution as {
          events: { sequence: number; kind: string; message: string }[];
        }
      ).events.map(({ sequence, kind, message }) => ({
        sequence,
        kind,
        message,
      })),
    ).toEqual(
      persistedExecutionEvents.map(({ sequence, kind, message }) => ({
        sequence,
        kind,
        message,
      })),
    );
    await expect(
      transport.request("review.resolve", {
        reviewId,
        action: "approve",
      }),
    ).resolves.toMatchObject({ status: "accepted" });
    const resolved = await transport.request("review.get", {
      id: reviewId,
    });
    expect(resolved.package).toMatchObject({
      review: { status: "resolved" },
      decisions: [{ actorName: "Local human", action: "approve" }],
    });

    const exitPromise = waitForExit(child, 5_000);
    const shutdownStartedAt = Date.now();
    transport.shutdown();
    const exit = await exitPromise;
    expect(Date.now() - shutdownStartedAt).toBeLessThan(5_000);
    expect(exit).toMatchObject({ code: 0, signal: null });
    const lines = stdout.trim().split("\n");
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines)
      expect(JSON.parse(line)).toMatchObject({ jsonrpc: "2.0" });
    expect(stderr).not.toContain("Studio Service failed");

    const reopened = openStorage(databasePath);
    expect(reopened.getWorkspace(workspaceId)).toMatchObject({
      name: "Spawned workspace",
    });
    reopened.close();

    const restartedChild = spawn(process.execPath, [serviceEntry], {
      env: { STUDIO_DATABASE_PATH: databasePath },
      stdio: ["pipe", "pipe", "pipe"],
    });
    if (
      !restartedChild.stdin ||
      !restartedChild.stdout ||
      !restartedChild.stderr
    )
      throw new Error("Expected restarted service stdio streams to be piped");
    let restartedStdout = "";
    let restartedStderr = "";
    restartedChild.stdout.on("data", (chunk) => {
      restartedStdout += String(chunk);
    });
    restartedChild.stderr.on("data", (chunk) => {
      restartedStderr += String(chunk);
    });
    const restartedTransport = new StudioTransport(
      { readable: restartedChild.stdout, writable: restartedChild.stdin },
      2_000,
    );
    await restartedTransport.handshake("studio-service-reconnect-test");
    await expect(
      restartedTransport.request("home.get", { workspaceId }),
    ).resolves.toMatchObject({
      recentlyCompleted: [{ id: execution.reviewId }],
    });
    await expect(
      restartedTransport.request("review.get", { id: reviewId }),
    ).resolves.toMatchObject({
      package: {
        review: { status: "resolved" },
        decisions: [{ actorName: "Local human", action: "approve" }],
      },
    });
    const restartedExitPromise = waitForExit(restartedChild, 5_000);
    restartedTransport.shutdown();
    await expect(restartedExitPromise).resolves.toMatchObject({
      code: 0,
      signal: null,
    });
    for (const line of restartedStdout.trim().split("\n"))
      expect(JSON.parse(line)).toMatchObject({ jsonrpc: "2.0" });
    expect(restartedStderr).not.toContain("Studio Service failed");
  });

  it("AC-32 sends a startup diagnostic to stderr without corrupting stdout", async () => {
    const directory = mkdtempSync(join(tmpdir(), "agent-ready-service-error-"));
    directories.push(directory);
    const serviceEntry = fileURLToPath(
      new URL("../dist/service.js", import.meta.url),
    );
    const child = spawn(process.execPath, [serviceEntry], {
      env: { STUDIO_DATABASE_PATH: directory },
      stdio: ["pipe", "pipe", "pipe"],
    });
    if (!child.stdout || !child.stderr)
      throw new Error("Expected service output streams to be piped");
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    const exit = await waitForExit(child, 5_000);
    expect(exit.code).not.toBe(0);
    expect(stdout).toBe("");
    expect(stderr.trim().length).toBeGreaterThan(0);
  });
});

function createHarness(
  idFactory = sequentialIds(),
  publish?: NotificationPublisher,
): {
  path: string;
  storage: Storage;
  service: StudioService;
} {
  const directory = mkdtempSync(join(tmpdir(), "agent-ready-service-"));
  directories.push(directory);
  const path = join(directory, "studio.db");
  const storage = openStorage(path);
  return {
    path,
    storage,
    service: createStudioService({
      storage,
      idFactory,
      clock: () => timestamp,
      publish,
    }),
  };
}

function start(
  service: StudioService,
  workspaceId: string,
  inputRevisionId: string,
): CompletedExecution {
  const execution = service.executionStart({
    workspaceId,
    transformationId: "strategy.frame-product-intent",
    inputRevisionIds: [inputRevisionId],
    executorKind: "deterministic",
  });
  if (
    execution.status !== "completed" ||
    execution.proposal === null ||
    execution.review === null
  )
    throw new Error(
      "Expected execution to complete with a proposal and review",
    );
  return {
    ...execution,
    status: "completed",
    proposal: execution.proposal,
    review: execution.review,
  };
}

type CompletedExecution = Omit<
  ExecutionStartResult,
  "proposal" | "review" | "status"
> & {
  status: "completed";
  proposal: NonNullable<ExecutionStartResult["proposal"]>;
  review: NonNullable<ExecutionStartResult["review"]>;
};

// Reads the persisted event sequence through the reader production actually
// serves — `reviewGet`'s `execution.events`, which is what the Run details tab
// consumes. Asserting through a storage method the service never calls would
// leave that projection unpinned.
function persistedEvents(service: StudioService, reviewId: string): unknown[] {
  const review = required(
    service.reviewGet(reviewId),
    "Expected a review package",
  );
  return required(review.execution, "Expected an execution on the package")
    .events;
}

// Absence has no production reader: a refused execution opens no review, so the
// database itself is the only place the no-writes clause is observable.
function countExecutionRows(path: string, executionId: string): number {
  const database = new DatabaseSync(path, { readOnly: true });
  try {
    const row = database
      .prepare("SELECT COUNT(*) AS total FROM executions WHERE id = ?")
      .get(executionId) as { total: number };
    return row.total;
  } finally {
    database.close();
  }
}

function required<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) throw new Error(message);
  return value;
}

function sequentialIds(): IdFactory {
  const counters = new Map<string, number>();
  return (prefix) => {
    const next = (counters.get(prefix) ?? 0) + 1;
    counters.set(prefix, next);
    return `${prefix}-${next}`;
  };
}

function collisionIds(collidingPrefix: string): IdFactory {
  const regular = sequentialIds();
  return (prefix) =>
    prefix === collidingPrefix
      ? `${collidingPrefix}-collision`
      : regular(prefix);
}

function waitForExit(
  child: ReturnType<typeof spawn>,
  timeoutMs: number,
): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Service did not exit within ${timeoutMs} ms`));
    }, timeoutMs);
    child.once("exit", (code, signal) => {
      clearTimeout(timeout);
      resolve({ code, signal });
    });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}
