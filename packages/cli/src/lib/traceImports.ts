import { readFileSync } from "node:fs";

import { createResolver } from "./loadConfig.js";

/**
 * Regex to extract import/export specifiers from a TS/JS file.
 * Matches:
 *   import ... from "specifier"
 *   import("specifier")
 *   export ... from "specifier"
 */
const IMPORT_RE =
  /(?:import|export)\s.*?from\s+["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;

/**
 * Walk the import tree starting from `entryPath`, returning all local file
 * paths that the config transitively depends on.
 *
 * Skips:
 * - `node_modules` paths (external packages)
 * - `_generated` paths (Convex codegen output)
 * - The output file itself (prevents infinite regeneration loops)
 */
export function traceImports(
  entryPath: string,
  outputPath: string,
): string[] {
  const jiti = createResolver(entryPath);
  const visited = new Set<string>();
  const queue = [entryPath];

  while (queue.length > 0) {
    const filePath = queue.pop()!;
    if (visited.has(filePath)) continue;
    visited.add(filePath);

    let source: string;
    try {
      source = readFileSync(filePath, "utf-8");
    } catch {
      continue;
    }

    const specifiers = extractSpecifiers(source);
    for (const spec of specifiers) {
      let resolved: string;
      try {
        resolved = jiti.esmResolve(spec, { parentURL: filePath }) as string;
      } catch {
        continue;
      }

      if (typeof resolved !== "string") continue;

      // Convert file:// URLs to paths
      if (resolved.startsWith("file://")) {
        try {
          resolved = new URL(resolved).pathname;
        } catch {
          continue;
        }
      }

      if (resolved.includes("node_modules")) continue;
      if (resolved.includes("_generated")) continue;
      if (resolved === outputPath) continue;

      if (!visited.has(resolved)) {
        queue.push(resolved);
      }
    }
  }

  return [...visited];
}

function extractSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  let match: RegExpExecArray | null;
  IMPORT_RE.lastIndex = 0;
  while ((match = IMPORT_RE.exec(source)) !== null) {
    const spec = match[1] ?? match[2];
    if (spec) specifiers.push(spec);
  }
  return specifiers;
}
