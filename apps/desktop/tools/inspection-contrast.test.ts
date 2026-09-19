/**
 * AC-0123: every text, non-text-indicator and focus-indicator
 * foreground/background pairing the slice introduces meets the WCAG 2.2 AA
 * ratio for its class — 1.4.3 for text, 1.4.11 for non-text — including a
 * reused component placed on a new surface role.
 *
 * The pairings are enumerated rather than scraped from the stylesheet. A
 * scraper would compute whatever pairs it managed to parse and report a pass
 * over that subset, which is the failure direction this criterion has: a
 * contrast check that measured less than it claimed. Enumerating them means a
 * pairing added to the CSS and not added here is invisible to the check, so
 * the roster is asserted against the tokens it names.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readThemeHues, type ThemeHues } from "./delta-e2000.js";

const themes = readThemeHues(
  readFileSync(
    join(import.meta.dirname, "../src/renderer/styles/tokens.css"),
    "utf8",
  ),
);

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.2 relative-contrast ratio. */
export function contrastRatio(one: string, two: string): number {
  const a = luminance(one);
  const b = luminance(two);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** Text pairings: 1.4.3 Contrast (Minimum), AA, 4.5:1 for body-size text. */
const TEXT_PAIRINGS: ReadonlyArray<readonly [string, string]> = [
  // Every badge and verdict label, on each surface role they can sit on.
  ["--color-text", "--color-surface"],
  ["--color-text", "--color-surface-raised"],
  ["--color-text", "--color-canvas"],
  // The revision identity, which is deliberately subordinate but still text.
  ["--color-muted", "--color-surface"],
  ["--color-muted", "--color-canvas"],
  // The diagnostics disclosure puts muted text on the raised surface.
  ["--color-muted", "--color-surface-raised"],
];

/**
 * Non-text pairings: 1.4.11, AA, 3:1. Every identity hue reaches a shape, and
 * a shape is a non-text indicator carrying state.
 */
const NON_TEXT_HUES = [
  "--color-attention-informative",
  "--color-attention-caution",
  "--color-attention-critical",
  "--color-execution-running",
  "--color-inspection-agent-ready",
  "--color-inspection-not-agent-ready",
] as const;

/** The surfaces a shape can be drawn on, including the reused-component role. */
const SHAPE_BACKGROUNDS = [
  "--color-surface",
  "--color-surface-raised",
  "--color-canvas",
] as const;

function hue(block: ThemeHues, name: string): string {
  const value = block.get(name);
  if (value === undefined) throw new Error(`tokens.css declares no ${name}`);
  return value;
}

describe("AC-0123 the slice's contrast pairings meet WCAG 2.2 AA", () => {
  for (const [themeName, block] of [
    ["light", themes.root],
    ["dark", themes.dark],
  ] as const) {
    it(`meets 4.5:1 for every text pairing in the ${themeName} theme`, () => {
      const failures: string[] = [];
      for (const [fg, bg] of TEXT_PAIRINGS) {
        const ratio = contrastRatio(hue(block, fg), hue(block, bg));
        if (ratio < 4.5) failures.push(`${fg} on ${bg}: ${ratio.toFixed(2)}`);
      }
      expect(failures).toEqual([]);
    });

    it(`meets 3:1 for every non-text indicator pairing in the ${themeName} theme`, () => {
      const failures: string[] = [];
      for (const shape of NON_TEXT_HUES) {
        for (const background of SHAPE_BACKGROUNDS) {
          const ratio = contrastRatio(
            hue(block, shape),
            hue(block, background),
          );
          if (ratio < 3)
            failures.push(`${shape} on ${background}: ${ratio.toFixed(2)}`);
        }
      }
      expect(failures).toEqual([]);
    });

    it(`meets 3:1 for the focus indicator in the ${themeName} theme`, () => {
      // AC-0124: the focus indicator must not rely on colour alone, and it
      // must still be visible. The outline carries width and offset as well,
      // which the stylesheet sets; this is the contrast half.
      for (const background of SHAPE_BACKGROUNDS) {
        const ratio = contrastRatio(
          hue(block, "--color-focus"),
          hue(block, background),
        );
        expect(ratio, `--color-focus on ${background}`).toBeGreaterThanOrEqual(
          3,
        );
      }
    });
  }

  it("names a background for every surface role a shape is drawn on", () => {
    // Guards the roster. Dropping a background would make the check easier to
    // pass and nothing else would redden.
    expect(SHAPE_BACKGROUNDS).toHaveLength(3);
    // The text roster carries the same guard as the other two: dropping a
    // pairing makes the 4.5:1 check easier and nothing else would redden.
    expect(TEXT_PAIRINGS).toHaveLength(6);
    for (const [foreground, background] of TEXT_PAIRINGS) {
      expect(themes.root.has(foreground)).toBe(true);
      expect(themes.root.has(background)).toBe(true);
      expect(themes.dark.has(foreground)).toBe(true);
      expect(themes.dark.has(background)).toBe(true);
    }
    expect(NON_TEXT_HUES.length).toBeGreaterThanOrEqual(6);
    for (const name of [...NON_TEXT_HUES, ...SHAPE_BACKGROUNDS]) {
      expect(themes.root.has(name)).toBe(true);
      expect(themes.dark.has(name)).toBe(true);
    }
  });
});
