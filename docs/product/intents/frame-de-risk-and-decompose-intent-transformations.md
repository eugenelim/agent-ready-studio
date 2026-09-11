# ARS-SHAPE-003 — Frame, de-risk, and decompose intent transformations

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-SHAPE-003
- **Slug:** `frame-de-risk-and-decompose-intent-transformations`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-005, ARS-CAP-003
- **Initiative:** INI-005 — Studio Shaping Workbench
- **Horizon:** Next

## Outcome

Studio can guide the recursive product-intent sequence from framing through
assumption testing and decomposition while preserving each review and human
decision.

## Opportunity

The shaping sequence already exists as skills. What it lacks is a surface
where each step's output is a reviewable artifact rather than a conversation
turn, so the reasoning survives the session that produced it.

## Boundary

- Studio hosts and records the sequence; it does not redefine the shaping
  method.
- Each step ends in an attributable human decision; none advances
  automatically.
- Framing, assumption testing, and decomposition are independently verifiable
  transformations. Whether they are one capability remains undecided.
- Does not dispatch build work; that is INI-007.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- The frame, de-risk, decompose sequence is recursive rather than linear, and
  a surface must support re-entering an earlier step without discarding later
  work.
- Each step's output maps onto the artifact and revision model without a
  shaping-specific store.
- The sequence is useful when performed by a human alone, with agent execution
  as an accelerant.

## Unresolved questions

1. What does Studio show when a de-risk step's kill condition is met — and
   does it have authority to stop anything?
2. How deep can decomposition recurse before the graph stops helping a reader?
3. Are the three steps separate transformations or one transformation with
   phases?
4. Which independently verifiable transformation — framing, assumption
   testing, or decomposition — is worth supporting first?

## Projection

- **Initiative ID:** INI-005
- **Initiative name:** Studio Shaping Workbench
- **Horizon:** Next
- **Candidate dependencies:** ARS-SHAPE-002 for intent artifacts; ARS-RUN-003
  for governed execution of the steps
- **Recommended next shaping:** `frame-intent`; sequence each step separately
  rather than shaping all three at once.

## Related intents

- [ARS-RUN-003 — AgentBundle headless shaping and build
  adapter](agentbundle-headless-shaping-and-build-adapter.md)
- [ARS-RUN-004 — Harden Agent-Ready Repo's headless contract for Studio
  control](harden-agent-ready-repo-headless-contract-for-studio-control.md)

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
