/**
 * The trusted-inspector locator.
 *
 * *Canonical values* pins the trusted inspector to AgentBundle pack `core` at
 * the version recorded here, with the SHA-256 of `workspace_status.py` and
 * `workspace_status_engine.py`. Every A3-derived property in the brief is a
 * property of one pack version, so the pin is the evidence's scope and a pack
 * that has moved is refused rather than used.
 *
 * The locator never searches the inspected repository. AC-0047 requires that no
 * repository-projected skill is used as a fallback, and the strongest form of
 * that is a locator with no fallback at all: it looks in exactly one place,
 * under a search root the caller supplies, and refuses when nothing is there.
 * AC-0045 then re-proves the same boundary from the other side, refusing an
 * inspector whose resolved real path lies inside the materialization root even
 * if some future caller were to point the search root at one.
 *
 * Reading the inspector's own files touches nothing in the inspected
 * repository: they live under this repository's `.claude/` skills directory,
 * which is Studio's own installed state rather than repository content.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";

import { parseGuardedToml } from "./inadmissible-keys.js";
import { containsOnSegmentBoundary } from "./materialization-confinement.js";

/** The two inspector files the pin covers, in the order it names them. */
export const INSPECTOR_FILE_NAMES = [
  "workspace_status.py",
  "workspace_status_engine.py",
] as const;

export type InspectorFileName = (typeof INSPECTOR_FILE_NAMES)[number];

/** Where a repo-scoped install places the inspector, relative to the root. */
export const INSPECTOR_SCRIPTS_RELATIVE_PATH = join(
  ".claude",
  "skills",
  "workspace-status",
  "scripts",
);

/** Where the installed pack records its own name, version and scope. */
export const PACK_STATE_RELATIVE_PATH = ".agentbundle-state.toml";

export interface InspectorPin {
  readonly packName: string;
  readonly packVersion: string;
  readonly fileDigests: Readonly<Record<InspectorFileName, string>>;
}

/**
 * The pin recorded at T6, confirmed against this worktree. The catalogue offers
 * a later version; staying here is deliberate, because moving the pin would
 * move the scope of the evidence the brief's A3 properties rest on.
 */
export const PINNED_INSPECTOR: InspectorPin = {
  packName: "core",
  packVersion: "2.26.0",
  fileDigests: {
    "workspace_status.py":
      "dec939e052750af346325c9895c75bfa38bcc2795111afcb6e001e817706f1db",
    "workspace_status_engine.py":
      "2e6b6037ea5f02fd477cd37105a9e58efef6c27681e245e7abdc6b8e9d89899b",
  },
};

/**
 * AC-0043's record: what Studio writes down about the inspector it used, with
 * every inspection. Each field is read from the inspector actually resolved,
 * never copied from the pin, so a record can disagree with the pin and a reader
 * can see that it does.
 */
export interface InspectorProvenance {
  readonly resolvedPath: string;
  readonly packName: string;
  readonly packVersion: string;
  readonly fileDigests: Readonly<Record<InspectorFileName, string>>;
}

export type InspectorRefusalCode =
  /** AC-0047: nothing to use, and nothing is substituted for it. */
  | "inspector-absent"
  /** AC-0045: the resolved real path lies inside the materialization root. */
  | "inspector-inside-materialization-root"
  /** AC-0044, one code per field the pin covers. */
  | "pack-name-mismatch"
  | "pack-version-mismatch"
  | "file-digest-mismatch"
  /** AC-0048: no interpreter on the search list conforms. */
  | "interpreter-nonconforming";

export interface InspectorUnavailable {
  readonly ok: false;
  /** The trial result this refusal composes into, named at the source. */
  readonly result: "inspector-unavailable";
  readonly code: InspectorRefusalCode;
  /**
   * Names the mismatch, which is what AC-0044 and AC-0048 require beyond the
   * code: which field disagreed, and what it disagreed with.
   */
  readonly mismatch: string;
}

export type InspectorLocation =
  | ({ readonly ok: true } & InspectorProvenance)
  | InspectorUnavailable;

function unavailable(
  code: InspectorRefusalCode,
  mismatch: string,
): InspectorUnavailable {
  return { ok: false, result: "inspector-unavailable", code, mismatch };
}

export function sha256OfFile(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

/**
 * Reads the installed pack's own recorded version. Every adapter of a pack
 * records the version it was installed from, and they are required to agree:
 * a pack whose adapters disagree is not one version, so it cannot match a pin
 * that names one.
 */
function readPackVersion(
  packStatePath: string,
  packName: string,
): { ok: true; version: string } | { ok: false; detail: string } {
  let state: unknown;
  try {
    state = parseGuardedToml(readFileSync(packStatePath, "utf8"));
  } catch (cause) {
    return {
      ok: false,
      detail: `${packStatePath} could not be read: ${cause}`,
    };
  }
  const packs = (state as { pack?: Record<string, unknown> } | null)?.pack;
  const pack = packs?.[packName] as
    | { adapters?: Record<string, { "installed-version"?: unknown }> }
    | undefined;
  if (pack === undefined) {
    return {
      ok: false,
      detail: `${packStatePath} records no pack ${packName}`,
    };
  }
  const versions = new Set<string>();
  for (const adapter of Object.values(pack.adapters ?? {})) {
    const version = adapter["installed-version"];
    if (typeof version === "string" && version !== "") {
      versions.add(version);
    }
  }
  if (versions.size !== 1) {
    return {
      ok: false,
      detail:
        versions.size === 0
          ? `pack ${packName} records no installed version`
          : `pack ${packName} adapters disagree: ${[...versions].sort().join(", ")}`,
    };
  }
  return { ok: true, version: [...versions][0] as string };
}

export interface LocateInspectorOptions {
  /** The root the inspector is looked for under. There is no second place. */
  readonly searchRoot: string;
  /**
   * When supplied, an inspector resolving inside this root is refused. Supplied
   * on every real inspection; optional only so the pin can be checked without a
   * materialization root in existence.
   */
  readonly materializationRoot?: string;
  readonly pin?: InspectorPin;
}

/**
 * Locates the trusted inspector and proves it is the pinned one.
 *
 * The order of the checks is load-bearing. Containment is decided before the
 * digests, because reading a file to hash it is already a use of it, and
 * AC-0045 refuses an inspector inside the materialization root rather than
 * reading one. Pack identity is decided before the digests too, so a pack that
 * has moved is named as a version mismatch rather than as an opaque digest
 * mismatch that a reader would have to diff two files to understand.
 */
export function locateTrustedInspector(
  options: LocateInspectorOptions,
): InspectorLocation {
  const pin = options.pin ?? PINNED_INSPECTOR;
  const scriptsPath = join(options.searchRoot, INSPECTOR_SCRIPTS_RELATIVE_PATH);

  if (!existsSync(scriptsPath)) {
    return unavailable(
      "inspector-absent",
      `no trusted inspector at ${scriptsPath}, and no fallback is used`,
    );
  }

  let resolvedPath: string;
  try {
    resolvedPath = realpathSync(scriptsPath);
  } catch (cause) {
    return unavailable(
      "inspector-absent",
      `${scriptsPath} could not be resolved: ${cause}`,
    );
  }

  if (options.materializationRoot !== undefined) {
    let rootRealPath: string | undefined;
    try {
      rootRealPath = realpathSync(options.materializationRoot);
    } catch {
      // A materialization root that does not exist yet cannot contain
      // anything, so there is nothing to refuse and the check is skipped.
      rootRealPath = undefined;
    }
    if (
      rootRealPath !== undefined &&
      containsOnSegmentBoundary(rootRealPath, resolvedPath)
    ) {
      return unavailable(
        "inspector-inside-materialization-root",
        `${resolvedPath} is inside the materialization root ${rootRealPath}`,
      );
    }
  }

  for (const name of INSPECTOR_FILE_NAMES) {
    if (!existsSync(join(resolvedPath, name))) {
      return unavailable(
        "inspector-absent",
        `${name} is missing from ${resolvedPath}`,
      );
    }
  }

  const packStatePath = join(options.searchRoot, PACK_STATE_RELATIVE_PATH);
  if (!existsSync(packStatePath)) {
    return unavailable(
      "pack-name-mismatch",
      `no pack state at ${packStatePath}, so pack ${pin.packName} cannot be confirmed`,
    );
  }
  const version = readPackVersion(packStatePath, pin.packName);
  if (!version.ok) {
    return unavailable("pack-name-mismatch", version.detail);
  }
  if (version.version !== pin.packVersion) {
    return unavailable(
      "pack-version-mismatch",
      `pack ${pin.packName} is ${version.version}, pin is ${pin.packVersion}`,
    );
  }

  const fileDigests: Record<string, string> = {};
  for (const name of INSPECTOR_FILE_NAMES) {
    const digest = sha256OfFile(join(resolvedPath, name));
    fileDigests[name] = digest;
    if (digest !== pin.fileDigests[name]) {
      return unavailable(
        "file-digest-mismatch",
        `${name} is ${digest}, pin is ${pin.fileDigests[name]}`,
      );
    }
  }

  return {
    ok: true,
    resolvedPath,
    packName: pin.packName,
    packVersion: version.version,
    fileDigests: fileDigests as Record<InspectorFileName, string>,
  };
}

export interface InterpreterProbe {
  readonly path: string;
  readonly version?: string;
  readonly conforming: boolean;
}

/**
 * AC-0046 and AC-0048, as one decision over the probes the Runtime already
 * performed. The Runtime walks the search list and reports what each
 * interpreter said; this turns that report into either the interpreter Studio
 * may inspect with, or the refusal that names the requirement it failed.
 *
 * The requirement is named in the refusal rather than left to a reader to infer
 * from the probe list, because AC-0048 asks for the requirement and a list of
 * versions is not one.
 */
export function selectConformingInterpreter(
  probes: readonly InterpreterProbe[],
  minimumVersion: readonly [number, number],
): { readonly ok: true; readonly executable: string } | InspectorUnavailable {
  const conforming = probes.find((probe) => probe.conforming);
  if (conforming !== undefined) {
    return { ok: true, executable: conforming.path };
  }
  const required = `${minimumVersion[0]}.${minimumVersion[1]}`;
  const seen =
    probes.length === 0
      ? "no interpreter was found on the search list"
      : probes
          .map((probe) => `${probe.path} ${probe.version ?? "absent"}`)
          .join("; ");
  return unavailable(
    "interpreter-nonconforming",
    `Python ${required} or later is required; ${seen}`,
  );
}
