# Spec: Pinned Git configuration proof

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
> `Assumptions` are working material.

## Outcome

Maintainers and security reviewers can tell which pinned Git settings have a
behavioral proof and which are asserted only by configuration shape. Every
behavioral claim fails when its own pin is removed and stays green when the pin
is present.

## What Changes

- The hostile-repository fixture follows the product's `init`, `fetch`, forced
  detached-checkout, and `HEAD` verification sequence instead of cloning —
  `apps/studio-service/src/trials/connect-and-orient-runtime/test/`.
- Locally reachable pin behavior gains paired present/omitted observations,
  including object fsck, protocol v2, and redirect refusal — the Connect and
  Orient Runtime proof suites.
- The pin-by-pin proof boundary becomes explicit —
  `docs/specs/connect-and-orient/notes/acceptance-audit.md`.
- The completed measurements and any forward corrections are retained — this
  spec's verification ledger and the Connect and Orient verification ledger.

## Durable Outputs

| Semantic role | Applicability | Destination | Owner | Expected evidence | Closeout condition |
| --- | --- | --- | --- | --- | --- |
| Behavioral proof | The pins guard untrusted repository materialization | Connect and Orient Runtime proof suites | Studio Service maintainer | Paired pinned and one-pin-omitted observations | Every claimed proof reddens under its own omission |
| Governing acceptance record | Existing Connect and Orient verdicts cite these proofs | `docs/specs/connect-and-orient/notes/acceptance-audit.md` | Connect and Orient maintainers | Audit checker and anchor mutation checks | Each pin is classified without overstating the evidence |
| Historical correction | Existing ledger entries are contemporaneous and immutable | `docs/specs/connect-and-orient/notes/verification-ledger.md` | Connect and Orient maintainers | Forward entry citing the new evidence | New evidence corrects prior reach claims without rewriting history |
| Delivery verification | Full-mode review and gate evidence must survive resumption | `docs/specs/pinned-git-configuration-proof/notes/verification-ledger.md` | Work-loop controller | Focused tests, mutation results, gates, and review receipts | Closeout can resolve every criterion from stable evidence |

## Agent Rules

### Always do

- Build every fixture Git vector from `PINNED_GIT_CONFIGURATION` and remove at
  most the one pin named by a control.
- Apply the selected pin vector to `init`, `fetch`, and checkout.
- Apply the selected pin vector to the post-checkout `rev-parse` verification.
- Judge a behavioral proof by a paired pinned and one-pin-omitted observation
  at the same level.
- Recompute every edited audit citation from the current subject span and use
  an anchor token for every met row.

### Ask first

- Ask before binding any socket other than loopback on an ephemeral port.
- Ask before changing an acceptance criterion or Testing Strategy text in the
  Connect and Orient spec.
- Ask before adding another backlog item or production behavior to this unit.

### Never do

- Never change `PINNED_GIT_CONFIGURATION` or weaken a production guard to make
  a proof pass.
- Never treat a constant-content assertion as behavioral evidence.
- Never modify `contracts/`, `docs/specs/product-development-walking-skeleton/`,
  or the Connect and Orient Testing Strategy row headed
  “Hostile-repository proofs and their positive controls”.
- Never add a dependency, a module boundary, or change the dependency-build
  decisions in `pnpm-workspace.yaml`.

## Testing Strategy

- **TDD, real-process integration (AC-0001, AC-0002, AC-0003, AC-0004,
  AC-0005):** real local Git
  repositories exercise materialization and transport. Each claimed pin effect
  has a pinned run and a run omitting only that pin.
- **Goal-based check (AC-0006):** the audit names every current pin exactly
  once as behavioral or constant-only, and its citations resolve.
- **Goal-based check (AC-0007):** the focused proof suites, audit-count checker,
  checker self-test, and spec-status lint pass with no remote service.
- **TDD, resource cleanup (AC-0008):** the redirect proof binds only loopback,
  selects an ephemeral port, and closes its listener on success and failure.

## Acceptance Criteria

- [x] **AC-0001.** The hostile fixture records exactly four materialization and
  verification
  Git invocations in order: pinned `init`, pinned `fetch --depth=1 --no-tags --`
  of the selected commit, pinned `checkout --detach --force FETCH_HEAD`, and
  pinned `rev-parse --verify HEAD`; substituting the old clone flow or omitting
  the verification makes the assertion fail.
- [x] **AC-0002.** A proof inventory derived exhaustively from
  `PINNED_GIT_CONFIGURATION` classifies each setting as behavioral or
  constant-only, and a behavioral classification is accepted only when the
  same observation changes after omitting that setting alone.
- [x] **AC-0003.** Over `file://` with `--no-local`, a malformed packed commit
  is refused when `transfer.fsckObjects=true` is present and is accepted when
  that setting alone is omitted.
- [x] **AC-0004.** Over the same local transport, the packet trace contains a
  protocol-v2 `command=ls-refs` exchange when `protocol.version=2` is present
  and contains no such exchange when that setting alone is replaced by the v1
  control.
- [x] **AC-0005.** A loopback endpoint that always redirects to a closed
  loopback port yields an error naming the source endpoint when
  `http.followRedirects=false` is present and an error naming the closed target
  when that setting alone is replaced by the follow control.
- [x] **AC-0006.** The Connect and Orient acceptance audit states the proven
  reach of every current pin, labels every remaining pin constant-only, and
  makes no behavioral claim whose one-pin omission leaves its proof green.
- [x] **AC-0007.** Both focused proof suites, the acceptance-audit checker, its
  self-test, and the repository spec-status lint pass after the audit citations
  are recomputed from the changed tree.
- [x] **AC-0008.** Every automated test added by this unit uses no credential,
  model provider, or remote service; the sole socket surface is a loopback
  listener on an ephemeral port that is closed in all outcomes.

## Follow-ons

- Workspace backlog owner: `connect-orient-ac0136-overwrite-arm`
  — AC-0136's overwrite arm. Corrected 2026-09-30: this bullet named `connect-orient-rebind-the-vacuous-criteria-to-the-spawn-audit`,
  an entry `connect-orient-falsifiable-criteria-proofs` replaced once it proved the
  other criteria.
- Workspace backlog owner: `connect-orient-positive-controls-that-remove-no-guard`
  — repair positive controls outside this pin-proof unit.

## Assumptions

none
