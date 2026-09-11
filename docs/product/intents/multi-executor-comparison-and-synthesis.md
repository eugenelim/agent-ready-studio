# ARS-RUN-011 — Multi-executor comparison and synthesis

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-RUN-011
- **Slug:** `multi-executor-comparison-and-synthesis`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-008, ARS-CAP-005
- **Initiative:** INI-007 — Headless Execution and Delivery Runtime
- **Horizon:** Later

## Outcome

Teams can compare Claude, Codex, human, or other executor outputs at the
artifact level and choose, combine, or adjudicate proposals without comparing
raw transcripts.

## Opportunity

Running the same work through more than one executor is already common
practice done badly: the comparison happens in a person's head, across two
terminal windows, and produces no record.

## Boundary

- This capability produces attributable, comparable review packages from
  multiple executions. Comparison, synthesis, and adjudication interaction
  belong to ARS-UX-008; transcript comparison is explicitly not the product.
- Review packages preserve attribution and do not produce an automatic merge.
- Does not rank executors or claim one is better; it presents their outputs.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Normalized review packages make outputs comparable even when the executors
  differ substantially.
- Synthesis produces a new proposal rather than silently blending accepted
  state.
- Human output belongs in the comparison on equal terms with agent output.

## Unresolved questions

1. What is compared when two executors produce structurally different
   artifacts for the same work?
2. Is synthesis a human act, an executor act, or either — and does attribution
   differ?
3. What is the cost model when running the same work several times becomes
   routine?
4. Does comparison need the semantic diffs from ARS-UX-005, or can it work
   without them?

## Projection

- **Initiative ID:** INI-007
- **Initiative name:** Headless Execution and Delivery Runtime
- **Horizon:** Later
- **Candidate dependencies:** ARS-RUN-002 for multiple executors; ARS-UX-005
  for semantic comparison
- **Recommended next shaping:** `frame-intent` after two executors exist;
  comparison is meaningless with one.

## Related intents

- [ARS-UX-008 — Alternative comparison, synthesis, and typed visual
  canvases](alternative-comparison-synthesis-and-typed-visual-canvases.md)
- [ARS-UX-005 — Semantic diffs, annotations, patches, and revision
  requests](semantic-diffs-annotations-patches-and-revision-requests.md)

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
