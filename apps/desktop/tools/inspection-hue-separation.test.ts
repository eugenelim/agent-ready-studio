/**
 * AC-0120: the inspection family's identity hues differ from the identity hues
 * of the artifact, review, execution and attention families by at least the
 * *Inspection-family hue separation* bound, in both themes.
 *
 * The bound lives in the spec's *Canonical values* row and nowhere else. It is
 * restated here as a literal because a test that imported it from the tool
 * would pass whatever the tool said; `apps/desktop/tools/delta-e2000.ts`
 * deliberately contains no bound for that reason.
 *
 * The comparison set is the design-system durable output's enumeration
 * (docs/product/design-system.md, "Product state vocabulary"), listed here in
 * full rather than derived by prefix. A prefix scan would silently shrink if a
 * token were renamed, and this criterion's failure direction is a comparison
 * that passes because it measured against less than it claimed.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hexDeltaE2000, readThemeHues, type ThemeHues } from "./delta-e2000.js";

/** *Inspection-family hue separation*, `docs/specs/connect-and-orient/spec.md`. */
const SEPARATION = 20;

const COMPARISON_MEMBERS = [
  "--color-artifact-draft",
  "--color-artifact-proposed",
  "--color-artifact-accepted",
  "--color-artifact-rejected",
  "--color-artifact-superseded",
  "--color-review-decision-needed",
  "--color-review-revision-requested",
  "--color-review-resolved",
  "--color-execution-queued",
  "--color-execution-running",
  "--color-execution-completed",
  "--color-execution-failed",
  "--color-attention-informative",
  "--color-attention-caution",
  "--color-attention-critical",
] as const;

const INSPECTION_MEMBERS = [
  "--color-inspection-agent-ready",
  "--color-inspection-not-agent-ready",
  "--color-inspection-no-verdict",
] as const;

const themes = readThemeHues(
  readFileSync(
    join(import.meta.dirname, "../src/renderer/styles/tokens.css"),
    "utf8",
  ),
);

function hue(block: ThemeHues, name: string): string {
  const value = block.get(name);
  if (value === undefined) {
    throw new Error(`tokens.css declares no ${name}`);
  }
  return value;
}

describe("AC-0120 inspection-family hue separation", () => {
  for (const [themeName, block] of [
    ["light", themes.root],
    ["dark", themes.dark],
  ] as const) {
    it(`separates every inspection hue from every state hue in the ${themeName} theme`, () => {
      const violations: string[] = [];
      let closest = Number.POSITIVE_INFINITY;
      let closestPair = "";
      for (const inspection of INSPECTION_MEMBERS) {
        for (const member of COMPARISON_MEMBERS) {
          const measured = hexDeltaE2000(
            hue(block, inspection),
            hue(block, member),
          );
          if (measured < closest) {
            closest = measured;
            closestPair = `${inspection} vs ${member}`;
          }
          if (measured < SEPARATION) {
            violations.push(
              `${inspection} vs ${member}: ${measured.toFixed(3)}`,
            );
          }
        }
      }
      // The margin is reported on success too: a bound cleared by 0.1 and one
      // cleared by 15 are different facts about the palette, and only one of
      // them survives an unrelated token edit.
      expect(
        violations,
        `closest pair ${closestPair} at ${closest.toFixed(3)}`,
      ).toEqual([]);
    });
  }

  it("compares every enumerated member, and the roster matches the tokens", () => {
    // Guards the comparison set itself. Without this, dropping a member from
    // COMPARISON_MEMBERS would make the separation easier to clear and nothing
    // would redden -- the criterion measuring less than it claims.
    expect(COMPARISON_MEMBERS).toHaveLength(15);
    expect(INSPECTION_MEMBERS).toHaveLength(3);
    for (const name of [...COMPARISON_MEMBERS, ...INSPECTION_MEMBERS]) {
      expect(
        themes.root.has(name),
        `${name} missing from the light theme`,
      ).toBe(true);
      expect(themes.dark.has(name), `${name} missing from the dark theme`).toBe(
        true,
      );
    }
  });
});
