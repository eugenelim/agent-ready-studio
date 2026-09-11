# ARS-RUN-007 — Liveness, normalized events, crash recovery, and process cleanup

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-RUN-007
- **Slug:** `liveness-normalized-events-crash-recovery-and-process-cleanup`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-004, ARS-CAP-007
- **Initiative:** INI-007 — Headless Execution and Delivery Runtime
- **Horizon:** Next

## Outcome

Studio can distinguish real running work from abandoned work, preserve a
useful event history, recover interrupted state, and terminate complete
process trees safely.

## Opportunity

Abandoned work that still looks alive is worse than visible failure: the user
waits, the queue stalls, and the diagnosis costs more than the run did.
Orphaned process trees turn that into a machine-level problem.

## Boundary

- Liveness is evidence-based, not self-reported by the run.
- Event history is a diagnostic record; it is never product truth. Product
  truth is the artifact.
- Liveness classification, event retention, crash recovery, and complete
  process-tree termination are independently verifiable. The smallest slice is
  one end-to-end local-run recovery outcome.
- Does not cover remote executors' process management; that is ARS-RUN-010.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- A liveness signal the run cannot forge is obtainable for local executors.
- Event history can be bounded and still useful for diagnosis.
- Complete process-tree termination is achievable on the supported platforms
  without leaving orphans.

## Unresolved questions

1. What is the liveness signal, and what does it cost to sample at a useful
   rate?
2. How much event history is retained, for how long, and who decides?
3. After a crash, what is reconstructed from events and what is simply lost?
4. Can a run be adopted by a restarted service, or must it always be
   restarted?
5. Which of liveness classification, event retention, crash recovery, and
   process-tree termination is required first?

## Projection

- **Initiative ID:** INI-007
- **Initiative name:** Headless Execution and Delivery Runtime
- **Horizon:** Next
- **Candidate dependencies:** ARS-UX-007 for the observable state set;
  ARS-CORE-006 for restart-safe service state
- **Recommended next shaping:** `frame-intent` jointly with ARS-UX-007; the
  stalled-versus-slow signal is the shared risk.

## Related intents

- [ARS-UX-007 — Observable long-running
  execution](observable-long-running-execution.md)
- [ARS-RUN-008 — Filesystem and Git reconciliation with artifact
  discovery](filesystem-and-git-reconciliation-with-artifact-discovery.md)

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
