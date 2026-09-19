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
import type { StudioResult } from "@agent-ready/protocol";
import type { CanonicalSourceIdentity } from "./source-identity.js";
import { buildFetchUrl, canonicalizeSource } from "./source-identity.js";
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
import { startTrialInspection } from "./trials/connect-and-orient-runtime/runtime-supervisor.js";

const execFileAsync = promisify(execFile);

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
    };

export interface InspectionRequest {
  readonly identity: CanonicalSourceIdentity;
  readonly sweepDomain: string;
  readonly revision: {
    readonly fetchUrl: string;
    readonly resolvedSha: string;
  };
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
}

/** A pipeline run, so `cancel` can stop one that is still going. */
interface Run {
  cancelled: boolean;
  readonly cleanup: (() => void)[];
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
      });
      if (run?.cancelled) return;

      if (!inspected.ok) {
        put({
          ...current(),
          phase: null,
          verdict: "no-verdict",
          condition: inspected.condition,
          inspectedAt: clock(),
          diagnostics: inspected.diagnostics,
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
      runs.set(sourceId, { cancelled: false, cleanup: [] });
      void pipeline(sourceId, url, requestedRef);
      return started;
    },

    get(sourceId: string): SourceInspection | undefined {
      return store.get(sourceId);
    },

    cancel(sourceId: string): SourceInspection | undefined {
      const held = store.get(sourceId);
      if (held === undefined) return undefined;
      const run = runs.get(sourceId);
      if (run !== undefined) run.cancelled = true;
      const cancelled: SourceInspection = {
        ...held,
        phase: null,
        verdict: "no-verdict",
        condition: "cancelled",
      };
      store.set(sourceId, cancelled);
      return cancelled;
    },
  };
}

export type SourceInspections = ReturnType<typeof createSourceInspections>;

/**
 * The production inspection: start the Runtime with the revision to
 * materialize and read what it reports. The Service never writes the tree.
 */
export async function inspectInRuntime(
  request: InspectionRequest,
): Promise<InspectionOutcome> {
  const record = await startTrialInspection(
    {
      requestId: mintRequestIdentifier(),
      identity: request.identity,
      sweepDomain: request.sweepDomain,
    },
    { revision: request.revision },
  );
  if (!("admitted" in record) || record.admitted !== true) {
    return {
      ok: false,
      condition: "inspection-stopped",
      diagnostics: `the Runtime refused the inspection: ${String((record as { code?: string }).code)}`,
    };
  }

  const lines = (record as unknown as { protocolLines?: { type: string }[] })
    .protocolLines;
  const materialized = (lines ?? []).find(
    (line) => line.type === "materialized",
  ) as { status?: number } | undefined;
  if (materialized === undefined || materialized.status !== 0) {
    return {
      ok: false,
      condition: "inspection-stopped",
      diagnostics: "the Runtime did not materialize the revision",
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
    PATH: "/usr/bin:/bin",
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
    throw new Error(`git could not be identified: ${identity.code}`);
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
