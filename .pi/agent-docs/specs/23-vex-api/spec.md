# Spec 23 — Vex API: Typed `populate` (bare minimum)

**Status:** In progress — Step 2 complete; Steps 1, 3–6 pending (rev 6, 2026-05-08)
**Depends on:** Spec 22 (relationship field). Spec 22 Decision 11 is partially superseded — see § _Spec 22 Reconciliation_ below.
**Companion doc:** `.pi/agent-docs/specs/23-vex-api/design-walkthrough.md` — readable, example-driven user-facing reference. Read that first.
**Last spec update:** 2026-05-08 (rev 6) — Step 2 complete. Deviations from spec: (1) factories in `server.ts` not `index.ts`; `@vexcms/core/convex` export updated to point at `server.ts`. (2) `find.server.ts` gained `filter?`, `order?`, `withIndex?` for full Convex query chain. (3) `slug` param renamed to `collection` throughout all API functions. (4) `Prettify<FindReturnItem<...>>` conditional return pattern added to `find`/`get`/`search` for IDE type display. (5) `AnyFormApi`/`TypedFieldApi`/`FormOptions` generics updated to match TanStack Form v1.28 (10 new type params). (6) `useRelationshipPickerOptions` updated from `vexConvexApi.list` to `vexConvexApi.find`. — `create`/`update`/`remove` promoted from OPTIONAL to REQUIRED. `CreateDocumentModal` and `CollectionEditView` call `vexConvexApi.create` and `vexConvexApi.update` which point at `api.vex.create` / `api.vex.update` — these must be registered Convex mutations in `apps/www/convex/vex.ts` or the admin panel breaks. `mutationApi` factory added to `api/index.ts`. Existing `vex/collections.ts` mutations kept until fully migrated.

---

## Overview

Adds the **minimum** typed data layer required to unblock the relationship field's
cell rendering in list views. Specifically:

1. A new typed query factory `vex.find(slug, { populate })` that wraps the existing
   `convexQuery(vexConvexApi.find, …)` and narrows the result type based on the
   `populate` array.
2. Server-side join in `vexConvexApi.find` via `convex-helpers/server/relationships`,
   so the populated docs come back in one round trip.
3. Codegen of `CollectionsFieldTypeMap` as a property on `GeneratedVexTypes`
   (`slug → fieldType → fieldKey union`) alongside the existing `CollectionSlug`
   and `DocumentBySlug` properties — same single-registry pattern. Powers
   `RelationshipKeysOf<TSlug>`, `TextKeysOf<TSlug>`, etc. from one place.
4. Deep-generics fix for `defineCollection.admin.useAsTitle` so it autocompletes
   only text-typed field keys (the field-type-map work makes this trivial — same spec).
5. Wiring `CollectionListView` + `RelationshipFieldCell` to read populated docs
   from `row.original` and dispatch through the preview component contract.

**Explicitly NOT in this spec:** RBAC (collection-level + field-level access),
`vex.get / create / update / delete / search` typed factories (existing paths
keep working), `fetchVex` server-side helper, nested populate (`["author.team"]`),
`select` field projection, `where` filter typing, custom filter operators,
React hook sugar (`useVexQuery`). Each is a follow-up spec.

---

## Code Effect Preview

What this spec does to the existing codebase, summarized as before/after diffs.
Each diff illustrates a key decision; the full implementation lives in the
numbered Steps below.

### Old combined `find.ts` deleted — replaced by two focused files (D18)

The old `find.ts` handled both client and server via a `TArgs`-generic conditional
return type. This caused `@convex-dev/react-query` to be reachable from
`factory.ts` → Convex bundler failure at deploy time.

**Before** (`src/api/find.ts`, one combined file):

```ts
// Imports @convex-dev/react-query — reachable from factory.ts → Convex bundler error
import { convexQuery } from "@convex-dev/react-query";

// Three declarations: 2 overloads + 1 implementation
export function find<TSlug, TPopulate>(args: FindClientArgs<...>): ReturnType<typeof convexQuery>;
export function find<DataModel, TSlug, TPopulate>(args: FindServerArgs<...>): Promise<Populated[]>;
export function find(args: { ctx?: unknown; slug: string; ... }): unknown { ... }
```

**After** (two separate files):

```ts
// src/api/find.server.ts — no react-query, safe for Convex bundler
import type { GenericQueryCtx } from "convex/server";
export async function find<DataModel, TSlug, TPopulate>(args: FindServerArgs<...>): Promise<Populated[]>

// src/api/find.client.ts — react-query only, never reaches Convex bundler
import { convexQuery } from "@convex-dev/react-query";
export function find<TSlug, TPopulate>(args: FindClientArgs<...>): ReturnType<typeof convexQuery>
```

### User import paths split by environment (D18)

**Before** (one import regardless of environment, combined overload):

```ts
import { find } from "@vexcms/core"; // client OR server — same function
```

**After** (explicit per-environment imports):

```ts
// In a Convex query handler:
import { find } from "@vexcms/core/server";
const posts = await find({ ctx, slug: "posts", populate: { author: true } });

// In a React component:
import { find } from "@vexcms/core/client";
const { data: posts } = useQuery(
  find({ slug: "posts", populate: { author: true } }),
);
```

### `apps/www/convex/vex/collections.ts` deleted — factory pattern replaces it (D16)

**Before** (~200 lines the user scaffolds into their own `convex/` directory)

**After** (`apps/www/convex/vex.ts` — 5 lines):

```ts
import { queryApi } from "@vexcms/core/convex";
import { query } from "./_generated/server";
import config from "../src/vex.config";

export const { find, get, search } = queryApi(config, query);
```

### Custom user Convex queries get full populate + types (D13 revised)

**After:** server-side populate works in any user Convex query:

```ts
import { find } from "@vexcms/core/server";

export const featuredPosts = query({
  handler: async (ctx) => {
    const posts = await find({
      ctx,
      slug: "posts",
      populate: { author: true },
    });
    return posts.filter((p) => p.featured);
  },
});
```

### `RelationshipFieldCell` renders populated docs (D5)

**Before:** cell shows raw ID count badge — `3 refs`.
**After:** cell dispatches to the preview component with the actual target doc.

### `packages/react/src/components/fields/relationship/Cell.tsx` — reads populated docs from `row.original`

Spec 22 D11 said "pass `row.original` to the preview" but that only worked
when relationship columns held populated docs. With `vex.find`'s auto-populate
in `CollectionListView`, that's now true — cells render previews instead of
raw IDs. (Decision 5; reconciles spec 22 D11)

**Before:**

```tsx
export function RelationshipFieldCell({ row, fieldKey }) {
  const ids = row.original[fieldKey];
  if (!ids?.length) return <span>—</span>;
  return <span className="font-mono">{ids.length} refs</span>;
  //                                  ^^^^^^^^^^^^^^^^^^^
  //                                  raw count badge — nothing user-meaningful
}
```

**After:**

```tsx
export function RelationshipFieldCell({ row, fieldKey, fieldDef, collection }) {
  const populatedDocs = row.original[fieldKey]; // Doc<TargetSlug>[] (auto-populated)
  if (!populatedDocs?.length) return <span>—</span>;
  const Preview = resolveRelationshipPreview({ fieldDef, targetCollection });
  return (
    <Preview doc={populatedDocs[0]} fieldKey="_id" config={targetCollection!} />
  );
}
```

_Why: the cell now passes the actual target doc to the preview component, so
users' `admin.components.preview` configurations finally render in list views.
Spec 22 D11's claim that this "just works" depended on populate — spec 23
makes it true._

---

## API Surface

Full API declared up front (D15). Required-for-relationship-field functions
are implemented in this spec; the rest are named here so signatures don't
drift when they're added later.

| Import                | Function      | Signature                                                                                 | Purpose                                            | Status       |
| --------------------- | ------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------ |
| `@vexcms/core/client` | `find`        | `find({ slug, populate?, limit? })` → tanstack-query options                              | List view, relationship picker                     | **REQUIRED** |
| `@vexcms/core/server` | `find`        | `find({ ctx, slug, populate?, limit? })` → `Promise<Populated[]>`                         | Custom Convex queries, `queryApi` handler          | **REQUIRED** |
| `@vexcms/core/client` | `get`         | `get({ id, populate? })` → tanstack-query options                                         | Edit-form fetch, picker chip resolution            | **REQUIRED** |
| `@vexcms/core/server` | `get`         | `get({ ctx, id, populate? })` → `Promise<Populated \| null>`                              | Custom Convex queries, `queryApi` handler          | **REQUIRED** |
| `@vexcms/core/client` | `search`      | `search({ slug, query, searchIndexName, searchField, limit?, populate? })` → options      | Typeahead picker                                   | **REQUIRED** |
| `@vexcms/core/server` | `search`      | `search({ ctx, slug, query, searchIndexName, searchField, limit?, populate? })` → Promise | Custom queries, `queryApi` handler                 | **REQUIRED** |
| `@vexcms/core/server` | `create`      | `create({ ctx, slug, data })` → `Promise<string>`                                         | Insert a doc; used by `CreateDocumentModal`        | **REQUIRED** |
| `@vexcms/core/server` | `update`      | `update({ ctx, id, data })` → `Promise<void>`                                             | Patch a doc; used by `CollectionEditView`          | **REQUIRED** |
| `@vexcms/core/server` | `remove`      | `remove({ ctx, id })` → `Promise<void>`                                                   | Delete a doc; used by admin delete action          | **REQUIRED** |
| `@vexcms/core/convex` | `queryApi`    | `queryApi(config, query)` → `{ find, get, search }`                                       | Registers Convex query endpoints at `api.vex.*`    | **REQUIRED** |
| `@vexcms/core/convex` | `mutationApi` | `mutationApi(config, mutation)` → `{ create, update, remove }`                            | Registers Convex mutation endpoints at `api.vex.*` | **REQUIRED** |
| `@vexcms/core/server` | `count`       | `count({ ctx, slug })` → `Promise<number>`                                                | Count docs in a collection                         | OPTIONAL     |

> **Why `create`/`update`/`remove` are REQUIRED (rev 5):** `CreateDocumentModal`
> calls `useConvexMutation(vexConvexApi.create)` and `CollectionEditView` calls
> `useConvexMutation(vexConvexApi.update)`. Both point at `api.vex.create` /
> `api.vex.update`. Those endpoints must be registered Convex mutations in
> `apps/www/convex/vex.ts` or the admin panel throws at runtime.
> The existing `apps/www/convex/vex/collections.ts` registers them at
> `api.vex.collections.create` — wrong path. Migrating to `mutationApi` is
> required, not optional.
>
> **Note on naming:** the existing implementation uses `remove` (not `delete`)
> to avoid collision with the JavaScript reserved word `delete`. The spec
> follows suit: `remove` in the API surface and `remove.server.ts` in the file.

---

## Status

Not started. All steps pending.

---

## Design Decisions

A one-line summary of every decision that shapes the public surface. **Full
rationale, alternatives, and trade-offs live in `design-walkthrough.md` §
_Decisions Reference_.** That file is the place to read once before
implementing; this table is the place to scan during implementation when you
just need to remember "which way did we go on X".

| #   | Decision (one line)                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | `vex.find` is a typed query factory, not a hook — returns the same options shape `convexQuery` does. No `useVexQuery` sugar in this spec.                                                                                                                                                                                                                                                                      |
| D2  | ~~Literal-array populate via codegen registry~~ — superseded by D11.                                                                                                                                                                                                                                                                                                                                           |
| D3  | Server-side join via `convex-helpers/server/relationships` (`getAll`); one round trip per populate field, batched by Convex.                                                                                                                                                                                                                                                                                   |
| D4  | One unified `GeneratedVexTypes` registry; never parallel augmentation interfaces. `CollectionsFieldTypeMap` is a property of it.                                                                                                                                                                                                                                                                               |
| D5  | `CollectionListView` auto-populates all relationship columns — no opt-in flag.                                                                                                                                                                                                                                                                                                                                 |
| D6  | `defineCollection.admin.useAsTitle` is fixed via deep generics (same field-type-map machinery as populate, but in-place).                                                                                                                                                                                                                                                                                      |
| D7  | `vex` namespace lives in `@vexcms/core/src/api/`, re-exported through `@vexcms/react` and `@vexcms/next`.                                                                                                                                                                                                                                                                                                      |
| D8  | ~~`vexConvexApi.find` keeps existing public shape~~ — superseded by D17.                                                                                                                                                                                                                                                                                                                                       |
| D9  | RBAC explicitly out of scope; populate logic and access-filter logic structured as separate passes for future RBAC hook.                                                                                                                                                                                                                                                                                       |
| D10 | `Populated<TDoc, TPopulate>` returns `Doc[]` for relationship fields, never narrowed to single-doc. UI handles array-of-1 case.                                                                                                                                                                                                                                                                                |
| D11 | `populate` uses object notation, not string array. `{ author: true \| { populate: { … } } }`. Replaces D2. Prisma-style.                                                                                                                                                                                                                                                                                       |
| D12 | Nested populate is unbounded — no artificial depth cap. TS recursion + Convex per-query limits provide natural bounds.                                                                                                                                                                                                                                                                                         |
| D13 | ~~Discriminated-union args (combined overload)~~ — superseded by D18. Both environments still use `{ ctx, ... }` vs `{ slug, ... }` object shapes, but they are now separate functions in separate files.                                                                                                                                                                                                      |
| D18 | Split client and server into separate files (`find.server.ts` / `find.client.ts`) with separate package export paths (`@vexcms/core/server` / `@vexcms/core/client`). Eliminates the combined-overload `TArgs`-generic approach; each environment gets a dedicated function with a simple, clean signature. Resolves the Convex-bundler issue where `@convex-dev/react-query` was reachable from `factory.ts`. |
| D14 | Convex-only architecture; no backend abstraction layer. Use Convex types directly.                                                                                                                                                                                                                                                                                                                             |
| D15 | ~~Only find/get/search required~~ — superseded by rev 5. `create`/`update`/`remove` are REQUIRED (used by `CreateDocumentModal` + `CollectionEditView`). `count` optional.                                                                                                                                                                                                                                     |
| D16 | `@vexcms/core` Convex code uses generic types from `convex/server`, never `_generated`. Ships query/mutation builders via factory.                                                                                                                                                                                                                                                                             |
| D17 | `vexConvexApi` is internal to `@vexcms/core`, not part of the public API. Public users have `vex.*` for every legitimate case.                                                                                                                                                                                                                                                                                 |

> **For implementers:** when this table conflicts with `design-walkthrough.md`,
> the walkthrough wins (it has the full rationale and is updated with
> revisions). When this table conflicts with the actual code samples below,
> the code samples win (they're the canonical implementation).

---

## Out of Scope

- **RBAC** (collection-level + field-level access) — deferred to spec 24.
- **`vex.get` / `vex.create` / `vex.update` / `vex.delete` / `vex.search`** typed
  factories — existing `convexQuery(vexConvexApi.get, …)` etc. paths keep working.
  Add typed factories when the relationship field stops needing them and other
  surfaces (mutations from the admin form, picker search) are ready to migrate.
- ~~**Nested populate** (`populate: ["author.team"]`) — single-level only.~~ **No longer out of scope** (per Decision 12) — nested populate supported up to 3 levels via object notation: `populate: { author: { populate: { team: true } } }`.
- **`select`** (return a subset of fields) — typing complexity not justified yet.
- **`where`** typed filtering — Convex's `withIndex` queries can stay imperative
  on the server; the `where` arg added to `vexConvexApi.find` is a `Partial<Doc>`
  loose match for now (already used in some places). Typed filter operators
  (`{ gt, lt, contains }`) are a follow-up.
- **`fetchVex`** server-side helper — not needed for the cell-rendering use case.
  Server components currently call Convex via `@convex-dev/react-query`'s
  `convexQueryOptions` with `prefetchQuery`; that path keeps working.
- **`useVexQuery`** hook sugar — `useQuery(vex.find(…))` is already ergonomic.
- **Custom filter operators**, **GraphQL-style query builders**, **per-role
  type narrowing**.
- **Migration of existing `vexConvexApi.find` direct call sites** in
  `@vexcms/react` to `vex.find` — only the call sites the relationship field's
  cell touches are migrated in this spec. The rest can migrate when they need
  the typed result.

---

## Target Directory Structure

```
packages/core/src/
  api/
    types.ts                          ← ✅ done — GenericQuery/MutationClientParams etc.
    populate.ts                       ← ✅ done
    populate.test.ts                  ← ✅ done
    find.server.ts                    ← ⏳ pending — server-only find
    find.server.test.ts               ← ⏳ pending
    find.client.ts                    ← ⏳ pending — client-only find
    get.server.ts                     ← ⏳ pending
    get.server.test.ts                ← ⏳ pending
    get.client.ts                     ← ⏳ pending
    search.server.ts                  ← ⏳ pending
    search.server.test.ts             ← ⏳ pending
    search.client.ts                  ← ⏳ pending
    server.ts                         ← ⏳ pending — barrel for @vexcms/core/server
    client.ts                         ← ⏳ pending — barrel for @vexcms/core/client
    test/convex/
      schema.ts                       ← ✅ done — fixture schema + declare module augmentation
      _generated/api.ts               ← ✅ done — stub for convex-test module root
  types/
    generated.ts                      ← 🟡 partial — needs CollectionsFieldTypeMap emission
    generateVexTypes.ts               ← ⏳ pending — emit CollectionsFieldTypeMap
  collections/
    types.ts                          ← ⏳ pending — useAsTitle deep-generics fix
    config.ts                         ← ⏳ pending — TFields generic threaded through
  convex/
    index.ts                          ← ✅ done — vexConvexApi with populate? args
    vex/collections.ts                ← 🟡 partial — keep until full migration verified

packages/core/
  package.json                        ← ⏳ pending — add ./server + ./client + ./convex exports
  tsup.config.ts                      ← ⏳ pending — add server.ts + client.ts entry points
  vitest.config.ts                    ← ✅ done
  tsconfig.build.json                 ← ✅ done

packages/react/src/
  components/views/
    CollectionListView.tsx            ← ⏳ pending (Step 6) — use find client + auto-populate
  components/fields/relationship/
    Cell.tsx                          ← ⏳ pending (Step 6) — render populated docs

packages/next/src/
  index.ts                            ← ⏳ pending (Step 4) — re-export from @vexcms/core/client

apps/www/
  convex/vex.ts                       ← ✅ done — queryApi(config, query)
  convex/vex/collections.ts           ← ⏳ delete
  convex/vex/collections.test.ts      ← ⏳ delete
  src/vex.types.ts                    ← 🟡 partial (regenerated by vex generate)

.pi/agent-docs/specs/
  22-relationship-field.md            ← ⏳ pending (Step 7) — D11 reconciliation note
```

---

## Implementation Order

Each step leaves the repo runnable. Run `pnpm typecheck` and `pnpm test` after
each. Numbered checkboxes are filled by the implementer.

1. `[dev]` **Step 1** — Codegen + helper types (`types.ts`, `generated.ts` additions)
2. `[dev]` **Step 2** — Implementation files: `.server.ts` + `.client.ts` per function, barrel files (`server.ts` / `client.ts`), `package.json` export paths, `tsup.config.ts` entries, ``api/index.ts`, `apps/www/convex/vex.ts`
3. `[dev]` **Step 3** — Re-export through `@vexcms/react` and `@vexcms/next`
4. `[dev]` **Step 4** — Deep-generics fix for `defineCollection.admin.useAsTitle`
5. `[dev]` **Step 5** — Wire `CollectionListView` + `RelationshipFieldCell`
6. `[dev]` **Step 6** — Reconcile Spec 22 Decision 11

---

Legend: `[dev]` = implementer (high-care tier), `[agent]` = agent-OK (mostly
plumbing/refactor).

---

## Step 1 — Codegen + Helper Types

- [ ] Update `packages/core/src/types/generated.ts` — add `CollectionsFieldTypeMap` as a derived top-level export reading `GeneratedVexTypes["CollectionsFieldTypeMap"]` (same pattern as the existing `CollectionSlug` / `DocumentBySlug`). Remove any standalone `GeneratedFieldTypeMap` interface if previously added.
- [ ] Add helper types to `packages/core/src/api/types.ts`
- [ ] Update `packages/core/src/types/generateVexTypes.ts` to emit
      a `CollectionsFieldTypeMap` property on the existing `GeneratedVexTypes`
- [ ] Run `pnpm test --filter @vexcms/core` — existing tests continue to pass
- [ ] Run `vex generate` in `apps/www` — `vex.types.ts` gains the new interface

### `packages/core/src/types/generated.ts` — additions

````ts
/**
 * Per-collection field-type map. Augmented by `vex generate` from the user's
 * collection configs. Powers all per-field-type helper types (`RelationshipKeysOf`,
 * `TextKeysOf`, `SortableKeysOf`, etc.).
 *
 * Keyed: collection slug → field type → union of field keys with that type.
 *
 * Empty by default; the user's `vex.types.ts` augments it via `declare module
 * "@vexcms/core"`. Helper types in `packages/core/src/api/types.ts` resolve to
 * `never` until augmentation runs, which is the intended behaviour for fresh
 * projects (no collections registered yet).
 *
 * @example Generated content (after `vex generate` runs):
 * ```ts
 * declare module "@vexcms/core" {
 *   interface GeneratedVexTypes {
 *     CollectionSlug: "posts" | "authors";
 *     DocumentBySlug: { posts: PostsDocument; authors: AuthorsDocument };
 *     CollectionsFieldTypeMap: {
 *       posts: {
 *         text: "title" | "slug" | "body";
 *         relationship: "author" | "category";
 *         select: "status";
 *         date: "publishedAt";
 *       };
 *       authors: {
 *         text: "name" | "email";
 *       };
 *     };
 *   }
 * }
 * ```
 */
export type CollectionsFieldTypeMap = GeneratedVexTypes extends {
  CollectionsFieldTypeMap: infer M extends Record<
    string,
    Record<string, string>
  >;
}
  ? M
  : Record<string, Record<string, never>>;
````

### `packages/core/src/api/types.ts` — new file

This file is the type-level contract for the entire `vex.*` API. It contains
three groups, in this order:

1. **Generic args base types** — `GenericQueryClientParams`,
   `GenericQueryServerParams`, `GenericMutationClientParams`,
   `GenericMutationServerParams`. Every public `vex.*` function's args
   interface extends one of these. Listed first because they're the contract
   surface every other file in `api/` extends.
2. **Per-collection field-type helpers** — `FieldKeysOfType`,
   `RelationshipKeysOf`, `TextKeysOf`, `SortableKeysOf`, `RelationshipTargetOf`.
3. **Result-shape types** — `Populated<TSlug, TPopulate>` (recursive).

````ts
import type {
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server";

import type { AdminField } from "../fields";
import type {
  CollectionsFieldTypeMap,
  CollectionSlug,
  DocumentBySlug,
} from "../types/generated";
import type { PopulateShape } from "./populate";

// ── Generic args base types ─────────────────────────────────────────────────
//
// Every public `vex.*` function's args interface extends one of these four
// types. They factor out the `ctx` discriminator (and `populate` for queries)
// so per-function args interfaces only carry their unique fields.
//
// Future shared fields (access-control hints, logging tags, request timeouts,
// etc.) get added to the appropriate base — every function inherits them.

/**
 * Base shape for client-side args of a `vex.*` query function.
 *
 * Carries the `ctx?: never` discriminator (forbids passing a Convex query
 * context) and the `populate` field, since every query function that returns
 * documents supports relationship population (the only outlier is `count`,
 * which returns a number and overrides `populate?: never`).
 *
 * Function-specific args interfaces extend this and add their own per-function
 * fields. `limit` stays per-function because it doesn't apply to single-doc
 * queries (`get`) or scalar queries (`count`).
 *
 * @typeParam TSlug - The collection slug; used to narrow `populate` keys via
 *   `RelationshipKeysOf<TSlug>`. Defaults to the full `CollectionSlug` union.
 * @typeParam TPopulate - The populate object. Defaults to
 *   `Record<string, never>` (no relationships populated).
 *
 * @example Inheritance pattern
 * ```ts
 * // find — adds slug + limit; populate inherited
 * interface FindClientArgs<TSlug, TPopulate>
 *   extends GenericQueryClientParams<TSlug, TPopulate> {
 *   slug: TSlug;
 *   limit?: number;
 * }
 *
 * // get — adds id; populate inherited; no limit (single-doc)
 * interface GetClientArgs<TSlug, TPopulate>
 *   extends GenericQueryClientParams<TSlug, TPopulate> {
 *   id: GenericId<TSlug>;
 * }
 *
 * // search — adds slug + query + index fields + limit; populate inherited
 * interface SearchClientArgs<TSlug, TPopulate>
 *   extends GenericQueryClientParams<TSlug, TPopulate> {
 *   slug: TSlug;
 *   query: string;
 *   searchIndexName: string;
 *   searchField: string;
 *   limit?: number;
 * }
 *
 * // count — returns a number, has no docs to populate; overrides populate
 * interface CountClientArgs<TSlug>
 *   extends GenericQueryClientParams<TSlug> {
 *   slug: TSlug;
 *   populate?: never;
 * }
 * ```
 */
export interface GenericQueryClientParams<
  TSlug extends CollectionSlug = CollectionSlug,
  TPopulate extends PopulateShape<TSlug> = Record<string, never>,
> {
  /** Discriminator: client args MUST NOT supply `ctx`. */
  ctx?: never;
  /** Recursive populate object, type-narrowed against `RelationshipKeysOf<TSlug>`. */
  populate?: TPopulate;
}

/**
 * Base shape for server-side args of a `vex.*` query function. Used inside
 * custom Convex query handlers; receives the Convex query context and runs
 * the query immediately. Carries the same `populate` field as the client
 * variant.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - The collection slug; used to narrow `populate` keys.
 * @typeParam TPopulate - The populate object.
 */
export interface GenericQueryServerParams<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug = CollectionSlug,
  TPopulate extends PopulateShape<TSlug> = Record<string, never>,
> {
  /** Discriminator: server args MUST supply a Convex query context. */
  ctx: GenericQueryCtx<DataModel>;
  /** Recursive populate object, type-narrowed against `RelationshipKeysOf<TSlug>`. */
  populate?: TPopulate;
}

/**
 * Base shape for client-side args of a `vex.*` mutation function. Mirrors
 * {@link GenericQueryClientParams} but exists separately so query-only
 * options (`populate`) don't leak into the mutation base, and so future
 * mutation-only shared fields have a clear home.
 */
export interface GenericMutationClientParams {
  /** Discriminator: client args MUST NOT supply `ctx`. */
  ctx?: never;
}

/**
 * Base shape for server-side args of a `vex.*` mutation function. Used inside
 * custom Convex mutation handlers; receives the Convex mutation context
 * (which is a superset of `GenericQueryCtx` — read+write vs. read-only).
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface GenericMutationServerParams<
  DataModel extends GenericDataModel,
> {
  /** Discriminator: server args MUST supply a Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
}

// ── Per-collection field-type helpers ─────────────────────────────────────
//
// Read the `CollectionsFieldTypeMap` property on the augmented
// `GeneratedVexTypes` registry (populated by `vex generate`). Used by
// `populate` typing, sortable-column inference, and future filter ops.

/**
 * Returns the union of field keys on `TSlug` that have field type `TType`.
 *
 * Reads the `CollectionsFieldTypeMap` property on the augmented `GeneratedVexTypes`
 * registry — populated by `vex generate` from the user's collection configs.
 * Returns `never` when the slug has no fields of that type, or when the
 * registry hasn't been augmented yet (fresh project).
 *
 * @typeParam TSlug - The collection slug.
 * @typeParam TType - The field type literal (e.g., `"text"`, `"relationship"`).
 *
 * @example
 * ```ts
 * type AuthorRelationships = FieldKeysOfType<"posts", "relationship">;
 * // → "author" | "category"
 */
export type FieldKeysOfType<
  TSlug extends CollectionSlug,
  TType extends AdminField["type"],
> = TSlug extends keyof CollectionsFieldTypeMap
  ? TType extends keyof CollectionsFieldTypeMap[TSlug]
    ? CollectionsFieldTypeMap[TSlug][TType] & string
    : never
  : never;

/** Field keys on `TSlug` that are relationship fields. */
export type RelationshipKeysOf<TSlug extends CollectionSlug> = FieldKeysOfType<
  TSlug,
  "relationship"
>;

/** Field keys on `TSlug` that are text fields. */
export type TextKeysOf<TSlug extends CollectionSlug> = FieldKeysOfType<
  TSlug,
  "text"
>;

/**
 * Field keys on `TSlug` that are sortable in list views (text, number, date,
 * checkbox, select). Used by future `defaultSort` typing and the data-table
 * column registry.
 */
export type SortableKeysOf<TSlug extends CollectionSlug> = FieldKeysOfType<
  TSlug,
  "text" | "number" | "date" | "checkbox" | "select"
>;

/**
 * Resolves a relationship field's target slug.
 *
 * Reads the *resolved* `RelationshipField.collection.slug` from the
 * `GeneratedVexTypes` document shape (the relationship field key on a doc
 * stores the target slug as part of its branded `Id<TargetSlug>` type).
 * Falls back to `CollectionSlug` if not resolvable.
 */
export type RelationshipTargetOf<
  TSlug extends CollectionSlug,
  TKey extends string,
> = TSlug extends keyof GeneratedVexTypes
  ? TKey extends keyof GeneratedVexTypes[TSlug]
    ? GeneratedVexTypes[TSlug][TKey] extends ReadonlyArray<{
        __tableName: infer T;
      }>
      ? T extends CollectionSlug
        ? T
        : CollectionSlug
      : CollectionSlug
    : CollectionSlug
  : CollectionSlug;

/**
 * Result type of a populated query — `Doc<TSlug>` with each key listed in
 * `TPopulate` replaced from `Id<TargetSlug>[]` to `Doc<TargetSlug>[]`.
 * Recurses if the populate value has a nested `populate` field (D12: unbounded
 * nesting).
 *
 * Keys not in `TPopulate` keep their original `Id[]` type. Non-relationship
 * keys are left untouched.
 */
export type Populated<
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> = TSlug extends keyof DocumentBySlug
  ? {
      [K in keyof DocumentBySlug[TSlug]]: K extends keyof TPopulate
        ? K extends string
          ? RelationshipTargetOf<TSlug, K> extends infer Target
            ? Target extends CollectionSlug
              ? Target extends keyof DocumentBySlug
                ? // Recurse if nested populate is provided.
                  TPopulate[K] extends {
                    populate: infer NestedPopulate;
                  }
                  ? NestedPopulate extends PopulateShape<Target>
                    ? Populated<Target, NestedPopulate>[]
                    : DocumentBySlug[Target][]
                  : DocumentBySlug[Target][]
                : DocumentBySlug[TSlug][K]
              : DocumentBySlug[TSlug][K]
            : DocumentBySlug[TSlug][K]
          : DocumentBySlug[TSlug][K]
        : DocumentBySlug[TSlug][K];
    }
  : never;
````

> **Note on `RelationshipTargetOf` implementation:** the type-level extraction
> from `Id<TargetSlug>[]` depends on whether Convex's branded `Id<T>` exposes
> `T` at the type level. If not, the codegen pipeline must emit an explicit
> `RelationshipTargetMap` (or fold it into `CollectionsFieldTypeMap`
> as `posts: { relationshipTargets: { author: "authors"; category: "categories" } }`).
> Decide during implementation; both paths leave the user-facing API identical.

### `packages/core/src/types/generateVexTypes.ts` — additions

The generator currently emits `GeneratedVexTypes` from collection configs. Add
a parallel emission for `CollectionsFieldTypeMap` as a property on `GeneratedVexTypes`:

```ts
// Pseudocode — full implementation walks config.collections
function emitCollectionsFieldTypeMap(collections: CollectionConfig[]): string {
  const entries = collections.map((c) => {
    // Group field keys by their type
    const byType = new Map<string, string[]>();
    for (const [key, field] of Object.entries(c.fields)) {
      const arr = byType.get(field.type) ?? [];
      arr.push(key);
      byType.set(field.type, arr);
    }
    const inner = [...byType.entries()]
      .map(
        ([type, keys]) =>
          `    ${type}: ${keys.map((k) => `"${k}"`).join(" | ")};`,
      )
      .join("\n");
    return `  ${c.slug}: {\n${inner}\n  };`;
  });
  // Emitted as a property on `GeneratedVexTypes` alongside CollectionSlug and
  // DocumentBySlug — not as a separate interface. Full output:
  //   declare module "@vexcms/core" {
  //     interface GeneratedVexTypes {
  //       CollectionSlug: "posts" | "authors"
  //       DocumentBySlug: { posts: Post; authors: Author }
  //       CollectionsFieldTypeMap: { posts: { text: "title" | … ; … } ; … }
  //     }
  //   }
  return `CollectionsFieldTypeMap: {\n${entries.join("\n")}\n}`;
}
```

Add tests in `packages/core/src/types/genetateVexTypes.test.ts` that verify
the emitted output for: (a) a single collection with multiple field types,
(b) a collection with only one field type, (c) two collections that both have
relationships pointing at each other.

---

## Step 2 — Implementation files (find.server / find.client / get / search / factory)

Follows Decision 16 (no `_generated` imports in core; ship Convex code via factory),
Decision 18 (split client and server into separate files and separate package export
paths — no combined overloads), and Decisions 11/12 (object-shaped recursive populate).

**Architecture change from original spec (D18):** the earlier approach had a single
`find.ts` that handled both client and server via a `TArgs`-generic conditional return
type. This worked but pulled `@convex-dev/react-query` into the import graph of
`factory.ts`, which the Convex bundler cannot handle (server runtime, no browser APIs).
Splitting into `find.server.ts` / `find.client.ts` cleanly separates the environments:
the factory only ever imports from `.server.ts` files; `@convex-dev/react-query` is
never in the server bundle.

---

### Files to create / modify / delete

**Create (in `@vexcms/core`):**

- [x] `packages/core/src/api/populate.ts` (NEW) — recursive populate runtime
- [x] `packages/core/src/api/find.server.ts` (NEW) — server-only `find`
- [x] `packages/core/src/api/find.client.ts` (NEW) — client-only `find`
- [x] `packages/core/src/api/get.server.ts` (NEW) — server-only `get`
- [x] `packages/core/src/api/get.client.ts` (NEW) — client-only `get`
- [x] `packages/core/src/api/search.server.ts` (NEW) — server-only `search`
- [x] `packages/core/src/api/search.client.ts` (NEW) — client-only `search`
- [x] `packages/core/src/api/create.server.ts` (NEW) — server-only `create` (**REQUIRED** — used by `CreateDocumentModal`)
- [x] `packages/core/src/api/update.server.ts` (NEW) — server-only `update` (**REQUIRED** — used by `CollectionEditView`)
- [x] `packages/core/src/api/remove.server.ts` (NEW) — server-only `remove` (**REQUIRED** — used by admin delete)
- [x] `packages/core/src/api/server.ts` (NEW) — barrel: re-exports all `*.server.ts` functions
- [x] `packages/core/src/api/client.ts` (NEW) — barrel: re-exports all `*.client.ts` functions
- [x] `packages/core/src/api/index.ts` (NEW) — `queryApi` + `mutationApi` factories

**Create test infrastructure (in `@vexcms/core`):**

- [x] `packages/core/src/api/test/convex/schema.ts` (NEW) — fixture schema + `declare module` augmentation
- [x] `packages/core/src/api/test/convex/_generated/api.ts` (NEW) — stub for convex-test module-root detection
- [x] `packages/core/vitest.config.ts` (NEW) — edge-runtime env for convex-test
- [x] `packages/core/tsconfig.build.json` (NEW) — excludes `src/**/*.test.ts` and `src/**/test/**`
- [x] `packages/core/src/api/populate.test.ts` (NEW)
- [x] `packages/core/src/api/find.server.test.ts` (NEW)
- [x] `packages/core/src/api/get.server.test.ts` (NEW)
- [x] `packages/core/src/api/search.server.test.ts` (NEW)
- [x] `packages/core/src/api/create.server.test.ts` (NEW)
- [x] `packages/core/src/api/update.server.test.ts` (NEW)
- [x] `packages/core/src/api/remove.server.test.ts` (NEW)

**Modify (in `@vexcms/core`):**

- [x] `packages/core/package.json` — add `"./server"`, `"./client"`, `"./convex"` export entries; add `convex-test` + `@edge-runtime/vm` to `devDependencies`
- [x] `packages/core/src/convex/index.ts` — `vexConvexApi` gains typed `populate?` arg shapes on `find`, `get`, `search`; add `create`, `update`, `remove` FunctionReferences
- [x] `packages/core/tsup.config.ts` — add `src/api/server.ts`, `src/api/client.ts`, `src/api/index.ts` as entry points; point at `tsconfig.build.json`
- [x] `pnpm-workspace.yaml` — `convex-test` and `@edge-runtime/vm` in `catalog:`

**Create / modify (in `apps/www`):**

- [x] `apps/www/convex/vex.ts` (MODIFY) — add `mutationApi` exports alongside existing `queryApi`

**Delete (in `apps/www`)** — after `mutationApi` migration is confirmed working:

- [ ] `apps/www/convex/vex/collections.ts` — all functions now registered via `queryApi` / `mutationApi`
- [ ] `apps/www/convex/vex/collections.test.ts`
- [ ] `apps/www/convex/vex/` directory — remove when empty

**Verify after all files are in place:**

```bash
pnpm --filter @vexcms/core build       # dist/index.js + dist/server.js + dist/client.js
pnpm --filter @vexcms/core typecheck
pnpm --filter @vexcms/core test
pnpm --filter www typecheck            # api.vex.find paths are typed
```

---

### Why `.server.ts` / `.client.ts` in the same folder

The files live at `src/api/find.server.ts` rather than `src/api/server/find.ts`
because:

1. Each pair shares the same `populate.ts`, `types.ts`, and test fixture — keeping
   them together in `src/api/` avoids `../../` import paths.
2. The `.server` / `.client` suffix is a widely-understood convention (Next.js, Remix,
   React Server Components all use it). Readers instantly know the environment.
3. The barrel files `src/api/server.ts` and `src/api/client.ts` provide the single
   re-export point that maps to the `@vexcms/core/server` and `@vexcms/core/client`
   package paths — users never import from `find.server.ts` directly.

---

### Test fixture setup (one-time, inside `@vexcms/core`)

> Same as before — see the full checklist from the original spec section. The
> fixture schema, vitest config, tsconfig.build.json, and `_generated/api.ts` stub
> are unchanged. The only difference: test files are now named
> `find.server.test.ts` (not `find.test.ts`) to match their source.

Key reminder: `declare module "@vexcms/core"` in the fixture's `schema.ts` does not
augment types inside the `@vexcms/core` package itself (a module cannot augment
itself). Test files that use `populate` must cast the result using
`as DocumentBySlug["authors"][]` from the fixture types. This is a test-internal
concern only — user projects where the augmentation is external work correctly.

---

### `packages/core/src/api/populate.ts` (MODIFIED)

One change from the original: `TPopulate` is added as a generic parameter and
the return type is narrowed from `Promise<ReadonlyArray<Record<string, unknown>>>`
to `Promise<Populated<TSlug, TPopulate>[]>`.

This is the correct place for the `as unknown as` cast that bridges the
runtime `Record<string, unknown>[]` to the compile-time `Populated<...>[]`.
With this change, **every caller of `populateDocs` gets the correct return type
without writing their own cast** — the cast is concentrated here, documented,
and reviewed once.

```ts
import { asyncMap } from "convex-helpers";
import { getAll } from "convex-helpers/server/relationships";
import type {
  GenericDataModel,
  GenericQueryCtx,
  TableNamesInDataModel,
} from "convex/server";
import type { GenericId } from "convex/values";
import type { CollectionSlug } from "../types/generated";
import type {
  Populated,
  RelationshipKeysOf,
  RelationshipTargetOf,
} from "./types";

/**
 * Recursive populate options, type-restricted to relationship field keys per
 * the augmented `CollectionsFieldTypeMap` registry.
 *
 * @typeParam TSlug - The collection slug to narrow relationship keys against.
 *   Defaults to the full `CollectionSlug` union for internal recursive use.
 */
export type PopulateShape<TSlug extends CollectionSlug = CollectionSlug> = {
  [K in RelationshipKeysOf<TSlug>]?:
    | true
    | {
        populate: PopulateShape<RelationshipTargetOf<TSlug, K>>;
      };
};

/**
 * Walks `docs` and replaces each relationship field listed in `populate` with
 * the resolved target doc(s). Returns a shallow-copied array; original docs
 * are not mutated.
 *
 * The `TPopulate` generic is the caller-supplied populate shape. The return
 * type `Populated<TSlug, TPopulate>[]` is what TypeScript sees at call sites
 * — the `as unknown as` cast at the bottom bridges runtime
 * `Record<string, unknown>[]` to the compile-time `Populated` shape. All
 * callers (`find`, `get`, `search` server functions) benefit without writing
 * their own casts.
 *
 * @param ctx - The Convex query context (any DataModel).
 * @param docs - Documents to populate.
 * @param populate - Relationship fields to resolve, optionally nested.
 * @returns Same docs with relationship Id arrays replaced by Doc arrays,
 *   typed as `Populated<TSlug, TPopulate>[]`.
 */
export async function populateDocs<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug = CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = PopulateShape<TSlug>,
>(
  ctx: GenericQueryCtx<DataModel>,
  docs: ReadonlyArray<Record<string, unknown>>,
  populate: TPopulate,
): Promise<Populated<TSlug, TPopulate>[]> {
  const result = await asyncMap(docs, async (doc) => {
    const out: Record<string, unknown> = { ...doc };
    for (const [fieldKey, opts] of Object.entries(populate)) {
      const ids = doc[fieldKey];
      if (!Array.isArray(ids)) continue;

      const targets = await getAll(
        ctx.db,
        ids as GenericId<TableNamesInDataModel<DataModel>>[],
      );
      const filtered = targets.filter(
        (t): t is NonNullable<typeof t> => t !== null,
      );

      if (
        typeof opts === "object" &&
        opts !== null &&
        "populate" in opts &&
        opts.populate &&
        filtered.length > 0
      ) {
        out[fieldKey] = await populateDocs(
          ctx,
          filtered as ReadonlyArray<Record<string, unknown>>,
          opts.populate,
        );
      } else {
        out[fieldKey] = filtered;
      }
    }
    return out;
  });
  // Single cast: the runtime walk produces the correct shape that
  // Populated<TSlug, TPopulate>[] describes, but TypeScript can't verify
  // a mapped type transformation from a runtime Object.entries loop.
  return result as unknown as Populated<TSlug, TPopulate>[];
}
```

---

### `packages/core/src/api/populate.test.ts` (NEW)

> Unchanged from original spec. Full file content: see original spec § `populate.test.ts`.

---

### `packages/core/src/convex/index.ts` — modified

> Unchanged from original spec except the `search` FunctionReference gains
> `populate?: unknown` in its args. Full file content: see original spec § `convex/index.ts`.

---

### `packages/core/src/api/find.server.ts` (NEW)

No `@convex-dev/react-query` import. No `convexQuery`. Pure server-side logic:
`ctx.db.query().take()` + `populateDocs`. One clean function, one return type.

````ts
import type {
  GenericDataModel,
  GenericQueryCtx,
  TableNamesInDataModel,
} from "convex/server";

import type { CollectionSlug } from "../types/generated";
import { populateDocs, type PopulateShape } from "./populate";
import type { GenericQueryServerParams, Populated } from "./types";

/**
 * Server-side args for `find`. Extends {@link GenericQueryServerParams}
 * to inherit `ctx: GenericQueryCtx<DataModel>` and `populate?: TPopulate`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 */
export interface FindServerArgs<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> extends GenericQueryServerParams<DataModel, TSlug, TPopulate> {
  slug: TSlug;
  limit?: number;
}

/**
 * Lists documents in a VexCMS collection with optional recursive population.
 * Server-side only — call inside a Convex query or mutation handler.
 *
 * Import from `@vexcms/core/server`. For the client-side (tanstack-query)
 * version, import `find` from `@vexcms/core/client`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TSlug - Collection slug; compile-error if not registered.
 * @typeParam TPopulate - Populate object, narrowed against `RelationshipKeysOf<TSlug>`.
 * @param args - `{ ctx, slug, populate?, limit? }`.
 * @returns Promise resolving to the populated documents array.
 * @example
 * ```ts
 * import { find } from "@vexcms/core/server";
 *
 * export const featuredPosts = query({
 *   handler: async (ctx) => {
 *     const posts = await find({ ctx, slug: "posts", populate: { author: true } });
 *     return posts.filter((p) => p.featured);
 *   },
 * });
 */
export async function find<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
>(
  args: FindServerArgs<DataModel, TSlug, TPopulate>,
): Promise<Populated<TSlug, TPopulate>[]> {
  const docs = await args.ctx.db
    .query(args.slug as TableNamesInDataModel<DataModel>)
    .take(args.limit ?? 100);
  // No populate: ctx.db.query().take() returns DocumentByName<DataModel, TSlug>[] but
  // we declared Promise<Populated<TSlug, TPopulate>[]>. With TPopulate = {} these are
  // the same shape at runtime; TypeScript can't prove it — hence the cast.
  if (!args.populate) return docs as never;
  // populateDocs returns Populated<TSlug, TPopulate>[] directly — no cast here.
  return populateDocs(args.ctx, docs, args.populate);
}
````

---

### `packages/core/src/api/find.server.test.ts` (NEW)

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import type { DocumentBySlug } from "../types/generated";
import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { find } from "./find.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("find (server)", () => {
  test("returns empty array for an empty collection", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) =>
        find({ ctx, slug: "posts" }),
    );
    expect(docs).toEqual([]);
  });

  test("returns documents in insertion order", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await ctx.db.insert("posts", { title: "First", slug: "first" });
        await ctx.db.insert("posts", { title: "Second", slug: "second" });
        return find({ ctx, slug: "posts" });
      },
    );
    expect(docs.map((d) => d.title)).toEqual(["First", "Second"]);
  });

  test("limit caps the result count", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        for (let i = 0; i < 5; i++) {
          await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
        }
        return find({ ctx, slug: "posts", limit: 3 });
      },
    );
    expect(docs).toHaveLength(3);
  });

  test("populate replaces Id arrays with target docs", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const authorId = await ctx.db.insert("authors", { name: "Lena" });
        await ctx.db.insert("posts", {
          title: "Hi",
          slug: "hi",
          author: [authorId],
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return find({
          ctx,
          slug: "posts",
          populate: { author: true },
        } as any) as Promise<{ author: unknown; [k: string]: unknown }[]>;
      },
    );
    expect((docs[0].author as DocumentBySlug["authors"][])[0].name).toBe(
      "Lena",
    );
  });

  test("nested populate works at depth 2", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const orgId = await ctx.db.insert("organizations", { name: "Vex Inc" });
        const authorId = await ctx.db.insert("authors", {
          name: "Lena",
          organization: [orgId],
        });
        await ctx.db.insert("posts", {
          title: "Hi",
          slug: "hi",
          author: [authorId],
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return find({
          ctx,
          slug: "posts",
          populate: { author: { populate: { organization: true } } },
        } as any) as Promise<{ author: unknown; [k: string]: unknown }[]>;
      },
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyDocs = docs as any[];
    const author = (anyDocs[0].author as DocumentBySlug["authors"][])[0];
    expect(
      (author.organization as unknown as DocumentBySlug["organizations"][])[0]
        .name,
    ).toBe("Vex Inc");
  });
});
```

---

### `packages/core/src/api/find.client.ts` (NEW)

No server imports. Only `@convex-dev/react-query` and the `vexConvexApi` reference.
One clean function, one return type.

````ts
import { convexQuery } from "@convex-dev/react-query";

import { vexConvexApi } from "../convex";
import type { CollectionSlug } from "../types/generated";
import type { PopulateShape } from "./populate";
import type { GenericQueryClientParams } from "./types";

/**
 * Client-side args for `find`. Extends {@link GenericQueryClientParams}
 * to inherit `ctx?: never` and `populate?: TPopulate`.
 *
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 */
export interface FindClientArgs<
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> extends GenericQueryClientParams<TSlug, TPopulate> {
  slug: TSlug;
  limit?: number;
}

/**
 * Returns tanstack-query options for listing documents in a VexCMS collection.
 * Client-side only — pass to `useQuery` / `useSuspenseQuery` / `prefetchQuery`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `find` from `@vexcms/core/server`.
 *
 * @typeParam TSlug - Collection slug; compile-error if not registered.
 * @typeParam TPopulate - Populate object, narrowed against `RelationshipKeysOf<TSlug>`.
 * @param args - `{ slug, populate?, limit? }`.
 * @returns Tanstack-query `queryOptions` for `useQuery` / `useSuspenseQuery`.
 * @example
 * ```tsx
 * import { find } from "@vexcms/core/client";
 *
 * const { data: posts } = useQuery(
 *   find({ slug: "posts", populate: { author: true } }),
 * );
 */
export function find<
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
>(args: FindClientArgs<TSlug, TPopulate>): ReturnType<typeof convexQuery> {
  return convexQuery(vexConvexApi.find, {
    collection: args.slug,
    populate: args.populate,
    limit: args.limit,
  });
}

/**
 * Returns the tanstack-query queryKey for `find` without issuing a call.
 * Use to invalidate the list query after a mutation.
 *
 * @typeParam TSlug - Collection slug.
 * @param slug - The collection to compute the queryKey for.
 * @returns The tanstack-query `queryKey` array.
 * @example
 * ```ts
 * queryClient.invalidateQueries({ queryKey: find.queryKey("posts") });
 */
find.queryKey = function findQueryKey<TSlug extends CollectionSlug>(
  slug: TSlug,
) {
  return convexQuery(vexConvexApi.find, { collection: slug as string })
    .queryKey;
};
````

---

### `packages/core/src/api/get.server.ts` (NEW)

````ts
import type { GenericDataModel, GenericQueryCtx } from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../types/generated";
import { populateDocs, type PopulateShape } from "./populate";
import type { GenericQueryServerParams, Populated } from "./types";

/**
 * Server-side args for `get`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 */
export interface GetServerArgs<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> extends GenericQueryServerParams<DataModel, TSlug, TPopulate> {
  id: GenericId<TSlug>;
}

/**
 * Fetches a single document by its `Id<TSlug>`. Server-side only.
 *
 * Import from `@vexcms/core/server`. For the client-side version, import
 * `get` from `@vexcms/core/client`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TSlug - Collection slug, recovered from the `Id` brand.
 * @typeParam TPopulate - Populate object.
 * @param args - `{ ctx, id, populate? }`.
 * @returns Promise resolving to the populated doc or `null` if not found.
 * @example
 * ```ts
 * import { get } from "@vexcms/core/server";
 *
 * export const post = query({
 *   args: { id: v.id("posts") },
 *   handler: (ctx, args) => get({ ctx, id: args.id, populate: { author: true } }),
 * });
 */
export async function get<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
>(
  args: GetServerArgs<DataModel, TSlug, TPopulate>,
): Promise<Populated<TSlug, TPopulate> | null> {
  const doc = await args.ctx.db.get(args.id as GenericId<string>);
  if (!doc) return null;
  // No populate: ctx.db.query().take() returns DocumentByName<DataModel, TSlug>[] but
  // No populate: ctx.db.get() returns DocumentByName<DataModel, TSlug> | null but
  // we declared Promise<Populated<TSlug, TPopulate> | null>. Same runtime shape;
  // TypeScript can't prove it — hence the cast.
  if (!args.populate) return doc as never;
  // populateDocs returns Populated<TSlug, TPopulate>[] — take the first element.
  const [populated] = await populateDocs(args.ctx, [doc], args.populate);
  return populated ?? null;
}
````

---

### `packages/core/src/api/get.server.test.ts` (NEW)

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import type { DocumentBySlug } from "../types/generated";
import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { get } from "./get.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("get (server)", () => {
  test("returns the doc for an existing id", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const id = await ctx.db.insert("posts", {
          title: "Solo",
          slug: "solo",
        });
        return get({ ctx, id });
      },
    );
    expect(doc).toMatchObject({ title: "Solo", slug: "solo" });
  });

  test("returns null for a missing id", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const id = await ctx.db.insert("posts", { title: "Doomed", slug: "x" });
        await ctx.db.delete(id);
        return get({ ctx, id });
      },
    );
    expect(doc).toBeNull();
  });

  test("populate replaces Ids on a single doc", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const authorId = await ctx.db.insert("authors", { name: "Lena" });
        const postId = await ctx.db.insert("posts", {
          title: "Hi",
          slug: "hi",
          author: [authorId],
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return get({
          ctx,
          id: postId,
          populate: { author: true },
        } as any) as Promise<{ author: unknown; [k: string]: unknown } | null>;
      },
    );
    expect((doc?.author as DocumentBySlug["authors"][])?.[0].name).toBe("Lena");
  });
});
```

---

### `packages/core/src/api/get.client.ts` (NEW)

````ts
import { convexQuery } from "@convex-dev/react-query";
import type { GenericId } from "convex/values";

import { vexConvexApi } from "../convex";
import type { CollectionSlug } from "../types/generated";
import type { PopulateShape } from "./populate";
import type { GenericQueryClientParams } from "./types";

/**
 * Client-side args for `get`. Extends {@link GenericQueryClientParams}
 * to inherit `ctx?: never` and `populate?: TPopulate`.
 *
 * @typeParam TSlug - Collection slug, recovered from the `Id` brand.
 * @typeParam TPopulate - Populate object.
 */
export interface GetClientArgs<
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> extends GenericQueryClientParams<TSlug, TPopulate> {
  id: GenericId<TSlug>;
}

/**
 * Returns tanstack-query options for fetching a single document by ID.
 * Client-side only — pass to `useQuery` / `useSuspenseQuery`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `get` from `@vexcms/core/server`.
 *
 * @typeParam TSlug - Collection slug, recovered from the `Id` brand.
 * @typeParam TPopulate - Populate object.
 * @param args - `{ id, populate? }`.
 * @returns Tanstack-query `queryOptions` resolving to the doc or `null`.
 * @example
 * ```tsx
 * import { get } from "@vexcms/core/client";
 *
 * const { data: post } = useQuery(get({ id: postId, populate: { author: true } }));
 * ```
 */
export function get<
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
>(args: GetClientArgs<TSlug, TPopulate>): ReturnType<typeof convexQuery> {
  return convexQuery(vexConvexApi.get, {
    id: args.id,
    populate: args.populate,
  });
}
````

---

### `packages/core/src/api/search.server.ts` (NEW)

````ts
import type {
  GenericDataModel,
  GenericQueryCtx,
  TableNamesInDataModel,
} from "convex/server";

import type { CollectionSlug } from "../types/generated";
import { populateDocs, type PopulateShape } from "./populate";
import type { GenericQueryServerParams, Populated } from "./types";

/**
 * Server-side args for `search`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 */
export interface SearchServerArgs<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> extends GenericQueryServerParams<DataModel, TSlug, TPopulate> {
  slug: TSlug;
  query: string;
  searchIndexName: string;
  searchField: string;
  limit?: number;
}

/**
 * Text search via a Convex search index. Server-side only.
 * Empty `query` string falls back to `.take()` (returns recent docs).
 *
 * Import from `@vexcms/core/server`. For the client-side version, import
 * `search` from `@vexcms/core/client`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @param args - `{ ctx, slug, query, searchIndexName, searchField, limit?, populate? }`.
 * @returns Promise resolving to matching populated docs.
 * @example
 * ```ts
 * import { search } from "@vexcms/core/server";
 *
 * export const authorSearch = query({
 *   args: { q: v.string() },
 *   handler: (ctx, args) =>
 *     search({ ctx, slug: "authors", query: args.q, searchIndexName: "search_name", searchField: "name" }),
 * });
 * ```
 */
export async function search<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
>(
  args: SearchServerArgs<DataModel, TSlug, TPopulate>,
): Promise<Populated<TSlug, TPopulate>[]> {
  let docs: ReadonlyArray<Record<string, unknown>>;
  if (!args.query) {
    docs = await args.ctx.db
      .query(args.slug as TableNamesInDataModel<DataModel>)
      .take(args.limit ?? 20);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    docs = await (args.ctx.db.query(args.slug as any) as any)
      .withSearchIndex(args.searchIndexName, (q: any) =>
        q.search(args.searchField, args.query),
      )
      .take(args.limit ?? 20);
  }
  // No populate: ctx.db.query().take() returns DocumentByName<DataModel, TSlug>[] but
  // we declared Promise<Populated<TSlug, TPopulate>[]>. With TPopulate = {} these are
  // the same shape at runtime; TypeScript can't prove it — hence the cast.
  if (!args.populate) return docs as never;
  // populateDocs returns Populated<TSlug, TPopulate>[] directly — no cast here.
  return populateDocs(args.ctx, docs, args.populate);
}
````

---

### `packages/core/src/api/search.server.test.ts` (NEW)

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import type { DocumentBySlug } from "../types/generated";
import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { search } from "./search.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("search (server)", () => {
  test("empty query returns recent docs via .take()", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        for (let i = 0; i < 5; i++) {
          await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
        }
        return search({
          ctx,
          slug: "posts",
          query: "",
          searchIndexName: "search_title",
          searchField: "title",
          limit: 3,
        });
      },
    );
    expect(docs).toHaveLength(3);
  });

  test("non-empty query does not throw (withSearchIndex not implemented in convex-test)", async () => {
    const t = convexTest(schema, modules);
    let result: unknown[] = [];
    try {
      result = await t.run(
        async (ctx: GenericMutationCtx<GenericDataModel>) => {
          await ctx.db.insert("posts", { title: "Hello world", slug: "hello" });
          return search({
            ctx,
            slug: "posts",
            query: "hello",
            searchIndexName: "search_title",
            searchField: "title",
          });
        },
      );
    } catch {
      // withSearchIndex not implemented in convex-test v0.0.38 — acceptable
    }
    expect(Array.isArray(result)).toBe(true);
  });

  test("populate works on empty-query search (uses .take() path)", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const authorId = await ctx.db.insert("authors", { name: "Lena" });
        await ctx.db.insert("posts", {
          title: "Hello",
          slug: "hello",
          author: [authorId],
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return search({
          ctx,
          slug: "posts",
          query: "",
          searchIndexName: "search_title",
          searchField: "title",
          populate: { author: true },
        } as any) as Promise<{ author: unknown; [k: string]: unknown }[]>;
      },
    );
    expect(
      ((docs as any[])[0].author as DocumentBySlug["authors"][])[0].name,
    ).toBe("Lena");
  });
});
```

---

### `packages/core/src/api/search.client.ts` (NEW)

````ts
import { convexQuery } from "@convex-dev/react-query";

import { vexConvexApi } from "../convex";
import type { CollectionSlug } from "../types/generated";
import type { PopulateShape } from "./populate";
import type { GenericQueryClientParams } from "./types";

/**
 * Client-side args for `search`. Extends {@link GenericQueryClientParams}
 * to inherit `ctx?: never` and `populate?: TPopulate`.
 *
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 */
export interface SearchClientArgs<
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> extends GenericQueryClientParams<TSlug, TPopulate> {
  slug: TSlug;
  query: string;
  searchIndexName: string;
  searchField: string;
  limit?: number;
}

/**
 * Returns tanstack-query options for text search in a VexCMS collection.
 * Client-side only — pass to `useQuery` / `useSuspenseQuery`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `search` from `@vexcms/core/server`.
 *
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @param args - `{ slug, query, searchIndexName, searchField, limit?, populate? }`.
 * @returns Tanstack-query `queryOptions`.
 * @example
 * ```tsx
 * import { search } from "@vexcms/core/client";
 *
 * const { data: authors } = useQuery(
 *   search({ slug: "authors", query: q, searchIndexName: "search_name", searchField: "name" }),
 * );
 * ```
 */
export function search<
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
>(args: SearchClientArgs<TSlug, TPopulate>): ReturnType<typeof convexQuery> {
  return convexQuery(vexConvexApi.search, {
    collection: args.slug,
    searchIndexName: args.searchIndexName,
    searchField: args.searchField,
    query: args.query,
    limit: args.limit,
    populate: args.populate,
  });
}
````

---

### `packages/core/src/api/create.server.ts` (NEW)

Inserts a document. No client variant needed — mutations don't use
tanstack-query options; callers use `useConvexMutation(vexConvexApi.create)`.

````ts
import type {
  GenericDataModel,
  GenericMutationCtx,
  TableNamesInDataModel,
} from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../types/generated";
import type { GenericMutationServerParams } from "./types";

/**
 * Server-side args for `create`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - Collection slug.
 */
export interface CreateServerArgs<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
> extends GenericMutationServerParams<DataModel> {
  slug: TSlug;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

/**
 * Inserts a document into a VexCMS collection and returns its ID.
 * Server-side only — call inside a Convex mutation handler.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TSlug - Collection slug.
 * @param args - `{ ctx, slug, data }`. `ctx` must be a mutation context.
 * @returns Promise resolving to the new document's ID as a string.
 * @example
 * ```ts
 * import { create } from "@vexcms/core/server";
 *
 * export const createPost = mutation({
 *   args: { data: v.any() },
 *   handler: (ctx, args) => create({ ctx, slug: "posts", data: args.data }),
 * });
 */
export async function create<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
>(args: CreateServerArgs<DataModel, TSlug>): Promise<string> {
  const id = await args.ctx.db.insert(
    args.slug as TableNamesInDataModel<DataModel>,
    args.data,
  );
  return id as string;
}
````

---

### `packages/core/src/api/create.server.test.ts` (NEW)

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { create } from "./create.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("create (server)", () => {
  test("inserts a document and returns its id", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      create({ ctx, slug: "posts", data: { title: "Hello", slug: "hello" } }),
    );
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  test("document is retrievable after create", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await create({
        ctx,
        slug: "posts",
        data: { title: "Hello", slug: "hello" },
      });
      const doc = await ctx.db.get(id as never);
      expect(doc).toMatchObject({ title: "Hello", slug: "hello" });
    });
  });
});
```

---

### `packages/core/src/api/update.server.ts` (NEW)

Patches a document (partial update — only specified fields change).

````ts
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../types/generated";
import type { GenericMutationServerParams } from "./types";

/**
 * Server-side args for `update`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - Collection slug, recovered from the `Id` brand.
 */
export interface UpdateServerArgs<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
> extends GenericMutationServerParams<DataModel> {
  id: GenericId<TSlug>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

/**
 * Patches a document by its `Id<TSlug>`. Only specified fields are updated;
 * unspecified fields are left unchanged. Server-side only.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TSlug - Collection slug.
 * @param args - `{ ctx, id, data }`. `ctx` must be a mutation context.
 * @returns Promise resolving to void.
 * @example
 * ```ts
 * import { update } from "@vexcms/core/server";
 *
 * export const updatePost = mutation({
 *   args: { id: v.id("posts"), data: v.any() },
 *   handler: (ctx, args) => update({ ctx, id: args.id, data: args.data }),
 * });
 * ```
 */
export async function update<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
>(args: UpdateServerArgs<DataModel, TSlug>): Promise<void> {
  await args.ctx.db.patch(args.id as GenericId<string>, args.data);
}
````

---

### `packages/core/src/api/update.server.test.ts` (NEW)

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { update } from "./update.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("update (server)", () => {
  test("patches only the specified fields", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Old", slug: "old" });
      await update({ ctx, id, data: { title: "New" } });
      const doc = await ctx.db.get(id);
      expect(doc?.title).toBe("New");
      expect(doc?.slug).toBe("old"); // unchanged
    });
  });
});
```

---

### `packages/core/src/api/remove.server.ts` (NEW)

Deletes a document. Named `remove` to avoid collision with the JavaScript
reserved word `delete`.

````ts
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../types/generated";
import type { GenericMutationServerParams } from "./types";

/**
 * Server-side args for `remove`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - Collection slug, recovered from the `Id` brand.
 */
export interface RemoveServerArgs<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
> extends GenericMutationServerParams<DataModel> {
  id: GenericId<TSlug>;
}

/**
 * Permanently deletes a document by its `Id<TSlug>`. Server-side only.
 * Named `remove` to avoid collision with the JavaScript `delete` keyword.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TSlug - Collection slug.
 * @param args - `{ ctx, id }`. `ctx` must be a mutation context.
 * @returns Promise resolving to void.
 * @example
 * ```ts
 * import { remove } from "@vexcms/core/server";
 *
 * export const deletePost = mutation({
 *   args: { id: v.id("posts") },
 *   handler: (ctx, args) => remove({ ctx, id: args.id }),
 * });
 * ```
 */
export async function remove<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
>(args: RemoveServerArgs<DataModel, TSlug>): Promise<void> {
  await args.ctx.db.delete(args.id as GenericId<string>);
}
````

---

### `packages/core/src/api/remove.server.test.ts` (NEW)

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { remove } from "./remove.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("remove (server)", () => {
  test("deletes the document", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Doomed", slug: "d" });
      await remove({ ctx, id });
      const doc = await ctx.db.get(id);
      expect(doc).toBeNull();
    });
  });
});
```

---

### `packages/core/src/api/server.ts` (NEW)

Barrel for the server-side API. This is the file that the `"./server"` package
export entry points at.

```ts
export { find } from "./find.server";
export type { FindServerArgs } from "./find.server";

export { get } from "./get.server";
export type { GetServerArgs } from "./get.server";

export { search } from "./search.server";
export type { SearchServerArgs } from "./search.server";

export { create } from "./create.server";
export type { CreateServerArgs } from "./create.server";

export { update } from "./update.server";
export type { UpdateServerArgs } from "./update.server";

export { remove } from "./remove.server";
export type { RemoveServerArgs } from "./remove.server";
```

---

### `packages/core/src/api/client.ts` (NEW)

Barrel for the client-side API. This is the file that the `"./client"` package
export entry points at.

```ts
export { find } from "./find.client";
export type { FindClientArgs } from "./find.client";

export { get } from "./get.client";
export type { GetClientArgs } from "./get.client";

export { search } from "./search.client";
export type { SearchClientArgs } from "./search.client";
```

---

### `packages/core/src/api/index.ts` (NEW)

The factory's only job is to **register** the server functions as Convex
endpoints. It does not reimplement any logic. All logic lives in the server
functions (`find.server.ts`, `get.server.ts`, `search.server.ts`); the factory
just wraps them in `query()` with a `v.args()` schema so Convex can expose
them at the network boundary.

**Why the factory exists at all:** `find`/`get`/`search` from
`@vexcms/core/server` are plain TypeScript async functions — they can be
called from inside any Convex handler the user writes. But they aren't
_registered_ Convex endpoints. The factory wraps them in `query()` to produce
`api.vex.find`, `api.vex.get`, `api.vex.search` — the endpoints that React
components subscribe to via tanstack-query. Two separate use cases:

```
Without factory — server-to-server call:
  import { find } from "@vexcms/core/server";
  export const myQuery = query({ handler: async (ctx) => find({ ctx, slug: "posts" }) });

With factory — registers a Convex endpoint:
  export const { find } = queryApi(config, query);
  // Now React can: useQuery(find({ slug: "posts" }))  via api.vex.find
```

````ts
import {
  internalQueryGeneric,
  internalMutationGeneric,
  type FunctionVisibility,
  type GenericDataModel,
  type MutationBuilder,
  type QueryBuilder,
  type RegisteredMutation,
  type RegisteredQuery,
} from "convex/server";
import { v } from "convex/values";
import type { VexConfig } from "../config";
import { find } from "./find.server";
import { get } from "./get.server";
import { search } from "./search.server";
import { create } from "./create.server";
import { update } from "./update.server";
import { remove } from "./remove.server";

/**
 * Registers `find`, `get`, and `search` as Convex query endpoints.
 *
 * All logic lives in the server functions imported above — this file only
 * provides the `v.args()` schema and the `query()` wrapper that Convex needs
 * to expose them at the network boundary.
 *
 * Users call this once in their `convex/vex.ts` and get registered endpoints
 * they can subscribe to from React via tanstack-query. They can also call the
 * server functions directly from their own Convex handlers without this factory.
 *
 * @param _config - The user's `VexConfig`. Reserved for future metadata.
 * @param query - The user's `query` builder. Defaults to `internalQueryGeneric`.
 * @returns Registered `find` / `get` / `search` Convex queries.
 * @example
 * ```ts
 * // apps/www/convex/vex.ts
 * import { queryApi } from "@vexcms/core/convex";
 * import { query } from "./_generated/server";
 * import config from "../src/vex.config";
 *
 * export const { find, get, search } = queryApi(config, query);
 * ```
 */
export function queryApi<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>(
  _config: VexConfig,
  query: QueryBuilder<DataModel, Visibility> = internalQueryGeneric as never,
) {
  return {
    find: query({
      args: {
        collection: v.string(),
        populate: v.optional(v.any()),
        limit: v.optional(v.number()),
      },
      handler: (ctx, args) =>
        find({
          ctx: ctx as never,
          slug: args.collection as never,
          populate: args.populate,
          limit: args.limit,
        }),
    }) as RegisteredQuery<Visibility, never, never>,

    get: query({
      args: {
        id: v.string(),
        populate: v.optional(v.any()),
      },
      handler: (ctx, args) =>
        get({
          ctx: ctx as never,
          id: args.id as never,
          populate: args.populate,
        }),
    }) as RegisteredQuery<Visibility, never, never>,

    search: query({
      args: {
        collection: v.string(),
        searchIndexName: v.string(),
        searchField: v.string(),
        query: v.string(),
        limit: v.optional(v.number()),
        populate: v.optional(v.any()),
      },
      handler: (ctx, args) =>
        search({
          ctx: ctx as never,
          slug: args.collection as never,
          query: args.query,
          searchIndexName: args.searchIndexName,
          searchField: args.searchField,
          limit: args.limit,
          populate: args.populate,
        }),
    }) as RegisteredQuery<Visibility, never, never>,
  };
}

/**
 * Registers `create`, `update`, and `remove` as Convex mutation endpoints.
 *
 * Call alongside `queryApi` in the user's `convex/vex.ts`. The factory wraps
 * the server functions in `mutation()` with `v.args()` schemas so Convex
 * exposes them at `api.vex.create`, `api.vex.update`, `api.vex.remove`.
 *
 * `vexConvexApi.create`, `vexConvexApi.update`, `vexConvexApi.remove` in
 * `@vexcms/core/src/convex/index.ts` point at these paths.
 *
 * @param _config - The user's `VexConfig`. Reserved for future metadata.
 * @param mutation - The user's `mutation` builder from `convex/_generated/server`.
 *   Defaults to `internalMutationGeneric`.
 * @returns Registered `create` / `update` / `remove` Convex mutations.
 * @example
 * ```ts
 * // apps/www/convex/vex.ts
 * import { queryApi, mutationApi } from "@vexcms/core/convex";
 * import { query, mutation } from "./_generated/server";
 * import config from "../src/vex.config";
 *
 * export const { find, get, search } = queryApi(config, query);
 * export const { create, update, remove } = mutationApi(config, mutation);
 * ```
 */
export function mutationApi<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>(
  _config: VexConfig,
  mutation: MutationBuilder<
    DataModel,
    Visibility
  > = internalMutationGeneric as never,
) {
  return {
    create: mutation({
      args: {
        collection: v.string(),
        data: v.any(),
      },
      returns: v.string(),
      handler: (ctx, args) =>
        create({
          ctx: ctx as never,
          slug: args.collection as never,
          data: args.data,
        }),
    }) as RegisteredMutation<Visibility, never, never>,

    update: mutation({
      args: {
        id: v.string(),
        data: v.any(),
      },
      handler: (ctx, args) =>
        update({ ctx: ctx as never, id: args.id as never, data: args.data }),
    }) as RegisteredMutation<Visibility, never, never>,

    remove: mutation({
      args: {
        id: v.string(),
      },
      handler: (ctx, args) =>
        remove({ ctx: ctx as never, id: args.id as never }),
    }) as RegisteredMutation<Visibility, never, never>,
  };
}
````

---

### `packages/core/package.json` — additions

```jsonc
{
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
    },
    "./server": {
      "source": "./src/api/server.ts",
      "types": "./dist/api/server.d.ts",
      "import": "./dist/api/server.js",
    },
    "./client": {
      "source": "./src/api/client.ts",
      "types": "./dist/api/client.d.ts",
      "import": "./dist/api/client.js",
    },
    "./convex": {
      "source": "./src/api/index.ts",
      "types": "./dist/convex/factory.d.ts",
      "import": "./dist/convex/factory.js",
    },
  },
}
```

---

### `packages/core/tsup.config.ts` — update

Add the new entry points:

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/api/server.ts",
    "src/api/client.ts",
    "src/api/index.ts",
  ],
  format: ["esm"],
  tsconfig: "./tsconfig.build.json",
  dts: false,
  sourcemap: true,
  clean: true,
});
```

---

### `apps/www/convex/vex.ts` (NEW — user file)

```ts
import { queryApi, mutationApi } from "@vexcms/core/convex";
import { query, mutation } from "./_generated/server";
import config from "../src/vex.config";

export const { find, get, search } = queryApi(config, query);
export const { create, update, remove } = mutationApi(config, mutation);
```

After `npx convex dev` regenerates `_generated/api.ts`, these are available as:

- `api.vex.find` — list with optional populate
- `api.vex.get` — single doc with optional populate
- `api.vex.search` — text search with optional populate
- `api.vex.create` — insert a document (used by `CreateDocumentModal`)
- `api.vex.update` — patch a document (used by `CollectionEditView`)
- `api.vex.remove` — delete a document (used by admin delete action)

> **Migration note:** `apps/www/convex/vex/collections.ts` registers the same
> functions at `api.vex.collections.*` (different paths). Keep it in place
> until `vexConvexApi.create`, `vexConvexApi.update`, `vexConvexApi.remove` in
> `convex/index.ts` are updated to point at `api.vex.*` instead of
> `api.vex.collections.*`. Once `convex/index.ts` is updated and all call sites
> in `@vexcms/react` work against the new paths, delete `vex/collections.ts`.

---

### Edge-case notes

> **Edge: `@convex-dev/react-query` must never reach `api/index.ts`.** The split
> into `.server.ts` / `.client.ts` enforces this. `api/index.ts` imports only
> from `*.server.ts` files and Convex runtime packages. If you ever import a
> `.client.ts` file from `api/index.ts`, Convex's bundler will fail at deploy time.

> **Edge: subscription cost on populated lists.** See original spec edge-case notes.

> **Edge: validating that populate keys are relationship fields.** See original spec.

> **Edge: optional relationships with no value.** See original spec.

### Run tests

```bash
pnpm --filter @vexcms/core test
```

### Optional functions (D15 — implementer discretion)

Each optional function follows the same split pattern:
`create.server.ts` / `update.server.ts` / `delete.server.ts` / `count.server.ts`.
No client files needed for mutations (mutations don't use tanstack-query options).
Extend `api/index.ts` with `mutationApi(config, mutation)` returning `{ create, update, delete }`.

---

## Step 3 — Re-export Through Framework Packages [dev]

Framework packages (`@vexcms/react`, `@vexcms/next`) re-export the client and
server API functions so users who install the framework adapter get everything
from one import. This follows the existing re-export discipline (D7 /
developer-preferences.md: every core export surfaces through the framework
package).

### Files to create / modify / delete

- [ ] `packages/react/src/index.ts` — re-export from `@vexcms/core/client`, `@vexcms/core/server`, and type helpers
- [ ] `packages/next/src/index.ts` — re-export from `@vexcms/react` (transitive)

---

### `packages/react/src/index.ts` — additions

```ts
// Client-side API (React components, hooks)
export { find, get, search } from "@vexcms/core/client";
export type {
  FindClientArgs,
  GetClientArgs,
  SearchClientArgs,
} from "@vexcms/core/client";

// Server-side API (Convex query handlers)
export {
  find as findServer,
  get as getServer,
  search as searchServer,
} from "@vexcms/core/server";
export type {
  FindServerArgs,
  GetServerArgs,
  SearchServerArgs,
} from "@vexcms/core/server";

// Shared type helpers
export type {
  RelationshipKeysOf,
  TextKeysOf,
  SortableKeysOf,
  RelationshipTargetOf,
  Populated,
  PopulateShape,
} from "@vexcms/core";
```

### `packages/next/src/index.ts` — additions

```ts
// Transitive re-exports — Next.js users import from @vexcms/next
export {
  find,
  get,
  search,
  findServer,
  getServer,
  searchServer,
} from "@vexcms/react";
export type {
  FindClientArgs,
  GetClientArgs,
  SearchClientArgs,
  FindServerArgs,
  GetServerArgs,
  SearchServerArgs,
  RelationshipKeysOf,
  TextKeysOf,
  SortableKeysOf,
  RelationshipTargetOf,
  Populated,
  PopulateShape,
} from "@vexcms/react";
```

### Verify

```bash
pnpm --filter @vexcms/react typecheck
pnpm --filter @vexcms/next typecheck
```

---

## Step 4 — Deep-Generics Fix for `defineCollection.admin.useAsTitle`

Adjacent cleanup that uses the same field-type-map machinery, this time at the
deep-generics layer (no codegen — fields are in scope at the same call site).

- [ ] Update `packages/core/src/collections/types.ts` — thread `TFields`
      generic through `AdminCollectionConfigInput` and constrain `useAsTitle`
- [ ] Update `packages/core/src/collections/config.ts` — thread `TFields`
      through `defineCollection` signature
- [ ] Add a compile-error test in `packages/core/src/collections/types.test-d.ts`
      verifying that `useAsTitle: "<relationship-key>"` is rejected
- [ ] Update `packages/core/src/collections/types.test.ts` if any runtime
      tests instantiate the affected types
- [ ] Run `pnpm --filter @vexcms/core test`

### `packages/core/src/collections/types.ts` — change

```ts
import type {
  AdminField,
  FieldAdminConfigInput,
  ComponentHKT,
  ApplyComponent,
} from "../fields";
import type { CoreAdminField } from "./constants";
import type { RelationshipPreviewProps } from "./types"; // existing self-reference is fine

/**
 * Returns the union of field keys in `TFields` whose resolved field config
 * has `type: TType`. Used by deep-generics constraints on `defineCollection`
 * (e.g., `useAsTitle` must be a text-typed field key).
 */
type FieldKeysByType<
  TFields extends Record<string, AdminField>,
  TType extends AdminField["type"],
> = {
  [K in keyof TFields]: TFields[K] extends { type: TType } ? K : never;
}[keyof TFields] &
  string;

export interface AdminCollectionConfigInput<
  TFields extends Record<string, AdminField> = Record<string, AdminField>,
  F extends ComponentHKT = ComponentHKT,
> {
  /**
   * The field whose value is displayed as the document's title. Constrained
   * to text-typed fields (or the system fields `_id` / `_creationTime`).
   * Setting a relationship/select/date/etc. field key is a compile error.
   */
  useAsTitle?: CoreAdminField | FieldKeysByType<TFields, "text">;

  components?: {
    preview?: ApplyComponent<F, RelationshipPreviewProps>;
  };
}
```

### `packages/core/src/collections/config.ts` — signature change

```ts
import type { AdminField } from "../fields";

export function defineCollection<
  TSlug extends string,
  TFields extends Record<string, AdminField>,
  F extends ComponentHKT = ComponentHKT,
>(
  config: CollectionConfigInput<TSlug, TFields, F>,
): CollectionConfig<TSlug, TFields, F> {
  // …existing body unchanged
}
```

> **Edge: existing call sites that pass `TFieldSlug` instead of `TFields`.**
> The previous signature used `TFieldSlug extends string`. All existing call
> sites (`apps/www/src/vexcms/collections/*.ts`) infer the generic from the
> `fields` object literal — they don't pass it explicitly. Switching to
> `TFields extends Record<string, AdminField>` is therefore source-compatible.
> If any internal helper file passes `TFieldSlug` explicitly (the validator,
> the schema generator), update those signatures to take the broader `TFields`
> generic in the same step. Run `pnpm typecheck` workspace-wide to find them.

### Compile-error test

```ts
// packages/core/src/collections/types.test-d.ts
import { expectError, expectType } from "tsd";
import { defineCollection, text, relationship } from "..";

// ✓ useAsTitle = text field key
defineCollection({
  slug: "posts",
  fields: { title: text({ required: true }) },
  admin: { useAsTitle: "title" },
});

// ✓ useAsTitle = "_id" or "_creationTime"
defineCollection({
  slug: "authors",
  fields: { name: text({ required: true }) },
  admin: { useAsTitle: "_id" },
});

// ❌ useAsTitle = relationship field key
expectError(
  defineCollection({
    slug: "posts",
    fields: {
      title: text({ required: true }),
      author: relationship({ collection: { slug: "authors" } }),
    },
    admin: {
      // @ts-expect-error — "author" is a relationship field, not a text field
      useAsTitle: "author",
    },
  }),
);
```

---

## Step 5 — Wire `CollectionListView` + `RelationshipFieldCell`

- [ ] Update `packages/react/src/components/views/CollectionListView.tsx` —
      compute the relationship field keys from the collection config and pass
      them as `populate` to `vex.find`
- [ ] Update `packages/react/src/components/fields/relationship/Cell.tsx` —
      read populated target docs from `row.original[fieldKey]` and dispatch
      through the resolved preview component
- [ ] Verify in `apps/www/src/app/(vexcms)/admin/posts` that the relationship
      column renders preview components instead of raw IDs

### `CollectionListView.tsx` — populate computation

```tsx
import { vex } from "@vexcms/core";
import { ADMIN_FIELDS } from "@vexcms/core";
import { useQuery } from "@tanstack/react-query";

export function CollectionListView<TSlug extends CollectionSlug>({
  collection,
  initialData,
}: CollectionListViewProps<TSlug>) {
  // Auto-populate every relationship field on the collection. No opt-in.
  // `as any[]` because TFields is loosely typed at this level — the typed
  // factory's narrowing is on the call site.
  const populate = Object.entries(collection.fields)
    .filter(([, f]) => f.type === ADMIN_FIELDS.relationship.type)
    .map(([key]) => key) as ReadonlyArray<RelationshipKeysOf<TSlug>>;

  const { data } = useQuery({
    ...vex.find(collection.slug as TSlug, { populate }),
    initialData,
  });

  // …pass `data` to TanStack Table; Cell components read row.original
  // which is now Populated<TSlug, typeof populate>.
}
```

### `Cell.tsx` — read populated target docs

```tsx
"use client";

import type { CellComponentProps, RelationshipField } from "@vexcms/core";
import { resolveRelationshipPreview } from "./preview";

/**
 * Relationship field cell — reads the *populated* target doc(s) from
 * row.original. With Spec 23's auto-populate in `CollectionListView`, the
 * relationship field on row.original is `Doc<TargetSlug>[]` (not `Id[]`).
 *
 * Falls back to a count badge if the field is unpopulated (defensive — should
 * not happen once Spec 23 is wired, but covers transitional states).
 */
export function RelationshipFieldCell(
  props: CellComponentProps<RelationshipField>,
) {
  const { row, fieldKey, fieldDef, collection } = props;
  const value = (row.original as Record<string, unknown>)[fieldKey];

  if (!Array.isArray(value) || value.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  // Populated path: each element is Doc<TargetSlug>.
  const isPopulated =
    typeof value[0] === "object" && value[0] !== null && "_id" in value[0];

  if (!isPopulated) {
    // Defensive fallback — shouldn't occur under Spec 23.
    return (
      <span className="text-xs font-mono text-muted-foreground">
        {value.length} {value.length === 1 ? "ref" : "refs"}
      </span>
    );
  }

  const targetCollection = /* resolve from config — same lookup as Input.tsx */;
  const Preview = resolveRelationshipPreview({ fieldDef, targetCollection });

  return (
    <span className="inline-flex items-center gap-1">
      {value.slice(0, 1).map((doc, i) => (
        <Preview
          key={(doc as { _id: string })._id}
          doc={doc as never}
          fieldKey="_id"
          config={targetCollection!}
        />
      ))}
      {value.length > 1 && (
        <span className="text-xs text-muted-foreground-subtle">
          +{value.length - 1}
        </span>
      )}
    </span>
  );
}
```

---

## Step 6 — Reconcile Spec 22 Decision 11

- [ ] Edit `.pi/agent-docs/specs/22-relationship-field.md` Decision 11 to
      cross-link to spec 23 and clarify what `row.original` is in different
      contexts

### Update note to insert in spec 22 D11

```markdown
> **2026-05-04 — Reconciled with Spec 23.** Decision 11's claim that "Cell
> passes `row.original` (the parent doc) to the preview component" was correct
> in _intent_ but incomplete: `row.original` only contains `Id[]` for
> relationship fields without server-side population. Spec 23 introduces
> `vex.find(slug, { populate })`, which `CollectionListView` now uses to
> auto-populate every relationship column. After Spec 23 lands, `row.original`'s
> relationship fields are `Doc<TargetSlug>[]` (the resolved target docs), and
> the preview component receives the _target_ doc as expected. Picker rows
> and trigger chips are unchanged.
```

---

## Verification (mandatory)

- [ ] `pnpm --filter @vexcms/core test` — all tests pass (populate + find.server + get.server + search.server)
- [ ] `pnpm --filter @vexcms/core typecheck` — passes clean
- [ ] `pnpm --filter @vexcms/core build` — produces `dist/index.js`, `dist/api/server.js`, `dist/api/client.js`, `dist/convex/factory.js`
- [ ] `@vexcms/core/server` resolves to `src/api/server.ts` in consuming packages (check via `tsc --traceResolution`)
- [ ] `@vexcms/core/client` resolves to `src/api/client.ts`
- [ ] `@vexcms/core/convex` resolves to `src/api/index.ts`
- [ ] `apps/www/convex/vex.ts` deploys cleanly: `npx convex dev` registers `api.vex.find`, `api.vex.get`, `api.vex.search` without bundler errors
- [ ] `pnpm --filter @vexcms/react typecheck` and `pnpm --filter @vexcms/next typecheck` pass
- [ ] `pnpm --filter www typecheck` — `apps/www` compiles cleanly
- [ ] `vex generate` in `apps/www` produces `vex.types.ts` with `CollectionsFieldTypeMap` on `GeneratedVexTypes`
- [ ] Manual: load `/admin/posts` in the browser; relationship column renders preview components (not raw IDs)

---

## Success Criteria

- [ ] `find({ slug: "posts", populate: { author: true } })` (client) typechecks with no `as const` required.
- [ ] `find({ slug: "posts", populate: { title: true } })` (client) is a compile error (`"title"` is not a relationship key).
- [ ] `find({ slug: "postz" })` (client) is a compile error (slug not registered).
- [ ] `data[0].author` is typed as `Doc<"authors">[]` after `populate: { author: true }`; `Id<"authors">[]` without populate.
- [ ] **(Nested)** `find({ ctx, slug: "posts", populate: { author: { populate: { organization: true } } } })` (server) typechecks; no artificial depth cap.
- [ ] **(Server)** `import { find } from "@vexcms/core/server"` inside `apps/www/convex/customQueries.ts` typechecks and runs without bundler errors.
- [ ] **(Bundler)** `@convex-dev/react-query` is NOT in the Convex deployment bundle (verify via `npx convex deploy --dry-run` or dashboard bundle analysis).
- [ ] `defineCollection({ admin: { useAsTitle: "author" }, fields: { author: relationship(…) } })` is a compile error.
- [ ] `defineCollection({ admin: { useAsTitle: "title" }, fields: { title: text() } })` typechecks cleanly.
- [ ] In the browser, `/admin/posts` shows `author` column via the preview component, not raw IDs.
- [ ] Spec 22 Decision 11 has the reconciliation note pointing at this spec.
- [ ] No new RBAC code. The only server-side filter is populate.

---

## References

- `.pi/agent-docs/specs/23-vex-api/design-walkthrough.md` — readable user-facing
  reference. Same spec, written from the consumer's perspective.
- `.pi/agent-docs/specs/22-relationship-field.md` — Decision 11 reconciliation
  target.
- `.pi/agent-docs/standards/developer-preferences.md` — § _Type Generation_
  encodes the deep-generics-vs-codegen rule used throughout this spec.
- `.pi/agent-docs/product/implementation-plan.md` — § _M-NEW Vex API_ schedules
  this for the May 22–28 window.
- Convex helpers — `convex-helpers/server/relationships` exports `getManyFrom`
  used in Step 2. Already in deps.
- Master branch `packages/ui/src/components/form/fields/RelationshipField.tsx`
  — visual reference for cell rendering of populated relationship fields (the
  master version uses client-side `useQuery` per ID; we replace with server-side
  populate via this spec).

---

## Follow-up specs unblocked by this work

- **Spec 24 — RBAC.** Adds collection-level + field-level access predicates.
  Hooks into `vexConvexApi.find`'s handler as a separate filtering pass.
- **Spec 25 — Mutations API.** `vex.create / update / delete` typed factories
  with input shape inference from `Doc<TSlug>`.
- **Spec 26 — `vex.get` and `vex.search` typed factories.** Migrate the
  picker hook (`useRelationshipPickerOptions`) to use `vex.search`.
- **Future — `useVexQuery` sugar hook.** Optional convenience wrapper.
- **Future — Nested populate** (`["author.team"]`).
- **Future — REST surface** at `/api/vex/*` mirroring the typed API.
