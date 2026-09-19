/**
 * T13's live unauthenticated smoke. Skipped unless CONNECT_ORIENT_SMOKE=1, so
 * it never runs in the automated suite -- AC-0148 requires every test this
 * delivery adds to pass with no network, no credential and no remote service.
 *
 * An earlier version drove the transport through an executor running in this
 * process, which put the git spawns outside the Runtime child's process group
 * and outside its spawn audit -- the audit whose contents AC-0025's manual leg
 * exists to read. The observations taken from it were retracted. This version
 * resolves the ref here and hands the revision to the Runtime, which fetches
 * and checks out, so every transport spawn is the child's own and appears in
 * the child's audit.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildFetchUrl, canonicalizeSource } from "../../source-identity.js";
import { createDefaultTransport } from "../../source-inspection.js";
import { pinnedGitConfigurationArgs, resolveRevision } from "./git-driver.js";
import { startTrialInspection } from "./runtime-supervisor.js";

const enabled = process.env.CONNECT_ORIENT_SMOKE === "1";

describe.skipIf(!enabled)("T13 live unauthenticated smoke", () => {
  it("materializes a real public repository inside the Runtime", async () => {
    const identity = canonicalizeSource(
      process.env.CONNECT_ORIENT_SMOKE_URL ??
        "https://github.com/octocat/Hello-World",
    );
    if (!identity.ok) throw new Error(`smoke URL refused: ${identity.reason}`);

    const domain = mkdtempSync(join(tmpdir(), "connect-orient-smoke-"));
    try {
      // Resolving reads a ref listing and writes no tree, so it stays here.
      const resolution = await resolveRevision(
        identity.identity,
        createDefaultTransport(),
      );
      if (!resolution.ok) throw new Error(`resolve failed: ${resolution.code}`);
      expect(resolution.resolvedSha).toMatch(/^[0-9a-f]{40}$/);

      const record = await startTrialInspection(
        {
          requestId: "smoke-0001",
          identity: identity.identity,
          sweepDomain: domain,
        },
        {
          revision: {
            fetchUrl: buildFetchUrl(identity.identity),
            resolvedSha: resolution.resolvedSha,
          },
          // AC-0025's manual leg is about the transport helper, and
          // `git-remote-https` is a grandchild: git spawns it, so it is not in
          // the child's direct audit. The descendant observer is the parent
          // side of the boundary and is the only place it is visible.
          observeEnvironmentTree: true,
          samplingIntervalMs: 25,
        },
      );
      if (!("admitted" in record) || record.admitted !== true) {
        throw new Error(`inspection refused: ${JSON.stringify(record)}`);
      }

      const audit = record.spawnAudit;
      const gitArgsOf = (needle: string) =>
        audit.filter((entry) => entry.args.includes(needle));

      // AC-0009: redirect refusal on both network phases, observed in the
      // child's own audit rather than inferred from a caller's vector.
      // Scoped to the spawns that touch the network or the tree. The identity
      // probes -- `--exec-path` and `--version` -- are not transport calls and
      // legitimately carry no pinned configuration; asserting over every git
      // spawn would be asserting the wrong property.
      const transportPhases = ["init", "fetch", "checkout"] as const;
      const transportSpawns = audit.filter((entry) =>
        transportPhases.some((phase) => entry.args.includes(phase)),
      );
      expect(transportSpawns.length).toBeGreaterThan(0);
      expect(gitArgsOf("fetch").length).toBeGreaterThan(0);
      for (const entry of transportSpawns) {
        expect(entry.args).toContain("http.followRedirects=false");
        expect(entry.args).toContain("credential.helper=");
      }

      // AC-0025: the transport helper is a grandchild, so it is visible only
      // to the descendant observer. Its admission is what the manual leg is
      // about, and it is asserted rather than merely written to a file.
      const descendants = [...record.observedProcesses.values()];
      const helper = descendants.find((process) =>
        process.executable.includes("git-remote-https"),
      );
      expect(helper, "git-remote-https was not observed").toBeDefined();

      // AC-0024: the pinned configuration reaches the helper, compared as a
      // parsed key/value set rather than as a substring of one string.
      const pinned = new Map(
        pinnedGitConfigurationArgs()
          .filter((argument) => argument !== "-c")
          .map((pair) => {
            const split = pair.indexOf("=");
            return [pair.slice(0, split), pair.slice(split + 1)] as const;
          }),
      );
      const carried = new Map(
        [
          ...(helper?.environment?.GIT_CONFIG_PARAMETERS ?? "").matchAll(
            /'([^']*)'='([^']*)'/g,
          ),
        ].map((match) => [match[1] as string, match[2] as string]),
      );
      for (const [key, value] of pinned) {
        expect(carried.get(key), `${key} did not reach the helper`).toBe(value);
      }
      // And no credential can be prompted for anywhere on that path.
      expect(helper?.environment?.GIT_ASKPASS).toBe("");
      expect(helper?.environment?.SSH_ASKPASS).toBe("");
      expect(helper?.environment?.GIT_TERMINAL_PROMPT).toBe("0");

      // AC-0030: no descendant survives. Asserted against the pgid this run
      // recorded, not read from a file afterwards -- the retracted row cited a
      // group from a different run, and citing the number is how that was
      // caught, so the number is carried into the evidence below.
      const pgid = record.childPgid;
      expect(pgid, "no child pgid was recorded").toBeGreaterThan(0);
      const survivors = spawnSync(
        "/bin/ps",
        ["-g", String(pgid), "-o", "pid="],
        {
          encoding: "utf8",
        },
      );
      const surviving = (survivors.stdout ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "");
      expect(surviving, `processes survived in group ${pgid}`).toEqual([]);

      writeFileSync(
        process.env.CONNECT_ORIENT_SMOKE_OUT ?? "/tmp/smoke.json",
        `${JSON.stringify(
          {
            resolvedRef: resolution.resolvedRef,
            resolvedSha: resolution.resolvedSha,
            servicePid: record.servicePid,
            childPid: record.childPid,
            childPgid: record.childPgid,
            survivingInGroup: surviving,
            environmentNames: Object.keys(record.environment).sort(),
            askpass: {
              GIT_ASKPASS: record.environment.GIT_ASKPASS,
              SSH_ASKPASS: record.environment.SSH_ASKPASS,
              GIT_TERMINAL_PROMPT: record.environment.GIT_TERMINAL_PROMPT,
              GIT_CONFIG_PARAMETERS: record.environment.GIT_CONFIG_PARAMETERS,
            },
            spawnAudit: audit,
            observedProcesses: descendants,
            helperEnvironment: helper?.environment,
            protocolLines: record.protocolLines,
          },
          null,
          2,
        )}\n`,
      );
      expect(record.childPid).toBeGreaterThan(0);
    } finally {
      rmSync(domain, { recursive: true, force: true });
    }
  }, 180_000);
});
