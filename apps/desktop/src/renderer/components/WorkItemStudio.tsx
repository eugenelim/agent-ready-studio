import { useState } from "react";

import type { StudioPreloadApi } from "../../preload/index.js";
import { type ReviewPackage, useReview } from "../useReview.js";
import { DecisionPanel } from "./DecisionPanel.js";
import { ProductIntentEditor } from "./ProductIntentEditor.js";
import { SurfaceStatus } from "./ReviewInbox.js";

type WorkItemStudioProps = Readonly<{
  api?: Pick<StudioPreloadApi, "artifact" | "review">;
  onClose?: () => void;
  reviewId: string | null;
}>;

type StudioTab = "work-item" | "run-details";

const productIntentFields = [
  "title",
  "outcome",
  "opportunity",
  "targetUsers",
  "assumptions",
  "guardrails",
  "nonGoals",
  "confidence",
  "openQuestions",
] as const;

type ProductIntentField = (typeof productIntentFields)[number];

export function WorkItemStudio({
  api = window.studio,
  onClose,
  reviewId,
}: WorkItemStudioProps) {
  const review = useReview(reviewId, api);
  const [tab, setTab] = useState<StudioTab>("work-item");

  if (review.state.kind !== "ready")
    return (
      <SurfaceStatus state={review.state} onRetry={() => void review.retry()} />
    );

  const reviewPackage = review.state.reviewPackage;
  return (
    <section className="work-item-studio" aria-label="Work Item Studio">
      <header className="work-item-header">
        <div>
          <p className="eyebrow">{reviewPackage.initiativeTitle}</p>
          <h2>{reviewPackage.artifactTitle}</h2>
        </div>
        {onClose ? (
          <button className="button secondary" onClick={onClose} type="button">
            Back to all reviews
          </button>
        ) : null}
      </header>

      <div className="studio-tabs" role="tablist" aria-label="Work item views">
        <button
          aria-controls="work-item-panel"
          aria-selected={tab === "work-item"}
          className="studio-tab"
          id="work-item-tab"
          onClick={() => setTab("work-item")}
          role="tab"
          type="button"
        >
          Work item
        </button>
        <button
          aria-controls="run-details-panel"
          aria-selected={tab === "run-details"}
          className="studio-tab"
          id="run-details-tab"
          onClick={() => setTab("run-details")}
          role="tab"
          type="button"
        >
          Run details
        </button>
      </div>

      {tab === "work-item" ? (
        <div
          aria-labelledby="work-item-tab"
          className="studio-regions"
          id="work-item-panel"
          role="tabpanel"
        >
          <section
            className="studio-region lineage-region"
            aria-labelledby="workflow-lineage-heading"
          >
            <h2 id="workflow-lineage-heading">Workflow and lineage</h2>
            <RevisionLabels reviewPackage={reviewPackage} />
            <InputLineage reviewPackage={reviewPackage} />
            <Evidence reviewPackage={reviewPackage} />
            <ChangeSummary reviewPackage={reviewPackage} />
          </section>

          <section
            className="studio-region artifact-region"
            aria-labelledby="artifact-heading"
          >
            <h2 id="artifact-heading">Artifact</h2>
            <p className="revision-label proposal-label">
              <span aria-hidden="true">◆</span> Proposal
            </p>
            <ProductIntentEditor
              api={api}
              onPackageChange={review.setReviewPackage}
              reviewPackage={reviewPackage}
            />
          </section>

          <aside
            className="studio-region decision-region"
            aria-label="Review and decision"
          >
            <DecisionPanel
              api={api}
              onPackageChange={review.setReviewPackage}
              reviewPackage={reviewPackage}
            />
          </aside>
        </div>
      ) : (
        <RunDetails reviewPackage={reviewPackage} />
      )}
    </section>
  );
}

function RevisionLabels({
  reviewPackage,
}: Readonly<{ reviewPackage: ReviewPackage }>) {
  return (
    <div className="revision-labels">
      <p className="revision-label proposal-label">
        <span aria-hidden="true">◆</span> Proposal
      </p>
      {reviewPackage.acceptedRevision ? (
        <p className="revision-label accepted-label">
          <span aria-hidden="true">●</span> Accepted
        </p>
      ) : null}
    </div>
  );
}

function InputLineage({
  reviewPackage,
}: Readonly<{ reviewPackage: ReviewPackage }>) {
  const executionInputIds = reviewPackage.execution?.inputRevisionIds ?? [];
  const executionInputs = reviewPackage.inputs.filter((input) =>
    executionInputIds.includes(input.id),
  );
  return (
    <section aria-labelledby="input-lineage-heading">
      <h3 id="input-lineage-heading">Input</h3>
      <h4 id="execution-input-revisions-heading">Execution input revisions</h4>
      {executionInputIds.length === 0 ? (
        <p>No execution input revisions.</p>
      ) : (
        <ul aria-labelledby="execution-input-revisions-heading">
          {executionInputIds.map((revisionId) => (
            <li key={revisionId}>
              <code>{revisionId}</code>
            </li>
          ))}
        </ul>
      )}
      {executionInputs.map((input) => (
        <article className="input-revision" key={input.id}>
          <h4>Input revision {input.id}</h4>
          <dl>
            <div>
              <dt>Artifact ID</dt>
              <dd>{input.artifactId}</dd>
            </div>
            <div>
              <dt>Artifact type</dt>
              <dd>{input.artifactType}</dd>
            </div>
            <div>
              <dt>Schema version</dt>
              <dd>{input.schemaVersion}</dd>
            </div>
            <div>
              <dt>Objective</dt>
              <dd>{input.content.objective}</dd>
            </div>
            <div>
              <dt>Source notes</dt>
              <dd>{input.content.sourceNotes}</dd>
            </div>
            <div>
              <dt>Target users</dt>
              <dd>{input.content.targetUsers.join(", ")}</dd>
            </div>
            <div>
              <dt>Known context</dt>
              <dd>{formatList(input.content.knownContext)}</dd>
            </div>
            <div>
              <dt>Constraints</dt>
              <dd>{formatList(input.content.constraints)}</dd>
            </div>
            <div>
              <dt>Non-goals</dt>
              <dd>{formatList(input.content.nonGoals)}</dd>
            </div>
            <div>
              <dt>Expected output</dt>
              <dd>{input.content.expectedOutputArtifactType}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>
                <time dateTime={input.createdAt}>{input.createdAt}</time>
              </dd>
            </div>
          </dl>
        </article>
      ))}
      <h4 id="stored-proposal-lineage-heading">Stored proposal lineage</h4>
      <ul aria-labelledby="stored-proposal-lineage-heading">
        {reviewPackage.reviewedRevision.inputRevisionIds.map((revisionId) => (
          <li key={revisionId}>
            <code>{revisionId}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Evidence({
  reviewPackage,
}: Readonly<{ reviewPackage: ReviewPackage }>) {
  return (
    <section aria-labelledby="evidence-heading">
      <h3 id="evidence-heading">Evidence</h3>
      {reviewPackage.evidence.length === 0 ? (
        <p>No external evidence linked.</p>
      ) : (
        <ul>
          {reviewPackage.evidence.map((relation) => (
            <li key={relation.id}>
              <strong>{formatLabel(relation.kind)}</strong>:{" "}
              {relation.sourceRevisionId}
              {" → "}
              {relation.targetRevisionId} — {relation.label}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ChangeSummary({
  reviewPackage,
}: Readonly<{ reviewPackage: ReviewPackage }>) {
  const acceptedRevision = reviewPackage.acceptedRevision;
  if (!acceptedRevision)
    return (
      <section aria-labelledby="change-summary-heading">
        <h3 id="change-summary-heading">Change summary</h3>
        <p>No accepted baseline</p>
      </section>
    );

  const changedFields = productIntentFields.filter((field) =>
    reviewPackage.changedFields.includes(field),
  );
  return (
    <section aria-labelledby="change-summary-heading">
      <h3 id="change-summary-heading">Change summary</h3>
      {changedFields.length === 0 ? (
        <p>No structured fields changed.</p>
      ) : (
        <dl className="change-list">
          {changedFields.map((field) => (
            <div key={field}>
              <dt>{formatLabel(field)}</dt>
              <dd>
                <span>Accepted: </span>
                {formatValue(acceptedRevision.content[field])}
              </dd>
              <dd>
                <span>Proposal: </span>
                {formatValue(reviewPackage.reviewedRevision.content[field])}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function RunDetails({
  reviewPackage,
}: Readonly<{ reviewPackage: ReviewPackage }>) {
  const execution = reviewPackage.execution;
  return (
    <section
      aria-labelledby="run-details-tab"
      className="run-details"
      id="run-details-panel"
      role="tabpanel"
    >
      <h2>Run details</h2>
      {execution ? (
        <>
          <dl>
            <div>
              <dt>Execution ID</dt>
              <dd>{execution.id}</dd>
            </div>
            <div>
              <dt>Executor</dt>
              <dd>{formatLabel(execution.executorKind)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{formatLabel(execution.status)}</dd>
            </div>
          </dl>
          <ol>
            {execution.events.map((event) => (
              <li key={event.sequence}>
                <time dateTime={event.occurredAt}>{event.occurredAt}</time>{" "}
                {event.message}
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p>No run details available.</p>
      )}
    </section>
  );
}

function formatValue(value: string | string[]): string {
  return Array.isArray(value) ? value.join(", ") : value;
}

function formatList(values: string[]): string {
  return values.length === 0 ? "None" : values.join(", ");
}

function formatLabel(value: ProductIntentField | string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
