# Connect and Orient trial runtime — evidence note

**Purpose.** RFC-0001 gates its D1 decision on the *delivered* Connect and
Orient thread. This note records what the trial runtime turned out to be, so
the Stage 2 gate assessor reads observations rather than a constructed answer.

**It records no Pass or Fail for any gate criterion.** AC-0153 requires that,
and the reason is structural: the same session that built the runtime is the
one writing this, and a verdict from here would be the builder marking their
own homework on the decision that authorizes the builder's component.

- **Build revision:** `124f7bc`
- **Written:** 2026-09-19
- **Spec:** [`docs/specs/connect-and-orient/spec.md`](../../specs/connect-and-orient/spec.md)
- **Authorization:** RFC-0001 follow-on item 7. Time-boxed; see *Time box*.

## Time box

Authorized 2026-09-13 by the maintainer operating that session. Expires at the
earliest of: the Stage 2 gate-result ADR; fourteen calendar days after this
specification's implementation is merged; or the start of implementation for
the next Runtime-dependent initiative. On expiry the code is deleted or
rewritten — see *Code that must be deleted or rewritten*.

## Code location

`apps/studio-service/src/trials/connect-and-orient-runtime/`, a single
directory inside the Studio Service package. It is not `apps/workspace-runtime`
and is not a workspace package, which is deliberate: RFC-0001 item 11 forbids
the durable component ahead of the gate, and a trial that acquired its own
package boundary would be harder to delete than to keep.

## Process topology

Observed in a live run at build `124f7bc`:

- The Studio Service process spawns one Runtime child, as a **process-group
  leader**. Service pid and child pid are distinct, and the child's pgid equals
  its own pid.
- The child spawns the transport and probe helpers. Every spawn is recorded in
  an audit the Service reads.
- Depth is two: Service → Runtime → helper. No helper spawns a helper.

## Message shape

NDJSON over the child's stdout, one JSON object per line, each carrying a
`type`. The nine lines observed in the live run, in order: `spawn`,
`started`, `sweep`, `spawn`, `interpreter`, `spawn`, `git`,
`disposed`, `completed`. The Service parses lines; it never evaluates them.

## State held by the child, and whether it needed the Runtime

AC-0151 requires each item be classified as **needed** the Runtime or merely
**inherited** it by holding the materialization. This is the classification the
decisive gate criterion turns on, so it is stated per item rather than in
aggregate.

| State | Needed or inherited | Observation |
| --- | --- | --- |
| The materialized repository tree | **Needed** | It is untrusted content on disk. Holding it in the Service process is precisely what the boundary exists to avoid. |
| The per-request state root, its `home` and `tmp` children | **Inherited** | They exist to give the materialization a confined place to live. Without the tree there is nothing for them to confine. |
| The ownership marker and the sweep | **Inherited** | The marker identifies the process that owns a state root. A single-process design would still need the roots, but the marker exists because a *separate* process can die without unwinding. |
| The pinned git configuration and environment | **Inherited** | It constrains what the transport may do while touching untrusted content — but a single-process design could apply the same configuration to the same subprocesses, which is the test AC-0151 sets. It is here because the transport is. |
| The interpreter probe result | **Inherited** | Studio could probe the interpreter in-process; it runs here because the inspector runs here. |
| The inspection verdict | **Neither — it passes through** | Derived from trusted inspector output and forwarded. The Runtime holds it only in flight. |

**The pattern the assessor should see:** of the six rows, **one is classified
Needed** — the materialized tree — and its ground is untrusted content on disk.
Four are Inherited and one passes through. An earlier draft of this note
classified the pinned configuration Needed while its own criterion-1
observation argued the opposite; the classification above is the one the ground
supports, and the count now matches the table.

## Supervision performed

The Runtime owns its own inspection deadline and signals its **whole process
group** at expiry rather than signalling itself, so a descendant cannot outlive
the deadline. The Service supervises the child: it observes the process tree,
signals the group on disposal, and waits for the group to clear. Disposal was
observed as `{"type":"disposed","reason":"completed","removed":true}`.

## Isolation enforced by the boundary

- **Untrusted content never enters the Service process.** The tree is written,
  read and removed by the child. This is enforced by the boundary: the Service
  has no code path that opens a materialized file.
- **The child runs under a closed environment**, built from an empty object
  rather than inherited. Observed names in the live run: `GIT_ALLOW_PROTOCOL`,
  `GIT_ASKPASS`, `GIT_CONFIG_GLOBAL`, `GIT_CONFIG_NOSYSTEM`,
  `GIT_CONFIG_SYSTEM`, `GIT_TERMINAL_PROMPT`, `HOME`, `LANG`, `LC_ALL`,
  `PATH`, `SSH_ASKPASS`, `TMPDIR`, `TZ` — and nothing else.
- **Group-signalled lifecycle.** A descendant cannot outlive the deadline,
  which one process sharing an event loop could not offer for a runaway child.

## Isolation left as convention

- **The Service does not read the materialized tree**, but nothing prevents it.
  It is a discipline in the code, not a control the operating system enforces.
  In one process the same discipline would hold equally well — which is the
  honest reading of gate criterion 2 for this property.
- **Path confinement** is enforced by the child's own checks rather than by a
  sandbox. No chroot, no container, no seccomp. A defect in those checks is not
  caught by the boundary.
- **The child runs as the same user with the same filesystem privileges** as
  the Service. The boundary is a process boundary, not a privilege boundary.

## Credential and environment boundary

Observed in the live run against a real remote:

- `GIT_ASKPASS` and `SSH_ASKPASS` are both the **empty string**;
  `GIT_TERMINAL_PROMPT` is `0`; `credential.helper=` is set empty on every
  git invocation. No credential can be prompted for, and no helper can supply
  one.
- The surface carries **no credential field at all** (AC-0106), so there is no
  credential in the process to leak.
- `GIT_CONFIG_GLOBAL` and `GIT_CONFIG_SYSTEM` are redirected and
  `GIT_CONFIG_NOSYSTEM` is set, so the operator's own git configuration
  cannot reach the transport.

## Materialization and removal behaviour

`git init`, then `fetch --depth=1 --no-tags` of an exact commit SHA, then
`checkout --detach --force FETCH_HEAD`, all under the pinned configuration
with `transfer.fsckObjects=true` and `core.symlinks=false`. Removal is an
observe-then-delete walk that refuses to follow links at every level. The live
run removed its state root and reported `removed: true`.

## Failure behaviour

- A liveness comparison that cannot be made **declines** rather than reclaiming
  — the fail-closed direction. A token rendered under a different convention is
  such a case, and declines while its process is live and the candidate is
  younger than the reclaim age.
- A spawn that never ran currently folds into "the process is absent", which
  reclaims. This is a **known defect**, routed to
  `liveness-read-fails-open-to-reclaim` in `[backlog].open` rather than
  repaired in this slice.
- An inspection that does not complete yields `no-verdict` with a condition
  naming why, never a fabricated result.

## Code that must be deleted or rewritten on expiry

The whole of `apps/studio-service/src/trials/connect-and-orient-runtime/`,
its tests, and the three call sites that reach it:
`runtime-supervisor.ts`'s export surface, the `source.*` protocol handlers
that invoke it, and the desktop preload's `source` namespace. The design-system
inspection family and the connect and verdict surfaces are **not** trial code;
they describe a product capability that outlives the runtime that served it.

## Observations for the three Stage 2 gate criteria

**No verdict is recorded for any of these.** AC-0153.

### 1. Does the runtime hold state, supervision or policy the Studio Service could not hold without taking on untrusted content?

**Observed:** exactly one row in the table above is classified *Needed*, and
its ground is untrusted content on disk. Everything else is *inherited* — it
exists because the tree does. Supervision is real and is genuinely
process-shaped: the group signal and the deadline have no single-process
equivalent for a runaway child. Policy is a pinned configuration that a
single-process design could apply to the same subprocesses.

**What the assessor should weigh:** whether "untrusted content on disk" is
sufficient to carry D1 on its own, given that it is the only load-bearing
entry, and whether the group-signalled lifecycle is a second one.

### 2. Was any isolation property actually enforced by the boundary, rather than by convention?

**Observed:** the closed environment and the group-signalled lifecycle are
enforced by the boundary — neither is available to a single process for a
subprocess it did not isolate. The Service not reading the tree, path
confinement, and the privilege model are **convention**: same user, same
filesystem rights, checks in code. Both answers are present, and this note does
not weigh them against each other.

### 3. Did the contract need a local-filesystem assumption to express the inspection request?

**Observed: no.** The inspection request carries a canonical source identity
and a sweep domain, both named arguments on the argument vector. No local path
is inferred, and the protocol methods carry none.

**AC-0152, stated because it changes what this observation is worth:** the
no-local-path property and the Runtime placement of supervision were both
**mandated by this specification** rather than discovered by building. The
spec required them before the code existed. An assessor reading "no local path
assumption was needed" should read it as "the specification forbade one and
the implementation complied", not as evidence that none would have arisen.
