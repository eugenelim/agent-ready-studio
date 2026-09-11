import { describe, expect, it } from "vitest";

import type { StudioCallFailure } from "../preload/index.js";
import { stateFromFailure } from "./useReview.js";

describe("stateFromFailure", () => {
  it.each([
    ["timeout", null, "timed-out"],
    ["disconnected", null, "service-disconnected"],
    ["incompatible", -32001, "protocol-incompatible"],
    ["invalid-response", null, "execution-failed"],
    ["service", -32003, "execution-failed"],
  ] as const)("maps %s failures to the shared state", (kind, code, expectedKind) => {
    const error: StudioCallFailure = {
      kind,
      message: "Boundary failure",
      code,
      data: null,
    };

    expect(stateFromFailure(error)).toEqual({
      kind: expectedKind,
      message: "Boundary failure",
    });
  });
});
