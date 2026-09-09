# ADR-0004: Process boundary: Versioned JSON-RPC over NDJSON

- **Status:** Accepted
- **Date:** 2026-09-09
- **Decision-makers:** Agent-Ready Studio maintainers
- **Supersedes:** none
- **Related:** `docs/architecture/reference.md`

## Context

Electron main launches or connects to the Studio Service. The renderer must not
import service implementation modules or receive generic filesystem, shell, or
IPC access. The first transport must be simple to inspect and test while
leaving domain methods independent of a future socket, named pipe, or WebSocket.

## Decision

> Electron main and the Studio Service communicate through a versioned,
> domain-oriented JSON-RPC 2.0-style protocol using newline-delimited JSON over
> child-process stdio.

Canonical JSON-Schema-compatible runtime definitions live in a shared protocol
package. Both sides validate requests, responses, notifications, and the
protocol handshake. Service stdout carries protocol messages only; logs and
diagnostics use stderr. Electron main exposes a smaller host API to preload and
the renderer.

## Decision drivers

- Process messages must be validated at both trust boundaries.
- The service must be testable without Electron.
- Domain method names must survive a future transport change.
- Diagnostics must never corrupt the message stream.

## Consequences

**Positive:**

- Fixtures exercise one canonical protocol outside the desktop application.
- NDJSON gives deterministic framing for child-process stdio.
- A transport interface separates service methods from process mechanics.

**Negative:**

- Large binary artifacts require a later out-of-band storage strategy.
- Request correlation, timeouts, shutdown, and malformed-line behavior need
  explicit handling.
- The preload API remains a second, intentionally narrower contract.

**Revisit if:** streaming volume, remote connectivity, or binary transfer makes
stdio framing an observed bottleneck.

## Confirmation

- **Mode:** architecture fitness test
- **Signal:** protocol fixtures reject invalid messages, and an Electron-main
  transport test completes a real service request and graceful shutdown.
- **Owner:** Agent-Ready Studio maintainers

## Alternatives considered

- Direct renderer imports violate process and privilege boundaries.
- Generic IPC or shell primitives expose capabilities unrelated to Studio
  domain actions.
- Ad hoc JSON messages lack a versioned method and validation contract.
- Starting with sockets or WebSockets adds lifecycle and security surface not
  needed for the local child process.
