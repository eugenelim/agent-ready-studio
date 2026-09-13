# Requests For Comments

> Proposals for change. See
> [`../CONVENTIONS.md`](../CONVENTIONS.md#3-rfc--request-for-comments--docsrfc)
> for when to open an RFC vs. an ADR vs. just opening a PR.

| #    | Title | Status | Opened     | Closed |
| ---- | ----- | ------ | ---------- | ------ |
| [0001](0001-studio-authority-planes-and-workspace-runtime-boundary.md) | Agent-Ready Studio authority planes, component topology, and Workspace Runtime boundary | Accepted | 2026-09-11 | 2026-09-11 |
| [0002](0002-clarify-studio-charter-for-connected-sources-and-governed-execution.md) | Clarify the Agent-Ready Studio charter for connected sources and governed execution | Accepted | 2026-09-13 | 2026-09-13 |

## Adding a new RFC

Invoke the `new-rfc` skill by name. To do it by hand, point `SKILL` at the
installed skill — `.claude/skills/new-rfc` for Claude Code, `.agents/skills/new-rfc`
for Codex and the other adapters:

```bash
SKILL=.claude/skills/new-rfc
N=$(python3 "$SKILL/scripts/next-ordinal.py" docs/rfc)
cp "$SKILL/assets/rfc.md" "docs/rfc/${N}-<kebab-title>.md"
```
