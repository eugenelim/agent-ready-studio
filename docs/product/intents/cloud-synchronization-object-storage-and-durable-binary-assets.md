# ARS-SCALE-004 — Cloud synchronization, object storage, and durable binary assets

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-SCALE-004
- **Slug:** `cloud-synchronization-object-storage-and-durable-binary-assets`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-009, ARS-CAP-004
- **Initiative:** INI-008 — Collaboration, Security, Integrations, and Outcomes
- **Horizon:** Later

## Outcome

Teams can synchronize work and retain recordings, datasets, images,
prototypes, and other large artifacts without forcing every asset into Git.

## Opportunity

Research recordings, design prototypes, and datasets are real product
artifacts and are hostile to Git. Without somewhere to put them, teams keep
them elsewhere, and the lineage that justified the whole model breaks.

## Boundary

- The local-first promise survives: a workspace must remain usable without
  synchronization.
- Introduces a remote trust and operating model that needs separate
  governance.
- Does not make cloud storage a prerequisite for any core capability.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Large binary assets can be referenced by artifacts rather than contained in
  them, without weakening lineage.
- Synchronization and object storage are separable capabilities that happen to
  arrive together.
- Conflict resolution on a synchronized artifact can reuse the
  proposal-and-decision model rather than a merge algorithm.

## Unresolved questions

1. What is the conflict model when two machines have both advanced the same
   artifact?
2. Who hosts the object storage, and can an organization supply its own?
3. What happens to a referenced asset that is deleted remotely but still cited
   by accepted work?
4. Does synchronization require an account, and what does that do to the
   local-first promise?
5. Should synchronization and durable asset storage be shaped and gated
   separately, given that the assumptions already call them separable?

## Projection

- **Initiative ID:** INI-008
- **Initiative name:** Collaboration, Security, Integrations, and Outcomes
- **Horizon:** Later
- **Candidate dependencies:** ARS-SCALE-002 for handling policies on stored
  assets
- **Recommended next shaping:** Governance decision on the remote operating
  model, then `explore-options` on sync topology.

## Related intents

- [ARS-CORE-003 — Typed artifacts, immutable revisions, and accepted
  state](typed-artifacts-immutable-revisions-and-accepted-state.md)
- [ARS-SCALE-001 — Team actors, ownership, review routing, and
  notifications](team-actors-ownership-review-routing-and-notifications.md)

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
