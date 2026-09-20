import {
  project,
  type StopReasonKey,
  type UserVisibleState,
} from "@agent-ready/protocol";
import type { ReactNode } from "react";
import { VERDICT_LABELS, type Verdict } from "./presentation.js";
import { StateBadge, VerdictBadge } from "./StateBadge.js";

/**
 * The verdict surface, composed by the spec's composition rule rather than by
 * layout convenience.
 *
 * The rule: the verdict owns the primary role whenever one was reached; the
 * condition owns the state treatment at the secondary role directly above it;
 * and when the verdict is `no-verdict` the condition takes the primary role,
 * because there is nothing else to show.
 *
 * AC-0119 is why the verdict keeps its own identity treatment when it sits
 * under a degraded condition. Dropping to a neutral treatment there would be a
 * generic success treatment by omission, and the criterion says so explicitly:
 * a verdict at the subordinate role keeps its identity and does not violate it.
 */
export function VerdictSurface({
  verdict,
  condition,
  versionUnverified,
  owner,
  repository,
  resolvedSha,
  inspectedAt,
  diagnostics,
  stopReason,
  waitWindow,
  secondaryDiagnostic,
}: Readonly<{
  verdict: Verdict;
  /** The condition, or null when it is `ok` and carries no chrome. */
  condition: UserVisibleState | null;
  versionUnverified: boolean;
  owner: string;
  repository: string;
  resolvedSha: string | null;
  /**
   * When the inspection that produced this result completed, as an instant.
   * Required rather than optional: every producer supplies it unconditionally,
   * and omitting it at a call site is the wiring gap this field exists to
   * close -- a required prop makes that omission a typecheck failure instead
   * of something only one test happens to catch.
   */
  inspectedAt: string | null;
  diagnostics: string;
  /** Which reason stopped it, where the condition is `inspection-stopped`. */
  stopReason?: StopReasonKey | null;
  waitWindow?: string | null;
  secondaryDiagnostic?: string | null;
}>) {
  const verdictLabel = VERDICT_LABELS[verdict];
  const verdictLeads = verdictLabel !== null;

  return (
    <section className="verdict-surface" aria-labelledby="verdict-heading">
      <h2 id="verdict-heading">Inspection result</h2>

      {verdictLeads ? (
        <>
          <VerdictBadge
            verdict={verdict}
            label={verdictLabel}
            emphasis="primary"
          />
          {condition !== null && (
            <StateBadge
              state={condition}
              resolvedSha={resolvedSha}
              emphasis="secondary"
              stopReason={stopReason}
            />
          )}
        </>
      ) : (
        // `no-verdict`: the condition takes the primary role. No verdict badge
        // is rendered at all -- an empty one would claim a result that was not
        // reached, and AC-0157 gives this verdict no label to carry.
        condition !== null && (
          <StateBadge
            state={condition}
            resolvedSha={resolvedSha}
            emphasis="primary"
            stopReason={stopReason}
          />
        )
      )}

      {versionUnverified && (
        // Orthogonal to both axes, so it composes with whatever was reached
        // rather than replacing it.
        <p
          className="verdict-surface__qualifier"
          data-qualifier="version-unverified"
        >
          Version Studio cannot confirm
        </p>
      )}

      {/*
        AC-0114: the revision identity takes the highest provenance role and is
        subordinate to whichever element holds the primary role. Every value
        here is non-originated, and each is rendered as a text child -- never a
        URL, never a navigation target, which is AC-0116.
      */}
      <dl className="verdict-surface__identity">
        <dt>Repository</dt>
        <dd data-identity="repository">
          {owner}/{repository}
        </dd>
        <dt>Commit</dt>
        <dd data-identity="resolved-sha">{resolvedSha ?? "not resolved"}</dd>
        <dt>Inspected</dt>
        <dd data-identity="inspected-at">{inspectedLabel(inspectedAt)}</dd>
      </dl>

      {condition === "cancelled" && (
        // AC-0113. `cancelled` is not a degraded condition, so ConditionDetail
        // renders nothing for it and the badge alone would read "Cancelled"
        // with no author and no way forward.
        <div className="verdict-surface__detail" data-state-detail="cancelled">
          <p>You stopped this inspection, so Studio did not finish it.</p>
          <p>
            To start again, enter the repository URL and choose Connect
            repository. Nothing was written to the repository.
          </p>
        </div>
      )}

      {condition !== null && (
        <ConditionDetail
          condition={condition}
          stopReason={stopReason ?? null}
          waitWindow={waitWindow ?? null}
        />
      )}

      <DiagnosticsDisclosure
        diagnostics={diagnostics}
        secondaryDiagnostic={secondaryDiagnostic ?? null}
      />
    </section>
  );
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * AC-0103. The instant the result was inspected, rendered in UTC from an
 * explicit table rather than through `Intl`.
 *
 * The lead reads this to decide whether a restored verdict is still worth
 * trusting, so it has to mean the same thing on every host. `Intl` month
 * abbreviations move with the host's ICU version -- en-GB renders September as
 * "Sept" on this Node and "Sep" on others -- which would make the displayed
 * text a property of the machine. The pinned-rendering rule AC-0159 applies to
 * the liveness marker is the same concern, one surface over.
 */
function inspectedLabel(instant: string | null | undefined): ReactNode {
  if (instant === null || instant === undefined) return "not inspected";
  const at = new Date(instant);
  // An unreadable stored instant is not the same as no inspection, and saying
  // "not inspected" for it would tell the lead something false. The
  // machine-readable value is withheld too: `<time dateTime>` must carry a
  // valid datetime, and emitting the bad string would hand assistive
  // technology something it cannot parse.
  if (Number.isNaN(at.getTime()))
    return "recorded at a time Studio cannot read";
  return <time dateTime={at.toISOString()}>{renderInstant(at)}</time>;
}

function renderInstant(at: Date): string {
  const day = String(at.getUTCDate()).padStart(2, "0");
  const month = MONTHS[at.getUTCMonth()];
  const hour = String(at.getUTCHours()).padStart(2, "0");
  const minute = String(at.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${at.getUTCFullYear()}, ${hour}:${minute} UTC`;
}

/**
 * The four sentences a degraded state owes the lead. They come from the
 * projection rather than from copy written here, so a state cannot be honest
 * on one surface and vague on another.
 */
function ConditionDetail({
  condition,
  stopReason,
  waitWindow,
}: Readonly<{
  condition: UserVisibleState;
  stopReason: StopReasonKey | null;
  waitWindow: string | null;
}>) {
  // The reason is passed through, not dropped. `project()` supplies
  // attribution and retryability for `inspection-stopped` **only** when a
  // reason is given (AC-0091, AC-0092), and the reason itself is the human
  // sentence AC-0088 requires beside the state's label.
  const projected = project({
    state: condition,
    ...(stopReason === null ? {} : { reason: stopReason }),
    ...(waitWindow === null ? {} : { waitWindow }),
  });
  if (!projected.degraded) return null;
  return (
    <div className="verdict-surface__detail">
      {projected.lookedFor !== undefined && (
        <p>Studio looked for {projected.lookedFor}.</p>
      )}
      {projected.foundInstead !== undefined && (
        <p>It found {projected.foundInstead}.</p>
      )}
      {projected.attribution !== undefined && (
        <p data-attribution={projected.attribution}>
          This is the {projected.attribution} side of the boundary.
        </p>
      )}
      {projected.retryable !== undefined && (
        <p>Retrying: {projected.retryable}.</p>
      )}
      {projected.waitWindow !== undefined && (
        // AC-0097: what the transport said to wait, or that it said nothing.
        <p data-wait-window="true">{projected.waitWindow}</p>
      )}
      {projected.actions.length > 0 && (
        // AC-0095: what the lead can do about it, on the result rather than
        // only on the unconnected notice.
        <ul data-lead-actions="true">
          {projected.actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * AC-0117. Diagnostics carrying no next action, and raw child-process output,
 * are collapsed by default on a secondary surface. `details` without `open` is
 * that: present, reachable by keyboard, and not competing with the verdict.
 */
function DiagnosticsDisclosure({
  diagnostics,
  secondaryDiagnostic,
}: Readonly<{ diagnostics: string; secondaryDiagnostic: string | null }>) {
  if (diagnostics === "" && secondaryDiagnostic === null) return null;
  return (
    <details className="verdict-surface__diagnostics">
      <summary>Diagnostics</summary>
      {/* Raw child-process output, rendered as text. AC-0115. */}
      {diagnostics !== "" && <pre data-diagnostics="raw">{diagnostics}</pre>}
      {secondaryDiagnostic !== null && (
        // AC-0099: a protocol identifier never appears as user-visible copy.
        // It appears only here, on the secondary surface, which is why it
        // travels as its own field rather than inside the copy.
        <pre data-diagnostics="secondary">{secondaryDiagnostic}</pre>
      )}
    </details>
  );
}
