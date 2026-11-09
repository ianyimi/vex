#!/usr/bin/env node
/**
 * Regenerate a `create-vexcms` template's `convex/vex.schema.ts` and
 * `src/vex.types.ts` from its own `vex.config.ts`, without touching a Convex
 * deployment.
 *
 * Why this exists: templates are hand-maintained copies with no extraction
 * layer, so a change to code generation (a new injected field, a new validator
 * shape) leaves every template's generated artifacts stale. A stale
 * `vex.schema.ts` is not a cosmetic problem — the column it omits is one the
 * write path stamps, so a scaffolded project fails Convex schema validation on
 * its first save.
 *
 * `vex generate` only refreshes `vex.types.ts`, and `vex dev --once` pushes to
 * a live deployment. Templates have neither a deployment nor `node_modules`,
 * so this runs the generator directly with the deploy step stubbed out.
 *
 * `loadConfig`/`generateAndWrite`/`resolveConfigPath` are loaded from
 * TypeScript `src/` via `jiti` — not from `dist/` — the same way
 * `scripts/scaffold-smoke.mjs` loads `createInstaller`: there is no build step
 * between editing `packages/cli/src` and running this script, and plain
 * `node` cannot resolve `.ts` sources imported through `.js` specifiers
 * (`ERR_MODULE_NOT_FOUND`).
 *
 * `marketing-site` is a hand-maintained **overlay** on top of `base-nextjs`
 * (extra blocks, pages, and config on top of the base scaffold), not a
 * template this script can regenerate directly — pointing it at
 * `templates/marketing-site` will run against that overlay's own
 * `vex.config.ts`, not the base scaffold's, and can silently diverge from how
 * `apps/www` (its real source of truth) is generated. Regenerate
 * `marketing-site` by re-running the `create-vexcms` scaffold flow for that
 * template combination and re-applying the overlay, not by invoking this
 * script against it directly.
 *
 * Usage:
 *   node scripts/regen-template-schema.mjs <template-dir> [<template-dir> ...]
 */
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createJiti } from "jiti";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const jiti = createJiti(import.meta.url, { moduleCache: false, fsCache: false });

const { loadConfig } = await jiti.import(path.join(root, "packages/cli/src/lib/loadConfig.ts"));
const { generateAndWrite } = await jiti.import(path.join(root, "packages/cli/src/lib/generateSchema.ts"));
const { resolveConfigPath } = await jiti.import(path.join(root, "packages/cli/src/lib/resolveConfigPath.ts"));

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("usage: node scripts/regen-template-schema.mjs <template-dir> [...]");
  process.exit(2);
}

let failed = false;
for (const target of targets) {
  const cwd = path.resolve(target);
  try {
    const configPath = resolveConfigPath(cwd);
    const config = await loadConfig({ configPath, projectDir: cwd });
    // `pushSchema` is stubbed: there is no deployment behind a template, and a
    // push is not what regeneration means here.
    const result = await generateAndWrite(config, cwd, configPath, {
      pushSchema: async () => {},
    });
    console.log(`${target}: ${result.written ? "regenerated" : "no collections to emit"}`);
  } catch (error) {
    failed = true;
    console.error(`${target}: FAILED — ${error instanceof Error ? error.message : String(error)}`);
  }
}

process.exit(failed ? 1 : 0);
