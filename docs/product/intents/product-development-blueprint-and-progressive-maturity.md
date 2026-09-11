# ARS-CORE-002 — Product Development blueprint and progressive maturity

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-CORE-002
- **Slug:** `product-development-blueprint-and-progressive-maturity`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-001, ARS-CAP-006
- **Initiative:** INI-001 — Studio Foundation and Workspace Kernel
- **Horizon:** Now

## Outcome

The same Product Development workspace supports manual, assisted, and
agent-ready operating modes without forcing a team to migrate to a different
workspace model.

## Opportunity

A team that starts manually and later adds agents should not have to rebuild
its workspace, re-enter its artifacts, or lose its decision history. If
maturity requires a different workspace model, the local-first path becomes a
demo rather than a starting point.

## Boundary

- Not a no-code workspace builder. The blueprint stays an opinionated,
  versioned definition.
- Progressive maturity is about what a workspace can do, not about unlocking
  features behind a licence or account tier.
- Custom or third-party blueprints are ARS-EXT-001, not this intent.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- One blueprint can express manual, assisted, and agent-ready modes as
  capability presence rather than as separate workspace types.
- Mode is a property of installed capability rather than a flag a user sets.
- Strategy, Research, Experience, Architecture, Delivery, Release, and
  Outcomes remain the right default sections for the Product Development
  blueprint.

## Unresolved questions

1. Is operating mode a workspace-level property, a per-transformation
   property, or purely derived from installed capabilities?
2. What does a workspace show for a discipline whose capability pack is not
   installed — nothing, a manual template, or a disabled affordance?
3. Can a workspace move backwards, from agent-ready to manual, without losing
   artifacts or decisions?
4. Which blueprint changes are additive and which force a versioned migration?

## Projection

- **Initiative ID:** INI-001
- **Initiative name:** Studio Foundation and Workspace Kernel
- **Horizon:** Now
- **Candidate dependencies:** ARS-CORE-003 for the artifact model the
  blueprint types; ARS-EXT-001 for post-creation blueprint evolution
- **Recommended next shaping:** `frame-intent` to decide whether operating
  mode is derived, declared, or unnecessary; create an ADR only if that
  exposes a durable architectural decision.

## Related intents

- [ARS-EXT-001 — Versioned Workspace
  Blueprints](versioned-workspace-blueprints.md)
- [ARS-EXT-002 — Optional Capability Packs](optional-capability-packs.md)

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
