## Convex Query Best Practices

### Avoid `.filter()` on Database Queries
- Replace `.filter()` with indexed queries using `.withIndex()` or `.withSearchIndex()` when possible
- **For large datasets (1000+ documents)**: Indexing is essential for performance
- **For smaller datasets**: Filtering in TypeScript code offers better readability and flexibility
- All results returned from `.collect()` count towards database bandwidth, even ones filtered out

### Use `.collect()` Only with Small Result Sets
- Results from `.collect()` trigger query re-runs when any result changes
- For potentially large datasets, use alternatives:
  - **Index conditions** to filter results beforehand
  - **Pagination** with `.paginate()` for large lists
  - **Document limits** with `.take(n)` for top-N queries
  - **Denormalized count fields** for aggregations

```typescript
// Bad: collects all, then filters
const activeUsers = await ctx.db
  .query("users")
  .collect()
  .filter(u => u.status === "active");

// Good: uses index to filter at query level
const activeUsers = await ctx.db
  .query("users")
  .withIndex("by_status", q => q.eq("status", "active"))
  .collect();

// Good: limits results for large tables
const recentUsers = await ctx.db
  .query("users")
  .withIndex("by_createdAt")
  .order("desc")
  .take(10);
```

### Check for Redundant Indexes
- Remove duplicate indexes where one is a prefix of another
- Keep `by_foo_and_bar` instead of having both `by_foo` and `by_foo_and_bar`
- Redundant indexes increase storage overhead and impact write performance

### Avoid `Date.now()` in Queries
- **Problem**: The query is NOT re-run when `Date.now()` changes, making subscriptions stale
- **Solutions**:
  - Use scheduled functions to set boolean flags that trigger updates
  - Pass time as an explicit argument from the client
  - Use Convex's `_creationTime` system field for time-based queries

```typescript
// Bad: subscription becomes stale
const recentPosts = await ctx.db
  .query("posts")
  .filter(p => p.createdAt > Date.now() - 24 * 60 * 60 * 1000)
  .collect();

// Good: pass cutoff time from client
export const getRecentPosts = query({
  args: { cutoffTime: v.number() },
  handler: async (ctx, { cutoffTime }) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_createdAt", q => q.gt("createdAt", cutoffTime))
      .collect();
  },
});
```

### Use `ctx.runQuery` Sparingly in Mutations
- `ctx.runQuery` incurs extra overhead compared to plain TypeScript functions
- Exceptions: component usage or intentional partial rollback scenarios
- Prefer extracting shared logic into helper functions

### Real-Time Subscription Considerations
- Queries automatically subscribe to changes—design with this in mind
- Minimize the data returned to reduce bandwidth and re-render frequency
- Use pagination for lists that could grow large
