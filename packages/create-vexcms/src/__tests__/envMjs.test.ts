import { describe, it, expect, afterEach } from 'vitest';
import path from 'path';

/**
 * Unit test for the template's `src/env.mjs` (WP-4, decision D3). A real
 * `vex dev` push can't run in CI without a deployment (WP-8's example
 * re-run covers it end to end); this test isolates the module's own
 * skip-validation logic against the two env shapes a Convex push and a
 * Next process present it with.
 */

const envModulePath = path.resolve(
  import.meta.dirname,
  '../../templates/base-nextjs/src/env.mjs'
);

const ENV_KEYS = [
  'CONVEX_CLOUD_URL',
  'NEXT_PUBLIC_CONVEX_SITE_URL',
  'NEXT_PUBLIC_CONVEX_URL',
  'NEXT_PUBLIC_SITE_URL',
  'BETTER_AUTH_SECRET',
  'SKIP_ENV_VALIDATION',
] as const;

const savedEnv: Record<string, string | undefined> = {};
for (const key of ENV_KEYS) savedEnv[key] = process.env[key];

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

describe('template env.mjs (Convex-runtime skip, decision D3)', () => {
  it('does not throw when CONVEX_CLOUD_URL is set and NEXT_PUBLIC_* is unset', async () => {
    for (const key of ENV_KEYS) delete process.env[key];
    process.env.CONVEX_CLOUD_URL = 'https://example.convex.cloud';
    process.env.BETTER_AUTH_SECRET = 'secret';

    await expect(import(`${envModulePath}?case=convex-runtime`)).resolves.toBeDefined();
  });

  it('throws when CONVEX_CLOUD_URL is unset and NEXT_PUBLIC_* is unset', async () => {
    for (const key of ENV_KEYS) delete process.env[key];
    process.env.BETTER_AUTH_SECRET = 'secret';

    await expect(import(`${envModulePath}?case=next-process-missing-vars`)).rejects.toThrow();
  });
});
