#!/usr/bin/env node
/**
 * Reproduce the Vercel build for `apps/www` locally, from a pristine tree.
 *
 * Why this exists: two deploys failed in a row on faults that are invisible in
 * this working copy, because both were "a gitignored build output does not
 * exist yet". Vercel starts from a fresh clone — no `node_modules`, and no
 * `packages/*\/dist` — so anything resolved through a workspace package's
 * `exports` map is missing until that package is built. Locally those
 * directories are always populated, so the same command always passes.
 *
 * What it does:
 *  1. Copies exactly the files a fresh clone would have (`git ls-files` for
 *     tracked plus untracked-but-not-ignored), so UNCOMMITTED work is included
 *     and every build output is excluded. This is the whole point — run it
 *     before committing.
 *  2. `pnpm install --frozen-lockfile` in the copy.
 *  3. Runs the `buildCommand` from `apps/www/vercel.json`, with one
 *     substitution: `convex deploy` is replaced by an esbuild bundle of
 *     `convex/**` using Convex's own resolution conditions. That reproduces the
 *     import-resolution step verbatim without pushing to a deployment.
 *
 * What it cannot check: the push itself, which needs `CONVEX_DEPLOY_KEY`. Auth,
 * env-var and dashboard problems are out of scope; module resolution and the
 * Next.js build are in scope.
 *
 * Usage: node scripts/vercel-build-check.mjs [--keep]
 */

import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const APP = "apps/www";
const KEEP = process.argv.includes("--keep");

/** Placeholders mirroring `.github/workflows/release.yml` — real values never
 *  reach this run, and keeping validation ON means a newly required env var
 *  that nobody wired up still fails here (P-020). */
const BUILD_ENV = {
  BETTER_AUTH_SECRET: "ci-placeholder-not-a-real-secret",
  NEXT_PUBLIC_CONVEX_URL: "https://ci-placeholder.convex.cloud",
  NEXT_PUBLIC_CONVEX_SITE_URL: "https://ci-placeholder.convex.site",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3030",
};

let failures = 0;
const step = (msg) => console.log(`\n\u001b[36m▶ ${msg}\u001b[0m`);
const ok = (msg) => console.log(`  \u001b[32m✓\u001b[0m ${msg}`);
const bad = (msg) => {
  failures += 1;
  console.log(`  \u001b[31m✘\u001b[0m ${msg}`);
};

step("Collecting the files a fresh clone would have");
const files = execFileSync("git", ["ls-files", "-c", "-o", "--exclude-standard"], {
  cwd: ROOT,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
})
  .split("\n")
  .filter(Boolean);
ok(`${files.length} tracked + untracked-not-ignored files`);

const work = mkdtempSync(join(tmpdir(), "vercel-build-check-"));
console.log(`  workdir: ${work}`);
for (const f of files) {
  const src = join(ROOT, f);
  const dest = join(work, f);
  mkdirSync(dirname(dest), { recursive: true });
  // `git ls-files -o` collapses a wholly-untracked directory to a single
  // entry with a trailing slash, so entries are not guaranteed to be files.
  cpSync(src, dest, statSync(src).isDirectory() ? { recursive: true } : {});
}
for (const guard of ["node_modules", "packages/core/dist", "packages/cli/dist"]) {
  if (existsSync(join(work, guard))) bad(`${guard} leaked into the pristine copy`);
}
if (!failures) ok("no node_modules and no package dist — matches a fresh clone");

step("pnpm install --frozen-lockfile");
const install = spawnSync("pnpm", ["install", "--frozen-lockfile"], {
  cwd: work,
  stdio: "inherit",
  env: { ...process.env, CI: "1" },
});
if (install.status !== 0) {
  bad("install failed — nothing further can be trusted");
  process.exit(1);
}
ok("dependencies installed");

const vercelJson = JSON.parse(readFileSync(join(work, APP, "vercel.json"), "utf8"));
const buildCommand = vercelJson.buildCommand ?? "pnpm build";
step(`vercel.json buildCommand: ${buildCommand}`);

// Split the command so `convex deploy` can be swapped for a push-free
// equivalent while every other segment runs exactly as Vercel runs it.
const segments = buildCommand.split("&&").map((s) => s.trim());
for (const segment of segments) {
  const isDeploy = /convex\s+deploy|deploy:convex/.test(segment);
  if (isDeploy) {
    step(`[substituted] ${segment}  →  esbuild resolve convex/** (no push)`);
    const probe = `
      const { createRequire } = require('node:module');
      const fs = require('node:fs');
      // esbuild is convex's own bundler and only a transitive dependency here,
      // so resolve it the way convex does rather than from this app.
      let esbuild;
      try {
        esbuild = createRequire(require.resolve('convex/package.json'))('esbuild');
      } catch (err) {
        console.error('    HARNESS ERROR: could not load esbuild via convex — ' + err.message);
        process.exit(2);
      }
      const walk = (d) => fs.readdirSync(d, { withFileTypes: true })
        .flatMap((e) => e.isDirectory() ? walk(d + '/' + e.name) : [d + '/' + e.name]);
      const entries = walk('convex').filter((f) => /\\.ts$/.test(f) && !f.includes('/_generated/'));
      esbuild.build({
        entryPoints: entries,
        bundle: true,
        write: false,
        // esbuild requires outdir whenever there are multiple entry points,
        // even with writing disabled. Nothing is emitted.
        outdir: 'esbuild-probe-out',
        platform: 'browser',
        format: 'esm',
        conditions: ['import'],
        external: ['convex', 'convex/*'],
        logLevel: 'error',
      }).then(() => { console.log('    bundled ' + entries.length + ' convex modules'); })
        .catch(() => process.exit(1));
    `;
    const r = spawnSync("node", ["-e", probe], { cwd: join(work, APP), stdio: "inherit" });
    if (r.status === 0) ok("every convex/** import resolves through the built packages");
    else if (r.status === 2) bad("harness could not run the resolution probe (not a build failure)");
    else bad("convex/** bundle failed — this is the deploy-time error, reproduced");
    continue;
  }

  step(`${segment}`);
  const [cmd, ...args] = segment.split(/\s+/);
  const r = spawnSync(cmd, args, {
    cwd: join(work, APP),
    stdio: "inherit",
    env: { ...process.env, ...BUILD_ENV, CI: "1" },
  });
  if (r.status === 0) ok(`${segment} succeeded`);
  else bad(`${segment} exited ${r.status}`);
}

if (KEEP) console.log(`\nworkdir kept: ${work}`);
else rmSync(work, { recursive: true, force: true });

console.log(
  failures === 0
    ? "\n\u001b[32mvercel-build-check passed\u001b[0m — resolution and build are clean from a pristine tree.\n  Not covered: the actual push (needs CONVEX_DEPLOY_KEY)."
    : `\n\u001b[31mvercel-build-check FAILED\u001b[0m — ${failures} problem(s); Vercel will fail the same way.`,
);
process.exit(failures === 0 ? 0 : 1);
