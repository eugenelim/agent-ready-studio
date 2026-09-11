import type { StudioResult } from "@agent-ready/protocol";
import { useCallback, useEffect, useState } from "react";

import type { StudioCallFailure, StudioPreloadApi } from "../preload/index.js";

export type NonReadyStudioState =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "no-work" }>
  | Readonly<{ kind: "execution-failed"; message: string }>
  | Readonly<{ kind: "service-disconnected"; message: string }>
  | Readonly<{ kind: "protocol-incompatible"; message: string }>
  | Readonly<{ kind: "retrying" }>
  | Readonly<{ kind: "timed-out"; message: string }>;

export type StudioSurfaceState<TReady extends object> =
  | NonReadyStudioState
  | (Readonly<{ kind: "ready" }> & TReady);

export type ReviewPackage = StudioResult<"review.get">["package"];
export type ReviewState = StudioSurfaceState<
  Readonly<{ reviewPackage: ReviewPackage }>
>;

export function useReview(
  reviewId: string | null,
  api: Pick<StudioPreloadApi, "review"> = window.studio,
) {
  const [state, setState] = useState<ReviewState>(
    reviewId ? { kind: "loading" } : { kind: "no-work" },
  );

  const load = useCallback(
    async (pendingState: "loading" | "retrying" = "loading") => {
      if (!reviewId) {
        setState({ kind: "no-work" });
        return;
      }
      setState({ kind: pendingState });
      const outcome = await api.review.get(reviewId);
      setState(
        outcome.ok
          ? { kind: "ready", reviewPackage: outcome.value.package }
          : stateFromFailure(outcome.error),
      );
    },
    [api, reviewId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const retry = useCallback(async () => {
    await load("retrying");
  }, [load]);

  const setReviewPackage = useCallback((reviewPackage: ReviewPackage) => {
    setState({ kind: "ready", reviewPackage });
  }, []);

  return { retry, setReviewPackage, state } as const;
}

export function stateFromFailure(
  error: StudioCallFailure,
): NonReadyStudioState {
  switch (error.kind) {
    case "timeout":
      return { kind: "timed-out", message: error.message };
    case "disconnected":
      return { kind: "service-disconnected", message: error.message };
    case "incompatible":
      return { kind: "protocol-incompatible", message: error.message };
    case "invalid-response":
    case "service":
      return { kind: "execution-failed", message: error.message };
  }
}
