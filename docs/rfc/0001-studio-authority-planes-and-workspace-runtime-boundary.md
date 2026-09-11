# RFC-0001: Agent-Ready Studio authority planes, component topology, and Workspace Runtime boundary

- **Status:** Accepted
- **Author:** eugenelim
- **Approver:** Agent-Ready Studio maintainers
- **Date opened:** 2026-09-11
- **Date closed:** 2026-09-11
- **Decision weight:** heavy
- **Related:** [ADR-0001](../adr/0001-electron-client-and-studio-service.md),
  [ADR-0002](../adr/0002-workspace-extension-model.md),
  [ADR-0003](../adr/0003-artifact-revisions-and-decisions.md),
  [ADR-0004](../adr/0004-versioned-json-rpc-ndjson-boundary.md),
  [reference architecture](../architecture/reference.md),
  [capability intents](../product/capability-intents.md)

## Decision outcome

Accepted by the maintainers on 2026-09-11. This section records what was
decided; the body below is the argument that was accepted and is unchanged
except where it would now misstate the outcome.

| ID | Question | Outcome |
| --- | --- | --- |
| D1 | Split execution authority out of the Studio Service? | **Accepted, provisionally.** The five-plane model is adopted. The `apps/workspace-runtime` process boundary is gated on Connect and Orient being delivered — see §Acceptance sequencing |
| D2 | Does the Workspace Runtime get its own repository? | **Accepted as recommended.** No third repository. The Runtime is an application inside this monorepo |
| D3 | Where do runtime contracts live? | **Accepted as recommended — Option A.** A separately versioned `packages/runtime-protocol` with external schemas under `contracts/jsonschema/runtime`. Neither is created yet |
| D4 | Root folder semantics? | **Accepted as recommended.** `apps/` runnable, `packages/` libraries, `contracts/` external schemas, `tools/` repo-local, `infra/` deferred. `apps/` stays flat |
| D5 | Does the charter change? | **Accepted as recommended.** A separate charter RFC is *to be opened* using the §Proposal delta as its starting text — follow-on item 2, not yet done. This RFC does not change the charter |

**Two caveats the maintainers accepted along with the decisions.**

D3 was accepted ahead of its evidence. §Options considered argues that Option
A's advantage depends on a second, independently released runtime deployment
existing, and that no work currently in view can demonstrate it. Accepting D3
settles the *placement* so that later work has one answer instead of inventing
several; it does not claim the cost is proven. The counter-argument is retained
in full, and the risk is retained in §Risks. If a cloud runtime never ships,
Option C would have been cheaper.

D3 is also moot if D1 is falsified. It answers where a runtime contract lives,
not whether there is a runtime. Should the Connect and Orient gate withdraw D1,
D3 lapses with it.

**Nothing is created by this acceptance.** No directory, package, or schema root
is added; `packages/runtime-protocol` and `contracts/jsonschema/runtime` are
created when the runtime specification defines a real contract. No capability
intent changes status, and the charter is untouched.

## Reviewer brief

- **Decision:** where the authority to *execute* work lives, given that the
  captured capability portfolio points Studio at running agents against real
  repositories, and what component boundary carries it.
- **Outcome:** the five-plane authority model is adopted; D2, D3, D4, and D5
  are accepted as recommended; the `apps/workspace-runtime` boundary (D1)
  remains *provisional*, gated on Connect and Orient having been delivered. See
  §Decision outcome and §Acceptance sequencing.
- **In effect on acceptance:**
  - The five planes become the vocabulary every later capability is shaped
    against, and the root folder semantics get a written test.
  - The Runtime stays in this monorepo; no third repository (D2).
  - The runtime contract's placement is settled as Option A (D3), to be created
    when a real contract exists.
  - A separate charter RFC becomes warranted, to be opened from the §Proposal
    delta. It does not exist yet.
  - Nothing is created, moved, or renamed.
- **In effect only after Connect and Orient has been delivered:**
  - A third application boundary, `apps/workspace-runtime`, becomes the
    sanctioned home for materialization and executor hosting — specified
    before it is scaffolded.
  - The Studio Service loses any claim to execution-plane authority; it keeps
    product and control authority.
  - A separately versioned Studio Runtime Protocol becomes the only supported
    coupling between the two.
- **Affected surface:** repository root semantics, the reference architecture,
  the charter's scope statement, and the sequencing of 64 Draft capability
  intents. No implemented code.
- **Stakes:** costly. The plane split is cheap to write and expensive to
  retrofit — every capability that assumes the Studio Service may touch a
  working tree becomes a migration if we decide this later.
- **Review focus (as reviewed):** whether the execution plane is genuinely
  separable from the control plane at this stage, and whether Option A's extra
  package earns its cost before a second runtime deployment exists.
- **Not in scope:** scaffolding the runtime, cloud infrastructure design,
  choosing an agent provider, and any change to a reviewed capability intent.

## The ask

**Recommendation.** Adopt a five-plane authority model — Product, Control,
Execution, Capability, Source — and make the Execution plane a distinct,
replaceable process (`apps/workspace-runtime`) that the Studio Service drives
through a separately versioned Studio Runtime Protocol. Keep it inside this
monorepo. Do not scaffold it until a specification exists.

**Why now.** The repository has a shipped walking skeleton and an accepted
two-application architecture (ADR-0001) in which the Studio Service is the
single SQLite writer and the only durable authority. That is correct for the
product plane. The capability capture that has since landed — 64 Draft intents
across eight initiatives — points the product at materializing third-party
repositories, hosting coding agents, reconciling working trees, and producing
Git proposals.

Those intents are **Draft and carry no commitment**: the
[index](../product/capability-intents.md) states that a Draft intent "has not
been shaped, validated, approved, funded, or scheduled, and nothing in it is a
commitment." The argument here does not rest on them being commitments. It
rests on something weaker and checkable: that this direction is *captured
across the whole portfolio*, that INI-004 is an `active` initiative whose Wave 1
steel thread already needs one piece of it — inspecting a public GitHub URL
without a persistent clone — and that the question of which process performs
that inspection will be answered by whichever capability is shaped first if it
is not answered deliberately.

That is the actual urgency. It is about *ordering*, not commitment. Deciding
after the first execution-touching capability is shaped means inheriting its
answer; deciding before costs one RFC.

| ID | Question | Recommendation | Why | Outcome |
| --- | --- | --- | --- | --- |
| D1 | Do we split execution authority out of the Studio Service? | Yes — five planes, execution in its own process | Product authority and untrusted-content handling must not share a process or a database | **Accepted provisionally** — planes adopted; process boundary gated on Connect and Orient |
| D2 | Does the Workspace Runtime get its own repository? | No — an application in this monorepo | Repository separation is not a security boundary; process and filesystem boundaries are | **Accepted** |
| D3 | Where do runtime contracts live? | Option A — `packages/runtime-protocol` plus `contracts/jsonschema/runtime` | Independent versioning is the point of a replaceable runtime | **Accepted**, ahead of its evidence and with the §Risks caveat retained. Nothing created yet |
| D4 | What are the root folder semantics? | `apps/` = independently runnable, `packages/` = libraries, `contracts/` = external schemas, `tools/` = repo-local, `infra/` deferred | "App" currently reads as "frontend"; a runtime and a service both belong in `apps/` | **Accepted** |
| D5 | Should a charter RFC be opened, using the §Proposal delta as its starting text? | Yes — and **this RFC does not decide the charter's substance** | Current scope forbids what the portfolio plans, without saying what is permanently forbidden | **Accepted** — charter RFC to be opened |

### Acceptance sequencing

This RFC's load-bearing assumption — that the execution plane is genuinely
separable at this stage — is **untested** (see §Risks). Recording D1's process
boundary in an ADR before the work that could falsify it has run would be the
wrong order, so acceptance is staged. The maintainers accepted this staging.

**Stage 1 — in effect on acceptance.**

- D2, the repository placement. No third repository; the Runtime is an
  application in this monorepo.
- D3, the runtime contract placement — Option A. Accepted ahead of its
  evidence, so that later work inherits one answer rather than inventing
  several. **Nothing is created**: `packages/runtime-protocol` and
  `contracts/jsonschema/runtime` appear when the runtime specification defines
  a real contract. The §Risks caveat stands.
- D4, the root folder semantics. It renames nothing and only writes down a test
  for where a component belongs.
- D5, the charter delta, as the *basis for a separate charter RFC* — not as a
  charter edit.
- The five-plane authority model **as the vocabulary and the design under
  test**. The planes are an analytical frame; adopting them costs nothing that
  is hard to reverse and makes the rest of the argument checkable.

**Stage 2 — gated on Connect and Orient having been *delivered*, not shaped.**

- D1's process boundary alone, as a durable ADR. This is the only decision the
  gate still governs.

Shaping is design work and proves nothing, so the gate is the delivered
result. Two honest caveats about how good a test that is:

- [`connect-and-orient-steel-thread.md`](0001-notes/connect-and-orient-steel-thread.md)
  **presupposes delegation to a Workspace Runtime** in its flow. It is written
  from inside this RFC's proposal, so it is not a neutral comparison of both
  arrangements. What it can do is expose whether the delegation carried its
  weight.
- Its definition-of-done item 11 — that the same request can later target a
  cloud runtime — is provable at *design* time from the contract's shape. It is
  a necessary condition, not the falsification test.

**The actual Stage 2 gate criteria**, assessed after Connect and Orient ships:

1. Does the runtime hold state, supervision, or policy that the Studio Service
   could not hold without taking on untrusted content? If the answer is no —
   the runtime turned out to be a thin call — **D1 is falsified.**
2. Was any isolation property (definition-of-done items 2 and 3) actually
   enforced by the boundary rather than by convention?
3. Did the contract need any local-filesystem assumption to express the
   inspection request?

Criterion 1 is the decisive one and it is genuinely capable of returning "no".

**The gate does not test D3, which was accepted anyway.** Connect and Orient
explicitly excludes cloud execution, so it cannot produce evidence for the one
condition on which Option A beats Option C — that a second, independently
released runtime deployment exists. The maintainers accepted D3 on the
judgement that settling placement early is worth more than waiting for that
evidence. Creation is still deferred: `packages/runtime-protocol` and
`contracts/jsonschema/runtime` appear when the runtime specification defines a
real contract.

If the Stage 2 gate fails, the recorded outcome is that the execution plane is
not separable at this stage; D1 is withdrawn; D3 lapses with it, since a
contract placement for a runtime that does not exist decides nothing; and no
runtime package was created, because neither stage creates one. D2 survives a
failed gate — it says only that if there is a runtime it lives here, which
costs nothing if there is none.

**The trial needs a runtime, so the sequence authorizes one.** Delivering
Connect and Orient requires *some* runtime, and forbidding every runtime until
after the gate would make the gate unreachable. The follow-on sequence
therefore authorizes a **provisional, time-boxed trial runtime** at the same
step as the trial: a spike, explicitly not `apps/workspace-runtime`, built
against a provisional contract rather than `packages/runtime-protocol`, and
discarded or rewritten afterwards. The durable component and the contract
package stay forbidden until their own later steps.

**How the gate result is recorded.** This RFC is frozen history from acceptance
onward, so the Stage 2 result does not reopen it. A pass produces D1's ADR. A
failure produces an ADR recording that the execution plane is not separable at
this stage, and this RFC's `Status` field gains a superseded-in-part pointer to
that ADR — the one field
[`CONVENTIONS.md`](../CONVENTIONS.md) makes mutable on a frozen document. Trial
findings belong in a linked spike note, not in this body.

## Problem & goals

### Diagnosis

Three specific defects in the current architecture-to-portfolio fit, each
checkable against a named artifact:

**1. The charter's non-scope and the portfolio contradict each other, with no
statement of which exclusions are permanent.** The
[charter](../CHARTER.md) says the project "does not include real provider
dispatch, repository automation, arbitrary command execution, authentication,
cloud sync, remote runners, collaboration, or a general plugin marketplace in
the initial product." The qualifier "in the initial product" makes the whole
list temporal. INI-007 captures thirteen intents that do exactly these things.
Nothing currently distinguishes *deferred* from *never*, so the non-scope list
cannot refuse anything — its only reading is "not yet". A scope list that
cannot refuse is not doing its job, and the charter itself says the "does not"
list is "how we — and AI agents working in the repo — know when a request is
out of bounds."

**2. There is no component stereotype that fits a Workspace Runtime.** The
[reference architecture](../architecture/reference.md) names exactly two
application roles: an Electron client and a Studio Service that is "a
standalone Node.js modular monolith". Its dependency rules route everything
through "Studio Service transport → application use cases → domain/storage
ports". A process whose job is to clone untrusted repositories and supervise
agent subprocesses has no sanctioned position in that model. Absent a
stereotype, the path of least resistance is to add it to the Studio Service.

The current architecture in fact points that way: `reference.md` assigns the
Studio Service "composition of domain, execution, blueprint, and storage
adapters", so service-side execution composition is already sanctioned, and
neither ADR-0001 nor the dependency rules prohibit it.

**This RFC proposes a new trust rule, and does not claim one already exists.**
The proposed rule is that the process which is the single writer of accepted
product state should not also host untrusted repository content and agent
subprocesses. The existing architecture does not say this, because nothing in
it yet handles untrusted content — `executor-fake` is deterministic and
in-process, and no source is ever materialized. The rule becomes load-bearing
only when the portfolio's execution capabilities arrive, which is why it is
proposed now rather than assumed.

Being a proposal, it needs support this RFC does not yet supply: a threat model
for materialized third-party content, and the validation named in §Acceptance
sequencing. A reviewer is entitled to reject the rule outright; the honest
consequence is recorded in
[`post-acceptance-follow-ons.md`](0001-notes/post-acceptance-follow-ons.md).

**3. Execution-plane concerns are already scattered across initiatives that
cannot each redecide them.** Materialization appears in ARS-REPO-001 and
ARS-REPO-008; reconciliation in ARS-RUN-008; process supervision in
ARS-RUN-007; sandboxing in ARS-RUN-009; worktrees and proposals in ARS-RUN-005.
These sit in three different initiatives with three different horizons. Each
will otherwise invent its own answer to "which process owns the working tree",
and the first one shaped wins by accident rather than by decision.

### Goals

- Name every authority in the system and give each exactly one owner.
- Give the execution plane a component stereotype and a process boundary before
  any capability that needs one is shaped.
- Make local and cloud execution the same semantic contract, so that choosing
  cloud later is a deployment decision and not a redesign.
- State which charter exclusions are permanent and which are sequencing.
- Give the 64 reviewed capability intents an architectural reading without
  touching them.

### Non-goals

These are plausible goals deliberately excluded, not merely undesirable
outcomes.

- **Designing the cloud runtime.** Container lifecycle, snapshot storage,
  scheduling, and tenancy are real design work. This RFC constrains them only
  by requiring semantic parity with the local runtime.
- **Choosing an executor or agent protocol.** §Proposal assigns roles to MCP,
  ACP, A2A, AG-UI, and A2UI so they stop competing for the same slot. It
  commits to implementing none of them.
- **Re-sequencing the roadmap.** The companion mapping note is an analytical
  overlay. The eight canonical initiative groups and the roadmap's wave
  ordering remain authoritative.
- **Resolving the recorded split findings.** The shaping review's dominant
  finding was that roughly a third of the intents carry over-broad outcomes.
  Each affected intent already records the separability as an unresolved
  question. Acting on them is `frame-intent`'s job, not this RFC's.
- **A monorepo component scaffolder.** Architecture-aware scaffolding across
  client/service/runtime/worker/library stereotypes is attractive and is
  explicitly deferred; see §Proposal, "Tooling boundary".

## Proposal

### Current implemented topology

This is what the repository contains today, verified against
[the architecture overview](../architecture/overview.md) and the workspace
manifests. Nothing in this section is a proposal.

```
apps/
  desktop/                          Electron main, preload, React renderer
  studio-service/                   JSON-RPC dispatch, use cases, storage composition

packages/
  domain/                           entities, transitions, invariants
  protocol/                         protocol types, Zod schemas, fixtures, NDJSON
  workspace-sdk/                    blueprint, artifact-type, review-model contracts
  blueprint-product-development/    the first-party blueprint
  execution-sdk/                    execution packets, executor contracts, events
  executor-fake/                    deterministic walking-skeleton executor
  storage-sqlite/                   migrations and storage implementations

contracts/
  jsonschema/                       versioned public protocol schema

tools/                              repo-local lint and trace utilities
```

Two applications, seven packages. The Studio Service is the only SQLite writer;
the renderer reaches it only through the typed preload boundary. There is no
runtime process, no materialization, and no provider dispatch.

### Proposed future topology

```
apps/
  desktop/                          unchanged — client surface
  studio-service/                   unchanged role — product + control plane
  workspace-runtime/                PROPOSED. Not scaffolded. Not implemented.

packages/
  domain/  protocol/  execution-sdk/  workspace-sdk/
  blueprint-product-development/  storage-sqlite/  executor-fake/
  runtime-protocol/                 PROPOSED under D3 Option A

contracts/
  jsonschema/
    studio/                         PROPOSED grouping for the existing schema
    runtime/                        PROPOSED — created only with a versioned contract
```

`apps/workspace-runtime` and `packages/runtime-protocol` do not exist. No
directory is created, moved, or renamed by this RFC.

Two notes on the `contracts/` block, so the diagram is not read as current
state. The repository today holds exactly one schema file,
`contracts/jsonschema/studio-protocol-v1.schema.json`, directly under
`jsonschema/` with no `studio/` subdirectory. Grouping it under `studio/` is a
proposed relocation that becomes worthwhile only when a second schema family
exists — that is, only alongside `runtime/`.

**D3 did not decide this relocation.** What D3 accepted is where the *runtime*
contract lives: `packages/runtime-protocol` and `contracts/jsonschema/runtime`.
Moving the existing `studio-protocol-v1.schema.json` under a `studio/` grouping
is a separate, compatibility-sensitive change to a published public schema path,
and it needs its own decision. The flat layout stands until then.

### Authority planes

Five planes. Each authority has exactly one owning plane; a component may
implement more than one plane, but a plane is never co-owned.

#### Product plane

- **Owns:** workspaces, initiatives, typed artifacts, immutable revisions,
  evidence and lineage, reviews and comments, decisions, accepted state, and
  multidisciplinary product-work semantics.
- **Does not own:** how work is produced, which executor produced it, whether a
  process is alive, or any repository working tree.
- **Implemented by:** `apps/studio-service` today (domain and use-case
  modules), surfaced by `apps/desktop`.
- **Crossing its boundary:** proposed revisions with their exact input revision
  IDs, review packages, decisions. Never raw executor output.
- **Durable:** all of it. This is the system of record.
- **Disposable:** nothing.

#### Control plane

- **Owns:** source registrations, durable run records, scheduling, claims and
  leases, durable human gates, advancement policies, runtime selection,
  credential *references* (never credential material), and cross-repository
  coordination.
- **Does not own:** artifact semantics, acceptance, or any execution mechanic.
  It decides *that* a run happens and *where*; never *what the result means*.
- **Proposed owner:** `apps/studio-service`, alongside the product plane and in
  the same SQLite database — they share a trust level and a process.
  **Not implemented today.** Source registration, durable runs, scheduling,
  claims, leases, gates, and runtime selection do not exist in the repository;
  see the [authority ledger](0001-notes/current-state-and-authorities.md#authority-ledger--current-versus-accepted-direction).
- **Crossing its boundary:** runtime requests and normalized run events
  northbound; scheduling and lifecycle commands southbound.
- **Durable:** run records, claims, leases, gate state, source registrations.
- **Disposable:** in-memory scheduling state, transient liveness probes.

#### Execution plane

- **Owns:** source materialization, temporary clones and worktrees, executor
  process supervision, MCP and tool hosting, environment policy enforcement,
  filesystem and Git reconciliation, checkpoints, and proposal production.
- **Does not own:** acceptance, review resolution, product state, or the Studio
  database. It proposes; it never accepts. This extends reference-architecture
  invariant 3 ("Executors propose state and cannot accept their own proposal")
  from executors to the whole plane that hosts them.
- **Implemented by:** `apps/workspace-runtime` — **proposed, not implemented**.
- **Crossing its boundary:** a materialization or execution request inbound; a
  normalized result, event stream, checkpoint reference, or proposal outbound.
  Untrusted repository content never crosses northbound as instruction.
- **Durable:** checkpoints and proposals, once handed to the control plane.
- **Disposable:** clones, worktrees, executor processes, tool hosts, and the
  entire materialization. Disposability is the point: an execution-plane
  instance must be destroyable without product-state loss.

#### Capability plane

- **Owns:** Workspace Blueprints, Capability Packs, transformation definitions,
  AgentBundle packs and skills, executor requirements, review semantics, and
  trusted capability bundles.
- **Does not own:** execution mechanics, product state, or scheduling. It says
  what a transformation *means* and what an executor must *provide*; not who
  runs it.
- **Implemented by:** `packages/workspace-sdk` and
  `packages/blueprint-product-development` today. Trusted capability-bundle
  resolution is upstream work this RFC *proposes* `agent-ready-repo` should
  own — a request, not a recorded division; see §Agent-Ready ownership
  boundary.
- **Crossing its boundary:** declarative, runtime-validated manifests only.
  Reference-architecture rule "Capability Packs do not dynamically load
  arbitrary TypeScript into the privileged service process" is unchanged and
  extends to the runtime.
- **Durable:** installed blueprint and pack identity and version.
- **Disposable:** resolved bundle materializations inside a runtime.

#### Source plane

- **Owns:** Studio-managed content, local folders, local Git checkouts, Git
  URLs, managed clones, archives, and external artifact systems — and the
  identity and revision of each.
- **Does not own:** meaning. A source supplies bytes at a pinned revision; the
  product plane decides what they are worth.
- **Proposed owner:** source adapters behind an `apps/studio-service` registry,
  materialized by the execution plane. **Not implemented today** — no source
  registry or source adapter exists, and ARS-CORE-006 leaves adapter placement
  unresolved as a Draft question rather than settling it.
- **Crossing its boundary:** a canonical source identity plus an exact
  revision, in both directions. Content crosses as *data*, never as
  instruction — this is ARS-REPO-002's trust boundary.
- **Durable:** source registration, canonical identity, last-known revision.
- **Disposable:** every materialization of that source.

### Repository boundaries

- `agent-ready-studio` remains a TypeScript/pnpm monorepo.
- `agent-ready-repo` remains a separate repository.
- **No third repository yet.** The Workspace Runtime belongs as an
  independently runnable application inside this monorepo.
- **Repository separation is not a security boundary.** Two repositories
  compiled into one process share one trust domain. Isolation comes from
  process, filesystem, container, VM, credential, identity, and network
  boundaries — all of which are available within one monorepo.
- Reconsider extraction only when one of these is true: an independent consumer
  exists, ownership diverges, release cadence diverges, licensing requires it,
  deployment topology requires it, or a security review boundary requires it.
  None holds today.

### Monorepo folder semantics

| Root | Contains | Test |
| --- | --- | --- |
| `apps/` | Independently runnable or deployable components — desktop clients, web clients, services, runtimes, workers, microfrontends | Does it have its own process lifecycle? |
| `packages/` | Reusable implementation libraries consumed by applications or other packages | Is it imported, with no process of its own? |
| `contracts/` | Language-neutral, externally versioned schemas, compatibility fixtures, protocol conformance material | Must a non-TypeScript consumer read it? |
| `tools/` | Repo-local development, verification, migration, release, generation, maintenance tooling | Does it ship to a user? If yes, it is not `tools/` |
| `docs/` | Charter, decisions, proposals, architecture, product state, specs, plans, guidance | — |
| `infra/` | **Future root.** Packaging, provisioning, deployment, cloud infrastructure | Created only when it has a maintained owner and lifecycle |

"App" does not mean "frontend". A headless runtime and a background worker are
both applications by this test.

`apps/` stays **flat**. A later RFC may introduce `apps/clients/*`,
`apps/services/*`, `apps/runtimes/*`, `apps/workers/*` — but only after real
component count, ownership, or deployment pressure justifies the hierarchy.
Three applications do not justify it.

### Component stereotypes

**Client surface** — user-facing host (Electron desktop, web, mobile, future
microfrontend).
Authority: presentation and user intent capture only.
Lifecycle: user-launched; one per user session.
Allowed: protocol packages, UI contracts.
Forbidden: service or runtime implementation, storage, direct filesystem or
network access to sources.
Public boundary: the typed preload/host API.
Testing: boundary tests through the host API; no privileged imports in
production code.
Security: no Node integration, context isolation on, allowlisted IPC.
New ADR/RFC when: the privileged surface grows, or a second client surface
appears.

**Product/control-plane service** — durable service owning Studio use cases,
product state, scheduling, reviews, decisions, sources, runs, policies.
Authority: product plane and control plane.
Lifecycle: supervised child process of the client today; independently
deployable later.
Allowed: domain, protocol, storage, workspace-sdk, runtime contract.
Forbidden: Workspace Runtime implementation, executor SDKs, direct working-tree
access.
Public boundary: the versioned Studio protocol (ADR-0004).
Testing: real process spawn, handshake, correlation, shutdown; real migrations.
Security: single SQLite writer; validates every boundary payload; holds
credential references, not material.
New ADR/RFC when: it acquires execution-plane authority, or a second writer
appears.

**Workspace Runtime** — replaceable execution-plane process.
Authority: execution plane only.
Lifecycle: on demand, per run or per materialization; destroyable at any time.
Allowed: runtime contract, source and workspace adapters, provider/process/tool
bindings.
Forbidden: Studio SQLite, Studio domain acceptance logic, review resolution,
importing `apps/studio-service`.
Public boundary: the Studio Runtime Protocol.
Testing: conformance fixtures against the versioned contract; deterministic
inspection fixtures; isolation assertions.
Security: this is the untrusted-content boundary. Filesystem confinement,
explicit environment policy, no ambient credentials, no execution of
repository-authored code unless a capability explicitly authorizes it.
New ADR/RFC when: it gains durable product authority, or a second runtime
deployment target is added.

**Background worker** — independently operated asynchronous processor.
Authority: delegated from the control plane; never original.
Lifecycle: independent; queue-driven.
Allowed: domain, protocol, storage ports as scoped.
Forbidden: becoming a second product-state authority.
Public boundary: its queue contract.
Testing: idempotency and redelivery.
Security: same trust level as the service that delegates to it.
New ADR/RFC when: **introducing one at all.** A worker is warranted only when
work cannot responsibly stay inside an existing service or runtime. None is
warranted today.

**Shared library** — reusable implementation unit, no process lifecycle.
Authority: none. Libraries hold rules, not decisions.
Allowed: other libraries.
Forbidden: importing any application; depending on a process.
Public boundary: its exported surface.
Testing: deterministic unit tests of invariants.
Security: no ambient I/O in domain or contract packages.
New ADR/RFC when: it acquires I/O, a process, or a public external contract.

**External contract** — language-neutral, independently versioned boundary.
Authority: compatibility. It is the only thing two independently released
components may rely on.
Lifecycle: versioned and released on its own cadence.
Allowed: nothing — contracts depend on no implementation.
Forbidden: importing applications or implementation packages.
Public boundary: the schema and its fixtures.
Testing: request/response/notification/refusal fixtures; conformance suites;
compatibility tests across supported versions.
Security: validated at every boundary that consumes it.
New ADR/RFC when: a breaking change, or a new external consumer.

**Infrastructure component** — packaging, deployment, provisioning,
environment configuration.
Authority: operational.
Lifecycle: its own, with a named owner.
New ADR/RFC when: **creating `infra/` at all.**

### Proposed dependency direction

```
desktop            → Studio protocol → studio-service
studio-service     → versioned Runtime contract → workspace-runtime
workspace-runtime  → executor-neutral contracts
                   → source / workspace adapters
                   → provider, process, and tool bindings
```

**Forbidden dependencies.** Each is a rule a reviewer can check mechanically.

- Renderer importing service or runtime implementation.
- Studio Service importing Workspace Runtime implementation. It depends on the
  *contract*; that is what makes the runtime replaceable.
- Applications importing one another as libraries.
- Workspace Runtime accessing Studio SQLite.
- Workspace Runtime resolving semantic reviews or accepting artifacts.
- Domain or contract packages importing applications.
- `agent-ready-repo` becoming the persistent Studio control plane. It is a
  methodology and repository-local-behavior provider, not a database.

### Runtime contract placement

See §Options considered for the evaluation. **Accepted: Option A** — a
separately versioned `packages/runtime-protocol` with external schemas under
`contracts/jsonschema/runtime`.

**Accepted ahead of its evidence, deliberately.** Option A's advantage depends
on a second, independently released runtime deployment existing, and no work
currently in view can demonstrate that. The maintainers accepted it anyway so
that the runtime specification and every later contract question inherit one
placement instead of reopening it. Neither the package nor the schema root is
created until that specification defines a real contract, so the decision costs
nothing until it is used. The counter-case for Option C is retained in full in
§Options considered, and the risk is retained in §Risks.

### Protocol roles

Each protocol gets one slot, so they stop competing. **No external protocol is
the Studio domain model** — the domain lives in `packages/domain` and is
projected onto whichever wire format a boundary needs.

| Protocol | Role | Direction | Commitment |
| --- | --- | --- | --- |
| **Studio Runtime Protocol** | Control contract between Studio Service and a first-party local or cloud Workspace Runtime | Northbound | Placement accepted (D3); not yet built |
| **MCP** (Model Context Protocol) | Tool and resource interface between an active agent and tools exposed inside one runtime | Southbound | None |
| **ACP / provider SDKs and CLIs** | Executor bindings a runtime uses to launch and control coding agents | Southbound | None |
| **A2A** (agent-to-agent) | Optional adapter for independently deployed or third-party agent services | Lateral | None |
| **AG-UI** | Optional projection of normalized run events into a frontend event stream | Northbound | None |
| **A2UI** | Possible later mechanism for constrained supplemental generated UI | Northbound | None — and **never** the authority for privileged review, merge, release, or credential actions |
| **JSON-RPC** | Envelope and local transport convention (already ADR-0004) | — | Existing; an envelope is not a domain definition |

### Local and cloud runtime parity

Local and cloud Workspace Runtimes are **deployments of one semantic
contract**, not two products. A request that inspects a repository must be
expressible identically against either.

| | Local Runtime | Cloud Runtime |
| --- | --- | --- |
| Process | Separate child or supervised process | On-demand container or VM |
| Source | Local materialization | Immutable source snapshot |
| Capabilities | Locally resolved bundle | Pinned trusted capability bundle |
| Outputs | Local checkpoints and proposals | External checkpoint and proposal storage |
| Coupling | Explicit process and filesystem boundary | No dependency on Electron or the local Studio filesystem |
| Future | Git worktrees | — |

Cloud infrastructure is deliberately not designed here.

### Agent-Ready ownership boundary

Every shared schema has exactly one owner. There is no shared ownership.

**This is a proposed division, not a recorded one.** This repository can bind
only itself. The `agent-ready-repo` column states what Studio would *depend on*
that repository owning; it is not a commitment by its maintainers, who were not
consulted and whose repository was not read in this pass. The reviewed intent
that identifies upstream ownership, ARS-RUN-004, is itself an unshaped `Draft`
and confers no authority — its own review finding was that it needs an
upstream-owned artifact those maintainers accept. Treat the right-hand column
as a request to be negotiated, per
[`agent-ready-repo-counterpart-contract.md`](0001-notes/agent-ready-repo-counterpart-contract.md).

**`agent-ready-studio` would own:** the Studio user experience; Studio-managed
artifacts and decisions; the source registry; durable Studio runs, claims, and
gates; scheduling and runtime selection; the Workspace Runtime implementation;
the Studio Runtime Protocol; repository adapters; cross-repository
coordination.

**`agent-ready-repo` would be asked to own:** AgentBundle; `workspace.toml`
semantics; the Agent-Ready lifecycle and artifact conventions; pack and skill
methodology; workspace inspection semantics; machine-readable transformation
descriptions; capability-bundle resolution; repository-local preparation,
reconciliation, and admission behavior; `frame-intent` and the related shaping
methods, `new-spec`, and `work-loop`; repository-local gates and Git
guardrails.

### Tooling boundary

The `monorepo-extras` pack and its `new-package` contract are **not installed
in this repository** — verified by `.agentbundle-state.toml` containing no
occurrence of `monorepo-extras`, and by the absence of a `new-package` skill
from the projected skill set. The installed packs are `core` and
`governance-extras`. The boundary is recorded anyway, because it governs a tool
the portfolio assumes:

- Where installed, `monorepo-extras` is a narrow shared-library scaffolder.
- It is not responsible for creating `apps/workspace-runtime`, and its current
  behavior does not block anything proposed here.
- **It is not changed by this initiative.**
- Architecture-aware component scaffolding — routing among client, service,
  runtime, worker, library, contract, and infrastructure stereotypes — is a
  separate future `agent-ready-repo` capability needing its own upstream intent
  and RFC.
- It is **not** a dependency of Connect and Orient.

### Proposed charter delta

This RFC does **not** edit [`docs/CHARTER.md`](../CHARTER.md). The delta below
is the proposed basis for a governed charter change, per the charter's own
"revise through an RFC" rule.

**Proposed mission.** Preserve the artifact-first multidisciplinary direction
and acknowledge what the portfolio adds:

> Agent-Ready Studio helps multidisciplinary product teams turn uncertain
> inputs into explicit, reviewable decisions through connected artifacts —
> working locally by default, and optionally connecting real sources and
> governed execution without ever letting either become product truth on its
> own.

**Proposed scope.** Opinionated Product Development workspaces; versioned
artifacts, evidence, lineage, reviews, and decisions; local-first use without
agents or repositories; optional connected sources; optional governed local and
cloud execution runtimes; progressive adoption from manual to assisted to
agent-ready; cross-repository product coordination.

**Proposed permanent non-scope.** These are never in scope, at any horizon —
the distinction the current charter lacks:

- Treating executor output as accepted product truth.
- Becoming primarily a terminal or a generic agent command center.
- Becoming a generic no-code database or arbitrary workspace builder.
- Silently executing untrusted repository content.
- Hiding source authority, revision identity, or write boundaries.
- Requiring AgentBundle, Git, or provider credentials for basic workspace use.

**Deferred, not permanent non-scope.** Real provider dispatch, Git worktrees,
repository write-back, private-repository authentication, cloud sync, remote
runners, and collaboration are *sequenced later*, not forbidden. They are
captured across INI-006 through INI-008 and each needs its own governance.

**Proposed principles.** Decision clarity first; explicit human and policy
authority; product authority separate from execution authority; local-first
baseline with optional runtime topology; exact source, revision, input, output,
and decision lineage; optional and least-privileged capability layers; platform
internally, opinionated product externally.

### Companion notes

| Note | Contents |
| --- | --- |
| [`current-state-and-authorities.md`](0001-notes/current-state-and-authorities.md) | Verified implemented inventory and the plane-by-plane authority ledger |
| [`capability-domain-and-delivery-mapping.md`](0001-notes/capability-domain-and-delivery-mapping.md) | All 64 capabilities mapped to proposed domains, delivery initiatives, planes, and owning repository |
| [`connect-and-orient-steel-thread.md`](0001-notes/connect-and-orient-steel-thread.md) | The first bounded delivery initiative, its flow, responsibilities, non-goals, and definition of done |
| [`agent-ready-repo-counterpart-contract.md`](0001-notes/agent-ready-repo-counterpart-contract.md) | Proposed upstream work, stated as needs rather than as an upstream specification |
| [`post-acceptance-follow-ons.md`](0001-notes/post-acceptance-follow-ons.md) | What becomes available only after human acceptance |

## Options considered

### D3 — runtime contract placement

MECE axis: **where the versioning boundary of the runtime contract sits.**

**Option A — `packages/runtime-protocol` + `contracts/jsonschema/runtime`.**
A separate package versioned independently of the Studio protocol, with
language-neutral schemas.
*For:* the runtime is replaceable by design, and replaceability without an
independently versioned contract is a claim rather than a property. A cloud
runtime released on its own cadence needs to negotiate a version against a
service it does not ship with. External schemas let a non-TypeScript runtime
exist without re-deriving the contract.
*Against:* one more package and one more schema root before a second runtime
exists. Real cost, paid early.

**Option B — runtime contracts inside `packages/execution-sdk`.**
*For:* zero new packages; the execution SDK already owns executor contracts,
packets, and normalized events, so the domain vocabulary is adjacent.
*Against:* conflates two different boundaries at two different trust levels.
`execution-sdk` describes *what an executor is* — an in-process library
concern. The runtime contract describes *how two processes negotiate across a
trust boundary*. Bundling them means the Studio Service must depend on executor
contracts to talk to a runtime, which is precisely the coupling the plane split
removes. It also forces the executor SDK's version to move whenever the wire
contract moves.

**Option C — runtime methods in `packages/protocol` under a separate
namespace.**
*For:* one protocol package, one transport, one negotiation mechanism; ADR-0004
already covers it; least new machinery.
*Against:* the Studio protocol is the *client-to-service* contract, governed by
the protocol approval path and consumed by the renderer boundary. Adding
service-to-runtime methods puts two independently evolving contracts behind one
version number, so a runtime change forces a client-visible protocol version
bump. A namespace is a naming convention, not a versioning boundary; the
strongest argument for C is that it *looks* like A while giving none of A's
independence.

**Do nothing — defer placement until the runtime is specified.**
*For:* genuinely cheapest; no package exists to be wrong.
*Against:* the placement decision is an input to the runtime specification, not
an output. Deferring it means the first runtime spec decides it implicitly, and
the implicit answer is whichever package is already open — Option B by
accident.

| Criterion | A | B | C |
| --- | --- | --- | --- |
| Independent evolution | Yes | No | No — shares a version |
| Local ↔ cloud compatibility | Negotiable | In-process assumption | Negotiable |
| Schema ownership | Explicit, own root | Implicit | Shared with client contract |
| Generated vs authored types | Either; schema canonical | Either | Either |
| Protocol negotiation | Independent | None | Coupled to client version |
| Conformance fixtures | Own suite | Mixed with executor tests | Mixed with client fixtures |
| Dependency direction | Clean — both sides depend on contract | Service → executor SDK | Renderer transitively exposed |
| Supports extraction | Yes | No | Partly |
| Avoids duplicate domain types | Needs an explicit rule | Yes | Yes |

Two corrections to an earlier framing of this table, because the recommendation
should not rest on a false asymmetry:

- **Generated versus authored types does not distinguish the options.** All
  three can be schema-first. `reference.md` already requires that "Zod schemas
  are the canonical runtime definitions and must remain exportable to JSON
  Schema where a public boundary requires it", and `packages/protocol` is
  already paired with a versioned public JSON schema. This criterion is
  therefore neutral and carries no weight for A.
- **A does not avoid duplicate domain types for free.** Letting
  `runtime-protocol` import `packages/domain` would violate this RFC's own
  external-contract rule that contracts depend on no implementation. So A's
  duplication answer must be an explicit rule — the contract defines its own
  wire types and a mapping layer in the *consumer* converts to domain values —
  not an import. B and C inherit their answer from the packages they sit in.

**Recommendation: A**, on two criteria only: independent evolution and
dependency direction. B is rejected because it makes the Studio Service depend
on executor contracts to talk to a runtime, re-coupling the planes this RFC
separates. C is rejected because a namespace is not a versioning boundary — it
does not decouple release cadence, and it exposes runtime churn to the
client-visible protocol version.

The honest cost of A is one package, one schema root, and one mapping layer
that carry no weight until a second runtime deployment exists. It is the
weakest of this RFC's recommendations: if the cloud runtime never ships, C
would have been the cheaper correct answer.

**The maintainers accepted A regardless**, judging a single settled placement
worth more than waiting for evidence that only a second deployment could
supply. The trade was made with this section's reasoning in view: if a cloud
runtime never ships, C would have been cheaper, and that remains the honest
counter-case rather than something acceptance erased.

What limits the exposure is that acceptance creates nothing. The package, the
schema root, and the mapping layer appear only when the runtime specification
defines a real contract. Until then A is a recorded answer that costs nothing
to hold, and reversing it before that point costs a `Status`-field pointer to a
superseding ADR rather than a
migration. D3 also lapses entirely if the Stage 2 gate withdraws D1.

### D2 — repository boundary

One choice is clearly dominant and does not need a taxonomy. A third repository
buys nothing today: no independent consumer, no separate owner, no separate
release cadence, and — decisively — no security benefit, because isolation
comes from process and filesystem boundaries rather than from source-tree
separation. The monorepo keeps contract and consumer changes in one reviewable
commit. Recorded here so the reasoning can be checked when extraction is
reconsidered.

## Risks & what would make this wrong

**The plane split may be premature.** If the Workspace Runtime turns out to be
a thin shell around one materialization call, a separate process is overhead
and the contract is ceremony.
*Falsifiable as:* the Connect and Orient steel thread completes and the runtime
has no state, no supervision, and no policy surface worth a process boundary.
*Mitigation:* Connect and Orient is deliberately the first test, and it is the
smallest honest exercise of the boundary. If the runtime is trivial there, D1 is
falsified and is recorded as withdrawn through an ADR, with this RFC's `Status`
field pointing at it — the body is frozen on acceptance and is not reopened. The cost is the
trial alone: the trial runtime is a discardable spike, and no durable runtime,
contract package, or schema root exists when the gate is assessed.

**Option A may never earn its cost.** If a cloud runtime never ships, the
independently versioned contract is a package nobody needed. **This risk was
accepted, not resolved** — D3 was accepted ahead of the evidence that would
justify it.
*Mitigation:* acceptance creates nothing. Neither the package nor the schema
root exists until the runtime specification defines a real contract, so the
cost is deferred to the moment it is incurred, and reversing the placement
before then costs a `Status`-field pointer to a superseding ADR rather than a
migration.

**Five planes may be too many.** Capability and Source could be read as
concerns of the other three rather than as planes.
*Falsifiable as:* no capability in the portfolio maps to Capability or Source
as its most relevant plane.
*Result:* the test passes, but not decisively. Across the 64 mapped
capabilities the most relevant plane is Product 24, Capability 15, Control 14,
Source 6, Execution 5. Every plane is used, so none is empty enough to fold in
on the evidence. Source is the thinnest at 6 and is the one to re-examine if
the model is ever simplified.

**The charter delta widens scope under an architectural banner.** Adding
"optional governed execution" to the charter is a real product change wearing
architecture clothes.
*Mitigation:* the delta is explicitly not applied here and must go through the
charter's own RFC process as a separate decision. It is included so reviewers
can see the scope consequence of the architecture, not so it can ride along.

**The analytical overlay may harden into a second source of truth.** Two
initiative taxonomies invite drift.
*Mitigation:* the mapping lives in a companion note, not in the intents, and
post-acceptance follow-on 6 forces an explicit decision about whether it
becomes maintained, generated, or discarded.

**Assumption: the execution plane is genuinely separable at this stage.** If
reconciliation turns out to need synchronous access to Studio's artifact index,
the boundary leaks and this design gets worse, not better. Untested. It is the
single most load-bearing assumption in this RFC.

## Experiment / validation

The maintainers accepted this RFC with D1's process boundary staged behind the
trial below. The trial is therefore a condition on D1's ADR, not on this RFC's
status.

**Hypothesis.** A Workspace Runtime in its own process will accumulate state,
supervision, and environment policy that the Studio Service could not take on
without also taking on untrusted repository content — enough to justify a
process boundary and a versioned contract between them.

**Trial.** Deliver the
[Connect and Orient steel thread](0001-notes/connect-and-orient-steel-thread.md)
using a provisional, time-boxed trial runtime: a spike, explicitly not
`apps/workspace-runtime`, built against a provisional contract rather than
`packages/runtime-protocol`, and discarded or rewritten afterwards.

**Measures.** The three Stage 2 gate criteria in
[the steel-thread note](0001-notes/connect-and-orient-steel-thread.md#the-stage-2-gate-criteria):
whether the runtime held non-trivial state, supervision, or policy; whether the
boundary enforced isolation rather than convention; and whether the contract
needed a local-filesystem assumption.

**Outcomes.** Criteria 1 and 3 are independently decisive, so every combination
has a prescribed result:

| Criterion 1 — runtime held non-trivial state? | Criterion 3 — contract needed a local-filesystem assumption? | Result |
| --- | --- | --- |
| Yes | No | **Success.** D1's process boundary proceeds to an ADR |
| No | No | **Failure** — the runtime was a thin call. D1 withdrawn; D3 lapses; an ADR records that the execution plane is not separable at this stage |
| Yes | Yes | **Failure** — the boundary carried weight but the contract is not deployment-neutral, so the runtime is not replaceable and D1's rationale does not hold as stated. D1 withdrawn pending a reformulation, and D3 lapses with it under the same rule as every other withdrawal; a non-neutral contract independently undercuts Option A's basis |
| No | Yes | **Failure** on both counts. D1 withdrawn; D3 lapses |

D2 survives every outcome: it says only that if there is a runtime it lives in
this monorepo, which costs nothing if there is none. Every failure path is
recorded as an ADR, with this RFC's `Status` field gaining a
superseded-in-part pointer to it, because an Accepted RFC's body is frozen.

Criterion 2 — whether isolation was enforced by the boundary rather than by
convention — does not by itself decide D1. A "no" weakens the security argument
without falsifying separability, and is recorded in the spike note as a
qualification on any success.

Every failure path costs the trial and nothing else: the trial runtime is a
discardable spike, and no durable runtime or contract package exists when the
gate is assessed.

**Not measured.** D3. The trial excludes cloud execution, so it produces no
evidence about whether an independently versioned contract package earns its
cost.

## Open questions

1. **Does `packages/executor-fake` belong to the execution plane or stay an
   in-process test double?** Recommended default: it stays a test double and
   does not move. Owner: maintainers. Decide by: the runtime specification.
2. **Where does a cross-language shared schema package live when both
   repositories need one?** Recommended default: do not decide until a second
   language consumer exists. Owner: maintainers, jointly with
   `agent-ready-repo`. Decide by: the first non-TypeScript consumer.

## Follow-on artifacts

Acceptance does not begin implementation, and it is staged — see
§Acceptance sequencing above and
[`post-acceptance-follow-ons.md`](0001-notes/post-acceptance-follow-ons.md) for
the full eleven-item sequence and its ordering constraints.

**Stage 1 — warranted now:**

- One or more ADRs recording the accepted decisions that create nothing: the
  plane vocabulary, the root folder semantics (D4), the monorepo placement
  (D2), and the runtime-contract placement (D3, Option A).
- A separate charter RFC applying the proposed delta through the governed
  process (D5).
- An update to [`docs/architecture/reference.md`](../architecture/reference.md)
  adding the plane vocabulary and folder rules, with
  [`overview.md`](../architecture/overview.md) left describing implemented
  components only.
- Shaping *and delivery* of Connect and Orient as the first bounded delivery
  initiative, using the authorized provisional trial runtime. Its delivered
  result is the Stage 2 gate.

**Stage 2, only if that gate passes:**

- An ADR recording the D1 process boundary, plus the runtime stereotype in
  `reference.md`.
- Paired Studio and Agent-Ready Repo artifacts with explicit ownership.
- A specification for `apps/workspace-runtime`, authored before any
  scaffolding — and scaffolding only after that. This is where D3's accepted
  placement is first *built*, having already been decided.

If the gate fails, the warranted artifact is an ADR recording that the
execution plane is not separable at this stage, with this RFC's `Status` field
pointing at that ADR.
