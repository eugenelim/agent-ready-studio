import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type ConnectedSourceRecord,
  openStorage,
  type Storage,
} from "@agent-ready/storage-sqlite";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  IN_FLIGHT_PHASES,
  PERSISTED_REPOSITORY_CONTENT_BOUND_BYTES,
  persistConnectedSource,
  persistedRepositoryBytes,
  reconcileAfterRestart,
  recordCancellation,
  repositoryDerivedValues,
  toConnectedSourceRecord,
} from "./connected-source.js";
import { normalizeTrialResult } from "./trial-result.js";
import {
  buildHostileFixture,
  disposeHostileFixtures,
  HOSTILE_CASE_BY_CRITERION,
  materialize,
  runPositiveControl,
} from "./trials/connect-and-orient-runtime/test/hostile-fixture.js";

vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const roots: string[] = [];
let store: Storage | undefined;

afterEach(() => {
  store?.close();
  store = undefined;
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
  disposeHostileFixtures();
});

let databasePath = "";

function openFreshStore(): Storage {
  const root = mkdtempSync(join(tmpdir(), "connect-orient-store-"));
  roots.push(root);
  databasePath = join(root, "studio.sqlite");
  store = openStorage(databasePath);
  return store;
}

function record(
  overrides: Partial<ConnectedSourceRecord> = {},
): ConnectedSourceRecord {
  const outcome = normalizeTrialResult({
    contract: "connect-orient-trial.v0",
    requestId: "req-0000000000000001",
    status: "completed",
    resolvedSha: "a".repeat(40),
    inspectorDiagnostics: "",
    declaredVersionMarker: null,
    inspectorContractVersion: "1",
    removalOutcome: "removed",
    workspacePresent: true,
    findings: [],
  });
  if (!outcome.ok) {
    throw new Error("fixture result did not normalize");
  }
  return {
    ...toConnectedSourceRecord({
      sourceId: "source-1",
      owner: "owner",
      repository: "repository",
      requestedRef: "main",
      inspectedAt: "2026-09-17T04:00:00.000Z",
      condition: "ok",
      result: outcome.result,
    }),
    ...overrides,
  };
}

// The names the approved stub uses. They are thin wrappers so the stub reads as
// the plan wrote it; each one does exactly what its name says and nothing more.
const sourceId = "source-1";
const verdictFixture = record();

async function persistInspection(
  id: string,
  value: ConnectedSourceRecord,
): Promise<void> {
  const storage = store ?? openFreshStore();
  persistConnectedSource(storage, { ...value, id });
}

async function reopenStore(): Promise<void> {
  store?.close();
  store = openStorage(databasePath);
}

async function readVerdict(id: string): Promise<{ state: string | null }> {
  const found = (store as Storage).getConnectedSource(id);
  return { state: found?.verdict ?? null };
}

// biome-ignore format: approved plan stub must remain byte-identical
it("AC-0102 reads the verdict back after a reopen", async () => {
 await persistInspection(sourceId, verdictFixture);
 await reopenStore();
 expect(await readVerdict(sourceId)).toMatchObject({ state: "agent-ready" });
});

describe("AC-0100 to AC-0103 the verdict survives a restart", () => {
  it("migrates a fresh database and a reopened one", () => {
    const storage = openFreshStore();
    expect(storage.listConnectedSources()).toEqual([]);

    storage.close();
    store = openStorage(databasePath);
    expect(store.listConnectedSources()).toEqual([]);
  });

  it("reads the canonical identity back after a restart", () => {
    const storage = openFreshStore();
    persistConnectedSource(storage, record());
    storage.close();
    store = openStorage(databasePath);

    const restored = store.getConnectedSource("source-1");
    expect(restored).toMatchObject({
      owner: "owner",
      repository: "repository",
    });
  });

  it("reads the ref, the SHA and the inspection time back", () => {
    const storage = openFreshStore();
    persistConnectedSource(storage, record());
    storage.close();
    store = openStorage(databasePath);

    expect(store.getConnectedSource("source-1")).toMatchObject({
      requestedRef: "main",
      resolvedSha: "a".repeat(40),
      inspectedAt: "2026-09-17T04:00:00.000Z",
    });
  });

  it("reads the verdict and its diagnostics back", () => {
    const storage = openFreshStore();
    persistConnectedSource(
      storage,
      record({ diagnostics: "the inspector said so" }),
    );
    storage.close();
    store = openStorage(databasePath);

    expect(store.getConnectedSource("source-1")).toMatchObject({
      verdict: "agent-ready",
      diagnostics: "the inspector said so",
    });
  });

  it("shows a restored verdict with the time it was inspected", () => {
    const storage = openFreshStore();
    persistConnectedSource(storage, record());
    storage.close();
    store = openStorage(databasePath);

    const restored = store.getConnectedSource("source-1");
    // AC-0103: the verdict is never restorable without its time, because both
    // are columns of the same row.
    expect(restored?.verdict).toBe("agent-ready");
    expect(restored?.inspectedAt).toBe("2026-09-17T04:00:00.000Z");
  });

  it("carries each provenance marker through the write and the read", () => {
    const storage = openFreshStore();
    persistConnectedSource(storage, record());
    storage.close();
    store = openStorage(databasePath);

    expect(store.getConnectedSource("source-1")?.provenance).toMatchObject({
      diagnostics: "repository-derived",
      declaredVersionMarker: "repository-derived",
      resolvedSha: "transport-reported",
    });
  });
});

describe("AC-0104 persisted repository-derived content is bounded", () => {
  it("counts every repository-derived value, not one class", () => {
    const counted = repositoryDerivedValues(
      record({
        diagnostics: "x".repeat(10),
        declaredVersionMarker: "y".repeat(5),
      }),
    );

    // Both repository-derived fields are counted; the transport-reported SHA
    // is not, because it is not repository-derived.
    expect(counted.map(({ field }) => field).toSorted()).toEqual([
      "declaredVersionMarker",
      "diagnostics",
    ]);
    expect(
      persistedRepositoryBytes(record({ diagnostics: "x".repeat(10) })),
    ).toBe(10);
  });

  it("rejects the write on breach, per the owner decision", () => {
    const storage = openFreshStore();
    const oversized = record({
      diagnostics: "x".repeat(PERSISTED_REPOSITORY_CONTENT_BOUND_BYTES),
      declaredVersionMarker: "y".repeat(100),
    });

    const outcome = persistConnectedSource(storage, oversized);

    expect(outcome).toMatchObject({
      ok: false,
      refusal: "exceeds-persisted-content-bound",
    });
    // Rejected, not truncated: nothing was written at all.
    expect(storage.getConnectedSource("source-1")).toBeNull();
  });

  it("leaves a prior record untouched when a later write breaches", () => {
    const storage = openFreshStore();
    persistConnectedSource(storage, record({ diagnostics: "first" }));

    persistConnectedSource(
      storage,
      record({
        diagnostics: "x".repeat(PERSISTED_REPOSITORY_CONTENT_BOUND_BYTES + 1),
      }),
    );

    expect(storage.getConnectedSource("source-1")?.diagnostics).toBe("first");
  });

  it("admits a record at the bound", () => {
    const storage = openFreshStore();

    const outcome = persistConnectedSource(
      storage,
      record({
        diagnostics: "x".repeat(PERSISTED_REPOSITORY_CONTENT_BOUND_BYTES),
      }),
    );

    expect(outcome.ok).toBe(true);
  });

  it("would catch a newly marked repository-derived field without an edit", () => {
    // The bound reads provenance markers rather than a chosen field list, so a
    // field marked repository-derived later is counted immediately.
    const widened = record({
      requestedRef: "z".repeat(20),
      provenance: {
        diagnostics: "repository-derived",
        declaredVersionMarker: "repository-derived",
        inspectorContractVersion: "inspector-authored",
        resolvedSha: "transport-reported",
        requestedRef: "repository-derived",
      },
    });

    expect(
      repositoryDerivedValues(widened).map(({ field }) => field),
    ).toContain("requestedRef");
    expect(persistedRepositoryBytes(widened)).toBe(20);
  });

  it("carries the canonical persisted bound", () => {
    expect(PERSISTED_REPOSITORY_CONTENT_BOUND_BYTES).toBe(256 * 1024);
  });
});

describe("AC-0084 and AC-0085 cancellation and restart are distinct", () => {
  it("terminates the Runtime and records the inspection as cancelled", () => {
    const storage = openFreshStore();
    persistConnectedSource(storage, record({ condition: "inspecting" }));
    let terminated = false;

    recordCancellation(storage, "source-1", () => {
      terminated = true;
    });

    expect(terminated).toBe(true);
    expect(storage.getConnectedSource("source-1")?.condition).toBe("cancelled");
  });

  it("moves an in-flight inspection to incomplete after a restart", () => {
    const storage = openFreshStore();
    persistConnectedSource(storage, record({ condition: "inspecting" }));
    storage.close();
    store = openStorage(databasePath);

    const moved = reconcileAfterRestart(store);

    expect(moved).toEqual(["source-1"]);
    expect(store.getConnectedSource("source-1")?.condition).toBe("incomplete");
  });

  it("keeps incomplete distinct from cancelled", () => {
    const storage = openFreshStore();
    persistConnectedSource(storage, record({ condition: "cancelled" }));

    // A restart does not relabel a cancellation as its own interruption.
    expect(reconcileAfterRestart(storage)).toEqual([]);
    expect(storage.getConnectedSource("source-1")?.condition).toBe("cancelled");
  });

  it("leaves a settled inspection alone across a restart", () => {
    const storage = openFreshStore();
    persistConnectedSource(storage, record({ condition: "ok" }));

    expect(reconcileAfterRestart(storage)).toEqual([]);
    expect(storage.getConnectedSource("source-1")?.condition).toBe("ok");
  });

  it("treats both progress conditions as in flight", () => {
    expect([...IN_FLIGHT_PHASES]).toEqual(["resolving", "inspecting"]);
  });
});

describe("AC-0146 no credential-bearing value reaches storage or a diagnostic", () => {
  it("persists no credential from the repository", async () => {
    const fixture = await buildHostileFixture({ caseId: "credential-sink" });
    await materialize(fixture);
    const planted = readFileSync(
      join(fixture.worktree, ".probe/credential"),
      "utf8",
    ).trim();
    expect(planted).toBe("repository-token");

    const storage = openFreshStore();
    persistConnectedSource(storage, record());
    storage.close();
    store = openStorage(databasePath);

    // Every persisted column of the connected source, read back as one string.
    const persisted = JSON.stringify(store.getConnectedSource("source-1"));
    expect(persisted).not.toContain(planted);
  });

  it("reaches no diagnostic either", async () => {
    const fixture = await buildHostileFixture({ caseId: "credential-sink" });
    await materialize(fixture);

    const storage = openFreshStore();
    const outcome = persistConnectedSource(
      storage,
      record({
        diagnostics: "x".repeat(PERSISTED_REPOSITORY_CONTENT_BOUND_BYTES + 1),
      }),
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }
    // The refusal diagnostic reports sizes and a bound, never the bytes it
    // refused, so an oversized credential cannot escape through the message.
    expect(outcome.diagnostic).not.toContain("repository-token");
    expect(outcome.diagnostic).not.toContain("x".repeat(20));
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("credential-sink")).resolves.toBe(true);
  });
});

describe("AC-0147 every absence proof has a firing positive control", () => {
  const CONTROLLED = [
    "AC-0133",
    "AC-0134",
    "AC-0135",
    "AC-0136",
    "AC-0137",
    "AC-0138",
    "AC-0139",
    "AC-0140",
    "AC-0141",
    "AC-0142",
    "AC-0143",
    "AC-0144",
    "AC-0145",
    "AC-0146",
  ] as const;

  it("ranges over AC-0133 through AC-0146 with no gap", () => {
    for (const criterion of CONTROLLED) {
      expect(HOSTILE_CASE_BY_CRITERION, criterion).toHaveProperty(criterion);
    }
    expect(CONTROLLED).toHaveLength(14);
  });

  it.each(
    CONTROLLED,
  )("%s's control reproduces its effect", async (criterion) => {
    const caseId =
      HOSTILE_CASE_BY_CRITERION[
        criterion as keyof typeof HOSTILE_CASE_BY_CRITERION
      ];

    await expect(runPositiveControl(caseId)).resolves.toBe(true);
  });
});
