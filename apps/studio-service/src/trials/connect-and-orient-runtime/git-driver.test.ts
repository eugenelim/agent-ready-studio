import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import type { CanonicalSourceIdentity } from "../../source-identity.js";
import {
  createGitTransport,
  GIT_REDIRECT_REFUSAL,
  type GitInvocation,
  materializeRevision,
  type RevisionTransport,
  resolveRevision,
} from "./git-driver.js";

const identity: CanonicalSourceIdentity = {
  owner: "owner",
  repository: "repository",
};
const exactSha = "0123456789abcdef0123456789abcdef01234567";
const temporaryRoots: string[] = [];

function injectedTransport(
  options: { defaultBranch?: string; sha?: string; head?: string } = {},
): RevisionTransport {
  return {
    async resolve() {
      return {
        reportedRef: options.defaultBranch ?? "main",
        sha: options.sha ?? exactSha,
      };
    },
    async materialize() {},
    async readHead() {
      return options.head ?? options.sha ?? exactSha;
    },
  };
}

function temporaryMaterializationRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "connect-orient-t3-"));
  temporaryRoots.push(root);
  return root;
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

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

describe("materialized revision verification", () => {
  it("AC-0012 verifies HEAD inside the supplied materialization root", async () => {
    const root = temporaryMaterializationRoot();
    const calls: string[] = [];
    const transport = injectedTransport();
    transport.materialize = async (_url, _sha, materializationRoot) => {
      calls.push(`materialize:${materializationRoot}`);
    };
    transport.readHead = async (materializationRoot) => {
      calls.push(`head:${materializationRoot}`);
      return exactSha;
    };
    const resolution = await resolveRevision(identity, transport);
    expect(resolution.ok).toBe(true);
    if (!resolution.ok) {
      return;
    }

    await expect(
      materializeRevision(resolution, root, transport),
    ).resolves.toMatchObject({ ok: true, inspectedSha: exactSha });
    expect(calls).toEqual([`materialize:${root}`, `head:${root}`]);
  });

  it("AC-0012 refuses a materialized HEAD that differs from the resolved SHA", async () => {
    const resolution = await resolveRevision(identity, injectedTransport());
    expect(resolution.ok).toBe(true);
    if (!resolution.ok) {
      return;
    }
    const otherSha = "f".repeat(40);

    await expect(
      materializeRevision(
        resolution,
        temporaryMaterializationRoot(),
        injectedTransport({ head: otherSha }),
      ),
    ).resolves.toEqual({
      ok: false,
      code: "head-mismatch",
      expectedSha: exactSha,
      actualSha: otherSha,
    });
  });

  it("AC-0014 exposes the exact SHA without replacing it with an abbreviation", async () => {
    const resolution = await resolveRevision(identity, injectedTransport());
    expect(resolution.ok).toBe(true);
    if (!resolution.ok) {
      return;
    }

    const result = await materializeRevision(
      resolution,
      temporaryMaterializationRoot(),
      injectedTransport(),
    );
    expect(result).toMatchObject({
      ok: true,
      resolvedSha: exactSha,
      inspectedSha: exactSha,
    });
    expect(result.ok && result.inspectedSha).toHaveLength(40);
  });
});

describe("git transport command contract", () => {
  it("AC-0009 pins redirect refusal on both Git phases", async () => {
    const invocations: GitInvocation[] = [];
    const transport = createGitTransport("/usr/bin/git", async (invocation) => {
      invocations.push(invocation);
      if (invocation.args.includes("ls-remote")) {
        return {
          stdout: `${exactSha}\trefs/heads/feature/one\n`,
        };
      }
      if (invocation.args.includes("rev-parse")) {
        return { stdout: `${exactSha}\n` };
      }
      return { stdout: "" };
    });

    const resolution = await resolveRevision(
      identity,
      transport,
      "feature/one",
    );
    expect(resolution.ok).toBe(true);
    if (!resolution.ok) {
      return;
    }
    await materializeRevision(
      resolution,
      temporaryMaterializationRoot(),
      transport,
    );

    expect(invocations).toHaveLength(5);
    const materializationRoot = invocations[1]?.cwd;
    expect(materializationRoot).toBeDefined();
    expect(invocations.slice(1).map(({ cwd }) => cwd)).toEqual([
      materializationRoot,
      materializationRoot,
      materializationRoot,
      materializationRoot,
    ]);
    for (const invocation of invocations) {
      expect(invocation.executable).toBe("/usr/bin/git");
      expect(invocation.args).toContain(GIT_REDIRECT_REFUSAL);
    }
  });

  it("uses the canonical identity for both remote Git phases", async () => {
    const invocations: GitInvocation[] = [];
    const transport = createGitTransport("/usr/bin/git", async (invocation) => {
      invocations.push(invocation);
      if (invocation.args.includes("ls-remote")) {
        return {
          stdout: `${exactSha}\trefs/heads/feature/one\n`,
        };
      }
      if (invocation.args.includes("rev-parse")) {
        return { stdout: `${exactSha}\n` };
      }
      return { stdout: "" };
    });
    const resolution = await resolveRevision(
      identity,
      transport,
      "feature/one",
    );
    expect(resolution.ok).toBe(true);
    if (!resolution.ok) {
      return;
    }
    await materializeRevision(
      resolution,
      temporaryMaterializationRoot(),
      transport,
    );

    const target = "https://github.com/owner/repository";
    const resolutionInvocation = invocations.find(({ args }) =>
      args.includes("ls-remote"),
    );
    const materializationInvocation = invocations.find(({ args }) =>
      args.includes("fetch"),
    );
    const checkoutInvocation = invocations.find(({ args }) =>
      args.includes("checkout"),
    );
    const headInvocation = invocations.find(({ args }) =>
      args.includes("rev-parse"),
    );
    expect(
      resolutionInvocation?.args.slice(
        resolutionInvocation.args.indexOf("--") + 1,
      ),
    ).toEqual([target, "feature/one"]);
    expect(
      materializationInvocation?.args.slice(
        materializationInvocation.args.indexOf("--") + 1,
      ),
    ).toEqual([target, exactSha]);
    expect(checkoutInvocation?.args.slice(-4)).toEqual([
      "checkout",
      "--detach",
      "--force",
      "FETCH_HEAD",
    ]);
    expect(headInvocation?.args.slice(-3)).toEqual([
      "rev-parse",
      "--verify",
      "HEAD",
    ]);
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
