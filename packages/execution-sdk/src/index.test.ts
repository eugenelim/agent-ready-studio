import { describe, expect, it } from "vitest";

import {
  executionEventSchema,
  executionPacketSchema,
  executionResultSchema,
} from "./index.js";

describe("execution contracts", () => {
  it("accepts a typed executor packet and rejects a duplicate-free packet without inputs", () => {
    expect(
      executionPacketSchema.safeParse({
        executionId: "execution-1",
        transformationId: "strategy.frame-product-intent",
        inputRevisionIds: ["revision-1"],
        executorKind: "deterministic",
      }).success,
    ).toBe(true);
    expect(
      executionPacketSchema.safeParse({
        executionId: "execution-1",
        transformationId: "strategy.frame-product-intent",
        inputRevisionIds: [],
        executorKind: "deterministic",
      }).success,
    ).toBe(false);
  });

  it("accepts normalized result events and rejects malformed persisted events", () => {
    expect(
      executionResultSchema.safeParse({
        status: "completed",
        outputRevisionId: "revision-2",
        events: [
          {
            sequence: 0,
            kind: "completed",
            message: "Complete",
            occurredAt: "2026-09-09T12:00:00.000Z",
          },
        ],
      }).success,
    ).toBe(true);
    expect(
      executionEventSchema.safeParse({
        sequence: -1,
        kind: "completed",
        message: "Complete",
        occurredAt: "2026-09-09T12:00:00.000Z",
      }).success,
    ).toBe(false);
  });
});
