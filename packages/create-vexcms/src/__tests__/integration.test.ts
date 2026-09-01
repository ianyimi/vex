import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { createInstaller } from '../installers/index.js';
import type { ProjectOptions } from '../installers/types.js';
import { assertScaffold, PROHIBITED_PATTERNS } from '../../../../scripts/scaffold-smoke.mjs';

/**
 * Integration tests that scaffold real projects through the installer and
 * verify the output end to end. Template presence is a hard prerequisite,
 * never a silent skip (AP-013) — see the negative-gate procedure in the
 * Step 6 spec section for how this gate is proven to actually fail.
 */

const templatesDir = process.env.VEX_TEMPLATES_DIR_OVERRIDE
  ? path.resolve(process.env.VEX_TEMPLATES_DIR_OVERRIDE)
  : path.resolve(import.meta.dirname, '../../templates');
const baseTemplateDir = path.join(templatesDir, 'base-nextjs');
const marketingTemplateDir = path.join(templatesDir, 'marketing-site');

const YES_DEFAULTS = {
  framework: 'nextjs' as const,
  port: 3010,
  orgs: false,
  emailPasswordAuth: true,
  oauthProviders: [] as string[],
  initGit: false,
  installDependencies: false,
  workspaceRoot: null as string | null,
  yes: true,
};

async function scaffold(overrides: {
  projectName: string;
  projectDir: string;
  bare: boolean;
  monorepo: boolean;
  workspaceRoot?: string | null;
}): Promise<void> {
  const options: ProjectOptions = { ...YES_DEFAULTS, ...overrides };
  const installer = createInstaller({
    framework: options.framework,
    projectDir: options.projectDir,
    projectName: options.projectName,
  });
  await installer.initProject(options);
}

let tmpRoot: string;
let bareDir: string;
let fullDir: string;
let monorepoDir: string;
let monorepoWorkspaceRoot: string;
let hostCatalog: Record<string, string>;

beforeAll(async () => {
  if (!fs.existsSync(baseTemplateDir)) {
    throw new Error(
      `templates/base-nextjs is missing at ${baseTemplateDir} — Step 3 ` +
        '(author templates/base-nextjs from apps/test) has not landed. ' +
        'This suite refuses to pass against an absent template.'
    );
  }
  if (!fs.existsSync(marketingTemplateDir)) {
    throw new Error(
      `templates/marketing-site is missing at ${marketingTemplateDir} — Step 4 ` +
        '(author templates/marketing-site overlay) has not landed. ' +
        'This suite refuses to pass against an absent template.'
    );
  }

  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vex-scaffold-'));

  bareDir = path.join(tmpRoot, 'bare-project');
  fs.ensureDirSync(bareDir);
  await scaffold({ projectName: 'bare-project', projectDir: bareDir, bare: true, monorepo: false });

  fullDir = path.join(tmpRoot, 'full-project');
  fs.ensureDirSync(fullDir);
  await scaffold({ projectName: 'full-project', projectDir: fullDir, bare: false, monorepo: false });

  // Build the host catalog FROM the bare scaffold's own resolved deps, so the
  // monorepo rewrite is observable regardless of which literal versions the
  // templates carry — every non-@vexcms dep the bare project ships is added
  // to the fake workspace catalog under its own literal version.
  const barePkg = fs.readJsonSync(path.join(bareDir, 'package.json'));
  hostCatalog = {};
  for (const [name, version] of Object.entries({
    ...(barePkg.dependencies ?? {}),
    ...(barePkg.devDependencies ?? {}),
  }) as [string, string][]) {
    if (!name.startsWith('@vexcms/')) hostCatalog[name] = version;
  }

  monorepoWorkspaceRoot = path.join(tmpRoot, 'host-workspace');
  fs.ensureDirSync(monorepoWorkspaceRoot);
  const catalogLines = Object.entries(hostCatalog).map(
    ([name, version]) => `  ${JSON.stringify(name)}: ${JSON.stringify(version)}`
  );
  fs.writeFileSync(
    path.join(monorepoWorkspaceRoot, 'pnpm-workspace.yaml'),
    ['packages:', '  - "apps/*"', 'catalog:', ...catalogLines, ''].join('\n')
  );

  monorepoDir = path.join(monorepoWorkspaceRoot, 'apps', 'monorepo-project');
  fs.ensureDirSync(monorepoDir);
  await scaffold({
    projectName: 'monorepo-project',
    projectDir: monorepoDir,
    bare: false,
    monorepo: true,
    workspaceRoot: monorepoWorkspaceRoot,
  });
}, 120_000);

afterAll(() => {
  if (tmpRoot) fs.removeSync(tmpRoot);
});

describe('template markers (Contract 4 — installer is the source of truth)', () => {
  it('base-nextjs template source carries every marker the installer substitutes', () => {
    const authOptions = fs.readFileSync(path.join(baseTemplateDir, 'convex/auth/options.ts'), 'utf-8');
    expect(authOptions).toContain('// {{OAUTH_PROVIDERS}}');
    expect(authOptions).toContain('// {{EMAIL_PASSWORD_AUTH}}');

    const authClient = fs.readFileSync(path.join(baseTemplateDir, 'src/auth/client.tsx'), 'utf-8');
    expect(authClient).toContain('// {{OAUTH_UI_PROVIDERS}}');
    expect(authClient).toContain('/* {{EMAIL_PASSWORD_CREDENTIALS}} */');

    // Stored as `_env.example` in the template source — npm strips real
    // dotfiles from published packages, so the underscore-prefixed name is
    // only renamed to `.env.example` by `copyTemplate` at scaffold time.
    const envExample = fs.readFileSync(path.join(baseTemplateDir, '_env.example'), 'utf-8');
    expect(envExample).toContain('# {{ENV_OAUTH_VARS}}');

    const envMjs = fs.readFileSync(path.join(baseTemplateDir, 'src/env.mjs'), 'utf-8');
    expect(envMjs).toContain('// {{OAUTH_ENV_SERVER_SCHEMA}}');
    expect(envMjs).toContain('// {{OAUTH_ENV_RUNTIME_MAPPING}}');

    const readme = fs.readFileSync(path.join(baseTemplateDir, 'README.md'), 'utf-8');
    expect(readme).toContain('<!-- {{OAUTH_SETUP_GUIDE}} -->');

    const pkg = fs.readFileSync(path.join(baseTemplateDir, 'package.json'), 'utf-8');
    expect(pkg).toContain('{{PROJECT_NAME}}');
  });

  it('bare scaffold resolves every installer-substitution marker to real content', () => {
    const pkg = fs.readJsonSync(path.join(bareDir, 'package.json'));
    expect(pkg.name).toBe('bare-project');
    expect(JSON.stringify(pkg)).not.toContain('{{PROJECT_NAME}}');

    const authOptions = fs.readFileSync(path.join(bareDir, 'convex/auth/options.ts'), 'utf-8');
    expect(authOptions).not.toContain('{{OAUTH_PROVIDERS}}');
    expect(authOptions).not.toContain('{{EMAIL_PASSWORD_AUTH}}');

    const authClient = fs.readFileSync(path.join(bareDir, 'src/auth/client.tsx'), 'utf-8');
    expect(authClient).not.toContain('{{OAUTH_UI_PROVIDERS}}');
    expect(authClient).not.toContain('{{EMAIL_PASSWORD_CREDENTIALS}}');

    const envExample = fs.readFileSync(path.join(bareDir, '.env.example'), 'utf-8');
    expect(envExample).not.toContain('{{ENV_OAUTH_VARS}}');

    const envMjs = fs.readFileSync(path.join(bareDir, 'src/env.mjs'), 'utf-8');
    expect(envMjs).not.toContain('{{OAUTH_ENV_SERVER_SCHEMA}}');
    expect(envMjs).not.toContain('{{OAUTH_ENV_RUNTIME_MAPPING}}');

    const readme = fs.readFileSync(path.join(bareDir, 'README.md'), 'utf-8');
    expect(readme).not.toContain('{{OAUTH_SETUP_GUIDE}}');
  });
});

describe('canonical scaffold tree (single source of truth: scripts/scaffold-smoke.mjs)', () => {
  it('bare scaffold matches the exported "bare" manifest exactly', () => {
    const { ok, errors } = assertScaffold({ targetDir: bareDir, mode: 'bare' });
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
  });

  it('full (marketing overlay) scaffold matches the exported "full" manifest exactly', () => {
    const { ok, errors } = assertScaffold({ targetDir: fullDir, mode: 'full' });
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
  });

  it('monorepo scaffold has full-manifest tree parity (only its package.json protocol differs)', () => {
    const { ok, errors } = assertScaffold({ targetDir: monorepoDir, mode: 'full' });
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
  });
});

describe('prohibited legacy API patterns (Step 4 Verify list)', () => {
  it('marketing-site scaffold contains none of the pre-rebuild API patterns', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry.name)) continue;
        const source = fs.readFileSync(full, 'utf-8');
        for (const { label, test } of PROHIBITED_PATTERNS) {
          if (test(source)) offenders.push(`${label} in ${path.relative(fullDir, full)}`);
        }
      }
    };
    walk(fullDir);
    expect(offenders).toEqual([]);
  });
});

describe('.env.local (Contract 6 — deployment-less build)', () => {
  it('writes a generated secret and placeholder Convex URLs for both bare and full scaffolds', () => {
    for (const dir of [bareDir, fullDir]) {
      const envLocal = fs.readFileSync(path.join(dir, '.env.local'), 'utf-8');
      const secretMatch = envLocal.match(/^BETTER_AUTH_SECRET=([0-9a-f]{64})$/m);
      expect(secretMatch).not.toBeNull();
      expect(envLocal).toContain('NEXT_PUBLIC_SITE_URL=http://localhost:3010');
      expect(envLocal).toContain('SITE_URL=http://localhost:3010');
      expect(envLocal).toContain('NEXT_PUBLIC_CONVEX_URL=https://placeholder.convex.cloud');
      expect(envLocal).toContain('NEXT_PUBLIC_CONVEX_SITE_URL=https://placeholder.convex.site');
      expect(envLocal).toContain('CONVEX_DEPLOYMENT=');
    }
  });
});

describe('package.json protocol per mode (Contract 5 / Contract 8)', () => {
  it('bare scaffold uses literal versions only', () => {
    const pkg = fs.readFileSync(path.join(bareDir, 'package.json'), 'utf-8');
    expect(pkg).not.toMatch(/workspace:/);
    expect(pkg).not.toMatch(/"catalog:/);
  });

  it('full (standalone) scaffold uses literal versions only', () => {
    const pkg = fs.readFileSync(path.join(fullDir, 'package.json'), 'utf-8');
    expect(pkg).not.toMatch(/workspace:/);
    expect(pkg).not.toMatch(/"catalog:/);
  });

  it('monorepo scaffold rewrites @vexcms/* to workspace:* and host-catalog deps to catalog:', () => {
    const pkg = fs.readJsonSync(path.join(monorepoDir, 'package.json'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies } as Record<string, string>;

    for (const [name, spec] of Object.entries(allDeps)) {
      if (name.startsWith('@vexcms/')) {
        expect(spec).toBe('workspace:*');
      } else if (name in hostCatalog) {
        expect(spec).toBe('catalog:');
      } else {
        expect(spec).not.toMatch(/^(workspace:|catalog:)/);
      }
    }
  });
});

describe('overlay merge behavior (Contract 2 — template split)', () => {
  it('marketing-only collections/globals are present in full and absent in bare', () => {
    const marketingOnly = [
      'src/vexcms/collections/pages.ts',
      'src/vexcms/collections/headers.ts',
      'src/vexcms/collections/footers.ts',
      'src/vexcms/collections/themes.ts',
      'src/vexcms/globals/siteSettings.ts',
      'convex/seed.ts',
    ];
    for (const rel of marketingOnly) {
      expect(fs.existsSync(path.join(bareDir, rel))).toBe(false);
      expect(fs.existsSync(path.join(fullDir, rel))).toBe(true);
    }
  });

  it('base auth/admin/media files survive the overlay unchanged in both modes', () => {
    const baseOwned = [
      'package.json',
      'convex/auth/index.ts',
      'convex/auth/db.ts',
      'src/vexcms/collections/users.ts',
      '.gitignore',
    ];
    for (const rel of baseOwned) {
      expect(fs.existsSync(path.join(bareDir, rel))).toBe(true);
      expect(fs.existsSync(path.join(fullDir, rel))).toBe(true);
    }
  });

  it('overlay replaces vex.config.ts with the marketing-site version (overwrite: true)', () => {
    const bareConfig = fs.readFileSync(path.join(bareDir, 'src/vex.config.ts'), 'utf-8');
    expect(bareConfig).toContain('collections: [users]');

    const fullConfig = fs.readFileSync(path.join(fullDir, 'src/vex.config.ts'), 'utf-8');
    expect(fullConfig).toContain('collections: [users, pages, headers, footers, themes]');
    expect(fullConfig).toContain('globals: [siteSettings]');
  });
});

describe('vex scripts (base template contract)', () => {
  it('package.json carries the vex:dev / vex:generate / vex:update scripts', () => {
    const pkg = fs.readJsonSync(path.join(bareDir, 'package.json'));
    expect(pkg.scripts['vex:dev']).toBe('vex dev');
    expect(pkg.scripts['vex:generate']).toBe('vex dev --once');
    expect(pkg.scripts['vex:update']).toContain('@vexcms/core@latest');
  });
});
