import type { ReviewSummary, ReviewsState } from "../useReviews.js";
import { SurfaceStatus } from "./ReviewInbox.js";

type OverviewSurfaceProps = Readonly<{
  state: ReviewsState;
  onRetry: () => void;
}>;

// Exhaustive over the contract's review statuses, so adding or renaming one is
// a compile error rather than a silently missing line in the summary.
const statusLabels = {
  open: "Needs a decision",
  "revision-needed": "Revision requested",
  resolved: "Decided",
  superseded: "Superseded",
} as const satisfies Record<ReviewSummary["status"], string>;

const statusOrder = [
  "open",
  "revision-needed",
  "resolved",
  "superseded",
] as const satisfies ReadonlyArray<ReviewSummary["status"]>;

/**
 * The Overview module: what the workspace's work currently amounts to.
 *
 * Everything rendered here is counted from rows that exist, and — the part that
 * is easy to get wrong — each number is labelled as the thing it counts. Reviews
 * are counted as reviews, work items as distinct artifacts. AC-51 forbids a
 * fabricated metric or description standing in for absent content, and a real
 * number under the wrong noun is exactly that.
 *
 * Read from `review.list`, as Strategy is, because protocol v1 has no method
 * that lists artifacts or revisions by workspace.
 */
export function OverviewSurface({ state, onRetry }: OverviewSurfaceProps) {
  if (state.kind !== "ready")
    return <SurfaceStatus state={state} onRetry={onRetry} />;

  if (state.items.length === 0)
    return (
      <section className="surface-state" aria-labelledby="overview-state">
        <h2 id="overview-state">Overview is empty</h2>
        <p>
          There is no work to summarise. Seed a workspace and run the
          transformation to propose the first artifact.
        </p>
      </section>
    );

  // Each row of `review.list` is a review, not a work item. Several reviews sit
  // on one artifact: `executionStart` reuses the workspace's single seed-keyed
  // Product Intent artifact, and every human revision opens another review on it.
  // Counting rows and calling the total "work items" would report one Product
  // Intent with four reviews as four work items — arithmetic over real rows
  // describing something the surface cannot see.
  const workItemIds = new Set(state.items.map((item) => item.artifactId));
  const byStatus = statusOrder
    .map((status) => ({
      status,
      count: state.items.filter((item) => item.status === status).length,
    }))
    .filter((entry) => entry.count > 0);
  const byType = [
    ...new Map(
      state.items.map((item) => [item.artifactId, item.artifactType]),
    ).values(),
  ].reduce<{ artifactType: string; count: number }[]>((types, artifactType) => {
    const existing = types.find((entry) => entry.artifactType === artifactType);
    if (existing) existing.count += 1;
    else types.push({ artifactType, count: 1 });
    return types;
  }, []);
  byType.sort((a, b) => a.artifactType.localeCompare(b.artifactType));
  // Scoped to the reviews awaiting a decision, so the number answers a question
  // the reader has. Summing across every review would count the same artifact's
  // questions once per revision of it.
  const openQuestions = state.items
    .filter((item) => item.status === "open")
    .reduce((total, item) => total + item.unresolvedQuestionCount, 0);
  const awaitingDecision =
    byStatus.find((entry) => entry.status === "open")?.count ?? 0;

  return (
    <section className="inbox-groups" aria-label="Overview">
      <section className="inbox-group" aria-labelledby="overview-work">
        <h2 id="overview-work">Work in this workspace</h2>
        <p>
          {workItemIds.size === 1
            ? "1 work item"
            : `${workItemIds.size} work items`}
          {state.items.length === 1
            ? ", under 1 review"
            : `, under ${state.items.length} reviews`}
          {awaitingDecision > 0
            ? `, ${awaitingDecision} awaiting a decision`
            : ", none awaiting a decision"}
          .
        </p>
      </section>

      <section className="inbox-group" aria-labelledby="overview-status">
        <h2 id="overview-status">Reviews by status</h2>
        <dl>
          {byStatus.map((entry) => (
            <div key={entry.status}>
              <dt>{statusLabels[entry.status]}</dt>
              <dd>{entry.count}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="inbox-group" aria-labelledby="overview-types">
        <h2 id="overview-types">Work item types</h2>
        <dl>
          {byType.map((entry) => (
            <div key={entry.artifactType}>
              <dt>{entry.artifactType}</dt>
              <dd>{entry.count}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="inbox-group" aria-labelledby="overview-questions">
        <h2 id="overview-questions">Unresolved questions</h2>
        <p>
          {openQuestions === 0
            ? "No unresolved questions on work awaiting a decision."
            : `${openQuestions} unresolved on work awaiting a decision.`}
        </p>
      </section>
    </section>
  );
}
