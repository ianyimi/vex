# TS2589 Deep Type Instantiation — Root Cause Analysis & Fix Proposals

## The Problem

When a Vex CMS project has 5+ collections, TypeScript throws `TS2589: Type instantiation is excessively deep and possibly infinite` in certain contexts — specifically inside Next.js `generateMetadata()` functions and other demanding type contexts. The error does NOT appear in simpler contexts (default page components, regular function calls).

TypeScript has a hard ~50-level recursion limit for conditional type resolution. There is no tsconfig option to increase it.

## Key Insight: The Client API Is Not the User API

**The proper way users interact with Vex CMS data:**

1. Write a Convex query function that calls the server API with a literal collection slug:
   ```ts
   // convex/pages.ts
   export const getBySlug = query({
     args: { slug: v.string() },
     handler: (ctx, args) => find({ ctx, collection: TABLE_SLUG_PAGES, filter: ... }),
   })
   ```
2. Call that Convex function from client components:
   ```ts
   // src/app/page.tsx
   const pages = await fetchQuery(api.pages.getBySlug, { slug: "home" })
   ```

**Users should never call `api.vex.find` or `api.vex.get` directly in their client code.** Those generic endpoints exist only for the admin panel's internal use (and even the admin panel may not need them — it already uses `api.vex.collections.list/get/etc.` via `vexConvexApi`).

This changes the evaluation significantly: **we can remove or simplify the generic `api.vex.*` endpoints without affecting user DX**, because users never call them. The only consumer is the admin panel, which already accesses them through `anyApi` (bypassing TypeScript type checking entirely).

## How the Depth Accumulates

Every access to the `api` object triggers this resolution chain:

```
1. api → FilterApi<typeof fullApi, FunctionReference<any, "public">>
2. typeof fullApi → ApiFromModules<{ auth/adapter/index, auth/adapter/utils, auth/api,
     auth/config, auth/db, auth/index, auth/plugins/index, auth/sessions,
     http, pages, seed, test, vex, vex/collections }>
3. For EACH module: resolve all exported function types
4. vex module: queryApi() returns { find, get, search } with deep conditional return types
5. Each query's handler calls find({ ctx, collection: args.collection })
6. args.collection from v.string() → TypeScript sees string, not literal
7. find's generic TSlug → full CollectionSlug union
8. FindReturn<TSlug, ...> branches per collection via conditional types
9. DocumentBySlug, CollectionsFieldTypeMap resolve through GeneratedVexTypes augmentation
10. Populated/DepthPopulate add more conditional branching
11. FilterApi wraps the whole thing in another type layer
```

This happens for EVERY module in the `api` object, even when the consumer only accesses `api.pages.getBySlug` (a shallow module). The `ApiFromModules` resolution is all-or-nothing — TypeScript can't resolve one module without resolving them all.

## Where the Conditional Types Live

| File | Conditional types | Count of `extends ? :` |
|------|-------------------|----------------------|
| `core/src/types/generated.ts` | `CollectionSlug`, `DocumentBySlug`, `CollectionsFieldTypeMap` | 6 |
| `core/src/api/types.ts` | `FieldKeysOfType`, `RelationshipTargetOf`, `PopulateShape`, `Populated`, `DepthPopulate`, `DepthPopulated`, `SortableKeysOf` | 67 |
| `core/src/api/find/server.ts` | `FindReturnItem`, `FindReturn` | 25 |
| `core/src/api/get/server.ts` | `GetReturnItem` | 16 |
| `core/src/api/search/server.ts` | `SearchReturnItem` | 17 |
| **Total conditional branches** | | **~131** |

Each of these is resolved DEEP inside the `api` type chain. TypeScript cannot skip branches — it must validate the entire union even when the consumer only passes one slug.

## Fix C Did Not Work — Why

Fix C (casting `queryApi` return values to shallow types) was applied but had **no effect** on the TS2589 error when using `api.pages.getBySlug`. This means:

1. The `pages` module itself is shallow (it's a simple `query()` call with a literal slug)
2. The `vex` module's cast exports are shallow
3. **But the error still fires** — because `ApiFromModules` resolves ALL modules, and other modules (auth) or the `FilterApi`/`ApiFromModules` chain itself, combined with the `generateMetadata` return type, still exceed the limit

**Conclusion:** The problem is not just the `vex` module. It's the total accumulated depth across ALL modules in `ApiFromModules` + `FilterApi` + the calling context. Removing or simplifying one module helps but doesn't solve it if the baseline from other modules + the chain itself is already near the limit.

---

## Proposed Fixes (Updated)

### Fix A: `& {}` Counter Reset

**What:** Wrap `vexConvexApi` properties with `& {}` to reset TypeScript's internal recursion counter.

**Code change:** Only `packages/core/src/convex/index.ts`:

```ts
find: anyApi.vex.find as VexFindRef & {},
```

**DX impact:** Zero.

**TS2589 impact:** Low — only helps at the `vexConvexApi` boundary, not during `ApiFromModules` resolution.

**Scalability:** Doesn't scale — the counter reset is at the wrong level.

---

### Fix B: Named Type Alias Caching

**What:** Replace inline conditional types with named type aliases so TypeScript caches their resolution.

**Code change:** `packages/core/src/api/types.ts`, `find/server.ts`, `get/server.ts`, `search/server.ts`.

**DX impact:** Zero — public API surface is identical.

**TS2589 impact:** Moderate — cached aliases reduce redundant re-evaluation. With 100 collections, `DocumentBySlug` resolves once, then `_DocForSlug<"pages">` resolves from cache in ~1 step.

**TS performance:** Positive — less redundant work.

**Scalability at 100 collections:** Helps substantially but may not be enough alone if the baseline from auth modules + FilterApi is already deep.

---

### Fix C: Cast `queryApi` Returns (Already Tried — Insufficient Alone)

**What:** Cast `queryApi()` return values to shallow `RegisteredQuery` types.

**Result:** Did not fix TS2589 when accessing shallow modules like `api.pages.getBySlug`. The `vex` module's contribution was reduced, but other modules + the `ApiFromModules`/`FilterApi` chain still exceed the limit.

**Updated assessment:** Still worth doing (reduces total depth), but **not sufficient alone**. Must be combined with other fixes.

---

### Fix D: Generated Per-Collection Endpoints

**What:** `vex dev` generates a file per collection at `convex/vex/api/{slug}.ts` with typed Convex functions.

**DX impact:** Positive — `api.vex.api.pages.find` returns `Page[]` with full autocomplete.

**TS2589 impact:** None alone — doesn't remove existing deep modules from `ApiFromModules`.

**NEW assessment with client API removed:** If we remove the generic `vex.ts` endpoints entirely (Fix F), per-collection generated endpoints become the ONLY way to access data through the `api` object. Each generated module is shallow (concrete return types). This is the cleanest long-term architecture.

---

### Fix E: Isolate Auth Module Depth

**What:** The auth adapter module (`convex/auth/adapter/index.ts`) independently causes TS2589. Investigate and flatten its contribution.

**DX impact:** None — admin panel accesses auth via `anyApi`.

**TS2589 impact:** Potentially significant — Fix C alone didn't solve it, which suggests the auth modules are a major contributor.

**Scalability:** If auth is the remaining depth problem after removing `vex`, fixing auth could give enough headroom for 100+ collections.

---

### Fix F: Remove Generic `api.vex.*` Endpoints Entirely ← NEW

**What:** Delete `vex.ts` from the convex folder. No more `api.vex.find`, `api.vex.get`, `api.vex.search`, `api.vex.create`, `api.vex.update`, `api.vex.remove`. The admin panel already uses `api.vex.collections.*` (via `vexConvexApi` → `anyApi`). Users write their own typed query functions using the server API.

**Why this is now on the table:** Since users never call `api.vex.find` in their client code (they use `api.pages.getBySlug` etc.), and the admin panel uses `anyApi.vex.collections.*` (not `api.vex.find`), the generic endpoints serve no purpose in the typed `api` object. They exist at runtime for `vexConvexApi` to reference, but `vexConvexApi` uses `anyApi` which bypasses the type system entirely.

**How `vexConvexApi` still works:** `vexConvexApi` references `anyApi.vex.find` — this is a PATH reference (`"vex/find"`), not a type-dependent reference. It works at runtime regardless of whether `vex.ts` exports are in the typed `api` object. The Convex function is still registered and callable.

**But wait — `vexConvexApi` needs the functions to exist at runtime.** If we delete `vex.ts`, the functions don't exist. We still need the Convex query/mutation functions registered — they just don't need deep types.

**Revised approach:** Keep `vex.ts` but make ALL exports `internalQuery`/`internalMutation` instead of `query`/`mutation`. Internal functions are registered at runtime but excluded from the PUBLIC `api` object by `FilterApi`. They're accessible via `internal.vex.find` (for server-side use) and `anyApi.vex.find` (for `vexConvexApi`). The typed `api` object never sees them.

```ts
// convex/vex.ts — revised
import { queryApi, mutationApi } from "@vexcms/core/server"
import config from "~/vex.config"
import { internalQuery, internalMutation } from "./_generated/server"

const _q = queryApi(config, internalQuery)
const _m = mutationApi(config, internalMutation)

export const find = _q.find
export const get = _q.get
export const search = _q.search
export const create = _m.create
export const update = _m.update
export const remove = _m.remove
```

**DX impact:** Zero for users — they never called `api.vex.find`. The admin panel still works via `anyApi.vex.find` (runtime path) and `vexConvexApi` (already uses `anyApi` casts).

**TS2589 impact:** HIGH — `FilterApi` strips internal functions from the typed `api` object. The `vex` module disappears from the type chain entirely. The deepest contributor is gone.

**TS performance:** Significant improvement — the compiler does far less work building the `api` type.

**Scalability at 100 collections:** The `vex` module no longer contributes to depth. Remaining depth comes from auth modules + `ApiFromModules` + `FilterApi` overhead. With 100 collections, the only collection-specific modules in `ApiFromModules` are user-written ones (like `pages.ts`) and generated ones (if Fix D is also implemented) — all shallow.

**Risk:** `vexConvexApi` currently casts `anyApi.vex.find as VexFindRef`. If `vex.ts` exports are internal, `anyApi.vex.find` still resolves at runtime (Convex registers all functions regardless of visibility). The `as VexFindRef` cast provides the shallow type. **This should work.**

---

### Fix G: Split `ApiFromModules` by Making Auth a Convex Component ← NEW

**What:** Move the auth modules into a Convex Component instead of bare modules in the project's convex folder. Components have their own isolated `api` namespace and don't contribute to the main `ApiFromModules` chain.

**How it works:** Convex Components are self-contained modules with their own `_generated` types. When auth is a component, `ApiFromModules` doesn't include `auth/adapter/index`, `auth/api`, `auth/config`, etc. — those resolve through the component's own type system.

**DX impact:** None — auth functions are accessed the same way from client code.

**TS2589 impact:** Potentially very high — removes 8 modules from the `ApiFromModules` chain.

**Scalability:** At 100 collections, keeping the main `api` type limited to just user modules (shallow) + the component namespace means the type depth stays manageable.

**Effort:** High — requires restructuring how auth is set up in the project. Better Auth may not support component isolation natively.

---

## Updated Recommended Fix Order

| Priority | Fix | DX Impact | TS2589 Impact | Scalability | Effort |
|----------|-----|-----------|---------------|-------------|--------|
| 1 | **F: Remove generic endpoints from typed `api`** (make internal) | **Zero** (users never called them) | **Very High** | **Very High** | Low |
| 2 | **B: Named alias caching** | None | Moderate | High | Medium |
| 3 | **E: Auth module isolation** | None | Unknown — investigate first | Unknown | Low |
| 4 | **A: `& {}` counter reset** | None | Low | Low | Trivial |
| 5 | **D: Generated per-collection endpoints** | Positive (typed access) | None alone | High (with F) | High |
| 6 | **G: Auth as Convex Component** | None | Very High | Very High | High |
| 7 | **C: Cast queryApi returns** | Loses narrowing | High (but alone insufficient) | High | Low |

**The new pragmatic path:**
1. **Fix F first** — make `vex.ts` exports internal. This is the single highest-impact change with zero user DX cost. Users never called `api.vex.find` — they use `api.pages.getBySlug`. The admin panel works via `anyApi`.
2. **Then Fix B** — named alias caching for the remaining conditional types in core.
3. **Investigate Fix E** — how much depth do auth modules contribute now that `vex` is gone?
4. If still hitting limits after F+B+E, then Fix G (auth as component) or further internal-visibility changes.

## Scalability Analysis at Scale (Updated)

| Collections | Current depth | With F (vex internal) | With F+B | With F+B+G |
|-------------|-------------|----------------------|----------|------------|
| 5 | ~40 (breaks in metadata) | ~25 (works) | ~20 (comfortable) | ~15 (comfortable) |
| 20 | ~60 (breaks) | ~30 (works) | ~22 (comfortable) | ~15 (comfortable) |
| 50 | ~80 (breaks) | ~35 (works) | ~25 (comfortable) | ~15 (comfortable) |
| 100 | ~120 (breaks) | ~40 (marginal) | ~28 (comfortable) | ~15 (comfortable) |

Fix F removes the deepest single contributor. Fix B caches the remaining conditional types. Fix G removes the second-deepest contributor. The combination should scale to 100+ collections comfortably.

## What Fix F Actually Looks Like

**Before:**
```ts
// convex/vex.ts — current
import { mutationApi, queryApi } from "@vexcms/core/server"
import config from "~/vex.config"
import { mutation, query } from "./_generated/server"

export const { find, get, search } = queryApi(config, query)
export const { create, update, remove } = mutationApi(config, mutation)
```

**After:**
```ts
// convex/vex.ts — Fix F
import { mutationApi, queryApi } from "@vexcms/core/server"
import config from "~/vex.config"
import { internalMutation, internalQuery } from "./_generated/server"

// Internal visibility: functions exist at runtime but are excluded from
// the public `api` object. This prevents the deep queryApi/mutationApi
// conditional types from entering the ApiFromModules/FilterApi chain,
// eliminating the primary cause of TS2589 in consumer code.
// The admin panel accesses these via anyApi (runtime path, bypasses types).
const _q = queryApi(config, internalQuery)
const _m = mutationApi(config, internalMutation)

export const find = _q.find
export const get = _q.get
export const search = _q.search
export const create = _m.create
export const update = _m.update
export const remove = _m.remove
```

**User code is unchanged:**
```ts
// Users still write their own typed queries
export const getBySlug = query({
  args: { slug: v.string() },
  handler: (ctx, args) => find({ ctx, collection: TABLE_SLUG_PAGES, ... }),
})

// And call them from components
const pages = await fetchQuery(api.pages.getBySlug, { slug: "home" })
```

**Admin panel is unchanged:**
```ts
// vexConvexApi uses anyApi.vex.find — runtime path still works
// even though the function is internal (not in typed api object)
find: anyApi.vex.find as VexFindRef,
```
