# Plan: Pinned Git configuration proof

- **Spec:** [`spec.md`](spec.md)
- **Status:** Done
- **Repository anchors:** `docs/architecture/reference.md` for the untrusted
  source boundary; `runtime-child.ts:917-1249` for the product Git sequence and
  post-checkout verification;
  `test/hostile-fixture.ts` and `absence-proofs.test.ts` for the existing proof
  seam; `acceptance-audit-citation-anchors` for audit-anchor precedent. The
  deliberate deviation is a separate loopback-only test surface, approved for
  this unit despite `runtime-supervisor.test.ts` opening no socket.

> **Plan contract:** this is the implementation strategy. It may change
> substantively only while its Status is `Drafting`, before approval records its
> baseline. After approval, `spec.md` and `plan.md` are pinned in substance;
> only lifecycle bookkeeping is permitted. Execution observations belong in
> `notes/verification-ledger.md`.

## Approach

First replace the fixture's clone shortcut with the product's materialization
and `HEAD`-verification flow and retain an invocation transcript. Then run every pin
through one omission at a time, adding real local behavior checks wherever Git
exposes a stable observation. Finally, update the audit and ledgers from the
measured matrix and recompute every moved citation by subject.

## Constraints

- The product pin list and production Git behavior do not change.
- All Git configuration files remain neutralized as the existing fixture
  requires; a control changes only its named command-line setting.
- Transport proofs are offline. `file://` with `--no-local` forces the object
  transfer path, and HTTP uses loopback only.
- A behavioral label requires a discriminating omission result. An unsupported
  platform effect or nondiscriminating run remains constant-only.
- The existing Connect and Orient acceptance criteria and approved plan stay
  unchanged. Historical ledger text receives forward corrections only.
- Review artifacts are local-only under `.context/reviews/<fresh-run-id>/` and
  remain available to every resuming session until closeout. The new
  verification ledger becomes the stable post-closeout evidence owner.

## Construction tests

**Integration tests:** the fixture/materialization suite and the dedicated pin
behavior suite run real `/usr/bin/git` processes against temporary local
repositories. The full mutation reading omits one setting per run and reports
the proof outcome for every member of `PINNED_GIT_CONFIGURATION`.

**Manual verification:** none. The loopback redirect discriminator is an
automated local integration check by owner decision.

## Durable-output map

| Durable output | Tasks | Implementation evidence | Closeout evidence |
| --- | --- | --- | --- |
| Behavioral proof suite | T1, T2 | Focused Vitest results and per-pin omission matrix | Full gates and clean specialist review |
| Connect and Orient acceptance audit | T3 | Audit checker plus changed-span anchor mutation | Checker self-test and final resolved citations |
| Connect and Orient forward correction | T3 | New dated ledger entry | Review confirms contemporaneous entries were untouched |
| Delivery verification ledger | T1-T3 | Recorded red/green, mutation, gate, and review receipts | Completion evidence resolves AC-0001 through AC-0008 |

## Design (LLD)

### Design decisions

Owned by: T1, T2.

- A single fixture vector builder reads the product constant,
  removes only `omitPinPrefix`, and prefixes every materialization command.
  This makes a production pin deletion remove the fixture pin as well.
- The proof inventory is exhaustive over the imported tuple,
  not a second hand-maintained list. A proof result carries its setting,
  observation, pinned outcome, omitted outcome, and classification.
- Transport observations use Git's own stable outputs:
  transfer success/refusal, packet trace protocol command, and the endpoint
  named by the redirect error.

### Interfaces & contracts

Owned by: T1, T2.

No public interface changes. The only new surface is test-owned proof data
inside the Studio Service trial-runtime suite. Traces to AC-0001 through
AC-0008; no `contracts/` artifact applies.

### Data & schema

Owned by: T2.

No persistent schema changes. Temporary repositories, trace files, and the
loopback listener are disposed after each case. Traces to AC-0003 through
AC-0005 and AC-0008.

### Failure, edge cases & resilience

Owned by: T2, T3.

- A Git result that does not discriminate pinned from omitted stays
  constant-only; the test never upgrades it by inference.
- Packet traces are parsed for the protocol command rather than compared as
  full unstable transcripts.
- Redirect assertions compare the source and target endpoints carried by the
  errors, not platform-specific prose around them.
- The HTTP listener closes in `finally`, and temporary fixture roots use the
  existing cleanup registry. Traces to AC-0002 through AC-0008.

### Quality attributes (NFRs)

Owned by: T2, T3.

The proof suite remains offline and deterministic under `LANG=C`, `LC_ALL=C`,
and fixed repository timestamps. The focused cases keep the existing generous
real-process timeout but do not add sleeps or fixed ports. Traces to AC-0007
and AC-0008.

## Tasks

### T1: The hostile fixture exercises the product materialization sequence

**Depends on:** none

**Touches:** `apps/studio-service/src/trials/connect-and-orient-runtime/test/hostile-fixture.ts`, `apps/studio-service/src/trials/connect-and-orient-runtime/test/hostile-fixture.test.ts`, existing materialization proof tests

**Tests:**

- **TDD, AC-0001:** add a contract-surface red assertion that the materialized
  repository has no clone-owned `remote.origin`; then fill the assertion set
  from the recorded invocation transcript for the exact pinned init, fetch,
  forced-checkout, and `rev-parse --verify HEAD` comparison.
- Re-run the existing hook, symlink, materialization, and corpus cases to prove
  the fixture change preserves their observations.

```ts
it("materializes without clone-owned remote metadata", async () => {
  const fixture = await buildHostileFixture({
    caseId: "instruction-shaped-text",
  });
  await materialize(fixture);
  expect(readFileSync(join(fixture.worktree, ".git/config"), "utf8"))
    .not.toContain('[remote "origin"]');
});
```

**Done when:** the unchanged stub is green, the full AC-0001 transcript
comparison is green, and the existing fixture consumers pass.

### T2: Every reachable pin effect has a discriminating local control

**Depends on:** T1

**Touches:** Connect and Orient Runtime proof tests and test fixture helpers

**Tests:**

- **TDD, AC-0002:** iterate the imported pinned tuple and refuse an inventory
  with a missing or duplicate classification; for every behavioral entry,
  assert that omitting only its own setting changes the named observation.
- **TDD, AC-0003:** write a malformed commit object, transfer it through
  `file://` with `--no-local`, and compare the fsck-pinned and fsck-omitted
  results.
- **TDD, AC-0004:** compare packet traces from v2 and v1 local fetches for
  `command=ls-refs`.
- **TDD, AC-0005 and AC-0008:** compare redirect refusal with redirect following
  against one ephemeral loopback listener, and assert cleanup after both the
  success and thrown-error paths.
- Probe every remaining setting under the same product sequence. Add a
  behavioral case only when one-pin omission changes a stable observation;
  otherwise retain the constant-only classification with the measured reason.

**Done when:** the focused suite reports one classification per current pin,
all behavioral entries discriminate under one-pin omission, and no test reaches
a remote service.

### T3: The security record states the measured proof boundary

**Depends on:** T1, T2

**Touches:** `docs/specs/connect-and-orient/notes/acceptance-audit.md`, `docs/specs/connect-and-orient/notes/verification-ledger.md`, `docs/specs/pinned-git-configuration-proof/notes/verification-ledger.md`

**Tests:**

- **Goal-based, AC-0006:** derive the audit's pin inventory from the test matrix
  and compare every behavioral claim to the one-pin omission result.
- **Goal-based, AC-0007:** run
  `python3 tools/acceptance-audit-counts.py docs/specs/connect-and-orient/notes/acceptance-audit.md --check`,
  `python3 tools/acceptance-audit-counts.py --self-test`, and
  `python3 .agents/skills/work-loop/scripts/lint-spec-status.py --root .` after
  recomputing changed spans from their symbols.
- Mutate the weakest changed met-row anchor so the real checker fails, restore
  it, and record both outcomes.

**Done when:** the audit and both ledgers state only measured reach, every
changed citation resolves, and the three documentation checks pass.

## Rollout

This is a test-and-evidence change with no runtime rollout, migration, feature
flag, public contract, or deployment sequence. Reverting the change restores
the prior fixture and evidence without changing production behavior.

## Risks

- Git diagnostic prose varies by platform; assertions must compare stable
  endpoints or protocol tokens.
- Real-process tests can show the registered host-load flake; isolated green
  cases plus a green capped run distinguish it from a defect.
- Editing `hostile-fixture.ts` moves audit spans; line-offset repair would make
  a clean-looking but false citation.
- A loopback listener that is not closed can hang Vitest or contaminate the
  next test.

## Changelog

- 2026-09-29: spec approved by `Agent-Ready Studio maintainers`.
- 2026-09-29: plan approved by `Agent-Ready Studio maintainers`.
