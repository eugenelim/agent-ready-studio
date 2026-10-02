import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { pinnedGitConfigurationArgs } from "../git-driver.js";
import { foldsToDotGit, mountHfsVolume } from "./hfs-volume.js";

// Every case here builds a real git repository and, for the positive controls,
// spawns git. That work exceeds vitest's 5s default whenever the machine is busy
// (6.9s, 9.5s and 12.9s observed under concurrent load), so the suite is given a
// generous file-level budget. This is a scheduling allowance, not a slow assertion:
// each test still fails on its own assertion, and the budget is set here rather
// than per test. The stub block below has **diverged** from plan.md's pinned T1 text:
// `pinHooksPath: false` became `omitPinPrefix: "core.hooksPath"` when the fixture was bound to
// PINNED_GIT_CONFIGURATION, and T1 is a completed pinned section that cannot be edited. The
// exemption is kept so the block stays diffable against that pinned text, not because it matches.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

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
  runPositiveControl,
  SUBMODULE_GITLINK_PATH,
  sourceObjectHasDotGitVariant,
} from "./hostile-fixture.js";

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
