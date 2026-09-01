#!/usr/bin/env node

/**
 * Packed-tarball demo gate for `pnpm create vexcms`.
 *
 * Proves the WP-2 deliverable end to end, outside this repo, before the
 * alphas exist on npm: pack every publishable package, scaffold both
 * templates against those tarballs (not the workspace), and run a real
 * install + typecheck + build. This is the same class of proof
 * `scripts/check-packed-manifests.mjs --packed` uses for the manifest
 * invariants, extended to a full project build.
 *
 * Usage:
 *   node scripts/verify-scaffold.mjs             pack + scaffold both templates, install/typecheck/build each
 *   node scripts/verify-scaffold.mjs --keep      preserve the tmp pack/scaffold dirs for debugging
 *   node scripts/verify-scaffold.mjs --negative  AP-013 self-test: corrupt one override mapping and confirm
 *                                                 the pipeline (correctly) fails — see the file-level note
 *                                                 above `runNegativeSelfTest` for why exit is always 1
 *
 * Precondition (not performed here — a stale dist would silently pack stale
 * code): `pnpm --filter "@vexcms/*" --filter create-vexcms build`.
 *
 * Exits non-zero if any template's install/typecheck/build fails, or if the
 * negative self-test is requested (see above).
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const cliArgs = process.argv.slice(2);
const keep = cliArgs.includes("--keep");
const negative = cliArgs.includes("--negative");

/**
 * Derives the publishable package list from the workspace itself — a
 * hardcoded list already rotted once through the rebuild rename
 * (`@vexcms/ui` -> `@vexcms/react`, etc., see `sync-template-versions.mjs`).
 *
 * @returns {Array<{ dir: string, name: string }>} absolute package dir and
 *   its manifest name, for every non-private `packages/*` package.
 */
function readPublishablePackages() {
  const packagesDir = path.join(root, "packages");
  return fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packagesDir, entry.name))
    .map((dir) => ({ dir, pkgPath: path.join(dir, "package.json") }))
    .filter(({ pkgPath }) => fs.existsSync(pkgPath))
    .map(({ dir, pkgPath }) => ({
      dir,
      pkg: JSON.parse(fs.readFileSync(pkgPath, "utf-8")),
    }))
    .filter(({ pkg }) => pkg.name && !pkg.private)
    .map(({ dir, pkg }) => ({ dir, name: pkg.name }));
}

/**
 * Fails fast with a precise, actionable message instead of a confusing
 * `pnpm pack`/`ENOENT` failure deep inside the pipeline.
 *
 * @param {Array<{ dir: string, name: string }>} publishables
 */
function assertBuilt(publishables) {
  const missing = [];

  for (const { dir, name } of publishables) {
    if (name === "create-vexcms") continue; // checked precisely below
    if (!fs.existsSync(path.join(dir, "dist"))) missing.push(name);
  }

  const cliEntry = path.join(root, "packages/create-vexcms/dist/index.js");
  if (!fs.existsSync(cliEntry)) missing.push("create-vexcms");

  if (missing.length > 0) {
    throw new Error(
      `missing build output for: ${missing.join(", ")}.\n` +
        `  Run: pnpm --filter "@vexcms/*" --filter create-vexcms build\n` +
        `  (this gate packs and scaffolds only — it never rebuilds, so a stale dist would silently pack stale code)`
    );
  }
}

/**
 * Packs every publishable package with `pnpm pack`, one destination
 * directory per package (AP-017) — every package shares the same
 * `0.1.0-alpha.1` version, so a shared output dir makes "find the tarball
 * for this package" ambiguous and silently attributes the first tarball to
 * every package.
 *
 * @param {Array<{ dir: string, name: string }>} publishables
 * @param {string} outRoot existing tmp directory to pack into
 * @returns {Map<string, string>} package name -> absolute tarball path
 */
function packPublishables(publishables, outRoot) {
  const tarballs = new Map();

  for (const { dir, name } of publishables) {
    const outDir = path.join(outRoot, path.basename(dir));
    fs.mkdirSync(outDir, { recursive: true });

    execFileSync("pnpm", ["pack", "--pack-destination", outDir], {
      cwd: dir,
      stdio: "pipe",
    });

    const tarball = fs.readdirSync(outDir).find((file) => file.endsWith(".tgz"));
    if (!tarball) {
      throw new Error(`pnpm pack produced no .tgz for ${name} in ${outDir}`);
    }
    tarballs.set(name, path.join(outDir, tarball));
  }

  return tarballs;
}

/**
 * Runs one subprocess step with streamed stdio, recording pass/fail instead
 * of throwing — callers decide whether to continue the pipeline.
 *
 * @param {string} label human-readable step name for the summary
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 * @returns {{ label: string, ok: boolean, exitCode: number | null, ms: number }}
 */
function runStep(label, command, args, cwd) {
  console.log(`  \u2192 ${label}`);
  const start = Date.now();
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  const ok = result.status === 0;
  const ms = Date.now() - start;
  console.log(
    ok
      ? `  \u2713 ${label} (${ms}ms)`
      : `  \u2717 ${label} \u2014 exit ${result.status} (${ms}ms)`
  );
  return { label, ok, exitCode: result.status, ms };
}

/**
 * Points every packed package's dependents at its local tarball instead of
 * the registry, via `pnpm.overrides` — this is what makes the install
 * actually exercise what would ship, rather than whatever `@vexcms/*`
 * version last hit npm.
 *
 * @param {string} projectDir absolute path to a scaffolded project
 * @param {Map<string, string>} tarballs package name -> absolute tarball path
 */
function injectOverrides(projectDir, tarballs) {
  const pkgPath = path.join(projectDir, "package.json");
  if (!fs.existsSync(pkgPath)) {
    throw new Error(`${pkgPath} does not exist \u2014 scaffold did not produce a package.json`);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  pkg.pnpm = pkg.pnpm ?? {};
  pkg.pnpm.overrides = {
    ...pkg.pnpm.overrides,
    ...Object.fromEntries([...tarballs].map(([name, tarball]) => [name, `file:${tarball}`])),
  };

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

/**
 * Scaffolds one template via the built CLI, injects tarball overrides, then
 * runs install/typecheck/build — stopping at the first failing step so a
 * broken scaffold doesn't spend minutes typechecking a project that never
 * installed.
 *
 * @param {{ key: string, label: string, bare: boolean, cliEntry: string, scaffoldRoot: string, tarballs: Map<string, string> }} params
 * @returns {{ key: string, label: string, steps: Array<{ label: string, ok: boolean }> }}
 */
function runTemplate({ key, label, bare, cliEntry, scaffoldRoot, tarballs }) {
  console.log(`\n=== ${label} ===`);
  const steps = [];
  const ok = (step) => {
    steps.push(step);
    return step.ok;
  };

  const scaffoldArgs = [cliEntry, key, "--yes", ...(bare ? ["--bare"] : [])];
  if (!ok(runStep("scaffold (create-vexcms --yes)", "node", scaffoldArgs, scaffoldRoot))) {
    return { key, label, steps };
  }

  const projectDir = path.join(scaffoldRoot, key);
  const overrideStart = Date.now();
  try {
    injectOverrides(projectDir, tarballs);
    ok({ label: "inject pnpm.overrides", ok: true, ms: Date.now() - overrideStart });
    console.log(`  \u2713 inject pnpm.overrides (${Date.now() - overrideStart}ms)`);
  } catch (error) {
    ok({ label: "inject pnpm.overrides", ok: false, ms: Date.now() - overrideStart });
    console.error(`  \u2717 inject pnpm.overrides \u2014 ${error.message}`);
    return { key, label, steps };
  }

  const remainingSteps = [
    ["pnpm install", ["install", "--no-frozen-lockfile"]],
    ["pnpm typecheck", ["run", "typecheck"]],
    ["pnpm build", ["run", "build"]],
  ];
  for (const [stepLabel, args] of remainingSteps) {
    if (!ok(runStep(stepLabel, "pnpm", args, projectDir))) break;
  }

  return { key, label, steps };
}

/**
 * Templates exercised by the gate — `bare: true` drives the CLI's `--bare`
 * flag (base-nextjs shape, no marketing overlay), `bare: false` scaffolds
 * the full marketing-site overlay on top of it (Contract 2).
 */
const TEMPLATES = [
  { key: "base-nextjs", label: "templates/base-nextjs (--bare)", bare: true },
  { key: "marketing-site", label: "templates/marketing-site (full)", bare: false },
];

/**
 * @param {Array<{ key: string, label: string, steps: Array<{ label: string, ok: boolean }> }>} results
 * @returns {number} 0 if every template's steps were all green, else 1
 */
function printSummary(results) {
  console.log("\nSummary:");
  let failed = false;
  for (const { label, steps } of results) {
    const firstFailure = steps.find((step) => !step.ok);
    if (firstFailure) failed = true;
    console.log(
      firstFailure
        ? `  \u2717 ${label} \u2014 failed at "${firstFailure.label}"`
        : `  \u2713 ${label} \u2014 all steps green`
    );
  }
  return failed ? 1 : 0;
}

/**
 * AP-013 self-test: packs normally, then deliberately points the
 * `@vexcms/core` override at a tarball path that does not exist, and runs
 * the exact same `runTemplate` pipeline real invocations use (not a mocked
 * shortcut — a fake negative test that skips the real install proves
 * nothing).
 *
 * Both outcomes return 1 by design:
 * - `pnpm install` fails on the broken path (expected) \u2014 that failure is
 *   the proof this gate is not vacuously green.
 * - `pnpm install` unexpectedly succeeds \u2014 the override mechanism isn't
 *   actually pinning dependencies, which is the more alarming case and must
 *   not be allowed to exit 0 either.
 * The console message, not the exit code, tells a human which branch fired.
 *
 * @param {{ publishables: Array<{ dir: string, name: string }>, cliEntry: string }} params
 * @returns {number} always 1 \u2014 see above
 */
function runNegativeSelfTest({ publishables, cliEntry }) {
  console.log(
    "Negative self-test: pack normally, then corrupt the @vexcms/core override to point\n" +
      "at a tarball that does not exist. `pnpm install` MUST fail \u2014 that failure is what\n" +
      "proves this gate is not vacuously green (AP-013)."
  );

  const packRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vex-verify-negative-pack-"));
  const scaffoldRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vex-verify-negative-scaffold-"));

  try {
    const tarballs = packPublishables(publishables, packRoot);
    if (!tarballs.has("@vexcms/core")) {
      throw new Error("negative self-test expects @vexcms/core among the packed tarballs");
    }
    tarballs.set("@vexcms/core", path.join(packRoot, "core", "does-not-exist-0.0.0.tgz"));

    const { steps } = runTemplate({
      key: "negative-check",
      label: "negative self-test (--bare, broken @vexcms/core override)",
      bare: true,
      cliEntry,
      scaffoldRoot,
      tarballs,
    });

    const install = steps.find((step) => step.label === "pnpm install");
    if (install?.ok) {
      console.error(
        "\n\u2717 CRITICAL: pnpm install SUCCEEDED despite a broken @vexcms/core override mapping. " +
          "The override injection is not actually pinning the scaffold to local tarballs \u2014 " +
          "this gate cannot be trusted to catch a real packaging regression."
      );
      return 1;
    }

    console.log(
      "\n\u2713 negative self-test passed: pnpm install correctly failed on the broken mapping. " +
        "verify-scaffold.mjs is sensitive to a broken override, as required."
    );
    return 1;
  } finally {
    if (keep) {
      console.log(`--keep: preserved ${packRoot} and ${scaffoldRoot}`);
    } else {
      fs.rmSync(packRoot, { recursive: true, force: true });
      fs.rmSync(scaffoldRoot, { recursive: true, force: true });
    }
  }
}

function main() {
  console.log("verify-scaffold: packed-tarball demo gate\n");

  const publishables = readPublishablePackages();
  assertBuilt(publishables);
  const cliEntry = path.join(root, "packages/create-vexcms/dist/index.js");

  if (negative) {
    process.exit(runNegativeSelfTest({ publishables, cliEntry }));
  }

  const packRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vex-verify-pack-"));
  const scaffoldRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vex-verify-scaffold-"));

  let exitCode = 0;
  try {
    console.log(`Packing ${publishables.length} publishable package(s)...`);
    const tarballs = packPublishables(publishables, packRoot);
    for (const [name, tarball] of tarballs) {
      console.log(`  \u2713 ${name} \u2192 ${tarball}`);
    }

    const results = TEMPLATES.map((template) =>
      runTemplate({ ...template, cliEntry, scaffoldRoot, tarballs })
    );

    exitCode = printSummary(results);
  } finally {
    if (keep) {
      console.log(`\n--keep: preserved ${packRoot} and ${scaffoldRoot}`);
    } else {
      fs.rmSync(packRoot, { recursive: true, force: true });
      fs.rmSync(scaffoldRoot, { recursive: true, force: true });
    }
  }

  process.exit(exitCode);
}

try {
  main();
} catch (error) {
  console.error(`\nverify-scaffold: ${error.message}`);
  process.exit(1);
}
