import {
  artifactTypeSchema,
  blueprintSchema,
  transformationSchema,
} from "@agent-ready/workspace-sdk";

export const productDevelopmentModules = [
  { id: "overview", name: "Overview", artifactTypeIds: ["initiative"] },
  {
    id: "strategy",
    name: "Strategy",
    artifactTypeIds: ["input-packet", "product-intent"],
  },
  { id: "research", name: "Research", artifactTypeIds: [] },
  { id: "experience", name: "Experience", artifactTypeIds: [] },
  { id: "architecture", name: "Architecture", artifactTypeIds: [] },
  { id: "delivery", name: "Delivery", artifactTypeIds: [] },
  { id: "release", name: "Release", artifactTypeIds: [] },
  { id: "outcomes", name: "Outcomes", artifactTypeIds: [] },
] as const;

export const productDevelopmentBlueprint = blueprintSchema.parse({
  id: "product-development",
  version: "1",
  name: "Product Development",
  modules: productDevelopmentModules,
});

export const productDevelopmentArtifactTypes = [
  artifactTypeSchema.parse({
    id: "initiative",
    name: "Initiative",
    contentSchemaVersion: "1",
  }),
  artifactTypeSchema.parse({
    id: "input-packet",
    name: "Input Packet",
    contentSchemaVersion: "1",
  }),
  artifactTypeSchema.parse({
    id: "product-intent",
    name: "Product Intent",
    contentSchemaVersion: "1",
  }),
];

export const frameProductIntentTransformation = transformationSchema.parse({
  id: "strategy.frame-product-intent",
  inputArtifactType: "input-packet",
  outputArtifactType: "product-intent",
  eligibleExecutorKinds: ["human", "agent", "deterministic", "external"],
});
