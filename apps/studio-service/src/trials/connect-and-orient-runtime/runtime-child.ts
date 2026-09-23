/**
 * The trial Runtime child entrypoint. It is started by the Studio Service as a
 * process-group leader with an environment built from an empty object, and it
 * receives everything it needs as named arguments on its vector.
 *
 * This module deliberately imports nothing but `node:` builtins. Node runs it
 * by stripping types, and type stripping does not rewrite import specifiers, so
 * a relative import of a sibling `.js` specifier does not resolve at run time,
 * and the `.ts` specifier that would is refused by this project's tsconfig.
 * The canonical values it needs — the pinned `git` configuration, the
 * interpreter search list, the allowlist names, the state-root child names —
 * are therefore delivered in the plan by the Service, which keeps one source of
 * truth for each of them, and the mechanics are reimplemented here rather than
 * imported.
 *
 * One canonical value is held here as a literal instead: `PS_EXECUTABLE`. It is
 * an exception rather than an oversight, and it is safe for a specific reason —
 * every spawn this module performs is recorded in the audit AC-0025's second leg
 * reads, so a literal that drifted from the *Permitted executables* row would
 * redden that leg rather than pass silently. A value with no such check must go
 * in the plan.
 */
import { spawn, spawnSync } from "node:child_process";
import {
  chmodSync,
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import { isAbsolute, join } from "node:path";

interface RuntimeChildPlan {
  readonly requestId: string;
  /** Reserved by the Service; its children are created here, after the marker. */
  readonly stateRoot: string;
  readonly ownershipMarkerName: string;
  /**
   * Identifies the environment this build renders liveness tokens under.
   * Delivered rather than duplicated, for the reason in the module header.
   * Written into every marker this Runtime claims, and required to match
   * before a persisted token is compared: see the sweep's limb 1 below.
   */
  readonly livenessTokenConvention: string;
  readonly materializationChildName: string;
  readonly homeChildName: string;
  readonly temporaryChildName: string;
  readonly gitExecutable: string;
  readonly gitConfigurationArgs: readonly string[];
  readonly environmentNames: readonly string[];
  readonly interpreterSearchList: readonly string[];
  readonly minimumInterpreterVersion: readonly [number, number];
  readonly initializeMaterialization: boolean;
  /**
   * The revision to materialize, when one is supplied. Fetching and checking
   * out happen **here** rather than in the Service: the tree is untrusted
   * content, and the Service having written it would make the boundary's
   * central isolation claim false.
   */
  readonly revision?: {
    readonly fetchUrl: string;
    readonly resolvedSha: string;
  };
  readonly inspectionDeadlineMs: number;
  /** *Resource bounds*, *Resolution wall-clock*. Owned by the Runtime. */
  readonly resolutionDeadlineMs: number;
  /** *Resource bounds*, *Materialized file count*. */
  readonly fileCountBound: number;
  /** The interval the file-count bound is enforced on, from the same row. */
  readonly fileCountSamplingIntervalMs: number;
  /**
   * Holds the resolution subprocess open for this long, so the resolution
   * deadline can be observed firing against a subprocess that is still alive.
   * Production never sets it: a real `ls-remote` ends when the remote answers.
   */
  readonly resolutionHoldMs?: number;
  /**
   * Starts a descendant that writes files into the materialization root, so
   * the file-count sampler has a writer to race. Production never sets it —
   * the writer there is `git checkout`, which this host cannot reach without a
   * network, and the sampler observes the tree rather than the writer, so what
   * writes the files does not change what the bound observes.
   */
  /**
   * Bytes to write on stdout or stderr so the Service's AC-0037 and AC-0155
   * bounds have something to refuse and elide. Production never sets either,
   * on the precedent `materializationWriter` sets below.
   */
  readonly noiseStdoutBytes?: number;
  readonly noiseStderrBytes?: number;
  /**
   * Lines to write verbatim on stdout, so the Service's northbound parse
   * guards have something to refuse that a well-formed protocol line cannot
   * express. Production never sets it, on the precedent `noiseStdoutBytes`
   * sets for exactly this purpose.
   */
  readonly rawStdoutLines?: readonly string[];
  readonly materializationWriter?: {
    readonly files: number;
    readonly intervalMs: number;
  };
  /** *Resource bounds*, *Markerless-reclaim age*. Delivered, not duplicated. */
  readonly markerlessReclaimAgeMs: number;
  /** Whether the Service is invoking the sweep on this inspection (AC-0082). */
  readonly sweepOnStart?: boolean;
  readonly holdMs?: number;
  /**
   * Keeps the per-request state root on disk after the response, so a test can
   * read what was materialized. Production never sets it: AC-0079 requires the
   * root to be removed on success, on failure and on a termination signal.
   */
  readonly retainStateRoot?: boolean;
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
  /**
   * *Canonical values*, *Permitted read surface*, delivered rather than
   * duplicated for the reason in the module header: the child cannot import
   * the reader that owns this list, so the Service ships it and the child
   * enforces it. A name is admitted only by being in this set, which is also
   * what confines the read -- no separator, `..` or absolute path survives an
   * exact match against two literal file names.
   */
  readonly declaredReadSurface: readonly string[];
  /** *Resource bounds*, *Declared-value read*: file count, then bytes each. */
  readonly declaredReadFileBound: number;
  readonly declaredReadByteBound: number;
  /**
   * The names to read, when they differ from the whole surface. A test sets it
   * to reach AC-0054's refusal and AC-0055's file-count bound against the live
   * path; production leaves it absent and the whole surface is read.
   */
  readonly declaredReadNames?: readonly string[];
  /**
   * Declaration files to write into the materialization root before the
   * declared read, as name to contents. Production never sets it: the files
   * there are whatever `git checkout` wrote. A test sets it because the root's
   * final component is unpredictable by design, so a test cannot place a file
   * there itself -- the same reason `materializationWriter` exists.
   *
   * `repeat` renders the contents that many times, so a test can exceed a byte
   * bound without carrying the bytes through the argument vector.
   */
  readonly declaredFixtures?: readonly {
    readonly name: string;
    readonly contents?: string;
    readonly repeat?: number;
    /** Creates a directory at the name instead of a file. */
    readonly directory?: boolean;
  }[];
}

interface ChildSpawnAuditEntry {
  readonly executable: string;
  readonly args: readonly string[];
  readonly environmentNames: readonly string[];
  readonly shell: false;
  readonly pid?: number;
}

/**
 * The argument vector is read by name rather than by position. AC-0071 requires
 * the sweep domain to arrive as a named argument, and reading the plan the same
 * way keeps one rule for the whole vector.
 */
function namedArgument(name: string): string | undefined {
  const at = process.argv.indexOf(name);
  return at === -1 ? undefined : process.argv[at + 1];
}

const sweepDomain = namedArgument("--sweep-domain");
const plan = JSON.parse(namedArgument("--plan") ?? "{}") as RuntimeChildPlan;

/** Admitted by *Permitted executables* as of the 2026-09-17 amendment. */
const PS_EXECUTABLE = "/bin/ps";

const materializationRoot = join(plan.stateRoot, plan.materializationChildName);

/**
 * AC-0080, then AC-0070. The marker is the first child of the state root to
 * exist: created exclusively and written once, before the three directories.
 * It names *this* process, which is what ties reclaim to the request's lifetime
 * rather than the Service's.
 */
function processStartTime(pid: number): string | null | undefined {
  if (!Number.isInteger(pid) || pid <= 0) {
    return undefined;
  }
  const args = ["-o", "lstart=", "-p", String(pid)];
  const read = spawnSync(PS_EXECUTABLE, args, {
    encoding: "utf8",
    // AC-0023: every descendant's environment is the rebuilt allowlist, not
    // whatever this process happens to carry.
    env: descendantEnvironment,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });
  // AC-0025's second leg is the exhaustive record of every spawn Studio's own
  // code performs. `ps` lives about 20 ms, under the floor at which the
  // parent's sampler can see a process at all, so this record is the only leg
  // that can account for it.
  recordSpawn({
    executable: PS_EXECUTABLE,
    args,
    environmentNames: Object.keys(descendantEnvironment),
    shell: false,
    ...(typeof read.pid === "number" ? { pid: read.pid } : {}),
  });
  const out = (read.stdout ?? "").trim();
  if (read.status === 0) {
    return out === "" ? null : out;
  }
  // A non-zero exit with nothing on either stream is a determination that the
  // process is absent. Anything on stderr means the comparison could not be
  // made, which the sweep must treat as a decline rather than an absence.
  return out === "" && (read.stderr ?? "").trim() === "" ? null : undefined;
}

function claimStateRoot(): void {
  const startTime = processStartTime(process.pid);
  if (typeof startTime !== "string" || startTime === "") {
    throw new Error(`the Runtime's own start time could not be read`);
  }
  // The plan is parsed, not validated, so an absent convention would fail
  // silently in both directions at once: the writer would emit no convention,
  // and the sweep's comparison would be `undefined === undefined`, which
  // treats every pre-pin marker as comparable -- re-arming the deletion this
  // field exists to prevent. Fail closed here, at the same seam the start-time
  // read uses, so a missing field stops the Runtime rather than the guard.
  if (
    typeof plan.livenessTokenConvention !== "string" ||
    plan.livenessTokenConvention === ""
  ) {
    throw new Error(`the plan delivered no liveness token convention`);
  }
  // The age bound gates every destructive limb, and it fails open rather than
  // closed if it is missing: `now - modifiedAt <= undefined` is `false`, so an
  // absent bound does not retain a young candidate, it reclaims it on sight --
  // including a root another request reserved seconds ago, in the window
  // between `mkdtemp` and its marker, which that gate is the only protection
  // for. The Service-side reader defaults this value; the child has no default,
  // so it refuses instead.
  if (
    typeof plan.markerlessReclaimAgeMs !== "number" ||
    !Number.isFinite(plan.markerlessReclaimAgeMs) ||
    plan.markerlessReclaimAgeMs < 0
  ) {
    throw new Error(`the plan delivered no markerless reclaim age`);
  }
  const marker = {
    schema: 2,
    pid: process.pid,
    startTime,
    tokenConvention: plan.livenessTokenConvention,
  };
  const handle = openSync(
    join(plan.stateRoot, plan.ownershipMarkerName),
    "wx",
    0o600,
  );
  try {
    writeSync(handle, `${JSON.stringify(marker)}\n`);
  } finally {
    closeSync(handle);
  }
  for (const name of [
    plan.materializationChildName,
    plan.homeChildName,
    plan.temporaryChildName,
  ]) {
    mkdirSync(join(plan.stateRoot, name), { mode: 0o700 });
    chmodSync(join(plan.stateRoot, name), 0o700);
  }
}

/**
 * AC-0079, with AC-0076's discipline. One removal of the state root takes the
 * materialization, the per-request `HOME`, the per-request `TMPDIR` and the
 * marker with it, and it runs on success, on failure and on a termination
 * signal alike.
 *
 * At every level the walk `lstat`s before it acts, so a link is unlinked rather
 * than descended and nothing outside the root is reachable. The marker is
 * removed last, and is kept if anything under the root survived, because an
 * unmarked root still holding content satisfies no limb of the sweep and would
 * never be reclaimed.
 *
 * This mirrors `per-request-state-root.ts` rather than importing it: the child
 * cannot import a sibling module, which is why the names it needs travel in the
 * plan.
 */
function removeRoot(root: string): boolean {
  let intact = true;
  const removeEntry = (path: string): void => {
    let status: ReturnType<typeof lstatSync>;
    try {
      status = lstatSync(path);
    } catch {
      intact = false;
      return;
    }
    try {
      if (status.isSymbolicLink()) {
        unlinkSync(path);
        return;
      }
      if (status.isDirectory()) {
        for (const name of readdirSync(path)) {
          removeEntry(join(path, name));
        }
        rmdirSync(path);
        return;
      }
      unlinkSync(path);
    } catch {
      intact = false;
    }
  };

  const markerPath = join(root, plan.ownershipMarkerName);
  try {
    for (const name of readdirSync(root)) {
      if (name !== plan.ownershipMarkerName) {
        removeEntry(join(root, name));
      }
    }
  } catch {
    return false;
  }
  if (!intact) {
    return false;
  }
  try {
    if (existsSync(markerPath)) {
      unlinkSync(markerPath);
    }
    rmdirSync(root);
  } catch {
    return false;
  }
  return true;
}

/**
 * AC-0081 and AC-0083, performed here rather than in the Service.
 *
 * AC-0082 says the Studio Service *invokes* the sweep, and the boundary says
 * the Service opens no path under a materialization root. Reclaiming a root
 * means descending its `tree` child to remove it, so the sweep has to run on
 * this side of the boundary; the Service's invocation is the `--sweep-domain`
 * argument and the flag in the plan. This mirrors `sweep.ts` for the same
 * reason disposal does: the child cannot import a sibling module.
 */
function sweep(domain: string): void {
  let names: string[];
  try {
    names = readdirSync(domain);
  } catch (cause) {
    diagnostic(`sweep domain could not be listed: ${cause}`);
    return;
  }
  const uid = process.getuid?.();
  const now = Date.now();
  const outcomes: Record<string, unknown>[] = [];

  for (const name of names) {
    const candidate = join(domain, name);
    if (candidate === plan.stateRoot) {
      continue; // our own root, held by the marker we just wrote
    }
    let status: ReturnType<typeof lstatSync>;
    try {
      status = lstatSync(candidate);
    } catch {
      continue;
    }
    // The entry gate, observed without following a link.
    if (
      status.isSymbolicLink() ||
      !status.isDirectory() ||
      (uid !== undefined && status.uid !== uid) ||
      (status.mode & 0o777) !== 0o700
    ) {
      continue;
    }

    // The marker read carries the candidate's own discipline: no link, no
    // non-regular file.
    const markerPath = join(candidate, plan.ownershipMarkerName);
    let marker:
      | { pid?: unknown; startTime?: unknown; tokenConvention?: unknown }
      | undefined;
    let markerPresent = false;
    try {
      const markerStatus = lstatSync(markerPath);
      markerPresent = true;
      if (!markerStatus.isSymbolicLink() && markerStatus.isFile()) {
        marker = JSON.parse(readFileSync(markerPath, "utf8"));
      }
    } catch {
      // Absent leaves `markerPresent` false; unusable leaves `marker` undefined.
    }
    const pid = marker?.pid;
    const startTime = marker?.startTime;
    const complete =
      typeof pid === "number" &&
      Number.isInteger(pid) &&
      pid > 0 &&
      typeof startTime === "string" &&
      // Same predicate as the Service-side reader's `readMarker`: a
      // whitespace-only start time is partial, not complete. Both paths now
      // gate the convention comparison behind this, so they must agree.
      startTime.trim() !== "";

    // A token rendered under another build's convention -- or under none,
    // which is what a marker predating the pin carries -- cannot be compared
    // against a rendering from this one.
    const comparable = marker?.tokenConvention === plan.livenessTokenConvention;

    if (complete) {
      // Limb 1 carries no age gate.
      const live = processStartTime(pid as number);
      if (live === undefined) {
        outcomes.push({
          name,
          action: "declined",
          limb: 1,
          inputClass: "process-liveness",
        });
        continue;
      }
      // An incomparable token cannot be checked against the live rendering, so
      // a non-null read says only that some process holds the recorded pid,
      // not that it is the one the marker names -- start time is what
      // separates those, and it is what cannot be compared. A recycled pid
      // would otherwise hold this root forever, so the decline is also bounded
      // by the candidate's age. No Runtime can legitimately outlive it: the
      // timer armed below SIGKILLs this whole group at the inspection
      // deadline, and the reclaim age is far longer than that.
      if (!comparable) {
        const modifiedAt = status.mtimeMs;
        const young =
          Number.isFinite(modifiedAt) &&
          modifiedAt <= now &&
          now - modifiedAt <= plan.markerlessReclaimAgeMs;
        if (live !== null && young) {
          outcomes.push({
            name,
            action: "declined",
            limb: 1,
            inputClass: "liveness-token-convention",
          });
          continue;
        }
      }
      if (comparable && live !== null && live === startTime) {
        continue; // a live process owns it
      }
      if (comparable) {
        outcomes.push({
          name,
          action: "reclaimed",
          limb: 1,
          removed: removeRoot(candidate),
        });
        continue;
      }
      // Incomparable token whose process is absent, or whose candidate has
      // outlived the reclaim age: nothing this marker names can be in use, and
      // the marker parsed, so this is the second limb's input.
    }

    // Limbs 2 and 3, both gated on the candidate's own modification time.
    const limb = markerPresent ? 2 : 3;
    const modifiedAt = status.mtimeMs;
    if (!Number.isFinite(modifiedAt)) {
      outcomes.push({
        name,
        action: "declined",
        limb,
        inputClass: "candidate-modification-time",
      });
      continue;
    }
    if (modifiedAt > now) {
      outcomes.push({
        name,
        action: "declined",
        limb,
        inputClass: "clock-moved",
      });
      continue;
    }
    if (now - modifiedAt <= plan.markerlessReclaimAgeMs) {
      // Recorded rather than skipped silently, which is what the Service-side
      // reader does and what makes the child's sweep reasoning checkable: a
      // candidate that produced no outcome at all is indistinguishable from
      // one the sweep never saw.
      outcomes.push({
        name,
        action: "skipped",
        reason: "younger than reclaim age",
      });
      continue;
    }
    if (limb === 3) {
      try {
        if (readdirSync(candidate).length > 0) {
          continue; // markerless and not empty
        }
      } catch {
        continue;
      }
    }
    outcomes.push({
      name,
      action: "reclaimed",
      limb,
      removed: removeRoot(candidate),
    });
  }

  protocol({ type: "sweep", domain, outcomes });
  for (const outcome of outcomes) {
    if (outcome.action === "declined") {
      diagnostic(
        `declined reclaim of ${JSON.stringify(outcome.name)}: limb ${outcome.limb} could not read or compare ${outcome.inputClass}`,
      );
    }
  }
}

/**
 * The environment for every descendant, rebuilt from an empty object using the
 * allowlist names the plan carries. Rebuilding rather than forwarding
 * `process.env` is what keeps a name the Runtime itself might acquire from
 * reaching `git` or the interpreter.
 */
const descendantEnvironment: Record<string, string> = {};
for (const name of plan.environmentNames) {
  const value = process.env[name];
  // An allowlisted name this process does not carry is left out rather than
  // projected as an empty string. Some names are host-conditional --
  // `ELECTRON_RUN_AS_NODE` exists only when the Service is an Electron binary
  // -- and projecting an absent one as `""` puts a name in every descendant's
  // environment that was never in this one. An empty value is meaningful for
  // `GIT_ASKPASS` and `SSH_ASKPASS`, which is why those are set explicitly by
  // the builder rather than inherited.
  if (value !== undefined) descendantEnvironment[name] = value;
}

function protocol(message: Record<string, unknown>): void {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

/**
 * The declared-value read, AC-0054 and AC-0055.
 *
 * The child performs the **read** because the materialized tree lives under
 * its own working directory. The Service performs the **parse**, because the
 * guarded parser and its depth and inadmissible-key bounds live there and this
 * module imports nothing but node builtins -- which is what keeps the child's
 * import graph unable to reach materialized content at all.
 *
 * So this reports each file's bytes and its refusals, and concludes nothing
 * from either. Both bounds are checked before anything is opened: the file
 * count against the requested set, and each name against the delivered
 * surface.
 *
 * **The text travels base64-encoded.** Emitting it raw let a repository defeat
 * a Studio bound: `JSON.stringify` renders a C0 control byte as a
 * six-character escape, so two files that each pass the 1 MiB read bound
 * serialize to 12.58 MiB and breach the 8 MiB result bound, which discards the
 * whole protocol stream. Base64 inflates by a fixed 4/3, so two admitted files
 * cost at most about 2.8 MiB and the composition is bounded by construction
 * rather than by what the bytes happen to be.
 *
 * **An absent file is not a refusal, but only a genuinely missing one.** A
 * repository that declares nothing is the AC-0064 case, and calling that a
 * failure would assert something the tree does not say -- so only `ENOENT`
 * reports absence, and every other stat failure is an `unreadable` refusal
 * carrying its cause. Reporting a file that exists but cannot be read as one
 * the repository never wrote would be the same false assertion in reverse.
 */
function readDeclaredValues(): Record<string, unknown> {
  const surface = plan.declaredReadSurface;
  const names = plan.declaredReadNames ?? surface;

  if (names.length > plan.declaredReadFileBound) {
    return {
      reads: [],
      refusal: "exceeds-file-count-bound",
      diagnostic: `${names.length} files requested, bound is ${plan.declaredReadFileBound}`,
    };
  }
  for (const name of names) {
    if (!surface.includes(name)) {
      return {
        reads: [],
        refusal: "outside-permitted-read-surface",
        diagnostic: `${name} is outside the permitted read surface`,
      };
    }
  }

  const reads: Record<string, unknown>[] = [];
  for (const name of names) {
    const path = join(materializationRoot, name);
    let status: ReturnType<typeof lstatSync>;
    try {
      status = lstatSync(path);
    } catch (cause) {
      if ((cause as { code?: string }).code === "ENOENT") {
        reads.push({ name, absent: true });
      } else {
        reads.push({
          name,
          refusal: "unreadable",
          diagnostic: `${name}: ${String(cause)}`,
        });
      }
      continue;
    }
    // Read via the file's own path once it is proven a regular file that is
    // not a link, which is the discipline the sweep's marker read uses. The
    // refusal is `unreadable` because that is the member the Service's own
    // reader maps a non-regular file to; the two must name the same value.
    if (status.isSymbolicLink() || !status.isFile()) {
      reads.push({
        name,
        refusal: "unreadable",
        diagnostic: `${name} is not a regular file`,
      });
      continue;
    }
    // Before the open, so an oversized declaration is never read at all.
    if (status.size > plan.declaredReadByteBound) {
      reads.push({
        name,
        refusal: "exceeds-byte-bound",
        diagnostic: `${name} is ${status.size} bytes, bound is ${plan.declaredReadByteBound}`,
      });
      continue;
    }
    try {
      // Read as bytes, not as text: the decode belongs with the parse, and a
      // file that is not valid UTF-8 is the repository's content either way.
      reads.push({
        name,
        encoding: "base64",
        text: readFileSync(path).toString("base64"),
      });
    } catch (cause) {
      reads.push({
        name,
        refusal: "unreadable",
        diagnostic: `${name}: ${String(cause)}`,
      });
    }
  }
  return { reads };
}

/**
 * Writes the declaration files a test asked for into the materialization root,
 * so a test can drive the read above. The root's final component is
 * unpredictable by design, so a test cannot place a file there itself -- the
 * same reason `materializationWriter` exists. Production never sets the field.
 */
function writeDeclaredFixtures(): void {
  for (const fixture of plan.declaredFixtures ?? []) {
    // Confined by construction: a bare file name, written directly into the
    // materialization root. A separator or `..` would make this a write path
    // out of the root, so it is refused rather than normalized.
    if (fixture.name.includes("/") || fixture.name.includes("..")) {
      diagnostic(`declared fixture ${fixture.name} is not a bare file name`);
      continue;
    }
    const path = join(materializationRoot, fixture.name);
    // Reported rather than thrown: an unguarded throw here would abort before
    // the `declared` line is written, so a fixture that collided would read as
    // a Runtime that never performed the read at all.
    try {
      // A directory at a permitted name is how a test reaches the non-regular
      // refusal, which no file fixture can produce.
      if (fixture.directory === true) {
        mkdirSync(path, { recursive: true, mode: 0o700 });
        continue;
      }
      writeFileSync(
        path,
        (fixture.contents ?? "").repeat(fixture.repeat ?? 1),
        { mode: 0o600 },
      );
    } catch (cause) {
      diagnostic(
        `declared fixture ${fixture.name} not written: ${String(cause)}`,
      );
    }
  }
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
 * The single site for descendant *work* in the Runtime, and the only one whose
 * output is captured and relayed. The process-status read in `processStartTime`
 * sits outside it deliberately: it needs the raw stdout rather than a relayed
 * diagnostic, and it carries its own absolute-path constant and its own audit
 * entry. Descendant stdout is captured
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

/**
 * Counts entries under the materialization root without following a link. A
 * `Dirent` for a symbolic link reports `isDirectory()` false, so a link is
 * counted as one entry and never descended — the walk cannot be led outside
 * the root by the tree it is measuring.
 */
function countMaterializedFiles(root: string): number {
  let count = 0;
  const visit = (path: string): void => {
    let entries: { name: string; isDirectory(): boolean }[];
    try {
      entries = readdirSync(path, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        visit(join(path, entry.name));
        continue;
      }
      count += 1;
    }
  };
  visit(root);
  return count;
}

/**
 * Starts the descendant that writes into the materialization root, standing in
 * for `git checkout`. The interpreter is used because it is the one permitted
 * executable that can write on a pace; the sampler observes the tree either
 * way, so the writer's identity does not change what the bound measures.
 */
function startMaterializationWriter(
  interpreter: string,
  files: number,
  intervalMs: number,
): ReturnType<typeof spawn> {
  const script =
    "import os,sys,time\n" +
    "root,count,gap=sys.argv[1],int(sys.argv[2]),float(sys.argv[3])\n" +
    "d=os.path.join(root,'written')\n" +
    "os.makedirs(d,exist_ok=True)\n" +
    "for i in range(count):\n" +
    "    open(os.path.join(d,str(i)),'w').close()\n" +
    "    if gap>0: time.sleep(gap)\n";
  const args = [
    "-c",
    script,
    materializationRoot,
    String(files),
    String(intervalMs / 1000),
  ];
  const writer = spawn(interpreter, args, {
    env: descendantEnvironment,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });
  recordSpawn({
    executable: interpreter,
    args,
    environmentNames: Object.keys(descendantEnvironment),
    shell: false,
    ...(typeof writer.pid === "number" ? { pid: writer.pid } : {}),
  });
  for (const stream of [writer.stdout, writer.stderr]) {
    stream?.setEncoding("utf8");
    stream?.on("data", (chunk: string) => {
      diagnostic(chunk);
    });
  }
  return writer;
}

/**
 * AC-0051. The sampler walks the materialization root on the bound's interval
 * and, on the first sample that observes the bound crossed, stops the writer
 * and signals the group.
 *
 * Both instants are reported. The bound's tolerance is stated as the files
 * written in one interval **plus the duration of the sample itself**, so a
 * reader needs to know when the walk started as well as when it finished; a
 * single timestamp would make the second term unverifiable.
 *
 * The writer is stopped before the group is signalled, and the group signal is
 * deferred by one short delay, because the protocol line reporting the breach
 * travels a pipe. Killing the group in the same tick can discard it, which
 * would leave the strongest evidence of the bound firing unobservable from the
 * parent. Materialization has already stopped by then, so the delay bounds
 * nothing but when the group clears.
 */
function startFileCountSampler(
  writer: ReturnType<typeof spawn> | undefined,
): ReturnType<typeof setInterval> {
  const sampler = setInterval(() => {
    const observedAt = Date.now();
    const observed = countMaterializedFiles(materializationRoot);
    const detectedAt = Date.now();
    if (observed <= plan.fileCountBound) {
      return;
    }
    clearInterval(sampler);
    writer?.kill("SIGKILL");
    protocol({
      type: "bound",
      bound: "file-count",
      observed,
      boundValue: plan.fileCountBound,
      observedAt,
      detectedAt,
      sampleDurationMs: detectedAt - observedAt,
      intervalMs: plan.fileCountSamplingIntervalMs,
    });
    diagnostic(
      `materialized file count bound of ${plan.fileCountBound} crossed at ${observed} files`,
    );
    setTimeout(() => {
      process.kill(-process.pid, "SIGKILL");
    }, 50);
  }, plan.fileCountSamplingIntervalMs);
  return sampler;
}

/**
 * AC-0052. The resolution subprocess is killed at the Runtime's own deadline,
 * and the diagnostic names resolution rather than the inspection deadline that
 * bounds the whole run. The subprocess is killed, not the group: resolution is
 * one phase, and ending it is not ending the inspection.
 */
async function runResolutionPhase(interpreter: string): Promise<void> {
  if (plan.resolutionHoldMs === undefined) {
    return;
  }
  const args = [
    "-c",
    `import time;time.sleep(${plan.resolutionHoldMs / 1000})`,
  ];
  const started = Date.now();
  const subprocess = spawn(interpreter, args, {
    env: descendantEnvironment,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });
  recordSpawn({
    executable: interpreter,
    args,
    environmentNames: Object.keys(descendantEnvironment),
    shell: false,
    ...(typeof subprocess.pid === "number" ? { pid: subprocess.pid } : {}),
  });
  let killedAtDeadline = false;
  const deadline = setTimeout(() => {
    killedAtDeadline = true;
    diagnostic(`resolution deadline of ${plan.resolutionDeadlineMs}ms reached`);
    subprocess.kill("SIGKILL");
  }, plan.resolutionDeadlineMs);
  const exit = await new Promise<{ signal: string | null }>((settle) => {
    subprocess.on("exit", (_code, signal) => {
      settle({ signal });
    });
  });
  clearTimeout(deadline);
  protocol({
    type: "resolution",
    outcome: killedAtDeadline ? "deadline" : "completed",
    deadlineMs: plan.resolutionDeadlineMs,
    elapsedMs: Date.now() - started,
    signal: exit.signal,
  });
}

async function main(): Promise<void> {
  // Before anything else writes under the root, and before any descendant can
  // run: the marker, then the three children.
  claimStateRoot();

  protocol({
    type: "started",
    requestId: plan.requestId,
    pid: process.pid,
    executable: process.execPath,
    stateRoot: plan.stateRoot,
    materializationRoot,
    // Reported so the parent can assert AC-0071 against what the Runtime
    // actually read, rather than against what the parent believes it passed.
    sweepDomain,
  });

  // The Runtime owns the inspection deadline, and it signals its whole group
  // rather than itself, so a descendant cannot outlive the deadline.
  const deadline = setTimeout(() => {
    diagnostic(`inspection deadline of ${plan.inspectionDeadlineMs}ms reached`);
    process.kill(-process.pid, "SIGKILL");
  }, plan.inspectionDeadlineMs);
  deadline.unref();

  if (plan.sweepOnStart !== false && sweepDomain !== undefined) {
    sweep(sweepDomain);
  }

  const interpreter = resolveInterpreter();
  protocol({ type: "interpreter", ...interpreter });

  if (plan.initializeMaterialization) {
    const args = gitVector("init", "--quiet", "--", materializationRoot);
    const initialized = run(plan.gitExecutable, args, {
      cwd: materializationRoot,
    });
    protocol({
      type: "git",
      phase: "initialize",
      status: initialized.status,
      args,
    });
  }

  if (plan.revision !== undefined) {
    // Depth 1, no tags, and an exact commit rather than a ref: the operand is
    // a 40-character SHA the Service already gated, and `--` ends option
    // parsing so neither value can be read as a flag.
    const fetchArgs = gitVector(
      "fetch",
      "--depth=1",
      "--no-tags",
      "--",
      plan.revision.fetchUrl,
      plan.revision.resolvedSha,
    );
    const fetched = run(plan.gitExecutable, fetchArgs, {
      cwd: materializationRoot,
    });
    protocol({
      type: "git",
      phase: "fetch",
      status: fetched.status,
      args: fetchArgs,
    });

    if (fetched.status === 0) {
      const checkoutArgs = gitVector(
        "checkout",
        "--detach",
        "--force",
        "FETCH_HEAD",
      );
      const checkedOut = run(plan.gitExecutable, checkoutArgs, {
        cwd: materializationRoot,
      });
      protocol({
        type: "git",
        phase: "checkout",
        status: checkedOut.status,
        args: checkoutArgs,
      });

      // The checked-out HEAD must be the commit that was asked for. Fetching
      // an exact SHA and checking out FETCH_HEAD should always give that, but
      // "should" is not a check: the vocabulary carries a `head-mismatch` stop
      // reason -- "The downloaded copy did not match the commit Studio asked
      // for" -- and moving materialization here from `materializeRevision`
      // brought the fetch and the checkout without bringing this. Never cut
      // validation at a trust boundary.
      const headArgs = gitVector("rev-parse", "--verify", "HEAD");
      const head = run(plan.gitExecutable, headArgs, {
        cwd: materializationRoot,
      });
      const inspectedSha = (head.stdout ?? "").trim();
      protocol({
        type: "git",
        phase: "verify-head",
        status: head.status,
        args: headArgs,
      });

      protocol({
        type: "materialized",
        resolvedSha: plan.revision.resolvedSha,
        inspectedSha,
        status:
          head.status === 0 && inspectedSha === plan.revision.resolvedSha
            ? 0
            : 1,
        // A HEAD read that did not run is not a verified mismatch: the two
        // differ in attribution, and telling the lead the downloaded copy did
        // not match would be an assertion about repository content Studio
        // never actually checked.
        ...(head.status !== 0
          ? { mismatch: "head-unreadable" }
          : inspectedSha === plan.revision.resolvedSha
            ? {}
            : { mismatch: "head-mismatch" }),
      });
    }
  }

  // After materialization, so the read sees the tree that was checked out,
  // and before any result line, so a result can never report a version marker
  // the declared read had not yet been asked for.
  writeDeclaredFixtures();
  protocol({ type: "declared", ...readDeclaredValues() });

  if (interpreter.executable !== undefined) {
    await runResolutionPhase(interpreter.executable);
  }

  // AC-0051. The sampler runs for the whole materialization phase, which is
  // the window during which the tree grows.
  let writer: ReturnType<typeof spawn> | undefined;
  let fileCountSampler: ReturnType<typeof setInterval> | undefined;
  if (
    plan.materializationWriter !== undefined &&
    interpreter.executable !== undefined
  ) {
    writer = startMaterializationWriter(
      interpreter.executable,
      plan.materializationWriter.files,
      plan.materializationWriter.intervalMs,
    );
    fileCountSampler = startFileCountSampler(writer);
    await new Promise<void>((settle) => {
      writer?.on("exit", () => {
        settle();
      });
    });
    clearInterval(fileCountSampler);
    protocol({
      type: "materialization",
      files: countMaterializedFiles(materializationRoot),
      boundValue: plan.fileCountBound,
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
      cwd: materializationRoot,
      holdStdinMs: plan.descendantHoldMs,
    });
    protocol({
      type: "git",
      phase: "held-descendant",
      status: held.status,
      args,
    });
  }

  // Written before the completed line, so the Service reads it as part of the
  // same run rather than after the response it would have bounded.
  for (const raw of plan.rawStdoutLines ?? []) {
    process.stdout.write(`${raw}\n`);
  }
  if (plan.noiseStdoutBytes !== undefined && plan.noiseStdoutBytes > 0) {
    process.stdout.write(`${"n".repeat(plan.noiseStdoutBytes)}\n`);
  }
  if (plan.noiseStderrBytes !== undefined && plan.noiseStderrBytes > 0) {
    process.stderr.write(`${"d".repeat(plan.noiseStderrBytes)}\n`);
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
  // AC-0079, the success path. Removal is reported before the completed line,
  // so a reader of the protocol sees the disposal that the response implies.
  dispose("completed");
  protocol({ type: "completed", requestId: plan.requestId });
}

/** Runs at most once, whichever of the three paths reaches it first. */
let disposed = false;
function dispose(reason: string): void {
  if (disposed) {
    return;
  }
  disposed = true;
  if (plan.retainStateRoot === true) {
    protocol({ type: "disposed", reason, removed: false, retained: true });
    return;
  }
  const removed = removeRoot(plan.stateRoot);
  protocol({ type: "disposed", reason, removed });
  if (!removed) {
    // AC-0083's discipline: a removal that did not complete is never silent.
    diagnostic(`state root was not fully removed on ${reason}`);
  }
}

// AC-0079, the signal path. `SIGKILL` cannot be handled, which is why the
// Service sends `SIGTERM` first; a root left by a `SIGKILL` is the sweep's
// business, not this handler's.
for (const signal of ["SIGTERM", "SIGINT", "SIGHUP"]) {
  process.on(signal, () => {
    dispose(signal);
    process.exit(0);
  });
}

try {
  await main();
} catch (cause) {
  // AC-0079, the failure path.
  diagnostic(`runtime failed: ${cause}`);
  dispose("failed");
  process.exitCode = 1;
}
