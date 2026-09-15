# Delivery brief: Connect and Orient

- **Status:** Ready
- **Slug:** `connect-and-orient`
- **Received:** 2026-09-13
- **Owner:** Agent-Ready Studio maintainers
- **Parent:** docs/product/intents/connect-and-orient.md
- **Source:** [RFC-0001](../../rfc/0001-studio-authority-planes-and-workspace-runtime-boundary.md)
  post-acceptance follow-on item 7, projected through `decompose-intent` from
  the
  ratified and de-risked ARS-THREAD-001 on 2026-09-13

> This brief coordinates one outcome that Studio cannot complete alone. Only the
> Studio work is deliverable now. The capability Studio needs from
> `agent-ready-repo` is recorded below as an unowned dependency, not as scope
> and not as a delivery slice. Nothing here authors, obliges, or proposes
> anything upstream.

> **Altitude.** This brief owns the outcome, the boundary, and the gaps. It does
> not own mechanism: how a criterion is met, what a surface renders, and which
> values a contract pins are the spec's decisions, and are routed there
> explicitly below rather than pre-empted here.

## Outcome

A product or engineering lead can connect one public GitHub repository and
understand its exact inspected revision, Agent-Ready state, work queues,
blockers, relevant capabilities, canonical artifact, and shaping availability
without a terminal, credentials, source mutation, or execution of
repository-authored content.

## Success evidence

The [Connect and Orient steel-thread
note](../../rfc/0001-notes/connect-and-orient-steel-thread.md)
**owns the definition of done** — its items 1-11 — and the parent intent records
it as the single source of truth for both that definition and the Stage 2 gate
criteria. Delivery is measured against the note, by reference. This section
carries only what this brief adds.

**Item 11 is named, not restated, because it answers a gate question.** Stage 2
gate criterion 3 asks whether the contract needed a local-filesystem assumption
to express the inspection request; note item 11 is the design-time form of the
same question. Delivery must be able to show its answer — but passing item 11
does not answer the criterion. The note is explicit: item 11 is "a **necessary
condition, not the falsification test**… it can be satisfied by a boundary that
turns out to be worthless." A request expressible only against a local
filesystem means the split has certainly failed; satisfying item 11 establishes
nothing about whether it succeeded.

**Delivery records what the Runtime held, and why.** The Runtime performs the
declared-value reads because it is the process holding the materialization,
which makes them a **candidate** for the inherited column rather than evidence
that the boundary earned itself. Delivery classifies them; this brief only
flags which way they are likely to fall, and does not classify supervision,
isolation, or disposal at all. Criterion 1 asks whether the Runtime held state,
supervision, or policy
the Studio Service could not hold without taking on untrusted content, and the
steel-thread note says it "can genuinely return 'no'". Delivery therefore
records, for each thing the Runtime ended up holding, whether it **needed** the
Runtime or merely **inherited** it by happening to hold the materialization.
That record is evidence for criterion 1; it is not a finding about it, and this
brief takes no position on the answer.

**Addition A — version honesty.** A workspace whose version Studio cannot
confirm the trusted inspection covers is never presented as a confident,
healthy Agent-Ready repository, and a workspace declaring no version marker is
reported as declaring none rather than as agreeing. The de-risk Implications
section directed this into the brief as a named criterion, calling the gap "a
security-adjacent honesty defect, not only a feature gap." **The mechanism is
spec-owned** and is routed in Open questions below; this is the outcome, not a
design.

**Addition B — the guardrails are test-asserted against the code this delivery
writes.** The note says its items 2 and 3 "should be asserted by tests, not by
review alone." The obligation is stated by property rather than by component:
each
guardrail's named falsifiers are asserted wherever this delivery writes code
that could produce them. That reaches past the two bodies the de-risk probe
never observed — the trial Runtime and the enrichment seam — to the Studio
Service, the protocol, persistence, and the pane, which is where guardrail 3's
credential falsifiers and guardrail 2's authority falsifiers would actually
arise. The properties under test are the three Constraints guardrails below;
the note's items 2 and 3 warrant guardrails 1 and 3, and guardrail 2's
test obligation comes from the parent's proof signal part 3. Charter clause 5
establishes guardrail 2's property; the obligation to test it is the proof
signal's.

## In scope

- One public GitHub repository URL as the single input.
- GitHub source canonicalization.
- Exact immutable commit resolution before inspection begins.
- Provisional Runtime delegation of materialization, isolation, inspector
  invocation, deterministic result capture, and disposal — the steel-thread
  note's five, with its fifth — "disposing of the materialization, or
  explicitly caching it — never implicitly" — carried as disposal only, because
  persistent managed clones are a Non-goal and the retention constraint bounds
  what survives — plus **declared-value reading**, which is this brief's
  addition
  and is accounted for in Success evidence. The parent intent's
  execution-vehicle wording names four of the five; result capture is the
  note's, and is carried because determinism over a pinned revision is what the
  retention constraint's "recorded inspection of a resolved SHA" rests on.
- Ephemeral read-only materialization.
- Trusted AgentBundle inspection.
- Trial-owned normalization for the three known gaps, bounded by the seam rule
  in Constraints.
- Studio Service source and inspection persistence.
- Extension of the existing Studio protocol.
- A repository status pane.
- Canonical text-artifact viewing.
- Refresh and staleness.
- Actionable diagnostics distinguishing unavailable and rate-limited sources
  from the other result classes, per the parent's assumption A5.
- Shaping-availability explanation, bounded by the availability rule in
  Constraints.

## Non-goals

- Private repositories.
- Credentials or tokens.
- Source writes.
- Persistent managed clones.
- Local-folder attachment.
- Git worktrees.
- Multiple repositories.
- Parallel runs.
- Cloud execution.
- Agent execution.
- MCP orchestration.
- Shaping dispatch.
- Build dispatch.
- Generic repository browsing.
- Permanent Runtime architecture.
- A durable Runtime contract package.
- **Acceptance of the Runtime process boundary.** Delivery produces evidence
  for RFC-0001's Stage 2 gate; it never concludes that gate, and no artifact
  this brief governs records a gate verdict.
- Upstream `agent-ready-repo` changes.
- Installer design.

## Constraints

**The three guardrails are non-waivable.** The parent's Outcome carries six.
The three carried here as falsifiable constraints are the ones a reviewer must
be able to test against this delivery; source mutation sits under Non-goals,
and revision visibility and honest-diagnostic behaviour are definition-of-done
items the steel-thread note already owns. Each constraint block below names
what would show it breached; two sub-bullets of the seam rule state
prohibitions whose observable falsifier lives in another block rather than
duplicating it. Their authority differs, and is named rather than pooled: the
parent
intent's reversibility triage classifies **guardrail 1 alone** as the single
one-way decision in this thread, and guardrails 2 and 3 rest on the charter and
on the parent's own Outcome guardrails instead.

1. *No repository-authored code path is executed.* Breached by a subprocess
   spawned from repository content, a repository hook firing, a
   repository-projected skill running, or a repository-declared package command
   being invoked.
2. *Repository content never acquires authority*, per charter permanent
   non-scope clause 5. Breached by any repository-supplied value altering
   Studio's tools, permissions, routing, lifecycle status, or verdicts.
3. *No credential path exists*, per the parent's Outcome guardrails. No
   credential, token, or
   private-repository access is accepted, stored, transmitted, or offered on
   any path, including as a mitigation for rate limiting. Breached by a
   credential input field, a token or keychain read, an authorization header on
   any request, or a credential-bearing value reaching storage or a log.

**Execution-plane work is performed by the trial Runtime, not the Studio
Service.** The parent intent places materialization, filesystem isolation of
that materialization, inspector invocation, and disposal in the Runtime, and
says why: doing them in the Studio Service "would put the single writer of
accepted product state in contact with untrusted repository content… That
arrangement is the *gate-failed* outcome… Adopting it here would settle the
gate by construction, ahead of the gate." Breached by the Studio Service
process reading, writing, or executing anything under a materialized
repository root.

**The trial Runtime carries [follow-on item
7's](../../rfc/0001-notes/post-acceptance-follow-ons.md)
four conditions**, which are its only authorization and which that item states
in full. The parent intent and that note both additionally withhold
authorization for `apps/workspace-runtime`, `packages/runtime-protocol`, and
`contracts/jsonschema/runtime`; [ADR-0007](../../adr/0007-runtime-contract-placement.md)
reserves the latter two for follow-on item 10's real contract. Breached by any
of those three paths existing. Item 7's no-precedent condition binds later
work rather than this delivery, and is not a falsifier available at delivery.
Its discard-or-rewrite condition is likewise post-gate: it fires once the gate
is assessed, so no observation at delivery settles it, and it lands with
follow-on item 8's assessment rather than here. The time box is a Ready gap
below and names no breach until it is set.

**Studio does not take durable ownership of workspace lifecycle semantics.**
This is the standing constraint the parent attaches to the very fallback this
brief relies on: "the fallback is a trial-owned inspector authored Studio-side
against a provisional contract — A9's bet — with the standing constraint that
Studio must not take durable ownership of workspace lifecycle semantics."
Accordingly the enrichment seam is trial-owned in **both** halves — the
Runtime's reading and the Studio Service's normalization — and both are
discarded or rewritten with the trial. The Runtime half dies with the trial
process by item 7's condition; the Studio-Service half lives inside a durable
process that nothing discards, so it is built to be separately removable.
Breached by lifecycle-semantic logic surviving in a durable Studio package, by
the seam outliving the trial, or by Studio-Service seam code being depended on
from a non-seam surface such that removing it requires editing code outside the
seam.

**Repository-derived content is bounded, and is never re-read as evidence.**
Only the bounded canonical artifact snapshots and the normalized projection the
delivered experience needs survive an inspection; the materialization itself
does not. No retained content is re-read as a substitute for a fresh pinned
inspection, so retention can never silently become a repository cache. Breached
by a displayed result sourced from retained content rather than from a recorded
inspection of a resolved SHA, or by retained content whose size is unbounded by
the experience that reads it. Caching lifetime beyond this slice is
ARS-REPO-001's open question, named in Open questions below.

**The enrichment seam may extract, and may refuse; it may not classify.** The
boundary is the parent's gloss on its own kill condition: "Condition 2's
'reimplementing' means Studio deriving lifecycle meaning — blocked-ness, item
classification, queue position — from raw repository files itself. Rendering a
classification an inspector reports is not reimplementation."

- *Reading and normalizing are separated, and the separation is deliberate.*
  The **Runtime** reads declared values from the target's coordination files —
  initiative name and milestone strings, and any declared workspace version
  marker — and from the target's **declared** AgentBundle state, namely
  `.agentbundle-state.toml`, `.claude/`, and `.agents/`; it returns them as
  inert data in its result. The **Studio Service** normalizes that result and
  touches no materialized path, so the execution-plane constraint above holds
  without the Studio Service inheriting filesystem reach. All of it is
  repository content read strictly as data, never as an authority, per
  guardrail 2. "Declared" is deliberate: none of these surfaces is trusted, and
  the de-risk probe records that the trusted inspector opens none of them.
- *It may not derive* blocked-versus-ready state, dependency satisfaction, item
  classification, queue semantics, lifecycle transitions, or next-action
  routing. Where the trusted inspector reports a classification, Studio renders
  it; where it does not, Studio says so. Breached by any displayed lifecycle
  meaning that no inspector output supports.
- *Version honesty is a refusal boundary, not a judgement.* Whatever mechanism
  the spec adopts, it may not invent a supported range and may not derive a
  verdict from lifecycle meaning. It must also admit a satisfying positive
  case: a workspace the trial can confirm is covered projects as an Agent-Ready
  success, so definition-of-done item 4 stays reachable. **If open question 1
  resolves negative** — no evidence exists by which any workspace can be
  confirmed covered — those two requirements cannot both hold, and the
  disposition is the same as for canonical artifact references: a delivery
  blocker surfaced to the scope owner, not a verdict the seam invents and not a
  positive case quietly dropped.
- *Shaping availability is evidence plus a Studio-local fact, never a
  derivation.* The verdict is a fact about Studio and not about the repository:
  Studio shaping dispatch is not implemented, so dispatch is unavailable
  whatever a repository declares. The declared-method read serves capability
  visibility — the Outcome's "relevant capabilities", and ARS-REPO-006's
  contribution — not the dispatch answer, and it carries an explicit
  insufficient-evidence state. Breached by an availability answer that depends
  on deriving lifecycle meaning from repository content.

## Appetite

One bounded vertical steel thread, not a reusable Runtime platform, and no
attempt to solve Wave 2 shaping execution. This sets the size; the Constraints
set the boundary.

## Risks

- **A3's evidence is bounded to the pack inspector, and this delivery writes
  code the probe never observed.** The probe's structural argument — no
  `subprocess`,
  no `os.system`, no `exec(`, no `eval(`, dynamic loads resolving from the
  engine's own `__file__` — is a property of AgentBundle `core` 2.25.9's
  `workspace_status.py`. The trial Runtime and the enrichment seam were never
  observed by it, and the seam reads a wider file surface than the validated
  path touched: that path opened no file under `.claude/`, `.agents/`, or
  `.agentbundle-state.toml`. The property transfers only if Addition B's tests
  assert it wherever this delivery writes code that could breach a guardrail —
  not only in the Runtime and the seam.
- **The no-execution property is established only against a benign snapshot,
  under interpreter-level observation.** The probe record is explicit that
  "absence of execution on benign input is weaker evidence than a deliberate
  attempt to induce it," and that "'no spawn observed' and 'no spawn possible'
  are different claims, and only the first is established here." A3's
  validation hook — adversarial inspection of a hostile snapshot under
  process-level observation — is outstanding, and A3's survival did not close
  the trust boundary.
- **`AGENTBUNDLE_ALLOW_DEV_SOURCE_AUTHORITY=1` widens the inspector's parser
  search** to a development checkout path. It resolves relative to the engine's
  own install location rather than the inspected root, so it does not weaken
  the property, but it is an env-gated widening the threat model must name.
- **The seam reclassifies all three of the things the de-risk verdict
  classified the other way** — initiative name and milestone, capability
  inventory, and the unsupported verdict — recorded as a waiver below rather
  than settled silently.
- The current trusted inspector is not a supported external inspection
  contract. It is the `core` pack's self-inspection tool, and nothing upstream
  commits it to remaining one.
- The child-process boundary may turn out to enforce no isolation property that
  convention would not have held equally well in one process. That is Stage 2
  gate criterion 2, and this brief reaches no conclusion on it.
- If the access approach open question 2 selects depends on a local Git
  binary, its error behavior may be platform-specific.
- Canonical artifact retention can accidentally become a hidden repository
  cache. The retention constraint above bounds it; the risk is that the bound
  erodes as the experience grows.

## Open questions routed to the spec

The parent intent carries seven inherited unresolved questions and states that
this thread must answer them to be delivered. Most are spec-altitude and are
answered there; their absence from this brief is a routing decision, not a loss.
Routing is by **owner**, not by altitude, and two of the seven do not belong to
the spec at all:

- **Parent question 7 — which capability intent should own the read-only
  viewer?** This is portfolio ownership of a Draft capability intent. A spec is
  the contract for one delivery slice and freezes at ship, so it cannot assign
  it. It belongs to the capability-intent portfolio and is raised at the
  slice-confirmation step, not resolved here or in the spec.
- **Parent question 2 — is any local caching allowed, and with what lifetime?**
  Owned by ARS-REPO-001, which the parent says "keeps its open access
  approaches and its open caching-lifetime question for its own later shaping".
  This slice does not settle it; the retention constraint below bounds this
  slice only.

Two more need naming because this brief's own additions depend on them.

1. **What evidence lets Studio confirm a workspace version is covered, and
   where is that evidence recorded?** Addition A states the outcome; the
   mechanism is unresolved. The spec must settle it against executed, cited
   evidence about what the trusted inspector does and does not report about
   versions, and must record that evidence with its inputs and inspector
   digests. The existing
   [probe record](../research/connect-and-orient-inspection-boundary-probe.md)
   lists `schema_version` among fields "**Present** in the structured output,
   and
   consumable without Studio deriving anything" — but consumability is not
   semantics, and the record is silent on whether that value describes the
   target or the inspector's own output contract — so it does not answer this,
   and it is historical
   evidence that is not rewritten to match implementation.
2. **Which access approach does *this slice* adopt?** Not the parent's
   unresolved question 1, which the parent reserves to ARS-REPO-001's own later
   shaping. What the spec owns is narrower and slice-local: the approach this
   delivery uses, and how it distinguishes unavailable and rate-limited sources
   with actionable diagnostics. It is load-bearing because guardrail 3
   forecloses the usual mitigation.

## Recorded dependencies

### Upstream capability Studio lacks

Upstream changes are a Non-goal above, and that governs: this brief delivers no
upstream work and creates no upstream artifact. What is recorded here is the
gap, not a division of labour. The parent's `## Decomposition` calls this
"deferred scope"; it is recorded here as an unowned dependency instead, because
ownership is unsettled and "deferred scope" would imply this brief holds it.

The de-risk pass established that three things Connect and Orient needs have no
trusted producer today: initiative name and milestone, capability inventory,
and an honest unsupported-version verdict. The
[counterpart-contract note](../../rfc/0001-notes/agent-ready-repo-counterpart-contract.md)
records these as **needs Studio has of `agent-ready-repo`**, from maintainers
who have not seen or agreed to any of them. Paired artifacts with explicit
ownership are RFC-0001 follow-on item 9, whose gating condition the Governance
references line states.

That note additionally records **canonical artifact references** as an upstream
need. Unlike the three above, the de-risk pass did not find this one missing:
it is listed as a need for a *stable* contract, not as an absent field. The
spec confirms, with cited evidence recorded to the same standard open question 1
sets — inputs, inspector digests, and the observed output — **whether**
per-item repository-relative artifact paths arrive in inspector output. It
treats their
absence as a delivery blocker rather than something the seam may derive, since
item-to-artifact linkage is exactly what the "may not derive" bullet forbids.

### An installed, version-pinned trusted inspector

Not an upstream gap: a delivery prerequisite on a pack that is already
installed. The risks above rest on properties of a specific pack version, and
open question 1
requires inspector digests in the recorded evidence. That dependency is real
scope even though "Installer design" is a Non-goal: the Non-goal excludes
building an installer, not relying on an installed pack. The spec records which
pack and version delivery pins, and how a missing or mismatched inspector
surfaces.

## Recorded waiver — the seam reads coordination files

The de-risk verdict directs the opposite response to the three gaps, and does
so unconditionally: "**No workspace parsing logic was written during this
probe, and none should be written to work around the gap.**" It adds that "The
correct response is the upstream contract, not copying workspace parsing into
Studio," and classifies capability inventory among the things obtainable only
by "Studio deriving lifecycle meaning itself or going without". The probe is
equally direct that to display an initiative's name "Studio would have to parse
`workspace.toml` itself". This brief authorizes exactly that, as a read of
declared values treated as data.

- **Authority relied on:** the parent's de-risk Implications fallback — "If
  upstream declines, the fallback is a trial-owned inspector authored
  Studio-side against a provisional contract — A9's bet" — together with the
  kill-condition gloss quoted in Constraints. The Implications section is read
  as the later and narrower licence over the unconditional sentence above,
  because it contemplates the very thing that sentence forbids and attaches
  bounds to it instead of a prohibition.
- **Why that reading is safe:** the bounds are the reason. The seam
  never classifies, is trial-owned, and dies with the trial, so no workspace
  parsing survives into durable Studio ownership — which is what the
  unconditional sentence exists to prevent.
- **Departure, stated plainly:** that fallback is conditioned on upstream
  declining. Upstream has not declined; it has not been asked, and cannot be
  until follow-on item 9 unlocks. This brief substitutes unavailability for
  refusal, which is a weaker trigger than the parent wrote.
- **Bounds:** two Constraints above carry them, each with a falsifying
  observation — "Studio does not take durable ownership of workspace lifecycle
  semantics", and the seam rule permitting extraction and refusal but never
  classification.
- **Owner:** Agent-Ready Studio maintainers.
- **Reversal:** the parent's reframe branch is already spent — condition 2 was
  partially triggered, and the reframe it selected is what produced this brief.
  So the reversal available at delivery time is concrete: withdraw the affected
  In-scope items, display the fields as unavailable with their reason, and
  return them to the recorded upstream dependency. Widening the seam is not
  among the options. **Its cost is not a clean degrade:** withdrawing the
  declared version-marker read removes the only basis for Addition A's positive
  case, because the probe records that without it an unsupported workspace
  reports as "a healthy, empty workspace: exit 0, no findings, declared version
  ignored". So this reversal triggers the version-honesty blocker disposition
  and reaches the scope owner by that route, rather than settling into degraded
  display.

## Post-delivery obligation — Stage 2 evidence

Not delivery scope, and not a slice: it happens after the thread is delivered,
by definition. Delivery produces a linked evidence note recording what the
trial Runtime actually held, enforced, and assumed.

The note **supplies evidence only**. The
[steel-thread note](../../rfc/0001-notes/connect-and-orient-steel-thread.md)
owns the three gate criteria, and
[follow-on item 8](../../rfc/0001-notes/post-acceptance-follow-ons.md) owns
recording the gate result in an ADR. Neither is performed here.

## Governance references

Constraints, unlocks, and explanations. Not delivery slices; they do not affect
coverage or closure rollups. Each line names what it establishes for this brief.

- [Connect and Orient steel
  thread](../../rfc/0001-notes/connect-and-orient-steel-thread.md)
  — owns the definition of done (items 1-11) and the three Stage 2 gate
  criteria.
- [RFC-0001 post-acceptance follow-ons](../../rfc/0001-notes/post-acceptance-follow-ons.md)
  — item 7 is the sole authorization for the provisional trial Runtime and
  states its four conditions; item 8 records the gate result either way; items
  9-11 "require the gate to have passed".
- [Agent-Ready Repo counterpart contract](../../rfc/0001-notes/agent-ready-repo-counterpart-contract.md)
  — records unagreed needs Studio has of another repository, and confers no
  authority over it.
- [ARS-THREAD-001 — Connect and Orient](../intents/connect-and-orient.md)
  — the ratified outcome, the G0 decision, the de-risk verdict and its
  Implications fallback, the kill-condition gloss the seam rule rests on, the
  seven inherited unresolved questions, and the decomposition record this brief
  projects.
- [Inspection-boundary probe](../research/connect-and-orient-inspection-boundary-probe.md)
  — the executed evidence behind the de-risk verdict, and the source of the
  residual risks named above. Historical evidence; not rewritten to match
  implementation.
- [RFC-0001](../../rfc/0001-studio-authority-planes-and-workspace-runtime-boundary.md)
  — proposes the authority planes and the Runtime boundary; its D1 is the gate
  this thread's delivery informs.
- [RFC-0002](../../rfc/0002-clarify-studio-charter-for-connected-sources-and-governed-execution.md)
  — Accepted; establishes that optional connected sources and governed
  execution are durable charter scope.
- [ADR-0005](../../adr/0005-five-plane-authority-model.md) — the five-plane
  vocabulary; assigns source materialization to the Execution plane. Inspector
  invocation is placed there by the steel-thread note's Flow and
  Responsibilities, not by this ADR.
- [ADR-0006](../../adr/0006-monorepo-component-placement.md) — the lifecycle
  test for component placement, and why no third repository is created.
- [ADR-0007](../../adr/0007-runtime-contract-placement.md) — reserves
  `packages/runtime-protocol` and `contracts/jsonschema/runtime` for a real
  contract, which is why the trial may use neither.

## Spec map

| Spec | Status |
| --- | --- |
| `connect-and-orient` — connect and see the verdict | Draft |

**Slice 1, confirmed 2026-09-14** — `docs/specs/connect-and-orient/spec.md`. A
lead connects one public GitHub repository and learns, at an exact commit,
whether it is Agent-Ready, and when it is not, why — honestly, with every trust
and security boundary this brief requires. It carries the provisional trial
Runtime and therefore produces most of the Stage 2 evidence.

**Slice 2, identified and deliberately not confirmed** — *read the work*:
canonical artifact viewing, the full work-state projection, capability
inventory, shaping-availability explanation, refresh and staleness, restart
persistence of the projection, and the artifact viewer's own state set. It is
not in the Spec map because it has no spec: a deferred cut changes neither
Ready status nor the map. It is shaped after slice 1 ships, when the Runtime's
real behaviour is observed rather than specified.

**Why the cut is vertical and not by layer.** Five review rounds on a
single-slice contract converged on 165 criteria with a rising rate of
repair-induced defects. One reviewer proposed cutting at the Runtime/surface
boundary; that is a layer cut, which `decompose-intent` and
`author-delivery-brief` both refuse, and slice 1 would have shipped no user
outcome. The cut taken instead is thinner but whole: slice 1 delivers a real
orientation answer end to end. The brief's outcome is delivered when both
slices ship, and definition-of-done items 7, 8 and 9 land with slice 2.

## Ready gaps

- The delivery slice cut is not selected. `author-delivery-brief continue` owns
  that decision, and it requires its own human confirmation.
- The trial Runtime time box is not agreed. A separate trial-authorization gate
  sets it, and the confirmed box is then recorded in the spec, the plan, and
  the trial evidence note.
- The seam waiver above is recorded, not approved.
- **No user guide is in this slice, and the reason is a scope limit rather than
  a repository rule.** `docs/CONVENTIONS.md` § *Phase-slice planning* says a
  phase shipping without its guide "is not a complete slice", and § 5c already
  establishes `guides/` as the canonical location — so writing one would
  instantiate an existing convention, not propose a new one. What prevents it is
  narrower and should be stated exactly: **no gate has granted this delivery
  authority to create `guides/`.** That is an ungranted authority, not a rule
  that forbids it — no cited source imposes such a limit, and the brief does
  not invent one. The scope owner
  decides: grant the authority and the guide becomes ordinary scope, or accept
  that the capability ships incompletely documented by the repository's own
  rule, with the authoring debt real and recorded here.
