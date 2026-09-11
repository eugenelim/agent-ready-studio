# ARS-REPO-008 — Local folder and managed-clone connections

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-REPO-008
- **Slug:** `local-folder-and-managed-clone-connections`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-004, ARS-CAP-007
- **Initiative:** INI-004 — Repository Workspace Pane
- **Horizon:** Later

## Outcome

A user can connect an existing local checkout or let Studio manage a local
checkout while retaining a clear mental model of where files live and who owns
them.

## Opportunity

Read-only remote access cannot support execution, and a user who cannot tell
whether Studio is reading their working tree or a copy it controls will not
trust it with either.

## Boundary

- Explicitly out of the Wave 1 read-only steel thread.
- Studio never silently modifies a user-owned checkout.
- Installer and hidden-storage mechanics are ARS-REPO-009.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Connected local checkouts and Studio-managed checkouts are different enough
  in ownership to need distinct affordances rather than one mode.
- Users with a local checkout expect Studio to respect their branch, working
  tree, and uncommitted changes.
- Execution capabilities will require a local checkout of one kind or the
  other.

## Unresolved questions

1. What does Studio do when a connected checkout has uncommitted changes or is
   on an unexpected branch?
2. Who is responsible for keeping a managed checkout current, and what happens
   when it falls behind?
3. Can one repository be connected both ways at once, and should that be
   prevented?
4. Is the same content-source interface used for remote and local sources, or
   are they genuinely different adapters?

## Projection

- **Initiative ID:** INI-004
- **Initiative name:** Repository Workspace Pane
- **Horizon:** Later
- **Candidate dependencies:** ARS-REPO-001 and ARS-REPO-002 for the connection
  model
- **Recommended next shaping:** `explore-options` on ownership models once
  execution requires a local checkout.

## Related intents

- [ARS-REPO-009 — Installation, hidden-workspace mechanics, private
  repositories, and source
  authority](installation-hidden-workspace-mechanics-private-repositories-and-source-authority.md)
- [ARS-RUN-005 — Work-loop dispatch and isolated Git
  proposals](work-loop-dispatch-and-isolated-git-proposals.md)

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
