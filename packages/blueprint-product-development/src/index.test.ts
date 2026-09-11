import { transformationSchema } from "@agent-ready/workspace-sdk";
import { describe, expect, it } from "vitest";
import {
  frameProductIntentTransformation,
  productDevelopmentBlueprint,
  productDevelopmentModules,
} from "./index.js";

describe("Product Development blueprint", () => {
  it("AC-03 exposes exactly the eight blueprint modules and no Reviews module", () => {
    expect(productDevelopmentModules.map((module) => module.name)).toEqual([
      "Overview",
      "Strategy",
      "Research",
      "Experience",
      "Architecture",
      "Delivery",
      "Release",
      "Outcomes",
    ]);
    expect(productDevelopmentBlueprint.modules).toHaveLength(8);
  });

  it("AC-07 defines framing independently of a provider and only for Input Packets", () => {
    expect(frameProductIntentTransformation.inputArtifactType).toBe(
      "input-packet",
    );
    expect(frameProductIntentTransformation.eligibleExecutorKinds).toEqual([
      "human",
      "agent",
      "deterministic",
      "external",
    ]);
    expect(
      transformationSchema.safeParse({
        ...frameProductIntentTransformation,
        provider: "example-provider",
      }).success,
    ).toBe(false);
  });
});
