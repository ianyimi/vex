import type { NextConfig } from "next"

import { existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

import { env } from "./src/env.mjs"

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
}

export default nextConfig
