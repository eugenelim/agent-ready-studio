import type { StudioResult } from "@agent-ready/protocol";
import { useCallback, useEffect, useRef, useState } from "react";

import type { StudioPreloadApi } from "../preload/index.js";
import { type StudioSurfaceState, stateFromFailure } from "./useReview.js";

export type ReviewSummary = StudioResult<"review.list">["items"][number];
export type ReviewsState = StudioSurfaceState<
  Readonly<{ items: readonly ReviewSummary[] }>
>;

/**
 * Every review in the workspace, whatever its lifecycle status.
 *
 * Distinct from `useStudio`'s Home projection on purpose: Home answers "what
 * needs me now" and drops a review once it is decided, so a resolved or
 * superseded review is reachable nowhere else. This is the reader for those.
 */
export function useReviews(
  workspaceId: string | null,
  // Whether the surface is currently on screen. The list is read when it is
  // shown, not once at mount: a review created or resolved while the user was
  // elsewhere would otherwise be missing from a list AC-50 calls complete.
  active = true,
  api: Pick<StudioPreloadApi, "review"> = window.studio,
) {
  const [state, setState] = useState<ReviewsState>({ kind: "loading" });
  // A sequence number, not the workspace id. Keying on identity only drops
  // responses for a workspace the user has left, so an A -> B -> A sequence
  // leaves two A requests in flight and the slower one still wins.
  const latestRequest = useRef(0);

  const load = useCallback(
    async (pendingState: "loading" | "retrying" = "loading") => {
      // Invalidate first, on every path — including the one that resolves the
      // surface without issuing a call. Otherwise clearing the workspace while
      // a read is in flight lets that read settle afterwards and render the old
      // workspace's list under a cleared picker, permanently, because this
      // surface has no refresh to correct it.
      latestRequest.current += 1;
      const request = latestRequest.current;
      if (!workspaceId) {
        setState({ kind: "no-work" });
        return;
      }
      setState({ kind: pendingState });
      // Overlapping loads leave several calls in flight. Only the newest may
      // settle: this surface has no periodic refresh, so a stale winner would
      // simply stay on screen.
      const outcome = await api.review.list(workspaceId);
      if (request !== latestRequest.current) return;
      if (!outcome.ok) {
        setState(stateFromFailure(outcome.error));
        return;
      }
      setState({ kind: "ready", items: outcome.value.items });
    },
    [api, workspaceId],
  );

  useEffect(() => {
    if (!active) return;
    void load();
  }, [active, load]);

  const retry = useCallback(async () => {
    await load("retrying");
  }, [load]);

  return { retry, state } as const;
}
