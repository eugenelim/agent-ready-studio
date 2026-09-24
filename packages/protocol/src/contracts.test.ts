import { readFileSync } from "node:fs";
import type { AnySchemaObject, ValidateFunction } from "ajv";
import ajv2020Module from "ajv/dist/2020.js";
import ajvFormatsModule from "ajv-formats";
import { describe, expect, it } from "vitest";

import {
  validErrorFixtures,
  validNotificationFixtures,
  validRequestFixtures,
  validResultFixtures,
} from "./fixtures.js";
import {
  errorDataSchemas,
  notificationSchemas,
  requestSchemas,
  resultSchemas,
  type StudioMethod,
  validateNotification,
  validateRequest,
  validateResult,
} from "./validator.js";

type CanonicalProtocolSchema = AnySchemaObject & {
  $id: string;
  "x-studio": {
    methodResults: Record<StudioMethod, string>;
    errorCodes: Record<string, string>;
  };
};

const canonicalProtocolSchema = JSON.parse(
  readFileSync(
    new URL(
      "../../../contracts/jsonschema/studio-protocol-v1.schema.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as CanonicalProtocolSchema;
// ajv and ajv-formats ship CommonJS. The bundler resolves each default import
// to the callable value at runtime, but TypeScript types it as the module
// namespace, so each needs a cast to its own default-export type.
const Ajv2020 = ajv2020Module as unknown as typeof ajv2020Module.default;
const addFormats =
  ajvFormatsModule as unknown as typeof ajvFormatsModule.default;

const canonicalAjv = new Ajv2020({ allErrors: true });
canonicalAjv.addKeyword({ keyword: "x-spec" });
canonicalAjv.addKeyword({ keyword: "x-studio" });
addFormats(canonicalAjv);
canonicalAjv.addSchema(canonicalProtocolSchema);
const validateCanonicalProtocol = canonicalAjv.getSchema(
  canonicalProtocolSchema.$id,
);
if (validateCanonicalProtocol === undefined)
  throw new Error("Canonical protocol schema did not compile");

/** The `$defs` entry the contract binds to an error code's `data`. */
function canonicalErrorDataDefinition(code: string): AnySchemaObject {
  const defs = canonicalProtocolSchema.$defs as Record<string, AnySchemaObject>;
  const errorObject = defs.errorObject;
  if (errorObject === undefined) throw new Error("no errorObject definition");
  for (const member of errorObject.oneOf as { $ref: string }[]) {
    const error = defs[
      member.$ref.split("/").pop() as string
    ] as AnySchemaObject;
    if (String(error.properties.code.const) !== code) continue;
    const dataDefinition =
      defs[(error.properties.data.$ref as string).split("/").pop() as string];
    if (dataDefinition === undefined)
      throw new Error(`unresolved data ref for ${code}`);
    return dataDefinition;
  }
  throw new Error(`no canonical error data definition for ${code}`);
}

/** Follows a `$ref` so a property's declaration is inspected, not its pointer. */
function resolveSchema(schema: AnySchemaObject): AnySchemaObject {
  const defs = canonicalProtocolSchema.$defs as Record<string, AnySchemaObject>;
  let current = schema;
  for (let hop = 0; hop < 8 && typeof current.$ref === "string"; hop += 1) {
    const target = defs[(current.$ref as string).split("/").pop() as string];
    if (target === undefined) break;
    current = target;
  }
  return current;
}

/**
 * Every value the contract declares for a property name across the error-data
 * definitions. A `const` widened to an enum of its neighbours admits a value
 * that is real elsewhere in the contract but forbidden here, which an
 * arbitrary out-of-domain string cannot detect.
 */
function declaredVocabulary(property: string): string[] {
  const defs = canonicalProtocolSchema.$defs as Record<string, AnySchemaObject>;
  const values = new Set<string>();
  for (const definition of Object.values(defs)) {
    const candidate = (
      definition.properties as Record<string, AnySchemaObject> | undefined
    )?.[property];
    if (candidate === undefined) continue;
    const resolved = resolveSchema(candidate);
    if (typeof resolved.const === "string") values.add(resolved.const);
    for (const value of (resolved.enum ?? []) as unknown[])
      if (typeof value === "string") values.add(value);
  }
  return [...values];
}

/**
 * Payloads the contract forbids, derived from what it declares.
 *
 * One per way a schema can be loosened: an undeclared key tests closure, a
 * missing key tests a required field, a wrong-typed value tests the declared
 * type, and a value outside a `const` or `enum` tests the declared domain.
 * Declared object properties and array items recurse, so a nesting level the
 * contract closes is covered at that level too.
 */
function contractInvalidVariants(
  definition: AnySchemaObject,
  valid: unknown,
  path = "",
): { label: string; value: unknown }[] {
  if (
    definition.type !== "object" ||
    valid === null ||
    typeof valid !== "object"
  ) {
    return [];
  }
  const fixture = valid as Record<string, unknown>;
  const properties = (definition.properties ?? {}) as Record<
    string,
    AnySchemaObject
  >;
  const required = (definition.required ?? []) as string[];
  const variants: { label: string; value: unknown }[] = [];

  if (definition.additionalProperties === false) {
    variants.push({
      label: `${path}+undeclared key`,
      value: { ...fixture, undeclaredKey: "x" },
    });
  }
  for (const key of required) {
    const { [key]: _omitted, ...without } = fixture;
    variants.push({ label: `${path}-${key}`, value: without });
  }
  for (const [key, declared] of Object.entries(properties)) {
    if (!(key in fixture)) continue;
    const property = resolveSchema(declared);
    // An object is the wrong type for every declared leaf in this contract,
    // and for an array; for a declared object it is the wrong *shape*, which
    // the recursion below covers instead.
    if (property.type !== "object") {
      variants.push({
        label: `${path}${key}:wrong type`,
        value: { ...fixture, [key]: { wrongType: true } },
      });
    }
    if (property.const !== undefined || Array.isArray(property.enum)) {
      const admitted = new Set<unknown>([
        ...(property.const === undefined ? [] : [property.const]),
        ...((property.enum ?? []) as unknown[]),
      ]);
      const forbidden = [
        "outside-the-declared-domain",
        ...declaredVocabulary(key).filter((value) => !admitted.has(value)),
      ];
      for (const value of forbidden) {
        variants.push({
          label: `${path}${key}:${value}`,
          value: { ...fixture, [key]: value },
        });
      }
    }
    if (property.type === "object") {
      for (const nested of contractInvalidVariants(
        property,
        fixture[key],
        `${path}${key}.`,
      )) {
        variants.push({
          label: nested.label,
          value: { ...fixture, [key]: nested.value },
        });
      }
    }
    if (property.type === "array" && Array.isArray(fixture[key])) {
      const items = fixture[key] as unknown[];
      if (items.length > 0 && property.items?.type === "object") {
        for (const nested of contractInvalidVariants(
          property.items as AnySchemaObject,
          items[0],
          `${path}${key}[].`,
        )) {
          variants.push({
            label: nested.label,
            value: { ...fixture, [key]: [nested.value, ...items.slice(1)] },
          });
        }
      }
    }
  }
  return variants;
}

describe("protocol contract fixtures", () => {
  it("validates fixtures for every request, result, and notification", () => {
    for (const [method, fixture] of Object.entries(validRequestFixtures))
      expect(
        requestSchemas[method as keyof typeof requestSchemas].safeParse(fixture)
          .success,
      ).toBe(true);
    for (const [method, fixture] of Object.entries(validResultFixtures))
      expect(
        resultSchemas[method as keyof typeof resultSchemas].safeParse(fixture)
          .success,
      ).toBe(true);
    for (const [method, fixture] of Object.entries(validNotificationFixtures))
      expect(
        notificationSchemas[
          method as keyof typeof notificationSchemas
        ].safeParse(fixture).success,
      ).toBe(true);
  });

  it("validates every fixture against the canonical JSON Schema", () => {
    for (const fixture of Object.values(validRequestFixtures))
      expectCanonicalValid(validateCanonicalProtocol, fixture);
    for (const [method, fixture] of Object.entries(validResultFixtures)) {
      const resultReference =
        canonicalProtocolSchema["x-studio"].methodResults[
          method as StudioMethod
        ];
      const validateResultFixture = canonicalAjv.compile({
        $ref: `${canonicalProtocolSchema.$id}${resultReference}`,
      });
      expectCanonicalValid(validateResultFixture, fixture);
    }
    for (const [method, params] of Object.entries(validNotificationFixtures))
      expectCanonicalValid(validateCanonicalProtocol, {
        jsonrpc: "2.0",
        method,
        params,
      });
  });

  it("AC-0057 keeps the error-data mirror and the canonical schema in step", () => {
    // The transport rebuilds an error payload from the fields its code
    // declares and discards one its declared shape does not admit, so a zod
    // table that drifts from the contract silently deletes a valid diagnostic
    // or admits what the contract forbids. Nothing bound the two together,
    // and that drift had already happened on the emitting side unobserved.
    const canonicalCodes = Object.keys(
      canonicalProtocolSchema["x-studio"].errorCodes,
    ).sort();
    expect(Object.keys(errorDataSchemas).sort()).toEqual(canonicalCodes);
    expect(Object.keys(validErrorFixtures).sort()).toEqual(canonicalCodes);

    for (const [code, data] of Object.entries(validErrorFixtures)) {
      // Both directions for every code: the canonical schema admits the whole
      // envelope, and the zod mirror admits its payload.
      expectCanonicalValid(validateCanonicalProtocol, {
        jsonrpc: "2.0",
        id: "request-1",
        error: { code: Number(code), message: "Error", data },
      });
      expect(
        errorDataSchemas[code as keyof typeof errorDataSchemas].safeParse(data)
          .success,
      ).toBe(true);
    }

    // The rejection half, which is the only half that catches a widening:
    // loosening a mirror entry cannot turn an admitted fixture into a
    // rejected one, so the accept loop above binds the key set and nothing
    // else. Three generations of this guard each enumerated the widenings
    // their author thought of, and each missed a class -- an object in a
    // declared field, then optionality, then strictness at a nesting level.
    // So the negatives are **derived from the canonical schema** instead:
    // whatever the contract declares closed, required, typed or enumerated,
    // the mirror must refuse to admit. A widening class nobody has thought of
    // is bound the moment the contract declares the thing it widens.
    for (const [code, data] of Object.entries(validErrorFixtures)) {
      const definition = canonicalErrorDataDefinition(code);
      for (const { label, value } of contractInvalidVariants(
        definition,
        data,
      )) {
        const where = `${code} ${label}`;

        expect(
          errorDataSchemas[code as keyof typeof errorDataSchemas].safeParse(
            value,
          ).success,
          `${where}: the mirror must refuse what the contract forbids`,
        ).toBe(false);
        expect(
          validateCanonicalProtocol({
            jsonrpc: "2.0",
            id: "request-1",
            error: { code: Number(code), message: "Error", data: value },
          }),
          `${where}: the canonical schema must refuse it too`,
        ).toBe(false);
      }
    }
  });

  it("AC-14 rejects the removed Home variants in the Zod mirror and canonical schema", () => {
    // Amendment 0004 narrowed `home.get`: no `running` array, `kind` is `review`
    // only, `status` is three values. Carrying valid items in the fixture proves
    // the definitions are exercised, but it cannot catch the drift that matters —
    // widening a schema is permissive, so a fixture that validated before still
    // validates after `status` is widened back to five values. Only a rejection
    // case fails when the two contracts drift apart, and it must be asserted
    // against both, because either one can be widened alone.
    const home = validResultFixtures["home.get"] as {
      needsDecision: Record<string, unknown>[];
    };
    const validateHome = canonicalAjv.compile({
      $ref: `${canonicalProtocolSchema.$id}${canonicalProtocolSchema["x-studio"].methodResults["home.get"]}`,
    });
    const item = home.needsDecision[0];
    if (!item) throw new Error("Expected a needsDecision fixture item");

    for (const removed of [
      { ...home, needsDecision: [{ ...item, status: "running" }] },
      { ...home, needsDecision: [{ ...item, status: "failed" }] },
      { ...home, needsDecision: [{ ...item, kind: "execution" }] },
      { ...home, running: [] },
    ]) {
      expect(validateHome(removed)).toBe(false);
      expect(validateResult("home.get", removed).success).toBe(false);
    }

    // The unmodified fixture is accepted by both, so the cases above fail for the
    // removed variant rather than for some unrelated defect in the fixture.
    expect(validateHome(home)).toBe(true);
    expect(validateResult("home.get", home).success).toBe(true);
  });

  it("rejects duplicate execution inputs in the Zod mirror and canonical schema", () => {
    const executionStart = validRequestFixtures["execution.start"] as {
      params: Record<string, unknown>;
    };
    const duplicateInputs = {
      ...executionStart,
      params: {
        ...executionStart.params,
        inputRevisionIds: ["revision-1", "revision-1"],
      },
    };

    expect(validateRequest(duplicateInputs).ok).toBe(false);
    expect(validateCanonicalProtocol(duplicateInputs)).toBe(false);
  });

  it("rejects mismatched method params and actor identities without a dispatchable value", () => {
    const mismatched = validateRequest({
      jsonrpc: "2.0",
      id: "1",
      method: "workspace.create",
      params: { reviewId: "review-1", action: "approve" },
    });
    const actorSupplied = validateRequest({
      jsonrpc: "2.0",
      id: "1",
      method: "review.resolve",
      params: { reviewId: "review-1", action: "approve", actorId: "actor-1" },
    });
    expect(mismatched.ok).toBe(false);
    expect(actorSupplied.ok).toBe(false);
  });

  it("AC-21 refuses incompatible hello versions and unknown result or notification fields", () => {
    expect(
      validateRequest({
        jsonrpc: "2.0",
        id: "1",
        method: "system.hello",
        params: { protocolVersion: "2", client: "desktop" },
      }).ok,
    ).toBe(false);
    expect(
      validateResult("home.get", {
        kind: "home",
        needsDecision: [],
        blocked: [],
        recentlyCompleted: [],
        extra: true,
      }).success,
    ).toBe(false);
    expect(
      validateNotification("workspace.created", {
        ...validNotificationFixtures["workspace.created"],
        extra: true,
      }).success,
    ).toBe(false);
  });

  it("validates home groups and resolved Decision fields in review packages", () => {
    expect(
      validateResult("home.get", {
        kind: "home",
        needsDecision: [],
        blocked: [],
        recentlyCompleted: [],
      }).success,
    ).toBe(true);
    expect(
      validateResult("home.get", {
        kind: "home",
        needsDecision: [],
        blocked: [],
      }).success,
    ).toBe(false);
    expect(
      validateResult("review.get", {
        kind: "review-package",
        package: {
          ...(validResultFixtures["review.get"] as { package: object }).package,
          decisions: [
            {
              id: "decision-1",
              reviewId: "review-1",
              revisionId: "revision-1",
              actorId: "actor-1",
              actorName: "Local human",
              action: "approve",
              comment: null,
              createdAt: "2026-09-09T12:00:00.000Z",
            },
          ],
        },
      }).success,
    ).toBe(true);
    expect(
      validateResult("review.get", {
        kind: "review-package",
        package: {
          ...(validResultFixtures["review.get"] as { package: object }).package,
          decisions: [
            {
              id: "decision-1",
              reviewId: "review-1",
              revisionId: "revision-1",
              actorId: "actor-1",
              action: "approve",
              comment: null,
              createdAt: "2026-09-09T12:00:00.000Z",
            },
          ],
        },
      }).success,
    ).toBe(false);
  });
});

function expectCanonicalValid(
  validate: ValidateFunction,
  fixture: unknown,
): void {
  expect(validate(fixture), canonicalAjv.errorsText(validate.errors)).toBe(
    true,
  );
}

describe("connect-and-orient protocol methods", () => {
  // biome-ignore format: approved plan stub must remain byte-identical
  it("validates the source.connect fixture against both schemas", () => {
 expect(validateRequest(validRequestFixtures["source.connect"]).ok).toBe(true);
 expect(canonicalAjv.validate(canonicalProtocolSchema, validRequestFixtures["source.connect"])).toBe(true);
});

  it("refuses a malformed source.connect params payload with a JSON-RPC error", () => {
    const malformed = {
      jsonrpc: "2.0",
      id: "1",
      method: "source.connect",
      // `url` is required and `token` is not a member of the params object.
      params: { token: "ghp_secret" },
    };

    const mirrored = validateRequest(malformed);

    expect(mirrored.ok).toBe(false);
    if (!mirrored.ok) {
      expect(mirrored.error.code).toBe(-32602);
    }
    expect(canonicalAjv.validate(canonicalProtocolSchema, malformed)).toBe(
      false,
    );
  });

  it("carries the same result definition for all three methods", () => {
    const results = canonicalProtocolSchema["x-studio"].methodResults;

    for (const method of ["source.connect", "source.get", "source.cancel"]) {
      expect(results[method as StudioMethod]).toBe(
        "#/$defs/sourceInspectionResult",
      );
    }
  });

  it("points the canonical schema at this spec", () => {
    expect(canonicalProtocolSchema["x-spec"]).toContain(
      "docs/specs/connect-and-orient/",
    );
  });
});

describe("connect-and-orient result enums match the spec's tables", () => {
  const properties = (
    canonicalProtocolSchema as unknown as {
      $defs: {
        sourceInspectionResult: {
          properties: {
            condition: { enum: string[] };
            phase: { oneOf: [{ enum: string[] }, unknown] };
          };
        };
      };
    }
  ).$defs.sourceInspectionResult.properties;

  it("carries all eight condition values", () => {
    // The Condition axis table has eight rows. An earlier encoding of this
    // contract carried seven and filed `incomplete` as a progress state, which
    // is what this count exists to catch.
    expect(properties.condition.enum).toHaveLength(8);
    expect(properties.condition.enum).toContain("incomplete");
  });

  it("carries exactly the four progress and surface rows", () => {
    expect(properties.phase.oneOf[0].enum).toEqual([
      "unconnected",
      "url-rejected",
      "resolving",
      "inspecting",
    ]);
  });

  it("reconciles to the eleven user-visible states", () => {
    // The User-visible states table is the union of both, minus `ok`.
    const union = new Set([
      ...properties.condition.enum.filter((value) => value !== "ok"),
      ...properties.phase.oneOf[0].enum,
    ]);

    expect(union.size).toBe(11);
  });
});
