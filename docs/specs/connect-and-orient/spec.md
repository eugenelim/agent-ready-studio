# Spec: Connect and Orient — connect and see the verdict

- **Status:** Implementing
- **Owner:** Agent-Ready Studio maintainers
- **Plan:** [`plan.md`](plan.md)
- **Constrained by:** RFC-0001, RFC-0002, ADR-0005, ADR-0006, ADR-0007
- **Brief:** docs/product/briefs/connect-and-orient.md
- **Discovery:** ARS-THREAD-001
- **Contract:** contracts/jsonschema/studio-protocol-v1.schema.json
- **Shape:** mixed

> **Spec contract:** this document defines what "done" means. The implementing
> PR must match this spec, or update it. Verification must be derivable from it.
>
> **Not every section is contract.** `Boundaries`, `Testing Strategy` and
> `Acceptance Criteria` are what a completion gate reads. `Objective`,
> `Canonical values`, `Durable Outputs`, `Follow-ons` and `Assumptions` are
> working material. `Canonical values` is working material the contract
> *cites*: a criterion naming it carries the obligation, the table records the
> value.

> **This is slice 1 of two.** The brief's outcome is delivered when slice 2
> ships. Canonical artifact viewing, the full work-state projection, capability
> inventory, shaping-availability explanation, refresh and staleness, and
> projection persistence are **slice 2** and are deliberately absent here.
> Definition-of-done items 8, 9 and 10 land with that slice. Item 7 — the last
> successful inspection survives restart — is **slice 1's**, delivered by
> AC-0100 through AC-0104.

> **The trial Runtime is provisional, private, and non-normative.** Authorized
> only by [RFC-0001 follow-on item 7](../../rfc/0001-notes/post-acceptance-follow-ons.md).

## Objective

A product or engineering lead pastes one public GitHub repository URL into
Studio and learns, without a terminal or credentials, whether that repository
is Agent-Ready — pinned to one exact commit that is visible wherever the answer
is shown. When the answer is no, or cannot be determined, the surface says
which and why, and whose gap it is. No repository-authored code runs, no
repository-supplied value changes what Studio decides, and no file outside the
inspected snapshot is read.

## Canonical values

| Name | Value |
| --- | --- |
| Trial code root | `apps/studio-service/src/trials/connect-and-orient-runtime/` |
| Trial contract name | `connect-orient-trial.v0` |
| Evidence note | `docs/product/research/connect-and-orient-trial-runtime-evidence.md` |
| Sweep domain | `$HOME/Library/Application Support/agent-ready-studio/trial-materializations/` on Darwin, `$XDG_STATE_HOME/agent-ready-studio/trial-materializations/` otherwise — a per-user, non-world-writable fixed parent, created mode `0700`, deliberately **not** under the OS temp root and **not** the per-request `TMPDIR` |
| Per-request state root | a per-request `mkdtemp` directory created inside the sweep domain at mode `0700`. It holds four children: the ownership marker, the materialization root, the per-request `HOME`, and the per-request `TMPDIR`. The parent is fixed so the sweep can enumerate; this child is unpredictable. **It is the unit of reclaim** |
| Materialization root | the `tree` child of the per-request state root, created at mode `0700`. It is the only path repository content ever reaches, which is what places the ownership marker beyond forgery — the marker is its sibling, not its descendant |
| Ownership marker | the `marker` child of the per-request state root, naming the owning process and its start time. AC-0080 owns its write and removal ordering; this row records only that it is a direct child of the state root and never inside the materialization root |
| Permitted read surface | `workspace.toml` and `.agentbundle-state.toml` only, each read as data. `.agentbundle-state.toml` is admitted because it is where a declared `schema-version` actually lives — `workspace.toml` carries none, verified on this repository — and without it AC-0065 is unreachable. `.claude/` and `.agents/` remain slice 2's surface |
| Permitted executables | the resolved `git` binary; any executable `git` itself re-executes from the recorded `git --exec-path` directory, including the distinct `git-remote-https` helper; any Python interpreter at an enumerated search-list path, including a non-conforming one started solely by the version probe; the Runtime's own Node process; `/bin/ps`, started by Studio's own code with a fixed argument vector carrying no attacker-influenced operand, to read a process start time the platform exposes no other way. It is admitted rather than avoided because **no repository-sourced code executes inside the trial process group**, so nothing there benefits from it, and because the Studio Service already depends on it for parent-side process-tree observation. Every such spawn **inside the trial tree** is recorded in the audit AC-0025's second leg reads. The Service's own parent-side `ps` reads are outside **both** of AC-0025's legs: the audit leg is scoped to spawns Studio performs within the trial tree, and the sampled leg enumerates that tree's process group, which a Service-side child is not in — and a `ps` lives about 20 ms, under the floor at which the sampler can see a process at all. What admits them is this row plus their construction: an absolute path from the shared constant, with a fixed argument vector whose only operand is an integer identifier, on a different ground for each caller — a process id for the liveness read, parsed from a marker file and integer-checked both where the marker is decoded and again before the spawn, and for the tree observer a process-group id that carries no runtime check because Studio minted it itself |
| Python interpreter search list | `/opt/homebrew/bin/python3`, `/usr/local/bin/python3`, `/usr/bin/python3`, in order, each started once to report its version; the first at 3.11 or later is used; `PATH` is never consulted |
| Pinned trusted inspector | AgentBundle pack `core`, the version recorded at T6 with the SHA-256 of `workspace_status.py` and `workspace_status_engine.py`. Every A3-derived property in the brief is a property of one pack version, so the pin is the evidence's scope |
| `git` identity verification | the resolved absolute path reports a `git version` line, and its `git --exec-path` directory is recorded and re-read on no later spawn |
| Permitted URL scheme | `https` only |
| Permitted host | exactly `github.com`, ASCII-lowercased, no port, no trailing dot |
| Permitted git transports | `https` only, via `GIT_ALLOW_PROTOCOL=https` |
| Owner / repository charset | `A-Za-z0-9._-`, 1–100 characters, not beginning with `-` or `.`, not equal to `.` or `..` |
| Ref charset | `A-Za-z0-9._/-`, 1–255 characters, not beginning with `-`, no `..`, no ASCII control character, no leading or trailing `/` |
| Request identifier | minted by the Studio Service, `A-Za-z0-9-`, 8–64 characters, not beginning with `-`, unique per request |
| Non-originated value | any value whose bytes Studio did not produce, other than operator input validated against the *Owner / repository charset* or *Ref charset* rows before use — those two rows and no others, so a later operator field does not leave this class merely by acquiring a charset rule of its own: a repository-derived value as AC-0039 defines it, the remote-resolved revision, any value a transport reported, and text authored by a pinned executable rather than by Studio's own code — the trusted inspector's own prose, and a child process's own diagnostic text. The item does not say *third-party*, because the second half of its gloss is the Runtime child, which is Studio's own Node process; what puts both inside the class is that Studio did not author the bytes, not who supplied the binary. The class is named once here so the rendering obligation and the sink prohibition cannot drift apart, which is how AC-0116 came to be narrower than AC-0115. **Both obligations reach a value Studio itself derived from a member of this class**, such as a commit link built from the resolved revision; stating that reach here rather than on either criterion is what keeps the two from drifting again. The head's exclusion of charset-validated operator input is stated once, there, and not repeated as a general exclusion of operator input — the two are not the same, and only the narrow one has a ground. **What the surface accepts is a single public GitHub URL** (AC-0106): the lead types no owner, repository or ref field. That submitted string is screened by AC-0002 through AC-0005, and the owner and repository AC-0001 derives from it are charset-validated under AC-0006 before AC-0010 builds the permitted URL from them. **The precedence, stated as a rule because two sentences in this row otherwise reach the same value:** where a value is derived **from operator input** *and* is itself validated against the *Owner / repository charset* or *Ref charset* rows, the charset exclusion governs and the derivation reach does not, so the owner and repository AC-0001 derives from the submitted URL are outside the class; everything else derived from a class member stays inside it. **The antecedent is operator-derived, not merely charset-validated**, because AC-0008 applies the *Ref charset* to the ref Studio resolves **from the remote** — a transport-reported value, which the head puts inside the class and which must stay there, so AC-0115 keeps requiring it to render and be announced as literal text and AC-0116 keeps forbidding it as a URL, resource reference or navigation target. That is what lets AC-0010 build the permitted URL from them without this class's obligations forbidding the operation they exist to protect. **Round 35 restated this ground**, which had named AC-0116 — true while that criterion reached transport operands, and not after round 34 narrowed it to rendering and navigation sinks. **The submitted string itself is not excluded**, because no charset row reaches it; it stays in the class, and AC-0115's literal rendering and announcement continue to reach it wherever it is echoed |
| Minimum supported window width | 900 CSS pixels |
| Inspection-family hue separation | at least 20 units of CIE ΔE2000 from every hue in the artifact, review, execution and attention families, in both themes |

### Pinned `git` configuration

Passed on every `git` argument vector as `-c` options. A command-line `-c`
outranks every configuration file. The environment additionally pins
`GIT_CONFIG_GLOBAL` and `GIT_CONFIG_SYSTEM` to `/dev/null` and sets
`GIT_CONFIG_NOSYSTEM`, which neutralizes the global and system files — but not
`$GIT_DIR/config` or `config.worktree`, which `git` reads regardless of those
names. The repository-local file is neutralized instead by `-c` precedence,
which outranks it, together with AC-0136, which keeps a tree entry from
overwriting the real `.git` at checkout.

`http.followRedirects=false`, `core.hooksPath=/dev/null`, `core.symlinks=false`,
`core.protectHFS=true`, `core.protectNTFS=true`, `core.fsmonitor=false`,
`protocol.version=2`, `submodule.recurse=false`, `credential.helper=` (empty),
`transfer.fsckObjects=true`, `maintenance.auto=false`, `gc.auto=0`,
`advice.detachedHead=false`.

`core.protectHFS` and `core.protectNTFS` are pinned rather than inherited
because the delivery platform is case-insensitive and a tree entry whose name
is a case or Unicode-ignorable variant of `.git` would otherwise overwrite the
real one at checkout, handing an attacker repository-local configuration.
`core.fsmonitor`, `maintenance.auto` and `gc.auto` are pinned because each can
otherwise spawn a descendant that outlives the supervised window.

### Environment allowlist

The environment of the Runtime child and of every process in its descendant
tree is constructed from an empty object. Each name below is set to the stated
value; every other name is absent.

`LANG`, `LC_ALL` and `TZ` are here for one reason — making the output of the
commands Studio reads deterministic — and they are listed together because the
first two alone are not sufficient for it. `LC_ALL=C` fixes the *format* a
command renders; it leaves the *zone* to the host, so `ps -o lstart=` renders a
different wall-clock string for an unchanged process when the host zone changes.
AC-0080's ownership marker records that string and AC-0081's first limb compares
it for byte equality, so an unpinned zone turns a liveness comparison into a
reclaim.

**The pin binds both sides of that comparison, and stating it for the trial tree
alone is not enough.** Where each rendering happens today, stated exactly, because
mis-scoping it is what produced the defect this paragraph exists to prevent: in
production **both** renderings are child-side under this allowlist — the Runtime
writes the marker, and AC-0081 assigns the sweep to the Runtime — it opens "A Runtime sweep
 enumerates only direct children of the sweep domain" — so the sweep runs in the
child rather than the Service. (AC-0082 states only that the Service invokes it
without reading under a materialization root; it assigns no execution side.) The Service-side seam is `readProcessStartTime`, which the
Service's own form of the sweep and the marker helpers render through; it has no
production caller yet. It is pinned anyway, because the side that acquires one
first must not be the side that discovers the comparison was never bound. Pinning only the first is worse
than pinning neither — it turns a comparison that matched on every host into one
that fails on every host whose zone is not UTC, and a failed liveness comparison
reclaims a live state root. The Service-side reader therefore pins the same zone
and locale at its own seam, from a closed set rather than by overriding inherited
names, and **AC-0159 is the obligation that owns this** rather than the trial-tree
table above.

Two cases guard it, because the pin breaks in two ways and no single case catches
both. One asserts the contents of each rendering environment, which catches the
pinned set losing or changing a name. The other forces a non-UTC zone into the
rendering process and compares the reader's output against an explicitly pinned
rendering, which catches **the Service-side** call site ceasing to use the
pinned set, independently of the host's own zone because both compared values
are then explicit. **Two limits are stated rather than left to be discovered.**
It binds only that call site. The Runtime's rendering runs inside the child, and
the audit leg that records its spawn carries **names only, never values** — while
AC-0159 is an obligation over three values — so no case here reaches it. An audit
that recorded values would observe them; the ground is what this audit records,
not what any audit could. And it needs the forced zone to resolve —
on a host whose zone database lacks it, `ps` falls back to UTC and the case's
own guard fails, closed but for an environmental reason.

| Name | Required value |
| --- | --- |
| `PATH` | `/usr/bin:/bin` |
| `HOME` | the per-request temporary home, inside the sweep domain |
| `TMPDIR` | the per-request temporary directory, inside the sweep domain |
| `LANG`, `LC_ALL` | `C` |
| `TZ` | `UTC` |
| `GIT_TERMINAL_PROMPT` | `0` |
| `GIT_CONFIG_GLOBAL`, `GIT_CONFIG_SYSTEM` | `/dev/null` |
| `GIT_CONFIG_NOSYSTEM` | `1` |
| `GIT_ALLOW_PROTOCOL` | `https` |
| `GIT_ASKPASS`, `SSH_ASKPASS` | the empty string |
| `GIT_CONFIG_PARAMETERS` | **conditionally permitted, and never set by Studio.** Required absent on processes Studio spawns — the Runtime child and the interpreter. Permitted on processes `git` spawns, where its parsed key/value set must equal the pinned `git` configuration; the comparison is over the parsed set, never the literal string, because git's encoding has changed across releases. It is admitted because `git` propagates `-c` to its transport helpers through this name and no other; scrubbing it would strip `http.followRedirects=false` from the only process that honours it |

Absent by construction, and named because each is a known carrier:
`GIT_CONFIG_COUNT`, `GIT_CONFIG_KEY_*`, `GIT_CONFIG_VALUE_*`, `GIT_DIR`,
`GIT_SSH_COMMAND`, `GIT_PROXY_COMMAND`, `GIT_EXTERNAL_DIFF`,
`GIT_ALTERNATE_OBJECT_DIRECTORIES`, `GIT_EXEC_PATH`, `PYTHONPATH`,
`PYTHONSTARTUP`, `PYTHONHOME`, `AGENTBUNDLE_ALLOW_DEV_SOURCE_AUTHORITY`,
`http_proxy`, `https_proxy`, `ALL_PROXY`, and their case variants.

### The verdict, and how a result is composed

A result has **two orthogonal axes**. Modelling them as one flat enum is what
made `agent-ready` and `version-unverified` simultaneously true and left
`not-agent-ready` unreachable.

**Verdict axis** — what the inspection concluded about the repository. Derived
only from trusted inspector output, never from Studio's own reading:

| Verdict | Derived from | Human label |
| --- | --- | --- |
| `agent-ready` | `workspace_present` true and no `invalid_workspace` finding | Agent-Ready |
| `not-agent-ready` | `workspace_present` false | Not Agent-Ready |
| `no-verdict` | the inspection did not complete, or it completed without determining a verdict from trusted inspector output — including a completed inspection reporting `workspace_present` true with an `invalid_workspace` finding | — |

**Condition axis** — the delivery circumstance the verdict arrives under. `ok`
means nothing qualifies it:

| Condition | Human label | Attention | Degraded | Attribution | Retryable |
| --- | --- | --- | --- | --- | --- |
| `ok` | — | informative | no | — | — |
| `malformed` | Workspace file is malformed | caution | yes | repository | only if the repository changes |
| `inspector-unavailable` | Studio cannot inspect | critical | yes | Studio | yes, once Studio's environment is fixed |
| `source-unavailable` | Repository unreachable | caution | yes | network | yes |
| `source-rate-limited` | Rate limited | caution | yes | network | yes, after the wait window |
| `inspection-stopped` | Inspection stopped | caution | yes | per reason below | per reason below |
| `cancelled` | Cancelled | informative | no | — | yes |
| `incomplete` | Interrupted by restart | caution | yes | Studio | yes |

**Version qualifier** — orthogonal to both axes, and deliberately not a
condition value. A declared version marker Studio cannot confirm is a *caveat
that coexists with a completed result*, not a delivery circumstance that
excludes one; modelling it as a peer of `cancelled` or `malformed` is the same
mistake, one level down, that splitting the verdict and condition axes already
corrected. It is therefore a boolean qualifier carried alongside whatever
verdict and condition were reached.

| Qualifier | Human label | Attention | Degraded | Attribution | Retryable |
| --- | --- | --- | --- | --- | --- |
| `version-unverified` | Version Studio cannot confirm | caution | yes | no party — the confirming evidence does not exist upstream | no — the inspector reads no declared marker |

Because it is orthogonal, the eight condition values are mutually exclusive and
no precedence rule over them is required. A malformed workspace in a repository
that also declares a marker carries the `malformed` condition **and** the
qualifier: the lead is told both that the file is broken and that Studio could
not confirm the version, and neither fact hides the other.

**Composition rule.** The **verdict** owns the primary role — the highest
content-contrast and largest type role on the surface — whenever one was
reached. The **condition** owns the state treatment and its label, rendered at
the secondary role directly above the verdict. When the verdict is
`no-verdict`, the condition takes the primary role because there is nothing
else to show. A verdict rendered under a non-`ok` condition keeps its own
identity treatment at the subordinate role: that is not a generic success
treatment, and AC-0119 does not forbid it.

**Progress and surface states**, which carry no verdict:

| Identifier | Family | Human label | Attention |
| --- | --- | --- | --- |
| `unconnected` | surface | No repository connected | informative |
| `url-rejected` | surface | That URL cannot be used | caution |
| `resolving` | progress | Finding the latest commit | informative |
| `inspecting` | progress | Inspecting <short-sha> | informative |

`resolving` and `inspecting` are separate because they carry separate bounds
and separate diagnostics, and a lead watching a 150-second worst case must be
able to tell which phase is running.

**User-visible states.** The enumerated set every criterion over "each state"
is tested against — AC-0086, AC-0087, AC-0121, AC-0122, AC-0128 and the
design-system durable output: the eleven rows below, being the union of the
*Condition axis* and *Progress and surface states* tables above minus `ok`.
`ok` is excluded because it is the *absence* of condition chrome and so has no
label, icon or announcement to carry; when the condition is `ok` the surface
shows the verdict alone. Verdicts are the orthogonal axis and are not members
either; their identity treatment is owned by AC-0114, AC-0119 and AC-0120.

| Identifier | Human label | Attention |
| --- | --- | --- |
| `malformed` | Workspace file is malformed | caution |
| `inspector-unavailable` | Studio cannot inspect | critical |
| `source-unavailable` | Repository unreachable | caution |
| `source-rate-limited` | Rate limited | caution |
| `inspection-stopped` | Inspection stopped | caution |
| `cancelled` | Cancelled | informative |
| `incomplete` | Interrupted by restart | caution |
| `unconnected` | No repository connected | informative |
| `url-rejected` | That URL cannot be used | caution |
| `resolving` | Finding the latest commit | informative |
| `inspecting` | Inspecting <short-sha> | informative |

**Reasons for `inspection-stopped`.** The condition label is bare; the reason
is composed with it in both the rendered surface and the announcement. A
diagnostic identifier appears only on the secondary diagnostic surface.

| Terminating criterion | Human reason | Attribution | Retryable |
| --- | --- | --- | --- |
| AC-0008 remote ref outside the charset | The repository's default branch has an unusable name | repository | only if the repository changes |
| AC-0012 `HEAD` mismatch | The downloaded copy did not match the commit Studio asked for | network | yes |
| AC-0034 request identifier mismatch | Studio could not match the result to its request | Studio | yes |
| AC-0036 non-conforming result, Studio-produced structure | Studio could not read the inspection result | Studio | no |
| AC-0036 non-conforming result, repository-derived structure | The repository's content could not be read as a result | repository | only if the repository changes |
| AC-0037 oversized result | The inspection result was too large to read | repository | no |
| AC-0045 inspector inside the target | Studio refused an inspector found inside the repository | repository | no |
| AC-0051 file-count bound | The repository has more files than Studio will download | repository | no |
| AC-0052 resolution timeout | Finding the latest commit took too long | network | yes |
| AC-0053 inspection timeout | Inspecting took too long | Studio | yes |
| AC-0059 parse failure of Studio-produced structure | Studio could not read its own inspection output | Studio | no |
| AC-0059 parse failure of repository-derived structure echoed by the inspector | The repository's content could not be parsed | repository | only if the repository changes |
| AC-0059 parse failure of a repository declaration file | A declaration file in the repository could not be read | repository | only if the repository changes |

A malformed `workspace.toml` is **not** in this table: it is the `malformed`
condition, produced by the inspector's own `invalid_workspace` finding.
AC-0059's repository-file branch covers only a declaration file that is not the
workspace declaration — in this slice, `.agentbundle-state.toml`. AC-0036 and AC-0059
each carry two rows because AC-0039 admits repository-derived content into the trial
result "whether Studio extracted it or the inspector echoed it": which row a failure
takes depends on whether the failing structure is repository-derived, so AC-0093 is
falsifiable against a fixture that reaches them through echoed content. AC-0059's
repository-file branch likewise carries its own row above with a repository
attribution, because AC-0093 forbids presenting a repository-caused failure as
Studio's.

**Rejection reasons for `url-rejected`.** The highest-frequency state in this
slice and the only one a user causes.

| Rejecting criterion | Human reason |
| --- | --- |
| AC-0002 scheme, host, port or trailing dot | Studio connects to public github.com repositories only |
| AC-0003 embedded credentials | Remove the username or token from the URL — Studio never uses credentials |
| AC-0004 extra path segments | Use the repository's main page URL, not a link to a file or branch |
| AC-0006 owner or repository charset | That owner or repository name has characters Studio cannot use |
| AC-0007 requested ref charset | That branch or tag name has characters Studio cannot use |

**What was looked for, and what was found instead.** AC-0089 and AC-0090 draw
their content from the axis that produced the state: for a verdict, the
inspector's `workspace_present` and findings; for a condition, the reason row
above. Neither is improvised per state.

### Resource bounds

Every bound names its mechanism and its owner. Where Studio does not own the
writer, the bound states a measured tolerance rather than an asserted one.

| Bound | Value | Enforced by | Tolerance |
| --- | --- | --- | --- |
| Fetch depth and filter | `--depth 1` | the argument vector. **It bounds history only.** A blob filter is deliberately not used: a partial clone that checks out a working tree lazily refetches every blob at `HEAD`, so it would save round-trip structure rather than bytes, and it would leave the clone a promisor able to initiate an unsupervised fetch later | none — exact, but it bounds neither tree bytes nor file count. The file count is held by the sampler; tree bytes are no longer bounded at all |
| Materialized tree bytes | **none — no byte ceiling is enforced** | nothing. The 250 ms sampler remains, but it enforces the file-count bound and AC-0031's resident-memory bound only | not applicable: this bound was **cut on 2026-09-16**, recorded at `notes/verification-ledger.md#owner-decision-2026-09-16-cut-tree-bytes-bound`. The T5 measurement found the realistic writer materializing 208–448 MiB per 250 ms interval against a 128 MiB pass bar, and a tree at the former 512 MiB ceiling written in two to three samples — so detection landed after the whole budget was spent. Under this row's own prior rule a host measuring higher fails the bound rather than raising it, and the quantity is a property of the host rather than of Studio's design, so any restated ceiling would go stale on the next machine. **Materialization size is still held by four things this slice keeps** — the repository must be fetched over the network, `--depth 1` bounds history, the *Materialized file count* bound of 50,000 files caps the tree's entries, and the 120 s inspection wall-clock ends the attempt — but none of them is a stated byte ceiling Studio enforces. The file-count bound belongs in this list because this row's own second column says the sampler still enforces it; omitting it here is what left this enumeration disagreeing with the accepted residual in *Follow-ons* |
| Materialized file count | 50,000 files | the Runtime supervisor samples the tree every 250 ms during checkout and kills the process group on breach | the file count written in one 250 ms interval, recorded at T5, and required to come in at or below 5,000 on the same terms, plus the same recorded sample-duration term |
| Resolution wall-clock | 30 s | the Runtime kills the resolution subprocess at the deadline | none — an exact deadline Studio owns |
| Inspection wall-clock | 120 s | the Runtime kills the inspection child at the deadline | none — an exact deadline Studio owns |
| Runtime process group | the Runtime child is started as a process-group leader, and every bound, cancellation and shutdown signals the group rather than a single process | the Runtime supervisor, per AC-0029 and AC-0030: the child is spawned as a group leader and every deadline, bound breach, cancellation and shutdown signals the group | none — group signalling is exact, and AC-0030 asserts no descendant survives it |
| Child resident memory | 1 GiB, aggregate across the descendant tree | the Runtime supervisor samples every 250 ms and terminates the process group on an observed breach. `setrlimit(RLIMIT_AS)` is not used: it fails outright on the Darwin delivery platform, so asserting a limit was *set* would assert nothing | detection latency of at most one 250 ms interval **plus the measured worst-case duration of the sample itself**, on the same terms as the file-count row: a sampler cannot detect a breach faster than it can complete the read that observes it, and the sample-duration term carries no pass bar because a `ps` read's cost is a property of the host, not of Studio's design. Peak resident memory is **not** bounded: memory grows at RAM speed, so overshoot within one interval is not a quantity this mechanism can hold. The allocation one interval permits is recorded at T5 as an observation, never as a pass bar |
| Trial result bytes | 8 MiB | the Studio Service refuses the NDJSON line while reading, before a full buffer exists | none — exact |
| Child diagnostic bytes | 256 KiB per child | the Studio Service bounds the child's stderr while reading, before a full buffer exists, retaining the leading and trailing halves. Diagnostics are truncated, never refused: refusing would let a repository suppress its own verdict by emitting warnings | none — exact |
| Declared-value read | 2 files, 1 MiB each | the reader checks before each read | none — exact |
| Persisted repository-derived content | 256 KiB per connected source, over every persisted repository-derived value and not one class of them | the persistence layer checks the total before the write and **rejects** a write that would breach it, recording a diagnostic naming the measured size and the bound. Truncating was refused because a truncated repository-derived value still carries AC-0039's provenance marker, so it reads as a complete attributed value when it is not; eviction was refused because a retention order is a primitive this contract has nowhere else | none — exact |
| Progress text cadence | the `resolving` and `inspecting` text channel updates at least every 2 s and no more often than every 1 s | the renderer's progress text channel, per AC-0129, which is deliberately not a live region | none — both bounds are exact, and the lower bound exists to keep the channel perceptibly live under a reduced-motion preference |
| Inadmissible parse keys | `__proto__`, `constructor`, `prototype`, at any depth | the parser guard, per AC-0057, which refuses the key at any depth before any value is produced from the document | none — exact, and the refusal is asserted independently by AC-0143 |
| Parse nesting depth | 64 levels | no value is produced from a deeper document, checked before the recursion it guards | none — exact |
| Markerless-reclaim age | 1 hour | the sweep refuses to reclaim a candidate younger than this on **either** age-gated limb of AC-0081 — a marker the first limb cannot decide on, whether it cannot be parsed, does not yield both a process identity and a start time, or carries a liveness token this build cannot compare, or no marker with no entries. The maximum inspection window is 150 s — 30 s resolution plus 120 s inspection — so the threshold carries roughly twenty-four times that headroom | none — exact |
| Live in-flight sweep-domain occupancy | one per-request state root's bounds | the Studio Service admits at most one trial inspection in flight, per AC-0154 | none — derived from the admission bound and the per-request bounds rather than sampled, and the value term is the file-count bound the sampler enforces over the `tree` child, no byte ceiling now being enforced: the per-request `HOME` and `TMPDIR` carry no byte or file bound and are outside this row. **It bounds live in-flight occupancy only**: a root left unreclaimed by the accepted residual in *Follow-ons* is outside it, so aggregate on-disk occupancy at a point in time can exceed one root's bounds by that residue |
| Parse alias expansion | 100 aliases | the YAML parser's alias guard; inapplicable to TOML and JSON, which have no aliases. **No YAML parse exists in this slice**; the value is retained as the bound the slice that first parses YAML must adopt | none — exact |

The fetch-depth bound is the primary control, and after the byte ceiling was cut
it is the only control bounding **how many bytes** a repository can bring; the
file count remains bounded by the sampler, per the *Materialized file count* row.
Bounding the input is why that row's tolerance can be small enough to state
honestly, and why cutting the byte ceiling leaves a bounded gap rather than an
open one.

## Trial Runtime authorization

Authorized 2026-09-13 by the maintainer operating this session. **Expires at the
earliest of:** the Stage 2 gate-result ADR; fourteen calendar days after this
specification's implementation is merged; or the start of implementation for
the next Runtime-dependent initiative. **On expiry:** deleted or rewritten.

## Durable Outputs

| Semantic role | Applicability | Destination | Owner | Expected evidence | Closeout condition |
| --- | --- | --- | --- | --- | --- |
| Current architecture | Applicable — first connected-source path and first child-process product boundary | `docs/architecture/overview.md` | maintainers | Overview names the connection surface and the trial topology | Matches shipped component set |
| Product state vocabulary | Applicable — a fifth state family is introduced | `docs/product/design-system.md` | maintainers | The inspection family, its members from the *User-visible states* table, and the ΔE2000 hue-separation value recorded | Family and separation value present, distinct from the four existing families |
| Interface compatibility | Applicable — the public protocol gains methods | `contracts/jsonschema/studio-protocol-v1.schema.json` | maintainers, via the protocol approval path | Canonical schema and Zod mirror agree | Parity test green for all added methods |
| Reusable learning | Applicable — Stage 2 requires it | Evidence note (see Canonical values) | maintainers | Note exists, linked from this spec | Records all three criteria's observations without a verdict |
| Current product truth | Applicable | `docs/product/changelog.md` | maintainers | Entry naming the delivered capability | Present at ship |
| Decision rationale | **Not applicable** | — | — | — | The Stage 2 gate-result ADR is follow-on item 8 |
| User documentation | **Blocked, owner-decided** | would be `guides/` | maintainers | — | Recorded Ready gap on the brief, 2026-09-13 |

## Boundaries

### Always do

- Resolve the source to an exact commit SHA before any inspection begins, and
  show that SHA wherever the answer is shown.
- Construct the URL handed to `git` from the canonical identity, never from the
  submitted string.
- Launch every subprocess with an absolute executable path and an argument
  array. On a `git` argument vector, and only there, also carry the complete
  pinned `git` configuration and place attacker-influenced operands after `--`,
  matching the scope AC-0022 and AC-0021 state: the *Permitted executables* row
  admits non-`git` executables — an interpreter probe, `/bin/ps`, and the
  Runtime's own Node process. The first two carry no such configuration and no
  attacker-influenced operand. **The Node vector is exempt on a different
  ground**: it does carry the pinned `git` configuration, but as a `--plan`
  payload the Runtime later applies to the `git` vectors it builds — delivered
  rather than applied to itself — so there is nothing for this rail to place
  after `--` on the Node vector. The Node process is named here because the row
  admits it and the earlier two-item enumeration did not.
- Run inspection in a child process of the Studio Service, never in-process.
- Treat every byte originating from the inspected repository as data, and carry
  its provenance in the protocol and persisted representations.
- Confine every filesystem operation on per-request state — read, write and
  removal — to the per-request state root, and confine every repository-content
  read within it to the materialization root.
- Validate the trial result in full before normalizing or persisting any part.

### Ask first

- Any change to `contracts/jsonschema/studio-protocol-v1.schema.json`.
- Any new SQLite migration beyond the one this spec's persistence needs.
- Any widening of the permitted read surface, the environment allowlist, the
  pinned `git` configuration, the permitted executables, the interpreter search
  list, or the resource bounds — all in *Canonical values*.

### Never do

- Create `apps/workspace-runtime`, `packages/runtime-protocol`, or
  `contracts/jsonschema/runtime`.
- Create a new top-level directory, application, package, or schema root.
- Export a reusable Runtime API from the trial, or import the trial's code from
  any module outside the trial code root.
- Accept, store, transmit, or offer a credential, token, or private-repository
  path — including as a mitigation for rate limiting.
- Execute, import, or evaluate anything sourced from the inspected repository.
- Derive blocked-versus-ready state, item classification, queue semantics,
  lifecycle transitions, or next-action routing from raw repository files.
- Use a non-originated value (see *Canonical values*) as a URL, resource
  reference, or navigation target on any surface.
- Write to the inspected source, or retain a managed clone.
- Read, from the Studio Service process, anything under a materialization root.

## Testing Strategy

Every criterion appears in exactly one group below, named in full.

- **URL, host, charset, ref, redirect and target construction (AC-0001, AC-0002, AC-0003, AC-0004, AC-0005, AC-0006, AC-0007, AC-0008, AC-0009, AC-0010)** — TDD, with each redirect phase asserted as the pinned configuration present on the argument vector the git client receives; the client's own refusal is observed by the manual smoke instead, per AC-0009. Closed accept and reject sets, each mapped to its reason row.
- **Revision resolution and verification (AC-0011, AC-0012, AC-0013, AC-0014)** — TDD, against an injected source transport. Deterministic transitions; no added test uses the network.
- **Process boundary, argument vector, environment and process group (AC-0015, AC-0016, AC-0017, AC-0018, AC-0019, AC-0020, AC-0021, AC-0022, AC-0023, AC-0024, AC-0025, AC-0026, AC-0027, AC-0028, AC-0029, AC-0030, AC-0031, AC-0154)** — Goal-based check, exercised by an integration test. Process identity, argv shape, the two environment partitions, the descendant executable set, group signalling and observed memory termination are all observable from the parent. **Three observations in this group are not automatically observable and are Visual / manual QA instead**, recorded by T13's smoke with the build revision: AC-0024's helper environment, AC-0025's admission of the transport helper, and AC-0030's transport-helper instance. Each requires an https endpoint AC-0148 forbids, so each travels the route AC-0009's group already uses.
- **Provisional contract validation and provenance (AC-0032, AC-0033, AC-0034, AC-0035, AC-0036, AC-0037, AC-0038, AC-0039, AC-0040, AC-0041, AC-0042, AC-0155)** — TDD. Naming, correlation, full-shape validation, bounded reads, origin-based provenance and seam isolation are schema- and structure-shaped invariants.
- **Inspector pin, interpreter resolution and supervised bounds (AC-0043, AC-0044, AC-0045, AC-0046, AC-0047, AC-0048, AC-0049, AC-0051, AC-0052, AC-0053)** — TDD, exercised by an integration test. Pin matching, search-list walking and supervisor-killed bounds need a real child and real fixtures.
- **Reading declared values, parsing and non-derivation (AC-0054, AC-0055, AC-0056, AC-0057, AC-0058, AC-0059, AC-0060)** — TDD. Read-surface confinement, depth-bounded non-executing parse, inadmissible-key refusal and the no-derivation rule are invariants over the result shape.
- **The verdict function and version honesty (AC-0061, AC-0062, AC-0063, AC-0064, AC-0065, AC-0066, AC-0067, AC-0068)** — TDD. A derivation from inspector output crossed with a condition, both enumerated in the composition tables.
- **Path confinement and materialization safety (AC-0069, AC-0070, AC-0071, AC-0072, AC-0073, AC-0074, AC-0075, AC-0076)** — TDD, exercised by an integration test. Link neutralization, mkdtemp inside a verified domain and segment-boundary containment need a real checkout; reader refusals are unit-level.
- **Disposal, cancellation and sweep (AC-0077, AC-0078, AC-0079, AC-0080, AC-0081, AC-0082, AC-0083, AC-0084, AC-0085, AC-0159)** — TDD, exercised by an integration test. Group-signalled lifecycle transitions and the marker-based sweep predicate. **AC-0159 is here rather than with the environment group** because what it constrains is the byte equality AC-0081's first limb depends on, not the trial tree's environment. Two cases carry it: one asserts the contents of both rendering environments, the other forces a non-UTC zone into the rendering process and compares the reader against an explicitly pinned rendering. Together they fail when either side loses the pinned values, and when the **Service-side** call site stops using the pinned set. Two limits: the Runtime-side call site is not bound by either case, and the forcing case requires a host whose zone database resolves the forced zone.
- **Honest states, routing and attribution (AC-0086, AC-0087, AC-0088, AC-0089, AC-0090, AC-0091, AC-0092, AC-0093, AC-0094, AC-0095, AC-0096, AC-0097, AC-0098, AC-0099)** — TDD. Each state, reason and rejection carries its own observable drawn from the composition tables.
- **Persistence across restart (AC-0100, AC-0101, AC-0102, AC-0103, AC-0104)** — TDD, integration against real migrations and a reopened temporary database. Restart survival is only provable across a reopen boundary.
- **Desktop surface and rendering (AC-0105, AC-0106, AC-0107, AC-0108, AC-0109, AC-0110, AC-0111, AC-0112, AC-0113, AC-0115, AC-0116, AC-0117, AC-0118, AC-0119, AC-0157)** — TDD, renderer tests through the typed host boundary. State presence, form rejection with programmatic association, literal rendering, sink refusal and diagnostic layering are assertable in the renderer.
- **Accessibility floor (AC-0120, AC-0121, AC-0122, AC-0123, AC-0124, AC-0125, AC-0126, AC-0127, AC-0128, AC-0158)** — TDD, renderer tests through the typed host boundary. Computed ΔE2000 against the enumerated hue set, contrast pairings, keyboard operability, the provenance-branching focus path, heading structure and one announcement per transition are computable or assertable.
- **First-scan role, reduced motion, reflow and target size (AC-0114, AC-0129, AC-0130, AC-0131, AC-0132)** — Visual / manual QA. A recorded gesture and an observed outcome in the verification ledger; these need the built application.
- **Hostile-repository proofs and their positive controls (AC-0133, AC-0134, AC-0135, AC-0136, AC-0137, AC-0138, AC-0139, AC-0140, AC-0141, AC-0142, AC-0143, AC-0144, AC-0145, AC-0146, AC-0147)** — TDD, integration against hostile fixtures. Each guardrail property is falsifiable and each carries a positive control at its own observation level.
- **Suite-level properties and Stage 2 evidence (AC-0148, AC-0149, AC-0150, AC-0151, AC-0152, AC-0153)** — Goal-based check, plus one manual evidence pass. Suite properties verified by running it; the note records observed behaviour.

### Criteria-count screening

157 criteria, numbered AC-0001 to AC-0159 with **two numbers deliberately unused — the one between AC-0155 and AC-0157, and the one between AC-0049 and AC-0051**. The first held a live-orphan signalling obligation cut rather than repaired in round 3. The second held the materialized tree-bytes kill, cut on 2026-09-16 when the T5 measurement showed the bound unenforceable at the sampler's cadence. Neither is reused, and neither is named in its retired form, so the review records that cite them stay readable without resolving to a criterion that no longer exists. The trust and process-boundary half is roughly ninety and is
irreducible. The user-facing half now derives from three composition tables —
verdict, condition, and the reason and rejection maps — rather than from prose
per criterion, which is what six rounds showed to be the actual defect source.
No repository-local check proves citation integrity; a session-local script
assisted authoring and has known false negatives.

## Acceptance Criteria

### Source input and identity

- [x] **AC-0001.** A user submits one public GitHub repository URL and Studio records a canonical source identity of owner and repository name for it.
- [x] **AC-0002.** Studio accepts a URL only when its scheme and host equal the permitted values in *Canonical values*, comparing the host after ASCII lowercasing and rejecting any port, any trailing dot, and any host that merely ends with the permitted host.
- [x] **AC-0003.** Studio rejects a URL carrying embedded credentials, with a reason distinct from every other rejection.
- [x] **AC-0004.** Studio rejects a URL whose path carries more than the owner and repository segments, with a reason distinct from every other rejection.
- [x] **AC-0005.** Studio discards any query string and any fragment before deriving identity.
- [x] **AC-0006.** Studio rejects an owner or repository name outside the owner/repository charset in *Canonical values*.
- [x] **AC-0007.** Studio rejects a requested ref outside the ref charset in *Canonical values*.
- [x] **AC-0008.** Studio applies the ref charset to the ref it resolves from the remote as well as to a user-supplied ref.
- [x] **AC-0009.** Every `git` argument vector used for resolution and for materialization carries `http.followRedirects=false` from the pinned `git` configuration, which is what refuses every redirect on both phases — including a same-host redirect, so a renamed repository fails rather than silently following. **The automated obligation is the presence of that configuration on both phases**, and it is falsifiable by dropping the key. Observing a real client refuse a redirect requires an HTTP exchange that AC-0148 forbids: `GIT_ALLOW_PROTOCOL=https` refuses an http stand-in, and an https stand-in against a test-started endpoint requires a TLS trust term the pinned configuration deliberately does not carry. That observation is therefore recorded by the manual smoke in *Testing Strategy*, and this criterion claims no automated observation of client behaviour.
- [x] **AC-0010.** The URL on every `git` argument vector is constructed from the canonical identity AC-0001 recorded; the submitted string never reaches a transport.

### Exact revision

- [x] **AC-0011.** Before inspection begins, Studio resolves the repository's default branch or an explicitly supported ref to an exact 40-character commit SHA.
- [ ] **AC-0012.** Studio verifies that the materialized working tree's `HEAD` equals the resolved SHA, performed by the Runtime inside the materialization root.
- [x] **AC-0013.** The requested ref and the resolved SHA are stored as separate values, and a branch name never occupies the resolved-SHA value.
- [ ] **AC-0014.** The exact inspected SHA is shown wherever the verdict is shown; an abbreviated form may be displayed provided the exact value is available on demand and can be copied.

### Process boundary, argument vector and environment

- [x] **AC-0015.** Inspection runs in a child process of the Studio Service, and the child reports a process identifier different from the Studio Service's own.
- [x] **AC-0016.** The Studio Service process opens no path under a materialization root.
- [x] **AC-0017.** The trial Runtime receives no Studio SQLite handle, no database path, and no Studio credential in its arguments or environment.
- [x] **AC-0018.** The trial Runtime writes protocol messages only to stdout and diagnostics only to stderr.
- [x] **AC-0019.** No process in the Runtime's descendant tree writes to the Runtime's protocol stdout.
- [ ] **AC-0020.** Every subprocess Studio launches uses an absolute executable path and an argument array; no subprocess is launched from a concatenated shell string.
- [ ] **AC-0021.** Every attacker-influenced operand on a `git` argument vector is preceded by an end-of-options `--` marker.
- [ ] **AC-0022.** Every `git` argument vector carries the complete pinned `git` configuration in *Canonical values*.
- [x] **AC-0023.** **The Runtime child and every process in its descendant tree** carries exactly the unconditional names in the *Environment allowlist* at their stated values, and no `GIT_CONFIG_PARAMETERS`. The scope is the trial tree, matching the *Environment allowlist* preamble: it is where repository-influenced data is **executed against**, and the Studio Service's own parent-side process-tree observer is outside this obligation. The ground is not that the observer handles no repository-influenced data — it parses `ps` columns carrying the owner, repository, ref and resolved revision — but that it executes none of it and its inputs are charset-confined: the revision is forty lowercase hex characters and the ref charset excludes every ASCII control character, so nothing it reads can carry a control sequence into the observer.
- [ ] **AC-0024.** Every process `git` spawns carries those same names plus `GIT_CONFIG_PARAMETERS`, whose parsed key/value set equals the pinned `git` configuration; wherever that set is compared, the comparison is over the parsed set, never the literal encoding. **The automated obligation is that Studio constructs no other environment**, asserted exhaustively over every process Studio's own code starts **within the trial tree** — the Runtime child and its descendants, the same scope AC-0023 and AC-0025's second leg carry. The Studio Service's own parent-side process-tree observation is outside it, for the reason AC-0023 states. Observing a helper's own environment requires an https transport — `GIT_ALLOW_PROTOCOL=https` refuses the `file` transport, so `git` re-executes a helper only over a transport, and such an endpoint is a network surface AC-0148 forbids. That observation is therefore recorded by the manual smoke in *Testing Strategy*, and this criterion claims no automated observation of a helper's environment.
- [x] **AC-0159.** Every rendering of the liveness token AC-0080 records and AC-0081's first limb compares — the Runtime's, and the Service's — carries the same values for the three determinism names: `LANG=C`, `LC_ALL=C`, `TZ=UTC`. **The obligation is over those three values, not over the whole name set**, because the two sides are governed by different allowlists: the Runtime's rendering runs inside the trial tree under AC-0023's thirteen names, and requiring one identical set would put this criterion in conflict with that one. Each side's environment is **built closed**, in the sense each construction actually takes. The Service builds its rendering environment from nothing. The Runtime's is built in two hops: the supervisor constructs the child's environment from nothing, and the child re-projects those names to each descendant it spawns, so a descendant's values originate in the supervisor's construction rather than in the machine. Neither side reads any of the three from its host. The obligation is stated separately from AC-0023 because AC-0023's scope is the trial tree and one of the two renderings happens outside it, so no trial-tree obligation can reach both. **A rendering environment pinned on one side only is a defect, not a partial improvement**: it turns a byte comparison that agreed on every host into one that disagrees on every host whose zone is not the pin, and AC-0081's first limb answers a disagreement by reclaiming.
- [ ] **AC-0025.** Every executable started anywhere in the spawned process tree is one the *Permitted executables* row admits, asserted on two legs: the descendant set sampled from the parent over the live group, **and** the exhaustive record of every spawn Studio's own code performs **within that tree**, on the same trial-tree scope AC-0023 carries. The sampled leg cannot prove that nothing ran between two samples, and it does not reach a transport helper, because producing one requires an https endpoint AC-0148 forbids; the helper's admission is recorded by the manual smoke in *Testing Strategy*.
- [x] **AC-0026.** `git` is resolved by absolute path, verified by the identity check in *Canonical values*, and its exec-path directory recorded once and not re-read at a later spawn.
- [x] **AC-0027.** The Python interpreter is resolved by walking the enumerated search list in *Canonical values* in order, never through `PATH`.
- [ ] **AC-0028.** Both identity probes run under the pinned environment, so no ambient variable can redirect what is resolved or recorded.
- [ ] **AC-0029.** The Runtime child is started as a process-group leader, and every deadline, bound breach, cancellation and shutdown signals the whole group.
- [ ] **AC-0030.** No descendant survives a deadline, a bound breach, a cancellation or an ordinary shutdown. A transport helper holding an open connection is the hardest instance and is not automatically observable, because producing one requires an https endpoint AC-0148 forbids; it is recorded by the manual smoke in *Testing Strategy*.
- [x] **AC-0031.** Aggregate resident memory across the Runtime's group crossing the child resident memory bound in *Canonical values* is observed to be terminated, within one sampling interval of the breach **plus the sample's own duration**, on the same terms as the file-count bound. The read that observes the breach signals the group with no interval of its own, which is the part Studio owns; the gap from the earliest breaching read to the acting one is that read's cost plus sampler scheduling, which the host owns. The criterion claims observed termination and bounded detection latency; it does not claim a bound on peak resident memory, which the sampler cannot reach.

- [x] **AC-0154.** The Studio Service holds an outer liveness obligation over the trial Runtime child: when the child terminates for any reason other than a completed response, **or neither responds nor terminates within a Service-held bound on the total in-flight window**, the Service signals the child's process group, so no descendant outlives the supervisor that bounded it and a wedged child cannot hold its materialization, its transport connection and its `inspecting` state until a person cancels. The detection mechanism and any interval are implementation choices. The Service additionally admits at most one trial inspection in flight, refusing a second concurrent request while one is running, which bounds **live in-flight** sweep-domain occupancy at one per-request state root's bounds by arithmetic rather than by measurement, and deliberately does not bound aggregate on-disk occupancy, which the *Live in-flight sweep-domain occupancy* row states can exceed that by any unreclaimed residue. AC-0111's in-flight form disable cannot carry this obligation, because it binds the renderer and a protocol client could otherwise issue concurrent requests. The refusal is a protocol-level error carrying no user-visible state: AC-0111 prevents the renderer from reaching this path, so only a protocol client can, and the refusal is deliberately not a member of the *User-visible states* table.

### Provisional contract

- [ ] **AC-0032.** The provisional contract is named as *Canonical values* states, and a request carrying any other contract name is refused.
- [x] **AC-0033.** The Studio Service mints each request identifier within the charset in *Canonical values*, and a request identifier is never taken from client input.
- [ ] **AC-0034.** A result whose request identifier does not match the request is refused.
- [ ] **AC-0035.** The trial result is validated in full against the trial contract before any part of it is normalized or persisted.
- [ ] **AC-0036.** A trial result that is well-named and well-identified but does not conform is refused with a distinct diagnostic and is not partially consumed.
- [ ] **AC-0037.** A trial result exceeding the result-bytes bound is refused while being read, before a full buffer exists.
- [ ] **AC-0038.** The trial result reports the resolved SHA, an inspection status, the inspector's diagnostics, the declared workspace version marker or its absence, and a removal outcome.
- [ ] **AC-0039.** Every repository-derived value in the trial result carries a provenance marker, where repository-derived means any value whose content originates in the inspected repository, whether Studio extracted it or the inspector echoed it.
- [x] **AC-0040.** The provenance marker survives normalization into the persisted representation.
- [x] **AC-0041.** The Studio-Service half of the enrichment seam lives in one named module that no non-seam surface imports, so removing the seam requires editing no code outside it.
- [x] **AC-0042.** The northbound request contains no field whose value is a local filesystem path.

- [ ] **AC-0155.** Diagnostic bytes the Studio Service accepts from one child are bounded by the child-diagnostic-bytes value in *Canonical values*, enforced while reading and before a full buffer exists. On breach the Service retains the leading and trailing halves, records an explicit elision marker naming the discarded byte count, and the inspection result is unaffected.

### Trusted inspector

- [ ] **AC-0043.** Studio records the trusted inspector's resolved path, pack name, pack version and the SHA-256 of both inspector files with each inspection.
- [ ] **AC-0044.** An inspector whose pack name, version or file digests do not match the pin in *Canonical values* yields `inspector-unavailable` naming the mismatch, rather than being used.
- [ ] **AC-0045.** Studio refuses an inspector whose resolved real path lies inside the materialization root.
- [ ] **AC-0046.** Studio verifies the resolved Python interpreter reports version 3.11 or later before using it to inspect.
- [x] **AC-0047.** When no trusted inspector is available, the result is `inspector-unavailable` and no repository-projected skill is used as a fallback.
- [ ] **AC-0048.** When no conforming Python interpreter is found, the result is `inspector-unavailable` and names the interpreter requirement.
- [x] **AC-0049.** Submodule content is neither fetched nor traversed.
- [ ] **AC-0051.** Materialization is killed by the Runtime supervisor when a sample observes the file-count bound crossed, within the tolerance the *Materialized file count* row in *Canonical values* records — the file count written in one 250 ms interval plus the measured worst-case duration of the sample itself.
- [x] **AC-0052.** Resolution is killed at its exact deadline with its own diagnostic.
- [x] **AC-0053.** Inspection is killed at its exact deadline with its own diagnostic.

### Reading the version marker

- [ ] **AC-0054.** The trial reads only the permitted read surface in *Canonical values*, and a read outside it is refused. This binds the Runtime's declared-value reader; the trusted inspector's own traversal is governed by AC-0069 and AC-0073 for links and by the wall-clock and memory bounds for everything else.
- [ ] **AC-0055.** The declared-value read is bounded by the file-count and byte values in *Canonical values*, checked before reading.
- [ ] **AC-0056.** Every parse of attacker-influenced structure crossing into a Studio process — the declared-value read, the inspector's output, and the northbound result line — yields no value from a document exceeding the parse nesting-depth bound, with the bound enforced before the recursion it guards.
- [ ] **AC-0057.** No parse yields a value under any key in the inadmissible-parse-keys set in *Canonical values*, at any depth, and every parsed document is materialized without an inherited prototype, and normalization copies only criterion-named fields onto freshly constructed objects rather than consuming a parsed object's shape.
- [x] **AC-0058.** Where a YAML parse exists, it admits no custom tag and enforces the alias-expansion bound. **No YAML parse exists in this slice** — the permitted read surface is TOML and the two machine surfaces are JSON — so the clause is inapplicable here, as it is to TOML and JSON, which have neither. It binds the slice that first parses YAML.
- [ ] **AC-0059.** A parse that fails or breaches a bound yields a distinct diagnostic and no extracted value, contributes nothing partially parsed, and routes to `inspection-stopped` with the reason and attribution the *Reasons for `inspection-stopped`* table assigns.
- [ ] **AC-0060.** No displayed value is a lifecycle meaning — blocked-versus-ready state, item classification, queue semantics, a lifecycle transition, or next-action routing — that no trusted inspector output field supports.

### Version honesty and the verdict

- [x] **AC-0061.** The verdict is derived only from trusted inspector output, by the mapping in *The verdict, and how a result is composed*: `workspace_present` false yields `not-agent-ready`; `workspace_present` true with no `invalid_workspace` finding yields `agent-ready`; an inspection that did not complete yields `no-verdict`; and a completed inspection with `workspace_present` true and an `invalid_workspace` finding also yields `no-verdict`, so the mapping is total over the `workspace_present` × `invalid_workspace` product and no completed inspection falls through every row.
- [x] **AC-0062.** A verdict is never derived from a value Studio read itself.
- [x] **AC-0063.** An `invalid_workspace` finding from the inspector yields the `malformed` condition, and the `malformed` condition is produced by nothing else.
- [ ] **AC-0064.** A repository declaring no workspace version marker carries no `version-unverified` qualifier, and its result reports that it declares no version. Like AC-0065, the qualifier clause asserts nothing about the condition value. Separately, and on the condition axis: a completed inspection that raises no condition-bearing finding carries the `ok` condition, which is what `ok` means — nothing qualifies the result.
- [ ] **AC-0065.** A repository declaring a workspace version marker in either permitted file carries the `version-unverified` qualifier, whatever its verdict and whatever its condition. The qualifier is orthogonal: it never replaces, suppresses or is suppressed by a condition value.
- [x] **AC-0066.** A result carrying the `version-unverified` qualifier states that Studio cannot confirm the inspection covers the declared version, composed with — never in place of — whatever verdict and condition the result reached. The rendered role each element takes is owned solely by AC-0114 and the composition rule.
- [ ] **AC-0067.** Studio reports the target's declared version marker and the version the trusted inspector reports for its own output contract as two separate observed values.
- [x] **AC-0068.** No value is compared against a version set that neither the target nor the inspector declared.

### Path confinement and materialization safety

- [ ] **AC-0069.** Materialization produces a tree in which no path under the materialization root is a symbolic link: each link in the source becomes a regular file holding its target string.
- [x] **AC-0070.** The per-request state root is created per request by `mkdtemp` at mode `0700` inside the sweep domain, and no component below the fixed parent is predictable. The materialization root is its `tree` child, created at mode `0700`, and the ownership marker is a sibling of that child rather than a descendant of it.
- [x] **AC-0071.** The sweep domain path reaches the Runtime as a named argument on its argument vector, not inferred from `TMPDIR` or any other variable; AC-0042's no-filesystem-path rule scopes to the request message, not the argument vector.
- [x] **AC-0072.** The sweep domain is verified on every use as an existing directory, not a link, owned by the current user at mode `0700`, and the Runtime fails closed rather than proceeding when it is not.
- [x] **AC-0073.** No byte of repository content is read from a file that is not, at the moment of reading, inside the materialization root, with containment compared against the file's **resolved real path** on a path-segment boundary, so a sibling whose name extends the root is outside it and no unresolved link reaches inside it. The criterion binds repository-content reads; the Studio-authored ownership marker AC-0081 reads is a sibling of the materialization root rather than repository content, and is admissible under AC-0081's own read discipline.
- [x] **AC-0074.** Every read of the materialization by a reader Studio authors refuses a non-regular file, including a device file, a FIFO, and a socket.
- [ ] **AC-0075.** Every read of the materialization by a reader Studio authors refuses a file exceeding the single-file bound, checked before the read.
- [x] **AC-0076.** Removal refuses to descend a symbolic link — at every level it traverses, not only at the candidate it begins from — and removes nothing outside the per-request state root, which is the unit AC-0079 removes. The materialization root remains the inner bound on repository-content reads, per AC-0073.

### Disposal and cancellation

- [x] **AC-0077.** Each inspection runs in a process that is terminated after its response.
- [x] **AC-0078.** No materialization or data from one request is readable by a later request.
- [x] **AC-0079.** The trial Runtime removes its per-request state root — which contains its materialization, its per-request home, its per-request temporary directory and its ownership marker — on success, on failure, and on receiving a termination signal. One removal of one root discharges all four.
- [ ] **AC-0080.** Each per-request state root carries a Runtime-written ownership marker naming the owning process and its start time. The marker is written by a **single creating write — created exclusively and written once, so no staging child ever exists — before any other child of the state root**, and is the **last child removed** when the root is removed, so no state root holding any content is ever unmarked. A crash inside that single write leaves a **partial marker rather than an unmarked root**, and AC-0081's second limb reclaims it by age; this is why that limb exists rather than being vestigial.

  **The property of the encoding that makes that total, stated once here rather than left implicit: every proper prefix of the single creating write either fails to yield both a process identity and a start time, or yields exactly the complete marker's values.** It has to be stated disjunctively, because the simpler claim that no proper prefix parses is false — the prefix dropping only the trailing newline parses to the complete object, and cannot misstate ownership. The encoding that realizes it is single-line JSON whose closing brace is written last, in one write.

  **Two crash outcomes are therefore reachable**: an unparseable prefix, which is AC-0081's second-limb input, and that single parsing prefix, which carries the complete values and is protected by the first limb like any complete marker. **A marker that parses but yields no start time is unreachable under this encoding**, because the object's closing brace is written last, so any truncation removing the start time also removes the brace and the prefix does not parse. **Round 35 corrected this ground**, which had read "the start time is written last" — true until the marker gained the rendering-convention field after it, and never the property the claim needed. AC-0081's second limb still admits that form and keeps the clause, because an encoding change would make it reachable again. `apps/studio-service/src/trials/connect-and-orient-runtime/per-request-state-root.test.ts` classifies every proper prefix of a real marker write and **fails if any prefix parses without yielding both values** — which is what makes the unreachability falsifiable rather than asserted. The marker is a direct child of the state root and a sibling of the materialization root, never inside it, so no repository content can create, overwrite or forge it. An *empty* unmarked state root remains possible, because `mkdtemp` creates the directory before the marker is written; AC-0081's third limb reclaims it.
- [x] **AC-0081.** A Runtime sweep enumerates only direct children of the sweep domain, and removes a candidate only when the entry itself — observed without following a link — is a directory owned by the current user at mode `0700`, and one of three limbs holds: it carries a parseable marker whose recorded process and start time do not match a live process; it carries a marker the first limb cannot decide on — one that **cannot be parsed, that does not yield both a process identity and a start time, or whose liveness token this build cannot compare** — and was last modified longer ago than the markerless-reclaim age; or it carries no marker, contains no entries, and was last modified longer ago than that age. Every age this criterion reads is the **candidate directory's own modification time**, never the marker's. The marker read that decides the first two limbs refuses to follow a link and refuses a non-regular file, the same discipline the candidate entry carries. **Where an input the limb under evaluation actually needs cannot be read or compared — a modification time that cannot be read, a clock observed to have moved, or, for the first limb alone, a liveness comparison that cannot be made over a marker that does yield both values — the sweep declines to reclaim**. A marker that does not yield both a process identity and a start time is **not** a declined liveness comparison: it is the second limb's input, and that limb reclaims it on its age gate. **A marker whose liveness token was rendered under a different convention than this build renders, and whose named process is live, is a comparison that cannot be made**, and declines on the first limb. The token is a wall-clock string, so its bytes depend on the rendering environment AC-0159 pins; a marker written before that pin, or under a later one, would otherwise compare unequal against a live process and be reclaimed by the first limb, which carries no age gate. Every marker therefore records the convention its token was rendered under, and a reader compares tokens only across markers recording the one it renders. Falling through to the second limb is **not** the safe alternative for a live process: that limb reclaims on age, so the state root would still be destroyed, only later. **The decline is conditioned on liveness and on age, so that retention stays bounded**, which is what the clause above requires. Liveness alone is not enough. A marker's identity is its process identity **and** its start time, and the start time is exactly what an incomparable token cannot supply, so a liveness read establishes only that some process holds the recorded **pid** — not that it is the process the marker names. A recycled pid would hold such a root for its new holder's lifetime. The decline therefore also requires the candidate to be younger than the markerless-reclaim age. **No Runtime can legitimately be older**: the Runtime arms a timer that signals its whole process group at the inspection deadline, so it cannot outlive the 150 s maximum window, against which that age carries roughly twenty-four times the headroom. Past it, whatever holds the pid is not the Runtime this marker names, and the root is the second limb's input like any other abandoned one. An unbounded decline would retain such a root forever, and every future change to the rendering environment would create a fresh population of them. Declining **is** the fail-closed direction AC-0072 already sets for the sweep domain, so uncertainty costs bounded retention and never destroys state still in use; AC-0083 records that decline as its own diagnostic. The second limb is safe because the marker is Studio-authored and sits outside every path repository content reaches — a property of the layout, held by `transfer.fsckObjects=true` refusing a `..`-bearing tree at fetch and by checkout's own invalid-path refusal, both recorded at `notes/verification-ledger.md#probe-2026-09-15-process-boundary` — so an unusable marker is a Studio-side fault rather than an attack, and its second limb is what makes AC-0080's crash-window claim total: a partial marker is either unparseable, which this limb reclaims by age, or the single prefix carrying the complete values, which the first limb protects like any complete marker. The third limb requires emptiness, so it can destroy no repository content and preserve no hostile content. Reclaim is an observe-then-delete pair rather than one indivisible operation, which is safe because `mkdtemp` names are never reused, so a candidate observed reclaimable cannot become live before its removal. On the first limb the marker's start time adds to that, pinning the process as well as its identity; the age-gated limbs rest on the never-reused name and their own age gate, which is what carries the conclusion for a marker whose start time cannot be compared. The same property bounds AC-0076's per-level link refusal against replacement between classification and traversal — which holds even where two Runtimes exist in the sweep domain, as the accepted residual in *Follow-ons* admits. A later slice that writes inside the sweep domain other than through a per-request state root must revisit that condition.
- [x] **AC-0082.** The Studio Service invokes the sweep without itself reading under any materialization root.
- [x] **AC-0083.** A removal failure is recorded as an explicit diagnostic rather than silently discarded, and so is a **declined reclaim**: where AC-0081's fail-closed direction stops the sweep from reclaiming a candidate, the diagnostic names the limb and the class of input that could not be read or compared, and carries no repository-derived payload. Declining is the safe direction, but a control whose failure mode emitted nothing would be unobservable exactly when it matters.
- [ ] **AC-0084.** The Studio Service terminates an in-flight trial Runtime on request, and the terminated inspection is recorded as `cancelled`.
- [ ] **AC-0085.** After an ordinary controlled restart, no trial Runtime process from the prior session remains, and an inspection that was in flight carries the `incomplete` condition, distinct from `cancelled`.

### Honest states

- [ ] **AC-0086.** Studio distinguishes, with a separate user-visible result, every state in the *User-visible states* table.
- [ ] **AC-0087.** Every state renders with the human label and attention level that table assigns.
- [ ] **AC-0088.** Every terminating criterion the *Reasons for `inspection-stopped`* table lists resolves to `inspection-stopped` carrying that table's human reason.
- [ ] **AC-0089.** Each degraded state states what was looked for.
- [ ] **AC-0090.** Each degraded state states what was found instead.
- [ ] **AC-0091.** Each degraded state states whose gap it is, using the attribution the tables assign — and for `inspection-stopped`, the attribution of its specific reason rather than one answer for all of them.
- [ ] **AC-0092.** Each degraded state states whether retrying can change the answer.
- [ ] **AC-0093.** No attribution crosses: a Studio-attributed state is never presented as the repository's fault, and no repository-attributed state is presented as Studio's.
- [ ] **AC-0094.** A non-Agent-Ready repository names what was looked for and not found.
- [ ] **AC-0095.** A non-Agent-Ready repository offers no repository next action, and names the actions the lead does have: retry the inspection, and connect a different repository.
- [ ] **AC-0096.** When the transport reports a signal Studio recognises as rate limiting, the result is `source-rate-limited` rather than `source-unavailable`; when no such signal is available the result is `source-unavailable`.
- [x] **AC-0097.** A `source-rate-limited` result shows the wait window the transport reported, or states that none was reported.
- [ ] **AC-0098.** No state offers, suggests, or links to a credential as a remedy.
- [x] **AC-0099.** A protocol identifier never appears as user-visible copy; it appears only on the secondary diagnostic surface.

### Persistence

- [x] **AC-0100.** After a Studio restart, the canonical repository identity is still readable.
- [x] **AC-0101.** After a Studio restart, the requested ref, the resolved SHA and the inspection time are still readable.
- [ ] **AC-0102.** After a Studio restart, the last verdict and its diagnostics are still readable.
- [ ] **AC-0103.** A restored verdict is shown with the time it was inspected.
- [x] **AC-0104.** Total persisted repository-derived content for one connected source is bounded by the persisted repository-derived content value in *Canonical values*, enforced over every persisted repository-derived value and not one class of them.

### Desktop surface

- [ ] **AC-0105.** The desktop provides a Connect repository action.
- [ ] **AC-0106.** The desktop provides a single-field public GitHub URL form carrying no credential, token, or password input.
- [x] **AC-0107.** Before any repository is connected, the surface renders the `unconnected` state naming what connecting will do.
- [x] **AC-0108.** When a submitted URL is refused before an inspection starts, the form renders `url-rejected` with a human reason, and each pre-submission refusal cause in AC-0002 through AC-0007 maps to a reason distinguishable from every other.
- [x] **AC-0109.** The rejection message is programmatically associated with the URL field, the field is marked invalid, and focus returns to it.
- [x] **AC-0110.** The rejection state renders any echoed user input as literal text, never as markup.
- [x] **AC-0111.** While an inspection is in flight the form is disabled, states that an inspection is running, and points at the cancel affordance.
- [ ] **AC-0112.** The `resolving` and `inspecting` states are separately rendered, `inspecting` shows the resolved SHA, and both offer a cancel affordance.
- [x] **AC-0113.** The `cancelled` state tells the lead they stopped the inspection and how to restart it.
- [ ] **AC-0114.** Where a verdict was reached, the verdict takes the highest content-contrast and largest type role on the surface, per the composition rule; where the verdict is `no-verdict` the condition takes that role instead, also per the composition rule. In both cases the revision identity takes the highest provenance role and is subordinate to whichever holds the primary role.
- [ ] **AC-0115.** Every non-originated value in *Canonical values* renders as literal text, and is announced as literal text where it enters an announcement channel, on every surface and channel this slice introduces: the connect surface, the progress states, the verdict surface, the secondary diagnostic surface, and the polite live region. Embedded HTML, script or command content is never executed. The obligation is stated over the class of value rather than an enumeration of sinks, so adding a surface cannot silently escape it.
- [ ] **AC-0116.** No non-originated value in *Canonical values* is used as a URL, resource reference, or navigation target, and the host window refuses navigation and new-window requests it did not originate. **The prohibition is over rendering and navigation sinks, which is what this criterion's verification reaches.** Whether it also reaches non-rendering sinks — the operands of a spawned transport command — is open, and is tracked at `connect-orient-transport-operand-sink-scope` in `[backlog].open`. It is not settled here because no verification in this slice observes that boundary: the only spawn operand at issue is the remote-resolved revision, gated by AC-0011's exact 40-character commit SHA rule, and the functions that resolve and fetch it have no composing caller yet. The *Non-originated value* row's exclusion of the derived owner and repository rests on the *Owner / repository charset* validation that row names, enforced by AC-0006, not on this criterion. AC-0011's exact-commit-SHA rule governs the resolved revision, which that row deliberately keeps **inside** the class.
- [x] **AC-0117.** Diagnostics carrying no next action, and raw child-process output, are collapsed by default on a secondary surface.
- [ ] **AC-0118.** No surface renders a chart.
- [ ] **AC-0119.** No degraded condition renders a generic success treatment. A verdict rendered at the subordinate role beneath a degraded condition keeps its own identity treatment and does not violate this.

- [ ] **AC-0157.** Each verdict the *Verdict axis* table assigns a human label renders with that label, and differs from every other labelled verdict in label independently of hue. `no-verdict` carries no label and is excluded: the composition rule gives the condition the primary role in that case, matching AC-0158's "where a verdict was reached" framing.

### Quality floor

- [x] **AC-0120.** The inspection family's **identity** hues differ from the identity hues of the artifact, review, execution and attention families by at least the inspection-family hue separation in *Canonical values*, in both themes, measured against the hue set the design-system durable output enumerates. Attention is compared like the other three, and an earlier exclusion of it was removed rather than reconciled: the design-system durable output this criterion measures against enumerates attention as a state family and states that each state combines a label, icon or shape, **and colour**, so the exclusion's stated ground — that attention renders through weight, border and placement rather than a hue — was a claim about that output which the output does not make. The comparison therefore matches the *Inspection-family hue separation* row exactly, and an inspection hue that sat near the critical treatment would read as an alarm, which is the confusion the design system's separation of operational from semantic state exists to prevent.
- [ ] **AC-0121.** Every state differs from every other in icon or shape and in label, independently of hue.
- [x] **AC-0122.** Every state is conveyed by a text label together with a shape or icon, never by hue alone.
- [ ] **AC-0123.** Every text, non-text-indicator and focus-indicator foreground/background pairing on the surfaces this slice introduces — including a reused component placed on a new surface role — meets the WCAG 2.2 AA ratio for its class, 1.4.3 for text and 1.4.11 for non-text.
- [ ] **AC-0124.** Every control this slice introduces is operable by keyboard and shows a focus indicator that does not rely on colour alone.
- [x] **AC-0125.** Every transition this slice introduces routes through one focus-management path, which is the mechanism making coverage exhaustive. The path branches on provenance: a user-initiated transition places focus on a named element; a system-driven transition preserves focus and announces only.
- [x] **AC-0126.** When the in-flight disable removes focus from the URL field, focus moves to the cancel affordance.
- [ ] **AC-0127.** The connect surface and the verdict surface each expose a semantic heading structure, and focus order follows reading order.
- [x] **AC-0128.** Each transition into a user-visible state produces exactly one polite live-region announcement using that state's human label; no transition produces both an exit and an entry announcement.
- [x] **AC-0158.** Each transition into a result produces exactly one polite live-region announcement carrying the verdict's human label where a verdict was reached, and the condition's human label where it was not; no transition produces two announcements for one result.
- [ ] **AC-0129.** Under a reduced-motion preference, state-change motion is omitted while `resolving` and `inspecting` remain perceptibly live through a text channel updating at the progress-text cadence in *Canonical values*, which is not a live region.
- [ ] **AC-0130.** At the minimum supported window width with the longest fixture label, the connect, cancel and retry controls remain reachable, and the focused element is never obscured by the diagnostic surface.
- [ ] **AC-0131.** Pointer targets are at least 24 by 24 CSS pixels.
- [ ] **AC-0132.** The connect and verdict surfaces reflow without two-dimensional scrolling at the WCAG 2.2 1.4.10 equivalent viewport, and remain usable at 200 percent text resize.

### Security proofs

- [ ] **AC-0133.** An automated test proves a repository hook does not run during inspection, observed from the parent over the process tree.
- [ ] **AC-0134.** An automated test proves a package script does not run during inspection, observed the same way.
- [ ] **AC-0135.** An automated test proves a projected skill executable does not run during inspection, observed the same way.
- [ ] **AC-0136.** An automated test proves a tree entry whose name is a case-insensitive or Unicode-ignorable variant of `.git` does not overwrite the real `.git` at checkout.
- [ ] **AC-0137.** An automated test proves a `.gitattributes` filter declaration triggers no filter command.
- [ ] **AC-0138.** An automated test proves instruction-shaped text changes no Studio verdict, routing decision, or state.
- [ ] **AC-0139.** An automated test proves an escaping symlink is materialized as a regular file holding its target string.
- [x] **AC-0140.** An automated test proves the reader refuses an escaping path presented directly to it, independently of materialization, including a sibling path whose name extends the root.
- [ ] **AC-0141.** An automated test proves a `.gitmodules` entry causes no submodule fetch or traversal.
- [ ] **AC-0142.** An automated test proves a remote default branch shaped like a `git` option is refused before reaching an argument vector.
- [x] **AC-0143.** An automated test proves a prototype-mutating key in TOML or JSON yields no value under that key. The YAML arm returns with the slice that first parses YAML.
- [x] **AC-0144.** An automated test proves no module is imported from under the materialization root.
- [ ] **AC-0145.** An automated test proves no authorization header is sent on any request the feature makes.
- [ ] **AC-0146.** An automated test proves no credential-bearing value reaches storage or a diagnostic.
- [ ] **AC-0147.** Each of AC-0133 through AC-0146 has a positive control reproducing the same fixture and the same effect with its guard removed, at the same observation level, proving the observation fires.

### Suite-level and evidence

- [ ] **AC-0148.** Every automated test this delivery adds passes with no network access, no credential, no model provider, and no remote service.
- [x] **AC-0149.** The fixture corpus covers every case AC-0133 through AC-0146 and the bounds criteria consume. A case whose effect is observed *at* checkout is present in the source object database before checkout, built by `git` plumbing where an ordinary working-tree write cannot produce it; constructing such a case on disk after checkout would bypass the event its proof observes. Only a case with no checkout-observable effect is constructed on disk after checkout.
- [x] **AC-0150.** Delivery produces the evidence note in *Canonical values*, recording the trial's time box, code location, process topology, message shape, state held by the child, supervision performed, isolation enforced, isolation left as convention, credential and environment boundary, materialization and removal behavior, failure behavior, and the code that must be deleted or rewritten.
- [x] **AC-0151.** The evidence note records, for each thing the Runtime held, whether it needed the Runtime or merely inherited it by holding the materialization.
- [x] **AC-0152.** The evidence note records that AC-0042's no-local-path property and the Runtime placement of supervision were both **mandated by this specification rather than discovered**, so the gate assessor is not handed a constructed answer on Stage 2 criteria 1 or 3.
- [x] **AC-0153.** The evidence note records observations for each of the three Stage 2 criteria and no Pass or Fail verdict for any of them.

## Follow-ons

Unverified residuals and open gaps. A decision that has been taken and verified
lives in the acceptance criteria, not here; the reasoning behind each residual
is in `notes/verification-ledger.md`.

- **No byte ceiling bounds materialization.** Accepted 2026-09-16 at `notes/verification-ledger.md#owner-decision-2026-09-16-cut-tree-bytes-bound`, and revisitable. What still bounds it: the fetch, `--depth 1` on history, the *Materialized file count* bound of 50,000 files, and the 120 s inspection wall-clock. None is a byte ceiling. The corpus keeps its `tree-bytes-bound` fixture, bound to no criterion, so a restored ceiling has its case ready.
- **A Runtime can outlive an abnormal Studio Service death.** Accepted 2026-09-14. AC-0154 holds the outer obligation in the Service, so an abnormal Service death leaves a Runtime holding a marked root: AC-0081's first limb cannot reclaim it while its process is live, and the third limb requires emptiness. Bounded by the Runtime's own 150-second supervised window, then indefinite disk retention of that one materialization.
- **Three transport observations carry no automated guard.** Accepted 2026-09-15 at `notes/verification-ledger.md#owner-decision-2026-09-15-cut-test-network-surface`. AC-0024's helper environment, AC-0025's transport-helper admission and AC-0030's transport-helper instance each need an https endpoint AC-0148 forbids, so T13's manual smoke carries all three. A change that broke the pinned configuration's propagation to the helper while leaving the argument vector intact would reach only that smoke.
- **The user guide is an open Ready gap** in `docs/product/briefs/connect-and-orient.md`, left open by owner decision 2026-09-13.
- **The trial Runtime's removal obligation on expiry** has no owner in this slice. Recorded as `workspace.toml [backlog].open` entry `connect-orient-trial-runtime-removal`.
- **The counterpart inspection contract does not exist.** It is gated behind RFC-0001 follow-on item 9, which is why AC-0065 exists.
- **No `docs/architecture/security.md` exists**, and this slice is the repository's first untrusted-content trust boundary.
- **No dependency or secret scanner is wired**, while this slice admits one parser dependency at an untrusted-input boundary.
- **The liveness read treats a `ps` that never ran as a determination of absence**, so AC-0081's first limb reclaims where the criterion requires a decline, and emits no AC-0083 diagnostic. Both readers are affected. Accepted and routed 2026-09-18; `workspace.toml [backlog].open` entry `liveness-read-fails-open-to-reclaim` carries the evidence and the candidate repair shapes.
- **A failed spawn yields `childPid = -1`**, which `signalProcessGroup` turns into a signal to pid 1 rather than to no one, and which reaches the process-group operand the *Permitted executables* row grounds. Caught by EPERM under the desktop app's unprivileged user. Accepted and routed 2026-09-18; `workspace.toml [backlog].open` entry `spawn-failure-sentinel-signals-init`.
