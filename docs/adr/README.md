# Architecture decision records

Accepted records are frozen except for lifecycle status changes. A reversal is
recorded in a new ADR that supersedes the earlier decision. See
[`../CONVENTIONS.md`](../CONVENTIONS.md#2-adr--architecture-decision-records--docsadr)
for what belongs here and what does not.

| ID | Decision | Status |
| --- | --- | --- |
| [ADR-0001](0001-electron-client-and-studio-service.md) | Electron client with a modular-monolith Studio Service | Accepted |
| [ADR-0002](0002-workspace-extension-model.md) | Blueprints, Capability Packs, and Executor Adapters | Accepted |
| [ADR-0003](0003-artifact-revisions-and-decisions.md) | Immutable revisions with explicit decisions | Accepted |
| [ADR-0004](0004-versioned-json-rpc-ndjson-boundary.md) | Versioned JSON-RPC over NDJSON | Accepted |
| [ADR-0005](0005-five-plane-authority-model.md) | Five distinct authority planes | Accepted |
| [ADR-0006](0006-monorepo-component-placement.md) | Runnable units in the Studio monorepo | Accepted |
| [ADR-0007](0007-runtime-contract-placement.md) | Runtime contract in its own versioned package | Accepted |

## Adding a new ADR

Invoke the `new-adr` skill by name. To do it by hand, point `SKILL` at the
installed skill — `.claude/skills/new-adr` for Claude Code, `.agents/skills/new-adr`
for Codex and the other adapters:

```bash
SKILL=.claude/skills/new-adr
N=$(python3 "$SKILL/scripts/next-ordinal.py" docs/adr)
cp "$SKILL/assets/adr.md" "docs/adr/${N}-<kebab-title>.md"
```

Add the row to the table above when the ADR is accepted.
