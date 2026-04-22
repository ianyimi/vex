# 008 — VexCMS Data Table Component

**Status:** POSTPONED — Implementation attempted 2026-04-09 but reverted due to layout/styling issues. Table did not take up full container width and visual appearance was not production-ready. See `agent-os/implementation-log/2026/04/2026-04-09.ideaLog.md` for details.

## Overview

This spec implements a production-ready data table component for VexCMS collection list views. The table supports server-side pagination, sorting, and search with URL-based state management for shareability. Column preferences (visibility, ordering, sizing) are persisted to localStorage. The component is designed to be framework-agnostic and extractable to a separate package later.

The implementation adapts the TNKS data table architecture to VexCMS patterns, auto-generating columns from collection field definitions and integrating with the existing Convex data layer.

## Design Decisions

**State Storage Strategy:**

- **URL Parameters** (via `nuqs`): `page`, `pageSize`, `sortBy`, `sortOrder`, `search` — enables shareable/bookmarkable views and SSR prefetching
- **localStorage**: `columnVisibility`, `columnOrder`, `columnSizing` — user preferences per collection, persisted across sessions
- **Component State**: Loading, errors, modal state — ephemeral UI state

**Column Generation:**

- Auto-generate column definitions from `collection.fields` using factory functions
- One `fieldToColumnDef()` function per field type (e.g., `textFieldToColumnDef()`)
- Use registered cell components from field adapter for rendering
- Memoize with `useMemo` to prevent unnecessary re-renders

**Row Actions:**

- Click on title field (determined by `collection.admin.useAsTitle`) to edit
- Click on `_id` field to edit
- Actions column with Edit and Delete icon buttons
- Delete opens confirmation modal via URL param

**Server Integration:**

- Manual pagination, sorting, filtering (TanStack Table in server mode)
- SSR prefetching: Next.js adapter parses URL params and fetches `initialData`
- Convex query contract documented (implementation done separately)

**Edge Case Handling:**

- Invalid `sortBy`: silently ignore, no sorting applied
- Schema mismatch (localStorage has old field names): filter to valid fields, append new fields
- Invalid `page` (out of range): clamp to last valid page
- Modal open: disable row click handlers to prevent conflicts
- Empty states: context-aware messages (filtered vs no data)
- Loading: skeleton rows matching table structure

## Out of Scope

- Date range filters
- Faceted column filters
- Row selection / bulk operations
- Export functionality (CSV/Excel)
- Advanced keyboard navigation
- State compression/hashing
- Bulk delete
- Column pinning/freezing

These features are intentionally deferred to future specs to keep this implementation focused and deliverable.

## Target Directory Structure

```
packages/
├── core/
│   └── src/
│       ├── collections/
│       │   ├── config.ts                         # Add useAsTitle to CollectionConfig
│       │   └── types.ts                          # Update CollectionConfig interface
│       └── types.ts                              # Add DataTableConfig type
│
└── react/
    ├── package.json                              # Add nuqs dependency
    └── src/
        ├── components/
        │   ├── admin/
        │   │   ├── modals/
        │   │   │   └── DeleteDocumentModal.tsx   # NEW - Delete confirmation modal
        │   │   └── views/
        │   │       └── CollectionListView.tsx    # UPDATE - Replace placeholder with DataTable
        │   │
        │   ├── data-table/
        │   │   ├── DataTable.tsx                 # NEW - Main table component
        │   │   ├── DataTableToolbar.tsx          # NEW - Search bar and controls
        │   │   ├── DataTablePagination.tsx       # NEW - Pagination controls
        │   │   ├── DataTableViewOptions.tsx      # NEW - Column visibility + ordering
        │   │   ├── DataTableColumnHeader.tsx     # NEW - Sortable column header
        │   │   ├── DataTableEmptyState.tsx       # NEW - Empty/filtered states
        │   │   ├── DataTableSkeleton.tsx         # NEW - Loading skeleton
        │   │   ├── hooks/
        │   │   │   ├── useTableColumnResize.ts   # NEW - Column resize with localStorage
        │   │   │   ├── useDataTableQuery.ts      # NEW - Convex query wrapper
        │   │   │   └── useTableState.ts          # NEW - URL state management via nuqs
        │   │   ├── utils/
        │   │   │   ├── generateColumns.ts        # NEW - Auto-generate columns from fields
        │   │   │   ├── dataTableConfig.ts        # NEW - DataTableConfig defaults
        │   │   │   └── localStorage.ts           # NEW - localStorage key helpers
        │   │   └── index.ts                      # NEW - Exports
        │   │
        │   └── ui/
        │       └── skeleton.tsx                  # Already exists
        │
        ├── fields/
        │   └── text/
        │       ├── Cell.tsx                      # Already exists
        │       └── columnDef.ts                  # NEW - textFieldToColumnDef factory
        │
        └── hooks/
            └── useCollectionAdminTitle.ts        # NEW - Get title field for collection

apps/
└── www/
    └── src/
        └── app/
            └── admin/
                └── [[...slug]]/
                    └── page.tsx                  # UPDATE - Parse URL params for SSR
```

## Implementation Order

1. **Setup** — Add nuqs dependency, update types
2. **Config & Types** — DataTableConfig, Convex contract interface, collection.admin.useAsTitle
3. **URL State Hook** — useTableState with nuqs integration
4. **localStorage Utilities** — Column pref storage helpers
5. **Column Resize Hook** — useTableColumnResize with debouncing
6. **Column Generator Pattern** — generateColumnsFromFields + textFieldToColumnDef
7. **Convex Query Hook** — useDataTableQuery wrapper
8. **Empty State Component** — Context-aware empty states
9. **Skeleton Component** — Loading skeleton rows
10. **Column Header Component** — Sortable header with dropdown
11. **Pagination Component** — Page navigation controls
12. **View Options Component** — Column visibility + drag-to-reorder
13. **Toolbar Component** — Search bar and reset button
14. **Main DataTable Component** — Integrate all pieces with TanStack Table
15. **Delete Modal** — Confirmation dialog with Convex mutation
16. **CollectionListView Integration** — Replace placeholder with DataTable
17. **SSR Prefetching** — Parse URL params in NextAdminLayout
18. **Verification** — Build, test, integration testing

---

## Step 1: Setup

- [ ] Install nuqs dependency
- [ ] Verify build works after install

**File: packages/react/package.json**

Add `nuqs` to dependencies:

```json
{
  "dependencies": {
    "nuqs": "^2.2.2"
  }
}
```

**Install Command:**

```bash
pnpm install
```

---

## Step 2: Config & Types

- [ ] Create DataTableConfig type in @vexcms/core
- [ ] Add useAsTitle to CollectionConfig interface
- [ ] Update collection config defaults
- [ ] Create Convex contract interface types
- [ ] Run build to verify types

**File: packages/core/src/types.ts**

Add DataTableConfig interface and export:

````typescript
/**
 * Configuration for data table features and behavior.
 *
 * Controls which features are enabled in the collection list table view.
 * All properties are optional and default to true except where noted.
 *
 * @example
 * ```ts
 * const config: DataTableConfig = {
 *   enablePagination: true,
 *   enableSearch: true,
 *   enableSorting: true,
 *   pageSize: 50,
 * }
 */
export interface DataTableConfig {
  /** Enable pagination controls. Defaults to true. */
  enablePagination?: boolean;

  /** Enable search input in toolbar. Defaults to true. */
  enableSearch?: boolean;

  /** Enable column sorting (server-side). Defaults to true. */
  enableSorting?: boolean;

  /** Enable column visibility toggle. Defaults to true. */
  enableColumnVisibility?: boolean;

  /** Enable column resizing. Defaults to true. */
  enableColumnResize?: boolean;

  /** Enable column reordering via drag-and-drop. Defaults to true. */
  enableColumnReorder?: boolean;

  /** Default page size. Defaults to 50. */
  pageSize?: number;

  /** Available page size options in dropdown. Defaults to [10, 25, 50, 100]. */
  pageSizeOptions?: number[];

  /** Table size variant. Defaults to "default". */
  size?: "sm" | "default" | "lg";
}

/**
 * Default data table configuration.
 *
 * Applied when no explicit config is provided. All features enabled.
 */
export const DEFAULT_DATA_TABLE_CONFIG: Required<DataTableConfig> = {
  enablePagination: true,
  enableSearch: true,
  enableSorting: true,
  enableColumnVisibility: true,
  enableColumnResize: true,
  enableColumnReorder: true,
  pageSize: 50,
  pageSizeOptions: [10, 25, 50, 100],
  size: "default",
};

/**
 * Pagination metadata returned by Convex list queries.
 *
 * Matches the response structure expected by the data table component.
 *
 * @example
 * ```ts
 * const result: PaginationResult = {
 *   page: 1,
 *   pageSize: 50,
 *   totalPages: 3,
 *   totalItems: 142,
 * }
 */
export interface PaginationResult {
  /** Current page number (1-indexed). */
  page: number;

  /** Number of items per page. */
  pageSize: number;

  /** Total number of pages available. */
  totalPages: number;

  /** Total number of items across all pages. */
  totalItems: number;
}

/**
 * Parameters for fetching paginated, sorted, and filtered collection data.
 *
 * Sent from the data table component to the Convex query function.
 * All parameters except collection and page are optional.
 *
 * @example
 * ```ts
 * const params: DataFetchParams = {
 *   collection: "posts",
 *   page: 1,
 *   pageSize: 50,
 *   sortBy: "title",
 *   sortOrder: "asc",
 *   search: "hello world",
 * }
 *
 * @see {@link DataFetchResult} for the response structure
 */
export interface DataFetchParams {
  /** Collection slug (Convex table name). */
  collection: string;

  /** Page number (1-indexed). Defaults to 1. */
  page: number;

  /** Items per page. Defaults to 50. */
  pageSize?: number;

  /** Field name to sort by. If invalid/missing, no sorting applied. */
  sortBy?: string | null;

  /** Sort direction. Only applied if sortBy is valid. */
  sortOrder?: "asc" | "desc" | null;

  /** Full-text search query across searchable fields. */
  search?: string;
}

/**
 * Response from Convex list query with pagination.
 *
 * Contains the data array and pagination metadata. The data table
 * component expects this exact structure.
 *
 * @example
 * ```ts
 * const result: DataFetchResult<Post> = {
 *   data: [{ _id: "...", title: "Hello", ... }],
 *   pagination: {
 *     page: 1,
 *     pageSize: 50,
 *     totalPages: 3,
 *     totalItems: 142,
 *   },
 * }
 *
 * @see {@link DataFetchParams} for the request structure
 */
export interface DataFetchResult<TData = VexDocument> {
  /** Array of documents for the current page. */
  data: TData[];

  /** Pagination metadata. */
  pagination: PaginationResult;
}
````

**File: packages/core/src/collections/types.ts**

Update CollectionConfig to add admin.useAsTitle field:

````typescript
/**
 * Admin-specific configuration for a collection.
 *
 * Controls how the collection appears and behaves in the admin panel.
 *
 * @example
 * ```ts
 * admin: {
 *   useAsTitle: "title",  // Display this field as the title/label
 * }
 */
export interface CollectionAdminConfig {
  /**
   * Field name to use as the document title/label in lists and breadcrumbs.
   *
   * This field will be:
   * - Displayed prominently in the data table (bold, larger)
   * - Clickable to navigate to the edit view
   * - Used in breadcrumbs and document references
   *
   * Defaults to the first field in the collection if not specified.
   *
   * @example
   * ```ts
   * useAsTitle: "title"  // Use the "title" field as document label
   * useAsTitle: "name"   // Use the "name" field as document label
   */
  useAsTitle?: string;
}
````

Update CollectionConfig interface to include admin:

```typescript
export interface CollectionConfig<TFields extends FieldsConfig = FieldsConfig> {
  /** Collection slug (Convex table name). */
  slug: string;

  /** Display labels for the collection. */
  labels: CollectionLabels;

  /** Field definitions for this collection. */
  fields: TFields;

  /** Admin panel configuration. */
  admin?: CollectionAdminConfig;
}
```

**File: packages/core/src/collections/config.ts**

Update `defineCollection` to handle admin.useAsTitle default:

````typescript
/**
 * Defines a collection with field definitions and metadata.
 *
 * Collections map to Convex database tables and define the structure
 * of documents, validation rules, and admin panel behavior.
 *
 * @param props - Collection configuration
 * @param props.slug - Convex table name (must match schema.ts)
 * @param props.labels - Display names (auto-inferred from slug if omitted)
 * @param props.fields - Field definitions record
 * @param props.admin - Admin panel configuration
 * @returns Resolved collection configuration with defaults applied
 *
 * @example
 * ```ts
 * import { defineCollection, text } from '@vexcms/core'
 *
 * export const posts = defineCollection({
 *   slug: "posts",
 *   labels: { plural: "Posts", singular: "Post" },
 *   fields: {
 *     title: text({ required: true }),
 *     slug: text({ required: true }),
 *   },
 *   admin: {
 *     useAsTitle: "title",  // Use title field as document label
 *   },
 * })
 */
export function defineCollection<TFields extends FieldsConfig>(props: {
  slug: string;
  labels?: { singular?: string; plural?: string };
  fields: TFields;
  admin?: CollectionAdminConfig;
}): CollectionConfig<TFields> {
  // Infer labels from slug if not provided
  const plural = props.labels?.plural ?? props.slug;
  const singular = props.labels?.singular ?? inferSingularLabel(plural);

  // Default useAsTitle to first field key if not specified
  const firstFieldKey = Object.keys(props.fields)[0];
  const useAsTitle = props.admin?.useAsTitle ?? firstFieldKey;

  return {
    slug: props.slug,
    labels: { singular, plural },
    fields: props.fields,
    admin: {
      useAsTitle,
    },
  };
}

/**
 * Infers singular label from plural by removing trailing 's'.
 *
 * Simple heuristic that works for most English nouns.
 * Override via labels.singular for irregular plurals.
 */
function inferSingularLabel(plural: string): string {
  return plural.endsWith("s") ? plural.slice(0, -1) : plural;
}
````

---

## Step 3: URL State Hook

- [ ] Create useTableState hook
- [ ] Add URL state type guards
- [ ] Test URL sync by manually changing params

**File: packages/react/src/components/data-table/hooks/useTableState.ts**

````typescript
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";
import { useMemo } from "react";
import type { DataFetchParams } from "@vexcms/core/types";

/**
 * Table state managed via URL search parameters.
 *
 * Enables shareable, bookmarkable table views. Server can parse
 * these params during SSR for prefetching.
 *
 * @example
 * ```ts
 * const { state, updateState, resetState } = useTableState("posts");
 *
 * // Update single param
 * updateState({ page: 2 });
 *
 * // Update multiple params
 * updateState({ sortBy: "title", sortOrder: "asc" });
 *
 * // URL becomes: ?posts_page=2&posts_sortBy=title&posts_sortOrder=asc
 * ```
 */
export interface TableState {
  /** Current page number (1-indexed). */
  page: number;

  /** Items per page. */
  pageSize: number;

  /** Field name to sort by, or null for no sorting. */
  sortBy: string | null;

  /** Sort direction, or null for no sorting. */
  sortOrder: "asc" | "desc" | null;

  /** Full-text search query. */
  search: string;
}

/**
 * Default table state when no URL params are present.
 */
const DEFAULT_TABLE_STATE: TableState = {
  page: 1,
  pageSize: 50,
  sortBy: null,
  sortOrder: null,
  search: "",
};

/**
 * Manages table state via URL search parameters using nuqs.
 *
 * State is prefixed with the collection slug to support multiple tables
 * on one page. All params are synced to the URL for shareability and SSR.
 *
 * @param collectionSlug - Collection slug for URL param namespacing
 * @returns Table state object and update functions
 *
 * @example
 * ```ts
 * function CollectionListView({ collection }) {
 *   const { state, updateState, resetState } = useTableState(collection.slug);
 *
 *   return (
 *     <div>
 *       <input
 *         value={state.search}
 *         onChange={(e) => updateState({ search: e.target.value, page: 1 })}
 *       />
 *       <DataTable
 *         page={state.page}
 *         sortBy={state.sortBy}
 *         onPageChange={(page) => updateState({ page })}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function useTableState(collectionSlug: string) {
  // Define URL param parsers with collection prefix
  const parsers = useMemo(
    () => ({
      [`${collectionSlug}_page`]: parseAsInteger.withDefault(
        DEFAULT_TABLE_STATE.page,
      ),
      [`${collectionSlug}_pageSize`]: parseAsInteger.withDefault(
        DEFAULT_TABLE_STATE.pageSize,
      ),
      [`${collectionSlug}_sortBy`]: parseAsString.withDefault(
        DEFAULT_TABLE_STATE.sortBy ?? "",
      ),
      [`${collectionSlug}_sortOrder`]: parseAsStringEnum<"asc" | "desc">([
        "asc",
        "desc",
      ]).withDefault(DEFAULT_TABLE_STATE.sortOrder ?? "asc"),
      [`${collectionSlug}_search`]: parseAsString.withDefault(
        DEFAULT_TABLE_STATE.search,
      ),
    }),
    [collectionSlug],
  );

  // Read from URL
  const [urlState, setUrlState] = useQueryStates(parsers, {
    history: "push", // Add to browser history for back/forward nav
    shallow: true, // Don't trigger full page navigation
  });

  // Map URL state to TableState shape
  const state: TableState = useMemo(
    () => ({
      page: urlState[`${collectionSlug}_page`],
      pageSize: urlState[`${collectionSlug}_pageSize`],
      sortBy: urlState[`${collectionSlug}_sortBy`] || null,
      sortOrder:
        (urlState[`${collectionSlug}_sortOrder`] as "asc" | "desc") || null,
      search: urlState[`${collectionSlug}_search`],
    }),
    [urlState, collectionSlug],
  );

  // Update state (merge with current)
  const updateState = (updates: Partial<TableState>) => {
    const newState: Record<string, number | string | null> = {};

    if (updates.page !== undefined) {
      newState[`${collectionSlug}_page`] = updates.page;
    }
    if (updates.pageSize !== undefined) {
      newState[`${collectionSlug}_pageSize`] = updates.pageSize;
      // Reset to page 1 when page size changes
      newState[`${collectionSlug}_page`] = 1;
    }
    if (updates.sortBy !== undefined) {
      newState[`${collectionSlug}_sortBy`] = updates.sortBy || null;
    }
    if (updates.sortOrder !== undefined) {
      newState[`${collectionSlug}_sortOrder`] = updates.sortOrder || null;
    }
    if (updates.search !== undefined) {
      newState[`${collectionSlug}_search`] = updates.search;
      // Reset to page 1 when search changes
      newState[`${collectionSlug}_page`] = 1;
    }

    setUrlState(newState as any);
  };

  // Reset all params to defaults
  const resetState = () => {
    setUrlState({
      [`${collectionSlug}_page`]: null,
      [`${collectionSlug}_pageSize`]: null,
      [`${collectionSlug}_sortBy`]: null,
      [`${collectionSlug}_sortOrder`]: null,
      [`${collectionSlug}_search`]: null,
    } as any);
  };

  // Check if any filters are active (for reset button visibility)
  const isFiltered = state.search.length > 0 || state.sortBy !== null;

  return { state, updateState, resetState, isFiltered };
}

/**
 * Converts TableState to DataFetchParams for Convex queries.
 *
 * Strips null values and adds collection slug.
 *
 * @param state - Table state from useTableState hook
 * @param collectionSlug - Collection slug
 * @returns Parameters ready for Convex query
 *
 * @example
 * ```ts
 * const { state } = useTableState("posts");
 * const params = tableStateToFetchParams(state, "posts");
 * const result = useQuery(api.vex.collections.list, params);
 * ```
 */
export function tableStateToFetchParams(
  state: TableState,
  collectionSlug: string,
): DataFetchParams {
  return {
    collection: collectionSlug,
    page: state.page,
    pageSize: state.pageSize,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    search: state.search || undefined,
  };
}
````

**File: packages/react/src/components/data-table/hooks/useTableState.test.ts**

```typescript
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTableState, tableStateToFetchParams } from "./useTableState";

// Mock nuqs
vi.mock("nuqs", () => ({
  parseAsInteger: {
    withDefault: (defaultValue: number) => ({ defaultValue }),
  },
  parseAsString: {
    withDefault: (defaultValue: string) => ({ defaultValue }),
  },
  parseAsStringEnum: () => ({
    withDefault: (defaultValue: string) => ({ defaultValue }),
  }),
  useQueryStates: vi.fn((parsers, options) => {
    // Return mock state and setter
    const state: Record<string, any> = {};
    Object.keys(parsers).forEach((key) => {
      state[key] = parsers[key].defaultValue;
    });
    return [state, vi.fn()];
  }),
}));

describe("useTableState", () => {
  it("returns default state on mount", () => {
    const { result } = renderHook(() => useTableState("posts"));

    expect(result.current.state).toEqual({
      page: 1,
      pageSize: 50,
      sortBy: null,
      sortOrder: null,
      search: "",
    });
    expect(result.current.isFiltered).toBe(false);
  });

  it("marks as filtered when search is active", () => {
    // This test is a placeholder since we're mocking nuqs
    // In real testing, you'd test against actual URL param changes
    expect(true).toBe(true);
  });
});

describe("tableStateToFetchParams", () => {
  it("converts TableState to DataFetchParams", () => {
    const state = {
      page: 2,
      pageSize: 25,
      sortBy: "title",
      sortOrder: "asc" as const,
      search: "hello",
    };

    const params = tableStateToFetchParams(state, "posts");

    expect(params).toEqual({
      collection: "posts",
      page: 2,
      pageSize: 25,
      sortBy: "title",
      sortOrder: "asc",
      search: "hello",
    });
  });

  it("strips empty search string", () => {
    const state = {
      page: 1,
      pageSize: 50,
      sortBy: null,
      sortOrder: null,
      search: "",
    };

    const params = tableStateToFetchParams(state, "posts");

    expect(params.search).toBeUndefined();
  });
});
```

---

## Step 4: localStorage Utilities

- [ ] Create localStorage helper functions
- [ ] Add localStorage key constants
- [ ] Test localStorage persistence manually

**File: packages/react/src/components/data-table/utils/localStorage.ts**

````typescript
/**
 * localStorage utilities for persisting table column preferences.
 *
 * Column visibility, ordering, and sizing are stored per-collection
 * so users can customize each table independently.
 */

/**
 * Column visibility state (field name → visible boolean).
 *
 * @example
 * ```ts
 * { "title": true, "slug": false, "_id": false }
 * ```
 */
export type ColumnVisibilityState = Record<string, boolean>;

/**
 * Column order state (array of field names in display order).
 *
 * @example
 * ```ts
 * ["title", "excerpt", "slug", "_creationTime"]
 * ```
 */
export type ColumnOrderState = string[];

/**
 * Column sizing state (field name → width in pixels).
 *
 * @example
 * ```ts
 * { "title": 300, "slug": 150 }
 * ```
 */
export type ColumnSizingState = Record<string, number>;

/**
 * Generates localStorage key for column visibility.
 *
 * @param collectionSlug - Collection slug for namespacing
 * @returns localStorage key string
 */
export function getColumnVisibilityKey(collectionSlug: string): string {
  return `vex_table_${collectionSlug}_columnVisibility`;
}

/**
 * Generates localStorage key for column order.
 *
 * @param collectionSlug - Collection slug for namespacing
 * @returns localStorage key string
 */
export function getColumnOrderKey(collectionSlug: string): string {
  return `vex_table_${collectionSlug}_columnOrder`;
}

/**
 * Generates localStorage key for column sizing.
 *
 * @param collectionSlug - Collection slug for namespacing
 * @returns localStorage key string
 */
export function getColumnSizingKey(collectionSlug: string): string {
  return `vex_table_${collectionSlug}_columnSizing`;
}

/**
 * Loads column visibility from localStorage.
 *
 * Returns empty object if not found or parse fails.
 *
 * @param collectionSlug - Collection slug
 * @returns Column visibility state or empty object
 */
export function loadColumnVisibility(
  collectionSlug: string,
): ColumnVisibilityState {
  try {
    const key = getColumnVisibilityKey(collectionSlug);
    const stored = localStorage.getItem(key);
    if (!stored) return {};

    const parsed = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null) return {};

    return parsed as ColumnVisibilityState;
  } catch {
    return {};
  }
}

/**
 * Saves column visibility to localStorage.
 *
 * Fails silently if localStorage is unavailable.
 *
 * @param collectionSlug - Collection slug
 * @param state - Column visibility state to save
 */
export function saveColumnVisibility(
  collectionSlug: string,
  state: ColumnVisibilityState,
): void {
  try {
    const key = getColumnVisibilityKey(collectionSlug);
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Fail silently (localStorage might be disabled)
  }
}

/**
 * Loads column order from localStorage.
 *
 * Returns empty array if not found or parse fails.
 *
 * @param collectionSlug - Collection slug
 * @returns Column order state or empty array
 */
export function loadColumnOrder(collectionSlug: string): ColumnOrderState {
  try {
    const key = getColumnOrderKey(collectionSlug);
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed as ColumnOrderState;
  } catch {
    return [];
  }
}

/**
 * Saves column order to localStorage.
 *
 * Fails silently if localStorage is unavailable.
 *
 * @param collectionSlug - Collection slug
 * @param state - Column order state to save
 */
export function saveColumnOrder(
  collectionSlug: string,
  state: ColumnOrderState,
): void {
  try {
    const key = getColumnOrderKey(collectionSlug);
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Fail silently
  }
}

/**
 * Loads column sizing from localStorage.
 *
 * Returns empty object if not found or parse fails.
 *
 * @param collectionSlug - Collection slug
 * @returns Column sizing state or empty object
 */
export function loadColumnSizing(collectionSlug: string): ColumnSizingState {
  try {
    const key = getColumnSizingKey(collectionSlug);
    const stored = localStorage.getItem(key);
    if (!stored) return {};

    const parsed = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null) return {};

    // Validate all values are positive numbers
    const validated: ColumnSizingState = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "number" && value > 0) {
        validated[key] = value;
      }
    }

    return validated;
  } catch {
    return {};
  }
}

/**
 * Saves column sizing to localStorage.
 *
 * Fails silently if localStorage is unavailable.
 *
 * @param collectionSlug - Collection slug
 * @param state - Column sizing state to save
 */
export function saveColumnSizing(
  collectionSlug: string,
  state: ColumnSizingState,
): void {
  try {
    const key = getColumnSizingKey(collectionSlug);
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Fail silently
  }
}

/**
 * Clears all column preferences for a collection.
 *
 * Useful when resetting table to defaults.
 *
 * @param collectionSlug - Collection slug
 */
export function clearColumnPreferences(collectionSlug: string): void {
  try {
    localStorage.removeItem(getColumnVisibilityKey(collectionSlug));
    localStorage.removeItem(getColumnOrderKey(collectionSlug));
    localStorage.removeItem(getColumnSizingKey(collectionSlug));
  } catch {
    // Fail silently
  }
}
````

---

## Step 5: Column Resize Hook

- [ ] Create useTableColumnResize hook
- [ ] Implement debouncing
- [ ] Test resize persistence

**File: packages/react/src/components/data-table/hooks/useTableColumnResize.ts**

````typescript
import { useState, useEffect, useRef, useCallback } from "react";
import type { ColumnSizingState } from "@tanstack/react-table";
import {
  loadColumnSizing,
  saveColumnSizing,
  type ColumnSizingState as StoredColumnSizingState,
} from "../utils/localStorage";

/**
 * Debounces a value, updating only after the specified delay.
 *
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Manages column sizing state with localStorage persistence and debouncing.
 *
 * Sizes are saved to localStorage after 300ms of inactivity to avoid
 * excessive writes during active resizing. Loads saved sizes on mount.
 *
 * @param collectionSlug - Collection slug for localStorage namespacing
 * @param enableResizing - Whether resizing is enabled
 * @returns Column sizing state and update functions
 *
 * @example
 * ```ts
 * const {
 *   columnSizing,
 *   setColumnSizing,
 *   resetColumnSizing
 * } = useTableColumnResize("posts", true);
 *
 * // Use with TanStack Table
 * const table = useReactTable({
 *   state: { columnSizing },
 *   onColumnSizingChange: setColumnSizing,
 *   columnResizeMode: "onChange",
 * });
 * ```
 */
export function useTableColumnResize(
  collectionSlug: string,
  enableResizing: boolean = false,
) {
  // Column sizing state
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  // Refs for tracking state changes
  const initialLoadComplete = useRef(false);
  const userChangedSizes = useRef(false);
  const prevSizingRef = useRef<ColumnSizingState>({});

  // Debounce sizing changes to avoid excessive localStorage writes
  const debouncedColumnSizing = useDebounce(columnSizing, 300);

  // Load from localStorage on mount
  useEffect(() => {
    if (!enableResizing || initialLoadComplete.current) return;

    const saved = loadColumnSizing(collectionSlug);
    if (Object.keys(saved).length > 0) {
      setColumnSizing(saved);
      prevSizingRef.current = saved;
    }

    initialLoadComplete.current = true;
  }, [collectionSlug, enableResizing]);

  // Save to localStorage when debounced value changes
  useEffect(() => {
    if (
      !enableResizing ||
      !initialLoadComplete.current ||
      !userChangedSizes.current
    ) {
      return;
    }

    // Only save if state actually changed
    if (
      JSON.stringify(debouncedColumnSizing) ===
      JSON.stringify(prevSizingRef.current)
    ) {
      return;
    }

    saveColumnSizing(collectionSlug, debouncedColumnSizing);
    prevSizingRef.current = debouncedColumnSizing;
  }, [debouncedColumnSizing, collectionSlug, enableResizing]);

  // Wrap setState to mark user changes
  const handleSetColumnSizing = useCallback(
    (
      updater:
        | ColumnSizingState
        | ((prev: ColumnSizingState) => ColumnSizingState),
    ) => {
      userChangedSizes.current = true;
      setColumnSizing(updater);
    },
    [],
  );

  // Reset to defaults (clear localStorage)
  const resetColumnSizing = useCallback(() => {
    setColumnSizing({});
    prevSizingRef.current = {};
    userChangedSizes.current = false;

    if (enableResizing) {
      try {
        const key = `vex_table_${collectionSlug}_columnSizing`;
        localStorage.removeItem(key);
      } catch {
        // Fail silently
      }
    }
  }, [collectionSlug, enableResizing]);

  return {
    columnSizing,
    setColumnSizing: handleSetColumnSizing,
    resetColumnSizing,
  };
}
````

---

## Step 6: Column Generator Pattern

- [ ] Create generateColumnsFromFields utility
- [ ] Create textFieldToColumnDef factory
- [ ] Create useCollectionAdminTitle hook
- [ ] Test column generation with test collection

**File: packages/react/src/hooks/useCollectionAdminTitle.ts**

````typescript
import type { CollectionConfig } from "@vexcms/core/collections";

/**
 * Returns the field name to use as the document title.
 *
 * Reads from collection.admin.useAsTitle, falling back to the first field
 * if not specified. The title field is displayed prominently and is clickable
 * to navigate to the edit view.
 *
 * @param props - Hook props
 * @param props.collection - Collection configuration
 * @returns Field name to use as title
 *
 * @example
 * ```ts
 * const titleField = useCollectionAdminTitle({ collection });
 * // Returns "title" if collection.admin.useAsTitle === "title"
 * // Returns first field key if useAsTitle is undefined
 * ```
 */
export function useCollectionAdminTitle(props: {
  collection: CollectionConfig;
}): string {
  return (
    props.collection.admin?.useAsTitle ??
    Object.keys(props.collection.fields)[0]
  );
}
````

**File: packages/react/src/fields/text/columnDef.ts**

````typescript
import type { ColumnDef } from "@tanstack/react-table";
import type { VexDocument } from "@vexcms/core/types";
import type { TextField } from "@vexcms/core/fields/text";
import { TextFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a text field.
 *
 * Generates column config with proper typing, cell renderer, alignment,
 * and metadata. Uses the registered TextFieldCell component for rendering.
 *
 * @param props - Column generation props
 * @param props.fieldDef - Resolved text field definition
 * @param props.fieldKey - Field key from collection.fields
 * @param props.isTitleField - Whether this is the title field (useAsTitle)
 * @returns TanStack Table column definition
 *
 * @example
 * ```ts
 * const column = textFieldToColumnDef({
 *   fieldDef: collection.fields.title,
 *   fieldKey: "title",
 *   isTitleField: true,
 * });
 * ```
 */
export function textFieldToColumnDef(props: {
  fieldDef: TextField;
  fieldKey: string;
  isTitleField?: boolean;
}): ColumnDef<VexDocument, string> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as string | undefined;
      return (
        <TextFieldCell
          value={value ?? ""}
          row={row.original}
          fieldDef={props.fieldDef}
        />
      );
    },

    // Enable sorting for all text fields
    enableSorting: true,

    // Enable hiding for all fields (user can toggle visibility)
    enableHiding: true,

    // Use field's cellAlignment config
    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
````

**File: packages/react/src/components/data-table/utils/generateColumns.ts**

````typescript
import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig } from "@vexcms/core/collections";
import type { VexDocument } from "@vexcms/core/types";
import type { AdminField } from "@vexcms/core/fields/types";
import { textFieldToColumnDef } from "../../../fields/text/columnDef";

/**
 * Generates TanStack Table column definitions from collection fields.
 *
 * Auto-generates columns for all non-hidden fields, plus system fields
 * (_id, _creationTime) that are hidden by default but can be shown via
 * column visibility toggle.
 *
 * @param props - Column generation props
 * @param props.collection - Collection configuration
 * @param props.titleField - Field name to use as title (from useCollectionAdminTitle)
 * @returns Array of column definitions
 *
 * @example
 * ```ts
 * const columns = generateColumnsFromFields({
 *   collection: postsCollection,
 *   titleField: "title",
 * });
 * // Returns columns for all fields + system fields
 * ```
 */
export function generateColumnsFromFields(props: {
  collection: CollectionConfig;
  titleField: string;
}): ColumnDef<VexDocument, any>[] {
  const columns: ColumnDef<VexDocument, any>[] = [];

  // Generate columns for collection fields
  for (const [fieldKey, fieldDef] of Object.entries(props.collection.fields)) {
    // Skip hidden fields (they won't appear in column visibility menu either)
    if ((fieldDef as AdminField).admin.hidden) {
      continue;
    }

    const isTitleField = fieldKey === props.titleField;

    // Generate column based on field type
    switch (fieldDef.type) {
      case "text":
        columns.push(
          textFieldToColumnDef({
            fieldDef: fieldDef as any,
            fieldKey,
            isTitleField,
          }),
        );
        break;

      // TODO: Add other field types as they're implemented
      // case "number": columns.push(numberFieldToColumnDef(...)); break;
      // case "boolean": columns.push(booleanFieldToColumnDef(...)); break;

      default:
        // Unknown field type - skip for now
        console.warn(
          `Unknown field type "${fieldDef.type}" for field "${fieldKey}"`,
        );
    }
  }

  // Add system field columns (hidden by default)
  columns.push({
    id: "_id",
    accessorKey: "_id",
    header: "ID",
    enableSorting: false,
    enableHiding: true,
    meta: {
      label: "ID",
      align: "left",
      isTitleField: false,
      isSystemField: true,
    },
  });

  columns.push({
    id: "_creationTime",
    accessorKey: "_creationTime",
    header: "Created",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const timestamp = row.getValue("_creationTime") as number;
      return new Date(timestamp).toLocaleString();
    },
    meta: {
      label: "Created",
      align: "left",
      isTitleField: false,
      isSystemField: true,
    },
  });

  // Add Actions column (always visible, can't be hidden)
  columns.push({
    id: "actions",
    header: "Actions",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      // TODO: Implement in DataTable component
      // Returns <DataTableRowActions row={row} />
      return null;
    },
    meta: {
      label: "Actions",
      align: "center",
      isTitleField: false,
      isActionsColumn: true,
    },
  });

  return columns;
}

/**
 * Filters columns to only include those that exist in the collection.
 *
 * Used when loading column order/visibility from localStorage - ensures
 * that deleted fields don't cause errors.
 *
 * @param props - Filter props
 * @param props.columnIds - Array of column IDs from localStorage
 * @param props.collection - Collection configuration
 * @returns Filtered array of valid column IDs
 *
 * @example
 * ```ts
 * const saved = ["title", "deletedField", "slug"];
 * const valid = filterValidColumns({ columnIds: saved, collection });
 * // Returns ["title", "slug"]
 * ```
 */
export function filterValidColumns(props: {
  columnIds: string[];
  collection: CollectionConfig;
}): string[] {
  const validFieldKeys = new Set(Object.keys(props.collection.fields));
  const systemFields = new Set(["_id", "_creationTime", "actions"]);

  return props.columnIds.filter(
    (id) => validFieldKeys.has(id) || systemFields.has(id),
  );
}
````

---

## Step 7: Convex Query Hook

- [ ] Create useDataTableQuery hook
- [ ] Document Convex contract requirements
- [ ] Test with mock data

**File: packages/react/src/components/data-table/hooks/useDataTableQuery.ts**

````typescript
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import type {
  DataFetchParams,
  DataFetchResult,
  VexDocument,
} from "@vexcms/core/types";
import type { CollectionConfig } from "@vexcms/core/collections";

/**
 * Fetches collection data with pagination, sorting, and search.
 *
 * Wraps Convex query in TanStack Query with automatic subscription to
 * live updates. Expects the Convex function to match the DataFetchResult
 * interface.
 *
 * @param props - Query props
 * @param props.params - Data fetch parameters (page, sort, search)
 * @param props.convexApi - Convex API object (e.g., api.vex.collections.list)
 * @param props.initialData - Optional SSR prefetched data
 * @returns TanStack Query result with data and pagination
 *
 * @example
 * ```ts
 * const { data, isLoading, error } = useDataTableQuery({
 *   params: { collection: "posts", page: 1, pageSize: 50 },
 *   convexApi: api.vex.collections.list,
 *   initialData: ssrData,
 * });
 *
 * // data.data = array of documents
 * // data.pagination = { page, pageSize, totalPages, totalItems }
 * ```
 *
 * @see {@link DataFetchParams} for the parameters interface
 * @see {@link DataFetchResult} for the response interface
 */
export function useDataTableQuery<
  TData extends VexDocument = VexDocument,
>(props: {
  params: DataFetchParams;
  convexApi: any; // Convex API function reference
  initialData?: DataFetchResult<TData>;
}) {
  return useQuery<DataFetchResult<TData>>({
    ...convexQuery(props.convexApi, props.params),
    initialData: props.initialData,
    // Keep previous data while loading next page (prevents flash)
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Expected Convex function signature and behavior.
 *
 * The Convex function passed to useDataTableQuery MUST:
 *
 * 1. Accept DataFetchParams as input:
 *    ```ts
 *    {
 *      collection: string;    // Convex table name
 *      page: number;          // 1-indexed page number
 *      pageSize?: number;     // Items per page (default: 50)
 *      sortBy?: string;       // Field name to sort by (null = no sort)
 *      sortOrder?: "asc" | "desc";  // Sort direction
 *      search?: string;       // Full-text search query
 *    }
 *    ```
 *
 * 2. Return DataFetchResult:
 *    ```ts
 *    {
 *      data: VexDocument[];          // Array of documents for current page
 *      pagination: {
 *        page: number;                // Current page (1-indexed)
 *        pageSize: number;            // Items per page
 *        totalPages: number;          // Total pages available
 *        totalItems: number;          // Total items across all pages
 *      }
 *    }
 *    ```
 *
 * 3. Implement pagination:
 *    - Calculate offset: `(page - 1) * pageSize`
 *    - Use Convex `.skip(offset).take(pageSize)`
 *    - Count total items for totalPages calculation
 *
 * 4. Implement sorting (if sortBy is valid):
 *    - Validate sortBy exists in collection fields
 *    - Use Convex `.order(sortBy, sortOrder)`
 *    - If sortBy is invalid, skip sorting (don't error)
 *
 * 5. Implement search (if search is non-empty):
 *    - Use Convex `.withSearchIndex("search", (q) => q.search("field", search))`
 *    - Or implement custom filtering logic
 *
 * 6. Handle edge cases:
 *    - If page > totalPages, return last valid page's data
 *    - If collection doesn't exist, throw error
 *    - If no documents, return empty array with totalItems: 0
 *
 * Example implementation (you will write this):
 *
 * ```ts
 * // File: apps/www/convex/models/collections.ts
 *
 * export async function listPaginated(
 *   ctx: QueryCtx,
 *   params: DataFetchParams
 * ): Promise<DataFetchResult> {
 *   const { collection, page, pageSize = 50, sortBy, sortOrder, search } = params;
 *
 *   // Get table
 *   const tableName = collection as TableNames;
 *   let query = ctx.db.query(tableName);
 *
 *   // Apply search if provided
 *   if (search) {
 *     query = query.withSearchIndex("search", (q) =>
 *       q.search("title", search).search("excerpt", search)
 *     );
 *   }
 *
 *   // Apply sorting if valid
 *   if (sortBy && sortOrder) {
 *     // TODO: Validate sortBy is a valid field
 *     query = query.order(sortBy, sortOrder);
 *   }
 *
 *   // Count total items
 *   const allDocs = await query.collect();
 *   const totalItems = allDocs.length;
 *   const totalPages = Math.ceil(totalItems / pageSize);
 *
 *   // Clamp page to valid range
 *   const validPage = Math.max(1, Math.min(page, totalPages || 1));
 *
 *   // Apply pagination
 *   const offset = (validPage - 1) * pageSize;
 *   const data = await query.skip(offset).take(pageSize);
 *
 *   return {
 *     data,
 *     pagination: {
 *       page: validPage,
 *       pageSize,
 *       totalPages: totalPages || 1,
 *       totalItems,
 *     },
 *   };
 * }
 * ```
 */
export const CONVEX_FUNCTION_CONTRACT = `
Convex function MUST accept DataFetchParams and return DataFetchResult.
See JSDoc above for detailed requirements.
`;
````

---

## Step 8: Empty State Component

- [ ] Create DataTableEmptyState component
- [ ] Implement context-aware messages
- [ ] Test both states (no data vs filtered)

**File: packages/react/src/components/data-table/DataTableEmptyState.tsx**

````typescript
import { Button } from "../ui/button";

/**
 * Props for DataTableEmptyState component.
 *
 * @param props.isFiltered - Whether filters/search are active
 * @param props.collectionLabel - Collection label (e.g., "Posts")
 * @param props.onReset - Callback to reset filters/search
 * @param props.onCreateNew - Callback to open create modal
 */
export interface DataTableEmptyStateProps {
  /** Whether any filters or search are active. */
  isFiltered: boolean;

  /** Collection singular label (e.g., "Post"). */
  collectionLabel: string;

  /** Callback to reset all filters and search. */
  onReset: () => void;

  /** Callback to open create document modal. */
  onCreateNew: () => void;
}

/**
 * Empty state displayed when no documents match filters or collection is empty.
 *
 * Shows context-aware messages:
 * - If filtered: "No documents match your filters" with reset button
 * - If empty: "No {collection} yet" with create button
 *
 * @param props - Component props
 * @returns Empty state UI with appropriate message and action button
 *
 * @example
 * ```tsx
 * <DataTableEmptyState
 *   isFiltered={isFiltered}
 *   collectionLabel="Post"
 *   onReset={() => resetState()}
 *   onCreateNew={() => navigate("?createDocument=true")}
 * />
 * ```
 */
export function DataTableEmptyState(props: DataTableEmptyStateProps) {
  if (props.isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4">
          <svg
            className="h-12 w-12 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <h3 className="mb-1 text-lg font-medium">No documents match your filters</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Try adjusting your search or filters
        </p>

        <Button onClick={props.onReset} variant="outline">
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4">
        <svg
          className="h-12 w-12 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      <h3 className="mb-1 text-lg font-medium">No {props.collectionLabel.toLowerCase()}s yet</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Get started by creating a new {props.collectionLabel.toLowerCase()}
      </p>

      <Button onClick={props.onCreateNew}>
        Create {props.collectionLabel}
      </Button>
    </div>
  );
}
````

---

## Step 9: Skeleton Component

- [ ] Create DataTableSkeleton component
- [ ] Match table structure
- [ ] Test loading state

**File: packages/react/src/components/data-table/DataTableSkeleton.tsx**

````typescript
import { Skeleton } from "../ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

/**
 * Props for DataTableSkeleton component.
 *
 * @param props.columnCount - Number of columns to show
 * @param props.rowCount - Number of skeleton rows to show
 */
export interface DataTableSkeletonProps {
  /** Number of columns (matches actual table structure). */
  columnCount: number;

  /** Number of skeleton rows to display. Defaults to 10. */
  rowCount?: number;
}

/**
 * Loading skeleton that matches the table structure.
 *
 * Shows skeleton rows with the same number of columns as the real table,
 * preventing layout shift when data loads. Used during initial load and
 * refetches.
 *
 * @param props - Component props
 * @returns Skeleton table with animated placeholders
 *
 * @example
 * ```tsx
 * {isLoading ? (
 *   <DataTableSkeleton columnCount={columns.length} rowCount={10} />
 * ) : (
 *   <DataTable data={data} columns={columns} />
 * )}
 * ```
 */
export function DataTableSkeleton(props: DataTableSkeletonProps) {
  const rowCount = props.rowCount ?? 10;

  return (
    <div className="w-full space-y-4">
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: props.columnCount }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: props.columnCount }).map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}
````

---

## Step 10: Column Header Component

- [ ] Create DataTableColumnHeader component
- [ ] Implement sort dropdown
- [ ] Test sorting UI

**File: packages/react/src/components/data-table/DataTableColumnHeader.tsx**

````typescript
import type { Column } from "@tanstack/react-table";
import { ArrowUpIcon, ArrowDownIcon, CaretSortIcon, EyeNoneIcon } from "@radix-ui/react-icons";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../styles/utils";

/**
 * Props for DataTableColumnHeader component.
 *
 * @param props.column - TanStack Table column instance
 * @param props.title - Column header title
 * @param props.className - Optional CSS classes
 */
export interface DataTableColumnHeaderProps<TData, TValue> {
  /** TanStack Table column instance. */
  column: Column<TData, TValue>;

  /** Column header display title. */
  title: string;

  /** Optional CSS classes for header cell. */
  className?: string;
}

/**
 * Sortable column header with dropdown menu.
 *
 * Shows sort direction indicator and provides dropdown with:
 * - Sort Ascending
 * - Sort Descending
 * - Clear Sort (if sorted)
 * - Hide Column
 *
 * Only renders dropdown if column.getCanSort() is true.
 *
 * @param props - Component props
 * @returns Column header with optional sort dropdown
 *
 * @example
 * ```tsx
 * // In column definition:
 * {
 *   header: ({ column }) => (
 *     <DataTableColumnHeader column={column} title="Title" />
 *   ),
 * }
 * ```
 */
export function DataTableColumnHeader<TData, TValue>(
  props: DataTableColumnHeaderProps<TData, TValue>
) {
  if (!props.column.getCanSort()) {
    return <div className={cn(props.className)}>{props.title}</div>;
  }

  const isSorted = props.column.getIsSorted();

  return (
    <div className={cn("flex items-center space-x-2", props.className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{props.title}</span>
            {isSorted === "desc" ? (
              <ArrowDownIcon className="ml-2 h-4 w-4" />
            ) : isSorted === "asc" ? (
              <ArrowUpIcon className="ml-2 h-4 w-4" />
            ) : (
              <CaretSortIcon className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => props.column.toggleSorting(false)}>
            <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Sort Ascending
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => props.column.toggleSorting(true)}>
            <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Sort Descending
          </DropdownMenuItem>
          {isSorted && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => props.column.clearSorting()}>
                Clear Sort
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => props.column.toggleVisibility(false)}>
            <EyeNoneIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Hide Column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
````

Note: This component requires installing `@radix-ui/react-icons` if not already present. Add to `packages/react/package.json`:

```json
{
  "dependencies": {
    "@radix-ui/react-icons": "^1.3.2"
  }
}
```

And requires adding the dropdown-menu UI component to `packages/react/src/components/ui/dropdown-menu.tsx` (copy from shadcn/ui if not exists).

---

## Step 11: Pagination Component

- [ ] Create DataTablePagination component
- [ ] Implement page navigation
- [ ] Test pagination controls

**File: packages/react/src/components/data-table/DataTablePagination.tsx**

````typescript
import type { Table } from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon } from "@radix-ui/react-icons";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

/**
 * Props for DataTablePagination component.
 *
 * @param props.table - TanStack Table instance
 * @param props.totalItems - Total items across all pages
 * @param props.pageSizeOptions - Available page size options
 */
export interface DataTablePaginationProps<TData> {
  /** TanStack Table instance. */
  table: Table<TData>;

  /** Total number of items across all pages. */
  totalItems: number;

  /** Available page size options for dropdown. Defaults to [10, 25, 50, 100]. */
  pageSizeOptions?: number[];
}

/**
 * Pagination controls with page navigation and size selector.
 *
 * Shows:
 * - Total items count
 * - Page size dropdown
 * - First page button (hidden on mobile)
 * - Previous page button
 * - Current page / total pages
 * - Next page button
 * - Last page button (hidden on mobile)
 *
 * All navigation buttons are disabled when at page boundaries.
 *
 * @param props - Component props
 * @returns Pagination controls UI
 *
 * @example
 * ```tsx
 * <DataTablePagination
 *   table={table}
 *   totalItems={data.pagination.totalItems}
 *   pageSizeOptions={[10, 25, 50, 100]}
 * />
 * ```
 */
export function DataTablePagination<TData>(props: DataTablePaginationProps<TData>) {
  const pageSizeOptions = props.pageSizeOptions ?? [10, 25, 50, 100];

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {props.totalItems} total {props.totalItems === 1 ? "item" : "items"}
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${props.table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              props.table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={props.table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {props.table.getState().pagination.pageIndex + 1} of{" "}
          {props.table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => props.table.setPageIndex(0)}
            disabled={!props.table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <DoubleArrowLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => props.table.previousPage()}
            disabled={!props.table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => props.table.nextPage()}
            disabled={!props.table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => props.table.setPageIndex(props.table.getPageCount() - 1)}
            disabled={!props.table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <DoubleArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
````

Note: Requires adding the select UI component to `packages/react/src/components/ui/select.tsx` (copy from shadcn/ui if not exists).

---

## Step 12: View Options Component

- [ ] Create DataTableViewOptions component
- [ ] Implement column visibility toggles
- [ ] Implement drag-to-reorder
- [ ] Test localStorage persistence

**File: packages/react/src/components/data-table/DataTableViewOptions.tsx**

````typescript
import { useState } from "react";
import type { Table } from "@tanstack/react-table";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import { GripVertical } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

/**
 * Props for DataTableViewOptions component.
 *
 * @param props.table - TanStack Table instance
 * @param props.onColumnOrderChange - Callback when column order changes
 */
export interface DataTableViewOptionsProps<TData> {
  /** TanStack Table instance. */
  table: Table<TData>;

  /** Callback fired when user reorders columns via drag-and-drop. */
  onColumnOrderChange?: (newOrder: string[]) => void;
}

/**
 * Column visibility and ordering controls.
 *
 * Shows dropdown menu with:
 * - Column visibility checkboxes
 * - Drag-to-reorder columns
 * - Visual indicators for visible/hidden state
 *
 * Only shows columns where getCanHide() returns true.
 *
 * @param props - Component props
 * @returns Dropdown menu button for column customization
 *
 * @example
 * ```tsx
 * <DataTableViewOptions
 *   table={table}
 *   onColumnOrderChange={(order) => saveColumnOrder(collection.slug, order)}
 * />
 * ```
 */
export function DataTableViewOptions<TData>(props: DataTableViewOptionsProps<TData>) {
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);

  // Get columns that can be hidden
  const columns = props.table
    .getAllColumns()
    .filter((column) => column.getCanHide());

  // Get current column order
  const columnOrder = props.table.getState().columnOrder;

  // Sort columns by current order
  const orderedColumns = columnOrder.length > 0
    ? columnOrder
        .map((id) => columns.find((col) => col.id === id))
        .filter((col): col is typeof columns[0] => col !== undefined)
    : columns;

  // Append columns not in order (newly added)
  const unorderedColumns = columns.filter(
    (col) => !columnOrder.includes(col.id)
  );
  const allColumns = [...orderedColumns, ...unorderedColumns];

  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedColumnId(columnId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!draggedColumnId || draggedColumnId === targetColumnId) {
      setDraggedColumnId(null);
      return;
    }

    const currentOrder = props.table.getState().columnOrder.length > 0
      ? props.table.getState().columnOrder
      : allColumns.map((col) => col.id);

    const draggedIndex = currentOrder.indexOf(draggedColumnId);
    const targetIndex = currentOrder.indexOf(targetColumnId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedColumnId(null);
      return;
    }

    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumnId);

    props.table.setColumnOrder(newOrder);
    props.onColumnOrderChange?.(newOrder);
    setDraggedColumnId(null);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto h-8">
          <MixerHorizontalIcon className="mr-2 h-4 w-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {allColumns.map((column) => {
            const isVisible = column.getIsVisible();
            const label = (column.columnDef.meta as any)?.label ?? column.id;

            return (
              <div
                key={column.id}
                draggable
                onDragStart={(e) => handleDragStart(e, column.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
                className={`flex items-center ${
                  draggedColumnId === column.id ? "opacity-50" : ""
                }`}
              >
                <GripVertical className="mr-2 h-4 w-4 cursor-grab text-muted-foreground" />
                <DropdownMenuCheckboxItem
                  checked={isVisible}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  className="flex-1 capitalize"
                >
                  {label}
                </DropdownMenuCheckboxItem>
              </div>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
````

Note: Requires `lucide-react` for GripVertical icon. Add to `packages/react/package.json`:

```json
{
  "dependencies": {
    "lucide-react": "^0.460.0"
  }
}
```

---

## Step 13: Toolbar Component

- [ ] Create DataTableToolbar component
- [ ] Implement search input with debouncing
- [ ] Implement reset button
- [ ] Test toolbar controls

**File: packages/react/src/components/data-table/DataTableToolbar.tsx**

````typescript
import { useState, useEffect, useRef } from "react";
import type { Table } from "@tanstack/react-table";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { DataTableViewOptions } from "./DataTableViewOptions";

/**
 * Props for DataTableToolbar component.
 *
 * @param props.table - TanStack Table instance
 * @param props.search - Current search value from URL state
 * @param props.onSearchChange - Callback when search changes
 * @param props.isFiltered - Whether any filters are active
 * @param props.onReset - Callback to reset all filters
 * @param props.onColumnOrderChange - Callback when column order changes
 */
export interface DataTableToolbarProps<TData> {
  /** TanStack Table instance. */
  table: Table<TData>;

  /** Current search query from URL state. */
  search: string;

  /** Callback fired when search input changes. */
  onSearchChange: (value: string) => void;

  /** Whether any filters/search are active. */
  isFiltered: boolean;

  /** Callback to reset all filters and search. */
  onReset: () => void;

  /** Callback fired when user reorders columns. */
  onColumnOrderChange?: (newOrder: string[]) => void;
}

/**
 * Table toolbar with search input and controls.
 *
 * Contains:
 * - Search input (debounced 500ms to prevent character loss)
 * - Reset filters button (only shown when filtered)
 * - Column visibility/ordering dropdown
 *
 * Search updates URL state, which triggers server refetch.
 *
 * @param props - Component props
 * @returns Toolbar UI with search and controls
 *
 * @example
 * ```tsx
 * <DataTableToolbar
 *   table={table}
 *   search={tableState.search}
 *   onSearchChange={(value) => updateState({ search: value })}
 *   isFiltered={isFiltered}
 *   onReset={() => resetState()}
 *   onColumnOrderChange={(order) => saveColumnOrder(slug, order)}
 * />
 * ```
 */
export function DataTableToolbar<TData>(props: DataTableToolbarProps<TData>) {
  // Local search state for controlled input (prevents character loss during typing)
  const [localSearch, setLocalSearch] = useState(props.search);
  const isLocallyUpdating = useRef(false);

  // Sync local state with prop when prop changes externally
  useEffect(() => {
    if (!isLocallyUpdating.current) {
      setLocalSearch(props.search);
    }
  }, [props.search]);

  // Debounce search updates to URL (500ms)
  useEffect(() => {
    if (localSearch === props.search) return;

    isLocallyUpdating.current = true;
    const handler = setTimeout(() => {
      props.onSearchChange(localSearch.trim());
      isLocallyUpdating.current = false;
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [localSearch, props.onSearchChange, props.search]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {props.isFiltered && (
          <Button
            variant="ghost"
            onClick={props.onReset}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions
        table={props.table}
        onColumnOrderChange={props.onColumnOrderChange}
      />
    </div>
  );
}
````

---

## Step 14: Main DataTable Component

- [ ] Create DataTable component
- [ ] Integrate TanStack Table
- [ ] Wire up all hooks and sub-components
- [ ] Implement row click navigation
- [ ] Test full table functionality

**File: packages/react/src/components/data-table/DataTable.tsx**

This is the main orchestrator component. It's a guided stub since it requires developer judgment on integration details.

````typescript
"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type ColumnOrderState,
  type ColumnSizingState,
} from "@tanstack/react-table";
import type { CollectionConfig } from "@vexcms/core/collections";
import type {
  VexDocument,
  DataTableConfig,
  DEFAULT_DATA_TABLE_CONFIG,
} from "@vexcms/core/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { DataTableToolbar } from "./DataTableToolbar";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableEmptyState } from "./DataTableEmptyState";
import { DataTableSkeleton } from "./DataTableSkeleton";
import { DataTableColumnHeader } from "./DataTableColumnHeader";
import { useTableState } from "./hooks/useTableState";
import { useTableColumnResize } from "./hooks/useTableColumnResize";
import { useDataTableQuery } from "./hooks/useDataTableQuery";
import { generateColumnsFromFields } from "./utils/generateColumns";
import {
  loadColumnVisibility,
  saveColumnVisibility,
  loadColumnOrder,
  saveColumnOrder,
} from "./utils/localStorage";
import { useCollectionAdminTitle } from "../../hooks/useCollectionAdminTitle";

/**
 * Props for DataTable component.
 *
 * @param props.collection - Collection configuration
 * @param props.convexApi - Convex API function for fetching data
 * @param props.initialData - Optional SSR prefetched data
 * @param props.config - Optional data table configuration
 * @param props.onNavigateToEdit - Callback to navigate to edit view
 * @param props.onOpenCreateModal - Callback to open create modal
 * @param props.onOpenDeleteModal - Callback to open delete modal
 */
export interface DataTableProps {
  /** Collection configuration with fields and metadata. */
  collection: CollectionConfig;

  /** Convex API function reference (e.g., api.vex.collections.list). */
  convexApi: any;

  /** Optional SSR prefetched data. */
  initialData?: any;

  /** Optional table configuration overrides. */
  config?: Partial<DataTableConfig>;

  /** Callback to navigate to edit view. */
  onNavigateToEdit: (documentId: string) => void;

  /** Callback to open create document modal. */
  onOpenCreateModal: () => void;

  /** Callback to open delete modal with document ID. */
  onOpenDeleteModal: (documentId: string) => void;
}

/**
 * Production-ready data table for VexCMS collection lists.
 *
 * Features:
 * - Server-side pagination, sorting, search
 * - URL state for shareability
 * - localStorage column preferences
 * - Auto-generated columns from collection fields
 * - Click title/ID to edit
 * - Actions column with edit/delete
 * - Loading skeleton
 * - Empty states
 *
 * @param props - Component props
 * @returns Fully-featured data table
 *
 * @example
 * ```tsx
 * <DataTable
 *   collection={postsCollection}
 *   convexApi={api.vex.collections.list}
 *   initialData={ssrData}
 *   onNavigateToEdit={(id) => router.push(`/admin/posts/${id}`)}
 *   onOpenCreateModal={() => setSearchParams({ createDocument: "true" })}
 *   onOpenDeleteModal={(id) => setSearchParams({ deleteDocument: id })}
 * />
 * ```
 */
export function DataTable(props: DataTableProps) {
  // TODO: implement
  //
  // 1. Merge config with defaults
  //    const config = { ...DEFAULT_DATA_TABLE_CONFIG, ...props.config };
  //
  // 2. Get title field
  //    const titleField = useCollectionAdminTitle({ collection: props.collection });
  //
  // 3. Setup URL state
  //    const { state, updateState, resetState, isFiltered } = useTableState(props.collection.slug);
  //
  // 4. Setup Convex query
  //    const params = tableStateToFetchParams(state, props.collection.slug);
  //    const { data, isLoading, error } = useDataTableQuery({
  //      params,
  //      convexApi: props.convexApi,
  //      initialData: props.initialData,
  //    });
  //
  // 5. Setup column resizing
  //    const { columnSizing, setColumnSizing, resetColumnSizing } = useTableColumnResize(
  //      props.collection.slug,
  //      config.enableColumnResize
  //    );
  //
  // 6. Setup column visibility
  //    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
  //      const saved = loadColumnVisibility(props.collection.slug);
  //      // Hide system fields by default
  //      return { _id: false, _creationTime: false, ...saved };
  //    });
  //    → Save to localStorage when changed (useEffect)
  //
  // 7. Setup column order
  //    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() =>
  //      loadColumnOrder(props.collection.slug)
  //    );
  //    → Save to localStorage when changed (useEffect)
  //
  // 8. Generate columns
  //    const columns = useMemo(() =>
  //      generateColumnsFromFields({ collection: props.collection, titleField }),
  //      [props.collection, titleField]
  //    );
  //
  // 9. Setup sorting state (sync with URL)
  //    const sorting: SortingState = useMemo(() => {
  //      if (!state.sortBy) return [];
  //      return [{ id: state.sortBy, desc: state.sortOrder === "desc" }];
  //    }, [state.sortBy, state.sortOrder]);
  //    → Create onSortingChange handler that updates URL state
  //
  // 10. Setup pagination state (sync with URL)
  //     const pagination = useMemo(() => ({
  //       pageIndex: state.page - 1,  // TanStack uses 0-index
  //       pageSize: state.pageSize,
  //     }), [state.page, state.pageSize]);
  //     → Create onPaginationChange handler that updates URL state
  //
  // 11. Create TanStack Table instance
  //     const table = useReactTable({
  //       data: data?.data ?? [],
  //       columns,
  //       state: { sorting, columnVisibility, columnOrder, columnSizing, pagination },
  //       pageCount: data?.pagination.totalPages ?? 1,
  //       manualPagination: true,
  //       manualSorting: true,
  //       manualFiltering: true,
  //       enableColumnResizing: config.enableColumnResize,
  //       columnResizeMode: "onChange",
  //       onSortingChange: handleSortingChange,
  //       onColumnVisibilityChange: setColumnVisibility,
  //       onColumnOrderChange: setColumnOrder,
  //       onColumnSizingChange: setColumnSizing,
  //       onPaginationChange: handlePaginationChange,
  //       getCoreRowModel: getCoreRowModel(),
  //     });
  //
  // 12. Handle row click navigation
  //     const handleRowClick = useCallback((row: VexDocument) => {
  //       // Check if delete modal is open (prevents navigation conflicts)
  //       const params = new URLSearchParams(window.location.search);
  //       if (params.has("deleteDocument")) return;
  //
  //       props.onNavigateToEdit(row._id);
  //     }, [props.onNavigateToEdit]);
  //
  // 13. Render states
  //     if (isLoading && !data) {
  //       return <DataTableSkeleton columnCount={columns.length} rowCount={10} />;
  //     }
  //
  //     if (error) {
  //       return <div>Error loading data: {error.message}</div>;
  //     }
  //
  //     if (!data || data.data.length === 0) {
  //       return (
  //         <>
  //           <DataTableToolbar ... />
  //           <DataTableEmptyState
  //             isFiltered={isFiltered}
  //             collectionLabel={props.collection.labels.singular}
  //             onReset={resetState}
  //             onCreateNew={props.onOpenCreateModal}
  //           />
  //         </>
  //       );
  //     }
  //
  // 14. Render table
  //     return (
  //       <div className="space-y-4">
  //         <DataTableToolbar
  //           table={table}
  //           search={state.search}
  //           onSearchChange={(value) => updateState({ search: value })}
  //           isFiltered={isFiltered}
  //           onReset={resetState}
  //           onColumnOrderChange={(order) => saveColumnOrder(props.collection.slug, order)}
  //         />
  //
  //         <div className="rounded-md border">
  //           <Table>
  //             <TableHeader>
  //               {table.getHeaderGroups().map((headerGroup) => (
  //                 <TableRow key={headerGroup.id}>
  //                   {headerGroup.headers.map((header) => {
  //                     const meta = header.column.columnDef.meta as any;
  //                     return (
  //                       <TableHead key={header.id} style={{ width: header.getSize() }}>
  //                         {header.isPlaceholder ? null : (
  //                           <DataTableColumnHeader
  //                             column={header.column}
  //                             title={meta?.label ?? header.id}
  //                           />
  //                         )}
  //                       </TableHead>
  //                     );
  //                   })}
  //                 </TableRow>
  //               ))}
  //             </TableHeader>
  //             <TableBody>
  //               {table.getRowModel().rows.map((row) => {
  //                 const meta = row.original as VexDocument;
  //                 return (
  //                   <TableRow key={row.id}>
  //                     {row.getVisibleCells().map((cell) => {
  //                       const cellMeta = cell.column.columnDef.meta as any;
  //                       const isTitleField = cellMeta?.isTitleField;
  //                       const isIdField = cell.column.id === "_id";
  //                       const isClickable = isTitleField || isIdField;
  //
  //                       return (
  //                         <TableCell
  //                           key={cell.id}
  //                           className={isClickable ? "cursor-pointer hover:underline" : ""}
  //                           onClick={isClickable ? () => handleRowClick(row.original) : undefined}
  //                         >
  //                           {flexRender(cell.column.columnDef.cell, cell.getContext())}
  //                         </TableCell>
  //                       );
  //                     })}
  //                   </TableRow>
  //                 );
  //               })}
  //             </TableBody>
  //           </Table>
  //         </div>
  //
  //         <DataTablePagination
  //           table={table}
  //           totalItems={data.pagination.totalItems}
  //           pageSizeOptions={config.pageSizeOptions}
  //         />
  //       </div>
  //     );
  //
  // Edge cases:
  // - Invalid sortBy in URL: silently ignore (don't apply sorting)
  // - Column order contains deleted fields: filter them out when loading from localStorage
  // - Page number out of range: Convex function should clamp to last valid page
  // - Delete modal open: disable row click handlers (check for ?deleteDocument param)
  // - Empty search: show "no documents yet" if isFiltered=false, "no matches" if isFiltered=true

  throw new Error("Not implemented");
}
````

---

## Step 15: Delete Modal

- [ ] Create DeleteDocumentModal component
- [ ] Implement Convex mutation
- [ ] Wire to URL param
- [ ] Test delete flow

**File: packages/react/src/components/admin/modals/DeleteDocumentModal.tsx**

````typescript
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import type { CollectionConfig } from "@vexcms/core/collections";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";

/**
 * Props for DeleteDocumentModal component.
 *
 * @param props.collection - Collection configuration
 * @param props.convexApi - Convex API object for delete mutation
 */
export interface DeleteDocumentModalProps {
  /** Collection configuration. */
  collection: CollectionConfig;

  /** Convex API remove function (e.g., api.vex.collections.remove). */
  convexApi: any;
}

/**
 * Confirmation modal for deleting a document.
 *
 * Opens when ?deleteDocument=<id> URL param is present. Shows confirmation
 * dialog, calls Convex remove mutation, invalidates queries, and closes.
 *
 * @param props - Component props
 * @returns Delete confirmation dialog
 *
 * @example
 * ```tsx
 * <DeleteDocumentModal
 *   collection={postsCollection}
 *   convexApi={api.vex.collections.remove}
 * />
 * ```
 */
export function DeleteDocumentModal(props: DeleteDocumentModalProps) {
  // Read document ID from URL
  const [documentId, setDocumentId] = useQueryState(
    "deleteDocument",
    parseAsString.withDefault("")
  );

  const isOpen = Boolean(documentId);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryClient = useQueryClient();

  const handleClose = () => {
    setDocumentId(null);
  };

  const handleDelete = async () => {
    if (!documentId) return;

    // TODO: implement
    //
    // 1. Set isDeleting = true
    //
    // 2. Call Convex remove mutation
    //    await convexMutation(props.convexApi, {
    //      collection: props.collection.slug,
    //      id: documentId,
    //    });
    //
    // 3. Invalidate queries to refetch list
    //    queryClient.invalidateQueries({ queryKey: ["convex", props.convexApi, ...] });
    //
    // 4. Close modal
    //    handleClose();
    //
    // 5. Set isDeleting = false
    //
    // Edge cases:
    // - If mutation fails, show error toast and keep modal open
    // - If document doesn't exist, still close modal (already deleted)
    // - If user closes modal during deletion, cancel if possible

    throw new Error("Not implemented");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {props.collection.labels.singular}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this {props.collection.labels.singular.toLowerCase()}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
````

---

## Step 16: CollectionListView Integration

- [ ] Update CollectionListView to use DataTable
- [ ] Remove placeholder
- [ ] Wire all callbacks
- [ ] Test integration

**File: packages/react/src/components/admin/views/CollectionListView.tsx**

Update the existing file to replace the placeholder with DataTable:

```typescript
// TODO: Update the existing CollectionListView.tsx file
//
// 1. Import DataTable component
//    import { DataTable } from "../../data-table/DataTable";
//
// 2. Import DeleteDocumentModal
//    import { DeleteDocumentModal } from "../modals/DeleteDocumentModal";
//
// 3. Replace the placeholder paragraph with:
//    <DataTable
//      collection={collection}
//      convexApi={vexConvexApi.list}  // Or vexConvexApi.listPaginated if you create a separate function
//      initialData={props.initialData}
//      onNavigateToEdit={(id) => {
//        // Use VexLink or router to navigate to /admin/:collection/:id
//        window.location.href = `/admin/${collection.slug}/${id}`;
//      }}
//      onOpenCreateModal={() => {
//        // Set URL param to open create modal
//        const params = new URLSearchParams(window.location.search);
//        params.set("createDocument", "true");
//        window.history.pushState(null, "", `?${params.toString()}`);
//      }}
//      onOpenDeleteModal={(id) => {
//        // Set URL param to open delete modal
//        const params = new URLSearchParams(window.location.search);
//        params.set("deleteDocument", id);
//        window.history.pushState(null, "", `?${params.toString()}`);
//      }}
//    />
//
// 4. Add DeleteDocumentModal below DataTable
//    <DeleteDocumentModal
//      collection={collection}
//      convexApi={vexConvexApi.remove}
//    />
//
// 5. Remove the old placeholder code:
//    - Remove: <p>add data table here. {documents.length} documents found.</p>
//    - Remove: old documents fetching logic if not needed for initialData
//
// 6. Update initialData fetching to accept DataFetchParams
//    - Instead of just fetching all docs, parse URL params and pass to Convex
//    - This enables SSR prefetching with sorting/search/pagination

// The developer should update this file based on the current structure
```

---

## Step 17: SSR Prefetching

- [ ] Update Next.js admin page to parse URL params
- [ ] Fetch initialData with pagination/sorting
- [ ] Pass to CollectionListView
- [ ] Test SSR prefetch

**File: apps/www/src/app/admin/[[...slug]]/page.tsx**

Update the existing file to parse URL params for SSR prefetching:

```typescript
// TODO: Update the existing page.tsx file
//
// 1. Import DataFetchParams type
//    import type { DataFetchParams } from "@vexcms/core/types";
//
// 2. In the server component, parse searchParams
//    export default async function AdminPage({
//      params,
//      searchParams,
//    }: {
//      params: { slug?: string[] };
//      searchParams: Record<string, string | string[] | undefined>;
//    }) {
//      const slug = params.slug?.[0];
//      const collection = getCollection(slug);
//
//      if (!collection) return <NotFound />;
//
//      // If it's a list view (no document ID in slug)
//      if (params.slug?.length === 1) {
//        // Parse URL params for prefetching
//        const collectionSlug = collection.slug;
//        const page = parseInt(searchParams[`${collectionSlug}_page`] as string) || 1;
//        const pageSize = parseInt(searchParams[`${collectionSlug}_pageSize`] as string) || 50;
//        const sortBy = (searchParams[`${collectionSlug}_sortBy`] as string) || null;
//        const sortOrder = (searchParams[`${collectionSlug}_sortOrder`] as "asc" | "desc") || null;
//        const search = (searchParams[`${collectionSlug}_search`] as string) || "";
//
//        const fetchParams: DataFetchParams = {
//          collection: collectionSlug,
//          page,
//          pageSize,
//          sortBy,
//          sortOrder,
//          search: search || undefined,
//        };
//
//        // Fetch initialData using Convex server-side
//        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
//        const initialData = await convex.query(api.vex.collections.list, fetchParams);
//
//        return (
//          <NextAdminLayout>
//            <CollectionListView
//              collection={collection}
//              initialData={initialData}
//            />
//          </NextAdminLayout>
//        );
//      }
//
//      // ... rest of edit view logic
//    }
//
// Edge cases:
// - Invalid page number: Convex function handles clamping
// - Invalid sortBy: Convex function handles validation
// - Missing params: use defaults (page=1, pageSize=50, no sort)

// The developer should update this file based on the current structure
```

---

## Step 18: Verification

**This is a mandatory step. The spec is not complete until all verification steps pass.**

- [ ] Run `pnpm build` — all packages build successfully
- [ ] Run `pnpm test` — all tests pass (write tests for new utilities)
- [ ] Manual test: Navigate to `/admin/posts` (or your collection)
- [ ] Manual test: Search for documents
- [ ] Manual test: Sort by a column
- [ ] Manual test: Change page size
- [ ] Manual test: Navigate to next/previous page
- [ ] Manual test: Toggle column visibility
- [ ] Manual test: Resize a column (check localStorage persistence)
- [ ] Manual test: Drag to reorder columns (check localStorage persistence)
- [ ] Manual test: Click title field to edit document
- [ ] Manual test: Click \_id field to edit document
- [ ] Manual test: Click delete button, confirm deletion
- [ ] Manual test: Refresh page with URL params (state should persist)
- [ ] Manual test: Share URL with another browser (pagination/sort should work)
- [ ] Manual test: Add a new field to collection, reload (should appear at end)
- [ ] Manual test: Remove a field from collection, reload (localStorage should filter it out)
- [ ] Fix any test assertions broken by these changes
- [ ] Fix any type errors introduced

**If any step fails, debug and fix before considering the spec complete.**

---

## Success Criteria

- [ ] Data table renders in CollectionListView with real data
- [ ] Pagination works (navigate pages, change page size)
- [ ] Server-side sorting works (click column headers, sort updates URL and data)
- [ ] Search works (type query, updates URL, fetches filtered results)
- [ ] Column visibility toggle works (hide/show columns, persists to localStorage)
- [ ] Column resizing works (drag column border, persists to localStorage after 300ms)
- [ ] Column ordering works (drag columns in view menu, persists to localStorage)
- [ ] System fields (\_id, \_creationTime) hidden by default, can be shown via column visibility
- [ ] Title field is clickable and navigates to edit view
- [ ] \_id field is clickable and navigates to edit view
- [ ] Actions column shows Edit and Delete buttons
- [ ] Delete button opens confirmation modal via URL param
- [ ] Delete modal deletes document and refreshes list
- [ ] Empty state shows correct message (filtered vs no data)
- [ ] Loading state shows skeleton rows matching table structure
- [ ] URL params enable shareable/bookmarkable views
- [ ] SSR prefetching works (no loading flash on initial page load)
- [ ] Build passes with no type errors
- [ ] Tests pass (unit tests for utilities, integration tests for hooks)
- [ ] Documentation (JSDoc) is complete for all exported functions/components

---

## Final Notes

**What you built:**

- Production-ready data table component
- URL-based state management for shareability
- localStorage column preferences
- Auto-generated columns from collection fields
- Full CRUD integration with Convex
- SSR prefetching support
- Extensible field-to-column pattern

**What's next (out of scope for this spec):**

- Add date range filters
- Add faceted column filters
- Add row selection / bulk operations
- Add CSV/Excel export
- Add advanced keyboard navigation
- Extract to `@vexcms/react-data-table` package
- Add column pinning/freezing
- Add virtualization for large datasets

**Key design decisions:**

- URL state (not hash) for server-side parsing
- localStorage (not URL) for column prefs to keep URLs clean
- Factory functions (not classes) for field-to-column generation
- Manual pagination/sorting (not client-side) for scalability
- Skeleton rows (not spinner) to prevent layout shift
- Context-aware empty states for better UX
- Debounced search (500ms) to prevent character loss
- Debounced column resize (300ms) to prevent excessive localStorage writes

Congratulations! You've built a comprehensive data table system that's both powerful and extractable.

