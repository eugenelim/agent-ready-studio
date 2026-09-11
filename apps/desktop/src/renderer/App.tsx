import { type FormEvent, useEffect, useState } from "react";

import { OverviewSurface } from "./components/OverviewSurface.js";
import { ReviewInbox } from "./components/ReviewInbox.js";
import { ReviewsList } from "./components/ReviewsList.js";
import { StrategySurface } from "./components/StrategySurface.js";
import { WorkItemStudio } from "./components/WorkItemStudio.js";
import { useReviews } from "./useReviews.js";
import { useStudio } from "./useStudio.js";

const blueprintModules = [
  "Overview",
  "Strategy",
  "Research",
  "Experience",
  "Architecture",
  "Delivery",
  "Release",
  "Outcomes",
] as const;

type ModuleName = (typeof blueprintModules)[number];
type View = "Home" | "Reviews" | ModuleName;

// Overview and Strategy are absent on purpose: both read the workspace's real
// work and state emptiness only when there is none, so neither has a constant
// empty state to sit here.
const emptyStates: Partial<Record<ModuleName, string>> = {
  Research:
    "No research has been added. Capture source notes when evidence is available.",
  Experience:
    "No experience map exists. Map the user journey when the workflow is understood.",
  Architecture:
    "No architecture decisions exist. Record boundaries when a technical choice is ready.",
  Delivery:
    "No delivery plan exists. Shape build work after the product decision is clear.",
  Release:
    "No release is planned. Add release work only when a build is ready to ship.",
  Outcomes:
    "No outcomes have been recorded. Add observed results after the work reaches users.",
};

export function App() {
  const studio = useStudio();
  const [view, setView] = useState<View>("Home");
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const reviews = useReviews(
    studio.activeWorkspaceId,
    // Strategy reads whenever it is shown. Reviews additionally requires no open
    // review, because the Work Item Studio replaces the list there — but
    // Strategy keeps rendering its list with a review open, so gating it the
    // same way left it in a permanent Loading state with no Retry.
    view === "Strategy" ||
      view === "Overview" ||
      (view === "Reviews" && activeReviewId === null),
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // One-shot. Gating on the view alone only hides the report, so leaving Home
  // and returning would re-render a finished action's message — and re-insert a
  // live region with content — as though it had just happened.
  const { dismissActionReport } = studio;
  useEffect(() => {
    if (view !== "Home") dismissActionReport();
  }, [dismissActionReport, view]);

  const submitWorkspace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const created = await studio.createWorkspace(
      trimmedName,
      description.trim() || undefined,
    );
    if (created) {
      setName("");
      setDescription("");
    }
  };

  const activeWorkspace = studio.workspaces.find(
    (workspace) => workspace.id === studio.activeWorkspaceId,
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#studio-content">
          Agent-Ready Studio
        </a>
        <nav aria-label="Global navigation">
          {(["Home", "Reviews"] as const).map((item) => (
            <button
              aria-current={view === item ? "page" : undefined}
              className="nav-item"
              key={item}
              onClick={() => setView(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="workspace-picker">
          <label htmlFor="workspace-select">Workspace</label>
          <select
            id="workspace-select"
            onChange={(event) =>
              void studio.selectWorkspace(event.target.value)
            }
            value={studio.activeWorkspaceId ?? ""}
          >
            <option value="">No workspace selected</option>
            {studio.workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </div>

        <nav aria-label="Blueprint modules">
          {blueprintModules.map((module) => (
            <button
              aria-current={view === module ? "page" : undefined}
              className="nav-item"
              key={module}
              onClick={() => setView(module)}
              type="button"
            >
              {module}
            </button>
          ))}
        </nav>
      </aside>

      <main id="studio-content" tabIndex={-1}>
        <header className="page-header">
          <div>
            <p className="eyebrow">
              {activeWorkspace?.name ?? "Local workspace"}
            </p>
            <h1>{view}</h1>
          </div>
          {/* Scoped to Home. These are setup actions on Home's own content, and
              rendering them in the global header put them on all eight module
              surfaces, where they act on something the user cannot see. */}
          {activeWorkspace && view === "Home" ? (
            <div className="header-actions">
              <button
                className="button secondary"
                onClick={() => void studio.seedDemo()}
                type="button"
              >
                Seed demo workspace
              </button>
              {studio.canRunTransformation ? (
                <button
                  className="button primary"
                  onClick={() => void studio.runTransformation()}
                  type="button"
                >
                  Run transformation
                </button>
              ) : null}
            </div>
          ) : null}
        </header>

        {/* Both setup actions changed authoritative state with no acknowledgement:
            a row appeared in Home and nothing said what it was or what to do
            next. Announced politely so it reaches a screen reader too. */}
        {studio.actionReport && view === "Home" ? (
          <output className="action-report" aria-live="polite">
            {studio.actionReport}
          </output>
        ) : null}

        {view === "Home" || view === "Reviews" ? (
          <>
            {view === "Home" ? (
              <section
                className="workspace-create"
                aria-labelledby="create-workspace-heading"
              >
                <h2 id="create-workspace-heading">Create a workspace</h2>
                <form onSubmit={(event) => void submitWorkspace(event)}>
                  <label htmlFor="workspace-name">Name</label>
                  <input
                    id="workspace-name"
                    onChange={(event) => setName(event.target.value)}
                    required
                    value={name}
                  />
                  <label htmlFor="workspace-description">
                    Description (optional)
                  </label>
                  <textarea
                    id="workspace-description"
                    onChange={(event) => setDescription(event.target.value)}
                    value={description}
                  />
                  <button className="button primary" type="submit">
                    Create workspace
                  </button>
                </form>
              </section>
            ) : null}
            {view === "Reviews" && activeReviewId ? (
              <WorkItemStudio
                onClose={() => setActiveReviewId(null)}
                reviewId={activeReviewId}
              />
            ) : null}
            {/* Home answers "what needs me now" and drops a review once it is
                decided. Reviews is the complete list, so a resolved or
                superseded review is reachable at all. Rendering the same inbox
                on both made Reviews a copy of Home and left `review.list`
                exposed by the preload and called by nothing. */}
            {view === "Reviews" && !activeReviewId ? (
              <ReviewsList
                state={reviews.state}
                onOpenReview={(reviewId) => setActiveReviewId(reviewId)}
                onRetry={() => void reviews.retry()}
              />
            ) : null}
            {view === "Home" ? (
              <ReviewInbox
                state={studio.inboxState}
                onOpenReview={(reviewId) => {
                  setActiveReviewId(reviewId);
                  setView("Reviews");
                }}
                onRetry={() => void studio.retry()}
              />
            ) : null}
          </>
        ) : view === "Overview" ? (
          <OverviewSurface
            state={reviews.state}
            onRetry={() => void reviews.retry()}
          />
        ) : view === "Strategy" ? (
          <StrategySurface
            state={reviews.state}
            onOpenReview={(reviewId) => {
              setActiveReviewId(reviewId);
              setView("Reviews");
            }}
            onRetry={() => void reviews.retry()}
          />
        ) : (
          <ModuleSurface module={view} />
        )}
      </main>
    </div>
  );
}

function ModuleSurface({ module }: Readonly<{ module: ModuleName }>) {
  return (
    <section className="surface-state" aria-labelledby="module-state">
      <h2 id="module-state">{module} is empty</h2>
      <p>{emptyStates[module]}</p>
    </section>
  );
}
