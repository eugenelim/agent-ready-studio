# Reference architecture

This is the normative golden path for Agent-Ready Studio. New work conforms to
it or records a superseding decision. [Architecture overview](overview.md)
describes what the repository currently contains.

## Constraints

- TypeScript is the primary implementation language. Compiler settings remain
  strict, and runtime validation is required at process, persistence, and
  extension boundaries.
- Node.js 24 is the intended active-LTS runtime. The repository uses pnpm
  workspaces and pins the package-manager version.
- The application is local-first and works without Git, AgentBundle, a
  capability pack, an agent provider, credentials, a terminal, a repository,
  or a remote service.
- The Electron renderer has no Node integration. Context isolation and renderer
  sandboxing stay enabled, and preload exposes only a narrow typed host API.
- The user-approved spec and AgentBundle `work-loop` govern delivery. No change
  commits or pushes unless the user separately authorizes them.

## Solution strategy

- Electron main, preload, and a React renderer form the desktop client.
  Electron main owns the Studio Service process lifecycle and transport.
- The Studio Service is a standalone Node.js modular monolith. Domain,
  application, storage, and transport concerns have explicit module boundaries
  but deploy as one service process.
- SQLite stores Studio-managed workspace state. Pinned `better-sqlite3` 13.0.3
  sits behind storage interfaces and migrations; the Studio Service is the
  single writer. Its Darwin ARM64 prebuild is verified under Electron 43.6.0 /
  embedded Node 24.20.0 without rebuilding. Packaging keeps the service entry
  and native prebuild outside ASAR, and the runtime pairing remains a build
  gate.
- A versioned JSON-RPC 2.0-style protocol uses NDJSON over child-process stdio.
  Canonical JSON-Schema-compatible definitions are shared and validated on both
  sides. Stdout is protocol-only; stderr carries diagnostics.
- Workspace Blueprints provide ongoing versioned semantics. Declarative
  Capability Packs extend them. Transformations describe semantic work apart
  from eligible Executor Adapters.
- The Product Development blueprint is first-party and opinionated. Strategy,
  Research, Experience, Architecture, Delivery, Release, and Outcomes begin as
  typed artifacts and relations, not discipline-specific database entities.

## Building-block view

### Applications

- `apps/desktop` owns Electron main, preload, renderer composition, and service
  connection state. Its production code depends on protocol and UI-facing
  contracts, never on Studio Service or storage implementation modules. The
  Node-side `src/e2e` test is the deliberate composition exception.
- `apps/studio-service` owns use cases, the service entry point, JSON-RPC method
  dispatch, event publication, process shutdown, and composition of domain,
  execution, blueprint, and storage adapters.

### Packages

- `packages/domain` owns stable entities, value objects, state transitions, and
  invariants. It has no Electron, transport, or SQLite dependency.
- `packages/protocol` owns protocol versioning, runtime schemas, fixtures, and
  client/server message types. It has no Electron dependency.
- `packages/workspace-sdk` owns runtime-validated blueprint, artifact-type,
  review-model, transformation, and declarative capability-pack contracts.
- `packages/blueprint-product-development` owns the first-party blueprint and
  its artifact and transformation definitions.
- `packages/execution-sdk` owns typed execution packets, executor contracts,
  normalized events, and results.
- `packages/executor-fake` implements the deterministic walking-skeleton
  executor through `execution-sdk`.
- `packages/storage-sqlite` owns migrations and storage-interface
  implementations. SQL and driver types do not leak into the domain.
- A shared `packages/ui` exists only when reuse across real surfaces justifies
  it; the first slice may keep renderer components in the desktop application.

### Dependency rules

- Desktop renderer → typed preload API → Electron main → protocol client →
  Studio Service transport → application use cases → domain/storage ports.
- Domain and SDK packages never import applications or infrastructure adapters.
- Blueprint manifests reference only host-known renderer/editor identifiers.
- Executor adapters receive execution packets and return normalized events;
  they do not accept artifacts or resolve semantic reviews themselves.
- Capability Packs do not dynamically load arbitrary TypeScript into the
  privileged service process.

## Domain invariants

1. Proposed artifact revisions identify the exact input revision IDs that
   produced them.
2. Artifact revision content and provenance are immutable; editing creates
   another revision, while lifecycle is projected from append-only state
   records.
3. Executors propose state and cannot accept their own proposal.
4. Acceptance is attributable to a durable human decision, or to an explicit
   recorded policy whose authority is a named human holding acceptance
   authority and whose application is audited; such a policy is never
   established through the executor path whose output it accepts. Workflow
   advancement short of acceptance is attributable to a decision or an
   explicit recorded policy.
5. Human, agent, deterministic automation, and external system are valid
   executor kinds.
6. Transformations define semantic work independently of executor vendors.
7. Studio owns semantic workflow state; executors own execution mechanics.
8. Blueprints define semantics, not storage implementations.
9. Product Development works without packs, Git, or provider credentials.
10. Agent-ready capabilities remain optional and outside the core schema.
11. Raw execution events are diagnostics, not accepted product artifacts.
12. Runtime validation occurs at every trust boundary.
13. No privileged API is exposed directly to the renderer.
14. Extensible internals do not dilute the opinionated first-party experience.

## Crosscutting standards

### Validation and errors

- Zod schemas are the canonical runtime definitions and must remain exportable
  to JSON Schema where a public boundary requires it.
- Boundary failures use stable codes and safe messages. Raw exceptions stay in
  diagnostics and never cross into renderer-visible protocol payloads.
- Invalid protocol input receives a JSON-RPC error when correlation is safe;
  malformed framing is logged to stderr and cannot corrupt stdout.

### Persistence

- Migrations run transactionally before the service accepts requests.
- Storage adapters validate serialized JSON before constructing domain values.
- Foreign keys are enabled. Tests use isolated temporary databases and fixed
  clocks or deterministic timestamps.
- Repository-backed and external artifact kinds may be added later without
  changing the authority of Studio-managed content.

### Observability

- Domain notifications describe semantic change. Raw executor and process
  events remain linked diagnostics.
- Service logs are structured and written to stderr. Protocol stdout is never
  used for logging.
- Execution progress is normalized before publication or persistence.

### Security and data handling

- Preload exposes an allowlisted API with no generic IPC, shell, or filesystem
  methods.
- IPC, protocol, persisted JSON, blueprint, pack, and executor messages are
  runtime-validated.
- Generated active HTML is never rendered with privileged access.
- The first release has no arbitrary command execution, provider credentials,
  authentication, remote sync, or third-party executable plugins.

### Testing and verification

- Domain and SDK invariants use deterministic unit tests.
- Protocol definitions have valid request, response, notification, and refusal
  fixtures.
- Storage tests run real migrations and reopen a temporary SQLite database.
- Transport tests spawn the real service process and exercise handshake,
  request correlation, notifications, unavailability, and graceful shutdown.
- Renderer tests exercise decision-oriented status changes through the typed
  host boundary.
- One end-to-end proof covers workspace creation through persisted approval or
  revision request. `pnpm verify` runs lint, typecheck, tests, and build.

## Decisions

- [ADR-0001](../adr/0001-electron-client-and-studio-service.md)
- [ADR-0002](../adr/0002-workspace-extension-model.md)
- [ADR-0003](../adr/0003-artifact-revisions-and-decisions.md)
- [ADR-0004](../adr/0004-versioned-json-rpc-ndjson-boundary.md)
