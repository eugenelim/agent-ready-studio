// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { StudioPreloadApi } from "../preload/index.js";
import { useReviews } from "./useReviews.js";

const summary = (id: string, workspaceId: string) => ({
  id,
  workspaceId,
  artifactId: "artifact-1",
  revisionId: "revision-1",
  artifactTitle: id,
  artifactType: "product-intent",
  reason: "Product Intent needs a decision",
  producer: "strategy.frame-product-intent",
  status: "open" as const,
  createdAt: "2026-09-09T12:00:00.000Z",
  unresolvedQuestionCount: 0,
});

describe("useReviews", () => {
  it("ignores an earlier read of the same workspace that settles last", async () => {
    // A -> B -> A. Both reads are for a workspace that is current when they
    // settle, so a guard keyed on workspace identity passes them both and the
    // slower first one wins. Only a per-request key rejects it. This is the
    // class round 17 re-keyed for, and it is the one an id-keyed guard cannot
    // catch.
    const pending: Array<{ id: string; resolve: () => void }> = [];
    let issued = 0;
    const list = vi.fn(
      (workspaceId?: string) =>
        new Promise((resolve) => {
          // The sequence number is captured now, at issue time. Reading
          // `pending.length` inside the closure would evaluate it at resolve
          // time, when every read has the same value — which made an earlier
          // version of this test unable to tell the reads apart at all.
          issued += 1;
          const sequence = issued;
          pending.push({
            id: workspaceId ?? "",
            resolve: () =>
              resolve({
                ok: true,
                value: {
                  kind: "reviews",
                  items: [
                    summary(`${workspaceId}-${sequence}`, workspaceId ?? ""),
                  ],
                },
              }),
          });
        }),
    );
    const api = { review: { list } } as unknown as Pick<
      StudioPreloadApi,
      "review"
    >;

    const { rerender, result } = renderHook(
      ({ id }: { id: string }) => useReviews(id, true, api),
      { initialProps: { id: "workspace-a" } },
    );
    rerender({ id: "workspace-b" });
    rerender({ id: "workspace-a" });

    // Three reads are outstanding: A(1), B(2), A(3). Settle the newest first,
    // then the oldest — which is also for workspace A, and so passes any guard
    // that only compares workspace ids.
    const [first, , third] = pending;
    await act(async () => {
      third?.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      first?.resolve();
      await Promise.resolve();
    });

    const state = result.current.state;
    if (state.kind !== "ready") throw new Error("Expected a ready state");
    expect(state.items.map((item) => item.id)).toEqual(["workspace-a-3"]);
  });

  it("ignores a response that arrives after the workspace selection is cleared", async () => {
    // The branch round 18 repaired: the no-workspace path resolves the surface
    // without issuing a call, so it has to invalidate whatever is already in
    // flight. Otherwise the older read settles afterwards and renders the old
    // workspace's list under a cleared picker — permanently, because this
    // surface has no periodic refresh.
    const deferred: Array<() => void> = [];
    const list = vi.fn(
      () =>
        new Promise((resolve) => {
          deferred.push(() =>
            resolve({
              ok: true,
              value: {
                kind: "reviews",
                items: [summary("stale", "workspace-slow")],
              },
            }),
          );
        }),
    );
    const api = { review: { list } } as unknown as Pick<
      StudioPreloadApi,
      "review"
    >;

    const { rerender, result } = renderHook(
      ({ id }: { id: string | null }) => useReviews(id, true, api),
      { initialProps: { id: "workspace-slow" as string | null } },
    );

    rerender({ id: null });
    await waitFor(() => expect(result.current.state.kind).toBe("no-work"));

    await act(async () => {
      for (const resolve of deferred.splice(0)) resolve();
      await Promise.resolve();
    });

    expect(result.current.state.kind).toBe("no-work");
  });

  it("ignores a slower response for a workspace the user has left", async () => {
    // The first call resolves *after* the second. Without an in-flight guard the
    // stale list wins, and this surface has no periodic refresh to correct it.
    const deferred: Array<() => void> = [];
    const list = vi.fn((workspaceId?: string) => {
      if (workspaceId === "workspace-slow")
        return new Promise((resolve) => {
          deferred.push(() =>
            resolve({
              ok: true,
              value: {
                kind: "reviews",
                items: [summary("slow", "workspace-slow")],
              },
            }),
          );
        });
      return Promise.resolve({
        ok: true,
        value: { kind: "reviews", items: [summary("fast", "workspace-fast")] },
      });
    });
    const api = { review: { list } } as unknown as Pick<
      StudioPreloadApi,
      "review"
    >;

    const { rerender, result } = renderHook(
      ({ id }: { id: string }) => useReviews(id, true, api),
      { initialProps: { id: "workspace-slow" } },
    );

    rerender({ id: "workspace-fast" });
    await waitFor(() => expect(result.current.state.kind).toBe("ready"));

    // Now let the abandoned workspace's response arrive.
    await act(async () => {
      for (const resolve of deferred.splice(0)) resolve();
      await Promise.resolve();
    });

    const state = result.current.state;
    if (state.kind !== "ready") throw new Error("Expected a ready state");
    expect(state.items.map((item) => item.id)).toEqual(["fast"]);
  });
});
