import { defineConfig } from "tsup";

export default defineConfig([
  // Server components — no "use client" banner.
  // NextAdminLayout is a server component: it sanitizes the config before
  // handing it to the client leaf. The client leaf is marked external so its
  // own "use client" module boundary is preserved (not inlined here).
  {
    entry: {
      NextAdminPage: "src/NextAdminPage.tsx",
      NextAdminLayout: "src/NextAdminLayout.tsx",
      // The root barrel carried only type re-exports until the cache/SEO
      // surface landed; it now has value exports, so it needs JS emitted or
      // the `"."` export condition resolves to a missing file. Same for the
      // two new subpath barrels.
      "cache/index": "src/cache/index.ts",
      index: "src/index.ts",
      "seo/index": "src/seo/index.ts",
    },
    format: ["esm"],
    tsconfig: "tsconfig.build.json",
    dts: false, // Declarations come from `tsc --emitDeclarationOnly` in the build script — tsup's rollup-dts pegs the CPU on this graph.
    sourcemap: true,
    clean: true,
    skipNodeModulesBundle: true,
    external: [
      "react",
      "react-dom",
      "next",
      "nuqs",
      /^nuqs\//,
      "lucide-react",
      "@vexcms/core",
      "@vexcms/react",
      // Keep the client leaf as a separate module so its "use client" banner
      // survives — do not inline it into the server bundle.
      "./NextAdminLayoutClient",
      /NextAdminLayoutClient/,
    ],
  },
  // Client components — needs "use client" banner.
  {
    entry: {
      NextAdminLayoutClient: "src/NextAdminLayoutClient.tsx",
    },
    format: ["esm"],
    tsconfig: "tsconfig.build.json",
    dts: false, // Declarations come from `tsc --emitDeclarationOnly` in the build script — tsup's rollup-dts pegs the CPU on this graph.
    sourcemap: true,
    clean: false,
    skipNodeModulesBundle: true,
    external: [
      "react",
      "react-dom",
      "next",
      "nuqs",
      /^nuqs\//,
      "lucide-react",
      "@vexcms/core",
      "@vexcms/react",
    ],
    banner: {
      js: '"use client";',
    },
  },
]);
