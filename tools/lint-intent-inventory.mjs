#!/usr/bin/env node
// Checks the durable capability-intent inventory: docs/product/intents/*.md,
// its index in docs/product/capability-intents.md, and the intent pointers in
// workspace.toml.
//
// It exists because no other gate covers this. `biome check` scopes to
// package.json, biome.json, vitest.config.ts, packages/ and apps/ — it never
// reads docs/. The workspace-status backend validates lifecycle membership but
// says nothing about whether a slug matches its filename, whether an ID is
// unique, or whether the index links somewhere real.
//
// It deliberately does NOT parse workspace.toml's lifecycle model. It extracts
// docs/product/intents/... pointers and checks they resolve; routing,
// dependency satisfaction, and dispatch remain workspace-status's alone.
//
// Usage: node tools/lint-intent-inventory.mjs
// Exits non-zero on any failure, listing every failure rather than the first.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const INTENTS_DIR = "docs/product/intents";
const INDEX = "docs/product/capability-intents.md";
const WORKSPACE = "workspace.toml";

const failures = [];
const fail = (message) => failures.push(message);

const files = readdirSync(INTENTS_DIR)
  .filter((name) => name.endsWith(".md"))
  .sort();

if (files.length === 0) fail(`${INTENTS_DIR}: no intent files found`);

// ── Per-file preamble fields ─────────────────────────────────────────────────
// The preamble ends at the first "## " heading; a field is the canonical
// list-item form "- **Name:** value", matching how the workspace backend reads
// artifact status.
const preambleField = (text, name) => {
  for (const line of text.split("\n")) {
    if (/^ {0,3}#{2,}(\s|$)/.test(line)) break;
    const match = line.match(/^- \*\*([^*]+):\*\*\s*(.*)$/);
    if (match && match[1].trim() === name) return match[2].trim();
  }
  return null;
};

const idsSeen = new Map();
const slugToId = new Map();
const initiativeOf = new Map();

for (const file of files) {
  const path = join(INTENTS_DIR, file);
  const text = readFileSync(path, "utf8");
  const expectedSlug = file.replace(/\.md$/, "");

  const status = preambleField(text, "Status");
  if (status !== "Draft") fail(`${path}: Status is ${status ?? "absent"}, expected Draft`);

  const slug = (preambleField(text, "Slug") ?? "").replace(/^`|`$/g, "");
  if (slug !== expectedSlug) fail(`${path}: Slug "${slug}" does not match filename "${expectedSlug}"`);

  const id = preambleField(text, "ID");
  if (!id) {
    fail(`${path}: no ID field`);
  } else if (idsSeen.has(id)) {
    fail(`${path}: duplicate ID ${id}, already used by ${idsSeen.get(id)}`);
  } else {
    idsSeen.set(id, path);
    slugToId.set(expectedSlug, id);
  }

  // Capability intents declare exactly one initiative; the two parent intents
  // (product-vision, product-strategy) sit above the initiative grouping.
  const level = preambleField(text, "Level");
  const initiative = preambleField(text, "Initiative");
  if (level === "capability") {
    if (!initiative) fail(`${path}: capability intent declares no Initiative`);
    else initiativeOf.set(id, initiative.split("—")[0].trim());
  } else if (initiative) {
    fail(`${path}: ${level} intent declares an Initiative; only capability intents do`);
  }

  // A line-wrapped "](" is not an inline link at all: Markdown renders the
  // literal brackets and the URL. Catch it before checking link targets, since
  // the well-formed-link scan below cannot see it.
  for (const [] of text.matchAll(/\]\s*\n\s*\(/g)) {
    fail(`${path}: link split across lines between "]" and "("`);
  }

  // Relative links inside the file must resolve.
  for (const [, target] of text.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
    if (/^[a-z]+:/.test(target)) continue;
    const resolved = resolve(dirname(path), target);
    if (!existsSync(resolved)) fail(`${path}: broken link to ${target}`);
  }
}

// ── Index coverage ───────────────────────────────────────────────────────────
const indexText = readFileSync(INDEX, "utf8");
const linked = new Set();
for (const [, target] of indexText.matchAll(/\]\((intents\/[^)#\s]+)\)/g)) {
  linked.add(target.replace(/^intents\//, ""));
  const resolved = resolve(dirname(INDEX), target);
  if (!existsSync(resolved)) fail(`${INDEX}: broken link to ${target}`);
}
for (const file of files) {
  if (!linked.has(file)) fail(`${INDEX}: no link to ${INTENTS_DIR}/${file}`);
}
for (const id of idsSeen.keys()) {
  const occurrences = indexText.split(id).length - 1;
  if (occurrences === 0) fail(`${INDEX}: ${id} is not represented`);
}

// ── Every relative link under docs/product/ resolves ─────────────────────────
// Wider than the intents themselves because the index, the README, and the
// roadmap cross-link into intents/ and each other; a rename that breaks one of
// those is the same defect class and nothing else catches it.
const walk = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
};
for (const path of walk("docs/product")) {
  const text = readFileSync(path, "utf8");
  for (const [, target] of text.matchAll(/\]\(([^)\s]+?)(?:#[^)]*)?\)/g)) {
    if (/^[a-z]+:/.test(target) || target.startsWith("#")) continue;
    if (!existsSync(resolve(dirname(path), target))) {
      fail(`${path}: broken link to ${target}`);
    }
  }
}

// ── Workspace intent pointers resolve ────────────────────────────────────────
const workspaceText = readFileSync(WORKSPACE, "utf8");
const registered = new Set();
for (const [, target] of workspaceText.matchAll(/path = "(docs\/product\/intents\/[^"]+)"/g)) {
  if (!existsSync(target)) fail(`${WORKSPACE}: intent pointer ${target} does not resolve`);
  registered.add(target);
}
for (const file of files) {
  const target = `${INTENTS_DIR}/${file}`;
  if (!registered.has(target)) fail(`${WORKSPACE}: ${target} is not registered`);
}

if (failures.length > 0) {
  for (const message of failures) console.error(`intent-inventory: ${message}`);
  console.error(`intent-inventory: ${failures.length} failure(s)`);
  process.exit(1);
}

const capabilities = [...initiativeOf.keys()].length;
const initiatives = new Set(initiativeOf.values()).size;
// Deliberately narrow wording: this gate proves each intent file has a pointer
// in workspace.toml that resolves, not that the pointer's collection, kind,
// source, or lifecycle placement is correct. Those belong to workspace-status.
console.log(
  `intent-inventory: ok — ${files.length} intent files (${capabilities} capabilities ` +
    `across ${initiatives} initiatives); IDs unique, slugs match filenames, links ` +
    `resolve, all linked from the index and pointed to from workspace.toml. ` +
    `Lifecycle placement is workspace-status's check, not this one.`,
);
