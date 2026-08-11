import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Run eval tests from the evals/ directory
    include: ["evals/**/*.test.ts"],
    // 30 second timeout per test — AI calls can be slow
    testTimeout: 30_000,
    // Don't run tests in parallel — AI rate limits
    pool: "forks",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
