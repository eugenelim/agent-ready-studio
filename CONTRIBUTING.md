# Contributing to Agent-Ready Studio

Agent-Ready Studio is building a local, decision-oriented desktop product. Keep
changes aligned with the accepted architecture and the active specification.

## Local setup

Use Node.js 24 and pnpm 12.3.4 through Corepack. `pnpm governance` runs the
decision-record checks through `python3`, so a Python 3 interpreter must be on
`PATH`; `pnpm verify` includes that gate.

```bash
corepack enable
pnpm install
```

## Before you open a change

1. Read [AGENTS.md](AGENTS.md) and the applicable scoped guidance.
2. Read [the architecture reference](docs/architecture/reference.md) for
   dependency and trust-boundary rules.
3. For feature work, follow the active specification and its approved plan.

## Verification

Run the finite root checks before handing work over:

```bash
pnpm lint
pnpm typecheck
pnpm governance
pnpm test
pnpm build
pnpm verify
```

`pnpm dev` is reserved for the Electron desktop application. It exits non-zero
if the desktop package is missing and otherwise stays running until the
development process is stopped. The command builds the Studio Service before
starting Electron.

Vitest must fail when it collects no tests. Component tests opt into jsdom with
a per-file `// @vitest-environment jsdom` docblock; Node-side tests do not carry
that docblock.

Rendered evidence is captured by `pnpm visual-evidence:skeleton` and
`pnpm visual-evidence:connect`, one per spec that retains captures. **Publishing
replaces that spec's retained set wholesale**, so the plain `pnpm visual-evidence`
refuses to run without being told which set to replace, and only those two
directories are accepted. Adding a third means adding it to `KNOWN_ROOTS` in
`apps/desktop/tools/visual-evidence.mjs` and adding its `.next` and `.previous`
staging directories to `.gitignore`.

## Documentation

Keep living documentation truthful in the same change as the behavior it
describes. Do not edit Accepted ADR bodies or the approved walking-skeleton
specification, plan, or protocol contract without the required review path.
