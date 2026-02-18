## Convex API (Functions) Standards

### Function Types
- **Queries**: Read-only operations that subscribe to real-time updates; use for fetching data
- **Mutations**: Write operations that modify the database; use for creating, updating, deleting data
- **Actions**: For side effects, external API calls, or operations requiring Node.js runtime

### Argument Validation (Required)
- **Always use argument validators** on all public functions via the `args` property
- Validators prevent clients from passing unexpected data types or fields
- Use `v.id("tableName")` for document ID arguments

```typescript
export const updateMovie = mutation({
  args: {
    id: v.id("movies"),
    update: v.object({
      title: v.string(),
      director: v.string(),
    }),
  },
  handler: async (ctx, { id, update }) => {
    await ctx.db.patch("movies", id, update);
  },
});
```

### Access Control
- **Check authentication** via `ctx.auth.getUserIdentity()` in all public functions before allowing operations
- Use unguessable identifiers (Convex IDs, UUIDs) for access control—never rely on spoofable arguments like email
- Create **granular functions** (e.g., `setTeamOwner` vs. `updateTeam`) to enable specific permission checks per operation

### Internal vs Public Functions
- **Only schedule internal functions**: Use `internal.foo.bar` references for `ctx.scheduler`, `ctx.runQuery`, `ctx.runMutation`
- Never expose `api.foo.bar` for internal scheduling—public functions can be called by malicious attackers
- Use `internalMutation`, `internalQuery`, `internalAction` for functions that should not be client-callable

### Code Organization
- **Use helper functions** for shared code: structure logic in a `convex/model` directory as plain TypeScript functions
- Keep `query`, `mutation`, and `action` wrappers as thin layers that call helper functions
- This separates concerns and makes refactoring easier

### Actions Best Practices
- **Use `runAction` only for different runtimes**: Replace with TypeScript functions unless you need Node.js-specific libraries
- **Avoid sequential `ctx.runMutation`/`ctx.runQuery`** in actions—each runs in its own transaction, causing consistency issues
- Combine multiple operations into a single mutation/query call when possible
- **Use Effect for workflow actions**: Actions that orchestrate external APIs should use Effect for typed errors, retries, and tracing

### Effect in Convex Actions

For actions that call external APIs or execute workflows, use Effect:

```typescript
import { internalAction } from "./_generated/server";
import { Effect, Layer } from "effect";
import { runEffectWithConnectors } from "./lib/effect/runtime";
import { PlanningCenterLayer } from "./connectors/planning-center";
import { WorkflowStepError } from "./lib/effect/errors";

export const executeWorkflow = internalAction({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    const tokens = await ctx.runQuery(internal.connectors.getTokens, { workflowId: args.workflowId });

    const connectorLayer = PlanningCenterLayer(tokens.accessToken);

    try {
      const result = await runEffectWithConnectors(
        myWorkflow(args).pipe(
          Effect.withSpan("workflow.my-workflow")
        ),
        connectorLayer
      );

      await ctx.runMutation(internal.workflows.recordCompletion, {
        workflowId: args.workflowId,
        result,
      });

      return result;
    } catch (error) {
      if (error instanceof WorkflowStepError) {
        await ctx.runMutation(internal.workflows.recordFailure, {
          workflowId: args.workflowId,
          error: { _tag: error._tag, stepName: error.stepName, message: error.message },
        });

        if (error.recoverable) {
          await ctx.scheduler.runAfter(60_000, internal.workflows.executeWorkflow, args);
        }
      }
      throw error;
    }
  },
});
```

See [effect.md](./effect.md) for comprehensive Effect patterns in Convex actions.

### Async/Await
- **Always await promises** in Convex functions
- Use the `no-floating-promises` ESLint rule to catch unresolved promises that cause failed scheduling or unhandled errors

### Database Operations
- **Always include table name** as first argument to `ctx.db.get()`, `ctx.db.patch()`, `ctx.db.replace()`, `ctx.db.delete()`
- Use the `@convex-dev/explicit-table-ids` ESLint rule to enforce this

```typescript
// Correct
await ctx.db.get("movies", movieId);
await ctx.db.patch("movies", movieId, { title: "Whiplash" });
```
