# ARS-EXT-001 — Versioned Workspace Blueprints

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-EXT-001
- **Slug:** `versioned-workspace-blueprints`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-006, ARS-CAP-001
- **Initiative:** INI-006 — Workspace Blueprints, Capability Packs, and AgentBundle Platform
- **Horizon:** Next

## Outcome

A workspace blueprint continues to define artifact types, relations,
navigation, transformations, reviews, and views after initial creation.

## Opportunity

A blueprint that only applies at creation becomes a fossil: the workspace
drifts from it, and the definition stops explaining what the workspace is.
Keeping it live is what lets a workspace gain capability without being
rebuilt.

## Boundary

- Declarative definition only. A blueprint never carries executable code.
- Does not cover third-party or user-authored blueprints as a marketplace.
  Marketplace distribution is out of scope and has no established owner;
  ARS-EXT-004 covers migration and extension trust only.
- Version changes that alter meaning require migration, covered by
  ARS-EXT-004.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- One declarative definition can cover types, relations, navigation,
  transformations, reviews, and views without becoming unreadable.
- A live blueprint can be re-applied to an existing workspace without
  invalidating accepted artifacts.
- Most blueprint changes in practice are additive.

## Unresolved questions

1. What happens to artifacts whose type a blueprint revision removes?
2. Is the blueprint version a property of the workspace, of each artifact, or
   of both?
3. Who may change a blueprint for a workspace that already holds accepted
   work?
4. How much of the Product Development blueprint is genuinely data, and how
   much is host behaviour that only looks declarative?

## Projection

- **Initiative ID:** INI-006
- **Initiative name:** Workspace Blueprints, Capability Packs, and AgentBundle
  Platform
- **Horizon:** Next
- **Candidate dependencies:** ARS-CORE-002 for the Product Development
  blueprint
- **Recommended next shaping:** `frame-intent`, then an ADR on blueprint
  versioning before ARS-EXT-002 depends on it.

## Related intents

- [ARS-CORE-002 — Product Development blueprint and progressive
  maturity](product-development-blueprint-and-progressive-maturity.md)
- [ARS-EXT-004 — Blueprint and pack compatibility, migrations, and extension
  trust](blueprint-and-pack-compatibility-migrations-and-extension-trust.md)

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
