# ARS-UX-006 — Evidence, lineage, and decision-history navigation

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-UX-006
- **Slug:** `evidence-lineage-and-decision-history-navigation`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-002, ARS-CAP-008
- **Initiative:** INI-002 — Artifact-First Work Experience
- **Horizon:** Next

## Outcome

A person can navigate from a claim or accepted artifact back to its sources,
assumptions, prior revisions, comments, and deciding actors.

## Opportunity

Recorded lineage that cannot be walked risks becoming an audit log nobody
opens. The value of ARS-CORE-004 only reaches a user when a claim on screen is
one interaction from the evidence under it.

## Boundary

- Navigation surfaces recorded lineage; it never infers a link that was not
  recorded.
- Does not cover production telemetry or post-release outcome linkage; that is
  ARS-SCALE-006.
- Traversal is bounded and explainable rather than an open-ended graph
  explorer.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Users want to move from a specific claim outward, rather than to browse a
  graph.
- Decision history and content lineage are usefully navigated through the same
  affordance.
- Most traversals terminate within a few hops, so depth limits will rarely
  bind.

## Unresolved questions

1. What is the entry point — a claim inside a rendered artifact, or the
   artifact as a whole?
2. How is a dead end shown when an input was never recorded, versus recorded
   and since removed?
3. Does navigation cross a repository boundary into ARS-REPO-007 sources, and
   what is shown if that source is unreachable?
4. What does this surface show for an artifact produced entirely by hand with
   no recorded inputs?

## Projection

- **Initiative ID:** INI-002
- **Initiative name:** Artifact-First Work Experience
- **Horizon:** Next
- **Candidate dependencies:** ARS-CORE-004 for recorded lineage; ARS-UX-002
  for the host surface
- **Recommended next shaping:** `information-architecture`, after
  ARS-CORE-004's relation model is shaped.

## Related intents

- [ARS-CORE-004 — Relations, lineage, evidence, and source
  authority](relations-lineage-evidence-and-source-authority.md)
- [ARS-PD-003 — Research workspace and evidence
  synthesis](research-workspace-and-evidence-synthesis.md)

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
