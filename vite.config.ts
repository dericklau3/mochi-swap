import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const isGitHubPages = Boolean((globalThis as { process?: { env?: { GITHUB_PAGES?: string } } }).process?.env?.GITHUB_PAGES);

export default defineConfig({
  plugins: [react()],
  base: isGitHubPages ? "/mochi-swap/" : "/",
  build: {
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.message.includes("contains an annotation that Rollup cannot interpret")) return;
        warn(warning);
      }
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts"
  }
});
