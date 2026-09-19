#!/usr/bin/env node
/**
 * T5's four host measurements, over one 250 ms interval each.
 *
 * These characterize what a hostile repository can do to this host inside one
 * sampling interval. They are deliberately NOT a test: the surviving pass bar
 * is one a contended host fails spuriously, so they are run deliberately on a
 * quiet host and recorded in the verification ledger with the load average that
 * was in effect.
 *
 *   1. Write throughput over 250 ms      bar RETIRED -- see below
 *   2. File creation over 250 ms         pass bar: at or below 5,000 files
 *   3. Resident-memory growth over 250 ms   observation, no pass bar
 *   4. Sample duration over a tree at the
 *      file-count bound (50,000 files)      observation, no pass bar
 *
 * Measurement 2 bounds the *adversary*: a host creating more files than the bar
 * inside one interval could overshoot the file-count bound before the sampler
 * observes the breach.
 *
 * Measurement 1 carried the same kind of bar, at or below 128 MiB, AND FAILED
 * IT: the realistic writer recorded 208-448 MiB per interval on this host. Under
 * the spec's own rule a host measuring higher fails the bound rather than raising
 * it, so the tree-bytes bound was CUT on 2026-09-16 and no byte ceiling is
 * enforced. The measurement is still taken, because it is the standing evidence
 * for that cut rather than a bar anything must now meet.
 */
import { execFileSync, spawn } from "node:child_process";
import {
  closeSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const INTERVAL_MS = 250;
const MIB = 1024 * 1024;
const WRITE_THROUGHPUT_BAR_BYTES = 128 * MIB;
const FILE_CREATION_BAR = 5000;
const FILE_COUNT_BOUND = 50_000;

function loadAverage() {
  return execFileSync("/usr/bin/uptime", { encoding: "utf8" })
    .trim()
    .replace(/^.*load averages?:\s*/, "");
}

/**
 * The host's raw ceiling: ordinary buffered writes, as fast as one process can
 * issue them.
 *
 * **This is not the writer the retired pass bar applied to**, and it is retained
 * only to bound the real measurement from above. The bound's row said the
 * supervisor samples "during checkout", so the writer that mattered is `git`,
 * limited by pack decompression and per-file work. This ceiling reports roughly
 * 200-880 MiB per interval on this host; the realistic writer reports 208-448
 * and failed the bar too, so the difference between them is the margin of
 * overstatement, not the difference between failing and passing.
 */
function measureRawWriteCeiling(root) {
  const chunk = Buffer.alloc(4 * MIB, 0x61);
  const handle = openSync(join(root, "throughput.bin"), "w");
  let bytes = 0;
  const started = process.hrtime.bigint();
  try {
    while (Number(process.hrtime.bigint() - started) / 1e6 < INTERVAL_MS) {
      bytes += writeSync(handle, chunk);
    }
  } finally {
    closeSync(handle);
  }
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  return { bytes, elapsedMs };
}

/**
 * The measurement the pass bar applies to: bytes `git checkout` materializes
 * per 250 ms interval, which is the writer the sampler races.
 *
 * The tree is built from **maximally compressible** content, which is the
 * adversarial case for a bound counting materialized bytes: a tiny pack inflates
 * to a large tree, so decompression costs least per byte written. Incompressible
 * content measures far lower (about 38 MiB per interval on this host) and would
 * understate the adversary.
 */
async function measureCheckoutThroughput(root, repetitions = 3) {
  const git = execFileSync("/usr/bin/git", ["--exec-path"], { encoding: "utf8" })
    .trim();
  const real = join(git, "..", "..", "bin", "git");
  const source = join(root, "checkout-src");
  mkdirSync(source);
  const run = (cwd, args) =>
    execFileSync(real, args, { cwd, encoding: "utf8", stdio: "pipe" });
  run(source, ["init", "-q", "."]);
  // Distinct per file, so each is its own object. Sixty-four identical blobs
  // deduplicate to one, and the checkout then inflates once and copies, which
  // is not what a real tree costs.
  const blobs = 64;
  for (let index = 0; index < blobs; index += 1) {
    const blob = Buffer.alloc(8 * MIB, 0);
    blob.write(`blob-${index}-`, 0);
    writeFileSync(join(source, `z${index}.bin`), blob);
  }
  run(source, ["add", "-A"]);
  run(source, [
    "-c",
    "user.email=t@t",
    "-c",
    "user.name=t",
    "commit",
    "-qm",
    "measure",
  ]);
  const out = join(root, "checkout-out");
  run(root, ["clone", "-q", "--no-checkout", source, out]);

  /** Bytes currently materialized in the work tree. */
  const treeBytes = () => {
    let total = 0;
    for (const name of readdirSync(out, { withFileTypes: true })) {
      if (name.isFile()) {
        total += statSync(join(out, name.name)).size;
      }
    }
    return total;
  };

  const tick = () =>
    new Promise((settle) => {
      setTimeout(settle, INTERVAL_MS);
    });

  const peaks = [];
  const spans = [];
  for (let attempt = 0; attempt < repetitions; attempt += 1) {
    for (let index = 0; index < blobs; index += 1) {
      rmSync(join(out, `z${index}.bin`), { force: true });
    }
    // The sampler's own mechanism: sample the tree every 250 ms while the
    // checkout runs and keep the largest single-interval growth. Scaling the
    // average over the whole checkout hides the peak, and the peak is what the
    // bound races. The gap between the shell-timed average and this peak is why
    // the average is not the measurement the row asks for.
    const child = spawn(
      real,
      ["-c", "core.symlinks=false", "checkout", "--force", "--detach", "HEAD"],
      { cwd: out, stdio: "ignore" },
    );
    let running = true;
    child.on("exit", () => {
      running = false;
    });
    let previous = treeBytes();
    let peak = 0;
    let intervals = 0;
    while (running) {
      await tick();
      intervals += 1;
      const now = treeBytes();
      peak = Math.max(peak, now - previous);
      previous = now;
    }
    peak = Math.max(peak, treeBytes() - previous);
    peaks.push(peak / MIB);
    spans.push(intervals);
  }
  const worst = Math.max(...peaks);
  return {
    treeMib: (blobs * 8 * MIB) / MIB,
    peakPerIntervalMib: peaks.map((value) => +value.toFixed(1)),
    worstMib: +worst.toFixed(1),
    // How many 250 ms samples each checkout spanned. A peak read from two or
    // three samples is quantization, not a rate.
    intervalsSpanned: spans,
  };
}

/** Files created in one 250 ms interval. */
function measureFileCreation(root) {
  const directory = join(root, "creation");
  mkdirSync(directory);
  let files = 0;
  const started = process.hrtime.bigint();
  while (Number(process.hrtime.bigint() - started) / 1e6 < INTERVAL_MS) {
    writeFileSync(join(directory, `f${files}`), "");
    files += 1;
  }
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  return { files, elapsedMs, directory };
}

/** Resident-set growth an allocator can achieve in one 250 ms interval. */
function measureResidentGrowth() {
  const before = process.memoryUsage().rss;
  const held = [];
  const started = process.hrtime.bigint();
  while (Number(process.hrtime.bigint() - started) / 1e6 < INTERVAL_MS) {
    // Touched, so the pages are resident rather than merely reserved.
    held.push(Buffer.alloc(8 * MIB, 0x62));
  }
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  const after = process.memoryUsage().rss;
  // Keep `held` observably alive across the reading.
  const blocks = held.length;
  held.length = 0;
  return { growthBytes: after - before, blocks, elapsedMs };
}

/** Worst-case cost of one tree walk at the file-count bound. */
function measureSampleDuration(root, repetitions = 5) {
  const directory = join(root, "at-bound");
  mkdirSync(directory);
  // 50,000 files spread over 100 directories, which is closer to a real
  // checkout than one flat directory and is the harder walk.
  for (let bucket = 0; bucket < 100; bucket += 1) {
    const path = join(directory, `d${bucket}`);
    mkdirSync(path);
    for (let index = 0; index < FILE_COUNT_BOUND / 100; index += 1) {
      writeFileSync(join(path, `f${index}`), "");
    }
  }
  const walk = (path) => {
    let bytes = 0;
    let count = 0;
    for (const name of readdirSync(path, { withFileTypes: true })) {
      const child = join(path, name.name);
      if (name.isDirectory()) {
        const nested = walk(child);
        bytes += nested.bytes;
        count += nested.count;
      } else {
        bytes += statSync(child).size;
        count += 1;
      }
    }
    return { bytes, count };
  };
  const durations = [];
  let observed = { bytes: 0, count: 0 };
  for (let run = 0; run < repetitions; run += 1) {
    const started = process.hrtime.bigint();
    observed = walk(directory);
    durations.push(Number(process.hrtime.bigint() - started) / 1e6);
  }
  return {
    worstMs: Math.max(...durations),
    bestMs: Math.min(...durations),
    durations,
    files: observed.count,
  };
}

const root = mkdtempSync(join(tmpdir(), "connect-orient-measure-"));
const report = { root, measurements: {} };
try {
  report.loadBefore = loadAverage();

  const ceiling = measureRawWriteCeiling(root);
  report.measurements.rawWriteCeiling = {
    loadAtStart: report.loadBefore,
    mib: +(ceiling.bytes / MIB).toFixed(2),
    elapsedMs: +ceiling.elapsedMs.toFixed(1),
    note: "host ceiling, not the writer the pass bar applies to",
    passBar: null,
  };

  const loadBeforeCheckout = loadAverage();
  const checkout = await measureCheckoutThroughput(root);
  report.measurements.writeThroughput = {
    loadAtStart: loadBeforeCheckout,
    writer: "git checkout, maximally compressible tree",
    treeMib: checkout.treeMib,
    peakPerIntervalMib: checkout.peakPerIntervalMib,
    worstMib: checkout.worstMib,
    intervalsSpanned: checkout.intervalsSpanned,
    barMib: WRITE_THROUGHPUT_BAR_BYTES / MIB,
    withinBar: checkout.worstMib <= WRITE_THROUGHPUT_BAR_BYTES / MIB,
  };

  const loadBeforeCreation = loadAverage();
  const creation = measureFileCreation(root);
  report.measurements.fileCreation = {
    loadAtStart: loadBeforeCreation,
    files: creation.files,
    elapsedMs: +creation.elapsedMs.toFixed(1),
    bar: FILE_CREATION_BAR,
    withinBar: creation.files <= FILE_CREATION_BAR,
  };

  const loadBeforeMemory = loadAverage();
  const memory = measureResidentGrowth();
  report.measurements.residentGrowth = {
    loadAtStart: loadBeforeMemory,
    growthBytes: memory.growthBytes,
    growthMib: +(memory.growthBytes / MIB).toFixed(2),
    blocks: memory.blocks,
    elapsedMs: +memory.elapsedMs.toFixed(1),
    passBar: null,
  };

  const loadBeforeWalk = loadAverage();
  const sample = measureSampleDuration(root);
  report.measurements.sampleDuration = {
    loadAtStart: loadBeforeWalk,
    filesWalked: sample.files,
    worstMs: +sample.worstMs.toFixed(1),
    bestMs: +sample.bestMs.toFixed(1),
    durationsMs: sample.durations.map((value) => +value.toFixed(1)),
    passBar: null,
  };

  report.loadAfter = loadAverage();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  rmSync(root, { recursive: true, force: true });
}
