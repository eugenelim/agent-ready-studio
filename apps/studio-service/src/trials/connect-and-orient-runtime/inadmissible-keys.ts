/**
 * The *Inadmissible parse keys* bound from *Resource bounds*: `__proto__`,
 * `constructor` and `prototype`, at any depth, refused before any value is
 * produced from the document.
 *
 * The bound names the parser guard as its mechanism. This module is that guard
 * and nothing else: it carries no permitted-read surface, no file count and no
 * nesting-depth check, because those are separate rows with separate owners.
 *
 * **What "refused" means here is the key, not the document.** AC-0057 requires
 * that no parse *yields a value* under an inadmissible key and that every
 * parsed document is materialized without an inherited prototype — so a value
 * is still produced, with nothing under those keys and with a null prototype.
 * Refusing the whole document would be stricter than the contract and would
 * leave the reader unable to report the rest of a file, so the guard drops the
 * key and rebuilds instead.
 *
 * Rebuilding is what makes both halves hold at once. Every object is recreated
 * with `Object.create(null)` and only admissible own keys are copied onto it,
 * so no parsed object's shape is consumed directly and an inadmissible key
 * cannot survive as an own property or reach a prototype.
 */
import { parse as parseToml } from "smol-toml";

/** The bound's enumeration, in the order *Resource bounds* writes it. */
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

/**
 * Rebuilds a parsed document, dropping every inadmissible key at every depth
 * and giving each object a null prototype.
 *
 * `Object.keys` reports own enumerable keys only, so an inherited name is
 * never copied; combined with the null prototype on the rebuilt object, the
 * result carries exactly the admissible own keys the document declared.
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
 * Parses TOML and returns the guarded document. `smol-toml` exposes no
 * reviver, so the guard is a rebuild rather than a parse hook; the
 * intermediate object is never handed to a caller.
 */
export function parseGuardedToml(text: string): unknown {
  return withoutInadmissibleKeys(parseToml(text));
}

/**
 * Parses JSON and returns the guarded document. The reviver drops each
 * inadmissible key as the parse produces it, so the key never reaches a
 * complete value; the rebuild then supplies the null prototypes.
 */
export function parseGuardedJson(text: string): unknown {
  const parsed: unknown = JSON.parse(
    text,
    function dropInadmissible(key, value) {
      return INADMISSIBLE.has(key) ? undefined : value;
    },
  );
  return withoutInadmissibleKeys(parsed);
}
