# Connect and Orient — first bounded delivery initiative

Companion note to [RFC-0001](../0001-studio-authority-planes-and-workspace-runtime-boundary.md),
**Accepted 2026-09-11**.

Acceptance makes this the warranted first bounded delivery initiative and the
Stage 2 gate for D1. It is **not** a specification, nothing here is scheduled,
and shaping has not begun. It creates no capability IDs; it maps onto intents
that already exist and are already reviewed, all of which remain `Draft`.

## The steel thread

> Given a public GitHub URL, Studio resolves an immutable revision, delegates
> read-only inspection to a Workspace Runtime, displays the Agent-Ready
> workspace status and canonical artifact, and accurately explains whether
> shaping is available.

It is chosen as first because it is the smallest honest exercise of the
execution-plane boundary RFC-0001 proposes. It needs materialization,
isolation, and a normalized result — and it needs no credentials, no writes,
and no agent. If the boundary is not worth a process here, RFC-0001 is wrong.

## Mapped reviewed intents

No replacement capability IDs. These are the existing Draft intents the thread
exercises, each already carrying its own reviewed outcome, boundary, and open
questions.

| Intent | Contribution to the thread |
| --- | --- |
| [ARS-REPO-001](../../product/intents/read-only-public-github-repository-connection.md) | Public GitHub URL in; no install, no persistent clone |
| [ARS-REPO-002](../../product/intents/repository-identity-revision-pinning-and-trust-boundary.md) | Canonical source identity, exact revision, content-as-data trust boundary |
| [ARS-REPO-003](../../product/intents/agent-ready-repository-detection.md) | Whether the repository is Agent-Ready, and which surfaces exist |
| [ARS-REPO-004](../../product/intents/workspace-status-pane-of-glass.md) | The status projection users read |
| [ARS-REPO-005](../../product/intents/queue-detail-blocker-explanation-reconciliation-and-refresh.md) | Blocker explanation and refresh |
| [ARS-REPO-006](../../product/intents/pack-profile-adapter-and-skill-capability-visibility.md) | Which packs and skills exist — the basis for the shaping-availability answer |
| [ARS-CORE-006](../../product/intents/local-studio-service-persistence-protocol-and-source-adapters.md) | Restart-safe service, versioned protocol, replaceable source boundary |
| [ARS-SHAPE-001](../../product/intents/open-shaping-work-from-workspace-status.md) | Only the *availability explanation*. Dispatch is out of scope |

This is the same candidate set as the roadmap's
[Wave 1](../../product/roadmap.md#wave-1--repository-pane-of-glass), with
ARS-CORE-006 named explicitly because the source-adapter boundary is load-bearing
here, and ARS-SHAPE-001 included only for its explanation surface.

The thread deliberately excludes ARS-REPO-007, ARS-REPO-008, and ARS-REPO-009 —
multi-repository views, managed clones, and private repositories — matching
those intents' own boundaries.

## Flow

```
public GitHub URL
  → canonical source identity            (Studio · Source + Control plane)
  → exact commit SHA                     (Studio · Control plane)
  → ephemeral read-only materialization   (Runtime · Execution plane)
  → trusted AgentBundle workspace inspector (Runtime invokes; agent-ready-repo asked to own)
  → normalized WorkspaceInspection        (Runtime → Studio, over the Runtime contract)
  → Studio repository-status pane         (Studio · Product plane)
  → canonical intent viewer               (Studio · Product plane)
  → shaping-availability explanation      (Studio · Product plane)
```

The revision is resolved **before** materialization, so every downstream result
is attributable to one immutable SHA.

## Responsibilities

### Studio (Product and Control planes)

- Source registration, and the canonical identity for a supplied URL.
- URL and revision presentation — the user can always see exactly what was read.
- Durable connection and refresh state, surviving restart.
- Issuing the runtime request and selecting the runtime.
- Artifact and status presentation.
- User-facing diagnostics.
- The shaping affordance, and the honest explanation behind it.

### Workspace Runtime (Execution plane)

- Materialization of the pinned revision.
- Filesystem isolation of that materialization.
- Invoking the trusted inspector.
- Capturing deterministic results.
- Disposing of the materialization, or explicitly caching it — never
  implicitly.

### Agent-Ready Repo (Capability plane, upstream) — requested, not agreed

Everything in this subsection is a **proposed** upstream responsibility. Those
maintainers were not consulted and have agreed to none of it; if they decline,
this thread needs a different answer for each item. Stated as a request:

- Workspace schema and lifecycle meaning.
- Workspace inspection.
- Item classification.
- Blocker explanation.
- Pack and skill capability reporting.
- Canonical artifact references.

Studio never reimplements workspace semantics. It renders what the inspector
reports. See
[`agent-ready-repo-counterpart-contract.md`](agent-ready-repo-counterpart-contract.md).

## Explicit non-goals

Each is excluded because it would either need credentials, permit writes, or
require an agent — none of which this thread has.

- Real provider execution.
- Repository mutation of any kind.
- Git worktrees.
- Credentials.
- Private repositories.
- Persistent managed clones.
- Cloud execution.
- Arbitrary repository scripts.
- MCP orchestration.
- Shaping dispatch.
- Build dispatch.
- Parallel execution.

Shaping *availability* is in scope. Shaping *dispatch* is not. The thread ends
by telling the user truthfully whether shaping could run, and stops.

## Definition of done

Each item is observable, and several are falsifiable failure conditions rather
than features.

1. The exact inspected revision is visible to the user.
2. No repository content is executed.
3. No credentials are required at any point.
4. An Agent-Ready repository is correctly projected.
5. A non-Agent-Ready repository is honestly identified — a normal result, not
   an error.
6. An invalid or malformed workspace produces actionable diagnostics rather
   than a silent empty state.
7. The last successful inspection survives restart.
8. Refresh detects a changed revision.
9. A canonical intent can be opened from the status projection.
10. The shaping-availability explanation is accurate — including when shaping
    is unavailable, and why.
11. The same semantic inspection request can later target a cloud Runtime
    without a contract change.

Item 11 is a **necessary condition, not the falsification test.** It is
provable at design time from the contract's shape, so it can be satisfied by a
boundary that turns out to be worthless. If the inspection request can only be
expressed against a local filesystem, the plane split has certainly failed —
but passing item 11 does not establish that it succeeded.

Items 2 and 3 are security properties and should be asserted by tests, not by
review alone.

## Honest limits of this thread as a test

This note is written from inside RFC-0001's proposal: the flow above
**presupposes** delegation to a Workspace Runtime rather than comparing both
arrangements. It is not a neutral experiment, and it should not be presented as
one. What it can do is expose whether the delegation carried its weight once
real.

## Which runtime the trial uses

Delivering this thread requires a runtime, and the durable
`apps/workspace-runtime` is not authorized until after the gate this thread
*is*. The trial therefore uses a **provisional, time-boxed trial runtime**: a
spike, explicitly not the sanctioned component, built against a provisional
contract rather than `packages/runtime-protocol`, carrying no stereotype
authority, and discarded or rewritten once the gate is assessed.

That exception is recorded in
[`post-acceptance-follow-ons.md`](post-acceptance-follow-ons.md) item 7 and is
the only place a runtime is authorized before Stage 2. Without it the sequence
would be circular.

## The Stage 2 gate criteria

Assessed after this thread is **delivered**, not after it is shaped. Shaping is
design work and settles nothing. These are the criteria
[RFC-0001](../0001-studio-authority-planes-and-workspace-runtime-boundary.md#acceptance-sequencing)
gates its D1 decision on. D2, D3, D4, and D5 were accepted outright and are not
gated here; D2 in particular survives every outcome below, since it says only
that if there is a runtime it lives in this monorepo.

1. **Does the runtime hold state, supervision, or policy that the Studio
   Service could not hold without taking on untrusted content?** If the runtime
   turned out to be a thin call with no state of its own, **D1 is falsified**
   and the process boundary should be withdrawn. This is the decisive
   criterion, and it can genuinely return "no".
2. **Was any isolation property — definition-of-done items 2 and 3 — actually
   enforced by the boundary**, rather than by convention that would have held
   equally well in one process?
3. **Did the contract need a local-filesystem assumption** to express the
   inspection request?

Two further questions this thread informs but does not settle:

- Whether the Source plane is a distinct authority or a facet of Control.
- Whether upstream workspace inspection can be deterministic and
  non-executing — the load-bearing upstream assumption.

What this thread **cannot** test: D3. It excludes cloud execution by design, so
it produces no evidence about whether an independently versioned contract
package earns its cost. The maintainers accepted D3 anyway, knowingly ahead of
that evidence; this thread neither supports nor undermines it. D3 does lapse if
criterion 1 falsifies D1, since a contract placement for a runtime that will not
exist decides nothing.
