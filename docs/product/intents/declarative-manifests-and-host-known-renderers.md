# ARS-EXT-003 — Declarative manifests and host-known renderers

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-EXT-003
- **Slug:** `declarative-manifests-and-host-known-renderers`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-006, ARS-CAP-008
- **Initiative:** INI-006 — Workspace Blueprints, Capability Packs, and AgentBundle Platform
- **Horizon:** Next

## Outcome

Blueprint and pack authors can declare schemas, views, transformations, and
review models through validated manifests without injecting arbitrary code
into privileged Studio processes.

## Opportunity

Arbitrary plugin code expands Studio's privileged trust boundary. Runtime-
validated manifests constrain extension authority while retaining declarative
extensibility.

## Boundary

- Manifests are data, validated at a runtime boundary. They are never
  evaluated as code.
- Renderers are host-known: the host owns the implementations a manifest may
  select.
- Sandboxed extension workers, if ever needed, are a separate later question
  under ARS-EXT-004.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- A declarative manifest can express enough of a discipline's artifact and
  review model to be worth authoring.
- The set of host-known renderers can grow with the product faster than pack
  authors need new ones.
- Validation at the manifest boundary is cheaper to keep correct than
  sandboxing arbitrary code.
- A validated manifest provides enough extensibility at a materially lower
  trust cost than arbitrary plugin code.

## Unresolved questions

1. What is the first capability a pack author genuinely cannot express
   declaratively, and what does that imply?
2. How does a manifest declare a review model without becoming a workflow
   language?
3. Who validates a manifest, and what happens to a workspace when validation
   starts failing after an upgrade?
4. Is there any case where a host-known renderer set is too restrictive to be
   viable?

## Projection

- **Initiative ID:** INI-006
- **Initiative name:** Workspace Blueprints, Capability Packs, and AgentBundle
  Platform
- **Horizon:** Next
- **Candidate dependencies:** ARS-UX-004 for the renderer registry
- **Recommended next shaping:** `frame-intent` with a security review of the
  manifest boundary; this is the trust hinge of INI-006.

## Related intents

- [ARS-UX-004 — Artifact renderer and editor
  registry](artifact-renderer-and-editor-registry.md)
- [ARS-EXT-004 — Blueprint and pack compatibility, migrations, and extension
  trust](blueprint-and-pack-compatibility-migrations-and-extension-trust.md)

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
