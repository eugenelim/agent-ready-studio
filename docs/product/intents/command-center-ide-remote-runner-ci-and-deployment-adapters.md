# ARS-RUN-010 — Command-center, IDE, remote runner, CI, and deployment adapters

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-RUN-010
- **Slug:** `command-center-ide-remote-runner-ci-and-deployment-adapters`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-009, ARS-CAP-007
- **Initiative:** INI-007 — Headless Execution and Delivery Runtime
- **Horizon:** Later

## Outcome

Users can descend into an expert command center or IDE, or delegate work to
remote and external systems, without losing Studio run identity, lineage,
reconciliation, and semantic review.

## Opportunity

Experts will leave Studio for a terminal or an IDE at the moment the work gets
hard. If leaving breaks the trace, the artifact-first model fails precisely on
the work that mattered most.

## Boundary

- Remote and deployment adapters are Later work and carry their own trust and
  governance requirements.
- Local expert-tool handoff, remote execution, CI, and deployment adapters
  are independently verifiable. The narrowest handoff that proves run-identity
  continuity comes first.
- Descending to a command center does not suspend attribution or
  reconciliation.
- Studio does not become a terminal emulator or an IDE.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Run identity can be carried across a handoff into an external tool and back.
- Reconciliation from ARS-RUN-008 is sufficient to re-establish what happened
  outside Studio.
- CI and deployment systems can report back in a form the normalized protocol
  accepts.

## Unresolved questions

1. What is the minimum that must survive a descent into an external tool for
   the trace to remain useful?
2. Does a remote runner require a different permission model than a local
   executor?
3. Which external system is worth adapting first, and what evidence supports
   that choice?
4. How is work that started outside Studio adopted into a run, if at all?
5. Which handoff is the narrowest one that proves run-identity continuity?

## Projection

- **Initiative ID:** INI-007
- **Initiative name:** Headless Execution and Delivery Runtime
- **Horizon:** Later
- **Candidate dependencies:** ARS-RUN-007 and ARS-RUN-008 for identity and
  reconciliation
- **Recommended next shaping:** `explore-options` on the descent boundary; do
  not shape remote adapters before local ones are proven.

## Related intents

- [ARS-RUN-008 — Filesystem and Git reconciliation with artifact
  discovery](filesystem-and-git-reconciliation-with-artifact-discovery.md)
- [ARS-SCALE-005 — External product-development integrations and portfolio
  views](external-product-development-integrations-and-portfolio-views.md)

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
