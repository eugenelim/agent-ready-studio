# ARS-UX-007 — Observable long-running execution

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-UX-007
- **Slug:** `observable-long-running-execution`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-002, ARS-CAP-007
- **Initiative:** INI-002 — Artifact-First Work Experience
- **Horizon:** Now

## Outcome

A person can distinguish queued, running, stalled, failed, waiting, and
completed work and can recover after process or application restart.

## Opportunity

The shipped walking skeleton executes a transformation as a single atomic
transaction: it either commits with its proposal, review, and events, or
writes nothing. There is no state between those two, so a run killed
mid-flight leaves no trace. That is correct for a deterministic in-process
call and wrong for anything slower.

## Boundary

- Observability of a run, not control of it. Steering, interruption, and
  cancellation are ARS-RUN-006.
- Does not require a real provider; the states must be meaningful for the
  deterministic executor too.
- Execution diagnostics remain secondary to the artifact and its decision.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- The captured state set — queued, running, stalled, failed, waiting,
  completed — is close enough to build on and will be refined during shaping.
- Distinguishing stalled from running requires a liveness signal the run
  itself cannot forge; that is ARS-RUN-007.
- Restart recovery belongs to the local service rather than to any executor.

## Unresolved questions

1. What evidence makes a run stalled rather than slow, and who decides the
   threshold?
2. What does the product show for a run whose process died before writing any
   event?
3. Does an in-process deterministic transformation get the same state machine,
   or a degenerate case of it?
4. Should amendment 0004's removed Home Running group return as it was, or be
   reshaped against the fuller state set?
5. Are distinguishing run states and recovering after restart one capability
   or two, given each is independently verifiable?

## Projection

- **Initiative ID:** INI-002
- **Initiative name:** Artifact-First Work Experience
- **Horizon:** Now
- **Candidate dependencies:** ARS-CORE-006 for restart-safe service state;
  ARS-RUN-007 for liveness evidence
- **Recommended next shaping:** `de-risk-intent` the stalled-versus-slow
  liveness distinction and decide whether state visibility and restart
  recovery are one capability or two; use that result to continue or replace
  the existing Draft delivery brief.

## Related intents

- [ARS-RUN-007 — Liveness, normalized events, crash recovery, and process
  cleanup](liveness-normalized-events-crash-recovery-and-process-cleanup.md)
- [ARS-RUN-006 — Durable human gates and session
  control](durable-human-gates-and-session-control.md)
- The existing Draft delivery brief [Observable
  execution](../briefs/observable-execution.md) holds the current problem
  statement and amendment 0004 context for this capability.

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
