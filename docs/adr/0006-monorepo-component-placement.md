# ADR-0006: Component placement: Runnable units in the Studio monorepo

- **Status:** Accepted
- **Date:** 2026-09-12
- **Areas:** repo-layout, build
- **Reversibility:** high
- **Decision-makers:** Agent-Ready Studio maintainers
- **Supersedes:** none
- **Supersedes in part:** none
- **Superseded by:** none
- **Superseded in part:** none
- **Related:** RFC-0001, ADR-0001, ADR-0005, `docs/architecture/reference.md`

## Context

The repository is a pnpm TypeScript monorepo holding two applications
(`apps/desktop`, `apps/studio-service`), reusable libraries under `packages/`,
the versioned public protocol contract under `contracts/`, repository tooling
under `tools/`, and governance and product knowledge under `docs/`. A second
repository, `agent-ready-repo`, is maintained separately.

Those roots have been used consistently but never written down as a test, so
"where does this go?" has no answer a reviewer can point at. The question is
about to be asked for kinds of component this repository has not held before —
a headless runtime, a background worker — and RFC-0001 raised the further
question of whether such a component would live here at all.

Nothing about placement is urgent in itself. What is urgent is that an
unwritten convention answers differently depending on who is asked.

## Decision

> Future first-party Studio runnable components stay in the
> `agent-ready-studio` monorepo, and root directories are classified by
> component lifecycle.

| Root | Contains | Test |
| --- | --- | --- |
| `apps/` | Independently runnable or deployable components — desktop and web clients, services, runtimes, workers | Does it have its own process lifecycle? |
| `packages/` | Reusable implementation libraries consumed by applications or other packages | Is it imported, with no process of its own? |
| `contracts/` | Language-neutral, externally versioned schemas, compatibility fixtures, conformance material | Must a non-TypeScript consumer read it? |
| `tools/` | Repository-local development, verification, migration, release, and maintenance tooling | Does it ship to a user? If yes, it is not `tools/` |
| `docs/` | Charter, decisions, proposals, architecture, product state, specs, plans, guidance | — |
| `infra/` | Packaging, provisioning, deployment, cloud infrastructure | Deferred: created only once it has a maintained owner and lifecycle |

- **D1:** Future first-party Studio runnable components stay in the
  `agent-ready-studio` monorepo, and root directories are classified by
  component lifecycle as the table above sets out.
- **D2:** `agent-ready-repo` remains a separate repository and is not changed by
  this record.
- **D3:** No third repository is created for a Workspace Runtime at this stage.
- **D4:** If a durable Workspace Runtime is later established, its repository
  home is this monorepo, under `apps/`. That conditional placement does not
  accept RFC-0001's D1 process boundary. It answers only where such a component
  would live if RFC-0001's D1 is later recorded, and it costs nothing if that
  D1 is withdrawn, because then nothing is placed.
- **D5:** `apps/` stays flat. Grouping waits for real component count,
  ownership, or deployment pressure.
- **D6:** Repository separation is not a security boundary. Two repositories
  compiled into one process share one trust domain.
- **D7:** This ADR creates no directory. `infra/` is not created, and neither is
  any component.

## Decision drivers

- A placement question should have one written answer rather than a
  per-author one.
- The test should be about lifecycle, which is observable, rather than about
  subject matter, which is arguable.
- Extraction into another repository should be triggered by a named pressure,
  not by a sense that a component has grown.
- Structure should follow real pressure rather than anticipate it.

## Consequences

**Positive:**

- "App" means an independently operated component, not a frontend. A headless
  runtime and a background worker are both applications by the lifecycle test.
- New reusable libraries still belong in `packages/`; the decision changes
  nothing about where a library goes.
- Contract and consumer changes stay in one reviewable commit while components
  share a repository.
- A reviewer can reject a misplaced component against a written test rather
  than a preference.

**Negative:**

- The lifecycle test is a judgement, not a check. Nothing mechanical stops a
  library being added under `apps/`.
- A flat `apps/` will become harder to scan before it becomes obviously wrong,
  and the threshold at which grouping is warranted is deliberately not named.
- Keeping components together makes a later extraction a real migration rather
  than a move that was prepared for.
- `infra/` is named but absent, so the table describes a root a reader cannot
  find.

Extraction into another repository requires its own later decision. The
pressures that would justify it are: an independent consumer exists, ownership
diverges, release cadence diverges, licensing requires it, deployment topology
requires it, or a security review boundary requires it. None holds today.

A later architecture-aware scaffolder may learn to route among client, service,
runtime, worker, library, and contract stereotypes. That is separate future
work; the `monorepo-extras` pack is not installed in this repository and is not
changed by this record.

**Revisit if:** any one of the named extraction pressures becomes real for a
component, or `apps/` reaches a count, ownership spread, or deployment topology
where a flat listing stops being scannable.

## Confirmation

- **Mode:** reviewer-checked
- **Signal:** every new top-level directory and every new component placement
  cites the row of the table it satisfies.
- **Owner:** Agent-Ready Studio maintainers

## Alternatives considered

- **Create a separate runtime repository now.** Rejected against the
  named-pressure driver: no independent consumer, separate owner, or separate
  release cadence exists, and repository separation supplies no isolation,
  since isolation comes from process and filesystem boundaries instead.
- **Put service and runtime implementations under `packages/`.** Rejected
  against the lifecycle driver: a component with its own process lifecycle
  fails the `packages/` test, and placing it there hides that it is operated.
- **Introduce top-level `frontend/`, `backend/`, `services/`, or `workers/`.**
  Rejected against the lifecycle driver: these classify by subject matter or
  tier, which splits components sharing a lifecycle and joins components that
  do not.
- **Group `apps/clients`, `apps/services`, and `apps/runtimes` immediately.**
  Rejected against the real-pressure driver: two applications, and a third that
  does not exist, do not justify a hierarchy.
- **Put a Workspace Runtime in `agent-ready-repo`.** Rejected against the
  single-answer driver: RFC-0001 treats the split of concerns with that
  repository as a proposal still to be negotiated with maintainers who were not
  consulted, so it supplies no settled home. Independently of that negotiation,
  this decision places any future Studio-operated runnable component in this
  monorepo.

## References

- [RFC-0001](../rfc/0001-studio-authority-planes-and-workspace-runtime-boundary.md)
  D2 and D4, Accepted 2026-09-11 — §Repository boundaries, §Monorepo folder
  semantics, §Options considered (D2), §Tooling boundary.
