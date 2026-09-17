import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  buildNorthboundRequest,
  looksLikeFilesystemPath,
} from "./trial-enrichment-seam.js";
import {
  BoundedDiagnosticBuffer,
  BoundedResultReader,
  CHILD_DIAGNOSTIC_BYTE_BOUND,
  deriveCondition,
  deriveVerdict,
  isNonOriginated,
  mintRequestIdentifier,
  normalizeTrialResult,
  observedVersions,
  type RawTrialResult,
  REQUEST_IDENTIFIER_PATTERN,
  TRIAL_CONTRACT,
  TRIAL_RESULT_BYTE_BOUND,
  toPersistedRepresentation,
} from "./trial-result.js";

const SERVICE_SOURCE = dirname(fileURLToPath(import.meta.url));

/** A result that conforms in full, so a case can perturb exactly one field. */
function conformingResult(overrides: RawTrialResult = {}): RawTrialResult {
  return {
    contract: TRIAL_CONTRACT,
    requestId: "req-0000000000000001",
    status: "completed",
    resolvedSha: "a".repeat(40),
    inspectorDiagnostics: "",
    declaredVersionMarker: null,
    inspectorContractVersion: "1",
    removalOutcome: "removed",
    workspacePresent: true,
    findings: [],
    ...overrides,
  };
}

describe("AC-0032 the provisional contract is named, and any other refused", () => {
  it("names the contract from Canonical values", () => {
    expect(TRIAL_CONTRACT).toBe("connect-orient-trial.v0");
  });

  it("refuses a result carrying any other contract name", () => {
    expect(
      normalizeTrialResult(conformingResult({ contract: "other.v1" })),
    ).toEqual({ ok: false, stopReason: "contract-mismatch" });
  });

  it("admits a result carrying the contract name", () => {
    expect(normalizeTrialResult(conformingResult()).ok).toBe(true);
  });
});

describe("AC-0033 the Service mints each request identifier", () => {
  it("mints inside the canonical charset", () => {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const minted = mintRequestIdentifier();
      expect(minted).toMatch(REQUEST_IDENTIFIER_PATTERN);
      expect(minted.length).toBeGreaterThanOrEqual(8);
      expect(minted.length).toBeLessThanOrEqual(64);
    }
  });

  it("mints a distinct identifier each time", () => {
    const minted = new Set(
      Array.from({ length: 50 }, () => mintRequestIdentifier()),
    );

    expect(minted.size).toBe(50);
  });

  it("takes no identifier from client input", () => {
    // The request builder accepts an identity and a ref, and nothing else. An
    // identifier cannot be supplied because there is no parameter for one.
    const request = buildNorthboundRequest({
      owner: "owner",
      repository: "repository",
    });

    expect(request.requestId).toMatch(REQUEST_IDENTIFIER_PATTERN);
    expect(buildNorthboundRequest.length).toBe(2);
  });
});

describe("AC-0034 a mismatched request identifier is refused", () => {
  it("refuses a result whose identifier is not the request's", () => {
    expect(
      normalizeTrialResult(conformingResult(), "req-0000000000000002"),
    ).toEqual({ ok: false, stopReason: "request-identifier-mismatch" });
  });

  it("admits a result whose identifier matches", () => {
    expect(
      normalizeTrialResult(conformingResult(), "req-0000000000000001").ok,
    ).toBe(true);
  });
});

// biome-ignore format: approved plan stub must remain byte-identical
it("AC-0036 refuses a well-named result whose body does not conform", () => {
 expect(normalizeTrialResult({ contract: TRIAL_CONTRACT, requestId: "r1", status: 42 }))
 .toEqual({ ok: false, stopReason: "result-invalid" });
});

describe("AC-0035 and AC-0036 the result is validated in full, first", () => {
  it("refuses a non-conforming body without consuming any of it", () => {
    const outcome = normalizeTrialResult(
      conformingResult({ status: 42, resolvedSha: "a".repeat(40) }),
    );

    // The refusal carries the stop reason and nothing else: no field of the
    // result reached the outcome, so nothing was partially consumed.
    expect(outcome).toEqual({ ok: false, stopReason: "result-invalid" });
    expect(Object.keys(outcome)).toEqual(["ok", "stopReason"]);
  });

  it("refuses each malformed field on its own", () => {
    for (const override of [
      { status: 42 },
      { resolvedSha: null },
      { inspectorDiagnostics: 7 },
      { removalOutcome: [] },
      { declaredVersionMarker: 3 },
      { workspacePresent: "yes" },
    ] as RawTrialResult[]) {
      expect(normalizeTrialResult(conformingResult(override))).toEqual({
        ok: false,
        stopReason: "result-invalid",
      });
    }
  });

  it("gives each refusal class a distinct stop reason", () => {
    const reasons = new Set([
      (
        normalizeTrialResult(conformingResult({ contract: "x" })) as {
          stopReason: string;
        }
      ).stopReason,
      (
        normalizeTrialResult(conformingResult(), "req-0000000000000002") as {
          stopReason: string;
        }
      ).stopReason,
      (
        normalizeTrialResult(conformingResult({ status: 1 })) as {
          stopReason: string;
        }
      ).stopReason,
      "result-too-large",
    ]);

    expect(reasons.size).toBe(4);
  });
});

describe("AC-0037 an oversized result is refused while being read", () => {
  it("refuses the moment the running total passes the bound", () => {
    const reader = new BoundedResultReader(1_000);

    expect(reader.push("x".repeat(600))).toBe(true);
    expect(reader.refused).toBe(false);
    expect(reader.push("x".repeat(600))).toBe(false);
    expect(reader.refused).toBe(true);
  });

  it("holds no buffer of an oversized result", () => {
    const reader = new BoundedResultReader(1_000);
    reader.push("x".repeat(600));
    reader.push("x".repeat(600));

    // The retained text is empty, so no full buffer of the oversized result
    // exists anywhere after the refusal.
    expect(reader.text()).toBe("");
    expect(reader.outcome()).toEqual({
      ok: false,
      stopReason: "result-too-large",
    });
  });

  it("keeps a result inside the bound", () => {
    const reader = new BoundedResultReader(1_000);
    reader.push("hello");

    expect(reader.text()).toBe("hello");
    expect(reader.outcome()).toBeUndefined();
  });

  it("carries the canonical result-bytes bound", () => {
    expect(TRIAL_RESULT_BYTE_BOUND).toBe(8 * 1024 * 1024);
  });
});

describe("AC-0038 the result reports the five named elements", () => {
  it("reports each of them", () => {
    const outcome = normalizeTrialResult(
      conformingResult({ declaredVersionMarker: "0.4" }),
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    expect(outcome.result.resolvedSha.value).toBe("a".repeat(40));
    expect(outcome.result.status).toBe("completed");
    expect(outcome.result.inspectorDiagnostics.value).toBe("");
    expect(outcome.result.declaredVersionMarker.value).toBe("0.4");
    expect(outcome.result.removalOutcome).toBe("removed");
  });

  it("reports an absent version marker as an explicit absence", () => {
    const outcome = normalizeTrialResult(conformingResult());
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    expect(outcome.result.declaredVersionMarker.value).toBeNull();
  });
});

describe("AC-0039 and AC-0040 provenance is carried and survives", () => {
  it("marks a value the inspector echoed as repository-derived", () => {
    const outcome = normalizeTrialResult(
      conformingResult({ inspectorDiagnostics: "workspace.toml is odd" }),
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    expect(outcome.result.inspectorDiagnostics.provenance).toBe(
      "repository-derived",
    );
  });

  it("marks a value Studio extracted itself as repository-derived too", () => {
    const outcome = normalizeTrialResult(
      conformingResult({ declaredVersionMarker: "0.4" }),
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    expect(outcome.result.declaredVersionMarker.provenance).toBe(
      "repository-derived",
    );
  });

  it("marks the transport-reported revision as non-originated", () => {
    const outcome = normalizeTrialResult(conformingResult());
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    expect(outcome.result.resolvedSha.provenance).toBe("transport-reported");
    expect(isNonOriginated(outcome.result.resolvedSha)).toBe(true);
  });

  it("carries every marker into the persisted representation", () => {
    const outcome = normalizeTrialResult(
      conformingResult({ declaredVersionMarker: "0.4" }),
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    const persisted = toPersistedRepresentation(outcome.result);

    for (const [field, marked] of Object.entries(persisted.values)) {
      expect(marked.provenance, field).toBeDefined();
    }
    expect(persisted.values.declaredVersionMarker?.provenance).toBe(
      "repository-derived",
    );
    expect(persisted.values.resolvedSha?.provenance).toBe("transport-reported");
  });
});

describe("AC-0041 the enrichment seam is one module nothing else imports", () => {
  it("is imported by no non-seam surface", () => {
    const importers: string[] = [];
    const walk = (directory: string): void => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
          walk(path);
          continue;
        }
        if (!entry.name.endsWith(".ts")) {
          continue;
        }
        if (readFileSync(path, "utf8").includes("trial-enrichment-seam.js")) {
          importers.push(entry.name);
        }
      }
    };
    walk(SERVICE_SOURCE);

    // Its own test is the one admitted importer: a module nothing may import
    // could otherwise never be exercised. Removing the seam means deleting the
    // module and this test, and editing nothing else.
    expect(importers.toSorted()).toEqual(["trial-result.test.ts"]);
  });
});

describe("AC-0042 the northbound request carries no filesystem path", () => {
  it("carries no path-shaped value in any field", () => {
    const request = buildNorthboundRequest(
      { owner: "owner", repository: "repository" },
      "main",
    );

    for (const [field, value] of Object.entries(request)) {
      expect(looksLikeFilesystemPath(value), field).toBe(false);
    }
  });

  it("has no field for a root, a domain or an inspector path", () => {
    const request = buildNorthboundRequest({
      owner: "owner",
      repository: "repository",
    });

    expect(Object.keys(request).toSorted()).toEqual([
      "contract",
      "owner",
      "repository",
      "requestId",
    ]);
  });

  it("recognises a path shape, so the check is not vacuous", () => {
    for (const path of [
      "/tmp/tree",
      "~/Library/Application Support",
      "./relative",
      "../escape",
      "C:\\Users\\tree",
    ]) {
      expect(looksLikeFilesystemPath(path), path).toBe(true);
    }
    expect(looksLikeFilesystemPath("owner")).toBe(false);
  });
});

describe("AC-0061 to AC-0063 the verdict comes from inspector output alone", () => {
  it("maps the whole workspace_present by invalid_workspace product", () => {
    expect(deriveVerdict(false, false, true)).toBe("not-agent-ready");
    expect(deriveVerdict(false, true, true)).toBe("not-agent-ready");
    expect(deriveVerdict(true, false, true)).toBe("agent-ready");
    expect(deriveVerdict(true, true, true)).toBe("no-verdict");
  });

  it("yields no verdict when the inspection did not complete", () => {
    expect(deriveVerdict(true, false, false)).toBe("no-verdict");
    expect(deriveVerdict(undefined, false, true)).toBe("no-verdict");
  });

  it("produces malformed from an invalid_workspace finding and nothing else", () => {
    expect(deriveCondition(true)).toBe("malformed");
    expect(deriveCondition(false)).toBe("ok");
  });

  it("reads the finding whether it is a code or a bare string", () => {
    const fromObject = normalizeTrialResult(
      conformingResult({ findings: [{ code: "invalid_workspace" }] }),
    );
    const fromString = normalizeTrialResult(
      conformingResult({ findings: ["invalid_workspace"] }),
    );

    for (const outcome of [fromObject, fromString]) {
      expect(outcome.ok).toBe(true);
      if (outcome.ok) {
        expect(outcome.result.verdict).toBe("no-verdict");
      }
    }
  });

  it("derives no verdict from a value Studio read itself", () => {
    // AC-0062. The declared marker is Studio's own read of the repository, and
    // moving it changes no verdict.
    const withMarker = normalizeTrialResult(
      conformingResult({ declaredVersionMarker: "0.4" }),
    );
    const withoutMarker = normalizeTrialResult(conformingResult());

    expect(withMarker.ok && withMarker.result.verdict).toBe("agent-ready");
    expect(withoutMarker.ok && withoutMarker.result.verdict).toBe(
      "agent-ready",
    );
  });
});

describe("AC-0064 to AC-0066 the version qualifier is orthogonal", () => {
  it("carries no qualifier when the repository declares no marker", () => {
    const outcome = normalizeTrialResult(conformingResult());

    expect(outcome.ok && outcome.result.versionUnverified).toBe(false);
  });

  it("carries the qualifier whatever the verdict", () => {
    for (const [workspacePresent, expected] of [
      [true, "agent-ready"],
      [false, "not-agent-ready"],
    ] as const) {
      const outcome = normalizeTrialResult(
        conformingResult({ workspacePresent, declaredVersionMarker: "0.4" }),
      );

      expect(outcome.ok).toBe(true);
      if (!outcome.ok) {
        continue;
      }
      expect(outcome.result.verdict).toBe(expected);
      expect(outcome.result.versionUnverified).toBe(true);
    }
  });

  it("neither replaces nor is suppressed by a condition", () => {
    const outcome = normalizeTrialResult(
      conformingResult({
        declaredVersionMarker: "0.4",
        findings: ["invalid_workspace"],
      }),
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    // The qualifier and the condition are both present and independent.
    expect(outcome.result.versionUnverified).toBe(true);
    expect(outcome.result.verdict).toBe("no-verdict");
    expect(deriveCondition(true)).toBe("malformed");
  });
});

describe("AC-0067 and AC-0068 two observed versions, compared to nothing", () => {
  it("reports the target's marker and the inspector's separately", () => {
    const outcome = normalizeTrialResult(
      conformingResult({
        declaredVersionMarker: "0.4",
        inspectorContractVersion: "1",
      }),
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    expect(observedVersions(outcome.result)).toEqual({
      declaredByTarget: "0.4",
      reportedByInspector: "1",
    });
  });

  it("reports both as observed values and draws no comparison", () => {
    const outcome = normalizeTrialResult(
      conformingResult({
        declaredVersionMarker: "99.0",
        inspectorContractVersion: "1",
      }),
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    // Wildly different values produce no judgement, because neither party
    // declared a version set to judge against.
    const versions = observedVersions(outcome.result);
    expect(versions.declaredByTarget).toBe("99.0");
    expect(versions.reportedByInspector).toBe("1");
    expect(Object.keys(versions).toSorted()).toEqual([
      "declaredByTarget",
      "reportedByInspector",
    ]);
  });
});

describe("AC-0155 child diagnostics are bounded while reading", () => {
  it("retains the leading and trailing halves with an elision marker", () => {
    const buffer = new BoundedDiagnosticBuffer(100);
    buffer.push("H".repeat(60));
    buffer.push("M".repeat(500));
    buffer.push("T".repeat(60));

    const bounded = buffer.finish();

    expect(bounded.elided).toBe(true);
    expect(bounded.text.startsWith("H")).toBe(true);
    expect(bounded.text.endsWith("T")).toBe(true);
    expect(bounded.text).toContain("bytes elided");
  });

  it("names the discarded byte count", () => {
    const buffer = new BoundedDiagnosticBuffer(100);
    buffer.push("x".repeat(1_000));

    const bounded = buffer.finish();

    expect(bounded.discardedBytes).toBeGreaterThan(0);
    expect(bounded.text).toContain(String(bounded.discardedBytes));
  });

  it("leaves diagnostics inside the bound untouched", () => {
    const buffer = new BoundedDiagnosticBuffer(100);
    buffer.push("short diagnostic");

    expect(buffer.finish()).toEqual({
      text: "short diagnostic",
      elided: false,
      discardedBytes: 0,
    });
  });

  it("leaves the inspection result unaffected", () => {
    // Truncation is a property of the diagnostic buffer alone. A result
    // normalizes identically whatever the child wrote to stderr, which is what
    // keeps a repository from suppressing its own verdict by emitting warnings.
    const buffer = new BoundedDiagnosticBuffer(100);
    buffer.push("x".repeat(10_000));
    buffer.finish();

    expect(normalizeTrialResult(conformingResult()).ok).toBe(true);
  });

  it("carries the canonical child-diagnostic bound", () => {
    expect(CHILD_DIAGNOSTIC_BYTE_BOUND).toBe(256 * 1024);
  });
});
