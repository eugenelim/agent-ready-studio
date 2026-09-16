/**
 * The trial Runtime child entrypoint. It is started by the Studio Service as a
 * process-group leader with an environment built from an empty object, and it
 * receives everything it needs as one JSON argument.
 *
 * This module deliberately imports nothing but `node:` builtins. Node runs it
 * by stripping types, and type stripping does not rewrite import specifiers, so
 * a relative import of a sibling `.ts` module would not resolve at run time.
 * The canonical values it needs — the pinned `git` configuration, the
 * interpreter search list, the allowlist names — are therefore delivered in the
 * plan by the Service, which keeps one source of truth for each of them.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { isAbsolute } from "node:path";

interface RuntimeChildPlan {
  readonly requestId: string;
  readonly materializationRoot: string;
  readonly gitExecutable: string;
  readonly gitConfigurationArgs: readonly string[];
  readonly environmentNames: readonly string[];
  readonly interpreterSearchList: readonly string[];
  readonly minimumInterpreterVersion: readonly [number, number];
  readonly initializeMaterialization: boolean;
  readonly inspectionDeadlineMs: number;
  readonly holdMs?: number;
  /**
   * Starts one further `git` process from the pinned vector, in the
   * materialization root, and holds it open for this many milliseconds. Two
   * parent-side obligations need a descendant that is alive when the parent
   * looks: reading a descendant's environment from `ps`, and observing that a
   * group signal reaches a descendant rather than only the child. A version
   * probe lives for tens of milliseconds, which is shorter than one `ps` read
   * costs. `cat-file --batch` blocks on its standard input instead, so it stays
   * live until its stdin closes or its group is signalled. It carries the same
   * pinned vector and the same environment as every other descendant; only its
   * lifetime differs.
   */
  readonly descendantHoldMs?: number;
}

interface ChildSpawnAuditEntry {
  readonly executable: string;
  readonly args: readonly string[];
  readonly environmentNames: readonly string[];
  readonly shell: false;
  readonly pid?: number;
}

const plan = JSON.parse(process.argv[2] ?? "{}") as RuntimeChildPlan;

/**
 * The environment for every descendant, rebuilt from an empty object using the
 * allowlist names the plan carries. Rebuilding rather than forwarding
 * `process.env` is what keeps a name the Runtime itself might acquire from
 * reaching `git` or the interpreter.
 */
const descendantEnvironment: Record<string, string> = {};
for (const name of plan.environmentNames) {
  descendantEnvironment[name] = process.env[name] ?? "";
}

function protocol(message: Record<string, unknown>): void {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

/**
 * Each process start is reported as it happens rather than batched at the end,
 * so the audit survives a group signal that arrives mid-phase.
 */
function recordSpawn(entry: ChildSpawnAuditEntry): void {
  protocol({ type: "spawn", entry });
}

function diagnostic(text: string): void {
  if (text.trim() === "") {
    return;
  }
  process.stderr.write(`${text.replace(/\n+$/, "")}\n`);
}

/**
 * The single process-start site in the Runtime. Descendant stdout is captured
 * on its own pipe and relayed to diagnostics, never inherited: that is why no
 * descendant can write to the Runtime's protocol stdout (AC-0019).
 */
function run(
  executable: string,
  args: readonly string[],
  options: { readonly cwd?: string } = {},
): { status: number | null; stdout: string; stderr: string } {
  if (!isAbsolute(executable)) {
    throw new Error(`executable must be an absolute path: ${executable}`);
  }
  const result = spawnSync(executable, [...args], {
    ...(options.cwd === undefined ? {} : { cwd: options.cwd }),
    encoding: "utf8",
    env: descendantEnvironment,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });
  recordSpawn({
    executable,
    args: [...args],
    environmentNames: Object.keys(descendantEnvironment),
    shell: false,
    ...(typeof result.pid === "number" ? { pid: result.pid } : {}),
  });
  diagnostic(result.stdout ?? "");
  diagnostic(result.stderr ?? "");
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

/**
 * The remote phase is supervised rather than blocking: the Runtime keeps its
 * event loop free while a transport helper is alive, so its own deadline can
 * still signal the group the helper belongs to.
 */
async function runSupervised(
  executable: string,
  args: readonly string[],
  options: { readonly cwd?: string; readonly holdStdinMs?: number } = {},
): Promise<{ status: number | null; signal: string | null }> {
  if (!isAbsolute(executable)) {
    throw new Error(`executable must be an absolute path: ${executable}`);
  }
  const holds = options.holdStdinMs !== undefined;
  const child = spawn(executable, [...args], {
    ...(options.cwd === undefined ? {} : { cwd: options.cwd }),
    env: descendantEnvironment,
    shell: false,
    stdio: [holds ? "pipe" : "ignore", "pipe", "pipe"],
  });
  if (holds && child.stdin !== null) {
    setTimeout(() => {
      child.stdin?.end();
    }, options.holdStdinMs);
  }
  recordSpawn({
    executable,
    args: [...args],
    environmentNames: Object.keys(descendantEnvironment),
    shell: false,
    ...(typeof child.pid === "number" ? { pid: child.pid } : {}),
  });
  for (const stream of [child.stdout, child.stderr]) {
    stream?.setEncoding("utf8");
    stream?.on("data", (chunk: string) => {
      diagnostic(chunk);
    });
  }
  return await new Promise((settle) => {
    child.on("exit", (status, signal) => {
      settle({ status, signal });
    });
  });
}

function resolveInterpreter(): {
  executable?: string;
  version?: string;
  probes: { path: string; version?: string; conforming: boolean }[];
} {
  const probes: { path: string; version?: string; conforming: boolean }[] = [];
  const [minimumMajor, minimumMinor] = plan.minimumInterpreterVersion;
  for (const candidate of plan.interpreterSearchList) {
    if (!existsSync(candidate)) {
      probes.push({ path: candidate, conforming: false });
      continue;
    }
    const reported = run(candidate, ["-V"]);
    const text = `${reported.stdout}${reported.stderr}`.trim();
    const match = /^Python (\d+)\.(\d+)/.exec(text);
    const major = Number(match?.[1]);
    const minor = Number(match?.[2]);
    if (!Number.isInteger(major) || !Number.isInteger(minor)) {
      probes.push({ path: candidate, conforming: false });
      continue;
    }
    const conforming =
      major > minimumMajor || (major === minimumMajor && minor >= minimumMinor);
    probes.push({ path: candidate, version: text, conforming });
    if (conforming) {
      return { executable: candidate, version: text, probes };
    }
  }
  return { probes };
}

function gitVector(...args: readonly string[]): string[] {
  return [...plan.gitConfigurationArgs, ...args];
}

/**
 * Starts a descendant that is held by a timer rather than by a pipe, and does
 * not wait for it. A descendant held on the Runtime's own standard input exits
 * by itself the moment the Runtime does, which makes "the group was signalled"
 * indistinguishable from "the Runtime died and took its pipes with it". This
 * one survives the Runtime, so only a signal that reaches the whole group
 * clears it. The interpreter is used because it is the one permitted executable
 * that can block on a timer.
 */
function holdIndependentDescendant(
  interpreter: string,
  holdMs: number,
): ReturnType<typeof spawn> {
  const args = ["-c", `import time;time.sleep(${holdMs / 1000})`];
  const held = spawn(interpreter, args, {
    env: descendantEnvironment,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });
  recordSpawn({
    executable: interpreter,
    args,
    environmentNames: Object.keys(descendantEnvironment),
    shell: false,
    ...(typeof held.pid === "number" ? { pid: held.pid } : {}),
  });
  for (const stream of [held.stdout, held.stderr]) {
    stream?.setEncoding("utf8");
    stream?.on("data", (chunk: string) => {
      diagnostic(chunk);
    });
  }
  return held;
}

async function main(): Promise<void> {
  protocol({
    type: "started",
    requestId: plan.requestId,
    pid: process.pid,
    executable: process.execPath,
  });

  // The Runtime owns the inspection deadline, and it signals its whole group
  // rather than itself, so a descendant cannot outlive the deadline.
  const deadline = setTimeout(() => {
    diagnostic(`inspection deadline of ${plan.inspectionDeadlineMs}ms reached`);
    process.kill(-process.pid, "SIGKILL");
  }, plan.inspectionDeadlineMs);
  deadline.unref();

  const interpreter = resolveInterpreter();
  protocol({ type: "interpreter", ...interpreter });

  if (plan.initializeMaterialization) {
    const args = gitVector("init", "--quiet", "--", plan.materializationRoot);
    const initialized = run(plan.gitExecutable, args, {
      cwd: plan.materializationRoot,
    });
    protocol({
      type: "git",
      phase: "initialize",
      status: initialized.status,
      args,
    });
  }

  let independent: ReturnType<typeof spawn> | undefined;
  if (plan.descendantHoldMs !== undefined) {
    if (interpreter.executable !== undefined) {
      independent = holdIndependentDescendant(
        interpreter.executable,
        plan.descendantHoldMs,
      );
    }
    const args = gitVector("cat-file", "--batch");
    const held = await runSupervised(plan.gitExecutable, args, {
      cwd: plan.materializationRoot,
      holdStdinMs: plan.descendantHoldMs,
    });
    protocol({
      type: "git",
      phase: "held-descendant",
      status: held.status,
      args,
    });
  }

  if (plan.holdMs !== undefined && plan.holdMs > 0) {
    await new Promise((settle) => {
      setTimeout(settle, plan.holdMs);
    });
  }

  // Reached only when the Runtime completes normally, so the descendant that
  // would otherwise outlive it is reaped here rather than left for the group
  // signal that a normal completion does not send.
  independent?.kill("SIGKILL");
  clearTimeout(deadline);
  protocol({ type: "completed", requestId: plan.requestId });
}

await main();
