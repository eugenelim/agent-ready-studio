// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { StudioPreloadApi } from "../../preload/index.js";
import type { ReviewPackage } from "../useReview.js";
import { ProductIntentEditor } from "./ProductIntentEditor.js";

afterEach(cleanup);

const timestamp = "2026-09-09T12:00:00.000Z";
const reviewPackage = {
  review: {
    id: "review-1",
    workspaceId: "workspace-1",
    artifactId: "artifact-1",
    revisionId: "revision-loaded",
    artifactTitle: "Product Intent",
    artifactType: "product-intent",
    reason: "Review requested",
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
  initiativeTitle: "Initiative",
  artifactTitle: "Product Intent",
  artifactType: "product-intent",
  reviewedRevision: {
    id: "revision-loaded",
    artifactId: "artifact-1",
    schemaVersion: "1",
    content: {
      title: "Original title",
      outcome: "Original outcome",
      opportunity: "Original opportunity",
      targetUsers: ["Original user"],
      assumptions: [],
      guardrails: [],
      nonGoals: [],
      confidence: "low",
      openQuestions: [],
    },
    producer: "deterministic",
    transformationId: "strategy.frame-product-intent",
    inputRevisionIds: ["input-revision-1"],
    status: "proposed",
    createdAt: timestamp,
  },
  acceptedRevision: null,
  inputs: [],
  evidence: [],
  comments: [],
  decisions: [],
  changedFields: [],
  execution: null,
} satisfies ReviewPackage;

const supersededPackage = {
  ...reviewPackage,
  review: { ...reviewPackage.review, id: "review-2", status: "open" },
} satisfies ReviewPackage;

function createApi(
  overrides: Partial<{
    revise: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  }> = {},
) {
  const revise =
    overrides.revise ??
    vi.fn<StudioPreloadApi["artifact"]["revise"]>().mockResolvedValue({
      ok: true,
      value: {
        kind: "artifact-revision",
        revisionId: "revision-3",
        reviewId: "review-2",
      },
    });
  const get =
    overrides.get ??
    vi.fn<StudioPreloadApi["review"]["get"]>().mockResolvedValue({
      ok: true,
      value: { kind: "review-package", package: supersededPackage },
    });
  const api = {
    artifact: { revise },
    review: { get, list: vi.fn(), resolve: vi.fn() },
  } as unknown as Pick<StudioPreloadApi, "artifact" | "review">;
  return { api, get, revise };
}

describe("ProductIntentEditor", () => {
  it("AC-30 refuses to save without the required fields, and never calls the service", async () => {
    // The refusal is client-side, so the assertion that matters is the one that
    // proves nothing was sent: a message with a request behind it would leave a
    // revision on disk that the user was told had not been saved.
    const { api, revise } = createApi();
    render(<ProductIntentEditor api={api} reviewPackage={reviewPackage} />);

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "   " },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save Product Intent" }),
    );

    expect(
      await screen.findByText(
        "Complete the required Product Intent fields before saving.",
      ),
    ).toBeTruthy();
    expect(revise).not.toHaveBeenCalled();
  });

  it("AC-30 reports a refused save with the service's own message", async () => {
    // `stale-base` is AC-30's own refusal: a concurrent proposal moved the base
    // the form was loaded against.
    const revise = vi
      .fn<StudioPreloadApi["artifact"]["revise"]>()
      .mockResolvedValue({
        ok: false,
        error: {
          kind: "service",
          message: "Revision base is stale",
          code: -32004,
          data: null,
        },
      });
    const { api } = createApi({ revise });
    render(<ProductIntentEditor api={api} reviewPackage={reviewPackage} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Save Product Intent" }),
    );

    expect(await screen.findByText("Revision base is stale")).toBeTruthy();
  });

  it("AC-30 moves the surface onto the new review rather than the superseded one", async () => {
    // Without this the studio keeps rendering the package it loaded, whose review
    // the save just superseded, with Approve and Request revision still live
    // against it — decisions the service refuses, offered as though available.
    const onPackageChange = vi.fn();
    const { api, get } = createApi();
    render(
      <ProductIntentEditor
        api={api}
        onPackageChange={onPackageChange}
        reviewPackage={reviewPackage}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Save Product Intent" }),
    );

    await waitFor(() => expect(get).toHaveBeenCalledWith("review-2"));
    expect(onPackageChange).toHaveBeenCalledWith(supersededPackage);
    expect(await screen.findByText("Product Intent saved.")).toBeTruthy();
  });

  it("edits all Product Intent fields and saves against the loaded base revision", async () => {
    const revise = vi
      .fn<StudioPreloadApi["artifact"]["revise"]>()
      .mockResolvedValue({
        ok: true,
        value: {
          kind: "artifact-revision",
          revisionId: "revision-3",
          reviewId: "review-2",
        },
      });
    const { api } = createApi({ revise });
    render(<ProductIntentEditor api={api} reviewPackage={reviewPackage} />);

    const changes = [
      ["Title", "Revised title"],
      ["Outcome", "Revised outcome"],
      ["Opportunity", "Revised opportunity"],
      ["Target users", "Product lead\nDesigner"],
      ["Assumptions", "Users need review\nLocal data is enough"],
      ["Guardrails", "Keep decisions explicit"],
      ["Non-goals", "Automated approval"],
      ["Open questions", "Which team pilots first?"],
    ] as const;
    for (const [label, value] of changes) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    fireEvent.change(screen.getByLabelText("Confidence"), {
      target: { value: "high" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save Product Intent" }),
    );

    await waitFor(() => expect(revise).toHaveBeenCalledOnce());
    expect(revise).toHaveBeenCalledWith({
      artifactId: "artifact-1",
      baseRevisionId: "revision-loaded",
      content: {
        title: "Revised title",
        outcome: "Revised outcome",
        opportunity: "Revised opportunity",
        targetUsers: ["Product lead", "Designer"],
        assumptions: ["Users need review", "Local data is enough"],
        guardrails: ["Keep decisions explicit"],
        nonGoals: ["Automated approval"],
        confidence: "high",
        openQuestions: ["Which team pilots first?"],
      },
    });
    expect(await screen.findByText("Product Intent saved.")).toBeTruthy();
  });
});
