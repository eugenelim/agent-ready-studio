# ADR-0005: Studio authority model: Five distinct planes

- **Status:** Accepted
- **Date:** 2026-09-12
- **Areas:** security, architecture
- **Reversibility:** low
- **Decision-makers:** Agent-Ready Studio maintainers
- **Supersedes:** none
- **Supersedes in part:** none
- **Superseded by:** none
- **Superseded in part:** none
- **Related:** RFC-0001, ADR-0001, ADR-0002, `docs/architecture/reference.md`

## Context

Agent-Ready Studio's reviewed portfolio is 64 Draft capability intents across
eight initiatives. Those intents cross several different kinds of authority:
who owns accepted product state, who decides that a run happens and where, who
performs the mechanics of running it, who defines what a transformation means,
and who supplies the bytes being worked on.

The normative [reference architecture](../architecture/reference.md) names two
application roles — an Electron client and a standalone Studio Service — and
routes renderer access through the Studio Service boundary. It has no
vocabulary for separating those authorities, because nothing implemented today
handles untrusted repository content or supervises an executor process.

Without that vocabulary, each proposal describes authority in whatever terms
are nearest to hand: a component name, a package boundary, or a wire protocol.
Each conflates distinct concerns. A component name states where code lives, not
what it may decide. A protocol such as MCP, A2A, or JSON-RPC states how two
parties talk, not who owns the fact exchanged. The consequence is already
observable: RFC-0001 enumerates six separately reviewed intents that touch
execution — materialization, reconciliation, process supervision, sandboxing,
worktrees, and proposals — spanning more than one initiative and three
horizons. Whichever is shaped first answers "which process owns the working
tree" by accident.

RFC-0001 was accepted on 2026-09-11 and settles this. This record captures its
Stage 1 outcome; the RFC carries the argument.

## Decision

> We adopt Product, Control, Execution, Capability, and Source as the
> architecture vocabulary for Agent-Ready Studio, and as the test that
> separates authority.

- **D1:** Product, Control, Execution, Capability, and Source are the architecture
  vocabulary for Agent-Ready Studio, and the test that separates authority.
- **D2:** Each authority in the system belongs to exactly one plane. A plane is
  never co-owned.

| Plane | Owns | Implemented today by |
| --- | --- | --- |
| Product | Workspaces, typed artifacts, immutable revisions, evidence and lineage, reviews, decisions, accepted state | `apps/studio-service` domain and use-case modules, surfaced by `apps/desktop` |
| Control | Source registrations, durable run records, scheduling, claims and leases, durable human gates, advancement policies, runtime selection, credential references | Nothing. Proposed owner is `apps/studio-service` |
| Execution | Source materialization, temporary clones, executor supervision, tool hosting, environment policy, filesystem and Git reconciliation, checkpoints, proposal production | Nothing. `packages/executor-fake` is a deterministic in-process test double, not an execution-plane component |
| Capability | Workspace Blueprints, Capability Packs, transformation definitions, executor requirements, review semantics | `packages/workspace-sdk`, `packages/blueprint-product-development` |
| Source | Studio-managed content, local folders, Git checkouts and URLs, managed clones, archives, external artifact systems, and each one's identity and revision | Nothing. No source registry or source adapter exists |

Three boundaries bound this decision.

- **D3:** A plane identifies semantic authority, not a process, package,
  deployment, or repository. One component may implement more than one plane.
  Today `apps/studio-service` implements the Product plane and is the proposed
  owner of the Control plane.
- **D4:** The vocabulary applies to current and future architecture reasoning,
  not only to work still to be shaped. An existing component is describable in
  these terms today, as the table above does.
- **D5:** This decision does not assign the Execution plane to a separate
  Workspace Runtime process. RFC-0001's D1 — whether execution authority earns
  its own process boundary — remains gated on Connect and Orient having been
  *delivered*, and is deliberately not recorded here. `apps/workspace-runtime`
  does not exist and is not authorized by this record.

## Decision drivers

- Every authority needs exactly one owner, so two capabilities cannot each
  decide the same question differently.
- The vocabulary must be checkable against the existing portfolio rather than
  asserted.
- It must not presuppose a process split, because that split is untested.
- It must stay useful if that split is later falsified.

## Consequences

**Positive:**

- A proposal can be asked a concrete question: which plane owns this durable
  fact, and which owns this operation? An answer naming two planes for one
  fact is a defect a reviewer can see.
- The model is checkable now. Across RFC-0001's mapping of the 64 reviewed
  capabilities the most relevant plane is Product 24, Capability 15, Control
  14, Source 6, Execution 5 — every plane is used by something.
- It survives RFC-0001's D1 being withdrawn. The planes would then describe
  authorities inside fewer processes, which is a smaller claim but not a wrong
  one.

**Negative:**

- Three of the five planes have no implementing component today. The table
  records proposals and absences as such, but a reader who skims it can still
  mistake a proposed owner for an implemented one.
- A component implementing two planes gives the vocabulary no enforcement.
  Naming a boundary is not enforcing it.
- A plane split alone proves nothing about isolation. Isolation comes from
  process, filesystem, container, credential, and network boundaries; a plane
  boundary not backed by one of those is a naming convention.
- Source is the thinnest plane at 6 capabilities and is the first candidate if
  the model is ever simplified.

**Revisit if:** the vocabulary repeatedly produces ambiguous or duplicate
authority assignments instead of resolving them — a durable fact two planes
both plausibly own, or a plane no capability names as its most relevant owner.

## Confirmation

- **Mode:** reviewer-checked
- **Signal:** a new RFC, ADR, or specification introducing a durable fact or an
  operation names the plane that owns it, and no fact names two.
- **Owner:** Agent-Ready Studio maintainers

## Alternatives considered

- **Keep one undifferentiated Studio application and service model.** Rejected
  against the single-owner driver: the current model already sanctions
  service-side execution composition, so nothing in it refuses putting
  materialization and agent supervision inside the single writer of accepted
  product state. The first execution-touching capability shaped would settle
  that by default.
- **Define authority only through processes or deployables.** Rejected against
  the checkability driver: it can only describe components that exist, so it
  has nothing to say about authority questions that arrive before a component
  does — which is the ordering problem this decision addresses.
- **Let MCP, A2A, or JSON-RPC define the architecture.** Rejected against the
  single-owner driver: these are transport and interface roles, and an envelope
  is not a domain definition. Adopting one as the architecture makes the domain
  model a projection of whichever wire format arrived first.
- **Delay the vocabulary until a runtime is implemented.** Rejected against the
  no-presupposition driver: the vocabulary is an input to that implementation,
  not an output of it. Deferring means the implementation's implicit answer
  becomes the recorded one.

## References

- [RFC-0001](../rfc/0001-studio-authority-planes-and-workspace-runtime-boundary.md),
  Accepted 2026-09-11 — §Authority planes, §Acceptance sequencing, §Risks.
- [`post-acceptance-follow-ons.md`](../rfc/0001-notes/post-acceptance-follow-ons.md)
  item 1, which warrants this record and excludes RFC-0001's D1 from it.
