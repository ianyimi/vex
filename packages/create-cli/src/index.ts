#!/usr/bin/env node

/**
 * create-vexcms CLI
 *
 * Scaffolds new VEX CMS projects with Next.js, Better Auth, and Convex.
 * Forked from create-z3-app.
 *
 * Usage:
 *   pnpm create vexcms@latest [project-name] [--bare]
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { input, select, confirm, checkbox } from '@inquirer/prompts';
import ora from 'ora';

import path from 'path';
import fs from 'fs-extra';
import { validateProjectName, checkDirectoryExists, isDirectoryEmpty, resolveProjectName } from './utils/validation.js';
import { displayDirectoryExistsError, displayInvalidNameError, displayDirectoryNotEmptyError, displaySuccessMessage } from './utils/messages.js';
import { createProjectDirectory, getTargetDirectory } from './helpers/fileOperations.js';
import { createInstaller, getPopularProviders, getAdditionalProviders } from './installers/index.js';
import type { Framework, ProjectOptions } from './installers/types.js';

const program = new Command()
  .name('create-vexcms')
  .description('Scaffold a new VEX CMS project')
  .argument('[project-name]', 'Project directory name')
  .option('--bare', 'Skip marketing site collections, scaffold empty project')
  .version('0.0.2')
  .parse();

const args = program.args;
const opts = program.opts<{ bare?: boolean }>();

async function main() {
  console.log();
  console.log(chalk.bold('  create-vexcms'));
  console.log();

  const bare = opts.bare ?? false;

  // 1. Project name / path
  // The arg can be a simple name ("my-app"), a path ("apps/www"), or "."
  // We separate the directory target from the npm package name.
  let inputArg: string;
  if (args[0]) {
    inputArg = args[0];
  } else {
    inputArg = await input({
      message: 'What is your project named?',
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

  // Resolve the target directory — supports relative paths like "apps/www"
  const targetDir = inputArg === '.'
    ? process.cwd()
    : path.resolve(process.cwd(), inputArg);
  if (await checkDirectoryExists(targetDir)) {
    if (!(await isDirectoryEmpty(targetDir))) {
      displayDirectoryNotEmptyError();
      process.exit(1);
    }
  }

  // 2. Framework selection
  let framework: Framework;
  while (true) {
    framework = await select<Framework>({
      message: 'Select a framework:',
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

  // 3. Email/password auth
  const emailPasswordAuth = await confirm({
    message: 'Enable email/password authentication?',
    default: true,
  });

  // 4. OAuth providers
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

  const oauthProviders = await checkbox({
    message: 'Select OAuth providers (space to toggle, enter to confirm):',
    choices: allProviderChoices,
  });

  // 5. Git init
  const initGit = await confirm({
    message: 'Initialize a Git repository?',
    default: true,
  });

  // 6. Install dependencies
  const installDependencies = await confirm({
    message: 'Install dependencies?',
    default: false,
  });

  // Build options
  const options: ProjectOptions = {
    projectName,
    projectDir: targetDir,
    framework,
    bare,
    emailPasswordAuth,
    oauthProviders,
    initGit,
    installDependencies,
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
}

main().catch((error) => {
  console.error(chalk.red('\nAn error occurred:'), error.message);
  process.exit(1);
});
