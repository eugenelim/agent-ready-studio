/**
 * Everything the inspection surfaces need to render a state honestly, derived
 * once so no surface can answer these questions differently.
 *
 * The labels and attention come from `@agent-ready/protocol`'s
 * `state-vocabulary`, which is the spec's tables in code. They are imported
 * rather than restated: a second copy would let the renderer drift from the
 * projection the service answers with, and the surface would then be honest
 * about a state the service no longer reports. They live in the protocol
 * package because `AGENTS.md` forbids renderer production code from importing
 * the Studio Service, and both sides need them.
 *
 * Three obligations are discharged here rather than in a component, because
 * each is stated over *every* transition and a per-component answer could
 * satisfy it on the surfaces that were written and miss the next one.
 *
 * - AC-0121 and AC-0122: every state differs in shape and in label, and is
 *   never carried by hue alone. `SHAPES` is total over the eleven states, and
 *   its values are distinct.
 * - AC-0125: one focus-management path, branching on provenance. `transition`
 *   is that path. A user-initiated transition names an element to focus; a
 *   system-driven one names none and preserves focus.
 * - AC-0128 and AC-0158: exactly one polite announcement per transition, using
 *   the state's human label — or, entering a result, the verdict's label where
 *   a verdict was reached and the condition's where it was not.
 */
import {
  project,
  USER_VISIBLE_STATES,
  type UserVisibleState,
} from "@agent-ready/protocol";

export type Verdict = "agent-ready" | "not-agent-ready" | "no-verdict";

/**
 * The *Verdict axis* human labels. `no-verdict` carries none, which AC-0157
 * excludes explicitly: the composition rule gives the condition the primary
 * role in that case, so there is nothing for a verdict label to say.
 */
export const VERDICT_LABELS: Readonly<Record<Verdict, string | null>> =
  Object.freeze({
    "agent-ready": "Agent-Ready",
    "not-agent-ready": "Not Agent-Ready",
    "no-verdict": null,
  });

/**
 * A shape per state, carried in `data-shape` and drawn as an `aria-hidden`
 * glyph beside the label. Shape rather than colour because AC-0122 forbids hue
 * as the only carrier, and AC-0121 requires the states to differ from one
 * another in shape *or* icon independently of hue — so these must be distinct.
 */
export const SHAPES: Readonly<Record<UserVisibleState, string>> = Object.freeze(
  {
    malformed: "broken-square",
    "inspector-unavailable": "octagon-cross",
    "source-unavailable": "cloud-slash",
    "source-rate-limited": "hourglass",
    "inspection-stopped": "square-stop",
    cancelled: "circle-slash",
    incomplete: "dashed-circle",
    unconnected: "plug",
    "url-rejected": "triangle-exclaim",
    resolving: "arrow-loop",
    inspecting: "magnifier",
  },
);

/** The verdicts' own shapes, which are not state shapes and never collide. */
export const VERDICT_SHAPES: Readonly<Record<Verdict, string | null>> =
  Object.freeze({
    "agent-ready": "check-badge",
    "not-agent-ready": "cross-badge",
    "no-verdict": null,
  });

/**
 * `inspecting`'s label carries the short SHA, which is the one label in the
 * table with a placeholder. Substituting it here keeps every caller —
 * rendering and announcing alike — on the same string.
 */
export function stateLabel(
  state: UserVisibleState,
  resolvedSha: string | null,
): string {
  const label = project({ state }).label;
  if (state !== "inspecting") return label;
  const short = resolvedSha === null ? "" : resolvedSha.slice(0, 7);
  return short === "" ? "Inspecting" : label.replace("<short-sha>", short);
}

export type FocusTarget = "url-field" | "cancel" | "result" | null;

export interface SurfaceSnapshot {
  /** The user-visible state the surface is showing, or null before any. */
  readonly state: UserVisibleState | null;
  /** The verdict, where the result carries one. */
  readonly verdict: Verdict | null;
  readonly resolvedSha: string | null;
  /**
   * What distinguishes two visits to the same state -- the refusal reason, or
   * the diagnostic. Two different bad URLs both land on `url-rejected`, and
   * without this the second is "no change": nothing is announced, and a polite
   * region does not re-read text that merely changed underneath it.
   */
  readonly detail?: string | null;
}

export interface Transition {
  /** The one announcement this transition makes, or null when it makes none. */
  readonly announcement: string | null;
  /** Where focus goes, or null to preserve it. */
  readonly focus: FocusTarget;
  readonly provenance: "user" | "system";
}

/**
 * Whether entering this state is a result rather than progress. A result is
 * where AC-0158 applies: the verdict's label leads when one was reached.
 */
const IS_RESULT: Readonly<Record<UserVisibleState, boolean>> = Object.freeze({
  malformed: true,
  "inspector-unavailable": true,
  "source-unavailable": true,
  "source-rate-limited": true,
  "inspection-stopped": true,
  cancelled: true,
  incomplete: true,
  unconnected: false,
  "url-rejected": false,
  resolving: false,
  inspecting: false,
});

/**
 * The single focus-management path. Every transition the slice introduces
 * routes through it, which is what makes AC-0125's coverage exhaustive rather
 * than a per-surface promise.
 *
 * `provenance` is the branch the criterion names. A transition the lead caused
 * — submitting, cancelling, being refused — places focus on a named element. A
 * transition the system caused — resolving finishing, an inspection returning —
 * preserves focus and announces only, because moving focus under someone who is
 * reading elsewhere is the behaviour that makes a live region necessary.
 */
export function transition(
  previous: SurfaceSnapshot,
  next: SurfaceSnapshot,
  provenance: "user" | "system",
): Transition {
  // A result whose condition is `ok` carries no user-visible state at all --
  // `ok` is the absence of condition chrome -- so "the state changed" is not
  // the whole test. A verdict arriving is a transition into a result even when
  // no state accompanies it, and AC-0158 requires that one to announce.
  const changed =
    next.state !== previous.state ||
    next.verdict !== previous.verdict ||
    (next.detail ?? null) !== (previous.detail ?? null);
  if (!changed) {
    // A re-render is not a transition. Without this an unrelated render would
    // announce the state the lead is already on.
    return { announcement: null, focus: null, provenance };
  }

  const isResult =
    next.verdict !== null || (next.state !== null && IS_RESULT[next.state]);
  const announcement = isResult
    ? resultAnnouncement(next)
    : next.state === null
      ? null
      : stateLabel(next.state, next.resolvedSha);
  if (announcement === null) {
    return { announcement: null, focus: null, provenance };
  }

  if (provenance === "system") {
    return { announcement, focus: null, provenance };
  }

  // AC-0109 returns focus to the field it invalidated; AC-0126 moves focus to
  // cancel when the in-flight disable takes it off that field; AC-0113 puts the
  // lead back where restarting begins.
  const focus: FocusTarget =
    next.state === "url-rejected"
      ? "url-field"
      : next.state === "resolving" || next.state === "inspecting"
        ? "cancel"
        : next.state === "cancelled"
          ? "url-field"
          : "result";

  return { announcement, focus, provenance };
}

/**
 * AC-0158: the verdict's label where a verdict was reached, the condition's
 * where it was not. `no-verdict` is "not reached" — it is the absence of one,
 * which is why AC-0157 gives it no label to announce.
 */
function resultAnnouncement(next: SurfaceSnapshot): string {
  const verdictLabel =
    next.verdict === null ? null : VERDICT_LABELS[next.verdict];
  if (verdictLabel !== null && verdictLabel !== undefined) return verdictLabel;
  return next.state === null ? "" : stateLabel(next.state, next.resolvedSha);
}

/** Every state the surface can show, for the tests that must be total. */
export const ALL_STATES: readonly UserVisibleState[] = USER_VISIBLE_STATES;
