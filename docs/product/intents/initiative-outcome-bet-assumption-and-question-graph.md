# ARS-PD-001 — Initiative, outcome, bet, assumption, and question graph

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-PD-001
- **Slug:** `initiative-outcome-bet-assumption-and-question-graph`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-001, ARS-CAP-002
- **Initiative:** INI-003 — Multidisciplinary Product Development
- **Horizon:** Next

## Outcome

Cross-functional teams can organize work around an initiative and trace
outcomes, bets, assumptions, research questions, decisions, delivery, and
measured results.

## Opportunity

Disciplines currently connect through meetings and shared documents. The link
between a research question, the bet it tested, the delivery it changed, and
the outcome it moved exists in people's heads, and it leaves when they do.

## Boundary

- This is the connective model between disciplines, not a replacement for each
  discipline's own artifacts.
- Not a portfolio or programme-management capability; that projection is
  ARS-SCALE-005.
- Does not prescribe an outcome framework such as OKRs; it must hold whichever
  the team uses.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Initiative, outcome, bet, assumption, and question are stable enough
  concepts to type, and map onto the workspace.toml initiative model rather
  than competing with it.
- Most cross-discipline traceability questions reduce to graph traversals over
  these five entity types plus artifacts.
- Teams will maintain this graph only if it falls out of work they already do,
  not as separate bookkeeping.

## Unresolved questions

1. Is a Studio initiative the same entity as a repository `workspace.toml`
   initiative, a projection of it, or a separate concept?
2. Which of these five entities is genuinely load-bearing, and which could be
   a relation or a tag instead?
3. What keeps the graph honest when work changes shape mid-initiative?
4. Who owns an assumption once it has been tested and the answer contradicts
   the bet?

## Projection

- **Initiative ID:** INI-003
- **Initiative name:** Multidisciplinary Product Development
- **Horizon:** Next
- **Candidate dependencies:** ARS-CORE-003 and ARS-CORE-004
- **Recommended next shaping:** `frame-intent` at capability altitude, with a
  product-strategy review of the entity set.

## Related intents

- [ARS-PD-002 — Product strategy workspace](product-strategy-workspace.md)
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
