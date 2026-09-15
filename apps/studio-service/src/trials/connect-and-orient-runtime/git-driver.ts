import { isAbsolute } from "node:path";

import {
  buildFetchUrl,
  type CanonicalSourceIdentity,
  canonicalizeSource,
} from "../../source-identity.js";

export const GIT_REDIRECT_REFUSAL = "http.followRedirects=false";

export interface RevisionTransport {
  resolve(
    fetchUrl: string,
    requestedRef?: string,
  ): Promise<{ reportedRef: string; sha: string }>;
  materialize(
    fetchUrl: string,
    resolvedSha: string,
    materializationRoot: string,
  ): Promise<void>;
  readHead(materializationRoot: string): Promise<string>;
}

export interface ResolvedRevision {
  identity: CanonicalSourceIdentity;
  requestedRef?: string;
  resolvedRef: string;
  resolvedSha: string;
}

export type RevisionResolution =
  | ({ ok: true } & ResolvedRevision)
  | {
      ok: false;
      code: "invalid-remote-ref" | "invalid-resolved-sha";
    };

export type MaterializationVerification =
  | ({ ok: true; inspectedSha: string } & ResolvedRevision)
  | {
      ok: false;
      code: "head-mismatch";
      expectedSha: string;
      actualSha: string;
    };

export interface GitInvocation {
  executable: string;
  args: readonly string[];
  cwd?: string;
}

export interface GitCommandOutput {
  stdout: string;
}

export type GitCommandRunner = (
  invocation: GitInvocation,
) => Promise<GitCommandOutput>;

const EXACT_COMMIT_SHA = /^[0-9a-f]{40}$/;

function gitArgs(command: string, ...args: readonly string[]): string[] {
  return ["-c", GIT_REDIRECT_REFUSAL, command, ...args];
}

function parseResolutionOutput(
  stdout: string,
  requestedRef?: string,
): { reportedRef: string; sha: string } {
  const lines = stdout.split("\n").filter(Boolean);
  if (requestedRef !== undefined) {
    return {
      reportedRef: requestedRef,
      sha:
        lines.find((line) => !line.startsWith("ref: "))?.split("\t")[0] ?? "",
    };
  }

  const symbolicHead = lines.find((line) => line.startsWith("ref: "));
  const head = lines.find(
    (line) => !line.startsWith("ref: ") && line.endsWith("\tHEAD"),
  );
  return {
    reportedRef:
      symbolicHead?.split("\t")[0]?.replace(/^ref: refs\/heads\//, "") ?? "",
    sha: head?.split("\t")[0] ?? "",
  };
}

export function createGitTransport(
  gitExecutable: string,
  run: GitCommandRunner,
): RevisionTransport {
  if (!isAbsolute(gitExecutable)) {
    throw new Error("git executable must be an absolute path");
  }

  return {
    async resolve(fetchUrl, requestedRef) {
      const output = await run({
        executable: gitExecutable,
        args: gitArgs(
          "ls-remote",
          "--symref",
          "--",
          fetchUrl,
          requestedRef ?? "HEAD",
        ),
      });
      return parseResolutionOutput(output.stdout, requestedRef);
    },

    async materialize(fetchUrl, resolvedSha, materializationRoot) {
      await run({
        executable: gitExecutable,
        args: gitArgs("init", "--", "."),
        cwd: materializationRoot,
      });
      await run({
        executable: gitExecutable,
        args: gitArgs(
          "fetch",
          "--depth=1",
          "--no-tags",
          "--",
          fetchUrl,
          resolvedSha,
        ),
        cwd: materializationRoot,
      });
      await run({
        executable: gitExecutable,
        args: gitArgs("checkout", "--detach", "--force", "FETCH_HEAD"),
        cwd: materializationRoot,
      });
    },

    async readHead(materializationRoot) {
      const output = await run({
        executable: gitExecutable,
        args: gitArgs("rev-parse", "--verify", "HEAD"),
        cwd: materializationRoot,
      });
      return output.stdout.trim();
    },
  };
}

export async function resolveRevision(
  identity: CanonicalSourceIdentity,
  transport: RevisionTransport,
  requestedRef?: string,
): Promise<RevisionResolution> {
  const fetchUrl = buildFetchUrl(identity);
  const resolved = await transport.resolve(fetchUrl, requestedRef);
  const remoteRef = canonicalizeSource(fetchUrl, resolved.reportedRef);
  if (!remoteRef.ok) {
    return { ok: false, code: "invalid-remote-ref" };
  }
  if (!EXACT_COMMIT_SHA.test(resolved.sha)) {
    return { ok: false, code: "invalid-resolved-sha" };
  }

  return {
    ok: true,
    identity,
    ...(requestedRef === undefined ? {} : { requestedRef }),
    resolvedRef: resolved.reportedRef,
    resolvedSha: resolved.sha,
  };
}

export async function materializeRevision(
  revision: ResolvedRevision,
  materializationRoot: string,
  transport: RevisionTransport,
): Promise<MaterializationVerification> {
  await transport.materialize(
    buildFetchUrl(revision.identity),
    revision.resolvedSha,
    materializationRoot,
  );
  const actualSha = await transport.readHead(materializationRoot);
  if (actualSha !== revision.resolvedSha) {
    return {
      ok: false,
      code: "head-mismatch",
      expectedSha: revision.resolvedSha,
      actualSha,
    };
  }
  return { ok: true, ...revision, inspectedSha: actualSha };
}
