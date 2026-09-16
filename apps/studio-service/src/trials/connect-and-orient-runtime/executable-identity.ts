import { spawnSync } from "node:child_process";
import { dirname, isAbsolute, join, resolve } from "node:path";

/**
 * One record per process Studio's own code starts. It is the exhaustive leg of
 * AC-0025: sampling observes what ran, but only the audit can show that no
 * spawn site in Studio's code names a non-permitted executable, a relative
 * path, a shell string, or an environment beyond the allowlist.
 */
export interface SpawnAuditEntry {
  readonly executable: string;
  readonly args: readonly string[];
  readonly environmentNames: readonly string[];
  readonly shell: false;
  readonly pid?: number;
}

export interface ProbeResult {
  readonly stdout: string;
  readonly status: number | null;
}

/**
 * The Studio Service's only process-start primitive for this trial. It takes an
 * argument array, refuses a relative executable, and never enables a shell,
 * which is AC-0020 enforced at the single site rather than asserted per caller.
 */
export function spawnAudited(
  executable: string,
  args: readonly string[],
  environment: Record<string, string>,
  audit: SpawnAuditEntry[],
): ProbeResult {
  if (!isAbsolute(executable)) {
    throw new Error(`executable must be an absolute path: ${executable}`);
  }
  const result = spawnSync(executable, [...args], {
    encoding: "utf8",
    env: environment,
    shell: false,
  });
  audit.push({
    executable,
    args: [...args],
    environmentNames: Object.keys(environment),
    shell: false,
    ...(typeof result.pid === "number" ? { pid: result.pid } : {}),
  });
  return { stdout: result.stdout ?? "", status: result.status };
}

/**
 * `/usr/bin/git` is a Command Line Tools shim that re-executes through `xcrun`.
 * It is spawned once, by the Studio Service and outside the Runtime's process
 * group, solely to report the exec-path from which the real binary is derived.
 */
export const GIT_RESOLUTION_ENTRY = "/usr/bin/git";

export const PYTHON_INTERPRETER_SEARCH_LIST = [
  "/opt/homebrew/bin/python3",
  "/usr/local/bin/python3",
  "/usr/bin/python3",
] as const;

export const MINIMUM_INTERPRETER_VERSION: readonly [number, number] = [3, 11];

export interface GitIdentity {
  /** The absolute path of the real binary, derived from the exec-path. */
  readonly executable: string;
  /** Recorded once here and never re-read at a later spawn (AC-0026). */
  readonly execPath: string;
  /** The `git version` line the resolved binary reports. */
  readonly version: string;
}

export type GitIdentityResolution =
  | ({ ok: true } & GitIdentity)
  | { ok: false; code: "no-exec-path" | "no-version" | "exec-path-moved" };

/**
 * Resolves `git` past the shim: the exec-path names `libexec/git-core`, whose
 * `../bin/git` is the real binary. The derived path is then required to report
 * a `git version` line and the same exec-path, which is the identity check in
 * *Canonical values*. Both probes run under the supplied pinned environment.
 */
export function resolveGitIdentity(
  environment: Record<string, string>,
  audit: SpawnAuditEntry[],
  resolutionEntry: string = GIT_RESOLUTION_ENTRY,
): GitIdentityResolution {
  const derivation = spawnAudited(
    resolutionEntry,
    ["--exec-path"],
    environment,
    audit,
  );
  const derivedFrom = derivation.stdout.trim();
  if (derivation.status !== 0 || !isAbsolute(derivedFrom)) {
    return { ok: false, code: "no-exec-path" };
  }

  const executable = resolve(join(derivedFrom, "..", "..", "bin", "git"));
  const reportedVersion = spawnAudited(
    executable,
    ["--version"],
    environment,
    audit,
  );
  const version = reportedVersion.stdout.trim();
  if (reportedVersion.status !== 0 || !version.startsWith("git version ")) {
    return { ok: false, code: "no-version" };
  }

  const recorded = spawnAudited(
    executable,
    ["--exec-path"],
    environment,
    audit,
  );
  const execPath = recorded.stdout.trim();
  if (recorded.status !== 0 || execPath !== derivedFrom) {
    return { ok: false, code: "exec-path-moved" };
  }
  return { ok: true, executable, execPath, version };
}

export interface PermittedExecutables {
  readonly gitExecutable: string;
  readonly gitExecPath: string;
  readonly interpreterSearchList: readonly string[];
  readonly runtimeNodeExecutable: string;
}

/**
 * The *Permitted executables* row, as a predicate over one observed image path.
 * A process that re-executed itself in place keeps its own process start, so
 * callers pair this with the spawn audit rather than widening the row.
 */
export function isPermittedExecutable(
  path: string,
  permitted: PermittedExecutables,
): boolean {
  return (
    path === permitted.runtimeNodeExecutable ||
    path === permitted.gitExecutable ||
    dirname(path) === permitted.gitExecPath ||
    permitted.interpreterSearchList.includes(path)
  );
}
