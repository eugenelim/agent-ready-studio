# ADR-0001: Application foundation: Electron client and Studio Service

- **Status:** Accepted
- **Date:** 2026-09-09
- **Areas:** platform, runtime
- **Reversibility:** low
- **Decision-makers:** Agent-Ready Studio maintainers
- **Supersedes:** none
- **Supersedes in part:** none
- **Superseded by:** none
- **Superseded in part:** none
- **Related:** `docs/architecture/reference.md`

## Context

Agent-Ready Studio is a maintained local product with an artifact-first desktop
experience, durable managed state, and no requirement for Git, AgentBundle, an
agent provider, or a remote service. The renderer must not own privileged
capabilities or persistence. The domain must remain testable without launching
Electron, and the first release does not justify distributed services.

The active LTS target is Node.js 24. Development may run on a newer compatible
local Node line. Native SQLite packaging must be tested against the selected
Node and Electron versions.

## Decision

> We use strict TypeScript in a pnpm workspace, an Electron and React desktop
> client, and one standalone Node.js Studio Service implemented as a modular
> monolith.

- **D1:** Studio is strict TypeScript in a pnpm workspace, an Electron and React
  desktop client, and one standalone Node.js Studio Service implemented as a
  modular monolith.
- **D2:** Electron main owns the service process and transport.
- **D3:** The sandboxed renderer receives a narrow typed preload API.
- **D4:** The service owns domain behavior and is the only SQLite writer.
- **D5:** SQLite is accessed through explicit storage interfaces with pinned
  `better-sqlite3` 13.0.3.

`better-sqlite3` was chosen for its mature synchronous API, transaction support,
and established Node and Electron packaging ecosystem.

## Decision drivers

- Offline and manual-first use must work without external infrastructure.
- Domain and persistence behavior must be independently testable.
- Privileged APIs must remain outside the renderer.
- The first release needs one deployable unit, not service-discovery overhead.

## Consequences

**Positive:**

- A single service owns invariants, transactions, migrations, and publication.
- Electron stays a client boundary rather than becoming the application core.
- Package boundaries can evolve inside one process without distributed-system
  costs.

**Negative:**

- Native SQLite packaging and ABI compatibility need explicit build proof.
- Electron 43.6.0, its embedded Node 24.20.0, and the SQLite prebuild are
  re-probed together before any pinned runtime version changes.
- The process boundary requires lifecycle management and a validated protocol.
- A synchronous SQLite driver requires keeping long work outside transactions.

**Revisit if:** remote multi-user deployment or write throughput makes one
local service and SQLite an observed constraint.

## Confirmation

- **Mode:** architecture fitness test
- **Signal:** automated tests prove renderer isolation, service-only writes,
  persistence, restart survival, and transport behavior.
- **Owner:** Agent-Ready Studio maintainers

## Alternatives considered

- Renderer-local state or renderer-owned SQLite fails the privilege and
  independent-testability drivers.
- Microservices add operational cost before an independently deployable need
  exists.
- A browser-only client weakens the intended local desktop and managed-service
  lifecycle.
- Git as the universal store prevents repository-free adoption and is a poor
  authority for every artifact kind.
