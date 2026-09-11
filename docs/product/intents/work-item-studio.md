# ARS-UX-002 — Work Item Studio

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-UX-002
- **Slug:** `work-item-studio`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-002, ARS-CAP-003
- **Initiative:** INI-002 — Artifact-First Work Experience
- **Horizon:** Now

## Outcome

A reviewer can inspect inputs, artifact revisions, lineage, evidence,
questions, comments, and decision controls in one focused work surface.

## Opportunity

Judgment fails when its inputs are scattered. A reviewer who must open four
places to see what changed, what it was based on, and what was asked will
either skip the check or approve on trust.

## Boundary

- One work item at a time. Comparing alternatives side by side is ARS-UX-008.
- Does not own artifact rendering itself; it hosts the renderers from
  ARS-UX-004.
- Execution diagnostics stay secondary to the artifact and its decision.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- A single surface can hold inputs, content, lineage, discussion, and decision
  without becoming a dashboard nobody reads.
- The same surface shape works for a strategy artifact and a code change set,
  differing only in the embedded renderer.
- Decision controls belong on the work surface rather than in a separate
  approval screen.

## Unresolved questions

1. What is on screen by default and what is one interaction away, for a
   reviewer who is not the author?
2. How does the surface behave when the artifact type has no purpose-built
   renderer installed?
3. Does a reviewer edit here, or only request revisions — and does that answer
   differ by discipline?
4. What is the minimum context needed to make a decision safely, and should
   the surface refuse a decision without it?

## Projection

- **Initiative ID:** INI-002
- **Initiative name:** Artifact-First Work Experience
- **Horizon:** Now
- **Candidate dependencies:** ARS-UX-004 for renderers; ARS-CORE-005 for
  decision controls
- **Recommended next shaping:** `information-architecture`, then
  `design-review` against the shipped walking-skeleton surface.

## Related intents

- [ARS-UX-004 — Artifact renderer and editor
  registry](artifact-renderer-and-editor-registry.md)
- [ARS-UX-006 — Evidence, lineage, and decision-history
  navigation](evidence-lineage-and-decision-history-navigation.md)

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
