# Capability domain and delivery mapping

This note is an analytical overlay accompanying
[RFC-0001](../0001-studio-authority-planes-and-workspace-runtime-boundary.md),
**Accepted 2026-09-11**. It changes no intent, stable ID, canonical initiative
assignment, or review result. The canonical eight initiative groups, INI-001
through INI-008, remain authoritative. Delivery-initiative membership is not a
hard dependency and implies no priority.

**Accepting RFC-0001 did not make this overlay canonical.** Whether these
mappings become RFC notes, a maintained projection, generated metadata, or
canonical intent fields is still open — it is follow-on item 6 in
[`post-acceptance-follow-ons.md`](post-acceptance-follow-ons.md), and it depends
on first deciding how a reviewed intent can gain metadata without invalidating
its review. Until then this remains a reading of the portfolio, not a second
source of truth.

## How to read this

Codes here are `CD1`–`CD9` for capability domains and `B1`–`B6` for delivery
initiatives. They are deliberately not the `D1`–`D5` decision identifiers used
in the [RFC body](../0001-studio-authority-planes-and-workspace-runtime-boundary.md#the-ask);
those are the questions this RFC asks reviewers to decide, and they are
unrelated to these domains.

Each capability has one proposed primary domain:

- **CD1 Core and reliability:** local foundations, persistence, and dependable
  product operation.
- **CD2 Connected sources:** registration, identity, access, and projection of
  repositories and other sources.
- **CD3 Artifact and review experience:** artifact state, revision, evidence,
  comparison, review, and decision surfaces.
- **CD4 Guided shaping:** capture, transformation, ratification, and promotion
  of shaped work.
- **CD5 Workspace Runtime:** durable runs, executors, isolation, recovery, and
  reconciliation.
- **CD6 Agent-Ready interoperability:** AgentBundle, repository conventions,
  packs, manifests, and supported machine contracts.
- **CD7 Governed delivery and self-hosting:** governed movement from shaped work
  into proposals and self-hosted validation.
- **CD8 Multidisciplinary workspaces:** connected strategy, research,
  experience, architecture, delivery, and learning work.
- **CD9 Platform and organizational scale:** extension trust, collaboration,
  permissions, cloud operation, integrations, and organizational governance.

A capability may contribute to zero or more bounded delivery initiatives:

- **B1 Connect and Orient**
- **B2 Shape and Ratify**
- **B3 Build and Review**
- **B4 Local and Cloud Runtime Parity**
- **B5 Multidisciplinary Pilot**
- **B6 Workspace Platform Generalization**

The authority plane is the plane most relevant to the capability, not an
exclusive statement about every component it may touch:

- **Product plane:** workspaces, initiatives, artifacts, immutable revisions,
  evidence, reviews, decisions, accepted state, and multidisciplinary
  semantics.
- **Control plane:** source registrations, durable runs, scheduling, claims,
  leases, durable gates, policies, runtime selection, credential references,
  and cross-repository coordination.
- **Execution plane:** source materialization, temporary clones and worktrees,
  executor processes, MCP and tool hosting, environment policy, filesystem and
  Git reconciliation, checkpoints, and proposal production.
- **Capability plane:** Workspace Blueprints, Capability Packs,
  transformations, AgentBundle packs and skills, executor requirements, review
  semantics, and trusted capability bundles.
- **Source plane:** Studio-managed content, local folders, local Git checkouts,
  Git URLs, managed clones, archives, and external artifact systems.

`Primary repo` names one likely owning repository. `Counterpart` records
meaningful work or a contract needed in the other repository; it does not
create shared ownership. `Architecture subject` is additive and marks a
capability that is primarily an architecture primitive addressed by RFC-0001.

## Review-record provenance

No persisted shaping-review record exists in the repository. The record was
deliberately deleted by commit `f048142`; its last repository form is
recoverable from Git history at `f048142^`. The current intent bodies also
retain unresolved questions and boundaries produced by that review.

The recovered record reports `Findings` for each of the eight initiatives. It
does not provide a per-capability verdict list. The `Review finding` column
therefore records initiative-level findings except for ARS-CORE-001,
ARS-CORE-005, ARS-UX-007, ARS-PD-005, ARS-SHAPE-005, ARS-EXT-006, and
ARS-RUN-004, which the record discusses by name. Those results bind to the
reviewed revisions and do not make any intent Accepted.

## Mapping

### INI-001 — Studio Foundation and Workspace Kernel

| ID | Canonical initiative | Primary domain | Delivery initiatives | Primary repo | Counterpart | Authority plane | Architecture subject | Review finding | Candidate split / overlap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ARS-CORE-001 | INI-001 | CD1 Core | B1 Connect; B5 Pilot | agent-ready-studio | — | Product | Workspace and actor kernel | Named: shipped coverage supported; system-actor attribution silent; narrowing refuted | Shipped and residual scope coexist; no split applied |
| ARS-CORE-002 | INI-001 | CD8 Workspaces | B5 Pilot; B6 Platform | agent-ready-studio | — | Capability | Product Development Blueprint | INI-001 Findings; initiative-level | Blueprint maturity overlaps CD8 and CD6 |
| ARS-CORE-003 | INI-001 | CD3 Artifacts | B2 Shape; B3 Build | agent-ready-studio | — | Product | Immutable revision and accepted-state model | INI-001 Findings; initiative-level | — |
| ARS-CORE-004 | INI-001 | CD3 Artifacts | B1 Connect; B2 Shape | agent-ready-studio | — | Product | Lineage and source-authority model | INI-001 Findings; initiative-level | Lineage versus source authority split question |
| ARS-CORE-005 | INI-001 | CD3 Artifacts | B2 Shape; B3 Build | agent-ready-studio | — | Product | Review, decision, and advancement model | Named: charter conflict resolved in favour of human acceptance | Automated advancement short of acceptance may split |
| ARS-CORE-006 | INI-001 | CD1 Core | B1 Connect; B4 Parity | agent-ready-studio | — | Source | Studio service, protocol, persistence, and source-adapter boundary | INI-001 Findings; initiative-level | Service, protocol, persistence, and adapters may split |

### INI-002 — Artifact-First Work Experience

| ID | Canonical initiative | Primary domain | Delivery initiatives | Primary repo | Counterpart | Authority plane | Architecture subject | Review finding | Candidate split / overlap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ARS-UX-001 | INI-002 | CD3 Artifacts | B1 Connect; B3 Build | agent-ready-studio | — | Product | — | INI-002 Findings; initiative-level | Overlaps repository-sourced work orientation |
| ARS-UX-002 | INI-002 | CD3 Artifacts | B2 Shape; B3 Build | agent-ready-studio | — | Product | — | INI-002 Findings; initiative-level | — |
| ARS-UX-003 | INI-002 | CD3 Artifacts | B2 Shape; B3 Build | agent-ready-studio | — | Product | Normalized input and review envelopes | INI-002 Findings; initiative-level | Input packet versus review package split question |
| ARS-UX-004 | INI-002 | CD3 Artifacts | B3 Build; B5 Pilot | agent-ready-studio | — | Capability | Host-known renderer and editor boundary | INI-002 Findings; initiative-level | Renderer registry versus proposal semantics overlap |
| ARS-UX-005 | INI-002 | CD3 Artifacts | B2 Shape; B3 Build | agent-ready-studio | — | Product | Semantic change and patch model | INI-002 Findings; initiative-level | Presentation, annotations, patches, and requests may split |
| ARS-UX-006 | INI-002 | CD3 Artifacts | B1 Connect; B2 Shape; B3 Build | agent-ready-studio | — | Product | — | INI-002 Findings; initiative-level | Overlaps CD2 source authority and CD3 review history |
| ARS-UX-007 | INI-002 | CD5 Runtime | B3 Build; B4 Parity | agent-ready-studio | — | Control | Durable run observability | Named: current-state claims supported; one finding remained | Run-state visibility versus restart recovery split question |
| ARS-UX-008 | INI-002 | CD3 Artifacts | B5 Pilot | agent-ready-studio | — | Product | Typed canvas representation | INI-002 Findings; initiative-level | Comparison, synthesis, and canvases may split |

### INI-003 — Multidisciplinary Product Development

| ID | Canonical initiative | Primary domain | Delivery initiatives | Primary repo | Counterpart | Authority plane | Architecture subject | Review finding | Candidate split / overlap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ARS-PD-001 | INI-003 | CD8 Workspaces | B2 Shape; B5 Pilot | agent-ready-studio | — | Product | Initiative and work graph | INI-003 Findings; initiative-level | — |
| ARS-PD-002 | INI-003 | CD8 Workspaces | B2 Shape; B5 Pilot | agent-ready-studio | — | Product | — | INI-003 Findings; initiative-level | Strategy artifact versus attached decision overlap |
| ARS-PD-003 | INI-003 | CD8 Workspaces | B2 Shape; B5 Pilot | agent-ready-studio | — | Product | Evidence-synthesis semantics | INI-003 Findings; initiative-level | — |
| ARS-PD-004 | INI-003 | CD8 Workspaces | B2 Shape; B5 Pilot | agent-ready-studio | — | Product | — | INI-003 Findings; initiative-level | — |
| ARS-PD-005 | INI-003 | CD8 Workspaces | B2 Shape; B5 Pilot | agent-ready-studio | agent-ready-repo: optional projection | Product | Architecture-artifact semantics | Named: drift evidence silent; local core viable, projection optional | Local workspace versus repository projection |
| ARS-PD-006 | INI-003 | CD8 Workspaces | B3 Build; B5 Pilot | agent-ready-studio | agent-ready-repo: delivery contracts | Product | — | INI-003 Findings; initiative-level | — |
| ARS-PD-007 | INI-003 | CD8 Workspaces | B3 Build; B5 Pilot | agent-ready-studio | — | Product | — | INI-003 Findings; initiative-level | Release readiness, outcomes, and learning may split |
| ARS-PD-008 | INI-003 | CD8 Workspaces | B5 Pilot; B6 Platform | agent-ready-studio | — | Capability | Discipline-specific workflow and review model | INI-003 Findings; initiative-level | Overlaps CD6 transformation and review contracts |

### INI-004 — Repository Workspace Pane

| ID | Canonical initiative | Primary domain | Delivery initiatives | Primary repo | Counterpart | Authority plane | Architecture subject | Review finding | Candidate split / overlap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ARS-REPO-001 | INI-004 | CD2 Sources | B1 Connect | agent-ready-studio | — | Source | Public Git URL source mode | INI-004 Findings; initiative-level | — |
| ARS-REPO-002 | INI-004 | CD2 Sources | B1 Connect | agent-ready-studio | agent-ready-repo: revision identity | Source | Repository identity, pinning, and trust boundary | INI-004 Findings; initiative-level | — |
| ARS-REPO-003 | INI-004 | CD6 Interop | B1 Connect | agent-ready-repo | agent-ready-studio: detection consumer | Capability | Agent-Ready repository detection | INI-004 Findings; initiative-level | — |
| ARS-REPO-004 | INI-004 | CD2 Sources | B1 Connect | agent-ready-studio | agent-ready-repo: status contract | Control | Repository status projection | INI-004 Findings; initiative-level | Overlaps B1 orientation and control-plane state |
| ARS-REPO-005 | INI-004 | CD2 Sources | B1 Connect | agent-ready-studio | agent-ready-repo: reconciliation contract | Control | Status reconciliation boundary | INI-004 Findings; initiative-level | Detail, reconciliation, and refresh may separate |
| ARS-REPO-006 | INI-004 | CD6 Interop | B1 Connect; B6 Platform | agent-ready-studio | agent-ready-repo: capability metadata | Capability | Capability discovery contract | INI-004 Findings; initiative-level | Pack, profile, adapter, and skill views overlap |
| ARS-REPO-007 | INI-004 | CD2 Sources | B1 Connect; B6 Platform | agent-ready-studio | agent-ready-repo: dependency receipts | Control | Cross-repository dependency projection | INI-004 Findings; initiative-level | Overlaps ARS-RUN-012 coordination receipts |
| ARS-REPO-008 | INI-004 | CD2 Sources | B1 Connect; B4 Parity | agent-ready-studio | — | Source | Local-folder and managed-clone source modes | INI-004 Findings; initiative-level | Local folder versus managed clone |
| ARS-REPO-009 | INI-004 | CD2 Sources | — | agent-ready-studio | agent-ready-repo: source authority | Source | Installation and hidden-workspace boundary | INI-004 Findings; initiative-level | Installation, private access, and write-back may split |

### INI-005 — Studio Shaping Workbench

| ID | Canonical initiative | Primary domain | Delivery initiatives | Primary repo | Counterpart | Authority plane | Architecture subject | Review finding | Candidate split / overlap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ARS-SHAPE-001 | INI-005 | CD4 Shaping | B1 Connect; B2 Shape | agent-ready-studio | agent-ready-repo: status contract | Product | — | INI-005 Findings; initiative-level | Repository view versus local artifact |
| ARS-SHAPE-002 | INI-005 | CD4 Shaping | B2 Shape | agent-ready-studio | agent-ready-repo: optional projection | Product | — | INI-005 Findings; initiative-level | Local Draft capture versus repository projection |
| ARS-SHAPE-003 | INI-005 | CD4 Shaping | B2 Shape | agent-ready-repo | agent-ready-studio: transformation host | Capability | Transformation contract | INI-005 Findings; initiative-level | Frame, de-risk, and decompose may split |
| ARS-SHAPE-004 | INI-005 | CD4 Shaping | B2 Shape; B5 Pilot | agent-ready-studio | agent-ready-repo: routing skills | Capability | Capability-based transformation routing | INI-005 Findings; initiative-level | Overlaps CD8 discipline workspaces |
| ARS-SHAPE-005 | INI-005 | CD4 Shaping | B2 Shape; B3 Build | agent-ready-studio | — | Product | Ratification and acceptance boundary | Named: charter conflict resolved in favour of human acceptance | Policy-driven pre-acceptance transitions may split |
| ARS-SHAPE-006 | INI-005 | CD4 Shaping | B2 Shape; B3 Build | agent-ready-studio | agent-ready-repo: lifecycle contracts | Control | Promotion and lifecycle handoff | INI-005 Findings; initiative-level | Intent, brief, spec, and build transitions may split |
| ARS-SHAPE-007 | INI-005 | CD7 Delivery | B3 Build | agent-ready-studio | agent-ready-repo: self-host target | Control | Self-hosting validation boundary | INI-005 Findings; initiative-level | Capability intent versus validation route |
| ARS-SHAPE-008 | INI-005 | CD7 Delivery | B2 Shape; B6 Platform | agent-ready-studio | agent-ready-repo: target workspace | Control | Cross-repository shaping boundary | INI-005 Findings; initiative-level | Target workspace necessity remains open |

### INI-006 — Workspace Blueprints, Capability Packs, and AgentBundle Platform

| ID | Canonical initiative | Primary domain | Delivery initiatives | Primary repo | Counterpart | Authority plane | Architecture subject | Review finding | Candidate split / overlap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ARS-EXT-001 | INI-006 | CD6 Interop | B5 Pilot; B6 Platform | agent-ready-studio | — | Capability | Versioned Workspace Blueprint | INI-006 Findings; initiative-level | Declarative data versus host behavior |
| ARS-EXT-002 | INI-006 | CD6 Interop | B5 Pilot; B6 Platform | agent-ready-studio | — | Capability | Capability Pack boundary | INI-006 Findings; initiative-level | Agent-Ready pack special case remains open |
| ARS-EXT-003 | INI-006 | CD6 Interop | B3 Build; B6 Platform | agent-ready-studio | — | Capability | Declarative manifest and host-known renderer boundary | INI-006 Findings; initiative-level | Overlaps ARS-UX-004 renderer registry |
| ARS-EXT-004 | INI-006 | CD9 Scale | B6 Platform | agent-ready-studio | agent-ready-repo: pack migrations | Capability | Compatibility, migration, and extension-trust boundary | INI-006 Findings; initiative-level | Compatibility migration versus extension trust |
| ARS-EXT-005 | INI-006 | CD6 Interop | B1 Connect; B4 Parity; B6 Platform | agent-ready-repo | agent-ready-studio: pack host | Capability | Agent-Ready Capability Pack lifecycle | INI-006 Findings; initiative-level | Read-and-plan versus applied lifecycle changes |
| ARS-EXT-006 | INI-006 | CD9 Scale | B2 Shape; B6 Platform | agent-ready-repo | agent-ready-studio: contract consumer | Capability | Machine-readable skill and organization-overlay contract | Named: gap claim silent; existing declarations partial; terminology inconsistent | Skill contracts versus organization templates |

### INI-007 — Headless Execution and Delivery Runtime

| ID | Canonical initiative | Primary domain | Delivery initiatives | Primary repo | Counterpart | Authority plane | Architecture subject | Review finding | Candidate split / overlap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ARS-RUN-001 | INI-007 | CD5 Runtime | B3 Build; B4 Parity | agent-ready-studio | — | Control | Execution broker and Studio Runtime Protocol | INI-007 Findings; initiative-level | Protocol versioning overlaps Studio service protocol |
| ARS-RUN-002 | INI-007 | CD5 Runtime | B3 Build; B4 Parity | agent-ready-studio | — | Execution | Executor adapter boundary | INI-007 Findings; initiative-level | Provider adapters share one executor contract |
| ARS-RUN-003 | INI-007 | CD6 Interop | B2 Shape; B3 Build; B4 Parity | agent-ready-studio | agent-ready-repo: AgentBundle contract | Capability | AgentBundle headless adapter | INI-007 Findings; initiative-level | Adapter overlaps ARS-EXT-005 lifecycle capability |
| ARS-RUN-004 | INI-007 | CD6 Interop | B3 Build; B4 Parity | agent-ready-repo | agent-ready-studio: dependency artifact | Capability | Cross-repository contract placement | Named: outcome belongs upstream; accepted upstream artifact required | Studio dependency versus upstream contract split |
| ARS-RUN-005 | INI-007 | CD7 Delivery | B3 Build | agent-ready-studio | agent-ready-repo: work-loop contract | Execution | Isolated proposal production | INI-007 Findings; initiative-level | — |
| ARS-RUN-006 | INI-007 | CD7 Delivery | B2 Shape; B3 Build | agent-ready-studio | — | Control | Durable gate and session-control model | INI-007 Findings; initiative-level | — |
| ARS-RUN-007 | INI-007 | CD5 Runtime | B3 Build; B4 Parity | agent-ready-studio | — | Control | Durable run lifecycle | INI-007 Findings; initiative-level | Liveness, recovery, and cleanup may split |
| ARS-RUN-008 | INI-007 | CD5 Runtime | B3 Build; B4 Parity | agent-ready-studio | agent-ready-repo: artifact conventions | Execution | Filesystem and Git reconciliation boundary | INI-007 Findings; initiative-level | Reconciliation overlaps proposal production |
| ARS-RUN-009 | INI-007 | CD5 Runtime | B3 Build; B4 Parity | agent-ready-studio | — | Execution | Environment-policy enforcement boundary | INI-007 Findings; initiative-level | Enforcement versus audit split question |
| ARS-RUN-010 | INI-007 | CD5 Runtime | B4 Parity | agent-ready-studio | — | Execution | Runtime adapter boundary | INI-007 Findings; initiative-level | Command center, IDE, remote, CI, and deployment adapters may split |
| ARS-RUN-011 | INI-007 | CD5 Runtime | B3 Build | agent-ready-studio | — | Control | Multi-executor orchestration | INI-007 Findings; initiative-level | Comparison overlaps ARS-UX-008 synthesis |
| ARS-RUN-012 | INI-007 | CD7 Delivery | B4 Parity; B6 Platform | agent-ready-studio | agent-ready-repo: coordination receipts | Control | Cross-repository coordination protocol | INI-007 Findings; initiative-level | Overlaps ARS-REPO-007 dependency view |
| ARS-RUN-013 | INI-007 | CD7 Delivery | B3 Build | agent-ready-studio | agent-ready-repo: governed runtime | Control | Governed self-build boundary | INI-007 Findings; initiative-level | Capability intent versus validation milestone |

### INI-008 — Collaboration, Security, Integrations, and Outcomes

| ID | Canonical initiative | Primary domain | Delivery initiatives | Primary repo | Counterpart | Authority plane | Architecture subject | Review finding | Candidate split / overlap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ARS-SCALE-001 | INI-008 | CD9 Scale | B6 Platform | agent-ready-studio | — | Product | Team actor and ownership model | INI-008 Findings; initiative-level | Actor authority versus routing and notification |
| ARS-SCALE-002 | INI-008 | CD9 Scale | B6 Platform | agent-ready-studio | — | Product | Artifact authorization boundary | INI-008 Findings; initiative-level | Permissions versus sensitive-data lifecycle |
| ARS-SCALE-003 | INI-008 | CD9 Scale | B4 Parity; B6 Platform | agent-ready-studio | — | Control | Model-access and disclosure policy | INI-008 Findings; initiative-level | Access enforcement versus audit |
| ARS-SCALE-004 | INI-008 | CD9 Scale | B4 Parity | agent-ready-studio | — | Product | Cloud persistence and synchronization boundary | INI-008 Findings; initiative-level | Synchronization versus durable asset storage |
| ARS-SCALE-005 | INI-008 | CD9 Scale | — | agent-ready-studio | — | Source | External-system authority boundary | INI-008 Findings; initiative-level | Integration versus portfolio projection |
| ARS-SCALE-006 | INI-008 | CD9 Scale | — | agent-ready-studio | — | Product | Retention and export governance | INI-008 Findings; initiative-level | Feedback, retention, export, and governance may split |

## Counts

The index contains 64 detailed capability intents. Each appears once in the
mapping and has exactly one primary domain and one primary repository.

| Primary domain | Capabilities |
| --- | ---: |
| CD1 Core and reliability | 2 |
| CD2 Connected sources | 7 |
| CD3 Artifact and review experience | 10 |
| CD4 Guided shaping | 6 |
| CD5 Workspace Runtime | 8 |
| CD6 Agent-Ready interoperability | 8 |
| CD7 Governed delivery and self-hosting | 6 |
| CD8 Multidisciplinary workspaces | 9 |
| CD9 Platform and organizational scale | 8 |
| **Total** | **64** |

Delivery membership is zero-to-many, so these counts intentionally exceed 64
when summed. Three capabilities carry no proposed delivery initiative:
ARS-REPO-009, ARS-SCALE-005, and ARS-SCALE-006.

| Delivery initiative | Capabilities |
| --- | ---: |
| B1 Connect and Orient | 15 |
| B2 Shape and Ratify | 22 |
| B3 Build and Review | 26 |
| B4 Local and Cloud Runtime Parity | 15 |
| B5 Multidisciplinary Pilot | 15 |
| B6 Workspace Platform Generalization | 15 |

| Primary repository | Capabilities |
| --- | ---: |
| agent-ready-studio | 59 |
| agent-ready-repo | 5 |
| **Total** | **64** |

## Candidate splits and overlaps recorded, not applied

No split, merge, renumbering, reassignment, or supersession was carried out in
this pass. The recovered review's dominant MAJOR finding was “split an
over-broad outcome,” raised against roughly a third of the inventory and
re-raised in its second round. Each affected intent already carries an
unresolved question naming the separability; the mapping records those
questions without deciding them.

The record supports two finding classes. The affected intent bodies supply the
examples below:

- Over-broad outcomes may need smaller, independently verifiable capabilities.
  Recurring boundaries include service versus protocol versus adapters; input
  versus review packages; comparison versus synthesis versus canvases; framing
  versus de-risking versus decomposition; lifecycle reading versus mutation;
  runtime visibility versus recovery; permissions or enforcement versus audit;
  cloud synchronization versus asset storage; and integrations versus portfolio
  projection.
- ARS-RUN-004 has a named ownership overlap. Its outcome belongs to
  Agent-Ready Repo maintainers, while the current Studio artifact records
  Studio's dependency. The record calls for an upstream-owned artifact accepted
  by those maintainers and leaves open whether the current outcome should split.

The record also names two former charter conflicts, on ARS-CORE-005 and
ARS-SHAPE-005. Those conflicts were resolved in favour of attributable human
acceptance; the remaining question is whether policy-driven transitions short
of acceptance should be separate work. This overlay does not alter that
resolution or apply any candidate split.
