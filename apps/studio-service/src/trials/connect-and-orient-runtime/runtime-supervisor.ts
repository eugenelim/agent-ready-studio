import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import type { CanonicalSourceIdentity } from "../../source-identity.js";
import {
  type GitIdentity,
  MINIMUM_INTERPRETER_VERSION,
  PYTHON_INTERPRETER_SEARCH_LIST,
  resolveGitIdentity,
  type SpawnAuditEntry,
} from "./executable-identity.js";
import { pinnedGitConfigurationArgs } from "./git-driver.js";
import {
  HOME_CHILD_NAME,
  MARKERLESS_RECLAIM_AGE_MS,
  MATERIALIZATION_CHILD_NAME,
  OWNERSHIP_MARKER_NAME,
  type PerRequestStateRoot,
  reserveStateRoot,
  TEMPORARY_CHILD_NAME,
} from "./per-request-state-root.js";
import {
  type GroupSample,
  type ObservedProcess,
  processGroupExists,
  sampleProcessGroup,
  sampleProcessGroupAsync,
} from "./process-tree-observer.js";
import {
  buildPinnedEnvironment,
  ENVIRONMENT_ALLOWLIST_NAMES,
} from "./runtime-environment.js";

/** The child resident memory bound from *Resource bounds*, aggregate. */
export const CHILD_RESIDENT_MEMORY_BOUND_BYTES = 1024 * 1024 * 1024;
/** The Runtime's own inspection wall-clock bound. */
export const INSPECTION_DEADLINE_MS = 120_000;
/** The Runtime's own resolution wall-clock bound, from *Resource bounds*. */
export const RESOLUTION_DEADLINE_MS = 30_000;
/** The *Materialized file count* bound the Runtime's sampler enforces. */
export const MATERIALIZED_FILE_COUNT_BOUND = 50_000;
/** The sampling interval the resident-memory bound is enforced on. */
export const SAMPLING_INTERVAL_MS = 250;
/**
 * The Service-held bound on the total in-flight window (AC-0154). The Runtime's
 * own supervised window is 30 s resolution plus 120 s inspection, so this outer
 * bound sits above it with margin and fires only when the Runtime's own
 * deadlines did not.
 */
export const SERVICE_IN_FLIGHT_BOUND_MS = 165_000;
/**
 * The interval used when the environment tree is observed. A descendant started
 * solely to report its version lives for tens of milliseconds, so the canonical
 * 250 ms sample would miss it; this is below the bound's interval, never above.
 */
export const OBSERVATION_INTERVAL_MS = 5;
/** Bounds the cost of overlapping `ps` reads at a short observation interval. */
const MAXIMUM_OVERLAPPING_READS = 8;
/**
 * How long the Runtime holds its one long-lived descendant open when the parent
 * is observing the tree. It covers many overlapping `ps` reads, which is what
 * makes the environment partition an observation rather than a race.
 */
const OBSERVED_DESCENDANT_HOLD_MS = 600;

export interface TrialRequest {
  readonly requestId: string;
  readonly identity: CanonicalSourceIdentity;
  /**
   * The fixed parent every per-request state root is created inside. AC-0071:
   * it reaches the Runtime as a **named argument on the argument vector**, not
   * inferred from `TMPDIR` or any other variable. The per-request state root
   * itself is reserved here per request and is never supplied by the caller,
   * so no component below this parent is predictable (AC-0070).
   */
  readonly sweepDomain: string;
}

export interface TrialInspectionOptions {
  /**
   * Records each descendant's argument vector and environment as the group is
   * sampled. The observer is the parent-side half of the process boundary.
   */
  readonly observeEnvironmentTree?: boolean;
  readonly samplingIntervalMs?: number;
  readonly residentMemoryBoundBytes?: number;
  readonly inspectionDeadlineMs?: number;
  readonly serviceInFlightBoundMs?: number;
  readonly interpreterSearchList?: readonly string[];
  readonly initializeMaterialization?: boolean;
  /**
   * Holds one `git` descendant open for this long, so the parent can read a
   * descendant's environment and can observe that a group signal reaches a
   * descendant and not only the child. Defaults to the observation hold when
   * the tree is being observed, and to absent otherwise.
   */
  readonly descendantHoldMs?: number;
  /** Keeps the state root on disk so a test can read it. Production never sets it. */
  readonly retainStateRoot?: boolean;
  /** Invokes the Runtime sweep of the domain. Defaults to true (AC-0082). */
  readonly sweepOnStart?: boolean;
  /** Overrides the markerless-reclaim age, so a test need not wait an hour. */
  readonly markerlessReclaimAgeMs?: number;
  /** Holds the Runtime open after its work, so the parent can signal it. */
  readonly holdMs?: number;
  readonly childEntry?: string;
  readonly resolutionDeadlineMs?: number;
  readonly fileCountBound?: number;
  readonly fileCountSamplingIntervalMs?: number;
  /**
   * Holds the resolution subprocess open, so AC-0052's deadline can be
   * observed firing. Production never sets it, on the precedent T4 and T5 set
   * for `descendantHoldMs` and `retainStateRoot`.
   */
  readonly resolutionHoldMs?: number;
  /**
   * Gives the file-count sampler a writer to race. Production never sets it;
   * the writer there is `git checkout`.
   */
  readonly materializationWriter?: {
    readonly files: number;
    readonly intervalMs: number;
  };
}

export type TerminationReason =
  | "completed"
  | "resident-memory-bound"
  | "child-terminated-without-response"
  | "service-in-flight-bound"
  | "cancelled"
  | "shutdown";

export interface ResidentMemoryBreach {
  readonly aggregateResidentBytes: number;
  readonly boundBytes: number;
  /** When the `ps` read that saw the breach was started. */
  readonly observedAt: number;
  /** When that read was ingested and the bound evaluated. */
  readonly detectedAt: number;
  /** When the group was signalled. Detection and signalling share a tick. */
  readonly terminatedAt: number;
}

export interface TrialInspectionRecord {
  readonly admitted: true;
  readonly requestId: string;
  /**
   * The per-request state root this inspection reserved, and the three children
   * the Runtime creates inside it. Reported because the caller supplies only
   * the sweep domain — the root's final component is unpredictable by design.
   */
  readonly stateRoot: PerRequestStateRoot;
  readonly servicePid: number;
  readonly childPid: number;
  readonly childPgid?: number;
  readonly environment: Record<string, string>;
  readonly gitIdentity: GitIdentity;
  readonly interpreterSearchList: readonly string[];
  readonly childArgs: readonly string[];
  readonly spawnAudit: readonly SpawnAuditEntry[];
  /**
   * Whether a completed response arrived before the Service decided to
   * terminate. It is the Service's own judgement, not a scan of the protocol
   * stream, which can carry a late line written during a group teardown.
   */
  readonly completedResponse: boolean;
  readonly protocolLines: readonly Record<string, unknown>[];
  readonly protocolStdout: string;
  readonly nonProtocolStdoutLines: readonly string[];
  readonly diagnostics: string;
  readonly observedProcesses: ReadonlyMap<number, ObservedProcess>;
  readonly observedEnvByPid: ReadonlyMap<number, Record<string, string>>;
  readonly samples: readonly GroupSample[];
  readonly termination: TerminationReason;
  /**
   * The group's live members at the instant the child's exit was reaped, read
   * before the Service signalled anything. Empty means the Runtime had already
   * cleared its own group — at its own deadline. Non-empty means only the
   * Service's outer obligation could clear it, and names which descendant
   * outlived the child, so the obligation is attributable rather than incidental.
   */
  readonly groupAtChildExit: readonly number[];
  /**
   * Whether the Service asked the operating system to signal the group. It is
   * separate from `signalledGroup` because a signal sent after the child is
   * already dead can find the group empty and fail with `ESRCH`: a descendant
   * blocked on the child's own standard input exits by itself the moment the
   * child does. The attempt is what the Service owns; delivery depends on
   * whether anything was left to receive it.
   */
  readonly attemptedGroupSignal: boolean;
  /** Whether a group signal was delivered to a group that still had members. */
  readonly signalledGroup: boolean;
  readonly groupGone: boolean;
  readonly exit: {
    readonly code: number | null;
    readonly signal: string | null;
  };
  readonly residentMemoryBreach?: ResidentMemoryBreach;
}

export interface TrialInspectionHandle {
  readonly admitted: true;
  readonly childPid: number;
  readonly settled: Promise<TrialInspectionRecord>;
  cancel(reason?: "cancelled" | "shutdown"): void;
}

export type TrialInspectionRefusal = {
  readonly admitted: false;
  readonly code: "already-in-flight" | "git-unresolved";
};

export type TrialAdmission = TrialInspectionHandle | TrialInspectionRefusal;

/**
 * The Studio Service admits at most one trial inspection in flight. That bounds
 * aggregate sweep-domain occupancy to one request root's bounds by arithmetic,
 * and it is held here rather than in the renderer because a protocol client can
 * issue concurrent requests.
 */
let inFlight: TrialInspectionHandle | undefined;

export function trialInspectionInFlight(): boolean {
  return inFlight !== undefined;
}

export function signalProcessGroup(
  pgid: number,
  signal: NodeJS.Signals,
): boolean {
  try {
    process.kill(-pgid, signal);
    return true;
  } catch {
    return false;
  }
}

function defaultChildEntry(): string {
  return fileURLToPath(new URL("./runtime-child.ts", import.meta.url));
}

async function waitForGroupToClear(
  pgid: number,
  budgetMs: number,
): Promise<boolean> {
  const deadline = Date.now() + budgetMs;
  while (Date.now() < deadline) {
    if (!processGroupExists(pgid)) {
      return true;
    }
    await new Promise((settle) => {
      setTimeout(settle, 10);
    });
  }
  return !processGroupExists(pgid);
}

export function beginTrialInspection(
  request: TrialRequest,
  options: TrialInspectionOptions = {},
): TrialAdmission {
  if (inFlight !== undefined) {
    return { admitted: false, code: "already-in-flight" };
  }

  // Reserved before the environment is built, because the pinned `HOME` and
  // `TMPDIR` name children of this root. The Runtime creates them, and writes
  // its own marker first.
  const stateRoot = reserveStateRoot(request.sweepDomain);
  const environment = buildPinnedEnvironment(stateRoot);
  const spawnAudit: SpawnAuditEntry[] = [];
  const identity = resolveGitIdentity(environment, spawnAudit);
  if (!identity.ok) {
    return { admitted: false, code: "git-unresolved" };
  }
  const gitIdentity: GitIdentity = {
    executable: identity.executable,
    execPath: identity.execPath,
    version: identity.version,
  };

  const observeEnvironmentTree = options.observeEnvironmentTree ?? false;
  const interval =
    options.samplingIntervalMs ??
    (observeEnvironmentTree ? OBSERVATION_INTERVAL_MS : SAMPLING_INTERVAL_MS);
  const boundBytes =
    options.residentMemoryBoundBytes ?? CHILD_RESIDENT_MEMORY_BOUND_BYTES;
  const interpreterSearchList =
    options.interpreterSearchList ?? PYTHON_INTERPRETER_SEARCH_LIST;
  const descendantHoldMs =
    options.descendantHoldMs ??
    (observeEnvironmentTree ? OBSERVED_DESCENDANT_HOLD_MS : undefined);

  const plan = {
    requestId: request.requestId,
    stateRoot: stateRoot.stateRoot,
    // Canonical names, delivered rather than duplicated: the child cannot
    // import a sibling module, so these keep one source of truth for the
    // layout AC-0070 and AC-0080 describe.
    ownershipMarkerName: OWNERSHIP_MARKER_NAME,
    materializationChildName: MATERIALIZATION_CHILD_NAME,
    homeChildName: HOME_CHILD_NAME,
    temporaryChildName: TEMPORARY_CHILD_NAME,
    gitExecutable: gitIdentity.executable,
    gitConfigurationArgs: pinnedGitConfigurationArgs(),
    environmentNames: [...ENVIRONMENT_ALLOWLIST_NAMES],
    interpreterSearchList: [...interpreterSearchList],
    minimumInterpreterVersion: MINIMUM_INTERPRETER_VERSION,
    initializeMaterialization: options.initializeMaterialization ?? true,
    inspectionDeadlineMs:
      options.inspectionDeadlineMs ?? INSPECTION_DEADLINE_MS,
    resolutionDeadlineMs:
      options.resolutionDeadlineMs ?? RESOLUTION_DEADLINE_MS,
    fileCountBound: options.fileCountBound ?? MATERIALIZED_FILE_COUNT_BOUND,
    fileCountSamplingIntervalMs:
      options.fileCountSamplingIntervalMs ?? SAMPLING_INTERVAL_MS,
    ...(options.resolutionHoldMs === undefined
      ? {}
      : { resolutionHoldMs: options.resolutionHoldMs }),
    ...(options.materializationWriter === undefined
      ? {}
      : { materializationWriter: options.materializationWriter }),
    markerlessReclaimAgeMs:
      options.markerlessReclaimAgeMs ?? MARKERLESS_RECLAIM_AGE_MS,
    // AC-0082: the Service invokes the sweep. It does not perform it, because
    // reclaiming a root means descending its `tree` child, and the Service
    // opens no path under a materialization root.
    sweepOnStart: options.sweepOnStart ?? true,
    ...(descendantHoldMs === undefined ? {} : { descendantHoldMs }),
    ...(options.holdMs === undefined ? {} : { holdMs: options.holdMs }),
    ...(options.retainStateRoot === undefined
      ? {}
      : { retainStateRoot: options.retainStateRoot }),
  };

  // AC-0071: the sweep domain is a *named* argument on the vector, so it is
  // read from a flag the audit can show rather than inferred from any variable.
  const childArgs = [
    options.childEntry ?? defaultChildEntry(),
    "--sweep-domain",
    request.sweepDomain,
    "--plan",
    JSON.stringify(plan),
  ];
  const child = spawn(process.execPath, childArgs, {
    cwd: stateRoot.stateRoot,
    env: environment,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const childPid = child.pid ?? -1;

  const protocolLines: Record<string, unknown>[] = [];
  const nonProtocolStdoutLines: string[] = [];
  const samples: GroupSample[] = [];
  const observedProcesses = new Map<number, ObservedProcess>();
  const observedEnvByPid = new Map<number, Record<string, string>>();
  // Both `git` and the Homebrew `python3` launcher replace their own image with
  // `execve`, which rewrites the argument and environment area `ps -E` reads.
  // A read landing inside that rewrite returns it half-formed, so an
  // observation is kept only once two reads agree on it. That rejects such a
  // read without assuming anything about what a correct one should contain.
  const unconfirmed = new Map<number, string>();
  let protocolStdout = "";
  let diagnostics = "";
  let stdoutTail = "";
  let termination: TerminationReason | undefined;
  let attemptedGroupSignal = false;
  let signalledGroup = false;
  let childPgid: number | undefined;
  let residentMemoryBreach: ResidentMemoryBreach | undefined;
  let completedResponse = false;

  function signalGroup(signal: NodeJS.Signals): void {
    attemptedGroupSignal = true;
    signalledGroup = signalProcessGroup(childPid, signal) || signalledGroup;
  }

  function consumeStdout(chunk: string): void {
    protocolStdout += chunk;
    stdoutTail += chunk;
    const lines = stdoutTail.split("\n");
    stdoutTail = lines.pop() ?? "";
    for (const line of lines) {
      if (line === "") {
        continue;
      }
      try {
        protocolLines.push(JSON.parse(line) as Record<string, unknown>);
      } catch {
        nonProtocolStdoutLines.push(line);
      }
    }
    // A `completed` line that arrives after the Service has already decided to
    // terminate is not a completed response. `process.kill(-pgid, ...)` does
    // not fix the order members are torn down in, so the Runtime can be woken
    // by a descendant's death and write one more line before its own kill
    // lands. Trusting that line would let a terminated run report success.
    if (termination === undefined) {
      completedResponse = protocolLines.some(
        (message) => message.type === "completed",
      );
    }
  }

  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    consumeStdout(chunk);
  });
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk: string) => {
    diagnostics += chunk;
  });

  const exited = new Promise<{ code: number | null; signal: string | null }>(
    (settle) => {
      child.on("exit", (code, signal) => {
        settle({ code, signal });
      });
    },
  );

  function ingest(sample: GroupSample): void {
    samples.push(sample);
    for (const observed of sample.processes) {
      if (observed.pid === childPid) {
        childPgid = observed.pgid;
      }
      if (observed.defunct || observed.torn) {
        continue;
      }
      if (observedProcesses.has(observed.pid)) {
        continue;
      }
      // Resident memory moves between reads, so only the command and the
      // environment — what a torn read corrupts — are compared.
      const shape = JSON.stringify([
        observed.executable,
        observed.args,
        observed.environment ?? null,
        observed.selfInjectedNames ?? null,
      ]);
      if (unconfirmed.get(observed.pid) !== shape) {
        unconfirmed.set(observed.pid, shape);
        continue;
      }
      observedProcesses.set(observed.pid, observed);
      if (observed.environment !== undefined) {
        observedEnvByPid.set(observed.pid, observed.environment);
      }
    }
    if (
      residentMemoryBreach === undefined &&
      sample.processes.length > 0 &&
      sample.aggregateResidentBytes > boundBytes
    ) {
      const detectedAt = Date.now();
      termination ??= "resident-memory-bound";
      signalGroup("SIGKILL");
      residentMemoryBreach = {
        aggregateResidentBytes: sample.aggregateResidentBytes,
        boundBytes,
        observedAt: sample.at,
        detectedAt,
        terminatedAt: Date.now(),
      };
    }
  }

  // The group is sampled once immediately, so a request that settles inside
  // one interval still records its process identifiers. Later reads overlap:
  // one `ps` costs longer than a version probe lives, so a sampler that waited
  // for each read could not reach the requested interval.
  ingest(sampleProcessGroup(childPid, observeEnvironmentTree));
  let readsInFlight = 0;
  const sampler = setInterval(() => {
    if (readsInFlight >= MAXIMUM_OVERLAPPING_READS) {
      return;
    }
    readsInFlight += 1;
    void sampleProcessGroupAsync(childPid, observeEnvironmentTree).then(
      (sample) => {
        readsInFlight -= 1;
        ingest(sample);
      },
    );
  }, interval);

  const inFlightBound = setTimeout(() => {
    if (termination !== undefined) {
      return;
    }
    termination = "service-in-flight-bound";
    signalGroup("SIGKILL");
  }, options.serviceInFlightBoundMs ?? SERVICE_IN_FLIGHT_BOUND_MS);

  function cancel(reason: "cancelled" | "shutdown" = "cancelled"): void {
    if (termination !== undefined) {
      return;
    }
    termination = reason;
    signalGroup("SIGTERM");
  }

  const settled = (async (): Promise<TrialInspectionRecord> => {
    const exit = await exited;
    const groupAtChildExit = sampleProcessGroup(childPid, false)
      .processes.filter((observed) => !observed.defunct)
      .map((observed) => observed.pid);
    if (stdoutTail !== "") {
      consumeStdout("\n");
    }
    clearTimeout(inFlightBound);

    // AC-0154, first trigger: the child is gone without a completed response,
    // so the Service signals the group rather than leaving a descendant to
    // outlive the supervisor that bounded it.
    if (!completedResponse) {
      termination ??= "child-terminated-without-response";
    } else {
      termination ??= "completed";
    }
    if (termination !== "completed") {
      signalGroup("SIGKILL");
    }
    const groupGone = await waitForGroupToClear(childPid, 2_000);
    clearInterval(sampler);
    inFlight = undefined;

    return {
      admitted: true,
      requestId: request.requestId,
      stateRoot,
      servicePid: process.pid,
      childPid,
      ...(childPgid === undefined ? {} : { childPgid }),
      environment,
      gitIdentity,
      interpreterSearchList,
      childArgs,
      spawnAudit: [...spawnAudit, ...childSpawnAudit(protocolLines)],
      completedResponse,
      protocolLines,
      protocolStdout,
      nonProtocolStdoutLines,
      diagnostics,
      observedProcesses,
      observedEnvByPid,
      samples: samples.toSorted((left, right) => left.at - right.at),
      termination,
      groupAtChildExit,
      attemptedGroupSignal,
      signalledGroup,
      groupGone,
      exit,
      ...(residentMemoryBreach === undefined ? {} : { residentMemoryBreach }),
    };
  })();

  const handle: TrialInspectionHandle = {
    admitted: true,
    childPid,
    settled,
    cancel,
  };
  inFlight = handle;
  return handle;
}

/**
 * The Runtime reports each process start on the protocol stream as it happens,
 * so the audit is complete up to the moment the group was signalled rather than
 * lost when a phase is cut short.
 */
function childSpawnAudit(
  protocolLines: readonly Record<string, unknown>[],
): SpawnAuditEntry[] {
  return protocolLines
    .filter((line) => line.type === "spawn")
    .map((line) => (line as { entry: SpawnAuditEntry }).entry);
}

export async function startTrialInspection(
  request: TrialRequest,
  options: TrialInspectionOptions = {},
): Promise<TrialInspectionRecord | TrialInspectionRefusal> {
  const admission = beginTrialInspection(request, options);
  if (!admission.admitted) {
    return admission;
  }
  return await admission.settled;
}
