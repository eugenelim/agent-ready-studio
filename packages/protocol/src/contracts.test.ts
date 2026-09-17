import { readFileSync } from "node:fs";
import type { AnySchemaObject, ValidateFunction } from "ajv";
import ajv2020Module from "ajv/dist/2020.js";
import ajvFormatsModule from "ajv-formats";
import { describe, expect, it } from "vitest";

import {
  validNotificationFixtures,
  validRequestFixtures,
  validResultFixtures,
} from "./fixtures.js";
import {
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
