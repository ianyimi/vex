import type { NextConfig } from "next"

import "./src/env.mjs"

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.01", "localhost"],
  reactCompiler: true,
  turbopack: {
    root: "../../"
  }
}

export default nextConfig
