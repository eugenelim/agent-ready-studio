import { useEffect, useRef, useState } from "react";
import type { StudioPreloadApi } from "../../preload/index.js";
import {
  ConnectRepositoryForm,
  UnconnectedNotice,
} from "./ConnectRepositoryForm.js";
import { ProgressPulse } from "./ProgressPulse.js";
import type { Verdict } from "./presentation.js";
import { StateBadge } from "./StateBadge.js";
import { surfaceState, useInspection } from "./useInspection.js";
import { VerdictSurface } from "./VerdictSurface.js";

/**
 * The connect and verdict surfaces together, with the one live region between
 * them.
 *
 * The region is `polite` and holds a single line. AC-0128 forbids a transition
 * producing both an exit and an entry announcement, so nothing here announces
 * leaving a state -- the hook writes one string per transition and this renders
 * whatever that string currently is.
 */
export function InspectionSurface({
  api,
}: Readonly<{ api?: StudioPreloadApi }>) {
  const { view, connect, cancel, refresh } = useInspection(api);
  const [url, setUrl] = useState("");
  const urlRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // The focus half of the single path. The hook decides *where*; this moves
  // it. Keeping the decision out of here is what stops a surface growing its
  // own rule.
  useEffect(() => {
    if (view.focusRequest === null) return;
    const target = view.focusRequest.target;
    if (target === "url-field") urlRef.current?.focus();
    else if (target === "cancel") cancelRef.current?.focus();
    else if (target === "result") resultRef.current?.focus();
    // Keyed on the request rather than on the target: two transitions in a row
    // can name the same element, and the second must still move focus.
  }, [view.focusRequest]);

  const inspection = view.inspection;
  const state = inspection === null ? null : surfaceState(inspection);
  const hasResult =
    inspection !== null &&
    inspection.phase === null &&
    state !== "url-rejected";

  return (
    <div className="inspection-surface">
      {/*
        One polite live region for the whole slice. AC-0128 and AC-0158 are
        both "exactly one", which is only checkable if there is exactly one
        place an announcement can come from.
      */}
      <output
        className="visually-hidden"
        aria-live="polite"
        data-live-region="inspection"
      >
        {view.announcement}
      </output>

      <ConnectRepositoryForm
        ref={urlRef}
        cancelRef={cancelRef}
        url={url}
        onUrlChange={setUrl}
        onSubmit={() => void connect(url)}
        onCancel={() => void cancel()}
        busy={view.busy}
        rejection={view.rejection}
      />

      {inspection === null && view.rejection === null && <UnconnectedNotice />}

      {/* Progress is its own surface: `resolving` and `inspecting` are
          separately rendered, and `inspecting` carries the resolved SHA. */}
      {view.busy && state !== null && (
        <section
          className="inspection-progress"
          aria-labelledby="progress-heading"
        >
          <h2 id="progress-heading">Inspection in progress</h2>
          <StateBadge
            state={state}
            resolvedSha={inspection?.resolvedSha ?? null}
            emphasis="primary"
          />
          {state === "inspecting" && inspection?.resolvedSha !== null && (
            <p data-identity="resolved-sha">{inspection?.resolvedSha}</p>
          )}
          <ProgressPulse startedAt={view.startedAt ?? Date.now()} />
          <button type="button" onClick={() => void refresh()}>
            Refresh status
          </button>
        </section>
      )}

      {hasResult && inspection !== null && (
        <div ref={resultRef} tabIndex={-1}>
          <VerdictSurface
            verdict={(inspection.verdict ?? "no-verdict") as Verdict}
            condition={
              inspection.condition === "ok" ? null : inspection.condition
            }
            versionUnverified={inspection.versionUnverified}
            owner={inspection.owner}
            repository={inspection.repository}
            resolvedSha={inspection.resolvedSha}
            diagnostics={inspection.diagnostics}
          />
        </div>
      )}
    </div>
  );
}
