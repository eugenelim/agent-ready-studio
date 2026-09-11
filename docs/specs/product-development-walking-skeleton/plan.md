# Plan: Product Development walking skeleton

- **Status:** Done
- **Spec:** [`spec.md`](spec.md)
- **Owner:** Agent-Ready Studio maintainers
- **Repository anchors:** [`docs/architecture/reference.md`](../../architecture/reference.md);
  Accepted ADR-0001 through ADR-0004; greenfield with no analogous production
  implementation; construction begins from the canonical protocol contract and
  domain transition tests.

## Approach

Build one pnpm TypeScript workspace in dependency order: validated semantic
contracts; pure domain transitions; SQLite storage and migrations; standalone
Studio Service application layer; JSON-RPC NDJSON server/client transport;
Electron main and narrow preload; then the React Review Inbox and Work Item
Studio. Tests grow at each boundary and culminate in a restart-safe vertical
slice.

## Constraints

- Follow Accepted ADR-0001 through ADR-0004 and the normative architecture
  reference.
- Keep the service a modular monolith and avoid speculative packages or plugin
  machinery.
- Do not commit. Do not require network, credentials, Git, AgentBundle, or an
  agent runtime for tests or product use.
- Keep generated build output and SQLite databases untracked.
- Bind every SQLite statement's artifact, workspace, comment, and content
  values as parameters. Compose no query text from user-supplied content.

## Construction tests

- Package dependency checks prevent renderer-to-service or renderer-to-storage
  imports.
- Schema fixtures validate protocol requests, responses, notifications, and
  invalid messages against the canonical contract.
- Storage tests start from an empty path, run migrations, close, reopen, and
  assert durable semantic state.
- Service tests run transformations and review decisions through public
  application methods rather than calling storage internals.
- Renderer tests replace only the narrow preload API; the end-to-end test uses
  the real child service and persistence.

## Durable-output map

| Spec output | Tasks | Implementation evidence | Closeout evidence |
| --- | --- | --- | --- |
| User promise | T1, T10 | Current README behavior and setup | Command transcript and setup check |
| Maintainer procedure | T1, T10 | Verified AGENTS/contribution/convention guidance | Guidance-to-command reconciliation |
| Product scope and queue | T1, T10 | Charter, roadmap, capability inventory, small queue | Intent count and active/next receipt |
| Current and normative architecture | T1-T9 | Boundaries, migrations, transport, Electron security | Overview reconciliation and boundary test |
| Protocol compatibility | T2, T6 | JSON Schema, Zod method map, fixtures | Contract and spawned-service results |
| Decision rationale and revision semantics | T3-T5, T10 | Accepted ADR status plus transition and transaction tests | ADR reconciliation and stale, duplicate, branch, and restart results |
| Aesthetic and design-system direction | T8, T9 | Semantic tokens and rendered primary screens | Visual checklist or honest headless limitation |
| Release and verification record | T10 | `notes/verification-ledger.md` | Gates, environment, and gaps recorded |

## Design (LLD)

### Design decisions

*Realizes:* AC-03, AC-05, AC-07, AC-22 · `$defs.blueprint`, `$defs.executionView`.

- Combine blueprint, capability-manifest, and transformation contracts in
  `workspace-sdk`; keep executor packets/events in `execution-sdk` because both
  have concrete consumers.
- Represent Initiative and Input Packet as typed artifacts. Initiative owns no
  invariant beyond artifact and relation semantics, so a special table would
  prematurely hard-code a discipline concept.
- Use Zod as the runtime schema source in TypeScript and keep the external JSON
  Schema contract aligned through fixtures. Use one formatter/linter family,
  not overlapping tools.
- Keep domain event rows as a normalized activity record, not an event-sourcing
  replay log.

### Data & schema

*Realizes:* AC-05, AC-10, AC-17, AC-19, AC-22, AC-30 · `$defs.productIntentRevision`, `$defs.evidenceRelation`.

SQLite migrations create tables for workspaces, actors, artifacts,
artifact_revisions, artifact_revision_states, relations, reviews,
review_comments, decisions, transformations, executions, execution_events, and
schema_migrations. Foreign keys and transaction boundaries enforce exact
lineage and atomic review resolution. Revision content/provenance rows and
lifecycle rows are insert-only; artifact rows hold the nullable current
accepted revision ID.

Structured content and validated metadata are stored as canonical JSON text.
Reads validate and map rows before they cross the storage boundary. Every
statement binds artifact, workspace, comment, and content values as parameters;
no query text is composed from user-supplied content.

### Interfaces & contracts

*Realizes:* AC-20, AC-21, AC-32, AC-33, AC-40, AC-41, AC-46, AC-47, AC-49 · `$defs.request`, `$defs.result`, `$defs.notification`, `$defs.reviewPackage`, `$defs.homeResult`.

Protocol v1 implements `system.hello`, `health.get`, `blueprint.list`,
`workspace.create`, `workspace.list`, `workspace.get`, `demo.seed`, `home.get`,
`execution.start`, `review.list`, `review.get`, `artifact.revise`, and
`review.resolve`. `home.get` returns three inbox groups — Needs your decision,
Blocked or revision requested, and Recently completed — each item a review;
amendment 0004 removed the Running group, because this slice's execution is
atomic and no execution is observable in flight. `review.get` returns the complete Review Package for
every Work Item region. Notifications cover workspace creation, execution
lifecycle, proposal creation, review request, decision record, and revision
acceptance.

`StudioTransport` owns request correlation, method-to-result validation,
notification subscription, per-request timeout, disconnect behavior, and
shutdown. ADR-0004 names correlation, timeouts, shutdown, and malformed-line
behavior as the four boundary obligations; each is realized here. Electron main
owns a child-process adapter;
preload exposes a frozen `studio` API with domain-specific methods only.

### Component / module decomposition

*Realizes:* AC-01, AC-24, AC-34 · package-boundary construction tests above.

- `packages/domain`: entities, identifiers, content schemas, transition rules.
- `packages/protocol`: JSON-RPC envelopes, method schemas, validators, client
  types, fixtures.
- `packages/workspace-sdk`: blueprint, artifact type, relation,
  transformation, review model, and capability manifest contracts.
- `packages/blueprint-product-development`: validated first-party definition,
  seeded artifact templates, and module metadata.
- `packages/execution-sdk`: executor interface, packet, event, and result.
- `packages/executor-fake`: deterministic Product Intent executor.
- `packages/storage-sqlite`: storage interfaces implementation and migrations.
- `apps/studio-service`: application services, dispatch, stdio entrypoint.
- `apps/desktop`: Electron main/preload plus renderer. Shared UI remains local
  until a second package consumer justifies `packages/ui`.

### State & control flow

*Realizes:* AC-02, AC-11, AC-13, AC-17, AC-18, AC-30, AC-31, AC-46 · `$defs.reviewPackage`, `$defs.reviewSummary`, `$defs.decisionView`.

The normative statement of revision immutability, lifecycle append-only
ordering, review targeting, and lineage exactness is the spec's **State
contract**; this sub-section does not restate those rules and must not diverge
from them. What follows is only the per-method control flow that realizes them.

`workspace.create` installs the Product Development blueprint with no packs and
creates that workspace's local human actor, so actor identity exists before any
decision and independently of demo content. `demo.seed` idempotently creates the
initiative and Input Packet, and is idempotent against the already-created
actor. No request carries an actor identity: the application layer resolves the
workspace's human actor and stamps it on every Decision and human-produced
revision.
`execution.start` validates an applicable transformation and exact input
revision, records Running, invokes the fake executor, stores normalized events,
inserts a Proposed Product Intent revision plus lineage, requests review, and
records Completed without accepting the proposal.

`review.resolve(approve)` runs one transaction: validate the open review and its
exact target revision, and resolve the workspace's service-owned human actor;
create Decision; append Accepted and any
Superseded lifecycle rows; update the artifact accepted pointer; resolve the
review; and persist normalized events. Notifications publish only after commit.
`review.resolve(requestRevision)` requires a nonblank comment, records comment
and Decision, leaves the proposal unaccepted, and marks revision-needed.
`artifact.revise` inserts a new human-produced proposal, supersedes the prior
outstanding proposal through lifecycle, closes its resolvable review, and opens
a review targeting the new revision; it never updates revision content.

### Behavior & rules

*Realizes:* AC-08, AC-14, AC-29 · `$defs.executionEvent`, `$defs.homeItem`.

- IDs are stable prefixed UUIDs in production and injectable deterministic IDs
  in tests.
- Timestamps come from an injectable clock; executor-generated content never
  depends on the clock.
- Fake executor output derives only from typed Input Packet content and a fixed
  template.
- Review projections group items for the inbox; diagnostic events do not become
  artifact content.

### Failure, edge cases & resilience

*Realizes:* AC-20, AC-21, AC-22, AC-23, AC-25, AC-33, AC-42, AC-43, AC-47, AC-48, AC-49 · `$defs.error`, `$defs.conflictErrorData`, `$defs.protocolVersionErrorData`.

- Invalid or incompatible protocol messages receive structured JSON-RPC errors
  without crashing or corrupting stdout.
- A missing or exited service produces a renderer-visible disconnected state
  and bounded restart action.
- A live service that accepts a request but never answers it fails closed at
  three points along one path, each with its own owner. At the transport
  (AC-47, T6) the correlated request settles at a bounded deadline, its pending
  entry is released, and the connection keeps serving subsequent requests. At
  the main and preload crossing (AC-49, T7) that outcome reaches the renderer
  typed and runtime-validated, distinguishable from a service-returned error and
  from AC-33's disconnected and incompatible conditions, so it cannot be
  normalized into a generic failure in transit. At the renderer (AC-48, T8 and
  T9) the waiting surface leaves loading for a labeled timed-out state offering
  retry. The transport timeout is not a disconnect: it does not trigger the
  AC-33 reconnect path, and retry after it re-issues on the still-live
  connection without re-handshaking.
- Failed execution records failure and diagnostics while preserving inputs.
- Transactions roll back partial proposal/review/decision writes.
- Rolled-back work publishes no notification; reconnect always reloads the
  service projection rather than reconstructing state from notifications.
- Shutdown stops new requests, completes or fails the active operation, closes
  SQLite, then terminates the child within a bounded grace period.

### Quality attributes (NFRs)

*Realizes:* AC-24, AC-34, AC-35 through AC-38, AC-45 · `$defs.helloResult`, `$defs.healthResult`.

- Security: no Node integration, context isolation and sandbox enabled, narrow
  preload, no active generated HTML, no generic shell or filesystem endpoint.
- Accessibility: semantic elements, labels, keyboard operation, visible focus,
  4.5:1 text contrast where applicable, non-color status cues, reduced motion.
- Reliability: migration-from-empty, transactional transitions, deterministic
  execution, restart persistence, stderr-only service logs.
- Maintainability: strict TypeScript, explicit package exports, one lint/format
  setup, small public interfaces, and truthful docs.

### Dependencies & integration

*Realizes:* AC-01, AC-23, AC-27 · `$defs.protocolVersion`.

Use pnpm workspaces, TypeScript, React, Electron, electron-vite, Zod,
better-sqlite3, Vitest, Testing Library, and a single lightweight styling path
based on semantic CSS variables. Development and service integration run the
compiled service with Node and the pinned prebuilt native addon. Packaging
stages the service runtime and `better-sqlite3` prebuild under desktop resources
outside ASAR. Electron main
uses `child_process.spawn(process.execPath, [serviceEntry])` with
`ELECTRON_RUN_AS_NODE=1` and all three stdio streams piped. A production smoke
starts that exact staged entry, migrates a
database, completes `health.get`, and observes shutdown within five seconds.
The pre-approval native-runtime probe below proved that no Electron rebuild or
second ABI-specific addon is needed for the pinned versions.

### Contract acquisition and disconfirming probe

- **Oracle tier:** strong static TypeScript/runtime contract plus native runtime
  probe. Electron 43.6.0 embeds Node 24.20.0; `better-sqlite3` 13.0.3 declares
  Node 22+ and ships a Darwin ARM64 prebuild.
- **Rejected mechanism:** Electron `utilityProcess.fork` cannot pipe stdin, so
  it cannot carry bidirectional NDJSON stdio.
- **Probe (2026-09-09):** spawned Electron with `ELECTRON_RUN_AS_NODE=1`, loaded
  `better-sqlite3` 13.0.3 under embedded Node 24.20.0 and SQLite 3.53.4, exchanged
  clean NDJSON, reopened durable data, and closed on SIGTERM in 374 ms. No
  rebuild was required. The standalone comparison also passed under the local
  Node 26.7.0; Node 24 behavior is covered by Electron's embedded runtime.
- **Retained evidence:**
  [`notes/native-runtime-probe.md`](notes/native-runtime-probe.md). The probe
  directory was disposable and removed.

## Retention and approval record

- **Class:** repository-durable; retain spec, plan, contract,
  verification ledger, review findings, and closeout receipt.
- **Locator:** `docs/specs/product-development-walking-skeleton/` with canonical
  contract at `contracts/jsonschema/studio-protocol-v1.schema.json`.
- **Fingerprint:** `notes/approval-baseline.sha256`, generated immediately before
  human approval as standard `shasum -a 256` output in this canonical order:
  `spec.md`, `plan.md`, then
  `contracts/jsonschema/studio-protocol-v1.schema.json`. Paths are
  repository-relative and each digest occupies one line.
- **Required readers:** implementer, code-quality reviewer, security reviewer,
  and close-work reconciler.
- **Review locators:** final shaping and adversarial reports are retained under
  `notes/reviews/`; raw round evidence remains under ignored
  `.context/reviews/` for this worktree.
- **Stable evidence owner:** `notes/verification-ledger.md`, owned by the
  implementing work-loop after approval.
- **Disposition boundary:** generated build/test output is disposable and
  ignored; semantic docs, migrations, source, contract fixtures, and verification
  evidence remain repository-owned. No artifact is published or committed by
  this task.

## Review shape

**DEEP.** The whole slice is far above the 2,000 reviewable behavior-and-test
line threshold — seven packages and two apps, a thirteen-table schema with
migrations, thirteen protocol methods with their error and notification shapes,
an Electron main/preload boundary, and a renderer carrying eight blueprint
modules, three inbox groups, seven labeled states and a three-region studio. The
shape is DEEP rather than WIDE because the layers differ in kind and no single
transformation invariant covers them, so it is decomposed into dependency-ordered
review units rather than shipped as one diff.

The task graph is strictly linear (T1 → T2 → … → T9, with T10 on all), so waves
carry no parallelism; these boundaries exist for reviewability, not throughput.

| Unit | Tasks | Boundary — what exists and works when the unit closes |
| --- | --- | --- |
| U1 | T1 | A fresh clone runs every root command; durable product documents resolve. |
| U2 | T2-T5 | The headless core: a seeded Input Packet produces a Product Intent proposal and an open review, and both decision paths persist — proved in-process, with no Electron and no renderer. |
| U3 | T6-T7 | The process boundary: a spawned compiled service answers `health.get` over NDJSON and its outcomes cross Electron main and the real preload. |
| U4 | T8-T9 | The renderer: workspace shell, Review Inbox and Work Item Studio against the narrow preload contract. |
| U5 | T10 | The end-to-end proof and durable-output reconciliation. |

Each unit is independently reviewable and leaves the repository working.

The engine executes this as follows in Phase 1. Every task's wave closes with its
own GATES: `wave-complete` to `CODE-VERIFICATION`, then `wave-passed
--wave-index n` back to `CODE-IMPLEMENTATION`, paired with `loop-cohort wave
advance --from-index n`. The engine's REVIEW gate and human gate fire **once**,
after the final wave, because `gates-clean` is the only edge into `CODE-REVIEW`
and carries the `wave check --expect last` guard. A per-unit engine review gate
before the final wave is therefore not reachable, and
`reviewers-clean --intent-incomplete` — which requires `CODE-REVIEW` — is not
available at an intermediate unit boundary either.

Unit boundaries are consequently **session, context and PR-stack boundaries, not
engine gates**: a fresh implementer session per unit, a controller checkpoint at
each boundary, and one reviewable stack layer per unit. `spec.md` stays
`Implementing` from `plan-locked` until the single post-final-wave review
completes, and only that review may mark it `Shipped`.

Unit membership is a review-and-session boundary only. It changes no task, no
`Depends on:` edge, and no acceptance criterion; the dependency order below
remains the single source of execution sequence.

## Tasks

### T1: Establish repository and durable product surface

**Review unit:** U1

**Depends on:** none

**Verification mode:** Goal-based check.

**Implements:** Objective durable repository outcome; AC-01.

**Tests:**
- `no stub (mode)` — goal-based. Each command either runs or does not, so the
  proof is invocation, not an assertion the compiler already makes.
- Root-manifest check: every required command and the Node/pnpm pins are
  present; each finite command (`pnpm install`, `pnpm lint`, `pnpm typecheck`,
  `pnpm test`, `pnpm build`, `pnpm verify`) exits zero from a fresh clone, and
  the long-running `pnpm dev` is proved by bounded startup readiness followed by
  clean termination rather than by an exit code (AC-01).
- Capability inventory check counts every required stable ID exactly once.

**Approach:**
- Create workspace manifests, strict TS config, one formatter/linter setup, and
  ignored output rules.
- Author charter, roadmap, capability inventory, contributor guidance, and a
  small active workspace queue.

**Done when:** manifest checks pass and all durable documents resolve their links.

### T2: Implement protocol and extension contracts

**Review unit:** U2

**Depends on:** T1

**Verification mode:** TDD.

**Implements:** Protocol/blueprint behavior; AC-03, AC-07, AC-20, AC-21,
AC-40, AC-41, AC-44, AC-46.

**Tests:**
- `no stub (implementation-discovered)`. Discovery predicate: the assertable
  seam is the Zod method map's validator export in `packages/protocol`, which
  does not exist until this task creates it and whose signature depends on the
  method-map shape chosen here; naming it now would invent a symbol.
  Proof obligation: on entering CODE-IMPLEMENTATION, write the mismatched-params
  rejection red test first against the real validator, prove its red, and only
  then implement validation.
- A `workspace.create` envelope carrying `review.resolve` params is rejected by
  the protocol validator (AC-20).
- A `review.resolve` or `artifact.revise` request carrying an `actorId` field is
  rejected by the protocol validator, and a Review Package whose reviewed
  revision is `accepted` validates only when its review is not `open` (AC-41,
  AC-46).
- Positive and negative fixtures cover every implemented request, result, and
  notification; blueprint validation rejects duplicate module IDs (AC-03,
  AC-07, AC-20).
- Review Package construction rejects a review target that differs from the
  proposed revision or displayed unique input lineage (AC-11, AC-20, AC-41).

**Approach:**
- Implement Zod schemas and method maps aligned with the canonical JSON Schema.
- Implement workspace-sdk and execution-sdk contracts plus validated Product
  Development blueprint definitions.

**Done when:** contract fixtures and blueprint validation tests pass.

### T3: Implement domain kernel and transitions

**Review unit:** U2

**Depends on:** T2

**Verification mode:** TDD.

**Implements:** Immutable semantic state; AC-09 through AC-13, AC-17, AC-18,
AC-30, AC-31.

**Tests:**
- `no stub (implementation-discovered)`. Discovery predicate: the assertable
  seam is the pure transition command for review resolution in
  `packages/domain`, which does not exist until this task creates it and whose
  parameter record depends on the domain entity shapes defined alongside it.
  Proof obligation: on entering CODE-IMPLEMENTATION, write the stale-target
  refusal red test first against the real transition, prove its red, and only
  then implement the guard.
- Approving a revision whose ID differs from the open review target returns a
  stale-review error and performs no transition (AC-13).
- Unit tests cover immutable content, lifecycle append rules, actor/executor
  kinds, lineage equality, required Product Intent fields, and duplicate
  decision refusal (AC-09 through AC-13, AC-17, AC-18).

**Approach:**
- Implement domain records, typed content, pure transition commands, and
  injectable IDs/clocks.
- Represent Initiative and Input Packet as artifact types and encode review
  target identity explicitly.

**Done when:** all domain transition tests pass without storage.

### T4: Implement SQLite migrations and storage

**Review unit:** U2

**Depends on:** T3

**Verification mode:** TDD integration.

**Implements:** Durable transactional state; AC-17 through AC-19, AC-22.

**Tests:**
- `no stub (implementation-discovered)`. Discovery predicate: the assertable
  seam is the storage-interface factory in `packages/storage-sqlite`, which does
  not exist until this task creates it and whose open/close surface depends on
  the migration runner built with it. Proof obligation: on entering
  CODE-IMPLEMENTATION, write the close-and-reopen persistence red test first
  against the real factory, prove its red, and only then implement migrations.
- Closing and reopening a migrated database retains the accepted revision
  pointer and its attributable decision (AC-19).
- Integration tests cover fresh migration, foreign keys, unique lineage,
  insert-only revision/state records, atomic branches, and rollback.
- A storage test writes workspace, comment, and Product Intent content
  containing SQL metacharacters and quote sequences, then reads it back byte-
  identical, proving values are bound as parameters rather than interpolated.

**Approach:**
- Implement storage interfaces and version-1 migrations using better-sqlite3.
- Map and validate rows at the storage boundary; centralize transactions for
  execution completion and review resolution.

**Done when:** storage integration tests pass against fresh temporary files.

### T5: Implement application service and fake executor

**Review unit:** U2

**Depends on:** T4

**Verification mode:** TDD integration.

**Implements:** End-to-end service semantics; AC-02, AC-05 through AC-13,
AC-17 through AC-19, AC-22, AC-29 through AC-31, AC-39 through AC-44, AC-46.

**Tests:**
- `no stub (implementation-discovered)`. Discovery predicate: the assertable
  seam is the application service's `execution.start` handler in
  `apps/studio-service`, which does not exist until this task creates it and
  whose dependency record depends on the storage and domain interfaces it
  composes. Proof obligation: on entering CODE-IMPLEMENTATION, write the
  seeded-packet-to-proposal red test first against the real handler, prove its
  red, and only then implement the transformation path.
- The seeded Input Packet produces a deterministic Product Intent proposal and
  an open review while leaving the accepted revision null (AC-05 through
  AC-11).
- Service tests cover zero-pack workspace creation, idempotent demo seed,
  exact lineage, normalized events, failure recording, both decisions, human
  revision, and stale/duplicate refusal (AC-02, AC-05 through AC-13, AC-17,
  AC-18).
- Workspace creation persists the local human actor, demo seed is idempotent
  against it, and both decisions and a human revision carry that
  service-resolved actor with no caller-supplied identity (AC-02, AC-46).

**Approach:**
- Implement application handlers over storage/domain interfaces.
- Implement and register only the deterministic executor for the semantic
  `strategy.frame-product-intent` transformation.

**Done when:** the service integration suite proves both persisted review paths.

### T6: Implement NDJSON server and transport client

**Review unit:** U3

**Depends on:** T5

**Verification mode:** TDD integration for dispatch and transport behavior;
goal-based spawned-process check for the compiled-service smoke.

**Implements:** Versioned process contract; AC-20 through AC-23, AC-32,
AC-33, AC-40 through AC-44, AC-47.

**Tests:**
- `no stub (implementation-discovered)` for the TDD-integration portion.
  Discovery predicate: the dispatch and transport seams — the service entry's
  request-handling export and the `StudioTransport` client surface — do not
  exist until T6 creates them, and T2 through T5 fix the schemas they consume,
  so no callable signature can be named now without inventing one. Proof
  obligation: on entering CODE-IMPLEMENTATION, write the incompatible
  `system.hello` red test first against the real seam, prove its red, and only
  then implement dispatch.
- Incompatible `system.hello` returns the `-32001` version error and dispatches
  no other method (AC-21).
- A request the service accepts but never answers settles with a structured
  timeout error at the bounded deadline, releases its pending correlation entry,
  and leaves the transport able to serve the next request (AC-47).
- Spawned-stream tests cover framing, request correlation, method/payload
  mismatch, stdout/stderr separation, after-commit notification order,
  reconnect query, failure, and five-second shutdown (AC-20 through AC-23).
- A correlated `health.get` response carrying a schema-valid `workspace`
  result is rejected against the pending method's registered result schema
  (AC-20).

**Approach:**
- Add stdio JSON-RPC dispatch in the service entry and a transport-interface
  client with request correlation and subscriptions.
- Persist events inside transactions and publish notifications after commit.

**Done when:** a spawned compiled service migrates a database, answers
`health.get`, runs the vertical service flow, and exits within five seconds.

### T7: Implement Electron process and preload boundary

**Review unit:** U3

**Depends on:** T6

**Verification mode:** TDD for the main/preload boundary; goal-based
production-path smoke.

**Implements:** Privileged boundary and service lifecycle; AC-23, AC-24,
AC-27, AC-33, AC-34, AC-45, AC-49.

**Tests:**
- `no stub (implementation-discovered)` for the TDD portion. Discovery
  predicate: the assertable seam is the electron-vite main entry's window-
  construction and preload-exposure functions, which do not exist until this
  task creates them and whose shape depends on the electron-vite entry layout
  chosen here. Proof obligation: on entering CODE-IMPLEMENTATION, write the
  BrowserWindow-preferences and CSP/navigation red tests first against the real
  main entry, prove their red, and only then configure the window.
- Main-process tests assert secure BrowserWindow preferences and the absence of
  generic IPC, process, shell, or filesystem methods (AC-24, AC-34).
- Main-process tests assert the renderer Content-Security-Policy value, that a
  `will-navigate` attempt is denied, and that a `window.open` request is denied
  (AC-45).
- A request that times out in the transport surfaces through the real preload
  API as a typed, runtime-validated timeout outcome that the caller can tell
  apart from a service-returned error and from the disconnected and
  incompatible conditions; this asserts against the actual preload surface, not
  a replaced one (AC-49).
- Lifecycle tests cover child location, incompatible handshake, unexpected
  exit, bounded restart, and graceful application quit (AC-23, AC-27).

**Approach:**
- Configure electron-vite main, preload, and renderer entries.
- Spawn the unpacked service with Electron running as Node and piped stdio,
  validate both sides of IPC, and expose a frozen purpose-specific preload API.

**Done when:** Electron boundary tests pass and the production service entry is
addressable outside ASAR.

### T8: Implement workspace shell and Review Inbox

**Review unit:** U4

**Depends on:** T7

**Verification mode:** TDD component.

**Implements:** Workspace and decision-inbox experience; AC-02 through AC-04,
AC-14, AC-25, AC-33, AC-39, AC-40, AC-42, AC-43, AC-48.

**Tests:**
- `no stub (implementation-discovered)`. Discovery predicate: the assertable
  seam is the Review Inbox component and its preload-backed data hook, neither
  of which exists until this task creates them; naming a component or hook
  symbol now would invent it. Proof obligation: on entering
  CODE-IMPLEMENTATION, write the inbox-group rendering red test first against
  the real component, prove its red, and only then build the inbox.
- Component tests create a workspace through preload and render every inbox
  group plus loading, empty, disconnected, incompatible, failed, retrying, and
  timed-out states (AC-02, AC-14, AC-25). Amendment 0004 reduced the groups from
  four to three.
- A surface whose request times out leaves loading for the labeled timed-out
  state, offers retry, and on retry re-queries authoritative state rather than
  inferring completion (AC-48, AC-43).
- Navigation tests cover exactly eight blueprint modules and the six honest
  empty states (AC-03, AC-04).

**Approach:**
- Implement semantic design tokens, accessible primitives, global/workspace
  navigation, workspace creation, explicit seed action, and inbox projections.
- Re-query authoritative state after notifications and reconnects.

**Done when:** renderer tests prove workspace creation and live inbox updates
without service implementation imports.

### T9: Implement Work Item Studio and review actions

**Review unit:** U4

**Depends on:** T8

**Verification mode:** TDD component for behavior; visual/manual QA for the
rendered quality floor.

**Implements:** Artifact-first review and experience quality; AC-11 through
AC-18, AC-25, AC-26, AC-30, AC-31, AC-35 through AC-38, AC-41, AC-44, AC-48,
AC-50, AC-51.

**Tests:**
- `no stub (implementation-discovered)` for the TDD-component portion.
  Discovery predicate: the assertable seam is the Work Item Studio component
  tree and its decision-panel callbacks, which do not exist until this task
  creates them and whose props depend on the T8 shell built immediately before.
  Proof obligation: on entering CODE-IMPLEMENTATION, write the
  approve-and-advance red test first against the real decision panel, prove its
  red, and only then wire the action.
- `no stub (mode)` for the visual/manual QA portion — the proof is rendered
  output, not an assertion.
- Component tests cover three-region layout, tabs, exact revision lineage,
  evidence/no-evidence, change baseline/no-baseline, Run details disclosure,
  editor revision, approval, and required revision comment (AC-11 through
  AC-18).
- Reloaded resolved-package tests show Decision ID, actor, action, comment, and
  timestamp from the service projection (AC-41, AC-44).
- Work Item Studio renders the same labeled state set as the inbox — loading,
  no-work, execution-failed, service-disconnected, protocol-incompatible,
  retrying, and timed-out — and a `review.get` that times out leaves loading for
  the timed-out state offering retry (AC-25, AC-48).
- Visual checks cover two themes, keyboard focus, 1024px width, 200% zoom,
  reduced motion, and non-hover input (AC-26, AC-35 through AC-38).

**Approach:**
- Build the purpose-specific Product Intent reader/editor and decision panel.
- Keep run events in a secondary tab and map semantic states to label, icon,
  shape, and token roles.

**Done when:** renderer tests pass and the visual checklist has rendered
evidence from headful Electron or production renderer screenshots captured in
headless Chromium at the required viewports.

### T10: Prove and reconcile the complete slice

**Review unit:** U5

**Depends on:** T1-T9

**Verification mode:** Goal-based end-to-end and full gate suite.

**Implements:** Complete objective and restart proof; AC-01, AC-19, AC-27,
AC-28.

**Tests:**
- End-to-end proof covers renderer boundary through real child service and
  SQLite for create, seed, transform, decision, restart, and retained state
  (AC-28).
- `pnpm verify` runs lint, typecheck, tests, build, contract checks, and
  dependency-boundary checks without network or credentials (AC-01, AC-27).

**Approach:**
- Run full verification and the production child/native-addon smoke before
  attempting headful GUI inspection.
- Correct failures, update README/AGENTS/architecture overview, and record
  exact results and gaps in the verification ledger.

**Done when:** all runnable gates pass, durable outputs match implemented truth,
and any environment-only GUI or packaging gap is explicitly recorded.

## Rollout

This is a local greenfield release. A fresh database migrates to schema v1.
There is no compatibility migration or external rollout. Demo content appears
only after an explicit seed action.

## Risks

- Electron or SQLite version changes may invalidate the proven prebuild/runtime
  pairing; keep versions pinned and repeat both-runtime and packaged-entry
  probes before an upgrade.
- UI scope could crowd out boundary correctness; keep purpose-built screens and
  avoid a generic form, workflow, or plugin framework.
- Protocol schemas could drift from the JSON Schema artifact; fixtures validate
  representative messages against both surfaces.
- Headful Electron may be unavailable in the enterprise environment; retain a
  headless transport/renderer/persistence proof and report the limitation.

## Changelog

- 2026-09-09: Initial plan derived from the Ready delivery brief and Accepted
  foundation ADRs.
- 2026-09-10: **Amendment 0004.** Amended AC-14 and AC-40 to drop Home's Running
  group, and removed the unreachable projection branch that fed it. `readHome`
  selected executions with status `running` or `failed`, but `storage.transaction`
  is an immediate transaction and `executionStart` inserts the row as running and
  completes it in the same call, so a crash rolls the insert back and nothing ever
  writes `failed` — the group was permanently empty and its only non-empty
  rendering was a component fixture. The scope owner chose amending over splitting
  execution into two transactions, which is the right design for long-running or
  resumable work and the wrong one for a deterministic in-process call, and would
  have reopened AC-22. `home.get` loses its `running` array, and the Home item's
  `kind` and `status` narrow to the variants the remaining branch can produce.
  Found by quality review at spec-level coverage scope in round 30, by mutation
  testing. No task or dependency edge changed. Evidence and authority:
  `notes/amendments/0004-home-running-group.md`.
- 2026-09-10: **Amendment 0003.** Added AC-51, giving Overview and Strategy
  honest content. AC-04 names six module surfaces and requires a purpose-specific
  empty state for each; Overview and Strategy are named by no criterion and had
  been given static description sentences instead, which read as content while
  holding none. Strategy now renders the workspace's Product Intent work, read
  from `review.list` filtered to the product-intent artifact type, and states
  emptiness only when there is none — a flat empty state would have matched the
  other six and been false the moment the demo is seeded. Overview states
  emptiness like the six. Found by the scope owner running the application. No
  task, dependency edge or existing criterion changed; AC-51 joins T9. Evidence
  and authority: `notes/amendments/0003-module-surfaces.md`.
- 2026-09-10: **Amendment 0002.** Added AC-50, giving the Reviews surface its own
  content. Home and Reviews rendered the same `ReviewInbox`, because AC-14 assigns
  the four-group decision inbox to Home and no criterion said what Reviews shows —
  so it was built by reusing Home's body, leaving `review.list` defined by the
  contract, exposed by the preload and called by nothing. Reviews now renders the
  complete review list grouped by all four lifecycle statuses, with empty groups
  stated rather than omitted; Home is unchanged. Found by the scope owner running
  the application at the human gate, who chose this shape over reducing Reviews to
  a detail host or leaving the duplication recorded. No task, dependency edge or
  existing criterion changed; AC-50 joins T9, which owns the renderer surfaces.
  Evidence and authority: `notes/amendments/0002-reviews-surface.md`.
- 2026-09-09: **Amendment 0001.** Corrected the Review shape section's lifecycle
  claim, which described per-unit engine review and human gates that Phase 1
  refuses: `gates-clean` is the only edge into `CODE-REVIEW` and carries the
  `wave check --expect last` guard, so `reviewers-clean --intent-incomplete` is
  unreachable at an intermediate unit boundary. The section now states what the
  engine executes — per-wave GATES, one review and one human gate after the final
  wave — and records unit boundaries as session, context and PR-stack boundaries
  rather than engine gates. Found during EXECUTE at wave 0 after T1 passed its
  gates; seven pre-EXECUTE rounds did not catch it because no brief asked whether
  the engine could execute the described sequence. No task, dependency edge, or
  acceptance criterion changed; the five-unit decomposition stands. Evidence and
  authority: `notes/amendments/0001-review-shape-lifecycle.md`.
- 2026-09-09: Declared the review shape and decomposed delivery into five
  dependency-ordered review units (U1 T1, U2 T2-T5, U3 T6-T7, U4 T8-T9,
  U5 T10), each independently reviewable and each leaving the repository
  working. The slice is DEEP and far above the 2,000 reviewable-line threshold,
  and the task graph is strictly linear, so the units exist for reviewability
  rather than throughput. Owner decision, taken before the approval gate because
  the approved plan hash makes substantive plan edits refusable afterwards. No
  task, dependency edge, or acceptance criterion changed.
- 2026-09-09: Repaired the three findings sustained by pre-EXECUTE review
  round 5 by completing the timeout path rather than the seam the last finding
  pointed at. New AC-49 gives Electron main and preload the crossing between
  AC-47 and AC-48: the timeout reaches the renderer typed and runtime-validated,
  distinguishable from a service-returned error and from AC-33's disconnected
  and incompatible conditions, asserted by T7 against the real preload rather
  than a replaced one. The re-handshake ambiguity is settled in the spec: AC-43
  now scopes re-handshake to the reconnect path after a reported disconnected or
  incompatible state, and AC-48 records that retry after a timeout re-issues on
  the still-live connection without re-handshaking, because AC-47 keeps that
  connection serviceable. T9 now claims AC-25 and AC-48 for the Work Item Studio
  surfaces it builds, with its own labeled-state and timed-out test.
- 2026-09-09: Repaired the two findings sustained by pre-EXECUTE review round 4
  by specifying the timeout contract as a whole rather than patching AC-47.
  AC-47 now covers only the transport outcome it can verify — bounded deadline,
  structured timeout error distinguishable from a service error, released
  pending entry, connection still serviceable, never an inferred completion —
  and stays with T6. New AC-48 owns the renderer outcome and belongs to T8 at
  the TDD-component mode every other renderer state uses. AC-25 now lists the
  timed-out state so the renderer's labeled set is stated once and completely,
  and T8's component test enumerates the same set. The resilience design names
  both halves and records that a transport timeout is not a disconnect and does
  not trigger the AC-33 reconnect path. AC-47 and AC-48 were added to the
  Realizes traces of the sub-sections that realize them.
- 2026-09-09: Repaired the three findings sustained by pre-EXECUTE review
  round 3. Added AC-47 giving a correlated request that is never answered a
  bounded, fail-closed outcome, closing ADR-0004's timeout obligation, and
  carried it into `StudioTransport`'s responsibilities, the resilience
  sub-section, T6, and the Testing Strategy. Moved the contract's backward spec
  edge to the conventional `x-spec` key. Removed the test-artifact sentence from
  AC-45, leaving the Testing Strategy row and T7 to own mode and artifact.
- 2026-09-09: Repaired the six findings sustained by pre-EXECUTE review round 2.
  Recorded `no stub (implementation-discovered)` for T2 through T5, so every
  task now carries one of the two legal dispositions. Required
  `transformationId` on `productIntentRevision`. Restricted the v1 executor-kind
  enum to the four kinds the normative architecture reference admits. Traced
  every Design (LLD) sub-section to its criteria and contract definitions, and
  made the state sub-section defer to the spec's State contract instead of
  restating it. Committed the storage boundary to parameterized statements, with
  a T4 metacharacter round-trip test. Corrected T1's completion predicate so
  exit-zero applies only to the finite commands and `pnpm dev` is proved by
  bounded startup readiness and clean termination.
- 2026-09-09: Repaired the six findings sustained by pre-EXECUTE review round 1.
  Made the actor service-resolved and removed `actorId` from every request;
  created the local human actor at workspace creation. Un-pinned the Review
  Package's reviewed revision from `proposed` so a resolved package validates.
  Added the transformation, workspace name, and initiative fields Home requires.
  Added the renderer Content-Security-Policy and navigation-denial criterion.
  Recorded a legal stub disposition for every task and corrected T1's, T6's,
  T7's, and T9's declared verification modes. Gave AC-01, AC-24, AC-27, AC-32,
  AC-34, and AC-45 their Testing Strategy rows.
- 2026-09-09: Split implementation into dependency-ordered construction tasks;
  defined append-only revision lifecycle, stale-review guards, after-commit
  notifications, production service launch probe, and retained evidence in
  response to shaping and adversarial review.
