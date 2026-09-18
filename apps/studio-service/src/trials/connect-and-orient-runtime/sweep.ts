/**
 * The Runtime sweep: reclaiming per-request state roots abandoned by a Runtime
 * that died before it could remove its own (AC-0081), and reporting every
 * failure and every **declined** reclaim as an explicit diagnostic (AC-0083).
 *
 * The sweep enumerates only **direct children** of the sweep domain. A
 * candidate is removed only when the entry itself — observed without following
 * a link — is a directory owned by the current user at mode `0700`, and one of
 * three limbs holds:
 *
 * 1. it carries a parseable marker whose recorded process and start time do not
 *    match a live process;
 * 2. it carries a marker that cannot be parsed, **or that does not yield both a
 *    process identity and a start time**, and is older than the
 *    markerless-reclaim age;
 * 3. it carries no marker, contains no entries, and is older than that age.
 *
 * Every age read is the **candidate directory's own modification time**, never
 * the marker's.
 *
 * Where an input the limb under evaluation actually needs cannot be read or
 * compared, the sweep **declines to reclaim**. That is the fail-closed
 * direction: uncertainty costs bounded retention and never destroys state still
 * in use. A marker that does not yield both values is *not* a declined liveness
 * comparison — it is limb 2's input, and limb 2 reclaims it on its age gate.
 *
 * Retention stays bounded for the token-convention class too, which is why the
 * decline is conditioned on liveness rather than on the token alone. A process
 * that is absent is absent under any rendering convention, so an incomparable
 * token whose process is gone is limb 2's input and ages out; only a live
 * process with an incomparable token is undecidable, and that decline lasts no
 * longer than the process does.
 */
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LIVENESS_TOKEN_CONVENTION,
  MARKERLESS_RECLAIM_AGE_MS,
  OWNERSHIP_MARKER_NAME,
  type RemovalDiagnostic,
  readProcessStartTime,
  removePerRequestStateRoot,
  verifySweepDomain,
} from "./per-request-state-root.js";

export type SweepLimb = 1 | 2 | 3;

/** The class of input that could not be read or compared. Never a payload. */
export type DeclineInputClass =
  | "candidate-modification-time"
  | "clock-moved"
  | "liveness-token-convention"
  | "process-liveness";

export type SweepDecision =
  | { readonly action: "reclaimed"; readonly limb: SweepLimb }
  | { readonly action: "skipped"; readonly reason: string }
  | {
      readonly action: "declined";
      readonly limb: SweepLimb;
      readonly inputClass: DeclineInputClass;
    };

export interface SweepEntryOutcome {
  readonly name: string;
  readonly decision: SweepDecision;
  readonly removalDiagnostics: readonly RemovalDiagnostic[];
}

export interface SweepOutcome {
  readonly entries: readonly SweepEntryOutcome[];
  /**
   * Every declined reclaim and every removal failure, flattened. AC-0083: a
   * control whose failure mode emitted nothing would be unobservable exactly
   * when it matters.
   */
  readonly diagnostics: readonly string[];
}

type MarkerRead =
  | { readonly kind: "absent" }
  | { readonly kind: "unusable" }
  | { readonly kind: "partial" }
  /** Complete, but its token was rendered under a convention this build cannot
   *  compare against -- including a marker written before the convention was
   *  recorded at all. Never reclaimed on a byte comparison; declined while its
   *  process is live, and treated as the second limb's input once it is not. */
  | { readonly kind: "inconvertible-token"; readonly pid: number }
  | {
      readonly kind: "complete";
      readonly pid: number;
      readonly startTime: string;
    };

/**
 * Reads the marker under the same discipline the candidate entry carries: it
 * refuses to follow a link and refuses a non-regular file. A marker that is
 * present but unusable is limb 2's input, not limb 3's — limb 3 requires the
 * absence of a marker.
 */
function readMarker(candidate: string): MarkerRead {
  const markerPath = join(candidate, OWNERSHIP_MARKER_NAME);
  let status: ReturnType<typeof lstatSync>;
  try {
    status = lstatSync(markerPath);
  } catch {
    return { kind: "absent" };
  }
  if (status.isSymbolicLink() || !status.isFile()) {
    return { kind: "unusable" };
  }
  let text: string;
  try {
    // Read via the marker's own path: it has just been proven a regular file
    // that is not a link, which is the discipline AC-0081 requires.
    text = readFileSync(markerPath, "utf8");
  } catch {
    return { kind: "unusable" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { kind: "unusable" };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { kind: "unusable" };
  }
  const record = parsed as Record<string, unknown>;
  const pid = record.pid;
  const startTime = record.startTime;
  if (typeof pid !== "number" || !Number.isInteger(pid) || pid <= 0) {
    return { kind: "partial" };
  }
  if (typeof startTime !== "string" || startTime.trim() === "") {
    return { kind: "partial" };
  }
  // A token is only comparable against a rendering this build produces if it
  // was rendered the same way. A marker from a build with a different pin --
  // or from one predating the pin, which records no convention at all -- is
  // complete and unusable for limb 1 at the same time.
  if (record.tokenConvention !== LIVENESS_TOKEN_CONVENTION) {
    return { kind: "inconvertible-token", pid };
  }
  return { kind: "complete", pid, startTime };
}

export interface SweepOptions {
  readonly now?: number;
  readonly reclaimAgeMs?: number;
}

/**
 * A filesystem-supplied entry name, rendered so it cannot forge a diagnostic.
 *
 * Diagnostics are a line-oriented stream, so a name carrying a newline would
 * introduce lines a reader attributes to the sweep. The entry gate already
 * requires same-uid ownership at mode 0700, so an actor who can create such a
 * name can write the tree anyway -- this keeps the *record* honest rather
 * than defending the tree.
 */
function forDiagnostic(name: string): string {
  return JSON.stringify(name);
}

export function sweepDomain(
  domain: string,
  options: SweepOptions = {},
): SweepOutcome {
  verifySweepDomain(domain);
  const now = options.now ?? Date.now();
  const reclaimAgeMs = options.reclaimAgeMs ?? MARKERLESS_RECLAIM_AGE_MS;
  const entries: SweepEntryOutcome[] = [];
  const diagnostics: string[] = [];

  const record = (
    name: string,
    decision: SweepDecision,
    removalDiagnostics: readonly RemovalDiagnostic[] = [],
  ): void => {
    entries.push({ name, decision, removalDiagnostics });
    if (decision.action === "declined") {
      diagnostics.push(
        `declined reclaim of ${forDiagnostic(name)}: limb ${decision.limb} could not read or compare ${decision.inputClass}`,
      );
    }
    for (const failure of removalDiagnostics) {
      diagnostics.push(`removal failed for ${failure.path}: ${failure.reason}`);
    }
  };

  let names: string[];
  try {
    names = readdirSync(domain);
  } catch (cause) {
    return {
      entries: [],
      diagnostics: [`sweep domain ${domain} cannot be listed: ${cause}`],
    };
  }

  const uid = process.getuid?.();
  for (const name of names) {
    const candidate = join(domain, name);
    let status: ReturnType<typeof lstatSync>;
    try {
      status = lstatSync(candidate);
    } catch {
      record(name, { action: "skipped", reason: "cannot be stated" });
      continue;
    }
    // The entry gate, observed without following a link.
    if (status.isSymbolicLink()) {
      record(name, { action: "skipped", reason: "entry is a symbolic link" });
      continue;
    }
    if (!status.isDirectory()) {
      record(name, { action: "skipped", reason: "entry is not a directory" });
      continue;
    }
    if (uid !== undefined && status.uid !== uid) {
      record(name, { action: "skipped", reason: "entry is not owned by us" });
      continue;
    }
    if ((status.mode & 0o777) !== 0o700) {
      record(name, { action: "skipped", reason: "entry is not mode 700" });
      continue;
    }

    const marker = readMarker(candidate);

    // Limb 1 needs no age. It is evaluated first so that a live Runtime's root
    // is refused before any age is consulted.
    if (marker.kind === "complete" || marker.kind === "inconvertible-token") {
      const liveStartTime = readProcessStartTime(marker.pid);
      if (liveStartTime === undefined) {
        record(name, {
          action: "declined",
          limb: 1,
          inputClass: "process-liveness",
        });
        continue;
      }
      // Absence is established without comparing token bytes: no process
      // carries that identity, whatever convention rendered the marker. So a
      // token this build cannot compare only matters while the named process
      // is running -- otherwise the root is abandoned like any other, and
      // falls to the age-gated limb below rather than being retained forever.
      if (liveStartTime !== null && marker.kind === "inconvertible-token") {
        // The process is live and its token is not comparable, so whether this
        // root is in use cannot be decided. AC-0081 routes that to a decline.
        // Reaching the age-gated limb instead would reclaim a live Runtime's
        // root once it aged; comparing the bytes would delete it at once.
        record(name, {
          action: "declined",
          limb: 1,
          inputClass: "liveness-token-convention",
        });
        continue;
      }
      if (
        marker.kind === "complete" &&
        liveStartTime !== null &&
        liveStartTime === marker.startTime
      ) {
        record(name, {
          action: "skipped",
          reason: "marker names a live process",
        });
        continue;
      }
      if (marker.kind === "complete") {
        record(name, { action: "reclaimed", limb: 1 }, [
          ...removePerRequestStateRoot(candidate),
        ]);
        continue;
      }
      // An inconvertible token whose process is absent: nothing is in use, and
      // the marker still parsed, so this is the second limb's input.
    }

    // Limbs 2 and 3 are both age-gated on the candidate's own mtime.
    const limb: SweepLimb = marker.kind === "absent" ? 3 : 2;
    const modifiedAt = status.mtimeMs;
    if (!Number.isFinite(modifiedAt)) {
      record(name, {
        action: "declined",
        limb,
        inputClass: "candidate-modification-time",
      });
      continue;
    }
    if (modifiedAt > now) {
      // The candidate claims to have been modified after the moment we are
      // comparing against: the clock has been observed to move.
      record(name, { action: "declined", limb, inputClass: "clock-moved" });
      continue;
    }
    if (now - modifiedAt <= reclaimAgeMs) {
      record(name, { action: "skipped", reason: "younger than reclaim age" });
      continue;
    }

    if (limb === 3) {
      let children: string[];
      try {
        children = readdirSync(candidate);
      } catch {
        record(name, { action: "skipped", reason: "cannot be listed" });
        continue;
      }
      if (children.length > 0) {
        record(name, {
          action: "skipped",
          reason: "markerless candidate is not empty",
        });
        continue;
      }
    }
    record(name, { action: "reclaimed", limb }, [
      ...removePerRequestStateRoot(candidate),
    ]);
  }

  return { entries, diagnostics };
}
