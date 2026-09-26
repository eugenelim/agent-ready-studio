import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import {
  INSPECTOR_FILE_NAMES,
  INSPECTOR_SCRIPTS_RELATIVE_PATH,
  locateTrustedInspector,
  PACK_STATE_RELATIVE_PATH,
  PINNED_INSPECTOR,
  selectConformingInterpreter,
  sha256OfFile,
} from "./inspector-locator.js";

/** This repository's root, which is the search root a real inspection uses. */
const REPOSITORY_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "..",
  "..",
);

const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * A search root holding a real copy of the pinned inspector and a pack state
 * naming the pinned version, so a test can perturb exactly one field and leave
 * everything else genuinely matching.
 */
function buildSearchRoot(
  options: {
    packVersion?: string;
    packName?: string;
    /** Extra adapter entries, so a pack can disagree with itself. */
    extraAdapters?: readonly { name: string; version?: string }[];
  } = {},
): string {
  const root = mkdtempSync(join(tmpdir(), "connect-orient-inspector-"));
  temporaryRoots.push(root);
  const scripts = join(root, INSPECTOR_SCRIPTS_RELATIVE_PATH);
  mkdirSync(scripts, { recursive: true });
  for (const name of INSPECTOR_FILE_NAMES) {
    cpSync(
      join(REPOSITORY_ROOT, INSPECTOR_SCRIPTS_RELATIVE_PATH, name),
      join(scripts, name),
    );
  }
  const packName = options.packName ?? PINNED_INSPECTOR.packName;
  const packVersion = options.packVersion ?? PINNED_INSPECTOR.packVersion;
  const extra = (options.extraAdapters ?? [])
    .map(
      (adapter) =>
        `\n[pack.${packName}.adapters.${adapter.name}]\n${
          adapter.version === undefined
            ? ""
            : `installed-version = "${adapter.version}"\n`
        }scope = "repo"\n`,
    )
    .join("");
  writeFileSync(
    join(root, PACK_STATE_RELATIVE_PATH),
    `schema-version = "0.4"\n\n[pack.${packName}.adapters.claude-code]\ninstalled-version = "${packVersion}"\nscope = "repo"\n${extra}`,
    "utf8",
  );
  return root;
}

describe("AC-0043 the inspector's identity is recorded with each inspection", () => {
  it("records the resolved path, pack name, pack version and both digests", () => {
    const located = locateTrustedInspector({ searchRoot: REPOSITORY_ROOT });

    expect(located.ok).toBe(true);
    if (!located.ok) {
      return;
    }
    expect(located.resolvedPath).toContain(INSPECTOR_SCRIPTS_RELATIVE_PATH);
    expect(located.packName).toBe("core");
    // Read from the pin rather than restated: the pin is the evidence's scope,
    // and a literal here would drift from it silently the next time the pack
    // moves -- which is exactly what happened when core went 2.26.0 to 2.26.14.
    expect(located.packVersion).toBe(PINNED_INSPECTOR.packVersion);
    expect(located.fileDigests).toEqual(PINNED_INSPECTOR.fileDigests);
  });

  it("records digests read from the resolved files rather than copied from the pin", () => {
    const located = locateTrustedInspector({ searchRoot: REPOSITORY_ROOT });

    expect(located.ok).toBe(true);
    if (!located.ok) {
      return;
    }
    for (const name of INSPECTOR_FILE_NAMES) {
      expect(located.fileDigests[name]).toBe(
        sha256OfFile(join(located.resolvedPath, name)),
      );
    }
  });
});

describe("AC-0044 an inspector that does not match the pin is not used", () => {
  it("names a pack-version mismatch rather than using the inspector", () => {
    const searchRoot = buildSearchRoot({ packVersion: "2.26.10" });

    const located = locateTrustedInspector({ searchRoot });

    expect(located).toMatchObject({
      ok: false,
      result: "inspector-unavailable",
      code: "pack-version-mismatch",
    });
    expect(located.ok).toBe(false);
    if (located.ok) {
      return;
    }
    expect(located.mismatch).toContain("2.26.10");
    expect(located.mismatch).toContain(PINNED_INSPECTOR.packVersion);
  });

  it("names a pack-name mismatch when the pinned pack is not installed", () => {
    const searchRoot = buildSearchRoot({ packName: "not-core" });

    const located = locateTrustedInspector({ searchRoot });

    expect(located).toMatchObject({
      ok: false,
      result: "inspector-unavailable",
      code: "pack-name-mismatch",
    });
  });

  it("reports an unreadable inspector file as unavailable rather than throwing", () => {
    // The locator now runs on stopped and cancelled inspections too, so a
    // throw out of the digest read no longer just fails a lookup: it is
    // caught by the pipeline and replaces the inspection's own cause of
    // death with "the inspection stopped: EISDIR". The read is guarded like
    // the realpath and pack-state reads beside it; removing that guard makes
    // this case throw instead of returning.
    const searchRoot = buildSearchRoot();
    const file = join(
      searchRoot,
      INSPECTOR_SCRIPTS_RELATIVE_PATH,
      "workspace_status.py",
    );
    rmSync(file);
    mkdirSync(file);

    const located = locateTrustedInspector({ searchRoot });

    expect(located).toMatchObject({
      ok: false,
      result: "inspector-unavailable",
      code: "inspector-absent",
    });
    expect(located.ok === false && located.mismatch).toContain(
      "workspace_status.py",
    );
  });

  it("names a file-digest mismatch when an inspector file has changed", () => {
    const searchRoot = buildSearchRoot();
    const changed = join(
      searchRoot,
      INSPECTOR_SCRIPTS_RELATIVE_PATH,
      "workspace_status.py",
    );
    writeFileSync(changed, "# tampered\n", { flag: "a" });

    const located = locateTrustedInspector({ searchRoot });

    expect(located).toMatchObject({
      ok: false,
      result: "inspector-unavailable",
      code: "file-digest-mismatch",
    });
    expect(located.ok).toBe(false);
    if (located.ok) {
      return;
    }
    expect(located.mismatch).toContain("workspace_status.py");
    expect(located.mismatch).toContain(
      PINNED_INSPECTOR.fileDigests["workspace_status.py"],
    );
  });

  it("admits the inspector when every pinned field matches", () => {
    const searchRoot = buildSearchRoot();

    expect(locateTrustedInspector({ searchRoot }).ok).toBe(true);
  });
  it("refuses a pack whose adapters disagree about their version", () => {
    // The rule is stated as an invariant — a pack whose adapters disagree is
    // not one version, so it cannot match a pin that names one — and every
    // fixture wrote a single adapter, so relaxing the check to `< 1` left the
    // whole suite green and a disagreeing pack matching the pin.
    const located = locateTrustedInspector({
      searchRoot: buildSearchRoot({
        extraAdapters: [{ name: "codex", version: "9.9.9" }],
      }),
    });

    expect(located.ok).toBe(false);
    expect(located.ok === false && located.mismatch).toContain("disagree");
  });

  it("refuses a pinned pack whose adapters record no version at all", () => {
    // Keeping the **pinned** pack name matters: naming a different pack sends
    // this down the pack-absent branch the case above already covers, and the
    // only assertion — `ok === false` — cannot tell the two apart. The
    // message is what distinguishes them, as the disagree case shows.
    const root = buildSearchRoot();
    writeFileSync(
      join(root, PACK_STATE_RELATIVE_PATH),
      `schema-version = "0.4"\n\n[pack.${PINNED_INSPECTOR.packName}.adapters.claude-code]\nscope = "repo"\n`,
      "utf8",
    );
    const located = locateTrustedInspector({ searchRoot: root });

    expect(located.ok).toBe(false);
    expect(located.ok === false && located.mismatch).toContain(
      "records no installed version",
    );
  });
});

describe("AC-0045 an inspector inside the materialization root is refused", () => {
  it("refuses it rather than reading or using it", () => {
    const searchRoot = buildSearchRoot();

    const located = locateTrustedInspector({
      searchRoot,
      materializationRoot: searchRoot,
    });

    expect(located).toMatchObject({
      ok: false,
      result: "inspector-unavailable",
      code: "inspector-inside-materialization-root",
    });
  });

  it("admits an inspector whose path merely extends the root's name", () => {
    // The sibling `…-extended` shares a prefix with the root but is not inside
    // it on a segment boundary, which is the distinction AC-0073 states and
    // this refusal reuses. A prefix comparison would refuse it wrongly.
    const searchRoot = buildSearchRoot();

    const located = locateTrustedInspector({
      searchRoot,
      materializationRoot: `${searchRoot}-extended`,
    });

    expect(located.ok).toBe(true);
  });
  it("compares the major version, not only the minor", () => {
    // Every probe fixture reported major 3, so deleting the major branch and
    // keeping `minor >= minimum[1]` left the suite green — after which
    // `Python 1.99` conforms.
    expect(
      selectConformingInterpreter(
        [{ path: "/usr/bin/python", version: "Python 1.99", conforming: true }],
        [3, 11],
      ).ok,
    ).toBe(false);
    expect(
      selectConformingInterpreter(
        [
          {
            path: "/usr/bin/python4",
            version: "Python 4.0",
            conforming: false,
          },
        ],
        [3, 11],
      ).ok,
    ).toBe(true);
  });
});

describe("AC-0047 an absent inspector yields inspector-unavailable", () => {
  it("refuses with no inspector present", () => {
    const root = mkdtempSync(join(tmpdir(), "connect-orient-no-inspector-"));
    temporaryRoots.push(root);

    const located = locateTrustedInspector({ searchRoot: root });

    expect(located).toMatchObject({
      ok: false,
      result: "inspector-unavailable",
      code: "inspector-absent",
    });
  });

  it("does not fall back to a repository-projected skill executable", () => {
    // The projected-skill shape is T1's `projected-skill-executable` case: an
    // executable a repository can place where a skill would live. Studio has
    // exactly one place it looks, so the presence of this one changes nothing.
    const root = mkdtempSync(join(tmpdir(), "connect-orient-projected-"));
    temporaryRoots.push(root);
    const projected = join(root, ".agents", "skills", "workspace-status");
    mkdirSync(projected, { recursive: true });
    writeFileSync(join(projected, "run"), "#!/bin/sh\nexit 0\n", {
      mode: 0o755,
    });

    const located = locateTrustedInspector({ searchRoot: root });

    expect(located).toMatchObject({
      ok: false,
      result: "inspector-unavailable",
      code: "inspector-absent",
    });
    expect(located.ok).toBe(false);
    if (located.ok) {
      return;
    }
    expect(located.mismatch).not.toContain(".agents");
  });
});

describe("AC-0046 and AC-0048 the interpreter is verified before it is used", () => {
  it("selects the first conforming interpreter on the search list", () => {
    const selected = selectConformingInterpreter(
      [
        {
          path: "/opt/homebrew/bin/python3",
          version: "Python 3.14.7",
          conforming: true,
        },
        {
          path: "/usr/bin/python3",
          version: "Python 3.9.6",
          conforming: false,
        },
      ],
      [3, 11],
    );

    expect(selected).toEqual({
      ok: true,
      executable: "/opt/homebrew/bin/python3",
    });
  });

  it("skips a non-conforming interpreter that precedes a conforming one", () => {
    const selected = selectConformingInterpreter(
      [
        {
          path: "/usr/bin/python3",
          version: "Python 3.9.6",
          conforming: false,
        },
        {
          path: "/usr/local/bin/python3",
          version: "Python 3.11.0",
          conforming: true,
        },
      ],
      [3, 11],
    );

    expect(selected).toEqual({
      ok: true,
      executable: "/usr/local/bin/python3",
    });
  });

  it("names the interpreter requirement when none conforms", () => {
    const selected = selectConformingInterpreter(
      [
        {
          path: "/usr/bin/python3",
          version: "Python 3.9.6",
          conforming: false,
        },
      ],
      [3, 11],
    );

    expect(selected).toMatchObject({
      ok: false,
      result: "inspector-unavailable",
      code: "interpreter-nonconforming",
    });
    if (selected.ok) {
      return;
    }
    expect(selected.mismatch).toContain("3.11");
    expect(selected.mismatch).toContain("3.9.6");
  });

  it("names the requirement when the search list found nothing at all", () => {
    const selected = selectConformingInterpreter([], [3, 11]);

    expect(selected).toMatchObject({
      ok: false,
      code: "interpreter-nonconforming",
    });
    if (selected.ok) {
      return;
    }
    expect(selected.mismatch).toContain("3.11");
  });
});
