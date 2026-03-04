import { defineConfig } from "tsup";

export default defineConfig(({ watch }) => ({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: !watch,
}));
