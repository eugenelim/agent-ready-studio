# ARS-RUN-002 — Claude and Codex headless executors

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-RUN-002
- **Slug:** `claude-and-codex-headless-executors`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-007, ARS-CAP-005
- **Initiative:** INI-007 — Headless Execution and Delivery Runtime
- **Horizon:** Next

## Outcome

Studio can dispatch equivalent semantic work to Claude or Codex without
exposing provider-specific event formats as the Studio domain model.

## Opportunity

Two providers is the smallest number that could demonstrate executor
independence. The risk this capture assumes, without evidence, is that a
protocol shaped against one provider ends up shaped like that provider.

## Boundary

- Provider-independent domain semantics are preserved, while the selected
  executor and the context disclosed to it remain visible in review and audit
  records.
- Credential handling and disclosure controls are prerequisites from
  ARS-RUN-009, not part of this capability.
- Does not claim the two providers produce equivalent quality — only that
  Studio can address both semantically.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Both providers' headless modes expose enough structure to normalize without
  transcript scraping.
- Semantic equivalence of dispatched work is achievable even where provider
  capabilities differ.
- Provider-specific behaviour can be isolated in an adapter without leaking
  into review surfaces.

## Unresolved questions

1. What happens when a provider supports a capability the normalized protocol
   has no channel for?
2. How is a provider's refusal or policy block represented — as a failure, a
   gate, or a question?
3. Does the user choose the provider, or does routing choose it from declared
   capability?
4. What is the minimum evidence that the two adapters are genuinely
   interchangeable?

## Projection

- **Initiative ID:** INI-007
- **Initiative name:** Headless Execution and Delivery Runtime
- **Horizon:** Next
- **Candidate dependencies:** ARS-RUN-001 for the broker; ARS-RUN-009 for
  permissions and disclosure
- **Recommended next shaping:** `frame-intent` after the broker exists; add
  one provider, then the second, to test the abstraction.

## Related intents

- [ARS-RUN-001 — Execution broker and normalized worker
  protocol](execution-broker-and-normalized-worker-protocol.md)
- [ARS-RUN-011 — Multi-executor comparison and
  synthesis](multi-executor-comparison-and-synthesis.md)

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
