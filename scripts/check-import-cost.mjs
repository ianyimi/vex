#!/usr/bin/env node

/**
 * Package import-cost gate for `@vexcms/react`.
 *
 * Bundles a handful of tiny consumer fixtures with esbuild against the
 * workspace's built `dist` directories (honouring `sideEffects` and
 * tree-shaking ESM the way a consumer's own bundler would), then asserts
 * each fixture stays under its byte budget and never pulls in a
 * deny-listed admin module.
 *
 * Usage:
 *   node scripts/check-import-cost.mjs            build + enforce, exit 1 on any violation
 *   node scripts/check-import-cost.mjs --report    build + print bytes only, never fails
 */

import esbuild from "esbuild";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");

const EXTERNAL = ["react", "react-dom", "react/jsx-runtime", "next", "next/*"];

export const ADMIN_DENY_LIST = [
  /packages\/react\/dist\/adapter\.js$/,
  /packages\/react\/dist\/fields\/registry\.js$/,
  /packages\/react\/dist\/(collections|globals|media)\/.*View/,
  /packages\/react\/dist\/admin\/AdminLayout/,
  /packages\/react\/dist\/ui\/(data-table|dnd)\//,
  /@tanstack\/react-table/,
  /@tanstack\/table-core/,
  /@hello-pangea\/dnd/,
  /lucide-react\/dist\/esm\/icons\/index\.js/,
];

export const IMPORT_COST_FIXTURES = [
  {
    name: "useLivePreviewQuery-only",
    source: 'import { useLivePreviewQuery } from "@vexcms/react";\nconsole.log(useLivePreviewQuery);\n',
    budgetBytes: 15_999,
    denyList: ADMIN_DENY_LIST,
  },
  {
    name: "cn-only",
    source: 'import { cn } from "@vexcms/react";\nconsole.log(cn);\n',
    budgetBytes: 29_203,
    denyList: ADMIN_DENY_LIST,
  },
  {
    name: "root-reach",
    source: `export * from "@vexcms/react";`,
    budgetBytes: null,
    denyList: ADMIN_DENY_LIST,
  },
];

/**
 * @param {{ bytes: number, imports: { path: string }[] } | undefined} input
 * @returns {{ path: string }[]}
 */
function importsOf(input) {
  return input?.imports ?? [];
}

/**
 * @param {{ metafile: import("esbuild").Metafile, start: string, target: string }} props
 * @returns {string[] | null}
 */
function breadthFirstChain(props) {
  const { metafile, start, target } = props;
  const predecessor = new Map([[start, null]]);
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === target) break;
    for (const imp of importsOf(metafile.inputs[current])) {
      if (predecessor.has(imp.path)) continue;
      predecessor.set(imp.path, current);
      queue.push(imp.path);
    }
  }
  if (!predecessor.has(target)) return null;
  const chain = [];
  for (let node = target; node !== null; node = predecessor.get(node)) {
    chain.unshift(node);
  }
  return chain;
}

/**
 * @param {{ metafile: import("esbuild").Metafile, budgetBytes: number | null, denyList: RegExp[] }} props
 * @returns {{ bytes: number, violations: string[] }}
 */
export function analyzeMetafile(props) {
  const { metafile, budgetBytes, denyList } = props;
  const bytes = Object.values(metafile.outputs).reduce((sum, output) => sum + output.bytes, 0);
  const entryPoints = Object.values(metafile.outputs)
    .map((output) => output.entryPoint)
    .filter((entryPoint) => entryPoint !== undefined);

  const violations = [];
  const bundledInputs = new Set();
  for (const output of Object.values(metafile.outputs)) {
    for (const [inputPath, input] of Object.entries(output.inputs)) {
      if (input.bytesInOutput > 0) bundledInputs.add(inputPath);
    }
  }
  for (const inputPath of bundledInputs) {
    if (!denyList.some((pattern) => pattern.test(inputPath))) continue;
    const chain = entryPoints
      .map((start) => breadthFirstChain({ metafile, start, target: inputPath }))
      .find((found) => found !== null);
    violations.push(
      chain ? `${inputPath} reachable via ${chain.join(" → ")}` : `${inputPath} matches the admin deny list`,
    );
  }

  if (budgetBytes !== null && bytes > budgetBytes) {
    violations.push(`bundle is ${bytes} bytes, over the ${budgetBytes} byte budget`);
  }

  return { bytes, violations };
}

/**
 * @param {{ packageDir: string, packageName: string }} props
 * @returns {Record<string, string>}
 */
function buildPackageAlias(props) {
  const { packageDir, packageName } = props;
  const manifest = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
  const alias = {};
  for (const [subpath, target] of Object.entries(manifest.exports ?? {})) {
    const importPath = typeof target === "string" ? target : (target.import ?? target.default);
    if (typeof importPath !== "string") continue;
    const specifier = subpath === "." ? packageName : `${packageName}/${subpath.slice(2)}`;
    alias[specifier] = join(packageDir, importPath);
  }
  return alias;
}

const ALIAS = {
  ...buildPackageAlias({ packageDir: join(ROOT_DIR, "packages/react"), packageName: "@vexcms/react" }),
  ...buildPackageAlias({ packageDir: join(ROOT_DIR, "packages/core"), packageName: "@vexcms/core" }),
};

/**
 * @param {{ fixture: (typeof IMPORT_COST_FIXTURES)[number] }} props
 * @returns {Promise<{ bytes: number, violations: string[] }>}
 */
async function buildFixture(props) {
  const { fixture } = props;
  const result = await esbuild.build({
    stdin: {
      contents: fixture.source,
      resolveDir: ROOT_DIR,
      sourcefile: `${fixture.name}.ts`,
      loader: "ts",
    },
    bundle: true,
    format: "esm",
    platform: "browser",
    minify: true,
    metafile: true,
    write: false,
    external: EXTERNAL,
    alias: ALIAS,
    logLevel: "silent",
  });
  return analyzeMetafile({ metafile: result.metafile, budgetBytes: fixture.budgetBytes, denyList: fixture.denyList });
}

async function main() {
  const report = process.argv.includes("--report");
  const rows = [];
  let failed = false;

  for (const fixture of IMPORT_COST_FIXTURES) {
    const { bytes, violations } = await buildFixture({ fixture });
    rows.push({
      fixture: fixture.name,
      bytes,
      "budget (+10%)": fixture.budgetBytes ?? "—",
      violations: violations.length,
    });
    if (!report) {
      for (const violation of violations) {
        console.error(`✘ ${fixture.name}: ${violation}`);
        failed = true;
      }
    }
  }

  console.table(rows);
  if (!report && failed) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
