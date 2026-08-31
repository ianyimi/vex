/**
 * Verifies the repo's dependency-declaration invariants.
 *
 * Checks are registered in `allChecks` and selected by `--<id>` flags; no flags
 * runs all of them. An unmatched flag is a hard error rather than a silent
 * empty run — a gate that reports success while checking nothing is worse than
 * no gate at all.
 *
 * - `sweep`: every dependencies/devDependencies value in every workspace
 *   manifest is `catalog:`, `catalog:<name>`, or a `workspace:` specifier.
 *   This is what makes pnpm-workspace.yaml the single place a version can move.
 * - `packed`: added in step 4.
 *
 * Exits non-zero with a per-violation report. Wired into CI by WP-1 step 4.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import os from "node:os";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Collects every workspace manifest, root included.
 *
 * @returns {Array<{ relPath: string, pkg: Record<string, unknown> }>} one entry
 *   per `package.json`, in a stable order (root first, then `packages/*`, then
 *   `apps/*`).
 */
function readWorkspaceManifests() {
  const dirs = ["packages", "apps"].flatMap((group) => {
    const groupDir = path.join(root, group);
    if (!fs.existsSync(groupDir)) return [];
    return fs
      .readdirSync(groupDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(group, entry.name));
  });

  return ["", ...dirs]
    .map((dir) => path.join(dir, "package.json"))
    .filter((relPath) => fs.existsSync(path.join(root, relPath)))
    .map((relPath) => ({
      relPath,
      pkg: JSON.parse(fs.readFileSync(path.join(root, relPath), "utf-8")),
    }));
}

const allowedSpec = /^(catalog:[a-z]*|workspace:[*^~].*)$/;

/**
 * Asserts that no runtime or dev dependency declares a literal version.
 *
 * @returns {string[]} human-readable violations; empty means the check passed.
 */
function checkSweep() {
  const violations = [];

  for (const { relPath, pkg } of readWorkspaceManifests()) {
    for (const field of ["dependencies", "devDependencies"]) {
      for (const [name, spec] of Object.entries(pkg[field] ?? {})) {
        if (allowedSpec.test(spec)) continue;
        violations.push(
          `${relPath} → ${field}.${name} = "${spec}" (expected "catalog:" or a workspace: specifier)`
        );
      }
    }
  }

  return violations;
}

const exactVersion = /^\d+\.\d+\.\d+(-[\w.]+)?$/;
const unresolvedSpec = /^(catalog:|workspace:)/;
const rangeSpec = /[~^><*]|\|\|/;

/**
 * Packs every publishable package with pnpm and asserts the published
 * dependency invariants on the resulting manifest.
 *
 * Three invariants, one per failure mode this spec exists to prevent:
 * 1. No value still reads `catalog:` or `workspace:` — those are uninstallable
 *    for a consumer and mean the pack step did not resolve them.
 * 2. No `peerDependencies` value is a bare exact version — that is the convex
 *    1.45.0 conflict.
 * 3. No `dependencies` value is a range — that is the silent-drift hole.
 *
 * @returns {string[]} human-readable violations; empty means the check passed.
 */
function checkPacked() {
  const violations = [];
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vex-packed-"));

  const publishable = readWorkspaceManifests().filter(
    ({ relPath, pkg }) =>
      relPath.startsWith("packages/") && pkg.name && !pkg.private
  );

  for (const { relPath, pkg } of publishable) {
    const cwd = path.join(root, path.dirname(relPath));

    // One destination per package. Every package shares the same version, so a
    // shared directory makes "find the .tgz for this package" ambiguous and
    // silently attributes the first tarball's manifest to all 8.
    const outDir = path.join(outRoot, path.basename(path.dirname(relPath)));
    fs.mkdirSync(outDir);

    execFileSync("pnpm", ["pack", "--pack-destination", outDir], {
      cwd,
      stdio: "pipe",
    });

    const tarballs = fs.readdirSync(outDir).filter((file) => file.endsWith(".tgz"));
    if (tarballs.length !== 1) {
      violations.push(
        `${pkg.name} → expected exactly 1 tarball, got ${tarballs.length}: ${tarballs.join(", ")}`
      );
      continue;
    }

    const manifest = JSON.parse(
      execFileSync("tar", ["-xzOf", path.join(outDir, tarballs[0]), "package/package.json"], {
        encoding: "utf-8",
      })
    );

    for (const [name, spec] of Object.entries(manifest.dependencies ?? {})) {
      if (unresolvedSpec.test(spec)) {
        violations.push(`${pkg.name} → dependencies.${name} = "${spec}" is unresolved`);
      } else if (rangeSpec.test(spec)) {
        violations.push(`${pkg.name} → dependencies.${name} = "${spec}" is a range (must be exact)`);
      }
    }

    for (const [name, spec] of Object.entries(manifest.peerDependencies ?? {})) {
      if (unresolvedSpec.test(spec)) {
        violations.push(`${pkg.name} → peerDependencies.${name} = "${spec}" is unresolved`);
      } else if (exactVersion.test(spec)) {
        violations.push(
          `${pkg.name} → peerDependencies.${name} = "${spec}" is exact (must be a range)`
        );
      }
    }
  }

  fs.rmSync(outRoot, { force: true, recursive: true });
  return violations;
}

/** @type {Array<{ id: string, label: string, run: () => string[] }>} */
const allChecks = [
  { id: "sweep", label: "catalog sweep", run: checkSweep },
  { id: "packed", label: "packed manifests", run: checkPacked },
];

const selected = process.argv
  .slice(2)
  .filter((arg) => arg.startsWith("--"))
  .map((arg) => arg.slice(2));

const checks =
  selected.length === 0
    ? allChecks
    : allChecks.filter((check) => selected.includes(check.id));

if (checks.length === 0) {
  console.error(
    `no check matches ${selected.join(", ")}; known ids: ${allChecks.map((c) => c.id).join(", ")}`
  );
  process.exit(2);
}

let failed = false;
for (const { label, run } of checks) {
  const violations = run();
  if (violations.length === 0) {
    console.log(`✓ ${label}`);
    continue;
  }
  failed = true;
  console.error(`✗ ${label} — ${violations.length} violation(s):`);
  for (const violation of violations) console.error(`    ${violation}`);
}

process.exit(failed ? 1 : 0);
