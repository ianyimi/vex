import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Threads, not `forks`: orphaned fork workers survive a crashed/interrupted
    // run and spin forever on convex-test timers. See packages/core/vitest.config.ts.
    pool: "threads",
    globals: true,
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "convex-test": "convex-test",
    },
  },
});
