/**
 * The per-request state root: its verification, its creation, and its removal.
 *
 * The layout is the control. The state root owns the request; the
 * materialization root is its `tree` child; the per-request `HOME` and `TMPDIR`
 * are its siblings of that child; and the ownership marker is a **direct child
 * of the state root**, never inside `tree`. Because repository content only
 * ever reaches paths under `tree`, no repository content can create, overwrite
 * or forge the marker — forgery is impossible by layout rather than defended
 * against (AC-0070, AC-0080).
 *
 * Removing one root therefore discharges all four obligations at once
 * (AC-0079), and the removal refuses to descend a symbolic link at every level
 * it traverses rather than only at the root it begins from (AC-0076).
 */
import { execFileSync } from "node:child_process";
import {
  chmodSync,
  closeSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readdirSync,
  rmdirSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import { join } from "node:path";

/** The marker is a direct child of the state root and a sibling of `tree`. */
export const OWNERSHIP_MARKER_NAME = ".studio-ownership.json";
export const MATERIALIZATION_CHILD_NAME = "tree";
export const HOME_CHILD_NAME = "home";
export const TEMPORARY_CHILD_NAME = "tmp";
const STATE_ROOT_PREFIX = "connect-orient-";

/** *Resource bounds*, *Markerless-reclaim age*: 1 hour. */
export const MARKERLESS_RECLAIM_AGE_MS = 60 * 60 * 1000;

export interface PerRequestStateRoot {
  readonly stateRoot: string;
  /** The `tree` child. The inner bound on every repository-content read. */
  readonly materializationRoot: string;
  readonly home: string;
  readonly temporaryDirectory: string;
  readonly markerPath: string;
}

export interface OwnershipMarker {
  readonly schema: 1;
  readonly pid: number;
  readonly startTime: string;
}

export class SweepDomainError extends Error {
  constructor(detail: string) {
    super(`sweep domain refused: ${detail}`);
    this.name = "SweepDomainError";
  }
}

/**
 * AC-0072. Verified **on every use**, not once at startup: an existing
 * directory, not a link, owned by the current user, at mode `0700`. Any
 * departure fails closed — the Runtime refuses to proceed rather than
 * materializing into a domain it cannot vouch for.
 */
export function verifySweepDomain(sweepDomain: string): void {
  let status: ReturnType<typeof lstatSync>;
  try {
    // `lstat`, not `stat`: a link pointing at a conforming directory must be
    // refused as a link rather than accepted through its target.
    status = lstatSync(sweepDomain);
  } catch (cause) {
    throw new SweepDomainError(`${sweepDomain} cannot be stated: ${cause}`);
  }
  if (status.isSymbolicLink()) {
    throw new SweepDomainError(`${sweepDomain} is a symbolic link`);
  }
  if (!status.isDirectory()) {
    throw new SweepDomainError(`${sweepDomain} is not a directory`);
  }
  const uid = process.getuid?.();
  if (uid !== undefined && status.uid !== uid) {
    throw new SweepDomainError(
      `${sweepDomain} is owned by uid ${status.uid}, not ${uid}`,
    );
  }
  const mode = status.mode & 0o777;
  if (mode !== 0o700) {
    throw new SweepDomainError(
      `${sweepDomain} is mode ${mode.toString(8)}, not 700`,
    );
  }
}

/**
 * The start time of a live process, read from `ps`, at the one-second
 * resolution `lstart` reports.
 *
 * Three outcomes are distinguished because AC-0081 routes them differently:
 * a time (the process is live), `null` (`ps` determined the process is not
 * running — an empty result with no diagnostic), and `undefined` (the
 * comparison **could not be made**, which the sweep must treat as a decline
 * rather than as an absence).
 */
export function readProcessStartTime(pid: number): string | null | undefined {
  if (!Number.isInteger(pid) || pid <= 0) {
    return undefined;
  }
  try {
    const stdout = execFileSync(
      "/bin/ps",
      ["-o", "lstart=", "-p", String(pid)],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const text = stdout.trim();
    return text === "" ? null : text;
  } catch (cause) {
    // `ps` exits non-zero both for "no such process" and for a malformed
    // request. Only the first is a determination: it prints nothing at all.
    const failure = cause as { stdout?: string; stderr?: string };
    const out = (failure.stdout ?? "").trim();
    const err = (failure.stderr ?? "").trim();
    if (out === "" && err === "") {
      return null;
    }
    return undefined;
  }
}

/**
 * AC-0070, first half. `mkdtemp` inside the verified domain gives a state root
 * whose final component is unpredictable, and the four child paths are
 * **computed, not created**.
 *
 * The split exists because the two halves belong to different processes. The
 * Studio Service reserves the root so that it can name the per-request `HOME`
 * and `TMPDIR` in the child's pinned environment before the child exists; the
 * Runtime then writes its own marker and creates the children, because AC-0080
 * requires the marker to name the *owning* process. A marker naming the Service
 * would tie reclaim to the Service's lifetime rather than the request's.
 *
 * The window this opens — an empty, unmarked state root between `mkdtemp` and
 * the marker write — is the one AC-0080 explicitly sanctions and AC-0081's
 * third limb reclaims.
 */
export function reserveStateRoot(sweepDomain: string): PerRequestStateRoot {
  verifySweepDomain(sweepDomain);
  const stateRoot = mkdtempSync(join(sweepDomain, STATE_ROOT_PREFIX));
  // POSIX `mkdtemp` creates at 0700; setting it explicitly makes the mode an
  // asserted property of this code rather than of the platform.
  chmodSync(stateRoot, 0o700);
  return {
    stateRoot,
    materializationRoot: join(stateRoot, MATERIALIZATION_CHILD_NAME),
    home: join(stateRoot, HOME_CHILD_NAME),
    temporaryDirectory: join(stateRoot, TEMPORARY_CHILD_NAME),
    markerPath: join(stateRoot, OWNERSHIP_MARKER_NAME),
  };
}

/**
 * AC-0080. The ownership marker, written **before any other child exists** by a
 * single creating write: created exclusively (`wx`) and written once, so no
 * staging child is ever visible under the state root and no partially-renamed
 * file can be mistaken for a complete marker.
 *
 * The encoding is single-line JSON with the start time last. The property that
 * makes AC-0080's crash-window claim hold is **not** that no truncation parses
 * — the prefix that drops only the trailing newline parses to the complete
 * object. It is that every proper prefix of this write either fails to yield
 * both a process identity and a start time, which is AC-0081's second-limb
 * input, or yields *exactly* these values and so cannot misstate ownership.
 * `per-request-state-root.test.ts` asserts that over every prefix.
 */
export function writeOwnershipMarker(markerPath: string): OwnershipMarker {
  const startTime = readProcessStartTime(process.pid);
  if (typeof startTime !== "string" || startTime === "") {
    // Fail closed. A marker missing our own start time is AC-0081's second-limb
    // input, so writing one would make a root that is *live* reclaimable by age
    // rather than protected by the first limb's liveness refusal.
    throw new SweepDomainError(
      `the Runtime's own start time could not be read for pid ${process.pid}`,
    );
  }
  const marker: OwnershipMarker = { schema: 1, pid: process.pid, startTime };
  const handle = openSync(markerPath, "wx", 0o600);
  try {
    writeSync(handle, `${JSON.stringify(marker)}\n`);
  } finally {
    closeSync(handle);
  }
  return marker;
}

/** AC-0070, second half: the three children, each at `0700`, after the marker. */
export function createStateRootChildren(root: PerRequestStateRoot): void {
  for (const child of [
    root.materializationRoot,
    root.home,
    root.temporaryDirectory,
  ]) {
    mkdirSync(child, { mode: 0o700 });
    chmodSync(child, 0o700);
  }
}

/**
 * The whole sequence in one process. Production splits it across the Service
 * and the Runtime; tests and the sweep's own fixtures use this form, where the
 * marker correctly names the single process that owns the root.
 */
export function createPerRequestStateRoot(
  sweepDomain: string,
): PerRequestStateRoot {
  const root = reserveStateRoot(sweepDomain);
  writeOwnershipMarker(root.markerPath);
  createStateRootChildren(root);
  return root;
}

export interface RemovalDiagnostic {
  readonly path: string;
  readonly reason: string;
}

/**
 * AC-0076 and AC-0079. One removal of the state root takes the materialization,
 * the per-request `HOME`, the per-request `TMPDIR` and the marker with it.
 *
 * At every level the walk `lstat`s before it acts: a symbolic link is
 * **unlinked, never descended**, so a link planted anywhere in the tree can
 * neither redirect the walk nor cause anything outside the state root to be
 * removed. The marker is removed last (AC-0080), so no state root holding
 * content is ever unmarked — if removal fails part-way, what remains is still
 * a marked root the sweep can classify.
 *
 * Failures are collected rather than thrown so that one unremovable entry
 * cannot abandon the rest of the tree; AC-0083 requires each to surface as an
 * explicit diagnostic.
 */
export function removePerRequestStateRoot(
  stateRoot: string,
): readonly RemovalDiagnostic[] {
  const diagnostics: RemovalDiagnostic[] = [];
  const markerPath = join(stateRoot, OWNERSHIP_MARKER_NAME);

  const removeEntry = (path: string): void => {
    let status: ReturnType<typeof lstatSync>;
    try {
      status = lstatSync(path);
    } catch (cause) {
      diagnostics.push({ path, reason: `cannot be stated: ${cause}` });
      return;
    }
    if (status.isSymbolicLink()) {
      // Refuse to descend. Removing the link removes nothing it points at.
      try {
        unlinkSync(path);
      } catch (cause) {
        diagnostics.push({ path, reason: `link not unlinked: ${cause}` });
      }
      return;
    }
    if (status.isDirectory()) {
      let names: string[];
      try {
        names = readdirSync(path);
      } catch (cause) {
        diagnostics.push({ path, reason: `cannot be listed: ${cause}` });
        return;
      }
      for (const name of names) {
        removeEntry(join(path, name));
      }
      try {
        rmdirSync(path);
      } catch (cause) {
        diagnostics.push({ path, reason: `directory not removed: ${cause}` });
      }
      return;
    }
    try {
      unlinkSync(path);
    } catch (cause) {
      diagnostics.push({ path, reason: `not removed: ${cause}` });
    }
  };

  let names: string[];
  try {
    names = readdirSync(stateRoot);
  } catch (cause) {
    return [{ path: stateRoot, reason: `cannot be listed: ${cause}` }];
  }
  for (const name of names) {
    if (name === OWNERSHIP_MARKER_NAME) {
      continue;
    }
    removeEntry(join(stateRoot, name));
  }
  if (diagnostics.length > 0) {
    // Something under the root survived. The marker stays, because AC-0080's
    // guarantee is that no state root *holding content* is ever unmarked: an
    // unmarked non-empty root would satisfy no limb of AC-0081 and would be
    // retained forever rather than reclaimed on its next sweep.
    return diagnostics;
  }
  // Last child removed.
  try {
    unlinkSync(markerPath);
  } catch (cause) {
    const failure = cause as { code?: string };
    if (failure.code !== "ENOENT") {
      diagnostics.push({ path: markerPath, reason: `not removed: ${cause}` });
    }
  }
  try {
    rmdirSync(stateRoot);
  } catch (cause) {
    diagnostics.push({ path: stateRoot, reason: `root not removed: ${cause}` });
  }
  return diagnostics;
}
