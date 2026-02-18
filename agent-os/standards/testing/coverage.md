## Testing Strategy & Coverage

### Testing Pyramid

| Test Type | Tool | Purpose | Speed |
|-----------|------|---------|-------|
| **Unit Tests** | Vitest | Test isolated functions, utilities, helpers | Fast (ms) |
| **Component Tests** | Vitest + Testing Library | Test React components in isolation | Fast (ms) |
| **Integration Tests** | Vitest + convex-test | Test Convex functions with in-memory DB | Medium |
| **E2E Tests** | Playwright | Test complete user flows in browser | Slow (seconds) |

### When to Write Tests

**During Feature Development (Minimal Testing)**
- Do NOT write tests for every change or intermediate step
- Focus on completing the feature implementation first
- Add strategic tests only at logical completion points

**Test Only Core User Flows**
- Write tests exclusively for critical paths and primary user workflows
- Skip tests for non-critical utilities and secondary workflows unless instructed
- Defer edge case testing until dedicated testing phases

**Required Test Coverage**
- Authentication flows (login, logout, session handling)
- Critical business logic (workflow execution, data transformations)
- Payment and financial operations
- Data integrity operations (CRUD on core entities)

### Coverage Guidelines

**Prioritize by Risk**
| Area | Target Coverage | Rationale |
|------|-----------------|-----------|
| Auth & Security | 90%+ | Critical for user safety |
| Business Logic | 80%+ | Core value delivery |
| API Endpoints | 70%+ | Contract verification |
| UI Components | 60%+ | User-facing behavior |
| Utilities | 50%+ | Lower risk, stable code |

**Quality Over Quantity**
- 100% coverage doesn't guarantee bug-free code
- Focus on testing behavior and meaningful scenarios
- A well-designed test suite with 70% coverage beats superficial 100% coverage

### Test File Organization

```
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx      # Component test (Vitest)
│   └── utils/
│       ├── formatDate.ts
│       └── formatDate.test.ts   # Unit test (Vitest)
├── convex/
│   ├── users.ts
│   └── users.test.ts            # Integration test (Vitest + convex-test)
└── e2e/
    ├── auth.spec.ts             # E2E test (Playwright)
    └── workflows.spec.ts
```

### Running Tests

```bash
# Unit and component tests
pnpm test              # Run all Vitest tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage report

# E2E tests
pnpm test:e2e          # Run Playwright tests
pnpm test:e2e --ui     # UI mode for debugging
pnpm test:e2e --debug  # Step-through debugging
```

### CI Configuration

```yaml
# Run fast tests first, fail fast
- name: Unit Tests
  run: pnpm test

- name: E2E Tests
  run: pnpm test:e2e
  env:
    CI: true
```

### Exclusions
- Don't count generated code against coverage (`_generated/`, `node_modules/`)
- Exclude test files themselves from coverage metrics
- Exclude configuration files and type definitions
