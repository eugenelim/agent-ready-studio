# ARS-CORE-001 — Workspace and actor kernel

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-CORE-001
- **Slug:** `workspace-and-actor-kernel`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-001, ARS-CAP-003, ARS-CAP-004
- **Initiative:** INI-001 — Studio Foundation and Workspace Kernel
- **Horizon:** Now

## Outcome

A person can create and use a local workspace with attributable human and
system actors without connecting Git, AgentBundle, an agent provider, or a
cloud account.

## Opportunity

Every later capability attributes something to someone. Without a workspace
and actor identity that exists before any integration, attribution either
borrows a provider account or is invented at review time, and the local-first
promise becomes conditional on setup a team may never complete.

## Boundary

- Not an authentication or identity-provider capability. Local actors are
  records, not credentials.
- Does not cover multi-user or team actors; those sit in ARS-SCALE-001.
- The walking skeleton already ships workspace creation without external
  dependencies and attributable human actor records. This intent covers
  attributable system-actor records and the actor-record shape later team,
  audit, and permission capabilities need; whether either is genuinely unmet
  remains open. It does not rebuild shipped behaviour.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- A local actor record with a stable identifier and a human/system distinction
  is enough attribution for a single-operator workspace.
- Workspace creation with zero packs and zero credentials stays a hard product
  requirement rather than a first-release simplification.
- System actors (deterministic transformations, later executors) need the same
  attribution shape as human actors so review surfaces do not branch.

## Unresolved questions

1. What is the minimum actor record that later team, audit, and permission
   capabilities can extend without a migration?
2. Should a workspace be able to exist without any human actor at all, or is
   one human actor a creation-time invariant?
3. When a local actor is later linked to a repository or provider identity,
   which record is authoritative?
4. Does a single machine ever hold more than one workspace, and if so what is
   shared between them?
5. Is attributable system-actor attribution actually missing today, and if it
   is not, does this intent have any remaining scope?

## Projection

- **Initiative ID:** INI-001
- **Initiative name:** Studio Foundation and Workspace Kernel
- **Horizon:** Now
- **Candidate dependencies:** No dependency identified; several capabilities
  name this kernel as a candidate dependency, which is not the same as every
  intent assuming it
- **Recommended next shaping:** `frame-intent` at capability altitude, then an
  architecture pass on actor identity before ARS-SCALE-001 or ARS-SCALE-003 is
  shaped.

## Related intents

- [ARS-CORE-006 — Local Studio Service, persistence, protocol, and source
  adapters](local-studio-service-persistence-protocol-and-source-adapters.md)
- [ARS-SCALE-001 — Team actors, ownership, review routing, and
  notifications](team-actors-ownership-review-routing-and-notifications.md)

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
