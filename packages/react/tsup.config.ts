import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false, // Temporarily disable DTS to fix CPU issue
  sourcemap: true,
  skipNodeModulesBundle: true,
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
    // Convex + query
    "convex",
    /^convex\//,
    "@convex-dev/react-query",
    "@tanstack/react-query",
    // Form
    "@tanstack/react-form",
    "zod",
    // Date picker
    "react-day-picker",
    "date-fns",
    // URL state — peer dep, must use the same instance as the consuming app
    "nuqs",
    /^nuqs\//,
  ],
  banner: {
    js: '"use client";',
  },
});
