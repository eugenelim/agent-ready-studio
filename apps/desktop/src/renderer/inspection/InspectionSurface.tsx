import { useEffect, useMemo, useRef, useState } from "react";
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
/**
 * How often an in-flight inspection is re-read. Matched to the progress text
 * cadence rather than chosen separately: a surface that polled faster than it
 * could visibly change would add load for nothing.
 */
export const POLL_INTERVAL_MS = 1_500;

export function InspectionSurface({
  api,
}: Readonly<{ api?: StudioPreloadApi }>) {
  const { view, connect, cancel, refresh } = useInspection(api);
  const [url, setUrl] = useState("");
  const urlRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  // Stable across renders: passing a fresh Date.now() would restart the
  // progress clock on every render of this component.
  const fallbackStart = useMemo(() => Date.now(), []);

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

  // While a phase is in flight the surface advances on its own. Without this a
  // lead who connected sat on `resolving` until they pressed a button, which is
  // not a progress indication -- it is a prompt to go and check. The interval
  // is the same cadence the progress text uses, because both exist to keep a
  // wait of up to 150 seconds legible.
  useEffect(() => {
    if (!view.busy || !view.reading) return;
    const id = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [view.busy, view.reading, refresh]);

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

      {view.studioFailure !== null && (
        // Studio's own failure, attributed to Studio. It is deliberately not
        // the field's invalid state: the lead's URL may be perfectly good, and
        // there is nothing for them to correct.
        <section
          className="inspection-failure"
          aria-labelledby="studio-failure-heading"
          data-attribution="Studio"
        >
          <h2 id="studio-failure-heading">Studio cannot inspect</h2>
          <p>{view.studioFailure}</p>
          <p>
            This is Studio's side of the boundary, not a problem with the URL.
          </p>
        </section>
      )}

      {inspection === null &&
        view.rejection === null &&
        view.studioFailure === null && <UnconnectedNotice />}

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
          <ProgressPulse startedAt={view.startedAt ?? fallbackStart} />
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
