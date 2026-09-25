import { isAbsolute } from "node:path";

import {
  buildFetchUrl,
  type CanonicalSourceIdentity,
  canonicalizeSource,
} from "../../source-identity.js";

export const GIT_REDIRECT_REFUSAL = "http.followRedirects=false";

/**
 * The pinned `git` configuration from the specification's *Canonical values*,
 * complete and in the order it is written there. A command-line `-c` outranks
 * every configuration file, so these pairs lead every argument vector.
 */
export const PINNED_GIT_CONFIGURATION = [
  GIT_REDIRECT_REFUSAL,
  "core.hooksPath=/dev/null",
  "core.symlinks=false",
  "core.protectHFS=true",
  "core.protectNTFS=true",
  "core.fsmonitor=false",
  "protocol.version=2",
  "submodule.recurse=false",
  "credential.helper=",
  "transfer.fsckObjects=true",
  "maintenance.auto=false",
  "gc.auto=0",
  "advice.detachedHead=false",
] as const;

export function pinnedGitConfigurationArgs(): string[] {
  return PINNED_GIT_CONFIGURATION.flatMap((setting) => ["-c", setting]);
}

export interface RevisionTransport {
  resolve(
    fetchUrl: string,
    requestedRef?: string,
  ): Promise<{ reportedRef: string; sha: string }>;
}

// **Materialization is not here.** The Runtime child fetches, checks out and
// verifies `HEAD` itself, because the tree is untrusted content and the
// Service having written it would make the process boundary's central
// isolation claim false. A `materialize`/`readHead` pair and a
// `materializeRevision` over them lived here until 2026-09-24, unreached by
// any production path since materialization moved; the reason they were
// deleted rather than wired is at
// `notes/verification-ledger.md#slice-f1-step-c-2026-09-24`.
//
// A line comment, not a doc block: there is no declaration for it to
// document, and a `/** */` here attaches to whatever happens to follow.

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
  return [...pinnedGitConfigurationArgs(), command, ...args];
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
