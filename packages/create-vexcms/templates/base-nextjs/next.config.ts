import type { NextConfig } from "next"

import "./src/env.mjs"

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
    remotePatterns: [
      // Add your Convex deployment's hostname here once `npx convex dev` has
      // run — Convex file storage URLs are served from `<deployment>.convex.cloud`,
      // e.g. { hostname: "your-deployment-575.convex.cloud" }.
    ],
  },
}

export default nextConfig
