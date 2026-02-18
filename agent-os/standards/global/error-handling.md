## Error Handling Standards

This project uses a layered error handling approach:
- **Convex queries/mutations**: Simple thrown errors
- **Convex actions (workflows)**: Effect typed errors with `Schema.TaggedError`
- **Frontend**: Discriminated unions with `_tag` for exhaustive handling

### Why Typed Errors Matter

TypeScript's `catch (e: unknown)` is "error gambling"—you don't know what you're catching. This leads to:
- Digging through docs/source code to find all possible errors
- `instanceof` checks hoping you covered everything
- Invisible error propagation through your codebase (someone calls your function 6 months later—how do they know it can fail with a rate limit error?)

**Effect's typed errors solve this** by making errors first-class in the type system. Type signatures like `Effect<User, UserNotFound | DatabaseError>` are self-documenting contracts—the compiler tracks every possible failure, and you can't ignore them.

---

### Convex Queries and Mutations

**Throw errors for invalid operations**:
```typescript
export const update = mutation({
  args: { id: v.id("users"), name: v.string() },
  handler: async (ctx, { id, name }) => {
    const user = await ctx.db.get(id);

    if (!user) {
      throw new Error("User not found");
    }

    // Proceed with update
    await ctx.db.patch(id, { name });
  },
});
```

**Access control errors**:
```typescript
export const deleteWorkflow = mutation({
  args: { id: v.id("workflows") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const workflow = await ctx.db.get(id);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    if (workflow.ownerId !== identity.subject) {
      throw new Error("Forbidden: You don't own this workflow");
    }

    await ctx.db.delete(id);
  },
});
```

---

### Convex Actions (Workflows) - Effect Typed Errors

For Convex actions that orchestrate external APIs and workflows, use Effect's typed errors:

```typescript
// convex/lib/effect/errors.ts
import { Schema } from "effect";

// Define typed errors with Schema.TaggedError
export class WorkflowStepError extends Schema.TaggedError<WorkflowStepError>()(
  "WorkflowStepError",
  {
    workflowId: Schema.String,
    stepName: Schema.String,
    message: Schema.String,
    recoverable: Schema.Boolean,
  }
) {}

export class ConnectorOfflineError extends Schema.TaggedError<ConnectorOfflineError>()(
  "ConnectorOfflineError",
  {
    connector: Schema.String,
    retryAt: Schema.Date,
  }
) {}

// Union type for handling
export type WorkflowError = WorkflowStepError | ConnectorOfflineError;
```

**Using typed errors in workflows**:
```typescript
import { Effect } from "effect";
import { WorkflowStepError } from "../lib/effect/errors";

const fetchGuests = (since: Date) =>
  callPlanningCenterAPI(since).pipe(
    Effect.mapError((e) => new WorkflowStepError({
      workflowId: "guest-follow-up",
      stepName: "fetch-guests",
      message: e.message,
      recoverable: e._tag === "RateLimitError",
    }))
  );
```

**Handling errors by tag**:
```typescript
const handled = myEffect.pipe(
  Effect.catchTag("RateLimitError", (e) =>
    Effect.gen(function* () {
      yield* Effect.log(`Rate limited, retrying in ${e.retryAfter}s`);
      yield* Effect.sleep(`${e.retryAfter} seconds`);
      return yield* myEffect;
    })
  ),
  Effect.catchTag("OAuthExpiredError", () =>
    Effect.fail(new WorkflowStepError({
      workflowId: "...",
      stepName: "...",
      message: "OAuth token expired, re-authentication required",
      recoverable: false,
    }))
  )
);
```

**Persisting errors to Convex**:
```typescript
// In Convex action
try {
  const result = await Effect.runPromise(workflow);
  await ctx.runMutation(internal.workflows.recordCompletion, { workflowId, result });
} catch (error) {
  if (error instanceof WorkflowStepError) {
    await ctx.runMutation(internal.workflows.recordFailure, {
      workflowId,
      error: {
        _tag: error._tag,
        stepName: error.stepName,
        message: error.message,
        recoverable: error.recoverable,
      },
    });

    if (error.recoverable) {
      await ctx.scheduler.runAfter(60_000, internal.workflows.retry, { workflowId });
    }
  }
  throw error;
}
```

See [backend/effect.md](../backend/effect.md) for comprehensive Effect patterns.

---

### React Components

**Handle loading and error states**:
```tsx
function UserProfile({ userId }: { userId: Id<"users"> }) {
  const user = useQuery(api.users.get, { id: userId });

  // Loading state
  if (user === undefined) {
    return <Skeleton className="h-20 w-full" />;
  }

  // Not found state
  if (user === null) {
    return (
      <Alert variant="destructive">
        <AlertTitle>User not found</AlertTitle>
      </Alert>
    );
  }

  return <UserCard user={user} />;
}
```

**Mutation error handling**:
```tsx
function CreateUserForm() {
  const createUser = useMutation(api.users.create);
  const { toast } = useToast();

  const handleSubmit = async (data: UserData) => {
    try {
      await createUser(data);
      toast({ title: "User created successfully" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create user",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
```

**TanStack Query error handling**:
```tsx
const { data, error, isError, refetch } = useQuery({
  queryKey: ["user", userId],
  queryFn: () => convex.query(api.users.get, { id: userId }),
});

if (isError) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error loading user</AlertTitle>
      <AlertDescription>
        {error.message}
        <Button variant="link" onClick={() => refetch()}>
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

### Form Validation Errors

**Display field errors after touch**:
```tsx
<form.Field name="email">
  {(field) => (
    <div className="space-y-2">
      <Label htmlFor={field.name}>Email</Label>
      <Input
        id={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={field.state.meta.errors.length > 0}
      />
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <p className="text-sm text-destructive" role="alert">
          {field.state.meta.errors[0]}
        </p>
      )}
    </div>
  )}
</form.Field>
```

### Displaying Workflow Errors (Typed Errors from Effect)

When workflows fail, they return typed errors that can be handled exhaustively:

```tsx
import type { WorkflowError } from "@/convex/lib/effect/errors";

function WorkflowErrorDisplay({ error }: { error: WorkflowError }) {
  switch (error._tag) {
    case "WorkflowStepError":
      return (
        <Alert variant={error.recoverable ? "warning" : "destructive"}>
          <AlertTitle>Step failed: {error.stepName}</AlertTitle>
          <AlertDescription>
            {error.message}
            {error.recoverable && (
              <Button variant="outline" size="sm" className="mt-2">
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      );
    case "ConnectorOfflineError":
      return (
        <Alert variant="warning">
          <AlertTitle>{error.connector} is offline</AlertTitle>
          <AlertDescription>
            Will retry at {new Date(error.retryAt).toLocaleTimeString()}
          </AlertDescription>
        </Alert>
      );
    case "ApprovalRequiredError":
      return (
        <Alert>
          <AlertTitle>Approval Required</AlertTitle>
          <AlertDescription>
            {error.reason}
            <Button asChild className="mt-2">
              <a href={`/approvals/${error.approvalId}`}>Review</a>
            </Button>
          </AlertDescription>
        </Alert>
      );
  }
}
```

**Note:** Import types only (`import type { ... }`) to avoid bundling Effect runtime.

---

### Error Boundaries

**Wrap sections with error boundaries**:
```tsx
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>
        {error.message}
        <Button onClick={resetErrorBoundary}>Try again</Button>
      </AlertDescription>
    </Alert>
  );
}

// Usage
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <WorkflowDashboard />
</ErrorBoundary>
```

### Best Practices

- **User-friendly messages**: Show actionable errors, hide technical details
- **Fail fast**: Validate input early, throw before invalid operations
- **Specific errors**: Use descriptive error messages, not generic "Error occurred"
- **Graceful degradation**: Show partial UI when non-critical parts fail
- **Retry mechanisms**: Allow users to retry failed operations
- **Log errors**: Log errors server-side for debugging (Convex dashboard)
- **Loading states**: Always handle `undefined` from Convex queries

### Async/Await in Convex

**Always await promises** - unresolved promises cause silent failures:
```typescript
// Good - awaited
await ctx.scheduler.runAfter(0, internal.jobs.process, { id });

// Bad - forgotten await causes silent failure
ctx.scheduler.runAfter(0, internal.jobs.process, { id });
```

Use `@typescript-eslint/no-floating-promises` ESLint rule to catch these.

### Related Standards

- See [validation.md](./validation.md) for input validation patterns
- See [frontend/forms.md](../frontend/forms.md) for form error handling
- See [backend/api.md](../backend/api.md) for Convex error patterns
- See [backend/effect.md](../backend/effect.md) for Effect typed errors in workflows
