/**
 * The declared-value read on the live path.
 *
 * `declared-value-reader.test.ts` proves the reader's units. This suite proves
 * the wiring: that a real child performs the read under both bounds, that the
 * Service parses what it reports through the guarded parser, and that a
 * refusal reaches the outcome the *Reasons for `inspection-stopped`* table
 * assigns. Those are positive obligations -- "refuses X", "reports Y" -- and a
 * refusal needs a live path to refuse on, which is why unit proof alone left
 * AC-0054 and AC-0055 unmet.
 *
 * Every test spawns a real detached process group, so this file carries the
 * same allowance, and the same reason, as the other process-tree suites.
 */
import { chmodSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { parseGuardedJson, STOP_REASONS } from "@agent-ready/protocol";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  declaredRefusalOutcome,
  refusedResultOutcome,
  settledRuntimeOutcome,
} from "../../source-inspection.js";
import {
  DECLARED_READ_BYTE_BOUND,
  DECLARED_READ_FILE_BOUND,
  DECLARED_VERSION_KEY,
  PERMITTED_READ_SURFACE,
  WORKSPACE_DECLARATION_NAME,
} from "./declared-value-reader.js";
import {
  DECLARED_DIAGNOSTIC_BOUND_CODE_UNITS,
  declaredFromProtocol,
  startTrialInspection,
  type TrialInspectionOptions,
  type TrialInspectionRecord,
} from "./runtime-supervisor.js";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const STATE_DECLARATION_NAME = ".agentbundle-state.toml";

let fixtureRoot: string;
let sweepDomain: string;

beforeAll(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), "connect-orient-declared-"));
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

/** The plan the Service actually delivered, read off the argument vector. */
function deliveredPlan(record: TrialInspectionRecord): Record<string, unknown> {
  const planIndex = record.childArgs.indexOf("--plan");
  expect(planIndex).toBeGreaterThan(-1);
  return JSON.parse(record.childArgs[planIndex + 1] ?? "") as Record<
    string,
    unknown
  >;
}

/** An inline-table chain whose parsed depth passes the nesting bound. */
function deeplyNestedToml(levels: number): string {
  return `root = ${"{ a = ".repeat(levels)}1${" }".repeat(levels)}\n`;
}

describe("the declared-read bounds are the canonical values", () => {
  it("pins the diagnostic bound rather than asserting it against itself", () => {
    // Every sibling bound in this cluster is pinned to its value. Without
    // this, loosening the divisor to /3 keeps the over-bound case green while
    // a worst-case three-byte-per-unit diagnostic reaches 262_143 of the
    // 262_144 bytes the persisted record counts -- and that record refuses
    // rather than truncates, which is the verdict suppression the bound
    // exists to prevent.
    expect(DECLARED_DIAGNOSTIC_BOUND_CODE_UNITS).toBe(32_768);
  });
});

describe("AC-0054 the declared read stays inside the permitted read surface", () => {
  it("refuses a name outside the surface and extracts nothing", async () => {
    const record = await run("declared-outside-surface", {
      declaredReadNames: ["secrets.toml"],
    });

    expect(record.declared?.refusal).toBe("outside-permitted-read-surface");
    expect(record.declared?.diagnostic).toContain("secrets.toml");
    // AC-0059: a refusal contributes no extracted value at all.
    expect(record.declared?.reads).toEqual([]);
    expect(record.declared?.versionMarker).toBeUndefined();
  });

  it("delivers the canonical surface rather than a copy that can drift", async () => {
    // The child cannot import the reader that owns this list, so the only
    // thing keeping one source of truth is that the Service ships it.
    const record = await run("declared-surface-delivered");

    expect(deliveredPlan(record).declaredReadSurface).toEqual([
      ...PERMITTED_READ_SURFACE,
    ]);
  });
});

describe("AC-0055 the declared read is bounded before it reads", () => {
  it("delivers the canonical bounds, not just the surface", async () => {
    // Without this the production defaults are exercised but never observed:
    // every bound case below overrides them, so a wrong default ships green.
    const record = await run("declared-bounds-delivered");
    const plan = deliveredPlan(record);

    expect(plan.declaredReadByteBound).toBe(DECLARED_READ_BYTE_BOUND);
    expect(plan.declaredReadFileBound).toBe(DECLARED_READ_FILE_BOUND);
  });

  it("refuses more names than the file-count bound before opening anything", async () => {
    const record = await run("declared-file-count", {
      declaredReadNames: [
        ...PERMITTED_READ_SURFACE,
        ...PERMITTED_READ_SURFACE,
      ].slice(0, DECLARED_READ_FILE_BOUND + 1),
    });

    expect(record.declared?.refusal).toBe("exceeds-file-count-bound");
    expect(record.declared?.reads).toEqual([]);
  });

  it("admits a declaration file of exactly the byte bound", async () => {
    // Paired with the over-bound case below. Without an at-bound admission the
    // comparison is unbound: `>` and `>=` behave identically on every other
    // fixture, and the canonical guard this one mirrors is pinned the same way
    // (materialization-confinement.test.ts, AC-0075).
    const declaration = 'schema-version = "3"\n';
    const contents = `${declaration}# ${"p".repeat(64 - declaration.length - 3)}\n`;
    expect(Buffer.byteLength(contents, "utf8")).toBe(64);

    const record = await run("declared-at-byte-bound", {
      declaredReadByteBound: 64,
      declaredReadNames: [STATE_DECLARATION_NAME],
      declaredFixtures: [{ name: STATE_DECLARATION_NAME, contents }],
    });

    const [read] = record.declared?.reads ?? [];
    expect(read?.refusal).toBeUndefined();
    expect(record.declared?.versionMarker).toBe("3");
  });

  it("refuses a declaration file over the byte bound without reading it", async () => {
    const record = await run("declared-byte-bound", {
      declaredReadByteBound: 64,
      declaredReadNames: [WORKSPACE_DECLARATION_NAME],
      declaredFixtures: [
        {
          name: WORKSPACE_DECLARATION_NAME,
          contents: "# padding\n",
          repeat: 20,
        },
      ],
    });

    const [read] = record.declared?.reads ?? [];
    expect(read?.refusal).toBe("exceeds-byte-bound");
    expect(read?.diagnostic).toContain("bound is 64");
    expect(read?.value).toBeUndefined();
  });
});

describe("AC-0074 the declared read refuses anything that is not a regular file", () => {
  it("refuses a directory standing at a permitted name", async () => {
    // The only way to reach the symlink-and-isFile branch: a file fixture
    // cannot produce a non-regular entry.
    const record = await run("declared-non-regular", {
      declaredReadNames: [WORKSPACE_DECLARATION_NAME],
      declaredFixtures: [{ name: WORKSPACE_DECLARATION_NAME, directory: true }],
    });

    const [read] = record.declared?.reads ?? [];
    expect(read?.refusal).toBe("unreadable");
    expect(read?.diagnostic).toContain("not a regular file");
    expect(read?.value).toBeUndefined();
    // Not absent: the name exists, so saying the repository declares none
    // would be a false statement about the tree.
    expect(read?.absent).toBeUndefined();
  });
});

describe("AC-0056 and AC-0057 the Service parses what the child read", () => {
  it("reports the version marker an admitted document declares", async () => {
    const record = await run("declared-version-marker", {
      declaredFixtures: [
        { name: WORKSPACE_DECLARATION_NAME, contents: "[work]\nqueue = []\n" },
        { name: STATE_DECLARATION_NAME, contents: 'schema-version = "3"\n' },
      ],
    });

    expect(record.declared?.versionMarker).toBe("3");
  });

  it("carries the text base64-encoded so escaping cannot inflate it", async () => {
    // Raw text let a repository breach the 8 MiB result bound: JSON escaping
    // renders a control byte as six characters, so two files that each pass
    // the 1 MiB read bound serialize to 12.58 MiB and the whole protocol
    // stream is discarded. Base64's inflation is a fixed 4/3.
    const record = await run("declared-base64", {
      declaredReadNames: [STATE_DECLARATION_NAME],
      declaredFixtures: [
        { name: STATE_DECLARATION_NAME, contents: 'schema-version = "7"\n' },
      ],
    });

    const line = record.protocolLines.find((l) => l.type === "declared") as
      | { reads?: { encoding?: string; text?: string }[] }
      | undefined;
    const [emitted] = line?.reads ?? [];
    expect(emitted?.encoding).toBe("base64");
    expect(emitted?.text).toBe(
      Buffer.from('schema-version = "7"\n', "utf8").toString("base64"),
    );
    // And it still parses through to the marker.
    expect(record.declared?.versionMarker).toBe("7");
  });

  it("copies only the criterion-named field onto a fresh object", async () => {
    const record = await run("declared-only-named-field", {
      declaredReadNames: [STATE_DECLARATION_NAME],
      declaredFixtures: [
        {
          name: STATE_DECLARATION_NAME,
          contents: 'schema-version = "3"\nunrelated = "carried nowhere"\n',
        },
      ],
    });

    const [read] = record.declared?.reads ?? [];
    expect(Object.keys(read?.value as object)).toEqual([DECLARED_VERSION_KEY]);
    // AC-0057: materialized without an inherited prototype.
    expect(Object.getPrototypeOf(read?.value as object)).toBeNull();
  });

  it("yields no value from a document nesting past the depth bound", async () => {
    const record = await run("declared-nesting-depth", {
      declaredReadNames: [STATE_DECLARATION_NAME],
      declaredFixtures: [
        { name: STATE_DECLARATION_NAME, contents: deeplyNestedToml(70) },
      ],
    });

    const [read] = record.declared?.reads ?? [];
    // Named exactly: `parse-failed` would satisfy "some refusal" while
    // meaning the parser rejected it first and the depth guard never ran.
    expect(read?.refusal).toBe("exceeds-nesting-depth");
    expect(read?.value).toBeUndefined();
    expect(record.declared?.versionMarker).toBeUndefined();
  });
});

describe("AC-0059 a refused declaration read routes to inspection-stopped", () => {
  it("extracts nothing from a malformed declaration file", async () => {
    const record = await run("declared-malformed", {
      declaredReadNames: [STATE_DECLARATION_NAME],
      declaredFixtures: [
        { name: STATE_DECLARATION_NAME, contents: "schema-version = \n" },
      ],
    });

    const [read] = record.declared?.reads ?? [];
    expect(read?.refusal).toBe("parse-failed");
    expect(read?.value).toBeUndefined();

    // The outcome, not just the producer's field: this is what the lead sees.
    expect(declaredRefusalOutcome(record.declared)).toMatchObject({
      ok: false,
      condition: "inspection-stopped",
      stopReason: "parse-failure-declaration-file",
    });
  });

  it("leaves a malformed workspace.toml to the malformed condition", async () => {
    // AC-0059's repository-file branch covers only a declaration file that is
    // not the workspace declaration. Routing this to the declaration-file row
    // would stop the inspection under a reason the contract excludes.
    const record = await run("declared-malformed-workspace", {
      declaredReadNames: [WORKSPACE_DECLARATION_NAME],
      declaredFixtures: [
        { name: WORKSPACE_DECLARATION_NAME, contents: "queue = \n" },
      ],
    });

    const [read] = record.declared?.reads ?? [];
    expect(read?.refusal).toBe("parse-failed");
    expect(read?.value).toBeUndefined();
    expect(declaredRefusalOutcome(record.declared)).toBeUndefined();
  });

  it("carries the row's reason and attribution to the outcome", () => {
    const outcome = declaredRefusalOutcome({
      reads: [
        {
          name: STATE_DECLARATION_NAME,
          routesToDeclarationFileStop: true,
          refusal: "parse-failed",
          diagnostic: "declared document could not be parsed",
        },
      ],
      versionMarker: undefined,
    });

    expect(outcome).toMatchObject({
      ok: false,
      condition: "inspection-stopped",
      stopReason: "parse-failure-declaration-file",
      // The diagnostic naming which file failed must survive to the outcome,
      // or every cause reads the same.
      diagnostics: "declared document could not be parsed",
    });
    // The reason and attribution are the table's, not this module's.
    expect(STOP_REASONS["parse-failure-declaration-file"]).toMatchObject({
      reason: "A declaration file in the repository could not be read",
      attribution: "repository",
    });
  });

  it("falls back to the table's own wording when no diagnostic survives", () => {
    expect(
      declaredRefusalOutcome({
        reads: [],
        refusal: "exceeds-file-count-bound",
        versionMarker: undefined,
      }),
    ).toMatchObject({
      diagnostics: STOP_REASONS["parse-failure-declaration-file"].reason,
    });
  });

  it("leaves a clean read alone", () => {
    expect(
      declaredRefusalOutcome({
        reads: [
          {
            name: WORKSPACE_DECLARATION_NAME,
            routesToDeclarationFileStop: false,
            value: {},
          },
        ],
        versionMarker: undefined,
      }),
    ).toBeUndefined();
  });

  it("does not stop the inspection over a repository that declares nothing", () => {
    // The only thing keeping AC-0064's case out of `inspection-stopped`.
    expect(
      declaredRefusalOutcome({
        reads: PERMITTED_READ_SURFACE.map((name) => ({
          name,
          absent: true,
          routesToDeclarationFileStop: name !== WORKSPACE_DECLARATION_NAME,
        })),
        versionMarker: undefined,
      }),
    ).toBeUndefined();
  });

  it("bounds a repository-derived diagnostic before it becomes an outcome", async () => {
    // The persisted record refuses an oversized repository-derived value
    // rather than truncating it, so an unbounded parser message would let a
    // repository make its own verdict unpersistable.
    // One unterminated string, long enough that the parser quotes 120_163
    // characters back. Twenty shorter lines only reach 12_186 and would pass
    // this assertion with the bound deleted.
    const record = await run("declared-long-diagnostic", {
      declaredReadNames: [STATE_DECLARATION_NAME],
      declaredFixtures: [
        {
          name: STATE_DECLARATION_NAME,
          contents: `schema-version = "${"z".repeat(60_000)}\n`,
        },
      ],
    });

    const [read] = record.declared?.reads ?? [];
    expect(read?.refusal).toBe("parse-failed");
    // Exactly the bound plus the elision mark, so an unbounded diagnostic
    // reddens this rather than merely being larger than expected.
    expect((read?.diagnostic ?? "").length).toBe(
      DECLARED_DIAGNOSTIC_BOUND_CODE_UNITS + 1,
    );
  });
});

describe("the Service checks the line rather than trusting it", () => {
  // The child is the process that handled repository content, so what it
  // reports back crosses a trust boundary. These drive the line directly:
  // the child cannot be made to emit a value outside its own vocabulary, so
  // without this the two checks below could not fail.
  it("drops a refusal the union does not declare", () => {
    const report = declaredFromProtocol([
      {
        type: "declared",
        reads: [{ name: STATE_DECLARATION_NAME, refusal: "unusable" }],
      },
    ]);

    const [read] = report?.reads ?? [];
    // The child's string never reaches the typed field. This fixture carries
    // no payload, so the read is refused either way; the case above is the one
    // that proves an unrecognised refusal denies a read that *does* carry one.
    // `unusable` was exactly the value the two sides drifted onto.
    expect(read?.refusal).not.toBe("unusable");
    expect(read?.refusal).toBe("unreadable");
    expect(read?.value).toBeUndefined();
  });

  it("bounds the diagnostic on a whole-read refusal too", () => {
    // The read-level call site is pinned three times over; this is the
    // line-level one, which the unrecognised-refusal case above cannot reach
    // because that branch substitutes a fixed string.
    const report = declaredFromProtocol([
      {
        type: "declared",
        reads: [],
        refusal: "exceeds-file-count-bound",
        diagnostic: "y".repeat(DECLARED_DIAGNOSTIC_BOUND_CODE_UNITS + 500),
      },
    ]);

    expect(report?.refusal).toBe("exceeds-file-count-bound");
    expect((report?.diagnostic ?? "").length).toBe(
      DECLARED_DIAGNOSTIC_BOUND_CODE_UNITS + 1,
    );
  });

  it("denies a whole read whose refusal the union does not declare", () => {
    // Dropping it would be the fail-open direction: the refusal would vanish
    // and `declaredRefusalOutcome` would see nothing to route.
    const report = declaredFromProtocol([
      { type: "declared", reads: [], refusal: "not-a-member" },
    ]);

    expect(report?.refusal).toBe("unreadable");
    expect(report?.diagnostic).toContain("cannot read");
    expect(report?.reads).toEqual([]);
  });

  it("ignores a name the Service never delivered, and keeps the ones it did", () => {
    // The permitted name beside them is what separates a selective filter
    // from a whole-line discard: asserting only an empty result would stay
    // green if the loop returned an empty report instead of skipping one name.
    const report = declaredFromProtocol([
      {
        type: "declared",
        reads: [
          { name: "../../etc/passwd", encoding: "base64", text: "" },
          { name: "secrets.toml", refusal: "parse-failed" },
          {
            name: STATE_DECLARATION_NAME,
            encoding: "base64",
            text: Buffer.from('schema-version = "5"\n', "utf8").toString(
              "base64",
            ),
          },
        ],
      },
    ]);

    expect(report?.reads.map((read) => read.name)).toEqual([
      STATE_DECLARATION_NAME,
    ]);
    expect(report?.versionMarker).toBe("5");
  });

  it("keeps a diagnostic of exactly the bound whole", () => {
    // Paired with the over-bound case, so `<=` cannot silently become `<`.
    const exact = "z".repeat(DECLARED_DIAGNOSTIC_BOUND_CODE_UNITS);
    const report = declaredFromProtocol([
      {
        type: "declared",
        reads: [
          {
            name: STATE_DECLARATION_NAME,
            refusal: "parse-failed",
            diagnostic: exact,
          },
        ],
      },
    ]);

    expect(report?.reads[0]?.diagnostic).toBe(exact);
    expect(report?.reads[0]?.diagnostic).not.toContain("…");
  });

  it("never cuts a diagnostic between a high and a low surrogate", () => {
    // The cut lands inside repository-controlled text, so an astral character
    // can straddle it. A lone surrogate would reach the persisted record.
    const head = "z".repeat(DECLARED_DIAGNOSTIC_BOUND_CODE_UNITS - 1);
    const report = declaredFromProtocol([
      {
        type: "declared",
        reads: [
          {
            name: STATE_DECLARATION_NAME,
            refusal: "parse-failed",
            diagnostic: `${head}😀${"z".repeat(100)}`,
          },
        ],
      },
    ]);

    const diagnostic = report?.reads[0]?.diagnostic ?? "";
    expect(diagnostic.endsWith("…")).toBe(true);
    // No unpaired surrogate survived the cut.
    expect(/[\uD800-\uDFFF]/.test(diagnostic)).toBe(false);
  });

  it("denies a read whose refusal the Service cannot interpret", () => {
    // Absence and rejection are different answers. An unrecognised refusal
    // beside a well-formed payload must not fall through to the admit path.
    const report = declaredFromProtocol([
      {
        type: "declared",
        reads: [
          {
            name: STATE_DECLARATION_NAME,
            refusal: "not-a-member",
            encoding: "base64",
            text: Buffer.from('schema-version = "9"\n', "utf8").toString(
              "base64",
            ),
          },
        ],
      },
    ]);

    expect(report?.reads[0]?.refusal).toBe("unreadable");
    expect(report?.reads[0]?.value).toBeUndefined();
    expect(report?.versionMarker).toBeUndefined();
  });

  it("extracts nothing from a corrupt payload that claims the transport", () => {
    // Node's base64 decoder discards characters outside the alphabet rather
    // than failing, so a labelled but corrupt payload would otherwise decode
    // to a short string -- and an empty TOML document parses successfully,
    // which would report a transport fault as "the repository declares none".
    const report = declaredFromProtocol([
      {
        type: "declared",
        reads: [
          {
            name: STATE_DECLARATION_NAME,
            encoding: "base64",
            text: "!!!not-base64!!!",
          },
        ],
      },
    ]);

    expect(report?.reads[0]?.refusal).toBe("unreadable");
    expect(report?.reads[0]?.value).toBeUndefined();
    expect(report?.versionMarker).toBeUndefined();
  });

  it("extracts nothing from an unlabelled payload", () => {
    // No `encoding` marker means the bytes were not the agreed transport, so
    // they are not fed to the parser as if they were text.
    const report = declaredFromProtocol([
      {
        type: "declared",
        reads: [{ name: STATE_DECLARATION_NAME, text: 'schema-version = "9"' }],
      },
    ]);

    expect(report?.versionMarker).toBeUndefined();
    // Not an empty document: `parseDeclared("")` succeeds, so decoding a bad
    // payload to "" would report a transport fault as a repository that
    // declares nothing.
    expect(report?.reads[0]?.refusal).toBe("unreadable");
    expect(report?.reads[0]?.value).toBeUndefined();
  });

  it("skips a read whose name is not a name, and keeps the one beside it", () => {
    // Driven through the real guard rather than an object literal, because
    // the defect is a property of what the guard yields: it rebuilds each
    // object with a null prototype, so `String(read.name)` on a name that
    // arrived as an object throws `TypeError` instead of producing
    // "[object Object]". That throw escaped into the `settled` builder and
    // discarded an otherwise completed inspection. The permitted read beside
    // them is what separates a selective skip from a whole-line discard.
    const line = parseGuardedJson(
      JSON.stringify({
        type: "declared",
        reads: [
          { name: { nested: "workspace.toml" }, encoding: "base64", text: "" },
          null,
          42,
          {
            name: STATE_DECLARATION_NAME,
            encoding: "base64",
            text: Buffer.from('schema-version = "7"\n', "utf8").toString(
              "base64",
            ),
          },
        ],
      }),
    ) as Record<string, unknown>;

    const report = declaredFromProtocol([line]);

    expect(report?.reads.map((read) => read.name)).toEqual([
      STATE_DECLARATION_NAME,
    ]);
    expect(report?.versionMarker).toBe("7");
  });
});

describe("the settled record routes to one outcome, in a fixed order", () => {
  const materialized = [{ type: "materialized", status: 0 }];

  it("prefers a refused result over the declared read", () => {
    // Order is load-bearing: a refused result means the declared line was cut
    // off mid-write, so reading it as "the repository declares none" would
    // attribute a repository-caused stop to Studio.
    expect(
      settledRuntimeOutcome({
        protocolLines: materialized,
        resultRefused: true,
        declared: {
          reads: [
            {
              name: STATE_DECLARATION_NAME,
              routesToDeclarationFileStop: true,
              refusal: "parse-failed",
            },
          ],
          versionMarker: undefined,
        },
      }),
    ).toMatchObject({ stopReason: "result-too-large" });
  });

  it("routes a refused declaration when the result was read in full", () => {
    expect(
      settledRuntimeOutcome({
        protocolLines: materialized,
        resultRefused: false,
        declared: {
          reads: [
            {
              name: STATE_DECLARATION_NAME,
              routesToDeclarationFileStop: true,
              refusal: "parse-failed",
            },
          ],
          versionMarker: undefined,
        },
      }),
    ).toMatchObject({ stopReason: "parse-failure-declaration-file" });
  });

  it("reaches inspector-unavailable only when nothing refused", () => {
    expect(
      settledRuntimeOutcome({
        protocolLines: materialized,
        resultRefused: false,
        declared: {
          reads: PERMITTED_READ_SURFACE.map((name) => ({
            name,
            absent: true,
            routesToDeclarationFileStop: name !== WORKSPACE_DECLARATION_NAME,
          })),
          versionMarker: undefined,
        },
      }),
    ).toMatchObject({ condition: "inspector-unavailable" });
  });

  it("stops before either refusal when nothing was materialized", () => {
    expect(
      settledRuntimeOutcome({
        protocolLines: [{ type: "materialized", status: 1 }],
        resultRefused: true,
        declared: undefined,
      }),
    ).toMatchObject({
      condition: "inspection-stopped",
      diagnostics: "the Runtime did not materialize the revision",
    });
  });
});

describe("AC-0093 a refused result is attributed to the repository", () => {
  it("routes a refused result to inspection-stopped, not inspector-unavailable", () => {
    // The volume that breached the bound is materialized content, so calling
    // it a Studio fault is the attribution crossing AC-0093 forbids.
    expect(refusedResultOutcome(true)).toMatchObject({
      ok: false,
      condition: "inspection-stopped",
      stopReason: "result-too-large",
    });
    expect(STOP_REASONS["result-too-large"].attribution).toBe("repository");
  });

  it("says nothing when the result was read in full", () => {
    expect(refusedResultOutcome(false)).toBeUndefined();
  });
});

describe("AC-0064 a repository that declares no version marker", () => {
  it("reports each file absent rather than refusing", async () => {
    // An empty materialization root: neither declaration file exists. That is
    // "the repository declares none", which is not a failure to report.
    const record = await run("declared-absent");

    expect(record.declared?.refusal).toBeUndefined();
    expect(record.declared?.reads.map((read) => read.name)).toEqual([
      ...PERMITTED_READ_SURFACE,
    ]);
    expect(record.declared?.reads.every((read) => read.absent === true)).toBe(
      true,
    );
    expect(record.declared?.versionMarker).toBeUndefined();
  });
});
