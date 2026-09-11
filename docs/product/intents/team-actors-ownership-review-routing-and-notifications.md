# ARS-SCALE-001 — Team actors, ownership, review routing, and notifications

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-SCALE-001
- **Slug:** `team-actors-ownership-review-routing-and-notifications`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-009, ARS-CAP-003
- **Initiative:** INI-008 — Collaboration, Security, Integrations, and Outcomes
- **Horizon:** Later

## Outcome

Teams can assign ownership, decision authority, reviewers, and notifications
based on artifact type, initiative, risk, and blocked downstream work.

## Opportunity

A single-operator workspace does not need routing. A team does, and
retrofitting it is expensive because ownership and authority touch every
decision the product records.

## Boundary

- Expands the local product's trust and operating model; it needs separate
  governance before it is shaped.
- Notification is about decisions needed, not activity that occurred.
- Does not imply cloud sync; routing and sync are separable questions.
- Actor and decision-authority modelling is independently verifiable from
  decision routing and notification; whether they are one capability is
  undecided.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- The ARS-CORE-001 actor kernel can be extended to team actors without a
  migration of existing decisions.
- Routing rules can be expressed over artifact type, initiative, risk, and
  downstream impact without a rules engine.
- Teams want fewer notifications than they ask for.

## Unresolved questions

1. Who has authority to change routing rules, and is that itself an
   attributable decision?
2. What happens to work routed to a person who is unavailable or has left?
3. Can a workspace have team actors without any synchronization between
   machines?
4. Is decision authority per artifact type, per initiative, or per individual
   artifact?
5. Which comes first: actor and decision-authority modelling, or decision
   routing and notification?

## Projection

- **Initiative ID:** INI-008
- **Initiative name:** Collaboration, Security, Integrations, and Outcomes
- **Horizon:** Later
- **Candidate dependencies:** ARS-CORE-001 for the actor kernel; ARS-SCALE-004
  if routing requires shared state
- **Recommended next shaping:** Governance decision on expanding the trust
  model, then `frame-intent`.

## Related intents

- [ARS-CORE-001 — Workspace and actor kernel](workspace-and-actor-kernel.md)
- [ARS-UX-001 — Review Inbox](review-inbox.md)

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
