# Architecture Overview

Agent-Ready Studio is a pnpm TypeScript monorepo with two applications and seven
reusable packages. The Studio Service is the only owner of SQLite writes. The
Electron renderer reaches it only through the typed preload boundary.

## Areas

| Area | Responsibility | Change guidance |
| --- | --- | --- |
| `apps/desktop` | Electron lifecycle, preload API, React renderer, and desktop boundary tests | Keep renderer production imports behind `window.studio`; main owns the child process. |
| `apps/studio-service` | JSON-RPC dispatch, application use cases, notifications, and storage composition | Keep stdout protocol-only and diagnostics on stderr. |
| `packages/protocol` | Protocol types, Zod validation, fixtures, and NDJSON transport | Keep method-specific validation aligned with the public contract. |
| `packages/domain` | Artifact, review, decision, and lifecycle domain rules | Keep it independent of Electron, transport, and SQLite. |
| `packages/workspace-sdk` and `packages/blueprint-product-development` | Blueprint, artifact, review, transformation, and capability-pack contracts plus the first-party blueprint | Keep extension data declarative and runtime-validated. |
| `packages/execution-sdk` and `packages/executor-fake` | Executor contracts, normalized events, and the deterministic Product Intent transformation | Executors propose revisions; they do not accept them. |
| `packages/storage-sqlite` | Migrations and SQLite storage operations | Keep SQL behind the service-owned storage boundary. |
| `contracts/jsonschema` | Versioned public protocol schema | Changes require the protocol approval path. |

## Request and state flow

1. The React renderer calls a purpose-specific method on the frozen preload API
   exposed as `window.studio`.
2. Preload validates the request and sends it over the allowlisted
   `studio:request` IPC channel.
3. Electron main validates the request, manages the child process, and sends a
   correlated JSON-RPC message over NDJSON stdio.
4. The Studio Service applies the use case and commits semantic state and its
   normalized event in one SQLite transaction.
5. The response is validated at main and preload boundaries. Renderer refreshes
   read `home.get` or `review.get` as authoritative projections.

The service persists workspaces, actors, artifacts and revisions, relations,
reviews and comments, decisions, executions and events, and accepted revision
pointers. Notification history is not a replay source.

## Entry points

- [`reference.md`](reference.md) defines the normative architecture.
- [`../adr/`](../adr/) records the accepted foundation decisions.
- [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md) defines setup and gates.
- [`../specs/product-development-walking-skeleton/spec.md`](../specs/product-development-walking-skeleton/spec.md)
  defines the active product contract.
