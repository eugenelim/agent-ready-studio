# ARS-PD-006 — Delivery workspace

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-PD-006
- **Slug:** `delivery-workspace`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-002, ARS-CAP-003
- **Initiative:** INI-003 — Multidisciplinary Product Development
- **Horizon:** Next

## Outcome

Teams can move accepted product work through briefs, specifications, plans,
change sets, acceptance evidence, tests, engineering review, and merge
decisions.

## Opportunity

Delivery evidence and decisions are not durably linked to the outcome,
research, and strategy that justified them.

## Boundary

- Does not replace the repository's own specification and plan conventions; it
  must project them faithfully.
- Does not perform the build; execution is INI-007.
- A merge decision recorded here is a product decision, not a substitute for
  the repository's own gates.
- Without a repository, this capability must support reviewing a local brief,
  specification, acceptance evidence, and delivery decision. Change sets,
  repository gates, and merge decisions require the repository capability.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Brief, specification, plan, and change set map cleanly onto Agent-Ready
  Repo's existing artifact set.
- Acceptance evidence can be attached to an acceptance criterion rather than
  to a whole specification.
- Engineering review and product review can share the ARS-CORE-005 decision
  model with different criteria.

## Unresolved questions

1. Where is the authoritative copy of a specification — the repository file,
   or the Studio artifact?
2. What does Studio show for repository work that never passed through a
   Studio brief?
3. Can a merge decision be made in Studio without Studio holding repository
   write authority?
4. How much of the existing repository lifecycle contract should Studio adopt
   unchanged rather than model again?
5. What does delivery mean when no repository is connected?

## Projection

- **Initiative ID:** INI-003
- **Initiative name:** Multidisciplinary Product Development
- **Horizon:** Next
- **Candidate dependencies:** ARS-REPO-004 for repository projection;
  ARS-SHAPE-006 for the handoff into delivery
- **Recommended next shaping:** `frame-intent`, constrained by the installed
  Agent-Ready Repo lifecycle contract rather than a new one.

## Related intents

- [ARS-SHAPE-006 — Promote shaped work to brief, specification, and
  build](promote-shaped-work-to-brief-specification-and-build.md)
- [ARS-RUN-005 — Work-loop dispatch and isolated Git
  proposals](work-loop-dispatch-and-isolated-git-proposals.md)

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
