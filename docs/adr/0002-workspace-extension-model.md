# ADR-0002: Workspace extension model: Blueprints, packs, and executors

- **Status:** Accepted
- **Date:** 2026-09-09
- **Areas:** extensibility, platform
- **Reversibility:** low
- **Decision-makers:** Agent-Ready Studio maintainers
- **Supersedes:** none
- **Supersedes in part:** none
- **Superseded by:** none
- **Superseded in part:** none
- **Related:** `docs/architecture/reference.md`

## Context

One Product Development workspace must progress from manual work to assisted
transformations and later agent-ready execution without becoming a different
workspace product. The initial experience remains opinionated across Strategy,
Research, Experience, Architecture, Delivery, Release, and Outcomes. Optional
execution capabilities must not contaminate the stable domain or load
third-party code into a privileged process.

## Decision

> Workspace Blueprints define versioned workspace semantics, declarative
> Capability Packs extend them, and executor-independent Transformations name
> eligible Executor Adapters.

- **D1:** Workspace Blueprints define versioned workspace semantics, declarative
  Capability Packs extend them, and executor-independent Transformations name
  eligible Executor Adapters.
- **D2:** Blueprint and pack manifests are closed, versioned, runtime-validated
  data.
- **D3:** Renderer and editor identifiers resolve only to host-known
  implementations.
- **D4:** Humans are valid executors from the first release.
- **D5:** The Agent-Ready Pack is a future optional capability, not a core
  dependency or implemented feature.

## Decision drivers

- A workspace must be useful before a team is agent-ready.
- Product semantics must remain stable across executor vendors.
- Extensions must not gain arbitrary privileged execution.
- The customer-facing Product Development experience must stay opinionated.

## Consequences

**Positive:**

- Manual, deterministic, agent, and external execution share one semantic work
  model.
- Capability growth does not require redefining the entire workspace.
- Declarative validation keeps privileged loading narrow and auditable.

**Negative:**

- Blueprint and pack versions need migration rules as the product grows.
- Host-known renderers require product releases for new privileged UI code.
- This boundary does not provide a general plugin marketplace.

**Revisit if:** a concrete third-party extension cannot be expressed safely as
validated declarations plus an out-of-process adapter.

## Confirmation

- **Mode:** reviewer-checked
- **Signal:** Product Development works with zero packs, and transformations
  remain independent of executor implementation names.
- **Owner:** Agent-Ready Studio maintainers

## Alternatives considered

- Making AgentBundle or an agent provider foundational fails manual-first
  adoption.
- Vendor-named workflow steps couple product semantics to execution mechanics.
- Arbitrary in-process TypeScript plugins violate the privileged extension
  boundary.
- A blank workspace builder abandons the opinionated product experience.
