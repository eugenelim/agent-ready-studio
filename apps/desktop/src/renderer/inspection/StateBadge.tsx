import type { StopReasonKey, UserVisibleState } from "@agent-ready/protocol";
import {
  SHAPES,
  stateLabel,
  VERDICT_SHAPES,
  type Verdict,
} from "./presentation.js";

/**
 * A state or verdict rendered as a shape *and* a text label, never as colour
 * alone. AC-0122 forbids hue as the only carrier and AC-0121 requires the
 * states to differ from one another in shape as well as label, so the shape
 * travels in `data-shape` where both the stylesheet and a test can read it.
 *
 * The glyph is `aria-hidden`: it is a second visual carrier for a sighted
 * reader, not a second thing for a screen reader to say. The label is the
 * accessible name, and announcing both would make AC-0128's "exactly one"
 * harder to hold for no gain.
 */
export function StateBadge({
  state,
  resolvedSha,
  emphasis,
  stopReason,
}: Readonly<{
  state: UserVisibleState;
  resolvedSha: string | null;
  /** Composed into the label, per AC-0088. */
  stopReason?: StopReasonKey | null;
  /**
   * Which composition role this badge occupies, per AC-0114. Named `emphasis`
   * rather than `role` because a prop called `role` lands on the element as
   * an ARIA role, and "primary" is not one. States take only these two: the
   * subordinate role belongs to a verdict under a degraded condition, and a
   * state never sits beneath another state.
   */
  emphasis: "primary" | "secondary";
}>) {
  return (
    <p
      className={`inspection-badge inspection-badge--${emphasis}`}
      data-state={state}
      data-shape={SHAPES[state]}
    >
      <span className="inspection-badge__shape" aria-hidden="true" />
      <span className="inspection-badge__label">
        {stateLabel(state, resolvedSha, stopReason)}
      </span>
    </p>
  );
}

/**
 * The verdict at whichever role the composition rule gives it. `no-verdict`
 * renders nothing here: it carries no label (AC-0157) and the condition holds
 * the primary role instead, so a badge would be an empty treatment claiming a
 * result that was not reached.
 */
export function VerdictBadge({
  verdict,
  label,
  emphasis,
}: Readonly<{
  verdict: Verdict;
  label: string;
  emphasis: "primary" | "subordinate";
}>) {
  return (
    <p
      className={`inspection-verdict inspection-verdict--${emphasis}`}
      data-verdict={verdict}
      data-shape={VERDICT_SHAPES[verdict] ?? "none"}
    >
      <span className="inspection-verdict__shape" aria-hidden="true" />
      <span className="inspection-verdict__label">{label}</span>
    </p>
  );
}
