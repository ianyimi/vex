import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { copyTemplate, overlayTemplate } from '../helpers/fileOperations.js';

describe('copyTemplate', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vex-copy-test-'));
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('copies template files to target directory', async () => {
    const templateDir = path.resolve(
      import.meta.dirname,
      '../../templates/base-nextjs'
    );

    // Only run if the template exists
    if (!fs.existsSync(templateDir)) return;

    const targetDir = path.join(tmpDir, 'output');
    await copyTemplate('nextjs', targetDir);

    expect(fs.existsSync(path.join(targetDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'vex.config.ts'))).toBe(true);
  });

  it('renames _gitignore to .gitignore', async () => {
    const templateDir = path.resolve(
      import.meta.dirname,
      '../../templates/base-nextjs'
    );

    if (!fs.existsSync(templateDir)) return;

    const targetDir = path.join(tmpDir, 'output');
    await copyTemplate('nextjs', targetDir);

    expect(fs.existsSync(path.join(targetDir, '.gitignore'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, '_gitignore'))).toBe(false);
  });
});

describe('overlayTemplate', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vex-overlay-test-'));
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('adds new files from overlay', async () => {
    const baseDir = path.join(tmpDir, 'base');
    fs.mkdirSync(baseDir);
    fs.writeFileSync(path.join(baseDir, 'existing.ts'), 'base content');

    const overlayDir = path.join(tmpDir, 'overlay');
    fs.mkdirSync(overlayDir);
    fs.writeFileSync(path.join(overlayDir, 'new-file.ts'), 'overlay content');

    const targetDir = path.join(tmpDir, 'target');
    fs.copySync(baseDir, targetDir);
    await overlayTemplate({ overlayDir, targetDir });

    expect(fs.existsSync(path.join(targetDir, 'existing.ts'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'new-file.ts'))).toBe(true);
    expect(fs.readFileSync(path.join(targetDir, 'existing.ts'), 'utf-8')).toBe('base content');
    expect(fs.readFileSync(path.join(targetDir, 'new-file.ts'), 'utf-8')).toBe('overlay content');
  });

  it('replaces existing files with overlay versions', async () => {
    const baseDir = path.join(tmpDir, 'base');
    fs.mkdirSync(baseDir);
    fs.writeFileSync(path.join(baseDir, 'config.ts'), 'base config');

    const overlayDir = path.join(tmpDir, 'overlay');
    fs.mkdirSync(overlayDir);
    fs.writeFileSync(path.join(overlayDir, 'config.ts'), 'overlay config');

    const targetDir = path.join(tmpDir, 'target');
    fs.copySync(baseDir, targetDir);
    await overlayTemplate({ overlayDir, targetDir });

    expect(fs.readFileSync(path.join(targetDir, 'config.ts'), 'utf-8')).toBe('overlay config');
  });

  it('preserves base files not in overlay', async () => {
    const baseDir = path.join(tmpDir, 'base');
    fs.mkdirpSync(path.join(baseDir, 'src'));
    fs.writeFileSync(path.join(baseDir, 'src/layout.tsx'), 'layout');
    fs.writeFileSync(path.join(baseDir, 'src/globals.css'), 'styles');

    const overlayDir = path.join(tmpDir, 'overlay');
    fs.mkdirpSync(path.join(overlayDir, 'src'));
    fs.writeFileSync(path.join(overlayDir, 'src/layout.tsx'), 'new layout');

    const targetDir = path.join(tmpDir, 'target');
    fs.copySync(baseDir, targetDir);
    await overlayTemplate({ overlayDir, targetDir });

    expect(fs.readFileSync(path.join(targetDir, 'src/layout.tsx'), 'utf-8')).toBe('new layout');
    expect(fs.readFileSync(path.join(targetDir, 'src/globals.css'), 'utf-8')).toBe('styles');
  });

  it('handles nested directory creation in overlay', async () => {
    const baseDir = path.join(tmpDir, 'base');
    fs.mkdirSync(baseDir);
    fs.writeFileSync(path.join(baseDir, 'root.ts'), 'root');

    const overlayDir = path.join(tmpDir, 'overlay');
    fs.mkdirpSync(path.join(overlayDir, 'src/vexcms/collections'));
    fs.writeFileSync(path.join(overlayDir, 'src/vexcms/collections/pages.ts'), 'pages collection');

    const targetDir = path.join(tmpDir, 'target');
    fs.copySync(baseDir, targetDir);
    await overlayTemplate({ overlayDir, targetDir });

    expect(fs.existsSync(path.join(targetDir, 'root.ts'))).toBe(true);
    expect(fs.readFileSync(path.join(targetDir, 'src/vexcms/collections/pages.ts'), 'utf-8')).toBe('pages collection');
  });
});
