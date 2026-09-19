/**
 * The environment allowlist from the specification's *Canonical values*. Every
 * process Studio spawns for a trial inspection receives exactly these names at
 * exactly these values, and nothing else: the object is built from an empty
 * object rather than from `process.env`, so an ambient name cannot reach the
 * Runtime, the interpreter or `git`.
 */
export const ENVIRONMENT_ALLOWLIST_NAMES = [
  "PATH",
  "HOME",
  "TMPDIR",
  "LANG",
  "LC_ALL",
  "TZ",
  "GIT_TERMINAL_PROMPT",
  "GIT_CONFIG_GLOBAL",
  "GIT_CONFIG_SYSTEM",
  "GIT_CONFIG_NOSYSTEM",
  "GIT_ALLOW_PROTOCOL",
  "GIT_ASKPASS",
  "SSH_ASKPASS",
  // The Service may itself be an Electron binary started with this flag. The
  // child's environment is built closed, so it inherits nothing: without the
  // name here, `spawn(process.execPath, ...)` launches Electron as a GUI app
  // with the child script as an argument, and no Runtime ever starts. The
  // built product took that path while every test, running under plain node,
  // did not.
  "ELECTRON_RUN_AS_NODE",
] as const;

export const PINNED_PATH = "/usr/bin:/bin";

/**
 * `GIT_CONFIG_PARAMETERS` is the one conditional name. Studio never sets it;
 * `git` sets it on the helpers it re-executes, which is the only channel that
 * carries `-c` settings to a transport helper.
 */
export const CONDITIONAL_ENVIRONMENT_NAME = "GIT_CONFIG_PARAMETERS";

/**
 * Names the allowlist admits that the built environment carries only on some
 * hosts. `GIT_CONFIG_PARAMETERS` is set by `git` on the helpers it re-executes;
 * `ELECTRON_RUN_AS_NODE` is set only when this process is an Electron binary,
 * and is what makes the child spawn run as Node rather than launch a GUI.
 *
 * They are named rather than tolerated: a comparison that simply ignored
 * unexpected names would stop catching a name that should not be there, which
 * is the whole point of comparing the sets.
 */
export const HOST_CONDITIONAL_ENVIRONMENT_NAMES: readonly string[] = [
  CONDITIONAL_ENVIRONMENT_NAME,
  "ELECTRON_RUN_AS_NODE",
];

export interface PerRequestDirectories {
  /** The per-request `HOME`, a child of the per-request state root. */
  readonly home: string;
  /** The per-request `TMPDIR`, a sibling of the per-request `HOME`. */
  readonly temporaryDirectory: string;
}

export function buildPinnedEnvironment(
  directories: PerRequestDirectories,
): Record<string, string> {
  const environment: Record<string, string> = {};
  environment.PATH = PINNED_PATH;
  environment.HOME = directories.home;
  environment.TMPDIR = directories.temporaryDirectory;
  environment.LANG = "C";
  environment.LC_ALL = "C";
  // `LC_ALL` fixes the format a command renders and leaves the zone to the host,
  // so `ps -o lstart=` moves for an unchanged process when the host zone changes.
  // AC-0080's marker records that string and AC-0081's first limb compares it for
  // byte equality, so an unpinned zone turns a liveness comparison into a reclaim.
  environment.TZ = "UTC";
  environment.GIT_TERMINAL_PROMPT = "0";
  environment.GIT_CONFIG_GLOBAL = "/dev/null";
  environment.GIT_CONFIG_SYSTEM = "/dev/null";
  environment.GIT_CONFIG_NOSYSTEM = "1";
  environment.GIT_ALLOW_PROTOCOL = "https";
  environment.GIT_ASKPASS = "";
  environment.SSH_ASKPASS = "";
  // Only when this process is an Electron binary. On plain node the name is
  // absent rather than empty, so the pinned set stays exactly what the
  // determinism triple and the git rail describe.
  if (process.versions.electron !== undefined) {
    environment.ELECTRON_RUN_AS_NODE = "1";
  }
  return environment;
}
