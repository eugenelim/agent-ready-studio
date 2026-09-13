# RFC-0002: Clarify the Agent-Ready Studio charter for connected sources and governed execution

- **Status:** Accepted
- **Author:** eugenelim
- **Approver:** eugenelim
- **Date opened:** 2026-09-13
- **Date closed:** 2026-09-13
- **Decision weight:** heavy
- **Related:** [RFC-0001](0001-studio-authority-planes-and-workspace-runtime-boundary.md),
  [ADR-0005](../adr/0005-five-plane-authority-model.md),
  [ADR-0006](../adr/0006-monorepo-component-placement.md),
  [ADR-0007](../adr/0007-runtime-contract-placement.md),
  [charter](../CHARTER.md),
  [roadmap](../product/roadmap.md),
  [capability intents](../product/capability-intents.md)

> **Two reading conventions.** This RFC's decisions are numbered **C1–C7** — C
> for charter — because RFC-0001 has its own D1–D5 and the two would otherwise
> collide. Where RFC-0001's decisions appear they are always written
> "RFC-0001's D1". **Weight is `heavy`** because non-scope clause 5 would be the
> first place the untrusted-content trust rule becomes binding — RFC-0001 only
> proposed it — and `docs/CONVENTIONS.md` §3 reserves a security trust model for
> the strongest route. A security review was run against this document; its
> findings are resolved in the text below.

## Decision outcome

Accepted by the maintainer on 2026-09-13. All seven decisions were accepted as
recommended, including C5. This section records what was decided; the body
below is the argument that was accepted, and is unchanged.

| ID | Question | Outcome |
| --- | --- | --- |
| C1 | Should the mission keep "through connected local artifacts"? | **Accepted as recommended.** Replaced with the discipline sweep |
| C2 | Are connected sources durable scope? | **Accepted as recommended.** Optional connected sources generally, under explicit source, revision, trust, and write boundaries |
| C3 | Is governed local or cloud execution durable scope? | **Accepted as recommended.** Both, when governed. The charter-level refusal of remote runners is deliberately dropped |
| C4 | Does "does not do" list gaps or boundaries? | **Accepted as recommended.** Permanent boundaries only; the eight temporal items are disposed of item-by-item in §C4 |
| C5 | Should acceptance admit a recorded-policy path? | **Accepted as recommended**, with the loosening understood. The policy path enters principle 2 and permanent non-scope clause 1 together |
| C6 | Is progressive adoption durable scope? | **Accepted as recommended** |
| C7 | Is cross-repository coordination durable scope? | **Accepted as recommended**, as legitimacy only |

**C5 was accepted with its counter-case in view.** It is the one decision that
weakens a guarantee today's charter states, it was presented as severable, and
it was accepted anyway on the judgement that principle 2's conditions — a
durable decision or a named human acceptance authority with an audit trail, and
no policy established through the executor path whose output it accepts — make
the permissive reading safer than leaving it implicit in `reference.md`
invariant 4's ambiguity. `ARS-CORE-005`'s contrary Outcome sentence is now
false and that intent must be revisited; the counter-argument is retained in
full in §C5 rather than erased by acceptance.

**Nothing is created or changed by this acceptance.** The charter is untouched
until follow-on 1 applies the delta. No capability intent changes status, no
directory or package is created, and RFC-0001's staging is unaffected — its
Stage 2 gate, ADR-0007's standing, and the prohibition on `apps/workspace-runtime`
and the provisional trial runtime all stand exactly as they did.

## Terms used here

Enough to read this document without opening another one. Each is a term the
surrounding repository owns; these glosses are orientation, not definitions.

| Term | What it means here |
| --- | --- |
| **Artifact / revision / decision** | The product's core model: work is a typed artifact, edits create immutable revisions, and a revision becomes *accepted* only through a recorded decision. |
| **Executor** | Anything that produces a proposed revision — a human, a deterministic function, an AI agent, or an external system. Today only a deterministic in-process one exists. |
| **Connected source** | A repository, folder, or external artifact system that Studio reads work from. None is implemented. |
| **Governed execution** | Running an executor against explicit inputs under explicit permissions, returning a proposal. Not implemented. |
| **Agent-ready** | A repository or workflow prepared for agent execution — conventions, declared capabilities, machine-readable contracts. The product's optional end state, never its prerequisite. |
| **AgentBundle** | The external tooling convention an "agent-ready" repository follows. Studio must work without it. |
| **Capability pack / blueprint** | Optional declarative extensions. A *blueprint* defines a workspace's types and workflow; a *pack* adds capability to it. Neither may inject code into a privileged process. |
| **Walking skeleton** | The shipped first delivery slice: create a workspace, frame an input, run a transformation, review the proposal, record a decision, survive restart — with no Git, credentials, repository, or network. |
| **Connect and Orient** | The next planned delivery initiative, not yet shaped: read a public repository URL and show its status inside Studio. Used here as this RFC's decision deadline, and as the delivery that gates RFC-0001's process-boundary question. |
| **Workspace Runtime** | A proposed separate process that would host execution. It does not exist. RFC-0001 accepted it provisionally, with the process boundary gated on a later delivery — that gate is RFC-0001's question, not this RFC's. |
| **ARS-… / INI-…** | Identifiers for captured capability intents and the eight initiative groups that organize them. All 64 intents are `Draft`: written down, nothing more. |
| **MECE** | "Mutually exclusive, collectively exhaustive" — the test that an option set covers the space without overlapping. |

## Reviewer brief

Agent-Ready Studio's charter protects an artifact-first, local-first initial
product, and that protection is right. But its second non-scope bullet defers
eight capabilities "in the initial product," so those eight refuse nothing
durable, while the portfolio has since captured 19 intents across INI-007 and
INI-008 that do exactly them, inside a 64-intent capture. This RFC asks whether
optional connected sources, governed local and cloud execution, progressive
agent-ready adoption, and cross-repository coordination belong in durable
product scope — and which boundaries must become
permanent in exchange.

- **Decision:** what the charter's mission, scope, permanent non-scope, and
  principles should say, now that the portfolio points beyond the initial
  product.
- **Recommended outcome:** accept. **The decisions are severable** — C5 is the
  one that weakens a current guarantee, and rejecting it does not block C1–C4,
  C6, or C7.
- **Change if accepted:**
  - A follow-on change applies §Proposed charter delta to
    [`docs/CHARTER.md`](../CHARTER.md). Acceptance itself edits no file.
  - The temporal non-scope bullet is replaced by permanent boundaries; current
    state and timing move to product documentation. Two of its eight items do
    not survive that move unchanged — see §C4.
  - Principles go from six to seven. The permanent non-scope list goes from
    **one bullet to nine clauses**, because admitting connected sources and
    execution requires stating boundaries a purely local product never needed.
- **Affected surface:** acceptance changes `docs/CHARTER.md` and nothing else.
  Its *consequences* reach `reference.md` and one capability intent — see
  §Follow-on artifacts, which names them rather than performing them.
- **Stakes:** costly but reversible. A charter is cheap to edit and expensive
  to get wrong, because every later proposal is argued against it.
- **Review focus:** whether the seven baseline guarantees in §Riskiest
  assumption survive the widening; and, separately, §C5.
- **Not in scope:** architecture, component topology, the Workspace Runtime
  process boundary, delivery sequencing, and any change to a capability intent.

## The ask

**Recommendation.** Adopt a refined mission, scope, permanent non-scope, and
seven principles that preserve the current local-first, artifact-first
guarantees while recognizing optional connected sources and optional governed
local and cloud execution as legitimate durable product scope. Apply the exact
text in §Proposed charter delta through a follow-on change. **This RFC does not
edit the charter.**

**Why now.** RFC-0001's D5 was accepted with the charter question explicitly
deferred to a separate RFC — this one. The reason it cannot wait: the charter's
second non-scope bullet defers eight capabilities "in the initial product,"
which makes them un-refusable rather than forbidden, and 19 captured intents
across INI-007 and INI-008 now sit against that bullet. `workspace.toml` records
INI-004 — whose entire shaping backlog is source connection — as the only
`active` initiative. Without
this decision, the next connected-source or execution capability is shaped
against a charter that structurally forbids it, and the team either ignores the
charter or re-argues product legitimacy at every step.

| ID | Question | Recommendation | Why | Reviewer action |
| --- | --- | --- | --- | --- |
| C1 | Should the mission keep the qualifier "through connected local artifacts"? | No — replace it with the discipline sweep, naming the seven disciplines | The qualifier states a storage locality as if it were the purpose | Accept the sentence, or supply different wording at the same altitude |
| C2 | Are connected repositories and external artifact sources durable scope? | Yes — optional connected sources generally, under explicit source, revision, trust, and write boundaries | One boundary rule covers repository and non-repository sources alike | Accept, restrict to repositories only, or make the exclusion permanent |
| C3 | Is governed local or cloud execution durable scope? | Yes — both, when governed through explicit inputs, authority, permissions, gates, lineage, and proposals | Runtime location should not redefine the product model | Accept, or permanently exclude cloud |
| C4 | Should "does not do" list implementation gaps or permanent boundaries? | Permanent boundaries only, with the unmatched items disposed of explicitly | A long-lived charter should not need amendment whenever a planned capability ships | Accept, keep the mixture, or adopt RFC-0001's two-labelled-lists form |
| C5 | Should acceptance admit a recorded-policy path, or stay strictly human? | Admit it, with named-human-authority and anti-escalation conditions | The charter, the architecture, and one intent currently say three different things | Accept, or reject this decision alone |
| C6 | Is progressive adoption from manual to assisted to agent-ready durable scope? | Yes — it is what stops agent-readiness becoming mandatory | Without it, "optional" is a property of each capability rather than of the product | Accept, or drop the bullet as redundant with principle 4 |
| C7 | Is cross-repository product coordination durable scope? | Yes, as legitimacy only, each source keeping its own authority and lifecycle | Studio already spans two repositories; the charter should say whether that is the product | Accept, or defer to a later RFC |

**Decision owner:** Agent-Ready Studio maintainers. **Decide by:** all seven,
before Connect and Orient is promoted from shaping into a delivery brief or
specification. Outer backstop 2026-12-09, the roadmap's next scheduled review.

## Problem & goals

### What the charter actually says

The RFC's whole case rests on this, so it is quoted rather than characterized.
The charter's non-scope section has **two** bullets, and they behave
differently:

| Bullet | Text | Character |
| --- | --- | --- |
| 1 | "Does not accept executor output as product truth without an attributable human decision." | **Permanent.** Unqualified, and already doing its job. |
| 2 | "Does not include real provider dispatch, repository automation, arbitrary command execution, authentication, cloud sync, remote runners, collaboration, or a general plugin marketplace **in the initial product**." | **Temporal.** Eight items, all qualified. |

The defect is confined to bullet 2. Bullet 1 needs no repair — and §C5 proposes
to loosen it anyway, by admitting a second acceptance path alongside the human
decision. That is the RFC's one weakening, it is severable, and §C5 argues it.

### The defects

**1. Bullet 2's eight exclusions refuse nothing durable.** Qualified "in the
initial product," their only reading is "not yet." The charter says its "does
not" list is "how we — and AI agents working in the repo — know when a request
is out of bounds," so eight items that read as deferrals fail that stated job.
RFC-0001 §Diagnosis records this and leaves it for this RFC.

**2. Bullet 2 and the captured portfolio contradict each other.** The
[capability index](../product/capability-intents.md) holds 64 Draft intents
across eight initiatives; INI-007 alone captures 13 execution intents, and
INI-008 six covering collaboration, sensitive-data controls, cloud
synchronization, and external integrations. Under bullet 2 all nineteen are out of
bounds. That is not a portfolio error — the index is explicit that Draft means
"captured but unshaped … not shaped, validated, approved, funded, or scheduled,
and nothing in it is a commitment." The charter simply has no word for
deliberate, unscheduled, legitimate direction.

**3. What may accept a proposal is stated three times and not identically.**
Charter principle 2 permits acceptance "only through a durable, attributable
human decision." [`reference.md`](../architecture/reference.md) invariant 4
reads "Acceptance and workflow advancement are attributable to a decision or an
explicit recorded policy" — which can be read as allowing a policy to accept,
or only to advance. `ARS-CORE-005` reads it strictly: "An advancement policy
may move work between non-accepted states; it may never move work into accepted
state. Changing that would need a charter RFC, not a change here." §C5 settles
it.

### Goals

- Dispose of bullet 2's eight items individually — permanent boundary, product
  documentation, or a refusal deliberately dropped and named as such.
- Give optional connected sources and optional governed execution a legitimate
  home in durable scope, without implying implementation or schedule.
- State the trust boundaries a connected, executing product needs and a purely
  local one did not.
- Preserve every guarantee the current product actually delivers, in terms
  checkable against the shipped product.
- Settle what may accept a proposal, in one place.

### Non-goals

Plausible goals deliberately excluded, not merely undesirable outcomes.

- **Deciding architecture.** Component topology, the Workspace Runtime process
  boundary, and contract placement belong to RFC-0001 and ADR-0005 through
  ADR-0007. This RFC cites them and changes none.
- **Re-sequencing the roadmap.** Scope legitimacy and delivery order are
  different questions.
- **Promoting any capability intent.** All 64 remain Draft. Widening scope
  confers no shaping, funding, or delivery authority.
- **Designing trust mechanisms.** The charter states required *properties* —
  that authority is declared, bounded, revocable, and enforced rather than
  merely disclosed. Which mechanism delivers each property belongs to
  ARS-REPO-002, ARS-RUN-009, ARS-REPO-009, and their specifications.
- **Writing a governance model.** The charter's "governance is intentionally
  not a project document yet" stands.

## Proposal

### Proposed charter delta

The exact replacement a follow-on change applies to
[`docs/CHARTER.md`](../CHARTER.md). Sections not shown — "What's NOT in this
charter" and "When to revise" — are unchanged.

#### Mission

> Agent-Ready Studio helps multidisciplinary product teams turn uncertain
> inputs into connected, reviewable product work and explicit decisions, from
> strategy and research through experience, architecture, delivery, release,
> and learning.

It names no provider, protocol, runtime, repository host, or agent framework.
"Learning" is its plain-language name for the stage the workspace calls
**Outcomes**. Note that "connected" survives from today's mission but changes
what it modifies: today it qualifies *artifacts* (where they are stored), here
it qualifies *work* (that the pieces relate to each other).

#### Scope — what the project does

1. Provides an opinionated Product Development workspace spanning Strategy,
   Research, Experience, Architecture, Delivery, Release, and Outcomes.
2. Turns product work into versioned artifacts with evidence, lineage, review,
   and explicit decisions.
3. Works local-first: a workspace remains useful without any of the
   dependencies listed in permanent non-scope clause 9.
4. Optionally connects sources — repositories and external product-work
   artifacts — with explicit source authority, revision identity, trust level,
   and write boundaries.
5. Optionally uses governed local or cloud execution that receives explicit
   inputs and permissions and returns proposals for review. What an executor
   returns is never accepted by the act of returning it; acceptance is governed
   by principle 2.
6. Supports progressive adoption from manual work to assisted work to
   agent-ready execution, without replacing the workspace model at any step and
   without any step becoming a prerequisite for the one before it.
7. Coordinates product work across repositories while each source keeps its own
   authority and lifecycle.

#### Scope — what the project permanently does not do

These hold at every horizon. They are boundaries, not a status report.

1. It does not accept executor output as product truth without an attributable
   human decision, or an explicit recorded policy meeting principle 2's
   conditions. *(This clause and principle 2 state one rule; §C5 governs both.)*
2. It does not become primarily a terminal, a generic coding-agent command
   center, or a transcript supervision interface.
3. It does not become a generic no-code database, an arbitrary workspace
   builder, or a general or unrestricted plugin marketplace.
4. It does not offer arbitrary command execution as a product capability. Every
   execution Studio performs or coordinates runs through an explicitly declared
   capability with a stated boundary; consent obtained at the moment of
   execution is disclosure, not a declared boundary.
5. It does not let connected content acquire authority. Source content is data:
   it never alters Studio's tools, permissions, routing, lifecycle status, or
   verdicts, and it is never silently executed.
6. It does not treat any one authority as conferring another. Connecting a
   source, inspecting it, executing against it, and writing back to it are four
   separate authorities; holding one never confers another, holding one over one
   source never confers it over another, and no grant is unbounded or permanent.
7. It does not hide source authority, inspected revision, disclosed context,
   granted permissions, or write-back boundaries from the user, and it does not
   treat disclosure as a substitute for enforcement. A stated boundary is one
   that can refuse and be withdrawn.
8. It does not move product work, source content, or disclosed context outside
   the local workspace except under an explicit recorded grant.
9. It does not require AgentBundle, Git, a terminal, a repository, a capability
   pack, a model provider, credentials, or a remote service for basic Product
   Development workspace use — creating a workspace, authoring and revising
   artifacts, reviewing them, and recording decisions.

Current implementation state, delivery timing, and horizon belong in
[product documentation](../product/), not here. A capability being unbuilt is
not a charter boundary.

#### Principles

The values that resolve ties when reasonable people disagree. Five to seven, no
more.

1. **Decision clarity first.** Keep the artifact, its evidence, current state,
   and required judgment primary while execution diagnostics stay secondary.
2. **Authority is explicit.** A proposal becomes accepted only through a
   durable, attributable human decision, or an explicit recorded policy whose
   authority is a named human holding acceptance authority, with an audit
   trail. A policy may not be established through the same executor path whose
   output it would accept.
3. **Product authority is separate from execution authority.** An executor
   proposes; it cannot accept its own proposal, and it cannot define accepted
   product state.
4. **Local-first is the baseline.** Connected sources, capability packs, and
   execution runtimes are optional additions to a workspace that works without
   them.
5. **Lineage is part of the work.** Preserve revision content and provenance,
   and the exact source, revision, input, output, evidence, actor, and decision
   relationships, so a reviewer can reconstruct what happened — identifying
   secrets and personal data rather than reproducing them.
6. **Boundaries are narrow, validated, and least-privileged.** Renderer,
   process, persistence, blueprint, extension, source, capability, and runtime
   boundaries use purpose-specific runtime-validated contracts and receive only
   the authority they need, stated where a reviewer can read it.
7. **Platform internally, opinionated product externally.** Prefer one
   complete, deterministic vertical slice to disconnected stubs or speculative
   extensibility, and prove one maintained Product Development path before
   generalizing its abstractions.

#### How the principles map to today's

No principle is dropped. Where a principle changes its name or moves a term,
the row records it rather than leaving a reader to notice.

| # | Proposed | Adds | Drops or moves |
| --- | --- | --- | --- |
| 1 | Decision clarity first | — | — |
| 2 | Authority is explicit | Recorded-policy path; named human authority; audit trail; anti-escalation clause | The word "Human" leaves the principle's *name*, because the principle now covers two paths. "Durable" and "attributable" are both retained in the text |
| 3 | Product authority separate from execution authority (**new**) | States `reference.md` invariant 3 ("Executors propose state and cannot accept their own proposal") at charter altitude, **and adds** that an executor cannot define accepted product state — which invariant 3 does not say | — |
| 4 | Local-first is the baseline | Names connected sources and runtimes as optional additions | Renamed from "Local-first is a product promise". "Zero installed capability packs" moves into non-scope clause 9's enumeration, where it sits with the other dependencies |
| 5 | Lineage is part of the work | Source, revision, actor; the secrets-and-personal-data limit | Nothing — "content" and "provenance" are retained explicitly |
| 6 | Boundaries narrow, validated, least-privileged | Least-privilege; source, capability, and runtime boundaries; the stated-authority test | Nothing — renderer and blueprint boundaries and the runtime-validated-contract requirement are all retained |
| 7 | Platform internally, opinionated product externally | Clearer statement of what it protects | Renamed from "Build the maintained path before breadth". No term dropped — the vertical-slice requirement and the refusal of stubs and speculative extensibility are both retained |

Six become seven: one added, one unchanged (principle 1, verbatim), five
refined, none dropped.

### Does the permanent list refuse anything the portfolio captured?

§Problem & goals faults bullet 2 for conflicting with the portfolio. The
proposed list deserves the same test. Six intents sitting nearest the new
clauses — not the whole portfolio:

| Intent | Clauses tested | Result |
| --- | --- | --- |
| ARS-EXT-001 blueprints, ARS-EXT-002 capability packs | 3 | Survive. Versioned, declarative, host-validated extension is neither arbitrary nor unrestricted — though clause 3's "general … marketplace" would refuse an open third-party pack market, which is a boundary these intents do not currently reach for |
| ARS-RUN-010 command center / IDE / remote runner | 2, 4, 8 | **Constrained, deliberately.** Its outcome is that users "descend into an expert command center or IDE … without losing Studio run identity, lineage, reconciliation, and semantic review." Clause 2 permits that as a view, not as the product. Clause 4 requires the descent itself to be a declared capability with a stated boundary rather than an arbitrary shell. Clause 8 requires a recorded grant before its remote delegation moves context off the machine. The intent survives; a generic "run anything here" surface does not |
| ARS-RUN-005 work-loop dispatch and isolated Git proposals | 4 | **Constrained.** Survives only as a declared, permissioned capability with a stated boundary; clause 4 refuses a generic dispatch surface that would run whatever a specification names |
| ARS-SCALE-004 cloud synchronization | 8 | Survives as capability, constrained as design: synchronization needs an explicit recorded grant, which is a requirement the intent does not currently carry |
| ARS-REPO-003 Agent-Ready repository detection | 5 | Survives. Detection reads content as data to answer a question; it does not let content alter routing or verdicts |

**Of the six examined, none is refused outright and three are newly
constrained.** The remaining 58 intents were not tested; the claim is scoped to
these six. Clause 4 is the one that genuinely constrains future design rather
than merely labelling it, which is the point.

## Options considered

### C1 — the mission's qualifying clause

MECE axis: **what the mission's qualifier commits the product to.** Today's
mission already names multidisciplinary teams, uncertain inputs, and explicit
reviewable decisions; only the trailing qualifier is in question.

- **A — keep "through connected local artifacts" (do nothing).** *For:* zero
  churn; accurate about today's product. *Against:* it states a storage
  locality as the product's means, so connecting a source reads as leaving the
  mission rather than extending it.
- **B — replace it with "through connected repositories and agents."** *For:*
  honest about where the portfolio points; closest to RFC-0001's delta.
  *Against:* welds optional mechanisms into the purpose, so a topology change
  reopens the mission — and it contradicts the baseline the same charter
  promises.
- **C — replace it with the discipline sweep, and say what the work becomes.**
  *For:* durable across every mechanism. *Against:* a reader must go to scope to
  learn what Studio connects to.

**Recommendation: C.** `ARS-VISION-001`'s Boundary calls "useful without
agents, AgentBundle, Git, provider credentials, or a connected repository" the
vision's "load-bearing constraint, not a phase-one convenience." A mission
naming repositories inverts that emphasis; one naming local storage
understates it.

This departs from RFC-0001's §Proposed charter delta, which names "real sources
and governed execution" in the mission sentence. The departure is authorized:
[`post-acceptance-follow-ons.md`](0001-notes/post-acceptance-follow-ons.md)
item 2 states RFC-0001 "does not decide the charter's substance — accepting it
means only that the delta is a sound starting point."

### C2 — connected sources

MECE axis: **breadth of admitted source.**

- **A — keep today's temporal deferral (do nothing).** *For:* no work now.
  *Against:* preserves defect 1; INI-004's backlog stays structurally
  illegitimate.
- **B — make the exclusion permanent.** *For:* smallest surface, no trust
  questions. *Against:* that is a decision to abandon INI-004, not a scoping
  tidy-up.
- **C — permit connected repositories only.** *For:* fits the Wave 1 initiative
  exactly. *Against:* excludes the trackers, design systems, CI, analytics, and
  research sources ARS-SCALE-005 captures, forcing a second charter change later.
- **D — permit optional connected sources generally, under explicit source,
  revision, trust, and write boundaries.** *For:* one rule covers every source
  type. *Against:* a broader surface to keep disciplined.

**Recommendation: D.** The protecting rule is already source-type-neutral:
`ARS-REPO-002`'s Boundary states "Repository content is data. It never changes
Studio's tools, permissions, routing, lifecycle status, or verdicts" — which
non-scope clause 5 raises to charter altitude. Scoping the charter to
repositories alone would be narrower than the rule protecting it.

### C3 — governed execution

MECE axis: **admitted runtime topology.**

- **A — keep today's temporal deferral (do nothing).** *For:* no work now.
  *Against:* preserves defect 1 against 13 INI-007 intents.
- **B — make execution permanently external.** *For:* smallest trust surface.
  *Against:* Studio could never own the proposal-to-decision journey it exists
  to make reviewable, because the proposal would always be produced where
  Studio cannot see it.
- **C — local in scope, cloud permanently excluded.** *For:* keeps the surface
  local. *Against:* makes deployment location a product boundary, so an
  identical semantic request is legitimate or illegitimate depending on which
  process runs it.
- **D — optional local and cloud execution in scope when governed.** *For:*
  runtime location becomes a deployment decision, not a product one.
  *Against:* enlarges the permanent design burden — which is why clauses 4
  through 8 exist.

**Recommendation: D.** RFC-0001 §Local and cloud runtime parity treats local and
cloud runtimes as "deployments of one semantic contract, not two products," and
its §Goals include making cloud "a deployment decision and not a redesign."
Permanently excluding cloud would contradict an accepted RFC without new
evidence. Clause 8 is the price: admitting cloud execution obliges the charter
to say data leaves the machine only under an explicit recorded grant.

**In scope does not mean:** implemented, scheduled, automatically trusted, or
part of the Connect and Orient initiative.

### C4 — non-scope language

MECE axis: **what the "does not do" list is a list of.**

- **A — keep the current mixture (do nothing).** *For:* no work now. *Against:*
  bullet 2 refuses nothing, and the charter needs amendment whenever a planned
  capability ships.
- **B — permanent boundaries only; state and timing move to product
  documentation.** *For:* the charter stops needing delivery-driven
  maintenance, and the remaining list can refuse. *Against:* a reader asking "do
  we do X today?" must go to the roadmap.
- **C — two labelled lists in the charter: permanent, plus "deferred, not
  permanent."** RFC-0001's form. *For:* answers B's cost directly; nothing is
  silently dropped. *Against:* the deferred list is current state living in a
  document whose own rule sends current state to `product/`, reintroducing the
  maintenance burden B removes.

**Recommendation: B**, with C's discipline applied in this RFC instead of in the
charter: dispose of every item explicitly here, rather than carrying a second
list forward.

**Item-by-item.** "Roadmap §Not in scope" means the roadmap's explicit
current-product exclusion list. "Wave 6 Later intent" means the roadmap carries
it as deferred direction, which the roadmap states is "deferred, not in scope
today."

| Charter bullet 2 item | Where it lands |
| --- | --- |
| Real provider dispatch | Roadmap §Not in scope |
| Repository automation | Roadmap §Not in scope in part ("Git worktrees", "Write-back to any connected repository"); the remainder becomes permanent clauses 4 and 6 |
| Arbitrary command execution | Roadmap §Not in scope covers only "terminal emulation", which refuses the surface rather than the capability. Becomes permanent clause 4 |
| Authentication | Roadmap §Not in scope |
| Cloud sync | Roadmap §Not in scope |
| Remote runners | Roadmap Wave 6 Later intent (ARS-RUN-010), so still deferred there — but **the charter-level refusal is deliberately dropped**, because C3 admits governed remote execution. Clauses 4, 6, 7, and 8 bound it |
| Collaboration | Roadmap §Not in scope |
| General plugin marketplace | Roadmap §Not in scope ("Arbitrary executable plugins") and permanent clause 3, which retains "general" so the breadth is not quietly narrowed |

Four land in the roadmap's exclusion list outright (provider dispatch,
authentication, cloud sync, collaboration). Two land in both the roadmap and a
permanent clause (repository automation → clauses 4 and 6; plugin marketplace →
clause 3). One is only narrowly covered by the roadmap and becomes a new
permanent clause (arbitrary command execution). One — remote runners — loses its charter-level
refusal by C3's decision, while remaining deferred in the roadmap.

**One thing relocation does not buy.** Roadmap §Not in scope is itself scoped
to "the current product," so a relocated exclusion stays temporal. That is
correct — the roadmap *should* be temporal — but the gain is separation of
concerns, not added refusal strength. The added strength comes from clauses 4
through 8, which are new.

### C5 — the acceptance question

**The question.** Today's charter permits acceptance "only through a durable,
attributable human decision." The proposal admits a second path: an explicit
recorded policy, whose authority is a named human holding acceptance authority,
with an audit trail, and which may not be established through the same executor
path whose output it would accept.

**This is a genuine loosening, and the repository holds two opposed written
positions on it.**

- **For the policy path:** RFC-0001's accepted §Proposed charter delta lists
  among its proposed principles "explicit human **and policy** authority." That
  is a prior written position in favour, carried in an Accepted RFC — though
  RFC-0001 decided the charter's substance no further than proposing starting
  text, so it settles nothing by itself. Principle 2 here adds the guardrails
  that delta left unstated: a named human authority, an audit trail, and the
  anti-escalation clause.
- **Against it:** `ARS-CORE-005` reads it strictly — a policy "may never move
  work into accepted
  state." That intent is a Draft capture seed and binds nothing, but it is the
  only place the question was examined rather than asserted, and its own
  Boundary defers the decision here: "Changing that would need a charter RFC,
  not a change here."
- **Undecided:** `reference.md` invariant 4 reads both ways and settles
  nothing.
- `ARS-CORE-005` unresolved question 1 asks "What makes an advancement policy
  legitimate — who authors it, who approves it, and can it be revoked
  retroactively?" Principle 2 answers only *who holds* the authority. Who
  authors a policy, and whether one can be revoked retroactively, remain open —
  see open question 2. The charter does not settle them, and this RFC does not
  claim it does.

**Where the loosening appears — in two places.** Principle 2, and permanent
non-scope clause 1. They state one rule deliberately, and clause 1
cross-references principle 2 so they cannot drift. **Rejecting C5 means
striking the policy path from both**, restoring today's unqualified wording in
clause 1.

**Two coherent resolutions.** This RFC recommends the first:

1. **Admit the policy path, with guardrails the architecture does not state.**
   Recorded-policy acceptance is already a live reading of invariant 4, and
   principle 2's conditions make the permissive reading safer than leaving it
   implicit in an ambiguous invariant.
   *Consequence:* `ARS-CORE-005`'s Outcome sentence becomes false and the intent
   must be revisited — see §Follow-on artifacts item 3. Its Boundary needs no
   change: it already delegates the rule to charter principle 2.
2. **Keep acceptance strictly human.** Reject the policy path in both clauses. A
   follow-on then rewords invariant 4 to state only the strict reading, and
   `ARS-CORE-005` stands untouched.

Every other decision here widens what the product may legitimately do while
keeping its guarantees. This one weakens a guarantee that is already permanent.
It is the decision most worth scepticism, and rejecting it blocks nothing else.

### C6 — progressive adoption

The alternative is to drop scope bullet 6 as implied by principle 4. It is not
implied: principle 4 makes each *capability* optional, while bullet 6 makes the
*sequence* non-mandatory — a team may stop at manual or assisted work
indefinitely and still have the product. `ARS-CORE-002` captures exactly this:
its outcome is that one workspace "supports manual, assisted, and agent-ready
operating modes without forcing a team to migrate to a different workspace
model," and it assumes "one blueprint can express manual, assisted, and
agent-ready modes as capability presence rather than as separate workspace
types." Without the bullet, nothing refuses a future
design in which agent-ready adoption is the only supported path to a later
capability.

### C7 — cross-repository coordination

MECE axis: **whether the charter admits multi-source coordination as product.**

- **A — leave it unstated (do nothing).** *For:* the smallest claim. *Against:*
  Studio is already specified against two repositories, so the charter would be
  silent about an arrangement the product already has.
- **B — admit it as legitimate scope, each source keeping its own authority and
  lifecycle.** *For:* states the boundary that matters — coordination is not
  ownership. *Against:* a genuine surface, and RFC-0001 §Agent-Ready ownership
  boundary is explicit that the upstream division is "a request to be
  negotiated" by maintainers who were not consulted.
- **C — defer to a later RFC.** *For:* avoids deciding ahead of that
  negotiation. *Against:* the negotiation is about *who owns which contract*,
  not about whether Studio may coordinate at all.

**Recommendation: B**, legitimacy only. Clause 6 makes authority
non-transitive across sources, which covers the case where content or authority
from a low-trust source drives action against a higher-trust one. Open question
3 keeps the shaping prerequisite open: scope legitimacy and readiness to shape
are different things, and B settles only the first.

## Compatibility with RFC-0001 and ADR-0005 through ADR-0007

| Record | Relationship |
| --- | --- |
| [RFC-0001](0001-studio-authority-planes-and-workspace-runtime-boundary.md) | This RFC discharges **RFC-0001's D5**, which was accepted as "a separate charter RFC is *to be opened*" using RFC-0001's delta as starting text. It departs from that text in two recorded places: the mission's altitude (§C1) and the two-list non-scope form (§C4 option C). §C5 is not a departure — RFC-0001's delta already proposed "explicit human and policy authority," and principle 2 adds guardrails to it. RFC-0001's body is frozen and is not touched. |
| [ADR-0005](../adr/0005-five-plane-authority-model.md) | Principle 3 states the separation of product authority from execution authority at charter altitude. It says nothing about processes, so it does not pre-empt **RFC-0001's D1** — whether execution earns its own process — which remains gated on the Connect and Orient initiative having been delivered. |
| [ADR-0006](../adr/0006-monorepo-component-placement.md) | Untouched. The proposed charter names no directory, repository, or component. |
| [ADR-0007](../adr/0007-runtime-contract-placement.md) | Untouched. It remains Accepted, with the caveat recorded in its own body that it was accepted ahead of its evidence and lapses if RFC-0001's Stage 2 gate withdraws RFC-0001's D1. Charter scope admitting governed execution makes no runtime exist, so it supplies no evidence either way. |

The charter deliberately names no provider, protocol, runtime, repository host,
or agent framework, which is what keeps it from constraining these records or
being constrained by them.

## Effect on current and future work

Acceptance changes no behavior and creates no authority:

- It does **not** claim that repository connection, provider execution, remote
  runners, cloud sync, collaboration, or plugin infrastructure exists. None
  does. The repository holds two applications, seven packages, one versioned
  schema, and the shipped walking skeleton.
- It does **not** authorize creating `apps/workspace-runtime`.
- It does **not** settle RFC-0001's Stage 2 evidence gate, and does not
  authorize the provisional trial runtime, which only
  `post-acceptance-follow-ons.md` item 7 authorizes.
- It does **not** change ADR-0007's standing.
- It does **not** make any captured capability a committed roadmap item. All 64
  intents remain Draft.
- Current Product Development behavior remains valid and fully in scope: the
  walking-skeleton path is covered by scope bullets 1, 2, and 3, with principle
  2 governing its attributable decision.

What acceptance *does* change for future shaping: Connect and Orient, Shape and
Ratify, governed build execution, and local/cloud runtime parity can each be
shaped without reopening whether the product may do them. Each still needs its
own shaping, brief, specification, and gates — the charter grants legitimacy,
not authority. And any connected-source or execution capability must now show a
declared permissioned boundary, non-transitive and revocable authority,
enforcement rather than disclosure alone, and an explicit grant before data
leaves the local workspace.

## Risks & what would make this wrong

**Scope dilution.** The product becomes a thin collection of tools for every
discipline instead of one good one.
*Mitigation:* principle 7 and scope bullet 1's "opinionated" keep the
first-party path maintained. `reference.md` invariant 14 states the rule
checkably: "Extensible internals do not dilute the opinionated first-party
experience."

**Command-center drift.** Execution UI displaces artifact review.
*Mitigation:* principle 1 keeps diagnostics secondary; clause 2 refuses
becoming *primarily* a command center.
*Honest weakness:* "primarily" is a judgment, not a test — see §Riskiest
assumption.

**Cloud-first drift.** Remote execution erodes the local-first promise.
*Mitigation:* principle 4 makes local-first the baseline rather than a ban on
remote topology; clause 9 enumerates the basic operations that must never
require a remote service; clause 8 refuses moving data off the machine without
an explicit recorded grant. Clause 9's enumeration is what makes this a test
rather than a sentiment.

**Trust-boundary ambiguity.** Connecting a repository is read as permission to
execute it, or authority over one source leaks to another.
*Mitigation:* clause 6 separates four authorities and makes them
non-transitive across kinds *and* sources; clause 5 raises ARS-REPO-002's
content-as-data rule to charter altitude at full breadth.

**Roadmap overcommitment.** Charter scope is read as a delivery promise.
*Mitigation:* §Effect on current and future work states the negatives
explicitly, and the charter sends timing to product documentation.

**A permanent boundary is written that the product cannot honour.** Clause 4
constrains ARS-RUN-005 and ARS-RUN-010.
*Falsifiable as:* a governed-build or IDE-descent capability that cannot be
expressed as a declared capability with a stated boundary.
*Consequence if it fails:* another RFC — the correct outcome for a permanent
boundary that turns out to be wrong, and better than one that never refused
anything.

### Riskiest assumption

**Assumption:** expanding durable scope to connected sources and governed
execution will not dilute the artifact-first, local-first, non-agent-ready
product thesis.

**Test:** bounded repository analysis — can the proposed charter make all seven
baseline statements true simultaneously, each traced to a named artifact?

| # | Statement | Holds? | Evidence |
| --- | --- | --- | --- |
| 1 | A person can use the workspace with no repository, provider, runtime, or credentials | Yes | Scope bullet 3 and clause 9, whose enumeration of basic operations matches the shipped walking skeleton; `reference.md` Constraints and invariant 9 |
| 2 | Connected sources are optional | Yes | Scope bullet 4 ("Optionally connects"), principle 4, clause 9 |
| 3 | Executors only produce proposals | Yes | Principle 3, which states `reference.md` invariant 3 and adds the accepted-state clause; scope bullet 5 |
| 4 | Accepted product state remains governed by decisions | Yes, with the §C5 caveat | Principle 2 — under the recommended wording, "governed by a decision" becomes "governed by a decision or a named-human-authority policy with an audit trail" |
| 5 | Studio remains more than an agent command center | Yes, weakly | Clause 2 and principle 1 — but see below |
| 6 | Untrusted source content gains no authority by being connected | Yes, but newly | Clauses 5 and 6. **This is a *proposed* rule, not a recorded one.** RFC-0001 states it "proposes a new trust rule, and does not claim one already exists," and ARS-REPO-002 is a Draft capture seed whose own recommended next step is a security review of this boundary. Clause 5 is the first place the rule would bind |
| 7 | The first-party Product Development experience stays opinionated | Yes | Scope bullet 1, principle 7, `reference.md` invariant 14 |

**Result: the assumption survives, with one weak joint and two qualifiers —
statement 4's dependence on §C5, and statement 6 below.** No
proposed scope clause negates a proposed non-scope clause or principle — the
one pair that reads as a conflict, scope bullet 5's "proposals for review"
against clause 1's policy path, is reconciled in bullet 5's second sentence,
which routes acceptance to principle 2 rather than to the act of returning
output.

The weak joint is **statement 5**, resting on "primarily" — a judgment, not a
test. This is the weakness ADR-0005 records about itself: "Naming a boundary is
not enforcing it." Principle 1 partially mitigates it, because "diagnostics
stay secondary" *is* checkable in a design review. Open question 1 carries the
residue.

The caveat is **statement 6**: the charter would be *establishing* that trust
rule, not restating a settled one. That is why this RFC's weight is `heavy`.

**This is repository evidence, not empirical customer validation.** It shows
internal consistency with the repository's accepted records. It shows nothing
about whether users want any of it.

## Evidence & prior art

All in-repository; no external prior art was used or needed. Each entry is
cited by a claim in the body above.

- [`docs/CHARTER.md`](../CHARTER.md) — the mission, the six principles and their
  five-to-seven cap, and the two-bullet non-scope structure quoted in §Problem
  & goals.
- [RFC-0001](0001-studio-authority-planes-and-workspace-runtime-boundary.md) —
  §Decision outcome (RFC-0001's D5), §Diagnosis defect 1, §Proposed charter
  delta, §Local and
  cloud runtime parity, §Goals, §Agent-Ready ownership boundary, and "proposes a
  new trust rule, and does not claim one already exists."
- [`0001-notes/post-acceptance-follow-ons.md`](0001-notes/post-acceptance-follow-ons.md)
  — item 2 (this RFC's warrant) and item 7 (the sole authorization for a trial
  runtime).
- [`docs/architecture/reference.md`](../architecture/reference.md) — Constraints;
  invariants 3, 4, 9, and 14.
- [`docs/product/roadmap.md`](../product/roadmap.md) — §Not in scope, its
  "current product" scoping, and the Wave 6 Later-intent treatment of remote
  execution, all used in §C4's table.
- [`docs/product/capability-intents.md`](../product/capability-intents.md) — the
  64 Draft intents and the definition of Draft. Proof of **deliberate capture**
  only, never of demand or feasibility.
- [`ARS-VISION-001`](../product/intents/agent-ready-studio-product-vision.md) —
  the "load-bearing constraint" quote behind §C1.
- [`ARS-CORE-002`](../product/intents/product-development-blueprint-and-progressive-maturity.md)
  — manual, assisted, and agent-ready modes in one workspace model (§C6).
- [`ARS-REPO-002`](../product/intents/repository-identity-revision-pinning-and-trust-boundary.md)
  — the content-as-data rule clause 5 adopts, and its own pending security
  review.
- [`ARS-RUN-009`](../product/intents/operational-permissions-sandboxing-and-context-disclosure-audit.md)
  — "an audit alone must never be treated as satisfying this capability," which
  clause 7 adopts as a property.
- [`ARS-RUN-010`](../product/intents/command-center-ide-remote-runner-ci-and-deployment-adapters.md),
  [`ARS-RUN-005`](../product/intents/work-loop-dispatch-and-isolated-git-proposals.md),
  [`ARS-EXT-001`](../product/intents/versioned-workspace-blueprints.md),
  [`ARS-EXT-002`](../product/intents/optional-capability-packs.md),
  [`ARS-SCALE-004`](../product/intents/cloud-synchronization-object-storage-and-durable-binary-assets.md),
  [`ARS-REPO-003`](../product/intents/agent-ready-repository-detection.md) — the
  six intents tested against the proposed permanent list.
- [`ARS-CORE-005`](../product/intents/reviews-comments-decisions-and-advancement-policies.md)
  — the counter-case to §C5 and its open question on policy legitimacy.
- [`workspace.toml`](../../workspace.toml) — INI-004 as the only `active`
  initiative, with an unstarted shaping backlog (`active = []`).
- [`docs/specs/product-development-walking-skeleton/spec.md`](../specs/product-development-walking-skeleton/spec.md)
  — Status `Shipped`; the objective behind clause 9's enumeration.

## Open questions

1. **Does clause 2's refusal of "primarily a terminal or command center" need a
   checkable test, or does principle 1 suffice?** Recommended default:
   principle 1 suffices for now. Owner: Agent-Ready Studio maintainers. Decide
   by: the first shaping of an execution UI surface.
2. **Who may author an advancement policy, and can one be revoked
   retroactively?** Principle 2 names who holds authority but not these two, and
   `ARS-CORE-005` raises both. Recommended default: settle them in the
   specification that first defines a policy, not in the charter. Owner:
   Agent-Ready Studio maintainers. Decide by: before any advancement policy is
   specified.
3. **Must the `agent-ready-repo` counterpart negotiation have started before
   cross-repository work can be *shaped*?** §C7 settles scope legitimacy; this
   asks about readiness. Recommended default: yes — shaping waits for the
   negotiation. Owner: Agent-Ready Studio maintainers, jointly with
   `agent-ready-repo`. Decide by: when Connect and Orient reaches a
   cross-repository contract boundary.

## Review checklist

Tests a reviewer could not derive without reading the sources.

- [ ] §Problem & goals quotes the charter's two non-scope bullets accurately,
      and the defect is argued against bullet 2 only.
- [ ] §C4's table accounts for all eight of bullet 2's items, and you accept
      dropping the charter-level remote-runners refusal.
- [ ] Clause 4's refusal of arbitrary command execution is one the product can
      live with, given ARS-RUN-005 and ARS-RUN-010.
- [ ] The principle mapping's "Drops or moves" column is complete — nothing
      left the charter unrecorded.
- [ ] §C5 is a decision you intend; you have read `ARS-CORE-005`'s
      counter-position; and you know rejecting it means striking two clauses.
- [ ] You accept that statement 6 in §Riskiest assumption is a rule being
      *established* here rather than restated.
- [ ] Nothing here changes RFC-0001, an accepted ADR, the reference
      architecture, the roadmap, a capability intent, or any code.

## Follow-on artifacts

**Warranted by this acceptance:**

1. **Apply the §Proposed charter delta to
   [`docs/CHARTER.md`](../CHARTER.md).** A documentation change, not an
   implementation one.
2. **Disambiguate `reference.md` invariant 4** so the charter and the golden
   path state one acceptance rule. This happens whichever way §C5 goes; only
   the direction depends on it.

**Conditional on §C5 being accepted as recommended:**

3. **Revisit `ARS-CORE-005`'s Outcome**, whose requirement that policy "stops
   short of acceptance" would no longer hold. It is a Draft intent, so the
   revision runs through normal shaping and inherits
   `post-acceptance-follow-ons.md` item 5's unsettled question about what
   invalidates a recorded review. This RFC changes nothing in it.

**Already warranted by RFC-0001, listed only so this RFC is not read as
re-deciding them.** Their authority, ordering, and staging remain
`post-acceptance-follow-ons.md`'s, unchanged: the `reference.md` Stage 1 update
(item 3), keeping `overview.md` to implemented components (item 4), the
portfolio-mapping disposition (items 5 and 6, where that note recommends no
option and neither does this RFC), shaping and delivering Connect and Orient
with its authorized trial runtime (item 7), and the paired `agent-ready-repo`
artifact (item 9, which remains gated behind the Stage 2 gate having passed).
Items 8, 10, and 11 are untouched and unmentioned by this RFC.

**Not authorized by acceptance:** `apps/workspace-runtime`,
`packages/runtime-protocol`, `contracts/jsonschema/runtime`, an `infra/` root,
the provisional trial runtime, any capability-intent status change, and any
edit to the roadmap or workspace lifecycle state.

## Errata

Append-only corrections to this Accepted RFC. The body above is frozen; a later
entry supersedes an earlier one by being later.

**2026-09-13 — §Affected surface undercounted the affected intents, and
follow-on 3 extends to a second one.**

§Reviewer brief says acceptance's consequences reach "`reference.md` and one
capability intent," and §Follow-on artifacts item 3 names only `ARS-CORE-005`.
That is one short. Applying the delta surfaced a second Draft intent whose
Boundary asserts the rule C5 reversed:

[`ARS-SHAPE-005`](../product/intents/human-agent-coauthoring-review-and-ratification.md)
states that a policy "may route work, request review, or advance work between
non-accepted states; it may never accept an agent contribution," and cites the
charter as owning that rule. The charter now admits a recorded-policy
acceptance path, so that Boundary contradicts it.

Both intents are `Draft`, so neither is corrected here: the revisions run
through normal shaping, per follow-on 3 and
[`post-acceptance-follow-ons.md`](0001-notes/post-acceptance-follow-ons.md)
item 5's unsettled question about what invalidates a recorded review. **Read
follow-on 3 as covering `ARS-CORE-005` and `ARS-SHAPE-005` together.**

Nothing else in the decision changes. C5 stands as accepted, and the two
intents' contradiction with it was already a known consequence of accepting it
rather than a new one.
