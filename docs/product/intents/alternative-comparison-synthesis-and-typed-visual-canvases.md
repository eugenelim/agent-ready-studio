# ARS-UX-008 — Alternative comparison, synthesis, and typed visual canvases

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-UX-008
- **Slug:** `alternative-comparison-synthesis-and-typed-visual-canvases`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-010, ARS-CAP-008
- **Initiative:** INI-002 — Artifact-First Work Experience
- **Horizon:** Later, except simple artifact comparison which may arrive earlier

## Outcome

Teams can compare competing artifacts, synthesize a preferred result, and
review spatial work such as journeys, opportunity maps, flows, and system
diagrams as connected typed entities.

## Opportunity

Some product work is spatial by nature. Rendering a journey map or a system
diagram as a document loses the relationships that make it reviewable, and
forcing it into an external canvas tool loses its lineage and decisions.

## Boundary

- A canvas holds typed entities with real relations, not free-form drawing.
- Comparison, synthesis, and typed canvases are separately verifiable; whether
  they remain one capability is undecided. Simple two-artifact comparison may
  be delivered earlier, while canvas work stays Later.
- Not a replacement for dedicated design tools; integration with them is
  ARS-SCALE-005.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Spatial artifacts can be modelled as typed entities and relations rather
  than as opaque images.
- Comparison and synthesis share enough mechanics with ARS-RUN-011 to be
  shaped together.
- Canvas review needs its own review semantics rather than reusing document
  review unchanged.

## Unresolved questions

1. Which canvas type justifies the investment first — journey, flow,
   opportunity map, or system diagram?
2. Is layout meaningful product content that must be versioned, or
   presentation the product may recompute?
3. What does synthesis produce — a new artifact, or an accepted revision on an
   existing one?
4. Can simple comparison ship without any canvas work, and does it still
   deliver value alone?
5. Which of comparison, synthesis, or typed canvases is the smallest
   capability that stands alone?

## Projection

- **Initiative ID:** INI-002
- **Initiative name:** Artifact-First Work Experience
- **Horizon:** Later, except simple artifact comparison which may arrive
  earlier
- **Candidate dependencies:** ARS-UX-004 for the renderer registry; ARS-UX-005
  for comparison mechanics
- **Recommended next shaping:** `explore-options` on canvas scope; split the
  earlier comparison slice out during shaping.

## Related intents

- [ARS-RUN-011 — Multi-executor comparison and
  synthesis](multi-executor-comparison-and-synthesis.md)
- [ARS-PD-004 — Experience design workspace](experience-design-workspace.md)

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
