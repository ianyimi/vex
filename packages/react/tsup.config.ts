import { defineConfig } from "tsup";

/**
 * ONE config with BOTH entries and `splitting: true`, deliberately — not the
 * array-of-configs pattern `docs/standards/tooling/tsup-and-exports.md`
 * describes for divergent banners.
 *
 * Two separate tsup invocations cannot share a chunk, so `.` and `./testing`
 * each inlined their own copy of every module they touch — including
 * `AppFormContext`'s `createContext(null)` call. A consumer importing
 * `TextFieldInput` from `.` and `AppForm`/`runVexReactSuite` from `./testing`
 * then got TWO distinct React contexts, and every mounted component threw
 * "must be rendered inside <AppForm>". Measured in `apps/www`: 26 of 27 tests
 * failed on exactly that, which is the whole reason the test kit exists to
 * begin with. Runtime correctness wins over a cosmetically clean banner.
 *
 * The cost of folding them back together is that the `"use client"` banner is
 * stamped on `dist/testing/index.js` too. That is inert: the test kit is only
 * ever imported by a vitest process, where the directive is an ignored string
 * literal, and it is never part of a Next RSC module graph.
 *
 * `entry` MUST stay in object form. An array form makes `src/testing` the
 * common base dir and emits `dist/index.js` for the testing entry, silently
 * overwriting the main bundle.
 */
export default defineConfig({
  entry: {
    index: "src/index.ts",
    "testing/index": "src/testing/index.ts",
  },
  format: ["esm"],
  dts: false, // Declarations come from `tsc --emitDeclarationOnly` in the build script — tsup's rollup-dts pegs the CPU on this graph.
  sourcemap: true,
  clean: true,
  // Load-bearing: emits shared chunks so both entries reference ONE instance of
  // every shared module (contexts above all). Do not disable.
  splitting: true,
  skipNodeModulesBundle: true,
  external: [
    // React
    "react",
    "react-dom",
    // Base UI (shadcn primitives)
    /^@base-ui\//,
    // Icons
    "lucide-react",
    // Styling utilities
    "class-variance-authority",
    "clsx",
    "tailwind-merge",
    // Workspace packages
    "@vexcms/core",
    // Convex + query
    "convex",
    /^convex\//,
    "@convex-dev/react-query",
    "@tanstack/react-query",
    // Form
    "@tanstack/react-form",
    "zod",
    // Date picker
    "react-day-picker",
    "date-fns",
    // URL state — peer dep, must use the same instance as the consuming app
    "nuqs",
    /^nuqs\//,
    // Test-runtime peers — resolved from the CONSUMER's tree so their module
    // identity matches the runner executing the suite (AP-016).
    "vitest",
    /^vitest\//,
    "vitest-axe",
    /^vitest-axe\//,
    /^@testing-library\//,
    "convex-test",
  ],
  // The directive `dist/index.js` must carry: without it a Next RSC build fails
  // the instant an app imports @vexcms/react ("You're importing a module that
  // depends on useState into a React Server Component module"). It lands on
  // `dist/testing/index.js` too, which is the accepted cost explained above.
  banner: {
    js: '"use client";',
  },
});
