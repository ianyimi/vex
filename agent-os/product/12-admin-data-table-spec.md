# Admin Data Table Spec

Implement the admin data table feature: a generic `DataTable` component in `@vexcms/ui`, column generation from collection field configs in `@vexcms/core`, search index support in the schema system, and wiring it all together in `CollectionsView.tsx` with search, document count, and pagination.

**Depends on**: `@vexcms/core` field types, collection types, `collectIndexes()`, `generateVexSchema()`, `@vexcms/ui` Table components, `@tanstack/react-table` (already a dependency in both `@vexcms/ui` and `@vexcms/admin-next`)

---

## Design Decisions

1. **`generateColumns` returns `ColumnDef<Record<string, unknown>>[]`** — Documents come from a generic Convex query as `Record<string, unknown>`. The column defs are generic over this shape rather than a specific document type.
2. **Per-field column builders follow the valueTypes paradigm** — Just as `textToValueTypeString()` produces schema strings, `textColumnDef()` produces `ColumnDef` objects. Each field type gets its own builder: `textColumnDef()`, `numberColumnDef()`, `checkboxColumnDef()`, `selectColumnDef()`.
3. **Column builders are colocated with their field type** — Each builder lives in `packages/core/src/fields/<type>/columnDef.ts` alongside the existing `config.ts`, `index.ts`, and `schemaValueType.ts` for that field. This keeps all field-specific code in one place. Core has no React dependency; column builders return plain `ColumnDef` config objects (header strings, accessor keys). Cell renderers that need React are defined in the `DataTable` component or passed in.
4. **`collectSearchIndexes()` follows the EXACT same pattern as `collectIndexes()`** — Walk per-field `_meta.searchIndex`, merge collection-level `searchIndexes`, auto-add for `useAsTitle` if set and no existing search index covers it. Collection-level wins on name collision.
5. **Search index auto-generation for `useAsTitle`** — If a collection has `admin.useAsTitle` set and no existing search index has that field as its `searchField`, auto-generate one named `search_<fieldName>`. This is separate from the `by_<fieldName>` regular index auto-generation.
6. **DataTable is a thin wrapper** — It uses `@tanstack/react-table` with the existing Table primitives from `@vexcms/ui`. It includes `getPaginationRowModel()` for client-side page slicing and renders pagination controls (Previous/Next buttons, page indicator). No custom cell renderers or complex state beyond what TanStack Table provides.
7. **Search toggles between two query strategies** — Empty search uses `useConvexPaginatedQuery` (from `@convex-dev/react-query`, re-exported as `usePaginatedQuery` from `convex/react`) for paginated list mode. Active search uses `useQuery` + `convexQuery` for non-paginated search mode (`.take(50)` server-side).
8. **Pagination uses `useConvexPaginatedQuery` for list mode** — `CollectionsView` calls `useConvexPaginatedQuery(anyApi.vex.collections.listDocuments, { collectionSlug }, { initialNumItems })` where `initialNumItems = Math.max(50, pageSize * 5)` and `pageSize` comes from config or defaults to 10. This returns `{ results, status, loadMore }`. The `DataTable` component handles client-side page slicing via TanStack Table's built-in pagination API. A `usePaginationLoader` hook watches the current page state and calls `loadMore()` when approaching the end of loaded data.
9. **DataTable accepts optional pagination callbacks** — `onLoadMore?: () => void` and `canLoadMore?: boolean` are optional props. The DataTable itself does NOT call loadMore — it just renders the pagination controls and exposes its table instance's pagination state. The parent (`CollectionsView`) handles the loading logic via the `usePaginationLoader` hook.
10. **Unknown field types fall back to `String(value)` truncated to 50 characters** — Column builders only handle the four primitive field types (text, number, checkbox, select). The `generateColumns` function produces a fallback column for any unrecognized field type that renders `String(value)` truncated to 50 characters.

## Out of Scope

- Sorting, filtering UI
- Row actions (edit, delete)
- Cell formatting beyond basic rendering (rich text, images, etc.)
- Column resizing/reordering
- Bulk selection / bulk actions
- **Complex object/array fields.** Currently, all column builders assume primitive values (string, number, boolean). If a collection has fields with nested objects or arrays (e.g., from `extendTable` additional fields or future relation fields), they will render as `[object Object]` in the table. Future solutions include:
  - A `jsonColumnDef` builder that `JSON.stringify()`s and truncates to N characters
  - A popover/modal that shows the full JSON on click
  - Field-type-specific renderers for known complex types (e.g., arrays render as comma-separated badges)
  - A `maxCellWidth` CSS constraint with `text-overflow: ellipsis` on all cells

  For now, the column builders only handle the four primitive field types (text, number, checkbox, select). Unknown field types should fall back to `String(value)` truncated to 50 characters.

---

## Target File Structure

```
packages/core/src/
├── types/
│   ├── collections.ts            # + SearchIndexConfig, searchIndexes on CollectionConfig
│   ├── fields.ts                 # + searchIndex on BaseFieldOptions/BaseFieldMeta
│   └── auth.ts                   # + ResolvedSearchIndex interface
├── columns/
│   ├── index.ts                  # re-exports generateColumns
│   ├── generateColumns.ts        # generateColumns() function
│   └── generateColumns.test.ts   # tests
├── fields/
│   ├── text/
│   │   ├── columnDef.ts          # textColumnDef() — NEW
│   │   └── columnDef.test.ts     # tests — NEW
│   ├── number/
│   │   ├── columnDef.ts          # numberColumnDef() — NEW
│   │   └── columnDef.test.ts     # tests — NEW
│   ├── checkbox/
│   │   ├── columnDef.ts          # checkboxColumnDef() — NEW
│   │   └── columnDef.test.ts     # tests — NEW
│   ├── select/
│   │   ├── columnDef.ts          # selectColumnDef() — NEW
│   │   └── columnDef.test.ts     # tests — NEW
├── valueTypes/
│   ├── searchIndexes.ts          # collectSearchIndexes()
│   ├── searchIndexes.test.ts     # tests
│   ├── generate.ts               # updated to output .searchIndex() calls

packages/ui/src/components/ui/
├── data-table.tsx                # DataTable component (with pagination controls)

packages/admin-next/src/
├── hooks/
│   └── usePaginationLoader.ts    # helper hook for auto-loading more data
├── views/
│   └── CollectionsView.tsx       # updated with DataTable, search, pagination, doc count

apps/test-app/convex/vex/
├── collections.ts                # + searchDocuments query
├── model/collections.ts          # + searchDocuments() model function
```

---

## Implementation Order

1. Search index types + `ResolvedSearchIndex` in core
2. Per-field `searchIndex` on `BaseFieldOptions`/`BaseFieldMeta` + field config functions
3. `collectSearchIndexes()` + tests
4. Update `generateVexSchema()` to output `.searchIndex()` calls + tests
5. Export type updates in core
6. Column builder functions in core + tests
7. `generateColumns()` function in core + tests
8. `DataTable` component in ui (with pagination controls)
9. `searchDocuments` Convex function in test app
10. `usePaginationLoader` hook in admin-next
11. Wire up `CollectionsView.tsx` with search bar, data table, pagination, document count
12. Export updates (core `index.ts`, ui `index.tsx`)

---

## Step 1: Search Index Types

Add `ResolvedSearchIndex` to the auth types file (alongside `ResolvedIndex`), and add `SearchIndexConfig` to the collections types file.

- [ ] Add `ResolvedSearchIndex` interface to `packages/core/src/types/auth.ts`
- [ ] Add `SearchIndexConfig` interface to `packages/core/src/types/collections.ts`
- [ ] Add `searchIndexes` field to `CollectionConfig`
- [ ] Verify `pnpm --filter @vexcms/core typecheck` passes

**File: `packages/core/src/types/auth.ts`** — Add after `ResolvedIndex`:

```typescript
/**
 * A resolved search index ready for code generation.
 */
export interface ResolvedSearchIndex {
  /** Search index name (e.g., "search_title") */
  name: string;
  /** The field to perform full-text search on (must be a string field) */
  searchField: string;
  /** Fields that can be used to filter search results */
  filterFields: string[];
}
```

**File: `packages/core/src/types/collections.ts`** — Add `SearchIndexConfig` after `IndexConfig`:

```typescript
/**
 * Search index definition for a collection.
 * Enables full-text search on a field with optional filter fields.
 *
 * Generic over `TFields` so that `searchField` and `filterFields` are type-checked
 * against actual field names in the collection.
 *
 * @example
 *
 * defineCollection("posts", {
 *   fields: {
 *     title: text(),
 *     author: text(),
 *     status: select({ options: [...] }),
 *   },
 *   searchIndexes: [
 *     { name: "search_title", searchField: "title", filterFields: ["author", "status"] },
 *   ],
 * })
 *
 */
export interface SearchIndexConfig<
  TFields extends Record<string, VexField<any, any>> = Record<
    string,
    VexField<any, any>
  >,
> {
  /**
   * Search index name (must be unique within the collection).
   * Convention: `"search_<field>"`.
   */
  name: string;
  /**
   * The field to perform full-text search on.
   * Must be a text (string) field in the collection.
   */
  searchField: keyof TFields & string;
  /**
   * Optional fields to filter search results by.
   * Each field name must be a key in the collection's `fields` record.
   */
  filterFields?: (keyof TFields & string)[];
}
```

**File: `packages/core/src/types/collections.ts`** — Add to `CollectionConfig`:

```typescript
  /**
   * Search indexes for full-text search on this collection.
   * Each search index targets a single text field with optional filter fields.
   *
   * @example
   * searchIndexes: [
   *   { name: "search_title", searchField: "title", filterFields: ["status"] },
   * ]
   */
  searchIndexes?: SearchIndexConfig<TFields>[];
```

---

## Step 2: Per-Field Search Index on BaseFieldOptions and BaseFieldMeta

Add `searchIndex` property to `BaseFieldOptions` and `BaseFieldMeta` in `packages/core/src/types/fields.ts`. Then update each field config function (`text()`, `number()`, `checkbox()`, `select()`) to pass it through to `_meta`.

- [ ] Add `searchIndex` to `BaseFieldMeta` in `packages/core/src/types/fields.ts`
- [ ] Add `searchIndex` to `BaseFieldOptions` in `packages/core/src/types/fields.ts`
- [ ] Verify `pnpm --filter @vexcms/core typecheck` passes (field configs already spread `...options` into `_meta`, so searchIndex passes through automatically)

**File: `packages/core/src/types/fields.ts`** — Add to both `BaseFieldMeta` and `BaseFieldOptions`, after the `index` property:

````typescript
  /**
   * Create a full-text search index on this field.
   * The field this is defined on becomes the `searchField`.
   *
   * @example
   * ```ts
   * title: text({
   *   searchIndex: { name: "search_title", filterFields: ["status", "author"] },
   * })
   * // Generates: .searchIndex("search_title", { searchField: "title", filterFields: ["status", "author"] })
   * ```
   */
  searchIndex?: {
    /** Search index name (must be unique within the collection). */
    name: string;
    /**
     * Fields to filter search results by.
     * String array — validated at runtime against collection field names.
     */
    filterFields: string[];
  };
````

No changes are needed in the individual field config functions (`text()`, `number()`, etc.) because they already spread `...options` into `_meta`:

```typescript
// Example from packages/core/src/fields/text/config.ts (no change needed):
export function text(
  options?: TextFieldOptions,
): VexField<string, TextFieldMeta> {
  return {
    _type: "",
    _meta: {
      type: "text",
      defaultValue: options?.required ? "" : undefined,
      ...options, // <-- searchIndex passes through here
    },
  };
}
```

---

## Step 3: collectSearchIndexes() + Tests

Create `packages/core/src/valueTypes/searchIndexes.ts` following the exact same pattern as `collectIndexes()` in `packages/core/src/valueTypes/indexes.ts`.

- [ ] Create `packages/core/src/valueTypes/searchIndexes.ts`
- [ ] Create `packages/core/src/valueTypes/searchIndexes.test.ts`
- [ ] Verify `pnpm --filter @vexcms/core test` passes

**File: `packages/core/src/valueTypes/searchIndexes.ts`** — Guided stub:

```typescript
import { VexFieldValidationError } from "../errors";
import type {
  VexCollection,
  VexField,
  BaseFieldMeta,
  ResolvedSearchIndex,
} from "../types";

/**
 * Collects all search indexes for a collection from three sources:
 * 1. Per-field `searchIndex` property on individual fields
 * 2. Collection-level `searchIndexes` array on the collection config
 * 3. Auto-generated search index for `admin.useAsTitle` field
 *
 * Goal: Walk all fields in the collection, extract any `searchIndex` property
 * from field metadata, convert to ResolvedSearchIndex format, then merge with
 * collection-level searchIndexes. If `admin.useAsTitle` is set and no existing
 * search index covers that field (as searchField), auto-create one named
 * `"search_<fieldName>"` with empty filterFields. Deduplicate by name —
 * collection-level wins on collision.
 *
 * @param collection - The collection to extract search indexes from
 * @returns Array of resolved search indexes, deduplicated by name
 *
 * Edge cases:
 * - No search indexes anywhere: return empty array
 * - Per-field searchIndex on field "title" with name "search_title":
 *   produces { name: "search_title", searchField: "title", filterFields: [...] }
 * - Collection-level searchIndex with same name as per-field: collection-level wins
 * - Two fields with same searchIndex name: throw VexFieldValidationError
 * - Empty searchIndex name string on a field: skip (treat as no searchIndex)
 * - admin.useAsTitle field already has an explicit search index: don't duplicate
 * - admin.useAsTitle field has no search index: auto-create
 *   { name: "search_<fieldName>", searchField: "<fieldName>", filterFields: [] }
 * - admin.useAsTitle is undefined: no auto search index generated
 * - searchField must be the field key the searchIndex is defined on (for per-field)
 */
export function collectSearchIndexes<
  TFields extends Record<string, VexField<any, any>>,
>(props: { collection: VexCollection<TFields> }): ResolvedSearchIndex[] {
  const { collection } = props;
  const searchIndexes = new Map<string, ResolvedSearchIndex>();

  // --- Step 1: Walk per-field searchIndex ---
  // For each field in collection.config.fields:
  //   - Cast field._meta to BaseFieldMeta
  //   - If meta.searchIndex exists and meta.searchIndex.name is non-empty:
  //     - Check for duplicate name in searchIndexes map -> throw VexFieldValidationError
  //     - Add to map: { name, searchField: fieldKey, filterFields: meta.searchIndex.filterFields }

  // --- Step 2: Merge collection-level searchIndexes ---
  // For each entry in collection.config.searchIndexes ?? []:
  //   - searchIndexes.set(entry.name, { name, searchField, filterFields: entry.filterFields ?? [] })
  //   - (This overwrites any per-field entry with the same name — collection-level wins)

  // --- Step 3: Auto-generate for useAsTitle ---
  // If collection.config.admin?.useAsTitle is set:
  //   - const titleField = useAsTitle as string
  //   - const autoName = `search_${titleField}`
  //   - Check if any existing entry in the map has searchField === titleField
  //   - If no existing entry covers it AND autoName is not already in the map:
  //     - Add { name: autoName, searchField: titleField, filterFields: [] }

  return Array.from(searchIndexes.values());
}
```

**File: `packages/core/src/valueTypes/searchIndexes.test.ts`** — Full test file:

```typescript
import { describe, it, expect } from "vitest";
import { collectSearchIndexes } from "./searchIndexes";
import { defineCollection } from "../config/defineCollection";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { select } from "../fields/select";

describe("collectSearchIndexes", () => {
  it("returns empty array when no search indexes are defined", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
        body: text(),
      },
    });
    expect(collectSearchIndexes({ collection: posts })).toEqual([]);
  });

  it("collects per-field search index from a single field", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({
          required: true,
          searchIndex: { name: "search_title", filterFields: [] },
        }),
        body: text(),
      },
    });
    const indexes = collectSearchIndexes({ collection: posts });
    expect(indexes).toEqual([
      { name: "search_title", searchField: "title", filterFields: [] },
    ]);
  });

  it("collects per-field search index with filterFields", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({
          required: true,
          searchIndex: { name: "search_title", filterFields: ["status"] },
        }),
        status: select({
          required: true,
          options: [
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
          ],
        }),
      },
    });
    const indexes = collectSearchIndexes({ collection: posts });
    expect(indexes).toEqual([
      { name: "search_title", searchField: "title", filterFields: ["status"] },
    ]);
  });

  it("collects collection-level search indexes", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
        author: text(),
      },
      searchIndexes: [
        {
          name: "search_title",
          searchField: "title",
          filterFields: ["author"],
        },
      ],
    });
    const indexes = collectSearchIndexes({ collection: posts });
    expect(indexes).toEqual([
      { name: "search_title", searchField: "title", filterFields: ["author"] },
    ]);
  });

  it("collection-level wins on name collision with per-field search index", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({
          required: true,
          searchIndex: { name: "search_title", filterFields: [] },
        }),
        author: text(),
      },
      searchIndexes: [
        {
          name: "search_title",
          searchField: "title",
          filterFields: ["author"],
        },
      ],
    });
    const indexes = collectSearchIndexes({ collection: posts });
    expect(indexes).toHaveLength(1);
    expect(indexes[0]).toEqual({
      name: "search_title",
      searchField: "title",
      filterFields: ["author"],
    });
  });

  it("throws when two different fields claim the same search index name", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({
          required: true,
          searchIndex: { name: "search_content", filterFields: [] },
        }),
        body: text({
          searchIndex: { name: "search_content", filterFields: [] },
        }),
      },
    });
    expect(() => collectSearchIndexes({ collection: posts })).toThrow(
      "search_content",
    );
  });

  it("skips fields with empty string search index name", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({
          required: true,
          searchIndex: { name: "", filterFields: [] },
        }),
      },
    });
    expect(collectSearchIndexes({ collection: posts })).toEqual([]);
  });

  it("merges per-field and collection-level search indexes", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({
          required: true,
          searchIndex: { name: "search_title", filterFields: [] },
        }),
        body: text(),
        author: text(),
      },
      searchIndexes: [
        { name: "search_body", searchField: "body", filterFields: ["author"] },
      ],
    });
    const indexes = collectSearchIndexes({ collection: posts });
    expect(indexes).toHaveLength(2);
    expect(indexes).toContainEqual({
      name: "search_title",
      searchField: "title",
      filterFields: [],
    });
    expect(indexes).toContainEqual({
      name: "search_body",
      searchField: "body",
      filterFields: ["author"],
    });
  });

  describe("auto search index for admin.useAsTitle", () => {
    it("auto-creates search index for useAsTitle field when no search index exists", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          body: text(),
        },
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectSearchIndexes({ collection: posts });
      expect(indexes).toEqual([
        { name: "search_title", searchField: "title", filterFields: [] },
      ]);
    });

    it("does not duplicate when useAsTitle field already has a per-field search index", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({
            required: true,
            searchIndex: { name: "search_title", filterFields: ["status"] },
          }),
          status: select({
            required: true,
            options: [{ value: "draft", label: "Draft" }],
          }),
        },
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectSearchIndexes({ collection: posts });
      expect(indexes).toHaveLength(1);
      expect(indexes[0]).toEqual({
        name: "search_title",
        searchField: "title",
        filterFields: ["status"],
      });
    });

    it("does not duplicate when useAsTitle field is covered by a collection-level search index", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          body: text(),
        },
        searchIndexes: [{ name: "search_title", searchField: "title" }],
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectSearchIndexes({ collection: posts });
      expect(indexes).toHaveLength(1);
    });

    it("does not create auto search index when useAsTitle is not set", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
        },
      });
      expect(collectSearchIndexes({ collection: posts })).toEqual([]);
    });

    it("coexists with other search indexes", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          body: text({
            searchIndex: { name: "search_body", filterFields: [] },
          }),
        },
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectSearchIndexes({ collection: posts });
      expect(indexes).toHaveLength(2);
      expect(indexes).toContainEqual({
        name: "search_body",
        searchField: "body",
        filterFields: [],
      });
      expect(indexes).toContainEqual({
        name: "search_title",
        searchField: "title",
        filterFields: [],
      });
    });

    it("does not auto-create if another search index already covers the useAsTitle field", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          status: select({
            required: true,
            options: [{ value: "draft", label: "Draft" }],
          }),
        },
        searchIndexes: [
          {
            name: "custom_search",
            searchField: "title",
            filterFields: ["status"],
          },
        ],
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectSearchIndexes({ collection: posts });
      // "custom_search" already covers "title" as searchField — no auto-index
      expect(indexes).toHaveLength(1);
      expect(indexes[0]!.name).toBe("custom_search");
    });

    it("skips auto search index if auto-generated name collides with existing index", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          body: text(),
        },
        // Explicit search index named "search_title" that searches body, not title
        searchIndexes: [{ name: "search_title", searchField: "body" }],
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectSearchIndexes({ collection: posts });
      // The explicit "search_title" wins — no auto-index added
      expect(indexes).toHaveLength(1);
      expect(indexes[0]).toEqual({
        name: "search_title",
        searchField: "body",
        filterFields: [],
      });
    });
  });
});
```

---

## Step 4: Update generateVexSchema() for Search Indexes

Update `packages/core/src/valueTypes/generate.ts` to call `collectSearchIndexes()` alongside `collectIndexes()` and output `.searchIndex()` chains.

- [ ] Import `collectSearchIndexes` and `ResolvedSearchIndex` in `generate.ts`
- [ ] Add search index collection and output for user collections
- [ ] Add search index collection and output for globals (if applicable)
- [ ] Add tests for search index generation in `generate.test.ts`
- [ ] Verify `pnpm --filter @vexcms/core test` passes

**File: `packages/core/src/valueTypes/generate.ts`** — Changes:

Add import at top:

```typescript
import { collectSearchIndexes } from "./searchIndexes";
import type { ResolvedSearchIndex } from "../types";
```

In the user collections loop (after the regular index `.index()` output loop), add search index output:

```typescript
// After the existing: for (const i of indexes) { ... }
// Add:
const searchIndexes: ResolvedSearchIndex[] = collectSearchIndexes({
  collection,
});
for (const si of searchIndexes) {
  const filterList =
    si.filterFields.length > 0
      ? `, filterFields: [${si.filterFields.map((f) => `"${f}"`).join(", ")}]`
      : "";
  lines.push(
    `  .searchIndex("${si.name}", { searchField: "${si.searchField}"${filterList} })`,
  );
}
```

Apply the same pattern for the globals loop at the bottom of the function.

**Output format example:**

```typescript
export const posts = defineTable({
  title: v.string(),
  slug: v.optional(v.string()),
})
  .index("by_title", ["title"])
  .searchIndex("search_title", { searchField: "title" });
```

With filterFields:

```typescript
  .searchIndex("search_title", { searchField: "title", filterFields: ["status", "author"] })
```

**File: `packages/core/src/valueTypes/generate.test.ts`** — Add these tests inside the existing `describe("generateVexSchema", ...)`:

```typescript
describe("search index generation", () => {
  it("generates per-field search index as chained .searchIndex() call", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({
          searchIndex: { name: "search_title", filterFields: [] },
        }),
        body: text(),
      },
    });
    const config = defineConfig({
      collections: [posts, users],
      auth: minimalAuth,
    });
    const output = generateVexSchema({ config });

    expect(output).toContain(
      '.searchIndex("search_title", { searchField: "title" })',
    );
  });

  it("generates search index with filterFields", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({
          searchIndex: {
            name: "search_title",
            filterFields: ["status"],
          },
        }),
        status: select({
          required: true,
          options: [
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
          ],
        }),
      },
    });
    const config = defineConfig({
      collections: [posts, users],
      auth: minimalAuth,
    });
    const output = generateVexSchema({ config });

    expect(output).toContain(
      '.searchIndex("search_title", { searchField: "title", filterFields: ["status"] })',
    );
  });

  it("generates collection-level search indexes", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text(),
        author: text(),
      },
      searchIndexes: [
        {
          name: "search_title",
          searchField: "title",
          filterFields: ["author"],
        },
      ],
    });
    const config = defineConfig({
      collections: [posts, users],
      auth: minimalAuth,
    });
    const output = generateVexSchema({ config });

    expect(output).toContain(
      '.searchIndex("search_title", { searchField: "title", filterFields: ["author"] })',
    );
  });

  it("auto-generates search index for admin.useAsTitle", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text(),
        body: text(),
      },
      admin: {
        useAsTitle: "title",
      },
    });
    const config = defineConfig({
      collections: [posts, users],
      auth: minimalAuth,
    });
    const output = generateVexSchema({ config });

    expect(output).toContain(
      '.searchIndex("search_title", { searchField: "title" })',
    );
  });

  it("generates both .index() and .searchIndex() on the same table", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ index: "by_title" }),
        body: text(),
      },
      searchIndexes: [{ name: "search_title", searchField: "title" }],
    });
    const config = defineConfig({
      collections: [posts, users],
      auth: minimalAuth,
    });
    const output = generateVexSchema({ config });

    expect(output).toContain('.index("by_title", ["title"])');
    expect(output).toContain(
      '.searchIndex("search_title", { searchField: "title" })',
    );
  });

  it("does not generate .searchIndex() when no search indexes defined", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text(),
      },
    });
    const config = defineConfig({
      collections: [posts, users],
      auth: minimalAuth,
    });
    const output = generateVexSchema({ config });

    const postsSection = output.split("export const users")[0];
    expect(postsSection).not.toContain(".searchIndex(");
  });
});
```

---

## Step 5: Export Type Updates in Core

Update the core package exports to include the new types.

- [ ] Add `ResolvedSearchIndex` export to `packages/core/src/types/index.ts` (it re-exports from `./auth`)
- [ ] Add `SearchIndexConfig` export to `packages/core/src/index.ts` types section
- [ ] Add `ResolvedSearchIndex` export to `packages/core/src/index.ts` types section
- [ ] Add `generateColumns` export to `packages/core/src/index.ts` (after Step 7)
- [ ] Verify `pnpm --filter @vexcms/core build` passes

**File: `packages/core/src/index.ts`** — Add to the type exports:

```typescript
export type {
  // ... existing exports ...
  SearchIndexConfig,
  ResolvedSearchIndex,
} from "./types";
```

After Step 7, also add:

```typescript
export { generateColumns } from "./columns";
```

---

## Step 6: Column Builder Functions

Create per-field-type column builders colocated with their field type in `packages/core/src/fields/<type>/columnDef.ts`. Each takes field metadata and returns a `ColumnDef<Record<string, unknown>>` object.

Note: `@vexcms/core` does NOT have `@tanstack/react-table` as a dependency. The column builders return plain objects that conform to the `ColumnDef` shape. The type is imported as a dev dependency only for type-checking. Add `@tanstack/react-table` as a `devDependency` and `peerDependency` to `packages/core/package.json`.

- [ ] Add `@tanstack/react-table` to `packages/core/package.json` as devDependency and peerDependency (with `"catalog:"`)
- [ ] Run `pnpm install` from workspace root
- [ ] Create `packages/core/src/fields/text/columnDef.ts`
- [ ] Create `packages/core/src/fields/text/columnDef.test.ts`
- [ ] Create `packages/core/src/fields/number/columnDef.ts`
- [ ] Create `packages/core/src/fields/number/columnDef.test.ts`
- [ ] Create `packages/core/src/fields/checkbox/columnDef.ts`
- [ ] Create `packages/core/src/fields/checkbox/columnDef.test.ts`
- [ ] Create `packages/core/src/fields/select/columnDef.ts`
- [ ] Create `packages/core/src/fields/select/columnDef.test.ts`
- [ ] Verify `pnpm --filter @vexcms/core test` passes

**File: `packages/core/src/fields/text/columnDef.ts`** — Guided stub:

```typescript
import type { ColumnDef } from "@tanstack/react-table";
import type { TextFieldMeta } from "../../types";

/**
 * Builds a ColumnDef for a text field.
 *
 * @param props.fieldKey - The field name (used as accessorKey)
 * @param props.meta - The text field metadata
 * @returns A ColumnDef for the text field
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.meta.label ?? props.fieldKey (capitalize first letter of fieldKey as fallback)
 * - cell: render the value as a string, truncated to 80 characters with ellipsis if longer
 */
export function textColumnDef(props: {
  fieldKey: string;
  meta: TextFieldMeta;
}): ColumnDef<Record<string, unknown>> {
  // Return a ColumnDef with:
  // - accessorKey: props.fieldKey
  // - header: props.meta.label ?? capitalize(props.fieldKey)
  // - No custom cell renderer (plain string display is fine for core)
  throw new Error("TODO: implement");
}
```

**File: `packages/core/src/fields/text/columnDef.test.ts`** — Full test file:

```typescript
import { describe, it, expect } from "vitest";
import { textColumnDef } from "./columnDef";
import type { TextFieldMeta } from "../../types";

describe("textColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const meta: TextFieldMeta = { type: "text" };
    const col = textColumnDef({ fieldKey: "title", meta });
    expect(col).toHaveProperty("accessorKey", "title");
  });

  it("uses meta.label as header when provided", () => {
    const meta: TextFieldMeta = { type: "text", label: "Post Title" };
    const col = textColumnDef({ fieldKey: "title", meta });
    expect(col).toHaveProperty("header", "Post Title");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const meta: TextFieldMeta = { type: "text" };
    const col = textColumnDef({ fieldKey: "title", meta });
    expect(col).toHaveProperty("header", "Title");
  });
});
```

**File: `packages/core/src/fields/number/columnDef.ts`** — Guided stub:

```typescript
import type { ColumnDef } from "@tanstack/react-table";
import type { NumberFieldMeta } from "../../types";

/**
 * Builds a ColumnDef for a number field.
 *
 * @param props.fieldKey - The field name (used as accessorKey)
 * @param props.meta - The number field metadata
 * @returns A ColumnDef for the number field
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.meta.label ?? capitalize(props.fieldKey)
 * - cell: render the number directly
 */
export function numberColumnDef(props: {
  fieldKey: string;
  meta: NumberFieldMeta;
}): ColumnDef<Record<string, unknown>> {
  throw new Error("TODO: implement");
}
```

**File: `packages/core/src/fields/number/columnDef.test.ts`** — Full test file:

```typescript
import { describe, it, expect } from "vitest";
import { numberColumnDef } from "./columnDef";
import type { NumberFieldMeta } from "../../types";

describe("numberColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const meta: NumberFieldMeta = { type: "number" };
    const col = numberColumnDef({ fieldKey: "count", meta });
    expect(col).toHaveProperty("accessorKey", "count");
  });

  it("uses meta.label as header when provided", () => {
    const meta: NumberFieldMeta = { type: "number", label: "View Count" };
    const col = numberColumnDef({ fieldKey: "count", meta });
    expect(col).toHaveProperty("header", "View Count");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const meta: NumberFieldMeta = { type: "number" };
    const col = numberColumnDef({ fieldKey: "views", meta });
    expect(col).toHaveProperty("header", "Views");
  });
});
```

**File: `packages/core/src/fields/checkbox/columnDef.ts`** — Guided stub:

```typescript
import type { ColumnDef } from "@tanstack/react-table";
import type { CheckboxFieldMeta } from "../../types";

/**
 * Builds a ColumnDef for a checkbox (boolean) field.
 *
 * @param props.fieldKey - The field name (used as accessorKey)
 * @param props.meta - The checkbox field metadata
 * @returns A ColumnDef for the checkbox field
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.meta.label ?? capitalize(props.fieldKey)
 * - cell: render "Yes" / "No" (React rendering with icons is handled by UI layer)
 */
export function checkboxColumnDef(props: {
  fieldKey: string;
  meta: CheckboxFieldMeta;
}): ColumnDef<Record<string, unknown>> {
  throw new Error("TODO: implement");
}
```

**File: `packages/core/src/fields/checkbox/columnDef.test.ts`** — Full test file:

```typescript
import { describe, it, expect } from "vitest";
import { checkboxColumnDef } from "./columnDef";
import type { CheckboxFieldMeta } from "../../types";

describe("checkboxColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const meta: CheckboxFieldMeta = { type: "checkbox" };
    const col = checkboxColumnDef({ fieldKey: "featured", meta });
    expect(col).toHaveProperty("accessorKey", "featured");
  });

  it("uses meta.label as header when provided", () => {
    const meta: CheckboxFieldMeta = { type: "checkbox", label: "Is Featured" };
    const col = checkboxColumnDef({ fieldKey: "featured", meta });
    expect(col).toHaveProperty("header", "Is Featured");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const meta: CheckboxFieldMeta = { type: "checkbox" };
    const col = checkboxColumnDef({ fieldKey: "active", meta });
    expect(col).toHaveProperty("header", "Active");
  });
});
```

**File: `packages/core/src/fields/select/columnDef.ts`** — Guided stub:

```typescript
import type { ColumnDef } from "@tanstack/react-table";
import type { SelectFieldMeta } from "../../types";

/**
 * Builds a ColumnDef for a select field.
 *
 * @param props.fieldKey - The field name (used as accessorKey)
 * @param props.meta - The select field metadata (includes options for label lookup)
 * @returns A ColumnDef for the select field
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.meta.label ?? capitalize(props.fieldKey)
 * - cell: look up the option label from props.meta.options for the current value.
 *   If the value doesn't match any option, display the raw value.
 */
export function selectColumnDef(props: {
  fieldKey: string;
  meta: SelectFieldMeta;
}): ColumnDef<Record<string, unknown>> {
  throw new Error("TODO: implement");
}
```

**File: `packages/core/src/fields/select/columnDef.test.ts`** — Full test file:

```typescript
import { describe, it, expect } from "vitest";
import { selectColumnDef } from "./columnDef";
import type { SelectFieldMeta } from "../../types";

describe("selectColumnDef", () => {
  const selectMeta: SelectFieldMeta = {
    type: "select",
    options: [
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
    ],
  };

  it("uses fieldKey as accessorKey", () => {
    const col = selectColumnDef({ fieldKey: "status", meta: selectMeta });
    expect(col).toHaveProperty("accessorKey", "status");
  });

  it("uses meta.label as header when provided", () => {
    const meta: SelectFieldMeta = { ...selectMeta, label: "Post Status" };
    const col = selectColumnDef({ fieldKey: "status", meta });
    expect(col).toHaveProperty("header", "Post Status");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const col = selectColumnDef({ fieldKey: "status", meta: selectMeta });
    expect(col).toHaveProperty("header", "Status");
  });
});
```

---

## Step 7: generateColumns() Function

Create the main `generateColumns()` function that takes a `VexCollection` and returns `ColumnDef[]`.

- [ ] Create `packages/core/src/columns/generateColumns.ts`
- [ ] Create `packages/core/src/columns/index.ts`
- [ ] Create `packages/core/src/columns/generateColumns.test.ts`
- [ ] Add export to `packages/core/src/index.ts`
- [ ] Verify `pnpm --filter @vexcms/core test` passes

**File: `packages/core/src/columns/generateColumns.ts`** — Guided stub:

```typescript
import type { ColumnDef } from "@tanstack/react-table";
import type { VexCollection, VexField, BaseFieldMeta } from "../types";
import { textColumnDef } from "../fields/text/columnDef";
import { numberColumnDef } from "../fields/number/columnDef";
import { checkboxColumnDef } from "../fields/checkbox/columnDef";
import { selectColumnDef } from "../fields/select/columnDef";

/**
 * Generates an array of ColumnDef objects from a VexCollection's field configs.
 *
 * @param collection - The collection to generate columns for
 * @returns Array of ColumnDef objects for use with @tanstack/react-table
 *
 * Behavior:
 * 1. Always include an `_id` column first (accessorKey: "_id", header: "ID")
 * 2. If `admin.defaultColumns` is set, only include those fields (in order) + _id
 * 3. If `admin.defaultColumns` is not set, include all fields
 * 4. Skip fields where `admin.hidden` is true
 * 5. Dispatch to the correct per-field-type column builder based on field._meta.type
 * 6. For unknown field types: produce a fallback column that renders
 *    `String(value)` truncated to 50 characters (do not crash)
 * 7. If `admin.useAsTitle` is set, mark that column with meta.isTitle = true
 *    (the DataTable component uses this to render the cell as a link)
 *
 * Note: Complex object/array fields. Currently, all column builders assume
 * primitive values (string, number, boolean). If a collection has fields with
 * nested objects or arrays (e.g., from `extendTable` additional fields or
 * future relation fields), they will render via the fallback `String(value)`
 * truncated to 50 characters. See "Out of Scope" for future solutions.
 *
 * Edge cases:
 * - Unknown field type: produce fallback column with String(value) truncated to 50 chars
 * - Empty fields object: return only the _id column
 * - defaultColumns references a non-existent field: skip it
 * - defaultColumns references a hidden field: skip it
 */
export function generateColumns(
  collection: VexCollection,
): ColumnDef<Record<string, unknown>>[] {
  const columns: ColumnDef<Record<string, unknown>>[] = [];
  const useAsTitle = collection.config.admin?.useAsTitle as string | undefined;
  const defaultColumns = collection.config.admin?.defaultColumns as
    | string[]
    | undefined;
  const fields = collection.config.fields;

  // --- Step 1: Add _id column ---
  // columns.push({ accessorKey: "_id", header: "ID" })

  // --- Step 2: Determine which field keys to include ---
  // If defaultColumns is set: use that list (filter out non-existent and hidden fields)
  // Otherwise: use Object.keys(fields) (filter out hidden fields)

  // --- Step 3: For each field key, dispatch to the correct builder ---
  // Switch on (field._meta as BaseFieldMeta).type:
  //   "text"     -> textColumnDef({ fieldKey, meta })
  //   "number"   -> numberColumnDef({ fieldKey, meta })
  //   "checkbox" -> checkboxColumnDef({ fieldKey, meta })
  //   "select"   -> selectColumnDef({ fieldKey, meta })
  //   default    -> fallback column: { accessorKey: fieldKey, header: capitalize(fieldKey),
  //                  cell: ({ getValue }) => { const v = getValue(); return String(v).slice(0, 50) + (String(v).length > 50 ? "..." : ""); } }

  // --- Step 4: Mark useAsTitle column ---
  // If useAsTitle is set, find the matching column and set meta.isTitle = true
  // This is done by adding a `meta` property to the ColumnDef:
  //   col.meta = { ...col.meta, isTitle: true }

  return columns;
}
```

**File: `packages/core/src/columns/index.ts`**:

```typescript
export { generateColumns } from "./generateColumns";
```

**File: `packages/core/src/columns/generateColumns.test.ts`** — Full test file:

```typescript
import { describe, it, expect } from "vitest";
import { generateColumns } from "./generateColumns";
import { defineCollection } from "../config/defineCollection";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { checkbox } from "../fields/checkbox";
import { select } from "../fields/select";

describe("generateColumns", () => {
  it("always includes _id column as first column", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
      },
    });
    const columns = generateColumns(posts);
    expect(columns[0]).toHaveProperty("accessorKey", "_id");
    expect(columns[0]).toHaveProperty("header", "ID");
  });

  it("generates columns for all field types", () => {
    const items = defineCollection("items", {
      fields: {
        name: text({ required: true, label: "Name" }),
        count: number({ label: "Count" }),
        active: checkbox({ label: "Active" }),
        status: select({
          label: "Status",
          required: true,
          options: [
            { value: "open", label: "Open" },
            { value: "closed", label: "Closed" },
          ],
        }),
      },
    });
    const columns = generateColumns(items);

    // _id + 4 fields
    expect(columns).toHaveLength(5);
    expect(columns[1]).toHaveProperty("accessorKey", "name");
    expect(columns[1]).toHaveProperty("header", "Name");
    expect(columns[2]).toHaveProperty("accessorKey", "count");
    expect(columns[3]).toHaveProperty("accessorKey", "active");
    expect(columns[4]).toHaveProperty("accessorKey", "status");
  });

  it("respects defaultColumns — only shows specified fields", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
        slug: text(),
        body: text(),
        featured: checkbox(),
      },
      admin: {
        defaultColumns: ["title", "featured"],
      },
    });
    const columns = generateColumns(posts);

    // _id + title + featured
    expect(columns).toHaveLength(3);
    expect(columns[0]).toHaveProperty("accessorKey", "_id");
    expect(columns[1]).toHaveProperty("accessorKey", "title");
    expect(columns[2]).toHaveProperty("accessorKey", "featured");
  });

  it("skips hidden fields", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
        internalId: text({ admin: { hidden: true } }),
      },
    });
    const columns = generateColumns(posts);

    // _id + title (internalId skipped)
    expect(columns).toHaveLength(2);
    expect(
      columns.find((c: any) => c.accessorKey === "internalId"),
    ).toBeUndefined();
  });

  it("skips defaultColumns entries that reference hidden fields", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
        secret: text({ admin: { hidden: true } }),
      },
      admin: {
        defaultColumns: ["title", "secret"],
      },
    });
    const columns = generateColumns(posts);

    // _id + title (secret is hidden, skipped)
    expect(columns).toHaveLength(2);
  });

  it("skips defaultColumns entries that reference non-existent fields", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
      },
      admin: {
        defaultColumns: ["title", "nonexistent"],
      },
    });
    const columns = generateColumns(posts);

    // _id + title (nonexistent skipped)
    expect(columns).toHaveLength(2);
  });

  it("marks useAsTitle column with meta.isTitle", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
        body: text(),
      },
      admin: {
        useAsTitle: "title",
      },
    });
    const columns = generateColumns(posts);
    const titleCol = columns.find((c: any) => c.accessorKey === "title");

    expect(titleCol).toBeDefined();
    expect(titleCol!.meta).toHaveProperty("isTitle", true);
  });

  it("returns only _id column when fields object is empty", () => {
    const empty = defineCollection("empty", {
      fields: {},
    });
    const columns = generateColumns(empty);
    expect(columns).toHaveLength(1);
    expect(columns[0]).toHaveProperty("accessorKey", "_id");
  });

  it("does not mark any column as isTitle when useAsTitle is not set", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
      },
    });
    const columns = generateColumns(posts);
    const withIsTitle = columns.filter((c) => (c.meta as any)?.isTitle);
    expect(withIsTitle).toHaveLength(0);
  });

  it("produces a fallback column for unknown field types", () => {
    // Simulate an unknown field type by creating a field with a non-standard type
    const weird = defineCollection("weird", {
      fields: {
        title: text({ required: true }),
        custom: { _type: "", _meta: { type: "json" as any } } as any,
      },
    });
    const columns = generateColumns(weird);

    // _id + title + custom (fallback)
    expect(columns).toHaveLength(3);
    const customCol = columns.find((c: any) => c.accessorKey === "custom");
    expect(customCol).toBeDefined();
    expect(customCol).toHaveProperty("header", "Custom");
  });
});
```

---

## Step 8: DataTable Component

Create a generic, reusable `DataTable` component in `@vexcms/ui` using `@tanstack/react-table` and the existing Table primitives. Includes pagination controls (Previous/Next buttons, page indicator).

- [ ] Create `packages/ui/src/components/ui/data-table.tsx`
- [ ] Add `export * from "./data-table"` to `packages/ui/src/components/ui/index.tsx`
- [ ] Verify `pnpm --filter @vexcms/ui build` passes

**File: `packages/ui/src/components/ui/data-table.tsx`** — Full component:

```tsx
"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type Table as TanStackTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  /** Base path for link columns (e.g., "/admin") */
  basePath?: string;
  /** Collection slug — used to build edit links for isTitle columns */
  collectionSlug?: string;
  /** Render when the table has no data */
  emptyMessage?: string;
  /** Callback to load more data (called by parent, not DataTable itself) */
  onLoadMore?: () => void;
  /** Whether more data can be loaded from the server */
  canLoadMore?: boolean;
  /** Number of rows per page. Defaults to 10. */
  pageSize?: number;
}

function DataTable<TData extends Record<string, unknown>>({
  columns,
  data,
  basePath,
  collectionSlug,
  emptyMessage = "No results.",
  onLoadMore,
  canLoadMore,
  pageSize = 10,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  return (
    <div data-slot="data-table" className="space-y-4">
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    const isTitle = (cell.column.columnDef.meta as any)
                      ?.isTitle;
                    const cellValue = flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                    );

                    if (isTitle && basePath && collectionSlug) {
                      const docId = row.original._id as string;
                      const href = `${basePath}/${collectionSlug}/${docId}`;
                      return (
                        <TableCell key={cell.id}>
                          <a
                            href={href}
                            className="font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {cellValue}
                          </a>
                        </TableCell>
                      );
                    }

                    return <TableCell key={cell.id}>{cellValue}</TableCell>;
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      {data.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {pageCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() && !canLoadMore}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { DataTable, type DataTableProps };
```

**File: `packages/ui/src/components/ui/index.tsx`** — Add the export:

```typescript
// Add this line alongside the existing exports:
export * from "./data-table";
```

Note: The `table.tsx` file is NOT currently exported from `packages/ui/src/components/ui/index.tsx`. The `DataTable` component imports from `./table` directly (sibling import within the same package). You do NOT need to add `table.tsx` to the index exports — `DataTable` is the public API for table rendering.

---

## Step 9: searchDocuments Convex Function

Add a `searchDocuments` query to the test app's Convex functions.

- [ ] Add `searchDocuments` to `apps/test-app/convex/vex/model/collections.ts`
- [ ] Add `searchDocuments` query to `apps/test-app/convex/vex/collections.ts`
- [ ] Verify `pnpm --filter test-app convex typecheck` passes (or the Convex dev server accepts the new function)

**File: `apps/test-app/convex/vex/model/collections.ts`** — Add after `listDocuments`:

```typescript
export async function searchDocuments<
  DataModel extends GenericDataModel,
>(props: {
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>;
    searchIndexName: string;
    searchField: string;
    query: string;
  };
  ctx: GenericQueryCtx<DataModel>;
}) {
  const { args, ctx } = props;

  // Use ctx.db.query(args.collectionSlug)
  //   .withSearchIndex(args.searchIndexName, (q) => q.search(args.searchField, args.query))
  //   .take(50)
  //
  // Note: Convex's .withSearchIndex() API takes the index name and a callback
  // that receives a query builder. The search field and query string are passed
  // to q.search(). The .take(50) limits results.
  //
  // Return the docs array directly (no pagination for search results).
  throw new Error("TODO: implement");
}
```

**File: `apps/test-app/convex/vex/collections.ts`** — Add after `listDocuments`:

```typescript
export const searchDocuments = query({
  args: {
    collectionSlug: v.string(),
    searchIndexName: v.string(),
    searchField: v.string(),
    query: v.string(),
  },
  handler: async (
    ctx,
    { collectionSlug, searchIndexName, searchField, query: searchQuery },
  ) => {
    return await Collections.searchDocuments<DataModel>({
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        searchIndexName,
        searchField,
        query: searchQuery,
      },
      ctx,
    });
  },
});
```

---

## Step 10: usePaginationLoader Hook

Create a helper hook that watches TanStack Table's pagination state and triggers `loadMore()` when the user approaches the end of loaded data.

- [ ] Create `packages/admin-next/src/hooks/` directory
- [ ] Create `packages/admin-next/src/hooks/usePaginationLoader.ts`
- [ ] Create `packages/admin-next/src/hooks/usePaginationLoader.test.ts`
- [ ] Verify `pnpm --filter @vexcms/admin-next typecheck` passes

**File: `packages/admin-next/src/hooks/usePaginationLoader.ts`** — Guided stub:

```typescript
import { useEffect } from "react";

/**
 * Watches TanStack Table pagination state and triggers loadMore
 * when the user approaches the end of loaded data.
 *
 * This hook is called in CollectionsView and given the table's pagination state.
 * It does NOT render anything — it only has side effects (calling loadMore).
 *
 * @param props.pageIndex - Current page index from TanStack Table
 * @param props.pageSize - Page size
 * @param props.totalLoaded - Total number of currently loaded results
 * @param props.loadMore - Function to load more results (from useConvexPaginatedQuery)
 * @param props.canLoadMore - Whether more results are available (status !== "Exhausted")
 * @param props.batchSize - How many more to load (default: same as initial fetch)
 *
 * Logic:
 * - Calculate lastVisibleRow = (pageIndex + 1) * pageSize
 * - If lastVisibleRow >= totalLoaded - pageSize && canLoadMore:
 *     call loadMore(batchSize)
 * - Use useEffect to trigger this check when pageIndex changes
 *
 * The idea: when the user is within one page of the end of loaded data,
 * pre-fetch the next batch so they don't hit a dead end.
 */
export function usePaginationLoader(props: {
  pageIndex: number;
  pageSize: number;
  totalLoaded: number;
  loadMore: (numItems: number) => void;
  canLoadMore: boolean;
  batchSize: number;
}): void {
  const { pageIndex, pageSize, totalLoaded, loadMore, canLoadMore, batchSize } =
    props;

  // useEffect watching pageIndex, totalLoaded, canLoadMore:
  //   const lastVisibleRow = (pageIndex + 1) * pageSize;
  //   if (lastVisibleRow >= totalLoaded - pageSize && canLoadMore) {
  //     loadMore(batchSize);
  //   }

  throw new Error("TODO: implement");
}
```

**File: `packages/admin-next/src/hooks/usePaginationLoader.test.ts`** — Full test file:

```typescript
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePaginationLoader } from "./usePaginationLoader";

describe("usePaginationLoader", () => {
  it("calls loadMore when approaching end of loaded data", () => {
    const loadMore = vi.fn();
    renderHook(() =>
      usePaginationLoader({
        pageIndex: 4, // page 5 of 5 (0-indexed), showing rows 41-50
        pageSize: 10,
        totalLoaded: 50,
        loadMore,
        canLoadMore: true,
        batchSize: 50,
      }),
    );
    expect(loadMore).toHaveBeenCalledWith(50);
  });

  it("does not call loadMore when far from end of loaded data", () => {
    const loadMore = vi.fn();
    renderHook(() =>
      usePaginationLoader({
        pageIndex: 0, // page 1, showing rows 1-10
        pageSize: 10,
        totalLoaded: 50,
        loadMore,
        canLoadMore: true,
        batchSize: 50,
      }),
    );
    expect(loadMore).not.toHaveBeenCalled();
  });

  it("does not call loadMore when canLoadMore is false", () => {
    const loadMore = vi.fn();
    renderHook(() =>
      usePaginationLoader({
        pageIndex: 4,
        pageSize: 10,
        totalLoaded: 50,
        loadMore,
        canLoadMore: false,
        batchSize: 50,
      }),
    );
    expect(loadMore).not.toHaveBeenCalled();
  });

  it("calls loadMore when pageIndex changes to approach end", () => {
    const loadMore = vi.fn();
    const { rerender } = renderHook(
      ({ pageIndex }) =>
        usePaginationLoader({
          pageIndex,
          pageSize: 10,
          totalLoaded: 50,
          loadMore,
          canLoadMore: true,
          batchSize: 50,
        }),
      { initialProps: { pageIndex: 0 } },
    );

    expect(loadMore).not.toHaveBeenCalled();

    rerender({ pageIndex: 4 });
    expect(loadMore).toHaveBeenCalledWith(50);
  });
});
```

---

## Step 11: Wire Up CollectionsView.tsx

Update the `CollectionsView.tsx` in `@vexcms/admin-next` to use the `DataTable` component, `generateColumns`, search bar, pagination via `useConvexPaginatedQuery`, and document count.

- [ ] Update `packages/admin-next/src/views/CollectionsView.tsx`
- [ ] Verify the admin panel renders the data table at `http://localhost:3010/admin/posts`

**File: `packages/admin-next/src/views/CollectionsView.tsx`** — Guided stub (full replacement):

```tsx
"use client";

import { useState, useMemo } from "react";
import type { VexCollection, VexConfig } from "@vexcms/core";
import { generateColumns } from "@vexcms/core";
import { DataTable, Input } from "@vexcms/ui";
import { useQuery } from "@tanstack/react-query";
import { useConvexPaginatedQuery, convexQuery } from "@convex-dev/react-query";
import { anyApi } from "convex/server";
import { usePaginationLoader } from "../hooks/usePaginationLoader";

const DEFAULT_PAGE_SIZE = 10;

export default function CollectionsView({
  config,
  collection,
}: {
  config: VexConfig;
  collection: VexCollection;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const pageSize = DEFAULT_PAGE_SIZE;
  const initialFetchSize = Math.max(50, pageSize * 5);

  // --- Generate columns from collection field config ---
  // const columns = useMemo(() => generateColumns(collection), [collection]);

  // --- Determine if search is available ---
  // Search is available when:
  // 1. collection.config.admin?.useAsTitle is set
  // 2. A search index exists for that field (auto-generated or explicit)
  //
  // const useAsTitle = collection.config.admin?.useAsTitle as string | undefined;
  // const searchAvailable = !!useAsTitle;
  // const searchIndexName = useAsTitle ? `search_${useAsTitle}` : undefined;
  // const isSearching = searchAvailable && searchTerm.trim().length > 0;

  // --- Query: paginated list mode (useConvexPaginatedQuery) ---
  // When NOT searching: use useConvexPaginatedQuery for paginated results.
  // This returns { results, status, loadMore, isLoading }.
  //
  // const {
  //   results: listResults,
  //   status: paginationStatus,
  //   loadMore,
  //   isLoading: listLoading,
  // } = useConvexPaginatedQuery(
  //   anyApi.vex.collections.listDocuments,
  //   isSearching ? "skip" : { collectionSlug: collection.slug },
  //   { initialNumItems: initialFetchSize },
  // );

  // --- Query: search mode (useQuery + convexQuery, no server pagination) ---
  // When searching: use useQuery + convexQuery with .take(50) on server.
  //
  // const searchQuery = useQuery({
  //   ...convexQuery(anyApi.vex.collections.searchDocuments, {
  //     collectionSlug: collection.slug,
  //     searchIndexName: searchIndexName ?? "",
  //     searchField: useAsTitle ?? "",
  //     query: searchTerm.trim(),
  //   }),
  //   enabled: isSearching,
  // });

  // --- Derive active data ---
  // const documents = isSearching
  //   ? (searchQuery.data ?? [])
  //   : (listResults ?? []);
  //
  // const canLoadMore = !isSearching && paginationStatus === "CanLoadMore";

  // --- Pagination loader hook ---
  // Watches TanStack Table page state and triggers loadMore when approaching
  // end of loaded data. The table's pageIndex comes from DataTable's internal
  // state — we need to track it here. Use a state variable or ref.
  //
  // const [pageIndex, setPageIndex] = useState(0);
  // usePaginationLoader({
  //   pageIndex,
  //   pageSize,
  //   totalLoaded: documents.length,
  //   loadMore: (n) => { if (canLoadMore) loadMore(n); },
  //   canLoadMore,
  //   batchSize: initialFetchSize,
  // });

  // --- Document count ---
  // For list view: show documents.length (grows as more pages load)
  // For search view: show searchQuery.data?.length + " results"

  // --- Render ---
  // Layout:
  //   <div className="p-6">
  //     <div className="flex items-center justify-between mb-6">
  //       <div>
  //         <h1 className="text-2xl font-bold">
  //           {collection.config.labels?.plural ?? collection.slug}
  //         </h1>
  //         <p className="text-sm text-muted-foreground">
  //           {documentCount} document(s)
  //         </p>
  //       </div>
  //     </div>
  //
  //     {/* Search bar — only shown when searchAvailable */}
  //     {searchAvailable && (
  //       <div className="mb-4 max-w-sm">
  //         <Input
  //           placeholder={`Search by ${useAsTitle}...`}
  //           value={searchTerm}
  //           onChange={(e) => setSearchTerm(e.target.value)}
  //         />
  //       </div>
  //     )}
  //
  //     {/* Data table with pagination */}
  //     <DataTable
  //       columns={columns}
  //       data={documents}
  //       basePath={config.basePath}
  //       collectionSlug={collection.slug}
  //       emptyMessage={isSearching ? "No matching documents." : "No documents yet."}
  //       onLoadMore={() => { if (canLoadMore) loadMore(initialFetchSize); }}
  //       canLoadMore={canLoadMore}
  //       pageSize={pageSize}
  //     />
  //   </div>

  // TODO: Replace this placeholder with the layout above
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        {collection.config.labels?.plural ?? collection.slug}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Collection list view coming soon
      </p>
    </div>
  );
}
```

Key points for the implementer:

- **List mode** uses `useConvexPaginatedQuery` (re-exported from `convex/react` via `@convex-dev/react-query`). Pass `"skip"` as args when searching to disable the paginated query.
- **Search mode** uses `useQuery` + `convexQuery` with `enabled: isSearching`. No server-side pagination for search — just `.take(50)`.
- The `usePaginationLoader` hook should be called with the DataTable's current page index. Since DataTable manages its own pagination state internally, you may need to either: (a) lift pagination state up via a callback prop on DataTable, or (b) track it via a `onPaginationChange` callback. The simplest approach is to add an `onPageChange?: (pageIndex: number) => void` callback to DataTable that fires when the page changes, and use that to update local state in CollectionsView.
- The search input should be debounced (300ms) to avoid excessive queries while typing. Use a simple `useEffect` + `setTimeout` pattern or a debounce utility.

---

## Step 12: Final Export Updates and Verification

Ensure all new exports are wired up and everything builds.

- [ ] Verify `packages/core/src/index.ts` exports `generateColumns`, `SearchIndexConfig`, `ResolvedSearchIndex`
- [ ] Verify `packages/ui/src/components/ui/index.tsx` exports `DataTable`
- [ ] Run `pnpm --filter @vexcms/core test` — all tests pass
- [ ] Run `pnpm --filter @vexcms/core build` — builds cleanly
- [ ] Run `pnpm --filter @vexcms/ui build` — builds cleanly
- [ ] Run `pnpm --filter @vexcms/admin-next build` — builds cleanly
- [ ] Start test app and verify data table renders at `http://localhost:3010/admin/posts`
- [ ] Verify search bar appears for collections with `useAsTitle` set
- [ ] Verify search bar is hidden for collections without `useAsTitle`
- [ ] Verify document count displays correctly
- [ ] Verify `useAsTitle` column renders as a link to the edit view
- [ ] Verify pagination controls appear and Previous/Next buttons work
- [ ] Verify "Page X of Y" indicator updates correctly
- [ ] Verify loadMore is called automatically when approaching end of loaded data
- [ ] Verify search mode disables pagination and shows up to 50 results

---

## Success Criteria

- Data table renders documents for any collection in the admin panel
- `generateColumns` respects `defaultColumns`, `admin.hidden`, and `useAsTitle`
- `generateColumns` produces fallback columns for unknown field types using `String(value)` truncated to 50 characters
- `useAsTitle` column renders as a clickable link to `{basePath}/{collectionSlug}/{docId}`
- Search bar appears only when `useAsTitle` is set (meaning a search index exists)
- Typing in the search bar queries via `searchDocuments` and displays results (no server pagination, up to 50 results)
- Empty search uses `useConvexPaginatedQuery` with `initialNumItems = Math.max(50, pageSize * 5)`
- Pagination controls (Previous/Next buttons) appear below the table
- "Page X of Y" indicator shows current position and updates on page change
- Next button is disabled when on last page AND no more data can be loaded
- `usePaginationLoader` automatically calls `loadMore()` when user approaches end of loaded data
- Document count displays in the collection view header
- `generateVexSchema()` outputs `.searchIndex()` calls for configured search indexes
- All new code has colocated test files and tests pass
- `@vexcms/core`, `@vexcms/ui`, and `@vexcms/admin-next` all build cleanly
