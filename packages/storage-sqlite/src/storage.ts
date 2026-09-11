import Database from "better-sqlite3";

export type WorkspaceRecord = {
  id: string;
  name: string;
  description: string | null;
  blueprintId: string;
  blueprintVersion: string;
  createdAt: string;
  updatedAt: string;
};
export type ActorRecord = {
  id: string;
  workspaceId: string;
  name: string;
  kind: "human" | "agent" | "deterministic" | "external";
};
export type ArtifactRecord = {
  id: string;
  workspaceId: string;
  artifactType: string;
  title: string;
  seedKey: string | null;
  acceptedRevisionId: string | null;
};
export type RevisionStatus =
  | "draft"
  | "proposed"
  | "accepted"
  | "rejected"
  | "superseded";
export type RevisionRecord = {
  id: string;
  artifactId: string;
  workspaceId: string;
  artifactType: string;
  schemaVersion: string;
  content: unknown;
  producer: string;
  transformationId: string | null;
  inputRevisionIds: string[];
  status: RevisionStatus;
  createdAt: string;
};
export type LifecycleRecord = {
  revisionId: string;
  status: RevisionStatus;
  occurredAt: string;
};
export type RelationRecord = {
  id: string;
  sourceRevisionId: string;
  targetRevisionId: string;
  kind: "input-to" | "evidence-for" | "supersedes";
  label: string;
};
export type ReviewRecord = {
  id: string;
  revisionId: string;
  status: "open" | "revision-needed" | "resolved" | "superseded";
  createdAt: string;
};
export type ReviewSummaryRecord = ReviewRecord & {
  workspaceId: string;
  artifactId: string;
  artifactTitle: string;
  artifactType: string;
  reason: string;
  producer: string;
  unresolvedQuestionCount: number;
};
export type ReviewCommentRecord = {
  id: string;
  reviewId: string;
  actorId: string;
  body: string;
  createdAt: string;
};
export type DecisionRecord = {
  id: string;
  reviewId: string;
  revisionId: string;
  actorId: string;
  actorName: string;
  actorKind: ActorRecord["kind"];
  action: "approve" | "request-revision";
  comment: string | null;
  createdAt: string;
};
export type ExecutionEventRecord = {
  sequence: number;
  kind: "started" | "progress" | "result" | "completed" | "failed";
  message: string;
  occurredAt: string;
};
export type ExecutionRecord = {
  id: string;
  workspaceId: string;
  transformationId: string;
  inputRevisionIds: string[];
  outputRevisionId: string | null;
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt: string | null;
  events: ExecutionEventRecord[];
};
export type ReviewState = {
  artifact: ArtifactRecord;
  review: ReviewRecord;
  revisions: RevisionRecord[];
  lifecycle: LifecycleRecord[];
  decisions: DecisionRecord[];
};
export type HomeItem = {
  kind: "review";
  id: string;
  workspaceId: string;
  workspaceName: string;
  initiativeTitle: string | null;
  title: string;
  artifactType: string;
  reason: string;
  producer: string;
  transformationId: string | null;
  status: "decision-needed" | "revision-needed" | "completed";
  createdAt: string;
  unresolvedQuestionCount: number;
};
export type HomeProjection = {
  needsDecision: HomeItem[];
  blocked: HomeItem[];
  recentlyCompleted: HomeItem[];
};
export type ReviewProjection = {
  review: ReviewRecord;
  workspace: WorkspaceRecord;
  initiativeTitle: string;
  artifactTitle: string;
  artifactType: string;
  reviewedRevision: RevisionRecord;
  acceptedRevision: RevisionRecord | null;
  inputs: RevisionRecord[];
  evidence: RelationRecord[];
  comments: ReviewCommentRecord[];
  decisions: DecisionRecord[];
  changedFields: string[];
  execution: ExecutionRecord | null;
};

type NewRevision = Omit<
  RevisionRecord,
  "workspaceId" | "artifactType" | "status"
>;
type NewDecision = Omit<DecisionRecord, "actorName" | "actorKind">;
type NewExecution = Omit<ExecutionRecord, "events">;

export type StorageTransaction = {
  createWorkspace(workspace: WorkspaceRecord): void;
  createActor(actor: ActorRecord): void;
  createArtifact(artifact: ArtifactRecord): void;
  insertRevision(revision: NewRevision): void;
  appendLifecycleState(entry: LifecycleRecord): void;
  insertRelation(relation: RelationRecord): void;
  openReview(review: ReviewRecord): void;
  updateReviewStatus(reviewId: string, status: ReviewRecord["status"]): void;
  insertReviewComment(comment: ReviewCommentRecord): void;
  recordDecision(decision: NewDecision): void;
  updateAcceptedRevision(artifactId: string, revisionId: string): void;
  insertExecution(execution: NewExecution): void;
  updateExecution(input: {
    executionId: string;
    status: ExecutionRecord["status"];
    outputRevisionId: string | null;
    completedAt: string;
  }): void;
  appendExecutionEvent(executionId: string, event: ExecutionEventRecord): void;
  getWorkspace(workspaceId: string): WorkspaceRecord | null;
  getLocalHumanActor(workspaceId: string): ActorRecord | null;
  findArtifactBySeedKey(
    workspaceId: string,
    seedKey: string,
  ): ArtifactRecord | null;
  countArtifactsByType(workspaceId: string, artifactType: string): number;
  getArtifact(artifactId: string): ArtifactRecord | null;
  getRevision(revisionId: string): RevisionRecord | null;
  getReviewByRevision(revisionId: string): ReviewRecord | null;
  getReviewState(reviewId: string): ReviewState | null;
};

export type Storage = StorageTransaction & {
  transaction<T>(work: (storage: StorageTransaction) => T): T;
  listWorkspaces(): WorkspaceRecord[];
  listReviews(workspaceId?: string): ReviewSummaryRecord[];
  readHome(workspaceId?: string): HomeProjection;
  readReview(reviewId: string): ReviewProjection | null;
  close(): void;
};

const migrations = [
  {
    version: 1,
    statements: [
      `CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);`,
      `CREATE TABLE workspaces (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, blueprint_id TEXT NOT NULL, blueprint_version TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`,
      `CREATE TABLE actors (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES workspaces(id), name TEXT NOT NULL, kind TEXT NOT NULL);`,
      `CREATE TABLE artifacts (id TEXT PRIMARY KEY, workspace_id TEXT REFERENCES workspaces(id), accepted_revision_id TEXT);`,
      `CREATE TABLE artifact_revisions (id TEXT PRIMARY KEY, artifact_id TEXT NOT NULL REFERENCES artifacts(id), schema_version TEXT NOT NULL, content TEXT NOT NULL, producer TEXT NOT NULL, transformation_id TEXT, input_revision_ids TEXT NOT NULL, created_at TEXT NOT NULL);`,
      `CREATE TABLE artifact_revision_states (id INTEGER PRIMARY KEY, revision_id TEXT NOT NULL REFERENCES artifact_revisions(id), status TEXT NOT NULL, occurred_at TEXT NOT NULL);`,
      `CREATE TABLE relations (id TEXT PRIMARY KEY, source_revision_id TEXT NOT NULL REFERENCES artifact_revisions(id), target_revision_id TEXT NOT NULL REFERENCES artifact_revisions(id), kind TEXT NOT NULL, label TEXT NOT NULL, UNIQUE(source_revision_id, target_revision_id, kind));`,
      `CREATE TABLE reviews (id TEXT PRIMARY KEY, revision_id TEXT NOT NULL REFERENCES artifact_revisions(id), status TEXT NOT NULL);`,
      `CREATE TABLE review_comments (id TEXT PRIMARY KEY, review_id TEXT NOT NULL REFERENCES reviews(id), actor_id TEXT NOT NULL REFERENCES actors(id), body TEXT NOT NULL, created_at TEXT NOT NULL);`,
      `CREATE TABLE decisions (id TEXT PRIMARY KEY, review_id TEXT NOT NULL REFERENCES reviews(id), revision_id TEXT NOT NULL REFERENCES artifact_revisions(id), actor_id TEXT NOT NULL REFERENCES actors(id), action TEXT NOT NULL, comment TEXT, created_at TEXT NOT NULL);`,
      `CREATE TABLE transformations (id TEXT PRIMARY KEY, definition TEXT NOT NULL);`,
      `CREATE TABLE executions (id TEXT PRIMARY KEY, status TEXT NOT NULL);`,
      `CREATE TABLE execution_events (id INTEGER PRIMARY KEY, execution_id TEXT NOT NULL REFERENCES executions(id), sequence INTEGER NOT NULL, kind TEXT NOT NULL, message TEXT NOT NULL, occurred_at TEXT NOT NULL, UNIQUE(execution_id, sequence));`,
      `CREATE TRIGGER artifact_revisions_insert_only_update BEFORE UPDATE ON artifact_revisions BEGIN SELECT RAISE(ABORT, 'artifact revisions are insert-only'); END;`,
      `CREATE TRIGGER artifact_revisions_insert_only_delete BEFORE DELETE ON artifact_revisions BEGIN SELECT RAISE(ABORT, 'artifact revisions are insert-only'); END;`,
      `CREATE TRIGGER artifact_revision_states_insert_only_update BEFORE UPDATE ON artifact_revision_states BEGIN SELECT RAISE(ABORT, 'revision states are insert-only'); END;`,
      `CREATE TRIGGER artifact_revision_states_insert_only_delete BEFORE DELETE ON artifact_revision_states BEGIN SELECT RAISE(ABORT, 'revision states are insert-only'); END;`,
    ],
  },
  {
    version: 2,
    statements: [
      `ALTER TABLE artifacts ADD COLUMN artifact_type TEXT NOT NULL DEFAULT 'unknown';`,
      `ALTER TABLE artifacts ADD COLUMN title TEXT NOT NULL DEFAULT '';`,
      `ALTER TABLE artifacts ADD COLUMN seed_key TEXT;`,
      `CREATE UNIQUE INDEX artifacts_workspace_seed_key ON artifacts(workspace_id, seed_key) WHERE seed_key IS NOT NULL;`,
      `ALTER TABLE reviews ADD COLUMN created_at TEXT NOT NULL DEFAULT '2026-09-09T00:00:00.000Z';`,
      `CREATE UNIQUE INDEX reviews_revision_id ON reviews(revision_id);`,
      `CREATE UNIQUE INDEX decisions_review_id ON decisions(review_id);`,
      `ALTER TABLE executions ADD COLUMN workspace_id TEXT REFERENCES workspaces(id);`,
      `ALTER TABLE executions ADD COLUMN transformation_id TEXT;`,
      `ALTER TABLE executions ADD COLUMN input_revision_ids TEXT NOT NULL DEFAULT '[]';`,
      `ALTER TABLE executions ADD COLUMN output_revision_id TEXT;`,
      `ALTER TABLE executions ADD COLUMN started_at TEXT NOT NULL DEFAULT '2026-09-09T00:00:00.000Z';`,
      `ALTER TABLE executions ADD COLUMN completed_at TEXT;`,
    ],
  },
] as const;

export function openStorage(path: string): Storage {
  const database = new Database(path);
  database.pragma("foreign_keys = ON");
  migrate(database);

  const operations: StorageTransaction = {
    createWorkspace(value) {
      database
        .prepare(
          "INSERT INTO workspaces (id, name, description, blueprint_id, blueprint_version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .run(
          value.id,
          value.name,
          value.description,
          value.blueprintId,
          value.blueprintVersion,
          value.createdAt,
          value.updatedAt,
        );
    },
    createActor(value) {
      database
        .prepare(
          "INSERT INTO actors (id, workspace_id, name, kind) VALUES (?, ?, ?, ?)",
        )
        .run(value.id, value.workspaceId, value.name, value.kind);
    },
    createArtifact(value) {
      database
        .prepare(
          "INSERT INTO artifacts (id, workspace_id, accepted_revision_id, artifact_type, title, seed_key) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(
          value.id,
          value.workspaceId,
          value.acceptedRevisionId,
          value.artifactType,
          value.title,
          value.seedKey,
        );
    },
    insertRevision(value) {
      database
        .prepare(
          "INSERT INTO artifact_revisions (id, artifact_id, schema_version, content, producer, transformation_id, input_revision_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .run(
          value.id,
          value.artifactId,
          value.schemaVersion,
          json(value.content),
          value.producer,
          value.transformationId,
          json(value.inputRevisionIds),
          value.createdAt,
        );
    },
    appendLifecycleState(value) {
      database
        .prepare(
          "INSERT INTO artifact_revision_states (revision_id, status, occurred_at) VALUES (?, ?, ?)",
        )
        .run(value.revisionId, value.status, value.occurredAt);
    },
    insertRelation(value) {
      database
        .prepare(
          "INSERT INTO relations (id, source_revision_id, target_revision_id, kind, label) VALUES (?, ?, ?, ?, ?)",
        )
        .run(
          value.id,
          value.sourceRevisionId,
          value.targetRevisionId,
          value.kind,
          value.label,
        );
    },
    openReview(value) {
      database
        .prepare(
          "INSERT INTO reviews (id, revision_id, status, created_at) VALUES (?, ?, ?, ?)",
        )
        .run(value.id, value.revisionId, value.status, value.createdAt);
    },
    updateReviewStatus(reviewId, status) {
      requireOne(
        database
          .prepare("UPDATE reviews SET status = ? WHERE id = ?")
          .run(status, reviewId).changes,
        "review",
      );
    },
    insertReviewComment(value) {
      database
        .prepare(
          "INSERT INTO review_comments (id, review_id, actor_id, body, created_at) VALUES (?, ?, ?, ?, ?)",
        )
        .run(
          value.id,
          value.reviewId,
          value.actorId,
          value.body,
          value.createdAt,
        );
    },
    recordDecision(value) {
      database
        .prepare(
          "INSERT INTO decisions (id, review_id, revision_id, actor_id, action, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .run(
          value.id,
          value.reviewId,
          value.revisionId,
          value.actorId,
          value.action,
          value.comment,
          value.createdAt,
        );
    },
    updateAcceptedRevision(artifactId, revisionId) {
      requireOne(
        database
          .prepare("UPDATE artifacts SET accepted_revision_id = ? WHERE id = ?")
          .run(revisionId, artifactId).changes,
        "artifact",
      );
    },
    insertExecution(value) {
      database
        .prepare(
          "INSERT INTO executions (id, status, workspace_id, transformation_id, input_revision_ids, output_revision_id, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .run(
          value.id,
          value.status,
          value.workspaceId || null,
          value.transformationId || null,
          json(value.inputRevisionIds),
          value.outputRevisionId,
          value.startedAt,
          value.completedAt,
        );
    },
    updateExecution(value) {
      requireOne(
        database
          .prepare(
            "UPDATE executions SET status = ?, output_revision_id = ?, completed_at = ? WHERE id = ?",
          )
          .run(
            value.status,
            value.outputRevisionId,
            value.completedAt,
            value.executionId,
          ).changes,
        "execution",
      );
    },
    appendExecutionEvent(executionId, value) {
      database
        .prepare(
          "INSERT INTO execution_events (execution_id, sequence, kind, message, occurred_at) VALUES (?, ?, ?, ?, ?)",
        )
        .run(
          executionId,
          value.sequence,
          value.kind,
          value.message,
          value.occurredAt,
        );
    },
    getWorkspace(workspaceId) {
      return optional(
        database
          .prepare(
            "SELECT id, name, description, blueprint_id, blueprint_version, created_at, updated_at FROM workspaces WHERE id = ?",
          )
          .get(workspaceId),
        workspaceFromRow,
      );
    },
    getLocalHumanActor(workspaceId) {
      return optional(
        database
          .prepare(
            "SELECT id, workspace_id, name, kind FROM actors WHERE workspace_id = ? AND kind = ? ORDER BY id LIMIT 1",
          )
          .get(workspaceId, "human"),
        actorFromRow,
      );
    },
    findArtifactBySeedKey(workspaceId, seedKey) {
      return optional(
        database
          .prepare(
            "SELECT id, workspace_id, accepted_revision_id, artifact_type, title, seed_key FROM artifacts WHERE workspace_id = ? AND seed_key = ?",
          )
          .get(workspaceId, seedKey),
        artifactFromRow,
      );
    },
    countArtifactsByType(workspaceId, artifactType) {
      return count(
        database
          .prepare(
            "SELECT COUNT(*) AS count FROM artifacts WHERE workspace_id = ? AND artifact_type = ?",
          )
          .get(workspaceId, artifactType),
      );
    },
    getArtifact(artifactId) {
      return optional(
        database
          .prepare(
            "SELECT id, workspace_id, accepted_revision_id, artifact_type, title, seed_key FROM artifacts WHERE id = ?",
          )
          .get(artifactId),
        artifactFromRow,
      );
    },
    getRevision(revisionId) {
      return optional(
        database.prepare(revisionSql("WHERE r.id = ?")).get(revisionId),
        revisionFromRow,
      );
    },
    getReviewByRevision(revisionId) {
      return optional(
        database
          .prepare(
            "SELECT id, revision_id, status, created_at FROM reviews WHERE revision_id = ? ORDER BY created_at DESC, id DESC LIMIT 1",
          )
          .get(revisionId),
        reviewFromRow,
      );
    },
    getReviewState(reviewId) {
      const review = optional(
        database
          .prepare(
            "SELECT id, revision_id, status, created_at FROM reviews WHERE id = ?",
          )
          .get(reviewId),
        reviewFromRow,
      );
      if (!review) return null;
      const artifactRow = database
        .prepare(
          "SELECT a.id, a.workspace_id, a.accepted_revision_id, a.artifact_type, a.title, a.seed_key FROM artifacts a JOIN artifact_revisions r ON r.artifact_id = a.id WHERE r.id = ?",
        )
        .get(review.revisionId);
      if (artifactRow === undefined)
        throw new Error("Invalid review artifact row");
      const artifact = artifactFromRow(artifactRow);
      return {
        artifact,
        review,
        revisions: database
          .prepare(
            revisionSql("WHERE r.artifact_id = ? ORDER BY r.created_at, r.id"),
          )
          .all(artifact.id)
          .map(revisionFromRow),
        lifecycle: database
          .prepare(
            "SELECT s.revision_id, s.status, s.occurred_at FROM artifact_revision_states s JOIN artifact_revisions r ON r.id = s.revision_id WHERE r.artifact_id = ? ORDER BY s.id",
          )
          .all(artifact.id)
          .map(lifecycleFromRow),
        decisions: database
          .prepare(
            decisionSql("WHERE d.review_id = ? ORDER BY d.created_at, d.id"),
          )
          .all(reviewId)
          .map(decisionFromRow),
      };
    },
  };

  const storage: Storage = {
    ...operations,
    transaction<T>(work: (storage: StorageTransaction) => T): T {
      return database.transaction(() => work(operations)).immediate();
    },
    listWorkspaces() {
      return database
        .prepare(
          "SELECT id, name, description, blueprint_id, blueprint_version, created_at, updated_at FROM workspaces ORDER BY created_at, id",
        )
        .all()
        .map(workspaceFromRow);
    },
    listReviews(workspaceId) {
      const statement = workspaceId
        ? database.prepare(
            "SELECT rv.id, rv.revision_id, rv.status, rv.created_at, a.workspace_id, a.id AS artifact_id, a.title AS artifact_title, a.artifact_type, ar.producer, ar.content FROM reviews rv JOIN artifact_revisions ar ON ar.id = rv.revision_id JOIN artifacts a ON a.id = ar.artifact_id WHERE a.workspace_id = ? ORDER BY rv.created_at, rv.id",
          )
        : database.prepare(
            "SELECT rv.id, rv.revision_id, rv.status, rv.created_at, a.workspace_id, a.id AS artifact_id, a.title AS artifact_title, a.artifact_type, ar.producer, ar.content FROM reviews rv JOIN artifact_revisions ar ON ar.id = rv.revision_id JOIN artifacts a ON a.id = ar.artifact_id ORDER BY rv.created_at, rv.id",
          );
      return (workspaceId ? statement.all(workspaceId) : statement.all()).map(
        reviewSummaryFromRow,
      );
    },
    readHome(workspaceId) {
      return readHome(database, workspaceId);
    },
    readReview(reviewId) {
      return readReview(database, reviewId);
    },
    close() {
      database.close();
    },
  };
  return storage;
}

function migrate(database: Database.Database): void {
  const tableCount = count(
    database
      .prepare(
        "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = ? AND name = ?",
      )
      .get("table", "schema_migrations"),
  );
  const applied =
    tableCount === 0
      ? new Set<number>()
      : new Set(
          database
            .prepare("SELECT version FROM schema_migrations")
            .all()
            .map((row) => numberField(objectRow(row, "migration"), "version")),
        );
  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    database.transaction(() => {
      for (const statement of migration.statements) database.exec(statement);
      database
        .prepare(
          "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
        )
        .run(migration.version, "2026-09-09T00:00:00.000Z");
    })();
  }
}

function revisionSql(suffix: string): string {
  return `SELECT r.id, r.artifact_id, a.workspace_id, a.artifact_type, r.schema_version, r.content, r.producer, r.transformation_id, r.input_revision_ids, r.created_at, (SELECT s.status FROM artifact_revision_states s WHERE s.revision_id = r.id ORDER BY s.id DESC LIMIT 1) AS status FROM artifact_revisions r JOIN artifacts a ON a.id = r.artifact_id ${suffix}`;
}
function decisionSql(suffix: string): string {
  return `SELECT d.id, d.review_id, d.revision_id, d.actor_id, a.name AS actor_name, a.kind AS actor_kind, d.action, d.comment, d.created_at FROM decisions d JOIN actors a ON a.id = d.actor_id ${suffix}`;
}

function readExecution(
  database: Database.Database,
  executionId: string,
): ExecutionRecord | null {
  const row = database
    .prepare(
      "SELECT id, status, workspace_id, transformation_id, input_revision_ids, output_revision_id, started_at, completed_at FROM executions WHERE id = ?",
    )
    .get(executionId);
  if (row === undefined) return null;
  const value = objectRow(row, "execution");
  return {
    id: stringField(value, "id"),
    status: executionStatusField(value, "status"),
    workspaceId: nullableStringField(value, "workspace_id") ?? "",
    transformationId: nullableStringField(value, "transformation_id") ?? "",
    inputRevisionIds: stringArray(value.input_revision_ids, "execution inputs"),
    outputRevisionId: nullableStringField(value, "output_revision_id"),
    startedAt: stringField(value, "started_at"),
    completedAt: nullableStringField(value, "completed_at"),
    events: database
      .prepare(
        "SELECT sequence, kind, message, occurred_at FROM execution_events WHERE execution_id = ? ORDER BY sequence",
      )
      .all(executionId)
      .map(eventFromRow),
  };
}

function readHome(
  database: Database.Database,
  workspaceId?: string,
): HomeProjection {
  const result: HomeProjection = {
    needsDecision: [],
    blocked: [],
    recentlyCompleted: [],
  };
  const rows = database
    .prepare(
      `SELECT v.id, v.status, v.created_at, w.id AS workspace_id, w.name AS workspace_name, a.title, a.artifact_type, r.content, r.producer, r.transformation_id,
      (SELECT ia.title FROM artifacts ia WHERE ia.workspace_id = w.id AND ia.artifact_type = 'initiative' ORDER BY ia.id LIMIT 1) AS initiative_title
      FROM reviews v JOIN artifact_revisions r ON r.id = v.revision_id JOIN artifacts a ON a.id = r.artifact_id JOIN workspaces w ON w.id = a.workspace_id
      WHERE (? IS NULL OR w.id = ?) ORDER BY v.created_at, v.id`,
    )
    .all(workspaceId ?? null, workspaceId ?? null);
  for (const row of rows) {
    const value = objectRow(row, "home review");
    const reviewStatus = reviewStatusField(value, "status");
    const itemStatus =
      reviewStatus === "open"
        ? "decision-needed"
        : reviewStatus === "revision-needed"
          ? "revision-needed"
          : "completed";
    const content = parseJson(value.content, "home content");
    const item: HomeItem = {
      kind: "review",
      id: stringField(value, "id"),
      workspaceId: stringField(value, "workspace_id"),
      workspaceName: stringField(value, "workspace_name"),
      initiativeTitle: nullableStringField(value, "initiative_title"),
      title: stringField(value, "title"),
      artifactType: stringField(value, "artifact_type"),
      reason:
        reviewStatus === "open"
          ? "Review requested"
          : reviewStatus === "revision-needed"
            ? "Revision requested"
            : reviewStatus === "superseded"
              ? "Review superseded"
              : "Review completed",
      producer: stringField(value, "producer"),
      transformationId: nullableStringField(value, "transformation_id"),
      status: itemStatus,
      createdAt: stringField(value, "created_at"),
      unresolvedQuestionCount:
        isRecord(content) && Array.isArray(content.openQuestions)
          ? content.openQuestions.length
          : 0,
    };
    if (itemStatus === "decision-needed") result.needsDecision.push(item);
    else if (itemStatus === "revision-needed") result.blocked.push(item);
    else result.recentlyCompleted.push(item);
  }
  // Home reads reviews and nothing else. An earlier version also selected
  // executions with status `running` or `failed`, but no such row can exist:
  // `storage.transaction` is an immediate transaction and the service inserts the
  // execution as running and updates it to completed inside a single call, so a
  // crash rolls the insert back and nothing ever writes `failed`. The branch was
  // unreachable, and the Running group it fed is deferred to the slice that
  // introduces long-running or resumable execution.
  return result;
}

function readReview(
  database: Database.Database,
  reviewId: string,
): ReviewProjection | null {
  const review = optional(
    database
      .prepare(
        "SELECT id, revision_id, status, created_at FROM reviews WHERE id = ?",
      )
      .get(reviewId),
    reviewFromRow,
  );
  if (!review) return null;
  const reviewedRevision = requiredRevision(
    database.prepare(revisionSql("WHERE r.id = ?")).get(review.revisionId),
  );
  const artifactRow = database
    .prepare(
      "SELECT id, workspace_id, accepted_revision_id, artifact_type, title, seed_key FROM artifacts WHERE id = ?",
    )
    .get(reviewedRevision.artifactId);
  if (artifactRow === undefined) throw new Error("Invalid review artifact row");
  const artifact = artifactFromRow(artifactRow);
  const workspaceRow = database
    .prepare(
      "SELECT id, name, description, blueprint_id, blueprint_version, created_at, updated_at FROM workspaces WHERE id = ?",
    )
    .get(artifact.workspaceId);
  if (workspaceRow === undefined)
    throw new Error("Invalid review workspace row");
  const workspace = workspaceFromRow(workspaceRow);
  const acceptedRevision = artifact.acceptedRevisionId
    ? requiredRevision(
        database
          .prepare(revisionSql("WHERE r.id = ?"))
          .get(artifact.acceptedRevisionId),
      )
    : null;
  const relations = database
    .prepare(
      "SELECT id, source_revision_id, target_revision_id, kind, label FROM relations WHERE target_revision_id = ? ORDER BY id",
    )
    .all(review.revisionId)
    .map(relationFromRow);
  const inputs = relations
    .filter((relation) => relation.kind === "input-to")
    .map((relation) =>
      requiredRevision(
        database
          .prepare(revisionSql("WHERE r.id = ?"))
          .get(relation.sourceRevisionId),
      ),
    );
  const executionIdRow = database
    .prepare(
      "SELECT id FROM executions WHERE output_revision_id = ? ORDER BY started_at DESC LIMIT 1",
    )
    .get(review.revisionId);
  const initiativeRow = database
    .prepare(
      "SELECT title FROM artifacts WHERE workspace_id = ? AND artifact_type = ? ORDER BY id LIMIT 1",
    )
    .get(workspace.id, "initiative");
  return {
    review,
    workspace,
    initiativeTitle:
      initiativeRow === undefined
        ? ""
        : stringField(objectRow(initiativeRow, "initiative"), "title"),
    artifactTitle: artifact.title,
    artifactType: artifact.artifactType,
    reviewedRevision,
    acceptedRevision,
    inputs,
    evidence: relations,
    comments: database
      .prepare(
        "SELECT id, review_id, actor_id, body, created_at FROM review_comments WHERE review_id = ? ORDER BY created_at, id",
      )
      .all(reviewId)
      .map(commentFromRow),
    decisions: database
      .prepare(decisionSql("WHERE d.review_id = ? ORDER BY d.created_at, d.id"))
      .all(reviewId)
      .map(decisionFromRow),
    changedFields: changedFields(
      acceptedRevision?.content,
      reviewedRevision.content,
    ),
    execution:
      executionIdRow === undefined
        ? null
        : readExecution(
            database,
            stringField(objectRow(executionIdRow, "execution"), "id"),
          ),
  };
}

function workspaceFromRow(row: unknown): WorkspaceRecord {
  const value = objectRow(row, "workspace");
  return {
    id: stringField(value, "id"),
    name: stringField(value, "name"),
    description: nullableStringField(value, "description"),
    blueprintId: stringField(value, "blueprint_id"),
    blueprintVersion: stringField(value, "blueprint_version"),
    createdAt: stringField(value, "created_at"),
    updatedAt: stringField(value, "updated_at"),
  };
}
function actorFromRow(row: unknown): ActorRecord {
  const value = objectRow(row, "actor");
  return {
    id: stringField(value, "id"),
    workspaceId: stringField(value, "workspace_id"),
    name: stringField(value, "name"),
    kind: enumField(value, "kind", [
      "human",
      "agent",
      "deterministic",
      "external",
    ]),
  };
}
function artifactFromRow(row: unknown): ArtifactRecord {
  const value = objectRow(row, "artifact");
  return {
    id: stringField(value, "id"),
    workspaceId: stringField(value, "workspace_id"),
    acceptedRevisionId: nullableStringField(value, "accepted_revision_id"),
    artifactType: stringField(value, "artifact_type"),
    title: stringField(value, "title"),
    seedKey: nullableStringField(value, "seed_key"),
  };
}
function revisionFromRow(row: unknown): RevisionRecord {
  const value = objectRow(row, "revision");
  return {
    id: stringField(value, "id"),
    artifactId: stringField(value, "artifact_id"),
    workspaceId: stringField(value, "workspace_id"),
    artifactType: stringField(value, "artifact_type"),
    schemaVersion: stringField(value, "schema_version"),
    content: parseJson(value.content, "revision content"),
    producer: stringField(value, "producer"),
    transformationId: nullableStringField(value, "transformation_id"),
    inputRevisionIds: stringArray(value.input_revision_ids, "revision inputs"),
    status: enumField(value, "status", [
      "draft",
      "proposed",
      "accepted",
      "rejected",
      "superseded",
    ]),
    createdAt: stringField(value, "created_at"),
  };
}
function lifecycleFromRow(row: unknown): LifecycleRecord {
  const value = objectRow(row, "lifecycle");
  return {
    revisionId: stringField(value, "revision_id"),
    status: enumField(value, "status", [
      "draft",
      "proposed",
      "accepted",
      "rejected",
      "superseded",
    ]),
    occurredAt: stringField(value, "occurred_at"),
  };
}
function relationFromRow(row: unknown): RelationRecord {
  const value = objectRow(row, "relation");
  return {
    id: stringField(value, "id"),
    sourceRevisionId: stringField(value, "source_revision_id"),
    targetRevisionId: stringField(value, "target_revision_id"),
    kind: enumField(value, "kind", ["input-to", "evidence-for", "supersedes"]),
    label: stringField(value, "label"),
  };
}
function reviewFromRow(row: unknown): ReviewRecord {
  const value = objectRow(row, "review");
  return {
    id: stringField(value, "id"),
    revisionId: stringField(value, "revision_id"),
    status: reviewStatusField(value, "status"),
    createdAt: stringField(value, "created_at"),
  };
}
function reviewSummaryFromRow(row: unknown): ReviewSummaryRecord {
  const value = objectRow(row, "review summary");
  const review = reviewFromRow(value);
  const content = parseJson(value.content, "content");
  if (!isRecord(content) || !Array.isArray(content.openQuestions))
    throw new Error("Invalid Product Intent open questions");
  return {
    ...review,
    workspaceId: stringField(value, "workspace_id"),
    artifactId: stringField(value, "artifact_id"),
    artifactTitle: stringField(value, "artifact_title"),
    artifactType: stringField(value, "artifact_type"),
    reason: reviewReason(review.status),
    producer: stringField(value, "producer"),
    unresolvedQuestionCount: content.openQuestions.length,
  };
}
function reviewReason(status: ReviewRecord["status"]): string {
  if (status === "open") return "Review requested";
  if (status === "revision-needed") return "Revision requested";
  return "Decision completed";
}
function reviewStatusField(
  value: Record<string, unknown>,
  name: string,
): ReviewRecord["status"] {
  return enumField(value, name, [
    "open",
    "revision-needed",
    "resolved",
    "superseded",
  ]);
}
function commentFromRow(row: unknown): ReviewCommentRecord {
  const value = objectRow(row, "comment");
  return {
    id: stringField(value, "id"),
    reviewId: stringField(value, "review_id"),
    actorId: stringField(value, "actor_id"),
    body: stringField(value, "body"),
    createdAt: stringField(value, "created_at"),
  };
}
function decisionFromRow(row: unknown): DecisionRecord {
  const value = objectRow(row, "decision");
  return {
    id: stringField(value, "id"),
    reviewId: stringField(value, "review_id"),
    revisionId: stringField(value, "revision_id"),
    actorId: stringField(value, "actor_id"),
    actorName: stringField(value, "actor_name"),
    actorKind: enumField(value, "actor_kind", [
      "human",
      "agent",
      "deterministic",
      "external",
    ]),
    action: enumField(value, "action", ["approve", "request-revision"]),
    comment: nullableStringField(value, "comment"),
    createdAt: stringField(value, "created_at"),
  };
}
function eventFromRow(row: unknown): ExecutionEventRecord {
  const value = objectRow(row, "event");
  return {
    sequence: numberField(value, "sequence"),
    kind: enumField(value, "kind", [
      "started",
      "progress",
      "result",
      "completed",
      "failed",
    ]),
    message: stringField(value, "message"),
    occurredAt: stringField(value, "occurred_at"),
  };
}

function requiredRevision(row: unknown): RevisionRecord {
  if (row === undefined) throw new Error("Missing revision row");
  return revisionFromRow(row);
}
function optional<T>(row: unknown, mapper: (value: unknown) => T): T | null {
  return row === undefined ? null : mapper(row);
}
function objectRow(row: unknown, name: string): Record<string, unknown> {
  if (!isRecord(row)) throw new Error(`Invalid ${name} row`);
  return row;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function stringField(row: Record<string, unknown>, name: string): string {
  const value = row[name];
  if (typeof value !== "string") throw new Error(`Invalid ${name}`);
  return value;
}
function nullableStringField(
  row: Record<string, unknown>,
  name: string,
): string | null {
  const value = row[name];
  if (value !== null && typeof value !== "string")
    throw new Error(`Invalid ${name}`);
  return value;
}
function numberField(row: Record<string, unknown>, name: string): number {
  const value = row[name];
  if (typeof value !== "number") throw new Error(`Invalid ${name}`);
  return value;
}
function count(row: unknown): number {
  return numberField(objectRow(row, "count"), "count");
}
function parseJson(value: unknown, name: string): unknown {
  if (typeof value !== "string") throw new Error(`Invalid ${name}`);
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new Error(`Invalid ${name}`);
  }
}
function stringArray(value: unknown, name: string): string[] {
  const parsed = parseJson(value, name);
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string"))
    throw new Error(`Invalid ${name}`);
  return parsed;
}
function json(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined)
    throw new Error("Value is not JSON serializable");
  return serialized;
}
function enumField<const T extends string>(
  row: Record<string, unknown>,
  name: string,
  values: readonly T[],
): T {
  const value = stringField(row, name);
  if (!values.includes(value as T)) throw new Error(`Invalid ${name}`);
  return value as T;
}
function executionStatusField(
  row: Record<string, unknown>,
  name: string,
): ExecutionRecord["status"] {
  return enumField(row, name, ["running", "completed", "failed"]);
}
function changedFields(baseline: unknown, candidate: unknown): string[] {
  if (baseline === undefined || !isRecord(baseline) || !isRecord(candidate))
    return [];
  return [...new Set([...Object.keys(baseline), ...Object.keys(candidate)])]
    .filter((key) => json(baseline[key]) !== json(candidate[key]))
    .sort();
}
function requireOne(changes: number, name: string): void {
  if (changes !== 1) throw new Error(`${name} not found`);
}
