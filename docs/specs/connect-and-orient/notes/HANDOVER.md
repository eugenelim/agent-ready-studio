# Handover — connect-and-orient

Written 2026-09-22. Current as of the commit that carries it. This is the whole picture, not
only the cluster in flight; the cluster section names where to start.

Read next: [`acceptance-audit.md`](acceptance-audit.md) for what is and is not met, then the
last few entries of [`verification-ledger.md`](verification-ledger.md) for how the work went.
The spec is [`../spec.md`](../spec.md).

---

## 1. State

| | |
| --- | --- |
| Worktree | `/Users/eu.gene.lim/orca/workspaces/agent-ready-studio/provisional-runtime-build` |
| Branch | `eugenelim/provisional-runtime-build`, tracking `origin`, clean |
| PR | **#14** open against `main` — **HEAD has moved past it**; it was opened as an audit-only change |
| Spec status | `Implementing` — **77 of 157 checked, 80 open** |
| Engine | `CODE-IMPLEMENTATION`, sequence 91, `pending_human_wait: false` |
| Run id | `f87c797b-8bed-46c2-96fd-e8d22fb8eb3d` |
| Gate | `pnpm verify` exit 0, 682 passed, 3 skipped |

**Cohort:** `plan_review_status: approved`; waves `[[T14], [T12], [T13]]` at index 2 (the last);
`completed_task_ids` T1–T11; `implementation_retry_count` 2; `review_round_count` 0. T14, T12
and T13 were closed by verifying their Done-when rather than re-running them. Five amendments
are in `amendment_history`, each with an owner-authority reference into the ledger.

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

## 3. The 80 open criteria

### By group

| Group | Open |
| --- | ---: |
| Honest states | 12 |
| Security proofs | 12 |
| Desktop surface | 9 |
| Process boundary, argument vector and environment | 8 |
| Quality floor | 8 |
| Provisional contract | 6 |
| Trusted inspector | 6 |
| Reading the version marker | 6 |
| Version honesty and the verdict | 3 |
| Disposal and cancellation | 3 |
| Exact revision | 2 |
| Path confinement and materialization safety | 2 |
| Persistence | 2 |
| Suite-level and evidence | 1 |

### The five recorded "not verifiable here"

Not defects — they need something this repository cannot supply offline.

| Criterion | Needs |
| --- | --- |
| AC-0024, AC-0025, AC-0030 | The live smoke behind `CONNECT_ORIENT_SMOKE=1`, which reaches github.com. Each **is** asserted there and would bind if enabled |
| AC-0114 | A browser capture of the verdict surface, which needs a completed inspection |
| AC-0131 | The built application under Chromium; the check is real and measured |

### The clusters

**A. Modules written, tested, called by nothing — 21 remaining.** In flight; see §4.

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

## 4. The cluster in flight

`connect-orient-wire-the-uncalled-modules` — **23 criteria**, one cause, and it is the defect
class the retraction came from.

**Step A is done.** `BoundedResultReader` and `BoundedDiagnosticBuffer` are wired into
`runtime-supervisor.ts`, replacing two unbounded `+=` accumulations. AC-0037 and AC-0155 met.

### Remaining steps, dependency-ordered

**Step B — the child reads declared values.** AC-0054 to AC-0057, AC-0059, AC-0060. Wire
`readDeclaredValues` (`declared-value-reader.ts`) into `runtime-child.ts` after materialization,
reading only `workspace.toml` and `.agentbundle-state.toml` from the materialized tree, and
report on a protocol line.

**Step C — the child emits a full trial result; the Service validates it.** AC-0032, AC-0034 to
AC-0036, AC-0038, AC-0039. The child emits only `{ type: "completed", requestId }` today.
`normalizeTrialResult` expects `contract`, `requestId`, `status`, `resolvedSha`,
`inspectorDiagnostics`, `declaredVersionMarker`, `inspectorContractVersion`, `removalOutcome`,
`workspacePresent`, `findings`.

> **B must precede C.** A result emitted before the declared read carries
> `declaredVersionMarker: null`, which the contract defines as *"the repository declares none"*.
> C alone would make Studio assert a falsehood, and AC-0064 turns on that exact distinction.

**Step D — the inspector locator.** AC-0043 to AC-0046, AC-0048. Wire `locateTrustedInspector`
and `selectConformingInterpreter` to **locate and record, not run**. Running an inspector is the
separate `connect-orient-no-inspector-runs` slice and is outside the trial Runtime's
authorization. **Confirm this reading with the owner before starting D** — it is an unconfirmed
scope judgement.

**Step E — the leftovers.** AC-0012: bind the child's `rev-parse --verify HEAD` at
`runtime-child.ts:955-985`. Note `materializeRevision` in `git-driver.ts` is the **dead copy** —
materialization moved into the child deliberately — so consider deleting it rather than wiring
it. Then AC-0088, AC-0091, AC-0092, which need a production site to map a terminating condition
to a `StopReasonKey`.

AC-0148 is adjacent and **routed separately**: gating the two ungated e2e cases removes the only
default-gate binding on accepted dispatch, so it is an owner design call.

### Zero-caller status

1 means only the definition; 2 usually a definition plus a comment or type import. Re-check
before trusting.

| Symbol | Non-test mentions |
| --- | ---: |
| `locateTrustedInspector` | 2 |
| `selectConformingInterpreter` | 1 |
| `readDeclaredValues` | 1 |
| `normalizeDeclared` | 1 |
| `normalizeTrialResult` | 2 |
| `buildNorthboundRequest` | 1 |
| `observedVersions` | 1 |
| `materializeRevision` | 3 |
| `toPersistedRepresentation` | 1 |

---

## 5. Everything else on the register

`workspace.toml [backlog].open`, connect-and-orient entries:

| Slug | What it holds |
| --- | --- |
| `connect-orient-wire-the-uncalled-modules` | The cluster in flight |
| `connect-orient-no-inspector-runs` | AC-0061 to AC-0068 composed but unexercised; owner says next slice |
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

Closed: `connect-orient-result-carries-no-reason-or-wait-window`.

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

**Keeping the audit in sync.** After closing a criterion, edit its row, then regenerate. The
invariant:

```
157 rows; the met set == spec.md's [x] set; headline, closing section
and all fifteen group headers derived from the rows, never hand-written
```

---

## 7. Traps

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
  found three.
- **Round 15's fixes went in unreviewed** — the owner ended that loop.
- **`visual-evidence.mjs` has no importable units.** Six defects in two pure functions were
  found by review rather than by a test.
- **PR #14 is behind HEAD.** It was opened as an audit-only change before this cluster started.
  Decide whether to update it or open a second PR for the cluster.
