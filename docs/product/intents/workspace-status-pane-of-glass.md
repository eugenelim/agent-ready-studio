# ARS-REPO-004 — Workspace status pane of glass

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-REPO-004
- **Slug:** `workspace-status-pane-of-glass`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-007, ARS-CAP-010
- **Initiative:** INI-004 — Repository Workspace Pane
- **Horizon:** Now

## Outcome

A user can see a repository's active initiatives, milestones, shaping work,
briefs, ready build work, active work, shipped work, blockers, findings,
signals, and next safe actions inside Studio.

## Opportunity

Workspace state today is reachable only by running a skill in a terminal and
reading JSON. The information is already structured and already authoritative;
what is missing is a surface a non-terminal user can read.

## Boundary

- The versioned Agent-Ready workspace-status contract is the authoritative
  owner of the supported category set. It establishes which lifecycle
  collections and findings exist and what each means. The categories listed in
  the outcome are the set observed at capture time and must be derived from the
  contract rather than maintained here.
- Read-only. Repair, refresh, and write-back are ARS-REPO-005 and
  ARS-REPO-009.
- Projection fidelity outranks presentation: if the contract and the view
  disagree, the contract wins.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- The installed workspace-status backend's result is a sufficient and stable
  enough projection source that Studio does not need its own workspace parser.
- Initiative, queue, shaping, brief, and finding structure translate to a
  visual surface without semantic loss.
- Next safe actions can be shown as information rather than as buttons, at
  least in the read-only wave.

## Unresolved questions

1. Does Studio invoke the repository's own installed backend, carry a pinned
   copy of the contract, or read the index directly — and what breaks when the
   contract version moves?
2. How is a finding shown so a user understands it blocks dispatch without
   being told to run a command they cannot run?
3. What is the view for a repository with no initiatives, only a top-level
   backlog?
4. Which parts of the projection are safe to show verbatim, given repository
   content is untrusted?
5. How does Studio track the workspace-status contract version so the
   projection does not silently decay?

## Projection

- **Initiative ID:** INI-004
- **Initiative name:** Repository Workspace Pane
- **Horizon:** Now
- **Candidate dependencies:** ARS-REPO-003 for detection; ARS-REPO-002 for
  pinned reads
- **Recommended next shaping:** `frame-intent`, then `de-risk-intent` on
  contract-version drift; this is the Wave 1 steel thread's centre.

## Related intents

- [ARS-REPO-005 — Queue detail, blocker explanation, reconciliation, and
  refresh](queue-detail-blocker-explanation-reconciliation-and-refresh.md)
- [ARS-UX-001 — Review Inbox](review-inbox.md)

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
