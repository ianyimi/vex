# Schema Generation & Auth Integration Spec

This document defines the implementation plan for Vex CMS schema generation from collection configs and the auth plugin integration for `@vexcms/better-auth`. It covers the per-field subfolder restructure, Convex schema codegen, index generation (per-field and collection-level), auth adapter types, field merging, reserved slug validation, and a test-first development approach.

**Referenced by**: [roadmap.md](./roadmap.md) - Phase 1.3

**Depends on**: [05-schema-field-system-spec.md](./05-schema-field-system-spec.md) - Field types and collection configuration

**Supersedes (partially)**: [04-auth-adapter-spec.md](./04-auth-adapter-spec.md) - Replaces the abstract AuthAdapter interface with a concrete `vexBetterAuth()` config slot; [06-convex-integration-spec.md](./06-convex-integration-spec.md) - Replaces schema generation sections

**Testing**: [11-testing-strategy-spec.md](./11-testing-strategy-spec.md) - Unit tests in `packages/core`

---

## Design Goals

1. **Zero Convex dependency in core** — Schema generation outputs strings (`"v.string()"`) not runtime validators. `@vexcms/core` stays dependency-free.
2. **Colocated field logic** — Each field type lives in its own subfolder with `config.ts` (user-facing builder) and `schemaValueType.ts` (value type string generator) side by side.
3. **Auth as top-level config** — `auth` is a first-class slot on `VexConfig`, not a plugin. The `vexBetterAuth()` function accepts the full better-auth config and returns a typed auth adapter object.
4. **Single source of truth for auth** — `@vexcms/better-auth` accepts the same `BetterAuthOptions` config users pass to `betterAuth()`. Users maintain one auth config, not three. The Vex package introspects it for schema generation, including `v.id()` on relationship fields.
5. **Slug safety** — All table slugs (user collections, globals, auth tables, system tables) are validated for uniqueness before schema generation, with source-aware error messages.
6. **Test-first** — Tests are written before implementations. Tests are colocated with the code they test inside `packages/core/src/`.
7. **String codegen** — `generateVexSchema()` produces the full TypeScript source for the schema file. Output path is configurable via `schema.outputPath` (default: `"convex/vex.schema.ts"`). No AST library needed for generation.
8. **Flexible indexes** — Users can declare indexes per-field (`index: "by_slug"`), per-collection (`indexes: [...]`), or they're auto-generated for `admin.useAsTitle` fields. All produce `.index()` calls on the generated `defineTable()`.
9. **User-extensible schema** — The generated schema file exports named table definitions. Users import them in their own `schema.ts` and can chain additional `.index()`, `.searchIndex()`, or other Convex methods before passing to `defineSchema()`.

---

## Implementation Order

This spec is structured for test-first development across two stages. Stage 1 focuses on core types and per-field validators, then jumps to the `@vexcms/better-auth` package so the `auth` field on `VexConfigInput` passes compile-time validation. Stage 2 returns to core to build the schema generation pipeline.

### Stage 1: Types, Subfolder Restructure, and Auth Package

- [x] **Phase A.1** — Core types and interfaces
  - [x] Error types (`VexError`, `VexSlugConflictError`, `VexFieldValidationError`, `VexAuthConfigError`)
  - [x] Auth types (`VexAuthAdapter`, `AuthTableDefinition`, `AuthFieldDefinition`, `AuthIndexDefinition`)
  - [x] Field type modifications (`BaseFieldOptions`, `BaseFieldMeta.index`)
  - [x] Collection type modifications (`IndexConfig`, `CollectionConfig.tableName`)
  - [x] Config type modifications (`VexConfig.auth` required, `SchemaConfig`, `SchemaConfigInput`)
  - [x] Re-exports from `packages/core/src/index.ts`
- [x] **Phase A.2** — Per-field subfolder restructure
  - [x] Move `text.ts` → `text/config.ts`, create `text/index.ts`, `text/schemaValueType.ts` stub
  - [x] Move `number.ts` → `number/config.ts`, create `number/index.ts`, `number/schemaValueType.ts` stub
  - [x] Move `checkbox.ts` → `checkbox/config.ts`, create `checkbox/index.ts`, `checkbox/schemaValueType.ts` stub
  - [x] Move `select.ts` → `select/config.ts`, create `select/index.ts`, `select/schemaValueType.ts` stub
  - [x] Create `fields/constants.ts` with value type constants (`TEXT_VALUETYPE`, `NUMBER_VALUETYPE`, `CHECKBOX_VALUETYPE`)
  - [x] Update `fields/index.ts` to re-export from subfolders
  - [x] Verify build passes
- [x] **Phase D** — `@vexcms/better-auth` package (see [spec 13](./13-better-auth-package-spec.md))
  - [x] Package scaffolding (`package.json`, `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`)
  - [x] `betterAuthTypeToValueType()` + unit tests
  - [x] `extractAuthTables()` using `getAuthTables()` from `better-auth/db` + tests
  - [x] `vexBetterAuth()` entry point + integration tests
  - [x] Build succeeds, test app compiles with `auth: vexBetterAuth({...})`

### Stage 2: Per-Field Value Types and Schema Generation (resume after Stage 1)

Each step below includes both the implementation and its tests together.

- [x] **Step 1** — `processFieldValueTypeOptions` (implementation + test)
  - [x] `valueTypes/processAdminOptions.ts` — `processFieldValueTypeOptions()` (implemented)
  - [ ] `valueTypes/processAdminOptions.test.ts` — required/default checks, type mismatches
- [x] **Step 2** — Per-field value type functions (implementations + tests)
  - [x] `fields/text/schemaValueType.ts` — `textToValueTypeString()` (implemented)
  - [ ] `fields/text/schemaValueType.test.ts` — text value type generation
  - [x] `fields/number/schemaValueType.ts` — `numberToValueTypeString()` (implemented)
  - [ ] `fields/number/schemaValueType.test.ts` — number value type generation
  - [x] `fields/checkbox/schemaValueType.ts` — `checkboxToValueTypeString()` (implemented)
  - [ ] `fields/checkbox/schemaValueType.test.ts` — checkbox value type generation
  - [x] `fields/select/schemaValueType.ts` — `selectToValueTypeString()` (implemented)
  - [ ] `fields/select/schemaValueType.test.ts` — select value type generation (single, multi, empty, dedupe, escape)
- [x] **Step 3** — `fieldToValueType` dispatcher (implementation + test)
  - [x] `valueTypes/extract.ts` — `fieldToValueType()` dispatcher (implemented)
  - [ ] `valueTypes/extract.test.ts` — dispatcher tests with required/optional wrapping
- [ ] **Step 4** — `collectIndexes` (implementation + test)
  - [x] `valueTypes/indexes.ts` — `collectIndexes()` (implemented)
  - [ ] `valueTypes/indexes.test.ts` — per-field indexes, collection-level indexes, dedup, collision, useAsTitle auto-index
- [ ] **Step 5** — `SlugRegistry` + `buildSlugRegistry` (stub + test + implementation)
  - [ ] `valueTypes/slugs.ts` — `SlugRegistry` class + `buildSlugRegistry()` stub
  - [ ] `valueTypes/slugs.test.ts` — slug registry, conflict detection, auth table overlap with collections
  - [ ] Implement `SlugRegistry.register()` + `buildSlugRegistry()`
- [ ] **Step 6** — `mergeAuthTableWithCollection` (stub + test + implementation)
  - [ ] `valueTypes/merge.ts` — `mergeAuthTableWithCollection()` stub
  - [ ] `valueTypes/merge.test.ts` — auth table merging with user collections
  - [ ] Implement `mergeAuthTableWithCollection()`
- [ ] **Step 7** — `generateVexSchema` (stub + test + implementation)
  - [ ] `valueTypes/generate.ts` — `generateVexSchema()` stub
  - [ ] `valueTypes/generate.test.ts` — full schema generation (header, imports, collections, auth tables, indexes, formatting)
  - [ ] Implement `generateVexSchema()`
- [ ] **Step 8** — Re-exports, full build, full test suite
  - [ ] `valueTypes/index.ts` — re-exports all valueType functions
  - [ ] Update `packages/core/src/index.ts` with valueType exports
  - [ ] Full build passes: `pnpm --filter @vexcms/core build`
  - [ ] All tests pass: `pnpm --filter @vexcms/core test`

---

## File Structure & Interfaces

**Phase A.1 — Core types and interfaces (Stage 1):**

- [x] Error types (`VexError`, `VexSlugConflictError`, `VexFieldValidationError`, `VexAuthConfigError`)
- [x] Auth types (`VexAuthAdapter`, `AuthTableDefinition`, `AuthFieldDefinition`, `AuthIndexDefinition`)
- [x] Field type modifications (`BaseFieldOptions`, `BaseFieldMeta.index`)
- [x] Collection type modifications (`IndexConfig`, `CollectionConfig.tableName`)
- [x] Config type modifications (`VexConfig.auth` required, `SchemaConfig`, `SchemaConfigInput`)
- [x] Re-exports from `packages/core/src/index.ts`

### Target directory structure

After this spec is implemented, `packages/core/src/` will look like:

```
packages/core/src/
├── index.ts                          # Main entry — re-exports everything
├── errors/
│   └── index.ts                      # VexError base + subclasses
├── config/
│   ├── defineCollection.ts           # existing (unchanged)
│   ├── defineConfig.ts               # MODIFIED — auth required, schema config, slug validation
│   └── defineGlobal.ts               # existing (unchanged)
├── fields/
│   ├── index.ts                      # re-exports all field builders
│   ├── constants.ts                  # TEXT_VALUETYPE, NUMBER_VALUETYPE, CHECKBOX_VALUETYPE
│   ├── text/
│   │   ├── index.ts                  # re-exports config
│   │   ├── config.ts                 # text() builder (moved from fields/text.ts)
│   │   ├── schemaValueType.ts        # textToValueTypeString()
│   │   └── schemaValueType.test.ts   # tests for text value type generation
│   ├── number/
│   │   ├── index.ts
│   │   ├── config.ts                 # number() builder (moved)
│   │   ├── schemaValueType.ts        # numberToValueTypeString()
│   │   └── schemaValueType.test.ts
│   ├── checkbox/
│   │   ├── index.ts
│   │   ├── config.ts                 # checkbox() builder (moved)
│   │   ├── schemaValueType.ts        # checkboxToValueTypeString()
│   │   └── schemaValueType.test.ts
│   └── select/
│       ├── index.ts
│       ├── config.ts                 # select() builder (moved)
│       ├── schemaValueType.ts        # selectToValueTypeString()
│       └── schemaValueType.test.ts
├── valueTypes/
│   ├── index.ts                      # re-exports generate, extract, merge, slugs, indexes
│   ├── processAdminOptions.ts        # processFieldValueTypeOptions() — validation + optional wrapping
│   ├── processAdminOptions.test.ts   # tests for processFieldValueTypeOptions
│   ├── extract.ts                    # fieldToValueType() dispatcher
│   ├── extract.test.ts               # tests for the dispatcher
│   ├── generate.ts                   # generateVexSchema(config) → string
│   ├── generate.test.ts              # tests for full schema generation
│   ├── indexes.ts                    # collectIndexes() — gathers per-field + collection-level indexes
│   ├── indexes.test.ts               # tests for index collection and dedup
│   ├── merge.ts                      # mergeAuthTableWithCollection()
│   ├── merge.test.ts                 # tests for field merge logic
│   ├── slugs.ts                      # SlugRegistry, buildSlugRegistry()
│   └── slugs.test.ts                 # tests for slug collision detection
└── types/
    ├── index.ts                      # MODIFIED — add auth, index to VexConfig/VexConfigInput/BaseFieldMeta
    ├── admin.ts                      # Admin UI configuration types
    ├── auth.ts                       # VexAuthAdapter, AuthTableDefinition, etc.
    ├── fields.ts                     # MODIFIED — add index to BaseFieldMeta and all FieldOptions
    ├── collections.ts                # MODIFIED — add indexes to CollectionConfig
    ├── globals.ts                    # existing (unchanged)
    └── schema.ts                     # SchemaConfig, SchemaConfigInput
```

### Separate package (out of scope for core, defined here for reference)

```
packages/better-auth/
├── src/
│   ├── index.ts                      # vexBetterAuth() factory + re-exports
│   ├── index.test.ts                 # integration tests
│   ├── types.ts                      # Re-exports core auth types
│   ├── valueTypes.ts                 # betterAuthTypeToValueType()
│   ├── valueTypes.test.ts            # unit tests for value type mapping
│   └── extract/
│       ├── tables.ts                 # extractAuthTables() — uses getAuthTables()
│       └── tables.test.ts            # tests for extractAuthTables()
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

---

### Modified Type Definitions — Indexes

The `index` property is added to `BaseFieldMeta` (so it's available on all field types) and to each field options interface. A new `IndexConfig` type and `indexes` property are added to `CollectionConfig`.

**Changes to `packages/core/src/types/fields.ts`**:

Add `index` to `BaseFieldMeta`:

````typescript
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
````

Add a new `BaseFieldOptions` interface that all field options extend (parallel to `BaseFieldMeta`). This DRYs up the shared properties (`label`, `description`, `required`, `index`, `admin`) instead of duplicating them in every field options type:

````typescript
/**
 * Base options shared by all field builders.
 * Each specific field options interface extends this.
 */
export interface BaseFieldOptions {
  /** Display label for the field. */
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

// All field options now extend BaseFieldOptions:

export interface TextFieldOptions extends BaseFieldOptions {
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
}

export interface NumberFieldOptions extends BaseFieldOptions {
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface CheckboxFieldOptions extends BaseFieldOptions {
  defaultValue?: boolean;
}

export interface SelectFieldOptions<T extends string> extends BaseFieldOptions {
  options: readonly SelectOption<T>[];
  defaultValue?: T;
  hasMany?: boolean;
}
````

**Changes to `packages/core/src/types/collections.ts`**:

Add `IndexConfig` and `indexes` to `CollectionConfig`:

````typescript
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
  TFields extends Record<string, VexField<any, any>> = Record<
    string,
    VexField<any, any>
  >,
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
  /**
   * Override the Convex table name for this collection.
   * By default, the collection's slug is used as the table name.
   * Use this when you want a different table name in the database
   * than the slug used in admin panel URLs.
   *
   * @example
   * ```ts
   * defineCollection("blog_posts", {
   *   tableName: "posts", // Convex table is "posts", admin URL uses "blog_posts"
   *   fields: { ... },
   * })
   * ```
   *
   * Default: the collection slug
   */
  tableName?: string;
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
   *
   */
  indexes?: IndexConfig<TFields>[];
}
````

---

### Auth Types

**File: `packages/core/src/types/auth.ts`** (implemented)

```typescript
// =============================================================================
// AUTH TABLE DEFINITIONS
// =============================================================================

/**
 * A field definition for auth infrastructure tables.
 * Uses validator strings since these tables are not user-configurable
 * through the Vex field system — they come from the auth provider.
 *
 * Optionality is encoded directly in the validator string itself
 * (e.g., `"v.optional(v.string())"` vs `"v.string()"`).
 */
export interface AuthFieldDefinition {
  /** Convex validator string, e.g. "v.string()", "v.optional(v.boolean())" */
  validator: string;
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
 * Defines an auth table (e.g., user, account, session, verification).
 * By default these tables are schema-only (not shown in the admin sidebar).
 * However, if a user defines a collection with a matching slug, the auth
 * table's fields are merged with the collection's fields, and the collection
 * appears in the admin UI as configured by the user.
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
// AUTH ADAPTER (returned by vexBetterAuth())
// =============================================================================

/**
 * The auth adapter object stored in `VexConfig.auth`.
 * Returned by `vexBetterAuth()`.
 *
 * This is the **fully resolved** output — all plugin contributions
 * (additional user fields, table extensions, extra tables) have already
 * been applied by `vexBetterAuth()` before this object is created.
 * Core never needs to know about auth sub-plugins.
 *
 * This is NOT an abstract interface for multiple providers.
 * It's the concrete shape that `vexBetterAuth()` returns.
 * If a second auth provider is needed later, generalize this type then.
 */
export interface VexAuthAdapter {
  /** Auth provider identifier (e.g., "better-auth") */
  readonly name: string;

  /**
   * All auth tables — including the user table, account, session,
   * verification, jwks, and any plugin-contributed tables.
   * Already includes all plugin contributions (additional fields,
   * table extensions, extra tables) resolved by `vexBetterAuth()`.
   *
   * During schema generation, core checks each auth table's slug
   * against user-defined collections. If a match is found, the auth
   * table's fields are merged with the collection's fields (auth
   * validators win for schema, user admin config wins for UI).
   * Auth tables with no matching collection are generated as-is.
   */
  tables: AuthTableDefinition[];
}
```

Auth types are re-exported from `packages/core/src/types/index.ts` alongside other types — no separate `auth/` directory needed.

---

### Custom Error Types

**File: `packages/core/src/errors/errors.ts`**

```typescript
/**
 * Base error class for all Vex CMS errors.
 * Provides consistent error formatting with a [vex] prefix.
 */
export class VexError extends Error {
  constructor(message: string) {
    super(`[vex] ${message}`);
    this.name = "VexError";
  }
}

/**
 * Thrown when a duplicate table slug is detected during schema generation.
 * Includes both registrations so the user can identify the conflict.
 */
export class VexSlugConflictError extends VexError {
  constructor(
    public readonly slug: string,
    public readonly existingSource: string,
    public readonly existingLocation: string,
    public readonly newSource: string,
    public readonly newLocation: string,
  ) {
    super(
      `Duplicate table slug "${slug}":\n` +
        `  - ${existingSource}: ${existingLocation}\n` +
        `  - ${newSource}: ${newLocation}\n` +
        `Rename one of these to resolve the conflict.`,
    );
    this.name = "VexSlugConflictError";
  }
}

/**
 * Thrown when a field fails validation during schema generation.
 * For example: required field with no defaultValue, or wrong defaultValue type.
 */
export class VexFieldValidationError extends VexError {
  constructor(
    public readonly collectionSlug: string,
    public readonly fieldName: string,
    public readonly detail: string,
  ) {
    super(`Field "${fieldName}" in collection "${collectionSlug}": ${detail}`);
    this.name = "VexFieldValidationError";
  }
}

/**
 * Thrown when auth configuration is invalid.
 * For example: auth table merge conflict or invalid auth table definition.
 */
export class VexAuthConfigError extends VexError {
  constructor(detail: string) {
    super(`Auth configuration error: ${detail}`);
    this.name = "VexAuthConfigError";
  }
}
```

**File: `packages/core/src/errors/index.ts`**

```typescript
export {
  VexError,
  VexSlugConflictError,
  VexFieldValidationError,
  VexAuthConfigError,
} from "./errors";
```

---

### Modified Config Types

**Changes to `packages/core/src/types/index.ts`** — auth is required, add schema config:

```typescript
// ADD this import at the top
import type { VexAuthAdapter } from "./auth";

/** Schema generation configuration. */
export interface SchemaConfig {
  /**
   * Output path for the generated schema file, relative to project root.
   *
   * Default: `"convex/vex.schema.ts"`
   */
  outputPath: string;
}

/** Schema generation configuration input (all fields optional). */
export interface SchemaConfigInput {
  /**
   * Output path for the generated schema file, relative to project root.
   * Can change the filename (e.g., `"convex/generated-schema.ts"`) or
   * the directory (e.g., `"src/convex/vex.schema.ts"`).
   *
   * Default: `"convex/vex.schema.ts"`
   */
  outputPath?: string;
}

// MODIFY VexConfig — add auth (required) and schema fields
export interface VexConfig {
  basePath: string;
  collections: VexCollection<any>[];
  globals: VexGlobal<any>[];
  admin: AdminConfig;
  /** Auth adapter — required. Use `vexBetterAuth(authConfig)` to create. */
  auth: VexAuthAdapter;
  /** Schema generation configuration. */
  schema: SchemaConfig;
}

// MODIFY VexConfigInput — auth is required, schema is optional
export interface VexConfigInput {
  basePath?: string;
  collections?: VexCollection<any>[];
  globals?: VexGlobal<any>[];
  admin?: AdminConfigInput;
  /**
   * Auth adapter — **required**. Pass `vexBetterAuth(authConfig)`.
   * Vex requires auth configuration to generate the schema.
   */
  auth: VexAuthAdapter;
  /** Schema generation configuration. */
  schema?: SchemaConfigInput;
}
```

Also re-export the new collection type:

```typescript
export type { IndexConfig } from "./collections";
```

---

> **PAUSE POINT:** Before continuing below, implement the `@vexcms/better-auth` package by following
> **[Spec 13 — Better Auth Package](./13-better-auth-package-spec.md)**.
> This gives you a working `vexBetterAuth()` function so the `auth` field in `vex.config.ts` compiles.
> Return here after spec 13 is complete.

---

**Phase A.2 — Per-field subfolder restructure (Stage 1):**

- [x] Move `text.ts` → `text/config.ts`, create `text/index.ts`, `text/schemaValueType.ts` stub
- [x] Move `number.ts` → `number/config.ts`, create `number/index.ts`, `number/schemaValueType.ts` stub
- [x] Move `checkbox.ts` → `checkbox/config.ts`, create `checkbox/index.ts`, `checkbox/schemaValueType.ts` stub
- [x] Move `select.ts` → `select/config.ts`, create `select/index.ts`, `select/schemaValueType.ts` stub
- [x] Create `fields/constants.ts` with value type constants (`TEXT_VALUETYPE`, `NUMBER_VALUETYPE`, `CHECKBOX_VALUETYPE`)
- [x] Update `fields/index.ts` to re-export from subfolders
- [x] Verify build passes

### Per-Field Value Type Functions

Each field subfolder gets a `schemaValueType.ts` that exports a function converting field metadata to a Convex value type string.

**File: `packages/core/src/fields/text/schemaValueType.ts`** (implemented)

```typescript
import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { TextFieldMeta } from "../../types";
import { TEXT_VALUETYPE } from "../constants";

/**
 * Converts text field metadata to a Convex value type string.
 *
 * @returns `"v.string()"` or `"v.optional(v.string())"`
 *
 * minLength/maxLength are runtime validation concerns, not schema constraints.
 */
export function textToValueTypeString(props: {
  meta: TextFieldMeta;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    meta: props.meta,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "string",
    valueType: TEXT_VALUETYPE,
  });
}
```

**File: `packages/core/src/fields/text/schemaValueType.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { textToValueTypeString } from "./schemaValueType";
import type { TextFieldMeta } from "../../types";

describe("textToValueTypeString", () => {
  it("returns v.string() for a required text field", () => {
    const meta: TextFieldMeta = {
      type: "text",
      required: true,
      defaultValue: "x",
    };
    expect(
      textToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "title",
      }),
    ).toBe("v.string()");
  });

  it("returns v.optional(v.string()) for an optional text field", () => {
    const meta: TextFieldMeta = { type: "text" };
    expect(
      textToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "subtitle",
      }),
    ).toBe("v.optional(v.string())");
  });

  it("returns v.optional(v.string()) regardless of minLength/maxLength", () => {
    const meta: TextFieldMeta = { type: "text", minLength: 1, maxLength: 200 };
    expect(
      textToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "excerpt",
      }),
    ).toBe("v.optional(v.string())");
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
    expect(
      textToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "title",
      }),
    ).toBe("v.string()");
  });

  it("throws when required with no defaultValue", () => {
    const meta: TextFieldMeta = { type: "text", required: true };
    expect(() =>
      textToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "title",
      }),
    ).toThrow("title");
  });

  it("throws when defaultValue is wrong type", () => {
    const meta: TextFieldMeta = {
      type: "text",
      required: true,
      defaultValue: 42 as any,
    };
    expect(() =>
      textToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "title",
      }),
    ).toThrow("title");
  });
});
```

**File: `packages/core/src/fields/number/schemaValueType.ts`** (implemented)

```typescript
import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { NumberFieldMeta } from "../../types";
import { NUMBER_VALUETYPE } from "../constants";

/**
 * Converts number field metadata to a Convex value type string.
 *
 * @returns `"v.number()"` or `"v.optional(v.number())"`
 *
 * min/max/step are runtime validation concerns, not schema constraints.
 * Convex has no integer validator — always v.number().
 */
export function numberToValueTypeString(props: {
  meta: NumberFieldMeta;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    meta: props.meta,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "number",
    valueType: NUMBER_VALUETYPE,
  });
}
```

**File: `packages/core/src/fields/number/schemaValueType.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { numberToValueTypeString } from "./schemaValueType";
import type { NumberFieldMeta } from "../../types";

describe("numberToValueTypeString", () => {
  it("returns v.number() for a required number field", () => {
    const meta: NumberFieldMeta = {
      type: "number",
      required: true,
      defaultValue: 0,
    };
    expect(
      numberToValueTypeString({
        meta,
        collectionSlug: "items",
        fieldName: "count",
      }),
    ).toBe("v.number()");
  });

  it("returns v.optional(v.number()) for an optional number field", () => {
    const meta: NumberFieldMeta = { type: "number" };
    expect(
      numberToValueTypeString({
        meta,
        collectionSlug: "items",
        fieldName: "count",
      }),
    ).toBe("v.optional(v.number())");
  });

  it("returns v.optional(v.number()) regardless of min/max/step", () => {
    const meta: NumberFieldMeta = {
      type: "number",
      min: 0,
      max: 100,
      step: 0.01,
    };
    expect(
      numberToValueTypeString({
        meta,
        collectionSlug: "items",
        fieldName: "price",
      }),
    ).toBe("v.optional(v.number())");
  });

  it("throws when required with no defaultValue", () => {
    const meta: NumberFieldMeta = { type: "number", required: true };
    expect(() =>
      numberToValueTypeString({
        meta,
        collectionSlug: "items",
        fieldName: "count",
      }),
    ).toThrow("count");
  });

  it("throws when defaultValue is wrong type", () => {
    const meta: NumberFieldMeta = {
      type: "number",
      required: true,
      defaultValue: "ten" as any,
    };
    expect(() =>
      numberToValueTypeString({
        meta,
        collectionSlug: "items",
        fieldName: "count",
      }),
    ).toThrow("count");
  });
});
```

**File: `packages/core/src/fields/checkbox/schemaValueType.ts`** (implemented)

```typescript
import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { CheckboxFieldMeta } from "../../types";
import { CHECKBOX_VALUETYPE } from "../constants";

/**
 * Converts checkbox field metadata to a Convex value type string.
 *
 * @returns `"v.boolean()"` or `"v.optional(v.boolean())"`
 */
export function checkboxToValueTypeString(props: {
  meta: CheckboxFieldMeta;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    meta: props.meta,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "boolean",
    valueType: CHECKBOX_VALUETYPE,
  });
}
```

**File: `packages/core/src/fields/checkbox/schemaValueType.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { checkboxToValueTypeString } from "./schemaValueType";
import type { CheckboxFieldMeta } from "../../types";

describe("checkboxToValueTypeString", () => {
  it("returns v.optional(v.boolean()) for an optional checkbox", () => {
    const meta: CheckboxFieldMeta = { type: "checkbox" };
    expect(
      checkboxToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "featured",
      }),
    ).toBe("v.optional(v.boolean())");
  });

  it("returns v.boolean() for a required checkbox with defaultValue", () => {
    const meta: CheckboxFieldMeta = {
      type: "checkbox",
      required: true,
      defaultValue: true,
    };
    expect(
      checkboxToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "featured",
      }),
    ).toBe("v.boolean()");
  });

  it("throws when required with no defaultValue", () => {
    const meta: CheckboxFieldMeta = { type: "checkbox", required: true };
    expect(() =>
      checkboxToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "featured",
      }),
    ).toThrow("featured");
  });

  it("throws when defaultValue is wrong type", () => {
    const meta: CheckboxFieldMeta = {
      type: "checkbox",
      required: true,
      defaultValue: "yes" as any,
    };
    expect(() =>
      checkboxToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "featured",
      }),
    ).toThrow("featured");
  });
});
```

**File: `packages/core/src/fields/select/schemaValueType.ts`** (implemented)

```typescript
import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { SelectFieldMeta } from "../../types";

/**
 * Converts select field metadata to a Convex value type string.
 *
 * @returns One of (each may be wrapped in v.optional()):
 * - Single select: `'v.union(v.literal("draft"),v.literal("published"))'`
 * - Multi select (hasMany): `'v.array(v.literal("draft"),v.literal("published"))'`
 *
 * Edge cases:
 * - Single option: `v.union(v.literal("only"))` — Convex accepts single-arg union
 * - Empty options array: should throw
 * - Duplicate option values: deduplicate before generating literals
 * - Options with special characters in values: escape quotes
 */
export function selectToValueTypeString(props: {
  meta: SelectFieldMeta<string>;
  collectionSlug: string;
  fieldName: string;
}): string {
  const literals = meta.options.map((o) => `v.literal("${o.value}")`).join(",");
  if (meta.hasMany) {
    return processFieldValueTypeOptions({
      collectionSlug,
      fieldName,
      meta,
      expectedType: "object",
      valueType: `v.array(${literals})`,
    });
  }
  return processFieldValueTypeOptions({
    collectionSlug,
    fieldName,
    meta,
    expectedType: "string",
    valueType: `v.union(${literals})`,
  });
}
```

**File: `packages/core/src/fields/select/schemaValueType.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { selectToValueTypeString } from "./schemaValueType";
import type { SelectFieldMeta } from "../../types";

describe("selectToValueTypeString", () => {
  it("returns optional union of literals for single-select", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
      ],
    };
    expect(
      selectToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "status",
      }),
    ).toBe('v.optional(v.union(v.literal("draft"),v.literal("published")))');
  });

  it("returns required union when required with defaultValue", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
      ],
    };
    expect(
      selectToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "status",
      }),
    ).toBe('v.union(v.literal("draft"),v.literal("published"))');
  });

  it("wraps in v.array() for multi-select (hasMany) — no v.union() wrapper", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      hasMany: true,
      options: [
        { value: "tag1", label: "Tag 1" },
        { value: "tag2", label: "Tag 2" },
      ],
    };
    // hasMany wraps literals directly in v.array(), no v.union()
    expect(
      selectToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "tags",
      }),
    ).toBe('v.optional(v.array(v.literal("tag1"),v.literal("tag2")))');
  });

  it("handles single option", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      options: [{ value: "only", label: "Only Option" }],
    };
    expect(
      selectToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "status",
      }),
    ).toBe('v.optional(v.union(v.literal("only")))');
  });

  // TODO: Implementation does not yet validate empty options — add when implemented
  it.todo("throws on empty options");

  // TODO: Implementation does not yet deduplicate — add when implemented
  it.todo("deduplicates option values");

  // TODO: Implementation does not yet escape quotes — add when implemented
  it.todo("escapes quotes in option values");

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
    expect(
      selectToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "status",
      }),
    ).toBe('v.optional(v.union(v.literal("a"),v.literal("b")))');
  });

  it("throws when required with no defaultValue", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      required: true,
      options: [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
    };
    expect(() =>
      selectToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "status",
      }),
    ).toThrow("status");
  });

  // TODO: Implementation does not yet validate defaultValue against options — add when implemented
  it.todo("throws when defaultValue is not in options");
});
```

---

### Per-Field Index Files

Each field subfolder re-exports the config builder, schema function, and admin component.

**File: `packages/core/src/fields/text/index.ts`**

```typescript
export { text } from "./config";
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

---

**File: `packages/core/src/fields/constants.ts`** (implemented)

```typescript
export const TEXT_VALUETYPE = "v.string()" as const;
export const NUMBER_VALUETYPE = "v.number()" as const;
export const CHECKBOX_VALUETYPE = "v.boolean()" as const;
```

**Updated `packages/core/src/fields/index.ts`** (implemented)

```typescript
export { text } from "./text";
export { number } from "./number";
export { checkbox } from "./checkbox";
export { select } from "./select";
```

---

**Phase A.3 — Schema generation stubs (Stage 2):**

- [ ] `valueTypes/indexes.ts` — `collectIndexes()` stub
- [ ] `valueTypes/slugs.ts` — `SlugRegistry` class + `buildSlugRegistry()` stub
- [ ] `valueTypes/merge.ts` — `mergeAuthTableWithCollection()` stub
- [ ] `valueTypes/generate.ts` — `generateVexSchema()` stub
- [ ] `valueTypes/index.ts` — re-exports all schema functions
- [ ] Update `packages/core/src/index.ts` with schema exports
- [ ] Build passes (stubs throw "Not implemented")

### Schema Functions

**File: `packages/core/src/valueTypes/processAdminOptions.ts`** (implemented)

Combines validation + optional wrapping into a single function. Takes a `props` object with `meta`, `collectionSlug`, `fieldName`, `expectedType`, and `valueType`. Returns the final value type string directly (no intermediate `FieldValidationResult`).

```typescript
import type { BaseFieldMeta } from "../types";
import { VexFieldValidationError } from "../errors";

/**
 * Validates a field's configuration and returns the final value type string,
 * wrapped in v.optional() if the field is not required.
 *
 * Combines validation and optional wrapping into a single call.
 * Each per-field value type function delegates to this.
 *
 * @returns The value type string, optionally wrapped (e.g., `"v.string()"` or `"v.optional(v.string())"`)
 *
 * Edge cases:
 * - required=true, no defaultValue: throw VexFieldValidationError
 * - required=true, defaultValue wrong type: throw VexFieldValidationError
 * - required=false or undefined: wrap in v.optional()
 */
export function processFieldValueTypeOptions(props: {
  meta: BaseFieldMeta & { defaultValue?: unknown };
  collectionSlug: string;
  fieldName: string;
  expectedType: string;
  valueType: string;
}): string {
  if (!props.meta.required) {
    return `v.optional(${props.valueType})`;
  } else {
    if (!props.meta.defaultValue) {
      throw new VexFieldValidationError(
        props.collectionSlug,
        props.fieldName,
        "No default Value Provided",
      );
    }
    if (!(typeof props.meta.defaultValue === props.expectedType)) {
      throw new VexFieldValidationError(
        props.collectionSlug,
        props.fieldName,
        `Invalid defaultValue Provided. Expected: ${props.expectedType}, Received: ${typeof props.meta.defaultValue}`,
      );
    }
    return props.valueType;
  }
}
```

**File: `packages/core/src/valueTypes/processAdminOptions.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { processFieldValueTypeOptions } from "./processAdminOptions";
import { VexFieldValidationError } from "../errors";

describe("processFieldValueTypeOptions", () => {
  describe("optional fields", () => {
    it("wraps in v.optional() when required is undefined", () => {
      const result = processFieldValueTypeOptions({
        meta: { type: "text" },
        collectionSlug: "posts",
        fieldName: "title",
        expectedType: "string",
        valueType: "v.string()",
      });
      expect(result).toBe("v.optional(v.string())");
    });

    it("wraps in v.optional() when required is false", () => {
      const result = processFieldValueTypeOptions({
        meta: { type: "text", required: false },
        collectionSlug: "posts",
        fieldName: "title",
        expectedType: "string",
        valueType: "v.string()",
      });
      expect(result).toBe("v.optional(v.string())");
    });
  });

  describe("required fields", () => {
    it("returns valueType directly when required with valid defaultValue", () => {
      const result = processFieldValueTypeOptions({
        meta: { type: "text", required: true, defaultValue: "hello" },
        collectionSlug: "posts",
        fieldName: "title",
        expectedType: "string",
        valueType: "v.string()",
      });
      expect(result).toBe("v.string()");
    });

    it("throws VexFieldValidationError when required with no defaultValue", () => {
      expect(() =>
        processFieldValueTypeOptions({
          meta: { type: "text", required: true },
          collectionSlug: "posts",
          fieldName: "title",
          expectedType: "string",
          valueType: "v.string()",
        }),
      ).toThrow(VexFieldValidationError);
    });

    it("error message includes collection slug and field name", () => {
      try {
        processFieldValueTypeOptions({
          meta: { type: "text", required: true },
          collectionSlug: "posts",
          fieldName: "title",
          expectedType: "string",
          valueType: "v.string()",
        });
        expect.unreachable("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(VexFieldValidationError);
        const err = e as VexFieldValidationError;
        expect(err.collectionSlug).toBe("posts");
        expect(err.fieldName).toBe("title");
        expect(err.message).toContain("title");
        expect(err.message).toContain("posts");
      }
    });
  });

  describe("defaultValue type checking", () => {
    it("accepts string defaultValue for string expectedType", () => {
      expect(() =>
        processFieldValueTypeOptions({
          meta: { type: "text", required: true, defaultValue: "hello" },
          collectionSlug: "posts",
          fieldName: "title",
          expectedType: "string",
          valueType: "v.string()",
        }),
      ).not.toThrow();
    });

    it("throws when defaultValue is number but expectedType is string", () => {
      expect(() =>
        processFieldValueTypeOptions({
          meta: { type: "text", required: true, defaultValue: 42 },
          collectionSlug: "posts",
          fieldName: "title",
          expectedType: "string",
          valueType: "v.string()",
        }),
      ).toThrow(VexFieldValidationError);
    });

    it("accepts number defaultValue for number expectedType", () => {
      expect(() =>
        processFieldValueTypeOptions({
          meta: { type: "number", required: true, defaultValue: 0 },
          collectionSlug: "items",
          fieldName: "count",
          expectedType: "number",
          valueType: "v.number()",
        }),
      ).not.toThrow();
    });

    it("accepts boolean defaultValue for boolean expectedType", () => {
      expect(() =>
        processFieldValueTypeOptions({
          meta: { type: "checkbox", required: true, defaultValue: false },
          collectionSlug: "posts",
          fieldName: "featured",
          expectedType: "boolean",
          valueType: "v.boolean()",
        }),
      ).not.toThrow();
    });
  });
});
```

**File: `packages/core/src/valueTypes/extract.ts`** (implemented)

```typescript
import { VexFieldValidationError } from "../errors";
import { checkboxToValueTypeString } from "../fields/checkbox";
import { numberToValueTypeString } from "../fields/number";
import { selectToValueTypeString } from "../fields/select";
import { textToValueTypeString } from "../fields/text";
import type { VexField } from "../types";

/**
 * Converts a VexField to its Convex value type string representation.
 * Dispatches to the appropriate per-field function based on `_meta.type`.
 *
 * Each per-field function handles its own validation (via processFieldValueTypeOptions())
 * and its own v.optional() wrapping. This dispatcher just routes by type.
 *
 * Edge cases:
 * - Unknown field type: throw with descriptive error including the type string
 * - index property on _meta: ignored here — handled by collectIndexes()
 */
export function fieldToValueType(props: {
  field: VexField<any, any>;
  collectionSlug: string;
  fieldName: string;
}): string {
  switch (props.field._meta.type) {
    case "text":
      return textToValueTypeString({
        meta: props.field._meta,
        collectionSlug: props.collectionSlug,
        fieldName: props.fieldName,
      });
    case "number":
      return numberToValueTypeString({
        meta: props.field._meta,
        collectionSlug: props.collectionSlug,
        fieldName: props.fieldName,
      });
    case "checkbox":
      return checkboxToValueTypeString({
        meta: props.field._meta,
        collectionSlug: props.collectionSlug,
        fieldName: props.fieldName,
      });
    case "select":
      return selectToValueTypeString({
        meta: props.field._meta,
        collectionSlug: props.collectionSlug,
        fieldName: props.fieldName,
      });
    default:
      throw new VexFieldValidationError(
        props.collectionSlug,
        props.fieldName,
        `Unknown Field Type: ${props.field._meta.type}`,
      );
  }
}
```

**File: `packages/core/src/valueTypes/extract.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { fieldToValueType } from "./extract";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { checkbox } from "../fields/checkbox";
import { select } from "../fields/select";

describe("fieldToValueType", () => {
  describe("required fields (no v.optional wrapper)", () => {
    it("text field with required: true and defaultValue", () => {
      const field = text({ required: true, defaultValue: "Untitled" });
      expect(
        fieldToValueType({
          field,
          collectionSlug: "posts",
          fieldName: "title",
        }),
      ).toBe("v.string()");
    });

    it("number field with required: true and defaultValue", () => {
      const field = number({ required: true, defaultValue: 0 });
      expect(
        fieldToValueType({
          field,
          collectionSlug: "items",
          fieldName: "count",
        }),
      ).toBe("v.number()");
    });

    it("select field with required: true and defaultValue", () => {
      const field = select({
        required: true,
        defaultValue: "a",
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ],
      });
      expect(
        fieldToValueType({
          field,
          collectionSlug: "posts",
          fieldName: "status",
        }),
      ).toBe('v.union(v.literal("a"),v.literal("b"))');
    });
  });

  describe("optional fields (wrapped in v.optional)", () => {
    it("text field with no required option", () => {
      const field = text();
      expect(
        fieldToValueType({
          field,
          collectionSlug: "posts",
          fieldName: "subtitle",
        }),
      ).toBe("v.optional(v.string())");
    });

    it("text field with required: false", () => {
      const field = text({ required: false });
      expect(
        fieldToValueType({
          field,
          collectionSlug: "posts",
          fieldName: "subtitle",
        }),
      ).toBe("v.optional(v.string())");
    });

    it("number field without required", () => {
      const field = number({ min: 0 });
      expect(
        fieldToValueType({
          field,
          collectionSlug: "items",
          fieldName: "price",
        }),
      ).toBe("v.optional(v.number())");
    });

    it("checkbox field without required", () => {
      const field = checkbox();
      expect(
        fieldToValueType({
          field,
          collectionSlug: "posts",
          fieldName: "featured",
        }),
      ).toBe("v.optional(v.boolean())");
    });

    it("select field without required", () => {
      const field = select({
        options: [{ value: "x", label: "X" }],
      });
      expect(
        fieldToValueType({
          field,
          collectionSlug: "posts",
          fieldName: "status",
        }),
      ).toBe('v.optional(v.union(v.literal("x")))');
    });

    it("multi-select field without required", () => {
      const field = select({
        hasMany: true,
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ],
      });
      expect(
        fieldToValueType({ field, collectionSlug: "posts", fieldName: "tags" }),
      ).toBe('v.optional(v.array(v.literal("a"),v.literal("b")))');
    });
  });

  describe("index property does not affect validator", () => {
    it("text field with index still returns same validator", () => {
      const field = text({
        required: true,
        defaultValue: "x",
        index: "by_title",
      });
      expect(
        fieldToValueType({
          field,
          collectionSlug: "posts",
          fieldName: "title",
        }),
      ).toBe("v.string()");
    });
  });

  describe("error cases", () => {
    it("throws on unknown field type", () => {
      const field = {
        _type: "",
        _meta: { type: "unknown_type" },
      } as any;
      expect(() =>
        fieldToValueType({
          field,
          collectionSlug: "posts",
          fieldName: "mystery",
        }),
      ).toThrow("unknown_type");
    });
  });
});
```

**File: `packages/core/src/valueTypes/indexes.ts`** (implemented)

```typescript
import { VexFieldValidationError } from "../errors";
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
 * Collects all indexes for a collection from three sources:
 * 1. Per-field `index` property on individual fields
 * 2. Collection-level `indexes` array on the collection config
 * 3. Auto-generated index for `admin.useAsTitle` field (for fast admin panel title queries)
 *
 * Goal: Walk all fields in the collection, extract any `index` property from
 * field metadata, convert to ResolvedIndex format, then merge with
 * collection-level indexes. If `admin.useAsTitle` is set and the referenced
 * field doesn't already have an index (per-field or collection-level),
 * auto-create one named `"by_<fieldName>"`. Deduplicate by index name — if a
 * per-field index and a collection-level index have the same name, the
 * collection-level definition wins (it's more explicit).
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
 * - admin.useAsTitle field already has an explicit index: don't duplicate, use the existing one
 * - admin.useAsTitle field has no index: auto-create { name: "by_<fieldName>", fields: ["<fieldName>"] }
 * - admin.useAsTitle is undefined: no auto-index generated
 */
export function collectIndexes(props: {
  collection: VexCollection;
}): ResolvedIndex[] {
  const fieldIndexes = new Map<string, ResolvedIndex>();

  for (const [fieldKey, field] of Object.entries(
    props.collection.config.fields,
  )) {
    const indexName = field._meta.index;
    if (indexName) {
      if (fieldIndexes.has(indexName)) {
        throw new VexFieldValidationError(
          props.collection.slug,
          fieldKey,
          `Duplicate Indexes detected: ${indexName}`,
        );
      }
      fieldIndexes.set(indexName, { name: indexName, fields: [fieldKey] });
    }
  }

  props.collection.config.indexes?.forEach((index) => {
    if (fieldIndexes.has(index.name)) return;
    fieldIndexes.set(index.name, { name: index.name, fields: index.fields });
  });

  const useAsTitle = props.collection.config.admin?.useAsTitle;
  if (useAsTitle) {
    const autoName = `by_${useAsTitle}`;
    if (!fieldIndexes.has(autoName)) {
      fieldIndexes.set(autoName, { name: autoName, fields: [useAsTitle] });
    }
  }

  return Array.from(fieldIndexes.values());
}
```

**File: `packages/core/src/valueTypes/indexes.test.ts`**

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
    expect(indexes).toEqual([{ name: "by_slug", fields: ["slug"] }]);
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
      indexes: [{ name: "by_author_date", fields: ["author", "createdAt"] }],
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
      indexes: [{ name: "by_author_date", fields: ["author", "createdAt"] }],
    });
    const indexes = collectIndexes(posts);
    expect(indexes).toHaveLength(2);
    expect(indexes).toContainEqual({ name: "by_slug", fields: ["slug"] });
    expect(indexes).toContainEqual({
      name: "by_author_date",
      fields: ["author", "createdAt"],
    });
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
    expect(indexes).toEqual([{ name: "by_status", fields: ["status"] }]);
  });

  describe("auto-index for admin.useAsTitle", () => {
    it("auto-creates index for useAsTitle field when no index exists", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          body: text(),
        },
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectIndexes(posts);
      expect(indexes).toEqual([{ name: "by_title", fields: ["title"] }]);
    });

    it("does not duplicate when useAsTitle field already has a per-field index", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true, index: "by_title" }),
          body: text(),
        },
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectIndexes(posts);
      expect(indexes).toHaveLength(1);
      expect(indexes[0]).toEqual({ name: "by_title", fields: ["title"] });
    });

    it("does not duplicate when useAsTitle field is covered by a collection-level index", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          body: text(),
        },
        indexes: [{ name: "by_title", fields: ["title"] }],
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectIndexes(posts);
      expect(indexes).toHaveLength(1);
    });

    it("does not create auto-index when useAsTitle is not set", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
        },
      });
      expect(collectIndexes(posts)).toEqual([]);
    });

    it("coexists with other indexes", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          slug: text({ required: true, index: "by_slug" }),
        },
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectIndexes(posts);
      expect(indexes).toHaveLength(2);
      expect(indexes).toContainEqual({ name: "by_slug", fields: ["slug"] });
      expect(indexes).toContainEqual({ name: "by_title", fields: ["title"] });
    });

    it("skips auto-index if auto-generated name collides with existing index", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          slug: text({ required: true }),
        },
        // Explicit index named "by_title" that indexes slug, not title
        indexes: [{ name: "by_title", fields: ["slug"] }],
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectIndexes(posts);
      // The explicit "by_title" wins — no auto-index added
      expect(indexes).toHaveLength(1);
      expect(indexes[0]).toEqual({ name: "by_title", fields: ["slug"] });
    });
  });
});
```

**File: `packages/core/src/valueTypes/merge.ts`**

```typescript
import type { VexField, BaseFieldMeta } from "../types";
import type { AuthTableDefinition, AuthFieldDefinition } from "../types";
import type { VexCollection } from "../types";

/**
 * Result of merging auth table fields with a user collection.
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
   * Fields that exist in both auth table and user config.
   * The auth validator wins for schema gen; user admin config wins for UI.
   */
  overlapping: string[];

  /**
   * Fields that only exist in the auth table (not in user's collection).
   */
  authOnly: string[];

  /**
   * Fields that only exist in the user's collection (not from auth).
   */
  userOnly: string[];
}

/**
 * Merges an auth table's fields with a user-defined collection's fields.
 *
 * This works for ANY auth table that has a matching user-defined collection
 * (matched by slug). The auth table's fields are already fully resolved
 * (all plugin contributions applied by vexBetterAuth() before this is called).
 *
 * Goal: Combine the auth table's fields (which define the database schema)
 * with the user's collection fields (which define admin UI behavior).
 * For schema generation, auth validators take precedence on overlapping fields.
 * For admin UI, the user's field metadata takes precedence.
 *
 * @param authTable - The auth table definition with fully resolved fields
 * @param collection - The user's collection that matches this auth table by slug
 * @returns Merged fields result with source tracking
 *
 * Edge cases:
 * - Auth field conflicts with user field: auth validator wins (it controls the DB shape)
 * - User defines field auth doesn't know about (e.g., "postCount"): added as user-only
 */
export function mergeAuthTableWithCollection(props: {
  authTable: AuthTableDefinition;
  collection: VexCollection<any>;
}): MergedFieldsResult {
  // TODO: implement
  //
  // 1. Access authTable via props.authTable, collection via props.collection
  //
  // 2. Initialize result containers:
  //    - fields: Record<string, string> = {}
  //    - overlapping: string[] = []
  //    - authOnly: string[] = []
  //    - userOnly: string[] = []
  //
  // 2. Get auth field names: Object.keys(authTable.fields)
  //    Get user field names: Object.keys(collection.config.fields)
  //
  // 3. For each auth field name:
  //    a. If user also defines this field name → push to overlapping
  //       → Use auth table's validator string (auth wins for schema)
  //       → fields[fieldName] = authTable.fields[fieldName].validator
  //    b. If user does NOT define this field → push to authOnly
  //       → fields[fieldName] = authTable.fields[fieldName].validator
  //
  // 4. For each user field name:
  //    a. If auth table does NOT define this field → push to userOnly
  //       → Convert via fieldToValueType({ field, collectionSlug: collection.slug, fieldName })
  //       → fields[fieldName] = converted validator string
  //    (If auth also defines it, it was already handled in step 3)
  //
  // 5. Return { fields, overlapping, authOnly, userOnly }
  throw new Error("Not implemented");
}
```

**File: `packages/core/src/valueTypes/merge.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { mergeAuthTableWithCollection } from "./merge";
import { defineCollection } from "../config/defineCollection";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { select } from "../fields/select";
import type { AuthTableDefinition } from "../types";

describe("mergeAuthTableWithCollection", () => {
  const users = defineCollection("users", {
    fields: {
      name: text({ label: "Name" }),
      email: text({ label: "Email" }),
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

  it("merges auth table fields with user collection fields", () => {
    const authTable: AuthTableDefinition = {
      slug: "users",
      fields: {
        name: { validator: "v.string()" },
        email: { validator: "v.string()" },
        emailVerified: { validator: "v.boolean()" },
        createdAt: { validator: "v.number()" },
        updatedAt: { validator: "v.number()" },
      },
    };

    const result = mergeAuthTableWithCollection(authTable, users);

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
    const authTable: AuthTableDefinition = {
      slug: "users",
      fields: {
        email: { validator: "v.string()" },
      },
    };

    const result = mergeAuthTableWithCollection(authTable, users);

    // The auth validator should win for schema generation
    expect(result.fields["email"]).toBe("v.string()");
  });

  it("user-only fields converted via fieldToValueType", () => {
    const authTable: AuthTableDefinition = {
      slug: "users",
      fields: {
        email: { validator: "v.string()" },
      },
    };

    const result = mergeAuthTableWithCollection(authTable, users);

    // postCount is user-only, number field without required → optional
    expect(result.fields["postCount"]).toBe("v.optional(v.number())");
    // role is user-only, select field without required → optional union
    expect(result.fields["role"]).toContain("v.optional(");
  });

  it("handles auth table with no fields", () => {
    const authTable: AuthTableDefinition = {
      slug: "users",
      fields: {},
    };

    const result = mergeAuthTableWithCollection(authTable, users);

    // All fields are user-only
    expect(result.userOnly).toContain("name");
    expect(result.userOnly).toContain("email");
    expect(result.userOnly).toContain("postCount");
    expect(result.userOnly).toContain("role");
    expect(result.authOnly).toEqual([]);
    expect(result.overlapping).toEqual([]);
  });

  it("handles fully auth-driven collection (no user-defined fields overlap)", () => {
    const minimalUsers = defineCollection("users", {
      fields: {
        postCount: number({ admin: { readOnly: true } }),
      },
    });

    const authTable: AuthTableDefinition = {
      slug: "users",
      fields: {
        name: { validator: "v.string()" },
        email: { validator: "v.string()" },
        createdAt: { validator: "v.number()" },
      },
    };

    const result = mergeAuthTableWithCollection(authTable, minimalUsers);

    expect(result.authOnly).toContain("name");
    expect(result.authOnly).toContain("email");
    expect(result.authOnly).toContain("createdAt");
    expect(result.userOnly).toContain("postCount");
    expect(result.overlapping).toEqual([]);
  });
});
```

**File: `packages/core/src/valueTypes/slugs.ts`**

```typescript
import { VexSlugConflictError, VexAuthConfigError } from "../errors";

// =============================================================================
// SLUG REGISTRY — tracks table slugs and validates uniqueness on register
// =============================================================================

/**
 * Where a slug was registered from.
 */
export type SlugSource =
  | "user-collection"
  | "user-global"
  | "auth-table"
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
 * Registry that collects all table slugs and validates uniqueness.
 * Throws immediately on duplicate — fail fast during schema generation.
 */
export class SlugRegistry {
  private registrations = new Map<string, SlugRegistration>();

  /**
   * Register a slug with its source.
   * Throws VexSlugConflictError immediately if the slug is already registered,
   * UNLESS an auth table slug overlaps with a user collection slug — this is
   * expected behavior indicating the user wants to customize that auth table's
   * admin UI. In that case, the user collection's registration takes precedence
   * (it was registered first as "user-collection") and the auth table is
   * silently skipped in the registry. The merge happens during schema generation.
   *
   * @param props.slug - The table slug to register
   * @param props.source - Where this slug comes from (e.g., "user-collection", "auth-table")
   * @param props.location - Human-readable location for error messages (e.g., `collection "posts"`)
   *
   * Edge cases:
   * - Auth table slug matches user collection slug: NOT a conflict — skip
   *   registration (user collection already registered, merge happens later)
   * - System table prefixed with "vex_" should not conflict with user tables
   *   because defineCollection already warns about "vex_" prefix
   */
  register(props: {
    slug: string;
    source: SlugSource;
    location: string;
  }): void {
    const existing = this.registrations.get(props.slug);
    if (existing) {
      // Auth table overlapping with user collection is expected — it means
      // the user wants to customize that auth table. The user collection
      // registration takes precedence; merge happens during schema generation.
      if (
        (existing.source === "user-collection" &&
          props.source === "auth-table") ||
        (existing.source === "auth-table" && props.source === "user-collection")
      ) {
        // Keep the user-collection registration, skip the auth-table one
        if (props.source === "user-collection") {
          this.registrations.set(props.slug, {
            slug: props.slug,
            source: props.source,
            location: props.location,
          });
        }
        return;
      }
      throw new VexSlugConflictError(
        props.slug,
        existing.source,
        existing.location,
        props.source,
        props.location,
      );
    }
    this.registrations.set(props.slug, {
      slug: props.slug,
      source: props.source,
      location: props.location,
    });
  }

  /**
   * Get all registered slugs.
   */
  getAll(): SlugRegistration[] {
    return [...this.registrations.values()];
  }
}

/**
 * Populate a SlugRegistry from a VexConfig.
 *
 * Registers slugs from:
 * 1. User collections (source: "user-collection")
 * 2. User globals (source: "user-global")
 * 3. Auth tables (source: "auth-table") — including the user table
 * 4. System tables like vex_globals (source: "system")
 *
 * Each register() call throws immediately on duplicate slug, except
 * when an auth table slug matches a user collection slug — this is
 * expected behavior indicating the user wants to customize that auth
 * table's admin UI. The merge happens during schema generation.
 *
 * Edge cases:
 * - No globals: skip global registration
 * - Auth table slug matches user collection slug: NOT a conflict —
 *   the user collection registration takes precedence, merge happens later
 */
export function buildSlugRegistry(props: {
  config: import("../types").VexConfig;
}): SlugRegistry {
  // TODO: implement
  //
  // 1. Access config via props.config
  //
  // 2. Create registry = new SlugRegistry()
  //
  // 3. Register user collections:
  //    for each collection in config.collections:
  //      slug = collection.config.tableName ?? collection.slug
  //      registry.register({ slug, source: "user-collection", location: `collection "${collection.slug}"` })
  //      → throws VexSlugConflictError if duplicate among collections/globals
  //
  // 3. Register user globals (if config.globals exists):
  //    for each global in config.globals:
  //      registry.register({ slug: global.slug, source: "user-global", location: `global "${global.slug}"` })
  //      → throws VexSlugConflictError if duplicate with collections or other globals
  //
  // 4. Register auth tables:
  //    for each table in config.auth.tables:
  //      registry.register({ slug: table.slug, source: "auth-table", location: `auth table "${table.slug}"` })
  //      → if table.slug matches a user collection → NOT a conflict (skip, merge later)
  //      → if table.slug matches anything else → throws VexSlugConflictError
  //
  // 5. Register system tables:
  //    if config.globals?.length > 0:
  //      registry.register({ slug: "vex_globals", source: "system", location: "Vex system table" })
  //
  // 6. Return registry
  throw new Error("Not implemented");
}
```

**File: `packages/core/src/valueTypes/slugs.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { SlugRegistry, buildSlugRegistry } from "./slugs";
import { defineCollection } from "../config/defineCollection";
import { defineConfig } from "../config/defineConfig";
import { text } from "../fields/text";
import type { VexAuthAdapter } from "./auth";
import { VexSlugConflictError } from "../errors";

// Minimal auth adapter for tests that don't focus on auth
const minimalAuth: VexAuthAdapter = {
  name: "better-auth",
  tables: [],
};

describe("SlugRegistry", () => {
  it("registers unique slugs without throwing", () => {
    const registry = new SlugRegistry();
    registry.register({
      slug: "posts",
      source: "user-collection",
      location: "collections/posts.ts",
    });
    registry.register({
      slug: "users",
      source: "user-collection",
      location: "collections/users.ts",
    });
    registry.register({
      slug: "account",
      source: "auth-table",
      location: "@vexcms/better-auth",
    });

    expect(registry.getAll()).toHaveLength(3);
  });

  it("allows auth table slug to overlap with user collection slug (merge)", () => {
    const registry = new SlugRegistry();
    registry.register({
      slug: "user",
      source: "user-collection",
      location: "collections/user.ts",
    });

    // Auth table "user" overlapping with user collection "user" is expected
    // — this means the user wants to customize the auth table's admin UI
    expect(() =>
      registry.register({
        slug: "user",
        source: "auth-table",
        location: "@vexcms/better-auth",
      }),
    ).not.toThrow();

    // The user-collection registration should take precedence
    const all = registry.getAll();
    const userRegistrations = all.filter((r) => r.slug === "user");
    expect(userRegistrations).toHaveLength(1);
    expect(userRegistrations[0].source).toBe("user-collection");
  });

  it("throws VexSlugConflictError on non-auth/collection duplicate", () => {
    const registry = new SlugRegistry();
    registry.register({
      slug: "data",
      source: "user-collection",
      location: "collections/data.ts",
    });

    // Two user collections with same slug: real conflict
    expect(() =>
      registry.register({
        slug: "data",
        source: "user-collection",
        location: "collections/data2.ts",
      }),
    ).toThrow(VexSlugConflictError);
  });

  it("includes both sources in error message for real conflicts", () => {
    const registry = new SlugRegistry();
    registry.register({
      slug: "data",
      source: "user-global",
      location: "globals/data.ts",
    });

    try {
      registry.register({
        slug: "data",
        source: "auth-table",
        location: "@vexcms/better-auth",
      });
      expect.unreachable("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(VexSlugConflictError);
      const err = e as VexSlugConflictError;
      expect(err.slug).toBe("data");
      expect(err.existingSource).toBe("user-global");
      expect(err.newSource).toBe("auth-table");
      expect(err.message).toContain("Duplicate");
      expect(err.message).toContain("data");
    }
  });

  it("getAll() returns all successful registrations", () => {
    const registry = new SlugRegistry();
    registry.register({
      slug: "posts",
      source: "user-collection",
      location: "collections/posts.ts",
    });
    registry.register({
      slug: "users",
      source: "user-collection",
      location: "collections/users.ts",
    });

    expect(registry.getAll()).toHaveLength(2);
  });

  it("getAll() returns empty array for empty registry", () => {
    const registry = new SlugRegistry();
    expect(registry.getAll()).toEqual([]);
  });
});

describe("buildSlugRegistry", () => {
  const posts = defineCollection("posts", {
    fields: { title: text() },
  });

  const users = defineCollection("users", {
    fields: { name: text() },
  });

  it("registers user collection slugs", () => {
    const config = defineConfig({
      collections: [posts, users],
      auth: minimalAuth,
    });
    const registry = buildSlugRegistry({ config });
    const all = registry.getAll();

    expect(all.find((r) => r.slug === "posts")?.source).toBe("user-collection");
    expect(all.find((r) => r.slug === "users")?.source).toBe("user-collection");
  });

  it("registers auth table slugs", () => {
    const authAdapter: VexAuthAdapter = {
      name: "better-auth",
      tables: [
        {
          slug: "account",
          fields: { userId: { validator: 'v.id("users")' } },
        },
        {
          slug: "session",
          fields: { token: { validator: "v.string()" } },
        },
      ],
    };

    const config = defineConfig({
      collections: [posts, users],
      auth: authAdapter,
    });
    const registry = buildSlugRegistry({ config });
    const all = registry.getAll();

    expect(all.find((r) => r.slug === "account")?.source).toBe("auth-table");
    expect(all.find((r) => r.slug === "session")?.source).toBe("auth-table");
  });

  it("allows auth table slug to overlap with user collection slug (for merge)", () => {
    const authAdapter: VexAuthAdapter = {
      name: "better-auth",
      tables: [
        {
          slug: "users",
          fields: {
            name: { validator: "v.string()" },
            email: { validator: "v.string()" },
          },
        },
        {
          slug: "account",
          fields: { userId: { validator: 'v.id("users")' } },
        },
      ],
    };

    const config = defineConfig({
      collections: [posts, users],
      auth: authAdapter,
    });

    // Should NOT throw — auth table "users" overlapping with user collection
    // "users" means the user wants to customize the auth user table
    const registry = buildSlugRegistry({ config });
    const all = registry.getAll();

    // "users" should appear once, registered as "user-collection"
    const usersRegistrations = all.filter((r) => r.slug === "users");
    expect(usersRegistrations).toHaveLength(1);
    expect(usersRegistrations[0].source).toBe("user-collection");
  });

  it("uses tableName for slug registration when provided", () => {
    const articles = defineCollection("articles", {
      fields: { title: text() },
      tableName: "blog_articles",
    });

    const config = defineConfig({
      collections: [articles, users],
      auth: minimalAuth,
    });
    const registry = buildSlugRegistry({ config });
    const all = registry.getAll();

    // tableName is used as the slug for the registry, not the collection slug
    expect(all.find((r) => r.slug === "blog_articles")).toBeDefined();
    expect(all.find((r) => r.slug === "articles")).toBeUndefined();
  });
});
```

**File: `packages/core/src/valueTypes/generate.ts`**

````typescript
import type { VexConfig } from "../types";

/**
 * Generates the full TypeScript source content for `convex/vex.schema.ts`.
 *
 * This is the main entry point for schema generation. It:
 * 1. Validates all slugs are unique (via SlugRegistry) — auth table slugs
 *    that overlap with user collection slugs are expected (merge, not conflict)
 * 2. For each auth table, checks if a matching user collection exists (by slug):
 *    a. If yes: merges auth table fields with collection fields (auth validators
 *       win for schema, user admin config wins for UI)
 *    b. If no matching collection: generates the auth table as-is
 * 3. User collections that don't match any auth table: generates from collection fields only
 * 4. Collects indexes from per-field `index` properties and collection-level `indexes`
 * 5. Generates defineTable() calls for each table with chained .index() calls
 * 6. Generates defineTable() calls for system tables (vex_globals if globals exist)
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
 * export const user = defineTable({
 *   name: v.string(),
 *   email: v.string(),
 *   emailVerified: v.boolean(),
 *   ...
 * });
 *
 * export const account = defineTable({
 *   userId: v.id("user"),
 *   ...
 * })
 *   .index("by_userId", ["userId"]);
 * ```
 *
 * User's schema.ts can then extend:
 * ```typescript
 * import { posts, account, user } from "./vex.schema";
 * import { defineSchema } from "convex/server";
 *
 * export default defineSchema({
 *   posts: posts.index("by_author_date", ["author", "_creationTime"]),
 *   account,
 *   user,
 *   // custom tables...
 * });
 * ```
 *
 * Edge cases:
 * - Empty collections + no auth tables: generate file with only the header comment and imports
 * - Collection with no fields: generate `defineTable({})` (valid but unusual)
 * - Auth adapter with no tables: skip auth table section
 * - Auth table matches user collection: merge fields (auth validators win)
 * - Auth table with no matching collection: generate as standalone table
 * - Globals configured: add vex_globals system table
 * - No globals: skip vex_globals table
 * - Field with quotes in select option values: escape properly in literals
 * - Slug validation fails: throw before generating any output
 * - Per-field indexes + collection-level indexes: both appear as chained .index() calls
 * - Auth table indexes: appear as chained .index() calls on auth tables
 * - Duplicate index names within a collection: error at generation time
 */
export function generateVexSchema(props: { config: VexConfig }): string {
  // TODO: implement
  //
  // 1. Access config via props.config
  //
  // 2. Build slug registry: buildSlugRegistry({ config })
  //    → throws immediately on duplicate slug (except auth+collection overlap)
  //
  // 2. Build header string:
  //    - Warning comment: "⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT"
  //    - Reference to output path from config.schema?.outputPath
  //    - Imports: `import { defineTable } from "convex/server";`
  //              `import { v } from "convex/values";`
  //
  // 3. Build set of auth table slugs for O(1) lookup:
  //    authTableSlugs = new Set(config.auth.tables.map(t => t.slug))
  //    authTableMap = new Map(config.auth.tables.map(t => [t.slug, t]))
  //
  // 4. Track which auth tables have been merged (to find standalone ones later):
  //    mergedAuthSlugs = new Set<string>()
  //
  // 5. For each user collection:
  //    a. tableName = collection.config.tableName ?? collection.slug
  //    b. If authTableMap.has(tableName):
  //       → merged = mergeAuthTableWithCollection(authTable, collection)
  //       → mergedAuthSlugs.add(tableName)
  //       → Use merged.fields for defineTable fields
  //       → Collect indexes: both from collectIndexes(collection) AND authTable.indexes
  //       → Deduplicate indexes by name (collection wins on collision)
  //    c. Else (no matching auth table):
  //       → Convert each field via fieldToValueType({ field, collectionSlug: slug, fieldName })
  //       → Collect indexes via collectIndexes(collection)
  //    d. Generate: `export const ${tableName} = defineTable({\n  ${fields}\n})`
  //    e. For each index: chain `\n  .index("${name}", [${fields.map(f => `"${f}"`).join(", ")}])`
  //    f. Terminate with semicolon
  //
  // 6. For each auth table NOT in mergedAuthSlugs (standalone auth tables):
  //    a. Generate defineTable from authTable.fields (already validator strings)
  //    b. Chain .index() calls from authTable.indexes (if any)
  //    c. These tables have no user-defined admin UI customization
  //
  // 7. If config.globals?.length > 0:
  //    → Generate vex_globals system table with appropriate fields
  //
  // 8. Join all parts: header + blank line + table definitions (separated by blank lines)
  //
  // 9. Return the complete string
  //
  // Edge cases:
  // - Empty collections + no auth: header + imports only
  // - Collection with no fields: `defineTable({})` (valid)
  // - Auth table with no indexes: no .index() chain
  // - Multiple indexes: chain all .index() calls
  // - Slug validation fails: thrown before any generation happens (step 1)
  throw new Error("Not implemented");
}
````

**File: `packages/core/src/valueTypes/generate.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { generateVexSchema } from "./generate";
import { defineCollection } from "../config/defineCollection";
import { defineConfig } from "../config/defineConfig";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { checkbox } from "../fields/checkbox";
import { select } from "../fields/select";
import type { VexAuthAdapter } from "./auth";
import { VexSlugConflictError } from "../errors";

// Minimal auth adapter used by tests that don't focus on auth behavior
const minimalAuth: VexAuthAdapter = {
  name: "better-auth",
  tables: [],
};

// Shared users collection for tests that need auth
const users = defineCollection("users", {
  fields: { name: text() },
});

describe("generateVexSchema", () => {
  describe("header and imports", () => {
    it("includes auto-generated warning comment", () => {
      const config = defineConfig({
        collections: [users],
        auth: minimalAuth,
      });
      const output = generateVexSchema(config);
      expect(output).toContain("AUTO-GENERATED");
      expect(output).toContain("DO NOT EDIT");
    });

    it("includes convex imports", () => {
      const config = defineConfig({
        collections: [users],
        auth: minimalAuth,
      });
      const output = generateVexSchema(config);
      expect(output).toContain('import { defineTable } from "convex/server"');
      expect(output).toContain('import { v } from "convex/values"');
    });
  });

  describe("basic collection generation", () => {
    it("generates a simple collection with text fields", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true, defaultValue: "Untitled" }),
          slug: text(),
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema(config);

      expect(output).toContain("export const posts = defineTable({");
      expect(output).toContain("title: v.string()");
      expect(output).toContain("slug: v.optional(v.string())");
    });

    it("generates a collection with all field types", () => {
      const items = defineCollection("items", {
        fields: {
          name: text({ required: true, defaultValue: "" }),
          count: number({ required: true, defaultValue: 0 }),
          active: checkbox(),
          status: select({
            required: true,
            defaultValue: "open",
            options: [
              { value: "open", label: "Open" },
              { value: "closed", label: "Closed" },
            ],
          }),
        },
      });
      const config = defineConfig({
        collections: [items, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema(config);

      expect(output).toContain("name: v.string()");
      expect(output).toContain("count: v.number()");
      expect(output).toContain("active: v.optional(v.boolean())");
      expect(output).toContain(
        'status: v.union(v.literal("open"),v.literal("closed"))',
      );
    });

    it("generates multiple collections", () => {
      const posts = defineCollection("posts", {
        fields: { title: text() },
      });
      const categories = defineCollection("categories", {
        fields: { name: text() },
      });
      const config = defineConfig({
        collections: [posts, categories, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema(config);

      expect(output).toContain("export const posts = defineTable({");
      expect(output).toContain("export const categories = defineTable({");
    });

    it("handles only the users collection (no additional collections)", () => {
      const config = defineConfig({
        collections: [users],
        auth: minimalAuth,
      });
      const output = generateVexSchema(config);

      // Should have header, imports, and the users table
      expect(output).toContain("AUTO-GENERATED");
      expect(output).toContain("export const users = defineTable({");
    });
  });

  describe("tableName", () => {
    it("uses tableName instead of slug for the export name", () => {
      const articles = defineCollection("articles", {
        fields: { title: text() },
        tableName: "blog_articles",
      });
      const config = defineConfig({
        collections: [articles, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema(config);

      expect(output).toContain("export const blog_articles = defineTable({");
      expect(output).not.toContain("export const articles = defineTable({");
    });

    it("defaults to slug when tableName is not set", () => {
      const posts = defineCollection("posts", {
        fields: { title: text() },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema(config);

      expect(output).toContain("export const posts = defineTable({");
    });
  });

  describe("index generation", () => {
    it("generates per-field indexes as chained .index() calls", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text(),
          slug: text({ index: "by_slug" }),
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema(config);

      expect(output).toContain('.index("by_slug", ["slug"])');
    });

    it("generates collection-level compound indexes", () => {
      const posts = defineCollection("posts", {
        fields: {
          author: text(),
          createdAt: number(),
        },
        indexes: [{ name: "by_author_date", fields: ["author", "createdAt"] }],
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema(config);

      expect(output).toContain(
        '.index("by_author_date", ["author", "createdAt"])',
      );
    });

    it("generates both per-field and collection-level indexes", () => {
      const posts = defineCollection("posts", {
        fields: {
          slug: text({ index: "by_slug" }),
          author: text(),
          createdAt: number(),
        },
        indexes: [{ name: "by_author_date", fields: ["author", "createdAt"] }],
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema(config);

      expect(output).toContain('.index("by_slug", ["slug"])');
      expect(output).toContain(
        '.index("by_author_date", ["author", "createdAt"])',
      );
    });

    it("does not generate .index() when no indexes defined", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text(),
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema(config);

      // posts table should not have .index() — users table may depending on auth
      const postsSection = output.split("export const users")[0];
      expect(postsSection).not.toContain(".index(");
    });

    it("auto-generates index for admin.useAsTitle field", () => {
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
      const output = generateVexSchema(config);

      expect(output).toContain('.index("by_title", ["title"])');
    });
  });

  describe("auth integration", () => {
    const posts = defineCollection("posts", {
      fields: { title: text() },
    });

    const baseAuthAdapter: VexAuthAdapter = {
      name: "better-auth",
      tables: [
        {
          slug: "users",
          fields: {
            name: { validator: "v.string()" },
            email: { validator: "v.string()" },
            emailVerified: { validator: "v.boolean()" },
            createdAt: { validator: "v.number()" },
            updatedAt: { validator: "v.number()" },
          },
        },
        {
          slug: "account",
          fields: {
            userId: { validator: 'v.id("users")' },
            accountId: { validator: "v.string()" },
            providerId: { validator: "v.string()" },
            createdAt: { validator: "v.number()" },
            updatedAt: { validator: "v.number()" },
          },
          indexes: [{ name: "by_userId", fields: ["userId"] }],
        },
        {
          slug: "session",
          fields: {
            token: { validator: "v.string()" },
            userId: { validator: 'v.id("users")' },
            expiresAt: { validator: "v.number()" },
            createdAt: { validator: "v.number()" },
            updatedAt: { validator: "v.number()" },
          },
          indexes: [{ name: "by_token", fields: ["token"] }],
        },
      ],
    };

    it("merges auth user table fields into matching user collection", () => {
      const config = defineConfig({
        collections: [posts, users],
        auth: baseAuthAdapter,
      });
      const output = generateVexSchema(config);

      // Auth-provided fields appear in the users table (from auth tables array)
      expect(output).toContain("email: v.string()");
      expect(output).toContain("emailVerified: v.boolean()");
      expect(output).toContain("createdAt: v.number()");

      // User-only fields also present
      expect(output).toContain("name:");
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

    it("uses v.id() for relationship fields in auth tables", () => {
      const config = defineConfig({
        collections: [posts, users],
        auth: baseAuthAdapter,
      });
      const output = generateVexSchema(config);

      // userId on account and session tables should use v.id("users")
      // (based on the user table's slug in the auth tables array)
      expect(output).toContain('userId: v.id("users")');
    });

    it("includes admin plugin fields in the user auth table", () => {
      // vexBetterAuth() resolves all plugin contributions before returning
      // the adapter, so the user table in auth.tables already includes plugin fields
      const authWithAdminFields: VexAuthAdapter = {
        name: "better-auth",
        tables: [
          {
            slug: "users",
            fields: {
              ...baseAuthAdapter.tables[0].fields,
              banned: { validator: "v.optional(v.boolean())" },
              role: { validator: "v.array(v.string())" },
            },
          },
          ...baseAuthAdapter.tables.slice(1),
        ],
      };

      const config = defineConfig({
        collections: [posts, users],
        auth: authWithAdminFields,
      });
      const output = generateVexSchema(config);

      // Additional user fields appear in the users table
      expect(output).toContain("banned: v.optional(v.boolean())");
      expect(output).toContain("role: v.array(v.string())");
    });
  });

  describe("slug validation", () => {
    it("allows auth table slug to overlap with user collection slug (merge)", () => {
      // User defines an "account" collection and auth also has an "account" table
      // — this means the user wants to customize the account table's admin UI
      const account = defineCollection("account", {
        fields: { displayName: text() },
      });

      const authAdapter: VexAuthAdapter = {
        name: "better-auth",
        tables: [
          {
            slug: "account",
            fields: { userId: { validator: 'v.id("users")' } },
          },
        ],
      };

      const config = defineConfig({
        collections: [account, users],
        auth: authAdapter,
      });

      // Should NOT throw — the overlap triggers a merge
      const output = generateVexSchema(config);
      expect(output).toContain("export const account = defineTable({");
      // Auth field merged in
      expect(output).toContain('userId: v.id("users")');
      // User field also present
      expect(output).toContain("displayName:");
    });

    it("throws when two user collections have the same slug", () => {
      const posts1 = defineCollection("posts", {
        fields: { title: text() },
      });
      const posts2 = defineCollection("posts", {
        fields: { name: text() },
      });

      const config = defineConfig({
        collections: [posts1, posts2, users],
        auth: minimalAuth,
      });

      expect(() => generateVexSchema(config)).toThrow(VexSlugConflictError);
    });
  });

  describe("output formatting", () => {
    it("generates valid TypeScript (no syntax errors in structure)", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true, defaultValue: "Untitled" }),
          slug: text({ index: "by_slug" }),
          views: number(),
          featured: checkbox(),
          status: select({
            required: true,
            defaultValue: "draft",
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
      const output = generateVexSchema(config);

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
          title: text(),
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
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

**File: `packages/core/src/valueTypes/index.ts`**

```typescript
export { generateVexSchema } from "./generate";
export { fieldToValueType } from "./extract";
export { processFieldValueTypeOptions } from "./processAdminOptions";
export { mergeAuthTableWithCollection } from "./merge";
export type { MergedFieldsResult } from "./merge";
export { collectIndexes } from "./indexes";
export type { ResolvedIndex } from "./indexes";
export { SlugRegistry, buildSlugRegistry } from "./slugs";
export type { SlugSource, SlugRegistration } from "./slugs";
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

// Value type generation
export { generateVexSchema } from "./valueTypes";
export { fieldToValueType } from "./valueTypes";
export { processFieldValueTypeOptions } from "./valueTypes";
export { mergeAuthTableWithCollection } from "./valueTypes";
export { collectIndexes } from "./valueTypes";
export { SlugRegistry, buildSlugRegistry } from "./valueTypes";

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
  // Schema config types
  SchemaConfig,
  SchemaConfigInput,
  // Field options
  BaseFieldOptions,
  TextFieldOptions,
  NumberFieldOptions,
  CheckboxFieldOptions,
  SelectFieldOptions,
} from "./types";

// Auth types
export type {
  VexAuthAdapter,
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
} from "./valueTypes";

// Error types
export {
  VexError,
  VexSlugConflictError,
  VexFieldValidationError,
  VexAuthConfigError,
} from "./errors";
```

---

## User-Extensible Schema (schema.ts)

The generated `vex.schema.ts` exports **named table definitions**. Users import these in their own `convex/schema.ts` and can chain additional Convex methods:

```typescript
// convex/schema.ts (user-owned)
import { defineSchema } from "convex/server";
import {
  posts,
  users,
  account,
  session,
  verification,
  jwks,
} from "./vex.schema";

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
    timestamp: v.number(),
  }).index("by_event", ["event"]),
});
```

This works because Convex's `defineTable()` returns an object with chainable `.index()` and `.searchIndex()` methods. Vex generates the base table definition; users extend it in their schema file. This is explicitly supported by Convex and requires no special handling from Vex.

---

## `@vexcms/better-auth` Package (Reference)

This package is out of scope for the `@vexcms/core` tests but is defined here for completeness. It will be implemented as a separate package.

### Design Principle: Single Source of Truth

The `@vexcms/better-auth` package accepts the **same better-auth config** that users pass to `betterAuth()` from the `better-auth` library. This means:

1. Users maintain their auth config in **one place** (not three: server plugin + client plugin + vex config)
2. The Vex package uses `getAuthTables()` from `better-auth/db` to extract all tables uniformly — including the user table
3. Relationship fields (e.g., `userId` on account/session) use `v.id("<collectionSlug>")` based on the actual `modelName` values from the config
4. When users add/remove/modify better-auth plugins, the Vex schema updates automatically

### `vexBetterAuth(config): VexAuthAdapter`

**Factory function that accepts a better-auth config and returns a VexAuthAdapter.**

The function uses `getAuthTables()` from `better-auth/db` to get all auth tables (including the user table) in a uniform format, then converts them to `AuthTableDefinition[]` with Convex validator strings.

All tables — including `user`, `account`, `session`, `verification`, `jwks`, and any plugin-contributed tables — are returned in a flat `tables` array. Core's schema generator handles merging any user-defined collection configs on top of matching auth tables.

```typescript
// packages/better-auth/src/index.ts
import type { BetterAuthOptions } from "better-auth";
import type { VexAuthAdapter } from "@vexcms/core";
import { extractAuthTables } from "./extract/tables";

/**
 * Create a VexAuthAdapter from a better-auth config.
 *
 * Accepts the exact same config object you pass to `betterAuth()`.
 * Uses `getAuthTables()` from `better-auth/db` to introspect all tables
 * uniformly, then converts field types to Convex validator strings.
 *
 * All tables (user, account, session, verification, jwks, plugin tables)
 * are returned in a flat `tables` array. Core handles merging with
 * user-defined collections when slugs match.
 *
 * @param config - The better-auth configuration object
 * @returns A VexAuthAdapter for use in `defineConfig({ auth: ... })`
 *
 * Edge cases:
 * - No plugins in config: return base tables only (user, account, session, verification, jwks)
 * - Custom modelName: uses the custom slug in the table definition and for v.id() references
 * - Plugin adds new table: included in the tables array
 * - Plugin extends existing table with new fields: fields merged into that table
 */
export function vexBetterAuth(config: BetterAuthOptions): VexAuthAdapter {
  const tables = extractAuthTables(config);

  return {
    name: "better-auth",
    tables,
  };
}

// Re-export core auth types for convenience
export type {
  VexAuthAdapter,
  AuthTableDefinition,
  AuthFieldDefinition,
} from "@vexcms/core";
```

### Extract auth tables

```typescript
// packages/better-auth/src/extract/tables.ts
import type { BetterAuthOptions } from "better-auth";
import type { AuthTableDefinition } from "@vexcms/core";
import { betterAuthTypeToValueType } from "../valueTypes";

/**
 * Extract all auth tables from the better-auth config using `getAuthTables()`.
 *
 * Uses better-auth's built-in `getAuthTables()` API to get a uniform
 * representation of all tables (user, account, session, verification, jwks,
 * and any plugin-contributed tables). Converts each table's field types
 * to Convex validator strings.
 *
 * This replaces the previous approach of separately extracting user fields,
 * base tables, and plugin contributions. `getAuthTables()` handles all of
 * that internally and returns a fully resolved table map.
 *
 * @param config - The better-auth configuration object
 * @returns Array of AuthTableDefinition for all auth tables
 *
 * Edge cases:
 * - Custom modelNames: reflected in the table slug
 * - Plugin tables: included automatically by getAuthTables()
 * - Relationship fields: converted to v.id("<slug>") based on references
 * - Unknown field types: throw with descriptive error
 */
export function extractAuthTables(
  config: BetterAuthOptions,
): AuthTableDefinition[] {
  // TODO: implement
  // 1. Call getAuthTables(config) → returns Record<string, { modelName, fields, ... }>
  // 2. Initialize tables as empty array
  // 3. Iterate Object.entries(allTables)
  // 4. For each [tableKey, tableDef]:
  //    a. slug = tableDef.modelName || tableKey
  //    b. fields = convertFields(tableDef.fields)
  //    c. indexes = extractIndexes(tableDef.fields)
  //    d. Push { slug, fields, ...(indexes.length > 0 ? { indexes } : {}) }
  // 5. Return tables
  throw new Error("Not implemented");
}
```

### Value type mapping

```typescript
// packages/better-auth/src/valueTypes.ts
import type { AuthFieldDefinition } from "@vexcms/core";

/**
 * Maps a better-auth field type string to a Convex validator string.
 *
 * better-auth uses type strings like "string", "number", "boolean",
 * "string[]", "date", etc. This function converts them to the
 * corresponding Convex validator string representation.
 *
 * @param props.type - The better-auth field type (e.g., "string", "number", "boolean", "date")
 * @param props.required - Whether the field is required (determines v.optional() wrapping)
 * @param props.references - Optional table reference for relationship fields (produces v.id())
 * @returns Convex validator string (e.g., "v.string()", "v.optional(v.number())")
 *
 * Type mappings:
 * - "string" → "v.string()" / "v.optional(v.string())"
 * - "number" → "v.number()" / "v.optional(v.number())"
 * - "boolean" → "v.boolean()" / "v.optional(v.boolean())"
 * - "date" → "v.number()" / "v.optional(v.number())" (stored as epoch ms)
 * - "string[]" → "v.array(v.string())" / "v.optional(v.array(v.string()))"
 * - references provided → "v.id(\"<table>\")" / "v.optional(v.id(\"<table>\"))"
 *
 * Edge cases:
 * - Unknown type string: throw with descriptive error
 * - Nullable fields: use v.optional() wrapping
 */
export function betterAuthTypeToValueType(props: {
  type: string;
  required: boolean;
  references?: { model: string };
}): string {
  // TODO: implement
  // 1. If props.references defined → validator = `v.id("${props.references.model}")`
  // 2. Else if Array.isArray(props.type) → validator = "v.string()" (enum)
  // 3. Else switch on props.type:
  //    "string" → "v.string()", "number" → "v.number()",
  //    "boolean" → "v.boolean()", "date" → "v.number()",
  //    "json" → "v.any()", "string[]" → "v.array(v.string())",
  //    "number[]" → "v.array(v.number())"
  //    default → throw
  // 4. If !props.required → wrap: `v.optional(${validator})`
  // 5. Return validator
  throw new Error("Not implemented");
}
```

### Package structure

```
packages/better-auth/
├── src/
│   ├── index.ts                      # vexBetterAuth() factory + re-exports
│   ├── index.test.ts                 # integration tests
│   ├── types.ts                      # Re-exports core auth types
│   ├── valueTypes.ts                 # betterAuthTypeToValueType()
│   ├── valueTypes.test.ts            # unit tests for value type mapping
│   └── extract/
│       ├── tables.ts                 # extractAuthTables() — uses getAuthTables()
│       └── tables.test.ts            # tests for extractAuthTables()
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

---

## User-Facing Config Example

After this spec is implemented, a user's collection with indexes looks like:

```typescript
// src/vexcms/collections/posts.ts
import { defineCollection, text, number, select, checkbox } from "@vexcms/core";

export const posts = defineCollection("posts", {
  fields: {
    title: text({ label: "Title", required: true, defaultValue: "Untitled" }),
    slug: text({
      label: "Slug",
      required: true,
      defaultValue: "",
      index: "by_slug",
    }),
    status: select({
      label: "Status",
      required: true,
      defaultValue: "draft",
      index: "by_status",
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
      ],
    }),
    featured: checkbox({ label: "Featured" }),
    author: text({ label: "Author", required: true, defaultValue: "" }),
    publishedAt: number({ label: "Published At" }),
  },
  // Compound indexes go here — type-checked against field names
  indexes: [
    { name: "by_author_status", fields: ["author", "status"] },
    { name: "by_status_published", fields: ["status", "publishedAt"] },
  ],
  labels: { singular: "Post", plural: "Posts" },
  admin: {
    group: "Content",
    useAsTitle: "title", // auto-creates "by_title" index if not already defined
    defaultColumns: ["title", "status", "featured"],
  },
});
```

The auth setup is defined once and shared between better-auth and Vex:

```typescript
// src/auth/config.ts (shared auth config — single source of truth)
import type { BetterAuthOptions } from "better-auth";
import { admin } from "better-auth/plugins";

export const authConfig: BetterAuthOptions = {
  emailAndPassword: { enabled: true },
  user: {
    modelName: "user",
    additionalFields: {
      role: {
        type: "string[]",
        defaultValue: ["user"],
        required: true,
      },
    },
  },
  session: { modelName: "session" },
  account: { modelName: "account" },
  verification: { modelName: "verification" },
  plugins: [admin({ adminRoles: ["admin"], defaultRole: "user" })],
};
```

```typescript
// convex/auth/index.ts (server — uses the shared config)
import { betterAuth } from "better-auth";
import { convexAdapter } from "./adapter";
import { authConfig } from "../../src/auth/config";

export const createAuth = (ctx) =>
  betterAuth({
    ...authConfig,
    database: convexAdapter(ctx, schema),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.SITE_URL,
    trustedOrigins: [process.env.SITE_URL!],
  });
```

```typescript
// vex.config.ts (Vex — also uses the shared config)
import { defineConfig } from "@vexcms/core";
import { vexBetterAuth } from "@vexcms/better-auth";
import { authConfig } from "./src/auth/config";
import { posts, users, categories } from "./collections";

export default defineConfig({
  collections: [posts, users, categories],

  // Pass the same config — Vex introspects it for schema generation
  auth: vexBetterAuth(authConfig),

  schema: {
    // Optional: override output path (default: "convex/vex.schema.ts")
    // outputPath: "convex/generated/vex.schema.ts",
  },

  admin: {
    user: "users",
    meta: { titleSuffix: " | Vex CMS" },
  },
});
```

With this setup:

- Users maintain their auth config in **one file** (`src/auth/config.ts`)
- The server uses it with `betterAuth()` (adding runtime-only options like `database`, `secret`)
- Vex uses it with `vexBetterAuth()` to introspect tables, fields, and plugins for schema generation
- Adding/removing a better-auth plugin automatically updates the Vex schema
- Relationship fields use `v.id("user")` based on the actual `modelName` from the config

The generated `vex.schema.ts` will include:

- All collection tables with per-field, collection-level, and auto-generated `useAsTitle` indexes
- Auth infrastructure tables (account, session, verification, jwks) with `v.id()` relationship fields and their indexes
- Auth plugin extensions (admin fields on users, impersonatedBy on session)

And the user's `schema.ts` can extend any table with additional Convex config.

---

## Testing Checklist

All tests in `packages/core/src/`. Run with: `pnpm --filter @vexcms/core test`

**Per-field validator tests:**

- [ ] `fields/text/schemaValueType.test.ts` — required/optional text fields, minLength/maxLength ignored
- [ ] `fields/number/schemaValueType.test.ts` — required/optional number fields, min/max/step ignored
- [ ] `fields/checkbox/schemaValueType.test.ts` — required/optional checkbox fields
- [ ] `fields/select/schemaValueType.test.ts` — single select, multi select (hasMany), empty options, dedupe, escape quotes, defaultValue validation
- [ ] `valueTypes/processAdminOptions.test.ts` — `processFieldValueTypeOptions()` required/defaultValue checks, type mismatches
- [ ] `valueTypes/extract.test.ts` — `fieldToValueType()` dispatcher, each field type, unknown type error

**Schema generation tests:**

- [ ] `valueTypes/indexes.test.ts` — per-field indexes, collection-level indexes, dedup, collision detection, useAsTitle auto-index
- [ ] `valueTypes/slugs.test.ts` — `SlugRegistry` register/getAll, conflict detection, `buildSlugRegistry` with collections/globals/auth tables, auth table overlap with user collections
- [ ] `valueTypes/merge.test.ts` — `mergeAuthTableWithCollection()` overlapping/authOnly/userOnly fields, auth validator wins, user-only field conversion, empty auth fields
- [ ] `valueTypes/generate.test.ts` — header/imports, collection tables, auth infrastructure tables, indexes, v.id() relationship fields, auth table merging into user collections, slug validation errors, output formatting

**Final verification:**

- [ ] All tests pass: `pnpm --filter @vexcms/core test`
- [ ] Build passes: `pnpm --filter @vexcms/core build`
- [ ] Test app compiles: `pnpm --filter test-app typecheck`

---

## Implementation Notes

Changes made during implementation:

- **Renamed `schema/` → `valueTypes/`** — "value types" more accurately describes what we're constructing for the `vex.schema.config` file. The folder generates Convex value type strings, not a full schema.
- **Renamed `schema.ts` → `schemaValueType.ts`** in all field subfolders — consistent with the folder rename.
- **Renamed all `*ToValidatorString` → `*ToValueTypeString`** — text, number, checkbox, select functions all renamed.
- **Renamed `fieldToValidatorString` → `fieldToValueType`** — the central dispatcher.
- **Combined `validateFieldConfig()` + `wrapOptional()` → `processFieldValueTypeOptions()`** — a single function that takes `{ meta, collectionSlug, fieldName, expectedType, valueType }` and returns the final string directly. No intermediate `FieldValidationResult` interface.
- **Removed `FieldValidationResult` interface** — not needed since `processFieldValueTypeOptions` returns a string directly.
- **All functions use single `props` object** — every function takes `props: { ... }` instead of positional parameters, for LSP autocomplete and parameter name visibility.
- **Moved auth types into `types/auth.ts`** — no separate `auth/` directory. Auth types are co-located with other types.
- **Skipped admin folder scaffolding** — no `admin/` subfolders created in field subfolders. These are out of scope and would be empty stubs.
- **Added `fields/constants.ts`** — extracted `TEXT_VALUETYPE`, `NUMBER_VALUETYPE`, `CHECKBOX_VALUETYPE` constants.
- **Used `v.number()` instead of `v.float64()`** — Convex uses `v.number()` for all numeric types.
