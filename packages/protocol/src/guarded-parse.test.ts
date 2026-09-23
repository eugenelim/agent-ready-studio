/**
 * The northbound guards themselves, AC-0056 and AC-0057.
 *
 * These cases bind the **helper**: each control, and each branch of the text
 * scan the depth control rests on. The two **call sites** are bound elsewhere,
 * because a guard proven only for the helper is not proven where it is used —
 * which is the defect class this whole slice exists to close.
 * `validator.test.ts` carries the transport site; `northbound-guard.test.ts`
 * in the trial module carries the protocol-line site.
 */
import { describe, expect, it } from "vitest";

import {
  GuardedParseError,
  INADMISSIBLE_PARSE_KEYS,
  jsonTextNestingDepth,
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

  it("counts a closed container as closed, not as one more level", () => {
    // Without the close-bracket decrement the scan measures total containers
    // rather than depth. This line is 3 levels deep and holds
    // PARSE_NESTING_DEPTH_BOUND + 20 sibling objects; the mutant measures 65
    // and refuses it, which at the transport site disconnects over a
    // well-formed message.
    const flatSiblings = JSON.stringify({
      type: "flat-siblings",
      v: Array.from({ length: PARSE_NESTING_DEPTH_BOUND + 20 }, (_, i) => ({
        i,
      })),
    });

    expect(jsonTextNestingDepth(flatSiblings, PARSE_NESTING_DEPTH_BOUND)).toBe(
      3,
    );
    expect(parseGuardedJson(flatSiblings)).toBeDefined();
  });

  it("reads a bracket inside a string value as text, not as structure", () => {
    // The scan walks characters, so without the string-literal arm a bracket
    // a repository put inside a *value* counts as nesting. The escaped quote
    // is what separates the arm from a naive quote toggle: it must not end the
    // string. This line is 1 level deep; the mutant measures 65 and refuses.
    const bracketsInString = JSON.stringify({
      type: "brackets-in-string",
      v: `${"[".repeat(PARSE_NESTING_DEPTH_BOUND + 10)}"${"]".repeat(
        PARSE_NESTING_DEPTH_BOUND + 10,
      )}`,
    });

    expect(bracketsInString).toContain('\\"');
    expect(
      jsonTextNestingDepth(bracketsInString, PARSE_NESTING_DEPTH_BOUND),
    ).toBe(1);
    expect(parseGuardedJson(bracketsInString)).toBeDefined();
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
