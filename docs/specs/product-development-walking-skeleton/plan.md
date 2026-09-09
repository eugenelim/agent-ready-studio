# Plan: Product Development walking skeleton

- **Status:** Drafting
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

SQLite migrations create tables for workspaces, actors, artifacts,
artifact_revisions, artifact_revision_states, relations, reviews,
review_comments, decisions, transformations, executions, execution_events, and
schema_migrations. Foreign keys and transaction boundaries enforce exact
lineage and atomic review resolution. Revision content/provenance rows and
lifecycle rows are insert-only; artifact rows hold the nullable current
accepted revision ID.

Structured content and validated metadata are stored as canonical JSON text.
Reads validate and map rows before they cross the storage boundary.

### Interfaces & contracts

Protocol v1 implements `system.hello`, `health.get`, `blueprint.list`,
`workspace.create`, `workspace.list`, `workspace.get`, `demo.seed`, `home.get`,
`execution.start`, `review.list`, `review.get`, `artifact.revise`, and
`review.resolve`. `home.get` returns all four inbox groups, including running
and failed execution work. `review.get` returns the complete Review Package for
every Work Item region. Notifications cover workspace creation, execution
lifecycle, proposal creation, review request, decision record, and revision
acceptance.

`StudioTransport` owns request correlation, method-to-result validation,
notification subscription, disconnect behavior, and shutdown. Electron main
owns a child-process adapter;
preload exposes a frozen `studio` API with domain-specific methods only.

### Component / module decomposition

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

`workspace.create` installs the Product Development blueprint with no packs.
`demo.seed` idempotently creates the local human, initiative, and Input Packet.
`execution.start` validates an applicable transformation and exact input
revision, records Running, invokes the fake executor, stores normalized events,
inserts a Proposed Product Intent revision plus lineage, requests review, and
records Completed without accepting the proposal.

`review.resolve(approve)` runs one transaction: validate open review, exact
target revision, and human actor; create Decision; append Accepted and any
Superseded lifecycle rows; update the artifact accepted pointer; resolve the
review; and persist normalized events. Notifications publish only after commit.
`review.resolve(requestRevision)` requires a nonblank comment, records comment
and Decision, leaves the proposal unaccepted, and marks revision-needed.
`artifact.revise` inserts a new human-produced proposal, supersedes the prior
outstanding proposal through lifecycle, closes its resolvable review, and opens
a review targeting the new revision; it never updates revision content.

### Behavior & rules

- IDs are stable prefixed UUIDs in production and injectable deterministic IDs
  in tests.
- Timestamps come from an injectable clock; executor-generated content never
  depends on the clock.
- Fake executor output derives only from typed Input Packet content and a fixed
  template.
- Review projections group items for the inbox; diagnostic events do not become
  artifact content.

### Failure, edge cases & resilience

- Invalid or incompatible protocol messages receive structured JSON-RPC errors
  without crashing or corrupting stdout.
- A missing or exited service produces a renderer-visible disconnected state
  and bounded restart action.
- Failed execution records failure and diagnostics while preserving inputs.
- Transactions roll back partial proposal/review/decision writes.
- Rolled-back work publishes no notification; reconnect always reloads the
  service projection rather than reconstructing state from notifications.
- Shutdown stops new requests, completes or fails the active operation, closes
  SQLite, then terminates the child within a bounded grace period.

### Quality attributes (NFRs)

- Security: no Node integration, context isolation and sandbox enabled, narrow
  preload, no active generated HTML, no generic shell or filesystem endpoint.
- Accessibility: semantic elements, labels, keyboard operation, visible focus,
  4.5:1 text contrast where applicable, non-color status cues, reduced motion.
- Reliability: migration-from-empty, transactional transitions, deterministic
  execution, restart persistence, stderr-only service logs.
- Maintainability: strict TypeScript, explicit package exports, one lint/format
  setup, small public interfaces, and truthful docs.

### Dependencies & integration

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

## Tasks

### T1: Establish repository and durable product surface

**Depends on:** none

**Verification mode:** TDD for manifest checks; document reconciliation.

**Implements:** Objective durable repository outcome; AC-01.

**Tests:**
- Root-manifest assertions cover every required command and Node/pnpm pins
  (AC-01).
- Capability inventory check counts every required stable ID exactly once.

**Approach:**
- Create workspace manifests, strict TS config, one formatter/linter setup, and
  ignored output rules.
- Author charter, roadmap, capability inventory, contributor guidance, and a
  small active workspace queue.

**Done when:** manifest checks pass and all durable documents resolve their links.

### T2: Implement protocol and extension contracts

**Depends on:** T1

**Verification mode:** TDD.

**Implements:** Protocol/blueprint behavior; AC-03, AC-07, AC-20, AC-21,
AC-40, AC-41, AC-44.

**Tests:**
- TDD stub: a `workspace.create` envelope carrying `review.resolve` params is
  rejected by the protocol validator (AC-20).
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

**Depends on:** T2

**Verification mode:** TDD.

**Implements:** Immutable semantic state; AC-09 through AC-13, AC-17, AC-18,
AC-30, AC-31.

**Tests:**
- TDD stub: attempting to approve a revision whose ID differs from the open
  review target returns a stale-review error and no transition (AC-13).
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

**Depends on:** T3

**Verification mode:** TDD integration.

**Implements:** Durable transactional state; AC-17 through AC-19, AC-22.

**Tests:**
- TDD stub: closing and reopening a migrated database retains the accepted
  revision pointer and its attributable decision (AC-19).
- Integration tests cover fresh migration, foreign keys, unique lineage,
  insert-only revision/state records, atomic branches, and rollback.

**Approach:**
- Implement storage interfaces and version-1 migrations using better-sqlite3.
- Map and validate rows at the storage boundary; centralize transactions for
  execution completion and review resolution.

**Done when:** storage integration tests pass against fresh temporary files.

### T5: Implement application service and fake executor

**Depends on:** T4

**Verification mode:** TDD integration.

**Implements:** End-to-end service semantics; AC-02, AC-05 through AC-13,
AC-17 through AC-19, AC-22, AC-29 through AC-31, AC-39 through AC-44.

**Tests:**
- TDD stub: the seeded Input Packet produces a deterministic Product Intent
  proposal and open review while leaving accepted revision null (AC-05 through
  AC-11).
- Service tests cover zero-pack workspace creation, idempotent demo seed,
  exact lineage, normalized events, failure recording, both decisions, human
  revision, and stale/duplicate refusal (AC-02, AC-05 through AC-13, AC-17,
  AC-18).

**Approach:**
- Implement application handlers over storage/domain interfaces.
- Implement and register only the deterministic executor for the semantic
  `strategy.frame-product-intent` transformation.

**Done when:** the service integration suite proves both persisted review paths.

### T6: Implement NDJSON server and transport client

**Depends on:** T5

**Verification mode:** Goal-based spawned-process integration.

**Implements:** Versioned process contract; AC-20 through AC-23, AC-32,
AC-33, AC-40 through AC-44.

**Tests:**
- TDD stub: an incompatible `system.hello` request returns the version error
  and does not dispatch another method (AC-21).
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

**Depends on:** T6

**Verification mode:** TDD and production-path smoke.

**Implements:** Privileged boundary and service lifecycle; AC-23, AC-24,
AC-27, AC-33, AC-34.

**Tests:**
- Main-process tests assert secure BrowserWindow preferences and the absence of
  generic IPC, process, shell, or filesystem methods (AC-24).
- Lifecycle tests cover child location, incompatible handshake, unexpected
  exit, bounded restart, and graceful application quit (AC-23, AC-27).

**Approach:**
- Configure electron-vite main, preload, and renderer entries.
- Spawn the unpacked service with Electron running as Node and piped stdio,
  validate both sides of IPC, and expose a frozen purpose-specific preload API.

**Done when:** Electron boundary tests pass and the production service entry is
addressable outside ASAR.

### T8: Implement workspace shell and Review Inbox

**Depends on:** T7

**Verification mode:** TDD component.

**Implements:** Workspace and decision-inbox experience; AC-02 through AC-04,
AC-14, AC-25, AC-33, AC-39, AC-40, AC-42, AC-43.

**Tests:**
- Component tests create a workspace through preload and render all four inbox
  groups plus loading, empty, disconnected, incompatible, failed, and retrying
  states (AC-02, AC-14, AC-25).
- Navigation tests cover exactly eight blueprint modules and the six honest
  empty states (AC-03, AC-04).

**Approach:**
- Implement semantic design tokens, accessible primitives, global/workspace
  navigation, workspace creation, explicit seed action, and inbox projections.
- Re-query authoritative state after notifications and reconnects.

**Done when:** renderer tests prove workspace creation and live inbox updates
without service implementation imports.

### T9: Implement Work Item Studio and review actions

**Depends on:** T8

**Verification mode:** TDD component plus visual/manual QA.

**Implements:** Artifact-first review and experience quality; AC-11 through
AC-18, AC-26, AC-30, AC-31, AC-35 through AC-38, AC-41, AC-44.

**Tests:**
- Component tests cover three-region layout, tabs, exact revision lineage,
  evidence/no-evidence, change baseline/no-baseline, Run details disclosure,
  editor revision, approval, and required revision comment (AC-11 through
  AC-18).
- Reloaded resolved-package tests show Decision ID, actor, action, comment, and
  timestamp from the service projection (AC-41, AC-44).
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
- 2026-09-09: Split implementation into dependency-ordered construction tasks;
  defined append-only revision lifecycle, stale-review guards, after-commit
  notifications, production service launch probe, and retained evidence in
  response to shaping and adversarial review.
