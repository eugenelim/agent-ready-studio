# ARS-REPO-009 — Installation, hidden-workspace mechanics, private repositories, and source authority

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-REPO-009
- **Slug:** `installation-hidden-workspace-mechanics-private-repositories-and-source-authority`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-009, ARS-CAP-004
- **Initiative:** INI-004 — Repository Workspace Pane
- **Horizon:** Later

## Outcome

Studio can eventually install and update its desktop and runner components,
authenticate to authorized private repositories, manage internal checkout
storage, and make every write-back boundary visible and controllable.

## Opportunity

Everything real teams work on is private, and everything they install has to
be updatable. But each of these adds credential handling, background storage,
and write authority — the three things most likely to lose a user's trust if
introduced casually.

## Boundary

- This must remain later work. The first steel thread is read-only and may use
  only a public GitHub URL.
- No credential is stored, and no write-back path exists, until this
  capability is shaped and gated on its own terms.
- Hidden storage must be discoverable and removable by the user; nothing is
  placed where they cannot find it.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Private-repository access, installation, and write-back are separable and
  can be shaped and gated independently rather than as one capability.
- Source authority — which side owns a field when Studio and a repository both
  hold it — must be declared explicitly per connection.
- Users will require a visible account of every write Studio can make before
  granting write authority.

## Unresolved questions

1. Which credential model is acceptable — host app, delegated token, device
   flow — and who reviews that choice?
2. What is the complete, enumerable list of writes Studio may perform, and
   where is it shown?
3. How does a user inspect, relocate, and delete Studio's internal checkout
   storage?
4. Should updating Studio and updating a repository's installed packs ever be
   the same action?
5. Which of installation and updates, private-repository authentication,
   internal checkout storage, and write-back visibility is shaped first, and
   should they ever remain one capability when they are separable?

## Projection

- **Initiative ID:** INI-004
- **Initiative name:** Repository Workspace Pane
- **Horizon:** Later
- **Candidate dependencies:** ARS-REPO-008 for local checkouts; ARS-RUN-009
  for permission semantics
- **Recommended next shaping:** Security and privacy review before any
  shaping; this is the highest-trust-cost capability in INI-004.

## Related intents

- [ARS-RUN-009 — Operational permissions, sandboxing, and context-disclosure
  audit](operational-permissions-sandboxing-and-context-disclosure-audit.md)
- [ARS-SCALE-002 — Artifact-level permissions and sensitive-data
  controls](artifact-level-permissions-and-sensitive-data-controls.md)

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
