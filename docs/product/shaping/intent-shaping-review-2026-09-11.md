# Intent shaping review — 2026-09-11

Record of the independent shaping review of the 64 Draft capability intents
captured on 2026-09-11, and of which findings were applied.

- **Status:** round complete. Every intent remains **Draft**.
- **Mode:** `intent`, per the installed `shaping-reviewer` contract.
- **Reviewer:** one fresh, isolated Codex `gpt-5.6-sol` context per initiative,
  reviewing a self-contained evidence packet. The gate's preferred
  `shaping-reviewer` subagent was not used; a genuinely fresh independent
  context is the contract's named fallback.
- **Retrieval:** reviewers were forbidden from reading the repository. Each
  packet carried the rubric, the `intake-intent` field contract, the charter,
  both parent intents, the ten portfolio anchors, a roster of all 64
  capabilities, the initiative's index rows and workspace registration, and the
  full body of every intent under review.
- **Result:** `Findings` for all eight initiatives, in both rounds. No
  initiative returned `Clean`, so **no intent is eligible for `Accepted`**. A
  `Clean` result would not by itself change status; that needs explicit human
  confirmation.

## What was applied, and what was not

A separate Codex `gpt-5.6-terra` worker applied findings per initiative under
standing rules that outranked the findings themselves:

- `## Outcome` text was never rewritten. It is the captured wording, preserved
  verbatim. A finding against an outcome was recorded as an unresolved question
  and, where the problem was scope or contradiction, as a tightened boundary.
- No intent was split, created, deleted, renumbered, or repurposed. The owner
  decided on 2026-09-11 to record split findings rather than act on them.
- No preamble field changed. Every intent is still `Draft`.
- Capture-process narration was removed rather than added.

52 of the 66 intent files changed. Verified after the fact: zero `## Outcome`
sections and zero preamble blocks differ from the pre-review baseline.

## Deferred to a later shaping session

These finding classes are recorded in the intents but not acted on:

1. **Split an over-broad outcome.** The most common MAJOR finding, raised
   against roughly a third of the inventory and re-raised in round 2. Each
   affected intent now carries an unresolved question naming the separability.
2. **Move an outcome to its owning artifact.** ARS-RUN-004's outcome is work
   owned by Agent-Ready Repo's maintainers while this repository owns the
   artifact. Recorded in its boundary; it needs an upstream-owned artifact that
   those maintainers accept.
3. **Two charter conflicts.** ARS-CORE-005 and ARS-SHAPE-005 both let an
   approved policy advance work into accepted state, contradicting principle 2
   of [the charter](../../CHARTER.md). The conflict lives in the outcome text,
   so recording it in the boundary does not resolve it — round 2 correctly
   re-raised ARS-CORE-005 as a BLOCKER. Resolving it means changing one of the
   two, which is a shaping decision.

## Per-initiative results

| Initiative | Name | Intents | No findings, round 1 | No findings, round 2 | Round-1 session |
| --- | --- | --- | --- | --- | --- |
| INI-001 | Studio Foundation and Workspace Kernel | 6 | 0 | 2 | `01a08f6a` |
| INI-002 | Artifact-First Work Experience | 8 | 4 | 2 | `01a08f6e` |
| INI-003 | Multidisciplinary Product Development | 8 | 1 | — | `01a08f70` |
| INI-004 | Repository Workspace Pane | 9 | 5 | — | `01a08f74` |
| INI-005 | Studio Shaping Workbench | 8 | 0 | — | `01a08f78` |
| INI-006 | Workspace Blueprints, Capability Packs, and AgentBundle Platform | 6 | 1 | — | `01a08f7e` |
| INI-007 | Headless Execution and Delivery Runtime | 13 | 2 | — | `01a08f80` |
| INI-008 | Collaboration, Security, Integrations, and Outcomes | 6 | 0 | — | `01a08f84` |

Round 1 reviewed all 64 capability intents; 13 returned no findings.

INI-001 and INI-002 were reviewed twice. Their first packet omitted the
portfolio-anchor definitions and the capability roster, which both reviewers
reported as grounding gaps, so both were re-reviewed against the corrected
revisions with the full packet (sessions `01a08f8b` and `01a08f8b`).
The second round is not strictly better news: INI-001 improved from 0 to 2
intents with no findings, while INI-002 went from 4 to 2 because the fuller
packet let the reviewer check cross-references the first pass could not.

## Reviewed revisions

Each result binds to the exact bytes reviewed. The digests below are of the
**current** files, after findings were applied — a material edit invalidates the
prior review, so every intent needs a fresh review before any `Accepted`
transition.

### INI-001 — Studio Foundation and Workspace Kernel

- ARS-CORE-006 — [`local-studio-service-persistence-protocol-and-source-adapters.md`](../intents/local-studio-service-persistence-protocol-and-source-adapters.md) — `sha256:ec6615d483374c5c`
- ARS-CORE-002 — [`product-development-blueprint-and-progressive-maturity.md`](../intents/product-development-blueprint-and-progressive-maturity.md) — `sha256:bbe8a67b53c62e4c`
- ARS-CORE-004 — [`relations-lineage-evidence-and-source-authority.md`](../intents/relations-lineage-evidence-and-source-authority.md) — `sha256:9aa57de89f3062ad`
- ARS-CORE-005 — [`reviews-comments-decisions-and-advancement-policies.md`](../intents/reviews-comments-decisions-and-advancement-policies.md) — `sha256:33cbe93cfbe6c47b`
- ARS-CORE-003 — [`typed-artifacts-immutable-revisions-and-accepted-state.md`](../intents/typed-artifacts-immutable-revisions-and-accepted-state.md) — `sha256:fdfcceb1ce0a1274`
- ARS-CORE-001 — [`workspace-and-actor-kernel.md`](../intents/workspace-and-actor-kernel.md) — `sha256:251ccde99e812ef2`

### INI-002 — Artifact-First Work Experience

- ARS-UX-008 — [`alternative-comparison-synthesis-and-typed-visual-canvases.md`](../intents/alternative-comparison-synthesis-and-typed-visual-canvases.md) — `sha256:989b4cb892bc096d`
- ARS-UX-004 — [`artifact-renderer-and-editor-registry.md`](../intents/artifact-renderer-and-editor-registry.md) — `sha256:c2b5943bc760e994`
- ARS-UX-006 — [`evidence-lineage-and-decision-history-navigation.md`](../intents/evidence-lineage-and-decision-history-navigation.md) — `sha256:84ea668b1e764714`
- ARS-UX-007 — [`observable-long-running-execution.md`](../intents/observable-long-running-execution.md) — `sha256:d189ccf409c2b294`
- ARS-UX-001 — [`review-inbox.md`](../intents/review-inbox.md) — `sha256:ef4068532ae31398`
- ARS-UX-005 — [`semantic-diffs-annotations-patches-and-revision-requests.md`](../intents/semantic-diffs-annotations-patches-and-revision-requests.md) — `sha256:ebbd56e0236a4fb3`
- ARS-UX-003 — [`versioned-input-packets-and-normalized-review-packages.md`](../intents/versioned-input-packets-and-normalized-review-packages.md) — `sha256:ce606d531fe32cb7`
- ARS-UX-002 — [`work-item-studio.md`](../intents/work-item-studio.md) — `sha256:5369d69e43c09a77`

### INI-003 — Multidisciplinary Product Development

- ARS-PD-005 — [`architecture-workspace.md`](../intents/architecture-workspace.md) — `sha256:5a0abc7c2d42e71e`
- ARS-PD-006 — [`delivery-workspace.md`](../intents/delivery-workspace.md) — `sha256:47b8526c943565a5`
- ARS-PD-004 — [`experience-design-workspace.md`](../intents/experience-design-workspace.md) — `sha256:3f991b80487e2750`
- ARS-PD-008 — [`graph-based-workflows-and-discipline-specific-review-models.md`](../intents/graph-based-workflows-and-discipline-specific-review-models.md) — `sha256:7cd56d901d5d7451`
- ARS-PD-001 — [`initiative-outcome-bet-assumption-and-question-graph.md`](../intents/initiative-outcome-bet-assumption-and-question-graph.md) — `sha256:1de4e32d3abb766c`
- ARS-PD-002 — [`product-strategy-workspace.md`](../intents/product-strategy-workspace.md) — `sha256:cf945185174669a7`
- ARS-PD-007 — [`release-operations-outcomes-and-learning-workspace.md`](../intents/release-operations-outcomes-and-learning-workspace.md) — `sha256:f5028a9a8752e976`
- ARS-PD-003 — [`research-workspace-and-evidence-synthesis.md`](../intents/research-workspace-and-evidence-synthesis.md) — `sha256:9e3a3815e661d47e`

### INI-004 — Repository Workspace Pane

- ARS-REPO-003 — [`agent-ready-repository-detection.md`](../intents/agent-ready-repository-detection.md) — `sha256:e1f62c1d4fdef801`
- ARS-REPO-009 — [`installation-hidden-workspace-mechanics-private-repositories-and-source-authority.md`](../intents/installation-hidden-workspace-mechanics-private-repositories-and-source-authority.md) — `sha256:d40c5072a473bf5b`
- ARS-REPO-008 — [`local-folder-and-managed-clone-connections.md`](../intents/local-folder-and-managed-clone-connections.md) — `sha256:96fddcfa9bb2e02d`
- ARS-REPO-007 — [`multi-repository-overview-and-cross-repository-dependencies.md`](../intents/multi-repository-overview-and-cross-repository-dependencies.md) — `sha256:e460131e7a9fb837`
- ARS-REPO-006 — [`pack-profile-adapter-and-skill-capability-visibility.md`](../intents/pack-profile-adapter-and-skill-capability-visibility.md) — `sha256:1d8ef4f39988536f`
- ARS-REPO-005 — [`queue-detail-blocker-explanation-reconciliation-and-refresh.md`](../intents/queue-detail-blocker-explanation-reconciliation-and-refresh.md) — `sha256:94cdab2fd221eee4`
- ARS-REPO-001 — [`read-only-public-github-repository-connection.md`](../intents/read-only-public-github-repository-connection.md) — `sha256:f2c5ff56449751a0`
- ARS-REPO-002 — [`repository-identity-revision-pinning-and-trust-boundary.md`](../intents/repository-identity-revision-pinning-and-trust-boundary.md) — `sha256:d741d7c9f2faf191`
- ARS-REPO-004 — [`workspace-status-pane-of-glass.md`](../intents/workspace-status-pane-of-glass.md) — `sha256:20af4f72af4fea17`

### INI-005 — Studio Shaping Workbench

- ARS-SHAPE-002 — [`capture-and-edit-intent-drafts-in-studio.md`](../intents/capture-and-edit-intent-drafts-in-studio.md) — `sha256:8c5216078a10d7aa`
- ARS-SHAPE-008 — [`cross-repository-shaping-control.md`](../intents/cross-repository-shaping-control.md) — `sha256:27017c57fac4972b`
- ARS-SHAPE-003 — [`frame-de-risk-and-decompose-intent-transformations.md`](../intents/frame-de-risk-and-decompose-intent-transformations.md) — `sha256:e2466ec77d947e37`
- ARS-SHAPE-005 — [`human-agent-coauthoring-review-and-ratification.md`](../intents/human-agent-coauthoring-review-and-ratification.md) — `sha256:14ff84b5c77153b7`
- ARS-SHAPE-001 — [`open-shaping-work-from-workspace-status.md`](../intents/open-shaping-work-from-workspace-status.md) — `sha256:ddac855483ed9171`
- ARS-SHAPE-006 — [`promote-shaped-work-to-brief-specification-and-build.md`](../intents/promote-shaped-work-to-brief-specification-and-build.md) — `sha256:4fb1baec73cff2e1`
- ARS-SHAPE-004 — [`strategy-research-and-experience-design-routing.md`](../intents/strategy-research-and-experience-design-routing.md) — `sha256:b63af9ede879c98e`
- ARS-SHAPE-007 — [`studio-self-hosting.md`](../intents/studio-self-hosting.md) — `sha256:bb2e84f971cb070c`

### INI-006 — Workspace Blueprints, Capability Packs, and AgentBundle Platform

- ARS-EXT-005 — [`agent-ready-capability-pack-and-agentbundle-lifecycle.md`](../intents/agent-ready-capability-pack-and-agentbundle-lifecycle.md) — `sha256:35de75097940abd2`
- ARS-EXT-004 — [`blueprint-and-pack-compatibility-migrations-and-extension-trust.md`](../intents/blueprint-and-pack-compatibility-migrations-and-extension-trust.md) — `sha256:afdce6a951c597af`
- ARS-EXT-003 — [`declarative-manifests-and-host-known-renderers.md`](../intents/declarative-manifests-and-host-known-renderers.md) — `sha256:5b15e54bd4ccc8db`
- ARS-EXT-006 — [`machine-readable-skill-contracts-and-organization-owned-templates.md`](../intents/machine-readable-skill-contracts-and-organization-owned-templates.md) — `sha256:0df1e059c0fcb2fe`
- ARS-EXT-002 — [`optional-capability-packs.md`](../intents/optional-capability-packs.md) — `sha256:3a99270704989af8`
- ARS-EXT-001 — [`versioned-workspace-blueprints.md`](../intents/versioned-workspace-blueprints.md) — `sha256:d50ee13538a95448`

### INI-007 — Headless Execution and Delivery Runtime

- ARS-RUN-003 — [`agentbundle-headless-shaping-and-build-adapter.md`](../intents/agentbundle-headless-shaping-and-build-adapter.md) — `sha256:32d252736943088a`
- ARS-RUN-002 — [`claude-and-codex-headless-executors.md`](../intents/claude-and-codex-headless-executors.md) — `sha256:d3911b6d9b19dc47`
- ARS-RUN-010 — [`command-center-ide-remote-runner-ci-and-deployment-adapters.md`](../intents/command-center-ide-remote-runner-ci-and-deployment-adapters.md) — `sha256:d5e009b0ae2ca91f`
- ARS-RUN-012 — [`cross-repository-execution-coordination-and-receipts.md`](../intents/cross-repository-execution-coordination-and-receipts.md) — `sha256:f3c3bb4e774a673c`
- ARS-RUN-006 — [`durable-human-gates-and-session-control.md`](../intents/durable-human-gates-and-session-control.md) — `sha256:f051d0b2f3d6c4b5`
- ARS-RUN-001 — [`execution-broker-and-normalized-worker-protocol.md`](../intents/execution-broker-and-normalized-worker-protocol.md) — `sha256:fe67cbd381e640cc`
- ARS-RUN-008 — [`filesystem-and-git-reconciliation-with-artifact-discovery.md`](../intents/filesystem-and-git-reconciliation-with-artifact-discovery.md) — `sha256:ab0f731174d49c81`
- ARS-RUN-004 — [`harden-agent-ready-repo-headless-contract-for-studio-control.md`](../intents/harden-agent-ready-repo-headless-contract-for-studio-control.md) — `sha256:b37f8ce74df0b016`
- ARS-RUN-007 — [`liveness-normalized-events-crash-recovery-and-process-cleanup.md`](../intents/liveness-normalized-events-crash-recovery-and-process-cleanup.md) — `sha256:c56c4e14c446797f`
- ARS-RUN-011 — [`multi-executor-comparison-and-synthesis.md`](../intents/multi-executor-comparison-and-synthesis.md) — `sha256:57471a38e3427e18`
- ARS-RUN-009 — [`operational-permissions-sandboxing-and-context-disclosure-audit.md`](../intents/operational-permissions-sandboxing-and-context-disclosure-audit.md) — `sha256:87bf7e17fefe1e7b`
- ARS-RUN-013 — [`studio-builds-itself-through-the-governed-runtime.md`](../intents/studio-builds-itself-through-the-governed-runtime.md) — `sha256:f92e2526b1a60230`
- ARS-RUN-005 — [`work-loop-dispatch-and-isolated-git-proposals.md`](../intents/work-loop-dispatch-and-isolated-git-proposals.md) — `sha256:b7f953ff6cf97ee6`

### INI-008 — Collaboration, Security, Integrations, and Outcomes

- ARS-SCALE-002 — [`artifact-level-permissions-and-sensitive-data-controls.md`](../intents/artifact-level-permissions-and-sensitive-data-controls.md) — `sha256:dbc9a7d2a56c3aef`
- ARS-SCALE-004 — [`cloud-synchronization-object-storage-and-durable-binary-assets.md`](../intents/cloud-synchronization-object-storage-and-durable-binary-assets.md) — `sha256:530e06280b213246`
- ARS-SCALE-005 — [`external-product-development-integrations-and-portfolio-views.md`](../intents/external-product-development-integrations-and-portfolio-views.md) — `sha256:b9d6618106edc64f`
- ARS-SCALE-003 — [`model-access-context-disclosure-and-audit.md`](../intents/model-access-context-disclosure-and-audit.md) — `sha256:b0fe77ef96db8e35`
- ARS-SCALE-006 — [`production-outcome-feedback-retention-export-and-governance.md`](../intents/production-outcome-feedback-retention-export-and-governance.md) — `sha256:04f77e7ebaa0af30`
- ARS-SCALE-001 — [`team-actors-ownership-review-routing-and-notifications.md`](../intents/team-actors-ownership-review-routing-and-notifications.md) — `sha256:2d39aa6ac217f672`

## Round 3 — grounding gaps closed

Rounds 1 and 2 reported missing current-state evidence as a grounding gap on four
intents. Those artifacts are repository files that were simply absent from the
packet, so four single-intent re-reviews ran with them supplied: the reference
architecture, the architecture overview, the shipped walking-skeleton
specification, amendment 0004, the observable-execution brief, the ADR index,
repository conventions, and installed skill frontmatter.

`intent` mode reviews one artifact, so these single-intent packets are closer to
the contract than round 1's per-initiative batching. Each reviewer adjudicated
every current-state claim as SUPPORTED, CONTRADICTED, or SILENT against the
supplied evidence.

| Intent | Session | Outcome of closing the gap |
| --- | --- | --- |
| ARS-CORE-001 | `01a08f99` | Evidence **supported** nearly every capability the outcome claims as already shipped: workspace creation with no external dependency (AC-02) and attributable human actor records stamped on decisions and human revisions (AC-46). It was **silent** on exactly one thing — attributable *system*-actor records. The residual scope is now that one gap, and the intent records that it may have none. |
| ARS-UX-007 | `01a08f99` | Every current-state claim **supported**, with the atomic transaction, the absent intermediate state, the lost trace on mid-flight death, and amendment 0004's reasoning all corroborated. Grounding gaps: none consequential. Findings fell from three to one. |
| ARS-PD-005 | `01a08f99` | The drift claim the artifact need rested on was **silent** — no evidence of it. It moved to `## Assumptions`. Core-only viability was unestablished and is now stated: locally created architecture artifacts are the core; repository projection is optional. |
| ARS-EXT-006 | `01a08f99` | The claimed impossibility was **silent**, and contradicted in spirit: installed skills already declare `allowed-tools`, `metadata`, and `boundaries` in frontmatter. The opportunity now names what those declarations *lack*. A term inconsistency between "organization-owned templates" and "organization-owned packs" was also found and recorded. |

Closing the gap did not uniformly improve these intents, which is the point of
doing it. ARS-UX-007 was substantially vindicated. ARS-CORE-001 was undermined:
the evidence shows most of its outcome already ships, so its artifact need now
rests on a single unverified gap.

Reviewed revisions after this round:

- ARS-CORE-001 — `sha256:f5fc23030f597a76`
- ARS-UX-007 — `sha256:a410a1cf00afea75`
- ARS-PD-005 — `sha256:625c1dcb3e96ae8b`
- ARS-EXT-006 — `sha256:375686592677f506`

## Grounding gaps the reviewers reported

Evidence the reviewers needed and did not have. These bound what the results
establish:

- ~~No current-state or architecture evidence for claims about what the shipped
  walking skeleton already provides.~~ **Closed in round 3** for ARS-CORE-001,
  ARS-PD-005, ARS-UX-007, and ARS-EXT-006.
- The authoritative AgentBundle layout, workspace-status contract,
  reconciliation contract, and coordination-receipt contract were not supplied,
  so assumptions about them could not be checked.
- The frame, de-risk, and decompose method contracts and the brief and
  specification lifecycle contracts were not supplied.
- The `observable-execution` delivery brief and amendment 0004 were not
  supplied, so ARS-UX-007's problem statement could not be corroborated.

The remaining gaps are cheap to close the same way: each is a repository
artifact that can be added to the next packet.

## Next step

These intents are captured and reviewed, not shaped. Shaping starts with a
`frame-intent` session per intent, which owns the deferred split decisions, the
ARS-RUN-004 ownership question, and the two charter conflicts. `Accepted`
requires a revision-bound `Clean` result followed by explicit human
confirmation.
