# docs/

What belongs where in this repository's documentation, and which parts must
match current reality.

Read this before adding a document. Putting a fact in the wrong layer is the
most common source of documentation rot: a decision recorded as current state
goes stale, and current state recorded as a decision never gets updated.

## The map

| Area | What belongs there | Lifecycle |
| --- | --- | --- |
| `CHARTER.md` | What we believe and are trying to build — direction, not decisions | living |
| `adr/` | Architecture decision records: one decision and the context that produced it | frozen |
| `rfc/` | Proposals for significant change, open until accepted, rejected or withdrawn | governance while open, frozen once accepted or rejected |
| `architecture/` | How the code is organized today (`overview.md`, descriptive) and the golden path new work conforms to (`reference.md`, normative) | living |
| `product/` | What the product is doing today: direction, release history, and the briefs and intents behind in-flight work | living |
| `specs/` | The engineering contract for one feature, with its implementation plan | living while building, frozen once shipped |
| `knowledge/` | Practitioner residue — patterns, gotchas and antipatterns scoped to a file glob | living |

Guidance files are outside this map: `AGENTS.md` at the repository root and the
scoped [`AGENTS.md`](AGENTS.md) here carry the rules an agent must read, not the
documentation the rules are about.

Add a row when you install a pack that seeds a new area, or when you create one.

### Two architecture documents, two jobs

`architecture/overview.md` is **descriptive** — the map of how the code is
organized today, read to find things. `architecture/reference.md` is
**normative** — the golden path (stack, building blocks, cross-cutting
standards) that new work conforms to.

Getting these the wrong way round is the common mistake: a map written as a
standard goes stale the moment the code moves, and a standard written as a map
never gets enforced.

## The three lifecycle classes

Every document belongs to exactly one, and the maintenance rule differs:

- **living** — must match current reality, and is updated in the same change as
  anything that affects it. Drift is a bug, not debt.
- **frozen** — an immutable record of what was decided or delivered. Never
  edited to reflect a later change; superseded by a new record that cites it.
- **governance** — an in-flight proposal, open until it is accepted, rejected or
  withdrawn. It describes what someone wants, not what is.

A shipped spec moves from living to frozen. That transition is the one that
catches people out: once shipped, correct it by superseding it, not by editing
the body.

## Specs and plans

A feature that needs a durable delivery contract gets `docs/specs/<feature>/`
holding `spec.md` — the contract: objective, boundaries, testing strategy,
acceptance criteria, what the feature does — and `plan.md` — the strategy,
low-level design, and construction tests: how it gets built.

The split is what the two documents are *for*. The spec is what a completion
gate reads and what an amendment changes. The plan is working material the
author corrects in place as the work teaches. Low-level design belongs in the
plan, never the spec.

A spec directory freezes as a unit when the spec ships.

## Decision records

`adr/` and `rfc/` hold the two halves of one question. An **RFC is
forward-looking governance** — a proposal to change something significant: a
new feature area, a new convention, a deprecation, a breaking change to a
published interface. An **ADR is a backward-looking record** — one decision,
the context that produced it, and the tradeoff accepted.

Write an ADR when you are choosing between two or more reasonable options and
the choice is expensive to reverse, or when the reasoning involves tradeoffs a
future maintainer could not reconstruct from the code alone. Do not write one
for a decision with a single sensible option, for a single feature's internals
(that is a spec), or to describe how something works today (that is
`architecture/`). Rule of thumb: if you would be annoyed to discover the
decision was made without discussion, write an ADR.

### What an accepted ADR freezes

Acceptance freezes an ADR's **prose**, not its metadata — which is what lets a
supersession be recorded without editing a frozen record. Reversing a decision
means writing a new ADR and pointing the two at each other, never rewriting the
old one; a `Rejected` ADR is kept as a record, never deleted.

Which fields exist, which mutability zone each sits in, and how the supersession
pairings are written is owned by the `new-adr` skill's template at
`assets/adr.md`, which arrives with the `governance-extras` pack. Read it there;
`pnpm governance` enforces it. The one convention this repository adds: every
record numbers its `## Decision` constraints `D1..Dn`, dense from `D1`, with the
headline decision at `D1`, so a partial supersession has an address for it.

### The ADR index is generated

`adr/README.md` is derived from the records themselves, so it cannot disagree
with the corpus it describes. Never hand-write a row into it. Regenerate it
after adding or restatusing a record:

```bash
SKILL=.claude/skills/new-adr   # or .agents/skills/new-adr for Codex
python3 "$SKILL/scripts/index-records.py" docs/adr
```

`rfc/README.md` is hand-written and deliberately **not** generated, even though
the `new-rfc` skill ships the same generator. Its authoring sequence has a
regenerate step; running it here replaces the Opened/Closed table and deletes
the hand-written "Adding a new RFC" section. Skip that step. `docs/AGENTS.md`
carries this as a scoped rule, because that is the file work under `docs/`
obliges you to read.

### Adding a new ADR

Invoke the `new-adr` skill by name. To do it by hand:

```bash
SKILL=.claude/skills/new-adr   # or .agents/skills/new-adr for Codex
N=$(python3 "$SKILL/scripts/next-ordinal.py" docs/adr)
cp "$SKILL/assets/adr.md" "docs/adr/${N}-<kebab-title>.md"
```

Filenames are `NNNN-kebab-case-title.md`; ordinals are sequential and never
reused. Fill in the template, delete its guidance comments, then run
`pnpm governance` — it checks ADR and RFC ordinals, regenerates-and-compares the
ADR index, and runs the ADR shape lint over every record.

## The living layer

The map above assigns every area its lifecycle class; this is what the `living`
rows have in common. They describe what *is*, not what was decided or what is
proposed, and each serves a different reader: `architecture/` for contributors,
`product/` for maintainers, `knowledge/` for whoever hits the same trap next,
`CHARTER.md` for anyone asking what the project is for. A record that fixes a
decision or proposes one sits outside that layer, which is why `adr/`, `rfc/`,
and a shipped `specs/` directory are classed frozen or governance instead.
