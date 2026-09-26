import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";

import { openStorage, SCHEMA_MIGRATIONS } from "./storage.js";

const directories: string[] = [];
const freshPath = () => {
  const directory = mkdtempSync(join(tmpdir(), "agent-ready-storage-"));
  directories.push(directory);
  return join(directory, "studio.db");
};

afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe("SQLite storage integration", () => {
  it("round-trips hostile values byte-for-byte through the production write and read paths", () => {
    // The point of this probe is `storage.ts`'s own SQL, not SQLite's parameter
    // binding: every value below goes in through the production write methods
    // and comes back out through the production projection, so replacing any
    // statement in storage.ts with string interpolation breaks it.
    const storage = openStorage(freshPath());
    const now = "2026-09-09T00:00:00.000Z";
    const values = {
      workspaceName: "x'); DROP TABLE workspaces; -- /* ? $1",
      comment: "'); UPDATE decisions SET action='approve'; -- \" ; [] {}",
      title: `x'); DROP TABLE artifact_revisions; --`,
      outcome: "? $1 /* */",
    };

    storage.transaction((tx) => {
      tx.createWorkspace({
        id: "workspace-hostile",
        name: values.workspaceName,
        description: null,
        blueprintId: "product-development",
        blueprintVersion: "1",
        createdAt: now,
        updatedAt: now,
      });
      tx.createActor({
        id: "actor-hostile",
        workspaceId: "workspace-hostile",
        name: "Local human",
        kind: "human",
      });
      tx.createArtifact({
        id: "artifact-hostile",
        workspaceId: "workspace-hostile",
        artifactType: "product-intent",
        title: values.title,
        seedKey: null,
        acceptedRevisionId: null,
      });
      tx.insertRevision({
        id: "revision-hostile",
        artifactId: "artifact-hostile",
        schemaVersion: "1",
        content: { title: values.title, outcome: values.outcome },
        producer: "human",
        transformationId: null,
        inputRevisionIds: [],
        createdAt: now,
      });
      tx.appendLifecycleState({
        revisionId: "revision-hostile",
        status: "proposed",
        occurredAt: now,
      });
      tx.openReview({
        id: "review-hostile",
        revisionId: "revision-hostile",
        status: "open",
        createdAt: now,
      });
      tx.insertReviewComment({
        id: "comment-hostile",
        reviewId: "review-hostile",
        actorId: "actor-hostile",
        body: values.comment,
        createdAt: now,
      });
    });

    const projection = storage.readReview("review-hostile");
    expect(projection).not.toBeNull();
    if (projection === null) throw new Error("Expected a review projection");
    expect(projection.workspace.name).toBe(values.workspaceName);
    expect(projection.artifactTitle).toBe(values.title);
    expect(projection.reviewedRevision.content).toEqual({
      title: values.title,
      outcome: values.outcome,
    });
    expect(projection.comments.map((entry) => entry.body)).toEqual([
      values.comment,
    ]);

    // The tables the hostile SQL named are still there and still populated.
    expect(storage.listWorkspaces().map((entry) => entry.name)).toEqual([
      values.workspaceName,
    ]);
    expect(storage.getRevision("revision-hostile")).not.toBeNull();
    storage.close();
  });

  it("refuses mutation or deletion of insert-only revision and lifecycle rows", () => {
    const path = freshPath();
    const storage = openStorage(path);
    const now = "2026-09-09T00:00:00.000Z";
    storage.transaction((tx) => {
      tx.createWorkspace({
        id: "workspace-1",
        name: "Insert-only workspace",
        description: null,
        blueprintId: "product-development",
        blueprintVersion: "1",
        createdAt: now,
        updatedAt: now,
      });
      tx.createArtifact({
        id: "artifact-1",
        workspaceId: "workspace-1",
        artifactType: "product-intent",
        title: "Insert-only artifact",
        seedKey: null,
        acceptedRevisionId: null,
      });
      tx.insertRevision({
        id: "revision-1",
        artifactId: "artifact-1",
        schemaVersion: "1",
        content: { outcome: "Keep this revision immutable" },
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
    });
    storage.close();

    // Production exposes no revision or lifecycle mutators. Only the forbidden
    // statements use raw SQL; seeding and verification stay on repository paths.
    const database = new Database(path);
    expect(() =>
      database
        .prepare("UPDATE artifact_revisions SET content = ? WHERE id = ?")
        .run("{}", "revision-1"),
    ).toThrowError("artifact revisions are insert-only");
    expect(() =>
      database
        .prepare("DELETE FROM artifact_revisions WHERE id = ?")
        .run("revision-1"),
    ).toThrowError("artifact revisions are insert-only");
    expect(() =>
      database
        .prepare(
          "UPDATE artifact_revision_states SET status = ? WHERE revision_id = ?",
        )
        .run("superseded", "revision-1"),
    ).toThrowError("revision states are insert-only");
    expect(() =>
      database
        .prepare("DELETE FROM artifact_revision_states WHERE revision_id = ?")
        .run("revision-1"),
    ).toThrowError("revision states are insert-only");
    database.close();

    const reopened = openStorage(path);
    expect(reopened.getRevision("revision-1")).toEqual({
      id: "revision-1",
      artifactId: "artifact-1",
      workspaceId: "workspace-1",
      artifactType: "product-intent",
      schemaVersion: "1",
      content: { outcome: "Keep this revision immutable" },
      producer: "human",
      transformationId: null,
      inputRevisionIds: [],
      status: "accepted",
      createdAt: now,
    });
    reopened.close();
  });

  it("enforces foreign keys and unique lineage relations on the connection it opens", () => {
    // Driven through `storage.transaction`, deliberately. SQLite enables foreign
    // keys per connection, so a probe that opens its own connection and sets
    // `foreign_keys = ON` itself evidences only the REFERENCES clauses in the
    // migration — removing the pragma from `openStorage` would leave it green
    // while every production write path started accepting orphan references.
    const storage = openStorage(freshPath());
    const now = "2026-09-09T00:00:00.000Z";
    const relation = (id: string, source: string, target: string) => ({
      id,
      sourceRevisionId: source,
      targetRevisionId: target,
      kind: "input-to" as const,
      label: "lineage",
    });

    // An orphan reference is refused by the repository's own connection.
    expect(() =>
      storage.transaction((tx) => {
        tx.insertRelation(relation("orphan", "missing", "missing"));
      }),
    ).toThrow();

    storage.transaction((tx) => {
      tx.createWorkspace({
        id: "workspace-1",
        name: "Lineage workspace",
        description: null,
        blueprintId: "product-development",
        blueprintVersion: "1",
        createdAt: now,
        updatedAt: now,
      });
      tx.createArtifact({
        id: "artifact-1",
        workspaceId: "workspace-1",
        artifactType: "product-intent",
        title: "Lineage artifact",
        seedKey: null,
        acceptedRevisionId: null,
      });
      tx.insertRevision({
        id: "revision-1",
        artifactId: "artifact-1",
        schemaVersion: "1",
        content: {},
        producer: "human",
        transformationId: null,
        inputRevisionIds: [],
        createdAt: now,
      });
      tx.appendLifecycleState({
        revisionId: "revision-1",
        status: "proposed",
        occurredAt: now,
      });
      tx.insertRelation(relation("relation-1", "revision-1", "revision-1"));
    });

    // The same lineage edge twice is refused by the unique constraint.
    expect(() =>
      storage.transaction((tx) => {
        tx.insertRelation(relation("relation-2", "revision-1", "revision-1"));
      }),
    ).toThrow();

    // The refused writes left nothing behind.
    const projection = storage.getRevision("revision-1");
    expect(projection).not.toBeNull();
    expect(storage.listWorkspaces()).toHaveLength(1);
    storage.close();
  });

  it("rolls back events with their semantic execution write, through the production transaction", () => {
    // Driven through `storage.transaction`, not a transaction the test builds:
    // the contract under test is that the repository's own boundary is atomic,
    // so a probe using its own `database.transaction` would pass even if
    // `storage.transaction` stopped being transactional at all.
    const path = freshPath();
    const storage = openStorage(path);
    const now = "2026-09-09T00:00:00.000Z";
    const writeExecution = (executionId: string, rollback: boolean) =>
      storage.transaction((tx) => {
        tx.createWorkspace({
          id: `workspace-${executionId}`,
          name: "Rollback workspace",
          description: null,
          blueprintId: "product-development",
          blueprintVersion: "1",
          createdAt: now,
          updatedAt: now,
        });
        tx.insertExecution({
          id: executionId,
          workspaceId: `workspace-${executionId}`,
          transformationId: "strategy.frame-product-intent",
          inputRevisionIds: [],
          outputRevisionId: null,
          status: "completed",
          startedAt: now,
          completedAt: now,
        });
        tx.appendExecutionEvent(executionId, {
          sequence: 0,
          kind: "completed",
          message: "Execution completed",
          occurredAt: now,
        });
        if (rollback) throw new Error("rollback");
      });

    expect(() => writeExecution("execution-rolled-back", true)).toThrowError(
      "rollback",
    );
    writeExecution("execution-committed", false);

    // The rolled-back execution left nothing behind: not the execution, not its
    // event, and not the workspace written earlier in the same transaction.
    // Read from the database rather than through a storage method: a
    // rolled-back execution has no production reader — it opens no review — so
    // the rows themselves are the only place the rollback is observable.
    expect(executionRows(path, "execution-rolled-back")).toEqual({
      executions: 0,
      events: 0,
    });
    expect(executionRows(path, "execution-committed")).toEqual({
      executions: 1,
      events: 1,
    });
    expect(storage.listWorkspaces().map((entry) => entry.id)).toEqual([
      "workspace-execution-committed",
    ]);
    storage.close();
  });

  it("migration 4 adds its columns to a populated version-3 database without repeating", () => {
    // The migration tests opened a fresh database for every run, so the ALTER
    // TABLE statements were never exercised against an existing row: a syntax
    // error or a name collision would stay green.
    //
    // Three things this case has to do that an earlier version did not.
    // It builds the version-3 schema from `SCHEMA_MIGRATIONS` rather than from
    // a hand copy, because a hand copy goes on describing a shape production
    // stopped producing. It seeds every pre-existing column with a distinct
    // value, so a later migration that rebuilds the table and loses data
    // reddens here. And it writes an inspector back through the upgraded
    // table, because reading `null` off a column that was never created looks
    // exactly like reading `null` off one that was.
    const path = freshPath();

    const seed = new Database(path);
    seed.pragma("foreign_keys = ON");
    for (const migration of SCHEMA_MIGRATIONS) {
      if (migration.version > 3) break;
      for (const statement of migration.statements) seed.exec(statement);
      seed
        .prepare(
          "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
        )
        .run(migration.version, "2026-09-09T00:00:00.000Z");
    }

    // Every column the version-3 shape has, each with a value nothing else
    // would produce, so "survived the upgrade" means the value and not the
    // column.
    const beforeUpgrade = {
      id: "source-pre-migration",
      owner: "acme",
      repository: "widgets",
      requested_ref: "refs/heads/release",
      resolved_sha: "9".repeat(40),
      inspected_at: "2026-09-24T11:22:33.000Z",
      verdict: "no-verdict",
      condition_value: "inspector-unavailable",
      version_unverified: 1,
      diagnostics: "a diagnostic written before migration 4",
      declared_version_marker: "0.7",
      inspector_contract_version: "1.2",
      provenance: JSON.stringify({
        declaredVersionMarker: "repository-derived",
      }),
    };
    const columns = Object.keys(beforeUpgrade).join(", ");
    const placeholders = Object.keys(beforeUpgrade)
      .map(() => "?")
      .join(", ");
    seed
      .prepare(
        `INSERT INTO connected_sources (${columns}) VALUES (${placeholders})`,
      )
      .run(...Object.values(beforeUpgrade));
    seed.close();

    // First open applies migration 4 -- the two ALTER TABLE statements.
    const storage = openStorage(path);

    const row = storage.getConnectedSource("source-pre-migration");
    expect(row).not.toBeNull();

    // The new columns take their defaults. `absent` is knowingly wrong for a
    // row written where no declaration was read; correcting those rows is
    // registered at `connect-orient-migration-4-backfills-a-value-it-calls-wrong`,
    // so this assertion pins today's behaviour rather than endorsing it.
    expect(row?.declaredVersionState).toBe("absent");
    expect(row?.inspector).toBeNull();

    // Every pre-existing value survives, not merely every column.
    expect(row?.owner).toBe(beforeUpgrade.owner);
    expect(row?.repository).toBe(beforeUpgrade.repository);
    expect(row?.requestedRef).toBe(beforeUpgrade.requested_ref);
    expect(row?.resolvedSha).toBe(beforeUpgrade.resolved_sha);
    expect(row?.inspectedAt).toBe(beforeUpgrade.inspected_at);
    expect(row?.verdict).toBe(beforeUpgrade.verdict);
    expect(row?.condition).toBe(beforeUpgrade.condition_value);
    expect(row?.versionUnverified).toBe(true);
    expect(row?.diagnostics).toBe(beforeUpgrade.diagnostics);
    expect(row?.declaredVersionMarker).toBe(
      beforeUpgrade.declared_version_marker,
    );
    expect(row?.inspectorContractVersion).toBe(
      beforeUpgrade.inspector_contract_version,
    );

    // The `inspector` column has to be writable, not merely readable as null:
    // a missing column reads null and would satisfy the assertion above.
    const inspector = {
      resolvedPath: "/packs/core/scripts/inspect.py",
      packName: "core",
      packVersion: "2.26.14",
      fileDigests: {
        "inspect.py": "a".repeat(64),
        "pack.toml": "b".repeat(64),
      },
    };
    storage.upsertConnectedSource({
      ...(row as NonNullable<typeof row>),
      declaredVersionState: "declared",
      inspector,
    });
    const upgraded = storage.getConnectedSource("source-pre-migration");
    expect(upgraded?.inspector).toEqual(inspector);
    expect(upgraded?.declaredVersionState).toBe("declared");

    storage.close();

    // Second open: migration 4 is already recorded and must not run again.
    // A second ALTER TABLE on the same column would throw, so `openStorage`
    // completing is the assertion.
    const second = openStorage(path);
    expect(
      second.getConnectedSource("source-pre-migration")?.inspector,
    ).toEqual(inspector);
    second.close();
  });

  it("AC-05 keeps no Initiative table for a migration to drift towards", () => {
    // Narrow on purpose. The composition half of AC-05 — an Initiative as a
    // typed artifact whose revision content carries the desired outcome — is
    // asserted against the shape the service actually seeds, in the service
    // integration suite. What only this level can prove is the negative: that
    // there is no initiative-shaped table, which no round-trip through the
    // artifact tables would notice being added.
    const path = freshPath();
    const storage = openStorage(path);
    storage.close();

    const database = new DatabaseSync(path, { readOnly: true });
    try {
      const tables = database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
        )
        .all()
        .map((row) => (row as { name: string }).name);
      expect(tables).toEqual([
        "actors",
        "artifact_revision_states",
        "artifact_revisions",
        "artifacts",
        // Added by migration 3, for Connect and Orient. This list is the
        // anchor that makes a table appearing here a deliberate change.
        "connected_sources",
        "decisions",
        "execution_events",
        "executions",
        "relations",
        "review_comments",
        "reviews",
        "schema_migrations",
        "transformations",
        "workspaces",
      ]);
    } finally {
      database.close();
    }
  });
});

function executionRows(
  path: string,
  executionId: string,
): { executions: number; events: number } {
  const database = new DatabaseSync(path, { readOnly: true });
  try {
    const executions = database
      .prepare("SELECT COUNT(*) AS total FROM executions WHERE id = ?")
      .get(executionId) as { total: number };
    const events = database
      .prepare(
        "SELECT COUNT(*) AS total FROM execution_events WHERE execution_id = ?",
      )
      .get(executionId) as { total: number };
    return { executions: executions.total, events: events.total };
  } finally {
    database.close();
  }
}
