import { describe, expect, it } from "vitest";

import { blueprintSchema, reviewPackageSchema } from "./index.js";

describe("workspace contracts", () => {
  it("rejects duplicate blueprint module IDs", () => {
    expect(() =>
      blueprintSchema.parse({
        id: "product-development",
        version: "1",
        name: "Product Development",
        modules: Array.from({ length: 8 }, () => ({
          id: "strategy",
          name: "Strategy",
          artifactTypeIds: [],
        })),
      }),
    ).toThrow("Duplicate blueprint module ID");
  });

  it("rejects an open review whose reviewed revision is accepted", () => {
    expect(() =>
      reviewPackageSchema.parse({
        review: { id: "review-1", status: "open" },
        reviewedRevision: { id: "revision-1", status: "accepted" },
        acceptedRevision: null,
        inputs: [],
        evidence: [],
        comments: [],
        decisions: [],
        changedFields: [],
        execution: null,
      }),
    ).toThrow("open review must target a proposed revision");
  });
});
