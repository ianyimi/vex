## Convex Schema & Data Model Best Practices

### Define a Schema
- **Always define a schema** in `convex/schema.ts` to unlock full type support
- Schema generates return types for database methods
- Enables importing `Doc<"tableName">` and `Id<"tableName">` types across your codebase

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),
});
```

### System Fields
- Convex automatically adds `_id` and `_creationTime` to all documents
- Use `WithoutSystemFields<Doc<"tableName">>` when creating or updating records
- Reference `_creationTime` for time-based queries instead of custom timestamp fields

### Validators and Types
- Use the `Infer` type to convert validators into TypeScript types for reuse

```typescript
import { v, Infer } from "convex/values";

const userValidator = v.object({
  name: v.string(),
  email: v.string(),
  role: v.union(v.literal("admin"), v.literal("member")),
});

type User = Infer<typeof userValidator>;
```

### Index Design
- **Index columns used in queries**: Add indexes for fields used in `.withIndex()` filters
- **Composite indexes**: Order fields from most selective to least selective
- **Avoid redundant indexes**: Don't create `by_foo` if you already have `by_foo_and_bar`
- Index names should describe the fields: `by_userId`, `by_status_and_createdAt`

```typescript
defineTable({
  userId: v.id("users"),
  status: v.string(),
  createdAt: v.number(),
})
  .index("by_userId", ["userId"])
  .index("by_status_and_createdAt", ["status", "createdAt"])
```

### Document References
- Use `v.id("tableName")` for foreign key relationships
- Convex IDs are unguessable and safe for access control
- Consider denormalization for frequently accessed related data

### Context Types for Helper Functions
- Import auto-generated context types based on your schema:
  - `QueryCtx`, `MutationCtx`, `ActionCtx` for function contexts
  - `DatabaseReader`, `DatabaseWriter` for database operations

```typescript
import { QueryCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

async function getUserByEmail(
  ctx: QueryCtx,
  email: string
): Promise<Doc<"users"> | null> {
  return await ctx.db
    .query("users")
    .withIndex("by_email", q => q.eq("email", email))
    .unique();
}
```

### Data Integrity
- Use validators to enforce data rules at the schema level
- Implement validation at both schema (Convex validators) and application (Zod) levels
- Use `v.optional()` for nullable fields, `v.union()` for enums

### Naming Conventions
- Use **camelCase** for field names
- Use **plural nouns** for table names (`users`, `posts`, `comments`)
- Index names should follow `by_fieldName` or `by_field1_and_field2` pattern
