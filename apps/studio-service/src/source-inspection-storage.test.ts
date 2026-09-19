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

const settled = async () => {
  for (let tick = 0; tick < 12; tick += 1) await Promise.resolve();
};

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
    await settled();
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
    await settled();
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

  it("measures the bound over the repository-derived values, not zero", async () => {
    // The defect this case exists for: marking every field with a string
    // outside the `Provenance` union made `repositoryDerivedValues` select
    // nothing, so the bound measured 0 bytes and could never trip. `provenance`
    // is typed `Record<string, string>`, so nothing caught it.
    const path = databasePath();
    const first = deps(clean, path);
    createSourceInspections(first.dependencies).connect(
      "https://github.com/acme/widgets",
    );
    await settled();

    const row = first.storage.getConnectedSource(
      first.storage.listConnectedSources()[0]?.id as string,
    );
    expect(row?.provenance.diagnostics).toBe("repository-derived");
    expect(row?.provenance.declaredVersionMarker).toBe("repository-derived");
    expect(row?.provenance.resolvedSha).toBe("transport-reported");
    first.storage.close?.();
  });
});
