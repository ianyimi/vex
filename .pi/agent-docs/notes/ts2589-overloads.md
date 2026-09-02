# TS2589: Excessively Deep Type Instantiation

## What's happening

TypeScript has a hard limit (~50 levels) on how deep it will chase type resolution. When you write `api.pages.list`, TypeScript has to resolve the entire `api` type before it can extract the one function you want. That `api` type is:

```
FilterApi<ApiFromModules<{ ...14 modules... }>, "public">
```

Resolving that means TypeScript walks through every module, and for each one, resolves all its exports and their generic types. The `vex` module is the deepest — `queryApi(config, query)` produces three functions (`find`, `get`, `search`) whose arg types use **conditional types** that branch per collection:

```ts
// Simplified — what TypeScript sees when resolving api.vex.find
collection: CollectionSlug   // → "pages" | "headers" | "footers" | "themes" | "site_settings"
return: CollectionSlug extends "pages"
  ? Page[]
  : CollectionSlug extends "headers"
    ? Header[]
    : CollectionSlug extends "footers"
      ? Footer[]
      : CollectionSlug extends "themes"
        ? Theme[]
        : SiteSettings[]
```

That's one function. Multiply by 3 functions × 5 collections, and each branch itself has nested generics (populate, depth, DataModel). The depth compounds.

**You're hitting this because your type system works correctly.** The full type safety is real — TypeScript just can't compute it all within its recursion budget.

## Will users hit this faster than plain Convex projects?

Yes. A plain Convex project has simple function signatures — `query({ args: { text: v.string() }, handler })` — shallow types. Your `queryApi` adds 3 functions × N collections of conditional branching on top. With 5 collections you're already near the limit. A user adding 8-10 collections would hit it reliably.

The `mutationApi` functions (`create`, `update`, `remove`) are less problematic because they're cast to `RegisteredMutation<Visibility, never, never>` — they intentionally discard their type depth. The query functions don't have that escape hatch because the return type IS the value.

## Before: conditional types (current)

```ts
// packages/core/src/api/server.ts — queryApi()

export function queryApi<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>(
  config: VexConfig,
  query: QueryBuilder<DataModel, Visibility>,
) {
  return {
    find: query({
      args: {
        collection: v.string(),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
        limit: v.optional(v.number()),
      },
      handler: (ctx, args) =>
        find({
          ctx,
          collection: args.collection as CollectionSlug,
          populate: args.populate,
          depth: args.depth,
          config,
          limit: args.limit,
        }),
    }),

    // get and search follow the same pattern...
  };
}
```

**How TypeScript resolves `api.vex.find` with this approach:**

1. `api` → `FilterApi<typeof fullApi, "public">`
2. `typeof fullApi` → `ApiFromModules<{ vex: typeof vexModule, ...13 others }>`
3. `typeof vexModule` → resolves `queryApi`'s return type
4. `queryApi` return → `{ find: Query<"public", FindArgs, FindReturn> }`
5. `FindReturn` → conditional type branching on `CollectionSlug`
6. Each branch → resolves `DocumentBySlug[TSlug]` → resolves `GeneratedVexTypes`
7. `GeneratedVexTypes` → augmented by user's `vex.types.ts` with full field maps

Steps 5-7 repeat for EVERY collection, even if the caller only passes `"pages"`. TypeScript can't skip branches — it has to validate the whole union.

**Estimated depth per call site: ~35-45 levels** (close to the 50 limit).

## After: function overloads

```ts
// packages/core/src/api/server.ts — queryApi()

export function queryApi<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>(
  config: VexConfig,
  query: QueryBuilder<DataModel, Visibility>,
) {
  // Overload signatures — TypeScript matches the call directly, no branching
  function find(
    args: { collection: "pages"; limit?: number; populate?: any; depth?: number },
  ): Promise<Page[]>;
  function find(
    args: { collection: "headers"; limit?: number; populate?: any; depth?: number },
  ): Promise<Header[]>;
  function find(
    args: { collection: "footers"; limit?: number; populate?: any; depth?: number },
  ): Promise<Footer[]>;
  function find(
    args: { collection: "themes"; limit?: number; populate?: any; depth?: number },
  ): Promise<Theme[]>;
  function find(
    args: { collection: "site_settings"; limit?: number; populate?: any; depth?: number },
  ): Promise<SiteSettings[]>;
  function find(
    args: { collection: string; limit?: number; populate?: any; depth?: number },
  ): Promise<VexDocument[]>;
  // Implementation — runtime behavior unchanged
  function find(args: any) {
    return query({
      args: {
        collection: v.string(),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
        limit: v.optional(v.number()),
      },
      handler: (ctx: any, args: any) =>
        findServer({
          ctx,
          collection: args.collection as CollectionSlug,
          populate: args.populate,
          depth: args.depth,
          config,
          limit: args.limit,
        }),
    });
  }

  return { find, /* get, search follow same pattern */ };
}
```

**How TypeScript resolves `api.vex.find` with overloads:**

1. `api` → `FilterApi<typeof fullApi, "public">`
2. `typeof fullApi` → `ApiFromModules<{ vex: typeof vexModule, ... }>`
3. `typeof vexModule.find` → TypeScript sees the overload list
4. Caller passes `collection: "pages"` → TypeScript matches overload #1 directly
5. Return type: `Promise<Page[]>` — done

**Estimated depth per call site: ~15-20 levels** — well within the limit.

## What function overloading offers

| | Conditional types | Function overloads |
|---|---|---|
| **Type safety** | Full — return type inferred from collection slug | Full — same return type per slug |
| **Autocomplete** | Full | Full |
| **TypeScript depth** | ~35-45 levels per call site | ~15-20 levels |
| **Headroom for growth** | ~5 more collections before TS2589 | ~30+ collections before TS2589 |
| **Populate narrowing** | Automatic via conditional `PopulateShape<TSlug>` | Must be manually typed per overload or use a helper |
| **Implementation** | One generic function | Overload signatures + one implementation |

## The one trade-off: populate typing

With conditional types, `populate` is automatically narrowed:

```ts
// Conditional: populate keys are narrowed to relationship fields on that collection
find({ ctx, collection: "posts", populate: { author: true } })  // ✅ "author" is a relationship
find({ ctx, collection: "posts", populate: { title: true } })   // ❌ "title" is text, not relationship
```

With overloads, you'd need to either:
- Type `populate` as `any` in the overload (lose per-field narrowing, keep per-collection return type)
- Write the populate shape per overload manually (verbose but full safety)
- Use a helper type that the overload signature references (middle ground)

**Recommendation:** Use `any` for populate in overloads initially. The per-collection return type is the big win — populate narrowing is a nice-to-have that can be added later per overload.

## Where you'd implement this

**One file:** `packages/core/src/api/server.ts`

The `queryApi` and `mutationApi` functions. No other files need changes.

The overload signatures are generated from the `VexConfig` at generate time — `vex dev` would read the collections from the config and emit the overload signatures into the generated `vex.ts` (or a new file). The runtime implementation stays identical.

## How much performance is saved

Roughly **60% reduction in type depth** per call site (35-45 → 15-20 levels). This means:

- 5 collections: works today (barely), works comfortably with overloads
- 10 collections: TS2589 today, works fine with overloads
- 20+ collections: TS2589 today, likely works with overloads (depends on other modules)

The savings come from eliminating the conditional branching. TypeScript resolves overloads by matching the call arguments against the signature list — it's a flat lookup, not a recursive descent.
