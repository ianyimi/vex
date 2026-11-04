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
import { execFileSync, spawnSync } from "node:child_process";
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

const RICHTEXT_CONSUMER_PACKAGES = [
  "@vexcms/core",
  "@vexcms/react",
  "@vexcms/richtext-plate",
];

/**
 * Reads one literal version string out of `pnpm-workspace.yaml`'s top-level
 * `catalog:` block by name — enough for the handful of keys the richtext
 * consumer probe's throwaway `package.json` needs (`react`, `react-dom`,
 * `typescript`, `@types/react`, `@types/react-dom`), without adding a YAML
 * dependency to a zero-dependency script.
 *
 * @param {string} name catalog key, e.g. `"react"` or `"@types/react"`
 * @returns {string} the version string recorded in the catalog
 */
function readCatalogVersion(name) {
  const text = fs.readFileSync(path.join(root, "pnpm-workspace.yaml"), "utf-8");
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(
    new RegExp(`^\\s*"?${escaped}"?:\\s*"?([^"\\n]+?)"?\\s*$`, "m"),
  );
  if (!match) {
    throw new Error(`pnpm-workspace.yaml catalog has no entry for "${name}"`);
  }
  return match[1];
}

/**
 * Packs a single package directory into its own destination directory and
 * returns the resulting tarball's absolute path — a package-exclusive `outDir`
 * is required (AP-017): every workspace package shares one version, so a
 * shared destination makes "which .tgz is this package's" ambiguous.
 *
 * @param {string} pkgDir
 * @param {string} outDir pre-existing, package-exclusive destination
 * @returns {string}
 */
function packPackage(pkgDir, outDir) {
  execFileSync("pnpm", ["pack", "--pack-destination", outDir], {
    cwd: pkgDir,
    stdio: "pipe",
  });
  const tarballs = fs
    .readdirSync(outDir)
    .filter((file) => file.endsWith(".tgz"));
  if (tarballs.length !== 1) {
    throw new Error(
      `expected exactly 1 tarball in ${outDir}, got ${tarballs.length}: ${tarballs.join(", ")}`,
    );
  }
  return path.join(outDir, tarballs[0]);
}

/**
 * Packed-tarball consumer probe for the richtext stack — proves a real
 * consumer can install and typecheck against the published tarballs for
 * `@vexcms/core`, `@vexcms/react`, and `@vexcms/richtext-plate` rather than
 * the workspace (the WP-0 probe pattern `scripts/verify-scaffold.mjs` already
 * uses for the create-vexcms templates). Packs each package — each into its
 * own destination directory (AP-017) — then scaffolds a throwaway consumer
 * package in a fourth, equally isolated directory that depends on the three
 * tarballs via `file:` plus the catalog's own `react`/`react-dom`/`typescript`
 * versions, installs with plain `pnpm install` (no workspace file present, so
 * pnpm treats it as a standalone project resolving everything from the
 * registry and the three local tarballs), and runs `tsc --noEmit` against a
 * probe file that imports `richtext()`, `plateEditor()`, and `RichText` the
 * same way a real project would.
 *
 * `negative: true` runs the AP-013 self-test instead: after a normal
 * successful install, it removes the `export * from "./richtext";` line from
 * the *installed* tarball's own
 * `node_modules/@vexcms/core/dist/fields/index.d.ts` (never the repo source —
 * this is a copy inside the throwaway consumer directory) and reruns `tsc`,
 * which must now fail. A probe that cannot detect a missing export proves
 * nothing when it passes, so this is what proves this one is not vacuously
 * green.
 *
 * @param {{ negative?: boolean }} [options]
 * @returns {number} exit code for the real probe: 0 passing, 1 failing. For
 *   `negative: true`: 1 when the self-test correctly detected the missing
 *   export (meant to be wrapped in `!` by the caller, matching
 *   `verify-scaffold.mjs --negative-routes`'s convention) and 0 when it did
 *   not — returning 1 unconditionally would let a broken probe pass forever.
 */
function runRichtextConsumerProbe({ negative = false } = {}) {
  const manifests = readWorkspaceManifests().filter(
    ({ relPath, pkg }) =>
      relPath.startsWith("packages/") &&
      RICHTEXT_CONSUMER_PACKAGES.includes(pkg.name),
  );
  const missingBuild = manifests.filter(
    ({ relPath }) =>
      !fs.existsSync(path.join(root, path.dirname(relPath), "dist")),
  );
  if (
    manifests.length !== RICHTEXT_CONSUMER_PACKAGES.length ||
    missingBuild.length > 0
  ) {
    throw new Error(
      `richtext consumer probe requires built dist/ for ${RICHTEXT_CONSUMER_PACKAGES.join(", ")}.\n` +
        `  Run: pnpm --filter "@vexcms/core" --filter "@vexcms/react" --filter "@vexcms/richtext-plate" build`,
    );
  }

  const packRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "vex-richtext-probe-pack-"),
  );
  const consumerDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "vex-richtext-probe-consumer-"),
  );

  try {
    const tarballs = new Map();
    for (const { relPath, pkg } of manifests) {
      const pkgDir = path.join(root, path.dirname(relPath));
      const outDir = path.join(packRoot, path.basename(pkgDir));
      fs.mkdirSync(outDir, { recursive: true });
      tarballs.set(pkg.name, packPackage(pkgDir, outDir));
    }

    fs.writeFileSync(
      path.join(consumerDir, "package.json"),
      JSON.stringify(
        {
          name: "vex-richtext-consumer-probe",
          version: "0.0.0",
          private: true,
          dependencies: {
            "@vexcms/core": `file:${tarballs.get("@vexcms/core")}`,
            "@vexcms/react": `file:${tarballs.get("@vexcms/react")}`,
            "@vexcms/richtext-plate": `file:${tarballs.get("@vexcms/richtext-plate")}`,
            react: readCatalogVersion("react"),
            "react-dom": readCatalogVersion("react-dom"),
          },
          devDependencies: {
            typescript: readCatalogVersion("typescript"),
            "@types/react": readCatalogVersion("@types/react"),
            "@types/react-dom": readCatalogVersion("@types/react-dom"),
          },
        },
        null,
        2,
      ),
    );

    fs.writeFileSync(
      path.join(consumerDir, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "ESNext",
            moduleResolution: "Bundler",
            jsx: "react-jsx",
            strict: true,
            skipLibCheck: true,
            esModuleInterop: true,
            noEmit: true,
          },
          include: ["probe.tsx"],
        },
        null,
        2,
      ),
    );

    fs.writeFileSync(
      path.join(consumerDir, "probe.tsx"),
      [
        'import { richtext } from "@vexcms/core";',
        'import type { VexEditorAdapter } from "@vexcms/core";',
        'import { plateEditor } from "@vexcms/richtext-plate/editor";',
        'import { RichText } from "@vexcms/richtext-plate/render";',
        "",
        'const field = richtext({ label: "Body" });',
        "const editor: VexEditorAdapter = plateEditor();",
        "",
        "export function Probe() {",
        "  return <RichText content={[]} />;",
        "}",
        "",
        "void field;",
        "void editor;",
        "",
      ].join("\n"),
    );

    const install = spawnSync("pnpm", ["install", "--no-frozen-lockfile"], {
      cwd: consumerDir,
      stdio: "pipe",
    });
    if (install.status !== 0) {
      console.error(install.stdout?.toString());
      console.error(install.stderr?.toString());
      throw new Error(
        "pnpm install failed in the richtext consumer probe directory",
      );
    }

    if (negative) {
      const barrelPath = path.join(
        consumerDir,
        "node_modules/@vexcms/core/dist/fields/index.d.ts",
      );
      const barrel = fs.readFileSync(barrelPath, "utf-8");
      if (!barrel.includes('export * from "./richtext";')) {
        throw new Error(
          `${barrelPath} has no 'export * from "./richtext";' line to remove`,
        );
      }
      fs.writeFileSync(
        barrelPath,
        barrel.replace('export * from "./richtext";\n', ""),
      );
    }

    const tsc = spawnSync(
      "node_modules/.bin/tsc",
      ["--noEmit", "-p", "tsconfig.json"],
      {
        cwd: consumerDir,
        stdio: "pipe",
      },
    );

    if (!negative) {
      if (tsc.status !== 0) {
        console.error(tsc.stdout?.toString());
        console.error(tsc.stderr?.toString());
        console.error(
          "✗ richtext consumer probe: tsc failed against the published tarballs",
        );
        return 1;
      }
      console.log(
        "✓ richtext consumer probe: tsc passed against the published tarballs",
      );
      return 0;
    }

    if (tsc.status === 0) {
      console.error(
        "\n✗ CRITICAL: tsc succeeded after the `richtext` export was removed from the " +
          "installed @vexcms/core tarball. The consumer probe cannot be trusted to catch a " +
          "real missing-export regression.",
      );
      return 0;
    }
    console.log(
      "\n✓ negative self-test passed: tsc correctly failed once `richtext` was removed " +
        "from the installed tarball's declarations.",
    );
    return 1;
  } finally {
    fs.rmSync(packRoot, { recursive: true, force: true });
    fs.rmSync(consumerDir, { recursive: true, force: true });
  }
}

/** @type {Array<{ id: string, label: string, run: () => string[] }>} */
const allChecks = [
  { id: "sweep", label: "catalog sweep", run: checkSweep },
  { id: "packed", label: "packed manifests", run: checkPacked },
];

const cliArgs = process.argv.slice(2);
const richtext = cliArgs.includes("--richtext");
const richtextNegative = cliArgs.includes("--richtext-negative");

if (richtext) {
  process.exit(runRichtextConsumerProbe({ negative: richtextNegative }));
}

const selected = cliArgs
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
