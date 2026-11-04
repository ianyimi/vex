#!/usr/bin/env node

/**
 * Verifies an app (or scaffolded project) wires `afterChange`/`afterDelete`
 * triggers correctly: `convex/vex.ts` builds its `mutation`/`internalMutation`
 * through `createVexMutations` (`@vexcms/core/server`), and `convex/vex/
 * globals.ts`/`convex/vex/media.ts` consume that wrapped `mutation` rather
 * than importing the raw builder straight off `./_generated/server`. A write
 * made through the raw builder never fires a collection's `afterChange`/
 * `afterDelete` hooks — silently, since nothing about the write itself fails.
 *
 * Reused, not duplicated, by `scripts/verify-scaffold.mjs` against a freshly
 * scaffolded project directory.
 *
 * Usage:
 *   node scripts/verify-hooks-wiring.mjs <app-dir> [<app-dir> ...]
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WRAPPER_FILE = "convex/vex.ts";
const CONSUMER_FILES = ["convex/vex/globals.ts", "convex/vex/media.ts"];

/**
 * @param {string} absPath
 * @returns {string | null} File contents, or `null` if the file doesn't exist.
 */
function readSourceIfPresent(absPath) {
  try {
    return readFileSync(absPath, "utf8");
  } catch {
    return null;
  }
}

/**
 * Checks whether `source` imports a binding literally named `mutation` from
 * a `.../_generated/server` module specifier — the regression this script
 * exists to catch in `globals.ts`/`media.ts`, which must instead import the
 * trigger-wrapped `vexMutation as mutation` from the local `./vex` module.
 *
 * @param {string} source
 * @returns {boolean}
 */
function importsBareMutationFromGenerated(source) {
  const importRe = /import\s*\{([^}]*)\}\s*from\s*["'][^"']*_generated\/server["']/g;
  let match;
  while ((match = importRe.exec(source))) {
    const specifiers = match[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const spec of specifiers) {
      const asMatch = spec.match(/^(\S+)\s+as\s+(\S+)$/);
      const localName = asMatch ? asMatch[2] : spec;
      if (localName === "mutation") return true;
    }
  }
  return false;
}

/**
 * Checks one app directory's hooks wiring. Missing files are skipped, not
 * failures — not every app necessarily ships a `vex/media.ts`, and a project
 * with no Convex wiring at all (e.g. a stripped-down scaffold) has nothing to
 * regress.
 *
 * @param {string} appDir Absolute or repo-relative path to an app/project
 *   directory containing a `convex/` folder.
 * @returns {string[]} Error messages, one per violation found; empty when clean.
 */
function verifyAppHooksWiring(appDir) {
  const errors = [];

  const wrapperPath = path.join(appDir, WRAPPER_FILE);
  const wrapperSource = readSourceIfPresent(wrapperPath);
  if (wrapperSource !== null && !/createVexMutations\s*\(/.test(wrapperSource)) {
    errors.push(
      `${wrapperPath}: no createVexMutations(...) call found \u2014 writes through this app's ` +
        `mutation/internalMutation builders bypass afterChange/afterDelete hooks`,
    );
  }

  for (const rel of CONSUMER_FILES) {
    const filePath = path.join(appDir, rel);
    const source = readSourceIfPresent(filePath);
    if (source === null) continue;
    if (importsBareMutationFromGenerated(source)) {
      errors.push(
        `${filePath}: imports "mutation" directly from _generated/server \u2014 expected the ` +
          `trigger-wrapped "vexMutation as mutation" import from "../vex"`,
      );
    }
  }

  return errors;
}

/**
 * Verifies hooks wiring across every given app/project directory.
 *
 * @param {string[]} appDirs
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function verifyHooksWiring(appDirs) {
  const errors = appDirs.flatMap((appDir) => verifyAppHooksWiring(appDir));
  return { ok: errors.length === 0, errors };
}

async function main() {
  const appDirs = process.argv.slice(2);
  if (appDirs.length === 0) {
    console.error("usage: verify-hooks-wiring.mjs <app-dir> [<app-dir> ...]");
    process.exit(2);
  }

  const { ok, errors } = verifyHooksWiring(appDirs);
  if (!ok) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }

  console.log(`verify-hooks-wiring: OK (${appDirs.length} app${appDirs.length === 1 ? "" : "s"})`);
}

const isMain = path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? "");
if (isMain) {
  await main();
}
