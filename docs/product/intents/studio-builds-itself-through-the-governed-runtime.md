# ARS-RUN-013 — Studio builds itself through the governed runtime

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-RUN-013
- **Slug:** `studio-builds-itself-through-the-governed-runtime`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-007, ARS-CAP-003
- **Initiative:** INI-007 — Headless Execution and Delivery Runtime
- **Horizon:** Later

## Outcome

After the read-only and shaping contracts are proven, Studio can select an
accepted item from its own workspace, dispatch its build through the same
Runner and Agent-Ready controls offered to other repositories, review the
result in Studio, and make the merge decision there.

## Opportunity

Studio uses the governed runtime on its own repository under the same controls
offered to other repositories, then reviews the result and makes the merge
decision in Studio.

## Boundary

- Uses the same controls offered to any repository. A special maintainer path
  is outside this capability.
- Depends only on the minimum runtime capabilities it exercises and on
  ARS-REPO-009 write authority. The product-facing self-hosting outcome stays
  with ARS-SHAPE-007.
- A merge decision here is still a human decision subject to this repository's
  gates.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- By the time this is attempted, the read-only and shaping contracts will
  already have been proven separately.
- This repository's gates are strict enough that a bad proposal would be
  caught before merge.
- Dogfooding the full loop will find contract gaps that no fixture repository
  would.

## Unresolved questions

1. What is the first change safe enough to build this way, and who decides it
   is safe?
2. What happens if Studio breaks Studio — what is the recovery path?
3. Does using the product on itself bias its design toward this repository's
   shape?
4. Is a merge decision made in Studio acceptable to this repository's own
   review conventions?
5. Does this belong as an initiative validation milestone rather than a
   capability intent?

## Projection

- **Initiative ID:** INI-007
- **Initiative name:** Headless Execution and Delivery Runtime
- **Horizon:** Later
- **Candidate dependencies:** ARS-RUN-005, ARS-RUN-006, ARS-RUN-008,
  ARS-RUN-009; ARS-SHAPE-007 for the reading half
- **Recommended next shaping:** Do not shape until Waves 1 through 3 have
  produced evidence; this is the Wave 4 terminus.

## Related intents

- [ARS-SHAPE-007 — Studio self-hosting](studio-self-hosting.md)
- [ARS-RUN-005 — Work-loop dispatch and isolated Git
  proposals](work-loop-dispatch-and-isolated-git-proposals.md)

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
