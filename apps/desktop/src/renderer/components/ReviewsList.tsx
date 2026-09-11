import type { ReviewSummary, ReviewsState } from "../useReviews.js";
import { SurfaceStatus } from "./ReviewInbox.js";

type ReviewsListProps = Readonly<{
  state: ReviewsState;
  onOpenReview: (reviewId: string) => void;
  onRetry: () => void;
}>;

// Every lifecycle status the contract's `reviewSummary` admits, in the order a
// reviewer works through them. Listed exhaustively rather than derived from the
// data so an empty group is still shown and stated, instead of vanishing.
const statusGroups = [
  ["open", "Open"],
  ["revision-needed", "Revision needed"],
  ["resolved", "Resolved"],
  ["superseded", "Superseded"],
] as const satisfies ReadonlyArray<readonly [ReviewSummary["status"], string]>;

export function ReviewsList({
  state,
  onOpenReview,
  onRetry,
}: ReviewsListProps) {
  if (state.kind !== "ready")
    return <SurfaceStatus state={state} onRetry={onRetry} />;

  return (
    <section className="inbox-groups" aria-label="All reviews">
      {statusGroups.map(([status, label]) => {
        const items = state.items.filter((item) => item.status === status);
        return (
          <section
            className="inbox-group"
            aria-labelledby={`reviews-${status}`}
            key={status}
          >
            <h2 id={`reviews-${status}`}>{label}</h2>
            {items.length === 0 ? (
              <p className="muted">No reviews in this group.</p>
            ) : (
              <div className="card-list">
                {items.map((item) => (
                  <article className="work-card" key={item.id}>
                    <header>
                      <p className="eyebrow">{item.artifactType}</p>
                      <h3>{item.artifactTitle}</h3>
                    </header>
                    <dl>
                      <div>
                        <dt>Decision reason</dt>
                        <dd>{item.reason}</dd>
                      </div>
                      <div>
                        <dt>Producer</dt>
                        <dd>{item.producer}</dd>
                      </div>
                      <div>
                        <dt>Created</dt>
                        <dd>
                          <time dateTime={item.createdAt}>
                            {item.createdAt}
                          </time>
                        </dd>
                      </div>
                      <div>
                        <dt>Unresolved questions</dt>
                        <dd>{item.unresolvedQuestionCount}</dd>
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
            )}
          </section>
        );
      })}
    </section>
  );
}
