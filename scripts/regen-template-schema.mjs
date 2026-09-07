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
 * Usage:
 *   node scripts/regen-template-schema.mjs <template-dir> [<template-dir> ...]
 */
import path from "node:path";
import process from "node:process";

import { loadConfig } from "../packages/cli/src/lib/loadConfig.js";
import { generateAndWrite } from "../packages/cli/src/lib/generateSchema.js";
import { resolveConfigPath } from "../packages/cli/src/lib/resolveConfigPath.js";

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
    const config = await loadConfig(configPath);
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
