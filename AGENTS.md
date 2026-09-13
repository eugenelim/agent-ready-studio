# Agent guidance

## Project overview

Agent-Ready Studio helps multidisciplinary product teams turn uncertain inputs
into connected, reviewable product work and explicit decisions, from strategy
and research through experience, architecture, delivery, release, and learning.
The [charter](docs/CHARTER.md) owns that mission, its scope, and its permanent
boundaries. What is built today is a local desktop product.

The [reference architecture](docs/architecture/reference.md) is normative.
Product direction lives in
[the delivery brief](docs/product/briefs/agent-ready-studio.md) and
[capability intents](docs/product/capability-intents.md).

## Rule lookups

Before your first user-facing response or unrelated tool call, silently read [`AGENT_RULES.md`](AGENT_RULES.md), then every `always` rule and every conditional rule there that matches the work. For work under `docs/`, also read the scoped [`docs/AGENTS.md`](docs/AGENTS.md). Read both lookup files with one bounded, repository-confined operation that rejects links, reparse points, non-regular files, multiple links, oversized files, and identity changes while opening. If the host loaded a file before agent control, do not claim this check covered the host load.

## Development workflow

Follow the repository's existing contributor workflow. Use the `work-loop`
skill for repository changes when installed; it owns planning, verification,
review, and recovery.

Follow [CONTRIBUTING.md](CONTRIBUTING.md) for the contributor procedure and
[`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) for repository documentation
conventions.

## Build and test commands

```bash
corepack enable
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
pnpm dev
```

`pnpm dev` builds the Studio Service and starts the
`@agent-ready/studio-desktop` development process. It is long-running; the
finite gate set is `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and
`pnpm verify`. Verify runs lint, typecheck, test, and build in that order.

Component test files opt into jsdom with a per-file
`// @vitest-environment jsdom` docblock. Node-side test files must not carry the
docblock because their process and `node:` URL behavior needs the Node
environment.

Keep the dependency build decisions in `pnpm-workspace.yaml` intact:
`better-sqlite3` and `esbuild` remain `false`, while `electron` remains `true`.
Changing one requires new installation and runtime evidence.

Renderer production code uses only the frozen, typed preload API exposed as
`window.studio`. It must not import Electron, Studio Service, or storage
implementation modules. The Node-side test under `apps/desktop/src/e2e/` is the
deliberate exception used to compose the real preload, main transport, service,
and SQLite boundaries.

## Coding conventions

Follow documented repository conventions and the nearest scoped `AGENTS.md`.
When no documented rule exists, use repository-owned framework primitives as
the strongest evidence. Two matching production examples may guide a proposal;
one nearby example must not become a rule.

### Cut before adding

After understanding the code a change touches, stop at the first sufficient
rung:

1. If the requested addition is not genuinely needed, skip it and say so once.
2. Search once, within the current decision boundary, for an adequate existing
   repository solution; reuse a hit or move on after a decisive empty result.
3. Prefer the standard library when it satisfies the outcome.
4. Prefer a native platform capability when it satisfies the outcome.
5. Prefer an already-installed dependency when it satisfies the outcome; an
   import absent from the owning manifest is a new dependency.
6. Use one obvious line when it is the complete, maintainable solution.
7. Otherwise write the minimum correct solution in the fewest statements and
   files that preserve ownership and tests.

Prefer the obvious solution, not merely the shortest text. The bounded search
in rung 2 limits discovery, not verification: do not ignore contradictory
evidence, freshness-sensitive facts, required gates, or correctness review.

Never cut validation at a trust boundary; error handling that prevents data
loss; security or privacy controls; accessibility; an explicit accepted
requirement; required tests, migrations, documentation, or human approval; or
a policy or platform restriction the user cannot waive.

Delete claims that do not affect the accepted outcome. Before stating a
necessary claim about a named repository target as fact, perform one bounded
read or search of that target. If it remains ungrounded, label it as an
assumption or a condition to discover during the work.

Lead with the useful outcome and omit routine tool narration. Preserve required
interactive updates, and end a completion receipt with changed state,
verification, and remaining work.

## Repository structure

- `packages/` holds reusable domain, protocol, blueprint, execution, and
  storage modules.
- `apps/studio-service/` owns application behavior, transport, and SQLite
  writes; `apps/desktop/` owns Electron main, preload, and renderer
  composition.
- `contracts/` holds the versioned public protocol contract. Do not change it
  without the required approval.
- `docs/specs/` holds feature contracts; approved specification and plan bodies
  are immutable during implementation.

> If this repository provides `AGENTS.local.md`, read it for repository-specific guidance.
