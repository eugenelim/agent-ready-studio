# Verification ledger — acceptance audit citation anchors

Run `f0b51038-53b8-405c-a120-3a647645c8f8`, started 2026-09-28. Base revision
`c6c45ef257a7ea2bd5bdd52916b3eaff41bc20e1`. Entries are contemporaneous. A later
correction is added as a new entry with a pointer, never by rewriting an earlier
one.

## T1 — citation self-tests prove every accepted and refused form {#t1-gates}

Commit `f78522b`, one file changed: `tools/acceptance-audit-counts.py`,
207 insertions, 59 deletions.

The checker now reports five classes it used to pass silently: a malformed or
empty anchor, a bare citation in a `met` row, an anchored citation naming more
than one span, an anchored citation whose file does not resolve to exactly one
repository file, and — unchanged — an anchor no longer inside its cited span.
The anchor token admits letters, digits, underscore, dot, hyphen and equals, and
stops at whitespace, at the Markdown cell delimiter `|`, and at the `;` that
separates two citations in one cell.

`_self_test_citations` expects 25 findings, up from 18. Each refused form has its
own diagnostic needle and each accepted form is asserted absent, so a checker
that refuses everything fails the same suite as one that accepts everything.

### T1 gate results

| Gate | Result | Detail |
| --- | --- | --- |
| `pnpm lint` | pass | biome, 131 files, 96 ms |
| `pnpm typecheck` | pass | `tsc --noEmit`, silent |
| `python3 tools/acceptance-audit-counts.py --self-test` | pass | 25 expected findings matched |
| `pnpm test` | flake | see below |
| `pnpm test:capped` | pass | 56 files, 811 passed, 3 skipped, 99.0 s |

The direct self-test ran to completion with no `TemporaryDirectory` cleanup
error, so the host limitation named in the handover did not recur.

`pnpm governance` fails at this point and is expected to: it checks the Connect
and Orient audit, which T2 has not yet migrated. Every failure it reports is an
`is not anchored` or `anchors more than one span` finding on that audit, 239 in
total. No other failure class appears.

### Trial-runtime load flake, not a defect

Two uncapped `pnpm test` runs failed with different sets. The first reported 3
failing tests across 3 files in 74.7 s; the second reported 6 failing tests
across `disposal.test.ts` and `runtime-supervisor.test.ts`. Run in isolation
both suites are green: `disposal.test.ts` 8 of 8 in 5.7 s, and
`runtime-supervisor.test.ts` 26 of 26 in 19.1 s. The capped run is green at 811
passed. Neither failing file is in this change's diff, which touches only
`tools/acceptance-audit-counts.py`. Both documented signs of the registered load
flake hold — a varying failing set, and every case passing alone.

## AC-0006 and AC-0007 are jointly unsatisfiable as approved {#ac-0006-ac-0007-infeasibility}

Found while preparing T2, on 2026-09-28, before any audit edit.

The frozen ten-line-prefix probe was reproduced in memory against the base
revision and returned exactly the sixteen surviving bindings named in the
handover, plus the separately known ambiguous `index.test.ts:663-673`.

A ten-line prefix shifts an anchor down by ten lines. The anchor therefore
leaves its cited span only when it sits within the span's last ten lines. Most
of these spans are far longer than that: `hostile-fixture.ts:441-566` is 126
lines and `absence-proofs.test.ts:386-465` is 80.

So AC-0006 (a replacement anchor occurring exactly once in its file) and AC-0007
(the ten-line mutation reports that binding stale) cannot both hold:

- Four bindings have no anchor that is both file-unique and in the last ten
  lines of the span. `hostile-fixture.ts:188-196` has no file-unique token
  anywhere in its span at all; `absence-proofs.test.ts:234-259`, `:261-312` and
  `:386-465` have file-unique tokens, but every one sits in the span head.
- Four more qualify only through tail tokens — `unobserved.log`,
  `caseId.replace`, `relativePath.toLowerCase`, `entry` — that name no subject,
  which contradicts the plan's own instruction to use subject-bearing anchors.

The ten-line figure was an artifact of the shaping probe, not a property of the
bindings. The spec's own Assumptions compound this by describing all sixteen as
bindings whose "subject moves", which is true of only three of them.

## Owner ruling on the AC-0006 and AC-0007 conflict {#owner-ruling-2026-09-28}

Decided by the spec owner on 2026-09-28, in response to the evidence above.

Size the proof mutation to each cited span instead of fixing it at ten lines. A
prefix longer than the span moves a file-unique anchor out of that span for
certain, so every one of the sixteen reports stale while its anchor stays
subject-bearing. This is strictly stronger than the ten-line version, which
cannot reach a span longer than ten lines.

One binding keeps an exception. `hostile-fixture.ts:188-196` contains no
file-unique token, so AC-0006 cannot be met there. It takes its best
subject-bearing anchor instead, and that anchor's occurrence count is recorded
with it in the T2 entry below.

The sixteen stay defined by the frozen ten-line probe at `c6c45ef`, which is
already reproduced above. Only the mutation used to prove the replacements
changes.

This ruling is a change to approved acceptance criteria, so it is applied
through the work-loop's controlled contract amendment rather than by editing the
pinned spec in place.

## Round-2 review, and the audit migration reverted {#round-2-review}

2026-09-28. Raw report
`.context/reviews/f0b51038-53b8-405c-a120-3a647645c8f8/2-pre-execute-adversarial-reviewer-raw.md`,
adjudication at the paired `-adjudication.md`. Nine findings: three sustained as
concerns, five refuted, one indeterminate.

The three sustained concerns are applied in the spec and plan. The promise of
subject-bearing anchors everywhere is now stated as an authoring judgement the
review reads, because no gate can establish it. AC-0006's occurrence count is
bound to the checker's own substring matching, so AC-0006 and AC-0007 are read
against one semantics. The span-sizing rationale now has one canonical statement,
in the spec's Testing Strategy.

The indeterminate was a sequencing fault of this session's, not a defect in the
contract. T2's migration of
`docs/specs/connect-and-orient/notes/acceptance-audit.md` had been written while
the engine sat at `SPEC-PLAN-REVIEW`, so the artifact the plan was being approved
to change was moving during its own review. The owner chose to revert rather than
record a deviation. The audit is back at its base content, `sha1
fa8468fa88080e113623464fc7ab5ec6092b598c`, and T2 re-runs after `plan-locked`.

Nothing was lost by reverting: the migration is produced by a deterministic
generator from the base file, and the evidence it produced before the revert is
restated here so the re-run can be compared against it. That run anchored every
one of the 95 met rows' citations, split the three anchored multi-part bindings
at AC-0009, AC-0011 and AC-0149, qualified `index.test.ts` to
`apps/desktop/src/main/index.test.ts`, and left the verdict counts untouched at
95 met, 58 not met and 4 not verifiable here across 157 rows. The span-sized
mutation proof checked all eighteen frozen parts and reported eighteen stale with
none surviving. Twenty-six citations still failed, all of one class: the checker's
anchor token does not stop at a Markdown backtick, so an anchor written inside a
code span such as `guarded-parse.ts:193-202#parseGuardedJson` swallows the closing
backtick and is reported unreadable. Five rows of the audit write citations that
way. That is a gap in the T1 grammar, not a fault in the audit, and it is repaired
in the checker under AC-0001, which already requires the anchor to stop before
following Markdown. It is the same class as the `;` stop T1 already carries.

## Forward correction: the frozen set is sixteen bindings and eighteen citations {#frozen-set-count}

2026-09-28, after round 3. This corrects nothing in the entries above; it
explains a figure they left unexplained.

The c6c45ef ten-line probe left sixteen anchored bindings green. Two of those
bindings cite more than one span — `git-driver.ts:16-34,86` under Connect and
Orient criterion 0009, and `hostile-fixture.ts:19-68,136-155` under criterion
0149. The migration splits every anchored multi-part binding into one citation
per span, so those sixteen bindings become eighteen single-part citations.

Both figures are correct and they count different things. The
`Round-2 review, and the audit migration reverted` entry says the proof checked
"eighteen frozen parts": those are the eighteen post-split citations, and
eighteen is the figure the plan's T2 now uses for every count and assertion.
Sixteen remains the number of bindings the probe found.

The separately known ambiguous citation, `index.test.ts:663-673` under criterion
0043, is not one of the sixteen. The probe could not resolve it to a single file,
so it never entered the surviving set; it is handled by path-qualification
instead.

## Forward correction: four rows write citations inside code spans, not five {#code-span-row-count}

2026-09-28, after round 4. The `Round-2 review, and the audit migration
reverted` entry above says "Five rows of the audit write citations that way".
That figure is wrong and is corrected here rather than in place.

Parsing the governing audit at its base content, exactly four criterion rows
write a citation inside a code span:

| Criterion | Verdict | Citations in code spans |
| --- | --- | ---: |
| AC-0045 | met | 1 |
| AC-0055 | **not met** | 1 |
| AC-0056 | met | 14 |
| AC-0057 | met | 11 |

That is 27 citations, 26 of them in met rows, which is exactly the 26 failures
the reverted run reported. Two further in-code-span citations sit at lines 76
and 294 in prose and a blockquote; the checker only scans lines beginning
`| AC-`, so it never reaches them, and they are not rows.

The five came from a line-counting search that swept in those two prose lines
and was not derived from the rows. That is the same hand-written-total drift
`tools/acceptance-audit-counts.py` was written to stop, which is why the count
is now generated from the rows and shown above with its working.

## Forward correction: the base audit fails in three classes, not two {#base-audit-failure-classes}

2026-09-28, after round 6. The T1 entry above says every `pnpm governance`
failure on the base audit is `is not anchored` or `anchors more than one span`,
and that "No other failure class appears". The total of 239 is right; the
breakdown is not. Running the committed checker at `f78522b` against the base
audit gives:

| Class | Count |
| --- | ---: |
| `is not anchored` | 235 |
| `anchors more than one span` | 3 |
| `does not resolve to exactly one file` | 1 |
| **Total** | **239** |

The third class is the anchored ambiguous `index.test.ts:663-673` binding in the
met AC-0043 row, which T1 taught the checker to refuse. Omitting it also
contradicted the plan's Repository anchors, which records that refusal as
working.

The two-class claim was repeated from a task summary rather than derived by
running the checker and grouping its output. The table above is generated that
way, which is the rule the rest of this work already follows.

## Owner ruling: the exception's anchor carries an extra condition {#exception-anchor-condition}

Decided by the spec owner on 2026-09-28, after round 7 showed AC-0007 was not
true as written for the single AC-0006 exception.

AC-0007's mutation prepends one line more than the cited span is long. That
shifts the file down, so the cited line range then shows the block that used to
sit immediately above the span. For `hostile-fixture.ts:188-196` — span length 9,
prefix 10 — the range shows original lines 178 to 186.

A file-unique anchor is stale by construction: its one occurrence moves below the
cited range. The exception's anchor is not file-unique, so staleness depended on
where its other occurrences happened to fall. Checked against that window, lines
178 to 186 contain `write`, `source` and `STUDIO_PROBE_LOG`, each of which would
have survived the mutation; `projected-skill-executable` does not appear there
and is reported stale. The anchor already chosen was correct, but by luck rather
than by rule.

The owner chose to condition the anchor rather than carve the exception out of
AC-0007 or blunt the mutation for all eighteen. AC-0006 now requires the
exception's anchor to be absent from that window, and AC-0007 pins the prefix's
text and insertion point so the proof reproduces. The anchor in use satisfies the
new condition, so no anchor changes.

## AC-0007's proof runs, per citation, through the committed checker {#ac-0007-proof-runnable}

2026-09-28, after round 9. Round 9 found that T2's mutation step, as written one
round earlier, pinned a single disposable tree. AC-0007 sizes the prefix to one
citation's span, and the eighteen citations share five files —
`hostile-fixture.ts` and `absence-proofs.test.ts` carry seven each — so one tree
could hold at most five of the eighteen prefixes. Compounding them instead would
prepend 295 lines to `hostile-fixture.ts`, push every cited range in that file
wholly inside the mutation block, and report all eighteen stale without testing a
single anchor. That is a false green, and it would have hidden exactly the window
condition the owner's second ruling added.

The step now reads one disposable copy and one checker run per citation. That
shape was run before the contract locked, to show it is executable rather than
merely well-worded. Each run writes the single file the citation resolves to, at
its real repository-relative path, under a fresh temporary root, prefixed by that
citation's span length plus one lines of `// mutation`, alongside a cut-down
audit holding only that citation's row; then it calls the committed
`check_citations` against that root. The repository is neither copied nor
mutated.

Result: **18 citations checked, 18 caught**, each by the anchor-containment
diagnostic AC-0007 names rather than by the blank-or-bracket start-line rule. The
count matches the frozen set exactly, so the run cannot be an empty pass.

## T2 — the governing audit passes with checkable met bindings {#t2}

2026-09-28. Two files changed: `tools/acceptance-audit-counts.py` (the AC-0001
grammar repair and its fixtures) and
`docs/specs/connect-and-orient/notes/acceptance-audit.md` (the migration).

### Grammar repair

The anchor capture now ends at the fourteen delimiters AC-0001 names —
`(#[^\s|;`*,(){}\[\]<>]*)?` — and `ANCHOR` is
`^[\w.\-=]+(?<![.\-=])$`, which refuses a token ending in a dot, hyphen or
equals. Underscore is deliberately absent from the delimiter set: six anchors in
the governing audit, three of them inside the frozen eighteen, would otherwise
truncate at the first `_` and pass containment against the wrong text.

Twelve fixture rows were added, AC-0040 through AC-0051: one per delimiter
showing the anchor ends there, and the trailing-separator refusal. The expected
findings total moved from 25 to 26, derived from the rows rather than read off a
failing run — the eleven delimiter rows contribute no finding each, because they
are accepted cases, and AC-0051 contributes exactly one. Checked per row.

### Migration

| Measure | Base | Migrated |
| --- | ---: | ---: |
| Rows | 157 | 157 |
| Verdicts (met / not met / not verifiable here) | 95 / 58 / 4 | 95 / 58 / 4 |
| Citations | 404 | 452 |
| Anchored | 44 | 327 |
| Bare | 360 | 125 |
| Bare in a `met` row | 235 | 0 |

Citations rise by 48 because an anchored multi-part binding becomes one citation
per span. Verdicts and row count are untouched; only citation text changed.

### AC-0006 and AC-0007

Eighteen frozen citations. Seventeen carry a file-unique anchor. The single
permitted exception is `hostile-fixture.ts:188-196#projected-skill-executable`,
whose anchor occurs 6 times in its resolved file and is clear of the block the
mutation exposes, as AC-0006 requires. All eighteen are clear of that block.

AC-0007's proof ran as the contract states it, one disposable copy and one
committed-checker run per citation: **18 checked, 18 caught by the
anchor-containment diagnostic**, none by the blank-or-bracket start-line rule.
The count matches the frozen set, so the run cannot be an empty pass.

### Gates

| Gate | Result | Detail |
| --- | --- | --- |
| `pnpm lint` | pass | biome, 131 files, 0.12–0.15 s |
| `pnpm typecheck` | pass | `tsc --noEmit`, 2.8 s |
| `pnpm governance` | pass | all 6 checks, 11.1 s |
| `pnpm build` | pass | 0.6 s |
| `pnpm test:capped` | pass | 56 files, 811 passed, 3 skipped, 103.3 s |
| `--self-test` | pass | 26 expected findings |
| audit `--check` | pass | 157 rows, 95/58/4, every citation resolves |
| `lint-spec-status.py` | pass | spec metadata clean, 2 of 3 specs changed |
| `pnpm test` | load flake | see below |
| `pnpm verify` | load flake | one run fully green at 811 passed, one red with 2 |

Both registered signs of the trial-runtime load flake hold, and neither failing
file is in this change's diff. The failing set varies: one uncapped run reported
only `runtime-supervisor.test.ts` AC-0025; the next added
`App.test.tsx` AC-42; one `pnpm verify` run reported none at all. Each failing
case passes alone — `runtime-supervisor.test.ts` 26 of 26 in 19.9 s and
`App.test.tsx` 19 of 19 in 2.9 s. The capped run is green at 811 passed.

### Degradation: T2 was run by the controller, not an implementer subagent

Two implementer dispatches failed on this task without writing anything. The
first exceeded a 32,000 output-token ceiling during exploration; the second
stalled with no progress for 600 seconds. Both were verified to have left the
tree untouched — the audit stayed at its base `sha1`
`fa8468fa88080e113623464fc7ab5ec6092b598c` and the checker at its step-1 state.
A third dispatch, narrowed to the grammar repair alone and given explicit output
discipline, completed and is the step-1 work above. The migration was then run
by the controller with a deterministic generator, as the cohort's dispatch note
permits when an implementer is unavailable.

## Forward correction and repairs after the post-gates review {#post-gates-round-1}

2026-09-28. The T2 entry above stays as written; this section corrects it and
records the repairs the first post-gates review round required. Raw reports and
adjudications are under
`.context/reviews/f0b51038-53b8-405c-a120-3a647645c8f8/1-post-gates-*`.

### Corrections to the T2 entry

The T2 entry writes the capture pattern in a single-backtick span, but the
pattern contains a backtick of its own, so the span closes early and the
delimiter set renders as broken prose. The entry is contemporaneous and is not
rewritten; the pattern reads, in full:

```text
(#[^\s|;`*,(){}\[\]<>]*)?
```

The T2 entry says "six anchors in the governing audit, three of them inside the
frozen eighteen, would otherwise truncate at the first `_`". Counted from the
migrated audit's rows, the figure is **29 citations carrying 26 distinct
underscore-bearing anchors**, and every one of them would truncate. Three of them
are inside the frozen eighteen, which is the only part of the original sentence
that held. The six was written by hand rather than generated, which is the drift
this ledger already carries two corrections for.

That entry also says the twelve rows AC-0040 through AC-0051 are "one per
delimiter". They supply eleven delimiters. Whitespace rests on the pre-existing
row AC-0027 and the citation separator on AC-0031, and the cell delimiter had no
row at all until this round added one.

### Repairs

Two defects in the grammar repair, both reported by review and both reproduced
before repair:

**A comma after a mid-spec anchor dropped the continuation silently.** AC-0001
ends the anchor at a comma, which created a second spelling of the anchored
multi-part form AC-0002 refuses: `file.ts:99#tail,98` parsed as span `99` and
`,98` reached no check, while `file.ts:99,98#tail` was correctly refused. A
truncated line spec is now reported. Fixture row AC-0042 previously asserted the
silence and now asserts the finding.

**A refused anchor suppressed the checks that need no anchor.** The `continue`
after `is not a readable anchor` skipped the bounds and stale-start checks, so
`file.ts:999#tail.` never reported that line 999 is past the end. Those checks
now run first, matching the multi-part branch that already did so.

Six fixture rows were added: AC-0052 puts an anchor against the cell delimiter,
AC-0053 and AC-0054 exercise the underscore clause, AC-0055 and AC-0056 cover the
hyphen and equals halves of the trailing-separator refusal, and AC-0057 pairs a
refused anchor with an out-of-bounds line. The expected-findings total is **31**,
composed from the rows: 25 pre-existing, plus AC-0042, AC-0051, AC-0055 and
AC-0056 drawing one each, plus AC-0057 drawing two.

AC-0055 and AC-0056 were adjudicated as optional depth below the contract line —
AC-0001 requires only one paired case per refusal rule, which AC-0051 supplies.
They were added anyway because the surviving mutant they kill is in the
silent-wrong-anchor class this unit exists to end, and the cost is two rows and
no behaviour change.

### Mutation coverage of the checker

Thirteen mutations of the checker's rules were run against the self-test, each
applied to a disposable copy: dropping each delimiter group from the capture
class including the cell delimiter and the underscore case, weakening `ANCHOR`'s
trailing-separator refusal two ways, disabling the truncation report, disabling
the bounds check on a refused anchor, and disabling the met-anchor, multi-part
and ambiguous-resolution rules. **13 of 13 were killed.** Before this round, the
cell-delimiter and underscore mutants both survived.

### Span widening corrected

The migration had widened nineteen citations from a single cited line, nine of
them to exactly sixteen lines — the generator's cap. Where the cap bound, the
cited range was a fixed-size window straddling syntax rather than the subject's
boundary, which the spec's "Always do" Boundary forbids, and a sixteen-line span
is far more tolerant of the drift the anchor control exists to catch.

The generator now widens only where the cited span yields no anchor at all, or
where AC-0006 requires a file-unique anchor for a frozen citation. A repeated
anchor outside the frozen set is an authoring preference; the span is contract,
so span fidelity wins. After the change, **two** citations have a span grown from
a single line and **none** sits at the cap: `git-driver.ts:85-87`, the `gitArgs`
body, and `source-inspection.ts:685-691`, the guard block whose original line
`return {` carried no anchor candidate.

### Re-verified after the repairs

| Measure | Value |
| --- | --- |
| Rows, verdicts | 157; 95 met / 58 not met / 4 not verifiable here |
| Citations | 452; 327 anchored, 125 bare, 0 bare in a `met` row |
| Audit check | every citation resolves |
| Self-test | passes, 31 expected findings |
| Frozen set | 18 citations; 17 file-unique; all 18 clear of the exposed window |
| AC-0006 exception | `hostile-fixture.ts:188-196#projected-skill-executable`, 6 occurrences |
| AC-0007 proof | 18 checked, 18 caught by the anchor-containment diagnostic |

## Post-gates review round 2 {#post-gates-round-2}

2026-09-28. Both reviewers ran again on the revised diff. Between them they
sustained a Concern and seven advisory findings, and refuted one. Raw reports and
adjudications are under
`.context/reviews/f0b51038-53b8-405c-a120-3a647645c8f8/2-post-gates-*`.

### The truncation guard was a latent false positive

The guard added in round 1 read `^,\s*:?\d`. The `\s*` admits a space after the
comma, but `CITATION`'s line-spec group is `(\d[\d,:-]*)` and admits none, so any
tail the whitespace branch matched was by definition not a continuation. Two
consequences, both reproduced before repair: `file.ts:4#tail, 12 lines later`,
ordinary prose, was reported as a dropped span and would have failed the
governance gate on a sound citation; and that branch was the only path where the
reported token came out empty, printing `leaves '' outside the citation`, which
names nothing an author can act on.

Both reviewers found it independently. The pattern is now `^,:?\d`, which matches
only the spellings `CITATION` can produce and makes an empty token unreachable.
Fixture row AC-0058 pins comma-then-prose as green, which is what the
pre-existing AC-0019 row already establishes for the bare form.

### Comments and docstring corrected

The `CITATION` comment still described the pre-repair three-delimiter stop set,
so a reader would have concluded a backtick does not end an anchor; it now
enumerates AC-0001's fourteen and says outright that underscore is not among
them. The `check_citations` docstring declared five reported classes while six
are emitted; the comma-truncated-span refusal is now the sixth. The
`TRUNCATED_SPEC` constant had been inserted between the `STALE_START` comment and
`STALE_START` itself, leaving each comment above the wrong constant; they are
adjacent again.

### The expected-findings composition, read off the rows

| Part | Count |
| --- | ---: |
| Findings from rows predating the anchor grammar | 25 |
| Findings from the nineteen rows added for it (AC-0040…AC-0058) | 6 |
| **Total asserted** | **31** |

Five of those nineteen draw a finding — AC-0042, AC-0051, AC-0055, AC-0056 at
one each, and AC-0057 at two, because a refused anchor still gets its bounds
checked. The other fourteen are accepted forms whose whole job is to draw none.
The comment stating this had said "eighteen rows" and, before AC-0058 was added,
"fourteen" silent when thirteen was right. Both are now read off the rows rather
than written by hand, which is the fourth hand-written count this run has had to
correct.

### Mutation coverage

Thirteen mutations re-run against the self-test on disposable copies: every
delimiter group in the capture class including the cell delimiter and underscore,
two weakenings of `ANCHOR`, widening `TRUNCATED_SPEC` back to its
whitespace-admitting form, disabling the truncation report, disabling the
bounds-on-refusal repair, and disabling the met-anchor and multi-part rules.
**13 of 13 killed.** The `TRUNCATED_SPEC` mutant survived in round 1 and does not
now.

### Deferred

One sustained advisory is not repaired here. The refused-anchor branch runs the
bounds and stale-start checks but does not emit `resolves to no file` or
`does not resolve to exactly one file`, which the multi-part branch does, so a
citation that is both unreadable and unresolvable still takes two rounds to
repair. The adjudication records that the fix is not determined — reporting the
resolution classes and narrowing the branch's comment are both defensible — and
names the choice an owner decision. It is deferred with its citation,
`tools/acceptance-audit-counts.py` refused-anchor branch, rather than settled by
the implementer, because every control added unasked in this run has generated
its own defect in the next round.

### Refuted

`workspace.toml` was challenged as outside T2's `Touches`. It removes the backlog
obligation this unit closes and moves the spec into `ini-004.work.active`. The
handover this run resumed from records that state as already made and directs
preserving it, and the spec's `Ask first` boundary reaches only *other*
registered obligations. The reviewer briefs in this run had described the file as
"unrelated to this unit", which was wrong; the adjudication was given the
correction before ruling.

## Post-gates review round 3, and closeout evidence {#post-gates-round-3}

2026-09-28. Both reviewers returned the clean sentinel. `adversarial-reviewer`
and `quality-engineer` are the two the diff warrants; `security-reviewer`,
`experience-reviewer` and `frontend-reviewer` did not fire — the change crosses
no trust boundary, data flow or guarding control, ships no user-facing surface,
and produces no HTML, CSS or JavaScript.

### Review history

| Round | Raw findings | Sustained | Refuted |
| ---: | ---: | ---: | ---: |
| 1 | 17 across both reviewers | 11 | 6 |
| 2 | 9 across both reviewers | 8 | 1 |
| 3 | 0 | — | — |

Round 1 found two blockers in the migration and one in the grammar; round 2
found a latent false positive in round 1's own repair. Each round's fix was the
next round's subject, which is why the loop ran three times.

### Final gate results

| Gate | Result |
| --- | --- |
| `pnpm lint` | pass |
| `pnpm typecheck` | pass |
| `pnpm governance` | pass, all 6 checks |
| `pnpm build` | pass |
| `pnpm test:capped` | pass, 56 files, 811 passed, 3 skipped |
| `--self-test` | pass, 31 expected findings derived from the rows |
| audit `--check` | pass, 157 rows, 95 met / 58 not met / 4 not verifiable here |
| `lint-spec-status.py` | pass, spec metadata clean |
| `pnpm test` uncapped | registered load flake, see below |

`pnpm test` was run four times across this session and reported 0, 1, 2 and 5
failures, in different suites each time. Every failing suite passed in isolation
— `disposal.test.ts` 8 of 8, `runtime-supervisor.test.ts` 26 of 26,
`App.test.tsx` 19 of 19 — and no failing file appears in this change's diff,
which touches only the checker and the audit. Both registered signs of the
trial-runtime load flake therefore hold, and the capped run is green.

### Acceptance criteria

All eight hold and are checked in `spec.md`. AC-0001 is proved by thirteen
mutations of the checker's rules, all killed. AC-0006 and AC-0007 are proved by
the per-citation mutation: 18 citations checked, 18 caught by the
anchor-containment diagnostic, 17 anchors file-unique and the single permitted
exception clear of the window AC-0006 names. AC-0008 is the governance gate
itself, now green.

### Deferred, for the owner

The refused-anchor branch runs the bounds and stale-start checks but does not
emit `resolves to no file` or `does not resolve to exactly one file`, which the
multi-part branch does. A citation that is both unreadable and unresolvable
therefore still takes two repair rounds. Sustained as an advisory in round 2 and
deferred rather than repaired: the adjudication ruled the fix undetermined —
emitting the resolution classes and narrowing the branch's comment are both
defensible — and named the direction an owner decision.

### Task ownership

T1 was implemented by an `implementer` subagent. T2's grammar repair was too,
after two earlier dispatches failed without writing anything: one exceeded a
32,000 output-token ceiling, one stalled for 600 seconds. The audit migration
and the proofs were run by the controller with a deterministic generator, as the
cohort's dispatch note permits when an implementer is unavailable.
