/**
 * The composition every other module in this slice was built for.
 *
 * Until this existed the pieces were each unit-tested and nothing assembled
 * them: `canonicalizeSource`, `resolveRevision`, `materializeRevision`,
 * `locateTrustedInspector` and `deriveVerdict` had zero production callers
 * between them, so a submitted URL reached no inspection and the connect
 * surface could not work. That gap is recorded at
 * `notes/verification-ledger.md#retraction-2026-09-19-t12-t13-delivery-claims`.
 *
 * The shape is dictated by the dispatch being synchronous while an inspection
 * is not. `connect` performs the refusal check inline -- a refused URL is a
 * complete answer and needs no inspection -- then registers an accepted one,
 * starts the pipeline in the background and returns `resolving` immediately.
 * `get` reads the store; `cancel` stops the run.
 */
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { StopReasonKey, StudioResult } from "@agent-ready/protocol";
import { project } from "@agent-ready/protocol";
import type { Storage } from "@agent-ready/storage-sqlite";
import { persistConnectedSource } from "./connected-source.js";
import type { CanonicalSourceIdentity } from "./source-identity.js";
import { buildFetchUrl, canonicalizeSource } from "./source-identity.js";
import type { Provenance } from "./trial-result.js";
import {
  deriveCondition,
  deriveVerdict,
  mintRequestIdentifier,
} from "./trial-result.js";
import { resolveGitIdentity } from "./trials/connect-and-orient-runtime/executable-identity.js";
import {
  createGitTransport,
  type GitCommandRunner,
  type RevisionTransport,
  resolveRevision,
} from "./trials/connect-and-orient-runtime/git-driver.js";
import {
  beginTrialInspection,
  signalProcessGroup,
} from "./trials/connect-and-orient-runtime/runtime-supervisor.js";

const execFileAsync = promisify(execFile);

/** git is absent or unusable on this host, which is a Studio-side condition. */
export class GitUnavailableError extends Error {
  constructor(readonly code: string) {
    super(`git could not be identified on this host: ${code}`);
    this.name = "GitUnavailableError";
  }
}

export type SourceInspection = StudioResult<"source.get">;

/** What the Runtime reports back about one inspection. */
export type InspectionOutcome =
  | {
      readonly ok: true;
      readonly completed: boolean;
      readonly workspacePresent: boolean | undefined;
      readonly invalidWorkspace: boolean;
      readonly inspectorContractVersion?: string | null;
      readonly diagnostics: string;
    }
  | {
      readonly ok: false;
      readonly condition:
        | "inspector-unavailable"
        | "inspection-stopped"
        | "incomplete";
      readonly diagnostics: string;
      /**
       * Which reason stopped it. AC-0091 and AC-0092 take attribution and
       * retryability **per reason** for `inspection-stopped`, so the condition
       * alone cannot answer them -- a network timeout must not be attributed
       * to the repository, which is the crossing AC-0093 forbids.
       */
      readonly stopReason?: StopReasonKey | null;
      /** AC-0097: what the transport reported, where it reported one. */
      readonly waitWindow?: string | null;
    };

export interface InspectionRequest {
  readonly identity: CanonicalSourceIdentity;
  readonly sweepDomain: string;
  readonly revision: {
    readonly fetchUrl: string;
    readonly resolvedSha: string;
  };
  /**
   * Aborted when the lead cancels. AC-0084 requires the Service to terminate
   * the in-flight Runtime; recording `cancelled` without this left the child
   * running to its own deadline, holding its process group and its
   * materialization root after the lead had been told it stopped.
   */
  readonly signal: AbortSignal;
}

/**
 * Where a terminal inspection is written so it survives a restart, and where
 * `get` reads from when the in-memory store has nothing. Optional so a service
 * created without storage still composes; supplied in production.
 */
export interface SourceInspectionStore {
  readonly persist: (record: SourceInspection) => void;
  readonly read: (sourceId: string) => SourceInspection | undefined;
}

export interface SourceInspectionDependencies {
  /** Injected so tests compose the pipeline without reaching a remote. */
  readonly transport: RevisionTransport;
  /**
   * Runs the inspection in the Runtime. Injected for the same reason, and kept
   * behind a seam so this module never materializes a tree itself.
   */
  readonly inspect: (request: InspectionRequest) => Promise<InspectionOutcome>;
  /** Where materialization roots are created. */
  readonly materializationParent?: string;
  readonly idFactory?: () => string;
  readonly now?: () => string;
  readonly store?: SourceInspectionStore;
}

/** A pipeline run, so `cancel` can stop one that is still going. */
interface Run {
  cancelled: boolean;
  readonly cleanup: (() => void)[];
  readonly abort: AbortController;
}

function base(
  sourceId: string,
  owner: string,
  repository: string,
): SourceInspection {
  return {
    kind: "source-inspection",
    sourceId,
    phase: null,
    verdict: null,
    condition: "ok",
    versionUnverified: false,
    owner,
    repository,
    requestedRef: null,
    resolvedSha: null,
    inspectedAt: null,
    declaredVersionMarker: null,
    inspectorContractVersion: null,
    diagnostics: "",
    stopReason: null,
    waitWindow: null,
    secondaryDiagnostic: null,
  };
}

export function createSourceInspections(
  dependencies: SourceInspectionDependencies,
) {
  const store = new Map<string, SourceInspection>();
  const runs = new Map<string, Run>();
  const mintId = dependencies.idFactory ?? (() => `source-${randomUUID()}`);
  const clock = dependencies.now ?? (() => new Date().toISOString());
  const parent = dependencies.materializationParent ?? tmpdir();

  const put = (next: SourceInspection): SourceInspection => {
    // A cancelled run must not overwrite the `cancelled` state it was stopped
    // into. Without this the pipeline's next step reports progress after the
    // lead has already been told it stopped.
    const run = runs.get(next.sourceId);
    if (run?.cancelled) return store.get(next.sourceId) ?? next;
    store.set(next.sourceId, next);
    // Written through in both states, for different reasons. A terminal
    // result answers AC-0100 to AC-0104 after a restart. An **in-flight** one
    // is what makes AC-0085 reachable at all: `reconcileAfterRestart` moves an
    // interrupted source to `incomplete`, and it can only move a source that
    // was recorded. An earlier version wrote only terminal results, so the
    // reconciliation had nothing to find and an interrupted inspection
    // vanished -- `source.get` answered "not found" rather than "Interrupted
    // by restart".
    // A refused URL is not a connected source: it never had an owner or a
    // repository, so persisting it writes an identity-less row -- and a second
    // refusal then collides with the first on the identity unique key, which
    // surfaced to the lead as an internal error on their second bad URL.
    if (next.phase !== "url-rejected") dependencies.store?.persist(next);
    return next;
  };

  async function pipeline(
    sourceId: string,
    url: string,
    requestedRef?: string,
  ) {
    const run = runs.get(sourceId);
    const current = () => store.get(sourceId) as SourceInspection;
    try {
      const identity = canonicalizeSource(url, requestedRef);
      if (!identity.ok) return; // Refused inline by `connect`; unreachable here.

      const resolution = await resolveRevision(
        identity.identity,
        dependencies.transport,
        requestedRef,
      );
      if (run?.cancelled) return;
      if (!resolution.ok) {
        put({
          ...current(),
          phase: null,
          verdict: "no-verdict",
          condition: "source-unavailable",
          diagnostics: `the remote reference could not be resolved: ${resolution.code}`,
        });
        return;
      }

      put({
        ...current(),
        phase: "inspecting",
        resolvedSha: resolution.resolvedSha,
        requestedRef: resolution.requestedRef ?? null,
      });

      // Materialization happens inside the Runtime, never here. The tree is
      // untrusted content, and the Service writing it would falsify the one
      // isolation claim the process boundary exists to make.
      const sweepDomain = mkdtempSync(join(parent, "connect-orient-sweep-"));
      run?.cleanup.push(() =>
        rmSync(sweepDomain, { recursive: true, force: true }),
      );
      const inspected = await dependencies.inspect({
        identity: identity.identity,
        sweepDomain,
        revision: {
          fetchUrl: buildFetchUrl(identity.identity),
          resolvedSha: resolution.resolvedSha,
        },
        signal: run?.abort.signal ?? new AbortController().signal,
      });
      if (run?.cancelled) return;

      if (!inspected.ok) {
        // The projection is what turns a state and a reason into the four
        // sentences a degraded result owes the lead. Carrying the reason and
        // the wait window here is what lets the surface show them at all.
        const projected = project({
          state: inspected.condition,
          ...(inspected.stopReason == null
            ? {}
            : { reason: inspected.stopReason }),
          ...(inspected.waitWindow === undefined
            ? {}
            : { waitWindow: inspected.waitWindow }),
        });
        put({
          ...current(),
          phase: null,
          verdict: "no-verdict",
          condition: inspected.condition,
          inspectedAt: clock(),
          diagnostics: inspected.diagnostics,
          stopReason: inspected.stopReason ?? null,
          waitWindow: projected.waitWindow ?? null,
          secondaryDiagnostic: projected.secondaryDiagnostic ?? null,
        });
        return;
      }

      // The verdict comes only from trusted inspector output. Nothing here
      // reads the tree: AC-0061 forbids deriving a verdict from Studio's own
      // reading, so an inspection that produced no trusted output is
      // `no-verdict` with the condition that says why.
      put({
        ...current(),
        phase: null,
        verdict: deriveVerdict(
          inspected.workspacePresent,
          inspected.invalidWorkspace,
          inspected.completed,
        ),
        condition: deriveCondition(inspected.invalidWorkspace),
        inspectedAt: clock(),
        inspectorContractVersion: inspected.inspectorContractVersion ?? null,
        diagnostics: inspected.diagnostics,
      });
    } catch (cause) {
      if (run?.cancelled) return;
      put({
        ...current(),
        phase: null,
        verdict: "no-verdict",
        condition: "inspection-stopped",
        diagnostics: `the inspection stopped: ${String(cause)}`,
      });
    } finally {
      for (const undo of run?.cleanup ?? []) undo();
    }
  }

  return {
    connect(url: string, requestedRef?: string): SourceInspection {
      const identity = canonicalizeSource(url, requestedRef);
      const sourceId = mintId();
      if (!identity.ok) {
        // A refusal is a complete answer. No inspection starts, and the reason
        // is the service's own wording for the cause -- AC-0108's mapping.
        return put({
          ...base(sourceId, "", ""),
          phase: "url-rejected",
          diagnostics: identity.reason,
        });
      }
      const started = put({
        ...base(
          sourceId,
          identity.identity.owner,
          identity.identity.repository,
        ),
        phase: "resolving",
        requestedRef: requestedRef ?? null,
      });
      runs.set(sourceId, {
        cancelled: false,
        cleanup: [],
        abort: new AbortController(),
      });
      void pipeline(sourceId, url, requestedRef);
      return started;
    },

    get(sourceId: string): SourceInspection | undefined {
      // Memory first, then storage. After a restart the map is empty and the
      // last result is still readable, which is the whole of AC-0100 to
      // AC-0102 from the lead's side.
      return store.get(sourceId) ?? dependencies.store?.read(sourceId);
    },

    cancel(sourceId: string): SourceInspection | undefined {
      const held = store.get(sourceId) ?? dependencies.store?.read(sourceId);
      if (held === undefined) return undefined;
      // A settled result is not cancellable. Before the storage fallback
      // existed, cancelling after a restart found nothing and returned "not
      // found"; with it, an unguarded cancel would overwrite a completed
      // verdict with `no-verdict`/`cancelled` and persist that -- destroying a
      // result the lead already has, durably, on a button they pressed
      // expecting it to stop something still running.
      if (held.phase === null) return held;
      const run = runs.get(sourceId);
      if (run !== undefined) {
        run.cancelled = true;
        // Stops the Runtime rather than only recording that the lead did.
        run.abort.abort();
      }
      const cancelled: SourceInspection = {
        ...held,
        phase: null,
        verdict: "no-verdict",
        condition: "cancelled",
      };
      store.set(sourceId, cancelled);
      dependencies.store?.persist(cancelled);
      return cancelled;
    },
  };
}

export type SourceInspections = ReturnType<typeof createSourceInspections>;

/**
 * The SQLite-backed store. The bound AC-0104 sets is enforced by
 * `persistConnectedSource` before the write, so a breaching result leaves the
 * prior record whole rather than half-replaced -- and a refusal is recorded as
 * a diagnostic rather than silently dropping the result.
 */
export function createStorageStore(storage: Storage): SourceInspectionStore {
  return {
    persist(record) {
      try {
        persistOrReport(record);
      } catch (cause) {
        // A store write must not take the service down. The pipeline runs in
        // the background, so a throw here is an unhandled rejection rather
        // than a request failure -- a shut database during shutdown is enough
        // to produce one, and losing the process loses every other inspection
        // too.
        process.stderr.write(
          `connected source ${record.sourceId} could not be written: ${String(cause)}\n`,
        );
      }
    },
    read(sourceId) {
      try {
        return readOrUndefined(sourceId);
      } catch {
        return undefined;
      }
    },
  };

  function persistOrReport(record: SourceInspection): void {
    const outcome = persistConnectedSource(storage, {
      id: record.sourceId,
      owner: record.owner,
      repository: record.repository,
      requestedRef: record.requestedRef,
      resolvedSha: record.resolvedSha,
      inspectedAt: record.inspectedAt,
      verdict: record.verdict,
      // An in-flight source records its **phase** here, because that is the
      // column `reconcileAfterRestart` reads and a phase is what an
      // interrupted inspection was in. A terminal one records its condition.
      condition: record.phase ?? record.condition,
      versionUnverified: record.versionUnverified,
      diagnostics: record.diagnostics,
      declaredVersionMarker: record.declaredVersionMarker,
      inspectorContractVersion: record.inspectorContractVersion,
      // The provenance each value actually has, matching what
      // `normalizeTrialResult` marks. This is what AC-0104's bound is
      // computed over: `repositoryDerivedValues` selects exactly the
      // `repository-derived` fields, so marking everything with a string
      // outside the `Provenance` union -- as an earlier version did with
      // "non-originated" -- measured zero bytes and made the 256 KiB check
      // unable to trip. `provenance` is typed `Record<string, string>`, so
      // the compiler did not catch it.
      provenance: {
        diagnostics: "repository-derived",
        declaredVersionMarker: "repository-derived",
        resolvedSha: "transport-reported",
        inspectorContractVersion: "inspector-authored",
      } satisfies Record<string, Provenance>,
    });
    if (!outcome.ok) {
      // AC-0104's refusal is observable rather than silent: the prior record
      // stands and the reason is on the diagnostic stream.
      process.stderr.write(
        `connected source ${record.sourceId} not persisted: ${outcome.diagnostic}\n`,
      );
    }
  }

  function readOrUndefined(sourceId: string): SourceInspection | undefined {
    const held = storage.getConnectedSource(sourceId);
    if (held === null) return undefined;
    return {
      kind: "source-inspection",
      sourceId: held.id,
      phase: null,
      verdict: held.verdict as SourceInspection["verdict"],
      condition: held.condition as SourceInspection["condition"],
      versionUnverified: held.versionUnverified,
      owner: held.owner,
      repository: held.repository,
      requestedRef: held.requestedRef,
      resolvedSha: held.resolvedSha,
      inspectedAt: held.inspectedAt,
      declaredVersionMarker: held.declaredVersionMarker,
      inspectorContractVersion: held.inspectorContractVersion,
      diagnostics: held.diagnostics,
      // Not persisted: the stored record has no column for these, so a
      // restored result carries the verdict and its diagnostics but not the
      // stop reason. Named here rather than left to look complete.
      stopReason: null,
      waitWindow: null,
      secondaryDiagnostic: null,
    };
  }
}

/**
 * The production inspection: start the Runtime with the revision to
 * materialize and read what it reports. The Service never writes the tree.
 */
export async function inspectInRuntime(
  request: InspectionRequest,
): Promise<InspectionOutcome> {
  if (request.signal.aborted) {
    return {
      ok: false,
      condition: "incomplete",
      diagnostics: "the inspection was cancelled before the Runtime started",
    };
  }
  const admission = beginTrialInspection(
    {
      requestId: mintRequestIdentifier(),
      identity: request.identity,
      sweepDomain: request.sweepDomain,
    },
    { revision: request.revision },
  );
  if (!admission.admitted) {
    return {
      ok: false,
      condition: "inspection-stopped",
      diagnostics: `the Runtime refused the inspection: ${admission.code}`,
    };
  }

  // The cancel path. Signalling the group is what actually stops the work:
  // the child is a process-group leader, so this reaches the transport and
  // every helper it spawned, not just the child itself.
  const stop = () => {
    if (admission.childPid > 0) {
      signalProcessGroup(admission.childPid, "SIGTERM");
    }
  };
  request.signal.addEventListener("abort", stop, { once: true });

  let record: Awaited<typeof admission.settled>;
  try {
    record = await admission.settled;
  } finally {
    request.signal.removeEventListener("abort", stop);
  }

  if (request.signal.aborted) {
    return {
      ok: false,
      condition: "incomplete",
      diagnostics: "the Runtime was stopped before it finished",
    };
  }
  const lines = (record as unknown as { protocolLines?: { type: string }[] })
    .protocolLines;
  const materialized = (lines ?? []).find(
    (line) => line.type === "materialized",
  ) as { status?: number; mismatch?: string } | undefined;
  if (materialized === undefined || materialized.status !== 0) {
    return {
      ok: false,
      condition: "inspection-stopped",
      diagnostics:
        materialized?.mismatch === "head-mismatch"
          ? "the downloaded copy did not match the commit Studio asked for"
          : materialized?.mismatch === "head-unreadable"
            ? "Studio could not read what was checked out, so it did not verify the commit"
            : "the Runtime did not materialize the revision",
    };
  }

  // The Runtime materialized the tree but ran no trusted inspector, so no
  // trusted output exists to derive a verdict from. Saying so is the honest
  // answer; deriving one from Studio's own reading is what AC-0061 forbids.
  return {
    ok: false,
    condition: "inspector-unavailable",
    diagnostics:
      "the revision was materialized, and no trusted inspector ran against it",
  };
}

/**
 * The transport the service uses in production: the resolved git, run under the
 * pinned configuration the driver supplies, with output captured. Tests inject
 * their own transport instead, so no test reaches a remote.
 */
export function createDefaultTransport(): RevisionTransport {
  const environment: Record<string, string> = {
    // Wide enough to find git where supported hosts put it. Pinning this to
    // two directories made the first submission fail with an internal error on
    // any host with git at /usr/local/bin or /opt/homebrew/bin -- a
    // configuration problem surfacing as Studio blaming itself.
    PATH: "/usr/bin:/bin:/usr/local/bin:/opt/homebrew/bin",
    HOME: "/nonexistent",
    GIT_TERMINAL_PROMPT: "0",
    GIT_ASKPASS: "",
    SSH_ASKPASS: "",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_SYSTEM: "/dev/null",
  };
  const identity = resolveGitIdentity(environment, []);
  if (!identity.ok) {
    // Named rather than thrown as an opaque internal error: the lead can act
    // on "Studio cannot inspect", and cannot act on -32603.
    throw new GitUnavailableError(identity.code);
  }
  const run: GitCommandRunner = async ({ executable, args, cwd }) => {
    const { stdout, stderr } = await execFileAsync(executable, [...args], {
      cwd,
      // A closed environment: the transport must not inherit the operator's
      // git configuration or any credential helper they have configured.
      env: environment,
      maxBuffer: 8 * 1024 * 1024,
    });
    return { stdout, stderr, status: 0 };
  };
  return createGitTransport(identity.executable, run);
}
