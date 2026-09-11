import type { StudioResult } from "@agent-ready/protocol";
import { useCallback, useEffect, useRef, useState } from "react";

import type { StudioPreloadApi } from "../preload/index.js";
import { type StudioSurfaceState, stateFromFailure } from "./useReview.js";

export type Workspace = StudioResult<"workspace.list">["items"][number];
export type HomeResult = StudioResult<"home.get">;
type DemoSeedResult = StudioResult<"demo.seed">;

export type InboxState = StudioSurfaceState<Readonly<{ home: HomeResult }>>;

const REFRESH_INTERVAL_MS = 15_000;

export function useStudio(api: StudioPreloadApi = window.studio) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    null,
  );
  const [demoSeedResult, setDemoSeedResult] = useState<DemoSeedResult | null>(
    null,
  );
  const [inboxState, setInboxState] = useState<InboxState>({ kind: "loading" });
  // What the last setup action did, in the user's terms. Both actions changed
  // authoritative state silently before this existed: Home would quietly gain a
  // row and nothing said why.
  const [actionReport, setActionReport] = useState<string | null>(null);
  // A report is only valid for the situation that produced it. Anything that
  // invalidates it — the user leaving Home, a workspace change, the next action
  // — bumps this. A write whose generation is stale is dropped, which covers
  // the case an action finishes *after* the user has already moved on.
  const reportGeneration = useRef(0);

  const invalidateReport = useCallback(() => {
    reportGeneration.current += 1;
    setActionReport(null);
  }, []);

  const reportIfCurrent = useCallback((generation: number, text: string) => {
    if (generation !== reportGeneration.current) return;
    setActionReport(text);
  }, []);

  const queryHome = useCallback(
    async (workspaceId: string, pendingState?: "loading" | "retrying") => {
      if (pendingState) setInboxState({ kind: pendingState });
      const outcome = await api.workspace.home(workspaceId);
      if (!outcome.ok) {
        setInboxState(stateFromFailure(outcome.error));
        return;
      }
      setInboxState(
        homeHasItems(outcome.value)
          ? { kind: "ready", home: outcome.value }
          : { kind: "no-work" },
      );
    },
    [api],
  );

  const loadWorkspaces = useCallback(
    async (pendingState: "loading" | "retrying" = "loading") => {
      setInboxState({ kind: pendingState });
      const outcome = await api.workspace.list();
      if (!outcome.ok) {
        setInboxState(stateFromFailure(outcome.error));
        return;
      }
      setWorkspaces(outcome.value.items);
      const workspace = outcome.value.items[0];
      if (!workspace) {
        setActiveWorkspaceId(null);
        setInboxState({ kind: "no-work" });
        return;
      }
      setActiveWorkspaceId(workspace.id);
      await queryHome(workspace.id);
    },
    [api, queryHome],
  );

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    const refresh = () => void queryHome(activeWorkspaceId);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      window.clearInterval(interval);
    };
  }, [activeWorkspaceId, queryHome]);

  const createWorkspace = useCallback(
    async (name: string, description?: string) => {
      setInboxState({ kind: "loading" });
      const outcome = await api.workspace.create(
        description ? { name, description } : { name },
      );
      if (!outcome.ok) {
        setInboxState(stateFromFailure(outcome.error));
        return false;
      }
      setWorkspaces((current) => [...current, outcome.value.workspace]);
      // Every path that changes the active workspace retires the report: it
      // describes an action in one workspace and would otherwise render under
      // another's name — including an action still in flight at the switch.
      invalidateReport();
      setActiveWorkspaceId(outcome.value.workspace.id);
      setDemoSeedResult(null);
      await queryHome(outcome.value.workspace.id);
      return true;
    },
    [api, invalidateReport, queryHome],
  );

  const seedDemo = useCallback(async () => {
    if (!activeWorkspaceId) return false;
    setInboxState({ kind: "loading" });
    setDemoSeedResult(null);
    invalidateReport();
    const generation = reportGeneration.current;
    const outcome = await api.workspace.seedDemo(activeWorkspaceId);
    if (!outcome.ok) {
      setInboxState(stateFromFailure(outcome.error));
      return false;
    }
    setDemoSeedResult(outcome.value);
    reportIfCurrent(
      generation,
      "Seeded the demo initiative and its input packet. Nothing needs a decision yet — run the transformation to produce a Product Intent.",
    );
    await queryHome(activeWorkspaceId);
    return true;
  }, [activeWorkspaceId, api, invalidateReport, queryHome, reportIfCurrent]);

  const runTransformation = useCallback(async () => {
    if (
      !activeWorkspaceId ||
      !demoSeedResult ||
      demoSeedResult.workspaceId !== activeWorkspaceId
    )
      return false;
    setInboxState({ kind: "loading" });
    invalidateReport();
    const generation = reportGeneration.current;
    const outcome = await api.execution.start({
      workspaceId: activeWorkspaceId,
      inputRevisionIds: [demoSeedResult.inputPacketRevisionId],
    });
    if (!outcome.ok) {
      setInboxState(stateFromFailure(outcome.error));
      return false;
    }
    setDemoSeedResult(null);
    reportIfCurrent(
      generation,
      outcome.value.reviewId === null
        ? "The transformation ran but opened no review."
        : "The transformation produced a Product Intent. It is waiting for your decision under Needs your decision.",
    );
    await queryHome(activeWorkspaceId);
    return true;
  }, [
    activeWorkspaceId,
    api,
    demoSeedResult,
    invalidateReport,
    queryHome,
    reportIfCurrent,
  ]);

  const retry = useCallback(async () => {
    setInboxState({ kind: "retrying" });
    if (activeWorkspaceId) {
      await queryHome(activeWorkspaceId);
      return;
    }
    await loadWorkspaces("retrying");
  }, [activeWorkspaceId, loadWorkspaces, queryHome]);

  const selectWorkspace = useCallback(
    async (workspaceId: string) => {
      invalidateReport();
      setDemoSeedResult(null);
      setActiveWorkspaceId(workspaceId);
      await queryHome(workspaceId, "loading");
    },
    [invalidateReport, queryHome],
  );

  const dismissActionReport = invalidateReport;

  return {
    actionReport,
    activeWorkspaceId,
    dismissActionReport,
    createWorkspace,
    canRunTransformation: demoSeedResult?.workspaceId === activeWorkspaceId,
    inboxState,
    retry,
    runTransformation,
    seedDemo,
    selectWorkspace,
    workspaces,
  } as const;
}

function homeHasItems(home: HomeResult): boolean {
  return (
    home.needsDecision.length > 0 ||
    home.blocked.length > 0 ||
    home.recentlyCompleted.length > 0
  );
}
