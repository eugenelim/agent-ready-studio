// biome-ignore-all lint/suspicious/noPrototypeBuiltins: the approved AC-0057 plan
// stub calls Object.prototype.hasOwnProperty.call and must stay byte-identical to
// plan.md. This file has no other use of a prototype builtin.
import { describe, expect, it } from "vitest";

import {
  DECLARED_READ_BYTE_BOUND,
  DECLARED_READ_FILE_BOUND,
  declaredVersionMarker,
  documentNestingDepth,
  jsonTextNestingDepth,
  normalizeDeclared,
  PARSE_FAILURE_STOP_REASONS,
  PARSE_NESTING_DEPTH_BOUND,
  PERMITTED_READ_SURFACE,
  parseDeclared,
  parseDeclaredJson,
} from "./declared-value-reader.js";

/** A TOML document nested `depth` levels through dotted table headers. */
function nestedToml(depth: number): string {
  const path = Array.from({ length: depth }, (_, index) => `k${index}`).join(
    ".",
  );
  return `[${path}]\nleaf = 1\n`;
}

describe("the surface and the bounds this module delivers", () => {
  // Constants only. The read itself happens in the Runtime child and is bound
  // there, on the live path, by `declared-read.test.ts` -- AC-0054 under
  // "the declared read stays inside the permitted read surface", AC-0055
  // under "the declared read is bounded before it reads". Neither criterion
  // is claimed here: pinning a constant is not evidence for a behaviour, and
  // labelling this block with them would invite a reader to think it is.
  it("admits both permitted files and nothing else", () => {
    expect(PERMITTED_READ_SURFACE).toEqual([
      "workspace.toml",
      ".agentbundle-state.toml",
    ]);
  });

  it("pins the two declared-read bounds", () => {
    expect(DECLARED_READ_FILE_BOUND).toBe(2);
    expect(DECLARED_READ_BYTE_BOUND).toBe(1024 * 1024);
  });
});

describe("AC-0056 the nesting-depth bound is enforced before the recursion", () => {
  it("measures JSON depth from the text, before it is parsed", () => {
    const deep = `${"[".repeat(200)}1${"]".repeat(200)}`;

    // The scan stops as soon as the bound is passed, so it reports a depth past
    // the bound without having walked the whole document.
    expect(
      jsonTextNestingDepth(deep, PARSE_NESTING_DEPTH_BOUND),
    ).toBeGreaterThan(PARSE_NESTING_DEPTH_BOUND);
  });

  it("refuses an over-deep JSON document and yields no value", () => {
    const deep = `${"[".repeat(200)}1${"]".repeat(200)}`;

    const outcome = parseDeclaredJson(deep);

    expect(outcome).toMatchObject({
      refusal: "exceeds-nesting-depth",
      value: undefined,
    });
  });

  it("refuses an over-deep TOML document and yields no value", () => {
    const outcome = parseDeclared(nestedToml(PARSE_NESTING_DEPTH_BOUND + 5));

    expect(outcome).toMatchObject({
      refusal: "exceeds-nesting-depth",
      value: undefined,
    });
  });

  it("admits a document at the bound, so the refusal is not blanket", () => {
    const outcome = parseDeclared(nestedToml(PARSE_NESTING_DEPTH_BOUND - 1));

    expect(outcome.refusal).toBeUndefined();
    expect(outcome.value).toBeDefined();
  });

  it("walks an already-parsed document without recursing", () => {
    // The walk is iterative and abandons as soon as the bound is passed, which
    // is what keeps a hostile document from exhausting the stack here.
    const deep = JSON.parse(`${"[".repeat(500)}1${"]".repeat(500)}`);

    expect(
      documentNestingDepth(deep, PARSE_NESTING_DEPTH_BOUND),
    ).toBeGreaterThan(PARSE_NESTING_DEPTH_BOUND);
  });

  it("carries the canonical depth bound", () => {
    expect(PARSE_NESTING_DEPTH_BOUND).toBe(64);
  });
});

// biome-ignore format: approved plan stub must remain byte-identical
it("AC-0057 yields no value under a prototype-mutating key", () => {
 const out = parseDeclared('[__proto__]\npolluted = true\n');
 expect(Object.prototype).not.toHaveProperty("polluted");
 expect(Object.getPrototypeOf(out.value)).toBeNull();
 expect(Object.prototype.hasOwnProperty.call(out.value, "__proto__")).toBe(false);
});

describe("AC-0057 no parse yields a value under an inadmissible key", () => {
  it("drops every inadmissible key at every depth", () => {
    const outcome = parseDeclared(
      "[a.__proto__]\nx = 1\n\n[a.b.constructor]\ny = 2\n\n[a.b.prototype]\nz = 3\n",
    );
    const value = outcome.value as { a: { b: Record<string, unknown> } };

    expect(Object.hasOwn(value.a, "__proto__")).toBe(false);
    expect(Object.hasOwn(value.a.b, "constructor")).toBe(false);
    expect(Object.hasOwn(value.a.b, "prototype")).toBe(false);
  });

  it("materializes every parsed object without an inherited prototype", () => {
    const outcome = parseDeclared("[a.b.c]\nx = 1\n");
    const value = outcome.value as { a: { b: { c: unknown } } };

    for (const node of [value, value.a, value.a.b, value.a.b.c]) {
      expect(Object.getPrototypeOf(node as object)).toBeNull();
    }
  });

  it("copies only criterion-named fields onto a fresh object", () => {
    const parsed = parseDeclared(
      'schema-version = "0.4"\nsmuggled = "payload"\n',
    ).value;

    const normalized = normalizeDeclared(parsed, ["schema-version"]);

    expect(Object.keys(normalized)).toEqual(["schema-version"]);
    expect(Object.hasOwn(normalized, "smuggled")).toBe(false);
    expect(Object.getPrototypeOf(normalized)).toBeNull();
  });

  it("copies nothing for a field the document did not declare", () => {
    const normalized = normalizeDeclared(
      parseDeclared("ready = true\n").value,
      ["schema-version"],
    );

    expect(Object.keys(normalized)).toEqual([]);
  });
});

describe("AC-0058 no YAML parse exists in this slice", () => {
  it("reads a permitted surface that is TOML only", () => {
    for (const name of PERMITTED_READ_SURFACE) {
      expect(name.endsWith(".toml")).toBe(true);
    }
  });

  it("declares no YAML parser among the service's dependencies", async () => {
    const manifest = await import("../../../package.json", {
      with: { type: "json" },
    });
    const dependencies = (
      manifest.default as { dependencies: Record<string, string> }
    ).dependencies;

    // The clause binds the slice that first parses YAML. There is no such
    // parse here, and this is the assertion that keeps that true.
    expect(Object.keys(dependencies)).not.toContain("yaml");
    expect(dependencies["smol-toml"]).toBe("1.8.0");
  });
});

describe("AC-0059 a failed parse routes to its reason and attribution", () => {
  it("yields no value and a distinct diagnostic", () => {
    const outcome = parseDeclared("this is not = = toml\n");

    expect(outcome.value).toBeUndefined();
    expect(outcome.refusal).toBe("parse-failed");
    expect(outcome.diagnostic).toContain("could not be parsed");
  });

  it("attributes a repository declaration file to the repository", () => {
    const outcome = parseDeclared("= broken\n", "repository-declaration-file");

    expect(outcome.stop).toEqual(
      PARSE_FAILURE_STOP_REASONS["repository-declaration-file"],
    );
    expect(outcome.stop).toMatchObject({
      condition: "inspection-stopped",
      attribution: "repository",
      reason: "A declaration file in the repository could not be read",
    });
  });

  it("attributes Studio-produced structure to Studio", () => {
    const outcome = parseDeclaredJson("{not json", "studio-produced");

    expect(outcome.stop).toMatchObject({
      attribution: "Studio",
      reason: "Studio could not read its own inspection output",
      retryable: "no",
    });
  });

  it("attributes repository-derived structure echoed by the inspector separately", () => {
    const outcome = parseDeclaredJson("{not json", "repository-derived-echoed");

    expect(outcome.stop).toMatchObject({
      attribution: "repository",
      reason: "The repository's content could not be parsed",
    });
  });

  it("gives the three rows three distinct reasons", () => {
    const reasons = Object.values(PARSE_FAILURE_STOP_REASONS).map(
      (stop) => stop.reason,
    );

    expect(new Set(reasons).size).toBe(3);
  });

  it("contributes nothing partially parsed", () => {
    // The first table parses; the document then breaks. Nothing from the
    // readable prefix survives the refusal.
    const outcome = parseDeclared("[good]\nx = 1\n[bad\n");

    expect(outcome.value).toBeUndefined();
  });
});

describe("AC-0060 no declared value carries a lifecycle meaning", () => {
  it("reports the declared marker as an observed string and nothing more", () => {
    const parsed = parseDeclared('schema-version = "0.4"\n').value;

    expect(declaredVersionMarker(parsed)).toEqual({ marker: "0.4" });
  });

  it("reports no marker when the repository declares none", () => {
    // `workspace.toml` carries no `schema-version`, verified on this
    // repository, which is why the permitted surface admits the second file.
    const parsed = parseDeclared("ready = true\n").value;

    expect(declaredVersionMarker(parsed)).toEqual({});
  });

  it("draws no lifecycle conclusion from a declared value", () => {
    const parsed = parseDeclared(
      'schema-version = "0.4"\nstatus = "ready"\nblocked = false\nnext-action = "ship"\n',
    ).value;

    const normalized = normalizeDeclared(parsed, ["schema-version"]);

    // Lifecycle-shaped keys the repository declared reach nothing: only the
    // criterion-named field is copied, and it is reported, never interpreted.
    for (const lifecycle of ["status", "blocked", "next-action"]) {
      expect(Object.hasOwn(normalized, lifecycle)).toBe(false);
    }
    expect(Object.keys(normalized)).toEqual(["schema-version"]);
  });
});
