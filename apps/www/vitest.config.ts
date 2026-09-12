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
      // whole run exits 1 before a single test executes.
      reporter: ["text", "json-summary"],
      // Reported for visibility only. No thresholds, deliberately: a coverage
      // percentage must never be the thing that fails a run. Declaring a
      // permission callback in `src/auth/access.ts` that this app's own tests
      // never invoke is not a defect, and gating on it turns an authoring
      // choice into a red build. Only a stale test, or a test catching a real
      // problem, should fail `pnpm test`.
      reportOnFailure: true,
    },
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
