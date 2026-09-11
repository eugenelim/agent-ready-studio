#!/usr/bin/env node
// Reproduces the criterion-to-evidence trace the verification ledger cites.
//
// It exists because that trace was once described as mechanical while being
// reproducible by no command: a plain `AC-\d+` scan cannot recover the joined
// forms test titles use ("AC-13 and AC-18", "AC-23/27"), so the stated numbers
// could not be checked and a retitle would have broken them silently.
//
// Usage: node tools/criterion-trace.mjs
// Exits non-zero if any criterion is neither named in a test title nor listed
// below as discharged elsewhere.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Criteria whose evidence is not a test title, with where it is instead.
const evidencedElsewhere = new Map([
  [1, "invocation of the seven pnpm commands, recorded in the ledger"],
  [37, "apps/desktop/tools/visual-evidence.mjs viewport and zoom assertions"],
  [38, "apps/desktop/tools/visual-evidence.mjs action-set equality assertions"],
]);

const root = new URL("..", import.meta.url).pathname;
const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    if (entry === "node_modules" || entry === "dist" || entry === "out") return [];
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const spec = readFileSync(
  join(root, "docs/specs/product-development-walking-skeleton/spec.md"),
  "utf8",
);
// Both notations. Matching only `- [x]` made an unchecked criterion vanish from
// the total and from the exit check, so the tool would have gone quiet at exactly
// the moment a criterion regressed.
const declared = [...spec.matchAll(/^- \[([ x])\] \*\*AC-(\d+)\*\*/gm)].map(
  (m) => ({ id: Number(m[2]), met: m[1] === "x" }),
);
const criteria = [...new Set(declared.map((entry) => entry.id))].sort(
  (a, b) => a - b,
);
const unmet = declared.filter((entry) => !entry.met).map((entry) => entry.id);

const named = new Set();
for (const file of walk(join(root, "apps")).concat(walk(join(root, "packages")))) {
  if (!/\.test\.tsx?$/.test(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!/\bit(\.each)?\s*\(|\)\s*\(\s*["'`]/.test(line)) continue;
    // Joined forms: "AC-20/23/32" and "AC-13 and AC-18" both resolve to each number.
    for (const match of line.matchAll(/AC-(\d+(?:\/\d+)*)/g))
      for (const part of match[1].split("/")) named.add(Number(part));
  }
}

const missing = criteria.filter(
  (c) => !named.has(c) && !evidencedElsewhere.has(c),
);
const elsewhere = criteria.filter((c) => !named.has(c) && evidencedElsewhere.has(c));

process.stdout.write(
  `criteria: ${criteria.length}\n` +
    (unmet.length > 0 ? `not yet met: ${unmet.join(", ")}\n` : "") +
    `named in a test title: ${criteria.filter((c) => named.has(c)).length}\n` +
    `evidenced elsewhere: ${elsewhere.length}\n`,
);
for (const c of elsewhere)
  process.stdout.write(`  AC-${String(c).padStart(2, "0")}: ${evidencedElsewhere.get(c)}\n`);
if (missing.length > 0) {
  process.stdout.write(`untraced: ${missing.join(", ")}\n`);
  process.exitCode = 1;
}
if (unmet.length > 0) process.exitCode = 1;
