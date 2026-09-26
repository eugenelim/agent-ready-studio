/**
 * The production persistence adapter, against a real reopened database.
 *
 * The Testing Strategy for AC-0100 to AC-0104 declares "integration against
 * real migrations and a reopened temporary database", and no artifact met that
 * description: the composition tests used a hand-written in-memory store and
 * the only run touching `createStorageStore` was the networked boundary case,
 * which the gate never sets the flag for. That seam is how a provenance defect
 * made AC-0104's bound unenforceable while every test stayed green.
 *
 * This reaches no network: the transport and the Runtime are both injected.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStorage } from "@agent-ready/storage-sqlite";
import { afterEach, describe, expect, it, vi } from "vitest";
import { reconcileAfterRestart } from "./connected-source.js";
import {
  createSourceInspections,
  createStorageStore,
  type InspectionOutcome,
} from "./source-inspection.js";

const SHA = "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d";
const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

function databasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), "connect-orient-storage-"));
  directories.push(directory);
  return join(directory, "studio.db");
}

function deps(outcome: InspectionOutcome, path: string) {
  const storage = openStorage(path);
  return {
    storage,
    dependencies: {
      transport: {
        resolve: vi.fn(async () => ({ sha: SHA, reportedRef: "main" })),
        materialize: vi.fn(async () => undefined),
        readHead: vi.fn(async () => SHA),
      },
      inspect: vi.fn(async () => outcome),
      store: createStorageStore(storage),
    },
  };
}

const clean: InspectionOutcome = {
  ok: true,
  completed: true,
  workspacePresent: true,
  invalidWorkspace: false,
  diagnostics: "inspected cleanly",
};

describe("AC-0100 to AC-0102 over a reopened database", () => {
  it("reads the result back after the database is closed and reopened", async () => {
    const path = databasePath();
    const first = deps(clean, path);
    const sources = createSourceInspections(first.dependencies);
    const started = sources.connect("https://github.com/acme/widgets");
    await sources.runFor(started.sourceId);
    first.storage.close?.();

    // Reopened, and a fresh composition with an empty map: everything the
    // lead sees now comes from what was written.
    const second = deps(clean, path);
    const restored = createSourceInspections(second.dependencies).get(
      started.sourceId,
    );

    expect(restored, "nothing survived the reopen").toBeDefined();
    expect(restored?.owner).toBe("acme");
    expect(restored?.repository).toBe("widgets");
    expect(restored?.resolvedSha).toBe(SHA);
    expect(restored?.inspectedAt).not.toBeNull();
    expect(restored?.verdict).toBe("agent-ready");
    expect(restored?.diagnostics).toBe("inspected cleanly");
    second.storage.close?.();
  });
});

describe("AC-0085 an interrupted inspection reads as incomplete", () => {
  it("moves a source that was in flight when the process stopped", async () => {
    const path = databasePath();
    const first = deps(clean, path);
    const sources = createSourceInspections(first.dependencies);
    // Connect and stop before the pipeline settles: the in-flight record is
    // written synchronously, which is what makes this reconcilable at all.
    const started = sources.connect("https://github.com/acme/widgets");
    first.storage.close?.();

    const second = deps(clean, path);
    const moved = reconcileAfterRestart(second.storage);
    expect(moved, "the interrupted source was not reconciled").toContain(
      started.sourceId,
    );

    const restored = createSourceInspections(second.dependencies).get(
      started.sourceId,
    );
    // Not "not found", and not still in a phase nothing is advancing.
    expect(restored?.condition).toBe("incomplete");
    second.storage.close?.();

    // The run this case started is still going, against a database it closed.
    // Left undrained it persists into whichever case is running when it
    // finishes, and reports the failure there -- the cross-case interference
    // the fixed-tick approximation used to cause. Draining it ends the run
    // inside its own case.
    await sources.runFor(started.sourceId);
  });
});

describe("a refusal is not a connected source", () => {
  it("persists nothing, so two refusals do not collide on identity", async () => {
    // A refused URL has no owner and no repository -- there is no repository.
    // Persisting it wrote an identity-less row, and the second refusal hit the
    // unique key on (owner, repository), which the lead saw as an internal
    // error on their second bad URL rather than as a second refusal.
    const path = databasePath();
    const first = deps(clean, path);
    const sources = createSourceInspections(first.dependencies);

    const wrongHost = sources.connect("https://example.com/acme/widgets");
    const credentials = sources.connect(
      "https://user:token@github.com/acme/widgets",
    );

    expect(wrongHost.phase).toBe("url-rejected");
    expect(credentials.phase).toBe("url-rejected");
    expect(credentials.diagnostics).not.toBe(wrongHost.diagnostics);
    expect(first.storage.listConnectedSources()).toHaveLength(0);
    first.storage.close?.();
  });
});

describe("AC-0104 the persisted-content bound", () => {
  it("refuses a breaching result and leaves the prior record whole", async () => {
    const path = databasePath();
    const first = deps(clean, path);
    const sources = createSourceInspections(first.dependencies);
    const started = sources.connect("https://github.com/acme/widgets");
    await sources.runFor(started.sourceId);
    expect(
      createSourceInspections(first.dependencies).get(started.sourceId)
        ?.diagnostics,
    ).toBe("inspected cleanly");

    // A second inspection on the same source whose repository-derived content
    // breaches the 256 KiB bound. The write is refused before it lands, so the
    // prior record stands rather than being half-replaced.
    const huge = "x".repeat(300 * 1024);
    first.dependencies.store.persist({
      kind: "source-inspection",
      sourceId: started.sourceId,
      phase: null,
      verdict: "agent-ready",
      condition: "ok",
      versionUnverified: false,
      owner: "acme",
      repository: "widgets",
      requestedRef: null,
      resolvedSha: SHA,
      inspectedAt: "2026-09-19T00:00:00.000Z",
      declaredVersionMarker: null,
      declaredVersionState: "absent",
      inspector: null,
      inspectorContractVersion: null,
      diagnostics: huge,
      stopReason: null,
      waitWindow: null,
      secondaryDiagnostic: null,
    });

    const held = createSourceInspections(first.dependencies).get(
      started.sourceId,
    );
    expect(held?.diagnostics, "the breaching write replaced the record").toBe(
      "inspected cleanly",
    );
    first.storage.close?.();
  });

  it("refuses to await a source it holds no run for", () => {
    const first = deps(clean, databasePath());
    const sources = createSourceInspections(first.dependencies);

    // A mistyped or stale id used to resolve immediately, which reads exactly
    // like a run that finished -- the approximation this seam replaced.
    expect(() => sources.runFor("source-never-connected")).toThrow(
      "no run to await",
    );
    first.storage.close?.();
  });

  it("tells a write that failed from a row that was never written", async () => {
    // A write into a closed database used to leave exactly what an absent row
    // leaves: nothing in the store, and a line on stderr nobody reads back.
    // So a case could not tell the two apart, and neither could anyone
    // reading the store afterwards. The write still must not take the service
    // down -- the pipeline runs in the background and a throw would surface as
    // an unhandled rejection -- so the failure is reported rather than raised.
    const path = databasePath();
    const first = deps(clean, path);
    const sources = createSourceInspections(first.dependencies);
    const started = sources.connect("https://github.com/acme/widgets");
    await sources.runFor(started.sourceId);

    first.storage.close?.();

    const written = first.dependencies.store.persist({
      kind: "source-inspection",
      sourceId: started.sourceId,
      phase: null,
      verdict: "agent-ready",
      condition: "ok",
      versionUnverified: false,
      owner: "acme",
      repository: "widgets",
      requestedRef: null,
      resolvedSha: SHA,
      inspectedAt: "2026-09-19T00:00:00.000Z",
      declaredVersionMarker: null,
      declaredVersionState: "absent",
      inspector: null,
      inspectorContractVersion: null,
      diagnostics: "written after the database closed",
      stopReason: null,
      waitWindow: null,
      secondaryDiagnostic: null,
    });

    expect(written.ok, "a write into a closed database reported success").toBe(
      false,
    );
    expect(written.ok === false && written.reason).toContain("not open");
  });

  it("round-trips the inspector identity and the declared state", async () => {
    // AC-0043. Before this, Studio identified the inspector it declined to
    // run and had nowhere to record it: the four values existed only inside
    // a diagnostic sentence, so nothing downstream could read them and no
    // restart could recover them.
    const path = databasePath();
    const first = deps(clean, path);
    const sources = createSourceInspections(first.dependencies);
    const started = sources.connect("https://github.com/acme/widgets");
    await sources.runFor(started.sourceId);

    const inspector = {
      resolvedPath: "/studio/packs/core/scripts",
      packName: "core",
      packVersion: "2.26.14",
      fileDigests: { "inspect.py": "a".repeat(64) },
    };
    const current = sources.get(started.sourceId);
    if (current === undefined) throw new Error("fixture source went missing");
    first.dependencies.store.persist({
      ...current,
      declaredVersionState: "unreadable",
      inspector,
    });

    const held = first.storage.getConnectedSource(started.sourceId);
    expect(held?.declaredVersionState).toBe("unreadable");
    // Deep equality, not presence: a writer that stored the object's shape
    // and dropped the digests satisfies a truthiness check.
    expect(held?.inspector).toEqual(inspector);
    // And through the projection a restart reads, which is the path that
    // makes the record worth writing at all.
    expect(
      createSourceInspections(first.dependencies).get(started.sourceId)
        ?.inspector,
    ).toEqual(inspector);
    first.storage.close?.();
  });

  it("measures the bound over the repository-derived values, not zero", async () => {
    // The defect this case exists for: marking every field with a string
    // outside the `Provenance` union made `repositoryDerivedValues` select
    // nothing, so the bound measured 0 bytes and could never trip. `provenance`
    // is typed `Record<string, string>`, so nothing caught it.
    const path = databasePath();
    const first = deps(clean, path);
    const sources = createSourceInspections(first.dependencies);
    const started = sources.connect("https://github.com/acme/widgets");
    await sources.runFor(started.sourceId);

    const row = first.storage.getConnectedSource(
      first.storage.listConnectedSources()[0]?.id as string,
    );
    expect(row?.provenance.diagnostics).toBe("repository-derived");
    expect(row?.provenance.declaredVersionMarker).toBe("repository-derived");
    expect(row?.provenance.resolvedSha).toBe("transport-reported");
    first.storage.close?.();
  });
});

describe("declaredVersionState is honest about what has been read", () => {
  it("an in-flight row does not assert the declaration was read", async () => {
    // AC-0064. `absent` means the declaration was read and names no marker.
    // An in-flight row has not yet read any declaration, so persisting it with
    // `absent` asserts something Studio never determined. `unreadable` is the
    // not-determined value.
    const path = databasePath();
    const first = deps(clean, path);
    const sources = createSourceInspections(first.dependencies);
    const started = sources.connect("https://github.com/acme/widgets");

    // Read immediately: the in-flight record was written synchronously.
    const inflight = first.storage.getConnectedSource(started.sourceId);
    expect(inflight?.declaredVersionState).not.toBe("absent");
    expect(inflight?.declaredVersionState).toBe("unreadable");

    await sources.runFor(started.sourceId);
    first.storage.close?.();
  });
});
