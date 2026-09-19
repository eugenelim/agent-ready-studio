import type { StudioResult } from "@agent-ready/protocol";
import type { UserVisibleState } from "@agent-ready/studio-service/state-projection";
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
   * nonce makes two consecutive requests for the same element distinguishable,
   * so the second is not swallowed as "no change".
   */
  readonly focusRequest: Readonly<{
    target: FocusTarget;
    nonce: number;
  }> | null;
  readonly busy: boolean;
  readonly rejection: string | null;
  /** When the current in-flight phase began, for the progress channel. */
  readonly startedAt: number | null;
}

const IN_FLIGHT: ReadonlySet<UserVisibleState> = new Set<UserVisibleState>([
  "resolving",
  "inspecting",
]);

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
    nonce: number;
  }> | null>(null);
  const nonce = useRef(0);
  const [rejection, setRejection] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const snapshot = useRef<SurfaceSnapshot>({
    state: null,
    verdict: null,
    resolvedSha: null,
  });

  const apply = useCallback(
    (next: Inspection | null, provenance: "user" | "system") => {
      const nextSnapshot: SurfaceSnapshot = {
        state: next === null ? null : surfaceState(next),
        verdict: next === null ? null : (next.verdict as Verdict | null),
        resolvedSha: next?.resolvedSha ?? null,
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
      if (step.focus !== null) {
        nonce.current += 1;
        setFocusRequest({ target: step.focus, nonce: nonce.current });
      }
    },
    [],
  );

  const connect = useCallback(
    async (url: string) => {
      const outcome = await api.source.connect({ url });
      if (!outcome.ok) {
        // A transport failure is not a refusal of the URL, and saying so would
        // blame the lead's input for Studio's own problem.
        setRejection(outcome.error.message);
        apply(null, "user");
        return;
      }
      setRejection(
        outcome.value.phase === "url-rejected"
          ? outcome.value.diagnostics
          : null,
      );
      apply(outcome.value, "user");
    },
    [api, apply],
  );

  const cancel = useCallback(async () => {
    const sourceId = inspection?.sourceId;
    if (sourceId === undefined) return;
    const outcome = await api.source.cancel(sourceId);
    if (outcome.ok) apply(outcome.value, "user");
  }, [api, apply, inspection]);

  /** A poll result: the system moved, so focus stays where the lead put it. */
  const refresh = useCallback(async () => {
    const sourceId = inspection?.sourceId;
    if (sourceId === undefined) return;
    const outcome = await api.source.get(sourceId);
    if (outcome.ok) apply(outcome.value, "system");
  }, [api, apply, inspection]);

  const state = snapshot.current.state;
  const view: InspectionView = {
    snapshot: snapshot.current,
    inspection,
    announcement,
    focusRequest,
    busy: state !== null && IN_FLIGHT.has(state),
    rejection,
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
