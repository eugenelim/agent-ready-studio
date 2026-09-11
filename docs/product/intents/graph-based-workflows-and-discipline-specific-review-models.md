# ARS-PD-008 — Graph-based workflows and discipline-specific review models

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-PD-008
- **Slug:** `graph-based-workflows-and-discipline-specific-review-models`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-005, ARS-CAP-008
- **Initiative:** INI-003 — Multidisciplinary Product Development
- **Horizon:** Next

## Outcome

Studio offers applicable next transformations based on accepted artifacts and
installed capabilities while preserving the distinct review semantics of
strategy, research, experience, architecture, delivery, and release.

## Opportunity

A fixed pipeline forces every discipline through one shape and breaks the
moment work arrives out of order. Applicability computed from what exists lets
a team enter anywhere and still be offered the right next move.

## Boundary

- Applicability is an offer, never an automatic dispatch.
- Review semantics differ by discipline; this intent must not collapse them
  into one verdict model.
- The core Product Development blueprint supplies a baseline set of
  transformations and review models with zero optional packs installed. Packs
  add further transformations.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Applicability can be computed from accepted artifact types plus installed
  capability declarations, without a hand-authored workflow per blueprint.
- Discipline review semantics differ in criteria and verdict vocabulary but
  share the ARS-CORE-005 decision substrate.
- Offering too many applicable transformations is a worse failure than
  offering too few.

## Unresolved questions

1. What ranks applicable transformations when several apply, and can that
   ranking be explained to a user?
2. How does a discipline declare its review semantics — blueprint, pack
   manifest, or skill contract?
3. Does an applicable-but-not-installed transformation appear at all, and what
   does it invite?
4. What prevents the applicability graph from becoming a hidden workflow
   engine nobody can inspect?
5. What must the zero-pack baseline contain?

## Projection

- **Initiative ID:** INI-003
- **Initiative name:** Multidisciplinary Product Development
- **Horizon:** Next
- **Candidate dependencies:** ARS-EXT-006 for skill contracts; ARS-CORE-005
  for the decision substrate
- **Recommended next shaping:** `frame-intent` after ARS-EXT-006's contract
  shape is known; applicability ranking needs its own de-risk.

## Related intents

- [ARS-EXT-006 — Machine-readable skill contracts and organization-owned
  templates](machine-readable-skill-contracts-and-organization-owned-templates.md)
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
