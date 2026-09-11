# Pre-EXECUTE review record

- **Date:** 2026-09-09
- **Gate:** `work-loop` pre-EXECUTE `SPEC-PLAN-REVIEW`
- **Run:** `185c0e76-dc59-491b-95e5-fa49ad6d0c24`, mode `code`
- **Disposition:** all fired reviewers reached adjudicated Clean at round 6, and
  again at round 7 after the review-shape decomposition; engine advanced to
  `SPEC-HUMAN-GATE`
- **Baseline:** `../approval-baseline.sha256`, regenerated from the repaired
  bytes immediately before human approval, per the plan's retention record

This gate is distinct from the earlier `new-spec` review recorded in
`shaping-round-3.md`, `adversarial-round-3.md` and `human-clean-confirmation.md`.
Those closed `new-spec` on bytes that no longer exist.

## Reviewers fired

Determined from the work-loop's pre-EXECUTE gate table:

| Gate | Reviewer | Outcome |
| --- | --- | --- |
| Structural change | `adversarial-reviewer` | Adjudicated Clean, rounds 6 and 7 |
| Security boundary | `security-reviewer`, spec-stage secure-design mode | Adjudicated Clean, rounds 3-7 |
| Independent second read | `codex-independent` (`gpt-5.6-sol`) | Adjudicated Clean, rounds 6 and 7 |
| User-facing surface | design-intent pass | Named skip — no `creative-direction` or `design-review` pack installed; grounded direction exists in `docs/product/aesthetic-direction.md` and `docs/product/design-system.md` |
| HTML/CSS/JS primary output | frontend pre-flight | Named skip — no `frontend-engineering` pack installed |

The `security-reviewer` was re-run after every round whose repair touched a
boundary it owns, which is why it appears clean at rounds 3 through 7 rather
than exiting after its first clean result.

Six boundary-matching `security-checklists` modules were inlined into that
reviewer's brief in their proactive-control framing: `access-control`,
`injection`, `path-and-file`, `supply-chain`, `config-misconfig`,
`exceptional-conditions`.

## Rounds

| Round | Raised | Sustained | Refuted |
| ---: | ---: | ---: | ---: |
| 1 | 27 | 6 | 21 |
| 2 | 23 | 6 | 17 |
| 3 | 12 | 3 | 9 |
| 4 | 5 | 2 | 3 |
| 5 | 7 | 3 | 4 |
| 6 | 6 | 0 | 6 |
| 7 | 5 | 0 | 5 |
| 8 (amendment 0001) | 5 | 0 | 5 |
| **Total** | **90** | **20** | **70** |

No finding was ever returned indeterminate. Every raw report was persisted and
validated before classification, and every `findings` report was routed through
an independent `finding-adjudicator` before it was allowed to drive a revision.
Raw and adjudication artifacts for all seven rounds are retained under the ignored
`.context/reviews/185c0e76-dc59-491b-95e5-fa49ad6d0c24/`.

## What the sustained findings changed

**Contract correctness.** The Review Package could not validate once its reviewed
revision was accepted, making AC-17, AC-41 and AC-44 unverifiable against the
canonical contract; `proposedRevision` became `reviewedRevision`, un-pinned from
the `proposed`-only variant and constrained by review state instead.
`homeItem` gained the workspace, initiative and transformation fields AC-14
requires. `productIntentRevision` now requires `transformationId`. The v1
executor-kind enum was cut from seven members to the four the normative
architecture reference admits, removing vendor names for capabilities the spec's
`Never do` forbids implementing.

**Actor identity.** `actorId` was removed from every request. AC-46 now refuses
any request carrying an actor identity, and `workspace.create` creates the
workspace's local human actor so identity exists before any decision and
independently of demo seed. The owner chose service-resolved over
expose-on-read; the renderer can no longer name an actor, so it cannot name a
wrong one.

**Renderer trust posture.** AC-45 added a Content-Security-Policy allowing no
inline script and no remote origin, plus default-denied navigation and
`window.open`. AC-24 had pinned only process isolation, while AC-34 gives the
preload decision authority over `review.resolve` and `artifact.revise`.

**Storage.** The plan's Constraints and storage design now require every SQLite
statement to bind values as parameters, with a T4 test round-tripping SQL
metacharacters byte-identically.

**The timeout contract.** ADR-0004 names correlation, timeouts, shutdown and
malformed-line behavior as its four boundary obligations; three were handled and
timeouts were not. Closing that took rounds 3 through 6 and three attempts,
because the first two specified the outcome without specifying where it lives.
The settled shape gives every boundary the path crosses its own criterion and
owner: **AC-47** the transport deadline and settle (T6), **AC-49** the crossing
of Electron main and the preload API as a typed, runtime-validated outcome
distinguishable from a service error and from AC-33's disconnected and
incompatible conditions (T7, asserted against the real preload rather than a
replaced one), and **AC-48** the renderer's labeled timed-out state and retry
(T8 and T9). AC-43's re-handshake obligation was scoped to the reconnect path so
it no longer contradicts AC-48's retry on a still-live connection.

**Plan hygiene.** Every task now records one of the two legal PLAN stub
dispositions. Every Design (LLD) sub-section traces to the criteria and contract
`$defs` it realizes, and the state sub-section defers to the spec's State
contract instead of restating it. Testing Strategy covers every acceptance
criterion.

## Decisions taken during the loop

- **Service-resolved actor** over exposing the current actor on reload-path
  reads. Owner decision, taken at round 1.
- **`no stub (implementation-discovered)`** for the TDD tasks whose callable
  seam does not yet exist, rather than manufacturing stubs against invented
  symbols. Challenged at round 3 and upheld on adjudication: for T2 and T3 the
  plan names packages, not callable seams.
- **Retry after a transport timeout does not re-handshake.** One adjudicator
  flagged this as needing owner input; authority resolves it, since AC-47
  contracts that the connection remains serviceable and re-handshaking a live
  negotiated connection is meaningless. Recorded here so the approver can
  overturn it at the gate.

## Round 7 — review shape and delivery decomposition

Rounds 1-6 never examined the plan's tail sizing, because no reviewer brief
named it. The owner asked whether the spec was too large to build in one pass;
it was, and no review-shape declaration existed despite the work-loop requiring
one above roughly 2,000 reviewable behavior-and-test lines.

Round 7 added the `## Review shape` section — DEEP, five dependency-ordered
review units — and re-reviewed it. All five findings were refuted, on grounds
worth keeping because they answer the obvious objections to slicing:

- **Independent reviewability without a per-unit commit statement.**
  `docs/CONVENTIONS.md:960-964` already makes a dependency-ordered stack's layers
  independently reviewable with each curated commit independently testable, and
  `SKILL.md` owns the intermediate-unit mechanism. The plan's "Do not commit" and
  "No artifact is published or committed by this task" bind the current
  spec-authoring task, not the implementation.
- **Intermediate-unit evidence.** `delivery-contract-lifecycle.md:66-79` already
  declares the write point: `notes/verification-ledger.md`, created when
  execution produces an observation, not hash-pinned, owned by the implementing
  work-loop rather than exclusively by T10.
- **Ordering hazard from slicing.** Checked explicitly and absent. Every
  privileged surface lands in the same or a later unit than its guard: AC-24,
  AC-45, AC-34 and AC-49 all belong to T7 and no BrowserWindow exists before it;
  AC-46's service-resolved actor is enforced in U2, ahead of the U3 transport and
  preload; storage parameterization is U2, with the first writer.

## Round 8 — controlled amendment 0001

Reached via `contract-amendment` from `CODE-IMPLEMENTATION` after T1 was built,
passed every gate, and EXECUTE discovered that the round-7 `## Review shape`
section described a transition sequence the engine refuses. See
[`../amendments/0001-review-shape-lifecycle.md`](../amendments/0001-review-shape-lifecycle.md)
and [`../verification-ledger.md`](../verification-ledger.md).

Reviewers fired: `adversarial-reviewer` (4 Concerns, all refuted on consequence)
and `codex-independent` (1 Concern, refuted on observation). Both adjudicated
clean.

**`security-reviewer` was a reasoned non-fire this round, not a silent skip.**
Its trigger is a change to a security boundary, data flow, or guarding control.
This amendment changes prose describing engine transitions: no acceptance
criterion, no control, no contract byte, and no change to implementation order.
Round 7's slicing change *was* reviewed by it, because slicing could have landed
a privileged surface ahead of its guard — a real question, answered no. Amendment
0001 alters only when the engine's review gate fires, not what ships or in what
order, and the single post-final-wave review still gates ship. The four preceding
security passes (rounds 3-7, all clean) stand undisturbed.

Two accuracy defects the adjudicator confirmed real but refuted on consequence
were repaired anyway, because both were this session's own audit records rather
than the sealed contract: the amendment record gained the
`## Scope-owner authority` heading that `state.json`'s pinned `owner_authority_ref`
anchor targets, and the ledger now records — rather than silently corrects — the
unreconciled Node 26.7.0 / 26.4.0 discrepancy between the retained probe record
and this machine.

## Findings deliberately not acted on

Each was refuted on evidence and is recorded so a later reader does not mistake
silence for oversight:

- Correlation-id non-reuse and unmatched-response discard — implementation depth
  at the T6 seam that already owns correlation.
- Lockfile integrity, SCA wiring and native-prebuild verification — the
  supply-chain module's implementation checks, not its spec-stage control. No
  scanner is wired in this repository; that gap is real and belongs to T1.
- Idempotency guards on `artifact.revise` and `execution.start` — the State
  contract's stale-base refusal closes the dominant path, and the residual
  produces exactly what a second human edit produces.
- A dedicated `docs/architecture/security.md` — `docs/architecture/reference.md`
  already owns the posture under the Durable Outputs "Current architecture" row.

## Orchestration notes

- **Base freshness: skipped** — origin is unavailable under workspace policy;
  the current checkout was accepted as the task base.
- Codex ran under `workspace-write` with `approval: on-request`. Its first
  dispatch was refused with `Rejected("approval request failed")` on a compound
  `find … -exec cat` form; subsequent dispatches were constrained to
  probe-proven single-path command forms.
- Codex's round-4 report duplicated a finding already sustained and adjudicated
  from another reviewer, and was not separately adjudicated because the repair
  had already landed; adjudicating it afterwards would have had the adjudicator
  read files where the defect no longer existed. Its raw report is retained and
  its claim was re-tested in round 5.
