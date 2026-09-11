# ARS-SHAPE-001 — Open shaping work from workspace status

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-SHAPE-001
- **Slug:** `open-shaping-work-from-workspace-status`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-007, ARS-CAP-002
- **Initiative:** INI-005 — Studio Shaping Workbench
- **Horizon:** Next

## Outcome

A user can select an intent, research, strategy, or design item from a
repository's shaping queue and open the correct Studio work surface.

## Opportunity

A pane of glass that only lists work leaves the user where they started: they
can see the shaping queue and must still go elsewhere to act on it. Opening
the item in Studio is the first step that makes the view a workspace.

## Boundary

- Opening an item is not editing it. Editing is ARS-SHAPE-002.
- Consumes the routing result supplied by ARS-SHAPE-004. This capability only
  selects and opens an item, then produces an observable supported or
  unsupported result.
- Does not add items to a repository's shaping queue.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- A shaping-queue entry carries enough type information to select a work
  surface without opening the artifact first.
- The correct surface is determined by artifact type plus installed renderer,
  reusing ARS-UX-004 rather than a shaping-specific registry.
- Most shaping items open into a reading surface before anyone wants to edit
  them.

## Unresolved questions

1. What opens for an item whose type has no purpose-built surface — the
   generic fallback, or nothing?
2. Does opening a repository item create a local Studio artifact, or a view
   over the remote one?
3. How is an item that is blocked at the workspace level presented when
   opened?
4. Should Studio open items from inactive initiatives, and if so with what
   framing?

## Projection

- **Initiative ID:** INI-005
- **Initiative name:** Studio Shaping Workbench
- **Horizon:** Next
- **Candidate dependencies:** ARS-REPO-004 for the queue projection;
  ARS-UX-004 for surfaces
- **Recommended next shaping:** `frame-intent` once ARS-REPO-004 exists; this
  is the Wave 2 entry point.

## Related intents

- [ARS-REPO-004 — Workspace status pane of
  glass](workspace-status-pane-of-glass.md)
- [ARS-SHAPE-002 — Capture and edit intent drafts in
  Studio](capture-and-edit-intent-drafts-in-studio.md)

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
