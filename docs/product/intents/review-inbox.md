# ARS-UX-001 — Review Inbox

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-UX-001
- **Slug:** `review-inbox`
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

A person begins with the work requiring judgment, prioritized by decision need
and downstream impact rather than by agent session or terminal.

## Opportunity

The default entry point to agent-assisted work today is a session list or a
terminal, which orders work by when a machine started it. What a reviewer
needs is the opposite ordering: what is waiting on me, and what unblocks most
if I decide it.

## Boundary

- Not a notification feed or an activity log. Items appear because a decision
  is needed, not because something happened.
- Prioritization is a projection of artifact and dependency state, not a
  hand-maintained priority field.
- Cross-person routing and assignment are ARS-SCALE-001.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Decision need and downstream impact can be computed from the artifact,
  review, and relation graph without user-entered priority.
- A single inbox serves every discipline, rather than one inbox per workspace
  section.
- Items that need judgment are a small enough set that an inbox, not a search
  surface, is the right shape.

## Unresolved questions

1. What exactly makes one waiting decision more urgent than another — blocked
   downstream count, age, risk, or something the user sets?
2. Does the inbox include work waiting on someone else, and if so how is that
   distinguished from work waiting on me?
3. What belongs in the inbox in a workspace with no execution at all?
4. How does the inbox behave when repository-sourced work from ARS-REPO-004
   appears alongside local workspace items?

## Projection

- **Initiative ID:** INI-002
- **Initiative name:** Artifact-First Work Experience
- **Horizon:** Now
- **Candidate dependencies:** ARS-CORE-005 for review state; ARS-CORE-004 for
  downstream-impact computation
- **Recommended next shaping:** `information-architecture` and `frame-intent`;
  the prioritization rule needs its own de-risk before it is built.

## Related intents

- [ARS-UX-002 — Work Item Studio](work-item-studio.md)
- [ARS-REPO-004 — Workspace status pane of
  glass](workspace-status-pane-of-glass.md)

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
