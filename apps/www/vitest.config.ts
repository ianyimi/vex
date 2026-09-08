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
    },
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
