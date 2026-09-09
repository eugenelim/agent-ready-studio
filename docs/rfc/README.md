# Requests For Comments

> Proposals for change. See
> [`../CONVENTIONS.md`](../CONVENTIONS.md#3-rfc--request-for-comments--docsrfc)
> for when to open an RFC vs. an ADR vs. just opening a PR.

| #    | Title | Status | Opened     | Closed |
| ---- | ----- | ------ | ---------- | ------ |
<!-- no RFCs yet -->

## Adding a new RFC

Invoke the `new-rfc` skill by name. To do it by hand, point `SKILL` at the
installed skill — `.claude/skills/new-rfc` for Claude Code, `.agents/skills/new-rfc`
for Codex and the other adapters:

```bash
SKILL=.claude/skills/new-rfc
N=$(python3 "$SKILL/scripts/next-ordinal.py" docs/rfc)
cp "$SKILL/assets/rfc.md" "docs/rfc/${N}-<kebab-title>.md"
```
