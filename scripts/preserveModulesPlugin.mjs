import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const SOURCE_EXTENSIONS = [".ts", ".tsx"];

/**
 * @param {string} fileName
 * @returns {boolean}
 */
function isSourceFile(fileName) {
  return SOURCE_EXTENSIONS.some((ext) => fileName.endsWith(ext)) && !fileName.endsWith(".d.ts");
}

/**
 * @param {string} fileName
 * @returns {boolean}
 */
function isTestFile(fileName) {
  return /\.test\.(ts|tsx)$/.test(fileName);
}

/**
 * @param {string} path
 * @returns {string}
 */
function toPosix(path) {
  return path.split("\\").join("/");
}

/**
 * Walks `srcDir` and returns one entry per source module, keyed by its path
 * relative to `srcDir` with the extension stripped and `/` separators —
 * the shape tsup's `entry` option expects for a preserve-modules build.
 * Skips `*.test.ts(x)`, `*.d.ts`, and anything matching `exclude`.
 * @param {{ srcDir: string, exclude?: RegExp[] }} props
 * @returns {Record<string, string>}
 */
export function listModuleEntries(props) {
  const { srcDir, exclude = [] } = props;
  const entries = {};
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const absolutePath = join(dir, name);
      if (statSync(absolutePath).isDirectory()) {
        walk(absolutePath);
        continue;
      }
      if (!isSourceFile(name) || isTestFile(name)) continue;
      const relativePath = toPosix(relative(srcDir, absolutePath));
      if (exclude.some((pattern) => pattern.test(relativePath))) continue;
      const entryName = relativePath.replace(/\.tsx?$/, "");
      entries[entryName] = absolutePath;
    }
  };
  walk(srcDir);
  return entries;
}

/**
 * @param {string} basePath
 * @returns {string | null}
 */
function resolveModuleFile(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    join(basePath, "index.ts"),
    join(basePath, "index.tsx"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/**
 * esbuild plugin that keeps a preserve-modules build from bundling the
 * package's own source: every relative import (static or dynamic) issued
 * from outside `node_modules` is marked external and rewritten to the
 * `.js` path its target will be emitted at, so `dist/` ends up one file
 * per `src/` module instead of one shared chunk. Directory imports resolve
 * to `index.js`; bare package imports never match the resolve filter, so
 * they stay external untouched. A relative import issued from inside a
 * bundled `node_modules` dependency (some ship `.ts` source beside their
 * compiled `.js`, e.g. convex-helpers) is left to esbuild's normal bundled
 * resolution, since that file isn't one of this build's own entries and
 * has no mirrored `dist/` location to rewrite against.
 * @returns {import("esbuild").Plugin}
 */
export function preserveModulesPlugin() {
  return {
    name: "preserve-modules",
    setup(build) {
      build.onResolve({ filter: /^\.\.?\// }, (args) => {
        if (args.kind === "entry-point") return;
        // A dependency can ship `.ts` source alongside its compiled `.js`
        // (convex-helpers does). Only rewrite relative imports issued from
        // this package's own source — a relative import inside a bundled
        // node_modules dependency must stay a normal bundled import, since
        // that dependency's own file isn't one of this build's entries and
        // has no mirrored `dist/` location to rewrite against.
        if (toPosix(args.importer).includes("/node_modules/")) return;
        const target = resolveModuleFile(resolve(args.resolveDir, args.path));
        if (!target) return;
        const importerDir = dirname(args.importer);
        let rewritten = toPosix(relative(importerDir, target)).replace(/\.tsx?$/, ".js");
        if (!rewritten.startsWith(".")) rewritten = `./${rewritten}`;
        return { path: rewritten, external: true };
      });
    },
  };
}
