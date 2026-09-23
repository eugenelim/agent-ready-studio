/**
 * The Runtime's declared-value reader.
 *
 * It reads the two files the *Permitted read surface* admits, each as data,
 * under the *Declared-value read* bound of two files at 1 MiB each, and parses
 * them under the *Inadmissible parse keys* and *Parse nesting depth* bounds.
 * Every refusal names itself, yields no extracted value, and carries the stop
 * reason and attribution the *Reasons for `inspection-stopped`* table assigns.
 *
 * What this module deliberately does **not** do is decide anything. It reports
 * what a repository declared; the verdict comes only from trusted inspector
 * output (AC-0062), and no field here carries a lifecycle meaning (AC-0060).
 */
import { basename } from "node:path";

import { parse as parseToml } from "smol-toml";

import {
  isInadmissibleKey,
  withoutInadmissibleKeys,
} from "./inadmissible-keys.js";
import {
  ConfinementError,
  readContainedFile,
  SINGLE_FILE_BOUND_BYTES,
} from "./materialization-confinement.js";

/**
 * *Canonical values*, *Permitted read surface*. `.agentbundle-state.toml` is
 * admitted because it is where a declared `schema-version` actually lives —
 * `workspace.toml` carries none, verified on this repository.
 */
export const PERMITTED_READ_SURFACE = [
  "workspace.toml",
  ".agentbundle-state.toml",
] as const;

export type PermittedReadName = (typeof PERMITTED_READ_SURFACE)[number];

/**
 * The workspace declaration, and the canonical statement of why it is named.
 *
 * **AC-0059's carve-out.** That criterion's repository-file branch covers only
 * a declaration file that is *not* the workspace declaration — in this slice,
 * `.agentbundle-state.toml`. A malformed `workspace.toml` is instead the
 * `malformed` condition, produced by the inspector's own `invalid_workspace`
 * finding, and the *Reasons for `inspection-stopped`* table carries no row for
 * any refusal on this file. So routing a refused `workspace.toml` to the
 * declaration-file row would stop an inspection under a reason the contract
 * says does not cover it.
 *
 * The carve-out is keyed on the **file**, not on the refusal class, because
 * that is how the spec states it. Every other site that depends on this rule
 * points here rather than restating it.
 */
export const WORKSPACE_DECLARATION_NAME = PERMITTED_READ_SURFACE[0];

/** *Resource bounds*, *Declared-value read*: 2 files, 1 MiB each. */
export const DECLARED_READ_FILE_BOUND = 2;
export const DECLARED_READ_BYTE_BOUND = SINGLE_FILE_BOUND_BYTES;

/** *Resource bounds*, *Parse nesting depth*. */
export const PARSE_NESTING_DEPTH_BOUND = 64;

/** The key a repository declares its workspace version marker under. */
export const DECLARED_VERSION_KEY = "schema-version";

/**
 * The closed set of refusals, as data. A consumer reading a refusal that
 * crossed a process boundary checks membership against this rather than
 * asserting the string into the union -- an unchecked assertion is what let
 * the child and the Service drift onto different vocabularies.
 */
export const DECLARED_READ_REFUSALS = [
  "outside-permitted-read-surface",
  "exceeds-file-count-bound",
  "exceeds-byte-bound",
  "exceeds-nesting-depth",
  "parse-failed",
  "unreadable",
] as const;

export type DeclaredReadRefusal = (typeof DECLARED_READ_REFUSALS)[number];

export type ParseAttribution = "repository" | "Studio" | "network";

export interface StopReason {
  readonly condition: "inspection-stopped";
  readonly reason: string;
  readonly attribution: ParseAttribution;
  readonly retryable: string;
}

/**
 * The three AC-0059 rows of the *Reasons for `inspection-stopped`* table, keyed
 * by what was being parsed. They are distinct rows because attribution differs:
 * Studio owns its own output, and a repository owns its declaration files.
 *
 * A malformed `workspace.toml` is deliberately absent. That is the `malformed`
 * condition, produced by the inspector's own `invalid_workspace` finding, and
 * AC-0059's repository-file branch covers only a declaration file that is not
 * the workspace declaration — in this slice, `.agentbundle-state.toml`.
 */
export const PARSE_FAILURE_STOP_REASONS = {
  "studio-produced": {
    condition: "inspection-stopped",
    reason: "Studio could not read its own inspection output",
    attribution: "Studio",
    retryable: "no",
  },
  "repository-derived-echoed": {
    condition: "inspection-stopped",
    reason: "The repository's content could not be parsed",
    attribution: "repository",
    retryable: "only if the repository changes",
  },
  "repository-declaration-file": {
    condition: "inspection-stopped",
    reason: "A declaration file in the repository could not be read",
    attribution: "repository",
    retryable: "only if the repository changes",
  },
} as const satisfies Record<string, StopReason>;

export type ParseSubject = keyof typeof PARSE_FAILURE_STOP_REASONS;

/**
 * The outcome of one parse. `value` is always present so a caller reads it the
 * same way either way, and is `undefined` on every refusal — AC-0059 requires
 * that a failed parse contribute no extracted value and nothing partial.
 */
export interface DeclaredParseOutcome {
  readonly value: unknown;
  readonly refusal?: DeclaredReadRefusal;
  readonly diagnostic?: string;
  readonly stop?: StopReason;
}

function refused(
  refusal: DeclaredReadRefusal,
  diagnostic: string,
  subject: ParseSubject,
): DeclaredParseOutcome {
  return {
    value: undefined,
    refusal,
    diagnostic,
    stop: PARSE_FAILURE_STOP_REASONS[subject],
  };
}

/**
 * The maximum bracket nesting in a JSON document, measured over the text
 * **before it is parsed**.
 *
 * AC-0056 requires the bound to be enforced before the recursion it guards, and
 * `JSON.parse` is itself that recursion: a document deep enough to exhaust the
 * stack does so inside the parser, before any guard placed after it could run.
 * Counting brackets outside string literals is the only check that precedes it.
 *
 * The scan stops as soon as the bound is exceeded, so a hostile document costs
 * no more than the prefix it takes to refuse it.
 */
export function jsonTextNestingDepth(text: string, stopAt: number): number {
  let depth = 0;
  let deepest = 0;
  let inString = false;
  let escaped = false;
  for (const character of text) {
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }
    if (character === '"') {
      inString = true;
      continue;
    }
    if (character === "{" || character === "[") {
      depth += 1;
      deepest = Math.max(deepest, depth);
      if (deepest > stopAt) {
        return deepest;
      }
      continue;
    }
    if (character === "}" || character === "]") {
      depth -= 1;
    }
  }
  return deepest;
}

/**
 * The structural depth of an already-parsed document, walked with an explicit
 * stack rather than by recursion, and abandoned as soon as the bound is passed.
 * Nothing here recurses, so the bound is enforced rather than merely reported.
 */
export function documentNestingDepth(
  document: unknown,
  stopAt: number,
): number {
  let deepest = 0;
  const pending: { node: unknown; depth: number }[] = [
    { node: document, depth: 0 },
  ];
  while (pending.length > 0) {
    const { node, depth } = pending.pop() as { node: unknown; depth: number };
    if (node === null || typeof node !== "object") {
      continue;
    }
    deepest = Math.max(deepest, depth + 1);
    if (deepest > stopAt) {
      return deepest;
    }
    const children = Array.isArray(node)
      ? node
      : Object.keys(node).map((key) => (node as Record<string, unknown>)[key]);
    for (const child of children) {
      pending.push({ node: child, depth: depth + 1 });
    }
  }
  return deepest;
}

/**
 * Parses one declared TOML document under every parse bound.
 *
 * The order is load-bearing: depth is bounded before the guard walks the
 * document, and the inadmissible-key guard rebuilds every object with a null
 * prototype, so a refused document never produces a value and an admitted one
 * never carries an inherited prototype.
 */
export function parseDeclared(
  text: string,
  subject: ParseSubject = "repository-declaration-file",
): DeclaredParseOutcome {
  let parsed: unknown;
  try {
    // `smol-toml` builds the document itself; the depth of what it returns is
    // bounded immediately below, before this module walks it.
    parsed = parseToml(text);
  } catch (cause) {
    return refused(
      "parse-failed",
      `declared document could not be parsed: ${String(cause)}`,
      subject,
    );
  }
  const depth = documentNestingDepth(parsed, PARSE_NESTING_DEPTH_BOUND);
  if (depth > PARSE_NESTING_DEPTH_BOUND) {
    return refused(
      "exceeds-nesting-depth",
      `declared document nests deeper than ${PARSE_NESTING_DEPTH_BOUND} levels`,
      subject,
    );
  }
  return { value: withoutInadmissibleKeys(parsed) };
}

/** Parses one JSON document under every parse bound, depth first. */
export function parseDeclaredJson(
  text: string,
  subject: ParseSubject = "studio-produced",
): DeclaredParseOutcome {
  const textDepth = jsonTextNestingDepth(text, PARSE_NESTING_DEPTH_BOUND);
  if (textDepth > PARSE_NESTING_DEPTH_BOUND) {
    return refused(
      "exceeds-nesting-depth",
      `document nests deeper than ${PARSE_NESTING_DEPTH_BOUND} levels`,
      subject,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text, function dropInadmissible(key, value) {
      return isInadmissibleKey(key) ? undefined : value;
    });
  } catch (cause) {
    return refused(
      "parse-failed",
      `document could not be parsed: ${String(cause)}`,
      subject,
    );
  }
  return { value: withoutInadmissibleKeys(parsed) };
}

export interface DeclaredFileRead {
  readonly name: PermittedReadName;
  readonly outcome: DeclaredParseOutcome;
}

export interface DeclaredReadResult {
  readonly reads: readonly DeclaredFileRead[];
  readonly refusal?: DeclaredReadRefusal;
  readonly diagnostic?: string;
  readonly stop?: StopReason;
}

export function isPermittedReadName(name: string): name is PermittedReadName {
  return (PERMITTED_READ_SURFACE as readonly string[]).includes(name);
}

/**
 * Reads the declared values from the materialization root.
 *
 * Both bounds are checked **before** anything is read: the file count against
 * the requested set, and each name against the permitted surface. The byte
 * bound and path containment are delegated to `readContainedFile`, which is
 * the single read path for repository content and already checks size before
 * the open.
 */
export function readDeclaredValues(
  materializationRoot: string,
  names: readonly string[],
): DeclaredReadResult {
  if (names.length > DECLARED_READ_FILE_BOUND) {
    return {
      reads: [],
      refusal: "exceeds-file-count-bound",
      diagnostic: `${names.length} files requested, bound is ${DECLARED_READ_FILE_BOUND}`,
      stop: PARSE_FAILURE_STOP_REASONS["repository-declaration-file"],
    };
  }
  for (const name of names) {
    if (!isPermittedReadName(basename(name)) || !isPermittedReadName(name)) {
      return {
        reads: [],
        refusal: "outside-permitted-read-surface",
        diagnostic: `${name} is outside the permitted read surface`,
        stop: PARSE_FAILURE_STOP_REASONS["repository-declaration-file"],
      };
    }
  }

  const reads: DeclaredFileRead[] = [];
  for (const name of names as readonly PermittedReadName[]) {
    let text: string;
    try {
      text = readContainedFile(
        materializationRoot,
        `${materializationRoot}/${name}`,
        DECLARED_READ_BYTE_BOUND,
      );
    } catch (cause) {
      const refusal: DeclaredReadRefusal =
        cause instanceof ConfinementError &&
        cause.refusal === "exceeds-single-file-bound"
          ? "exceeds-byte-bound"
          : "unreadable";
      reads.push({
        name,
        outcome: refused(
          refusal,
          `${name}: ${String(cause)}`,
          "repository-declaration-file",
        ),
      });
      continue;
    }
    reads.push({ name, outcome: parseDeclared(text) });
  }
  return { reads };
}

/**
 * AC-0057's third clause: normalization copies only criterion-named fields onto
 * a freshly constructed object, rather than consuming a parsed object's shape.
 * The result carries exactly the named fields that were present, and nothing a
 * document declared beyond them can travel further into Studio.
 */
export function normalizeDeclared<Field extends string>(
  parsed: unknown,
  fields: readonly Field[],
): Record<Field, unknown> {
  const normalized = Object.create(null) as Record<Field, unknown>;
  if (parsed === null || typeof parsed !== "object") {
    return normalized;
  }
  for (const field of fields) {
    if (isInadmissibleKey(field)) {
      continue;
    }
    if (Object.hasOwn(parsed, field)) {
      normalized[field] = (parsed as Record<string, unknown>)[field];
    }
  }
  return normalized;
}

/**
 * The declared workspace version marker, as an observed value and nothing more.
 * AC-0067 keeps it separate from the version the inspector reports for its own
 * output contract, and AC-0068 forbids comparing it against any version set
 * neither party declared — so this reports the string and draws no conclusion.
 */
export function declaredVersionMarker(parsed: unknown): string | undefined {
  if (parsed === null || typeof parsed !== "object") {
    return undefined;
  }
  const declared = (parsed as Record<string, unknown>)[DECLARED_VERSION_KEY];
  return typeof declared === "string" && declared !== "" ? declared : undefined;
}
