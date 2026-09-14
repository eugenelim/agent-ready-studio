# Connect and Orient inspection-boundary probe

- **Status:** Draft
- **Kind:** research
- **Slug:** `connect-and-orient-inspection-boundary-probe`
- **Owner:** Agent-Ready Studio maintainers
- **Source:** `de-risk-intent` probe run 2026-09-13 against
  [ARS-THREAD-001 — Connect and Orient](../intents/connect-and-orient.md)
- **Related:** [ARS-THREAD-001](../intents/connect-and-orient.md),
  [Connect and Orient steel thread](../../rfc/0001-notes/connect-and-orient-steel-thread.md),
  [Agent-Ready Repo counterpart contract](../../rfc/0001-notes/agent-ready-repo-counterpart-contract.md)

This is disposable shaping evidence, not product code and not a specification.
It records what one bounded technical probe observed. It decides nothing, and
it creates no capability identifier.

The predeclared kill-or-reframe condition, the assumption selection, and the
verdict live in [the intent](../intents/connect-and-orient.md). This file holds
the evidence they rest on.

## What was tested

Assumption **A3 — safe trusted inspection**: whether Agent-Ready state can be
inspected using trusted AgentBundle-owned logic without executing
repository-authored scripts, hooks, skills, package commands, or instructions.
The same probe necessarily produces evidence on **A4 — semantic fidelity**,
reported here as a secondary finding.

The condition was recorded in the intent **before** any evidence was gathered.

## Method

1. **Resolve.** `git ls-remote https://github.com/eugenelim/agent-ready-studio
   refs/heads/main`, unauthenticated, read-only.
2. **Materialize.** Shallow, blobless, detached checkout of that exact commit
   into an ephemeral temporary directory outside the tracked repository, with
   `core.hooksPath=/dev/null`, `GIT_TERMINAL_PROMPT=0`, and
   `GIT_CONFIG_GLOBAL=/dev/null`.
3. **Isolate the inspector.** The trusted inspector was copied *out* of the
   working repository into a separate directory before use, so the inspector
   executed could not be the one carried by the inspected snapshot.
4. **Observe.** The inspector ran under a CPython audit hook recording every
   process spawn, every dynamic-code and import event, and every file opened
   beneath the inspected root — separating files *read* from code *loaded*.
5. **Fixtures.** Four temporary workspace forms exercised the same path.
6. **Dispose.** The materialization and the fixtures were deleted after the
   evidence was captured.

### Exact inputs

| Item | Value |
| --- | --- |
| Source | `https://github.com/eugenelim/agent-ready-studio` |
| Resolved revision | `ba554b9d87e0c87794e59ffc6d09b9ccc45ab290` (`refs/heads/main`) |
| Checkout verified against resolved SHA | yes |
| Entrypoint | `workspace_status.py reconcile --root <materialized>` |
| Inspector provenance | AgentBundle pack `core` **2.25.9**, `claude-code` adapter, repo scope |
| `workspace_status.py` | SHA-256 `a8713f75fd9dfb04c1012471794e5580cf33e2fc3227c6d78f202d0eb248654c` |
| `workspace_status_engine.py` | SHA-256 `3c7f4d372ac9a988d857642250438fe74bbd09b4aa803871e93b884e3ae57b64` |

Both digests match `.agentbundle-state.toml` exactly, so the inspected logic is
the projected pack content and not a local modification.

## Finding 1 — a supported deterministic root-targeting inspector exists

`workspace_status.py` takes `--root` and accepts an arbitrary directory. It is
the trusted, installed, pack-owned entrypoint, and it required no argument
naming anything inside the target.

Two runs over the identical input produced **byte-identical** stdout, so the
inspection is deterministic over a pinned revision.

## Finding 2 — no repository-authored content was executed

Against the pinned real-world revision:

| Observation | Result |
| --- | --- |
| Exit status | `0` |
| Process spawns anywhere (`subprocess`, `os.system`, `exec*`, `fork`, `spawn`, `pty`) | **none** |
| Python modules loaded from a path under the inspected root | **none** |
| Files read under the inspected root | 72 |
| File kinds read | `.md` and `.toml` only |
| `.agentbundle-state.toml` read | no |
| Any file under `.claude/` or `.agents/` read | no |
| stderr | empty |
| stdout | 93 KB of structured JSON |

Every one of the four fixtures reproduced this: zero spawns, zero code loaded
from the root, in all cases.

**Why it holds structurally, not just observationally.** Static inspection of
the 9,065-line inspector found no `subprocess`, no `os.system`, no `exec(`, and
no `eval(`. It does load modules dynamically in two places — a source-authority
parser and a cooling module — but both resolve their path from
`Path(__file__).resolve()`, the *installed engine's own location*. Neither path
function takes the target root as an argument, so no value under the inspected
repository can reach them.

One caveat worth carrying: an environment variable,
`AGENTBUNDLE_ALLOW_DEV_SOURCE_AUTHORITY=1`, widens the parser search to a
development checkout path. It is still resolved relative to the engine's own
install location, never to the inspected root, so it does not weaken the
property — but it is an env-gated widening a threat model should name.

## Finding 3 — three of four workspace forms are honestly distinguished; one is not

| Fixture | Exit | `workspace_present` | Machine-readable diagnostic | Honest? |
| --- | --- | --- | --- | --- |
| Valid Agent-Ready workspace | 0 | `true` | — | yes |
| Plain non-Agent-Ready directory | 1 | `false` | minimal payload, no findings | yes — distinguishable, and correctly not an error about the workspace |
| Malformed `workspace.toml` | 2 | `true` | `invalid_workspace` with `next_action: "Correct workspace.toml, then rerun reconciliation."` | yes |
| **Unsupported workspace form** (`schema-version = "99.0"`, unrecognized collections) | **0** | **`true`** | **none — `findings: []`, `initiatives: []`, `reconciliation.complete: true`** | **no** |

The unsupported case is the significant negative result. A workspace declaring
a version the inspector does not understand is reported as a **healthy, empty
workspace**. The declared version is ignored and unrecognized collections are
dropped silently.

This is precisely what the steel thread's definition-of-done item 6 forbids —
"actionable diagnostics rather than a silent empty state" — and what the
counterpart-contract note requires when it says diagnostics must distinguish
*unsupported*, *malformed*, and *absent*. The inspector distinguishes malformed
from absent. It does not distinguish unsupported from healthy.

## Finding 4 — two fields Connect and Orient needs have no trusted producer

**Present** in the structured output, and consumable without Studio deriving
anything: `workspace_present`, `schema_version`, initiative `slug` and
`status`, shaping-queue and work-queue membership, 57 blocked entries carrying
stable codes (`inactive_initiative`, `invalid_artifact_path`,
`provenance_mismatch`, `invalid_workspace`), each with a `next_action` string,
plus reconciliation drift types and closeout signals.

**Absent or unusable:**

1. **Initiative `name` and `milestone` are placeholder strings.** Both fields
   return the literal value `"workspace.toml"` — the evidence path, not the
   value. Reproduced on both the real repository (source: "Repository Workspace
   Pane" / "M1 · Read-only repository workspace status") and a controlled
   fixture (source: "Probe Initiative" / "M1 · Probe"). To display an
   initiative's name, Studio would have to parse `workspace.toml` itself.
2. **No pack, profile, adapter, or skill inventory exists at all.** No output
   key carries one, and the audit hook confirms the inspector never opens
   `.agentbundle-state.toml`, `.claude/`, or `.agents/`. ARS-REPO-006's
   contribution to the thread — and therefore the factual basis for the
   shaping-availability answer — has no trusted producer today.

## Limitations

- One repository, one revision, one host. Nothing here generalizes to a
  repository that is hostile rather than merely ordinary; the snapshot was not
  adversarially constructed, and absence of execution on benign input is weaker
  evidence than a deliberate attempt to induce it.
- The audit hook observes the CPython process it runs in. It would not see
  execution by a child interpreter, and no child was spawned — but "no spawn
  observed" and "no spawn possible" are different claims, and only the first is
  established here.
- The fixtures are minimal. The unsupported case tested one shape of
  unrecognized workspace, not a version-negotiation mechanism, because the
  current contract has none to exercise.
- `workspace_status.py` is the *core* pack's inspector, built for a repository
  operating on itself. It was not designed as a remote-inspection contract, and
  nothing upstream commits it to remaining one.
- Network reachability, rate limiting, and large-repository behaviour were not
  exercised. ARS-REPO-001's open access-approach question is untouched by this
  probe.

## What this evidence does not establish

It says nothing about RFC-0001's Stage 2 Runtime gate. The inspector ran
in-process under an observation harness; no runtime, no process boundary, and
no isolation mechanism was built, tested, or implied. A8's validation point
remains after the thread is delivered.
