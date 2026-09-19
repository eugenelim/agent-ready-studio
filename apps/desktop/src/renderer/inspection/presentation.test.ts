import {
  project,
  USER_VISIBLE_STATES,
} from "@agent-ready/studio-service/state-projection";
import { describe, expect, it } from "vitest";
import {
  ALL_STATES,
  SHAPES,
  stateLabel,
  transition,
  VERDICT_LABELS,
  VERDICT_SHAPES,
} from "./presentation.js";

describe("AC-0121 and AC-0122 every state carries shape and label", () => {
  it("assigns a shape to every user-visible state, with no shape reused", () => {
    // Total over the eleven, and distinct. A shape shared by two states would
    // satisfy "has a shape" while failing "differs from every other in shape",
    // which is the half of AC-0121 a spot check misses.
    expect(ALL_STATES).toHaveLength(11);
    const shapes = ALL_STATES.map((state) => SHAPES[state]);
    expect(shapes.every((shape) => shape !== undefined)).toBe(true);
    expect(new Set(shapes).size).toBe(ALL_STATES.length);
  });

  it("gives every state a label that differs from every other", () => {
    const labels = ALL_STATES.map((state) => stateLabel(state, "abc1234def"));
    expect(new Set(labels).size).toBe(ALL_STATES.length);
    expect(labels.every((label) => label.trim() !== "")).toBe(true);
  });

  it("keeps the renderer's state roster identical to the projection's", () => {
    // The renderer imports the projection rather than restating it; this is
    // what would redden if someone reintroduced a local copy that drifted.
    expect([...ALL_STATES].sort()).toEqual([...USER_VISIBLE_STATES].sort());
  });

  it("substitutes the short SHA into the one label that carries a placeholder", () => {
    expect(stateLabel("inspecting", "abc1234def56")).toBe("Inspecting abc1234");
    expect(stateLabel("inspecting", null)).toBe("Inspecting");
    expect(stateLabel("inspecting", "abc1234def56")).not.toContain(
      "<short-sha>",
    );
    // Every other label is the projection's, unaltered.
    for (const state of ALL_STATES) {
      if (state === "inspecting") continue;
      expect(stateLabel(state, "abc1234def56")).toBe(project({ state }).label);
    }
  });
});

describe("AC-0157 verdict labels", () => {
  it("labels each verdict the table labels, distinctly, and no-verdict not at all", () => {
    expect(VERDICT_LABELS["agent-ready"]).toBe("Agent-Ready");
    expect(VERDICT_LABELS["not-agent-ready"]).toBe("Not Agent-Ready");
    expect(VERDICT_LABELS["no-verdict"]).toBeNull();
    // Distinct independently of hue: the labels alone separate them.
    expect(VERDICT_LABELS["agent-ready"]).not.toBe(
      VERDICT_LABELS["not-agent-ready"],
    );
    expect(VERDICT_SHAPES["no-verdict"]).toBeNull();
  });

  it("does not reuse a state shape for a verdict", () => {
    const stateShapes = new Set(ALL_STATES.map((state) => SHAPES[state]));
    for (const shape of Object.values(VERDICT_SHAPES)) {
      if (shape !== null) expect(stateShapes.has(shape)).toBe(false);
    }
  });
});

describe("AC-0125 one focus path, branching on provenance", () => {
  const nothing = { state: null, verdict: null, resolvedSha: null } as const;

  it("places focus on a named element for every user-initiated transition", () => {
    for (const state of ALL_STATES) {
      const step = transition(
        nothing,
        { state, verdict: null, resolvedSha: "abc1234" },
        "user",
      );
      expect(step.focus, `${state} named no focus target`).not.toBeNull();
    }
  });

  it("preserves focus for every system-driven transition", () => {
    for (const state of ALL_STATES) {
      const step = transition(
        nothing,
        { state, verdict: null, resolvedSha: "abc1234" },
        "system",
      );
      expect(
        step.focus,
        `${state} moved focus on a system transition`,
      ).toBeNull();
      expect(step.announcement).not.toBeNull();
    }
  });

  it("returns focus to the URL field when the URL was refused", () => {
    // AC-0109's focus half.
    expect(
      transition(
        nothing,
        { state: "url-rejected", verdict: null, resolvedSha: null },
        "user",
      ).focus,
    ).toBe("url-field");
  });

  it("moves focus to cancel when the in-flight disable takes the field", () => {
    // AC-0126. The field is disabled in both progress states, so both must.
    for (const state of ["resolving", "inspecting"] as const) {
      expect(
        transition(
          nothing,
          { state, verdict: null, resolvedSha: "abc1234" },
          "user",
        ).focus,
      ).toBe("cancel");
    }
  });

  it("puts the lead back at the field after they cancel", () => {
    // AC-0113: restarting begins at the URL field.
    expect(
      transition(
        { state: "inspecting", verdict: null, resolvedSha: "abc1234" },
        { state: "cancelled", verdict: null, resolvedSha: "abc1234" },
        "user",
      ).focus,
    ).toBe("url-field");
  });
});

describe("AC-0128 and AC-0158 exactly one announcement", () => {
  it("announces a state's own human label on entering it", () => {
    for (const state of ALL_STATES) {
      const step = transition(
        { state: null, verdict: null, resolvedSha: null },
        { state, verdict: null, resolvedSha: "abc1234def" },
        "system",
      );
      expect(step.announcement).toBe(stateLabel(state, "abc1234def"));
    }
  });

  it("announces nothing when the state did not change", () => {
    // The other half of "exactly one": a re-render is not a transition, and a
    // surface that announced on every render would announce many times for one.
    const at = {
      state: "inspecting",
      verdict: null,
      resolvedSha: "abc1234",
    } as const;
    expect(transition(at, at, "system").announcement).toBeNull();
    expect(transition(at, at, "user").announcement).toBeNull();
    expect(transition(at, at, "user").focus).toBeNull();
  });

  it("leads a result with the verdict's label where a verdict was reached", () => {
    const step = transition(
      { state: "inspecting", verdict: null, resolvedSha: "abc1234" },
      { state: "malformed", verdict: "agent-ready", resolvedSha: "abc1234" },
      "system",
    );
    expect(step.announcement).toBe("Agent-Ready");
  });

  it("leads with the condition's label where no verdict was reached", () => {
    // `no-verdict` is the absence of one, so the condition carries the result.
    const step = transition(
      { state: "inspecting", verdict: null, resolvedSha: "abc1234" },
      { state: "malformed", verdict: "no-verdict", resolvedSha: "abc1234" },
      "system",
    );
    expect(step.announcement).toBe("Workspace file is malformed");
  });
});
