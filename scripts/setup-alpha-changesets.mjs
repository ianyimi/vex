#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const changesetConfigPath = path.join(__dirname, '..', '.changeset', 'config.json');

console.log('⚙️  Configuring changesets for alpha prerelease mode...\n');

const config = JSON.parse(fs.readFileSync(changesetConfigPath, 'utf-8'));

// Update config for alpha prerelease
config.changelog = '@changesets/cli/changelog';
config.commit = false;
config.fixed = [
  [
    '@vexcms/core',
    '@vexcms/react',
    '@vexcms/next',
    '@vexcms/cli',
    '@vexcms/better-auth',
    '@vexcms/storage-convex',
    '@vexcms/richtext-plate',
    'create-vexcms'
  ]
];
config.linked = [];
config.access = 'public';
config.baseBranch = 'master';
config.updateInternalDependencies = 'patch';
config.ignore = ['@vexcms/tsconfig', 'www'];

fs.writeFileSync(changesetConfigPath, JSON.stringify(config, null, 2) + '\n');

console.log('✅ Updated .changeset/config.json');
console.log('   - Fixed versioning for all @vexcms/* packages');
console.log('   - Ignoring: @vexcms/tsconfig, www\n');

console.log('📝 To create alpha releases:');
console.log('   1. Make changes');
console.log('   2. pnpm changeset');
console.log('   3. Choose patch/minor/major');
console.log('   4. pnpm changeset version');
console.log('   5. git commit -am "Version alpha.X"');
console.log('   6. pnpm release\n');

console.log('💡 Versions will be: 0.1.0-alpha.1, 0.1.0-alpha.2, etc.');
console.log('   After all features complete, remove "-alpha" tag for 0.1.0 release\n');
