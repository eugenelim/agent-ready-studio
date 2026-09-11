# ARS-RUN-008 — Filesystem and Git reconciliation with artifact discovery

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-RUN-008
- **Slug:** `filesystem-and-git-reconciliation-with-artifact-discovery`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-002, ARS-CAP-007
- **Initiative:** INI-007 — Headless Execution and Delivery Runtime
- **Horizon:** Next

## Outcome

Studio can reconcile executor claims against actual files and Git state and
discover generated artifacts even when provider event streams are incomplete
or reordered.

## Opportunity

An executor's account of what it did is a claim. Treating it as fact makes the
review surface wrong in exactly the cases where review matters most.

## Boundary

- Filesystem and Git state are authoritative observations for working-tree and
  revision reconciliation only. Artifacts, lineage, and attributable decisions
  remain the authority for product meaning and acceptance.
- Reconciliation reports discrepancies; it does not silently pick a winner.
- Does not modify the repository to make reality match a claim.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Filesystem and Git state are cheap enough to inspect after a run to be the
  authority.
- Generated artifacts can be discovered by observed change rather than only by
  executor declaration.
- Event streams will be incomplete or reordered often enough that this is
  required, not optional.

## Unresolved questions

1. What is shown to a reviewer when the claim and the reconciliation disagree?
2. How are files changed outside the run — by a build step, a formatter, or
   the user — attributed?
3. Does discovery extend beyond the isolated workspace, and should it?
4. What is the cost of reconciliation on a large repository, and when is it
   run?

## Projection

- **Initiative ID:** INI-007
- **Initiative name:** Headless Execution and Delivery Runtime
- **Horizon:** Next
- **Candidate dependencies:** ARS-RUN-005 for isolated proposals
- **Recommended next shaping:** `frame-intent` alongside ARS-RUN-005;
  reconciliation should be designed with dispatch, not after it.

## Related intents

- [ARS-RUN-005 — Work-loop dispatch and isolated Git
  proposals](work-loop-dispatch-and-isolated-git-proposals.md)
- [ARS-CORE-004 — Relations, lineage, evidence, and source
  authority](relations-lineage-evidence-and-source-authority.md)

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
