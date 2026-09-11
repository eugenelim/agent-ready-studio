# ARS-UX-003 — Versioned input packets and normalized review packages

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-UX-003
- **Slug:** `versioned-input-packets-and-normalized-review-packages`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-002, ARS-CAP-005
- **Initiative:** INI-002 — Artifact-First Work Experience
- **Horizon:** Now

## Outcome

Every execution or human transformation starts from an inspectable, versioned
input packet and ends in a consistent review package.

## Opportunity

If each executor defines its own inputs and outputs, review has to learn a new
shape per executor, and nothing can be compared, replayed, or audited. A
stable packet at each end is what makes the executor replaceable.

## Boundary

- The packet records what was supplied. It is not a permission grant;
  disclosure auditing is ARS-RUN-009.
- Normalization does not flatten discipline-specific content into one schema;
  it standardizes the envelope.
- Does not define executor transport; that is ARS-RUN-001.
- The outcome is not met when two executors performing the same transformation
  produce review packages a reviewer must interpret differently.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- One envelope shape can serve deterministic, human, agent, and external
  executors.
- Input packets are versioned artifacts in their own right, not ephemeral
  request payloads.
- A review package can carry artifacts, evidence, questions, and gate results
  without the reviewer needing executor-specific knowledge.

## Unresolved questions

1. Is an input packet immutable once dispatched, and what happens when its
   source revisions move underneath a long run?
2. What does a review package contain when the transformation failed or was
   interrupted?
3. How much executor-specific detail may ride along before the envelope stops
   being normalized?
4. Should a human transformation produce the same package shape as an agent
   one, or an explicitly lighter one?
5. Are the input packet and review package one capability or two, and which is
   required first?

## Projection

- **Initiative ID:** INI-002
- **Initiative name:** Artifact-First Work Experience
- **Horizon:** Now
- **Candidate dependencies:** ARS-CORE-003 and ARS-CORE-004; ARS-RUN-001
  consumes this shape
- **Recommended next shaping:** `frame-intent`, then a contract-level
  architecture pass shared with ARS-RUN-001.

## Related intents

- [ARS-RUN-001 — Execution broker and normalized worker
  protocol](execution-broker-and-normalized-worker-protocol.md)
- [ARS-RUN-009 — Operational permissions, sandboxing, and context-disclosure
  audit](operational-permissions-sandboxing-and-context-disclosure-audit.md)

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
