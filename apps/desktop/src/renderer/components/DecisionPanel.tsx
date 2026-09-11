import type { StudioResult } from "@agent-ready/protocol";
import { useEffect, useState } from "react";

import type {
  StudioCallFailure,
  StudioPreloadApi,
} from "../../preload/index.js";

type ReviewPackage = StudioResult<"review.get">["package"];

type DecisionPanelProps = Readonly<{
  api: Pick<StudioPreloadApi, "review">;
  onPackageChange?: (reviewPackage: ReviewPackage) => void;
  reviewPackage: ReviewPackage;
}>;

type DecisionState =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: "resolving" }>
  | Readonly<{ kind: "conflict"; message: string }>
  | Readonly<{ kind: "failed"; message: string }>;

export function DecisionPanel({
  api,
  onPackageChange,
  reviewPackage,
}: DecisionPanelProps) {
  const [currentPackage, setCurrentPackage] = useState(reviewPackage);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [decisionState, setDecisionState] = useState<DecisionState>({
    kind: "idle",
  });

  useEffect(() => {
    setCurrentPackage(reviewPackage);
  }, [reviewPackage]);

  const reloadPackage = async () => {
    const outcome = await api.review.get(currentPackage.review.id);
    if (!outcome.ok) {
      setDecisionState({ kind: "failed", message: outcome.error.message });
      return;
    }
    setCurrentPackage(outcome.value.package);
    onPackageChange?.(outcome.value.package);
    setDecisionState({ kind: "idle" });
  };

  const resolveReview = async (
    action: "approve" | "request-revision",
    revisionComment?: string,
  ) => {
    setDecisionState({ kind: "resolving" });
    const outcome = await api.review.resolve(
      revisionComment === undefined
        ? { reviewId: currentPackage.review.id, action }
        : {
            reviewId: currentPackage.review.id,
            action,
            comment: revisionComment,
          },
    );
    if (!outcome.ok) {
      setDecisionState({
        kind: isConflict(outcome.error) ? "conflict" : "failed",
        message: outcome.error.message,
      });
      return;
    }
    await reloadPackage();
  };

  const requestRevision = () => {
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setCommentError("Enter a revision comment before requesting changes.");
      return;
    }
    setCommentError(null);
    void resolveReview("request-revision", trimmedComment);
  };

  return (
    <section
      className="decision-panel"
      aria-labelledby="decision-panel-heading"
    >
      <header>
        <p className="eyebrow">{currentPackage.artifactTitle}</p>
        <h2 id="decision-panel-heading">Review decision</h2>
      </header>
      <dl>
        <div>
          <dt>Review status</dt>
          <dd>{formatStatus(currentPackage.review.status)}</dd>
        </div>
      </dl>
      {decisionState.kind === "conflict" ? (
        <section
          className="decision-state"
          aria-labelledby="decision-conflict-heading"
        >
          <h3 id="decision-conflict-heading">Review conflict</h3>
          <p>{decisionState.message}</p>
          <button
            className="button secondary"
            onClick={() => void reloadPackage()}
            type="button"
          >
            Reload review package
          </button>
        </section>
      ) : null}
      {decisionState.kind === "failed" ? (
        <section
          className="decision-state"
          aria-labelledby="decision-failed-heading"
        >
          <h3 id="decision-failed-heading">Decision failed</h3>
          <p>{decisionState.message}</p>
          <button
            className="button secondary"
            onClick={() => void reloadPackage()}
            type="button"
          >
            Reload review package
          </button>
        </section>
      ) : null}
      {currentPackage.review.status === "open" &&
      decisionState.kind !== "conflict" &&
      decisionState.kind !== "failed" ? (
        <div className="decision-controls">
          <button
            className="button primary"
            disabled={decisionState.kind === "resolving"}
            onClick={() => void resolveReview("approve")}
            type="button"
          >
            Approve and advance
          </button>
          <label htmlFor="revision-comment">Revision comment</label>
          <textarea
            aria-describedby={
              commentError ? "revision-comment-error" : undefined
            }
            aria-invalid={commentError ? "true" : undefined}
            id="revision-comment"
            onChange={(event) => {
              setComment(event.target.value);
              if (commentError) setCommentError(null);
            }}
            value={comment}
          />
          {commentError ? (
            <p className="validation-message" id="revision-comment-error">
              {commentError}
            </p>
          ) : null}
          <button
            className="button secondary"
            disabled={decisionState.kind === "resolving"}
            onClick={requestRevision}
            type="button"
          >
            Request revision
          </button>
          {decisionState.kind === "resolving" ? (
            <p aria-live="polite">Recording decision.</p>
          ) : null}
        </div>
      ) : null}
      {currentPackage.review.status !== "open" ? (
        <DecisionHistory reviewPackage={currentPackage} />
      ) : null}
    </section>
  );
}

function DecisionHistory({
  reviewPackage,
}: Readonly<{ reviewPackage: ReviewPackage }>) {
  return (
    <section aria-labelledby="recorded-decisions-heading">
      <h3 id="recorded-decisions-heading">Recorded decisions</h3>
      {reviewPackage.decisions.length === 0 ? (
        <p>No recorded decision is available.</p>
      ) : (
        reviewPackage.decisions.map((decision) => (
          <article className="decision-record" key={decision.id}>
            <dl>
              <div>
                <dt>Decision ID</dt>
                <dd>{decision.id}</dd>
              </div>
              <div>
                <dt>Actor</dt>
                <dd>{decision.actorName}</dd>
              </div>
              <div>
                <dt>Action</dt>
                <dd>{formatStatus(decision.action)}</dd>
              </div>
              {decision.comment ? (
                <div>
                  <dt>Comment</dt>
                  <dd>{decision.comment}</dd>
                </div>
              ) : null}
              <div>
                <dt>Recorded</dt>
                <dd>
                  <time dateTime={decision.createdAt}>
                    {decision.createdAt}
                  </time>
                </dd>
              </div>
            </dl>
          </article>
        ))
      )}
    </section>
  );
}

function isConflict(error: StudioCallFailure): boolean {
  return (
    error.kind === "service" && (error.code === -32003 || error.code === -32004)
  );
}

function formatStatus(status: string): string {
  return status
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
