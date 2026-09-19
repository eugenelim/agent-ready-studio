/**
 * The composition's own tests. Every piece below was unit-tested before this
 * module existed and none of them was assembled, which is how a whole slice
 * shipped unwired -- see the retraction entry in the verification ledger.
 */
import { describe, expect, it, vi } from "vitest";
import {
  createSourceInspections,
  type InspectionOutcome,
  type SourceInspectionDependencies,
} from "./source-inspection.js";

const SHA = "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d";

function deps(
  overrides: Partial<SourceInspectionDependencies> = {},
): SourceInspectionDependencies {
  return {
    transport: {
      resolve: vi.fn(async () => ({ sha: SHA, reportedRef: "main" })),
      materialize: vi.fn(async () => undefined),
      readHead: vi.fn(async () => SHA),
    },
    inspect: vi.fn(
      async (): Promise<InspectionOutcome> => ({
        ok: false,
        condition: "inspector-unavailable",
        diagnostics: "no trusted inspector ran",
      }),
    ),
    ...overrides,
  } as SourceInspectionDependencies;
}

const settled = async () => {
  for (let tick = 0; tick < 12; tick += 1) await Promise.resolve();
};

describe("a refused URL is answered without starting an inspection", () => {
  it("returns url-rejected with the cause's own reason", () => {
    const transport = deps();
    const sources = createSourceInspections(transport);
    const refused = sources.connect("https://example.com/acme/widgets");

    expect(refused.phase).toBe("url-rejected");
    expect(refused.diagnostics).toBe(
      "Studio connects to public github.com repositories only",
    );
    // No transport is consulted for a refusal: the answer is complete without
    // one, and reaching a remote to refuse a URL would be a leak.
    expect(transport.transport.resolve).not.toHaveBeenCalled();
    expect(transport.inspect).not.toHaveBeenCalled();
  });

  it("distinguishes each pre-submission cause", () => {
    const sources = createSourceInspections(deps());
    const reasons = new Set(
      [
        "https://example.com/acme/widgets",
        "https://user:token@github.com/acme/widgets",
        "https://github.com/acme/widgets/tree/main/src",
      ].map((url) => sources.connect(url).diagnostics),
    );
    expect(reasons.size).toBe(3);
  });
});

describe("an accepted URL runs the pipeline", () => {
  it("returns resolving immediately and never blocks the dispatch", () => {
    const sources = createSourceInspections(deps());
    const started = sources.connect("https://github.com/acme/widgets");
    expect(started.phase).toBe("resolving");
    expect(started.owner).toBe("acme");
    expect(started.repository).toBe("widgets");
  });

  it("materializes in the Runtime and never in this process", async () => {
    const d = deps();
    const sources = createSourceInspections(d);
    const started = sources.connect("https://github.com/acme/widgets");
    await settled();

    // The tree is untrusted content. The Service asking the Runtime for it,
    // rather than writing it here, is the isolation the boundary exists for.
    expect(d.inspect).toHaveBeenCalledTimes(1);
    expect(d.transport.materialize).not.toHaveBeenCalled();
    const request = (d.inspect as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(request.revision.resolvedSha).toBe(SHA);
    expect(request.revision.fetchUrl).toContain("github.com/acme/widgets");
    expect(sources.get(started.sourceId)?.resolvedSha).toBe(SHA);
  });

  it("reports inspector-unavailable rather than inventing a verdict", async () => {
    const sources = createSourceInspections(deps());
    const started = sources.connect("https://github.com/acme/widgets");
    await settled();

    const held = sources.get(started.sourceId);
    // AC-0061: a verdict comes only from trusted inspector output. With none,
    // the honest answer is no verdict and a condition that says why.
    expect(held?.verdict).toBe("no-verdict");
    expect(held?.condition).toBe("inspector-unavailable");
    expect(held?.phase).toBeNull();
  });

  it("derives the verdict from the inspector's output when there is some", async () => {
    const sources = createSourceInspections(
      deps({
        inspect: vi.fn(
          async (): Promise<InspectionOutcome> => ({
            ok: true,
            completed: true,
            workspacePresent: true,
            invalidWorkspace: false,
            diagnostics: "",
          }),
        ),
      }),
    );
    const started = sources.connect("https://github.com/acme/widgets");
    await settled();

    const held = sources.get(started.sourceId);
    expect(held?.verdict).toBe("agent-ready");
    expect(held?.condition).toBe("ok");
  });

  it("carries a malformed workspace as its own condition", async () => {
    const sources = createSourceInspections(
      deps({
        inspect: vi.fn(
          async (): Promise<InspectionOutcome> => ({
            ok: true,
            completed: true,
            workspacePresent: true,
            invalidWorkspace: true,
            diagnostics: "",
          }),
        ),
      }),
    );
    const started = sources.connect("https://github.com/acme/widgets");
    await settled();

    const held = sources.get(started.sourceId);
    // AC-0063: the invalid_workspace finding produces `malformed` and the
    // verdict is not determined, which is `no-verdict` rather than a failure.
    expect(held?.condition).toBe("malformed");
    expect(held?.verdict).toBe("no-verdict");
  });

  it("reports a resolution failure as the source being unreachable", async () => {
    const sources = createSourceInspections(
      deps({
        transport: {
          resolve: vi.fn(async () => {
            throw new Error("host unreachable");
          }),
          materialize: vi.fn(async () => undefined),
          readHead: vi.fn(async () => SHA),
        },
      }),
    );
    const started = sources.connect("https://github.com/acme/widgets");
    await settled();

    const held = sources.get(started.sourceId);
    expect(held?.verdict).toBe("no-verdict");
    expect(held?.condition).toBe("inspection-stopped");
  });
});

describe("a head mismatch is its own stop reason", () => {
  it("reports the downloaded copy not matching the commit asked for", async () => {
    const sources = createSourceInspections(
      deps({
        inspect: vi.fn(
          async (): Promise<InspectionOutcome> => ({
            ok: false,
            condition: "inspection-stopped",
            diagnostics:
              "the downloaded copy did not match the commit Studio asked for",
          }),
        ),
      }),
    );
    const started = sources.connect("https://github.com/acme/widgets");
    await settled();

    const held = sources.get(started.sourceId);
    expect(held?.condition).toBe("inspection-stopped");
    // The stop reason the vocabulary carries, not a generic failure: moving
    // materialization into the child brought the fetch and the checkout
    // without bringing the verification this names.
    expect(held?.diagnostics).toContain("did not match the commit");
  });
});

describe("cancelling", () => {
  it("stops the run and does not let it report afterwards", async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const sources = createSourceInspections(
      deps({
        inspect: vi.fn(async (): Promise<InspectionOutcome> => {
          await gate;
          return {
            ok: true,
            completed: true,
            workspacePresent: true,
            invalidWorkspace: false,
            diagnostics: "",
          };
        }),
      }),
    );
    const started = sources.connect("https://github.com/acme/widgets");
    await settled();

    const cancelled = sources.cancel(started.sourceId);
    expect(cancelled?.condition).toBe("cancelled");

    release?.();
    await settled();
    // A pipeline that reported after the lead stopped it would tell them the
    // inspection they cancelled had finished.
    expect(sources.get(started.sourceId)?.condition).toBe("cancelled");
  });

  it("reports an unknown source as absent rather than inventing one", () => {
    const sources = createSourceInspections(deps());
    expect(sources.get("source-nope")).toBeUndefined();
    expect(sources.cancel("source-nope")).toBeUndefined();
  });
});
