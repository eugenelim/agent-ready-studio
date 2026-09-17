# Verification ledger — Connect and Orient

Execution observations for run `f87c797b-8bed-46c2-96fd-e8d22fb8eb3d`. This file
records observed behaviour; it holds no obligations. The approved `spec.md` and
`plan.md` retain the obligations, and this ledger is deliberately not hash-pinned.

## t1-evidence

**T1 — the hostile corpus exists and every probe is proven non-vacuous.** Gates AC-0149.

- Files: `apps/studio-service/src/trials/connect-and-orient-runtime/test/hostile-fixture.ts`
  and `hostile-fixture.test.ts`.
- Approved red stub materialized byte-identically from `plan.md`; verified by direct
  comparison against the plan's fenced block, and re-verified after two later
  formatter passes.
- Corpus enumerates 19 cases and binds them to criteria: AC-0133 through AC-0146 plus
  the bounds criteria AC-0037, AC-0050, AC-0051, AC-0075 and AC-0104. This makes the
  phrase "the bounds criteria" in AC-0149 concrete and enumerable.
- AC-0149's corrected construction rule is exercised: the checkout-observable
  `.git`-variant case is built into the source object database before checkout, and a
  test asserts its presence there rather than on disk afterwards.
- Gates at completion: lint 0, typecheck 0, test 0 (243 tests / 24 files at that point),
  build 0, `verify` 0, `git diff --check` 0, both spec linters 0.

**Observed fragility.** `AC-0147 a hook probe fires when the guard is removed` spawns a
real `git` checkout with hooks. It completed in 5500 ms against vitest's 5000 ms default
during one full-suite run and failed that run; it passed 3 of 3 runs in isolation
(41/41 each) and passed in every other full-suite run. The test is load-sensitive rather
than incorrect. Recorded, not repaired: repairing a completed task's timing is out of
T1's scope. Same class as the pre-existing Electron cold-cache timeout.

## t2-evidence

**T2 — a submitted URL becomes a canonical identity or a named refusal.** Gates AC-0001
through AC-0007 and AC-0010. AC-0008 and AC-0009 are deliberately not T2's; they were
moved to T3 before execution because a pure no-I/O module cannot observe a
remote-reported ref or a redirect.

- Files: `apps/studio-service/src/source-identity.ts` and `source-identity.test.ts`.
- Approved red stub materialized byte-identically from `plan.md`.

**Mutation proofs — 9 of 9 observed red.** Each mutation was applied, the test file run,
and the source restored by editing. No `git checkout`, `reset`, or `stash` was used.

| Invariant | Mutation | Observed |
| --- | --- | --- |
| Embedded credentials refused (AC-0003) | credential guard forced false | tests exit 1 |
| Scheme is https (AC-0002) | scheme check removed | tests exit 1 |
| Host is exactly `github.com` (AC-0002) | exact compare weakened to `endsWith` | tests exit 1 |
| Any explicit port refused (AC-0002) | `carriesExplicitPort` forced false | tests exit 1 |
| Path is the repository main page (AC-0004) | path widened to accept trailing segments | tests exit 1 |
| Owner/repository charset (AC-0006) | charset check disabled | tests exit 1 |
| Requested-ref charset (AC-0007) | ref check disabled | tests exit 1 |
| Fetch target built from canonical identity (AC-0010) | non-canonical text appended | tests exit 1 |
| Percent-decoding precedes charset validation (AC-0005/AC-0006) | decoding removed | tests exit 1 |

The last one is the load-bearing case: without decoding before validation, `%2F`
reaches the owner/repository value intact.

## t3-evidence

**T3 — a remote ref resolves to a verified exact commit.** Gates AC-0008, AC-0009,
AC-0011, AC-0012, AC-0013, AC-0014. **Complete under the narrowed AC-0009.** The
criterion's automated obligation is the presence of `http.followRedirects=false` on both
argument vectors, which the driver satisfies and which mutation 6 below proves
falsifiable. The behavioural observation is T13's manual smoke and is not T3's.

- Files: `apps/studio-service/src/trials/connect-and-orient-runtime/git-driver.ts` and
  `git-driver.test.ts`. The git driver is trial code and is imported by nothing outside
  the trial root.
- Approved red stub materialized byte-identically from `plan.md`.
- AC-0008 is enforced by reusing T2's `canonicalizeSource` on the remote-reported ref,
  rather than by a second copy of the ref charset.
- AC-0014 is discharged at its nearest in-process contract: the result exposes the exact
  40-character SHA and an abbreviation never replaces it. The rendered assertion is a
  deferred assertion for T12.
- AC-0022's completeness obligation (every `git` vector carries the *complete* pinned
  configuration) is T4's, not T3's. T3 pins only `http.followRedirects=false`; T4 must
  extend this to the full pinned set.

**Mutation proofs — 11 of 11 observed red**, applied and restored by editing.

| Invariant | Mutation | Observed |
| --- | --- | --- |
| Remote-reported ref charset (AC-0008) | charset check forced false | tests exit 1 |
| Resolved SHA is 40 lowercase hex (AC-0011) | exact-SHA check removed | tests exit 1 |
| Ref never occupies resolved SHA (AC-0013) | branch name assigned to `resolvedSha` | tests exit 1 |
| `HEAD` mismatch refused (AC-0012) | mismatch refusal forced false | tests exit 1 |
| Exact SHA retained in result (AC-0014) | SHA truncated to 12 chars | tests exit 1 |
| Redirect refusal on every vector (AC-0009) | `http.followRedirects=false` dropped | tests exit 1 |
| Absolute git executable (AC-0020) | `isAbsolute` guard removed | tests exit 1 |
| End-of-options marker on `ls-remote` (AC-0021) | `--` dropped | tests exit 1 |
| End-of-options marker on `fetch` (AC-0021) | `--` dropped | tests exit 1 |
| Checkout uses the fetched revision (AC-0012) | `FETCH_HEAD` replaced with `HEAD` | tests exit 1 |
| `HEAD` read inside the supplied root (AC-0012) | `cwd` omitted from `rev-parse` | tests exit 1 |

## ac-0009-redirect-proof-gap

> **SUPERSEDED on 2026-09-15** by `owner-decision-2026-09-15-narrow-ac-0009`. This
> section is retained because the `contract-amendment` engine event records it as the
> amendment's reason reference, and that record must stay readable. It describes the gap
> as it stood against the PRE-amendment wording of AC-0009. **Do not treat "What was
> missing" below as outstanding work: the loopback route it names was probed, found
> unreachable, and rejected by the owner.**

**The gap, as it then stood.** AC-0009 then required every redirect to be refused during
both resolution and materialization, observed against the git client that performs it.
Redirect handling lives in git's HTTP client, so observing it requires an HTTP exchange,
while AC-0148 required every added test to pass with no network access.

**What was proven, and still is.** The argument-level contract: `http.followRedirects=false`
is present on every resolution and materialization vector, and removing it fails a test
(mutation 6 in `t3-evidence`).

**What was then thought missing.** A hermetic git endpoint on loopback emitting redirects
during both `ls-remote` and `fetch`, plus a positive control. See
`probe-2026-09-15-git-transport-and-tls`: that route cannot be reached under the pinned
contract. **It is no longer outstanding work.** AC-0009 was narrowed so its automated
obligation is exactly the argument-level pin already proven, and the behavioural
observation moved to T13's manual smoke against the real remote.

## owner-decision-2026-09-15-loopback-https

> **SUPERSEDED on 2026-09-15** by `owner-decision-2026-09-15-narrow-ac-0009` below.
> This anchor is retained unchanged because the `contract-amendment` engine event
> records it as its owner-authority reference, and that record must stay readable.
> The decision it describes was reversed after probe evidence showed it unworkable.


The scope owner decided on 2026-09-15 to read AC-0148's "no network access" as
forbidding access to any remote service or non-loopback address, and to permit a
hermetic loopback endpoint for tests that can be satisfied no other way. The decision
was taken after being shown three options: permit loopback, accept a bounded known gap,
or narrow AC-0009 and move its behavioural claim to T13's manual smoke. The owner chose
to permit loopback because it is the only option that discharges AC-0009, and a loopback
endpoint contacts no remote service, which is the exposure AC-0148 exists to prevent.

This authorizes a controlled contract amendment to AC-0148's wording and the
corresponding T3 test obligation. It authorizes nothing else: no credential path, no
external network, and no widening of the permitted executables, environment allowlist,
pinned git configuration, or resource bounds.


## probe-2026-09-15-git-transport-and-tls

Commands Claude executed on this host while adjudicating the loopback proposal.

| Probe | Command shape | Result |
| --- | --- | --- |
| http under the transport pin | `GIT_ALLOW_PROTOCOL=https git ls-remote http://127.0.0.1:PORT/x.git` | `fatal: transport 'http' not allowed` |
| https, pinned config only | `git -c http.followRedirects=false ls-remote https://127.0.0.1:PORT/x.git` against a self-signed loopback TLS server | exit 128, `SSL certificate problem: self signed certificate` |
| https, plus a trust term | the same with `-c http.sslVerify=false` | exit 128, `repository not found` — TLS accepted, git proceeded |

These establish that a hermetic loopback endpoint is unreachable under the unchanged
contract: http is refused by `GIT_ALLOW_PROTOCOL=https`, and https requires
`http.sslVerify=false` or an equivalent CA trust term, which is absent from the pinned
`git` configuration and which AC-0022, AC-0023 and AC-0024 would forbid adding.

## owner-decision-2026-09-15-narrow-ac-0009

The scope owner decided on 2026-09-15, after the probe above and after two independent
reviews and their adjudications both returned the same indeterminate owner-choice stop,
to **reverse the AC-0148 widening and narrow AC-0009 instead**.

The owner was shown three options: authorize a named test-scoped TLS trust term, accept a
bounded known gap with AC-0009's text unchanged, or narrow AC-0009 so the contract matches
its evidence. The owner chose to narrow.

Effects, all applied in one action:

- AC-0148 returns to its original wording. No network surface is admitted. This deletes
  the two sustained secure-design concerns about listener binding, name resolution, and
  binding the proof's `git` process to the shipped environment, because the surface those
  concerns governed no longer exists.
- AC-0009's automated obligation becomes the presence of `http.followRedirects=false` on
  every resolution and materialization argument vector, which is falsifiable by dropping
  the key and is already proven. The criterion now states explicitly that it claims no
  automated observation of client behaviour.
- The behavioural observation moves to T13's manual smoke, which contacts github.com by
  design and already exists.
- Both Testing Strategy groups and T3's task prose were restated to match; T3's Approach
  no longer names the local-remote stand-in the transport pin refuses.

**What this costs, recorded plainly:** there is no automated regression guard on real
client redirect behaviour. A future change that removed redirect refusal in a way the
argument vector still satisfied would be caught only by the manual smoke. No security
control was widened to obtain this, and the contract no longer claims evidence that does
not exist.

## t1-test-timeout-2026-09-15

T1's fixture tests build real git repositories and, for the positive controls, spawn git.
Under concurrent machine load they exceeded vitest's 5000 ms default — 6888 ms, 9481 ms
and 12929 ms observed across three tests in one run — while passing 41/41 in three
consecutive isolated runs. Owner-approved repair: a file-level
`vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 })` in
`hostile-fixture.test.ts`. It changes no assertion and no behaviour, and it was placed at
file level rather than per test so the approved AC-0147 stub block stays byte-identical to
`plan.md`. Verified after the change: all three stubs still byte-identical, and
`hostile-fixture.test.ts` no longer appears in any failure.

## preexisting-flake-ac-32

`AC-32 serves, reloads, and closes cleanly within five seconds` in
`apps/studio-service/src/service.integration.test.ts` fails intermittently under load,
observed at 2063 ms against its own 2000 ms request timeout and at 3451 ms and 3639 ms in
earlier runs. **It is not this delivery's test** and the file is untouched by this work;
AC-0148 is scoped to tests this delivery adds. Recorded rather than repaired, because
fixing another delivery's test would broaden scope. It is the same class as the
pre-existing Electron cold-cache timeout the plan's Risks section already names. A gate
run that trips it should be repeated on an unloaded machine.

## t3-closure-2026-09-15

T3 completed under the narrowed AC-0009 with no further implementation: the driver already
carried `http.followRedirects=false` on every resolution and materialization vector, which
is the criterion's whole automated obligation, and mutation 6 in `t3-evidence` proves it
falsifiable. Gates at closure: lint 0, typecheck 0, test 0 (263 tests / 27 files), build 0,
`git diff --check` 0, both spec linters 0. Engine advanced to wave 2 (T4).

## probe-2026-09-15-process-boundary

Commands Claude executed on this Darwin host before implementing T4. Each settles a
mechanism a criterion depends on, so none of the six is re-derived during implementation.

| Probe | Observed | What it settles |
| --- | --- | --- |
| `spawn(detached: true)` then `ps -o pid,ppid,pgid -g <pgid>` | the child's pgid equals its pid; a grandchild inherits that pgid; both rows enumerate from the parent | AC-0029's group-leader claim and the parent-side enumeration AC-0025 needs |
| `process.kill(-pgid, "SIGKILL")` then `ps -g <pgid>` | `ps` exits 1, no such process group; both processes gone | AC-0029 and AC-0030 are observable from the parent |
| `ps -o pid,rss -g <pgid>` summed across rows, sampled 3 times | aggregate resident memory readable per group, 49.8 then 50.7 then 51.0 MiB against a deliberately growing child | AC-0031's aggregate sampling mechanism, given `setrlimit(RLIMIT_AS)` fails on this host |
| tight 10 ms `ps -g` sampling against a 250 ms-delayed `/bin/echo` | the short-lived grandchild was caught; exited processes linger as `<defunct>` until reaped, widening the window | AC-0025 is observable in practice, though sampling cannot prove completeness in principle — see the honesty note below |
| `ps -ww -o pid,command -E -p <pid>` against a live `git cat-file --batch` | git's full environment is externally readable | AC-0023 and AC-0024 are observable from the parent, not only by cooperative echo |
| the same probe against `/usr/bin/git` versus `/Library/Developer/CommandLineTools/usr/bin/git` | the `/usr/bin/git` shim re-execs through `xcrun` and its process carries five names beyond the allowlist — `__CF_USER_TEXT_ENCODING`, `SDKROOT`, `CPATH`, `LIBRARY_PATH`, `MANPATH`. The real binary, spawned directly with the same env object, carries **exactly** the allowlist and nothing else | **AC-0023 is satisfiable only if `git` is resolved past the shim.** See the resolution rule below |

**`git` resolution rule, derived and verified.** `git --exec-path` reports
`/Library/Developer/CommandLineTools/usr/libexec/git-core`; the real binary is that
directory's `../bin/git`. The derived path reports the same `git version 2.50.1 (Apple
Git-155)` and the same exec-path as the shim, and is root-owned. T4 therefore resolves
`git` by deriving it from the recorded exec-path rather than spawning `/usr/bin/git`. This
widens nothing: the *Permitted executables* row already admits "the resolved `git` binary"
without dictating how it is resolved, and AC-0026 already requires the exec-path to be
recorded.

**Honesty note on AC-0025.** Sampling observes what ran; it cannot prove that nothing else
ran between two samples. T4 therefore asserts AC-0025 on two legs: the sampled descendant
set contains only admitted executables, **and** every spawn site in Studio's own code uses
an absolute path drawn from the permitted set. The second leg is exhaustive over Studio's
spawns; the first corroborates it over git's. No criterion is amended for this, and the
residual is stated rather than implied: a process both unsampled and unspawned by Studio's
code would go unobserved.

## owner-decision-2026-09-15-per-request-state-ownership

The scope owner decided on 2026-09-15 how per-request on-disk state is owned, identified
and reclaimed, closing the blocking design question the spec's Follow-ons recorded from
pre-EXECUTE rounds 2 and 3. It is **one layout decision**, taken as one action, because
the round-3 attempt to patch its five symptoms separately produced the live-orphan
criterion that was cut and whose number is now deliberately unused.

**The layout.** The per-request state root owns the request; the materialization root
becomes a child of it.

```
<sweep domain>/                  fixed, per-user, 0700
  <mkdtemp request root>/        per-request state root, 0700, unpredictable
    marker                       Studio-written ownership marker, OUTSIDE the tree
    tree/                        the materialization root — git's checkout target
    home/                        the per-request HOME
    tmp/                         the per-request TMPDIR
```

**What it answers, in the order the Follow-on raised it.**

1. **Marker forgery becomes impossible rather than defended.** The marker is a sibling of
   the materialization root, so repository content — which reaches only `tree/` — cannot
   name it. Two independent mechanisms already in the pinned contract were observed to
   hold the boundary: `transfer.fsckObjects=true` rejects a `..`-bearing tree at fetch
   (`hasDotdot: contains '..'`, exit 128) so the object never enters the database, and
   checkout independently refuses with `error: invalid path '../marker'`, creating no file.
   A pre-existing marker is additionally protected by git's untracked-file guard
   (`would be overwritten by merge`), with content observed intact. AC-0136's `.git`-only
   protection stops being load-bearing for ownership.
2. **The per-request `HOME` and `TMPDIR` fall inside the reclaim scope**, as children of
   the state root. AC-0079's three separate removals collapse into one removal of one
   root, and the sweep's candidates become state roots rather than materialization roots.
3. **An unparseable marker is reclaimable by the age limb only.** The marker is now
   Studio-authored and beyond repository reach, so an unparseable one means a Studio-side
   partial write or crash, never an attack. The maximum supervised window is 150 s against
   a markerless-reclaim age of 1 hour — roughly twenty-four times the headroom — so a
   state root with an unparseable marker older than that age is definitionally not in
   flight. This answer is safe **only because** of decision 1; under the old layout a
   repository could have written garbage to force reclaim of a live root.
4. **Reclaim stays an observe-then-delete pair; no locking primitive is added.** It is
   safe because `mkdtemp` names are never reused and the marker pins both process identity
   and start time, so a candidate observed reclaimable cannot become live between the
   observation and the removal.
5. **Aggregate sweep-domain occupancy is bounded by admission, not by a new sampler.** The
   owner chose this over accepting an unbounded gap and over minting a new criterion. The
   Studio Service admits at most one trial inspection in flight, which makes aggregate
   live occupancy one request root's bounds by arithmetic rather than by measurement.
   AC-0111 cannot carry this: it is a renderer obligation, so a protocol client could
   otherwise issue concurrent requests. The obligation therefore extends **AC-0154**,
   which already owns the Service's in-flight responsibility, and mints no criterion
   number.

**Authorized scope.** This authorizes a controlled contract amendment to the *Canonical
values* sweep-domain and materialization-root rows, the *Resource bounds* table, AC-0070,
AC-0079, AC-0080, AC-0081 and AC-0154, plus the T5 task prose that implements them. It
authorizes nothing else: no credential path, no network, and no widening of the permitted
read surface, the permitted executables, the interpreter search list, the environment
allowlist, or the pinned `git` configuration.

**Implementation order, and why.** The owner chose to land T4 before this amendment. The
single-in-flight admission is implemented **inside T4**, because AC-0154 is T4's own
criterion and the Service's request-admission surface is T4's: landing it there means the
amendment leaves no obligation un-gated by a task already pinned complete.

## owner-decision-2026-09-15-cut-test-network-surface

The scope owner decided on 2026-09-15 to **cut the test network surface T4 had
introduced**, and to narrow the three criteria whose automated observation depended on
it.

**What was wrong.** T4's first implementation made `git`'s transport helper observable by
binding a loopback TCP listener that accepted a connection and never answered it, used by
twelve tests. That is the listener-binding surface
`owner-decision-2026-09-15-narrow-ac-0009` had already removed, and AC-0148 admits no
network access in any test this delivery adds. The implementation's own rationale — that a
loopback endpoint contacts no network, credential or remote service — is the same reading
the owner had already considered and reversed.

**Why the surface could not simply be replaced.** Under the pinned environment
`GIT_ALLOW_PROTOCOL=https` refuses the `file` transport outright, so `git` re-executes a
transport helper only over https, and an https endpoint requires something listening. The
three observations below are therefore unreachable under AC-0148 by construction, not by
implementation weakness.

**The owner was shown three options:** cut the listener and narrow the three criteria;
amend AC-0148 to admit a hermetic test-scoped listener; or point `git` at a closed loopback
port so no listener is bound. The third was shown to be flaky by construction — a refused
connection returns in under a millisecond against a roughly fifty-millisecond observation
floor on this host, per `probe-2026-09-15-process-boundary` observation 6. The owner chose
to cut.

**Effects, all applied in one action.**

- The loopback listener, the `remoteTarget` option on the supervisor and the child, and
  every reference to them are deleted. No network surface remains in the trial's tests.
- Nine tests are rebuilt on a local long-lived `git cat-file --batch` process, which blocks
  on stdin and so supplies the live descendant the listener had supplied. It needs no
  transport. Their assertions are unchanged.
- **AC-0024's automated observation is cut.** Its test asserted the parsed
  `GIT_CONFIG_PARAMETERS` set on a real `git-remote-https` helper against the pinned
  configuration, plus exactly the four names `git` adds. That is the strongest evidence in
  the task and the loss is recorded plainly rather than minimised.
- **AC-0025 keeps its two legs** — the sampled descendant set and the exhaustive
  spawn-audit leg — minus the `git-remote-https` instance.
- **AC-0030 keeps its obligation** that no descendant survives an ordinary shutdown, and
  loses only the "including a transport helper holding an open connection" clause.
- All three behavioural observations move to T13's manual smoke, which contacts
  github.com by design and already exists. This is the same route the owner chose for
  AC-0009 on the same date and for the same reason: the contract should claim only the
  evidence that exists.

**What this costs, recorded plainly.** There is no automated regression guard that the
pinned `git` configuration actually reaches the transport helper — the one process that
talks to the network. A change that broke that propagation while leaving the argument
vector intact would be caught only by the manual smoke. No security control was widened to
obtain this, and no criterion now claims evidence that does not exist.

## t4-progress-2026-09-15

**T4 — the process tree runs under a pinned vector and environment.** Implemented, gates
green, and **not yet closed**: three of its criteria are being restated by the amendment
below, so T4 returns as an unfinished task rather than being pinned complete. Recorded now
because the observations are execution evidence that must not be lost across the amendment.

- Files added under the trial code root: `runtime-environment.ts` (the allowlist and
  `buildPinnedEnvironment`, built from an empty object), `executable-identity.ts`
  (`spawnAudited`, the `git` resolution rule, the interpreter search list),
  `process-tree-observer.ts` (`ps -g` enumeration and parsing), `runtime-child.ts` (the
  child entrypoint), `runtime-supervisor.ts` (admission, group signalling, the sampler),
  and `runtime-supervisor.test.ts` (23 tests).
- `git-driver.ts` extended with `PINNED_GIT_CONFIGURATION` — all thirteen keys in
  specification order — emitted at the front of every vector. `GIT_REDIRECT_REFUSAL` is
  retained as the list's first element, so T3's tests are untouched and still green.
- Approved red stub materialized byte-identically from `plan.md`, verified by extracting
  the plan's fenced bytes and comparing directly. First red was the stub's own assertion:
  118 ambient names against the 12 the allowlist admits, including `GIT_CONFIG_COUNT` and
  `GIT_CONFIG_KEY_0` — two carriers the specification names as absent by construction — so
  the red was the criterion's own failure mode rather than a synthetic one.

**Verified independently by the controller, not taken from the implementer's report:**
lint 0 (biome clean over 81 files), typecheck 0, test 0 (**286 tests / 28 files**), build 0,
`git diff --check` 0, both spec linters 0, coupling-check 1 (the four known rows). Stub
byte-identity re-verified. Mutations M8 and M14 re-applied and observed red, then restored
with SHA-256 equality against the pre-mutation content. A wider network sweep than the one
requested — adding `node:http`, `node:https`, `node:tls`, `node:dgram` and `.listen(` —
returned no hits across the trial root.

**Mutation proofs — 19 applied, 19 observed red.** Each restored by editing the text back
and verified by SHA-256; no `git checkout`, `reset` or `stash`. Two carry caveats worth
stating rather than burying:

- **M4** (move the `-c` pairs to the vector tail) is green against T4's file and red against
  `git-driver.test.ts`. T4's vectors are built by the child from the supervisor's argument
  list, so mutating `gitArgs` does not reach them; the driver path's ordering is pinned by
  T3's `args.slice(-4)` assertions. The invariant is covered, but not by T4's file.
- **M18** (admit the kernel's `apple[]` array into the parsed environment) was red in only
  1 of 3 runs. `ps` truncates a long enough row before reaching that array, so the
  corruption surfaces intermittently. Recorded as a weak proof rather than a clean one.
- **M19** is new, and pins the defect in item C below.

### What the network-surface cut changed, beyond the three restatements

Recorded because each is a reduction in evidence or an addition of production code, and a
reviewer should not have to discover them.

**A. AC-0154's first trigger no longer observes a surviving descendant receiving the
signal.** Every descendant the Runtime starts locally holds its stdin from the Runtime's
own pipe, so it exits the instant the Runtime dies; the group was already empty when the
Service's signal landed. The record's single signalling field was therefore split into
`attemptedGroupSignal` (the Service asked) and `signalledGroup` (a live group received it),
and the test asserts the Service's side: it noticed the child had gone without a completed
response, recorded that reason, and asked for the group to be signalled. This is a correct
reading of the criterion, which obliges the Service to signal and does not oblige a
descendant to exist — but the case where a descendant *does* outlive an unanswered child is
no longer exercised.

**B. AC-0021's marker assertion moved surface.** T4's local-only vectors carry no
attacker-influenced operand — the fetch URL and the ref rode the remote phase that was cut.
T4 now asserts the structural rule over every child-built vector, and the criterion's direct
form (the marker immediately before the URL and the ref) remains asserted in
`git-driver.test.ts`, which is untouched. Covered in the delivery, not in this file.

**C. A production defect the listener had been masking.** `process.kill(-pgid, …)` does not
fix the order group members are torn down in. After the in-flight bound signalled the group,
the held `git` died first, its exit woke the Runtime, and the Runtime wrote a `completed`
line to stdout before its own SIGKILL landed. The Service, scanning the whole protocol
stream, accepted it — **so a terminated run could report success.** Fixed: `completedResponse`
is recomputed only while the Service has not yet decided to terminate, and the record
exposes it as the Service's own judgement rather than leaving callers to scan the stream.
M19 pins it. This defect was live before the repair; a socket-blocked helper did not die
first, so it never woke the Runtime and the path was never taken.

**D. One timer-held descendant was added to production code to keep a parent-side obligation
observable.** With only the pipe-held `git`, M7 went green for reason A: the descendant died
with the Runtime either way, so "the group was signalled" became indistinguishable from "the
Runtime died and took its pipes with it". The Runtime now also starts the resolved
interpreter sleeping on a timer when a hold is requested, and reaps it on normal completion.
It is gated behind an injected option that production never sets, following T3's
injected-transport precedent, and the interpreter is admitted by the *Permitted executables*
row. M7 is red again and `live.length > 1` in the deadline test is meaningful.

**E. AC-0031's latency instrument was wrong, and it exposed a drift in the specification.**
`detectedAt` was the instant the `ps` read *started*, so the measured latency absorbed the
whole read duration and failed at 177 ms and 338 ms under load against a 100 ms bound. The
breach now records `observedAt` (read start) and `detectedAt` (ingestion) separately. The
claim Studio actually owns — the read that sees the breach signals the group with no
interval of its own — is asserted at 100 ms and is load-insensitive. The gap from the
earliest breaching read to the acting one is `ps` cost plus sampler scheduling, which the
host owns.

**The drift this exposed.** All three sampled bounds use the same 250 ms sampler, but only
two acknowledge the sample's own duration: *Materialized tree bytes* says "plus the measured
worst-case duration of the sample itself" and states that "detection latency is one interval
plus that duration", *Materialized file count* says "plus the same recorded sample-duration
term", and *Child resident memory* says only "detection latency of at most one 250 ms
interval". AC-0031 carries the same omission with "within one sampling interval of the
breach". The two siblings are right and the third is wrong: a sampler cannot detect a breach
faster than it can complete the read that observes it, and observation 6 of
`probe-2026-09-15-process-boundary` measures one `ps` read at roughly twenty milliseconds
against a fifty-millisecond reliable floor. The amendment adds the missing term to both,
which makes the row consistent with its own siblings and adds no control.

## owner-decision-2026-09-16-inspector-read-reach

The scope owner decided on 2026-09-16 to **record the pinned inspector's read reach as an
unconfirmed residual against the pin, confirmed at T6**, resolving the indeterminate that
stopped pre-EXECUTE round 18.

**What was indeterminate.** The round-18 secure-design review asked whether pack `core` at
the T6 pin ever opens a repository-declared path operand. The adjudication returned
`indeterminate` and the strict classifier returned `invalid (indeterminate-present)` over
artifact sha256 `eb3eb7df073dcc870015888e20faf217bb45d2ca867e90867f2a5e0c68c8c239`, a
terminal owner-decision stop. Two facts were missing and neither was reachable here: the
pinned inspector's source lives outside this repository and has never been read, so no
gate in this worktree can measure its behaviour; and the remedy was an explicit owner
choice among three routes.

**What the adjudication established, and what it did not.** It found the finding's
citation-mischaracterization limb **not** established on current text: AC-0054 deliberately
scopes the permitted-read-surface obligation to the Runtime's declared-value reader and
routes the inspector's traversal to AC-0069 and AC-0073 for links and to the wall-clock and
memory bounds. It also found that the consequence the finding needs rests on the
"no file outside the inspected snapshot is read" obligation in `Objective`, which the
spec's own section note designates working material — so **no gate-read rule was shown
breached.** What remains is an assurance gap about third-party code, not a defect in the
contract.

**The decision.** The owner was shown three routes: record a residual against the pin;
settle the fact now by reading the pinned pack's source; or mint a confining criterion with
a hostile fixture and positive control. The owner chose to record the residual, on three
grounds. It matches the delivery's own standing instruction to confirm the inspector's
behaviour against the pinned pack version before T6. T6 is where the pin is established, so
it is where the confirmation has evidence to work with. And the alternative that mints a
criterion would add a control against behaviour nobody has yet observed, touch T1's pinned
corpus, and move the criteria count off 157 — the pattern that produced the criterion cut
in round 3.

**Scope.** This authorizes one Follow-on recording the residual and naming T6 as the
confirmation point. It authorizes no criterion, no fixture, no change to AC-0054, AC-0069
or AC-0073, and no widening of the permitted read surface. **It does not assert that the
inspector's read reach is confined** — it records that the question is open and fixes where
it is answered.

**Related open question at the same anchor.** The delivery also carries an unconfirmed
question about whether the pinned inspector's traversal follows symlinks, on which AC-0069's
protection depends. It has the same cause and the same confirmation point, and this residual
names both.

## deferred-nits-2026-09-16-round-19

Four advisory findings sustained in pre-EXECUTE round 19, **deferred by owner decision with
their citations** rather than repaired. The work-loop's severity rule is that a Nit is never
fixed automatically and may be deferred with its citation; the owner applied it here because
all six round-19 findings traced to AC-0080 and AC-0081, criteria rewritten in three
consecutive rounds where each repair generated the next round's finding. Repairing only the
Blocker and the Concern keeps the smallest footprint on the two criteria that have proven
perturbation-prone.

| Ref | Severity | Citation | Deferred finding |
| --- | --- | --- | --- |
| adversarial item-2 | Nit | `spec.md:281` | The *Markerless-reclaim age* row paraphrases AC-0081's second limb as an unparseable marker only, no longer matching the limb as the criterion now defines it. The row is working material; AC-0081 carries the age-gate obligation in full |
| adversarial item-4 | Nit | `plan.md:352` | The inspector read-reach Follow-on names T6 as its confirmation point, but T6's Tests, Approach and Done-when schedule no such confirmation, so nothing fails if it is skipped. Resolution is an owner choice between adding a T6 execution control and weakening the Follow-on's claim |
| adversarial item-5 | Nit | `spec.md:494` | AC-0081's replacement-safety sentence attributes safety to the first limb's liveness refusal, but a candidate reclaimed by the second or third limb is classified with no liveness determination. The unsafe reclaim is unreachable — the second limb also requires the one-hour age gate against a 150-second supervised window — so what survives is an unsupported justification rather than a defect |
| security finding 1 | Nit | `spec.md:493` | AC-0080's partial-form enumeration, and the round-18 decision to rest replacement safety on the first limb, hold only under a marker encoding in which no truncation of the single creating write yields both a process identity and a start time — a property the contract leaves to implementation. Resolution is an owner choice among stating the encoding property, adding a completeness obligation, or age-gating the first limb |

**Status: deferred, not resolved.** Each remains open against the citation above. None is a
Blocker or a Concern, so none blocks the approval gates under the work-loop's rule that a
reviewer result carrying only deferred Nits recorded with their citations may proceed. Items
2 and 5 are wording and attribution repairs inside working material and gate-read
justification prose respectively; items 4 and the security finding each need an owner choice
before they can be closed.

**What was repaired instead.** The Blocker: AC-0081's fail-closed clause declined to reclaim
where "a liveness comparison cannot be made", which is exactly the input round 18's widened
second limb reclaims — the criterion stated both reclaim and decline for the one case that
widening existed to close. The clause now binds to the inputs the limb under evaluation
actually needs, and states explicitly that a marker missing a start time is the second limb's
input rather than a declined liveness comparison. The Concern: T5's sweep bullet enumerated
the pre-round-18 limb set and closed it with "and nothing else", which would have produced a
test asserting non-reclaim for a case the criterion reclaims; it now tracks AC-0081's current
limbs and carries the same narrowing.

## deferred-nit-2026-09-16-round-20

One advisory finding sustained in pre-EXECUTE round 20, deferred with its citation.

| Ref | Severity | Citation | Deferred finding |
| --- | --- | --- | --- |
| adversarial Nits-1 | Nit | `spec.md:494` | AC-0081's fail-closed rationale sentence lacks a main verb: "Declining, which is the fail-closed direction AC-0072 already sets…, so uncertainty costs bounded retention…" leaves the first clause without a predicate. Introduced by round 19's split of that clause |

**Why deferred rather than repaired.** The obligation is unaffected and the adjudication says so
explicitly: the preceding bolded sentence carries the decline rule, the following sentence
preserves the second-limb disambiguation, and AC-0083's diagnostic attachment is stated
independently at `spec.md:496`. Applying a sustained finding obliges re-running the reviewer
that produced it, so a one-word repair would cost a full further round; the finding is the same
severity class the owner deferred in round 19, and the next amendment window — the renderer and
result-composition taxonomy before T12 — is a zero-cost moment to carry it. It is distinct from
the round-19 deferral at the same line, which concerned replacement-safety attribution rather
than grammar.

## pre-execute-review-closure-2026-09-16

**The pre-EXECUTE review requirement is satisfied.** Round 20 returned no unresolved Blocker or
Concern from either mandatory reviewer: the secure-design adjudication classified `clean`, and
the adversarial adjudication sustained one Nit, deferred above. Under the work-loop's rule a
reviewer result that is clean, or carries only deferred Nits recorded with their citations, may
proceed to the human gates.

**Round trajectory across the amendment**, sustained findings per round: 17, 8, 4, 6, 1. Blockers
surviving adjudication: 4, 0, 0, 1, 0. The round-19 rise was not noise — it was a contradiction
created by round 18's own repair, and it is why the owner elected to repair only what severity
required and defer the rest rather than continue rewriting AC-0080 and AC-0081 for a fifth
consecutive round.

**Five deferrals stand**, each with a citation: four from round 19 at
`#deferred-nits-2026-09-16-round-19` and one from round 20 above. Two of the five need an owner
choice before they can close — T6 schedules no confirmation for the inspector read-reach
residual that names it, and AC-0080's partial-form enumeration rests on an unstated
marker-encoding premise.

**Artifacts.** Rounds 16 through 20, both reviewer roles, raw and adjudication pairs, under
`.context/reviews/f87c797b-8bed-46c2-96fd-e8d22fb8eb3d/`. Retained for audit, gitignored, and
never committed.

## t4-evidence

**T4 — the process tree runs under a pinned vector and environment.** Complete. Gates
AC-0015 through AC-0031 and AC-0154, under the amended text: AC-0024, AC-0025 and AC-0030
carry their automated legs here and their transport observations at T13, and AC-0154 carries
both liveness triggers plus the single-in-flight admission limb.

- Files under the trial code root: `runtime-environment.ts` (the allowlist and
  `buildPinnedEnvironment`, built from an empty object), `executable-identity.ts`
  (`spawnAudited`, the `git` resolution rule, the interpreter search list),
  `process-tree-observer.ts` (`ps -g` enumeration and parsing), `runtime-child.ts` (the child
  entrypoint), `runtime-supervisor.ts` (admission, group signalling, the sampler), and
  `runtime-supervisor.test.ts` (23 tests). `git-driver.ts` extended with
  `PINNED_GIT_CONFIGURATION` — all thirteen keys in specification order — emitted at the front
  of every vector, with `GIT_REDIRECT_REFUSAL` retained as its first element so T3's tests are
  untouched.
- Approved red stub materialized byte-identically from `plan.md`, verified by extracting the
  plan's fenced bytes and comparing directly.

**Gates at completion, run by the controller rather than taken from a report:** lint 0 (biome
clean over 81 files), typecheck 0, test 0 (**286 tests / 28 files**, 30.0 s), build 0,
`git diff --check` 0, `lint-spec-status` 0, `lint-contract-item-alignment` 0, and
`spec-coupling-check` 1 — the single known AC-0104 row. A wider network sweep than the one
briefed, adding `node:http`, `node:tls` and `.listen(`, returned no hits across the trial
root. `plan check-current` confirmed the approved plan hash unchanged.

### AC-0154's first-trigger proof, recovered

The network-surface cut had weakened this trigger: every descendant the Runtime could start
locally held its stdin from the Runtime's own pipe, so it exited the instant the Runtime died
and the group was already empty when the Service's signal landed. The test then asserted only
the Service's side.

**It was recoverable, and is recovered.** The timer-held descendant added to make M7
falsifiable — the resolved interpreter sleeping with its stdin on `/dev/null` — does not
depend on the Runtime's pipe, so it outlives the Runtime's death. The test now starts both
descendants, confirms the timer-held one alive, kills only the child so its descendants are
left behind, and asserts the whole chain: `termination` is
`child-terminated-without-response`, `completedResponse` is false on the Service's own
judgement, `groupAtChildExit` contains the timer-held pid, `attemptedGroupSignal` and
`signalledGroup` are both true, and neither descendant survives, with `groupGone` true. The
survivor is attributed through `spawnAudit` to the interpreter the Runtime resolved, so the
observation is not "whichever process happened not to have exited yet". Group membership at
child exit is asserted by containment rather than exact equality, because whether the
pipe-held `git` has finished reacting to its closed stdin at that instant is the host's
timing rather than Studio's obligation.

**Controller-verified mutation.** `signalGroup("SIGKILL")` removed from the Service's
child-exit path in `runtime-supervisor.ts`: exactly one test fails —
`AC-0154 signals the child's process group when the child terminates without a completed
response` — on `expected false to be true`. Restored by editing the text back, with SHA-256
equality confirmed against the pre-mutation content. The recovered assertion therefore fails
when the obligation is removed, rather than passing incidentally.

**Earlier observations remain as recorded** at `#t4-progress-2026-09-15`: the 19 mutation
proofs including M4's and M18's stated caveats, the `/usr/bin/git` shim's five extra
environment names and the resolution rule derived from the recorded exec-path, AC-0023's
normalization for two names self-injected after `execve`, AC-0025's two-leg discharge, and
the `completedResponse` defect the listener had masked, where a terminated run could report
success.

## t5-progress-2026-09-16

**T5 — materialization is confined, measured, and disposable. In progress, not complete.**
This entry records the first increment: three modules under the trial root that discharge
T5's confinement, ownership and reclaim obligations at module level, with 46 tests. It
records honestly what is *not* yet done, so the next session does not mistake this for a
closed task.

**Landed.** `materialization-confinement.ts`, `per-request-state-root.ts` and `sweep.ts`,
with `materialization-confinement.test.ts`, `per-request-state-root.test.ts` and
`sweep.test.ts`. The change is **purely additive** — `git diff --name-only` is empty against
`1b32570`, so no T4 surface was modified.

| Criterion | State after this increment |
| --- | --- |
| AC-0072 | Discharged. `verifySweepDomain` fails closed on absent, link, non-directory, foreign owner and permissive mode; `lstat` not `stat`, so a link to a conforming directory is still refused |
| AC-0073 | Discharged. Containment compares **resolved real paths** on a path-segment boundary; a sibling extending the root (`tree-evil` against `tree`) and a link inside the root whose target escapes are both refused; a link resolving back inside is admitted |
| AC-0074 | Discharged. Directory and FIFO refused; a device file reached through a contained link is refused on containment first, which is the stronger refusal |
| AC-0075 | Discharged. Size checked **before** the open; at-bound admitted, one byte over refused |
| AC-0076 | Discharged. The removal walk `lstat`s at every level and **unlinks a link rather than descending it**; proven by a link planted at depth whose target directory and its contents survive the removal |
| AC-0079 | Discharged at module level. One removal of the state root takes `tree`, `home`, `tmp` and the marker |
| AC-0080 | Discharged at module level. Marker created exclusively (`wx`) and written once before any other child; removed last; a sibling of `tree`, never a descendant |
| AC-0081 | Discharged. All three limbs, the entry gate, the live-process refusal, both age gates, and every decline route |
| AC-0083 | Discharged. Declines and removal failures both surface, naming limb and input class, and carry no repository-derived payload |
| AC-0069 | Mechanism confirmed by probe, **no T5 test yet** |
| AC-0070 | Implemented in `createPerRequestStateRoot`, but **not yet the Runtime's actual path** |
| AC-0071, AC-0077, AC-0078, AC-0082 | **Not started.** They need the supervisor/child wiring described below |

**Two defects this increment's own tests caught, both in work written this session.**

1. *Removal could leave an unmarked root holding content.* The first draft removed every
   non-marker child, collecting failures, and then removed the marker regardless. Where a
   child survived — the test drops write permission on a nested directory — the result was a
   **non-empty state root with no marker**, which satisfies no limb of AC-0081 and so would
   be retained forever rather than reclaimed. Fixed by returning early with the marker
   intact whenever any diagnostic was collected. AC-0080's "no state root holding any
   content is ever unmarked" is the obligation that names this defect.
2. *The marker-encoding claim was too strong.* The first draft asserted that **no** proper
   prefix of the single creating write parses, which is false: the prefix that drops only
   the trailing newline parses to the complete object and yields both values. The property
   that actually holds, and the one AC-0080's crash-window claim needs, is that every proper
   prefix either fails to yield both values — AC-0081's second-limb input — or yields
   **exactly the complete marker's values**, and so cannot misstate ownership. The test now
   asserts that, and asserts that exactly one such parseable prefix exists.

**Probe — `core.symlinks=false` neutralizes links, confirming AC-0069's mechanism.**
Against a source repository carrying `escaping-link -> ../../../etc/passwd`, a clone under
`-c core.symlinks=false` produced a **regular file** whose content is the literal string
`../../../etc/passwd`; `test -L` reports it is not a link. The key is already in T4's pinned
13-key configuration, so AC-0069 needs a T5 assertion rather than a new control.

**Probe — process start time is readable and its three outcomes are distinguishable.**
`ps -o lstart= -p <pid>` is stable across repeated reads at one-second resolution. An unused
but valid pid exits 1 with **empty stdout and empty stderr**; a pid beyond `kern.maxproc`
(8000 on this host) exits 1 with `ps: process id too large` on stderr. That distinction is
what lets AC-0081 separate "the process is determinedly absent", which limb 1 reclaims, from
"liveness could not be compared", which must decline. `readProcessStartTime` returns a
string, `null` and `undefined` for the three cases respectively.

**Probe — the Runtime child can import a sibling only with a `.ts` specifier.** Under Node
v26.4.0 type stripping, a `.ts` file importing `./sib.js` fails at run time while
`./sib.ts` resolves and executes. The project's tsconfig sets `noEmit` but not
`allowImportingTsExtensions`, so a `.ts` specifier fails typecheck. T4's recorded constraint
therefore holds for production code as configured, and the established pattern stands: the
child **inlines mechanics driven by plan-supplied values** — it already rebuilds the
environment from `plan.environmentNames` rather than importing `runtime-environment.ts`.
The remaining wiring must follow that pattern rather than import these three modules.

**Where the remaining wiring has to run, and why it is not a free choice.** AC-0079 says
*the trial Runtime* removes its state root, AC-0081 says *a Runtime sweep*, and AC-0082 says
the Studio Service only *invokes* the sweep. Together with the boundary that the Service
opens no path under a materialization root, both removal paths are child-side, so the child
must carry inlined equivalents of `removePerRequestStateRoot` and the sweep predicate, with
the marker name, child names and reclaim age delivered in the plan. AC-0071 additionally
wants the sweep domain as a **named argument on the argument vector**, which argues for
`--sweep-domain <path>` in `childArgs` rather than another field inside the plan JSON. One
ordering constraint falls out of AC-0080: the Service can `mkdtemp` the state root and
*compute* the `tree`, `home` and `tmp` paths for the pinned environment without creating
them, leaving the child to write the marker before it creates any of the three. The window
that opens — an empty unmarked root between `mkdtemp` and the marker write — is the one
AC-0080 explicitly sanctions and AC-0081's third limb reclaims.

**Gates, all green except the one expected failure.** `pnpm verify` exit 0 with **332 tests
in 31 files** (286 baseline plus 46), biome clean over **87 files** (81 baseline plus 6),
`pnpm lint`, `pnpm typecheck`, `pnpm build` and `git diff --check` all exit 0,
`lint-contract-item-alignment` 0 findings, `lint-spec-status` clean, and
`spec-coupling-check` exit 1 on **exactly the one known AC-0104 row** at `spec.md:277`.

**Host contention, recorded because it blocks T5's measurement.** The full suite first
returned a **varying** failure set — three tests in two files, then AC-0023 alone, then
AC-0025 alone when `runtime-supervisor.test.ts` ran by itself with none of this increment's
tests in the run. Since `git diff --name-only` was empty, no T4 surface had changed and the
variation is contention rather than defect, which two consecutive clean full runs then
confirmed. Load averages moved between roughly 20 and 187 on a 10-core host across the
session, driven by two other concurrent agent sessions and the resident corporate endpoint
agents; a ten-minute poll never observed a one-minute average below 12. **AC-0023 and
AC-0025 are not in the known-flake list and should not be added to it** — they are timing-
sensitive `ps` observations that pass on a quiet host.

## t5-measurement-deferred-2026-09-16

**T5's four measurements were not taken, deliberately.** The plan requires four quantities
over one 250 ms interval, two of which carry advance-fixed pass bars: write throughput at or
below 128 MiB and file-creation at or below 5,000 files. Both bars exist to characterize
**this host's** capability, because the *Materialized tree bytes* and *Materialized file
count* rows carry the measurement as their tolerance rather than asserting one.

A measurement taken on a contended host characterizes the contention, not the host, and it
is wrong in a way that is not conservative in either direction:

- Measuring **low** under load would record a throughput this host can in fact exceed, and
  the tree-bytes and file-count tolerances derived from it would then be narrower than
  reality — the bound would read as holding when it does not.
- Measuring **high**, per the spec's own rule, *fails the bound rather than raising it*, so
  a load-induced spike would record a contract failure that the host does not actually have.

Across this session the one-minute load average ranged from roughly 20 to 187 on a 10-core
host, and a ten-minute poll never observed it below 12. Two other concurrent agent sessions
were running, alongside resident corporate endpoint agents (`dgagent`, Jamf, Defender
`epsext`, Tanium, BeyondTrust, Nexthink) that cannot be stopped. The handover already
recorded that the previous session's host sat at 10–56 and killed two background processes
for memory.

**What the next session needs.** A host whose one-minute load average is low — single digits
— for the duration of the four measurements, with the load recorded alongside each
measurement as the plan requires. Nothing else in T5 is blocked on this; the measurement is
the last item before T5's Done-when can be satisfied, and the remaining wiring described at
`#t5-progress-2026-09-16` can proceed under load, because none of it is timing-sensitive.

## owner-decision-2026-09-16-package-3-taxonomy

**Four open owner decisions, all decided 2026-09-16.** These are the decisions the
pre-EXECUTE rounds deferred because each needed an owner choice rather than evidence. They
are batched here because Package 3 — the renderer and result-composition taxonomy amendment
that blocks T12 — has to happen anyway, and a deferred Nit costs a full review round if it
is carried alone.

| # | Question | **Decision** | Route not taken |
| --- | --- | --- | --- |
| 1 | AC-0104's breach behaviour | **Reject the write that would breach**, with an explicit diagnostic | Truncate; evict |
| 2 | T6 schedules no confirmation for the inspector read-reach residual that names it | **Add the named T6 confirmation**, scoped to read reach against the recorded pack name, version and file digests | Weaken the Follow-on's claim |
| 3 | AC-0080's partial-form enumeration rests on an unstated marker-encoding premise | **State the encoding property** | Add a completeness obligation; age-gate AC-0081's first limb |
| 4 | The *Non-originated value* row head is broader than its three-item enumeration | **Extend the enumeration** | Narrow the head |

**Decision 1 — reject.** The *Persisted repository-derived content* row at `spec.md:277` is
deliberately two-cell and is the single expected `spec-coupling-check` finding; the two
missing cells are exactly *who enforces the bound* and *what happens at the boundary*. The
row becomes `Enforced by: the persistence layer checks before the write` and
`Tolerance: none — exact`. Eviction was refused because a retention order is a primitive the
contract has nowhere else, and every prior owner decision in this amendment took the
no-new-control route. Truncation was refused because a truncated repository-derived value
still carries AC-0039's provenance marker, so it reads as a complete attributed value when
it is not. The silently-incomplete record that rejection leaves is answered by the pattern
AC-0083 already sets for a declined reclaim: a control whose failure mode emits nothing is
unobservable exactly when it matters. This decision pairs with the Package 3 item on the
lifetime bound for persisted repository-derived content; they are the same row.

**Decision 2 — add the confirmation.** The residual at `spec.md:594` names T6 as the
confirmation point for the pinned inspector's read reach, but T6's Tests, Approach and
Done-when schedule no such confirmation, so nothing fails if it is skipped
(`#deferred-nits-2026-09-16-round-19`, adversarial item-4). The deciding factor is marginal
cost: T6 must already open the pack to record its version and the SHA-256 of
`workspace_status.py` and `workspace_status_engine.py`, so confirming read reach at that
same moment is not new work. T6 gains a named Tests bullet and a Done-when clause.

**The symlink half of that residual is now overstated and should be corrected with it.**
The residual asserts that AC-0069's protection depends on whether the inspector's traversal
follows symlinks. It does not. `core.symlinks=false` is already in T4's pinned thirteen-key
configuration, and the probe at `#t5-progress-2026-09-16` confirms it materializes an
escaping link as a **regular file holding the literal target string** — so there is no
symlink under the materialization root for the inspector to follow. AC-0069's protection is
held by materialization, not by the inspector's traversal. The read-reach question — whether
pack `core` at the pin ever opens a repository-declared path operand — is separate, bears on
AC-0054's permitted read surface, and is what T6 now confirms.

**Decision 3 — state the encoding property.** Chosen as the cheapest route that touches
neither AC-0081 nor the reclaim semantics: AC-0080 and AC-0081 were rewritten in four
consecutive rounds and each repair generated the next round's finding, so age-gating the
first limb was refused as the highest-risk edit available. A completeness obligation was
refused as an added obligation where a statement of fact suffices.

**The property must be stated in its disjunctive form; the obvious phrasing is false.**
"No truncation of the single creating write parses" is **wrong** — the prefix that drops
only the trailing newline parses to the complete object and yields both values. The property
that holds, implemented and proven by an exhaustive per-prefix test in
`per-request-state-root.test.ts`, is:

> Every proper prefix of the marker's single creating write either fails to yield both a
> process identity and a start time, or yields exactly the complete marker's values.

The first disjunct is AC-0081's second-limb input; the second cannot misstate ownership.
The encoding that realizes it is single-line JSON with the start time last. Recorded at
`#t5-progress-2026-09-16` as the second of two defects this increment's own tests caught.

**Decision 4 — extend the enumeration.** The head — "any value whose bytes Studio did not
produce" — is broader than its three items, leaving child-process diagnostic output and
inspector-authored text unassigned. Narrowing was refused because it would leave the class
named for values Studio did not produce while excluding values Studio did not produce, which
is precisely the drift the row exists to prevent and which the row's own rationale names.

The gap is narrower than it first reads, and the two unassigned things are one coherent
class. The *repository-derived portion* of child stderr is already covered by item 1, since
AC-0039 reaches any value "whose content originates in the inspected repository, whether
Studio extracted it or the inspector echoed it". What remains unassigned is text **authored
by a pinned third-party executable** — the inspector's own prose, and a child process's own
diagnostic text. Extending the enumeration by that one item is cheap because the obligations
are cheap to extend to it: rendering trusted text as literal text and never using it as a
URL, resource reference or navigation target costs nothing.

**What Package 3 must carry, now that all four are decided.** The amendment batches these
four decisions, the nine triaged taxonomy items, and the five deferred Nits from rounds 19
and 20, and it walks every sibling sharing the taxonomy **in the same action**: AC-0115,
AC-0116, the *Non-originated value* row, the Never-do bullet on non-originated values,
AC-0110, AC-0117, AC-0099, the Desktop-surface Testing Strategy group, and T12's test
bullets.

**One correction to the handover's own citation.** The *Non-originated value* class
definition is at **`spec.md:65`**, not `spec.md:63`; line 63 is the *Ref charset* row. The
next session should target that row by name rather than by line number, because the
amendment itself will move it again.

**The AC-0115 / AC-0116 repair is repair-the-generator and must not be done by mirroring.**
The derivation clause — "including a link Studio itself constructs from one, such as a
commit link built from the resolved revision" — currently sits on AC-0116 alone. It is
**not** to be copied onto AC-0115: a prior repair did exactly that and created the identical
drift in reverse. It moves into the *Non-originated value* row, which both criteria already
cite, where it cannot re-drift.

**The five deferred Nits ride in this amendment**, each already carrying its citation at
`#deferred-nits-2026-09-16-round-19` and `#deferred-nit-2026-09-16-round-20`. Two of them
are decisions 2 and 3 above and close with them. The remaining three are prose and
working-material repairs with their obligations intact: the *Markerless-reclaim age* row at
`spec.md:281` paraphrases AC-0081's second limb too narrowly; AC-0081's replacement-safety
sentence at `spec.md:494` attributes safety to the first limb alone though limbs 2 and 3
classify without a liveness determination; and AC-0081's fail-closed rationale sentence at
`spec.md:494` lacks a main verb. The last two touch AC-0081, the most perturbation-prone
text in the spec, so they are the items to re-read most carefully after editing.

**Sequencing.** Package 3 blocks T12 only, so it is not required before T5 through T11. It
requires its own contract amendment, which pins the completed tasks, clears the schedule and
returns the run to `SPEC-PLAN-DRAFTING`, so it costs a pass back through both human approval
gates. Nothing in T5's remaining work depends on it.

## t5-measurements-2026-09-16

**T5's four measurements, taken.** They supersede the deferral recorded at
`#t5-measurement-deferred-2026-09-16`: a quiet enough window opened later the same day, with
one-minute load averages between 8.26 and 15.9 on a 10-core host, and the load was
unchanged across each measurement, so none is self-contended. Every figure below carries the
load that was in effect. The harness is `tools/measure-host-bounds.mjs`, run deliberately
rather than as a test, because two of the four carry advance-fixed pass bars that a
contended host fails spuriously.

| # | Measurement | Result | Pass bar | Verdict |
| --- | --- | --- | --- | --- |
| 1 | Write throughput, peak per 250 ms interval during checkout | **208–448 MiB** across eight runs; 264, 264, 336 in the final run at load 13.53 | at or below **128 MiB** | **FAILS** |
| 2 | File creation per 250 ms interval | **874–1,437 files** | at or below **5,000** | **passes**, ~3.5× headroom |
| 3 | Resident-memory growth per 250 ms interval | **641–1,131 MiB** | none — observation | recorded |
| 4 | Sample duration over a tree at the 50,000-file bound | worst **349 ms**, best **211 ms** | none — observation | recorded |

**Measurement 1 fails its bar, and the spec says what that means.** The *Materialized tree
bytes* row states: "The throughput measurement must come in at or below 128 MiB; **a host
measuring higher fails the bound rather than raising it**, so the criterion cannot supply its
own pass bar." Every run of the realistic writer exceeded the bar by between 1.6× and 3.5×.
This is therefore a **bound failure on this host**, not a measurement to be normalized, and
it needs an owner decision. It is recorded here rather than acted on.

**Getting measurement 1 right took three methodologies, and the first two were wrong.**
Recorded because the wrong ones are the obvious ones, and each would have produced a
different verdict.

1. **Raw `writeSync` throughput — wrong writer.** Ordinary buffered writes as fast as one
   process can issue them measured 204–884 MiB per interval. But the bound's row says the
   supervisor samples "during checkout", so the writer that matters is `git`, limited by pack
   decompression and per-file work. This figure is retained in the harness as
   `rawWriteCeiling`, explicitly labelled as not the writer the bar applies to, only because
   it bounds the real measurement from above.
2. **Average over a whole checkout — hides the peak.** Timing a 512 MiB checkout and scaling
   to 250 ms gave 80–104 MiB per interval and would have **passed** the bar. It is wrong
   twice over: an average over a burst understates the peak the sampler actually races, and
   the tree used 64 *identical* blobs, which git deduplicates to one object, so the checkout
   inflated once and copied. Both errors push the number down.
3. **Peak growth per 250 ms sample during checkout — the correct model.** Sixty-four
   *distinct* 8 MiB blobs, sampled on the sampler's own cadence, keeping the largest
   single-interval growth. This is what the tolerance term means, and it reproduces: peaks of
   232/216/440, 232/208/448 and 264/264/336 MiB across three separate runs.

**The structural finding behind the number.** The harness also records how many 250 ms
samples each checkout spanned: **[3, 3, 2] for a tree at the 512 MiB bound**. A tree at the
bound is therefore fully materialized in two to three sampling intervals. Detection costs one
interval plus the sample itself, and measurement 4 puts the sample at 211–349 ms — so
detection lands at roughly 460–600 ms, by which point the entire byte budget has been spent
and substantially exceeded. The sampler cannot enforce a 512 MiB bound at a 250 ms cadence on
this host, and shortening the interval does not obviously help, because **measurement 4 shows
one sample already costs more than one interval** at the file-count bound.

**What is not in question.** Measurement 2 passes with roughly 3.5× headroom, and its model
is conservative by construction: it creates *empty* files with `writeFileSync`, which is the
fastest a process can add directory entries, so `git` cannot exceed it. Measurement 3
corroborates AC-0031's decision to claim detection latency rather than a peak — growth of
641–1,131 MiB in a single interval exceeds the 1 GiB child resident-memory bound outright,
which is exactly why no peak is asserted.

## open-owner-decision-2026-09-16-tree-bytes-bound

**A fifth owner decision, raised by T5's measurement and not decided here.** The
*Materialized tree bytes* bound fails its own pass bar on the delivery host, as recorded at
`#t5-measurements-2026-09-16`. The spec anticipated this case and fixed its consequence — the
bound fails rather than the bar rising — but it does not say what to do next, and the routes
differ in cost and in how much new machinery they add.

**What the evidence constrains.** Any route has to contend with three measured facts: the
realistic writer materializes 208–448 MiB per 250 ms interval; a tree at the 512 MiB bound is
written in two to three such intervals; and one sample over a tree at the 50,000-file bound
costs 211–349 ms, which is already at or above the sampling interval itself. Shortening the
interval therefore cannot be assumed to help, because the sampler would not keep its cadence.

**Routes, none recommended here.**

- **Restate the bound as what sampling can actually enforce.** Keep the mechanism and raise
  the stated bound to the bound plus its measured overshoot, so the contract claims what
  holds. Adds no machinery; weakens the guarantee, and the *Live in-flight sweep-domain
  occupancy* row derives from this value, so it moves too.
- **Bound the input instead of the output.** The row already says the fetch-depth bound is
  the primary control and that `--depth 1` "bounds neither tree bytes nor file count". A
  pre-checkout check on pack or tree size would bound materialization before it starts,
  rather than racing it. This is a new control, which every prior owner decision in this
  amendment declined to add.
- **Keep sampling and accept the overshoot as a stated tolerance.** The row's tolerance
  language is already "the measured write throughput … plus the measured worst-case duration
  of the sample itself", so the overshoot is computable. This route records the measurement,
  drops the 128 MiB pass bar as unmeetable on the delivery platform, and leaves the bound
  nominal. It is the smallest edit and the weakest guarantee.
- **Cut the bound.** If the bound cannot be enforced at the cadence the mechanism allows, a
  bounded known gap may beat a control that reads as enforcing something it does not.

**Why this is not T5's to settle.** T5's obligation is to record the four measurements and
carry them into the bounds tolerances, which is now done. Changing a *Resource bounds* row,
or the criterion that cites it, is a contract amendment. It is a natural companion to
Package 3, which already has to touch the *Persisted repository-derived content* row for
decision 1.

## owner-decision-2026-09-16-cut-tree-bytes-bound

**Decision 5, decided 2026-09-16: cut the materialized tree-bytes bound.** The owner chose
the fourth route offered at `#open-owner-decision-2026-09-16-tree-bytes-bound` — remove the
limit and state the gap plainly — over restating the number, bounding the input before
checkout, or keeping the sampler with the pass bar dropped.

**The owner's ground, recorded because it is the reason the route is right rather than
merely cheapest: the quantity is machine-dependent.** Any stated ceiling is a property of
the host that measured it, so a restated number would be wrong on the next machine and would
need remeasuring on every delivery platform. Stating no ceiling is the only form that does
not go stale. The decision was explicitly taken **"for now"**, so it is a deliberate,
revisitable gap rather than a settled design position, and it belongs in *Follow-ons* on
those terms.

**The file-count bound is not cut.** It passes its bar with roughly 3.5× headroom — 874 to
1,437 files per interval against 5,000 — so it is genuinely enforceable and AC-0051 stands.
Cutting only the unenforceable half is the precise change. The 250 ms sampler therefore
survives: it still enforces the file-count bound and still serves AC-0031's resident-memory
detection.

**The gap is not unbounded in practice, and the amendment should say so.** With no byte
ceiling, materialization is still held by three things the slice keeps: the repository must
first be fetched over the network, `--depth 1` bounds history, and the 120 s inspection
wall-clock deadline ends the attempt. What is removed is a *stated* byte ceiling Studio
enforces, not every constraint on size. Saying that plainly is what makes this a documented
gap a reader can plan around rather than a silent hole.

**Two consequences the owner should see, because they are larger than editing one row.**

1. **A criterion is removed, and the criteria count changes.** AC-0050 asserts that
   materialization "is killed by the Runtime supervisor when a sample observes the
   **tree-bytes bound** crossed". With no such bound, the criterion has no referent and goes.
   That takes the count from **157 to 156**, and AC-0050 joins the number between AC-0155 and
   AC-0157 on the list of identifiers that are **never to be reused**. AC-0051, the
   file-count twin, is unaffected.
2. **A T1 hostile-corpus case is orphaned and must be rebound or retired.**
   `HOSTILE_CASE_BY_CRITERION` binds `"AC-0050": "tree-bytes-bound"` in
   `test/hostile-fixture.ts`. T1's *plan section* is pinned and immutable, but it covers
   AC-0149 rather than AC-0050, and the corpus *code* is not pinned, so the binding can be
   removed without touching pinned text. The amendment must still walk it, or
   `lint-contract-item-alignment` will see a case bound to a criterion that no longer exists.

**Every surface the cut has to walk, in one action.** In `spec.md`: the *Materialized tree
bytes* row itself (`:268`); the threat-table row `AC-0050 tree-bytes bound` (`:224`); the
*Fetch depth and filter* tolerance, which says `--depth 1` "bounds neither tree bytes nor
file count, which the sampler alone enforces" (`:267`); the *Child resident memory*
tolerance, which rests "on the same terms as the tree-bytes and file-count rows" (`:273`);
the *Live in-flight sweep-domain occupancy* row, whose value term is "the tree-bytes and
file-count bounds the sampler enforces over the `tree` child" (`:282`); AC-0031, which cites
the same terms (`:422`); AC-0050 itself (`:451`); and the closing sentence that the
fetch-depth bound is why "the sampled tolerances can be small enough to state honestly"
(`:285`). In `plan.md`: the approach and design paragraphs at `:39`, `:41` and `:113`; T5's
measurement bullet at `:332`, which carries the 128 MiB pass bar that this decision retires;
the AC-0050 red stub at `:375`; the attribution example at `:489`; and the changelog note at
`:821`.

**What this unblocks, and what it still costs.** T5's Done-when requires "the four
measurements recorded **with the two pass bars met**". Cutting the tree-bytes bound retires
the bar that cannot be met, so T5 can close on the remaining one, which passes. The change is
a contract amendment and cannot be made by editing the pinned bodies directly; it is a
natural companion to Package 3, which already has to touch the same *Resource bounds* table
for decision 1. Doing both in one amendment costs one cycle through the human gates rather
than two.

## defect-2026-09-16-runtime-spawns-ps

**A defect this session introduced, found before T5 was declared complete, and not yet
fixed.** The trial Runtime spawns `/bin/ps` to read a process start time — once in
`claimStateRoot` for its own marker, and once per complete-marker candidate in the sweep's
first limb. That violates AC-0025 on **both** of the legs the criterion names.

1. **`/bin/ps` is not a permitted executable.** The *Permitted executables* row admits four
   things: the resolved `git` binary, anything `git` re-executes from the recorded exec-path
   directory, a Python interpreter at an enumerated search-list path, and the Runtime's own
   Node process. `ps` is none of them, and it is started inside the trial process group.
2. **The spawns bypass the audit.** AC-0025's second leg is "the exhaustive record of every
   spawn Studio's own code performs". These calls use a bare `spawnSync` and never reach
   `recordSpawn`, so the record is no longer exhaustive and the leg no longer means what it
   claims.

**The tests do not catch it, and that is the instructive part.** A `ps` invocation lives
roughly 20 ms, well under the ~50 ms floor at which the sampler can observe a process at all,
as recorded at `#probe-2026-09-15-process-boundary`. So the sampled leg cannot see it. The
audit leg exists precisely to cover what sampling misses — and the defect routes around that
leg rather than tripping it. AC-0025's two-leg construction is sound; this implementation
defeated it.

**Where it is.** `runtime-child.ts`, the `processStartTime` helper. It reached the branch in
`b18c273` with the marker write and is already pushed; the sweep in the working tree extends
the same dependency to one call per candidate.

**Why it is not fixed here.** Every route out is a contract change, and three of the four
touch AC-0080 or AC-0081 — the two criteria rewritten in four consecutive review rounds and
the most perturbation-prone text in the spec. Choosing among them is an owner decision, not
an implementation detail, so it is raised at
`#open-owner-decision-2026-09-16-runtime-liveness-mechanism` rather than settled here.

## open-owner-decision-2026-09-16-runtime-liveness-mechanism

**A sixth owner decision, raised by the defect above and not decided here.** AC-0080 has the
Runtime write a marker naming "the owning process and its start time", and AC-0081's first
limb reclaims a candidate whose "recorded process and start time do not match a live
process". On this platform there is no `/proc`, so a process's start time — its own or
another's — cannot be read without an external inspector, and the only one available is not a
permitted executable.

**Routes, none recommended here.**

- **Admit `ps`.** Add it to *Permitted executables* and route the calls through the spawn
  audit. Smallest edit, and it makes the audit honest again. It widens the Runtime's spawn
  surface, which every prior owner decision on this spec declined to do, and it lets code
  inside the trial boundary enumerate processes outside it.
- **Replace start time with an advisory lock.** A live Runtime holds an exclusive `flock` on
  its own marker; the operating system releases it when the process dies, so liveness becomes
  "can this lock be acquired". No spawn, and it defeats pid reuse without needing a start
  time at all. It is the standard mechanism for this problem, and it rewrites AC-0080's and
  AC-0081's stated mechanism — the most fragile text in the spec.
- **Split the sweep across the boundary.** The child computes its *own* start time in-process
  as `Date.now() - process.uptime() * 1000`, needing no spawn; the Service classifies
  candidates, which it may do because a marker is a sibling of `tree` rather than under it,
  and the child performs the removals. No new executable and no change to AC-0080's
  substance, but the two clocks must be reconciled with a tolerance that weakens the pid-reuse
  defence, and it strains AC-0081's "a **Runtime** sweep" and AC-0082's "the Service
  **invokes** the sweep".
- **Cut the first limb.** Reclaim on age alone. A live root is already protected by the
  one-hour age gate against a 150 s maximum supervised window, so nothing in use is
  endangered; the cost is that an abandoned root waits an hour instead of being reclaimed
  promptly. This is the cut-a-control route the other decisions have consistently taken, and
  it removes the liveness comparison that created the problem.

**Scope note.** The fourth route interacts with decision 5: both remove machinery rather than
add it, and both touch *Resource bounds* or the criteria that cite it, so they belong in the
same amendment. The second and third routes would make AC-0080 and AC-0081 the subject of a
fifth consecutive rewrite, which the round-trajectory evidence at
`#pre-execute-review-closure-2026-09-16` argues strongly against.

## owner-decision-2026-09-16-admit-ps

**Decision 6, decided 2026-09-16: admit `/bin/ps` as a permitted executable.** The owner
chose the first route offered at
`#open-owner-decision-2026-09-16-runtime-liveness-mechanism`, over replacing the start time
with an advisory lock, splitting the sweep across the process boundary, or age-gating every
limb. It resolves the defect at `#defect-2026-09-16-runtime-spawns-ps`.

**The deciding ground is the rewrite history, not convenience.** AC-0080 and AC-0081 were
rewritten in four consecutive pre-EXECUTE rounds, and round 19's repair produced a flat
self-contradiction in which the criterion stated both reclaim and decline for the one case
the repair existed to close. Admitting `ps` is the **only** route that leaves both criteria
untouched: it changes the *Permitted executables* row in *Canonical values* and nothing else
in the contract. The other three would have made those two criteria the subject of a fifth
consecutive rewrite, which the round trajectory at `#pre-execute-review-closure-2026-09-16`
argues against more strongly than any other evidence in this spec.

**One route was eliminated by probe rather than preference.** The advisory-lock route is the
textbook mechanism — the operating system releases a `flock` when the holder dies, which
defeats pid reuse without recording a start time at all — but **Node v26.4.0 exposes no
`flock`**: `fs.flock` and `fs.flockSync` are undefined and `fs.constants` carries no `LOCK_*`
flag. It would require a new native dependency, which the delivery constraints forbid without
a separate decision. Recorded so the route is not re-proposed in review.

**Why admitting `ps` is a smaller security change than it reads as.** A permitted-executables
entry sounds like widening the trial sandbox, but **nothing sourced from the inspected
repository is executed, imported or evaluated** — a non-negotiable boundary of this delivery.
The trial process group therefore contains only Studio's own Runtime, `git`, and a Python
interpreter started by the version probe. There is no attacker-controlled code inside that
group for `ps` to benefit, and Studio invokes it itself with a fixed argument vector and no
attacker-influenced operand. The Studio Service has also always run `ps` for its parent-side
process-tree observation, so this declares an existing dependency honestly rather than
introducing a capability.

**What the amendment must carry, and what the code must do after it.** The two halves are
separable and must land in that order, because the contract admits the executable before the
code may rely on it.

1. **Contract.** The *Permitted executables* row in *Canonical values* gains `/bin/ps`,
   invoked by Studio's own code with a fixed argument vector. The row is the only surface
   that changes; AC-0025 already reads the list rather than enumerating it, so the criterion
   needs no edit, and AC-0080 and AC-0081 are untouched.
2. **Code.** The `processStartTime` helper in `runtime-child.ts` must route its spawns
   through `recordSpawn`, which is the half that actually repairs the defect. AC-0025's
   second leg is "the exhaustive record of every spawn Studio's own code performs", and it
   is the leg the defect defeated — the sampled leg never could have caught a process living
   about 20 ms, under the ~50 ms observation floor. Admitting the executable without
   restoring the audit would fix the lesser half and leave the record still inexhaustive.

**An adversarial reviewer will ask why a sandboxed Runtime may enumerate host processes.**
The answer is the two paragraphs above — no repository-sourced code runs in the group, the
argument vector is fixed and carries no attacker-influenced operand, and the Service already
depends on `ps`. That reasoning belongs in the amendment's own text rather than being
discovered during a review round.

**A note for whoever writes the amendment.** This decision breaks the run of no-new-permission
outcomes that the previous decisions established, and the changelog should say so plainly
rather than let the pattern look unbroken. The justification is that the alternative routes
all spend their cost on the spec's most perturbation-prone text, which is the more expensive
place to spend it.

## amendment-2026-09-16-bound-cut-and-ps

**The owner authority for a narrow contract amendment, scoped deliberately.** It carries
exactly two decisions, both of which block T5 and neither of which can wait for the renderer
and result-composition amendment:

- **Decision 5**, cut the materialized tree-bytes bound —
  `#owner-decision-2026-09-16-cut-tree-bytes-bound`. Forced by the measurement at
  `#t5-measurements-2026-09-16`, where the realistic writer exceeded the 128 MiB pass bar by
  between 1.6× and 3.5× and the spec's own rule makes that a bound failure.
- **Decision 6**, admit `/bin/ps` as a permitted executable —
  `#owner-decision-2026-09-16-admit-ps`. Forced by the defect at
  `#defect-2026-09-16-runtime-spawns-ps`, which violates AC-0025 on both its legs.

**Package 3 is deliberately NOT in this amendment.** The renderer and result-composition
taxonomy, the four decisions batched into it, and the five deferred Nits all stay in their
planned slot before T12, which is six waves away. The owner chose the narrow scope over
batching: the last amendment of the larger shape generated four of its own blockers across
five review rounds, and the deferred Nits exist precisely because that kept recurring.
Splitting costs a second pass through the human gates and touches the *Resource bounds* table
twice, but on different rows — *Materialized tree bytes* here, *Persisted repository-derived
content* there — so the two edits do not overlap.

**What this amendment changes, in full.** The *Materialized tree bytes* row and every surface
citing it, enumerated at `#owner-decision-2026-09-16-cut-tree-bytes-bound`; the removal of
AC-0050, taking the criteria count from 157 to 156 and adding that identifier to the
never-reuse list; the rebinding of the T1 corpus case that names it; and the
*Permitted executables* row gaining `/bin/ps`. AC-0080 and AC-0081 are **not** touched by
either decision, which was the deciding factor in decision 6.

## review-round-21-terminal-stop-2026-09-17

**Round 21 ended in a terminal owner-decision stop.** The adversarial adjudication returned
`ADJUDICATION-INDETERMINATE` with a non-`None.` indeterminate audit, and
`review classify` refused the artifact as `invalid` / `indeterminate-present`. Under the
work-loop's rule the bounded evidence retry does not apply, because the missing fact is an
owner choice rather than something measurable here, and **the decidable findings may not be
cherry-picked out of an invalid artifact**. Nothing from that adjudication has been acted on.

| Artifact | Classification |
| --- | --- |
| `21-pre-execute-security-reviewer-raw.md` | `findings`, 6 parsed, footer present |
| `21-pre-execute-security-reviewer-adjudication.md` | `findings`, 2 fingerprints — **valid** |
| `21-pre-execute-adversarial-reviewer-raw.md` | `findings`, 13 parsed, footer present |
| `21-pre-execute-adversarial-reviewer-adjudication.md` | **`invalid` / `indeterminate-present`** |

Both reviewers' self-reported counts agreed with the strict parser this round, so no
enumeration dispute arose. Both adjudications were persisted by the orchestrator because
`finding-adjudicator` carries no write capability; neither envelope was reshaped.

**The secure-design adjudication is valid and stands: two sustained findings, both graded
down to Nit, four refuted, indeterminate audit `None.`** Both sustained Nits are recorded
below rather than repaired, because one of them is itself an owner choice.

| Ref | Grade | Sustained finding |
| --- | --- | --- |
| security finding 1 | Nit | The cut byte bound leaves a residual no *Follow-ons* entry records, though decision 5's own terms require one. Measured magnitude: the only surviving byte limb is the 120 s wall-clock, which bounds materialization at roughly 100–210 GiB, reachable inside the 50,000-file bound at about 2 MiB per file |
| security finding 2 | Nit | The liveness token is timezone-rendered while the pinned environment pins no zone, so a first-limb comparison can reclaim rather than decline. Independently probed and confirmed: the same live process renders `Wed Sep 16 21:23:12 2026` by default, `Thu Sep 17 11:23:12 2026` under `TZ=Asia/Tokyo`, and `TZ` appears nowhere in `runtime-environment.ts` |

The four refuted secure-design findings established one fact worth carrying forward:
`createPerRequestStateRoot`, `writeOwnershipMarker`, `readProcessStartTime` and all of
`sweep.ts` are imported **only by their own tests**. Production's supervisor calls
`reserveStateRoot` alone, and the Runtime child inlines its own marker write and sweep. Those
modules are therefore a tested reference implementation rather than a production path, which
is why three findings resting on their reachability were refuted.

## open-owner-decision-2026-09-17-environment-scope

**A seventh owner decision, and the one the terminal stop is waiting on.** It is a scoping
question about two criteria's domain, and the contract currently answers it both ways.

**The conflict, verified directly against the tree rather than taken from the finding.**

- **AC-0023** at `spec.md:415` quantifies universally: "**Every process Studio spawns**
  carries exactly the unconditional names in the *Environment allowlist* at their stated
  values, and no `GIT_CONFIG_PARAMETERS`."
- The **Environment allowlist preamble** at `spec.md:95` scopes narrowly: "The environment
  **of the Runtime child and of every process in its descendant tree** is constructed from
  an empty object."
- The *Permitted executables* row, as this amendment rewrote it at `spec.md:55`, admits
  `/bin/ps` partly on the ground that **the Studio Service already depends on it for
  parent-side process-tree observation** — which is what put a spotlight on the ambiguity.

**What actually sits in the gap.** `process-tree-observer.ts:202` and `:237` call
`spawnSync(PS, …)` with `{ encoding: "utf8" }` and **no `env`**, so they inherit the Service's
ambient environment, and they reach no spawn audit. Under AC-0023's universal reading those
are violations; under the preamble's scoping they are outside it entirely. **This predates
the amendment** — the observer is T4's, landed in `e171a0a` — and T4 is now pinned, which is
why the question is worth settling deliberately rather than by an incidental edit.

**Routes, none recommended here.**

- **Scope both criteria to the trial tree.** Narrow AC-0023's "Every process Studio spawns"
  to the Runtime child and its descendant tree, matching the preamble that already says so
  and the threat model the criteria exist for: the trial tree is where attacker-influenced
  data is processed, and the Service's own observer processes none. Smallest edit, changes no
  code, and makes the two surfaces agree. It narrows a criterion, which is a weakening.
- **Bind every process Studio starts.** Keep AC-0023 universal and make the Service's
  observer rebuild its environment from the allowlist and route through an audit. Strongest
  reading, no criterion weakened — but it changes T4's delivered behaviour after T4 was
  pinned, and the observer's `ps` reads the environment of *other* processes, so a rebuilt
  environment for the reader buys no containment it does not already have.
- **Split the obligation explicitly.** State that environment construction binds the trial
  tree while the audit binds every spawn Studio's own code performs, so the observer joins
  the audit without joining the allowlist. Matches what the code already does most closely,
  at the cost of one more distinction in a criterion pair that already carries two legs.

**Why nothing can proceed until this is settled.** The adjudication that carries round 21's
adversarial findings is invalid, and the rule forbids extracting its decidable findings. The
replacement is a **complete** re-adjudication over the unchanged round-21 raw findings, filed
as round 22, and it cannot be dispatched until this question has an answer to apply.

## owner-decision-2026-09-17-environment-scope

**Decision 7, decided 2026-09-17: scope both obligations to the trial tree.** The owner chose
the first route offered at `#open-owner-decision-2026-09-17-environment-scope`, over binding
every process Studio's own code starts, and over splitting construction from audit. It ends
the terminal stop recorded at `#review-round-21-terminal-stop-2026-09-17`.

**What it settles.** AC-0023's environment obligation and AC-0025's spawn-audit leg both bind
**the Runtime child and every process in its descendant tree**, and nothing outside it. The
Studio Service's own parent-side process-tree observer is therefore outside both, and its
`ps` reads at `process-tree-observer.ts:202` and `:237` are conforming rather than
violations.

**The ground.** The narrow reading is what the *Environment allowlist* preamble at
`spec.md:95` already states, and it matches the threat model the two criteria exist to serve:
the trial tree is where attacker-influenced repository data is processed, and the Service's
observer processes none of it. The universal alternative would also have bought no
containment it does not already have — the observer's whole function is to read *other*
processes' environments, so rebuilding its own changes nothing an attacker could reach — while
changing T4's delivered behaviour after T4 was pinned by this amendment's own transition.

**What follows, and it is a defect rather than a no-op.** AC-0023 at `spec.md:415` currently
quantifies over "Every process Studio spawns", which this decision makes **wrong text**: the
criterion now says more than it means, and it contradicts the preamble two sections above it.
Narrowing that quantifier is a required repair in this amendment, not an optional
clarification. AC-0025's second leg needs the same scoping made explicit where it says
"every spawn Studio's own code performs".

**Sequencing note.** This decision is recorded before the spec text is touched, deliberately.
The replacement adjudication for round 21 must judge the **same tree the reviewers read**, so
the authority is filed first and every repair — this narrowing included — lands in one pass
after that adjudication returns. Editing the criterion first would shift the line numbers the
round-21 findings cite and would refute findings for the wrong reason.

## review-round-22-2026-09-17

**Round 22 is the replacement adjudication decision 7 unblocked, and it is valid.** Filed as
`22-pre-execute-adversarial-reviewer-adjudication.md` over round 21's **unchanged** raw
findings; `review classify` returned `findings` with 11 fingerprints and an indeterminate
audit of `None.`, ending the terminal stop. No verdict was inherited from the refused round-21
artifact, and no finding was cherry-picked out of it.

**Eleven sustained, two refuted.** Six Blockers, three Concerns, two Nits.

| Ref | Grade | Repair applied |
| --- | --- | --- |
| 1 | Blocker | T5's Done-when demanded "the two pass bars met" while the same task recorded one as failed, so T5 was unsatisfiable. Now states the one surviving bar and the throughput measurement as the failing evidence for the cut |
| 2 | Blocker | T6's test bullet still named the tree-bytes kill. Reduced to the file-count kill and the two wall-clock deadlines, noting no byte ceiling is tested because none is enforced |
| 3 | Blocker | AC-0051's "within the same recorded tolerance" lost its antecedent when the criterion above it was retired. It now names the *Materialized file count* row's tolerance directly |
| 4 | Blocker | The closing *Resource bounds* sentence claimed fetch depth was the only control bounding what a repository can bring, contradicting the file-count row beneath it. Restricted to **bytes** |
| 5 | Blocker | The cut had no *Follow-ons* residual, which decision 5's own terms required. Added, owner-named, carrying its ledger anchor, the "for now" framing and the four surviving constraints. Per the adjudication this needs no additional `workspace.toml` entry |
| 6 | Blocker | The row's claim that every ps spawn is audited had no artifact that could fail — deleting `recordSpawn` left the suite green. The AC-0025 test now **requires** an audit entry naming the admitted path and carrying `lstart=` |
| 7 | Concern | The measurement harness still documented two pass bars, the cut bound, and a conclusion measurement 1 disproved. Header and docstring corrected |
| 8 | Concern | Four copies of the ps literal. Both importable sites now take it from `PROCESS_STATUS_EXECUTABLE`, the constant the permitted predicate reads |
| 9 | Concern | AC-0023's universal quantifier, per decision 7. Narrowed to the Runtime child and its descendant tree, with AC-0025's second leg given the same scope explicitly |
| 11 | Nit | The `run` comment claimed the single process-start site. Corrected, naming why the process-status read sits outside it |
| 12 | Nit | The dangling referent left by the plan edit. Named and reflowed |

Both Nits were repaired rather than deferred, because applying any sustained finding already
obliges re-running the reviewer, so the two prose fixes cost nothing beyond a round that was
happening regardless — the opposite of the round-19 calculus, where the Blocker and Concern
were the only repairs and deferring kept the footprint off perturbation-prone criteria.
Neither Nit touches a criterion.

**Refuted:** finding 10, which demanded a stated magnitude decision 5's ground rules out and
rested on the false premise that no secure-design pass covers this amendment; and finding 13,
whose requested note already exists in the predicate's own comment.

**Verification debt, stated rather than papered over.** Every affected test file passes in
isolation — per-request-state-root 17, sweep 18, materialization-confinement 11,
materialization 4, disposal 7, runtime-supervisor 23, git-driver 20, hostile-fixture 41, so
**141 tests across the trial runtime** — and `pnpm lint` and `pnpm typecheck` both exit 0.
**A green full parallel run is owed and was not obtained**: the host reached one-minute load
averages of 107 to 117 on 10 cores while these repairs were verified, and under that
contention the parallel suite times out with a varying failure set that includes
`materialization.test.ts` cases which spawn no Runtime child and run no sweep, so the cause
is the host rather than this change. Two consecutive clean full runs of 343 tests were
obtained earlier the same day at load 12 to 19. The owed artifact is one full `pnpm verify`
on a quiet host before the amendment's human gates close.

## deferred-nit-2026-09-17-liveness-token-zone

**One sustained finding deferred with its citation, because its fix is an owner choice.**
Secure-design finding 2 of round 21, sustained and graded **Nit** at
`21-pre-execute-security-reviewer-adjudication.md`. The adjudicator declined to prescribe a
remedy and said so explicitly: "the route is an owner choice and this entry prescribes none."

| Ref | Severity | Citation | Deferred finding |
| --- | --- | --- | --- |
| security finding 2 | Nit | `apps/studio-service/src/trials/connect-and-orient-runtime/runtime-child.ts:311` | The liveness token is the wall-clock string `ps -o lstart=` prints, compared for byte equality in AC-0081's first limb, while the pinned environment sets `LANG` and `LC_ALL` to `C` and pins **no** `TZ`. A rendering that moves for an unchanged process falls through to a reclaim rather than to the `declined` outcome every other uncomparable input takes |

**Independently confirmed, not taken on the reviewer's word.** The same live process renders
`Wed Sep 16 21:23:12 2026` by default, `Thu Sep 17 11:23:12 2026` under `TZ=Asia/Tokyo` and
`Thu Sep 17 02:23:12 2026` under `TZ=UTC`; `TZ` appears nowhere in `runtime-environment.ts`.

**Why it is a Nit rather than a Concern.** Reachability is narrow: the child's sweep skips its
own root, so harm needs a *second* live Runtime — which the *Follow-ons* residual and
AC-0081's own two-Runtime clause admit — plus a host zone change inside that Runtime's 150 s
window. It is a host event, not an attacker capability.

**Why it is deferred rather than repaired.** Every route is an owner decision, and two of the
three touch the text this amendment was specifically shaped to leave alone:

- **Pin `TZ` in the allowlist.** Smallest code change, and it makes the rendering stable. But
  widening the *Environment allowlist* is Ask-first under *Boundaries*, so it is not mine.
- **Fail closed on any mismatch the comparison cannot vouch for.** Routes the case into the
  existing `declined` outcome, which is AC-0081's own fail-closed direction — but AC-0081
  currently says a mismatch *reclaims*, so this rewrites the first limb.
- **Change the token to something whose rendering cannot move.** Rewrites AC-0080's recorded
  start time.

The second and third would make AC-0080 or AC-0081 the subject of a fifth consecutive
rewrite. Decision 6 was taken specifically because it was the one route that left both
untouched, so spending that cost here would undo the reasoning behind it.

**Status: deferred, not resolved.** It is a Nit, so under the work-loop's rule a reviewer
result carrying only deferred Nits recorded with their citations may proceed to the human
gates. It is raised for the owner at
`#open-owner-decision-2026-09-17-liveness-token-zone` and should be closed in the Package 3
amendment window at the latest, which has to happen anyway.

## open-owner-decision-2026-09-17-liveness-token-zone

**An eighth owner decision, raised and deliberately not decided.** The three routes are
enumerated at `#deferred-nit-2026-09-17-liveness-token-zone` above. The choice is between
widening the environment allowlist, which *Boundaries* routes to Ask first, and rewriting one
of the two criteria this amendment was shaped to avoid touching. Nothing is blocked on it: the
finding is a Nit, the amendment may proceed to its human gates carrying it, and the hazard
needs a host zone change inside a 150-second window with two live Runtimes to reach.

## t5-verification-debt-cleared-2026-09-17

**The owed full run was obtained.** `pnpm verify` **exit 0** at a one-minute load average of
40.77 on the 10-core host: **343 tests in 33 files**, biome clean over **89 files**, and
`pnpm lint`, `pnpm typecheck` and `pnpm build` all green within it. `git diff --check` 0,
`lint-contract-item-alignment` 0 findings, and `spec-coupling-check` exit 1 on **exactly the
one known AC-0104 row**, which belongs to Package 3.

This closes the debt recorded at `#review-round-22-2026-09-17`. Worth noting against the
contention analysis there: the suite passed at load 41, having failed at load 23 to 24 earlier
the same day, which confirms the failures tracked *what else the host was doing* rather than
any threshold in the load average itself — several concurrent agent sessions with bursty
process-spawning phases, not a steady level. The practical rule for the next session is to
re-run rather than investigate a red suite whose failure set varies, and to judge a red run
only when the same tests fail twice in isolation.

The mutation proof that round 23's secure-design reviewer ran is recorded here because it is
the strongest evidence in this amendment: **deleting the `recordSpawn` call in
`runtime-child.ts` turns the AC-0025 test red** with "expected undefined to be defined",
against a green baseline, and the worktree was left clean. Round 22's finding 6 asked for a
leg that could fail, and the leg now fails when the obligation is removed rather than passing
incidentally.

## review-round-23-2026-09-17

**Round 23 re-reviewed the repairs, and the trajectory turned.** Both adjudications are valid
with an indeterminate audit of `None.`

| Reviewer | Raw | Sustained | Blockers | Concerns | Nits | Refuted |
| --- | --- | --- | --- | --- | --- | --- |
| adversarial | 8 | 7 | **0** | 2 | 5 | 1 |
| secure-design | 4 | 2 | **0** | 0 | 2 | 2 |

Sustained findings across the amendment now run **11, then 9**; blockers surviving
adjudication run **6, then 0**. Round 22's repairs held: the one finding alleging a repair
introduced a factual error — that AC-0051's restatement added a duration to a file count and
dropped the row's pass bar — was **refuted**, the adjudicator showing the row's own tolerance
column composes the same two terms and that "at or below 5,000" is the measurement's
advance-fixed ceiling rather than a term of the tolerance a kill test meets.

**Two Concerns repaired, both contract surfaces a completion gate reads.**

| Ref | Repair |
| --- | --- |
| adversarial 3 | AC-0024 kept an exhaustiveness quantifier over "every process Studio's own code starts" that no artifact could discharge, decision 7 having narrowed AC-0023 and AC-0025's second leg and left this third one behind. Both it and the implementing plan bullet now carry the trial-tree scope |
| adversarial 5 | The *Boundaries* Always-do rail demanded the complete pinned `git` configuration on **every** subprocess, which admitting a non-`git` executable made unsatisfiable. The configuration and `--` clauses are now scoped to `git` argument vectors, matching AC-0022 and AC-0021 |

**Seven Nits deferred with their citations**, on the round-19 precedent: repair only what
severity requires when the repairs themselves are generating the findings. Round 23 is direct
evidence of that — repair 9's scoping made the row's audit sentence false, and repair 4's
correction created a third disagreeing enumeration, so both of this round's headline Nits were
manufactured by round 22's own prose repairs. None of the seven touches a criterion.

| Ref | Severity | Citation | Deferred finding |
| --- | --- | --- | --- |
| adversarial 1 / security 1 | Nit | `spec.md:55` | The *Permitted executables* row still asserts every process-status spawn is recorded in the audit, which the narrowed AC-0025 no longer carries for Service-side reads. AC-0025 itself states the scope correctly, so no gate reads the false sentence |
| adversarial 2 | Nit | `spec.md:284` | Three enumerations of what bounds materialization after the cut disagree — the closing prose says "only", the row says three things, the residual says four |
| adversarial 4 | Nit | `runtime-child.ts:95` | The in-tree process-status path is a literal, though the module's own header says canonical values arrive in the plan. Drift would redden the audit loop rather than pass silently |
| adversarial 6 | Nit | `plan.md:46` | The repaired sentence attributes the advance-fixed ceiling to the sampler; the ceiling is the 5,000-per-interval pass bar |
| adversarial 7 | Nit | `executable-identity.ts:135` | The shared constant's docstring names only the Runtime, though it is now also the parent-side observer's launch path |
| security 2 | Nit | `spec.md:417` | AC-0023's justification says the observer "processes none of" the influenced data, but it parses `ps` command columns carrying owner, repository, ref and the resolved revision. Containment holds by charset — the revision is 40 lowercase hex, the ref charset excludes control characters — so the defect is the stated ground, not an exposure |
| security 2 (round 21) | Nit | `runtime-child.ts:311` | The timezone-rendered liveness token, already deferred at `#deferred-nit-2026-09-17-liveness-token-zone` and raised as owner decision 8 |

**Status: deferred, not resolved.** Each stands against its citation. None is a Blocker or a
Concern, which is the work-loop's condition for proceeding: a reviewer result that is clean, or
carries only deferred Nits recorded with their citations, may go to the human gates. All seven
should be carried into the Package 3 amendment window, which has to happen anyway.

## review-round-24-2026-09-17

**Round 24 was a tightly scoped pass over round 23's two repairs, and both reviewers
independently found the same defect in one of them.** Both adjudications are valid with
indeterminate audits of `None.` and nothing refuted.

| Reviewer | Raw | Sustained | Blockers | Concerns | Nits |
| --- | --- | --- | --- | --- | --- |
| adversarial | 2 | 2 | **0** | 1 | 1 |
| secure-design | 2 | 2 | **0** | 1 | 1 |

The two Concerns are the **same defect**, found independently, and it was mine: round 23's
AC-0024 repair narrowed the scope correctly and then appended a false equation. The appositive
read "within the trial tree — the Runtime child and its descendants, the same scope AC-0023
and AC-0025's second leg carry, **and the set the spawn audit records**". The last clause is
untrue, which I confirmed against the tree before either adjudication returned:
`resolveGitIdentity` is called at `runtime-supervisor.ts:254` while the child spawns at
`:316`, and `executable-identity.ts:52-55` already records that the `/usr/bin/git` shim probe
is "spawned once, by the Studio Service and outside the Runtime's process group". The spawn
audit is therefore a **strict superset** of the trial tree, so one obligation carried two
mutually exclusive scopes on a gated criterion.

**Repaired by deletion.** The appositive is struck from AC-0024, from the T4 plan bullet that
drives its assertion, and from this ledger's own round-23 row, which restated it. The
trial-tree scope decision 7 settled is now the criterion's single stated scope. Nothing was
added: the secure-design adjudication graded the reviewer's own proposed mechanism
**over-broad** for additionally requiring the text to name the out-of-tree class and say what
holds it, because AC-0028 already obliges both identity probes to run under the pinned
environment and AC-0020 already binds every subprocess to an absolute path and an argument
array. No out-of-tree obligation was introduced, which decision 7 declined.

**One Nit deferred with its citation**, bringing the standing deferrals to eight — seven in round 23's table and this one. Round 21's byte-bound residual Nit is not among them: repair 5 closed it by adding the *Follow-ons* entry.

| Ref | Severity | Citation | Deferred finding |
| --- | --- | --- | --- |
| adversarial 2 / security 2 | Nit | `spec.md:322` | The rescoped Always-do rail grounds its exemption on the row admitting only "an interpreter probe, and `/bin/ps`", but the row also admits the Runtime's own Node process, whose vector does carry the pinned configuration as delivered payload. No criterion coverage is lost — AC-0021 and AC-0022 were already `git`-scoped before this amendment — so the defect is the stated ground, not the obligation |

**The pattern, recorded plainly because it is the lesson of this amendment.** Three
consecutive rounds saw a repair manufacture the next round's finding: decision 7's scoping
repair made the *Permitted executables* row's audit sentence false and left AC-0024's
quantifier behind; repairing AC-0024 added this false equation; and the closing-sentence
repair created a third disagreeing enumeration. Every one of those was an **addition** to
prose — a clause explaining or equating something. This round's repair is a **deletion**, and
deletions have not produced findings. Severity collapsed accordingly: blockers surviving
adjudication ran 6, then 0, then 0, and the surface narrowed from eleven findings across the
contract to one clause.

## t5-gate-state-2026-09-17

**The gate state at the close of round 24, stated precisely rather than optimistically.**

`pnpm verify` returned **exit 0** with **343 tests in 33 files** and biome clean over 89 files
on commit `6f86c30`. The only commit after it, `c56b626`, changes **three markdown files and
no code** — `git diff --name-only 6f86c30..HEAD` lists the spec, the plan and this ledger, and
matching `\.(ts|tsx|mjs|js|json)$` against that diff returns nothing. The compiled and tested
surface is therefore byte-identical to a green-verified state, so the recorded pass carries to
`HEAD` by construction rather than by assumption.

Re-running `pnpm verify` on `HEAD` was attempted four times and returned a **varying** failure
set — 1 test, then 16, then 1, then 2 — at one-minute load averages of 188, 52, 48 and 38 on
the ten-core host. A varying set under contention is the signature this ledger already records
at `#t5-verification-debt-cleared-2026-09-17`, and the same suite passed earlier the same day
at loads 41 and 52, so the failures track what else the host is running rather than any load
threshold or any property of this change.

**The gates that do not depend on process spawning all pass on `HEAD` directly**: `pnpm lint`
0, `pnpm typecheck` 0, `git diff --check` 0, `lint-contract-item-alignment` 0 findings,
`lint-spec-status` clean, and `spec-coupling-check` exit 1 on exactly the one known AC-0104
row, which belongs to Package 3.

**What the next session should do rather than re-litigate this.** Run one `pnpm verify` on a
host whose one-minute load is in single digits and record it against `HEAD`. Judge a red suite
only when the same tests fail twice in isolation; every isolated run of every affected file
has passed, most recently at load 112.

## pre-execute-review-closure-2026-09-17

**The pre-EXECUTE review requirement for this amendment is satisfied at round 25.** The
secure-design reviewer returned the **clean sentinel**, classified `clean` with zero findings,
so no adjudicator was dispatched — the gateway rule fast-paths only a report whose bytes are
the sentinel, and this one's were. The adversarial reviewer returned **two Nits and nothing
else**. Under the work-loop's rule a result that is clean, or carries only deferred Nits
recorded with their citations, may proceed to the human gates.

**Round trajectory across the amendment.** Sustained findings: 11, 9, 4, 2. Blockers surviving
adjudication: **6, 0, 0, 0**. Concerns: 3, 2, 2, **0**. The surface narrowed from eleven
findings spread across the contract to two items on non-gated surfaces.

**Both round-25 Nits were applied rather than deferred, because neither is a contract repair.**

| Ref | Applied |
| --- | --- |
| adversarial 1 | The round-24 entry said the standing deferrals numbered nine; the cited tables hold eight. Corrected, and the reason for the discrepancy recorded: round 21's byte-bound residual Nit was closed by repair 5, which added the *Follow-ons* entry, so it is no longer standing. This was my arithmetic error in a record, and it had been repeated to the owner |
| adversarial 2 | Striking the false clause left a 96-column continuation line in T4's tests bullet where its neighbours sit at 71 to 79. Reflowed. Presentation only; the obligation and its referent were already confirmed intact |

**No round 26 is run, and the reason is recorded rather than left implicit.** Applying a
sustained finding ordinarily obliges re-running the reviewer that produced it. That rule is
not invoked here because the review's exit condition was **already met before these two edits**
— secure-design clean, adversarial Nits-only — and neither edit can move a result that has no
Blocker and no Concern. One corrects an arithmetic error in this ledger, which is explicitly
not hash-pinned and carries no obligation; the other changes a line's wrap width. Neither
touches a criterion, a bound, a boundary rail or any code. Running a further round over a
count and a line break is the non-convergence this contract's own history warns against, and
both contract hashes are unchanged by either edit.

**Verification at closure.** `pnpm verify` **exit 0** with **343 tests in 33 files** on `HEAD`
at a one-minute load average of 34.83, obtained after the round-24 deletion — so the green run
now sits on the current tree directly rather than carrying by construction from `6f86c30`. The
two edits above are markdown-only and post-date it.

## amendment-closed-2026-09-17

**The narrow amendment is approved and the run is back in EXECUTE.** The owner approved both
gates on 2026-09-17, authorizing the sequence explicitly rather than by inference, and the
engine walked `spec-ready` → `reviewers-clean` → `spec-approved` → `plan-approved` →
`plan-locked`, reaching `CODE-IMPLEMENTATION` at transition sequence 51. New pins:
`approved_spec_hash=2473869de61f…`, `approved_plan_hash=8d564e2b677f…`. `amendment_pending`
is cleared and `amendment_history` carries three entries. All three retry counters are still
**0** after five review rounds, because pre-EXECUTE rounds consume no budget.

The schedule rebuilt to `[[T5],[T6],[T7],[T8,T9],[T10],[T11],[T12],[T13]]` with T1 through T4
excluded as completed and pinned, so T5 is again the current wave at index 0.

**A guard caught a protocol violation, and the revert was also the substantively right
answer.** `approve-plan` refused with "completed task section changed: T4". Round 23's repair
had edited the AC-0024 assertion bullet inside **T4's plan section**, which this amendment's
own transition had pinned — the adjudication directed the edit at `plan.md:259` without either
of us noticing the line sits inside a pinned task. The bullet is restored to its pinned text,
byte-identical, and the fix lives only in AC-0024 itself, where the obligation belongs.

That is not merely a procedural retreat. Round 25's secure-design review established the
implemented assertion iterates the **merged** audit array — the Service-side probe set
concatenated with the child's records at `runtime-supervisor.ts:512` — so it asserts over a
**superset** of the trial tree, and "asserting over the superset discharges the narrowed
criterion a fortiori". T4's original bullet therefore describes what T4 actually implemented
and verified, while the narrowed wording would have described something weaker than the
delivered assertion. The criterion is narrowed; the test is not.

**The status line is excluded from the canonical contract hash**, verified directly: setting
spec.md from `Approved` to `Implementing` leaves `sha256_canonical_contract` at
`2473869de61ff113`. So the EXECUTE status write cannot disturb a fresh pin, which is worth
recording because the reverse would have made the two obligations contradictory.

## t5-evidence

**T5 — materialization is confined, measured, and disposable. Complete.** All fifteen criteria
carry implementation and tests: AC-0069 through AC-0083.

| Criterion | Discharge |
| --- | --- |
| AC-0069 | Link neutralization by the pinned `core.symlinks=false`, asserted over a fixture carrying `escape -> ../../outside`: no symbolic link remains anywhere under the root, and that path is a regular file holding the literal target string |
| AC-0070 | The state root is reserved by `mkdtemp` at `0700` inside the verified domain, its `tree` child is the materialization root, and the marker is the tree's sibling |
| AC-0071 | The sweep domain reaches the Runtime as `--sweep-domain`, read by name, and echoed on the `started` line so the assertion is against what the Runtime read |
| AC-0072 | Verified on every use; fails closed on absent, link, non-directory, foreign owner and permissive mode |
| AC-0073 | Containment on resolved real paths at a path-segment boundary; a sibling extending the root and an escaping link are both refused |
| AC-0074 | Directory and FIFO refused; a device reached through a contained link refused on containment first |
| AC-0075 | Size checked before the open; at-bound admitted, one byte over refused |
| AC-0076 | The removal walk `lstat`s at every level and unlinks a link rather than descending it, proven by a link planted at depth whose target survives |
| AC-0077 | The group is gone after the response; nothing outlives it |
| AC-0078 | Distinct unpredictable roots per request, and the first is gone before the second exists |
| AC-0079 | Removal on success, on failure and on `SIGTERM`; the signal test requires the disposal line to name `SIGTERM`, so the signal path is proven to have run rather than merely inferred |
| AC-0080 | Marker created exclusively and written once before any other child, removed last, kept if anything survived. The encoding property is proven over **every** prefix of the write |
| AC-0081 | All three limbs, the entry gate, the live-process refusal, both age gates and every decline route |
| AC-0082 | The Service invokes the sweep; the Runtime performs it, because reclaiming descends `tree`. The sweep line appears in the child's protocol stream, which is the structural proof |
| AC-0083 | Declines and removal failures both surface, naming limb and input class, carrying no repository-derived payload |

**Measurements** at `#t5-measurements-2026-09-16`, with the methodology corrections that took
three attempts to get right. **Done-when** is satisfied on all four limbs: `pnpm verify` exit
0 with 343 tests in 33 files; the four measurements recorded; the one surviving pass bar met
at 874–1,437 files per interval against 5,000; and the write-throughput measurement recorded
as the failing evidence that cut the tree-bytes bound rather than as a bar to be met.

## t6-inspector-read-reach-confirmed-2026-09-17

**The accepted residual at `#owner-decision-2026-09-16-inspector-read-reach` is CONFIRMED, and
both of its open questions are answered.** The residual recorded that the pinned inspector's
source lies outside this repository and had never been read, leaving unknown whether pack
`core` at the pin ever opens a repository-declared path operand and whether its traversal
follows symlinks. T6 is the point the residual named. The source has now been read.

**The pin, established here as AC-0043 requires.** Pack `core`, version **2.26.0**, repo
scope, source `git+https://github.com/eugenelim/agent-ready-repo`, reported by
`agentbundle list-installed` (CLI 0.46.1, spec 0.18; the catalogue offers 2.26.10, so the pin
is deliberate rather than incidental). The two inspector files are the repo-scope install
inside this worktree at `.claude/skills/workspace-status/scripts/`, so nothing under
`agent-ready-repo` was touched to read them.

| File | SHA-256 |
| --- | --- |
| `workspace_status.py` | `dec939e052750af346325c9895c75bfa38bcc2795111afcb6e001e817706f1db` |
| `workspace_status_engine.py` | `2e6b6037ea5f02fd477cd37105a9e58efef6c27681e245e7abdc6b8e9d89899b` |

**Question 1 — does it open a repository-declared path operand? YES, in three shapes, and
each is confined by the inspector itself.**

1. `_confined_artifact_path(root, rel_path)` at `workspace_status_engine.py:1806` joins a
   repository-relative path, gated first by `_is_repository_relative_path`, then
   `resolve()` and `relative_to(root_resolved)`, returning `None` on `OSError`,
   `RuntimeError` or `ValueError`.
2. Spec slugs at `:3854` join `(specs_dir / slug / "spec.md").resolve()` and check
   `relative_to(specs_dir)` — **with a pre-join rejection of absolute paths and any `..`
   part**. The docstring states why the pre-join check is not redundant: "resolve() alone
   normalises traversal so the relative_to check would silently accept `foo/../bar`; the
   pre-join rejection closes that gap." That is the same segment-boundary reasoning AC-0073
   states for Studio's own readers, reached independently by the inspector's authors.
3. Lifecycle-record locators at `:2125` join `(root / locator).resolve()` with **no**
   `relative_to` confinement. This is fail-safe rather than a gap: the resulting set is
   `cooled`, which `:378` describes as the set telling the inspector "which entries it may
   **not** open", and `:1684` consumes it as a membership test that *suppresses* reading an
   artifact's body. An escaping locator can therefore only add an out-of-root path to a
   do-not-open list, which no in-root artifact path will ever match. It cannot cause a read
   outside the root.

**Question 2 — does its traversal follow symlinks? NO.** `workspace_status_engine.py:4266`
walks with `os.walk(str(specs_dir), followlinks=False)`, and the comment two lines above
records the reason: "os.walk(followlinks=False) prevents escaping the repo via symlinked dirs
found DURING traversal (rglob follows symlinks on Python 3.11/3.12)." The same discipline
recurs as explicit refusals — `record_path.is_symlink() or not record_path.is_file()` at
`:2094`, and `.is_symlink()` guards at `:2078` and `:2151` — and `RuntimeError` is caught
around `resolve()` specifically to survive circular symlinks.

**Consequence for AC-0069, which the residual said depended on this answer.** The protection
is now **doubly held**, and the residual's framing was the more pessimistic of the two. The
pinned `core.symlinks=false` already guarantees no symbolic link exists anywhere under the
materialization root — probed and asserted at `#t5-progress-2026-09-16` and by
`materialization.test.ts` — so there is nothing for the inspector to follow; and independently
the inspector does not follow links even where they exist. The correction to the residual's
wording recorded at `#owner-decision-2026-09-16-cut-tree-bytes-bound` therefore stands
reinforced rather than merely asserted.

**Consequence for AC-0054.** The inspector's own traversal is self-confined by
`resolve()` plus `relative_to`, with pre-join rejection of `..` and absolute paths on the one
operand that reaches a file body. AC-0054 continues to scope the permitted read surface to the
Runtime's declared-value reader and routes the inspector's traversal to AC-0069 and AC-0073
for links and to the wall-clock and memory bounds for everything else; nothing in what was
read requires that routing to change.

**This closes the residual.** It asserted no confinement and fixed only where the questions
would be answered; both are now answered against the recorded pin, before the inspector is
used. Decision 2's remaining half — whether T6's plan section should carry a named
confirmation bullet so that skipping it fails a gate — is unchanged and still belongs to the
Package 3 amendment window, since T6's section cannot be edited outside an amendment path.

## t6-evidence

**T6 — the inspector runs from outside the target under supervised bounds. Complete.** All
twenty-two criteria carry implementation and tests: AC-0043 through AC-0049, AC-0051 to
AC-0053, and AC-0133 to AC-0145 except AC-0138.

| Criterion | Discharge |
| --- | --- |
| AC-0043 | `locateTrustedInspector` records the resolved real path, pack name, pack version and both SHA-256 digests. Each field is read from the inspector actually resolved rather than copied from the pin, asserted by re-hashing the resolved files and comparing |
| AC-0044 | Three named mismatches — pack name, pack version, file digest — each yielding `inspector-unavailable` with the disagreeing values in the message. A fourth test admits a fully matching inspector, so the refusals are not blanket |
| AC-0045 | An inspector resolving inside the materialization root is refused before its files are read, reusing `containsOnSegmentBoundary`. A sibling merely extending the root's name is admitted, which is the segment-boundary distinction AC-0073 states |
| AC-0046 | `selectConformingInterpreter` takes the first probe reporting 3.11 or later, and skips a non-conforming interpreter that precedes a conforming one |
| AC-0047 | An absent inspector refuses with `inspector-absent`. The no-fallback proof plants T1's projected-skill shape under `.agents/skills/` and asserts the refusal is unchanged and never names that path |
| AC-0048 | No conforming interpreter yields `inspector-unavailable` naming the requirement — the version required, not merely the versions seen — including when the search list found nothing at all |
| AC-0049 | `submodule.recurse=false` is pinned in the canonical configuration and asserted present on every `git` vector the Runtime builds, read back from the child's own spawn audit rather than from the constant alone |
| AC-0051 | The Runtime's file-count sampler walks the materialization root on the bound's interval, and on the first sample observing the bound crossed it stops the writer, reports both instants, and signals the group. Four tests: the breach fires; the tolerance holds against the sampler's own reported interval and sample duration; the tree ends far short of what an unkilled writer would have written; and a tree inside the bound does not fire it |
| AC-0052 | The resolution subprocess is killed at its exact deadline with its own diagnostic, which names resolution and not the inspection deadline. A resolution finishing inside the deadline completes untouched |
| AC-0053 | The inspection deadline kills the group and names itself in the diagnostic; an inspection finishing inside it completes. Both directions asserted |
| AC-0133 | No hook runs during materialization, read from the probe log the parent owns; the same probe fires when `core.hooksPath` is unpinned |
| AC-0134 | No package script runs, same channel. The declaration and the script are both asserted present, so the absence is of a repository that genuinely carries the thing that did not run |
| AC-0135 | No projected skill executable runs, same channel, with the executable asserted materialized |
| AC-0136 | The guard refuses the whole checkout — `invalid path '.GIT'` under `core.protectHFS` — so nothing is overwritten because nothing is written. The refusal itself is asserted, the real `.git` is proven intact after it, and no `.GIT`-named entry reaches the tree |
| AC-0137 | No filter command runs, same channel, with the `filter=probe` declaration present and `filtered.txt` still at its committed bytes |
| AC-0139 | The escaping link materializes as a regular file holding `../../outside` as content, and no symbolic link remains anywhere under the root |
| AC-0140 | The reader refuses a sibling extending the root and a parent-traversing path, independently of materialization, while admitting an ordinary contained file |
| AC-0141 | A `.gitmodules` entry fetches nothing: no `outside/` in the tree, no `.git/modules`, with the declaration materialized as inert data |
| AC-0142 | An option-shaped reported ref is refused by canonicalization, so no argument vector is built from it; an ordinary ref is admitted |
| AC-0143 | The parse guard refuses `__proto__`, `constructor` and `prototype` at any depth in both TOML and JSON, yielding no value at all rather than a sanitized one, with `Object.prototype` proven unmutated and ordinary documents still admitted |
| AC-0144 | A module-resolution hook observes that reading the materialized module's bytes resolves no specifier under the root, the import marker stays unset, and the Runtime child is audited to import `node:` builtins only with no dynamic import |
| AC-0145 | No HTTP request leaves Studio's own process during materialization, the pinned environment carries no credential-bearing name, and `credential.helper=` is pinned on every `git` vector |

**AC-0138, AC-0146 and AC-0147 are deliberately not discharged here**, exactly as the T6 plan
section states. AC-0138 observes a verdict, a routing decision and a state, none of which exist
until T9 and T10; AC-0146 observes storage, which does not exist until T11; AC-0147 ranges over
AC-0133 to AC-0146 and so cannot close until the last of them does. All three reuse this
harness, so probe identity stays pinned across the three tasks.

### Where the file-count sampler lives, and why

**The sampler runs in the Runtime child, not in the Service-side supervisor.** AC-0051 names
"the Runtime supervisor" and the *Materialized file count* row says it "samples the tree", but
sampling a tree means opening paths under the materialization root, and the boundary is
explicit that the Studio Service process opens none. This is the same fork AC-0082 already
resolved for the sweep, with the same answer and for the same reason: the Service *invokes*,
the Runtime *performs*, because the work requires descending `tree`. The resident-memory
sampler stays on the Service side because it reads `ps`, not paths. No contract text needed to
change for this; the boundary decides it.

### Two mechanisms probed before they were authorized

- **`module.registerHooks` observes resolution synchronously in-process** on Node v26.4.0, which
  is what lets AC-0144 assert an absence over *any* specifier rather than only over the one
  fixture module.
- **`JSON.parse`'s reviver fires for `__proto__`** and for a nested `constructor`, confirmed
  before the guard was written. That is why the JSON arm refuses during the parse while the
  TOML arm refuses immediately after it — `smol-toml` exposes no reviver. The asymmetry is
  recorded in the module rather than smoothed over.

### `smol-toml` is admitted here, with a call site

The plan's *Parser dependencies* note authorizes `smol-toml` exact-pinned and argues a parser
should not be admitted before it has a caller. T6 supplies one: AC-0043 requires recording the
inspector's pack **name and version**, which are declared in `.agentbundle-state.toml`, and
line-pattern grepping structured configuration is the anti-pattern the work-loop names. Pinned
at **1.8.0**. T7's reader builds on the same guard rather than introducing a second parse path.

### A correction to T1's corpus, required by AC-0147's same-level clause

The `package-script` and `projected-skill-executable` probes wrote their markers to stdout only.
An absence cannot be read from stdout, so a proof observing the process tree while its control
observed stdout would have been observing at two different levels — which AC-0147 forbids.
Both probes now append to `$STUDIO_PROBE_LOG` as well, and their controls read that log, so
each pair shares one channel. `PROBE_LOG_MARKER` holds the markers once so neither half can
drift onto a spelling the other does not read. The `HOSTILE_CASES` list and
`HOSTILE_CASE_BY_CRITERION` are untouched, and all 41 corpus tests still pass.

### Mutation proof

Deleting `writer?.kill("SIGKILL")` from the file-count sampler turns exactly one test red —
"leaves the tree far short of what an unkilled writer would have written" — against a green
baseline, and the other twelve in that file stay green. The kill is therefore load-bearing
rather than incidental, and the assertion that proves it is the one that would have to be
deleted to hide a regression.

### Gate state

Each gate run separately: `pnpm lint` exit 0 over 94 files; `pnpm typecheck` exit 0;
`pnpm test` exit 0 with **412 tests in 36 files** at load 48 (baseline 343 in 33, so T6 adds
69 tests in 3 files); `pnpm build` exit 0; `git diff --check` clean;
`lint-contract-item-alignment` 0 findings; `lint-spec-status` clean. `spec-coupling-check`
exits 1 on the single known two-cell row at `spec.md:276`, which is AC-0104's and belongs to
Package 3 — unchanged by this task.

**`pnpm verify` has not been observed exit 0 on this host, and that is recorded rather than
smoothed over.** Both of its runs this session ended exit 1 inside `disposal.test.ts` and
nowhere else: on arrival, *before any T6 change*, three failures led by a 5,005 ms timeout
cascading through the global single-in-flight guard; after T6, a single different failure in
the same file. A varying failure set confined to that file is the documented contention
signature. `disposal.test.ts` passed 7/7 in isolation immediately after the arrival run, and
7/7 twice more in isolation after the post-T6 run, which is the two-in-isolation rule this
ledger judges a red suite by. The four gates `verify` chains each pass individually, so the
exit-1 observations are the host's scheduling, not this delivery's code — and the arrival run
proves the flake predates T6.

No test in this delivery binds a listener, opens a socket, or requires a network, a credential
or a model provider.

## t7-evidence

**T7 — the version marker is read, parsed safely, and never over-read. Complete.** All seven
criteria carry implementation and tests: AC-0054 through AC-0060.

| Criterion | Discharge |
| --- | --- |
| AC-0054 | `readDeclaredValues` admits exactly `workspace.toml` and `.agentbundle-state.toml` and refuses anything else before reading it, including a traversal whose final segment is a permitted name. Both permitted files read in one call |
| AC-0055 | Both bounds checked before any read: the file count against the requested set, and the byte bound delegated to `readContainedFile`, which already checks size before the open. A file one byte past 1 MiB refuses with `exceeds-byte-bound` and no value; one inside it is admitted |
| AC-0056 | JSON depth is measured **over the text, before `JSON.parse` runs**, because the parser is itself the recursion the bound guards — a guard placed after it could never run on a document deep enough to exhaust the stack. The already-parsed walk is iterative with an explicit stack and abandons past the bound, so nothing recurses. A document at the bound is still admitted |
| AC-0057 | The approved plan stub is materialized byte-identical and passes. Inadmissible keys are dropped at every depth in both formats, every object is rebuilt with `Object.create(null)`, and `normalizeDeclared` copies only criterion-named fields onto a fresh object — a declared field outside that set reaches nothing |
| AC-0058 | Asserted inapplicable rather than skipped: the permitted surface is TOML only, and the service manifest is read in the test to prove no `yaml` dependency exists and `smol-toml` is pinned at 1.8.0. The clause binds the slice that first parses YAML |
| AC-0059 | Every refusal yields `value: undefined`, a distinct diagnostic, and the stop reason its subject assigns. All three AC-0059 rows are present and proven distinct, with attribution `Studio` for Studio-produced output and `repository` for both repository-derived rows. A document whose readable prefix parses contributes nothing when the rest fails |
| AC-0060 | The declared marker is reported as an observed string and nothing more. Lifecycle-shaped keys a repository declares — `status`, `blocked`, `next-action` — reach nothing, because normalization copies only the criterion-named field |

### The guard's semantics were corrected here, not at T6

T6 shipped the inadmissible-key guard refusing the **whole document**. Reading T7's contract
showed that to be stricter than what is written: AC-0057 requires that no parse *yields a value*
under an inadmissible key **and** that every parsed document be materialized without an
inherited prototype — so a value is still produced, with those keys absent. The approved T7 stub
says the same thing independently, reading `out.value` and asserting a null prototype on it.

The guard now drops the key and rebuilds with `Object.create(null)`, and AC-0143's T6 proofs were
rewritten to assert the absence of a value under the key rather than a throw. **One guard, one
semantics, used by both tasks.** Had this been left, T6 and T7 would have carried two
contradictory readings of the same *Resource bounds* row — the disagreeing-enumeration failure
this contract has already hit three times.

### One declined seam

`parseDeclared` briefly took an injectable TOML parser. It was removed before it reached a gate:
no caller varies it, and its default threw, so the only behaviour it could add was failing closed
when someone forgot to install one. `smol-toml` is imported directly, as in the guard module.

### A biome autofix rewrote the approved stub, and was suppressed rather than accepted

`lint/suspicious/noPrototypeBuiltins` rewrites the stub's
`Object.prototype.hasOwnProperty.call(...)` to `Object.hasOwn(...)`, which would have broken
byte-identity with `plan.md`. A `biome-ignore format` comment does not cover a lint rule, so the
file carries a scoped `biome-ignore-all` for that one rule with the reason recorded inline. The
stub was diffed against `plan.md:413-418` after the suppression and is byte-identical.

### Gate state

`pnpm lint` exit 0 over 96 files; `pnpm typecheck` exit 0; `pnpm test` exit 0 with **442 tests in
37 files** at load 25; `pnpm build` exit 0; `git diff --check` clean.

## t9-evidence

**T9 — a trial result is validated in full, and the verdict is decided. Complete.** All twenty
criteria carry implementation and tests: AC-0032 to AC-0042, AC-0061 to AC-0068, and AC-0155.

| Criterion | Discharge |
| --- | --- |
| AC-0032 | The contract name is the one *Canonical values* states; any other name refuses with `contract-mismatch`, and the matching name is admitted |
| AC-0033 | `mintRequestIdentifier` mints inside the charset, proven distinct over fifty draws. The request builder has no parameter an identifier could arrive through, which is the structural form of "never taken from client input" |
| AC-0034 | A result whose identifier is not the request's refuses; a matching one is admitted |
| AC-0035 | The whole shape is checked before a single field is copied |
| AC-0036 | The approved plan stub is materialized byte-identical and passes. The refusal object carries exactly `ok` and `stopReason`, asserted by key, so nothing of the result reached the outcome — that is "not partially consumed", observed rather than asserted. Six malformed fields refuse individually, and the four refusal classes are proven to carry four distinct reasons |
| AC-0037 | `BoundedResultReader` counts each chunk as it arrives and refuses the moment the running total passes the bound; the retained text is empty afterwards, so no full buffer of an oversized result ever exists |
| AC-0038 | All five elements reported, with an absent version marker reported as an explicit `null` rather than a missing field |
| AC-0039 | Provenance on every non-originated value: repository-derived for both the value the inspector echoed and the value Studio extracted itself, transport-reported for the resolved revision |
| AC-0040 | Each marker travels with its value into the persisted representation rather than being recomputed from a field name at the far end |
| AC-0041 | `trial-enrichment-seam.ts` is the one named module, and a source walk over the whole service tree proves its only importer is its own test. Removing the seam means deleting the module and that test, and editing nothing else |
| AC-0042 | No northbound field carries a path-shaped value, the field set is exactly four names with no root, domain or inspector path among them, and the path predicate is proven non-vacuous against five real path shapes |
| AC-0061 | `deriveVerdict` is exercised over the whole `workspace_present` × `invalid_workspace` product plus the incomplete case, so no completed inspection falls through every row |
| AC-0062 | Moving the declared marker — Studio's own read — changes no verdict |
| AC-0063 | `malformed` comes from the `invalid_workspace` finding and from nothing else, read whether the finding is a bare string or an object with a `code` |
| AC-0064 | No marker declared yields no qualifier |
| AC-0065 | The qualifier is carried whatever the verdict, proven against both `agent-ready` and `not-agent-ready` |
| AC-0066 | The qualifier and the condition are both present and independent in the same result |
| AC-0067 | The target's declared marker and the inspector's own contract version are reported as two separate observed values |
| AC-0068 | Wildly disagreeing versions produce no judgement, because neither party declared a version set to judge against |
| AC-0155 | Diagnostics are bounded while reading, the leading and trailing halves are retained, the elision marker names the discarded byte count, and a result normalizes identically whatever the child wrote to stderr — truncated, never refused, so a repository cannot suppress its own verdict by emitting warnings |

**The two axes stay separate in the type.** `verdict`, `condition` and `versionUnverified` are
three independent fields. Flattening them is what the spec records as having made `agent-ready`
and `version-unverified` simultaneously true and left `not-agent-ready` unreachable, so the
normalized result has no field in which that could recur.

**Gate state.** `pnpm lint` exit 0 over 98 files; `pnpm typecheck` exit 0; `pnpm test` exit 0
with **483 tests in 38 files**; `pnpm build` exit 0; `git diff --check` clean. The approved
AC-0036 stub was diffed against `plan.md:468-471` after formatting and is byte-identical.

## owner-approval-2026-09-17-protocol-schema

**The Ask-first protocol-contract change is APPROVED, at the minimal scope.** *Boundaries*,
*Ask first* names "any change to `contracts/jsonschema/studio-protocol-v1.schema.json`". The
maintainer operating this session was asked before any byte was written and chose the minimal
T8 edit. The approval covers exactly:

- `contracts/jsonschema/studio-protocol-v1.schema.json` — the `method` enum, the `request`
  `oneOf`, three per-method request `$defs`, two params `$defs`, one shared result `$def`,
  three `x-studio.methodResults` entries, and `docs/specs/connect-and-orient/` appended to the
  backward `x-spec` pointer.
- `packages/protocol/src/validator.ts`, `fixtures.ts`, `contracts.test.ts` — the Zod mirror,
  the fixtures, and the parity coverage they give.

Nothing else in the schema was touched. The delivered diff is 47 insertions and 4 deletions in
the canonical schema and is confined to those four files, which is checkable from the commit.

**A first attempt was reverted before it reached a gate.** Rewriting the schema through
`json.dumps` reformatted all 478 lines — 2,545 insertions against 341 deletions — because the
file's own style keeps small objects inline. Reformatting an Ask-first contract would have put
the approved change inside an unreviewable diff, so it was reverted and re-applied as anchored
text edits that preserve the existing formatting exactly.

## t8-evidence

**T8 — the public protocol carries the connection methods. Complete.** The task carries no
acceptance criteria of its own; its Done-when is parity coverage plus the recorded approval.

Three methods were added: `source.connect`, `source.get` and `source.cancel`. All three share
one result definition, `sourceInspectionResult`, asserted in the test rather than left to
convention.

**The result keeps the two axes apart, in the contract itself.** `verdict`, `condition` and
`versionUnverified` are three independent fields, so the shape that made `agent-ready` and
`version-unverified` simultaneously true cannot be expressed. `phase` carries the five progress
rows of *User-visible states* and is `null` when the result carries a verdict or a condition
instead — no vocabulary was invented for the settled case, because every name in both enums is
a row of a table the spec already writes.

**Parity is structural, not enumerated.** The existing harness iterates `validRequestFixtures`
and `validResultFixtures`, so the three added fixtures extend Zod-mirror and canonical-schema
coverage by construction. The result fixtures deliberately exercise three different shapes: a
settled verdict-bearing result, a `no-verdict` with `malformed` and the qualifier set, and an
in-flight `cancelled` result with a non-null `phase` and a null verdict.

The approved plan stub is materialized byte-identical to `plan.md:437-440`. A malformed
`source.connect` params payload — missing `url`, carrying an unexpected `token` — is refused by
both the Zod mirror with JSON-RPC code `-32602` and the canonical schema.

**Gate state.** `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test` exit 0 with **487 tests
in 38 files**; `pnpm build` exit 0; `git diff --check` clean.

## defect-2026-09-17-condition-enum-undercount

**A defect this delivery introduced at T8, found at T10 and repaired before anything depended
on it.** The `sourceInspectionResult` contract encoded **seven** condition values and filed
`incomplete` among the progress rows. The *Condition axis* table has **eight** rows — the prose
directly above it says "the eight condition values are mutually exclusive" — and *Progress and
surface states* has four. `incomplete` (Interrupted by restart, caution, degraded, Studio,
retryable) is a condition, not a progress state.

The arithmetic is what exposed it. *User-visible states* is stated to be the union of both
tables minus `ok`, and gives eleven rows. Seven conditions minus `ok` plus five progress rows is
ten, not eleven; eight minus `ok` plus four is eleven. The undercount could not have survived
that check, and the check did not exist.

**Repaired at the generator, not the instance.** Both enums were corrected in the canonical
schema and the Zod mirror, and three assertions were added that pin them to the tables rather
than to the values a future edit happens to write: the condition enum has eight members and
contains `incomplete`, the phase enum is exactly the four progress rows, and their union minus
`ok` reconciles to eleven. The last one is the one that would have caught this originally.

This stayed inside the approved Ask-first scope: it corrects definitions that approval admitted,
and widens nothing. Recorded here because a contract defect introduced and repaired inside one
session is exactly what this ledger exists to make visible.

## t10-evidence

**T10 — every state is honest about itself. Complete.** All fifteen criteria carry
implementation and tests: AC-0086 to AC-0099 and AC-0138.

| Criterion | Discharge |
| --- | --- |
| AC-0086 | The eleven user-visible states are derived as the union of both tables minus `ok`, not retyped, and every label is proven distinct |
| AC-0087 | Each state's attention is asserted against the value its table assigns, state by state |
| AC-0088 | All thirteen terminating criteria carry the table's human reason, and the reasons are proven distinct from one another |
| AC-0089 | Every degraded state states what was looked for |
| AC-0090 | Every degraded state states what was found instead |
| AC-0091 | The approved plan stub is materialized byte-identical and passes. Attribution for `inspection-stopped` comes from the reason: all three attributions occur among its thirteen reasons, so no single per-state answer could have been projected |
| AC-0092 | Retryability likewise varies by reason — `file-count` is "no" where `resolution-timeout` is "yes" — and every degraded state carries one |
| AC-0093 | Each stop reason's attribution is asserted equal to the table's, and a Studio-attributed stop is proven not to name the repository |
| AC-0094 | The `not-agent-ready` verdict is tied to `workspace_present` false, and the state names the workspace declaration it looked for and what it found |
| AC-0095 | Every state offers exactly the two lead actions and no repository next action, asserted across all eleven |
| AC-0096 | The rate-limited condition turns on whether the signal was recognised, never on the failure itself |
| AC-0097 | A reported wait window is shown; where none was reported the surface says so, rather than omitting it |
| AC-0098 | A credential-word predicate is swept across every string every state would show, and across every stop reason's copy. The predicate is proven non-vacuous against a real credential remedy |
| AC-0099 | A protocol identifier is a separate `secondaryDiagnostic` field, so no copy path can reach it; the test asserts it is absent from every user-visible string |
| AC-0138 | The absence proof, reusing T1's `instruction-shaped-text` case. The instruction is injected into every repository-derived field a result has, and the verdict, the status and the projected state are all identical to the control's. It travels only as a provenance-marked value |

**AC-0138 landed here, as the plan said it would**, because this is the first task at which a
verdict, a routing decision and a state all exist to be unchanged.

**Gate state.** `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test` exit 0 with **516 tests
in 39 files**; `pnpm build` exit 0.

## t11-evidence

**T11 — the verdict survives restart and cancellation. Complete.** All nine criteria carry
implementation and tests: AC-0084, AC-0085, AC-0100 to AC-0104, AC-0146 and AC-0147.

| Criterion | Discharge |
| --- | --- |
| AC-0084 | The Service terminates the in-flight Runtime and records `cancelled`; the termination callback is observed to have run, so the record is not written without the kill |
| AC-0085 | A restart moves an in-flight inspection to `incomplete`, and the two are proven distinct: a restart does not relabel an existing `cancelled`, and leaves a settled inspection alone |
| AC-0100 | The canonical identity reads back across a close and reopen |
| AC-0101 | The requested ref, resolved SHA and inspection time read back |
| AC-0102 | The approved plan stub is materialized byte-identical and passes; the verdict and its diagnostics read back |
| AC-0103 | The verdict cannot be restored without its time, because both are columns of the same row — asserted on the restored record |
| AC-0104 | The bound is computed from the **provenance markers the record carries**, not from a named field list, so it covers every repository-derived value and not one class. A newly marked field is counted with no edit, asserted directly. On breach the write is rejected per owner decision 1 — nothing is written, and a prior record is proven untouched. A record at the bound is admitted |
| AC-0146 | A planted `repository-token` reaches neither storage — every persisted column, read back and searched as one string — nor a diagnostic: the refusal message reports sizes and a bound and never the bytes it refused |
| AC-0147 | All fourteen controls, AC-0133 through AC-0146, run as a set and each reproduces its effect. This is the earliest point the range is complete, as the plan said |

**Provenance drives the bound.** AC-0104's earlier reading — the one Package 3 exists to repair
in the spec — is that a bound over "one class of them" is not enough. The implementation answers
it structurally: `repositoryDerivedValues` filters on the marker, so the class is whatever is
marked rather than whatever was remembered.

### Two anchor tests were found by the suite, not by the sweep

Migration 3 broke two contract-anchor tests that pin exact content:
`storage.integration.test.ts` pins the table list, and `apps/desktop/src/main/index.test.ts`
pins the applied migration versions. Both were updated to include the deliberate addition, with
a comment at each site recording that the list is the anchor.

**This is the step-8a anchor sweep not having been run before the edit.** The suite caught both,
so nothing shipped wrong, but the sweep exists precisely so these are known before EXECUTE
rather than discovered as false gate failures. Recorded as a process miss, not a code defect. A
repeat grep for `schema_migrations` and `sqlite_master` afterwards found no third anchor.

**Gate state.** `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test` exit 0 with **552 tests
in 40 files**; `pnpm build` exit 0; `git diff --check` clean.
