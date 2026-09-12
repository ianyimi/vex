import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      // Deliberately NOT `enabled: true`. Coverage belongs to the `coverage`
      // script (which passes `--coverage`) and to turbo's `coverage` task,
      // which declares `coverage/**` as its outputs. Enabling it here made the
      // plain `test` script compute coverage too, which cost time and — because
      // vitest wipes `coverage/.tmp` at startup — meant two concurrent runs in
      // one package deleted each other's in-flight temp files and BOTH died on
      // `readCoverageFiles` ENOENT with every test passing.
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
