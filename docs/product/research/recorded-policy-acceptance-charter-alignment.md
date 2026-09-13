# Recorded-policy acceptance charter alignment

- **Status:** Draft
- **Kind:** research
- **Slug:** `recorded-policy-acceptance-charter-alignment`
- **Owner:** Agent-Ready Studio maintainers
- **Source:** [RFC-0002](../../rfc/0002-clarify-studio-charter-for-connected-sources-and-governed-execution.md)
  §C5 and its accepted charter delta
- **Related:** [RFC-0002](../../rfc/0002-clarify-studio-charter-for-connected-sources-and-governed-execution.md),
  [charter](../../CHARTER.md),
  [ADR-0003](../../adr/0003-artifact-revisions-and-decisions.md),
  [ADR-0005](../../adr/0005-five-plane-authority-model.md),
  [ARS-CORE-005](../intents/reviews-comments-decisions-and-advancement-policies.md),
  [ARS-SHAPE-005](../intents/human-agent-coauthoring-review-and-ratification.md)

This record makes a contradiction visible and recommends a route for resolving
it. It decides no acceptance-policy semantics.

## Trigger

RFC-0002 C5 was accepted on 2026-09-13, and charter principle 2 now admits an
explicit recorded policy as an acceptance authority when all three conditions
hold:

- its authority is a named human holding acceptance authority,
- its application is audited, and
- it was not established through the same executor path whose output it would
  accept.

Two Draft capability intents were written against the earlier, stricter rule
and now contain stale statements.

**ARS-CORE-005 — Reviews, comments, decisions, and advancement policies**

- Its Outcome requires that any auditable advancement policy stop short of
  acceptance.
- Its Boundary states that a policy may never move work into accepted state,
  and attributes that rule to the charter.

**ARS-SHAPE-005 — Human-agent coauthoring, review, and ratification**

- Its Outcome requires that any approved policy govern only advancement short
  of acceptance.
- Its Boundary states that a policy may never accept an agent contribution,
  and attributes that rule to the charter.

The charter each intent cites no longer says what they say it says. RFC-0002's
Errata entry of 2026-09-13 records both intents as affected and reads its
follow-on 3 as covering them together.

## Why this is logged separately

- Both canonical intents remain Draft.
- Neither intent is modified in this pass.
- Their existing review remains historical evidence bound to their current
  revisions, and is the record of the position RFC-0002 changed.
- Only the policy-acceptance claims in those revisions are stale relative to
  the accepted charter. The rest of each intent is not automatically
  invalidated.
- A focused shaping pass must decide the replacement semantics before either
  intent becomes Ready or supports implementation.
- The recommended route is that ARS-CORE-005 owns the general
  acceptance-policy semantics, and that ARS-SHAPE-005 consumes that result for
  mixed human-agent lineage rather than defining a conflicting second policy
  model. ARS-SHAPE-005's own unresolved question 5 asks whether ARS-CORE-005
  owns that rule, so the shaping pass decides it; this record only recommends
  the answer.

## Shaping questions

1. Who may author an acceptance policy?
2. Who may approve, amend, suspend, or revoke one?
3. Must the approver be a different person from the policy author?
4. Which artifact kinds, transformation types, risk classes, or lifecycle
   transitions may a policy govern?
5. May a policy accept an agent-produced proposal, and under which additional
   controls?
6. What prevents the executor, provider, pack, transformation, or code path
   being governed from creating or escalating its own acceptance authority?
7. What evidence, audit record, expiry, review date, and revocation history are
   required?
8. Is policy authority workspace-wide, initiative-scoped, artifact-type-scoped,
   transformation-scoped, or proposal-specific?
9. How do unresolved comments, dissent, revision requests, and independent
   review interact with policy acceptance?
10. Which decisions must always remain directly human, regardless of policy?
11. Does a policy accept a revision, resolve a review, advance workflow, or
    perform several separately auditable operations?
12. How should the UI distinguish direct human acceptance, policy-mediated
    acceptance, non-acceptance advancement, executor permission, and executor
    completion?

## Boundaries

- This record does not design or approve an acceptance policy.
- It does not authorize automatic acceptance.
- It does not change the status of either capability intent.
- It does not change current product behavior.
- It does not alter the walking-skeleton human decision path.
- It does not define team roles or quorum; those remain with the team-scale
  authority intents.
- It does not settle discipline-specific review semantics.
- It does not authorize implementation, a brief, or a specification.
- It does not block Connect and Orient's read-only repository-inspection work.

## Recommended shaping route

1. Shape ARS-CORE-005 first as the authoritative cross-product policy model.
2. Run an explicit governance and security review against that result.
3. De-risk at least policy self-escalation, executor-created authority,
   invisible or over-broad policy scope, stale policy after context changes,
   and ambiguous attribution.
4. Then reshape ARS-SHAPE-005 against the accepted ARS-CORE-005 result.
5. Re-run review on both revised intent revisions.
6. Only then consider a brief or a specification.

None of those steps is started by this record.
