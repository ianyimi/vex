import { defineConfig } from "tsup";
import { listModuleEntries, preserveModulesPlugin } from "../../scripts/preserveModulesPlugin.mjs";

/**
 * One file per source module (`bundle: true, splitting: false`, object-form
 * `entry` from `listModuleEntries`, plus `preserveModulesPlugin` — see
 * `scripts/preserveModulesPlugin.mjs`). The package used to build `.` and
 * `./testing` from one `splitting: true` config so tsup's shared chunk gave
 * both entries ONE instance of every module they touch, `AppFormContext`'s
 * `createContext` call above all — two separate builds each inlined their
 * own copy, and a consumer mixing `TextFieldInput` from `.` with `AppForm`
 * from `./testing` got two distinct React contexts (measured: 26 of 27
 * `apps/www` tests failed on exactly that). A per-module build removes the
 * need for a shared chunk: every module resolves to exactly one `dist/`
 * file regardless of how many public entries reach it, so `.` and
 * `./testing` already share one instance of each without a shared tsup
 * invocation forcing it.
 *
 * The root barrel (`src/index.ts`) no longer carries `"use client"` — every
 * client module declares its own boundary now, enforced by
 * `src/clientDirective.test.ts`, so a server component can import `cn` or a
 * hook through the barrel without making the whole package a client
 * reference. `dist/testing/index.js` still opens with the directive
 * (inherited from `src/testing/index.ts`, which keeps it) — inert, since the
 * test kit only ever runs inside vitest, never inside a Next module graph.
 */
export default defineConfig({
  entry: listModuleEntries({ srcDir: "src" }),
  format: ["esm"],
  dts: false, // Declarations come from `tsc --emitDeclarationOnly` in the build script — tsup's rollup-dts pegs the CPU on this graph.
  sourcemap: true,
  clean: true,
  bundle: true,
  splitting: false,
  esbuildPlugins: [preserveModulesPlugin({ srcDir: "src" })],
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
});
