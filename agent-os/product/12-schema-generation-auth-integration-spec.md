# Schema Generation & Auth Integration Spec

This document defines the implementation plan for Vex CMS schema generation from collection configs and the auth plugin integration for `@vexcms/better-auth`. It covers the per-field subfolder restructure, Convex schema codegen, index generation (per-field and collection-level), auth adapter types, field merging, reserved slug validation, and a test-first development approach.

**Referenced by**: [roadmap.md](./roadmap.md) - Phase 1.3

**Depends on**: [05-schema-field-system-spec.md](./05-schema-field-system-spec.md) - Field types and collection configuration

**Supersedes (partially)**: [04-auth-adapter-spec.md](./04-auth-adapter-spec.md) - Replaces the abstract AuthAdapter interface with a concrete `betterAuth()` config slot; [06-convex-integration-spec.md](./06-convex-integration-spec.md) - Replaces schema generation sections

**Testing**: [11-testing-strategy-spec.md](./11-testing-strategy-spec.md) - Unit tests in `packages/core`

---

## Design Goals

1. **Zero Convex dependency in core** — Schema generation outputs strings (`"v.string()"`) not runtime validators. `@vexcms/core` stays dependency-free.
2. **Colocated field logic** — Each field type lives in its own subfolder with `config.ts` (user-facing builder) and `schema.ts` (validator string generator) side by side.
3. **Auth as top-level config** — `auth` is a first-class slot on `VexConfig`, not a plugin. The `betterAuth()` function returns a typed auth adapter object.
4. **Slug safety** — All table slugs (user collections, globals, auth tables, system tables) are validated for uniqueness before schema generation, with source-aware error messages.
5. **Test-first** — Tests are written before implementations. Tests are colocated with the code they test inside `packages/core/src/`.
6. **String codegen** — `generateVexSchema()` produces the full TypeScript source for `convex/vex.schema.ts`. No AST library needed for generation (only for `updateUserSchema`, which is out of scope for this spec).
7. **Flexible indexes** — Users can declare indexes per-field (`index: "by_slug"`) or per-collection (`indexes: [...]`). Both produce `.index()` calls on the generated `defineTable()`.
8. **User-extensible schema** — The generated `vex.schema.ts` exports named table definitions. Users import them in their own `schema.ts` and can chain additional `.index()`, `.searchIndex()`, or other Convex methods before passing to `defineSchema()`.

---

## Implementation Order

This spec is structured for test-first development:

1. **Phase A** — Create interfaces, types, and function stubs (full code provided)
2. **Phase B** — Write comprehensive tests against the stubs (full test code provided)
3. **Phase C** — Implement the function bodies (summaries + edge cases provided, bodies left empty)

---

## Phase A: File Structure & Interfaces

### Target directory structure

After this spec is implemented, `packages/core/src/` will look like:

```
packages/core/src/
├── index.ts                          # Main entry — re-exports everything
├── config/
│   ├── defineCollection.ts           # existing (unchanged)
│   ├── defineConfig.ts               # MODIFIED — add auth slot, slug validation
│   └── defineGlobal.ts               # existing (unchanged)
├── fields/
│   ├── index.ts                      # re-exports all field builders + validators
│   ├── text/
│   │   ├── index.ts                  # re-exports config + schema
│   │   ├── config.ts                 # text() builder (moved from fields/text.ts)
│   │   ├── schema.ts                 # textToValidatorString()
│   │   └── schema.test.ts            # tests for text validator generation
│   ├── number/
│   │   ├── index.ts
│   │   ├── config.ts                 # number() builder (moved)
│   │   ├── schema.ts                 # numberToValidatorString()
│   │   └── schema.test.ts
│   ├── checkbox/
│   │   ├── index.ts
│   │   ├── config.ts                 # checkbox() builder (moved)
│   │   ├── schema.ts                 # checkboxToValidatorString()
│   │   └── schema.test.ts
│   └── select/
│       ├── index.ts
│       ├── config.ts                 # select() builder (moved)
│       ├── schema.ts                 # selectToValidatorString()
│       └── schema.test.ts
├── schema/
│   ├── index.ts                      # re-exports generate, extract, merge, slugs, indexes
│   ├── generate.ts                   # generateVexSchema(config) → string
│   ├── generate.test.ts              # tests for full schema generation
│   ├── extract.ts                    # fieldToValidatorString() dispatcher
│   ├── extract.test.ts               # tests for the dispatcher
│   ├── indexes.ts                    # collectIndexes() — gathers per-field + collection-level indexes
│   ├── indexes.test.ts               # tests for index collection and dedup
│   ├── merge.ts                      # mergeAuthFields()
│   ├── merge.test.ts                 # tests for field merge logic
│   ├── slugs.ts                      # SlugRegistry, validateSlugs()
│   └── slugs.test.ts                 # tests for slug collision detection
├── auth/
│   ├── index.ts                      # re-exports auth types
│   └── types.ts                      # VexAuthAdapter, AuthTableDefinition, etc.
└── types/
    ├── index.ts                      # MODIFIED — add auth, index to VexConfig/VexConfigInput/BaseFieldMeta
    ├── fields.ts                     # MODIFIED — add index to BaseFieldMeta and all FieldOptions
    ├── collections.ts                # MODIFIED — add indexes to CollectionConfig
    └── globals.ts                    # existing (unchanged)
```

### Separate package (out of scope for core, defined here for reference)

```
packages/better-auth/                 # @vexcms/better-auth
├── src/
│   ├── index.ts                      # betterAuth() factory
│   ├── tables.ts                     # base auth table definitions
│   ├── userFields.ts                 # base user fields
│   └── plugins/
│       ├── index.ts                  # re-exports
│       ├── admin.ts                  # admin() plugin
│       └── apiKey.ts                 # apiKey() plugin
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

---

### Modified Type Definitions — Indexes

The `index` property is added to `BaseFieldMeta` (so it's available on all field types) and to each field options interface. A new `IndexConfig` type and `indexes` property are added to `CollectionConfig`.

**Changes to `packages/core/src/types/fields.ts`**:

Add `index` to `BaseFieldMeta`:

```typescript
/** Base metadata shared by all field types. */
export interface BaseFieldMeta {
  /** The field type identifier. */
  readonly type: string;
  /** Display label for the field in the admin form. */
  label?: string;
  /** Description text shown below the field. */
  description?: string;
  /**
   * Whether this field is required.
   *
   * Default: `false`
   */
  required?: boolean;
  /** Admin UI configuration for this field. */
  admin?: FieldAdminConfig;
  /**
   * Create a database index on this field.
   * The string value becomes the index name in Convex.
   *
   * @example
   * ```ts
   * slug: text({ index: "by_slug", required: true })
   * // Generates: .index("by_slug", ["slug"])
   * ```
   */
  index?: string;
}
```

Add `index` to every field options interface (`TextFieldOptions`, `NumberFieldOptions`, `CheckboxFieldOptions`, `SelectFieldOptions`):

```typescript
export interface TextFieldOptions {
  label?: string;
  description?: string;
  required?: boolean;
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
  admin?: FieldAdminConfig;
  /**
   * Create a database index on this field.
   * The string value becomes the index name in Convex.
   *
   * @example
   * ```ts
   * slug: text({ index: "by_slug", required: true })
   * ```
   */
  index?: string;
}

// Same pattern for NumberFieldOptions, CheckboxFieldOptions, SelectFieldOptions
// — each gets an `index?: string` property.
```

**Changes to `packages/core/src/types/collections.ts`**:

Add `IndexConfig` and `indexes` to `CollectionConfig`:

```typescript
/**
 * Index definition for a collection.
 * Compound indexes include multiple fields — order matters.
 *
 * Generic over `TFields` so that the `fields` array is type-checked
 * against actual field names in the collection. The default generic
 * parameter allows standalone usage (e.g., in `collectIndexes` internals)
 * without requiring a type argument.
 */
export interface IndexConfig<
  TFields extends Record<string, VexField<any, any>> = Record<string, VexField<any, any>>,
> {
  /**
   * Index name (must be unique within the collection).
   * Convention: `"by_<field>"` for single-field, `"by_<field1>_<field2>"` for compound.
   */
  name: string;
  /**
   * Field names to include in the index. Order matters for compound indexes.
   * Each field name must be a key in the collection's `fields` record.
   * Type-checked at compile time — invalid field names produce a type error.
   */
  fields: (keyof TFields & string)[];
}

export interface CollectionConfig<
  TFields extends Record<string, VexField<any, any>>,
> {
  fields: TFields;
  labels?: {
    singular?: string;
    plural?: string;
  };
  admin?: CollectionAdminConfig<TFields>;
  /**
   * Database indexes for this collection.
   * Use this for compound indexes that span multiple fields.
   * For single-field indexes, prefer using `index` on the field directly.
   *
   * The `fields` array is type-checked: only field names defined in this
   * collection's `fields` record are accepted.
   *
   * @example
   * ```ts
   * defineCollection("posts", {
   *   fields: {
   *     title: text(),
   *     author: text(),
   *     createdAt: number(),
   *   },
   *   indexes: [
   *     { name: "by_author_date", fields: ["author", "createdAt"] },  // OK
   *     { name: "bad", fields: ["nonexistent"] },                      // Type error!
   *   ],
   * })
   * ```
   */
  indexes?: IndexConfig<TFields>[];
}
```

---

### Auth Types

**File: `packages/core/src/auth/types.ts`**

```typescript
import type { VexField, BaseFieldMeta } from "../types";

// =============================================================================
// AUTH TABLE DEFINITIONS
// =============================================================================

/**
 * A field definition for auth infrastructure tables.
 * Uses validator strings since these tables are not user-configurable
 * through the Vex field system — they come from the auth provider.
 */
export interface AuthFieldDefinition {
  /** Convex validator string, e.g. "v.string()", "v.optional(v.boolean())" */
  validator: string;
  /** Whether this field is optional in the schema */
  optional?: boolean;
}

/**
 * An index definition for auth infrastructure tables.
 */
export interface AuthIndexDefinition {
  /** Index name (must be unique within the table) */
  name: string;
  /** Field names to index (order matters for compound indexes) */
  fields: string[];
}

/**
 * Defines an auth infrastructure table (e.g., account, session).
 * These tables are NOT admin-managed collections — they don't appear
 * in the sidebar or have CRUD views. They only exist in the schema.
 */
export interface AuthTableDefinition {
  /** Table slug (e.g., "account", "session") */
  slug: string;
  /** Field definitions using validator strings */
  fields: Record<string, AuthFieldDefinition>;
  /** Database indexes */
  indexes?: AuthIndexDefinition[];
}

// =============================================================================
// AUTH PLUGIN (sub-plugins like admin(), apiKey())
// =============================================================================

/**
 * An auth sub-plugin that contributes additional fields or tables.
 * For example, the better-auth `admin()` plugin adds `banned`, `role`
 * fields to the user table and `impersonatedBy` to sessions.
 */
export interface VexAuthPlugin {
  /** Plugin identifier (e.g., "admin", "api-key", "two-factor") */
  name: string;
  /** Additional fields to merge into the user collection */
  userFields?: Record<string, AuthFieldDefinition>;
  /** Additional auth infrastructure tables */
  tables?: AuthTableDefinition[];
  /**
   * Field modifications to existing auth tables.
   * Key is the table slug, value is a record of field name → definition.
   */
  tableExtensions?: Record<string, Record<string, AuthFieldDefinition>>;
}

// =============================================================================
// AUTH ADAPTER (returned by betterAuth())
// =============================================================================

/**
 * The auth adapter object stored in `VexConfig.auth`.
 * Returned by auth factory functions like `betterAuth()`.
 *
 * This is NOT an abstract interface for multiple providers.
 * It's the concrete shape that `betterAuth()` returns.
 * If a second auth provider is needed later, generalize this type then.
 */
export interface VexAuthAdapter {
  /** Auth provider identifier (e.g., "better-auth") */
  readonly name: string;

  /**
   * Which collection slug represents the user table.
   * This collection's fields will be merged with auth-provided user fields.
   */
  userCollection: string;

  /**
   * Fields that the auth provider adds to the user collection.
   * These are the "base" user fields from the auth provider.
   * Uses validator strings, not VexField, because they're schema-only.
   */
  userFields: Record<string, AuthFieldDefinition>;

  /**
   * Auth infrastructure tables (account, session, verification, jwks, etc.).
   * These are added to vex.schema.ts but NOT shown in the admin sidebar.
   */
  tables: AuthTableDefinition[];

  /**
   * Active auth sub-plugins.
   * Each plugin can contribute additional userFields, tables, or tableExtensions.
   */
  plugins: VexAuthPlugin[];
}
```

**File: `packages/core/src/auth/index.ts`**

```typescript
export type {
  AuthFieldDefinition,
  AuthIndexDefinition,
  AuthTableDefinition,
  VexAuthPlugin,
  VexAuthAdapter,
} from "./types";
```

---

### Modified Config Types

**Changes to `packages/core/src/types/index.ts`** — add `auth?` to `VexConfig` and `VexConfigInput`:

```typescript
// ADD this import at the top
import type { VexAuthAdapter } from "../auth/types";

// MODIFY VexConfig — add auth field
export interface VexConfig {
  basePath: string;
  collections: VexCollection<any>[];
  globals: VexGlobal<any>[];
  admin: AdminConfig;
  /** Auth adapter configuration. Returns auth tables and user fields for schema generation. */
  auth?: VexAuthAdapter;
}

// MODIFY VexConfigInput — add auth field
export interface VexConfigInput {
  basePath?: string;
  collections?: VexCollection<any>[];
  globals?: VexGlobal<any>[];
  admin?: AdminConfigInput;
  /** Auth adapter configuration (e.g., betterAuth({ ... })). */
  auth?: VexAuthAdapter;
}
```

Also re-export the new collection type:

```typescript
export type { IndexConfig } from "./collections";
```

---

### Per-Field Validator Functions

Each field subfolder gets a `schema.ts` that exports a function converting field metadata to a Convex validator string.

**File: `packages/core/src/fields/text/schema.ts`**

```typescript
import type { TextFieldMeta } from "../../types";

/**
 * Converts text field metadata to a Convex validator string.
 *
 * @returns `"v.string()"` — always. Optional wrapping is handled by the caller.
 *
 * Goal: Return the inner validator string for a text field.
 * minLength/maxLength are runtime validation concerns, not schema constraints.
 *
 * Edge cases:
 * - No options provided: still returns "v.string()"
 * - minLength/maxLength have no effect on the validator (Convex has no string length validators)
 * - index property has no effect on the validator (handled by index collection)
 */
export function textToValidatorString(meta: TextFieldMeta): string {
  // TODO: implement
  throw new Error("Not implemented");
}
```

**File: `packages/core/src/fields/number/schema.ts`**

```typescript
import type { NumberFieldMeta } from "../../types";

/**
 * Converts number field metadata to a Convex validator string.
 *
 * @returns `"v.float64()"` — always. Convex uses float64 for all numbers.
 *
 * Goal: Return the inner validator string for a number field.
 * min/max/step are runtime validation concerns.
 *
 * Edge cases:
 * - No options: still returns "v.float64()"
 * - Integer-only fields: no Convex integer validator, still float64
 */
export function numberToValidatorString(meta: NumberFieldMeta): string {
  // TODO: implement
  throw new Error("Not implemented");
}
```

**File: `packages/core/src/fields/checkbox/schema.ts`**

```typescript
import type { CheckboxFieldMeta } from "../../types";

/**
 * Converts checkbox field metadata to a Convex validator string.
 *
 * @returns `"v.boolean()"` — always.
 *
 * Goal: Return the inner validator string for a checkbox field.
 *
 * Edge cases:
 * - Checkbox is never truly "required" in the HTML sense (it's always true/false)
 * - defaultValue has no effect on the validator
 */
export function checkboxToValidatorString(meta: CheckboxFieldMeta): string {
  // TODO: implement
  throw new Error("Not implemented");
}
```

**File: `packages/core/src/fields/select/schema.ts`**

```typescript
import type { SelectFieldMeta } from "../../types";

/**
 * Converts select field metadata to a Convex validator string.
 *
 * @returns One of:
 * - Single select: `'v.union(v.literal("draft"), v.literal("published"))'`
 * - Multi select (hasMany): `'v.array(v.union(v.literal("draft"), v.literal("published")))'`
 *
 * Goal: Build a union of literal validators from the options array.
 * If hasMany is true, wrap the union in v.array().
 *
 * Edge cases:
 * - Single option: `v.union(v.literal("only"))` — Convex accepts single-arg union
 * - Empty options array: should throw — caller should validate before calling
 * - Duplicate option values: deduplicate before generating literals
 * - Options with special characters in values: values are string literals, escape quotes
 */
export function selectToValidatorString(meta: SelectFieldMeta<string>): string {
  // TODO: implement
  throw new Error("Not implemented");
}
```

---

### Per-Field Index Files

Each field subfolder re-exports both the config builder and the schema function.

**File: `packages/core/src/fields/text/index.ts`**

```typescript
export { text } from "./config";
export { textToValidatorString } from "./schema";
```

**File: `packages/core/src/fields/text/config.ts`**

```typescript
// Moved from packages/core/src/fields/text.ts — identical content
import { TextFieldMeta, TextFieldOptions, VexField } from "../../types";

export function text(
  options?: TextFieldOptions,
): VexField<string, TextFieldMeta> {
  return {
    _type: "",
    _meta: {
      type: "text",
      ...options,
    },
  };
}
```

_(Same pattern for number, checkbox, select — move existing code to `config.ts`, re-export from `index.ts`)_

**File: `packages/core/src/fields/number/index.ts`**

```typescript
export { number } from "./config";
export { numberToValidatorString } from "./schema";
```

**File: `packages/core/src/fields/number/config.ts`**

```typescript
import { NumberFieldMeta, NumberFieldOptions, VexField } from "../../types";

export function number(
  options?: NumberFieldOptions,
): VexField<number, NumberFieldMeta> {
  return {
    _type: 0,
    _meta: {
      type: "number",
      ...options,
    },
  };
}
```

**File: `packages/core/src/fields/checkbox/index.ts`**

```typescript
export { checkbox } from "./config";
export { checkboxToValidatorString } from "./schema";
```

**File: `packages/core/src/fields/checkbox/config.ts`**

```typescript
import { CheckboxFieldMeta, CheckboxFieldOptions, VexField } from "../../types";

export function checkbox(
  options?: CheckboxFieldOptions,
): VexField<boolean, CheckboxFieldMeta> {
  return {
    _type: false,
    _meta: {
      type: "checkbox",
      ...options,
    },
  };
}
```

**File: `packages/core/src/fields/select/index.ts`**

```typescript
export { select } from "./config";
export { selectToValidatorString } from "./schema";
```

**File: `packages/core/src/fields/select/config.ts`**

```typescript
import { SelectFieldMeta, SelectFieldOptions, VexField } from "../../types";

export function select<T extends string = string>(
  options: SelectFieldOptions<T> & { hasMany: true },
): VexField<T[], SelectFieldMeta<T>>;

export function select<T extends string = string>(
  options: SelectFieldOptions<T> & { hasMany?: false },
): VexField<T, SelectFieldMeta<T>>;

export function select<T extends string = string>(
  options: SelectFieldOptions<T>,
): VexField<T | T[], SelectFieldMeta> {
  return {
    _type: options.hasMany ? [] : ("" as T),
    _meta: {
      type: "select",
      ...options,
    },
  };
}
```

**Updated `packages/core/src/fields/index.ts`**

```typescript
// Field builders
export { text } from "./text";
export { number } from "./number";
export { checkbox } from "./checkbox";
export { select } from "./select";

// Validator string generators
export { textToValidatorString } from "./text";
export { numberToValidatorString } from "./number";
export { checkboxToValidatorString } from "./checkbox";
export { selectToValidatorString } from "./select";
```

---

### Schema Functions

**File: `packages/core/src/schema/extract.ts`**

```typescript
import type { VexField, BaseFieldMeta } from "../types";

/**
 * Converts a VexField to its Convex validator string representation.
 * Dispatches to the appropriate per-field validator function based on `_meta.type`.
 *
 * If the field is not required (required is falsy or undefined), wraps
 * the validator in `v.optional(...)`.
 *
 * Goal: Central dispatcher that maps field type → validator string.
 * This function is called by generateVexSchema() for each field in each collection.
 *
 * Edge cases:
 * - Unknown field type: throw with descriptive error including the type string
 * - required=true: return raw validator, no v.optional() wrapper
 * - required=false or required=undefined: wrap in v.optional()
 * - Checkbox fields: always optional unless explicitly required (booleans default to undefined in Convex)
 * - index property on _meta: ignored here — handled by collectIndexes()
 */
export function fieldToValidatorString(field: VexField<any, any>): string {
  // TODO: implement
  throw new Error("Not implemented");
}
```

**File: `packages/core/src/schema/indexes.ts`**

```typescript
import type { VexCollection, IndexConfig } from "../types";

/**
 * A resolved index ready for code generation.
 */
export interface ResolvedIndex {
  /** Index name (e.g., "by_slug") */
  name: string;
  /** Field names included in the index */
  fields: string[];
}

/**
 * Collects all indexes for a collection from two sources:
 * 1. Per-field `index` property on individual fields
 * 2. Collection-level `indexes` array on the collection config
 *
 * Goal: Walk all fields in the collection, extract any `index` property from
 * field metadata, convert to ResolvedIndex format, then merge with
 * collection-level indexes. Deduplicate by index name — if a per-field
 * index and a collection-level index have the same name, the collection-level
 * definition wins (it's more explicit).
 *
 * @param collection - The collection to extract indexes from
 * @returns Array of resolved indexes, deduplicated by name
 *
 * Edge cases:
 * - No indexes anywhere: return empty array
 * - Per-field index on field "slug" with name "by_slug": produces { name: "by_slug", fields: ["slug"] }
 * - Collection-level index with same name as per-field: collection-level wins
 * - Multiple fields with same index name: error — two fields can't claim the same index name
 * - Collection-level index referencing non-existent field: warn but don't error (field may come from auth merge)
 * - Empty index name string on a field: skip (treat as no index)
 */
export function collectIndexes(collection: VexCollection<any>): ResolvedIndex[] {
  // TODO: implement
  throw new Error("Not implemented");
}
```

**File: `packages/core/src/schema/merge.ts`**

```typescript
import type { VexField, BaseFieldMeta } from "../types";
import type { VexAuthAdapter, AuthFieldDefinition, AuthTableDefinition } from "../auth/types";
import type { VexCollection } from "../types";

/**
 * Result of merging auth fields with a user collection.
 * Contains both the merged validator strings for schema generation
 * and metadata about which fields came from where.
 */
export interface MergedFieldsResult {
  /**
   * The final field map for schema generation.
   * Key is field name, value is validator string (e.g., "v.string()").
   * Includes auth-provided fields + user-defined fields.
   */
  fields: Record<string, string>;

  /**
   * Fields that exist in both auth and user config.
   * The auth validator wins for schema gen; user admin config wins for UI.
   */
  overlapping: string[];

  /**
   * Fields that only exist in the auth config (not in user's collection).
   */
  authOnly: string[];

  /**
   * Fields that only exist in the user's collection (not from auth).
   */
  userOnly: string[];
}

/**
 * Merges auth-provided user fields with a user-defined collection's fields.
 *
 * Goal: Combine the auth adapter's userFields (which define the database schema)
 * with the user's collection fields (which define admin UI behavior).
 * For schema generation, auth validators take precedence on overlapping fields.
 * For admin UI, the user's field metadata takes precedence.
 *
 * @param authAdapter - The auth adapter with userFields and plugin contributions
 * @param collection - The user's collection that maps to the user table
 * @returns Merged fields result with source tracking
 *
 * Edge cases:
 * - No auth adapter: return user fields converted to validator strings
 * - Auth field conflicts with user field: auth validator wins (it controls the DB shape)
 * - Auth plugin adds field that user also defines: same merge — auth validator wins
 * - User defines field auth doesn't know about (e.g., "postCount"): added as user-only
 * - Multiple auth plugins adding same field: last plugin wins (plugins applied in order)
 */
export function mergeAuthFields(
  authAdapter: VexAuthAdapter | undefined,
  collection: VexCollection<any>,
): MergedFieldsResult {
  // TODO: implement
  throw new Error("Not implemented");
}

/**
 * Resolves all auth infrastructure tables, applying plugin extensions.
 *
 * Goal: Start with the base auth tables, then for each plugin:
 * - Add any new tables from the plugin
 * - Merge any tableExtensions into existing tables
 * - Add any userFields from the plugin into the adapter's userFields
 *
 * @param authAdapter - The auth adapter to resolve
 * @returns Fully resolved tables and userFields
 *
 * Edge cases:
 * - Plugin adds table with same slug as base table: merge fields, don't duplicate
 * - Plugin tableExtension references non-existent table: throw descriptive error
 * - Empty plugins array: return base tables unchanged
 */
export function resolveAuthAdapter(
  authAdapter: VexAuthAdapter,
): { tables: AuthTableDefinition[]; userFields: Record<string, AuthFieldDefinition> } {
  // TODO: implement
  throw new Error("Not implemented");
}
```

**File: `packages/core/src/schema/slugs.ts`**

```typescript
// =============================================================================
// SLUG REGISTRY — tracks table slugs and their sources for conflict detection
// =============================================================================

/**
 * Where a slug was registered from.
 */
export type SlugSource =
  | "user-collection"
  | "user-global"
  | "auth-table"
  | "auth-user-collection"
  | "system";

/**
 * A registered slug with its source information.
 */
export interface SlugRegistration {
  slug: string;
  source: SlugSource;
  /** Human-readable description of where this slug was defined */
  location: string;
}

/**
 * A detected slug collision.
 */
export interface SlugConflict {
  slug: string;
  registrations: SlugRegistration[];
}

/**
 * Registry that collects all table slugs and validates uniqueness.
 */
export class SlugRegistry {
  private registrations: SlugRegistration[] = [];

  /**
   * Register a slug with its source.
   */
  register(slug: string, source: SlugSource, location: string): void {
    this.registrations.push({ slug, source, location });
  }

  /**
   * Find all slug collisions.
   * A collision is when two or more registrations share the same slug.
   *
   * @returns Array of conflicts. Empty array means no collisions.
   */
  findConflicts(): SlugConflict[] {
    // TODO: implement
    throw new Error("Not implemented");
  }

  /**
   * Validate that no slugs collide. Throws if conflicts are found.
   *
   * Goal: Check all registered slugs for duplicates. If any exist,
   * throw an error with a message listing each conflict, showing the
   * slug name and all sources that registered it.
   *
   * Error format example:
   * ```
   * [vex] Duplicate table slugs detected:
   *
   *   "account" is defined in multiple places:
   *     - auth-table: @vexcms/better-auth (account table)
   *     - user-collection: src/vexcms/collections/account.ts
   *
   *   "user" is defined in multiple places:
   *     - auth-user-collection: @vexcms/better-auth (user table mapped to "users" collection)
   *     - user-collection: src/vexcms/collections/user.ts
   * ```
   *
   * Edge cases:
   * - No registrations: no error
   * - All unique: no error
   * - The auth userCollection slug should NOT conflict with the user collection slug
   *   because they ARE the same table (the auth maps onto the user's collection)
   * - System table prefixed with "vex_" should not conflict with user tables
   *   because defineCollection already warns about "vex_" prefix
   */
  validate(): void {
    // TODO: implement
    throw new Error("Not implemented");
  }

  /**
   * Get all registered slugs.
   */
  getAll(): SlugRegistration[] {
    return [...this.registrations];
  }
}

/**
 * Populate a SlugRegistry from a VexConfig.
 *
 * Registers slugs from:
 * 1. User collections (source: "user-collection")
 * 2. User globals (source: "user-global")
 * 3. Auth infrastructure tables (source: "auth-table")
 * 4. System tables like vex_globals (source: "system")
 *
 * Note: The auth adapter's userCollection is NOT registered separately
 * because it maps onto an existing user collection (same slug).
 *
 * Edge cases:
 * - No auth adapter: skip auth table registration
 * - No globals: skip global registration
 * - Auth userCollection not found in collections: throw descriptive error
 */
export function buildSlugRegistry(config: import("../types").VexConfig): SlugRegistry {
  // TODO: implement
  throw new Error("Not implemented");
}
```

**File: `packages/core/src/schema/generate.ts`**

```typescript
import type { VexConfig } from "../types";

/**
 * Generates the full TypeScript source content for `convex/vex.schema.ts`.
 *
 * This is the main entry point for schema generation. It:
 * 1. Validates all slugs are unique (via SlugRegistry)
 * 2. Merges auth fields into the user collection (if auth configured)
 * 3. Resolves auth plugin contributions (additional tables, field extensions)
 * 4. Collects indexes from per-field `index` properties and collection-level `indexes`
 * 5. Generates defineTable() calls for each collection with chained .index() calls
 * 6. Generates defineTable() calls for auth infrastructure tables with their indexes
 * 7. Generates defineTable() calls for system tables (vex_globals if globals exist)
 *
 * The output is a complete, valid TypeScript file that can be written to disk.
 * Users import these named exports in their own `schema.ts` and can chain
 * additional Convex methods (e.g., `.index()`, `.searchIndex()`) before
 * passing to `defineSchema()`.
 *
 * @param config - The resolved VexConfig from defineConfig()
 * @returns TypeScript source code string for vex.schema.ts
 *
 * Output format:
 * ```typescript
 * // ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT
 * // This file is regenerated when your vex config changes.
 * // To customize tables, edit convex/schema.ts instead.
 *
 * import { defineTable } from "convex/server";
 * import { v } from "convex/values";
 *
 * export const posts = defineTable({
 *   title: v.string(),
 *   slug: v.optional(v.string()),
 * })
 *   .index("by_slug", ["slug"]);
 *
 * export const account = defineTable({
 *   userId: v.string(),
 *   ...
 * })
 *   .index("by_userId", ["userId"]);
 * ```
 *
 * User's schema.ts can then extend:
 * ```typescript
 * import { posts, account, users } from "./vex.schema";
 * import { defineSchema } from "convex/server";
 *
 * export default defineSchema({
 *   posts: posts.index("by_author_date", ["author", "_creationTime"]),
 *   account,
 *   users,
 *   // custom tables...
 * });
 * ```
 *
 * Edge cases:
 * - Empty collections + no auth: generate file with only the header comment and imports
 * - Collection with no fields: generate `defineTable({})` (valid but unusual)
 * - Auth adapter with no tables: skip auth table section
 * - Globals configured: add vex_globals system table
 * - No globals: skip vex_globals table
 * - Field with quotes in select option values: escape properly in literals
 * - Slug validation fails: throw before generating any output
 * - Per-field indexes + collection-level indexes: both appear as chained .index() calls
 * - Auth table indexes: appear as chained .index() calls on auth tables
 * - Duplicate index names within a collection: error at generation time
 */
export function generateVexSchema(config: VexConfig): string {
  // TODO: implement
  throw new Error("Not implemented");
}
```

**File: `packages/core/src/schema/index.ts`**

```typescript
export { generateVexSchema } from "./generate";
export { fieldToValidatorString } from "./extract";
export { mergeAuthFields, resolveAuthAdapter } from "./merge";
export type { MergedFieldsResult } from "./merge";
export { collectIndexes } from "./indexes";
export type { ResolvedIndex } from "./indexes";
export {
  SlugRegistry,
  buildSlugRegistry,
} from "./slugs";
export type {
  SlugSource,
  SlugRegistration,
  SlugConflict,
} from "./slugs";
```

---

### Updated Main Entry Point

**File: `packages/core/src/index.ts`**

```typescript
export { defineConfig } from "./config/defineConfig";
export { defineCollection } from "./config/defineCollection";

// Fields
export { text } from "./fields/text";
export { number } from "./fields/number";
export { checkbox } from "./fields/checkbox";
export { select } from "./fields/select";

// Schema generation
export { generateVexSchema } from "./schema";
export { fieldToValidatorString } from "./schema";
export { mergeAuthFields, resolveAuthAdapter } from "./schema";
export { collectIndexes } from "./schema";
export { SlugRegistry, buildSlugRegistry } from "./schema";

// Field validators (for advanced use / testing)
export { textToValidatorString } from "./fields/text";
export { numberToValidatorString } from "./fields/number";
export { checkboxToValidatorString } from "./fields/checkbox";
export { selectToValidatorString } from "./fields/select";

// Types
export type {
  // Field types
  VexField,
  BaseFieldMeta,
  TextFieldMeta,
  NumberFieldMeta,
  CheckboxFieldMeta,
  SelectFieldMeta,
  SelectOption,
  InferFieldType,
  InferFieldsType,
  FieldAdminConfig,
  // Collection types
  VexCollection,
  CollectionConfig,
  CollectionAdminConfig,
  IndexConfig,
  // Config types
  VexConfig,
  AdminConfig,
  // Config input types
  VexConfigInput,
  AdminConfigInput,
  AdminMetaInput,
  AdminSidebarInput,
  // Field options
  TextFieldOptions,
  NumberFieldOptions,
  CheckboxFieldOptions,
  SelectFieldOptions,
} from "./types";

// Auth types
export type {
  VexAuthAdapter,
  VexAuthPlugin,
  AuthTableDefinition,
  AuthFieldDefinition,
  AuthIndexDefinition,
} from "./auth";

// Schema types
export type {
  MergedFieldsResult,
  ResolvedIndex,
  SlugSource,
  SlugRegistration,
  SlugConflict,
} from "./schema";
```

---

## Phase B: Tests

All tests use vitest (already configured in `packages/core/vitest.config.ts` with `globals: true` and `include: ['src/**/*.test.ts']`).

### Per-Field Validator Tests

**File: `packages/core/src/fields/text/schema.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { textToValidatorString } from "./schema";
import type { TextFieldMeta } from "../../types";

describe("textToValidatorString", () => {
  it("returns v.string() for a basic text field", () => {
    const meta: TextFieldMeta = { type: "text" };
    expect(textToValidatorString(meta)).toBe("v.string()");
  });

  it("returns v.string() regardless of minLength/maxLength", () => {
    const meta: TextFieldMeta = { type: "text", minLength: 1, maxLength: 200 };
    expect(textToValidatorString(meta)).toBe("v.string()");
  });

  it("returns v.string() regardless of defaultValue", () => {
    const meta: TextFieldMeta = { type: "text", defaultValue: "hello" };
    expect(textToValidatorString(meta)).toBe("v.string()");
  });

  it("returns v.string() with full options including index", () => {
    const meta: TextFieldMeta = {
      type: "text",
      label: "Title",
      description: "The post title",
      required: true,
      minLength: 1,
      maxLength: 200,
      defaultValue: "Untitled",
      index: "by_title",
    };
    // index does not affect the validator string
    expect(textToValidatorString(meta)).toBe("v.string()");
  });
});
```

**File: `packages/core/src/fields/number/schema.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { numberToValidatorString } from "./schema";
import type { NumberFieldMeta } from "../../types";

describe("numberToValidatorString", () => {
  it("returns v.float64() for a basic number field", () => {
    const meta: NumberFieldMeta = { type: "number" };
    expect(numberToValidatorString(meta)).toBe("v.float64()");
  });

  it("returns v.float64() regardless of min/max/step", () => {
    const meta: NumberFieldMeta = { type: "number", min: 0, max: 100, step: 0.01 };
    expect(numberToValidatorString(meta)).toBe("v.float64()");
  });

  it("returns v.float64() with defaultValue", () => {
    const meta: NumberFieldMeta = { type: "number", defaultValue: 42 };
    expect(numberToValidatorString(meta)).toBe("v.float64()");
  });
});
```

**File: `packages/core/src/fields/checkbox/schema.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { checkboxToValidatorString } from "./schema";
import type { CheckboxFieldMeta } from "../../types";

describe("checkboxToValidatorString", () => {
  it("returns v.boolean() for a basic checkbox", () => {
    const meta: CheckboxFieldMeta = { type: "checkbox" };
    expect(checkboxToValidatorString(meta)).toBe("v.boolean()");
  });

  it("returns v.boolean() with defaultValue", () => {
    const meta: CheckboxFieldMeta = { type: "checkbox", defaultValue: true };
    expect(checkboxToValidatorString(meta)).toBe("v.boolean()");
  });
});
```

**File: `packages/core/src/fields/select/schema.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { selectToValidatorString } from "./schema";
import type { SelectFieldMeta } from "../../types";

describe("selectToValidatorString", () => {
  it("returns union of literals for single-select", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
      ],
    };
    expect(selectToValidatorString(meta)).toBe(
      'v.union(v.literal("draft"), v.literal("published"))',
    );
  });

  it("wraps in v.array() for multi-select (hasMany)", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      hasMany: true,
      options: [
        { value: "tag1", label: "Tag 1" },
        { value: "tag2", label: "Tag 2" },
      ],
    };
    expect(selectToValidatorString(meta)).toBe(
      'v.array(v.union(v.literal("tag1"), v.literal("tag2")))',
    );
  });

  it("handles single option", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      options: [{ value: "only", label: "Only Option" }],
    };
    expect(selectToValidatorString(meta)).toBe('v.union(v.literal("only"))');
  });

  it("throws on empty options", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      options: [],
    };
    expect(() => selectToValidatorString(meta)).toThrow();
  });

  it("deduplicates option values", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      options: [
        { value: "a", label: "A" },
        { value: "a", label: "Also A" },
        { value: "b", label: "B" },
      ],
    };
    expect(selectToValidatorString(meta)).toBe(
      'v.union(v.literal("a"), v.literal("b"))',
    );
  });

  it("escapes quotes in option values", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      options: [{ value: 'it\'s "fine"', label: "Quoted" }],
    };
    const result = selectToValidatorString(meta);
    // The value should be properly escaped in the output string
    expect(result).toContain("v.literal(");
    // Should not break the generated TypeScript
    expect(result).not.toContain('""fine""');
  });

  it("handles hasMany: false explicitly", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      hasMany: false,
      options: [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
    };
    // hasMany: false should NOT wrap in v.array()
    expect(selectToValidatorString(meta)).toBe(
      'v.union(v.literal("a"), v.literal("b"))',
    );
  });
});
```

---

### Schema Extraction Tests

**File: `packages/core/src/schema/extract.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { fieldToValidatorString } from "./extract";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { checkbox } from "../fields/checkbox";
import { select } from "../fields/select";

describe("fieldToValidatorString", () => {
  describe("required fields (no v.optional wrapper)", () => {
    it("text field with required: true", () => {
      const field = text({ required: true });
      expect(fieldToValidatorString(field)).toBe("v.string()");
    });

    it("number field with required: true", () => {
      const field = number({ required: true });
      expect(fieldToValidatorString(field)).toBe("v.float64()");
    });

    it("select field with required: true", () => {
      const field = select({
        required: true,
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ],
      });
      expect(fieldToValidatorString(field)).toBe(
        'v.union(v.literal("a"), v.literal("b"))',
      );
    });
  });

  describe("optional fields (wrapped in v.optional)", () => {
    it("text field with no required option", () => {
      const field = text();
      expect(fieldToValidatorString(field)).toBe("v.optional(v.string())");
    });

    it("text field with required: false", () => {
      const field = text({ required: false });
      expect(fieldToValidatorString(field)).toBe("v.optional(v.string())");
    });

    it("number field without required", () => {
      const field = number({ min: 0 });
      expect(fieldToValidatorString(field)).toBe("v.optional(v.float64())");
    });

    it("checkbox field without required", () => {
      const field = checkbox();
      expect(fieldToValidatorString(field)).toBe("v.optional(v.boolean())");
    });

    it("select field without required", () => {
      const field = select({
        options: [{ value: "x", label: "X" }],
      });
      expect(fieldToValidatorString(field)).toBe(
        'v.optional(v.union(v.literal("x")))',
      );
    });

    it("multi-select field without required", () => {
      const field = select({
        hasMany: true,
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ],
      });
      expect(fieldToValidatorString(field)).toBe(
        'v.optional(v.array(v.union(v.literal("a"), v.literal("b"))))',
      );
    });
  });

  describe("index property does not affect validator", () => {
    it("text field with index still returns same validator", () => {
      const field = text({ required: true, index: "by_title" });
      expect(fieldToValidatorString(field)).toBe("v.string()");
    });
  });

  describe("error cases", () => {
    it("throws on unknown field type", () => {
      const field = {
        _type: "",
        _meta: { type: "unknown_type" },
      } as any;
      expect(() => fieldToValidatorString(field)).toThrow("unknown_type");
    });
  });
});
```

---

### Index Collection Tests

**File: `packages/core/src/schema/indexes.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { collectIndexes } from "./indexes";
import { defineCollection } from "../config/defineCollection";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { select } from "../fields/select";

describe("collectIndexes", () => {
  it("returns empty array when no indexes are defined", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
        body: text(),
      },
    });
    expect(collectIndexes(posts)).toEqual([]);
  });

  it("collects per-field index from a single field", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
        slug: text({ required: true, index: "by_slug" }),
      },
    });
    const indexes = collectIndexes(posts);
    expect(indexes).toEqual([
      { name: "by_slug", fields: ["slug"] },
    ]);
  });

  it("collects per-field indexes from multiple fields", () => {
    const posts = defineCollection("posts", {
      fields: {
        slug: text({ required: true, index: "by_slug" }),
        email: text({ required: true, index: "by_email" }),
      },
    });
    const indexes = collectIndexes(posts);
    expect(indexes).toHaveLength(2);
    expect(indexes).toContainEqual({ name: "by_slug", fields: ["slug"] });
    expect(indexes).toContainEqual({ name: "by_email", fields: ["email"] });
  });

  it("collects collection-level indexes", () => {
    const posts = defineCollection("posts", {
      fields: {
        author: text({ required: true }),
        createdAt: number({ required: true }),
      },
      indexes: [
        { name: "by_author_date", fields: ["author", "createdAt"] },
      ],
    });
    const indexes = collectIndexes(posts);
    expect(indexes).toEqual([
      { name: "by_author_date", fields: ["author", "createdAt"] },
    ]);
  });

  it("merges per-field and collection-level indexes", () => {
    const posts = defineCollection("posts", {
      fields: {
        slug: text({ required: true, index: "by_slug" }),
        author: text({ required: true }),
        createdAt: number({ required: true }),
      },
      indexes: [
        { name: "by_author_date", fields: ["author", "createdAt"] },
      ],
    });
    const indexes = collectIndexes(posts);
    expect(indexes).toHaveLength(2);
    expect(indexes).toContainEqual({ name: "by_slug", fields: ["slug"] });
    expect(indexes).toContainEqual({ name: "by_author_date", fields: ["author", "createdAt"] });
  });

  it("collection-level index wins on name collision with per-field index", () => {
    const posts = defineCollection("posts", {
      fields: {
        slug: text({ required: true, index: "by_slug" }),
        status: text({ required: true }),
      },
      indexes: [
        // Overrides the per-field "by_slug" with a compound index
        { name: "by_slug", fields: ["slug", "status"] },
      ],
    });
    const indexes = collectIndexes(posts);
    expect(indexes).toHaveLength(1);
    expect(indexes[0]).toEqual({ name: "by_slug", fields: ["slug", "status"] });
  });

  it("throws when two different fields claim the same index name", () => {
    const posts = defineCollection("posts", {
      fields: {
        slug: text({ required: true, index: "by_unique" }),
        email: text({ required: true, index: "by_unique" }),
      },
    });
    expect(() => collectIndexes(posts)).toThrow("by_unique");
  });

  it("skips fields with empty string index", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true, index: "" }),
      },
    });
    expect(collectIndexes(posts)).toEqual([]);
  });

  it("handles select fields with indexes", () => {
    const posts = defineCollection("posts", {
      fields: {
        status: select({
          required: true,
          index: "by_status",
          options: [
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
          ],
        }),
      },
    });
    const indexes = collectIndexes(posts);
    expect(indexes).toEqual([
      { name: "by_status", fields: ["status"] },
    ]);
  });
});
```

---

### Slug Registry Tests

**File: `packages/core/src/schema/slugs.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { SlugRegistry, buildSlugRegistry } from "./slugs";
import { defineCollection } from "../config/defineCollection";
import { defineConfig } from "../config/defineConfig";
import { text } from "../fields/text";
import { number } from "../fields/number";
import type { VexAuthAdapter } from "../auth/types";

describe("SlugRegistry", () => {
  it("reports no conflicts when all slugs are unique", () => {
    const registry = new SlugRegistry();
    registry.register("posts", "user-collection", "collections/posts.ts");
    registry.register("users", "user-collection", "collections/users.ts");
    registry.register("account", "auth-table", "@vexcms/better-auth");

    expect(registry.findConflicts()).toEqual([]);
  });

  it("detects duplicate slugs", () => {
    const registry = new SlugRegistry();
    registry.register("account", "user-collection", "collections/account.ts");
    registry.register("account", "auth-table", "@vexcms/better-auth");

    const conflicts = registry.findConflicts();
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].slug).toBe("account");
    expect(conflicts[0].registrations).toHaveLength(2);
  });

  it("detects multiple conflicts", () => {
    const registry = new SlugRegistry();
    registry.register("account", "user-collection", "collections/account.ts");
    registry.register("account", "auth-table", "@vexcms/better-auth");
    registry.register("session", "user-collection", "collections/session.ts");
    registry.register("session", "auth-table", "@vexcms/better-auth");

    const conflicts = registry.findConflicts();
    expect(conflicts).toHaveLength(2);
  });

  it("validate() throws with descriptive error on conflicts", () => {
    const registry = new SlugRegistry();
    registry.register("account", "user-collection", "collections/account.ts");
    registry.register("account", "auth-table", "@vexcms/better-auth");

    expect(() => registry.validate()).toThrow("account");
    expect(() => registry.validate()).toThrow("Duplicate");
  });

  it("validate() does not throw when all slugs are unique", () => {
    const registry = new SlugRegistry();
    registry.register("posts", "user-collection", "collections/posts.ts");
    registry.register("account", "auth-table", "@vexcms/better-auth");

    expect(() => registry.validate()).not.toThrow();
  });

  it("validate() does not throw on empty registry", () => {
    const registry = new SlugRegistry();
    expect(() => registry.validate()).not.toThrow();
  });

  it("getAll() returns all registrations", () => {
    const registry = new SlugRegistry();
    registry.register("posts", "user-collection", "collections/posts.ts");
    registry.register("users", "user-collection", "collections/users.ts");

    expect(registry.getAll()).toHaveLength(2);
  });
});

describe("buildSlugRegistry", () => {
  const posts = defineCollection("posts", {
    fields: { title: text({ required: true }) },
  });

  const users = defineCollection("users", {
    fields: { name: text({ required: true }) },
  });

  it("registers user collection slugs", () => {
    const config = defineConfig({ collections: [posts, users] });
    const registry = buildSlugRegistry(config);
    const all = registry.getAll();

    expect(all.find((r) => r.slug === "posts")?.source).toBe("user-collection");
    expect(all.find((r) => r.slug === "users")?.source).toBe("user-collection");
  });

  it("registers auth table slugs when auth is configured", () => {
    const authAdapter: VexAuthAdapter = {
      name: "better-auth",
      userCollection: "users",
      userFields: {},
      tables: [
        {
          slug: "account",
          fields: { userId: { validator: "v.string()" } },
        },
        {
          slug: "session",
          fields: { token: { validator: "v.string()" } },
        },
      ],
      plugins: [],
    };

    const config = defineConfig({
      collections: [posts, users],
      auth: authAdapter,
    });
    const registry = buildSlugRegistry(config);
    const all = registry.getAll();

    expect(all.find((r) => r.slug === "account")?.source).toBe("auth-table");
    expect(all.find((r) => r.slug === "session")?.source).toBe("auth-table");
  });

  it("does NOT register auth userCollection as a separate slug", () => {
    const authAdapter: VexAuthAdapter = {
      name: "better-auth",
      userCollection: "users",
      userFields: {},
      tables: [],
      plugins: [],
    };

    const config = defineConfig({
      collections: [posts, users],
      auth: authAdapter,
    });
    const registry = buildSlugRegistry(config);
    const all = registry.getAll();

    // "users" should appear once (from user-collection), not twice
    const usersRegistrations = all.filter((r) => r.slug === "users");
    expect(usersRegistrations).toHaveLength(1);
    expect(usersRegistrations[0].source).toBe("user-collection");
  });

  it("throws when auth userCollection is not in collections", () => {
    const authAdapter: VexAuthAdapter = {
      name: "better-auth",
      userCollection: "nonexistent",
      userFields: {},
      tables: [],
      plugins: [],
    };

    const config = defineConfig({
      collections: [posts],
      auth: authAdapter,
    });

    expect(() => buildSlugRegistry(config)).toThrow("nonexistent");
  });

  it("detects collision between user collection and auth table", () => {
    const account = defineCollection("account", {
      fields: { name: text({ required: true }) },
    });

    const authAdapter: VexAuthAdapter = {
      name: "better-auth",
      userCollection: "users",
      userFields: {},
      tables: [
        {
          slug: "account",
          fields: { userId: { validator: "v.string()" } },
        },
      ],
      plugins: [],
    };

    const config = defineConfig({
      collections: [posts, users, account],
      auth: authAdapter,
    });
    const registry = buildSlugRegistry(config);
    const conflicts = registry.findConflicts();

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].slug).toBe("account");
  });
});
```

---

### Field Merge Tests

**File: `packages/core/src/schema/merge.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { mergeAuthFields, resolveAuthAdapter } from "./merge";
import { defineCollection } from "../config/defineCollection";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { select } from "../fields/select";
import type { VexAuthAdapter, VexAuthPlugin } from "../auth/types";

describe("mergeAuthFields", () => {
  const users = defineCollection("users", {
    fields: {
      name: text({ label: "Name", required: true }),
      email: text({ label: "Email", required: true }),
      postCount: number({ label: "Post Count", admin: { readOnly: true } }),
      role: select({
        label: "Role",
        options: [
          { value: "admin", label: "Admin" },
          { value: "user", label: "User" },
        ],
      }),
    },
  });

  it("returns only user fields when no auth adapter", () => {
    const result = mergeAuthFields(undefined, users);

    expect(result.userOnly).toContain("name");
    expect(result.userOnly).toContain("email");
    expect(result.userOnly).toContain("postCount");
    expect(result.userOnly).toContain("role");
    expect(result.authOnly).toEqual([]);
    expect(result.overlapping).toEqual([]);
  });

  it("merges auth fields with user fields", () => {
    const authAdapter: VexAuthAdapter = {
      name: "better-auth",
      userCollection: "users",
      userFields: {
        name: { validator: "v.string()" },
        email: { validator: "v.string()" },
        emailVerified: { validator: "v.boolean()" },
        createdAt: { validator: "v.float64()" },
        updatedAt: { validator: "v.float64()" },
      },
      tables: [],
      plugins: [],
    };

    const result = mergeAuthFields(authAdapter, users);

    // Auth-provided fields that user also defines
    expect(result.overlapping).toContain("name");
    expect(result.overlapping).toContain("email");

    // Auth-only fields (user doesn't define these)
    expect(result.authOnly).toContain("emailVerified");
    expect(result.authOnly).toContain("createdAt");
    expect(result.authOnly).toContain("updatedAt");

    // User-only fields (auth doesn't provide these)
    expect(result.userOnly).toContain("postCount");
    expect(result.userOnly).toContain("role");

    // All fields should be in the merged output
    expect(Object.keys(result.fields)).toContain("name");
    expect(Object.keys(result.fields)).toContain("email");
    expect(Object.keys(result.fields)).toContain("emailVerified");
    expect(Object.keys(result.fields)).toContain("createdAt");
    expect(Object.keys(result.fields)).toContain("postCount");
    expect(Object.keys(result.fields)).toContain("role");
  });

  it("auth validator wins on overlapping fields", () => {
    const authAdapter: VexAuthAdapter = {
      name: "better-auth",
      userCollection: "users",
      userFields: {
        email: { validator: "v.string()" },
      },
      tables: [],
      plugins: [],
    };

    const result = mergeAuthFields(authAdapter, users);

    // The auth validator should win for schema generation
    expect(result.fields["email"]).toBe("v.string()");
  });

  it("includes auth plugin userFields", () => {
    const authAdapter: VexAuthAdapter = {
      name: "better-auth",
      userCollection: "users",
      userFields: {
        email: { validator: "v.string()" },
      },
      tables: [],
      plugins: [
        {
          name: "admin",
          userFields: {
            banned: { validator: "v.optional(v.boolean())" },
            banReason: { validator: "v.optional(v.string())" },
          },
        },
      ],
    };

    const result = mergeAuthFields(authAdapter, users);

    expect(result.authOnly).toContain("banned");
    expect(result.authOnly).toContain("banReason");
    expect(result.fields["banned"]).toBe("v.optional(v.boolean())");
  });
});

describe("resolveAuthAdapter", () => {
  it("returns base tables unchanged when no plugins", () => {
    const adapter: VexAuthAdapter = {
      name: "better-auth",
      userCollection: "users",
      userFields: { email: { validator: "v.string()" } },
      tables: [
        {
          slug: "account",
          fields: { userId: { validator: "v.string()" } },
        },
      ],
      plugins: [],
    };

    const result = resolveAuthAdapter(adapter);
    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].slug).toBe("account");
  });

  it("adds plugin tables", () => {
    const adapter: VexAuthAdapter = {
      name: "better-auth",
      userCollection: "users",
      userFields: {},
      tables: [
        { slug: "account", fields: { userId: { validator: "v.string()" } } },
      ],
      plugins: [
        {
          name: "api-key",
          tables: [
            { slug: "api_key", fields: { key: { validator: "v.string()" } } },
          ],
        },
      ],
    };

    const result = resolveAuthAdapter(adapter);
    expect(result.tables).toHaveLength(2);
    expect(result.tables.find((t) => t.slug === "api_key")).toBeDefined();
  });

  it("applies plugin tableExtensions to existing tables", () => {
    const adapter: VexAuthAdapter = {
      name: "better-auth",
      userCollection: "users",
      userFields: {},
      tables: [
        {
          slug: "session",
          fields: {
            token: { validator: "v.string()" },
            userId: { validator: "v.string()" },
          },
        },
      ],
      plugins: [
        {
          name: "admin",
          tableExtensions: {
            session: {
              impersonatedBy: { validator: "v.optional(v.string())" },
            },
          },
        },
      ],
    };

    const result = resolveAuthAdapter(adapter);
    const session = result.tables.find((t) => t.slug === "session");
    expect(session?.fields["impersonatedBy"]).toBeDefined();
    expect(session?.fields["impersonatedBy"].validator).toBe(
      "v.optional(v.string())",
    );
    // Original fields still present
    expect(session?.fields["token"]).toBeDefined();
  });

  it("merges plugin userFields into adapter userFields", () => {
    const adapter: VexAuthAdapter = {
      name: "better-auth",
      userCollection: "users",
      userFields: {
        email: { validator: "v.string()" },
      },
      tables: [],
      plugins: [
        {
          name: "admin",
          userFields: {
            banned: { validator: "v.optional(v.boolean())" },
            role: { validator: "v.array(v.string())" },
          },
        },
      ],
    };

    const result = resolveAuthAdapter(adapter);
    expect(result.userFields["email"]).toBeDefined();
    expect(result.userFields["banned"]).toBeDefined();
    expect(result.userFields["role"]).toBeDefined();
  });

  it("throws when plugin extends non-existent table", () => {
    const adapter: VexAuthAdapter = {
      name: "better-auth",
      userCollection: "users",
      userFields: {},
      tables: [],
      plugins: [
        {
          name: "bad-plugin",
          tableExtensions: {
            nonexistent: {
              field: { validator: "v.string()" },
            },
          },
        },
      ],
    };

    expect(() => resolveAuthAdapter(adapter)).toThrow("nonexistent");
  });
});
```

---

### Full Schema Generation Tests

**File: `packages/core/src/schema/generate.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { generateVexSchema } from "./generate";
import { defineCollection } from "../config/defineCollection";
import { defineConfig } from "../config/defineConfig";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { checkbox } from "../fields/checkbox";
import { select } from "../fields/select";
import type { VexAuthAdapter } from "../auth/types";

describe("generateVexSchema", () => {
  describe("header and imports", () => {
    it("includes auto-generated warning comment", () => {
      const config = defineConfig({ collections: [] });
      const output = generateVexSchema(config);
      expect(output).toContain("AUTO-GENERATED");
      expect(output).toContain("DO NOT EDIT");
    });

    it("includes convex imports", () => {
      const config = defineConfig({ collections: [] });
      const output = generateVexSchema(config);
      expect(output).toContain('import { defineTable } from "convex/server"');
      expect(output).toContain('import { v } from "convex/values"');
    });
  });

  describe("basic collection generation", () => {
    it("generates a simple collection with text fields", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          slug: text(),
        },
      });
      const config = defineConfig({ collections: [posts] });
      const output = generateVexSchema(config);

      expect(output).toContain("export const posts = defineTable({");
      expect(output).toContain("title: v.string()");
      expect(output).toContain("slug: v.optional(v.string())");
    });

    it("generates a collection with all field types", () => {
      const items = defineCollection("items", {
        fields: {
          name: text({ required: true }),
          count: number({ required: true }),
          active: checkbox(),
          status: select({
            required: true,
            options: [
              { value: "open", label: "Open" },
              { value: "closed", label: "Closed" },
            ],
          }),
        },
      });
      const config = defineConfig({ collections: [items] });
      const output = generateVexSchema(config);

      expect(output).toContain("name: v.string()");
      expect(output).toContain("count: v.float64()");
      expect(output).toContain("active: v.optional(v.boolean())");
      expect(output).toContain(
        'status: v.union(v.literal("open"), v.literal("closed"))',
      );
    });

    it("generates multiple collections", () => {
      const posts = defineCollection("posts", {
        fields: { title: text({ required: true }) },
      });
      const categories = defineCollection("categories", {
        fields: { name: text({ required: true }) },
      });
      const config = defineConfig({ collections: [posts, categories] });
      const output = generateVexSchema(config);

      expect(output).toContain("export const posts = defineTable({");
      expect(output).toContain("export const categories = defineTable({");
    });

    it("handles empty collections array", () => {
      const config = defineConfig({ collections: [] });
      const output = generateVexSchema(config);

      // Should still have header and imports, just no table exports
      expect(output).toContain("AUTO-GENERATED");
      expect(output).not.toContain("export const");
    });
  });

  describe("index generation", () => {
    it("generates per-field indexes as chained .index() calls", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          slug: text({ required: true, index: "by_slug" }),
        },
      });
      const config = defineConfig({ collections: [posts] });
      const output = generateVexSchema(config);

      expect(output).toContain('.index("by_slug", ["slug"])');
    });

    it("generates collection-level compound indexes", () => {
      const posts = defineCollection("posts", {
        fields: {
          author: text({ required: true }),
          createdAt: number({ required: true }),
        },
        indexes: [
          { name: "by_author_date", fields: ["author", "createdAt"] },
        ],
      });
      const config = defineConfig({ collections: [posts] });
      const output = generateVexSchema(config);

      expect(output).toContain('.index("by_author_date", ["author", "createdAt"])');
    });

    it("generates both per-field and collection-level indexes", () => {
      const posts = defineCollection("posts", {
        fields: {
          slug: text({ required: true, index: "by_slug" }),
          author: text({ required: true }),
          createdAt: number({ required: true }),
        },
        indexes: [
          { name: "by_author_date", fields: ["author", "createdAt"] },
        ],
      });
      const config = defineConfig({ collections: [posts] });
      const output = generateVexSchema(config);

      expect(output).toContain('.index("by_slug", ["slug"])');
      expect(output).toContain('.index("by_author_date", ["author", "createdAt"])');
    });

    it("does not generate .index() when no indexes defined", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
        },
      });
      const config = defineConfig({ collections: [posts] });
      const output = generateVexSchema(config);

      expect(output).not.toContain(".index(");
    });
  });

  describe("auth integration", () => {
    const users = defineCollection("users", {
      fields: {
        name: text({ required: true }),
        postCount: number({ admin: { readOnly: true } }),
      },
    });

    const posts = defineCollection("posts", {
      fields: { title: text({ required: true }) },
    });

    const baseAuthAdapter: VexAuthAdapter = {
      name: "better-auth",
      userCollection: "users",
      userFields: {
        name: { validator: "v.string()" },
        email: { validator: "v.string()" },
        emailVerified: { validator: "v.boolean()" },
        createdAt: { validator: "v.float64()" },
        updatedAt: { validator: "v.float64()" },
      },
      tables: [
        {
          slug: "account",
          fields: {
            userId: { validator: "v.string()" },
            accountId: { validator: "v.string()" },
            providerId: { validator: "v.string()" },
            createdAt: { validator: "v.float64()" },
            updatedAt: { validator: "v.float64()" },
          },
          indexes: [
            { name: "by_userId", fields: ["userId"] },
          ],
        },
        {
          slug: "session",
          fields: {
            token: { validator: "v.string()" },
            userId: { validator: "v.string()" },
            expiresAt: { validator: "v.float64()" },
            createdAt: { validator: "v.float64()" },
            updatedAt: { validator: "v.float64()" },
          },
          indexes: [
            { name: "by_token", fields: ["token"] },
          ],
        },
      ],
      plugins: [],
    };

    it("merges auth fields into the user collection", () => {
      const config = defineConfig({
        collections: [posts, users],
        auth: baseAuthAdapter,
      });
      const output = generateVexSchema(config);

      // Auth-provided fields appear in the users table
      expect(output).toContain("email: v.string()");
      expect(output).toContain("emailVerified: v.boolean()");
      expect(output).toContain("createdAt: v.float64()");

      // User-only fields also present
      expect(output).toContain("postCount:");
    });

    it("generates auth infrastructure tables", () => {
      const config = defineConfig({
        collections: [posts, users],
        auth: baseAuthAdapter,
      });
      const output = generateVexSchema(config);

      expect(output).toContain("export const account = defineTable({");
      expect(output).toContain("export const session = defineTable({");
    });

    it("generates indexes on auth tables", () => {
      const config = defineConfig({
        collections: [posts, users],
        auth: baseAuthAdapter,
      });
      const output = generateVexSchema(config);

      expect(output).toContain('.index("by_userId", ["userId"])');
      expect(output).toContain('.index("by_token", ["token"])');
    });

    it("applies auth plugin field extensions", () => {
      const authWithAdmin: VexAuthAdapter = {
        ...baseAuthAdapter,
        plugins: [
          {
            name: "admin",
            userFields: {
              banned: { validator: "v.optional(v.boolean())" },
              role: { validator: "v.array(v.string())" },
            },
            tableExtensions: {
              session: {
                impersonatedBy: { validator: "v.optional(v.string())" },
              },
            },
          },
        ],
      };

      const config = defineConfig({
        collections: [posts, users],
        auth: authWithAdmin,
      });
      const output = generateVexSchema(config);

      // Plugin user fields should appear in users table
      expect(output).toContain("banned: v.optional(v.boolean())");
      expect(output).toContain("role: v.array(v.string())");

      // Plugin table extension should appear in session table
      expect(output).toContain("impersonatedBy: v.optional(v.string())");
    });
  });

  describe("slug validation", () => {
    it("throws when user collection slug conflicts with auth table slug", () => {
      const account = defineCollection("account", {
        fields: { name: text({ required: true }) },
      });
      const users = defineCollection("users", {
        fields: { name: text({ required: true }) },
      });

      const authAdapter: VexAuthAdapter = {
        name: "better-auth",
        userCollection: "users",
        userFields: {},
        tables: [
          { slug: "account", fields: { userId: { validator: "v.string()" } } },
        ],
        plugins: [],
      };

      const config = defineConfig({
        collections: [account, users],
        auth: authAdapter,
      });

      expect(() => generateVexSchema(config)).toThrow("account");
    });

    it("throws when auth userCollection is not found in collections", () => {
      const posts = defineCollection("posts", {
        fields: { title: text({ required: true }) },
      });

      const authAdapter: VexAuthAdapter = {
        name: "better-auth",
        userCollection: "users",
        userFields: {},
        tables: [],
        plugins: [],
      };

      const config = defineConfig({
        collections: [posts],
        auth: authAdapter,
      });

      expect(() => generateVexSchema(config)).toThrow("users");
    });
  });

  describe("output formatting", () => {
    it("generates valid TypeScript (no syntax errors in structure)", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          slug: text({ index: "by_slug" }),
          views: number(),
          featured: checkbox(),
          status: select({
            required: true,
            options: [
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
            ],
          }),
        },
      });
      const config = defineConfig({ collections: [posts] });
      const output = generateVexSchema(config);

      // Basic structural checks
      const exportCount = (output.match(/export const /g) || []).length;
      expect(exportCount).toBe(1); // One collection

      // Opening and closing braces should be balanced
      const openBraces = (output.match(/\{/g) || []).length;
      const closeBraces = (output.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);

      // Opening and closing parens should be balanced
      const openParens = (output.match(/\(/g) || []).length;
      const closeParens = (output.match(/\)/g) || []).length;
      expect(openParens).toBe(closeParens);
    });

    it("uses consistent indentation", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
        },
      });
      const config = defineConfig({ collections: [posts] });
      const output = generateVexSchema(config);

      // Fields inside defineTable should be indented
      const lines = output.split("\n");
      const titleLine = lines.find((l) => l.includes("title:"));
      expect(titleLine).toBeDefined();
      expect(titleLine!.startsWith("  ")).toBe(true);
    });
  });
});
```

---

## Phase C: Implementation Summaries

This section describes what each function must accomplish. The actual implementations are left for the developer, guided by the tests in Phase B.

### `textToValidatorString`

**Goal:** Return `"v.string()"`. Always. Text field metadata (minLength, maxLength, defaultValue, index) does not affect the Convex validator.

---

### `numberToValidatorString`

**Goal:** Return `"v.float64()"`. Always. Convex stores all numbers as 64-bit floats. Number field metadata (min, max, step) does not affect the Convex validator.

---

### `checkboxToValidatorString`

**Goal:** Return `"v.boolean()"`. Always. Boolean metadata (defaultValue) does not affect the Convex validator.

---

### `selectToValidatorString`

**Goal:** Build a `v.union(v.literal(...), ...)` string from the options array. If `hasMany` is true, wrap the result in `v.array(...)`.

**Steps:**
1. Deduplicate option values
2. Throw if options array is empty
3. Escape quote characters in values
4. Build `v.literal("value")` for each unique value
5. Join with `v.union(...)`
6. If `hasMany`, wrap in `v.array(...)`

---

### `fieldToValidatorString`

**Goal:** Dispatch to the correct per-field validator function based on `field._meta.type`, then wrap in `v.optional(...)` if the field is not required.

**Steps:**
1. Read `field._meta.type`
2. Switch on type: `"text"` → `textToValidatorString`, `"number"` → `numberToValidatorString`, `"checkbox"` → `checkboxToValidatorString`, `"select"` → `selectToValidatorString`
3. If type is unrecognized, throw with the type string in the error message
4. If `field._meta.required` is truthy, return the raw validator string
5. Otherwise, wrap in `v.optional(...)`
6. The `index` property on `_meta` is intentionally ignored — handled by `collectIndexes()`

---

### `collectIndexes`

**Goal:** Gather all indexes for a collection from per-field `index` properties and collection-level `indexes` config. Deduplicate by name.

**Steps:**
1. Walk all fields in `collection.config.fields`
2. For each field with a non-empty `_meta.index` string, create `{ name: meta.index, fields: [fieldName] }`
3. Check for duplicate index names among per-field indexes — if two fields claim the same index name, throw
4. Get collection-level indexes from `collection.config.indexes ?? []`
5. Merge: collection-level indexes override per-field indexes with the same name
6. Return the deduplicated array

---

### `SlugRegistry.findConflicts`

**Goal:** Group registrations by slug. Return entries where a slug has 2+ registrations.

**Steps:**
1. Build a Map<string, SlugRegistration[]> from all registrations
2. Filter to entries with length > 1
3. Return as SlugConflict[]

---

### `SlugRegistry.validate`

**Goal:** Call `findConflicts()`. If any conflicts exist, throw an error with a formatted message listing each conflict's slug and all its sources.

---

### `buildSlugRegistry`

**Goal:** Create a SlugRegistry and populate it from the full VexConfig.

**Steps:**
1. Create a new SlugRegistry
2. Register each collection slug as `"user-collection"`
3. Register each global slug as `"user-global"`
4. If auth is configured:
   a. Verify `auth.userCollection` exists in collections (throw if not)
   b. Resolve auth adapter (apply plugins)
   c. Register each resolved auth table slug as `"auth-table"`
5. Return the registry

---

### `mergeAuthFields`

**Goal:** Combine auth-provided userFields with user-defined collection fields for schema generation.

**Steps:**
1. If no auth adapter, convert all user fields to validator strings and return as `userOnly`
2. Resolve auth adapter (apply plugin userFields)
3. For each auth userField: if user also defines it → `overlapping`; if not → `authOnly`
4. For each user field: if auth doesn't define it → `userOnly`
5. Build merged fields map: auth fields first (as raw validator strings), then user-only fields (converted via `fieldToValidatorString`)
6. For overlapping fields, use the auth validator string

---

### `resolveAuthAdapter`

**Goal:** Apply all auth plugin contributions to produce the final tables and userFields.

**Steps:**
1. Deep copy base tables and userFields
2. For each plugin in order:
   a. Merge plugin.userFields into accumulated userFields
   b. Add plugin.tables to accumulated tables
   c. For each tableExtension, find the matching table and merge fields (throw if table not found)
3. Return resolved tables and userFields

---

### `generateVexSchema`

**Goal:** Produce the complete `vex.schema.ts` TypeScript source string.

**Steps:**
1. Build slug registry from config and validate (throws on conflicts)
2. Resolve auth adapter if present
3. Build the header (warning comment + imports)
4. For each collection:
   a. If this is the auth user collection, use merged fields (auth + user)
   b. Otherwise, convert user fields via `fieldToValidatorString`
   c. Collect indexes via `collectIndexes()` (for non-auth collections)
   d. Generate `export const <slug> = defineTable({ ... })`
   e. Chain `.index(...)` calls for each resolved index
5. For each auth infrastructure table:
   a. Generate `export const <slug> = defineTable({ ... })`
   b. Chain `.index(...)` calls for each index definition
6. Join all parts with newlines and return

**Edge cases to handle:**
- Empty fields object → `defineTable({})` (valid but unusual)
- Auth table with no indexes → no `.index()` calls
- Multiple indexes on one table → chain `.index()` calls
- Per-field indexes on the auth user collection → collected from the user's field definitions (not from auth fields, which use raw validator strings)

---

## User-Extensible Schema (schema.ts)

The generated `vex.schema.ts` exports **named table definitions**. Users import these in their own `convex/schema.ts` and can chain additional Convex methods:

```typescript
// convex/schema.ts (user-owned)
import { defineSchema } from "convex/server";
import { posts, users, account, session, verification, jwks } from "./vex.schema";

export default defineSchema({
  // Use as-is
  posts,
  account,
  session,
  verification,
  jwks,

  // Extend with additional indexes or search indexes
  users: users
    .index("by_email", ["email"])
    .searchIndex("search_name", { searchField: "name" }),

  // Add custom tables alongside Vex-managed ones
  analytics: defineTable({
    event: v.string(),
    timestamp: v.float64(),
  }).index("by_event", ["event"]),
});
```

This works because Convex's `defineTable()` returns an object with chainable `.index()` and `.searchIndex()` methods. Vex generates the base table definition; users extend it in their schema file. This is explicitly supported by Convex and requires no special handling from Vex.

---

## `@vexcms/better-auth` Package (Reference)

This package is out of scope for the `@vexcms/core` tests but is defined here for completeness. It will be implemented as a separate package.

### `betterAuth(options): VexAuthAdapter`

**Factory function that returns a VexAuthAdapter.**

```typescript
// packages/better-auth/src/index.ts
import type { VexAuthAdapter, VexAuthPlugin } from "@vexcms/core";
import { BASE_USER_FIELDS } from "./userFields";
import { BASE_TABLES } from "./tables";

export interface BetterAuthOptions {
  /** Which collection slug represents the user table */
  userCollection: string;
  /** Better-auth sub-plugins to activate */
  plugins?: VexAuthPlugin[];
}

export function betterAuth(options: BetterAuthOptions): VexAuthAdapter {
  return {
    name: "better-auth",
    userCollection: options.userCollection,
    userFields: { ...BASE_USER_FIELDS },
    tables: [...BASE_TABLES],
    plugins: options.plugins ?? [],
  };
}
```

### Base user fields

```typescript
// packages/better-auth/src/userFields.ts
import type { AuthFieldDefinition } from "@vexcms/core";

export const BASE_USER_FIELDS: Record<string, AuthFieldDefinition> = {
  name: { validator: "v.string()" },
  email: { validator: "v.string()" },
  emailVerified: { validator: "v.boolean()" },
  image: { validator: "v.optional(v.string())" },
  username: { validator: "v.optional(v.union(v.null(), v.string()))" },
  displayUsername: { validator: "v.optional(v.union(v.null(), v.string()))" },
  phoneNumber: { validator: "v.optional(v.union(v.null(), v.string()))" },
  phoneNumberVerified: { validator: "v.optional(v.union(v.null(), v.boolean()))" },
  isAnonymous: { validator: "v.optional(v.union(v.null(), v.boolean()))" },
  twoFactorEnabled: { validator: "v.optional(v.union(v.null(), v.boolean()))" },
  userId: { validator: "v.optional(v.union(v.null(), v.string()))" },
  createdAt: { validator: "v.float64()" },
  updatedAt: { validator: "v.float64()" },
};
```

### Base tables

```typescript
// packages/better-auth/src/tables.ts
import type { AuthTableDefinition } from "@vexcms/core";

export const BASE_TABLES: AuthTableDefinition[] = [
  {
    slug: "account",
    fields: {
      accessToken: { validator: "v.optional(v.string())" },
      accessTokenExpiresAt: { validator: "v.optional(v.float64())" },
      accountId: { validator: "v.string()" },
      createdAt: { validator: "v.float64()" },
      idToken: { validator: "v.optional(v.string())" },
      password: { validator: "v.optional(v.string())" },
      providerId: { validator: "v.string()" },
      refreshToken: { validator: "v.optional(v.string())" },
      refreshTokenExpiresAt: { validator: "v.optional(v.float64())" },
      scope: { validator: "v.optional(v.string())" },
      updatedAt: { validator: "v.float64()" },
      userId: { validator: "v.string()" },
    },
    indexes: [
      { name: "by_userId", fields: ["userId"] },
      { name: "by_accountId", fields: ["accountId"] },
    ],
  },
  {
    slug: "session",
    fields: {
      createdAt: { validator: "v.float64()" },
      expiresAt: { validator: "v.float64()" },
      ipAddress: { validator: "v.optional(v.string())" },
      token: { validator: "v.string()" },
      updatedAt: { validator: "v.float64()" },
      userAgent: { validator: "v.optional(v.string())" },
      userId: { validator: "v.string()" },
    },
    indexes: [
      { name: "by_token", fields: ["token"] },
    ],
  },
  {
    slug: "verification",
    fields: {
      createdAt: { validator: "v.float64()" },
      expiresAt: { validator: "v.float64()" },
      identifier: { validator: "v.string()" },
      updatedAt: { validator: "v.float64()" },
      value: { validator: "v.string()" },
    },
    indexes: [
      { name: "by_identifier", fields: ["identifier"] },
      { name: "by_expiresAt", fields: ["expiresAt"] },
    ],
  },
  {
    slug: "jwks",
    fields: {
      createdAt: { validator: "v.float64()" },
      privateKey: { validator: "v.optional(v.string())" },
      publicKey: { validator: "v.string()" },
    },
  },
];
```

### Admin plugin

```typescript
// packages/better-auth/src/plugins/admin.ts
import type { VexAuthPlugin } from "@vexcms/core";

export interface AdminPluginOptions {
  adminRoles?: string[];
  defaultRole?: string;
}

export function admin(options?: AdminPluginOptions): VexAuthPlugin {
  return {
    name: "admin",
    userFields: {
      banned: { validator: "v.optional(v.boolean())" },
      banExpires: { validator: "v.optional(v.float64())" },
      banReason: { validator: "v.optional(v.string())" },
      role: { validator: "v.array(v.string())" },
    },
    tableExtensions: {
      session: {
        impersonatedBy: { validator: "v.optional(v.string())" },
      },
    },
  };
}
```

---

## User-Facing Config Example

After this spec is implemented, a user's collection with indexes looks like:

```typescript
// src/vexcms/collections/posts.ts
import { defineCollection, text, number, select, checkbox } from "@vexcms/core";

export const posts = defineCollection("posts", {
  fields: {
    title: text({ label: "Title", required: true }),
    slug: text({ label: "Slug", required: true, index: "by_slug" }),
    status: select({
      label: "Status",
      required: true,
      index: "by_status",
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
      ],
    }),
    featured: checkbox({ label: "Featured" }),
    author: text({ label: "Author", required: true }),
    publishedAt: number({ label: "Published At" }),
  },
  // Compound indexes go here
  indexes: [
    { name: "by_author_status", fields: ["author", "status"] },
    { name: "by_status_published", fields: ["status", "publishedAt"] },
  ],
  labels: { singular: "Post", plural: "Posts" },
  admin: {
    group: "Content",
    useAsTitle: "title",
    defaultColumns: ["title", "status", "featured"],
  },
});
```

And the full `vex.config.ts`:

```typescript
import { defineConfig } from "@vexcms/core";
import { betterAuth } from "@vexcms/better-auth";
import { admin } from "@vexcms/better-auth/plugins";
import { posts, users, categories } from "./collections";

export default defineConfig({
  collections: [posts, users, categories],

  auth: betterAuth({
    userCollection: "users",
    plugins: [
      admin({ adminRoles: ["admin"], defaultRole: "user" }),
    ],
  }),

  admin: {
    user: "users",
    meta: { titleSuffix: " | Vex CMS" },
  },
});
```

The generated `vex.schema.ts` will include:
- All collection tables with per-field and collection-level indexes
- Auth infrastructure tables (account, session, verification, jwks) with their indexes
- Auth plugin extensions (admin fields on users, impersonatedBy on session)

And the user's `schema.ts` can extend any table with additional Convex config.

---

## Testing Checklist

All tests in `packages/core/src/`:

- [ ] `fields/text/schema.test.ts` — text validator generation
- [ ] `fields/number/schema.test.ts` — number validator generation
- [ ] `fields/checkbox/schema.test.ts` — checkbox validator generation
- [ ] `fields/select/schema.test.ts` — select validator generation (single, multi, empty, dedupe, escape)
- [ ] `schema/extract.test.ts` — dispatcher with required/optional wrapping, index ignored
- [ ] `schema/indexes.test.ts` — per-field indexes, collection-level indexes, dedup, collision detection
- [ ] `schema/slugs.test.ts` — slug registry, conflict detection, buildSlugRegistry
- [ ] `schema/merge.test.ts` — auth field merging, plugin resolution
- [ ] `schema/generate.test.ts` — full schema generation with indexes, auth, various configs

Run with: `pnpm --filter @vexcms/core test`
