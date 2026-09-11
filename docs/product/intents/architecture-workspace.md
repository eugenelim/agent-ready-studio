# ARS-PD-005 — Architecture workspace

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-PD-005
- **Slug:** `architecture-workspace`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-008, ARS-CAP-002
- **Initiative:** INI-003 — Multidisciplinary Product Development
- **Horizon:** Next

## Outcome

Architects can develop and review system context, components, data and
sequence flows, interfaces, quality attributes, ADRs, threat models, failure
modes, and migration plans.

## Opportunity

Architects need a reviewable workspace for system context, components, data
and sequence flows, interfaces, quality attributes, ADRs, threat models,
failure modes, and migration plans.

## Boundary

- Does not generate architecture from code, and does not claim a diagram
  matches a running system.
- Does not replace the repository's own ADR and reference-architecture
  conventions; it should project them.
- Locally created architecture artifacts are the core capability and remain
  useful with no repository connected. Projecting repository-held architecture
  documents is an optional integration path.
- Threat modelling here is design-time; runtime security controls are
  ARS-RUN-009 and ARS-SCALE-003.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- ADRs modelled as typed decision artifacts can coexist with a repository's
  file-based ADRs rather than competing with them.
- Quality attributes stated as reviewable criteria are more durable than the
  same words inside a design document.
- Failure modes and migration plans belong to the architecture artifact set
  rather than to delivery.
- Architecture decisions can drift from the delivery that implemented them and
  the quality attributes they were meant to protect.

## Unresolved questions

1. When a repository already owns ADRs on disk, is Studio a reader, a writer,
   or both?
2. What keeps an architecture model honest as the system changes — and should
   Studio claim it can?
3. Are threat models a distinct artifact type or a review lens over the
   others?
4. Which quality attributes can be checked against evidence rather than
   asserted?

## Projection

- **Initiative ID:** INI-003
- **Initiative name:** Multidisciplinary Product Development
- **Horizon:** Next
- **Candidate dependencies:** ARS-PD-001 for the initiative spine;
  ARS-REPO-004 only if it is confirmed to own architecture-document discovery
  and projection
- **Recommended next shaping:** architect discipline shaping; reconcile
  against this repository's own ADR and reference conventions first.

## Related intents

- [ARS-REPO-004 — Workspace status pane of
  glass](workspace-status-pane-of-glass.md)
- [ARS-PD-006 — Delivery workspace](delivery-workspace.md)

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
