import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    // React
    "react",
    "react-dom",
    // Base UI (shadcn primitives)
    /^@base-ui\//,
    // Icons
    "lucide-react",
    // Styling utilities
    "class-variance-authority",
    "clsx",
    "tailwind-merge",
    // Workspace packages
    "@vexcms/core",
  ],
  banner: {
    js: '"use client";',
  },
});
