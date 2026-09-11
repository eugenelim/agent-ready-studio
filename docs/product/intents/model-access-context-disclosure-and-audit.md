# ARS-SCALE-003 — Model access, context disclosure, and audit

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-SCALE-003
- **Slug:** `model-access-context-disclosure-and-audit`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-009, ARS-CAP-007
- **Initiative:** INI-008 — Collaboration, Security, Integrations, and Outcomes
- **Horizon:** Later

## Outcome

An organization can audit which model or executor received which exact
context, under which policy, for which artifact revision and decision.

## Opportunity

Organizations adopting agent-assisted product work are asked this question by
their own security and legal functions before adoption, not after. Without an
answer, the conversation ends.

## Boundary

- Audit is organizational and retrospective; run-time permission is
  ARS-RUN-009.
- Does not certify compliance with any particular framework.
- The audit record itself is sensitive and falls under ARS-SCALE-002.
- The outcome's exact-context promise and the open question about digesting
  cannot both stand; resolving it decides whether exact disclosed content is a
  required audit input or the promise weakens to an integrity-verifiable
  record.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- The per-run disclosure record from ARS-RUN-009 is the right primitive, and
  this capability aggregates and queries it.
- Policy at organization scope can be expressed and enforced separately from
  per-run permission.
- Auditors need to query by artifact, by decision, and by model, not only by
  run.

## Unresolved questions

1. How long is the audit record retained, and who may delete it?
2. Does the record include the exact content disclosed, a digest of it, or
   both, and does that make exact disclosed content a required audit input or
   weaken the promise to an integrity-verifiable record?
3. What is claimed about context a provider retained on its side, and can
   anything be claimed honestly?
4. Who is the audience — an internal security function, an external auditor,
   or both?

## Projection

- **Initiative ID:** INI-008
- **Initiative name:** Collaboration, Security, Integrations, and Outcomes
- **Horizon:** Later
- **Candidate dependencies:** ARS-RUN-009 for per-run disclosure records;
  ARS-SCALE-002 for protecting the audit record
- **Recommended next shaping:** Security review; shape jointly with
  ARS-RUN-009 so the run record is queryable by construction.

## Related intents

- [ARS-RUN-009 — Operational permissions, sandboxing, and context-disclosure
  audit](operational-permissions-sandboxing-and-context-disclosure-audit.md)
- [ARS-SCALE-002 — Artifact-level permissions and sensitive-data
  controls](artifact-level-permissions-and-sensitive-data-controls.md)

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
