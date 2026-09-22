# Acceptance audit — all 157 criteria, 2026-09-20

**Status of this document:** a reconciliation, not a review round. Every previous "unmet" list in
[`verification-ledger.md`](verification-ledger.md) is round-scoped — it records what one review
round found. This is the first pass that reconciles **every** criterion in
[`spec.md`](../spec.md) against the tree.

**Result: 75 met, 77 not met, 5 not verifiable here.** `spec.md`
carries 75 checked boxes and 82 open. Every count in this document, including each
group header, is generated from the rows below rather than written by hand.

Before this audit, `spec.md` had 157 unchecked boxes and the ledger named roughly ten criteria as
known-unmet. An unchecked box meant "not audited". Every box now carries an audited result: checked
means met, and unchecked means not met or not verifiable here.

## Method

Ten independent auditors, one per criterion group, each given the group's criteria, the
*Canonical values* table, and the group's own *Testing Strategy* line. Each was told to assume
nothing from any ledger entry, code comment, or the spec's own prose about what is tested, and to
cite `file:line` for every binding.

Each criterion carries three judgements:

- **verdict** — met, not met, or not verifiable here (needs a network endpoint, a running desktop
  app, a human observation, or a real trusted inspector run).
- **falsifiability** — whether the binding *could fail*. STRONG means the assertion reads a real
  post-condition and the named mutation would redden it. WEAK means it is a tautology, asserts a
  mock was called rather than the resulting state, compares a constant to itself, re-implements
  the production logic inside the test, or iterates a possibly-empty collection with no positive
  control. NONE means no assertion binds it.
- **mutation** — the precise source edit that should turn the binding red. This is what separates
  a criterion that is verified from one that merely has a green test next to it.

A criterion is recorded **not met** when any clause of its wording is unbound, even if the rest is
strongly bound. Partial credit would reproduce the failure this audit exists to correct.

## The cross-cutting findings

The criteria that fail do not fail for as many separate reasons; five causes account for most
of them. **Three of the five are one shape — a module written, tested, and called by nothing.**
Findings 1, 2 and 3 are that shape. Finding 4 is not: its subject `pinnedGitConfigurationArgs()`
has two production callers, `git-driver.ts:89` and `runtime-supervisor.ts:328`, so the defect is
a test fixture re-implementing a live function rather than dead code. Finding 5 is a missing
gate. A sixth finding was recorded and is withdrawn below as false.

### 1. Exported functions with zero production callers

Verified by grep across `apps/` and `packages/`, excluding tests. **No count is given here.**
An earlier version said seventeen; a scan of `apps/studio-service/src` alone returns at least
twenty, and the finding's declared scope is wider, so the number was both wrong and not
reproducible from the search the finding describes. The named examples below are the ones the
eighteen attributed criteria rest on. `locateTrustedInspector`,
`readDeclaredValues`, `selectConformingInterpreter`, `normalizeTrialResult`,
`buildNorthboundRequest`, `BoundedResultReader`, `BoundedDiagnosticBuffer`, `observedVersions`,
`materializeRevision` and others are defined, unit-tested, and imported by no production module.
`parseGuardedToml` has exactly one caller, the module-private `readPackVersion` at inspector-locator.ts:128, which `locateTrustedInspector` reaches at :251 — and that has none.

This is the retraction's defect, still present in four more modules. It accounts for
**AC-0032, AC-0034 to AC-0038, AC-0043 to AC-0046, AC-0048, AC-0054 to AC-0057, AC-0059, AC-0060,
AC-0155** and the unexercised half of AC-0012.

### 2. The stop reason is never populated in production

`stopReason` crosses the wire (`contracts/jsonschema/studio-protocol-v1.schema.json:462`) and the
renderer consumes it. But **no production site ever sets it to a reason.**
`apps/studio-service/src/source-inspection.ts` returns `inspection-stopped` with no reason at
`:296`, `:498` and `:535`, so `:266` resolves `inspected.stopReason ?? null` to null on every
path. The thirteen `STOP_REASONS` keys are matched by a *separate, unmapped* `TrialStopReason`
union in `trial-result.ts:30-32`.

The `#t12-result-fields-2026-09-19` entry recorded AC-0088, AC-0091, AC-0092, AC-0097 and AC-0099
as closed. The **projection and rendering** halves are genuinely closed and strongly bound — the
mutation proof in that entry is real. The **resolution** half was never built: nothing maps a
terminating condition to a `StopReasonKey`. A real stopped inspection reaches the surface with no
reason, so the surface states no attribution and no retryability.

AC-0097 and AC-0099 survive as met because their criteria are satisfied by the fallback copy the
projection supplies. AC-0088, AC-0091 and AC-0092 do not.

### 3. Two resource bounds are absent from the running product

`BoundedResultReader` and `BoundedDiagnosticBuffer` are unwired. The Service's real readers are
`protocolStdout += chunk` (`runtime-supervisor.ts:404`) and `diagnostics += chunk` (`:436`), both
unbounded, alongside unbounded `protocolLines` and `nonProtocolStdoutLines` arrays. The child
materializes repository-controlled content, so its output volume is influenced from outside the
trust boundary. **AC-0037 and AC-0155.**

### 4. The hostile-repository proofs test a re-implementation, not the product

`test/hostile-fixture.ts:326-363` runs its own `git checkout` with a hand-written `-c` list
instead of calling `pinnedGitConfigurationArgs()`. Deleting `core.hooksPath=/dev/null`,
`core.symlinks=false` or `core.protectHFS=true` from `PINNED_GIT_CONFIGURATION` reddens **no
absence proof** — the fixture supplies its own copy of each flag.

Worse, the positive controls fail in two distinct ways, which an earlier version of this
finding stated as one conjunction over six controls. **Three remove no guard** — AC-0134,
AC-0135 and AC-0137 — and **three observe at a different level than their criterion** —
AC-0136, AC-0138 and AC-0139. Three more are tautologies and one is narrowed to `"main"`. `AC-0134`, `AC-0135` and `AC-0137` are vacuous by construction:
`git checkout` never runs a `package.json` script, never executes a file under `.agents/`, and
never runs a smudge filter that was never configured — so the probe log is empty no matter what
Studio does. **AC-0133 to AC-0139, AC-0141, AC-0142, AC-0145 to AC-0147, and AC-0069.**

AC-0147 is the criterion that exists to catch exactly this, and **its test is green** while the criterion itself is recorded not met — the distinction this document's Method section exists to draw.

### 5. The default test suite reaches github.com

**Two** cases in `apps/desktop/src/e2e/connect-and-orient.test.ts` submit
`https://github.com/octocat/Hello-World` with **no `skipIf` gate** — `:86-103` and `:140-161` —
while the same file's docblock at `:12-15` states that accepted cases are gated behind
`CONNECT_ORIENT_E2E_NETWORK=1`. Only the two at `:163` and `:205` carry it. An earlier version of
this finding named one ungated case and asserted the other two siblings were gated.

`connect` returns `resolving` synchronously and runs the pipeline behind it
(`source-inspection.ts:204`), so the assertion passes on the synchronous return while
`git ls-remote` goes to github.com in the background. **AC-0148 is not met, and this is a live
defect rather than a missing test.**

### 6. ~~The rendered evidence was never committed~~ — withdrawn, it was false

**This finding was wrong, and it is left here rather than deleted because it was reported as a
finding and acted on.** It claimed that every `*-connect.png`, `narrow-900-*` and `text-200-*`
was absent from the repository, and that the ledger's `#t13-delivery-2026-09-19-remade` and
`#review-round-37-2026-09-19` entries cited evidence nobody had committed.

`git ls-tree 3814102 docs/specs/connect-and-orient/notes/visual/` returns **57 entries** — 56
PNGs and a manifest, including all eight `*-connect.png`, all seven `narrow-900-*` and all seven
`text-200-*` — committed by `d28d022` on 2026-09-19, before this audit. Those ledger entries
were accurate and their evidence was where they said it was.

**The mistake was reading the wrong directory.** The `git ls-tree HEAD` that produced the claim
was run against `docs/specs/product-development-walking-skeleton/notes/visual/`, a different
spec's evidence set, which does hold exactly the 36 PNGs and manifest the finding described.

The correction inverts the story. There was no missing-evidence defect. What actually happened
is that this session regenerated captures under the tool's default root — the walking-skeleton
spec's notes — and so damaged a **Shipped** spec's retained set, which the adversarial reviewer
caught separately. That spec is restored byte-for-byte to `3814102`, and this slice's captures
remain in their own directory, where they always were. The count there is now 65 rather than 57
because this session added the eight `connect-rejected` scenarios.

Found by the round-7 adversarial reviewer.

## Per-criterion reconciliation

`F` is falsifiability: **S** strong, **W** weak, **N** none.

**Bindings are cited by basename**, not by full path, because each name is unique across this
repository. A name resolves into exactly one of:

| Basenames | Directory |
| --- | --- |
| `source-identity`, `source-inspection`, `source-inspection-storage`, `connected-source`, `service`, `state-projection`, `trial-result`, `trial-enrichment-seam` | `apps/studio-service/src/` |
| `git-driver`, `runtime-child`, `runtime-supervisor`, `runtime-environment`, `executable-identity`, `process-tree-observer`, `materialization`, `materialization-confinement`, `per-request-state-root`, `disposal`, `sweep`, `inspector-locator`, `declared-value-reader`, `inadmissible-keys`, `supervised-bounds`, `absence-proofs`, `live-smoke`, `test/hostile-fixture` | `apps/studio-service/src/trials/connect-and-orient-runtime/` |
| `VerdictSurface`, `InspectionSurface`, `ConnectRepositoryForm`, `ProgressPulse`, `StateBadge`, `presentation`, `useInspection` | `apps/desktop/src/renderer/inspection/` |
| `visual-evidence`, `delta-e2000`, `inspection-contrast`, `inspection-hue-separation` | `apps/desktop/tools/` |
| `connect-and-orient-trial-runtime-evidence.md`, cited in rows as "the evidence note" | `docs/product/research/` |
| `validator`, `contracts`, `state-vocabulary` | `packages/protocol/src/` |
| `storage` | `packages/storage-sqlite/src/` |
| `tokens.css` | `apps/desktop/src/renderer/styles/` |

Citations that already carry a prefix — `e2e/connect-and-orient.test.ts`, `main/index.test.ts`,
`renderer/App.tsx` — are relative to `apps/desktop/src/`.

### Source input and identity — 10 met

| AC | Verdict | F | Binding | Mutation that reddens it |
| --- | --- | --- | --- | --- |
| AC-0001 | met | S | source-identity.test.ts:35-40; source-inspection.test.ts:73-74,235 | swap the owner/repository capture groups in `canonicalizeSource` |
| AC-0002 | met | S | source-identity.test.ts:42-51 | source-identity.ts:89 drop `carriesExplicitPort` |
| AC-0003 | met | S | source-identity.test.ts:53-59,117-121 | source-identity.ts:83 delete the credential check |
| AC-0004 | met | S | source-identity.test.ts:61-68,117-121 | source-identity.ts:94 drop the regex end anchor |
| AC-0005 | met | S | source-identity.test.ts:32,102-115 | source-identity.ts:94 match pathname+search+hash |
| AC-0006 | met | S | source-identity.test.ts:70-78 | source-identity.ts:37 drop the leading-hyphen rejection |
| AC-0007 | met | S | source-identity.test.ts:80-100 | source-identity.ts:48 drop the `..` rejection |
| AC-0008 | met | S | git-driver.test.ts:53-56,59-71 | git-driver.ts:182-185 delete the resolved-ref charset guard |
| AC-0009 | met | S | git-driver.test.ts:207-219 | git-driver.ts:17 remove `GIT_REDIRECT_REFUSAL` from the pinned array |
| AC-0010 | met | S | git-driver.test.ts:264-273; source-identity.test.ts:102-115 | git-driver.ts:180 pass the submitted string instead of `buildFetchUrl` |

### Exact revision — 2 met, 2 not met

| AC | Verdict | F | Binding | Note |
| --- | --- | --- | --- | --- |
| AC-0011 | met | S | git-driver.test.ts:83-91 against `EXACT_COMMIT_SHA` | the positive case only echoes the fake's SHA; the three reject cases carry it |
| AC-0012 | **not met** | W | git-driver.test.ts:110-153 against `materializeRevision` | that function has **no production caller**. The shipped HEAD check is runtime-child.ts:955-985, consumed at source-inspection.ts:537-539, and no test references `verify-head`, the `materialized` line, or `head-unreadable` |
| AC-0013 | met | S | git-driver.ts:193-195; storage.ts:269,287 | carried structurally by the 40-hex guard; `not.toBe("feature/one")` alone is a tautology |
| AC-0014 | **not met** | S for the display, NONE for the proviso | VerdictSurface.tsx:108 asserted VerdictSurface.test.tsx:56-58 | the exact SHA is shown on the verdict surface and that half is strongly bound. **The proviso is triggered and unsatisfied**: `state-vocabulary.ts:145` defines the `inspecting` label as "Inspecting <short-sha>" and `presentation.ts:98` substitutes `resolvedSha.slice(0, 7)` into it, so an abbreviated form *is* displayed — and the criterion allows that only if the exact value "can be copied", which nothing in apps/desktop/src offers. **Recorded met for twelve rounds on the false premise that no abbreviated form was rendered.** Found by the round-13 adversarial reviewer |

### Process boundary, argument vector and environment — 11 met, 5 not met, 3 not verifiable here

| AC | Verdict | F | Binding | Note |
| --- | --- | --- | --- | --- |
| AC-0015 | met | S | runtime-supervisor.test.ts:218-229 | child pid read back across a real process boundary |
| AC-0016 | met | S | runtime-supervisor.test.ts:245-249 | **has a live positive control** at :253-261; only string path arguments to `node:fs` are recorded |
| AC-0017 | met | S | runtime-supervisor.test.ts:283-285,297 | line 296 is a tautology and the descendant leg at :286-293 passes vacuously on an empty map |
| AC-0018 | met | S | runtime-supervisor.test.ts:303-323 | both halves carry non-emptiness controls |
| AC-0019 | met | S | runtime-supervisor.test.ts:338-341 | the `diagnostics.length > 0` control is satisfied by the interpreter banner alone |
| AC-0020 | **not met** | W | runtime-supervisor.test.ts:361-370 | `expect(entry.shell).toBe(false)` compares a hard-coded literal against itself; the audit also misses the supervisor's own spawn (runtime-supervisor.ts:369) and every `ps` (process-tree-observer.ts:209/227/244) |
| AC-0021 | **not met** | W | git-driver.test.ts:262-273; runtime-supervisor.test.ts:398-401 | deleting `--` from the child's `fetchArgs` keeps the suite green; `transport.materialize` binds dead code |
| AC-0022 | **not met** | S | runtime-supervisor.test.ts:412-439,448-457 | the criterion says **every** vector; the assertion filters out the two identity probes, which production genuinely spawns without pins. Unbound by construction |
| AC-0023 | met | S | runtime-supervisor.test.ts:209-212,463-472,490-515 | the name comparison excludes `GIT_CONFIG_PARAMETERS` and `ELECTRON_RUN_AS_NODE` from **both** sides; process-tree-observer.ts:22 parses only upper-case names |
| AC-0024 | not verifiable here | N in gate | live-smoke.test.ts:99-120 | the smoke **genuinely asserts** the property and would bind if enabled; its automated half now has no assertion (runtime-supervisor.test.ts:517-522 records the deletion) |
| AC-0025 | not verifiable here | S automated | runtime-supervisor.test.ts:585-621; live-smoke.test.ts:91-95 | :618 admits `/usr/bin/git`, a widening the *Permitted executables* row does not grant |
| AC-0026 | met | S | runtime-supervisor.test.ts:628-645 | the not-re-read loop carries its own non-emptiness control |
| AC-0027 | met | S | runtime-supervisor.test.ts:664-694 | the absent-search-list case makes "never through `PATH`" an observation |
| AC-0028 | **not met** | W | runtime-supervisor.test.ts:710-714 | compares environment **names, never values**, so it cannot catch the redirection the criterion names. A second probe site, `createDefaultTransport` (source-inspection.ts:561-576), widens `PATH` and omits `LANG`/`LC_ALL`/`TZ`/`GIT_ALLOW_PROTOCOL` with no test |
| AC-0029 | **not met** | S for three limbs of four | runtime-supervisor.test.ts:727-767 | deadline, bound breach and cancellation each signal the group and are strongly bound against separately-verified-alive descendants. **The shutdown limb is unbound and false in the tree**: `service.close()` (service.ts:731-733) closes storage only, and `cancel("shutdown")` (runtime-supervisor.ts:521) has no production caller — the same ground on which AC-0085's process clause is recorded not met. Found by the round-15 reviewer testing the criterion's four-way universal against the tree rather than reading the row |
| AC-0030 | not verifiable here | S for shutdown | runtime-supervisor.test.ts:780-795; live-smoke.test.ts:126-139 | the smoke asserts the empty group against the pgid it recorded |
| AC-0031 | met | S | runtime-supervisor.test.ts:806-851 | aggregate cross-checked against the member sum; the latency ceiling at :840-842 is 2000 ms against a 100 ms interval, looser than the criterion's |
| AC-0154 | met | S | runtime-supervisor.test.ts:876-967 | the surviving descendant is timer-held with stdin on /dev/null, so reclaim is attributable |
| AC-0159 | met | S | per-request-state-root.test.ts:203-215,243-287 | the Runtime-side call site (runtime-child.ts:157-163) is bound by no case; the forcing case needs a host resolving `Pacific/Kiritimati` |

### Provisional contract — 4 met, 8 not met

| AC | Verdict | F | Binding | Note |
| --- | --- | --- | --- | --- |
| AC-0032 | **not met** | W | trial-result.test.ts:47-55 | the request type the Service builds (runtime-supervisor.ts:68-80) has no `contract` field; the only name check is unwired |
| AC-0033 | met | S | trial-result.ts:84-90; minted at source-inspection.ts:489 | client cannot supply one — validator.ts:249-251 is `.strict` |
| AC-0034 | **not met** | W | trial-result.test.ts:93-104 | child echoes the id (runtime-child.ts:1054), supervisor reports its own input (runtime-supervisor.ts:556), nothing compares them |
| AC-0035 | **not met** | W | trial-result.test.ts:113-123 | full-shape validation lives only in the unwired `normalizeTrialResult` |
| AC-0036 | **not met** | W | trial-result.test.ts:108-162 | same; the "not partially consumed" clause is a key count, which does not observe consumption |
| AC-0037 | **not met** | W | trial-result.test.ts:165-196 | `BoundedResultReader` unwired; the real reader is unbounded at runtime-supervisor.ts:404 |
| AC-0038 | **not met** | W | trial-result.test.ts:202-227 | no producer emits the five-element result; the child writes discrete protocol lines and only `materialized` is read |
| AC-0039 | **not met** | S | source-inspection-storage.test.ts:187-206 | markers are strongly bound but come from a literal in `createStorageStore`, not from any value the Runtime reported |
| AC-0040 | met | S | connected-source.test.ts:180-191; storage.ts:322 | write/close/reopen through real SQLite |
| AC-0041 | met | S | trial-result.test.ts:307-332 | real filesystem importer walk with exact equality; walks only `apps/studio-service/src` |
| AC-0042 | met | S | trial-result.test.ts:334-372 | fixed four-field request plus its own positive control at :360-371 |
| AC-0155 | **not met** | W | trial-result.test.ts:510-559 | `BoundedDiagnosticBuffer` unwired; the real stderr reader is unbounded at runtime-supervisor.ts:436 |

### Trusted inspector — 4 met, 6 not met

| AC | Verdict | F | Binding | Note |
| --- | --- | --- | --- | --- |
| AC-0043 | **not met** | W | inspector-locator.test.ts:65-92 | `locateTrustedInspector` has zero production callers, so nothing is recorded "with each inspection"; :88-90 re-computes the production expression inside the test |
| AC-0044 | **not met** | S | inspector-locator.test.ts:96-156 | the pin check is genuinely bound with a positive control, but "rather than being used" is unreachable — no production path calls the locator |
| AC-0045 | **not met** | S | inspector-locator.test.ts:159-187 | real refusal, but `materializationRoot` is never supplied in production, so Studio has no path on which to refuse |
| AC-0046 | **not met** | W | inspector-locator.test.ts:232-276 | `selectConformingInterpreter` is handed the `conforming` boolean by its caller, so the test asserts a value it supplied; the 3.11 threshold is never exercised as a rejection |
| AC-0047 | met | S | source-inspection.test.ts:93-104 | holds because production unconditionally reports `inspector-unavailable` and no fallback executable path exists — the guarded leg is vacuous rather than guarded |
| AC-0048 | **not met** | W | inspector-locator.test.ts:278-313 | the requirement string is the constant the test supplied; `MINIMUM_INTERPRETER_VERSION` is never compared against it |
| AC-0049 | met | S | supervised-bounds.test.ts:233-243 | flag leg strong; the behavioural leg at absence-proofs.test.ts:304-314 is weak — the fixture omits `submodule.recurse=false` and git does not recurse by default |
| AC-0051 | **not met** | W | supervised-bounds.test.ts:152-225 | the kill is a real observed post-condition, but the **tolerance** clause cannot fail: `boundValue` appears on both sides of the assertion at :193-195, so a further bound's worth of overshoot passes, and :190 pins `intervalMs` to 50 while the criterion names the 250 ms interval. Corrected from `met` after the adversarial reviewer applied this document's own rule at line 36 to it |
| AC-0052 | met | S | supervised-bounds.test.ts:71-117 | real detached child, real 5 s hold against a 500 ms deadline |
| AC-0053 | met | S | supervised-bounds.test.ts:125-148 | group-gone observed from the parent against a child holding itself open past its deadline |

### Reading the version marker — 1 met, 6 not met

Every criterion here except AC-0058 rests on `readDeclaredValues`, `normalizeDeclared` or
`parseDeclared`, none of which has a production caller. The Runtime performs **no declared-value
read at all**.

| AC | Verdict | F | Binding | Note |
| --- | --- | --- | --- | --- |
| AC-0054 | **not met** | S | declared-value-reader.test.ts:78-97 | confinement is real but never exercised — zero production callers |
| AC-0055 | **not met** | S | declared-value-reader.test.ts:101-138 | both bounds checked before the read, in a function production never calls |
| AC-0056 | **not met** | S | declared-value-reader.test.ts:142-177 | the criterion names three parse sites; only the unused reader is guarded. The northbound result line is parsed unguarded at runtime-supervisor.ts:413 and validator.ts:856 |
| AC-0057 | **not met** | S | absence-proofs.test.ts:388-453 | every production JSON parse is unguarded — service.ts:1274, validator.ts:856, runtime-supervisor.ts:413, sweep.ts:127, storage.ts:1103 — and `parseGuardedToml`'s only caller is itself zero-caller |
| AC-0058 | met | S | declared-value-reader.test.ts:246-264 | the clause is declared inapplicable by the spec, and the assertion reads the real manifest |
| AC-0059 | **not met** | S | declared-value-reader.test.ts:268-322 | the three-row routing is bound as a pure mapping; no production code parses a declaration file, so no real failure reaches it |
| AC-0060 | **not met** | W | declared-value-reader.test.ts:326-353 | the property follows from the field list the test passes in; the renderer never renders `declaredVersionMarker` |

### Version honesty and the verdict — 5 met, 3 not met

The pure derivation is total and strongly bound. What is unexercised is the phrase "from trusted
inspector output": production's `inspect` never returns any, so every real inspection is
`inspector-unavailable`. That gap is routed at `connect-orient-no-inspector-runs` and is the next
slice by the owner's decision; it is recorded here per criterion rather than counted against the
derivation.

| AC | Verdict | F | Binding | Note |
| --- | --- | --- | --- | --- |
| AC-0061 | met | S | trial-result.test.ts:375-385; wired at source-inspection.ts:280-285, asserted source-inspection.test.ts:106-150 | the derivation is total; the real `inspect` returns no inspector output |
| AC-0062 | met | S | trial-result.test.ts:408-420 | differential control: marker present versus absent, verdict unchanged |
| AC-0063 | met | S | trial-result.test.ts:387-390; source-inspection.test.ts:148-149 | "produced by nothing else" holds — `malformed` is assigned in production only at trial-result.ts:160 |
| AC-0064 | **not met** | W | trial-result.test.ts:424-428 | the qualifier half is bound; **nothing reports that a repository declares no version**, and production hardcodes `declaredVersionMarker: null` at source-inspection.ts:152 |
| AC-0065 | **not met** | S as a derivation, NONE in production | trial-result.test.ts:430-464 | the orthogonality is strongly bound as a pure derivation. **But a declaring repository never carries the qualifier**: `versionUnverified: declared !== null` is computed only at trial-result.ts:254, inside the zero-caller `normalizeTrialResult`, while the live record hardcodes `versionUnverified: false` at source-inspection.ts:146 and nothing reads either permitted file. This is the mirror of AC-0064, recorded not met on the adjacent hardcode; the two now agree |
| AC-0066 | met | S | VerdictSurface.test.tsx:306-323 | composition rule bound against the rendered component |
| AC-0067 | **not met** | S for the shape, NONE for the observation | trial-result.test.ts:468-507; validator.ts:37-43 | the two values are separate fields in contract, record and store, and that shape is strongly bound. **But the criterion says two separate *observed* values, and neither is ever observed**: source-inspection.ts:152 hardcodes `declaredVersionMarker: null` — the reason AC-0064 is not met — and `:153` hardcodes `inspectorContractVersion: null` on the adjacent line, while `inspectInRuntime` has no `ok: true` return at all, so `:287` resolves to null too. **Recorded met, then corrected twice**: the note first claimed the field was populated in production, then was narrowed to say it was wired not populated, and the verdict itself was only re-tested against this document's own rule at line 35 when the round-14 reviewer asked for it |
| AC-0068 | met | S | trial-result.test.ts:503-506 | an absence proof scoped to `observedVersions` only. **Met although its subject is a zero-caller module, unlike AC-0045 and AC-0054**: this criterion is a negative obligation — *no* value is compared — which code that never runs genuinely satisfies. Those two are positive obligations ("refuses X"), and a refusal needs a live path to refuse on |

### Path confinement and materialization safety — 6 met, 2 not met

| AC | Verdict | F | Binding | Note |
| --- | --- | --- | --- | --- |
| AC-0069 | **not met** | W | materialization.test.ts:29-74 | inspects a checkout made by the **test helper** (test/hostile-fixture.ts:337), which hand-writes `core.symlinks=false` instead of calling `pinnedGitConfigurationArgs()` |
| AC-0070 | met | S | per-request-state-root.test.ts:87-140 | all four clauses read as on-disk post-conditions |
| AC-0071 | met | S | disposal.test.ts:171-173 | against a real spawned Runtime's `sweep` protocol line |
| AC-0072 | met | S | per-request-state-root.test.ts:52-85 | existence, link, kind, ownership and mode each fail closed, checked per use |
| AC-0073 | met | S | materialization-confinement.test.ts:50-83 | both halves bound — the segment boundary and the resolved-real-path comparison. The only reader routing through it, `readDeclaredValues`, has no production caller. **Met on the same ground as AC-0068 and not AC-0045's**: "no byte of repository content is read from outside the root" is a negative obligation, and a reader that never runs reads no byte. The method clause it carries describes how a read must be guarded, not a refusal Studio owes on a live path |
| AC-0074 | met | S | materialization-confinement.test.ts:95-111 | the device case asserts `outside-materialization-root`, so no assertion reaches the device or socket kind through this guard |
| AC-0075 | **not met** | W | materialization-confinement.test.ts:124-143 | the "checked **before** the read" clause — the criterion's whole point — has no assertion that can fail; moving the check after the read keeps every case green |
| AC-0076 | met | S | per-request-state-root.test.ts:322-340 | a planted link at depth and a surviving external witness |

### Disposal and cancellation — 6 met, 3 not met

| AC | Verdict | F | Binding | Note |
| --- | --- | --- | --- | --- |
| AC-0077 | met | S | disposal.test.ts:64-67 | a live `ps` group observation taken after the response |
| AC-0078 | met | S | disposal.test.ts:131-136 | real filesystem post-conditions over two real Runtime spawns |
| AC-0079 | met | S | disposal.test.ts:80-84,115-121 | the failure path is bound only indirectly |
| AC-0080 | **not met** | S | per-request-state-root.test.ts:121-191,342-362 | encoding and removal-ordering are bound; the clause "written **before any other child**" has none — swapping those two lines reddens nothing, and that ordering is what stops a crash leaving a populated unmarked root no sweep limb reclaims |
| AC-0081 | met | S | sweep.test.ts:94-398 | `outcomeFor` throws when a candidate produced no outcome, so no case passes by the sweep never having looked |
| AC-0082 | met | S | disposal.test.ts:168-185; runtime-supervisor.test.ts:233-261 | the fs-path recorder runs with the sweep enabled, so its reads are inside the observed window |
| AC-0083 | met | S | sweep.test.ts:180-386 | `toHaveLength(2)` is a counted positive control, not an empty iteration |
| AC-0084 | **not met** | W | connected-source.test.ts:293-294 | asserts only that a test-supplied `terminate` lambda set a local boolean. Every `sources.cancel` test injects an `inspect` fake ignoring `request.signal`, and `inspectInRuntime` — the only code turning the signal into `signalProcessGroup` (source-inspection.ts:508) — **is referenced by no test at all**. The production code is correct and nothing holds it there |
| AC-0085 | **not met** | S / N | source-inspection-storage.test.ts:94-117 | the `incomplete` half is strongly bound. "No trial Runtime process from the prior session remains" is **unimplemented**: `service.close()` (service.ts:731-733) closes storage only, and the supervisor's `cancel("shutdown")` has no production caller, so a child from the prior session survives until its own deadline |

### Honest states — 2 met, 12 not met

Two causes: the stop reason is never populated (finding 2), and most criteria are bound at the
projection with no renderer assertion, or the reverse.

| AC | Verdict | F | Binding | Note |
| --- | --- | --- | --- | --- |
| AC-0086 | **not met** | S | state-projection.test.ts:36-47 | projection only; no test renders each of the eleven states, and two are never produced in production |
| AC-0087 | **not met** | S | state-projection.test.ts:49-67 | the rendered half is unbound — `StateBadge` emits no attention datum, the mapping lives only in tokens.css:650-680 and no test reads it |
| AC-0088 | **not met** | S | state-projection.test.ts:71-77; VerdictSurface.test.tsx:152-171 | composition is bound at both layers; the **resolution** clause is false in the tree — no production site maps a criterion to a `StopReasonKey` |
| AC-0089 | **not met** | S | state-projection.test.ts:99-111 | projection only; VerdictSurface.tsx:166-168 renders "Studio looked for …" with no renderer assertion |
| AC-0090 | **not met** | S | state-projection.test.ts:99-111 | same split as AC-0089 |
| AC-0091 | **not met** | S | state-projection.test.ts:124-135; VerdictSurface.test.tsx:173-197 | per-reason attribution is genuinely bound at both layers, but production never populates the reason, so a real stopped result states no attribution |
| AC-0092 | **not met** | S | state-projection.test.ts:137-145 | renderer half unasserted, and the production reason is always null |
| AC-0093 | **not met** | S | state-projection.test.ts:149-177 | the *total* loop at :160-167 is a tautology — it asserts what `project` returns by construction; only the three hardcoded cases carry force |
| AC-0094 | **not met** | W | state-projection.test.ts:181-189 | asserts over `project({state:"malformed"})`, a different subject. A non-Agent-Ready result passes `condition={null}`, so `ConditionDetail` renders nothing |
| AC-0095 | **not met** | S | state-projection.test.ts:191-199; VerdictSurface.test.tsx:250-261 | bound for degraded results only; `ConditionDetail` returns null when not degraded, so the criterion's own subject renders no actions |
| AC-0096 | **not met** | W | state-projection.test.ts:203-206 | `unreachableCondition` has no caller; the real path hardcodes `source-unavailable` at source-inspection.ts:215 and no rate-limit detection exists anywhere |
| AC-0097 | met | S | state-projection.test.ts:208-222; VerdictSurface.test.tsx:199-226 | both halves bound with rendered post-conditions, including the "none was reported" fallback |
| AC-0098 | **not met** | S | state-projection.test.ts:226-249 | the sweep has a positive control but covers only projection-sourced copy; the `cancelled` block and `UnconnectedNotice` are outside it |
| AC-0099 | met | S | state-projection.test.ts:253-268; VerdictSurface.test.tsx:228-248 | travels as its own field with no copy path reaching it |

### Persistence — 3 met, 2 not met

| AC | Verdict | F | Binding | Note |
| --- | --- | --- | --- | --- |
| AC-0100 | met | S | source-inspection-storage.test.ts:84-85 | real adapter, genuine close/reopen |
| AC-0101 | met | S | source-inspection-storage.test.ts:86-87; connected-source.test.ts:145-149 | the ref clause is bound only where the record is built directly, never through the full connect pipeline |
| AC-0102 | **not met** | S | source-inspection-storage.test.ts:88-89 | the clean-verdict case is strong. "Its diagnostics" fails for a **degraded** result: no `stop_reason`, `wait_window` or `secondary_diagnostic` column exists (storage.ts:269), and every persistence test persists a clean `agent-ready` record, so the loss is invisible to the suite |
| AC-0103 | **not met** | S for the display half | VerdictSurface.tsx identity list, asserted the `AC-0103` describe block in VerdictSurface.test.tsx and the wiring case in InspectionSurface.test.tsx | **display built this session, criterion still open.** `inspectedAt` reached no surface; it now renders in the identity list from a pinned UTC table rather than through `Intl`, whose month abbreviations move with the host ICU version. **But the criterion says a *restored* verdict**, and the renderer has no path to one: `useInspection.ts:74` mounts at `null`, `source.get` needs a `sourceId` held in memory, the preload exposes no list-or-latest call, and nothing persists the id — no `localStorage` or `sessionStorage` exists under apps/desktop/src. After a restart the surface shows `unconnected`. Found by the quality reviewer after this session first recorded the criterion closed |
| AC-0104 | met | S | source-inspection-storage.test.ts:143-206 | a 300 KiB breaching write through the production `store.persist`, prior record intact; the provenance regression case is bound |

### Desktop surface — 7 met, 8 not met, 1 not verifiable here

A renderer test with a fake preload still strongly binds a **rendering** obligation. It cannot
bind an obligation about the lead actually receiving the right data — only
`apps/desktop/src/e2e/connect-and-orient.test.ts` does. **Two of its accepted-URL cases are
gated behind `CONNECT_ORIENT_E2E_NETWORK=1` and two are not**, which is AC-0148's defect; an
earlier version of this preamble said all of them were gated.

| AC | Verdict | F | Binding | Note |
| --- | --- | --- | --- | --- |
| AC-0105 | **not met** | S | InspectionSurface.test.tsx:61-64 | the clause "the **desktop** provides" is loose — every test renders `InspectionSurface` directly; deleting it from `renderer/App.tsx:242` or the nav entry at `renderer/App.tsx:94` reddens nothing |
| AC-0106 | **not met** | S for the rendered shape | InspectionSurface.test.tsx:69,72 | the single-field, no-credential shape is a real post-condition over rendered DOM. **But the criterion opens "The desktop provides", the same clause that makes AC-0105 not met**, and the binding is the same direct `render(<InspectionSurface … />)` in the same describe block — deleting the surface from `renderer/App.tsx:242` or its nav entry at `:94` reddens neither criterion. The two now agree |
| AC-0107 | met | S | InspectionSurface.test.tsx:77-78 | the badge label is read from the shared projection rather than restated |
| AC-0108 | met | S | InspectionSurface.test.tsx:300-301,103-106; source-identity.test.ts:41-88; e2e:114-117,134-137 | the distinguishability half is bound for all five causes and the offline e2e covers two, so it does not depend on the network gate |
| AC-0109 | met | S | InspectionSurface.test.tsx:100-120 | association, invalid marking and focus are DOM post-conditions |
| AC-0110 | met | S | InspectionSurface.test.tsx:142-144 | asserts over the DOM the string produced, so an innerHTML renderer cannot pass |
| AC-0111 | met | S | InspectionSurface.test.tsx:163-170 | `busy` derives from the real `IN_FLIGHT` map, so the disable is computed |
| AC-0112 | **not met** | S | InspectionSurface.test.tsx:199-230 | "**both** offer a cancel affordance" — the enabled-cancel assertion exists only in the `resolving` branch; nothing covers cancel under `inspecting` |
| AC-0113 | met | S | VerdictSurface.test.tsx:95-100; presentation.test.ts:122-131 | `cancelled` is not degraded, so the asserted copy really is this block's output |
| AC-0114 | not verifiable here | W | VerdictSurface.test.tsx:26-58 | the real observable — highest contrast and largest type role — is never computed; jsdom loads no stylesheet and nothing reads tokens.css. The spec's own Testing Strategy places this in Visual / manual QA |
| AC-0115 | **not met** | S | VerdictSurface.test.tsx:119-125 | two of five named channels are unbound: no hostile value is fed through the **progress states** or the **polite live region** |
| AC-0116 | **not met** | S | VerdictSurface.test.tsx:142-147; main/index.test.ts:133-142,481-483 | the host-window half is fully bound; the renderer sink sweep runs only inside a `VerdictSurface`-only render, so adding an `<a href>` to `ProgressPulse` reddens nothing |
| AC-0117 | met | S | VerdictSurface.test.tsx:242-277 | the "not in the copy above it" assertion also catches promotion onto the primary surface |
| AC-0118 | **not met** | S | VerdictSurface.test.tsx:288-290 | the criterion says "No **surface**", but the sweep runs against a lone `VerdictSurface` render |
| AC-0119 | **not met** | S | VerdictSurface.test.tsx:74-79 | only the second sentence is bound, for one condition pairing; "No degraded condition renders a generic success treatment" has no assertion over the seven degraded conditions |
| AC-0157 | **not met** | W | presentation.test.ts:51-58; VerdictSurface.test.tsx:78 | no test ever renders `verdict="not-agent-ready"`; the distinctness assertion is constant-to-constant over a frozen map |

### Quality floor — 6 met, 7 not met, 1 not verifiable here

| AC | Verdict | F | Binding | Note |
| --- | --- | --- | --- | --- |
| AC-0120 | met | S | inspection-hue-separation.test.ts:83-115; delta-e2000.test.ts:112-116 | the metric is proven against Sharma/Wu/Dalal reference data and both theme blocks are read off the shipped tokens.css |
| AC-0121 | **not met** | S | presentation.test.ts:17-27 | no assertion ties a `SHAPES` value to a `[data-shape]` rule, so renaming a shape token keeps tests green while that state falls back to the undifferentiated default square |
| AC-0122 | met | S | presentation.test.ts:17-27; VerdictSurface.test.tsx:76-79 | hue reaches only the shape, so the label-plus-shape pair survives the defect that sinks AC-0121 |
| AC-0123 | **not met** | S | inspection-contrast.test.ts:90-112 | the connect, cancel and refresh controls are bare `<button>`s the stylesheet gives only a border-radius, so their label-on-face pairing is UA-set and appears in no roster |
| AC-0124 | **not met** | S | InspectionSurface.test.tsx:330-375 | "a focus indicator that does not rely on colour alone" — jsdom loads no stylesheet, so deleting the `:focus-visible` outline rules reddens no test, leaving only the colour half |
| AC-0125 | met | S | presentation.test.ts:72-96 | iterates `ALL_STATES`, independently pinned at 11 and against the protocol's `USER_VISIBLE_STATES` |
| AC-0126 | met | S | InspectionSurface.test.tsx:173-184 | reads real post-navigation focus after a real user-event click |
| AC-0127 | **not met** | S | InspectionSurface.test.tsx:353-358 | only one adjacent pair is tabbed; the verdict surface's focus order is never exercised, and heading structure is bound only as existence, not level or nesting |
| AC-0128 | met | S | InspectionSurface.test.tsx:239-253; presentation.test.ts:177-211 | the literal anchors carry the criterion independently of the tautological expectation at :136-143 |
| AC-0129 | **not met** | S / N | ProgressPulse.test.tsx:15-48 | the text-channel half is sound; "state-change motion is omitted" is unbound — the `prefers-reduced-motion` block at tokens.css:762-769 is asserted by nothing and the capture only sees the pre-connection surface |
| AC-0130 | **not met** | S for the focus clause | visual-evidence.mjs occlusion probe and its vacuity guard; `connect-rejected` surface | **materially advanced this session, not closed.** The tool focuses every reachable control in turn and hit-tests its own centre, failing when the topmost element there is unrelated to the focused control; a `connect-rejected` surface puts a real diagnostic on screen offline, since a refusal consults no transport. Mutation: making `.connect-form__rejection` a fixed full-viewport overlay turns the run exit 1 and names the obscuring element. A vacuity guard fails the run when a surface has controls but none could be hit-tested, and the manifest records the tested and skipped counts per surface. **What it proves is narrow** and the tool says so: the *centre* of each focused control is not covered by a *hit-testable* layer. It cannot see a `pointer-events: none` overlay, nor a panel covering a control's edges or label while its centre stays clear. **Still open:** the criterion also names the longest fixture label, an enabled Cancel and a retry control, which need a completed inspection and so the network AC-0148 forbids |
| AC-0131 | not verifiable here | S | visual-evidence.mjs, the undersized-control collector and its assertion | a real measured post-condition over a control set the run also requires to be non-empty, but it executes only against the built app under Chromium |
| AC-0132 | **not met** | S for the text-resize half | visual-evidence.mjs, the `text-200` scenario and its post-navigation scale probe | the text-resize half is sound: the root size is set after `Page.navigate` and probed, so a silently-unapplied scale can no longer produce a baseline-identical capture. **A third loose clause was found in review and fixed:** the scenario set an inline `font-size: 200%`, which resolves against the UA's 16 px and overrides `tokens.css`'s `:root { font-size: 75% }`, so it rendered 32 px — **2.67x** the product's 12 px base, not the 2x the criterion names. The scale is now derived from the measured baseline and the manifest records the rendered root size, which is how the discrepancy became visible. **Still loose:** the narrowest viewport any scenario uses is 720 px, never the 320 px-equivalent WCAG 2.2 1.4.10 names, and the verdict surface is captured in no scenario |
| AC-0158 | met | S | InspectionSurface.test.tsx:256-273; presentation.test.ts:213-230 | literal strings against a rendered live region and against the pure function |

### Security proofs — 3 met, 12 not met

Finding 4 governs this group. The absence proofs run against `test/hostile-fixture.ts`'s own
re-implemented checkout, so removing a flag from `PINNED_GIT_CONFIGURATION` reddens none of them.

| AC | Verdict | F | Positive control | Note |
| --- | --- | --- | --- | --- |
| AC-0133 | **not met** | S | genuine, same level | binds the fixture's hardcoded `core.hooksPath=/dev/null`, not the product's pinned list |
| AC-0134 | **not met** | W | removes no guard | `git checkout` never runs a `package.json` script, so the probe log is empty by construction |
| AC-0135 | **not met** | W | removes no guard | nothing in checkout executes a file under `.agents/` |
| AC-0136 | **not met** | S | wrong level | positive-shaped and cannot pass vacuously, but binds the fixture's four-flag vector |
| AC-0137 | **not met** | W | removes no guard | `.gitattributes` names `filter=probe` but no smudge command is ever configured |
| AC-0138 | **not met** | W | wrong level | verdict and routing limbs are bound; the state limb is `expect(project(x)).toEqual(project(x))` |
| AC-0139 | **not met** | S | wrong level | observes the source tree, not the materialized tree the negative walks |
| AC-0140 | met | S | **same level** | the one criterion whose binding, observation level and control all match, because its subject is a unit function |
| AC-0141 | **not met** | W | tautology | git does not recurse submodules by default and the fixture's vector lacks the flag entirely |
| AC-0142 | **not met** | S / N | only `"main"` admitted | the refusal is bound; "before reaching an argument vector" is not — no vector is ever built or inspected |
| AC-0143 | met | S | **same level** | raw `JSON.parse` of the same bytes yields an own `__proto__`; non-blanket admission also checked |
| AC-0144 | met | S | **same level** | the static import audit over runtime-child.ts is the load-bearing leg |
| AC-0145 | **not met** | W | literal tautology | the header channel is stubbed over a code path that never uses `globalThis.fetch` |
| AC-0146 | **not met** | W | tautology | the credential never enters the persistence path, so the negative is over a string that could not contain it |
| AC-0147 | **not met** | W | n/a — this **is** the control obligation | three of fourteen controls remove no guard and three observe at a different level than their criterion, so the clause this criterion exists to enforce is unenforced while the test is green |

### Suite-level and evidence — 5 met, 1 not met

| AC | Verdict | F | Binding | Note |
| --- | --- | --- | --- | --- |
| AC-0148 | **not met** | N | e2e/connect-and-orient.test.ts:86-103 and :140-161 | **live defect.** **Two** ungated accepted URLs; the default `pnpm test` opens connections to github.com. No assertion, hook or config anywhere enforces the property |
| AC-0149 | met | S | test/hostile-fixture.test.ts:36-108 | corpus and mapping exhaustively pinned; the `.GIT` case is built through `mktree`/`commit-tree` and verified present before checkout |
| AC-0150 | met | N | the evidence note, all thirteen headings present | satisfied on inspection; `tools/governance-gate.mjs:46-49`, at the repository root rather than under the prefixes the table lists, reads only `docs/adr` and `docs/rfc`, so it cannot regress detectably |
| AC-0151 | met | N | evidence note :58-65 | a Needed/Inherited column over six held things, each with an observation |
| AC-0152 | met | N | evidence note :185-190 | states the property was mandated by the spec rather than discovered |
| AC-0153 | met | N | evidence note :7-10,155-190 | each criterion carries an **Observed:** paragraph and no Pass/Fail token |

## What this changes

- `spec.md` now carries 75 checked boxes. The remaining 82 are audited results, not
  unexamined boxes.
- The spec stays **Implementing**. Per
  `.claude/skills/new-spec/references/spec-and-plan-contract.md:108-114`, a spec holds that status
  across sessions while required accepted work remains, and only an owner-agreed amendment moves
  work out of the AC set.
- Three of the five standing cross-cutting findings are one defect class — a module written, tested, and
  called by nothing. Closing them is mostly wiring existing, already-tested code into the
  pipeline, not writing new behaviour. Finding 4's subject has live callers — its defect is a
  fixture re-implementing them — and finding 5 is a missing gate.
- `AC-0148` is the only finding that is a defect in something currently running rather than an
  absence.
