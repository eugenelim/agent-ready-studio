import {
  project,
  type UserVisibleState,
} from "@agent-ready/studio-service/state-projection";
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
  diagnostics,
}: Readonly<{
  verdict: Verdict;
  /** The condition, or null when it is `ok` and carries no chrome. */
  condition: UserVisibleState | null;
  versionUnverified: boolean;
  owner: string;
  repository: string;
  resolvedSha: string | null;
  diagnostics: string;
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
      </dl>

      {condition !== null && <ConditionDetail condition={condition} />}

      <DiagnosticsDisclosure diagnostics={diagnostics} />
    </section>
  );
}

/**
 * The four sentences a degraded state owes the lead. They come from the
 * projection rather than from copy written here, so a state cannot be honest
 * on one surface and vague on another.
 */
function ConditionDetail({
  condition,
}: Readonly<{ condition: UserVisibleState }>) {
  const projected = project({ state: condition });
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
}: Readonly<{ diagnostics: string }>) {
  if (diagnostics === "") return null;
  return (
    <details className="verdict-surface__diagnostics">
      <summary>Diagnostics</summary>
      {/* Raw child-process output, rendered as text. AC-0115. */}
      <pre data-diagnostics="raw">{diagnostics}</pre>
    </details>
  );
}
