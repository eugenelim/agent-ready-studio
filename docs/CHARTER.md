# Agent-Ready Studio Charter

## Mission

Agent-Ready Studio helps multidisciplinary product teams turn uncertain inputs
into explicit, reviewable decisions through connected local artifacts.

## Scope

What this project does:

- Provides an opinionated Product Development workspace, versioned artifacts,
  evidence and lineage, and decision-oriented review.
- Delivers local-first desktop workflows that remain useful without Git,
  AgentBundle, provider credentials, a terminal, a repository, or a remote
  service.

What this project does **not** do:

- Does not accept executor output as product truth without an attributable
  human decision.
- Does not include real provider dispatch, repository automation, arbitrary
  command execution, authentication, cloud sync, remote runners,
  collaboration, or a general plugin marketplace in the initial product.

The "does not" list is at least as important as the "does" list. It's how
we — and AI agents working in the repo — know when a request is out of
bounds. If you find the project being asked to do things that aren't on
either list, that's a signal to refine this section, not to drift.

## Principles

The values that resolve ties when reasonable people disagree. Five to
seven, no more.

1. **Decision clarity first.** Keep the artifact, its evidence, current state,
   and required judgment primary while execution diagnostics stay secondary.
2. **Human authority is explicit.** A proposal becomes accepted only through a
   durable, attributable human decision.
3. **Local-first is a product promise.** A Product Development workspace works
   with zero installed capability packs and no provider or repository setup.
4. **Lineage is part of the work.** Revisions preserve their content,
   provenance, and exact inputs so a reviewer can understand what changed.
5. **Boundaries are narrow and validated.** Renderer, process, persistence,
   blueprint, and extension boundaries use purpose-specific runtime-validated
   contracts.
6. **Build the maintained path before breadth.** Prefer one complete,
   deterministic vertical slice to disconnected stubs or speculative
   extensibility.

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
