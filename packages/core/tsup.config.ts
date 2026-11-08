import { defineConfig } from "tsup";
import { listModuleEntries, preserveModulesPlugin } from "../../scripts/preserveModulesPlugin.mjs";

export default defineConfig({
  entry: listModuleEntries({ srcDir: "src", exclude: [/^db\/test\//] }),
  format: ["esm"],
  // Use the build-only tsconfig so test fixtures (src/db/test/**) are
  // excluded from production .d.ts emission. Their `declare module` blocks
  // would otherwise leak fixture-specific GeneratedVexTypes augmentation
  // into downstream consumers and conflict with their `vex generate` output.
  tsconfig: "./tsconfig.build.json",
  dts: false, // Declarations come from `tsc --emitDeclarationOnly` in the build script — tsup's rollup-dts pegs the CPU on this graph.
  sourcemap: true,
  clean: true,
  bundle: true,
  splitting: false,
  esbuildPlugins: [preserveModulesPlugin({ srcDir: "src" })],
});
