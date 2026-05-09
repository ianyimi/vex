import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/api/server.ts", "src/api/client.ts"],
  format: ["esm"],
  // Use the build-only tsconfig so test fixtures (src/api/test/**) are
  // excluded from production .d.ts emission. Their `declare module` blocks
  // would otherwise leak fixture-specific GeneratedVexTypes augmentation
  // into downstream consumers and conflict with their `vex generate` output.
  tsconfig: "./tsconfig.build.json",
  dts: false, // Temporarily disable DTS to fix CPU issue
  sourcemap: true,
  clean: true,
});
