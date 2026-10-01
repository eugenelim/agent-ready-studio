# Plan: Connect and Orient falsifiable criteria proofs

- **Spec:** [`spec.md`](spec.md)
- **Status:** Done
- **Repository anchors:** `docs/architecture/reference.md` for the untrusted
  source boundary; `runtime-supervisor.ts` and `runtime-child.ts` for the live
  trial and process record; `executable-identity.ts` for spawn identity;
  `test/hostile-fixture.ts`, `absence-proofs.test.ts`, and
  `pinned-git-configuration-proof.test.ts` for the current hostile proof seam;
  `source-inspection-storage.test.ts` for production refusal over real SQLite.
  The named deviation is that the current `observeProcessTree` reads a test
  probe log rather than the operating-system process tree, and direct Runtime
  starts are not all mediated by `spawnAudited`.

> **Plan contract:** this is the implementation strategy. It may change
> substantively only while its Status is `Drafting`, before approval records
> its baseline. After approval, `spec.md` and `plan.md` are pinned in substance;
> only lifecycle bookkeeping is permitted. Execution observations belong in
> `notes/verification-ledger.md`.

## Approach

First make the process record's claimed scope explicit and exhaustive over
repository-influenced starts, then replace the three direct-spawn controls with
product trials whose parent-visible evidence can fail. Next add the measured
Unicode checkout layers, a real gitlink submodule, and a credential value that
travels through production refusal over real SQLite. Finally update the audit
and ledgers from measured results, recompute citations by subject, and retain
the originating criterion's weak verdict unless both overwrite arms are proven.

## Constraints

- The existing Connect and Orient criteria and approved plan stay unchanged.
  Its known-false Testing Strategy sentence stays unchanged.
- Production guards are not weakened to make a proof pass. A control changes
  only its named guard or introduces the prohibited behavior in test scope.
- The execution inventory distinguishes Service-owned infrastructure and
  parent observation from any start whose executable identity, arguments, or
  command text can name materialized repository code.
- Git and SQLite proofs are local and offline. No case uses a credential,
  provider, remote repository, or non-loopback service.
- Connect and Orient criterion 0141 retains both fetch and traversal. The submodule corpus includes a
  real gitlink rather than treating `.gitmodules` text as recursion.
- Connect and Orient criterion 0147 stays separately registered and is not closed by this plan.
- Existing ledger prose is immutable. Corrections are new dated entries.
- Review artifacts are local-only under `.context/reviews/<fresh-run-id>/` and
  survive resumptions until closeout. This spec's verification ledger becomes
  the stable post-closeout evidence owner.

## Construction tests

**Integration tests:** focused Vitest suites run the real trial Runtime,
`/usr/bin/git`, hostile local repositories, and the production source
inspection adapter over a temporary SQLite database. Cross-cutting mutation
checks introduce one prohibited worktree execution, submodule operation, or
credential sink at a time and require the corresponding proof to redden.

**Manual verification:** none.

## Durable-output map

| Durable output | Tasks | Implementation evidence | Closeout evidence |
| --- | --- | --- | --- |
| Execution proof suites | T1 | Product trial records, inventory coverage, and execution mutations | Focused suites, full gates, and clean security review |
| Checkout and traversal proof suites | T2 | Unicode layer matrix and real-gitlink mutation results | Focused suites, full gates, and clean security review |
| Credential data-flow proof | T3 | Production refusal, real SQLite, diagnostic capture, and sink mutation | Focused storage suite, full gates, and clean security review |
| Connect and Orient audit and forward ledger | T4 | Audit checker plus widest-span anchor mutation | Checker self-test and final resolved citations |
| Delivery verification ledger | T1-T4 | Recorded probes, red/green, mutation, gate, and review receipts | Completion evidence resolves AC-0001 through AC-0009 |

## Design (LLD)

### Design decisions

Owned by: T1-T3.

- `spawnAudit` is exhaustive only for the closed repository-influenced class,
  not for every process the Service starts. A construction inventory owns that
  boundary and fails when a new start is not classified.
- Execution origin includes direct executable identity plus interpreter and
  shell operands. Checking `entry.executable` alone would miss
  `node <worktree-script>` and equivalent payloads.
- The Unicode proof records three measured layers: transfer refusal, checkout
  refusal, and materialized sibling under controlled pin removal. It does not
  infer an overwrite from a refusal.
- The submodule proof uses `.gitmodules` plus a real gitlink and observes fetch
  and traversal separately.
- The credential proof plants a unique test value in the submitted URL and
  checks the production refusal result, captured diagnostics, and real store
  rather than a repository file the path never reads.

### Interfaces & contracts

Owned by: T1-T3.

No public interface or `contracts/` change applies. Test-owned seams may extend
the existing trial options or record only when needed to make a production
observation reachable; any production-behavior change requires owner approval.
Traces to AC-0001 through AC-0008.

### Data & schema

Owned by: T2, T3.

No persistent schema changes apply. Temporary Git object databases,
materialized worktrees, submodule administrative state, and SQLite databases
are disposed after each case. Traces to AC-0005 through AC-0008.

### Failure, edge cases & resilience

Owned by: T1-T4.

- Process evidence rejects path-prefix lookalikes and resolves operands before
  worktree containment checks.
- Git assertions use stable result classes and filesystem state, not complete
  platform-specific diagnostic prose.
- A nondiscriminating control cannot upgrade an audit row.
- Real-process host-load failures are judged only by the two documented signs:
  a varying failing set and the affected case passing alone.
- Audit citations are recomputed from their current subjects after all fixture
  edits; no line-offset remap is reused. Traces to AC-0001 through AC-0009.

### Quality attributes (NFRs)

Owned by: T1-T4.

The proof suite stays offline, uses fixed local fixtures, leaves no retained
credential or repository state, and records enough evidence to resume a fresh
full-mode run. Traces to AC-0009.

## Tasks

### T1: Repository-controlled execution fails at the product's parent-visible surface

**Depends on:** none

**Touches:** `apps/studio-service/src/trials/connect-and-orient-runtime/executable-identity.ts`, `apps/studio-service/src/trials/connect-and-orient-runtime/runtime-supervisor.ts`, `apps/studio-service/src/trials/connect-and-orient-runtime/runtime-child.ts`, `apps/studio-service/src/trials/connect-and-orient-runtime/absence-proofs.test.ts`, Runtime construction tests

**Tests:**

- **TDD, AC-0001:** inventory every `node:child_process` start in Runtime
  production `.ts` modules, excluding only `*.test.ts` and the `test/` fixture
  subtree, and require a classification; add an unclassified production start
  in a controlled mutation and require the inventory to fail. Test-owned
  fixture and control starts are outside the product-evidence set and cannot
  satisfy an execution proof.
- **TDD, AC-0002 and AC-0003:** run the package-script and projected-skill
  fixtures through `startTrialInspection`; inspect the settled record for
  executable and operand origins, then enable each planted program through a
  test-only Runtime mutation and require the same assertion to fail.
- **TDD, AC-0004:** run the attribute-filter fixture through the same product
  trial; assert no filter process or marker, then enable the planted filter for
  the product Git operation and require the parent-visible observation to fail.

**Approach:** no stub (implementation-discovered). The callable trial seam is
`startTrialInspection`, but the smallest exhaustive descendant observation is
not yet grounded. Discovery must choose an existing record or OS/Git trace that
is emitted by the parent-visible product path, covers transient Git children,
and does not convert test-owned probe logging into a product claim. The required
outcome and verification mode are the three paired TDD mutations above.

**Done when:** the construction inventory rejects an added unclassified start,
all three product trials are green with their guards present, and each paired
execution mutation reddens its own assertion.

### T2: Unicode checkout and real-gitlink proofs cover every filesystem arm

**Depends on:** T1

**Touches:** `apps/studio-service/src/trials/connect-and-orient-runtime/test/hostile-fixture.ts`, `apps/studio-service/src/trials/connect-and-orient-runtime/test/hostile-fixture.test.ts`, `apps/studio-service/src/trials/connect-and-orient-runtime/pinned-git-configuration-proof.test.ts`, `apps/studio-service/src/trials/connect-and-orient-runtime/absence-proofs.test.ts`

**Tests:**

- **TDD, AC-0005:** plant `.gi<U+200C>t` in the source object database and
  compare product-shaped runs with both pins, transfer fsck omitted, and both
  transfer fsck and HFS protection omitted. Assert the real `.git/HEAD`
  remains intact in the materializing control.
- **TDD, AC-0006 and AC-0007:** build a local child commit, write a mode-160000
  gitlink and matching `.gitmodules`, and run the product trial. Assert no
  submodule command, no populated child content, and no `.git/modules` state;
  introduce a test-only submodule-update vector with command-local permission
  for the fixture's local transport, and require both fetch and traversal
  observations to fail. The production vector and closed Runtime environment
  remain unchanged.
- Re-run every hostile-fixture consumer whose subject span or setup changes.

**Approach:** no stub (implementation-discovered). The Unicode object-writing
seam exists in `addDotGitVariantToObjectDatabase`; implementation must
generalize it without inventing a second materialization path. The submodule
control stays offline by allowing `file` only on the test-owned mutation's
command vector; it cannot change the product environment, transport allowlist,
or ordinary materialization vector. These discovery predicates are resolved by
the paired real-Git TDD results.

**Done when:** the Unicode three-layer matrix and both real-gitlink observations
are green, their controlled mutations are red, and all hostile-fixture
consumers pass.

### T3: Embedded credentials reach production refusal and no named sink

**Depends on:** none

**Touches:** `apps/studio-service/src/source-inspection-storage.test.ts`

**Tests:**

- **TDD, AC-0008:** submit an embedded-credential URL to
  `createSourceInspections` composed with `createStorageStore(openStorage())`;
  assert `url-rejected`, zero connected-source rows, and absence of the unique
  credential value from returned diagnostics and captured standard error.
- Reopen the database and assert the same zero-row and no-value result from the
  durable store.
- Inject the unique value once into a diagnostic and once into a persisted
  inspection in controlled mutations; require the shared sink assertion to
  fail in both cases.

```ts
it("rejects an embedded credential without copying its value to a sink", () => {
  const credentialValue = "credential-proof-value";
  const submitted = new URL(
    buildFetchUrl({ owner: "acme", repository: "widgets" }),
  );
  submitted.username = "user";
  submitted.password = credentialValue;
  const path = databasePath();
  const first = deps(clean, path);
  const stderr = vi
    .spyOn(process.stderr, "write")
    .mockImplementation(() => true);
  const refused = createSourceInspections(first.dependencies).connect(
    submitted.toString(),
  );
  const mutatedDiagnostic = `${refused.diagnostics} ${credentialValue}`;
  const sinks = [
    mutatedDiagnostic,
    JSON.stringify(first.storage.listConnectedSources()),
    stderr.mock.calls.flat().join(" "),
  ];

  expect(refused.phase).toBe("url-rejected");
  expect(sinks.every((sink) => !sink.includes(credentialValue))).toBe(true);
});
```

The PLAN stub is deliberately red because `mutatedDiagnostic` plants the
prohibited value in the same sink collection the finished proof checks. The
green test substitutes the production refusal diagnostic, reopens the database,
and runs the two explicit diagnostic and persistence mutation controls.

**Done when:** the unchanged production refusal passes against a reopened real
database and each diagnostic or persistence mutation reddens the sink check.

### T4: The security record states only the measured proof boundary

**Depends on:** T1-T3

**Touches:** `docs/specs/connect-and-orient/notes/acceptance-audit.md`, `docs/specs/connect-and-orient/notes/verification-ledger.md`, `docs/specs/connect-orient-falsifiable-criteria-proofs/notes/verification-ledger.md`, `workspace.toml`

**Tests:**

- **Goal-based, AC-0009:** update only Connect and Orient criteria 0134, 0135,
  0136, 0137, 0141, and 0146 from measured results, with anchored citations computed
  from the final tree.
- Run the acceptance-audit checker, its self-test, and spec-status lint.
- Identify the most common anchor token over the widest changed met-row span,
  mutate that token so citation validation fails, restore it, and record both
  outcomes.
- Run the finite gates in documented order, `pnpm verify`, and the documented
  capped test reading. Classify a host-load red only from both documented signs.

**Done when:** all six rows resolve and make no stronger claim than the proof
matrix, both ledgers contain forward evidence, the legacy backlog slug is
replaced by this spec registration without changing the criterion-0147 entry, and all
AC-0009 checks pass.

## Rollout

This is a proof-and-evidence change with no public contract, migration,
feature flag, infrastructure, or deployment sequence. If a test-owned seam is
needed, reverting it and its proofs restores the prior state without changing
the shipped product behavior.

## Risks

- A sampled process tree can miss a short-lived filter process; the selected
  parent-visible surface must cover transient descendants before the audit is
  called exhaustive.
- Interpreter starts can hide repository code in arguments while the absolute
  executable remains outside the worktree.
- Git Unicode path behavior differs by filesystem and platform; the proof must
  record refusal layer and filesystem state without generalizing beyond the
  measured host-independent Git result.
- A local gitlink control can accidentally reach a remote or stay
  nondiscriminating if protocol policy refuses it before the intended
  observation; local transport is permitted only on the test-owned prohibited
  operation vector.
- Editing `hostile-fixture.ts` moves audit spans; offset-based remapping can
  produce a clean-looking false citation.
- Real-process tests can show the registered host-load flake; isolated green
  cases plus a green capped run distinguish it from a defect.

## Changelog

- 2026-09-29: spec approved by `Agent-Ready Studio maintainers`.
- 2026-09-29: plan approved by `Agent-Ready Studio maintainers`.
- 2026-09-30: implementation complete; seven post-gates review rounds, every warranted reviewer clean.
