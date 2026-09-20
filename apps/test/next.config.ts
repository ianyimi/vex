import type { NextConfig } from "next";

import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import "./src/env.mjs";

// Absolute path to the monorepo root (dev/).
// turbopack.root must be absolute; resolveAlias values are relative to it.
const repoRoot = resolve(__dirname, "../..");

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
 * Values are paths RELATIVE TO THIS APP DIRECTORY. Turbopack resolves an alias
 * value against the project directory and rejects an absolute one outright
 * ("server relative imports are not implemented yet"), so a workspace-relative
 * or absolute value silently resolves to nothing and the package quietly falls
 * back to `dist` — verified both ways.
 *
 * @param workspaceRoot - Absolute path to the pnpm workspace root.
 * @param appDir - Absolute path to this Next app's directory.
 * @returns A `turbopack.resolveAlias` map, empty in production.
 */
function workspaceSourceAliases(workspaceRoot: string, appDir: string): Record<string, string> {
  if (process.env.NODE_ENV === "production") {
    return {};
  }

  const packageDirs = ["core", "react", "next", "better-auth", "file-storage-convex"];
  const aliases: Record<string, string> = {};

  for (const packageDir of packageDirs) {
    const manifestPath = join(workspaceRoot, "packages", packageDir, "package.json");
    if (!existsSync(manifestPath)) {
      continue;
    }

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      exports?: Record<string, string | { source?: string }>;
      name?: string;
    };
    if (!manifest.name || !manifest.exports) {
      continue;
    }

    for (const [subpath, target] of Object.entries(manifest.exports)) {
      const source = typeof target === "string" ? undefined : target.source;
      if (!source) {
        continue;
      }
      const specifier = subpath === "." ? manifest.name : `${manifest.name}${subpath.slice(1)}`;
      const absoluteSource = join(workspaceRoot, "packages", packageDir, source);
      const relativeSource = relative(appDir, absoluteSource);
      aliases[specifier] = relativeSource.startsWith(".") ? relativeSource : `./${relativeSource}`;
    }
  }

  return aliases;
}

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
  experimental: {
    // Offload Turbopack's in-memory compilation cache to disk under memory
    // pressure (new in 16.3.0, default "auto" — pinned explicitly because
    // long-lived `next dev` sessions grew to 12GB after ~30h of agent-driven
    // file churn). Requires the FileSystem cache, which is on by default
    // (experimental.turbopackFileSystemCacheForDev, default true since 16.1).
    turbopackMemoryEviction: "auto",
  },
  turbopack: {
    root: repoRoot,
    resolveAlias: {
      // Dev only: resolve workspace packages to their TypeScript source so Next
      // watches the real files. See `workspaceSourceAliases`.
      ...workspaceSourceAliases(repoRoot, __dirname),
      // Force single nuqs instance — pnpm creates separate virtual store entries
      // keyed by peer dep set (@babel/core present in www, absent in packages/react).
      // Without these aliases each package resolves a different nuqs module file,
      // so NuqsAdapter's React context is invisible to useQueryState.
      // All three import patterns used across packages must be aliased.
      // Values are relative to turbopack.root above.
      nuqs: "apps/test/node_modules/nuqs/dist/index.js",
      "nuqs/adapters/next": "apps/test/node_modules/nuqs/dist/adapters/next.js",
      "nuqs/adapters/next/app": "apps/test/node_modules/nuqs/dist/adapters/next/app.js",
    },
  },
};

export default nextConfig;
