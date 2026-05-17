# 27 — Better Auth Adapter Factory Migration

**Status:** Draft (not started)

**Overview:** Move `convexAdapter` and its supporting DB operations from `apps/www/convex/auth/` into the `@vexcms/better-auth` package. Follow the exact same pattern as `convex/vex.ts` — the package provides `authDbApi` which creates handler objects, and the user calls it at module level in `convex/auth/db.ts` to create proper Convex FunctionReferences. The adapter references these functions via `anyApi` (like `vexConvexApi` does) and calls them via `ctx.runMutation`/`ctx.runQuery`. Keeps `sessions.ts`, `api.ts`, `config.ts`, `plugins/index.ts`, and all `src/auth/` utilities in www — these are app-specific and must not move.

---

## Architecture Summary

This follows the **exact same pattern** as `convex/vex.ts` in www:

```ts
// www/convex/vex.ts — existing pattern for vex operations
import { queryApi, mutationApi } from "@vexcms/core/server";
import config from "~/vex.config";

export const { find, get, search } = queryApi(config, internalQuery);
export const { create, update, remove } = mutationApi(config, internalMutation);
```

```ts
// www/convex/auth/db.ts — new pattern for auth db operations
import { authDbApi } from "@vexcms/better-auth/convex";
import { internalMutation, internalQuery } from "../../_generated/server";
import schema from "../schema";

export const {
  dbCreate,
  dbFindOne,
  dbFindMany,
  dbCount,
  dbUpdate,
  dbUpdateMany,
  dbDelete,
  dbDeleteMany,
} = authDbApi({
  schema,
  internalMutation,
  internalQuery,
});
```

**Why this works:**

1. Calling `authDbApi` at module level creates proper Convex FunctionReferences
2. These are exported and available as `internal.auth.db.dbCreate`, etc.
3. The adapter uses `anyApi.auth.db.dbCreate` to reference them
4. The adapter uses `ctx.runMutation`/`ctx.runQuery` to call them
5. All operations run within the correct context (MutationCtx for mutations, QueryCtx for queries)

---

## Code Effect Preview

### www/convex/auth/db.ts — NEW file following vex.ts pattern

```ts
+import { authDbApi } from "@vexcms/better-auth/convex"
+import { internalMutation, internalQuery } from "../../_generated/server"
+import schema from "../schema"
+
+// Export db operations as proper Convex FunctionReferences — same pattern as vex.ts
+export const { dbCreate, dbFindOne, dbFindMany, dbCount, dbUpdate, dbUpdateMany, dbDelete, dbDeleteMany } = authDbApi({
+  schema,
+  internalMutation,
+  internalQuery,
+})
```

### www/convex/auth/index.ts — simplified to use adapter only

```ts
+import { createBetterAuthAdapter } from "@vexcms/better-auth/convex"
+import { dbCreate, dbFindOne, dbFindMany, dbCount, dbUpdate, dbUpdateMany, dbDelete, dbDeleteMany } from "./db"

 export const createAuth = (
   ctx: GenericActionCtx<DataModel>,
   { optionsOnly } = { optionsOnly: false }
 ) => {
   return betterAuth({
+    database: createBetterAuthAdapter(ctx, { dbCreate, dbFindOne, dbFindMany, dbCount, dbUpdate, dbUpdateMany, dbDelete, dbDeleteMany }),
     logger: { disabled: optionsOnly },
     ...authOptions,
   })
 }
```

### www/convex/auth/ — files deleted after migration

```
- adapter/index.ts   ← moved to package (as convex/adapter.ts)
- adapter/utils.ts   ← moved to package (merged into convex/adapter.ts)
- db.ts              ← replaced by NEW auth/db.ts (uses authDbApi)
```

---

## Status / Progress

- [ ] ⏳ Update `packages/better-auth/src/convex/db.ts` — handler objects with explicit types
- [ ] ⏳ Update `packages/better-auth/src/convex/adapter.ts` — use anyApi to reference db operations
- [ ] ⏳ Update `packages/better-auth/src/convex/index.ts` — export `authDbApi` + `createBetterAuthAdapter`
- [ ] ⏳ Update `packages/better-auth/src/index.ts` — export new functions
- [ ] ⏳ Create `apps/www/convex/auth/db.ts` — uses authDbApi (NEW file)
- [ ] ⏳ Update `apps/www/convex/auth/index.ts` — use createBetterAuthAdapter
- [ ] ⏳ Delete `apps/www/convex/auth/adapter/`, old `apps/www/convex/auth/db.ts`
- [ ] ⏳ Verify `pnpm typecheck` passes

---

## Design Decisions

| #   | Decision (one line)                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------- |
| D1  | `authDbApi` creates Convex FunctionReferences at module level (same pattern as `queryApi`/`mutationApi`).        |
| D2  | Adapter uses `anyApi` to reference db operations (`anyApi.auth.db.dbCreate` etc.).                               |
| D3  | Adapter calls db operations via `ctx.runMutation`/`ctx.runQuery` (ActionCtx requires this, not direct `ctx.db`). |
| D4  | Two parts: (1) `authDbApi` in package creates handlers, (2) user calls it at module level in their project.      |

---

## Out of Scope

- Changing the return shape of `getSessionWithUser` in `sessions.ts` — app-specific, stays in www.
- Modifying auth options in `src/auth/options.ts` — app-specific.
- Moving `plugins/index.ts`, `config.ts`, `api.ts` — app-specific.
- Moving `src/auth/serverUtils.ts`, `permissions.ts`, `types.ts` — Next.js-specific, app-specific.

---

## Target Directory Structure

```
packages/better-auth/src/
  index.ts                              ✅ (modify — export authDbApi, createBetterAuthAdapter)
  adapter.ts                            ✅ (keep — Vex CMS adapter, not Convex adapter)
  convex/
    index.ts       ✅ (modify — authDbApi + createBetterAuthAdapter)
    types.ts       ✅ (keep — existing types)
    db.ts          ✅ (keep — handler objects, updated types)
    adapter.ts     ✅ (modify — use anyApi)
    utils.ts       ✅ (keep — helper functions)

apps/www/convex/auth/
  db.ts          ⏳ (NEW — uses authDbApi, replaces old db.ts)
  index.ts       ✅ (modify — use createBetterAuthAdapter)
  sessions.ts    ✅ (keep — app-specific)
  api.ts         ✅ (keep — app-specific)
  config.ts      ✅ (keep — app-specific)
  plugins/
    index.ts     ✅ (keep — app-specific)
  adapter/       ⏳ (delete — moved to package)
    index.ts     → packages/better-auth/src/convex/adapter.ts
    utils.ts     → packages/better-auth/src/convex/adapter.ts (merged)
  old db.ts      ⏳ (delete — replaced by NEW db.ts)
```

---

## Implementation Order

### Step 1 — Update db.ts handler types [dev]

Update handler parameter types in `packages/better-auth/src/convex/db.ts`. Use `GenericMutationCtx` for mutation handlers and `GenericQueryCtx` for query handlers. Handlers receive schema as third parameter.

### Step 2 — Update adapter.ts to use anyApi [dev]

Modify `packages/better-auth/src/convex/adapter.ts` to use `anyApi` to reference db operations. Use `ctx.runMutation`/`ctx.runQuery` to call them (ActionCtx requires this, not direct `ctx.db`).

### Step 3 — Update convex/index.ts with authDbApi + createBetterAuthAdapter [dev]

Update `packages/better-auth/src/convex/index.ts` to export:

- `authDbApi` — creates handler objects wrapped with user's internalMutation/internalQuery
- `createBetterAuthAdapter` — creates adapter (accepts ctx and uses anyApi to reference db operations)

### Step 4 — Update package index [agent]

Update `packages/better-auth/src/index.ts` to export new functions.

### Step 5 — Create www/convex/auth/db.ts [dev]

Create NEW file following vex.ts pattern:

```ts
import { authDbApi } from "@vexcms/better-auth/convex";
import { internalMutation, internalQuery } from "../../_generated/server";
import schema from "../schema";

export const {
  dbCreate,
  dbFindOne,
  dbFindMany,
  dbCount,
  dbUpdate,
  dbUpdateMany,
  dbDelete,
  dbDeleteMany,
} = authDbApi({
  schema,
  internalMutation,
  internalQuery,
});
```

### Step 6 — Update www/convex/auth/index.ts [dev]

```ts
import { createBetterAuthAdapter } from "@vexcms/better-auth/convex";
import {
  dbCreate,
  dbFindOne,
  dbFindMany,
  dbCount,
  dbUpdate,
  dbUpdateMany,
  dbDelete,
  dbDeleteMany,
} from "./db";

export const createAuth = (ctx) => {
  return betterAuth({
    database: createBetterAuthAdapter(ctx, {
      dbCreate,
      dbFindOne,
      dbFindMany,
      dbCount,
      dbUpdate,
      dbUpdateMany,
      dbDelete,
      dbDeleteMany,
    }),
    ...authOptions,
  });
};
```

### Step 7 — Delete moved files [agent]

Delete `apps/www/convex/auth/adapter/` and old `apps/www/convex/auth/db.ts`.

### Step 8 — Verify [agent]

Run `pnpm typecheck` and test login flow.

---

## Per-Step Content

### Step 1 — Update db.ts handler types [dev]

### Files to modify

- [ ] `packages/better-auth/src/convex/db.ts` — update handler parameter types

Add explicit type annotations for handler parameters. Use `GenericMutationCtx<GenericDataModel>` for mutation handlers and `GenericQueryCtx<GenericDataModel>` for query handlers. Handlers receive schema as third parameter.

Example handler signature:

```ts
handler: async (
  ctx: GenericMutationCtx<GenericDataModel>,
  args: {
    betterAuthSchema: string;
    data: any;
    model: string;
    select?: string[];
  },
  schema: SchemaDefinition<any, any>,
) => {
  // use schema here for checkUniqueFields, listOne, paginate, etc.
};
```

### Step 2 — Update adapter.ts to use anyApi [dev]

### Files to modify

- [ ] `packages/better-auth/src/convex/adapter.ts` — use anyApi + ctx.runMutation/ctx.runQuery

Key changes:

1. Import `anyApi` from `convex/server`
2. Use `ctx.runMutation(anyApi.auth.db.dbCreate, args)` instead of direct handler call
3. Use `ctx.runQuery(anyApi.auth.db.dbFindOne, args)` for queries
4. This works because user creates db operations at module level (proper FunctionReferences)

Full adapter code:

```ts
import type { Where } from "better-auth/types";
import type { GenericActionCtx, GenericDataModel } from "convex/server";
import { anyApi } from "convex/server";
import {
  createAdapterFactory,
  type DBAdapterDebugLogOption,
} from "better-auth/adapters";
import { getAuthTables } from "better-auth/db";

type ConvexCleanedWhere = Where & {
  value: boolean | null | number | number[] | string | string[];
};

const parseWhere = (where?: Where[]): ConvexCleanedWhere[] => {
  return (where?.map((where) => {
    if (where.value instanceof Date) {
      return { ...where, value: where.value.getTime() };
    }
    return where;
  }) ?? []) as ConvexCleanedWhere[];
};

export function convexAdapter<DataModel extends GenericDataModel>(
  ctx: GenericActionCtx<DataModel>,
  _config: { debugLogs?: DBAdapterDebugLogOption } = {},
) {
  return createAdapterFactory({
    adapter: ({ options }) => {
      options.telemetry = { enabled: false };
      const betterAuthSchema = getAuthTables(options);
      const betterAuthSchemaJson = JSON.stringify(betterAuthSchema);

      return {
        id: "convex",
        options: { isRunMutationCtx: "runMutation" in ctx },

        // Use anyApi to reference db operations, call via ctx.runMutation/ctx.runQuery
        create: async ({ data, model, select }) => {
          return await ctx.runMutation(anyApi.auth.db.dbCreate, {
            betterAuthSchema: betterAuthSchemaJson,
            data,
            model,
            select,
          });
        },

        findOne: async ({ model, select, where }) => {
          return await ctx.runQuery(anyApi.auth.db.dbFindOne, {
            betterAuthSchema: betterAuthSchemaJson,
            model,
            select,
            where: parseWhere(where),
          });
        },

        findMany: async ({ limit, model, sortBy, where }) => {
          return await ctx.runQuery(anyApi.auth.db.dbFindMany, {
            betterAuthSchema: betterAuthSchemaJson,
            limit,
            model,
            sortBy,
            where: parseWhere(where),
          });
        },

        count: async ({ model, where }) => {
          return await ctx.runQuery(anyApi.auth.db.dbCount, {
            betterAuthSchema: betterAuthSchemaJson,
            model,
            where: parseWhere(where),
          });
        },

        update: async ({ model, update, where }) => {
          return await ctx.runMutation(anyApi.auth.db.dbUpdate, {
            betterAuthSchema: betterAuthSchemaJson,
            model,
            update,
            where: parseWhere(where),
          });
        },

        updateMany: async ({ model, update, where }) => {
          return await ctx.runMutation(anyApi.auth.db.dbUpdateMany, {
            betterAuthSchema: betterAuthSchemaJson,
            model,
            update,
            where: parseWhere(where),
          });
        },

        delete: async ({ model, where }) => {
          return await ctx.runMutation(anyApi.auth.db.dbDelete, {
            betterAuthSchema: betterAuthSchemaJson,
            model,
            where: parseWhere(where),
          });
        },

        deleteMany: async ({ model, where }) => {
          return await ctx.runMutation(anyApi.auth.db.dbDeleteMany, {
            betterAuthSchema: betterAuthSchemaJson,
            model,
            where: parseWhere(where),
          });
        },

        transaction: async () => {
          throw new Error("Transactions not supported");
        },
      };
    },
    config: {
      adapterId: "convex",
      adapterName: "Convex Adapter",
      customTransformInput: ({ data, fieldAttributes }) =>
        data && fieldAttributes.type === "date"
          ? new Date(data).getTime()
          : data,
      customTransformOutput: ({ data, fieldAttributes }) =>
        data && fieldAttributes.type === "date"
          ? new Date(data).getTime()
          : data,
      debugLogs: _config.debugLogs ?? false,
      disableIdGeneration: true,
      mapKeysTransformInput: { id: "_id" },
      mapKeysTransformOutput: { _id: "id" },
      supportsArrays: true,
      supportsDates: false,
      supportsJSON: true,
      supportsNumericIds: false,
      transaction: false,
      usePlural: false,
    },
  });
}
```

### Step 3 — Update convex/index.ts [dev]

### Files to modify

- [ ] `packages/better-auth/src/convex/index.ts` — add authDbApi + createBetterAuthAdapter

````ts
import type {
  GenericActionCtx,
  GenericDataModel,
  MutationBuilder,
  QueryBuilder,
  SchemaDefinition,
} from "convex/server";
import { convexAdapter } from "./adapter";
import * as DB from "./db";

/**
 * Arguments for authDbApi — same pattern as queryApi/mutationApi in @vexcms/core.
 *
 * The user imports their Convex schema from `convex/schema.ts` and passes it here.
 */
export type AuthDbApiOptions<DataModel extends GenericDataModel> = {
  /** The user's Convex schema (from `convex/schema.ts`). */
  schema: SchemaDefinition<any, any>;
  /** The user's `internalMutation` from `convex/_generated/server`. */
  internalMutation: MutationBuilder<DataModel, "internal">;
  /** The user's `internalQuery` from `convex/_generated/server`. */
  internalQuery: QueryBuilder<DataModel, "internal">;
};

/**
 * Creates the auth DB operations as proper Convex functions.
 *
 * Use this in www/convex/auth/db.ts to export the db operations:
 * ```ts
 * import { authDbApi } from "@vexcms/better-auth/convex"
 * import { internalMutation, internalQuery } from "../../_generated/server"
 * import schema from "../schema"
 *
 * export const { dbCreate, dbFindOne, dbFindMany, dbCount, dbUpdate, dbUpdateMany, dbDelete, dbDeleteMany } = authDbApi({
 *   schema,
 *   internalMutation,
 *   internalQuery,
 * })
 *
 * This follows the exact same pattern as queryApi/mutationApi in @vexcms/core.
 * The returned functions are proper Convex FunctionReferences available as
 * internal.auth.db.dbCreate, etc. in the user's Convex API.
 */
export function authDbApi<DataModel extends GenericDataModel>(
  options: AuthDbApiOptions<DataModel>,
) {
  return {
    dbCreate: options.internalMutation({
      ...DB.create,
      handler: async (ctx, args) =>
        DB.create.handler(ctx, args, options.schema),
    }),

    dbFindOne: options.internalQuery({
      ...DB.findOne,
      handler: async (ctx, args) =>
        DB.findOne.handler(ctx, args, options.schema),
    }),

    dbFindMany: options.internalQuery({
      ...DB.findMany,
      handler: async (ctx, args) =>
        DB.findMany.handler(ctx, args, options.schema),
    }),

    dbCount: options.internalQuery({
      ...DB.count,
      handler: async (ctx, args) => DB.count.handler(ctx, args, options.schema),
    }),

    dbUpdate: options.internalMutation({
      ...DB.update,
      handler: async (ctx, args) =>
        DB.update.handler(ctx, args, options.schema),
    }),

    dbUpdateMany: options.internalMutation({
      ...DB.updateMany,
      handler: async (ctx, args) =>
        DB.updateMany.handler(ctx, args, options.schema),
    }),

    dbDelete: options.internalMutation({
      ...DB.deleteOne,
      handler: async (ctx, args) =>
        DB.deleteOne.handler(ctx, args, options.schema),
    }),

    dbDeleteMany: options.internalMutation({
      ...DB.deleteMany,
      handler: async (ctx, args) =>
        DB.deleteMany.handler(ctx, args, options.schema),
    }),
  };
}

/**
 * Creates the Better Auth Convex adapter.
 *
 * Use this in www/convex/auth/index.ts inside createAuth:
 * ```ts
 * import { createBetterAuthAdapter } from "@vexcms/better-auth/convex"
 * import { dbCreate, dbFindOne, ... } from "./db"
 *
 * export const createAuth = (ctx) => {
 *   return betterAuth({
 *     database: createBetterAuthAdapter(ctx, { dbCreate, dbFindOne, ... }),
 *     ...authOptions,
 *   })
 * }
 *
 * The adapter uses anyApi to reference the db operations (anyApi.auth.db.dbCreate etc.)
 * and calls them via ctx.runMutation/ctx.runQuery.
 */
export function createBetterAuthAdapter<DataModel extends GenericDataModel>(
  ctx: GenericActionCtx<DataModel>,
  _db?: Record<string, unknown>, // Not needed - adapter uses anyApi directly
) {
  return convexAdapter(ctx);
}

export { convexAdapter } from "./adapter";
export * from "./types";
````

### Step 4 — Update package index [agent]

### Files to modify

- [ ] `packages/better-auth/src/index.ts`

```ts
export { betterAuthAdapter } from "./adapter";
export type { BetterAuthAdapterOptions } from "./adapter";
export { authDbApi, createBetterAuthAdapter, convexAdapter } from "./convex";
export type { AuthDbApiOptions } from "./convex";
```

### Step 5 — Create www/convex/auth/db.ts [dev]

### Files to create

- [ ] `apps/www/convex/auth/db.ts` (NEW) — follows vex.ts pattern

```ts
import { authDbApi } from "@vexcms/better-auth/convex";
import { internalMutation, internalQuery } from "../../_generated/server";
import schema from "../schema";

// Export db operations as proper Convex FunctionReferences
// These become available as internal.auth.db.dbCreate, etc.
export const {
  dbCreate,
  dbFindOne,
  dbFindMany,
  dbCount,
  dbUpdate,
  dbUpdateMany,
  dbDelete,
  dbDeleteMany,
} = authDbApi({
  schema,
  internalMutation,
  internalQuery,
});
```

### Step 6 — Update www/convex/auth/index.ts [dev]

### Files to modify

- [ ] `apps/www/convex/auth/index.ts`

```ts
import type { GenericActionCtx } from "convex/server";
import { betterAuth } from "better-auth";
import { authOptions } from "~/auth/options";
import type { DataModel } from "../_generated/dataModel";
import { createBetterAuthAdapter } from "@vexcms/better-auth/convex";
import {
  dbCreate,
  dbFindOne,
  dbFindMany,
  dbCount,
  dbUpdate,
  dbUpdateMany,
  dbDelete,
  dbDeleteMany,
} from "./db";

export const createAuth = (
  ctx: GenericActionCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false },
) => {
  return betterAuth({
    database: createBetterAuthAdapter(ctx, {
      dbCreate,
      dbFindOne,
      dbFindMany,
      dbCount,
      dbUpdate,
      dbUpdateMany,
      dbDelete,
      dbDeleteMany,
    }),
    logger: { disabled: optionsOnly },
    ...authOptions,
  });
};
```

### Step 7 — Delete moved files [agent]

Delete:

- `apps/www/convex/auth/adapter/` (entire directory)
- `apps/www/convex/auth/db.ts` (old file, replaced by NEW db.ts)

### Step 8 — Verify [agent]

```bash
pnpm typecheck
pnpm --filter www dev
# Open http://localhost:3020
# Navigate to /admin
# Login with test credentials
# Verify admin panel loads without redirect
```

---

## Why This Architecture Works

1. **authDbApi at module level creates FunctionReferences:**
   - Calling `internalMutation(handlerObject)` at module level creates a proper Convex function
   - This function is a FunctionReference that can be exported
   - Available as `internal.auth.db.dbCreate`, etc.

2. **Adapter uses anyApi to reference them:**
   - `anyApi.auth.db.dbCreate` is a reference to the user's exported function
   - Works regardless of where the function is defined

3. **ctx.runMutation/ctx.runQuery work with ActionCtx:**
   - ActionCtx can call `ctx.runQuery` and `ctx.runMutation`
   - These call the referenced functions with proper MutationCtx/QueryCtx

4. **Same pattern as vex.ts:**
   - User creates functions at module level
   - Functions are available in Convex API
   - Other code references them via anyApi or direct import

---

## Verification

```bash
pnpm typecheck
pnpm --filter www dev
# Open http://localhost:3020
# Navigate to /admin
# Login with test credentials
# Verify admin panel loads without redirect
```

---

## Success Criteria

1. `pnpm typecheck` passes with no errors in `apps/www` or `packages/better-auth`
2. Login flow at `http://localhost:3020/auth/sign-in` → redirect to `/admin` works
3. Admin panel renders user data (verify `getSessionWithUser` still works)
4. No "Invalid ID length 1" error (the original bug is still fixed from earlier)
5. DB operations (`dbCreate`, `dbFindOne`, etc.) are proper Convex FunctionReferences exportable from module

---

## References

- `apps/www/convex/vex.ts` — pattern reference (queryApi/mutationApi usage)
- `packages/core/src/convex/server.ts` — queryApi/mutationApi implementation
- `packages/core/src/convex/index.ts` — vexConvexApi + anyApi pattern
- `apps/www/convex/auth/index.ts` — current implementation (will be simplified)
- `apps/www/convex/auth/db.ts` — current DB operations (source for handlers)

