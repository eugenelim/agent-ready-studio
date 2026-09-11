# Amendment 0003 — Overview and Strategy get honest content

## Scope-owner authority

The scope owner, running the application, asked why Strategy does not render
"Strategy is empty" like the other module surfaces. Presented with three options —
Strategy lists the workspace's Product Intents with an honest empty state, both
surfaces get conditional empty states, or leave the blurbs and record the gap —
the owner chose the first:

> **Strategy shows the workspace's Product Intent artifacts and an honest empty
> state when there are none; Overview gets an honest empty state.**

## Reason

AC-04 names exactly six modules — Research, Experience, Architecture, Delivery,
Release and Outcomes — and requires each to render a purpose-specific empty state.
**Overview and Strategy are named by no criterion**, and were given hand-written
description blurbs instead:

```tsx
if (module === "Strategy") {
  return (<section><h2>Strategy</h2>
    <p>Frame product intent from grounded inputs.</p></section>);
}
```

That is a static sentence, not workspace content. It reads as though the surface
holds something when it holds nothing — the opposite failure from the honest empty
states the other six render.

**The obvious fix would have been wrong.** Giving Strategy a flat "Strategy is
empty" matches the other six, but the other six are genuinely always empty in this
slice: no research, experience, architecture, delivery, release or outcomes
artifacts exist at all. Strategy is where product-intent work lives, and the
skeleton really does produce Product Intents — so a flat empty state would become
false the moment the demo is seeded and the transformation run. Consistency would
have traded one dishonest surface for another.

This is the fourth defect found in the gap between criteria rather than against
one, and the third the owner found by using the application.

## What changes

New **AC-51**. Strategy renders the workspace's Product Intent work, each entry
opening the Work Item Studio, and states emptiness only when there are none.
Overview renders an honest empty state until there is something to summarise.

**The criterion is written to what the contract supports.** Protocol v1 has no
method that lists artifacts or revisions by workspace; `review.list` is the only
read that reaches Product Intents, and it carries artifact title, artifact type,
revision id and review status per entry. AC-51 therefore says "read from
`review.list`, filtered to the `product-intent` artifact type, labelled with its
review status" rather than describing a revision-lifecycle read that would have
required a contract change. In this slice the two coincide: every Product Intent
revision is created either by a transformation or by a human revision, and both
open a review, so no Product Intent is unreachable through this read.

AC-04 is untouched: its six modules keep their empty states exactly as specified.
No contract definition changes.

## Completed evidence

Recorded in `../verification-ledger.md`, with the negative control for each new
assertion.
