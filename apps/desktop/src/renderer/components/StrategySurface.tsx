import type { ReviewSummary, ReviewsState } from "../useReviews.js";
import { SurfaceStatus } from "./ReviewInbox.js";

type StrategySurfaceProps = Readonly<{
  state: ReviewsState;
  onOpenReview: (reviewId: string) => void;
  onRetry: () => void;
}>;

// Exhaustive over the contract's review statuses, so adding or renaming one is
// a compile error rather than a raw identifier rendered at the user.
const statusLabels = {
  open: "Needs a decision",
  "revision-needed": "Revision requested",
  resolved: "Decided",
  superseded: "Superseded",
} as const satisfies Record<ReviewSummary["status"], string>;

/**
 * The Strategy module: the workspace's Product Intent work.
 *
 * Read from `review.list` and filtered to the product-intent artifact type,
 * because protocol v1 has no method that lists artifacts or revisions by
 * workspace. Every Product Intent in this slice is created by a transformation
 * or by a human revision, and both open a review, so none is unreachable here.
 *
 * States emptiness only when there genuinely is none. A flat empty state would
 * have matched the other module surfaces and been false the moment the demo is
 * seeded and the transformation run.
 */
export function StrategySurface({
  state,
  onOpenReview,
  onRetry,
}: StrategySurfaceProps) {
  if (state.kind !== "ready")
    return <SurfaceStatus state={state} onRetry={onRetry} />;

  const productIntents = state.items.filter(
    (item) => item.artifactType === "product-intent",
  );

  if (productIntents.length === 0)
    return (
      <section className="surface-state" aria-labelledby="strategy-state">
        <h2 id="strategy-state">Strategy is empty</h2>
        <p>
          No product intent has been framed. Seed a workspace and run the
          transformation to propose one.
        </p>
      </section>
    );

  return (
    <section className="inbox-groups" aria-label="Strategy">
      <section className="inbox-group" aria-labelledby="strategy-work">
        <h2 id="strategy-work">Product intent</h2>
        <div className="card-list">
          {productIntents.map((item) => (
            <article className="work-card" key={item.id}>
              <header>
                <p className="eyebrow">{item.artifactType}</p>
                <h3>{item.artifactTitle}</h3>
              </header>
              <dl>
                <div>
                  <dt>Status</dt>
                  <dd className="status-label">{statusLabels[item.status]}</dd>
                </div>
                <div>
                  <dt>Producer</dt>
                  <dd>{item.producer}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>
                    <time dateTime={item.createdAt}>{item.createdAt}</time>
                  </dd>
                </div>
              </dl>
              <button
                className="button secondary"
                onClick={() => onOpenReview(item.id)}
                type="button"
              >
                Open review
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
