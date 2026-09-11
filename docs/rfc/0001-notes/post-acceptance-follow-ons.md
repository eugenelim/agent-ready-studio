# Post-acceptance follow-ons

Companion note to [RFC-0001](../0001-studio-authority-planes-and-workspace-runtime-boundary.md),
**Accepted 2026-09-11**. This is the governing follow-on sequence.

## Acceptance confers no implementation authority

RFC-0001 is accepted. That settles direction; it does not authorize building.
Each item below still needs its own artifact and its own gate.

Specifically, **none** of the following is authorized by acceptance:

- Scaffolding `apps/workspace-runtime`.
- Creating `packages/runtime-protocol` or `contracts/jsonschema/runtime` —
  D3's placement is decided, but the artifacts are not created.
- Creating an `infra/` root.
- Creating, moving, or renaming any directory.
- Editing [`docs/CHARTER.md`](../../CHARTER.md) — D5 authorizes a charter RFC,
  not a charter edit.
- Marking any capability intent Ready, Accepted, Fulfilled, or implemented.
- Changing the roadmap or the workspace lifecycle state.
- Executing the recorded candidate splits, merges, or supersessions.
- Editing anything in `agent-ready-repo`.

The durable `apps/workspace-runtime` must not be created ahead of item 11, and
the contract package not ahead of item 10.

**One deliberate exception, because otherwise the sequence is circular.** The
Stage 2 gate is the *delivered* Connect and Orient thread, and that thread
delegates inspection to a runtime. If every runtime were forbidden until after
the gate, the gate could never be reached. So item 7 authorizes a **provisional
trial runtime** — time-boxed, throwaway, and explicitly not the sanctioned
component. Item 11's prohibition governs the durable component, not the trial.

## The accepted sequence

Acceptance is **staged**, per
[§Acceptance sequencing](../0001-studio-authority-planes-and-workspace-runtime-boundary.md#acceptance-sequencing).
Items 1–6 are in effect now; item 7 is the validation gate; item 8 runs after
the gate is assessed and covers both outcomes; items 9–11 require the gate to
have passed.

D2, D3, D4, and D5 were accepted outright. **D1's process boundary is the only
decision the gate still governs** — recording it before Connect and Orient runs
would freeze the RFC's admitted untested assumption into a durable decision.

**1. Record the accepted decisions that create nothing, in one or more ADRs.**
The authority-plane model as the shaping vocabulary, the root folder semantics
(D4), the monorepo placement (D2), and the runtime-contract placement (D3,
Option A). All four are settled and none creates a component. They extend
rather than supersede ADR-0001 through ADR-0004.

The D3 ADR should carry the caveat the maintainers accepted with it: the
placement was decided ahead of the evidence that would justify Option A over
Option C, and it lapses if the Stage 2 gate withdraws D1.

**D1's process boundary is deliberately excluded here** and appears as item 8.

**2. Open a separate charter RFC, using RFC-0001's delta as its starting
text.** RFC-0001 does **not** decide the charter's substance — accepting it
means only that the delta is a sound starting point. The charter's own "When to
revise" rule requires an RFC for mission, scope, or principle changes, and that
RFC owns the decision. The delta widens product scope, and widening scope must
not ride along inside an architecture acceptance.

**3. Update [`docs/architecture/reference.md`](../../architecture/reference.md)
with the Stage 1 material only.** That means the authority-plane vocabulary, the
root folder semantics, the monorepo placement, and the accepted runtime-contract
position — the rules new work needs to find in the normative golden path. The
Workspace Runtime stereotype and the forbidden dependencies that mention it are
**Stage 2** and wait for item 8, because writing them in earlier would state a
process boundary the validation has not yet supported.

**4. Keep [`docs/architecture/overview.md`](../../architecture/overview.md)
limited to implemented components.** The overview describes what the repository
currently contains. It gains `apps/workspace-runtime` when the runtime exists,
not when it is decided. Updating it at acceptance would assert implemented
state that does not exist.

**5. Decide whether and how reviewed capability intents receive new metadata
without silently invalidating their prior review.** The review is
revision-bound: any material edit invalidates the result recorded for that
revision. Adding a portfolio field to 64 intents is a 64-way invalidation
unless the process explicitly distinguishes material from non-material change.
This decision is a prerequisite for item 6, and it is why this pass added no
metadata to any intent.

**6. Decide whether portfolio mappings become RFC notes, a maintained portfolio
projection, generated metadata, or canonical intent fields.** Four options with
different decay profiles:

| Option | Cost | Decay risk |
| --- | --- | --- |
| Stay as RFC notes | None | Goes stale silently; an RFC is frozen history |
| Maintained portfolio projection | Ongoing | Second source of truth to reconcile |
| Generated metadata | Build tooling | Low — derived, so it cannot drift |
| Canonical intent fields | 64 edits + item 5 | Low, but invalidates every review |

No recommendation is made here. The choice depends on item 5's answer and on
whether the mapping proves useful enough to maintain.

**7. Shape *and deliver* Connect and Orient as the first bounded delivery
initiative. Its delivered result is the Stage 2 gate.** Via `frame-intent`
against the existing reviewed intents named in
[`connect-and-orient-steel-thread.md`](connect-and-orient-steel-thread.md),
then through the normal specification and build path. No new capability IDs.

**Shaping is not the gate.** Shaping is design work and settles nothing about
whether the boundary earned itself; only the delivered result can. The three
gate criteria are listed in
[the steel-thread note](connect-and-orient-steel-thread.md#the-stage-2-gate-criteria).
The decisive one is whether the runtime ended up holding state, supervision, or
policy that the Studio Service could not hold without taking on untrusted
content. If it did not, D1 is falsified.

**This item authorizes a provisional trial runtime, and only this item does.**
Delivering the thread requires *some* runtime, so the trial builds one under
these constraints:

- Time-boxed, with the box agreed when the trial is authorized.
- Explicitly a spike, not `apps/workspace-runtime`. It carries no stereotype
  authority, and no later work may cite it as precedent.
- Built against a provisional contract, **not** `packages/runtime-protocol`.
  D3's placement is already accepted; the trial neither reopens it nor
  pre-builds it. The package is created at item 10, against a real contract.
- Discarded or rewritten once the gate is assessed, whichever way it goes. It is
  evidence, not a foundation.

RFC-0001 is already `Accepted`, so the trial does not move its status. Its
result routes to D1's ADR on success, or to an ADR plus a superseded-in-part
pointer in this RFC's `Status` field on failure. The trial's findings belong in a
linked spike note rather than in the RFC body.

Without this exception the sequence is circular: the gate needs a runtime that
nothing before the gate is allowed to build.

Note that the steel thread presupposes runtime delegation in its flow, so it is
not a neutral comparison of both arrangements. It can show whether the
delegation carried its weight; it cannot show that no alternative would have
worked.

---

*Items below run after item 7's gate is assessed. Item 8 covers both outcomes;
items 9-11 require the gate to have passed.*

**8. Record the gate result in an ADR — whichever way it went.** On a pass, D1's
process boundary, plus the Stage 2 additions to
`reference.md` deferred from item 3. This is the only decision the gate
governed; D2, D3, D4, and D5 were already recorded at item 1.

If the gate failed instead, the ADR to write is the one recording that the
execution plane is not separable at this stage and that D1 is withdrawn — and
D3's ADR needs a superseding or amending note, because a contract placement for
a runtime that will not exist decides nothing. D2 stands either way.

**9. Create paired Studio and Agent-Ready Repo artifacts with explicit
ownership.** Per
[`agent-ready-repo-counterpart-contract.md`](agent-ready-repo-counterpart-contract.md),
and per the review finding against ARS-RUN-004 that upstream work needs an
upstream-owned artifact its maintainers accept. Studio does not author upstream
specifications, and those maintainers may decline.

**10. Author a specification before scaffolding `apps/workspace-runtime`.** The
specification defines the contract, the isolation properties, and the
conformance fixtures. It is where D3's accepted placement is first *built*:
`packages/runtime-protocol` and `contracts/jsonschema/runtime` are created here,
against a real contract.

Placement is not reopened here — it was accepted at item 1. But if the
specification work shows Option A's premise has not held, the right move is an
amending ADR, not silently building something else.

**11. Scaffold the Runtime only after item 8's ADR and item 10's
specification.** Both, not either. Scaffolding before the specification
produces a component with no contract to conform to.

## Independent of this RFC

**Settle the walking-skeleton closeout.** Reconciliation reports
`closeout_blockers = ["initiative-residue"]` and
`next_action = "settle-closeout-blockers"`: a `Shipped` specification still
occupies the active work slot, the brief it fulfilled is still open backlog,
and INI-001 is still active on a delivered milestone. The canonical action is
the `close-work` skill, plus a human decision on INI-001's disposition.

Detail in
[`current-state-and-authorities.md`](current-state-and-authorities.md#lifecycle-observation).
This does **not** wait on RFC-0001 and was deliberately not performed in this
pass, because settling it needs a human decision about whether INI-001 is
complete.

## If the Stage 2 gate fails

The RFC is accepted, so this is no longer a rejection path — it is the recorded
outcome if criterion 1 shows the runtime held nothing the Studio Service could
not have held.

The process split is abandoned and execution-plane authority must be assigned
somewhere. The realistic alternative is that the Studio Service absorbs
materialization and executor hosting — which means the single writer of accepted
product state also handles untrusted repository content. That deserves its own
recorded decision rather than arriving by default, because reference-architecture
invariants 3, 7, and 11 all currently draw the line the other way.

What survives: D2 (the monorepo placement), D4 (folder semantics), D5 (the
charter RFC), and the plane vocabulary as a shaping frame. What lapses: D1, and
D3 with it. Connect and Orient remains delivered and useful either way — only
the question of which process performs the inspection changes.
