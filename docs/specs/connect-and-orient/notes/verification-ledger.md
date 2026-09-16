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
