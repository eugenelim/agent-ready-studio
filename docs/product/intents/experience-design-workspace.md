# ARS-PD-004 — Experience design workspace

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-PD-004
- **Slug:** `experience-design-workspace`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-008, ARS-CAP-001
- **Initiative:** INI-003 — Multidisciplinary Product Development
- **Horizon:** Next

## Outcome

Designers can develop and review journeys, information architecture, flows,
screen states, service blueprints, prototypes, content, accessibility, and
usability evidence.

## Opportunity

Design decisions live in design tools that hold pixels but not reasoning. Why
a flow branches, which research it answered, and what accessibility
requirement it satisfies are recorded, if at all, in a comment thread that
outlives nothing.

## Boundary

- Not a visual design or prototyping tool. Studio reviews prototype decisions,
  evidence, and lineage while prototypes are authored in a design or
  prototyping tool.
- Design-tool integration is ARS-SCALE-005; this intent must be useful without
  it.
- Spatial canvas rendering depends on ARS-UX-008 and is not assumed available.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Journeys, flows, and screen states can be typed entities whose relations
  carry the design reasoning.
- Accessibility and state coverage are checkable properties of a typed flow
  rather than review-time recall.
- Usability evidence reuses the ARS-PD-003 evidence model rather than a
  separate one.

## Unresolved questions

1. Where is the boundary between a design decision Studio holds and a design
   artifact a design tool holds?
2. Which of journeys, flows, or screen states must be native for the workspace
   to be useful at all?
3. How does a prototype — inherently a build output — enter the artifact
   model?
4. Can accessibility conformance be asserted here without becoming an
   unverifiable claim?
5. Does any bounded native prototyping belong here, given the outcome says
   designers can develop and review prototypes?

## Projection

- **Initiative ID:** INI-003
- **Initiative name:** Multidisciplinary Product Development
- **Horizon:** Next
- **Candidate dependencies:** ARS-UX-008 for spatial review; ARS-PD-003 for
  usability evidence
- **Recommended next shaping:** experience-design discipline shaping;
  `explore-options` on the Studio/design-tool boundary.

## Related intents

- [ARS-UX-008 — Alternative comparison, synthesis, and typed visual
  canvases](alternative-comparison-synthesis-and-typed-visual-canvases.md)
- [ARS-SCALE-005 — External product-development integrations and portfolio
  views](external-product-development-integrations-and-portfolio-views.md)

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
