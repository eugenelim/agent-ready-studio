# Verification ledger — connect-orient-positive-controls-that-remove-no-guard

## implementation-pass-2026-10-01

Run id: `fa35035d-33cb-4f7b-8a93-264ae12fc0c9`.

This entry records the implementation state left by this host. It is a forward
ledger for the follow-on spec, not a replacement for the parent
`connect-and-orient` ledger.

**Implemented surfaces.** AC-0138 now uses the real source-inspection
composition in `state-projection.test.ts`. The guarded pair keeps verdict,
condition and user-visible state stable while carrying the instruction-shaped
fixture as diagnostics. The control treats the same text as trusted output and
makes `expectSameDecisionSurface` throw its own message.

AC-0142 now drives the option-shaped ref through `resolveRevision` with an
injected transport. The guarded result is `invalid-remote-ref`; the control is a
test-owned admitted resolution for the same reported ref and SHA, and it makes
`expectRemoteRefRefused` throw its own message.

AC-0145 is narrowed to product-owned construction. The proof scans canonical
fetch URL, resolution Git argv, Runtime child argv, Runtime spawn argv, pinned
Git configuration and the closed Runtime environment for the fixture's planted
authorization value and authorization carrier names. The control appends
`http.extraHeader=Authorization: <fixture value>` to a product-shaped Git argv
surface and makes `expectNoAuthorizationCarrier` throw its own message.

AC-0147 now has `POSITIVE_CONTROL_PROOFS`, a typed fourteen-row inventory keyed
by AC-0133 through AC-0146 and mapped against `HOSTILE_CASE_BY_CRITERION`. The
test asserts exact keys, exact case mappings, non-empty proof/control symbols,
unique cases, and no `fixture-property` or `literal-construction` mechanism.
`runPositiveControl` was retired; `runFixturePositiveControl` accepts only the
six legitimate fixture-level controls.

**Parent record updated.** `docs/specs/connect-and-orient/spec.md` marks
AC-0138, AC-0145 and AC-0147 checked, narrows AC-0145, and leaves AC-0142 and
the Testing Strategy sentence at `spec.md:437` unchanged by owner direction.
The acceptance audit now reads 157 rows by inspection, with the expected count
104 met, 49 not met and 4 not verifiable here.

**Blocked verification.** This host rejected repository test execution and
repository Python execution under policy. The following commands were attempted
and blocked before running:

- `pnpm vitest run apps/studio-service/src/state-projection.test.ts apps/studio-service/src/trials/connect-and-orient-runtime/absence-proofs.test.ts apps/studio-service/src/trials/connect-and-orient-runtime/test/hostile-fixture.test.ts apps/studio-service/src/source-inspection-storage.test.ts apps/studio-service/src/connected-source.test.ts`
- `python3 tools/acceptance-audit-counts.py docs/specs/connect-and-orient/notes/acceptance-audit.md --check`

The required pre-execute adversarial review was attempted through the approved
local `claude -p` route, but the network request disconnected before approval
could complete. No clean review is claimed.

**Still required before shipping.** Run the focused suites, all gates named in
the spec, the audit checker and self-test, spec-status lint, the required
anchor mutation, and adversarial/quality review. AC-0006 remains unchecked until
those pass.

## execution-forward-correction-2026-10-02

The entry above was captured before later execution and contains two stale
claims. The parent AC-0138, AC-0145 and AC-0147 boxes remain unchecked, and
repository commands were not all rejected before running.

The acceptance audit also remains at 157 rows, 101 met, 52 not met and 4 not
verifiable here. Its three candidate rows stay not met until the required
focused readings, mutations and gates complete; the 104 / 49 / 4 reading is
the closeout target, not current evidence.

Evidence now available:

- The exact inventory case passed before the later AC-0146 test split: 1 test
  passed, 39 skipped, in 628 ms. The current tree still needs that focused
  inventory rerun.
- `pnpm typecheck` passed once after the initial implementation in 4.9 seconds.
- Focused fixture-heavy Vitest runs started but failed during cleanup with
  `EPERM` while removing temporary Git repositories. Repointing `TMPDIR` to
  `/private/tmp` and then to a workspace-local directory did not change that
  managed-filesystem failure. Those readings do not establish a product-test
  failure or a green focused suite.
- The source-only T1 and T2 implementation passes completed, and
  `git diff --check` reported no whitespace errors. Their required package
  gates remained blocked without a fresh action-specific approval marker.
- The exhaustive row trace found AC-0146 still used a literal credential even
  though its refusal and storage observations were real. Amendment 0001 now
  makes its guarded path and both sink mutations use the value read from the
  registered credential-sink fixture.
- The shaping and adversarial spec reviews were clean before implementation.
  No clean implementation or quality review is claimed yet.

The final lint/typecheck/governance/test/build/verify/capped gates, focused
suites, inventory and citation mutations, audit scripts, spec-status lint and
implementation reviews still gate closeout. The spec remains Implementing and
AC-0001 through AC-0006 remain unchecked until those readings are green.

The failed runs left `.test-tmp/` in the workspace. Both a normal and an
escalated removal attempt returned `EPERM` for the contained Git repositories.
It is generated scratch, not delivery content: do not stage it, and remove it
from a host that can delete the managed test roots before committing.

## resume-forward-correction-2026-10-02

This resume kept the cautious state above. The implementation still exists in
the tree, and the parent audit still records 101 met, 52 not met and 4 not
verifiable here. AC-0138, AC-0145 and AC-0147 remain unchecked in the parent
spec until the required focused readings, mutations, gates and reviews are
green.

Additional local work completed:

- Hand-formatted the touched TypeScript tests where the package formatter could
  not be run.
- Remapped the edited proof-file audit spans by subject while preserving the
  current not-met verdicts for the candidate rows.
- Confirmed `git diff --check` had no whitespace errors after the manual pass.

Additional local limits:

- `pnpm exec biome check --write ...` was rejected because it executes
  package-managed code and writes repository files. A narrower escalated request
  naming the five target files was also rejected for lack of a trusted
  action-specific approval marker.
- `loop-engine.py`, `loop-cohort.py`, the audit-count scripts, spec-status lint
  and every `pnpm` package gate remain unrun in this resume for the same
  policy reason. No closeout or clean-review state is claimed from this host.

## approved-execution-forward-correction-2026-10-02

The owner supplied the required action-specific approval and the current tree
was executed. This supersedes only the unrun-command claims above.

- `pnpm lint` passed: 133 files checked with no fixes.
- `pnpm typecheck` passed.
- The AC-0147 inventory case passed on the current tree: 1 passed, 39 skipped,
  in 1.37 seconds.
- The five-file focused run completed in 559.40 seconds: 47 passed, 5 skipped,
  and 110 were reported failed. Every shown failure was an `EPERM` from the
  managed host while spawning the process observer or removing a temporary
  directory; the run also reported four `spawn EPERM` errors. This is not a
  green focused reading and does not close AC-0138, AC-0145 or AC-0147.
- `pnpm governance` reached the audit checks. Its earlier ADR/RFC checks passed,
  then the audit checker identified 16 stale citation spans and its self-test
  could not remove a temporary tree under the same `EPERM` policy. The spans
  were remapped by subject and `git diff --check` passed afterwards; governance
  still needs a fresh rerun.
- The adversarial implementation review and quality review both reported
  `Clean — ready to commit.` after their findings were repaired.

The remaining commands are the governance rerun, build, verify, capped test,
the two audit commands and spec-status lint. The audit and parent criteria stay
open until the required executable readings are green.

## final-host-boundary-2026-10-02

The remaining approved commands were attempted after the citation repair.

- The standalone audit check passed: 157 rows, 101 met, 52 not met, 4 not
  verifiable here, and every citation resolves.
- Spec-status lint passed: metadata clean for the 2 changed specs.
- Governance and `pnpm verify` both reached a green audit check, but stopped
  because the audit self-test could not delete its temporary `apps` directory
  under either the system temporary root or `/private/tmp` (`EPERM`).
- `pnpm test:capped` completed in 270.51 seconds: 32 files passed, 25 failed and
  1 skipped; 554 tests passed, 273 were reported failed and 8 skipped. Its
  failures were environment-wide `EPERM` cleanup/spawn errors, including
  unrelated service and storage suites. This is not a green capped reading.
- `pnpm build` produced the Studio Service bundle, then remained silent at the
  desktop build until it was stopped after a bounded wait. `pnpm test` repeated
  that condition in its desktop pretest build and never reached Vitest.
- `git diff --check` remained green before this final ledger update.

This host cannot supply the remaining green readings. The spec remains
Implementing, the parent audit remains open, and no delivery files should be
committed until a host that permits process spawning and temporary-tree cleanup
runs the full gate set.

## capable-host-readings-2026-10-03

This forward entry records the first readings from a host that allows process
spawning and temporary-tree cleanup. The entries above stay as written.

**Baseline re-pinned by owner decision.** Amendments 0001 and 0002 had edited
`spec.md` and `plan.md` after approval without the engine's amendment event, so
`plan check-current` refused. On 2026-10-02 the owner chose to re-pin the
amended text. The cohort was reset, re-initialised under the same run id,
re-approved and rescheduled as T1 → T2 → T3; the engine stayed at
`CODE-IMPLEMENTATION`. No cohort progress existed to lose.

**Green readings on the current tree:**

- Inventory case: 1 passed, 39 skipped, 1.17 seconds.
- Five-file focused suite: 5 files, 162 tests passed, 1,038 seconds.
- `pnpm lint` (133 files), `pnpm typecheck`, `pnpm governance` (220 seconds)
  and `pnpm build` (21 seconds) passed.
- Audit check: 157 rows, 101 met, 52 not met, 4 not verifiable here, and every
  citation resolves. The audit self-test and spec-status lint passed.

**Falsifiability receipts.** Every mutation ran in a disposable worktree. Each
mutated file was restored byte-identical before the worktree was removed.

| Mutation | Observed failure |
| --- | --- |
| Remove the AC-0145 inventory row | Inventory test: key list mismatch. Typecheck: TS2551 and TS1360. |
| AC-0145 mechanism set to `fixture-property` | Inventory test: forbidden-mechanism match. Typecheck: TS2322. |
| Rename the AC-0145 guarded-test binding | Inventory test: `missing test: …` |
| Rename the AC-0145 evidence token | Inventory test: no evidence inside the named body |
| Move the AC-0138 anchor to `state-projection.test.ts:363-370` | Audit checker: 1 citation does not resolve. It passes again after restore. |

For AC-0138, AC-0142, AC-0145 and AC-0146, changing only the shared assertion's
message failed the control with `expected [Function] to throw error including
'<original message>'`. Removing the guard bypass failed it with `expected
[Function] to throw an error`. The guarded test stayed green in all eight runs.

**Not yet green.** The host load average was 175 to 240 during the full-suite
runs.

| Run | Failures |
| --- | ---: |
| `pnpm test` | 57 |
| `pnpm verify` | 31 |
| `pnpm test:capped` | 18 |

The failures were almost all trial-runtime timeouts, each followed by
`already-in-flight` refusals, in files and production modules this delivery
does not change. `disposal.test.ts` also failed on its own. With a 60-second
test timeout, 7 of its 8 tests passed; the signalled-cancellation case still
received `reason: failed` instead of `SIGTERM`.

The spec stays Implementing. AC-0138, AC-0145, AC-0147 and follow-on AC-0001
through AC-0006 stay unchecked until the remote `gates.yml` dispatch returns
green full-suite readings.
