# Amendment 0001 — Review shape describes a lifecycle the engine refuses

- **Date:** 2026-09-09
- **Run:** `185c0e76-dc59-491b-95e5-fa49ad6d0c24`, mode `code`
- **Raised at:** `CODE-IMPLEMENTATION`, wave index 0 of 10, after T1 completed
  and passed every gate
- **Class:** genuine plan error, not a separable follow-on

## Scope-owner authority

The scope owner was shown the engine evidence below, the three available routes,
and their costs, and chose to amend the plan before proceeding. Recorded
2026-09-09. `state.json` pins this section as the amendment's
`owner_authority_ref`.

## The defect

The plan's `## Review shape` section states:

> Each unit is independently reviewable and leaves the repository working. Each
> closes with its own GATES, REVIEW and human gate, fired as
> `reviewers-clean --intent-incomplete`; the next unit re-enters through the
> `blocker-applied` edge.

The engine will not execute that sequence at any unit boundary except the last.

## Evidence

`gates-clean` is the only transition into `CODE-REVIEW`
(`loop-engine.py`: `("CODE-VERIFICATION", "gates-clean"): "CODE-REVIEW"`), and it
carries the `_guard_wave_check_last` guard. At the current wave index:

```text
$ loop-cohort wave check <spec-dir> --expect last
loop-cohort: stop — wave check last: not the last wave (current=0, total=10)
exit=1

$ loop-cohort wave check <spec-dir> --expect more --wave-index 0
loop-cohort: wave check more — wave_index=0 has more waves (total=10)
exit=0
```

`reviewers-clean` is reachable only from `CODE-REVIEW`
(`("CODE-REVIEW", "reviewers-clean"): "CODE-HUMAN-GATE"`), so the
`--intent-incomplete` opt-in cannot fire before the final wave either. The full
flag surface of `loop-engine transition` is `--wave-index`, `--intent-incomplete`,
`--allow-retry-cap-override`, `--owner-authority-ref`, `--reason-ref` and
`--completed-evidence-ref`; none waives the wave guard.

What Phase 1 does support: per-wave GATES via
`wave-complete` → `CODE-VERIFICATION` → `wave-passed --wave-index n` →
`CODE-IMPLEMENTATION`, paired with `loop-cohort wave advance`, repeated for each
wave; then a single `gates-clean` at the last wave, one REVIEW, and one human
gate.

## Why the pre-EXECUTE rounds did not catch it

The `## Review shape` section was added at round 7 and reviewed by all three
reviewers, who returned clean. Codex's round-7 Blocker came closest, objecting
that `--intent-incomplete` accepts only `Implementing` while the final unit must
reach `Shipped`; adjudication refuted it on that narrow status-guard point, which
was correct as far as it went. No reviewer brief asked whether the engine could
execute the described transition sequence, and no reviewer ran `wave check`. The
reviewers assessed whether the units were independently reviewable in principle,
which they are — the defect is in the mechanism the section names, not in the
decomposition itself.

## Correction

Rewrite only the lifecycle claim inside `## Review shape` so it describes what
Phase 1 executes: per-wave GATES, with the engine's review gate and human gate
firing once after the final wave, and unit boundaries retained as session,
context and PR-stack boundaries rather than engine gates.

Out of scope for this amendment: no task text, no `Depends on:` edge, no
acceptance criterion, no Testing Strategy row, and no byte of the protocol
contract changes. The five-unit decomposition itself stands.

## Completed work preserved

T1 is complete and its evidence is bound to the amendment transition. Its gate
results, the three defects found after the gates went green, and its declared
carried-forward gaps are recorded in
[`../verification-ledger.md`](../verification-ledger.md). Completed task sections
are not editable by this amendment.
