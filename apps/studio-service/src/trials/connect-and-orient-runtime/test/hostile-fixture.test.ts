import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

// Every case here builds a real git repository and, for the positive controls,
// spawns git. That work exceeds vitest's 5s default whenever the machine is busy
// (6.9s, 9.5s and 12.9s observed under concurrent load), so the suite is given a
// generous file-level budget. This is a scheduling allowance, not a slow assertion:
// each test still fails on its own assertion, and the budget is set here rather
// than per test so the approved AC-0147 stub block stays byte-identical to plan.md.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

import {
  buildHostileFixture,
  disposeHostileFixtures,
  HOSTILE_CASE_BY_CRITERION,
  HOSTILE_CASES,
  materialize,
  observeProcessTree,
  runPositiveControl,
  sourceObjectHasDotGitVariant,
} from "./hostile-fixture.js";

afterEach(() => {
  disposeHostileFixtures();
});

// biome-ignore format: approved plan stub must remain byte-identical
it("AC-0147 a hook probe fires when the guard is removed", async () => {
 const fx = await buildHostileFixture({ pinHooksPath: false });
 const seen = await observeProcessTree(() => materialize(fx));
 expect(seen.map((p) => p.argv0)).toContain("post-checkout");
});

describe("AC-0149 hostile fixture corpus", () => {
  it("names every security-proof and bound case", () => {
    expect(HOSTILE_CASES).toEqual([
      "repository-hook",
      "package-script",
      "projected-skill-executable",
      "dot-git-variant",
      "attribute-filter",
      "instruction-shaped-text",
      "escaping-symlink",
      "escaping-reader-path",
      "submodule",
      "option-shaped-ref",
      "prototype-key",
      "materialized-module",
      "authorization-header",
      "credential-sink",
      "tree-bytes-bound",
      "file-count-bound",
      "single-file-bound",
      "result-bytes-bound",
      "persisted-content-bound",
    ]);
    expect(HOSTILE_CASE_BY_CRITERION).toEqual({
      "AC-0133": "repository-hook",
      "AC-0134": "package-script",
      "AC-0135": "projected-skill-executable",
      "AC-0136": "dot-git-variant",
      "AC-0137": "attribute-filter",
      "AC-0138": "instruction-shaped-text",
      "AC-0139": "escaping-symlink",
      "AC-0140": "escaping-reader-path",
      "AC-0141": "submodule",
      "AC-0142": "option-shaped-ref",
      "AC-0143": "prototype-key",
      "AC-0144": "materialized-module",
      "AC-0145": "authorization-header",
      "AC-0146": "credential-sink",
      "AC-0051": "file-count-bound",
      "AC-0075": "single-file-bound",
      "AC-0037": "result-bytes-bound",
      "AC-0104": "persisted-content-bound",
    });
  });

  it("builds the checkout-observable dot-git variant into the source object database", async () => {
    const fixture = await buildHostileFixture({ caseId: "dot-git-variant" });
    expect(sourceObjectHasDotGitVariant(fixture)).toBe(true);
  });

  it.each(
    HOSTILE_CASES,
  )("builds %s without a network or remote service", async (caseId) => {
    const fixture = await buildHostileFixture({ caseId });
    expect(fixture.source).toContain(fixture.root);
  });

  it.each([
    ["tree-bytes-bound", "tree-bytes"],
    ["single-file-bound", "single-file-bytes"],
    ["result-bytes-bound", "result-bytes"],
    ["persisted-content-bound", "persisted-content-bytes"],
  ] as const)("builds %s one byte beyond an injected limit", async (caseId, file) => {
    const fixture = await buildHostileFixture({ caseId, boundLimit: 3 });
    expect(readFileSync(join(fixture.source, ".probe", file))).toHaveLength(4);
  });

  it("builds the file-count case one entry beyond an injected limit", async () => {
    const fixture = await buildHostileFixture({
      caseId: "file-count-bound",
      boundLimit: 3,
    });
    expect(readdirSync(join(fixture.source, ".probe/files"))).toHaveLength(4);
  });
});

describe("AC-0147 positive controls", () => {
  it.each([
    "repository-hook",
    "package-script",
    "projected-skill-executable",
    "dot-git-variant",
    "attribute-filter",
    "instruction-shaped-text",
    "escaping-symlink",
    "escaping-reader-path",
    "submodule",
    "option-shaped-ref",
    "prototype-key",
    "materialized-module",
    "authorization-header",
    "credential-sink",
  ] as const)("observes the %s effect with its guard removed", async (caseId) => {
    await expect(runPositiveControl(caseId)).resolves.toBe(true);
  });
});
