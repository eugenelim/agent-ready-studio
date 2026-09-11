import type { StudioResult } from "@agent-ready/protocol";
import { type FormEvent, useEffect, useState } from "react";

import type { StudioPreloadApi } from "../../preload/index.js";

type ReviewPackage = StudioResult<"review.get">["package"];
type ProductIntent = ReviewPackage["reviewedRevision"]["content"];
type ListField =
  | "targetUsers"
  | "assumptions"
  | "guardrails"
  | "nonGoals"
  | "openQuestions";

type ProductIntentEditorProps = Readonly<{
  api: Pick<StudioPreloadApi, "artifact" | "review">;
  onPackageChange?: (reviewPackage: ReviewPackage) => void;
  reviewPackage: ReviewPackage;
}>;

type SaveState =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: "saving" }>
  | Readonly<{ kind: "saved" }>
  | Readonly<{ kind: "failed"; message: string }>;

export function ProductIntentEditor({
  api,
  onPackageChange,
  reviewPackage,
}: ProductIntentEditorProps) {
  const [content, setContent] = useState(
    reviewPackage.reviewedRevision.content,
  );
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });

  useEffect(() => {
    setContent(reviewPackage.reviewedRevision.content);
    setSaveState({ kind: "idle" });
  }, [reviewPackage]);

  const setListField = (field: ListField, value: string) => {
    setContent((current) => ({
      ...current,
      [field]: value.split("\n"),
    }));
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedContent: ProductIntent = {
      ...content,
      title: content.title.trim(),
      outcome: content.outcome.trim(),
      opportunity: content.opportunity.trim(),
      targetUsers: normalizeLines(content.targetUsers),
      assumptions: normalizeLines(content.assumptions),
      guardrails: normalizeLines(content.guardrails),
      nonGoals: normalizeLines(content.nonGoals),
      openQuestions: normalizeLines(content.openQuestions),
    };
    if (
      !normalizedContent.title ||
      !normalizedContent.outcome ||
      !normalizedContent.opportunity ||
      normalizedContent.targetUsers.length === 0
    ) {
      setSaveState({
        kind: "failed",
        message: "Complete the required Product Intent fields before saving.",
      });
      return;
    }
    setSaveState({ kind: "saving" });
    const outcome = await api.artifact.revise({
      artifactId: reviewPackage.reviewedRevision.artifactId,
      baseRevisionId: reviewPackage.reviewedRevision.id,
      content: normalizedContent,
    });
    if (!outcome.ok) {
      setSaveState({ kind: "failed", message: outcome.error.message });
      return;
    }
    // A saved revision supersedes the review that was on screen and opens a new
    // one targeting only the new revision. Leaving the old package rendered
    // would keep Approve and Request revision live against a superseded review —
    // decisions the service will refuse, offered as though they were available.
    const reloaded = await api.review.get(outcome.value.reviewId);
    if (!reloaded.ok) {
      setSaveState({ kind: "failed", message: reloaded.error.message });
      return;
    }
    onPackageChange?.(reloaded.value.package);
    setSaveState({ kind: "saved" });
  };

  return (
    <form
      className="product-intent-editor"
      onSubmit={(event) => void save(event)}
    >
      <label htmlFor="intent-title">Title</label>
      <input
        id="intent-title"
        onChange={(event) =>
          setContent((current) => ({ ...current, title: event.target.value }))
        }
        required
        value={content.title}
      />

      <label htmlFor="intent-outcome">Outcome</label>
      <textarea
        id="intent-outcome"
        onChange={(event) =>
          setContent((current) => ({ ...current, outcome: event.target.value }))
        }
        required
        value={content.outcome}
      />

      <label htmlFor="intent-opportunity">Opportunity</label>
      <textarea
        id="intent-opportunity"
        onChange={(event) =>
          setContent((current) => ({
            ...current,
            opportunity: event.target.value,
          }))
        }
        required
        value={content.opportunity}
      />

      <ListEditor
        field="targetUsers"
        label="Target users"
        onChange={setListField}
        required
        value={content.targetUsers}
      />
      <ListEditor
        field="assumptions"
        label="Assumptions"
        onChange={setListField}
        value={content.assumptions}
      />
      <ListEditor
        field="guardrails"
        label="Guardrails"
        onChange={setListField}
        value={content.guardrails}
      />
      <ListEditor
        field="nonGoals"
        label="Non-goals"
        onChange={setListField}
        value={content.nonGoals}
      />

      <label htmlFor="intent-confidence">Confidence</label>
      <select
        id="intent-confidence"
        onChange={(event) => {
          const confidence = event.target.value;
          if (!isConfidence(confidence)) return;
          setContent((current) => ({
            ...current,
            confidence,
          }));
        }}
        value={content.confidence}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <ListEditor
        field="openQuestions"
        label="Open questions"
        onChange={setListField}
        value={content.openQuestions}
      />

      <button
        className="button primary"
        disabled={saveState.kind === "saving"}
        type="submit"
      >
        Save Product Intent
      </button>
      {saveState.kind === "saved" ? (
        <p className="save-message" aria-live="polite">
          Product Intent saved.
        </p>
      ) : null}
      {saveState.kind === "failed" ? (
        <p className="validation-message" role="alert">
          {saveState.message}
        </p>
      ) : null}
    </form>
  );
}

function ListEditor({
  field,
  label,
  onChange,
  required = false,
  value,
}: Readonly<{
  field: ListField;
  label: string;
  onChange: (field: ListField, value: string) => void;
  required?: boolean;
  value: string[];
}>) {
  const id = `intent-${field}`;
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        onChange={(event) => onChange(field, event.target.value)}
        required={required}
        value={value.join("\n")}
      />
    </>
  );
}

function normalizeLines(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

function isConfidence(value: string): value is ProductIntent["confidence"] {
  return value === "low" || value === "medium" || value === "high";
}
