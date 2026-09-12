import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    passWithNoTests: true,
    // `./src/testing/setup.ts` just re-exports `@vexcms/next/testing` (the
    // Next-preferred barrel wrapping `@vexcms/react/testing`, whose
    // `testing/setup.ts` installs ResizeObserver/scrollIntoView polyfills as
    // an import-time side effect). Vitest's `setupFiles` resolver does not
    // honor a symlinked workspace package's `exports` subpath the way its
    // normal test-module transform pipeline does — a bare
    // `"@vexcms/next/testing"` specifier here throws `Cannot find module
    // '/@fs/.../dist/testing/index.js'` even though that exact path exists
    // and importing the same specifier from inside a test file works fine.
    // Routing through a same-project relative file sidesteps that gap while
    // still running the identical side effect.
    setupFiles: ["./src/testing/setup.ts"],
    coverage: {
      // Deliberately NOT `enabled: true`. Coverage belongs to the `coverage`
      // script (which passes `--coverage`) and to turbo's `coverage` task,
      // which declares `coverage/**` as its outputs. Enabling it here made the
      // plain `test` script compute coverage too, which cost time and — because
      // vitest wipes `coverage/.tmp` at startup — meant two concurrent runs in
      // one package deleted each other's in-flight temp files and BOTH died on
      // `readCoverageFiles` ENOENT with every test passing.
      // `text` + `json-summary`, never `"default"`: `coverage.reporter` takes
      // istanbul reporter names, and `"default"` is a *test* reporter — passing it
      // here makes istanbul-reports throw `Cannot find module 'default'` and the
      // whole `vitest run` (this app's own `test` script) exits 1 before a single
      // test runs.
      reporter: ["text", "json-summary"],
      // Reported for visibility only. No thresholds, deliberately: a coverage
      // percentage must never be the thing that fails a run — only a stale test,
      // or a test catching a real problem, should.
      reportOnFailure: true,
    },
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
