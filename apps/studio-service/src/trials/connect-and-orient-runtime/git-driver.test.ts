import { describe, expect, it } from "vitest";

import type { CanonicalSourceIdentity } from "../../source-identity.js";
import {
  createGitTransport,
  GIT_REDIRECT_REFUSAL,
  type GitInvocation,
  type RevisionTransport,
  resolveRevision,
} from "./git-driver.js";

const identity: CanonicalSourceIdentity = {
  owner: "owner",
  repository: "repository",
};
const exactSha = "0123456789abcdef0123456789abcdef01234567";

function injectedTransport(
  options: { defaultBranch?: string; sha?: string } = {},
): RevisionTransport {
  return {
    async resolve() {
      return {
        reportedRef: options.defaultBranch ?? "main",
        sha: options.sha ?? exactSha,
      };
    },
  };
}

// biome-ignore format: approved plan stub must remain byte-identical
it("AC-0008 refuses a remote default branch outside the ref charset", async () => {
 const t = injectedTransport({ defaultBranch: "--upload-pack=/bin/sh" });
 await expect(resolveRevision(identity, t)).resolves.toMatchObject({ ok: false });
});

describe("remote revision resolution", () => {
  it.each([
    "-main",
    "/main",
    "main/",
    "feature..branch",
    "feature name",
    "main\nnext",
    "r".repeat(256),
  ])("AC-0008 refuses a remote-reported ref outside the ref charset: %s", async (defaultBranch) => {
    await expect(
      resolveRevision(identity, injectedTransport({ defaultBranch })),
    ).resolves.toEqual({ ok: false, code: "invalid-remote-ref" });
  });

  it("AC-0011 resolves a ref to an exact 40-character commit SHA", async () => {
    await expect(
      resolveRevision(identity, injectedTransport()),
    ).resolves.toMatchObject({
      ok: true,
      resolvedRef: "main",
      resolvedSha: exactSha,
    });
  });

  it.each([
    exactSha.slice(0, 12),
    `${exactSha.slice(0, 39)}g`,
    `${exactSha}0`,
  ])("AC-0011 refuses a non-exact commit SHA: %s", async (sha) => {
    await expect(
      resolveRevision(identity, injectedTransport({ sha })),
    ).resolves.toEqual({ ok: false, code: "invalid-resolved-sha" });
  });

  it("AC-0013 keeps the requested ref separate from the resolved SHA", async () => {
    const result = await resolveRevision(
      identity,
      injectedTransport({ defaultBranch: "feature/one" }),
      "feature/one",
    );
    expect(result).toMatchObject({
      ok: true,
      requestedRef: "feature/one",
      resolvedRef: "feature/one",
      resolvedSha: exactSha,
    });
    expect(result.ok && result.resolvedSha).not.toBe("feature/one");
  });
});

describe("git transport command contract", () => {
  it("carries the redirect refusal on the resolution vector", async () => {
    // Resolution is the only Git phase this module still performs.
    // AC-0009's materialization leg is bound where materialization happens,
    // against every vector a real child emits:
    // `runtime-supervisor.test.ts` "AC-0022 carries the complete pinned git
    // configuration on every git argument vector". The audit's AC-0009 row
    // cites that case, not this file.
    const invocations: GitInvocation[] = [];
    const transport = createGitTransport("/usr/bin/git", async (invocation) => {
      invocations.push(invocation);
      return { stdout: `${exactSha}\trefs/heads/feature/one\n` };
    });

    await resolveRevision(identity, transport, "feature/one");

    expect(invocations).toHaveLength(1);
    for (const invocation of invocations) {
      expect(invocation.executable).toBe("/usr/bin/git");
      expect(invocation.args).toContain(GIT_REDIRECT_REFUSAL);
    }
  });

  it("uses the canonical identity on the resolution vector", async () => {
    const invocations: GitInvocation[] = [];
    const transport = createGitTransport("/usr/bin/git", async (invocation) => {
      invocations.push(invocation);
      return { stdout: `${exactSha}\trefs/heads/feature/one\n` };
    });

    await resolveRevision(identity, transport, "feature/one");

    const resolutionInvocation = invocations.find(({ args }) =>
      args.includes("ls-remote"),
    );
    expect(
      resolutionInvocation?.args.slice(
        resolutionInvocation.args.indexOf("--") + 1,
      ),
    ).toEqual(["https://github.com/owner/repository", "feature/one"]);
  });

  it("parses the remote-reported default branch and its exact SHA", async () => {
    const transport = createGitTransport("/usr/bin/git", async () => ({
      stdout: `ref: refs/heads/main\tHEAD\n${exactSha}\tHEAD\n`,
    }));

    await expect(
      transport.resolve("https://github.com/owner/repository"),
    ).resolves.toEqual({ reportedRef: "main", sha: exactSha });
  });

  it("refuses a non-absolute git executable", () => {
    expect(() =>
      createGitTransport("git", async () => ({ stdout: "" })),
    ).toThrow("git executable must be an absolute path");
  });
});

// Deferred assertion for T12: every rendered verdict surface shows this exact
// inspectedSha and offers it for copying; no renderer exists in T3.
