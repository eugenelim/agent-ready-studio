# Plan: Acceptance audit citation anchors

- **Spec:** [`spec.md`](spec.md)
- **Status:** Done
- **Repository anchors:** `tools/acceptance-audit-counts.py` owns citation
  parsing, resolution, span checks, and its executable self-test;
  `tools/governance-gate.mjs` invokes that self-test and every discovered audit;
  `docs/specs/connect-and-orient/notes/acceptance-audit.md` is the governing
  consumer. The anchored ambiguous basename that T1 closed is now reported and
  refused as `does not resolve to exactly one file`; containment is skipped for
  it by design, which is what AC-0004 requires.

> **Plan contract:** this is the implementation strategy. It may change
> substantively only while its Status is `Drafting`, before approval records its
> baseline. After approval, `spec.md` and `plan.md` are pinned in substance;
> only lifecycle bookkeeping is permitted.

## Approach

Tighten the existing checker in place, using its self-test as the executable
contract. Parse the wider anchor token without changing the bare citation form,
reject forms the checker cannot validate independently, and apply the verdict
policy while each audit row is available. Then migrate the governing audit:
split anchored multi-part bindings, anchor every met binding, path-qualify the
ambiguous met binding, and give each of the eighteen post-split citations
AC-0006 covers a replacement anchor. No cited production file changes as part of the remap.

## Constraints

- `docs/AGENTS.md` governs the acceptance-audit edit; root `AGENTS.md` governs
  the checker and gate.
- The checker stays Python-standard-library-only and retains its current CLI.
- `pnpm governance` remains the owning integrated gate. The direct self-test
  and audit-check commands remain runnable for narrow diagnosis.
- A read-only shaping probe found that a file-global unique simple token is not
  present in every met span, so the migration does not invent a universal
  file-global-uniqueness rule. Anchor quality outside the frozen set is an
  authoring judgement the review reads, not a verified obligation: the contract
  checks that a met binding is anchored (AC-0005) and that the frozen
  replacements are file-unique and mutation-proof (AC-0006, AC-0007). Choosing
  text that names the cited subject is how this task is done well; no gate can
  establish it, and this plan does not claim one does.
- The proof mutation is sized to each cited span. The spec's Testing Strategy
  states why. One span holds no file-unique token at all and takes the AC-0006
  exception; AC-0006 puts its naming in the verification ledger, which is where
  the span, its anchor, and that anchor's occurrence count are recorded.
- The work does not change the public protocol, shipped specifications, or
  dependency-build policy.

## Construction tests

**Integration tests:** `pnpm governance` runs the self-test and the migrated
audit through the same entry point used by the repository gate. `pnpm verify`
runs the finite gate set in repository order.

**Manual verification:** none. The syntax, verdict policy, resolution rule, and
drift behavior all have machine-readable outcomes.

## Durable-output map

| Durable output | Tasks | Implementation evidence | Closeout evidence |
| --- | --- | --- | --- |
| Governance rule in `tools/acceptance-audit-counts.py` | T1, T2 | Direct self-test diagnostics and `pnpm governance` | Verification ledger records both commands and their results |
| Governing audit in `docs/specs/connect-and-orient/notes/acceptance-audit.md` | T2 | Direct audit check and frozen mutation proof | Verification ledger records the post-migration counts and mutation result |
| Verification ledger | T1, T2 | Per-task results and full finite gates | Close-work reconciles AC-0001 through AC-0008 |

## Design (LLD)

### Design decisions

- Keep `#` as the anchor delimiter and take the token class, the delimiter set,
  and both refusal rules from AC-0001, which states them canonically. The point
  of the shape is that it extends the current syntax without introducing quoting
  or decoding rules, and that a citation inside a code span or a bold run is
  anchored like any other. Traces to AC-0001.
- Reject an anchored citation when its line spec has more than one part. One
  anchor cannot identify several disjoint spans, and separate citations reuse
  the existing checker without a second anchor-to-part grammar. Traces to
  AC-0002 and AC-0003.
- Use the row verdict already captured by `ROW` to enforce anchors only for
  `met` bindings. The checker does not infer load-bearing status from prose.
  Traces to AC-0005.
- Treat an ambiguous path as a finding when an anchor makes the citation
  checkable. Retain the established tolerance for bare shorthand in the two
  non-met verdict classes. Traces to AC-0004.

### Failure, edge cases & resilience

- A malformed or partial anchor must not fall back to a valid bare citation.
  Fixture prose immediately after an anchor proves where the match ends.
- A checker that marks every anchored citation stale is caught by an accepted
  anchor fixture; a checker that accepts every anchor is caught by the moved
  anchor fixture.
- A repeated filename is not evidence of a resolved file. The negative fixture
  creates two matching basenames and the positive fixture uses a unique suffix.
- Remapping is performed from current source structure. No offset arithmetic is
  reused after an audit edit because one edit can change later Markdown lines.

### Quality attributes (NFRs)

- The gate remains deterministic and offline. It reads only repository files
  and adds no dependency, network call, or subprocess to the checker.
- Diagnostics name the audit row, citation, and violated rule so an author can
  repair the binding without reproducing parser state.

## Tasks

### T1 — Citation self-tests prove every accepted and refused form

**Depends on:** none

**Touches:** `tools/acceptance-audit-counts.py`

**Mode:** TDD.

**Tests:**

- Covers AC-0001, AC-0002, AC-0003, AC-0004, and AC-0005.
- Extend `CITATION_FIXTURE` and its temporary source tree with paired cases for
  punctuation-bearing anchors, following prose, anchored multi-part refusal,
  separate single-part checks, ambiguous anchored resolution, and verdict-aware
  bare citations.
- Run `python3 tools/acceptance-audit-counts.py --self-test`; each refused case
  is matched by its own diagnostic needle and each accepted case is absent from
  the findings.

**Approach:** widen the parser's anchor group, keep the bare alternative intact,
and make row verdict available to citation validation. Report anchored
multi-part and ambiguous-file forms before containment, then perform the
existing substring containment check for one resolved span.

**Done when:** the direct self-test is green and AC-0001 through AC-0005 hold.

### T2 — The governing audit passes with checkable met bindings

**Depends on:** T1

**Touches:** `tools/acceptance-audit-counts.py`,
`docs/specs/connect-and-orient/notes/acceptance-audit.md`,
`docs/specs/acceptance-audit-citation-anchors/notes/verification-ledger.md`

**Mode:** TDD for the grammar repair, goal-based check for the migration.

**Tests:**

- Covers AC-0001, AC-0006, AC-0007, and AC-0008. T2 supersedes T1's AC-0001
  coverage for every clause `f78522b` does not satisfy — the boundary set, which
  stops the anchor at whitespace, the cell delimiter, and the citation separator
  only, and the trailing-separator refusal, whose validator
  `ANCHOR = re.compile(r"^[\w.\-=]+$")` still accepts `foo.`, `foo-`, and
  `foo=`. Closeout reconciles all of AC-0001 against this task.
- `stub: true` — grammar repair half, against `_self_test_citations` in
  `tools/acceptance-audit-counts.py`. The seam is already grounded, so this is
  the compilable red contract-surface assertion, not a discovered seam. It is
  written at the seam's indentation, eight spaces inside the
  `with tempfile.TemporaryDirectory() as raw:` body where `found` and `failures`
  are in scope, so EXECUTE materializes it unchanged:

  ```python
        # STUB: AC-0001 — an anchor inside a Markdown code span must parse.
        # Fixture row AC-0040 cites `apps/real.ts:2#b` inside backticks; no
        # other guard cites real.ts:2, so this red is attributable to that row.
        if any("real.ts:2" in problem for problem in found):
            failures.append(f"code-span anchor: real.ts:2 was reported: {found}")
  ```

  Its companion fixture row is
  ``| AC-0040 | met | S | `apps/real.ts:2#b` | an anchor inside a Markdown code span |``.
  The red is earned at `f78522b` because the committed capture `(#[^\s|;]*)?`
  takes the closing backtick into the anchor and `ANCHOR` then refuses it.
- Stub validation, run from disposable scratch on 2026-09-28 against a copy of
  the checker at `f78522b`; no repository test file was created:
  - compile pass — `py_compile` on the patched copy: clean.
  - intended red — `--self-test` exit 1, reporting
    `code-span anchor: real.ts:2 was reported` with the underlying diagnostic
    ``apps/real.ts:2#b` is not a readable anchor``, the backtick swallowed.
    The same run moved the expected-findings total from 25 to 26, which is the
    recount obligation below.
- `no stub (mode)` — audit migration half, which is the goal-based check below.
- Repair the committed anchor grammar so it implements AC-0001's boundary set
  and both of its refusal rules. The migration cannot reach AC-0008 without it:
  the verification ledger derives from the rows how many of the governing
  audit's citations sit inside code spans, and they are met-row citations. Add
  `CITATION_FIXTURE` cases as AC-0001 defines them — one per delimiter showing
  the anchor ends there, and a paired accepted and refused case for each of the
  two refusal rules, the refused half naming its own diagnostic needle.
- Re-derive `_self_test_citations`'s expected-findings total from the fixture
  rows whenever the fixtures change. Do not copy the number out of the failing
  run: that bakes in whatever the checker reported at that moment, which is the
  drift the total exists to catch.
- Run `python3 tools/acceptance-audit-counts.py
  docs/specs/connect-and-orient/notes/acceptance-audit.md --check` after each
  remap batch.
- The frozen set is the eighteen single-part citations AC-0006 defines; that
  criterion carries the derivation from the probe's sixteen bindings, and
  eighteen is the figure every count and assertion below uses. Count each
  replacement anchor in its resolved file and require
  exactly one occurrence, recording the single permitted exception and its
  occurrence count in the verification ledger.
- Run AC-0007's mutation as the spec contracts it, **one disposable copy and one
  committed-checker run per citation**. AC-0007 sizes the prefix to a single
  citation's span, and the eighteen citations share five files —
  `hostile-fixture.ts` and `absence-proofs.test.ts` carry seven each — so one
  tree cannot hold thirteen of the prefixes, and compounding them would prepend
  295 lines to `hostile-fixture.ts`, push every cited range in it wholly inside
  the mutation block, and report all eighteen stale without ever testing an
  anchor. Each run therefore prefixes exactly the one file the citation under
  test resolves to, by exactly that citation's span length plus one. Assert that
  all eighteen are reported by the anchor-containment diagnostic AC-0007 names,
  not merely that some finding appeared. Check the exception's anchor against AC-0006's extra condition as
  well: it must not occur in the block the mutation exposes. This
  check proves the former common-token false passes are gone; it does not claim
  every possible source edit moves a subject outside its span.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm governance`, `pnpm test`,
  `pnpm build`, `pnpm verify`, `pnpm test:capped`, the direct self-test, the
  direct audit check, and the spec-status lint. Record pass or fail, count, run
  time, and any host-load diagnosis in the verification ledger.

**Approach:** split every anchored multi-part binding into one citation per
span, then anchor all bare met bindings to text that identifies the cited
subject. Give each of the eighteen post-split citations AC-0006 covers a
file-unique token now expressible by the widened grammar, taking the named
exception where the span holds no file-unique token. Two of those parts carry no
occurrence of their pre-split anchor at all — `git-driver.ts:86` and
`hostile-fixture.ts:136-155` — so each needs an anchor chosen afresh rather than
carried over. Qualify the `index.test.ts` path cited
by Connect and Orient criterion 0043.
Recompute each changed range from the current subject boundary.

**Done when:** the direct audit check and mutation proof are green, the finite
gate set has completed, and AC-0006 through AC-0008 hold.

## Rollout

The governance gate adopts the stricter behavior as soon as the checker and
audit land together. There is no compatibility window because the same change
migrates the only governing audit that contains the newly refused forms.

## Risks

- The audit edit is mechanically wide. A missed bare met binding is a loud gate
  failure. A weak subject marker is not: once an anchor is file-unique the
  span-sized mutation reports it stale whatever it names, so anchor quality
  outside the frozen set rests on authoring and review, not on the proof.
- Citation edits can make later Markdown line references stale. The audit is
  checked after each batch and all spans are located by subject, never offset.
- Trial-runtime tests can fail under host load. A varying failing set whose
  cases pass alone is recorded as the registered load flake; a capped green run
  is supporting evidence, not a replacement for the finite gate set.

## Changelog

Oldest first. Every entry after the first is dated 2026-09-28, so order is the
only signal of sequence and it runs one way.

- 2026-09-27: Draft scaffold created from the registered backlog obligation.
- 2026-09-28: Draft contract and plan written after owner confirmation of the
  met-row anchor policy, multi-part refusal, and service shape.
- 2026-09-28: spec approved by `@eugenelim`.
- 2026-09-28: plan approved by `@eugenelim`.
- 2026-09-28: contract amended under the owner ruling recorded in
  `notes/verification-ledger.md`. AC-0006 gains a named no-file-unique-token
  exception and AC-0007 moves from a fixed ten-line prefix to a span-sized one,
  because a ten-line prefix cannot reach a span longer than ten lines. T1 is
  unchanged and its evidence is preserved.
- 2026-09-28: the controlled amendment returned `spec.md` to `Draft` and
  `plan.md` to `Drafting`; both pass through the approval gates again before
  T2 executes. Task T1 stays complete at commit `f78522b`.
- 2026-09-28: sustained round-2 review concerns applied — the subject-bearing
  promise narrowed to an authoring judgement, AC-0006's occurrence count bound
  to the checker's substring rule, and the span-sizing rationale reduced to one
  canonical statement in the spec's Testing Strategy.
- 2026-09-28: sustained round-3 review findings applied — the anchor grammar
  repair given an owning seam in T2, AC-0001's boundary set enumerated, and the
  frozen set's eighteen single-part citations reconciled against its sixteen
  bindings.
- 2026-09-28: sustained round-4 review findings applied — AC-0001's boundaries
  given an explicit character set that keeps underscore inside the anchor,
  AC-0006 and AC-0007 restated over the eighteen post-split citations, the
  durable-output map row extended to T2, and T2 recorded as superseding T1's
  AC-0001 boundary-set coverage. The code-span row count was listed in this
  round's fixes but the edit did not land; round 5 completed it.
- 2026-09-28: sustained round-5 review findings applied — the code-span row
  count corrected to four, AC-0001 reduced to one terminator rule, the
  Repository anchors deviation restated as closed by T1, the
  sixteen-to-eighteen derivation left canonical in AC-0006 and cited from the
  plan, the AC-0001 design decision brought up to date, and this Changelog put
  in one direction.
- 2026-09-28: sustained round-6 review findings applied — both Approach
  sentences sized over the eighteen post-split citations and the two parts
  needing a fresh anchor named, T2's partial delimiter list replaced by its
  AC-0001 reference, the AC-0001 design decision reduced to a citation, the
  Bindings-column referent named in AC-0001, and the self-test pairing
  requirement scoped to the rules where refusal is a defined outcome.
- 2026-09-28: sustained round-7 review findings applied — T2's TDD half given
  its `stub: true` red assertion and the migration half `no stub (mode)`,
  Testing Strategy's mutation scoped to the eighteen, the AC-0001 supersession
  widened to the trailing-separator refusal, the exception's naming left to the
  ledger, and the Changelog re-ordered. Under the owner ruling of 2026-09-28,
  AC-0006 gains the condition that the non-unique exception's anchor must not
  occur in the window the mutation exposes, and AC-0007 pins that mutation's
  prefix text and insertion point.
- 2026-09-28: sustained round-8 review findings applied — AC-0007's pass
  condition pinned to the anchor-containment diagnostic by name, AC-0006's
  window stated as the block the mutation actually exposes, T2's mutation run
  through the committed checker on a disposable tree, the stub rewritten so its
  red is attributable to its own fixture row and written at the seam's
  indentation with its compile and red results recorded, T2's fixture
  obligation restated as AC-0001 defines it, the expected-findings recount made
  explicit, the ambiguous-shorthand Assumption brought up to `f78522b`, the
  code-span figures left to the ledger, and the Changelog rebuilt in one
  ascending order.
- 2026-09-28: sustained round-9 review finding applied — T2's mutation restated
  as one disposable copy and one checker run per citation, because the eighteen
  citations share five files and a single tree would either be unrunnable or
  compound the prefixes into a false green.
- 2026-09-28: sustained round-10 review finding applied — the Changelog put in
  strict oldest-first order and the order asserted programmatically. The same
  defect was sustained in rounds 5, 7 and 8 and reintroduced each time, because
  every fix inserted the new entry by prefixing an existing one, which pushes it
  above what it follows. Entries are appended from here.
- 2026-09-28: amended spec approved by `@eugenelim` at the spec gate, with
  AC-0001's explicit terminator set, its underscore clause, and its new
  trailing-separator refusal accepted alongside the AC-0006 and AC-0007
  changes the owner ruling covered.
- 2026-09-28: amended plan approved by `@eugenelim` at the plan gate. T2 stays
  one task owning the grammar repair, the audit migration, the per-citation
  mutation proof, and the ledger; the reviewer's proposed split at the
  checker/audit seam was refuted twice and the owner accepted that reading.
- 2026-09-28: T2 implemented. Three post-gates review rounds: round 1 sustained
  eleven findings across both reviewers, round 2 sustained eight, and round 3
  returned clean from both. One sustained advisory is deferred with its
  citation — the refused-anchor branch omits the two resolution diagnostics,
  and the adjudication ruled that fix undetermined and owner-facing.
