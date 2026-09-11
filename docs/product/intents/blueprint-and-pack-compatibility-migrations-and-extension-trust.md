# ARS-EXT-004 — Blueprint and pack compatibility, migrations, and extension trust

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-EXT-004
- **Slug:** `blueprint-and-pack-compatibility-migrations-and-extension-trust`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-006, ARS-CAP-009
- **Initiative:** INI-006 — Workspace Blueprints, Capability Packs, and AgentBundle Platform
- **Horizon:** Later

## Outcome

Workspaces can upgrade blueprint or pack versions without silent semantic
changes, data loss, or unrestricted extension access.

## Opportunity

Extensibility without a migration story produces workspaces that cannot be
upgraded, and extensibility without a trust story produces a product that
cannot be recommended. Both problems arrive together, on the first breaking
pack change.

## Boundary

- A migration that changes meaning requires an explicit human decision; it is
  never inferred.
- Extension trust is scoped per pack, not granted globally at install.
- Does not define a certification or signing programme; that would be a
  separate governance decision.
- Migration compatibility and extension trust are independently verifiable;
  whether they remain one capability is undecided.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Breaking blueprint and pack changes are rare enough that an explicit
  migration step is acceptable to users.
- Semantic change can be detected by comparing declared schemas rather than by
  inspecting data.
- Trust can be expressed as declared capability requirements a user approves,
  rather than as a binary install decision.

## Unresolved questions

1. What is a semantic change, precisely enough that tooling can refuse to
   apply one silently?
2. Can a workspace be pinned to an old pack version indefinitely, and what
   does the product owe it?
3. What does a user actually see when approving a pack's capability
   requirements, and will they read it?
4. Is rollback of a migration required, and what does it cost to guarantee?
5. Which is required first: migration compatibility or extension trust?

## Projection

- **Initiative ID:** INI-006
- **Initiative name:** Workspace Blueprints, Capability Packs, and AgentBundle
  Platform
- **Horizon:** Later
- **Candidate dependencies:** ARS-EXT-001, ARS-EXT-002, and ARS-EXT-003
- **Recommended next shaping:** `frame-intent` once real pack versions exist;
  shaping this ahead of a second pack version is speculative.

## Related intents

- [ARS-EXT-003 — Declarative manifests and host-known
  renderers](declarative-manifests-and-host-known-renderers.md)
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
