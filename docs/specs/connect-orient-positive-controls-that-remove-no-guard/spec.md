# Spec: Connect and Orient positive controls that remove a guard

- **Status:** Implementing
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

Maintainers and security reviewers can see every Connect and Orient hostile-
repository absence proof fail when the guard or boundary it depends on is
removed. An exhaustive inventory makes an omitted or property-only control a
test failure instead of an unaudited claim.

## What Changes

- AC-0138 observes instruction non-influence and its controlled violation
  through the source-inspection composition — Studio Service tests.
- AC-0142 observes refusal and guard-removed admission of the same hostile
  reported ref at the revision-resolution boundary — Runtime proof tests.
- AC-0145 observes authorization carriers at every product-owned request-
  construction surface and a controlled hostile extra-header insertion —
  Runtime proof tests.
- AC-0146 obtains its credential from the registered hostile fixture before
  driving the real refusal and both sink mutations — storage integration tests.
- A typed inventory covers AC-0133 through AC-0146 exactly once and records
  each control's fixture, mechanism and observation surface — hostile-fixture
  test support.
- Misleading fixture-property controls are retired and the acceptance record
  states the reachable scope — the Connect and Orient audit, ledger, handover
  and workspace queue.

## Durable Outputs

| Semantic role | Applicability | Destination | Owner | Expected evidence | Closeout condition |
| --- | --- | --- | --- | --- | --- |
| Behavioral controls | AC-0138, AC-0142 and AC-0145 lack guard-removing controls | Studio Service proof suites | Studio Service maintainer | Each shared absence assertion passes on the guarded route and throws on the controlled guard removal | All three controls redden at their guarded observation surface |
| Exhaustive inventory | AC-0147 is a universal claim over fourteen criteria | Connect and Orient Runtime test support | Studio Service maintainer | Exact criterion/case equality and a non-property mechanism for every row | Removing a row or mechanism fails the inventory |
| Governing criteria | AC-0145 currently names an unreachable wire observation | `docs/specs/connect-and-orient/spec.md` | Connect and Orient maintainers | Owner-approved narrowing and adversarial spec review | AC-0145 states only the reachable construction obligation |
| Governing acceptance record | The audit owns current verdicts | `docs/specs/connect-and-orient/notes/acceptance-audit.md` | Connect and Orient maintainers | Audit checker, self-test and anchored citations | AC-0138, AC-0145 and AC-0147 are met without overstating wire reach |
| Historical correction | Existing ledger entries are contemporaneous | `docs/specs/connect-and-orient/notes/verification-ledger.md` | Connect and Orient maintainers | Forward entry pointing to the new proof | Earlier counts and control classifications remain intact and are corrected forward |
| Delivery verification | Full-mode evidence must survive resumption | `notes/verification-ledger.md` in this spec | Work-loop controller | Red/green, mutation, gates and review receipts | Closeout resolves every criterion below from stable evidence |

## Agent Rules

### Always do

- Derive the fourteen-row inventory from `HOSTILE_CASE_BY_CRITERION` and make
  exact set equality, not a hand-maintained subset, the coverage assertion.
- Use the same fixture value and the same absence assertion in each new guarded
  and guard-removed pair.
- Recompute every affected audit citation from the current subject span and use
  a discriminating `file:line#symbol` anchor in every met row.
- Record AC-0140's naive-prefix assertion as an attacker precondition and its
  raw read as the containment-guard bypass.

### Ask first

- Ask before changing any Connect and Orient criterion beyond the approved
  AC-0145 narrowing.
- Ask before changing production behavior, a public interface, a dependency or
  another backlog item.
- Ask before replacing construction evidence with a network test or wire-
  header claim.

### Never do

- Never treat reading a planted artifact or constructing a literal value as a
  guard-removing control.
- Never add network, credential, model-provider or remote-service use to an
  automated test.
- Never modify `contracts/`,
  `docs/specs/product-development-walking-skeleton/`, the Connect and Orient
  Testing Strategy sentence, or the dependency-build choices in
  `pnpm-workspace.yaml`.
- Never rewrite a contemporaneous ledger entry; correct it forward.

## Testing Strategy

- **Goal-based check, composition integration (AC-0001):** the real source-inspection
  composition receives the same instruction-shaped fixture value through an
  inert result and a controlled trusted-output mutation. One decision-surface
  assertion distinguishes them.
- **Goal-based check, boundary integration (AC-0002):** `resolveRevision` consumes the same
  option-shaped fixture value from an injected transport. A test-owned
  guard-removed admission makes the same resolution assertion fail.
- **Goal-based check, construction integration (AC-0003):** canonical URL, resolution argv,
  Runtime argv, pinned Git configuration and closed environment are checked by
  one authorization-carrier assertion. A hostile `http.extraHeader` built
  from the fixture makes it fail. No literal wire-header claim is made.
- **Goal-based check (AC-0004, AC-0005, AC-0006):** exact inventory equality,
  audit checks, citation-anchor mutation, repository gates and independent
  review verify the universal claim and its durable record.

## Acceptance Criteria

- [ ] **AC-0001.** The instruction-shaped-text fixture passes through the real
  source-inspection composition without changing its verdict, routing
  condition or user-visible state relative to the same inspection without that
  text; a controlled mutation that treats the same text as trusted inspection
  output makes the same three-field assertion throw its own failure message.
- [ ] **AC-0002.** The option-shaped-ref fixture is returned by an injected
  revision transport and production `resolveRevision` refuses it as
  `invalid-remote-ref` before it becomes an admitted resolution; a test-owned
  admission that differs only by removal of that validation makes the same
  assertion throw its own failure message.
- [ ] **AC-0003.** The authorization-header fixture's planted value appears in
  none of the product-owned canonical URL, resolution Git argv, Runtime Git
  argv, pinned Git configuration or closed environment surfaces; inserting
  that same value as `http.extraHeader` makes the same assertion throw its own
  failure message. This criterion claims construction reach, not visibility
  inside an encrypted request.
- [ ] **AC-0004.** A typed inventory enumerates AC-0133 through AC-0146 exactly
  once, maps each row to the exact case in `HOSTILE_CASE_BY_CRITERION`, and
  records a guard-removal or guard-bypass mechanism and the matching
  observation surface. Each row also resolves to named executable guarded and
  control test bodies and to the observation evidence each body executes. No row
  may use fixture-property or literal-construction as its mechanism. Removing a
  row or mechanism, or naming a missing test or assertion, fails the inventory
  test.
- [ ] **AC-0005.** The Connect and Orient spec narrows AC-0142 to refusal before
  admission and AC-0145 to product-owned request construction, leaves the
  Testing Strategy sentence unchanged, and records both owner decisions
  forward. The audit reads 157 rows, 104 met, 49 not met and 4 not
  verifiable here, with AC-0138, AC-0145 and AC-0147 met at their measured
  reach.
- [ ] **AC-0006.** Focused proof suites, the acceptance-audit checker and
  self-test, spec-status lint, the finite repository gate set, and the
  documented capped test reading pass. A discriminating anchor mutation makes
  the audit checker fail. No automated test added by this delivery uses a
  network, credential, model provider or remote service.

## Follow-ons

none

## Assumptions

- Construction evidence is definitive for narrowed AC-0145. The opt-in live
  smoke corroborates transport configuration but does not expose encrypted
  request headers. Confirmed by the owner on 2026-10-01 and recorded at
  [`owner-decisions-2026-10-01-ac-0142-and-ac-0145-reachable-observations`](../connect-and-orient/notes/verification-ledger.md#owner-decisions-2026-10-01-ac-0142-and-ac-0145-reachable-observations).
- AC-0142's remote-reported ref has no downstream product route to a Git
  argument vector; materialization receives only the canonical fetch URL and
  resolved SHA. Confirmed by code inspection and the same owner decision.
