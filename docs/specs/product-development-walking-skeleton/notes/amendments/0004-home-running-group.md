# Amendment 0004 — Home's Running group, removed rather than faked

**Date:** 2026-09-10
**Criteria changed:** AC-14, AC-40
**Contract changed:** yes — `home.get` result, both the canonical JSON Schema and
the Zod mirror

## What was wrong

AC-14 named four Home groups, one of which the product could not populate.

`readHome` selected executions with status `running` or `failed` and routed them
into Running and Blocked. No such row can exist. `storage.transaction` is an
immediate SQLite transaction, and `executionStart` inserts the execution as
`running` and updates it to `completed` inside a single call, so a process death
mid-execution rolls the insert back rather than leaving a running row on disk.
Nothing anywhere writes `failed`: the failure path returns a value and commits
nothing.

The Running group was therefore permanently empty, fed by an unreachable branch,
and its only non-empty rendering anywhere was a hand-written component fixture.

## Why this shape

Two options were live. The execution path could have been split so the `running`
row commits before the work and is completed or failed in a second transaction —
making the state real, and making a killed process leave visible evidence instead
of vanishing. That is the right design for long-running or resumable execution and
the wrong one for this slice, where the whole transformation is a deterministic
in-process function call; it would also have required re-examining AC-22's
guarantee that events commit in the same transaction as the semantic state they
describe.

The scope owner chose to amend. Execution here is atomic, and the criterion now
says so rather than promising a state the product cannot reach.

## What changed

- **AC-14** drops Running from its group list and states why: the run commits with
  its proposal, review and events, or it writes nothing.
- **AC-40** now reads "every Inbox group named in AC-14 ... from committed rows".
- The unreachable executions branch is gone from `readHome`, with the reason
  recorded at the deletion point.
- `home.get`'s result no longer carries `running`. Because every remaining Home
  item is a review, the item's `kind` narrows from `review | execution` to
  `review` and its `status` from five values to three — each removed variant was
  reachable only through the deleted branch.

## What holds the two contracts together

An earlier version of this record claimed the fixture cross-check does. It does
not, and the correction is worth keeping because the reasoning is easy to get
backwards: **widening a schema is permissive.** A fixture that validated before
`status` is widened back to five values still validates after, so no positive
fixture can detect the narrowing being undone. Carrying real items in the
`home.get` fixture is still worth doing — it exercises the item definitions at
all — but it proves the schema accepts what it should, never that it refuses what
it should.

The enforcement is a rejection case, asserted against both contracts, because
either can be widened alone: `contracts.test.ts` requires a Home item with
`status: "running"`, with `status: "failed"`, with `kind: "execution"`, and a
result carrying a `running` array, to be refused by the canonical schema and by
the Zod mirror. Undoing this amendment in either file turns that test red.

## How it was found

Quality review at spec-level coverage scope, round 30, by mutation testing. The
finding was that no test exercised the Running projection. The first attempt to
fix it fabricated a `running` row through a direct storage write and described it
as the residue of a process death — a false premise that produced a test proving
SQL over a hand-written row. Adjudication caught that and established the
atomicity that makes the whole branch dead.
