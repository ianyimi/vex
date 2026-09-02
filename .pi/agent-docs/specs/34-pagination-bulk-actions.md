# Pagination & Bulk Actions — Data Tables

**Status:** Draft (not started)

**Primary scope:** `@vexcms/core`, `@vexcms/react`

**Also touches:** Convex functions in `apps/www/convex`

---

## Overview

Adds cursor-based Load More pagination, bulk selection, and bulk delete to all data tables in VexCMS:

1. **Cursor-based pagination** — Load More button using Convex's native `paginate()` API
2. **Configurable page size** — Per-collection setting for items loaded per batch (default: 100)
3. **Total count display** — Shows "1,523 documents" or "10,000+ documents" (when >32k)
4. **Checkbox selection column** — Select individual rows or all on current page
5. **Bulk delete with confirmation** — Delete selected items with modal confirmation showing count
6. **Load More pattern** — Simple UX with no page numbers, all results visible in one scrollable list
7. **Collection config for table settings** — New `admin.table` config block for default page size, sort order, bulk actions

**Applies to:**

- `CollectionListView` (user collections)
- `MediaLibraryGrid` (media collections)
- Future: versioned content modal (deferred to drafts spec)

---

## Code Effect Preview

### Collection config — table settings

```ts
export const posts = defineCollection({
  slug: "posts",
  fields: { /* ... */ },
+  admin: {
+    table: {
+      defaultPageSize: 100, // Initial items to load
+      defaultSort: { field: "_creationTime", order: "desc" },
+      bulkActions: {
+        delete: true,
+      },
+    },
+  },
});
```

### find API — pagination args

```ts
-const { data } = useQuery(find({ collection: "posts" }));
+const { data, pagination } = useQuery(
+  find({
+    collection: "posts",
+    paginationOpts: {
+      numItems: 25,
+      cursor: null, // or continueCursor from previous page
+    },
+  })
+);
+
+// pagination: { page: Doc[], continueCursor: string | null, isDone: boolean }
```

### CollectionListView — selection state

```ts
-// No selection state
+const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
+const [selectAllMode, setSelectAllMode] = useState<"none" | "page" | "all" | "inverse">("none");
+
+// Select all in table
+<Button onClick={() => setSelectAllMode("all")}>
+  Select all {totalCount} items
+</Button>
```

### Bulk delete — confirmation modal

```ts
+<AlertDialog open={deleteModalOpen}>
+  <AlertDialogContent>
+    <AlertDialogTitle>
+      Delete {selectAllMode === "inverse"
+        ? totalCount - selectedIds.size
+        : selectedIds.size} items?
+    </AlertDialogTitle>
+    <AlertDialogDescription>
+      This action cannot be undone.
+    </AlertDialogDescription>
+    <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
+  </AlertDialogContent>
+</AlertDialog>
```

---

## API Surface

| Export                   | Type      | Package         | Purpose                                                                   |
| ------------------------ | --------- | --------------- | ------------------------------------------------------------------------- |
| `TableConfig`            | Type      | `@vexcms/core`  | Collection admin table config (page size, sort, bulk actions)             |
| `PaginationResult`       | Type      | `@vexcms/core`  | Pagination result from server (page, continueCursor, isDone, totalCount?) |
| `usePaginatedCollection` | Hook      | `@vexcms/react` | Load More pagination hook (results, loadMore, isDone, totalCount)         |
| `useTableSelection`      | Hook      | `@vexcms/react` | Row selection state management (single page selection)                    |
| `DataTable`              | Component | `@vexcms/react` | Generic data table with Load More button                                  |
| `DataTableBulkActions`   | Component | `@vexcms/react` | Bulk action bar (delete, count display)                                   |
| `BulkDeleteModal`        | Component | `@vexcms/react` | Confirmation modal for bulk delete                                        |

---

## Status / progress checklist

- [x] **Core types** — `TableConfig`, `PaginationResult`, collection config schema (Steps 1-2 complete)
- [x] **find API update** — Accept `paginationOpts` and `includeTotalCount`, return `{ page, continueCursor, isDone, totalCount? }` (Steps 1-2 complete)
- [x] **search API update** — Accept `paginationOpts` and `includeTotalCount` (Steps 1-2 complete)
- [x] **remove API update** — Accept `ids: string[]` for bulk deletion (Step 2 complete)
- [x] **Client wrappers** — Accept `paginationOpts` (Step 6.5 complete)
- [ ] **usePaginatedCollection hook** — Manage Load More state (results accumulation, cursor, totalCount extraction) (Step 8)
- [x] **useTableSelection hook** — Manage selection state (Step 4 complete)
- [x] **DataTableBulkActions component** — Floating action bar when items selected (Step 5 complete)
- [ ] **BulkDeleteModal component** — Confirmation with count display (Step 6)
- [ ] **DataTable component** — Generic table with Load More button (Step 9)
- [ ] **CollectionListView integration** — Wire Load More + selection + bulk delete (Step 10)
- [ ] **MediaCollectionListView integration** — Same Load More + selection (Step 11)
- [ ] **Cleanup** — Move vexConvexApi to api/ folder (Step 12)

---

## Design Decisions

| #   | Decision (one line)                                                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Use Convex native `paginate()` API with cursor-based pagination (not offset-based).                                                                                                     |
| D2  | Load More pattern instead of page-based navigation. Simpler UX, works perfectly with cursor pagination.                                                                                 |
| D3  | "Select All" mode toggles between `page` (current page only), `all` (everything in table), and `inverse` (everything except deselected). **DEFERRED** - Start with page-only selection. |
| D4  | Bulk delete uses existing `remove()` function with `ids: string[]` array. No separate bulk delete mutation needed.                                                                      |
| D5  | Results accumulate in React state as user clicks Load More. All loaded results visible in one scrollable list.                                                                          |
| D6  | `includeTotalCount` parameter on `find()` runs `.collect()` to count documents. Only runs on first page (when `cursor === null`). Returns `null` if >32k docs.                          |
| D7  | `admin.table.defaultPageSize` controls items loaded initially and per Load More. Default: 100.                                                                                          |
| D8  | No URL state for pagination. Load More state is ephemeral (resets on page refresh).                                                                                                     |
| D9  | MediaLibraryGrid uses same Load More pattern with DataTable (grid layout deferred).                                                                                                     |
| D10 | Total count shown in header: "1,523 documents" or "10,000+ documents" (when count fails).                                                                                               |

---

## Out of Scope

- **Page-based navigation** — Page numbers, prev/next buttons, jump-to-page. Using Load More pattern instead.
- **URL state for pagination** — No `?page=2` in URL. Load More state is ephemeral.
- **Column filters** — Filter by field values (text search, select options, date ranges). Deferred to follow-up spec.
- **Column sorting UI** — Clickable column headers to change sort field/order. Deferred (default sort only for now).
- **Column visibility toggles** — Show/hide columns. Deferred.
- **Export to CSV** — Export selected or all rows. Deferred.
- **Bulk edit** — Update multiple documents at once. Deferred.
- **Keyboard shortcuts** — `⌘A` to select all, `Delete` to bulk delete. Deferred.
- **Optimistic updates** — Pagination refetch after bulk delete (will use Convex reactivity).
- **Saved views** — Custom filter/sort configurations. Deferred to separate Views spec.

---

## Deprecated Files (Cleanup Later)

These may be removed in a future cleanup spec:

- `packages/core/src/api/find/client.ts` — Client-side wrapper not used anymore (components call Convex directly)
- `packages/core/src/api/get/client.ts` — Same pattern
- `packages/core/src/api/remove/client.ts` — Same pattern
- `packages/core/src/api/update/client.ts` — Same pattern
- `apps/www/convex/vex/collections.ts` → `list` handler — Replaced by `find`, kept for backwards compat

These files are not modified in this spec. Mark them as deprecated and remove in a follow-up "API Cleanup" spec.

---

## Target Directory Structure

```
packages/core/src/
├── api/
│   ├── types.ts                    ✅ DONE (added pagination types)
│   ├── find/
│   │   ├── server.ts               ✅ DONE (pagination support)
│   │   ├── server.test.ts          ✅ DONE (6 pagination tests)
│   │   └── client.ts               ⏳ TODO (Step 6.5 - add paginationOpts)
│   ├── search/
│   │   ├── server.ts               ✅ DONE (pagination support)
│   │   ├── server.test.ts          ✅ DONE (4 pagination tests)
│   │   └── client.ts               ⏳ TODO (Step 6.5 - add paginationOpts)
│   ├── remove/
│   │   ├── server.ts               ✅ DONE (bulk + soft delete)
│   │   └── server.test.ts          ✅ DONE (4 tests)
│   ├── server.ts                   ✅ DONE (updated handlers)
│   └── convex.ts                   ⏳ TODO (Step 12 - move from src/convex/)
├── internal/
│   └── metadata.ts                 ⏳ TODO (Step 7 - metadata utils)
├── schema/
│   └── index.ts                    ⏳ TODO (Step 7 - generate vex_metadata table)
├── collections/types.ts            ✅ DONE (added table config)
└── convex/index.ts                 ❌ TO MOVE → api/convex.ts (Step 12)

packages/react/src/
├── hooks/
│   ├── usePagination.ts            ✅ DONE
│   ├── useTableSelection.ts        ✅ DONE
│   ├── usePaginatedCollection.ts   ⏳ TODO (Step 8 - NEW hook)
│   └── index.ts                    ⏳ TODO (export new hook)
├── components/
│   ├── data-table/
│   │   ├── DataTablePagination.tsx     ✅ DONE
│   │   ├── DataTableBulkActions.tsx    ✅ DONE
│   │   ├── BulkDeleteModal.tsx         ⏳ TODO (Step 6)
│   │   └── index.ts                    ✅ DONE
│   ├── ui/
│   │   ├── data-table/                 ⏳ TODO (Step 9 - NEW)
│   │   │   ├── DataTable.tsx           ⏳ TODO (generic table with manual pagination)
│   │   │   └── index.ts                ⏳ TODO (export DataTable)
│   │   ├── pagination.tsx              ✅ DONE (shadcn)
│   │   └── checkbox.tsx                ✅ EXISTS
│   ├── views/
│   │   ├── CollectionListView.tsx      ⏳ TODO (Step 10 - use hook + DataTable)
│   │   └── MediaCollectionListView.tsx ⏳ TODO (Step 11 - use hook + DataTable)
│   └── media/
│       └── MediaLibraryGrid.tsx        ⏳ TODO (Step 11 - optional)
└── index.ts                            ⏳ TODO (export DataTable)
```

**Legend:**

- ✅ DONE — Completed (Steps 1-5)
- ⏳ TODO — Remaining work (Steps 6-12)
- ❌ TO MOVE — File relocation needed (Step 12)

**Key Changes from Original Plan:**

- ➕ **Step 7:** count() API added (server + client + tests)
- ➕ **Step 8:** usePaginatedCollection hook (encapsulates pagination logic)
- ➕ **Step 9:** Generic DataTable component (manual pagination mode)
- 🔄 **Step 10:** CollectionListView now uses hook + DataTable (was Step 7)
- 🔄 **Step 11:** Media library integration (was Step 8)
- 🔄 **Step 12:** Cleanup - move vexConvexApi only (was Step 9)

**Note:** `apps/www/convex/vex/mutations/bulkDelete.ts` is **NOT created**. Use `vexConvexApi.remove` instead.

---

## Implementation Order

### Step 1 — Core types and collection config [✅ COMPLETE]

**Status:** You've already implemented this step with some naming/location changes:

- ✅ Pagination types added to `packages/core/src/api/types.ts` (PaginationOpts, PaginationResult, PaginationState, SelectionMode, SelectionState)
- ✅ Table config types added to `packages/core/src/collections/types.ts` (CollectionTableConfigInput, CollectionTableConfig)
- ✅ Collection config already accepts `admin.table` via spread

**What you implemented:**

- `PaginationOpts`, `PaginationResult`, `PaginationState` → in `packages/core/src/api/types.ts`
- `CollectionTableConfigInput`, `CollectionTableConfig` → in `packages/core/src/collections/types.ts`
- Selection types (`SelectionMode`, `SelectionState`) → in `packages/core/src/api/types.ts`

**No changes needed** — your implementation is correct. The spec originally called for a separate `pagination.ts` file, but putting everything in `api/types.ts` is cleaner.

#### ~~`packages/core/src/types/pagination.ts` (SKIP)~~

**You already added these types to `packages/core/src/api/types.ts` instead. That's better — keeps all API types together.**

**Update (fixed):** Instead of defining a custom `PaginationOpts` interface, just re-export Convex's `PaginationOptions` type:

```ts
/**
 * Pagination options for Convex queries.
 *
 * Re-exported from `convex/server` for convenience. This is the exact type
 * that Convex's `.paginate(opts)` API expects.
 *
 * Full shape from Convex:
 * {
 *   numItems: number;
 *   cursor: string | null;
 *   id?: number;
 *   endCursor?: string | null;
 *   maximumRowsRead?: number;
 *   maximumBytesRead?: number;
 * }
 *
 * @see https://docs.convex.dev/api/modules/react#usepaginatedquery
 */
export type { PaginationOptions } from "convex/server";

/**
 * @deprecated Use `PaginationOptions` instead.
 * Kept for backwards compatibility.
 */
export type PaginationOpts = import("convex/server").PaginationOptions;

/**
 * Pagination result from Convex query.
 * Returned by queries using `.paginate(opts)`.
 */
export interface PaginationResult<T> {
  /** Current page of results. */
  page: T[];
  /**
   * Cursor to fetch next page.
   * `null` when `isDone === true` (no more pages).
   */
  continueCursor: string | null;
  /** Whether this is the last page. */
  isDone: boolean;
}

/**
 * Client-side pagination state.
 * Tracks cursor stack for forward/backward navigation.
 */
export interface PaginationState {
  /** Current page number (1-based). */
  currentPage: number;
  /** Items per page. */
  pageSize: number;
  /** Stack of cursors for backward navigation. */
  cursorStack: (string | null)[];
  /** Current cursor (top of stack). */
  cursor: string | null;
  /** Whether there are more pages after current page. */
  hasNextPage: boolean;
  /** Whether there are previous pages. */
  hasPreviousPage: boolean;
  /** Total count of items (optional — requires separate count query). */
  totalCount?: number;
}

/**
 * Selection mode for data tables.
 */
export type SelectionMode =
  | "none" // No items selected
  | "page" // Items on current page selected
  | "all" // All items in table selected
  | "inverse"; // All items selected except explicitly deselected ones

/**
 * Selection state for bulk actions.
 */
export interface SelectionState {
  /** Set of selected document IDs. */
  selectedIds: Set<string>;
  /** Current selection mode. */
  mode: SelectionMode;
}
```

#### ~~`packages/core/src/types/collections.ts`~~ → **Actually `packages/core/src/collections/types.ts`**

**You already added `CollectionTableConfigInput` and `CollectionTableConfig` here. That's correct.**

For reference, here's what you implemented:

```ts
/**
 * Configuration for data table display and behavior in the admin panel.
 */
export interface TableConfig {
  /**
   * Number of items to load initially and per Load More click.
   * @default 100
   */
  defaultPageSize?: number;

  /**
   * Default sort field and order.
   * Must be an indexed field for performance.
   * @default { field: "_creationTime", order: "desc" }
   */
  defaultSort?: {
    field: string;
    order: "asc" | "desc";
  };

  /**
   * Bulk action configuration.
   */
  bulkActions?: {
    /**
     * Enable bulk delete action.
     * @default true
     */
    delete?: boolean;
  };

  /**
   * Default visible columns (by field key).
   * If not specified, all columns are shown.
   * @future — deferred to column visibility spec
   */
  defaultColumns?: string[];
}
```

Add `table` field to `CollectionAdminConfig`:

```ts
export interface CollectionAdminConfig<F extends ComponentHKT = ComponentHKT> {
  // ... existing fields

  /**
   * Data table configuration for list view.
   */
  table?: TableConfig;
}
```

#### ~~`packages/core/src/config/defineCollection.ts`~~

**No changes needed** — `admin.table` is already included in `...rest` spread. ✅

#### `packages/core/src/index.ts`

**Check if pagination types are exported:**

```bash
grep -n "Pagination\|Selection" packages/core/src/index.ts
```

If not exported yet, add:

```ts
export type {
  PaginationOptions, // Re-exported from convex/server
  PaginationOpts, // Deprecated alias
  PaginationResult,
  PaginationState,
  SelectionMode,
  SelectionState,
} from "./api/types";
```

#### Verify

```bash
cd packages/core
pnpm typecheck

# Should pass with no errors
```

---

### Step 2 — Add pagination to server-side find() and search() [✅ COMPLETE]

Update the server-side `find()` and `search()` functions to accept `paginationOpts` and use Convex's `.paginate()` API. Add `paginationOpts` to the Convex query handlers in `packages/core/src/api/server.ts`.

**Status:**

- ✅ `find()` server function — **DONE** (overloads added to `packages/core/src/api/find/server.ts`)
- ✅ `find` Convex handler — **DONE** (added `paginationOpts` to `queryApi()` in `packages/core/src/api/server.ts`)
- ❌ `search()` server function — **TODO** (add overloads to `packages/core/src/api/search/server.ts`)
- ❌ `search` Convex handler — **TODO** (add `paginationOpts` to `queryApi()` in `packages/core/src/api/server.ts`)
- ❌ Type definitions — **TODO** (update `VexFindArgs` and `VexSearchArgs` in `packages/core/src/convex/index.ts`)

**Remaining work:**

1. Add pagination overloads to `search()` in `packages/core/src/api/search/server.ts` (same pattern as `find()`)
2. Update `search` handler in `packages/core/src/api/server.ts` to accept + pass through `paginationOpts`
3. Update `VexFindArgs`, `VexSearchArgs`, `VexFindRef`, `VexSearchRef` in `packages/core/src/convex/index.ts`

**Convex PaginationOptions structure:**

```ts
import { paginationOptsValidator } from "convex/server";

type PaginationOptions = {
  numItems: number; // Required: items per page
  cursor: string | null; // Required: pagination cursor (null for first page)
  id?: number; // Optional: internal Convex pagination ID
  endCursor?: string | null; // Optional: ending cursor for range queries
  maximumRowsRead?: number; // Optional: safety limit
  maximumBytesRead?: number; // Optional: safety limit
};
```

**Pagination strategy:**

- Convex fetches in **chunks of 100 items** per page (`numItems: 100`)
- UI shows **user-selectable page sizes** (10, 25, 50, 100)
- Client-side reconciliation: if user selects 25 items/page, show first 25 of the 100-item chunk, fetch next chunk when user advances 4 pages

#### Files to modify

- [x] `packages/core/src/api/find/server.ts` — ✅ Already added `paginationOpts` with overloads
- [ ] `packages/core/src/api/search/server.ts` — add `paginationOpts` with same overload pattern
- [x] `packages/core/src/api/server.ts` — ✅ Already added `paginationOpts` to `find` handler, add to `search` handler
- [ ] `packages/core/src/convex/index.ts` — update `VexFindArgs` and `VexSearchArgs` to include paginationOpts

#### ~~`packages/core/src/api/find/server.ts`~~ ✅ DONE

**You already implemented this with overloads.** For reference, the pattern:

```ts
import type { PaginationOptions } from "convex/server";
import type { PaginationResult } from "../types";

export interface FindServerArgs<...> {
  // ... existing fields
  paginationOpts?: PaginationOptions;
}

type FindReturnPaginated<...> = PaginationResult<FindReturnItem<...>>;

// Overload 1: WITH paginationOpts → returns PaginationResult
export async function find<...>(
  args: FindServerArgs<...> & { paginationOpts: PaginationOptions },
): Promise<FindReturnPaginated<...>>;

// Overload 2: WITHOUT paginationOpts → returns array
export async function find<...>(
  args: FindServerArgs<...>,
): Promise<FindReturn<...>>;

// Implementation
export async function find<...>(
  args: FindServerArgs<...>,
): Promise<FindReturn<...> | FindReturnPaginated<...>> {
  // ... query building (withIndex, order, filter)

  // Paginate OR take
  let docs, paginationResult;
  if (args.paginationOpts) {
    const result = await q.paginate(args.paginationOpts);
    docs = result.page;
    paginationResult = { continueCursor: result.continueCursor, isDone: result.isDone };
  } else {
    docs = await q.take(args.limit ?? 100);
  }

  // Populate logic...
  const finalDocs = /* ... */;

  if (paginationResult) {
    return { page: finalDocs, ...paginationResult };
  }
  return finalDocs;
}
```

✅ This pattern is already implemented.

#### `packages/core/src/api/search/server.ts`

Add the same pagination pattern to `search()`:

```ts
import type { PaginationOptions } from "convex/server";
import type { PaginationResult } from "../types";

export interface SearchServerArgs<...> {
  collection: TCollectionSlug;
  query: string;
  searchIndexName: string;
  searchField: string;
  limit?: number;
+  paginationOpts?: PaginationOptions;
}

type SearchReturnItem<...> = /* ... existing ... */;

+type SearchReturnPaginated<
+  TCollectionSlug extends CollectionSlug,
+  TPopulate extends PopulateShape<TCollectionSlug>,
+  D extends number,
+> = PaginationResult<SearchReturnItem<TCollectionSlug, TPopulate, D>>;

+// Overload 1: WITH paginationOpts → returns PaginationResult
+export async function search<...>(
+  args: SearchServerArgs<...> & { paginationOpts: PaginationOptions },
+): Promise<SearchReturnPaginated<...>>;
+
+// Overload 2: WITHOUT paginationOpts → returns array
+export async function search<...>(
+  args: SearchServerArgs<...>,
+): Promise<SearchReturnItem<...>[]>;
+
+// Implementation
export async function search<...>(
  args: SearchServerArgs<...>,
-): Promise<SearchReturnItem<...>[]> {
+): Promise<SearchReturnItem<...>[] | SearchReturnPaginated<...>> {
  const tableName = args.collection as any;
  const limit = args.limit ?? 20;

-  let docs: Record<string, unknown>[];
+  let docs, paginationResult;
  if (!args.query) {
-    docs = await args.ctx.db.query(tableName).take(limit);
+    const q = args.ctx.db.query(tableName);
+    if (args.paginationOpts) {
+      const result = await q.paginate(args.paginationOpts);
+      docs = result.page;
+      paginationResult = { continueCursor: result.continueCursor, isDone: result.isDone };
+    } else {
+      docs = await q.take(limit);
+    }
  } else {
-    docs = await args.ctx.db
+    const q = args.ctx.db
      .query(tableName)
-      .withSearchIndex(args.searchIndexName, (q) => q.search(args.searchField, args.query))
-      .take(limit);
+      .withSearchIndex(args.searchIndexName, (q) => q.search(args.searchField, args.query));
+    if (args.paginationOpts) {
+      const result = await q.paginate(args.paginationOpts);
+      docs = result.page;
+      paginationResult = { continueCursor: result.continueCursor, isDone: result.isDone };
+    } else {
+      docs = await q.take(limit);
+    }
  }

-  const effectivePopulate = /* ... existing ... */;
+  // Populate logic (unchanged)
+  const finalDocs = /* ... existing populate logic ... */;

-  if (!effectivePopulate || Object.keys(effectivePopulate).length === 0) {
-    return docs as unknown as SearchReturnItem<...>[];
+  if (paginationResult) {
+    return { page: finalDocs, ...paginationResult };
  }
-  return populateDocs(...) as unknown as SearchReturnItem<...>[];
+  return finalDocs;
}
```

#### ~~`packages/core/src/api/server.ts`~~ — `find` handler ✅ DONE

**You already added `paginationOpts` to the `find` handler.** Now add it to `search`:

```ts
export function queryApi<...>(config: VexConfig, query: QueryBuilder<...>) {
  return {
    find: query({
      args: {
        collection: v.string(),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
        limit: v.optional(v.number()),
+        paginationOpts: v.optional(paginationOptsValidator), // ✅ Already added
      },
      handler: (ctx, args) => find({ ctx, ...args, config }),
    }),

    search: query({
      args: {
        collection: v.string(),
        searchIndexName: v.string(),
        searchField: v.string(),
        query: v.string(),
        limit: v.optional(v.number()),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
+        paginationOpts: v.optional(paginationOptsValidator), // ← ADD THIS
      },
      handler: (ctx, args) =>
        search({
          ctx,
          collection: args.collection as CollectionSlug,
          query: args.query,
          searchIndexName: args.searchIndexName,
          searchField: args.searchField,
          limit: args.limit,
          populate: args.populate,
          depth: args.depth,
+          paginationOpts: args.paginationOpts, // ← ADD THIS
          config,
        }),
    }),
  };
}
```

#### `packages/core/src/convex/index.ts`

Update `VexFindArgs` and `VexSearchArgs` to include `paginationOpts`:

```ts
import type { PaginationOptions } from "convex/server";
import type { PaginationResult } from "../api/types";

export interface VexFindArgs {
  [key: string]: unknown;
  collection: CollectionSlug;
  populate?: unknown;
  depth?: number;
  limit?: number;
+  paginationOpts?: PaginationOptions;
}

export interface VexSearchArgs {
  [key: string]: unknown;
  collection: string;
  searchIndexName: string;
  searchField: string;
  query: string;
  limit?: number;
  populate?: unknown;
  depth?: number;
+  paginationOpts?: PaginationOptions;
}

// Update return types to handle both paginated and non-paginated
export type VexFindRef = FunctionReference<
  "query",
  "public",
  VexFindArgs,
-  VexDocument[]
+  VexDocument[] | PaginationResult<VexDocument>
>;

export type VexSearchRef = FunctionReference<
  "query",
  "public",
  VexSearchArgs,
-  VexDocument[]
+  VexDocument[] | PaginationResult<VexDocument>
>;
```

#### Verify

```bash
cd apps/www
pnpm dev:app

# In browser console, test the paginated query:
# (open Convex dashboard → Functions → run listDocuments with paginationOpts)
```

---

### Step 3 — usePagination hook [✅ COMPLETE]

Client-side hook to manage pagination state (cursor stack, page number, forward/backward navigation).

#### Files to create

- [ ] `packages/react/src/hooks/usePagination.ts` (NEW)

#### Files to modify

- [ ] `packages/react/src/hooks/index.ts` — export `usePagination`

#### `packages/react/src/hooks/usePagination.ts` (NEW)

````tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import type { PaginationState, PaginationOpts } from "@vexcms/core";

/**
 * Props for usePagination hook.
 */
export interface UsePaginationProps {
  /** Initial page size. Default: 50 */
  initialPageSize?: number;
  /** Available page size options. Default: [10, 25, 50, 100] */
  pageSizeOptions?: number[];
  /** Total count of items (optional — enables page number display). */
  totalCount?: number;
}

/**
 * Return type of usePagination hook.
 */
export interface UsePaginationReturn {
  /** Current pagination state. */
  state: PaginationState;
  /** Pagination options to pass to Convex query. */
  paginationOpts: PaginationOpts;
  /** Go to next page. */
  nextPage: () => void;
  /** Go to previous page. */
  previousPage: () => void;
  /** Jump to specific page (1-based). Resets cursor stack. */
  goToPage: (page: number) => void;
  /** Change page size. Resets to page 1. */
  setPageSize: (size: number) => void;
  /** Update pagination state after receiving new page data. */
  updateFromResult: (result: {
    continueCursor: string | null;
    isDone: boolean;
  }) => void;
}

/**
 * Manages pagination state for data tables.
 *
 * Tracks cursor stack for forward/backward navigation using Convex's
 * cursor-based pagination API.
 *
 * @param props - Pagination configuration
 * @returns Pagination state and control functions
 *
 * @example
 * ```tsx
 * const pagination = usePagination({ initialPageSize: 25 });
 *
 * const { data } = useQuery(
 *   find({ collection: "posts", paginationOpts: pagination.paginationOpts })
 * );
 *
 * useEffect(() => {
 *   if (data) {
 *     pagination.updateFromResult(data);
 *   }
 * }, [data]);
 *
 * <Button onClick={pagination.nextPage} disabled={!pagination.state.hasNextPage}>
 *   Next
 * </Button>
 * ```
 */
export function usePagination(
  props: UsePaginationProps = {},
): UsePaginationReturn {
  const {
    initialPageSize = 50,
    pageSizeOptions = [10, 25, 50, 100],
    totalCount,
  } = props;

  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [hasNextPage, setHasNextPage] = useState(false);

  const cursor = cursorStack[cursorStack.length - 1] ?? null;
  const hasPreviousPage = currentPage > 1;

  const state: PaginationState = useMemo(
    () => ({
      currentPage,
      pageSize,
      cursorStack,
      cursor,
      hasNextPage,
      hasPreviousPage,
      totalCount,
    }),
    [
      currentPage,
      pageSize,
      cursorStack,
      cursor,
      hasNextPage,
      hasPreviousPage,
      totalCount,
    ],
  );

  const paginationOpts: PaginationOpts = useMemo(
    () => ({
      numItems: pageSize,
      cursor,
    }),
    [pageSize, cursor],
  );

  const updateFromResult = useCallback(
    (result: { continueCursor: string | null; isDone: boolean }) => {
      setHasNextPage(!result.isDone);
    },
    [],
  );

  const nextPage = useCallback(() => {
    if (!hasNextPage) return;

    // Push current cursor to stack before advancing
    setCursorStack((prev) => [...prev, cursor]);
    setCurrentPage((p) => p + 1);
  }, [hasNextPage, cursor]);

  const previousPage = useCallback(() => {
    if (!hasPreviousPage) return;

    // Pop cursor stack to go back
    setCursorStack((prev) => prev.slice(0, -1));
    setCurrentPage((p) => p - 1);
  }, [hasPreviousPage]);

  const goToPage = useCallback((page: number) => {
    if (page < 1) return;
    // Reset cursor stack and start from page 1
    // Note: Direct page jump requires fetching from start
    // For now, this is a simple implementation that resets
    setCursorStack([null]);
    setCurrentPage(1);
    setHasNextPage(false);
  }, []);

  const setPageSize = useCallback(
    (size: number) => {
      if (!pageSizeOptions.includes(size)) return;
      setPageSizeState(size);
      // Reset to page 1 when changing page size
      setCursorStack([null]);
      setCurrentPage(1);
      setHasNextPage(false);
    },
    [pageSizeOptions],
  );

  return {
    state,
    paginationOpts,
    nextPage,
    previousPage,
    goToPage,
    setPageSize,
    updateFromResult,
  };
}
````

#### `packages/react/src/hooks/index.ts`

```ts
export {
  usePagination,
  type UsePaginationProps,
  type UsePaginationReturn,
} from "./usePagination";
```

#### Verify

```bash
cd packages/react
pnpm typecheck
```

---

### Step 4 — useTableSelection hook [✅ COMPLETE]

Client-side hook to manage row selection state (single page, all, inverse modes).

#### Files to create

- [ ] `packages/react/src/hooks/useTableSelection.ts` (NEW)

#### Files to modify

- [ ] `packages/react/src/hooks/index.ts` — export `useTableSelection`

#### `packages/react/src/hooks/useTableSelection.ts` (NEW)

````tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import type { SelectionState, SelectionMode } from "@vexcms/core";

/**
 * Props for useTableSelection hook.
 */
export interface UseTableSelectionProps {
  /** Total count of items in the table (for "all" mode). */
  totalCount?: number;
  /** Callback when selection state changes. */
  onSelectionChange?: (state: SelectionState) => void;
}

/**
 * Return type of useTableSelection hook.
 */
export interface UseTableSelectionReturn {
  /** Current selection state. */
  state: SelectionState;
  /** Toggle selection for a single row. */
  toggleRow: (id: string) => void;
  /** Select all rows on current page. */
  selectPage: (pageIds: string[]) => void;
  /** Deselect all rows. */
  clearSelection: () => void;
  /** Toggle "select all in table" mode. */
  toggleSelectAll: () => void;
  /** Toggle "inverse" mode (everything selected except deselected). */
  toggleInverseMode: () => void;
  /** Check if a row is selected. */
  isRowSelected: (id: string) => boolean;
  /** Get count of selected items (handles inverse mode). */
  getSelectionCount: () => number;
}

/**
 * Manages row selection state for data tables with bulk actions.
 *
 * Supports three selection modes:
 * - `page`: Select all rows on current page
 * - `all`: Select all rows in the entire table
 * - `inverse`: Select all rows except explicitly deselected ones
 *
 * @param props - Selection configuration
 * @returns Selection state and control functions
 *
 * @example
 * ```tsx
 * const selection = useTableSelection({ totalCount: 500 });
 *
 * <Checkbox
 *   checked={selection.isRowSelected(row.id)}
 *   onCheckedChange={() => selection.toggleRow(row.id)}
 * />
 *
 * <Button onClick={selection.toggleSelectAll}>
 *   Select all {selection.state.totalCount} items
 * </Button>
 * ```
 */
export function useTableSelection(
  props: UseTableSelectionProps = {},
): UseTableSelectionReturn {
  const { totalCount, onSelectionChange } = props;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<SelectionMode>("none");

  const state: SelectionState = useMemo(
    () => ({ selectedIds, mode }),
    [selectedIds, mode],
  );

  const toggleRow = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }

        // If no items selected after toggle, reset mode to "none"
        if (next.size === 0) {
          setMode("none");
        } else if (mode === "none") {
          setMode("page");
        }

        onSelectionChange?.({ selectedIds: next, mode });
        return next;
      });
    },
    [mode, onSelectionChange],
  );

  const selectPage = useCallback(
    (pageIds: string[]) => {
      const next = new Set(pageIds);
      setSelectedIds(next);
      setMode(next.size > 0 ? "page" : "none");
      onSelectionChange?.({
        selectedIds: next,
        mode: next.size > 0 ? "page" : "none",
      });
    },
    [onSelectionChange],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setMode("none");
    onSelectionChange?.({ selectedIds: new Set(), mode: "none" });
  }, [onSelectionChange]);

  const toggleSelectAll = useCallback(() => {
    if (mode === "all") {
      // Deselect all
      clearSelection();
    } else {
      // Select all in table
      setMode("all");
      setSelectedIds(new Set()); // IDs will be fetched on bulk action
      onSelectionChange?.({ selectedIds: new Set(), mode: "all" });
    }
  }, [mode, clearSelection, onSelectionChange]);

  const toggleInverseMode = useCallback(() => {
    if (mode === "inverse") {
      // Exit inverse mode
      clearSelection();
    } else {
      // Enter inverse mode (everything selected except deselected)
      setMode("inverse");
      setSelectedIds(new Set()); // IDs represent EXCLUDED items in this mode
      onSelectionChange?.({ selectedIds: new Set(), mode: "inverse" });
    }
  }, [mode, clearSelection, onSelectionChange]);

  const isRowSelected = useCallback(
    (id: string) => {
      if (mode === "all") return true;
      if (mode === "inverse") return !selectedIds.has(id);
      return selectedIds.has(id);
    },
    [mode, selectedIds],
  );

  const getSelectionCount = useCallback(() => {
    if (mode === "all") return totalCount ?? 0;
    if (mode === "inverse") return (totalCount ?? 0) - selectedIds.size;
    return selectedIds.size;
  }, [mode, selectedIds, totalCount]);

  return {
    state,
    toggleRow,
    selectPage,
    clearSelection,
    toggleSelectAll,
    toggleInverseMode,
    isRowSelected,
    getSelectionCount,
  };
}
````

#### `packages/react/src/hooks/index.ts`

```ts
export {
  useTableSelection,
  type UseTableSelectionProps,
  type UseTableSelectionReturn,
} from "./useTableSelection";
```

#### Verify

```bash
cd packages/react
pnpm typecheck
```

---

### Step 5 — Data table UI components [✅ COMPLETE]

Create pagination controls, bulk action bar, and bulk delete confirmation modal.

**Prerequisite:** Install shadcn Pagination components to `packages/react/src/components/ui/`:

```bash
cd packages/react
npx shadcn@latest add pagination
```

This installs:

- `Pagination`
- `PaginationContent`
- `PaginationItem`
- `PaginationLink`
- `PaginationPrevious`
- `PaginationNext`
- `PaginationEllipsis`

See: https://ui.shadcn.com/docs/components/base/pagination

#### Files to create

- [ ] `packages/react/src/components/data-table/DataTablePagination.tsx` (NEW)
- [ ] `packages/react/src/components/data-table/DataTableBulkActions.tsx` (NEW)
- [ ] `packages/react/src/components/data-table/BulkDeleteModal.tsx` (NEW)
- [ ] `packages/react/src/components/data-table/index.ts` (NEW)

#### Files to modify

- [ ] `packages/react/src/index.ts` — export data-table components

#### `packages/react/src/components/data-table/DataTablePagination.tsx` (NEW)

````tsx
"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "../ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { UsePaginationReturn } from "../../hooks/usePagination";

/**
 * Props for DataTablePagination component.
 */
export interface DataTablePaginationProps {
  /** Pagination state and controls from usePagination hook. */
  pagination: UsePaginationReturn;
  /** Total count of items (optional — enables page number display). */
  totalCount?: number;
  /** Page size options. Default: [10, 25, 50, 100] */
  pageSizeOptions?: number[];
  /** Max page numbers to show in pagination. Default: 7 */
  maxPageNumbers?: number;
}

/**
 * Pagination controls for data tables.
 *
 * Built on shadcn Pagination components with added page size selector.
 * Displays prev/next buttons, page numbers with ellipsis, and page size dropdown.
 * Works with usePagination hook for cursor-based pagination.
 *
 * @param props - Component props
 * @returns Pagination control UI
 *
 * @example
 * ```tsx
 * const pagination = usePagination({ initialPageSize: 25 });
 *
 * <DataTablePagination
 *   pagination={pagination}
 *   totalCount={500}
 *   pageSizeOptions={[10, 25, 50, 100]}
 * />
 * ```
 */
export function DataTablePagination({
  pagination,
  totalCount,
  pageSizeOptions = [10, 25, 50, 100],
  maxPageNumbers = 7,
}: DataTablePaginationProps) {
  const { state } = pagination;

  const totalPages = totalCount
    ? Math.ceil(totalCount / state.pageSize)
    : undefined;

  // Generate page numbers to show (with ellipsis logic)
  const pageNumbers: (number | "ellipsis")[] = [];
  if (totalPages) {
    if (totalPages <= maxPageNumbers) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show first, last, current, and surrounding pages with ellipsis
      const current = state.currentPage;
      const delta = Math.floor(maxPageNumbers / 2);
      const rangeStart = Math.max(2, current - delta);
      const rangeEnd = Math.min(totalPages - 1, current + delta);

      pageNumbers.push(1);

      if (rangeStart > 2) {
        pageNumbers.push("ellipsis");
      }

      for (let i = rangeStart; i <= rangeEnd; i++) {
        pageNumbers.push(i);
      }

      if (rangeEnd < totalPages - 1) {
        pageNumbers.push("ellipsis");
      }

      pageNumbers.push(totalPages);
    }
  }

  return (
    <div className="flex items-center justify-between px-2 py-4">
      {/* Page size selector */}
      <div className="flex items-center space-x-2">
        <p className="text-sm font-medium">Rows per page</p>
        <Select
          value={state.pageSize.toString()}
          onValueChange={(value) => pagination.setPageSize(Number(value))}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={state.pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pagination controls */}
      <Pagination>
        <PaginationContent>
          {/* Previous button */}
          <PaginationItem>
            <PaginationPrevious
              onClick={() => pagination.previousPage()}
              aria-disabled={!state.hasPreviousPage}
              className={
                !state.hasPreviousPage
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>

          {/* Page numbers */}
          {pageNumbers.map((pageNum, idx) =>
            pageNum === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => pagination.goToPage(pageNum)}
                  isActive={state.currentPage === pageNum}
                  className="cursor-pointer"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ),
          )}

          {/* Next button */}
          <PaginationItem>
            <PaginationNext
              onClick={() => pagination.nextPage()}
              aria-disabled={!state.hasNextPage}
              className={
                !state.hasNextPage
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
````

#### `packages/react/src/components/data-table/DataTableBulkActions.tsx` (NEW)

````tsx
"use client";

import { Trash2, X } from "lucide-react";
import { Button } from "../ui/button";
import type { UseTableSelectionReturn } from "../../hooks/useTableSelection";

/**
 * Props for DataTableBulkActions component.
 */
export interface DataTableBulkActionsProps {
  /** Selection state and controls from useTableSelection hook. */
  selection: UseTableSelectionReturn;
  /** Callback when delete button is clicked. */
  onDelete: () => void;
  /** Whether delete action is in progress. */
  isDeleting?: boolean;
}

/**
 * Floating bulk action bar that appears when items are selected.
 *
 * Displays selection count and bulk actions (delete, etc.).
 * Positioned at bottom of table with slide-up animation.
 *
 * @param props - Component props
 * @returns Bulk action bar UI
 *
 * @example
 * ```tsx
 * const selection = useTableSelection({ totalCount: 500 });
 *
 * <DataTableBulkActions
 *   selection={selection}
 *   onDelete={() => setDeleteModalOpen(true)}
 *   isDeleting={isDeleting}
 * />
 * ```
 */
export function DataTableBulkActions({
  selection,
  onDelete,
  isDeleting,
}: DataTableBulkActionsProps) {
  const count = selection.getSelectionCount();

  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-lg border bg-background px-4 py-3 shadow-lg animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {count} {count === 1 ? "item" : "items"} selected
        </span>
        {selection.state.mode === "all" && (
          <span className="text-xs text-muted-foreground">(all in table)</span>
        )}
        {selection.state.mode === "inverse" && (
          <span className="text-xs text-muted-foreground">(inverse mode)</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={selection.clearSelection}
          disabled={isDeleting}
        >
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
}
````

#### `packages/react/src/components/data-table/BulkDeleteModal.tsx` (NEW)

````tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import type { UseTableSelectionReturn } from "../../hooks/useTableSelection";

/**
 * Props for BulkDeleteModal component.
 */
export interface BulkDeleteModalProps {
  /** Whether modal is open. */
  open: boolean;
  /** Callback when modal open state changes. */
  onOpenChange: (open: boolean) => void;
  /** Selection state from useTableSelection hook. */
  selection: UseTableSelectionReturn;
  /** Callback when delete is confirmed. */
  onConfirm: () => void;
  /** Whether delete action is in progress. */
  isDeleting?: boolean;
  /** Entity name for confirmation message (e.g., "posts", "images"). */
  entityName?: string;
}

/**
 * Confirmation modal for bulk delete actions.
 *
 * Shows count of items to be deleted and warns user that action cannot be undone.
 * Handles "inverse" mode messaging (deleting everything except deselected).
 *
 * @param props - Component props
 * @returns Confirmation modal UI
 *
 * @example
 * ```tsx
 * const selection = useTableSelection({ totalCount: 500 });
 *
 * <BulkDeleteModal
 *   open={deleteModalOpen}
 *   onOpenChange={setDeleteModalOpen}
 *   selection={selection}
 *   onConfirm={handleBulkDelete}
 *   isDeleting={isDeleting}
 *   entityName="posts"
 * />
 * ```
 */
export function BulkDeleteModal({
  open,
  onOpenChange,
  selection,
  onConfirm,
  isDeleting,
  entityName = "items",
}: BulkDeleteModalProps) {
  const count = selection.getSelectionCount();
  const { mode } = selection.state;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {count} {count === 1 ? entityName.slice(0, -1) : entityName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {mode === "inverse" ? (
              <>
                This will delete{" "}
                <strong>all {entityName} except the ones you deselected</strong>
                . This action cannot be undone.
              </>
            ) : (
              <>
                This action cannot be undone. This will permanently delete{" "}
                {mode === "all" ? (
                  <strong>
                    all {count} {entityName}
                  </strong>
                ) : (
                  <>
                    <strong>{count}</strong> {count === 1 ? "item" : "items"}
                  </>
                )}{" "}
                from the database.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
````

#### `packages/react/src/components/data-table/index.ts` (NEW)

```ts
export {
  DataTablePagination,
  type DataTablePaginationProps,
} from "./DataTablePagination";
export {
  DataTableBulkActions,
  type DataTableBulkActionsProps,
} from "./DataTableBulkActions";
export { BulkDeleteModal, type BulkDeleteModalProps } from "./BulkDeleteModal";
```

#### `packages/react/src/index.ts`

```ts
export * from "./components/data-table";
```

#### Verify

```bash
cd packages/react
pnpm typecheck
```

---

### Step 6 — BulkDeleteModal component [dev]

Confirmation modal for bulk delete that calls the existing `remove()` API function.

**Note:** No custom `bulkDelete` mutation needed. The `remove()` function in `@vexcms/core/server` already supports bulk deletion:

- Single: `remove({ ctx, ids: [id] })`
- Bulk: `remove({ ctx, ids: [id1, id2, id3] })`
- Soft delete: `remove({ ctx, ids, softDelete: "deleted" })`

#### Files to create

- [ ] `packages/react/src/components/data-table/BulkDeleteModal.tsx` (NEW)

#### `packages/react/src/components/data-table/BulkDeleteModal.tsx` (NEW)

````tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

export interface BulkDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  /**
   * Called when user confirms deletion.
   * Parent component should call vexConvexApi.remove({ ids: [...] })
   */
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
  entityName?: string;
}

/**
 * Confirmation modal for bulk delete actions.
 *
 * Shows count of items to be deleted and warns user that action cannot be undone.
 * Parent component is responsible for calling the remove mutation.
 *
 * @example
 * ```tsx
 * const removeMutation = useMutation(convexMutation(anyApi.vex.remove));
 *
 * const handleBulkDelete = async () => {
 *   await removeMutation.mutateAsync({ ids: selection.selectedIds });
 *   selection.clearSelection();
 * };
 *
 * <BulkDeleteModal
 *   open={deleteModalOpen}
 *   onOpenChange={setDeleteModalOpen}
 *   selectedCount={selection.selectedIds.length}
 *   onConfirm={handleBulkDelete}
 *   isDeleting={removeMutation.isPending}
 *   entityName="posts"
 * />
 */
export function BulkDeleteModal({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isDeleting,
  entityName = "items",
}: BulkDeleteModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {selectedCount}{" "}
            {selectedCount === 1 ? entityName.slice(0, -1) : entityName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <strong>
              {selectedCount} {entityName}
            </strong>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
````

**Note:** Inverse selection mode ("delete all except selected") is deferred to a future spec. For now, the modal only handles deleting explicitly selected IDs.

#### Verify

```bash
cd packages/react
pnpm typecheck
```

---

### Step 6.5 — Update Client API Wrappers for Pagination [dev]

Update client-side `find()` and `search()` wrappers to accept `paginationOpts` and pass them through to Convex handlers.

**Why keep client wrappers?**

- ✅ Cleaner syntax: `find({ collection: "posts" })` vs `convexQuery(anyApi.vex.find, { ... })`
- ✅ No extra imports needed
- ✅ Type-safe args without casting
- ✅ Provides `.queryKey()` helper for invalidation

**Current usage in CollectionListView:**

```tsx
const { data: documents = [] } = useQuery({
  ...find({ collection: props.collection.slug, limit: 100, depth: 1 }),
  initialData: props.initialData,
});
```

**Updated usage (with pagination):**

```tsx
const { data } = useQuery({
  ...find({
    collection: props.collection.slug,
    depth: 1,
    paginationOpts: { numItems: 100, cursor: null },
  }),
  initialData: props.initialData,
});

// data is now PaginationResult<VexDocument> | VexDocument[]
const documents = Array.isArray(data) ? data : (data?.page ?? []);
```

#### Files to modify

- [ ] `packages/core/src/api/find/client.ts`
- [ ] `packages/core/src/api/search/client.ts`

#### `packages/core/src/api/find/client.ts`

Add `paginationOpts` to args and pass through:

```ts
import type { PaginationOptions } from "convex/server";

export interface FindClientArgs<...> {
  collection: TCollectionSlug;
  limit?: number;
+  paginationOpts?: PaginationOptions;
}

export function find<...>(args: FindClientArgs<...>) {
  return convexQuery(vexConvexApi.find, {
    collection: args.collection,
    populate: args.populate,
    limit: args.limit,
    depth: args.depth,
+    paginationOpts: args.paginationOpts,
  });
}
```

#### `packages/core/src/api/search/client.ts`

Add same pattern:

```ts
import type { PaginationOptions } from "convex/server";

export interface SearchClientArgs<...> {
  collection: TCollectionSlug;
  query: string;
  searchIndexName: string;
  searchField: string;
  limit?: number;
+  paginationOpts?: PaginationOptions;
}

export function search<...>(args: SearchClientArgs<...>) {
  return convexQuery(vexConvexApi.search, {
    collection: args.collection,
    query: args.query,
    searchIndexName: args.searchIndexName,
    searchField: args.searchField,
    limit: args.limit,
    populate: args.populate,
    depth: args.depth,
+    paginationOpts: args.paginationOpts,
  });
}
```

**Note:** No function overloads needed on client side. The return type is always `ReturnType<typeof convexQuery>`, and TanStack Query handles the union type transparently.

#### Verify

```bash
cd packages/core
pnpm typecheck  # Should pass
```

---

### Step 7 — Add `includeTotalCount` to `find()` Function [dev]

Add an optional `includeTotalCount` parameter to the `find()` server function that runs `.collect()` to count all matching documents when requested. The count is returned only on the first page (when `cursor === null`) to avoid wasteful re-counting on every page load.

**Why this approach:**

- ✅ **Respects filters** — Counts only matching documents, not entire table
- ✅ **Respects search** — Works with full-text search queries
- ✅ **Graceful degradation** — Returns `null` for >32k docs, UI shows "10,000+"
- ✅ **No maintenance** — No metadata table to sync, no extra mutations
- ✅ **Works with out-of-band edits** — Always accurate, even if users edit via Convex dashboard
- ✅ **No API pollution** — Just one optional boolean flag
- ✅ **Filtered queries usually succeed** — Most filter/search queries return <10k results, so count works
- ✅ **Count only on first page** — When `cursor === null`, subsequent pages don't re-count

**Convex transaction limits:**

- **32,000 documents** max scanned per query
- **16 MiB** max data read per query
- Small/medium collections (<10k docs): `.collect()` is instant
- Large unfiltered collections (>32k): `.collect()` throws error - catch it, return `null`
- Filtered queries: Usually return <10k results, so count succeeds

#### Files to modify

- [ ] `packages/core/src/api/types.ts` — Add `includeTotalCount` to `FindServerArgs` and `SearchServerArgs`
- [ ] `packages/core/src/api/find/server.ts` — Add count logic when `includeTotalCount && cursor === null`
- [ ] `packages/core/src/api/search/server.ts` — Add count logic when `includeTotalCount && cursor === null`
- [ ] `packages/core/src/api/find/server.test.ts` — Add test for `includeTotalCount`
- [ ] `packages/core/src/api/search/server.test.ts` — Add test for `includeTotalCount`

---

#### `packages/core/src/api/types.ts`

Add `includeTotalCount` parameter:

```ts
export interface FindServerArgs<...> {
  // ... existing fields

  /**
   * Optional pagination options for cursor-based pagination.
   * When provided, returns a PaginationResult instead of an array.
   */
  paginationOpts?: PaginationOptions;

  /**
   * Whether to include total document count in the response.
   *
   * Only runs on the first page (when cursor is null) to avoid wasteful re-counting.
   * Counts all documents matching the current filters/search query.
   *
   * Returns `null` if the count exceeds Convex transaction limits (>32k documents).
   *
   * @default false
   */
+  includeTotalCount?: boolean;
}

export interface SearchServerArgs<...> {
  // ... existing fields

  /**
   * Optional pagination options for cursor-based pagination.
   * When provided, returns a PaginationResult instead of an array.
   */
  paginationOpts?: PaginationOptions;

  /**
   * Whether to include total search result count in the response.
   *
   * Only runs on the first page (when cursor is null).
   * Counts all documents matching the search query and filters.
   *
   * Returns `null` if the count exceeds Convex transaction limits (>32k documents).
   *
   * @default false
   */
+  includeTotalCount?: boolean;
}

/**
 * Pagination result from Convex query.
 *
 * Returned by queries using `.paginate(opts)`.
 *
 * @typeParam T - Type of documents in the page
 */
export type PaginationResult<T> = {
  /** Current page of results. */
  page: T[];

  /**
   * Cursor to fetch next page.
   * `null` when `isDone === true` (no more pages).
   */
  continueCursor: string | null;

  /** Whether this is the last page. */
  isDone: boolean;

  /**
   * Total count of documents matching the query.
   *
   * Only present when `includeTotalCount=true` and `cursor === null` (first page).
   *
   * `null` when count exceeds 32k documents (Convex transaction limit).
   * `undefined` when not requested or on subsequent pages.
   */
+  totalCount?: number | null;
};
```

---

#### `packages/core/src/api/find/server.ts`

Add count logic when requested and on first page:

````ts
/**
 * Find documents in a collection with optional pagination and total count.
 *
 * When `includeTotalCount=true`, runs `.collect()` on the first page to count all
 * matching documents. Returns `null` if count exceeds 32k documents.
 *
 * @param args - Find arguments including filters, sort, pagination, and count options
 * @returns Array of documents or PaginationResult with optional totalCount
 *
 * @example
 * ```ts
 * // Without pagination
 * const docs = await find({ ctx, collection: "posts" });
 *
 * // With pagination
 * const result = await find({
 *   ctx,
 *   collection: "posts",
 *   paginationOpts: { numItems: 100, cursor: null },
 * });
 * // result: { page: [...], continueCursor: "...", isDone: false }
 *
 * // With pagination and count (first page only)
 * const result = await find({
 *   ctx,
 *   collection: "posts",
 *   paginationOpts: { numItems: 100, cursor: null },
 *   includeTotalCount: true,
 * });
 * // result: { page: [...], continueCursor: "...", isDone: false, totalCount: 1523 }
 */
export async function find<...>(
  args: FindServerArgs<...>,
): Promise<FindReturn<...> | FindReturnPaginated<...>> {
  // ... existing query building logic

  // Paginate OR take
  let docs, paginationResult;
  if (args.paginationOpts) {
    const result = await q.paginate(args.paginationOpts);
    docs = result.page;
    paginationResult = {
      continueCursor: result.continueCursor,
      isDone: result.isDone
    };
  } else {
    docs = await q.take(args.limit ?? 100);
  }

  // Populate logic (unchanged)
  const finalDocs = /* ... existing populate logic ... */;

  // Include count ONLY when:
  // 1. User requested it via includeTotalCount
  // 2. First page (cursor is null) - subsequent pages don't re-count
+  if (args.includeTotalCount && !args.paginationOpts?.cursor) {
+    try {
+      // Build same query (with filters) but collect all to count
+      const countQuery = buildQuery(args); // Same filters as main query
+      const allDocs = await countQuery.collect();
+
+      if (paginationResult) {
+        return {
+          page: finalDocs,
+          ...paginationResult,
+          totalCount: allDocs.length
+        };
+      }
+      return {
+        page: finalDocs,
+        isDone: true,
+        continueCursor: null,
+        totalCount: allDocs.length
+      };
+    } catch (error) {
+      // .collect() failed (>32k docs or other limit)
+      console.warn("Failed to count documents:", error);
+      if (paginationResult) {
+        return {
+          page: finalDocs,
+          ...paginationResult,
+          totalCount: null // Signals "too large to count"
+        };
+      }
+      return {
+        page: finalDocs,
+        isDone: true,
+        continueCursor: null,
+        totalCount: null
+      };
+    }
+  }

  if (paginationResult) {
    return { page: finalDocs, ...paginationResult };
  }
  return finalDocs;
}
````

**Key points:**

- Count runs ONLY when `cursor === null` (first page)
- Count respects same filters/search as main query
- Count wrapped in try/catch - returns `null` if it fails (>32k docs)
- Subsequent pages don't include `totalCount` field

---

#### `packages/core/src/api/search/server.ts`

Add same count logic for search:

````ts
/**
 * Search documents in a collection with optional pagination and total count.
 *
 * When `includeTotalCount=true`, runs `.collect()` on the first page to count all
 * matching search results. Returns `null` if count exceeds 32k documents.
 *
 * @param args - Search arguments including query, filters, pagination, and count options
 * @returns Array of documents or PaginationResult with optional totalCount
 *
 * @example
 * ```ts
 * // With pagination and count (first page only)
 * const result = await search({
 *   ctx,
 *   collection: "posts",
 *   query: "react hooks",
 *   searchIndexName: "search_posts",
 *   searchField: "title",
 *   paginationOpts: { numItems: 100, cursor: null },
 *   includeTotalCount: true,
 * });
 * // result: { page: [...], continueCursor: "...", isDone: false, totalCount: 42 }
 */
export async function search<...>(
  args: SearchServerArgs<...>,
): Promise<SearchReturnItem<...>[] | SearchReturnPaginated<...>> {
  // ... existing query building logic

  // Paginate OR take
  let docs, paginationResult;
  if (args.paginationOpts) {
    const result = await q.paginate(args.paginationOpts);
    docs = result.page;
    paginationResult = {
      continueCursor: result.continueCursor,
      isDone: result.isDone
    };
  } else {
    docs = await q.take(args.limit ?? 20);
  }

  // Populate logic (unchanged)
  const finalDocs = /* ... existing populate logic ... */;

  // Include count ONLY on first page
+  if (args.includeTotalCount && !args.paginationOpts?.cursor) {
+    try {
+      // Build same search query but collect all to count
+      const countQuery = buildSearchQuery(args); // Same search params
+      const allDocs = await countQuery.collect();
+
+      if (paginationResult) {
+        return {
+          page: finalDocs,
+          ...paginationResult,
+          totalCount: allDocs.length
+        };
+      }
+      return {
+        page: finalDocs,
+        isDone: true,
+        continueCursor: null,
+        totalCount: allDocs.length
+      };
+    } catch (error) {
+      console.warn("Failed to count search results:", error);
+      if (paginationResult) {
+        return {
+          page: finalDocs,
+          ...paginationResult,
+          totalCount: null
+        };
+      }
+      return {
+        page: finalDocs,
+        isDone: true,
+        continueCursor: null,
+        totalCount: null
+      };
+    }
+  }

  if (paginationResult) {
    return { page: finalDocs, ...paginationResult };
  }
  return finalDocs;
}
````

---

#### Tests

Add tests for `includeTotalCount` to verify counting logic:

**`packages/core/src/api/find/server.test.ts`:**

```ts
/**
 * Tests for includeTotalCount parameter.
 *
 * Verifies:
 * - Count is returned on first page (cursor=null)
 * - Count is NOT returned on subsequent pages
 * - Count returns null when exceeding transaction limits
 */
describe("find() with includeTotalCount", () => {
  it("should return totalCount on first page", async () => {
    // Create test docs
    await ctx.db.insert("posts", { title: "Post 1" });
    await ctx.db.insert("posts", { title: "Post 2" });
    await ctx.db.insert("posts", { title: "Post 3" });

    const result = await find({
      ctx,
      collection: "posts",
      paginationOpts: { numItems: 2, cursor: null },
      includeTotalCount: true,
    });

    expect(result.page).toHaveLength(2);
    expect(result.totalCount).toBe(3);
    expect(result.isDone).toBe(false);
  });

  it("should NOT return totalCount on subsequent pages", async () => {
    // Create test docs
    await ctx.db.insert("posts", { title: "Post 1" });
    await ctx.db.insert("posts", { title: "Post 2" });
    await ctx.db.insert("posts", { title: "Post 3" });

    const firstPage = await find({
      ctx,
      collection: "posts",
      paginationOpts: { numItems: 2, cursor: null },
      includeTotalCount: true,
    });

    const secondPage = await find({
      ctx,
      collection: "posts",
      paginationOpts: { numItems: 2, cursor: firstPage.continueCursor },
      includeTotalCount: true,
    });

    expect(secondPage.totalCount).toBeUndefined();
  });

  it("should return null totalCount when count fails (>32k docs)", async () => {
    // Mock .collect() to throw
    const mockCollect = jest
      .spyOn(ctx.db.query("posts"), "collect")
      .mockRejectedValue(new Error("Transaction read too many documents"));

    const result = await find({
      ctx,
      collection: "posts",
      paginationOpts: { numItems: 100, cursor: null },
      includeTotalCount: true,
    });

    expect(result.totalCount).toBeNull();
    mockCollect.mockRestore();
  });
});
```

**`packages/core/src/api/search/server.test.ts`:**

```ts
/**
 * Tests for includeTotalCount parameter in search.
 *
 * Verifies same behavior as find():
 * - Count is returned on first page only
 * - Count respects search query filters
 */
describe("search() with includeTotalCount", () => {
  it("should return totalCount on first page", async () => {
    // Create test docs
    await ctx.db.insert("posts", { title: "React hooks tutorial" });
    await ctx.db.insert("posts", { title: "Vue composition API" });
    await ctx.db.insert("posts", { title: "React context guide" });

    const result = await search({
      ctx,
      collection: "posts",
      query: "react",
      searchIndexName: "search_posts",
      searchField: "title",
      paginationOpts: { numItems: 2, cursor: null },
      includeTotalCount: true,
    });

    expect(result.page).toHaveLength(2);
    expect(result.totalCount).toBe(2); // Only 2 docs match "react"
  });

  it("should NOT return totalCount on subsequent pages", async () => {
    // Similar to find() test - totalCount should be undefined on page 2
  });
});
```

---

#### Verify

```bash
cd packages/core
pnpm typecheck  # Should pass

cd ../../apps/www
pnpm dev:app

# In browser:
# - Check Convex dashboard — should see vex_metadata table
# - Create a document — metadata counts should increment
# - Delete a document — metadata counts should decrement
# - Collection list view header should show: "23 documents"
```

---

### Step 8 — Create usePaginatedCollection Hook [dev]

Extract pagination logic into a reusable hook that manages Convex cursor-based pagination with Load More pattern.

**Why a custom hook:**

- Encapsulates cursor management logic and result accumulation
- Handles pagination result processing (unwraps `PaginationResult`)
- Extracts `totalCount` from first page response
- Reusable across CollectionListView, MediaLibraryGrid, and future data views
- DataTable component stays generic and framework-agnostic
- Mimics Convex's `usePaginatedQuery` API with `results`, `loadMore()`, `status`, `isDone`

#### Files to create

- [ ] `packages/react/src/hooks/usePaginatedCollection.ts` (NEW)

#### Files to modify

- [ ] `packages/react/src/hooks/index.ts` — export hook

---

#### `packages/react/src/hooks/usePaginatedCollection.ts` (NEW)

````tsx
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { find } from "@vexcms/core/client";
import type {
  CollectionSlug,
  PaginationResult,
  VexDocument,
} from "@vexcms/core";

/**
 * Props for usePaginatedCollection hook.
 *
 * @typeParam TCollectionSlug - Collection slug type
 *
 * @defaults
 * - `initialNumItems`: 100
 * - `depth`: 1
 * - `includeTotalCount`: true
 */
export interface UsePaginatedCollectionProps<
  TCollectionSlug extends CollectionSlug,
> {
  /** Collection slug to paginate. */
  collection: TCollectionSlug;

  /**
   * Initial data from SSR (optional).
   * Can be either an array of documents or a PaginationResult.
   */
  initialData?: VexDocument[] | PaginationResult<VexDocument>;

  /** Number of items to fetch per Load More click. */
  initialNumItems?: number;

  /** Populate depth for relations. */
  depth?: number;

  /**
   * Whether to include total document count.
   *
   * Count is fetched only on first page load. Returns `null` if
   * collection has >32k documents.
   */
  includeTotalCount?: boolean;
}

/**
 * Return type of usePaginatedCollection hook.
 *
 * Mimics Convex's usePaginatedQuery API for consistency.
 */
export interface UsePaginatedCollectionReturn {
  /**
   * All loaded documents (accumulated across Load More calls).
   * Starts with first page, grows as user clicks Load More.
   */
  results: VexDocument[];

  /**
   * Total document count across all pages.
   *
   * - `number` when count succeeded
   * - `null` when collection has >32k documents (Convex limit)
   * - `undefined` when count hasn't loaded yet or `includeTotalCount=false`
   */
  totalCount: number | null | undefined;

  /**
   * Whether all documents have been loaded.
   * When `true`, Load More button should be hidden.
   */
  isDone: boolean;

  /**
   * Load more documents.
   *
   * @param numItems - Number of items to fetch (uses initialNumItems if not provided)
   */
  loadMore: (numItems?: number) => void;

  /**
   * Whether a query is currently in flight.
   * Use for loading states on Load More button.
   */
  isLoading: boolean;
}

/**
 * Hook for cursor-based pagination of VexCMS collections with Load More pattern.
 *
 * Manages:
 * - Convex cursor-based pagination using `find()` API
 * - Accumulates results across multiple Load More calls
 * - Extracts `totalCount` from first page response
 * - Mimics Convex `usePaginatedQuery` API for consistency
 *
 * @typeParam TCollectionSlug - Collection slug type
 * @param props - Hook configuration
 * @returns Pagination state and controls
 *
 * @example
 * ```tsx
 * const {
 *   results,
 *   totalCount,
 *   isDone,
 *   loadMore,
 *   isLoading,
 * } = usePaginatedCollection({
 *   collection: "posts",
 *   initialNumItems: 100,
 *   includeTotalCount: true,
 * });
 *
 * // Show total count in header
 * <p>
 *   {totalCount !== null && totalCount !== undefined ? (
 *     <>{totalCount.toLocaleString()} documents</>
 *   ) : (
 *     <>10,000+ documents</>
 *   )}
 * </p>
 *
 * // Show Load More button
 * {!isDone && (
 *   <Button onClick={() => loadMore(100)} disabled={isLoading}>
 *     {isLoading ? "Loading..." : "Load More"}
 *   </Button>
 * )}
 *
 * @see {@link find} - Server function for querying documents
 * @see {@link PaginationResult} - Return type with totalCount
 */
export function usePaginatedCollection<TCollectionSlug extends CollectionSlug>({
  collection,
  initialData,
  initialNumItems = 100,
  depth = 1,
  includeTotalCount = true,
}: UsePaginatedCollectionProps<TCollectionSlug>): UsePaginatedCollectionReturn {
  // Cursor state for pagination
  const [cursor, setCursor] = useState<string | null>(null);

  // Accumulated results from all pages
  const [allResults, setAllResults] = useState<VexDocument[]>([]);

  // Total count (extracted from first page)
  const [totalCount, setTotalCount] = useState<number | null | undefined>(
    undefined,
  );

  // Done state
  const [isDone, setIsDone] = useState(false);

  // Fetch current page
  const { data, isLoading } = useQuery({
    ...find({
      collection,
      depth,
      paginationOpts: { numItems: initialNumItems, cursor },
      includeTotalCount: includeTotalCount && cursor === null, // Only on first page
    }),
    // Only use initialData on first load
    ...(cursor === null && initialData ? { initialData } : {}),
  });

  // Extract pagination result
  const result = useMemo<
    PaginationResult<VexDocument> & { totalCount?: number | null }
  >(() => {
    if (!data) return { page: [], continueCursor: null, isDone: true };
    if (Array.isArray(data))
      return { page: data, continueCursor: null, isDone: true };
    return data;
  }, [data]);

  // Extract totalCount from first page response
  // Only runs once when first page loads with totalCount field
  useEffect(() => {
    if (result && "totalCount" in result && totalCount === undefined) {
      setTotalCount(result.totalCount);
    }
  }, [result, totalCount]);

  // Accumulate results
  useEffect(() => {
    if (result.page) {
      if (cursor === null) {
        // First page - replace all results
        setAllResults(result.page);
      } else {
        // Subsequent pages - append
        setAllResults((prev) => [...prev, ...result.page]);
      }

      setIsDone(result.isDone);
    }
  }, [result.page, result.isDone, cursor]);

  const loadMore = (numItems: number = initialNumItems) => {
    if (!result.isDone && result.continueCursor) {
      setCursor(result.continueCursor);
    }
  };

  return {
    results: allResults,
    totalCount,
    isDone,
    loadMore,
    isLoading,
  };
}
````

---

#### `packages/react/src/hooks/index.ts`

Export the new hook:

```ts
export {
  usePaginatedCollection,
  type UsePaginatedCollectionProps,
  type UsePaginatedCollectionReturn,
} from "./usePaginatedCollection";
```

---

#### How It Works

**Load More pattern:**

- Starts with first page (e.g., 100 items)
- User clicks "Load More" to fetch next page
- Results accumulate in state (all pages shown at once)
- No page numbers, no URL state needed

**Total count:**

- Extracted from first page response (`totalCount` field)
- Displayed in UI: "23 documents" or "10,000+ documents" (when null)
- Only fetched once (when cursor is null)

**Example flow:**

```
Initial: Fetch 100 items, show all 100, extract totalCount=523
Load More: Fetch next 100 items, show all 200 accumulated
Load More: Fetch next 100 items, show all 300 accumulated
...
Load More: Fetch remaining 123 items, isDone=true, show all 523
```

This is simpler than page-based pagination and works well with cursor-based systems.

---

#### Verify

```bash
cd packages/react
pnpm typecheck  # Should pass
```

---

### Step 9 — DataTable Component [dev]

Create a generic DataTable component with Load More button. Parent components provide accumulated data and Load More handler via props.

**Why Load More (not page numbers):**

- Simpler UX - no page number state to manage
- Works perfectly with cursor-based pagination
- All results stay visible (good for scanning large lists)
- Matches industry standards (Notion, Airtable, Linear)

#### Files to create

- [x] `packages/react/src/components/ui/data-table/DataTable.tsx` (NEW)
- [x] `packages/react/src/components/ui/data-table/index.ts` (NEW)

#### Files to modify

- [x] `packages/react/src/index.ts` — export DataTable

---

#### `packages/react/src/components/ui/data-table/DataTable.tsx` (NEW)

````tsx
"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import { Checkbox } from "../checkbox";
import { Button } from "../button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../table";
import { DataTableBulkActions } from "../../data-table/DataTableBulkActions";
import { BulkDeleteModal } from "../../data-table/BulkDeleteModal";

/**
 * Props for DataTable component.
 *
 * @typeParam TData - Row data type (must have `_id` field for selection)
 *
 * @defaults
 * - `isDone`: true
 * - `isLoadingMore`: false
 * - `enableRowSelection`: false
 * - `enableBulkActions`: false
 * - `entityName`: "items"
 * - `isDeleting`: false
 * - `isLoading`: false
 */
export interface DataTableProps<TData extends { _id: string }> {
  /** Array of data to display in table rows. */
  data: TData[];

  /** TanStack Table column definitions. */
  columns: ColumnDef<TData>[];

  // Load More pagination

  /**
   * Whether all results have been loaded.
   * When `true`, Load More button is hidden.
   */
  isDone?: boolean;

  /**
   * Callback when Load More button is clicked.
   * Parent should fetch next page and append to data.
   */
  onLoadMore?: () => void;

  /**
   * Whether Load More query is in flight.
   * Shows loading state on button.
   */
  isLoadingMore?: boolean;

  /**
   * Total count of documents across all pages.
   *
   * - `number` when count succeeded
   * - `null` when collection has >32k documents
   * - `undefined` when count not requested
   *
   * Used to show "All X items loaded" message.
   */
  totalCount?: number | null;

  // Features

  /** Enable checkbox column for row selection. */
  enableRowSelection?: boolean;

  /**
   * Enable bulk action bar when rows are selected.
   * Requires `enableRowSelection=true` to work.
   */
  enableBulkActions?: boolean;

  // Bulk actions

  /**
   * Entity name for UI labels (e.g., "posts", "files").
   * Used in bulk delete modal: "Delete 5 posts?"
   */
  entityName?: string;

  /**
   * Callback when bulk delete is confirmed.
   * Receives array of selected document IDs.
   */
  onBulkDelete?: (selectedIds: string[]) => Promise<void>;

  /**
   * Whether bulk delete mutation is in flight.
   * Disables bulk action buttons during deletion.
   */
  isDeleting?: boolean;

  // Loading

  /**
   * Whether initial data is loading.
   * Shows loading skeleton in table body.
   */
  isLoading?: boolean;
}

/**
 * Generic data table component with Load More pagination, row selection, and bulk actions.
 *
 * Built on TanStack Table. Parent component provides accumulated results and Load More handler.
 * Displays checkbox column when selection enabled, bulk action bar when items selected,
 * and Load More button when more results available.
 *
 * @typeParam TData - Row data type (must have `_id` field for selection)
 * @param props - Component props
 * @returns Data table UI
 *
 * @example
 * ```tsx
 * // Define columns
 * const columns: ColumnDef<Post>[] = [
 *   { accessorKey: "title", header: "Title" },
 *   { accessorKey: "author", header: "Author" },
 * ];
 *
 * // Use with pagination hook
 * const pagination = usePaginatedCollection({
 *   collection: "posts",
 *   initialNumItems: 100,
 * });
 *
 * const handleBulkDelete = async (ids: string[]) => {
 *   await removeMutation.mutateAsync({ ids });
 *   // Invalidate queries to refresh
 * };
 *
 * <DataTable
 *   data={pagination.results}
 *   columns={columns}
 *   isDone={pagination.isDone}
 *   onLoadMore={() => pagination.loadMore(100)}
 *   isLoadingMore={pagination.isLoading}
 *   totalCount={pagination.totalCount}
 *   enableRowSelection={true}
 *   enableBulkActions={true}
 *   onBulkDelete={handleBulkDelete}
 *   isDeleting={removeMutation.isPending}
 *   entityName="posts"
 * />
 *
 * @see {@link usePaginatedCollection} - Hook for managing pagination state
 * @see {@link DataTableBulkActions} - Bulk action bar component
 * @see {@link BulkDeleteModal} - Confirmation modal component
 */
export function DataTable<TData extends { _id: string }>({
  data,
  columns: baseColumns,

  // Load More pagination
  isDone = true,
  onLoadMore,
  isLoadingMore = false,
  totalCount,

  // Features
  enableRowSelection = false,
  enableBulkActions = false,

  // Bulk actions
  entityName = "items",
  onBulkDelete,
  isDeleting = false,

  // Loading
  isLoading = false,
}: DataTableProps<TData>) {
  // Row selection state (TanStack Table)
  const [rowSelection, setRowSelection] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Add checkbox column if row selection enabled
  const columns = useMemo(() => {
    if (!enableRowSelection) return baseColumns;

    const checkboxColumn: ColumnDef<TData> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    };

    return [checkboxColumn, ...baseColumns];
  }, [baseColumns, enableRowSelection]);

  // Build TanStack Table
  const table = useReactTable({
    data,
    columns,

    // Row selection
    enableRowSelection,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,

    // Core
    getCoreRowModel: getCoreRowModel(),
  });

  // Get selected IDs
  const selectedIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original._id);

  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedIds.length === 0) return;
    await onBulkDelete(selectedIds);
    setRowSelection({});
    setDeleteModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Bulk actions bar */}
      {enableBulkActions && selectedIds.length > 0 && (
        <DataTableBulkActions
          selectedCount={selectedIds.length}
          onDelete={() => setDeleteModalOpen(true)}
          isDeleting={isDeleting}
        />
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No {entityName} found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Load More button */}
      {!isDone && (
        <div className="flex justify-center py-4">
          <Button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            variant="outline"
          >
            {isLoadingMore ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}

      {/* All loaded message */}
      {isDone && data.length > 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {totalCount !== null && totalCount !== undefined ? (
            <>
              All {totalCount.toLocaleString()} {entityName} loaded
            </>
          ) : (
            <>
              All {data.length.toLocaleString()} {entityName} loaded
            </>
          )}
        </p>
      )}

      {/* Delete confirmation modal */}
      {enableBulkActions && (
        <BulkDeleteModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          selectedCount={selectedIds.length}
          onConfirm={handleBulkDelete}
          isDeleting={isDeleting}
          entityName={entityName}
        />
      )}
    </div>
  );
}
````

---

#### `packages/react/src/components/ui/data-table/index.ts` (NEW)

```ts
export { DataTable } from "./DataTable";
export type { DataTableProps } from "./DataTable";
```

---

#### Verify

```bash
cd packages/react
pnpm typecheck  # Should pass
```

---

### Step 10 — CollectionListView integration [dev]

Wire Load More pagination, selection, and bulk delete into the existing `CollectionListView` component using the `usePaginatedCollection` hook and `DataTable` component.

**Pattern:**

```
usePaginatedCollection hook
  ↓ (provides results, totalCount, loadMore, isDone)
CollectionListView
  ↓ (passes to DataTable)
DataTable (generic, reusable with Load More button)
```

#### Files to modify

- [x] `packages/react/src/components/views/CollectionListView.tsx`

---

#### `packages/react/src/components/views/CollectionListView.tsx`

Major updates to integrate pagination and selection:

```tsx
"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { convexMutation } from "@convex-dev/react-query";
import { anyApi } from "convex/server";
import { usePaginatedCollection } from "../../hooks/usePaginatedCollection";
import { find } from "@vexcms/core/client";
import { DataTable } from "../ui/data-table";
import { getCollectionColumnDefs } from "../fields";
import type { CollectionListViewProps } from "./types";
import { Button } from "../ui/button";

export function CollectionListView(props: CollectionListViewProps) {
  const collection = props.collection;
  const queryClient = useQueryClient();

  // Get collection config for initial page size
  const initialNumItems = collection.admin?.table?.defaultPageSize ?? 100;

  // Pagination hook
  const pagination = usePaginatedCollection({
    collection: collection.slug,
    initialData: props.initialData,
    initialNumItems,
    depth: 1,
    includeTotalCount: true,
  });

  // Column definitions
  const columns = useMemo(() => {
    return getCollectionColumnDefs({ collection });
  }, [collection]);

  // Bulk delete mutation
  const removeMutation = useMutation(convexMutation(anyApi.vex.remove));

  const handleBulkDelete = async (selectedIds: string[]) => {
    await removeMutation.mutateAsync({ ids: selectedIds });

    // Invalidate find query and metadata (counts will auto-update)
    queryClient.invalidateQueries({
      queryKey: find.queryKey(collection.slug),
    });
    // Note: vex_metadata is reactive - counts update automatically
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{collection.labels.plural}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pagination.totalCount !== null &&
            pagination.totalCount !== undefined ? (
              <>
                {pagination.totalCount.toLocaleString()} document
                {pagination.totalCount === 1 ? "" : "s"}
              </>
            ) : (
              <>10,000+ documents</>
            )}
          </p>
        </div>
        <Button
          onClick={() => {
            /* Navigate to create */
          }}
        >
          + New {collection.labels.singular}
        </Button>
      </div>

      {/* Data table */}
      <DataTable
        data={pagination.results}
        columns={columns}

        // Load More pagination
        isDone={pagination.isDone}
        onLoadMore={() => pagination.loadMore(initialNumItems)}
        isLoadingMore={pagination.isLoading}
        totalCount={pagination.totalCount}

        // Features
        enableRowSelection={true}
        enableBulkActions={true}

        // Bulk actions
        entityName={collection.labels.plural.toLowerCase()}
        onBulkDelete={handleBulkDelete}
        isDeleting={removeMutation.isPending}

        // Loading
        isLoading={pagination.isLoading && pagination.results.length === 0}
      />
    </div>
  );
}
```

---

#### What Changed

**Before (no pagination):**

```tsx
const { data: documents = [] } = useQuery({
  ...find({ collection: props.collection.slug }),
  initialData: props.initialData,
});

return <CollectionListDataTable documents={documents} />;
```

**After (Load More pagination):**

```tsx
const pagination = usePaginatedCollection({
  collection: props.collection.slug,
  initialData: props.initialData,
  initialNumItems: 100,
  includeTotalCount: true,
});

return (
  <DataTable
    data={pagination.results}
    isDone={pagination.isDone}
    onLoadMore={pagination.loadMore}
    totalCount={pagination.totalCount}
  />
);
```

**Benefits:**

- ✅ Server-side cursor pagination (efficient for large collections)
- ✅ Simple Load More UX (no page number complexity)
- ✅ Total count displayed ("1,523 documents" or "10,000+ documents")
- ✅ Bulk selection + delete
- ✅ Reusable DataTable component
- ✅ No hydration issues (initialData works)
- ✅ All results stay visible (good for scanning)

---

#### Verify

```bash
cd apps/www
pnpm dev:app

# Navigate to a collection list view (e.g., /admin/posts)
# Should see:
# - Total count in header: "23 documents" or "10,000+ documents"
# - Load More button at bottom (if more results available)
# - Checkbox column on left
# - Select rows → bulk delete → confirmation modal
# - Network tab: Convex queries use paginationOpts with includeTotalCount on first page
# - All loaded results visible in one scrollable list
```

---

### Step 11 — Media library integration [dev]

Apply same Load More pattern to `MediaCollectionListView`. Media uses the same `usePaginatedCollection` hook with `DataTable` component.

**Note:** MediaLibraryGrid may need special handling for grid layout with checkbox overlays instead of checkbox column. For now, use DataTable in list mode. Grid view can be addressed in a separate PR if needed.

#### Files to modify

- [ ] `packages/react/src/components/views/MediaCollectionListView.tsx`
- [ ] (Optional) `packages/react/src/components/media/MediaLibraryGrid.tsx` — if grid layout needs custom checkbox UI

---

#### `packages/react/src/components/views/MediaCollectionListView.tsx`

Follow the same pattern as CollectionListView (Step 10):

```tsx
"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { convexMutation } from "@convex-dev/react-query";
import { anyApi } from "convex/server";
import { usePaginatedCollection } from "../../hooks/usePaginatedCollection";
import { find } from "@vexcms/core/client";
import { DataTable } from "../ui/data-table";
import { getMediaColumnDefs } from "../fields"; // or similar
import type { MediaCollectionListViewProps } from "./types";
import { Button } from "../ui/button";

export function MediaCollectionListView(props: MediaCollectionListViewProps) {
  const queryClient = useQueryClient();

  // Pagination hook (media uses "media" collection)
  const pagination = usePaginatedCollection({
    collection: "media",
    initialData: props.initialData,
    initialNumItems: 100,
    depth: 1,
    includeTotalCount: true,
  });

  // Column definitions for media
  const columns = useMemo(() => {
    return getMediaColumnDefs(); // Thumbnail, name, size, type, actions
  }, []);

  // Bulk delete mutation (uses vex.media.deleteMedia instead of vex.remove)
  const deleteMediaMutation = useMutation(
    convexMutation(anyApi.vex.media.deleteMedia),
  );

  const handleBulkDelete = async (selectedIds: string[]) => {
    // Media deletion may need special handling (delete storage files)
    await deleteMediaMutation.mutateAsync({ ids: selectedIds });

    // Invalidate find query and metadata (counts will auto-update)
    queryClient.invalidateQueries({
      queryKey: find.queryKey("media"),
    });
    // Note: vex_metadata is reactive - counts update automatically
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pagination.totalCount !== null &&
            pagination.totalCount !== undefined ? (
              <>
                {pagination.totalCount.toLocaleString()} file
                {pagination.totalCount === 1 ? "" : "s"}
              </>
            ) : (
              <>10,000+ files</>
            )}
          </p>
        </div>
        <Button
          onClick={() => {
            /* Open upload modal */
          }}
        >
          + Upload Media
        </Button>
      </div>

      {/* Data table */}
      <DataTable
        data={pagination.results}
        columns={columns}

        // Load More pagination
        isDone={pagination.isDone}
        onLoadMore={() => pagination.loadMore(100)}
        isLoadingMore={pagination.isLoading}
        totalCount={pagination.totalCount}

        // Features
        enableRowSelection={true}
        enableBulkActions={true}

        // Bulk actions
        entityName="files"
        onBulkDelete={handleBulkDelete}
        isDeleting={deleteMediaMutation.isPending}

        // Loading
        isLoading={pagination.isLoading && pagination.results.length === 0}
      />
    </div>
  );
}
```

---

#### MediaLibraryGrid (Grid View) - Optional

If MediaLibraryGrid uses a grid layout instead of table:

**Option 1:** Use DataTable anyway (works for grid if you use custom cell renderers)

**Option 2:** Custom grid component with checkbox overlays:

```tsx
// Add checkbox overlay to each media card
<div className="relative">
  <Checkbox
    checked={isSelected}
    onCheckedChange={toggleSelection}
    className="absolute top-2 left-2 z-10"
  />
  <img src={thumbnailUrl} />
</div>
```

**Decision:** Defer custom grid implementation to a future PR if needed. For now, MediaCollectionListView can use DataTable in list mode.

---

#### Verify

```bash
cd apps/www
pnpm dev:app

# Navigate to media library
# Should see:
# - Total file count in header ("235 files" or "10,000+ files")
# - Load More button
# - Checkbox selection
# - Bulk delete works
# - All loaded files visible in one scrollable list
```

---

### Step 12 — Cleanup [dev]

Move `vexConvexApi` to the API folder for better organization.

---

#### Move vexConvexApi to API Folder

**Current location:** `packages/core/src/convex/index.ts`

**New location:** `packages/core/src/api/convex.ts`

**Reason:** The `convex/` folder was meant to mirror user's structure, but `vexConvexApi` is just type references. It belongs with the API functions in `src/api/`.

---

#### Steps

1. Create `packages/core/src/api/convex.ts`
2. Move all content from `packages/core/src/convex/index.ts` to `packages/core/src/api/convex.ts`
3. Update `packages/core/src/index.ts` to export from `./api/convex` instead of `./convex`
4. Delete empty `packages/core/src/convex/` folder

---

#### `packages/core/src/api/convex.ts` (NEW)

Move content from `src/convex/index.ts`:

````ts
import { anyApi } from "convex/server";
import type { FunctionReference } from "convex/server";
import type { CollectionSlug } from "../types/generated";
import type { VexDocument } from "../types";

// Type definitions for all Vex API functions
export interface VexFindArgs {
  [key: string]: unknown;
  collection: CollectionSlug;
  populate?: any;
  depth?: number;
  limit?: number;
  paginationOpts?: any;
}

export type VexFindRef = FunctionReference<
  "query",
  "public",
  VexFindArgs,
  VexDocument[] | any // PaginationResult when paginationOpts present
>;

export interface VexGetArgs {
  [key: string]: unknown;
  id: string;
  populate?: any;
  depth?: number;
}

export type VexGetRef = FunctionReference<
  "query",
  "public",
  VexGetArgs,
  VexDocument | null
>;

export interface VexSearchArgs {
  [key: string]: unknown;
  collection: CollectionSlug;
  searchIndexName: string;
  searchField: string;
  query: string;
  limit?: number;
  populate?: any;
  depth?: number;
  paginationOpts?: any;
}

export type VexSearchRef = FunctionReference<
  "query",
  "public",
  VexSearchArgs,
  VexDocument[] | any // PaginationResult when paginationOpts present
>;

export interface VexCountArgs {
  [key: string]: unknown;
  collection: CollectionSlug;
}

export type VexCountRef = FunctionReference<
  "query",
  "public",
  VexCountArgs,
  number
>;

export interface VexCreateArgs {
  [key: string]: unknown;
  collection: CollectionSlug;
  data: any;
}

export type VexCreateRef = FunctionReference<
  "mutation",
  "public",
  VexCreateArgs,
  string // Returns _id
>;

export interface VexUpdateArgs {
  [key: string]: unknown;
  id: string;
  data: any;
}

export type VexUpdateRef = FunctionReference<
  "mutation",
  "public",
  VexUpdateArgs,
  void
>;

export interface VexRemoveArgs {
  [key: string]: unknown;
  ids: string[];
  softDelete?: string;
}

export type VexRemoveRef = FunctionReference<
  "mutation",
  "public",
  VexRemoveArgs,
  void
>;

// Media API types
export interface VexMediaGenerateUploadUrlArgs {
  [key: string]: unknown;
}

export type VexMediaGenerateUploadUrlRef = FunctionReference<
  "mutation",
  "public",
  VexMediaGenerateUploadUrlArgs,
  string
>;

export interface VexMediaCreateMediaDocumentArgs {
  [key: string]: unknown;
  storageId: string;
  name: string;
  size: number;
  type: string;
}

export type VexMediaCreateMediaDocumentRef = FunctionReference<
  "mutation",
  "public",
  VexMediaCreateMediaDocumentArgs,
  string
>;

export interface VexMediaDeleteMediaArgs {
  [key: string]: unknown;
  ids: string[];
}

export type VexMediaDeleteMediaRef = FunctionReference<
  "mutation",
  "public",
  VexMediaDeleteMediaArgs,
  void
>;

export interface VexMediaGetUrlArgs {
  [key: string]: unknown;
  storageId: string;
}

export type VexMediaGetUrlRef = FunctionReference<
  "query",
  "public",
  VexMediaGetUrlArgs,
  string | null
>;

/**
 * Vex Convex API type-safe references.
 *
 * Provides properly-typed FunctionReference for all Vex API functions.
 * Use with `convexQuery()` and `convexMutation()` from `@convex-dev/react-query`.
 *
 * @example
 * ```tsx
 * import { vexConvexApi } from "@vexcms/core";
 * import { convexQuery } from "@convex-dev/react-query";
 *
 * const { data } = useQuery(
 *   convexQuery(vexConvexApi.find, { collection: "posts" })
 * );
 * ```
 */
export const vexConvexApi = {
  find: anyApi.vex.find as VexFindRef,
  get: anyApi.vex.get as VexGetRef,
  search: anyApi.vex.search as VexSearchRef,
  count: anyApi.vex.count as VexCountRef,

  // mutations
  create: anyApi.vex.create as VexCreateRef,
  update: anyApi.vex.update as VexUpdateRef,
  remove: anyApi.vex.remove as VexRemoveRef,

  media: {
    generateUploadUrl: anyApi.vex.media
      .generateUploadUrl as VexMediaGenerateUploadUrlRef,
    createMediaDocument: anyApi.vex.media
      .createMediaDocument as VexMediaCreateMediaDocumentRef,
    deleteMedia: anyApi.vex.media.deleteMedia as VexMediaDeleteMediaRef,
    getUrl: anyApi.vex.media.getUrl as VexMediaGetUrlRef,
  },
} as const;
````

---

#### `packages/core/src/index.ts`

Update export:

```ts
// Before
export { vexConvexApi } from "./convex";

// After
export { vexConvexApi } from "./api/convex";
```

---

#### Delete `packages/core/src/convex/`

Once `convex.ts` is moved to `api/`, delete the empty folder:

```bash
rm -rf packages/core/src/convex
```

---

#### Migration (for users)

**No changes needed** — import path stays the same:

```ts
// Import stays the same (re-exported from index.ts)
import { vexConvexApi } from "@vexcms/core";
```

The move is internal to `@vexcms/core` package structure.

---

#### Verify

```bash
cd packages/core
pnpm typecheck  # Should pass
pnpm test       # Should pass

cd ../../apps/www
pnpm typecheck  # Should pass
pnpm dev:app    # Should start without errors
```

---

### Step 13 — MediaCollectionEditView Revisit [DEFERRED — Future Spec]

**Status:** Deferred. Not part of this spec's implementation. This step is a placeholder that documents all open decisions and design constraints to resolve before building a dedicated `MediaCollectionEditView`.

---

#### Current State

`MediaCollectionEditView` currently exists as a direct copy of `CollectionEditView`, renamed and plugged in. It renders media documents in the admin panel edit route. The duplication was intentional as a quick starting point — the two views share enough structure that a fork was faster than a fully custom implementation at this stage.

---

#### What Needs to Change

**1. Storage-provider-driven field visibility**

The media edit view needs to read field visibility rules from the storage adapter config, not just from the field definitions themselves. Each storage adapter (Convex file storage, S3, R2, Vercel Blob, etc.) will expose a different set of system fields. The view must:

- Distinguish **storage adapter fields** (auto-injected by `defineMediaCollection`: `storageId`, `filename`, `mimeType`, `size`, `width`, `height`, `url`) from **user-defined custom fields** (whatever the developer added in their own media collection config)
- Mark storage adapter fields as **read-only** by default — the user didn't set these, the adapter did, and they shouldn't be editable directly
- Optionally **hide** certain adapter fields entirely (e.g. `storageId` is internal and should probably never surface in the UI by default)
- Allow storage adapter configs to declare their own field visibility rules (which fields they inject, which should be read-only, which should be hidden from the edit view)

**2. User-level field control on collection configs**

Developers should be able to control field visibility directly from their `defineCollection()` / `defineMediaCollection()` call. This is already partially done via `admin.hidden` and `admin.readOnly` on individual field configs, but the edit view needs to reliably enforce these. The `useCollectionForm` hook does some of this today — `useMediaCollectionForm` would need to extend it specifically for the media context.

Also applies to regular collections: `admin.hidden: true` on a field should reliably prevent that field from appearing in the edit form. Verify that `CollectionEditView` / `useCollectionForm` correctly respects this today and document any gaps found.

**3. `useMediaCollectionForm` hook**

The current `useCollectionForm` hook was built for general collections. Media collections have enough special-casing (storage adapter fields, file metadata, URL resolution) that a dedicated `useMediaCollectionForm` hook is likely the right separation. It would:

- Accept the media collection config + storage adapter instance
- Separate adapter-injected fields from user custom fields
- Apply adapter-level visibility rules (read-only, hidden) on top of user-level field config
- Return a field list ready to render with the correct `readOnly` and `hidden` states already resolved
- Potentially expose the resolved file URL and metadata for use in the view header (thumbnail preview, file size badge, etc.)

**4. File swapping — open decision**

There are two philosophies on whether the edit view should allow uploading a new file to replace an existing media document:

**Option A — No file swapping (current leaning, simpler)**
Users create a new media document for the new file and update their code references to point to it. Old document stays in the database. The edit view is purely metadata-only (alt text, custom fields, labels). No upload input appears on the edit view. Simpler, no risk of silent breakage.

**Option B — Swap with mime-type family restriction (considered, may add later)**
Users can upload a replacement file from the edit screen. Because all dependent code (blocks, relationship fields, etc.) references the same document ID, swapping the file automatically updates everywhere without any code changes. To prevent silent type-mismatch breakage, the upload input is restricted to files of the **same MIME type family** as the original (e.g. if the original was `image/*`, only images are accepted; if `application/pdf`, only PDFs). A visible warning banner explains the restriction and that existing code relying on the file type will be preserved.

Considerations for Option B:
- MIME type family groupings to define: `image/*`, `video/*`, `audio/*`, `application/pdf`, `text/*`, catch-all
- The upload input on the edit view should pre-filter by family, not exact type (i.e., replacing a `.jpg` with a `.png` should be allowed)
- The storage adapter must support deleting the old file blob after the swap (not all adapters do this cleanly — orphaned blobs may result)
- Version history interaction: if versioning is added later, does a file swap create a new version? Probably yes.
- The existing relationship and block fields in other documents hold `v.id("media_collection_slug")` references — swapping the file on the media document transparently updates all of them, which is the entire value of Option B

**Current decision:** Defer this choice to the dedicated spec. Document Option B as the preferred direction but don't implement until the spec is written.

---

#### To Implement When Ready

Run the following prompt in pi to generate the dedicated spec for this work:

```
/dev-spec

Spec target: MediaCollectionEditView — storage-aware field rendering and optional file swap

Context:
- `MediaCollectionEditView` currently exists as a copy of `CollectionEditView` in `packages/react/src/components/views/`
- `useCollectionForm` in `packages/react/src/hooks/` handles general collection form state
- `defineMediaCollection()` in `packages/core/src/media/` auto-injects storage adapter fields
- Storage adapters live in `packages/file-storage-convex/` (and future adapters)
- See: `.pi/agent-docs/specs/34-pagination-bulk-actions.md` Step 13 for full design notes

What to spec:

1. `useMediaCollectionForm` hook
   - Accepts media collection config + storage adapter instance
   - Separates adapter-injected fields (storageId, filename, mimeType, size, width, height, url) from user custom fields
   - Applies adapter-level visibility rules on top of user-level field config (admin.hidden, admin.readOnly)
   - Returns resolved field list with readOnly/hidden states pre-applied
   - Exposes resolved file URL and metadata for view header (thumbnail, size badge)

2. Storage adapter field visibility contract
   - Define which fields `defineMediaCollection` injects and their default visibility in the edit view
   - Allow storage adapter configs to declare per-field visibility overrides
   - Verify `admin.hidden: true` is enforced in `CollectionEditView` / `useCollectionForm` and document gaps

3. File swapping (Option B from Step 13)
   - Upload input on edit view restricted to same MIME type family as original file
   - MIME family groupings: image/*, video/*, audio/*, application/pdf, text/*, catch-all
   - Warning banner explaining restriction and behavior
   - Old blob deletion via storage adapter after successful swap
   - Decide: does a file swap create a version history entry? (likely yes, align with Spec 07)

4. MediaCollectionEditView refactor
   - Replace copy-paste from CollectionEditView with proper composition
   - Use useMediaCollectionForm instead of useCollectionForm
   - View header: file thumbnail preview, filename, size, type badge
   - Read-only display section for adapter fields, editable section for custom fields
```

---

## Verification (mandatory)

```bash
# Typecheck all packages
pnpm typecheck

# Test all packages
pnpm test

# Lint
pnpm lint

# Run dev server
cd apps/www
pnpm dev:app

# Manual verification:
# 1. Collection list view — Load More button appears when more results available
# 2. Collection list view — Total count shown in header ("23 documents" or "10,000+ documents")
# 3. Collection list view — Checkbox column appears, selection works
# 4. Collection list view — Bulk delete modal shows correct count
# 5. Collection list view — Bulk delete removes selected items and clears selection
# 6. Collection list view — All loaded results visible in one scrollable list
# 7. Media library — same Load More and selection works
# 8. Media library — bulk delete works for media items
```

---

## Success Criteria

**API Functions:**

- [ ] `find()` API accepts `paginationOpts` and `includeTotalCount`, returns `{ page, continueCursor, isDone, totalCount? }`
- [ ] `search()` API accepts `paginationOpts` and `includeTotalCount`, returns `{ page, continueCursor, isDone, totalCount? }`
- [ ] `remove()` API accepts `ids: string[]` for bulk deletion
- [ ] Client wrappers (`find()`, `search()` from `@vexcms/core/client`) accept `paginationOpts` and `includeTotalCount`
- [ ] `totalCount` only returned on first page (when `cursor === null`)
- [ ] `totalCount` returns `null` when collection exceeds 32k docs

**Hooks:**

- [ ] `usePaginatedCollection` hook manages cursor-based pagination with Load More
- [ ] Hook extracts `totalCount` from first page response
- [ ] Hook accumulates results across multiple Load More calls
- [ ] Hook mimics Convex `usePaginatedQuery` API (`results`, `loadMore`, `isDone`)

**DataTable Component:**

- [ ] `DataTable` component shows Load More button when `!isDone`
- [ ] Load More button shows loading state when fetching
- [ ] "All X items loaded" message shown when `isDone`
- [ ] Checkbox column appears when `enableRowSelection={true}`
- [ ] Bulk actions bar appears when rows selected
- [ ] Bulk delete modal shows correct count

**Collection List View:**

- [ ] CollectionListView uses `usePaginatedCollection` hook
- [ ] Total count displayed in header ("1,523 documents" or "10,000+ documents")
- [ ] Load More button works and accumulates results
- [ ] Bulk delete removes selected items and invalidates queries
- [ ] All loaded results visible in one scrollable list

**Media Library:**

- [ ] MediaCollectionListView uses same Load More pattern
- [ ] Bulk delete works for media files

**Tests:**

- [ ] `find()` pagination has test coverage (6 existing tests)
- [ ] `find()` with `includeTotalCount` has test coverage (3 new tests)
- [ ] `search()` pagination has test coverage (4 existing tests)
- [ ] `search()` with `includeTotalCount` has test coverage (2 new tests)
- [ ] `remove()` bulk delete has test coverage (4 existing tests)

**Cleanup:**

- [ ] `vexConvexApi` moved from `src/convex/` to `src/api/convex.ts`
- [ ] Empty `src/convex/` folder deleted

**Quality:**

- [ ] No TypeScript errors (`pnpm typecheck` clean)
- [ ] No ESLint errors (`pnpm lint` clean)
- [ ] All tests pass (`pnpm test` clean)

---

## References

- [Convex Pagination Docs](https://docs.convex.dev/database/pagination)
- [TanStack Table Selection](https://tanstack.com/table/v8/docs/guide/row-selection)
- [Spec 31 — Blocks Field](./31-blocks-field.md) — Similar cursor-based pagination for blocks
- [nuqs Docs](https://nuqs.47ng.com/) — URL state persistence for pagination

---

## Notes for Drafts/Versioning Spec (Next)

When implementing drafts/versioning after this spec:

1. **Version history modal** will use the same Load More pattern (`usePaginatedCollection` hook)
2. **Save draft popover** will capture:
   - Version bump type (major/minor/patch)
   - Commit message title
   - Commit message body
3. **Version selector dropdown** will be a full modal with:
   - Search by commit message
   - Load More for version list
   - Preview of version content
4. These features will reuse the Load More pattern created in this spec
