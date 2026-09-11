# ARS-PD-003 — Research workspace and evidence synthesis

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-PD-003
- **Slug:** `research-workspace-and-evidence-synthesis`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-002, ARS-CAP-008
- **Initiative:** INI-003 — Multidisciplinary Product Development
- **Horizon:** Next

## Outcome

Researchers can manage questions, study plans, sources, observations, coding,
findings, contradictions, confidence, limitations, and synthesis with
traceability to primary evidence.

## Opportunity

Research findings travel as summaries. Source separation prevents reliable
provenance checks, re-weighting when a source is discredited, and
reconstruction of how a finding was derived.

## Boundary

- Does not assign confidence automatically; confidence is a researcher's
  recorded judgment with its basis.
- Not a participant-recruitment, scheduling, or transcription product.
- Sensitive participant data handling is ARS-SCALE-002 and must be shaped
  before real research data lands here.
- This capability remains useful with public, synthetic, consent-safe, or
  repository-local evidence. Sensitive primary-research handling is gated on
  ARS-SCALE-002.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- The evidence relation from ARS-CORE-004 can carry research provenance
  without a parallel model.
- Contradiction between findings is a first-class recordable state rather than
  something resolved by overwriting.
- A synthesis artifact can stay traceable to primary observations without
  forcing researchers to re-enter their coding.

## Unresolved questions

1. What is the smallest evidence unit — a source, a passage, an observation,
   or a coded excerpt?
2. How is confidence expressed so it stays comparable across studies and
   researchers?
3. What happens to a downstream finding when a source is retracted or a
   participant withdraws consent?
4. Does desk research and primary research share one model, or do they diverge
   at the source level?
5. Where is the line between the viable core evidence slice and sensitive
   primary-research handling?

## Projection

- **Initiative ID:** INI-003
- **Initiative name:** Multidisciplinary Product Development
- **Horizon:** Next
- **Candidate dependencies:** ARS-CORE-004 for evidence relations;
  ARS-SCALE-002 before real participant data
- **Recommended next shaping:** desk-research discipline shaping jointly with
  ARS-CORE-004; a privacy review before any real study data.

## Related intents

- [ARS-CORE-004 — Relations, lineage, evidence, and source
  authority](relations-lineage-evidence-and-source-authority.md)
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
