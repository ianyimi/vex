import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    // convex-test requires the edge-runtime VM for proper crypto/timer/module
    // semantics matching the real Convex runtime. See docs.convex.dev/testing.
    environment: "edge-runtime",
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
    server: {
      deps: {
        // convex-test ships ESM only; inline so vitest doesn't externalize.
        inline: ["convex-test"],
      },
    },
    coverage: {
      enabled: true,
    },
  },
});
