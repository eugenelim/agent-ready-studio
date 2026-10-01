# Spec: Connect and Orient falsifiable criteria proofs

- **Status:** Shipped
- **Owner:** Agent-Ready Studio maintainers
- **Plan:** [`plan.md`](plan.md)
- **Constrained by:** none
- **Brief:** none
- **Discovery:** none
- **Contract:** none
- **Shape:** service

> **Spec contract:** this document defines what "done" means. The implementing
> PR must match this spec, or update it. Verification must be derivable from it.
>
> **Not every section is contract.** `Agent Rules`, `Testing Strategy` and
> `Acceptance Criteria` are what a completion gate reads, and an amendment
> changes them. `Outcome`, `What Changes`, `Durable Outputs`, `Follow-ons` and
> `Assumptions` are working material: they orient a reader and an author
> corrects them in place as the work teaches, without an amendment and without
> a review round. A review finding against working material is advisory.

## Outcome

Maintainers and security reviewers can detect regressions in six Connect and
Orient security claims at the execution, checkout, traversal, storage, and
diagnostic surfaces those claims name. Each completed proof turns red when its
guard or prohibited behavior is introduced, while unresolved reach remains
visible instead of being upgraded by inference.

## What Changes

- Package-script, projected-skill, and attribute-filter absence proofs observe
  the product trial's exhaustive repository-influenced process-start record —
  the Connect and Orient Runtime proof suites.
- The hostile `.git` fixture covers the Unicode-ignorable arm as well as the
  case arm — the hostile fixture and pinned Git proof suite.
- The submodule fixture contains a real gitlink and proves both no fetch and no
  traversal — the hostile fixture and Runtime proof suites.
- Credential refusal travels through the production source-inspection and
  SQLite composition while every storage and diagnostic channel is checked —
  the Studio Service source-inspection storage suite.
- The measured proof boundary and forward corrections remain durable — the
  Connect and Orient acceptance audit, its verification ledger, and this
  spec's verification ledger.

## Durable Outputs

| Semantic role | Applicability | Destination | Owner | Expected evidence | Closeout condition |
| --- | --- | --- | --- | --- | --- |
| Execution proof | Connect and Orient criteria 0134, 0135, and 0137 prohibit repository-controlled execution | Connect and Orient Runtime proof suites | Studio Service maintainer | Product trial records plus a construction inventory and failing execution mutation | Every claimed absence can redden at the parent-visible process surface |
| Checkout and traversal proof | Connect and Orient criteria 0136 and 0141 govern hostile tree materialization | Hostile fixture and Runtime proof suites | Studio Service maintainer | Unicode variant and real-gitlink observations with discriminating controls | Both Unicode refusal layers and both submodule halves have measured results |
| Credential data-flow proof | Connect and Orient criterion 0146 governs storage and diagnostics | `apps/studio-service/src/source-inspection-storage.test.ts` | Studio Service maintainer | Production refusal composed with real SQLite and captured diagnostics | The planted value reaches the refusal path and is absent from every named sink |
| Governing acceptance record | Existing Connect and Orient verdicts must cite current evidence | `docs/specs/connect-and-orient/notes/acceptance-audit.md` | Connect and Orient maintainers | Audit checker and anchor mutation checks | Each of the six rows states only the proven reach and every citation resolves |
| Historical correction | Existing ledger entries are contemporaneous and immutable | `docs/specs/connect-and-orient/notes/verification-ledger.md` | Connect and Orient maintainers | Forward entry citing the new evidence | New evidence corrects prior reach claims without rewriting history |
| Delivery verification | Full-mode review and gate evidence must survive resumption | `docs/specs/connect-orient-falsifiable-criteria-proofs/notes/verification-ledger.md` | Work-loop controller | Probe, red/green, mutation, gate, and review receipts | Closeout resolves every criterion from stable evidence |

## Agent Rules

### Always do

- Drive each proof through the product composition that owns the named
  observation surface.
- Define the complete process-start inventory before calling `spawnAudit`
  exhaustive, including interpreter arguments and command payloads that can
  identify worktree code.
- Preserve both halves of Connect and Orient criteria 0136 and 0141, and record a separate result for
  each half.
- Recompute every edited audit citation from the current subject span and use
  a discriminating `file:line#symbol` anchor for every met row.
- Record unresolved reach as weak or not met; require a failing mutation or
  guard-removal control before upgrading a verdict.

### Ask first

- Ask before changing an acceptance criterion or Testing Strategy text in the
  Connect and Orient spec.
- Ask before changing production behavior rather than its proof surface.
- Ask before adding a dependency, a module boundary, or another backlog item.
- Ask before narrowing Connect and Orient criterion 0141 to only fetch or only traversal.

### Never do

- Never count a direct test-owned spawn of a planted executable as proof that
  the product would execute it.
- Never force filesystem or credential claims onto `spawnAudit`.
- Never upgrade Connect and Orient criterion 0136 from weak unless both its case and Unicode overwrite
  outcomes are proven at checkout.
- Never absorb Connect and Orient criterion 0147 or close its separate backlog entry in this unit.
- Never modify `contracts/`,
  `docs/specs/product-development-walking-skeleton/`, the Connect and Orient
  Testing Strategy sentence at `spec.md:437`, or the dependency-build choices
  in `pnpm-workspace.yaml`.
- Never rewrite a contemporaneous verification-ledger entry.

## Testing Strategy

- **TDD, real-process integration (AC-0001, AC-0002, AC-0003, AC-0004):** a real product
  trial materializes local hostile repositories. Its settled record and the
  parent-visible process evidence reject any executable identity, interpreter
  operand, or command payload rooted in the worktree. A construction check
  makes the claimed repository-influenced process-start set exhaustive, and a
  controlled worktree execution mutation makes each proof red.
- **TDD, real-Git integration (AC-0005, AC-0006, AC-0007):** local repositories
  contain the Unicode-ignorable `.git` spelling or a real gitlink. Stable
  filesystem and process observations distinguish pinned refusal from
  controlled guard removal or prohibited submodule operation.
- **TDD, storage integration (AC-0008):** the production URL refusal is
  composed with a reopened temporary SQLite database while returned
  diagnostics and captured diagnostic output are checked for the submitted
  credential value.
- **Goal-based check (AC-0009):** audit counts, citation resolution, anchor
  mutation, spec-status lint, and the finite repository gates verify the
  durable records without a remote service.

## Acceptance Criteria

- [x] **AC-0001.** An executable-origin construction inventory covers every
  `node:child_process` start in production `.ts` modules under the Studio
  Service Connect and Orient Runtime, excluding only `*.test.ts` and the
  `test/` fixture subtree, and classifies each start as fixed product
  infrastructure, parent observation, or repository-influenced; adding an
  unclassified production start makes the inventory test fail, and every
  repository-influenced start contributes executable, argument vector, and
  process identity to the trial's parent-visible record.
- [x] **AC-0002.** For the hostile package-script repository, the completed
  product trial contains no process record whose executable identity,
  interpreter operand, or command payload resolves inside the materialized
  worktree; a controlled mutation that starts its planted script through the
  product Runtime makes the same assertion fail.
- [x] **AC-0003.** For the hostile projected-skill repository, the completed
  product trial contains no process record whose executable identity,
  interpreter operand, or command payload resolves inside the materialized
  worktree; a controlled mutation that starts its planted executable through
  the product Runtime makes the same assertion fail.
- [x] **AC-0004.** For the hostile attribute-filter repository, the completed
  product trial records no filter command and leaves no filter marker; a
  controlled mutation that enables the planted filter through the product Git
  operation makes at least one of those same parent-visible observations fail.
- [x] **AC-0005.** A source tree containing `.gi<U+200C>t` is refused during
  product-shaped fetch when `transfer.fsckObjects=true` is present, advances
  to a checkout refusal when that pin alone is omitted and
  `core.protectHFS=true` remains, and materializes the hostile entry beside an
  intact real `.git` directory when both pins are omitted; the audit keeps
  the originating criterion weak unless a Unicode overwrite of the real `.git` is separately
  demonstrated.
- [x] **AC-0006.** The hostile submodule case contains both a `.gitmodules`
  declaration and a mode-160000 gitlink whose commit exists in a local child
  repository; the product trial records no submodule fetch command, and a
  controlled submodule-operation mutation makes that fetch observation fail.
- [x] **AC-0007.** After the hostile submodule trial settles, the worktree has
  no populated gitlink content and its Git directory has no submodule
  administrative state; a controlled submodule-operation mutation populates
  both surfaces and makes the traversal assertion fail.
- [x] **AC-0008.** Submitting an embedded-credential source URL through the
  production source-inspection composition yields `url-rejected`, writes no
  connected-source row to the real SQLite store, and exposes the submitted
  credential value in none of the returned diagnostics, captured standard
  error, or persisted rows; a controlled diagnostic or persistence mutation
  containing that value makes the same sink assertion fail.
- [x] **AC-0009.** The six Connect and Orient audit rows cite current anchored
  evidence and state no stronger verdict than the measured observations; the
  acceptance-audit checker, its self-test, the spec-status lint, every focused
  proof suite, the finite repository gate set, and the documented capped test
  reading pass, with the widest changed met-row anchor shown to fail under a
  discriminating token mutation.

## Follow-ons

- Workspace backlog owner:
  `connect-orient-positive-controls-that-remove-no-guard` — repair other
  controls outside this proof unit; this item remains separately owned even if
  this unit supplies reusable controls.

## Assumptions

none
