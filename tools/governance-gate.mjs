#!/usr/bin/env node
// Runs the governance checks that ship with the `new-adr` and `new-rfc` skills
// against docs/adr and docs/rfc: ordinal uniqueness, ADR index agreement, and
// ADR record shape.
//
// It exists because no other gate covers docs/adr or docs/rfc. `biome check`
// scopes to package.json, biome.json, vitest.config.ts, packages/ and apps/ —
// it never reads docs/. `tools/lint-intent-inventory.mjs` covers capability
// intents, not decision records.
//
// It deliberately owns NO checking logic. Every check is a script's, not this
// file's. Pack checks are reached through whichever adapter root the pack was
// projected into — a second implementation of a shape check would drift from
// the pack's, and the pack is the authority on its own format. Repository-owned
// checks live in `tools/` and are run from there, because a repository script
// placed in a pack-managed skill tree is removed by the next pack upgrade.
//
// docs/rfc gets the ordinal check but NOT an index check: that index is
// hand-written by decision, so `index-records.py --check` would fail on it by
// construction. The ordinal check is index-independent, so excluding it would
// leave duplicate RFC ordinals unguarded.
//
// A missing adapter root is a hard failure, not a skip. `tools/hooks/pre-pr.py`
// degrades a missing tool to a skip because it ships to repositories that may
// not have the pack installed; this gate is written for this repository, where
// the scripts are known to be projected, so their absence means the projection
// broke and must be loud.
//
// Usage: node tools/governance-gate.mjs   (runnable from any directory)
// Exits non-zero on any failure, running every check rather than stopping at
// the first, so one run yields the whole worklist.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PYTHON = "python3";

// Anchored to this file's own location, not process.cwd(). Resolving from the
// caller's directory made every invocation from a subdirectory report a broken
// projection for an intact one — a false accusation that sent the reader to
// repair nothing.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Each check names the skill whose scripts/ directory holds it, because the
// two skills project into sibling directories under one adapter root.
const CHECKS = [
  { skill: "new-adr", script: "next-ordinal.py", args: ["--check", "docs/adr"] },
  { skill: "new-adr", script: "index-records.py", args: ["--check", "docs/adr"] },
  { skill: "new-adr", script: "lint-adr-shape.py", args: ["docs/adr"] },
  { skill: "new-rfc", script: "next-ordinal.py", args: ["--check", "docs/rfc"] },
];

// Probed in order; the first root holding every required script wins. Both
// exist in a dual-adapter install, and the scripts are pinned byte-identical
// upstream, so either answers the same. Probing rather than hardcoding means
// removing one projection cannot silently disable the gate.
const ADAPTER_ROOTS = [".claude/skills", ".agents/skills"];

const required = CHECKS.map(({ skill, script }) => join(skill, "scripts", script));

const skillsRoot = ADAPTER_ROOTS.find((root) =>
  required.every((relative) => existsSync(join(REPO_ROOT, root, relative))),
);

if (skillsRoot === undefined) {
  console.error(
    "governance-gate: no adapter root holds every required script.\n" +
      `  repository root: ${REPO_ROOT}\n` +
      `  probed: ${ADAPTER_ROOTS.join(", ")}\n` +
      `  required: ${required.join(", ")}\n` +
      "  The pack projection is incomplete — re-run\n" +
      "  `agentbundle upgrade --pack governance-extras --scope repo --adapter <adapter>`.",
  );
  process.exit(1);
}

const failures = [];

for (const { skill, script, args } of CHECKS) {
  const label = `${skill}/${script} ${args.join(" ")}`;
  // Inherit stdio: each script already reports its own findings per record, and
  // capturing would mean re-printing someone else's output format. cwd is the
  // repository root so the scripts' relative record-directory arguments resolve
  // the same way however the gate was invoked.
  const result = spawnSync(
    PYTHON,
    [join(REPO_ROOT, skillsRoot, skill, "scripts", script), ...args],
    { cwd: REPO_ROOT, stdio: "inherit" },
  );

  if (result.error) {
    failures.push(`${label}: could not run ${PYTHON} (${result.error.message})`);
    continue;
  }
  if (result.signal !== null) {
    failures.push(`${label}: killed by signal ${result.signal}`);
    continue;
  }
  if (result.status !== 0) {
    failures.push(`${label}: exit ${result.status}`);
    continue;
  }
  console.log(`governance-gate: ok  ${label}`);
}

// Repository-owned checks. These are not skill scripts, so they are not
// probed under an adapter root: a script placed in a pack-managed skill tree
// is removed by the next pack upgrade. The gate still owns no checking logic
// -- each entry delegates to a script in `tools/`.
// Discovered rather than named: a literal path here fails `pnpm verify` for
// reasons unrelated to the change making it, the moment that note is moved,
// renamed or removed as its spec ships. A spec with no audit note contributes
// no check.
const auditNotes = existsSync(join(REPO_ROOT, "docs/specs"))
  ? readdirSync(join(REPO_ROOT, "docs/specs"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `docs/specs/${entry.name}/notes/acceptance-audit.md`)
      .filter((relative) => existsSync(join(REPO_ROOT, relative)))
      .sort()
  : [];

const LOCAL_CHECKS = [
  { script: "acceptance-audit-counts.py", args: ["--self-test"] },
  ...auditNotes.map((relative) => ({
    script: "acceptance-audit-counts.py",
    args: ["--check", relative],
  })),
];

for (const { script, args } of LOCAL_CHECKS) {
  const label = `tools/${script} ${args.join(" ")}`;
  const result = spawnSync(PYTHON, [join(REPO_ROOT, "tools", script), ...args], {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });
  if (result.error) {
    failures.push(`${label}: could not run ${PYTHON} (${result.error.message})`);
    continue;
  }
  if (result.signal !== null) {
    failures.push(`${label}: killed by signal ${result.signal}`);
    continue;
  }
  if (result.status !== 0) {
    failures.push(`${label}: exit ${result.status}`);
    continue;
  }
  console.log(`governance-gate: ok  ${label}`);
}

if (failures.length > 0) {
  console.error(`\ngovernance-gate: ${failures.length} check(s) failed:`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `governance-gate: all ${CHECKS.length + LOCAL_CHECKS.length} checks passed (${skillsRoot} plus tools/)`,
);
