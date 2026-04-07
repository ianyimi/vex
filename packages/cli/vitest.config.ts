import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
    exclude: [
      "src/lib/generateCollectionFiles.test.ts",
      "src/schema/generateSchema.test.ts",
    ],
    passWithNoTests: true,
  },
});
