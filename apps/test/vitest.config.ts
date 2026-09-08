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
    },
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
