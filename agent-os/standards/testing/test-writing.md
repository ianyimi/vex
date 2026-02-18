## End-to-End Testing with Playwright

### Testing Framework
- Use **Playwright** for E2E tests
- Supports Chromium, Firefox, and WebKit browsers
- Built-in auto-waiting, assertions, and trace debugging

### Test Philosophy
- **Test user-visible behavior**: Verify application functionality as end users experience it
- **Test isolation**: Each test runs independently with its own storage, session, and cookies
- **Only test what you control**: Mock external API responses rather than testing third-party services

### Locator Best Practices

**Use user-facing attributes** for resilient locators:
```typescript
// Recommended - uses accessible role and name
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Email').fill('user@example.com');
await page.getByPlaceholder('Search...').fill('query');
await page.getByText('Welcome back').isVisible();

// Avoid - brittle CSS selectors
await page.locator('button.btn-primary.submit-form').click();
await page.locator('#email-input-field').fill('user@example.com');
```

**Chaining and filtering** to narrow scope:
```typescript
await page
  .getByRole('listitem')
  .filter({ hasText: 'Product 2' })
  .getByRole('button', { name: 'Add to cart' })
  .click();
```

**Use test IDs as fallback** when semantic locators aren't possible:
```typescript
await page.getByTestId('user-avatar').click();
```

### Web-First Assertions

**Always await assertions** - Playwright auto-retries until condition is met:
```typescript
// Recommended - auto-waits and retries
await expect(page.getByText('Welcome')).toBeVisible();
await expect(page.getByRole('button')).toBeEnabled();
await expect(page).toHaveURL('/dashboard');

// Avoid - doesn't auto-retry
expect(await page.getByText('Welcome').isVisible()).toBe(true);
```

**Soft assertions** for non-blocking checks:
```typescript
await expect.soft(page.getByTestId('status')).toHaveText('Success');
await page.getByRole('link', { name: 'Next' }).click();
```

### Test Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome back')).toBeVisible();
  });
});
```

### Authentication Reuse
Set up authentication once and reuse across tests:
```typescript
// auth.setup.ts
import { test as setup, expect } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.context().storageState({ path: '.auth/user.json' });
});

// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { storageState: '.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
});
```

### Mocking Network Requests
```typescript
test('displays error on API failure', async ({ page }) => {
  // Mock API response
  await page.route('**/api/users', (route) =>
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Server error' }),
    })
  );

  await page.goto('/users');
  await expect(page.getByText('Failed to load users')).toBeVisible();
});
```

### Debugging

**Local debugging**:
```bash
npx playwright test --debug                    # Debug all tests
npx playwright test example.spec.ts:9 --debug  # Debug specific line
npx playwright test --ui                       # UI mode with time-travel
```

**CI debugging** with traces:
```bash
npx playwright test --trace on
npx playwright show-report
```

### Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3007',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3007',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Best Practices
- **Generate locators**: Use `npx playwright codegen` to generate resilient locators
- **Parallel execution**: Tests run in parallel by default; design for isolation
- **Use TypeScript**: Better IDE support and error catching
- **Keep tests focused**: One user flow per test
- **Await all promises**: Use `@typescript-eslint/no-floating-promises` ESLint rule
