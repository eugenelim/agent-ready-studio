# Roadmap

Direction for Agent-Ready Studio's next horizons. It is not a commitment.

**Last updated:** 2026-09-09
**Reviewed:** quarterly. Next review: 2026-12-09.

## Now (current quarter)

What we're actively working on. Each item should link to a spec in
`docs/specs/` once one exists.

- **Product Development walking skeleton.** Complete verification and durable
  documentation for the implemented local path from workspace and Input Packet
  to deterministic Product Intent, human decision, and restart-safe state.
  [spec](../specs/product-development-walking-skeleton/spec.md)

## Next (following 1-2 quarters)

What we expect to pick up after Now. These are intentions, not promises.
Items here should have at least an RFC or a one-paragraph problem
statement somewhere — if there's nothing written down, it's not yet
ready to be on the roadmap.

- **Artifact depth.** Improve rich artifact rendering and editing, semantic
  diffs, evidence provenance, and graph-based applicability. Intent only.
- **Optional agent-ready capability.** Assess validated Agent-Ready and
  repository capability packs without making them core requirements. Intent
  only.

## Later

Things we believe matter but aren't actively planning. Items here serve
two purposes: signal to contributors that we'd accept a PR, and let us
say "not now" without saying "never."

- Collaboration and sensitive-data controls.
- Remote runners, production integrations, and cloud sync.
- Visual canvases and portfolio or outcome projections.

## Not in scope

Things that have come up and that we've explicitly decided are *not*
in scope. This is the most valuable section for AI agents and new
contributors — it prevents wasted exploration of dead ends.

- **Real provider dispatch, Git worktrees, and terminal emulation.** The first
  slice proves a deterministic, executor-independent path without turning the
  product into repository automation.
- **Arbitrary executable plugins.** Extensions stay declarative and validated;
  the initial product does not load third-party code into privileged processes.
- **Authentication, cloud sync, and multi-user collaboration.** These expand
  the local product's trust and operating model and need separate governance.

## How this file is maintained

- **Owners:** Agent-Ready Studio maintainers.
- **Updates:** roadmap items move between sections via small PRs. Substantive
  additions or deletions go through an RFC.
- **Review cadence:** quarterly. The review updates the "Last updated" date
  even if no items change — fresh eyes, fresh dates.
- **Drift signal:** if items in "Now" haven't moved in two consecutive
  reviews, either they're not actually being worked on (move them out)
  or the roadmap doesn't reflect what the team is doing (rewrite it to
  match).
