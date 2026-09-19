/**
 * The state vocabulary and its projection, re-exported for the service's own
 * importers. The tables and the derivation moved to `@agent-ready/protocol` so
 * the renderer can read them without importing this package, which
 * `AGENTS.md:85-88` forbids.
 */
export * from "@agent-ready/protocol";
