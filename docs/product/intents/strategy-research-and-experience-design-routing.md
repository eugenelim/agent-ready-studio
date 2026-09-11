# ARS-SHAPE-004 — Strategy, research, and experience-design routing

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-SHAPE-004
- **Slug:** `strategy-research-and-experience-design-routing`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-005, ARS-CAP-006
- **Initiative:** INI-005 — Studio Shaping Workbench
- **Horizon:** Next

## Outcome

Studio routes shaping work to the relevant product-strategy, desk-research,
product-engineering, experience-design, or architecture capability based on
the work's semantic type rather than a hard-coded provider.

## Opportunity

Routing by provider couples the product to whatever is installed today.
Routing by semantic type keeps the same work meaningful when the capability
behind it is replaced, absent, or performed by a human.

## Boundary

- Routing selects a capability, not a provider or a model.
- A core semantic type with no installed capability reaches a generic human or
  manual work surface. Refusal is limited to a transformation that inherently
  requires an absent optional executor or pack.
- Does not define the capabilities themselves; those come from packs.
- Routing is defined over semantic types declared by the authoritative
  capability contract. The disciplines named in the outcome are non-exhaustive
  examples observed at capture time, not the routing set.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Semantic work type is determinable from the artifact and its initiative
  context without asking the user each time.
- The same routing decision serves human, deterministic, and agent execution.
- Capability declarations from ARS-EXT-006 are sufficient to route against.

## Unresolved questions

1. What happens when two installed capabilities both claim a semantic type?
2. Can a user override routing, and is the override recorded as a decision?
3. How is routing explained to a user who disagrees with where their work
   went?
4. Does routing need a fallback to a general capability, or should it refuse?

## Projection

- **Initiative ID:** INI-005
- **Initiative name:** Studio Shaping Workbench
- **Horizon:** Next
- **Candidate dependencies:** ARS-EXT-006 for capability declarations;
  ARS-REPO-006 for installed-capability visibility
- **Recommended next shaping:** `frame-intent` after ARS-EXT-006; routing
  without a declaration contract will hard-code what it is meant to avoid.

## Related intents

- [ARS-EXT-006 — Machine-readable skill contracts and organization-owned
  templates](machine-readable-skill-contracts-and-organization-owned-templates.md)
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
