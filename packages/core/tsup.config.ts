import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false, // Temporarily disable DTS to fix CPU issue
  sourcemap: true,
  clean: true,
});
