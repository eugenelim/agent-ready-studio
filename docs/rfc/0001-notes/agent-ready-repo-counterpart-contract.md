# Agent-Ready Repo counterpart contract

Companion note to [RFC-0001](../0001-studio-authority-planes-and-workspace-runtime-boundary.md),
**Accepted 2026-09-11**. Accepting RFC-0001 did **not** accept anything in this
note: these are needs Studio would have of another repository, and that
repository's maintainers have not seen or agreed to them.

This note records **needs**, not a specification. `agent-ready-repo` is a
separate repository with its own maintainers and its own governance. Nothing
here is authored into it, and nothing here obliges it. Each item is a
capability Studio would depend on, stated so that repository's maintainers can
judge, reject, or reshape it.

**No file in `agent-ready-repo` is read, written, or proposed by this pass.**

## Where the ownership question already sits

Upstream ownership is **not settled, and is not settled here.** The reviewed
Studio intent
[ARS-RUN-004 — Harden Agent-Ready Repo's headless contract for Studio
control](../../product/intents/harden-agent-ready-repo-headless-contract-for-studio-control.md)
is where the question currently lives — but that intent is itself an unshaped
`Draft`, which by the [index's](../../product/capability-intents.md) own
definition has "not been shaped, validated, approved, funded, or scheduled".
It records a Studio-side dependency and confers no authority over another
repository. This note does not upgrade that.

The shaping review's finding against that intent is the reason this note is
separate rather than folded into the RFC body. Recoverable from history at
commit `f048142^` — no persisted review record exists in the repository; see
[`current-state-and-authorities.md`](current-state-and-authorities.md#review-record-provenance) —
the review recorded that ARS-RUN-004's *outcome is work owned by Agent-Ready
Repo's maintainers while this repository owns the artifact*, and that it needs
an upstream-owned artifact those maintainers accept. That finding was recorded
in the intent's boundary and deliberately not acted on.

This note is the RFC's response: state the needs, keep them here, and let the
Stage 2 follow-on produce paired artifacts with explicit ownership rather than
a Studio-authored upstream specification.

Related reviewed intents that also touch upstream ownership:
[ARS-REPO-003](../../product/intents/agent-ready-repository-detection.md),
[ARS-REPO-006](../../product/intents/pack-profile-adapter-and-skill-capability-visibility.md),
[ARS-EXT-005](../../product/intents/agent-ready-capability-pack-and-agentbundle-lifecycle.md),
[ARS-EXT-006](../../product/intents/machine-readable-skill-contracts-and-organization-owned-templates.md),
[ARS-RUN-003](../../product/intents/agentbundle-headless-shaping-and-build-adapter.md).

## Counterpart needs for Connect and Orient

These are what the [steel thread](connect-and-orient-steel-thread.md) needs
upstream. They are the near-term set.

**Safe deterministic read-only workspace inspection.** One invocation against a
materialized checkout that reads and reports, with the same input producing the
same output. No writes, no network, no agent.

**Workspace schema and contract-version reporting.** The inspector states which
schema version it read and which contract version it implements, so Studio can
refuse a version it does not understand rather than guess.

**Item classification.** Each queue or backlog item classified by kind and
lifecycle position, using upstream's own vocabulary. Studio renders the
classification; it does not derive it.

**Dependency and blocker explanation.** Why an item is blocked and what would
unblock it, in machine-readable form. Studio's blocker view
([ARS-REPO-005](../../product/intents/queue-detail-blocker-explanation-reconciliation-and-refresh.md))
is a projection of this, not an independent analysis.

**Canonical artifact references.** Repository-relative paths to the canonical
artifacts an item points at, so Studio can open a canonical intent without
knowing upstream's layout conventions.

**Pack, profile, adapter, and skill inventory.** What is installed and at which
version — the factual basis for the shaping-availability answer.

**Honest transformation availability.** Whether a named transformation could
run in this repository as it currently stands, and if not, why. Honest includes
answering "no" and answering "unknown".

**No requirement to start an agent.** Inspection must not need a provider, a
credential, or a model call.

**No requirement to invoke a live MCP server.** Inspection must not depend on a
running tool host.

**No execution of repository-authored skill or hook code during remote
inspection.** This is the load-bearing security property. A remote repository
must not be able to run code by being inspected. Without it, the Connect and
Orient steel thread cannot honor its "no repository content executed"
definition-of-done item, and the whole read-only claim collapses.

**Stable machine-readable diagnostics.** Stable codes, not prose to be parsed.
Diagnostics must distinguish *unsupported*, *malformed*, and *absent*, because
Studio must tell those three apart to stay honest with the user.

**Fixtures for supported, unsupported, malformed, and non-Agent-Ready
repositories.** Four cases, because Studio's definition of done requires
correct behavior on all four, and a non-Agent-Ready repository must produce a
normal result rather than an error.

## Later counterpart needs

Recorded separately because they belong to later delivery initiatives and
should not be read as Connect and Orient prerequisites.

- **Machine-readable transformation descriptions** — inputs, outputs, and
  preconditions of the shaping methods, so Studio can present a transformation
  without hardcoding its shape.
- **Trusted capability-bundle resolution** — resolving a pinned, verified
  bundle for a runtime to use, including for a cloud runtime with no local
  installation.
- **Headless shaping** — running `frame-intent` and the related methods without
  an interactive session.
- **Prepare, reconcile, and admit operations** — the repository-local
  write-path operations, each individually authorized.
- **Durable repository gate semantics** — gates that persist across process
  restarts and are meaningful to a remote control plane.
- **Architecture-aware monorepo component scaffolding** — routing among client,
  service, runtime, worker, library, contract, and infrastructure stereotypes.
  Needs its own upstream intent and RFC, and is **not** a dependency of Connect
  and Orient. The `monorepo-extras` pack is not installed in this repository and
  is not changed by this initiative.

## Deliberately undecided

**Where a cross-language shared schema package lives.** If both repositories
need one schema, the hosting decision is joint and premature. Recorded as open
question 2 in [RFC-0001](../0001-studio-authority-planes-and-workspace-runtime-boundary.md#open-questions).
The recommended default is to defer until a second language consumer exists.

What is *not* undecided: every shared schema has exactly one owner. The
principle holds even while the hosting question is open.

## What this note is not

- Not an implementation specification for `agent-ready-repo`.
- Not a commitment by that repository's maintainers.
- Not a settlement of upstream ownership. ARS-RUN-004 is where that question
  sits, as an unshaped Draft; neither it nor this note resolves it.
- Not authority to edit anything upstream.

Paired artifacts in both repositories with explicit ownership are **Stage 2**
work — item 9 in
[`post-acceptance-follow-ons.md`](post-acceptance-follow-ons.md), unlocked only
after the Connect and Orient gate passes. Accepting RFC-0001 does not start
upstream coordination, and approaching those maintainers before there is a
validated boundary to coordinate about would be premature.
