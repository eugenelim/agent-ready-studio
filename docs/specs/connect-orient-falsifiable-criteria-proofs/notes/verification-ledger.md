# Verification ledger: Connect and Orient falsifiable criteria proofs

This ledger records execution evidence for the delivery unit. The Connect and
Orient ledger remains contemporaneous and receives forward corrections only.

## Pre-approval grounding — 2026-09-29

- Repository state: `HEAD` is `1964ff31813c...`, matching the requested
  `1964ff3` base. Base freshness against the remote is unverified because the
  active filesystem policy refused Git's fetch-metadata write.
- Acceptance baseline: the checker reports 157 rows, 95 met, 58 not met, and 4
  not verifiable, with every citation resolving.
- Execution boundary: `spawnAudited` is not the Runtime's only process-start
  primitive. The supervisor, child, and process observer contain direct starts,
  and checking only an absolute executable misses interpreter operands. The
  draft therefore limits exhaustiveness to a constructed and classified
  repository-influenced set.
- Unicode probe: `.gi<U+200C>t` is refused during fetch with
  `transfer.fsckObjects=true`; omitting that pin advances to checkout, where
  `core.protectHFS=true` refuses it; omitting both materializes the hostile
  sibling while the real `.git/HEAD` stays intact. This measures two refusal
  layers but not an overwrite, so AC-0136 remains weak.
- Submodule probe: a `.gitmodules` file plus a real mode-160000 gitlink checks
  out as an empty directory under both `submodule.recurse=false` and `true`,
  with no `.git/modules` state and no child content. The recurse pin alone is
  nondiscriminating; a prohibited submodule operation is needed for a failing
  control.
- Credential path: the production canonicalizer rejects embedded URL
  credentials before persistence. The existing real-SQLite refusal test reaches
  that path but does not assert absence of the submitted value from diagnostics
  and storage; the hostile repository credential file does not reach either
  sink.
- Review-record limit: the Connect and Orient ledger's
  `review-record-gap-2026-09-27` says the recorded round count omits four full
  rounds and several artifacts. This unit uses a fresh full-mode run instead of
  inheriting that retry count.
- Tooling limit: the `new-spec` grounding helper was not executed because the
  active policy rejected repository-provided Python of unverified provenance.
  No bypass was attempted; the draft uses bounded repository reads and the
  direct probes above.

## Declined patterns

- One spawn-audit remedy for all six criteria: declined because AC-0136 is a
  filesystem outcome, AC-0146 is a data-flow outcome, and AC-0141 also has a
  traversal half.
- Directly execute each planted file as the positive control: declined because
  it proves fixture executability, not product reach.
- Upgrade AC-0136 from the Unicode refusal matrix: declined because neither
  measured omission overwrites the real `.git` directory.
- Treat `.gitmodules` text as a submodule: declined because it contains no
  gitlink and cannot recurse.
- Absorb AC-0147: declined because it has a separate backlog owner decision.

## Resolve-versus-surface record

- Resolved before approval: backlog naming, one coordinated spec, preservation
  of both AC-0136 and AC-0141 arms, and AC-0136's weak verdict.
- Surfaced in the draft plan: the smallest complete parent-visible surface for
  transient Git descendants and the offline discriminating submodule control.
  Each has a discovery predicate and a required failing mutation; neither is
  allowed to become an inferred proof.

## Pre-execution review round 1 — 2026-09-29

- Shaping review: clean, with no consequential grounding gap.
- Security review: one blocker was adjudicated `refuted`; AC-0001 already
  requires the parent-visible record for every repository-influenced start and
  AC-0002 through AC-0004 require a controlled product-Runtime mutation to
  redden the same observation. The review's scanner and execution limits remain
  recorded in its raw artifact.
- Adversarial finding 1, `draft-origin`, sustained: the canonical backlog entry
  omitted its required `needs` member. The entry now carries `needs = []`.
- Adversarial finding 2, `draft-origin`, sustained: T3 had no legal PLAN stub
  disposition. T3 now carries a compilable red sink-mutation stub and names the
  substitutions that make the finished proof green.
- Adversarial finding 3, `draft-origin`, sustained: the process inventory
  included test-owned spawns. AC-0001 and T1 now close the set over production
  Runtime modules and exclude only `*.test.ts` plus the `test/` fixture subtree.
- Adversarial finding 4, `draft-origin`, sustained: the offline submodule
  control could not traverse under the product's HTTPS-only transport boundary.
  T2 now confines local-transport permission to the test-owned prohibited
  operation vector; the product environment and materialization vector stay
  unchanged.

## PLAN stub reading — 2026-09-29

- The T3 credential-sink stub compiled and entered Vitest with its deliberate
  leaking diagnostic in place.
- The requested focused command was passed through the root `test` script as
  `vitest run -- <path>` and did not isolate the file: Vitest ran the workspace
  suite. The stub case was red, but so were the other nine storage cases and a
  varying set of real-process and storage suites after a fresh dependency
  install. This establishes compilation and a red observation, not isolated
  causality; the implementation task still owes the focused red/green and both
  mutation readings.
- The temporary test edit was removed immediately after the reading. Only the
  validated stub remains in `plan.md`.

## Pre-execution review round 2 — 2026-09-29

- Shaping review: clean after reassessing the complete contract and the
  materially changed AC-0001.
- Adversarial review: direct clean on the round-one repair delta.
- Security review: clean with a `Not checked` footer for scanner-owned classes,
  proof-suite execution, and architecture outside the repair delta. The footer
  required independent adjudication; its replacement result was clean with no
  refuted or indeterminate finding.

## Wave 1 execution — 2026-09-30

- T1 implementation added product-trial execution proofs for the package
  script, projected skill executable, and attribute filter, plus a construction
  inventory derived from every production Runtime `.ts` module outside
  `*.test.ts` and the `test/` fixture subtree.
- T1 lint and typecheck pass after formatting and inventory hardening.
- The focused T1 suite cannot be measured in this session. Both sandboxed and
  explicitly approved unsandboxed attempts fail before product behavior is
  observable: enterprise policy returns `EPERM` for the Runtime's `/bin/ps`
  child and for hostile-fixture cleanup. The suite reports 2 construction
  cases passed and 44 real-process cases failed from that shared environment
  condition. T1 remains behaviorally unverified; the failures are not treated
  as product defects or as green evidence.
- T3 implementation added the production refusal over real SQLite and shared
  diagnostic/storage sink mutations. Typecheck passes. The focused suite runs
  all ten cases but marks each failed because enterprise policy rejects every
  temporary-directory cleanup with `EPERM`, including the explicitly approved
  unsandboxed attempt; the new case reports no body assertion failure before
  its shared cleanup fails. This is not recorded as a green behavior result.
- T3 lint's only finding was import order. The import was corrected, but the
  post-correction lint retry was policy-rejected pending a new approval.

## Wave 1 external execution — 2026-09-30

- A normal host run passed lint over 132 files with no fixes and passed all ten
  `source-inspection-storage.test.ts` cases. This supplies the missing green
  behavior reading for T3, including its production refusal and both sink
  mutations.
- The same host ran `absence-proofs.test.ts`: 40 of 46 cases passed. The
  construction inventory and each guard-present execution assertion passed;
  the six failures were the retained-tree and Runtime-mutation cases for
  AC-0134, AC-0135, and AC-0137. Each retained tree was absent, and each
  mutation left the shared execution-origin assertion green.
- Running the root pretest build did not change those six results. The emitted
  Runtime child contains the new mutation and retention branches, so the first
  stale-build explanation was too strong. The focused proof helper now pins
  `runtime-child.ts` explicitly. This removes compiled-child selection from the
  test and is awaiting a host rerun; if it remains red, the next observation is
  the settled record's removal outcome, spawn audit, and selected child entry.

## Wave 1 cause isolated — 2026-09-30

- The pinned-child rerun of `absence-proofs.test.ts` reproduced the same
  reading: 40 of 46 passed, with the identical six failures. Explicit child
  selection is therefore not the cause.
- Direct observation of one settled record resolved it. The trial's own
  `diagnostics` carry `fatal: transport 'file' not allowed`, the `fetch`
  protocol line reports `status: 128`, and no `checkout`, `verify-head`, or
  `materialized` line follows. `removalOutcome` is `retained` and the
  `disposed` line reports `retained: true`, so `retainStateRoot` worked
  correctly; the retained materialization root is simply an empty `git init`
  tree.
- The cause is the product transport boundary. The Runtime child's closed
  environment pins `GIT_ALLOW_PROTOCOL=https`
  (`runtime-environment.ts:80`), which is Connect and Orient criterion 0024's
  HTTPS-only transport rule. A hostile fixture is a local repository, so the
  product trial refuses to fetch it before any tree exists. This limit is
  already recorded in the repository at
  `trial-result-line.test.ts:12-21`, which supplies its materialized line for
  the same reason.
- Both failure shapes follow from that one cause. The three "materializes
  without running it" cases read files from a tree that was never checked out,
  and `runExecutionProofMutation` is reached only inside the child's
  `fetched.status === 0` branch, so no mutation ran and `spawnAudit` recorded
  no worktree execution.
- The three guard-present assertions that reported green are therefore
  vacuous: they observed a trial that materialized nothing. They are not
  counted as evidence for Connect and Orient criteria 0134, 0135, or 0137.
- Reachability probe: with `transfer.fsckObjects=true` retained, an isolated
  local fetch of an empty commit exits 128 with `transport 'file' not allowed`
  under `GIT_ALLOW_PROTOCOL=https` and exits 0 under
  `GIT_ALLOW_PROTOCOL=https:file`. Admitting the local transport for the
  trial's own materialization is the measured route to a non-vacuous product
  observation.
- Consequence for the approved plan: T1's `Approach` predicted discovery of a
  parent-visible product record, and assumed the product trial could
  materialize a local hostile fixture. That assumption is false against the
  production transport pin. The unresolved part is a plan-level decision about
  the proof surface, and it is surfaced to the owner rather than resolved in
  session.

## Wave 1 owner decision and T1 green — 2026-09-30

- Owner decision: admit the local transport through a test-owned supervisor
  option rather than serving fixtures over loopback HTTPS or narrowing
  Connect and Orient criteria 0134, 0135, and 0137. The two rejected options
  and their costs are recorded in the delivery discussion; this entry records
  what was built from the accepted one.
- `TrialInspectionOptions.additionalGitTransports` now names extra transports
  for the child's own materialization, and `buildPinnedEnvironment` composes
  `GIT_ALLOW_PROTOCOL` as `https` followed by those names. Production passes
  none, so the built value stays exactly the criterion-0024 pin. That default
  is proven end to end, not by inspection: `runtime-supervisor.test.ts` already
  compares the whole child environment of a default run and requires
  `GIT_ALLOW_PROTOCOL=https`, and it passes unchanged.
- The seam relaxes only which transport may deliver the tree. Every pinned
  setting governing the delivered tree is unchanged, including
  `transfer.fsckObjects=true`, `core.protectHFS=true`, `core.hooksPath=/dev/null`,
  and `submodule.recurse=false`.
- Vacuity guard: `productTrialFor` now asserts its own precondition. Each
  product trial must carry a `materialized` protocol line with status 0 and a
  real `.git/HEAD` under the materialization root before any absence assertion
  is read. This is the check whose absence let three empty trials report green;
  a future transport or fetch regression now reddens every case instead of
  emptying it.
- Second defect found and repaired in the attribute-filter control. Configuring
  `filter.probe.smudge` and running `checkout --force HEAD -- filtered.txt` left
  git with nothing to write, because the worktree copy already matched the
  index, so git exited 0 and the filter never ran. Measured in isolation: the
  same command writes no probe-log entry with the file present, and writes
  `attribute-filter` once the path is removed first. The control now unlinks
  `filtered.txt` before the checkout, and the case asserts the probe log, so
  the mutation is proven to have run rather than merely to have been
  configured.
- T1 focused reading: `absence-proofs.test.ts` 46 of 46 passed in 59.3s. Every
  trial materialized a real tree, each guard-present case observed no
  worktree-rooted executable, interpreter operand, or filter payload, and each
  of the three mutations reddened its own assertion at the exact expected
  origin.
- T1 and T3 gates: `pnpm lint` checked 132 files with no fixes; `pnpm typecheck`
  passed. `runtime-supervisor.test.ts`, `per-request-state-root.test.ts`, and
  `source-inspection-storage.test.ts` together passed 56 of 56 in 25.0s, which
  re-confirms T3's production refusal over real SQLite and both of its sink
  mutations alongside the untouched environment pin.

## Wave 1 gate reading — 2026-09-30

- `pnpm lint`: passed, 132 files, no fixes. `pnpm typecheck`: passed.
- Uncapped `pnpm test` run A: 823 of 832 passed, 3 skipped, 6 failed in
  `materialization.test.ts` (2), `runtime-supervisor.test.ts` (2), and one
  further trial suite, in 115.6s.
- Uncapped run B over the identical tree: 825 passed, 3 skipped, 4 failed in
  `disposal.test.ts` (2), `materialization.test.ts` (1), and
  `runtime-supervisor.test.ts` (1), in 104.6s.
- First documented load sign holds. The failing set varies across the two runs
  by file, by count, and by case: `disposal.test.ts` fails only in run B,
  `materialization.test.ts` fails two cases in run A and a different single
  case in run B, and `runtime-supervisor.test.ts` fails AC-0023 and AC-0025 in
  run A but AC-0025 alone in run B.
- Second documented load sign holds. Each affected suite passes alone:
  `materialization.test.ts` 4 of 4 in 5.1s, `runtime-supervisor.test.ts` 26 of
  26 in 19.4s, `disposal.test.ts` 8 of 8 in 7.6s. The failures are sampling
  misses and 5s timeouts in real-process observation, not assertion defects.
- `pnpm test:capped` over the same tree: 829 of 832 passed, 3 skipped, 0
  failed, 132.1s. Per `AGENTS.md`, a green capped run means a green tree.
- No failing case is one this unit wrote or touched. `absence-proofs.test.ts`
  and `source-inspection-storage.test.ts` passed in every run above, capped and
  uncapped. The reds are the registered
  `pre-existing-trial-runtime-load-flake`, classified only from both signs.

## Wave 2 execution — T2 — 2026-09-30

- T2 generalized the existing seams rather than adding parallel ones.
  `addDotGitVariantToObjectDatabase` now takes the entry name,
  `HostileFixture.omitPinPrefix` accepts one prefix or several, and
  `productTrialFor` with its materialization guard remains the trial driver.
- Unicode matrix, measured over the product-shaped `init`/`fetch`/`checkout`/
  `rev-parse` sequence with `.gi<U+200C>t` planted by `mktree`:

  | Layer | Pins out of force | Measured result |
  | --- | --- | --- |
  | 1 | none | fetch refuses: `hasDotgit: contains '.git'`, fsck error in packed object; no tree exists |
  | 2 | `transfer.fsckObjects` | fetch exits 0; checkout refuses `invalid path '.gi<U+200C>t'` |
  | 3 | `transfer.fsckObjects`, HFS protection | materializes `.gi<U+200C>t` as a regular file holding `hostile-config` |

  All three layers assert the real `.git` is still a directory whose `HEAD` is a
  ref or a 40-character commit and never contains `hostile-config`. Layers 1 and
  2 additionally assert no `.gi<U+200C>t` entry anywhere under the root.
- Connect and Orient criterion 0136 stays weak, and no assertion or comment says
  otherwise. Layer 3 writes a *sibling*: `.gi<U+200C>t` and `.git` are distinct
  names on this filesystem, so no overwrite is demonstrated.
- Layer 3 required `core.protectHFS=false`, not merely the pin omitted, and this
  was verified independently of the implementing agent. Measured on this host
  with git 2.50.1 (Apple Git-155): with the pin omitted the checkout still
  refuses `invalid path '.gi<U+200C>t'`, because git's Apple build defaults HFS
  protection on; with `core.protectHFS=false` the checkout exits 0, the hostile
  sibling materializes holding `hostile-config`, and the real `.git/HEAD` holds
  a 40-character commit. The new `HostileFixture.ambientPins` places the ambient
  value *before* the product pins, so a pin still present overrides it and only
  a dropped pin exposes it — the same mechanism and reason as the existing
  `pinArgsAfterAmbient` isolation in `pinned-git-configuration-proof.test.ts`.
  The plan's constraint is satisfied: the control changes only its named guard.
- Consequence T4 must respect: for the Unicode arm on this host,
  `core.protectHFS=true` is defence in depth rather than the refusal that acts,
  because the ambient default already refuses. The pin's `constant-only`
  classification is therefore left unchanged, and no audit row may claim the
  product pin is what refuses this arm.
- Submodule corpus replaced. The case now carries a local child repository with
  a real commit, a mode-160000 gitlink naming that commit, and a matching
  `.gitmodules`. The two halves are measured on different surfaces and recorded
  separately: fetch on the trial's parent-visible process record, traversal on
  the filesystem after it settles.
- Both halves carry a vacuity guard. The fetch assertion refuses an empty
  process record, and the traversal assertion requires `gitlinkPresent: true`,
  so neither absence can be read off a tree carrying no submodule. The
  submodule-operation discriminator matches the bare `submodule` operand rather
  than a substring, so the `-c submodule.recurse=false` pin that forbids
  recursion is never counted as recursion.
- The prohibited-operation control proves it ran rather than that it was
  issued: it asserts exit status 0, the child repository's committed bytes under
  the gitlink path, and `outside` listed under `.git/modules`. Its first reading
  was red for the right reason — without command-local
  `-c protocol.file.allow=always` the control exited 1 on
  `transport 'file' not allowed` and populated nothing, which is the same
  looks-applied-reddens-nothing shape the attribute-filter control had. The
  permission stays on that one prohibited vector; the production environment,
  transport policy, and ordinary materialization vector are unchanged.
- The earlier `existsSync(worktree/"outside") === false` assertion is gone. With
  a real gitlink git creates the empty directory at checkout, so its presence is
  now the vacuity guard rather than a failure.
- Three `CONSTANT_ONLY_REASONS` strings in
  `pinned-git-configuration-proof.test.ts` described a corpus that no longer
  exists and were corrected from measurement. No classification, verdict, or
  assertion changed. The `submodule.recurse=false` reason now records that git's
  own default does not recurse into an uninitialized submodule, so that pin is
  also defence in depth for this corpus and the prohibited operation has to be
  issued explicitly.
- T2 verification, re-run by the controller rather than accepted from the
  report: `absence-proofs.test.ts` 53 of 53 in 46.1s,
  `test/hostile-fixture.test.ts` 44 of 44 in 33.6s,
  `pinned-git-configuration-proof.test.ts` 13 of 13 in 12.0s. `pnpm lint`
  passed over 132 files with no fixes and `pnpm typecheck` passed.

## Wave 2 gate reading — 2026-09-30

- Method note first, because it invalidates some readings taken earlier in the
  session. Three full-suite runs were accidentally launched so that they
  overlapped, contending with one another; one reported 1252s of test time and
  18 failures. Those readings are discarded and are not used for any
  classification below. Every reading below was taken with the host verified
  quiet and with accumulated temporary trees cleared first.
- Green capped reading on the final tree: `pnpm test:capped` passed 838 of 841
  with 3 skipped, 0 failed, 57 of 58 files, in 160.7s. Per `AGENTS.md`, a green
  capped run means a green tree.
- Uncapped `pnpm test` on the same tree: 834 passed, 3 skipped, 4 failed in
  110.4s — `disposal.test.ts` AC-0082 twice, `materialization.test.ts` AC-0069
  once, and `runtime-supervisor.test.ts` AC-0025 once.
- First documented sign holds across the clean runs: the failing set varies by
  file, count, and case every time. Observed sets include
  materialization×2 with runtime-supervisor×2; disposal×2 with
  materialization×1 and runtime-supervisor×1; runtime-supervisor×1 alone;
  materialization×3 with disposal×1; disposal×4 under full serialization; and
  the four-case set above.
- Second documented sign holds for every affected suite run alone:
  `materialization.test.ts` 4 of 4, `runtime-supervisor.test.ts` 26 of 26 with
  its AC-0025 case green 3 of 3 times run by itself, `disposal.test.ts` 8 of 8,
  `sweep.test.ts` 26 of 26.
- Attribution. No suite this unit wrote or touched failed in any run, capped,
  uncapped, or serialized: `absence-proofs.test.ts` 53,
  `test/hostile-fixture.test.ts` 44, `pinned-git-configuration-proof.test.ts`
  13, and `source-inspection-storage.test.ts` 10 passed every time. The failing
  test files are outside the diff, and the one production module this unit
  changed, `runtime-supervisor.ts`, has its own suite green in isolation
  including the exhaustive default-environment comparison that pins
  `GIT_ALLOW_PROTOCOL=https`. The reds are the registered
  `pre-existing-trial-runtime-load-flake`, `source = pre-flight/2026-09-17`,
  which predates this unit.
- New diagnostic finding, recorded because it is more specific than "load".
  Accumulated `connect-orient-*` temporary trees under `TMPDIR` degrade these
  suites measurably. With 191 such trees present the suite reported 603s of
  test time and a red capped run; after removing them the same tree reported
  278s and the green capped run above. This is a better explanation than
  instantaneous load for the recorded observation that the flake has no load
  threshold, and it suggests the fixture and trial cleanup paths leak roots
  across interrupted runs.
- Scope note: that cleanup gap is not required by any acceptance criterion in
  this unit and no criterion depends on it, so it is recorded here and
  surfaced to the owner rather than repaired inside this delivery.

## Wave 3 execution — T4 — 2026-09-30

- Audit verdicts, written from the Wave 1 and Wave 2 measurements rather than
  re-derived. AC-0134, AC-0135, AC-0137, AC-0141 and AC-0146 are met and
  strongly bound. AC-0136 stays **not met** with its `W` marker. The headline
  moved from 95 / 58 / 4 to 100 / 53 / 4, generated from the rows.
- AC-0136 was the row most at risk of an unearned upgrade, so its basis is
  stated in the row itself: three measured layers on the Unicode arm, layer 3
  a sibling rather than an overwrite, and no overwrite of the real `.git` on
  either arm. The criterion asks for the overwrite, so nothing was upgraded.
- Two measured claims the Wave 2 entry flagged for T4 are now in the durable
  record, in the audit row and in the Connect and Orient ledger: for the
  Unicode arm `core.protectHFS=true` is defence in depth rather than the
  refusal that acts, because this host's git defaults HFS protection on; and
  `submodule.recurse=false` is defence in depth for this corpus, because git
  does not recurse into an uninitialized submodule by default. The pin's
  `constant-only` classification is unchanged and no row claims otherwise.
- AC-0141 carries a separate recorded result for each half, fetch on the
  process record and traversal on the filesystem. The criterion was not
  narrowed to either one.
- Citation repair was larger than the verdict change: 83 citations across 49
  rows had moved. Every span was refound **by its subject** — the `HEAD`
  content of each cited span located in the current file through a content
  diff of that file, with an anchored citation accepted only once its anchor
  sat inside the new span. No offset was applied and no range batch-shifted.
  The remapper reads `git show HEAD:<audit>` as its input on every run, so a
  second run reproduces the first instead of remapping its own output; the
  hand-written spans for the six rewritten rows were added after the remap.
- Independent check on the remap, because a clean checker reading does not
  prove a span is on-subject: each recomputed span's current text was compared
  with the `HEAD` text it came from. 69 of 73 scored 0.85 or better on a line
  similarity ratio; the four below were read individually and are the same
  subject rewritten by this delivery (the AC-0135 and AC-0141 describe blocks,
  `materializationPins`, and `addDotGitVariantToObjectDatabase`). One span was
  then tightened by hand from 196-224 to 202-223 so it names the function
  rather than its new doc block.
- Grounding for the remap's validity: extracting `HEAD` into a temporary tree
  and running the checker there reports 157 rows and every citation resolving.
  All 83 failures are therefore this delivery's, and a `HEAD`-to-current map is
  the right instrument for them.
- Anchor mutation, AC-0009. Widest changed met-row span:
  `source-inspection-storage.test.ts:287-446#.provenance.declaredVersionMarker`
  on AC-0104, 160 lines. **Red reading:** renaming the subject to
  `provenance.declaredVersionMarkr` gives `2 citation(s) do not resolve` —
  AC-0104's span and AC-0040's `427-445`, which cites the same line — exit 1.
  **Restored-green reading:** the file restored byte-identically
  (`shasum` 08f54beb2a70811b17a4c1c3ea37cc2e84397222 before and after) and the
  checker reports 157 rows, 100 met, 53 not met, 4 not verifiable here, every
  citation resolves, exit 0.
- Two findings from that mutation worth keeping. The anchor test is substring
  containment, so the first attempt — appending, `declaredVersionMarkerX` —
  left the checker green; a discriminating mutation has to break the substring.
  And the most common token in the span is the English word `the`, 28
  occurrences in comment prose: replacing all 28 left the checker green, which
  is the negative control proving the check reads the cited subject rather than
  flagging any edit inside the span.
- Gate receipts, run in documented order from the worktree root: `pnpm lint`
  passed, 132 files, no fixes, 0.8s. `pnpm typecheck` passed, 3.1s.
  `pnpm governance` passed all 6 checks, 16.4s. `pnpm build` passed, 12.2s.
  `tools/acceptance-audit-counts.py --check` passed: 157 rows, 100 met, 53 not
  met, 4 not verifiable here, every citation resolves, 0.2s.
  `tools/acceptance-audit-counts.py --self-test` passed, 1.5s.
  `lint-spec-status.py --root .` passed: metadata clean, 2 of 5 specs changed
  against `origin/main`, 1.6s. `pnpm test`, `pnpm verify` and
  `pnpm test:capped` were deliberately not run in this task; the controller
  owns them and a concurrent run corrupts the reading.
- `workspace.toml`: parsed with `tomllib`, not grepped. The legacy
  spawn-audit slug is already replaced by this spec's canonical registration at
  `backlog.open[20]`. Its comment stated intent only, so the measured outcome
  was appended: five met, AC-0136 still weak and not met with its reason, and
  the two defence-in-depth pins. `backlog.open[21]`,
  `connect-orient-positive-controls-that-remove-no-guard`, is byte-unchanged,
  and the file still parses to 23 open entries.
- Scope held. Nothing under `contracts/`,
  `docs/specs/product-development-walking-skeleton/`, the Testing Strategy
  sentence at `connect-and-orient/spec.md:437`, or the dependency-build choices
  in `pnpm-workspace.yaml` was touched, and no source file changed — the one
  source edit in this task was the anchor mutation, reverted and checksummed.
- Surfaced by T4 and then resolved by the controller: AC-0049's reasoning prose
  said the submodule case leaves `outside/` absent, which the real gitlink
  falsified — git now creates that directory empty at checkout, and the Wave 2
  entry relies on that presence as the traversal half's vacuity guard.

## Controller correction — AC-0049 reasoning — 2026-09-30

- The claim was repaired rather than left surfaced. A record stating something
  this delivery made false is this delivery's own correctness problem, not a
  neighbouring row's housekeeping, and T4 had already corrected four other
  passages on exactly that reasoning; stopping at the fifth was the
  inconsistency.
- Traversal walk before repairing, so the fix covered every surface rather than
  the reported instance. `outside/` appears in exactly one place in the audit,
  AC-0049's row at line 197; the only other `.git/modules` mention is AC-0141's
  newly written and correct row. `connect-and-orient/spec.md` and
  `notes/HANDOVER.md` carry neither claim. One surface, now repaired.
- AC-0049's verdict `met` and strength `S` are unchanged, because its
  obligation was never the absence of that directory: it is that every git
  argument vector carries `submodule.recurse=false`, which still holds. Only
  the falsified sentence changed, and it now records the correction and its
  date in place.
- Re-verified after the edit: `tools/acceptance-audit-counts.py --check`
  reports 157 rows, 100 met, 53 not met, 4 not verifiable here, every citation
  resolves, exit 0; `pnpm governance` passed all 6 checks.

## Final gate set — 2026-09-30

- Controller-run receipts on the final tree, each verified rather than accepted
  from a task report: `pnpm lint` passed, 132 files, no fixes.
  `pnpm typecheck` passed. `pnpm governance` passed all 6 checks.
  `pnpm build` passed, exit 0.
  `tools/acceptance-audit-counts.py --check` passed: 157 rows, 100 met, 53 not
  met, 4 not verifiable here, every citation resolves.
  `tools/acceptance-audit-counts.py --self-test` passed.
  `lint-spec-status.py --root .` passed: metadata clean, 2 of 5 specs changed
  against `origin/main`.
- `pnpm test:capped` on the final tree: 838 passed, 3 skipped, 0 failed, 57 of
  58 files, 187.8s. Per `AGENTS.md` this is the green-tree reading.
- `pnpm verify` exited 1. Its lint, typecheck, and governance stages passed and
  the failure is entirely in its test stage: 829 passed, 9 failed — seven
  `disposal.test.ts` cases across AC-0078, AC-0079, and AC-0082, and two
  `materialization.test.ts` AC-0069 cases. Its test stage reported 805.6s of
  test time against 163.2s of wall clock, so the run was heavily contended.
- That red is the registered load flake, classified only from both documented
  signs and not from the capped result alone. The failing set differs again
  from every earlier set, and both suites pass alone on the final tree:
  `disposal.test.ts` 8 of 8 in 6.9s and `materialization.test.ts` 4 of 4 in
  5.4s.
- One of those failures was checked specifically rather than swept up with the
  rest, because it names the option this unit's proofs depend on: AC-0079's
  "retains the root only when the injected option asks for it". It passes in
  the isolated 8 of 8 reading above, and neither changed production module
  touches retention — `runtime-child.ts` gained only a mutation branch reached
  when `executionProofMutation` is set, and `runtime-supervisor.ts` gained two
  plan fields and one environment argument. The change is not implicated.
- Temporary-tree hygiene after a completed run is sound: one leftover
  `connect-orient-*` tree after `pnpm verify`, against the 191 that had
  accumulated across earlier interrupted runs. The leak is an artefact of
  interrupted runs rather than of normal completion.

## Review round 1 and its repairs — 2026-09-30

- Three reviewers ran post-gates: adversarial, security, and quality. Each raw
  report was persisted to the ignored session path and machine-classified
  before anything was read or acted on.
- Two raw reports were refused by the classifier as `sentinel-absent` and were
  re-emitted by their own authors in the strict envelope. The controller did
  not reshape either file: reshaping a verdict would make the controller its
  author. Both agents confirmed their findings and judgement were unchanged
  and only the envelope moved.
- Adjudication totals: 15 sustained, 17 refuted, 0 indeterminate. Adversarial
  8 of 11 sustained, security 1 of 5, quality 6 of 16. Four of quality's six
  and security's one explicitly deferred to repairs already sustained
  elsewhere, leaving 10 distinct repairs.
- Every sustained finding was routed through the requiredness test before the
  round was fired. All 10 qualified: each either shows the change incorrect,
  breaches a stated criterion (AC-0001, AC-0004, AC-0009), or is a governing
  record this delivery itself falsified.
- Two real proof defects, each found independently by more than one reviewer.
  The execution-origin detector recognised only the three mutation shapes this
  unit wrote, so `/bin/sh -c <root>/x`, a relative operand under
  `cwd: materializationRoot`, and a payload on a key other than `filter.` all
  left every guard-present assertion green while the audit rows claimed the
  full class. And the AC-0137 guard-present case could not fail: with no
  `executionProofLog` the marker went to `/dev/null`, leaving AC-0004's
  "leaves no filter marker" half unasserted, while its substitute asserted
  `filtered.txt` equals `filter-me`, which is exactly what the planted filter
  printed.
- Quality found two the others missed. AC-0001's record-contribution clause had
  no assertion at all — the inventory checked classification labels but never
  that a `repository-influenced` site contributes anything to `spawnAudit`.
  And two `CONSTANT_ONLY_REASONS` strings asserted measurements no run in the
  tree takes: an NTFS-pin-omitted run that does not exist, and a
  pin-omitted refusal claimed for both `.git` spellings when only the Unicode
  arm was measured that way.
- Repairs applied, all in test scope with no production source changed:
  the detector now classifies any audited argument resolving inside the
  materialization root whatever executable receives it and whatever key carries
  it; the planted filter now writes `smudged-by-probe` against the committed
  `filter-me`, so the byte assertion discriminates, and both guard-present arms
  assert the marker is absent from a real probe log; the inventory now fails
  both statically and at runtime when a `repository-influenced` site records no
  executable, argument vector, and process identity; and both pin reason
  strings were narrowed to what was measured.
- Redness was re-proven rather than assumed. Re-enabling the attribute-filter
  mutation reddened both guard-present arms, and removing the record assertion
  from the first showed the marker half discriminates on its own rather than
  being masked. Dropping the `pid` spread from the child's `recordSpawn`
  reddened both new inventory cases. Both probe files were restored and
  checksummed byte-identical afterwards, and the three production modules still
  show the same insertion counts as before the round.
- Two dispositions recorded rather than silently taken. Relative operands
  resolve against the materialization root rather than a per-entry `cwd`,
  because `SpawnAuditEntry` carries no `cwd` and adding one edits a
  criterion-bound production whitelist; the substitution can add a report and
  never suppress one. A bare relative operand with no separator remains
  undetected, because a shell resolves such a word through `PATH` rather than
  against the working directory; this is documented in the detector itself.
- A third instance of the overclaim class was swept rather than left. The
  `DOT_GIT_CASE_ENTRY` docstring claimed the `.GIT` checkout refusal holds
  "whatever `core.protectHFS` and `core.protectNTFS` say", which no run in this
  tree measures. Repairing two strings and leaving the third would have been
  the same inconsistency the AC-0049 correction already recorded.
- Owner decision, 2026-09-30: AC-0136's residual overwrite reach is registered
  as `connect-orient-ac0136-overwrite-arm` in `workspace.toml`, because the
  delivery that measured both arms closes without closing that gap. Adding a
  backlog item is an ask-first act under this spec's Agent Rules, so it was
  asked. The AC-0147 entry is byte-unchanged and the file parses to 24 open
  entries. All four surfaces that named the retired
  `connect-orient-rebind-the-vacuous-criteria-to-the-spawn-audit` slug now name
  the new entry, each carrying a dated note about what it replaced. The
  contemporaneous Connect and Orient ledger line that records the original
  rename was left untouched, as immutable history.
- The AC-0012 row's categorical reason was corrected. It said no case reaches
  the Runtime's live `HEAD` verification offline "because no case can", which
  the test-owned transport option falsified. Production is unchanged and still
  pins `https`; the verdict stays `not verifiable here` and its consequence is
  left to the owner, per the ruling of 2026-09-25.
- The four product-trial rows now disclose the reachability condition they rest
  on: the trials reach their observations only because the test widens
  AC-0024's transport pin for the trial child. The AC-0141 row additionally
  records that its fetch control discriminates the detector rather than the
  audited channel, because the control's vector is appended by the test rather
  than reaching `spawnAudit` through the product child.
- Citation repair after the fix round: 34 citations across 17 rows were
  refound by subject, never by offset, and the repairing script aborts if an
  old literal is missing or repeats, so a second run cannot corrupt its own
  output. Eleven refound blocks have exactly the same length as the spans they
  replace, which is independent evidence that subject-matching landed on the
  same construct rather than a look-alike. Controller spot-checks confirmed
  `absence-proofs.test.ts:426` is the `expectMaterialized` declaration and
  `hostile-fixture.ts:275` is `addGitlinkToObjectDatabase`.
- Known weaker anchor, recorded rather than hidden: AC-0069's
  `hostile-fixture.ts#GIT_CONFIG_NOSYSTEM=1` anchor is spelled with an equals
  sign, which appears only in a comment rather than in the assignment
  `GIT_CONFIG_NOSYSTEM: "1"`. The span is the right subject, `materialize()`,
  but the anchor is carried by prose. Tightening it means changing the anchor
  text rather than the span.
- Post-repair focused readings: `absence-proofs.test.ts` 60 of 60 in 56.6s
  (7 new cases), `test/hostile-fixture.test.ts` 44 of 44 in 40.7s,
  `pinned-git-configuration-proof.test.ts` 13 of 13 in 14.8s. `pnpm lint`
  passed over 132 files with no fixes and `pnpm typecheck` passed.
  `acceptance-audit-counts.py --check` reports 157 rows, 100 met, 53 not met,
  4 not verifiable here, every citation resolves; its self-test,
  `pnpm governance` (all 6 checks) and `lint-spec-status.py` all pass.

## Review round 2 and its repairs — 2026-09-30

- All three reviewers re-ran against the repaired tree. Raw counts fell —
  adversarial 11 to 7, security 5 to 2, quality 16 to 4 — and every round-2
  report landed in the strict envelope first time, so no re-emission was
  needed.
- Adjudication totals: 7 sustained, 10 refuted, 0 indeterminate. Adversarial 4
  of 7, security 2 of 2, quality 1 of 4. After deduplicating overlap, 5
  distinct repairs.
- Round 2 found a real residual in round 1's own repair, which is what a second
  adversarial pass is for. `operandCandidates` kept only the slice after an
  argument's first `=`, losing a worktree path in two shapes: an absolute
  operand whose filename carries `=`, which yielded a relative, separator-free,
  non-existent candidate; and a single payload carrying both a path and an
  option, such as `/bin/sh -c "<root>/.probe/x --flag=1"`, which yielded only
  `1`. All three reviewers reached it independently. It is reachable because
  hostile repository content controls its own file names, and these assertions
  are the sole evidence behind Connect and Orient criteria 0134, 0135 and 0137.
- The controller's own round-1 ledger entry overstated that repair. It recorded
  classification of "any audited argument resolving inside the root", which the
  two shapes above falsify. The code was narrower than the record claimed, and
  the gap between them is what the reviewers used to establish the defect.
- A round-1 repair had not taken effect and was accepted on report rather than
  verified. The `DOT_GIT_UNICODE_ENTRY` comment claimed the code point was
  written as an escape "rather than as the literal character", while the escape
  shown in the comment was itself a raw U+200C and so was the literal. The
  comment asserted the opposite of the code, invisibly — the exact failure mode
  it warned about. `cat -v` would have caught it last round; the implementer's
  report did not.
- The controller's ledger also overstated the tree by one arm, stating that
  both AC-0137 guard-present arms assert the marker is absent from a real probe
  log when only the first did. The repair adds the missing assertion rather
  than weakening the record, so the existing sentence becomes true as written
  and no contemporaneous entry needed editing.
- Repairs applied, all test scope with no production source changed:
  `operandCandidates` now emits three readings of one argument — the
  configuration value after the first `=`, the whole argument when absolute,
  and each whitespace-separated token — de-duplicated by kind and path, with
  `namesWorktreePath` and the product-owned root exclusion unchanged; the
  detector's doc block now states what it actually reads; the never-suppress
  justification is narrowed to the containment branch and names the
  `existsSync` admission as its exception; the Unicode constant is now
  `".gi‌t"` with a comment that matches; the second AC-0137 arm asserts the
  marker channel; and the inventory gate now triggers on any occurrence of the
  `node:child_process` specifier, so a dynamic import or `createRequire` access
  becomes an unclassified site.
- Redness re-proven rather than assumed. Reinstating the old `operandCandidates`
  body reddened both new detector cases, which reported `[]` where a path was
  expected. Passing the attribute-filter mutation to the second guard-present
  arm failed it at the new marker assertion, reached before its byte
  assertions. A probe whose only access was
  `await import("node:child_process")` yielded the unsupported sentinel under
  the widened gate and nothing under the old one. Every probe was reverted and
  the files checksum-verified byte-identical.
- Controller verification of the Unicode repair, after last round's miss:
  `hostile-fixture.ts` now contains zero raw U+200C characters, the literal
  source text is `".gi‌t"`, and the 44 fixture cases confirm the
  constant's value is unchanged.
- One load-bearing detail inside the detector widening. A token containing `=`
  contributes its configuration value rather than the token itself, because
  emitting every token whole would report `core.hooksPath=/dev/null`: that
  token is relative and contains a separator, so resolving it against the root
  lands inside the root and the negative control would redden on a real product
  pin. The negative control over the product's own vectors — all thirteen pins,
  `--depth=1`, `-o lstart=`, the bare root operand on `git init`, the
  out-of-root fetch source — passes unchanged.
- Two residuals recorded rather than repaired. The multi-token case reports two
  origins, the whole absolute argument and its path token, because suppressing
  the whole-argument reading on whitespace would lose a real filename
  containing a space; the detector's posture is to add a report rather than
  suppress one. And the inventory gate widening has no durable test: its
  discrimination rests on the reverted probe above, so a future regression
  would not be caught by the suite.
- Citation repair after this round: 22 instances across 12 rows covering 17
  distinct spans, all refound by subject. Sixteen of the seventeen refound
  blocks have exactly the same line count as the span they replace; the one
  exception is the AC-0137 describe, which legitimately grew from 92 to 98
  lines in this repair.
- One citation the checker could not catch was found and repaired. AC-0049
  cited `absence-proofs.test.ts:1122-1278#submodule.recurse`, which passed the
  gate only because the anchor happened to fall inside the stale range while
  the span pointed at the wrong construct. Its real subject is the AC-0141
  describe, now 1216-1372, which the controller confirmed starts on that
  describe line. This is the clean-looking false citation the no-offset rule
  exists to prevent, and it survived two earlier passes.
- Open residue, recorded: citations into `runtime-supervisor.ts`,
  `runtime-environment.ts`, `source-inspection-storage.test.ts`, and
  `pinned-git-configuration-proof.test.ts` in rows outside this repair's blast
  radius were not individually opened. They pass the gate, but the gate cannot
  catch a plausible-but-wrong line.
- Post-repair readings: `absence-proofs.test.ts` 62 of 62 in 41.7s,
  `test/hostile-fixture.test.ts` 44 of 44 in 28.7s,
  `pinned-git-configuration-proof.test.ts` 13 of 13 in 10.8s. `pnpm lint`
  passed over 132 files, `pnpm typecheck` passed, `pnpm governance` passed all
  6 checks, `acceptance-audit-counts.py --check` reports 157 rows, 100 met, 53
  not met, 4 not verifiable here with every citation resolving, its self-test
  passed, and `lint-spec-status.py` reports metadata clean.

## Review round 3 and its repairs — 2026-09-30

- All three reviewers re-ran. Raw counts: adversarial 5, security 3, quality 9.
  Adjudication totals: 8 sustained, 11 refuted, 0 indeterminate — adversarial 3
  of 5, security 2 of 3, quality 3 of 9. After deduplicating overlap, 5
  distinct repairs. No fingerprint repeated an earlier round, so the loop was
  finding new defects rather than circling.
- The execution-origin detector gave up two further shapes, both the
  composition or sibling of what round 2 repaired. An absolute worktree token
  carrying `=` inside a multi-token argument — `node <root>/.probe/a=b.mjs` —
  reported nothing, because the whole argument is not absolute and the token
  went down the `=` branch. Its relative sibling `.probe/a=b.mjs` reported
  nothing for the same reason, though it resolves inside the root.
- The residual recorded in round 2 did not justify either gap, and the
  controller had accepted it. That residual said a token containing `=` cannot
  be emitted whole because the relative pin `core.hooksPath=/dev/null` would be
  reported. An absolute-gated token reading cannot report that pin, so the
  stated reason ruled out a repair it was never in conflict with. Both
  adjudicators reached this independently.
- A third detector defect: the `://` scheme exclusion ran before the
  `isAbsolute` test, so an exclusion written for the fetch URL also suppressed
  a genuine absolute in-root path, which is broader than the exclusion's own
  stated reason.
- Two fail-open holes in the construction inventory, either of which lets a
  newly added production module's starts read as clean, breaking AC-0001's
  clause that an added unclassified start must make the inventory fail. The
  import capture `(?<names>[\s\S]*?)` anchored at a file's first `import {`, so
  a named import sorted before `node:child_process` was swallowed into the
  names group: the sentinel was never reached, the garbage callee matched no
  line, and the module yielded zero sites. Verified directly by the controller:
  with `node:assert` imported first the captured group is
  `" ok } from \"node:assert\";\nimport { spawn "` and no derived callee matches
  a `spawn(` line. All five production modules happen to import
  `node:child_process` first, so the hole was masked by luck rather than
  design. Separately, the entry gate keyed on the `node:` spelling, so
  `from "child_process"` or a `createRequire` read yielded zero sites.
- Repairs applied, test scope only with no production source changed: a token
  now receives the same absolute reading the whole argument gets, and an
  `=`-bearing argument or token also contributes its own path when the text
  before the first `=` carries a path separator; the scheme exclusion now runs
  after the absolute test; the import capture is bounded to `[^;{}]*?`; and the
  entry gate matches the builtin with an optional `node:` prefix. The detector
  doc block now states the readings each level actually receives rather than
  claiming token and argument are read alike.
- Redness proven rather than assumed. Reinstating the pre-round-3
  `operandCandidates` body reddened both new detector cases while the round-2
  case stayed green, so the two new cases are the discriminating ones. Three
  probe modules in the production directory — `node:assert` first, a bare
  `child_process` specifier, and a `createRequire` read — each yielded zero
  sites before the repair and reddened the inventory after. Every probe was
  reverted and the files checksum-verified byte-identical.
- Controller re-execution of the two regex repairs across all four import
  shapes confirms the gate admits each and that the bare specifier and
  `createRequire` forms now reach the sentinel while the `node:assert`-first
  shape yields its real callee.
- The implementer corrected its own doc block after a probe falsified its first
  draft, which had claimed the `node:assert`-first shape falls through to the
  sentinel; it measured that the shape yields a real unclassified site instead
  and fixed the comment rather than the measurement.
- The AC-0137 row now discloses both test-owned widenings rather than one. Its
  Reachability condition already named `additionalGitTransports`; it now also
  records that both guard-present arms pass `executionProofLog`, which puts
  `STUDIO_PROBE_LOG` into every descendant environment, a name the default-run
  allowlist assertion does not permit. That edit was proven to contribute no
  citation breakage by running the checker with it reverted and applied and
  comparing byte-identical output.
- Citation repair after this round: 22 occurrences across 20 distinct spans on
  12 rows, all refound from scratch. The pre-edit source was not recoverable
  from `HEAD`, which holds a 598-line version, so no stale text could be used
  as a reference. All 20 of 20 refound constructs match their stale span's line
  count exactly, and because length was never an input to the search, twenty
  independent exact matches is strong evidence each landed on the construct the
  original author cited. A masked-span comparison confirms the two readings are
  byte-identical outside the citation spans.
- Two further gate-passing-but-wrong spans were found by reading rather than by
  the checker, which flagged neither. `434-446#expectMaterialized`, cited by
  three rows, resolved only because a *call* to that function fell inside the
  range while the span covered the trial helper rather than the guard the rows
  describe; it is now `455-467`, the definition. And `1216-1372`, the AC-0049
  span a previous pass had already repaired, spanned four unrelated constructs
  and resolved only because its anchor token happened to fall inside; it is now
  `1319-1475`, the AC-0141 describe the row is about.
- The second of those is the more useful lesson: a citation repair pass
  produced a span that was itself plausible-but-wrong and passed the gate. The
  checker cannot catch this class, so a span is only as good as the reading
  that produced it.
- Post-repair readings: `absence-proofs.test.ts` 64 of 64 in 41.7s,
  `test/hostile-fixture.test.ts` 44 of 44 in 27.9s. `pnpm lint` passed over 132
  files, `pnpm typecheck` passed, `pnpm governance` passed all 6 checks,
  `acceptance-audit-counts.py --check` reports 157 rows, 100 met, 53 not met, 4
  not verifiable here with every citation resolving, its self-test passed, and
  `lint-spec-status.py` reports metadata clean.

## Review round 4 and its repairs — 2026-09-30

- Raw counts: adversarial 5, security 1, quality 1. Adjudication: security
  clean, quality clean, adversarial 2 sustained and 1 refuted. No unresolved
  Blocker or Concern remained across any reviewer, so the reviewer requirement
  was satisfied at this round; the two sustained items were Nits.
- Each reviewer was told explicitly that returning clean is a legitimate answer
  and that a round manufacturing findings to justify itself is worse than one
  that ends, and each adjudicator was told to weigh a late finding neither
  discounted for arriving late nor sustained to justify the round.
- Security's single finding was refuted on reachability. A shell-operator-joined
  payload is not parsed, but `SpawnAuditEntry` type-pins `shell: false`, all
  fifteen production start sites pass `shell: false`, and no production `-c`
  payload is shell-interpreted or repository-influenced. The adjudicator
  checked specifically whether this was a fourth instance of the round 1-3
  overclaim class and found it was not: the detector's doc block already states
  its readings per level and claims no shell-operator parsing, so no string
  overclaimed the channel.
- Quality's single finding was refuted on authority. AC-0002 and AC-0003
  require exactly the absence assertion plus a reddening product-Runtime
  mutation, both present and discriminating at their expected origins; the
  marker post-condition is named by AC-0004 alone, which is why round 1
  repaired AC-0137 and not those two.
- Adversarial's Blocker was refuted on reachability. The `://` exclusion does
  drop a non-absolute scheme-bearing candidate, but no hostile-repository
  content can spell a `file://` operand into a product vector: a path component
  cannot contain `/` and git rejects a tree path carrying `//`. The finding
  affirmatively stated the absence of present reach, which is what refuted the
  severity rather than merely reducing it.
- Two sustained Nits, both the false-claim class this unit has swept
  repeatedly, both verified by the controller before repair and both fixed
  rather than deferred.
- The detector doc block said "The fetch URL is not absolute, so it stays
  unreported under either order." Both halves are false of every record in
  scope: these trials fetch from `fixture.source`, which the fixture builds as
  `join(root, "source")`, an absolute local path with no scheme, and it stays
  unreported because it sits outside the materialization root. A reader
  checking whether the round-3 `isAbsolute`-first ordering is still needed
  would have been checking it against a reason that was never true here. The
  block now records that no record read here carries a scheme-bearing
  candidate, and why the ordering is retained anyway.
- `connect-and-orient/notes/HANDOVER.md` still asserted that `spawnAudited` is
  the Service's only process-start primitive for this trial. This unit's own
  construction inventory measures that false — six direct
  `node:child_process` starts in `runtime-child.ts` reach the record through
  `recordSpawn`, two of them classified repository-influenced — and this
  spec's pre-approval ledger entry said so in words before implementation
  began. The sentence sits in the paragraph this diff already edits, so leaving
  it would have repeated the AC-0049 inconsistency exactly. Corrected
  additively and dated, recording that the exhaustiveness the proofs rest on is
  the classified inventory over production starts, not a single mediating
  primitive.
- Nits are normally deferred rather than repaired. These two were repaired
  because they are false statements of fact rather than cosmetics, and the
  cost was bounded to re-running only the reviewer that produced them.

## Citation-scope defect found and repaired — 2026-09-30

- A seven-line doc-comment insertion moved spans again. The checker flagged 12,
  and repairing those 12 was the scope the controller briefed — which was
  wrong, and wrong in a way four earlier citation passes shared.
- The checker's anchor test asks only whether the anchor appears anywhere in
  the span. A span shifted by less than its own length therefore keeps its
  anchor and keeps passing, while pointing at the wrong construct. So an
  insertion silently corrupts every span below it whose anchor happens to
  remain inside, and the gate reports none of them. The correct scope after any
  insertion is every span below the insertion point, not the flagged subset.
- Nine such spans existed here. Seven were surfaced by the implementer outside
  its brief rather than silently fixed or silently ignored; three of those
  started on a continuation line inside a neighbouring test's body. A further
  sweep caught two more that sat far above the block under review, including
  one where a single stale span was carrying two different anchors in two
  different rows, so it would have survived a list-driven repair untouched.
- AC-0049's span has now been wrong three separate times across passes, each
  time while passing the gate. That row is the clearest evidence that a green
  checker is not evidence a citation is correct.
- All 22 citations into `absence-proofs.test.ts` were re-derived from the
  current source. Controller verification, written independently of the
  implementer's report: every cited span starts on a `function`, `const`,
  `describe`, or `it` declaration line — zero exceptions. All 21 edits match
  their stale span's line count exactly.
- Counted from the audit's current rows, the file carries **22 citation
  occurrences** over **17 distinct spans**, which is 20 distinct
  span-and-anchor pairs. Three spans are cited more than once:
  `455-467#expectMaterialized` in the AC-0134, AC-0135 and AC-0137 rows;
  `656-683` three times under the three different anchors
  `#interpreter-operand`, `#repositoryExecutionOrigins` and `#command-payload`;
  and `940-976` twice, under `#.agents` in AC-0047 and
  `#executionProofMutation` in AC-0135.
- Corrected 2026-09-30, and the correction is itself the point. This entry
  first said "20 distinct spans parsed out of the audit" and "All 22 spans
  already satisfy that rule". The verifying script deduplicated by
  span *and anchor*, so 20 was the pair count reported as a span count, and the
  second sentence counted occurrences as spans. Both figures were wrong in the
  sentence offered as the independent check on the re-derivation — the same
  record-disagrees-with-what-it-describes class this unit repaired three times
  earlier, this time in the controller's own verification prose. The
  declaration-line result it reported is unaffected and was re-measured.
- Carried forward for the owner, not implemented here because no acceptance
  criterion requires it: one way to make the gate catch the shifted-span class
  is to require a citation span to *start* on a declaration line. The
  declaration-line result measured above covers the 22 `absence-proofs.test.ts`
  citations only, and all of those satisfy it.
- Audit-wide cost of that proposal, measured 2026-09-30 rather than inferred:
  the acceptance audit carries 360 distinct `file:line-line` spans, of which
  220 start on a line matching a declaration keyword, 138 do not, and 2 could
  not be resolved to a file. Non-conforming starts are ordinary and often
  correct — `git-driver.ts:20` starts on the string literal
  `"core.protectHFS=true",` inside the pinned-configuration array, several
  `ConnectRepositoryForm.tsx` spans start on JSX, and four spans cite markdown
  research files that contain no declarations at all. So the rule is **not**
  zero-cost audit-wide, and adopting it would need either roughly 138 span
  revisions or a narrower rule — for instance applying only to spans citing a
  `function`, `describe`, or `it` anchor.
- Corrected 2026-09-30, and this one is the sharper lesson. The bullet above
  first read "Every span in the audit already satisfies that rule, so adopting
  it would need no further edits." That generalised a result measured over 22
  citations to all 360, and it was the immediately preceding correction in this
  same entry that broadened it: the original text said "All 22 spans", which
  was true and correctly scoped, and the repair replaced a true narrow claim
  with a false wide one. This is the fifth instance in this unit of a record
  disagreeing with what it describes, the second of them in the controller's
  own prose, and the first introduced *by* a repair to an earlier instance. A
  fix that widens a claim's scope needs the wider claim measured, not inherited
  from the narrower one it replaced.

## Review rounds 5 and 6, and the retry cap — 2026-09-30

- Both rounds were confined re-reviews of the controller's own applied repairs,
  run only because the controller chose to repair sustained Nits rather than
  defer them. The reviewer requirement — no unresolved Blocker or Concern from
  any warranted reviewer — has been satisfied since round 4.
- Round 5, adversarial only: 1 raw, 1 sustained, 0 refuted. It found this
  ledger's own controller-verification sentence overstated its figures, saying
  "20 distinct spans parsed out of the audit" where 20 was a span-and-anchor
  pair count. Repaired, with true counts measured and the three multiply-cited
  spans named.
- Round 6, adversarial only: 1 raw, 1 sustained, 0 refuted. Graded Concern by
  the reviewer and reduced to Nit on adjudication, because the only surface it
  cites is this delivery ledger, which no gate parses and on which no
  acceptance criterion rests.
- The round-6 finding is the sharpest lesson of this delivery. The round-5
  repair replaced a true narrow claim, "All 22 spans already satisfy that
  rule", with a false wide one, "Every span in the audit already satisfies that
  rule, so adopting it would need no further edits". Measured: 360 distinct
  spans, 220 starting on a declaration-keyword line, 138 not, 2 unresolvable.
  Many non-conforming starts are legitimate — `git-driver.ts:20` is the string
  literal `"core.protectHFS=true",` inside the pinned-configuration array,
  several `ConnectRepositoryForm.tsx` spans start on JSX, and four spans cite
  markdown research files with no declarations.
- That measurement was produced twice by two independently written scripts,
  which agreed exactly on 360/220/138/2. The duplication was warranted because
  the claim being corrected was itself a miscount.
- Process error, recorded because a correct outcome does not excuse it: the
  controller verified the round-6 finding and applied its repair **before**
  dispatching adjudication, inverting the required order in which only
  adjudicated-sustained findings reach FIX. The adjudicator was told so
  explicitly, judged the finding against the text as cited, and recorded the
  inversion in its verdict. The fix is sound and was independently measured,
  but the sequence removed the check that exists so a controller does not both
  discover and rule on its own work.
- Standing lesson: a repair that widens a claim's scope must measure the wider
  claim. Scope cannot be inherited from the narrower statement it replaces.
  This was the fifth instance in this unit of a record disagreeing with what it
  describes, the second in controller prose, and the first introduced by a
  repair to an earlier instance.
- The round-6 adjudication requires no further edit. It confirms the applied
  repair closes the finding, that the 360/220/138/2 split sums correctly, and
  that its three illustrative non-conforming starts hold against the tree.

## Stop condition reached — review retry cap — 2026-09-30

- The `findings-remain` transition for round 6 was **refused**: the engine
  reports the review retry cap reached at 5 of 5. Cohort state therefore still
  records 5 review rounds and 5 retries, the engine remains at `CODE-REVIEW`
  transition sequence 28 with `last_event = gates-clean`, and round 6 is not
  recorded as a cohort review round. Its raw and adjudication artifacts are
  persisted and validated under `.context/reviews/<run-id>/` regardless.
- The engine's default answer to a cap is to reset and start a new run, on the
  ground that a cap firing means the loop stopped converging. Only a human
  directing this run may continue past it, with
  `--allow-retry-cap-override`. The controller has not done so and will not;
  this is surfaced to the owner instead.
- The convergence evidence runs against the default reading, and both sides are
  recorded here so the owner can judge rather than take the controller's word.
  Raw findings per round were 32, 13, 17, 5, 1, 1; sustained were 15, 7, 8, 2,
  1, 1; distinct repairs were 10, 5, 5, 2, 1, 0. No finding fingerprint has
  repeated in any round, so no round re-found what an earlier one had already
  raised. Four of the five retries were consumed by rounds the reviewer
  requirement did not demand: it was satisfied at round 4, and rounds 5 and 6
  exist because the controller repaired Nits rather than deferring them, each
  repair obliging a re-run of the reviewer that produced it.
- Current verification state at the cap: `pnpm lint` 132 files clean,
  `pnpm typecheck` clean, `pnpm governance` all 6 checks, `pnpm build` exit 0,
  `pnpm test:capped` 849 passed with 3 skipped and 0 failed,
  `acceptance-audit-counts.py --check` 157 rows with every citation resolving,
  its self-test clean, and `lint-spec-status.py` metadata clean.
- Nothing is committed and no pull request is open.

## Round 7 and closeout — 2026-09-30

- Owner authorised continuing past the review retry cap. The round-6
  `findings-remain` transition was re-fired with `--allow-retry-cap-override`
  and the sustained fingerprint; cohort state records 6 rounds and 6 retries.
- Round 7, adversarial only, returned the bare clean sentinel: 27 bytes,
  classified `clean` with zero findings and no `## Not checked` footer. It
  independently re-measured the audit-wide span figures and agreed at 360
  distinct spans with 220 declaration-starts — the third independent
  confirmation of the count this delivery twice stated wrongly.
- Reviewer requirement satisfied in full: `adversarial-reviewer` clean at round
  7, `security-reviewer` clean at round 4, `quality-engineer` clean at round 4.
  No unresolved Blocker or Concern from any warranted reviewer, and no unacted
  Nit outstanding — every sustained Nit in this run was repaired rather than
  deferred. `experience-reviewer`, `frontend-reviewer` and `design-reviewer`
  were not warranted: the change ships no reader- or adopter-facing surface, no
  HTML, CSS or JS primary output, and no architect-pack artifact.
- `reviewers-clean` fired with `--structural-clean-file`; the report is clean
  and footer-free but not byte-exact, differing only by a trailing newline.
  Engine at `CODE-HUMAN-GATE`, transition sequence 32, awaiting the merge
  decision.
- Process error, recorded: `plan.md` was edited to `Status: Done` *before*
  `reviewers-clean` fired, which broke the scheduled baseline hash and the
  transition refused. The edit was reverted, the baseline re-verified with
  `loop-cohort plan check-current --require-schedule`, the transition fired,
  and the status set to `Done` afterwards. Lifecycle bookkeeping on a
  hash-pinned artifact belongs after the transition that validates it, not
  before.
- Final gate set on the shipped tree: `pnpm lint` 132 files with no fixes;
  `pnpm typecheck` clean; `pnpm governance` all 6 checks; `pnpm build` exit 0;
  `pnpm test:capped` 849 passed, 3 skipped, 0 failed, 57 of 58 files, 106.9s;
  `acceptance-audit-counts.py --check` 157 rows, 100 met, 53 not met, 4 not
  verifiable here, every citation resolving; its self-test clean;
  `lint-spec-status.py --root .` metadata clean.
- The source digest of `git diff apps/ packages/` is
  `6006e8ee15283e848e0cefbbfa6a24c0e93ec10c7de569541f3e4ca9b34400c9`, identical
  across every reading quoted above, so the capped result and the gate receipts
  describe one tree rather than several.
- `spec.md` is `Shipped` with all nine acceptance criteria checked; `plan.md` is
  `Done`.
