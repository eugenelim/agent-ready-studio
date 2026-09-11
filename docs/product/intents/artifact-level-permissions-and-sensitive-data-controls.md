# ARS-SCALE-002 — Artifact-level permissions and sensitive-data controls

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-SCALE-002
- **Slug:** `artifact-level-permissions-and-sensitive-data-controls`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-009, ARS-CAP-002
- **Initiative:** INI-008 — Collaboration, Security, Integrations, and Outcomes
- **Horizon:** Later

## Outcome

Research, strategy, customer, security, and operational artifacts can have
access controls and handling policies appropriate to their sensitivity.

## Opportunity

Research holds participant data, strategy holds unannounced decisions, and
security artifacts hold what an attacker would want. A product that treats all
of them identically cannot be used for any of them in a real organization.

## Boundary

- Handling policy is enforced by the product, not merely documented in the
  artifact.
- Does not attempt to classify sensitivity automatically.
- Prerequisite for real participant data under ARS-PD-003; that dependency is
  hard, not advisory.
- The outcome is unmet unless an authorized actor can assign a supported
  handling policy and covered access, export, disclosure, and deletion
  operations demonstrably enforce it.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Sensitivity is a property of an artifact and its type, not only of a
  workspace.
- Lineage and evidence navigation must respect permissions without revealing
  the existence of what it hides — or must deliberately decide not to.
- Retention and deletion obligations will arrive with sensitive data and
  cannot be deferred separately.

## Unresolved questions

1. What does a reviewer see when an artifact's lineage crosses into something
   they may not read?
2. Does a permission apply to a revision, an artifact, or a whole lineage?
3. How are exports, disclosures to executors, and local copies constrained by
   a handling policy?
4. Which regulatory obligations, if any, does the product commit to
   supporting?
5. Are artifact authorization and the disclosure, export, retention, and
   deletion lifecycle one capability or separately owned, given that the
   assumptions already extend into retention and deletion?

## Projection

- **Initiative ID:** INI-008
- **Initiative name:** Collaboration, Security, Integrations, and Outcomes
- **Horizon:** Later
- **Candidate dependencies:** ARS-SCALE-001 for team actors; ARS-CORE-004 for
  lineage traversal
- **Recommended next shaping:** Privacy and security review first; this gates
  real research data under ARS-PD-003.

## Related intents

- [ARS-PD-003 — Research workspace and evidence
  synthesis](research-workspace-and-evidence-synthesis.md)
- [ARS-SCALE-006 — Production outcome feedback, retention, export, and
  governance](production-outcome-feedback-retention-export-and-governance.md)

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
