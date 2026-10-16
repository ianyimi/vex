import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Worker threads, never the default `forks`: fork workers outlive a crashed or
    // interrupted vitest main process, and convex-test's real-setTimeout scheduler
    // keeps those orphans spinning forever (~100% CPU, GBs of RAM each). Threads
    // die with the main process.
    pool: "threads",
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
      // Deliberately NOT `enabled: true`. Coverage belongs to the `coverage`
      // script (which passes `--coverage`) and to turbo's `coverage` task,
      // which declares `coverage/**` as its outputs. Enabling it here made the
      // plain `test` script compute coverage too, which cost time and — because
      // vitest wipes `coverage/.tmp` at startup — meant two concurrent runs in
      // one package deleted each other's in-flight temp files and BOTH died on
      // `readCoverageFiles` ENOENT with every test passing.
    },
  },
});
