import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  tsconfig: "tsconfig.build.json",
  dts: false, // Temporarily disable DTS to fix CPU issue
  sourcemap: true,
  clean: true,
  external: ["convex", "@vexcms/core"],
});
