# ARS-SCALE-005 — External product-development integrations and portfolio views

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-SCALE-005
- **Slug:** `external-product-development-integrations-and-portfolio-views`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-010, ARS-CAP-009
- **Initiative:** INI-008 — Collaboration, Security, Integrations, and Outcomes
- **Horizon:** Later

## Outcome

Studio can integrate repositories, trackers, design systems, research sources,
CI, deployment platforms, analytics, and feature flags while presenting
initiative-level and portfolio-level projections.

## Opportunity

Studio will never be the only system a product team uses. For team-scale use,
it gains incremental value when it can connect systems that already hold pieces
of the work and the connected view says something the individual systems
cannot.

## Boundary

- Integrations are read-oriented by default; each write-back path needs its
  own authority and gate.
- A portfolio view is a projection, never a second source of truth.
- Does not commit the product to any specific vendor integration.
- External integrations and portfolio projections must never be prerequisites
  for the local artifact-and-decision workflow.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- A tracker-origin source-authority approach may generalize to other external
  sources.
- Portfolio projections can be computed from the ARS-PD-001 graph rather than
  needing their own model.
- A small number of integrations will carry most of the value.

## Unresolved questions

1. Which integration is worth building first, and what evidence supports that
   over the next one?
2. When an external system and Studio disagree about a field, which owns it
   and how is that declared?
3. What does a portfolio view tell a leader that the initiative views do not?
4. How many integrations can be maintained before the maintenance cost exceeds
   their value?
5. Are external-system integration and portfolio projection one capability or
   two, and which single source class should the first integration prove?

## Projection

- **Initiative ID:** INI-008
- **Initiative name:** Collaboration, Security, Integrations, and Outcomes
- **Horizon:** Later
- **Candidate dependencies:** ARS-PD-001 for the initiative graph;
  ARS-REPO-007 for multi-repository projection
- **Recommended next shaping:** `explore-options` on integration selection,
  driven by real demand rather than breadth.

## Related intents

- [ARS-PD-001 — Initiative, outcome, bet, assumption, and question
  graph](initiative-outcome-bet-assumption-and-question-graph.md)
- [ARS-SCALE-006 — Production outcome feedback, retention, export, and
  governance](production-outcome-feedback-retention-export-and-governance.md)

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
