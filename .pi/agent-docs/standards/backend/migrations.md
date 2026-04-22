## Convex Schema Evolution & Migrations

### Schema Changes in Convex
Convex handles schema changes differently than traditional databases:
- Schema changes are deployed with code via `npx convex deploy`
- No separate migration files—schema is defined in `convex/schema.ts`
- Convex validates data against schema at runtime

### Adding New Fields
- **Optional fields**: Add with `v.optional()` for backwards compatibility
- **Required fields with defaults**: Use a migration mutation to populate existing documents

```typescript
// Step 1: Add as optional
defineTable({
  name: v.string(),
  email: v.string(),
  role: v.optional(v.string()), // New optional field
})

// Step 2: Run migration to populate
export const migrateUserRoles = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      if (user.role === undefined) {
        await ctx.db.patch(user._id, { role: "member" });
      }
    }
  },
});

// Step 3: Make required after migration
defineTable({
  name: v.string(),
  email: v.string(),
  role: v.string(), // Now required
})
```

### Removing Fields
- Remove the field from schema—Convex ignores extra fields in existing documents
- Optionally run a cleanup mutation to remove old data

### Renaming Fields
1. Add the new field (optional)
2. Run migration to copy data from old to new field
3. Update code to use new field
4. Remove old field from schema
5. Optionally clean up old field data

### Index Changes
- **Adding indexes**: Safe to add anytime; Convex builds in background
- **Removing indexes**: Remove from schema; Convex cleans up automatically
- **Modifying indexes**: Remove old, add new (treated as separate operations)

### Migration Patterns

**Batch Processing for Large Tables**
```typescript
export const migrateInBatches = internalMutation({
  args: { cursor: v.optional(v.string()) },
  handler: async (ctx, { cursor }) => {
    const results = await ctx.db
      .query("largeTable")
      .paginate({ cursor, numItems: 100 });

    for (const doc of results.page) {
      await ctx.db.patch(doc._id, { /* updates */ });
    }

    if (!results.isDone) {
      await ctx.scheduler.runAfter(0, internal.migrations.migrateInBatches, {
        cursor: results.continueCursor,
      });
    }
  },
});
```

**Scheduled Migrations**
- Use `ctx.scheduler` for long-running migrations
- Break into smaller batches to avoid timeout limits
- Use internal functions for migration logic

### Best Practices
- **Test migrations locally** before deploying to production
- **Keep migrations idempotent**: Safe to run multiple times
- **Version control schema changes**: Schema is code, commit with features
- **Document breaking changes**: Note in PR when schema changes affect existing data
- **Use feature flags**: Deploy code that handles both old and new schema during transition
