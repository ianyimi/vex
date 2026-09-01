import { describe, it, expect } from 'vitest';
import { rewriteManifestForMonorepo } from '../helpers/monorepo.js';

describe('rewriteManifestForMonorepo', () => {
  it('maps @vexcms/* to workspace:*, catalog-known deps to catalog:, and keeps other literals', () => {
    const manifest = {
      name: 'scaffold-smoke',
      version: '0.1.0',
      dependencies: {
        '@vexcms/core': '0.1.0-alpha.1',
        '@vexcms/react': '0.1.0-alpha.1',
        next: '16.3.3',
        'left-pad': '1.3.0',
      },
      devDependencies: {
        typescript: '6.0.3',
        'some-unlisted-tool': '2.0.0',
      },
    };
    const catalog = {
      next: '16.3.3',
      typescript: '6.0.3',
    };

    const result = rewriteManifestForMonorepo({ manifest, catalog });

    expect(result.dependencies).toEqual({
      '@vexcms/core': 'workspace:*',
      '@vexcms/react': 'workspace:*',
      'left-pad': '1.3.0',
      next: 'catalog:',
    });
    expect(result.devDependencies).toEqual({
      'some-unlisted-tool': '2.0.0',
      typescript: 'catalog:',
    });
    expect(result.name).toBe('scaffold-smoke');
    expect(result.version).toBe('0.1.0');
  });

  it('leaves a manifest with no dependency sections unchanged', () => {
    const manifest = { name: 'bare', version: '0.0.1' };

    const result = rewriteManifestForMonorepo({ manifest, catalog: { next: '16.3.3' } });

    expect(result).toEqual({ name: 'bare', version: '0.0.1' });
  });

  it('never touches a dependency the host catalog does not know, even if the name looks similar', () => {
    const manifest = {
      name: 'scaffold-smoke',
      dependencies: { 'next-auth': '5.0.0' },
    };

    const result = rewriteManifestForMonorepo({ manifest, catalog: { next: '16.3.3' } });

    expect(result.dependencies).toEqual({ 'next-auth': '5.0.0' });
  });
});
