import { spawn, spawnSync } from "node:child_process";
import { PROCESS_STATUS_EXECUTABLE } from "./executable-identity.js";

/**
 * The admitted process-status path, taken from the single constant the permitted
 * predicate compares against, so the launched path cannot drift from the admitted
 * one. This observer is the Service's parent-side read and sits outside AC-0023
 * and AC-0025's trial-tree scope per the 2026-09-17 scoping decision.
 */
const PS = PROCESS_STATUS_EXECUTABLE;
/**
 * A name in the environment block. Only an upper-case name opens or continues
 * the block, which is what separates the environment from the array below it.
 *
 * The residual is stated rather than implied: a lower-case environment name —
 * the specification names `http_proxy`, `https_proxy` and their variants — is
 * indistinguishable from that array and so is not visible in an observation. It
 * is covered instead by the spawn audit, which records the environment names at
 * every site Studio spawns from and is exhaustive over Studio's own
 * construction.
 */
const ENVIRONMENT_PAIR = /^([A-Z_][A-Z0-9_]*)=(.*)$/;

/**
 * On Darwin the kernel places a third string array after `argv` and `envp` —
 * `apple[]`, carrying `pfz`, `stack_guard`, `malloc_entropy`, `main_stack` and
 * their siblings — and `ps -E` prints it run together with the environment.
 * Every entry in it is lower-case, so the first one ends the environment block.
 * Without this the array is absorbed into the last environment value, which was
 * observed intermittently because `ps` truncates a long enough row before
 * reaching it.
 */
const KERNEL_STRING_ENTRY = /^[a-z_][a-z0-9_]*=/;

/**
 * Names a process writes into its own environment after `execve`, so they are
 * never names Studio handed it. `__CF_USER_TEXT_ENCODING` is written by
 * CoreFoundation at framework initialization; `__PYVENV_LAUNCHER__` is written
 * by the Homebrew `python3` launcher when it re-executes the framework binary
 * in place. Both were observed on this host against an environment built from
 * an empty object, so they are normalized out of an observation rather than
 * admitted to the allowlist. What Studio itself passes stays exhaustively
 * checkable through the spawn audit, which records the environment names at
 * every spawn site.
 */
export const SELF_INJECTED_ENVIRONMENT_NAMES = [
  "__CF_USER_TEXT_ENCODING",
  "__PYVENV_LAUNCHER__",
] as const;

export interface ObservedProcess {
  readonly pid: number;
  readonly ppid: number;
  readonly pgid: number;
  readonly residentBytes: number;
  readonly executable: string;
  readonly args: readonly string[];
  readonly defunct: boolean;
  /**
   * The row was read while the process was replacing its own image, so its
   * command and environment are not trustworthy. Its resident memory still
   * counts toward the group's aggregate.
   */
  readonly torn: boolean;
  readonly environment?: Record<string, string>;
  readonly selfInjectedNames?: readonly string[];
}

export interface GroupSample {
  readonly at: number;
  readonly aggregateResidentBytes: number;
  readonly residentBytesByPid: ReadonlyMap<number, number>;
  readonly processes: readonly ObservedProcess[];
}

function splitEnvironment(tokens: readonly string[]): {
  args: string[];
  environmentTokens: string[];
} {
  const boundary = tokens.findIndex(
    (token, index) => index >= 1 && ENVIRONMENT_PAIR.test(token),
  );
  if (boundary < 0) {
    return { args: tokens.slice(1), environmentTokens: [] };
  }
  return {
    args: tokens.slice(1, boundary),
    environmentTokens: tokens.slice(boundary),
  };
}

function parseEnvironmentTokens(tokens: readonly string[]): {
  environment: Record<string, string>;
  selfInjectedNames: string[];
} {
  const raw: Record<string, string> = {};
  let current: string | undefined;
  for (const token of tokens) {
    if (KERNEL_STRING_ENTRY.test(token)) {
      break;
    }
    const match = ENVIRONMENT_PAIR.exec(token);
    if (match?.[1] !== undefined) {
      current = match[1];
      raw[current] = match[2] ?? "";
      continue;
    }
    if (current !== undefined) {
      raw[current] = `${raw[current] ?? ""} ${token}`;
    }
  }
  const selfInjectedNames: string[] = [];
  for (const name of SELF_INJECTED_ENVIRONMENT_NAMES) {
    if (Object.hasOwn(raw, name)) {
      selfInjectedNames.push(name);
      delete raw[name];
    }
  }
  return { environment: raw, selfInjectedNames };
}

function parseRow(
  row: string,
  withEnvironment: boolean,
): ObservedProcess | undefined {
  const tokens = row.trim().split(/\s+/);
  const [pid, ppid, pgid, residentKib] = tokens.slice(0, 4).map(Number);
  if (
    pid === undefined ||
    ppid === undefined ||
    pgid === undefined ||
    residentKib === undefined ||
    !Number.isInteger(pid)
  ) {
    return undefined;
  }
  const command = tokens.slice(4);
  const executable = command[0] ?? "";
  const base = {
    pid,
    ppid,
    pgid,
    residentBytes: residentKib * 1024,
    executable,
    defunct: executable === "<defunct>",
  };
  if (!withEnvironment || base.defunct) {
    return {
      ...base,
      args: command.slice(1),
      torn: !base.defunct && !executable.startsWith("/"),
    };
  }
  const { args, environmentTokens } = splitEnvironment(command);
  const { environment, selfInjectedNames } =
    parseEnvironmentTokens(environmentTokens);
  // Every environment Studio constructs sets `PATH`, so a block without it was
  // read mid-`execve`. A production change that dropped `PATH` would empty the
  // observation rather than pass it, which keeps the allowlist falsifiable.
  const torn =
    !executable.startsWith("/") || !Object.hasOwn(environment, "PATH");
  if (torn) {
    return { ...base, args, torn };
  }
  return { ...base, args, torn, environment, selfInjectedNames };
}

function psArgs(pgid: number, withEnvironment: boolean): string[] {
  return [
    "-ww",
    "-o",
    "pid,ppid,pgid,rss,command",
    ...(withEnvironment ? ["-E"] : []),
    "-g",
    String(pgid),
  ];
}

function buildSample(
  stdout: string,
  at: number,
  withEnvironment: boolean,
): GroupSample {
  const processes = stdout
    .split("\n")
    .slice(1)
    .filter((row) => row.trim() !== "")
    .map((row) => parseRow(row, withEnvironment))
    .filter((observed): observed is ObservedProcess => observed !== undefined);
  const residentBytesByPid = new Map<number, number>();
  let aggregateResidentBytes = 0;
  for (const observed of processes) {
    residentBytesByPid.set(observed.pid, observed.residentBytes);
    aggregateResidentBytes += observed.residentBytes;
  }
  return { at, aggregateResidentBytes, residentBytesByPid, processes };
}

/**
 * Enumerates a whole process group from the parent. `-E` appends each process's
 * environment to its command, which is what makes AC-0023 and AC-0024
 * observable without the descendants cooperating.
 */
export function sampleProcessGroup(
  pgid: number,
  withEnvironment: boolean,
): GroupSample {
  const at = Date.now();
  const result = spawnSync(PS, psArgs(pgid, withEnvironment), {
    encoding: "utf8",
  });
  return buildSample(result.stdout ?? "", at, withEnvironment);
}

/**
 * The same enumeration, without blocking. One `ps` costs around twenty
 * milliseconds, which is longer than a descendant started solely to report its
 * version lives, so a synchronous sampler cannot reach the requested interval.
 * Overlapping the reads can: each snapshot still records the instant it was
 * taken.
 */
export function sampleProcessGroupAsync(
  pgid: number,
  withEnvironment: boolean,
): Promise<GroupSample> {
  const at = Date.now();
  const reader = spawn(PS, psArgs(pgid, withEnvironment), {
    stdio: ["ignore", "pipe", "ignore"],
  });
  let stdout = "";
  reader.stdout.setEncoding("utf8");
  reader.stdout.on("data", (chunk: string) => {
    stdout += chunk;
  });
  return new Promise((settle) => {
    reader.on("close", () => {
      settle(buildSample(stdout, at, withEnvironment));
    });
  });
}

export function processGroupExists(pgid: number): boolean {
  return (
    spawnSync(PS, ["-o", "pid", "-g", String(pgid)], { encoding: "utf8" })
      .status === 0
  );
}
