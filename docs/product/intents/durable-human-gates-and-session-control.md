# ARS-RUN-006 — Durable human gates and session control

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-RUN-006
- **Slug:** `durable-human-gates-and-session-control`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-003, ARS-CAP-007
- **Initiative:** INI-007 — Headless Execution and Delivery Runtime
- **Horizon:** Next

## Outcome

Long-running work can pause at a durable gate, survive restart, receive a
human decision, resume the appropriate session, and support steering,
interruption, cancellation, and explicit termination.

## Opportunity

A gate that does not survive a restart is not a gate; it is a prompt. Work
that cannot be steered or stopped forces the user to choose between watching
it and trusting it.

## Boundary

- A gate is a durable decision point, not a modal dialog.
- This capability owns the user's termination request and durable control
  state. ARS-RUN-007 owns the no-orphan execution guarantee as a fulfilment
  dependency.
- Does not define what a gate asks; that comes from the workflow or review
  model.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Gate state belongs to the Studio service rather than to any executor
  session.
- Resumption can reattach to a provider session, or restart deterministically
  from the gate, and which one is available differs by provider.
- Steering mid-run is genuinely wanted, rather than a feature that sounds
  useful and is never used.

## Unresolved questions

1. What happens to a gate whose deciding context has expired — the provider
   session, the branch, or the input revisions?
2. Is steering a new input packet, a message into a live session, or both?
3. How long may work sit at a gate before the product treats it as abandoned?
4. What is the difference in guarantees between cancellation and explicit
   termination?

## Projection

- **Initiative ID:** INI-007
- **Initiative name:** Headless Execution and Delivery Runtime
- **Horizon:** Next
- **Candidate dependencies:** ARS-RUN-001 for the broker; ARS-UX-007 for
  observable state
- **Recommended next shaping:** `frame-intent`; de-risk resumption semantics
  against a real provider before committing to them.

## Related intents

- [ARS-UX-007 — Observable long-running
  execution](observable-long-running-execution.md)
- [ARS-RUN-007 — Liveness, normalized events, crash recovery, and process
  cleanup](liveness-normalized-events-crash-recovery-and-process-cleanup.md)

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
