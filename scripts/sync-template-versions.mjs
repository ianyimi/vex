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

const vexPackages = [
  "@vexcms/core",
  "@vexcms/cli",
  "@vexcms/admin-next",
  "@vexcms/ui",
  "@vexcms/richtext",
  "@vexcms/better-auth",
  "@vexcms/file-storage-convex",
];

// Find all package.json files in all template directories
const templatesDir = path.join(root, "packages/create-cli/templates");
const templateDirs = fs.readdirSync(templatesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

let updated = 0;

for (const dir of templateDirs) {
  const pkgPath = path.join(templatesDir, dir, "package.json");
  if (!fs.existsSync(pkgPath)) continue;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  let changed = false;

  for (const name of vexPackages) {
    if (pkg.dependencies?.[name] && pkg.dependencies[name] !== versionRange) {
      pkg.dependencies[name] = versionRange;
      changed = true;
    }
    if (pkg.devDependencies?.[name] && pkg.devDependencies[name] !== versionRange) {
      pkg.devDependencies[name] = versionRange;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`  ✓ ${dir}/package.json`);
    updated++;
  }
}

console.log(`Updated ${updated} template(s) → ${versionRange}`);
