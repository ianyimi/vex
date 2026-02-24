# Testing Strategy Spec

This document outlines the testing architecture for Vex CMS, covering unit tests, integration tests, and end-to-end tests.

**Referenced by**: [roadmap.md](./roadmap.md) - Testing infrastructure

**Depends on**:
- [00-monorepo-setup-spec.md](./00-monorepo-setup-spec.md) - Package structure
- [06-convex-integration-spec.md](./06-convex-integration-spec.md) - Convex handlers

---

## Design Goals

1. **Self-cleaning tests** - All E2E tests clean up after themselves, leaving no trace in the database
2. **Isolated test environment** - Separate Convex deployment for testing, no production data affected
3. **Full lifecycle testing** - Test creating collections via config, editing fields in UI, deleting collections
4. **User-runnable test suite** - Users can run the same E2E tests on their own projects to verify their setup
5. **CI/CD integration** - Tests run automatically on push/PR with no manual intervention

---

## Test Structure

```
vex.git/dev/
├── packages/
│   ├── core/
│   │   └── src/
│   │       ├── __tests__/            # Unit tests (vitest)
│   │       │   ├── defineConfig.test.ts
│   │       │   ├── defineCollection.test.ts
│   │       │   └── fields.test.ts
│   │       └── ...
│   │
│   ├── convex/                       # @vexcms/convex
│   │   └── src/
│   │       ├── __tests__/            # Handler tests (convex-test)
│   │       │   ├── adminCreate.test.ts
│   │       │   ├── adminUpdate.test.ts
│   │       │   ├── adminDelete.test.ts
│   │       │   ├── adminList.test.ts
│   │       │   └── accessControl.test.ts
│   │       └── ...
│   │
│   └── admin-next/
│       └── src/
│           ├── __tests__/            # Component unit tests (vitest + jsdom)
│           │   ├── AdminPage.test.tsx
│           │   ├── Sidebar.test.tsx
│           │   └── ...
│           └── ...
│
└── apps/
    └── test-app/
        ├── convex/                   # Uses test Convex deployment
        ├── tests/                    # Playwright E2E tests
        │   ├── admin/
        │   │   ├── dashboard.spec.ts
        │   │   ├── collection-crud.spec.ts
        │   │   ├── document-edit.spec.ts
        │   │   ├── field-types.spec.ts
        │   │   └── access-control.spec.ts
        │   ├── config/
        │   │   ├── add-collection.spec.ts
        │   │   ├── modify-fields.spec.ts
        │   │   └── remove-collection.spec.ts
        │   ├── fixtures/
        │   │   ├── test-configs/     # Various vex.config.ts files for testing
        │   │   └── test-data.ts      # Helpers for creating/cleaning test data
        │   ├── global-setup.ts
        │   ├── global-teardown.ts
        │   └── playwright.config.ts
        ├── .env.local                # Dev credentials (gitignored)
        ├── .env.test                 # Test deployment credentials
        └── ...
```

---

## Test Layers

### Layer 1: Unit Tests (Vitest)

**Location:** `packages/*/src/__tests__/`

**What they test:**
- Schema builders (`defineConfig`, `defineCollection`, `defineBlock`)
- Field factories (`text()`, `number()`, `relationship()`)
- Type inference and validation
- Utility functions

**Tools:** `vitest`

**Example:**
```typescript
// packages/core/src/__tests__/defineCollection.test.ts
import { describe, it, expect } from 'vitest';
import { defineCollection, text, number } from '../index';

describe('defineCollection', () => {
  it('creates collection with correct slug', () => {
    const posts = defineCollection('posts', {
      fields: {
        title: text({ required: true }),
        views: number({ defaultValue: 0 }),
      },
    });

    expect(posts.slug).toBe('posts');
    expect(posts.fields.title._meta.required).toBe(true);
  });
});
```

---

### Layer 2: Convex Handler Tests (convex-test)

**Location:** `packages/convex/src/__tests__/`

**What they test:**
- Admin CRUD handlers (`adminCreate`, `adminUpdate`, `adminDelete`, `adminList`)
- Access control logic
- Hook execution
- Schema generation

**Tools:** `convex-test`, `vitest`

**Example:**
```typescript
// packages/convex/src/__tests__/adminCreate.test.ts
import { convexTest } from 'convex-test';
import { describe, it, expect } from 'vitest';
import { api } from '../_generated/api';
import schema from '../schema';

describe('adminCreate', () => {
  it('creates document with valid data', async () => {
    const t = convexTest(schema);

    const id = await t.mutation(api.vex.adminCreate, {
      collection: 'posts',
      data: { title: 'Test Post', slug: 'test-post' },
    });

    expect(id).toBeDefined();

    const doc = await t.query(api.vex.adminGetById, {
      collection: 'posts',
      id,
    });

    expect(doc.title).toBe('Test Post');
  });

  it('runs beforeCreate hook', async () => {
    const t = convexTest(schema);

    const id = await t.mutation(api.vex.adminCreate, {
      collection: 'posts',
      data: { title: 'Test' }, // slug not provided
    });

    const doc = await t.query(api.vex.adminGetById, {
      collection: 'posts',
      id,
    });

    // Hook should auto-generate slug
    expect(doc.slug).toBe('test');
  });

  it('rejects unauthorized user', async () => {
    const t = convexTest(schema);

    await expect(
      t.mutation(api.vex.adminCreate, {
        collection: 'users',
        data: { name: 'Hacker' },
      })
    ).rejects.toThrow('Unauthorized');
  });
});
```

---

### Layer 3: E2E Tests (Playwright)

**Location:** `apps/test-app/tests/`

**What they test:**
- Full admin UI flows
- Collection CRUD via browser
- Field rendering and validation
- Config changes (add/modify/remove collections)
- Real Convex backend (test deployment)

**Tools:** `@playwright/test`

**Key principle:** All tests are self-cleaning.

---

## Self-Cleaning Test Pattern

Every E2E test that creates data must clean it up:

```typescript
// apps/test-app/tests/admin/collection-crud.spec.ts
import { test, expect } from '@playwright/test';
import { createTestDocument, deleteTestDocument } from '../fixtures/test-data';

test.describe('Collection CRUD', () => {
  let testPostId: string;

  test.beforeEach(async ({ page }) => {
    // Create test data before each test
    testPostId = await createTestDocument('posts', {
      title: 'E2E Test Post',
      slug: `e2e-test-${Date.now()}`,
    });
  });

  test.afterEach(async () => {
    // Always cleanup, even if test fails
    if (testPostId) {
      await deleteTestDocument('posts', testPostId);
    }
  });

  test('can edit document', async ({ page }) => {
    await page.goto(`/admin/posts/${testPostId}`);
    await page.fill('[name="title"]', 'Updated Title');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Updated Title')).toBeVisible();
  });

  test('can delete document', async ({ page }) => {
    await page.goto(`/admin/posts/${testPostId}`);
    await page.click('[data-testid="delete-button"]');
    await page.click('text=Confirm');

    await expect(page).toHaveURL('/admin/posts');
    testPostId = null; // Already deleted, skip afterEach cleanup
  });
});
```

---

## Config Lifecycle Tests

Tests that verify adding/modifying/removing collections via `vex.config.ts`:

```typescript
// apps/test-app/tests/config/add-collection.spec.ts
import { test, expect } from '@playwright/test';
import {
  writeTestConfig,
  restoreOriginalConfig,
  runVexSync,
  runConvexDeploy,
} from '../fixtures/config-helpers';

test.describe('Collection Lifecycle', () => {
  const originalConfig = null;

  test.beforeAll(async () => {
    // Backup original config
    originalConfig = await readConfig();
  });

  test.afterAll(async () => {
    // Restore original config
    await writeConfig(originalConfig);
    await runVexSync();
    await runConvexDeploy();
  });

  test('adding collection makes it appear in admin', async ({ page }) => {
    // Step 1: Add new collection to config
    await writeTestConfig(`
      import { defineConfig, defineCollection, text } from '@vexcms/core';

      const testCollection = defineCollection('e2e_tests', {
        labels: { singular: 'E2E Test', plural: 'E2E Tests' },
        fields: {
          name: text({ required: true }),
        },
      });

      export default defineConfig({
        collections: [testCollection],
      });
    `);

    // Step 2: Run vex sync to generate schema
    await runVexSync();

    // Step 3: Deploy to test Convex
    await runConvexDeploy();

    // Step 4: Verify in UI
    await page.goto('/admin');
    await expect(page.locator('text=E2E Tests')).toBeVisible();

    // Step 5: Create a document
    await page.click('text=E2E Tests');
    await page.click('text=Create New');
    await page.fill('[name="name"]', 'Test Document');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Test Document')).toBeVisible();
  });

  test('modifying collection fields reflects in edit form', async ({ page }) => {
    // Add a new field to existing collection
    await writeTestConfig(`
      import { defineConfig, defineCollection, text, number } from '@vexcms/core';

      const testCollection = defineCollection('e2e_tests', {
        labels: { singular: 'E2E Test', plural: 'E2E Tests' },
        fields: {
          name: text({ required: true }),
          priority: number({ defaultValue: 0 }), // New field
        },
      });

      export default defineConfig({
        collections: [testCollection],
      });
    `);

    await runVexSync();
    await runConvexDeploy();

    // Verify new field appears
    await page.goto('/admin/e2e_tests/new');
    await expect(page.locator('[name="priority"]')).toBeVisible();
  });

  test('removing collection removes it from admin', async ({ page }) => {
    // Remove the test collection
    await writeTestConfig(`
      import { defineConfig } from '@vexcms/core';

      export default defineConfig({
        collections: [],
      });
    `);

    await runVexSync();
    await runConvexDeploy();

    // Verify collection is gone
    await page.goto('/admin');
    await expect(page.locator('text=E2E Tests')).not.toBeVisible();
  });
});
```

---

## Test Environment Setup

### Separate Convex Deployment

Create a dedicated Convex project for testing:

```bash
# One-time setup
cd apps/test-app
npx convex deploy --prod --project vex-e2e-tests
```

Store credentials:
- `CONVEX_TEST_URL` - The test deployment URL
- `CONVEX_TEST_DEPLOY_KEY` - Deploy key for CI

### Environment Files

```bash
# apps/test-app/.env.local (gitignored, for local dev)
CONVEX_URL=https://your-dev-deployment.convex.cloud

# apps/test-app/.env.test (for test runs)
CONVEX_URL=https://your-test-deployment.convex.cloud
```

### CI Configuration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - name: Install dependencies
        run: pnpm install

      - name: Build packages
        run: pnpm build

      - name: Setup test environment
        run: |
          echo "CONVEX_URL=${{ secrets.CONVEX_TEST_URL }}" >> apps/test-app/.env.local
          echo "CONVEX_DEPLOY_KEY=${{ secrets.CONVEX_TEST_DEPLOY_KEY }}" >> apps/test-app/.env.local

      - name: Push schema to test deployment
        working-directory: apps/test-app
        run: npx convex deploy --cmd "pnpm build"
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_TEST_DEPLOY_KEY }}

      - name: Install Playwright browsers
        run: pnpm --filter test-app exec playwright install --with-deps

      - name: Run E2E tests
        working-directory: apps/test-app
        run: pnpm test:e2e
        env:
          CONVEX_URL: ${{ secrets.CONVEX_TEST_URL }}

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: apps/test-app/playwright-report/
```

---

## Test Data Helpers

```typescript
// apps/test-app/tests/fixtures/test-data.ts
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

const client = new ConvexHttpClient(process.env.CONVEX_URL!);

export async function createTestDocument(
  collection: string,
  data: Record<string, unknown>
): Promise<string> {
  return await client.mutation(api.vex.adminCreate, {
    collection,
    data,
  });
}

export async function deleteTestDocument(
  collection: string,
  id: string
): Promise<void> {
  await client.mutation(api.vex.adminDelete, {
    collection,
    id,
  });
}

export async function clearTestCollection(collection: string): Promise<void> {
  await client.mutation(api.testing.clearCollection, { collection });
}

export async function clearAllTestData(): Promise<void> {
  await client.mutation(api.testing.clearAllData);
}
```

---

## Global Setup/Teardown

```typescript
// apps/test-app/tests/global-setup.ts
import { clearAllTestData } from './fixtures/test-data';

export default async function globalSetup() {
  // Clean slate before test run
  await clearAllTestData();
  console.log('Test database cleared');
}
```

```typescript
// apps/test-app/tests/global-teardown.ts
import { clearAllTestData } from './fixtures/test-data';

export default async function globalTeardown() {
  // Clean up after all tests
  await clearAllTestData();
  console.log('Test database cleaned up');
}
```

---

## Playwright Config

```typescript
// apps/test-app/tests/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## User-Runnable Tests

The E2E test suite is designed to be runnable by users on their own projects:

```bash
# In user's project with Vex CMS installed
pnpm add -D @vexcms/test-suite

# Run the test suite
pnpm vex test:e2e
```

This validates:
- All collections from their `vex.config.ts` appear in admin
- CRUD operations work for each collection
- Field types render correctly
- Access control is enforced

---

## Test Categories

| Category | Tool | Location | CI Stage |
|----------|------|----------|----------|
| Core unit tests | vitest | `packages/core/src/__tests__/` | `pnpm test` |
| Convex handler tests | convex-test + vitest | `packages/convex/src/__tests__/` | `pnpm test` |
| Admin component tests | vitest + jsdom | `packages/admin-next/src/__tests__/` | `pnpm test` |
| E2E admin flows | playwright | `apps/test-app/tests/` | `pnpm test:e2e` |

---

## Turbo Tasks

```json
{
  "tasks": {
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "outputs": ["playwright-report/**"]
    }
  }
}
```

Run all tests:
```bash
pnpm test      # Unit + handler tests across all packages
pnpm test:e2e  # Playwright E2E tests
```

---

## Testing Checklist

Before release, ensure:

- [ ] All unit tests pass (`pnpm test`)
- [ ] All E2E tests pass (`pnpm test:e2e`)
- [ ] Test database is clean after E2E run
- [ ] Config lifecycle tests work (add/modify/remove collection)
- [ ] CI pipeline passes on PR
- [ ] Coverage meets threshold (if configured)
