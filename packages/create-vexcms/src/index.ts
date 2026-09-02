#!/usr/bin/env node

/**
 * create-vexcms CLI
 *
 * Scaffolds new VEX CMS projects with Next.js, Better Auth, and Convex.
 * Forked from create-z3-app.
 *
 * Usage:
 *   pnpm create vexcms@latest [project-name] [--bare] [--orgs]
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { input, select, confirm, checkbox } from '@inquirer/prompts';

import path from 'path';
import fs from 'fs-extra';
import { validateProjectName, checkDirectoryExists, isDirectoryEmpty, resolveProjectName } from './utils/validation.js';
import { displayInvalidNameError, displayDirectoryNotEmptyError, displaySuccessMessage } from './utils/messages.js';
import { findWorkspaceRoot } from './helpers/monorepo.js';
import { createInstaller, getPopularProviders, getAdditionalProviders } from './installers/index.js';
import type { Framework, ProjectOptions } from './installers/types.js';

const program = new Command()
  .name('create-vexcms')
  .description('Scaffold a new VEX CMS project')
  .argument('[project-name]', 'Project directory name')
  .option('--bare', 'Skip marketing site collections, scaffold empty project')
  .option('--orgs', 'Enable multi-tenant organizations')
  .option('--monorepo', 'Scaffold into apps/<name> under the detected pnpm workspace root, rewriting dependencies to workspace/catalog protocols')
  .option('--yes', 'Accept every prompt default without rendering (for automation)')
  .version('0.0.2')
  .parse();

const args = program.args;
const opts = program.opts<{ bare?: boolean; orgs?: boolean; monorepo?: boolean; yes?: boolean }>();

async function main() {
  console.log();
  console.log(chalk.bold('  create-vexcms'));
  console.log();

  const bare = opts.bare ?? false;
  const yes = opts.yes ?? false;
  const monorepo = opts.monorepo ?? false;

  // 1. Project name / path
  // The arg can be a simple name ("my-app"), a path ("apps/www"), or "."
  // We separate the directory target from the npm package name.
  let inputArg: string;
  if (args[0]) {
    inputArg = args[0];
  } else if (yes) {
    inputArg = 'my-vexcms-app';
  } else {
    inputArg = await input({
      message: '(1/8) What is your project named?',
      default: 'my-vexcms-app',
      validate: (value) => {
        // For paths, validate just the last segment
        const name = value.includes('/') ? path.basename(value) : value;
        if (name === '.') return true;
        const result = validateProjectName(name);
        if (result.valid) return true;
        return result.errors[0] ?? 'Invalid project name';
      },
    });
  }

  inputArg = resolveProjectName(inputArg, process.cwd());

  // Derive the npm package name from the last path segment
  const projectName = inputArg === '.'
    ? path.basename(process.cwd())
    : path.basename(inputArg);

  // Validate the package name
  const validation = validateProjectName(projectName);
  if (!validation.valid) {
    displayInvalidNameError(projectName, validation.errors);
    process.exit(1);
  }

  // Resolve the target directory — supports relative paths like "apps/test",
  // or --monorepo's apps/<name> under the detected workspace root.
  let targetDir: string;
  let workspaceRoot: string | null = null;

  if (monorepo) {
    workspaceRoot = await findWorkspaceRoot({ cwd: process.cwd() });
    if (!workspaceRoot) {
      console.error(chalk.red('\nError: --monorepo requires a pnpm workspace.'));
      console.error(chalk.yellow(`No pnpm-workspace.yaml was found walking up from ${process.cwd()}.`));
      console.error(chalk.yellow('Run this command from inside a pnpm workspace, or drop --monorepo.'));
      process.exit(1);
    }

    targetDir = path.join(workspaceRoot, 'apps', projectName);
    if (await checkDirectoryExists(targetDir)) {
      console.error(chalk.red(`\nError: 'apps/${projectName}' already exists under ${workspaceRoot}.`));
      console.error(chalk.yellow('--monorepo refuses to scaffold over an existing directory.'));
      process.exit(1);
    }
  } else {
    targetDir = inputArg === '.'
      ? process.cwd()
      : path.resolve(process.cwd(), inputArg);
    if (await checkDirectoryExists(targetDir)) {
      if (!(await isDirectoryEmpty(targetDir))) {
        displayDirectoryNotEmptyError();
        process.exit(1);
      }
    }
  }

  // 2. Framework selection
  let framework: Framework;
  if (yes) {
    // No prompt default exists here; "nextjs" is the only implemented
    // framework (createInstaller throws on "tanstack"), so --yes picks it.
    framework = 'nextjs';
  } else {
    while (true) {
      framework = await select<Framework>({
        message: '(2/8) Select a framework:',
        choices: [
          { name: 'Next.js (Recommended)', value: 'nextjs' },
          { name: 'TanStack Start (Coming Soon)', value: 'tanstack' },
        ],
      });
      if (framework === 'tanstack') {
        console.log(chalk.yellow('\n  TanStack Start support is coming soon! Please select Next.js for now.\n'));
        continue;
      }
      break;
    }
  }

  // 3. Dev server port
  let port: number;
  if (yes) {
    port = 3010;
  } else {
    const portInput = await input({
      message: '(3/8) Dev server port:',
      default: '3010',
      validate: (value) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1 || num > 65535) return 'Must be a valid port number (1-65535)';
        return true;
      },
    });
    port = parseInt(portInput, 10);
  }

  // 4. Email/password auth
  const emailPasswordAuth = yes
    ? true
    : await confirm({
        message: '(4/8) Enable email/password authentication?',
        default: true,
      });

  // 5. Organizations
  const orgs = opts.orgs ?? (yes
    ? false
    : await confirm({
        message: '(5/8) Enable multi-tenant (organizations)?',
        default: false,
      }));

  // 6. OAuth providers
  const popularProviders = getPopularProviders();
  const additionalProviders = getAdditionalProviders();

  const allProviderChoices = [
    ...popularProviders.map(p => ({
      name: p.name,
      value: p.id,
    })),
    { name: '── Additional providers ──', value: '__separator__', disabled: true as const },
    ...additionalProviders.map(p => ({
      name: p.name,
      value: p.id,
    })),
  ];

  const oauthProviders = yes
    ? []
    : await checkbox({
        message: '(6/8) Select OAuth providers (space to toggle, enter to confirm):',
        choices: allProviderChoices,
      });

  // 7. Git init
  const initGit = yes
    ? true
    : await confirm({
        message: '(7/8) Initialize a Git repository?',
        default: true,
      });

  // 8. Install dependencies
  const installDependencies = yes
    ? false
    : await confirm({
        message: '(8/8) Install dependencies?',
        default: false,
      });

  // Build options
  const options: ProjectOptions = {
    projectName,
    projectDir: targetDir,
    framework,
    port,
    bare,
    orgs,
    emailPasswordAuth,
    oauthProviders,
    initGit,
    installDependencies,
    monorepo,
    workspaceRoot,
    yes,
  };

  // Create project directory
  await fs.ensureDir(targetDir);

  // Run installer
  const installer = createInstaller({
    framework,
    projectDir: targetDir,
    projectName: options.projectName,
  });

  console.log();
  await installer.initProject(options);

  // Success message
  console.log();
  displaySuccessMessage(options.projectName, targetDir, inputArg === '.');

  if (monorepo && workspaceRoot) {
    console.log(chalk.cyan(`  Run 'pnpm install' from ${workspaceRoot} to link the new workspace member.`));
    console.log();
  }
}

main().catch((error) => {
  console.error(chalk.red('\nAn error occurred:'), error.message);
  process.exit(1);
});
