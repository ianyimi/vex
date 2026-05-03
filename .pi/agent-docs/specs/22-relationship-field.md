# Spec 22 — Relationship Field

**Status:** In progress (Steps 1–5 complete, Steps 6–10 pending)
**Depends on:** Spec 20 (field type pattern), Spec 21 (module augmentation — `CollectionSlug`, `DocumentBySlug`)

---

## Overview

Implements the `relationship()` field type end-to-end: core types, config factory, Convex validator, Zod input schema, auto-generated FK and search indexes in schema generation, a live Convex search query for the admin picker, and React input/cell/column components wired into the adapter.

---

## Design Decisions

1. **Single collection only — no polymorphic.** `collection: { slug: TSlug }` takes exactly one slug object. Polymorphic (array of slugs) is deferred.

2. **`hasMany` is UI-only — Convex schema always stores as array.** Both `hasMany: false` and `hasMany: true` emit `v.array(v.id("slug"))` in the schema. The UI component uses `hasMany` to control whether the picker caps at one selection. This prevents a schema migration when toggling between single and multi-select on an existing collection. Form value is always `string[]`.

3. **Form value is always `string[]`.** Convex IDs are strings at the form boundary. The UI component handles display of the related document's title — the stored value is always an array of IDs regardless of `hasMany`.

4. **Auto FK index — explicit suppresses auto.** Every relationship field generates `.index("by_<fieldKey>", ["<fieldKey>"])` automatically unless a manual `field.index` is set, in which case only the explicit index is emitted.

5. **Auto search index on the related collection's `useAsTitle` field.** `collectionConfigToVexSchema` receives the full `VexConfig`. A new helper `getIncomingRelationships` detects whether any other collection has a relationship pointing to the current one. If yes and `useAsTitle` is not a Convex system field (`_id`, `_creationTime`), a `.searchIndex("search_<useAsTitle>", { searchField: "<useAsTitle>", filterFields: [] })` is emitted for that collection — unless a search index with the same name is already configured on that field. The auto index is emitted once regardless of how many collections point here.

6. **`collectionConfigToVexSchema` signature change — breaking.** Adds a required `config: VexConfig` parameter. All existing call sites and tests must pass the full config.

7. **Live Convex search in the picker.** A new `search` query added to `convex/vex/collections.ts`. When `useAsTitle` is a non-system field, the picker calls `vexConvexApi.search`. When `useAsTitle === "_id"`, falls back to `vexConvexApi.list` (search disabled).

8. **`RelationshipField` added to `AdminField` union only in the final wiring step.** All component and dispatch code exists first; the union and adapter are updated in one step to keep TypeScript happy (`FieldComponentMap<F>` requires all `AdminField["type"]` variants to have entries).

9. **`interfaceType` uses static constant — dynamic generation deferred.** `ADMIN_FIELDS.relationship.interfaceType` is `"Id<CollectionSlug>[]"` (always array form). Per-slug dynamic computation (`Id<"posts">[]`) is deferred to a later spec.

10. **Cell shows raw ID.** Fetching the related document in every list cell is expensive. The cell renders a truncated ID string. Population is deferred.

---

## Out of Scope

- Polymorphic relationships (multiple `collection` values)
- `filterOptions` — dynamic query constraints on the picker
- `minRows` / `maxRows` validation
- `allowCreate` / `allowEdit` in the picker UI
- `isSortable` drag-and-drop reordering
- Drawer appearance (only combobox in this spec)
- Populating the cell with the related document's title (deferred — expensive N+1)
- Bi-directional / join fields

---

## Target Directory Structure

```
packages/core/src/
  fields/
    constants.ts                        ← MODIFIED ✓
    types.ts                            ← MODIFIED ✓ — RelationshipField added to AdminField
    relationship/
      types.ts                          ← NEW ✓
      config.ts                         ← NEW ✓
      validator.ts                      ← NEW ✓
      validator.test.ts                 ← NEW ✓
      inputSchema.ts                    ← NEW ✓
      inputSchema.test.ts               ← NEW ✓
      index.ts                          ← NEW ✓
    validators/
      index.ts                          ← MODIFIED ✓ — relationship case added
    inputSchemas/
      index.ts                          ← PENDING (Step 9)
  collections/
    validator.ts                        ← MODIFIED ✓ — collectionConfigToVexSchema + getIncomingRelationships
                                          (NOTE: spec referenced schemaGen.ts — actual file is validator.ts)
    validator.test.ts                   ← MODIFIED ✓

packages/react/src/
  components/fields/
    relationship/
      types.ts                          ← PENDING (Step 7)
      Cell.tsx                          ← PENDING (Step 7)
      columnDef.tsx                     ← PENDING (Step 7)
      Input.tsx                         ← PENDING (Step 8)
      index.ts                          ← PENDING (Step 7)
    index.tsx                           ← PENDING (Step 9)
  adapter.ts                            ← PENDING (Step 9)

packages/core/src/convex/vex/
  collections.ts                        ← PENDING (Step 6)

packages/core/src/convex/
  index.ts                              ← PENDING (Step 6)

apps/www/src/vexcms/collections/
  posts.ts                              ← PENDING (Step 10)
```

---

## Implementation Order

1. `[agent]` **Step 1** — Baseline verification
2. `[agent]` **Step 2** — `relationship/types.ts` + `config.ts` + `ADMIN_FIELDS` entry + `relationship/index.ts`
3. `[dev]` **Step 3** — `relationshipFieldToValidator` + tests
4. `[dev]` **Step 4** — `relationshipFieldToInputSchema` + tests
5. `[dev]` **Step 5** — Update `collectionConfigToVexSchema`: signature, `getIncomingRelationships` helper, auto FK index, auto search index + update all tests
6. `[dev]` **Step 6** — `search` Convex query in `collections.ts` + `vexConvexApi.search` in `convex/index.ts`
7. `[agent]` **Step 7** — `RelationshipFieldCell` + `columnDef.tsx` + `relationship/index.ts`
8. `[dev]` **Step 8** — `RelationshipFieldInput` combobox
9. `[agent]` **Step 9** — Wire: `AdminField` union, dispatch functions, React adapter, `fields/index.tsx`
10. `[agent]` **Step 10** — `apps/www` posts collection example

---

## Step 1: Baseline Verification

- [x] Run `pnpm test --filter @vexcms/core` — all pass
- [x] Run `pnpm build --filter @vexcms/core` — builds
- [x] Run `pnpm build --filter @vexcms/react` — builds

---

## Step 2: Types, Config Factory, and Constants

- [x] Add `relationship` entry to `packages/core/src/fields/constants.ts`
- [x] Create `packages/core/src/fields/relationship/types.ts`
- [x] Create `packages/core/src/fields/relationship/config.ts`
- [x] Create `packages/core/src/fields/relationship/index.ts`

### `packages/core/src/fields/constants.ts` — relationship entry (actual)

```typescript
relationship: {
  type: "relationship",
  interfaceType: "Id<CollectionSlug>[]",
  validator: "v.array(\nv.string()\n)",
  defaultValue: [] as string[],
},
```

### `packages/core/src/fields/relationship/types.ts` (actual)

```typescript
import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput } from "../baseTypes";
import { CollectionSlug } from "../../types/generated";

export interface RelationshipFieldInput<
  TSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput {
  collection: {
    /** The slug of the collection this field links to. Must be a registered collection slug. */
    slug: TSlug;
  };
  /**
   * Whether this field stores multiple references.
   * `false` and `true` both store `Id[]` — hasMany is UI-only.
   * @defaultValue false
   */
  hasMany?: boolean;
}

export interface RelationshipField<
  TCollection extends string = string,
> extends BaseField {
  readonly type: typeof ADMIN_FIELDS.relationship.type;
  collection: {
    /** The slug of the collection this field links to. */
    slug: TCollection;
  };
  /** UI hint only — both values always store Id[]. false = picker caps at 1 selection. */
  hasMany: boolean;
}
```

### `packages/core/src/fields/relationship/config.ts` (actual)

```typescript
import { ADMIN_FIELDS } from "../constants";
import type { RelationshipFieldInput, RelationshipField } from "./types";
import type { CollectionSlug } from "../../types/generated";

export function relationship<TSlug extends CollectionSlug = CollectionSlug>(
  options: RelationshipFieldInput<TSlug>,
): RelationshipField<TSlug> {
  return {
    label: "",
    required: false,
    hasMany: false,
    ...options,
    type: ADMIN_FIELDS.relationship.type,
    interfaceType: ADMIN_FIELDS.relationship.interfaceType,
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      placeholder: "",
      description: "",
      ...options?.admin,
    },
  };
}
```

---

## Step 3: Validator + Tests

- [x] Create `packages/core/src/fields/relationship/validator.ts`
- [x] Create `packages/core/src/fields/relationship/validator.test.ts`
- [x] All tests pass

### `packages/core/src/fields/relationship/validator.ts` (actual)

````typescript
import { applyBaseValidators } from "../validators/utils";
import type { RelationshipField } from "./types";

/**
 * Converts a relationship field definition to a Convex schema validator string.
 *
 * Always emits `v.array(v.id("collection"))` regardless of `hasMany` —
 * relationship fields are always stored as an array so that switching between
 * single and multi-select never requires a schema migration. Wraps in
 * `v.optional()` when `field.required` is `false`.
 *
 * @param props - Input props.
 * @param props.field - The resolved relationship field definition.
 * @returns Convex validator string.
 *
 * @example
 * ```ts
 * relationshipFieldToValidator({ field: relationship({ collection: { slug: "authors" }, required: true }) })
 * // → 'v.array(v.id("authors"))'
 *
 * relationshipFieldToValidator({ field: relationship({ collection: { slug: "tags" } }) })
 * // → 'v.optional(v.array(v.id("tags")))'
 * ```
 *
 * @internal
 */
export function relationshipFieldToValidator(props: {
  field: RelationshipField;
}): string {
  const { field } = props;
  // Always emits v.array(v.id(...)) — hasMany is UI-only, schema is always array
  const validator = `v.array(v.id("${field.collection.slug}"))`;
  return applyBaseValidators({ field, validator });
}
````

### `packages/core/src/fields/relationship/validator.test.ts` (actual)

```typescript
import { describe, it, expect } from "vitest";
import { relationship } from "./config";
import { relationshipFieldToValidator } from "./validator";

describe("relationshipFieldToValidator", () => {
  it("emits v.array(v.id()) for a required reference", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: true,
    });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.array(v.id("authors"))',
    );
  });

  it("wraps v.array(v.id()) in v.optional() for an optional reference", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: false,
    });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.optional(v.array(v.id("authors")))',
    );
  });

  it("emits v.array(v.id()) for a required hasMany reference", () => {
    const field = relationship({
      collection: { slug: "tags" },
      hasMany: true,
      required: true,
    });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.array(v.id("tags"))',
    );
  });

  it("wraps v.array(v.id()) in v.optional() for an optional hasMany reference", () => {
    const field = relationship({
      collection: { slug: "tags" },
      hasMany: true,
      required: false,
    });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.optional(v.array(v.id("tags")))',
    );
  });

  it("uses the collection slug verbatim in the validator string", () => {
    const field = relationship({
      collection: { slug: "blog_posts" },
      required: true,
    });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.array(v.id("blog_posts"))',
    );
  });

  it("defaults required to false — emits v.optional(v.array(v.id()))", () => {
    const field = relationship({ collection: { slug: "authors" } });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.optional(v.array(v.id("authors")))',
    );
  });
});
```

---

## Step 4: Input Schema + Tests

- [x] Create `packages/core/src/fields/relationship/inputSchema.ts`
- [x] Create `packages/core/src/fields/relationship/inputSchema.test.ts`
- [x] All tests pass

### `packages/core/src/fields/relationship/inputSchema.ts` (actual)

````typescript
import { z, type ZodSchema } from "zod";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import type { RelationshipField } from "./types";
import { ADMIN_FIELDS } from "../constants";

/**
 * Builds a Zod schema for validating a relationship field value in the admin form.
 *
 * Always validates as `z.array(z.string())` regardless of `hasMany` — relationship
 * fields always store an array of Convex ID strings at the form boundary.
 * `hasMany` only controls the picker UI (single-select vs multi-select).
 *
 * A `.default([])` is applied so that `undefined` parses to `[]` rather than
 * failing or returning `undefined`.
 *
 * @param props - Input props.
 * @param props.field - The resolved relationship field definition.
 * @returns A Zod schema that validates `string[]` and defaults `undefined` to `[]`.
 *
 * @example
 * ```ts
 * // Both required and optional fields always use z.array(z.string())
 * const schema = relationshipFieldToInputSchema({ field: relationship({ collection: { slug: "authors" } }) });
 * schema.safeParse(["id1"]).success  // true
 * schema.safeParse("id1").success    // false — must be an array
 * schema.safeParse(undefined).data   // []
 * ```
 *
 * @internal
 */
export function relationshipFieldToInputSchema(props: {
  field: RelationshipField;
}): ZodSchema {
  const { field } = props;
  // Always array — hasMany is UI-only. defaultValue [] means undefined → [] always.
  const inputSchema = z
    .array(z.string())
    .default(ADMIN_FIELDS.relationship.defaultValue);
  return applyBaseInputSchemaMeta({ field, inputSchema });
}
````

### `packages/core/src/fields/relationship/inputSchema.test.ts` (actual)

```typescript
import { describe, it, expect } from "vitest";
import { relationship } from "./config";
import { relationshipFieldToInputSchema } from "./inputSchema";

describe("relationshipFieldToInputSchema", () => {
  // Always validates as z.array(z.string()) — hasMany is UI-only

  it("accepts an array of strings", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse(["abc123", "def456"]).success).toBe(true);
    expect(schema.safeParse([]).success).toBe(true);
  });

  it("rejects a bare string — must be wrapped in an array", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse("abc123").success).toBe(false);
  });

  it("rejects non-string array items", () => {
    const field = relationship({
      collection: { slug: "tags" },
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse([1, 2]).success).toBe(false);
  });

  it("rejects non-array values", () => {
    const field = relationship({
      collection: { slug: "tags" },
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse(123).success).toBe(false);
    expect(schema.safeParse(true).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
  });

  it("defaults undefined to [] for required fields", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual([]);
  });

  it("defaults undefined to [] for optional fields", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: false,
    });
    const schema = relationshipFieldToInputSchema({ field });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual([]);
  });

  it("hasMany: true produces the same array schema (hasMany is UI-only)", () => {
    const field = relationship({
      collection: { slug: "tags" },
      hasMany: true,
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse(["id1", "id2"]).success).toBe(true);
    expect(schema.safeParse("id1").success).toBe(false);
  });
});
```

---

## Step 5: Update `collectionConfigToVexSchema` + Tests

- [x] Updated `packages/core/src/collections/validator.ts` (not `schemaGen.ts` — file was already named `validator.ts`)
- [x] Updated `packages/core/src/collections/validator.test.ts`
- [x] All tests pass

### Key implementation notes (actual)

- `getIncomingRelationships` lives in `collections/validator.ts`
- Auto FK index uses `else if` — explicit `field.index` suppresses the auto `by_<fieldKey>` index
- Auto search index is computed once after the field loop (not per-field)
- Deduplication checks `searchIndexes.find(si => si.includes(\`search\_\${useAsTitle}\`))` to avoid emitting when the manual searchIndex name matches
- Auto search index always has `filterFields: []`
- `searchField` in the auto search index is `useAsTitle`, not the incoming relationship's field key

---

## Step 6: `search` Convex Query

- [x] Update `packages/core/src/convex/vex/collections.ts` — add `search` export
- [x] Update `packages/core/src/convex/index.ts` — add `vexConvexApi.search`
- [x] Run `pnpm build --filter @vexcms/core`

### Add to `packages/core/src/convex/vex/collections.ts`

````typescript
/**
 * Searches documents in a VexCMS-managed collection using a Convex search index.
 *
 * When `query` is non-empty, uses `ctx.db.search` with the provided index name.
 * When `query` is empty, falls back to `ctx.db.query(...).take(limit)` so the
 * picker shows recent items without requiring a search term.
 *
 * The `searchIndexName` must match a `.searchIndex()` declaration in the
 * collection's Convex schema. VexCMS auto-generates `search_<useAsTitle>` on
 * the target collection whenever another collection has a relationship pointing
 * to it and `useAsTitle` is not a Convex system field.
 *
 * @param collection - The Convex table name to search.
 * @param searchIndexName - The `.searchIndex()` name declared in the schema (e.g. `"search_name"`).
 * @param searchField - The field name the search index is built on (e.g. `"name"`). Must match the `searchField` in the `.searchIndex()` declaration. Pass `useAsTitle` from the target collection config.
 * @param query - The search text. Pass `""` to list recent documents instead of searching.
 * @param limit - Maximum number of results. Defaults to `20`.
 * @returns Array of matching documents, ordered by relevance or creation time.
 *
 * @example
 * ```ts
 * // Search authors by name
 * vexConvexApi.search({ collection: "authors", searchIndexName: "search_name", searchField: "name", query: "jane" })
 *
 * // List recent authors when no search term is entered
 * vexConvexApi.search({ collection: "authors", searchIndexName: "search_name", searchField: "name", query: "" })
 */
export const search = query({
  args: {
    collection: v.string(),
    searchIndexName: v.string(),
    searchField: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tableName = args.collection as TableNamesInDataModel<DataModel>;
    const limit = args.limit ?? 20;
    if (!args.query) {
      return ctx.db.query(tableName).take(limit);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (ctx.db.query(tableName) as any)
      .withSearchIndex(args.searchIndexName, (q: any) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        (q as any).search(args.searchField, args.query),
      )
      .take(limit);
  },
});
````

### Add to `packages/core/src/convex/index.ts` — inside `vexConvexApi`

```typescript
/**
 * Searches documents in a collection by a search index.
 *
 * Used by `RelationshipFieldInput` in `@vexcms/react` to populate the
 * relationship picker combobox. The `searchIndexName` must match the
 * `.searchIndex()` name in the Convex schema — VexCMS auto-generates
 * `search_<useAsTitle>` when another collection has a relationship here.
 * Pass `query: ""` to list recent documents when no search term is entered.
 *
 * @see {@link https://docs.convex.dev/text-search} for Convex search docs
 */
search: anyApi.vex.collections.search as FunctionReference<
  "query",
  "public",
  {
    collection: string;
    searchIndexName: string;
    searchField: string;
    query: string;
    limit?: number;
  },
  VexDocument[]
>,
```

---

## Step 7: Cell + Column Definition

- [ ] Create `packages/react/src/components/fields/relationship/types.ts`
- [ ] Create `packages/react/src/components/fields/relationship/Cell.tsx`
- [ ] Create `packages/react/src/components/fields/relationship/columnDef.tsx`
- [ ] Create `packages/react/src/components/fields/relationship/index.ts`
- [ ] Run `pnpm build --filter @vexcms/react`

### `packages/react/src/components/fields/relationship/types.ts`

```typescript
/**
 * A single option shown in the relationship field picker combobox.
 *
 * `id` is the Convex document ID stored as the field value.
 * `label` is the display string shown in the combobox, derived from the
 * related collection's `useAsTitle` field.
 */
export interface RelationshipOption {
  /** The Convex document ID — stored as the field value. */
  id: string;
  /** Display label shown in the picker, from the related collection's `useAsTitle` field. */
  label: string;
}
```

### `packages/react/src/components/fields/relationship/Cell.tsx`

````tsx
"use client";

// import type { CellComponentProps, RelationshipField } from "@vexcms/core";

/**
 * Relationship field cell component for the data-table list view.
 *
 * Displays the stored `Id[]` value for the relationship field. For
 * `hasMany: false`, renders the first (and only expected) ID truncated to
 * 16 characters. For `hasMany: true`, renders a count badge (`N items`).
 *
 * Full document title population is deferred — fetching the related
 * document's title in every cell would require N+1 Convex queries.
 *
 * @param props - Standard cell component props from `CellComponentProps<RelationshipField>`.
 *
 * @example
 * ```tsx
 * // Rendered automatically by relationshipFieldToColumnDef — not used directly
 * <RelationshipFieldCell value={["abc123"]} fieldDef={authorField} row={row} isTitleField={false} collection={postsCollection} />
 */
export function RelationshipFieldCell(
  props: CellComponentProps<RelationshipField>,
) {
  const { value, fieldDef } = props;

  if (!value) return <span className="text-muted-foreground">—</span>;

  if (fieldDef.hasMany) {
    const ids = Array.isArray(value) ? value : [];
    if (ids.length === 0)
      return <span className="text-muted-foreground">—</span>;
    return (
      <span className="text-xs text-muted-foreground font-mono">
        {ids.length} {ids.length === 1 ? "item" : "items"}
      </span>
    );
  }

  const ids = Array.isArray(value) ? value : [];
  const id = ids[0] ?? "";
  if (!id) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="text-xs font-mono text-muted-foreground" title={id}>
      {id.length > 16 ? `${id.slice(0, 16)}…` : id}
    </span>
  );
}
````

### `packages/react/src/components/fields/relationship/columnDef.tsx`

````tsx
import type { ColumnDef } from "@tanstack/react-table";
import type {
  CollectionConfig,
  RelationshipField,
  TDocument,
} from "@vexcms/core";
import { RelationshipFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a relationship field.
 *
 * The column value accessor reads `string[] | undefined` from the document —
 * relationship fields always store an array of Convex IDs regardless of
 * `hasMany`. Rendering is delegated to `RelationshipFieldCell`.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - The resolved relationship field definition.
 * @param props.fieldKey - The field key from `collection.fields` (e.g. `"author"`).
 * @param props.collection - The parent collection config.
 * @param props.isTitleField - Whether this field is the collection's `useAsTitle` field.
 * @returns A TanStack Table `ColumnDef` with sorting disabled and hiding enabled.
 *
 * @example
 * ```ts
 * const col = relationshipFieldToColumnDef({
 *   fieldDef: authorField,
 *   fieldKey: "author",
 *   collection: postsCollection,
 *   isTitleField: false,
 * });
 */
export function relationshipFieldToColumnDef(props: {
  fieldDef: RelationshipField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TDocument, string[] | undefined> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,
    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as string[] | undefined;
      return (
        <RelationshipFieldCell
          value={value}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
````

---

## Step 8: `RelationshipFieldInput` Combobox

- [ ] Create `packages/react/src/components/fields/relationship/Input.tsx`
- [ ] Run `pnpm build --filter @vexcms/react`

### Design notes

- Value is always `string[]` — `hasMany: false` means the picker enforces max 1 selection in the UI
- When `useAsTitle` is `_id` or `_creationTime`, search is disabled; falls back to `vexConvexApi.list`
- `searchIndexName` is `search_${useAsTitle}` — matches the auto-generated index from Step 5
- `searchField` is `useAsTitle` from the target collection config — passed explicitly so the Convex query doesn't need to guess the field from the index name
- Combobox built with shadcn `Command` + `Popover`
- `hasMany: false`: selecting replaces current value; trigger shows single selected label
- `hasMany: true`: selecting toggles; trigger shows badges with remove buttons

---

## Step 9: Wire Everything

- [ ] Update `packages/core/src/fields/inputSchemas/index.ts` — add `relationship` case
- [ ] Update `packages/react/src/components/fields/index.tsx` — add to all three maps
- [ ] Update `packages/react/src/adapter.ts` — add relationship to fields map
- [ ] Run `pnpm build --filter @vexcms/core && pnpm build --filter @vexcms/react`
- [ ] Run `pnpm test --filter @vexcms/core`

> Note: `RelationshipField` was already added to the `AdminField` union in `types.ts` and `validators/index.ts` during Step 3 implementation. Only `inputSchemas/index.ts` and the React wiring remain.

---

## Step 10: `apps/www` Example

- [ ] Update `apps/www/src/vexcms/collections/posts.ts` to add a relationship field
- [ ] Run `pnpm --filter www typecheck`

---

## Verification (mandatory)

- [x] `pnpm test --filter @vexcms/core` — all 210 tests pass
- [ ] `pnpm build --filter @vexcms/react` — pending Steps 7–9
- [ ] `pnpm --filter www typecheck` — pending Step 10

---

## Success Criteria

- [x] `relationship({ collection: { slug: "authors" } })` produces a valid resolved field
- [x] A relationship field always emits `v.array(v.id(...))` in the schema regardless of `hasMany`
- [x] A relationship field named `author` auto-generates `.index("by_author", ["author"])` unless explicit index is set
- [x] A collection with `useAsTitle: "name"` and an incoming relationship auto-generates `.searchIndex("search_name", ...)` exactly once
- [ ] The relationship picker combobox opens, searches via Convex, and stores the selected ID(s)
- [ ] `RelationshipField<string>` in `AdminField` causes a TypeScript error in `reactAdapter.fields` if the relationship entry is missing
