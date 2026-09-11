# ARS-RUN-003 — AgentBundle headless shaping and build adapter

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-RUN-003
- **Slug:** `agentbundle-headless-shaping-and-build-adapter`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-007, ARS-CAP-006
- **Initiative:** INI-007 — Headless Execution and Delivery Runtime
- **Horizon:** Next

## Outcome

Studio can use AgentBundle's installed workflows as a governed execution
environment for both upstream shaping and downstream delivery work.

## Opportunity

If installed workflows encode governance, Studio would not have to rebuild
their gates, review routing, safety boundaries, and lifecycle rules. Treating
them as an execution environment keeps those rules authoritative.

## Boundary

- Studio drives installed workflows; it does not replace or bypass their
  gates.
- The adapter must not require Studio to scrape an agent conversation to learn
  what happened.
- Does not install or modify a repository's bundle; that is ARS-EXT-005.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Installed workflows can be invoked headlessly with enough structured output
  to normalize.
- Governance encoded in the workflows is stronger than governance Studio would
  add around a raw provider.
- Shaping and build dispatch can share one adapter, differing in the workflow
  selected.

## Unresolved questions

1. Which installed workflows expose a supported headless entry point today,
   and which only appear to?
2. How does Studio observe a workflow's internal gate without owning its state
   machine?
3. What happens when a workflow requires an interactive decision Studio cannot
   present?
4. Is the adapter coupled to a bundle version, and how is that version
   negotiated?
5. Are shaping and build adaptation one adapter or two, given their support
   is asymmetric?

## Projection

- **Initiative ID:** INI-007
- **Initiative name:** Headless Execution and Delivery Runtime
- **Horizon:** Next
- **Candidate dependencies:** ARS-RUN-001 for the broker; ARS-RUN-004 for the
  contracts it depends on
- **Recommended next shaping:** Investigate the actual headless surfaces
  before shaping; ARS-RUN-004 may need to land first.

## Related intents

- [ARS-RUN-004 — Harden Agent-Ready Repo's headless contract for Studio
  control](harden-agent-ready-repo-headless-contract-for-studio-control.md)
- [ARS-EXT-005 — Agent-Ready Capability Pack and AgentBundle
  lifecycle](agent-ready-capability-pack-and-agentbundle-lifecycle.md)

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
