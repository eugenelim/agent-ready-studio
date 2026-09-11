# ARS-EXT-005 — Agent-Ready Capability Pack and AgentBundle lifecycle

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-EXT-005
- **Slug:** `agent-ready-capability-pack-and-agentbundle-lifecycle`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-007, ARS-CAP-006
- **Initiative:** INI-006 — Workspace Blueprints, Capability Packs, and AgentBundle Platform
- **Horizon:** Next

## Outcome

A workspace can install an optional Agent-Ready Pack that understands
AgentBundle catalogues, installed packs, adapters, profiles, upgrades,
dry-runs, reconciliation, and repository-specific configuration.

## Opportunity

Agent-Ready knowledge has to live somewhere. Putting it in the Studio core
makes AgentBundle a prerequisite for a local-first product that promises not
to need one; putting it in an optional pack keeps the promise.

## Boundary

- Optional. The core Product Development workspace remains useful without
  this pack. Any stronger completeness promise belongs to parent-level
  shaping.
- Read and plan before write: dry-run and reconciliation come before any
  applied change.
- Does not grant repository write authority by itself; that remains
  ARS-REPO-009.
- The outcome is unmet when the pack cannot inspect installed AgentBundle
  state and produce a reviewable dry-run or reconciliation plan from it.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- AgentBundle lifecycle knowledge is separable from the Studio kernel cleanly
  enough to live in a pack.
- Catalogue, adapter, and profile concepts are stable enough to model without
  tracking every upstream change.
- Dry-run output is meaningful to a user who has never run the CLI.

## Unresolved questions

1. Which AgentBundle operations are safe to expose at all, and which should
   remain CLI-only?
2. How does the pack stay compatible as AgentBundle evolves independently of
   Studio?
3. Does upgrading a repository's packs from Studio require a different consent
   than reading them?
4. Is this pack a dependency of the INI-004 repository pane, or a separate
   concern that happens to overlap?
5. Are read-and-plan and applied lifecycle changes one capability or two?

## Projection

- **Initiative ID:** INI-006
- **Initiative name:** Workspace Blueprints, Capability Packs, and AgentBundle
  Platform
- **Horizon:** Next
- **Candidate dependencies:** ARS-EXT-002 for the pack model; ARS-REPO-006 for
  installed-capability visibility
- **Recommended next shaping:** `frame-intent`; resolve the overlap with
  ARS-REPO-006 before either is built.

## Related intents

- [ARS-REPO-006 — Pack, profile, adapter, and skill capability
  visibility](pack-profile-adapter-and-skill-capability-visibility.md)
- [ARS-RUN-003 — AgentBundle headless shaping and build
  adapter](agentbundle-headless-shaping-and-build-adapter.md)

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
