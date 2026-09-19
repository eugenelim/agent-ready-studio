# Plan: Connect and Orient — connect and see the verdict

- **Spec:** [`spec.md`](spec.md)
- **Status:** Approved
- **Repository anchors:** `docs/architecture/reference.md`;
 `apps/desktop/src/main/index.ts` (argv-array child spawn, NDJSON transport,
 SIGTERM shutdown — the supervision precedent this plan reuses);
 `packages/protocol/src/validator.ts` with `contracts.test.ts` (the Zod-mirror
 to canonical-schema parity harness); `packages/storage-sqlite/src/storage.ts`
 (numbered migrations, reopen-a-temporary-database pattern);
 `apps/desktop/src/renderer/components/ReviewInbox.tsx` (the polite
 live-region convention). Named uncertainty: the trusted inspector is a
 repo-scope pack projection, so its availability in a packaged application is
 unproven; the honest failure mode is AC-0047.

> **Plan contract:** the implementation strategy. Substantive change only while
> `Drafting`. After approval both documents are pinned, **with one carve-out the
> *Bounded discovery channel* below defines**: the sections of tasks that channel
> names as refinable stay open to it until each task's first implementing commit,
> and every such refinement is recorded in the channel's append-only decision
> record. Everything else is pinned, and execution observations go to
> `notes/verification-ledger.md`.

> Every value this plan needs is owned by the spec's **Canonical values** and
> its two state tables. This document cites them and never restates them. The
> trial Runtime's authorization and time box live in the spec's authorization
> block; this plan does not restate them either.

## Approach

Slice 1 of two. It delivers a whole vertical — a lead pastes a URL and learns
the Agent-Ready verdict at an exact commit — while carrying every trust
boundary the brief declares non-waivable. Slice 2 takes artifact viewing, the
full projection, capabilities, shaping availability, refresh and staleness.

Build outward from the trust boundary: the hostile corpus and its positive
controls land first, as their own reviewable change. Each task lands green;
red stubs are materialized inside the task that makes them pass.

Two measurements are taken during the build rather than asserted in the
contract. T5 records the delivery host's write throughput and file-creation
rate over one 250 ms sampling interval, **against ceilings the spec fixes in
advance, so a fast host fails the bound rather than raising it.** The
file-creation measurement passed and became the tolerance the file-count bound
cites. **The throughput measurement failed its ceiling, and the tree-bytes
bound was cut rather than restated** — the quantity is a property of the host,
so any restated ceiling would go stale on the next machine. `--depth 1` bounds
history only; it bounds neither tree bytes nor file count, and a blob filter is
deliberately not used because a checkout refetches every blob at `HEAD` and
would leave the clone a promisor. The sampler is therefore the sole enforcing
control for file count. What makes that bound's measured tolerance honest is not
the sampler but the **pass bar fixed in advance** — at or below 5,000 files
written in one 250 ms interval — because a bar chosen before the measurement
cannot be moved to fit it.

## Constraints

- **RFC-0001** follow-on item 7 — sole authorization for the trial Runtime.
- **RFC-0002**; **ADR-0005**; **ADR-0006**; **ADR-0007**.
- **`docs/architecture/reference.md`** — renderer reaches the service only
 through the frozen typed preload API; the Studio Service is the single SQLite
 writer; runtime validation at every trust boundary; stdout protocol-only.
- **`AGENTS.md`** — `contracts/` changes require the protocol approval path.

### Bounded discovery channel

Exact helpers, paths, fixture shapes and local construction details of an
**unstarted** task may stand unresolved in this plan. T14 is the declared
discovery task that resolves them. The channel exists because forcing those
details to be guessed at plan time is what produces a plan that is precise and
wrong, and because a full contract amendment for a fixture shape costs a review
cycle that decides nothing.

**Discovery predicate — what the channel may touch.** A detail is in scope only
when all four hold: it is a helper, a path, a fixture shape or a local
construction detail; it belongs to a task named in *Refinable tasks* below; that
task is unstarted; and resolving it changes no acceptance criterion, no task
outcome, no dependency edge and no verification obligation. A detail failing any
conjunct is out of scope, and the channel must not resolve it.

**Refinable tasks.** T12 and T13, by name, and no others. A task not named here
is outside the channel whatever its state.

**A task section locks when execution begins.** From the first commit that
implements a task, its section is immutable to this channel. Completed sections
are immutable outright: T1 through T11 carry pinned section hashes that
`approve-plan` verifies, and the channel may not touch them, their evidence, or
`amendment_history`. The channel adds records; it removes none.

**Kill condition.** The channel is killed for a question the moment discovery
shows that resolving it would change an acceptance criterion, a task outcome, a
dependency edge or a verification obligation — or that no admissible option
satisfies a bound this contract already states. On a kill the question returns
to the owner through the controlled amendment path, and T14 records the kill
rather than choosing.

**Bounded alternatives.** For each question T14 opens, it enumerates at most
three admissible options and picks one, or it kills. It may not invent a fourth
at execution time; a question whose admissible set is not closed at the moment
of choosing is a kill.

**Decision record.** Append-only, at
`notes/verification-ledger.md#discovery-channel-t14`. One entry per question:
the question, the enumerated options, the option taken, the evidence that
decided it, and the task refined. An entry is never edited once written; a
reversal is a new entry naming the one it supersedes.

**Scoped review.** Every refinement is reviewed before it is relied on, over the
changed task section and its dependants — T13 depends on T12, so a T12
refinement reviews both. The review is scoped to what changed; it does not
reopen the contract.

### Inline proof for risky mechanisms

A mechanism has a **consequential false-pass direction** when its failure mode
is to report success wrongly: parsers, extractors, gates, negative controls,
classifiers, generated registries and machinery of that kind. A test that only
ever sees passing input cannot distinguish such a mechanism from one that
returns success unconditionally.

A task that introduces such an arm must, in the same task:

1. **Run a discriminating positive and a consequential negative case.** The
   negative is one that would matter if admitted, not a trivially malformed
   input.
2. **Demonstrate that removing or neutralising the arm reddens a named case.**
   The case is named in the evidence, so a later reader can re-run exactly it.
3. **Exercise the real entry path, not only the helper.** A helper proven in
   isolation says nothing about whether production reaches it.
4. **State the condition that retires the approach.** The circumstance under
   which the mechanism stops being the right one, so it is re-examined on a
   trigger rather than on someone noticing.

This binds the tasks unstarted when it was written — T14, T12 and T13. It is
not applied retroactively to T1 through T11, whose sections are pinned and whose
evidence is closed. Where those tasks already meet it, `#t6-evidence` and
`#t11-evidence` record the mutation proofs that show it.

## Construction tests

**Integration:** full inspection against every fixture, driving the real child
from the Studio Service; restart survival across a reopened database; a
process-boundary test asserting the child PID differs, every descendant's
environment matches name-to-value, and the service opened no materialized path.

**Manual:** one unauthenticated read-only smoke against
`https://github.com/eugenelim/agent-ready-studio`. **Its expected projection is
`version-unverified`**, because that repository's `.agentbundle-state.toml`
declares a `schema-version`; the smoke therefore exercises the honest-refusal
path against a real remote. On the two-axis model the `ok` condition is
exercised against fixtures only; the `agent-ready` verdict is exercised by both
the fixtures and the smoke, which reaches it under the `version-unverified`
qualifier. Plus the recorded gestures for the Visual / manual QA criteria.

## Durable-output map

| Durable output | Tasks | Implementation evidence | Closeout evidence |
| --- | --- | --- | --- |
| `docs/architecture/overview.md` | T13 | Overview names the connection surface and trial topology | Matches shipped component set |
| `docs/product/design-system.md` | T12 | Inspection family and the ΔE2000 separation value recorded | Distinct from the four existing families |
| `contracts/jsonschema/studio-protocol-v1.schema.json` | T8 | Parity test green for added methods | Schema and Zod mirror agree |
| Evidence note | T13 | Note exists, linked from the spec | Three criteria observed, no verdict |
| `docs/product/changelog.md` | T13 | Entry naming the capability | Present at ship |

**T8 discharges a durable output, not an acceptance criterion.** The
behaviours it transports are owned by criteria in T9 through T12.

## Design (LLD)

### Design decisions

- **The Runtime reads; the Studio Service normalizes.** Required by the brief's
 non-waivable execution-plane constraint. Traces to AC-0016.
- **The pinned `git` configuration travels on the argument vector, and
 `GIT_CONFIG_PARAMETERS` is admitted rather than scrubbed.** Traces to
 AC-0022, AC-0023. `-c` outranks every config file, and git propagates it to
 the transport helper through that variable and no other; scrubbing it would
 delete `http.followRedirects=false` from the only process that honours it.
- **The sweep domain is a per-user application directory, not the OS temp
 root.** Traces to AC-0070, AC-0072, AC-0081. A fixed name under shared temp
 is pre-plantable; a per-user directory is enumerable without that exposure,
 and each request's root is still `mkdtemp`.
- **The per-request state root owns the request; the materialization root is
 its child.** Traces to AC-0070, AC-0079, AC-0080, AC-0081, AC-0154. The
 ownership marker sits beside the tree `git` writes, not inside it, so
 repository content cannot forge ownership — a property of the layout rather
 than a defended one. Two mechanisms already in the pinned contract were
 observed holding that boundary: `transfer.fsckObjects=true` rejects a
 `..`-bearing tree at fetch, and checkout independently refuses `invalid path`.
 One removal of the state root discharges the materialization, the home and the
 temp directory together, and single-in-flight admission bounds only what the
 *Live in-flight sweep-domain occupancy* row states, which is live in-flight
 occupancy and not aggregate on-disk occupancy.
- **Bound the input, then sample.** Traces to AC-0051. `git` exposes
 no per-write hook, so `--depth 1` does the primary bounding of history and the
 250 ms sampler is the sole enforcing control for file count. A
 blob filter is deliberately **not** used: a checkout refetches every blob at
 `HEAD`, and it would leave the clone a promisor able to initiate an
 unsupervised later fetch. The advance-fixed ceiling is what makes the small
 measured tolerance honest. **No byte ceiling is enforced**: T5's measurement
 showed the former tree-bytes bound spent inside two to three samples, so it
 was cut rather than restated at a number the next host would invalidate.
- **Symlinks materialize as regular files holding their target string.** Traces
 to AC-0069. The inspector walks the tree independently and no Studio-side
 check reaches it; AC-0140 keeps the reader's own refusal proven separately so
 neither control voids the other's fixture.

### Data & schema

One migration appended to the numbered list in
`packages/storage-sqlite/src/storage.ts`. Tables carry the connected source,
its last inspection, the verdict and its diagnostics, and provenance markers.
Requested ref and resolved SHA are separate columns.

### Interfaces & contracts

The desktop-facing half extends the public protocol in the Zod mirror, the
fixtures and the canonical schema with `x-studio.methodResults` entries and the
backward `x-spec` pointer. The northbound half is the trial contract, private
to the trial code root, one-shot NDJSON over stdio.

### Component / module decomposition

Trial code root: child entrypoint, git driver, inspector locator,
version-marker reader, materializer, disposer, sweep, private contract —
imported by nothing outside it. `apps/studio-service/src/`: source registry,
normalization, use cases, handlers. `packages/storage-sqlite/src/`: migration
and operations. `apps/desktop/src/renderer/components/`: connect surface and
verdict surface. **Those component patterns do not exist yet** — the
directory has no `Button`, `StatusBadge`, `EmptyState` or `RevisionLink`, and
`Panel` exists only as `DecisionPanel`. Whichever this slice introduces is a
durable output of T12, listed in the durable-output map before it is consumed.

### Behavior & rules

**Interpreter resolution:** walk the search list in *Canonical values* in
order, starting each once under the pinned environment to report its version.
A non-conforming interpreter is started by the probe and no further, which is
why the permitted-executables row admits the probe explicitly.

## Tasks

### T1: The hostile corpus exists and every probe is proven non-vacuous

**Depends on:** none

**Tests:**
- Every fixture the security proofs and bounds criteria consume, built
 reproducibly with no network. A case whose effect is observed *at* checkout —
 AC-0136's `.git`-variant tree entry is the one in this slice — is built into
 the source object database before checkout, by plumbing where a working-tree
 write cannot produce it on a case-insensitive filesystem; building it on disk
 afterwards would bypass the very event its proof observes. Only a case with no
 checkout-observable effect is constructed on disk after checkout.
- A positive control per proof, at process-tree observation level for
 executable effects and at the reader for filesystem effects, each removing
 the guard of the proof it certifies. **T1 builds and certifies the controls only;
  the paired absence proofs land in T6, T10 and T11, because the guards they
  remove do not exist until T4, T6, T10 and T11.**
- Covers AC-0149.

**Red stub** (`stub: true`):

```ts
it("AC-0147 a hook probe fires when the guard is removed", async () => {
 const fx = await buildHostileFixture({ pinHooksPath: false });
 const seen = await observeProcessTree(() => materialize(fx));
 expect(seen.map((p) => p.argv0)).toContain("post-checkout");
});
```

**Approach:** corpus and probe harness under the trial code root's test scope.
The positive controls are built here; the paired absence proofs land in T6, T10
and T11 and reuse this harness, so probe identity is pinned across all of them.

**Done when:** `pnpm verify` is green and AC-0149 holds.

### T2: A submitted URL becomes a canonical identity or a named refusal

**Depends on:** none

**Tests:**
- Accept and reject tables, each rejection asserting its own reason.
- Differential strings — embedded tabs, newlines, a second `@`, backslashes,
 percent-encodings — asserted as accept-then-compare: the constructed target
 must equal the canonical identity, not the submitted string.
- Covers AC-0001, AC-0002, AC-0003, AC-0004, AC-0005, AC-0006, AC-0007, AC-0010.

**Red stub** (`stub: true`):

```ts
it("AC-0010 builds the fetch target from the canonical identity", () => {
 const out = canonicalizeSource("https://github.com/owner/repo?x=@evil");
 expect(out.ok && buildFetchUrl(out.identity)).toBe("https://github.com/owner/repo");
});
```

**Approach:** pure module in `apps/studio-service/src/`, no I/O.

**Done when:** `pnpm verify` is green and AC-0001, AC-0002, AC-0003, AC-0004, AC-0005, AC-0006, AC-0007, AC-0010 hold.

### T3: A remote ref resolves to a verified exact commit

**Depends on:** T2

**Tests:**
- Resolution yields the exact SHA AC-0011 requires; `HEAD` verified inside the
 materialization root by the Runtime; mismatch routes to its stop reason.
- The ref charset applied to the remote-reported default branch.
- Redirect refusal asserted on both phases as the presence of
 `http.followRedirects=false` on every resolution and materialization argument
 vector, with a test that fails when the key is dropped. Observing a real client
 refuse a redirect needs an HTTP exchange AC-0148 forbids, so that observation is
 T13's manual smoke, per AC-0009. This task claims no automated observation of
 client behaviour.
- Covers AC-0008, AC-0009, AC-0011, AC-0012, AC-0013, AC-0014.

**Red stub** (`stub: true`):

```ts
it("AC-0008 refuses a remote default branch outside the ref charset", async () => {
 const t = injectedTransport({ defaultBranch: "--upload-pack=/bin/sh" });
 await expect(resolveRevision(identity, t)).resolves.toMatchObject({ ok: false });
});
```

**Approach:** git driver behind an injected transport. The redirect cases assert
the argument vector the driver builds, because AC-0009's client-behaviour
observation is T13's manual smoke rather than an automated test.

**Done when:** `pnpm verify` is green and AC-0008, AC-0009, AC-0011, AC-0012, AC-0013, AC-0014 hold.

### T4: The process tree runs under a pinned vector and environment

**Depends on:** T3

**Tests:**
- Child PID differs; the service opens no materialized path.
- Every descendant's environment equals the allowlist name-to-value, asserted
 over every process Studio's own code starts. `GIT_CONFIG_PARAMETERS` on a
 helper `git` re-executes is **not** asserted here: reaching a helper needs an
 https endpoint AC-0148 forbids, so AC-0024's helper clause is T13's smoke.
- The descendant executable set is within the permitted row on two legs — the
 group sampled from the parent, and the exhaustive record of Studio's own
 spawns. The interpreter probe is observed through that record rather than by
 sampling, because one `ps` read costs longer than the probe lives. The
 `git-remote-https` helper is not reachable without a network endpoint and is
 T13's smoke.
- The Studio Service admits at most one trial inspection in flight, refusing a
 second concurrent request while one runs (AC-0154, admission limb). This is
 what the *Live in-flight sweep-domain occupancy* row rests on; that row, not
 this bullet, states what the bound covers.
- Both identity probes run under the pinned environment.
- The Studio Service signals the child's process group when the child
 terminates without a completed response (AC-0154, first trigger).
- The Studio Service signals the child's process group when the child neither
 responds nor terminates within the Service-held in-flight bound (AC-0154,
 second trigger). Distinct from AC-0029 and AC-0030, which assert that no
 descendant survives a signal the Runtime itself sends.
- Covers AC-0015, AC-0016, AC-0017, AC-0018, AC-0019, AC-0020, AC-0021, AC-0022, AC-0023, AC-0024, AC-0025, AC-0026, AC-0027, AC-0028, AC-0029, AC-0030, AC-0031, AC-0154.

**Red stub** (`stub: true`):

```ts
it("AC-0023 pins every descendant's environment", async () => {
 const out = await runTrialRuntime({ request: validRequest(), echoEnvTree: true });
 expect(out.observedEnvByPid.size).toBeGreaterThan(1);
 for (const env of out.observedEnvByPid.values()) expect(env).toEqual(expectedEnv());
});
```

**Approach:** child entrypoint, argv builder carrying the pinned configuration,
process-tree observer in the parent. Observing a live group needs a descendant
that outlives nothing else, so the Runtime starts two only when a hold is
requested through an injected option production never sets, following T3's
injected-transport precedent: a `git cat-file --batch` held by its stdin pipe,
and the resolved interpreter held by a timer. The second exists because a
pipe-held descendant dies with the Runtime, which makes "the group was
signalled" indistinguishable from "the Runtime took its pipes with it".

**Done when:** `pnpm verify` is green and AC-0015, AC-0016, AC-0017, AC-0018, AC-0019, AC-0020, AC-0021, AC-0022, AC-0023, AC-0024, AC-0025, AC-0026, AC-0027, AC-0028, AC-0029, AC-0030, AC-0031, AC-0154 hold.

### T5: Materialization is confined, measured, and disposable

**Depends on:** T4

**Tests:**
- Sweep domain verified on every use; the per-request state root is `mkdtemp`
 inside it at `0700`, the materialization root is that root's `tree` child, and
 the ownership marker is written by a single creating write, before any other
 child of the state root and removed last per AC-0080, so no repository content
 can reach it and no staging child ever exists.
- Links materialize as regular files; the reader refuses escaping paths
 including a sibling whose name extends the root, compared against the
 resolved real path per AC-0073; non-regular and oversized files refused.
- Removal refuses to descend a link at every level it traverses; one removal of
 the per-request state root takes the materialization, the per-request home and
 the per-request temp with it. The sweep removes a direct child on exactly the
 three limbs AC-0081 states, and nothing else: a parseable marker naming no
 live process; a marker that cannot be parsed **or that does not yield both a
 process identity and a start time**, older than the markerless-reclaim age;
 and no marker with no entries older than that age. A markerless child that is
 non-empty or too young is skipped, and a marker naming a live process is never
 reclaimed. **Where an input the limb under evaluation actually needs cannot be
 read or compared the sweep declines to reclaim**, and AC-0083 records that
 decline as its own explicit diagnostic — but a marker missing a start time is
 the second limb's input, not a declined liveness comparison, so the test
 asserts reclaim on its age gate rather than a decline.
- **Measurement:** four quantities over one 250 ms interval, recorded in the
 verification ledger and carried into the bounds tolerances. One carries an
 advance-fixed pass bar: file-creation rate (at or below 5,000 files). **Write
 throughput carried one too and failed it**, at 208–448 MiB per interval
 against 128 MiB, which is why the tree-bytes bound is cut rather than
 restated; the measurement is still recorded, because it is the evidence for
 that cut. Two are observations with no pass bar, because each quantifies a gap
 the spec admits rather than a property Studio designs: resident-memory growth
 per interval, which is why AC-0031 claims detection latency rather than a
 peak, and the worst-case duration of the sample itself against a tree at the
 file-count bound, which is the second term in the file-count tolerance.
- Covers AC-0069, AC-0070, AC-0071, AC-0072, AC-0073, AC-0074, AC-0075, AC-0076, AC-0077, AC-0078, AC-0079, AC-0080, AC-0081, AC-0082, AC-0083.

**Red stub** (`stub: true`):

```ts
it("AC-0069 materializes a symlink as a regular file", async () => {
 const out = await materialize(fixtureWithEscapingSymlink);
 expect(out.ok).toBe(true);
 expect(lstatSync(join(out.root, "workspace.toml")).isSymbolicLink()).toBe(false);
});
```

**Approach:** materializer, a confinement helper every reader shares, disposer
and sweep.

**Done when:** `pnpm verify` is green, the four measurements are recorded with
the one surviving pass bar met — file-creation rate at or below 5,000 files —
and the write-throughput measurement recorded as the failing evidence that cut
the tree-bytes bound rather than as a bar to be met, and
AC-0069, AC-0070, AC-0071, AC-0072, AC-0073, AC-0074, AC-0075, AC-0076, AC-0077, AC-0078, AC-0079, AC-0080, AC-0081, AC-0082, AC-0083 hold.

### T6: The inspector runs from outside the target under supervised bounds

**Depends on:** T5, T1

**Tests:**
- Inspector real path outside the root; one inside is refused to its stop
 reason; provenance recorded; interpreter version verified.
- Submodules not fetched or traversed.
- File count killed on an observed breach within the measured tolerance; the two
 wall-clock deadlines killed exactly. No byte ceiling is enforced, so none is
 tested.
- Every absence proof whose observed surface exists by this task — AC-0133 to
 AC-0137 and AC-0139 to AC-0145 — each using the probe T1's control validated.
 **AC-0138 and AC-0146 are not provable here:** AC-0138 observes a verdict, a
 routing decision and a state, which do not exist until T9 and T10, and AC-0146
 observes storage, which does not exist until T11. They are gated at T10 and
 T11 and reuse this task's harness, so probe identity stays pinned across all
 three. AC-0147 is gated at T11 for the same reason — it ranges over AC-0133
 through AC-0146, so it cannot be discharged until the last of them is.
- Covers AC-0043, AC-0044, AC-0045, AC-0046, AC-0047, AC-0048, AC-0049, AC-0051, AC-0052, AC-0053, AC-0133, AC-0134, AC-0135, AC-0136, AC-0137, AC-0139, AC-0140, AC-0141, AC-0142, AC-0143, AC-0144, AC-0145.

**Red stub** (`stub: true`):

```ts
it("AC-0051 kills materialization on an observed file-count breach", async () => {
 const out = await materialize(oversizedFixture);
 expect(out).toMatchObject({ ok: false, stopReason: "file-count" });
});
```

**Approach:** inspector locator, supervisor sampling at the stated interval.

**Done when:** `pnpm verify` is green and AC-0043, AC-0044, AC-0045, AC-0046, AC-0047, AC-0048, AC-0049, AC-0051, AC-0052, AC-0053, AC-0133, AC-0134, AC-0135, AC-0136, AC-0137, AC-0139, AC-0140, AC-0141, AC-0142, AC-0143, AC-0144, AC-0145 hold.

### T7: The version marker is read, parsed safely, and never over-read

**Depends on:** T6

**Tests:**
- Both permitted files read — `workspace.toml` and `.agentbundle-state.toml`,
 per the spec's *Permitted read surface* and the two-file bound of AC-0055;
 anything outside that surface refused.
- Depth bound enforced before recursion; prototype-mutating keys yield nothing;
 YAML tag and alias clauses asserted where applicable and declared
 inapplicable elsewhere.
- A parse failure routes to its stop reason with the right attribution,
 distinguishing a repository file from Studio-produced output.
- Covers AC-0054, AC-0055, AC-0056, AC-0057, AC-0058, AC-0059, AC-0060.

**Red stub** (`stub: true`):

```ts
it("AC-0057 yields no value under a prototype-mutating key", () => {
 const out = parseDeclared('[__proto__]\npolluted = true\n');
 expect(Object.prototype).not.toHaveProperty("polluted");
 expect(Object.getPrototypeOf(out.value)).toBeNull();
 expect(Object.prototype.hasOwnProperty.call(out.value, "__proto__")).toBe(false);
});
```

**Approach:** reader bound to the canonical surface; parsers configured per the
plan's dependency note.

**Done when:** `pnpm verify` is green and AC-0054, AC-0055, AC-0056, AC-0057, AC-0058, AC-0059, AC-0060 hold.

### T8: The public protocol carries the connection methods

**Depends on:** T7

**Tests:**
- The parity harness validates every new fixture against the Zod mirror and the
 canonical schema; a malformed params payload is refused with a JSON-RPC error.

**Red stub** (`stub: true`):

```ts
it("validates the source.connect fixture against both schemas", () => {
 expect(validateRequest(validRequestFixtures["source.connect"]).ok).toBe(true);
 expect(canonicalAjv.validate(canonicalProtocolSchema, validRequestFixtures["source.connect"])).toBe(true);
});
```

**Approach:** methods, fixtures, canonical definitions, `x-studio.methodResults`
and the backward `x-spec` pointer. **This task straddles the human
protocol-approval gate and carries nothing else.** Only T12 consumes its
methods; T9 through T11 proceed in parallel with the gate.

**Done when:** `pnpm verify` is green, parity covers every added method, and the
protocol approval is recorded.

### T9: A trial result is validated in full, and the verdict is decided

**Depends on:** T7

**Tests:**
- Contract name, Service-minted identifier, full-shape validation before
 normalization, non-conforming body refused without partial consumption,
 oversized result refused while reading.
- Provenance by origin, surviving normalization.
- Version honesty three-way, with the projection shown beneath the caveat.
- Oversized child stderr truncated head-and-tail with an elision marker, the
 inspection result unaffected (AC-0155).
- Covers AC-0032, AC-0033, AC-0034, AC-0035, AC-0036, AC-0037, AC-0038, AC-0039, AC-0040, AC-0041, AC-0042, AC-0061, AC-0062, AC-0063, AC-0064, AC-0065, AC-0066, AC-0067, AC-0068, AC-0155.

**Red stub** (`stub: true`):

```ts
it("AC-0036 refuses a well-named result whose body does not conform", () => {
 expect(normalizeTrialResult({ contract: TRIAL_CONTRACT, requestId: "r1", status: 42 }))
 .toEqual({ ok: false, stopReason: "result-invalid" });
});
```

**Approach:** contract validator and normalizer in `apps/studio-service/src/`.

**Done when:** `pnpm verify` is green and AC-0032, AC-0033, AC-0034, AC-0035, AC-0036, AC-0037, AC-0038, AC-0039, AC-0040, AC-0041, AC-0042, AC-0061, AC-0062, AC-0063, AC-0064, AC-0065, AC-0066, AC-0067, AC-0068, AC-0155 hold.

### T10: Every state is honest about itself

**Depends on:** T9

**Tests:**
- Every state in the table distinguishable, with its label and attention.
- Every terminating criterion routes to its table reason and attribution.
- The four degradation sentences per degraded state, with `inspection-stopped`
 attributed per reason rather than once.
- No attribution crosses; no credential offered anywhere.
- The AC-0138 absence proof, reusing T1's validated probe: instruction-shaped
 repository text changes no verdict, no routing decision and no state. It lands
 here because this is the first task at which all three of those surfaces
 exist.
- Covers AC-0086, AC-0087, AC-0088, AC-0089, AC-0090, AC-0091, AC-0092, AC-0093, AC-0094, AC-0095, AC-0096, AC-0097, AC-0098, AC-0099, AC-0138.

**Red stub** (`stub: true`):

```ts
it("AC-0091 attributes a stop reason per reason, not per state", () => {
 expect(project({ state: "inspection-stopped", reason: "resolution-timeout" }).attribution).toBe("network");
 expect(project({ state: "inspection-stopped", reason: "file-count" }).attribution).toBe("repository");
});
```

**Approach:** projection and degradation mapping driven from the spec's tables.

**Done when:** `pnpm verify` is green and AC-0086, AC-0087, AC-0088, AC-0089, AC-0090, AC-0091, AC-0092, AC-0093, AC-0094, AC-0095, AC-0096, AC-0097, AC-0098, AC-0099, AC-0138 hold.

### T11: The verdict survives restart and cancellation

**Depends on:** T10

**Tests:**
- Migration on a fresh and reopened database; identity, ref, SHA, verdict and
 diagnostics read back; the persisted bound covers every repository-derived
 value, not one class.
- Cancellation recorded; one process per request with no cross-request
 readability; restart leaves no prior process.
- The AC-0146 absence proof, reusing T1's validated probe: no credential-bearing
 value reaches storage or a diagnostic. It lands here because this is the first
 task at which storage exists.
- AC-0147's positive controls, verified as a set. This is the last task gating
 any of AC-0133 through AC-0146, so it is the earliest point at which AC-0147's
 range is complete; the controls themselves were built and certified at T1.
- Covers AC-0084, AC-0085, AC-0100, AC-0101, AC-0102, AC-0103, AC-0104, AC-0146, AC-0147.

**Red stub** (`stub: true`):

```ts
it("AC-0102 reads the verdict back after a reopen", async () => {
 await persistInspection(sourceId, verdictFixture);
 await reopenStore();
 expect(await readVerdict(sourceId)).toMatchObject({ state: "agent-ready" });
});
```

**Approach:** one appended migration, storage operations, cancellation use case.

**Done when:** `pnpm verify` is green and AC-0084, AC-0085, AC-0100, AC-0101, AC-0102, AC-0103, AC-0104, AC-0146, AC-0147 hold.

### T14: Renderer discovery resolves what the plan left open

**Depends on:** T11, T8

**Carries no acceptance criterion**, on the precedent T8 sets: it discharges
construction detail, not an obligation. Its number is later than its position
because identifiers are never reused; the `Depends on:` graph, not document
order, places it before T12.

**Tests:**
- Each question closes with an entry at `notes/verification-ledger.md#discovery-channel-t14`
 naming the enumerated options, the one taken and the evidence that decided it,
 or naming the kill.
- The ΔE2000 arm proves itself inline, per *Inline proof for risky mechanisms*:
 a discriminating positive (two hues whose separation is known to clear the
 bound) and a consequential negative (two hues that must fail it); a named case
 that reddens when the comparison is neutralised; and the stated condition that
 retires it. **The real-entry-path leg reads both theme blocks of `tokens.css`**
 — the root block and the `prefers-color-scheme: dark` block — because AC-0120
 binds in both themes, and an arm reading only the root block would satisfy
 every other element of the proof while observing half the hue set.
- The pinned completed-task section hashes still verify after this task runs.
 That is the observable form of leaving completed sections alone: a plan section
 owns text rather than files, so the hash is what a check can compare.

**Open questions this task exists to close**, each with its enumerated options:

1. **The ΔE2000 comparison set is only partly materialized.** No token is named
 for a family, but two artifact-state members already carry hues in both
 themes — `--color-proposal-surface`, `--color-proposal-border`,
 `--color-accepted-surface` and `--color-accepted-border` correspond to the
 *proposed* and *accepted* artifact states the design system enumerates. The
 review and execution families carry no hue at all, and the inspection family
 does not exist. So the bound is stated against a hue set that is materialized
 for one comparison family and absent for two. Options: derive representative
 hues for review and execution from the tokens already present and record the
 mapping; or kill, if no defensible mapping exists or no inspection hue clears
 the bound in both themes. **Minting product colour families is not an option
 here** — it changes a task outcome and the design-system durable output, which
 the durable-output map assigns to T12, so it exceeds the discovery predicate
 and returns to the owner through the kill condition.

 **A contract disagreement blocked this question. T14 recorded it; Package 4
 settled it.** The *Inspection-family hue separation* row named four comparison
 families including attention while AC-0120 named three, and resolving that
 would move an acceptance criterion — so T14 killed the question and returned it
 to the owner rather than choosing. The owner amended AC-0120 on 2026-09-17:
 **the comparison is four families, attention included**, authority at
 `notes/verification-ledger.md#owner-decision-2026-09-17-package-4-family-set-and-zone`.

 **The other half of the kill is still open**, and T12 owns it: no hue mapping
 exists. T14 derived none and was right not to — the design-system durable output
 enumerates four state families and records a hue for none of them, and
 `tokens.css` materializes hues for two artifact-state members only.
2. **No ΔE2000 generator exists.** Nothing in the repository computes it. The
 bound's value has exactly one home and must keep it, so the generator cites
 that home rather than restating the number. Options: a small local module
 under the desktop tools directory exercised by a test; or a test-only helper
 if no second caller appears.
3. **The capture path for the two specialist reviewers.** `frontend-reviewer`
 was probed and is dispatchable with `Read` and `Bash`, and drives named routes
 itself when captures are absent. `experience-reviewer` is **unprobed** and
 advertises no `Bash`, so it cannot self-capture and must be handed rendered
 output. `visual-evidence.mjs` reads the built renderer at
 `apps/desktop/out/renderer`, not the source, and requires a Chromium that this
 host has. Options: reuse `visual-evidence.mjs` as the capture source; or add a
 narrower capture entry if its scenario set does not reach the new surfaces.

**Kill condition:** any question whose resolution would move an acceptance
criterion, a task outcome, a dependency edge or a verification obligation
returns to the owner through the controlled amendment path, recorded as a kill.

**Approach:** answer each question against the tree, record the decision, refine
only T12 and T13.

**Done when:** every question above carries an append-only decision entry or a
recorded kill; the ΔE2000 arm carries its four inline proofs; `pnpm verify` is
green; and the pinned section hashes still verify.

### T12: A lead connects a repository and sees the verdict

**Depends on:** T14

**Tests:**
- Every state renders; the form rejects with a programmatically associated
 message and returns focus; disabled-in-flight states why and points at cancel.
- `resolving` and `inspecting` separately rendered; SHA shown and announced.
- Verdict outranks revision identity by role; every non-originated value
 literal; no non-originated value in a URL or navigation sink, including one
 Studio derived from such a value; window refuses foreign navigation.
- The verdict renders its own human label, distinct from every other verdict
 independently of hue (AC-0157), and each transition into a result produces
 exactly one polite announcement carrying the label of whichever element holds
 the primary role (AC-0158).
- Token family separation computed as ΔE2000 from the design-system tokens;
 contrast pairings including reused components on new roles; keyboard
 operability; one focus-management path; one announcement per transition.
- Covers AC-0105, AC-0106, AC-0107, AC-0108, AC-0109, AC-0110, AC-0111, AC-0112, AC-0113, AC-0115, AC-0116, AC-0117, AC-0118, AC-0119, AC-0120, AC-0121, AC-0122, AC-0123, AC-0124, AC-0125, AC-0126, AC-0127, AC-0128, AC-0157, AC-0158.

**Red stub** (`stub: true`, jsdom):

```tsx
it("AC-0106 exposes no credential input on the connect form", () => {
 render(<ConnectRepositoryForm onSubmit={() => {}} />);
 expect(screen.queryByLabelText(/token|password|credential/i)).toBeNull();
});
```

**Discovery refinements (T14).** Construction details only; each has an entry
at `notes/verification-ledger.md#discovery-channel-t14`.

- **The ΔE2000 generator is `apps/desktop/tools/delta-e2000.ts`**, built and
 proved at T14. It exports `deltaE2000`, `hexDeltaE2000`, `hexToLab` and
 `readThemeHues`, the last returning both theme blocks of a `tokens.css`
 source together. **It contains no bound.** The *Inspection-family hue
 separation* row remains the value's one home, and this task's AC-0120
 assertion is what reads it and applies it.
- **The family set is settled at four, and the hue mapping is not.** Package 4
 amended AC-0120 on 2026-09-17 so the comparison covers artifact, review,
 execution **and attention**, matching the *Inspection-family hue separation*
 row; authority at
 `notes/verification-ledger.md#owner-decision-2026-09-17-package-4-family-set-and-zone`.
 What T14's kill left open is the other half: the design-system durable output
 enumerates those four families and records **a hue for none of them**, and
 `tokens.css` materializes hues for two artifact-state members only. **T12 mints
 the family and is what makes AC-0120 measurable.**
- **The owner accepted a feasibility risk on this task, and it is recorded here
 rather than only in the ledger.** T14 measured `--color-proposal-surface`
 against `--color-accepted-surface` at **21.866** in the light theme — two
 members of the *same* family, barely clear of the bound. The palette's natural
 spacing sits at the bound, so clearing it against four families in both themes
 may prove tight or infeasible. If it does, that is evidence to revisit the bound
 through an amendment, not a T12 choice: the bound keeps its single home in the
 *Inspection-family hue separation* row.
- **Rendered evidence comes from `apps/desktop/tools/visual-evidence.mjs`**, not
 from a new capture entry. Its scenario matrix already carries `desktop-light`
 and `desktop-dark`, which is the both-themes reach AC-0120 needs; a new
 surface is one entry in its `{ name, clicks }` surface array. Two additions
 are mechanical **in construction, not in effect**: the surface entries for the
 connect and verdict surfaces, and a spec-selectable output root that
 **defaults to today's hard-coded path**.

 The root default leaves every reference to the walking-skeleton directory
 unchanged. **The surface entries do not leave its retained set unchanged**, and
 T12 must not read them as neutral. Publishing is a **whole-directory swap, not
 an append**: the tool fills a staging directory with only that run's captures
 and renames it over the retained one. So a run under the default root leaves
 that directory holding **48 freshly rendered PNGs in place of today's 36**,
 every one re-rendered and the `manifest.json` re-stamped — not twelve files
 added beside the existing ones. Under the default root that directory is a
 `Shipped` spec's notes. **Which root T12 writes each spec's captures to is T12's
 choice**; `#discovery-channel-t14` entry 3 records the effect, not the choice.

 **A third addition is stated as an obligation:** the tool derives `${root}.next`
 and `${root}.previous` staging directories, and `.gitignore` ignores those two
 paths only as spelled against today's root, so any non-default root must bring
 its own ignore entries or leave an un-ignored residue. Three triggers, because
 the block that creates and fills `${root}.next` sits outside every `try`: a hard
 interruption, a failure of that unguarded staging write, and a failure of the
 restore rename that runs after a failed publish. Any of the three lands the
 residue in front of T13's clean-tree gate.

**Approach:** preload additions, renderer hook, connect and verdict surfaces.
**The design-system edit lands first and separately** — the inspection family
and the ΔE2000 value are written and reviewed before a component consumes them.
**Frontend pre-flight runs before substantive renderer implementation.**

**Done when:** `pnpm verify` is green and AC-0105, AC-0106, AC-0107, AC-0108, AC-0109, AC-0110, AC-0111, AC-0112, AC-0113, AC-0115, AC-0116, AC-0117, AC-0118, AC-0119, AC-0120, AC-0121, AC-0122, AC-0123, AC-0124, AC-0125, AC-0126, AC-0127, AC-0128, AC-0157, AC-0158 hold.

### T13: Delivery is verified and its Stage 2 evidence recorded

**Depends on:** T12

**Tests:**
- Full `pnpm verify` and `git diff --check`; every added test passes with no
 network, credential, provider or remote service.
- **A recorded gesture and observed outcome** for each Visual / manual QA
 criterion, written to `notes/verification-ledger.md` with the build revision:
 first-scan role ordering (AC-0114), reduced-motion liveness (AC-0129),
 target size (AC-0131), reflow without two-dimensional scrolling with
 usability at 200 percent text resize (AC-0132), and narrow-window
 reachability with the focused element never obscured by the diagnostic
 surface (AC-0130). These close on that record, not on a gate. AC-0130 sits
 here rather than in the TDD accessibility group because renderer tests run
 under jsdom, which computes no geometry and so cannot observe occlusion.
- Live unauthenticated smoke, recording readability, the observed projection,
 and — as the behavioural evidence no automated test may carry — whether the
 real client refused a redirect on each of the two phases (AC-0009), the
 environment `git` hands its transport helper, with `GIT_CONFIG_PARAMETERS`
 compared as a parsed key/value set against the pinned configuration (AC-0024),
 that every executable observed in the tree during the smoke is one the
 *Permitted executables* row admits, the helper included (AC-0025), and that no
 descendant survives shutdown, the helper holding an open connection included
 (AC-0030). These four are Visual / manual QA because each needs an https
 endpoint AC-0148 forbids; T4 gates the automated legs of AC-0024, AC-0025 and
 AC-0030 and this task gates only the observations it cannot.
- Covers AC-0114, AC-0129, AC-0130, AC-0131, AC-0132, AC-0148, AC-0150, AC-0151, AC-0152, AC-0153, AC-0159, and the manual-QA observations of AC-0024, AC-0025 and AC-0030.

**Discovery refinements (T14).** Construction details only; the entry is at
`notes/verification-ledger.md#discovery-channel-t14`.

- **The two specialist reviewers are handed different things**, because their
 capabilities differ. Read from the `tools:` frontmatter of
 `~/.claude/agents/frontend-reviewer.md` and
 `~/.claude/agents/experience-reviewer.md` — **host-local files, not repository
 evidence**, so a reader on another machine cannot re-derive this from the tree.
 `frontend-reviewer` carries `Bash` and drives the named routes itself.
 `experience-reviewer` carries no `Bash` — the plan's unprobed note is
 confirmed — so it cannot self-capture and receives the PNGs
 `visual-evidence.mjs` writes, together with the grounded aesthetic reference
 its confirm-before-reviewing gate requires.
- **The capture path resolves a browser from a declared candidate list** —
 `findChromium` at `apps/desktop/tools/visual-evidence.mjs:288-308`, whose final
 fallback is the system Chrome install. **Which candidate wins is host-local and
 is not recorded as contract evidence**; `#discovery-channel-t14` entry 3 records
 why an earlier draft's Playwright-build claim was dropped rather than resolved.

**Approach:** write the evidence note from observed behaviour, including the
needed-versus-inherited classification and the statement that the no-local-path
property was mandated rather than discovered; update the overview and
changelog.

**AC-0159 rides here because its work is already done and only its verification
belongs to a task.** Package 4 added the criterion and the pinned rendering it
requires. `per-request-state-root.test.ts` carries two cases: one asserts the
contents of both rendering environments, the other forces a non-UTC zone into the
rendering process and compares the reader against an explicitly pinned rendering.
Together they fail when either side loses the pinned values, and when the
**Service-side** call site stops using the pinned set. Neither binds the
Runtime-side call site, and the forcing case needs a host whose zone database
resolves the forced zone. T13 confirms they hold at delivery rather than
re-implementing them.

**Done when:** `pnpm verify` is green, the ledger carries each recorded
gesture, the smoke result is recorded with its exact SHA and projection, and
AC-0114, AC-0129, AC-0130, AC-0131, AC-0132, AC-0148, AC-0150, AC-0151, AC-0152, AC-0153, AC-0159 hold, and the ledger records the four manual-QA transport observations — AC-0009 redirect refusal on both phases, AC-0024 helper environment, AC-0025 helper admission, AC-0030 no surviving helper — each against the build revision.

## Rollout

One change set, no flag, additive and reachable only from a new surface.
Reversible by revert; the migration is additive. No infrastructure. GitHub is
contacted only by the manual smoke and by a user action at runtime. The
migration ships with the code that reads it.

## Risks

The brief's `## Risks` owns the delivery-level risks and is not restated. This
section carries only what this plan adds.

- The Electron test that downloads a binary on a cold cache times out and
 fails; it passes warm, and is not caused by this change. AC-0148 is scoped to
 the tests this delivery adds for that reason.
- The local Node is newer than the repository pins. The native binding loads
 and the suite passes, but the pinned pairing is unverified on this runtime.
- Materializing symlinks as regular files changes what the inspector sees. A
 repository legitimately using a symlink for `workspace.toml` inspects
 differently than it reads on disk; accepted because the alternative leaves
 the inspector's traversal unprotected.
- T8's protocol approval is recorded at
 `notes/verification-ledger.md#owner-approval-2026-09-17-protocol-schema`, so it blocks
 nothing further. T14 now holds the edge to T8, and T12 depends on T14.
- One parser dependency is admitted at an untrusted-input boundary in a
 repository with no dependency scanner. The pin is exact; the gap is a
 recorded Follow-on. `yaml` was dropped from this slice for want of a caller,
 halving the exposure.

### Parser dependencies

`smol-toml` for TOML, which has no anchors, aliases or tags by construction.
`JSON.parse` is non-executing but unbounded in recursion depth and carries the
same nesting-depth check. Authorized by the scope owner on 2026-09-14;
exact-pinned and lockfile-integrity covered.

**`yaml` is deferred.** No YAML parse site exists in this slice: the permitted
read surface is two TOML files and AC-0056's enumeration is TOML and NDJSON. A
parser admitted with no caller could not be exercised by any test, and would
first be used in slice 2 already inside the manifest, without the review a new
dependency draws. It returns with the slice that first parses YAML, configured
to its core schema with custom tags disabled and its alias guard set to the
bound in *Canonical values*.

## Changelog

Approval decisions only. Review rounds, their findings, and the reasoning behind
each change are recorded in `notes/verification-ledger.md`.

- 2026-09-18: **Package 4, AC-0116 scope and liveness-token versioning.** Authority
 `notes/verification-ledger.md#owner-decision-2026-09-18-ac-0116-sink-scope-and-liveness-token-versioning`.
 AC-0116 stays over rendering and navigation sinks; whether it reaches the
 operands of a spawned transport command is open and tracked at
 `connect-orient-transport-operand-sink-scope` in `[backlog].open`. AC-0081
 gains the rule that a liveness token whose rendering convention cannot be
 established is a comparison that cannot be made, and declines.
- 2026-09-17: **Package 4.** Authority
 `notes/verification-ledger.md#owner-decision-2026-09-17-package-4-family-set-and-zone`.
 AC-0120 now compares four state families including attention, matching the
 *Inspection-family hue separation* row. `TZ=UTC` joins the *Environment
 allowlist*. AC-0159 binds both renderings of the liveness token to the same
 determinism values. Thirteen standing deferred entries are disposed.
 Criteria count 156 → 157.
- 2026-09-17: **Bounded discovery channel and inline-proof rule.** Authority
 `notes/verification-ledger.md#amendment-addendum-2026-09-17-discovery-channel-and-inline-proof`.
 T14 resolves helpers, paths and fixture shapes for T12 and T13 under a
 four-conjunct predicate and a kill condition. A mechanism whose failure mode is
 reporting success wrongly must prove itself in the task that introduces it.
 Criteria count unchanged at 156.
- 2026-09-16: **Tree-bytes bound cut; `/bin/ps` admitted.** Authority
 `notes/verification-ledger.md#amendment-2026-09-16-bound-cut-and-ps`. The
 *Materialized tree bytes* ceiling is removed and the criterion carrying it is
 retired, its number never reused. `/bin/ps` joins *Permitted executables* so
 the Runtime can read a process start time the platform exposes no other way.
 Criteria count 157 → 156.
- 2026-09-15: **Per-request state ownership; test network surface cut.**
 Authority
 `notes/verification-ledger.md#owner-decision-2026-09-15-per-request-state-ownership`
 and `#owner-decision-2026-09-15-cut-test-network-surface`. The per-request
 state root owns the request and the materialization root becomes its `tree`
 child, placing the ownership marker outside every path repository content
 reaches. AC-0070, AC-0079, AC-0080, AC-0081 and AC-0154 are restated.
 AC-0024's helper environment, AC-0025's transport-helper leg and AC-0030's
 transport-helper instance move to T13's manual smoke. Four *Resource bounds*
 rows are completed. Criteria count unchanged at 157.
- 2026-09-15: **AC-0009 restated against `git`'s own refusal.** Taken from
 `CODE-IMPLEMENTATION` after T3 proved the criterion unfalsifiable as written:
 redirect refusal lives in `git`'s HTTP client, which needs a protocol exchange
 AC-0148 forbids. No network, credential path, permitted executable, environment
 name or resource bound was widened. The cost is stated in *Follow-ons*: no
 automated guard on real client redirect behaviour. Criteria count unchanged
 at 157.
- 2026-09-14: **Authored as slice 1 of two.** Slice 1 delivers a lead pasting a
 URL and learning the verdict at an exact commit, and carries every trust
 boundary. Artifact viewing, the full work-state projection, capability
 inventory, shaping availability, refresh and staleness are slice 2.
