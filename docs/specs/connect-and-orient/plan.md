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
> `Drafting`. After approval both documents are pinned; execution observations
> go to `notes/verification-ledger.md`.

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
rate over one 250 ms sampling interval, and those become the tolerances the
tree-bytes and file-count bounds cite — **against ceilings the spec fixes in
advance, so a fast host fails the bound rather than raising it.** `--depth 1`
bounds history only; it bounds neither tree bytes nor file count, and a blob
filter is deliberately not used because a checkout refetches every blob at
`HEAD` and would leave the clone a promisor. The sampler is therefore the sole
enforcing control for both dimensions, and the ceilings are what make that
honest.

## Constraints

- **RFC-0001** follow-on item 7 — sole authorization for the trial Runtime.
- **RFC-0002**; **ADR-0005**; **ADR-0006**; **ADR-0007**.
- **`docs/architecture/reference.md`** — renderer reaches the service only
 through the frozen typed preload API; the Studio Service is the single SQLite
 writer; runtime validation at every trust boundary; stdout protocol-only.
- **`AGENTS.md`** — `contracts/` changes require the protocol approval path.

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
- **Bound the input, then sample.** Traces to AC-0050, AC-0051. `git` exposes
 no per-write hook, so `--depth 1` does the primary bounding of history and the
 250 ms sampler is the sole enforcing control for tree bytes and file count. A
 blob filter is deliberately **not** used: a checkout refetches every blob at
 `HEAD`, and it would leave the clone a promisor able to initiate an
 unsupervised later fetch. The advance-fixed ceilings are what make the small
 measured tolerances honest.
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
- Every descendant's environment equals the allowlist name-to-value, with
 `GIT_CONFIG_PARAMETERS` matching the serialization of the pinned set.
- The descendant executable set, observed from the parent, is within the
 permitted row — including the `git-remote-https` helper and the interpreter
 probe.
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
process-tree observer in the parent.

**Done when:** `pnpm verify` is green and AC-0015, AC-0016, AC-0017, AC-0018, AC-0019, AC-0020, AC-0021, AC-0022, AC-0023, AC-0024, AC-0025, AC-0026, AC-0027, AC-0028, AC-0029, AC-0030, AC-0031, AC-0154 hold.

### T5: Materialization is confined, measured, and disposable

**Depends on:** T4

**Tests:**
- Sweep domain verified on every use; root is `mkdtemp` inside it at `0700`.
- Links materialize as regular files; the reader refuses escaping paths
 including a sibling whose name extends the root; non-regular and oversized
 files refused.
- Removal refuses to descend a link; per-request home and temp removed; the
 sweep removes a marker-bearing direct child whose process is gone, and an
 empty markerless direct child older than the markerless-reclaim age, and
 nothing else — a markerless child that is non-empty or too young is skipped.
- **Measurement:** four quantities over one 250 ms interval, recorded in the
 verification ledger and carried into the bounds tolerances. Two carry
 advance-fixed pass bars: write throughput (at or below 128 MiB) and
 file-creation rate (at or below 5,000 files). Two are observations with no
 pass bar, because each quantifies a gap the spec admits rather than a property
 Studio designs: resident-memory growth per interval, which is why AC-0031
 claims detection latency rather than a peak, and the worst-case duration of
 the sample itself against a tree at the file-count bound, which is the second
 term in the tree-bytes and file-count tolerances.
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
the two pass bars met, and
AC-0069, AC-0070, AC-0071, AC-0072, AC-0073, AC-0074, AC-0075, AC-0076, AC-0077, AC-0078, AC-0079, AC-0080, AC-0081, AC-0082, AC-0083 hold.

### T6: The inspector runs from outside the target under supervised bounds

**Depends on:** T5, T1

**Tests:**
- Inspector real path outside the root; one inside is refused to its stop
 reason; provenance recorded; interpreter version verified.
- Submodules not fetched or traversed.
- Tree-bytes and file-count killed on an observed breach within the measured
 tolerance; the two wall-clock deadlines killed exactly.
- Every absence proof whose observed surface exists by this task — AC-0133 to
 AC-0137 and AC-0139 to AC-0145 — each using the probe T1's control validated.
 **AC-0138 and AC-0146 are not provable here:** AC-0138 observes a verdict, a
 routing decision and a state, which do not exist until T9 and T10, and AC-0146
 observes storage, which does not exist until T11. They are gated at T10 and
 T11 and reuse this task's harness, so probe identity stays pinned across all
 three. AC-0147 is gated at T11 for the same reason — it ranges over AC-0133
 through AC-0146, so it cannot be discharged until the last of them is.
- Covers AC-0043, AC-0044, AC-0045, AC-0046, AC-0047, AC-0048, AC-0049, AC-0050, AC-0051, AC-0052, AC-0053, AC-0133, AC-0134, AC-0135, AC-0136, AC-0137, AC-0139, AC-0140, AC-0141, AC-0142, AC-0143, AC-0144, AC-0145.

**Red stub** (`stub: true`):

```ts
it("AC-0050 kills materialization on an observed tree-bytes breach", async () => {
 const out = await materialize(oversizedFixture);
 expect(out).toMatchObject({ ok: false, stopReason: "tree-bytes" });
});
```

**Approach:** inspector locator, supervisor sampling at the stated interval.

**Done when:** `pnpm verify` is green and AC-0043, AC-0044, AC-0045, AC-0046, AC-0047, AC-0048, AC-0049, AC-0050, AC-0051, AC-0052, AC-0053, AC-0133, AC-0134, AC-0135, AC-0136, AC-0137, AC-0139, AC-0140, AC-0141, AC-0142, AC-0143, AC-0144, AC-0145 hold.

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
 expect(project({ state: "inspection-stopped", reason: "tree-bytes" }).attribution).toBe("repository");
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

### T12: A lead connects a repository and sees the verdict

**Depends on:** T11, T8

**Tests:**
- Every state renders; the form rejects with a programmatically associated
 message and returns focus; disabled-in-flight states why and points at cancel.
- `resolving` and `inspecting` separately rendered; SHA shown and announced.
- Verdict outranks revision identity by role; repository strings literal; no
 repository value in a URL or navigation sink; window refuses foreign
 navigation.
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
 and — as the behavioural evidence for AC-0009 that no automated test may carry —
 whether the real client refused a redirect on each of the two phases.
- Covers AC-0114, AC-0129, AC-0130, AC-0131, AC-0132, AC-0148, AC-0150, AC-0151, AC-0152, AC-0153.

**Approach:** write the evidence note from observed behaviour, including the
needed-versus-inherited classification and the statement that the no-local-path
property was mandated rather than discovered; update the overview and
changelog.

**Done when:** `pnpm verify` is green, the ledger carries each recorded
gesture, the smoke result is recorded with its exact SHA and projection, and
AC-0114, AC-0129, AC-0130, AC-0131, AC-0132, AC-0148, AC-0150, AC-0151, AC-0152, AC-0153 hold.

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
- T8 blocks on a human approval gate. Only T12 depends on it.
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

- 2026-09-15: **controlled contract amendment** under the work-loop's
 `contract-amendment` transition, taken from `CODE-IMPLEMENTATION` with explicit
 scope-owner authority after T1 and T2 had completed and been pinned with
 evidence. T3's implementation proved AC-0009 unfalsifiable as written: redirect
 refusal lives in `git`'s HTTP client, so observing it needs a real protocol
 exchange, while AC-0148 forbade network access outright. **The first attempt at
 this amendment was reversed.** It widened AC-0148 to admit a hermetic loopback
 endpoint; two independent pre-EXECUTE reviews and both adjudications then
 returned the same owner-choice stop, and a probe settled it: `GIT_ALLOW_PROTOCOL=https`
 refuses an http loopback target outright, and an https one against a
 test-started endpoint fails on a self-signed certificate unless
 `http.sslVerify=false` or an equivalent CA trust term is supplied — a term the
 pinned `git` configuration does not carry and which AC-0022, AC-0023 and AC-0024
 forbid adding. The loopback route was therefore unreachable under the contract
 it was meant to serve. **What landed instead:** AC-0148 is restored verbatim, so
 no network surface is admitted and the two secure-design concerns about listener
 binding and environment binding are deleted by construction rather than patched;
 and **AC-0009 was narrowed** to claim only what can be observed — the pinned
 configuration present on both argument vectors, falsifiable by dropping the key
 — while stating explicitly that it claims no automated observation of client
 behaviour, which moves to T13's manual smoke against the real remote. Both
 Testing Strategy groups and T3's bullet and Approach were restated in the same
 action; T3's Approach had still named the local-remote stand-in the transport
 pin refuses. The cost is recorded rather than hidden: no automated regression
 guard on real client redirect behaviour. Nothing was widened — no credential
 path, no network, and no change to the permitted executables, environment
 allowlist, pinned `git` configuration, or resource bounds. Criteria count
 unchanged at 157; none added, cut or renumbered. T1 and T2 stay pinned complete
 with their sections unedited; T3 returns as an unfinished task.
- 2026-09-14: amended a fourth time after two pre-EXECUTE rounds of **plan
 executability** review — the first passes to ask whether the plan can be
 executed rather than whether the spec is correct. Three blockers sustained
 through adjudication, all of them the same defect class: a task gating a
 criterion its own observation level cannot falsify. **T2 lost AC-0008 and
 AC-0009 to T3**, which already carried both tests, the red stub and the real
 transport, while T2's approach is a pure module with no I/O. **T6 lost AC-0138
 to T10 and AC-0146 to T11**, because AC-0138 observes a verdict, routing
 decision and state that do not exist until T9 and T10, and AC-0146 observes
 storage that does not exist until T11. **AC-0147 moved with them to T11**, not
 as a separate finding but because it ranges over AC-0133 through AC-0146 and
 cannot be discharged before the last of them — the sibling walk that the two
 relocations forced. T1's fixture rule was corrected in the same action:
 AC-0149 previously directed cases git cannot represent to be built on disk
 after checkout, which would have bypassed the checkout event AC-0136's proof
 observes, so a checkout-observable case is now built into the source object
 database by plumbing beforehand. Thirteen further findings from the same
 review were **refuted** as unenumerated test bullets, which the governing
 standard classes as build-time guidance that cannot prevent Clean; two
 findings the prior session had recorded as verified blockers were also refuted
 on adjudication. Criteria count unchanged at 157; no criterion was added, cut
 or renumbered. Deferred deliberately, not overlooked: the renderer and
 result-composition taxonomy (three sustained advisories on the Non-originated
 value row and AC-0115/AC-0116) and AC-0104's undefined breach behaviour on the
 persisted repository-derived content bound, whose *Resource bounds* row is
 still missing its Enforced-by and Tolerance cells.
- 2026-09-14: amended a third time after pre-EXECUTE round 3 sustained thirteen
 findings through adjudication. **The live-orphan criterion added in round 2 was cut
 rather than repaired, and its number — the one now deliberately unused between
 AC-0155 and AC-0157 — is not reused.** It had been added to close a
 live-orphan gap, but it consumed an ownership marker that repository content can forge, which gave
 an inspected repository influence over which of the user's process groups
 Studio signals — a worse exposure than the bounded leak it closed. Cutting it
 restores a known gap in place of an unbounded one. `version-unverified` was
 split out of the condition axis into an orthogonal qualifier, because it
 collided with `malformed` on a constructible fixture; this is the same
 correction the verdict/condition split already made for the same reason, and
 it removes the need for any precedence rule over the now mutually exclusive
 eight conditions. AC-0157 and AC-0158 bind the verdict's human label and its
 single polite announcement, which removing `ok` from the state set had left
 cited by no criterion. T4 gained one named test per AC-0154 trigger, AC-0066's
 rendered-role clause moved to AC-0114's sole ownership, and the smoke-coverage
 claim was restated on the axis it is true of. Five further findings were
 recorded as one open design question in the spec's Follow-ons rather than
 patched: how per-request on-disk state is owned, identified and reclaimed.
 Criteria count 156 to 157, numbered to AC-0158.
- 2026-09-14: amended a second time after pre-EXECUTE round 2 sustained ten
 findings through adjudication — one blocker, eight concerns and one nit, a
 majority of them consequences of round 1's own repairs. AC-0059's
 repository-file branch gained its own stop-reason row with a repository
 attribution, because the single existing row attributed it to Studio and
 AC-0093 forbids that. Five owner decisions: `ok` leaves the user-visible
 state set, which is now eleven rows, because its meaning is the absence of
 condition chrome and it can carry no label, icon or announcement; T5 gains
 resident-memory growth as a third measurement so the admitted peak-RSS gap is
 quantified rather than merely conceded; AC-0130 moves to Visual / manual QA
 because jsdom computes no geometry; the sampler's own walk duration becomes a
 fourth T5 observation and the second term in both sampled tolerances, making
 worst-case overshoot computable; and AC-0081 gains a second limb reclaiming
 an empty markerless root older than a new markerless-reclaim age. Four
 determined repairs scoped AC-0114 to results where a verdict was reached,
 extended AC-0154 to a wedged child and not only a dead one, added a
 live-orphan criterion for an orphan surviving an abnormal Service death (cut
 in round 3 — see the entry above), and corrected the stale two-parser count. Criteria count 155 to 156.
- 2026-09-14: amended in `SPEC-PLAN-DRAFTING` after the pre-EXECUTE adversarial
 and secure-design reviews sustained thirteen findings through adjudication.
 Six owner decisions: the malformed case carries `no-verdict`, making the
 verdict mapping total; the *User-visible states* set is the union of the
 condition and progress/surface tables, thirteen rows; the resident-memory
 tolerance is restated as detection latency with peak RSS explicitly
 unbounded, and the bound made aggregate; AC-0154 gives the Studio Service an
 outer liveness obligation; AC-0155 bounds child stderr at 256 KiB, truncated
 head-and-tail rather than refused; and `yaml` is deferred to the slice that
 first parses YAML. Seven determined repairs closed the read-surface
 contradiction in T7, the forbidden blob filter in the LLD, nine criteria that
 no task gated, T1's unsatisfiable gate, two inverted verification modes, the
 overstated configuration-file rationale, and the unordered ownership-marker
 write. Criteria count 153 to 155.
- 2026-09-14: authored as slice 1 of two, after five review rounds on a
 single-slice contract converged on 165 criteria with a rising rate of
 repair-induced defects. The cut is vertical, not by layer: slice 1 delivers a
 lead pasting a URL and learning the verdict at an exact commit, carrying every
 trust boundary; slice 2 takes artifact viewing, the full projection,
 capabilities, shaping availability, refresh and staleness. Sustained blockers
 from rounds 4 and 5 are applied at the source rather than inherited — the
 `GIT_CONFIG_PARAMETERS` admission, the per-user sweep domain, input-bounded
 fetch with measured sampling tolerances, `core.protectHFS`, target
 construction from canonical identity, prototype-key inadmissibility, URL-sink
 refusal, per-reason attribution, and one focus-management path as the
 exhaustiveness mechanism.
