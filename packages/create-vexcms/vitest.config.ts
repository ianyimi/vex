import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    exclude: [
      "**/node_modules/**",
      "src/__tests__/fileOperations.test.ts",
      "src/__tests__/integration.test.ts",
    ],
    passWithNoTests: true,
  },
});
