#!/usr/bin/env node
import { rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { resolve } from "node:path";

import { ADMIN_DENY_LIST } from "./check-import-cost.mjs";

/**
 * The barrel Turbopack never emits as its own part (it unwraps `export *`
 * into one part per concrete icon file) — kept for a future bundler version
 * that stops unwrapping it; `checkRoute` pairs it with a fan-out count over
 * the icon leaf files, which is what actually fires today.
 */
export const LUCIDE_ALL_ICONS_PATTERN = /lucide-react\/dist\/esm\/icons\/index\.js/;

const LUCIDE_ICON_LEAF = /lucide-react\/dist\/esm\/icons\/[a-z0-9-]+\.js$/;
// Measured legitimate maximum is 44 (apps/www `/auth/sign-in`, from ordinary static imports across shadcn UI primitives and @daveyplate/better-auth-ui), far below the full 1703-icon set an `icons[name]` lookup reaches.
const MAX_STATIC_LUCIDE_ICONS = 200;

/**
 * The admin boundary in both path shapes `next analyze` can report:
 * `ADMIN_DENY_LIST`'s `dist/`-shaped patterns (what `apps/www` resolves to)
 * plus the `src/`-shaped equivalents (what `apps/test`'s `tsconfig.json`
 * `paths` resolves `@vexcms/react` to).
 */
export const SITE_DENY_LIST = [
  ...ADMIN_DENY_LIST,
  /packages\/react\/src\/adapter\.ts/,
  /packages\/react\/src\/fields\/registry\.tsx/,
  /packages\/react\/src\/(collections|globals|media)\/.*View/,
  /packages\/react\/src\/admin\/AdminLayout/,
  /packages\/react\/src\/ui\/(data-table|dnd)\//,
  LUCIDE_ALL_ICONS_PATTERN,
];

export const BETTER_AUTH_UI_PATTERN = /@daveyplate\/better-auth-ui/;

/** Friendly route name -> the Next.js route pattern that actually serves it. */
export const SITE_ROUTES = {
  "/": "/",
  "/features": "/[slug]",
  "/auth/sign-in": "/auth/[pathname]",
};

/**
 * KB per app per route, `Math.ceil(measuredKb * 1.1)`. Re-measure with
 * `--report` once the route's code has actually shipped the fix and replace
 * the constant here — a budget set before the code it bounds exists is a
 * guess, not a measurement.
 */
export const SITE_BUNDLE_BUDGETS = {
  "apps/www": { "/": 1987, "/features": 1987, "/auth/sign-in": 2329 },
  "apps/test": { "/": 1956, "/features": 1956, "/auth/sign-in": 2291 },
};

/**
 * The route's initial client JS: parts of the outputs of its `bootstrap` and
 * `render_dependent` groups (an `async` group only loads once something
 * dynamically `import()`s it, so it never counts toward the initial load),
 * restricted to client outputs (`/static/` in the filename), de-duplicated
 * by `source_path` (the same source can land in more than one output).
 */
export function initialClientParts(props) {
  const records = props.records;
  const initialFilenames = new Set();
  for (const r of records) {
    if (r.type !== "group") continue;
    if (r.kind !== "bootstrap" && r.kind !== "render_dependent") continue;
    for (const output of r.outputs) {
      if (output.includes("/static/")) initialFilenames.add(output);
    }
  }
  const seen = new Map();
  for (const r of records) {
    if (r.type !== "part") continue;
    if (!initialFilenames.has(r.filename)) continue;
    if (!seen.has(r.source_path)) seen.set(r.source_path, r);
  }
  return [...seen.values()];
}

function simplifyIdent(ident) {
  return ident
    .replace(/^\[project\]\//, "")
    .replace(/^\[externals\]\//, "")
    .replace(/node_modules\/\.pnpm\/[^/]+\/node_modules\//, "node_modules/")
    .replace(/ \[[a-z-]+\]( \(ecmascript[^)]*\))?.*$/, "");
}

function buildForwardGraph(records) {
  const graph = new Map();
  for (const r of records) {
    if (r.type !== "module") continue;
    graph.set(r.ident, [...(r.dependencies?.sync ?? []), ...(r.dependencies?.async ?? [])]);
  }
  return graph;
}

function findChain(graph, roots, test) {
  const queue = roots.map((root) => [root]);
  const visited = new Set(roots);
  while (queue.length > 0) {
    const path = queue.shift();
    const last = path[path.length - 1];
    if (test(last)) return path.map(simplifyIdent).join(" → ");
    for (const next of graph.get(last) ?? []) {
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push([...path, next]);
    }
  }
  return null;
}

/**
 * Checks one route's initial client JS against a KB budget and a deny list
 * of regexes tested against each initial part's `source_path`. A deny hit is
 * reported with the shortest import chain from the route's bootstrap/
 * render-dependent triggers to the matching module, reconstructed by walking
 * `module` records' `dependencies.sync`/`async`. `budgetKb: null` skips the
 * budget check (used by `--report`).
 */
export function checkRoute(props) {
  const { records, route, budgetKb, denyList } = props;
  const routeRecords = records.filter((r) => r.route === undefined || r.route === route);
  const parts = initialClientParts({ records: routeRecords });
  const totalKb = parts.reduce((sum, p) => sum + p.size, 0) / 1024;
  const violations = [];

  // An enforced route with no client parts means the analyzer never saw it
  // (the route pattern moved or was removed); passing at 0 KB would silently
  // disable the gate for exactly the route it should guard.
  if (budgetKb !== null && parts.length === 0) {
    violations.push(`${route}: no client parts in the analyzer export; the route pattern may have changed`);
  }
  if (budgetKb !== null && totalKb > budgetKb) {
    violations.push(`${route}: initial client JS is ${totalKb.toFixed(1)}KB, budget is ${budgetKb}KB`);
  }

  const graph = buildForwardGraph(routeRecords);
  const triggers = routeRecords
    .filter((r) => r.type === "group" && (r.kind === "bootstrap" || r.kind === "render_dependent"))
    .map((g) => g.trigger_module_ident);

  const lucideLeaves = new Set();
  for (const part of parts) {
    if (LUCIDE_ICON_LEAF.test(part.source_path)) lucideLeaves.add(part.source_path);
  }

  for (const pattern of denyList) {
    const hitPart = parts.find((p) => pattern.test(p.source_path));
    if (pattern === LUCIDE_ALL_ICONS_PATTERN && lucideLeaves.size > MAX_STATIC_LUCIDE_ICONS) {
      violations.push(
        `${route}: ${lucideLeaves.size} lucide-react icon modules in the initial bundle, more than the ${MAX_STATIC_LUCIDE_ICONS} a static import can produce (likely an "icons[name]" lookup reaching the whole set)`,
      );
      continue;
    }
    if (!hitPart) continue;
    const chain = findChain(graph, triggers, (ident) => pattern.test(ident));
    violations.push(`${route}: deny-listed import reachable (${chain ?? simplifyIdent(hitPart.source_path)})`);
  }

  return { totalKb, violations };
}

function run(command, args, options) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { ...options, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
      else resolvePromise();
    });
  });
}

async function streamExport(appDir, routePattern) {
  const child = spawn("npx", ["next", "analyze", "export", "--route", routePattern], {
    cwd: appDir,
    env: process.env,
    stdio: ["ignore", "pipe", "inherit"],
  });
  const rl = createInterface({ input: child.stdout, crlfDelay: Infinity });
  const records = [];
  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed) records.push(JSON.parse(trimmed));
  }
  await new Promise((resolvePromise, reject) => {
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolvePromise() : reject(new Error(`next analyze export exited ${code}`))));
  });
  return records;
}

async function main() {
  const args = process.argv.slice(2);
  const appIndex = args.indexOf("--app");
  if (appIndex === -1 || !args[appIndex + 1]) {
    console.error("Usage: check-site-bundle.mjs --app <dir> [--report]");
    process.exitCode = 1;
    return;
  }
  const appDir = resolve(args[appIndex + 1]);
  const appKey = args[appIndex + 1].replace(/\/$/, "");
  const reportOnly = args.includes("--report");
  const budgets = SITE_BUNDLE_BUDGETS[appKey];
  if (!budgets) {
    console.error(`No SITE_BUNDLE_BUDGETS entry for "${appKey}"`);
    process.exitCode = 1;
    return;
  }

  rmSync(resolve(appDir, ".next/diagnostics/analyze"), { recursive: true, force: true });
  rmSync(resolve(appDir, ".next/cache"), { recursive: true, force: true });
  await run("npx", ["next", "analyze", "-o"], { cwd: appDir, env: process.env });

  let failed = false;
  for (const [friendlyRoute, pattern] of Object.entries(SITE_ROUTES)) {
    const records = await streamExport(appDir, pattern);
    if (reportOnly) {
      const { totalKb } = checkRoute({ records, route: pattern, budgetKb: null, denyList: [] });
      console.log(`${appKey} ${friendlyRoute} (${pattern}): ${totalKb.toFixed(1)}KB`);
      continue;
    }
    const denyList = friendlyRoute === "/auth/sign-in" ? SITE_DENY_LIST : [...SITE_DENY_LIST, BETTER_AUTH_UI_PATTERN];
    const { totalKb, violations } = checkRoute({
      records,
      route: pattern,
      budgetKb: budgets[friendlyRoute],
      denyList,
    });
    console.log(`${appKey} ${friendlyRoute} (${pattern}): ${totalKb.toFixed(1)}KB (budget ${budgets[friendlyRoute]}KB)`);
    for (const violation of violations) {
      console.error(`  ✕ ${violation}`);
      failed = true;
    }
  }
  if (failed) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
