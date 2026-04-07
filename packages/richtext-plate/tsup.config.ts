import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/editor/index.ts",
    "src/render/index.ts",
  ],
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "@vexcms/core",
  ],
});
