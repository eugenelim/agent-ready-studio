# ARS-EXT-002 — Optional Capability Packs

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-EXT-002
- **Slug:** `optional-capability-packs`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-006, ARS-CAP-007
- **Initiative:** INI-006 — Workspace Blueprints, Capability Packs, and AgentBundle Platform
- **Horizon:** Next

## Outcome

A workspace can gain new multidisciplinary or execution capabilities without
redefining its entire blueprint or making agents a core prerequisite.

## Opportunity

Every discipline Studio wants to serve adds artifact types, renderers, and
transformations. Folding all of them into the core blueprint makes the
local-first workspace heavy for a team that needs one discipline.

## Boundary

- Packs are additive and validated. Installing one never becomes a
  prerequisite for the core workspace.
- No pack loads executable code into a privileged process.
- Not a marketplace. Distribution, discovery, and commerce are out of scope.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Capability can be decomposed into packs along discipline lines without
  pervasive cross-pack dependencies.
- A pack can extend a blueprint rather than replacing it.
- Uninstalling a pack should leave its artifacts readable, even if not
  editable.

## Unresolved questions

1. What does a workspace do with artifacts belonging to an uninstalled pack?
2. Can two packs conflict, and is conflict detected at install time or at use
   time?
3. Who authors packs in practice — maintainers, organizations, or users?
4. Is agent-ready capability a pack like any other, or a special case with its
   own trust requirements?

## Projection

- **Initiative ID:** INI-006
- **Initiative name:** Workspace Blueprints, Capability Packs, and AgentBundle
  Platform
- **Horizon:** Next
- **Candidate dependencies:** ARS-EXT-001 for the blueprint model; ARS-EXT-003
  for manifests
- **Recommended next shaping:** `frame-intent` after ARS-EXT-001; pack
  boundaries should follow the disciplines in INI-003.

## Related intents

- [ARS-EXT-005 — Agent-Ready Capability Pack and AgentBundle
  lifecycle](agent-ready-capability-pack-and-agentbundle-lifecycle.md)
- [ARS-EXT-003 — Declarative manifests and host-known
  renderers](declarative-manifests-and-host-known-renderers.md)

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
