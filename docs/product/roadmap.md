# Roadmap

Direction for Agent-Ready Studio's next horizons. It is not a commitment.

**Last updated:** 2026-09-11
**Reviewed:** quarterly. Next review: 2026-12-09.

This roadmap is organized by initiative group. The eight groups and the 64
capability intents beneath them are indexed in
[capability intents](capability-intents.md); each intent's own file under
[`intents/`](intents/) owns its outcome, assumptions, and open questions.

Every capability intent named here is **Draft** — captured but unshaped. The
wave ordering below is a shaping recommendation, not a set of hard workspace
dependencies. Hard dependencies alone live in
[`workspace.toml`](../../workspace.toml).

## Initiative groups

| Initiative | Name | Default horizon |
| --- | --- | --- |
| INI-001 | Studio Foundation and Workspace Kernel | Now |
| INI-002 | Artifact-First Work Experience | Now / Next |
| INI-003 | Multidisciplinary Product Development | Next |
| INI-004 | Repository Workspace Pane | Now |
| INI-005 | Studio Shaping Workbench | Next |
| INI-006 | Workspace Blueprints, Capability Packs, and AgentBundle Platform | Next / Later |
| INI-007 | Headless Execution and Delivery Runtime | Next, remote and deployment Later |
| INI-008 | Collaboration, Security, Integrations, and Outcomes | Later |

## Recommended shaping and delivery sequence

### Wave 0 — Shipped foundation

- **INI-001 Studio Foundation and Workspace Kernel.**
- The existing [Product Development walking skeleton](../specs/product-development-walking-skeleton/spec.md)
  is shipped and is not reopened.
- The [observable-execution](briefs/observable-execution.md) gap remains
  captured as [ARS-UX-007](intents/observable-long-running-execution.md). It is
  not silently treated as implemented.

### Wave 1 — Repository pane of glass

**Primary initiative:** INI-004 Repository Workspace Pane.

Candidate sequence:

1. [Read-only public GitHub URL connection](intents/read-only-public-github-repository-connection.md)
2. [Repository identity and revision pinning](intents/repository-identity-revision-pinning-and-trust-boundary.md)
3. [Agent-Ready repository detection](intents/agent-ready-repository-detection.md)
4. [Workspace-status projection](intents/workspace-status-pane-of-glass.md)
5. [Blocker and explanation views](intents/queue-detail-blocker-explanation-reconciliation-and-refresh.md)
6. [Installed pack and skill visibility](intents/pack-profile-adapter-and-skill-capability-visibility.md)

**Steel-thread outcome.** A user supplies a public GitHub URL and can
understand that repository's Agent-Ready workspace state inside Studio without
a persistent clone, credentials, or writes.

Local clone management, installers, private-repository authentication, and
write-back stay out of this steel thread. They are captured as
[ARS-REPO-008](intents/local-folder-and-managed-clone-connections.md) and
[ARS-REPO-009](intents/installation-hidden-workspace-mechanics-private-repositories-and-source-authority.md).

### Wave 2 — Shape from the pane

**Primary initiative:** INI-005 Studio Shaping Workbench.

Candidate sequence:

1. [Select a shaping entry from the repository pane](intents/open-shaping-work-from-workspace-status.md)
2. Open its canonical intent and source context in Studio
3. [Edit or capture a Draft intent manually](intents/capture-and-edit-intent-drafts-in-studio.md)
4. [Review and ratify the revision](intents/human-agent-coauthoring-review-and-ratification.md)
5. [Add governed frame, de-risk, and decompose execution](intents/frame-de-risk-and-decompose-intent-transformations.md)
6. [Promote accepted work into delivery coordination](intents/promote-shaped-work-to-brief-specification-and-build.md)

**Steel-thread outcome.** A user sees a shaping item in repository status,
opens it under a Studio shaping pane, creates or revises a reviewable intent,
and records the result without leaving the Studio artifact model.

### Wave 3 — Harden headless control

**Primary initiatives:** INI-006 and INI-007.

Candidate sequence:

1. [Inspect installed AgentBundle packs and supported skills](intents/pack-profile-adapter-and-skill-capability-visibility.md)
2. [Establish machine-readable skill and executor contracts](intents/machine-readable-skill-contracts-and-organization-owned-templates.md)
3. [Harden Agent-Ready Repo's shaping dispatch contract](intents/harden-agent-ready-repo-headless-contract-for-studio-control.md)
4. [Add one real headless provider](intents/claude-and-codex-headless-executors.md)
5. [Add durable gates, session resumption, and observable execution](intents/durable-human-gates-and-session-control.md)
6. [Dispatch shaping work from Studio into another repository](intents/cross-repository-shaping-control.md)

### Wave 4 — Governed build and self-hosting

**Primary initiative:** INI-007 Headless Execution and Delivery Runtime.

Candidate sequence:

1. [Work-loop dispatch](intents/work-loop-dispatch-and-isolated-git-proposals.md)
2. Worktree-backed proposal
3. [Artifact and Git reconciliation](intents/filesystem-and-git-reconciliation-with-artifact-discovery.md)
4. Acceptance and engineering review package
5. Revision round-trip
6. Merge decision
7. [Studio uses this path to build Studio itself](intents/studio-builds-itself-through-the-governed-runtime.md)

### Wave 5 — Multidisciplinary depth

**Primary initiatives:** INI-002 and INI-003.

- [Strategy renderer and review pilot](intents/product-strategy-workspace.md)
- [Research provenance and synthesis pilot](intents/research-workspace-and-evidence-synthesis.md)
- [Experience flow and prototype review pilot](intents/experience-design-workspace.md)
- [Architecture model and decision review pilot](intents/architecture-workspace.md)
- [Delivery](intents/delivery-workspace.md) and
  [release](intents/release-operations-outcomes-and-learning-workspace.md)
  artifact depth
- [Semantic diff and comparison](intents/semantic-diffs-annotations-patches-and-revision-requests.md)
- [Cross-discipline traceability](intents/initiative-outcome-bet-assumption-and-question-graph.md)

### Wave 6 — Extensibility and organizational scale

**Primary initiatives:** INI-006 and INI-008.

- [Custom blueprints](intents/versioned-workspace-blueprints.md) and
  [capability packs](intents/optional-capability-packs.md)
- [Safe extension workers](intents/blueprint-and-pack-compatibility-migrations-and-extension-trust.md)
- [Local clone and installer experience](intents/local-folder-and-managed-clone-connections.md)
- [Private repositories](intents/installation-hidden-workspace-mechanics-private-repositories-and-source-authority.md)
- [Team collaboration](intents/team-actors-ownership-review-routing-and-notifications.md)
- [Sensitive-data controls](intents/artifact-level-permissions-and-sensitive-data-controls.md)
- [Cloud](intents/cloud-synchronization-object-storage-and-durable-binary-assets.md)
  and [remote execution](intents/command-center-ide-remote-runner-ci-and-deployment-adapters.md)
- [External integrations](intents/external-product-development-integrations-and-portfolio-views.md)
- [Portfolio and outcome views](intents/production-outcome-feedback-retention-export-and-governance.md)

## Not in scope

Things that have come up and that we've explicitly decided are *not*
in scope for the current product. This is the most valuable section for AI
agents and new contributors — it prevents wasted exploration of dead ends.
Items captured as Later intents above are deferred, not in scope today.

- **Real provider dispatch, Git worktrees, and terminal emulation.** The
  shipped slice proves a deterministic, executor-independent path without
  turning the product into repository automation. INI-007 captures the intent
  to change this; nothing in it is approved.
- **Write-back to any connected repository.** The Wave 1 steel thread is
  read-only and uses only a public GitHub URL.
- **Arbitrary executable plugins.** Extensions stay declarative and validated;
  the product does not load third-party code into privileged processes.
- **Authentication, cloud sync, and multi-user collaboration.** These expand
  the local product's trust and operating model and need separate governance
  before any of INI-008 is shaped.

## How this file is maintained

- **Owners:** Agent-Ready Studio maintainers.
- **Updates:** roadmap items move between waves via small PRs. Substantive
  additions or deletions go through an RFC.
- **Review cadence:** quarterly. The review updates the "Last updated" date
  even if no items change — fresh eyes, fresh dates.
- **Drift signal:** if items in Wave 1 haven't moved in two consecutive
  reviews, either they're not actually being worked on (move them out)
  or the roadmap doesn't reflect what the team is doing (rewrite it to
  match).
