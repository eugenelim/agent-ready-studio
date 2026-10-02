/**
 * The twelve absence proofs whose observed surface exists by T6: AC-0133 to
 * AC-0137 and AC-0139 to AC-0145.
 *
 * Each one reuses the corpus case T1 built and the probe T1's control
 * validated, and observes the guarded path through the same channel that
 * control observes the unguarded one. That symmetry is the whole point: an
 * absence read from a channel no control ever fired on proves nothing, and it
 * is what AC-0147 will range over once the last of these criteria lands.
 *
 * AC-0138 and AC-0146 are deliberately absent. AC-0138 observes a verdict, a
 * routing decision and a state, none of which exist until T9 and T10; AC-0146
 * observes storage, which does not exist until T11. Both are gated there and
 * reuse this harness, so probe identity stays pinned across all three.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import module from "node:module";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { canonicalizeSource } from "../../source-identity.js";
import {
  PINNED_GIT_CONFIGURATION,
  pinnedGitConfigurationArgs,
} from "./git-driver.js";
import { parseGuardedJson, parseGuardedToml } from "./inadmissible-keys.js";
import {
  ConfinementError,
  readContainedFile,
} from "./materialization-confinement.js";
import {
  buildPinnedEnvironment,
  ENVIRONMENT_ALLOWLIST_NAMES,
} from "./runtime-environment.js";
import {
  startTrialInspection,
  type TrialInspectionOptions,
  type TrialInspectionRecord,
} from "./runtime-supervisor.js";
import { foldsToDotGit, mountHfsVolume } from "./test/hfs-volume.js";
import {
  ATTRIBUTE_FILTER_COMMITTED_CONTENT,
  ATTRIBUTE_FILTER_SMUDGED_CONTENT,
  buildHostileFixture,
  DOT_GIT_UNICODE_ENTRY,
  disposeHostileFixtures,
  type HostileCase,
  materialize,
  observeProcessTree,
  PROBE_LOG_MARKER,
  runPositiveControl,
  runProhibitedSubmoduleUpdate,
  SUBMODULE_CHILD_CONTENT,
  SUBMODULE_CHILD_FILE,
  SUBMODULE_GITLINK_PATH,
  sourceObjectHasDotGitVariant,
} from "./test/hostile-fixture.js";

// Every case builds a real git repository and spawns git, which exceeds
// vitest's 5s default whenever this machine is busy. Same allowance, same
// reason, as the corpus suite: each test still fails on its own assertion.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

afterEach(() => {
  disposeHostileFixtures();
  for (const root of temporaryRoots) {
    rmSync(root, { recursive: true, force: true });
  }
  temporaryRoots.clear();
});

const temporaryRoots = new Set<string>();

type SpawnClassification =
  | "fixed-product-infrastructure"
  | "parent-observation"
  | "repository-influenced";

interface SpawnSite {
  readonly file: string;
  readonly callee: string;
  readonly code: string;
}

const SPAWN_SITE_CLASSIFICATIONS = new Map<string, SpawnClassification>([
  [
    "executable-identity.ts|spawnSync|const result = spawnSync(executable, [...args], {",
    "fixed-product-infrastructure",
  ],
  [
    "per-request-state-root.ts|execFileSync|const stdout = execFileSync(",
    "fixed-product-infrastructure",
  ],
  [
    "process-tree-observer.ts|spawnSync|const result = spawnSync(PS, psArgs(pgid, withEnvironment), {",
    "parent-observation",
  ],
  [
    "process-tree-observer.ts|spawn|const reader = spawn(PS, psArgs(pgid, withEnvironment), {",
    "parent-observation",
  ],
  [
    'process-tree-observer.ts|spawnSync|spawnSync(PS, ["-o", "pid", "-g", String(pgid)], { encoding: "utf8" })',
    "parent-observation",
  ],
  [
    "runtime-child.ts|spawnSync|const read = spawnSync(PS_EXECUTABLE, args, {",
    "fixed-product-infrastructure",
  ],
  [
    "runtime-child.ts|spawnSync|const result = spawnSync(executable, [...args], {",
    "repository-influenced",
  ],
  [
    "runtime-child.ts|spawn|const child = spawn(executable, [...args], {",
    "repository-influenced",
  ],
  [
    "runtime-child.ts|spawn|const held = spawn(interpreter, args, {",
    "fixed-product-infrastructure",
  ],
  [
    "runtime-child.ts|spawn|const writer = spawn(interpreter, args, {",
    "fixed-product-infrastructure",
  ],
  [
    "runtime-child.ts|spawn|const subprocess = spawn(interpreter, args, {",
    "fixed-product-infrastructure",
  ],
  [
    "runtime-supervisor.ts|spawn|const child = spawn(process.execPath, childArgs, {",
    "fixed-product-infrastructure",
  ],
]);

function spawnSiteKey(site: SpawnSite): string {
  return `${site.file}|${site.callee}|${site.code}`;
}

const runtimeSourceRoot = dirname(fileURLToPath(import.meta.url));

function productionRuntimeFiles(directory = runtimeSourceRoot): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    const relativePath = relative(runtimeSourceRoot, absolute)
      .split(sep)
      .join("/");
    if (entry.isDirectory()) {
      if (relativePath === "test" || relativePath.startsWith("test/")) {
        continue;
      }
      files.push(...productionRuntimeFiles(absolute));
      continue;
    }
    if (
      entry.isFile() &&
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts")
    ) {
      files.push(relativePath);
    }
  }
  return files.sort();
}

/**
 * The builtin a module starts processes through, named with or without its
 * `node:` prefix. Both spellings load the same builtin, so the gate matches
 * the module name and treats the prefix as optional: keying on the `node:`
 * spelling alone let `import { spawn } from "child_process";` and a
 * `createRequire(...)("child_process")` read yield zero sites and a green
 * inventory.
 */
const CHILD_PROCESS_SPECIFIER = /(?<![\w$.])(?:node:)?child_process(?![\w$])/;

/**
 * The names a module starts processes through, or the sentinel that makes the
 * inventory fail.
 *
 * The gate is any mention of the builtin rather than a static `from` clause,
 * so every access shape is discovered: a dynamic `import()`, a `createRequire`
 * read, and an unprefixed import all reach the named-import match below, fail
 * it, and return the sentinel. The names group cannot cross a statement
 * boundary either, so an unrelated earlier `import {` can no longer be matched
 * and then stretched into a group running to the real import: that group used
 * to be accepted as a name list, yield a callee matching no line, and leave
 * the module with zero sites. The engine now skips the unrelated import and
 * reads the real one.
 *
 * What is guaranteed: a module mentioning the builtin yields either callees
 * read from one recognised static named import of `node:child_process`, or the
 * sentinel. It is not guaranteed that every callee site is then found -- line
 * matching below reads calls, not aliased re-exports or indirect references.
 */
function childProcessCallees(source: string): string[] {
  if (!CHILD_PROCESS_SPECIFIER.test(source)) {
    return [];
  }
  const imported =
    /import\s*{(?<names>[^;{}]*?)}\s*from\s*"node:child_process";/.exec(source)
      ?.groups?.names;
  if (imported === undefined) {
    return ["unsupported-child-process-import"];
  }
  return imported
    .split(",")
    .map(
      (name) =>
        name
          .trim()
          .split(/\s+as\s+/)
          .at(-1) ?? "",
    )
    .filter(Boolean);
}

function discoverChildProcessStarts(
  overrides: Partial<Record<string, string>> = {},
): SpawnSite[] {
  const sites: SpawnSite[] = [];
  for (const file of productionRuntimeFiles()) {
    const source =
      overrides[file] ??
      readFileSync(join(runtimeSourceRoot, file), {
        encoding: "utf8",
      });
    const callees = childProcessCallees(source);
    if (callees.length === 0) {
      continue;
    }
    if (callees.includes("unsupported-child-process-import")) {
      sites.push({
        file,
        callee: "unsupported-child-process-import",
        code: "unsupported node:child_process import",
      });
      continue;
    }
    for (const line of source.split("\n")) {
      const code = line.trim();
      for (const callee of callees) {
        if (new RegExp(`\\b${callee}\\s*\\(`).test(code)) {
          sites.push({ file, callee, code });
        }
      }
    }
  }
  return sites;
}

/**
 * AC-0001's record-contribution clause: every repository-influenced start must
 * contribute executable, argument vector, and process identity to the trial's
 * parent-visible record. These are the field names that carry those three in
 * `SpawnAuditEntry`.
 */
const RECORDED_SPAWN_FIELDS = ["executable", "args", "pid"] as const;

/**
 * The source of the function containing a discovered start. Top-level
 * declarations are the unit, which is the shape every Runtime module uses: a
 * start and the `recordSpawn` call that reports it are always siblings in one
 * function body.
 */
function enclosingFunctionSource(
  source: string,
  code: string,
): string | undefined {
  return source
    .split(/^(?=(?:export )?(?:async )?function )/m)
    .find((block) => block.includes(code));
}

/**
 * The field names a function puts into the parent-visible record, read from its
 * own `recordSpawn` argument. A spread-guarded field such as
 * `...(typeof result.pid === "number" ? { pid: result.pid } : {})` counts: it
 * is the field being contributed when the value exists.
 */
function recordedSpawnFields(functionSource: string): string[] {
  const fields = /recordSpawn\(\{(?<fields>[\s\S]*?)\}\);/.exec(functionSource)
    ?.groups?.fields;
  if (fields === undefined) {
    return [];
  }
  return [...fields.matchAll(/(?:^|[\s{])(?<name>[A-Za-z_]\w*)\s*[,:]/g)].map(
    (match) => match.groups?.name ?? "",
  );
}

describe("repository-controlled execution construction inventory", () => {
  it("classifies every production child_process start in the Runtime", () => {
    const sites = discoverChildProcessStarts();

    expect(sites.map(spawnSiteKey).sort()).toEqual(
      [...SPAWN_SITE_CLASSIFICATIONS.keys()].sort(),
    );
    expect(
      sites.map((site) => SPAWN_SITE_CLASSIFICATIONS.get(spawnSiteKey(site))),
    ).toContain("repository-influenced");
  });

  it("rejects an added unclassified production start", () => {
    const supervisor = readFileSync(
      new URL("runtime-supervisor.ts", import.meta.url),
      "utf8",
    );
    const sites = discoverChildProcessStarts({
      "runtime-supervisor.ts": `${supervisor}\nspawn("/tmp/proof", []);\n`,
    });
    const unclassified = sites.filter(
      (site) => !SPAWN_SITE_CLASSIFICATIONS.has(spawnSiteKey(site)),
    );

    expect(unclassified).toEqual([
      {
        file: "runtime-supervisor.ts",
        callee: "spawn",
        code: 'spawn("/tmp/proof", []);',
      },
    ]);
  });

  it("requires every repository-influenced start to report all three recorded fields", () => {
    // A classification on its own ties a start to nothing: a
    // repository-influenced start that reported nothing would satisfy the two
    // cases above. This one reads what each such start hands to `recordSpawn`,
    // so removing a field, or the call, fails here.
    const influenced = [...SPAWN_SITE_CLASSIFICATIONS]
      .filter(
        ([, classification]) => classification === "repository-influenced",
      )
      .map(([key]) => key.split("|"));

    expect(influenced.length).toBeGreaterThan(0);
    for (const [file, , code] of influenced) {
      const source = readFileSync(join(runtimeSourceRoot, file as string), {
        encoding: "utf8",
      });
      const enclosing = enclosingFunctionSource(source, code as string);

      expect(enclosing, `${file}: ${code}`).toBeDefined();
      expect(recordedSpawnFields(enclosing ?? ""), `${file}: ${code}`).toEqual(
        expect.arrayContaining([...RECORDED_SPAWN_FIELDS]),
      );
    }
  });

  it("carries all three recorded fields on every entry a settled trial reports", async () => {
    // The runtime half of the same clause, over the record the parent actually
    // receives: the static check above proves the call site names the fields,
    // and this proves they arrive. A start the parent cannot identify is not a
    // contribution to its record.
    const record = await productTrialFor("package-script");

    expect(record.spawnAudit.length).toBeGreaterThan(0);
    for (const entry of record.spawnAudit) {
      expect(Object.keys(entry), JSON.stringify(entry)).toEqual(
        expect.arrayContaining([...RECORDED_SPAWN_FIELDS]),
      );
      expect(isAbsolute(entry.executable)).toBe(true);
      expect(Array.isArray(entry.args)).toBe(true);
      expect(entry.pid).toBeTypeOf("number");
    }
  });
});

/** Every path under `root`, relative to it, without following a single link. */
function walk(root: string, prefix = ""): string[] {
  const found: string[] = [];
  for (const name of readdirSync(join(root, prefix))) {
    const relativePath = prefix === "" ? name : join(prefix, name);
    found.push(relativePath);
    if (lstatSync(join(root, relativePath)).isDirectory()) {
      found.push(...walk(root, relativePath));
    }
  }
  return found;
}

/**
 * Materializes a case under the guard and returns every marker the process
 * tree recorded. An executable-shaped case that ran would have appended its
 * marker here, exactly as its control does.
 */
async function markersDuringMaterialization(
  caseId: HostileCase,
): Promise<string[]> {
  const fixture = await buildHostileFixture({ caseId });
  const seen = await observeProcessTree(() => materialize(fixture));
  return seen.map(({ argv0 }) => argv0);
}

async function productTrialFor(
  caseId: HostileCase,
  supervision: TrialInspectionOptions = {},
): Promise<TrialInspectionRecord> {
  const fixture = await buildHostileFixture({ caseId });
  const sweepDomain = mkdtempSync(join(tmpdir(), "connect-orient-proof-"));
  temporaryRoots.add(sweepDomain);
  // Focused Vitest runs do not invoke the root pretest build. Pin this proof
  // to the source child so it cannot silently execute an older compiled
  // sibling while the supervisor and assertions use the current source tree.
  const childEntry = fileURLToPath(
    new URL("runtime-child.ts", import.meta.url),
  );
  const record = await startTrialInspection(
    {
      requestId: `proof-${caseId}`,
      identity: { owner: "owner", repository: "repository" },
      sweepDomain,
    },
    {
      revision: {
        fetchUrl: fixture.source,
        resolvedSha: fixture.resolvedSha,
      },
      childEntry,
      retainStateRoot: true,
      // A hostile fixture is a local repository, and *Permitted git transports*
      // admits `https` only, so without this the child answers `fatal:
      // transport 'file' not allowed` and never checks a tree out. Every
      // absence assertion below would then hold over an empty directory. This
      // widens only which transport may deliver the tree; the pinned
      // configuration that governs the delivered tree is untouched.
      additionalGitTransports: ["file"],
      ...supervision,
    },
  );
  if (!record.admitted) {
    throw new Error(`trial refused: ${record.code}`);
  }
  expectMaterialized(record);
  return record;
}

/**
 * An absence proof over a tree that was never written proves nothing, and that
 * is the failure this guard exists to make impossible: the transport pin
 * silently emptied all three product trials, and every assertion over them
 * still passed. The precondition is asserted here, once, so no case can report
 * green without a real materialization behind it.
 */
function expectMaterialized(record: TrialInspectionRecord): void {
  const materialized = record.protocolLines.find(
    (line) => line.type === "materialized",
  );

  expect(
    { materialized, diagnostics: record.diagnostics },
    "the product trial materialized no tree, so any absence below is vacuous",
  ).toMatchObject({ materialized: { status: 0 } });
  expect(
    existsSync(join(record.stateRoot.materializationRoot, ".git/HEAD")),
  ).toBe(true);
}

function pathIsInside(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(`${root}/`);
}

/**
 * Worktree paths the product legitimately names on its own git vectors,
 * excluded by name so the detector below can stay wide rather than being
 * narrowed to the shapes one mutation happened to write.
 *
 * Only the materialization root itself is legitimate, and for one reason:
 * `git init --quiet -- <root>` names the directory git is creating
 * (`runtime-child.ts`'s initialize phase), and every later product git phase
 * runs with that same directory as its working directory, so the root's own
 * path is Studio infrastructure rather than repository-supplied code. Anything
 * *under* the root is still reported, including on the same vector.
 */
function productOwnedWorktreePaths(root: string): ReadonlySet<string> {
  return new Set([root]);
}

interface OperandCandidate {
  readonly kind: "interpreter-operand" | "command-payload";
  /** The path this argument names, before resolution. */
  readonly path: string;
}

/** The text after the first `=`, or `undefined` when the text carries none. */
function configurationValue(text: string): string | undefined {
  const separator = text.indexOf("=");
  return separator === -1 ? undefined : text.slice(separator + 1);
}

/**
 * Whether the text before an `=`-bearing text's first `=` carries a path
 * separator. This is what tells a filename holding `=` apart from a
 * configuration pair: `.probe/a=b.mjs` has a separator before its `=` and is
 * one path, while `core.hooksPath=/dev/null` and `--depth=1` have none and are
 * a key and an option. Measured against the product's own vectors, all
 * thirteen entries of `PINNED_GIT_CONFIGURATION`, `--depth=1` and `-o lstart=`
 * fail this test, which is why reading such a text whole never reports a
 * product pin.
 */
function carriesSeparatorBeforeEquals(text: string): boolean {
  const separator = text.indexOf("=");
  return separator !== -1 && text.slice(0, separator).includes("/");
}

/**
 * What an argument can name a worktree path *as*, whatever executable receives
 * it. One argument can name a path in several ways at once, so every reading
 * is emitted and de-duplicated rather than being chosen between:
 *
 * - its configuration value, the text after the first `=`, which covers every
 *   key rather than `filter.` alone -- `core.hooksPath=<path>` and
 *   `filter.probe.smudge=<path>` are read the same way;
 * - the text itself when it is absolute, because a filename may itself contain
 *   `=` (`/<root>/.probe/a=b.mjs`), and slicing at that `=` would leave only a
 *   separator-free remainder the detector drops;
 * - the text itself when a path separator precedes its first `=`, which is the
 *   same filename shape arriving relative (`.probe/a=b.mjs`), where no
 *   absolute reading can rescue it;
 * - each whitespace-separated token, because one `-c` payload can carry a path
 *   beside an option (`/bin/sh -c "<root>/.probe/x --flag=1"`), and reading
 *   only the whole string would hide the path behind the option's `=`.
 *
 * The readings are stated per level rather than as an equality, so they stay
 * true if the two levels ever diverge again.
 *
 * The whole argument contributes its configuration value, and itself whenever
 * it is absolute or a path separator precedes its first `=`. A token
 * contributes itself when it carries no `=` at all; when it does carry one it
 * contributes its configuration value, plus itself under the same absolute-or-
 * separator-before-`=` condition the whole argument gets. An absolute token is
 * therefore read whole however many `=` characters its filename holds, and
 * `node <root>/.probe/a=b.mjs` no longer collapses to `b.mjs`.
 *
 * The separator condition is what keeps a configuration pair out:
 * `core.hooksPath=/dev/null` carries no separator before its `=`, so it never
 * becomes a relative path under the root, while `.probe/a=b.mjs` does and is
 * read as the one path it is. An empty configuration value names nothing.
 */
function operandCandidates(argument: string): OperandCandidate[] {
  const candidates: OperandCandidate[] = [];
  const add = (kind: OperandCandidate["kind"], path: string): void => {
    if (
      path !== "" &&
      !candidates.some(
        (existing) => existing.kind === kind && existing.path === path,
      )
    ) {
      candidates.push({ kind, path });
    }
  };
  /** Itself, when nothing about the text says it is a configuration pair. */
  const addOwnPath = (text: string): void => {
    if (isAbsolute(text) || carriesSeparatorBeforeEquals(text)) {
      add("interpreter-operand", text);
    }
  };

  const value = configurationValue(argument);
  if (value !== undefined) {
    add("command-payload", value);
  }
  addOwnPath(argument);
  for (const token of argument.split(/\s+/)) {
    const tokenValue = configurationValue(token);
    if (tokenValue === undefined) {
      add("interpreter-operand", token);
      continue;
    }
    add("command-payload", tokenValue);
    addOwnPath(token);
  }
  return candidates;
}

/**
 * Whether a candidate names a filesystem path at all, rather than a subcommand
 * word or a scalar configuration value. `git checkout` and `--depth=1` name no
 * path; `.probe/package-script.mjs` does.
 *
 * An absolute candidate always names one. A relative candidate needs a
 * separator, because that is exactly the condition under which an interpreter
 * or a shell resolves it against the working directory instead of searching
 * `PATH`. A configuration payload is additionally admitted when it names an
 * entry that exists inside the worktree, because a key such as
 * `core.hooksPath` resolves its value as a path whether or not it carries a
 * separator.
 *
 * The scheme exclusion is tested only after the absolute reading, and that
 * order is load-bearing. The exclusion exists so that a scheme-carrying
 * candidate is not resolved as a relative path, which would report the
 * product's own source operand. That reasoning says nothing about a candidate
 * that is already an absolute filesystem path resolving inside the root, so
 * running the exclusion first would suppress a real worktree path whose name
 * happened to contain `://`.
 *
 * No record read here actually carries a scheme-bearing candidate. These
 * trials fetch from `fixture.source`, which the fixture builds as an absolute
 * local path with no scheme, and it stays unreported because it sits outside
 * the materialization root rather than because of this exclusion. An earlier
 * version of this block said the fetch URL "is not absolute", which is false
 * of every record in scope; the exclusion is retained for a scheme-bearing
 * candidate reaching this function by some other route, and the ordering is
 * what keeps it from suppressing an absolute in-root path.
 */
function namesWorktreePath(
  candidate: OperandCandidate,
  resolved: string,
): boolean {
  if (isAbsolute(candidate.path)) {
    return true;
  }
  if (candidate.path.includes("://")) {
    return false;
  }
  return (
    candidate.path.includes("/") ||
    (candidate.kind === "command-payload" && existsSync(resolved))
  );
}

/**
 * Every process record in the settled trial whose executable identity,
 * interpreter operand, or command payload resolves inside the materialized
 * worktree. This is the sole assertion behind AC-0002, AC-0003 and AC-0004, so
 * it is deliberately shape-independent: any executable may hold the identity,
 * any executable may receive the operand, any configuration key may carry the
 * payload, and every candidate is resolved before containment is tested.
 *
 * A relative operand is resolved against the materialization root rather than
 * against a recorded working directory, because `SpawnAuditEntry` carries no
 * `cwd`: AC-0057 fixes the fields the child's record may contribute, and
 * widening it is a production change this proof does not need. The root is the
 * widest reading available here -- every descendant start in the Runtime that
 * touches the tree already runs with the root as its working directory, and a
 * directory below the root resolves a relative candidate to a path that is
 * still inside the root -- so for the containment test the substitution can
 * add a report, never suppress one.
 *
 * That property does not extend to `namesWorktreePath`'s existence admission.
 * A separator-free payload git resolved against a directory below the root
 * exists at that directory and not at the root, so `existsSync` reads false
 * and the candidate is dropped rather than reported. The admission is a
 * widening over absolute and separator-carrying candidates, not a guarantee.
 */
function repositoryExecutionOrigins(record: TrialInspectionRecord): string[] {
  const root = record.stateRoot.materializationRoot;
  const productOwned = productOwnedWorktreePaths(root);
  const origins: string[] = [];
  for (const entry of record.spawnAudit) {
    if (pathIsInside(root, resolve(root, entry.executable))) {
      origins.push(`executable:${entry.executable}`);
    }
    for (const argument of entry.args) {
      for (const candidate of operandCandidates(argument)) {
        const resolved = resolve(root, candidate.path);
        if (
          !pathIsInside(root, resolved) ||
          productOwned.has(resolved) ||
          !namesWorktreePath(candidate, resolved)
        ) {
          continue;
        }
        origins.push(
          candidate.kind === "command-payload"
            ? `command-payload:${argument}`
            : `interpreter-operand:${resolved}`,
        );
      }
    }
  }
  return origins;
}

/**
 * The detector's own coverage, over synthetic records rather than product
 * trials. No guard is removed and nothing is started here: a record assembled
 * by this test is evidence about what the detector reads, never evidence about
 * what the product would execute. The three product mutations below remain the
 * only execution controls.
 *
 * Each case is a start shape reachable through the Runtime's own descendant
 * helpers that the earlier `execPath`-and-`filter.`-only detector read as
 * clean.
 */
describe("the execution-origin detector over reachable start shapes", () => {
  function syntheticRecord(
    root: string,
    entries: readonly { executable: string; args: readonly string[] }[],
  ): TrialInspectionRecord {
    return {
      stateRoot: { materializationRoot: root },
      spawnAudit: entries.map((entry) => ({
        ...entry,
        environmentNames: [],
        shell: false as const,
      })),
    } as unknown as TrialInspectionRecord;
  }

  const root = "/private/tmp/state-root/tree";

  it("reports a worktree operand handed to an interpreter that is not execPath", () => {
    expect(
      repositoryExecutionOrigins(
        syntheticRecord(root, [
          { executable: "/bin/sh", args: ["-c", `${root}/x`] },
        ]),
      ),
    ).toEqual([`interpreter-operand:${root}/x`]);
  });

  it("reports a relative operand that resolves into the worktree", () => {
    expect(
      repositoryExecutionOrigins(
        syntheticRecord(root, [
          { executable: "/bin/sh", args: [".probe/package-script.mjs"] },
        ]),
      ),
    ).toEqual([`interpreter-operand:${root}/.probe/package-script.mjs`]);
  });

  it("reports a worktree payload on a configuration key other than filter.", () => {
    expect(
      repositoryExecutionOrigins(
        syntheticRecord(root, [
          {
            executable: "/usr/bin/git",
            args: ["-c", `core.hooksPath=${root}/.probe/hooks`, "checkout"],
          },
        ]),
      ),
    ).toEqual([`command-payload:core.hooksPath=${root}/.probe/hooks`]);
  });

  it("reports a relative configuration payload that names a materialized entry", () => {
    const materialized = mkdtempSync(join(tmpdir(), "connect-orient-origin-"));
    temporaryRoots.add(materialized);
    mkdirSync(join(materialized, "hooks"));

    expect(
      repositoryExecutionOrigins(
        syntheticRecord(materialized, [
          { executable: "/usr/bin/git", args: ["-c", "core.hooksPath=hooks"] },
        ]),
      ),
    ).toEqual(["command-payload:core.hooksPath=hooks"]);
  });

  it("reports an absolute worktree operand whose filename contains an equals sign", () => {
    // Hostile repository content names its own files. Reading only the text
    // after the first `=` would leave `b.mjs`, which is relative,
    // separator-free and absent from disk, so the path would be dropped.
    expect(
      repositoryExecutionOrigins(
        syntheticRecord(root, [
          {
            executable: "/usr/local/bin/node",
            args: [`${root}/.probe/a=b.mjs`],
          },
        ]),
      ),
    ).toEqual([`interpreter-operand:${root}/.probe/a=b.mjs`]);
  });

  it("reports a worktree path carried beside an option in one shell payload", () => {
    // One `-c` payload holding both a path and an option. Reading only the
    // text after the first `=` would leave `1`; the same payload without the
    // option is read whole, so the `=` must not hide the path. Both the whole
    // payload and its path token are reported, because either reading can be
    // the real filename and the detector suppresses neither.
    expect(
      repositoryExecutionOrigins(
        syntheticRecord(root, [
          { executable: "/bin/sh", args: ["-c", `${root}/.probe/x --flag=1`] },
        ]),
      ),
    ).toEqual([
      `interpreter-operand:${root}/.probe/x --flag=1`,
      `interpreter-operand:${root}/.probe/x`,
    ]);
  });

  it("reports an absolute worktree token whose filename contains an equals sign", () => {
    // The composed shape: the argument is not itself absolute, because it
    // begins with the interpreter word, so the whole-argument absolute reading
    // does not fire and the path arrives only as a token. Reading that token
    // as a configuration pair would leave `b.mjs`, which is relative,
    // separator-free and absent from disk, so nothing would be reported at
    // all. Two origins, because the whole argument also carries a separator
    // before its `=` and the detector adds a reading rather than suppressing
    // one.
    expect(
      repositoryExecutionOrigins(
        syntheticRecord(root, [
          {
            executable: "/bin/sh",
            args: ["-c", `node ${root}/.probe/a=b.mjs`],
          },
        ]),
      ),
    ).toEqual([
      `interpreter-operand:${root}/node ${root}/.probe/a=b.mjs`,
      `interpreter-operand:${root}/.probe/a=b.mjs`,
    ]);
  });

  it("reports a relative worktree operand whose filename contains an equals sign", () => {
    // `resolve(root, ".probe/a=b.mjs")` is inside the materialization root, so
    // this names worktree code. A path separator precedes the `=`, which is
    // what tells this filename apart from a configuration pair such as
    // `core.hooksPath=/dev/null`.
    expect(
      repositoryExecutionOrigins(
        syntheticRecord(root, [
          { executable: "/bin/sh", args: [".probe/a=b.mjs"] },
        ]),
      ),
    ).toEqual([`interpreter-operand:${root}/.probe/a=b.mjs`]);
  });

  it("reports nothing over the product's own git vectors", () => {
    // The negative control for the widening: the product genuinely names its
    // materialization root on `init`, runs every phase with that root as its
    // working directory, and passes subcommand words, option values and a
    // source path that must not be read as worktree code.
    const origins = repositoryExecutionOrigins(
      syntheticRecord(root, [
        { executable: "/usr/bin/git", args: ["--exec-path"] },
        {
          executable: "/usr/bin/git",
          args: [
            ...pinnedGitConfigurationArgs(),
            "init",
            "--quiet",
            "--",
            root,
          ],
        },
        {
          executable: "/usr/bin/git",
          args: [
            ...pinnedGitConfigurationArgs(),
            "fetch",
            "--depth=1",
            "--no-tags",
            "--",
            "/private/tmp/fixture/source",
            "0".repeat(40),
          ],
        },
        {
          executable: "/usr/bin/git",
          args: [
            ...pinnedGitConfigurationArgs(),
            "checkout",
            "--detach",
            "--force",
            "FETCH_HEAD",
          ],
        },
        { executable: "/bin/ps", args: ["-o", "lstart=", "-p", "1"] },
      ]),
    );

    expect(origins).toEqual([]);
  });
});

function expectNoRepositoryExecution(record: TrialInspectionRecord): void {
  expect(repositoryExecutionOrigins(record)).toEqual([]);
}

describe("AC-0133 no repository hook runs during inspection", () => {
  it("records no hook in the process tree with the pinned hooks path", async () => {
    const markers = await markersDuringMaterialization("repository-hook");

    expect(markers).not.toContain(PROBE_LOG_MARKER["repository-hook"]);
    expect(markers).toEqual([]);
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("repository-hook")).resolves.toBe(true);
  });
});

describe("AC-0134 no package script runs during inspection", () => {
  it("records no package script execution in the product trial", async () => {
    const record = await productTrialFor("package-script");

    expect(record.termination).toBe("completed");
    expectNoRepositoryExecution(record);
  });

  it("materializes the script without running it", async () => {
    const record = await productTrialFor("package-script");

    // The declaration and the script are both present: the observation above
    // is of a repository that genuinely carries the thing that did not run.
    expect(
      readFileSync(
        join(record.stateRoot.materializationRoot, "package.json"),
        "utf8",
      ),
    ).toContain("postinstall");
    expect(
      existsSync(
        join(record.stateRoot.materializationRoot, ".probe/package-script.mjs"),
      ),
    ).toBe(true);
  });

  it("fails the same assertion when the product Runtime starts the planted script", async () => {
    const record = await productTrialFor("package-script", {
      executionProofMutation: "package-script",
    });

    expect(() => {
      expectNoRepositoryExecution(record);
    }).toThrow();
    expect(repositoryExecutionOrigins(record)).toEqual([
      `interpreter-operand:${join(
        record.stateRoot.materializationRoot,
        ".probe/package-script.mjs",
      )}`,
    ]);
  });
});

describe("AC-0135 no projected skill executable runs during inspection", () => {
  it("records no projected skill execution in the product trial", async () => {
    const record = await productTrialFor("projected-skill-executable");

    expect(record.termination).toBe("completed");
    expectNoRepositoryExecution(record);
  });

  it("materializes the executable without running it", async () => {
    const record = await productTrialFor("projected-skill-executable");

    expect(
      existsSync(
        join(
          record.stateRoot.materializationRoot,
          ".agents/skills/hostile/run",
        ),
      ),
    ).toBe(true);
  });

  it("fails the same assertion when the product Runtime starts the projected executable", async () => {
    const record = await productTrialFor("projected-skill-executable", {
      executionProofMutation: "projected-skill-executable",
    });

    expect(() => {
      expectNoRepositoryExecution(record);
    }).toThrow();
    expect(repositoryExecutionOrigins(record)).toEqual([
      `executable:${join(
        record.stateRoot.materializationRoot,
        ".agents/skills/hostile/run",
      )}`,
    ]);
  });
});

/**
 * The real `.git` as git wrote it: a directory whose `HEAD` and `config` hold
 * git's own bytes, never the hostile fixture's bytes.
 */
function expectRealDotGitIntact(worktree: string): void {
  const dotGit = join(worktree, ".git");
  expect(lstatSync(dotGit).isDirectory()).toBe(true);
  const head = readFileSync(join(dotGit, "HEAD"), "utf8");
  expect(head).not.toContain("hostile-config");
  expect(head.trim()).toMatch(/^(?:ref: refs\/\S+|[0-9a-f]{40})$/);
  expect(readFileSync(join(dotGit, "config"), "utf8")).not.toContain(
    "hostile-config",
  );
}

describe("AC-0136 a .git variant does not overwrite the real .git", () => {
  /**
   * The product-shaped sequence has two refusal layers for this fixture.
   * `transfer.fsckObjects=true` rejects the object during fetch with
   * `hasDotgit`; when that pin alone is omitted, checkout still exits non-zero
   * with `invalid path '.GIT'`. The paired assertions prove the transfer pin is
   * reachable without pretending its omission defeats the checkout fallback.
   *
   * Nothing is overwritten because nothing is written, which is the strongest
   * form this assertion can hold while both refusal layers remain effective.
   *
   * **This covers the case-insensitive arm only.** AC-0136 also names a
   * Unicode-ignorable variant, whose overwrite proof is in the HFS+ block
   * below. The `.GIT` all-guards-out case in this block shows git's own path
   * check refuses the arm even with `core.protectHFS`, `core.protectNTFS` and
   * `transfer.fsckObjects` all out of force; by owner decision 2026-10-01 that
   * arm is recorded as protected by git's own path check — see its row in
   * `notes/acceptance-audit.md`.
   */
  it("refuses the variant during the pinned fetch", async () => {
    const fixture = await buildHostileFixture({ caseId: "dot-git-variant" });

    await expect(materialize(fixture)).rejects.toThrow(
      /hasDotgit: contains '\.git'/,
    );
  });

  it("falls through to checkout refusal when the fsck pin is omitted", async () => {
    const fixture = await buildHostileFixture({
      caseId: "dot-git-variant",
      omitPinPrefix: "transfer.fsckObjects",
    });

    await expect(materialize(fixture)).rejects.toThrow(/invalid path '\.GIT'/);
  });

  it("leaves the real .git directory intact after the refusal", async () => {
    const fixture = await buildHostileFixture({ caseId: "dot-git-variant" });
    await expect(materialize(fixture)).rejects.toThrow();

    // `init` created the real `.git`; the refused fetch left it as git wrote
    // it, not as the hostile blob would have.
    const dotGit = join(fixture.worktree, ".git");
    expect(lstatSync(dotGit).isDirectory()).toBe(true);
    expect(readFileSync(join(dotGit, "HEAD"), "utf8")).not.toContain(
      "hostile-config",
    );
  });

  it("writes no .GIT-named entry into the working tree", async () => {
    const fixture = await buildHostileFixture({ caseId: "dot-git-variant" });
    await expect(materialize(fixture)).rejects.toThrow();

    const variants = walk(fixture.worktree).filter(
      (relativePath) =>
        relativePath.toLowerCase() === ".git" && relativePath !== ".git",
    );
    expect(variants).toEqual([]);
  });

  it("still refuses .GIT/config at checkout with every product guard out of force", async () => {
    const fixture = await buildHostileFixture({
      caseId: "dot-git-variant",
      dotGitVariantChild: "config",
      omitPinPrefix: [
        "transfer.fsckObjects",
        "core.protectHFS",
        "core.protectNTFS",
      ],
      ambientPins: ["core.protectHFS=false", "core.protectNTFS=false"],
    });

    await expect(materialize(fixture)).rejects.toThrow(
      "invalid path '.GIT/config'",
    );
    expectRealDotGitIntact(fixture.worktree);
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("dot-git-variant")).resolves.toBe(true);
  });
});

describe("AC-0136 the Unicode-ignorable .git variant measured at three layers", () => {
  /**
   * The second arm AC-0136 names: `.gi<U+200C>t`, whose zero-width non-joiner
   * an HFS+ filesystem ignores, so the name folds to `.git` where the
   * case-folding arm above relies on case instead.
   *
   * Three layers are measured through the same product-shaped
   * init/fetch/checkout/rev-parse sequence, one recorded result each:
   *
   * 1. both pins present — `transfer.fsckObjects=true` refuses the object
   *    during **fetch**, before any tree exists;
   * 2. the fsck pin alone out of force — the fetch succeeds and **checkout**
   *    refuses the path;
   * 3. both out of force — the entry **materializes**, as a sibling of the real
   *    `.git` directory.
   *
   * **Layer 3 is a sibling, not an overwrite on APFS.** `.gi<U+200C>t` and
   * `.git` are distinct names on APFS, so git writes a new entry beside the
   * repository directory and the real `.git` is untouched. The overwrite
   * AC-0136 names is demonstrated on HFS+ in the block below: there
   * `.gi<U+200C>t` *is* `.git` and dropping `core.protectHFS=true` while
   * `core.protectHFS=false` is ambient causes checkout to overwrite
   * `.git/config`.
   *
   * Layer 3 sets `core.protectHFS=false` ahead of the product pins rather than
   * only dropping `core.protectHFS=true`. Measured on this host, git 2.50.1
   * (Apple Git-155) defaults HFS protection **on**, so omitting the pin alone
   * leaves the guard in force and layer 3 would be indistinguishable from
   * layer 2. Neutralizing the ambient default is how the suite already isolates
   * `protocol.version` (`pinned-git-configuration-proof.test.ts`'s
   * `pinArgsAfterAmbient`); it removes the guard from the control's own
   * checkout and changes no product setting.
   */
  function unicodeVariantFixture(
    options: {
      omitPinPrefix?: readonly string[];
      ambientPins?: readonly string[];
    } = {},
  ) {
    return buildHostileFixture({
      caseId: "dot-git-variant",
      dotGitVariantEntry: DOT_GIT_UNICODE_ENTRY,
      ...options,
    });
  }

  it("plants the zero-width non-joiner spelling in the source object database", async () => {
    const fixture = await unicodeVariantFixture();

    expect(fixture.dotGitVariantEntry).toBe(DOT_GIT_UNICODE_ENTRY);
    expect(DOT_GIT_UNICODE_ENTRY).not.toBe(".git");
    expect(sourceObjectHasDotGitVariant(fixture)).toBe(true);
  });

  it("layer 1: refuses the variant during the pinned fetch", async () => {
    const fixture = await unicodeVariantFixture();

    await expect(materialize(fixture)).rejects.toThrow(
      /hasDotgit: contains '\.git'/,
    );
    expectRealDotGitIntact(fixture.worktree);
    expect(walk(fixture.worktree)).not.toContain(DOT_GIT_UNICODE_ENTRY);
  });

  it("layer 2: advances to a checkout refusal when the fsck pin alone is out of force", async () => {
    const fixture = await unicodeVariantFixture({
      omitPinPrefix: ["transfer.fsckObjects"],
    });

    await expect(materialize(fixture)).rejects.toThrow(
      `invalid path '${DOT_GIT_UNICODE_ENTRY}'`,
    );
    expectRealDotGitIntact(fixture.worktree);
    expect(walk(fixture.worktree)).not.toContain(DOT_GIT_UNICODE_ENTRY);
  });

  it("layer 3: materializes the variant beside an intact real .git when both pins are out of force", async () => {
    const fixture = await unicodeVariantFixture({
      omitPinPrefix: ["transfer.fsckObjects", "core.protectHFS"],
      ambientPins: ["core.protectHFS=false"],
    });

    await materialize(fixture);

    // A sibling entry carrying the hostile blob's bytes. The real `.git` beside
    // it is still git's own directory, so nothing was overwritten.
    expect(walk(fixture.worktree)).toContain(DOT_GIT_UNICODE_ENTRY);
    expect(
      readFileSync(join(fixture.worktree, DOT_GIT_UNICODE_ENTRY), "utf8"),
    ).toBe("hostile-config\n");
    expectRealDotGitIntact(fixture.worktree);
  });
});

describe.skipIf(process.platform !== "darwin")(
  "AC-0136 on an HFS+ volume, where the Unicode variant is the real .git",
  () => {
    /**
     * HFS+ ignores U+200C, so on this volume `.gi<U+200C>t` *is* `.git` and a
     * checkout that admits it writes into the real repository directory. This
     * is the overwrite AC-0136 names; on APFS the same entry lands as a sibling.
     *
     * Every checkout-layer run sets `core.protectHFS=false` ambiently, ahead of
     * the product pins. git's Apple build turns HFS protection on by default,
     * so without that setting omitting the pin would remove no guard; with it,
     * the product pin alone decides whether the entry is refused.
     *
     * Each fixture plants `<entry>/config`, never the default blob: on HFS+ a
     * blob named `.gi<U+200C>t` deletes the real `.git` instead of replacing a
     * file in it. Measured 2026-10-01; see
     * `docs/specs/connect-orient-ac0136-overwrite-arm/notes/verification-ledger.md`.
     */
    let volume: ReturnType<typeof mountHfsVolume>;

    beforeAll(() => {
      volume = mountHfsVolume();
    });
    afterAll(() => {
      try {
        disposeHostileFixtures();
      } finally {
        volume?.dispose();
      }
    });

    it("folds the zero-width non-joiner spelling to .git on this volume", () => {
      expect(foldsToDotGit(volume.mountPoint)).toBe(true);
    });

    it("refuses the variant during the pinned fetch", async () => {
      const fixture = await buildHostileFixture({
        caseId: "dot-git-variant",
        dotGitVariantEntry: DOT_GIT_UNICODE_ENTRY,
        dotGitVariantChild: "config",
        parentDirectory: volume.mountPoint,
      });

      await expect(materialize(fixture)).rejects.toThrow(
        /hasDotgit: contains '\.git'/,
      );
      expectRealDotGitIntact(fixture.worktree);
    });

    it("refuses the variant at checkout through the core.protectHFS pin when the fsck pin is out of force", async () => {
      const fixture = await buildHostileFixture({
        caseId: "dot-git-variant",
        dotGitVariantEntry: DOT_GIT_UNICODE_ENTRY,
        dotGitVariantChild: "config",
        parentDirectory: volume.mountPoint,
        omitPinPrefix: ["transfer.fsckObjects"],
        ambientPins: ["core.protectHFS=false"],
      });

      await expect(materialize(fixture)).rejects.toThrow(
        `invalid path '${DOT_GIT_UNICODE_ENTRY}/config'`,
      );
      expectRealDotGitIntact(fixture.worktree);
    });

    it("overwrites the real .git/config once core.protectHFS is out of force too", async () => {
      const fixture = await buildHostileFixture({
        caseId: "dot-git-variant",
        dotGitVariantEntry: DOT_GIT_UNICODE_ENTRY,
        dotGitVariantChild: "config",
        parentDirectory: volume.mountPoint,
        omitPinPrefix: ["transfer.fsckObjects", "core.protectHFS"],
        ambientPins: ["core.protectHFS=false"],
      });

      await materialize(fixture);

      expect(
        readFileSync(join(fixture.worktree, ".git", "config"), "utf8"),
      ).toBe("hostile-config\n");
      expect(() => expectRealDotGitIntact(fixture.worktree)).toThrow();
    });

    it("still refuses .GIT/config at checkout with every product guard out of force", async () => {
      const fixture = await buildHostileFixture({
        caseId: "dot-git-variant",
        dotGitVariantChild: "config",
        parentDirectory: volume.mountPoint,
        omitPinPrefix: [
          "transfer.fsckObjects",
          "core.protectHFS",
          "core.protectNTFS",
        ],
        ambientPins: ["core.protectHFS=false", "core.protectNTFS=false"],
      });

      await expect(materialize(fixture)).rejects.toThrow(
        "invalid path '.GIT/config'",
      );
      expectRealDotGitIntact(fixture.worktree);
    });
  },
);

describe("AC-0137 a .gitattributes filter declaration triggers no filter", () => {
  /**
   * The marker channel, supplied to the guard-present trials as well as to the
   * mutation. AC-0004's second half is "leaves no filter marker", and without
   * this path `STUDIO_PROBE_LOG` never reaches the descendant environment
   * (`runtime-child.ts`'s `executionProofLog` branch), so the planted filter
   * would append to `/dev/null` and the absence would be read off a channel
   * nothing could have written to.
   */
  function probeLogPath(): string {
    const probeRoot = mkdtempSync(join(tmpdir(), "connect-orient-filter-"));
    temporaryRoots.add(probeRoot);
    return join(probeRoot, "filter.log");
  }

  /** The channel's contents, empty when no descendant created the file. */
  function markerChannel(probeLog: string): string {
    return existsSync(probeLog) ? readFileSync(probeLog, "utf8") : "";
  }

  it("records no filter command and leaves no filter marker", async () => {
    const probeLog = probeLogPath();
    const record = await productTrialFor("attribute-filter", {
      executionProofLog: probeLog,
    });

    expect(record.termination).toBe("completed");
    expectNoRepositoryExecution(record);
    // Both halves of AC-0004 over the same settled trial: the record carries no
    // filter command, and the channel the filter writes when it runs is empty.
    expect(markerChannel(probeLog)).not.toContain(
      PROBE_LOG_MARKER["attribute-filter"],
    );
  });

  it("leaves the declared file at its committed bytes", async () => {
    const probeLog = probeLogPath();
    const record = await productTrialFor("attribute-filter", {
      executionProofLog: probeLog,
    });

    // The same marker half as the arm above, over this arm's own probe log:
    // this arm starts a second trial with a fresh channel, so the first arm's
    // reading says nothing about this one.
    expect(markerChannel(probeLog)).not.toContain(
      PROBE_LOG_MARKER["attribute-filter"],
    );
    // The declaration is present and the content is untransformed, so the
    // filter was declared and still did not run. This assertion discriminates
    // only because the planted filter writes bytes the commit does not carry:
    // while it printed its own input back, the committed bytes were what
    // `filtered.txt` held either way.
    expect(ATTRIBUTE_FILTER_SMUDGED_CONTENT).not.toBe(
      ATTRIBUTE_FILTER_COMMITTED_CONTENT,
    );
    expect(
      readFileSync(
        join(record.stateRoot.materializationRoot, ".gitattributes"),
        "utf8",
      ),
    ).toContain("filter=probe");
    expect(
      readFileSync(
        join(record.stateRoot.materializationRoot, "filtered.txt"),
        "utf8",
      ),
    ).toBe(ATTRIBUTE_FILTER_COMMITTED_CONTENT);
  });

  it("fails the same observations when the product Git operation enables the filter", async () => {
    const probeLog = probeLogPath();
    const record = await productTrialFor("attribute-filter", {
      executionProofMutation: "attribute-filter",
      executionProofLog: probeLog,
    });

    expect(() => {
      expectNoRepositoryExecution(record);
    }).toThrow();
    expect(repositoryExecutionOrigins(record)).toEqual([
      `command-payload:filter.probe.smudge=${join(
        record.stateRoot.materializationRoot,
        ".probe/filter",
      )}`,
    ]);
    // Every observation the guard-present cases above read, inverted: the
    // marker is present and the checked-out bytes are the filter's own.
    expect(markerChannel(probeLog)).toContain(
      PROBE_LOG_MARKER["attribute-filter"],
    );
    expect(
      readFileSync(
        join(record.stateRoot.materializationRoot, "filtered.txt"),
        "utf8",
      ),
    ).toBe(ATTRIBUTE_FILTER_SMUDGED_CONTENT);
  });
});

describe("AC-0139 an escaping symlink materializes as a regular file", () => {
  it("holds the target string as content rather than traversing it", async () => {
    const fixture = await buildHostileFixture({ caseId: "escaping-symlink" });
    await materialize(fixture);

    const escapePath = join(fixture.worktree, "escape");
    const status = lstatSync(escapePath);
    expect(status.isSymbolicLink()).toBe(false);
    expect(status.isFile()).toBe(true);
    expect(readFileSync(escapePath, "utf8")).toBe("../../outside");
  });

  it("leaves no symbolic link anywhere under the root", async () => {
    const fixture = await buildHostileFixture({ caseId: "escaping-symlink" });
    await materialize(fixture);

    const links = walk(fixture.worktree).filter((relativePath) =>
      lstatSync(join(fixture.worktree, relativePath)).isSymbolicLink(),
    );
    expect(links).toEqual([]);
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("escaping-symlink")).resolves.toBe(true);
  });
});

describe("AC-0140 the reader refuses an escaping path presented directly", () => {
  it("refuses a sibling whose name merely extends the root", async () => {
    const fixture = await buildHostileFixture({
      caseId: "escaping-reader-path",
    });
    await materialize(fixture);
    // The control proves this sibling is readable and that its path passes a
    // naive prefix test. The reader refuses it anyway, on a segment boundary.
    const sibling = `${fixture.worktree}-extended`;
    spawnSync("/bin/mkdir", ["-p", sibling]);
    spawnSync("/bin/cp", [
      join(fixture.worktree, "inside.txt"),
      join(sibling, "secret"),
    ]);

    expect(() =>
      readContainedFile(fixture.worktree, join(sibling, "secret")),
    ).toThrow(ConfinementError);
    expect(join(sibling, "secret").startsWith(fixture.worktree)).toBe(true);
  });

  it("refuses a parent-traversing path independently of materialization", async () => {
    const fixture = await buildHostileFixture({
      caseId: "escaping-reader-path",
    });
    await materialize(fixture);

    expect(() =>
      readContainedFile(
        fixture.worktree,
        join(fixture.worktree, "..", "source", "inside.txt"),
      ),
    ).toThrow(ConfinementError);
  });

  it("admits an ordinary contained file, so the refusal is not blanket", async () => {
    const fixture = await buildHostileFixture({
      caseId: "escaping-reader-path",
    });
    await materialize(fixture);

    expect(
      readContainedFile(fixture.worktree, join(fixture.worktree, "inside.txt")),
    ).toBe("inside\n");
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("escaping-reader-path")).resolves.toBe(
      true,
    );
  });
});

describe("AC-0141 a real gitlink causes no submodule fetch and no traversal", () => {
  /**
   * Both halves of AC-0141, over a corpus case that now carries a real
   * submodule: a `.gitmodules` declaration, a mode-160000 gitlink, and a local
   * child repository holding the commit that gitlink names. The earlier fixture
   * wrote `.gitmodules` as plain text with no gitlink, so there was no
   * submodule for the product to recurse into and both halves held by
   * construction.
   *
   * The halves are measured on different surfaces and recorded separately:
   * **fetch** on the trial's parent-visible process record, **traversal** on
   * the filesystem after it settles. Neither stands in for the other.
   */

  /**
   * Every argument vector the trial's own process record shows. This is where a
   * submodule fetch would have to appear: the Runtime reports each start as it
   * happens, so the record survives a phase that was cut short.
   */
  function auditedArgumentVectors(record: TrialInspectionRecord): string[][] {
    return record.spawnAudit.map((entry) => [...entry.args]);
  }

  /**
   * Vectors that perform a submodule operation. The bare `submodule` operand is
   * the discriminator: every product vector carries
   * `-c submodule.recurse=false`, so a substring match would report the pin
   * that forbids recursion as though it were recursion.
   */
  function submoduleOperations(
    vectors: readonly (readonly string[])[],
  ): string[] {
    return vectors
      .filter((args) => args.includes("submodule"))
      .map((args) => args.join(" "));
  }

  function expectNoSubmoduleFetch(
    vectors: readonly (readonly string[])[],
  ): void {
    expect(
      vectors.length,
      "no process record to read a submodule absence from",
    ).toBeGreaterThan(0);
    expect(submoduleOperations(vectors)).toEqual([]);
  }

  /**
   * The two surfaces a traversal would leave behind: content under the gitlink
   * path in the worktree, and submodule administrative state under the Git
   * directory. `gitlinkPresent` is in the same object deliberately — the
   * gitlink path exists as an empty directory whenever the tree really carried
   * a gitlink, so its absence would mean the absence below was read off a tree
   * with no submodule in it.
   */
  function gitlinkSurfaces(materializationRoot: string): {
    gitlinkPresent: boolean;
    populated: string[];
    administrative: string[];
  } {
    const gitlink = join(materializationRoot, SUBMODULE_GITLINK_PATH);
    const modules = join(materializationRoot, ".git", "modules");
    return {
      gitlinkPresent: existsSync(gitlink),
      populated: existsSync(gitlink) ? readdirSync(gitlink) : [],
      administrative: existsSync(modules) ? readdirSync(modules) : [],
    };
  }

  function expectNoGitlinkTraversal(materializationRoot: string): void {
    expect(gitlinkSurfaces(materializationRoot)).toEqual({
      gitlinkPresent: true,
      populated: [],
      administrative: [],
    });
  }

  it("AC-0006 records no submodule fetch command in the product trial", async () => {
    const record = await productTrialFor("submodule");

    expect(record.termination).toBe("completed");
    expectNoSubmoduleFetch(auditedArgumentVectors(record));
    // The declaration is materialized as inert data, so the absence above is
    // over a tree that genuinely asks for the fetch that did not happen.
    expect(
      readFileSync(
        join(record.stateRoot.materializationRoot, ".gitmodules"),
        "utf8",
      ),
    ).toContain(SUBMODULE_GITLINK_PATH);
  });

  it("AC-0006 fails the fetch observation under a prohibited submodule update", async () => {
    const record = await productTrialFor("submodule");
    const control = runProhibitedSubmoduleUpdate(
      record.stateRoot.materializationRoot,
    );

    // The mutation ran, rather than merely being issued: the child
    // repository's committed content is under the gitlink path.
    expect({ status: control.status, populated: control.populated }).toEqual({
      status: 0,
      populated: expect.arrayContaining([SUBMODULE_CHILD_FILE]),
    });
    expect(() => {
      expectNoSubmoduleFetch([...auditedArgumentVectors(record), control.args]);
    }).toThrow();
    expect(submoduleOperations([control.args])).toEqual([
      `-c protocol.file.allow=always submodule update --init -- ${SUBMODULE_GITLINK_PATH}`,
    ]);
  });

  it("AC-0007 leaves no populated gitlink and no submodule administrative state", async () => {
    const record = await productTrialFor("submodule");

    expectNoGitlinkTraversal(record.stateRoot.materializationRoot);
  });

  it("AC-0007 fails the traversal observation under a prohibited submodule update", async () => {
    const record = await productTrialFor("submodule");
    const root = record.stateRoot.materializationRoot;
    expectNoGitlinkTraversal(root);

    const control = runProhibitedSubmoduleUpdate(root);

    expect(control.status).toBe(0);
    // Both surfaces, so neither half of the traversal claim can be the only
    // one a control reddens.
    expect(
      readFileSync(
        join(root, SUBMODULE_GITLINK_PATH, SUBMODULE_CHILD_FILE),
        "utf8",
      ),
    ).toBe(SUBMODULE_CHILD_CONTENT);
    expect(gitlinkSurfaces(root).administrative).toEqual([
      SUBMODULE_GITLINK_PATH,
    ]);
    expect(() => {
      expectNoGitlinkTraversal(root);
    }).toThrow();
  });

  it("carries the recursion refusal on every git argument vector", () => {
    // AC-0049's mechanism, asserted where the vector is built rather than only
    // where one checkout happened not to recurse.
    expect(PINNED_GIT_CONFIGURATION).toContain("submodule.recurse=false");
    expect(pinnedGitConfigurationArgs()).toContain("submodule.recurse=false");
  });

  it("populates the child content when the prohibited operation is issued", async () => {
    // The corpus-wide control for this case, over the fixture's own
    // materialization rather than the trial's. No guard is removed: the
    // prohibited submodule operation is issued, and the child repository's
    // committed content appearing under the gitlink is what proves it ran.
    await expect(runPositiveControl("submodule")).resolves.toBe(true);
  });
});

describe("AC-0142 an option-shaped remote ref is refused before any vector", () => {
  it("refuses a reported default branch shaped like a git option", async () => {
    const fixture = await buildHostileFixture({ caseId: "option-shaped-ref" });
    await materialize(fixture);
    const reported = readFileSync(
      join(fixture.worktree, ".probe/ref"),
      "utf8",
    ).trim();

    const canonical = canonicalizeSource(
      "https://github.com/owner/repository",
      reported,
    );

    expect(canonical.ok).toBe(false);
    expect(reported).toBe("--upload-pack=/bin/sh");
  });

  it("refuses it before it can reach an argument vector", async () => {
    const fixture = await buildHostileFixture({ caseId: "option-shaped-ref" });
    await materialize(fixture);
    const reported = readFileSync(
      join(fixture.worktree, ".probe/ref"),
      "utf8",
    ).trim();

    // The refusal is what keeps the value out of a vector: there is no vector
    // to inspect because none is built. Asserting the canonical identity is
    // absent is the observation at the level the refusal happens.
    const canonical = canonicalizeSource(
      "https://github.com/owner/repository",
      reported,
    );
    expect(canonical).not.toHaveProperty("identity");
  });

  it("admits an ordinary ref, so the refusal is not blanket", () => {
    expect(
      canonicalizeSource("https://github.com/owner/repository", "main").ok,
    ).toBe(true);
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("option-shaped-ref")).resolves.toBe(true);
  });
});

describe("AC-0143 a prototype-mutating key yields no value under that key", () => {
  it("yields no value under the key in TOML", async () => {
    const fixture = await buildHostileFixture({ caseId: "prototype-key" });
    await materialize(fixture);
    const text = readFileSync(join(fixture.worktree, "workspace.toml"), "utf8");

    const parsed = parseGuardedToml(text) as Record<string, unknown>;

    expect(Object.hasOwn(parsed, "__proto__")).toBe(false);
    expect(Object.keys(parsed)).not.toContain("__proto__");
    expect(Object.getPrototypeOf(parsed)).toBeNull();
  });

  it("yields no value under the key in JSON", async () => {
    const fixture = await buildHostileFixture({ caseId: "prototype-key" });
    await materialize(fixture);
    const text = readFileSync(
      join(fixture.worktree, "projection.json"),
      "utf8",
    );

    const parsed = parseGuardedJson(text) as Record<string, unknown>;

    expect(Object.hasOwn(parsed, "__proto__")).toBe(false);
    expect(Object.getPrototypeOf(parsed)).toBeNull();
  });

  it("drops the key at depth, not only at the root", () => {
    const toml = parseGuardedToml("[a.b.__proto__]\nx = 1\n") as {
      a: { b: Record<string, unknown> };
    };
    expect(Object.hasOwn(toml.a.b, "__proto__")).toBe(false);

    const json = parseGuardedJson('{"a":{"b":{"constructor":1}}}') as {
      a: { b: Record<string, unknown> };
    };
    expect(Object.hasOwn(json.a.b, "constructor")).toBe(false);

    const inArray = parseGuardedJson('{"a":[{"prototype":1}]}') as {
      a: Record<string, unknown>[];
    };
    expect(Object.hasOwn(inArray.a[0] as object, "prototype")).toBe(false);
  });

  it("materializes every nested object without an inherited prototype", () => {
    const parsed = parseGuardedToml("[a.b]\nx = 1\n") as {
      a: { b: unknown };
    };

    expect(Object.getPrototypeOf(parsed)).toBeNull();
    expect(Object.getPrototypeOf(parsed.a)).toBeNull();
    expect(Object.getPrototypeOf(parsed.a.b as object)).toBeNull();
  });

  it("leaves Object.prototype unmutated either way", async () => {
    const fixture = await buildHostileFixture({ caseId: "prototype-key" });
    await materialize(fixture);

    for (const [file, parse] of [
      ["workspace.toml", parseGuardedToml],
      ["projection.json", parseGuardedJson],
    ] as const) {
      parse(readFileSync(join(fixture.worktree, file), "utf8"));
    }
    expect((Object.prototype as { ready?: unknown }).ready).toBeUndefined();
  });

  it("keeps the admissible keys, so the guard is not blanket", () => {
    expect({ ...(parseGuardedToml("ready = true\n") as object) }).toEqual({
      ready: true,
    });
    expect({ ...(parseGuardedJson('{"ready":true}') as object) }).toEqual({
      ready: true,
    });
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("prototype-key")).resolves.toBe(true);
  });
});

describe("AC-0144 no module is imported from under the materialization root", () => {
  it("resolves no specifier under the root while the tree is read", async () => {
    const fixture = await buildHostileFixture({
      caseId: "materialized-module",
    });
    await materialize(fixture);

    const resolved: string[] = [];
    const hooks = module.registerHooks({
      resolve(specifier, context, nextResolve) {
        resolved.push(specifier);
        return nextResolve(specifier, context);
      },
    });
    try {
      // The reader is the only thing Studio points at materialized content.
      // Reading the module's bytes must not resolve them as a module.
      expect(
        readContainedFile(
          fixture.worktree,
          join(fixture.worktree, "hostile.mjs"),
        ),
      ).toContain("__hostileImported");
    } finally {
      hooks.deregister();
    }

    const worktreeUrl = pathToFileURL(fixture.worktree).href;
    expect(
      resolved.filter(
        (specifier) =>
          specifier.startsWith(worktreeUrl) ||
          specifier.startsWith(fixture.worktree),
      ),
    ).toEqual([]);
    expect(
      (globalThis as { __hostileImported?: boolean }).__hostileImported,
    ).toBeUndefined();
  });

  it("imports nothing but node builtins in the Runtime child", () => {
    // The child is the one Studio process whose working directory is the state
    // root, so its import graph is the one that could reach materialized
    // content. It is dependency-free by construction; this is that audit.
    const child = readFileSync(
      new URL("./runtime-child.ts", import.meta.url),
      "utf8",
    );
    // Anchored to a whole import statement. A bare `from "…"` also occurs
    // inside this module's prose, and matching that would audit a comment.
    const specifiers = [
      ...child.matchAll(/^\s*(?:import|\})[^"]*from "([^"]+)";$/gm),
    ].map((match) => match[1]);
    expect(specifiers.length).toBeGreaterThan(0);
    for (const specifier of specifiers) {
      expect(specifier).toMatch(/^node:/);
    }
    expect(child).not.toMatch(/\bimport\s*\(/);
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("materialized-module")).resolves.toBe(true);
    // The control imports the module, which sets the marker. Clear it so a
    // later run of the proof above observes an absence rather than this.
    delete (globalThis as { __hostileImported?: boolean }).__hostileImported;
  });
});

describe("AC-0145 no authorization header is sent on any request", () => {
  it("makes no HTTP request from Studio's own process at all", async () => {
    const fixture = await buildHostileFixture({
      caseId: "authorization-header",
    });
    const requested: string[] = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = ((input: unknown) => {
      requested.push(String(input));
      throw new Error("no request may be made");
    }) as typeof globalThis.fetch;
    try {
      await materialize(fixture);
    } finally {
      globalThis.fetch = realFetch;
    }

    expect(requested).toEqual([]);
    // The header the repository asked for is materialized as inert data.
    expect(
      readFileSync(join(fixture.worktree, ".probe/request.json"), "utf8"),
    ).toContain("Bearer repository-token");
  });

  it("carries no credential-bearing name in the pinned environment", () => {
    const environment = buildPinnedEnvironment({
      home: "/tmp/home",
      temporaryDirectory: "/tmp/tmp",
    });

    for (const name of Object.keys(environment)) {
      expect(name.toLowerCase()).not.toContain("auth");
      expect(name.toLowerCase()).not.toContain("token");
      expect(name.toLowerCase()).not.toContain("credential");
    }
    // The two ask-pass names are present and empty, which is what keeps git
    // from prompting rather than a credential Studio supplies.
    expect(environment.GIT_ASKPASS).toBe("");
    expect(environment.SSH_ASKPASS).toBe("");
    expect(ENVIRONMENT_ALLOWLIST_NAMES).not.toContain("GIT_TOKEN");
  });

  it("disables the credential helper on every git argument vector", () => {
    expect(PINNED_GIT_CONFIGURATION).toContain("credential.helper=");
    expect(pinnedGitConfigurationArgs()).toContain("credential.helper=");
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("authorization-header")).resolves.toBe(
      true,
    );
  });
});
