import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
