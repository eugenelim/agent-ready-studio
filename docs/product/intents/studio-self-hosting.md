# ARS-SHAPE-007 — Studio self-hosting

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-SHAPE-007
- **Slug:** `studio-self-hosting`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-007, ARS-CAP-001
- **Initiative:** INI-005 — Studio Shaping Workbench
- **Horizon:** Next

## Outcome

Agent-Ready Studio can display its own repository workspace, use its own
shaping experience to refine its own capability intents, and eventually
dispatch accepted implementation work back into its own repository.

## Opportunity

Self-hosting is the cheapest honest test of the product. If Studio cannot hold
its own capability intents, initiatives, and queue usefully, it will not hold
anyone else's.

## Boundary

- Self-hosting is a validation route, not a product requirement for users.
- Convenience for maintainers must not shape the product in ways a first-time
  user would not want.
- Governed self-build dispatch is owned entirely by ARS-RUN-013 and is not
  claimed here.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- This repository's own workspace, intents, and initiatives are representative
  enough to be a useful test subject.
- Reading its own workspace is achievable well before dispatching into it.
- Self-hosting will surface contract gaps faster than a synthetic fixture
  repository would.

## Unresolved questions

1. What would self-hosting reveal that a fixture repository would not, and is
   that worth the coupling?
2. How do maintainers avoid tuning the product to this repository's
   idiosyncrasies?
3. At what point does Studio stop being edited through ordinary tools and
   start being edited through itself?
4. Is a maintainer using Studio on Studio a real user test, or an informed one
   that proves less than it appears to?
5. Is self-hosting a product capability at all, or a validation route attached
   to the repository-reading and shaping capabilities?

## Projection

- **Initiative ID:** INI-005
- **Initiative name:** Studio Shaping Workbench
- **Horizon:** Next
- **Candidate dependencies:** ARS-REPO-004 for reading its own workspace;
  ARS-RUN-013 for the dispatch half
- **Recommended next shaping:** `frame-intent`; treat the read-only half and
  the dispatch half as separate shaping units.

## Related intents

- [ARS-RUN-013 — Studio builds itself through the governed
  runtime](studio-builds-itself-through-the-governed-runtime.md)
- [ARS-SHAPE-008 — Cross-repository shaping
  control](cross-repository-shaping-control.md)

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
