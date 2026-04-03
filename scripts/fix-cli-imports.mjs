#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliSrcDir = path.join(__dirname, '..', 'packages', 'cli', 'src');

console.log('🔧 Fixing CLI imports for v1 package names...\n');

// Package name mappings
const packageRenames = {
  '@vexcms/ui': '@vexcms/react',
  '@vexcms/admin-next': '@vexcms/next',
  '@vexcms/file-storage-convex': '@vexcms/storage-convex',
  '@vexcms/richtext': '@vexcms/richtext-plate',
  'create-cli': 'create-vexcms',
};

let totalFiles = 0;
let totalReplacements = 0;

function fixImportsInFile(filePath) {
  if (!filePath.endsWith('.ts')) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  let fileReplacements = 0;

  for (const [oldName, newName] of Object.entries(packageRenames)) {
    // Match imports/requires with the old package name
    const importRegex = new RegExp(`(from\\s+['"])${oldName}(['"])`, 'g');
    const requireRegex = new RegExp(`(require\\(['"])${oldName}(['"]\\))`, 'g');

    const importMatches = content.match(importRegex) || [];
    const requireMatches = content.match(requireRegex) || [];

    if (importMatches.length > 0 || requireMatches.length > 0) {
      content = content.replace(importRegex, `$1${newName}$2`);
      content = content.replace(requireRegex, `$1${newName}$2`);
      fileReplacements += importMatches.length + requireMatches.length;
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`   ✓ ${path.relative(cliSrcDir, filePath)} (${fileReplacements} replacements)`);
    totalReplacements += fileReplacements;
  }

  totalFiles++;
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else if (stat.isFile()) {
      fixImportsInFile(filePath);
    }
  }
}

if (!fs.existsSync(cliSrcDir)) {
  console.log('❌ ERROR: packages/cli/src not found');
  console.log('   Make sure you ran the preserve-cli reset script\n');
  process.exit(1);
}

walkDirectory(cliSrcDir);

console.log(`\n✅ Fixed ${totalReplacements} imports across ${totalFiles} files`);
console.log('\nPackage name changes:');
for (const [oldName, newName] of Object.entries(packageRenames)) {
  console.log(`   ${oldName} → ${newName}`);
}
console.log('');
