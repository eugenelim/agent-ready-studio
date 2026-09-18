import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LIVENESS_TOKEN_CONVENTION } from "./per-request-state-root.js";
import {
  beginTrialInspection,
  startTrialInspection,
  type TrialInspectionOptions,
  type TrialInspectionRecord,
  type TrialRequest,
} from "./runtime-supervisor.js";

let fixtureRoot: string;
let sweepDomain: string;

beforeAll(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), "connect-orient-disposal-"));
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
  supervision: TrialInspectionOptions = {},
): Promise<TrialInspectionRecord> {
  const outcome = await startTrialInspection(request(id), supervision);
  if (!outcome.admitted) {
    throw new Error(`inspection refused: ${outcome.code}`);
  }
  return outcome;
}

function disposalLine(
  record: TrialInspectionRecord,
): Record<string, unknown> | undefined {
  return record.protocolLines.find((line) => line.type === "disposed");
}

describe("AC-0077 the inspection process is terminated after its response", () => {
  it("leaves no live process group behind", async () => {
    const record = await run("disposal-0001");
    expect(record.termination).toBe("completed");
    expect(record.completedResponse).toBe(true);
    // The group is gone: nothing from the inspection outlives its response.
    expect(record.groupGone).toBe(true);
  });
});

describe("AC-0079 the Runtime removes its per-request state root", () => {
  it("removes the whole root on success", async () => {
    const record = await run("disposal-0002");
    expect(record.termination).toBe("completed");
    expect(disposalLine(record)).toMatchObject({
      reason: "completed",
      removed: true,
    });
    // One removal discharges all four: the tree, the home, the temp, the marker.
    expect(existsSync(record.stateRoot.stateRoot)).toBe(false);
    expect(existsSync(record.stateRoot.materializationRoot)).toBe(false);
    expect(existsSync(record.stateRoot.home)).toBe(false);
    expect(existsSync(record.stateRoot.temporaryDirectory)).toBe(false);
    expect(existsSync(record.stateRoot.markerPath)).toBe(false);
  });

  it("retains the root only when the injected option asks for it", async () => {
    const record = await run("disposal-0003", { retainStateRoot: true });
    expect(disposalLine(record)).toMatchObject({
      retained: true,
      removed: false,
    });
    expect(existsSync(record.stateRoot.stateRoot)).toBe(true);
    // Left behind deliberately, so the sweep is what eventually reclaims it.
    rmSync(record.stateRoot.stateRoot, { recursive: true, force: true });
  });

  it("removes the root when the Runtime is signalled", async () => {
    // `holdMs` keeps the Runtime alive past its work so the Service's
    // cancellation, which sends SIGTERM first, lands while it is still running.
    // `beginTrialInspection`, not `startTrialInspection`: the handle is what
    // carries `cancel`, and the inspection must still be running to receive it.
    const outcome = beginTrialInspection(request("disposal-0004"), {
      holdMs: 4000,
    });
    if (!outcome.admitted) {
      throw new Error(`inspection refused: ${outcome.code}`);
    }
    await new Promise((settle) => {
      setTimeout(settle, 700);
    });
    outcome.cancel();
    const record = await outcome.settled;

    expect(record.termination).toBe("cancelled");
    // Whether the handler won the race against SIGKILL is the host's timing,
    // but the root must not survive: either the Runtime removed it, or it is
    // left marked for the sweep. Both are AC-0079-conforming only if the first
    // happened, so this asserts the signal path actually ran.
    expect(disposalLine(record)).toMatchObject({ reason: "SIGTERM" });
    expect(existsSync(record.stateRoot.stateRoot)).toBe(false);
  });
});

describe("AC-0078 no data from one request is readable by a later one", () => {
  it("gives each request a distinct root and leaves nothing of the first", async () => {
    const first = await run("disposal-0005");
    const second = await run("disposal-0006");

    // Unpredictable per request: `mkdtemp` names are never reused.
    expect(first.stateRoot.stateRoot).not.toBe(second.stateRoot.stateRoot);
    // Nothing of the first survives for the second to read.
    expect(existsSync(first.stateRoot.stateRoot)).toBe(false);
    expect(second.stateRoot.materializationRoot).not.toBe(
      first.stateRoot.materializationRoot,
    );
  });
});

describe("AC-0082 the Service invokes the sweep without performing it", () => {
  /** An abandoned root: marked, but naming a process that is not running. */
  function abandonedRoot(name: string): string {
    const root = join(sweepDomain, name);
    mkdirSync(root, { mode: 0o700 });
    writeFileSync(
      join(root, ".studio-ownership.json"),
      `${JSON.stringify({
        schema: 2,
        pid: 99998,
        startTime: "Wed Sep  9 08:15:07 2026",
        tokenConvention: LIVENESS_TOKEN_CONVENTION,
      })}\n`,
    );
    // Content under the tree child, so reclaiming it requires descending into a
    // materialization root -- which is exactly what the Service must not do.
    mkdirSync(join(root, "tree"), { mode: 0o700 });
    writeFileSync(join(root, "tree", "workspace.toml"), "x=1\n");
    chmodSync(root, 0o700);
    return root;
  }

  it("reclaims an abandoned root, and the sweep runs in the Runtime", async () => {
    const abandoned = abandonedRoot("abandoned-one");
    expect(existsSync(abandoned)).toBe(true);

    const record = await run("disposal-0007");

    // The sweep line is in the *child's* protocol stream, which is the
    // structural proof the Service invoked it rather than performed it: the
    // Service only passed --sweep-domain and the flag.
    const swept = record.protocolLines.find((line) => line.type === "sweep");
    expect(swept).toBeDefined();
    expect(swept?.domain).toBe(sweepDomain);

    // Limb 1: a marker naming no live process, reclaimed without an age gate.
    const outcomes = (swept?.outcomes ?? []) as Record<string, unknown>[];
    expect(outcomes).toContainEqual(
      expect.objectContaining({
        name: "abandoned-one",
        action: "reclaimed",
        limb: 1,
        removed: true,
      }),
    );
    expect(existsSync(abandoned)).toBe(false);
  });

  it("declines a root whose token predates the rendering convention", async () => {
    // The sweep that matters is the one inside the Runtime child, which is a
    // separate code path from `sweep.ts` and the one that actually runs on
    // every inspection. This case covers it at the same boundary the unit
    // tests cover the Service-side reader.
    //
    // The marker names a process that IS alive -- this test process -- and
    // records no convention, which is what a marker written before this
    // amendment's pin carries. Comparing its bytes against a rendering from
    // the pinned environment yields inequality on a non-UTC host, and limb 1
    // has no age gate, so without the convention check the child would delete
    // a live Runtime's state root.
    const root = join(sweepDomain, "live-old-convention");
    mkdirSync(root, { mode: 0o700 });
    writeFileSync(
      join(root, ".studio-ownership.json"),
      `${JSON.stringify({
        schema: 1,
        pid: process.pid,
        startTime: "Wed Sep  9 08:15:07 2026",
      })}\n`,
    );
    chmodSync(root, 0o700);

    const record = await run("disposal-0009");
    const swept = record.protocolLines.find((line) => line.type === "sweep");
    const outcomes = (swept?.outcomes ?? []) as Record<string, unknown>[];
    expect(outcomes).toContainEqual(
      expect.objectContaining({
        name: "live-old-convention",
        action: "declined",
        limb: 1,
        inputClass: "liveness-token-convention",
      }),
    );
    expect(existsSync(root)).toBe(true);
    rmSync(root, { recursive: true, force: true });
  });

  it("never reclaims the root of the inspection that invoked it", async () => {
    const record = await run("disposal-0008", { retainStateRoot: true });
    const swept = record.protocolLines.find((line) => line.type === "sweep");
    const outcomes = (swept?.outcomes ?? []) as Record<string, unknown>[];
    const ownName = record.stateRoot.stateRoot.slice(sweepDomain.length + 1);
    expect(outcomes.map((outcome) => outcome.name)).not.toContain(ownName);
    expect(existsSync(record.stateRoot.stateRoot)).toBe(true);
    rmSync(record.stateRoot.stateRoot, { recursive: true, force: true });
  });
});
