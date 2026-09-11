# ARS-CORE-004 — Relations, lineage, evidence, and source authority

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-CORE-004
- **Slug:** `relations-lineage-evidence-and-source-authority`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-002, ARS-CAP-004
- **Initiative:** INI-001 — Studio Foundation and Workspace Kernel
- **Horizon:** Now

## Outcome

A reviewer can determine which exact inputs, evidence, decisions, and source
revisions led to an artifact proposal.

## Opportunity

"Where did this come from?" is the question that distinguishes reviewable work
from a plausible document. Without recorded lineage a reviewer must either
trust the producer or redo the work, and neither scales across disciplines or
across agent and human authors.

## Boundary

- Lineage records what produced a revision. It does not assert that the inputs
  were correct, current, or sufficient.
- Does not define how lineage is navigated in the interface; that is
  ARS-UX-006.
- Does not cover external-source acquisition or refresh; that is ARS-REPO-002
  and ARS-SCALE-005 territory.
- Source authority applies only where an artifact mirrors an external source;
  it is not required for a local-only workspace.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Lineage is captured at revision granularity, pinning exact input revisions
  rather than artifact identities.
- Evidence is a typed relation rather than prose inside an artifact body, so
  it can be counted, filtered, and followed.
- Source authority — which side owns a field when a local artifact mirrors an
  external one — must be explicit, not inferred from freshness.

## Unresolved questions

1. Is there a bounded set of relation types, or is the set blueprint- and
   pack-extensible from the start?
2. How does lineage survive an input artifact being deleted, archived, or
   superseded?
3. When a human edits an agent proposal, is the result one revision with two
   contributors or two linked revisions?
4. What is the minimum evidence record that research synthesis in ARS-PD-003
   can build on without rework?
5. Does source authority belong with lineage at all, or should it be shaped
   separately?

## Projection

- **Initiative ID:** INI-001
- **Initiative name:** Studio Foundation and Workspace Kernel
- **Horizon:** Now
- **Candidate dependencies:** ARS-CORE-003 for the revision identities lineage
  pins
- **Recommended next shaping:** `frame-intent`, then a joint shaping pass with
  ARS-PD-003 so the evidence model serves research before it is fixed.

## Related intents

- [ARS-UX-006 — Evidence, lineage, and decision-history
  navigation](evidence-lineage-and-decision-history-navigation.md)
- [ARS-PD-003 — Research workspace and evidence
  synthesis](research-workspace-and-evidence-synthesis.md)

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
