/**
 * T13's live unauthenticated smoke. Skipped unless CONNECT_ORIENT_SMOKE=1, so
 * it never runs in the automated suite -- AC-0148 requires every test this
 * delivery adds to pass with no network, no credential and no remote service,
 * and a test that reached GitHub by default would break that for the suite.
 */

import { execFile } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { canonicalizeSource } from "../../source-identity.js";
import {
  createGitTransport,
  materializeRevision,
  resolveRevision,
} from "./git-driver.js";
import { startTrialInspection } from "./runtime-supervisor.js";

const run = promisify(execFile);

const enabled = process.env.CONNECT_ORIENT_SMOKE === "1";

describe.skipIf(!enabled)("T13 live unauthenticated smoke", () => {
  it("inspects a real public repository and records what it observed", async () => {
    const identity = canonicalizeSource(
      process.env.CONNECT_ORIENT_SMOKE_URL ??
        "https://github.com/octocat/Hello-World",
    );
    if (!identity.ok) throw new Error(`smoke URL refused: ${identity.reason}`);

    const domain = mkdtempSync(join(tmpdir(), "connect-orient-smoke-"));
    try {
      const record = await startTrialInspection({
        requestId: "smoke-0001",
        identity: identity.identity,
        sweepDomain: domain,
      });
      if (!("admitted" in record) || record.admitted !== true) {
        throw new Error(`inspection refused: ${JSON.stringify(record)}`);
      }
      writeFileSync(
        process.env.CONNECT_ORIENT_SMOKE_OUT ?? "/tmp/smoke.json",
        `${JSON.stringify(
          {
            requestId: record.requestId,
            servicePid: record.servicePid,
            childPid: record.childPid,
            childPgid: record.childPgid,
            environmentNames: Object.keys(record.environment).sort(),
            gitIdentity: record.gitIdentity,
            childArgs: record.childArgs,
            spawnAudit: record.spawnAudit,
            protocolLines: (record as unknown as { protocolLines?: unknown })
              .protocolLines,
            stateRoot: record.stateRoot,
          },
          null,
          2,
        )}\n`,
      );
      expect(record.childPid).toBeGreaterThan(0);

      // The transport, driven for real. The Runtime run above reaches `git
      // init` and stops, so the resolve and fetch phases -- where AC-0009's
      // redirect refusal and AC-0024's helper environment are observable --
      // are exercised here against the same remote and the same build.
      const invocations: Array<{ args: readonly string[]; cwd?: string }> = [];
      const transport = createGitTransport(
        record.gitIdentity.executable,
        async ({ executable, args, cwd }) => {
          invocations.push({ args, cwd });
          const out = await run(executable, [...args], {
            cwd,
            env: record.environment,
          });
          return { stdout: out.stdout, stderr: out.stderr, status: 0 };
        },
      );

      const resolution = await resolveRevision(identity.identity, transport);
      if (!resolution.ok) throw new Error(`resolve failed: ${resolution.code}`);

      const tree = mkdtempSync(join(domain, "materialize-"));
      const verification = await materializeRevision(
        resolution,
        tree,
        transport,
      );

      writeFileSync(
        (process.env.CONNECT_ORIENT_SMOKE_OUT ?? "/tmp/smoke.json").replace(
          ".json",
          "-transport.json",
        ),
        `${JSON.stringify(
          {
            resolvedRef: resolution.resolvedRef,
            resolvedSha: resolution.resolvedSha,
            verification,
            invocations,
            environmentNames: Object.keys(record.environment).sort(),
            askpass: {
              GIT_ASKPASS: record.environment.GIT_ASKPASS,
              SSH_ASKPASS: record.environment.SSH_ASKPASS,
              GIT_TERMINAL_PROMPT: record.environment.GIT_TERMINAL_PROMPT,
            },
          },
          null,
          2,
        )}\n`,
      );
      expect(resolution.resolvedSha).toMatch(/^[0-9a-f]{40}$/);
    } finally {
      rmSync(domain, { recursive: true, force: true });
    }
  }, 180_000);
});
