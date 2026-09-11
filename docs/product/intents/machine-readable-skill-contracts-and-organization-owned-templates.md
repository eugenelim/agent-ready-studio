# ARS-EXT-006 — Machine-readable skill contracts and organization-owned templates

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-EXT-006
- **Slug:** `machine-readable-skill-contracts-and-organization-owned-templates`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-005, ARS-CAP-006
- **Initiative:** INI-006 — Workspace Blueprints, Capability Packs, and AgentBundle Platform
- **Horizon:** Next

## Outcome

Skills and organization-owned packs can declare accepted inputs, produced
artifacts, required capabilities, review policy, safety boundaries, and
eligible next transformations while non-agent-ready teams can still use
ordinary workspace templates.

## Opportunity

Installed skills already declare tools and safety boundaries in frontmatter,
but not the accepted inputs, produced artifacts, review policy, or eligible
next transformations that routing and applicability need.

## Boundary

- A declared contract is a claim about a skill, not a guarantee it behaves
  accordingly.
- In this intent, an organization-owned template is a reusable workspace
  template carried by an organization-owned capability pack. The title and
  outcome use "templates" and "packs" interchangeably; resolving the naming is
  part of shaping.
- Teams without agent-ready tooling can use ordinary templates to keep the
  core Product Development workspace useful; the contract is not a
  prerequisite for using Studio.
- Does not define the skills themselves.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- Inputs, outputs, required capabilities, review policy, safety boundaries,
  and next transformations are the right six declarations, and the installed
  skills' existing frontmatter is close enough to build on.
- Organization-owned templates carried by capability packs and skill contracts
  can share one declaration shape.
- Contracts can be added incrementally to existing skills rather than
  requiring a coordinated rewrite.

## Unresolved questions

1. Who verifies a declared contract against actual behaviour, and what happens
   when they diverge?
2. Is the contract owned by the skill, by the capability pack carrying an
   organization-owned template, or by an organization's overlay?
3. What does Studio do with a skill that declares no contract at all?
4. Does a safety-boundary declaration carry any enforcement weight, or is it
   documentation?
5. Do skill contracts and organization-owned templates carried by capability
   packs genuinely share one declaration shape and lifecycle?

## Projection

- **Initiative ID:** INI-006
- **Initiative name:** Workspace Blueprints, Capability Packs, and AgentBundle
  Platform
- **Horizon:** Next
- **Candidate dependencies:** ARS-EXT-003 for the manifest shape
- **Recommended next shaping:** `frame-intent` grounded in the installed
  skills' existing declarations and the relationship between templates and
  capability packs; ARS-SHAPE-004 and ARS-PD-008 are candidate consumers of
  the contract.

## Related intents

- [ARS-SHAPE-004 — Strategy, research, and experience-design
  routing](strategy-research-and-experience-design-routing.md)
- [ARS-PD-008 — Graph-based workflows and discipline-specific review
  models](graph-based-workflows-and-discipline-specific-review-models.md)

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
