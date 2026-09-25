/**
 * The Studio-Service half of the trial: validating a trial result in full
 * before any part of it is normalized, deciding the verdict from trusted
 * inspector output alone, and carrying provenance with every value whose
 * content did not originate in Studio.
 *
 * The two axes are modelled separately on purpose. *The verdict, and how a
 * result is composed* records that flattening them into one enum is what made
 * `agent-ready` and `version-unverified` simultaneously true and left
 * `not-agent-ready` unreachable, so `verdict`, `condition` and the
 * `versionUnverified` qualifier are three independent fields here and nothing
 * collapses them.
 */
import { randomUUID } from "node:crypto";

/** *Canonical values*, *Trial contract name*. */
export const TRIAL_CONTRACT = "connect-orient-trial.v0";

/**
 * *Canonical values*, *Removal outcomes*. The closed set AC-0038's fifth
 * reported element may take.
 *
 * It is a set rather than a free string because `isString` validates a shape
 * and this criterion is about a *value*: without it a Runtime reporting
 * `removalOutcome: "probably"` conforms. The Runtime child holds the same
 * three literals, because it may import nothing; a test pins its literals
 * against this set, so a drift reddens rather than passing as conforming.
 */
export const REMOVAL_OUTCOMES = ["removed", "not-removed", "retained"] as const;

export type RemovalOutcome = (typeof REMOVAL_OUTCOMES)[number];

function isRemovalOutcome(value: unknown): value is RemovalOutcome {
  return (REMOVAL_OUTCOMES as readonly unknown[]).includes(value);
}

/** *Canonical values*, *Request identifier*. */
export const REQUEST_IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{7,63}$/;

/** *Resource bounds*, *Trial result bytes*. */
export const TRIAL_RESULT_BYTE_BOUND = 8 * 1024 * 1024;

/** *Resource bounds*, *Child diagnostic bytes*. */
export const CHILD_DIAGNOSTIC_BYTE_BOUND = 256 * 1024;

export type TrialStopReason =
  | "contract-mismatch"
  | "request-identifier-mismatch"
  | "result-invalid"
  | "result-too-large";

export type Verdict = "agent-ready" | "not-agent-ready" | "no-verdict";

export type Condition =
  | "ok"
  | "malformed"
  | "inspector-unavailable"
  | "source-unavailable"
  | "source-rate-limited"
  | "inspection-stopped"
  | "cancelled";

/**
 * *Canonical values*, *Non-originated value*: any value whose bytes Studio did
 * not produce. The class is named once so the rendering obligation and the sink
 * prohibition cannot drift apart.
 */
export type Provenance =
  | "repository-derived"
  | "transport-reported"
  /**
   * Text authored by a pinned third-party executable — the trusted inspector's
   * own prose, and a child process's own diagnostic text. Added to the
   * *Non-originated value* class by the Package 3 amendment, because the class
   * head covers every value whose bytes Studio did not produce and these were
   * left unassigned by the three-item enumeration.
   */
  | "inspector-authored"
  | "studio-produced";

export interface Provenanced<Value> {
  readonly value: Value;
  readonly provenance: Provenance;
}

export function provenanced<Value>(
  value: Value,
  provenance: Provenance,
): Provenanced<Value> {
  return { value, provenance };
}

export function isNonOriginated(marked: Provenanced<unknown>): boolean {
  return marked.provenance !== "studio-produced";
}

/**
 * AC-0033. The Service mints the identifier; nothing derived from client input
 * reaches it. `randomUUID` supplies the entropy and the charset is narrowed to
 * the row's, which is what makes the value checkable rather than merely random.
 */
export function mintRequestIdentifier(): string {
  const minted = `req-${randomUUID().replaceAll("-", "")}`.slice(0, 64);
  if (!REQUEST_IDENTIFIER_PATTERN.test(minted)) {
    throw new Error(`minted identifier is outside the charset: ${minted}`);
  }
  return minted;
}

/** The trial result as the Runtime reports it, before any Studio reading. */
export interface RawTrialResult {
  readonly contract?: unknown;
  readonly requestId?: unknown;
  readonly status?: unknown;
  readonly resolvedSha?: unknown;
  readonly inspectorDiagnostics?: unknown;
  readonly declaredVersionMarker?: unknown;
  readonly inspectorContractVersion?: unknown;
  readonly removalOutcome?: unknown;
  readonly workspacePresent?: unknown;
  readonly findings?: unknown;
}

/**
 * AC-0038's five reported elements, each carrying the provenance AC-0039
 * requires of it. `declaredVersionMarker` is `null` when the repository
 * declares none: an explicit absence rather than a missing field, because
 * AC-0064 distinguishes declaring nothing from not having been read.
 */
export interface NormalizedTrialResult {
  readonly contract: typeof TRIAL_CONTRACT;
  readonly requestId: string;
  readonly status: string;
  readonly resolvedSha: Provenanced<string>;
  readonly inspectorDiagnostics: Provenanced<string>;
  readonly declaredVersionMarker: Provenanced<string | null>;
  readonly inspectorContractVersion: Provenanced<string | null>;
  readonly removalOutcome: RemovalOutcome;
  readonly verdict: Verdict;
  readonly versionUnverified: boolean;
}

export type TrialResultOutcome =
  | { readonly ok: true; readonly result: NormalizedTrialResult }
  | { readonly ok: false; readonly stopReason: TrialStopReason };

function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * AC-0061 and AC-0063. The mapping is total over the
 * `workspace_present` × `invalid_workspace` product: no completed inspection
 * falls through every row, and `malformed` is produced by the inspector's
 * `invalid_workspace` finding and by nothing else.
 */
export function deriveVerdict(
  workspacePresent: boolean | undefined,
  hasInvalidWorkspaceFinding: boolean,
  completed: boolean,
): Verdict {
  if (!completed || workspacePresent === undefined) {
    return "no-verdict";
  }
  if (!workspacePresent) {
    return "not-agent-ready";
  }
  // A completed inspection reporting `workspace_present` true *with* an
  // `invalid_workspace` finding is the fourth cell of the product, and it is
  // `no-verdict`: the inspection completed but determined no verdict.
  return hasInvalidWorkspaceFinding ? "no-verdict" : "agent-ready";
}

/** AC-0063: the `malformed` condition, and nothing else, produces it. */
export function deriveCondition(
  hasInvalidWorkspaceFinding: boolean,
): Condition {
  return hasInvalidWorkspaceFinding ? "malformed" : "ok";
}

function hasInvalidWorkspace(findings: unknown): boolean {
  return (
    Array.isArray(findings) &&
    findings.some(
      (finding) =>
        finding === "invalid_workspace" ||
        (typeof finding === "object" &&
          finding !== null &&
          (finding as { code?: unknown }).code === "invalid_workspace"),
    )
  );
}

/**
 * AC-0035 and AC-0036. The whole shape is checked before a single field is
 * copied, so a well-named, well-identified result whose body does not conform
 * is refused without having been partially consumed. The refusal carries the
 * stop reason and nothing else: the reason is the distinct diagnostic, and
 * distinct reasons are what let a reader tell the failures apart.
 *
 * `expectedRequestId` is optional because AC-0034 binds a result to *a*
 * request. Where there is no request to match against, there is no mismatch to
 * find, and the shape is still validated in full.
 */
export function normalizeTrialResult(
  raw: RawTrialResult,
  expectedRequestId?: string,
): TrialResultOutcome {
  if (raw.contract !== TRIAL_CONTRACT) {
    return { ok: false, stopReason: "contract-mismatch" };
  }
  if (!isString(raw.requestId)) {
    return { ok: false, stopReason: "result-invalid" };
  }
  if (expectedRequestId !== undefined && raw.requestId !== expectedRequestId) {
    return { ok: false, stopReason: "request-identifier-mismatch" };
  }
  if (
    !isString(raw.status) ||
    !isString(raw.resolvedSha) ||
    !isString(raw.inspectorDiagnostics) ||
    !isRemovalOutcome(raw.removalOutcome) ||
    (raw.declaredVersionMarker !== null &&
      raw.declaredVersionMarker !== undefined &&
      !isString(raw.declaredVersionMarker)) ||
    (raw.inspectorContractVersion !== null &&
      raw.inspectorContractVersion !== undefined &&
      !isString(raw.inspectorContractVersion)) ||
    (raw.workspacePresent !== undefined &&
      typeof raw.workspacePresent !== "boolean")
  ) {
    return { ok: false, stopReason: "result-invalid" };
  }

  const invalidWorkspace = hasInvalidWorkspace(raw.findings);
  const declared = isString(raw.declaredVersionMarker)
    ? raw.declaredVersionMarker
    : null;

  return {
    ok: true,
    result: {
      contract: TRIAL_CONTRACT,
      requestId: raw.requestId,
      status: raw.status,
      // The transport reported this; Studio did not produce its bytes.
      resolvedSha: provenanced(raw.resolvedSha, "transport-reported"),
      // Echoed by the inspector from the repository, which AC-0039 counts as
      // repository-derived just as much as a value Studio extracted itself.
      inspectorDiagnostics: provenanced(
        raw.inspectorDiagnostics,
        "repository-derived",
      ),
      declaredVersionMarker: provenanced(declared, "repository-derived"),
      // The inspector reports this for its own output contract, so its bytes
      // are the inspector's, not Studio's. It is non-originated without being
      // repository-derived, which is the gap the amended class now closes.
      inspectorContractVersion: provenanced(
        isString(raw.inspectorContractVersion)
          ? raw.inspectorContractVersion
          : null,
        "inspector-authored",
      ),
      removalOutcome: raw.removalOutcome,
      verdict: deriveVerdict(
        raw.workspacePresent as boolean | undefined,
        invalidWorkspace,
        raw.status === "completed",
      ),
      // AC-0065: declaring a marker in either permitted file carries the
      // qualifier, whatever the verdict and whatever the condition.
      versionUnverified: declared !== null,
    },
  };
}

/**
 * AC-0037. The result is refused **while being read**: each chunk is counted as
 * it arrives and the reader refuses the moment the running total passes the
 * bound, so no full buffer of an oversized result ever exists.
 */
export class BoundedResultReader {
  private readonly chunks: string[] = [];
  private bytes = 0;
  private refusedAt: number | undefined;

  constructor(private readonly boundBytes: number = TRIAL_RESULT_BYTE_BOUND) {}

  push(chunk: string): boolean {
    if (this.refusedAt !== undefined) {
      return false;
    }
    this.bytes += Buffer.byteLength(chunk, "utf8");
    if (this.bytes > this.boundBytes) {
      this.refusedAt = this.bytes;
      this.chunks.length = 0;
      return false;
    }
    this.chunks.push(chunk);
    return true;
  }

  get refused(): boolean {
    return this.refusedAt !== undefined;
  }

  get bytesSeen(): number {
    return this.bytes;
  }

  text(): string {
    return this.refusedAt === undefined ? this.chunks.join("") : "";
  }

  outcome(): TrialResultOutcome | undefined {
    return this.refusedAt === undefined
      ? undefined
      : { ok: false, stopReason: "result-too-large" };
  }
}

export interface BoundedDiagnostics {
  readonly text: string;
  readonly elided: boolean;
  readonly discardedBytes: number;
}

/**
 * AC-0155. Child diagnostics are bounded while reading, and on breach the
 * leading and trailing halves are retained with an explicit marker naming the
 * discarded byte count.
 *
 * Diagnostics are truncated rather than refused on purpose: refusing them would
 * let a repository suppress its own verdict by emitting warnings, so the
 * inspection result is unaffected by this bound in either direction.
 */
export class BoundedDiagnosticBuffer {
  private head = "";
  private tail = "";
  private bytes = 0;

  constructor(
    private readonly boundBytes: number = CHILD_DIAGNOSTIC_BYTE_BOUND,
  ) {}

  push(chunk: string): void {
    this.bytes += Buffer.byteLength(chunk, "utf8");
    const half = Math.floor(this.boundBytes / 2);
    if (Buffer.byteLength(this.head, "utf8") < half) {
      this.head += chunk;
      return;
    }
    this.tail = (this.tail + chunk).slice(-half);
  }

  finish(): BoundedDiagnostics {
    const half = Math.floor(this.boundBytes / 2);
    if (this.bytes <= this.boundBytes) {
      return {
        text: this.head + this.tail,
        elided: false,
        discardedBytes: 0,
      };
    }
    const head = this.head.slice(0, half);
    const tail = this.tail.slice(-half);
    const discardedBytes =
      this.bytes -
      Buffer.byteLength(head, "utf8") -
      Buffer.byteLength(tail, "utf8");
    return {
      text: `${head}\n…${discardedBytes} bytes elided…\n${tail}`,
      elided: true,
      discardedBytes,
    };
  }
}

/**
 * AC-0067 and AC-0068. The target's declared marker and the version the
 * inspector reports for its own output contract are two separate observed
 * values, and neither is compared against any version set: nothing here returns
 * a judgement, because no such set was declared by either party.
 */
export interface ObservedVersions {
  readonly declaredByTarget: string | null;
  readonly reportedByInspector: string | null;
}

export function observedVersions(
  result: NormalizedTrialResult,
): ObservedVersions {
  return {
    declaredByTarget: result.declaredVersionMarker.value,
    reportedByInspector: result.inspectorContractVersion.value,
  };
}
