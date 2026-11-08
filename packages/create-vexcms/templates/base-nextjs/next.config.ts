import type { NextConfig } from "next"

import { existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

import { env } from "./src/env.mjs"
import { buildContentSecurityPolicy } from "./src/lib/csp"

/**
 * Walks up from the app directory looking for `pnpm-workspace.yaml`.
 *
 * @param from - Directory to start from.
 * @returns The workspace root when this app is a workspace member, otherwise
 *   `from` unchanged.
 */
function findWorkspaceRoot(from: string): string {
  let dir = resolve(from)
  for (;;) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) {return dir}
    const parent = dirname(dir)
    if (parent === dir) {return resolve(from)}
    dir = parent
  }
}

// Convex file storage URLs (`next/image` sources for uploaded media) are
// served from `<deployment>.convex.cloud` — derive the hostname from the
// validated NEXT_PUBLIC_CONVEX_URL so scaffolds work without a manual
// next.config.ts edit. Falls back to an empty list/string when the URL is
// unset or unparsable (e.g. a deployment-less build with SKIP_ENV_VALIDATION set).
let convexHost = ""
try {
  convexHost = new URL(env.NEXT_PUBLIC_CONVEX_URL).hostname
} catch {
  // No deployment yet — leave convexHost empty.
}

const convexImageRemotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = convexHost
  ? [{ hostname: convexHost }]
  : []

// Vercel sets NODE_ENV=production for both the production domain and every
// preview deployment, so a pushed branch's preview still gets the full
// header set below; only `next dev` skips it.
const isProduction = process.env.NODE_ENV === "production"

const securityHeaders: { key: string; value: string }[] = isProduction
  ? [
      {
        key: "Content-Security-Policy",
        value: buildContentSecurityPolicy({ convexHost, frameAncestors: "'self'" }),
      },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=()" },
    ]
  : []

const nextConfig: NextConfig = {
  devIndicators: {
    position: "bottom-right",
  },
  allowedDevOrigins: ["127.0.01", "localhost"],
  reactCompiler: true,
  // Every UA is treated as HTML-limited so metadata (the <title>, the
  // theme-color meta) always streams in the initial HTML rather than only
  // after JS hydration — the served HTML stays valid and assistive tech
  // reading the first response gets a real title.
  htmlLimitedBots: /.*/,
  // Turbopack's root sets the file-tracing root AND Tailwind's source-scan
  // root, so it has to be the directory that actually owns `node_modules`.
  //
  // Standalone scaffold: that is this app. Pinning it stops Next walking up
  // and adopting an unrelated outer lockfile.
  //
  // pnpm workspace member: it is the workspace root — dependencies are
  // hoisted into the root virtual store and `next` is only reachable from
  // there. Pinning to the app dir makes the build fail with "Could not find
  // the Next.js package".
  //
  // Detecting `pnpm-workspace.yaml` picks the right answer in both cases
  // without the template needing a monorepo-specific variant.
  turbopack: {
    root: findWorkspaceRoot(import.meta.dirname),
  },
  images: {
    // Additional remote image hosts (e.g. an external CMS or CDN) can be
    // added here alongside the auto-derived Convex hostname above.
    remotePatterns: convexImageRemotePatterns,
  },
  async headers() {
    return securityHeaders.length > 0 ? [{ source: "/:path*", headers: securityHeaders }] : []
  },
}

export default nextConfig
