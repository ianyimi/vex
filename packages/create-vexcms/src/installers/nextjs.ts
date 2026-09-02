/**
 * VexNextJSInstaller Implementation
 *
 * Framework-specific installer for Next.js projects.
 * Implements abstract methods with Next.js-specific file paths and configurations.
 *
 * Forked from create-z3-app NextJSInstaller.
 */

import { join } from 'path';
import { VexFrameworkInstaller } from './base.js';
import {
  replacePlaceholder,
  generateAuthProvidersBlock,
  generateOAuthUIProvidersBlock,
  generateEnvVarsBlock,
  generateReadmeSection,
  generateEnvTsServerSchema,
  generateEnvTsRuntimeMapping,
  generateCredentialsValue,
} from './string-utils.js';

/**
 * Next.js framework installer
 * Handles Next.js App Router-specific file locations and configuration patterns
 */
export class VexNextJSInstaller extends VexFrameworkInstaller {
  /**
   * Framework identifier used for template selection and logging.
   *
   * @returns The literal string `"nextjs"`.
   */
  get frameworkName(): string {
    return 'nextjs';
  }

  /**
   * Update OAuth configuration in Convex auth options file
   * Target file: convex/auth/options.ts
   *
   * @param selectedProviders - IDs of the OAuth providers chosen for the project (e.g. `["google", "github"]`).
   * @param emailPasswordEnabled - Whether email/password authentication is also enabled.
   */
  async updateOAuthConfig(
    selectedProviders: string[],
    emailPasswordEnabled: boolean
  ): Promise<void> {
    const authFilePath = join(this.targetPath, 'convex/auth/options.ts');

    const authProvidersBlock = generateAuthProvidersBlock(
      selectedProviders,
      emailPasswordEnabled
    );

    await replacePlaceholder(
      authFilePath,
      '// {{OAUTH_PROVIDERS}}',
      authProvidersBlock
    );

    await replacePlaceholder(
      authFilePath,
      '// {{EMAIL_PASSWORD_AUTH}}',
      '',
      { graceful: true }
    );
  }

  /**
   * Update OAuth UI configuration in auth client file
   * Target file: src/auth/client.tsx
   *
   * @param selectedProviders - IDs of the OAuth providers chosen for the project (e.g. `["google", "github"]`).
   * @param emailPasswordEnabled - Whether email/password authentication is also enabled.
   */
  async updateOAuthUIConfig(
    selectedProviders: string[],
    emailPasswordEnabled: boolean
  ): Promise<void> {
    const providersFilePath = join(this.targetPath, 'src/auth/client.tsx');

    const uiConfigBlock = generateOAuthUIProvidersBlock(selectedProviders);
    await replacePlaceholder(
      providersFilePath,
      '// {{OAUTH_UI_PROVIDERS}}',
      uiConfigBlock
    );

    const credentialsValue = generateCredentialsValue(emailPasswordEnabled);
    await replacePlaceholder(
      providersFilePath,
      '/* {{EMAIL_PASSWORD_CREDENTIALS}} */',
      credentialsValue
    );
  }

  /**
   * Update .env.example with OAuth environment variables
   * Target file: .env.example
   *
   * @param selectedProviders - IDs of the OAuth providers chosen for the project (e.g. `["google", "github"]`).
   */
  async updateEnvExample(selectedProviders: string[]): Promise<void> {
    const envFilePath = join(this.targetPath, '.env.example');
    const envVarsBlock = generateEnvVarsBlock(selectedProviders, 'nextjs');

    await replacePlaceholder(
      envFilePath,
      '# {{ENV_OAUTH_VARS}}',
      envVarsBlock
    );
  }

  /**
   * Update README with OAuth provider setup guides
   * Target file: README.md
   *
   * @param selectedProviders - IDs of the OAuth providers chosen for the project (e.g. `["google", "github"]`).
   */
  async updateReadme(selectedProviders: string[]): Promise<void> {
    const readmeFilePath = join(this.targetPath, 'README.md');
    const readmeSection = generateReadmeSection(selectedProviders);

    await replacePlaceholder(
      readmeFilePath,
      '<!-- {{OAUTH_SETUP_GUIDE}} -->',
      readmeSection,
      { graceful: true }
    );
  }

  /**
   * Update env.mjs with OAuth provider environment variables
   * Target file: src/env.mjs
   *
   * @param selectedProviders - IDs of the OAuth providers chosen for the project (e.g. `["google", "github"]`).
   */
  async updateEnvTs(selectedProviders: string[]): Promise<void> {
    const envFilePath = join(this.targetPath, 'src/env.mjs');

    const serverSchema = generateEnvTsServerSchema(selectedProviders);
    await replacePlaceholder(
      envFilePath,
      '// {{OAUTH_ENV_SERVER_SCHEMA}}',
      serverSchema
    );

    const runtimeMapping = generateEnvTsRuntimeMapping(selectedProviders);
    await replacePlaceholder(
      envFilePath,
      '// {{OAUTH_ENV_RUNTIME_MAPPING}}',
      runtimeMapping
    );
  }
}
