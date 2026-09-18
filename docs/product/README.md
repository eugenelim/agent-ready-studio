# Product

> The product-side counterpart to [`architecture/`](../architecture/).
> Architecture answers "what is the code, today?"; product answers "what
> is the product, today?" Both are *living* docs — kept in sync with
> reality, not historical record.

## What lives here

- [`roadmap.md`](roadmap.md) — direction for the next 2-4 quarters, organized
  by initiative group. Direction, not commitments. Updated quarterly.
- [`capability-intents.md`](capability-intents.md) — the index of captured
  product direction: the ten ARS-CAP portfolio anchors, the eight initiative
  groups, and every capability intent.
- [`intents/`](intents/) — one canonical file per intent. Each owns its
  outcome, opportunity, boundary, assumptions, unresolved questions, and
  projection. The index links to them; it does not duplicate them.
- [`briefs/<slug>.md`](briefs/) — multi-feature delivery briefs and their
  auto-rolled-up coverage maps. One file per brief, created or continued by
  `author-delivery-brief`.
- [`changelog.md`](changelog.md) — user-visible changes by release,
  in [Keep a Changelog](https://keepachangelog.com/) format. Updated
  every PR that changes user-visible behavior.
- [`aesthetic-direction.md`](aesthetic-direction.md) and
  [`design-system.md`](design-system.md) — the named visual direction and the
  token and scale system derived from it.

Two optional files are not present yet, and are named here so nobody invents a
different home for them:

- `personas.md` — who we're building for. Add only if it is actively used to
  make decisions; speculative personas rot.
- `release-checklist.md` — manual-QA rows CI cannot exercise. Add it the first
  time a spec needs out-of-band verification, and copy each spec's section into
  the release PR description before tagging.

## What does NOT live here

- **Why we made past choices** → [`../adr/`](../adr/) (immutable history).
- **What we're proposing to change** → [`../rfc/`](../rfc/) (governance).
- **What an individual feature does** → [`../specs/<feature>/spec.md`](../specs/).
- **The mission and scope of the project** → [`../CHARTER.md`](../CHARTER.md).
- **How users actually use the product** → `../guides/`, Diátaxis-organized
  user docs. That directory does not exist yet; create it with the first user
  guide rather than putting user documentation here.

## The product/ layer is *living*

Unlike ADRs and shipped specs (which are frozen records), files here must
match current reality. Drift is a bug. The maintenance rules are in
[`../README.md`](../README.md#the-three-lifecycle-classes).
