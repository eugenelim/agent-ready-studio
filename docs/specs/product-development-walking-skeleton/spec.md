# Spec: Product Development walking skeleton

- **Status:** Draft
- **Owner:** Agent-Ready Studio maintainers
- **Plan:** [`plan.md`](plan.md)
- **Constrained by:** ADR-0001, ADR-0002, ADR-0003, ADR-0004
- **Brief:** [`docs/product/briefs/agent-ready-studio.md`](../../product/briefs/agent-ready-studio.md)
- **Contract:** [`contracts/jsonschema/studio-protocol-v1.schema.json`](../../../contracts/jsonschema/studio-protocol-v1.schema.json)
- **Shape:** mixed

> **Spec contract:** this document defines what done means. Implementation must
> match this spec or update it through review.

## Objective

A multidisciplinary reviewer creates a Product Development workspace without
Git, AgentBundle, credentials, or an agent runtime; frames a versioned Input
Packet; runs an executor-independent transformation through the Studio Service;
reviews the resulting Product Intent proposal; approves it or requests a
revision; and sees the attributable decision and resulting state after restart.
The interface's dominant aesthetic goal is **Decision clarity**: the artifact,
its evidence, current semantic state, and required judgment remain primary while
execution diagnostics remain secondary.

## Durable Outputs

| Semantic role | Applicability | Destination | Owner | Expected evidence | Closeout condition |
| --- | --- | --- | --- | --- | --- |
| User promise | Primary walking-skeleton behavior and setup | `README.md` | Maintainers | Verified setup and behavior | Commands and limitations match shipped code |
| Product scope | Full direction beyond this slice | `docs/product/capability-intents.md`, `docs/product/roadmap.md` | Product maintainers | Intent inventory and horizons | Active queue remains deliberately small |
| Current architecture | Runtime and package truth | `docs/architecture/overview.md`, `docs/architecture/reference.md` | Architecture owner | Package and topology checks | Overview matches implemented tree |
| Decision rationale | Foundation decisions govern the slice | `docs/adr/0001-*.md` through `0004-*.md` | Maintainers | ADR review | ADR status remains Accepted |
| Interface compatibility | Renderer/main/service messages cross a trust boundary | `contracts/jsonschema/studio-protocol-v1.schema.json` | Protocol owners | Validation and transport tests | Implemented methods and messages validate |
| Maintainer procedure | Consistent local contribution path | `AGENTS.md`, `CONTRIBUTING.md`, `docs/CONVENTIONS.md` | Maintainers | Root command verification | Guidance names only real commands |
| Experience direction | Primary screens require a durable quality bar | `docs/product/aesthetic-direction.md`, `docs/product/design-system.md` | Experience owner | Rendered screenshots and interaction checks | Decision clarity and quality-floor checks pass |
| Verification record | Full-mode work needs stable closeout evidence | `docs/specs/product-development-walking-skeleton/notes/verification-ledger.md` | Work-loop implementer | Gate output, runtime versions, screenshots, gaps | Close-work reconciles every criterion and honest blocker |

## Boundaries

### Always do

- Route renderer actions through the narrow typed preload API, Electron main,
  the versioned protocol transport, and Studio Service.
- Validate protocol, persistence, blueprint, capability-manifest, artifact
  content, and executor-result boundaries at runtime.
- Preserve immutable revisions, exact input-revision lineage, attributable
  human decisions, and service-owned SQLite writes.
- Keep Product Development useful with zero installed capability packs and no
  repository or provider configuration.
- Use deterministic fixtures, normalized execution events, honest UI states,
  accessible controls, and graceful child-process shutdown.

### Ask first

- Change an Accepted ADR, the protocol version, the artifact acceptance model,
  or the Product Development module set.
- Add a network service, executable extension mechanism, or privileged renderer
  capability.
- Replace SQLite, Electron, React, TypeScript, pnpm, or the selected Node line.

### Never do

- Accept an executor-produced proposal without an attributable human decision.
- Mutate an artifact revision, expose arbitrary IPC/filesystem/shell access, or
  let the renderer import service or SQLite implementation modules.
- make Git, AgentBundle, an agent provider, a terminal, or a remote service a
  workspace prerequisite.
- Present raw execution events as accepted product artifacts or make execution
  sessions the primary home surface.
- Implement real Claude, Codex, AgentBundle dispatch, worktrees, remote runners,
  authentication, collaboration, cloud sync, or a general plugin marketplace.

## State contract

Revision content and provenance are immutable after insertion. Lifecycle is an
append-only sequence of state records whose latest value projects Draft,
Proposed, Accepted, Rejected, or Superseded; acceptance never rewrites revision
content. An artifact's accepted-revision pointer and the lifecycle records for
the accepted and previously accepted revisions change in one transaction.

An open review targets exactly one proposed revision. Only an open review may
receive an effective decision, and the decision must target the same revision.
Duplicate resolution, a stale target, or a concurrent losing resolution is
rejected without writes. Approval appends Accepted state, resolves the review,
and atomically advances the artifact pointer. Request revision requires a
non-whitespace comment, records the decision and comment, marks that review
revision-needed, and leaves the proposal unaccepted.

A human edit creates a new Proposed revision, appends Superseded state to the
prior outstanding proposal, preserves the accepted pointer, and opens a new
review targeting the new revision. The prior review remains as history and is
not resolvable. Editing an accepted revision follows the same proposal path and
does not replace accepted state until a later approval.

The authoritative lineage set is stored with the proposal. It contains unique,
existing revision IDs and equals the validated execution packet inputs and the
lineage relations exposed by service projections. A mismatch or nonexistent
input is refused before execution. For a human revision there is no execution
packet: the validated base revision is the sole exact input and lineage
relation. A missing or stale base is refused before any revision, lifecycle,
relation, or review write.

## Testing Strategy

| Behavior | Mode | Reason and evidence |
| --- | --- | --- |
| Blueprint, schemas, actor kinds, immutable content, lineage, and transition guards | TDD | Pure rules have crisp counterexamples and fast unit feedback. |
| Method-specific protocol requests, results, notifications, and invalid mismatches | TDD | The process boundary must reject malformed data before dispatch. |
| Migration, transactional decisions, duplicate/stale attempts, and reopen persistence | TDD integration | SQLite constraints and transaction behavior are part of the contract. |
| Deterministic Input Packet to Product Intent to review | TDD integration | The service path must prove real abstractions rather than renderer mocks. |
| Handshake, correlation, after-commit notifications, disconnect, restart, and bounded shutdown | Goal-based integration | Observable behavior spans streams and lifecycle ownership. |
| Review Inbox, editor, decisions, loading, error, and disconnected states | TDD component | User states are deterministic against the narrow preload contract. |
| Decision clarity, pane overflow, theme parity, focus, touch-safe actions, and reduced motion | Visual/manual QA | Inspect headful Electron when available; otherwise render the production renderer in headless Chromium at the required viewports and retain screenshots plus automated accessibility/overflow assertions. |
| Complete create, transform, review, decision, and restart flow | Goal-based end-to-end | This is the cheapest proof that all real boundaries compose. |

## Acceptance Criteria

- [ ] **AC-01** A fresh clone exposes working `pnpm install`, `pnpm dev`, `pnpm lint`,
  `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm verify` commands; no
  command is a placeholder success.
- [ ] **AC-02** Renderer workspace creation persists name, optional description,
  `product-development` blueprint ID/version, timestamps, and an empty pack list
  without asking for Git, AgentBundle, credentials, providers, or network.
- [ ] **AC-03** The validated blueprint exposes exactly Overview, Strategy, Research,
  Experience, Architecture, Delivery, Release, and Outcomes. Reviews is global
  navigation, not a ninth blueprint module.
- [ ] **AC-04** Research, Experience, Architecture, Delivery, Release, and Outcomes each
  render a purpose-specific empty state with no fabricated chart or metric.
- [ ] **AC-05** Initiative is a typed artifact and relation composition, not a
  dedicated persistence table.
- [ ] **AC-39** Explicit demo seed idempotently creates one “Build Agent-Ready
  Studio” initiative with the desired outcome from the Ready brief.
- [ ] **AC-06** A versioned Input Packet contains objective, source notes, target users,
  known context, constraints, non-goals, and expected output type, using
  meaningful Agent-Ready Studio content.
- [ ] **AC-07** The transformation `strategy.frame-product-intent` accepts only a valid,
  existing Input Packet revision and identifies eligible executor kinds without
  naming a provider in its semantic definition.
- [ ] **AC-08** The deterministic fake executor receives a typed packet and emits stable
  started, progress, result, and completion data with no random or generated
  time-dependent content.
- [ ] **AC-09** Product Intent content requires title, outcome, opportunity, target users,
  assumptions, guardrails, non-goals, confidence, and open questions.
- [ ] **AC-29** Fake output deterministically maps meaningful fields from the
  seeded Input Packet into every required Product Intent field.
- [ ] **AC-10** A proposal records immutable content/provenance, schema version, producer,
  transformation, exact unique input revision IDs, creation time, and a current
  lifecycle projection of Proposed; no accepted pointer changes during run.
- [ ] **AC-11** Execution packet inputs, stored proposal lineage, lineage relations, and
  the revision IDs displayed in Work Item Studio are equal. Missing or
  mismatched input IDs cause no execution or proposal writes.
- [ ] **AC-12** Human is a valid actor and executor kind in domain and execution
  contracts without an agent provider.
- [ ] **AC-30** Saving edited Product Intent content creates a new Proposed
  revision with every required field, supersedes
  the prior outstanding proposal, preserves history and accepted state, and
  opens a review targeting only the new revision. Its exact lineage contains the
  validated base revision; a missing or stale base produces no writes.
- [ ] **AC-13** Resolving a review with a stale revision, a second decision, or a
  concurrent losing attempt is rejected without changing artifact, review, or
  decision state.
- [ ] **AC-14** Home groups real projections into Needs your decision, Running, Blocked or
  revision requested, and Recently completed and shows workspace/initiative,
  artifact title/type, decision reason, producer/transformation, labeled status,
  created time, and unresolved-question count.
- [ ] **AC-40** `home.get` reconstructs every Inbox group after reload without
  notification history.
- [ ] **AC-15** Work Item Studio renders three persistent regions at desktop width:
  workflow/lineage left, artifact center, and review/decision right; Run details
  appears only after selecting its tab.
- [ ] **AC-41** `review.get` reconstructs the complete Review Package after
  reload: content, accepted baseline, inputs, evidence, comments, decisions,
  change summary, execution timestamps, and normalized events.
- [ ] **AC-16** Input shows the exact execution input revision. Evidence lists lineage and
  evidence relations or says “No external evidence linked.” Change summary
  compares structured proposal fields with the current accepted revision or
  says “No accepted baseline” for the first proposal.
- [ ] **AC-17** Approve and advance atomically records one attributable human Decision,
  appends Accepted lifecycle state, supersedes any prior accepted lifecycle
  state, advances the artifact pointer, resolves the matching review, and
  preserves all revision content.
- [ ] **AC-18** Request revision rejects absent, empty, or whitespace-only
  comments without writes.
- [ ] **AC-31** A valid revision request records the comment and attributable
  Decision, leaves the
  proposal unaccepted, and marks the matching review revision-needed.
- [ ] **AC-19** Workspaces, artifacts/revisions/lifecycle, relations, reviews/comments,
  decisions, executions/events, and accepted pointers retain the same semantic
  state after service close and database reopen.
- [ ] **AC-20** Protocol v1 validates method-specific request params, result payloads, and
  notification payloads; method/payload mismatches and unknown fields receive a
  structured error without dispatch.
- [ ] **AC-21** `system.hello` refuses an incompatible protocol version before
  any other method dispatch.
- [ ] **AC-32** Service stdout contains only one JSON protocol message per line;
  logs and diagnostics use stderr.
- [ ] **AC-22** Normalized events persist in the same transaction as semantic state;
  notifications publish only after commit, rolled-back operations publish
  nothing.
- [ ] **AC-42** Renderer reconnect reloads authoritative `home.get` and
  `review.get` projections rather than replaying notification history.
- [ ] **AC-23** Electron main owns the child and transport, exposes no process
  primitive, and closes the service and SQLite within five seconds of requested
  shutdown.
- [ ] **AC-33** Electron main reports disconnected and incompatible states to
  preload with a bounded retry that re-handshakes before dispatch.
- [ ] **AC-24** The BrowserWindow uses `nodeIntegration: false`,
  `contextIsolation: true`, and `sandbox: true`.
- [ ] **AC-34** Preload exposes only typed, runtime-validated,
  purpose-specific workspace, artifact, execution, and review methods.
- [ ] **AC-25** Review Inbox and Work Item Studio show labeled loading, no-work,
  execution-failed, service-disconnected, protocol-incompatible, and retrying
  states.
- [ ] **AC-43** Retry re-handshakes, re-queries authoritative state, and never
  invents completion from a lost or stale notification.
- [ ] **AC-26** Rendered review surfaces pass Decision clarity: the artifact and
  required decision are visible without opening Run details.
- [ ] **AC-35** Proposal and accepted labels use non-color cues and remain
  distinct in both light and dark themes.
- [ ] **AC-36** Every interactive control has visible keyboard focus and an
  accessible name.
- [ ] **AC-37** At 200% zoom and at a 1024px-wide viewport, decision controls
  remain reachable without two-dimensional page scrolling.
- [ ] **AC-38** Reduced-motion and non-hover input modes retain every action and
  every state change remains understandable without decorative motion.
- [ ] **AC-44** After restart, a resolved Work Item displays the persisted
  Decision ID, human actor name, action, comment when present, and timestamp.
- [ ] **AC-27** A packaged or production-built desktop path launches the real child
  service, migrates a fresh database, completes `health.get`, and exits within
  five seconds. If packaging cannot run in this environment, the production
  build plus an equivalent spawned-service integration is recorded explicitly
  as the remaining packaging gap.
- [ ] **AC-28** One end-to-end proof drives renderer boundary to Electron transport to
  real service to SQLite through create, seed, transform, approve or request
  revision, restart, and retained state without network or credentials.

## Follow-ons

- Rich artifact renderer/editor registry, semantic diffs, evidence provenance,
  and graph-based applicability.
- Optional Agent-Ready and repository capability packs with durable gates and
  provider-specific executors.
- Collaboration, sensitive-data controls, remote runners, integrations, visual
  canvases, and portfolio/outcome projections.

## Assumptions

- Node 24 is the intended supported LTS line even though the bootstrap machine
  currently runs a newer Node release. Source: Accepted ADR-0001 and the
  normative architecture reference.
- Local persistence uses pinned `better-sqlite3` 13.0.3. The pre-approval probe
  proves its prebuild loads under Electron 43.6.0 / Node 24.20.0 without a
  rebuild; the production-child smoke remains the packaged-path confirmation.
  Source: Accepted ADR-0001 and `notes/native-runtime-probe.md`.
- One local human actor is sufficient for the first slice; authentication and
  authorization are out of scope. Source: Ready delivery brief and user-provided
  scope, confirmed 2026-09-09.
- Purpose-built Input Packet and Product Intent forms are preferable to a
  generalized schema-form framework in this slice. Source: Ready delivery brief
  and user-provided scope, confirmed 2026-09-09.
