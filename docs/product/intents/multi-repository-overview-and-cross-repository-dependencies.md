# ARS-REPO-007 — Multi-repository overview and cross-repository dependencies

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-REPO-007
- **Slug:** `multi-repository-overview-and-cross-repository-dependencies`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-009, ARS-CAP-010
- **Initiative:** INI-004 — Repository Workspace Pane
- **Horizon:** Later

## Outcome

A user can view several repositories as one coordinated product workspace and
understand dependencies, accepted remote receipts, and responsibility
boundaries without merging their source trees.

## Opportunity

Product work often spans more than one repository. Coordination across them is
currently done by hand, and a dependency declared in one repository is
invisible from the other until it breaks something.

## Boundary

- Repositories stay separate. Studio projects across them; it never merges or
  synchronizes their trees.
- A remote dependency is satisfied by a reviewed receipt, never by Studio
  assuming completeness.
- Coordinating execution across repositories is ARS-RUN-012.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- The existing coordination-receipt contract is the right satisfaction
  mechanism and Studio should consume it rather than define another.
- Responsibility boundaries can be read from declared dependencies plus
  receipts, without a separate ownership registry.
- Users will connect a small number of repositories, not dozens, in the first
  useful version.

## Unresolved questions

1. What does Studio show when a declared remote dependency points at a
   repository the user has not connected?
2. Is a cross-repository view a workspace concept, or a per-user set of
   connections?
3. How is a conflicting or stale receipt surfaced without Studio adjudicating
   it?
4. Does an initiative ever span repositories as one entity, or only as linked
   entities?

## Projection

- **Initiative ID:** INI-004
- **Initiative name:** Repository Workspace Pane
- **Horizon:** Later
- **Candidate dependencies:** ARS-REPO-004 for single-repository projection
- **Recommended next shaping:** `frame-intent` after single-repository
  projection is proven; do not shape ahead of ARS-REPO-004.

## Related intents

- [ARS-RUN-012 — Cross-repository execution coordination and
  receipts](cross-repository-execution-coordination-and-receipts.md)
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
