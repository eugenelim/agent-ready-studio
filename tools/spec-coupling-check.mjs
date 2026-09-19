#!/usr/bin/env node
// Semantic-coupling checks for a spec: the class lint-contract-item-alignment
// does not cover.
//
// It exists because a spec whose criteria cite composition tables can drift in
// ways no criterion-to-item linter sees: the prose says a table has eleven rows
// while the table has ten, a criterion cites an *Italicised Table Name* that no
// heading defines, an axis identifier is enumerated but named by no criterion,
// or a row silently loses cells so a column the preamble promised is simply
// absent. Each of those reads as correct in isolation and is only wrong in the
// relation between two places, which is why it survives review.
//
// Usage: node tools/spec-coupling-check.mjs <spec.md>
// Exits non-zero if any finding is reported.
//
// Checks:
//   C1  a stated row count that disagrees with the table it introduces
//   C2  a criterion citing an *Italicised Name* that no heading or bold label defines
//   C4  an identifier in an axis table that appears in no criterion
//   C5  a table row whose cell count disagrees with its own header
//
// Known limits, stated so they are not mistaken for coverage:
//   - C1 only associates a count with a table that begins within a few lines of
//     it; a count far from its table is not checked.
//   - No check here catches semantic contradiction. Two criteria that oblige
//     incompatible behaviour both parse clean.
//   - C3 (a defined label cited by no criterion) is deliberately not implemented:
//     prose-only labels are legitimate, so it produced only false positives.
import { readFileSync } from "node:fs";

const specPath = process.argv[2];
if (!specPath) {
  console.error("usage: node tools/spec-coupling-check.mjs <spec.md>");
  process.exit(2);
}

const text = readFileSync(specPath, "utf8");
const lines = text.split("\n");
const findings = [];
const rel = specPath;

// Inline code spans may contain a literal `|`, which would inflate a cell count.
const stripCode = (s) => s.replace(/`[^`]*`/g, "``");

const isSeparatorRow = (l) =>
  /^\|[\s:|-]+\|?\s*$/.test(l) && l.includes("-");

const cellsOf = (l) => {
  const t = stripCode(l).trim().replace(/^\|/, "").replace(/\|$/, "");
  return t.split("|").map((c) => c.trim());
};

// --- table inventory --------------------------------------------------------
// A table is a run of consecutive `|`-leading lines: header, separator, rows.
const tables = [];
for (let i = 0; i < lines.length; i++) {
  if (!lines[i].startsWith("|")) continue;
  if (!(i + 1 < lines.length && isSeparatorRow(lines[i + 1]))) continue;
  const header = cellsOf(lines[i]);
  const rows = [];
  let j = i + 2;
  for (; j < lines.length && lines[j].startsWith("|"); j++) {
    if (isSeparatorRow(lines[j])) continue;
    rows.push({ idx: j, cells: cellsOf(lines[j]) });
  }
  tables.push({ headerIdx: i, header, rows });
  i = j - 1;
}

// --- label inventory: headings and bold labels that can be cited ------------
const labels = new Set();
for (const l of lines) {
  let m = l.match(/^\*\*([A-Z][^*]{2,60}?)\.?\*\*/);
  if (m) labels.add(m[1].trim().replace(/\.$/, ""));
  m = l.match(/^#{2,4}\s+(.+?)\s*$/);
  if (m) labels.add(m[1].trim());
}
// A leading cell can itself name a concept a criterion cites.
for (const t of tables) {
  for (const r of t.rows) {
    const c = r.cells[0]?.replace(/[`*]/g, "").trim();
    if (c && /^[A-Z][A-Za-z0-9 /._-]{2,60}$/.test(c)) labels.add(c);
  }
}

// --- C5: row arity vs its own header ---------------------------------------
for (const t of tables) {
  const want = t.header.length;
  for (const r of t.rows) {
    if (r.cells.length !== want) {
      findings.push(
        `C5 ${rel}:${r.idx + 1}: row has ${r.cells.length} cells; ` +
          `its header (${rel}:${t.headerIdx + 1}) declares ${want} ` +
          `[${t.header.join(" | ")}]`,
      );
    }
  }
}

// --- C1: stated counts vs actual rows --------------------------------------
const WORDS = new Map(
  (
    "zero one two three four five six seven eight nine ten eleven twelve " +
    "thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty"
  )
    .split(" ")
    .map((w, n) => [w, n]),
);
const NEAR = 6; // a count introduces a table that follows it closely
for (let i = 0; i < lines.length; i++) {
  for (const m of stripCode(lines[i]).matchAll(/\b(?:the\s+)?([a-z]+|\d+)\s+rows?\b/g)) {
    const tok = m[1];
    const n = WORDS.has(tok) ? WORDS.get(tok) : /^\d+$/.test(tok) ? Number(tok) : null;
    if (n === null || n === 0) continue;
    const t = tables.find((t) => t.headerIdx >= i && t.headerIdx - i <= NEAR);
    if (t && t.rows.length !== n) {
      findings.push(
        `C1 ${rel}:${i + 1}: prose says ${n} rows; the table at ` +
          `${rel}:${t.headerIdx + 1} has ${t.rows.length}`,
      );
    }
  }
}

// --- C2: italicised citations in the criteria resolve -----------------------
const acStart = text.indexOf("## Acceptance Criteria");
const acText = acStart > 0 ? text.slice(acStart) : "";
const cited = new Set();
for (const m of acText.matchAll(/(?<!\*)\*(?!\*)([A-Z][^*\n]{3,60}?)\*(?!\*)/g)) {
  cited.add(m[1].trim().replace(/\.$/, ""));
}
const known = [...labels];
for (const name of [...cited].sort()) {
  if (labels.has(name)) continue;
  const lower = name.toLowerCase();
  if (known.some((k) => k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase()))) {
    continue;
  }
  findings.push(`C2 ${rel}: a criterion cites *${name}*, which no heading or bold label defines`);
}

// --- C4: axis identifiers named by no criterion -----------------------------
const AXIS_LABELS = ["Condition axis", "Verdict axis", "Version qualifier", "User-visible states"];
for (const axis of AXIS_LABELS) {
  const anchor = lines.findIndex(
    (l) => l.includes(axis) && (l.startsWith("#") || l.startsWith("**")),
  );
  if (anchor < 0) continue;
  const t = tables.find((t) => t.headerIdx >= anchor);
  if (!t) continue;
  for (const r of t.rows) {
    const m = r.cells[0]?.match(/^`([a-z][a-z0-9-]+)`/);
    if (m && !acText.includes(`\`${m[1]}\``)) {
      findings.push(`C4 ${rel}:${r.idx + 1}: ${axis}: \`${m[1]}\` is named by no criterion`);
    }
  }
}

for (const f of findings) console.log(f);
console.log(`spec-coupling-check: ${findings.length} finding(s)`);
process.exit(findings.length > 0 ? 1 : 0);
