import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    passWithNoTests: true,
    // testing/setup.ts installs ResizeObserver/scrollIntoView polyfills as an
    // import-time side effect — no "./testing/setup" subpath exists, so the
    // barrel itself is the setup file. Same precedent as apps/test.
    setupFiles: ["@vexcms/react/testing"],
    coverage: {
      enabled: true,
      // `text` + `json-summary`, never `"default"`: `coverage.reporter` takes
      // istanbul reporter names, and `"default"` is a *test* reporter — passing it
      // here makes istanbul-reports throw `Cannot find module 'default'` and the
      // whole run exits 1 before a single test executes. `json-summary` writes the
      // `coverage/coverage-summary.json` the thresholds below were measured from.
      reporter: ["text", "json-summary"],
      // Reporting, and therefore the thresholds, are skipped on a failing run
      // without this — the gate would silently not run.
      reportOnFailure: true,
      // Measured via `pnpm --filter www exec vitest run --coverage`, read from
      // `coverage/coverage-summary.json#total`. This app's `sections: ["shell"]`
      // subset covers its own vexcms surface completely today (100 across all
      // four metrics); raise nothing, but never lower it to absorb a real drop.
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
