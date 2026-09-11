# Amendment 0002 — the Reviews surface gets its own content

## Scope-owner authority

The scope owner, running the application at the CODE-HUMAN-GATE, asked why Home and
Reviews show the same body. Presented with three options — give Reviews the full
review list via `review.list`, reduce Reviews to a detail host only, or leave the
duplication and record it — the owner chose the first:

> **Reviews becomes the full list via `review.list`** — open, revision-needed,
> resolved and superseded — while Home stays the decision inbox.

That decision is the authority for this amendment.

## Reason

Two facts established at the gate:

1. **Reviews has no criterion defining its content.** AC-14 assigns the four-group
   decision inbox to *Home*. AC-03 says only that "Reviews is global navigation,
   not a ninth blueprint module". Nothing says what the Reviews surface renders, so
   it was built by reusing Home's body: both surfaces render the same
   `ReviewInbox`, differing only in Home's create-workspace form and Reviews'
   ability to swap in the Work Item Studio.

2. **`review.list` is exposed and unreachable.** The canonical contract defines it,
   AC-34 includes review methods in the preload surface, the preload exposes it —
   and no renderer code calls it. The contract already carried the method a
   distinct Reviews surface needs.

The duplication is therefore not a defect against a criterion. It is a gap between
criteria, and the same shape as the two defects the owner found immediately before
it: an action rendered on surfaces it does not belong to, and actions that changed
state without saying so. None was caught by 114 tests because none of them is
something a criterion asks about.

## What changes

New **AC-50**. Home remains the decision inbox unchanged; Reviews gains the
complete review list, grouped by lifecycle status, reachable into the Work Item
Studio.

No existing criterion is weakened. No contract definition changes — `review.list`
and `reviewSummary` are used exactly as already specified.

## Completed evidence

Recorded in `../verification-ledger.md` under the Reviews-surface section, with the
negative controls run against each new assertion.
