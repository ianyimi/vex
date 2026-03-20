import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { copyTemplate, overlayTemplate } from '../helpers/fileOperations.js';

/**
 * Integration tests that verify the full template scaffold works end-to-end.
 * These tests copy the actual templates and verify the output structure.
 */
describe('template scaffold integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vex-integration-'));
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  const templatesDir = path.resolve(import.meta.dirname, '../../templates');

  describe('base-nextjs template (bare mode)', () => {
    it('contains essential project files', async () => {
      if (!fs.existsSync(path.join(templatesDir, 'base-nextjs'))) return;

      const targetDir = path.join(tmpDir, 'bare-project');
      await copyTemplate('nextjs', targetDir);

      // Core files
      expect(fs.existsSync(path.join(targetDir, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'tsconfig.json'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'next.config.ts'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'vex.config.ts'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, '.gitignore'))).toBe(true);

      // Auth adapter
      expect(fs.existsSync(path.join(targetDir, 'convex/auth/adapter/index.ts'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'convex/auth/db.ts'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'convex/auth/sessions.ts'))).toBe(true);

      // VEX CMS config
      expect(fs.existsSync(path.join(targetDir, 'src/vexcms/auth.ts'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'src/vexcms/collections/index.ts'))).toBe(true);
    });

    it('has empty collections in bare vex.config.ts', async () => {
      if (!fs.existsSync(path.join(templatesDir, 'base-nextjs'))) return;

      const targetDir = path.join(tmpDir, 'bare-project');
      await copyTemplate('nextjs', targetDir);

      const vexConfig = fs.readFileSync(path.join(targetDir, 'vex.config.ts'), 'utf-8');
      expect(vexConfig).toContain('collections: []');
    });

    it('has {{PROJECT_NAME}} placeholder in package.json', async () => {
      if (!fs.existsSync(path.join(templatesDir, 'base-nextjs'))) return;

      const targetDir = path.join(tmpDir, 'bare-project');
      await copyTemplate('nextjs', targetDir);

      const pkg = fs.readFileSync(path.join(targetDir, 'package.json'), 'utf-8');
      expect(pkg).toContain('{{PROJECT_NAME}}');
    });

    it('has vex scripts in package.json', async () => {
      if (!fs.existsSync(path.join(templatesDir, 'base-nextjs'))) return;

      const targetDir = path.join(tmpDir, 'bare-project');
      await copyTemplate('nextjs', targetDir);

      const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf-8'));
      expect(pkg.scripts['vex:dev']).toBe('vex dev');
      expect(pkg.scripts['vex:generate']).toBe('vex dev --once');
      expect(pkg.scripts['vex:update']).toContain('@vexcms/core@latest');
    });

    it('has OAuth placeholders in template files', async () => {
      if (!fs.existsSync(path.join(templatesDir, 'base-nextjs'))) return;

      const targetDir = path.join(tmpDir, 'bare-project');
      await copyTemplate('nextjs', targetDir);

      const authOptions = fs.readFileSync(path.join(targetDir, 'convex/auth/options.ts'), 'utf-8');
      expect(authOptions).toContain('// {{OAUTH_PROVIDERS}}');
      expect(authOptions).toContain('// {{EMAIL_PASSWORD_AUTH}}');

      const authClient = fs.readFileSync(path.join(targetDir, 'src/auth/client.tsx'), 'utf-8');
      expect(authClient).toContain('// {{OAUTH_UI_PROVIDERS}}');
      expect(authClient).toContain('/* {{EMAIL_PASSWORD_CREDENTIALS}} */');

      const envExample = fs.readFileSync(path.join(targetDir, '.env.example'), 'utf-8');
      expect(envExample).toContain('# {{ENV_OAUTH_VARS}}');

      const envMjs = fs.readFileSync(path.join(targetDir, 'src/env.mjs'), 'utf-8');
      expect(envMjs).toContain('// {{OAUTH_ENV_SERVER_SCHEMA}}');
      expect(envMjs).toContain('// {{OAUTH_ENV_RUNTIME_MAPPING}}');

      const readme = fs.readFileSync(path.join(targetDir, 'README.md'), 'utf-8');
      expect(readme).toContain('<!-- {{OAUTH_SETUP_GUIDE}} -->');
    });

    it('does not contain workspace:* or catalog: versions', async () => {
      if (!fs.existsSync(path.join(templatesDir, 'base-nextjs'))) return;

      const targetDir = path.join(tmpDir, 'bare-project');
      await copyTemplate('nextjs', targetDir);

      const pkg = fs.readFileSync(path.join(targetDir, 'package.json'), 'utf-8');
      expect(pkg).not.toContain('workspace:');
      expect(pkg).not.toContain('"catalog:');
    });

    it('does not contain test-app specific files', async () => {
      if (!fs.existsSync(path.join(templatesDir, 'base-nextjs'))) return;

      const targetDir = path.join(tmpDir, 'bare-project');
      await copyTemplate('nextjs', targetDir);

      // No test-specific collections
      expect(fs.existsSync(path.join(targetDir, 'src/vexcms/collections/articles.ts'))).toBe(false);
      expect(fs.existsSync(path.join(targetDir, 'src/vexcms/collections/posts.ts'))).toBe(false);
      expect(fs.existsSync(path.join(targetDir, 'src/vexcms/collections/categories.ts'))).toBe(false);

      // No custom field components
      expect(fs.existsSync(path.join(targetDir, 'src/components/admin/ColorCell.tsx'))).toBe(false);
      expect(fs.existsSync(path.join(targetDir, 'src/components/admin/ColorField.tsx'))).toBe(false);

      // No generated convex files
      expect(fs.existsSync(path.join(targetDir, 'convex/vex'))).toBe(false);
      expect(fs.existsSync(path.join(targetDir, 'convex/vex.schema.ts'))).toBe(false);
      expect(fs.existsSync(path.join(targetDir, 'convex/vex.types.ts'))).toBe(false);
    });
  });

  describe('marketing-site overlay (default mode)', () => {
    it('adds collection files on top of base template', async () => {
      if (!fs.existsSync(path.join(templatesDir, 'base-nextjs'))) return;
      if (!fs.existsSync(path.join(templatesDir, 'marketing-site'))) return;

      const targetDir = path.join(tmpDir, 'marketing-project');
      await copyTemplate('nextjs', targetDir);
      await overlayTemplate({
        overlayDir: path.join(templatesDir, 'marketing-site'),
        targetDir,
      });

      // Collection files exist
      expect(fs.existsSync(path.join(targetDir, 'src/vexcms/collections/pages.ts'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'src/vexcms/collections/headers.ts'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'src/vexcms/collections/footers.ts'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'src/vexcms/collections/themes.ts'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'src/vexcms/collections/site_settings.ts'))).toBe(true);
    });

    it('overrides vex.config.ts with marketing site version', async () => {
      if (!fs.existsSync(path.join(templatesDir, 'base-nextjs'))) return;
      if (!fs.existsSync(path.join(templatesDir, 'marketing-site'))) return;

      const targetDir = path.join(tmpDir, 'marketing-project');
      await copyTemplate('nextjs', targetDir);
      await overlayTemplate({
        overlayDir: path.join(templatesDir, 'marketing-site'),
        targetDir,
      });

      const vexConfig = fs.readFileSync(path.join(targetDir, 'vex.config.ts'), 'utf-8');
      expect(vexConfig).toContain('pages');
      expect(vexConfig).toContain('headers');
      expect(vexConfig).toContain('footers');
      expect(vexConfig).toContain('themes');
      expect(vexConfig).toContain('siteSettings');
      // The top-level collections should not be empty (media.collections: [] is fine)
      expect(vexConfig).toContain('collections: [pages, headers, footers, themes, siteSettings]');
    });

    it('extends db/constants with site builder slugs', async () => {
      if (!fs.existsSync(path.join(templatesDir, 'base-nextjs'))) return;
      if (!fs.existsSync(path.join(templatesDir, 'marketing-site'))) return;

      const targetDir = path.join(tmpDir, 'marketing-project');
      await copyTemplate('nextjs', targetDir);
      await overlayTemplate({
        overlayDir: path.join(templatesDir, 'marketing-site'),
        targetDir,
      });

      const constants = fs.readFileSync(path.join(targetDir, 'src/db/constants/index.ts'), 'utf-8');
      expect(constants).toContain('TABLE_SLUG_PAGES');
      expect(constants).toContain('TABLE_SLUG_HEADERS');
      expect(constants).toContain('TABLE_SLUG_FOOTERS');
      expect(constants).toContain('TABLE_SLUG_THEMES');
      expect(constants).toContain('TABLE_SLUG_SITE_SETTINGS');
      // Still has auth slugs
      expect(constants).toContain('TABLE_SLUG_USERS');
    });

    it('preserves base template files not in overlay', async () => {
      if (!fs.existsSync(path.join(templatesDir, 'base-nextjs'))) return;
      if (!fs.existsSync(path.join(templatesDir, 'marketing-site'))) return;

      const targetDir = path.join(tmpDir, 'marketing-project');
      await copyTemplate('nextjs', targetDir);
      await overlayTemplate({
        overlayDir: path.join(templatesDir, 'marketing-site'),
        targetDir,
      });

      // Base files still present
      expect(fs.existsSync(path.join(targetDir, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'next.config.ts'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'convex/auth/adapter/index.ts'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'src/vexcms/auth.ts'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, '.gitignore'))).toBe(true);
    });
  });
});
