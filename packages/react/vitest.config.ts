import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Installs jest-dom's matchers and the jsdom polyfills the shared test kit
    // needs. Same module consumers point their own `setupFiles` at.
    setupFiles: ["./src/testing/setup.ts"],
    passWithNoTests: true,
    coverage: {
      enabled: true,
    },
  },
});
