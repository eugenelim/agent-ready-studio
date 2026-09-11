# ARS-UX-004 — Artifact renderer and editor registry

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-UX-004
- **Slug:** `artifact-renderer-and-editor-registry`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-008, ARS-CAP-006
- **Initiative:** INI-002 — Artifact-First Work Experience
- **Horizon:** Next

## Outcome

Strategy, research, design, architecture, delivery, and release artifacts
receive purpose-built reading and editing experiences while preserving a
generic fallback.

## Opportunity

A research synthesis rendered as raw text is not reviewable as research. But a
product that only renders types it has purpose-built support for cannot accept
a new artifact type without a release.

## Boundary

- Renderers are host-known and declarative; the product does not load
  third-party executable code into privileged processes.
- The generic fallback is a permanent guarantee, not a gap to be closed.
- The outcome is not met when a core artifact type cannot expose its
  discipline-specific review structure through a registered reader, even
  though the generic fallback renders it.
- Spatial and canvas rendering is ARS-UX-008.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- A registry keyed on artifact type, with a declared capability contract, is
  enough to route rendering without executable extensions.
- Reading and editing experiences can share one registration rather than being
  separately registered.
- Most artifact types need a better reader before they need a better editor.

## Unresolved questions

1. What is the contract a renderer declares, and who validates it — the
   blueprint, the pack manifest, or the host?
2. When no purpose-built renderer exists, is the fallback read-only, and is
   that acceptable for a discipline's core artifact?
3. Can two packs register a renderer for the same type, and how is the
   conflict resolved?
4. Does an editor ever produce a revision directly, or always a proposal?
5. Is a reader-and-fallback registry viable on its own, with editing and its
   proposal semantics shaped separately?

## Projection

- **Initiative ID:** INI-002
- **Initiative name:** Artifact-First Work Experience
- **Horizon:** Next
- **Candidate dependencies:** ARS-EXT-003 for the manifest contract;
  ARS-CORE-003 for artifact typing
- **Recommended next shaping:** `frame-intent` with ARS-EXT-003, then a
  security pass on the host-known renderer boundary.

## Related intents

- [ARS-EXT-003 — Declarative manifests and host-known
  renderers](declarative-manifests-and-host-known-renderers.md)
- [ARS-UX-008 — Alternative comparison, synthesis, and typed visual
  canvases](alternative-comparison-synthesis-and-typed-visual-canvases.md)

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
