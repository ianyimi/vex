# Testing Infrastructure Spec

This document defines the testing setup for Vex CMS, covering unit tests, integration tests, and E2E tests.

**Referenced by**: [roadmap.md](./roadmap.md) - Phase 0.2

**Depends on**: [00-monorepo-setup-spec.md](./00-monorepo-setup-spec.md) - Package structure

---

## Design Goals

1. **Vitest** for unit and integration tests (fast, ESM-native, good DX)
2. **convex-test** for testing Convex functions in isolation
3. **Playwright** for E2E tests against the admin panel
4. **Dual E2E strategy**: isolated harness for component tests + example project for full integration
5. **Tests written alongside features** as each spec is implemented

---

## Testing Strategy

| Test Type | Tool | Location | Runs On |
|-----------|------|----------|---------|
| Unit tests | Vitest | `packages/*/src/**/*.test.ts` | Every PR |
| Integration tests | Vitest + convex-test | `packages/convex/src/**/*.test.ts` | Every PR |
| Component tests | Playwright | `apps/admin-test/tests/` | Every PR |
| E2E tests | Playwright | `apps/blog/tests/e2e/` | Every PR |

---

## Vitest Configuration

### Root vitest.workspace.ts

```typescript
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/*/vitest.config.ts',
]);
```

### packages/core/vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/index.ts'],
    },
  },
});
```

### packages/convex/vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'edge-runtime',
    include: ['src/**/*.test.ts'],
    server: {
      deps: {
        inline: ['convex-test'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/index.ts'],
    },
  },
});
```

### packages/admin/vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/index.ts'],
    },
  },
});
```

### packages/admin/src/test/setup.ts

```typescript
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

---

## convex-test Setup

### Installation

```bash
pnpm --filter @vexcms/convex add -D convex-test @edge-runtime/vm vitest
```

### Example Test: Admin Handlers

```typescript
// packages/convex/src/handlers/create.test.ts
import { convexTest } from 'convex-test';
import { expect, test, describe } from 'vitest';
import { api } from './_generated/api';
import schema from './schema';

describe('adminCreate', () => {
  test('creates a document with valid data', async () => {
    const t = convexTest(schema);

    // Create a test user
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert('users', {
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
      });
    });

    // Call the handler
    const postId = await t.mutation(api.admin.create, {
      collection: 'posts',
      data: {
        title: 'Test Post',
        slug: 'test-post',
        author: userId,
      },
    });

    expect(postId).toBeDefined();

    // Verify the document
    const post = await t.run(async (ctx) => {
      return await ctx.db.get(postId);
    });

    expect(post?.title).toBe('Test Post');
    expect(post?.slug).toBe('test-post');
  });

  test('throws error for missing required fields', async () => {
    const t = convexTest(schema);

    await expect(
      t.mutation(api.admin.create, {
        collection: 'posts',
        data: {
          // Missing required 'title'
          slug: 'test-post',
        },
      })
    ).rejects.toThrow();
  });

  test('runs beforeCreate hook', async () => {
    const t = convexTest(schema);

    const postId = await t.mutation(api.admin.create, {
      collection: 'posts',
      data: {
        title: 'Test Post',
        // publishedAt should be set by beforeCreate hook
      },
    });

    const post = await t.run(async (ctx) => {
      return await ctx.db.get(postId);
    });

    expect(post?.publishedAt).toBeDefined();
  });
});
```

### Example Test: Access Control

```typescript
// packages/convex/src/access/check.test.ts
import { convexTest } from 'convex-test';
import { expect, test, describe } from 'vitest';
import { checkAccess } from './check';

describe('checkAccess', () => {
  test('admin can access everything', async () => {
    const user = { _id: '123', role: 'admin' };

    expect(checkAccess('posts', 'create', { user })).toBe(true);
    expect(checkAccess('posts', 'read', { user })).toBe(true);
    expect(checkAccess('posts', 'update', { user })).toBe(true);
    expect(checkAccess('posts', 'delete', { user })).toBe(true);
  });

  test('author can only update own posts', async () => {
    const user = { _id: 'user123', role: 'author' };
    const ownPost = { author: 'user123' };
    const otherPost = { author: 'user456' };

    expect(checkAccess('posts', 'update', { user, doc: ownPost })).toBe(true);
    expect(checkAccess('posts', 'update', { user, doc: otherPost })).toBe(false);
  });
});
```

---

## Playwright Configuration

### apps/admin-test/playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### apps/blog/playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm convex dev',
      url: 'http://localhost:3210',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'pnpm dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
```

---

## Test Fixtures

### apps/admin-test/tests/fixtures.ts

```typescript
import { test as base } from '@playwright/test';

// Extend test with custom fixtures
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Sign in before test
    await page.goto('/sign-in');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');

    await use(page);
  },
});

export { expect } from '@playwright/test';
```

### Example E2E Test: Create Post

```typescript
// apps/blog/tests/e2e/posts.spec.ts
import { test, expect } from '../fixtures';

test.describe('Posts', () => {
  test('can create a new post', async ({ authenticatedPage: page }) => {
    // Navigate to posts
    await page.goto('/admin/posts');

    // Click create button
    await page.click('text=Create New');
    await page.waitForURL('/admin/posts/create');

    // Fill form
    await page.fill('[name="title"]', 'My Test Post');
    await page.fill('[name="slug"]', 'my-test-post');

    // Add a content block
    await page.click('text=Add Block');
    await page.click('text=Content');
    await page.fill('[name="content.0.content"]', 'This is the post content.');

    // Save as draft
    await page.click('text=Save Draft');

    // Verify success
    await expect(page.locator('text=Draft saved')).toBeVisible();
  });

  test('can publish a post', async ({ authenticatedPage: page }) => {
    // Navigate to existing draft post
    await page.goto('/admin/posts');
    await page.click('text=My Test Post');

    // Publish
    await page.click('text=Publish');

    // Verify status changed
    await expect(page.locator('[data-status="published"]')).toBeVisible();
  });

  test('can preview a post', async ({ authenticatedPage: page }) => {
    await page.goto('/admin/posts');
    await page.click('text=My Test Post');

    // Open preview panel
    await page.click('[aria-label="Toggle preview"]');

    // Verify preview iframe loaded
    const previewFrame = page.frameLocator('[data-testid="preview-iframe"]');
    await expect(previewFrame.locator('h1')).toContainText('My Test Post');
  });
});
```

---

## Component Tests (Isolated Admin Harness)

### apps/admin-test/tests/components/TextField.spec.ts

```typescript
import { test, expect } from '@playwright/test';

test.describe('TextField', () => {
  test('renders label and input', async ({ page }) => {
    await page.goto('/test/text-field');

    await expect(page.locator('label')).toContainText('Title');
    await expect(page.locator('input[name="title"]')).toBeVisible();
  });

  test('shows error on invalid input', async ({ page }) => {
    await page.goto('/test/text-field?required=true');

    // Focus and blur without entering value
    await page.focus('input[name="title"]');
    await page.blur('input[name="title"]');

    // Submit form
    await page.click('button[type="submit"]');

    // Check error message
    await expect(page.locator('[data-error="title"]')).toContainText('Required');
  });

  test('updates form state on change', async ({ page }) => {
    await page.goto('/test/text-field');

    await page.fill('input[name="title"]', 'Hello World');

    // Check form state display
    await expect(page.locator('[data-form-value="title"]')).toContainText('Hello World');
  });
});
```

### apps/admin-test/app/test/text-field/page.tsx

```typescript
'use client';

import { FormProvider, TextField } from '@vexcms/admin';
import { useSearchParams } from 'next/navigation';

export default function TextFieldTest() {
  const searchParams = useSearchParams();
  const required = searchParams.get('required') === 'true';

  return (
    <FormProvider
      collection={mockCollection}
      onSubmit={async (data) => console.log(data)}
    >
      <TextField
        path="title"
        field={{
          _meta: {
            type: 'text',
            label: 'Title',
            required,
          },
        }}
      />
      <button type="submit">Submit</button>
      <FormStateDisplay />
    </FormProvider>
  );
}
```

---

## Test Scripts in package.json

### Root package.json

```json
{
  "scripts": {
    "test": "turbo run test",
    "test:watch": "turbo run test:watch",
    "test:coverage": "turbo run test:coverage",
    "test:e2e": "turbo run test:e2e",
    "test:e2e:ui": "turbo run test:e2e:ui"
  }
}
```

### Package-level scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### App-level scripts (Playwright)

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

## Test Organization Per Spec

Each spec should include tests as it's implemented:

| Spec | Test Files |
|------|------------|
| 1.0 Config Structure | `packages/core/src/config.test.ts` |
| 1.1 Basic Fields | `packages/core/src/fields/*.test.ts` |
| 1.2 Complex Fields | `packages/core/src/fields/*.test.ts` |
| 1.3 Convex Integration | `packages/convex/src/handlers/*.test.ts`, `packages/convex/src/schema/*.test.ts` |
| 1.4 Hooks System | `packages/convex/src/hooks/*.test.ts` |
| 1.5 Access Control | `packages/convex/src/access/*.test.ts` |
| 1.6 Versioning | `packages/convex/src/handlers/versions.test.ts` |
| 1.7 File Uploads | `packages/convex/src/storage/*.test.ts`, `packages/client/src/upload.test.ts` |
| 1.8 Custom Components | `packages/admin/src/hooks/*.test.ts`, `apps/admin-test/tests/components/*.spec.ts` |
| 1.9 Live Preview | `packages/live-preview-react/src/*.test.ts`, `apps/blog/tests/e2e/preview.spec.ts` |
| 1.10 Admin Panel | `apps/blog/tests/e2e/*.spec.ts` |

---

## Accessibility Testing

### axe-core Integration

```typescript
// apps/blog/tests/e2e/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('admin dashboard has no violations', async ({ page }) => {
    await page.goto('/admin');

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  test('post edit form has no violations', async ({ page }) => {
    await page.goto('/admin/posts/create');

    const results = await new AxeBuilder({ page })
      .exclude('[data-testid="preview-iframe"]') // Exclude iframe content
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```

---

## CI Integration

Tests are integrated into GitHub Actions (see [02-ci-publishing-spec.md](./02-ci-publishing-spec.md)):

```yaml
- name: Run unit tests
  run: pnpm test

- name: Run E2E tests
  run: pnpm test:e2e
```

---

## Checklist

- [ ] Install Vitest and configure workspace
- [ ] Install convex-test and @edge-runtime/vm
- [ ] Configure Vitest for each package
- [ ] Install Playwright
- [ ] Create admin-test app with component test pages
- [ ] Configure Playwright for both apps
- [ ] Create test fixtures for authentication
- [ ] Add axe-core for accessibility testing
- [ ] Add test scripts to package.json files
- [ ] Verify `pnpm test` runs all unit tests
- [ ] Verify `pnpm test:e2e` runs Playwright tests
