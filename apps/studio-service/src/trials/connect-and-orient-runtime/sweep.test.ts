import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  createPerRequestStateRoot,
  LIVENESS_TOKEN_CONVENTION,
  MARKERLESS_RECLAIM_AGE_MS,
  OWNERSHIP_MARKER_NAME,
  readProcessStartTime,
} from "./per-request-state-root.js";
import { type SweepEntryOutcome, sweepDomain } from "./sweep.js";

const roots: string[] = [];
const NOW = 1_800_000_000_000;
const OLD = NOW - MARKERLESS_RECLAIM_AGE_MS - 60_000;
const YOUNG = NOW - 60_000;

function domain(): string {
  const root = mkdtempSync(join(tmpdir(), "connect-orient-sweep-"));
  chmodSync(root, 0o700);
  roots.push(root);
  return root;
}

afterAll(() => {
  for (const root of roots) {
    rmSync(root, { recursive: true, force: true });
  }
});

/** A bare candidate directory, so each limb's inputs can be set exactly. */
function candidate(
  parent: string,
  name: string,
  options: {
    marker?: string;
    entries?: readonly string[];
    mtimeMs?: number;
    mode?: number;
  } = {},
): string {
  const path = join(parent, name);
  mkdirSync(path);
  if (options.marker !== undefined) {
    writeFileSync(join(path, OWNERSHIP_MARKER_NAME), options.marker);
  }
  for (const entry of options.entries ?? []) {
    writeFileSync(join(path, entry), "");
  }
  chmodSync(path, options.mode ?? 0o700);
  if (options.mtimeMs !== undefined) {
    const seconds = options.mtimeMs / 1000;
    utimesSync(path, seconds, seconds);
  }
  return path;
}

function outcomeFor(
  entries: readonly SweepEntryOutcome[],
  name: string,
): SweepEntryOutcome {
  const found = entries.find((entry) => entry.name === name);
  if (found === undefined) {
    throw new Error(`no sweep outcome recorded for ${name}`);
  }
  return found;
}

const liveMarker = JSON.stringify({
  schema: 2,
  pid: process.pid,
  startTime: readProcessStartTime(process.pid),
  tokenConvention: LIVENESS_TOKEN_CONVENTION,
});
const deadMarker = JSON.stringify({
  schema: 2,
  pid: 99998,
  startTime: "Wed Sep  9 08:15:07 2026",
  tokenConvention: LIVENESS_TOKEN_CONVENTION,
});

describe("AC-0081 the entry gate", () => {
  it("skips a symbolic link, a file, a foreign mode, and never descends", () => {
    const base = domain();
    const target = candidate(base, "real", { mtimeMs: OLD });
    symlinkSync(target, join(base, "as-link"));
    writeFileSync(join(base, "as-file"), "");
    candidate(base, "loose-mode", { mtimeMs: OLD, mode: 0o755 });

    const { entries } = sweepDomain(base, { now: NOW });
    expect(outcomeFor(entries, "as-link").decision).toMatchObject({
      action: "skipped",
      reason: "entry is a symbolic link",
    });
    expect(outcomeFor(entries, "as-file").decision).toMatchObject({
      action: "skipped",
      reason: "entry is not a directory",
    });
    expect(outcomeFor(entries, "loose-mode").decision).toMatchObject({
      action: "skipped",
      reason: "entry is not mode 700",
    });
    // The link itself survives, unfollowed. `lstat`, not `existsSync`: the
    // link's target is a separate candidate that limb 3 legitimately reclaims,
    // so following the link would report the wrong thing.
    expect(lstatSync(join(base, "as-link")).isSymbolicLink()).toBe(true);
  });

  it("enumerates only direct children", () => {
    const base = domain();
    const parent = candidate(base, "parent", { mtimeMs: OLD });
    candidate(parent, "grandchild", { mtimeMs: OLD });
    const { entries } = sweepDomain(base, { now: NOW });
    expect(entries.map((entry) => entry.name)).toEqual(["parent"]);
  });
});

describe("AC-0081 limb 1 — a marker naming no live process", () => {
  it("reclaims a candidate whose recorded process is gone", () => {
    const base = domain();
    const path = candidate(base, "dead", {
      marker: deadMarker,
      entries: ["content"],
      // Deliberately young: limb 1 carries no age gate.
      mtimeMs: YOUNG,
    });
    const { entries } = sweepDomain(base, { now: NOW });
    expect(outcomeFor(entries, "dead").decision).toEqual({
      action: "reclaimed",
      limb: 1,
    });
    expect(existsSync(path)).toBe(false);
  });

  it("never reclaims a candidate whose recorded process is live", () => {
    const base = domain();
    const path = candidate(base, "live", {
      marker: liveMarker,
      mtimeMs: OLD, // old enough for limbs 2 and 3, and still refused
    });
    const { entries } = sweepDomain(base, { now: NOW });
    expect(outcomeFor(entries, "live").decision).toMatchObject({
      action: "skipped",
      reason: "marker names a live process",
    });
    expect(existsSync(path)).toBe(true);
  });

  it("declines when the liveness comparison cannot be made", () => {
    const base = domain();
    // A pid beyond `kern.maxproc`: `ps` refuses the request rather than
    // reporting that the process is absent, so liveness is uncomparable.
    const path = candidate(base, "uncomparable", {
      marker: JSON.stringify({
        schema: 2,
        pid: 4_000_000_000,
        startTime: "Wed Sep  9 08:15:07 2026",
        tokenConvention: LIVENESS_TOKEN_CONVENTION,
      }),
      mtimeMs: OLD,
    });
    const { entries, diagnostics } = sweepDomain(base, { now: NOW });
    expect(outcomeFor(entries, "uncomparable").decision).toEqual({
      action: "declined",
      limb: 1,
      inputClass: "process-liveness",
    });
    expect(existsSync(path)).toBe(true);
    // AC-0083: the decline names the limb and the class of input.
    expect(diagnostics.join("\n")).toContain("limb 1");
    expect(diagnostics.join("\n")).toContain("process-liveness");
  });
});

describe("AC-0081 limb 2 — an unusable marker, gated by age", () => {
  const unusable: readonly [string, string][] = [
    ["unparseable", '{"schema":1,"pid":123,"startT'],
    ["not-an-object", '"a string"'],
    ["missing-start-time", '{"schema":1,"pid":123}'],
    ["empty-start-time", '{"schema":1,"pid":123,"startTime":""}'],
    ["missing-pid", '{"schema":1,"startTime":"Wed Sep  9 08:15:07 2026"}'],
  ];

  for (const [name, marker] of unusable) {
    it(`reclaims a ${name} marker once older than the reclaim age`, () => {
      const base = domain();
      const path = candidate(base, name, {
        marker,
        entries: ["content"],
        mtimeMs: OLD,
      });
      const { entries } = sweepDomain(base, { now: NOW });
      expect(outcomeFor(entries, name).decision).toEqual({
        action: "reclaimed",
        limb: 2,
      });
      expect(existsSync(path)).toBe(false);
    });
  }

  it("skips an unusable marker that is younger than the reclaim age", () => {
    const base = domain();
    const path = candidate(base, "young", {
      marker: "{ truncated",
      mtimeMs: YOUNG,
    });
    const { entries } = sweepDomain(base, { now: NOW });
    expect(outcomeFor(entries, "young").decision).toMatchObject({
      action: "skipped",
      reason: "younger than reclaim age",
    });
    expect(existsSync(path)).toBe(true);
  });

  it("treats a marker that is a link as unusable, not as absent", () => {
    const base = domain();
    const path = candidate(base, "linked-marker", { mtimeMs: OLD });
    writeFileSync(join(base, "elsewhere.json"), liveMarker);
    symlinkSync(
      join(base, "elsewhere.json"),
      join(path, OWNERSHIP_MARKER_NAME),
    );
    utimesSync(path, OLD / 1000, OLD / 1000);
    const { entries } = sweepDomain(base, { now: NOW });
    // Limb 2, not limb 3: a marker is present, it simply cannot be read under
    // the discipline AC-0081 requires.
    expect(outcomeFor(entries, "linked-marker").decision).toEqual({
      action: "reclaimed",
      limb: 2,
    });
  });
});

describe("AC-0081 limb 3 — no marker, no entries, gated by age", () => {
  it("reclaims an old empty markerless candidate", () => {
    const base = domain();
    const path = candidate(base, "empty-old", { mtimeMs: OLD });
    const { entries } = sweepDomain(base, { now: NOW });
    expect(outcomeFor(entries, "empty-old").decision).toEqual({
      action: "reclaimed",
      limb: 3,
    });
    expect(existsSync(path)).toBe(false);
  });

  it("skips a markerless candidate that is not empty", () => {
    const base = domain();
    const path = candidate(base, "non-empty", {
      entries: ["content"],
      mtimeMs: OLD,
    });
    const { entries } = sweepDomain(base, { now: NOW });
    expect(outcomeFor(entries, "non-empty").decision).toMatchObject({
      action: "skipped",
      reason: "markerless candidate is not empty",
    });
    expect(existsSync(path)).toBe(true);
  });

  it("skips a markerless empty candidate that is too young", () => {
    const base = domain();
    const path = candidate(base, "empty-young", { mtimeMs: YOUNG });
    const { entries } = sweepDomain(base, { now: NOW });
    expect(outcomeFor(entries, "empty-young").decision).toMatchObject({
      action: "skipped",
      reason: "younger than reclaim age",
    });
    expect(existsSync(path)).toBe(true);
  });
});

describe("AC-0081 declines and AC-0083 diagnostics", () => {
  it("declines on both age-gated limbs when the clock has moved", () => {
    const base = domain();
    const future = NOW + 60_000;
    candidate(base, "future-markerless", { mtimeMs: future });
    candidate(base, "future-unusable", {
      marker: "{ truncated",
      mtimeMs: future,
    });
    const { entries, diagnostics } = sweepDomain(base, { now: NOW });
    expect(outcomeFor(entries, "future-markerless").decision).toEqual({
      action: "declined",
      limb: 3,
      inputClass: "clock-moved",
    });
    expect(outcomeFor(entries, "future-unusable").decision).toEqual({
      action: "declined",
      limb: 2,
      inputClass: "clock-moved",
    });
    expect(diagnostics).toHaveLength(2);
    expect(existsSync(join(base, "future-markerless"))).toBe(true);
  });

  it("carries no repository-derived payload in a diagnostic", () => {
    const base = domain();
    const secret = "s3cret-repository-bytes";
    candidate(base, "leaky", {
      marker: JSON.stringify({
        schema: 2,
        pid: 4_000_000_000,
        startTime: secret,
        tokenConvention: LIVENESS_TOKEN_CONVENTION,
      }),
      entries: [],
      mtimeMs: OLD,
    });
    const { diagnostics } = sweepDomain(base, { now: NOW });
    expect(diagnostics.join("\n")).not.toContain(secret);
  });

  it("reports a live root created by the Runtime itself as skipped", () => {
    // The end-to-end shape: a real state root, created through the production
    // path, is never reclaimed while its owner is alive.
    const base = domain();
    const created = createPerRequestStateRoot(base);
    const { entries } = sweepDomain(base, { now: NOW });
    const name = created.stateRoot.slice(base.length + 1);
    expect(outcomeFor(entries, name).decision).toMatchObject({
      action: "skipped",
      reason: "marker names a live process",
    });
    expect(existsSync(created.stateRoot)).toBe(true);
  });
});

describe("AC-0081 a token rendered under another convention is not comparable", () => {
  // The hazard these cases exist for. This amendment pinned the environment
  // `ps -o lstart=` renders under, so the bytes a marker carries depend on
  // which build wrote it. A marker persisted by a Runtime that is still alive
  // but rendered its token under the old convention compares unequal against
  // this build's rendering of the very same process. Limb 1 carries no age
  // gate, so before the convention was recorded that inequality deleted a live
  // Runtime's materialization root, home and temp.

  it("declines rather than reclaiming when a live process's token predates the convention", () => {
    const base = domain();
    // The real shape: this process is alive, and the marker names it, but the
    // token was rendered before the pin existed -- so it carries no convention
    // and its bytes are whatever the ambient zone produced.
    candidate(base, "live-old-build", {
      marker: JSON.stringify({
        schema: 1,
        pid: process.pid,
        startTime: "Wed Sep  9 08:15:07 2026",
      }),
      // Within the reclaim age: a Runtime cannot legitimately be older, so
      // that is the only window in which a live pid can still be this marker's
      // own process rather than a recycled one.
      mtimeMs: YOUNG,
    });

    const { entries, diagnostics } = sweepDomain(base, { now: NOW });
    expect(outcomeFor(entries, "live-old-build").decision).toEqual({
      action: "declined",
      limb: 1,
      inputClass: "liveness-token-convention",
    });
    // Still there. This is the assertion the whole gate exists for.
    expect(existsSync(join(base, "live-old-build"))).toBe(true);
    // AC-0083: a control whose failure mode emitted nothing would be
    // unobservable exactly when it matters.
    expect(
      diagnostics.some((line) => line.includes("liveness-token-convention")),
    ).toBe(true);
  });

  it("declines a token rendered under some later convention", () => {
    const base = domain();
    candidate(base, "future-build", {
      marker: JSON.stringify({
        schema: 2,
        pid: process.pid,
        startTime: readProcessStartTime(process.pid),
        tokenConvention: "lang-c/lc-all-c/tz-utc/iso-8601",
      }),
      mtimeMs: YOUNG,
    });

    expect(
      outcomeFor(sweepDomain(base, { now: NOW }).entries, "future-build")
        .decision,
    ).toMatchObject({
      action: "declined",
      inputClass: "liveness-token-convention",
    });
    expect(existsSync(join(base, "future-build"))).toBe(true);
  });

  it("reclaims a live pid's incomparable root once it outlives the reclaim age", () => {
    const base = domain();
    // A live pid is not enough on its own. The token cannot be compared, so
    // nothing establishes that the live process is the one this marker names
    // -- start time is what would, and it is exactly what is missing. Past the
    // reclaim age the pid must have been recycled, because the child SIGKILLs
    // its own group at the inspection deadline and cannot be this old. Without
    // this bound a recycled pid retains the root for its holder's lifetime.
    candidate(base, "recycled-pid", {
      marker: JSON.stringify({
        schema: 1,
        pid: process.pid,
        startTime: "Wed Sep  9 08:15:07 2026",
      }),
      mtimeMs: OLD,
    });

    const decision = outcomeFor(
      sweepDomain(base, { now: NOW }).entries,
      "recycled-pid",
    ).decision;
    expect(decision).toMatchObject({ action: "reclaimed", limb: 2 });
    expect(existsSync(join(base, "recycled-pid"))).toBe(false);
  });

  it("cannot be made to forge a diagnostic line from an entry name", () => {
    // Diagnostics are a line-oriented stream, so an entry name carrying a line
    // break could otherwise introduce lines a reader attributes to the sweep.
    // The entry gate already requires same-uid ownership, so this keeps the
    // record honest rather than defending the tree.
    const base = domain();
    const forged =
      'x\ndeclined reclaim of "y": limb 1 could not read or compare process-liveness';
    candidate(base, forged, {
      marker: JSON.stringify({
        schema: 1,
        pid: 4_000_000_000,
        startTime: "Wed Sep  9 08:15:07 2026",
      }),
      mtimeMs: YOUNG,
    });

    const { diagnostics } = sweepDomain(base, { now: NOW });
    // One entry declined, so exactly one line may mention it -- not two.
    expect(diagnostics.length).toBe(1);
    for (const line of diagnostics) {
      expect(line).not.toContain("\n");
    }
  });

  it("reclaims an incomparable token whose process is gone, on the age gate", () => {
    // The bound. Declining on every incomparable token, live or not, would
    // retain a root from a long-dead other-build Runtime forever: limb 1 has
    // no age gate and limbs 2 and 3 were unreachable behind it. Absence is
    // established without comparing any token bytes -- no process carries
    // that identity under any convention -- so the root is abandoned like any
    // other and falls to the second limb's age gate.
    const base = domain();
    candidate(base, "dead-old-build", {
      marker: JSON.stringify({
        schema: 1,
        pid: 99998,
        startTime: "Wed Sep  9 08:15:07 2026",
      }),
      mtimeMs: OLD,
    });

    expect(
      outcomeFor(sweepDomain(base, { now: NOW }).entries, "dead-old-build")
        .decision,
    ).toMatchObject({ action: "reclaimed", limb: 2 });
    expect(existsSync(join(base, "dead-old-build"))).toBe(false);
  });

  it("retains an incomparable token whose process is gone but is still young", () => {
    // The age gate still applies: reaching limb 2 is not reclaiming on sight.
    const base = domain();
    candidate(base, "dead-old-build-young", {
      marker: JSON.stringify({
        schema: 1,
        pid: 99998,
        startTime: "Wed Sep  9 08:15:07 2026",
      }),
      mtimeMs: YOUNG,
    });

    expect(
      outcomeFor(
        sweepDomain(base, { now: NOW }).entries,
        "dead-old-build-young",
      ).decision,
    ).toMatchObject({ action: "skipped", reason: "younger than reclaim age" });
    expect(existsSync(join(base, "dead-old-build-young"))).toBe(true);
  });

  it("still reclaims a dead process whose token this build can compare", () => {
    // The discriminating positive: the gate must not turn limb 1 off. A marker
    // recording this build's convention and naming a process that is gone is
    // reclaimed exactly as before.
    const base = domain();
    candidate(base, "dead-same-convention", {
      marker: deadMarker,
      mtimeMs: YOUNG,
    });

    expect(
      outcomeFor(
        sweepDomain(base, { now: NOW }).entries,
        "dead-same-convention",
      ).decision,
    ).toMatchObject({ action: "reclaimed", limb: 1 });
    expect(existsSync(join(base, "dead-same-convention"))).toBe(false);
  });

  it("writes the convention into every marker it claims", () => {
    // Binds the writer to the reader. Without this, the writer could stop
    // recording the convention and every later sweep would decline everything
    // -- fail-closed, but a silent leak of every state root.
    const base = domain();
    const created = createPerRequestStateRoot(base);
    const written = JSON.parse(
      readFileSync(created.markerPath, "utf8"),
    ) as Record<string, unknown>;
    expect(written.tokenConvention).toBe(LIVENESS_TOKEN_CONVENTION);
  });
});
