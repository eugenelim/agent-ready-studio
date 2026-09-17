/**
 * The *Inadmissible parse keys* bound from *Resource bounds*: `__proto__`,
 * `constructor` and `prototype`, at any depth, refused before any value is
 * produced from the document.
 *
 * The bound names the parser guard as its mechanism. This module is that guard
 * and nothing else: it carries no permitted-read surface, no file count and no
 * nesting-depth check, because those are separate rows with separate owners.
 *
 * Refusal, rather than sanitization, is what discharges the bound. A guard that
 * stripped the key would still have produced a document, and a later reader
 * could not tell a stripped document from one that never carried the key. A
 * refusal yields no value at all, which satisfies "no value under that key" for
 * every key at once and cannot drift as the reader grows.
 *
 * The two formats reach that refusal differently, and the difference is a
 * property of the parsers rather than a choice:
 *
 * - **JSON** is guarded *during* the parse. `JSON.parse` takes a reviver, which
 *   sees each key as it is produced, so throwing from the reviver refuses the
 *   document before a complete value exists.
 * - **TOML** is guarded immediately *after* the parse. `smol-toml` exposes no
 *   reviver, so the document is walked and refused before it is returned. The
 *   intermediate object is never handed to a caller, so no value is produced
 *   from the document in the sense the bound means, but the object does exist
 *   transiently and this comment is the honest record of that.
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

export class InadmissibleKeyError extends Error {
  /** The refused key itself, so a caller can name it without re-scanning. */
  readonly key: string;
  /** Where it was found, as a dotted path, so the refusal is locatable. */
  readonly keyPath: string;

  constructor(key: string, keyPath: string) {
    super(
      `inadmissible parse key ${key} at ${keyPath === "" ? "<root>" : keyPath}`,
    );
    this.name = "InadmissibleKeyError";
    this.key = key;
    this.keyPath = keyPath;
  }
}

/**
 * Walks an already-parsed document and throws on the first inadmissible key at
 * any depth. Own keys only: an inherited key is not something the document
 * declared, and treating one as a finding would refuse ordinary documents.
 */
export function assertNoInadmissibleKeys(
  document: unknown,
  keyPath = "",
): void {
  if (document === null || typeof document !== "object") {
    return;
  }
  if (Array.isArray(document)) {
    document.forEach((element, index) => {
      assertNoInadmissibleKeys(element, `${keyPath}[${index}]`);
    });
    return;
  }
  for (const key of Object.keys(document)) {
    if (INADMISSIBLE.has(key)) {
      throw new InadmissibleKeyError(key, keyPath);
    }
    assertNoInadmissibleKeys(
      (document as Record<string, unknown>)[key],
      keyPath === "" ? key : `${keyPath}.${key}`,
    );
  }
}

/**
 * Parses JSON, refusing an inadmissible key as the parse produces it. The
 * reviver runs for every key, so the throw happens before a complete document
 * exists rather than after one has been handed back.
 */
export function parseGuardedJson(text: string): unknown {
  return JSON.parse(text, function reviveGuarded(key, value) {
    if (INADMISSIBLE.has(key)) {
      throw new InadmissibleKeyError(key, key);
    }
    return value;
  });
}

/**
 * Parses TOML, refusing an inadmissible key before the document is returned.
 * `smol-toml` has no reviver, so the guard is a walk rather than a hook; the
 * module comment records why that is the honest ordering for this format.
 */
export function parseGuardedToml(text: string): unknown {
  const document: unknown = parseToml(text);
  assertNoInadmissibleKeys(document);
  return document;
}
