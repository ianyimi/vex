#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootPkgPath = path.join(__dirname, '..', 'package.json');

console.log('📦 Adding ESLint + JSDoc dependencies...\n');

const pkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));

// Add ESLint dependencies
const newDevDeps = {
  '@eslint/js': '^9.0.0',
  '@typescript-eslint/eslint-plugin': '^8.0.0',
  '@typescript-eslint/parser': '^8.0.0',
  'eslint': '^9.0.0',
  'eslint-plugin-jsdoc': '^50.0.0',
};

if (!pkg.devDependencies) {
  pkg.devDependencies = {};
}

for (const [dep, version] of Object.entries(newDevDeps)) {
  if (!pkg.devDependencies[dep]) {
    pkg.devDependencies[dep] = version;
    console.log(`   ✓ Added ${dep}@${version}`);
  } else {
    console.log(`   ⚠️  ${dep} already exists (${pkg.devDependencies[dep]})`);
  }
}

// Add lint script if not exists
if (!pkg.scripts.lint) {
  pkg.scripts.lint = 'eslint packages/*/src/**/*.{ts,tsx}';
  pkg.scripts['lint:fix'] = 'eslint --fix packages/*/src/**/*.{ts,tsx}';
  console.log('\n   ✓ Added lint and lint:fix scripts');
}

// Sort devDependencies alphabetically
pkg.devDependencies = Object.fromEntries(
  Object.entries(pkg.devDependencies).sort(([a], [b]) => a.localeCompare(b))
);

fs.writeFileSync(rootPkgPath, JSON.stringify(pkg, null, 2) + '\n');

console.log('\n✅ Updated root package.json');
console.log('\nRun: pnpm install\n');
