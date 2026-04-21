import { describe, it, expect } from "vitest";
import { defineConfig } from "./config";

describe("defineConfig — schema defaults", () => {
  it("applies all schema defaults when schema is omitted", () => {
    const config = defineConfig();
    expect(config.schema.outputPath).toBe("/convex/vex.schema.ts");
    expect(config.types.outputPath).toBe("/src/vex.types.ts");
  });

  it("merges partial schema overrides", () => {
    const config = defineConfig({
      schema: { outputPath: "/backend/vex.schema.ts" },
    });
    expect(config.schema.outputPath).toBe("/backend/vex.schema.ts");
    expect(config.types.outputPath).toBe("/src/vex.types.ts");
  });
});
