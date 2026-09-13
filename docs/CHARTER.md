# Agent-Ready Studio Charter

## Mission

Agent-Ready Studio helps multidisciplinary product teams turn uncertain inputs
into connected, reviewable product work and explicit decisions, from strategy
and research through experience, architecture, delivery, release, and learning.

## Scope

What this project does:

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

What this project **permanently** does not do. These hold at every horizon.
They are boundaries, not a status report.

1. It does not accept executor output as product truth without an attributable
   human decision, or an explicit recorded policy meeting principle 2's
   conditions.
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
[product documentation](product/), not here. A capability being unbuilt is not
a charter boundary.

The permanent "does not" list is at least as important as the "does" list.
It's how we — and AI agents working in the repo — know when a request is
permanently out of bounds. A request on neither list is usually a question of
current state and sequencing, which [product documentation](product/) owns.
Refine this section only when a durable boundary is genuinely missing.

## Principles

The values that resolve ties when reasonable people disagree. Five to
seven, no more.

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

## What's NOT in this charter

To keep this file from becoming everything-and-the-kitchen-sink:

- **Decision history** lives in [`adr/`](adr/). The charter is what we
  believe; ADRs are the choices we made because of those beliefs.
- **Current product state** lives in [`product/`](product/). The charter
  is direction; product/ is where we are.
- **Current architecture state** lives in [`architecture/`](architecture/).
- **Conventions for how we work** live in [`CONVENTIONS.md`](CONVENTIONS.md).
- **Governance** is intentionally not a project document yet. A maintainer or
  small group operating by consensus is sufficient until roles or formal
  decision processes need durable documentation.

## When to revise

Revise this charter through an RFC when the mission, scope, or foundational
principles change. Product state and delivery horizons belong in
[product documentation](product/), and implementation choices belong in
[ADRs](adr/).
