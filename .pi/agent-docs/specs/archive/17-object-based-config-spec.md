# 17 — Object-Based Configuration

## Overview

Migrate VEX CMS configuration from function-based builders (`defineCollection()`, `text()`, `select()`, etc.) to plain object literals with `as const satisfies` type checking. This eliminates ~12 builder function imports, flattens the `VexCollection` shape (removing the nested `.config` layer), and paves the way for cross-cutting type inference (e.g., RBAC roles flowing into collection/field access configs in a future spec). `defineConfig()` remains the single function entry point.

## Design Decisions

1. **Fields are flat objects discriminated on `type`.** `{ type: "text", label: "Title", required: true }` replaces `text({ label: "Title", required: true })`. The `type` field is the discriminant for the `VexField` union, just as `_meta.type` was before.

2. **No phantom `_type` field.** `InferFieldType` uses conditional types on the `type` discriminant + field options (e.g., `hasMany`) to infer the TypeScript value type. The `_type` field is removed.

3. **`VexCollection` is flat.** `collection.config.fields` becomes `collection.fields`. The nested `.config` wrapper is removed. `_docType` remains as a phantom type for user-land inference.

4. **`formDefaultValue` moves to consumers.** The `formDefaultValue` property is removed from all field meta types. `generateFormDefaultValues()` computes zero-values from the `type` discriminant at runtime.

5. **Media collection default fields are injected in `defineConfig()`.** Users define media collections as plain objects (no default fields). `defineConfig()` merges the default media fields (storageId, filename, mimeType, size, url, alt, width, height) when it processes `media.collections`.

6. **`defineConfig()` validates.** Slug format, empty fields, duplicate slugs, and media config validation all happen in `defineConfig()`. Individual collection objects don't self-validate.

7. **`@vexcms/better-auth` uses object-based fields internally.** `convertToVexFields()` returns plain objects instead of calling builder functions.

8. **Internal per-field dispatch architecture is preserved.** The per-field functions (`textToValueTypeString`, `textColumnDef`, `fieldMetaToZod` switch cases, etc.) stay as-is. Only the user-facing builder functions (`text()`, `select()`, `defineCollection()`) are removed. The `fields/text/`, `fields/select/`, etc. directory structure and its `schemaValueType.ts` / `columnDef.ts` files remain — they just accept the flat field def type instead of the old `_meta` wrapper.

## Out of Scope

- RBAC access properties on collections/fields
- Roles flowing from auth config into collection types
- Any new field types
- Admin panel component changes (they consume the resolved config shape)
- New test coverage beyond updating existing tests

## Target Directory Structure

```
packages/core/src/
├── types/
│   ├── fields.ts            # REWRITE — flat field objects, no _type/_meta, InferFieldType via conditionals
│   ├── collections.ts       # REWRITE — flat VexCollection (no .config nesting), remove defineCollection deps
│   ├── globals.ts           # REWRITE — flat VexGlobal (no .config nesting)
│   ├── media.ts             # MODIFY — VexMediaCollection type, default field constants
│   ├── auth.ts              # NO CHANGE
│   ├── admin.ts             # NO CHANGE
│   ├── schema.ts            # NO CHANGE
│   └── index.ts             # MODIFY — update re-exports
├── config/
│   ├── defineConfig.ts      # MODIFY — add media field injection, slug validation
│   ├── defineCollection.ts  # DELETE
│   ├── defineMediaCollection.ts       # DELETE (logic moves to defineConfig)
│   ├── defineMediaCollection.test.ts  # DELETE
│   ├── isMediaCollection.ts           # MODIFY — read flat shape
│   └── isMediaCollection.test.ts      # MODIFY — use object fixtures
├── fields/
│   ├── constants.ts         # NO CHANGE
│   ├── text/
│   │   ├── config.ts        # DELETE
│   │   ├── schemaValueType.ts         # MODIFY — accept flat TextFieldDef
│   │   ├── schemaValueType.test.ts    # MODIFY — use object fixtures
│   │   ├── columnDef.tsx              # MODIFY — accept flat TextFieldDef
│   │   └── columnDef.test.ts          # MODIFY — use object fixtures
│   ├── number/              # Same pattern as text/
│   ├── checkbox/            # Same pattern as text/
│   ├── select/              # Same pattern as text/
│   ├── date/                # Same pattern as text/
│   ├── imageUrl/            # Same pattern as text/
│   ├── relationship/        # Same pattern as text/
│   ├── media/               # Same pattern as text/ (upload field)
│   ├── json/                # Same pattern as text/
│   └── array/               # Same pattern as text/
├── valueTypes/
│   ├── extract.ts           # MODIFY — switch on field.type instead of field._meta.type
│   ├── extract.test.ts      # MODIFY — use object fixtures
│   ├── generate.ts          # MODIFY — read flat collection shape
│   ├── generate.test.ts     # MODIFY — use object fixtures
│   ├── indexes.ts           # MODIFY — read flat field/collection shape
│   ├── indexes.test.ts      # MODIFY — use object fixtures
│   ├── searchIndexes.ts     # MODIFY — read flat field/collection shape
│   ├── searchIndexes.test.ts # MODIFY — use object fixtures
│   ├── merge.ts             # MODIFY — read/produce flat shapes
│   ├── merge.test.ts        # MODIFY — use object fixtures
│   ├── slugs.ts             # MODIFY — read flat collection shape
│   ├── slugs.test.ts        # MODIFY — use object fixtures
│   └── processAdminOptions.ts         # MODIFY — accept flat field type
│   └── processAdminOptions.test.ts    # MODIFY — use object fixtures
├── formSchema/
│   ├── generateFormSchema.ts          # MODIFY — switch on field.type
│   ├── generateFormSchema.test.ts     # MODIFY — use object fixtures
│   ├── generateFormDefaultValues.ts   # REWRITE — compute zero-values from type discriminant
│   └── generateFormDefaultValues.test.ts # MODIFY — use object fixtures
├── columns/
│   ├── generateColumns.ts   # MODIFY — read flat shapes
│   └── generateColumns.test.ts # MODIFY — use object fixtures
├── migrations/
│   ├── planMigration.ts     # MODIFY — read flat field shape
│   └── planMigration.test.ts # MODIFY — use object fixtures
├── config/
│   └── defineGlobal.ts      # DELETE (replaced by plain objects)
└── index.ts                 # MODIFY — remove builder exports, update type exports

packages/better-auth/src/
├── extract/
│   └── collections.ts       # MODIFY — return object-based fields, no defineCollection call
└── index.ts                 # NO CHANGE (types only)

apps/test-app/
├── vex.config.ts            # MODIFY — no defineConfig changes needed (just collections shape)
└── src/vexcms/collections/
    ├── articles.ts          # REWRITE — plain object
    ├── posts.ts             # REWRITE — plain object
    ├── users.ts             # REWRITE — plain object
    ├── categories.ts        # REWRITE — plain object
    ├── media.ts             # REWRITE — plain object
    └── index.ts             # NO CHANGE
```

## Implementation Order

1. **Step 1: Rewrite field types** — New `VexField` union with flat objects, `InferFieldType` via conditionals. After this step, types compile.
2. **Step 2: Rewrite collection + global + media types** — Flat `VexCollection`, `VexGlobal`, `VexMediaCollection`. Update `VexConfig`/`VexConfigInput` to use them.
3. **Step 3: Update `defineConfig`** — Add media field injection, slug/field validation (absorbs logic from deleted builders). Delete `defineCollection`, `defineMediaCollection`, `defineGlobal`.
4. **Step 4: Update `processAdminOptions` + per-field schemaValueType functions** — Accept flat field types instead of meta types. Update their tests.
5. **Step 5: Update `extract.ts` dispatcher + tests** — Switch on `field.type` instead of `field._meta.type`.
6. **Step 6: Update `generateFormSchema`, `generateFormDefaultValues`, `generateColumns`** — Read flat field shapes, compute formDefaultValue from discriminant. Update tests.
7. **Step 7: Update `indexes`, `searchIndexes`, `merge`, `slugs`, `planMigration`** — Read flat collection/field shapes. Update tests.
8. **Step 8: Update `generate.ts` (schema generation)** — Read flat collection shapes. Update tests.
9. **Step 9: Update `@vexcms/better-auth`** — Object-based field construction.
10. **Step 10: Update exports + test app + delete dead files** — Clean up `index.ts`, rewrite test-app collections, delete builder files.

---

## Step 1: Rewrite Field Types

- [ ] Rewrite `packages/core/src/types/fields.ts`
- [ ] Run `pnpm --filter @vexcms/core build` (expect errors in consumers — types are the foundation)

### `File: packages/core/src/types/fields.ts`

Complete rewrite. Fields become flat objects discriminated on `type`. No `_type` phantom, no `_meta` wrapper. `formDefaultValue` is removed — consumers compute it.

```typescript
// =============================================================================
// FIELD TYPES — Object-based configuration
// =============================================================================

/** Content alignment for data table cells. */
export type Alignment = "left" | "right" | "center";

/**
 * Admin panel configuration for individual fields.
 * Controls visibility, layout, and input behavior in the admin UI.
 */
export interface FieldAdminConfig {
  hidden?: boolean;
  readOnly?: boolean;
  position?: "main" | "sidebar";
  width?: "full" | "half";
  placeholder?: string;
  description?: string;
  cellAlignment?: Alignment;
}

// =============================================================================
// BASE FIELD PROPERTIES (shared by all field types)
// =============================================================================

/**
 * Properties shared by all field types.
 * Each concrete field type extends this with its `type` discriminant
 * and type-specific options.
 */
interface BaseField {
  label?: string;
  description?: string;
  required?: boolean;
  admin?: FieldAdminConfig;
  index?: string;
  searchIndex?: {
    name: string;
    filterFields: string[];
  };
}

// =============================================================================
// CONCRETE FIELD TYPES
// =============================================================================

export interface TextFieldDef extends BaseField {
  readonly type: "text";
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
}

export interface NumberFieldDef extends BaseField {
  readonly type: "number";
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface CheckboxFieldDef extends BaseField {
  readonly type: "checkbox";
  defaultValue?: boolean;
}

export interface SelectOption<T extends string = string> {
  readonly value: T;
  readonly label: string;
}

export interface SelectFieldDef<T extends string = string> extends BaseField {
  readonly type: "select";
  options: readonly SelectOption<T>[];
  defaultValue?: T;
  hasMany?: boolean;
}

export interface DateFieldDef extends BaseField {
  readonly type: "date";
  defaultValue?: number;
}

export interface ImageUrlFieldDef extends BaseField {
  readonly type: "imageUrl";
  defaultValue?: string;
  width?: number;
  height?: number;
}

export interface RelationshipFieldDef extends BaseField {
  readonly type: "relationship";
  to: string;
  hasMany?: boolean;
}

export interface UploadFieldDef extends BaseField {
  readonly type: "upload";
  to: string;
  hasMany?: boolean;
  accept?: string[];
  maxSize?: number;
}

export interface JsonFieldDef extends BaseField {
  readonly type: "json";
}

export interface ArrayFieldDef extends BaseField {
  readonly type: "array";
  field: VexField;
  min?: number;
  max?: number;
}

// =============================================================================
// DISCRIMINATED UNION
// =============================================================================

/**
 * Discriminated union of all field types. Switch on `field.type` to narrow.
 *
 * @example
 * ```ts
 * function handle(field: VexField) {
 *   switch (field.type) {
 *     case "text":
 *       field.maxLength; // TextFieldDef ✓
 *       break;
 *     case "select":
 *       field.options;   // SelectFieldDef ✓
 *       break;
 *   }
 * }
 * ```
 */
export type VexField =
  | TextFieldDef
  | NumberFieldDef
  | CheckboxFieldDef
  | SelectFieldDef<string>
  | DateFieldDef
  | ImageUrlFieldDef
  | RelationshipFieldDef
  | UploadFieldDef
  | JsonFieldDef
  | ArrayFieldDef;

// =============================================================================
// TYPE INFERENCE
// =============================================================================

/**
 * Infer the TypeScript value type from a VexField.
 * Uses the `type` discriminant and field options to determine the type.
 *
 * - text → string
 * - number → number
 * - checkbox → boolean
 * - select (hasMany: true) → string[]
 * - select (hasMany?: false) → string
 * - date → number
 * - imageUrl → string
 * - relationship (hasMany: true) → string[]
 * - relationship (hasMany?: false) → string
 * - upload (hasMany: true) → string[]
 * - upload (hasMany?: false) → string
 * - json → unknown
 * - array → unknown[]
 */
export type InferFieldType<F extends VexField> =
  F extends { type: "text" } ? string :
  F extends { type: "number" } ? number :
  F extends { type: "checkbox" } ? boolean :
  F extends { type: "select"; hasMany: true } ? string[] :
  F extends { type: "select" } ? string :
  F extends { type: "date" } ? number :
  F extends { type: "imageUrl" } ? string :
  F extends { type: "relationship"; hasMany: true } ? string[] :
  F extends { type: "relationship" } ? string :
  F extends { type: "upload"; hasMany: true } ? string[] :
  F extends { type: "upload" } ? string :
  F extends { type: "json" } ? unknown :
  F extends { type: "array" } ? unknown[] :
  never;

/**
 * Infer the document type from a record of fields.
 *
 * @example
 * ```ts
 * type Doc = InferFieldsType<{
 *   title: { type: "text"; required: true };
 *   count: { type: "number" };
 * }>;
 * // { title: string; count: number }
 * ```
 */
export type InferFieldsType<F extends Record<string, VexField>> = {
  [K in keyof F]: InferFieldType<F[K] & VexField>;
};
```

---

## Step 2: Rewrite Collection, Global, and Media Types

- [ ] Rewrite `packages/core/src/types/collections.ts`
- [ ] Rewrite `packages/core/src/types/globals.ts`
- [ ] Modify `packages/core/src/types/media.ts`
- [ ] Modify `packages/core/src/types/index.ts`
- [ ] Run `pnpm --filter @vexcms/core build` (still expect errors in consumers — but types are complete)

### `File: packages/core/src/types/collections.ts`

Complete rewrite. Flat shape — no `.config` nesting.

```typescript
// =============================================================================
// COLLECTION TYPES — Object-based configuration
// =============================================================================

import type { VexField, InferFieldsType } from "./fields";

/**
 * Admin UI configuration for a collection.
 */
export interface CollectionAdminConfig<
  TFields extends Record<string, VexField> = Record<string, VexField>,
  TExtraKeys extends string = never,
> {
  group?: string;
  icon?: string;
  useAsTitle?: keyof TFields | TExtraKeys;
  defaultColumns?: ("_id" | keyof TFields | TExtraKeys)[];
  disableCreate?: boolean;
  disableDelete?: boolean;
}

/**
 * Index definition for a collection.
 */
export interface IndexConfig<
  TFields extends Record<string, VexField> = Record<string, VexField>,
  TExtraKeys extends string = never,
> {
  name: string;
  fields: (keyof TFields & string | TExtraKeys)[];
}

/**
 * Search index definition for a collection.
 */
export interface SearchIndexConfig<
  TFields extends Record<string, VexField> = Record<string, VexField>,
  TExtraKeys extends string = never,
> {
  name: string;
  searchField: keyof TFields & string | TExtraKeys;
  filterFields?: (keyof TFields & string | TExtraKeys)[];
}

/**
 * A collection definition. Users create these as plain objects
 * with `as const satisfies VexCollection`.
 *
 * @example
 * ```ts
 * const posts = {
 *   slug: "posts",
 *   fields: {
 *     title: { type: "text", label: "Title", required: true },
 *   },
 * } as const satisfies VexCollection;
 * ```
 */
export interface VexCollection<
  TFields extends Record<string, VexField> = Record<string, VexField>,
  TExtraKeys extends string = never,
> {
  readonly slug: string;
  fields: TFields;
  tableName?: string;
  labels?: { singular?: string; plural?: string };
  admin?: CollectionAdminConfig<TFields, TExtraKeys>;
  indexes?: IndexConfig<TFields, TExtraKeys>[];
  searchIndexes?: SearchIndexConfig<TFields, TExtraKeys>[];
  /** Phantom type for user-land inference: `typeof posts._docType` */
  readonly _docType?: InferFieldsType<TFields>;
}

/**
 * A VexCollection with erased generics, suitable for heterogeneous arrays.
 */
export type AnyVexCollection = VexCollection<any, any>;

/**
 * Resolved index (field keys are plain strings, not keyof-constrained).
 */
export interface ResolvedIndex {
  name: string;
  fields: string[];
}

/**
 * Resolved search index (field keys are plain strings).
 */
export interface ResolvedSearchIndex {
  name: string;
  searchField: string;
  filterFields: string[];
}
```

### `File: packages/core/src/types/globals.ts`

Complete rewrite. Flat shape — no `.config` nesting.

```typescript
// =============================================================================
// GLOBAL TYPES — Object-based configuration
// =============================================================================

import type { VexField, InferFieldsType } from "./fields";

/**
 * Admin UI configuration for a global.
 */
export interface GlobalAdminConfig<
  TFields extends Record<string, VexField> = Record<string, VexField>,
> {
  group?: string;
  icon?: string;
  useAsTitle?: keyof TFields;
  defaultColumns?: (keyof TFields)[];
  disableCreate?: boolean;
  disableDelete?: boolean;
}

/**
 * A global definition. Users create these as plain objects
 * with `as const satisfies VexGlobal`.
 *
 * @example
 * ```ts
 * const siteSettings = {
 *   slug: "site_settings",
 *   label: "Site Settings",
 *   fields: {
 *     siteName: { type: "text", label: "Site Name", required: true },
 *   },
 * } as const satisfies VexGlobal;
 * ```
 */
export interface VexGlobal<
  TFields extends Record<string, VexField> = Record<string, VexField>,
> {
  readonly slug: string;
  fields: TFields;
  label?: string;
  tableName?: string;
  admin?: GlobalAdminConfig<TFields>;
  /** Phantom type for user-land inference: `typeof global._docType` */
  readonly _docType?: InferFieldsType<TFields>;
}
```

### `File: packages/core/src/types/media.ts` (modify)

Update `MediaCollectionConfig` to be `VexMediaCollection` — a flat object type for media collections without default fields (those are injected by `defineConfig`).

**Replace the `MediaCollectionConfig` interface with:**

```typescript
/**
 * A media collection definition. Users create these as plain objects.
 * Default media fields (storageId, filename, mimeType, size, url, alt, width, height)
 * are injected automatically by `defineConfig()`.
 *
 * The `fields` record contains ONLY user-defined additional fields or overrides
 * of overridable defaults (url, alt, width, height).
 */
export interface VexMediaCollection<
  TFields extends Record<string, VexField> = Record<never, VexField>,
> {
  readonly slug: string;
  fields?: TFields;
  tableName?: string;
  labels?: { singular?: string; plural?: string };
  admin?: CollectionAdminConfig<TFields, DefaultMediaFieldKeys>;
}
```

**Add the default media field definitions as constants (replacing `getDefaultMediaFields()` from the deleted `defineMediaCollection.ts`):**

```typescript
/**
 * Default media fields injected into every media collection by defineConfig().
 * Returns a fresh record each call to avoid mutation across collections.
 */
export function getDefaultMediaFields(): Record<string, VexField> {
  return {
    storageId: {
      type: "text",
      required: true,
      defaultValue: "",
      label: "Storage ID",
      admin: { hidden: true },
    },
    filename: {
      type: "text",
      required: true,
      defaultValue: "",
      label: "Filename",
      admin: { readOnly: true },
    },
    mimeType: {
      type: "text",
      required: true,
      defaultValue: "",
      label: "MIME Type",
      index: "by_mimeType",
      admin: { readOnly: true },
    },
    size: {
      type: "number",
      required: true,
      defaultValue: 0,
      label: "File Size (bytes)",
      admin: { readOnly: true },
    },
    url: {
      type: "text",
      required: true,
      defaultValue: "",
      label: "URL",
      admin: { readOnly: true },
    },
    alt: { type: "text", label: "Alt Text" },
    width: { type: "number", label: "Width (px)" },
    height: { type: "number", label: "Height (px)" },
  };
}
```

**Update `MediaConfigInput` to use `VexMediaCollection`:**

```typescript
export interface MediaConfigInput {
  collections: VexMediaCollection[];
  storageAdapter: FileStorageAdapter;
}
```

**Keep `MediaConfig` using `AnyVexCollection`** (after injection, media collections become full `VexCollection` objects):

```typescript
export interface MediaConfig {
  collections: AnyVexCollection[];
  storageAdapter: FileStorageAdapter;
}
```

### `File: packages/core/src/types/index.ts` (modify)

Update re-exports and config types. Key changes:

**Remove from re-exports:**
- `GenericVexField` (deleted)
- `BaseFieldMeta`, `TextFieldMeta`, `NumberFieldMeta`, etc. (replaced by `TextFieldDef`, etc.)
- `FieldMeta` (deleted)
- `CollectionConfig` (no longer exists — `VexCollection` IS the config)
- `GlobalConfig` (no longer exists — `VexGlobal` IS the config)
- All `*FieldOptions` types (deleted — options ARE the field def)

**Add to re-exports:**
- `TextFieldDef`, `NumberFieldDef`, `CheckboxFieldDef`, `SelectFieldDef`, `DateFieldDef`, `ImageUrlFieldDef`, `RelationshipFieldDef`, `UploadFieldDef`, `JsonFieldDef`, `ArrayFieldDef`
- `VexMediaCollection`

**Update `VexConfig` interface:**
- `collections: AnyVexCollection[]` — unchanged
- `globals: VexGlobal[]` — unchanged
- `media?: MediaConfig` — unchanged (uses resolved `AnyVexCollection` after injection)

**Update `VexConfigInput` interface:**
- `collections?: AnyVexCollection[]` — unchanged
- `globals?: VexGlobal<any>[]` — unchanged
- `media?: MediaConfigInput` — now uses `VexMediaCollection[]` for collections

---

## Step 3: Update `defineConfig` + Delete Builder Functions

- [ ] Modify `packages/core/src/config/defineConfig.ts`
- [ ] Delete `packages/core/src/config/defineCollection.ts`
- [ ] Delete `packages/core/src/config/defineMediaCollection.ts`
- [ ] Delete `packages/core/src/config/defineMediaCollection.test.ts`
- [ ] Delete `packages/core/src/config/defineGlobal.ts`
- [ ] Run `pnpm --filter @vexcms/core build` (still expect errors — consumers not yet updated)

### `File: packages/core/src/config/defineConfig.ts` (modify)

Add media collection field injection logic. Absorb validation from deleted builders.

```typescript
import type { VexConfig, VexConfigInput, AnyVexCollection, VexField } from "../types";
import type { VexMediaCollection } from "../types/media";
import { getDefaultMediaFields, LOCKED_MEDIA_FIELDS } from "../types/media";
import { VexMediaConfigError } from "../errors";

export const BASE_VEX_CONFIG: Omit<VexConfig, "auth"> = {
  basePath: "/admin",
  globals: [],
  collections: [],
  admin: {
    meta: {
      titleSuffix: "| Admin",
      favicon: "/favicon.ico",
    },
    user: "users",
    sidebar: {
      hideGlobals: false,
    },
  },
  schema: {
    outputPath: "/convex/vex.schema.ts",
    autoMigrate: true,
    autoRemove: false,
  },
};

/**
 * Resolve a VexMediaCollection into an AnyVexCollection by injecting
 * default media fields. Locked fields cannot be overridden by the user.
 * Overridable fields (url, alt, width, height) can be customized.
 */
function resolveMediaCollection(props: {
  mediaCollection: VexMediaCollection;
}): AnyVexCollection {
  // TODO: implement
  //
  // 1. Get default media fields via getDefaultMediaFields()
  //
  // 2. If props.mediaCollection.fields exists, merge user fields:
  //    a. For each user field, check if the field name is in LOCKED_MEDIA_FIELDS
  //    b. If locked → skip with console.warn in non-production
  //    c. If not locked → override the default field with the user field
  //
  // 3. Build the resolved collection object:
  //    {
  //      slug: props.mediaCollection.slug,
  //      fields: mergedFields,
  //      tableName: props.mediaCollection.tableName,
  //      labels: props.mediaCollection.labels,
  //      admin: {
  //        ...props.mediaCollection.admin,
  //        useAsTitle: props.mediaCollection.admin?.useAsTitle ?? "filename",
  //      },
  //    }
  //
  // 4. Return as AnyVexCollection
  //
  // Edge cases:
  // - No user fields → just default fields
  // - User overrides "alt" with required: true → their version wins
  // - User tries to override "storageId" → warn and skip
  throw new Error("Not implemented");
}

export function defineConfig(vexConfig: VexConfigInput): VexConfig {
  // TODO: implement
  //
  // 1. Merge config with BASE_VEX_CONFIG (same as current implementation)
  //
  // 2. Handle media config:
  //    a. If vexConfig.media exists and has collections:
  //       - Resolve each media collection via resolveMediaCollection()
  //       - Validate storageAdapter is present (throw VexMediaConfigError if not)
  //       - Set config.media = { collections: resolvedCollections, storageAdapter }
  //    b. If no media or empty collections → config.media = undefined
  //
  // 3. Validate in non-production:
  //    a. Check all collection slugs (format: /^[a-z][a-z0-9_]*$/)
  //    b. Check no "vex_" prefix on collection slugs
  //    c. Check no empty fields on collections
  //    d. Check duplicate slugs across collections + globals
  //    e. Same checks for globals
  //
  // 4. Return config
  //
  // Edge cases:
  // - Media collections with empty collections array → media = undefined
  // - Media collections without storageAdapter → throw VexMediaConfigError
  throw new Error("Not implemented");
}
```

### `File: packages/core/src/config/isMediaCollection.ts` (modify)

Update to read flat collection shape (`.slug` instead of `.config`... wait, `.slug` is already top-level on both old and new shapes). The function body reads `collection.slug` and `mc.slug` which are both top-level — **this file may need no changes** if the `AnyVexCollection` type update is sufficient. Verify after types compile.

---

## Step 4: Update `processAdminOptions` + Per-Field schemaValueType Functions

- [ ] Modify `packages/core/src/valueTypes/processAdminOptions.ts`
- [ ] Modify `packages/core/src/valueTypes/processAdminOptions.test.ts`
- [ ] Modify each per-field `schemaValueType.ts` (10 files)
- [ ] Modify each per-field `schemaValueType.test.ts` (10 files)
- [ ] Run `pnpm --filter @vexcms/core test` for the field tests

### `File: packages/core/src/valueTypes/processAdminOptions.ts` (modify)

Change `meta: BaseFieldMeta & { defaultValue?: unknown }` to `field: VexField` (or a subset type). The function reads `required` and `defaultValue` — both are top-level on the new flat field objects.

**Before:**
```typescript
export function processFieldValueTypeOptions(props: {
  meta: BaseFieldMeta & { defaultValue?: unknown };
  collectionSlug: string;
  fieldName: string;
  expectedType: string;
  valueType: string;
  skipDefaultValidation?: boolean;
}): string {
```

**After:**
```typescript
export function processFieldValueTypeOptions(props: {
  field: { required?: boolean; defaultValue?: unknown };
  collectionSlug: string;
  fieldName: string;
  expectedType: string;
  valueType: string;
  skipDefaultValidation?: boolean;
}): string {
```

**Update the body:** Replace all `props.meta.required` → `props.field.required`, `props.meta.defaultValue` → `props.field.defaultValue`.

### Per-Field schemaValueType Functions (10 files)

Each function currently takes `meta: XFieldMeta`. Change to `field: XFieldDef`.

**Example — `textToValueTypeString`:**

**Before:**
```typescript
export function textToValueTypeString(props: {
  meta: TextFieldMeta;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    meta: props.meta,
    ...
  });
}
```

**After:**
```typescript
export function textToValueTypeString(props: {
  field: TextFieldDef;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    field: props.field,
    ...
  });
}
```

Apply the same pattern to all 10 per-field files:
- `text/schemaValueType.ts` — `meta: TextFieldMeta` → `field: TextFieldDef`
- `number/schemaValueType.ts` — `meta: NumberFieldMeta` → `field: NumberFieldDef`
- `checkbox/schemaValueType.ts` — `meta: CheckboxFieldMeta` → `field: CheckboxFieldDef`
- `select/schemaValueType.ts` — `meta: SelectFieldMeta` → `field: SelectFieldDef`. Read `props.field.options`, `props.field.hasMany`.
- `date/schemaValueType.ts` — `meta: DateFieldMeta` → `field: DateFieldDef`
- `imageUrl/schemaValueType.ts` — `meta: ImageUrlFieldMeta` → `field: ImageUrlFieldDef`
- `relationship/schemaValueType.ts` — `meta: RelationshipFieldMeta` → `field: RelationshipFieldDef`
- `media/schemaValueType.ts` (upload) — `meta: UploadFieldMeta` → `field: UploadFieldDef`
- `json/schemaValueType.ts` — `meta: JsonFieldMeta` → `field: JsonFieldDef`
- `array/schemaValueType.ts` — `meta: ArrayFieldMeta` → `field: ArrayFieldDef`. The inner field is `props.field.field` (a `VexField`).

### Per-Field schemaValueType Tests (10 files)

Update test fixtures from `const meta: TextFieldMeta = { type: "text", ... }` to `const field: TextFieldDef = { type: "text", ... }`.

**Example — text test before:**
```typescript
const meta: TextFieldMeta = { type: "text", required: true, defaultValue: "x" };
textToValueTypeString({ meta, collectionSlug: "posts", fieldName: "title" });
```

**After:**
```typescript
const field: TextFieldDef = { type: "text", required: true, defaultValue: "x" };
textToValueTypeString({ field, collectionSlug: "posts", fieldName: "title" });
```

The test assertions (expected strings) remain identical — the schema output doesn't change.

Note: Remove any `formDefaultValue` from test fixtures — it no longer exists on field types.

---

## Step 5: Update `extract.ts` Dispatcher

- [ ] Modify `packages/core/src/valueTypes/extract.ts`
- [ ] Modify `packages/core/src/valueTypes/extract.test.ts`
- [ ] Run `pnpm --filter @vexcms/core test`

### `File: packages/core/src/valueTypes/extract.ts` (modify)

Change `field._meta.type` → `field.type`. Change `field._meta` → `field` in dispatched calls.

**Before:**
```typescript
switch (field._meta.type) {
  case "text":
    return textToValueTypeString({ meta: field._meta, collectionSlug, fieldName });
```

**After:**
```typescript
switch (field.type) {
  case "text":
    return textToValueTypeString({ field, collectionSlug, fieldName });
```

Apply to all 10 cases + the array case (which passes `resolveInnerField`).

### `File: packages/core/src/valueTypes/extract.test.ts` (modify)

Update test fixtures to use flat field objects instead of `{ _type, _meta }`.

---

## Step 6: Update Form Schema, Form Default Values, and Columns

- [ ] Modify `packages/core/src/formSchema/generateFormSchema.ts`
- [ ] Modify `packages/core/src/formSchema/generateFormSchema.test.ts`
- [ ] Rewrite `packages/core/src/formSchema/generateFormDefaultValues.ts`
- [ ] Modify `packages/core/src/formSchema/generateFormDefaultValues.test.ts`
- [ ] Modify `packages/core/src/columns/generateColumns.ts`
- [ ] Modify `packages/core/src/columns/generateColumns.test.ts`
- [ ] Modify each per-field `columnDef.ts`/`columnDef.tsx` (10 files) — `meta:` → `field:` param rename
- [ ] Modify each per-field `columnDef.test.ts` (those that exist)
- [ ] Run `pnpm --filter @vexcms/core test`

### `File: packages/core/src/formSchema/generateFormSchema.ts` (modify)

**Before:**
```typescript
if (field._meta.admin?.hidden) continue;
let validator = fieldMetaToZod({ meta: field._meta as FieldMeta });
if (!field._meta.required) { ... }
```

**After:**
```typescript
if (field.admin?.hidden) continue;
let validator = fieldMetaToZod({ field });
if (!field.required) { ... }
```

**`fieldMetaToZod`** — rename param from `meta` to `field`, change `props.meta.type` → `props.field.type`, `props.meta.minLength` → `props.field.minLength`, etc.

For the `array` case, inner field is now `props.field.field` (was `props.meta.field._meta`):
```typescript
case "array": {
  let schema = z.array(fieldMetaToZod({ field: props.field.field }));
```

### `File: packages/core/src/formSchema/generateFormDefaultValues.ts` (rewrite)

The `formDefaultValue` property no longer exists on fields. Compute zero-values from the `type` discriminant.

```typescript
import type { VexField } from "../types";

/**
 * Compute the zero-value for a field type (used as initial form value).
 */
function getFormDefaultValue(props: { field: VexField }): unknown {
  // TODO: implement
  //
  // Switch on props.field.type:
  // - "text" → props.field.defaultValue ?? ""
  // - "number" → props.field.defaultValue ?? 0
  // - "checkbox" → props.field.defaultValue ?? false
  // - "select" → if hasMany: props.field.defaultValue ? [props.field.defaultValue] : []
  //              else: props.field.defaultValue ?? ""
  // - "date" → props.field.defaultValue ?? 0
  // - "imageUrl" → props.field.defaultValue ?? ""
  // - "relationship" → if hasMany: [] else: ""
  // - "upload" → if hasMany: [] else: ""
  // - "json" → {}
  // - "array" → []
  //
  // Edge cases:
  // - select with hasMany and defaultValue: wrap in array if not already
  // - Unknown type: return undefined
  throw new Error("Not implemented");
}

/**
 * Generate default values for a create form from a collection's field definitions.
 * Skips hidden fields.
 */
export function generateFormDefaultValues(props: {
  fields: Record<string, VexField>;
}): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [fieldName, field] of Object.entries(props.fields)) {
    if (field.admin?.hidden) continue;
    result[fieldName] = getFormDefaultValue({ field });
  }

  return result;
}
```

### `File: packages/core/src/columns/generateColumns.ts` (modify)

**Key changes:**
- `collection.config.admin?.useAsTitle` → `collection.admin?.useAsTitle`
- `collection.config.admin?.defaultColumns` → `collection.admin?.defaultColumns`
- `collection.config.fields` → `collection.fields`
- `authCollection.config.fields` → `authCollection.fields`
- `field._meta.type` → `field.type`
- `field._meta.admin?.hidden` → `field.admin?.hidden`
- `buildColumnDef` dispatches: `field._meta` → `field`

**Per-field columnDef functions** (10 files): Rename `meta:` param to `field:` and update all property accesses. Example for `textColumnDef`:

**Before:** `textColumnDef({ fieldKey, meta: field._meta })`
**After:** `textColumnDef({ fieldKey, field })`

Inside each columnDef function: `props.meta.label` → `props.field.label`, `props.meta.admin?.cellAlignment` → `props.field.admin?.cellAlignment`, etc.

---

## Step 7: Update Indexes, Search Indexes, Merge, Slugs, Plan Migration

- [ ] Modify `packages/core/src/valueTypes/indexes.ts` + test
- [ ] Modify `packages/core/src/valueTypes/searchIndexes.ts` + test
- [ ] Modify `packages/core/src/valueTypes/merge.ts` + test
- [ ] Modify `packages/core/src/valueTypes/slugs.ts` + test
- [ ] Modify `packages/core/src/migrations/planMigration.ts` + test
- [ ] Modify `packages/core/src/config/isMediaCollection.ts` + test
- [ ] Run `pnpm --filter @vexcms/core test`

### `File: packages/core/src/valueTypes/indexes.ts` (modify)

**Key changes:**
- `collection.config.fields` → `collection.fields`
- `(field._meta as BaseFieldMeta).index` → `field.index`
- `collection.config.indexes` → `collection.indexes`
- `collection.config.admin?.useAsTitle` → `collection.admin?.useAsTitle`

### `File: packages/core/src/valueTypes/searchIndexes.ts` (modify)

Same pattern:
- `collection.config.fields` → `collection.fields`
- `(field._meta as BaseFieldMeta).searchIndex` → `field.searchIndex`
- `collection.config.searchIndexes` → `collection.searchIndexes`
- `collection.config.admin?.useAsTitle` → `collection.admin?.useAsTitle`

### `File: packages/core/src/valueTypes/merge.ts` (modify)

**Key changes:**
- `authCollection.config.fields` → `authCollection.fields`
- `userCollection.config.fields` → `userCollection.fields`
- `authCollection.config.indexes` → `authCollection.indexes`
- `userCollection.config.indexes` → `userCollection.indexes`
- `userCollection.config.searchIndexes` → `userCollection.searchIndexes`

**Overlapping field merge logic changes:**

**Before:**
```typescript
fields[fieldKey] = {
  ...userField,
  _meta: {
    ...userField._meta,
    required: authField._meta.required,
    ...(authField._meta.defaultValue !== undefined && { defaultValue: authField._meta.defaultValue }),
  },
};
```

**After:**
```typescript
fields[fieldKey] = {
  ...userField,
  required: authField.required,
  ...(authField.defaultValue !== undefined && { defaultValue: authField.defaultValue }),
};
```

Much cleaner — no nested `_meta` merge needed.

### `File: packages/core/src/valueTypes/slugs.ts` (modify)

No changes needed — `buildSlugRegistry` already reads `collection.slug` which is top-level on both old and new shapes.

### `File: packages/core/src/migrations/planMigration.ts` (modify)

**Key changes:**
- `collection.config.fields` → `collection.fields`
- `global.config.fields` → `global.fields` (for VexGlobal: `global.config.fields` → `global.fields`)
- `field._meta as BaseFieldMeta & { defaultValue?: unknown }` → `field` (direct property access)
- `meta.required` → `field.required`
- `meta.defaultValue` → `field.defaultValue`

### Test files for all above

Update test fixtures to use flat shapes. The main changes:
- Collection fixtures change from `defineCollection("slug", { fields: { ... } })` to `{ slug: "slug", fields: { ... } }`
- Field fixtures change from `text({ ... })` to `{ type: "text", ... }`
- Property accesses change from `._meta.X` to `.X`

---

## Step 8: Update Schema Generation

- [ ] Modify `packages/core/src/valueTypes/generate.ts`
- [ ] Modify `packages/core/src/valueTypes/generate.test.ts`
- [ ] Run `pnpm --filter @vexcms/core test`

### `File: packages/core/src/valueTypes/generate.ts` (modify)

**Key changes throughout:**
- `collection.config.fields` → `collection.fields`
- `collection.config.tableName` → `collection.tableName`
- `global.config.fields` → `global.fields`
- `global.config.tableName` → `global.tableName`
- `mediaCollection.config.fields` → `mediaCollection.fields`
- `mediaCollection.config.tableName` → `mediaCollection.tableName`
- `authCollection.config.fields` → `authCollection.fields`
- `authCollection.config.tableName` → `authCollection.tableName`
- `fieldToValueType({ field, ... })` — `field` is now a flat `VexField` (this just works since extract.ts was updated in Step 5)

---

## Step 9: Update `@vexcms/better-auth`

- [ ] Modify `packages/better-auth/src/extract/collections.ts`
- [ ] Run `pnpm --filter @vexcms/better-auth build`

### `File: packages/better-auth/src/extract/collections.ts` (modify)

**Remove imports of builder functions:**
```typescript
// BEFORE
import { defineCollection, text, number, checkbox, select, date, json, array, relationship, VexAuthConfigError } from "@vexcms/core";

// AFTER
import { VexAuthConfigError } from "@vexcms/core";
import type { VexCollection, VexField, FieldAdminConfig } from "@vexcms/core";
```

**Update `convertToVexFields` to return flat objects:**

**Before:**
```typescript
case "string":
  vexFields[fieldName] = text({
    required,
    ...(required && { defaultValue: "" }),
    admin,
  });
  break;
```

**After:**
```typescript
case "string":
  vexFields[fieldName] = {
    type: "text",
    required,
    ...(required && { defaultValue: "" }),
    admin,
  };
  break;
```

Apply this pattern to all cases:
- `text({...})` → `{ type: "text", ... }`
- `number({...})` → `{ type: "number", ... }`
- `checkbox({...})` → `{ type: "checkbox", ... }`
- `date({...})` → `{ type: "date", ... }`
- `json({...})` → `{ type: "json", ... }`
- `select({...})` → `{ type: "select", ... }`
- `relationship({...})` → `{ type: "relationship", ... }`
- `array({ field: text(), ... })` → `{ type: "array", field: { type: "text" }, ... }`
- `array({ field: number(), ... })` → `{ type: "array", field: { type: "number" }, ... }`

**Update `extractAuthCollections` to return flat collection objects:**

**Before:**
```typescript
collections.push(
  defineCollection(slug, {
    fields,
    ...(labels ? { labels } : {}),
    ...(indexes.length > 0 ? { indexes } : {}),
    admin: { ... },
  }),
);
```

**After:**
```typescript
collections.push({
  slug,
  fields,
  ...(labels ? { labels } : {}),
  ...(indexes.length > 0 ? { indexes } : {}),
  admin: { ... },
});
```

---

## Step 10: Update Exports + Test App + Delete Dead Files

- [ ] Modify `packages/core/src/index.ts` — remove builder exports, update type exports
- [ ] Delete all field builder `config.ts` files (10 files):
  - `packages/core/src/fields/text/config.ts`
  - `packages/core/src/fields/number/config.ts`
  - `packages/core/src/fields/checkbox/config.ts`
  - `packages/core/src/fields/select/config.ts`
  - `packages/core/src/fields/date/config.ts`
  - `packages/core/src/fields/imageUrl/config.ts`
  - `packages/core/src/fields/relationship/config.ts`
  - `packages/core/src/fields/media/config.ts` (upload)
  - `packages/core/src/fields/json/config.ts`
  - `packages/core/src/fields/array/config.ts`
- [ ] Rewrite test-app collection files (5 files)
- [ ] Run `pnpm --filter @vexcms/core build`
- [ ] Run `pnpm --filter @vexcms/core test`
- [ ] Run `pnpm --filter @vexcms/better-auth build`
- [ ] Run `pnpm --filter test-app build`

### `File: packages/core/src/index.ts` (modify)

**Remove:**
```typescript
export { defineCollection } from "./config/defineCollection";
export { defineMediaCollection } from "./config/defineMediaCollection";

// Fields
export { text } from "./fields/text";
export { number } from "./fields/number";
export { checkbox } from "./fields/checkbox";
export { select } from "./fields/select";
export { date } from "./fields/date";
export { imageUrl } from "./fields/imageUrl";
export { relationship } from "./fields/relationship";
export { upload } from "./fields/media";
export { json } from "./fields/json";
export { array } from "./fields/array";
```

**Remove from type exports:**
```typescript
GenericVexField,
BaseFieldMeta,
TextFieldMeta,
NumberFieldMeta,
CheckboxFieldMeta,
SelectFieldMeta,
DateFieldMeta,
ImageUrlFieldMeta,
RelationshipFieldMeta,
UploadFieldMeta,
JsonFieldMeta,
ArrayFieldMeta,
CollectionConfig,
GlobalConfig,
// All *FieldOptions types:
TextFieldOptions,
NumberFieldOptions,
CheckboxFieldOptions,
SelectFieldOptions,
DateFieldOptions,
ImageUrlFieldOptions,
RelationshipFieldOptions,
JsonFieldOptions,
ArrayFieldOptions,
UploadFieldOptions,
MediaCollectionConfig,
```

**Add to type exports:**
```typescript
// Field def types
TextFieldDef,
NumberFieldDef,
CheckboxFieldDef,
SelectFieldDef,
DateFieldDef,
ImageUrlFieldDef,
RelationshipFieldDef,
UploadFieldDef,
JsonFieldDef,
ArrayFieldDef,
// Media
VexMediaCollection,
```

### Test App Collection Files

**`apps/test-app/src/vexcms/collections/posts.ts`:**
```typescript
import type { VexCollection } from "@vexcms/core"

import { TABLE_SLUG_POSTS } from "~/db/constants"

export const posts = {
  slug: TABLE_SLUG_POSTS,
  labels: { plural: "Posts", singular: "Post" },
  admin: {
    defaultColumns: ["title", "status", "featured"],
    group: "Content",
    useAsTitle: "title",
  },
  fields: {
    slug: {
      type: "text",
      admin: { description: "URL-friendly identifier" },
      label: "Slug",
      required: true,
    },
    featured: {
      type: "checkbox",
      defaultValue: false,
      label: "Featured",
    },
    status: {
      type: "select",
      defaultValue: "draft",
      label: "Status",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Archived", value: "archived" },
      ],
      required: true,
    },
    subtitle: { type: "text", label: "Subtitle", maxLength: 200, required: true },
    title: { type: "text", label: "Title", maxLength: 200, required: true },
  },
} as const satisfies VexCollection
```

**`apps/test-app/src/vexcms/collections/articles.ts`:**
```typescript
import type { VexCollection } from "@vexcms/core"

import { TABLE_SLUG_ARTICLES, TABLE_SLUG_MEDIA } from "~/db/constants"

export const articles = {
  slug: TABLE_SLUG_ARTICLES,
  labels: { plural: "Articles", singular: "Article" },
  admin: {
    defaultColumns: ["name", "index", "slug", "banner"],
    group: "Content",
    useAsTitle: "name",
  },
  fields: {
    name: { type: "text", label: "Name", required: true },
    slug: { type: "text", label: "Slug", required: true },
    banner: { type: "upload", to: TABLE_SLUG_MEDIA },
    index: {
      type: "number",
      admin: { cellAlignment: "center" },
      defaultValue: 0,
      label: "Index",
    },
  },
} as const satisfies VexCollection
```

**`apps/test-app/src/vexcms/collections/users.ts`:**
```typescript
import type { VexCollection } from "@vexcms/core"

import { TABLE_SLUG_USERS } from "~/db/constants"

export const users = {
  slug: TABLE_SLUG_USERS,
  labels: { plural: "Users", singular: "User" },
  admin: {
    defaultColumns: ["name", "email", "createdAt", "image", "role"],
    group: "Admin",
    useAsTitle: "name",
  },
  fields: {
    name: { type: "text", label: "Name", required: true },
    image: { type: "imageUrl", label: "Image" },
    postCount: {
      type: "number",
      admin: { readOnly: true },
      defaultValue: 0,
      label: "Post Count",
      min: 0,
    },
    role: {
      type: "select",
      defaultValue: "author",
      hasMany: true,
      label: "Role",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
        { label: "Author", value: "author" },
        { label: "User", value: "user" },
      ],
      required: true,
    },
  },
} as const satisfies VexCollection
```

**`apps/test-app/src/vexcms/collections/categories.ts`:**
```typescript
import type { VexCollection } from "@vexcms/core"

import { TABLE_SLUG_CATEGORIES } from "~/db/constants"

export const categories = {
  slug: TABLE_SLUG_CATEGORIES,
  labels: { plural: "Categories", singular: "Category" },
  admin: {
    group: "Content",
    useAsTitle: "name",
  },
  fields: {
    name: { type: "text", label: "Name", required: true },
    slug: { type: "text", label: "Slug", required: true },
    sortOrder: { type: "number", defaultValue: 0, label: "Sort Order" },
  },
} as const satisfies VexCollection
```

**`apps/test-app/src/vexcms/collections/media.ts`:**
```typescript
import type { VexMediaCollection } from "@vexcms/core"

import { TABLE_SLUG_MEDIA } from "~/db/constants"

export const media = {
  slug: TABLE_SLUG_MEDIA,
  labels: { plural: "Media", singular: "Media" },
  admin: {
    group: "Media",
    useAsTitle: "filename",
  },
} as const satisfies VexMediaCollection
```

**`apps/test-app/vex.config.ts`:**

No changes to the `defineConfig` call structure — just remove the `auth` import on collections that had it (users.ts no longer needs `auth` passed). The auth adapter is only passed at the top level.

**Note:** The `users.ts` collection no longer passes `auth` — auth field merging happens internally in schema generation via the auth adapter's collections. The `defaultColumns: ["email", "createdAt"]` entries that reference auth fields will still work because `generateColumns` looks up auth fields at runtime.

---

## Success Criteria

- [ ] `pnpm --filter @vexcms/core build` succeeds
- [ ] `pnpm --filter @vexcms/core test` passes all 119+ tests (updated to new shapes)
- [ ] `pnpm --filter @vexcms/better-auth build` succeeds
- [ ] `pnpm --filter test-app build` succeeds
- [ ] No field builder functions (`text()`, `select()`, `defineCollection()`, etc.) are exported from `@vexcms/core`
- [ ] `defineConfig()` is the only function users call
- [ ] Collections use `{ slug, fields, ... } as const satisfies VexCollection`
- [ ] Media collections use `{ slug, ... } as const satisfies VexMediaCollection`
- [ ] Globals use `{ slug, fields, ... } as const satisfies VexGlobal`
- [ ] Fields use `{ type: "text", ... }` flat objects
- [ ] `typeof collection._docType` still infers correct document types
- [ ] Schema generation output is byte-for-byte identical to before the migration
- [ ] No `_type`, `_meta`, `GenericVexField`, `formDefaultValue` references remain in the codebase
