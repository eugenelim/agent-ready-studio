# Delivery brief: Agent-Ready Studio

- **Status:** Ready
- **Slug:** `agent-ready-studio`
- **Received:** 2026-09-09
- **Owner:** Agent-Ready Studio maintainers
- **Source:** User-provided product definition, 2026-09-09

## Outcome

Multidisciplinary product teams can move from uncertain inputs to explicit,
reviewable decisions through connected artifacts. A reviewer understands the
work, its evidence, and its lineage without reading a raw agent transcript.

## Initial delivery outcome

A local desktop application proves one maintained path from a Product
Development workspace and versioned Input Packet through deterministic Product
Intent generation, artifact-first review, an attributable human decision, and
persisted accepted or revision-needed state.

## In scope

- A pnpm TypeScript monorepo with an Electron desktop client and standalone
  modular-monolith Studio Service.
- A small universal artifact, revision, relation, review, decision,
  transformation, execution, actor, and workspace kernel.
- A versioned Product Development blueprint that functions with no installed
  capability packs.
- SQLite-backed managed persistence behind service-owned storage interfaces.
- A runtime-validated, versioned JSON-RPC-style protocol over NDJSON child
  process stdio.
- A deterministic executor and human editing path that both create immutable
  proposals.
- Review Inbox and Work Item Studio surfaces for approval and revision
  requests.
- Durable product, architecture, roadmap, capability-intent, contributor, and
  verification documentation.

## Non-goals

- Real agent providers, AgentBundle execution from the product, repository
  automation, Git worktrees, arbitrary commands, or terminal emulation.
- Authentication, cloud sync, remote runners, multi-user collaboration, or
  production integrations.
- A generic plugin marketplace, arbitrary executable extensions, no-code
  workspace builder, visual canvas, or portfolio analytics.

## Constraints and appetite

Deliver one thin, maintained vertical slice rather than disconnected stubs.
The application must remain useful without Git, AgentBundle, provider
credentials, a terminal, or a connected repository. Runtime validation is
required at protocol, storage, and extension boundaries, and the Electron
renderer receives only a narrow typed preload API.

## Assumptions and risks

- Native SQLite packaging must remain compatible with the selected Node and
  Electron runtime; the driver choice needs a recorded rationale and build
  proof.
- The local environment may prevent graphical launch, so a production build
  plus headless renderer/service integration is an acceptable verification
  route when stated honestly.
- A broad capability inventory can dilute the first slice unless only a small
  number of ready items enter `workspace.toml`.
- Agent-ready execution remains an optional capability intent and does not
  enter the Studio core schema.

## Success evidence

- A workspace is created with zero packs, repositories, or credentials.
- The deterministic transformation records exact input revision lineage and
  raises a Product Intent proposal and review.
- Approval and revision-request paths persist their decisions and survive
  service restart.
- Automated gates cover the domain, protocol, persistence, transport, renderer,
  and complete vertical slice.
- Another engineer can clone the repository and run its documented commands.

## Governance references

Foundation ADRs and the normative architecture reference are created before
the walking-skeleton specification.

## Spec map

- [`Product Development walking skeleton`](../../specs/product-development-walking-skeleton/spec.md)
  proves workspace creation, deterministic transformation, artifact-first
  review, human decision, and restart persistence.

## Ready gaps

None. The selected delivery slice remains subject to its own spec and plan
approval gates.
