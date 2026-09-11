import { z } from "zod";

export const executionPacketSchema = z
  .object({
    executionId: z.string().min(1),
    transformationId: z.string().min(1),
    inputRevisionIds: z.array(z.string().min(1)).min(1),
    executorKind: z.enum(["human", "agent", "deterministic", "external"]),
  })
  .strict();

export const executionEventSchema = z
  .object({
    sequence: z.number().int().nonnegative(),
    kind: z.enum(["started", "progress", "result", "completed", "failed"]),
    message: z.string().min(1),
    occurredAt: z.iso.datetime(),
  })
  .strict();

export const executionResultSchema = z
  .object({
    status: z.enum(["completed", "failed"]),
    outputRevisionId: z.string().min(1).nullable(),
    events: z.array(executionEventSchema),
  })
  .strict();

export type ExecutionPacket = z.infer<typeof executionPacketSchema>;
export type ExecutionEvent = z.infer<typeof executionEventSchema>;
export type ExecutionResult = z.infer<typeof executionResultSchema>;

export interface Executor {
  execute(packet: ExecutionPacket): Promise<ExecutionResult>;
}
