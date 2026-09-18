/**
 * The inline proof T14's *Inline proof for risky mechanisms* rule requires of
 * the ΔE2000 arm. A colour-difference function has a consequential false-pass
 * direction: it returns a number, the number looks plausible, and a separation
 * gate built on it passes forever. So this file does four specific things
 * rather than exercising the happy path.
 *
 * 1. **Discriminating positive and consequential negative.** The positive is
 *    the proposal-versus-accepted border pair, two real artifact-state identity
 *    hues that a separation bound must clear. The negative is the dark theme's
 *    accepted surface against the base surface it sits on — a pair the design
 *    treats as distinguishable and that measures 10.29, which is the case that
 *    would matter if a broken arm admitted it.
 * 2. **Neutralising the arm reddens a named case.** Seven neutralisations were
 *    run and their results recorded at
 *    `notes/verification-ledger.md#t14-evidence`. Making `deltaE2000` return a
 *    constant 100 reddens *reports the dark accepted surface as close to the
 *    base surface it sits on*, *separates the proposal and accepted border hues
 *    in both themes*, *reproduces Sharma, Wu and Dalal's published CIEDE2000
 *    test data* and *treats the three-digit and six-digit hex forms as the same
 *    colour*. A constant 0 reddens the first three of those. Making
 *    `readThemeHues` return the root block as both themes reddens exactly
 *    *reads the hues of both theme blocks of the shipped tokens.css* — the
 *    mutation the both-blocks obligation exists to catch. Swapping the D65
 *    white point for D50 reddens *converts the sRGB primaries to their
 *    published D65 L*a*b* values*, which is what makes that case a pin on the
 *    conversion rather than a restatement of this code's own output. Turning the
 *    unparseable-colour refusal back into a silent drop reddens exactly *refuses
 *    a colour token whose value it cannot parse* — the case round 4 added, after
 *    a reviewer found that a `--color-*` token written as `rgb()` or `oklch()`
 *    would have been omitted from the comparison with nothing failing. Round 5
 *    then found that refusal incomplete and over-broad, so two further
 *    neutralisations pin its repairs: requiring the terminating semicolon again
 *    reddens *reaches a final declaration written without its optional
 *    semicolon*, and removing comment stripping reddens *ignores CSS comments
 *    rather than reading declarations out of them*.
 * 3. **The real entry path.** *reads the hues of both theme blocks of the
 *    shipped tokens.css* reads the file the renderer actually loads, off disk,
 *    and observes both theme blocks — not a fixture, and not the root block
 *    twice.
 * 4. **The retiring condition** is stated on the module, not here, because it
 *    retires the mechanism rather than the test.
 *
 * Neither file states the bound or compares anything to it. The specification's
 * *Canonical values* row is its one home, and AC-0120's assertion is what reads
 * it. The positive and negative below therefore assert measured magnitudes, not
 * a pass against a threshold.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  deltaE2000,
  hexDeltaE2000,
  hexToLab,
  type Lab,
  readThemeHues,
} from "./delta-e2000.js";

/** A minimal dark block, so a case about the root block says only that. */
const DARK_BLOCK =
  "@media (prefers-color-scheme: dark) { :root { --color-accent: #69c7a4; } }";

/** The `tokens.css` the renderer loads, not a copy of it. */
const TOKENS_PATH = fileURLToPath(
  new URL("../src/renderer/styles/tokens.css", import.meta.url),
);

function lab(L: number, a: number, b: number): Lab {
  return { L, a, b };
}

/**
 * Sharma, Wu and Dalal's published CIEDE2000 test data — rows chosen to reach
 * the formulation's discontinuities rather than to sample it evenly: the
 * blue-hue rotation term, both hue-arc wraparound branches, a chroma product of
 * zero, and the near-black corner where the lightness weighting is at its most
 * extreme. Which branch each row takes was instrumented rather than assumed;
 * the `-360` wraparound is reached by exactly one row, noted where it appears.
 */
const REFERENCE_DATA: ReadonlyArray<readonly [Lab, Lab, number]> = [
  [lab(50, 2.6772, -79.7751), lab(50, 0, -82.7485), 2.0425],
  [lab(50, 3.1571, -77.2803), lab(50, 0, -82.7485), 2.8615],
  [lab(50, 2.8361, -74.02), lab(50, 0, -82.7485), 3.4412],
  [lab(50, -1.3802, -84.2814), lab(50, 0, -82.7485), 1.0],
  [lab(50, 0, 0), lab(50, -1, 2), 2.3669],
  [lab(50, 2.49, -0.001), lab(50, -2.49, 0.0009), 7.1792],
  // The adjacent published row, included because it is the only one that
  // reaches the `(hue1 + hue2 - 360) / 2` mean-hue branch: it pairs a hue
  // separation over 180° with a hue sum at or above 360°. Its neighbour above
  // differs in b* by 0.0002 and sits on the near side of that boundary, so
  // without this row the branch is never taken and the wraparound the pair was
  // published to straddle goes untested.
  [lab(50, 2.49, -0.001), lab(50, -2.49, 0.0011), 7.2195],
  [lab(50, 2.5, 0), lab(50, 0, -2.5), 4.3065],
  [lab(50, 2.5, 0), lab(73, 25, -18), 27.1492],
  [lab(50, 2.5, 0), lab(61, -5, 29), 22.8977],
  [lab(50, 2.5, 0), lab(56, -27, -3), 31.903],
  [lab(50, 2.5, 0), lab(58, 24, 15), 19.4535],
  [lab(60.2574, -34.0099, 36.2677), lab(60.4626, -34.1751, 39.4387), 1.2644],
  [lab(63.0109, -31.0961, -5.8663), lab(62.8187, -29.7946, -4.0864), 1.263],
  [lab(22.7233, 20.0904, -46.694), lab(23.0331, 14.973, -42.5619), 2.0373],
  [lab(90.8027, -2.0831, 1.441), lab(91.1528, -1.6435, 0.0447), 1.4441],
  [lab(2.0776, 0.0795, -1.135), lab(0.9033, -0.0636, -0.5514), 0.9082],
];

describe("ΔE2000 generator", () => {
  it("reproduces Sharma, Wu and Dalal's published CIEDE2000 test data", () => {
    for (const [one, two, expected] of REFERENCE_DATA) {
      expect(deltaE2000(one, two)).toBeCloseTo(expected, 4);
    }
  });

  it("converts the sRGB primaries to their published D65 L*a*b* values", () => {
    // The reference rows above are Lab-to-Lab: they pin the metric and say
    // nothing about the conversion that feeds it. Without this case every
    // assertion reaching `hexToLab` would compare against a magnitude this
    // implementation itself produced, so a systematically wrong matrix or white
    // point would have produced different pins and still passed. These five are
    // externally published values, not measurements taken from this code.
    const published: ReadonlyArray<readonly [string, Lab]> = [
      ["#ffffff", lab(100, 0, 0)],
      ["#000000", lab(0, 0, 0)],
      ["#ff0000", lab(53.2408, 80.0925, 67.2032)],
      ["#00ff00", lab(87.7347, -86.1827, 83.1793)],
      ["#0000ff", lab(32.297, 79.1875, -107.8602)],
    ];
    for (const [hex, expected] of published) {
      const got = hexToLab(hex);
      expect(got.L).toBeCloseTo(expected.L, 3);
      expect(got.a).toBeCloseTo(expected.a, 3);
      expect(got.b).toBeCloseTo(expected.b, 3);
    }
  });

  it("is symmetric, which the metric's definition requires", () => {
    for (const [one, two] of REFERENCE_DATA) {
      expect(deltaE2000(one, two)).toBeCloseTo(deltaE2000(two, one), 10);
    }
  });

  it("separates the proposal and accepted border hues in both themes", () => {
    // The discriminating positive: two artifact-state identity hues that are
    // deliberately different colours, measured in each theme's own values.
    expect(hexDeltaE2000("#76509a", "#357a54")).toBeCloseTo(40.389, 2);
    expect(hexDeltaE2000("#c7a5e8", "#83c9a1")).toBeCloseTo(37.967, 2);
  });

  it("reports the dark accepted surface as close to the base surface it sits on", () => {
    // The consequential negative. `--color-accepted-surface` and
    // `--color-surface` are both real dark-theme hues, and the design means them
    // to be distinguishable — yet they measure 10.29, a small fraction of the
    // range the positive above spans. An arm that reported these as well
    // separated would report anything as well separated.
    expect(hexDeltaE2000("#17201c", "#183528")).toBeCloseTo(10.29, 2);
    expect(hexDeltaE2000("#17201c", "#183528")).toBeLessThan(
      hexDeltaE2000("#c7a5e8", "#83c9a1"),
    );
  });

  it("reads the hues of both theme blocks of the shipped tokens.css", () => {
    const blocks = readThemeHues(readFileSync(TOKENS_PATH, "utf8"));

    // Both artifact-state families are materialized in both themes. This is the
    // whole reason the reader must reach the dark block: AC-0120 binds there
    // too, and these values are not the light ones.
    const identityHues = [
      "--color-proposal-surface",
      "--color-proposal-border",
      "--color-accepted-surface",
      "--color-accepted-border",
    ];
    for (const name of identityHues) {
      expect(blocks.root.get(name)).toMatch(/^#[0-9a-f]{6}$/);
      expect(blocks.dark.get(name)).toMatch(/^#[0-9a-f]{6}$/);
      expect(blocks.dark.get(name)).not.toBe(blocks.root.get(name));
    }

    // Two distinct blocks were read, not the root block twice. The dark theme
    // redeclares every one of the root theme's hues — the roles are preserved
    // across themes rather than inverted — and no redeclared value repeats its
    // light counterpart, so a reader that had returned the root block twice
    // would fail here on its first entry.
    expect([...blocks.dark.keys()].sort()).toEqual(
      [...blocks.root.keys()].sort(),
    );
    for (const [name, value] of blocks.dark) {
      expect(value).not.toBe(blocks.root.get(name));
    }

    // Non-colour tokens never reach a colour-difference function. `--space-1`
    // and `--control-height` are declared in the same block and are absent.
    for (const [, value] of blocks.root) {
      expect(value).toMatch(/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/);
    }
    expect(blocks.root.has("--space-1")).toBe(false);
    expect(blocks.root.has("--control-height")).toBe(false);
  });

  it("refuses a tokens source that declares no dark theme block", () => {
    // The reader's own false-pass direction. A source with only a `:root` block
    // parses perfectly and would let a separation arm observe half the hue set.
    expect(() => readThemeHues(":root { --color-accent: #176b52; }")).toThrow(
      /prefers-color-scheme: dark/,
    );
  });

  it("refuses a colour token whose value it cannot parse", () => {
    // The third false-pass direction, and the one a structural check misses
    // entirely: the source parses, both blocks are found, and a hue is simply
    // absent from the comparison. Dropping it would let AC-0120's gate measure a
    // subset and pass. The refusal is by property name rather than by guessing
    // at value syntax, so it covers any value form; the two cases below cover
    // the positions and comment forms round 5 found it was missing.
    for (const value of [
      "rgb(23 32 28)",
      "oklch(0.62 0.13 164)",
      "color-mix(in srgb, #176b52 40%, white)",
      "var(--color-accent)",
    ]) {
      expect(() =>
        readThemeHues(
          `:root { --color-inspection-surface: ${value}; }` +
            "@media (prefers-color-scheme: dark) { :root { --color-accent: #69c7a4; } }",
        ),
      ).toThrow(/colour token --color-inspection-surface is not an sRGB hex/);
    }
  });

  it("drops a non-colour token rather than refusing it", () => {
    // The distinction the refusal above depends on. A spacing or shadow token
    // was never a hue, so it is excluded silently; only a `--color-*` token
    // stops the reader. Conflating the two would make the reader throw on every
    // real tokens.css.
    const blocks = readThemeHues(
      ":root { --space-1: 0.25rem; --shadow-raised: 0 1px 2px rgb(0 0 0 / 8%);" +
        " --color-accent: #176b52; }" +
        "@media (prefers-color-scheme: dark) { :root { --color-accent: #69c7a4; } }",
    );
    expect([...blocks.root.keys()]).toEqual(["--color-accent"]);
  });

  it("reaches a final declaration written without its optional semicolon", () => {
    // Round 5 found the declaration pattern requiring a terminating `;`, which
    // CSS makes optional on a block's last declaration — so a token in exactly
    // that position never matched at all. Both halves of the consequence are
    // pinned here: an unparseable colour is refused rather than dropped, and a
    // valid hex one is returned rather than lost. The second was the quieter
    // failure, because nothing anywhere would have reported it.
    expect(() =>
      readThemeHues(
        ":root { --color-accent: #176b52;" +
          " --color-inspection-surface: oklch(0.62 0.13 164) }" +
          DARK_BLOCK,
      ),
    ).toThrow(/colour token --color-inspection-surface/);

    const blocks = readThemeHues(
      ":root { --color-accent: #176b52; --color-inspection-surface: #aabbcc }" +
        DARK_BLOCK,
    );
    expect(blocks.root.get("--color-inspection-surface")).toBe("#aabbcc");
  });

  it("ignores CSS comments rather than reading declarations out of them", () => {
    // The refusal added in round 4 threw on two legal forms until round 5: a
    // token commented out — ordinary during the design-system work that mints
    // the inspection family — and a hex value carrying a trailing comment. The
    // shipped `tokens.css` already has comments inside `:root`, so this was
    // never hypothetical. A brace inside a comment must not end a block early
    // either, which is why comments are stripped before the braces are matched.
    const commentedOut = readThemeHues(
      ":root { /* --color-old: oklch(0.6 0.1 20); */ --color-accent: #176b52; }" +
        DARK_BLOCK,
    );
    expect([...commentedOut.root.keys()]).toEqual(["--color-accent"]);

    const annotated = readThemeHues(
      `:root { --color-accent: #176b52 /* brand */; }${DARK_BLOCK}`,
    );
    expect(annotated.root.get("--color-accent")).toBe("#176b52");

    const bracedComment = readThemeHues(
      ":root { /* a } brace */ --color-accent: #176b52; --color-b: #010203; }" +
        DARK_BLOCK,
    );
    expect([...bracedComment.root.keys()]).toEqual([
      "--color-accent",
      "--color-b",
    ]);
  });

  it("refuses a tokens source whose `:root` block is never closed", () => {
    expect(() => readThemeHues(":root { --color-accent: #176b52;")).toThrow(
      /never closed/,
    );
  });

  it("refuses a value that is not an sRGB hex colour", () => {
    expect(() => hexToLab("rebeccapurple")).toThrow(/not an sRGB hex colour/);
    expect(() => hexToLab("#12345")).toThrow(/not an sRGB hex colour/);
  });

  it("treats the three-digit and six-digit hex forms as the same colour", () => {
    expect(hexDeltaE2000("#fff", "#ffffff")).toBe(0);
  });
});
