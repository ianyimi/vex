# Performance Best Practices

## Context

Performance optimization guidelines based on Vercel React best practices. Apply these patterns ordered by real-world impact rather than starting with micro-optimizations.

<conditional-block context-check="async-waterfalls">
IF this Async Waterfalls section already read in current context:
  SKIP: Re-reading this section
ELSE:
  READ: The following async waterfall patterns

## Eliminate Async Waterfalls (CRITICAL)

Prevent sequential async operations when they don't depend on each other. This is often the highest-impact optimization.

### Move Conditional Checks Before Async Operations

```typescript
// Bad: Blocks both operations sequentially
async function handleRequest(userId: string, skipProcessing: boolean) {
  const userData = await fetchUserData(userId);
  if (skipProcessing) return { skipped: true };
  return processUserData(userData);
}

// Good: Only blocks when needed
async function handleRequest(userId: string, skipProcessing: boolean) {
  if (skipProcessing) return { skipped: true };
  const userData = await fetchUserData(userId);
  return processUserData(userData);
}
```

### Parallelize Independent Async Operations

```typescript
// Bad: Sequential execution
async function loadDashboard(userId: string) {
  const user = await fetchUser(userId);
  const posts = await fetchPosts(userId);
  const notifications = await fetchNotifications(userId);
  return { user, posts, notifications };
}

// Good: Parallel execution with Promise.all
async function loadDashboard(userId: string) {
  const [user, posts, notifications] = await Promise.all([
    fetchUser(userId),
    fetchPosts(userId),
    fetchNotifications(userId),
  ]);
  return { user, posts, notifications };
}
```

</conditional-block>

<conditional-block context-check="bundle-size">
IF this Bundle Size section already read in current context:
  SKIP: Re-reading this section
ELSE:
  READ: The following bundle size patterns

## Reduce Bundle Size (CRITICAL)

Minimize JavaScript shipped to clients. Large bundles accumulate gradually through small additions.

### Monitor Imports

Be intentional about what you import:

```typescript
// Bad: Imports entire library
import _ from "lodash";
const sorted = _.sortBy(items, "name");

// Good: Import only what you need
import sortBy from "lodash/sortBy";
const sorted = sortBy(items, "name");
```

### Lazy Load Components

Defer loading of non-critical components:

```typescript
import { lazy, Suspense } from "react";

// Lazy load heavy components
const HeavyChart = lazy(() => import("./HeavyChart"));

function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart data={data} />
    </Suspense>
  );
}
```

### Route-Based Code Splitting

Split code at route boundaries (handled by TanStack Router or Next.js automatically when configured).

</conditional-block>

<conditional-block context-check="data-iteration">
IF this Data Iteration section already read in current context:
  SKIP: Re-reading this section
ELSE:
  READ: The following data iteration patterns

## Combine Loop Iterations

Scan data structures once rather than multiple passes.

```typescript
// Bad: Multiple iterations
const activeUsers = users.filter((u) => u.active);
const userNames = activeUsers.map((u) => u.name);
const sortedNames = userNames.sort();

// Good: Single pass where possible
const sortedActiveNames = users
  .reduce<string[]>((acc, user) => {
    if (user.active) acc.push(user.name);
    return acc;
  }, [])
  .sort();
```

### When Multiple Passes Are Acceptable

- Readability significantly improves
- Dataset is small (< 100 items)
- Performance profiling shows no measurable impact

</conditional-block>

<conditional-block context-check="database-calls">
IF this Database Calls section already read in current context:
  SKIP: Re-reading this section
ELSE:
  READ: The following database call patterns

## Parallelize Database Calls

Execute independent database queries simultaneously instead of sequentially.

```typescript
// Bad: Sequential queries
async function getUserDashboard(userId: string) {
  const user = await db.users.findUnique({ where: { id: userId } });
  const stats = await db.stats.findUnique({ where: { userId } });
  const recentPosts = await db.posts.findMany({
    where: { authorId: userId },
    take: 5,
  });
  return { user, stats, recentPosts };
}

// Good: Parallel queries
async function getUserDashboard(userId: string) {
  const [user, stats, recentPosts] = await Promise.all([
    db.users.findUnique({ where: { id: userId } }),
    db.stats.findUnique({ where: { userId } }),
    db.posts.findMany({ where: { authorId: userId }, take: 5 }),
  ]);
  return { user, stats, recentPosts };
}
```

</conditional-block>

## Lazy State Initialization

Avoid parsing or computing values on every render.

```typescript
// Bad: Runs on every render
const [config, setConfig] = useState(
  JSON.parse(localStorage.getItem("config") || "{}")
);

// Good: Computation runs only once during initialization
const [config, setConfig] = useState(() =>
  JSON.parse(localStorage.getItem("config") || "{}")
);
```

### When to Use Lazy Initialization

- Parsing JSON from storage
- Computing derived initial values
- Reading from expensive data sources
- Any non-trivial computation for initial state

## Optimization Priority Order

When optimizing performance, address issues in this order:

1. **Eliminate async waterfalls** - Often the biggest wins
2. **Reduce bundle size** - Affects initial load time
3. **Parallelize database/API calls** - Reduces server response time
4. **Combine loop iterations** - Reduces CPU work
5. **Lazy state initialization** - Reduces render time
6. **Memoization** - Only after profiling shows need

## Related Standards

- See [tanstack-query/best-practices.md](../../library-standards/tanstack-query/best-practices.md) for query optimization
- See [convex/best-practices.md](../../library-standards/convex/best-practices.md) for database patterns
