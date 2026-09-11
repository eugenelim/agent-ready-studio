# ARS-PD-002 — Product strategy workspace

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-PD-002
- **Slug:** `product-strategy-workspace`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-001, ARS-CAP-008
- **Initiative:** INI-003 — Multidisciplinary Product Development
- **Horizon:** Next

## Outcome

Product strategists can frame strategic challenges, opportunity choices,
guiding policies, coherent actions, kill criteria, and investment decisions as
reviewable artifacts.

## Opportunity

Deck-based strategy does not preserve structured claims, rejected options,
evidence lineage, review criteria, or attributable decisions.

## Boundary

- Does not automate strategic judgment; it makes strategic reasoning
  inspectable.
- Does not prescribe one strategy method; the artifact types must accommodate
  more than one.
- Market and competitive data acquisition is out of scope; see ARS-SCALE-005.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Diagnosis, guiding policy, and coherent actions are a durable enough spine
  to type against.
- Kill criteria declared before a bet is run are more valuable than a post-hoc
  review, and teams will accept declaring them.
- Strategy review needs different semantics from delivery review — coherence
  and falsifiability, not correctness.

## Unresolved questions

1. What makes a strategy artifact reviewable in practice, beyond a reader
   saying it reads well?
2. Should an unmet kill criterion force a visible state change on the
   initiative, or only raise a signal?
3. How are rejected options preserved so a later reader sees the choice, not
   just the outcome?
4. Is investment decision a strategy artifact, or a decision record attached
   to an initiative?

## Projection

- **Initiative ID:** INI-003
- **Initiative name:** Multidisciplinary Product Development
- **Horizon:** Next
- **Candidate dependencies:** ARS-PD-001 for the initiative spine; ARS-UX-004
  for a strategy renderer
- **Recommended next shaping:** product-strategy discipline shaping, then
  `frame-intent` on the artifact set.

## Related intents

- [ARS-PD-001 — Initiative, outcome, bet, assumption, and question
  graph](initiative-outcome-bet-assumption-and-question-graph.md)
- [ARS-SHAPE-004 — Strategy, research, and experience-design
  routing](strategy-research-and-experience-design-routing.md)

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
