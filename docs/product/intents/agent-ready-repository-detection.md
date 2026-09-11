# ARS-REPO-003 — Agent-Ready repository detection

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-REPO-003
- **Slug:** `agent-ready-repository-detection`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-007, ARS-CAP-006
- **Initiative:** INI-004 — Repository Workspace Pane
- **Horizon:** Now

## Outcome

Studio can tell whether a repository uses AgentBundle and Agent-Ready Repo
conventions and can identify relevant coordination, pack, adapter, and
lifecycle surfaces without assuming their presence.

## Opportunity

Every richer repository view depends on knowing what is actually there. A
product that assumes the conventions exist will mis-render ordinary
repositories; one that cannot detect them at all cannot offer anything beyond
a file list.

## Boundary

- Detection reports what it found. It never installs, repairs, or upgrades
  anything in the repository.
- Absence of the conventions is a normal, well-handled result, not an error
  state.
- Does not interpret pack contents; that is ARS-REPO-006.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Presence of the conventions is detectable from a small number of well-known
  paths, principally the coordination index and bundle state.
- Detection can express partial adoption rather than a yes/no verdict.
- Convention locations are stable enough to detect by path, and where they are
  configurable Studio reads the configuration rather than guessing.

## Unresolved questions

1. What is the minimum evidence that a repository is Agent-Ready, and what is
   merely suggestive?
2. How does Studio handle a repository whose conventions are present but at a
   version Studio does not understand?
3. Should detection report a confidence, or only a set of found and absent
   surfaces?
4. What does Studio offer a user whose repository is detected as not
   Agent-Ready?

## Projection

- **Initiative ID:** INI-004
- **Initiative name:** Repository Workspace Pane
- **Horizon:** Now
- **Candidate dependencies:** ARS-REPO-002 for pinned, untrusted reads
- **Recommended next shaping:** `frame-intent`, grounded in the installed
  AgentBundle layout reference rather than an inferred convention list.

## Related intents

- [ARS-REPO-006 — Pack, profile, adapter, and skill capability
  visibility](pack-profile-adapter-and-skill-capability-visibility.md)
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
