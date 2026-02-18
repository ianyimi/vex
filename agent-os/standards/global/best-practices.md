# Development Best Practices

## Context

Global development guidelines for Z3 Stack projects. Incorporates Vercel React best practices.

<conditional-block context-check="core-principles">
IF this Core Principles section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using Core Principles already in context"
ELSE:
  READ: The following principles

## Core Principles

### Keep It Simple

- Implement code in the fewest lines possible
- Avoid over-engineering solutions
- Choose straightforward approaches over clever ones

### Optimize for Readability

- Prioritize code clarity over micro-optimizations
- Write self-documenting code with clear variable names
- Add comments for "why" not "what"

### DRY (Don't Repeat Yourself)

- Extract repeated logic into reusable functions or components
- Create utility functions for common operations
- Use composition over duplication

### File Structure

- Keep files focused on a single responsibility
- Group related functionality together
- Use consistent naming conventions
</conditional-block>

<conditional-block context-check="async-patterns" task-condition="writing-async-code">
IF current task involves async operations:
  IF Async Patterns section already read in current context:
    SKIP: Re-reading this section
    NOTE: "Using Async Patterns already in context"
  ELSE:
    READ: The following async guidelines
ELSE:
  SKIP: Async Patterns section not relevant to current task

## Async Code Patterns (Vercel Best Practices)

### Conditional Checks Before Async Operations

Always move conditional checks that might exit early BEFORE async operations:

```typescript
// Bad: Fetches even when not needed
async function handleRequest(userId: string, skipProcessing: boolean) {
  const userData = await fetchUserData(userId);
  if (skipProcessing) return { skipped: true };
  return processUserData(userData);
}

// Good: Exit early before fetching
async function handleRequest(userId: string, skipProcessing: boolean) {
  if (skipProcessing) return { skipped: true };
  const userData = await fetchUserData(userId);
  return processUserData(userData);
}
```

### Parallelize Independent Operations

Use `Promise.all` for operations that don't depend on each other:

```typescript
// Good: Parallel execution
const [user, posts, stats] = await Promise.all([
  fetchUser(userId),
  fetchPosts(userId),
  fetchStats(userId),
]);
```

See [performance.md](./performance.md) for comprehensive async optimization patterns.
</conditional-block>

<conditional-block context-check="dependencies" task-condition="choosing-external-library">
IF current task involves choosing an external library:
  IF Dependencies section already read in current context:
    SKIP: Re-reading this section
    NOTE: "Using Dependencies guidelines already in context"
  ELSE:
    READ: The following guidelines
ELSE:
  SKIP: Dependencies section not relevant to current task

## Dependencies

### Choose Libraries Wisely

When adding third-party dependencies:

- Select the most popular and actively maintained option
- Check the library's GitHub repository for:
  - Recent commits (within last 6 months)
  - Active issue resolution
  - Number of stars/downloads
  - Clear documentation
- Get User permission before installing any third party dependencies

### Monitor Bundle Impact

Before adding a dependency:
- Check bundle size impact with tools like bundlephobia
- Consider if the functionality can be implemented in less code than the import
- Prefer tree-shakeable libraries
</conditional-block>

## Related Standards

- See [performance.md](./performance.md) for optimization patterns
- See [coding-style.md](./coding-style.md) for style conventions
- See [error-handling.md](./error-handling.md) for error patterns
