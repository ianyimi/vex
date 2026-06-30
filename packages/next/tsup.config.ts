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
    },
    format: ["esm"],
    tsconfig: "tsconfig.build.json",
    dts: false, // Temporarily disable DTS to fix CPU issue
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
    dts: false, // Temporarily disable DTS to fix CPU issue
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
