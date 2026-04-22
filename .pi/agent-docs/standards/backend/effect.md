## Effect Standards for Convex Actions

Effect is used in Convex actions for typed error handling, retry policies, service composition, and OpenTelemetry observability. Effect is **not** used in queries or mutations (simple database operations don't benefit from it).

### Why Effect? The Problem with Promises

TypeScript's `Promise<T>` only tells half the story—it describes the success case but stays silent about failures. The `catch` block types errors as `unknown`, forcing you to either:
- Dig through documentation hoping to find all possible errors
- Add `instanceof` checks and hope you covered everything
- Play "error gambling" and discover failures at 2 AM in production

This "happy path blindness" compounds: when someone calls your function, they inherit all your invisible error cases. Six months later, nobody knows what can fail.

**Effect solves this** by making errors first-class citizens in the type system. An `Effect<A, E, R>` tells you:
- `A` - what succeeds
- `E` - what can fail (typed, exhaustive)
- `R` - what dependencies are required

The type signature becomes self-documenting: `Effect<Shipping, OrderNotFound | PaymentFailed, never>` tells you everything that can happen without reading the implementation.

### When to Use Effect

| Convex Function Type | Use Effect? | Reason |
|----------------------|-------------|--------|
| **Queries** | No | Simple database reads, no side effects |
| **Mutations** | No | Simple database writes, Convex handles transactions |
| **Actions (external APIs)** | Yes | Retries, error handling, tracing |
| **Actions (workflows)** | Yes | Composition, services, observability |
| **Actions (simple)** | No | If just calling one internal function, skip Effect |

### Project Structure

```
convex/
├── lib/
│   └── effect/
│       ├── errors.ts       # Typed error definitions
│       ├── services.ts     # Service/connector interfaces
│       ├── tracing.ts      # OpenTelemetry setup
│       └── runtime.ts      # Effect runtime helpers
├── connectors/
│   ├── types.ts            # Connector service definitions
│   ├── planning-center.ts  # Planning Center implementation
│   └── mailchimp.ts        # Mailchimp implementation
└── workflows/
    ├── guest-follow-up.ts  # Workflow definitions
    └── event-promotion.ts
```

---

### Typed Errors with Schema.TaggedError

Define errors using `Schema.TaggedError` for type-safe, serializable errors:

```typescript
// convex/lib/effect/errors.ts
import { Schema } from "effect";

// Connector-level errors
export class OAuthExpiredError extends Schema.TaggedError<OAuthExpiredError>()(
  "OAuthExpiredError",
  {
    connector: Schema.String,
    expiresAt: Schema.Date,
  }
) {}

export class RateLimitError extends Schema.TaggedError<RateLimitError>()(
  "RateLimitError",
  {
    connector: Schema.String,
    retryAfter: Schema.Number,
    limit: Schema.Number,
  }
) {}

export class NetworkError extends Schema.TaggedError<NetworkError>()(
  "NetworkError",
  {
    connector: Schema.String,
    statusCode: Schema.optional(Schema.Number),
    message: Schema.String,
  }
) {}

// Workflow-level errors
export class WorkflowStepError extends Schema.TaggedError<WorkflowStepError>()(
  "WorkflowStepError",
  {
    workflowId: Schema.String,
    stepName: Schema.String,
    message: Schema.String,
    recoverable: Schema.Boolean,
  }
) {}

export class ApprovalRequiredError extends Schema.TaggedError<ApprovalRequiredError>()(
  "ApprovalRequiredError",
  {
    workflowId: Schema.String,
    stepName: Schema.String,
    approvalId: Schema.String,
    reason: Schema.String,
  }
) {}

// Union types for handling
export type ConnectorError =
  | OAuthExpiredError
  | RateLimitError
  | NetworkError;

export type WorkflowError =
  | WorkflowStepError
  | ApprovalRequiredError;
```

**Why TaggedError?**
- The `_tag` property enables exhaustive switch statements
- Schemas serialize errors for frontend display
- Type inference tracks which errors can occur
- Errors become rich data structures, not just signals—carry retry info, context, recovery hints

---

### Composing Effects with Effect.gen

`Effect.gen` is Effect's secret weapon for writing imperative-looking business logic. It uses generator syntax that looks almost identical to async/await:

```typescript
import { Effect } from "effect";

const processOrder = (orderId: string) =>
  Effect.gen(function* () {
    // yield* is like await - suspends until the effect completes
    const order = yield* fetchOrder(orderId);
    const payment = yield* processPayment(order);
    const shipping = yield* arrangeShipping(order, payment);

    return { orderId, paymentId: payment.id, trackingNumber: shipping.tracking };
  });
```

**Why generators over pipe?**
- Linear, sequential, readable code
- TypeScript automatically infers the union of all possible errors from yielded effects
- No manual type annotation of error unions required

Use `.pipe()` for high-order transformations (retry, timeout, map), and `Effect.gen` for business logic composition.

---

### Services for Dependency Injection

Define connector interfaces as Effect Services:

```typescript
// convex/lib/effect/services.ts
import { Context, Effect } from "effect";
import type { ConnectorError } from "./errors";

// Guest type (shared)
export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  firstVisit: Date;
}

// ChMS Connector Service
export class ChMSConnector extends Context.Tag("ChMSConnector")<
  ChMSConnector,
  {
    readonly getGuests: (since: Date) => Effect.Effect<Guest[], ConnectorError>;
    readonly createTask: (guestId: string, assigneeId: string, dueDate: Date) => Effect.Effect<{ id: string }, ConnectorError>;
  }
>() {}

// Email Connector Service
export class EmailConnector extends Context.Tag("EmailConnector")<
  EmailConnector,
  {
    readonly sendTemplateEmail: (
      to: string,
      templateId: string,
      data: Record<string, unknown>
    ) => Effect.Effect<{ messageId: string }, ConnectorError>;
  }
>() {}
```

**Why Services?**
- Swap implementations without changing workflow logic
- Test with mocks, run with real connectors
- Type-safe dependency injection—no magic globals or boolean flags

**Service Tag Naming Convention:**
Use a namespaced identifier to avoid collisions: `"ProjectName/Path/ServiceName"`. This prevents subtle bugs where two services with the same identifier silently override each other (discovered only at runtime).

```typescript
// Good - unique, namespaced
export class ChMSConnector extends Context.Tag("Maprios/Connectors/ChMSConnector")<...>() {}

// Bad - could collide with third-party packages
export class ChMSConnector extends Context.Tag("ChMSConnector")<...>() {}
```

---

### Implementing Connectors

```typescript
// convex/connectors/planning-center.ts
import { Effect, Layer, Schedule } from "effect";
import { ChMSConnector, Guest } from "../lib/effect/services";
import { OAuthExpiredError, RateLimitError, NetworkError } from "../lib/effect/errors";

const makeAPICall = <T>(
  accessToken: string,
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: unknown
): Effect.Effect<T, OAuthExpiredError | RateLimitError | NetworkError> =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(
        `https://api.planningcenteronline.com${endpoint}`,
        {
          method,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: body ? JSON.stringify(body) : undefined,
        }
      );

      if (response.status === 401) {
        throw { _type: "oauth" } as const;
      }
      if (response.status === 429) {
        throw {
          _type: "ratelimit",
          retryAfter: parseInt(response.headers.get("Retry-After") || "60"),
        } as const;
      }
      if (!response.ok) {
        throw { _type: "network", status: response.status } as const;
      }

      return response.json() as Promise<T>;
    },
    catch: (error) => {
      if (typeof error === "object" && error !== null && "_type" in error) {
        const e = error as { _type: string; retryAfter?: number; status?: number };
        switch (e._type) {
          case "oauth":
            return new OAuthExpiredError({ connector: "PlanningCenter", expiresAt: new Date() });
          case "ratelimit":
            return new RateLimitError({ connector: "PlanningCenter", retryAfter: e.retryAfter || 60, limit: 100 });
          case "network":
            return new NetworkError({ connector: "PlanningCenter", statusCode: e.status, message: `HTTP ${e.status}` });
        }
      }
      return new NetworkError({ connector: "PlanningCenter", message: String(error) });
    },
  });

// Retry policy for rate limits only
const rateLimitRetry = Schedule.exponential("1 second").pipe(
  Schedule.jittered,
  Schedule.whileInput((e): e is RateLimitError => e._tag === "RateLimitError"),
  Schedule.upTo("2 minutes")
);

export const makePlanningCenterConnector = (accessToken: string) =>
  ChMSConnector.of({
    getGuests: (since) =>
      makeAPICall<{ data: Array<{ id: string; attributes: Record<string, unknown> }> }>(
        accessToken,
        `/people/v2/people?where[status]=guest&where[created_at][gte]=${since.toISOString()}`
      ).pipe(
        Effect.retry(rateLimitRetry),
        Effect.map((response) =>
          response.data.map((person) => ({
            id: person.id,
            firstName: String(person.attributes.first_name),
            lastName: String(person.attributes.last_name),
            email: String(person.attributes.primary_contact_email),
            firstVisit: new Date(String(person.attributes.created_at)),
          }))
        ),
        Effect.withSpan("planning-center.getGuests", { attributes: { since: since.toISOString() } })
      ),

    createTask: (guestId, assigneeId, dueDate) =>
      makeAPICall<{ data: { id: string } }>(
        accessToken,
        `/people/v2/people/${guestId}/workflow_cards`,
        "POST",
        { data: { type: "WorkflowCard", attributes: { assignee_id: assigneeId, due_at: dueDate.toISOString() } } }
      ).pipe(
        Effect.retry(rateLimitRetry),
        Effect.map((response) => ({ id: response.data.id })),
        Effect.withSpan("planning-center.createTask", { attributes: { guestId, assigneeId } })
      ),
  });

// Layer for dependency injection
export const PlanningCenterLayer = (accessToken: string) =>
  Layer.succeed(ChMSConnector, makePlanningCenterConnector(accessToken));
```

---

### Understanding Layers and Dependency Injection

**What problem do layers solve?**

Without layers, large applications have massive "main" files that construct the entire dependency graph manually. Every time you add a dependency, you update that file—causing merge conflicts, growing complexity, and coupling construction order to implementation.

Layers are effectful constructors for services that:
1. Can be composed declaratively (no manual ordering)
2. Are constructed in parallel where possible
3. Support resource acquisition/release (connections, file handles)
4. Are memoized by reference (same layer instance = built once)

**Layer Type Signature:**
```typescript
Layer<Out, Err, In>
//    │     │    │
//    │     │    └── Services required to construct this layer
//    │     └────── Errors that can occur during construction
//    └──────────── Services this layer produces
```

### Layer Composition Patterns

Think of layers like a dependency tree. Composition patterns determine how you connect child services to parent services.

**`Layer.provide` (Vertical Composition)**
Plugs a child layer into a parent, erasing the satisfied dependency:

```typescript
// Calendar needs Database → (Database) → Calendar
// Database provides Database → () → Database
// Result: () → Calendar (Database requirement erased)

const fulfilledCalendar = CalendarLayer.pipe(
  Layer.provide(DatabaseLayer)
);
```

Abstract pattern: `(A → B)` provided to `(B → C)` yields `(A → C)` (innards collapse like function composition).

**`Layer.provideMerge` (Provide + Expose)**
Like `provide`, but also keeps the provided service in the output:

```typescript
// Same as above, but Database stays in output
// Result: () → Calendar | Database

const fulfilledCalendarWithDb = CalendarLayer.pipe(
  Layer.provideMerge(DatabaseLayer)
);
```

Use when downstream layers also need access to the provided service.

**`Layer.merge` (Horizontal Composition)**
Combines two independent layers without providing—inputs and outputs both merge:

```typescript
// (A → B) merged with (C → D) yields (A | C → B | D)

const combinedLayer = Layer.merge(DatabaseLayer, NotificationLayer);
```

Use when building up requirements before providing to a parent.

**Composing a Dependency Tree:**

```
              EventService
             /            \
     UserService        CalendarService
       /    \                  |
  Database  Notifications   Database
```

Build bottom-up: merge siblings, provide to parents:

```typescript
// Leaf layers (no dependencies)
const DatabaseLayer = Layer.succeed(Database, makeDatabase());
const NotificationLayer = Layer.succeed(Notifications, makeNotifications());

// UserService needs Database + Notifications
const UserLayer = UserServiceLayer.pipe(
  Layer.provide(Layer.merge(DatabaseLayer, NotificationLayer))
);

// CalendarService needs Database
const CalendarLayer = CalendarServiceLayer.pipe(
  Layer.provide(DatabaseLayer)
);

// EventService needs UserService + CalendarService
const AppLayer = EventServiceLayer.pipe(
  Layer.provide(Layer.merge(UserLayer, CalendarLayer))
);
```

**Best Practice: Provide Dependencies Locally**

Provide dependencies close to where services are defined, not at the root of the app. This keeps your root layer clean and avoids messy composition at the top level.

```typescript
// Good - locally provided
// convex/connectors/planning-center.ts
export const PlanningCenterLayer = (token: string) =>
  Layer.effect(
    ChMSConnector,
    Effect.gen(function* () {
      const config = yield* ConfigService;
      return makePlanningCenterConnector(token, config);
    })
  ).pipe(Layer.provide(ConfigLayer)); // Provided locally

// At root - just merge final layers
const AppLayer = Layer.mergeAll(PlanningCenterLayer(token), MailchimpLayer(token));
```

**Layer Memoization Warning:**

Layers are memoized by reference identity. If a layer is returned from a function, each call creates a new reference = new construction.

```typescript
// Bad - creates new layer each time, not memoized
const getDbLayer = () => Layer.succeed(Database, makeDatabase());
const layer1 = getDbLayer(); // New reference
const layer2 = getDbLayer(); // Different reference - will construct twice!

// Good - single instance, memoized
const DatabaseLayer = Layer.succeed(Database, makeDatabase());
// Use DatabaseLayer everywhere - constructed once
```

---

### Request-Level Dependencies (Transactions, Tenants)

Some dependencies can't be lifted into layer construction because they vary per request (database transactions, tenant contexts). In these cases, service method-level dependencies are acceptable.

```typescript
// Database service with transaction support
export class Database extends Context.Tag("Maprios/Database")<
  Database,
  {
    readonly query: <T>(sql: string) => Effect.Effect<T, DatabaseError>;
    // Transaction creates a scoped connection
    readonly withTransaction: <A, E, R>(
      effect: Effect.Effect<A, E, R>
    ) => Effect.Effect<A, E | TransactionError, R>;
  }
>() {}

// Usage - dependency on DB is at method level, not constructor
const createOrderWithItems = (order: Order, items: Item[]) =>
  Effect.gen(function* () {
    const db = yield* Database;

    return yield* db.withTransaction(
      Effect.gen(function* () {
        const orderId = yield* db.query(`INSERT INTO orders...`);
        yield* Effect.forEach(items, (item) =>
          db.query(`INSERT INTO order_items...`)
        );
        return orderId;
      })
    );
  });
```

For multi-tenant databases, the tenant context can be provided per-request:

```typescript
export class TenantContext extends Context.Tag("Maprios/TenantContext")<
  TenantContext,
  { tenantId: string }
>() {}

// In request handler
const handleRequest = (tenantId: string, effect: Effect.Effect<A, E, TenantContext>) =>
  effect.pipe(
    Effect.provideService(TenantContext, { tenantId })
  );
```

---

### Retry and Timeout Policies

```typescript
import { Effect, Schedule } from "effect";

// Exponential backoff with jitter
const exponentialRetry = Schedule.exponential("100 millis").pipe(
  Schedule.jittered,
  Schedule.upTo("30 seconds")
);

// Retry only specific errors
const retryOnRateLimit = Schedule.exponential("1 second").pipe(
  Schedule.whileInput((e): e is RateLimitError => e._tag === "RateLimitError"),
  Schedule.upTo("2 minutes")
);

// Fixed retry count
const retryThreeTimes = Schedule.recurs(3);

// Combining retry with timeout
const resilientCall = myApiCall.pipe(
  Effect.retry(exponentialRetry),
  Effect.timeout("1 minute"),
  Effect.catchTag("TimeoutException", () =>
    Effect.fail(new NetworkError({ connector: "MyAPI", message: "Request timed out" }))
  )
);
```

---

### Interruption Handling (Built-in Abort Signals)

Unlike promises where you manually pass `AbortController` down the stack, Effect has interruption built-in. You provide cancellation behavior at the smallest building block, and the runtime propagates it automatically.

```typescript
// Wrap a fetch call with interruption support
const fetchWithInterruption = (url: string) =>
  Effect.async<Response, NetworkError>((resume, signal) => {
    // Effect provides the AbortSignal automatically
    fetch(url, { signal })
      .then((res) => resume(Effect.succeed(res)))
      .catch((err) =>
        signal.aborted
          ? resume(Effect.interrupt) // Clean interruption
          : resume(Effect.fail(new NetworkError({ connector: url, message: err.message })))
      );
  });
```

When you race effects or use concurrency controls, Effect automatically interrupts losing/excess computations:

```typescript
// First to complete wins, others are interrupted
const fastest = Effect.race(fetchFromA, fetchFromB);

// Bounded concurrency - only 3 at a time
const results = Effect.forEach(urls, fetchWithInterruption, { concurrency: 3 });
```

---

### Expected Errors vs Defects

Effect distinguishes between:
- **Expected errors** (`E` channel): Business logic failures you handle (rate limits, not found, validation)
- **Defects** (untyped): Unexpected failures you don't recover from (bugs, invariant violations)

At application boundaries, after applying retry/recovery strategies, convert remaining expected errors to defects:

```typescript
const robustOperation = riskyEffect.pipe(
  Effect.retry(retryPolicy),
  Effect.catchTag("RateLimitError", () => Effect.fail(new WorkflowStepError(...))),
  // After all recovery attempts, any remaining errors are unexpected
  Effect.orDie // Converts typed errors → defects (E becomes never)
);
```

**When to use `Effect.orDie`:**
- At the edge of your application after exhausting recovery
- When an error "should never happen" given your retry policies
- To clean up the error channel before returning to non-Effect code

---

### OpenTelemetry Tracing

```typescript
// convex/lib/effect/tracing.ts
import { NodeSdk } from "@effect/opentelemetry/NodeSdk";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Layer } from "effect";

// Production: Export to OTLP endpoint (Grafana, Honeycomb, etc.)
export const TracingLayer = NodeSdk.layer(() => ({
  resource: {
    serviceName: "your-app-workflows",
    serviceVersion: "1.0.0",
  },
  spanProcessor: new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: process.env.OTLP_ENDPOINT || "http://localhost:4318/v1/traces",
    })
  ),
}));

// Development: Log spans to console
export const ConsoleTracingLayer = NodeSdk.layer(() => ({
  resource: { serviceName: "your-app-workflows" },
  spanProcessor: new BatchSpanProcessor(
    new (require("@opentelemetry/sdk-trace-base").ConsoleSpanExporter)()
  ),
}));
```

### Adding Spans to Effects

```typescript
import { Effect } from "effect";

// Basic span
const traced = myEffect.pipe(
  Effect.withSpan("operation-name")
);

// Span with attributes
const tracedWithAttrs = myEffect.pipe(
  Effect.withSpan("fetch-guests", {
    attributes: {
      organizationId: org.id,
      since: since.toISOString(),
    },
  })
);

// Annotate current span (add attributes mid-execution)
const workflow = Effect.gen(function* () {
  const guests = yield* fetchGuests(since);
  yield* Effect.annotateCurrentSpan("guestCount", guests.length);
  // ...
});

// Log events to current span
const withLogging = Effect.gen(function* () {
  yield* Effect.log("Starting workflow", { workflowId });
  // Effect.log automatically creates span events
});
```

---

### Running Effect in Convex Actions

```typescript
// convex/lib/effect/runtime.ts
import { Effect, Layer } from "effect";
import { TracingLayer } from "./tracing";

// Run an Effect program and return a Promise
export const runEffect = <A, E>(
  effect: Effect.Effect<A, E, never>
): Promise<A> => {
  return effect.pipe(
    Effect.provide(TracingLayer),
    Effect.runPromise
  );
};

// Run with connector layers
export const runEffectWithConnectors = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  connectorLayer: Layer.Layer<R, never, never>
): Promise<A> => {
  return effect.pipe(
    Effect.provide(connectorLayer),
    Effect.provide(TracingLayer),
    Effect.runPromise
  );
};
```

```typescript
// convex/workflows/guest-follow-up.ts
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { Effect, Layer } from "effect";
import { runEffectWithConnectors } from "../lib/effect/runtime";
import { PlanningCenterLayer } from "../connectors/planning-center";
import { MailchimpLayer } from "../connectors/mailchimp";
import { ChMSConnector, EmailConnector } from "../lib/effect/services";
import { WorkflowStepError, ApprovalRequiredError } from "../lib/effect/errors";

// Define the workflow as an Effect
const guestFollowUpWorkflow = (payload: { since: Date; assigneeId: string; templateId: string }) =>
  Effect.gen(function* () {
    const chms = yield* ChMSConnector;
    const email = yield* EmailConnector;

    // Step 1: Fetch guests
    yield* Effect.log("Fetching guests");
    const guests = yield* chms.getGuests(payload.since).pipe(
      Effect.mapError((e) => new WorkflowStepError({
        workflowId: "guest-follow-up",
        stepName: "fetch-guests",
        message: e.message,
        recoverable: e._tag === "RateLimitError",
      })),
      Effect.withSpan("step.fetch-guests")
    );
    yield* Effect.annotateCurrentSpan("guestCount", guests.length);

    // Step 2: Create tasks (parallel with concurrency limit)
    yield* Effect.log("Creating follow-up tasks");
    const tasks = yield* Effect.forEach(
      guests,
      (guest) =>
        chms.createTask(guest.id, payload.assigneeId, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).pipe(
          Effect.mapError((e) => new WorkflowStepError({
            workflowId: "guest-follow-up",
            stepName: `create-task-${guest.id}`,
            message: e.message,
            recoverable: true,
          }))
        ),
      { concurrency: 5 }
    ).pipe(Effect.withSpan("step.create-tasks"));

    // Step 3: Send emails (parallel, don't fail workflow on individual failures)
    yield* Effect.log("Sending welcome emails");
    const emailResults = yield* Effect.forEach(
      guests,
      (guest) =>
        email.sendTemplateEmail(guest.email, payload.templateId, {
          firstName: guest.firstName,
          lastName: guest.lastName,
        }).pipe(
          Effect.map(() => ({ success: true as const, guestId: guest.id })),
          Effect.catchAll((e) =>
            Effect.succeed({ success: false as const, guestId: guest.id, error: e.message })
          )
        ),
      { concurrency: 10 }
    ).pipe(Effect.withSpan("step.send-emails"));

    const successfulEmails = emailResults.filter((r) => r.success).length;
    yield* Effect.annotateCurrentSpan("emailsSent", successfulEmails);
    yield* Effect.annotateCurrentSpan("emailsFailed", guests.length - successfulEmails);

    return {
      guestsProcessed: guests.length,
      tasksCreated: tasks.length,
      emailsSent: successfulEmails,
      emailsFailed: guests.length - successfulEmails,
    };
  }).pipe(Effect.withSpan("workflow.guest-follow-up"));

// Convex action that executes the workflow
export const executeGuestFollowUp = internalAction({
  args: {
    workflowId: v.id("workflows"),
    since: v.string(),
    assigneeId: v.string(),
    templateId: v.string(),
  },
  handler: async (ctx, args) => {
    // Load OAuth tokens from database
    const tokens = await ctx.runQuery(internal.connectors.getTokens, {
      workflowId: args.workflowId,
    });

    // Build connector layers
    const connectorLayer = Layer.mergeAll(
      PlanningCenterLayer(tokens.planningCenter.accessToken),
      MailchimpLayer(tokens.mailchimp.accessToken)
    );

    try {
      const result = await runEffectWithConnectors(
        guestFollowUpWorkflow({
          since: new Date(args.since),
          assigneeId: args.assigneeId,
          templateId: args.templateId,
        }),
        connectorLayer
      );

      // Record success in Convex
      await ctx.runMutation(internal.workflows.recordCompletion, {
        workflowId: args.workflowId,
        status: "completed",
        result,
      });

      return result;
    } catch (error) {
      // Handle typed errors
      if (error instanceof WorkflowStepError) {
        await ctx.runMutation(internal.workflows.recordFailure, {
          workflowId: args.workflowId,
          status: error.recoverable ? "failed_recoverable" : "failed",
          error: {
            _tag: error._tag,
            stepName: error.stepName,
            message: error.message,
            recoverable: error.recoverable,
          },
        });

        // Schedule retry if recoverable
        if (error.recoverable) {
          await ctx.scheduler.runAfter(60_000, internal.workflows.executeGuestFollowUp, args);
        }
      }
      throw error;
    }
  },
});
```

---

### Error Handling Patterns

#### Catch Specific Errors by Tag

```typescript
const handled = myEffect.pipe(
  Effect.catchTag("RateLimitError", (e) =>
    Effect.gen(function* () {
      yield* Effect.log(`Rate limited, waiting ${e.retryAfter}s`);
      yield* Effect.sleep(`${e.retryAfter} seconds`);
      return yield* myEffect; // Retry
    })
  ),
  Effect.catchTag("OAuthExpiredError", (e) =>
    Effect.fail(new WorkflowStepError({
      workflowId: "...",
      stepName: "...",
      message: `OAuth token expired for ${e.connector}`,
      recoverable: false, // Needs re-authentication
    }))
  )
);
```

#### Map Errors to Workflow-Level Errors

```typescript
const step = connectorCall.pipe(
  Effect.mapError((e) => new WorkflowStepError({
    workflowId,
    stepName: "my-step",
    message: e.message,
    recoverable: e._tag === "RateLimitError",
  }))
);
```

#### Don't Fail Workflow on Non-Critical Errors

```typescript
const results = yield* Effect.forEach(
  items,
  (item) =>
    processItem(item).pipe(
      Effect.map((r) => ({ success: true, result: r })),
      Effect.catchAll((e) => Effect.succeed({ success: false, error: e }))
    ),
  { concurrency: 5 }
);
```

---

### Syncing Traces to Convex

For frontend visibility into workflow execution:

```typescript
// convex/lib/effect/tracing.ts
import { ConvexHttpClient } from "convex/browser";
import { api } from "../_generated/api";

class ConvexSpanProcessor {
  constructor(private convex: ConvexHttpClient) {}

  onEnd(span: ReadableSpan) {
    // Fire and forget - don't block workflow
    this.convex.mutation(api.traces.recordSpan, {
      traceId: span.spanContext().traceId,
      spanId: span.spanContext().spanId,
      parentSpanId: span.parentSpanId,
      name: span.name,
      status: span.status.code === 1 ? "ok" : "error",
      startTime: span.startTime[0] * 1000 + span.startTime[1] / 1e6,
      endTime: span.endTime[0] * 1000 + span.endTime[1] / 1e6,
      attributes: Object.fromEntries(
        Object.entries(span.attributes).map(([k, v]) => [k, String(v)])
      ),
    }).catch(() => {}); // Don't fail on trace sync errors
  }
}
```

---

### Sharing Types with Frontend

Effect types can be imported in the frontend **as types only** (no runtime):

```typescript
// Frontend component
import type { WorkflowError, WorkflowStepError } from "@/convex/lib/effect/errors";

function WorkflowErrorDisplay({ error }: { error: WorkflowError }) {
  switch (error._tag) {
    case "WorkflowStepError":
      return (
        <Alert variant={error.recoverable ? "warning" : "destructive"}>
          <AlertTitle>Step failed: {error.stepName}</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
          {error.recoverable && <Button>Retry</Button>}
        </Alert>
      );
    case "ApprovalRequiredError":
      return (
        <Alert>
          <AlertTitle>Approval Required</AlertTitle>
          <AlertDescription>{error.reason}</AlertDescription>
          <Button href={`/approvals/${error.approvalId}`}>Review</Button>
        </Alert>
      );
  }
}
```

**Important:** Only import `type { ... }` to avoid bundling Effect runtime (~50KB).

---

### Best Practices Summary

| Practice | Description |
|----------|-------------|
| **Use Effect only in actions** | Queries/mutations don't benefit from Effect |
| **Use Effect.gen for business logic** | Generator syntax with automatic error type inference |
| **Define errors with TaggedError** | Enables exhaustive matching and serialization |
| **Errors are data, not signals** | Include retry hints, context, recovery information |
| **Use Services for connectors** | Enables testing and swappable implementations |
| **Namespace service tags** | Use `"Project/Path/ServiceName"` to avoid collisions |
| **Provide dependencies locally** | Close to where services are defined, not at app root |
| **Layers are memoized by reference** | Same instance = built once; functions create new refs |
| **Add spans to all steps** | Use `Effect.withSpan` for observability |
| **Annotate spans with context** | Add `guestCount`, `workflowId`, etc. |
| **Retry only recoverable errors** | Use `Schedule.whileInput` to filter |
| **Map to workflow-level errors** | Connector errors → WorkflowStepError |
| **Don't fail on non-critical steps** | Use `catchAll` → `Effect.succeed({ success: false })` |
| **Use Effect.orDie at boundaries** | After recovery exhausted, convert to defects |
| **Interruption is built-in** | No need to pass AbortController—provide signal at leaves |
| **Sync traces to Convex** | For frontend visibility |
| **Import types only in frontend** | `import type { ... }` to avoid runtime |

### Related Standards

- See [error-handling.md](../global/error-handling.md) for frontend error display
- See [api.md](./api.md) for Convex function patterns
- See [validation.md](../global/validation.md) for input validation
