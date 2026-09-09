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
      enabled: true,
      // `text` + `json-summary`, never `"default"`: `coverage.reporter` takes
      // istanbul reporter names, and `"default"` is a *test* reporter — passing it
      // here makes istanbul-reports throw `Cannot find module 'default'` and the
      // whole `vitest run` (this app's own `test` script) exits 1 before a single
      // test runs. `json-summary` is what writes `coverage/coverage-summary.json`,
      // the file the thresholds below were measured from.
      reporter: ["text", "json-summary"],
      // Coverage reporting — and therefore the thresholds below — is skipped on a
      // failing run unless this is set, so a red suite would silently bypass the
      // gate instead of failing it.
      reportOnFailure: true,
      // Measured via
      // `pnpm --filter test exec vitest run --coverage --coverage.reportOnFailure`,
      // read from `coverage/coverage-summary.json#total`, each rounded down to a whole
      // number (94.02 / 100 / 71.42 / 95.31). A regression below this floor fails the
      // build — remeasure and raise it deliberately when this app's own tested surface
      // grows, never lower it to silence a real drop.
      thresholds: {
        statements: 94,
        branches: 100,
        functions: 71,
        lines: 95,
      },
    },
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
