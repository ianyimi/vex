import type { NextConfig } from "next"

import "./src/env.mjs"

const nextConfig: NextConfig = {
  devIndicators: {
    position: "bottom-right",
  },
  allowedDevOrigins: ["127.0.01", "localhost"],
  reactCompiler: true,
  images: {
    remotePatterns: [
      // Add your Convex deployment's hostname here once `npx convex dev` has
      // run — Convex file storage URLs are served from `<deployment>.convex.cloud`,
      // e.g. { hostname: "your-deployment-575.convex.cloud" }.
    ],
  },
}

export default nextConfig
