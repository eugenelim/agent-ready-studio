/**
 * The twelve absence proofs whose observed surface exists by T6: AC-0133 to
 * AC-0137 and AC-0139 to AC-0145.
 *
 * Each one reuses the corpus case T1 built and the probe T1's control
 * validated, and observes the guarded path through the same channel that
 * control observes the unguarded one. That symmetry is the whole point: an
 * absence read from a channel no control ever fired on proves nothing, and it
 * is what AC-0147 will range over once the last of these criteria lands.
 *
 * AC-0138 and AC-0146 are deliberately absent. AC-0138 observes a verdict, a
 * routing decision and a state, none of which exist until T9 and T10; AC-0146
 * observes storage, which does not exist until T11. Both are gated there and
 * reuse this harness, so probe identity stays pinned across all three.
 */
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import module from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { canonicalizeSource } from "../../source-identity.js";
import {
  PINNED_GIT_CONFIGURATION,
  pinnedGitConfigurationArgs,
} from "./git-driver.js";
import {
  InadmissibleKeyError,
  parseGuardedJson,
  parseGuardedToml,
} from "./inadmissible-keys.js";
import {
  ConfinementError,
  readContainedFile,
} from "./materialization-confinement.js";
import {
  buildPinnedEnvironment,
  ENVIRONMENT_ALLOWLIST_NAMES,
} from "./runtime-environment.js";
import {
  buildHostileFixture,
  disposeHostileFixtures,
  type HostileCase,
  materialize,
  observeProcessTree,
  PROBE_LOG_MARKER,
  runPositiveControl,
} from "./test/hostile-fixture.js";

// Every case builds a real git repository and spawns git, which exceeds
// vitest's 5s default whenever this machine is busy. Same allowance, same
// reason, as the corpus suite: each test still fails on its own assertion.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

afterEach(() => {
  disposeHostileFixtures();
});

/** Every path under `root`, relative to it, without following a single link. */
function walk(root: string, prefix = ""): string[] {
  const found: string[] = [];
  for (const name of readdirSync(join(root, prefix))) {
    const relativePath = prefix === "" ? name : join(prefix, name);
    found.push(relativePath);
    if (lstatSync(join(root, relativePath)).isDirectory()) {
      found.push(...walk(root, relativePath));
    }
  }
  return found;
}

/**
 * Materializes a case under the guard and returns every marker the process
 * tree recorded. An executable-shaped case that ran would have appended its
 * marker here, exactly as its control does.
 */
async function markersDuringMaterialization(
  caseId: HostileCase,
): Promise<string[]> {
  const fixture = await buildHostileFixture({ caseId });
  const seen = await observeProcessTree(() => materialize(fixture));
  return seen.map(({ argv0 }) => argv0);
}

describe("AC-0133 no repository hook runs during inspection", () => {
  it("records no hook in the process tree with the pinned hooks path", async () => {
    const markers = await markersDuringMaterialization("repository-hook");

    expect(markers).not.toContain(PROBE_LOG_MARKER["repository-hook"]);
    expect(markers).toEqual([]);
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("repository-hook")).resolves.toBe(true);
  });
});

describe("AC-0134 no package script runs during inspection", () => {
  it("records no package script in the process tree", async () => {
    const markers = await markersDuringMaterialization("package-script");

    expect(markers).not.toContain(PROBE_LOG_MARKER["package-script"]);
    expect(markers).toEqual([]);
  });

  it("materializes the script without running it", async () => {
    const fixture = await buildHostileFixture({ caseId: "package-script" });
    await materialize(fixture);

    // The declaration and the script are both present: the observation above
    // is of a repository that genuinely carries the thing that did not run.
    expect(
      readFileSync(join(fixture.worktree, "package.json"), "utf8"),
    ).toContain("postinstall");
    expect(
      existsSync(join(fixture.worktree, ".probe/package-script.mjs")),
    ).toBe(true);
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("package-script")).resolves.toBe(true);
  });
});

describe("AC-0135 no projected skill executable runs during inspection", () => {
  it("records no projected skill in the process tree", async () => {
    const markers = await markersDuringMaterialization(
      "projected-skill-executable",
    );

    expect(markers).not.toContain(
      PROBE_LOG_MARKER["projected-skill-executable"],
    );
    expect(markers).toEqual([]);
  });

  it("materializes the executable without running it", async () => {
    const fixture = await buildHostileFixture({
      caseId: "projected-skill-executable",
    });
    await materialize(fixture);

    expect(
      existsSync(join(fixture.worktree, ".agents/skills/hostile/run")),
    ).toBe(true);
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(
      runPositiveControl("projected-skill-executable"),
    ).resolves.toBe(true);
  });
});

describe("AC-0136 a .git variant does not overwrite the real .git", () => {
  /**
   * The guard refuses the whole checkout rather than writing a neutralized
   * entry: `core.protectHFS` makes `.GIT` an invalid path on a filesystem
   * where it would collide with `.git`. Nothing is overwritten because nothing
   * is written, which is the strongest form the criterion can hold. The
   * refusal is asserted rather than tolerated, so a future configuration that
   * silently admitted the entry would fail here rather than pass quietly.
   */
  it("refuses the checkout that carries the variant entry", async () => {
    const fixture = await buildHostileFixture({ caseId: "dot-git-variant" });

    await expect(materialize(fixture)).rejects.toThrow(/invalid path '\.GIT'/);
  });

  it("leaves the real .git directory intact after the refusal", async () => {
    const fixture = await buildHostileFixture({ caseId: "dot-git-variant" });
    await expect(materialize(fixture)).rejects.toThrow();

    // The clone that precedes the checkout created the real `.git`; the
    // refused checkout left it as git wrote it, not as the blob would have.
    const dotGit = join(fixture.worktree, ".git");
    expect(lstatSync(dotGit).isDirectory()).toBe(true);
    expect(readFileSync(join(dotGit, "HEAD"), "utf8")).not.toContain(
      "hostile-config",
    );
  });

  it("writes no .GIT-named entry into the working tree", async () => {
    const fixture = await buildHostileFixture({ caseId: "dot-git-variant" });
    await expect(materialize(fixture)).rejects.toThrow();

    const variants = walk(fixture.worktree).filter(
      (relativePath) =>
        relativePath.toLowerCase() === ".git" && relativePath !== ".git",
    );
    expect(variants).toEqual([]);
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("dot-git-variant")).resolves.toBe(true);
  });
});

describe("AC-0137 a .gitattributes filter declaration triggers no filter", () => {
  it("records no filter command in the process tree", async () => {
    const markers = await markersDuringMaterialization("attribute-filter");

    expect(markers).not.toContain(PROBE_LOG_MARKER["attribute-filter"]);
    expect(markers).toEqual([]);
  });

  it("leaves the declared file at its committed bytes", async () => {
    const fixture = await buildHostileFixture({ caseId: "attribute-filter" });
    await materialize(fixture);

    // The declaration is present and the content is untransformed, so the
    // filter was declared and still did not run.
    expect(
      readFileSync(join(fixture.worktree, ".gitattributes"), "utf8"),
    ).toContain("filter=probe");
    expect(readFileSync(join(fixture.worktree, "filtered.txt"), "utf8")).toBe(
      "filter-me\n",
    );
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("attribute-filter")).resolves.toBe(true);
  });
});

describe("AC-0139 an escaping symlink materializes as a regular file", () => {
  it("holds the target string as content rather than traversing it", async () => {
    const fixture = await buildHostileFixture({ caseId: "escaping-symlink" });
    await materialize(fixture);

    const escapePath = join(fixture.worktree, "escape");
    const status = lstatSync(escapePath);
    expect(status.isSymbolicLink()).toBe(false);
    expect(status.isFile()).toBe(true);
    expect(readFileSync(escapePath, "utf8")).toBe("../../outside");
  });

  it("leaves no symbolic link anywhere under the root", async () => {
    const fixture = await buildHostileFixture({ caseId: "escaping-symlink" });
    await materialize(fixture);

    const links = walk(fixture.worktree).filter((relativePath) =>
      lstatSync(join(fixture.worktree, relativePath)).isSymbolicLink(),
    );
    expect(links).toEqual([]);
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("escaping-symlink")).resolves.toBe(true);
  });
});

describe("AC-0140 the reader refuses an escaping path presented directly", () => {
  it("refuses a sibling whose name merely extends the root", async () => {
    const fixture = await buildHostileFixture({
      caseId: "escaping-reader-path",
    });
    await materialize(fixture);
    // The control proves this sibling is readable and that its path passes a
    // naive prefix test. The reader refuses it anyway, on a segment boundary.
    const sibling = `${fixture.worktree}-extended`;
    spawnSync("/bin/mkdir", ["-p", sibling]);
    spawnSync("/bin/cp", [
      join(fixture.worktree, "inside.txt"),
      join(sibling, "secret"),
    ]);

    expect(() =>
      readContainedFile(fixture.worktree, join(sibling, "secret")),
    ).toThrow(ConfinementError);
    expect(join(sibling, "secret").startsWith(fixture.worktree)).toBe(true);
  });

  it("refuses a parent-traversing path independently of materialization", async () => {
    const fixture = await buildHostileFixture({
      caseId: "escaping-reader-path",
    });
    await materialize(fixture);

    expect(() =>
      readContainedFile(
        fixture.worktree,
        join(fixture.worktree, "..", "source", "inside.txt"),
      ),
    ).toThrow(ConfinementError);
  });

  it("admits an ordinary contained file, so the refusal is not blanket", async () => {
    const fixture = await buildHostileFixture({
      caseId: "escaping-reader-path",
    });
    await materialize(fixture);

    expect(
      readContainedFile(fixture.worktree, join(fixture.worktree, "inside.txt")),
    ).toBe("inside\n");
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("escaping-reader-path")).resolves.toBe(
      true,
    );
  });
});

describe("AC-0141 a .gitmodules entry causes no submodule fetch or traversal", () => {
  it("fetches nothing for the declared submodule", async () => {
    const fixture = await buildHostileFixture({ caseId: "submodule" });
    await materialize(fixture);

    // The declaration is materialized as data; nothing acted on it.
    expect(
      readFileSync(join(fixture.worktree, ".gitmodules"), "utf8"),
    ).toContain("https://example.invalid/outside.git");
    expect(existsSync(join(fixture.worktree, "outside"))).toBe(false);
    expect(existsSync(join(fixture.worktree, ".git", "modules"))).toBe(false);
  });

  it("carries the recursion refusal on every git argument vector", () => {
    // AC-0049's mechanism, asserted where the vector is built rather than only
    // where one checkout happened not to recurse.
    expect(PINNED_GIT_CONFIGURATION).toContain("submodule.recurse=false");
    expect(pinnedGitConfigurationArgs()).toContain("submodule.recurse=false");
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("submodule")).resolves.toBe(true);
  });
});

describe("AC-0142 an option-shaped remote ref is refused before any vector", () => {
  it("refuses a reported default branch shaped like a git option", async () => {
    const fixture = await buildHostileFixture({ caseId: "option-shaped-ref" });
    await materialize(fixture);
    const reported = readFileSync(
      join(fixture.worktree, ".probe/ref"),
      "utf8",
    ).trim();

    const canonical = canonicalizeSource(
      "https://github.com/owner/repository",
      reported,
    );

    expect(canonical.ok).toBe(false);
    expect(reported).toBe("--upload-pack=/bin/sh");
  });

  it("refuses it before it can reach an argument vector", async () => {
    const fixture = await buildHostileFixture({ caseId: "option-shaped-ref" });
    await materialize(fixture);
    const reported = readFileSync(
      join(fixture.worktree, ".probe/ref"),
      "utf8",
    ).trim();

    // The refusal is what keeps the value out of a vector: there is no vector
    // to inspect because none is built. Asserting the canonical identity is
    // absent is the observation at the level the refusal happens.
    const canonical = canonicalizeSource(
      "https://github.com/owner/repository",
      reported,
    );
    expect(canonical).not.toHaveProperty("identity");
  });

  it("admits an ordinary ref, so the refusal is not blanket", () => {
    expect(
      canonicalizeSource("https://github.com/owner/repository", "main").ok,
    ).toBe(true);
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("option-shaped-ref")).resolves.toBe(true);
  });
});

describe("AC-0143 a prototype-mutating key yields no value under that key", () => {
  it("refuses the key in TOML", async () => {
    const fixture = await buildHostileFixture({ caseId: "prototype-key" });
    await materialize(fixture);
    const text = readFileSync(join(fixture.worktree, "workspace.toml"), "utf8");

    expect(() => parseGuardedToml(text)).toThrow(InadmissibleKeyError);
  });

  it("refuses the key in JSON", async () => {
    const fixture = await buildHostileFixture({ caseId: "prototype-key" });
    await materialize(fixture);
    const text = readFileSync(
      join(fixture.worktree, "projection.json"),
      "utf8",
    );

    expect(() => parseGuardedJson(text)).toThrow(InadmissibleKeyError);
  });

  it("refuses the key at depth, not only at the root", () => {
    expect(() => parseGuardedToml("[a.b.__proto__]\nx = 1\n")).toThrow(
      InadmissibleKeyError,
    );
    expect(() => parseGuardedJson('{"a":{"b":{"constructor":1}}}')).toThrow(
      InadmissibleKeyError,
    );
    expect(() => parseGuardedJson('{"a":[{"prototype":1}]}')).toThrow(
      InadmissibleKeyError,
    );
  });

  it("leaves Object.prototype unmutated either way", async () => {
    const fixture = await buildHostileFixture({ caseId: "prototype-key" });
    await materialize(fixture);

    for (const [file, parse] of [
      ["workspace.toml", parseGuardedToml],
      ["projection.json", parseGuardedJson],
    ] as const) {
      expect(() =>
        parse(readFileSync(join(fixture.worktree, file), "utf8")),
      ).toThrow();
    }
    expect((Object.prototype as { ready?: unknown }).ready).toBeUndefined();
  });

  it("admits an ordinary document, so the refusal is not blanket", () => {
    expect(parseGuardedToml("ready = true\n")).toEqual({ ready: true });
    expect(parseGuardedJson('{"ready":true}')).toEqual({ ready: true });
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("prototype-key")).resolves.toBe(true);
  });
});

describe("AC-0144 no module is imported from under the materialization root", () => {
  it("resolves no specifier under the root while the tree is read", async () => {
    const fixture = await buildHostileFixture({
      caseId: "materialized-module",
    });
    await materialize(fixture);

    const resolved: string[] = [];
    const hooks = module.registerHooks({
      resolve(specifier, context, nextResolve) {
        resolved.push(specifier);
        return nextResolve(specifier, context);
      },
    });
    try {
      // The reader is the only thing Studio points at materialized content.
      // Reading the module's bytes must not resolve them as a module.
      expect(
        readContainedFile(
          fixture.worktree,
          join(fixture.worktree, "hostile.mjs"),
        ),
      ).toContain("__hostileImported");
    } finally {
      hooks.deregister();
    }

    const worktreeUrl = pathToFileURL(fixture.worktree).href;
    expect(
      resolved.filter(
        (specifier) =>
          specifier.startsWith(worktreeUrl) ||
          specifier.startsWith(fixture.worktree),
      ),
    ).toEqual([]);
    expect(
      (globalThis as { __hostileImported?: boolean }).__hostileImported,
    ).toBeUndefined();
  });

  it("imports nothing but node builtins in the Runtime child", () => {
    // The child is the one Studio process whose working directory is the state
    // root, so its import graph is the one that could reach materialized
    // content. It is dependency-free by construction; this is that audit.
    const child = readFileSync(
      new URL("./runtime-child.ts", import.meta.url),
      "utf8",
    );
    // Anchored to a whole import statement. A bare `from "…"` also occurs
    // inside this module's prose, and matching that would audit a comment.
    const specifiers = [
      ...child.matchAll(/^\s*(?:import|\})[^"]*from "([^"]+)";$/gm),
    ].map((match) => match[1]);
    expect(specifiers.length).toBeGreaterThan(0);
    for (const specifier of specifiers) {
      expect(specifier).toMatch(/^node:/);
    }
    expect(child).not.toMatch(/\bimport\s*\(/);
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("materialized-module")).resolves.toBe(true);
    // The control imports the module, which sets the marker. Clear it so a
    // later run of the proof above observes an absence rather than this.
    delete (globalThis as { __hostileImported?: boolean }).__hostileImported;
  });
});

describe("AC-0145 no authorization header is sent on any request", () => {
  it("makes no HTTP request from Studio's own process at all", async () => {
    const fixture = await buildHostileFixture({
      caseId: "authorization-header",
    });
    const requested: string[] = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = ((input: unknown) => {
      requested.push(String(input));
      throw new Error("no request may be made");
    }) as typeof globalThis.fetch;
    try {
      await materialize(fixture);
    } finally {
      globalThis.fetch = realFetch;
    }

    expect(requested).toEqual([]);
    // The header the repository asked for is materialized as inert data.
    expect(
      readFileSync(join(fixture.worktree, ".probe/request.json"), "utf8"),
    ).toContain("Bearer repository-token");
  });

  it("carries no credential-bearing name in the pinned environment", () => {
    const environment = buildPinnedEnvironment({
      home: "/tmp/home",
      temporaryDirectory: "/tmp/tmp",
    });

    for (const name of Object.keys(environment)) {
      expect(name.toLowerCase()).not.toContain("auth");
      expect(name.toLowerCase()).not.toContain("token");
      expect(name.toLowerCase()).not.toContain("credential");
    }
    // The two ask-pass names are present and empty, which is what keeps git
    // from prompting rather than a credential Studio supplies.
    expect(environment.GIT_ASKPASS).toBe("");
    expect(environment.SSH_ASKPASS).toBe("");
    expect(ENVIRONMENT_ALLOWLIST_NAMES).not.toContain("GIT_TOKEN");
  });

  it("disables the credential helper on every git argument vector", () => {
    expect(PINNED_GIT_CONFIGURATION).toContain("credential.helper=");
    expect(pinnedGitConfigurationArgs()).toContain("credential.helper=");
  });

  it("fires the same probe when the guard is removed", async () => {
    await expect(runPositiveControl("authorization-header")).resolves.toBe(
      true,
    );
  });
});
