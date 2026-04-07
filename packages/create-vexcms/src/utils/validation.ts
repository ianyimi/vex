import validateNpmPackageName from 'validate-npm-package-name';
import fs from 'fs-extra';
import { basename } from 'path';

/**
 * Validates a project name using npm package name validation rules.
 * Supports scoped packages (e.g., @org/my-app).
 *
 * @param name - The project name to validate
 * @returns Object with valid flag and array of error messages
 */
export function validateProjectName(name: string): { valid: boolean; errors: string[] } {
  const result = validateNpmPackageName(name);

  if (result.validForNewPackages) {
    return { valid: true, errors: [] };
  }

  const errors: string[] = [];

  if (result.errors) {
    errors.push(...result.errors);
  }

  if (result.warnings) {
    errors.push(...result.warnings);
  }

  return { valid: false, errors };
}

/**
 * Checks if a directory exists at the given path.
 *
 * @param targetPath - The absolute path to check
 * @returns Promise that resolves to true if directory exists, false otherwise
 */
export async function checkDirectoryExists(targetPath: string): Promise<boolean> {
  return await fs.pathExists(targetPath);
}

/**
 * Checks if a directory is empty (excluding hidden files like .git).
 *
 * @param dirPath - The absolute path to the directory
 * @returns Promise that resolves to true if directory is empty, false otherwise
 */
export async function isDirectoryEmpty(dirPath: string): Promise<boolean> {
  try {
    const files = await fs.readdir(dirPath);

    // Filter out hidden files (starting with .)
    const visibleFiles = files.filter(file => !file.startsWith('.'));

    return visibleFiles.length === 0;
  } catch (error) {
    // If directory doesn't exist or can't be read, consider it empty
    return true;
  }
}

/**
 * Resolves the project name based on input.
 * If input is ".", keeps it as "." for directory creation but validates using the current directory's basename.
 * Otherwise, returns the input unchanged.
 *
 * @param input - The project name input (can be "." for current directory)
 * @param cwd - The current working directory path
 * @returns The project name (kept as "." if that was the input)
 */
export function resolveProjectName(input: string, cwd: string): string {
  return input;
}
