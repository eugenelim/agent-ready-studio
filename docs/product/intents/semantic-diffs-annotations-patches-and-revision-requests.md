# ARS-UX-005 — Semantic diffs, annotations, patches, and revision requests

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-UX-005
- **Slug:** `semantic-diffs-annotations-patches-and-revision-requests`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-008, ARS-CAP-003
- **Initiative:** INI-002 — Artifact-First Work Experience
- **Horizon:** Next

## Outcome

Reviewers understand meaningful changes to structured work without relying
only on line-oriented text diffs and can request targeted revisions.

## Opportunity

A line diff of a restructured research synthesis or a re-laid-out journey map
is noise. Reviewers respond to noise by skimming, and a skimmed review is an
unattributed approval.

## Boundary

- Semantic diffing is per artifact type; there is no universal semantic diff.
- A revision request targets content, not a person; assignment is
  ARS-SCALE-001.
- Does not replace line diffs where line diffs are the right view, such as
  code change sets.
- The outcome is not met when a reviewer cannot identify which typed elements
  were added, removed, moved, or materially changed without falling back to a
  line-oriented diff.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- A typed artifact's schema carries enough structure to compute a meaningful
  change summary.
- Annotations anchored to structure survive a revision better than annotations
  anchored to text offsets.
- A targeted revision request is more actionable to both humans and agents
  than a free-text comment.

## Unresolved questions

1. What is the fallback when an artifact type has structure but no semantic
   differ — line diff, or nothing?
2. How does an annotation behave when the structure it anchored to is removed
   in the next revision?
3. Is a patch something a reviewer proposes directly, or only something an
   executor produces from a revision request?
4. Which artifact type should prove this first, and what would show the
   semantic view is not worth its cost?
5. Is semantic change presentation for one typed artifact the smallest
   standalone capability, with annotations, patches, and revision requests
   shaped separately?

## Projection

- **Initiative ID:** INI-002
- **Initiative name:** Artifact-First Work Experience
- **Horizon:** Next
- **Candidate dependencies:** ARS-UX-004 for type-aware views; ARS-CORE-003
  for revision history
- **Recommended next shaping:** `de-risk-intent` on one artifact type before
  generalizing; the value claim here is untested.

## Related intents

- [ARS-UX-004 — Artifact renderer and editor
  registry](artifact-renderer-and-editor-registry.md)
- [ARS-RUN-011 — Multi-executor comparison and
  synthesis](multi-executor-comparison-and-synthesis.md)

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
