# ARS-RUN-001 — Execution broker and normalized worker protocol

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-RUN-001
- **Slug:** `execution-broker-and-normalized-worker-protocol`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-005, ARS-CAP-007
- **Initiative:** INI-007 — Headless Execution and Delivery Runtime
- **Horizon:** Next

## Outcome

Studio can send a structured execution packet to a compatible local or remote
executor and receive normalized status, artifacts, evidence, questions, gates,
and completion results.

## Opportunity

Without a broker, every executor integration reaches into the domain model and
leaves provider concepts behind. The broker is what keeps the executor
replaceable and the review surface stable.

## Boundary

- The broker normalizes; it does not interpret product meaning.
- Provider-specific event formats never become the Studio domain model.
- The first broker is scoped to compatible local executors. Remote semantic
  compatibility belongs to ARS-RUN-010 or a later protocol-extension
  capability.
- Does not grant permissions or disclose context by itself; that is
  ARS-RUN-009.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- One normalized protocol can serve deterministic, agent, human, and external
  executors without a lowest-common-denominator collapse.
- Status, artifacts, evidence, questions, gates, and results are the right six
  normalized channels.
- Local and remote executors differ in transport, not in protocol semantics.

## Unresolved questions

1. What does the broker do with executor output that has no normalized
   equivalent — drop it, quarantine it, or surface it as raw diagnostics?
2. Is the protocol versioned separately from the Studio service protocol?
3. Who owns retry and idempotency — the broker, the executor, or the caller?
4. How does the broker distinguish an executor that finished from one that
   stopped answering?
5. Do local and remote executors really differ only in transport?

## Projection

- **Initiative ID:** INI-007
- **Initiative name:** Headless Execution and Delivery Runtime
- **Horizon:** Next
- **Candidate dependencies:** ARS-UX-003 for packet and package shapes;
  ARS-CORE-006 for the service boundary
- **Recommended next shaping:** Architecture design pass; the protocol should
  be shaped against two real executors, not one.

## Related intents

- [ARS-UX-003 — Versioned input packets and normalized review
  packages](versioned-input-packets-and-normalized-review-packages.md)
- [ARS-RUN-002 — Claude and Codex headless
  executors](claude-and-codex-headless-executors.md)

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
