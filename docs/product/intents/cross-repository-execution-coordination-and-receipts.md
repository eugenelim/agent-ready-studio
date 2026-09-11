# ARS-RUN-012 — Cross-repository execution coordination and receipts

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-RUN-012
- **Slug:** `cross-repository-execution-coordination-and-receipts`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-009, ARS-CAP-007
- **Initiative:** INI-007 — Headless Execution and Delivery Runtime
- **Horizon:** Later

## Outcome

Studio can coordinate work spanning multiple repositories and rely on reviewed
completion receipts rather than assuming a remote dependency is complete.

## Opportunity

Cross-repository work fails at the seam. A dependency believed complete but
never verified can break after the work depending on it has already shipped.

## Boundary

- A receipt is reviewed evidence, never an inference from remote status.
- Studio coordinates; each repository's own gates remain authoritative.
- Does not synchronize or merge repositories.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- The existing coordination-receipt contract is sufficient and Studio should
  consume it rather than define a second one.
- Coordination across a small number of repositories covers the realistic
  cases.
- A stale or conflicted receipt is better surfaced than resolved
  automatically.

## Unresolved questions

1. Who produces a receipt, and what makes their review authoritative to the
   depending repository?
2. What does Studio do when a receipt's pinned revision no longer exists
   remotely?
3. Can Studio dispatch into a repository to satisfy a dependency, and under
   whose authority?
4. How is a coordination deadlock across repositories detected and surfaced?

## Projection

- **Initiative ID:** INI-007
- **Initiative name:** Headless Execution and Delivery Runtime
- **Horizon:** Later
- **Candidate dependencies:** ARS-REPO-007 for multi-repository projection;
  ARS-RUN-005 for dispatch
- **Recommended next shaping:** `frame-intent` after single-repository
  dispatch is proven.

## Related intents

- [ARS-REPO-007 — Multi-repository overview and cross-repository
  dependencies](multi-repository-overview-and-cross-repository-dependencies.md)
- [ARS-SHAPE-008 — Cross-repository shaping
  control](cross-repository-shaping-control.md)

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
