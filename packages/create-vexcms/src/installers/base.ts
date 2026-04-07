/**
 * VexFrameworkInstaller Base Class
 *
 * Abstract base class for framework-specific project installers.
 * Provides template method pattern with concrete utility methods
 * and abstract methods for framework-specific operations.
 *
 * Forked from create-z3-app FrameworkInstaller.
 */

import fs from 'fs-extra';
import { execa } from 'execa';
import ora from 'ora';
import crypto from 'crypto';
import path from 'path';
import type { ProjectOptions, PackageManager } from './types.js';
import { copyTemplate, overlayTemplate } from '../helpers/fileOperations.js';

/**
 * Abstract base class for framework-specific installers
 * Implements the Template Method pattern for project initialization
 */
export abstract class VexFrameworkInstaller {
  constructor(
    protected targetPath: string,
    protected projectName: string
  ) {}

  /**
   * Abstract property: Framework identifier
   * Used for template selection and logging
   */
  abstract get frameworkName(): string;

  /**
   * Abstract method: Update OAuth configuration in auth file
   */
  abstract updateOAuthConfig(
    selectedProviders: string[],
    emailPasswordEnabled: boolean
  ): Promise<void>;

  /**
   * Abstract method: Update OAuth UI configuration
   */
  abstract updateOAuthUIConfig(
    selectedProviders: string[],
    emailPasswordEnabled: boolean
  ): Promise<void>;

  /**
   * Abstract method: Update .env.example with OAuth environment variables
   */
  abstract updateEnvExample(selectedProviders: string[]): Promise<void>;

  /**
   * Abstract method: Update README with OAuth provider setup guides
   */
  abstract updateReadme(selectedProviders: string[]): Promise<void>;

  /**
   * Abstract method: Update env.ts/env.mjs with OAuth provider environment variables
   */
  abstract updateEnvTs(selectedProviders: string[]): Promise<void>;

  /**
   * Copy base template files to target directory
   */
  protected async copyBaseFiles(): Promise<void> {
    await copyTemplate(this.frameworkName, this.targetPath);
  }

  /**
   * Apply a template overlay on top of the base template.
   * Merges overlay files onto the already-copied base — existing files
   * not in the overlay are left untouched.
   */
  protected async applyTemplateOverlay(overlay: string): Promise<void> {
    const { dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Try both possible template locations (src/ during dev, dist/ in production)
    let overlayDir = path.join(__dirname, '../../templates', overlay);
    if (!await fs.pathExists(overlayDir)) {
      overlayDir = path.join(__dirname, '../templates', overlay);
    }

    await overlayTemplate({ overlayDir, targetDir: this.targetPath });
  }

  /**
   * Update the package.json name field and vex:update script
   * to match the detected package manager.
   */
  protected async updatePackageName(name: string): Promise<void> {
    const pkgPath = path.join(this.targetPath, 'package.json');
    const pkg = await fs.readJson(pkgPath);
    pkg.name = name;

    // Update vex:update script to use detected package manager
    const pm = this.detectPackageManager();
    if (pkg.scripts?.['vex:update'] && pm !== 'pnpm') {
      const addCmd = pm === 'yarn' ? 'yarn add' : pm === 'bun' ? 'bun add' : 'npm install';
      pkg.scripts['vex:update'] = pkg.scripts['vex:update'].replace(/^pnpm add/, addCmd);
    }

    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  }

  /**
   * Configure the dev server port.
   * Updates package.json dev script and creates .env.local with NEXT_PUBLIC_SITE_URL.
   */
  protected async configurePort(port: number): Promise<void> {
    // Update package.json dev script with the port
    const pkgPath = path.join(this.targetPath, 'package.json');
    const pkg = await fs.readJson(pkgPath);
    if (pkg.scripts?.dev) {
      // Replace default port or add port flag
      if (pkg.scripts.dev.includes('--port')) {
        pkg.scripts.dev = pkg.scripts.dev.replace(/--port[= ]\d+/, `--port=${port}`);
      } else {
        pkg.scripts.dev = `${pkg.scripts.dev} --port=${port}`;
      }
    }
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });

    // Create .env.local with site URL and empty auth secret
    const envLocalPath = path.join(this.targetPath, '.env.local');
    const envContent = `NEXT_PUBLIC_SITE_URL=http://localhost:${port}\nBETTER_AUTH_SECRET=""\n`;
    await fs.writeFile(envLocalPath, envContent);
  }

  /**
   * Detect the package manager used to invoke the CLI
   */
  protected detectPackageManager(): PackageManager {
    const userAgent = process.env.npm_config_user_agent;

    if (userAgent) {
      if (userAgent.includes('pnpm')) return 'pnpm';
      if (userAgent.includes('yarn')) return 'yarn';
      if (userAgent.includes('bun')) return 'bun';
    }

    return 'npm';
  }

  /**
   * Install project dependencies using detected package manager
   */
  protected async installDependencies(): Promise<void> {
    const packageManager = this.detectPackageManager();
    const spinner = ora(`Installing dependencies with ${packageManager}...`).start();

    try {
      await execa(packageManager, ['install'], {
        cwd: this.targetPath,
        stdio: 'pipe',
      });
      spinner.succeed('Dependencies installed successfully');
    } catch (error) {
      spinner.fail('Failed to install dependencies');
      throw new Error(
        `Dependency installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Format code using project's formatter
   */
  protected async formatCode(): Promise<void> {
    const packageManager = this.detectPackageManager();
    const spinner = ora('Formatting code...').start();

    try {
      const result = await execa(packageManager, ['run', 'format'], {
        cwd: this.targetPath,
        stdio: 'pipe',
        reject: false,
      });

      if (result.exitCode === 0) {
        spinner.succeed('Code formatted successfully');
      } else {
        spinner.warn('Formatting completed with warnings');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      spinner.warn(`Failed to format code: ${errorMessage}`);
    }
  }

  /**
   * Lint and fix code using project's ESLint configuration
   */
  protected async lintCode(): Promise<void> {
    const packageManager = this.detectPackageManager();
    const spinner = ora('Linting and fixing code...').start();

    try {
      const args = packageManager === 'pnpm'
        ? ['lint', '--fix']
        : ['run', 'lint', '--', '--fix'];

      const result = await execa(packageManager, args, {
        cwd: this.targetPath,
        stdio: 'pipe',
        reject: false,
      });

      if (result.exitCode === 0) {
        spinner.succeed('Code linted and fixed successfully');
      } else {
        spinner.warn('Linting completed with warnings');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      spinner.warn(`Failed to lint code: ${errorMessage}`);
    }
  }

  /**
   * Initialize Git repository in target directory
   */
  protected async initGitRepo(): Promise<void> {
    const spinner = ora('Initializing Git repository...').start();

    try {
      try {
        await execa('git', ['--version'], { stdio: 'pipe' });
      } catch {
        spinner.fail('Git is not installed');
        throw new Error('Git is not installed. Please install Git to initialize a repository.');
      }

      await execa('git', ['init'], { cwd: this.targetPath, stdio: 'pipe' });
      await execa('git', ['add', '.'], { cwd: this.targetPath, stdio: 'pipe' });
      await execa(
        'git',
        ['commit', '-m', 'Initial commit from create-vexcms'],
        { cwd: this.targetPath, stdio: 'pipe' }
      );

      spinner.succeed('Git repository initialized');
    } catch (error) {
      spinner.fail('Failed to initialize Git repository');
      throw new Error(
        `Git initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate a secure random secret for Better Auth
   */
  protected generateAuthSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Write the generated auth secret to .env.example
   */
  protected async writeAuthSecret(): Promise<void> {
    const envPath = path.join(this.targetPath, '.env.example');
    const secret = this.generateAuthSecret();

    if (await fs.pathExists(envPath)) {
      let content = await fs.readFile(envPath, 'utf-8');
      content = content.replace(
        /BETTER_AUTH_SECRET=.*/,
        `BETTER_AUTH_SECRET=${secret}`
      );
      await fs.writeFile(envPath, content);
    }
  }

  /**
   * Configure the Better Auth organizations plugin.
   * When enabled, replaces placeholders with organization import and plugin.
   * When disabled, removes the placeholder lines.
   */
  protected async configureOrganizations(enabled: boolean): Promise<void> {
    const pluginsPath = path.join(this.targetPath, 'convex/auth/plugins/index.ts');

    if (!await fs.pathExists(pluginsPath)) return;

    let content = await fs.readFile(pluginsPath, 'utf-8');

    if (enabled) {
      content = content.replace(
        '// {{ORGANIZATIONS_IMPORT}}',
        'import { organization } from "better-auth/plugins"'
      );
      content = content.replace(
        '  // {{ORGANIZATIONS_PLUGIN}}',
        '  organization(),'
      );
    } else {
      content = content.replace(/.*\/\/ \{\{ORGANIZATIONS_IMPORT\}\}\n?/, '');
      content = content.replace(/.*\/\/ \{\{ORGANIZATIONS_PLUGIN\}\}\n?/, '');
    }

    await fs.writeFile(pluginsPath, content);
  }

  /**
   * Main orchestration method for project initialization
   */
  async initProject(options: ProjectOptions): Promise<void> {
    // Step 1: Copy base template files
    const copySpinner = ora('Copying template files...').start();
    try {
      await this.copyBaseFiles();
      copySpinner.succeed('Template files copied');
    } catch (error) {
      copySpinner.fail('Failed to copy template files');
      throw error;
    }

    // Step 2: Apply template overlay (unless --bare)
    if (!options.bare) {
      const overlaySpinner = ora('Applying marketing site template...').start();
      try {
        await this.applyTemplateOverlay('marketing-site');
        overlaySpinner.succeed('Marketing site template applied');
      } catch (error) {
        overlaySpinner.fail('Failed to apply template overlay');
        throw error;
      }
    }

    // Step 3: Update package.json name and configure port
    const nameSpinner = ora('Configuring project...').start();
    try {
      await this.updatePackageName(options.projectName);
      await this.configurePort(options.port);
      nameSpinner.succeed('Project configured');
    } catch (error) {
      nameSpinner.fail('Failed to configure project');
      throw error;
    }

    // Step 4: Configure OAuth providers and email/password auth
    const authSpinner = ora('Configuring authentication...').start();
    try {
      await this.updateOAuthConfig(options.oauthProviders, options.emailPasswordAuth);
      authSpinner.succeed(
        options.emailPasswordAuth || options.oauthProviders.length > 0
          ? 'Authentication configuration updated'
          : 'Authentication placeholders cleaned up'
      );
    } catch (error) {
      authSpinner.fail('Failed to configure authentication');
      throw error;
    }

    // Step 5: Configure OAuth UI
    const oauthUISpinner = ora('Configuring OAuth UI...').start();
    try {
      await this.updateOAuthUIConfig(options.oauthProviders, options.emailPasswordAuth);
      oauthUISpinner.succeed(
        options.oauthProviders.length > 0
          ? 'OAuth UI configuration updated'
          : 'OAuth UI placeholders cleaned up'
      );
    } catch (error) {
      oauthUISpinner.fail('Failed to configure OAuth UI');
      throw error;
    }

    // Step 6: Update .env.example
    const envSpinner = ora('Updating .env.example...').start();
    try {
      await this.updateEnvExample(options.oauthProviders);
      envSpinner.succeed(
        options.oauthProviders.length > 0
          ? '.env.example updated'
          : '.env.example placeholders cleaned up'
      );
    } catch (error) {
      envSpinner.fail('Failed to update .env.example');
      throw error;
    }

    // Step 7: Update typed env configuration
    const envTsSpinner = ora('Updating typed env configuration...').start();
    try {
      await this.updateEnvTs(options.oauthProviders);
      envTsSpinner.succeed(
        options.oauthProviders.length > 0
          ? 'Typed env configuration updated'
          : 'Typed env placeholders cleaned up'
      );
    } catch (error) {
      envTsSpinner.fail('Failed to update typed env configuration');
      throw error;
    }

    // Step 8: Update README
    const readmeSpinner = ora('Updating README...').start();
    try {
      await this.updateReadme(options.oauthProviders);
      readmeSpinner.succeed(
        options.oauthProviders.length > 0
          ? 'README updated'
          : 'README placeholders cleaned up'
      );
    } catch (error) {
      readmeSpinner.fail('Failed to update README');
      throw error;
    }

    // Step 9: Configure organizations plugin
    const orgsSpinner = ora('Configuring organizations...').start();
    try {
      await this.configureOrganizations(options.orgs);
      orgsSpinner.succeed(
        options.orgs
          ? 'Organizations plugin enabled'
          : 'Organizations placeholders cleaned up'
      );
    } catch (error) {
      orgsSpinner.fail('Failed to configure organizations');
      throw error;
    }

    // Step 10: Generate auth secret
    // (renumbered from Step 9 after organizations insertion)
    const secretSpinner = ora('Generating auth secret...').start();
    try {
      await this.writeAuthSecret();
      secretSpinner.succeed('Auth secret generated');
    } catch (error) {
      secretSpinner.fail('Failed to generate auth secret');
      throw error;
    }

    // Step 10: Initialize Git repository (optional)
    if (options.initGit) {
      await this.initGitRepo();
    }

    // Step 11: Install dependencies (optional)
    if (options.installDependencies) {
      await this.installDependencies();
      await this.lintCode();
      await this.formatCode();
    }
  }
}
