import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "next"],
  banner: {
    // Preserve "use client" directives in output
    js: '"use client";',
  },
});
