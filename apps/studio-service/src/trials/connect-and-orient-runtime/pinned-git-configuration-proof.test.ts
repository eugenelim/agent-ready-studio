import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PINNED_GIT_CONFIGURATION } from "./git-driver.js";
import {
  buildHostileFixture,
  disposeHostileFixtures,
  materialize,
  observeProcessTree,
  PROBE_LOG_MARKER,
} from "./test/hostile-fixture.js";

// These cases spawn real Git processes and exercise local transports.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

type PinSetting = (typeof PINNED_GIT_CONFIGURATION)[number];
type Classification = "behavioral" | "constant-only";

interface GitResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

interface PinProof {
  setting: PinSetting;
  classification: Classification;
  observation: string;
  observe?: () => Promise<{
    pinned: unknown;
    omitted: unknown;
  }>;
}

const tempRoots = new Set<string>();

afterEach(() => {
  disposeHostileFixtures();
  for (const root of tempRoots) {
    rmSync(root, { recursive: true, force: true });
  }
  tempRoots.clear();
});

function makeTempRoot(prefix: string): string {
  const path = mkdtempSync(join(tmpdir(), prefix));
  tempRoots.add(path);
  return path;
}

function pinArgs(mutation?: { setting: PinSetting }): string[] {
  return PINNED_GIT_CONFIGURATION.flatMap((setting) => {
    if (setting !== mutation?.setting) {
      return ["-c", setting];
    }
    return [];
  });
}

function pinArgsAfterAmbient(
  ambientSetting: string,
  mutation?: { setting: PinSetting },
): string[] {
  return ["-c", ambientSetting, ...pinArgs(mutation)];
}

function gitEnv(
  cwd: string,
  extra?: Record<string, string>,
): Record<string, string> {
  return {
    PATH: "/usr/bin:/bin",
    HOME: join(cwd, ".fixture-home"),
    LANG: "C",
    LC_ALL: "C",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_SYSTEM: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z",
    GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z",
    ...extra,
  };
}

function runGit(
  cwd: string,
  args: readonly string[],
  options: { input?: string; env?: Record<string, string> } = {},
): GitResult {
  const result = spawnSync("/usr/bin/git", [...args], {
    cwd,
    encoding: "utf8",
    env: gitEnv(cwd, options.env),
    input: options.input,
  });
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

// The redirect proof drives a listener inside this process, so its Git child
// must not be spawned synchronously: spawnSync parks the event loop, the server
// never answers the request, and Git waits for a response that cannot arrive.
function runGitAsync(
  cwd: string,
  args: readonly string[],
  options: { env?: Record<string, string> } = {},
): Promise<GitResult> {
  return new Promise((resolve, reject) => {
    const child = spawn("/usr/bin/git", [...args], {
      cwd,
      env: gitEnv(cwd, options.env),
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => (stdout += chunk));
    child.stderr.on("data", (chunk: string) => (stderr += chunk));
    child.once("error", reject);
    child.once("close", (status) => resolve({ status, stdout, stderr }));
  });
}

function expectGitOk(result: GitResult, command: string): string {
  if (result.status !== 0) {
    throw new Error(`git ${command} failed: ${result.stderr}`);
  }
  return result.stdout.trim();
}

function write(root: string, relativePath: string, contents: string): void {
  const target = join(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents, "utf8");
}

function createNormalRepository(root: string): {
  source: string;
  sourceUrl: string;
  commit: string;
} {
  const source = join(root, "source");
  mkdirSync(source, { recursive: true });
  expectGitOk(runGit(source, ["init", "--initial-branch=main"]), "init");
  expectGitOk(
    runGit(source, ["config", "user.name", "Fixture Builder"]),
    "config",
  );
  expectGitOk(
    runGit(source, ["config", "user.email", "fixture@example.com"]),
    "config",
  );
  write(source, "README.md", "normal\n");
  expectGitOk(runGit(source, ["add", "--all"]), "add");
  expectGitOk(runGit(source, ["commit", "-m", "fixture: normal"]), "commit");
  return {
    source,
    sourceUrl: pathToFileURL(source).href,
    commit: expectGitOk(runGit(source, ["rev-parse", "HEAD"]), "rev-parse"),
  };
}

function createMalformedCommitRepository(root: string): {
  sourceUrl: string;
  commit: string;
} {
  const repo = createNormalRepository(root);
  const tree = expectGitOk(
    runGit(repo.source, ["rev-parse", "HEAD^{tree}"]),
    "rev-parse",
  );
  const malformedCommit = [
    `tree ${tree}`,
    "author Fixture Builder <fixture@example.com> 946684800 +0000",
    "committer Fixture Builder <fixture@example.com>946684800 +0000",
    "",
    "malformed committer line",
    "",
  ].join("\n");
  const commit = expectGitOk(
    runGit(
      repo.source,
      ["hash-object", "-t", "commit", "-w", "--literally", "--stdin"],
      {
        input: malformedCommit,
      },
    ),
    "hash-object",
  );
  expectGitOk(
    runGit(repo.source, ["update-ref", "refs/heads/main", commit]),
    "update-ref",
  );
  return { sourceUrl: repo.sourceUrl, commit };
}

async function observeHooksPathPin(): Promise<{
  pinned: unknown;
  omitted: unknown;
}> {
  const pinnedFixture = await buildHostileFixture({
    caseId: "repository-hook",
  });
  const pinned = await observeProcessTree(() => materialize(pinnedFixture));
  const omittedFixture = await buildHostileFixture({
    caseId: "repository-hook",
    omitPinPrefix: "core.hooksPath",
  });
  const omitted = await observeProcessTree(() => materialize(omittedFixture));
  return {
    pinned: pinned.map(({ argv0 }) => argv0),
    omitted: omitted.map(({ argv0 }) => argv0),
  };
}

async function observeSymlinkPin(): Promise<{
  pinned: unknown;
  omitted: unknown;
}> {
  const pinnedFixture = await buildHostileFixture({
    caseId: "escaping-symlink",
  });
  await materialize(pinnedFixture);
  const omittedFixture = await buildHostileFixture({
    caseId: "escaping-symlink",
    omitPinPrefix: "core.symlinks",
  });
  await materialize(omittedFixture);
  return {
    pinned: lstatSync(join(pinnedFixture.worktree, "escape")).isSymbolicLink(),
    omitted: lstatSync(
      join(omittedFixture.worktree, "escape"),
    ).isSymbolicLink(),
  };
}

async function observeTransferFsckPin(): Promise<{
  pinned: unknown;
  omitted: unknown;
}> {
  const root = makeTempRoot("connect-orient-pin-fsck-");
  const repo = createMalformedCommitRepository(root);
  const pinned = runGit(root, [
    ...pinArgs(),
    "clone",
    "--no-local",
    repo.sourceUrl,
    join(root, "pinned"),
  ]);
  const omitted = runGit(root, [
    ...pinArgs({ setting: "transfer.fsckObjects=true" }),
    "clone",
    "--no-local",
    repo.sourceUrl,
    join(root, "omitted"),
  ]);
  return {
    pinned: { status: pinned.status, refused: pinned.status !== 0 },
    omitted: {
      status: omitted.status,
      accepted: existsSync(join(root, "omitted", ".git")),
    },
  };
}

async function observeProtocolVersionPin(): Promise<{
  pinned: unknown;
  omitted: unknown;
}> {
  const root = makeTempRoot("connect-orient-pin-protocol-");
  const repo = createNormalRepository(root);
  for (const target of ["pinned", "omitted"]) {
    mkdirSync(join(root, target), { recursive: true });
    expectGitOk(runGit(join(root, target), ["init", "--quiet"]), "init");
  }
  const pinned = runGit(
    join(root, "pinned"),
    [
      ...pinArgsAfterAmbient("protocol.version=1"),
      "fetch",
      "--depth=1",
      "--no-tags",
      "--",
      repo.sourceUrl,
      "refs/heads/main",
    ],
    { env: { GIT_TRACE_PACKET: "1" } },
  );
  const omitted = runGit(
    join(root, "omitted"),
    [
      ...pinArgsAfterAmbient("protocol.version=1", {
        setting: "protocol.version=2",
      }),
      "fetch",
      "--depth=1",
      "--no-tags",
      "--",
      repo.sourceUrl,
      "refs/heads/main",
    ],
    { env: { GIT_TRACE_PACKET: "1" } },
  );
  return {
    pinned: {
      status: pinned.status,
      hasLsRefs: pinned.stderr.includes("command=ls-refs"),
    },
    omitted: {
      status: omitted.status,
      hasLsRefs: omitted.stderr.includes("command=ls-refs"),
    },
  };
}

function listen(server: Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve((server.address() as AddressInfo).port);
    });
  });
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error === undefined ? resolve() : reject(error)));
  });
}

async function withLoopbackRedirectServer<T>(
  observe: (context: { server: Server; sourceUrl: string }) => Promise<T> | T,
): Promise<T> {
  const server = createServer((_request, response) => {
    response.writeHead(302, { location: "http://127.0.0.1:9/repo.git/" });
    response.end();
  });
  let listening = false;
  const port = await listen(server);
  listening = true;
  const sourceUrl = `http://127.0.0.1:${port}/repo.git/`;
  try {
    return await observe({ server, sourceUrl });
  } finally {
    if (listening && server.listening) {
      await close(server);
    }
  }
}

async function observeRedirectPin(): Promise<{
  pinned: unknown;
  omitted: unknown;
}> {
  const root = makeTempRoot("connect-orient-pin-redirect-");
  return await withLoopbackRedirectServer(async ({ sourceUrl }) => {
    const pinned = await runGitAsync(root, [
      ...pinArgsAfterAmbient("http.followRedirects=true"),
      "ls-remote",
      "--",
      sourceUrl,
    ]);
    const omitted = await runGitAsync(root, [
      ...pinArgsAfterAmbient("http.followRedirects=true", {
        setting: "http.followRedirects=false",
      }),
      "ls-remote",
      "--",
      sourceUrl,
    ]);
    return {
      pinned: {
        status: pinned.status,
        namesSource: pinned.stderr.includes(sourceUrl),
        namesClosedTarget: pinned.stderr.includes("127.0.0.1 port 9"),
      },
      omitted: {
        status: omitted.status,
        namesSource: omitted.stderr.includes(sourceUrl),
        namesClosedTarget: omitted.stderr.includes("127.0.0.1 port 9"),
      },
    };
  });
}

const CONSTANT_ONLY_REASONS = {
  "core.protectHFS=true":
    "the existing .GIT fixture covers only the case-insensitive invalid-path refusal, and that refusal is stable without this pin",
  "core.protectNTFS=true":
    "the existing .GIT fixture covers only the case-insensitive invalid-path refusal, and that refusal is stable without this pin",
  "core.fsmonitor=false":
    "the product-shaped init/fetch/checkout/rev-parse sequence configures no fsmonitor hook, so this suite has no same-level fsmonitor observation",
  "submodule.recurse=false":
    "the product sequence fetches and checks out the superproject only; the materialized .gitmodules file stays inert without a submodule update observation",
  "credential.helper=":
    "the local file and loopback transports in this suite require no credential challenge, so helper omission produces no credential-helper observation",
  "maintenance.auto=false":
    "the product-shaped sequence exposes no deterministic auto-maintenance event under this fixture",
  "gc.auto=0":
    "the product-shaped sequence exposes no deterministic auto-gc event under this fixture",
  "advice.detachedHead=false":
    "the proof suite observes guard behavior, while this pin suppresses checkout advice text and does not guard materialization",
} as const satisfies Partial<Record<PinSetting, string>>;

const PIN_PROOFS: PinProof[] = PINNED_GIT_CONFIGURATION.map((setting) => {
  switch (setting) {
    case "core.hooksPath=/dev/null":
      return {
        setting,
        classification: "behavioral",
        observation:
          "post-checkout hook marker appears only when the pin is omitted",
        observe: observeHooksPathPin,
      };
    case "core.symlinks=false":
      return {
        setting,
        classification: "behavioral",
        observation:
          "escaping symlink is materialized as a link only when the pin is omitted",
        observe: observeSymlinkPin,
      };
    case "transfer.fsckObjects=true":
      return {
        setting,
        classification: "behavioral",
        observation:
          "malformed commit transfer is refused only when object fsck is pinned",
        observe: observeTransferFsckPin,
      };
    case "protocol.version=2":
      return {
        setting,
        classification: "behavioral",
        observation:
          "packet trace carries command=ls-refs only under protocol v2",
        observe: observeProtocolVersionPin,
      };
    case "http.followRedirects=false":
      return {
        setting,
        classification: "behavioral",
        observation:
          "redirect refusal names the source endpoint; follow control names the closed target",
        observe: observeRedirectPin,
      };
    default:
      return {
        setting,
        classification: "constant-only",
        observation: CONSTANT_ONLY_REASONS[setting],
      };
  }
});

describe("pinned Git configuration proof inventory", () => {
  it("classifies every current pin exactly once", () => {
    expect(PIN_PROOFS.map(({ setting }) => setting)).toEqual([
      ...PINNED_GIT_CONFIGURATION,
    ]);
    expect(new Set(PIN_PROOFS.map(({ setting }) => setting)).size).toBe(
      PINNED_GIT_CONFIGURATION.length,
    );
    expect(PIN_PROOFS).toHaveLength(13);
    for (const proof of PIN_PROOFS) {
      if (proof.classification === "behavioral") {
        expect(proof.observe, proof.setting).toBeTypeOf("function");
      } else {
        expect(proof.observe, proof.setting).toBeUndefined();
      }
    }
  });

  it.each(
    PIN_PROOFS.filter((proof) => proof.classification === "behavioral"),
  )("$setting changes the named observation when only that setting is omitted", async (proof) => {
    const observed = await proof.observe?.();

    expect(observed, proof.observation).toBeDefined();
    expect(observed?.pinned, proof.observation).not.toEqual(observed?.omitted);
  });

  it("keeps nondiscriminating pins constant-only", () => {
    expect(
      PIN_PROOFS.filter(
        ({ classification }) => classification === "constant-only",
      ).map(({ setting }) => setting),
    ).toEqual([
      "core.protectHFS=true",
      "core.protectNTFS=true",
      "core.fsmonitor=false",
      "submodule.recurse=false",
      "credential.helper=",
      "maintenance.auto=false",
      "gc.auto=0",
      "advice.detachedHead=false",
    ]);
  });
});

describe("transport pin effects", () => {
  it("refuses a malformed packed commit over file:// with --no-local only when transfer fsck is pinned", async () => {
    const observed = await observeTransferFsckPin();

    expect(observed.pinned).toMatchObject({
      status: expect.any(Number),
      refused: true,
    });
    expect(observed.omitted).toEqual({ status: 0, accepted: true });
  });

  it("uses protocol v2 packet commands over the local transport only under the v2 pin", async () => {
    const observed = await observeProtocolVersionPin();

    expect(observed.pinned).toEqual({ status: 0, hasLsRefs: true });
    expect(observed.omitted).toEqual({ status: 0, hasLsRefs: false });
  });

  it("refuses loopback redirects at the source endpoint and closes the listener", async () => {
    const observed = await observeRedirectPin();

    expect(observed.pinned).toMatchObject({
      status: expect.any(Number),
      namesSource: true,
      namesClosedTarget: false,
    });
    expect(observed.omitted).toMatchObject({
      status: expect.any(Number),
      namesClosedTarget: true,
    });
  });

  it("closes the loopback redirect listener when observation throws after bind", async () => {
    let capturedServer: Server | undefined;

    await expect(
      withLoopbackRedirectServer(({ server }) => {
        capturedServer = server;
        expect(server.listening).toBe(true);
        throw new Error("throw after bind");
      }),
    ).rejects.toThrow("throw after bind");

    expect(capturedServer?.listening).toBe(false);
  });
});

describe("checkout-reachable pin effects", () => {
  it("runs the planted checkout hook only when core.hooksPath is omitted", async () => {
    const observed = await observeHooksPathPin();

    expect(observed.pinned).toEqual([]);
    expect(observed.omitted).toContain(PROBE_LOG_MARKER["repository-hook"]);
  });

  it("materializes an escaping symlink as a real link only when core.symlinks is omitted", async () => {
    const observed = await observeSymlinkPin();

    expect(observed.pinned).toBe(false);
    expect(observed.omitted).toBe(true);
  });
});
