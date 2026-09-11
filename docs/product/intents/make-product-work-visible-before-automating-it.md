# ARS-STRATEGY-001 — Make product work visible before automating it

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-STRATEGY-001
- **Slug:** `make-product-work-visible-before-automating-it`
- **Level:** product-strategy
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-VISION-001 — Agent-Ready Studio product
  vision](agent-ready-studio-product-vision.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-001 through ARS-CAP-010

## Diagnosis

Agent sessions, repositories, documents, research tools, and design tools
expose fragments of work but do not provide a coherent artifact-and-decision
view across product disciplines. A person can see a transcript, a diff, or a
document, and still cannot answer what was decided, on what evidence, by whom,
and what should happen next.

## Guiding policy

Begin with a local artifact-first workspace, then make Agent-Ready repository
state visible, then let users shape work from that visible state, and only then
add governed headless execution and deeper automation.

## Coherent actions

1. Preserve the manual and non-agent-ready product path.
2. Add a read-only repository and workspace-status pane of glass.
3. Let a user open and shape a repository intent inside Studio.
4. Harden Agent-Ready Repo's headless contracts for Studio control.
5. Add build execution, worktrees, gates, and external adapters.
6. Expand into multidisciplinary artifact experiences and team scale.

## Outcome

Studio earns the right to automate product work by first making that work
visible, reviewable, and attributable, so every automation step added later
lands in a model that can already explain itself.

## Boundary

- This strategy orders shaping, not delivery commitments. The order is a
  recommendation; it is not encoded as hard workspace dependencies.
- It does not authorize provider dispatch, repository writes, or credential
  handling ahead of their own shaping and gates.
- It does not reopen shipped foundation work.

## Assumptions

Captured from the shaping conversation. None carries customer, usage, market,
or technical validation.

- Visibility into an existing Agent-Ready repository is cheaper to build and
  easier to validate than execution control over it.
- A read-only pane of glass produces enough user value to justify itself before
  any write-back exists.
- Agent-Ready Repo's headless surfaces will be extendable on the timeline
  Studio needs; today they are stronger for ready build work than for shaping
  work.

## Unresolved questions

1. Is read-only repository visibility genuinely valuable on its own, or only as
   scaffolding for shaping and execution?
2. Which repository does the first real pane of glass have to serve well, and
   who is its first non-maintainer user?
3. What evidence would tell us this ordering is wrong and execution should come
   before shaping?
4. How much of the headless contract must Agent-Ready Repo own versus Studio
   inferring it?

## Projection

- **Level:** product-strategy
- **Children:** the eight initiative groups recorded in
  [the capability index](../capability-intents.md)
- **Horizon:** Now through Later
- **Recommended next shaping:** product-strategy review of the coherent-action
  ordering, then `de-risk-intent` on the Wave 1 steel thread.

## Owner

Agent-Ready Studio maintainers.

## Source

- Mode: chat-only at intake; repo-origin thereafter, matching this artifact's
  `workspace.toml` entry.
- Locator: none recorded. The source is a product-shaping conversation, not a
  retrievable locator, so there is nothing to pin or refresh.
- Revision: captured 2026-09-11
- Authority: transferred into this repository by the capture request that named
  `docs/product/intents/` as the destination. This file is now the authoritative
  record; the conversation confers no approval and no refresh authority.
