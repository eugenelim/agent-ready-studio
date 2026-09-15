import { describe, expect, it } from "vitest";

import {
  buildFetchUrl,
  canonicalizeSource,
  SOURCE_REJECTION_REASONS,
  type SourceRejectionCode,
} from "./source-identity.js";

// biome-ignore format: approved plan stub must remain byte-identical
it("AC-0010 builds the fetch target from the canonical identity", () => {
 const out = canonicalizeSource("https://github.com/owner/repo?x=@evil");
 expect(out.ok && buildFetchUrl(out.identity)).toBe("https://github.com/owner/repo");
});

function expectRejected(
  input: string,
  code: SourceRejectionCode,
  ref?: string,
) {
  expect(canonicalizeSource(input, ref)).toEqual({
    ok: false,
    code,
    reason: SOURCE_REJECTION_REASONS[code],
  });
}

describe("canonicalizeSource", () => {
  it.each([
    ["https://github.com/owner/repo", "owner", "repo"],
    ["https://GITHUB.com/Owner/Repo/", "Owner", "Repo"],
    ["https://github.com/%6fwner/repo?ignored=yes#ignored", "owner", "repo"],
    ["https://git\thub.com/owner/repo", "owner", "repo"],
    ["https://github.com/ow\nner/repo", "owner", "repo"],
  ])("AC-0001/AC-0005 records the canonical identity for %s", (input, owner, repository) => {
    expect(canonicalizeSource(input)).toEqual({
      ok: true,
      identity: { owner, repository },
    });
  });

  it.each([
    "http://github.com/owner/repo",
    "https://example.com/owner/repo",
    "https://notgithub.com/owner/repo",
    "https://github.com./owner/repo",
    "https://github.com:443/owner/repo",
    "not a URL",
  ])("AC-0002 refuses a non-permitted source: %s", (input) => {
    expectRejected(input, "publicGithubOnly");
  });

  it.each([
    "https://user@github.com/owner/repo",
    "https://user:token@github.com/owner/repo",
    "https://user@name@github.com/owner/repo",
  ])("AC-0003 refuses embedded credentials: %s", (input) => {
    expectRejected(input, "embeddedCredentials");
  });

  it.each([
    "https://github.com/owner",
    "https://github.com/owner/repo/tree/main",
    "https://github.com/owner//repo",
    "https://github.com\\evil.example/owner/repo",
  ])("AC-0004 refuses a path other than a repository main page: %s", (input) => {
    expectRejected(input, "repositoryMainPageOnly");
  });

  it.each([
    "https://github.com/-owner/repo",
    "https://github.com/.owner/repo",
    "https://github.com/owner/-repo",
    "https://github.com/owner/re%2Fpo",
    `https://github.com/${"o".repeat(101)}/repo`,
  ])("AC-0006 refuses a non-canonical owner or repository: %s", (input) => {
    expectRejected(input, "invalidOwnerOrRepository");
  });

  it.each([
    "-main",
    "/main",
    "main/",
    "feature..branch",
    "feature name",
    "main\nnext",
    "r".repeat(256),
  ])("AC-0007 refuses a non-canonical requested ref: %s", (ref) => {
    expectRejected("https://github.com/owner/repo", "invalidRef", ref);
  });

  it("AC-0007 records a canonical requested ref separately", () => {
    expect(
      canonicalizeSource("https://github.com/owner/repo", "feature/one"),
    ).toEqual({
      ok: true,
      identity: { owner: "owner", repository: "repo" },
      requestedRef: "feature/one",
    });
  });

  it.each([
    "https://github.com/owner/repo?next=https://user:token@evil.example",
    "https://github.com/owner/repo#https://user@evil.example",
    "https://github.com/%6fwner/repo",
  ])("AC-0010 never reuses the submitted string as the fetch target: %s", (input) => {
    const result = canonicalizeSource(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(buildFetchUrl(result.identity)).toBe(
        "https://github.com/owner/repo",
      );
      expect(buildFetchUrl(result.identity)).not.toBe(input);
    }
  });

  it("keeps every rejection reason distinguishable", () => {
    expect(new Set(Object.values(SOURCE_REJECTION_REASONS)).size).toBe(
      Object.keys(SOURCE_REJECTION_REASONS).length,
    );
  });
});
