# ARS-SHAPE-006 — Promote shaped work to brief, specification, and build

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-SHAPE-006
- **Slug:** `promote-shaped-work-to-brief-specification-and-build`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-002, ARS-CAP-007
- **Initiative:** INI-005 — Studio Shaping Workbench
- **Horizon:** Next

## Outcome

An accepted shaped intent can cross a visible handoff into a delivery brief,
specification, and build queue without losing its outcome, assumptions,
evidence, or decision lineage.

## Opportunity

The shaping-to-delivery handoff is where context is normally lost. A
specification that restates an outcome in new words has already broken the
trace back to the bet it was meant to settle.

## Boundary

- Promotion is an explicit, attributable act, never an automatic consequence
  of acceptance.
- The first transition to prove is the intent-to-delivery-brief handoff.
  Brief-to-specification and specification-to-build-queue are separate
  transitions under their own owning contracts.
- Studio does not author the specification's engineering content; it carries
  the shaped context into it.
- Registering work in a repository queue requires write authority from
  ARS-REPO-009.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- The repository's existing brief and specification contracts are the right
  target shapes, so Studio projects into them rather than defining its own.
- Lineage from intent to brief to specification can be preserved as relations
  rather than by copying text.
- A visible handoff boundary is more valuable to teams than a seamless one.

## Unresolved questions

1. What is the gate at the handoff, and who owns it — Studio, the repository's
   lifecycle contract, or both?
2. Does an intent remain live after promotion, and what is its status once its
   specification ships?
3. How does Studio avoid creating a queue entry the repository's own gates
   would reject?
4. Can promotion be reversed, and what happens to work already done
   downstream?
5. Do the intent-to-brief, brief-to-specification, and specification-to-build-
   queue transitions belong in one capability?

## Projection

- **Initiative ID:** INI-005
- **Initiative name:** Studio Shaping Workbench
- **Horizon:** Next
- **Candidate dependencies:** ARS-SHAPE-005 for accepted shaped work;
  ARS-PD-006 for the delivery target
- **Recommended next shaping:** `frame-intent` constrained by the installed
  brief and specification contracts; do not define a parallel handoff.

## Related intents

- [ARS-PD-006 — Delivery workspace](delivery-workspace.md)
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
