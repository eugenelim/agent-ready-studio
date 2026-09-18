import { execFileSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { PROCESS_STATUS_EXECUTABLE } from "./executable-identity.js";
import {
  createPerRequestStateRoot,
  HOME_CHILD_NAME,
  LIVENESS_RENDERING_ENVIRONMENT,
  MATERIALIZATION_CHILD_NAME,
  OWNERSHIP_MARKER_NAME,
  readProcessStartTime,
  removePerRequestStateRoot,
  SweepDomainError,
  TEMPORARY_CHILD_NAME,
  verifySweepDomain,
} from "./per-request-state-root.js";
import {
  buildPinnedEnvironment,
  ENVIRONMENT_ALLOWLIST_NAMES,
} from "./runtime-environment.js";

const roots: string[] = [];

/** A conforming sweep domain: a real directory, not a link, ours, mode 0700. */
function sweepDomain(): string {
  const root = mkdtempSync(join(tmpdir(), "connect-orient-domain-"));
  chmodSync(root, 0o700);
  roots.push(root);
  return root;
}

afterAll(() => {
  for (const root of roots) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("AC-0072 the sweep domain is verified on every use", () => {
  it("accepts a conforming domain", () => {
    expect(() => verifySweepDomain(sweepDomain())).not.toThrow();
  });

  it("fails closed on a domain that does not exist", () => {
    expect(() => verifySweepDomain(join(sweepDomain(), "absent"))).toThrow(
      SweepDomainError,
    );
  });

  it("fails closed on a symbolic link, even to a conforming directory", () => {
    const target = sweepDomain();
    const base = sweepDomain();
    const link = join(base, "link");
    symlinkSync(target, link);
    expect(() => verifySweepDomain(link)).toThrow(/symbolic link/);
  });

  it("fails closed on a file", () => {
    const base = sweepDomain();
    const path = join(base, "file");
    writeFileSync(path, "");
    expect(() => verifySweepDomain(path)).toThrow(/not a directory/);
  });

  it("fails closed on a permissive mode", () => {
    const base = sweepDomain();
    const loose = join(base, "loose");
    mkdirSync(loose, { mode: 0o755 });
    chmodSync(loose, 0o755);
    expect(() => verifySweepDomain(loose)).toThrow(/mode 755/);
  });
});

describe("AC-0070 and AC-0080 the per-request state root and its marker", () => {
  it("creates an unpredictable root at 0700 inside the domain", () => {
    const domain = sweepDomain();
    const first = createPerRequestStateRoot(domain);
    const second = createPerRequestStateRoot(domain);
    expect(first.stateRoot).not.toBe(second.stateRoot);
    expect(first.stateRoot.startsWith(`${domain}/`)).toBe(true);
    expect(lstatSync(first.stateRoot).mode & 0o777).toBe(0o700);
  });

  it("puts the materialization root at the `tree` child, at 0700", () => {
    const created = createPerRequestStateRoot(sweepDomain());
    expect(created.materializationRoot).toBe(
      join(created.stateRoot, MATERIALIZATION_CHILD_NAME),
    );
    expect(lstatSync(created.materializationRoot).mode & 0o777).toBe(0o700);
    expect(existsSync(join(created.stateRoot, HOME_CHILD_NAME))).toBe(true);
    expect(existsSync(join(created.stateRoot, TEMPORARY_CHILD_NAME))).toBe(
      true,
    );
  });

  it("makes the marker a sibling of the tree, never a descendant of it", () => {
    const created = createPerRequestStateRoot(sweepDomain());
    expect(created.markerPath).toBe(
      join(created.stateRoot, OWNERSHIP_MARKER_NAME),
    );
    // The property that makes forgery impossible by layout: nothing repository
    // content can reach — everything under `tree` — is on the marker's path.
    expect(
      created.markerPath.startsWith(`${created.materializationRoot}/`),
    ).toBe(false);
  });

  it("names the owning process and its start time", () => {
    const created = createPerRequestStateRoot(sweepDomain());
    const marker = JSON.parse(readFileSync(created.markerPath, "utf8"));
    expect(marker.pid).toBe(process.pid);
    expect(marker.startTime).toBe(readProcessStartTime(process.pid));
    expect(marker.startTime).not.toBe("");
  });

  it("writes the marker as one creating write, leaving no staging child", () => {
    const created = createPerRequestStateRoot(sweepDomain());
    // Only the four known children exist: no `.tmp`, no `.marker.new`.
    expect(readdirSync(created.stateRoot).sort()).toEqual(
      [
        OWNERSHIP_MARKER_NAME,
        HOME_CHILD_NAME,
        TEMPORARY_CHILD_NAME,
        MATERIALIZATION_CHILD_NAME,
      ].sort(),
    );
  });

  it("encodes the marker so no truncation can misrepresent ownership", () => {
    // AC-0080's crash-window claim rests on a property of this encoding, which
    // the criterion now states explicitly rather than leaving to implementation;
    // this case is what verifies it. The property that holds
    // — and the one the claim needs — is that every proper prefix of the single
    // write either fails to yield both values, and so is AC-0081's second-limb
    // input, or yields *exactly* the complete marker's values.
    //
    // It is not the stronger "no prefix parses": the prefix that drops only the
    // trailing newline parses to the true, complete marker. That prefix is
    // harmless precisely because it cannot misstate the owner.
    const created = createPerRequestStateRoot(sweepDomain());
    const complete = readFileSync(created.markerPath, "utf8");
    const truth = JSON.parse(complete) as Record<string, unknown>;
    let parseablePrefixes = 0;
    // From 0, not 1: the empty prefix is reachable — the marker is created
    // exclusively and written by a later call, so a crash between them leaves
    // a zero-byte file — and AC-0080 calls this enumeration every proper
    // prefix. It classifies as unparseable, which is the second limb's input.
    for (let length = 0; length < complete.length; length += 1) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(complete.slice(0, length));
      } catch {
        continue; // unparseable — the second limb's input
      }
      const record = parsed as Record<string, unknown>;
      const yieldsBoth =
        typeof record?.pid === "number" &&
        typeof record?.startTime === "string" &&
        record.startTime !== "";
      if (!yieldsBoth) {
        // AC-0080 states this form is *unreachable* under this encoding, and
        // cites this case as what establishes it. Skipping such a prefix would
        // make that citation unfalsifiable: the count below would still be 1
        // and the criterion would rest on an assertion that cannot fail for the
        // claim it is cited for. So reaching here is a failure, not a `continue`.
        expect.unreachable(
          `a prefix of length ${length} parsed but yielded no start time, ` +
            "which AC-0080 declares unreachable under this encoding",
        );
      }
      parseablePrefixes += 1;
      expect(record.pid).toBe(truth.pid);
      expect(record.startTime).toBe(truth.startTime);
    }
    // Exactly one such prefix exists: the complete object without its newline.
    expect(parseablePrefixes).toBe(1);
  });
});

describe("AC-0076 and AC-0079 one removal takes the whole state root", () => {
  it("AC-0159 pins the contents of both rendering environments", () => {
    // Half the guard. AC-0081's first limb compares two renderings of
    // `ps -o lstart=` for byte equality, and there are two ways that breaks:
    // the pinned set's contents change, or a call site stops using the pinned
    // set. This case catches the first, on any host. The case below catches
    // the second. Neither catches both, which is why there are two — four
    // earlier attempts each caught one and were recorded as guarding both.
    expect({ ...LIVENESS_RENDERING_ENVIRONMENT }).toEqual({
      LANG: "C",
      LC_ALL: "C",
      TZ: "UTC",
    });

    const runtimeSide = buildPinnedEnvironment({
      home: "/does-not-reach-a-spawn/home",
      temporaryDirectory: "/does-not-reach-a-spawn/tmp",
    });
    for (const name of ["LANG", "LC_ALL", "TZ"] as const) {
      expect(runtimeSide[name]).toBe(LIVENESS_RENDERING_ENVIRONMENT[name]);
    }
    // A set, not a sequence: AC-0159 constrains the three determinism values,
    // and AC-0023 owns the name set. Comparing sorted keys still reddens when
    // `TZ` leaves the allowlist — the mutation this file would otherwise miss —
    // without failing on a reordering neither criterion constrains.
    expect(Object.keys(runtimeSide).sort()).toEqual(
      [...ENVIRONMENT_ALLOWLIST_NAMES].sort(),
    );
  });

  it("AC-0159 binds the Service-side call site to the pinned set, on any host", () => {
    // The other half. The case above asserts what the pinned set contains; it
    // cannot tell whether `readProcessStartTime` still uses it. Replacing that
    // call's `env` with `{ ...process.env }` left the whole file green on a UTC
    // host — recorded at `notes/verification-ledger.md#review-round-31-2026-09-18`.
    //
    // Forcing a non-UTC zone into this process catches that on **any** host,
    // because both compared values are then explicit and neither falls back to
    // `/etc/localtime`. Round 29 forced a zone too and it was inert: both sides
    // were closed environments, which cannot see an ambient. What makes it work
    // here is that the mutation being detected is precisely a call site that
    // *starts* inheriting from this process.
    const restore = process.env.TZ;
    process.env.TZ = "Pacific/Kiritimati"; // UTC+14, never equal to the pin
    try {
      const pinned = execFileSync(
        PROCESS_STATUS_EXECUTABLE,
        ["-o", "lstart=", "-p", String(process.pid)],
        { encoding: "utf8", env: { LANG: "C", LC_ALL: "C", TZ: "UTC" } },
      ).trim();
      const inheriting = execFileSync(
        PROCESS_STATUS_EXECUTABLE,
        ["-o", "lstart=", "-p", String(process.pid)],
        { encoding: "utf8" },
      ).trim();

      // Guard the guard: if the zone did not resolve, `ps` falls back to UTC and
      // the comparison below would pass for the wrong reason.
      expect(inheriting).not.toBe(pinned);

      expect(readProcessStartTime(process.pid)).toBe(pinned);
    } finally {
      if (restore === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = restore;
      }
    }
  });

  it("renders the same liveness token on both sides on this host", () => {
    // Corroboration, not a guard: it cannot fail on a UTC host if a pin is lost.
    // Its fixture reaches a real spawn as HOME and TMPDIR, so it comes from a
    // private per-test root rather than a predictable shared path.
    const root = mkdtempSync(join(tmpdir(), "liveness-render-"));
    try {
      const asTheRuntimeRenders = execFileSync(
        PROCESS_STATUS_EXECUTABLE,
        ["-o", "lstart=", "-p", String(process.pid)],
        {
          encoding: "utf8",
          env: buildPinnedEnvironment({
            home: join(root, "home"),
            temporaryDirectory: join(root, "tmp"),
          }),
        },
      ).trim();
      expect(readProcessStartTime(process.pid)).toBe(asTheRuntimeRenders);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("removes the tree, the home, the temp and the marker together", () => {
    const created = createPerRequestStateRoot(sweepDomain());
    writeFileSync(join(created.materializationRoot, "workspace.toml"), "x=1\n");
    mkdirSync(join(created.materializationRoot, "nested", "deep"), {
      recursive: true,
    });
    writeFileSync(join(created.home, ".gitconfig"), "");
    writeFileSync(join(created.temporaryDirectory, "scratch"), "");
    expect(removePerRequestStateRoot(created.stateRoot)).toEqual([]);
    expect(existsSync(created.stateRoot)).toBe(false);
  });

  it("refuses to descend a link, and removes nothing outside the root", () => {
    const domain = sweepDomain();
    const created = createPerRequestStateRoot(domain);
    const outside = join(domain, "outside");
    mkdirSync(outside);
    const witness = join(outside, "witness");
    writeFileSync(witness, "still here\n");
    // A link planted at depth, which the walk must unlink rather than follow.
    const nested = join(created.materializationRoot, "nested");
    mkdirSync(nested);
    symlinkSync(outside, join(nested, "escape"));
    symlinkSync(outside, join(created.stateRoot, "escape-at-top"));

    expect(removePerRequestStateRoot(created.stateRoot)).toEqual([]);
    expect(existsSync(created.stateRoot)).toBe(false);
    // The link's target and its contents survive: the walk never descended it.
    expect(existsSync(witness)).toBe(true);
    expect(readFileSync(witness, "utf8")).toBe("still here\n");
  });

  it("removes the marker last, so a partly-removed root is still marked", () => {
    const created = createPerRequestStateRoot(sweepDomain());
    // An unremovable child: a directory we cannot empty, because we drop the
    // write permission that `rmdir` of its parent would need.
    const stubborn = join(created.materializationRoot, "stubborn");
    mkdirSync(stubborn);
    writeFileSync(join(stubborn, "pinned"), "");
    chmodSync(stubborn, 0o500);
    try {
      const diagnostics = removePerRequestStateRoot(created.stateRoot);
      expect(diagnostics.length).toBeGreaterThan(0);
      // The root survived, and it is still marked — never an unmarked root
      // holding content.
      expect(existsSync(created.stateRoot)).toBe(true);
      expect(existsSync(created.markerPath)).toBe(true);
    } finally {
      chmodSync(stubborn, 0o700);
      rmSync(created.stateRoot, { recursive: true, force: true });
    }
  });
});

describe("readProcessStartTime distinguishes absent from uncomparable", () => {
  it("reports a time for a live process", () => {
    expect(typeof readProcessStartTime(process.pid)).toBe("string");
  });

  it("reports null — a determination — for a pid that is not running", () => {
    expect(readProcessStartTime(99998)).toBeNull();
  });

  it("reports undefined — uncomparable — for a malformed pid", () => {
    expect(readProcessStartTime(-1)).toBeUndefined();
    expect(readProcessStartTime(1.5)).toBeUndefined();
  });
});
