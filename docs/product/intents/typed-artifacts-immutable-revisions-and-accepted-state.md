# ARS-CORE-003 — Typed artifacts, immutable revisions, and accepted state

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-CORE-003
- **Slug:** `typed-artifacts-immutable-revisions-and-accepted-state`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-002, ARS-CAP-003
- **Initiative:** INI-001 — Studio Foundation and Workspace Kernel
- **Horizon:** Now

## Outcome

Product work is represented as typed artifacts with immutable history,
explicit proposals, and an unambiguous accepted revision.

## Opportunity

Reviewers cannot judge work whose current state is ambiguous. When any edit
silently becomes the truth, there is no proposal to approve, no prior revision
to compare against, and no durable record of what the team actually agreed to.

## Boundary

- Does not define per-discipline artifact schemas; those arrive with
  ARS-PD-002 through ARS-PD-007.
- Does not cover rendering or editing experiences; those are ARS-UX-004.
- Immutability preserves revision content and the provenance, exact-input,
  and evidence relations on which that revision depends. Ordinary mutable
  relations, comments, and lifecycle membership are exempt.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Exactly one accepted revision per artifact is sufficient; branching accepted
  state is not required.
- A proposal is a revision that has not been accepted, rather than a separate
  entity type.
- Artifact type is a first-class field that renderers, transformations, and
  review models all key on.

## Unresolved questions

1. Can an artifact have no accepted revision indefinitely, and what does the
   rest of the product show when it does not?
2. Are large binary or media payloads artifacts under this model, or
   referenced assets handled by ARS-SCALE-004?
3. How is a revision superseded or withdrawn without violating immutability?
4. What happens to accepted state when an artifact's type schema changes under
   ARS-EXT-004?

## Projection

- **Initiative ID:** INI-001
- **Initiative name:** Studio Foundation and Workspace Kernel
- **Horizon:** Now
- **Candidate dependencies:** ARS-CORE-001 for actor attribution on every
  revision
- **Recommended next shaping:** `frame-intent`, then an architecture review of
  the revision model before per-discipline schemas are shaped.

## Related intents

- [ARS-CORE-004 — Relations, lineage, evidence, and source
  authority](relations-lineage-evidence-and-source-authority.md)
- [ARS-CORE-005 — Reviews, comments, decisions, and advancement
  policies](reviews-comments-decisions-and-advancement-policies.md)

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
