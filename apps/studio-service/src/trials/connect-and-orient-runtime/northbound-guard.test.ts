/**
 * The northbound protocol line's guards, AC-0056 and AC-0057, at the Service's
 * own call site.
 *
 * `guarded-parse.test.ts` in `@agent-ready/protocol` carries the helper's unit
 * coverage and `validator.test.ts` carries the transport site. This file
 * carries the other northbound site: the protocol line a real Runtime child
 * writes and `runtime-supervisor.ts` parses. A guard proven only for the
 * helper is not proven where it is used, which is the defect class this slice
 * exists to close.
 *
 * Every test spawns a real detached process group, so this file carries the
 * same allowance, and the same reason, as the other process-tree suites.
 */
import { chmodSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { PARSE_NESTING_DEPTH_BOUND } from "./inadmissible-keys.js";
import {
  startTrialInspection,
  type TrialInspectionOptions,
  type TrialInspectionRecord,
} from "./runtime-supervisor.js";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let fixtureRoot: string;
let sweepDomain: string;

beforeAll(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), "connect-orient-northbound-"));
  sweepDomain = join(fixtureRoot, "sweep");
  mkdirSync(sweepDomain, { recursive: true, mode: 0o700 });
  chmodSync(sweepDomain, 0o700);
});

afterAll(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

async function run(
  id: string,
  supervision: TrialInspectionOptions = {},
): Promise<TrialInspectionRecord> {
  const outcome = await startTrialInspection(
    {
      requestId: id,
      identity: { owner: "owner", repository: "repository" },
      sweepDomain,
    },
    { sweepOnStart: false, ...supervision },
  );
  if (!outcome.admitted) {
    throw new Error(`trial refused: ${outcome.code}`);
  }
  return outcome;
}

describe("AC-0056 at the northbound protocol line", () => {
  it("yields no value from a line past the parse nesting-depth bound", async () => {
    const depth = PARSE_NESTING_DEPTH_BOUND + 1;
    const deep = `${"[".repeat(depth)}1${"]".repeat(depth)}`;
    const record = await run("northbound-depth", {
      rawStdoutLines: [deep],
    });

    // Refused: it never becomes a protocol line, and it is kept where this
    // site already keeps input it cannot parse.
    expect(record.nonProtocolStdoutLines).toContain(deep);
    for (const line of record.protocolLines) {
      expect(Array.isArray(line)).toBe(false);
    }
    // The run still completed, so the refusal cost only that line.
    expect(record.completedResponse).toBe(true);
  });

  it("admits a line at exactly the bound", async () => {
    // Paired with the case above, so the comparison itself is bound rather
    // than only its far side. The interior array carries `bound - 1` brackets
    // because the enclosing object is the first level, which makes the line's
    // measured text depth exactly the bound; at `bound - 2` it measured 63 and
    // a `>` turned `>=` was admitted at both ends and survived here.
    const depth = PARSE_NESTING_DEPTH_BOUND;
    const atBound = JSON.stringify({
      type: "at-bound",
      deep: JSON.parse(`${"[".repeat(depth - 1)}1${"]".repeat(depth - 1)}`),
    });
    const record = await run("northbound-at-bound", {
      rawStdoutLines: [atBound],
    });

    expect(record.protocolLines.some((line) => line.type === "at-bound")).toBe(
      true,
    );
    expect(record.nonProtocolStdoutLines).not.toContain(atBound);
  });
});

describe("a northbound line that is not a record", () => {
  it("keeps every non-record line as non-protocol output and still completes", async () => {
    // `parseGuardedJson` succeeds on all four: a guarded parse of the line
    // `null` yields `null`, and a number, a string and an array are all valid
    // JSON. Every consumer of `protocolLines` reads a field off the line, and
    // the nearest of those reads sits inside the stdout data listener, so
    // asserting the shape rather than establishing it made a four-character
    // line an uncaught `TypeError` that ends the Service and every other
    // in-flight request.
    const notRecords = ["null", "42", '"text"', "[1,2]"];
    const record = await run("northbound-not-a-record", {
      rawStdoutLines: notRecords,
    });

    for (const line of notRecords) {
      expect(record.nonProtocolStdoutLines).toContain(line);
    }
    for (const line of record.protocolLines) {
      expect(line === null).toBe(false);
      expect(typeof line).toBe("object");
      expect(Array.isArray(line)).toBe(false);
    }
    expect(record.completedResponse).toBe(true);
  });
});

describe("AC-0057 at the northbound protocol line", () => {
  it("lets no value under an inadmissible key become a protocol line", async () => {
    const hostile = JSON.stringify({
      type: "hostile",
      nested: { deeper: { __proto__: { polluted: true }, kept: 1 } },
      constructor: "dropped",
    });
    const record = await run("northbound-keys", {
      rawStdoutLines: [hostile],
    });

    const line = record.protocolLines.find((l) => l.type === "hostile") as
      | { nested: { deeper: Record<string, unknown> } }
      | undefined;
    expect(line).toBeDefined();
    // The admissible sibling survives, so the case is not passing because the
    // whole line vanished.
    expect(line?.nested.deeper.kept).toBe(1);
    expect(Object.hasOwn(line?.nested.deeper as object, "__proto__")).toBe(
      false,
    );
    expect(Object.hasOwn(line as object, "constructor")).toBe(false);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("materializes every admitted protocol line without an inherited prototype", async () => {
    const record = await run("northbound-prototypes", {
      rawStdoutLines: [
        JSON.stringify({
          type: "shaped",
          inner: { leaf: 1 },
          list: [{ l: 2 }],
        }),
      ],
    });

    const shaped = record.protocolLines.find((l) => l.type === "shaped") as
      | { inner: object; list: object[] }
      | undefined;
    expect(shaped).toBeDefined();
    expect(Object.getPrototypeOf(shaped as object)).toBeNull();
    expect(Object.getPrototypeOf(shaped?.inner as object)).toBeNull();
    expect(Object.getPrototypeOf(shaped?.list[0] as object)).toBeNull();
    // The Runtime's own lines take the same treatment, not just injected ones.
    const started = record.protocolLines.find((l) => l.type === "started");
    expect(Object.getPrototypeOf(started as object)).toBeNull();
  });

  it("copies only criterion-named fields out of a protocol line", async () => {
    // AC-0057's third clause at this site: what travels onward is built from
    // named fields, so a field the line invented reaches no Studio value.
    const record = await run("northbound-named-fields", {
      rawStdoutLines: [
        JSON.stringify({
          type: "spawn",
          entry: {
            executable: "/usr/bin/true",
            args: [],
            environmentNames: [],
            shell: false,
            invented: "carried nowhere",
          },
        }),
      ],
    });

    const audited = record.spawnAudit.find(
      (entry) => entry.executable === "/usr/bin/true",
    );
    expect(audited).toBeDefined();
    expect(Object.hasOwn(audited as object, "invented")).toBe(false);
  });

  describe("a line that under-supplies a criterion-named field", () => {
    // One run serves all three cases: each spawns a real detached process
    // group.
    // The three hostile lines sit beside one well-formed line, which is what
    // separates a selective skip from a discard of the whole audit.
    let record: TrialInspectionRecord;

    beforeAll(async () => {
      record = await run("northbound-named-field-types", {
        rawStdoutLines: [
          // A named field arriving as an object: the guard rebuilt it with a
          // null prototype, so coercing it throws rather than yielding
          // "[object Object]".
          JSON.stringify({
            type: "spawn",
            entry: {
              executable: { nested: 1 },
              args: [],
              environmentNames: [],
            },
          }),
          // A named field arriving as a structured argument vector.
          JSON.stringify({
            type: "spawn",
            entry: {
              executable: "/usr/bin/false",
              args: [{ nested: 1 }],
              environmentNames: [],
            },
          }),
          // No entry at all.
          JSON.stringify({ type: "spawn" }),
          JSON.stringify({
            type: "spawn",
            entry: {
              executable: "/usr/bin/env",
              args: ["-0"],
              environmentNames: ["PATH"],
            },
          }),
        ],
      });
    });

    it("still completes the inspection", () => {
      // The lines are parsed inside the `settled` builder, so a `TypeError`
      // raised while normalizing one of them rejected `settled` and discarded
      // an otherwise completed inspection -- the guard turning a hostile line
      // into a denial of the whole run.
      expect(record.completedResponse).toBe(true);
    });

    it("contributes no audit entry for any of them", () => {
      // Filling the entry in would put an empty executable, or a coerced
      // object, into the record as Studio's own account of what it spawned.
      expect(record.spawnAudit.map((entry) => entry.executable)).not.toContain(
        "/usr/bin/false",
      );
      for (const entry of record.spawnAudit) {
        expect(typeof entry.executable).toBe("string");
        expect(entry.executable).not.toBe("");
        expect(entry.executable).not.toContain("[object");
        for (const argument of entry.args) {
          expect(typeof argument).toBe("string");
        }
      }
    });

    it("keeps the well-formed line beside them", () => {
      const audited = record.spawnAudit.find(
        (entry) => entry.executable === "/usr/bin/env",
      );
      expect(audited).toBeDefined();
      expect(audited?.args).toEqual(["-0"]);
      expect(audited?.environmentNames).toEqual(["PATH"]);
    });
  });
});
