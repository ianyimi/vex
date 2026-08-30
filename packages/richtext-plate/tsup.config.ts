import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/editor/index.ts",
    "src/render/index.ts",
  ],
  format: ["esm"],
  dts: false, // Declarations come from `tsc --emitDeclarationOnly` in the build script — tsup's rollup-dts pegs the CPU on this graph.
  sourcemap: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "@vexcms/core",
  ],
});
