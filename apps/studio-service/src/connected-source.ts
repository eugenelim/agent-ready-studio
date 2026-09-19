/**
 * Persisting a connected source, and the two lifecycle transitions that are
 * not an inspection finishing: a lead cancelling one, and a restart finding one
 * that never finished.
 *
 * The distinction AC-0085 draws is the point of this module. `cancelled` means
 * a person stopped it; `incomplete` means Studio did, by restarting. They carry
 * different labels, different attention and different attribution, so
 * collapsing them would tell the lead their own action caused a Studio fault.
 */
import type {
  ConnectedSourceRecord,
  Storage,
  StorageTransaction,
} from "@agent-ready/storage-sqlite";

import type { NormalizedTrialResult } from "./trial-result.js";

/**
 * *Resource bounds*, *Persisted repository-derived content*: 256 KiB per
 * connected source, over **every** persisted repository-derived value and not
 * one class of them.
 */
export const PERSISTED_REPOSITORY_CONTENT_BOUND_BYTES = 256 * 1024;

/** The states an inspection can be left in other than by completing. */
/**
 * The phases an inspection can be interrupted in. These are **phase** values,
 * not conditions: the condition of an in-flight source is `ok`, and an earlier
 * version matched these against `condition`, so the reconciliation below could
 * never fire and AC-0085's `incomplete` was unreachable.
 */
export const IN_FLIGHT_PHASES = ["resolving", "inspecting"] as const;

export type PersistRefusal = "exceeds-persisted-content-bound";

export type PersistOutcome =
  | { readonly ok: true; readonly record: ConnectedSourceRecord }
  | {
      readonly ok: false;
      readonly refusal: PersistRefusal;
      readonly diagnostic: string;
      readonly bytes: number;
      readonly boundBytes: number;
    };

/**
 * Every persisted value whose content originated in the inspected repository,
 * paired with its field name.
 *
 * The bound is stated over the class, not over a chosen field, so this reads
 * the provenance markers the result already carries rather than naming
 * `diagnostics` and hoping no repository-derived field is added later. A new
 * repository-derived field is counted the moment it is marked, with no edit
 * here.
 */
export function repositoryDerivedValues(
  record: ConnectedSourceRecord,
): { field: string; value: string }[] {
  const byField: Record<string, string | null> = {
    diagnostics: record.diagnostics,
    declaredVersionMarker: record.declaredVersionMarker,
    inspectorContractVersion: record.inspectorContractVersion,
    resolvedSha: record.resolvedSha,
    requestedRef: record.requestedRef,
  };
  return Object.entries(byField)
    .filter(
      ([field, value]) =>
        typeof value === "string" &&
        record.provenance[field] === "repository-derived",
    )
    .map(([field, value]) => ({ field, value: value as string }));
}

export function persistedRepositoryBytes(
  record: ConnectedSourceRecord,
): number {
  return repositoryDerivedValues(record).reduce(
    (total, { value }) => total + Buffer.byteLength(value, "utf8"),
    0,
  );
}

/**
 * Builds the record a normalized result persists as, carrying each value's
 * provenance marker alongside it so AC-0040's marker survives the write.
 */
export function toConnectedSourceRecord(input: {
  readonly sourceId: string;
  readonly owner: string;
  readonly repository: string;
  readonly requestedRef: string | null;
  readonly inspectedAt: string;
  readonly condition: string;
  readonly result: NormalizedTrialResult;
}): ConnectedSourceRecord {
  const { result } = input;
  return {
    id: input.sourceId,
    owner: input.owner,
    repository: input.repository,
    requestedRef: input.requestedRef,
    resolvedSha: result.resolvedSha.value,
    inspectedAt: input.inspectedAt,
    verdict: result.verdict,
    condition: input.condition,
    versionUnverified: result.versionUnverified,
    diagnostics: result.inspectorDiagnostics.value,
    declaredVersionMarker: result.declaredVersionMarker.value,
    inspectorContractVersion: result.inspectorContractVersion.value,
    provenance: {
      diagnostics: result.inspectorDiagnostics.provenance,
      declaredVersionMarker: result.declaredVersionMarker.provenance,
      inspectorContractVersion: result.inspectorContractVersion.provenance,
      resolvedSha: result.resolvedSha.provenance,
    },
  };
}

/**
 * AC-0104. The write is rejected on breach rather than truncated, per the owner
 * decision recorded at
 * `notes/verification-ledger.md#owner-decision-2026-09-16-package-3-taxonomy`.
 * Truncating would persist a repository-derived value Studio had silently
 * altered, and nothing downstream could tell an altered value from a whole one.
 *
 * The bound is checked **before** the write, so a breaching result leaves the
 * prior record exactly as it was rather than half-replaced.
 */
export function persistConnectedSource(
  storage: StorageTransaction,
  record: ConnectedSourceRecord,
): PersistOutcome {
  const bytes = persistedRepositoryBytes(record);
  if (bytes > PERSISTED_REPOSITORY_CONTENT_BOUND_BYTES) {
    return {
      ok: false,
      refusal: "exceeds-persisted-content-bound",
      diagnostic: `persisted repository-derived content is ${bytes} bytes across ${repositoryDerivedValues(record).length} values, bound is ${PERSISTED_REPOSITORY_CONTENT_BOUND_BYTES}`,
      bytes,
      boundBytes: PERSISTED_REPOSITORY_CONTENT_BOUND_BYTES,
    };
  }
  storage.upsertConnectedSource(record);
  return { ok: true, record };
}

/**
 * AC-0084. The Service terminates the in-flight Runtime and records the
 * inspection as `cancelled`. Termination is supplied by the caller because the
 * Service owns the process group; this owns only what is written down.
 */
export function recordCancellation(
  storage: StorageTransaction,
  sourceId: string,
  terminate: () => void,
): void {
  terminate();
  storage.setConnectedSourceCondition(sourceId, "cancelled");
}

/**
 * AC-0085. After an ordinary controlled restart, an inspection that was in
 * flight carries `incomplete` — distinct from `cancelled`, because Studio
 * interrupted it and the lead did not.
 *
 * Returns the sources it moved, so a caller can report them rather than
 * discovering the transition only by reading the table again.
 */
export function reconcileAfterRestart(storage: Storage): string[] {
  const moved: string[] = [];
  for (const source of storage.listConnectedSources()) {
    // An in-flight source is stored with its phase in `condition`, because
    // that is the only column a restart can read it from. Nothing else writes
    // a phase there, so the match is unambiguous.
    if ((IN_FLIGHT_PHASES as readonly string[]).includes(source.condition)) {
      storage.setConnectedSourceCondition(source.id, "incomplete");
      moved.push(source.id);
    }
  }
  return moved;
}
