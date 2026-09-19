import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
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
  const from = resolve(
    "apps/studio-service/src/trials/connect-and-orient-runtime/runtime-child.ts",
  );
  const to = resolve("apps/studio-service/dist/runtime-child.ts");
  return {
    name: "copy-runtime-child",
    closeBundle() {
      mkdirSync(resolve("apps/studio-service/dist"), { recursive: true });
      copyFileSync(from, to);
    },
  };
}

export default defineConfig({
  plugins: [copyRuntimeChild()],
  build: {
    outDir: "apps/studio-service/dist",
    rollupOptions: {
      external: [/^node:/, "better-sqlite3"],
      output: { entryFileNames: "service.js" },
    },
    ssr: "apps/studio-service/src/service.ts",
  },
  ssr: {
    external: ["better-sqlite3"],
    noExternal: [/^@agent-ready\//],
  },
  test: {
    include: ["packages/**/*.test.{ts,tsx}", "apps/**/*.test.{ts,tsx}"],
  },
});
