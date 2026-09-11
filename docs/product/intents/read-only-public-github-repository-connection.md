# ARS-REPO-001 — Read-only public GitHub repository connection

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-REPO-001
- **Slug:** `read-only-public-github-repository-connection`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-007, ARS-CAP-004
- **Initiative:** INI-004 — Repository Workspace Pane
- **Horizon:** Now

## Outcome

A user can point Studio at a public GitHub repository URL and inspect useful
product and workspace information without installing anything in that
repository or creating a persistent local clone.

## Opportunity

The cheapest way to prove Studio's value on real work is to read a repository
somebody already maintains. Requiring an install, a clone, or a credential
first puts the proof behind setup that a prospective user has no reason to
complete.

## Boundary

- Read-only. No writes, no repository install, no persistent clone in this
  capability.
- Public repositories only. Private-repository authentication is ARS-REPO-009.
- GitHub first does not mean GitHub-only forever, but other hosts are not in
  this capability.
- A representative successful result is an attributable projection derived
  from a pinned revision of an Agent-Ready repository.
- A repository that is not Agent-Ready yields a normal, non-error result. The
  outcome is unmet when neither this path nor the representative success holds.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Several access approaches remain open and are deliberately not chosen in
  this capture pass: the GitHub contents or raw-file API, a shallow or
  ephemeral clone, a server-side repository reader, and a local managed cache.
- The files Studio needs — workspace.toml, docs artifacts, bundle state — are
  small enough that a full clone is not required to read them.
- Unauthenticated public access is sufficient for a first proof, accepting
  whatever rate limits that implies.

## Unresolved questions

1. Which access approach survives rate limits, large repositories, and offline
   use — and what evidence would decide between them?
2. What does Studio show for a public repository that is not Agent-Ready at
   all?
3. Is any local caching allowed under 'no persistent clone', and if so what is
   its lifetime?
4. How does a user recover when the repository is reachable but a needed file
   is absent or malformed?

## Projection

- **Initiative ID:** INI-004
- **Initiative name:** Repository Workspace Pane
- **Horizon:** Now
- **Candidate dependencies:** ARS-CORE-006 for the content-source boundary;
  ARS-REPO-002 for identity and trust
- **Recommended next shaping:** `frame-intent` then `de-risk-intent`: the
  access approach is the riskiest open choice in Wave 1.

## Related intents

- [ARS-REPO-002 — Repository identity, revision pinning, and trust
  boundary](repository-identity-revision-pinning-and-trust-boundary.md)
- [ARS-REPO-008 — Local folder and managed-clone
  connections](local-folder-and-managed-clone-connections.md)

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
