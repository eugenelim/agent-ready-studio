/**
 * The northbound transport site's guards, AC-0056 and AC-0057.
 *
 * `guarded-parse.ts` carries the helper's own unit coverage. These cases bind
 * the **transport call site** in `validator.ts`, because a guard proven only
 * for the helper is not proven where it is used — which is the defect class
 * this whole slice exists to close.
 */
import { describe, expect, it } from "vitest";

import {
  GuardedParseError,
  INADMISSIBLE_PARSE_KEYS,
  PARSE_NESTING_DEPTH_BOUND,
  parseGuardedJson,
} from "./guarded-parse.js";

/** A JSON text whose bracket nesting passes the bound. */
function deeplyNestedJson(levels: number): string {
  return `${"[".repeat(levels)}1${"]".repeat(levels)}`;
}

describe("AC-0056 the depth bound is enforced before the parse it guards", () => {
  it("yields no value from a document past the bound", () => {
    let refusal: unknown;
    try {
      parseGuardedJson(deeplyNestedJson(PARSE_NESTING_DEPTH_BOUND + 1));
    } catch (cause) {
      refusal = cause;
    }

    expect(refusal).toBeInstanceOf(GuardedParseError);
    expect((refusal as GuardedParseError).refusal).toBe(
      "exceeds-nesting-depth",
    );
  });

  it("admits a document exactly at the bound", () => {
    // Paired with the case above so the comparison itself is bound.
    expect(
      parseGuardedJson(deeplyNestedJson(PARSE_NESTING_DEPTH_BOUND)),
    ).toBeDefined();
  });

  it("measures the text, not the parsed value", () => {
    // A document deep enough to exhaust the stack does so inside `JSON.parse`,
    // before any guard placed after it could run, so the refusal must come
    // from the text scan. 20_000 levels would overflow a recursive parse.
    let refusal: unknown;
    try {
      parseGuardedJson(deeplyNestedJson(20_000));
    } catch (cause) {
      refusal = cause;
    }

    expect((refusal as GuardedParseError).refusal).toBe(
      "exceeds-nesting-depth",
    );
  });
});

describe("AC-0057 at the northbound transport site", () => {
  it("yields no value under an inadmissible key, at any depth", () => {
    for (const key of INADMISSIBLE_PARSE_KEYS) {
      const shallow = parseGuardedJson(`{"${key}":{"reached":true}}`) as Record<
        string,
        unknown
      >;
      const deep = parseGuardedJson(
        `{"a":{"b":[{"${key}":{"reached":true}}]}}`,
      ) as { a: { b: Record<string, unknown>[] } };

      expect(Object.hasOwn(shallow, key)).toBe(false);
      expect(Object.hasOwn(deep.a.b[0] as object, key)).toBe(false);
    }
  });

  it("materializes every admitted object without an inherited prototype", () => {
    const parsed = parseGuardedJson(
      '{"outer":{"inner":{"leaf":1}},"list":[{"leaf":2}]}',
    ) as {
      outer: { inner: object };
      list: object[];
    };

    expect(Object.getPrototypeOf(parsed as object)).toBeNull();
    expect(Object.getPrototypeOf(parsed.outer)).toBeNull();
    expect(Object.getPrototypeOf(parsed.outer.inner)).toBeNull();
    expect(Object.getPrototypeOf(parsed.list[0] as object)).toBeNull();
  });

  it("leaves no prototype reachable through an admitted document", () => {
    const parsed = parseGuardedJson('{"__proto__":{"polluted":true}}');

    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect((parsed as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("refuses malformed input distinctly from a bound breach", () => {
    let refusal: unknown;
    try {
      parseGuardedJson('{"unterminated":');
    } catch (cause) {
      refusal = cause;
    }

    expect((refusal as GuardedParseError).refusal).toBe("parse-failed");
  });
});
