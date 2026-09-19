import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vitest/config";

/**
 * The Runtime child is spawned as a `.ts` file that Node type-strips, not
 * imported, so the bundler never sees it and it never reached `dist/`. The
 * built service resolved `./runtime-child.ts` next to `service.js`, found
 * nothing, and every accepted URL failed to spawn a Runtime -- composed in
 * source and broken in the target, which is the shape of failure this slice
 * has now hit twice.
 */
function copyRuntimeChild(): Plugin {
  // Anchored to this config's own location rather than to `process.cwd()`, so
  // an invocation from another directory cannot write the child into the wrong
  // tree.
  const root = dirname(fileURLToPath(import.meta.url));
  const from = resolve(
    root,
    "apps/studio-service/src/trials/connect-and-orient-runtime/runtime-child.ts",
  );
  const outDir = resolve(root, "apps/studio-service/dist");
  return {
    name: "copy-runtime-child",
    closeBundle() {
      mkdirSync(outDir, { recursive: true });
      // Kept for readability beside the compiled sibling the spawn prefers.
      copyFileSync(from, resolve(outDir, "runtime-child.ts"));
    },
  };
}

export default defineConfig({
  plugins: [copyRuntimeChild()],
  build: {
    outDir: "apps/studio-service/dist",
    rollupOptions: {
      external: [/^node:/, "better-sqlite3"],
      output: { entryFileNames: "[name].js" },
    },
    ssr: true,
    lib: {
      entry: {
        service: "apps/studio-service/src/service.ts",
        "runtime-child":
          "apps/studio-service/src/trials/connect-and-orient-runtime/runtime-child.ts",
      },
      formats: ["es"],
    },
  },
  ssr: {
    external: ["better-sqlite3"],
    noExternal: [/^@agent-ready\//],
  },
  test: {
    include: ["packages/**/*.test.{ts,tsx}", "apps/**/*.test.{ts,tsx}"],
  },
});
