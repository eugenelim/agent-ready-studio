# ARS-REPO-006 — Pack, profile, adapter, and skill capability visibility

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-REPO-006
- **Slug:** `pack-profile-adapter-and-skill-capability-visibility`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-006, ARS-CAP-007
- **Initiative:** INI-004 — Repository Workspace Pane
- **Horizon:** Now

## Outcome

Studio can show which AgentBundle packs, profiles, adapters, skills,
subagents, hooks, and required capabilities are present or absent for a
repository.

## Opportunity

What a repository can actually do is a function of what is installed in it.
Without that view, Studio either offers actions the repository cannot perform
or hides capability the repository already has.

## Boundary

- Reports what is installed. It does not install, update, or remove anything;
  that is ARS-EXT-005.
- The initially relevant pack families are read from the repository, not
  hard-coded as a catalogue.
- Absence is reported only relative to what the repository declares as
  required or expected. Reporting absence against a broader catalogue requires
  a catalogue with a named authoritative owner, which does not exist here.
- Does not execute any installed skill.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Installed state is discoverable from bundle state and adapter projections
  without executing repository code.
- Pack families may include core, product-engineering, product-strategy,
  desk-research, experience-design, architect, frontend-engineering,
  release-engineering, contracts, and repository and tracker integrations.
  The displayed set must be derived from the repository, not from any list
  held in this intent.
- Absence of a pack is as informative to a user as presence, and must be shown
  as such.

## Unresolved questions

1. Does Studio need a catalogue to name packs it has not seen, and if so who
   owns that catalogue?
2. How are two adapter projections of the same pack reconciled when they
   disagree?
3. What does Studio show for a skill whose declared capabilities it cannot
   verify?
4. Is version compatibility between an installed pack and Studio's
   expectations in scope here or in ARS-EXT-004?

## Projection

- **Initiative ID:** INI-004
- **Initiative name:** Repository Workspace Pane
- **Horizon:** Now
- **Candidate dependencies:** ARS-REPO-003 for detection
- **Recommended next shaping:** `frame-intent`, grounded in the observed
  bundle state of a real repository rather than a documented catalogue.

## Related intents

- [ARS-EXT-005 — Agent-Ready Capability Pack and AgentBundle
  lifecycle](agent-ready-capability-pack-and-agentbundle-lifecycle.md)
- [ARS-EXT-006 — Machine-readable skill contracts and organization-owned
  templates](machine-readable-skill-contracts-and-organization-owned-templates.md)

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
