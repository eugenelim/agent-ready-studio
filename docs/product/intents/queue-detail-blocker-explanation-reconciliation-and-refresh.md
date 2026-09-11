# ARS-REPO-005 — Queue detail, blocker explanation, reconciliation, and refresh

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-REPO-005
- **Slug:** `queue-detail-blocker-explanation-reconciliation-and-refresh`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-007, ARS-CAP-002
- **Initiative:** INI-004 — Repository Workspace Pane
- **Horizon:** Now

## Outcome

A user can inspect why work is blocked, what would become unblocked, whether
the workspace index has drifted, and which explicit repair or refresh action
is available.

## Opportunity

Knowing that work is blocked is the least useful half of the answer. Teams
need the reason, the unblocking condition, and what shipping this item would
release downstream.

## Boundary

- Read-only inspection comes before any repair or write-back. Availability of
  a repair may be shown; performing it is not in this capability.
- Studio never fabricates a human semantic decision a repair path requires,
  such as a migration selection or a confirmation.
- Drift is reported, not silently corrected.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- The reconciliation modes already distinguish stale, premature, and untracked
  entries well enough to project without reinterpretation.
- Downstream-unblocked information is derivable from the dependency graph the
  contract already exposes.
- Users will accept a read-only explanation as valuable before any repair is
  possible.

## Unresolved questions

1. Where is the line between showing a repair is available and offering to
   perform it?
2. How are repairs that require a human-authored confirmation presented
   without implying Studio can produce one?
3. Should reconciliation run on demand, on connection, or on a schedule — and
   who pays its cost?
4. What does Studio show when reconciliation itself cannot complete?

## Projection

- **Initiative ID:** INI-004
- **Initiative name:** Repository Workspace Pane
- **Horizon:** Now
- **Candidate dependencies:** ARS-REPO-004 for the base projection
- **Recommended next shaping:** `frame-intent` after ARS-REPO-004; the
  read-only/repair boundary needs an explicit recorded decision.

## Related intents

- [ARS-REPO-004 — Workspace status pane of
  glass](workspace-status-pane-of-glass.md)
- [ARS-REPO-009 — Installation, hidden-workspace mechanics, private
  repositories, and source
  authority](installation-hidden-workspace-mechanics-private-repositories-and-source-authority.md)

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
