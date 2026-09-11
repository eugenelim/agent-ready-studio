import { z } from "zod";

export const executorKindSchema = z.enum([
  "human",
  "agent",
  "deterministic",
  "external",
]);

export const blueprintModuleIdSchema = z.enum([
  "overview",
  "strategy",
  "research",
  "experience",
  "architecture",
  "delivery",
  "release",
  "outcomes",
]);

export const blueprintModuleSchema = z
  .object({
    id: blueprintModuleIdSchema,
    name: z.string().min(1),
    artifactTypeIds: z.array(z.string().min(1)),
  })
  .strict();

export const blueprintSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
    name: z.string().min(1),
    modules: z.array(blueprintModuleSchema).length(8),
  })
  .strict()
  .superRefine((blueprint, context) => {
    const ids = new Set<string>();
    for (const [index, module] of blueprint.modules.entries()) {
      if (ids.has(module.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate blueprint module ID: ${module.id}`,
          path: ["modules", index, "id"],
        });
      }
      ids.add(module.id);
    }
  });

export const artifactTypeSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    contentSchemaVersion: z.string().min(1),
  })
  .strict();

export const relationSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(["input-to", "evidence-for", "supersedes"]),
    sourceRevisionId: z.string().min(1),
    targetRevisionId: z.string().min(1),
    label: z.string(),
  })
  .strict();

export const transformationSchema = z
  .object({
    id: z.string().min(1),
    inputArtifactType: z.literal("input-packet"),
    outputArtifactType: z.literal("product-intent"),
    eligibleExecutorKinds: z.array(executorKindSchema).min(1),
  })
  .strict();

export const capabilityManifestSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
    transformations: z.array(transformationSchema),
  })
  .strict();

export const decisionViewSchema = z
  .object({
    id: z.string().min(1),
    reviewId: z.string().min(1),
    revisionId: z.string().min(1),
    actorId: z.string().min(1),
    actorName: z.string().min(1),
    action: z.enum(["approve", "request-revision"]),
    comment: z.string().nullable(),
    createdAt: z.iso.datetime(),
  })
  .strict();

export const reviewPackageSchema = z
  .object({
    review: z
      .object({
        id: z.string().min(1),
        status: z.enum(["open", "revision-needed", "resolved", "superseded"]),
      })
      .strict(),
    reviewedRevision: z
      .object({
        id: z.string().min(1),
        status: z.enum([
          "proposed",
          "accepted",
          "rejected",
          "superseded",
          "draft",
        ]),
      })
      .passthrough(),
    acceptedRevision: z
      .object({ id: z.string().min(1), status: z.literal("accepted") })
      .passthrough()
      .nullable(),
    inputs: z.array(z.object({ id: z.string().min(1) }).passthrough()),
    evidence: z.array(relationSchema),
    comments: z.array(
      z
        .object({
          id: z.string().min(1),
          actorId: z.string().min(1),
          body: z.string(),
          createdAt: z.iso.datetime(),
        })
        .strict(),
    ),
    decisions: z.array(decisionViewSchema),
    changedFields: z.array(z.string()),
    execution: z.unknown().nullable(),
  })
  .passthrough()
  .superRefine((reviewPackage, context) => {
    if (
      reviewPackage.review.status === "open" &&
      reviewPackage.reviewedRevision.status !== "proposed"
    ) {
      context.addIssue({
        code: "custom",
        message: "An open review must target a proposed revision",
        path: ["reviewedRevision", "status"],
      });
    }
  });

export type Blueprint = z.infer<typeof blueprintSchema>;
export type Transformation = z.infer<typeof transformationSchema>;
export type ReviewPackage = z.infer<typeof reviewPackageSchema>;
