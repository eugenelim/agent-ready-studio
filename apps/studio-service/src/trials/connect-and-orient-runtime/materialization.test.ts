import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { readContainedFile } from "./materialization-confinement.js";
import {
  buildHostileFixture,
  disposeHostileFixtures,
  materialize,
} from "./test/hostile-fixture.js";

afterAll(() => {
  disposeHostileFixtures();
});

/** Every path under `root`, relative to it, without following a single link. */
function walk(root: string, prefix = ""): string[] {
  const found: string[] = [];
  for (const name of readdirSync(join(root, prefix))) {
    const relativePath = prefix === "" ? name : join(prefix, name);
    const status = lstatSync(join(root, relativePath));
    found.push(relativePath);
    if (status.isDirectory() && !status.isSymbolicLink()) {
      found.push(...walk(root, relativePath));
    }
  }
  return found;
}

describe("AC-0069 materialization neutralizes every symbolic link", () => {
  it("leaves no symbolic link anywhere under the materialization root", async () => {
    const fixture = await buildHostileFixture({ caseId: "escaping-symlink" });
    await materialize(fixture);

    const links = walk(fixture.worktree).filter((relativePath) =>
      lstatSync(join(fixture.worktree, relativePath)).isSymbolicLink(),
    );
    expect(links).toEqual([]);
  });

  it("turns an escaping link into a regular file holding its target string", async () => {
    const fixture = await buildHostileFixture({ caseId: "escaping-symlink" });
    await materialize(fixture);

    const escapePath = join(fixture.worktree, "escape");
    const status = lstatSync(escapePath);
    expect(status.isSymbolicLink()).toBe(false);
    expect(status.isFile()).toBe(true);
    // The target is preserved as *content*, which is what makes it inert: the
    // bytes `../../outside` are text, not a traversal the filesystem performs.
    expect(readFileSync(escapePath, "utf8")).toBe("../../outside");
  });

  it("reads that neutralized link as ordinary contained content", async () => {
    // The two controls compose: AC-0069 removes the link, so AC-0073's
    // containment check resolves the path to the file itself and admits it
    // rather than refusing an escape. A link here would have been refused.
    const fixture = await buildHostileFixture({ caseId: "escaping-symlink" });
    await materialize(fixture);

    expect(
      readContainedFile(fixture.worktree, join(fixture.worktree, "escape")),
    ).toBe("../../outside");
  });

  it("keeps every materialized path inside the root", async () => {
    const fixture = await buildHostileFixture({ caseId: "escaping-symlink" });
    await materialize(fixture);

    for (const relativePath of walk(fixture.worktree)) {
      expect(
        relative(fixture.worktree, join(fixture.worktree, relativePath)),
      ).not.toMatch(/^\.\./);
    }
  });
});
