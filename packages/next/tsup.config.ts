import { defineConfig } from "tsup";

export default defineConfig([
  // Server components — no "use client" banner
  {
    entry: { "NextAdminPage": "src/NextAdminPage.tsx" },
    format: ["esm"],
    tsconfig: "tsconfig.build.json",
    dts: false, // Temporarily disable DTS to fix CPU issue
    sourcemap: true,
    clean: true,
    skipNodeModulesBundle: true,
    external: ["react", "react-dom", "next", "nuqs", /^nuqs\//, "lucide-react", "@vexcms/core", "@vexcms/react"],
  },
  // Client components — needs "use client" banner
  {
    entry: { "NextAdminLayout": "src/NextAdminLayout.tsx" },
    format: ["esm"],
    tsconfig: "tsconfig.build.json",
    dts: false, // Temporarily disable DTS to fix CPU issue
    sourcemap: true,
    clean: false,
    skipNodeModulesBundle: true,
    external: ["react", "react-dom", "next", "nuqs", /^nuqs\//, "lucide-react", "@vexcms/core", "@vexcms/react"],
    banner: {
      js: '"use client";',
    },
  },
]);
