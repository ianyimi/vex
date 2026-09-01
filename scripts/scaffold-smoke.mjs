#!/usr/bin/env node
/**
 * scripts/scaffold-smoke.mjs
 *
 * Scaffolds a template combination into a tmp directory via the create-vexcms
 * installer (no install, no git) and asserts the result: expected file tree,
 * resolved placeholder markers, and absence of pre-rebuild API patterns.
 *
 * `EXPECTED_TREE`, `PROHIBITED_PATTERNS`, and `assertScaffold` are exported so
 * packages/create-vexcms/src/__tests__/integration.test.ts shares this
 * script's manifest instead of maintaining a second, driftable copy — this
 * script and the vitest suite are two callers of one assertion module.
 *
 * `createInstaller` is loaded from TypeScript `src/` via `jiti` — not from
 * `dist/` — because `packages/create-vexcms/src/index.ts` is a CLI entry
 * point with top-level side effects (`Command#parse()` runs on import); the
 * package's `tsup` build also only emits a single bundled `dist/index.js`,
 * with no `dist/installers/` subpath to import from safely. Loading `src/`
 * directly through `jiti` (as this script always has, Step 3 onward) is the
 * only import path that is both live-source and side-effect-free.
 *
 * CLI usage: node scripts/scaffold-smoke.mjs [--bare] [--monorepo]
 */
import { createJiti } from 'jiti';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const CUT_ADMIN_COMPONENTS = [
  'src/components/admin/ColorCell.tsx',
  'src/components/admin/ColorField.tsx',
  'src/components/admin/ThemeImportField.tsx',
  'src/components/admin/ThemeImport.tsx',
  'src/components/admin/IconPickerField.tsx',
];

const DEAD_GENERATION_DIRS = ['convex/vex/api', 'convex/vex/model'];

const BLOCK_NAMES = ['Hero', 'Features', 'CTA', 'FAQ', 'Header', 'Footer', 'HowItWorks', 'Roadmap'];

const BARE_REQUIRED = [
  'package.json',
  'tsconfig.json',
  'next.config.ts',
  'src/vex.config.ts',
  '.gitignore',
  '.env.example',
  '.env.local',
  'README.md',
  'src/env.mjs',
  'src/app/layout.tsx',
  'convex/auth/index.ts',
  'convex/auth/db.ts',
  'convex/auth/sessions.ts',
  'convex/auth/options.ts',
  'convex/auth/plugins/index.ts',
  'src/auth/client.tsx',
  'src/vexcms/collections/users.ts',
  'src/vexcms/collections/index.ts',
  'convex/vex/firstUser.ts',
  'convex/vex/globals.ts',
  'convex/vex/media.ts',
  'src/components/WelcomePage.tsx',
  'convex/vex.schema.ts',
  'src/vex.types.ts',
  'convex/_generated/api.d.ts',
  'convex/_generated/dataModel.d.ts',
  'convex/_generated/server.d.ts',
];

const MARKETING_ONLY = [
  'src/vexcms/collections/pages.ts',
  'src/vexcms/collections/headers.ts',
  'src/vexcms/collections/footers.ts',
  'src/vexcms/collections/themes.ts',
  'src/vexcms/globals/index.ts',
  'src/vexcms/globals/siteSettings.ts',
  'convex/seed.ts',
  ...BLOCK_NAMES.flatMap((name) => [
    `src/vexcms/blocks/${name}/config.ts`,
    `src/vexcms/blocks/${name}/index.tsx`,
  ]),
];

// Cut/dead regardless of mode: draft-preview machinery and per-instance admin
// field components are unshipped, and the per-collection generation dirs are
// dead in every scaffold (Step 1).
const ALWAYS_FORBIDDEN = [...DEAD_GENERATION_DIRS, ...CUT_ADMIN_COMPONENTS, 'src/app/(frontend)/preview'];

export const EXPECTED_TREE = {
  bare: {
    required: BARE_REQUIRED,
    forbidden: [...MARKETING_ONLY, 'src/vexcms/blocks', 'src/vexcms/globals', ...ALWAYS_FORBIDDEN],
  },
  full: {
    required: [...BARE_REQUIRED, ...MARKETING_ONLY],
    forbidden: ALWAYS_FORBIDDEN,
  },
};

// The rebuilt field API's own `group()` legitimately compiles to Convex
// validator calls named `v.object(...)` (see convex/vex.schema.ts) — only a
// bare `object(` (the cut field-builder call) is prohibited, never `v.object(`.
export const PROHIBITED_PATTERNS = [
  { label: 'object(', test: (source) => /(?<!v\.)\bobject\(/.test(source) },
  { label: 'ui(', test: (source) => /\bui\(/.test(source) },
  { label: 'tabs(', test: (source) => /\btabs\(/.test(source) },
  { label: 'imageUrl(', test: (source) => /\bimageUrl\(/.test(source) },
  { label: 'richtext(', test: (source) => /\brichtext\(/.test(source) },
  { label: 'blockStyles', test: (source) => /\bblockStyles\b/.test(source) },
  { label: '_vexDrafts', test: (source) => /_vexDrafts/.test(source) },
  {
    // Heuristic, not a parser: flags a scalar string literal following any
    // `defaultValue:` that appears after a `select(` earlier in the same
    // file. Good enough for a whole-output sweep (Step 4's Verify phrasing
    // is itself output-wide, not call-scoped).
    label: 'scalar select() defaultValue',
    test: (source) => /select\(\{[\s\S]*?defaultValue:\s*(?!\[)['"]/m.test(source),
  },
];

const PLACEHOLDER_RE = /\{\{[A-Z0-9_]+\}\}/g;
const SKIP_DIRS = new Set(['node_modules', '.git', '.next']);

function walkFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

/**
 * Asserts a scaffolded project directory against the manifest for `mode`.
 * Pure/sync — callers scaffold with the installer first, then hand the
 * resulting `targetDir` here. `mode` is `"bare"` or `"full"`; a monorepo
 * scaffold is tree-identical to `"full"` (only its package.json protocol
 * differs, which callers assert separately).
 *
 * @param {{ targetDir: string, mode: "bare" | "full" }} props
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function assertScaffold({ targetDir, mode }) {
  const manifest = EXPECTED_TREE[mode];
  if (!manifest) throw new Error(`assertScaffold: unknown mode "${mode}"`);

  const errors = [];

  for (const rel of manifest.required) {
    if (!fs.existsSync(path.join(targetDir, rel))) {
      errors.push(`missing required path: ${rel}`);
    }
  }
  for (const rel of manifest.forbidden) {
    if (fs.existsSync(path.join(targetDir, rel))) {
      errors.push(`forbidden path present: ${rel}`);
    }
  }

  for (const file of walkFiles(targetDir)) {
    const source = fs.readFileSync(file, 'utf-8');
    const rel = path.relative(targetDir, file);

    const markers = source.match(PLACEHOLDER_RE);
    if (markers) {
      for (const marker of new Set(markers)) {
        errors.push(`surviving placeholder marker ${marker} in ${rel}`);
      }
    }

    if (!/\.(ts|tsx)$/.test(file)) continue;
    for (const { label, test } of PROHIBITED_PATTERNS) {
      if (test(source)) errors.push(`prohibited pattern "${label}" in ${rel}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

function manifestSize(mode) {
  const manifest = EXPECTED_TREE[mode];
  return manifest.required.length + manifest.forbidden.length;
}

async function scaffoldToTemp({ mode, monorepo }) {
  const jiti = createJiti(import.meta.url, { moduleCache: false, fsCache: false });
  const { createInstaller } = await jiti.import(
    path.join(root, 'packages/create-vexcms/src/installers/index.ts'),
  );

  const tmpRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'vex-scaffold-smoke-'));
  const targetDir = monorepo
    ? path.join(tmpRoot, 'host-workspace', 'apps', 'smoke-project')
    : path.join(tmpRoot, 'smoke-project');

  if (monorepo) {
    await fsp.mkdir(path.join(tmpRoot, 'host-workspace'), { recursive: true });
    await fsp.writeFile(
      path.join(tmpRoot, 'host-workspace', 'pnpm-workspace.yaml'),
      'packages:\n  - "apps/*"\ncatalog: {}\n',
    );
  }
  await fsp.mkdir(targetDir, { recursive: true });

  const installer = createInstaller({ framework: 'nextjs', projectDir: targetDir, projectName: 'smoke-project' });
  await installer.initProject({
    projectName: 'smoke-project',
    projectDir: targetDir,
    framework: 'nextjs',
    port: 3010,
    bare: mode === 'bare',
    monorepo,
    workspaceRoot: monorepo ? path.join(tmpRoot, 'host-workspace') : null,
    yes: true,
    orgs: false,
    emailPasswordAuth: true,
    oauthProviders: [],
    initGit: false,
    installDependencies: false,
  });

  return { targetDir, tmpRoot };
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes('--bare') ? 'bare' : 'full';
  const monorepo = args.includes('--monorepo');

  const { targetDir, tmpRoot } = await scaffoldToTemp({ mode, monorepo });
  const { ok, errors } = assertScaffold({ targetDir, mode });
  await fsp.rm(tmpRoot, { recursive: true, force: true });

  if (!ok) {
    console.error(`scaffold-smoke (${mode}${monorepo ? ', monorepo' : ''}) FAILED:`);
    for (const error of errors) console.error(`  x ${error}`);
    process.exit(1);
  }
  console.log(
    `scaffold-smoke (${mode}${monorepo ? ', monorepo' : ''}) passed — ` +
      `${manifestSize(mode)} tree assertions, 0 placeholder survivors, 0 prohibited patterns.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
