/**
 * The parse guards for structure crossing into a Studio process.
 *
 * *Canonical values* owns the two bounds these enforce — *Inadmissible parse
 * keys* and *Parse nesting depth* — and AC-0056 and AC-0057 name the sites
 * they bind: the declared-value read and the northbound result line.
 *
 * **Why they live in the protocol package.** One of those sites is
 * `validator.ts` in this package, which cannot import from `apps/`, so a guard
 * hosted there could not reach it. `apps/studio-service` already depends on
 * this package, so hosting them here needs no new workspace dependency, and
 * the trial module re-exports them so nothing that imported them from there
 * has to change.
 *
 * `PARSE_NESTING_DEPTH_BOUND` moves with them deliberately. The scan functions
 * take the bound as an argument, so leaving the constant behind would force a
 * second copy and let two sites enforce different depths against one criterion.
 */

/** *Canonical values*, *Inadmissible parse keys*, in the order it writes them. */
export const INADMISSIBLE_PARSE_KEYS = [
  "__proto__",
  "constructor",
  "prototype",
] as const;

export type InadmissibleParseKey = (typeof INADMISSIBLE_PARSE_KEYS)[number];

const INADMISSIBLE = new Set<string>(INADMISSIBLE_PARSE_KEYS);

export function isInadmissibleKey(key: string): boolean {
  return INADMISSIBLE.has(key);
}

/** *Canonical values*, *Parse nesting depth*. */
export const PARSE_NESTING_DEPTH_BOUND = 64;

/**
 * Rebuilds a parsed document, dropping every inadmissible key at every depth
 * and giving each object a null prototype.
 *
 * `Object.keys` reports own enumerable keys only, so an inherited name is
 * never copied; combined with the null prototype on the rebuilt object, the
 * result carries exactly the admissible own keys the document declared. The
 * rebuild is also what satisfies "freshly constructed objects rather than
 * consuming a parsed object's shape": no parsed object is handed onward.
 */
export function withoutInadmissibleKeys(document: unknown): unknown {
  if (document === null || typeof document !== "object") {
    return document;
  }
  if (Array.isArray(document)) {
    return document.map((element) => withoutInadmissibleKeys(element));
  }
  if (document instanceof Date) {
    return document;
  }
  const rebuilt = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(document)) {
    if (INADMISSIBLE.has(key)) {
      continue;
    }
    rebuilt[key] = withoutInadmissibleKeys(
      (document as Record<string, unknown>)[key],
    );
  }
  return rebuilt;
}

/**
 * The maximum bracket nesting in a JSON document, measured over the text
 * **before it is parsed**.
 *
 * AC-0056 requires the bound to be enforced before the recursion it guards,
 * and `JSON.parse` is itself that recursion: a document deep enough to exhaust
 * the stack does so inside the parser, before any guard placed after it could
 * run. Counting brackets outside string literals is the only check that
 * precedes it.
 *
 * The scan stops as soon as the bound is exceeded, so a document that breaches
 * the depth bound costs no more than the prefix it takes to refuse it. A
 * document that stays within the bound is walked in full, which is the same
 * single pass over the text that the parse behind it already makes.
 */
export function jsonTextNestingDepth(text: string, stopAt: number): number {
  let depth = 0;
  let deepest = 0;
  let inString = false;
  let escaped = false;
  // Indexed rather than `for...of`. The scan only ever compares against the
  // ASCII characters `"`, `\\`, `{`, `[`, `}` and `]`, none of which can be
  // half of a surrogate pair, so reading UTF-16 units is identical to reading
  // code points here, and it avoids building a string iterator per line. The
  // iterator form cost several times this one against the same text, while
  // comparing `charCodeAt` values was indistinguishable from indexing and so
  // was not kept. The absolute timings are host-specific -- a reviewer
  // reproduced the ordering and not the numbers -- so they live with the run
  // that produced them, in the verification ledger.
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
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
 * stack rather than by recursion, and abandoned as soon as the bound is
 * passed. Nothing here recurses, so the bound is enforced rather than merely
 * reported.
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
 * Why a guarded parse refused. `parse-failed` is ordinary malformed input;
 * `exceeds-nesting-depth` is the *Parse nesting depth* bound firing.
 */
export type GuardedParseRefusal = "parse-failed" | "exceeds-nesting-depth";

/**
 * A refused guarded parse. It is thrown rather than returned so that a call
 * site whose existing answer to malformed input is already correct — dropping
 * the line, or disconnecting the transport — keeps that answer without a new
 * branch, and so that no partially parsed value can be mistaken for a result.
 */
export class GuardedParseError extends Error {
  constructor(
    readonly refusal: GuardedParseRefusal,
    message: string,
  ) {
    super(message);
    this.name = "GuardedParseError";
  }
}

/**
 * Parses JSON under both bounds.
 *
 * The order is load-bearing: the text depth is measured before `JSON.parse`
 * runs, the reviver drops each inadmissible key as the parse produces it so
 * the key never reaches a complete value, and the rebuild then supplies the
 * null prototypes. A refusal yields no value at all.
 */
export function parseGuardedJson(text: string): unknown {
  if (
    jsonTextNestingDepth(text, PARSE_NESTING_DEPTH_BOUND) >
    PARSE_NESTING_DEPTH_BOUND
  ) {
    throw new GuardedParseError(
      "exceeds-nesting-depth",
      `document nests deeper than ${PARSE_NESTING_DEPTH_BOUND} levels`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text, function dropInadmissible(key, value) {
      return INADMISSIBLE.has(key) ? undefined : value;
    });
  } catch (cause) {
    throw new GuardedParseError(
      "parse-failed",
      `document could not be parsed: ${String(cause)}`,
    );
  }
  return withoutInadmissibleKeys(parsed);
}
