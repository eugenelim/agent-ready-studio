// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { StudioPreloadApi } from "../preload/index.js";
import { App } from "./App.js";
import { packageWithBaseline } from "./components/__fixtures__/review-package.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const workspace = {
  id: "workspace-1",
  name: "Product team",
  description: "Decisions for the desktop product",
  blueprintId: "product-development",
  blueprintVersion: "1",
  installedCapabilityPacks: [],
  createdAt: "2026-09-09T12:00:00.000Z",
  updatedAt: "2026-09-09T12:00:00.000Z",
} as const;

const emptyHome = {
  kind: "home",
  needsDecision: [],
  blocked: [],
  recentlyCompleted: [],
} as const;

const homeWithDecision = {
  ...emptyHome,
  needsDecision: [
    {
      kind: "review",
      id: "review-1",
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      initiativeTitle: "Build Agent-Ready Studio",
      title: "Product Intent",
      artifactType: "product-intent",
      reason: "Review the proposed product intent",
      producer: "deterministic-executor",
      transformationId: "strategy.frame-product-intent",
      status: "decision-needed",
      createdAt: "2026-09-09T12:00:00.000Z",
      unresolvedQuestionCount: 2,
    },
  ],
} as const;

describe("App", () => {
  it("creates, seeds, and runs a transformation through the preload boundary", async () => {
    const testApi = installStudioApi({ initialWorkspaces: [] });
    testApi.home
      .mockResolvedValueOnce({ ok: true, value: emptyHome })
      .mockResolvedValueOnce({ ok: true, value: emptyHome })
      .mockResolvedValueOnce({ ok: true, value: homeWithDecision });
    render(<App />);

    await screen.findByRole("heading", { name: "No work" });
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Product team" },
    });
    fireEvent.change(screen.getByLabelText("Description (optional)"), {
      target: { value: "Decisions for the desktop product" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create workspace" }));

    await waitFor(() =>
      expect(testApi.create).toHaveBeenCalledWith({
        name: "Product team",
        description: "Decisions for the desktop product",
      }),
    );
    expect(testApi.seedDemo).not.toHaveBeenCalled();
    expect(screen.queryByText("Build Agent-Ready Studio")).toBeNull();

    fireEvent.click(
      await screen.findByRole("button", { name: "Seed demo workspace" }),
    );

    const runTransformation = await screen.findByRole("button", {
      name: "Run transformation",
    });
    expect(testApi.seedDemo).toHaveBeenCalledWith(workspace.id);
    expect(screen.queryByText("Build Agent-Ready Studio")).toBeNull();

    fireEvent.click(runTransformation);

    await screen.findByText("Build Agent-Ready Studio");
    expect(testApi.executionStart).toHaveBeenCalledWith({
      workspaceId: workspace.id,
      inputRevisionIds: ["revision-1"],
    });
    expect(testApi.home).toHaveBeenCalledTimes(3);
  });

  it("keeps the setup actions on Home rather than on every module surface", async () => {
    installStudioApi();
    render(<App />);
    await screen.findByRole("button", { name: "Seed demo workspace" });

    // Each blueprint module is a different surface; a Home setup action shown
    // there acts on content the user is not looking at.
    for (const module of [
      "Overview",
      "Strategy",
      "Research",
      "Experience",
      "Architecture",
      "Delivery",
      "Release",
      "Outcomes",
    ]) {
      fireEvent.click(screen.getByRole("button", { name: module }));
      expect(
        screen.queryByRole("button", { name: "Seed demo workspace" }),
      ).toBeNull();
      expect(
        screen.queryByRole("button", { name: "Run transformation" }),
      ).toBeNull();
    }

    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(
      screen.getByRole("button", { name: "Seed demo workspace" }),
    ).toBeTruthy();
  });

  it("says what each setup action did instead of silently changing Home", async () => {
    const testApi = installStudioApi({ initialWorkspaces: [] });
    testApi.home
      .mockResolvedValueOnce({ ok: true, value: emptyHome })
      .mockResolvedValueOnce({ ok: true, value: emptyHome })
      .mockResolvedValueOnce({ ok: true, value: homeWithDecision });
    render(<App />);

    await screen.findByRole("heading", { name: "No work" });
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Product team" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create workspace" }));

    // Nothing to report before an action is taken.
    await screen.findByRole("button", { name: "Seed demo workspace" });
    expect(screen.queryByRole("status")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Seed demo workspace" }),
    );

    const seeded = await screen.findByRole("status");
    expect(seeded.textContent).toContain("input packet");
    expect(seeded.textContent).toContain("run the transformation");
    expect(seeded.getAttribute("aria-live")).toBe("polite");

    fireEvent.click(
      await screen.findByRole("button", { name: "Run transformation" }),
    );

    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain(
        "waiting for your decision",
      ),
    );

    // The report describes an action taken on Home. It does not follow the user
    // onto Reviews or the module surfaces, which is the defect its sibling
    // header actions were just fixed for.
    fireEvent.click(screen.getByRole("button", { name: "Strategy" }));
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reviews" }));
    expect(screen.queryByRole("status")).toBeNull();

    // Retired, not merely hidden. Coming back to Home must not re-announce a
    // finished action as though it had just happened.
    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it.each([
    [
      "the user has already left Home",
      async () => {
        fireEvent.click(screen.getByRole("button", { name: "Strategy" }));
      },
    ],
    [
      "the active workspace has already changed",
      async () => {
        fireEvent.change(screen.getByLabelText("Workspace"), {
          target: { value: "workspace-2" },
        });
        await waitFor(() => undefined);
      },
    ],
  ])("drops a report whose action finished after %s", async (_case, invalidate) => {
    // The guard round 18 added, exercised the only way it can be: the action
    // resolves *after* the invalidating event, so the synchronous clear those
    // events already performed cannot be what suppresses the report.
    const second = {
      ...workspace,
      id: "workspace-2",
      name: "Second team",
    } as unknown as typeof workspace;
    const testApi = installStudioApi({
      initialWorkspaces: [workspace, second],
    });
    let releaseSeed = () => undefined as unknown;
    testApi.seedDemo.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseSeed = () =>
            resolve({
              ok: true,
              value: {
                kind: "demo-seed",
                workspaceId: workspace.id,
                actorId: "actor-1",
                initiativeArtifactId: "initiative-1",
                inputPacketRevisionId: "revision-1",
              },
            });
        }),
    );
    render(<App />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Seed demo workspace" }),
    );
    await invalidate();

    await act(async () => {
      releaseSeed();
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("retires the action report when the create form makes a new workspace", async () => {
    // The other workspace-change path. Both existing create-form tests create
    // before any report exists, so the state this call is for — a report from
    // one workspace still on screen when the form makes another — was never
    // reached.
    const testApi = installStudioApi();
    render(<App />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Seed demo workspace" }),
    );
    await screen.findByRole("status");

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Second team" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create workspace" }));

    await waitFor(() => expect(testApi.create).toHaveBeenCalled());
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("retires the action report when the active workspace changes", async () => {
    const second = {
      ...workspace,
      id: "workspace-2",
      name: "Second team",
    } as unknown as typeof workspace;
    const testApi = installStudioApi({
      initialWorkspaces: [workspace, second],
    });
    render(<App />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Seed demo workspace" }),
    );
    await screen.findByRole("status");

    // The report describes an action in one workspace. Switching must not leave
    // it rendered under another workspace's name.
    fireEvent.change(screen.getByLabelText("Workspace"), {
      target: { value: second.id },
    });

    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    expect(testApi.home).toHaveBeenCalledWith(second.id);
  });

  it("AC-03 exposes exactly eight blueprint modules and keeps Reviews global", async () => {
    installStudioApi();
    render(<App />);
    await screen.findByText("Product Intent");

    const moduleNavigation = screen.getByRole("navigation", {
      name: "Blueprint modules",
    });
    const moduleButtons = within(moduleNavigation).getAllByRole("button");
    expect(moduleButtons).toHaveLength(8);
    expect(moduleButtons.map((button) => button.textContent)).toEqual([
      "Overview",
      "Strategy",
      "Research",
      "Experience",
      "Architecture",
      "Delivery",
      "Release",
      "Outcomes",
    ]);
    expect(
      within(moduleNavigation).queryByRole("button", { name: "Reviews" }),
    ).toBeNull();
    expect(
      within(
        screen.getByRole("navigation", { name: "Global navigation" }),
      ).getByRole("button", { name: "Reviews" }),
    ).toBeTruthy();
  });

  it("AC-51 gives Strategy the workspace's Product Intent work, not a blurb", async () => {
    // Strategy previously rendered a static description sentence, which reads
    // as content while holding none. It now reads the same review.list the
    // Reviews surface uses, filtered to product intents.
    const testApi = installStudioApi();
    render(<App />);
    await screen.findByRole("button", { name: "Seed demo workspace" });

    fireEvent.click(screen.getByRole("button", { name: "Strategy" }));

    const strategy = await screen.findByRole("region", { name: "Strategy" });
    expect(testApi.reviewList).toHaveBeenCalledWith(workspace.id);
    expect(within(strategy).getByText("Build Agent-Ready Studio")).toBeTruthy();
    expect(
      screen.queryByText(/Frame product intent from grounded inputs/),
    ).toBeNull();

    fireEvent.click(
      within(strategy).getByRole("button", { name: "Open review" }),
    );
    await waitFor(() =>
      expect(testApi.reviewGet).toHaveBeenCalledWith("review-1"),
    );
  });

  it("AC-51 routes Overview to the summary, and reads the workspace to build it", async () => {
    // Two call sites, both previously undefended: the `view === "Overview"`
    // branch in App, and Overview's entry in the useReviews enable gate.
    // Deleting the first fell through to the generic module empty state and
    // deleting the second left Overview loading forever, and the whole suite
    // stayed green through both.
    const testApi = installStudioApi();
    render(<App />);
    await screen.findByRole("region", { name: "Review inbox" });

    fireEvent.click(screen.getByRole("button", { name: "Overview" }));

    const overview = await screen.findByRole("region", { name: "Overview" });
    expect(testApi.reviewList).toHaveBeenCalledWith(workspace.id);
    // Not the shared module empty state, and not stuck loading.
    expect(
      screen.queryByRole("heading", { name: "Overview is empty" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Loading" })).toBeNull();
    expect(
      within(overview).getByRole("region", { name: "Work in this workspace" })
        .textContent,
    ).toContain("1 work item");
  });

  it("AC-51 reads Strategy even when a review is open", async () => {
    // Home inbox -> Open review -> Strategy in the sidebar. Strategy keeps
    // rendering its list with a review open, so gating its read on "no open
    // review" left it in a permanent Loading state with no Retry.
    const testApi = installStudioApi();
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Open review" }));
    fireEvent.click(screen.getByRole("button", { name: "Strategy" }));

    const strategy = await screen.findByRole("region", { name: "Strategy" });
    expect(testApi.reviewList).toHaveBeenCalledWith(workspace.id);
    expect(within(strategy).getByText("Build Agent-Ready Studio")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Loading" })).toBeNull();
  });

  it("AC-50 gives Reviews the full list rather than a copy of Home's inbox", async () => {
    const testApi = installStudioApi();
    render(<App />);
    // Home is the decision inbox.
    await screen.findByRole("region", { name: "Review inbox" });
    expect(screen.queryByRole("region", { name: "All reviews" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reviews" }));

    // Reviews is the complete list, read through review.list, and shows a
    // resolved review Home has already dropped.
    const list = await screen.findByRole("region", { name: "All reviews" });
    expect(screen.queryByRole("region", { name: "Review inbox" })).toBeNull();
    expect(testApi.reviewList).toHaveBeenCalledWith(workspace.id);
    expect(
      within(list).getByRole("heading", { name: "Resolved" }),
    ).toBeTruthy();
    expect(
      within(
        within(list).getByRole("region", { name: "Resolved" }),
      ).getAllByRole("article"),
    ).toHaveLength(1);
  });

  it("AC-50 re-reads the review list after a decision closes the Work Item Studio", async () => {
    // Closing the studio returns to the list. Without a fresh read the review
    // just decided stays under its old status forever, because this surface has
    // no periodic refresh — a complete list rendering a stale one.
    const testApi = installStudioApi();
    const open = {
      id: "review-1",
      workspaceId: workspace.id,
      artifactId: "artifact-1",
      revisionId: "revision-1",
      artifactTitle: "Build Agent-Ready Studio",
      artifactType: "product-intent",
      reason: "Product Intent needs a decision",
      producer: "strategy.frame-product-intent",
      createdAt: "2026-09-09T12:00:00.000Z",
      unresolvedQuestionCount: 0,
    };
    testApi.reviewList
      .mockResolvedValueOnce({
        ok: true,
        value: { kind: "reviews", items: [{ ...open, status: "open" }] },
      })
      .mockResolvedValue({
        ok: true,
        value: { kind: "reviews", items: [{ ...open, status: "resolved" }] },
      });
    // `review.get` must actually resolve here: the shared double never settles,
    // which leaves the Work Item Studio in its loading state where the control
    // this test drives does not exist.
    testApi.reviewGet.mockResolvedValue({
      ok: true,
      value: { kind: "review-package", package: packageWithBaseline },
    });
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Reviews" }));
    const list = await screen.findByRole("region", { name: "All reviews" });
    expect(
      within(within(list).getByRole("region", { name: "Open" })).getAllByRole(
        "article",
      ),
    ).toHaveLength(1);
    const readsBeforeOpening = testApi.reviewList.mock.calls.length;

    fireEvent.click(within(list).getByRole("button", { name: "Open review" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Back to all reviews" }),
    );

    await waitFor(() =>
      expect(testApi.reviewList.mock.calls.length).toBeGreaterThan(
        readsBeforeOpening,
      ),
    );
    const reloaded = await screen.findByRole("region", { name: "All reviews" });
    expect(
      within(
        within(reloaded).getByRole("region", { name: "Resolved" }),
      ).getAllByRole("article"),
    ).toHaveLength(1);
  });

  it("opens a review from the inbox through the preload review boundary", async () => {
    const testApi = installStudioApi();
    render(<App />);
    await screen.findByText("Product Intent");

    fireEvent.click(screen.getByRole("button", { name: "Open review" }));

    expect(
      await screen.findByRole("heading", { name: "Loading" }),
    ).toBeTruthy();
    await waitFor(() =>
      expect(testApi.reviewGet).toHaveBeenCalledWith("review-1"),
    );
  });

  it("AC-04 renders a purpose-specific empty state for every module without a list of its own", async () => {
    installStudioApi();
    render(<App />);
    await screen.findByText("Product Intent");

    // Overview and Strategy are absent: AC-51 gives both real content read from
    // the workspace, so neither has the constant empty state AC-04 requires of
    // the six modules that have no list of their own.
    const expectedStates = {
      Research: "Capture source notes when evidence is available.",
      Experience: "Map the user journey when the workflow is understood.",
      Architecture: "Record boundaries when a technical choice is ready.",
      Delivery: "Shape build work after the product decision is clear.",
      Release: "Add release work only when a build is ready to ship.",
      Outcomes: "Add observed results after the work reaches users.",
    } as const;

    for (const [module, purpose] of Object.entries(expectedStates)) {
      fireEvent.click(screen.getByRole("button", { name: module }));
      expect(
        screen.getByRole("heading", { name: `${module} is empty` }),
      ).toBeTruthy();
      expect(
        screen.getByText(
          new RegExp(purpose.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        ),
      ).toBeTruthy();
      expect(document.querySelector("svg, canvas")).toBeNull();
      expect(screen.queryByText(/\b\d+(?:[.,]\d+)?%?\b/)).toBeNull();
    }
  });

  it.each([
    ["disconnected", "Service disconnected"],
    ["incompatible", "Protocol incompatible"],
  ] as const)("AC-42 and AC-43 re-query authoritative Home after a %s reconnect", async (kind, label) => {
    const testApi = installStudioApi();
    testApi.home
      .mockResolvedValueOnce({
        ok: false,
        error: {
          kind,
          message: label,
          code: kind === "incompatible" ? -32001 : null,
          data: null,
        },
      })
      .mockResolvedValueOnce({ ok: true, value: homeWithDecision });
    render(<App />);

    await screen.findByRole("heading", { name: label });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await screen.findByText("Product Intent");
    expect(testApi.list).toHaveBeenCalledOnce();
    expect(testApi.home).toHaveBeenCalledTimes(2);
  });

  it("AC-48 retries a timeout on the live connection by reissuing Home only", async () => {
    const testApi = installStudioApi();
    testApi.home
      .mockResolvedValueOnce({
        ok: false,
        error: {
          kind: "timeout",
          message: "Home request timed out",
          code: null,
          data: null,
        },
      })
      .mockResolvedValueOnce({ ok: true, value: homeWithDecision });
    render(<App />);

    await screen.findByRole("heading", { name: "Timed out" });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await screen.findByText("Product Intent");
    expect(testApi.list).toHaveBeenCalledOnce();
    expect(testApi.home).toHaveBeenCalledTimes(2);
  });

  it("AC-42 reloads authoritative Home when the renderer resumes", async () => {
    const testApi = installStudioApi();
    testApi.home
      .mockResolvedValueOnce({ ok: true, value: emptyHome })
      .mockResolvedValueOnce({ ok: true, value: homeWithDecision });
    render(<App />);

    await screen.findByRole("heading", { name: "No work" });
    window.dispatchEvent(new Event("focus"));

    await screen.findByText("Product Intent");
    expect(testApi.home).toHaveBeenCalledTimes(2);
  });
});

function installStudioApi(
  options: Readonly<{
    initialWorkspaces?: ReadonlyArray<typeof workspace>;
  }> = {},
) {
  const create = vi.fn().mockResolvedValue({
    ok: true,
    value: { kind: "workspace", workspace },
  });
  const list = vi.fn().mockResolvedValue({
    ok: true,
    value: {
      kind: "workspaces",
      items: options.initialWorkspaces ?? [workspace],
    },
  });
  const home = vi.fn().mockResolvedValue({ ok: true, value: homeWithDecision });
  const seedDemo = vi.fn().mockResolvedValue({
    ok: true,
    value: {
      kind: "demo-seed",
      workspaceId: workspace.id,
      actorId: "actor-1",
      initiativeArtifactId: "initiative-1",
      inputPacketRevisionId: "revision-1",
    },
  });
  const reviewListFn = vi.fn().mockResolvedValue({
    ok: true,
    value: {
      kind: "reviews",
      items: [
        {
          id: "review-1",
          workspaceId: workspace.id,
          artifactId: "artifact-1",
          revisionId: "revision-1",
          artifactTitle: "Build Agent-Ready Studio",
          artifactType: "product-intent",
          reason: "Product Intent needs a decision",
          producer: "strategy.frame-product-intent",
          status: "resolved",
          createdAt: "2026-09-09T12:00:00.000Z",
          unresolvedQuestionCount: 0,
        },
      ],
    },
  });
  const workspaceApi = {
    create,
    list,
    get: vi.fn(),
    home,
    seedDemo,
  };
  const reviewGet = vi
    .fn()
    .mockReturnValue(new Promise<never>(() => undefined));
  const executionStart = vi.fn().mockResolvedValue({
    ok: true,
    value: {
      kind: "execution",
      executionId: "execution-1",
      status: "completed",
      outputRevisionId: "proposal-revision-1",
      reviewId: "review-1",
    },
  });
  const api = {
    workspace: workspaceApi,
    artifact: { revise: vi.fn() },
    execution: { start: executionStart },
    review: { list: reviewListFn, get: reviewGet, resolve: vi.fn() },
  } as unknown as StudioPreloadApi;
  Object.defineProperty(window, "studio", {
    configurable: true,
    value: api,
  });
  return {
    ...workspaceApi,
    executionStart,
    reviewGet,
    reviewList: reviewListFn,
  };
}
