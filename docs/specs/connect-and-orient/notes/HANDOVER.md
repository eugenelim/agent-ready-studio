# Handover — connect-and-orient

Written 2026-09-22, updated 2026-09-25 after review round 12. Current as of the commit that
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
| Branch | `eugenelim/step-e-etc`, tracking `origin`. The `eugenelim/provisional-runtime-build` worktree this file was written in no longer exists; engine state was carried across on 2026-09-25 |
| PR | **#14, #15 and #16** merged. The review-round-12 repairs on this branch are unmerged |
| Spec status | `Implementing`. The counts live in [`acceptance-audit.md`](acceptance-audit.md) and are generated from its rows — read them there rather than from a copy here |
| Engine | `CODE-IMPLEMENTATION` after `findings-remain`; see `loop-engine status` for the sequence. Round 12's seventeen sustained findings are recorded |
| Cohort | waves `[['T13']]` at index 0; `completed_task_ids` T1–T12, T14, T15; `review_round_count` 12, `review_retry_count` **10 against a cap of 5**, one owner waiver spent on round 12 |
| Run id | `f87c797b-8bed-46c2-96fd-e8d22fb8eb3d` |
| Gate | `pnpm verify` exit 0 at host load 10 on 2026-09-25 — **800 passed, 3 skipped**. The same tree failed at loads of 27 and 31 with a varying failing set; `pnpm test:capped` (`vitest run --maxWorkers=2`) was green at load 11. A worktree carrying none of this work flaked identically, so the sensitivity is the host's |

**Cohort, beyond the table above.** `plan_review_status: approved`, `implementation_retry_count`
0. A clean round does not consume a retry, which is why the recorded round count runs ahead of the
retry count. T14, T12 and T13 were closed by verifying their Done-when rather than re-running
them. One amendment is in
`amendment_history` — the 2026-09-23 checkbox refresh — because
`#cohort-state-loss-and-repair-2026-09-23` records the reset that destroyed the earlier entries.

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
`#cohort-state-loss-and-repair-2026-09-23`: set the entry aside, run the ceremony against the
pinned text, re-add it afterwards. Meet it as a known step rather than at the point of refusal.

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
closing the largest cluster. Fifteen review rounds. The verdicts moved 82 → 75 as `met` rows
were **tested rather than read**, then 75 → 77 as work landed.

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

**B. Hostile-repository proofs test a re-implementation — 13.** `test/hostile-fixture.ts:326-363`
runs its own `git checkout` with a hand-written `-c` list instead of calling
`pinnedGitConfigurationArgs()`, so removing a pin from `PINNED_GIT_CONFIGURATION` reddens no
absence proof. Three of the fourteen positive controls remove no guard and three observe at a
different level than their criterion. AC-0134, AC-0135 and AC-0137 are **vacuous by
construction**: `git checkout` never runs a `package.json` script, never executes a file under
`.agents/`, and never runs a smudge filter nobody configured. Fixing these needs controls that
can actually fail, not just a fixture change. **Highest risk reduction per criterion, no new
product capability.**

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
owner-approved carried items landed across PRs #14, #15 and #16, and review round 12 repaired
what they got wrong. Three criteria of the twenty-three are still not met, and each is a
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
