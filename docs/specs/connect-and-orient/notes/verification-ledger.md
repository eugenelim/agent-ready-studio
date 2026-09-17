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
