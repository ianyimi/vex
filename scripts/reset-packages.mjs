#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.join(__dirname, '..', 'packages');

const packageUpdates = {
  'core': { name: '@vexcms/core', version: '0.1.0-alpha.1' },
  'react': { name: '@vexcms/react', version: '0.1.0-alpha.1' },
  'next': { name: '@vexcms/next', version: '0.1.0-alpha.1' },
  'cli': { name: '@vexcms/cli', version: '0.1.0-alpha.1' },
  'better-auth': { name: '@vexcms/better-auth', version: '0.1.0-alpha.1' },
  'storage-convex': { name: '@vexcms/storage-convex', version: '0.1.0-alpha.1' },
  'richtext-plate': { name: '@vexcms/richtext-plate', version: '0.1.0-alpha.1' },
  'create-vexcms': { name: 'create-vexcms', version: '0.1.0-alpha.1' },
};

for (const [dir, update] of Object.entries(packageUpdates)) {
  const pkgPath = path.join(packagesDir, dir, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    console.log(`⚠️  Skipping ${dir} - package.json not found`);
    continue;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  // Update name and version
  pkg.name = update.name;
  pkg.version = update.version;

  // Update workspace dependencies to use new alpha versions
  if (pkg.dependencies) {
    for (const [dep, ver] of Object.entries(pkg.dependencies)) {
      if (dep.startsWith('@vexcms/') && ver === 'workspace:*') {
        pkg.dependencies[dep] = 'workspace:*'; // Keep workspace protocol
      }
    }
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`✅ Updated ${update.name} → ${update.version}`);
}

console.log('\n✨ All packages reset to 0.1.0-alpha.1');
