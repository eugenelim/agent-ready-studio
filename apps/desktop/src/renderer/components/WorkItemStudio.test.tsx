// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  StudioCallFailure,
  StudioPreloadApi,
} from "../../preload/index.js";
import type { ReviewPackage } from "../useReview.js";
import { WorkItemStudio } from "./WorkItemStudio.js";

afterEach(cleanup);

import { packageWithBaseline } from "./__fixtures__/review-package.js";

const packageWithoutBaseline: ReviewPackage = {
  ...packageWithBaseline,
  acceptedRevision: null,
  evidence: [],
  changedFields: [],
};

describe("WorkItemStudio", () => {
  it("AC-15 and AC-26 render three review regions and reveal run details only from its tab", async () => {
    const { api } = createApi(packageWithBaseline);
    render(<WorkItemStudio api={api} reviewId="review-1" />);

    expect(
      await screen.findByRole("region", { name: "Work Item Studio" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", { name: "Workflow and lineage" }),
    ).toBeTruthy();
    expect(screen.getByRole("region", { name: "Artifact" })).toBeTruthy();
    expect(
      screen.getByRole("complementary", { name: "Review and decision" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Review decision" }),
    ).toBeTruthy();
    expect(screen.queryByText("execution-1")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Run details" }));

    expect(screen.getByText("execution-1")).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Artifact" })).toBeNull();
  });

  it("AC-30 stops offering decisions on the review a save has superseded", async () => {
    // The wiring, not the children. Both `ProductIntentEditor` and
    // `DecisionPanel` take `onPackageChange` optionally and both are proven to
    // call it — but the studio is the only place that supplies it, and deleting
    // that line typechecks cleanly and left the whole suite green. Without it the
    // studio keeps rendering the superseded package with live Approve and
    // Request revision controls, which the service refuses.
    const superseded: ReviewPackage = {
      ...packageWithBaseline,
      review: { ...packageWithBaseline.review, id: "review-2" },
      reviewedRevision: {
        ...packageWithBaseline.reviewedRevision,
        id: "revision-superseding",
        content: {
          ...packageWithBaseline.reviewedRevision.content,
          outcome: "A clearer outcome",
        },
      },
    };
    const { api } = createApi(packageWithBaseline);
    const revise = api.artifact.revise as ReturnType<
      typeof vi.fn<StudioPreloadApi["artifact"]["revise"]>
    >;
    revise.mockResolvedValue({
      ok: true,
      value: {
        kind: "artifact-revision",
        revisionId: "revision-superseding",
        reviewId: "review-2",
      },
    });
    const get = api.review.get as ReturnType<
      typeof vi.fn<StudioPreloadApi["review"]["get"]>
    >;

    render(<WorkItemStudio api={api} reviewId="review-1" />);
    await screen.findByRole("region", { name: "Work Item Studio" });

    // The reload the save triggers returns the new review's package.
    get.mockResolvedValue({
      ok: true,
      value: { kind: "review-package", package: superseded },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save Product Intent" }),
    );

    await screen.findByText("Product Intent saved.");
    // The studio is now showing the review the save opened, not the one it closed.
    expect(get).toHaveBeenLastCalledWith("review-2");
    await waitFor(() =>
      expect(screen.getByDisplayValue("A clearer outcome")).toBeTruthy(),
    );
  });

  it("AC-16 shows exact input lineage, evidence relations, and structured changes", async () => {
    const { api } = createApi(packageWithBaseline);
    render(<WorkItemStudio api={api} reviewId="review-1" />);
    const lineage = await screen.findByRole("region", {
      name: "Workflow and lineage",
    });

    const executionIds = within(
      within(lineage).getByRole("list", { name: "Execution input revisions" }),
    )
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    const proposalIds = within(
      within(lineage).getByRole("list", { name: "Stored proposal lineage" }),
    )
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(executionIds).toEqual(["input-revision-1", "input-revision-2"]);
    expect(proposalIds).toEqual(executionIds);
    expect(
      within(lineage).getByText("Frame a reviewable product intent"),
    ).toBeTruthy();
    expect(within(lineage).getByText("Evidence For")).toBeTruthy();
    expect(
      within(lineage).getByText(/Product interview evidence/),
    ).toBeTruthy();
    const changes = within(lineage).getByRole("region", {
      name: "Change summary",
    });
    expect(within(changes).getByText("Outcome")).toBeTruthy();
    expect(within(changes).getByText("Target Users")).toBeTruthy();
    expect(within(changes).queryByText("Opportunity")).toBeNull();
    expect(
      within(changes).getByText("Teams discuss proposed intent"),
    ).toBeTruthy();
    expect(
      within(changes).getByText("Teams approve explicit, reviewable intent"),
    ).toBeTruthy();
  });

  it("AC-16 uses the required no-evidence and first-proposal copy", async () => {
    const { api } = createApi(packageWithoutBaseline);
    render(<WorkItemStudio api={api} reviewId="review-1" />);

    expect(
      await screen.findByText("No external evidence linked."),
    ).toBeTruthy();
    expect(screen.getByText("No accepted baseline")).toBeTruthy();
  });

  it("AC-35 distinguishes proposal and accepted revisions with text and shape cues", async () => {
    const { api } = createApi(packageWithBaseline);
    render(<WorkItemStudio api={api} reviewId="review-1" />);
    const lineage = await screen.findByRole("region", {
      name: "Workflow and lineage",
    });
    const proposal = within(lineage).getByText("Proposal", {
      selector: ".proposal-label",
    });
    const accepted = within(lineage).getByText("Accepted", {
      selector: ".accepted-label",
    });

    expect(proposal.classList.contains("proposal-label")).toBe(true);
    expect(accepted.classList.contains("accepted-label")).toBe(true);
    expect(proposal.querySelector('[aria-hidden="true"]')?.textContent).toBe(
      "◆",
    );
    expect(accepted.querySelector('[aria-hidden="true"]')?.textContent).toBe(
      "●",
    );
  });

  it("AC-36 gives every interactive control a non-empty accessible name", async () => {
    const { api } = createApi(packageWithBaseline);
    render(<WorkItemStudio api={api} reviewId="review-1" />);
    await screen.findByRole("region", { name: "Work Item Studio" });

    const namedControls = [
      screen.getByRole("tab", { name: "Work item" }),
      screen.getByRole("tab", { name: "Run details" }),
      screen.getByRole("button", { name: "Approve and advance" }),
      screen.getByRole("button", { name: "Request revision" }),
      screen.getByRole("button", { name: "Save Product Intent" }),
      ...[
        "Title",
        "Outcome",
        "Opportunity",
        "Target users",
        "Assumptions",
        "Guardrails",
        "Non-goals",
        "Open questions",
        "Revision comment",
        "Confidence",
      ].map((name) => screen.getByLabelText(name)),
    ];
    const allControls = document.querySelectorAll(
      "button, input, textarea, select, a[href]",
    );

    expect(new Set(namedControls).size).toBe(allControls.length);
  });

  it.each([
    ["disconnected", null, "Service disconnected"],
    ["incompatible", -32001, "Protocol incompatible"],
    ["invalid-response", null, "Execution failed"],
    ["service", -32003, "Execution failed"],
  ] as const)("renders the shared %s failure state", async (kind, code, label) => {
    const failure: StudioCallFailure = {
      kind,
      message: `${label} detail`,
      code,
      data: null,
    };
    const { api } = createApi(packageWithBaseline, { failure });
    render(<WorkItemStudio api={api} reviewId="review-1" />);

    expect(await screen.findByRole("heading", { name: label })).toBeTruthy();
  });

  it("AC-25 renders loading, no-work, retrying, timed-out, and ready states", async () => {
    const pending = new Promise<never>(() => undefined);
    const loadingApi = createApi(packageWithBaseline, { pending }).api;
    const loading = render(
      <WorkItemStudio api={loadingApi} reviewId="review-1" />,
    );
    expect(screen.getByRole("heading", { name: "Loading" })).toBeTruthy();
    loading.unmount();

    const noWork = render(<WorkItemStudio api={loadingApi} reviewId={null} />);
    expect(screen.getByRole("heading", { name: "No work" })).toBeTruthy();
    noWork.unmount();

    const readyApi = createApi(packageWithBaseline).api;
    const ready = render(<WorkItemStudio api={readyApi} reviewId="review-1" />);
    expect(
      await screen.findByRole("region", { name: "Work Item Studio" }),
    ).toBeTruthy();
    ready.unmount();

    const timeout: StudioCallFailure = {
      kind: "timeout",
      message: "Review request timed out",
      code: null,
      data: null,
    };
    const { api, get } = createApi(packageWithBaseline, {
      failure: timeout,
      retryPending: pending,
    });
    render(<WorkItemStudio api={api} reviewId="review-1" />);
    expect(
      await screen.findByRole("heading", { name: "Timed out" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByRole("heading", { name: "Retrying" }),
    ).toBeTruthy();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("AC-48 retries review.get on the live preload connection after a timeout", async () => {
    const timeout: StudioCallFailure = {
      kind: "timeout",
      message: "Review request timed out",
      code: null,
      data: null,
    };
    const { api, get } = createApi(packageWithBaseline, {
      failure: timeout,
      retryPackage: packageWithBaseline,
    });
    render(<WorkItemStudio api={api} reviewId="review-1" />);
    await screen.findByRole("heading", { name: "Timed out" });

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByRole("region", { name: "Work Item Studio" }),
    ).toBeTruthy();
    expect(get).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenNthCalledWith(1, "review-1");
    expect(get).toHaveBeenNthCalledWith(2, "review-1");
  });
});

function createApi(
  reviewPackage: ReviewPackage,
  behavior: Readonly<{
    failure?: StudioCallFailure;
    pending?: Promise<never>;
    retryPackage?: ReviewPackage;
    retryPending?: Promise<never>;
  }> = {},
) {
  const get = vi.fn<StudioPreloadApi["review"]["get"]>();
  if (behavior.pending) {
    get.mockReturnValue(behavior.pending);
  } else if (behavior.failure) {
    get.mockResolvedValueOnce({ ok: false, error: behavior.failure });
    if (behavior.retryPending) get.mockReturnValueOnce(behavior.retryPending);
    if (behavior.retryPackage)
      get.mockResolvedValueOnce({
        ok: true,
        value: { kind: "review-package", package: behavior.retryPackage },
      });
  } else {
    get.mockResolvedValue({
      ok: true,
      value: { kind: "review-package", package: reviewPackage },
    });
  }
  const api: Pick<StudioPreloadApi, "artifact" | "review"> = {
    artifact: {
      revise: vi.fn<StudioPreloadApi["artifact"]["revise"]>(),
    },
    review: {
      list: vi.fn<StudioPreloadApi["review"]["list"]>(),
      get,
      resolve: vi.fn<StudioPreloadApi["review"]["resolve"]>(),
    },
  };
  return { api, get };
}
