# ADR-0003: Artifact state: Immutable revisions and explicit decisions

- **Status:** Accepted
- **Date:** 2026-09-09
- **Areas:** data-model, governance
- **Reversibility:** low
- **Decision-makers:** Agent-Ready Studio maintainers
- **Supersedes:** none
- **Supersedes in part:** none
- **Superseded by:** none
- **Superseded in part:** none
- **Related:** `docs/architecture/reference.md`

## Context

Studio work is reviewed through artifacts, evidence, lineage, and decisions.
Executors may transform accepted inputs into proposals, but operational access
must never imply semantic authority. Reviewers need the accepted state and all
outstanding proposals to remain distinguishable and durable across restarts.

## Decision

> Artifacts have immutable revisions, proposals identify exact input revision
> IDs, and acceptance or workflow advancement requires an attributable human
> decision or a future recorded policy.

- **D1:** Artifacts have immutable revisions, proposals identify exact input
  revision IDs, and acceptance or workflow advancement requires an attributable
  human decision or a future recorded policy.
- **D2:** Revision status is Draft, Proposed, Accepted, Rejected, or Superseded.
- **D3:** Editing creates another revision.
- **D4:** Each artifact separately points to its current accepted revision.
- **D5:** Reviews and comments lead to persisted decisions; approval updates
  accepted state, while a revision request preserves the proposal and leaves it
  unaccepted.
- **D6:** Immutability applies to revision content and provenance.
- **D7:** Lifecycle changes are append-only state records projected as the
  revision's current status; accepting or superseding work never rewrites the
  revision row.
- **D8:** The lifecycle records, decision, review resolution, and
  accepted-revision pointer change atomically.

## Decision drivers

- Review and acceptance must be auditable.
- Lineage must identify the exact inputs that produced a proposal.
- Executors must not silently approve their own output.
- Accepted content must survive later proposals without in-place mutation.

## Consequences

**Positive:**

- Every accepted state has attributable decision evidence.
- Proposals, rejected work, and prior accepted revisions remain reviewable.
- Human editing and automated transformations use the same revision model.

**Negative:**

- Reads require projections for current accepted and outstanding proposal
  state.
- Storage grows with revision history and needs later retention policy.
- UI actions must make revision creation explicit.

**Revisit if:** observed scale requires archival tiers while preserving the
same immutable and attributable semantics.

## Confirmation

- **Mode:** architecture fitness test
- **Signal:** invariant and integration tests prove immutability, exact lineage,
  decision-gated acceptance, and persisted revision-request state.
- **Owner:** Agent-Ready Studio maintainers

## Alternatives considered

- In-place mutation loses history and exact review identity.
- Automatic executor acceptance merges operational and semantic authority.
- Treating raw run events as artifacts makes diagnostic mechanics the product
  model.
- Storing only the latest proposal prevents audit and revision comparison.
