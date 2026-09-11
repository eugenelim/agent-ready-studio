# ARS-REPO-002 — Repository identity, revision pinning, and trust boundary

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-REPO-002
- **Slug:** `repository-identity-revision-pinning-and-trust-boundary`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-004, ARS-CAP-007
- **Initiative:** INI-004 — Repository Workspace Pane
- **Horizon:** Now

## Outcome

Studio can identify exactly which repository and revision it is showing and
prevent remote content from silently becoming trusted instructions or local
executable authority.

## Opportunity

A repository read by an agent-adjacent product is untrusted input. Repository
files can contain agent guidance, and a pane of glass that treats them as
instructions hands an unknown author control of the product's behaviour.

## Boundary

- Repository content is data. It never changes Studio's tools, permissions,
  routing, lifecycle status, or verdicts.
- Does not cover credential handling; that is ARS-REPO-009.
- Pinning records which revision was read; it does not promise the remote has
  not moved since.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Every projection Studio shows can be attributed to one pinned revision, so a
  stale view is detectable rather than silent.
- Treating all repository prose as untrusted data costs little, because the
  pane of glass consumes structured coordination state rather than prose
  instructions.
- Identity must survive a repository being renamed, forked, or moved between
  hosts.

## Unresolved questions

1. What is the durable identity of a connection — URL, host plus owner plus
   name, or a repository identifier the host assigns?
2. Does a user ever see an unpinned live view, or is every view pinned to a
   revision by construction?
3. How is a revision mismatch surfaced when different files were fetched at
   different moments?
4. What is shown to the user about the trust boundary, and is telling them
   enough?

## Projection

- **Initiative ID:** INI-004
- **Initiative name:** Repository Workspace Pane
- **Horizon:** Now
- **Candidate dependencies:** ARS-REPO-001 for the connection itself
- **Recommended next shaping:** Security review of the untrusted-content
  boundary before ARS-REPO-003 detection logic is built on it.

## Related intents

- [ARS-REPO-001 — Read-only public GitHub repository
  connection](read-only-public-github-repository-connection.md)
- [ARS-RUN-009 — Operational permissions, sandboxing, and context-disclosure
  audit](operational-permissions-sandboxing-and-context-disclosure-audit.md)

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
