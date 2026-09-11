# Current state and authorities

Companion note to [RFC-0001](../0001-studio-authority-planes-and-workspace-runtime-boundary.md),
**Accepted 2026-09-11**. The "today" columns below are verified repository
state; the "accepted" columns are direction, and none of them describes
implemented code.

This note separates what the repository *contains* from the direction RFC-0001
records. It exists so the RFC body can argue a delta without restating the
foundation, and so a reviewer can check every current-state claim against a
named artifact.

## Verified implemented inventory

Counted from the repository on 2026-09-11, not copied from any prior summary.

### Applications — 2

| Path | Role | Verified against |
| --- | --- | --- |
| `apps/desktop` | Electron main, preload, React renderer, desktop boundary tests | [overview](../../architecture/overview.md), [reference](../../architecture/reference.md) |
| `apps/studio-service` | JSON-RPC dispatch, application use cases, notifications, storage composition | same |

### Packages — 7

`domain`, `protocol`, `workspace-sdk`, `blueprint-product-development`,
`execution-sdk`, `executor-fake`, `storage-sqlite`.

### Other roots

- `contracts/jsonschema` — one versioned public protocol schema.
- `tools/` — `criterion-trace.mjs`, `lint-intent-inventory.mjs`, `hooks/`.
- No `infra/` root. No `apps/workspace-runtime`. No `packages/runtime-protocol`.
- No `contracts/jsonschema/runtime`.

### Product-direction inventory

Computed by `node tools/lint-intent-inventory.mjs`, which reports: 66 intent
files, comprising 64 capability intents across 8 initiatives, plus 2 parent
intents.

| Level | Count | Detail |
| --- | --- | --- |
| Parent intents | 2 | ARS-VISION-001 (product-vision), ARS-STRATEGY-001 (product-strategy) |
| Umbrella / portfolio anchors | 10 | ARS-CAP-001 … ARS-CAP-010 — named in the index; no own files |
| Initiative groups | 8 | INI-001 … INI-008 |
| Detailed capability intents | 64 | all `Draft`, all at `capability` level |

All 64 remain `Draft`. None is Ready, Accepted, Fulfilled, or implemented.

### Accepted decisions — 4

ADR-0001 (Electron client and Studio Service), ADR-0002 (workspace extension
model), ADR-0003 (artifact revisions and decisions), ADR-0004 (versioned
JSON-RPC NDJSON boundary). All `Accepted`. RFC-0001 supersedes none of them; it
adds a plane and a component stereotype that ADR-0001's two-application model
does not cover.

### RFCs

Before this one, none. `docs/rfc/README.md` carried an empty index.

## Authority ledger — current versus accepted direction

The left column is checkable today. The right column is RFC-0001's accepted
direction — accepted as *direction*, not as implemented code. Every row marked
"not implemented" is still not implemented after acceptance.

**Two rows are not Studio's to accept.** Trusted capability-bundle resolution
and workspace inspection semantics are assigned to `agent-ready-repo`, a
separate repository whose maintainers were not consulted. RFC-0001 calls that
division "a proposed division, not a recorded one", and
[`agent-ready-repo-counterpart-contract.md`](agent-ready-repo-counterpart-contract.md)
states the ownership question is unsettled. Those rows are **requested**, not
accepted, and are marked so below.

| Authority | Owner today | Accepted owner | Plane |
| --- | --- | --- | --- |
| Typed artifacts, revisions, accepted state | `apps/studio-service` | unchanged | Product |
| Reviews, comments, decisions | `apps/studio-service` | unchanged | Product |
| Evidence and lineage | `apps/studio-service` | unchanged | Product |
| SQLite writes | `apps/studio-service` — sole writer | unchanged, and explicitly denied to the runtime | Product + Control |
| Blueprint and pack semantics | `workspace-sdk`, `blueprint-product-development` | unchanged | Capability |
| Transformation definitions | `workspace-sdk` | unchanged | Capability |
| Executor contracts and normalized events | `execution-sdk` | unchanged | Capability |
| Deterministic transformation execution | `executor-fake`, in-process | real executors move out; the fake's placement is [open question 1](../0001-studio-authority-planes-and-workspace-runtime-boundary.md#open-questions) | Capability → Execution |
| Client-to-service protocol | `packages/protocol` (ADR-0004) | unchanged | — |
| Source registration and identity | not implemented | `apps/studio-service` | Source + Control |
| Durable runs, claims, leases, gates | not implemented | `apps/studio-service` | Control |
| Scheduling and runtime selection | not implemented | `apps/studio-service` | Control |
| Source materialization | not implemented | `apps/workspace-runtime` — accepted provisionally, gated on Connect and Orient; not created | Execution |
| Clones, worktrees, working trees | not implemented | `apps/workspace-runtime` — accepted provisionally, gated on Connect and Orient; not created | Execution |
| Executor process supervision | not implemented | `apps/workspace-runtime` — accepted provisionally, gated on Connect and Orient; not created | Execution |
| MCP and tool hosting | not implemented | `apps/workspace-runtime` — accepted provisionally, gated on Connect and Orient; not created | Execution |
| Filesystem and Git reconciliation | not implemented | `apps/workspace-runtime` — accepted provisionally, gated on Connect and Orient; not created | Execution |
| Checkpoints and proposal production | not implemented | `apps/workspace-runtime` — accepted provisionally, gated on Connect and Orient; not created | Execution |
| Service-to-runtime contract | not implemented | `packages/runtime-protocol` — placement accepted (D3 Option A); not created | — |
| Trusted capability-bundle resolution | not implemented | `agent-ready-repo` — requested, not accepted; upstream has not agreed | Capability |
| Workspace inspection semantics | not implemented | `agent-ready-repo` — requested, not accepted; upstream has not agreed | Capability |

Every "not implemented" row is direction, not code. None describes anything
that exists in the repository today.

## What the current architecture already settles

RFC-0001 inherits these and does not reopen them. Each is quoted or paraphrased
from the [reference architecture](../../architecture/reference.md).

- The Studio Service is the single SQLite writer.
- The renderer has no Node integration; preload exposes a narrow allowlisted
  typed API with no generic IPC, shell, or filesystem methods.
- Stdout is protocol-only; stderr carries diagnostics.
- Runtime validation occurs at every trust boundary.
- Executors propose state and cannot accept their own proposal (invariant 3).
- Studio owns semantic workflow state; executors own execution mechanics
  (invariant 7).
- Raw execution events are diagnostics, not accepted product artifacts
  (invariant 11).
- Capability Packs do not dynamically load arbitrary TypeScript into the
  privileged service process.
- Product Development works without packs, Git, or provider credentials
  (invariant 9).

Invariants 3, 7, and 11 are the ones RFC-0001 generalizes: each already draws
the product/execution line at the *executor*. The RFC moves that same line out
to the *process* that hosts executors, which is where untrusted content and
working trees actually arrive.

## Lifecycle observation

Reported, not repaired. Nothing in this pass moves a specification, closes an
initiative, or changes active work.

Canonical `workspace-status` and full `reconcile` both complete successfully.
Structural reconciliation is clean: drift types 1, 2, and 3 all return empty.
The drift is in lifecycle *membership*, which reconciliation reports separately.

The field values quoted below are command output, not a retained artifact — no
receipt file is committed, because this pass adds only the RFC and its notes.
Reproduce them with:

```bash
python3 .claude/skills/workspace-status/scripts/workspace_status.py reconcile --root .
```

and read `reconciliation`, `closeout`, and `canonical.blocked`. Every row's
underlying state is independently checkable against the repository file named
in its evidence column, which is the durable part; the JSON field names are
given so the reading can be audited rather than taken on trust.

| Observation | Evidence |
| --- | --- |
| The walking-skeleton specification carries `Status: Shipped` | `docs/specs/product-development-walking-skeleton/spec.md` line 3 |
| The same specification still occupies the active work slot | `workspace.toml` `[work].active` |
| Reconciliation agrees all specifications are shipped | `closeout.all_specs_shipped = true` |
| Closeout is nonetheless blocked | `closeout.closeout_blockers = ["initiative-residue"]`, `initiative_eligible = false`, `next_action = "settle-closeout-blockers"` |
| INI-001 is still `active` on the milestone that shipped | `workspace.toml` `["ini-001"] status = "active"`, `milestone = "M1 · Product Development walking skeleton"`, and `queue_empty = true` |
| The brief the shipped specification fulfilled is still open backlog | `docs/product/briefs/agent-ready-studio.md` in `backlog.open`, flagged `impossible_transition` |
| The roadmap states the walking skeleton shipped | [roadmap](../../product/roadmap.md) "Wave 0 — Shipped foundation" |

**Reading.** The roadmap, the specification's own status, and reconciliation all
agree the walking skeleton shipped. There is no contradiction about *delivery*.
The mismatch is that lifecycle membership was never settled after shipping: a
Shipped specification remains in active work, the brief it fulfilled remains in
open backlog, and INI-001 remains active on a delivered milestone. Reconciliation
names this precisely as `initiative-residue` and asks for
`settle-closeout-blockers`.

This is an **unresolved closeout decision, not silent drift** — the tooling
reports it accurately and refuses to advance. Settling it requires a human
decision about whether INI-001 is complete or continues under a new milestone,
which is exactly the kind of decision this pass must not make.

Separately: INI-004 is `active` with `queue_empty = true` and nine Draft intents
in `shaping_queue.backlog`, none promoted to `active`. This is **not** drift. It
is an active initiative awaiting its first shaping promotion, consistent with
the roadmap's Wave 1 and with all 64 intents being unshaped.

**Recommended follow-on, not performed here:** run the canonical `close-work`
skill against the walking-skeleton specification and settle INI-001's
disposition. Recorded as a follow-on in
[`post-acceptance-follow-ons.md`](post-acceptance-follow-ons.md); it is
independent of RFC-0001 and does not wait on it.

## Review-record provenance

The brief for this pass referenced
`docs/product/shaping/intent-shaping-review-2026-09-11.md`. **That file does not
exist and was not restored.** It was deliberately removed in commit `f048142`,
"docs(product): drop the persisted shaping-review record", on the stated grounds
that a per-session review transcript decays — six of its revision bindings were
already stale within the same session — and that review output is process rather
than current state.

The same commit removed the index sentence claiming every capability "has been
independently reviewed once". `docs/product/capability-intents.md` therefore
contains no "once" wording, and the mechanical index correction the brief
offered as optional is **moot** — there is nothing to correct.

What the review established survives in two places: the intent bodies it
changed, and this branch's history. The record is readable at `f048142^` for
anyone auditing the results. Findings cited in these notes are sourced from
there and are cited as history, never as a live repository path. Recreating the
file would reintroduce exactly the decay the commit removed.

One consequence for RFC-0001: the review is revision-bound, and every result
binds to bytes that later changed. No intent is eligible for `Accepted` without
a fresh review, regardless of what this RFC decides.
