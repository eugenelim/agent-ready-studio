import { z } from "zod";

export const actorKindSchema = z.enum([
  "human",
  "agent",
  "deterministic",
  "external",
]);
export const productIntentSchema = z
  .object({
    title: z.string().min(1),
    outcome: z.string().min(1),
    opportunity: z.string().min(1),
    targetUsers: z.array(z.string().min(1)).min(1),
    assumptions: z.array(z.string().min(1)),
    guardrails: z.array(z.string().min(1)),
    nonGoals: z.array(z.string().min(1)),
    confidence: z.enum(["low", "medium", "high"]),
    openQuestions: z.array(z.string().min(1)),
  })
  .strict();
export type ProductIntent = z.infer<typeof productIntentSchema>;
export type Actor = {
  id: string;
  name: string;
  kind: z.infer<typeof actorKindSchema>;
};
export type RevisionStatus =
  | "draft"
  | "proposed"
  | "accepted"
  | "rejected"
  | "superseded";
export type Revision = {
  id: string;
  artifactId: string;
  schemaVersion: string;
  content: ProductIntent;
  producer: string;
  transformationId: string | null;
  inputRevisionIds: string[];
  status: RevisionStatus;
  createdAt: string;
};
export type LifecycleEntry = {
  revisionId: string;
  status: RevisionStatus;
  occurredAt: string;
};
export type Decision = {
  id: string;
  reviewId: string;
  revisionId: string;
  actor: Actor;
  action: "approve" | "request-revision";
  comment: string | null;
  createdAt: string;
};
export type Review = {
  id: string;
  revisionId: string;
  status: "open" | "revision-needed" | "resolved" | "superseded";
};
export type Artifact = { id: string; acceptedRevisionId: string | null };
