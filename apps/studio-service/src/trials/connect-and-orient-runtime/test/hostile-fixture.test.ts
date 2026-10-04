import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { pinnedGitConfigurationArgs } from "../git-driver.js";
import { foldsToDotGit, mountHfsVolume } from "./hfs-volume.js";
import {
  buildHostileFixture,
  DOT_GIT_CASE_ENTRY,
  DOT_GIT_UNICODE_ENTRY,
  disposeHostileFixtures,
  HOSTILE_CASE_BY_CRITERION,
  HOSTILE_CASES,
  inspectSubmoduleConstruction,
  materialize,
  observeProcessTree,
  POSITIVE_CONTROL_CRITERIA,
  POSITIVE_CONTROL_PROOFS,
  runFixturePositiveControl,
  SUBMODULE_GITLINK_PATH,
  sourceObjectHasDotGitVariant,
} from "./hostile-fixture.js";

// Every case here builds a real git repository and, for the positive controls,
// spawns git. That work exceeds vitest's 5s default whenever the machine is busy
// (6.9s, 9.5s and 12.9s observed under concurrent load), so the suite is given a
// generous file-level budget. This is a scheduling allowance, not a slow
// assertion: each test still fails on its own assertion, and the budget is set
// here rather than per test. The stub block below has **diverged** from plan.md's
// pinned T1 text: `pinHooksPath: false` became
// `omitPinPrefix: "core.hooksPath"` when the fixture was bound to
// PINNED_GIT_CONFIGURATION, and T1 is a completed pinned section that cannot be
// edited. The exemption is kept so the block stays diffable against that pinned
// text, not because it matches.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

afterEach(() => {
  disposeHostileFixtures();
});

describe.skipIf(process.platform !== "darwin")("scratch HFS+ volume", () => {
  it("folds the zero-width non-joiner spelling to .git and cleans up", () => {
    const volume = mountHfsVolume();
    try {
      expect(foldsToDotGit(volume.mountPoint)).toBe(true);
    } finally {
      volume.dispose();
    }
    expect(existsSync(volume.mountPoint)).toBe(false);
    expect(existsSync(volume.root)).toBe(false);
  });
});

// biome-ignore format: kept diffable against plan.md's pinned T1 stub, which has diverged
it("AC-0147 a hook probe fires when the guard is removed", async () => {
 const fx = await buildHostileFixture({ omitPinPrefix: "core.hooksPath" });
 const seen = await observeProcessTree(() => materialize(fx));
 expect(seen.map((p) => p.argv0)).toContain("post-checkout");
});

describe("AC-0149 hostile fixture corpus", () => {
  it("materializes through the product-shaped pinned Git sequence", async () => {
    const fixture = await buildHostileFixture({
      caseId: "instruction-shaped-text",
    });
    await materialize(fixture);

    expect(
      readFileSync(join(fixture.worktree, ".git/config"), "utf8"),
    ).not.toContain('[remote "origin"]');
    expect(fixture.gitInvocations.map(({ args }) => args)).toEqual([
      [
        ...pinnedGitConfigurationArgs(),
        "init",
        "--quiet",
        "--",
        fixture.worktree,
      ],
      [
        ...pinnedGitConfigurationArgs(),
        "fetch",
        "--depth=1",
        "--no-tags",
        "--",
        fixture.source,
        fixture.resolvedSha,
      ],
      [
        ...pinnedGitConfigurationArgs(),
        "checkout",
        "--detach",
        "--force",
        "FETCH_HEAD",
      ],
      [...pinnedGitConfigurationArgs(), "rev-parse", "--verify", "HEAD"],
    ]);
  });

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

  it("builds the Unicode-ignorable dot-git spelling on request", async () => {
    const fixture = await buildHostileFixture({
      caseId: "dot-git-variant",
      dotGitVariantEntry: DOT_GIT_UNICODE_ENTRY,
    });

    expect(fixture.dotGitVariantEntry).toBe(DOT_GIT_UNICODE_ENTRY);
    expect(sourceObjectHasDotGitVariant(fixture)).toBe(true);
  });

  it("builds the dotGitVariantChild fixture as a tree entry with a blob child", async () => {
    const fixture = await buildHostileFixture({
      caseId: "dot-git-variant",
      dotGitVariantEntry: DOT_GIT_UNICODE_ENTRY,
      dotGitVariantChild: "config",
    });
    const entry = DOT_GIT_UNICODE_ENTRY;
    const typeAtEntry = spawnSync(
      "/usr/bin/git",
      ["cat-file", "-t", `HEAD:${entry}`],
      { cwd: fixture.source, encoding: "utf8" },
    );
    const typeAtChild = spawnSync(
      "/usr/bin/git",
      ["cat-file", "-t", `HEAD:${entry}/config`],
      { cwd: fixture.source, encoding: "utf8" },
    );
    expect(typeAtEntry.stdout.trim()).toBe("tree");
    expect(typeAtChild.stdout.trim()).toBe("blob");
  });

  it("builds the default dot-git-variant fixture with a blob entry", async () => {
    const fixture = await buildHostileFixture({ caseId: "dot-git-variant" });
    const typeAtEntry = spawnSync(
      "/usr/bin/git",
      ["cat-file", "-t", `HEAD:${DOT_GIT_CASE_ENTRY}`],
      { cwd: fixture.source, encoding: "utf8" },
    );
    expect(typeAtEntry.stdout.trim()).toBe("blob");
  });

  it("builds the submodule case as a real gitlink into a local child repository", async () => {
    // Three clauses, because a submodule is all three: the declaration, the
    // gitlink, and a commit that exists somewhere. `.gitmodules` text alone
    // makes every recursion proof hold by construction.
    const fixture = await buildHostileFixture({ caseId: "submodule" });
    const child = fixture.submoduleChild;

    expect(child?.path.startsWith(fixture.root)).toBe(true);
    expect(child?.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(inspectSubmoduleConstruction(fixture)).toEqual({
      gitlinkEntry: `160000 commit ${child?.commit}\t${SUBMODULE_GITLINK_PATH}`,
      childHasCommit: true,
      declaredUrl: child?.path,
    });
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

function namedTestBody(source: string, testName: string): string {
  const marker = `it("${testName}"`;
  const start = source.indexOf(marker);
  expect(start, `missing test: ${testName}`).toBeGreaterThanOrEqual(0);
  expect(
    source.indexOf(marker, start + marker.length),
    `duplicate test name: ${testName}`,
  ).toBe(-1);
  // The formatter closes a test with `});` at the indentation of its `it(`
  // line, so the body ends there rather than at the next test.
  const lineStart = source.lastIndexOf("\n", start) + 1;
  const indent = source.slice(lineStart, start);
  const closer = `\n${indent}});`;
  const end = source.indexOf(closer, start);
  expect(end, `unterminated test: ${testName}`).toBeGreaterThan(start);
  return source.slice(start, end + closer.length);
}

describe("AC-0147 positive controls", () => {
  it("enumerates AC-0133 through AC-0146 exactly once with non-property controls", () => {
    expect(Object.keys(POSITIVE_CONTROL_PROOFS)).toEqual([
      ...POSITIVE_CONTROL_CRITERIA,
    ]);
    expect(POSITIVE_CONTROL_CRITERIA).toHaveLength(14);
    expect(POSITIVE_CONTROL_CRITERIA.at(0)).toBe("AC-0133");
    expect(POSITIVE_CONTROL_CRITERIA.at(-1)).toBe("AC-0146");

    const seenCases = new Set<string>();
    for (const criterion of POSITIVE_CONTROL_CRITERIA) {
      const proof = POSITIVE_CONTROL_PROOFS[criterion];
      expect(proof.caseId, criterion).toBe(
        HOSTILE_CASE_BY_CRITERION[criterion],
      );
      expect(proof.observation, criterion).not.toBe("");
      expect(proof.mechanism.kind, criterion).not.toMatch(
        /fixture-property|literal-construction/,
      );
      expect(proof.mechanism.removedGuard.trim(), criterion).not.toBe("");
      const source = readFileSync(
        new URL(proof.binding.source, import.meta.url),
        "utf8",
      );
      expect(proof.binding.guardedTests.length, criterion).toBeGreaterThan(0);
      expect(proof.binding.controlTests.length, criterion).toBeGreaterThan(0);
      const matchedEvidence = new Set<string>();
      for (const testName of [
        ...proof.binding.guardedTests,
        ...proof.binding.controlTests,
      ]) {
        const body = namedTestBody(source, testName);
        const matches = proof.binding.evidence.filter((token) =>
          body.includes(token),
        );
        expect(matches, `${criterion}: ${testName}`).not.toEqual([]);
        for (const token of matches) matchedEvidence.add(token);
      }
      expect(
        [...matchedEvidence].toSorted(),
        `${criterion}: unused executable evidence`,
      ).toEqual([...proof.binding.evidence].toSorted());
      seenCases.add(proof.caseId);
    }
    expect(seenCases.size).toBe(POSITIVE_CONTROL_CRITERIA.length);
  });

  it.each([
    "repository-hook",
    "escaping-symlink",
    "escaping-reader-path",
    "submodule",
    "prototype-key",
    "materialized-module",
  ] as const)("observes the %s effect with its guard removed", async (caseId) => {
    await expect(runFixturePositiveControl(caseId)).resolves.toBe(true);
  });
});
