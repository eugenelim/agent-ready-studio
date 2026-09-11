# ARS-CORE-005 — Reviews, comments, decisions, and advancement policies

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-CORE-005
- **Slug:** `reviews-comments-decisions-and-advancement-policies`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-003, ARS-CAP-002
- **Initiative:** INI-001 — Studio Foundation and Workspace Kernel
- **Horizon:** Now

## Outcome

Proposed work advances only through attributable review decisions or an
explicit auditable policy, while dissent and revision requests remain durable.

## Opportunity

The pattern this capture is reacting to is teams losing the disagreement
rather than the agreement: a concern raised and then overtaken by a decision
tends to disappear, and later nobody can tell whether a risk was considered
and accepted or simply missed.

## Boundary

- Acceptance is governed by principle 2 of [the charter](../../CHARTER.md),
  which owns that rule. The outcome's policy clause is not settled: whether any
  automated policy can satisfy that principle is unresolved, and until it is,
  the principle governs.
- Does not cover who is allowed to decide; routing and authority are
  ARS-SCALE-001 and ARS-SCALE-002.
- Does not define discipline-specific review semantics; those are ARS-PD-008.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Approve and request-revision are the two load-bearing decisions; richer
  verdicts can be added per discipline later.
- A comment is durable and addressable, not a transient annotation cleared by
  the next revision.
- An auditable advancement policy is acceptable to teams only where the
  reviewed risk is low and the policy is visible at the point of advancement.

## Unresolved questions

1. What makes an advancement policy legitimate — who authors it, who approves
   it, and can it be revoked retroactively?
2. Does an unresolved revision request block acceptance absolutely, or can a
   decider override it with a recorded reason?
3. How does dissent stay visible after the artifact it targeted has moved
   several revisions on?
4. Is review state per artifact, per revision, or per proposal round?
5. Does the charter requirement that accepted state follow a durable,
   attributable human decision conflict with the outcome's automated-policy
   clause; which must change, and should automated advancement be separate
   work given core review and decision works without it?

## Projection

- **Initiative ID:** INI-001
- **Initiative name:** Studio Foundation and Workspace Kernel
- **Horizon:** Now
- **Candidate dependencies:** ARS-CORE-003 for proposals; ARS-CORE-001 for
  decision attribution
- **Recommended next shaping:** `frame-intent`, then a de-risk pass on whether
  any advancement policy is acceptable before ARS-SHAPE-005 assumes one.

## Related intents

- [ARS-SHAPE-005 — Human-agent coauthoring, review, and
  ratification](human-agent-coauthoring-review-and-ratification.md)
- [ARS-PD-008 — Graph-based workflows and discipline-specific review
  models](graph-based-workflows-and-discipline-specific-review-models.md)

## Owner

Agent-Ready Studio maintainers.

## Source

- Mode: chat-only at intake; repo-origin thereafter, matching this artifact's
  `workspace.toml` entry.
- Locator: none recorded. The source is a product-shaping conversation, not a
  retrievable locator, so there is nothing to pin or refresh.
- Revision: captured 2026-09-11
- Authority: transferred into this repository by the capture request that
  named `docs/product/intents/` as the destination. This file is now the
  authoritative record; the conversation confers no approval and no refresh
  authority.
