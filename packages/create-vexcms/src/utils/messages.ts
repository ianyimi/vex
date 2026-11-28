import chalk from 'chalk';
import type { PackageManager } from '../installers/types.js';
import { execBinCommand, runScriptCommand } from '../helpers/packageManager.js';

/**
 * Displays an error message when a directory already exists.
 * Exits the process with code 1.
 *
 * @param dirName - The name of the existing directory
 */
export function displayDirectoryExistsError(dirName: string): void {
  console.error();
  console.error(chalk.red(`Error: Directory '${dirName}' already exists.`));
  console.error(chalk.yellow('Please choose a different name or remove the existing directory.'));
  console.error();
  process.exit(1);
}

/**
 * Displays an error message when a project name is invalid.
 * Exits the process with code 1.
 *
 * @param name - The invalid project name
 * @param errors - Array of validation error messages
 */
export function displayInvalidNameError(name: string, errors: string[]): void {
  console.error();
  console.error(chalk.red(`Error: Invalid project name '${name}'.`));
  console.error();

  if (errors.length > 0) {
    console.error(chalk.yellow('Validation errors:'));
    errors.forEach(error => {
      console.error(chalk.yellow(`  - ${error}`));
    });
    console.error();
  }

  console.error(chalk.yellow('Project names must be valid npm package names.'));
  console.error(chalk.yellow('They should be lowercase, contain no spaces, and use hyphens for word separation.'));
  console.error();
  process.exit(1);
}

/**
 * Displays an error message when the current directory is not empty.
 * Used when attempting to scaffold with dot notation in a non-empty directory.
 * Exits the process with code 1.
 */
export function displayDirectoryNotEmptyError(): void {
  console.error();
  console.error(chalk.red('Error: Current directory is not empty.'));
  console.error(chalk.yellow('Please use a different directory or provide a project name.'));
  console.error();
  process.exit(1);
}

/**
 * Displays an error message when there's a permission issue creating a directory.
 * Exits the process with code 1.
 *
 * @param path - The path where permission was denied
 */
export function displayPermissionError(path: string): void {
  console.error();
  console.error(chalk.red(`Error: Permission denied when creating '${path}'.`));
  console.error(chalk.yellow('Please check your directory permissions.'));
  console.error();
  process.exit(1);
}

/**
 * Displays a success message after the project directory is created.
 *
 * @param projectName - The name of the created project
 * @param targetPath - The absolute path to the project directory
 * @param isCurrentDir - Whether the project was created in the current directory (dot notation)
 */
export function displaySuccessMessage(
  projectName: string,
  targetPath: string,
  isCurrentDir: boolean
): void {
  console.log();

  if (isCurrentDir) {
    console.log(chalk.green(`✓ Successfully created project '${projectName}' in current directory`));
  } else {
    console.log(chalk.green(`✓ Successfully created project '${projectName}' at ${targetPath}`));
  }

  console.log();
}

/** Props for {@link displayNextSteps}. */
export interface DisplayNextStepsProps {
  /** Package manager whose commands are printed. */
  packageManager: PackageManager
  /** Directory to `cd` into, relative to where the CLI ran; `null` when scaffolded into `.`. */
  cdPath: string | null
  /** Whether dependencies were already installed during scaffolding. */
  installed: boolean
  /** Dev server port the scaffold was configured with. */
  port: number
  /** Whether the marketing-site starter (with its `seed` script) was applied. */
  marketing: boolean
}

/**
 * Prints the steps from a fresh scaffold to a signed-in admin, in the scaffold's package
 * manager — the same sequence as the scaffolded README's Getting Started.
 *
 * @param props - What was scaffolded and with which package manager.
 */
export function displayNextSteps(props: DisplayNextStepsProps): void {
  const { packageManager: pm } = props;
  const convex = execBinCommand(pm, 'convex');
  const lines = [
    ...(props.cdPath ? [`cd ${props.cdPath}`] : []),
    ...(props.installed ? [] : [`${pm} install`]),
    `${convex} dev --once`,
    `${convex} env set SITE_URL http://localhost:${props.port}`,
    `${convex} env set BETTER_AUTH_SECRET <the BETTER_AUTH_SECRET value from .env.local>`,
  ];

  console.log(chalk.bold('  Next steps:'));
  console.log();
  for (const line of lines) console.log(chalk.cyan(`    ${line}`));
  console.log();
  console.log(`  Then, in two terminals: ${chalk.cyan(runScriptCommand(pm, 'vex:dev'))} and ${chalk.cyan(runScriptCommand(pm, 'dev'))}`);
  if (props.marketing) {
    console.log(`  Seed the starter content once, while vex:dev runs: ${chalk.cyan(runScriptCommand(pm, 'seed'))}`);
  }
  console.log(`  Open http://localhost:${props.port} and sign up. The first account becomes the admin.`);
  console.log();
}
