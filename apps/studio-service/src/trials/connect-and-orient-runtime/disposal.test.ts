import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
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

  const cleanupRoots: string[] = [];
  afterEach(() => {
    for (const root of cleanupRoots.splice(0))
      rmSync(root, { recursive: true, force: true });
  });

  it("decides every token-convention case in one sweep", async () => {
    // Four candidates, one inspection. Each case is a distinct decision the
    // child's limb 1 must make about an incomparable token, and they are
    // asserted from a single sweep rather than one inspection each: every
    // spawned Runtime in this file lengthens the window in which the global
    // single-in-flight guard turns one timeout into a cascade, and four
    // inspections proving four independent facts is four times that cost for
    // no extra coverage.
    const aged = (Date.now() - 2 * 60 * 60 * 1000) / 1000;
    const marker = (pid: number) =>
      `${JSON.stringify({
        schema: 1,
        pid,
        startTime: "Wed Sep  9 08:15:07 2026",
      })}\n`;

    function candidate(name: string, pid: number, old: boolean): string {
      const root = join(sweepDomain, name);
      mkdirSync(root, { mode: 0o700 });
      writeFileSync(join(root, ".studio-ownership.json"), marker(pid));
      chmodSync(root, 0o700);
      if (old) utimesSync(root, aged, aged);
      return root;
    }

    // Live pid, young: undecidable, so it declines.
    const liveYoung = candidate("live-old-convention", process.pid, false);
    // Live pid, aged past the reclaim age: the pid must have been recycled,
    // because a Runtime SIGKILLs its own group at the inspection deadline.
    const liveAged = candidate("recycled-pid-child", process.pid, true);
    // Absent pid, aged: abandoned like any other root, so the age gate takes it.
    const goneAged = candidate("gone-old-convention", 99998, true);
    // Absent pid, young: held by the age gate, not by a liveness decline.
    const goneYoung = candidate("young-gone-old-convention", 99998, false);

    let record: Awaited<ReturnType<typeof run>>;
    try {
      record = await run("disposal-0009");
    } finally {
      cleanupRoots.push(liveYoung, goneYoung);
    }
    const swept = record.protocolLines.find((line) => line.type === "sweep");
    const outcomes = (swept?.outcomes ?? []) as Record<string, unknown>[];
    const outcomeFor = (name: string) =>
      outcomes.filter((outcome) => outcome.name === name);

    // Each decision is collected rather than asserted inline, so one broken
    // decision does not hide the other three behind an aborted test -- and a
    // reader fixing one does not pay another Runtime spawn to learn about the
    // next. Every failure names its candidate.
    const broken: string[] = [];
    const check = (label: string, holds: boolean) => {
      if (!holds) broken.push(label);
    };

    const declined = (name: string) =>
      outcomeFor(name).some(
        (outcome) =>
          outcome.action === "declined" &&
          outcome.inputClass === "liveness-token-convention",
      );
    const reclaimedOnAge = (name: string) =>
      outcomeFor(name).some(
        (outcome) => outcome.action === "reclaimed" && outcome.limb === 2,
      );

    check(
      "live-old-convention: expected a convention decline",
      declined("live-old-convention"),
    );
    check(
      "live-old-convention: expected the root retained",
      existsSync(liveYoung),
    );

    check(
      "recycled-pid-child: expected an age-gated reclaim",
      reclaimedOnAge("recycled-pid-child"),
    );
    check(
      "recycled-pid-child: expected the root removed",
      !existsSync(liveAged),
    );

    check(
      "gone-old-convention: expected an age-gated reclaim",
      reclaimedOnAge("gone-old-convention"),
    );
    check(
      "gone-old-convention: expected the root removed",
      !existsSync(goneAged),
    );

    // A positive control first: an assertion that only says "not declined"
    // is satisfied by the sweep never having looked at the candidate at all.
    check(
      "young-gone-old-convention: expected the sweep to classify it",
      outcomeFor("young-gone-old-convention").length > 0,
    );
    check(
      "young-gone-old-convention: expected no convention decline",
      !declined("young-gone-old-convention"),
    );
    check(
      "young-gone-old-convention: expected the root retained",
      existsSync(goneYoung),
    );

    expect(broken).toEqual([]);
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
