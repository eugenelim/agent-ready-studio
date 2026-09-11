// @vitest-environment jsdom

import type { StudioResult } from "@agent-ready/protocol";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { StudioPreloadApi } from "../../preload/index.js";
import { DecisionPanel } from "./DecisionPanel.js";

afterEach(cleanup);

type ReviewPackage = StudioResult<"review.get">["package"];

const timestamp = "2026-09-09T12:00:00.000Z";
const productIntent: ReviewPackage["reviewedRevision"]["content"] = {
  title: "Keep product decisions reviewable",
  outcome: "Teams can advance accepted intent",
  opportunity: "Make approval explicit",
  targetUsers: ["Product team"],
  assumptions: [],
  guardrails: [],
  nonGoals: [],
  confidence: "medium",
  openQuestions: [],
};
const proposedRevision: ReviewPackage["reviewedRevision"] = {
  id: "revision-2",
  artifactId: "artifact-1",
  schemaVersion: "1",
  content: productIntent,
  producer: "deterministic",
  transformationId: "strategy.frame-product-intent",
  inputRevisionIds: ["revision-1"],
  status: "proposed",
  createdAt: timestamp,
};
const openReviewPackage: ReviewPackage = {
  review: {
    id: "review-1",
    workspaceId: "workspace-1",
    artifactId: "artifact-1",
    revisionId: "revision-2",
    artifactTitle: "Product Intent",
    artifactType: "product-intent",
    reason: "Product intent requires approval",
    producer: "deterministic",
    status: "open",
    createdAt: timestamp,
    unresolvedQuestionCount: 0,
  },
  workspace: {
    id: "workspace-1",
    name: "Product team",
    blueprintId: "product-development",
    blueprintVersion: "1",
    installedCapabilityPacks: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  initiativeTitle: "Build Agent-Ready Studio",
  artifactTitle: "Product Intent",
  artifactType: "product-intent",
  reviewedRevision: proposedRevision,
  acceptedRevision: null,
  inputs: [],
  evidence: [],
  comments: [],
  decisions: [],
  changedFields: [],
  execution: null,
};
const acceptedRevision: ReviewPackage["reviewedRevision"] = {
  ...proposedRevision,
  status: "accepted",
};
const resolvedDecision: ReviewPackage["decisions"][number] = {
  id: "decision-1",
  reviewId: "review-1",
  revisionId: "revision-2",
  actorId: "actor-1",
  actorName: "Avery Reviewer",
  action: "approve",
  comment: "The proposal meets the decision criteria.",
  createdAt: timestamp,
};
const resolvedReviewPackage: ReviewPackage = {
  ...openReviewPackage,
  review: { ...openReviewPackage.review, status: "resolved" },
  reviewedRevision: acceptedRevision,
  acceptedRevision,
  decisions: [resolvedDecision],
};

describe("DecisionPanel", () => {
  it("approves an open review and reflects the resolved package", async () => {
    const { api, get, resolve } = createReviewApi();
    render(<DecisionPanel api={api} reviewPackage={openReviewPackage} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Approve and advance" }),
    );

    await waitFor(() => expect(resolve).toHaveBeenCalledOnce());
    expect(resolve).toHaveBeenCalledWith({
      reviewId: "review-1",
      action: "approve",
    });
    await waitFor(() => expect(get).toHaveBeenCalledWith("review-1"));
    expect(await screen.findByText("Resolved")).toBeTruthy();
  });

  it.each([
    "",
    "   ",
  ])("refuses a %j revision comment without issuing a call", (comment) => {
    const { api, resolve } = createReviewApi();
    render(<DecisionPanel api={api} reviewPackage={openReviewPackage} />);
    const field = screen.getByLabelText("Revision comment");

    fireEvent.change(field, { target: { value: comment } });
    fireEvent.click(screen.getByRole("button", { name: "Request revision" }));

    expect(resolve).not.toHaveBeenCalled();
    const message = screen.getByText(
      "Enter a revision comment before requesting changes.",
    );
    expect(field.getAttribute("aria-describedby")).toBe(message.id);
    expect(field.getAttribute("aria-invalid")).toBe("true");
  });

  it("requests revision with the trimmed required comment", async () => {
    const { api, resolve } = createReviewApi({
      getPackage: {
        ...resolvedReviewPackage,
        review: { ...resolvedReviewPackage.review, status: "revision-needed" },
        acceptedRevision: null,
        reviewedRevision: proposedRevision,
        decisions: [
          {
            ...resolvedDecision,
            action: "request-revision",
            comment: "Clarify the target users.",
          },
        ],
      },
      resolutionStatus: "revision-needed",
    });
    render(<DecisionPanel api={api} reviewPackage={openReviewPackage} />);

    fireEvent.change(screen.getByLabelText("Revision comment"), {
      target: { value: "  Clarify the target users.  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request revision" }));

    await waitFor(() => expect(resolve).toHaveBeenCalledOnce());
    expect(resolve).toHaveBeenCalledWith({
      reviewId: "review-1",
      action: "request-revision",
      comment: "Clarify the target users.",
    });
    expect(await screen.findByText("Revision Needed")).toBeTruthy();
  });

  it.each([
    ["stale", -32003],
    ["duplicate", -32004],
  ] as const)("labels a %s decision conflict and reloads the package", async (_case, code) => {
    const { api, get, resolve } = createReviewApi({
      resolveFailure: {
        kind: "service",
        message: "This review was already resolved",
        code,
        data: {
          kind: "conflict",
          resourceType: "review",
          id: "review-1",
          currentStatus: "resolved",
        },
      },
    });
    render(<DecisionPanel api={api} reviewPackage={openReviewPackage} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Approve and advance" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Review conflict" }),
    ).toBeTruthy();
    expect(resolve).toHaveBeenCalledOnce();
    expect(get).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "Reload review package" }),
    );
    expect(await screen.findByText("Resolved")).toBeTruthy();
    expect(get).toHaveBeenCalledWith("review-1");
  });

  it("AC-44 renders resolved decision details only from the loaded package", () => {
    const { api } = createReviewApi();
    render(<DecisionPanel api={api} reviewPackage={resolvedReviewPackage} />);

    expect(screen.getByText("decision-1")).toBeTruthy();
    expect(screen.getByText("Avery Reviewer")).toBeTruthy();
    expect(screen.queryByText("actor-1")).toBeNull();
    expect(screen.getByText("Approve")).toBeTruthy();
    expect(
      screen.getByText("The proposal meets the decision criteria."),
    ).toBeTruthy();
    expect(screen.getByText(timestamp)).toBeTruthy();
  });
});

function createReviewApi(
  options: Readonly<{
    getPackage?: ReviewPackage;
    resolutionStatus?: "accepted" | "revision-needed";
    resolveFailure?: Readonly<{
      kind: "service";
      message: string;
      code: number;
      data: unknown;
    }>;
  }> = {},
) {
  const get = vi.fn<StudioPreloadApi["review"]["get"]>().mockResolvedValue({
    ok: true,
    value: {
      kind: "review-package",
      package: options.getPackage ?? resolvedReviewPackage,
    },
  });
  const resolve = vi.fn<StudioPreloadApi["review"]["resolve"]>();
  if (options.resolveFailure) {
    resolve.mockResolvedValue({ ok: false, error: options.resolveFailure });
  } else {
    resolve.mockResolvedValue({
      ok: true,
      value: {
        kind: "review-resolution",
        reviewId: "review-1",
        revisionId: "revision-2",
        decisionId: "decision-1",
        status: options.resolutionStatus ?? "accepted",
      },
    });
  }
  const api: Pick<StudioPreloadApi, "review"> = {
    review: {
      list: vi.fn<StudioPreloadApi["review"]["list"]>(),
      get,
      resolve,
    },
  };
  return { api, get, resolve };
}
