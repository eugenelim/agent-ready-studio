import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DOT_GIT_UNICODE_ENTRY } from "./hostile-fixture.js";

function runHdiutil(args: readonly string[]): void {
  const result = spawnSync("/usr/bin/hdiutil", [...args], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`hdiutil ${String(args[0])} failed: ${result.stderr}`);
  }
}

export function mountHfsVolume(): {
  root: string;
  mountPoint: string;
  dispose(): void;
} {
  const root = mkdtempSync(join(tmpdir(), "connect-orient-hfs-"));
  const image = join(root, "volume.dmg");
  const mountPoint = join(root, "mnt");
  mkdirSync(mountPoint);

  let attached = false;

  function dispose(): void {
    if (attached) {
      const result = spawnSync(
        "/usr/bin/hdiutil",
        ["detach", "-quiet", mountPoint],
        { encoding: "utf8" },
      );
      if (result.status !== 0) {
        // A busy volume refuses a plain detach; -force is the recovery path.
        spawnSync(
          "/usr/bin/hdiutil",
          ["detach", "-quiet", "-force", mountPoint],
          { encoding: "utf8" },
        );
      }
    }
    attached = false;
    rmSync(root, { recursive: true, force: true });
  }

  try {
    // HFS+ is required: it ignores U+200C, so .gi<U+200C>t folds to .git on
    // this filesystem. APFS keeps the code point and the names stay distinct.
    runHdiutil([
      "create",
      "-quiet",
      "-size",
      "16m",
      "-fs",
      "HFS+",
      "-volname",
      "connect-orient-hfs",
      image,
    ]);
    runHdiutil([
      "attach",
      "-quiet",
      "-nobrowse",
      "-noautoopen",
      "-mountpoint",
      mountPoint,
      image,
    ]);
    attached = true;
  } catch (error) {
    dispose();
    throw error;
  }

  return { root, mountPoint, dispose };
}

/**
 * Returns true when a file written as DOT_GIT_UNICODE_ENTRY (.gi<U+200C>t) is
 * reachable as .git under the given directory. HFS+ ignores U+200C so the
 * variant *is* .git there; APFS keeps it as a distinct name.
 */
export function foldsToDotGit(directory: string): boolean {
  const probe = mkdtempSync(join(directory, "probe-"));
  try {
    writeFileSync(join(probe, DOT_GIT_UNICODE_ENTRY), "");
    return existsSync(join(probe, ".git"));
  } finally {
    rmSync(probe, { recursive: true, force: true });
  }
}
