import fs from 'fs-extra';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Creates a project directory for the given project name.
 * For dot notation ("."), returns the current working directory without creating a new directory.
 * For named projects, creates a new directory in the current working directory.
 *
 * @param projectName - The name of the project (or "." for current directory)
 * @param cwd - The current working directory path
 * @returns Promise that resolves to the absolute path of the project directory
 */
export async function createProjectDirectory(projectName: string, cwd: string): Promise<string> {
  if (projectName === '.') {
    // For dot notation, return cwd without creating a new directory
    return cwd;
  }

  // Get the target directory path
  const targetPath = getTargetDirectory(projectName, cwd);

  // Create the directory
  await fs.ensureDir(targetPath);

  return targetPath;
}

/**
 * Gets the target directory path for a project.
 * For dot notation ("."), returns the current working directory.
 * For named projects, returns the path to the new directory.
 * Handles scoped packages by creating nested directories (e.g., @org/my-app).
 *
 * @param projectName - The name of the project (or "." for current directory)
 * @param cwd - The current working directory path
 * @returns The absolute path to the target directory
 */
export function getTargetDirectory(projectName: string, cwd: string): string {
  if (projectName === '.') {
    return cwd;
  }

  // For scoped packages like @org/my-app, join will handle the path correctly
  // This creates nested directories: cwd/@org/my-app
  return join(cwd, projectName);
}

/**
 * Copies template files from the templates directory to the target project directory.
 *
 * @param framework - The framework name ('tanstack' or 'nextjs')
 * @param targetPath - The absolute path to the target project directory
 * @returns Promise that resolves when the copy is complete
 */
export async function copyTemplate(framework: string, targetPath: string): Promise<void> {
  // Get the CLI's directory to locate templates
  // When running from dist/index.js: __dirname will be dist/, so we go up one level
  // When running from src/helpers/fileOperations.ts (tests): __dirname will be src/helpers/, so we go up two levels
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Map framework value to template directory name
  const templateDir = framework === 'tanstack' ? 'base-tanstack' : 'base-nextjs';

  // Try to find templates directory - check both possible locations
  // First try: go up two levels (for src/helpers/ during tests)
  let templatePath = join(__dirname, '../../templates', templateDir);

  // If that doesn't exist, try going up one level (for dist/ in production)
  if (!fs.existsSync(templatePath)) {
    templatePath = join(__dirname, '../templates', templateDir);
  }

  // Copy all files from template to target directory
  // Skip files prefixed with _ that need renaming (npm strips dotfiles from packages)
  await fs.copy(templatePath, targetPath, {
    overwrite: false,
    errorOnExist: false,
    filter: (src) => {
      const basename = src.split('/').pop() ?? '';
      // Skip files that need renaming from _name to .name
      const skipFiles = ['_gitignore', '_env.example', '_prettierrc', '_prettierignore'];
      return !skipFiles.includes(basename);
    },
  });

  // Rename _gitignore → .gitignore
  // npm excludes .gitignore files from published packages, so we store them as _gitignore
  const sourceGitignore = join(templatePath, '_gitignore');
  const targetGitignore = join(targetPath, '.gitignore');
  if (await fs.pathExists(sourceGitignore)) {
    await fs.copy(sourceGitignore, targetGitignore, {
      overwrite: false,
      errorOnExist: false,
    });
  }

  // Rename all _dotfile → .dotfile
  // npm strips dotfiles from published packages, so we store them with _ prefix
  const dotfileRenames: [string, string][] = [
    ['_env.example', '.env.example'],
    ['_prettierrc', '.prettierrc'],
    ['_prettierignore', '.prettierignore'],
  ];

  for (const [from, to] of dotfileRenames) {
    const source = join(templatePath, from);
    const target = join(targetPath, to);
    if (await fs.pathExists(source)) {
      await fs.copy(source, target, { overwrite: false, errorOnExist: false });
    }
  }
}

/**
 * Overlays additional files onto an existing target directory, merging and overwriting as needed.
 *
 * @param overlayDir - The absolute path to the overlay directory containing files to merge
 * @param targetDir - The absolute path to the target directory to overlay onto
 * @returns Promise that resolves when the overlay is complete
 */
export async function overlayTemplate({ overlayDir, targetDir }: { overlayDir: string; targetDir: string }): Promise<void> {
  await fs.copy(overlayDir, targetDir, { overwrite: true });
}
