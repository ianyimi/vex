import { defineConfig } from "tsup";

export default defineConfig(({ watch }) => [
  // Server components — no "use client" banner
  {
    entry: { "NextAdminPage": "src/NextAdminPage.tsx" },
    format: ["esm"],
    tsconfig: "tsconfig.build.json",
    dts: true,
    sourcemap: true,
    clean: !watch,
    external: ["react", "react-dom", "next", "nuqs", "lucide-react", "@vexcms/core", "@vexcms/react"],
  },
  // Client components — needs "use client" banner
  {
    entry: { "NextAdminLayout": "src/NextAdminLayout.tsx" },
    format: ["esm"],
    tsconfig: "tsconfig.build.json",
    dts: true,
    sourcemap: true,
    clean: false,
    external: ["react", "react-dom", "next", "nuqs", "lucide-react", "@vexcms/core", "@vexcms/react"],
    banner: {
      js: '"use client";',
    },
  },
]);
