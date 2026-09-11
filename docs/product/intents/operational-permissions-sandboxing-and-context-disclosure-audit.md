# ARS-RUN-009 — Operational permissions, sandboxing, and context-disclosure audit

> This is a capture seed, not a shaped or approved intent. Outcome,
> assumptions, boundaries, sequencing, and solution choices remain subject
> to later shaping.

- **Status:** Draft
- **ID:** ARS-RUN-009
- **Slug:** `operational-permissions-sandboxing-and-context-disclosure-audit`
- **Level:** capability
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** product-shaping conversation, captured 2026-09-11
- **Portfolio anchor:** ARS-CAP-003, ARS-CAP-009
- **Initiative:** INI-007 — Headless Execution and Delivery Runtime
- **Horizon:** Next

## Outcome

A reviewer can distinguish permission to perform an operation from approval of
the resulting product work and can inspect what repository paths, credentials,
network access, and context were disclosed to an executor.

## Opportunity

These two approvals are constantly conflated. Allowing a run to read a
directory is not endorsing what it produces, and an approval flow that treats
them as one thing trains users to approve without reading.

## Boundary

- Permission and product approval are separate records and are never collapsed
  into one action.
- Recording disclosure is necessary but not sufficient. Enforceable
  restriction, including denial and revocation, is required alongside it; an
  audit alone must never be treated as satisfying this capability.
- The disclosure record captures redacted credential identifiers, scopes,
  recipients, and access events. It must not capture or persist credential
  values or any other replayable secret.
- Does not define the credential store; that is ARS-REPO-009.

## Assumptions

Captured from the shaping conversation as candidate approaches. None is a
settled requirement, and none carries customer, usage, market, or technical
validation.

- What was disclosed to an executor can be recorded completely enough for the
  audit to be trustworthy.
- Sandboxing at the path and network level is achievable for local executors
  on the supported platforms.
- Users will accept a separate permission step if it is asked once per scope
  rather than once per operation.

## Unresolved questions

1. What is the unit of permission — a run, a scope, a session, or a repository
   connection?
2. Is a disclosure record complete if the executor summarized content before
   sending it onward?
3. How is a permission revoked, and what happens to work already in flight
   under it?
4. What is the minimum audit a security-conscious organization would accept
   here?
5. Are enforcement and audit one capability or two, and which must land
   first?

## Projection

- **Initiative ID:** INI-007
- **Initiative name:** Headless Execution and Delivery Runtime
- **Horizon:** Next
- **Candidate dependencies:** ARS-RUN-001 for the broker; ARS-REPO-002 for the
  trust boundary
- **Recommended next shaping:** Security review before shaping; no provider
  dispatch should ship ahead of this capability.

## Related intents

- [ARS-SCALE-003 — Model access, context disclosure, and
  audit](model-access-context-disclosure-and-audit.md)
- [ARS-REPO-009 — Installation, hidden-workspace mechanics, private
  repositories, and source
  authority](installation-hidden-workspace-mechanics-private-repositories-and-source-authority.md)

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
