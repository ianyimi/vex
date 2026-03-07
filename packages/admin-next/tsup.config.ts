import { defineConfig } from "tsup";

export default defineConfig(({ watch }) => ({
  entry: ["src/index.ts"],
  format: ["esm"],
  tsconfig: "tsconfig.build.json",
  dts: true,
  sourcemap: true,
  clean: !watch,
  external: ["react", "react-dom", "next", "nuqs"],
  banner: {
    // Preserve "use client" directives in output
    js: '"use client";',
  },
}));
