#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wwwPkgPath = path.join(__dirname, '..', 'apps', 'www', 'package.json');

console.log('📦 Updating www app dependencies to alpha versions...\n');

if (!fs.existsSync(wwwPkgPath)) {
  console.log('❌ ERROR: apps/www/package.json not found');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(wwwPkgPath, 'utf-8'));

// Update all @vexcms/* dependencies to workspace:*
const vexcmsDeps = [
  '@vexcms/core',
  '@vexcms/react',
  '@vexcms/next',
  '@vexcms/cli',
  '@vexcms/better-auth',
  '@vexcms/storage-convex',
  '@vexcms/richtext-plate',
];

if (pkg.dependencies) {
  for (const dep of vexcmsDeps) {
    if (pkg.dependencies[dep]) {
      pkg.dependencies[dep] = 'workspace:*';
      console.log(`   ✓ ${dep} → workspace:*`);
    }
  }
}

if (pkg.devDependencies) {
  for (const dep of vexcmsDeps) {
    if (pkg.devDependencies[dep]) {
      pkg.devDependencies[dep] = 'workspace:*';
      console.log(`   ✓ ${dep} → workspace:* (devDependencies)`);
    }
  }
}

fs.writeFileSync(wwwPkgPath, JSON.stringify(pkg, null, 2) + '\n');

console.log('\n✅ Updated apps/www/package.json');
console.log('   All @vexcms/* dependencies now use workspace:*\n');
