# Handover — connect-and-orient, mid-cluster

Written 2026-09-22 at `6b0ae80`. Read this, then
[`acceptance-audit.md`](acceptance-audit.md) and the last few entries of
[`verification-ledger.md`](verification-ledger.md).

## Where things are

- **Branch** `eugenelim/provisional-runtime-build`, **PR #14** open against `main`.
  One commit (`6b0ae80`) is unpushed.
- **Engine** `CODE-IMPLEMENTATION`, sequence 91, `pending_human_wait: false`.
  Run id `f87c797b-8bed-46c2-96fd-e8d22fb8eb3d`.
- **Spec** `Implementing`, **77 of 157 checked, 80 open**.
- `pnpm verify` exit 0 — 682 passed, 3 skipped. Expect to re-run it; see the flake note.

## What this session did

Ran the first full audit of all 157 acceptance criteria (`acceptance-audit.md`), then started
the first remediation cluster. Fifteen review rounds; the audit's verdicts moved 82 → 75 as
`met` rows were tested rather than read, then 75 → 77 as work landed.

Three small product changes also landed: the inspection-time display, the focus-occlusion check
in the capture tool, and the `VISUAL_EVIDENCE_ROOT` allowlist.

## The cluster you are continuing

`connect-orient-wire-the-uncalled-modules` in `workspace.toml [backlog].open`. **23 criteria.**
The cause is one shape: modules written, unit-tested, and reached by nothing — the defect class
that caused the T12/T13 retraction.

**Step A is done.** `BoundedResultReader` and `BoundedDiagnosticBuffer` are wired into
`runtime-supervisor.ts`, replacing two unbounded `+=` accumulations. AC-0037 and AC-0155 met.

### Remaining steps, dependency-ordered

**Step B — the child reads declared values.** AC-0054, AC-0055, AC-0056, AC-0057, AC-0059,
AC-0060. Wire `readDeclaredValues` (`declared-value-reader.ts`) into `runtime-child.ts` after
materialization, reading only `workspace.toml` and `.agentbundle-state.toml` from the
materialized tree, and report the result on a protocol line.

**Step C — the child emits a full trial result; the Service validates it.** AC-0032, AC-0034,
AC-0035, AC-0036, AC-0038, AC-0039. The child currently emits only
`{ type: "completed", requestId }`. `normalizeTrialResult` expects `contract`, `requestId`,
`status`, `resolvedSha`, `inspectorDiagnostics`, `declaredVersionMarker`,
`inspectorContractVersion`, `removalOutcome`, `workspacePresent`, `findings`.

> **Do B before C.** A result emitted before the declared read would carry
> `declaredVersionMarker: null`, which the contract defines as *"the repository declares none"*
> — so C alone would make Studio assert a falsehood, and AC-0064 turns on exactly that
> distinction.

**Step D — the inspector locator.** AC-0043, AC-0044, AC-0045, AC-0046, AC-0048. Wire
`locateTrustedInspector` and `selectConformingInterpreter` to **locate and record, not run**.
Running an inspector is the separate `connect-orient-no-inspector-runs` slice and is outside the
trial Runtime's authorization. Locating one and refusing a mismatched pin is inside it. Check
this reading against the owner before starting D.

**Step E — the leftovers.** AC-0012 (bind the child's `rev-parse --verify HEAD` check at
`runtime-child.ts:955-985`; note `materializeRevision` in `git-driver.ts` is the *dead* copy and
the live check is in the child, so consider deleting the dead one rather than wiring it), and
F2's AC-0088 / AC-0091 / AC-0092, which need a production site to map a terminating condition to
a `StopReasonKey`.

AC-0148 is adjacent but **routed separately** — gating the two ungated e2e cases removes the
only default-gate binding on accepted dispatch, so it is an owner design call.

### Zero-caller status as of `6b0ae80`

A count of 1 means only the definition; 2 usually means a definition plus a comment or a type
import. Verify before trusting.

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

## How to work here

Full `work-loop` mode. The engine is mid-unit: apply, then `wave-complete`, then GATES, then
REVIEW, then the human gate. Dispatch `adversarial-reviewer` and `quality-engineer` and do not
report convergence off your own check.

**Keep the audit in sync.** After closing a criterion, edit its row in `acceptance-audit.md` and
regenerate — every count in that document, including the fifteen group headers, is generated
from its rows, and `spec.md`'s checked boxes must be set-identical to the `met` rows. The
regeneration snippet is used in several ledger commits; the invariant to hold is:

```
157 rows; met set == spec.md's [x] set; headline and group headers derived from the rows
```

## Traps this session hit

- **A mutation that reports nothing may have run nothing.** Write test paths literally — **zsh
  does not word-split an unquoted parameter**, so `$T` holding two paths gave vitest one filter,
  matched no files, and exited 1 with "No test files found". Read the case count from every
  mutation run.
- **Assert the behaviour, not the collaborator's state.** The first AC-0037 test asserted
  `resultRefused`, which the reader sets whether or not the supervisor acts on it, and passed
  with the guard deleted. Run the mutation; do not reason about it.
- **Verify applied claims against the tree.** Two fixes were recorded as applied and were never
  in the tree. Grep after editing.
- **Do not transcribe a reviewer's premise.** One round asserted `sweep` had never been isolated
  and was a fourth implicated file; both were false and were recorded as fact.
- **The trial-runtime load flake is real** (`pre-existing-trial-runtime-load-flake`).
  `pnpm verify` needed 1 to 7 attempts this session. Judge by the two-in-isolation rule. **Load
  average does not predict it** — a 22-failure run came in at 13.9 and a green at 35.0.
- **`pnpm visual-evidence` refuses without `VISUAL_EVIDENCE_ROOT`.** Use
  `pnpm visual-evidence:connect` for this slice. Publishing is a whole-directory swap and the
  allowlist is the only thing standing between a typo and a deleted evidence set.
- **Renderer production code may not import Studio Service modules** (`AGENTS.md:85-88`).
  Shared vocabulary lives in `packages/protocol`.
- **Rebuild before the e2e tests** — they exercise `apps/studio-service/dist`.

## Open risks recorded on PR #14

- The audit's `met` verdicts are a floor, not a settled number. Five consecutive rounds that
  tested them found more false ones; round 15 changed no product code and found three.
- Round 15's own fixes went in unreviewed — the owner ended that loop.
- The ledger's round-by-round narrative is **frozen** as a contemporaneous record and is outside
  review scope. Obligations live in `spec.md`, `acceptance-audit.md` and `workspace.toml`.
- `visual-evidence.mjs` has no importable units, so its logic is unreachable by tests. Six
  defects in two pure functions were found by review rather than by a test. Routed at
  `visual-evidence-harness-logic-is-untestable`.
