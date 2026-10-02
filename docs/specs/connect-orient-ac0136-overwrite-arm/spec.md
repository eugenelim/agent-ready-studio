# Spec: AC-0136's overwrite arm

- **Status:** Shipped
- **Owner:** Agent-Ready Studio maintainers
- **Plan:** [`plan.md`](plan.md)
- **Constrained by:** none
- **Brief:** none
- **Discovery:** none
- **Contract:** none
- **Shape:** service

> **Spec contract:** this document defines what "done" means. The implementing
> PR must match this spec, or update it. Verification must be derivable from it.
>
> **Not every section is contract.** `Agent Rules`, `Testing Strategy` and
> `Acceptance Criteria` are what a completion gate reads, and an amendment
> changes them. `Outcome`, `What Changes`, `Durable Outputs`, `Follow-ons` and
> `Assumptions` are working material: they orient a reader and an author
> corrects them in place as the work teaches, without an amendment and without
> a review round. A review finding against working material is advisory.

## Outcome

Connect and Orient's AC-0136 says a tree entry whose name is a case-insensitive
or Unicode-ignorable variant of `.git` does not overwrite the real `.git` at
checkout. Maintainers and security reviewers can see that claim fail when the
product guard is removed, and hold when it is present.

The earlier proof could not fail. It ran only on APFS, the default macOS
filesystem, which keeps `.gi<U+200C>t` as a distinct name, so the variant landed
beside `.git` and never replaced it. HFS+, the older macOS filesystem, ignores
the zero-width non-joiner (U+200C), so there the same name *is* `.git`. Measured
2026-10-01 with git 2.50.1 (Apple Git-155) through the product-shaped
`init` → `fetch` → forced detached `checkout` → `rev-parse` sequence:

| Filesystem | Entry | Product pins | `transfer.fsckObjects` out | Both `transfer.fsckObjects` and `core.protectHFS` out |
| --- | --- | --- | --- | --- |
| HFS+ | `.gi<U+200C>t/config` | refused at fetch, `hasDotgit` | refused at checkout, `invalid path` | **real `.git/config` overwritten** with the entry's bytes |
| HFS+ | `.GIT/config` | refused at fetch, `hasDotgit` | refused at checkout, `invalid path` | still refused, `invalid path`, with `core.protectNTFS` also out |
| APFS, case-insensitive | `.gi<U+200C>t` | refused at fetch | refused at checkout | written as a sibling; `.git` intact |

So the Unicode arm has a guard whose removal produces the overwrite the
criterion names: HFS protection, which the product pins with
`core.protectHFS=true`. Omitting that pin alone still refuses, because git's
Apple build turns HFS protection on by default. So every HFS+ checkout run
here sets `core.protectHFS=false` ambiently, ahead of the product pins — the
shared ambient control that also makes `protocol.version=2` observable. A
present product pin overrides it and refuses; with the pin omitted, the
ambient value stands and the overwrite appears. Measured 2026-10-01 with
`transfer.fsckObjects` out: pin present → `invalid path`; pin omitted →
`.git/config` overwritten; pin omitted with no ambient setting → still
`invalid path`, which is git's default. The `.GIT` arm has
no such guard: git refuses it whatever the product pins say. By owner decision on 2026-10-01, the `.GIT`
arm is recorded as protected by git's own path check, and its intact-`.git`
assertion is the same one the HFS+ overwrite turns red.

## What Changes

- A test-owned helper creates, mounts and removes a scratch HFS+ disk image —
  `apps/studio-service/src/trials/connect-and-orient-runtime/test/`.
- The hostile fixture can place its repositories on a given volume and plant
  the `.git` variant as a directory holding one named file —
  `test/hostile-fixture.ts`.
- AC-0136 gains the HFS+ overwrite pair and a `.GIT` run with every product
  guard out of force — `absence-proofs.test.ts`.
- `core.protectHFS=true` moves from constant-only to behavioral in the pin
  inventory, by owner decision on 2026-10-01 —
  `pinned-git-configuration-proof.test.ts`.
- AC-0136's audit row closes, and every surface that records it as open or
  weak, counts `core.protectHFS=true` as constant-only, or says no run omits
  `core.protectHFS` or `core.protectNTFS`, is corrected in one action — the Connect and Orient audit, handover and ledger,
  `workspace.toml`, and the proof comments.

## Durable Outputs

| Semantic role | Applicability | Destination | Owner | Expected evidence | Closeout condition |
| --- | --- | --- | --- | --- | --- |
| Behavioral proof | AC-0136 guards untrusted repository checkout | Connect and Orient Runtime proof suites | Studio Service maintainer | Paired guard-present and guard-removed observations on HFS+ | The guard-removed run overwrites `.git/config` and the guard-present run does not |
| Governing acceptance record | AC-0136's verdict lives in the Connect and Orient audit | `docs/specs/connect-and-orient/notes/acceptance-audit.md` | Connect and Orient maintainers | Audit checker, its self-test, anchored citations | The row is met with its reach and filesystem stated |
| Historical correction | Existing ledger entries are contemporaneous | `docs/specs/connect-and-orient/notes/verification-ledger.md` | Connect and Orient maintainers | Forward entry citing the new evidence | Earlier "cannot overwrite" claims are corrected forward, not rewritten |
| Delivery verification | Full-mode evidence must survive resumption | `docs/specs/connect-orient-ac0136-overwrite-arm/notes/verification-ledger.md` | Work-loop controller | Measurements, red/green, mutation, gates, review receipts | Closeout can resolve every criterion from stable evidence |

## Agent Rules

### Always do

- Build every materialization vector from `PINNED_GIT_CONFIGURATION`, and
  remove only the pins a control names.
- State the filesystem beside every recorded checkout result.
- Recompute every edited audit citation from the current subject span, and use
  a `file:line#symbol` anchor for every citation in a met row.
- Detach the scratch volume and delete its image whether the tests pass or
  fail.

### Ask first

- Ask before running `hdiutil` with any privilege, or before mounting anything
  outside a test-owned temporary directory.
- Ask before changing an acceptance criterion or Testing Strategy text in the
  Connect and Orient spec.
- Ask before adding another backlog item or production behavior to this unit.

### Never do

- Never change `PINNED_GIT_CONFIGURATION` or weaken a production guard to make
  a proof pass.
- Never let the HFS+ cases skip on macOS. A volume that cannot be created or
  that does not fold `.gi<U+200C>t` to `.git` fails the suite.
- Never modify `contracts/`, `docs/specs/product-development-walking-skeleton/`,
  the Connect and Orient Testing Strategy line at `spec.md:437`, or the
  dependency-build decisions in `pnpm-workspace.yaml`.
- Never rewrite a contemporaneous ledger entry; correct it forward with a
  pointer.

## Testing Strategy

- **TDD, real-process integration on a scratch HFS+ volume (AC-0001, AC-0002,
  AC-0003, AC-0004):** a real `/usr/bin/git` materializes local hostile
  fixtures on a mounted HFS+ image. Each guard has a run with it present and a
  run with only it removed, observed on the real `.git` directory.
- **TDD, real-process integration on two filesystems (AC-0005):** the `.GIT`
  arm runs with every product guard out of force on the system temporary
  directory and on the HFS+ volume.
- **TDD, real-process integration (AC-0008):** the pin inventory's
  `core.protectHFS=true` observation compares a pinned run with a run that
  omits only that pin under an ambient `core.protectHFS=false`, on a scratch
  HFS+ volume.
- **Goal-based check (AC-0006, AC-0007):** the audit checker, its self-test and
  the spec-status lint pass after citations are recomputed, and a mutation of
  the new anchor makes the checker fail.

## Acceptance Criteria

- [x] **AC-0001.** On macOS, a test creates and mounts a scratch HFS+ disk image
  inside a test-owned temporary directory, without elevated privileges, and
  proves that a file created there as `.gi<U+200C>t` is reachable as `.git`.
  Failure to create, mount or fold fails the test rather than skipping it.
  After `dispose`, neither the mount point nor the directory holding the image
  exists, and every caller runs `dispose` from `finally` or `afterAll`. On
  other platforms the HFS+ cases are reported as skipped.
- [x] **AC-0002.** On that volume, a fixture planting `.gi<U+200C>t/config` with
  hostile bytes, materialized with the full `PINNED_GIT_CONFIGURATION`, is
  refused during fetch with `hasDotgit`, and the real `.git` remains a
  directory whose `HEAD` and `config` carry none of those bytes.
- [x] **AC-0003.** With `transfer.fsckObjects` out of force and
  `core.protectHFS=false` set ambiently, so that only the product pin enforces
  HFS protection, the same fixture is refused at checkout with `invalid path '.gi<U+200C>t/config'`, and
  the AC-0002 intact assertion holds.
- [x] **AC-0004.** With `transfer.fsckObjects` and `core.protectHFS` out of
  force and `core.protectHFS=false` set ambiently, materialization completes,
  the real `.git/config` holds exactly the hostile bytes, and the AC-0002
  intact assertion throws on that worktree. This run differs from AC-0003's
  only in the absence of the product `core.protectHFS=true` pin.
- [x] **AC-0005.** A fixture planting `.GIT/config`, materialized with
  `transfer.fsckObjects`, `core.protectHFS` and `core.protectNTFS` out of force
  and both protect settings set false ambiently, is refused at checkout with
  `invalid path '.GIT/config'` and leaves the real `.git` intact, on the system
  temporary directory and on the HFS+ volume.
- [x] **AC-0006.** The Connect and Orient audit records AC-0136 as met and
  strongly bound. Its row cites the AC-0002 to AC-0005 proofs with anchors, and
  states the reach: HFS+ measured on macOS only, APFS writing a sibling, the
  reddening mutation being the pin omitted under an ambient
  `core.protectHFS=false` because git's default refuses when the pin alone is
  omitted, and the `.GIT` arm protected by git's own path check by owner
  decision on 2026-10-01. Every editable surface that recorded AC-0136 as open
  or weak is corrected in the same change; contemporaneous ledger entries get
  a forward correction instead, and Shipped specs and the Connect and Orient
  `spec.md` and `plan.md` are left unchanged, and the audit reads 157 rows, 101 met, 52 not met and
  4 not verifiable here.
- [x] **AC-0007.** The focused proof suites, the audit checker with `--check`,
  its `--self-test`, and the spec-status lint pass. No test added by this unit
  uses a network, a credential, a model provider or elevated privileges.
- [x] **AC-0008.** The pin inventory classifies `core.protectHFS=true` as
  behavioral. Its observation, on a scratch HFS+ volume with
  `transfer.fsckObjects` out of force and `core.protectHFS=false` set ambiently
  in both runs, differs between the pinned run (checkout refused,
  `.git/config` intact) and the run omitting only `core.protectHFS=true`
  (`.git/config` overwritten). Off macOS that inventory row is reported as
  skipped. The inventory's constant-only list, the audit's pin-boundary
  paragraph and the AC-0147 row then read six behavioral and seven
  constant-only, and the pin-boundary paragraph names this row's shared
  `transfer.fsckObjects` omission and its HFS+, macOS-only reach.

## Follow-ons

none

## Assumptions

- `hdiutil` can create and mount an HFS+ image without privileges on the
  macOS hosts that run this suite. Verified on this host on 2026-10-01; a host
  where it cannot fails AC-0001 loudly rather than passing silently.
