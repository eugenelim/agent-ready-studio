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

## amendment-2026-09-17-package-3-taxonomy

**Package 3 — the renderer and result-composition taxonomy amendment. Opened 2026-09-17.**
This is the amendment the four owner decisions of 2026-09-16 were batched for, and the one
that blocks T12 and nothing else.

**Owner authority.** `#owner-decision-2026-09-16-package-3-taxonomy` for decisions 1 to 4, and
the maintainer operating this session, who was asked before the amendment was opened and chose
to start it and to attend the two approval gates. The amendment is opened only after T6 through
T11 were complete, gated and pushed, so nothing in flight is interrupted by the schedule clear.

**What it carries.**

| id | Target | Change |
| --- | --- | --- |
| D1 | *Persisted repository-derived content* row | Fill the two missing cells. The write that would breach is rejected with an explicit diagnostic |
| D2 | T6's plan section | A named read-reach Tests bullet and Done-when clause; correct the residual's overstated symlink half |
| D3 | AC-0080 | State the marker-encoding property, in its disjunctive form |
| D4 | *Non-originated value* row | Extend the enumeration by one item: text authored by a pinned third-party executable |
| D5 | AC-0116 → the row | **Move** the derivation clause into the row both criteria cite |
| D6 | Nine sibling sites | Walk them in one action so none is left restating a narrower class |
| D7 | *Markerless-reclaim age* row | Match AC-0081's second limb, which is not only an unparseable marker |
| D8 | AC-0081 | Drop the replacement-safety attribution that limbs 2 and 3 do not support |
| D9 | AC-0081 | Restore the missing main verb in the fail-closed rationale |

**D5 is a move, not a mirror.** The clause sits on AC-0116 alone, verified against the tree at
`spec.md:544`; AC-0115 does not carry it and must not be given it. A prior repair mirrored it and
created the identical drift in reverse. Moving it into the *Non-originated value* row, which both
criteria cite, repairs the generator rather than either instance.

**The risk this amendment carries into its review.** D1, D3 and D4 are additions to prose, and an
addition to prose generated the next round's finding three rounds running, where the one round
whose repair was a deletion produced none. They are taken because each states a fact a reader
cannot otherwise derive, not because a control was missing — no new obligation is created by any
of the nine.

**Open, and deliberately not decided here.** Decision 8, the liveness-token timezone zone, at
`#open-owner-decision-2026-09-17-liveness-token-zone`. It is carried through this amendment
unresolved. It blocks nothing, and two of its three routes would make AC-0080 and AC-0081 the
subject of a fifth consecutive rewrite, which is why it is not batched with D3, D8 and D9.

**Standing deferrals remain eight**, not nine. Round 25 corrected that arithmetic; round 21's
byte-bound residual Nit closed when the *Follow-ons* entry landed and no longer stands.

## package-3-scope-change-2026-09-17-d2-plan-half

**D2's plan-section half is dropped; its spec half is applied.** The decision recorded at
`#owner-decision-2026-09-16-package-3-taxonomy` gave T6 "a named Tests bullet and a Done-when
clause" confirming the inspector's read reach. That half cannot and should not be applied now,
for two independent reasons, and both were checked against the tree rather than assumed.

**It is mechanically refused.** Opening this amendment pinned T1 through T11 as completed tasks,
so T6's plan section now carries a section hash. `approve-plan` guards those hashes, and
`#amendment-closed-2026-09-17` records it refusing with "completed task section changed: T4" for
exactly this. The consolidation for this amendment assumed T6's section would still be editable;
that was true before the amendment transition and false after it.

**It is also moot.** The decision's own ground was that "nothing fails if it is skipped" — T6
scheduled no confirmation, so the residual naming T6 had no enforcement. T6 has since been
implemented: `locateTrustedInspector` reads the pack name, the version and both file digests and
refuses on any mismatch, with the read reach answered and recorded at
`#t6-inspector-read-reach-confirmed-2026-09-17` and discharged in `#t6-evidence`. Adding a Tests
bullet scheduling work that is done, to a section that is pinned, would fail the gate in order to
schedule nothing.

**What was applied instead.** The spec half, which is the part that was still wrong: the
*Follow-ons* residual asserted that AC-0069's protection depends on whether the inspector's
traversal follows symlinks. It does not — `core.symlinks=false` materializes an escaping link as
a regular file holding its target string, so no symlink exists under the materialization root for
any traversal to follow. The false dependency is deleted and the residual now records itself as
answered, citing both its acceptance and its confirmation.

This is a deletion of a false claim rather than an addition, which is the route this ledger
records as the one that has never generated a following round's finding.

## package-3-walk-2026-09-17-provenance-enumeration

**D4's walk reached the implementation, and found a disagreement it had just created.**

Extending the *Non-originated value* class to cover "text authored by a pinned third-party
executable" made the contract disagree with code already committed at T9. `trial-result.ts`
marked `inspectorContractVersion` — the version the trusted inspector reports for its **own**
output contract — as `studio-produced`. Those bytes are the inspector's, not Studio's, so under
the amended class that marker was wrong the moment D4 landed.

This was found by walking the amendment's surfaces rather than by a gate: every gate was green
with the wrong marker in place, because no test asserted what that field's provenance should be.

**Repaired at both ends.** The `Provenance` union gains `inspector-authored`, the field carries
it, and a new assertion states the property the walk established: inspector-authored text is
non-originated — so AC-0115 and AC-0116 reach it — while **not** being repository-derived, so it
stays outside AC-0104's persisted bound. `repositoryDerivedValues` filters on
`repository-derived` and therefore needed no change, which is the payoff of having written that
bound over the marker rather than over a field list.

**Why this is recorded rather than folded into the amendment entry.** It is the first instance in
this run of a contract amendment invalidating already-shipped code. The lesson generalizes: a
class extension in *Canonical values* reaches every enumeration that implements that class, and
those live in code as often as in prose. The walk instruments the ledger names — literal sweep,
then semantic walk — have to cross the prose/code boundary, not stop at it.

## review-round-26-2026-09-17

**Round 26, the pre-EXECUTE review of the Package 3 amendment. Eight findings raised, four
sustained, four refuted, none indeterminate.** Artifacts at
`.context/reviews/f87c797b-8bed-46c2-96fd-e8d22fb8eb3d/26-pre-execute-adversarial-reviewer-{raw,adjudication}.md`,
raw `sha256:16458feb…`, adjudication `sha256:4d2af768…`.

**The severity distribution is the headline.** The raw report carried 1 Blocker, 4 Concerns and
3 Nits. Adjudication sustained **four Nits and nothing above Nit** — the Blocker and all four
Concerns were either refuted outright or graded down. That is the fifth time on this run that
adjudication has moved a Blocker off the top of a report, and it is why findings are routed
through it rather than acted on as written.

| # | Sustained finding | Surface |
| --- | --- | --- |
| 1 | AC-0080 enumerates two crash outcomes while its own encoding property admits three | `spec.md:498` |
| 2 | The extended non-originated item is named more narrowly than its own gloss | `spec.md:65` |
| 3 | The class head admits user-submitted input that no enumerated item assigns | `spec.md:65` |
| 4 | The missing-start-time crash form is unreachable under the encoding AC-0080 names | `spec.md:498` |

**Three of the four are defects in text this amendment itself added** — findings 1 and 4 in D3's
encoding property, finding 2 in D4's enumeration item. That is the pattern this ledger has
recorded three rounds running: an addition to prose manufactures the next round's finding, where
a deletion produces none. D1, D3 and D4 were flagged as the highest-risk edits in this batch
before the round ran, at `#amendment-2026-09-17-package-3-taxonomy`, and two of the three earned it.

**All four are deferred rather than repaired, and the ground is the adjudication's own.** Each
sustained entry records that its resolution is a choice among defensible rewordings with
*nothing external deciding among them* — finding 1 names three admissible resolutions, finding 2
three, finding 3 two, finding 4 two. A choice no evidence settles is an owner question, and this
ledger's standing rule is to hand those back rather than pick one inside a review loop. Findings
1 and 4 additionally land on AC-0080 and AC-0081, the text rewritten in four consecutive rounds
where each repair generated the next round's finding; decision 6 was taken specifically because
it was the only route leaving both untouched.

Repairing any of the four would reopen the frontier and require round 27, against advisory
wording items that the work-loop's own exit condition does not require closing: no unresolved
Blocker or Concern remains, and deferred Nits carrying citations may proceed.

**Four refutations worth keeping.** Finding 4's claim that T12's widened plan bullet violated the
no-mirroring rule was refuted on authority — that rule binds copying the clause onto AC-0115, not
a plan bullet stating what a test asserts. Finding 5's claim that the filled AC-0104 row obliges
nothing was refuted against `spec.md:18`, which states that a criterion naming a *Canonical
values* row carries the obligation. Finding 7 anchored the *Markerless-reclaim age* row one line
late, at the *Live in-flight sweep-domain occupancy* row.

**Standing deferrals now number twelve**: the eight carried into this amendment, plus these four.
Decision 8 remains open and separate from all of them.

## probe-2026-09-17-class-membership-is-strictly-widened

**Independently verified before adjudicating any finding that claims the amendment weakened a
control.** The *Non-originated value* row's enumeration was extracted from both sides of the
diff and compared item by item:

| | Items |
| --- | --- |
| Pre-amendment | a repository-derived value as AC-0039 defines it; the remote-resolved revision; any value a transport reported |
| Post-amendment | the same three, unchanged, plus text authored by a pinned third-party executable, glossed as the trusted inspector's own prose and a child process's own diagnostic text |

**Removed from the class: none.** Every prior member survives verbatim. The amendment is a
strict widening, so no value that was inside the class before it is outside the class now, and
neither AC-0115's literal-rendering obligation nor AC-0116's sink prohibition can have lost
reach by exclusion.

AC-0116's own text did lose the derivation clause, but the clause moved into the row that
AC-0116 cites and is now phrased over *both* obligations, so AC-0116 keeps that reach by
reference and AC-0115 gains it. What changed is which surface states the reach, not whether it
is stated.

Recorded because a review of this amendment is expected to ask whether protection narrowed, and
the answer should rest on the diff rather than on the reviewer's or the author's account of it.

## review-round-26-security-2026-09-17

**The secure-design half of round 26 is adjudicated CLEAN. Five findings raised, five refuted,
none sustained, none indeterminate.** Artifacts at
`.context/reviews/f87c797b-8bed-46c2-96fd-e8d22fb8eb3d/26-pre-execute-security-reviewer-{raw,adjudication}.md`,
raw `sha256:deb7e2ab…`, adjudication `sha256:eea23c3e…`. The raw report carried 0 Blockers,
3 Concerns and 2 Nits; none survived.

**The question the review was dispatched to answer is answered: the amendment weakens neither
control.** The two refutations that carry that answer:

- **The derivation clause was moved, not deleted.** Finding 1 read the *Never do* bullet losing
  "including one Studio constructs from such a value" as a lost sink. The bullet never carried
  the clause as contract — AC-0116 did, and the clause moved into the row AC-0116 cites, so the
  Studio-derived commit link is still reached, now by both obligations rather than one.
- **The new class item takes nothing out of the repository-derived scope.** Finding 2 read
  `inspector-authored` as moving a child's mixed diagnostic text out of AC-0039 and AC-0104's
  reach. AC-0039 defines repository-derived by **content origin** and was untouched; the
  non-originated class is a superset, so membership in it asserts nothing about non-membership
  in the narrower scope. The implementation agrees: `inspectorDiagnostics` — the echoed channel
  the finding named — is still `repository-derived`; only the inspector's own output-contract
  string takes the new marker. No single-class escape from AC-0104 is created.

Both conclusions match the independent probe at `#probe-2026-09-17-class-membership-is-strictly-widened`,
which compared the enumeration across the diff and found every prior member surviving. The probe
was run before adjudication returned, precisely so the answer would rest on the diff rather than
on any agent's account of it.

Two refutations record a residue worth naming without acting on it. Finding 3 leaves a
contract-completeness argument about AC-0039's scope for the transport-reported item that
**predates this amendment** and whose remedy widens an obligation — an owner question, not a
determined repair. Finding 5 named the absent `docs/architecture/security.md`; the *Follow-ons*
section already records that absence and the absent dependency scanner as accepted maintainer
items, so the condition is accepted rather than unnoticed and is not this amendment's defect.

**Round 26 therefore satisfies the review exit condition on both mandatory reviewers**: the
adversarial half carries four deferred Nits with citations and no unresolved Blocker or Concern,
and the security half is adjudicated clean. Pre-EXECUTE rounds call no `review record` and
consume no retry budget; all three counters remain 0 after twenty-six rounds.

## amendment-addendum-2026-09-17-discovery-channel-and-inline-proof

**Added to the open Package 3 amendment, before its spec gate closed.** Two mechanisms, both
landing through the **controlled amendment path** rather than through the channel they create —
one changes a dependency edge and the other adds verification obligations, and the channel
forbids itself both. Stating that is the point: a channel that could have authorized its own
creation would have no bound.

**1. A bounded discovery channel, and T14 to run it.** Exact helpers, paths, fixture shapes and
local construction details of an unstarted task may stand unresolved; T14 resolves them. The
channel carries all six required elements — a predeclared discovery predicate with four
conjuncts; a kill condition with bounded alternatives capped at three admissible options per
question; a closed list of refinable tasks, T12 and T13 and no others; an append-only decision
record at `#discovery-channel-t14`; a scoped review of the changed task and its dependants; and
an explicit prohibition on touching completed sections, their evidence or `amendment_history`.

**A task section locks when execution begins**, from the first commit that implements it.
Completed sections are immutable outright.

**2. Inline proof for risky mechanisms.** A mechanism whose failure mode is to report success
wrongly — parser, extractor, gate, negative control, classifier, generated registry — must, in
the task that introduces it, run a discriminating positive and a consequential negative, show a
named case reddening when the arm is neutralised, exercise the real entry path rather than the
helper alone, and state the condition that retires the approach. It binds T14, T12 and T13, the
tasks unstarted when it was written. It is **not** applied retroactively to T1 through T11,
whose sections are pinned and whose evidence is closed.

**Verified, not assumed.**

| Check | Result |
| --- | --- |
| Wave derivation, from the pure scheduler over the edited plan | `[[T14], [T12], [T13]]` — T14 precedes T12 by dependency, not by document position |
| Criteria roster | 156 declared, 156 claimed, **0 residuals**; T14 claims none, on T8's precedent |
| Pinned section hashes, recomputed against the edited plan | all **11 of 11** still match; none drifted |
| `lint-contract-item-alignment` | 0 findings |
| `spec-coupling-check` | 0 findings |
| `lint-spec-status` | clean |

**A parser hazard was avoided by grounding it first.** The cohort scheduler accepts a lettered
task id (`T\d+[a-z]?`), so `T11a` would have scheduled correctly. The contract lint's task regex
is `^### (T\d+)\b` with no letter suffix, so a `### T11a` heading would **not** terminate T11's
body — T11 is completed and pinned, and every criterion named in the discovery section would have
been credited to it, which is the mention-anywhere failure the lint's rule 5 exists to eliminate.
`T14` parses correctly under both. The two parsers disagreeing on what a task id is would have
been invisible until a criterion was mis-credited to a pinned task.

## discovery-channel-t14

**Append-only decision record for the bounded discovery channel.** One entry per question: the
question, the enumerated options, the option taken, the evidence that decided it, and the task
refined — or the kill and the amendment it returns to. An entry is never edited once written; a
reversal is a new entry naming the one it supersedes.

### Entry 1 — the ΔE2000 comparison set — **KILLED**

**Question.** The bound is stated against a hue set that is materialized for one comparison
family and absent for two.

**Enumerated options.** (a) Derive representative hues for review and execution from the tokens
already present and record the mapping. (b) Kill, if no defensible mapping exists or no
inspection hue clears the bound in both themes. Minting product colour families was excluded by
name before discovery began.

**Taken: the kill, on two independent grounds.** Either alone is sufficient; both hold.

**Ground one — option (a) has no source to derive from.** `readThemeHues` over the shipped
`apps/desktop/src/renderer/styles/tokens.css` returns **14 hue names in the root block and the
same 14 in the `prefers-color-scheme: dark` block**, every dark value differing from its light
counterpart. Enumerated, those 14 are `--color-canvas`, `--color-surface`,
`--color-surface-raised`, `--color-text`, `--color-muted`, `--color-border`, `--color-accent`,
`--color-accent-strong`, `--color-on-accent`, `--color-focus`, `--color-proposal-surface`,
`--color-proposal-border`, `--color-accepted-surface` and `--color-accepted-border`. **Exactly
four are product-state hues**, all four artifact-state — the *proposed* and *accepted* members —
and the remaining ten are chrome, text and focus roles that name no state family. **No review-
state and no execution-state hue is present in either block.** So "derive from the tokens
already present" has nothing to derive from: deriving a review hue from `--color-border` is
minting one and calling it a derivation, and minting is excluded.

**Ground two — the family set the comparison runs against is not settled.** The
*Inspection-family hue separation* row names four families including attention;
`docs/product/design-system.md` *Product state vocabulary* enumerates the same four — artifact,
review, execution, attention — and records **no hue value for any of them**; AC-0120 names three
and excludes attention explicitly. A criterion and the row it cites disagree about what is
compared, and resolving that moves an acceptance criterion. Owner-accepted as a kill at
`#owner-decision-2026-09-17-package-3-gates-and-family-kill`; **accepting the kill route is not
choosing three or four**, and this entry decides neither.

**Measured anyway, because the measurement is cheap and the numbers are what a later amendment
will argue over.** The one materialized family pair, both themes:

| Pair | Light | Dark |
| --- | --- | --- |
| `--color-proposal-border` ↔ `--color-accepted-border` | 40.389 | 37.967 |
| `--color-proposal-surface` ↔ `--color-accepted-surface` | 21.866 | 28.485 |

These are *within* the artifact family, so they are not an AC-0120 comparison and clear nothing.
They are recorded because they establish that the generator reports plausible magnitudes on the
real tokens, and because a family whose two materialized members sit 21.866 apart in light
constrains any later inspection hue more tightly than the bound alone suggests.

**Returns to the owner** through the controlled amendment path. **No hue mapping was derived and
no obligation was removed.** T12 and T13 are not refined by this question; T12 records the wait.

### Entry 2 — where the ΔE2000 generator lives — **RESOLVED, option (a)**

**Question.** Nothing in the repository computes ΔE2000. The bound's value has exactly one home
and must keep it, so the generator cites that home rather than restating the number.

**Enumerated options.** (a) A small local module under the desktop tools directory exercised by a
test. (b) A test-only helper, if no second caller appears.

**Taken: (a)** — `apps/desktop/tools/delta-e2000.ts`, with its proof at
`apps/desktop/tools/delta-e2000.test.ts`.

**Evidence that decided it.**

- **A second caller appears, so (b)'s precondition fails.** T14's own proof is the first caller;
 T12's AC-0120 assertion is the second, and the plan's coverage list assigns AC-0120 to T12.
 Two distinct test files, one in each task.
- **`pnpm verify` reaches that directory and the repository-root `tools/` directory it does
 not.** `tsconfig.json` includes `apps/**/*.ts`; `vitest.config.ts` includes
 `apps/**/*.test.{ts,tsx}`; `biome.json` includes `apps/**`. Root `tools/*.mjs` is in none of
 the three. A generator placed at the root would be neither typechecked nor run, which is the
 opposite of "exercised by a test".
- **The directory is already the desktop tools home** — `visual-evidence.mjs` sits in it — so the
 placement introduces no new directory and no new module boundary.

**The bound keeps its one home.** A mechanical check and a read were both needed, and stating
only the first would overclaim. `grep -nE '(^|[^0-9.])20([^0-9.]|$)'` over the module returns
**one line** — the CIEDE2000 lightness-weighting constant inside
`Math.sqrt(20 + (meanL - 50) ** 2)`, part of the metric's own definition and not a threshold —
and **zero lines** over the test.

**What that pattern does not establish, said plainly:** it cannot see the value written as `20.0`
or `2e1`, and it cannot see it in prose. It did in fact miss one — round 1's review found a test
comment relating a measurement to *half* the separation value, which is a derived second home the
grep was blind to. That comment is repaired, and the claim is now the stronger one: **neither file
states the separation value, in figures or in prose, and neither compares a ΔE2000 result to it.**
The **test** file pins three measured magnitudes — 40.389, 37.967 and 10.29 — which are
observations of the tokens, not the bound; the module pins none, carrying no numeric constant but
the metric's own.

The module's doc comment names the *Canonical values* row as the value's home and names AC-0120's
assertion as what reads it.

**Task refined:** T12 — the *Discovery refinements* block names the module and its exports.

### Entry 3 — the capture path for the two specialist reviewers — **RESOLVED, option (a)**

**Question.** `experience-reviewer` cannot self-capture and must be handed rendered output;
`visual-evidence.mjs` reads the built renderer and needs a Chromium.

**Enumerated options.** (a) Reuse `visual-evidence.mjs` as the capture source. (b) Add a narrower
capture entry, if its scenario set does not reach the new surfaces.

**Taken: (a)** — reuse.

**Evidence that decided it.**

- **The scenario set reaches the new surfaces, so (b)'s precondition fails.** The tool runs six
 scenarios over a surface list, and surfaces are driven by a literal `{ name, clicks }` array
 that clicks button labels by text. A new surface is **one array entry**, not a new capture
 entry. `desktop-light` and `desktop-dark` are already two of the six scenarios, which is the
 both-themes reach AC-0120 needs from a capture.
- **Reviewer capabilities were read from their definitions rather than assumed**, and the
 definitions are **host-local, not repository evidence**: the `tools:` frontmatter of
 `~/.claude/agents/frontend-reviewer.md` and `~/.claude/agents/experience-reviewer.md`. A later
 reader on another machine cannot re-derive this from the tree, which is why the paths are named
 here and marked host-local. `frontend-reviewer` advertises `Read, Grep, Glob, Bash` and drives
 named routes itself. `experience-reviewer` advertises `Read, Grep, Glob` and **no `Bash`** — the
 plan's unprobed note is confirmed, not guessed — so it receives the PNGs the tool writes, with
 the grounded aesthetic reference its confirm-before-reviewing gate requires.
- **The capture path resolves a browser from a declared candidate list**, `findChromium` at
 `apps/desktop/tools/visual-evidence.mjs:288-308`, whose final fallback is the system Chrome
 install. **Which candidate wins is host-local and is deliberately not recorded here as contract
 evidence.** An earlier draft of this entry named four Playwright builds and a newest-first
 preference; round 2 showed that claim could not be settled from the repository at all, because
 the deciding fact lives outside the tree and outside any reviewer's read envelope. The claim was
 **dropped rather than resolved** — entry 3 needs only that a browser resolves, which the
 candidate list establishes from in-repo code. A durable record should not rest on a fact only one
 machine can check.

**One wrinkle recorded rather than left implicit.** The tool's `outputRoot` is hard-coded to
`docs/specs/product-development-walking-skeleton/notes/visual` — the *other* spec's notes
directory. **Its dependants were located rather than assumed, and this sentence has now been
wrong in both directions, so it states the distinction exactly.**

That spec's Testing Strategy **names no path**. It does bind three of its rows to the evidence set
that lives at this one: AC-50 at `spec.md:115` ("the rendered list is measured in the retained
visual evidence"), AC-51 at `:116` ("measured directly in the retained visual evidence, as their
own captures"), and the Visual/manual QA row at `:117` ("retain screenshots"). **The criteria
depend on the set; the directory is named separately, in prose rather than in contract** —
including `notes/headful-session-checklist.md` lines 6 and 42, that spec's
`notes/verification-ledger.md` at 781, 955, 1534 and 1680, and a comment in the tool itself at
`visual-evidence.mjs:891`.

**That list is deliberately not offered as exhaustive, and no total is claimed.** Three successive
rounds falsified three successive enumerations of it, which is the point at which a longer list
stops being the repair: what decides this question is the *kind* of dependant, not a count, and
every kind is represented above.

**That spec is `Shipped`** (`spec.md:3`), which raises the cost of disturbing either from a fix-up
to an amendment against closed work.

**Reuse carries the two additive changes the plan names, and the second one does touch the
retained set.** An earlier draft of this entry counted only the first and concluded nothing was
disturbed. That was wrong.

1. **The spec-selectable output root**, defaulting to today's path. This disturbs nothing by
 itself — the three bound rows and every reference to the directory keep their meaning.
2. **The surface entries** for the connect and verdict surfaces. The surface list is iterated
 inside each scenario (`visual-evidence.mjs:650-656`), each capture is named
 `<scenario>-<surface>` (`:799`), and one PNG per pair is written along with a wholly regenerated
 `manifest.json` (`:933-945`). Six scenarios are declared (`:383-445`), and the retained set is
 today **36 PNGs plus `manifest.json`** — counted, not inferred.

 **Publishing replaces that directory rather than adding to it**, which an earlier draft of this
 entry did not say and which is the larger fact for anyone choosing the root. The staging
 directory is filled with **only this run's** captures (`:932-945`) and then renamed over the
 retained one (`:958-959`). So a run under the default root leaves **48 freshly rendered PNGs in
 place of the 36**, every one re-rendered and the manifest re-stamped — the growth is twelve, but
 the disturbance is the whole set.

**Under the default root that writes inside a `Shipped` spec's notes directory**, which is exactly
the cost this entry raises just above. **Which root T12 writes each spec's captures to is left to
T12**: it is a task-level construction choice, and settling it here would decide it. What this
entry records is that the choice exists and that the surface-entry addition is not neutral — so no
later reader takes "reuse" to mean "nothing moves".

The decision still survives its own correction: reuse remains the right option, it is a path, it
belongs to T12, and it moves no criterion.

**Two further dependants are derived rather than written, and they are the ones selectability
actually reaches.** The tool builds `${outputRoot}.next` and `${outputRoot}.previous` as staging
directories (`visual-evidence.mjs:912-913`), and `.gitignore:47-48` ignore exactly those two
paths **spelled against the hard-coded root**. A non-default root therefore stages into paths no
ignore rule covers. These are a **further kind of dependant** — derived rather than written — and,
consistent with the paragraph above, no total is claimed for the set.

**What that obliges of T12**, stated here because it is the obligation the enumeration first
missed: any non-default root must bring its own ignore entries for `${root}.next` and
`${root}.previous`. The exposure is narrower than it first looks, and narrower than an earlier draft
of this paragraph said. On a successful run the tool renames `publishDir` away (`:959`) and clears
`retiredDir` (`:976`), leaving neither. **Two failure paths are residue-free**, and an earlier draft of this paragraph
wrongly generalised that to all of them: the pre-publish abort exits before either directory is
derived (`:888-895` against `:912-913`), and the publish catch restores `outputRoot` and removes
`publishDir` (`:960-975`).

**A third path is not.** The block that creates and fills `${root}.next` — `mkdirSync` at `:932`
and the `writeFileSync` calls at `:933-945` — sits **outside every `try`**: the run's own
`try/finally` closes at `:834` — `:818` is that statement's `} finally {` clause opener, not its
end — and the publish `try` does not open until `:957`. A write error
there throws uncaught and strands a partly populated staging directory. So does a throw from the
restore rename at `:965`, which escapes before `rmSync(publishDir)` at `:968`. **Residue therefore follows three triggers**: a hard interruption, a
failure of the unguarded staging write, and a failure of that restore rename. The list is stated
as three named paths rather than as "any throw before `rmSync`", because a throw from
`renameSync(outputRoot, retiredDir)` at `:958` **is** cleared by the publish catch — generalising
would reassert a universal the code does not support, which is the error this paragraph was
repaired for once already. Any of the three lands a dirty tree in front of T13's clean-tree gate,
which is why the T12 obligation is stated against all three.

**Tasks refined:** T12 (the surface entries, the default-preserving root, and the ignore entries
any non-default root requires) and T13 (what each reviewer is handed).

## gate-state-2026-09-17-discovery-channel-addendum

`pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm build` exit 0; `git diff --check` clean;
`lint-contract-item-alignment` 0 findings; `spec-coupling-check` 0 findings; `lint-spec-status`
clean.

**`pnpm test` exited 1, and the red is the host.** Twelve failures across four files, all inside
the trial runtime, observed at **load average 172** — near the top of the 8-to-188 band this
ledger records. The failure kinds are the documented signature exactly: six `Test timed out in
5000ms`, five `inspection refused: already-in-flight` — the global single-in-flight guard
cascading from a timeout rather than five independent defects — and one assertion.

Judged by the two-in-isolation rule rather than by re-running once:

| File | Failures in the full run | In isolation |
| --- | --- | --- |
| `disposal.test.ts` | 7 | 7/7 pass |
| `materialization.test.ts` | 3 | 4/4 pass |
| `per-request-state-root.test.ts` | 1 | 17/17 pass |
| `runtime-supervisor.test.ts` | 1 | failed once, then **23/23 pass** on the second run |

Only `runtime-supervisor.test.ts` failed in isolation at all, and it did not fail twice, which is
the condition this ledger sets before a red suite is treated as a regression. Nothing in this
addendum touches code: the diff is `plan.md` and this ledger.

`per-request-state-root.test.ts` passing 17/17 matters beyond the count — it carries the
exhaustive per-prefix marker test that D3's encoding property rests on, so the property the
amendment states is still proven after the addendum.

## review-round-27-2026-09-17

**Round 27, the scoped review the discovery channel requires of itself. Fourteen findings raised,
eight sustained, six refuted, none indeterminate.** Artifacts at
`.context/reviews/f87c797b-8bed-46c2-96fd-e8d22fb8eb3d/27-pre-execute-adversarial-reviewer-{raw,adjudication}.md`,
raw `sha256:36ffa30f…`. Scope was the changed task and its dependants — T14, T12, T13 — and the
spec was not reopened.

**One Blocker sustained, and it was a real escape.** T14's question 1 offered "introduce the four
families as tokens" as an admissible option. That mints product colour surface and extends the
design-system durable output, which the durable-output map assigns to T12 — so the channel would
have landed, at execution, precisely the kind of change its own predicate forbids and its kill
condition exists to route away. T14 is wave 1 in the derived order, so the option was reachable.
The option is removed; minting a family is now named explicitly as a kill.

**A live contract disagreement was found, and is recorded rather than resolved.** The
*Inspection-family hue separation* row names **four** comparison families including attention.
AC-0120 names **three** and excludes attention explicitly, on the stated ground that a state
renders its attention level through weight, border and placement rather than an attention hue. A
criterion and the row it cites disagree about what is compared. Verified directly at `spec.md:67`
and `spec.md:552`. Resolving it moves an acceptance criterion, so it is a **kill**: it returns to
the owner through the amendment path, and T14 derives no mapping against an unsettled family set.

**A grounding claim of mine was falsified, and the correction matters.** I reported that none of
the five families exists as a token. Two artifact-state members already carry hues in both
themes — `--color-proposal-surface`, `--color-proposal-border`, `--color-accepted-surface` and
`--color-accepted-border`, corresponding to the *proposed* and *accepted* artifact states the
design system enumerates at `docs/product/design-system.md:50`.

The error was in the oracle, not the transcription: I grepped for `--color-<family-name>` and
reported the absence of family-**named** tokens as the absence of family **hues**. The comparison
the check performed was narrower than the claim I drew from it — which is exactly the failure the
"state what the oracle actually compares" discipline exists to catch, arriving this time in my own
work. The review and execution families do genuinely carry no hue; the artifact family does.

**Sustained and applied**: the Blocker above; the family-count kill; binding the ΔE2000 arm's
real-entry-path leg to **both** theme blocks of `tokens.css`, since AC-0120 binds in both themes
and the dark values live in the `prefers-color-scheme` block, so an arm reading only the root
block would satisfy every other proof element while observing half the hue set; correcting the
token claim; restating the Risks bullet that still asserted T8 blocks and only T12 depends on it,
which the rewire falsified; and adding a Changelog entry citing this addendum's authority, without
which nothing in the plan alone distinguishes a channel created by amendment from one that
authorized itself.

**One Nit deferred with its citation.** The plan contract note says both documents are pinned
after approval, while the channel makes T12 and T13 refinable until their first implementing
commit. The two can be reconciled by carving the refinable sections out of the note or by
confining refinements to the ledger record; the adjudication records it as advisory because
resolving it is a choice between defensible framings. Standing deferrals now number thirteen.

**Six refutations worth keeping.** The claim that the inline-proof rule can be satisfied vacuously
was refuted against its own conjunctive structure — element 1 already demands a consequential
negative and element 2 carries a separate mutation burden. The claim that T14 is gated behind an
unreached human approval was refuted against the recorded protocol approval and T8's evidence.

**Structure re-verified after the repairs**: waves still derive `[[T14], [T12], [T13]]`; the
roster is still 156 declared, 156 claimed, no residual; all **11 of 11** pinned section hashes
still match; all three contract lints clean.

## owner-decision-2026-09-17-package-3-gates-and-family-kill

**Two owner decisions, taken 2026-09-17 by the maintainer operating this session.**

**1. The family-count kill is accepted.** The *Inspection-family hue separation* row names four
comparison families including attention; AC-0120 names three and excludes attention explicitly.
The owner accepts that this returns to them as a **kill** rather than being resolved inside the
discovery channel. T14 records the disagreement and derives no hue mapping against an unsettled
family set. **The disagreement itself remains open** — accepting the kill route is not choosing
three or four, and nothing in this entry decides it. It is carried exactly as decision 8 is.

**2. Both approval gates are given.** The spec gate and the plan gate for the Package 3
amendment, including the discovery-channel addendum and round 27's applied repairs.

What the approval covers, so its scope is checkable later:

| | |
| --- | --- |
| Spec body | The nine decided Package 3 items, criteria count unchanged at 156, no obligation added |
| Plan body | The bounded discovery channel, the inline-proof rule, `### T14`, T12's rewired dependency, the corrected Risks bullet and the addendum Changelog entry |
| Review evidence | Round 26 — adversarial four deferred Nits with citations, security adjudicated clean. Round 27 — eight sustained, six refuted, one Blocker and five Concerns applied, one Nit deferred |
| Carried unresolved | Decision 8 (liveness-token timezone); the three-versus-four family disagreement; thirteen standing deferred Nits |

**Not covered by this approval**, and named so no later reader treats it as settled: the
three-versus-four family question, which needs its own amendment when the owner decides it.

**Settled later, and this paragraph is left as the record of what was true on 2026-09-17 rather
than rewritten.** The owner decided four families on 2026-09-17 and Package 4 amended AC-0120;
see `#owner-decision-2026-09-17-package-4-family-set-and-zone`. Everything above describes the
state before that amendment.

## t14-evidence

**T14 carries no acceptance criterion**, on T8's precedent: it discharges construction detail.
Its obligations are its three decision entries at `#discovery-channel-t14`, the ΔE2000 arm's four
inline proofs, a green `pnpm verify`, and the pinned section hashes still verifying.

### The ΔE2000 arm's inline proof

**1. Discriminating positive and consequential negative.** The positive is
`--color-proposal-border` against `--color-accepted-border` — two real artifact-state identity
hues — measured in each theme's own values: **40.389** light, **37.967** dark. The negative is the
dark theme's `--color-surface` against `--color-accepted-surface`, which measures **10.290**. That
negative is the one that would matter if admitted: the design means those two to be
distinguishable, and an arm that reported them as widely separated would report anything as widely
separated. It is not a malformed input; both values ship.

**2. Reference data, because a colour-difference function's failure mode is a plausible number.**
**17 rows chosen from** Sharma, Wu and Dalal's published CIEDE2000 test data reproduce **within
the 5e-5 window the assertion enforces** (`toBeCloseTo(expected, 4)`) — all 17 the file carries, which is a subset of the published set and not the whole of it.
The rows were picked to reach the formulation's discontinuities rather than to sample it evenly,
and the repair below is itself proof that the published data contains rows this file does not. Reading the arithmetic would not have distinguished a correct implementation from a subtly
wrong one; this does.

**Which branch each row takes was instrumented, not assumed, and the first instrumentation found a
hole.** Round 1's review measured the mean-hue branches **per row**, over the sixteen rows the
file then carried: the near branch twelve times, the zero-chroma-product branch once, the `+360`
wraparound three times, and the `(hue1 + hue2 - 360) / 2` wraparound **never**. The tally is per
row rather than per argument order because the branch predicates are symmetric in `hue1` and
`hue2`, so both orders of a row take the same branch and counting them separately would only
double every figure. The row believed to straddle that
boundary — `(50, 2.49, -0.001)` against `(50, -2.49, 0.0009)` — computes to a hue separation of
179.9985 and sits on the near side of it. The published **adjacent** row, differing in b* by
0.0002, is the one that crosses: `(50, 2.49, -0.001)` against `(50, -2.49, 0.0011)`, expected
7.2195, measured **7.219472**. It now sits immediately after the row it was
confused with, as the **seventh element** of `REFERENCE_DATA` — 17 is the array's new total, not
its position — and the docblock's coverage claim is stated against instrumented branches rather
than against an assumption.

**The conversion feeding the metric is pinned externally too**, which the 17 Lab-to-Lab rows do
not do. `#ffffff` → L\*=100, `#000000` → L\*=0, and the three sRGB primaries match their
published D65 values **within the 5e-4 window the assertion enforces** (`toBeCloseTo(…, 3)`, not
the tighter figure an earlier draft of this line claimed): `#ff0000` → (53.2408, 80.0925,
67.2032), `#00ff00` → (87.7347, −86.1827, 83.1793), `#0000ff` → (32.2970, 79.1875, −107.8602). Before this case existed,
every assertion reaching `hexToLab` compared against a magnitude this implementation had itself
produced, so a systematically wrong matrix or white point would have produced different pins and
passed anyway.

**3. Neutralising the arm reddens named cases.** Seven neutralisations were run against the real
test file and the module was restored byte-for-byte after each. **This is the leg that says the
tests are load-bearing rather than decorative.**

| Neutralisation | Reddens | Count |
| --- | --- | --- |
| `deltaE2000` returns a constant 100 | *reproduces Sharma…*, *separates the proposal and accepted border hues in both themes*, *reports the dark accepted surface as close to the base surface it sits on*, *treats the three-digit and six-digit hex forms as the same colour* | 4 failed / 10 passed |
| `deltaE2000` returns a constant 0 | the first three of those | 3 failed / 11 passed |
| `readThemeHues` returns the root block as **both** themes | exactly *reads the hues of both theme blocks of the shipped tokens.css*, on its first entry: `expected '#f4e8ff' not to be '#f4e8ff'` | 1 failed / 13 passed |
| `WHITE_X` swapped from D65 to D50, `0.95047` → `0.96422` | *converts the sRGB primaries to their published D65 L\*a\*b\* values*, plus both token-measurement cases | 3 failed / 11 passed |
| The unparseable-colour refusal turned back into a silent drop | *refuses a colour token whose value it cannot parse* and *reaches a final declaration written without its optional semicolon* | 2 failed / 12 passed |
| The declaration pattern's terminating `;` made mandatory again — the round-5 defect, re-injected | exactly *reaches a final declaration written without its optional semicolon* | 1 failed / 13 passed |
| Comment stripping removed — the other round-5 defect, re-injected | exactly *ignores CSS comments rather than reading declarations out of them* | 1 failed / 13 passed |

The third is the mutation the both-blocks obligation exists to catch, and the one a
root-block-only arm would have survived. The fourth is what makes the external conversion pin
load-bearing rather than decorative: the illuminant is the exact systematic error the finding that
prompted it named, and the published-primaries case is what catches it.

**These counts are against the test file as it now stands** — 14 cases — and all seven were
re-measured after round 5's repairs rather than carried over from an earlier run. **The last two
exist because a repair needs the same proof a mechanism does**: each re-injects one of the two
defects round 5 found in the round-4 refusal, and each reddens exactly the case added to catch
it. The module was confirmed
byte-identical to its pre-mutation state after each neutralisation.

**4. The real entry path, across both theme blocks.** *reads the hues of both theme blocks of the
shipped tokens.css* reads `apps/desktop/src/renderer/styles/tokens.css` off disk — the file the
renderer loads, resolved from `import.meta.url`, not a fixture and not a copy. It observes **14
hue names in the root block and the same 14 in the `prefers-color-scheme: dark` block**, asserts
that every dark value differs from its light counterpart, and asserts that the four artifact-state
identity hues are present and different in both. It also asserts that no non-colour token reaches
the metric: `--space-1` and `--control-height` are declared in the same blocks and are absent from
what the reader returns. Both are declared in the **root block only**, so the test asserts their
absence from that block; the dark block redeclares neither.

The reader's own false-pass direction is covered on **three** axes, since a reader is exactly the
kind of mechanism the rule names. Two are structural: a source with only a `:root` block, and one
whose block never closes, both throw rather than parsing to a half-observed hue set.

**A third axis was missing until round 4 found it**, and it is the one no structural check
reaches. `hues()` admitted a declaration only when its value matched a hex literal, so a
`--color-*` token written as `rgb()`, `oklch()`, `color-mix()` or `var(--…)` — every form T12
might reasonably reach for when it mints an inspection hue — would have been **dropped with
nothing failing**, and AC-0120's gate would have measured a subset and passed. The reader now
**refuses** a colour-named property it cannot parse while still **dropping** a non-colour one, and
both halves of that distinction carry a case.

**That refusal was itself defective in both directions, which round 5 found and this entry records
rather than quietly repairing.** It was **incomplete**: the declaration pattern required a
terminating `;`, which CSS makes optional on a block's final declaration, so a token in exactly
that position never matched — dropping a valid hex hue as silently as an unparseable one, the
quieter failure because nothing would ever have reported it. And it was **over-broad**: it read
declarations out of CSS comments and rejected a hex value carrying a trailing comment, both legal
and both present in the shipped `tokens.css`, so commenting a token out during T12's own work
would have halted AC-0120's gate with a message calling `#176b52` not a hex literal.

**Both are closed and both are pinned.** The terminating semicolon is optional, comments are
stripped before anything else reads the source — including before the braces are matched, so a
brace inside a comment cannot end a block early — and the two neutralisations in the table
re-inject each defect and redden exactly the case that catches it.

The practical effect is a stated constraint on `tokens.css`: a `--color-*` token must be an sRGB
hex literal, and one that is not stops the reader rather than vanishing from the comparison —
**wherever it sits in its block, terminated or not**, with comments neither triggering the refusal
nor hiding a token from it.

**5. The retiring condition** is stated on the module rather than in this note, so it is read by
whoever next edits the mechanism. Two circumstances retire it: the workspace admitting a
maintained colour-difference implementation, since hand-rolled CIEDE2000 is justified only while
the alternative is a new dependency for the arithmetic it would replace — `Lab` through
`hexDeltaE2000`, **118 non-blank, non-comment lines**, measured rather than estimated because the
cost argument rests on the figure; and `tokens.css` ceasing to be
the renderer's sole colour home — the design system's serialized W3C token file becoming the
source and CSS a projection of it — because `readThemeHues` would then report confidently on the
wrong artifact.

### What T14 did not do

- **It derived no hue mapping.** Entry 1 is a kill on two independent grounds and returns to the
 owner. The three-versus-four family disagreement is carried, not settled.
- **It minted no colour family.** That was excluded by name before discovery began, and nothing
 in `tokens.css` changed: the file is untouched by this task.
- **It touched no pinned section, no completed-task evidence and no `amendment_history`.** The
 channel adds records; it removes none.
- **It restated no bound.** See entry 2's mechanical check.

### T14 gate state

| Gate | Result |
| --- | --- |
| `pnpm lint` (`biome check .`) | exit 0, 105 files |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | see the two runs below |
| `pnpm build` | exit 0 |
| `git diff --check` | clean |
| `spec-coupling-check` | 0 findings |
| `lint-contract-item-alignment` | 0 findings, 1 spec checked |
| `lint-spec-status` | spec metadata clean |
| Pinned completed-task section hashes, against the real cohort validator | **11 of 11 verify** |
| Criteria roster | 156 declared, 156 claimed, **0 residuals** — unchanged by this task |

**`pnpm test` was run twice across this task, and the two runs are the clearest evidence yet for the host-contention diagnosis.**

| Run | Load average | Result |
| --- | --- | --- |
| After T14's first implementation | **15.23** | exit 0 — 41 files, **562 of 562** passed, 55.7s |
| After round 5's repairs | **40.45** | exit 1 — **566 of 567** passed; one failure, `AC-0025 admits every executable observed in the descendant tree` |

**The single failure is triaged as pre-existing host contention, by rule rather than by assertion.** Its file, `apps/studio-service/src/trials/connect-and-orient-runtime/runtime-supervisor.test.ts`, is **not in this task's diff** — the diff is four files, two of them `docs/`. It then passed **twice in isolation**, 23 of 23 each time, at load average 38, which is the two-in-isolation rule rather than a single reassuring re-run. The failure kind is the signature `#gate-state-2026-09-17-discovery-channel-addendum` documents at load average 172.

**Three points now span the band**: 172 → twelve failures, 40 → one, 15 → none. A latent defect would not track load that way. A `[backlog].open` entry, `pre-existing-trial-runtime-load-flake`, now records the signature and the judging rule so a cold reader does not re-diagnose it.

**The first run remains the meaningful green for T14's own work**: every gate above was re-run after round 5's repairs, and `delta-e2000.test.ts` is 14 of 14 green in every run.

**Hash verification used the real guard, not a recomputation.** `validate_completed_task_sections` was imported from `.claude/skills/work-loop/scripts/loop-cohort.py` and called against the edited `plan.md` and the live `state.json` — the same function `approve-plan` calls, which is the check that previously refused with "completed task section changed: T4".

### Round 1 — adversarial review of T14, and what it changed

`adversarial-reviewer` returned 14 findings; the adjudicator **sustained 7 and refuted 7**, none
indeterminate. **All four findings raised as Blockers were demoted or refuted** — two to Nit on the
ground that the cited surfaces are ungated comment prose in a task carrying no acceptance
criterion, two refuted on authority. Every sustained finding was applied.

| Sustained | Severity | Applied |
| --- | --- | --- |
| The negative's comment related 10.29 to *half* the separation value — a derived second home, and false arithmetic besides, since half of 20 is 10 | Nit | Comment now states the measured magnitude and the range it sits in, with no reference to the separation value |
| One mean-hue wraparound branch was never exercised while the docblock claimed each discontinuity was | Nit | Published adjacent row added as row 17; coverage claim restated against instrumented branches |
| Entry 2's grep was described as establishing more than it compares, and one sentence in it was false | Concern | Entry 2 now states what the pattern does and does not cover, and the single-home claim reaches prose |
| The `outputRoot` dependants were cited to a Testing Strategy that never names them | Concern | The six real references named, and the consuming spec recorded as `Shipped` |
| The probed reviewer capabilities named no consultable source | Concern | Both host-local agent-definition paths named and marked host-local |
| The sRGB→Lab leg was pinned only by numbers this code produced | Nit | Five externally published points pinned, and a D65→D50 white-point mutation proves the pin load-bearing |
| The ledger said two non-colour tokens are declared in both blocks | Nit | Corrected to the root block only |

**The refutations are recorded because two of them mark boundaries worth not re-litigating.** The
kill entry was challenged for naming no amendment: the *Decision record* paragraph requires the
question, options, option taken, evidence and task refined — not a named amendment — and no
amendment exists to name, since the owner's decision explicitly leaves the three-versus-four
question for one it has not yet made. Entry 3 was challenged on the ground that a default-preserving
`outputRoot` parameter made the resolution a fourth, unenumerated option: it is a path-level
construction detail assigned to T12, which the discovery predicate admits, rather than an option.
The remaining five were refuted on existing handling or consequence.

**Two claims in this ledger were wrong before the review and are corrected above rather than
quietly overwritten**: the fractional restatement of the bound, and the `outputRoot` citation. The
first is the more instructive, because the mechanical check recorded alongside it could not have
caught it — a grep for figures is blind to prose.

### Round 2 — the review that found defects in round 1's repairs

`adversarial-reviewer` returned 9 findings against the **repairs**, not the original work. The
adjudicator **sustained 7, refuted 1 and returned 1 indeterminate**; both findings raised as
Blockers were **demoted to Concern**, on the ground that the reuse decision itself survives its
record being wrong.

**The reviewer's prescribed remedy was rejected on authority for two of them.** It asked for
*superseding entries*, reading the decision record's append-only rule as binding. The adjudicator
held that rule governs an entry **once written and relied upon**, and that in-place repair under
the scoped review is the operative practice for an uncommitted, pre-reliance entry — which is
exactly how round 1's sustained findings were applied. So these are in-place repairs, and the
append-only rule is untouched.

| Sustained | Severity | Applied |
| --- | --- | --- |
| The Testing-Strategy sentence round 1 repaired was **false in the other direction**: that spec names no path, but does bind AC-50, AC-51 and its Visual/manual QA row to the evidence set at this one | Concern | Entry 3 now separates the two — criteria depend on the set, only that spec's notes name the directory — with all three rows cited |
| The dependant set was enumerated as located and **omitted the two derived paths**: the tool builds `${outputRoot}.next`/`.previous` and `.gitignore:47-48` ignore only those spelled against today's root | Concern | Eight dependants, not six; T12 now carries an obligation that any non-default root brings its own ignore entries, and the plan's "mechanical" wording is corrected to exclude it |
| Entry 2 said **both** files pin measured magnitudes; the module pins none | Concern | Attributed to the test file alone |
| "All 17 of 17 rows of the published data" credited the leg with whole-dataset coverage | Concern | Stated as 17 rows chosen from the published set, with the round-1 repair itself as proof the set is larger |
| The comment above the five-element primaries array said "these four" | Nit | Corrected to five |
| "It is now row 17" named the array's new total as a position | Nit | Located as the seventh element, immediately after the row it was confused with |
| The primaries tolerance was recorded a digit tighter than `toBeCloseTo(…, 3)` enforces | Nit | Stated as the 5e-4 window the assertion actually enforces |

**The one refutation** concerned this subsection's own form: recording a round's sustained, refuted
and demoted counts is this ledger's established convention, and the claim that the conversion-pin
gap is described inconsistently was held to compare a severity assignment against a technical
description — both true of different things.

**The indeterminate was dissolved rather than resolved, by owner decision.** Finding 3 held that
`findChromium` cannot reach the four Playwright builds this record cited, because they contain
`Google Chrome for Testing.app` and not the `Chromium.app` path the tool constructs. The
adjudicator confirmed the in-repo half — the candidate path, the newest-first sort and the system
Chrome fallback are exactly as described — but **could not settle the fact at all**: the directory
lies outside the repository working tree and outside any reviewer's read envelope, and no closed
evidence-gate catalog exists here that could admit it. Re-dispatching would have hit the same wall.

The owner's decision was to **drop the claim**. Entry 3 needs only that a browser resolves, which
the declared candidate list establishes from in-repo code; which candidate wins is host-local and
is now explicitly not recorded as contract evidence. **This is the `drop-the-claim` rung, not a
finding left open** — the assertion removed was obliged by nothing, and removing it removes no
stated outcome.

**The lesson this round teaches is mostly about the record.** Most sustained findings in these two
rounds landed on a claim in the ledger rather than on the ΔE2000 arm — though not all, and round 5
corrected this sentence for saying otherwise: round 1's reference-row and conversion-pin repairs
changed the **proof artifact**, and rounds 1 and 2 each corrected a comment in it. The `outputRoot`
citation was wrong, then wrong in the opposite direction, then incomplete — three times on one
sentence, because it was asserting more than entry 3's decision needed. A claim that keeps being
wrong under review is evidence the claim is doing work the decision does not require, which is
what the dropped Chromium claim and the narrowed Testing-Strategy sentence both act on.

### Round 3 — the channel's own authority tested, and upheld

`adversarial-reviewer` returned 8 findings. The adjudicator **sustained 5 and refuted 3**, none
indeterminate. The single finding raised as a Blocker was **demoted to Concern**; **no sustained
Blocker survived any of the three rounds.**

**The most important outcome is a refutation, not a repair.** The reviewer argued that round 2's
new T12 obligation — that a non-default root must bring its own ignore entries — is itself the
thing the discovery predicate's fourth conjunct forbids, and that question 3 must therefore route
through the kill condition rather than resolve. The adjudicator settled it from the plan's own
text and **refuted it on authority**: an ignore entry is a path and a local construction detail,
which the first conjunct admits by name; it is stated on T12, which is named in *Refinable tasks*
and unstarted; and it adds nothing to verify, existing only so a **pre-existing** gate — T13's
clean-tree check — is not violated by a root T12 may not even select. The decisive reading is
that this plan uses "verification obligation" for a duty a task must prove or record, which is
why the inline-proof rule went through the controlled amendment path and this does not.

**Reading it the other way would have emptied the channel**: every refinement states some
construction requirement on a refined task, including the "task refined" element the *Decision
record* paragraph itself requires. So the fourth conjunct does not reach this, and the kill
condition has nothing to route. **Entry 3's resolution stands.**

| Sustained | Severity | Applied |
| --- | --- | --- |
| Entry 3 counted **one** additive change where the plan names **two**, and concluded the retained evidence set was undisturbed — but the surface entries write into it | Concern | Both additions now enumerated; the surface-entry effect stated as twelve added captures and a regenerated manifest against a counted 36-PNG set, with the root choice explicitly left to T12 |
| "Three neutralisations were run" sat directly above a **four**-row table | Concern | Corrected to four |
| The directory enumeration asserted completeness a **fourth** time, omitting two further spellings including one in the tool's own comment | Nit | Exhaustive framing dropped and the list restated as kinds of dependant; **the total survived this repair and was removed in round 4**, which is where entry 3's single position on counting is settled |
| The residue claim blamed a **failed** publish and miscited the successful-run removal | Nit | Attributed to hard interruption only; every failure path shown residue-free, with `:959` and `:976` cited for the success path |
| The reference rows' tolerance was recorded as 1e-4 beside an assertion enforcing 5e-5 | Nit | Stated as the 5e-5 window `toBeCloseTo(expected, 4)` enforces |

**The other two refutations.** The claim that the strengthened single-home sentence is false
because the module contains a literal `20` was refuted: that `20` is CIEDE2000's lightness-weighting
denominator, a different quantity with a different referent, which the entry two paragraphs above
already surfaces and excepts. And the test file's bare `notes/verification-ledger.md#anchor`
reference was refuted as following this repository's established in-code convention, used at four
pre-existing committed sites from directories that have no `notes/` either.

**Convergence, stated with the numbers rather than asserted.** Sustained findings across the three
rounds: **7, then 7, then 5**. Sustained Blockers: **none in rounds 1 to 3** — all **seven**
raised as Blockers there were demoted or refuted, four in round 1, two in round 2 and one in
round 3.

**Where those 19 findings landed, separated three ways rather than collapsed into one claim**,
because round 5 sustained a finding against an earlier version of this paragraph for collapsing
them. Most landed on **this ledger's prose**. Four landed on the **proof artifact**
`delta-e2000.test.ts`: round 1 added reference row 17 and the whole published-primaries case with
its white-point mutation — changes to the proof, not to a sentence about it — and rounds 1 and 2
each corrected a comment in that file. **None in rounds 1 to 3 landed on the module's behaviour**,
which is the narrow claim that survives and the one worth making: the arm computed the same
answers throughout, independently re-verified each round.

**Rounds 4 and 5 broke that too, and the subsections below record it rather than letting this
paragraph stand as the last word:** round 4 sustained the review's first Blocker and its first
defect in the module's behaviour, and round 5 found two more in the control round 4 added.

**What the enumeration taught, kept because it generalises.** Three rounds falsified three
successive attempts to enumerate one directory's dependants exhaustively. The repair that finally
held was not a longer list — it was dropping the claim of completeness, because the decision
never needed a count. A record should assert the weakest thing that still decides the question.

### Round 4 — the round that found a defect in the mechanism, and in the repairs

`adversarial-reviewer` returned 10 findings. The adjudicator **sustained 7 and refuted 3**, none
indeterminate. This round broke the pattern of the first three in two ways, and both are recorded
here rather than smoothed over.

**It sustained the review's first Blocker**, and the cause was a repair that landed in only one of
the two places it reached. Round 3 corrected entry 3 to say the surface entries are *not* neutral,
but left `plan.md`'s T12 refinement still saying the retained evidence set is unchanged — the
false sentence in the **higher-precedence** document, and the one T12 would actually execute from.
The traversal the DECIDE ladder requires of a repair, outward from the cited location to every
other surface stating the same claim, was not run.

**It sustained the first finding against the module's behaviour**, after three rounds whose
sustained findings had landed on this ledger's prose or on the proof artifact but never on what
the module computes. `readThemeHues` admitted a declaration only when its value
matched a hex literal, so a `--color-*` token written as `rgb()`, `oklch()`, `color-mix()` or
`var(--…)` would have been dropped silently and AC-0120's gate would have measured a subset while
passing. **The owner chose the reader-side route**: the reader now refuses a colour-named property
it cannot parse, and still drops a non-colour one. Both halves carry a case, and neutralising the
refusal back to a silent drop reddens exactly the new case.

| Sustained | Severity | Applied |
| --- | --- | --- |
| `plan.md`'s T12 refinement still called the retained evidence set unchanged, contradicting the entry it cites | **Blocker** | T12's refinement now carries the surface-entry effect — twelve captures and a regenerated manifest — with the root choice left to T12 |
| Entry 3 disclaimed a total two paragraphs before stating one | Concern | The surviving total removed; the derived paths stated as a kind of dependant |
| The Round 3 row said the total was dropped when it was not | Concern | The row now records that the total survived round 3 and fell in round 4 |
| "Every failure path is residue-free" was false: the publish write block sits outside every `try` | Concern | Narrowed to the two paths actually shown residue-free; the unguarded write named; the T12 obligation restated against write failure as well as interruption |
| The convergence paragraph said five findings were raised as Blockers; its own subsections sum to seven | Concern | Corrected to seven, with the per-round split |
| `readThemeHues` dropped a non-hex colour token silently | Nit | Reader refuses an unparseable `--color-*` property; two new cases and a fifth mutation |
| The branch tally was stated over both argument orders but counted one | Nit | Restated as a per-row tally, with the reason the branch is order-invariant |

**The three refutations all concern authority, and two are worth not re-litigating.** That T12's
unqualified `Done when` conflicts with the recorded AC-0120 wait was refuted a second time: the
kill condition is the more specific authority and directs exactly this outcome, and the blockage
originates in the pre-existing row-versus-criterion disagreement rather than in anything the
channel resolved, so the fourth conjunct is not reached. That the killed family-set question needs
a `workspace.toml` register entry was refuted on authority: the kill condition requires the
amendment route and T14's record, the *Decision record* paragraph enumerates five elements and a
register entry is not among them, and the index is lifecycle membership for target artifacts rather
than a register of open contract questions — so requiring one would add a control no authority
states. And entry 2's second-caller ground was upheld: the contract assigns AC-0120 to T12
unqualified, and the kill removed no obligation.

**Convergence, stated honestly rather than favourably.** Sustained findings by round: **7, 7, 5,
7** — not a falling curve. The arm's **arithmetic** has been stable and independently re-verified in
every round; the first defect in the module's behaviour was found here, and round 5 then found two
more in the refusal added to close it. What has not been
stable is this record: round 4's sustained set was dominated by defects that **round 3's own
repairs introduced**. The pattern is specific and worth naming — repairing a sentence without
walking every surface that states the same claim, and replacing a wrong claim with a universal
the evidence does not reach. Both are failures of the traversal step, not of the review.

**This is the fourth round and the owner has set round 5 as the last.** If round 5's sustained set
is again dominated by prose defects in this ledger rather than by defects in the mechanism or the
decisions, the loop stops there and the result goes to the owner as it stands, on the ground that
further rounds of the same shape find real errors without the artifact getting better.

### Round 5 — the round that judged the previous round's control

`adversarial-reviewer` returned 7 findings. The adjudicator **sustained all 7 and refuted none** —
the first round with no refutation — at 4 Concerns and 3 Nits, with **no Blocker raised or
sustained**. Two findings were about the mechanism; five were corrections to this record.

**The two mechanism findings both concerned the control added in round 4**, and they pointed in
opposite directions. The refusal was **incomplete**: `CUSTOM_PROPERTY` required a terminating `;`,
which CSS makes optional on a block's final declaration, so a token in that position never
matched. A hex-valued token there was lost as silently as an unparseable one — **the quieter
failure, because nothing would ever have reported it**, and a defect that predated the refusal
while the refusal is what made three documents claim it was closed. The refusal was also
**over-broad**: it read declarations out of comments and rejected a hex value carrying a trailing
comment, both legal and both forms the shipped `tokens.css` already contains.

**The owner chose to complete the parser** rather than narrow the claims or revert to the
recorded-constraint route. The terminating semicolon is now optional, comments are stripped before
anything else reads the source, and the seven-case probe that established the defects was turned
into two test cases. Two new neutralisations re-inject each defect and redden exactly the case
that catches it, on the principle that a repair needs the same proof a mechanism does.

| Sustained | Severity | Applied |
| --- | --- | --- |
| The refusal missed a final declaration without its optional semicolon, and three documents claimed closure | Concern | Semicolon made optional; both halves pinned — unparseable refused, valid hex returned — and a re-injecting mutation added |
| The refusal false-failed on commented-out tokens and hex values with trailing comments | Concern | Comments stripped before matching, ahead of brace matching so a braced comment cannot end a block early; three forms pinned and a re-injecting mutation added |
| Three convergence claims were false against this ledger's own applied columns | Concern | Restated three ways — findings against this ledger, against the proof artifact, against the module's behaviour — since four rounds-1-and-2 repairs landed on the proof, not on prose |
| Both records described publishing as additive when it is a whole-directory swap | Concern | Both now state that a run leaves 48 freshly rendered PNGs in place of 36, every one re-rendered and the manifest re-stamped |
| `:818` was cited as where the run's `try/finally` closes; it is the `finally` opener | Nit | Corrected to `:834`, with the distinction stated |
| The two-label residue summary omitted the restore-rename path named one sentence earlier | Nit | Three named triggers, and explicitly **not** generalised to "any throw", because a throw at `:958` **is** cleared by the publish catch |
| "Sixty lines of arithmetic" named no span and understated the one the sentence implies | Nit | Measured: `Lab` through `hexDeltaE2000`, 118 non-blank non-comment lines, stated at both sites |

**What five rounds show, now that there are enough rounds to say something.** Sustained findings:
**7, 7, 5, 7, 7** — flat, not converging. But the composition changed, and that is the part worth
carrying forward.

- **Rounds 1-3 were corrections only** and introduced no new defect. The one repair that held
 across all of them was **dropping a claim**, not extending one: three attempts to enumerate a
 directory's dependants exhaustively all failed, and the record only stabilised when it stopped
 claiming a count the decision never needed.
- **Round 4 added a control** — at the owner's direction, to close an advisory Nit — and that
 control generated **two defects of its own**, which round 5 then found. It is the only change in
 five rounds to do so.
- **Round 5's corrections applied cleanly**; its two mechanism findings were both against round
 4's addition, not against anything rounds 1-3 produced.

**The generalisable lesson is about which repairs are safe under review.** A correction removes a
false statement and closes. A dropped claim removes an obligation nothing needed and closes. **A
new control opens a new surface, and a surface added mid-review gets reviewed by the next round
with no prior art to steady it.** When a reviewer offers "add a control" and "state a constraint"
as equally defensible routes, those two are not equally cheap, and the cost shows up a round
later.

## owner-decision-2026-09-17-package-4-family-set-and-zone

**Four owner decisions, taken 2026-09-17 by the maintainer operating this session**, in a
question-by-question walk-through after T14 committed. They open Package 4. Three are decisions;
the fourth dissolved on evidence and needed none.

### 1. The family set is **four**. AC-0120 is amended; the row stands.

The *Inspection-family hue separation* row names artifact, review, execution **and attention**.
AC-0120 named three and excluded attention on the stated ground that "a state renders its
attention level through weight, border and placement rather than an attention hue."

**That ground is contradicted by the document AC-0120 itself cites.** AC-0120 measures "against
the hue set the design-system durable output enumerates", and `docs/product/design-system.md`
lists **Attention state: informative, caution, and critical** beside the other three families and
then states: "Each state combines a label, icon or shape, and color." Attention states have colour
there. The exclusion was not a competing judgement about what to compare; it rested on a claim
about the design system the design system does not make.

The practical case points the same way: "critical" is conventionally red or amber, and an
inspection identity hue landing near it would make an inspection state read as an alarm — the
failure the design system's own opening guards when it separates operational from semantic state
"so activity never looks like approval".

**Recorded against the decision, because it is the strongest argument the other way.** T14
measured `--color-proposal-surface` against `--color-accepted-surface` at **21.866** in the light
theme — two members of the *same* family, barely clear of the 20 bound. The palette's natural
spacing sits right at the bound, so requiring a new family to clear 20 against four families in
both themes may prove tight or infeasible. **That risk is accepted and lands on T12**, which
mints the family and runs the measurement; if it proves infeasible, the evidence to revisit the
bound will exist for the first time, and revisiting it is a further amendment rather than a T12
choice.

### 2. Decision 8 closes by **pinning `TZ` in the environment allowlist**.

`runtime-child.ts:311` uses the wall-clock string `ps -o lstart=` prints as a liveness token,
compared byte-for-byte in AC-0081's first limb, while the pinned environment sets `LANG` and
`LC_ALL` to `C` and pins no `TZ`. A rendering that moves for an unchanged process reclaims rather
than declining.

**The route was chosen because it completes an existing control rather than adding one.** `LANG=C`
and `LC_ALL=C` are already pinned to make command output deterministic; they fix the **format**
`ps` renders and leave the **zone** free, so the determinism pin set is incomplete for its own
stated purpose. `TZ=UTC` closes that gap. It touches no acceptance-criterion text beyond the
*Environment allowlist* row AC-0023 cites, and it avoids a fifth consecutive rewrite of AC-0080 or
AC-0081 — the cost decision 6 was taken specifically to avoid.

**What this route does not do, stated so it is not mistaken for more.** It removes the known
trigger; it does not make the comparison fail-safe. The rejected alternative — routing any
uncomparable comparison into the existing `declined` outcome — was the more robust fix, and it was
declined for its contract cost, not on its merits. If a second perturbation of the token ever
appears, that alternative is the answer and this entry is where to start.

### 3. The standing deferred Nits: **repair the determinate ones in this window.**

Every Nit whose fix has a single right answer is carried into Package 4. The ones needing an owner
route are decided here or dissolved below; none is carried forward again.

**The grounds are this spec's own review evidence.** These Nits are corrections of false or stale
sentences, not new controls, and T14's five review rounds showed corrections closing cleanly while
the one added control generated two defects. More directly: T14's **only sustained Blocker in five
rounds** was a stale false sentence left in `plan.md` contradicting the ledger — the
higher-precedence document the next task executes from. Several of these Nits are that same shape,
already known, sitting in the documents T12 and T13 will read.

### 4. Round 19's security finding 1 **dissolved on evidence** and needed no decision.

It held that AC-0080's partial-form enumeration rests on a marker-encoding property "the contract
leaves to implementation", and offered three routes. Both substantive routes are already
satisfied:

- **Stating the property.** AC-0080 now states it explicitly and disjunctively — "every proper
 prefix of the single creating write either fails to yield both a process identity and a start
 time, or yields exactly the complete marker's values" — and names the encoding that realizes it,
 single-line JSON with the start time written last. `writeOwnershipMarker` constructs
 `{ schema, pid, startTime }` in that order.
- **A completeness obligation.** `per-request-state-root.test.ts:134` enumerates **every** proper
 prefix of the real marker write, classifies each, and asserts that exactly one is parseable, that
 it yields both values, and that both equal the complete marker's. The property is verified, not
 asserted.

The third route, age-gating AC-0081's first limb, is unnecessary. **The finding closes as
already-resolved rather than repaired**, and one consequence follows: that test's own comment still
says the property is one "the contract leaves to implementation", which is now false and is a
determinate repair in this window.

## amendment-2026-09-17-package-4-family-set-and-zone

**Package 4, opened against a clean tree with T14 committed at `a718c02`.** It lands through the
**controlled amendment path**, because item 1 moves an acceptance criterion and item 2 moves a
*Canonical values* row that AC-0023 binds to — neither is available to the discovery channel,
whose predicate excludes both.

**Scope.**

| | |
| --- | --- |
| AC-0120 | Exclusion clause deleted; the comparison becomes four families, matching row 67 |
| *Environment allowlist* | `TZ=UTC` added; `runtime-environment.ts` and its tests follow |
| Deferred Nits | Every determinate one repaired; see the enumeration below |
| Not in scope | The 20-unit bound itself; AC-0080 and AC-0081's first-limb behaviour; any T12 durable output |

**The carried figure was right, and the correction this entry first made was wrong.** An earlier
draft claimed "thirteen standing deferred Nits" undercounted, and put the figure at sixteen from
five tables. Round 28 found two errors in that, pulling in opposite directions: the roster **missed
two whole tables** — round 24 (1) and round 27 (1) — and it counted **table rows rather than live
entries**, including four already repaired by later rounds. The arithmetic across all seven tables:

| | |
| --- | --- |
| Rows across seven tables — r19 (4), r20 (1), r21 (1), r23 (6), r24 (1), r26 (4), r27 (1) | **18** |
| Already repaired by a later round before Package 4 opened | −4 |
| Closed by the owner's `TZ` decision — r21 security-2 | −1 |
| **Live at the start of Package 4** | **13** |

So the ledger's thirteen was accurate and the "undercount by three" claim was not. It is retracted
here rather than quietly amended. The lesson is narrower than the one the earlier draft drew: the
defect was never that nobody checked the count — it is that checking it by counting rows in the
tables you happen to find is not checking it.

**Disposition of all eighteen rows across seven tables; thirteen were live.**

| Source | Entry | Disposition |
| --- | --- | --- |
| r19 | item-2 — the *Markerless-reclaim age* row paraphrases AC-0081's second limb as unparseable-only | Repair the row |
| r19 | item-4 — a Follow-on names T6 as its confirmation point, which T6 schedules nowhere | Weaken the Follow-on's claim. The other enumerated route, adding a T6 control, is **no longer available**: T6 is completed and its section pinned |
| r19 | item-5 — AC-0081's replacement-safety sentence attributes safety to the first limb, though limbs two and three reclaim with no liveness determination | Repair the justification |
| r19 | security-1 — the encoding property "left to implementation" | **Closed as already-resolved**; see owner decision 4 |
| r20 | Nits-1 — AC-0081's fail-closed rationale sentence lacks a main verb | Repair |
| r21 | security-2 — the timezone-rendered liveness token | **Closed by owner decision 2**, pinning `TZ` |
| r23 | adv1/sec1 — the *Permitted executables* row asserts an audit scope the narrowed AC-0025 no longer carries | Repair the row |
| r23 | adv2 — three enumerations of what bounds materialization after the cut disagree | Reconcile to one; if the correct enumeration is not determinate on reading, it returns as an owner question rather than being guessed |
| r23 | adv4 — the in-tree process-status path is a literal though the module header says canonical values arrive in the plan | Repair |
| r23 | adv6 — the advance-fixed ceiling is attributed to the sampler; it is the 5,000-per-interval pass bar | Repair |
| r23 | adv7 — a shared constant's docstring names only the Runtime, though the parent-side observer also uses it | Repair |
| r23 | sec2 — AC-0023's justification says the observer "processes none of" data it in fact parses | Repair the stated ground; containment holds by charset, so the defect is the justification |
| r26 | 1 — AC-0080 enumerates two crash outcomes while its own encoding property admits three | Repair |
| r26 | 2 — the extended non-originated item is named more narrowly than its own gloss | Repair |
| r26 | 3 — the class head admits user-submitted input no enumerated item assigns | Repair |
| r24 | 1 — the Always-do rail grounds its exemption on an enumeration narrower than the *Permitted executables* row it cites | Repair the rail. **Missed by the first roster entirely**; added after round 28 |
| r27 | 1 — the plan-contract note says both documents are pinned after approval, against the channel's refinable T12 and T13 | Repair the note with an explicit carve-out. **Missed by the first roster entirely**; added after round 28 |
| r26 | 4 — the missing-start-time crash form is unreachable under the encoding AC-0080 names | Repair. **Confirmed by test, not by reading**: `per-request-state-root.test.ts:134` finds exactly one parseable prefix and it yields both values, so no crash leaves a parseable marker missing the start time |

Entries r26-1 and r26-4 are the same sentence wrong in both directions: AC-0080's crash
enumeration omits a reachable form and names an unreachable one, and the prefix test settles both.

**Not repaired, and why.** Nothing. Every entry above is either repaired here, closed by an owner
decision, or closed as already-resolved. Package 4 carries no deferred Nit forward; if a repair
proves non-determinate on contact, it returns as an owner question inside this window rather than
being deferred past it.

## amendment-2026-09-17-package-4-applied

**Package 4's edits, and a correction to its own scope record.** The amendment entry above
promised a disposition for all sixteen deferred entries. Executing it found that **four were
already repaired by later rounds and had simply never been struck off**, which is the same defect
class as the "thirteen" undercount: a list nobody re-read against the text it cites.

**Verified stale, closed as already-resolved rather than repaired.**

| Entry | Why it is closed |
| --- | --- |
| r19 item-4 — a Follow-on names T6 as its confirmation point which T6 schedules nowhere | The confirmation **was performed and recorded**, at `#t6-inspector-read-reach-confirmed-2026-09-17`, and `spec.md`'s residual already cites that anchor. It was recorded outside `#t6-evidence`, which is why a reader checking only T6's evidence table would still think it open |
| r19 item-5 — AC-0081's replacement-safety sentence attributes safety to the first limb | The sentence now reads that reclaim is safe "because `mkdtemp` names are never reused and the marker pins start time as well as process identity". It no longer attributes safety to a liveness refusal |
| r19 security-1 — the encoding property is left to implementation | Closed by owner decision 4: AC-0080 states the property and names its encoding, and `per-request-state-root.test.ts` verifies it over every proper prefix |
| r20 Nits-1 — the fail-closed rationale sentence lacks a main verb | It reads "Declining **is** the fail-closed direction…". The predicate is present |

**Closed by owner decision**: r21 security-2, the liveness-token zone, by pinning `TZ=UTC`.

**Repaired here — eleven edits.**

| Entry | Repair |
| --- | --- |
| r19 item-2 | The *Markerless-reclaim age* row now matches AC-0081's second limb in both halves. It had been repaired once already and was left mismatched the **other** way, naming only "does not yield both" and dropping "cannot be parsed" |
| r23 adv1/sec1 | The *Permitted executables* row said "every such spawn" is in the audit; AC-0025's second leg is scoped to spawns Studio performs **within the trial tree**, so the Service's own parent-side `ps` reads are not. The row now says so and names what does cover them |
| r23 adv2 | The *Materialized tree bytes* row said three things still bound materialization while its own second column says the sampler still enforces the file-count bound. Now four, matching the accepted residual it had been disagreeing with |
| r23 adv4 | `runtime-child.ts`'s header claimed every canonical value arrives in the plan; `PS_EXECUTABLE` is a literal. Named as an exception, with the reason it is safe — a drifted literal reddens AC-0025's audit leg rather than passing |
| r23 adv6 | `plan.md` attributed the advance-fixed bar to the sampler. The sampler enforces the bound; the **pass bar fixed in advance**, 5,000 files per 250 ms interval, is what makes the tolerance honest |
| r23 adv7 | `executable-identity.ts`'s docstring named only the Runtime as starting `/bin/ps`. **The first repair replaced one inaccuracy with another** — it named the Runtime as a sharer, and the Runtime does not import the constant; round 28 caught it. The docstring now names the two modules that do import it, and identifies the child's separate literal as the documented no-import exception |
| r23 sec2 | AC-0023 said the parent-side observer "processes none of" the influenced data; it parses `ps` columns carrying owner, repository, ref and revision. The ground is now the true one — it **executes** none of it, and its inputs are charset-confined |
| r26-1, r26-4 | AC-0080's crash enumeration was wrong in both directions at once. It named a form that cannot occur and omitted one that can. Now: two outcomes are reachable — unparseable, or the single prefix that drops only the trailing newline and yields the complete values — and the missing-start-time form is stated as unreachable under this encoding, **with the test that establishes it cited by path** |
| r26-2 | The extended item said "third-party executable" while its gloss includes the Runtime child, which is Studio's own Node process. What puts both in the class is that Studio did not author the bytes, not who supplied the binary |
| r26-3 | **Owner decision, taken in this window rather than deferred**: operator-supplied input is outside the class. The head admitted it and no item assigned it, and the deciding observation is that AC-0116's sink prohibition would otherwise forbid building the permitted URL from the owner and repository — the operation it exists to protect. The exclusion rests on the boundary charset validation, and the row says so |

**The contract edits.** AC-0120's exclusion of attention is deleted, so the comparison matches the
*Inspection-family hue separation* row at four families; the removal states the ground rather than
just dropping the clause, because the clause's own reason was a claim about the design-system
durable output that the output does not make. `TZ=UTC` joins the *Environment allowlist*, with the
determinism argument stated where the allowlist is read: `LC_ALL=C` fixes the format a command
renders and leaves the zone to the host, which is what let a liveness comparison become a reclaim.

**Nothing is carried forward.** Eighteen rows across seven tables: **thirteen were live**, and all
thirteen are disposed — eleven repaired in the first pass, two more (round 24's and round 27's)
repaired after round 28 found the roster short. Four were already repaired before this window and
one closed by the `TZ` decision. Package 4 defers no Nit.

- **Round 24's**, at `#review-round-24-2026-09-17`: the Always-do rail grounded its exemption on
 the *Permitted executables* row admitting "an interpreter probe, and `/bin/ps`" while the row also
 admits the Runtime's own Node process. The rail now enumerates all three.
- **Round 27's**, at `#review-round-27-2026-09-17`: the plan-contract note said both documents are
 pinned after approval while the channel makes T12 and T13 refinable until their first implementing
 commit. The note now carries the carve-out explicitly and points at the channel that defines it.

**Gates at the close of drafting**: `pnpm lint` exit 0 over 105 files; `pnpm typecheck` exit 0;
`pnpm test` **41 files, 567 of 567 passed** at load average 25.45, including the 240 trial-runtime
tests that carry the `TZ` change; `spec-coupling-check` 0 findings; `lint-contract-item-alignment`
0 findings; `lint-spec-status` clean.

## review-round-28-2026-09-18

**Package 4's pre-EXECUTE review, both mandatory reviewers, both adjudications valid with an
indeterminate audit of `None.`** The adversarial half raised 13 and the security half 5; the two
adjudications sustained **13 between them** and refuted 5. Three adversarial findings were refuted
as duplicates of security findings over the same sentences, so each defect received **one** repair
rather than two competing ones.

| Reviewer | Raised | Sustained | Blockers | Concerns | Advisory/Nit | Refuted |
| --- | --- | --- | --- | --- | --- | --- |
| adversarial | 13 | 9 | 4 | 2 | 3 | 4 |
| security | 5 | 4 | 1 | 2 | 1 | 1 |

**The Blocker was a regression this amendment introduced.** Pinning `TZ=UTC` in the *Environment
allowlist* bound the Runtime's rendering of the liveness token but not the Service's: the child
renders `ps -o lstart=` under the rebuilt allowlist, while `readProcessStartTime` passed no `env`
and inherited the host zone. AC-0081's first limb compares those two renderings for byte equality.
Before Package 4 both rendered in the host zone and matched; after it they differ on **every**
host whose zone is not UTC — and a failed liveness comparison reclaims a state root whose Runtime
is live. **That is worse than the hazard decision 8 set out to remove**, which needed a host zone
change inside a 150-second window with two live Runtimes. It was latent only because `sweep.ts` has
no production caller yet, and `sweep.test.ts` built its live marker with the same unpinned reader,
so the suite could not have caught it.

Repaired at the seam the adjudication named rather than by the new criterion the reviewer proposed:
`readProcessStartTime` now renders under a pinned `LC_ALL`/`TZ`, and a case in
`per-request-state-root.test.ts` renders the token the way the child does — explicitly pinned,
independently of the module's own constant — and asserts the reader matches. **Round 29 found that verification insufficient and it is corrected here rather
than left standing.** The case compared the reader against a rendering it pinned to UTC itself, so
on a UTC host — the usual CI default — deleting the reader's pin changed nothing and the case
stayed green; it also hardcoded the child's expected rendering, so removing the allowlist's `TZ`
could not redden it at all. The mutation recorded above reddened only because this host is UTC-5.
**A mutation that reddens on one machine is not a proof that the guard guards.** The case was
replaced in round 29 and the replacement is proven across both dimensions at
`#review-round-29-2026-09-18`.

**The second Blocker is the sharper one, because it was a proof that could not fail.** AC-0080
cited the prefix test as establishing that no crash leaves a marker parsing without a start time.
The test's loop `continue`d past exactly that form without counting or asserting it, so
`expect(parseablePrefixes).toBe(1)` would have passed if one existed. The criterion rested on an
assertion that could not fail for the claim it was cited for — **the same false-pass shape the
inline-proof rule exists to close**, in the artifact that rule had already been applied to. The
branch now fails instead of skipping.

### The traversal walk, run deliberately this round

Three of the four adversarial Blockers were one failure repeated: a claim repaired at its cited
location while another surface kept the old wording. The owner directed that the DECIDE ladder's
traversal be applied to the whole sustained set, so it was run **mechanically** — a literal sweep
per claim across `spec.md`, `plan.md`, the ledger and all source — rather than from recall.

It changed the outcome three times:

- **It found a surface neither reviewer cited.** `per-request-state-root.ts`'s own docstring
 repeated both the encoding property and the false test citation. Repairing only AC-0080 and the
 test would have left the production module asserting it.
- **It found the repository already contradicting the repair.** The claim that AC-0025's sampled
 leg covers Service-side `ps` spawns is denied twice in this tree — at `#t4-evidence`'s analysis
 and in `runtime-supervisor.test.ts`'s own comment, both stating the sampled leg cannot see a
 process living about 20 ms. The correct wording was already written; the repair had only to stop
 contradicting it.
- **It caught an error in a correction made earlier in this same window.** See the retraction in
 `#amendment-2026-09-17-package-4-applied`: the "thirteen is an undercount" claim was wrong, and
 wrong in two directions at once.

The walk also forced a distinction worth keeping: **a live instruction is repaired, a historical
record is not.** The family-set claim had five surfaces — two live plan sections, which now state
the settled set, and three round records, which remain accurate as descriptions of what was true
when written. One of those carries a dated forward pointer rather than a rewrite, so a reader
landing there is not misled without the audit trail being falsified.

Every repaired claim was re-swept afterwards and its frontier confirmed empty.

### Gate state

| Gate | Result |
| --- | --- |
| `pnpm lint` | exit 0, 105 files |
| `pnpm typecheck` | exit 0 |
| `spec-coupling-check` | 0 findings |
| `lint-contract-item-alignment` | 0 findings |
| `pnpm test` | **not green, and not judged red** — see below |

**The suite's red is contention, established by the two-in-isolation rule rather than asserted.**
Two full runs produced **different** failure sets — six failures, then two — and the only file
common to both, `disposal.test.ts`, then passed **7 of 7 twice** in isolation after failing with
**different tests** in each of its two earlier isolated runs. No test failed twice in isolation, so
none is deterministic. `runtime-supervisor.test.ts`, the file this amendment edits, passed **23 of
23 in both** isolated runs, which is the check that matters for the `TZ` change. Load average
during the reds was **60 to 69** on a host carrying 28 other sessions — the top of the band this
ledger tracks. Signature and judging rule are recorded at `pre-existing-trial-runtime-load-flake`
in `[backlog].open`.

## owner-decision-2026-09-18-liveness-guard-and-failopen-routing

**Two owner decisions, taken 2026-09-18**, both arising from round 29.

**1. The fail-open routes out of Package 4 as its own spec-backed work.** Round 29's secure-design
review found that both liveness readers fold "no bytes on either stream" into a determination that
the process is **absent**, without consulting the spawn error — so a `ps` that never ran drives
AC-0081's first limb to reclaim a **live** state root, with no AC-0083 diagnostic because nothing
was declined. The adjudication established it is real, **pre-existing**, and excluded from this
amendment's scope twice over, and returned it as indeterminate on the one thing it could not
settle: whether the owner wished to reopen decision 8.

The owner declined to widen Package 4. The defect is recorded at
`liveness-read-fails-open-to-reclaim` in `[backlog].open` with its full evidence. **The ground for
routing rather than deferring**: the repair is exactly the reroute decision 8 declined for its
contract cost, and decision 8 recorded the condition for reopening — this is a second, independent
trigger for it, so it deserves its own scope and review rather than riding an amendment already
two review rounds deep in its own repairs.

**2. All three hardening items around the liveness pin are taken, and each was an owner route
rather than a repair.** The detector is made host-independent and both-sides-sensitive; the
Service-side pin gains an acceptance criterion; and the rendering environment becomes a closed set.
Recorded as owner decisions because each **adds a control**, which this session's evidence says is
the expensive kind of change — three of them have produced the next round's defects here. Taken
anyway, for a reason specific to this control: the thing being guarded is a path that deletes a
live Runtime's working tree, and round 29 showed the previous guard was green exactly where CI
runs.

## review-round-29-2026-09-18

**Both mandatory reviewers, both adjudications read.** The adversarial half raised 12 and the
security half 9; **13 sustained between them**, 3 refuted as duplicates already covered by the peer,
3 refuted on their merits, and **1 returned indeterminate on an owner decision** — a loud stop that
produced the decisions above.

**The headline finding is that round 28's repair was verified against one machine.** The
regression detector that closed round 28's Blocker compared the reader against a rendering the case
pinned to UTC itself. On a UTC host — the usual CI default — deleting the reader's pin left it
green. It also hardcoded the child's expected rendering, so removing the allowlist's `TZ` could not
redden it at all. The mutation recorded in round 28 reddened only because this host is UTC-5.

**The replacement is proven across both dimensions rather than asserted.** It forces the ambient
zone to `Pacific/Kiritimati`, which is never the pin, derives the Runtime's side from
`buildPinnedEnvironment` rather than restating it, and reads the Service's side through its own
seam:

| Mutation | Host `TZ=UTC` | Host `TZ=America/New_York` |
| --- | --- | --- |
| none — baseline | 18 of 18 pass | 18 of 18 pass |
| reader's pin deleted | **1 failed** | **1 failed** |
| allowlist's `TZ` deleted — the child side | **1 failed** | **1 failed** |

Both modules were restored byte-identical afterwards. **This is what round 28's proof should have
looked like**: the earlier one varied one factor on one host and generalised; this one varies the
factor the earlier proof held fixed.

**AC-0159 is new, and the criteria count moves 156 → 157.** It binds every rendering of the
liveness token, on both sides, to the same closed set — `LANG=C`, `LC_ALL=C`, `TZ=UTC` — and is
stated separately from AC-0023 because AC-0023's scope is the trial tree while one of the two
renderings happens outside it. T13 claims it, because the work is done and only its verification
belongs to a task. Without it, nothing in the roster reddened if the Service-side pin were deleted.

**A correction the reviewers did not catch, found by the traversal walk.** The `TZ` asymmetry had
**two** directions, not one. `writeOwnershipMarker` is Service-side and also writes markers, so a
Service-written marker met by the child's in-tree sweep would have mismatched in the other
direction. Pinning the single Service-side reader closed both, because that one function feeds both
the Service's marker writes and the Service's sweep reads. Two renderers, two comparison sites,
four combinations — all four now agree.

**Sustained and applied.**

| Finding | Severity | Applied |
| --- | --- | --- |
| The detector was vacuous on a UTC host, and spec and ledger recorded its result as verified fact | Blocker | Detector replaced and proven on both host zones and both sides; the ledger's round-28 verification corrected rather than left standing |
| The *Non-originated value* row left AC-0116's reach over derived values undecidable, and its exclusion was an open predicate | Blocker | The derived-value sentence carries its charset-validated exception, and the head closes to the two named charset rows |
| The disposition roster enumerated sixteen immediately after retracting that figure | Concern | Now eighteen rows across seven tables, thirteen live, with r24 and r27 added |
| The *Permitted executables* row misdescribed one Service-side caller's operand | Concern | States the operand class both callers pass — a validated integer identifier — and where validation happens |
| The preamble placed the live rendering on a side that runs no production sweep | Concern | States that both production renderings are child-side today, that the Service seam has no production caller, and why it is pinned anyway |
| AC-0080's added paragraphs sat outside its list item | Nit | Indented into the criterion |
| The new case sat under a describe naming criteria it does not exercise | Nit | Titled for AC-0081 |
| The Always-do rail denied the Node vector carries the pinned configuration | Nit | States the real exemption ground: it delivers the configuration as payload rather than applying it to itself |
| The retraction's forward pointer contradicted its target on the date | Nit | 2026-09-17 across all surfaces |
| The case hardcoded `/bin/ps` while supporting a row that says the path comes from the shared constant | Nit | Uses `PROCESS_STATUS_EXECUTABLE` |
| The prefix enumeration skipped the empty prefix while the criterion calls it exhaustive | Nit | Starts at 0 |
| The Service-side rendering pin was bound by no criterion | Owner route | **AC-0159** |
| The rendering environment spread `process.env` before its pins | Owner route | Closed set of three names |

**Three refuted on their merits**, and one is worth not re-litigating: that amended AC-0120 leaves
T12 executing against inputs no task produces. The plan already assigns the hue mapping to T12 by
name and records the owner's accepted feasibility risk, so the gap is a recorded assignment rather
than a defect this amendment introduced.

### A process slip in round 29, recorded rather than smoothed over

Round 29's repairs were made while the engine sat at `SPEC-PLAN-REVIEW`. The work-loop's sequence
is `findings-remain` → revise → `spec-ready`, so the revision should have happened in
`SPEC-PLAN-DRAFTING`. The engine caught it by refusing `spec-ready` as an illegal transition from
`SPEC-PLAN-REVIEW`, which is the guard working: the state machine would not let the run pretend it
had returned to review from drafting it never entered.

Both transitions were then fired in order, seq 74 and 75, leaving the state correct. **What is
inaccurate is only the ordering in the transition log**, not the content: the findings were
sustained, the revision happened, and the run is ready for review again. Pre-EXECUTE rounds call no
`review record` and consume no retry budget, so all three counters remain 0 after twenty-nine
rounds, and the eleven pinned section hashes and five amendments are untouched.

Naming it because this ledger's convention is that a slip caught by a guard is still a slip, and a
reader reconstructing the sequence from timestamps would otherwise find the edits preceding the
transition that authorizes them.
