import type { NextConfig } from "next"

import { env } from "./src/env.mjs"

// Convex file storage URLs (`next/image` sources for uploaded media) are
// served from `<deployment>.convex.cloud` — derive the hostname from the
// validated NEXT_PUBLIC_CONVEX_URL so scaffolds work without a manual
// next.config.ts edit. Falls back to an empty list when the URL is unset or
// unparsable (e.g. a deployment-less build with SKIP_ENV_VALIDATION set).
let convexImageRemotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = []
try {
  convexImageRemotePatterns = [{ hostname: new URL(env.NEXT_PUBLIC_CONVEX_URL).hostname }]
} catch {
  // No deployment yet — leave remotePatterns empty.
}

const nextConfig: NextConfig = {
  devIndicators: {
    position: "bottom-right",
  },
  allowedDevOrigins: ["127.0.01", "localhost"],
  reactCompiler: true,
  // Pin the workspace root to THIS app. Without it, Next walks up and adopts
  // any outer lockfile (e.g. when this project lives inside a monorepo),
  // which shifts Turbopack's file-tracing root and Tailwind's source-scan
  // root — producing wrong relative paths and scanning files outside the app.
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    // Additional remote image hosts (e.g. an external CMS or CDN) can be
    // added here alongside the auto-derived Convex hostname above.
    remotePatterns: convexImageRemotePatterns,
  },
}

export default nextConfig
