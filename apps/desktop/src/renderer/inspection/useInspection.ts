import type { StudioResult, UserVisibleState } from "@agent-ready/protocol";
import { useCallback, useRef, useState } from "react";
import type { StudioPreloadApi } from "../../preload/index.js";
import {
  type FocusTarget,
  type SurfaceSnapshot,
  transition,
  type Verdict,
} from "./presentation.js";

export type Inspection = StudioResult<"source.get">;

export interface InspectionView {
  readonly snapshot: SurfaceSnapshot;
  readonly inspection: Inspection | null;
  /** The live-region text. Exactly one transition's worth at a time. */
  readonly announcement: string;
  /**
   * The focus this transition asked for, or null when it asked for none. The
   * object is fresh per request, so two consecutive requests naming the same
   * element are distinct dependencies and the second still moves focus.
   */
  readonly focusRequest: Readonly<{ target: FocusTarget }> | null;
  readonly busy: boolean;
  readonly rejection: string | null;
  /**
   * A failure on Studio's side of the boundary. Separate from `rejection`
   * because attributing Studio's own failure to the lead's input is the
   * crossing AC-0093 forbids, and because a refused URL is actionable by the
   * lead while this is not.
   */
  readonly studioFailure: string | null;
  /** When the current in-flight phase began, for the progress channel. */
  readonly startedAt: number | null;
}

/**
 * Total over the eleven, so adding a twelfth state is a compile error here
 * rather than a silent classification as not-in-flight.
 */
const IN_FLIGHT: Readonly<Record<UserVisibleState, boolean>> = Object.freeze({
  resolving: true,
  inspecting: true,
  malformed: false,
  "inspector-unavailable": false,
  "source-unavailable": false,
  "source-rate-limited": false,
  "inspection-stopped": false,
  cancelled: false,
  incomplete: false,
  unconnected: false,
  "url-rejected": false,
});

/**
 * Drives the inspection surfaces and owns the one path every transition takes.
 *
 * Announcement and focus are never decided at a call site. Each entry point
 * says only *who* caused the change -- the lead or the system -- and hands the
 * next snapshot to `transition`, which decides both. That is what makes
 * AC-0125's coverage a property of the mechanism rather than a promise
 * repeated per surface, and it is why a new surface cannot quietly acquire a
 * second focus rule.
 */
export function useInspection(api: StudioPreloadApi = window.studio) {
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [focusRequest, setFocusRequest] = useState<Readonly<{
    target: FocusTarget;
  }> | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [studioFailure, setStudioFailure] = useState<string | null>(null);
  // Guards a second submission while one is in flight, and stamps each run so
  // a late response from an older one cannot overwrite a newer one.
  const submitting = useRef(false);
  const generation = useRef(0);
  const snapshot = useRef<SurfaceSnapshot>({
    state: null,
    verdict: null,
    resolvedSha: null,
  });

  const apply = useCallback(
    (
      next: Inspection | null,
      provenance: "user" | "system",
      detail?: string | null,
    ) => {
      const nextSnapshot: SurfaceSnapshot = {
        state: next === null ? null : surfaceState(next),
        verdict: next === null ? null : (next.verdict as Verdict | null),
        resolvedSha: next?.resolvedSha ?? null,
        detail: detail ?? null,
      };
      const step = transition(snapshot.current, nextSnapshot, provenance);
      // The phase clock restarts when the phase does, so the channel reports
      // this phase's age rather than the whole inspection's.
      if (nextSnapshot.state !== snapshot.current.state)
        setStartedAt(Date.now());
      snapshot.current = nextSnapshot;
      setInspection(next);
      // Only a real transition writes the live region. Re-rendering with the
      // same state leaves the previous announcement in place rather than
      // repeating it, which is the second half of "exactly one".
      if (step.announcement !== null) setAnnouncement(step.announcement);
      if (step.focus !== null) setFocusRequest({ target: step.focus });
    },
    [],
  );

  const connect = useCallback(
    async (url: string) => {
      // Two fast submissions would start two inspections against a Runtime
      // with a single-in-flight guard, and the second would come back as a
      // refusal of the lead's URL.
      if (submitting.current) return;
      submitting.current = true;
      const mine = ++generation.current;
      try {
        const outcome = await api.source.connect({ url });
        // A late response from an older submission must not overwrite a newer
        // one, which would announce the surface backwards.
        if (mine !== generation.current) return;
        if (!outcome.ok) {
          // Studio's own failure is Studio's. Attributing it to the lead's
          // input is the crossing AC-0093 forbids.
          setStudioFailure(outcome.error.message);
          setRejection(null);
          apply(null, "user");
          return;
        }
        setStudioFailure(null);
        setRejection(
          outcome.value.phase === "url-rejected"
            ? outcome.value.diagnostics
            : null,
        );
        apply(outcome.value, "user", outcome.value.diagnostics);
      } finally {
        submitting.current = false;
      }
    },
    [api, apply],
  );

  const cancel = useCallback(async () => {
    const sourceId = inspection?.sourceId;
    if (sourceId === undefined) return;
    const outcome = await api.source.cancel(sourceId);
    if (outcome.ok) {
      setStudioFailure(null);
      apply(outcome.value, "user");
      return;
    }
    // A failed cancel previously left the form disabled with no feedback at
    // all: the lead pressed Cancel and nothing happened, and no record existed
    // for anyone diagnosing it later.
    setStudioFailure(
      `Studio could not stop the inspection: ${outcome.error.message}`,
    );
  }, [api, apply, inspection]);

  /** A poll result: the system moved, so focus stays where the lead put it. */
  const refresh = useCallback(async () => {
    const sourceId = inspection?.sourceId;
    if (sourceId === undefined) return;
    const outcome = await api.source.get(sourceId);
    if (outcome.ok) {
      setStudioFailure(null);
      apply(outcome.value, "system");
      return;
    }
    setStudioFailure(
      `Studio could not read the inspection: ${outcome.error.message}`,
    );
  }, [api, apply, inspection]);

  const state = snapshot.current.state;
  const view: InspectionView = {
    snapshot: snapshot.current,
    inspection,
    announcement,
    focusRequest,
    busy: state !== null && IN_FLIGHT[state],
    rejection,
    studioFailure,
    startedAt,
  };
  return { view, connect, cancel, refresh } as const;
}

/**
 * Which user-visible state an inspection is showing. The phase leads while one
 * is set, because a progress state is what the surface is *doing*; otherwise
 * the condition does, and `ok` carries no chrome so it yields null.
 */
export function surfaceState(inspection: Inspection): UserVisibleState | null {
  if (inspection.phase !== null) return inspection.phase;
  return inspection.condition === "ok" ? null : inspection.condition;
}
