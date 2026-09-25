/**
 * The composition every other module in this slice was built for.
 *
 * Until this existed the pieces were each unit-tested and nothing assembled
 * them: `canonicalizeSource`, `resolveRevision`, `materializeRevision`,
 * `locateTrustedInspector` and `deriveVerdict` had zero production callers
 * between them, so a submitted URL reached no inspection and the connect
 * surface could not work. That gap is recorded at
 * `notes/verification-ledger.md#retraction-2026-09-19-t12-t13-delivery-claims`.
 * Of that list, `materializeRevision` was deleted rather than wired --
 * materialization belongs to the Runtime child -- and `locateTrustedInspector`
 * is still uncalled, which is the inspector slice's work.
 *
 * The shape is dictated by the dispatch being synchronous while an inspection
 * is not. `connect` performs the refusal check inline -- a refused URL is a
 * complete answer and needs no inspection -- then registers an accepted one,
 * starts the pipeline in the background and returns `resolving` immediately.
 * `get` reads the store; `cancel` stops the run.
 */
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { StopReasonKey, StudioResult } from "@agent-ready/protocol";
import { project, STOP_REASONS } from "@agent-ready/protocol";
import type { Storage } from "@agent-ready/storage-sqlite";
import { persistConnectedSource } from "./connected-source.js";
import type { CanonicalSourceIdentity } from "./source-identity.js";
import { buildFetchUrl, canonicalizeSource } from "./source-identity.js";
import type { NormalizedTrialResult, Provenance } from "./trial-result.js";
import {
  deriveCondition,
  deriveVerdict,
  mintRequestIdentifier,
  normalizeTrialResult,
  TRIAL_CONTRACT,
} from "./trial-result.js";
import {
  MINIMUM_INTERPRETER_VERSION,
  resolveGitIdentity,
} from "./trials/connect-and-orient-runtime/executable-identity.js";
import {
  createGitTransport,
  type GitCommandRunner,
  type RevisionTransport,
  resolveRevision,
} from "./trials/connect-and-orient-runtime/git-driver.js";
import {
  type InterpreterProbe,
  locateTrustedInspector,
  PACK_STATE_RELATIVE_PATH,
  selectConformingInterpreter,
} from "./trials/connect-and-orient-runtime/inspector-locator.js";
import {
  beginTrialInspection,
  type DeclaredReadReport,
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
      /**
       * **No `result` here, deliberately.** Nothing in this slice returns
       * `ok: true`: a verdict needs trusted inspector output and no inspector
       * runs, so a field on this branch could carry nothing and be bound by
       * nothing. The slice that runs an inspector
       * (`connect-orient-no-inspector-runs`) adds it here, with the case that
       * drives it -- and until then its absence is what says so.
       */
    }
  | {
      readonly ok: false;
      /**
       * The validated trial result, where one was admitted. It rides on the
       * `false` branch because `ok` answers "did the inspection reach a
       * verdict", and a result can be complete and valid while the answer is
       * still no -- which is exactly this slice. AC-0038's five reported
       * elements live here; only the two the `source.get` projection has
       * columns for travel further.
       */
      readonly result?: NormalizedTrialResult;
      /**
       * Which of three things an absent declared marker means. It rides beside
       * the result, not inside it: `declaredVersionMarker` is the Runtime's
       * report, and this is Studio's reading of whether that report could be
       * made at all. Before this field existed, a marker Studio could not read
       * was reported as a repository that declares nothing -- a falsehood
       * about the repository, stated in Studio's own voice.
       */
      readonly declaredVersionState?: "declared" | "absent" | "unreadable";
      /**
       * AC-0043. The inspector Studio located, where it located one. Null
       * where the walk turned nothing up; the diagnostic beside it says which
       * of the reasons in `inspectorDiagnostic` applied.
       */
      readonly inspector?: {
        readonly resolvedPath: string;
        readonly packName: string;
        readonly packVersion: string;
        readonly fileDigests: Record<string, string>;
      } | null;
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
  /** The pipeline's own promise. Set immediately after the pipeline starts. */
  promise?: Promise<void>;
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
    // No declaration has been read yet. `absent` means the declaration was
    // read and names no marker; `unreadable` means nothing was determined.
    declaredVersionState: "unreadable",
    inspector: null,
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
          // AC-0038 and AC-0065. What the repository declared is an observed
          // value, so it survives a degraded outcome; the qualifier follows
          // it whatever the verdict and whatever the condition. A run that
          // reached no valid result reports neither.
          declaredVersionMarker:
            inspected.result?.declaredVersionMarker.value ?? null,
          // The state travels even where the marker does not. A run that
          // reached no valid result determined nothing, so it reports
          // `unreadable` rather than claiming the repository declares none.
          declaredVersionState: inspected.declaredVersionState ?? "unreadable",
          inspector: inspected.inspector ?? null,
          versionUnverified: inspected.result?.versionUnverified ?? false,
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
        // No producer reaches this branch yet -- see the note on the `ok:
        // true` variant -- so no declaration has been read and nothing is
        // known about what the repository declares. `unreadable` is the
        // not-determined value; `absent` would assert a read happened.
        declaredVersionState: "unreadable",
        inspector: null,
        // The declared marker and its qualifier are not copied here, because
        // no producer reaches this branch yet. The inspector slice adds both
        // alongside the field it adds there.
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
      const run: Run = {
        cancelled: false,
        cleanup: [],
        abort: new AbortController(),
      };
      runs.set(sourceId, run);
      // pipeline() runs synchronously to its first await, at which point it
      // has already read runs.get(sourceId). Assigning the promise afterward
      // is safe: the test path only reads it after connect() returns.
      run.promise = pipeline(sourceId, url, requestedRef);
      return started;
    },

    /** The pipeline promise for the named source, for deterministic awaiting. */
    runFor(sourceId: string): Promise<void> {
      return runs.get(sourceId)?.promise ?? Promise.resolve();
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
      declaredVersionState: record.declaredVersionState,
      inspector: record.inspector,
      inspectorContractVersion: record.inspectorContractVersion,
      provenance: PERSISTED_PROVENANCE,
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
      declaredVersionState:
        held.declaredVersionState as SourceInspection["declaredVersionState"],
      inspector: held.inspector,
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
 * AC-0039 and AC-0040 at the storage boundary: the provenance each persisted
 * value actually has, matching what `normalizeTrialResult` marks. AC-0104's
 * bound is computed over it -- `repositoryDerivedValues` selects exactly the
 * `repository-derived` fields, so marking everything with a string outside the
 * `Provenance` union, as an earlier version did with "non-originated",
 * measured zero bytes and made the 256 KiB check unable to trip. `provenance`
 * is typed `Record<string, string>` at the call site, so the compiler did not
 * catch it.
 *
 * Exported so a test can pin it against the markers the normalizer assigns.
 * The two are separate objects -- the record crossing this boundary is a
 * `SourceInspection`, which carries no markers of its own -- and pinning them
 * is what stops them drifting apart.
 */
export const PERSISTED_PROVENANCE = {
  diagnostics: "repository-derived",
  declaredVersionMarker: "repository-derived",
  resolvedSha: "transport-reported",
  inspectorContractVersion: "inspector-authored",
} as const satisfies Record<string, Provenance>;

/**
 * AC-0059. A declared-value read or parse that refused becomes
 * `inspection-stopped`, carrying the reason and attribution the *Reasons for
 * `inspection-stopped`* table assigns. `parse-failure-declaration-file`
 * already holds that row's exact reason and attribution, so this maps onto
 * existing vocabulary rather than introducing any.
 *
 * Two cases deliberately do not route here.
 *
 * An absent declaration file is not a refusal. A repository that declares
 * nothing is AC-0064's case, and stopping the inspection over it would report
 * a failure the tree does not describe.
 *
 * A refused `workspace.toml` is not this row either, which is why only reads
 * flagged `routesToDeclarationFileStop` are scanned. `WORKSPACE_DECLARATION_NAME`
 * in `declared-value-reader.ts` holds the canonical statement of that carve-out.
 *
 * Extracted from `inspectInRuntime` so the mapping is reachable by a test:
 * that function needs a real revision to fetch, and this repository keeps no
 * test network surface.
 */
export function declaredRefusalOutcome(
  declared: DeclaredReadReport | undefined,
): InspectionOutcome | undefined {
  if (declared === undefined) {
    return undefined;
  }
  const refused = declared.reads.find(
    (read) =>
      read.refusal !== undefined && read.routesToDeclarationFileStop === true,
  );
  if (declared.refusal === undefined && refused === undefined) {
    return undefined;
  }
  const diagnostic = declared.diagnostic ?? refused?.diagnostic;
  return {
    ok: false,
    condition: "inspection-stopped",
    stopReason: "parse-failure-declaration-file",
    // The table owns the wording; a hand-written copy here would drift from
    // the row it is meant to be reporting.
    diagnostics:
      diagnostic ?? STOP_REASONS["parse-failure-declaration-file"].reason,
  };
}

/**
 * A result the Service refused while reading is the repository's doing, not
 * Studio's: the volume that breached the bound is materialized content. Left
 * unrouted it fell through to `inspector-unavailable`, which attributes a
 * repository-caused stop to Studio and is the crossing AC-0093 forbids.
 *
 * `result-too-large` already carries that row's reason and attribution, so
 * this is a mapping onto existing vocabulary.
 */
export function refusedResultOutcome(
  resultRefused: boolean,
): InspectionOutcome | undefined {
  if (!resultRefused) {
    return undefined;
  }
  return {
    ok: false,
    condition: "inspection-stopped",
    stopReason: "result-too-large",
    diagnostics: STOP_REASONS["result-too-large"].reason,
  };
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
  // AC-0033 and AC-0034. Minted here and held, so the identifier the result
  // echoes is compared against Studio's own value rather than against
  // anything read back out of the Runtime.
  const requestId = mintRequestIdentifier();
  const admission = beginTrialInspection(
    {
      requestId,
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
  return settledRuntimeOutcome({
    ...record,
    requestId,
    inspectorSearchRoot: studioInstallRoot(),
    // AC-0045, from **Studio's own value**. `reserveStateRoot` created this
    // root and `per-request-state-root.ts` derives the materialization child
    // from it, so the child never supplies it. That matters: the containment
    // check refuses an inspector resolving inside the materialization root,
    // and a child that could name the root it is checked against could name
    // one it is not inside.
    materializationRoot: record.stateRoot.materializationRoot,
    interpreterSearchList: record.interpreterSearchList,
  });
}

/**
 * Studio's own install root — the only place AC-0047 admits looking for the
 * trusted inspector, since a repository-projected skill is never a fallback.
 *
 * Resolved by walking up from this module to the directory holding the pack
 * state, on the same reasoning as `defaultChildEntry`: the built artifact and
 * the source tree sit at different depths, so a fixed number of `..` segments
 * would be right in exactly one of them.
 *
 * Exported for one reason: it is the only function joining this whole unit to
 * production, and its sole caller needs a network fetch no gate can reach. So
 * replacing its body with `return undefined` left the entire service suite
 * green while making every inspection take the not-found branch — the locator
 * thoroughly tested and the thing that reaches it asserted by nothing, which
 * is this slice's own defect class one layer out.
 */
export function studioInstallRoot(): string | undefined {
  let directory = dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 8; depth += 1) {
    if (existsSync(join(directory, PACK_STATE_RELATIVE_PATH))) {
      return directory;
    }
    const parent = dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  return undefined;
}

/**
 * What a settled Runtime record means, once cancellation has been ruled out.
 *
 * Extracted from `inspectInRuntime` because that function needs a real
 * revision to fetch and this repository keeps no test network surface, so
 * nothing in the gate set could reach the routing below while it lived there:
 * both refusal branches were deletable and reorderable with every gate green.
 * The order is load-bearing and is asserted rather than described.
 */
export function settledRuntimeOutcome(
  record: SettledRuntimeRecord,
): InspectionOutcome {
  // First, because a refused run refuses *before* it materializes anything.
  // Read after the materialization gate this branch was unreachable, and a
  // contract-mismatch run reported "the Runtime did not materialize the
  // revision" -- true, and not the reason.
  const refused = record.protocolLines.find((line) => line.type === "refused");
  if (refused !== undefined) {
    return {
      ok: false,
      condition: "inspection-stopped",
      stopReason: "result-invalid-studio",
      diagnostics: "the Runtime refused the request it was given",
    };
  }

  const materialized = record.protocolLines.find(
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

  // Before the declared read is consulted: a refused result means the declared
  // line was cut off mid-write, so an absent report there says "nothing was
  // read", not "the repository declares none".
  const resultStopped = refusedResultOutcome(record.resultRefused);
  if (resultStopped !== undefined) {
    return resultStopped;
  }

  const declaredStopped = declaredRefusalOutcome(record.declared);
  if (declaredStopped !== undefined) {
    return declaredStopped;
  }

  // A run that was terminated before it responded never reached its result
  // line, so there is no result to validate and its absence says nothing
  // about readability. This is the answer that shipped before the result was
  // validated at all, and it is kept deliberately: naming *which* termination
  // stopped it needs a terminating-condition-to-`StopReasonKey` mapping that
  // no production site has yet, which is `connect-orient-stop-reason-never-resolved`.
  const validated = record.completedResponse
    ? validatedTrialResult(record)
    : ({ ok: false, refusal: undefined } as const);

  // The locator is a filesystem walk from Studio's install root and does not
  // depend on the Runtime's outcome. It runs for every path that reaches here,
  // including stopped, timed-out, cancelled, and validation-refused runs, so
  // AC-0043's universal "with each inspection" holds on all of them.
  const located = inspectorDiagnostic(record);

  // A run whose result failed validation returns the refusal with the inspector
  // identity attached, so a lead can see which inspector Studio held even when
  // the result was not admitted. The refusal is always `ok: false` — every
  // path in `validatedTrialResult` that sets a refusal does so — but the field
  // is typed as `InspectionOutcome` (a union), so we narrow before spreading.
  if (!validated.ok && validated.refusal !== undefined) {
    const refusal = validated.refusal;
    return refusal.ok ? refusal : { ...refusal, inspector: located.inspector };
  }

  // The Runtime materialized the tree and ran no trusted inspector, so no
  // trusted output exists to derive a verdict from. Saying so is the honest
  // answer; deriving one from Studio's own reading is what AC-0061 forbids.
  // The result still travels, because AC-0038's five reported elements are the
  // Runtime's observations, not a verdict.
  //
  // **Why it is unavailable is four different sentences, not one.** AC-0044
  // wants the pin mismatch named, AC-0045 the containment refusal, AC-0048 the
  // interpreter requirement — and a conforming inspector that Studio holds and
  // did not use is a fifth thing again. One generic sentence for all of them
  // tells the lead nothing they can act on.
  return {
    ok: false,
    condition: "inspector-unavailable",
    // A run that stopped before responding and a run that finished cleanly
    // without an inspector are the same condition and not the same event, and
    // the absent `result` that distinguishes them is not rendered. The
    // diagnostic distinguishes them: a stopped run names that the Runtime
    // stopped, a settled run names which of the locator's checks turned
    // nothing up. Which *termination* stopped it still needs a `StopReasonKey`
    // mapping, which is `connect-orient-stop-reason-never-resolved`.
    diagnostics: record.completedResponse
      ? located.diagnostic
      : "the Runtime stopped before it reported a result",
    ...(validated.ok
      ? {
          result: validated.result,
          declaredVersionState: validated.declaredVersionState,
        }
      : {}),
    inspector: located.inspector,
  };
}

/**
 * The interpreter probes the child reported, read field by field rather than
 * cast.
 *
 * The probe list is the one value on this path that crosses the process
 * boundary, and `Array.isArray` establishes only that it is an array --
 * everything inside it is whatever the line said. Casting it had three
 * consequences, each of which this reader closes.
 *
 * A `version` that parsed to an object made the version regex throw rather
 * than refuse, because `exec` applies `ToString` and `parseGuardedJson` gives
 * every rebuilt object a null prototype. An uncaught `TypeError` here becomes
 * "the inspection stopped: TypeError...", which is the failure the northbound
 * parse site exists to prevent.
 *
 * An unbounded probe list reached a **persisted and rendered** field: the
 * refusal names what each probe reported, and that text is stored under the
 * `repository-derived` marker and counted against AC-0104's bound. Each
 * version is bounded here, so a long list cannot make a record unpersistable.
 *
 * And the selected `path` became an executable Studio had not offered.
 * Nothing runs it in this slice, but the slice that does would inherit a path
 * the child chose. Only a member of the search list **Studio delivered** is
 * admitted, the discipline `declaredFromProtocol` already applies to a name
 * the Service itself delivered.
 */
function readInterpreterProbes(record: SettledRuntimeRecord): {
  readonly reported: boolean;
  readonly probes: InterpreterProbe[];
} {
  const line = record.protocolLines.find(
    (message) => message.type === "interpreter",
  );
  // An absent line is a Runtime that did not get that far, not a healthy
  // probe. Reading it as "an interpreter was fine" would let a truncated
  // stream look like a conforming one -- and collapsing it into an empty
  // probe list would make the refusal claim the search list was walked, in
  // the one case where it was not. The child pushes an entry for every
  // candidate, absent ones included, so a genuinely empty list is a
  // different fact again.
  if (line === undefined || !Array.isArray(line.probes)) {
    return { reported: false, probes: [] };
  }
  const delivered = new Set(record.interpreterSearchList ?? []);
  const probes: InterpreterProbe[] = [];
  // **At most one probe per delivered path.** Membership alone bounds what a
  // path may be, not how many times it may appear, and the refusal names every
  // admitted probe -- so a child repeating one delivered path a hundred
  // thousand times, each with a bounded version, still composes megabytes into
  // a field that is persisted and rendered. Deduping here makes the
  // diagnostic's size follow from the list **Studio delivered** rather than
  // from how many entries the child chose to send.
  const seen = new Set<string>();
  for (const entry of line.probes) {
    if (entry === null || typeof entry !== "object") {
      continue;
    }
    const probe = entry as Record<string, unknown>;
    const path = typeof probe.path === "string" ? probe.path : undefined;
    if (path === undefined || !delivered.has(path) || seen.has(path)) {
      continue;
    }
    seen.add(path);
    const version =
      typeof probe.version === "string"
        ? probe.version.slice(0, PROBE_VERSION_BOUND_CHARACTERS)
        : undefined;
    probes.push({
      path,
      ...(version === undefined ? {} : { version }),
      // Read but never consulted: `selectConformingInterpreter` decides from
      // the version, and this is the child's own judgement of its own probe.
      conforming: probe.conforming === true,
    });
  }
  return { reported: true, probes };
}

/**
 * How much of a reported version may reach a persisted field. An interpreter
 * prints something like `Python 3.14.7`, so this is generous for the value.
 *
 * Size is bounded on **both** axes, and this is only one of them: the reader
 * admits at most one probe per delivered path, so the whole refusal is at
 * most the search list's length times this. Bounding the value alone left the
 * cardinality open, and a repeated path is the cheapest way to fill a field.
 */
const PROBE_VERSION_BOUND_CHARACTERS = 64;

/**
 * Why no trusted inspector ran, in the lead's terms — AC-0044, AC-0045,
 * AC-0046, AC-0048, and the case none of them covers.
 *
 * **Locating is not running.** Every branch returns `inspector-unavailable`,
 * including the one where the pinned inspector was found: Studio holding an
 * inspector it did not use is a different sentence from Studio not having one,
 * and reporting the second would be false. Running it is
 * `connect-orient-no-inspector-runs`, a separate slice outside this Runtime's
 * authorization.
 *
 * The order matches the locator's own: the interpreter is decided first,
 * because an inspector Studio cannot execute is not worth hashing two files to
 * identify, and the locator refuses containment before digests for the same
 * reason — reading a file to hash it is already a use of it.
 */
/**
 * AC-0043's four values, where Studio identified an inspector.
 *
 * Kept separate from the record so the two things travel apart: the diagnostic
 * says *why no verdict*, and this says *which inspector Studio holds*. Null
 * everywhere the walk turned nothing up, so a reader cannot mistake an absent
 * identity for an unidentified one -- the diagnostic beside it names which of
 * the six reasons applied.
 */
export interface LocatedInspector {
  readonly resolvedPath: string;
  readonly packName: string;
  readonly packVersion: string;
  readonly fileDigests: Record<string, string>;
}

function inspectorDiagnostic(record: SettledRuntimeRecord): {
  readonly diagnostic: string;
  readonly inspector: LocatedInspector | null;
} {
  const unidentified = (diagnostic: string) =>
    ({ diagnostic, inspector: null }) as const;
  // Three facts, kept apart: Studio delivered no list to walk, the Runtime
  // reported no probes, and a walked list turned nothing up. The refusal below
  // names the third, so reaching it from either of the first two would assert
  // something that did not happen.
  if (record.interpreterSearchList === undefined) {
    return unidentified(
      "Studio delivered no interpreter search list, so none was walked",
    );
  }
  const reported = readInterpreterProbes(record);
  if (!reported.reported) {
    return unidentified(
      "the Runtime did not report which interpreters it probed, so Studio could not verify one",
    );
  }
  const interpreter = selectConformingInterpreter(
    reported.probes,
    MINIMUM_INTERPRETER_VERSION,
  );
  if (!interpreter.ok) {
    return unidentified(interpreter.mismatch);
  }

  // Concern 3's branch, named rather than reported as the benign sentence.
  // Whether a packaged desktop build places the pack state within the walk's
  // reach is **not established**; in this worktree it always is, so the
  // located branch is the development branch and this one is plausibly the
  // shipped one. Registered at `connect-orient-inspector-install-root-unproven`.
  if (record.inspectorSearchRoot === undefined) {
    return unidentified(
      "Studio could not locate its own install root, so the trusted inspector was not looked for",
    );
  }
  const located = locateTrustedInspector({
    searchRoot: record.inspectorSearchRoot,
    ...(record.materializationRoot === undefined
      ? {}
      : { materializationRoot: record.materializationRoot }),
  });
  if (!located.ok) {
    return unidentified(located.mismatch);
  }
  // The identity travels as a field now, not only inside this sentence. The
  // sentence keeps the path and pack because a diagnostic a reader can act on
  // should not require reading a second column beside it.
  return {
    diagnostic: `the pinned inspector was located at ${located.resolvedPath} (${located.packName} ${located.packVersion}) and was not run: running an inspector is outside this Runtime's authorization`,
    inspector: {
      resolvedPath: located.resolvedPath,
      packName: located.packName,
      packVersion: located.packVersion,
      fileDigests: { ...located.fileDigests },
    },
  };
}

/**
 * A refusal mapped onto the *Reasons for `inspection-stopped`* table.
 *
 * `cause` names **which** refusal fired. Several distinct causes share the
 * `result-invalid-studio` row -- the count has gone stale twice, so it is not
 * restated here; `trial-result-line.test.ts` enumerates them and asserts they
 * stay pairwise distinct. A reader given only the row's wording cannot tell
 * them apart without reproducing the run. `declaredRefusalOutcome` above
 * already sets the precedent: the specific diagnostic leads and the table's
 * wording is the fallback, so the row still owns the wording wherever no
 * specific cause exists.
 */
function stoppedBy(
  stopReason:
    | "result-invalid-studio"
    | "result-invalid-repository"
    | "request-identifier-mismatch",
  cause?: string,
): InspectionOutcome {
  return {
    ok: false,
    condition: "inspection-stopped",
    stopReason,
    diagnostics: cause ?? STOP_REASONS[stopReason].reason,
  };
}

/**
 * AC-0032, AC-0034, AC-0035, AC-0036 and AC-0038 at the one site where a trial
 * result crosses the process boundary into Studio.
 *
 * The whole shape is checked by `normalizeTrialResult` before a single field
 * is copied, so a refusal consumes nothing. Each refusal carries a distinct
 * **diagnostic**; several share the `result-invalid-studio` **row**, because
 * the table has one row for a result Studio cannot read. See `stoppedBy`.
 *
 * **Which row a wrong contract name takes.** The table carries no
 * contract-mismatch row: a result naming another contract is a result Studio
 * cannot read as this contract's result, which is AC-0036's Studio-produced
 * row. Its sibling row, `result-invalid-repository`, covers a result whose
 * failing structure is repository-derived, and nothing echoes repository
 * content into a result until a trusted inspector runs — that is the
 * `connect-orient-no-inspector-runs` slice, and the row is unreachable before
 * it.
 */
function validatedTrialResult(record: SettledRuntimeRecord):
  | {
      readonly ok: true;
      readonly result: NormalizedTrialResult;
      readonly declaredVersionState: "declared" | "absent" | "unreadable";
    }
  | { readonly ok: false; readonly refusal: InspectionOutcome } {
  const raw = record.protocolLines.find((line) => line.type === "result");
  if (raw === undefined) {
    // The Runtime responded and still wrote no result. A run that was
    // *terminated* before responding never reaches here — `settledRuntimeOutcome`
    // checks `completedResponse` first, for the attribution reason recorded there.
    return {
      ok: false,
      refusal: stoppedBy(
        "result-invalid-studio",
        "the Runtime completed without reporting a result",
      ),
    };
  }
  // AC-0061, enforced where the result is admitted rather than left to the
  // branch that happens to consume it. No trusted inspector runs in this
  // slice, so a result claiming workspace state claims something no trusted
  // output supports -- and `normalizeTrialResult` would turn that claim into
  // a verdict. Refusing it here is what keeps the verdict derivable only from
  // trusted inspector output. When an inspector does run, this is the guard
  // that must be relaxed deliberately rather than discovered.
  if (raw.workspacePresent !== undefined || raw.status === "completed") {
    return {
      ok: false,
      refusal: stoppedBy(
        "result-invalid-studio",
        "the Runtime reported an inspection state no trusted inspector produced",
      ),
    };
  }
  // `declaredVersionMarker: null` is the contract's way of saying *the
  // repository declares none*. An absent declared report means the read never
  // happened, so composing `null` from it would make Studio assert something
  // the tree never said — the distinction AC-0064 turns on.
  if (record.declared === undefined) {
    return {
      ok: false,
      refusal: stoppedBy(
        "result-invalid-studio",
        "the Runtime reported a result without reporting what the repository declared",
      ),
    };
  }
  // A marker that could not be **determined** is neither a marker nor an
  // absence. `declaredVersionMarker: null` is the contract's way of saying
  // *the repository declares none*, and saying that of a repository whose
  // declaration Studio could not read is the falsehood AC-0064 turns on.
  //
  // So the result carries a third state beside the marker. `unreadable` says
  // Studio could not determine what the repository declares; `absent` says it
  // determined that the repository declares nothing. Both send `null` as the
  // marker, and the state is what tells them apart.
  //
  // **This settles the `connect-orient-no-inspector-runs` decision.** That
  // note asked a later slice to choose between letting a malformed workspace
  // declaration through to an inspector's `invalid_workspace` finding, or
  // giving the result a third state so both can be true at once. The third
  // state is the choice: the result no longer stops on an unreadable
  // declaration, so once an inspector runs, a malformed `workspace.toml`
  // still reaches it and can still be reported as `malformed`. AC-0059's
  // carve-out keeps both its letter and its intent.
  //
  // This covers every refusal on a permitted read, not only an over-long
  // marker. A refused `.agentbundle-state.toml` never reaches here --
  // `declaredRefusalOutcome` above routes it first -- so in practice this is
  // the `workspace.toml` path, which AC-0059's carve-out deliberately
  // excludes from that routing.
  const declaredVersionState =
    record.declared.markerUndetermined === true
      ? "unreadable"
      : record.declared.versionMarker !== undefined
        ? "declared"
        : "absent";
  const outcome = normalizeTrialResult(
    {
      ...raw,
      // Last, deliberately: the marker is the one the Service parsed from the
      // declared read, not one the line across the boundary supplied.
      declaredVersionMarker: record.declared.versionMarker ?? null,
    },
    record.requestId,
  );
  if (outcome.ok) {
    return { ok: true, result: outcome.result, declaredVersionState };
  }
  // `declaredVersionState` was derived above. Carry it through the refusal so
  // the caller reports what the declaration determined rather than falling back
  // to the not-determined value. The result's validation failing does not undo
  // the read that already happened.
  if (outcome.stopReason === "request-identifier-mismatch") {
    return {
      ok: false,
      refusal: {
        ok: false,
        condition: "inspection-stopped",
        stopReason: "request-identifier-mismatch",
        diagnostics: STOP_REASONS["request-identifier-mismatch"].reason,
        declaredVersionState,
      },
    };
  }
  // Neither cause echoes a value off the line. What crossed the boundary is
  // unbounded and repository-influenced, and this text is persisted and
  // rendered -- and counted against AC-0104's bound as `repository-derived`,
  // so echoing a megabyte here would let a result make its own inspection
  // unpersistable. Naming the cause is what a reader needs; the line itself
  // is on the protocol stream, bounded.
  const cause =
    outcome.stopReason === "contract-mismatch"
      ? `the result names a contract other than ${TRIAL_CONTRACT}`
      : "the result does not conform to the trial contract";
  return {
    ok: false,
    refusal: {
      ok: false,
      condition: "inspection-stopped",
      stopReason: "result-invalid-studio",
      diagnostics: cause,
      declaredVersionState,
    },
  };
}

/** Exactly what `settledRuntimeOutcome` reads off a settled trial record. */
export interface SettledRuntimeRecord {
  /**
   * AC-0034. The identifier **Studio minted**, so the comparison against the
   * one the result echoes is against Studio's own value rather than against
   * anything the child supplied.
   */
  readonly requestId: string;
  /**
   * Where the pinned inspector is looked for. Optional because most cases
   * have no inspector tree to point at; production supplies Studio's own
   * install root, which is the only place AC-0047 admits looking.
   */
  readonly inspectorSearchRoot?: string | undefined;
  /** AC-0045. Supplied so an inspector resolving inside it can be refused. */
  readonly materializationRoot?: string;
  /**
   * The interpreter paths **Studio delivered** to the child. A probe naming
   * anything else is not a probe of an interpreter Studio offered, and is
   * dropped rather than decided on.
   */
  readonly interpreterSearchList?: readonly string[];
  /**
   * Whether a completed response arrived before the Service decided to
   * terminate. A run killed at a deadline **after** materializing writes no
   * result line, and reporting that absence as an unreadable result would
   * attribute a Runtime-side stop to Studio -- the crossing AC-0093 forbids.
   * The supervisor already computes this; it was only missing from this type.
   */
  readonly completedResponse: boolean;
  readonly protocolLines: readonly Record<string, unknown>[];
  readonly resultRefused: boolean;
  readonly declared: DeclaredReadReport | undefined;
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
