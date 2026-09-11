# ARS-SHAPE-002 — Capture and edit intent drafts in Studio

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-SHAPE-002
- **Slug:** `capture-and-edit-intent-drafts-in-studio`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-002, ARS-CAP-003
- **Initiative:** INI-005 — Studio Shaping Workbench
- **Horizon:** Next

## Outcome

A user can create or revise a Draft capability or feature intent in Studio,
preserve its source context, and later project it into an Agent-Ready
repository without needing an agent.

## Opportunity

Intent capture is the point where product work enters the system, and it is
currently a text editor plus a convention. Doing it in Studio makes the
source, revisions, and review attributable from the first draft.

## Boundary

- Produces Draft intents only. Nothing here accepts, approves, or dispatches
  work.
- Must work with no agent present; agent assistance is ARS-SHAPE-003 and
  ARS-SHAPE-005.
- Projection into a repository requires write authority that is not assumed
  here.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Studio's intent artifact can match the installed intent contract closely
  enough to round-trip without lossy translation.
- Source context can be preserved as minimized provenance rather than a copy
  of the originating conversation.
- Manual capture is valuable on its own, before any agent-assisted shaping
  exists.

## Unresolved questions

1. Is the repository file or the Studio artifact authoritative while an intent
   is being drafted?
2. How does Studio handle an intent whose repository file has changed since it
   was opened?
3. What is the minimum an intent must contain before Studio will let it be
   saved at all?
4. When does projection into a repository happen — on save, on review, or on
   an explicit user action?
5. Are local Draft capture and repository projection one capability or two,
   given that projection needs write authority this intent does not assume?

## Projection

- **Initiative ID:** INI-005
- **Initiative name:** Studio Shaping Workbench
- **Horizon:** Next
- **Candidate dependencies:** ARS-SHAPE-001 for opening; ARS-CORE-003 for
  revisions
- **Recommended next shaping:** `frame-intent`, then reconcile the Studio
  intent shape against the installed intent contract before building.

## Related intents

- [ARS-SHAPE-005 — Human-agent coauthoring, review, and
  ratification](human-agent-coauthoring-review-and-ratification.md)
- [ARS-SHAPE-006 — Promote shaped work to brief, specification, and
  build](promote-shaped-work-to-brief-specification-and-build.md)

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
