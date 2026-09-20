import type { NextConfig } from "next"

import { existsSync, readFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"

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

/**
 * Maps every workspace package's bare specifier to its TypeScript source entry.
 *
 * Read from each package's own `exports.*.source` condition rather than
 * hardcoded, so adding a subpath export needs no edit here. Subpaths without a
 * `source` (e.g. `@vexcms/react/styles`, a plain CSS file) are skipped.
 *
 * Why: in dev the apps otherwise resolve these packages through the `import`
 * condition to `dist`, so every edit has to round-trip through that package's
 * `tsup --watch` before Next sees it — and that watcher silently drops
 * filesystem events for some directories (see the backlog entry), which is
 * what makes edits appear to do nothing. Resolving to source puts the files in
 * Next's own watch graph: real Fast Refresh, no bundler in the loop.
 *
 * Dev only — production builds keep resolving `dist`, so what ships is exactly
 * what the published packages contain.
 *
 * Values are paths RELATIVE TO THIS APP DIRECTORY. Turbopack resolves an
 * alias value against the project directory and rejects an absolute path
 * outright ("server relative imports are not implemented yet"), so a
 * workspace-relative or absolute value silently resolves to nothing and the
 * package quietly falls back to `dist` — verified both ways.
 *
 * @param workspaceRoot - Absolute path to the pnpm workspace root.
 * @param appDir - Absolute path to this Next app's directory.
 * @returns A `turbopack.resolveAlias` map, empty in production.
 */
function workspaceSourceAliases(workspaceRoot: string, appDir: string): Record<string, string> {
  if (process.env.NODE_ENV === "production") {
    return {}
  }

  const packageDirs = ["core", "react", "next", "better-auth", "file-storage-convex"]
  const aliases: Record<string, string> = {}

  for (const packageDir of packageDirs) {
    const manifestPath = join(workspaceRoot, "packages", packageDir, "package.json")
    if (!existsSync(manifestPath)) {
      continue
    }

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      exports?: Record<string, string | { source?: string }>
      name?: string
    }
    if (!manifest.name || !manifest.exports) {
      continue
    }

    for (const [subpath, target] of Object.entries(manifest.exports)) {
      const source = typeof target === "string" ? undefined : target.source
      if (!source) {
        continue
      }
      const specifier = subpath === "." ? manifest.name : `${manifest.name}${subpath.slice(1)}`
      const absoluteSource = join(workspaceRoot, "packages", packageDir, source)
      const relativeSource = relative(appDir, absoluteSource)
      aliases[specifier] = relativeSource.startsWith(".") ? relativeSource : `./${relativeSource}`
    }
  }

  return aliases
}

const workspaceRoot = findWorkspaceRoot(import.meta.dirname)

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
    root: workspaceRoot,
    // Dev only: resolve workspace packages to their TypeScript source so Next
    // watches the real files. See `workspaceSourceAliases`.
    resolveAlias: workspaceSourceAliases(workspaceRoot, import.meta.dirname),
  },
  images: {
    // Additional remote image hosts (e.g. an external CMS or CDN) can be
    // added here alongside the auto-derived Convex hostname above.
    remotePatterns: convexImageRemotePatterns,
  },
}

export default nextConfig
