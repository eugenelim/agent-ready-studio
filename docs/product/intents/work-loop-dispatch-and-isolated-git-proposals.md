# ARS-RUN-005 — Work-loop dispatch and isolated Git proposals

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-RUN-005
- **Slug:** `work-loop-dispatch-and-isolated-git-proposals`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-007, ARS-CAP-003
- **Initiative:** INI-007 — Headless Execution and Delivery Runtime
- **Horizon:** Next

## Outcome

Studio can dispatch an approved specification through work-loop in a dedicated
worktree or equivalent isolated workspace and receive a proposed Git revision
rather than mutating accepted source directly.

## Opportunity

Isolation is what makes agent-produced code reviewable instead of alarming. A
proposal in its own worktree can be inspected, rejected, or discarded without
touching anything the team depends on.

## Boundary

- Studio never mutates accepted source directly; the result is always a
  proposal.
- Merge remains a human decision recorded through ARS-CORE-005.
- Requires a local checkout from ARS-REPO-008 and write authority from
  ARS-REPO-009.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Git worktrees are a sufficient isolation mechanism, though not the only
  possible one.
- One dispatch produces one proposed revision, so review has a single unit.
- A dispatched specification has already passed its own approval gate before
  Studio sends it.

## Unresolved questions

1. What happens to an isolated workspace when its dispatch fails, is
   abandoned, or is superseded?
2. How many concurrent isolated workspaces are supported, and what bounds
   that?
3. Is the proposed revision pushed anywhere, or does it stay local until a
   merge decision?
4. Who cleans up, and what does the user see about disk they did not knowingly
   allocate?

## Projection

- **Initiative ID:** INI-007
- **Initiative name:** Headless Execution and Delivery Runtime
- **Horizon:** Next
- **Candidate dependencies:** ARS-RUN-003 for the dispatch adapter;
  ARS-REPO-008 for a local checkout
- **Recommended next shaping:** `frame-intent` after the shaping contracts are
  proven; this is Wave 4, not Wave 3.

## Related intents

- [ARS-RUN-008 — Filesystem and Git reconciliation with artifact
  discovery](filesystem-and-git-reconciliation-with-artifact-discovery.md)
- [ARS-PD-006 — Delivery workspace](delivery-workspace.md)

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
