# ARS-THREAD-001 — Connect and Orient

> This is a framed delivery-thread intent, not an approved specification. It
> shapes one bounded application steel thread into a single reviewable outcome.
> It creates no capability and replaces no capability intent; the reviewed
> capability intents it draws on remain Draft and unchanged.

- **Status:** Draft
- **ID:** ARS-THREAD-001
- **Slug:** `connect-and-orient`
- **Level:** feature
- **Scale:** app
- **Maturity:** brownfield
- **Parent intent:** [ARS-STRATEGY-001 — Make product work visible before automating it](make-product-work-visible-before-automating-it.md)
- **Owner:** Agent-Ready Studio maintainers
- **Source:** [RFC-0001](../../rfc/0001-studio-authority-planes-and-workspace-runtime-boundary.md)
  follow-on item 7, framed 2026-09-13
- **Horizon:** Now

## Why this is a feature intent

One bounded, independently reviewable application steel thread, intended to
graduate into one delivery brief after framing and de-risking. It is not a new
product vision, not a product strategy, and not a capability family.

The capabilities it exercises already exist as reviewed Draft intents and are
not replaced or superseded here. They span three initiatives: six from INI-004
(Repository Workspace Pane), one from INI-001 (Studio Foundation and Workspace
Kernel), and one from INI-005 (Studio Shaping Workbench, Horizon Next) taken
only for its availability-explanation surface.

## Derived from

Each row is a reviewed Draft capability intent this thread exercises. None is
modified by this intent, and none is superseded by it. The mapping is
[RFC-0001's](../../rfc/0001-studio-authority-planes-and-workspace-runtime-boundary.md)
own, recorded in its companion note.

| Source intent | Initiative | What this thread takes from it |
| --- | --- | --- |
| [ARS-REPO-001 — Read-only public GitHub repository connection](read-only-public-github-repository-connection.md) | INI-004 | A public GitHub URL as the only input; no install and no persistent clone |
| [ARS-REPO-002 — Repository identity, revision pinning, and trust boundary](repository-identity-revision-pinning-and-trust-boundary.md) | INI-004 | Canonical source identity, the exact revision, and content-as-data |
| [ARS-REPO-003 — Agent-Ready repository detection](agent-ready-repository-detection.md) | INI-004 | Whether the repository is Agent-Ready, and which surfaces exist |
| [ARS-REPO-004 — Workspace status pane of glass](workspace-status-pane-of-glass.md) | INI-004 | The status projection the user reads |
| [ARS-REPO-005 — Queue detail, blocker explanation, reconciliation, and refresh](queue-detail-blocker-explanation-reconciliation-and-refresh.md) | INI-004 | Blocker explanation, staleness, and refresh |
| [ARS-REPO-006 — Pack, profile, adapter, and skill capability visibility](pack-profile-adapter-and-skill-capability-visibility.md) | INI-004 | Which packs and skills are present or absent |
| [ARS-CORE-006 — Local Studio Service, persistence, protocol, and source adapters](local-studio-service-persistence-protocol-and-source-adapters.md) | INI-001 | Restart-safe connection state and a replaceable source boundary |
| [ARS-SHAPE-001 — Open shaping work from workspace status](open-shaping-work-from-workspace-status.md) | INI-005 (Next) | The **availability explanation only**. Shaping dispatch is excluded |

The [roadmap's Wave 1](../roadmap.md) candidate sequence is ARS-REPO-001
through ARS-REPO-006. This thread is that sequence plus two named additions:
ARS-CORE-006, because the source-adapter boundary is load-bearing here, and
ARS-SHAPE-001's explanation surface. The additions are the steel-thread note's,
not this intent's.

## Related

- [Connect and Orient steel thread](../../rfc/0001-notes/connect-and-orient-steel-thread.md)
  — the accepted companion note that warrants this thread. **It owns the
  definition of done and the Stage 2 gate criteria**, and remains the single
  source of truth for both. The guardrails below sharpen definition-of-done
  items 1, 2, 3, 5, and 6, and the note's repository-mutation non-goal, into
  named falsifying observations; they are not a second definition.
- [Post-acceptance follow-ons](../../rfc/0001-notes/post-acceptance-follow-ons.md)
  item 7 — the follow-on this intent answers, and the only place a provisional
  trial runtime is authorized.
- [Agent-Ready Repo counterpart contract](../../rfc/0001-notes/agent-ready-repo-counterpart-contract.md)
  — the upstream needs this thread has, none of which upstream has agreed to.

## Outcome

A product or engineering lead can enter a public GitHub repository URL and,
without opening a terminal or starting an agent, understand which exact
immutable revision Studio inspected, whether the repository is Agent-Ready,
what initiatives and work state it holds, why work is blocked or unavailable,
which relevant packs and skills are present or absent, which canonical artifact
supports a selected item, and whether shaping is available.

- **Input (steerable):** a user connects one public repository and reaches a
  comprehensible orientation result from one pinned inspection — one URL in,
  one pinned revision, one readable state.
- **Outcome (lagging):** after the thread ships, leads stop reconstructing
  repository lifecycle semantics by hand. The signal is observed over the weeks
  following delivery, not in the demonstration, and is stated once as A1's
  falsification clause below.
- **Guardrails:**
  - The inspected commit SHA is visible wherever inspected state is shown.
  - **No repository-authored code path is executed.** The falsifying
    observation is concrete: a subprocess spawned from repository content, a
    repository hook fired, a repository-projected skill run, or a
    repository-declared package command invoked.
  - **Repository content never acquires authority.** Per
    [charter](../../CHARTER.md) clause 5, source content is data: it never
    alters Studio's tools, permissions, routing, lifecycle status, or verdicts.
    The falsifying observation is any repository-supplied value changing one of
    those five.
  - No credential, token, or private-repository access is accepted, stored,
    transmitted, or offered on any path — including as a mitigation for rate
    limiting.
  - No mutation of the source repository occurs.
  - A non-Agent-Ready, malformed, or unsupported repository produces an honest
    diagnostic result rather than a misleading success or a silent empty state.

### Proof signal

Falsifiable qualitative proof, not a fabricated number: there is no traffic to
measure against, and the repository has no usage telemetry. The signal accepted
as proof has three parts, and all three must hold.

1. **Orientation.** Against an Agent-Ready repository holding at least one
   blocked item, a lead unfamiliar with AgentBundle internals can, from the
   Studio surface alone, name the inspected revision, the Agent-Ready verdict,
   one blocked item and the reason it is blocked, which expected packs and
   skills are present or absent, and whether shaping is available — and can
   open the canonical artifact behind a selected item.
2. **Negative and degraded cases.** The same surface produces a
   distinguishable, actionable result against each of three further repository
   classes: a normal non-Agent-Ready repository, a malformed workspace, and an
   unsupported workspace version. None of the three is presented as a
   successful *Agent-Ready* inspection, and none is a silent empty state. A
   non-Agent-Ready repository is a normal, non-error result, not a failure —
   definition-of-done item 5, and the boundaries ARS-REPO-001 and ARS-REPO-003
   already hold.
3. **Durability and the two code-execution guardrails.** The last successful
   inspection survives restart with its revision and freshness intact, a
   refresh detects a changed revision, and the "no repository-authored code
   path is executed" and "repository content never acquires authority"
   guardrails are asserted by automated tests rather than by review.

## Opportunity

Understanding what work exists in a repository, what state it is in, what
blocks it, and what is currently safe to do next — without first learning how
AgentBundle and Agent-Ready Repo represent any of it.

- **Functional job:** understand what work exists in a repository, what state
  it is in, what blocks it, and what action is currently safe.
- **Emotional job:** feel confident that the displayed state is tied to an
  exact source revision, and that nothing in the repository was silently
  trusted or executed to produce it.
- **Social job:** explain repository state and next actions to teammates
  without requiring everyone to understand AgentBundle internals or to read
  `workspace.toml` by hand.
- **Struggling moment:** repository lifecycle state is distributed across
  coordination files, canonical artifacts, installed capabilities, and
  command-line output. Orientation today requires terminal use and prior
  Agent-Ready knowledge, so the people who most need the answer are the least
  able to get it.

### Current state — brownfield

No source registry, no source adapter, and no repository-connection surface
exists today — see the [reference architecture's](../../architecture/reference.md)
current implementation ownership table, where Source and Execution have no
implementing component. This thread therefore adds a first connected-source
path rather than replacing one. The
[architecture overview](../../architecture/overview.md) is the authority for
what the repository currently contains; the shipped Product Development walking
skeleton is the surface this thread lands beside.

## Boundary

### In scope

- Public GitHub repository URL as the single input.
- Canonical source identity for that URL.
- Resolution to an exact commit SHA before any inspection.
- Ephemeral read-only materialization of that exact commit, **performed by the
  provisional trial runtime** described below.
- Agent-Ready detection.
- Workspace-status projection.
- Blocker and dependency explanation.
- Pack and skill visibility.
- Canonical artifact viewing.
- Persisted last-successful inspection metadata.
- Refresh and staleness behavior.
- Honest shaping-availability explanation. Availability is in scope; dispatch
  is not. The thread ends by telling the user truthfully whether shaping could
  run, and stops.

### The execution vehicle is the provisional trial runtime

Materialization, filesystem isolation of that materialization, invocation of
the inspector, and disposal are Execution-plane work. This thread does **not**
place them in the Studio Service. Doing so would put the single writer of
accepted product state in contact with untrusted repository content. That
arrangement is the *gate-failed* outcome: the follow-on note's
["If the Stage 2 gate fails"](../../rfc/0001-notes/post-acceptance-follow-ons.md)
section states it "deserves its own recorded decision rather than arriving by
default, because reference-architecture invariants 3, 7, and 11 all currently
draw the line the other way". Adopting it here would settle the gate by
construction, ahead of the gate.

The vehicle is therefore the **provisional trial runtime**.
[Follow-on item 7](../../rfc/0001-notes/post-acceptance-follow-ons.md)
authorizes it, and only item 7 does, under its own constraints:

- time-boxed, with the box agreed when the trial is authorized;
- explicitly a spike, **not** `apps/workspace-runtime`, carrying no stereotype
  authority, and citable as precedent by nothing;
- built against a provisional contract, **not** `packages/runtime-protocol`;
- discarded or rewritten once the gate is assessed, whichever way it goes.

### Out of scope

Credentials. Private repositories. Repository mutation of any kind. Persistent
managed clones. Attaching an existing local folder. Git worktrees. Agent
execution. MCP orchestration. Shaping dispatch. Build dispatch. Cloud
execution. Multiple repositories. Parallel runs. Installer design. Permanent
Runtime component design. Runtime process-boundary acceptance. General
repository browsing. Executing arbitrary source content.

### What this intent does not decide

- **It does not decide RFC-0001's Stage 2 Runtime gate, and it does not claim
  that gate has passed.** That gate is assessed only after this thread has been
  **delivered**. Shaping is design work and settles nothing about it.
- **This thread is not a neutral experiment.** It presupposes runtime
  delegation rather than comparing delegation against in-process
  materialization — the steel-thread note says so of itself. It can show
  whether the delegation carried its weight; it cannot show that no
  alternative would have worked.
- It does not authorize `apps/workspace-runtime`, `packages/runtime-protocol`,
  or `contracts/jsonschema/runtime`.
- It does not author or oblige anything in `agent-ready-repo`.
- It does not settle ARS-REPO-001's unresolved access-approach or caching
  questions. "Ephemeral read-only materialization" is the steel-thread note's
  choice for this thread only; ARS-REPO-001 keeps its open access approaches
  and its open caching-lifetime question for its own later shaping.

## Assumptions

What must be true for the bet to pay off. None is proven here; `de-risk-intent`
selects one, predeclares a condition, and tests it.

- **A1 — User value.** A read-only pane gives orientation value before Studio
  can shape or build repository work. **Falsified if** a lead who has used the
  pane still opens a terminal, reads `workspace.toml`, or asks a maintainer in
  order to establish the revision, the Agent-Ready verdict, a blocker reason,
  or shaping availability.
- **A2 — Immutable source identity.** A public GitHub branch or tag can be
  resolved to an exact commit before inspection, and that identity can remain
  visible throughout the experience.
- **A3 — Safe trusted inspection.** Agent-Ready state can be inspected using
  trusted inspection logic — AgentBundle-owned if upstream agrees,
  Studio-authored in the trial otherwise; see A9 — without executing
  repository-authored scripts, hooks, skills, package commands, or
  instructions.
- **A4 — Semantic fidelity.** Studio can consume a machine-readable inspection
  result without independently reimplementing `workspace.toml` lifecycle
  semantics.
- **A5 — Useful failure states.** Non-Agent-Ready, malformed, unsupported,
  unavailable, rate-limited, and stale sources can be distinguished from one
  another with actionable diagnostics.
- **A6 — Read-only shaping availability.** Studio can explain whether shaping
  would be available from repository and capability metadata, without
  dispatching shaping.
- **A7 — Restart-safe connection state.** Studio can preserve source identity,
  last successful inspected revision, freshness, and diagnostic state without
  retaining a writable clone.
- **A8 — Provisional Runtime hypothesis.** The proposition is criterion 1 of
  [the steel-thread note's Stage 2 gate criteria](../../rfc/0001-notes/connect-and-orient-steel-thread.md),
  which owns its wording and can genuinely return "no". It is not restated
  here. **A8 cannot be validated by shaping.** RFC-0001 requires it to be
  assessed after the delivered thread, so it is carried as a post-delivery
  validation hook and is never the de-risk verdict of this intent.
- **A9 — No agreed upstream inspection contract.** A3 and A4 both depend on an
  inspection contract that no upstream owner has agreed to. An installed
  workspace-status backend does exist inside an Agent-Ready repository
  (ARS-REPO-004), so the capability is not unbuilt; what is missing is a
  stable, version-reporting, diagnostically-coded interface Studio may depend
  on. The
  [counterpart-contract note](../../rfc/0001-notes/agent-ready-repo-counterpart-contract.md)
  records safe deterministic inspection, schema-version reporting, item
  classification, blocker explanation, and stable diagnostics as **needs
  Studio has of `agent-ready-repo`**, which those maintainers have not seen,
  and paired ownership artifacts are Stage 2 work unlocked only *after* this
  gate passes. The assumption is that the thread can still be delivered with
  the trial's inspector authored Studio-side against a provisional contract,
  without Studio taking ownership of workspace lifecycle semantics it would
  then have to keep.
- **Knowledge surface:** in-repo doc set (`docs/`) — consulted for business
  domain and meaning (charter, reference architecture, RFC-0001 and its notes)
  and for in-flight and roadmap state (`docs/product/roadmap.md`,
  `workspace.toml`). No MCP knowledge tool or internal CLI surface — none
  detected. This line is the required audit field of the `frame-intent`
  contract, not an assumption about the bet. That skill is installed at user
  scope and is deliberately not projected into this repository, so no sibling
  intent here carries the field.

## Unresolved questions

Inherited from the mapped source intents, which keep their own copies. This
thread must answer them to be delivered; none is answered here, and answering
one here would not change the source intent that owns it.

1. Which access approach survives rate limits, large repositories, and offline
   use, and what evidence decides between them? (ARS-REPO-001 Q1)
2. Is any local caching allowed under "no persistent clone", and if so what is
   its lifetime? (ARS-REPO-001 Q3)
3. What is the minimum evidence that a repository is Agent-Ready, and what is
   merely suggestive? (ARS-REPO-003 Q1)
4. What does Studio show when the conventions are present but at a workspace or
   contract version it does not understand? (ARS-REPO-003 Q2, ARS-REPO-004)
5. What does Studio offer a user whose repository is detected as not
   Agent-Ready? (ARS-REPO-003 Q4)
6. How is durable connection identity held across restart, and what does the
   user see when the pinned revision is no longer reachable? (ARS-REPO-002 Q1
   for identity; ARS-CORE-006 Q4 for the recovery path when the local store and
   the external source disagree)
7. **Canonical artifact viewing is in scope but has no owning capability
   intent in the mapped set.** Definition-of-done item 9 settles that this
   thread delivers it, so its inclusion is not in question. Its *ownership* is:
   ARS-SHAPE-001 is taken here only for its availability explanation, and the
   roadmap places "open its canonical intent and source context in Studio" in
   Wave 2. Which capability intent should own the read-only viewer?

## Decomposition

Performed 2026-09-13 by `decompose-intent`, after the de-risk verdict. One
level only: this is the feature leaf, so it produces a delivery projection, not
child intents.

**The cut.** One coordinating delivery brief,
[`docs/product/briefs/connect-and-orient.md`](../briefs/connect-and-orient.md),
carrying one delivery slice — *Connect and Orient public-repository inspection*
— plus the governance references and the deferred upstream half.

**Why a brief and not a direct spec.** Two installed contracts agree. The
`decompose-intent` contract projects an `app`-Scale feature leaf onto a single
`core` brief under `docs/product/briefs/<slug>.md`. The
`author-delivery-brief` contract admits a brief for "a coherent multi-slice or
cross-repository outcome" and refuses one only for a single direct-light
change; the de-risk verdict above already reframed this thread as paired Studio
and Agent-Ready Repo work, which is the cross-repository case. The brief is
also the only durable home for four facts that outlive a spec body that freezes
at ship: the deferred upstream slice, the governance reference set, the trial
Runtime time box, and the Stage 2 evidence obligation. `receive-brief` is not
used — its installed skill declares itself a deprecated alias for
`author-delivery-brief continue`.

**Why one vertical slice and not several.** Only one independently shippable,
independently testable unit exists today. The upstream half — initiative naming,
capability inventory, and unsupported-version reporting — is owned by
`agent-ready-repo` maintainers who have not seen it, and paired artifacts are
RFC-0001 follow-on item 9, unlocked only after the Stage 2 gate. It is recorded
as deferred scope in the brief, not as a slice.

**Rejected cuts.** Runtime process, Studio Service work, desktop UI,
persistence, protocol, and tests were each considered and rejected as delivery
slices. They are implementation layers of one outcome: none ships or is
testable as user value on its own, and cutting there would let repository
layering rather than shippability decide the tree.

**What this record does not do.** It confers no delivery authority, moves no
source capability intent, and does not touch the Stage 2 gate. The brief's own
Ready gate and the slice-confirmation gate are separate human decisions.

## Ratification

- **Decision:** Approve as framed.
- **Gate:** G0 — Connect and Orient framing ratification.
- **Actor:** the Agent-Ready Studio maintainer operating this session
  (git author `Eu Gene Lim`).
- **Timestamp:** 2026-09-13.
- **Evidence:** an explicit interactive human confirmation given in the shaping
  session, in response to a structured option card offering approve, approve
  with constraints, redirect, explore alternatives, park, and abandon. This is
  **not** a harness attestation and not a cryptographic or external one: the
  current harness provides no agent-untokened attestation channel, so the
  evidence is the human's own interactive message and nothing stronger.
- **Ratified revision:** SHA-256
  `e91027c315f1e259d1842d110fc79a9ca2012cea489f15f715027bfc368dbbe8`, 345
  lines — the artifact exactly as the fourth independent review round found it
  Clean, before this section was written. The digest necessarily precedes its
  own record; later sections are additive and do not alter the ratified
  framing.
- **Constraints attached:** none.
- **Rationale:** the slice matches RFC-0001's accepted steel thread without
  exceeding it; four rounds of independent cold review converged Clean, with
  the runtime-scope, Stage 2 gate, trust-boundary, and solution-independence
  axes all clean; and the artifact is a fully reversible two-way door — three
  uncommitted text files, no code, no schema, no directory, no capability ID,
  and no upstream contact.
- **Next authorized transformation:** `de-risk-intent`, and nothing else.
  Ratification does **not** authorize decomposition, a delivery brief, a
  specification, implementation, Runtime scaffolding, provider execution, or
  RFC-0001's Stage 2 Runtime decision.

## De-risk

### Reversibility triage

Four distinct decisions sit inside this thread, and they do not share a door.

| Decision | Door | Why |
| --- | --- | --- |
| This Product Intent artifact | Two-way | Three uncommitted text files. Reverting is a checkout and a delete |
| The bounded read-only product slice | Two-way | No credentials, no writes, no persistent clone, no schema, no migration. Nothing outside Studio observes it |
| The **trust boundary** — "no repository-authored code path is executed" | **One-way** | A shipped inspection path that can be induced to run remote content is a security defect with an exploit window, not a preference to revise. Charter clause 5 and permanent non-scope 4 both bind it, and retrofitting a trust boundary after a consumer depends on it is the expensive case |
| The durable Runtime process boundary | **Not decided, and not decided here** | RFC-0001's D1 is gated on the *delivered* thread. This de-risk pass does not classify it, does not test it, and does not pre-empt it |

The one-way component dominates, so the bet is triaged **one-way** and takes
the `validate-first` default.

### Selected assumption — A3, safe trusted inspection

Consequence of being wrong × absence of current evidence.

**Why A3 and not another.** A2 carries high consequence but strong evidence —
resolving a ref to a commit is a settled, universally available read-only
operation, so its risk is low. A5, A6, and A7 are predominantly design and
presentation risk on a reversible surface; A7 in particular is already
demonstrated by the shipped walking skeleton's restart-safe SQLite state. A1
is real but reversible, and its falsification is observed after delivery, not
before. That leaves A3 and A4, which sit on the same one-way trust-and-
authority boundary.

**A3 is selected over A4** because its failure mode is strictly worse and its
evidence is strictly thinner. If A4 fails, Studio has a maintenance and
divergence problem — costly, visible, and correctable. If A3 fails, a remote
repository can cause code to run by being inspected, which collapses the
read-only claim the entire thread rests on and breaches a permanent charter
boundary. The evidence position is the weaker one too: the
[counterpart-contract note](../../rfc/0001-notes/agent-ready-repo-counterpart-contract.md)
records "no execution of repository-authored skill or hook code during remote
inspection" as **the load-bearing security property**, states it as a *need*
Studio has of `agent-ready-repo`, and records that those maintainers have not
seen or agreed to it. Nothing in this repository currently demonstrates it.
A4's evidence is thin but not absent — ARS-REPO-004 assumes the installed
workspace-status backend is a sufficient projection source.

The probe that tests A3 necessarily also produces evidence on A4, because both
turn on the same question: whether a trusted, installed inspector can target an
arbitrary repository root. A4's result is reported as a secondary finding, not
as this pass's verdict.

**A8 is excluded from this verdict by RFC-0001's accepted sequencing.** Its
validation point is after the thread is delivered.

### Approach — validate-first

Chosen because the selected assumption is a trust-boundary property, not a
comprehension, interaction, or user-value question. `prototype-led` is the
wrong instrument here: a prototype that felt good would tell us nothing about
whether remote content can execute, and building the surface first would put
the one-way decision ahead of the evidence. The cheapest probe that can
actually falsify A3 is a disposable technical one against real inputs.

### Predeclared kill or reframe condition

**Recorded 2026-09-13, before any evidence was gathered.**

> Kill or reframe the proposed inspection approach if the Agent-Ready workspace
> status this thread needs cannot be obtained from an exact, read-only source
> snapshot without either:
>
> 1. executing repository-authored scripts, hooks, skills, package commands, or
>    instructions; or
> 2. independently reimplementing Agent-Ready workspace lifecycle semantics
>    inside Studio.

Three outcomes are separated, and they are not interchangeable.

- **Kill the implementation approach.** Condition 1 holds: the only available
  path to the needed status runs repository-authored content. The approach is
  unsafe and is withdrawn. The user outcome is untouched.
- **Reframe as paired work.** A trusted inspector exists but cannot safely or
  completely target an arbitrary root, or cannot report the fields this thread
  needs with stable versions and diagnostic codes. The thread is then not one
  Studio slice but paired Studio and Agent-Ready Repo work, and the upstream
  contract becomes a named dependency rather than an assumption.
- **Abandon the user outcome.** Reserved for evidence that orientation itself
  is not obtainable or not wanted. **A supported inspector API not existing yet
  is not this outcome** — absence of an API is evidence about sequencing and
  ownership, not about whether the user's job is real.

Condition 2's "reimplementing" means Studio deriving lifecycle meaning —
blocked-ness, item classification, queue position — from raw repository files
itself. Rendering a classification an inspector reports is not reimplementation.

### Evidence

One disposable technical probe, run 2026-09-13 against the public repository
`https://github.com/eugenelim/agent-ready-studio` at commit
`ba554b9d87e0c87794e59ffc6d09b9ccc45ab290`, plus four temporary workspace
fixtures. Full method, exact inputs, provenance digests, and observations are
in
[the inspection-boundary probe record](../research/connect-and-orient-inspection-boundary-probe.md).
The materialization and fixtures were deleted after capture; no product code,
dependency, or component was created.

Summarized:

1. **A supported root-targeting inspector exists.** The trusted, installed,
   pack-owned `workspace_status.py` (AgentBundle `core` 2.25.9, digests
   matching `.agentbundle-state.toml`) accepts `--root` against an arbitrary
   directory and produced byte-identical output across two runs over the same
   revision.
2. **No repository-authored content was executed.** Zero process spawns, zero
   modules loaded from under the inspected root, 72 files read — all `.md` and
   `.toml`. No file under `.claude/`, `.agents/`, or `.agentbundle-state.toml`
   was opened. Structurally: the inspector contains no `subprocess`,
   `os.system`, `exec(`, or `eval(`, and its two dynamic-load sites resolve
   from the installed engine's own `__file__`, never from the target root.
3. **Three workspace forms are honestly distinguished; one is not.** Valid,
   absent, and malformed are separable, and malformed carries the stable code
   `invalid_workspace` with a `next_action`. An **unsupported** workspace form
   is reported as a healthy, empty workspace: exit 0, no findings, declared
   version ignored.
4. **Two needed fields have no trusted producer.** Initiative `name` and
   `milestone` return the literal placeholder `"workspace.toml"` rather than
   their values, reproduced on both the real repository and a controlled
   fixture; and no pack, profile, adapter, or skill inventory exists in the
   output at all.

### Limitations

The probe used one repository, one revision, one host, and a benign snapshot —
absence of execution on ordinary input is weaker evidence than a failed attempt
to induce it. The audit hook observes only its own interpreter, so "no spawn
observed" is established and "no spawn possible" is not. Rate limiting,
offline behaviour, and large repositories were not exercised, leaving
ARS-REPO-001's access question untouched. And `workspace_status.py` is the core
pack's self-inspection tool; nothing upstream commits it to being a remote
inspection contract.

### Verdict — A3 survives; the approach is reframed as paired work

**A3 — safe trusted inspection: SURVIVED.** Condition 1 of the predeclared
kill-or-reframe condition did not hold, and it was the decisive one. The needed
status is obtainable from an exact read-only snapshot without executing
repository-authored scripts, hooks, skills, package commands, or instructions —
observed behaviourally and supported structurally. This is executed technical
evidence, not desk reasoning.

**Condition 2 is partially triggered, and it selects the reframe branch, not
the kill branch.** For everything the inspector reports, Studio renders rather
than derives: blocked-ness, diagnostic codes, next actions, queue membership,
and initiative status all arrive already classified. But three needed things
cannot be obtained without Studio deriving lifecycle meaning itself or going
without:

- initiative name and milestone;
- pack, profile, adapter, and skill inventory — ARS-REPO-006's whole
  contribution, and the factual basis for the shaping-availability answer;
- an honest *unsupported* verdict, without which Studio cannot refuse a
  workspace version it does not understand and would instead show a confident
  empty state.

The predeclared reframe branch names exactly this case: a trusted inspector
exists but cannot report the fields this thread needs with stable versions and
diagnostic codes. **The thread is therefore not one Studio-only slice.** It is
paired Studio and Agent-Ready Repo work, and the upstream contract moves from
an assumption to a named dependency.

**The user outcome is not abandoned and was never in question.** A supported
inspector API not existing yet is evidence about sequencing and ownership, not
about whether the job is real — the probe in fact showed most of the needed
projection already exists and is safe.

**A4 — semantic fidelity: partially falsified, secondary.** It holds for the
reported fields and fails for the three above. The correct response is the
upstream contract, not copying workspace parsing into Studio. **No workspace
parsing logic was written during this probe, and none should be written to work
around the gap.**

### Implications

- The three gaps become the concrete content of the Agent-Ready Repo
  counterpart request. That request is Stage 2 item 9 work, unlocked only after
  the gate; it is recorded here as the **recommended next action**, and no file
  in `agent-ready-repo` is created, proposed, or edited.
- If upstream declines, the fallback is a trial-owned inspector authored
  Studio-side against a provisional contract — A9's bet — with the standing
  constraint that Studio must not take durable ownership of workspace lifecycle
  semantics.
- The unsupported-version gap is a security-adjacent honesty defect, not only a
  feature gap. It should be treated as a named acceptance criterion whenever
  this thread becomes a brief.

### Validation hooks

```
validation_hook:
  assumption: A3 - Agent-Ready state can be inspected from a pinned read-only
    snapshot without executing repository-authored content.
  kill_condition: the needed status cannot be obtained without executing
    repository-authored scripts, hooks, skills, package commands, or
    instructions (predeclared 2026-09-13; did not hold).
  activity: adversarial inspection of a deliberately hostile repository
    snapshot - crafted hooks, malicious workspace values, symlink escapes,
    oversized and deeply nested inputs - run under process-level rather than
    interpreter-level observation. The benign-snapshot result must not be
    treated as validation against a repository built to attack the inspector.

validation_hook:
  assumption: A4 - Studio can consume a machine-readable inspection result
    without reimplementing workspace lifecycle semantics.
  kill_condition: a field this thread must display is obtainable only by Studio
    deriving lifecycle meaning from raw repository files.
  activity: agree the counterpart contract with agent-ready-repo maintainers
    covering initiative naming, pack and skill inventory, and unsupported
    version reporting; failing agreement, hold the trial inspector's semantics
    behind a provisional contract and measure how much lifecycle meaning Studio
    accumulated.

validation_hook:
  assumption: A1 - a read-only pane gives orientation value.
  kill_condition: a lead who has used the pane still opens a terminal, reads
    workspace.toml, or asks a maintainer to establish the revision, the
    Agent-Ready verdict, a blocker reason, or shaping availability.
  activity: observed orientation sessions with leads unfamiliar with
    AgentBundle internals, after delivery.

validation_hook:
  assumption: A8 - the provisional execution-plane process boundary carries
    meaningful isolation, supervision, state, or policy.
  kill_condition: criterion 1 of the steel-thread note's Stage 2 gate criteria,
    which owns its wording and can return "no".
  activity: POST-DELIVERY ONLY. After Connect and Orient is delivered through
    the provisional trial runtime, assess whether the boundary held state,
    supervision, isolation, or policy that the Studio Service could not own
    without taking on untrusted content.
```

### The Stage 2 gate is untouched by this pass

Stated explicitly, because a de-risk verdict is easy to mistake for one:

- **This task does not assess the Stage 2 gate.** A8 was excluded from the
  verdict by RFC-0001's accepted sequencing, and the probe produced no evidence
  about it — the inspector ran in-process under an observation harness, with no
  runtime, no process boundary, and no isolation mechanism built or tested.
- **Shaping does not establish a permanent Runtime process.** Shaping is design
  work and settles nothing about whether the boundary earned itself.
- **No `apps/workspace-runtime` component is authorized**, and none exists.
- **No Runtime contract package or schema root is authorized** — neither
  `packages/runtime-protocol` nor `contracts/jsonschema/runtime`.
- **The accepted gate is evaluated only after the steel thread is delivered.**

## Owner

Agent-Ready Studio maintainers.

## Source

- Mode: repo-origin, matching this artifact's `workspace.toml` entry.
- Locator: [RFC-0001 post-acceptance follow-on item 7](../../rfc/0001-notes/post-acceptance-follow-ons.md)
  and its [steel-thread companion note](../../rfc/0001-notes/connect-and-orient-steel-thread.md),
  both Accepted 2026-09-11.
- Revision: framed 2026-09-13.
- Authority: this file is the authoritative record of the framed thread. It
  confers no approval, no delivery authority, and no authority over the
  reviewed capability intents it draws on or over `agent-ready-repo`.
