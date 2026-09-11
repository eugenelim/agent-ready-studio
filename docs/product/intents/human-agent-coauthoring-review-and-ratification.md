# ARS-SHAPE-005 — Human-agent coauthoring, review, and ratification

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-SHAPE-005
- **Slug:** `human-agent-coauthoring-review-and-ratification`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-003, ARS-CAP-005
- **Initiative:** INI-005 — Studio Shaping Workbench
- **Horizon:** Next

## Outcome

Humans and agents can contribute revisions to the same artifact lineage with
every contribution attributable to its own actor, and any approved policy
governs only advancement short of acceptance.

## Opportunity

Today an agent's output is either accepted wholesale or discarded. A shared
lineage lets a human take part of a proposal, revise it, and have both
contributions attributed without either party owning the artifact outright.

## Boundary

- Agent contributions are proposals. Acceptance is governed by principle 2 of
  [the charter](../../CHARTER.md), which owns that rule. A policy may route
  work, request review, or advance work between non-accepted states; it may
  never accept an agent contribution.
- Attribution distinguishes human from system actors and never blurs them.
- Does not grant an agent authority to decide, route, or dispatch.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- One lineage with mixed-actor revisions is more useful than parallel human
  and agent branches.
- The ARS-CORE-005 decision model extends to coauthoring without a separate
  approval concept.
- Humans will more often revise an agent proposal than accept or reject it
  whole.

## Unresolved questions

1. When a human edits an agent proposal, what is the resulting attribution —
   joint, human, or a linked pair of revisions?
2. Can an agent respond to a revision request automatically, and does that
   need its own policy?
3. What prevents an agent from appearing to ratify its own work through a
   chain of contributions?
4. How is an agent's confidence or uncertainty represented, if at all, without
   inventing evidence?
5. Which advancement transitions short of acceptance may a policy govern for
   a mixed-actor lineage, and does ARS-CORE-005 own that rule rather than this
   intent?

## Projection

- **Initiative ID:** INI-005
- **Initiative name:** Studio Shaping Workbench
- **Horizon:** Next
- **Candidate dependencies:** ARS-CORE-005 for decisions; ARS-CORE-001 for
  actor attribution
- **Recommended next shaping:** `frame-intent`, with a security and governance
  review of the advancement-policy escape hatch.

## Related intents

- [ARS-CORE-005 — Reviews, comments, decisions, and advancement
  policies](reviews-comments-decisions-and-advancement-policies.md)
- [ARS-RUN-011 — Multi-executor comparison and
  synthesis](multi-executor-comparison-and-synthesis.md)

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
