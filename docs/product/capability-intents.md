# Capability intents

This is the index of Agent-Ready Studio's captured product direction. It names
the portfolio anchors, the initiative groups beneath them, and every detailed
capability intent, and it links each one to its canonical file under
[`intents/`](intents/).

The index is a map, not a second copy of the intents. Outcome, opportunity,
boundary, assumptions, unresolved questions, and projection live in the intent
file that owns them.

## How to read this file

- **Draft means captured but unshaped.** A Draft intent has been written down
  so it is not lost. It has not been shaped, validated, approved, funded, or
  scheduled, and nothing in it is a commitment.
- **Priority and sequence live in [the roadmap](roadmap.md).** The roadmap's
  wave ordering is a shaping recommendation.
- **Hard dependencies alone live in [`workspace.toml`](../../workspace.toml).**
  That file's `needs` field records true hard dependencies only; it never
  encodes soft priority or suggested order.
- **Implementation begins only after shaping and the applicable brief and
  specification gates.** Appearing in this index grants no delivery authority.
- **Every capability intent has been independently reviewed once, and none
  passed.** See
  [the shaping review record](shaping/intent-shaping-review-2026-09-11.md) for
  what each reviewer found, what was corrected, and what was deferred.

## Vision and strategy anchors

Two Draft parent intents sit above everything below them.

| ID | Title | Level | Intent file | Status |
| --- | --- | --- | --- | --- |
| ARS-VISION-001 | Agent-Ready Studio product vision | product-vision | [`agent-ready-studio-product-vision.md`](intents/agent-ready-studio-product-vision.md) | Draft |
| ARS-STRATEGY-001 | Make product work visible before automating it | product-strategy | [`make-product-work-visible-before-automating-it.md`](intents/make-product-work-visible-before-automating-it.md) | Draft |

ARS-STRATEGY-001's guiding policy sets the order everything else is sequenced
against: begin with a local artifact-first workspace, then make Agent-Ready
repository state visible, then let users shape work from that visible state, and
only then add governed headless execution and deeper automation.

## Portfolio anchors — ARS-CAP-001 through ARS-CAP-010

These ten are **umbrella intents**: stable portfolio anchors that name the
product's enduring themes. They are deliberately coarse. Every detailed
capability below maps to one or more of them, and the anchors themselves are
never renumbered or repurposed.

### Foundation

- **ARS-CAP-001 — Product Development workspace.** Give multidisciplinary
  teams an opinionated local workspace that begins with Strategy, Research,
  Experience, Architecture, Delivery, Release, and Outcomes.
- **ARS-CAP-002 — Reviewable product artifacts.** Turn inputs into typed,
  versioned artifacts whose evidence, lineage, and semantic status are clear
  without reading raw execution diagnostics.
- **ARS-CAP-003 — Attributable human decisions.** Require a durable human
  approval or revision request before a proposal becomes accepted work.
- **ARS-CAP-004 — Local managed state.** Preserve workspace, artifact, review,
  decision, and execution state across restart without Git, credentials, or a
  remote service.

### Assisted work

- **ARS-CAP-005 — Executor-independent transformations.** Describe semantic
  transformations independently from the deterministic, human, agent, or
  external executor that may perform them.
- **ARS-CAP-006 — Optional capability packs.** Add validated, declarative
  capabilities without making agent-ready tooling or third-party code a core
  requirement.
- **ARS-CAP-007 — Agent-ready execution.** Offer optional Agent-Ready and
  repository capability packs only after durable gates establish a safe,
  reviewable integration path.

### Future product depth

- **ARS-CAP-008 — Rich artifact work.** Improve artifact rendering, editing,
  semantic comparison, evidence provenance, and graph-based applicability.
- **ARS-CAP-009 — Team-scale collaboration.** Explore collaboration,
  sensitive-data controls, remote runners, integrations, and cloud sync only
  as a separately governed expansion.
- **ARS-CAP-010 — Outcome visibility.** Add visual canvases and portfolio or
  outcome projections after the artifact and decision foundations are proven.

## Initiative groups

Eight initiative groups organize the 64 detailed capability intents. Each group
corresponds to an initiative section in
[`workspace.toml`](../../workspace.toml).

| Initiative | Name | Captured capabilities | Default horizon |
| --- | --- | --- | --- |
| INI-001 | Studio Foundation and Workspace Kernel | 6 | Now |
| INI-002 | Artifact-First Work Experience | 8 | Now / Next |
| INI-003 | Multidisciplinary Product Development | 8 | Next |
| INI-004 | Repository Workspace Pane | 9 | Now |
| INI-005 | Studio Shaping Workbench | 8 | Next |
| INI-006 | Workspace Blueprints, Capability Packs, and AgentBundle Platform | 6 | Next / Later |
| INI-007 | Headless Execution and Delivery Runtime | 13 | Next, remote and deployment Later |
| INI-008 | Collaboration, Security, Integrations, and Outcomes | 6 | Later |

INI-004 is the recommended first new initiative wave. Its steel thread is
described in [the roadmap](roadmap.md#wave-1--repository-pane-of-glass).

## Detailed capability intents

Every row below is Draft. Each capability belongs to exactly one initiative.

### INI-001 — Studio Foundation and Workspace Kernel

Default horizon: Now. 6 captured capabilities.

| ID | Title | Intent file | Horizon | Status | Portfolio anchor |
| --- | --- | --- | --- | --- | --- |
| ARS-CORE-001 | Workspace and actor kernel | [`workspace-and-actor-kernel.md`](intents/workspace-and-actor-kernel.md) | Now | Draft | ARS-CAP-001, ARS-CAP-003, ARS-CAP-004 |
| ARS-CORE-002 | Product Development blueprint and progressive maturity | [`product-development-blueprint-and-progressive-maturity.md`](intents/product-development-blueprint-and-progressive-maturity.md) | Now | Draft | ARS-CAP-001, ARS-CAP-006 |
| ARS-CORE-003 | Typed artifacts, immutable revisions, and accepted state | [`typed-artifacts-immutable-revisions-and-accepted-state.md`](intents/typed-artifacts-immutable-revisions-and-accepted-state.md) | Now | Draft | ARS-CAP-002, ARS-CAP-003 |
| ARS-CORE-004 | Relations, lineage, evidence, and source authority | [`relations-lineage-evidence-and-source-authority.md`](intents/relations-lineage-evidence-and-source-authority.md) | Now | Draft | ARS-CAP-002, ARS-CAP-004 |
| ARS-CORE-005 | Reviews, comments, decisions, and advancement policies | [`reviews-comments-decisions-and-advancement-policies.md`](intents/reviews-comments-decisions-and-advancement-policies.md) | Now | Draft | ARS-CAP-003, ARS-CAP-002 |
| ARS-CORE-006 | Local Studio Service, persistence, protocol, and source adapters | [`local-studio-service-persistence-protocol-and-source-adapters.md`](intents/local-studio-service-persistence-protocol-and-source-adapters.md) | Now | Draft | ARS-CAP-004, ARS-CAP-005 |

### INI-002 — Artifact-First Work Experience

Default horizon: Now / Next. 8 captured capabilities.

| ID | Title | Intent file | Horizon | Status | Portfolio anchor |
| --- | --- | --- | --- | --- | --- |
| ARS-UX-001 | Review Inbox | [`review-inbox.md`](intents/review-inbox.md) | Now | Draft | ARS-CAP-002, ARS-CAP-003 |
| ARS-UX-002 | Work Item Studio | [`work-item-studio.md`](intents/work-item-studio.md) | Now | Draft | ARS-CAP-002, ARS-CAP-003 |
| ARS-UX-003 | Versioned input packets and normalized review packages | [`versioned-input-packets-and-normalized-review-packages.md`](intents/versioned-input-packets-and-normalized-review-packages.md) | Now | Draft | ARS-CAP-002, ARS-CAP-005 |
| ARS-UX-004 | Artifact renderer and editor registry | [`artifact-renderer-and-editor-registry.md`](intents/artifact-renderer-and-editor-registry.md) | Next | Draft | ARS-CAP-008, ARS-CAP-006 |
| ARS-UX-005 | Semantic diffs, annotations, patches, and revision requests | [`semantic-diffs-annotations-patches-and-revision-requests.md`](intents/semantic-diffs-annotations-patches-and-revision-requests.md) | Next | Draft | ARS-CAP-008, ARS-CAP-003 |
| ARS-UX-006 | Evidence, lineage, and decision-history navigation | [`evidence-lineage-and-decision-history-navigation.md`](intents/evidence-lineage-and-decision-history-navigation.md) | Next | Draft | ARS-CAP-002, ARS-CAP-008 |
| ARS-UX-007 | Observable long-running execution | [`observable-long-running-execution.md`](intents/observable-long-running-execution.md) | Now | Draft | ARS-CAP-002, ARS-CAP-007 |
| ARS-UX-008 | Alternative comparison, synthesis, and typed visual canvases | [`alternative-comparison-synthesis-and-typed-visual-canvases.md`](intents/alternative-comparison-synthesis-and-typed-visual-canvases.md) | Later, except simple artifact comparison which may arrive earlier | Draft | ARS-CAP-010, ARS-CAP-008 |

### INI-003 — Multidisciplinary Product Development

Default horizon: Next. 8 captured capabilities.

| ID | Title | Intent file | Horizon | Status | Portfolio anchor |
| --- | --- | --- | --- | --- | --- |
| ARS-PD-001 | Initiative, outcome, bet, assumption, and question graph | [`initiative-outcome-bet-assumption-and-question-graph.md`](intents/initiative-outcome-bet-assumption-and-question-graph.md) | Next | Draft | ARS-CAP-001, ARS-CAP-002 |
| ARS-PD-002 | Product strategy workspace | [`product-strategy-workspace.md`](intents/product-strategy-workspace.md) | Next | Draft | ARS-CAP-001, ARS-CAP-008 |
| ARS-PD-003 | Research workspace and evidence synthesis | [`research-workspace-and-evidence-synthesis.md`](intents/research-workspace-and-evidence-synthesis.md) | Next | Draft | ARS-CAP-002, ARS-CAP-008 |
| ARS-PD-004 | Experience design workspace | [`experience-design-workspace.md`](intents/experience-design-workspace.md) | Next | Draft | ARS-CAP-008, ARS-CAP-001 |
| ARS-PD-005 | Architecture workspace | [`architecture-workspace.md`](intents/architecture-workspace.md) | Next | Draft | ARS-CAP-008, ARS-CAP-002 |
| ARS-PD-006 | Delivery workspace | [`delivery-workspace.md`](intents/delivery-workspace.md) | Next | Draft | ARS-CAP-002, ARS-CAP-003 |
| ARS-PD-007 | Release, operations, outcomes, and learning workspace | [`release-operations-outcomes-and-learning-workspace.md`](intents/release-operations-outcomes-and-learning-workspace.md) | Next | Draft | ARS-CAP-010, ARS-CAP-002 |
| ARS-PD-008 | Graph-based workflows and discipline-specific review models | [`graph-based-workflows-and-discipline-specific-review-models.md`](intents/graph-based-workflows-and-discipline-specific-review-models.md) | Next | Draft | ARS-CAP-005, ARS-CAP-008 |

### INI-004 — Repository Workspace Pane

Default horizon: Now. 9 captured capabilities.

| ID | Title | Intent file | Horizon | Status | Portfolio anchor |
| --- | --- | --- | --- | --- | --- |
| ARS-REPO-001 | Read-only public GitHub repository connection | [`read-only-public-github-repository-connection.md`](intents/read-only-public-github-repository-connection.md) | Now | Draft | ARS-CAP-007, ARS-CAP-004 |
| ARS-REPO-002 | Repository identity, revision pinning, and trust boundary | [`repository-identity-revision-pinning-and-trust-boundary.md`](intents/repository-identity-revision-pinning-and-trust-boundary.md) | Now | Draft | ARS-CAP-004, ARS-CAP-007 |
| ARS-REPO-003 | Agent-Ready repository detection | [`agent-ready-repository-detection.md`](intents/agent-ready-repository-detection.md) | Now | Draft | ARS-CAP-007, ARS-CAP-006 |
| ARS-REPO-004 | Workspace status pane of glass | [`workspace-status-pane-of-glass.md`](intents/workspace-status-pane-of-glass.md) | Now | Draft | ARS-CAP-007, ARS-CAP-010 |
| ARS-REPO-005 | Queue detail, blocker explanation, reconciliation, and refresh | [`queue-detail-blocker-explanation-reconciliation-and-refresh.md`](intents/queue-detail-blocker-explanation-reconciliation-and-refresh.md) | Now | Draft | ARS-CAP-007, ARS-CAP-002 |
| ARS-REPO-006 | Pack, profile, adapter, and skill capability visibility | [`pack-profile-adapter-and-skill-capability-visibility.md`](intents/pack-profile-adapter-and-skill-capability-visibility.md) | Now | Draft | ARS-CAP-006, ARS-CAP-007 |
| ARS-REPO-007 | Multi-repository overview and cross-repository dependencies | [`multi-repository-overview-and-cross-repository-dependencies.md`](intents/multi-repository-overview-and-cross-repository-dependencies.md) | Later | Draft | ARS-CAP-009, ARS-CAP-010 |
| ARS-REPO-008 | Local folder and managed-clone connections | [`local-folder-and-managed-clone-connections.md`](intents/local-folder-and-managed-clone-connections.md) | Later | Draft | ARS-CAP-004, ARS-CAP-007 |
| ARS-REPO-009 | Installation, hidden-workspace mechanics, private repositories, and source authority | [`installation-hidden-workspace-mechanics-private-repositories-and-source-authority.md`](intents/installation-hidden-workspace-mechanics-private-repositories-and-source-authority.md) | Later | Draft | ARS-CAP-009, ARS-CAP-004 |

### INI-005 — Studio Shaping Workbench

Default horizon: Next. 8 captured capabilities.

| ID | Title | Intent file | Horizon | Status | Portfolio anchor |
| --- | --- | --- | --- | --- | --- |
| ARS-SHAPE-001 | Open shaping work from workspace status | [`open-shaping-work-from-workspace-status.md`](intents/open-shaping-work-from-workspace-status.md) | Next | Draft | ARS-CAP-007, ARS-CAP-002 |
| ARS-SHAPE-002 | Capture and edit intent drafts in Studio | [`capture-and-edit-intent-drafts-in-studio.md`](intents/capture-and-edit-intent-drafts-in-studio.md) | Next | Draft | ARS-CAP-002, ARS-CAP-003 |
| ARS-SHAPE-003 | Frame, de-risk, and decompose intent transformations | [`frame-de-risk-and-decompose-intent-transformations.md`](intents/frame-de-risk-and-decompose-intent-transformations.md) | Next | Draft | ARS-CAP-005, ARS-CAP-003 |
| ARS-SHAPE-004 | Strategy, research, and experience-design routing | [`strategy-research-and-experience-design-routing.md`](intents/strategy-research-and-experience-design-routing.md) | Next | Draft | ARS-CAP-005, ARS-CAP-006 |
| ARS-SHAPE-005 | Human-agent coauthoring, review, and ratification | [`human-agent-coauthoring-review-and-ratification.md`](intents/human-agent-coauthoring-review-and-ratification.md) | Next | Draft | ARS-CAP-003, ARS-CAP-005 |
| ARS-SHAPE-006 | Promote shaped work to brief, specification, and build | [`promote-shaped-work-to-brief-specification-and-build.md`](intents/promote-shaped-work-to-brief-specification-and-build.md) | Next | Draft | ARS-CAP-002, ARS-CAP-007 |
| ARS-SHAPE-007 | Studio self-hosting | [`studio-self-hosting.md`](intents/studio-self-hosting.md) | Next | Draft | ARS-CAP-007, ARS-CAP-001 |
| ARS-SHAPE-008 | Cross-repository shaping control | [`cross-repository-shaping-control.md`](intents/cross-repository-shaping-control.md) | Later | Draft | ARS-CAP-009, ARS-CAP-007 |

### INI-006 — Workspace Blueprints, Capability Packs, and AgentBundle Platform

Default horizon: Next / Later. 6 captured capabilities.

| ID | Title | Intent file | Horizon | Status | Portfolio anchor |
| --- | --- | --- | --- | --- | --- |
| ARS-EXT-001 | Versioned Workspace Blueprints | [`versioned-workspace-blueprints.md`](intents/versioned-workspace-blueprints.md) | Next | Draft | ARS-CAP-006, ARS-CAP-001 |
| ARS-EXT-002 | Optional Capability Packs | [`optional-capability-packs.md`](intents/optional-capability-packs.md) | Next | Draft | ARS-CAP-006, ARS-CAP-007 |
| ARS-EXT-003 | Declarative manifests and host-known renderers | [`declarative-manifests-and-host-known-renderers.md`](intents/declarative-manifests-and-host-known-renderers.md) | Next | Draft | ARS-CAP-006, ARS-CAP-008 |
| ARS-EXT-004 | Blueprint and pack compatibility, migrations, and extension trust | [`blueprint-and-pack-compatibility-migrations-and-extension-trust.md`](intents/blueprint-and-pack-compatibility-migrations-and-extension-trust.md) | Later | Draft | ARS-CAP-006, ARS-CAP-009 |
| ARS-EXT-005 | Agent-Ready Capability Pack and AgentBundle lifecycle | [`agent-ready-capability-pack-and-agentbundle-lifecycle.md`](intents/agent-ready-capability-pack-and-agentbundle-lifecycle.md) | Next | Draft | ARS-CAP-007, ARS-CAP-006 |
| ARS-EXT-006 | Machine-readable skill contracts and organization-owned templates | [`machine-readable-skill-contracts-and-organization-owned-templates.md`](intents/machine-readable-skill-contracts-and-organization-owned-templates.md) | Next | Draft | ARS-CAP-005, ARS-CAP-006 |

### INI-007 — Headless Execution and Delivery Runtime

Default horizon: Next, with remote and deployment capabilities Later. 13 captured capabilities.

| ID | Title | Intent file | Horizon | Status | Portfolio anchor |
| --- | --- | --- | --- | --- | --- |
| ARS-RUN-001 | Execution broker and normalized worker protocol | [`execution-broker-and-normalized-worker-protocol.md`](intents/execution-broker-and-normalized-worker-protocol.md) | Next | Draft | ARS-CAP-005, ARS-CAP-007 |
| ARS-RUN-002 | Claude and Codex headless executors | [`claude-and-codex-headless-executors.md`](intents/claude-and-codex-headless-executors.md) | Next | Draft | ARS-CAP-007, ARS-CAP-005 |
| ARS-RUN-003 | AgentBundle headless shaping and build adapter | [`agentbundle-headless-shaping-and-build-adapter.md`](intents/agentbundle-headless-shaping-and-build-adapter.md) | Next | Draft | ARS-CAP-007, ARS-CAP-006 |
| ARS-RUN-004 | Harden Agent-Ready Repo's headless contract for Studio control | [`harden-agent-ready-repo-headless-contract-for-studio-control.md`](intents/harden-agent-ready-repo-headless-contract-for-studio-control.md) | Next | Draft | ARS-CAP-007, ARS-CAP-005 |
| ARS-RUN-005 | Work-loop dispatch and isolated Git proposals | [`work-loop-dispatch-and-isolated-git-proposals.md`](intents/work-loop-dispatch-and-isolated-git-proposals.md) | Next | Draft | ARS-CAP-007, ARS-CAP-003 |
| ARS-RUN-006 | Durable human gates and session control | [`durable-human-gates-and-session-control.md`](intents/durable-human-gates-and-session-control.md) | Next | Draft | ARS-CAP-003, ARS-CAP-007 |
| ARS-RUN-007 | Liveness, normalized events, crash recovery, and process cleanup | [`liveness-normalized-events-crash-recovery-and-process-cleanup.md`](intents/liveness-normalized-events-crash-recovery-and-process-cleanup.md) | Next | Draft | ARS-CAP-004, ARS-CAP-007 |
| ARS-RUN-008 | Filesystem and Git reconciliation with artifact discovery | [`filesystem-and-git-reconciliation-with-artifact-discovery.md`](intents/filesystem-and-git-reconciliation-with-artifact-discovery.md) | Next | Draft | ARS-CAP-002, ARS-CAP-007 |
| ARS-RUN-009 | Operational permissions, sandboxing, and context-disclosure audit | [`operational-permissions-sandboxing-and-context-disclosure-audit.md`](intents/operational-permissions-sandboxing-and-context-disclosure-audit.md) | Next | Draft | ARS-CAP-003, ARS-CAP-009 |
| ARS-RUN-010 | Command-center, IDE, remote runner, CI, and deployment adapters | [`command-center-ide-remote-runner-ci-and-deployment-adapters.md`](intents/command-center-ide-remote-runner-ci-and-deployment-adapters.md) | Later | Draft | ARS-CAP-009, ARS-CAP-007 |
| ARS-RUN-011 | Multi-executor comparison and synthesis | [`multi-executor-comparison-and-synthesis.md`](intents/multi-executor-comparison-and-synthesis.md) | Later | Draft | ARS-CAP-008, ARS-CAP-005 |
| ARS-RUN-012 | Cross-repository execution coordination and receipts | [`cross-repository-execution-coordination-and-receipts.md`](intents/cross-repository-execution-coordination-and-receipts.md) | Later | Draft | ARS-CAP-009, ARS-CAP-007 |
| ARS-RUN-013 | Studio builds itself through the governed runtime | [`studio-builds-itself-through-the-governed-runtime.md`](intents/studio-builds-itself-through-the-governed-runtime.md) | Later | Draft | ARS-CAP-007, ARS-CAP-003 |

### INI-008 — Collaboration, Security, Integrations, and Outcomes

Default horizon: Later. 6 captured capabilities.

| ID | Title | Intent file | Horizon | Status | Portfolio anchor |
| --- | --- | --- | --- | --- | --- |
| ARS-SCALE-001 | Team actors, ownership, review routing, and notifications | [`team-actors-ownership-review-routing-and-notifications.md`](intents/team-actors-ownership-review-routing-and-notifications.md) | Later | Draft | ARS-CAP-009, ARS-CAP-003 |
| ARS-SCALE-002 | Artifact-level permissions and sensitive-data controls | [`artifact-level-permissions-and-sensitive-data-controls.md`](intents/artifact-level-permissions-and-sensitive-data-controls.md) | Later | Draft | ARS-CAP-009, ARS-CAP-002 |
| ARS-SCALE-003 | Model access, context disclosure, and audit | [`model-access-context-disclosure-and-audit.md`](intents/model-access-context-disclosure-and-audit.md) | Later | Draft | ARS-CAP-009, ARS-CAP-007 |
| ARS-SCALE-004 | Cloud synchronization, object storage, and durable binary assets | [`cloud-synchronization-object-storage-and-durable-binary-assets.md`](intents/cloud-synchronization-object-storage-and-durable-binary-assets.md) | Later | Draft | ARS-CAP-009, ARS-CAP-004 |
| ARS-SCALE-005 | External product-development integrations and portfolio views | [`external-product-development-integrations-and-portfolio-views.md`](intents/external-product-development-integrations-and-portfolio-views.md) | Later | Draft | ARS-CAP-010, ARS-CAP-009 |
| ARS-SCALE-006 | Production outcome feedback, retention, export, and governance | [`production-outcome-feedback-retention-export-and-governance.md`](intents/production-outcome-feedback-retention-export-and-governance.md) | Later | Draft | ARS-CAP-010, ARS-CAP-009 |

## Counts

- 2 parent intents: 1 product-vision, 1 product-strategy.
- 64 detailed capability intents, all Draft, all at capability level.
- 8 initiative groups.
- 10 preserved portfolio anchors, ARS-CAP-001 through ARS-CAP-010.

## Current delivery

The [Product Development walking skeleton](../specs/product-development-walking-skeleton/spec.md)
is shipped. It implements a local path from an Input Packet through
deterministic Product Intent generation, review, a human decision, and
restart-safe state. Shipped work is not reopened by this capture pass, and the
capability intents above do not treat it as a partial substitute for themselves.

Two delivery briefs remain in the repository backlog:
[Agent-Ready Studio](briefs/agent-ready-studio.md) and
[Observable execution](briefs/observable-execution.md). The observable-execution
brief holds the current problem statement for
[ARS-UX-007](intents/observable-long-running-execution.md).
