import { build } from "esbuild";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { listModuleEntries, preserveModulesPlugin } from "./preserveModulesPlugin.mjs";

/**
 * @returns {{ root: string, srcDir: string }}
 */
function writeFixture() {
  const root = mkdtempSync(join(tmpdir(), "preserve-modules-"));
  const srcDir = join(root, "src");
  mkdirSync(join(srcDir, "dir"), { recursive: true });
  mkdirSync(join(srcDir, "internal"), { recursive: true });
  writeFileSync(
    join(srcDir, "index.ts"),
    'export * from "./a";\nexport * from "./dir";\nimport "react-dom";\n',
  );
  writeFileSync(
    join(srcDir, "a.tsx"),
    [
      '"use client";',
      'import { useState } from "react";',
      "export function A() {",
      "  const [n] = useState(0);",
      "  return n;",
      "}",
      "export async function loadB() {",
      '  return import("./dir/b");',
      "}",
    ].join("\n"),
  );
  writeFileSync(join(srcDir, "dir", "index.ts"), 'export * from "./b";\n');
  writeFileSync(
    join(srcDir, "dir", "b.tsx"),
    '"use client";\nexport function B() {\n  return 1;\n}\n',
  );
  writeFileSync(join(srcDir, "a.test.ts"), "export const skip = true;\n");
  writeFileSync(join(srcDir, "a.d.ts"), "export declare const skip: boolean;\n");
  writeFileSync(join(srcDir, "internal", "secret.ts"), "export const secret = 1;\n");
  return { root, srcDir };
}

/**
 * @param {string} srcDir
 * @param {string} outdir
 * @param {import("esbuild").Plugin[]} plugins
 * @returns {Promise<Record<string, string>>}
 */
async function buildFixture(srcDir, outdir, plugins) {
  const entries = listModuleEntries({ srcDir, exclude: [/^internal\//] });
  await build({
    entryPoints: entries,
    outdir,
    bundle: true,
    format: "esm",
    platform: "neutral",
    jsx: "automatic",
    packages: "external",
    sourcemap: false,
    logLevel: "silent",
    plugins,
  });
  return entries;
}

test("listModuleEntries skips test files, declaration files and excluded paths", () => {
  const { root, srcDir } = writeFixture();
  const entries = listModuleEntries({ srcDir, exclude: [/^internal\//] });
  assert.deepEqual(Object.keys(entries).sort(), ["a", "dir/b", "dir/index", "index"]);
  rmSync(root, { recursive: true, force: true });
});

test("preserveModulesPlugin emits one file per module mirroring src/, rewrites specifiers, keeps directives and dynamic imports lazy, and leaves packages external", async () => {
  const { root, srcDir } = writeFixture();
  const outdir = join(root, "dist");
  await buildFixture(srcDir, outdir, [preserveModulesPlugin({ srcDir })]);

  const index = readFileSync(join(outdir, "index.js"), "utf8");
  const a = readFileSync(join(outdir, "a.js"), "utf8");
  const dirIndex = readFileSync(join(outdir, "dir", "index.js"), "utf8");
  const dirB = readFileSync(join(outdir, "dir", "b.js"), "utf8");

  assert.match(index, /export \* from "\.\/a\.js"/);
  assert.match(index, /export \* from "\.\/dir\/index\.js"/);
  assert.match(index, /import "react-dom"/);

  assert.match(a, /^"use client";/);
  assert.match(a, /import\("\.\/dir\/b\.js"\)/);

  assert.match(dirIndex, /export \* from "\.\/b\.js"/);
  assert.match(dirB, /^"use client";/);

  rmSync(root, { recursive: true, force: true });
});

test("a broken specifier rewrite fails the build assertions", async () => {
  const { root, srcDir } = writeFixture();
  const outdir = join(root, "dist");
  const brokenPlugin = {
    name: "preserve-modules-broken",
    setup(pluginBuild) {
      pluginBuild.onResolve({ filter: /^\.\.?\// }, (args) => {
        if (args.kind === "entry-point") return;
        return { path: args.path, external: true };
      });
    },
  };
  await buildFixture(srcDir, outdir, [brokenPlugin]);
  const index = readFileSync(join(outdir, "index.js"), "utf8");
  assert.throws(() => {
    assert.match(index, /export \* from "\.\/a\.js"/);
  });

  rmSync(root, { recursive: true, force: true });
});

/**
 * Writes a fake `node_modules` dependency that ships a `.ts` source file
 * beside its compiled `.js` (as `convex-helpers` does) and a `src/` module
 * that imports it, so a preserve-modules build bundles the dependency the
 * way core's real build bundles `convex-helpers`.
 * @returns {{ root: string, srcDir: string }}
 */
function writeNodeModulesFixture() {
  const root = mkdtempSync(join(tmpdir(), "preserve-modules-nm-"));
  const srcDir = join(root, "src");
  const depDir = join(root, "node_modules", "fake-dep");
  mkdirSync(srcDir, { recursive: true });
  mkdirSync(join(depDir, "lib"), { recursive: true });
  writeFileSync(
    join(depDir, "package.json"),
    JSON.stringify({ name: "fake-dep", version: "1.0.0", main: "lib/index.js" }),
  );
  writeFileSync(
    join(depDir, "lib", "index.js"),
    'import { shared } from "../shared";\nexport function fakeDep() {\n  return shared;\n}\n',
  );
  writeFileSync(join(depDir, "shared.ts"), 'export const shared = "ts";\n');
  writeFileSync(join(depDir, "shared.js"), 'export const shared = "js";\n');
  writeFileSync(
    join(srcDir, "depUser.ts"),
    'import { fakeDep } from "fake-dep";\nexport function useDep() {\n  return fakeDep();\n}\n',
  );
  return { root, srcDir };
}

test("preserveModulesPlugin leaves a bundled dependency's own relative imports to esbuild, even when the dependency ships a .ts file beside its compiled .js", async () => {
  const { root, srcDir } = writeNodeModulesFixture();
  const outdir = join(root, "dist");
  const entries = listModuleEntries({ srcDir });
  await build({
    entryPoints: entries,
    outdir,
    bundle: true,
    format: "esm",
    platform: "node",
    sourcemap: false,
    logLevel: "silent",
    plugins: [preserveModulesPlugin({ srcDir })],
  });

  const depUser = readFileSync(join(outdir, "depUser.js"), "utf8");
  assert.match(depUser, /shared\s*=\s*"js"/);
  assert.doesNotMatch(depUser, /from\s+"\.\.?\/.*shared\.js"/);

  rmSync(root, { recursive: true, force: true });
});
