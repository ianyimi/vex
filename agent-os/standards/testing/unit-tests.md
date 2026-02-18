## Unit & Component Testing with Vitest

### Testing Framework
- Use **Vitest** for unit tests and component tests
- Vitest provides Jest-compatible API with native ESM support and TypeScript integration
- Runs fast with smart file watching and parallel execution

### Test Philosophy
- **Test behavior, not implementation**: Focus on what the code does, not how it does it
- **Independent tests**: Each test runs independently without relying on execution order or shared state
- **One concept per test**: Test one behavior or scenario per test for easy diagnosis

### Test Structure
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('UserService', () => {
  beforeEach(() => {
    // Reset mocks and state before each test
    vi.clearAllMocks();
  });

  it('should create a user with valid data', async () => {
    // Arrange
    const userData = { name: 'John', email: 'john@example.com' };

    // Act
    const result = await createUser(userData);

    // Assert
    expect(result).toMatchObject({ name: 'John' });
  });
});
```

### Mocking
- **Mock external dependencies**: Isolate units by mocking databases, APIs, and external services
- Use `vi.mock()` for module mocking
- Use `vi.fn()` for function mocks with spy capabilities

```typescript
import { vi } from 'vitest';

// Mock a module
vi.mock('./api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'John' }),
}));

// Mock a function
const mockCallback = vi.fn();
mockCallback.mockReturnValue(42);
```

### Testing Convex Functions
- Test Convex queries and mutations using the Convex test helpers
- Mock `ctx` objects for unit testing handler functions
- Use `convex-test` for integration testing with in-memory database

```typescript
import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';
import { api } from './_generated/api';
import schema from './schema';

test('create and get user', async () => {
  const t = convexTest(schema);

  const userId = await t.mutation(api.users.create, {
    name: 'John',
    email: 'john@example.com',
  });

  const user = await t.query(api.users.get, { id: userId });
  expect(user?.name).toBe('John');
});
```

### Component Testing
- Test React components in isolation with `@testing-library/react`
- Focus on user interactions and rendered output
- Avoid testing implementation details (internal state, private methods)

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';

test('button click updates text', async () => {
  const user = userEvent.setup();
  render(<Counter />);

  await user.click(screen.getByRole('button', { name: /increment/i }));

  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### Best Practices
- **Clear test names**: Use descriptive names explaining what's tested and expected outcome
- **Test edge cases**: Include boundary conditions, empty inputs, null values, error scenarios
- **Fast execution**: Keep unit tests fast (milliseconds) for frequent execution
- **Maintain test code quality**: Apply same standards to tests as production code
- **Use TypeScript**: Leverage type safety in tests for better IDE support and error catching
