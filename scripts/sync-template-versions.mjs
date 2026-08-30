/**
 * Syncs @vexcms/* dependency versions in all create-vexcms templates
 * to match the current package versions after `changeset version` runs.
 *
 * This runs automatically as part of `pnpm version:packages`.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Read the current version from @vexcms/core (all packages share the same version)
const corePkg = JSON.parse(
  fs.readFileSync(path.join(root, "packages/core/package.json"), "utf-8")
);
const version = corePkg.version;
const versionRange = `~${version}`;

console.log(`Syncing template versions to ${versionRange}`);

// Derive the publishable package list from the workspace itself. A hardcoded
// list silently rotted through the rebuild rename (@vexcms/ui -> @vexcms/react,
// @vexcms/admin-next -> @vexcms/next, @vexcms/richtext -> @vexcms/richtext-plate)
// and stopped matching anything.
const packagesDir = path.join(root, "packages");
const vexPackages = fs
  .readdirSync(packagesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => path.join(packagesDir, d.name, "package.json"))
  .filter((p) => fs.existsSync(p))
  .map((p) => JSON.parse(fs.readFileSync(p, "utf-8")))
  .filter((pkg) => pkg.name && !pkg.private)
  .map((pkg) => pkg.name);

const templatesDir = path.join(root, "packages/create-vexcms/templates");
if (!fs.existsSync(templatesDir)) {
  throw new Error(
    `Template directory not found: ${templatesDir}\n` +
      `This script runs during \`pnpm version:packages\`; a wrong path here aborts the release.`
  );
}

const templateDirs = fs
  .readdirSync(templatesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

let updated = 0;
const skipped = [];

for (const dir of templateDirs) {
  const pkgPath = path.join(templatesDir, dir, "package.json");
  if (!fs.existsSync(pkgPath)) {
    skipped.push(dir);
    continue;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  let changed = false;

  for (const name of vexPackages) {
    for (const group of ["dependencies", "devDependencies"]) {
      const current = pkg[group]?.[name];
      // Leave workspace: specifiers alone — those belong to --monorepo scaffolds.
      if (!current || current.startsWith("workspace:")) continue;
      if (current !== versionRange) {
        pkg[group][name] = versionRange;
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`  ✓ ${dir}/package.json`);
    updated++;
  }
}

if (skipped.length > 0) {
  console.warn(
    `  ! No package.json in template(s): ${skipped.join(", ")} — nothing to sync there.`
  );
}

console.log(`Updated ${updated} template(s) → ${versionRange}`);
