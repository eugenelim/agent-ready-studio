/**
 * The trial result on the live path.
 *
 * `trial-result.test.ts` proves `normalizeTrialResult`'s units. This suite
 * proves the wiring: that a real child emits a full result line, that the
 * Service validates it in full before normalizing, that each refusal reaches
 * the outcome the *Reasons for `inspection-stopped`* table assigns, and that
 * an admitted result carries AC-0038's five reported elements under AC-0039's
 * provenance markers. Those are positive obligations, and unit proof of a
 * function nothing calls is what left AC-0032 and AC-0034 to AC-0039 unmet.
 *
 * **Why the materialization gate is supplied rather than performed.**
 * `settledRuntimeOutcome` reads the result only after a materialized tree, and
 * materializing one needs a fetch. *Canonical values*, *Permitted git
 * transports* admits `https` only, enforced by `GIT_ALLOW_PROTOCOL=https`,
 * which refuses the `file` transport a local fixture repository would need —
 * AC-0024 states that refusal outright. So the cases below take the result and
 * declared lines a **real child wrote** and supply the materialized line the
 * transport rule puts out of reach. The result being validated is the child's
 * own; only the gate in front of it is stated. `head-mismatch` and
 * `head-unreadable` routing past that gate is bound in `declared-read.test.ts`.
 *
 * Every test that spawns a child starts a real detached process group, so this
 * file carries the same allowance, and the same reason, as the other
 * process-tree suites.
 */
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { STOP_REASONS } from "@agent-ready/protocol";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  PERSISTED_PROVENANCE,
  type SettledRuntimeRecord,
  settledRuntimeOutcome,
} from "../../source-inspection.js";
import {
  type NormalizedTrialResult,
  normalizeTrialResult,
  type RawTrialResult,
  REMOVAL_OUTCOMES,
  TRIAL_CONTRACT,
} from "../../trial-result.js";
import {
  startTrialInspection,
  type TrialInspectionOptions,
  type TrialInspectionRecord,
} from "./runtime-supervisor.js";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const DECLARED_MARKER = "7.4.1";
const STATE_DECLARATION_NAME = ".agentbundle-state.toml";
/**
 * A revision the Service can deliver without a fetch succeeding. The fetch
 * *fails* — `GIT_ALLOW_PROTOCOL=https` refuses this file path, as the header
 * explains — and that is enough: the child reports the SHA it was **given**,
 * so what is bound here is that it reports the plan's value rather than a
 * default. The materialized gate is supplied for the same reason as elsewhere.
 */
const PLANNED_SHA = "0123456789abcdef0123456789abcdef01234567";
const PLANNED_REVISION = {
  fetchUrl: "file:///nonexistent/connect-orient-fixture",
  resolvedSha: PLANNED_SHA,
};

let fixtureRoot: string;
let sweepDomain: string;

beforeAll(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), "connect-orient-result-"));
  sweepDomain = join(fixtureRoot, "sweep");
  mkdirSync(sweepDomain, { recursive: true, mode: 0o700 });
  chmodSync(sweepDomain, 0o700);
});

afterAll(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

/**
 * One child per distinct configuration, shared across the cases that need it.
 * Each `run` starts a real detached process group, and these suites are what
 * `pre-existing-trial-runtime-load-flake` feeds on, so a case that needs
 * nothing new from the child reuses the record rather than spawning again.
 */
let plainRecord: Promise<TrialInspectionRecord> | undefined;
function plainRun(): Promise<TrialInspectionRecord> {
  plainRecord ??= run("result-plain");
  return plainRecord;
}

/**
 * A child given a revision to materialize and a marker to declare. The fetch
 * **fails** -- `PLANNED_REVISION` is the `file://` URL the transport rule
 * refuses -- and that failure is load-bearing: what these cases bind is that
 * the child reports the SHA it was *given*, not one it resolved.
 */
let markerRecord: Promise<TrialInspectionRecord> | undefined;
function withMarker(): Promise<TrialInspectionRecord> {
  markerRecord ??= run("result-with-marker", {
    revision: PLANNED_REVISION,
    declaredFixtures: [
      {
        name: STATE_DECLARATION_NAME,
        contents: `schema-version = "${DECLARED_MARKER}"\n`,
      },
    ],
  });
  return markerRecord;
}

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

function lineOfType(
  record: TrialInspectionRecord,
  type: string,
): Record<string, unknown> | undefined {
  return record.protocolLines.find((line) => line.type === type);
}

/**
 * What a real child wrote, behind the materialized line the transport rule in
 * this file's header puts out of reach.
 */
function liveRecord(record: TrialInspectionRecord): SettledRuntimeRecord {
  return {
    requestId: record.requestId,
    completedResponse: record.completedResponse,
    protocolLines: [
      { type: "materialized", status: 0 },
      ...record.protocolLines,
    ],
    resultRefused: record.resultRefused,
    declared: record.declared,
  };
}

/**
 * The validated result a refused outcome carries, with the union narrowed
 * once here rather than at every assertion. Nothing in this slice returns
 * `ok: true`, so every case that has a result has a refused outcome.
 */
function resultOf(
  record: SettledRuntimeRecord,
): NormalizedTrialResult | undefined {
  const outcome = settledRuntimeOutcome(record);
  expect(outcome.ok).toBe(false);
  return outcome.ok === false ? outcome.result : undefined;
}

/** A settled record carrying one hand-built result line and nothing else. */
function recordWith(
  raw: Record<string, unknown>,
  requestId = "req-studio-minted-one",
): SettledRuntimeRecord {
  return {
    requestId,
    completedResponse: true,
    protocolLines: [
      { type: "materialized", status: 0 },
      { type: "result", ...raw },
    ],
    resultRefused: false,
    declared: { reads: [], versionMarker: undefined },
  };
}

const CONFORMING: Record<string, unknown> = {
  contract: TRIAL_CONTRACT,
  requestId: "req-studio-minted-one",
  status: "inspector-not-run",
  resolvedSha: "a".repeat(40),
  inspectorDiagnostics: "",
  inspectorContractVersion: null,
  removalOutcome: "removed",
  findings: [],
};

describe("AC-0032 the provisional contract is named, and another name is refused", () => {
  it("delivers the canonical contract name to the Runtime", async () => {
    const record = await plainRun();
    const planIndex = record.childArgs.indexOf("--plan");
    expect(planIndex).toBeGreaterThan(-1);
    const plan = JSON.parse(record.childArgs[planIndex + 1] ?? "") as {
      trialContract?: unknown;
    };
    // Delivered rather than duplicated, so the child's own literal — which it
    // must hold, because it can import nothing — has something to be checked
    // against rather than being the only copy.
    expect(plan.trialContract).toBe(TRIAL_CONTRACT);
  });

  it("holds a child-side literal that has not drifted from the canonical value", () => {
    // The delivery assertion above compares `TRIAL_CONTRACT` with itself and
    // so cannot catch a wrong canonical value. The copy that can drift is the
    // child's own literal, and the child cannot import the constant, so this
    // audits its source the way `absence-proofs.test.ts` audits its imports.
    const child = readFileSync(
      new URL("./runtime-child.ts", import.meta.url),
      "utf8",
    );
    const declared = /^const TRIAL_CONTRACT = "([^"]+)";$/m.exec(child);
    expect(declared?.[1]).toBe(TRIAL_CONTRACT);
  });

  it("refuses a plan naming another contract, before it does any work", async () => {
    const record = await run("contract-mismatch-plan", {
      trialContract: "some-other-trial.v9",
    });

    expect(lineOfType(record, "refused")).toMatchObject({
      reason: "contract-mismatch",
    });
    // Nothing was claimed, nothing was read, nothing completed: the refusal
    // consumes no part of the request.
    expect(lineOfType(record, "started")).toBeUndefined();
    expect(lineOfType(record, "declared")).toBeUndefined();
    expect(record.completedResponse).toBe(false);
    expect(record.exit.code).not.toBe(0);
  });

  it("reports a refused run as the refusal, not as a materialization failure", () => {
    // The child refuses before it materializes, so it writes no materialized
    // line. Consulted after the materialization gate this branch is
    // unreachable and the lead is told the revision did not materialize --
    // true, and not the reason.
    const outcome = settledRuntimeOutcome({
      requestId: "req-studio-minted-one",
      completedResponse: false,
      protocolLines: [{ type: "refused", reason: "contract-mismatch" }],
      resultRefused: false,
      declared: undefined,
    });

    expect(outcome).toMatchObject({
      ok: false,
      condition: "inspection-stopped",
      stopReason: "result-invalid-studio",
    });
    expect(outcome.ok === false && outcome.diagnostics).not.toContain(
      "materialize",
    );
  });

  it("refuses a result naming another contract", () => {
    const outcome = settledRuntimeOutcome(
      recordWith({ ...CONFORMING, contract: "some-other-trial.v9" }),
    );

    expect(outcome).toMatchObject({
      ok: false,
      condition: "inspection-stopped",
      stopReason: "result-invalid-studio",
    });
    // The refused name is deliberately *not* echoed: it crossed the process
    // boundary unbounded, and this text is persisted and rendered.
    expect(outcome.ok === false && outcome.diagnostics).not.toContain(
      "some-other-trial.v9",
    );
    expect(outcome.ok === false && outcome.diagnostics).toContain(
      TRIAL_CONTRACT,
    );
  });
});

describe("AC-0034 a result whose request identifier does not match is refused", () => {
  it("compares the echoed identifier against the one Studio minted", () => {
    const outcome = settledRuntimeOutcome(
      recordWith({ ...CONFORMING, requestId: "req-some-other-request" }),
    );

    expect(outcome).toMatchObject({
      condition: "inspection-stopped",
      stopReason: "request-identifier-mismatch",
      diagnostics: STOP_REASONS["request-identifier-mismatch"].reason,
    });
  });

  it("admits the result that echoes the identifier Studio minted", () => {
    expect(resultOf(recordWith(CONFORMING))?.requestId).toBe(
      "req-studio-minted-one",
    );
  });
});

describe("AC-0035 and AC-0036 the result is validated in full, and a refusal consumes nothing", () => {
  it("refuses a well-named, well-identified result whose body does not conform", () => {
    const outcome = settledRuntimeOutcome(
      // Well-named and well-identified: the contract and the identifier both
      // pass, and the body fails on its last checked field.
      recordWith({ ...CONFORMING, removalOutcome: 42 }),
    );

    expect(outcome).toMatchObject({
      condition: "inspection-stopped",
      stopReason: "result-invalid-studio",
    });
    // Not partially consumed: no field of the refused result reaches the
    // outcome, including the fields that validated before the failing one.
    expect(outcome.ok === false && outcome.result).toBeUndefined();
  });

  it("tells every refusal apart from what it emits", () => {
    // All but one share the `result-invalid-studio` row, so the row alone
    // cannot distinguish them. A reader given only the emitted record must
    // still be able to say which fired, without reproducing the run. **Every
    // cause that reaches that row belongs in this list** -- two were added
    // after the first version of this case and were not covered, which let
    // either be collapsed onto the table fallback with the suite green.
    const diagnosticsOf = (record: SettledRuntimeRecord): string => {
      const outcome = settledRuntimeOutcome(record);
      expect(outcome.ok).toBe(false);
      return outcome.ok === false ? outcome.diagnostics : "";
    };
    // Its own row, so its own wording is the right answer and it is held
    // apart from the set below rather than judged by the same rule.
    const identifierMismatch = diagnosticsOf(
      recordWith({ ...CONFORMING, requestId: "req-other" }),
    );
    expect(identifierMismatch).toBe(
      STOP_REASONS["request-identifier-mismatch"].reason,
    );

    // Every cause that shares the `result-invalid-studio` row.
    const emitted = [
      // wrong contract name
      diagnosticsOf(recordWith({ ...CONFORMING, contract: "other.v9" })),
      // well-named, well-identified, non-conforming body
      diagnosticsOf(recordWith({ ...CONFORMING, status: 42 })),
      // no result line at all
      diagnosticsOf({
        requestId: "req-studio-minted-one",
        completedResponse: true,
        protocolLines: [{ type: "materialized", status: 0 }],
        resultRefused: false,
        declared: { reads: [], versionMarker: undefined },
      }),
      // a result with no declared report behind it
      diagnosticsOf({
        requestId: "req-studio-minted-one",
        completedResponse: true,
        protocolLines: [
          { type: "materialized", status: 0 },
          { type: "result", ...CONFORMING },
        ],
        resultRefused: false,
        declared: undefined,
      }),
      // a run the Runtime refused outright
      diagnosticsOf({
        requestId: "req-studio-minted-one",
        completedResponse: false,
        protocolLines: [{ type: "refused", reason: "contract-mismatch" }],
        resultRefused: false,
        declared: undefined,
      }),
      // a result claiming an inspection state no inspector produced
      diagnosticsOf(recordWith({ ...CONFORMING, workspacePresent: true })),
      // **An unreadable declaration is deliberately not in this set.** It
      // used to refuse the result on the `result-invalid-repository` row;
      // it now reports `declaredVersionState: "unreadable"` and lets the
      // inspection reach its ordinary answer, so it emits no stop
      // diagnostic. Left here it would pass vacuously -- an entry that
      // checks nothing while reading as though it does. `declared-read.ts`
      // owns the three states, and asserts all three.
    ];

    expect(new Set([...emitted, identifierMismatch]).size).toBe(
      emitted.length + 1,
    );
    for (const diagnostic of emitted) {
      expect(diagnostic).not.toBe("");
      // Pairwise distinctness alone does not bind this: collapsing **one**
      // cause onto the row's generic wording leaves the set distinct, and
      // two such mutations survived until this assertion existed. Falling
      // back to the row is precisely the failure -- it is the row saying
      // "Studio could not read the inspection result" without saying why.
      expect(diagnostic).not.toBe(STOP_REASONS["result-invalid-studio"].reason);
    }

    // **Every row a refusal can take, not just the shared one.** A later
    // branch reaching for a different row and emitting its bare wording is
    // the same defect one row across, and scoping this to
    // `result-invalid-studio` would not see it -- which is exactly how the
    // repository-attributed refusal shipped its row's generic text.
    const rowWordings = new Set<string>(
      Object.values(STOP_REASONS).map((row) => row.reason),
    );
    for (const diagnostic of emitted) {
      expect(rowWordings.has(diagnostic)).toBe(false);
    }
  });

  it("does not call a terminated run an unreadable result", () => {
    // A run killed at a deadline after materializing never reaches its
    // result line. Reporting that absence as a result Studio could not read
    // attributes a Runtime-side stop to Studio, which is the crossing
    // AC-0093 forbids -- and it is the answer that shipped before the result
    // was validated at all.
    const outcome = settledRuntimeOutcome({
      requestId: "req-studio-minted-one",
      completedResponse: false,
      protocolLines: [{ type: "materialized", status: 0 }],
      resultRefused: false,
      declared: { reads: [], versionMarker: undefined },
    });

    expect(outcome).toMatchObject({
      ok: false,
      condition: "inspector-unavailable",
    });
    expect(outcome.ok === false && outcome.result).toBeUndefined();
    // The absent result is not rendered, so the condition alone would reach
    // the lead as the sentence a healthy run produces. What is emitted has
    // to say which happened.
    const healthy = settledRuntimeOutcome({
      requestId: "req-studio-minted-one",
      completedResponse: true,
      protocolLines: [
        { type: "materialized", status: 0 },
        { type: "result", ...CONFORMING },
      ],
      resultRefused: false,
      declared: { reads: [], versionMarker: undefined },
    });
    expect(healthy).toMatchObject({ condition: "inspector-unavailable" });
    expect(outcome.ok === false && outcome.diagnostics).not.toBe(
      healthy.ok === false && healthy.diagnostics,
    );
  });

  it("refuses a result claiming an inspection state no inspector produced", () => {
    // AC-0061 at the boundary. `normalizeTrialResult` would turn
    // `workspacePresent: true` with `status: "completed"` into `agent-ready`,
    // and no trusted inspector runs in this slice, so nothing supports it.
    for (const claim of [
      { workspacePresent: true },
      { workspacePresent: false },
      { status: "completed" },
    ]) {
      const outcome = settledRuntimeOutcome(
        recordWith({ ...CONFORMING, ...claim }),
      );
      expect(outcome).toMatchObject({
        condition: "inspection-stopped",
        stopReason: "result-invalid-studio",
      });
      expect(outcome.ok === false && outcome.result).toBeUndefined();
    }
  });

  it("refuses a run that completed and emitted no result line", () => {
    const outcome = settledRuntimeOutcome({
      requestId: "req-studio-minted-one",
      completedResponse: true,
      protocolLines: [{ type: "materialized", status: 0 }],
      resultRefused: false,
      declared: { reads: [], versionMarker: undefined },
    });

    expect(outcome).toMatchObject({
      condition: "inspection-stopped",
      stopReason: "result-invalid-studio",
    });
  });

  it("takes Studio's own marker over one the result tried to supply", () => {
    // The result line crosses the process boundary, so a value on it is not
    // Studio's to trust: the marker is the one the Service parsed from the
    // declared read, whatever the line says.
    expect(
      resultOf({
        requestId: "req-studio-minted-one",
        completedResponse: true,
        protocolLines: [
          { type: "materialized", status: 0 },
          { type: "result", ...CONFORMING, declaredVersionMarker: "99.9.9" },
        ],
        resultRefused: false,
        declared: { reads: [], versionMarker: DECLARED_MARKER },
      })?.declaredVersionMarker.value,
    ).toBe(DECLARED_MARKER);
  });

  it("refuses to compose a marker from a declared read that never happened", () => {
    // `declaredVersionMarker: null` means the repository declares none.
    // Composing one from a read that never happened would assert that, and
    // AC-0064 turns on exactly that distinction.
    const outcome = settledRuntimeOutcome({
      requestId: "req-studio-minted-one",
      completedResponse: true,
      protocolLines: [
        { type: "materialized", status: 0 },
        { type: "result", ...CONFORMING },
      ],
      resultRefused: false,
      declared: undefined,
    });

    expect(outcome).toMatchObject({
      condition: "inspection-stopped",
      stopReason: "result-invalid-studio",
    });
  });
});

describe("AC-0038 and AC-0039 the five reported elements, each with its provenance", () => {
  it("reports all five from what a real child wrote", async () => {
    const record = await withMarker();
    const result = resultOf(liveRecord(record));
    expect(result).toBeDefined();
    if (result === undefined) return;
    // 1 the resolved SHA, 2 an inspection status, 3 the inspector's
    // diagnostics, 4 the declared marker or its absence, 5 a removal outcome.
    // The SHA is the one the plan carried, not a default: replacing the
    // child's `plan.revision?.resolvedSha ?? ""` with `""` reddens this.
    expect(result.resolvedSha.value).toBe(PLANNED_SHA);
    expect(result.status).toBe("inspector-not-run");
    expect(result.inspectorDiagnostics.value).toBe("");
    expect(result.declaredVersionMarker.value).toBe(DECLARED_MARKER);
    expect(result.removalOutcome).toBe("removed");
    // AC-0065: declaring a marker carries the qualifier whatever the verdict.
    expect(result.versionUnverified).toBe(true);
  });

  it("reports no SHA when the Service planned no revision", async () => {
    // The other side of the same field: absent means absent, and the child
    // does not invent one. Without this the case above could pass by pinning
    // any constant the child happened to emit.
    const record = await plainRun();
    expect(resultOf(liveRecord(record))?.resolvedSha.value).toBe("");
  });

  it("reports the removal outcome the child actually reached", async () => {
    const record = await run("result-retained-root", {
      retainStateRoot: true,
    });
    // The root was retained, and the result says so rather than reporting the
    // removal the success path normally performs.
    expect(lineOfType(record, "disposed")).toMatchObject({ retained: true });
    expect(resultOf(liveRecord(record))?.removalOutcome).toBe("retained");
  });

  it("distinguishes a repository that declares none from one never read", async () => {
    const record = await plainRun();
    // The read happened and found no marker, which is `null` rather than a
    // refusal — and the declared report exists, which is what makes the null
    // honest.
    const result = resultOf(liveRecord(record));
    expect(record.declared).toBeDefined();
    expect(result?.declaredVersionMarker.value).toBeNull();
    expect(result?.versionUnverified).toBe(false);
  });

  it("marks every repository-derived value in the result", () => {
    const outcome = normalizeTrialResult(
      {
        ...CONFORMING,
        declaredVersionMarker: DECLARED_MARKER,
      } as RawTrialResult,
      "req-studio-minted-one",
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.inspectorDiagnostics.provenance).toBe(
      "repository-derived",
    );
    expect(outcome.result.declaredVersionMarker.provenance).toBe(
      "repository-derived",
    );
    expect(outcome.result.resolvedSha.provenance).toBe("transport-reported");
    expect(outcome.result.inspectorContractVersion.provenance).toBe(
      "inspector-authored",
    );
  });

  it("persists each value under the marker the normalizer gave it", () => {
    // The persisted map is written per field name at the storage boundary.
    // Pinning it to the markers the result carries is what keeps the two from
    // drifting, which is AC-0040's travelling-marker rule.
    const outcome = normalizeTrialResult(
      {
        ...CONFORMING,
        declaredVersionMarker: DECLARED_MARKER,
      } as RawTrialResult,
      "req-studio-minted-one",
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(PERSISTED_PROVENANCE).toEqual({
      diagnostics: outcome.result.inspectorDiagnostics.provenance,
      declaredVersionMarker: outcome.result.declaredVersionMarker.provenance,
      resolvedSha: outcome.result.resolvedSha.provenance,
      inspectorContractVersion:
        outcome.result.inspectorContractVersion.provenance,
    });
  });
});

describe("AC-0038 the removal outcome is a value, not any string", () => {
  it("refuses a result whose removal outcome is outside the set", () => {
    const outcome = settledRuntimeOutcome(
      recordWith({ ...CONFORMING, removalOutcome: "probably" }),
    );

    expect(outcome).toMatchObject({
      condition: "inspection-stopped",
      stopReason: "result-invalid-studio",
    });
  });

  it("holds child-side literals that have not drifted from the set", () => {
    // The child cannot import `REMOVAL_OUTCOMES`, so it holds the three
    // literals itself. Without this pin a drift there would be refused as a
    // non-conforming result at run time rather than caught here.
    const child = readFileSync(
      new URL("./runtime-child.ts", import.meta.url),
      "utf8",
    );
    const assigned = [
      ...child.matchAll(
        /^\s*disposed = (?:removed \? )?"([a-z-]+)"(?: : "([a-z-]+)")?;$/gm,
      ),
    ]
      .flatMap((match) => [match[1], match[2]])
      .filter((value): value is string => value !== undefined);

    expect(assigned.length).toBeGreaterThan(0);
    expect(new Set(assigned)).toEqual(new Set(REMOVAL_OUTCOMES));
  });
});

describe("AC-0064 declaredVersionState is carried through a validation refusal", () => {
  it("reports absent rather than unreadable when the declaration was cleanly read with no marker", () => {
    // The declaration was read and found no marker: `versionMarker: undefined`
    // means `absent`. When `normalizeTrialResult` then refuses the result (here
    // because the request ID does not match), the already-derived `absent` must
    // survive into the outcome rather than falling back to the not-determined
    // value `unreadable`, which would assert the read never happened.
    const outcome = settledRuntimeOutcome({
      requestId: "req-studio-minted-one",
      completedResponse: true,
      protocolLines: [
        { type: "materialized", status: 0 },
        // A different request ID makes `normalizeTrialResult` refuse with
        // `request-identifier-mismatch`, after `declaredVersionState` has
        // already been derived from the clean declared read below.
        { type: "result", ...CONFORMING, requestId: "req-different-id" },
      ],
      resultRefused: false,
      declared: { reads: [], versionMarker: undefined },
    });

    expect(outcome).toMatchObject({ condition: "inspection-stopped" });
    // `absent` not `unreadable`: the declaration was read and names nothing.
    expect(outcome.ok === false && outcome.declaredVersionState).toBe("absent");
  });

  it("carries the derived state through the result-invalid-studio refusal too", () => {
    // The other refusal site. Round 13 found this one unpinned: deleting
    // `declaredVersionState` from it left the whole service and storage tree
    // green, and the contract-mismatch and non-conforming-result paths this
    // covers are the ones a real repository reaches, unlike an identifier
    // mismatch between Studio and its own child.
    const outcome = settledRuntimeOutcome({
      requestId: "req-studio-minted-one",
      completedResponse: true,
      protocolLines: [
        { type: "materialized", status: 0 },
        // A result that names another contract is refused as
        // `result-invalid-studio`, after the clean declared read below has
        // already produced `declared`.
        {
          type: "result",
          ...CONFORMING,
          contract: "some-other-contract.v9",
        },
      ],
      resultRefused: false,
      declared: { reads: [], versionMarker: "0.4" },
    });

    expect(outcome).toMatchObject({ condition: "inspection-stopped" });
    expect(outcome.ok === false && outcome.stopReason).toBe(
      "result-invalid-studio",
    );
    // The declaration was read and named a marker, so the state is
    // `declared` — not the not-determined fallback.
    expect(outcome.ok === false && outcome.declaredVersionState).toBe(
      "declared",
    );
  });
});

describe("AC-0061 no verdict is derived from Studio's own reading of the tree", () => {
  it("still answers inspector-unavailable after a complete, valid result", async () => {
    const record = await withMarker();
    const outcome = settledRuntimeOutcome(liveRecord(record));

    expect(outcome).toMatchObject({
      ok: false,
      condition: "inspector-unavailable",
    });
    // The result exists and reports no workspace state, so the verdict it
    // carries is `no-verdict` rather than one read off the tree.
    expect(outcome.ok === false && outcome.result?.verdict).toBe("no-verdict");
  });

  it("reports no workspace state at all, rather than reporting it absent", async () => {
    const record = await plainRun();
    const line = lineOfType(record, "result");

    expect(line).toBeDefined();
    // `workspacePresent: false` would assert `not-agent-ready` from Studio's
    // own reading. Absent is the only honest value while no inspector runs.
    expect(line).not.toHaveProperty("workspacePresent");
    expect(line).toMatchObject({ findings: [] });
  });
});
