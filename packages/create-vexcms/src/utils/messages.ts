import chalk from 'chalk';

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
