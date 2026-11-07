import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Threads, not `forks`: fork workers outlive a crashed/interrupted run.
    // See packages/core/vitest.config.ts.
    pool: "threads",
    // The editor tests mount Plate's contenteditable, which needs a DOM.
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    passWithNoTests: true,
  },
});
