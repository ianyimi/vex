import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
    },
    // `node`, not `edge-runtime`: none of this package's tests touch the DOM or
    // need Convex's runtime semantics — they exercise pure functions and a
    // mocked `ConvexHttpClient`.
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    passWithNoTests: true,
  },
});
