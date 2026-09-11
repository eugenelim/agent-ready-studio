# ARS-RUN-004 — Harden Agent-Ready Repo's headless contract for Studio control

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-RUN-004
- **Slug:** `harden-agent-ready-repo-headless-contract-for-studio-control`
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

Agent-Ready Repo exposes stable machine-oriented workspace discovery, shaping
dispatch, build dispatch, gate handling, status observation, interruption, and
resumption contracts that do not require scraping an agent conversation.

## Opportunity

Current headless support is stronger for ready build work than for shaping
work. Studio-driven shaping needs an explicit supported contract rather than
an inferred prompt convention, and an inferred convention will break silently
on any upstream change.

## Boundary

- The outcome names work owned by Agent-Ready Repo's maintainers. This
  Studio-owned artifact records only Studio's dependency on that contract, its
  compatibility expectations, and its fallback decision. The upstream
  obligation needs an Agent-Ready Repo-owned artifact accepted by those
  maintainers before Studio can rely on it.
- Studio must not ship a workaround that becomes a de facto contract.
- Does not cover what Studio does with the contract; that is ARS-RUN-003 and
  INI-005.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- The gap is real and asymmetric: build dispatch is better served headlessly
  than shaping dispatch.
- A supported contract is achievable upstream on the timeline Studio needs.
- Discovery, dispatch, gates, status, interruption, and resumption are the
  right seven surfaces to request.

## Unresolved questions

1. What exactly is supported headlessly today for shaping, as opposed to what
   happens to work?
2. Who owns this contract, and what is the route to changing it?
3. What does Studio do in the interim — wait, or build against an inferred
   convention it knows is fragile?
4. Should the contract live in Agent-Ready Repo, in a shared contracts
   package, or in both with a version negotiation?
5. Who owns this artifact's outcome, and should it be split into a
   Studio-owned dependency intent and an upstream-owned contract intent?

## Projection

- **Initiative ID:** INI-007
- **Initiative name:** Headless Execution and Delivery Runtime
- **Horizon:** Next
- **Candidate dependencies:** Upstream agreement from Agent-Ready Repo
  maintainers
- **Recommended next shaping:** Investigate the current headless surfaces and
  record the gap precisely, then take it upstream before Studio shaping
  depends on it.

## Related intents

- [ARS-RUN-003 — AgentBundle headless shaping and build
  adapter](agentbundle-headless-shaping-and-build-adapter.md)
- [ARS-SHAPE-003 — Frame, de-risk, and decompose intent
  transformations](frame-de-risk-and-decompose-intent-transformations.md)

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
