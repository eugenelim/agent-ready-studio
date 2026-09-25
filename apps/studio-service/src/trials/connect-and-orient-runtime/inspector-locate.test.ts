/**
 * Locating the trusted inspector, and saying why one was not used.
 *
 * `inspector-locator.test.ts` proves the locator's units. This suite proves
 * the wiring: that the Service consults the interpreter probes a real child
 * reported, that it resolves the pinned inspector against a real tree, and
 * that each way of failing reaches the lead as `inspector-unavailable` naming
 * *which* thing was wrong rather than one sentence for every cause.
 *
 * **Nothing here runs an inspector.** Locating is not running, and running is
 * `connect-orient-no-inspector-runs` — a separate slice, outside the trial
 * Runtime's authorization. So every outcome below is `inspector-unavailable`
 * including the one where a conforming inspector *was* found: the honest
 * report is that Studio has it and did not use it, which is a different
 * sentence from not having it.
 */
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, describe, expect, it } from "vitest";

import {
  type SettledRuntimeRecord,
  settledRuntimeOutcome,
  studioInstallRoot,
} from "../../source-inspection.js";
import { MINIMUM_INTERPRETER_VERSION } from "./executable-identity.js";
import {
  INSPECTOR_SCRIPTS_RELATIVE_PATH,
  PACK_STATE_RELATIVE_PATH,
} from "./inspector-locator.js";

const MINTED = "req-studio-minted-one";

const CONFORMING_RESULT = {
  type: "result",
  contract: "connect-orient-trial.v0",
  requestId: MINTED,
  status: "inspector-not-run",
  resolvedSha: "a".repeat(40),
  inspectorDiagnostics: "",
  inspectorContractVersion: null,
  removalOutcome: "removed",
  findings: [],
};

/** A settled record whose child reported the given interpreter probes. */
const DELIVERED = ["/usr/bin/python3", "/opt/homebrew/bin/python3"];

function recordWith(
  probes: readonly Record<string, unknown>[],
  extra: readonly Record<string, unknown>[] = [],
): SettledRuntimeRecord {
  return {
    requestId: MINTED,
    interpreterSearchList: DELIVERED,
    completedResponse: true,
    protocolLines: [
      { type: "materialized", status: 0 },
      { type: "interpreter", probes },
      ...extra,
      CONFORMING_RESULT,
    ],
    resultRefused: false,
    declared: { reads: [], versionMarker: undefined },
  };
}

describe("AC-0046 and AC-0048 the interpreter is decided from what the child probed", () => {
  it("names the requirement when no probe conforms", () => {
    const outcome = settledRuntimeOutcome(
      recordWith([
        {
          path: "/usr/bin/python3",
          version: "Python 3.9.6",
          conforming: false,
        },
      ]),
    );

    expect(outcome).toMatchObject({
      ok: false,
      condition: "inspector-unavailable",
    });
    // AC-0048 asks for the requirement, and a list of versions is not one.
    const diagnostics = outcome.ok === false ? outcome.diagnostics : "";
    expect(diagnostics).toContain(
      `${MINIMUM_INTERPRETER_VERSION[0]}.${MINIMUM_INTERPRETER_VERSION[1]}`,
    );
    expect(diagnostics).toContain("3.9.6");
  });

  it("names the requirement when the list was walked and nothing conformed", () => {
    // The child pushes an entry for **every** candidate, absent ones
    // included, so a search list that genuinely found nothing still reports
    // one probe per path. An empty array is a different scenario — the case
    // below it — and titling this one that way while passing `[]` asserted
    // the message against the wrong input.
    const outcome = settledRuntimeOutcome(
      recordWith([
        { path: "/usr/bin/python3", conforming: false },
        { path: "/opt/homebrew/bin/python3", conforming: false },
      ]),
    );

    const diagnostics = outcome.ok === false ? outcome.diagnostics : "";
    expect(diagnostics).toContain(
      `${MINIMUM_INTERPRETER_VERSION[0]}.${MINIMUM_INTERPRETER_VERSION[1]}`,
    );
    expect(diagnostics).toContain("absent");
    expect(outcome).toMatchObject({ condition: "inspector-unavailable" });
  });

  it("decides from the reported version, not from the probe's own flag", () => {
    // AC-0046 says **Studio** verifies the interpreter reports 3.11 or later.
    // A `conforming` boolean the child computed is the child's verification,
    // and consuming it would make the Service agree with whatever it is
    // handed. Both directions are asserted, so neither reading passes.
    const trustedFlagWouldAccept = settledRuntimeOutcome(
      recordWith([
        { path: "/usr/bin/python3", version: "Python 3.9.6", conforming: true },
      ]),
    );
    const trustedFlagWouldRefuse = settledRuntimeOutcome(
      recordWith([
        {
          path: "/opt/homebrew/bin/python3",
          version: "Python 3.14.7",
          conforming: false,
        },
      ]),
    );

    expect(
      trustedFlagWouldAccept.ok === false && trustedFlagWouldAccept.diagnostics,
    ).toContain("is required");
    expect(
      trustedFlagWouldRefuse.ok === false && trustedFlagWouldRefuse.diagnostics,
    ).not.toContain("is required");
  });

  it("refuses a probe whose version cannot be read at all", () => {
    // An unreadable version is a version Studio has not verified.
    const outcome = settledRuntimeOutcome(
      recordWith([
        {
          path: "/usr/bin/python3",
          version: "not a version",
          conforming: true,
        },
      ]),
    );

    expect(outcome.ok === false && outcome.diagnostics).toContain(
      "is required",
    );
  });

  it("does not report an interpreter fault when one conforms", () => {
    const outcome = settledRuntimeOutcome(
      recordWith([
        {
          path: "/opt/homebrew/bin/python3",
          version: "Python 3.14.7",
          conforming: true,
        },
      ]),
    );

    const diagnostics = outcome.ok === false ? outcome.diagnostics : "";
    expect(outcome).toMatchObject({ condition: "inspector-unavailable" });
    expect(diagnostics).not.toContain("is required");
  });

  it("says the Runtime reported no probes, not that the list found nothing", () => {
    // The child always writes the line. Its absence is a Runtime that did not
    // get that far, and it is a different fact from a walked list that turned
    // nothing up — collapsing the two made the refusal assert the one thing
    // that cannot be true when it fires.
    const outcome = settledRuntimeOutcome({
      requestId: MINTED,
      interpreterSearchList: DELIVERED,
      completedResponse: true,
      protocolLines: [{ type: "materialized", status: 0 }, CONFORMING_RESULT],
      resultRefused: false,
      declared: { reads: [], versionMarker: undefined },
    });

    const diagnostics = outcome.ok === false ? outcome.diagnostics : "";
    expect(diagnostics).toContain("did not report which interpreters");
    expect(diagnostics).not.toContain("search list");
  });

  it("names a failure to locate Studio's own install root", () => {
    // Every sibling branch names its cause; this one reported the benign
    // sentence, byte-identical to a healthy machine that simply has no
    // inspector installed.
    const outcome = settledRuntimeOutcome({
      ...recordWith([
        {
          path: "/opt/homebrew/bin/python3",
          version: "Python 3.14.7",
          conforming: true,
        },
      ]),
      inspectorSearchRoot: undefined,
    });

    expect(outcome.ok === false && outcome.diagnostics).toContain(
      "own install root",
    );
  });
});

describe("the walk that joins this unit to production", () => {
  it("resolves a root that holds the pack state", () => {
    // The positive direction, which nothing asserted: every other case
    // supplies `inspectorSearchRoot` explicitly, and the only production
    // caller needs a fetch no gate can reach. So `return undefined` here left
    // the whole service suite green while making Step D inert.
    const resolved = studioInstallRoot();

    expect(resolved).toBeDefined();
    expect(existsSync(join(resolved as string, PACK_STATE_RELATIVE_PATH))).toBe(
      true,
    );
    // And it is a real ancestor of **the module that does the walking** —
    // not of this test, which sits at a different depth and would make the
    // assertion pass for a reason the claim does not name. That difference is
    // the packaged-layout question at
    // `connect-orient-inspector-install-root-unproven`.
    const walker = fileURLToPath(
      new URL("../../source-inspection.ts", import.meta.url),
    );
    expect(walker.startsWith(`${resolved}/`)).toBe(true);
  });

  it("reaches the pack state from the built artifact, not only from source", () => {
    // `connect-orient-inspector-install-root-unproven` asked whether a
    // shipped layout puts the pack state within the walk's reach. **This
    // repository has no packaging step** — no electron-builder or forge
    // configuration exists, and `pnpm build` emits `apps/desktop/out/` and
    // `apps/studio-service/dist/` inside the tree. So the built layout is the
    // only shipped layout there is, and this is the claim about it.
    //
    // The desktop main process loads the service from
    // `apps/studio-service/dist/service.js` (`apps/desktop/src/main/index.ts`).
    // The source module sits three directories deeper than that, so a walk
    // sized for the source tree could overshoot in one and undershoot in the
    // other — which is why the depth is asserted, not assumed.
    const repositoryRoot = fileURLToPath(
      new URL("../../../../../", import.meta.url),
    );
    const built = join(repositoryRoot, "apps/studio-service/dist");
    expect(existsSync(join(repositoryRoot, PACK_STATE_RELATIVE_PATH))).toBe(
      true,
    );
    expect(relative(repositoryRoot, built).split("/").length).toBeLessThan(8);
    // And the walk actually run from the built directory finds it, rather
    // than the arithmetic above standing in for the walk.
    let directory = built;
    let found: string | undefined;
    for (let depth = 0; depth < 8 && found === undefined; depth += 1) {
      if (existsSync(join(directory, PACK_STATE_RELATIVE_PATH))) {
        found = directory;
      }
      directory = dirname(directory);
    }
    expect(found).toBe(repositoryRoot.replace(/\/$/, ""));
  });

  it("records the identity of the inspector it located but did not run", () => {
    // AC-0043. The four values used to exist only inside a diagnostic
    // sentence, so nothing downstream could read them and a restart could not
    // recover them. `inspector: null` on every outcome left the whole suite
    // green, because only the sentence was asserted.
    const outcome = settledRuntimeOutcome({
      ...recordWith([
        {
          path: "/opt/homebrew/bin/python3",
          version: "Python 3.14.7",
          conforming: true,
        },
      ]),
      inspectorSearchRoot: studioInstallRoot() as string,
    });

    expect(outcome.ok).toBe(false);
    const inspector = outcome.ok === false ? outcome.inspector : undefined;
    expect(inspector).toBeDefined();
    expect(inspector?.packName).toBe("core");
    expect(inspector?.resolvedPath).toContain("scripts");
    // Every pinned file, hashed. A locator that returned the pack identity
    // and an empty digest map satisfies the three assertions above.
    expect(Object.keys(inspector?.fileDigests ?? {}).length).toBeGreaterThan(0);
    for (const digest of Object.values(inspector?.fileDigests ?? {})) {
      expect(digest).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("records no identity where it located nothing", () => {
    // The other side. Without it, an `inspector` built unconditionally from
    // the pin -- rather than from the walk -- passes the case above.
    const outcome = settledRuntimeOutcome(
      recordWith([
        { path: "/usr/bin/python3", version: "Python 3.9.6", conforming: true },
      ]),
    );

    expect(outcome.ok === false && outcome.inspector).toBeNull();
  });
});

describe("the probe list is read, not cast", () => {
  // It is the one value on this path that crosses the process boundary, and
  // `Array.isArray` establishes only that it is an array.

  it("refuses rather than throws when a version is not a string", () => {
    // `exec` applies ToString, and a guarded-parse object has a null
    // prototype, so casting made this throw `TypeError: Cannot convert object
    // to primitive value` — surfacing as "the inspection stopped: TypeError".
    const hostile = Object.assign(Object.create(null), { nested: 1 });
    const outcome = settledRuntimeOutcome(
      recordWith([
        { path: "/usr/bin/python3", version: hostile, conforming: true },
      ]),
    );

    expect(outcome).toMatchObject({ condition: "inspector-unavailable" });
    expect(outcome.ok === false && outcome.diagnostics).toContain(
      "is required",
    );
    expect(outcome.ok === false && outcome.diagnostics).not.toContain(
      "TypeError",
    );
  });

  it("drops a probe naming an interpreter Studio never delivered", () => {
    // Nothing runs it in this slice; the slice that does would otherwise
    // inherit an executable path the child chose rather than one Studio
    // offered.
    const outcome = settledRuntimeOutcome(
      recordWith([
        {
          path: "/tmp/evil/python3",
          version: "Python 3.14.7",
          conforming: true,
        },
      ]),
    );

    expect(outcome.ok === false && outcome.diagnostics).toContain(
      "is required",
    );
    expect(outcome.ok === false && outcome.diagnostics).not.toContain("evil");
  });

  it("bounds what a probe can put into a persisted, rendered field", () => {
    const outcome = settledRuntimeOutcome(
      recordWith([
        {
          path: "/usr/bin/python3",
          version: `Python 3.9.${"9".repeat(4096)}`,
          conforming: false,
        },
      ]),
    );

    const diagnostics = outcome.ok === false ? outcome.diagnostics : "";
    // The diagnostic is stored under the repository-derived marker and
    // counted against AC-0104's 256 KiB bound, so an unbounded probe list
    // could make a record unpersistable.
    expect(diagnostics.length).toBeLessThan(512);
  });

  it("admits one probe per delivered path, however many the child sends", () => {
    // Membership bounds what a path may be, not how many times it may
    // appear. The refusal names every admitted probe, so a repeated delivered
    // path is the cheapest way to fill a field that is persisted under the
    // repository-derived marker and counted against AC-0104's 256 KiB.
    const flood = Array.from({ length: 5_000 }, () => ({
      path: "/usr/bin/python3",
      version: `Python 3.9.${"9".repeat(60)}`,
      conforming: false,
    }));
    const outcome = settledRuntimeOutcome(recordWith(flood));

    const diagnostics = outcome.ok === false ? outcome.diagnostics : "";
    // At most one entry per delivered path, so the size follows from the list
    // Studio delivered rather than from what the child chose to send.
    expect(diagnostics.length).toBeLessThan(512);
    expect(diagnostics.split("/usr/bin/python3").length - 1).toBe(1);
  });

  it("says Studio delivered no list, rather than that a walk found nothing", () => {
    const outcome = settledRuntimeOutcome({
      ...recordWith([
        {
          path: "/usr/bin/python3",
          version: "Python 3.9.6",
          conforming: false,
        },
      ]),
      interpreterSearchList: undefined,
    });

    const diagnostics = outcome.ok === false ? outcome.diagnostics : "";
    expect(diagnostics).toContain("delivered no interpreter search list");
    expect(diagnostics).not.toContain("found on the search list");
  });

  it("drops an entry that is not an object at all", () => {
    const outcome = settledRuntimeOutcome(
      recordWith([
        null as unknown as Record<string, unknown>,
        "a string" as unknown as Record<string, unknown>,
      ]),
    );

    expect(outcome.ok === false && outcome.diagnostics).toContain(
      "is required",
    );
  });
});

describe("AC-0043, AC-0044 and AC-0045 the pinned inspector is located, and never run", () => {
  const roots: string[] = [];
  const makeRoot = (): string => {
    const root = mkdtempSync(join(tmpdir(), "connect-orient-inspector-"));
    roots.push(root);
    return root;
  };

  const conformingProbe = [
    {
      path: "/opt/homebrew/bin/python3",
      version: "Python 3.14.7",
      conforming: true,
    },
  ];

  it("names a pack mismatch rather than using the inspector", () => {
    const searchRoot = makeRoot();
    mkdirSync(join(searchRoot, INSPECTOR_SCRIPTS_RELATIVE_PATH), {
      recursive: true,
    });
    writeFileSync(join(searchRoot, ".agentbundle-state.toml"), "");

    const outcome = settledRuntimeOutcome({
      ...recordWith(conformingProbe),
      inspectorSearchRoot: searchRoot,
    });

    expect(outcome).toMatchObject({ condition: "inspector-unavailable" });
    const diagnostics = outcome.ok === false ? outcome.diagnostics : "";
    // AC-0044: the mismatch is named, not folded into one generic sentence.
    expect(diagnostics).not.toBe(
      "the revision was materialized, and no trusted inspector ran against it",
    );
  });

  it("reports an absent inspector as absent, naming no fallback", () => {
    const outcome = settledRuntimeOutcome({
      ...recordWith(conformingProbe),
      inspectorSearchRoot: makeRoot(),
    });

    const diagnostics = outcome.ok === false ? outcome.diagnostics : "";
    expect(outcome).toMatchObject({ condition: "inspector-unavailable" });
    // AC-0047's second clause, which this must not weaken.
    expect(diagnostics).toContain("fallback");
  });

  it("refuses an inspector resolving inside the materialization root", () => {
    // AC-0045. The search root *is* the materialization root here, which is
    // the shape a repository would have to produce to be inspected by its own
    // copy of the inspector.
    const searchRoot = makeRoot();
    mkdirSync(join(searchRoot, INSPECTOR_SCRIPTS_RELATIVE_PATH), {
      recursive: true,
    });

    const outcome = settledRuntimeOutcome({
      ...recordWith(conformingProbe),
      inspectorSearchRoot: searchRoot,
      materializationRoot: searchRoot,
    });

    const diagnostics = outcome.ok === false ? outcome.diagnostics : "";
    expect(outcome).toMatchObject({ condition: "inspector-unavailable" });
    expect(diagnostics).toContain("materialization root");
  });

  afterAll(() => {
    for (const root of roots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
