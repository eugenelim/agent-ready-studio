import type { NonReadyStudioState } from "../useReview.js";
import type { HomeResult, InboxState } from "../useStudio.js";

type ReviewInboxProps = Readonly<{
  state: InboxState;
  onRetry: () => void;
  onOpenReview?: (reviewId: string) => void;
}>;

type SurfaceStatusProps = Readonly<{
  state: NonReadyStudioState;
  onRetry: () => void;
}>;

const groupDefinitions = [
  ["needsDecision", "Needs your decision"],
  ["blocked", "Blocked or revision requested"],
  ["recentlyCompleted", "Recently completed"],
] as const satisfies ReadonlyArray<readonly [keyof HomeResult, string]>;

export function ReviewInbox({
  state,
  onRetry,
  onOpenReview,
}: ReviewInboxProps) {
  if (state.kind !== "ready")
    return <SurfaceStatus state={state} onRetry={onRetry} />;

  return (
    <section className="inbox-groups" aria-label="Review inbox">
      {groupDefinitions.map(([key, label]) => (
        <section
          className="inbox-group"
          aria-labelledby={`inbox-${key}`}
          key={key}
        >
          <h2 id={`inbox-${key}`}>{label}</h2>
          {state.home[key].length === 0 ? (
            <p className="muted">Nothing in this group.</p>
          ) : (
            <div className="card-list">
              {state.home[key].map((item) => (
                <article className="work-card" key={`${item.kind}-${item.id}`}>
                  <header>
                    <p className="eyebrow">{item.artifactType}</p>
                    <h3>{item.title}</h3>
                  </header>
                  <dl>
                    <div>
                      <dt>Workspace</dt>
                      <dd>{item.workspaceName}</dd>
                    </div>
                    <div>
                      <dt>Initiative</dt>
                      <dd>{item.initiativeTitle ?? "No initiative"}</dd>
                    </div>
                    <div>
                      <dt>Decision reason</dt>
                      <dd>{item.reason}</dd>
                    </div>
                    <div>
                      <dt>Producer</dt>
                      <dd>{item.producer}</dd>
                    </div>
                    <div>
                      <dt>Transformation</dt>
                      <dd>{item.transformationId ?? "No transformation"}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd className="status-label">
                        {formatStatus(item.status)}
                      </dd>
                    </div>
                    <div>
                      <dt>Created</dt>
                      <dd>
                        <time dateTime={item.createdAt}>{item.createdAt}</time>
                      </dd>
                    </div>
                    <div>
                      <dt>Unresolved questions</dt>
                      <dd>{item.unresolvedQuestionCount}</dd>
                    </div>
                  </dl>
                  {item.kind === "review" && onOpenReview ? (
                    <button
                      className="button secondary"
                      onClick={() => onOpenReview(item.id)}
                      type="button"
                    >
                      Open review
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      ))}
    </section>
  );
}

export function SurfaceStatus({ state, onRetry }: SurfaceStatusProps) {
  const status = statusContent(state);
  return (
    <section
      className="surface-state"
      aria-live="polite"
      aria-labelledby="inbox-state"
    >
      <h2 id="inbox-state">{status.label}</h2>
      <p>{status.detail}</p>
      {status.retry ? (
        <button className="button secondary" onClick={onRetry} type="button">
          Retry
        </button>
      ) : null}
    </section>
  );
}

function statusContent(state: NonReadyStudioState) {
  switch (state.kind) {
    case "loading":
      return {
        label: "Loading",
        detail: "Loading authoritative Studio state.",
        retry: false,
      };
    case "no-work":
      return {
        label: "No work",
        detail: "No work is available for this surface.",
        retry: false,
      };
    case "execution-failed":
      return { label: "Execution failed", detail: state.message, retry: true };
    case "service-disconnected":
      return {
        label: "Service disconnected",
        detail: state.message,
        retry: true,
      };
    case "protocol-incompatible":
      return {
        label: "Protocol incompatible",
        detail: state.message,
        retry: true,
      };
    case "retrying":
      return {
        label: "Retrying",
        detail: "Re-querying authoritative Studio state.",
        retry: false,
      };
    case "timed-out":
      return { label: "Timed out", detail: state.message, retry: true };
  }
}

function formatStatus(status: string): string {
  return status
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
