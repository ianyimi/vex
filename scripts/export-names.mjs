#!/usr/bin/env node

/**
 * Export-name baseline for `@vexcms/core` and `@vexcms/react`.
 *
 * Step 0 of the 2026-10-25-codebase-conventions-refactor spec: the refactor
 * moves source files around inside both packages (decision 7 removes the
 * `./convex` alias from core; everything else must keep its exact public
 * export-name surface). This script builds both packages, imports every
 * package-entry listed in their `exports` map, and records the sorted list
 * of export names per entry — a baseline the rest of the refactor can be
 * diffed against with `--check`.
 *
 * Usage:
 *   node scripts/export-names.mjs --write   build + import, write the baseline JSON
 *   node scripts/export-names.mjs --check   build + import, compare against the committed
 *                                            baseline, exit 1 and print a diff on mismatch
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const baselinePath = path.join(
  rootDir,
  ".agent/docs/specs/2026-10-25-codebase-conventions-refactor/export-names.baseline.json",
);

const PACKAGES = [
  {
    name: "@vexcms/core",
    dir: path.join(rootDir, "packages/core"),
    entries: {
      ".": "./dist/index.js",
      "./server": "./dist/server.js",
      "./internal": "./dist/internal.js",
    },
  },
  {
    name: "@vexcms/react",
    dir: path.join(rootDir, "packages/react"),
    entries: {
      ".": "./dist/index.js",
      "./client": "./dist/client/index.js",
      "./testing": "./dist/testing/index.js",
    },
  },
];

function build() {
  execFileSync(
    "pnpm",
    ["--filter", "@vexcms/core", "--filter", "@vexcms/react", "build"],
    { cwd: rootDir, stdio: "inherit" },
  );
}

async function collectExportNames() {
  // `@vexcms/react`'s `./testing` entry has side-effect imports that assume
  // a vitest test run: `@testing-library/jest-dom` calls `expect.extend(...)`
  // on vitest's `expect` global, and the shared harness touches DOM globals
  // (`Element`, `document`, …) a jsdom test environment normally provides.
  // Set both up the same way vitest's own jsdom environment does before
  // importing this entry from plain node.
  if (typeof globalThis.expect === "undefined") {
    const { expect } = await import("vitest");
    globalThis.expect = expect;
  }
  if (typeof globalThis.document === "undefined") {
    const { builtinEnvironments } = await import("vitest/runtime");
    await builtinEnvironments.jsdom.setup(globalThis, {});
  }
  const result = {};
  for (const pkg of PACKAGES) {
    result[pkg.name] = {};
    for (const [entry, relPath] of Object.entries(pkg.entries)) {
      const absPath = path.join(pkg.dir, relPath);
      if (!fs.existsSync(absPath)) {
        throw new Error(`${pkg.name}${entry === "." ? "" : entry}: built file not found at ${absPath}`);
      }
      const mod = await import(pathToFileURL(absPath).href);
      result[pkg.name][entry] = Object.keys(mod).sort();
    }
  }
  return result;
}

function diff(expected, actual) {
  const lines = [];
  const packages = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  for (const pkgName of packages) {
    const expectedEntries = expected[pkgName] ?? {};
    const actualEntries = actual[pkgName] ?? {};
    const entryNames = new Set([
      ...Object.keys(expectedEntries),
      ...Object.keys(actualEntries),
    ]);
    for (const entry of entryNames) {
      const expectedNames = expectedEntries[entry] ?? [];
      const actualNames = actualEntries[entry] ?? [];
      const added = actualNames.filter((n) => !expectedNames.includes(n));
      const removed = expectedNames.filter((n) => !actualNames.includes(n));
      if (added.length || removed.length) {
        lines.push(`${pkgName}${entry === "." ? "" : entry}:`);
        for (const name of removed) lines.push(`  - ${name}`);
        for (const name of added) lines.push(`  + ${name}`);
      }
    }
  }
  return lines.join("\n");
}

async function main() {
  const mode = process.argv.includes("--write")
    ? "write"
    : process.argv.includes("--check")
      ? "check"
      : null;

  if (!mode) {
    console.error("Usage: node scripts/export-names.mjs --write|--check");
    process.exit(1);
  }

  build();
  const actual = await collectExportNames();

  if (mode === "write") {
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    fs.writeFileSync(baselinePath, `${JSON.stringify(actual, null, 2)}\n`);
    console.log(`Wrote ${path.relative(rootDir, baselinePath)}`);
    return;
  }

  if (!fs.existsSync(baselinePath)) {
    console.error(`Baseline not found at ${path.relative(rootDir, baselinePath)}; run --write first.`);
    process.exit(1);
  }
  const expected = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  const diffText = diff(expected, actual);
  if (diffText) {
    console.error("Export-name mismatch:\n" + diffText);
    process.exit(1);
  }
  console.log("Export names match baseline.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
