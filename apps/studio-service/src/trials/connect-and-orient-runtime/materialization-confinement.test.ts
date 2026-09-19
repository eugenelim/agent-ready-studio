import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  ConfinementError,
  containsOnSegmentBoundary,
  readContainedFile,
  resolveContainedPath,
  SINGLE_FILE_BOUND_BYTES,
} from "./materialization-confinement.js";

const roots: string[] = [];

function scratch(): string {
  const root = mkdtempSync(join(tmpdir(), "connect-orient-confinement-"));
  roots.push(root);
  return root;
}

afterAll(() => {
  for (const root of roots) {
    rmSync(root, { recursive: true, force: true });
  }
});

function refusalOf(action: () => unknown): string {
  try {
    action();
  } catch (cause) {
    expect(cause).toBeInstanceOf(ConfinementError);
    return (cause as ConfinementError).refusal;
  }
  throw new Error("expected a refusal, but the call returned");
}

describe("AC-0073 containment on a path-segment boundary", () => {
  it("admits the root itself and a descendant", () => {
    expect(containsOnSegmentBoundary("/a/tree", "/a/tree")).toBe(true);
    expect(containsOnSegmentBoundary("/a/tree", "/a/tree/x/y")).toBe(true);
  });

  it("refuses a sibling whose name merely extends the root", () => {
    // The prefix test that AC-0073 exists to forbid: "/a/tree-evil" begins
    // with "/a/tree" but is not inside it.
    expect(containsOnSegmentBoundary("/a/tree", "/a/tree-evil")).toBe(false);
    expect(containsOnSegmentBoundary("/a/tree", "/a/treeevil/x")).toBe(false);
  });

  it("refuses a sibling directory on the real filesystem", () => {
    const base = scratch();
    const root = join(base, "tree");
    mkdirSync(root);
    const sibling = join(base, "tree-evil");
    mkdirSync(sibling);
    writeFileSync(join(sibling, "workspace.toml"), "x=1\n");
    expect(
      refusalOf(() =>
        resolveContainedPath(root, join(sibling, "workspace.toml")),
      ),
    ).toBe("outside-materialization-root");
  });

  it("refuses a link inside the root whose target escapes it", () => {
    const base = scratch();
    const root = join(base, "tree");
    mkdirSync(root);
    const outside = join(base, "outside.toml");
    writeFileSync(outside, "secret=1\n");
    // Containment is compared against the *resolved* real path, so a link
    // planted inside the root cannot reach outside it.
    symlinkSync(outside, join(root, "escape.toml"));
    expect(
      refusalOf(() => resolveContainedPath(root, join(root, "escape.toml"))),
    ).toBe("outside-materialization-root");
  });

  it("admits a link inside the root that resolves back inside it", () => {
    const base = scratch();
    const root = join(base, "tree");
    mkdirSync(root);
    writeFileSync(join(root, "real.toml"), "x=1\n");
    symlinkSync(join(root, "real.toml"), join(root, "alias.toml"));
    expect(readContainedFile(root, join(root, "alias.toml"))).toBe("x=1\n");
  });
});

describe("AC-0074 non-regular files are refused", () => {
  it("refuses a directory", () => {
    const root = scratch();
    mkdirSync(join(root, "sub"));
    expect(refusalOf(() => readContainedFile(root, join(root, "sub")))).toBe(
      "not-regular-file",
    );
  });

  it("refuses a FIFO", () => {
    const root = scratch();
    const fifo = join(root, "pipe");
    execFileSync("/usr/bin/mkfifo", [fifo]);
    expect(refusalOf(() => readContainedFile(root, fifo))).toBe(
      "not-regular-file",
    );
  });

  it("refuses a device file reached through a contained link", () => {
    const root = scratch();
    // /dev/null is a character device. Reaching it through a link inside the
    // root is refused for containment first, which is the stronger refusal.
    symlinkSync("/dev/null", join(root, "device"));
    expect(refusalOf(() => readContainedFile(root, join(root, "device")))).toBe(
      "outside-materialization-root",
    );
  });
});

describe("AC-0075 the single-file bound is checked before the read", () => {
  it("admits a file at the bound", () => {
    const root = scratch();
    const path = join(root, "at-bound");
    writeFileSync(path, "a".repeat(16));
    expect(readContainedFile(root, path, 16)).toHaveLength(16);
  });

  it("refuses a file one byte over the bound", () => {
    const root = scratch();
    const path = join(root, "over-bound");
    writeFileSync(path, "a".repeat(17));
    expect(refusalOf(() => readContainedFile(root, path, 16))).toBe(
      "exceeds-single-file-bound",
    );
  });

  it("carries the canonical 1 MiB bound by default", () => {
    expect(SINGLE_FILE_BOUND_BYTES).toBe(1024 * 1024);
  });
});
