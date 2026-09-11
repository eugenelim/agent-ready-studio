# Amended baseline approval

- **Date:** 2026-09-11
- **Gate:** `docs/CONVENTIONS.md` § "No new shipped acceptance debt" — the
  amended fingerprint receives human approval
- **Approver:** scope owner
- **Disposition:** Approved

## What was approved

The spec, plan and protocol contract as they stand after amendments 0002, 0003
and 0004, whose digests are recorded in `../approval-baseline.sha256` and verify
against the current bytes.

The earlier `human-clean-confirmation.md` closed the `new-spec` review against a
baseline that no longer exists, and said so. This record supersedes it for the
question of whether the amended documents are approved.

The three amendments this approval covers:

- **0002** — AC-50 added. Reviews rendered Home's inbox; it now renders the
  complete review list grouped by lifecycle status.
- **0003** — AC-51 added. Overview and Strategy carried static description
  sentences that read as content while holding none; both now read the
  workspace's real work.
- **0004** — AC-14 and AC-40 amended and the `home.get` contract narrowed. Home's
  Running group could never be populated, because execution in this slice is a
  single atomic transaction. The substantive content of this approval is the
  owner accepting that deferral rather than building observable execution now.

## What it does not cover

- Nothing is committed at the time of this approval. It approves the artifacts,
  not a merge.

## Closing

The owner directed the plan to `Done` on 2026-09-11, freezing the directory
beside the `Shipped` spec. `../approval-baseline.sha256` was re-pinned at that
point for the single status token; `spec.md` and the protocol contract are
byte-identical to the approved bytes.

## State at approval

`lint=0 typecheck=0 test=0 build=0 verify=0` — 24 test files, 166 tests — plus
`pnpm visual-evidence` exit 0 over 36 captures and 48 assertions, and
`node tools/criterion-trace.mjs` exit 0 with all 51 criteria traced. Verified by
`shasum -a 256 -c ../approval-baseline.sha256`, all three OK.
