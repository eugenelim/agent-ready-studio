# Handover — connect-and-orient

Written 2026-09-22, updated 2026-09-27 after the abandoned contract amendment. Current as of the commit that
carries it. This is the whole picture, not only the cluster in flight; the cluster section names
where to start.

Read next: [`acceptance-audit.md`](acceptance-audit.md) for what is and is not met, then the
last few entries of [`verification-ledger.md`](verification-ledger.md) for how the work went.
The spec is [`../spec.md`](../spec.md).

---

## 1. State

| | |
| --- | --- |
| Worktree | a git worktree of this repository; run every command from its root |
| Branch | work continues from `main`, which carries everything through PR #17. The `eugenelim/provisional-runtime-build` worktree this file was written in no longer exists; engine state was carried across on 2026-09-25. The `eugenelim/step-e-etc` worktree was then removed **without** carrying it, which is how the run came to be rebuilt on 2026-09-26. Both state files are gitignored, so removing a worktree destroys them |
| PR | **#14 through #19** merged; #19 at `462e2fa` on 2026-09-27 carried the security-proof unit — the hostile fixture bound to `PINNED_GIT_CONFIGURATION`, AC-0133 and AC-0139 closed, six criteria recorded vacuous, four follow-ons registered, and a contract amendment opened and abandoned. Its residual risk is in the PR's *Review verdict* block and at [`verification-ledger.md#review-record-gap-2026-09-27`](verification-ledger.md#review-record-gap-2026-09-27). #17 carried review rounds 12 to 15 — the `declaredVersionState` honesty repairs, AC-0043's two widenings, the storage and migration work, and the record corrections |
| Spec status | `Implementing`. The counts live in [`acceptance-audit.md`](acceptance-audit.md) and are generated from its rows — read them there rather than from a copy here |
| Engine | `CODE-IMPLEMENTATION`, answered by PR #19's merge on 2026-09-27 — **the next unit starts here, do not wait for a decision already given.** The rebuilt run reaches this state through the approval ceremony rather than through `blocker-applied`, which was the dead run's last event. Read the current state, sequence and `last_event` from `engine-state.json` rather than from a copy here. PR #17's human gate was answered by its merge on 2026-09-26, so **the next unit starts here** — do not wait for a decision already given. The open-criterion count lives in [`acceptance-audit.md`](acceptance-audit.md) and is generated from its rows; the spec stays `Implementing` while any accepted criterion is open |
| Cohort | `completed_task_ids` T1–T12, T14, T15. **Read the counters and the wave shape from `state.json`, which owns them, or from [`verification-ledger.md#approvals-2026-09-27`](verification-ledger.md#approvals-2026-09-27), which records the post-ceremony state.** A count copied into this row has drifted twice. What does not change: rounds that sustain findings each spend an owner-granted waiver against a cap of 5, and the cap is deliberately not raised |
| Run id | `ead54d32-33b1-44b4-8eea-bf76150a5f77`. The earlier `f87c797b-8bed-46c2-96fd-e8d22fb8eb3d` is dead — its state files went with the removed `step-e-etc` worktree and the run was rebuilt on 2026-09-26. Ledger entries above that name the old id are historical, not live: [`verification-ledger.md#engine-state-rebuilt-2026-09-26`](verification-ledger.md) |
| Gate | Read the gate reading from the ledger entry for the round that took it — the latest is [`verification-ledger.md#review-rounds-16-and-17-2026-09-26`](verification-ledger.md). A count copied here is a second source that drifts, which is how this row came to disagree with the ledger written beside it. What does not change: uncapped runs fail a varying set of trial-runtime cases under host load, every failing case passes in isolation, and `pnpm test:capped` is the documented second reading |

**Cohort, beyond the table above.** `plan_review_status: approved`, `implementation_retry_count`
0. A clean round does not consume a retry, which is why the recorded round count runs ahead of the
retry count. T14, T12 and T13 were closed by verifying their Done-when rather than re-running
them. `amendment_history` is now empty: the 2026-09-26 rebuild started a fresh run and no contract change
was made during it. The amendment history that matters is in this file and the ledger, not in state.

**A second reset ran on 2026-09-24, and `amendment_history` does not record the amendment it
served.** The four owner-authorized contract changes at
`#owner-decision-2026-09-24-step-c-carried-items` were written into `spec.md` first, and the
baseline was then re-pinned to them through `reset` → `init` → `approve-plan` → `schedule` —
because `contract-amendment` refuses while the **plan** baseline is stale, and its own message
prescribes `reset` as the recovery. So `begin_contract_amendment` never ran and wrote no entry.
Both state files are gitignored, so **the ledger is the durable audit trail for that amendment**;
it carries the owner decision, the refused transition and the reset. The completion record was
restored afterwards: 14 task IDs, section hashes recomputed rather than copied, counters at 10
rounds and 9 retries.

**T15's pinned section runs to end of file.** `_task_sections` gives the last task everything from
its heading to EOF, so T15's pin spans `## Rollout`, `## Risks` and the whole `## Changelog`. Every
amendment in this plan appends a Changelog entry, so **the next one will refuse as though a
completed task had been edited.** The workaround is at
`#cohort-state-loss-and-repair-2026-09-23` — set the entry aside, run the ceremony against the
pinned text, re-add it afterwards — **does not work, and the 2026-09-23 entry already calls it "a
defect with a delay on it, not a resolution".** Both routes were tried and measured on 2026-09-27:
appending during the ceremony makes `approve-plan` refuse with "completed task section changed:
T15", and appending after `plan-locked` breaks the plan baseline, whose only offered recovery is a
cohort reset that clears the retry counters. **Do not re-add the entry.** Put the approval record
in the ledger, as [`#approvals-2026-09-27`](verification-ledger.md#approvals-2026-09-27) does, and
see the registered `loop-cohort-last-task-pin-swallows-the-changelog` for the fix.

**The review cap is already exceeded and will block.** `findings-remain` and
`review record --fingerprint` both refuse at or above `max_review_retries`. A round that sustains
findings therefore needs either `--allow-retry-cap-override` on **both** halves — one round per
waiver — or the cap raised in the spec's own untracked `state.json`. That is a human decision by
the state-schema reference's own words, so surface it rather than taking it.

**This is slice 1 of two.** The spec says so at its head. Canonical artifact viewing, the full
work-state projection, capability inventory, shaping-availability explanation, refresh and
staleness, and projection persistence are **slice 2** and deliberately absent. Definition-of-done
items 8, 9 and 10 land with that slice; item 7 is slice 1's, delivered by AC-0100 to AC-0104.

**Only `ini-004` (Repository Workspace Pane, M1) is active** in `workspace.toml`.

---

## 2. How this got here

Eleven tasks were marked complete on unit tests. A previous session found the product path had
never been assembled — `resolveRevision`, `materializeRevision`, `startTrialInspection` and
`buildNorthboundRequest` had zero production callers between them, nothing dispatched
`source.*`, and 181 renderer assertions passed against a path that did not exist. That is the
retraction at `#retraction-2026-09-19-t12-t13-delivery-claims`.

This session ran the first reconciliation of all 157 criteria against the tree, then started
closing the largest cluster. **Frozen reading of the spec's checked boxes, 2026-09-22**, from
`verification-ledger.md#review-round-53-2026-09-22` and `#slice-f1-step-a-2026-09-22`: the checked
count moved 82 → 75 as `met` rows were **tested rather than read**, then 75 → 77 as work landed.
The movement is why these are kept — testing a `met` row lost more than the work gained.

**Do not align these against the audit.** They are spec-checkbox counts on 2026-09-22; the audit's
own 2026-09-23 re-run read 82 / 72 / 3, and that 82 is a different quantity on a different day
than the 82 this trajectory starts from. The live figures are generated in
[`acceptance-audit.md`](acceptance-audit.md) and the round count lives in `state.json`. Copy
neither here.

**Two reading habits caused every false `met` found:** trusting a row's note instead of the
tree, and correcting a note without re-testing the verdict it supported. The route that works
is to take the criterion's own wording — especially a proviso, a qualifier like "observed" or
"on demand", or a universal like "every", "never", "only", "wherever" — and test it directly.

---

## 3. The criteria not recorded met

### By group

Every count is generated from the rows of [`acceptance-audit.md`](acceptance-audit.md) by
`tools/acceptance-audit-counts.py`, which `pnpm governance` re-checks. **Read the counts there.**
Each group's `###` heading carries its own met / not met / not verifiable split, and the headline
at the top of that file carries the total. A copy here would be a second source that drifts, which
is the defect this slice keeps producing.

The *Provisional contract* group is closed, 12 of 12. *Security proofs, and suite-level evidence*
is the largest group still open and is the next cluster, by owner decision on 2026-09-25.

### The four recorded "not verifiable here"

Not defects — they need something this repository cannot supply offline.

| Criterion | Needs |
| --- | --- |
| AC-0012 | The live smoke. Binding the child's `HEAD` check needs a fetch, and *Permitted git transports* admits `https` only via `GIT_ALLOW_PROTOCOL=https`, which refuses the file transport a local fixture repository needs. Owner decision, 2026-09-25 |
| AC-0024 | The live smoke behind `CONNECT_ORIENT_SMOKE=1`, which reaches github.com. It **is** asserted there and would bind if enabled |
| AC-0114 | A browser capture of the verdict surface, which needs a completed inspection |
| AC-0131 | The built application under Chromium; the check is real and measured |

AC-0025 and AC-0030 were in this table and are **now recorded met**: the 2026-09-23 re-run found
both bound offline against a real process group — the sampled group against the permitted-executable
check with an exhaustive audit beside it, and descendants asserted alive before shutdown and dead
after. Only their transport-helper clauses need the smoke, and those are carried by T13.

### The clusters

**A. Modules written, tested, called by nothing — closed as a cluster.** The wiring landed and
every module named in it has a disposition; three reporting clauses remain. See §4.

**B. Hostile-repository proofs — 2 open of the 13 rows AC-0133 to AC-0145**, counted from the audit rather than copied: AC-0138 and AC-0145. Regenerate it from the rows; do not trust this sentence over them. The re-implementation is gone:
`test/hostile-fixture.ts:528-541#materializationPins` builds the vector by filtering the product's
`PINNED_GIT_CONFIGURATION`, and `:570-631#materialize` applies it to pinned `init`, `fetch`, forced
checkout and `rev-parse --verify HEAD`, matching the product's materialization shape. The completed
pinned-Git proof unit is recorded in `docs/specs/pinned-git-configuration-proof/` and in the audit's
*Pinned Git configuration proof boundary*. **Six of thirteen pins now have behavioral one-pin-
omission evidence**: `http.followRedirects=false`, `core.hooksPath=/dev/null`,
`core.symlinks=false`, `protocol.version=2`, `transfer.fsckObjects=true` and `core.protectHFS=true`. The other seven are
explicitly constant-only; the audit, not this handover, owns the pin-by-pin reasons.

**The separate positive-control repair remains open.** Only two of the fourteen positive controls
demonstrably remove a product guard — `repository-hook` and `escaping-symlink`, the two passing
`omitPinPrefix`. An earlier reading of this row said three remove no guard; that number was never
derived, and reading all fourteen branches does not support it. What is established is the two;
the status of the other twelve is the routed work under
`connect-orient-positive-controls-that-remove-no-guard`.

**Five criteria remain vacuous by construction**: AC-0134, AC-0135 and AC-0137 because
`git checkout` never runs a `package.json` script, never executes a file under `.agents/` and
never runs a smudge filter nobody configured; **AC-0141** because the fixture writes
`.gitmodules` as plain text with no gitlink, so nothing can recurse into it; and **AC-0146**
because the credential negative runs over a path the credential never reaches. All five are routed
to the spawn-audit surface by the owner's decision of 2026-09-26, registered as
`connect-orient-rebind-the-vacuous-criteria-to-the-spawn-audit` in `workspace.toml` (that entry was replaced on 2026-09-30: the five are now proven by `connect-orient-falsifiable-criteria-proofs`, and AC-0136 was closed on 2026-10-01 by `connect-orient-ac0136-overwrite-arm`; see *AC-0136 is now met* below) — `spawnAudited`
(`executable-identity.ts:28`) is the Service's only process-start primitive for this trial and
every entry records an absolute `executable`, so "Studio never executes anything out of the
materialized worktree" is a property that can fail. **Highest risk reduction per criterion, no new
product capability.** Corrected 2026-09-30: `spawnAudited` is not the only process-start primitive,
and the proof does not rest on that claim. `connect-orient-falsifiable-criteria-proofs` added a
construction inventory that classifies every `node:child_process` start in the production Runtime
modules — six of them in `runtime-child.ts` reach the parent-visible record through `recordSpawn`
rather than through `spawnAudited`, two of those classified repository-influenced. The
exhaustiveness the five proofs rest on is that classified inventory over production starts, not a
single mediating primitive.

**AC-0136 is now met, falsifiability `S`.** The overwrite proof closed on 2026-10-01 under
`connect-orient-ac0136-overwrite-arm`. On a scratch HFS+ volume, where `.gi<U+200C>t` is `.git`,
both runs omit `transfer.fsckObjects` and set `core.protectHFS=false` ambiently. With the product's
`core.protectHFS=true` present, checkout refuses; with it omitted, `.git/config` is overwritten. The
`.GIT` arm is protected by git's own path check regardless of product pins; by owner decision
2026-10-01 that arm is recorded as git's own protection. `core.protectHFS=true` is now the sixth
behavioral pin. The audit row carries the full evidence and the decision record.

**C. The renderer half — roughly 18.** AC-0105 and AC-0106 open because every test renders
`InspectionSurface` directly and deleting it from `App.tsx:242` reddens nothing. Most Honest
states criteria are bound at the projection with no renderer assertion, or the reverse. This is
the half a lead sees, and it would make a demoable increment — but it renders states the
pipeline still cannot produce.

**D. Quality floor — 8.** Shape tokens not tied to rendered rules, focus indicators unasserted
because jsdom loads no stylesheet, and two capture criteria whose narrowest viewport is 720 px
where WCAG 2.2 1.4.10 names 320.

---

## 4. The cluster, and what it left behind

`connect-orient-wire-the-uncalled-modules` — **23 criteria**, one cause, and it is the defect
class the retraction came from. **The wiring is done.** Steps A through D and five
owner-approved carried items landed across PRs #14, #15 and #16, and review rounds 12 to 15,
merged as PR #17, repaired what they got wrong. Three criteria of the twenty-three are still not met, and each is a
reporting clause rather than a wiring one: **AC-0055** (the file-count leg), **AC-0059** (the
declaration-file branch) and **AC-0060** (bound only to the reader's output shape). The
`workspace.toml` entry carries the same list and stays open on it.

| Step | What landed | Criteria |
| --- | --- | --- |
| A | `BoundedResultReader` and `BoundedDiagnosticBuffer` wired into `runtime-supervisor.ts`, replacing two unbounded `+=` accumulations | AC-0037, AC-0155 |
| B | the child reads declared values, using a local reader because it deliberately imports nothing but `node:` builtins | AC-0054, AC-0056, AC-0057 |
| C | the child writes a full `result` line and the Service validates it before normalizing, closing *Provisional contract* 12 of 12 | AC-0032, AC-0034 to AC-0036, AC-0038, AC-0039 |
| D | the inspector locator, wired to locate and record rather than run | AC-0043 to AC-0046, AC-0048 |

> Step C's split is worth keeping in mind: the marker is not on the child's line, because
> reporting it means parsing TOML and the child's import graph may not reach one. The Service
> composes it from the child's own `declared` line. An **absent** declared report is refused
> rather than filled in, because `declaredVersionMarker: null` means *the repository declares
> none* and AC-0064 turns on that distinction.

**AC-0012 left the set on 2026-09-25** as *not verifiable here* rather than as a defect, by owner
decision. **AC-0088, AC-0091 and AC-0092** are routed at
`connect-orient-stop-reason-never-resolved`: they need a production site mapping a terminating
condition to a `StopReasonKey`. **AC-0148** is routed at
`connect-orient-default-suite-reaches-the-network` — gating the two ungated e2e cases removes the
only default-gate binding on accepted dispatch, so it is an owner design call.

### Zero-caller status — settled

Every module the cluster named now has a disposition, which was the point: leaving one undecided
reproduces the defect class the cluster exists to remove. Re-check a count before trusting it.

| Symbol | Disposition |
| --- | --- |
| `locateTrustedInspector`, `selectConformingInterpreter` | wired, Step D |
| `normalizeDeclared` | live, in `runtime-supervisor.ts` |
| `normalizeTrialResult` | live, in `source-inspection.ts` |
| `BoundedResultReader`, `BoundedDiagnosticBuffer` | live, Step A |
| `readDeclaredValues`, the Service-side one in `declared-value-reader.ts` | **deleted** 2026-09-24. The child's own `readDeclaredValues` in `runtime-child.ts` is a different function, is live, and is the only reader of the materialized tree |
| `materializeRevision` | **deleted** 2026-09-24, with the `materialize` and `readHead` transport members under it. No verdict moved: AC-0009 is bound against the vectors a real child emits and AC-0014 against the verdict surface |
| `toPersistedRepresentation` | **deleted** 2026-09-25, with `PersistedTrialResult`. AC-0040 is bound against the real storage path in `source-inspection.ts`, so this second persisted representation could never acquire a caller |
| `buildNorthboundRequest` | **kept, callerless by contract.** AC-0041 requires the seam module to have no non-seam importer, so a production caller would redden it |
| `observedVersions` | **kept.** It carries AC-0068's absence proof, so deleting it moves a met verdict, and it is the function AC-0067's renderer work will call |

---

## 5. Everything else on the register

`workspace.toml [backlog].open`, connect-and-orient entries:

| Slug | What it holds |
| --- | --- |
| `connect-orient-wire-the-uncalled-modules` | The cluster in flight |
| `connect-orient-no-inspector-runs` | AC-0061 to AC-0068 composed but unexercised; owner says next slice. The malformed-declaration decision it used to inherit is **settled** — the third state, `declaredVersionState` |
| `connect-orient-stop-reason-never-resolved` | Nothing maps a terminating condition to a `StopReasonKey` |
| `connect-orient-default-suite-reaches-the-network` | Two ungated e2e cases; owner design call |
| `connect-orient-restored-result-drops-reason-and-wait-window` | Storage migration the protocol approval did not cover |
| `connect-orient-transport-operand-sink-scope` | Recorded ground is weaker than when written; the entry says why |
| `connect-orient-sweep-walk-depth-bound` | — |
| `connect-orient-trial-runtime-removal` | The trial Runtime is provisional and must be removed on expiry |
| `visual-evidence-harness-logic-is-untestable` | Module-scope execution blocks importing the pure units |
| `pre-existing-trial-runtime-load-flake` | The flake below |
| `liveness-read-fails-open-to-reclaim` | — |
| `spawn-failure-sentinel-signals-init` | — |

Closed entries live in `workspace.toml` `[backlog].closed`, each with the reason it closed. Read
them there; a list here would be a second copy to keep in step.

---

## 6. How to work here

Full `work-loop` mode. The engine is mid-unit: apply, `wave-complete`, GATES, REVIEW, human
gate. Dispatch `adversarial-reviewer` and `quality-engineer`; **never report convergence off
your own check.**

```bash
corepack enable && pnpm install
pnpm lint && pnpm typecheck && pnpm governance && pnpm test && pnpm build
pnpm verify                     # the finite gate set, in that order
pnpm visual-evidence:connect    # this slice's captures; a bare invocation refuses
python .claude/skills/work-loop/scripts/lint-spec-status.py --root .
```

**Keeping the audit in sync.** After closing a criterion, edit its row, then run
`python3 tools/acceptance-audit-counts.py docs/specs/connect-and-orient/notes/acceptance-audit.md`.
`pnpm governance` runs its `--check`, so a stale count fails a gate rather than shipping. The
invariant:

```
157 rows; the met set == spec.md's [x] set; headline, closing section
and all fifteen group headers derived from the rows, never hand-written
```

---

## 7. Traps

- **A reviewer's mutation can be left in your working tree.** The read-only reviewers mutate
  production source to test bindings, on the same tree you are editing, and a revert can race
  your edit. One survived Step D and was caught only because it stranded a statement and failed
  lint. **Diff the tree against the index before trusting any gate reading taken during a review
  round**, and scan for mutation signatures — a stranded `return`, an `if (false)`, a flipped
  comparison. Recorded at `#reviewer-mutation-race-2026-09-24`, which also explains two earlier
  "went green minutes later" readings that were not flake.
- **Any insertion into any cited file silently invalidates every citation below it**, in every
  row, whether or not that row is the one being edited. The checker catches a citation that
  cannot resolve, not one resolving to the wrong place, so the gate stays green. The reliable
  repair is mechanical: build a `difflib` map from each cited file at the base to the file now
  and move each citation by the same amount — that corrected 116 citation parts in one pass.
  **Two mechanical gates for the residue were tried and both were unsound**; the reasons are in
  `tools/acceptance-audit-counts.py`'s own header so they are not re-proposed. Recorded at
  `#citation-residue-2026-09-24`.

- **A mutation that reports nothing may have run nothing.** Write test paths literally — **zsh
  does not word-split an unquoted parameter**, so `$T` holding two paths gave vitest one filter
  and "No test files found". Read the case count from every mutation run.
- **Assert the behaviour, not a collaborator's state.** The first AC-0037 test asserted
  `resultRefused`, which the reader sets whether or not the supervisor acts on it, and passed
  with the guard deleted.
- **Verify applied claims against the tree.** Two fixes were recorded applied and were never in
  the tree. Grep after editing; a memory of typing an edit is not evidence.
- **Do not transcribe a reviewer's premise.** One round asserted `sweep` had never been isolated
  and was a fourth implicated file. Both false, both recorded as fact.
- **The trial-runtime load flake is real.** `pnpm verify` needed 1 to 7 attempts this session.
  Judge by the two-in-isolation rule. **Load average does not predict it** — a 22-failure run at
  13.9 and a green at 35.0.
- **Verify in the target, not in source.** Three times this slice shipped something true in
  tests and false in the product: composition never wired, `runtime-child.ts` missing from
  `dist/`, and `process.execPath` being the Electron binary. `apps/desktop/src/e2e/connect-and-orient.test.ts`
  is the artifact that catches this class. **Rebuild before running it.**
- **Renderer production code may not import Studio Service modules** (`AGENTS.md:85-88`).
  Shared vocabulary lives in `packages/protocol`.
- **A mechanical citation remap must move every number after the filename, not the first.** The
  audit writes `file.ts:17,209-210` and `file.ts:972-1002, control :1023-1031`. A remapper that
  matches one line reference per filename moves the first and silently leaves the rest in base
  terms — 49 numbers moved where 102 needed to. The tell is a citation whose parts disagree with
  each other. And the remap is **not idempotent**: restore the audit from the index before each
  run, and write new citations *after* the remap, never before.
- **An adjudicator cannot settle a claim that needs the suite executed.** It is read-only by
  design, so a reviewer finding resting on an observed intermittent failure returns
  `indeterminate`, which makes the whole adjudication `invalid` and the round unrecordable — both
  reviewers' findings with it. The route out is an owner ruling on the source-visible property the
  observation rests on, supplied as governing authority to a complete replacement adjudication.
  Recorded at `#owner-decisions-2026-09-25-review-round-12`.

---

## 8. Do not touch

- **`docs/specs/product-development-walking-skeleton/`** is a **Shipped** spec. This session
  destroyed its retained captures once by running the capture tool under its default root. The
  root is now an enforced allowlist; do not widen it casually.
- **`contracts/`** — the versioned public protocol contract. No change without the required
  approval.
- **The ledger's round-by-round narrative is frozen** as a contemporaneous record and is outside
  review scope. Correct it forward at each site; never rewrite an entry. Obligations live in
  `spec.md`, `acceptance-audit.md` and `workspace.toml`.
- **`pnpm-workspace.yaml` build decisions** — `better-sqlite3` and `esbuild` stay `false`,
  `electron` stays `true`. Changing one needs new installation and runtime evidence.
- **Do not pull `[backlog].open` items into a slice without an owner decision.**

---

## 9. Open risks recorded on PR #14

- **The audit's `met` count is a floor, not a settled number.** Five consecutive rounds that
  tested `met` verdicts each found more false ones; round 15 changed no product code and still
  found three. Step C's review made the point again from the other side: an entry asserted that
  two criteria were bound to a dead function, and reading their two rows refuted it. **Read the
  row; do not reason about it.**
- **Round 15's fixes went in unreviewed** — the owner ended that loop.
- **`visual-evidence.mjs` has no importable units.** Six defects in two pure functions were
  found by review rather than by a test.
- **PRs #14, #15 and #16 are merged**, and the history rewrite at
  `#history-rewrite-2026-09-24-privacy-path` left #14's commits on no branch. Review round 12's
  repairs are unmerged work on this branch and need a PR of their own.
- **The review retry cap is exceeded and is waived one round at a time.** Round 12 sustained
  seventeen findings and needed an owner waiver on both `findings-remain` and
  `review record --fingerprint`; the owner chose a per-round waiver over raising the cap, so the
  next round that sustains anything has to ask again. That is deliberate: it keeps the cap
  announcing itself.

---

## 10. AC-0147 follow-on — 2026-10-03

[`connect-orient-positive-controls-that-remove-no-guard`](../../connect-orient-positive-controls-that-remove-no-guard/spec.md)
closed AC-0138, AC-0145 and AC-0147. The audit now reads 157 rows: 104 met, 49 not met, and
4 not verifiable here. Every AC-0133 through AC-0146 proof now has a same-fixture control that
removes or bypasses its guard at the guarded observation level. A typed inventory binds each
row to its named guarded and control test bodies.

The owner narrowed AC-0142 to refusal before revision admission and AC-0145 to product-owned
request construction. Those decisions are recorded at
[`owner-decisions-2026-10-01-ac-0142-and-ac-0145-reachable-observations`](verification-ledger.md#owner-decisions-2026-10-01-ac-0142-and-ac-0145-reachable-observations).

**Evidence.** The five-file focused suite passed: 162 tests. All thirteen recorded mutations went
red as required: four inventory mutations, the audit-anchor move, and both mutations of each
of the four new controls. `pnpm verify` and `pnpm test:capped` were each green on the remote
`gates.yml` macOS runner: 832 passed and 3 skipped of 835. The record is in the follow-on's
[verification ledger](../../connect-orient-positive-controls-that-remove-no-guard/notes/verification-ledger.md).

**Run the full suite remotely.** Local full-suite runs on a heavily loaded development host went
red through trial-runtime timeouts. The same tree was green on the remote runner, so dispatch
`gates.yml` instead, as `AGENTS.md` describes.

**Testing Strategy sentence.** The sentence at `spec.md:437` is unchanged. It stands by owner
ruling on 2026-10-04: "guardrail property" means the criteria AC-0133 through AC-0147, and
AC-0144's `W` grade is accepted. The seven constant-only Git pins remain a recorded limit of the
pin inventory. See
[`owner-ruling-2026-10-04-testing-strategy-sentence-stands`](verification-ledger.md#owner-ruling-2026-10-04-testing-strategy-sentence-stands).
