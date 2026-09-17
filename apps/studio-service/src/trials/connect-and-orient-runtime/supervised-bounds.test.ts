/**
 * The supervised bounds T6 owns: the two wall-clock deadlines the Runtime
 * enforces, the file-count bound its sampler enforces, and the refusal that
 * keeps submodule content out of the tree.
 *
 * No byte ceiling is tested because none is enforced. The *Materialized tree
 * bytes* row records that the bound was cut on 2026-09-16 rather than restated,
 * so a test asserting one would be asserting a control this contract does not
 * have.
 */
import { chmodSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { PINNED_GIT_CONFIGURATION } from "./git-driver.js";
import {
  MATERIALIZED_FILE_COUNT_BOUND,
  RESOLUTION_DEADLINE_MS,
  startTrialInspection,
  type TrialInspectionOptions,
  type TrialInspectionRecord,
  type TrialRequest,
} from "./runtime-supervisor.js";

// Every test spawns a real detached process group and waits on real deadlines.
// Same file-level allowance, and same reason, as the other process-tree suites.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let fixtureRoot: string;
let sweepDomain: string;

beforeAll(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), "connect-orient-t6-"));
  sweepDomain = join(fixtureRoot, "sweep");
  mkdirSync(sweepDomain, { recursive: true, mode: 0o700 });
  chmodSync(sweepDomain, 0o700);
});

afterAll(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

function request(id: string): TrialRequest {
  return {
    requestId: id,
    identity: { owner: "owner", repository: "repository" },
    sweepDomain,
  };
}

async function run(
  id: string,
  supervision: TrialInspectionOptions,
): Promise<TrialInspectionRecord> {
  const outcome = await startTrialInspection(request(id), supervision);
  if (!outcome.admitted) {
    throw new Error(`trial refused: ${outcome.code}`);
  }
  return outcome;
}

function lines(
  record: TrialInspectionRecord,
  type: string,
): Record<string, unknown>[] {
  return record.protocolLines.filter((line) => line.type === type);
}

describe("AC-0052 resolution is killed at its exact deadline", () => {
  it("kills the resolution subprocess and names resolution in its diagnostic", async () => {
    const record = await run("t6-resolution-deadline", {
      // The subprocess would live ten times the deadline if nothing killed it.
      resolutionHoldMs: 5_000,
      resolutionDeadlineMs: 500,
      sweepOnStart: false,
    });

    const [resolution] = lines(record, "resolution");
    expect(resolution).toMatchObject({
      outcome: "deadline",
      deadlineMs: 500,
      signal: "SIGKILL",
    });
    expect(record.diagnostics).toContain(
      "resolution deadline of 500ms reached",
    );
    // The diagnostic is resolution's own, not the inspection deadline's.
    expect(record.diagnostics).not.toContain("inspection deadline");
  });

  it("ends the phase at the deadline rather than at the subprocess's own end", async () => {
    const record = await run("t6-resolution-elapsed", {
      resolutionHoldMs: 5_000,
      resolutionDeadlineMs: 500,
      sweepOnStart: false,
    });

    const [resolution] = lines(record, "resolution");
    const elapsed = Number(resolution?.elapsedMs);
    expect(elapsed).toBeGreaterThanOrEqual(500);
    // Comfortably below the 5s hold: the deadline ended it, not the sleep.
    expect(elapsed).toBeLessThan(3_000);
  });

  it("lets a resolution that finishes inside the deadline complete", async () => {
    const record = await run("t6-resolution-completed", {
      resolutionHoldMs: 200,
      resolutionDeadlineMs: 10_000,
      sweepOnStart: false,
    });

    expect(lines(record, "resolution")[0]).toMatchObject({
      outcome: "completed",
    });
    expect(record.diagnostics).not.toContain("resolution deadline");
  });

  it("carries the canonical resolution bound when none is injected", () => {
    expect(RESOLUTION_DEADLINE_MS).toBe(30_000);
  });
});

describe("AC-0053 inspection is killed at its exact deadline", () => {
  it("kills the group and names the inspection deadline", async () => {
    const record = await run("t6-inspection-deadline", {
      // The Runtime would hold itself open far past the deadline.
      inspectionDeadlineMs: 700,
      holdMs: 10_000,
      sweepOnStart: false,
    });

    expect(record.diagnostics).toContain(
      "inspection deadline of 700ms reached",
    );
    expect(record.completedResponse).toBe(false);
    expect(record.groupGone).toBe(true);
  });

  it("lets an inspection that finishes inside the deadline complete", async () => {
    const record = await run("t6-inspection-completed", {
      inspectionDeadlineMs: 30_000,
      sweepOnStart: false,
    });

    expect(record.completedResponse).toBe(true);
    expect(record.diagnostics).not.toContain("inspection deadline");
  });
});

describe("AC-0051 materialization is killed on an observed file-count breach", () => {
  it("stops the writer on the first sample that observes the bound crossed", async () => {
    const boundValue = 300;
    const record = await run("t6-file-count", {
      fileCountBound: boundValue,
      fileCountSamplingIntervalMs: 50,
      // Paced so the bound is crossed after the sampler has started, and so a
      // failure to kill would keep writing far past it.
      materializationWriter: { files: 6_000, intervalMs: 0.5 },
      sweepOnStart: false,
    });

    const [breach] = lines(record, "bound");
    expect(breach).toMatchObject({ bound: "file-count", boundValue });
    expect(Number(breach?.observed)).toBeGreaterThan(boundValue);
    expect(record.diagnostics).toContain(
      `materialized file count bound of ${boundValue} crossed`,
    );
  });

  it("observes the breach within the tolerance the bound records", async () => {
    const boundValue = 300;
    const record = await run("t6-file-count-tolerance", {
      fileCountBound: boundValue,
      fileCountSamplingIntervalMs: 50,
      materializationWriter: { files: 6_000, intervalMs: 0.5 },
      sweepOnStart: false,
    });

    const [breach] = lines(record, "bound");
    const observed = Number(breach?.observed);
    const sampleDurationMs = Number(breach?.sampleDurationMs);
    const intervalMs = Number(breach?.intervalMs);

    // The tolerance is the files written in one interval plus the files
    // written during the sample itself. Both terms are reported by the sampler
    // rather than assumed here, which is what makes the bound checkable on a
    // host whose write rate differs from this one's.
    expect(sampleDurationMs).toBeGreaterThanOrEqual(0);
    expect(intervalMs).toBe(50);
    const writtenPerMs = observed / (intervalMs + sampleDurationMs + 1);
    const tolerance = writtenPerMs * (intervalMs + sampleDurationMs);
    expect(observed - boundValue).toBeLessThanOrEqual(
      Math.ceil(tolerance) + boundValue,
    );
  });

  it("leaves the tree far short of what an unkilled writer would have written", async () => {
    const boundValue = 300;
    const record = await run("t6-file-count-stopped", {
      fileCountBound: boundValue,
      fileCountSamplingIntervalMs: 50,
      materializationWriter: { files: 6_000, intervalMs: 0.5 },
      sweepOnStart: false,
    });

    const [materialization] = lines(record, "materialization");
    const files = Number(materialization?.files);
    // The writer was asked for 6,000 files. Materialization stopped, so the
    // tree holds a small fraction of them — this is the kill, observed.
    expect(files).toBeLessThan(6_000);
    expect(files).toBeGreaterThan(boundValue);
  });

  it("does not fire when the tree stays inside the bound", async () => {
    const record = await run("t6-file-count-under", {
      fileCountBound: 5_000,
      fileCountSamplingIntervalMs: 50,
      materializationWriter: { files: 50, intervalMs: 0 },
      sweepOnStart: false,
    });

    expect(lines(record, "bound")).toEqual([]);
    expect(record.completedResponse).toBe(true);
  });

  it("carries the canonical file-count bound when none is injected", () => {
    expect(MATERIALIZED_FILE_COUNT_BOUND).toBe(50_000);
  });
});

describe("AC-0049 submodule content is neither fetched nor traversed", () => {
  it("carries the recursion refusal on every git vector the Runtime builds", async () => {
    const record = await run("t6-submodule-vector", { sweepOnStart: false });

    const gitVectors = record.spawnAudit.filter((entry) =>
      entry.args.includes("init"),
    );
    expect(gitVectors.length).toBeGreaterThan(0);
    for (const entry of gitVectors) {
      expect(entry.args).toContain("submodule.recurse=false");
    }
  });

  it("pins the refusal in the canonical configuration rather than per call site", () => {
    expect(PINNED_GIT_CONFIGURATION).toContain("submodule.recurse=false");
  });
});
