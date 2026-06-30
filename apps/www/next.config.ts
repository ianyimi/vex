import type { NextConfig } from "next";

import { resolve } from "path";

import "./src/env.mjs";

// Absolute path to the monorepo root (dev/).
// turbopack.root must be absolute; resolveAlias values are relative to it.
const repoRoot = resolve(__dirname, "../..");

const nextConfig: NextConfig = {
  devIndicators: {
    position: "bottom-right",
  },
  allowedDevOrigins: ["127.0.01", "localhost"],
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        hostname: "www.google.com",
      },
      {
        hostname: "encrypted-tbn0.gstatic.com",
      },
      {
        hostname: "cheery-warbler-575.convex.cloud",
      },
    ],
  },
  turbopack: {
    root: repoRoot,
    resolveAlias: {
      // Force single nuqs instance — pnpm creates separate virtual store entries
      // keyed by peer dep set (@babel/core present in www, absent in packages/react).
      // Without these aliases each package resolves a different nuqs module file,
      // so NuqsAdapter's React context is invisible to useQueryState.
      // All three import patterns used across packages must be aliased.
      // Values are relative to turbopack.root above.
      nuqs: "apps/www/node_modules/nuqs/dist/index.js",
      "nuqs/adapters/next": "apps/www/node_modules/nuqs/dist/adapters/next.js",
      "nuqs/adapters/next/app": "apps/www/node_modules/nuqs/dist/adapters/next/app.js",
    },
  },
};

export default nextConfig;
