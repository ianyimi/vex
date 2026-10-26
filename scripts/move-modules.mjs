#!/usr/bin/env node
/**
 * Moves a batch of files with `git mv` and rewrites every relative import,
 * export, dynamic `import()`, and `vi.mock(...)` specifier under
 * `packages/react/src/**` so it still resolves after the move — both the
 * importers that reference a moved file, and a moved file's own outgoing
 * relative imports.
 *
 * Usage:
 *   node scripts/move-modules.mjs <mapping.json> [--dry-run]
 *
 * `mapping.json` is an array of `{ from, to }` objects, paths relative to
 * the repo root, e.g.:
 *   [{ "from": "packages/react/src/components/ui/button.tsx",
 *      "to": "packages/react/src/ui/button.tsx" }]
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = "packages/react/src";
const SPECIFIER_RE =
  /((?:from|import)\s*\(?\s*|vi\.mock\(\s*)(["'])(\.\.?\/[^"']*)\2/g;

/**
 * @param {string} root - absolute repo root
 * @param {string} repoRelativePath
 * @returns {string} absolute filesystem path
 */
function abs(root, repoRelativePath) {
  return join(root, repoRelativePath);
}

/**
 * Strips a trailing `.ts`/`.tsx` extension and an `/index` segment from a
 * resolved repo-relative path, matching the extension-less + index-folding
 * import style this codebase writes.
 *
 * @param {string} repoRelativePath
 * @returns {string}
 */
function toImportTarget(repoRelativePath) {
  const noExt = repoRelativePath.replace(/\.(tsx|ts)$/, "");
  return noExt.endsWith("/index") ? noExt.slice(0, -"/index".length) : noExt;
}

/**
 * Resolves a relative import specifier written in `fromFile` to the
 * repo-relative file it points at, trying both the bare path and `/index`.
 *
 * @param {string} root - absolute repo root
 * @param {string} fromFile - repo-relative path of the file containing the specifier
 * @param {string} specifier - the relative import specifier
 * @param {Set<string>} knownFiles - every repo-relative `.ts`/`.tsx` path in the source tree
 * @returns {string | undefined} the repo-relative file the specifier resolves to
 */
function resolveSpecifier(root, fromFile, specifier, knownFiles) {
  const base = relative(root, resolve(dirname(abs(root, fromFile)), specifier));
  for (const candidate of [
    `${base}.ts`,
    `${base}.tsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ]) {
    if (knownFiles.has(candidate)) return candidate;
  }
  return undefined;
}

/**
 * Rewrites every relative import/export/`import()`/`vi.mock()` specifier in
 * `content` that resolves to a moved file, pointing it at that file's new
 * location — relative to where `content` now lives.
 *
 * @param {string} root - absolute repo root
 * @param {string} content
 * @param {string} oldFromFile - repo-relative path `content` was written at (pre-move)
 * @param {string} newFromFile - repo-relative path `content` lives at now (post-move)
 * @param {Map<string, string>} moves - repo-relative `from` -> repo-relative `to`
 * @param {Set<string>} knownFiles
 * @returns {string}
 */
function rewriteSpecifiers(root, content, oldFromFile, newFromFile, moves, knownFiles) {
  return content.replace(SPECIFIER_RE, (full, prefix, quote, specifier) => {
    const resolved = resolveSpecifier(root, oldFromFile, specifier, knownFiles);
    const target = resolved && moves.has(resolved) ? moves.get(resolved) : resolved;
    if (!resolved) return full;
    if (!moves.has(resolved) && newFromFile === oldFromFile) return full;
    const newSpecifier = relative(dirname(abs(root, newFromFile)), abs(root, toImportTarget(target)));
    const withDot = newSpecifier.startsWith(".") ? newSpecifier : `./${newSpecifier}`;
    return `${prefix}${quote}${withDot}${quote}`;
  });
}


/**
 * Recursively collects every `.ts`/`.tsx` file under `dir`.
 *
 * @param {string} dir - absolute directory to walk
 * @returns {string[]} absolute file paths
 */
function walkTsFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkTsFiles(full));
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      results.push(full);
    }
  }
  return results;
}

/**
 * @param {string[]} argv
 * @returns {{ mappingPath: string, dryRun: boolean }}
 */
function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const mappingPath = argv.find((a) => !a.startsWith("--"));
  if (!mappingPath) {
    throw new Error("usage: node scripts/move-modules.mjs <mapping.json> [--dry-run]");
  }
  return { mappingPath, dryRun };
}

/**
 * Moves every file in `mapping` with `git mv` (creating destination
 * directories as needed) and rewrites every relative import/export/
 * `import()`/`vi.mock()` specifier under `packages/react/src/**` that
 * resolves to a moved file.
 *
 * @param {{ from: string, to: string }[]} mapping
 * @param {{ dryRun?: boolean, repoRoot?: string }} [options]
 * @returns {{ moved: { from: string, to: string }[], edits: { file: string, before: string, after: string }[] }}
 */
export function moveModules(mapping, options = {}) {
  const dryRun = options.dryRun ?? false;
  const root = options.repoRoot ?? REPO_ROOT;
  const moves = new Map(mapping.map((m) => [m.from, m.to]));

  // Captured before any git mv runs, so specifiers in every file's current
  // (pre-move) content resolve against the tree they were actually written for.
  const knownFiles = new Set(
    walkTsFiles(join(root, SOURCE_DIR)).map((p) => relative(root, p).split("\\").join("/")),
  );

  const moved = [];
  for (const { from, to } of mapping) {
    if (!dryRun) {
      mkdirSync(dirname(join(root, to)), { recursive: true });
      execFileSync("git", ["mv", from, to], { cwd: root, stdio: "inherit" });
    }
    moved.push({ from, to });
  }

  const edits = [];
  for (const oldFile of knownFiles) {
    const newFile = moves.get(oldFile) ?? oldFile;
    const readPath = dryRun ? abs(root, oldFile) : abs(root, newFile);
    if (!existsSync(readPath)) continue;
    const before = readFileSync(readPath, "utf8");
    const after = rewriteSpecifiers(root, before, oldFile, newFile, moves, knownFiles);
    if (after !== before) {
      edits.push({ file: newFile, before, after });
      if (!dryRun) writeFileSync(abs(root, newFile), after);
    }
  }

  return { moved, edits };
}

async function main() {
  const { mappingPath, dryRun } = parseArgs(process.argv.slice(2));
  const mapping = JSON.parse(readFileSync(resolve(process.cwd(), mappingPath), "utf8"));
  const { moved, edits } = moveModules(mapping, { dryRun });
  for (const { from, to } of moved) {
    console.log(`${dryRun ? "[dry-run] " : ""}git mv ${from} ${to}`);
  }
  for (const { file, before, after } of edits) {
    console.log(`\n--- ${file} ---`);
    const beforeLines = before.split("\n");
    const afterLines = after.split("\n");
    for (let i = 0; i < Math.max(beforeLines.length, afterLines.length); i++) {
      if (beforeLines[i] !== afterLines[i]) {
        if (beforeLines[i] !== undefined) console.log(`- ${beforeLines[i]}`);
        if (afterLines[i] !== undefined) console.log(`+ ${afterLines[i]}`);
      }
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
