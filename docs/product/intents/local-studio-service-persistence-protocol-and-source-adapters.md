# ARS-CORE-006 — Local Studio Service, persistence, protocol, and source adapters

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-CORE-006
- **Slug:** `local-studio-service-persistence-protocol-and-source-adapters`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-004, ARS-CAP-005
- **Initiative:** INI-001 — Studio Foundation and Workspace Kernel
- **Horizon:** Now

## Outcome

The Studio UI relies on a restart-safe local application service with a
versioned protocol and replaceable content-source boundaries rather than
renderer-owned state.

## Opportunity

Every capability that outlives a window — long-running execution, durable
gates, repository reading, crash recovery — requires state that is not in the
renderer. Establishing that boundary once is cheaper than retrofitting it
under each capability that needs it.

## Boundary

- The renderer receives only a narrow typed preload API; it does not import
  service, storage, or Electron modules.
- A content-source boundary is a read interface, not a licence to write to
  remote systems.
- Does not cover remote or multi-machine service topologies; those belong with
  ARS-SCALE-004 and ARS-RUN-010.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- A modular-monolith local service over a versioned, runtime-validated
  protocol remains the right shape as repository and execution sources are
  added.
- Content-source adapters can be introduced behind the existing storage and
  service interfaces without a protocol break.
- Restart safety of the service is a stronger guarantee than restart safety of
  any single executor.

## Unresolved questions

1. What is the protocol-versioning rule when a capability pack introduces new
   artifact types or transformations?
2. Do repository-backed sources sit behind the same content-source interface
   as local managed storage, or beside it?
3. How much of a repository projection may be cached locally before the cache
   becomes state the product must reconcile?
4. What is the supported recovery path when the local store and an external
   source disagree?
5. The outcome carries restart-safe local service, versioned protocol, and
   replaceable content-source boundaries as separately verifiable
   capabilities; which is the smallest slice that stands alone?

## Projection

- **Initiative ID:** INI-001
- **Initiative name:** Studio Foundation and Workspace Kernel
- **Horizon:** Now
- **Candidate dependencies:** ARS-CORE-003 and ARS-CORE-004 for what is
  persisted
- **Recommended next shaping:** Architecture design pass on the content-source
  boundary before ARS-REPO-001 selects a repository-reading approach.

## Related intents

- [ARS-REPO-001 — Read-only public GitHub repository
  connection](read-only-public-github-repository-connection.md)
- [ARS-UX-007 — Observable long-running
  execution](observable-long-running-execution.md)

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
