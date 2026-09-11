import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";

export default defineConfig({
  main: {
    build: {
      externalizeDeps: { exclude: ["@agent-ready/protocol"] },
      rollupOptions: {
        input: resolve("src/main/index.ts"),
        output: { entryFileNames: "index.js" },
      },
    },
  },
  preload: {
    build: {
      externalizeDeps: false,
      rollupOptions: {
        input: resolve("src/preload/index.ts"),
        output: { entryFileNames: "index.cjs", format: "cjs" },
      },
    },
  },
  renderer: {
    root: resolve("src/renderer"),
    plugins: [react()],
    build: {
      rollupOptions: { input: resolve("src/renderer/index.html") },
    },
  },
});
