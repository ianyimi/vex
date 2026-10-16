import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Threads, not `forks`: fork workers outlive a crashed/interrupted run.
    // See packages/core/vitest.config.ts.
    pool: "threads",
    globals: true,
    exclude: ["**/node_modules/**"],
    passWithNoTests: true,
  },
});
