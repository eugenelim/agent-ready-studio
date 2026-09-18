# Agent-Ready Studio

Agent-Ready Studio is a local desktop product for turning uncertain product
inputs into explicit, reviewable decisions. The maintained Product Development
path creates a workspace, seeds an Initiative and Input Packet, transforms the
input into a Product Intent proposal, collects an attributable human decision,
and retains the result after restart.

The path runs through an Electron desktop client, an NDJSON Studio Service, and
a local SQLite database. It needs no network connection, credentials, Git, or
repository integration.

## Requirements

- Node.js 24 (`>=24 <25`)
- pnpm 12.3.4, supplied through Corepack
- Python 3, on `PATH` — `pnpm governance` runs the decision-record checks
  through `python3`, and `pnpm verify` includes that gate

## Commands

| Command | What it runs today |
| --- | --- |
| `pnpm install` | Installs the pinned workspace dependencies. |
| `pnpm dev` | Builds the Studio Service, then starts the Electron desktop development process. |
| `pnpm lint` | Biome's configured format and lint checks. |
| `pnpm typecheck` | The strict TypeScript project check. |
| `pnpm governance` | Ordinal, index, and shape checks over the decision records in `docs/adr` and `docs/rfc`. |
| `pnpm test` | Builds the service and desktop test targets, then runs the Vitest suite. |
| `pnpm build` | Builds the service, Electron desktop, and TypeScript workspace projects. |
| `pnpm verify` | Lint, typecheck, governance, test, and build in that order. |

## Run the desktop application

```bash
corepack enable
pnpm install
pnpm dev
```

Create a workspace, select **Seed demo workspace**, then select
**Run transformation** on Home. The transformation action uses the seeded Input
Packet revision held by the current renderer session. The v1 protocol does not
list artifacts, so that action is unavailable after a renderer restart; seeded
and decided data remains in SQLite.

## Product direction

- [Charter](docs/CHARTER.md) defines the mission, scope, and principles.
- [Capability intents](docs/product/capability-intents.md) records the stable
  product direction beyond the first slice.
- [Roadmap](docs/product/roadmap.md) shows the current, next, and later
  horizons.
- [Architecture reference](docs/architecture/reference.md) is the normative
  implementation path.
- [Walking-skeleton specification](docs/specs/product-development-walking-skeleton/spec.md)
  defines the accepted first delivery slice.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the current contributor procedure.
The product and contributor boundaries are described in
[AGENTS.md](AGENTS.md).
