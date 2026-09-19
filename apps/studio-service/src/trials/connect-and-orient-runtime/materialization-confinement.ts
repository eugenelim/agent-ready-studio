/**
 * The confinement helper every reader Studio authors shares.
 *
 * Three obligations meet here because they are decided at the same moment — the
 * instant before a byte of repository content is read:
 *
 * - **AC-0073.** No byte is read from a file that is not, at the moment of
 *   reading, inside the materialization root. Containment is compared against
 *   the file's **resolved real path** on a **path-segment boundary**, so a
 *   sibling whose name merely extends the root — `…/tree-evil` against
 *   `…/tree` — is outside it, and no unresolved link reaches inside it.
 * - **AC-0074.** A non-regular file is refused, including a device file, a
 *   FIFO and a socket.
 * - **AC-0075.** A file exceeding the single-file bound is refused, **checked
 *   before the read** rather than after it, so the bound holds against the file
 *   rather than against what a read happened to return.
 *
 * Sharing one helper is what makes the three properties hold for every reader
 * rather than for the readers whose authors remembered them.
 */
import {
  closeSync,
  openSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import { sep } from "node:path";

/**
 * The per-file bound from the specification's *Resource bounds*,
 * *Declared-value read* row: 2 files, 1 MiB each.
 */
export const SINGLE_FILE_BOUND_BYTES = 1024 * 1024;

/** Why a read was refused. The Runtime reports the class, never the bytes. */
export type ConfinementRefusal =
  | "outside-materialization-root"
  | "not-regular-file"
  | "exceeds-single-file-bound"
  | "unreadable";

export class ConfinementError extends Error {
  readonly refusal: ConfinementRefusal;

  constructor(refusal: ConfinementRefusal, detail: string) {
    super(`${refusal}: ${detail}`);
    this.name = "ConfinementError";
    this.refusal = refusal;
  }
}

/**
 * True when `candidateRealPath` is the root itself or lies beneath it on a
 * segment boundary. Both arguments must already be resolved real paths; the
 * comparison is pure string work so that it can be reasoned about and tested
 * without a filesystem.
 */
export function containsOnSegmentBoundary(
  rootRealPath: string,
  candidateRealPath: string,
): boolean {
  if (candidateRealPath === rootRealPath) {
    return true;
  }
  return candidateRealPath.startsWith(
    rootRealPath.endsWith(sep) ? rootRealPath : `${rootRealPath}${sep}`,
  );
}

/**
 * Resolves `candidate` and proves it is inside `materializationRoot`. Both
 * sides are resolved before they are compared: resolving only the root would
 * let an unresolved link inside the root name a target outside it, and
 * resolving only the candidate would fail wherever the root itself is reached
 * through a link, which is the ordinary case under `/var` on Darwin.
 */
export function resolveContainedPath(
  materializationRoot: string,
  candidate: string,
): string {
  let rootRealPath: string;
  try {
    rootRealPath = realpathSync(materializationRoot);
  } catch (cause) {
    throw new ConfinementError(
      "unreadable",
      `materialization root ${materializationRoot}: ${String(cause)}`,
    );
  }
  let candidateRealPath: string;
  try {
    candidateRealPath = realpathSync(candidate);
  } catch (cause) {
    throw new ConfinementError("unreadable", `${candidate}: ${String(cause)}`);
  }
  if (!containsOnSegmentBoundary(rootRealPath, candidateRealPath)) {
    throw new ConfinementError(
      "outside-materialization-root",
      `${candidateRealPath} is not inside ${rootRealPath}`,
    );
  }
  return candidateRealPath;
}

/**
 * The single read path for repository content. The order is load-bearing:
 * containment, then file kind, then size, and only then the read. Checking size
 * before opening is what AC-0075 requires; opening first and truncating would
 * satisfy the letter and lose the bound against a file that grows.
 */
export function readContainedFile(
  materializationRoot: string,
  candidate: string,
  boundBytes: number = SINGLE_FILE_BOUND_BYTES,
): string {
  const realPath = resolveContainedPath(materializationRoot, candidate);
  // `realpathSync` has already collapsed every link, so this cannot be a
  // symbolic link and `statSync` reports the file itself.
  const status = statSync(realPath);
  if (!status.isFile()) {
    throw new ConfinementError(
      "not-regular-file",
      `${realPath} is not a regular file`,
    );
  }
  if (status.size > boundBytes) {
    throw new ConfinementError(
      "exceeds-single-file-bound",
      `${realPath} is ${status.size} bytes, bound is ${boundBytes}`,
    );
  }
  // Opening without `O_NOFOLLOW` is safe only because the path is a resolved
  // real path that was just proven contained and regular.
  const handle = openSync(realPath, "r");
  try {
    return readFileSync(handle, "utf8");
  } finally {
    // `readFileSync` over a descriptor does not close it.
    closeSync(handle);
  }
}
