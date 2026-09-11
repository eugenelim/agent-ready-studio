import { defineConfig } from "vitest/config";

export default defineConfig({
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
