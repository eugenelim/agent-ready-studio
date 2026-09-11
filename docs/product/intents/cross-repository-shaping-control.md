# ARS-SHAPE-008 — Cross-repository shaping control

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-SHAPE-008
- **Slug:** `cross-repository-shaping-control`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-009, ARS-CAP-007
- **Initiative:** INI-005 — Studio Shaping Workbench
- **Horizon:** Later

## Outcome

Studio can act as the product-work control plane while shaping or coordinating
work in another Agent-Ready repository.

## Opportunity

Once Studio can shape work in its own repository, the remaining question is
whether the same control works against a repository Studio does not own. That
is the test that separates a self-hosting tool from a product.

## Boundary

- Demonstration repositories are examples for shaping, never hard-coded into
  the product. Candidates discussed were `agent-ready-studio` as the
  self-hosting repository, `agent-ready-repo` as the operating-model
  dependency, and `company-intelligence-desk` as a separate target workspace.
- Control means opening, revising, and projecting shaping artifacts across a
  repository boundary. Dispatch, execution coordination, and completion
  receipts are ARS-RUN-012.
- Requires the write and credential authority from ARS-REPO-009.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- A repository Studio did not set up will differ enough from this one to
  surface real contract assumptions.
- Control-plane behaviour is the same whether the target is the local
  repository or a remote one, once authority exists.
- The target repository's own gates remain authoritative over anything Studio
  dispatches into it.

## Unresolved questions

1. What must a target repository have installed before Studio can shape work
   in it at all?
2. How does Studio behave when the target's contract version differs from what
   it understands?
3. Who is accountable for work Studio dispatched into a repository whose team
   did not initiate it?
4. Is a separate target workspace genuinely necessary to validate this, or
   does a second maintainer-owned repository suffice?

## Projection

- **Initiative ID:** INI-005
- **Initiative name:** Studio Shaping Workbench
- **Horizon:** Later
- **Candidate dependencies:** ARS-SHAPE-007 for self-hosting; ARS-REPO-007 for
  multi-repository projection
- **Recommended next shaping:** `frame-intent` only after self-hosting has
  produced evidence; premature shaping here will encode this repository's
  shape.

## Related intents

- [ARS-REPO-007 — Multi-repository overview and cross-repository
  dependencies](multi-repository-overview-and-cross-repository-dependencies.md)
- [ARS-RUN-012 — Cross-repository execution coordination and
  receipts](cross-repository-execution-coordination-and-receipts.md)

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
