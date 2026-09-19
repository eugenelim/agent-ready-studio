// The reasons themselves are protocol vocabulary: the renderer displays them
// and may not import this package. Re-exported here so existing importers of
// this module are unchanged.
import { SOURCE_REJECTION_REASONS } from "@agent-ready/protocol";

export { SOURCE_REJECTION_REASONS };

export type SourceRejectionCode = keyof typeof SOURCE_REJECTION_REASONS;

export interface CanonicalSourceIdentity {
  owner: string;
  repository: string;
}

export type CanonicalSourceResult =
  | {
      ok: true;
      identity: CanonicalSourceIdentity;
      requestedRef?: string;
    }
  | {
      ok: false;
      code: SourceRejectionCode;
      reason: (typeof SOURCE_REJECTION_REASONS)[SourceRejectionCode];
    };

const OWNER_OR_REPOSITORY = /^[A-Za-z0-9._-]{1,100}$/;
const REF = /^[A-Za-z0-9._/-]{1,255}$/;

function reject(code: SourceRejectionCode): CanonicalSourceResult {
  return { ok: false, code, reason: SOURCE_REJECTION_REASONS[code] };
}

function isOwnerOrRepository(value: string): boolean {
  return (
    OWNER_OR_REPOSITORY.test(value) &&
    !value.startsWith("-") &&
    !value.startsWith(".")
  );
}

function isRef(value: string): boolean {
  return (
    REF.test(value) &&
    !value.startsWith("-") &&
    !value.startsWith("/") &&
    !value.endsWith("/") &&
    !value.includes("..")
  );
}

function decodePathSegment(value: string): string | undefined {
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

function carriesExplicitPort(submittedUrl: string): boolean {
  const urlParserInput = submittedUrl.replace(/[\t\n\r]/g, "").trimStart();
  const authority = /^[A-Za-z][A-Za-z0-9+.-]*:\/\/([^/?#]*)/.exec(
    urlParserInput,
  )?.[1];
  if (authority === undefined) {
    return false;
  }
  const hostAndPort = authority.slice(authority.lastIndexOf("@") + 1);
  return hostAndPort.includes(":");
}

export function canonicalizeSource(
  submittedUrl: string,
  requestedRef?: string,
): CanonicalSourceResult {
  let parsed: URL;
  try {
    parsed = new URL(submittedUrl);
  } catch {
    return reject("publicGithubOnly");
  }

  if (parsed.username !== "" || parsed.password !== "") {
    return reject("embeddedCredentials");
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname.toLowerCase() !== "github.com" ||
    carriesExplicitPort(submittedUrl)
  ) {
    return reject("publicGithubOnly");
  }

  const match = /^\/([^/]+)\/([^/]+)\/?$/.exec(parsed.pathname);
  if (match === null) {
    return reject("repositoryMainPageOnly");
  }

  const owner = decodePathSegment(match[1] ?? "");
  const repository = decodePathSegment(match[2] ?? "");
  if (
    owner === undefined ||
    repository === undefined ||
    !isOwnerOrRepository(owner) ||
    !isOwnerOrRepository(repository)
  ) {
    return reject("invalidOwnerOrRepository");
  }
  if (requestedRef !== undefined && !isRef(requestedRef)) {
    return reject("invalidRef");
  }

  return {
    ok: true,
    identity: { owner, repository },
    ...(requestedRef === undefined ? {} : { requestedRef }),
  };
}

export function buildFetchUrl(identity: CanonicalSourceIdentity): string {
  return `https://github.com/${identity.owner}/${identity.repository}`;
}
