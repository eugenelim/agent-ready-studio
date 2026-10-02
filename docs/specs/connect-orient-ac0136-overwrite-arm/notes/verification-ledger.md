# Verification ledger: AC-0136's overwrite arm

This ledger records execution evidence for the delivery unit. The Connect and
Orient ledger stays contemporaneous and gets forward corrections only.

## Pre-approval grounding — 2026-10-01

- Repository state: `HEAD` is `62be16c`, the PR #25 merge. The base-freshness
  check against `origin/main` reported `ok`.
- Acceptance baseline: the checker reports 157 rows, 100 met, 53 not met and 4
  not verifiable here, with every citation resolving.
- Host: git 2.50.1 (Apple Git-155). The root volume and the system temporary
  directory are APFS and case-insensitive (a file `a` is reachable as `A`).
- HFS+ volume: `hdiutil create -size 8m -fs HFS+` and
  `hdiutil attach -nobrowse -mountpoint <dir>` succeed without privileges.
  The mount takes about 1.7 seconds. `diskutil info` reports
  `File System Personality: HFS+`, and a file created as `.gi<U+200C>t` is
  reachable as `.git` there.
- Measurement method: a scratch script that mirrors `materialize` — the same
  thirteen pins, `/usr/bin/git`, `LANG=C`, `GIT_CONFIG_GLOBAL=/dev/null`,
  `GIT_CONFIG_SYSTEM=/dev/null`, `GIT_CONFIG_NOSYSTEM=1`, and
  `init` → `fetch --depth=1 --no-tags` → `checkout --detach --force FETCH_HEAD`
  → `rev-parse --verify HEAD`.

### HFS+, `.gi<U+200C>t` variant

| Planted shape | Vector | Result |
| --- | --- | --- |
| `.gi<U+200C>t/config` | full pins | fetch refused, `hasDotgit: contains '.git'`; `.git` intact |
| `.gi<U+200C>t/config` | fsck omitted | checkout refused, `invalid path '.gi<U+200C>t/config'`; `.git` intact |
| `.gi<U+200C>t/config` | fsck omitted, `core.protectHFS=false` ambient, product pin present | checkout refused, `invalid path`; `.git` intact |
| `.gi<U+200C>t/config` | fsck and `core.protectHFS` omitted, `core.protectHFS=false` ambient | completes; real `.git/config` holds the planted bytes |
| `.gi<U+200C>t/config` | fsck and `core.protectHFS` omitted, no ambient setting | checkout refused, `invalid path`; git's default |
| `.gi<U+200C>t/HEAD` | fsck and `core.protectHFS` omitted, `core.protectHFS=false` ambient | checkout fails at `update_ref`; real `.git/HEAD` holds the planted bytes |
| `.gi<U+200C>t` blob | fsck and `core.protectHFS` omitted, `core.protectHFS=false` ambient | checkout fails, `Not a directory`; real `.git` is gone |

The blob shape, which is the existing fixture's default, destroys `.git` rather
than replacing a file inside it. That is why the HFS+ proofs plant
`.gi<U+200C>t/config`, and why the existing blob-shaped layer 3 must never run
on the volume.

### `.GIT` variant

| Filesystem | Planted shape | Vector | Result |
| --- | --- | --- | --- |
| HFS+ | `.GIT`, `.GIT/HEAD`, `.GIT/config` | full pins | fetch refused, `hasDotgit` |
| HFS+ | same three | fsck omitted | checkout refused, `invalid path '.GIT…'` |
| HFS+ | same three | fsck, `core.protectHFS`, `core.protectNTFS` omitted, both protect settings `false` ambient | checkout refused, `invalid path '.GIT…'`; `.git` intact |
| APFS | `.GIT/config` | same all-guards-out vector | checkout refused, `invalid path '.GIT/config'`; `.git` intact |
| APFS | `.GIT/config` | both protect settings `false`, checkout without `--force` | refused earlier, by git's untracked-file check (`would be overwritten by checkout: .GIT/config`) |

### APFS, `.gi<U+200C>t` variant

Both protect settings false: the entry checks out as a sibling of `.git`, and
`.git` stays intact. This matches the 2026-09-30 layer 3 record.

## Owner decisions — 2026-10-01

1. Keep AC-0136's wording. Prove the Unicode arm on a scratch HFS+ image the
   test mounts.
2. Record the `.GIT` arm as protected by git's own path check, so the row can
   close at `S` with that limit stated.
3. Move `core.protectHFS=true` from constant-only to behavioral in the pin
   inventory.

## Pre-execute review — 2026-10-01

Run `e7369613-3ad7-4cd8-87cd-5d39ce4a0a80`, five adversarial rounds, each
adjudicated. Rounds 1 to 4 sustained a Blocker or Concern, and the spec and
plan were revised from the sustained findings only. Round 1's Blocker is what
led to owner decision 3. Round 5 sustained three Nits and nothing more severe.
Their dispositions:

- `HANDOVER.md:132` open-row count — regenerated from the audit rows in T3.
- The `workspace.toml` entry comment omits the ambient `core.protectHFS=false`
  — corrected in T3.
- The Testing Strategy's "only it removed" wording for the fsck pair —
  deferred. `spec.md:117-120`.

Approvals: the spec and the plan were approved on 2026-10-01 by
`Agent-Ready Studio maintainers`.

## T1 — scratch HFS+ volume — 2026-10-01

- Red: before `test/hfs-volume.ts` existed, `hostile-fixture.test.ts` failed
  with `Cannot find module './hfs-volume.js'`.
- Green: `hostile-fixture.test.ts` 47 of 47 in 59 s. The AC-0001 case asserts
  the fold and that both `mountPoint` and `root` are gone after `dispose`.
- `hdiutil info` lists no `connect-orient-hfs` image after the run.

## T2 — AC-0136 proofs and the `core.protectHFS=true` inventory row — 2026-10-01

- Red: the AC-0004 stub failed typecheck with
  `Cannot find name 'expectRealDotGitIntact'` while the helper was still scoped
  inside the Unicode describe.
- Green: `absence-proofs.test.ts`, `pinned-git-configuration-proof.test.ts` and
  `hostile-fixture.test.ts` together, 131 of 131. A verbose filtered run shows
  every new case executed rather than skipped: the five HFS+ cases, the `.GIT`
  all-guards-out case on the system temporary directory, and the
  `'core.protectHFS=true'` inventory row (6.1 s, which includes its own mount).
- Test-vector mutation: adding `core.protectHFS` to the HFS+ checkout-refusal
  case's `omitPinPrefix` turns that case red with
  `promise resolved "undefined" instead of rejecting`. Restored, green.
- Product mutation: deleting `"core.protectHFS=true"` from
  `PINNED_GIT_CONFIGURATION` in `git-driver.ts` turns the same HFS+
  checkout-refusal case red, with the same message. The fetch-layer case stays
  green (it is `transfer.fsckObjects`), and so does the `.GIT` case (git's own
  path check). `git-driver.ts` was restored with `git checkout`, and
  `git diff --quiet` confirms it is unchanged.

## T3 — surface sweep, citation remap, and record closure — 2026-10-01

**Sweep.** Search terms: `AC-0136`, `ac0136`, `protectHFS`, `protectNTFS`,
`constant-only`, `five behavioral`, `Five now have`, `eight`, plus the audit
preamble's moved-since-2026-09-24 sentence. These surfaces were corrected:

- `acceptance-audit.md`:
  - The AC-0136 row is now met, `S`, with anchored bindings.
  - A new "2026-10-01, AC-0136's overwrite arm" paragraph sits beside the dated
    2026-09-30 one, which is unchanged.
  - The preamble now counts six criteria since 2026-09-24: five on 2026-09-30
    and AC-0136 on 2026-10-01.
  - The Findings bullet saying an absence proof still cannot be reddened is
    removed.
  - The security-group blockquote, the pin-boundary paragraph (six behavioral,
    seven constant-only, plus the `core.protectHFS=true` row's reach) and the
    AC-0147 row's split are updated.
- `HANDOVER.md`:
  - The open-row count is regenerated from the AC-0133 to AC-0145 rows: 2 open,
    AC-0138 and AC-0145.
  - The pin count and the AC-0136 paragraph are updated.
  - A `materializationPins` citation that was already stale at the base commit
    now reads `528-541`.
- `verification-ledger.md` (Connect and Orient): a forward entry,
  `#ac0136-overwrite-arm-forward-correction-2026-10-01`, is added. Earlier
  entries are unchanged.
- `workspace.toml`:
  - A forward pointer is added beside the dated 2026-09-30 comment, which is
    otherwise unchanged.
  - The new entry's comment names the ambient `core.protectHFS=false`.
- Code comments:
  - both existing AC-0136 describes in `absence-proofs.test.ts`;
  - the `DOT_GIT_CASE_ENTRY` comment in `test/hostile-fixture.ts`;
  - the `core.protectNTFS=true` reason in `pinned-git-configuration-proof.test.ts`,
    which stays constant-only because the `.GIT` all-guards-out cases still
    refuse.

Excluded, as the plan requires: contemporaneous ledger entries, Shipped specs,
and the Connect and Orient `spec.md` and `plan.md`.

**Citation remap.** Each citation into the four edited code files was remapped
by matching the base span's first and last lines in the working tree. An
independent check then compared every remapped span's text with its base span:

- 42 base citations pair with a new one.
- 39 of those 42 spans are byte-identical to their base spans.
- Two grew because T1 added code inside the cited subject:
  `hostile-fixture.test.ts:58-226#AC-0149` and
  `hostile-fixture.ts:230-260#hostile-config`.
- Two first-pass remaps were wrong and were corrected by hand from the span's
  content:
  - `postinstall` had shrunk to `320-325`, because its closing `);` occurs
    more than once. The corrected `320-335` is byte-identical to its base span.
  - AC-0147's `#PIN_PROOFS` grew to `395-482` and swallowed
    `observeProtectHfsPin`. Its base span `391-440` had already drifted,
    starting inside `observeRedirectPin`. It now cites the `PIN_PROOFS` map,
    `464-522`.

**Anchor mutation.** Moving the start of
`absence-proofs.test.ts:991-1000#expectRealDotGitIntact` to `992` makes the
checker fail with `no longer contains expectRealDotGitIntact`. Restored, it
passes again.

**Checks** after the corrections are in the closing gate reading below.

## Closing gate reading — 2026-10-01

- `pnpm verify`: lint, typecheck and governance passed. `pnpm test` failed 3
  of 862 in 1,030 s, every failure a 60-second timeout, under a load average of
  95:
  - the HFS+ block's fetch case in `absence-proofs.test.ts`;
  - `pinned-git-configuration-proof.test.ts`'s hooks-path case;
  - `hostile-fixture.test.ts`'s dot-git-variant corpus case.
- Each of the three passes alone: 5 of 5, 1 of 1 and 1 of 1. This matches the
  registered `pre-existing-trial-runtime-load-flake`.
- `pnpm test:capped`: 859 passed, 3 skipped, 98 s. `pnpm build`: passed.
- `acceptance-audit-counts.py --check`: 157 rows, 101 met, 52 not met and 4
  not verifiable here; every citation resolves. `--self-test`: passed.
  `lint-spec-status.py --root .`: clean.
- `hdiutil info` lists no `connect-orient-hfs` image after any run.

## Post-gates review round 1 — 2026-10-01

The adversarial review was adjudicated. Five Nits were sustained and one was
refuted. All five were applied. Two of them change test behaviour, so they are
treated as Concerns and re-reviewed.

- The `core.protectHFS=true` inventory row now asserts the exact observation
  of each run: pinned `{ refused: true, configHostile: false }` and omitted
  `{ refused: false, configHostile: true }`. Asserting only that the two runs
  differ would pass on a volume that does not fold the name.
- `observeProtectHfsPin` counts a run as refused only when the error is the
  checkout refusing `<entry>/config`.
- The HANDOVER sentence and the audit's security-group blockquote now state
  the shared fsck omission and the ambient `core.protectHFS=false`. The
  blockquote also gives the `.GIT` arm to the owner decision.
- HANDOVER's `#materialize` citation now reads `570-631`.
- The citations into `pinned-git-configuration-proof.test.ts` were remapped by
  line-content matching between the pre-edit and post-edit file. Two spans grew
  because their subjects grew: the `core.protectHFS=true` case and the
  `PIN_PROOFS` map.
- The inventory suite passes, 14 of 14, and the audit checker resolves every
  citation.
- Gates after the fixes: lint, typecheck and governance pass. `pnpm test:capped` 859 passed, 3 skipped, 92 s. `pnpm build` passes. No volume is left mounted.
- Dispatch record: T3 was re-recorded with `--receipt` after `wave reopen`. T3 itself was implementer work. The round-1 fixes above were applied by the controller under FIX step 2, the small-fix path, and no implementer was dispatched for them. The tool's two decline reasons do not describe that case.

## Post-gates review round 2 — 2026-10-01

The adversarial review was adjudicated. Two Nits were sustained, none refuted,
and both were applied by the controller under FIX step 2:

- In the HFS+ `afterAll` of `absence-proofs.test.ts` and the `finally` of
  `observeProtectHfsPin`, the volume's `dispose` now runs in a nested `finally`.
  It therefore runs even when fixture removal throws.
- The HANDOVER parenthetical that called AC-0136's overwrite reach residual now
  says AC-0136 was closed on 2026-10-01.
- The citations into both edited test files were remapped by line-content
  matching. One span grew because its subject grew: the HFS+ describe, now
  `1179-1281`. The audit checker resolves every citation.
- Gates after the round-2 fixes: lint, typecheck, governance and build pass. `pnpm test:capped` 859 passed, 3 skipped, 94 s. No volume is left mounted. T3 was re-recorded with `--receipt`, on the same basis as round 1.
