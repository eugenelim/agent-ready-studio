# Plan: AC-0136's overwrite arm

- **Spec:** [`spec.md`](spec.md)
- **Status:** Done
- **Repository anchors:** `docs/architecture/reference.md` for the untrusted
  source boundary; `git-driver.ts:16-30` for `PINNED_GIT_CONFIGURATION`;
  `test/hostile-fixture.ts` (`buildHostileFixture`, `materialize`,
  `materializationPins`, `addDotGitVariantToObjectDatabase`) for the
  product-shaped checkout seam; the two AC-0136 blocks in
  `absence-proofs.test.ts` for the existing layers and `ambientPins` precedent;
  `acceptance-audit-citation-anchors` for the met-row anchor rule. The one new
  shape is a test-owned disk-image helper; no existing test mounts a volume, so
  it has no in-repository precedent.

> **Plan contract:** this is the implementation strategy. It may change
> substantively only while its Status is `Drafting`, before approval records its
> baseline. After approval, `spec.md` and `plan.md` are pinned in substance;
> only lifecycle bookkeeping is permitted. Execution observations belong in
> `notes/verification-ledger.md`.

## Approach

First give the suite a scratch HFS+ volume and let the hostile fixture build on
it, planting the `.git` variant as a directory holding `config`. Then add the
AC-0136 proofs on that volume and the `.GIT` all-guards-out run on both
filesystems, and give the pin inventory its `core.protectHFS=true` observation.
Finally close the audit row and correct every surface that states
AC-0136 as open, from one mechanical sweep, and recompute moved citations by
subject.

## Constraints

- The product pin list and production Git behavior do not change. Only test
  code and records change.
- The volume is a 16 MB image under `mkdtempSync(tmpdir())`, attached with
  `-nobrowse` and no privileges, and detached with a `-force` retry before its
  directory is removed.
- On macOS the HFS+ cases never skip. Elsewhere they are skipped, because
  `hdiutil` exists only on macOS.
- The Connect and Orient acceptance criteria, its Testing Strategy, and its
  approved plan stay unchanged. Ledger text gets forward corrections only.
- Review artifacts stay local under `.context/reviews/<run-id>/`. The new
  verification ledger is the stable evidence owner after closeout.

## Construction tests

**Integration tests:** real `/usr/bin/git` processes materialize temporary
local repositories through `materialize`, on the system temporary directory
and on the mounted HFS+ volume.

**Manual verification:** none. The proof is automated end to end.

## Durable-output map

| Durable output | Tasks | Implementation evidence | Closeout evidence |
| --- | --- | --- | --- |
| Behavioral proof suite | T1, T2 | Focused Vitest results; the guard-removed overwrite | Full gates and clean review |
| Connect and Orient acceptance audit | T3 | Audit checker and an anchor mutation | Checker self-test and resolved citations |
| Connect and Orient forward correction | T3 | New dated ledger entry | Review confirms earlier entries untouched |
| Delivery verification ledger | T1-T3 | Measurements, red/green, gate and review receipts | Completion evidence resolves AC-0001 to AC-0008 |

## Design (LLD)

### Design decisions

Owned by: T1, T2.

- `mountHfsVolume()` in `test/hfs-volume.ts` returns `{ root, mountPoint,
  dispose }`, where `root` is the temporary directory holding the image and the
  mount point.
  It cleans up after itself if `create` or `attach` fails, so a failed mount
  leaves nothing behind. `foldsToDotGit(directory)` writes a probe file named
  `DOT_GIT_UNICODE_ENTRY` and reports whether `.git` resolves beside it.
- `buildHostileFixture` gains `parentDirectory` (where the fixture root is
  created; default `tmpdir()`) and `dotGitVariantChild` (when set, the variant
  entry is a tree holding that one file). Both default to today's behaviour,
  so every existing case is unchanged.
- `expectRealDotGitIntact` moves to module scope, so both AC-0136 blocks and
  the HFS+ block share one detector. It gains a `config` check, because
  `config` is the file the overwrite replaces.
- The HFS+ block mounts one volume in `beforeAll` and disposes it in `afterAll`.
  The module's existing `afterEach` already removes fixture roots.
- The pin inventory's `core.protectHFS=true` entry becomes behavioral with an
  `observeProtectHfsPin` that mounts its own volume, materializes the
  `.gi<U+200C>t/config` fixture twice with `transfer.fsckObjects` omitted and
  `core.protectHFS=false` ambient in both runs, adds `core.protectHFS` to the
  omission for the second run only, and returns `{ refused, configHostile }` for each. `PinProof`
  gains an optional `platform: "darwin"`, and the behavioral `it.each` skips a
  row whose platform is not the host's. Owner decision 2026-10-01.

### Interfaces & contracts

Owned by: T1, T2.

No public interface changes. The new surface is test-owned:
`mountHfsVolume`, `foldsToDotGit`, two optional fixture options, and the
optional `PinProof.platform`. No `contracts/` artifact applies. Traces to
AC-0001 to AC-0005 and AC-0008.

### Data & schema

Owned by: T1.

No persistent schema changes. The image, mount point and fixture roots are
removed after the suite. Traces to AC-0001.

### Failure, edge cases & resilience

Owned by: T1, T2.

- A busy volume refuses a plain detach. `dispose` retries with `-force` and
  removes the directory either way.
- The fold probe runs before any proof. If it fails, the volume does not fold
  the variant, and the proofs on it would prove nothing.
- Git's diagnostic text is matched only on the stable tokens `hasDotgit` and
  `invalid path '<entry>/config'`. Traces to AC-0001 to AC-0005.

### Quality attributes (NFRs)

Owned by: T2.

The mount adds about 2 seconds once per file, inside the existing 60-second
hook timeout. Tests run offline under the fixture's existing `LANG=C`
environment. Traces to AC-0007.

## Tasks

### T1: A scratch HFS+ volume the hostile fixture can build on

**Depends on:** none

**Touches:** `apps/studio-service/src/trials/connect-and-orient-runtime/test/hfs-volume.ts` (new), `apps/studio-service/src/trials/connect-and-orient-runtime/test/hostile-fixture.ts`, `apps/studio-service/src/trials/connect-and-orient-runtime/test/hostile-fixture.test.ts`

**Tests:**

- **TDD, AC-0001:** the stub below goes red because `./hfs-volume.js` does not
  exist yet. It goes green once the helper mounts a real image. Then check
  cleanup: after `dispose`, neither `mountPoint` nor `root`, which holds the
  image, exists.
- **TDD:** a `dotGitVariantChild: "config"` fixture records a tree entry at
  `HEAD:<entry>/config` in the source object database, and leaves the
  existing blob cases unchanged.

```ts
describe.skipIf(process.platform !== "darwin")("scratch HFS+ volume", () => {
  it("folds the zero-width non-joiner spelling to .git and cleans up", () => {
    const volume = mountHfsVolume();
    try {
      expect(foldsToDotGit(volume.mountPoint)).toBe(true);
    } finally {
      volume.dispose();
    }
    expect(existsSync(volume.mountPoint)).toBe(false);
    expect(existsSync(volume.root)).toBe(false);
  });
});
```

**Done when:** the unchanged stub is green, the cleanup and fixture-shape
assertions are green, and `hostile-fixture.test.ts` passes.

### T2: AC-0136's overwrite is observed and refused on HFS+

**Depends on:** T1

**Touches:** `apps/studio-service/src/trials/connect-and-orient-runtime/absence-proofs.test.ts`, `apps/studio-service/src/trials/connect-and-orient-runtime/pinned-git-configuration-proof.test.ts`

**Tests:**

- **TDD, AC-0002 to AC-0004:** the stub below goes red because
  `expectRealDotGitIntact` is still scoped inside the Unicode describe and has
  no `config` check. It goes green once the helper is at module scope with
  that check and the guard-removed run overwrites `.git/config`. Then add the
  guard-present runs: the full pins are refused at fetch, and with the fsck pin
  removed and `core.protectHFS=false` ambient, checkout is refused by the
  product pin. Both leave the real `.git` intact. The inventory row's
  `observation` string names the shared `transfer.fsckObjects` omission and the
  ambient `core.protectHFS=false`.
- **TDD, AC-0005:** `.GIT/config`, with fsck, `core.protectHFS` and
  `core.protectNTFS` out of force and both protect settings false ambiently,
  is refused with `invalid path '.GIT/config'`. The real `.git` stays intact,
  once on `tmpdir()` and once on the volume.
- Re-run both existing AC-0136 blocks, which now use the shared detector with
  its `config` check.
- **TDD, AC-0008:** with the entry switched to behavioral and no `observe`
  yet, the inventory's "classifies every current pin exactly once" case goes
  red. Adding `observeProtectHfsPin` turns it green, and its `it.each` row
  shows the pinned and omitted observations differ. Update the constant-only
  list to the seven remaining settings and delete the `core.protectHFS=true`
  reason.

```ts
it("overwrites the real .git/config once core.protectHFS is out of force too", async () => {
  const fixture = await buildHostileFixture({
    caseId: "dot-git-variant",
    dotGitVariantEntry: DOT_GIT_UNICODE_ENTRY,
    dotGitVariantChild: "config",
    parentDirectory: volume.mountPoint,
    omitPinPrefix: ["transfer.fsckObjects", "core.protectHFS"],
    ambientPins: ["core.protectHFS=false"],
  });

  await materialize(fixture);

  expect(readFileSync(join(fixture.worktree, ".git", "config"), "utf8")).toBe(
    "hostile-config\n",
  );
  expect(() => expectRealDotGitIntact(fixture.worktree)).toThrow();
});
```

**Done when:** every AC-0002 to AC-0005 case is green on this host; adding
`core.protectHFS` to AC-0003's `omitPinPrefix`, which with its ambient
`core.protectHFS=false` yields AC-0004's exact vector, turns that case red on
its refusal expectation, because `materialize` then resolves; AC-0004's
`toThrow()` case is the evidence that the intact detector fails on an
overwritten worktree; and the inventory suite is green with six behavioral pins.

### T3: The record closes AC-0136 and states its reach

**Depends on:** T1, T2

**Touches:** `docs/specs/connect-and-orient/notes/acceptance-audit.md`, `docs/specs/connect-and-orient/notes/verification-ledger.md`, `docs/specs/connect-and-orient/notes/HANDOVER.md`, `docs/specs/connect-orient-ac0136-overwrite-arm/notes/verification-ledger.md`, `workspace.toml`, the AC-0136 and `core.protectHFS` comments in `test/hostile-fixture.ts`, `absence-proofs.test.ts` and `pinned-git-configuration-proof.test.ts`

**Tests:**

- **Goal-based, AC-0006 and AC-0008:** derive the surface set with one search
  for `AC-0136`, `ac0136`, `protectHFS`, `protectNTFS`, `constant-only` and
  the five/eight pin split (`five behavioral`, `eight`, `Five now have`), plus
  the audit preamble's count of criteria moved since 2026-09-24, across
  the tree, excluding contemporaneous ledger entries, Shipped specs, and the
  Connect and Orient `spec.md` and `plan.md`, whose criteria and approved plan
  stay unchanged; the audit, not the checkbox, carries AC-0136's verdict. Correct
  in one action every hit that states AC-0136 open or weak, states
  `core.protectHFS=true` constant-only, or says no run omits `core.protectHFS`
  or `core.protectNTFS` — including the `core.protectNTFS=true` reason in
  `pinned-git-configuration-proof.test.ts` and the `DOT_GIT_CASE_ENTRY` comment
  in `test/hostile-fixture.ts`.
- **Goal-based, citation recompute:** for every audit citation into a file this
  unit edits (`test/hostile-fixture.ts`, `test/hostile-fixture.test.ts`,
  `absence-proofs.test.ts`, `pinned-git-configuration-proof.test.ts`), read the
  cited span's first and last lines at the base commit, find each line's text
  once in the new file, and take those two line numbers as the new span. A line
  that is not found exactly once is resolved by hand from the span's content.
  Never add an offset.
- **Goal-based, AC-0007:** run
  `python3 tools/acceptance-audit-counts.py docs/specs/connect-and-orient/notes/acceptance-audit.md --check`,
  `python3 tools/acceptance-audit-counts.py --self-test`, and
  `python3 .claude/skills/work-loop/scripts/lint-spec-status.py --root .`.
- Move the new AC-0136 row's weakest anchor outside its span so the checker
  fails, restore it, and record both outcomes.

**Done when:** the checker's `--check` output matches the totals in AC-0006;
every citation resolves; the three checks pass; and the search finds no
surface T3 may edit that still calls AC-0136 open.

## Rollout

This is a proof-and-evidence change with no runtime rollout, migration, feature
flag, public contract or deployment sequence. Reverting it restores the
previous proofs and record without changing product behaviour.

## Risks

- A future macOS may drop HFS+ image creation. AC-0001 then fails loudly, and
  the owner must re-decide the arm. It must not quietly skip.
- A mount left attached by a killed run stays until reboot or a manual detach.
  Its path sits under the system temporary directory and names this suite.
- Editing `hostile-fixture.ts` and `absence-proofs.test.ts` moves about 40
  audit spans. Repairing them by offset would give clean-looking but false
  citations.
- Real-process tests can show the registered host-load flake. Isolated green
  cases plus a green capped run tell it apart from a defect.

## Changelog
- 2026-10-01: spec approved by `Agent-Ready Studio maintainers`.
- 2026-10-01: plan approved by `Agent-Ready Studio maintainers`.
