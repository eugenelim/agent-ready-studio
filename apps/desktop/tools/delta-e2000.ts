/**
 * CIE ΔE2000 colour difference, and the reader that supplies it the renderer's
 * real hues.
 *
 * Nothing in this repository computed a colour difference before T14; this
 * module is the generator that discovery task opened. It exists so the
 * inspection-family hue separation can be *measured* rather than asserted by
 * eye.
 *
 * **It deliberately does not contain the bound.** The
 * *Inspection-family hue separation* row of the specification's *Canonical
 * values* is that value's one home. Restating it here would give it a second
 * home, and two homes drift. This module reports a distance and compares it to
 * nothing; AC-0120's assertion is what reads the bound from that row and
 * applies it.
 *
 * **Retiring condition.** Two circumstances retire this module rather than
 * amend it. First, the workspace admitting a maintained colour-difference
 * implementation: hand-rolled CIEDE2000 is justified only while the alternative
 * is a new dependency for the arithmetic a dependency would replace — `Lab`
 * through `hexDeltaE2000`, **118 non-blank, non-comment lines**, measured rather
 * than estimated because the cost argument rests on the figure. Second, `tokens.css`
 * ceasing to be the renderer's sole colour home — the design system's serialized
 * W3C token file becoming the source and CSS a projection of it — because
 * `readThemeHues` would then observe a generated artifact and report
 * confidently on the wrong one.
 */

/** CIE L*a*b* under the D65 illuminant, which is the space ΔE2000 is defined in. */
export interface Lab {
  readonly L: number;
  readonly a: number;
  readonly b: number;
}

/** D65 reference white, the illuminant sRGB itself is defined against. */
const WHITE_X = 0.95047;
const WHITE_Y = 1.0;
const WHITE_Z = 1.08883;

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function expandHex(hex: string): [number, number, number] {
  const body = hex.slice(1);
  const pairs =
    body.length === 3
      ? [body[0], body[0], body[1], body[1], body[2], body[2]].join("")
      : body;
  return [
    Number.parseInt(pairs.slice(0, 2), 16) / 255,
    Number.parseInt(pairs.slice(2, 4), 16) / 255,
    Number.parseInt(pairs.slice(4, 6), 16) / 255,
  ];
}

/** The sRGB transfer function, inverted: encoded channel to linear light. */
function toLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

/** The CIE L* companding function. */
function compand(ratio: number): number {
  return ratio > (6 / 29) ** 3
    ? Math.cbrt(ratio)
    : ratio / (3 * (6 / 29) ** 2) + 4 / 29;
}

/**
 * An sRGB hex colour as CIE L*a*b*. Accepts `#rgb` and `#rrggbb`, the two forms
 * `tokens.css` uses; anything else throws rather than being coerced, because a
 * colour this reader silently mis-parses becomes a separation measurement
 * nobody can trace back to a wrong input.
 */
export function hexToLab(hex: string): Lab {
  if (!HEX_COLOR.test(hex)) {
    throw new Error(`not an sRGB hex colour: ${hex}`);
  }
  const [r, g, b] = expandHex(hex).map(toLinear) as [number, number, number];

  const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = 0.0193339 * r + 0.119192 * g + 0.9503041 * b;

  const fx = compand(x / WHITE_X);
  const fy = compand(y / WHITE_Y);
  const fz = compand(z / WHITE_Z);

  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

const DEG = Math.PI / 180;
const POW25_7 = 25 ** 7;

function degrees(b: number, a: number): number {
  if (a === 0 && b === 0) {
    return 0;
  }
  const raw = Math.atan2(b, a) / DEG;
  return raw < 0 ? raw + 360 : raw;
}

/**
 * CIE ΔE2000 between two L*a*b* colours, with the parametric weighting factors
 * kL, kC and kH all at 1 — the unweighted form the *Canonical values* row means
 * by "units of CIE ΔE2000".
 *
 * The arithmetic follows Sharma, Wu and Dalal's formulation, whose published
 * test data `delta-e2000.test.ts` checks this against. That check is the point:
 * a colour-difference function's failure mode is returning a plausible number,
 * which no amount of reading the code detects.
 */
export function deltaE2000(one: Lab, two: Lab): number {
  const meanL = (one.L + two.L) / 2;

  const chroma1 = Math.hypot(one.a, one.b);
  const chroma2 = Math.hypot(two.a, two.b);
  const meanChroma = (chroma1 + chroma2) / 2;

  // The a* axis is stretched toward the neutral pole, which is what makes the
  // metric agree with observers on near-grey pairs.
  const stretch =
    0.5 * (1 - Math.sqrt(meanChroma ** 7 / (meanChroma ** 7 + POW25_7)));
  const a1 = one.a * (1 + stretch);
  const a2 = two.a * (1 + stretch);

  const primeChroma1 = Math.hypot(a1, one.b);
  const primeChroma2 = Math.hypot(a2, two.b);
  const meanPrimeChroma = (primeChroma1 + primeChroma2) / 2;

  const hue1 = degrees(one.b, a1);
  const hue2 = degrees(two.b, a2);
  const chromaProduct = primeChroma1 * primeChroma2;

  const deltaL = two.L - one.L;
  const deltaChroma = primeChroma2 - primeChroma1;

  let deltaHue: number;
  if (chromaProduct === 0) {
    deltaHue = 0;
  } else if (Math.abs(hue2 - hue1) <= 180) {
    deltaHue = hue2 - hue1;
  } else if (hue2 - hue1 > 180) {
    deltaHue = hue2 - hue1 - 360;
  } else {
    deltaHue = hue2 - hue1 + 360;
  }
  const deltaH = 2 * Math.sqrt(chromaProduct) * Math.sin((deltaHue * DEG) / 2);

  let meanHue: number;
  if (chromaProduct === 0) {
    meanHue = hue1 + hue2;
  } else if (Math.abs(hue1 - hue2) <= 180) {
    meanHue = (hue1 + hue2) / 2;
  } else if (hue1 + hue2 < 360) {
    meanHue = (hue1 + hue2 + 360) / 2;
  } else {
    meanHue = (hue1 + hue2 - 360) / 2;
  }

  const t =
    1 -
    0.17 * Math.cos((meanHue - 30) * DEG) +
    0.24 * Math.cos(2 * meanHue * DEG) +
    0.32 * Math.cos((3 * meanHue + 6) * DEG) -
    0.2 * Math.cos((4 * meanHue - 63) * DEG);

  const lightnessWeight =
    1 + (0.015 * (meanL - 50) ** 2) / Math.sqrt(20 + (meanL - 50) ** 2);
  const chromaWeight = 1 + 0.045 * meanPrimeChroma;
  const hueWeight = 1 + 0.015 * meanPrimeChroma * t;

  // Rotation term: blue hues need chroma and hue error traded off against each
  // other, and this is the only place the two interact.
  const rotation =
    -2 *
    Math.sqrt(meanPrimeChroma ** 7 / (meanPrimeChroma ** 7 + POW25_7)) *
    Math.sin(60 * Math.exp(-(((meanHue - 275) / 25) ** 2)) * DEG);

  const lightnessTerm = deltaL / lightnessWeight;
  const chromaTerm = deltaChroma / chromaWeight;
  const hueTerm = deltaH / hueWeight;

  return Math.sqrt(
    lightnessTerm ** 2 +
      chromaTerm ** 2 +
      hueTerm ** 2 +
      rotation * chromaTerm * hueTerm,
  );
}

/** ΔE2000 between two sRGB hex colours, the form `tokens.css` stores. */
export function hexDeltaE2000(one: string, two: string): number {
  return deltaE2000(hexToLab(one), hexToLab(two));
}

/**
 * The hues one theme declares: custom-property name to hex value.
 *
 * Two different exclusions, kept distinct because conflating them is how a
 * separation gate comes to measure a subset and pass. A property that is not a
 * colour — spacing, radius, a shadow — is **dropped**, because it was never a
 * hue and must not reach a colour-difference function. A property that *is*
 * named as a colour but whose value this reader cannot parse is **refused**,
 * because dropping it would hide a hue from the comparison while every other
 * check still passed. That is the same false-pass direction the both-blocks
 * obligation closes, on the value-form axis rather than the theme axis.
 *
 * The practical effect is a constraint on `tokens.css`: a `--color-*` token must
 * be an sRGB hex literal. An `rgb()`, `oklch()`, `color-mix()` or `var(--…)`
 * colour is not silently omitted — it stops the reader until either the token
 * or this reader is changed deliberately. **That holds wherever the token sits
 * in its block, terminated or not, and comments neither trigger the refusal nor
 * hide a token from it.**
 */
export type ThemeHues = ReadonlyMap<string, string>;

/**
 * Both theme blocks of a `tokens.css` source.
 *
 * AC-0120 binds in both themes, so a reader that returned only the root block
 * would let a separation arm observe half the hue set while satisfying every
 * other check. Both blocks are therefore returned together, and a source
 * missing either one throws.
 */
export interface ThemeBlocks {
  /** The `:root` block — the light theme. */
  readonly root: ThemeHues;
  /** The `:root` block inside `@media (prefers-color-scheme: dark)`. */
  readonly dark: ThemeHues;
}

/**
 * Reads the declaration block that starts at the first `:root {` at or after
 * `from`, by matching braces. A brace scan rather than a regex because the dark
 * theme's `:root` is nested inside an at-rule, and the pattern that reaches
 * inside it is the pattern that also runs past its end.
 */
function readRootBlock(
  source: string,
  from: number,
): { body: string; end: number } {
  const selector = source.indexOf(":root", from);
  if (selector === -1) {
    throw new Error("tokens source declares no `:root` block");
  }
  const open = source.indexOf("{", selector);
  if (open === -1) {
    throw new Error("`:root` selector is not followed by a block");
  }
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") {
      depth += 1;
    } else if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        return { body: source.slice(open + 1, index), end: index };
      }
    }
  }
  throw new Error("`:root` block is never closed");
}

/**
 * A custom-property declaration. The terminating `;` is optional because CSS
 * makes it optional on a block's final declaration — and a pattern that
 * required it would skip exactly that position, dropping the token silently
 * rather than refusing it. Round 5 found the reader doing precisely that, to a
 * valid hex token as well as an unparseable one.
 */
const CUSTOM_PROPERTY = /(--[a-z0-9-]+)\s*:\s*([^;]+?)\s*(?:;|$)/gi;

/**
 * CSS comments, removed before anything else looks at the source.
 *
 * Two distinct failures need this, not one. A comment can carry text that reads
 * as a declaration — a token commented out during design-system work is the
 * ordinary case — and matching inside it refuses a token that is not there. A
 * comment can also trail a real value, making `#176b52 /* brand *\/` fail a hex
 * test that the value itself passes. Both were live before round 5, and
 * `tokens.css` already carries comments inside `:root`, so neither was
 * hypothetical. Comments are also removed before brace matching, so a brace
 * inside a comment cannot end a block early.
 */
const CSS_COMMENT = /\/\*[\s\S]*?\*\//g;

function stripComments(cssSource: string): string {
  // A space, not an empty string: removing a comment between two tokens must
  // not join them into one.
  return cssSource.replace(CSS_COMMENT, " ");
}

/** A custom property this reader treats as declaring a hue. */
const COLOR_PROPERTY = /^--color-/;

function hues(body: string): ThemeHues {
  const found = new Map<string, string>();
  for (const [, name, rawValue] of body.matchAll(CUSTOM_PROPERTY)) {
    const value = (rawValue ?? "").trim();
    if (name === undefined) {
      continue;
    }
    if (HEX_COLOR.test(value)) {
      found.set(name, value.toLowerCase());
    } else if (COLOR_PROPERTY.test(name)) {
      throw new Error(
        `colour token ${name} is not an sRGB hex literal: ${value}`,
      );
    }
  }
  return found;
}

const DARK_AT_RULE = "@media (prefers-color-scheme: dark)";

export function readThemeHues(cssSource: string): ThemeBlocks {
  const source = stripComments(cssSource);
  const root = readRootBlock(source, 0);

  const darkAtRule = source.indexOf(DARK_AT_RULE, root.end);
  if (darkAtRule === -1) {
    throw new Error(`tokens source declares no ${DARK_AT_RULE} block`);
  }
  const dark = readRootBlock(source, darkAtRule);

  return { root: hues(root.body), dark: hues(dark.body) };
}
