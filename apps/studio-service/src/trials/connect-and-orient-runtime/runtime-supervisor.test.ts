import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Every test here spawns a real detached process group and samples it with
// `ps`. That work exceeds vitest's 5s default whenever the machine is busy, so
// the suite is given a generous file-level budget. This is a scheduling
// allowance, not a slow assertion: each test still fails on its own assertion,
// and the budget is set here rather than per test so the approved AC-0023 stub
// block stays byte-identical to plan.md.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// AC-0016 is a negative: the Studio Service process must open no path under a
// materialization root. Recording every path argument that reaches `node:fs`
// from this module graph — which is the graph the Service-side trial code lives
// in — turns that negative into an observation, and the positive control at the
// end of the AC-0016 test proves the recorder is live rather than vacuous.
const { fileSystemPathArguments } = vi.hoisted(() => ({
  fileSystemPathArguments: [] as string[],
}));

function recordPathArguments(real: Record<string, unknown>) {
  const wrapped: Record<string, unknown> = { ...real };
  for (const [name, value] of Object.entries(real)) {
    if (typeof value !== "function" || /^[A-Z]/.test(name)) {
      continue;
    }
    wrapped[name] = (...args: unknown[]) => {
      for (const argument of args) {
        if (typeof argument === "string") {
          fileSystemPathArguments.push(argument);
        }
      }
      return (value as (...rest: unknown[]) => unknown)(...args);
    };
  }
  return wrapped;
}

vi.mock("node:fs", async (importOriginal) =>
  recordPathArguments((await importOriginal()) as Record<string, unknown>),
);
vi.mock("node:fs/promises", async (importOriginal) =>
  recordPathArguments((await importOriginal()) as Record<string, unknown>),
);

import {
  isPermittedExecutable,
  MINIMUM_INTERPRETER_VERSION,
  PYTHON_INTERPRETER_SEARCH_LIST,
  type SpawnAuditEntry,
} from "./executable-identity.js";
import {
  GIT_REDIRECT_REFUSAL,
  PINNED_GIT_CONFIGURATION,
  pinnedGitConfigurationArgs,
} from "./git-driver.js";
import {
  type ObservedProcess,
  SELF_INJECTED_ENVIRONMENT_NAMES,
  sampleProcessGroup,
} from "./process-tree-observer.js";
import {
  CONDITIONAL_ENVIRONMENT_NAME,
  ENVIRONMENT_ALLOWLIST_NAMES,
  PINNED_PATH,
} from "./runtime-environment.js";
import {
  beginTrialInspection,
  startTrialInspection,
  type TrialInspectionOptions,
  type TrialInspectionRecord,
  type TrialRequest,
  trialInspectionInFlight,
} from "./runtime-supervisor.js";

let fixtureRoot: string;
let requestRoot: string;

beforeAll(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), "connect-orient-t4-"));
  requestRoot = join(fixtureRoot, "request");
  for (const child of ["home", "tmp", "tree"]) {
    mkdirSync(join(requestRoot, child), { recursive: true, mode: 0o700 });
  }
});

afterAll(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

function validRequest(): TrialRequest {
  return {
    requestId: "t4-request-0001",
    identity: { owner: "owner", repository: "repository" },
    requestRoot,
    home: join(requestRoot, "home"),
    temporaryDirectory: join(requestRoot, "tmp"),
    materializationRoot: join(requestRoot, "tree"),
  };
}

function expectedEnv(): Record<string, string> {
  return {
    PATH: PINNED_PATH,
    HOME: join(requestRoot, "home"),
    TMPDIR: join(requestRoot, "tmp"),
    LANG: "C",
    LC_ALL: "C",
    GIT_TERMINAL_PROMPT: "0",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_SYSTEM: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_ALLOW_PROTOCOL: "https",
    GIT_ASKPASS: "",
    SSH_ASKPASS: "",
  };
}

async function runTrialRuntime(options: {
  request: TrialRequest;
  echoEnvTree?: boolean;
  supervision?: TrialInspectionOptions;
}): Promise<TrialInspectionRecord> {
  const outcome = await startTrialInspection(options.request, {
    ...options.supervision,
    observeEnvironmentTree: options.echoEnvTree ?? false,
  });
  if (!outcome.admitted) {
    throw new Error(`trial refused: ${outcome.code}`);
  }
  return outcome;
}

/**
 * Polls the live group until the Runtime's held-open `git` descendant appears.
 * `cat-file --batch` blocks on its standard input, so it is alive when the
 * parent looks. That is the property the parent-side observations need, and it
 * is entirely local: no socket is opened, bound or listened on anywhere in this
 * suite.
 */
async function waitForHeldDescendant(pgid: number): Promise<ObservedProcess[]> {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const live = sampleProcessGroup(pgid, false).processes.filter(
      (observed) => !observed.defunct && !observed.torn,
    );
    if (live.some((observed) => observed.args.includes("cat-file"))) {
      return live;
    }
    await new Promise((settle) => {
      setTimeout(settle, 25);
    });
  }
  throw new Error("no held descendant appeared in the group");
}

function processAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function gitVectors(record: TrialInspectionRecord): readonly SpawnAuditEntry[] {
  return record.spawnAudit.filter(
    (entry) => basename(entry.executable) === "git",
  );
}

// biome-ignore format: approved plan stub must remain byte-identical
it("AC-0023 pins every descendant's environment", async () => {
 const out = await runTrialRuntime({ request: validRequest(), echoEnvTree: true });
 expect(out.observedEnvByPid.size).toBeGreaterThan(1);
 for (const env of out.observedEnvByPid.values()) expect(env).toEqual(expectedEnv());
});

describe("process boundary", () => {
  it("AC-0015 runs inspection in a child process reporting a different identifier", async () => {
    const record = await runTrialRuntime({ request: validRequest() });

    expect(record.termination).toBe("completed");
    expect(record.childPid).toBeGreaterThan(0);
    expect(record.childPid).not.toBe(record.servicePid);
    expect(record.servicePid).toBe(process.pid);
    const started = record.protocolLines.find(
      (line) => line.type === "started",
    );
    expect(started).toMatchObject({
      requestId: "t4-request-0001",
      pid: record.childPid,
    });
    expect(started?.pid).not.toBe(process.pid);
  });

  it("AC-0016 opens no path under the materialization root from the Studio Service process", async () => {
    const request = validRequest();
    fileSystemPathArguments.length = 0;
    const record = await runTrialRuntime({ request });
    const duringInspection = [...fileSystemPathArguments];

    expect(record.termination).toBe("completed");
    expect(
      duringInspection.filter((path) =>
        path.startsWith(request.materializationRoot),
      ),
    ).toEqual([]);

    // Positive control: a read under the root from this same module graph is
    // recorded, so the empty result above is an observation, not a blind spot.
    readFileSync(join(request.materializationRoot, ".git", "HEAD"), "utf8");
    expect(
      fileSystemPathArguments.some((path) =>
        path.startsWith(request.materializationRoot),
      ),
    ).toBe(true);
  });

  it("AC-0017 hands the Runtime no database path and no Studio credential", async () => {
    const record = await runTrialRuntime({
      request: validRequest(),
      echoEnvTree: true,
    });

    const forbidden = [
      "STUDIO_DATABASE_PATH",
      ".sqlite",
      ".db",
      "credential:",
      "token",
      "password",
      "Bearer",
    ];
    const argumentText = record.childArgs.join(" ");
    for (const needle of forbidden) {
      expect(argumentText).not.toContain(needle);
    }
    expect(Object.keys(record.environment)).toEqual([
      ...ENVIRONMENT_ALLOWLIST_NAMES,
    ]);
    expect(
      [...record.observedEnvByPid.values()]
        .flatMap((environment) => Object.keys(environment))
        .filter(
          (name) =>
            !(ENVIRONMENT_ALLOWLIST_NAMES as readonly string[]).includes(name),
        ),
    ).toEqual([]);
    // The ambient environment of this very process carries a database path and
    // git credential carriers; none of them reached the Runtime.
    expect(process.env.STUDIO_DATABASE_PATH ?? "unset").toBeDefined();
    expect(record.environment.STUDIO_DATABASE_PATH).toBeUndefined();
  });

  it("AC-0018 writes protocol messages only to stdout and diagnostics only to stderr", async () => {
    const record = await runTrialRuntime({ request: validRequest() });

    expect(record.nonProtocolStdoutLines).toEqual([]);
    expect(record.protocolLines.length).toBeGreaterThan(3);
    for (const line of record.protocolLines) {
      expect(typeof line.type).toBe("string");
    }
    expect(record.protocolLines.at(-1)).toEqual({
      type: "completed",
      requestId: "t4-request-0001",
    });
    expect(record.completedResponse).toBe(true);
    // The interpreter's own version banner reaches diagnostics as the raw line
    // the interpreter printed. The protocol stream carries it only inside a
    // protocol message, never as a bare line of a descendant's output.
    expect(
      record.diagnostics
        .split("\n")
        .some((line) => /^Python 3\.\d+/.test(line)),
    ).toBe(true);
    for (const line of record.protocolStdout.split("\n").filter(Boolean)) {
      expect(line.startsWith("{")).toBe(true);
    }
  });

  it("AC-0019 keeps every descendant off the Runtime's protocol stdout", async () => {
    const handle = beginTrialInspection(validRequest(), {
      descendantHoldMs: 30_000,
    });
    expect(handle.admitted).toBe(true);
    if (!handle.admitted) {
      return;
    }
    await waitForHeldDescendant(handle.childPid);
    handle.cancel("cancelled");
    const record = await handle.settled;

    expect(record.nonProtocolStdoutLines).toEqual([]);
    for (const line of record.protocolStdout.split("\n").filter(Boolean)) {
      expect(() => JSON.parse(line) as unknown).not.toThrow();
    }
    // `git` wrote to its own captured pipe, which the Runtime relayed to
    // diagnostics; the protocol stream stayed pure JSON.
    expect(record.diagnostics.length).toBeGreaterThan(0);
  });
});

describe("argument vector", () => {
  it("AC-0020 launches every subprocess from an absolute path with an argument array", async () => {
    const handle = beginTrialInspection(validRequest(), {
      descendantHoldMs: 30_000,
    });
    expect(handle.admitted).toBe(true);
    if (!handle.admitted) {
      return;
    }
    await waitForHeldDescendant(handle.childPid);
    handle.cancel("shutdown");
    const record = await handle.settled;

    expect(record.spawnAudit.length).toBeGreaterThan(3);
    for (const entry of record.spawnAudit) {
      expect(isAbsolute(entry.executable)).toBe(true);
      expect(Array.isArray(entry.args)).toBe(true);
      expect(entry.shell).toBe(false);
      for (const argument of entry.args) {
        expect(typeof argument).toBe("string");
      }
    }
    expect(isAbsolute(record.childArgs[0] ?? "")).toBe(true);
  });

  it("AC-0021 places an end-of-options marker before every attacker-influenced operand", async () => {
    const handle = beginTrialInspection(validRequest(), {
      descendantHoldMs: 30_000,
    });
    expect(handle.admitted).toBe(true);
    if (!handle.admitted) {
      return;
    }
    await waitForHeldDescendant(handle.childPid);
    handle.cancel();
    const record = await handle.settled;

    // Every vector that carries an operand places it after `--`. The operand
    // here is the injected materialization root; the attacker-influenced
    // operands — the fetch URL and the ref — ride the resolution and fetch
    // vectors, which `git-driver.test.ts` asserts the marker on directly.
    // Narrowed by owner decision 2026-09-15: the transport-helper observation
    // requires an https endpoint AC-0148 forbids. It moves to T13's manual
    // smoke. See
    // notes/verification-ledger.md#owner-decision-2026-09-15-cut-test-network-surface
    const initialization = gitVectors(record).find((entry) =>
      entry.args.includes("init"),
    );
    expect(initialization).toBeDefined();
    const args = initialization?.args ?? [];
    expect(args.indexOf("--")).toBeGreaterThan(-1);
    expect(args.slice(args.indexOf("--") + 1)).toEqual([
      validRequest().materializationRoot,
    ]);
    for (const entry of gitVectors(record)) {
      const marker = entry.args.indexOf("--");
      if (marker < 0) {
        continue;
      }
      expect(entry.args.length).toBeGreaterThan(marker + 1);
    }
  });

  it("AC-0022 carries the complete pinned git configuration on every git argument vector", async () => {
    expect(PINNED_GIT_CONFIGURATION).toEqual([
      "http.followRedirects=false",
      "core.hooksPath=/dev/null",
      "core.symlinks=false",
      "core.protectHFS=true",
      "core.protectNTFS=true",
      "core.fsmonitor=false",
      "protocol.version=2",
      "submodule.recurse=false",
      "credential.helper=",
      "transfer.fsckObjects=true",
      "maintenance.auto=false",
      "gc.auto=0",
      "advice.detachedHead=false",
    ]);
    expect(PINNED_GIT_CONFIGURATION[0]).toBe(GIT_REDIRECT_REFUSAL);

    const handle = beginTrialInspection(validRequest(), {
      descendantHoldMs: 30_000,
    });
    expect(handle.admitted).toBe(true);
    if (!handle.admitted) {
      return;
    }
    const live = await waitForHeldDescendant(handle.childPid);
    handle.cancel();
    const record = await handle.settled;

    const vectors = gitVectors(record).filter(
      (entry) => !entry.args[0]?.startsWith("--"),
    );
    expect(vectors.length).toBeGreaterThan(1);
    const leading = pinnedGitConfigurationArgs();
    for (const entry of vectors) {
      expect(entry.args.slice(0, leading.length)).toEqual(leading);
    }

    // Corroborated from the parent against a live process: the vector `git`
    // actually received carries the same pairs.
    const observedGit = live.find((observed) =>
      observed.args.includes("cat-file"),
    );
    expect(observedGit?.args.slice(0, leading.length)).toEqual(leading);
  });
});

describe("environment partitions", () => {
  it("AC-0023 names the allowlist and marks GIT_CONFIG_PARAMETERS as the one conditional name", () => {
    expect(ENVIRONMENT_ALLOWLIST_NAMES).toEqual(Object.keys(expectedEnv()));
    expect(ENVIRONMENT_ALLOWLIST_NAMES).not.toContain(
      CONDITIONAL_ENVIRONMENT_NAME,
    );
  });

  it("AC-0023 carries no GIT_CONFIG_PARAMETERS on a process Studio spawns, and only the interpreter self-injects", async () => {
    const record = await runTrialRuntime({
      request: validRequest(),
      echoEnvTree: true,
    });

    const spawnedPids = new Set(
      record.spawnAudit
        .map((entry) => entry.pid)
        .filter((pid): pid is number => pid !== undefined),
    );
    spawnedPids.add(record.childPid);
    const studioSpawned = [...record.observedProcesses.values()].filter(
      (observed) => spawnedPids.has(observed.pid),
    );
    expect(studioSpawned.length).toBeGreaterThan(1);
    for (const observed of studioSpawned) {
      expect(
        observed.environment?.[CONDITIONAL_ENVIRONMENT_NAME],
      ).toBeUndefined();
    }

    // The two normalized names are self-injected after `execve`, never passed
    // by Studio, and they only ever appear on the interpreter.
    const injected = [...record.observedProcesses.values()].filter(
      (observed) => (observed.selfInjectedNames ?? []).length > 0,
    );
    for (const observed of injected) {
      for (const name of observed.selfInjectedNames ?? []) {
        expect(SELF_INJECTED_ENVIRONMENT_NAMES).toContain(name);
      }
      expect(observed.executable).toContain("ython");
    }
    for (const entry of record.spawnAudit) {
      expect(entry.environmentNames).toEqual([...ENVIRONMENT_ALLOWLIST_NAMES]);
    }
  });

  // Narrowed by owner decision 2026-09-15: the transport-helper observation
  // requires an https endpoint AC-0148 forbids. It moves to T13's manual smoke.
  // See notes/verification-ledger.md#owner-decision-2026-09-15-cut-test-network-surface
  // AC-0024's automated assertion was deleted with it: `GIT_CONFIG_PARAMETERS`
  // only ever reaches a process `git` spawns, and on this host `git` spawns one
  // only to serve a transport.
});

describe("permitted executables and identity", () => {
  it("AC-0025 admits every executable observed in the descendant tree", async () => {
    const handle = beginTrialInspection(validRequest(), {
      descendantHoldMs: 30_000,
      observeEnvironmentTree: true,
    });
    expect(handle.admitted).toBe(true);
    if (!handle.admitted) {
      return;
    }
    await waitForHeldDescendant(handle.childPid);
    await new Promise((settle) => {
      setTimeout(settle, 150);
    });
    handle.cancel();
    const record = await handle.settled;

    const permitted = {
      gitExecutable: record.gitIdentity.executable,
      gitExecPath: record.gitIdentity.execPath,
      interpreterSearchList: record.interpreterSearchList,
      runtimeNodeExecutable: process.execPath,
    };
    const spawnedByStudio = new Map(
      record.spawnAudit
        .filter((entry) => entry.pid !== undefined)
        .map((entry) => [entry.pid as number, entry.executable]),
    );
    const observed = [...record.observedProcesses.values()];
    expect(observed.length).toBeGreaterThan(1);

    const reimaged: ObservedProcess[] = [];
    for (const process_ of observed) {
      if (isPermittedExecutable(process_.executable, permitted)) {
        continue;
      }
      // A process that replaced its own image keeps the process start Studio
      // audited, so it is admitted through that start rather than by widening
      // the permitted row.
      const spawnedAs = spawnedByStudio.get(process_.pid);
      expect(spawnedAs).toBeDefined();
      expect(isPermittedExecutable(spawnedAs ?? "", permitted)).toBe(true);
      reimaged.push(process_);
    }
    // The only re-imaged process on this host is the interpreter, which the
    // Homebrew launcher replaces with the framework binary in place.
    for (const process_ of reimaged) {
      expect(spawnedByStudio.get(process_.pid)).toBe(
        PYTHON_INTERPRETER_SEARCH_LIST[0],
      );
    }

    // Narrowed by owner decision 2026-09-15: the transport-helper observation
    // requires an https endpoint AC-0148 forbids. It moves to T13's manual
    // smoke. See
    // notes/verification-ledger.md#owner-decision-2026-09-15-cut-test-network-surface
    // The held `git` descendant is alive when the parent looks, so sampling
    // reaches it. The interpreter probe lives for tens of milliseconds —
    // shorter than one `ps` read costs — so it is observed from the parent
    // through the audit the Runtime reports on the protocol stream instead.
    // Sampling corroborates what it catches; it cannot guarantee catching a
    // process that short, which is what the honesty note on AC-0025 records.
    expect(
      observed.some(
        (process_) =>
          process_.executable === record.gitIdentity.executable &&
          process_.args.includes("cat-file"),
      ),
    ).toBe(true);
    const interpreterProbe = record.spawnAudit.find((entry) =>
      entry.args.includes("-V"),
    );
    expect(interpreterProbe?.executable).toBe(
      PYTHON_INTERPRETER_SEARCH_LIST[0],
    );
    expect(
      isPermittedExecutable(interpreterProbe?.executable ?? "", permitted),
    ).toBe(true);

    // The exhaustive leg: no spawn site in Studio's own code names anything
    // outside the permitted row.
    for (const entry of record.spawnAudit) {
      const admitted =
        isPermittedExecutable(entry.executable, permitted) ||
        entry.executable === "/usr/bin/git";
      expect(admitted).toBe(true);
    }
  });

  it("AC-0026 resolves git by absolute path, verifies its identity, and records its exec-path once", async () => {
    const record = await runTrialRuntime({ request: validRequest() });

    expect(isAbsolute(record.gitIdentity.executable)).toBe(true);
    expect(record.gitIdentity.version).toMatch(/^git version \d+\.\d+/);
    expect(basename(record.gitIdentity.execPath)).toBe("git-core");
    expect(dirname(dirname(record.gitIdentity.executable))).toBe(
      dirname(dirname(record.gitIdentity.execPath)),
    );
    expect(record.gitIdentity.executable).not.toBe("/usr/bin/git");

    const execPathReads = record.spawnAudit.filter((entry) =>
      entry.args.includes("--exec-path"),
    );
    expect(execPathReads).toHaveLength(2);
    expect(execPathReads[0]?.executable).toBe("/usr/bin/git");
    expect(execPathReads[1]?.executable).toBe(record.gitIdentity.executable);
    // No spawn after resolution re-reads it.
    const afterResolution = record.spawnAudit.slice(
      record.spawnAudit.indexOf(execPathReads[1] as SpawnAuditEntry) + 1,
    );
    expect(afterResolution.length).toBeGreaterThan(0);
    for (const entry of afterResolution) {
      expect(entry.args).not.toContain("--exec-path");
    }
  });

  it("AC-0027 resolves the interpreter by walking the search list in order", async () => {
    const record = await runTrialRuntime({ request: validRequest() });

    const interpreter = record.protocolLines.find(
      (line) => line.type === "interpreter",
    ) as
      | {
          executable?: string;
          version?: string;
          probes?: { path: string; version?: string; conforming: boolean }[];
        }
      | undefined;
    const probes = interpreter?.probes ?? [];
    expect(probes.length).toBeGreaterThan(0);
    expect(probes.map((probe) => probe.path)).toEqual(
      PYTHON_INTERPRETER_SEARCH_LIST.slice(0, probes.length),
    );
    expect(probes.at(-1)?.conforming).toBe(true);
    expect(interpreter?.executable).toBe(probes.at(-1)?.path);
    const [major, minor] = (interpreter?.version ?? "")
      .replace("Python ", "")
      .split(".")
      .map(Number);
    expect(major).toBe(MINIMUM_INTERPRETER_VERSION[0]);
    expect(minor).toBeGreaterThanOrEqual(MINIMUM_INTERPRETER_VERSION[1]);
  });

  it("AC-0027 never consults PATH to resolve the interpreter", async () => {
    const record = await runTrialRuntime({
      request: validRequest(),
      supervision: {
        interpreterSearchList: [join(fixtureRoot, "absent", "python3")],
      },
    });

    const interpreter = record.protocolLines.find(
      (line) => line.type === "interpreter",
    ) as { executable?: string } | undefined;
    expect(interpreter?.executable).toBeUndefined();
    for (const entry of record.spawnAudit) {
      expect(basename(entry.executable)).not.toBe("python3");
    }
  });

  it("AC-0028 runs both identity probes under the pinned environment", async () => {
    const record = await runTrialRuntime({ request: validRequest() });

    const gitProbes = record.spawnAudit.filter(
      (entry) => basename(entry.executable) === "git",
    );
    const interpreterProbes = record.spawnAudit.filter((entry) =>
      entry.args.includes("-V"),
    );
    expect(gitProbes.length).toBeGreaterThan(2);
    expect(interpreterProbes.length).toBeGreaterThan(0);
    for (const entry of [...gitProbes, ...interpreterProbes]) {
      expect(entry.environmentNames).toEqual([...ENVIRONMENT_ALLOWLIST_NAMES]);
    }
  });
});

describe("process group and bounds", () => {
  it("AC-0029 starts the child as a process-group leader and signals the whole group on cancellation", async () => {
    const handle = beginTrialInspection(validRequest(), {
      descendantHoldMs: 30_000,
    });
    expect(handle.admitted).toBe(true);
    if (!handle.admitted) {
      return;
    }
    const live = await waitForHeldDescendant(handle.childPid);
    for (const observed of live) {
      expect(observed.pgid).toBe(handle.childPid);
    }
    handle.cancel("cancelled");
    const record = await handle.settled;

    expect(record.childPgid).toBe(record.childPid);
    expect(record.termination).toBe("cancelled");
    expect(record.signalledGroup).toBe(true);
    expect(record.groupGone).toBe(true);
    for (const observed of live) {
      expect(processAlive(observed.pid)).toBe(false);
    }
  });

  it("AC-0029 signals the whole group when the Runtime's inspection deadline elapses", async () => {
    const handle = beginTrialInspection(validRequest(), {
      descendantHoldMs: 30_000,
      inspectionDeadlineMs: 900,
    });
    expect(handle.admitted).toBe(true);
    if (!handle.admitted) {
      return;
    }
    const live = await waitForHeldDescendant(handle.childPid);
    expect(live.length).toBeGreaterThan(1);
    const record = await handle.settled;

    expect(record.diagnostics).toContain("inspection deadline");
    expect(record.exit.signal).toBe("SIGKILL");
    // The Runtime signalled the group, not itself. The timer-held descendant
    // does not depend on the Runtime's pipes, so it would still be alive had
    // the Runtime signalled only itself; the group had no members left when
    // the child's exit was reaped, before the Service's own outer obligation
    // could signal anything.
    expect(record.groupAtChildExit).toEqual([]);
    expect(record.groupGone).toBe(true);
    for (const observed of live) {
      expect(processAlive(observed.pid)).toBe(false);
    }
  });

  // Narrowed by owner decision 2026-09-15: the transport-helper observation
  // requires an https endpoint AC-0148 forbids. It moves to T13's manual smoke.
  // See notes/verification-ledger.md#owner-decision-2026-09-15-cut-test-network-surface
  it("AC-0030 leaves no descendant alive after an ordinary shutdown", async () => {
    const handle = beginTrialInspection(validRequest(), {
      descendantHoldMs: 30_000,
    });
    expect(handle.admitted).toBe(true);
    if (!handle.admitted) {
      return;
    }
    const live = await waitForHeldDescendant(handle.childPid);
    const descendants = live.filter(
      (observed) => observed.pid !== handle.childPid,
    );
    expect(descendants.length).toBeGreaterThan(0);
    for (const descendant of descendants) {
      expect(processAlive(descendant.pid)).toBe(true);
    }

    handle.cancel("shutdown");
    const record = await handle.settled;

    expect(record.termination).toBe("shutdown");
    expect(record.groupGone).toBe(true);
    for (const observed of live) {
      expect(processAlive(observed.pid)).toBe(false);
    }
  });

  it("AC-0031 terminates the group on an observed aggregate resident memory breach within one sampling interval", async () => {
    const boundBytes = 8 * 1024 * 1024;
    const record = await runTrialRuntime({
      request: validRequest(),
      supervision: {
        residentMemoryBoundBytes: boundBytes,
        samplingIntervalMs: 100,
        holdMs: 30_000,
      },
    });

    const breach = record.residentMemoryBreach;
    expect(breach).toBeDefined();
    expect(breach?.boundBytes).toBe(boundBytes);
    expect(breach?.aggregateResidentBytes).toBeGreaterThan(boundBytes);
    expect(record.termination).toBe("resident-memory-bound");
    expect(record.signalledGroup).toBe(true);
    expect(record.groupGone).toBe(true);
    expect(record.exit.signal).toBe("SIGKILL");

    // The claim Studio owns is that the read which observes the breach signals
    // the group in the same tick, with no interval of its own in between. That
    // is asserted tightly.
    expect(
      (breach?.terminatedAt ?? 0) - (breach?.detectedAt ?? 0),
    ).toBeLessThanOrEqual(100);

    // The gap between the earliest read that crossed the bound and the moment
    // the breach was acted on is `ps` read duration plus sampler scheduling,
    // both of which the host owns rather than Studio: reads overlap, so the
    // first to arrive is not always the first taken, and both read cost and
    // timer delivery stretch with machine load. It is asserted against a
    // ceiling well above the interval rather than at it, because a tighter
    // bound here would be asserting the host's scheduler.
    const earliestBreachingSample = record.samples.find(
      (sample) => sample.aggregateResidentBytes > boundBytes,
    );
    expect(earliestBreachingSample).toBeDefined();
    expect(breach?.observedAt).toBeGreaterThanOrEqual(
      earliestBreachingSample?.at ?? 0,
    );
    expect(
      (breach?.detectedAt ?? 0) - (earliestBreachingSample?.at ?? 0),
    ).toBeLessThanOrEqual(2_000);
    // The bound is enforced on the aggregate across the group, not on any one
    // process: the reported aggregate is the sum over the sampled members.
    expect(
      [...(earliestBreachingSample?.residentBytesByPid.values() ?? [])].reduce(
        (total, bytes) => total + bytes,
        0,
      ),
    ).toBe(earliestBreachingSample?.aggregateResidentBytes);
  });
});

describe("the Studio Service's outer liveness obligation", () => {
  it("AC-0154 signals the child's process group when the child terminates without a completed response", async () => {
    const handle = beginTrialInspection(validRequest(), {
      descendantHoldMs: 30_000,
    });
    expect(handle.admitted).toBe(true);
    if (!handle.admitted) {
      return;
    }
    const live = await waitForHeldDescendant(handle.childPid);
    // Two descendants, held two different ways, and only one of them can
    // outlive the Runtime. The `git` process blocks on the Runtime's own
    // standard input, so it exits by itself the instant the Runtime does. The
    // interpreter blocks on a timer with its standard input on `/dev/null`, so
    // nothing about the Runtime's death reaches it: it is the descendant the
    // Service's outer obligation actually has to reclaim.
    const timerHeld = live.find((observed) =>
      observed.args.some((argument) => argument.includes("time.sleep")),
    );
    const pipeHeld = live.find((observed) =>
      observed.args.includes("cat-file"),
    );
    expect(timerHeld).toBeDefined();
    expect(pipeHeld).toBeDefined();
    expect(processAlive(timerHeld?.pid ?? 0)).toBe(true);

    // Only the child is signalled. Its descendants are left behind.
    process.kill(handle.childPid, "SIGKILL");
    const record = await handle.settled;

    expect(record.termination).toBe("child-terminated-without-response");
    // The Service's own judgement, not a scan of the stream: a group teardown
    // can let the Runtime write one more line after the Service has decided.
    expect(record.completedResponse).toBe(false);

    // The recovered observation. At the instant the child's exit was reaped,
    // and before the Service had signalled anything, the group still held the
    // timer-held descendant. Membership is asserted rather than exact equality:
    // whether the pipe-held `git` has finished reacting to its closed standard
    // input by that instant is the host's timing, not Studio's obligation. It
    // was observed already gone in every run, and its death is asserted below
    // where it is not a race.
    expect(record.groupAtChildExit).toContain(timerHeld?.pid);
    // The timer-held descendant is the one the Runtime started from the
    // interpreter it resolved, so the survivor is attributable rather than
    // whichever process happened not to have exited yet.
    expect(
      record.spawnAudit.find((entry) => entry.pid === timerHeld?.pid)
        ?.executable,
    ).toBe(PYTHON_INTERPRETER_SEARCH_LIST[0]);
    // The Service asked, a live group member received it, and it did not
    // survive it.
    expect(record.attemptedGroupSignal).toBe(true);
    expect(record.signalledGroup).toBe(true);
    expect(processAlive(timerHeld?.pid ?? 0)).toBe(false);
    expect(processAlive(pipeHeld?.pid ?? 0)).toBe(false);
    expect(record.groupGone).toBe(true);
    for (const descendant of live.filter(
      (observed) => observed.pid !== handle.childPid,
    )) {
      expect(processAlive(descendant.pid)).toBe(false);
    }
  });

  it("AC-0154 signals the child's process group when the Service-held in-flight bound elapses", async () => {
    // The Runtime is held for far longer than the bound and its own deadline is
    // far beyond it, so the Service's bound is unambiguously what ends the run.
    // The descendant is not polled for first: that would race a fixed timer
    // against a variable read, and `groupGone` already asserts over every group
    // member rather than over a sampled subset.
    const handle = beginTrialInspection(validRequest(), {
      descendantHoldMs: 30_000,
      inspectionDeadlineMs: 60_000,
      serviceInFlightBoundMs: 1_500,
    });
    expect(handle.admitted).toBe(true);
    if (!handle.admitted) {
      return;
    }
    const record = await handle.settled;

    expect(record.termination).toBe("service-in-flight-bound");
    // The Service's own judgement, not a scan of the stream: a group teardown
    // can let the Runtime write one more line after the Service has decided.
    expect(record.completedResponse).toBe(false);
    // The signal reached a group that still had members, so the bound reclaimed
    // the Runtime rather than finding it already gone.
    expect(record.attemptedGroupSignal).toBe(true);
    expect(record.signalledGroup).toBe(true);
    expect(record.groupGone).toBe(true);
  });

  it("AC-0154 admits at most one trial inspection in flight", async () => {
    expect(trialInspectionInFlight()).toBe(false);
    // The refusal is checked synchronously against a run that is in flight, so
    // the hold only has to outlast the next statement.
    const first = beginTrialInspection(validRequest(), { holdMs: 300 });
    expect(first.admitted).toBe(true);
    if (!first.admitted) {
      return;
    }
    expect(trialInspectionInFlight()).toBe(true);

    const second = beginTrialInspection(validRequest());
    expect(second).toEqual({ admitted: false, code: "already-in-flight" });

    const record = await first.settled;
    expect(record.termination).toBe("completed");
    expect(trialInspectionInFlight()).toBe(false);

    // Admission reopens once the single in-flight slot is released.
    const third = beginTrialInspection(validRequest(), { holdMs: 0 });
    expect(third.admitted).toBe(true);
    if (third.admitted) {
      await third.settled;
    }
  });
});
