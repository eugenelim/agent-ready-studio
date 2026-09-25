# Acceptance audit — all 157 criteria, 2026-09-23, updated 2026-09-24

**Status of this document:** a re-run of the 2026-09-20 reconciliation, which twelve commits had
made stale. It replaces that document. Ten independent auditors, one per criterion group, each
given its group's criteria, the *Canonical values* table and its own *Testing Strategy* line, and
each told to assume nothing from any ledger entry, code comment or the spec's own prose, and to
cite `file:line` for every binding.

**Result: 92 met, 62 not met, 3 not verifiable here.** Against 2026-09-20's 77 / 75 / 5 that is
**+11 met**; the 2026-09-23 re-run itself read 82 / 72 / 3, and the six criteria between that
figure and this one are the *Provisional contract* group's, closed by Step C on 2026-09-24. Every
count in this document, including each group header and the headline above, is generated from the
rows below by `tools/acceptance-audit-counts.py` rather than
written by hand — which caught one auditor reporting 9 met against its own table of 10. Run that
script after editing any row; `--check` fails when a count is stale.

## Method

Unchanged from the previous pass, and restated so a cold reader needs no second document.

Each criterion carries three judgements:

- **verdict** — met, not met, or not verifiable here (needs a network endpoint, a running desktop
  app, a human observation, or a real trusted inspector run).
- **falsifiability** — **S** strong: the assertion reads a real post-condition and the named
  mutation would redden it. **W** weak: a tautology, asserts a mock was called rather than the
  resulting state, compares a constant to itself, re-implements production logic inside the test,
  or iterates a possibly-empty collection with no positive control. **N** none.
- **mutation** — the precise source edit that should turn the binding red. This is what separates
  a criterion that is verified from one that merely has a green test next to it.

A criterion is recorded **not met** when any clause of its wording is unbound, even if the rest is
strongly bound. Partial credit would reproduce the failure this audit exists to correct.

## What moved, and what did not

The gain is concentrated where this week's work went. **Reading the version marker went from 1 met
to 4 met**: the declared-value read is now on the live path, so AC-0054, AC-0055, AC-0056 and
AC-0057 are bound against a real child rather than an unwired module. *Honest states* went 2 to 4,
*desktop surface* 7 to 9, *trusted inspector* 4 to 5, and AC-0025 and AC-0030 moved from not
verifiable to met.

**2026-09-24, Step C.** *Provisional contract* went 6 met to **12 met** — the whole group. The
child now writes a full result line and the Service validates it in full before normalizing
anything, so AC-0032, AC-0034, AC-0035, AC-0036, AC-0038 and AC-0039 are bound against a real
child rather than against a function with no caller. The named mutations that redden them, and the one that
survived, are at `notes/verification-ledger.md#slice-f1-step-c-2026-09-24`; the count is stated
there alone so it cannot drift from the table it describes.

Three groups were judged **more harshly** than last time, and in each case the earlier verdict was
too generous rather than the code having regressed. *Path confinement* fell from 6 met to 3:
`resolveContainedPath` and `readContainedFile` implement the segment-boundary comparison AC-0073
requires, but they have zero production callers, and the only production reader of the
materialization does `join` plus `lstat` with no such check. *Disposal* fell from 6 to 4 on three
clauses with no case at all — removal on failure, ordering of the ownership marker, and three
sweep branches. AC-0010 moved from met to not met because its materialization leg asserts
`toContain` against a URL that already satisfies it.

**The dominant cause is unchanged and is one shape: a module written, tested, and called by
nothing.** `locateTrustedInspector`, `selectConformingInterpreter`, `resolveContainedPath`,
`readContainedFile`, `observedVersions` and `unreachableCondition` are each fully tested and each
reached by no production path, and between them they account for most of the remaining *Trusted
inspector* and *Version honesty* failures.

**Two of those were deleted on 2026-09-24.** `readDeclaredValues` in `declared-value-reader.ts`
went first: the read happens in the Runtime child, the Service opens no path under a
materialization root, and a Service-side reader of untrusted content could only ever falsify the
isolation claim the process boundary exists to make. `materializeRevision` in `git-driver.ts`
followed, together with the `materialize` and `readHead` transport members under it —
materialization moved into the child, so what remained was a whole re-implementation of the
child's pinned vector that no production path reached.

**A false premise nearly kept `materializeRevision`, and the rows below are what refuted it.**
An earlier draft of this entry asserted that AC-0009 and AC-0014 were recorded met *against* that
dead copy, so deleting it would clear two met verdicts. Both rows say otherwise: AC-0009 cites
`runtime-supervisor.test.ts:411-455`, the vectors a **real child** emits, and AC-0014 cites
`VerdictSurface.tsx` and has no git binding at all. The deletion moved no verdict. The claim was
reasoning about the rows rather than reading them, which is the habit §*What moved* names as the
cause of every false verdict this audit has found.

**`normalizeTrialResult` left this list on 2026-09-24.** Step C gave it its one live caller in
`validatedTrialResult`, which closed the whole *Provisional contract* group. The AC-0035 row
carries the line citation, so it is stated once.

## Findings that are production gaps rather than testing gaps

- **Nothing aborts an in-flight Runtime on Service shutdown** (AC-0085). `reconcileAfterRestart`
  rewrites a column; no shutdown path signals a live group. The auditor's phrasing is the point:
  the wiring "cannot be mutated because it does not exist".
- **The default test suite still reaches github.com** (AC-0148). Only two of the four
  accepted-URL cases in `apps/desktop/src/e2e/connect-and-orient.test.ts` are gated behind
  `CONNECT_ORIENT_E2E_NETWORK`; the cases at `:91` and `:143` are not, and `connect()` fires the
  pipeline. Nothing enforces the property.
- **`versionUnverified` is unreachably `false` in production** (AC-0064, AC-0065). The live record
  hardcodes it and the marker beside it, and no pipeline branch overwrites either.
- **`already-in-flight` maps to a state the criterion forbids** (AC-0154). `inspectInRuntime`
  returns `inspection-stopped`, which the *User-visible states* table lists.
- **Three hostile-repository probes remove no guard** (AC-0134, AC-0135, AC-0137). The auditor
  reproduced guardless checkouts and the probe logs stayed empty: `git checkout` runs no
  `package.json` script, executes nothing under `.agents/`, and applies no filter when no
  `filter.probe.smudge` is configured.

## Per-criterion reconciliation

`F` is falsifiability: **S** strong, **W** weak, **N** none. Bindings are cited by basename where
the name is unique across the repository, as in the previous pass.

### Source input and identity, and exact revision — 12 met, 2 not met

| Criterion | Verdict | F | Bindings | Evidence and the mutation that reddens it |
| --- | --- | --- | --- | --- |
| AC-0001 | met | S | source-identity.ts:94-117; source-inspection.ts:275-293; source-inspection.test.ts:71-74 | connect derives owner/repository from the submitted URL and records them; passing empty strings on the accepted branch reddens |
| AC-0002 | met | S | source-identity.ts:60-92; source-identity.test.ts:42-51 | scheme, lowercased-host equality, explicit port and trailing dot each a closed reject case |
| AC-0003 | met | S | source-identity.ts:83-85; source-identity.test.ts:53-59,117-121 | credentialed URLs refuse ahead of the host check, with reason-set cardinality binding distinctness |
| AC-0004 | met | S | source-identity.ts:94-97; source-identity.test.ts:61-68 | two-segment path regex rejects /owner, /owner/repo/tree/main and /owner//repo with its own reason |
| AC-0005 | met | S | source-identity.ts:78,94,99-100; source-identity.test.ts:29-40,102-115 | identity derived from parsed.pathname, asserted against query and fragment carrying a credentialed URL |
| AC-0006 | met | S | source-identity.ts:27,34-40; source-identity.test.ts:70-78 | charset, length bound and leading dot/dash rules each a reject case including a 101-character owner |
| AC-0007 | met | S | source-identity.ts:28,42-50; source-identity.test.ts:80-100; service.ts:1004-1008 | ref charset rejects leading dash/slash, trailing slash, .., control characters and 256 chars, and reaches the dispatch path |
| AC-0008 | met | S | git-driver.ts:143-147; git-driver.test.ts:53-71; source-inspection.ts:205-209 | resolveRevision on the live pipeline re-applies the ref charset to the remote-reported ref over seven hostile names |
| AC-0009 | met | S | git-driver.ts:16-34,89; runtime-child.ts:851-853,1110-1152; runtime-supervisor.test.ts:411-455 | every git vector a real child emits leads with the full pinned prefix; note a mutation confined to the child's fetchArgs alone would survive |
| AC-0010 | **not met** | W | source-inspection.ts:234-240; source-inspection.test.ts:89; runtime-child.ts:1117 | resolution leg strongly bound, but the materialization leg asserts toContain against a URL that already satisfies it; fetchUrl: url stays green |
| AC-0011 | met | S | git-driver.ts:83,149-151; git-driver.test.ts:73-91; source-inspection.ts:205-241 | resolution gated on a 40-hex match and ordered before inspect, with 12-char, 41-char and non-hex rejects |
| AC-0012 | **not met** | W | runtime-child.ts:1181-1229 | the Runtime does verify `HEAD`, live, inside its own materialization root — and **no case reaches it**, because no case can. Reaching it needs a fetch, and *Canonical values*, *Permitted git transports* admits `https` only via `GIT_ALLOW_PROTOCOL=https`; a local fixture repository was built on 2026-09-24 and the child answered `fatal: transport 'file' not allowed`, which is the refusal AC-0024 states. The `materializeRevision` cases that formerly carried this row were deleted with the dead copy itself. Binding it needs the live smoke or an owner change to that row |
| AC-0013 | met | S | git-driver.ts:55-59,153-158; storage.ts:269,313-314; git-driver.test.ts:93-106 | requested ref, resolved ref and SHA are distinct fields in distinct columns with an explicit negative on the SHA slot |
| AC-0014 | met | S | VerdictSurface.tsx:117-118; VerdictSurface.test.tsx:50-60 | the one surface rendering a verdict renders the SHA unabbreviated, asserted by exact textContent equality |

### Process boundary, argument vector and environment — 11 met, 7 not met, 1 not verifiable here

| Criterion | Verdict | F | Bindings | Evidence and the mutation that reddens it |
| --- | --- | --- | --- | --- |
| AC-0015 | met | S | runtime-supervisor.test.ts:216-231; runtime-supervisor.ts:534-537 | asserts childPid differs from servicePid, servicePid is process.pid, and the child's own started.pid echoes childPid |
| AC-0016 | met | S | runtime-supervisor.test.ts:25-52,233-262 | a node:fs path recorder over the Service module graph shows zero paths under the materialization root, with a live positive control |
| AC-0017 | met | S | runtime-supervisor.test.ts:264-298; runtime-environment.ts:62-89 | argv scanned for seven credential needles and the environment key set compared to a closed allowlist, with the database path present ambiently and absent in the child |
| AC-0018 | **not met** | S | runtime-supervisor.test.ts:300-324; runtime-child.ts:569-571,728-733 | only the diagnostics-never-on-stdout half is bound; nothing asserts stderr carries no protocol message |
| AC-0019 | met | S | runtime-supervisor.test.ts:326-345; runtime-child.ts:752-758 | with a real held descendant in the group every stdout line still parses as JSON while descendant output shows up in diagnostics |
| AC-0020 | **not met** | W | runtime-supervisor.test.ts:349-371; executable-identity.ts:42-48; runtime-supervisor.ts:859-864 | entry.shell is the literal false at every construction site, so the assertion compares a constant to itself; only the absolute-path clause reddens |
| AC-0021 | **not met** | W | runtime-supervisor.test.ts:373-409; runtime-child.ts:1110-1117 | the supervisor case asserts the separator on the init vector whose operand is Studio's own root; the vectors carrying transport-reported operands never run in automation |
| AC-0022 | **not met** | S | runtime-supervisor.test.ts:411-455; executable-identity.ts:91-119 | the case filters out the three identity vectors, leaving two to stand for every |
| AC-0023 | met | S | runtime-supervisor.test.ts:207-213,474-512; runtime-environment.ts:62-89 | every sampled descendant's environment compared by exact equality on names and values, with a size positive control |
| AC-0024 | not verifiable here | N / S in smoke | runtime-supervisor.test.ts:514-519; live-smoke.test.ts:24-26,97-116 | the distinguishing clause needs an https endpoint AC-0148 forbids; the residual no-other-environment clause is bound |
| AC-0025 | met | S | runtime-supervisor.test.ts:523-623; executable-identity.ts:153-163 | both legs asserted, the sampled group against the permitted check and an exhaustive audit with a presence assertion |
| AC-0026 | met | S | runtime-supervisor.test.ts:625-650; executable-identity.ts:86-125 | resolved path absolute and not the shim, the version line, the exec-path re-check, and exactly two reads with none after resolution |
| AC-0027 | met | S | runtime-supervisor.test.ts:652-694; runtime-child.ts:820-848 | probes equal the canonical search list as an ordered prefix, and an all-absent list yields no interpreter, ruling out a PATH fallback |
| AC-0028 | **not met** | W | runtime-supervisor.test.ts:696-712; source-inspection.ts:668-679 | compares environment names and never values; a second production caller runs both probes under a different environment no test reaches |
| AC-0029 | met | S | runtime-supervisor.test.ts:716-849; supervised-bounds.test.ts:70-226 | leadership read from the live group and all four triggers exercised, each ending with groupGone and dead sampled descendants |
| AC-0030 | met | S | runtime-supervisor.test.ts:770-795; runtime-supervisor.ts:742 | real descendants asserted alive before shutdown and dead after, over the whole sampled group rather than the child alone |
| AC-0031 | met | S | runtime-supervisor.test.ts:797-849; runtime-supervisor.ts:671-684 | observes a real breach of an injected aggregate bound, SIGKILL exit, cleared group, and the aggregate recomputed from per-pid samples |
| AC-0154 | **not met** | S | runtime-supervisor.test.ts:853-968; source-inspection.ts:566-570; spec.md:246 | the three signalling obligations are strongly bound, but inspectInRuntime maps already-in-flight to a condition the criterion says it must not be |
| AC-0159 | **not met** | S | per-request-state-root.test.ts:194-285; runtime-child.ts:202-214 | both environments pinned and the Service-side call site bound with a guard-the-guard, but the Runtime-side rendering is reached by no case |

### Provisional contract — 12 met

| Criterion | Verdict | F | Bindings | Evidence and the mutation that reddens it |
| --- | --- | --- | --- | --- |
| AC-0032 | met | S | trial-result.ts:17,194-193; runtime-child.ts:201-208,1082-1100; runtime-supervisor.ts:469; source-inspection.ts:762-780; trial-result-line.test.ts:200-258 | both legs live: the child holds the canonical name, compares it against the delivered one and refuses before claiming a state root, and the Service refuses a result naming another contract. Replacing either guard with `false` reddens one case each; the child's literal is pinned against `TRIAL_CONTRACT` by a source audit, because the delivery assertion alone compares the constant with itself |
| AC-0033 | met | W | trial-result.ts:86-90; trial-result.test.ts:62-91; source-inspection.ts:603; trial-enrichment-seam.ts:68 | charset and uniqueness over 50 mints; the no-client-input clause rests on an arity check on the unwired seam, never on the live mint site |
| AC-0034 | met | S | trial-result.ts:197-199; source-inspection.ts:603-610,828-831; trial-result-line.test.ts:280-299 | `inspectInRuntime` holds the identifier it minted at :602 and passes it to the comparison at :831; substituting `undefined` reddens the mismatch case |
| AC-0035 | met | S | trial-result.ts:187-215; source-inspection.ts:775-840; trial-result-line.test.ts:311-433 | the callerless normalizer now has its one live caller at :824, running before any field is copied or persisted; dropping `removalOutcome` from the full-shape check reddens the non-conforming case |
| AC-0036 | met | S | trial-result.ts:201-215; source-inspection.ts:747-756,836-846; trial-result-line.test.ts:311-433 | the live refusal carries `result-invalid-studio` with a cause naming which of the six Studio-side failures fired, and the outcome carries no `result`; a case asserts all seven refusals emit pairwise-distinct diagnostics, so collapsing any two reddens it |
| AC-0037 | met | S | trial-result.ts:296-334; runtime-supervisor.ts:553,571-574,766-768; runtime-supervisor.test.ts:972-1002, control :1023-1031 | BoundedResultReader wired to a real child; asserts consumption stopped so the post-noise completed line was never parsed |
| AC-0038 | met | S | trial-result.ts:16-27,112-123; runtime-child.ts:1313-1343; source-inspection.ts:828-831; trial-result-line.test.ts:439-528 | a real child writes all five, and the Service composes the declared marker from the child's own declared read. The resolved SHA is bound against a value the plan carried rather than the empty default, with the absent case beside it. **The removal outcome is now a closed set** (*Canonical values*, *Removal outcomes*), so `"probably"` is refused rather than conforming, and a source audit pins the child's three literals against it; dropping `removalOutcome` from the line, hard-coding the marker to `null`, or widening the set each reddens cases |
| AC-0039 | met | S | trial-result.ts:229-245; source-inspection.ts:509-514; trial-result-line.test.ts:475-528 | every repository-derived value in the result is marked on the live path, and the persisted map at :509-514 is pinned to the markers the normalizer assigns; re-marking the declared marker `studio-produced`, or drifting one entry of the persisted map, reddens one case each. **The 2026-09-23 note said `requestedRef` is never marked; that clause is withdrawn** — AC-0039 reaches values *in the trial result*, and `requestedRef` is not one of them and is not repository-derived |
| AC-0040 | met | S | source-inspection.ts:424-434; source-inspection-storage.test.ts:187-206; connected-source.test.ts:180-190 | drives the real storage path and reads markers back off the row, so survival into the persisted representation is proven live |
| AC-0041 | met | S | trial-enrichment-seam.ts:1-81; trial-result.test.ts:307-332 | walks every .ts for the seam import and pins the importer list to exactly one test file, a named non-empty expectation |
| AC-0042 | met | S | trial-enrichment-seam.ts:43-55,62-81; trial-result.test.ts:334-372 | every field run through looksLikeFilesystemPath, key set pinned to four names, positive control over five real path shapes |
| AC-0155 | met | S | trial-result.ts:354-391; runtime-supervisor.ts:554-556,628-630,749,769-772; runtime-supervisor.test.ts:1005-1021 | buffer wired to the real child's stderr; asserts elision, positive discarded count, marker text, and result unaffected |

### Trusted inspector, and reading the version marker — 13 met, 4 not met

| Criterion | Verdict | F | Bindings | Evidence and the mutation that reddens it |
| --- | --- | --- | --- | --- |
| AC-0043 | **not met** | W | inspector-locator.ts:192; source-inspection.ts:799-830; inspector-locate.test.ts:359-432 | the locator has a live caller now and the resolved path, pack name and pack version reach the lead — but **the two file digests do not**, and the four values live in a rendered sentence rather than a record. AC-0043 asks Studio to *record* them with each inspection, and neither the trial result nor the `source.get` projection has a field for them. Adding one is a contract change; registered at `connect-orient-inspector-identity-has-nowhere-to-be-recorded` |
| AC-0044 | met | S | inspector-locator.ts:192-275; source-inspection.ts:820-830; inspector-locate.test.ts:359-432 | the locator is called on the live path, and a pack that does not match the pin reaches the lead as its own named mismatch rather than the generic sentence; "rather than being used" holds because nothing executes what it returns. Replacing the locator call with `false` reddens two cases |
| AC-0045 | met | S | inspector-locator.ts:215-233; source-inspection.ts:653-664,820-826; inspector-locate.test.ts:359-432 | the materialization root reaches the locator as **Studio's own computed value** — `reserveStateRoot` created the root and `per-request-state-root.ts:234` derives the child from it, so it never crosses the process boundary. **An earlier version of this cell said the opposite**, crediting the child's `started` line as the authority; nothing reads that line, and the claim inverted the trust rule this slice applies everywhere else. An inspector resolving inside the root is refused by name; dropping the root from the locator call reddens the containment case |
| AC-0046 | met | S | inspector-locator.ts:292-325,327-345; source-inspection.ts:809-814; inspector-locate.test.ts:77-222 | **the flag-versus-version defect is fixed.** `selectConformingInterpreter` decides from the version the interpreter reported, not from the `conforming` boolean the child computed, and a version that cannot be read at all is refused rather than admitted. Cases assert both directions — a conforming flag on 3.9.6 is refused, a false flag on 3.14.7 is not — so neither reading passes. Restoring the flag consumption, admitting an unreadable version, or ignoring the minor component each reddens |
| AC-0047 | met | S | source-inspection.ts:637-643; declared-read.test.ts:703; absence-proofs.test.ts:122-150 | production returns inspector-unavailable when nothing refused, and a live process-tree probe with a positive control shows no repository skill executable starts |
| AC-0048 | met | S | inspector-locator.ts:327-354; source-inspection.ts:799-815; inspector-locate.test.ts:77-222 | the requirement-naming refusal has a live caller; the production diagnostic names the required version and what each probe reported, and an absent `interpreter` line is treated as no interpreter rather than as a conforming one. Never consulting the probes reddens three cases |
| AC-0049 | met | S | git-driver.ts:24; absence-proofs.test.ts:303-326; supervised-bounds.test.ts:223-236 | a real hostile fixture materializes the declaration as data while outside/ and .git/modules stay absent, and every vector carries the pin |
| AC-0051 | met | S | runtime-child.ts:983-1009; supervised-bounds.test.ts:151-221 | a real child with a 6000-file writer is stopped on the first sample past a 300-file bound, tolerance read from the sampler's own reported interval |
| AC-0052 | met | S | runtime-child.ts:1041-1055; supervised-bounds.test.ts:70-118 | a 5s resolution hold under a 500ms deadline is SIGKILLed with a diagnostic naming resolution, and the 30s canonical default is pinned |
| AC-0053 | met | S | runtime-child.ts:1081; supervised-bounds.test.ts:124-143 | a child holding itself 10s under a 700ms deadline is killed with its own diagnostic and groupGone true, paired with an inside-deadline case |
| AC-0054 | met | S | runtime-child.ts:618-621; runtime-supervisor.ts:499; declared-read.test.ts:107-127 | now on the live path: the Service ships the canonical surface in the plan vector and a real child refuses secrets.toml with zero reads |
| AC-0055 | **not met** | S for the file-count leg | runtime-child.ts:606,652-658; runtime-supervisor.ts:500-502; declared-read.test.ts:140-150,172-189 | the file-count leg binds ordering observably — `reads: []` proves nothing was opened — but the byte-bound leg asserts only the refusal, the diagnostic and an undefined value, none of which a read-then-check implementation would fail. Same gap AC-0075 is recorded not met for, judged the same way. Mutation that should redden and does not: move the size check at `runtime-child.ts:652` below the `readFileSync` at `:668` |
| AC-0056 | met | S | production `declared-value-reader.ts:188-195` from `runtime-supervisor.ts:960`, and `guarded-parse.ts:193-202` from `validator.ts:958` and `runtime-supervisor.ts:588`; bound by `guarded-parse.test.ts:26,41`, `validator.test.ts:69,164`, `northbound-guard.test.ts:63,80` and `declared-value-reader.test.ts:142-177` | the inspector-output limb is inapplicable under the 2026-09-22 narrowing; both remaining limbs measure bracket depth over the text before the parse, and every site pairs an over-bound refusal with an at-bound admission so the comparison itself is bound. Mutation: raise `PARSE_NESTING_DEPTH_BOUND` at `guarded-parse.ts:36`, or move the depth check at `declared-value-reader.ts:188` after the rebuild — `declared-read.test.ts:266`, `northbound-guard.test.ts:63` and `validator.test.ts:69` redden |
| AC-0057 | met | S | production `guarded-parse.ts:48-68,205-207` and `declared-value-reader.ts:243-274` from `runtime-supervisor.ts:970`; bound by `guarded-parse.test.ts:126,141,155`, `declared-read.test.ts:248`, `northbound-guard.test.ts:129,153,176` and `validator.test.ts:101,334,375` | all three clauses hold at each in-reach site: the reviver drops inadmissible keys during the parse, the rebuild gives every object a null prototype at any depth, and normalization copies only criterion-named fields onto a freshly constructed target. Mutation: return the parsed value directly from `guarded-parse.ts:214`, or swap `Object.create(null)` for `{}` at `:58` — `guarded-parse.test.ts:141`, `northbound-guard.test.ts:153` and `validator.test.ts:334` redden |
| AC-0058 | met | W | declared-value-reader.test.ts:152-172 | inapplicable as the spec states and the absence is checked, but via a manifest-key check rather than a scan of parse sites |
| AC-0059 | **not met** | W | runtime-supervisor.ts:584-591; state-vocabulary.ts:206,211; source-inspection.ts:504-518 | the declaration-file branch is fully bound live, but the Studio-produced parse at :588 pushes a refused line to nonProtocolStdoutLines with no diagnostic, stop reason or routing |
| AC-0060 | **not met** | W | declared-value-reader.test.ts:232-261; runtime-supervisor.ts:970 | only the reader's output shape is bound; the criterion is about displayed values and no rendering surface asserts it |

### Version honesty and the verdict, and path confinement — 8 met, 8 not met

| Criterion | Verdict | F | Bindings | Evidence and the mutation that reddens it |
| --- | --- | --- | --- | --- |
| AC-0061 | met | S | trial-result.ts:136-150; source-inspection.ts:310,802-815; trial-result.test.ts:374-385; trial-result-line.test.ts:374-394 | `deriveVerdict` covers all four cells plus the incomplete row and has a real production caller at :310. The Studio-side refusal at :799-815 — a result carrying `workspacePresent`, or `status: "completed"`, is refused because no trusted inspector runs and the mapping would otherwise turn the claim into a verdict — is now **contract** rather than a code comment: *Boundaries*, *Always do* states it, and states that relaxing it when an inspector first runs is a contract change |
| AC-0062 | met | W | trial-result.ts:136-141; source-inspection.ts:310; state-projection.test.ts:298-318 | held structurally, but every test runs over the callerless normalizer and one compares a projection to itself |
| AC-0063 | met | S | trial-result.ts:157-161; source-inspection.ts:315; trial-result.test.ts:387-390 | deriveCondition is the only producer of malformed in non-test source and is the pipeline's condition site |
| AC-0064 | **not met** | W | source-inspection.ts:293-297; trial-result.ts:254 | **the recorded reason is superseded.** It read "the live record hardcodes declaredVersionMarker null and never overwrites it"; Step C composes both fields from the validated result at :293-297 and `source-inspection.test.ts` drives them, so the first clause is now bound. It stays not met on its **second** clause: "a completed inspection that raises no condition-bearing finding carries the `ok` condition" needs a completed inspection, and none exists while no trusted inspector runs |
| AC-0065 | **not met** | W | source-inspection.ts:293-297; runtime-supervisor.ts:973; trial-result-line.test.ts:443-461 | **the recorded reason is superseded.** It read "the ok variant carries no marker field, so versionUnverified is unreachably false in production"; it is reachable now and a live case asserts it true under `inspector-unavailable`. It stays not met on the universal: "whatever its verdict and whatever its condition" is bound for one condition, and the conditions a completed inspection produces are unreachable while no inspector runs |
| AC-0066 | met | W | VerdictSurface.tsx:95-103; VerdictSurface.test.tsx:306-322 | the qualifier renders alongside both badges so composition is bound at the surface; weak because no production result can set the prop |
| AC-0067 | **not met** | W | trial-result.ts:404-411; source-inspection.ts:146,286; VerdictSurface.tsx:107-116 | observedVersions is called only from tests; the live marker is never assigned and the renderer displays neither value |
| AC-0068 | met | W | trial-result.ts:404-411; trial-result.test.ts:476-507 | an absence proof that no comparison exists, over a function with zero production callers |
| AC-0069 | **not met** | W | materialization.test.ts:29-75; hostile-fixture.ts:326-363; git-driver.ts:19 | the test inspects a checkout made by the test helper with its own vector, and one assertion is a tautology |
| AC-0070 | met | S | per-request-state-root.ts:226-239,285-295; per-request-state-root.test.ts:87-118 | mkdtemp inside the verified domain plus explicit 0700 on the root and each child, marker asserted outside the materialization root |
| AC-0071 | met | S | runtime-supervisor.ts:522-529; runtime-child.ts:188; disposal.test.ts:171-174 | the domain arrives on the vector with no environment fallback, and the child's own sweep line reports a domain differing from its TMPDIR |
| AC-0072 | **not met** | W | per-request-state-root.ts:109-136; sweep.ts:175; per-request-state-root.test.ts:52-84 | existence, link, directory and mode are bound and fail closed, but the owned-by-current-user clause has no test |
| AC-0073 | **not met** | W | runtime-child.ts:645-700; materialization-confinement.ts:78-104 | **the reason has changed.** The child now performs the criterion's own check — containment against the **resolved real path** on a segment boundary, both sides resolved because Darwin's state root sits under a `/var` link — so the clause about the only production reader doing `join` plus `lstat` no longer holds. It stays not met because **no case reaches it**: what it catches is an ancestor resolving elsewhere, the symlink rejection above it takes every case a repository can plant at the leaf, the root is created by the Runtime, and a bare name admits no ancestor. It is defensive depth, recorded as unfalsifiable, and no verdict rests on it. `resolveContainedPath` and `readContainedFile` remain production-callerless; the child cannot import them |
| AC-0074 | **not met** | W | runtime-child.ts:644-651; declared-read.test.ts:192-208; materialization-confinement.test.ts:104-121 | the live-path test binds only a directory; the FIFO case exercises the uncalled helper, the device case is refused for containment before kind, and a socket is tested nowhere |
| AC-0075 | **not met** | W | runtime-child.ts:645-669; materialization-confinement.ts:127-135; declared-read.test.ts:153-189 | both readers do order the check correctly, but no test asserts checked-before-read: a read-then-check implementation produces the same refusal |
| AC-0076 | met | S | per-request-state-root.ts:331-401; per-request-state-root.test.ts:322-340 | the walk lstats at each level and unlinks links rather than descending, with an outside witness re-read after removal |

### Disposal and cancellation, and persistence — 8 met, 6 not met

| Criterion | Verdict | F | Bindings | Evidence and the mutation that reddens it |
| --- | --- | --- | --- | --- |
| AC-0077 | met | S | disposal.test.ts:62-68; runtime-supervisor.ts:407-419,745; process-tree-observer.ts:242-247 | groupGone is a real ps poll of the spawned group, not a stub; leaving a live descendant after completed reddens it |
| AC-0078 | met | S | disposal.test.ts:126-137; per-request-state-root.ts:226-228 | two real inspections get distinct mkdtemp roots and the first is verified absent on disk before the second |
| AC-0079 | **not met** | S | disposal.test.ts:72-85,98-122; runtime-child.ts:1302-1308 | success and signal limbs bound to real existsSync post-conditions, but removal on failure has no test; deleting dispose("failed") stays green |
| AC-0080 | **not met** | W | per-request-state-root.test.ts:121-190,342-361; per-request-state-root.ts:260-308 | naming, prefix classification and marker-removed-last bound, but written-before-any-other-child and created-exclusively are not; the test reads only the final listing |
| AC-0081 | **not met** | S | sweep.test.ts:94-527; unbound sweep.ts:228-231, :114-116, :304-311 | three limbs, both age gates and the token decline bound to on-disk outcomes, but the same-uid gate, the non-regular-file marker refusal and one decline have no case |
| AC-0082 | met | W | disposal.test.ts:140-186; runtime-supervisor.ts:511; runtime-child.ts:364-365 | the sweep line appears in the child's stream, so moving the sweep into the Service reddens it; the without-reading clause is only structural |
| AC-0083 | met | S | sweep.test.ts:174-378; per-request-state-root.test.ts:342-361; sweep.ts:181-197 | declines name the limb and input class, removal failures return non-empty diagnostics, a planted secret is proven absent from the stream |
| AC-0084 | **not met** | W | connected-source.test.ts:284-295; source-inspection.ts:573-581; source-inspection.test.ts:296-326 | the only terminates assertion is a flag on a test-supplied closure, and the pipeline cancel test injects a mock that never observes the signal |
| AC-0085 | **not met** | W | connected-source.test.ts:297-316; source-inspection-storage.test.ts:94-117; service.ts:218 | the incomplete-vs-cancelled half is bound, but no trial Runtime from a prior session is aborted: nothing in service.ts aborts in-flight runs on shutdown |
| AC-0100 | met | S | source-inspection-storage.test.ts:67-92; connected-source.test.ts:126-137 | owner and repository read back from a closed-and-reopened real database with a cold in-memory map |
| AC-0101 | met | S | source-inspection-storage.test.ts:83-85; connected-source.test.ts:139-151 | requested ref, resolved SHA and inspectedAt asserted after a real reopen against literal values |
| AC-0102 | met | S | connected-source.test.ts:110-165; source-inspection-storage.test.ts:88-89 | verdict and diagnostics both read back over a reopened database and a fresh composition |
| AC-0103 | **not met** | W | VerdictSurface.test.tsx:327-345; useInspection.ts:74,159-182; preload/index.ts:70-75 | rendering half strong, but nothing binds restored: nothing persists the source id and the preload exposes no list-or-latest call |
| AC-0104 | met | S | connected-source.test.ts:194-278; source-inspection-storage.test.ts:143-207 | the bound is measured over every provenance-marked repository-derived value, and a widened field is counted with no test edit |

### Honest states — 4 met, 10 not met

| Criterion | Verdict | F | Bindings | Evidence and the mutation that reddens it |
| --- | --- | --- | --- | --- |
| AC-0086 | **not met** | W | state-vocabulary.ts:49-55; state-projection.test.ts:36-47; source-inspection.ts:212-219 | distinct-label bound; separate-result fails because every resolution failure writes source-unavailable and source-rate-limited is unreachable |
| AC-0087 | **not met** | W | state-vocabulary.ts:69-149; StateBadge.tsx:39-50; tokens.css:649-681 | label reaches the surface, attention never does: StateBadge emits no data-attention and no test ties a rendered state to its attention |
| AC-0088 | **not met** | W | state-projection.test.ts:70-90; state-vocabulary.ts:155-224; source-inspection.ts:604-618 | the reason comparison is a tautology reading the same object, and eleven of thirteen rows are never emitted as a stopReason |
| AC-0089 | **not met** | W | state-projection.test.ts:98-122; VerdictSurface.tsx:225-227 | projection sweep non-vacuous, but the rendered lead paragraph is asserted nowhere |
| AC-0090 | **not met** | W | state-projection.test.ts:99-111; VerdictSurface.tsx:228-230 | same split as AC-0089; the found-instead paragraph is asserted nowhere |
| AC-0091 | met | S | state-vocabulary.ts:294-296; state-projection.test.ts:93-135; VerdictSurface.test.tsx:174-198 | attribution taken from the reason not the state, and read off the rendered DOM for two reasons giving network vs repository |
| AC-0092 | **not met** | W | state-vocabulary.ts:297-299; VerdictSurface.tsx:236-238 | retryability bound in the projection; the rendered Retrying sentence is never asserted |
| AC-0093 | met | S | state-projection.test.ts:148-178; declared-read.test.ts:944-958; source-inspection.ts:572-583 | non-tautological both directions, pins the refused-result route rather than the inspector-unavailable fall-through |
| AC-0094 | **not met** | N | state-projection.test.ts:180-189; trial-result.ts:157-161; VerdictSurface.tsx:136-142 | the test asserts a different state than the criterion names; in production condition is null so ConditionDetail never renders |
| AC-0095 | **not met** | W | state-vocabulary.ts:233-236; VerdictSurface.tsx:243-251 | actions bound only for a degraded condition; on the real non-Agent-Ready result condition is null and no actions render |
| AC-0096 | **not met** | W | state-vocabulary.ts:313-319; source-inspection.ts:210-219 | unreachableCondition has no production caller; the real path writes source-unavailable with no rate-limit inspection |
| AC-0097 | met | S | state-vocabulary.ts:280-283; VerdictSurface.test.tsx:200-227; source-inspection.ts:256-268 | both branches reach a rendered surface and are asserted there, value plumbed from the service |
| AC-0098 | **not met** | W | state-vocabulary.ts:326-353; VerdictSurface.tsx:127-133; ConnectRepositoryForm.tsx:115-122 | strong sweep with a positive control, but hand-written state copy outside userVisibleCopy is unbound |
| AC-0099 | met | S | state-vocabulary.ts:258-304; VerdictSurface.test.tsx:229-249 | identifier asserted present in the collapsed secondary details and absent from the detail copy |

### Desktop surface — 9 met, 6 not met, 1 not verifiable here

| Criterion | Verdict | F | Bindings | Evidence and the mutation that reddens it |
| --- | --- | --- | --- | --- |
| AC-0105 | met | S | ConnectRepositoryForm.tsx:87-89; InspectionSurface.test.tsx:59-65; App.tsx:242 | submit control queried by accessible name through the composed surface the app mounts; renaming the button text reddens it |
| AC-0106 | met | S | ConnectRepositoryForm.tsx:45-64; InspectionSurface.test.tsx:67-73 | exactly one textbox and no token/password/credential label; adding a password input reddens queryByLabelText |
| AC-0107 | met | S | ConnectRepositoryForm.tsx:107-124; state-vocabulary.ts:129-131; InspectionSurface.test.tsx:75-79 | unconnected badge label and the what-connecting-does prose both asserted; deleting UnconnectedNotice reddens |
| AC-0108 | met | S | InspectionSurface.test.tsx:276-306; state-vocabulary.ts:360-369; ConnectRepositoryForm.tsx:66-77 | five refusal causes rendered and proved pairwise distinct; collapsing the rejection to a fixed string drops seen.size below 5 |
| AC-0109 | met | S | ConnectRepositoryForm.tsx:58-63; presentation.ts:198-200; InspectionSurface.test.tsx:89-121 | association, aria-invalid and focus return each asserted; changing the url-rejected focus target reddens |
| AC-0110 | met | S | ConnectRepositoryForm.tsx:70-77; InspectionSurface.test.tsx:123-145 | hostile string present as text with zero elements; dangerouslySetInnerHTML reddens the querySelectorAll check |
| AC-0111 | met | S | ConnectRepositoryForm.tsx:52,79-84,87; InspectionSurface.test.tsx:156-171 | disable, running sentence and pointer at cancel all asserted; deleting the busy paragraph reddens |
| AC-0112 | **not met** | W | InspectionSurface.test.tsx:186-231; ConnectRepositoryForm.tsx:90-97 | both-offer-cancel asserted only for resolving; removing the cancel affordance in inspecting leaves the suite green |
| AC-0113 | met | S | VerdictSurface.tsx:123-134; VerdictSurface.test.tsx:84-103; presentation.ts:202-204 | they-stopped-it and how-to-restart naming the control both asserted; deleting the second paragraph reddens |
| AC-0114 | not verifiable here | W | VerdictSurface.tsx:65-93,112-121; VerdictSurface.test.tsx:18-61; tokens.css:691-699 | role assignment bound by class name, but highest-contrast and largest-type is a rendered-typography claim no test reads; swapping the type tokens leaves gates green |
| AC-0115 | **not met** | W | VerdictSurface.test.tsx:105-127; InspectionSurface.test.tsx:123-145; unbound at InspectionSurface.tsx:133, :79-85, VerdictSurface.tsx:275 | hostile-value cases missing for progress states, secondary diagnostic and the live region; announced-as-literal-text unbound anywhere |
| AC-0116 | **not met** | W | main/index.ts:130-142; main/index.test.ts:124-140,259-264; VerdictSurface.test.tsx:129-149 | host-window half strongly bound, but the sink sweep renders only VerdictSurface, so the connect surface and progress section are never swept |
| AC-0117 | met | S | VerdictSurface.tsx:261-278; VerdictSurface.test.tsx:266-279,229-249 | raw child output and an action-free diagnostic on a closed secondary details; adding open reddens both |
| AC-0118 | **not met** | W | VerdictSurface.test.tsx:281-292 | criterion says no surface but the sweep renders one component; adding a canvas to the progress section leaves it green |
| AC-0119 | **not met** | W | VerdictSurface.test.tsx:63-81; VerdictSurface.tsx:72-93 | only the second sentence is asserted, for one verdict/condition pair; no sweep over degraded conditions |
| AC-0157 | **not met** | W | presentation.ts:41-46; presentation.test.ts:49-59 | labels asserted only as constants; not-agent-ready is never rendered anywhere in the renderer suite |

### Quality floor — 6 met, 7 not met, 1 not verifiable here

| Criterion | Verdict | F | Bindings | Evidence and the mutation that reddens it |
| --- | --- | --- | --- | --- |
| AC-0120 | met | S | inspection-hue-separation.test.ts:23,25-47,64-115; delta-e2000.ts:193 | dE2000 computed from shipped tokens.css for 3 hues against all 15 members of four families, both themes, bound restated and roster-length guarded |
| AC-0121 | **not met** | W | presentation.test.ts:13-27; presentation.ts:54-68; tokens.css:600-644 | label and data-shape distinctness total over 11 states, but nothing connects a data-shape value to the CSS that draws it |
| AC-0122 | met | W | presentation.test.ts:13-27; StateBadge.tsx:39-50 | a text label always renders beside an aria-hidden shape span over a SHAPES map total across 11 states, so hue is never sole carrier |
| AC-0123 | **not met** | W | inspection-contrast.test.ts:47-148; tokens.css:580-583,692-697 | pairings are a hand-written roster with only a length guard; nothing derives them from the CSS or asserts the badge label's actual pairing |
| AC-0124 | **not met** | W | InspectionSurface.test.tsx:309-375; inspection-contrast.test.ts:114-127; tokens.css:145-148 | focus indicator checked for colour only, the width/offset half conceded unasserted, and every-control misses Refresh status and the details summary |
| AC-0125 | met | S | presentation.ts:161-208; presentation.test.ts:69-132; InspectionSurface.tsx:44-52 | transition is the sole focus decision point; all 11 states for both provenances require a named target for user and null plus an announcement for system |
| AC-0126 | met | S | InspectionSurface.test.tsx:173-184; presentation.test.ts:109-120 | drives a real submit, waits for the disable, asserts activeElement is cancel, backed by a unit assertion over both in-flight states |
| AC-0127 | **not met** | W | InspectionSurface.test.tsx:353-358; VerdictSurface.test.tsx:295-302 | focus order exercised by exactly one adjacent pair; nothing checks order on the verdict surface or past Connect |
| AC-0128 | met | S | presentation.test.ts:134-211; InspectionSurface.test.tsx:234-254 | announcement equals the entered state's own label for all 11 states, non-change announces nothing, exactly one polite region before and after |
| AC-0158 | met | S | presentation.ts:180-222; presentation.test.ts:213-230; InspectionSurface.test.tsx:256-273 | resultAnnouncement yields the verdict when reached and the condition label when no-verdict, end to end through the single live region |
| AC-0129 | **not met** | W | ProgressPulse.test.tsx:9-48; tokens.css:775-781; visual-evidence.mjs:727-733 | cadence, per-tick restatement and not-a-live-region bound, but state-change-motion-omitted is not: the reduced-motion scenario only asserts the媒 query is in force |
| AC-0130 | **not met** | W | visual-evidence.mjs:684-693,1269-1401; InspectionSurface.tsx:132-139 | real occlusion hit-test with a genuine vacuity guard, but captured states never render cancel or retry and the URL is a fixed literal |
| AC-0131 | not verifiable here | W | tokens.css:64,744-748; visual-evidence.mjs:1203-1222 | needs the running app; separately the CSS floor is inert because control-height already clears 24px |
| AC-0132 | **not met** | W | visual-evidence.mjs:695-721,1362-1366; tokens.css:733-742 | the verdict surface is never captured by any scenario and the narrowest viewport is 720px, so neither clause is bound |

### Security proofs, and suite-level evidence — 9 met, 12 not met

| Criterion | Verdict | F | Bindings | Evidence and the mutation that reddens it |
| --- | --- | --- | --- | --- |
| AC-0133 | **not met** | W | hostile-fixture.ts:335; absence-proofs.test.ts:83; git-driver.ts:18 | the proof toggles the fixture's own literal, never pinnedGitConfigurationArgs, and the hook sits where git's default path would not run it |
| AC-0134 | **not met** | N | hostile-fixture.ts:169-184; absence-proofs.test.ts:96 | git checkout never runs a package.json script — a guardless checkout was reproduced and the probe log stayed empty; no production mutation reddens it |
| AC-0135 | **not met** | N | hostile-fixture.ts:186-193; absence-proofs.test.ts:123 | a file under .agents/skills is never executed by checkout, same guardless reproduction, empty log; the control execs the file itself |
| AC-0136 | **not met** | W | hostile-fixture.ts:338-371; absence-proofs.test.ts:161 | refusal comes from the fixture's own literals and the control observes the source object database with no worktree |
| AC-0137 | **not met** | N | hostile-fixture.ts:197-206; absence-proofs.test.ts:197 | .gitattributes names filter=probe but no smudge or clean command is ever configured, so no filter can run with or without a guard |
| AC-0138 | **not met** | W | state-projection.test.ts:271-319 | verdict and status legs bind production, but the state clause compares two identical calls with no instruction in either |
| AC-0139 | **not met** | W | hostile-fixture.ts:339; absence-proofs.test.ts:224-233 | the regular-file outcome comes from a fixture literal and the control lstats the source tree where the link always is |
| AC-0140 | met | S | materialization-confinement.ts:112; absence-proofs.test.ts:251-294 | both clauses run against production readContainedFile, sibling-prefix and traversal, plus a non-blanket admit |
| AC-0141 | **not met** | W | absence-proofs.test.ts:304-321; git-driver.ts:23 | the materialized leg is a no-op: the fixture commits a .gitmodules file with no gitlink and checkout recurses no submodules by default |
| AC-0142 | met | S | source-identity.ts:28; git-driver.ts:143-147; absence-proofs.test.ts:337-343 | production resolveRevision refuses the reported ref before any vector is built, and the hostile upload-pack ref is refused by the same function |
| AC-0143 | met | S | inadmissible-keys.ts:35; guarded-parse.ts:21-29; absence-proofs.test.ts:376-449 | both TOML and JSON arms parse the materialized hostile files through the production guards, with depth, in-array and non-blanket legs |
| AC-0144 | met | W | absence-proofs.test.ts:457-514; runtime-child.ts:23,37,38 | leg 1 is near-tautological but leg 2 statically audits the real import list of the one process rooted at the state root |
| AC-0145 | **not met** | W | absence-proofs.test.ts:525-569; source-inspection.ts:334 | the fetch stub wraps a fixture-only git spawn, so no Studio code runs and the real requests go through a subprocess the stub cannot see |
| AC-0146 | **not met** | N | connected-source.test.ts:332-371 | the planted token is read from the fixture but the persisted record never carries it; the negative runs over a path the credential never reaches |
| AC-0147 | **not met** | N | hostile-fixture.ts:403-516; hostile-fixture.test.ts:111-129 | the controls do not all remove a guard at the observation level; deleting every pinned configuration entry leaves all 14 controls green |
| AC-0148 | **not met** | N | e2e/connect-and-orient.test.ts:85-101,:138-160,:83; source-inspection.ts:334 | only :163 and :205 are gated; the ungated cases at :91 and :143 submit the accepted URL and connect fires the pipeline, so pnpm test reaches github.com |
| AC-0149 | met | S | hostile-fixture.test.ts:36-100; hostile-fixture.ts:18-67,134-153 | exact-equality assertions pin all 19 cases and the 18 criterion-to-case entries, with the checkout-observable entry built into the source ODB before checkout |
| AC-0150 | met | N | docs/product/research/connect-and-orient-trial-runtime-evidence.md:17-142 | all twelve required subjects have their own section; no test or governance check reads the note |
| AC-0151 | met | N | docs/product/research/connect-and-orient-trial-runtime-evidence.md:51-72 | a six-row table classifies each held item Needed or Inherited with its ground |
| AC-0152 | met | N | docs/product/research/connect-and-orient-trial-runtime-evidence.md:186-190 | states in bold which properties were mandated by the specification rather than discovered, and how to discount it |
| AC-0153 | met | N | docs/product/research/connect-and-orient-trial-runtime-evidence.md:153-179,:7 | each Stage 2 criterion has an Observed paragraph and the note carries no Pass or Fail verdict |
