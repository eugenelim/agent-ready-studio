# Plan: Connect and Orient positive controls that remove a guard

- **Spec:** [`spec.md`](spec.md)
- **Status:** Approved
- **Repository anchors:** `HOSTILE_CASE_BY_CRITERION` and the fixture-level
  control helper in `test/hostile-fixture.ts`; AC-0133 through AC-0145 in
  `absence-proofs.test.ts`; AC-0138 in `state-projection.test.ts`; AC-0146 in
  `source-inspection-storage.test.ts`; `PIN_PROOFS` as the exhaustive-inventory
  precedent; the Connect and Orient acceptance audit and forward ledger.

> **Plan contract:** this is the implementation strategy. It may change
> substantively only while its Status is `Drafting`, before approval records
> its baseline. After approval, `spec.md` and `plan.md` are pinned in substance;
> only lifecycle bookkeeping is permitted. Execution observations belong in
> `notes/verification-ledger.md`.

## Approach

First narrow AC-0145's unreachable wire claim with the owner's recorded
authority. Then add three shared absence assertions and their same-fixture
guard-removal controls. Replace the blanket fixture dispatcher with one typed,
exact inventory that points to all fourteen behavioral proofs. Finally correct
the acceptance surfaces in one action and recompute every moved citation by
subject.

## Constraints

- This is proof infrastructure and governance only. Production behavior,
  public interfaces, contracts, schemas and dependencies do not change.
- The AC-0145 proof ends at product-owned request construction. The automated
  suite remains offline.
- Existing good controls remain at their current observation levels. AC-0140's
  precondition and bypass stay distinct, and AC-0136's `.GIT` arm remains
  recorded as Git-guaranteed.
- The parent Testing Strategy line and approved plan remain unchanged.
- All historical corrections are forward entries.

## Construction tests

**Integration tests:** source-inspection composition, revision resolution, Git
argument construction, Runtime spawn records, environment construction and
real local hostile fixtures.

**Manual verification:** none. The opt-in network smoke is corroborating
context, not a closeout obligation for the narrowed claim.

## Durable-output map

| Durable output | Tasks | Implementation evidence | Closeout evidence |
| --- | --- | --- | --- |
| Three repaired controls | T1 | Shared assertions pass guarded and throw under mutation | Focused and full test results |
| Fourteen-row inventory | T2 | Exact-set and forbidden-mechanism mutation results | Clean adversarial and quality review |
| Parent criteria and acceptance record | T3 | Audit counts, resolved citations and anchor mutation | Governance checks and full gates |
| Delivery ledger | T1-T3 | Red/green, mutation and gate receipts | Every spec criterion resolved |

## Design (LLD)

### Design decisions

Owned by: T1, T2.

- AC-0138 compares `{ verdict, condition, state }` from settled
  source-inspection records. The guarded pair differs only in repository text.
  Its mutation returns trusted output selected from that same text, so the
  shared assertion fails without adding a production switch.
- AC-0142's assertion accepts a `RevisionResolution` and rejects any admitted
  option-shaped `resolvedRef`. The guarded result comes from production
  `resolveRevision`; the control is a test-owned admission of the same
  transport result with only remote-ref validation omitted.
- AC-0145's assertion scans named construction surfaces for the planted value
  and for authorization-bearing carrier names. The control adds
  `http.extraHeader=Authorization: Bearer <fixture value>` to an otherwise
  product-shaped Git vector. Its failure message never repeats the value.
- `POSITIVE_CONTROL_PROOFS` is a typed record keyed by the fourteen criteria.
  Each row carries `caseId`, a discriminated mechanism, `observation`, and a
  source binding naming its executable guarded tests, control tests and the
  evidence tokens each named test body must execute. Its test derives the expected keys and case IDs from
  `HOSTILE_CASE_BY_CRITERION`, rejects property/literal mechanisms, and reads
  each source to fail on a missing or stale executable binding.
- The fixture helper is renamed to `runFixturePositiveControl` and accepts only
  repository-hook, escaping-symlink, escaping-reader-path, submodule,
  prototype-key and materialized-module. Distributed product-path controls are
  not represented as fixture-level branches.
- AC-0146 materializes the registered credential-sink fixture once, reads its
  planted value, and uses that same value in the production refusal and both
  guard-removed sink mutations.

### Interfaces & contracts

Owned by: T1, T2.

No public interface or contract changes. New surfaces are test-owned shared
assertions, the inventory types and the narrowed fixture-control case union.

### Data & schema

none

### Failure, edge cases & resilience

Owned by: T1, T2, T3.

- Assertion controls must match the assertion's own stable message so a throw
  elsewhere cannot count as the positive control.
- The inventory compares exact ordered keys and exact case mappings, then checks
  uniqueness independently so neither omission nor duplication can hide.
- HFS+ behavior stays platform-gated exactly as today; the inventory records
  that proof without creating another mounted-volume run.
- Audit remaps use exact old boundary text and current subject spans, never a
  line offset.

### Quality attributes (NFRs)

Owned by: T2.

The new automated cases use local fixtures and injected seams only. They add no
network dependency and no new long-running process family.

## Tasks

### T1: Repair the three missing behavioral controls

**Depends on:** none

**Touches:** `apps/studio-service/src/state-projection.test.ts`,
`apps/studio-service/src/trials/connect-and-orient-runtime/absence-proofs.test.ts`,
and test-local support beside those files.

**Tests:**

- **Goal-based integration, AC-0001:** the focused state-projection suite
  proves the inert pair equal and the same-fixture trusted-output mutation
  throws the shared assertion's exact message.
- **Goal-based integration, AC-0002:** the focused absence-proof suite proves
  production refusal and that guard-removed admission throws the shared
  assertion's exact message.
- **Goal-based integration, AC-0003:** the focused absence-proof suite checks
  every named construction surface and proves the same-fixture
  `http.extraHeader` mutation throws the shared assertion's exact message.
- `no stub (mode)`: these are goal-based checks whose delivered artifact is the
  executable proof itself; the required mutation red is recorded in the
  delivery ledger.

**Done when:** all three guarded routes pass, all three controls throw only the
named assertion message, and their focused suites pass offline.

### T2: Make AC-0147 mechanically exhaustive and retire false controls

**Depends on:** T1

**Touches:** `apps/studio-service/src/trials/connect-and-orient-runtime/test/hostile-fixture.ts`,
its test, the new positive-control inventory test support, and obsolete blocks
in `apps/studio-service/src/connected-source.test.ts`, plus the AC-0146 proof in
`apps/studio-service/src/source-inspection-storage.test.ts`.

**Tests:**

- **Goal-based, AC-0004:** materialize an exact fourteen-row inventory. Assert exact
  keys, exact case mappings, uniqueness and the absence of property/literal
  mechanism variants. Resolve every row's guarded tests, control tests and
  executable observation evidence inside the named test bodies.
- Delete one row in a temporary mutation and record that the exact-set case
  fails. Change one mechanism to the forbidden `fixture-property` value and
  record that typecheck or the inventory test fails.
- Rename and narrow the fixture helper, update its six legitimate callers, and
  remove the obsolete blanket AC-0146/AC-0147 cases.
- Replace AC-0146's hard-coded credential with the value read from the
  registered credential-sink fixture, preserving its real storage path and
  both sink mutations.
- `no stub (mode)`: this is a goal-based source-and-data consistency check; its
  row-deletion, forbidden-mechanism and stale-binding mutations are the red
  evidence.

**Done when:** no executable branch claims that reading a planted artifact or
constructing a literal is a positive control, all fourteen inventory rows map
to behavioral proof symbols, and focused suites pass.

### T3: Close the governing record and verify the delivery

**Depends on:** T1, T2

**Touches:** the approved AC-0142 and AC-0145 criteria in the parent spec, the Connect and
Orient audit, ledger and handover, `workspace.toml`, and this spec's ledger.

**Tests:**

- **Goal-based, AC-0005:** narrow AC-0142 and AC-0145, leave the Testing
  Strategy line unchanged, record both owner decisions forward, and replace the
  backlog slug with this spec entry. Update the audit to the count required by
  AC-0005.
- Recompute every citation into an edited proof file by subject. Move the
  weakest new met-row anchor outside its span, confirm the checker fails, then
  restore it.
- **Goal-based, AC-0006:** run the focused suites; audit check and self-test;
  spec-status lint; `pnpm lint`, `pnpm typecheck`, `pnpm governance`,
  `pnpm test`, `pnpm build`; `pnpm verify`; and `pnpm test:capped`.

**Done when:** every check passes, any load-only trial failure satisfies the
documented isolation rule before being classified as the registered flake, the
audit citations resolve, and review is clean.

## Rollout

This change alters tests and governance records only. It has no migration,
feature flag, deployment step or runtime rollback. Reverting it restores the
previous proof gap without changing product behavior.

## Risks

- A metadata inventory can overstate behavior if its proof symbols do not name
  real guarded/control pairs. Independent review must trace every row once.
- Editing the hostile fixture and absence proof files moves many audit spans;
  offset-based remapping would silently corrupt unrelated citations.
- The parent spec is implementing and its approved body changes only under the
  explicit AC-0142 and AC-0145 owner decisions recorded by this unit.
- Real-process suites can exhibit the registered host-load flake; isolated
  greens plus a later capped green distinguish it from a defect.

## Changelog

- 2026-10-01: draft authored from the approved AC-0142 and AC-0145 narrowing
  decisions and the mechanically re-derived fourteen-criterion inventory.
- 2026-10-02: spec approved by `Agent-Ready Studio maintainers` after clean
  shaping and adversarial spec reviews.
- 2026-10-02: plan approved by `Agent-Ready Studio maintainers`.
- 2026-10-02: **Amendment 0001.** Added AC-0146's storage proof to T2 after the
  exhaustive row trace found that its real product path still used a literal
  credential rather than the registered hostile fixture. No production path,
  dependency edge or parent criterion changed. Evidence and authority:
  `notes/amendments/0001-ac0146-same-fixture.md`.
- 2026-10-02: **Amendment 0002.** Made inventory bindings resolve evidence
  inside each unique named test body instead of accepting an assertion token
  anywhere in the source file. It also derives the runtime criterion set from
  `HOSTILE_CASE_BY_CRITERION`. Evidence:
  `notes/amendments/0002-executable-bindings.md`.
