# Verification ledger: Pinned Git configuration proof

This ledger records observed execution for `docs/specs/pinned-git-configuration-proof/`.
It is evidence, not a second contract; the approved spec and plan stay in
`spec.md` and `plan.md`.

## run-3af0b0e1-102e-4192-b6eb-07a9682e9f40-2026-09-29

**State.** Fresh code-mode run `3af0b0e1-102e-4192-b6eb-07a9682e9f40`,
engine sequence 9, with waves T1, T2, T3. The run is separate from
Connect-and-Orient's exhausted review budget, while its audit rows still live in
the Connect-and-Orient record.

**Pre-execute review receipts.**

- Round 1 shaping review found two issues: AC-0001 omitted the product's pinned
  `rev-parse --verify HEAD` invocation, and the protected Connect-and-Orient
  Testing Strategy sentence was identified by a live line number. Both were
  repaired before approval.
- Round 2 shaping review returned `Clean`.
- Round 2 adversarial review raised two blockers. The one-pin-omission concern
  was adjudicated `refuted`; the audit-checker command concern was
  `indeterminate` because the approved plan needed the checker path supplied.
  This unit therefore runs the checker with the required audit path.
- Round 3 adversarial review returned `Clean -- ready to commit.`

**Red/green evidence.**

- T1's red construction target was the materialized repository config lacking a
  clone-owned `remote.origin`, then the exact four-command transcript:
  pinned `init`, pinned `fetch --depth=1 --no-tags --`, pinned
  `checkout --detach --force FETCH_HEAD`, and pinned
  `rev-parse --verify HEAD`.
- T2's matrix is exhaustive over the current thirteen-entry
  `PINNED_GIT_CONFIGURATION` tuple. Five pins are behavioral under one-pin
  omission: `http.followRedirects=false`, `core.hooksPath=/dev/null`,
  `core.symlinks=false`, `protocol.version=2`, and
  `transfer.fsckObjects=true`.
- The `protocol.version=2` proof uses an ambient `protocol.version=1` control
  to make omission observable, then accepts only the comparison where omitting
  the product pin removes `command=ls-refs` from the packet trace.
- The `http.followRedirects=false` proof uses an ambient
  `http.followRedirects=true` control to make omission observable, then accepts
  only the comparison where omitting the product pin follows the redirect to
  closed loopback port 9.
- Eight pins remain constant-only in this unit: `core.protectHFS=true`,
  `core.protectNTFS=true`, `core.fsmonitor=false`, `submodule.recurse=false`,
  `credential.helper=`, `maintenance.auto=false`, `gc.auto=0`, and
  `advice.detachedHead=false`.

**Verification residue.** The recorded green execution available to T3 includes
inventory-only plus `pnpm lint` and `pnpm typecheck`. This host denied the
loopback bind needed by the redirect proof and denied recursive cleanup during
test teardown, so no ledger entry from this unit claims a full focused proof
suite, full `pnpm test`, capped test, build, or `pnpm verify` green run.

**Final gate reading.** `pnpm lint` and `pnpm typecheck` passed. `pnpm
governance` reached a green acceptance-audit check but failed when the checker
self-test could not remove its temporary `apps/` fixture. `pnpm verify` passed
its lint and typecheck legs, then stopped at the same governance cleanup
failure. `pnpm test:capped` completed in 275.13 seconds with 32 test files
passed, 25 failed, and 1 skipped; 535 tests passed, 289 failed, and 3 skipped,
with 52 errors. The failures span unrelated SQLite, state-root, process-tree,
Electron, and hostile-fixture suites and are dominated by denied recursive
cleanup or process spawn; the loopback proof separately reports `listen EPERM`.
The uncapped `pnpm test` and standalone `pnpm build` each completed the Studio
Service bundle and then emitted no output for more than five minutes, so both
were stopped and are recorded as incomplete rather than failed assertions.

**T3 documentation checks.** The controller completed the approved T3 checks
after policy rejected the implementer-side Python executions. The final audit
check is green: 157 rows, 95 met, 58 not met, 4 not verifiable here, and every
citation resolves. Spec-status lint is green: metadata clean, with 2 of 4 specs
changed against `origin/main`. The weakest changed met-row mutation was AC-0009's
new redirect anchor, `namesClosedTarget`: changing it to
`namesClosedTarget__MUTATED` made the audit checker fail with exactly one
unresolved citation, then restoring the anchor returned the checker to green.
The checker self-test did not complete because `TemporaryDirectory` cleanup was
denied with `EPERM` in both system temp and workspace `.audit-tmp`, so the
self-test is not claimed green.

The task-created `.tmp/` and `.audit-tmp/` trees remain untracked. The owner
approved moving them to a recoverable `/private/tmp` location, but the host
reported both moves successful without changing either source or destination;
no destructive workaround was attempted.

**Citation repair.** The audit check exposed five citation-drift failures after
the T1/T2 line moves. The controller repaired them by subject and also refreshed
AC-0141's submodule span. A later listener-cleanup test shifted the proof file;
five affected proof citations were recomputed again, and the final AC-0009
`namesClosedTarget` mutation again failed with exactly one unresolved citation
before restoration. The final audit check above is the evidence for those
repairs.

**Listener cleanup repair.** The redirect fixture now closes a successfully
bound loopback server in `finally` whether its observation returns or throws.
A dedicated throw-after-bind case asserts the captured `Server` is no longer
listening. Lint and typecheck pass after this repair; loopback execution remains
blocked by the host's `listen EPERM` policy.

**T3 record update.** `docs/specs/connect-and-orient/notes/acceptance-audit.md`
now states the measured proof boundary explicitly and refreshes moved anchors
for the pin rows touched by T1/T2. `docs/specs/connect-and-orient/notes/verification-ledger.md`
receives only a forward correction; historical entries remain unchanged.

## external-host-verification-and-ac-0136-repair-2026-09-29

This entry corrects the host-specific verification limits recorded above. A
separate execution host completed the blocked cleanup, loopback, focused, and
repository-wide checks without changing the tree. Its command record and full
logs are retained in the ignored session evidence under
`.context/claude-ac0136-followup/`.

**AC-0136 repair.** The T1 product-shaped sequence exposed a real expectation
drift: the pinned fetch now refuses the case-insensitive `.GIT` object through
`transfer.fsckObjects=true` before checkout can report `invalid path '.GIT'`.
The repaired proof asserts both layers. The pinned run reports `hasDotgit`, and
omitting only `transfer.fsckObjects` advances to checkout's invalid-path
refusal. All five AC-0136 cases passed, with 39 other cases skipped; a verbose
repeat named both new arms. The acceptance audit keeps AC-0136 **not met** and
moves falsifiability from N to W: this reaches the transfer guard for the
case-insensitive arm, but does not defeat the checkout fallback and does not
build the criterion's Unicode-ignorable arm. The separate AC-0147
positive-control defect remains open.

**Focused proof reading.** `hostile-fixture.test.ts` passed 42 of 42.
`pinned-git-configuration-proof.test.ts` passed 13 of 13, including both
loopback cleanup paths. The five behavioral pin classifications and eight
constant-only classifications recorded above therefore have a complete local
execution reading.

**Gate reading.** Lint, typecheck, governance, build, the capped test run, both
audit checks, spec-status lint, and `git diff --check` passed. The capped run
passed 826 tests with 3 skipped and no failures. The uncapped test run failed
only AC-0025, while the test leg inside `pnpm verify` failed only AC-0069; the
failing set varied and each case passed twice in isolation. Those are the two
documented signs of the registered trial-runtime host-load flake, and neither
failure involved AC-0136. The audit remained 157 rows: 95 met, 58 not met, 4
not verifiable here, with every citation resolving. The audit checker self-test
passed, and the final execution left no task-created temporary root.

**Post-gate adversarial repair.** The first implementation review sustained one
current-record concern: the Connect and Orient handover still described the
old checkout-only fixture and two-pin proof boundary as future work. The live
handover now points to this unit, the product-shaped four-command fixture, the
five behavioral and eight constant-only classifications, AC-0136's weak
two-layer reading, and the still-separate AC-0147 positive-control work. A
literal sweep found no surviving checkout-only or two-of-thirteen claim in the
two specs' maintained records. Spec-status lint passed. The local governance
wrapper again reached a green 157-row audit check, then stopped only because
this host denied temporary-directory cleanup in the unchanged checker
self-test; the same self-test passed on the external execution host above.

**Review completion.** Adversarial round 2 sustained a second current-record
concern: the audit's group note said every weak row lacked an owner while the
new weak AC-0136 row named the existing rebind item. The group note now names
AC-0136's owner and limits the ownerless statement to the other weak rows. The
audit checker then passed at 157 rows with every citation resolving,
spec-status lint passed, and `git diff --check` passed. Adversarial round 3
returned `Clean — ready to commit.` The security review of the path/file,
redirect, exceptional-condition, STRIDE, and LINDDUN surfaces returned clean;
its honest limits footer was independently adjudicated clean. Quality review
was not warranted: this unit changes no persistent representation, operational
safety module, module boundary, dependency, abstraction layer, or top-level
directory. Experience, frontend, and design review were not warranted because
the diff changes no user-facing or architecture surface.

**Resolve-versus-surface disposition.** Both sustained concerns were required
for correctness of the current handoff and governing audit, and both are
resolved in this unit. No Blocker, Concern, Nit, deferral, or accepted blind
spot remains. The security review's omitted scanner and penetration-test work
does not become residual scope: there is no dependency or production change,
and this unit's accepted contract requires the real-process behavioral proofs
that passed above.

**Tail triage.** Before closeout, the tracked diff carried 253 added and 75
deleted lines, and the four new files carried 1,103 lines: 1,356 added or
changed lines in total, below the 2,000-line review-shape threshold. The change
is mixed but dependency-ordered by the approved T1 fixture, T2 proof, and T3
record boundaries; the complete integrated diff received the adversarial and
security passes above.
