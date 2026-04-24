# Spec 22 — Relationship Field

**Status:** Ready to implement
**Depends on:** Spec 20 (field type pattern), Spec 21 (module augmentation — `CollectionSlug`, `DocumentBySlug`)

---

## Overview

Implements the `relationship()` field type end-to-end: core types, config factory, Convex validator, Zod input schema, auto-generated FK and search indexes in schema generation, a live Convex search query for the admin picker, and React input/cell/column components wired into the adapter.

---

## Design Decisions

1. **Single collection only — no polymorphic.** `collection: CollectionSlug` takes exactly one slug. Polymorphic (array of slugs) is deferred.

2. **`hasMany` covered in this spec.** `hasMany: false` → `v.id("slug")` / `string`. `hasMany: true` → `v.array(v.id("slug"))` / `string[]`. The same combobox UI handles both.

3. **Form value is plain `string` / `string[]`.** Convex IDs are strings at the form boundary. The UI component handles display of the related document's title — the stored value is just the ID.

4. **Auto FK index, always.** Every relationship field generates `.index("by_<fieldKey>", ["<fieldKey>"])` automatically. No explicit `index` property needed on the field.

5. **Auto search index on the related collection's `useAsTitle` field.** `collectionConfigToVexSchema` receives the full `VexConfig`. A new helper `getIncomingRelationships` detects whether any other collection has a relationship pointing to the current one. If yes and `useAsTitle` is not a Convex system field (`_id`, `_creationTime`), a `.searchIndex("search_<useAsTitle>", { searchField: "<useAsTitle>", filterFields: [] })` is emitted for that collection — unless a search index with the same name is already configured on that field.

6. **`collectionConfigToVexSchema` signature change — breaking.** Adds a required `config: VexConfig` parameter. All existing call sites and tests must pass the full config.

7. **Live Convex search in the picker.** A new `search` query added to `convex/vex/collections.ts`. When `useAsTitle` is a non-system field, the picker calls `vexConvexApi.search`. When `useAsTitle === "_id"`, falls back to `vexConvexApi.list` (search disabled).

8. **`RelationshipField` added to `AdminField` union only in the final wiring step.** All component and dispatch code exists first; the union and adapter are updated in one step to keep TypeScript happy (`FieldComponentMap<F>` requires all `AdminField["type"]` variants to have entries).

9. **`interfaceType` is computed dynamically by the factory.** `ADMIN_FIELDS.relationship.interfaceType` is a placeholder (`"Id<string>"`). The factory sets the actual `interfaceType` on the resolved field: `Id<"posts">` (single) or `Id<"posts">[]` (many).

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
    constants.ts                        ← MODIFIED — add relationship entry
    types.ts                            ← MODIFIED — add RelationshipField<string> to AdminField (Step 9)
    relationship/
      types.ts                          ← NEW — RelationshipFieldInput, RelationshipField
      config.ts                         ← NEW — relationship() factory
      validator.ts                      ← NEW — relationshipFieldToValidator
      validator.test.ts                 ← NEW
      inputSchema.ts                    ← NEW — relationshipFieldToInputSchema
      inputSchema.test.ts               ← NEW
      index.ts                          ← NEW — re-exports
    validators/
      index.ts                          ← MODIFIED — add relationship case (Step 9)
    inputSchemas/
      index.ts                          ← MODIFIED — add relationship case (Step 9)
  collections/
    schemaGen.ts                        ← MODIFIED — add config param, helper, auto-indexes
    schemaGen.test.ts                   ← MODIFIED — update all call sites + new tests
  convex/
    index.ts                            ← MODIFIED — add vexConvexApi.search reference
    vex/
      collections.ts                    ← MODIFIED — add search query

packages/react/src/
  components/fields/
    relationship/
      types.ts                          ← NEW — RelationshipOption type used in picker
      Cell.tsx                          ← NEW — RelationshipFieldCell
      columnDef.tsx                     ← NEW — relationshipFieldToColumnDef
      Input.tsx                         ← NEW — RelationshipFieldInput combobox
      index.ts                          ← NEW — re-exports
    index.tsx                           ← MODIFIED — add to fieldInputComponents, fieldCellComponents, getCollectionColumnDefs (Step 9)
  adapter.ts                            ← MODIFIED — add relationship to fields map (Step 9)

apps/www/src/vexcms/collections/
  posts.ts                              ← MODIFIED — add relationship field example
```

---

## Implementation Order

> **Key:**
> - `[agent]` — Boilerplate or pattern-following; agent generates this
> - `[dev]` — Important custom implementation; dev implements this

1. `[agent]` **Step 1** — Baseline verification
2. `[agent]` **Step 2** — `relationship/types.ts` + `config.ts` + `ADMIN_FIELDS` entry + `relationship/index.ts`
3. `[dev]`   **Step 3** — `relationshipFieldToValidator` + tests
4. `[dev]`   **Step 4** — `relationshipFieldToInputSchema` + tests
5. `[dev]`   **Step 5** — Update `collectionConfigToVexSchema`: signature, `getIncomingRelationships` helper, auto FK index, auto search index + update all tests
6. `[dev]`   **Step 6** — `search` Convex query in `collections.ts` + `vexConvexApi.search` in `convex/index.ts`
7. `[agent]` **Step 7** — `RelationshipFieldCell` + `columnDef.tsx` + `relationship/index.ts`
8. `[dev]`   **Step 8** — `RelationshipFieldInput` combobox
9. `[agent]` **Step 9** — Wire: `AdminField` union, dispatch functions, React adapter, `fields/index.tsx`
10. `[agent]` **Step 10** — `apps/www` posts collection example

---

## Step 1: Baseline Verification

- [ ] Run `pnpm test --filter @vexcms/core` — all pass
- [ ] Run `pnpm build --filter @vexcms/core` — builds
- [ ] Run `pnpm build --filter @vexcms/react` — builds
- [ ] Note any pre-existing failures so you don't chase them

---

## Step 2: Types, Config Factory, and Constants

- [ ] Add `relationship` entry to `packages/core/src/fields/constants.ts`
- [ ] Create `packages/core/src/fields/relationship/types.ts`
- [ ] Create `packages/core/src/fields/relationship/config.ts`
- [ ] Create `packages/core/src/fields/relationship/index.ts`
- [ ] Run `pnpm build --filter @vexcms/core` — no type errors

### `packages/core/src/fields/constants.ts` — add to `ADMIN_FIELDS`

```typescript
relationship: {
  type: "relationship",
  // Placeholder — the factory computes the real interfaceType from collection + hasMany
  interfaceType: "Id<string>",
  validator: "v.id",
  defaultValue: undefined as string | string[] | undefined,
},
```

### `packages/core/src/fields/relationship/types.ts`

```typescript
import { ADMIN_FIELDS } from "../constants";
import type { BaseField, BaseFieldInput } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";

/**
 * Configuration input for a `relationship()` field.
 *
 * Stores a Convex `Id` (or array of `Id`s) pointing to documents in another
 * registered collection. `TSlug` is inferred from the `collection` option —
 * after running `vex generate`, invalid slugs are a compile-time error.
 *
 * **Defaults applied by `relationship()`:**
 * ```ts
 * {
 *   type:     "relationship",
 *   label:    "",    // inferred from the field key by defineCollection
 *   required: false,
 *   hasMany:  false, // single Id reference by default
 *   admin: {
 *     hidden:        false,
 *     readOnly:      false,
 *     position:      "main",
 *     width:         "full",
 *     cellAlignment: "left",
 *   }
 * }
 * ```
 *
 * @typeParam TSlug - The target collection slug. Inferred from `collection`.
 *   Defaults to `CollectionSlug` (the full union after `vex generate`).
 *
 * @example
 * ```ts
 * // Single reference
 * author: relationship({ collection: "authors" })
 *
 * // Multi-reference
 * tags: relationship({ collection: "tags", hasMany: true })
 * ```
 *
 * @see {@link RelationshipField} for the resolved output type
 * @see {@link relationship} for the config function
 * @see {@link CollectionSlug} for the valid slug union
 */
export interface RelationshipFieldInput<
  TSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput {
  /** The slug of the collection this field links to. Must be a registered collection slug. */
  collection: TSlug;
  /**
   * Whether this field stores multiple references.
   * `false` stores a single `Id`, `true` stores `Id[]`.
   * @defaultValue false
   */
  hasMany?: boolean;
}

/**
 * Resolved configuration for a `relationship()` field, after all defaults are applied.
 *
 * `TCollection` is the string-literal type of the target collection's slug,
 * inferred from `RelationshipFieldInput.collection`.
 *
 * @typeParam TCollection - The target collection slug (inferred from input).
 * @see {@link RelationshipFieldInput} for the user-facing input type
 * @see {@link relationship} for the config function
 */
export interface RelationshipField<TCollection extends string = string>
  extends BaseField {
  readonly type: typeof ADMIN_FIELDS.relationship.type;
  /** The slug of the collection this field links to. */
  collection: TCollection;
  /** Whether this field stores multiple document references. */
  hasMany: boolean;
}
```

### `packages/core/src/fields/relationship/config.ts`

```typescript
import { ADMIN_FIELDS } from "../constants";
import type { RelationshipFieldInput, RelationshipField } from "./types";
import type { CollectionSlug } from "../../types/generated";

/**
 * Creates a relationship field with all defaults applied.
 *
 * Stores a Convex `Id<collection>` (or `Id<collection>[]` when `hasMany: true`)
 * pointing to a document in the specified collection. The generated Convex schema
 * emits `v.id("collection")` and automatically adds a `.index("by_<fieldKey>",
 * ["<fieldKey>"])` — no explicit `index` property needed.
 *
 * `TSlug` is inferred from `options.collection`. After running `vex generate`,
 * passing an unregistered slug is a compile-time error.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from field key by `defineCollection`)
 * - `required` — `false`
 * - `hasMany` — `false`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @typeParam TSlug - Inferred from `options.collection`.
 * @param options - Relationship field config. `collection` is required.
 * @returns Resolved relationship field definition with all defaults applied.
 *
 * @example
 * ```ts
 * // Single reference — stores Id<"authors">
 * author: relationship({ collection: "authors" })
 *
 * // Multi-reference — stores Id<"tags">[]
 * tags: relationship({ collection: "tags", hasMany: true, required: false })
 * ```
 *
 * @see {@link RelationshipFieldInput} for the full input type
 * @see {@link RelationshipField} for the resolved output type
 */
export function relationship<TSlug extends CollectionSlug = CollectionSlug>(
  options: RelationshipFieldInput<TSlug>,
): RelationshipField<TSlug> {
  const interfaceType = options.hasMany
    ? `Id<"${options.collection}">[]`
    : `Id<"${options.collection}">`;

  return {
    type: ADMIN_FIELDS.relationship.type,
    interfaceType,
    label: "",
    required: false,
    hasMany: false,
    ...options,
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

### `packages/core/src/fields/relationship/index.ts`

```typescript
export * from "./config";
export * from "./types";
```

> **Note:** `validator.ts` and `inputSchema.ts` are added to this re-export in Steps 3 and 4.

---

## Step 3: Validator + Tests

- [ ] Create `packages/core/src/fields/relationship/validator.ts`
- [ ] Create `packages/core/src/fields/relationship/validator.test.ts`
- [ ] Run `pnpm test --filter @vexcms/core` — new tests pass

### `packages/core/src/fields/relationship/validator.ts`

```typescript
import { applyBaseValidators } from "../validators/utils";
import type { RelationshipField } from "./types";

/**
 * Converts a relationship field definition to a Convex schema validator string.
 *
 * Emits `v.id("collection")` for single references and
 * `v.array(v.id("collection"))` for multi-references. Wraps in `v.optional()`
 * when `field.required` is `false`.
 *
 * @param props - Input props.
 * @param props.field - The resolved relationship field definition.
 * @returns Convex validator string.
 *
 * @example
 * ```ts
 * relationshipFieldToValidator({ field: relationship({ collection: "authors", required: true }) })
 * // → 'v.id("authors")'
 *
 * relationshipFieldToValidator({ field: relationship({ collection: "tags", hasMany: true }) })
 * // → 'v.optional(v.array(v.id("tags")))'
 * ```
 *
 * @internal
 */
export function relationshipFieldToValidator(props: {
  field: RelationshipField;
}): string {
  // TODO: implement
  //
  // 1. Build the base validator:
  //    → hasMany: false → `v.id("${field.collection}")`
  //    → hasMany: true  → `v.array(v.id("${field.collection}"))`
  //
  // 2. Wrap with applyBaseValidators({ field, validator }) to handle optional
  //
  // 3. Return the string
  throw new Error("Not implemented");
}
```

### `packages/core/src/fields/relationship/validator.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { relationship } from "./config";
import { relationshipFieldToValidator } from "./validator";

describe("relationshipFieldToValidator", () => {
  it("emits v.id() for a required single reference", () => {
    const field = relationship({ collection: "authors", required: true });
    expect(relationshipFieldToValidator({ field })).toBe('v.id("authors")');
  });

  it("wraps in v.optional() for an optional single reference", () => {
    const field = relationship({ collection: "authors", required: false });
    expect(relationshipFieldToValidator({ field })).toBe('v.optional(v.id("authors"))');
  });

  it("emits v.array(v.id()) for a required hasMany reference", () => {
    const field = relationship({
      collection: "tags",
      hasMany: true,
      required: true,
    });
    expect(relationshipFieldToValidator({ field })).toBe('v.array(v.id("tags"))');
  });

  it("wraps v.array(v.id()) in v.optional() for optional hasMany", () => {
    const field = relationship({
      collection: "tags",
      hasMany: true,
      required: false,
    });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.optional(v.array(v.id("tags")))',
    );
  });

  it("uses the collection slug verbatim in the validator string", () => {
    const field = relationship({
      collection: "blog_posts",
      required: true,
    });
    expect(relationshipFieldToValidator({ field })).toBe('v.id("blog_posts")');
  });

  it("defaults to non-optional when required is not set (required defaults to false)", () => {
    const field = relationship({ collection: "authors" });
    // required defaults to false → optional
    expect(relationshipFieldToValidator({ field })).toBe('v.optional(v.id("authors"))');
  });
});
```

Also add `validator.ts` to `packages/core/src/fields/relationship/index.ts`:

```typescript
export * from "./config";
export * from "./types";
export * from "./validator";
```

---

## Step 4: Input Schema + Tests

- [ ] Create `packages/core/src/fields/relationship/inputSchema.ts`
- [ ] Create `packages/core/src/fields/relationship/inputSchema.test.ts`
- [ ] Add `inputSchema` to `packages/core/src/fields/relationship/index.ts`
- [ ] Run `pnpm test --filter @vexcms/core` — new tests pass

### `packages/core/src/fields/relationship/inputSchema.ts`

```typescript
import { z, type ZodSchema } from "zod";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import type { RelationshipField } from "./types";

/**
 * Builds a Zod schema for validating a relationship field value in the admin form.
 *
 * Convex document IDs are strings at the form boundary. Single references
 * validate as `z.string()`. Multi-references (`hasMany: true`) validate as
 * `z.array(z.string())` with a default of `[]`. Wraps in `.optional()` for
 * non-required fields via {@link applyBaseInputSchemaMeta}.
 *
 * @param props - Input props.
 * @param props.field - The resolved relationship field definition.
 * @returns A Zod schema for the relationship value.
 *
 * @example
 * ```ts
 * // Single, optional (default)
 * relationshipFieldToInputSchema({ field: relationship({ collection: "authors" }) })
 * // → z.string().optional()
 *
 * // Multi, required
 * relationshipFieldToInputSchema({ field: relationship({ collection: "tags", hasMany: true, required: true }) })
 * // → z.array(z.string()).default([])
 * ```
 *
 * @internal
 */
export function relationshipFieldToInputSchema(props: {
  field: RelationshipField;
}): ZodSchema {
  // TODO: implement
  //
  // 1. hasMany: false → base schema is z.string()
  //    hasMany: true  → base schema is z.array(z.string()).default([])
  //
  // 2. Pass to applyBaseInputSchemaMeta({ field, inputSchema }) to handle
  //    label metadata and .optional() wrapping for non-required fields
  //
  // 3. Return the result
  //
  // Edge cases:
  // - hasMany: true + required: false → z.array(z.string()).default([]).optional()
  //   The .default([]) means safeParse(undefined) returns []
  // - hasMany: false + required: false → z.string().optional()
  //   safeParse(undefined) returns undefined
  throw new Error("Not implemented");
}
```

### `packages/core/src/fields/relationship/inputSchema.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { relationship } from "./config";
import { relationshipFieldToInputSchema } from "./inputSchema";

describe("relationshipFieldToInputSchema", () => {
  // ─── single reference ─────────────────────────────────────────────────────

  it("accepts a valid string (Convex ID) for a required single ref", () => {
    const field = relationship({ collection: "authors", required: true });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse("abc123").success).toBe(true);
  });

  it("rejects undefined for a required single ref", () => {
    const field = relationship({ collection: "authors", required: true });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse(undefined).success).toBe(false);
  });

  it("accepts undefined and returns undefined for an optional single ref", () => {
    const field = relationship({ collection: "authors", required: false });
    const schema = relationshipFieldToInputSchema({ field });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeUndefined();
  });

  it("rejects non-string values for a single ref", () => {
    const field = relationship({ collection: "authors", required: true });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse(123).success).toBe(false);
    expect(schema.safeParse([]).success).toBe(false);
  });

  // ─── hasMany reference ────────────────────────────────────────────────────

  it("accepts an array of strings for required hasMany", () => {
    const field = relationship({
      collection: "tags",
      hasMany: true,
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse(["id1", "id2"]).success).toBe(true);
    expect(schema.safeParse([]).success).toBe(true);
  });

  it("rejects non-array for hasMany", () => {
    const field = relationship({
      collection: "tags",
      hasMany: true,
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse("id1").success).toBe(false);
    expect(schema.safeParse(undefined).success).toBe(false);
  });

  it("returns default [] when undefined is parsed on optional hasMany", () => {
    const field = relationship({
      collection: "tags",
      hasMany: true,
      required: false,
    });
    const schema = relationshipFieldToInputSchema({ field });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual([]);
  });

  it("rejects non-string array items for hasMany", () => {
    const field = relationship({
      collection: "tags",
      hasMany: true,
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse([1, 2]).success).toBe(false);
  });
});
```

Add to `packages/core/src/fields/relationship/index.ts`:

```typescript
export * from "./config";
export * from "./types";
export * from "./validator";
export * from "./inputSchema";
```

---

## Step 5: Update `collectionConfigToVexSchema` + Tests

This is the most complex core change. `collectionConfigToVexSchema` must now:
1. Accept the full `VexConfig` to detect cross-collection relationships
2. Auto-emit `.index("by_<fieldKey>", ["<fieldKey>"])` for every relationship field
3. Auto-emit `.searchIndex("search_<useAsTitle>", ...)` if any collection has a relationship pointing HERE and `useAsTitle` is not a system field

All existing `collectionConfigToVexSchema({ collection })` call sites must be updated to `collectionConfigToVexSchema({ collection, config })`.

- [ ] Update `packages/core/src/collections/schemaGen.ts`
- [ ] Update `packages/core/src/collections/schemaGen.test.ts` — all existing tests + new relationship tests
- [ ] Update `packages/core/src/schema/generateVexSchema.ts` — pass `config` to `collectionConfigToVexSchema`
- [ ] Run `pnpm test --filter @vexcms/core` — all tests pass

### `packages/core/src/collections/schemaGen.ts` — full replacement

```typescript
import { ADMIN_FIELDS } from "../fields/constants";
import type { AdminField } from "../fields/types";
import type { RelationshipField } from "../fields/relationship/types";
import { adminFieldToValidator } from "../fields/validators";
import { CollectionConfig } from "./types";
import type { VexConfig } from "../config/types";

/**
 * Describes a relationship field in another collection that points to a given collection.
 *
 * Used by `collectionConfigToVexSchema` to detect whether a search index should be
 * auto-generated on the current collection's `useAsTitle` field.
 *
 * @see {@link getIncomingRelationships}
 */
export interface IncomingRelationship {
  /** The slug of the collection that holds the relationship field. */
  fromSlug: string;
  /** The field key of the relationship field in that collection. */
  fieldKey: string;
}

/**
 * Returns all relationship fields in other collections that point to `collection`.
 *
 * Iterates every collection in `config` (excluding `collection` itself) and collects
 * any field with `type === "relationship"` whose `collection` matches
 * `props.collection.slug`.
 *
 * @param props - Input props.
 * @param props.collection - The collection being checked for incoming relationships.
 * @param props.config - The full resolved VexCMS configuration.
 * @returns An array of `IncomingRelationship` descriptors, empty if none found.
 *
 * @example
 * ```ts
 * // posts has: author: relationship({ collection: "authors" })
 * getIncomingRelationships({ collection: authorsCollection, config })
 * // → [{ fromSlug: "posts", fieldKey: "author" }]
 * ```
 */
export function getIncomingRelationships(props: {
  collection: CollectionConfig;
  config: VexConfig;
}): IncomingRelationship[] {
  // TODO: implement
  //
  // 1. Filter config.collections to exclude the current collection
  //    (skip entries where c.slug === props.collection.slug)
  //
  // 2. For each remaining collection, iterate Object.entries(collection.fields)
  //    → For each [fieldKey, field] where field.type === ADMIN_FIELDS.relationship.type:
  //      Cast field to RelationshipField
  //      If (field as RelationshipField).collection === props.collection.slug:
  //        Push { fromSlug: collection.slug, fieldKey }
  //
  // 3. Return the array (empty if no relationships found)
  throw new Error("Not implemented");
}

/**
 * Converts a resolved `CollectionConfig` to a Convex `defineTable(...)` source string.
 *
 * Iterates the collection's fields, builds each field's Convex validator via
 * `adminFieldToValidator`, and appends index chains:
 * - `.index()` for fields with an explicit `field.index` property
 * - `.index("by_<fieldKey>", ["<fieldKey>"])` auto-generated for every relationship field
 * - `.searchIndex()` for text fields with `field.searchIndex` configured
 * - `.searchIndex("search_<useAsTitle>", { searchField: "<useAsTitle>", filterFields: [] })`
 *   auto-generated when another collection has a relationship pointing HERE and
 *   `useAsTitle` is not a Convex system field (`_id`, `_creationTime`), provided
 *   no manually configured search index already has that name.
 *
 * @param props - Input props.
 * @param props.collection - The resolved collection definition to convert.
 * @param props.config - The full resolved VexCMS config, needed for cross-collection relationship detection.
 * @returns A TypeScript source string declaring the Convex table.
 *
 * @example
 * ```ts
 * const posts = defineCollection({
 *   slug: "posts",
 *   fields: { author: relationship({ collection: "authors", required: true }) },
 * });
 * collectionConfigToVexSchema({ collection: posts, config });
 * // → 'export const posts = defineTable({...})\n\t.index("by_author", ["author"])'
 * ```
 *
 * @see {@link generateVexSchema} for the full-file generator that wraps this function
 * @see {@link getIncomingRelationships} for the cross-collection helper
 */
export function collectionConfigToVexSchema(props: {
  collection: CollectionConfig;
  config: VexConfig;
}): string {
  // TODO: implement
  //
  // This is a significant refactor of the existing implementation. The core
  // field iteration is the same — new logic is the auto-index cases.
  //
  // 1. fieldsBlock: for each [fieldKey, field] in collection.fields:
  //    Push `\t${fieldKey}: ${adminFieldToValidator({ field })},`
  //
  // 2. indexes: start with existing logic for field.index:
  //    If field.index: push `.index("${field.index}", ["${fieldKey}"])`
  //    NEW: If field.type === "relationship":
  //      Push `.index("by_${fieldKey}", ["${fieldKey}"])`
  //      (always, unconditionally — the auto FK index)
  //
  // 3. searchIndexes: start with existing text field logic:
  //    If field.type === "text" && field.searchIndex:
  //      Push the searchIndex chain (same as before)
  //    NEW: After iterating fields, compute auto search index:
  //      a. Call getIncomingRelationships({ collection: props.collection, config: props.config })
  //      b. If any incoming relationships exist AND props.collection.admin.useAsTitle is not
  //         one of ["_id", "_creationTime"] (Convex system fields):
  //         - const useAsTitleKey = props.collection.admin.useAsTitle
  //         - const autoSearchIndexName = `search_${useAsTitleKey}`
  //         - Check: does any text field in collection.fields already have
  //           field.searchIndex?.name === autoSearchIndexName?
  //           (to avoid duplicating a manually configured search index)
  //         - If no duplicate: push `.searchIndex("${autoSearchIndexName}", {
  //             searchField: "${useAsTitleKey}",
  //             filterFields: [],
  //           })`
  //
  // 4. Assemble and return the defineTable string — same as before:
  //    `export const ${collection.slug} = defineTable({\n${fieldsBlock.join("\n")}\n})`
  //    + indexes.join("") + searchIndexes.join("")
  //
  // Edge cases:
  // - No fields: fieldsBlock is empty → defineTable({})
  // - useAsTitle is "_id" (default): do NOT add auto search index
  // - Relationship field AND explicit field.index: both indexes are emitted
  //   (the explicit one from field.index + the auto by_<fieldKey> from relationship)
  // - Multiple incoming relationships from different collections: only ONE
  //   search index is emitted (check once; the incoming relationship count doesn't matter)
  throw new Error("Not implemented");
}
```

### `packages/core/src/collections/schemaGen.test.ts` — new and updated tests

Add these describe blocks. Also update every existing `collectionConfigToVexSchema({ collection })` call to `collectionConfigToVexSchema({ collection, config: defineConfig({ collections: [collection] }) })`.

```typescript
import { describe, it, expect } from "vitest";
import { defineCollection, defineConfig } from "../index";
import { relationship } from "../fields/relationship/config";
import { url, text, number, checkbox, date, select } from "../fields";
import {
  collectionConfigToVexSchema,
  getIncomingRelationships,
} from "./schemaGen";

// ─── getIncomingRelationships ─────────────────────────────────────────────────

describe("getIncomingRelationships", () => {
  it("returns an empty array when no collections have relationships", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
    });
    const config = defineConfig({ collections: [authors] });
    expect(getIncomingRelationships({ collection: authors, config })).toEqual([]);
  });

  it("returns the field when another collection has a relationship pointing here", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
    });
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: "authors" }) },
    });
    const config = defineConfig({ collections: [posts, authors] });
    expect(getIncomingRelationships({ collection: authors, config })).toEqual([
      { fromSlug: "posts", fieldKey: "author" },
    ]);
  });

  it("returns multiple entries when multiple collections point here", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
    });
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: "authors" }) },
    });
    const comments = defineCollection({
      slug: "comments",
      fields: { author: relationship({ collection: "authors" }) },
    });
    const config = defineConfig({ collections: [posts, comments, authors] });
    const result = getIncomingRelationships({ collection: authors, config });
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ fromSlug: "posts", fieldKey: "author" });
    expect(result).toContainEqual({ fromSlug: "comments", fieldKey: "author" });
  });

  it("ignores the collection's own self-referencing relationship for this check", () => {
    const nodes = defineCollection({
      slug: "nodes",
      fields: { parent: relationship({ collection: "nodes" }) },
    });
    const config = defineConfig({ collections: [nodes] });
    // self-reference: the same collection isn't returned as "incoming from another"
    expect(getIncomingRelationships({ collection: nodes, config })).toEqual([]);
  });

  it("does not return relationships pointing to other collections", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
    });
    const categories = defineCollection({
      slug: "categories",
      fields: { label: text() },
    });
    const posts = defineCollection({
      slug: "posts",
      fields: { category: relationship({ collection: "categories" }) },
    });
    const config = defineConfig({ collections: [posts, authors, categories] });
    // posts has a relationship to categories, not to authors
    expect(getIncomingRelationships({ collection: authors, config })).toEqual([]);
  });
});

// ─── relationship field auto-index ────────────────────────────────────────────

describe("collectionConfigToVexSchema — relationship auto-index", () => {
  it("auto-emits by_<fieldKey> index for a relationship field", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: "authors" }) },
    });
    const config = defineConfig({ collections: [posts] });
    const output = collectionConfigToVexSchema({ collection: posts, config });
    expect(output).toContain('.index("by_author", ["author"])');
  });

  it("emits both auto index and explicit index when field also has index property", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: {
        author: relationship({ collection: "authors", index: "by_author_legacy" }),
      },
    });
    const config = defineConfig({ collections: [posts] });
    const output = collectionConfigToVexSchema({ collection: posts, config });
    expect(output).toContain('.index("by_author", ["author"])');
    expect(output).toContain('.index("by_author_legacy", ["author"])');
  });

  it("emits v.id() validator for a required relationship field", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: "authors", required: true }) },
    });
    const config = defineConfig({ collections: [posts] });
    const output = collectionConfigToVexSchema({ collection: posts, config });
    expect(output).toContain('author: v.id("authors")');
  });

  it("emits v.optional(v.id()) for an optional relationship field", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: "authors" }) },
    });
    const config = defineConfig({ collections: [posts] });
    const output = collectionConfigToVexSchema({ collection: posts, config });
    expect(output).toContain('author: v.optional(v.id("authors"))');
  });

  it("emits v.array(v.id()) for a hasMany relationship field", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { tags: relationship({ collection: "tags", hasMany: true, required: true }) },
    });
    const config = defineConfig({ collections: [posts] });
    const output = collectionConfigToVexSchema({ collection: posts, config });
    expect(output).toContain('tags: v.array(v.id("tags"))');
    expect(output).toContain('.index("by_tags", ["tags"])');
  });
});

// ─── auto search index on related collection ─────────────────────────────────

describe("collectionConfigToVexSchema — auto search index", () => {
  it("emits search index on useAsTitle field when another collection points here", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
      admin: { useAsTitle: "name" },
    });
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: "authors" }) },
    });
    const config = defineConfig({ collections: [posts, authors] });
    const output = collectionConfigToVexSchema({ collection: authors, config });
    expect(output).toContain('.searchIndex("search_name"');
    expect(output).toContain('searchField: "name"');
  });

  it("does NOT emit auto search index when useAsTitle is _id (default)", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
      // no admin.useAsTitle → defaults to "_id"
    });
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: "authors" }) },
    });
    const config = defineConfig({ collections: [posts, authors] });
    const output = collectionConfigToVexSchema({ collection: authors, config });
    expect(output).not.toContain(".searchIndex(");
  });

  it("does NOT emit auto search index when no collection points here", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
      admin: { useAsTitle: "name" },
    });
    const config = defineConfig({ collections: [authors] });
    const output = collectionConfigToVexSchema({ collection: authors, config });
    expect(output).not.toContain(".searchIndex(");
  });

  it("does NOT duplicate search index when field already has searchIndex configured with same name", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: {
        name: text({
          required: true,
          searchIndex: { name: "search_name", filterFields: [] },
        }),
      },
      admin: { useAsTitle: "name" },
    });
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: "authors" }) },
    });
    const config = defineConfig({ collections: [posts, authors] });
    const output = collectionConfigToVexSchema({ collection: authors, config });
    const count = (output.match(/searchIndex/g) ?? []).length;
    expect(count).toBe(1); // only one — not duplicated
  });
});
```

---

## Step 6: `search` Convex Query

Add a `search` query to the Convex collections file and register it in `vexConvexApi`.

- [ ] Update `packages/core/src/convex/vex/collections.ts` — add `search` export
- [ ] Update `packages/core/src/convex/index.ts` — add `vexConvexApi.search`
- [ ] Run `pnpm build --filter @vexcms/core`

### Add to `packages/core/src/convex/vex/collections.ts`

```typescript
/**
 * Searches documents in a VexCMS-managed collection using a Convex search index.
 *
 * When `query` is non-empty, uses `ctx.db.search` with the provided index name.
 * When `query` is empty, falls back to `ctx.db.query(...).take(limit)` so the
 * picker shows recent items without requiring a search term.
 *
 * The `searchIndexName` must match a `.searchIndex()` declaration in the
 * collection's Convex schema — for VexCMS this is auto-generated as
 * `search_<useAsTitleFieldKey>` when a relationship field points to this collection.
 *
 * @param collection - The Convex table name to search.
 * @param searchIndexName - The `.searchIndex()` name declared in the schema.
 * @param query - The search text. Pass `""` to list recent documents.
 * @param limit - Maximum number of results (default: 20).
 * @returns Array of matching documents.
 */
export const search = query({
  args: {
    collection: v.string(),
    searchIndexName: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // TODO: implement
    //
    // 1. const tableName = args.collection as TableNamesInDataModel<DataModel>
    // 2. const limit = args.limit ?? 20
    //
    // 3. If args.query is empty string:
    //    → return ctx.db.query(tableName).take(limit)
    //    (no search, just list recent — same as vexConvexApi.list)
    //
    // 4. If args.query is non-empty:
    //    → return (ctx.db as any)
    //        .search(tableName, args.searchIndexName, { query: args.query })
    //        .take(limit)
    //    Note: cast to `any` is necessary because ctx.db.search is typed
    //    to specific table/index pairs in the generated schema. The cast is
    //    safe here because the search index is guaranteed to exist by the
    //    VexCMS schema generation pipeline.
    throw new Error("Not implemented");
  },
});
```

### Add to `packages/core/src/convex/index.ts` — inside `vexConvexApi`

```typescript
/**
 * Searches documents in a collection by a search index.
 *
 * Used by `RelationshipFieldInput` in `@vexcms/react` to populate the
 * relationship picker combobox. Pass `query: ""` to list recent documents.
 */
search: anyApi.vex.collections.search as FunctionReference<
  "query",
  "public",
  {
    collection: string;
    searchIndexName: string;
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
 * A single option shown in the relationship field picker.
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

```tsx
"use client";

import type { CellComponentProps, RelationshipField } from "@vexcms/core";

/**
 * Relationship field cell component for the data-table list view.
 *
 * Displays the raw Convex document ID(s) stored in the relationship field.
 * For `hasMany: false`, renders a single truncated ID string.
 * For `hasMany: true`, renders a comma-separated list of IDs.
 *
 * A future spec will add population so the related document's title is shown
 * instead of the ID — that requires per-cell Convex queries and is deferred.
 *
 * @param props - Cell component props.
 * @param props.value - The stored value — a single ID string or array of ID strings.
 * @param props.fieldDef - The resolved relationship field definition.
 * @returns A `<span>` with the ID(s), or an em-dash if empty.
 *
 * @example
 * ```tsx
 * <RelationshipFieldCell value="abc123" fieldDef={authorField} row={row} isTitleField={false} collection={postsCollection} />
 * ```
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

  const id = typeof value === "string" ? value : String(value);
  return (
    <span
      className="text-xs font-mono text-muted-foreground"
      title={id}
    >
      {id.length > 16 ? `${id.slice(0, 16)}…` : id}
    </span>
  );
}
```

### `packages/react/src/components/fields/relationship/columnDef.tsx`

```tsx
import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, RelationshipField, TDocument } from "@vexcms/core";
import { RelationshipFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a relationship field.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - The resolved relationship field definition.
 * @param props.fieldKey - Field key from `collection.fields`.
 * @param props.collection - The parent collection config.
 * @param props.isTitleField - Whether this field is the collection's `useAsTitle` field.
 * @returns A TanStack Table `ColumnDef`.
 *
 * @example
 * ```ts
 * const col = relationshipFieldToColumnDef({ fieldDef, fieldKey: "author", isTitleField: false, collection });
 * ```
 */
export function relationshipFieldToColumnDef(props: {
  fieldDef: RelationshipField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TDocument, string | string[] | undefined> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,
    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as
        | string
        | string[]
        | undefined;
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
```

### `packages/react/src/components/fields/relationship/index.ts`

```typescript
export * from "./Cell";
export * from "./columnDef";
export * from "./Input";
export * from "./types";
```

> `Input.tsx` is created in Step 8. Add it to this export after Step 8.

---

## Step 8: `RelationshipFieldInput` Combobox

This is the most complex component in this spec. It builds a searchable combobox that queries the related collection live via Convex.

- [ ] Create `packages/react/src/components/fields/relationship/Input.tsx`
- [ ] Add `Input.tsx` export to `packages/react/src/components/fields/relationship/index.ts`
- [ ] Run `pnpm build --filter @vexcms/react`

### `packages/react/src/components/fields/relationship/Input.tsx`

```tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import {
  type RelationshipField,
  vexConvexApi,
  CORE_ADMIN_FIELDS,
} from "@vexcms/core";
import { createFieldInput } from "../../form";
import { FormDescription, FormError, FormLabel } from "../../form";
import { useVexConfig } from "../../../context/VexConfigContext";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { ChevronsUpDownIcon, XIcon } from "lucide-react";
import type { RelationshipOption } from "./types";

/**
 * Relationship field input component for the admin edit form.
 *
 * Renders a searchable combobox that queries the related collection via
 * `vexConvexApi.search`. When `hasMany` is `false`, selecting an item
 * replaces the current value. When `hasMany` is `true`, items are added
 * and removed from an array.
 *
 * Looks up the related collection's config from `VexConfigContext` to determine:
 * - The `useAsTitle` field key (displayed as the option label)
 * - The search index name (`search_<useAsTitle>`) to use for live search
 *
 * When `useAsTitle` is `_id` (the default), search is disabled and the picker
 * falls back to listing recent documents by creation time.
 *
 * Built with `createFieldInput` — handles TanStack Form wiring automatically.
 * Must be rendered inside `<AppForm>` or receive an explicit `field` prop.
 *
 * @param props - Component props (via `createFieldInput`).
 * @param props.name - Field key from the collection config (e.g. `"author"`).
 * @param props.fieldDef - The resolved `RelationshipField` definition.
 * @param props.readOnly - Whether the field is non-editable.
 * @returns The combobox picker for selecting related document(s).
 *
 * @example
 * ```tsx
 * <AppForm form={form}>
 *   <RelationshipFieldInput name="author" fieldDef={authorField} readOnly={false} />
 * </AppForm>
 * ```
 */
export const RelationshipFieldInput = createFieldInput<
  string | string[] | undefined,
  RelationshipField
>(({ name, fieldDef, field, submissionAttempts }) => {
  // TODO: implement
  //
  // === State ===
  // const [open, setOpen] = useState(false)
  // const [searchQuery, setSearchQuery] = useState("")
  //
  // === Config lookup ===
  // const config = useVexConfig()
  // Find the target collection: config.collections.find(c => c.slug === fieldDef.collection)
  // const targetCollection = config?.collections.find(c => c.slug === fieldDef.collection)
  // const useAsTitleKey = targetCollection?.admin.useAsTitle ?? "_id"
  // const systemFields: string[] = [CORE_ADMIN_FIELDS.id.slug, CORE_ADMIN_FIELDS.createdAt.slug]
  // const canSearch = !systemFields.includes(useAsTitleKey)
  // const searchIndexName = canSearch ? `search_${useAsTitleKey}` : ""
  //
  // === Convex query ===
  // Use convexQuery + useQuery for the search results:
  // const { data: results = [] } = useQuery({
  //   ...convexQuery(vexConvexApi.search, {
  //     collection: fieldDef.collection,
  //     searchIndexName,
  //     query: searchQuery,
  //   }),
  //   enabled: open,
  // })
  //
  // Map results to RelationshipOption[]:
  // const options: RelationshipOption[] = results.map(doc => ({
  //   id: doc._id,
  //   label: canSearch && useAsTitleKey !== "_id"
  //     ? String(doc[useAsTitleKey] ?? doc._id)
  //     : doc._id,
  // }))
  //
  // === Selected values ===
  // Normalize field.state.value to an array for uniform handling:
  // const selectedIds: string[] = fieldDef.hasMany
  //   ? (Array.isArray(field.state.value) ? field.state.value as string[] : [])
  //   : (field.state.value ? [field.state.value as string] : [])
  //
  // === Handlers ===
  // handleSelect(id: string):
  //   If hasMany: false → field.handleChange(id) then setOpen(false)
  //   If hasMany: true  → toggle: if selectedIds.includes(id) → remove, else → add
  //     field.handleChange(newArray)
  //
  // handleRemove(id: string):
  //   Only used for hasMany: true
  //   field.handleChange(selectedIds.filter(s => s !== id))
  //
  // === Render ===
  // Return:
  // <div className="flex flex-col gap-1.5">
  //   <FormLabel field={fieldDef} name={name} />
  //   <Popover open={open} onOpenChange={setOpen}>
  //     <PopoverTrigger>
  //       [Trigger button — shows selected labels or placeholder]
  //       For hasMany: show badges with an X button
  //       For single: show the selected label or placeholder text
  //       Always show a ChevronsUpDownIcon on the right
  //     </PopoverTrigger>
  //     <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
  //       <Command>
  //         <CommandInput
  //           placeholder={fieldDef.admin.placeholder || `Search ${targetCollection?.labels.singular ?? fieldDef.collection}…`}
  //           value={searchQuery}
  //           onValueChange={setSearchQuery}
  //         />
  //         <CommandList>
  //           <CommandEmpty>No results found.</CommandEmpty>
  //           <CommandGroup>
  //             {options.map(option => (
  //               <CommandItem
  //                 key={option.id}
  //                 value={option.id}
  //                 onSelect={() => handleSelect(option.id)}
  //               >
  //                 {option.label}
  //               </CommandItem>
  //             ))}
  //           </CommandGroup>
  //         </CommandList>
  //       </Command>
  //     </PopoverContent>
  //   </Popover>
  //   <FormDescription field={fieldDef} />
  //   <FormError field={field} submissionAttempts={submissionAttempts} />
  // </div>
  //
  // Edge cases:
  // - targetCollection not found in config (slug not registered): still renders,
  //   falls back to displaying raw IDs in the picker
  // - searchQuery is empty: vexConvexApi.search falls back to listing recent docs
  // - hasMany: false and already has a value: selecting a new item replaces it
  //   (not adds to it)
  throw new Error("Not implemented");
});
```

---

## Step 9: Wire Everything

This step adds `RelationshipField` to the `AdminField` union and connects all the dispatch functions and React registrations simultaneously. Do all of these in one pass to keep TypeScript happy — adding to `AdminField` immediately requires the adapter entry to exist.

- [ ] Update `packages/core/src/fields/types.ts` — add `RelationshipField<string>` to `AdminField`
- [ ] Update `packages/core/src/fields/validators/index.ts` — add `relationship` case
- [ ] Update `packages/core/src/fields/inputSchemas/index.ts` — add `relationship` case
- [ ] Update `packages/react/src/components/fields/index.tsx` — add to `fieldInputComponents`, `fieldCellComponents`, `getCollectionColumnDefs`
- [ ] Update `packages/react/src/adapter.ts` — add `relationship` to `fields` map
- [ ] Run `pnpm build --filter @vexcms/core && pnpm build --filter @vexcms/react`
- [ ] Run `pnpm test --filter @vexcms/core`

### `packages/core/src/fields/types.ts` — add import + union entry

```typescript
import { RelationshipField } from "./relationship";

export type AdminField =
  | TextField
  | NumberField
  | CheckboxField
  | DateField
  | SelectField
  | UrlField
  | RelationshipField<string>; // ← add
```

### `packages/core/src/fields/validators/index.ts` — add case

```typescript
import { relationshipFieldToValidator } from "../relationship";

// Inside the switch:
case ADMIN_FIELDS.relationship.type:
  return relationshipFieldToValidator({ field: props.field as RelationshipField });
```

> Import `RelationshipField` from `"../relationship"` at the top of the file.

### `packages/core/src/fields/inputSchemas/index.ts` — add case

```typescript
import { relationshipFieldToInputSchema } from "../relationship";

// Inside the switch:
case ADMIN_FIELDS.relationship.type:
  return relationshipFieldToInputSchema({ field: props.field as RelationshipField });
```

### `packages/react/src/components/fields/index.tsx` — add to all three maps

Add to `fieldInputComponents`:
```typescript
[ADMIN_FIELDS.relationship.type]: RelationshipFieldInput as ComponentType<
  InputComponentProps<AdminField>
>,
```

Add to `fieldCellComponents`:
```typescript
[ADMIN_FIELDS.relationship.type]: RelationshipFieldCell as ComponentType<
  CellComponentProps<AdminField>
>,
```

Add to the `getCollectionColumnDefs` switch:
```typescript
case ADMIN_FIELDS.relationship.type:
  columnDefs.push(
    relationshipFieldToColumnDef({
      fieldDef,
      fieldKey,
      isTitleField,
      collection,
    }),
  );
  break;
```

Add to the imports:
```typescript
import {
  RelationshipFieldCell,
  RelationshipFieldInput,
  relationshipFieldToColumnDef,
} from "./relationship";

export * from "./relationship";
```

### `packages/react/src/adapter.ts` — add relationship field entry

```typescript
[ADMIN_FIELDS.relationship.type]: {
  input: RelationshipFieldInput,
  cell: RelationshipFieldCell,
},
```

Add to the imports:
```typescript
import {
  RelationshipFieldCell,
  RelationshipFieldInput,
} from "./components/fields/relationship";
```

---

## Step 10: `apps/www` Example

- [ ] Update `apps/www/src/vexcms/collections/posts.ts` to add a relationship field
- [ ] Run `vex generate` (or equivalent) to regenerate `vex.types.ts` and `vex.schema.ts`
- [ ] Run `pnpm --filter www typecheck`

### `apps/www/src/vexcms/collections/posts.ts` — add field

```typescript
// Add 'relationship' to the import from @vexcms/core
import { ..., relationship } from "@vexcms/core"

// Then inside the fields object — example of a self-referencing "related post" field:
relatedPost: relationship({
  collection: "posts",
  required: false,
  admin: {
    position: "sidebar",
    description: "Link to a related post.",
  },
}),
```

> After adding the field, run `vex generate` to verify the schema and types update correctly — `vex.schema.ts` should gain `.index("by_relatedPost", ["relatedPost"])` on the posts table.

---

## Verification (mandatory)

- [ ] `pnpm build --filter @vexcms/core` — builds successfully
- [ ] `pnpm build --filter @vexcms/react` — builds successfully
- [ ] `pnpm test --filter @vexcms/core` — all tests pass including new relationship tests
- [ ] `pnpm --filter www typecheck` — passes
- [ ] Fix any test assertions broken by the `collectionConfigToVexSchema` signature change
- [ ] Fix any type errors introduced by adding `RelationshipField<string>` to `AdminField`

---

## Success Criteria

- [ ] `relationship({ collection: "authors" })` is a compile-time error after `vex generate` if `"authors"` is not a registered collection
- [ ] `relationship({ collection: "posts", required: true })` emits `v.id("posts")` in the generated schema
- [ ] `relationship({ collection: "tags", hasMany: true })` emits `v.array(v.id("tags"))` in the generated schema
- [ ] A relationship field named `author` auto-generates `.index("by_author", ["author"])` in the Convex schema
- [ ] A collection with `useAsTitle: "name"` and an incoming relationship auto-generates `.searchIndex("search_name", ...)` in its Convex schema
- [ ] The relationship picker combobox opens, searches via Convex, and stores the selected ID(s)
- [ ] `hasMany: false` stores a single string; `hasMany: true` stores `string[]`
- [ ] `RelationshipField<string>` in `AdminField` causes a TypeScript error in `reactAdapter.fields` if the relationship entry is missing
