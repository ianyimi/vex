# Schema Generation & Auth Integration Spec

This document defines the implementation plan for Vex CMS schema generation from collection configs and the auth plugin integration for `@vexcms/better-auth`. It covers the per-field subfolder restructure, Convex schema codegen, index generation (per-field and collection-level), auth adapter types, field merging, reserved slug validation, and a test-first development approach.

**Referenced by**: [roadmap.md](./roadmap.md) - Phase 1.3

**Depends on**: [05-schema-field-system-spec.md](./05-schema-field-system-spec.md) - Field types and collection configuration

**Supersedes (partially)**: [04-auth-adapter-spec.md](./04-auth-adapter-spec.md) - Replaces the abstract AuthAdapter interface with a concrete `vexBetterAuth()` config slot; [06-convex-integration-spec.md](./06-convex-integration-spec.md) - Replaces schema generation sections

**Testing**: [11-testing-strategy-spec.md](./11-testing-strategy-spec.md) - Unit tests in `packages/core`

---

## Design Goals

1. **Zero Convex dependency in core** — Schema generation outputs strings (`"v.string()"`) not runtime validators. `@vexcms/core` stays dependency-free.
2. **Colocated field logic** — Each field type lives in its own subfolder with `config.ts` (user-facing builder) and `schema.ts` (validator string generator) side by side.
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

1. **Phase A.1** — Core types and interfaces: error types, auth types, field type modifications (`BaseFieldOptions`, `BaseFieldMeta.index`, `IndexConfig`), config type modifications (`VexConfig.auth` required, `SchemaConfig`, `CollectionConfig.tableName`) ✅
2. **Phase A.2** — Per-field subfolder restructure: move field builders to `config.ts`, create `schema.ts` stubs, create `admin/` subfolder stubs ✅
3. **Phase D** — `@vexcms/better-auth` package: implement `vexBetterAuth()`, `extractAuthTables()`, `betterAuthTypeToValidator()`. This unblocks the `auth` field in `defineConfig()` so the full config compiles.

### Stage 2: Per-Field Validators and Schema Generation (resume after Stage 1)

4. **Phase B.1** — Per-field validator tests (`text/schema.test.ts`, `number/schema.test.ts`, etc.) and `validate.test.ts`
5. **Phase C.1** — Implement per-field validators (`textToValidatorString`, etc.), `validateFieldConfig`, `wrapOptional`
6. **Phase A.3** — Schema generation stubs: `fieldToValidatorString` dispatcher, `collectIndexes`, `SlugRegistry`, `mergeAuthTableWithCollection`, `generateVexSchema`
7. **Phase B.2** — Schema generation tests: `extract.test.ts`, `indexes.test.ts`, `slugs.test.ts`, `merge.test.ts`, `generate.test.ts`
8. **Phase C.2** — Implement schema generation functions

### Phases reference (original structure preserved below)

The Phase A / B / C sections below contain all code for both stages. Use the stage ordering above to determine what to implement when.

---

## Phase A: File Structure & Interfaces

### Target directory structure

After this spec is implemented, `packages/core/src/` will look like:

```
packages/core/src/
├── index.ts                          # Main entry — re-exports everything
├── errors/
│   ├── index.ts                      # re-exports all error types
│   └── errors.ts                     # VexError base + subclasses
├── config/
│   ├── defineCollection.ts           # existing (unchanged)
│   ├── defineConfig.ts               # MODIFIED — auth required, schema config, slug validation
│   └── defineGlobal.ts               # existing (unchanged)
├── fields/
│   ├── index.ts                      # re-exports all field builders + validators
│   ├── text/
│   │   ├── index.ts                  # re-exports config + schema + admin/
│   │   ├── config.ts                 # text() builder (moved from fields/text.ts)
│   │   ├── schema.ts                 # textToValidatorString()
│   │   ├── schema.test.ts            # tests for text validator generation
│   │   └── admin/
│   │       ├── index.ts              # re-exports input + zod
│   │       ├── input.ts              # TextFieldInput component (stub — next spec)
│   │       └── zod.ts                # textFieldZodSchema() (stub — next spec)
│   ├── number/
│   │   ├── index.ts
│   │   ├── config.ts                 # number() builder (moved)
│   │   ├── schema.ts                 # numberToValidatorString()
│   │   ├── schema.test.ts
│   │   └── admin/
│   │       ├── index.ts              # re-exports input + zod
│   │       ├── input.ts              # NumberFieldInput component (stub — next spec)
│   │       └── zod.ts                # numberFieldZodSchema() (stub — next spec)
│   ├── checkbox/
│   │   ├── index.ts
│   │   ├── config.ts                 # checkbox() builder (moved)
│   │   ├── schema.ts                 # checkboxToValidatorString()
│   │   ├── schema.test.ts
│   │   └── admin/
│   │       ├── index.ts              # re-exports input + zod
│   │       ├── input.ts              # CheckboxFieldInput component (stub — next spec)
│   │       └── zod.ts                # checkboxFieldZodSchema() (stub — next spec)
│   └── select/
│       ├── index.ts
│       ├── config.ts                 # select() builder (moved)
│       ├── schema.ts                 # selectToValidatorString()
│       ├── schema.test.ts
│       └── admin/
│           ├── index.ts              # re-exports input + zod
│           ├── input.ts              # SelectFieldInput component (stub — next spec)
│           └── zod.ts                # selectFieldZodSchema() (stub — next spec)
├── schema/
│   ├── index.ts                      # re-exports generate, extract, merge, slugs, indexes
│   ├── generate.ts                   # generateVexSchema(config) → string
│   ├── generate.test.ts              # tests for full schema generation
│   ├── extract.ts                    # fieldToValidatorString() dispatcher
│   ├── extract.test.ts               # tests for the dispatcher
│   ├── validate.ts                   # validateFieldConfig() — shared field validation util
│   ├── validate.test.ts              # tests for field validation
│   ├── indexes.ts                    # collectIndexes() — gathers per-field + collection-level indexes
│   ├── indexes.test.ts               # tests for index collection and dedup
│   ├── merge.ts                      # mergeAuthTableWithCollection()
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
packages/better-auth/
├── src/
│   ├── index.ts                      # vexBetterAuth() factory + re-exports
│   ├── index.test.ts                 # integration tests
│   ├── types.ts                      # Re-exports core auth types
│   ├── validators.ts                 # betterAuthTypeToValidator()
│   ├── validators.test.ts            # unit tests for validator mapping
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

**File: `packages/core/src/auth/index.ts`**

```typescript
export type {
  AuthFieldDefinition,
  AuthIndexDefinition,
  AuthTableDefinition,
  VexAuthAdapter,
} from "./types";
```

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
import type { VexAuthAdapter } from "../auth/types";

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

TODO: Continue from here

> **PAUSE POINT:** Before continuing below, implement the `@vexcms/better-auth` package by following
> **[Spec 13 — Better Auth Package](./13-better-auth-package-spec.md)**.
> This gives you a working `vexBetterAuth()` function so the `auth` field in `vex.config.ts` compiles.
> Return here after spec 13 is complete.

---

### Per-Field Validator Functions

Each field subfolder gets a `schema.ts` that exports a function converting field metadata to a Convex validator string.

**File: `packages/core/src/fields/text/schema.ts`**

```typescript
import type { TextFieldMeta } from "../../types";

/**
 * Converts text field metadata to a Convex validator string.
 * Calls validateFieldConfig() to check required/defaultValue, then wraps in v.optional() if needed.
 *
 * @returns `"v.string()"` or `"v.optional(v.string())"`
 *
 * Goal: Validate config, then return the validator string for a text field.
 * minLength/maxLength are runtime validation concerns, not schema constraints.
 *
 * Edge cases:
 * - required=true + no defaultValue: throws VexFieldValidationError
 * - required=true + defaultValue is not a string: throws VexFieldValidationError
 * - index property has no effect on the validator (handled by index collection)
 */
export function textToValidatorString(
  meta: TextFieldMeta,
  collectionSlug: string,
  fieldName: string,
): string {
  // TODO: implement — call validateFieldConfig(meta, collectionSlug, fieldName, "string")
  // then return wrapOptional("v.string()", result.isOptional)
  throw new Error("Not implemented");
}
```

**File: `packages/core/src/fields/number/schema.ts`**

```typescript
import type { NumberFieldMeta } from "../../types";

/**
 * Converts number field metadata to a Convex validator string.
 * Calls validateFieldConfig() to check required/defaultValue, then wraps in v.optional() if needed.
 *
 * @returns `"v.float64()"` or `"v.optional(v.float64())"`
 *
 * Goal: Validate config, then return the validator string for a number field.
 * min/max/step are runtime validation concerns.
 *
 * Edge cases:
 * - required=true + no defaultValue: throws VexFieldValidationError
 * - required=true + defaultValue is not a number: throws VexFieldValidationError
 * - Integer-only fields: no Convex integer validator, still float64
 */
export function numberToValidatorString(
  meta: NumberFieldMeta,
  collectionSlug: string,
  fieldName: string,
): string {
  // TODO: implement — call validateFieldConfig(meta, collectionSlug, fieldName, "number")
  // then return wrapOptional("v.float64()", result.isOptional)
  throw new Error("Not implemented");
}
```

**File: `packages/core/src/fields/checkbox/schema.ts`**

```typescript
import type { CheckboxFieldMeta } from "../../types";

/**
 * Converts checkbox field metadata to a Convex validator string.
 * Calls validateFieldConfig() to check required/defaultValue, then wraps in v.optional() if needed.
 *
 * @returns `"v.boolean()"` or `"v.optional(v.boolean())"`
 *
 * Goal: Validate config, then return the validator string for a checkbox field.
 *
 * Edge cases:
 * - required=true + no defaultValue: throws VexFieldValidationError
 * - required=true + defaultValue is not a boolean: throws VexFieldValidationError
 */
export function checkboxToValidatorString(
  meta: CheckboxFieldMeta,
  collectionSlug: string,
  fieldName: string,
): string {
  // TODO: implement — call validateFieldConfig(meta, collectionSlug, fieldName, "boolean")
  // then return wrapOptional("v.boolean()", result.isOptional)
  throw new Error("Not implemented");
}
```

**File: `packages/core/src/fields/select/schema.ts`**

```typescript
import type { SelectFieldMeta } from "../../types";

/**
 * Converts select field metadata to a Convex validator string.
 * Calls validateFieldConfig() to check required/defaultValue, then wraps in v.optional() if needed.
 *
 * @returns One of (each may be wrapped in v.optional()):
 * - Single select: `'v.union(v.literal("draft"), v.literal("published"))'`
 * - Multi select (hasMany): `'v.array(v.union(v.literal("draft"), v.literal("published")))'`
 *
 * Goal: Validate config (including that defaultValue is one of the option values),
 * then build a union of literal validators. If hasMany is true, wrap in v.array().
 *
 * Edge cases:
 * - required=true + no defaultValue: throws VexFieldValidationError
 * - required=true + defaultValue not in option values: throws VexFieldValidationError
 * - Single option: `v.union(v.literal("only"))` — Convex accepts single-arg union
 * - Empty options array: should throw
 * - Duplicate option values: deduplicate before generating literals
 * - Options with special characters in values: escape quotes
 */
export function selectToValidatorString(
  meta: SelectFieldMeta<string>,
  collectionSlug: string,
  fieldName: string,
): string {
  // TODO: implement — for select, validateFieldConfig uses special "select" type
  // and checks defaultValue against the options array values
  throw new Error("Not implemented");
}
```

---

### Per-Field Index Files

Each field subfolder re-exports the config builder, schema function, and admin component.

**File: `packages/core/src/fields/text/index.ts`**

```typescript
export { text } from "./config";
export { textToValidatorString } from "./schema";
// export { TextFieldInput, textFieldZodSchema } from "./admin"; // uncomment when admin spec is implemented
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

### Per-Field Admin Subfolders (Stubs)

Each field subfolder contains an `admin/` directory with two concerns:

1. **`input.ts`** — React component that renders the form input for this field type in the admin panel
2. **`zod.ts`** — Function that produces a Zod schema fragment for this field type, used by TanStack Form for client-side validation

These are **stubs** — the full implementation is covered in the next spec (admin form generation).

The admin input components read the field's `_meta` to determine rendering behavior:

- `admin.hidden` → don't render
- `admin.readOnly` → render as disabled
- `admin.position` → "main" or "sidebar" placement
- `admin.width` → "full" or "half" width
- `admin.placeholder` → input placeholder text
- `admin.description` → helper text below input

The zod schema functions read the field's `_meta` to produce the correct validation:

- `required` → `z.string()` vs `z.string().optional()`
- `minLength` / `maxLength` → `z.string().min(n).max(n)`
- `min` / `max` → `z.number().min(n).max(n)`
- `options` → `z.enum([...])` for select fields

A dynamic form renderer in the admin panel will iterate over a collection's fields config, call each field's zod function to build a combined schema, and render the matching input component. TanStack Form handles state management and validation; Convex mutations handle persistence.

**File: `packages/core/src/fields/text/admin/index.ts`** (stub)

```typescript
// export { TextFieldInput } from "./input";
// export { textFieldZodSchema } from "./zod";
```

**File: `packages/core/src/fields/text/admin/input.ts`** (stub)

```typescript
// Text field admin input component.
// Renders a text input (single line) or textarea (if configured).
// Respects: label, placeholder, description, readOnly, hidden, width, position.
// Validates: minLength, maxLength at the form level.
// Implementation in next spec.
```

**File: `packages/core/src/fields/text/admin/zod.ts`** (stub)

```typescript
// import type { TextFieldMeta } from "../../../types";
// import { z } from "zod";
//
// Produces a Zod schema for a text field based on its _meta.
//
// Examples:
//   required, minLength: 1, maxLength: 200  → z.string().min(1).max(200)
//   optional, no constraints                → z.string().optional()
//   required, no constraints                → z.string()
//
// Implementation in next spec.
```

**File: `packages/core/src/fields/number/admin/index.ts`** (stub)

```typescript
// export { NumberFieldInput } from "./input";
// export { numberFieldZodSchema } from "./zod";
```

**File: `packages/core/src/fields/number/admin/input.ts`** (stub)

```typescript
// Number field admin input component.
// Renders a numeric input with optional step/min/max constraints.
// Respects: label, placeholder, description, readOnly, hidden, width, position.
// Validates: min, max, step at the form level.
// Implementation in next spec.
```

**File: `packages/core/src/fields/number/admin/zod.ts`** (stub)

```typescript
// import type { NumberFieldMeta } from "../../../types";
// import { z } from "zod";
//
// Produces a Zod schema for a number field based on its _meta.
//
// Examples:
//   required, min: 0, max: 100  → z.number().min(0).max(100)
//   optional, step: 0.01        → z.number().optional()
//   required, no constraints    → z.number()
//
// Implementation in next spec.
```

**File: `packages/core/src/fields/checkbox/admin/index.ts`** (stub)

```typescript
// export { CheckboxFieldInput } from "./input";
// export { checkboxFieldZodSchema } from "./zod";
```

**File: `packages/core/src/fields/checkbox/admin/input.ts`** (stub)

```typescript
// Checkbox field admin input component.
// Renders a toggle/checkbox control.
// Respects: label, description, readOnly, hidden, width, position.
// Implementation in next spec.
```

**File: `packages/core/src/fields/checkbox/admin/zod.ts`** (stub)

```typescript
// import type { CheckboxFieldMeta } from "../../../types";
// import { z } from "zod";
//
// Produces a Zod schema for a checkbox field based on its _meta.
//
// Examples:
//   required (always has default)  → z.boolean()
//   optional                       → z.boolean().optional()
//
// Implementation in next spec.
```

**File: `packages/core/src/fields/select/admin/index.ts`** (stub)

```typescript
// export { SelectFieldInput } from "./input";
// export { selectFieldZodSchema } from "./zod";
```

**File: `packages/core/src/fields/select/admin/input.ts`** (stub)

```typescript
// Select field admin input component.
// Renders a dropdown (single) or multi-select (hasMany) control.
// Options come from the field's _meta.options array.
// Respects: label, description, readOnly, hidden, width, position.
// Implementation in next spec.
```

**File: `packages/core/src/fields/select/admin/zod.ts`** (stub)

```typescript
// import type { SelectFieldMeta } from "../../../types";
// import { z } from "zod";
//
// Produces a Zod schema for a select field based on its _meta.
//
// Examples:
//   required, single-select   → z.enum(["draft", "published"])
//   optional, single-select   → z.enum(["draft", "published"]).optional()
//   required, hasMany          → z.array(z.enum(["tag1", "tag2"]))
//   optional, hasMany          → z.array(z.enum(["tag1", "tag2"])).optional()
//
// If defaultValue is set, validated against options in validateFieldConfig.
//
// Implementation in next spec.
```

---

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

**File: `packages/core/src/schema/validate.ts`**

```typescript
import type { BaseFieldMeta } from "../types";
import { VexFieldValidationError } from "../errors";

/**
 * Validation result for a field's config.
 * Used by per-field validator functions to determine optional wrapping.
 */
export interface FieldValidationResult {
  /** Whether the field should be wrapped in v.optional() */
  isOptional: boolean;
}

/**
 * Validates a field's configuration and determines if it should be optional.
 * Called by each per-field validator function before generating the validator string.
 *
 * Checks:
 * 1. If required=true and defaultValue is undefined → throw VexFieldValidationError
 * 2. If defaultValue is provided, verify it matches the expected type → throw VexFieldValidationError
 *
 * @param meta - The field metadata to validate
 * @param collectionSlug - The collection slug (for error messages)
 * @param fieldName - The field name (for error messages)
 * @param expectedType - The expected typeof for defaultValue (e.g., "string", "number", "boolean")
 * @returns FieldValidationResult with isOptional flag
 *
 * Edge cases:
 * - required=true, no defaultValue: throw
 * - required=true, defaultValue present and correct type: isOptional=false
 * - required=false or undefined: isOptional=true
 * - defaultValue wrong type: throw regardless of required
 * - Select fields: expectedType validation is handled differently (checked against option values)
 */
export function validateFieldConfig(
  meta: BaseFieldMeta & { defaultValue?: unknown },
  collectionSlug: string,
  fieldName: string,
  expectedType: string,
): FieldValidationResult {
  // TODO: implement
  throw new Error("Not implemented");
}

/**
 * Wraps a validator string in v.optional() if the field is optional.
 * Convenience helper used after validateFieldConfig().
 */
export function wrapOptional(validator: string, isOptional: boolean): string {
  return isOptional ? `v.optional(${validator})` : validator;
}
```

**File: `packages/core/src/schema/extract.ts`**

```typescript
import type { VexField, BaseFieldMeta } from "../types";

/**
 * Converts a VexField to its Convex validator string representation.
 * Dispatches to the appropriate per-field validator function based on `_meta.type`.
 *
 * Each per-field function handles its own validation (via validateFieldConfig())
 * and its own v.optional() wrapping. This dispatcher just routes by type.
 *
 * Goal: Central dispatcher that maps field type → validator string.
 * This function is called by generateVexSchema() for each field in each collection.
 *
 * @param field - The VexField to convert
 * @param collectionSlug - The collection slug (passed through for error messages)
 * @param fieldName - The field name (passed through for error messages)
 *
 * Edge cases:
 * - Unknown field type: throw with descriptive error including the type string
 * - index property on _meta: ignored here — handled by collectIndexes()
 * - Validation (required/defaultValue) is handled inside each per-field function
 */
export function fieldToValidatorString(
  field: VexField<any, any>,
  collectionSlug: string,
  fieldName: string,
): string {
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
export function collectIndexes(
  collection: VexCollection<any>,
): ResolvedIndex[] {
  // TODO: implement
  throw new Error("Not implemented");
}
```

**File: `packages/core/src/schema/merge.ts`**

```typescript
import type { VexField, BaseFieldMeta } from "../types";
import type { AuthTableDefinition, AuthFieldDefinition } from "../auth/types";
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
export function mergeAuthTableWithCollection(
  authTable: AuthTableDefinition,
  collection: VexCollection<any>,
): MergedFieldsResult {
  // TODO: implement
  throw new Error("Not implemented");
}
```

**File: `packages/core/src/schema/slugs.ts`**

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
   * Edge cases:
   * - Auth table slug matches user collection slug: NOT a conflict — skip
   *   registration (user collection already registered, merge happens later)
   * - System table prefixed with "vex_" should not conflict with user tables
   *   because defineCollection already warns about "vex_" prefix
   */
  register(slug: string, source: SlugSource, location: string): void {
    const existing = this.registrations.get(slug);
    if (existing) {
      // Auth table overlapping with user collection is expected — it means
      // the user wants to customize that auth table. The user collection
      // registration takes precedence; merge happens during schema generation.
      if (
        (existing.source === "user-collection" && source === "auth-table") ||
        (existing.source === "auth-table" && source === "user-collection")
      ) {
        // Keep the user-collection registration, skip the auth-table one
        if (source === "user-collection") {
          this.registrations.set(slug, { slug, source, location });
        }
        return;
      }
      throw new VexSlugConflictError(
        slug,
        existing.source,
        existing.location,
        source,
        location,
      );
    }
    this.registrations.set(slug, { slug, source, location });
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
export function buildSlugRegistry(
  config: import("../types").VexConfig,
): SlugRegistry {
  // TODO: implement
  throw new Error("Not implemented");
}
```

**File: `packages/core/src/schema/generate.ts`**

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
export function generateVexSchema(config: VexConfig): string {
  // TODO: implement
  throw new Error("Not implemented");
}
````

**File: `packages/core/src/schema/index.ts`**

```typescript
export { generateVexSchema } from "./generate";
export { fieldToValidatorString } from "./extract";
export { validateFieldConfig, wrapOptional } from "./validate";
export type { FieldValidationResult } from "./validate";
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

// Schema generation
export { generateVexSchema } from "./schema";
export { fieldToValidatorString } from "./schema";
export { mergeAuthTableWithCollection } from "./schema";
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
} from "./schema";

// Error types
export {
  VexError,
  VexSlugConflictError,
  VexFieldValidationError,
  VexAuthConfigError,
} from "./errors";
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
  it("returns v.string() for a required text field", () => {
    const meta: TextFieldMeta = {
      type: "text",
      required: true,
      defaultValue: "x",
    };
    expect(textToValidatorString(meta, "posts", "title")).toBe("v.string()");
  });

  it("returns v.optional(v.string()) for an optional text field", () => {
    const meta: TextFieldMeta = { type: "text" };
    expect(textToValidatorString(meta, "posts", "subtitle")).toBe(
      "v.optional(v.string())",
    );
  });

  it("returns v.optional(v.string()) regardless of minLength/maxLength", () => {
    const meta: TextFieldMeta = { type: "text", minLength: 1, maxLength: 200 };
    expect(textToValidatorString(meta, "posts", "excerpt")).toBe(
      "v.optional(v.string())",
    );
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
    expect(textToValidatorString(meta, "posts", "title")).toBe("v.string()");
  });

  it("throws when required with no defaultValue", () => {
    const meta: TextFieldMeta = { type: "text", required: true };
    expect(() => textToValidatorString(meta, "posts", "title")).toThrow(
      "title",
    );
  });

  it("throws when defaultValue is wrong type", () => {
    const meta: TextFieldMeta = {
      type: "text",
      required: true,
      defaultValue: 42 as any,
    };
    expect(() => textToValidatorString(meta, "posts", "title")).toThrow(
      "title",
    );
  });
});
```

**File: `packages/core/src/fields/number/schema.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { numberToValidatorString } from "./schema";
import type { NumberFieldMeta } from "../../types";

describe("numberToValidatorString", () => {
  it("returns v.float64() for a required number field", () => {
    const meta: NumberFieldMeta = {
      type: "number",
      required: true,
      defaultValue: 0,
    };
    expect(numberToValidatorString(meta, "items", "count")).toBe("v.float64()");
  });

  it("returns v.optional(v.float64()) for an optional number field", () => {
    const meta: NumberFieldMeta = { type: "number" };
    expect(numberToValidatorString(meta, "items", "count")).toBe(
      "v.optional(v.float64())",
    );
  });

  it("returns v.optional(v.float64()) regardless of min/max/step", () => {
    const meta: NumberFieldMeta = {
      type: "number",
      min: 0,
      max: 100,
      step: 0.01,
    };
    expect(numberToValidatorString(meta, "items", "price")).toBe(
      "v.optional(v.float64())",
    );
  });

  it("throws when required with no defaultValue", () => {
    const meta: NumberFieldMeta = { type: "number", required: true };
    expect(() => numberToValidatorString(meta, "items", "count")).toThrow(
      "count",
    );
  });

  it("throws when defaultValue is wrong type", () => {
    const meta: NumberFieldMeta = {
      type: "number",
      required: true,
      defaultValue: "ten" as any,
    };
    expect(() => numberToValidatorString(meta, "items", "count")).toThrow(
      "count",
    );
  });
});
```

**File: `packages/core/src/fields/checkbox/schema.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { checkboxToValidatorString } from "./schema";
import type { CheckboxFieldMeta } from "../../types";

describe("checkboxToValidatorString", () => {
  it("returns v.optional(v.boolean()) for an optional checkbox", () => {
    const meta: CheckboxFieldMeta = { type: "checkbox" };
    expect(checkboxToValidatorString(meta, "posts", "featured")).toBe(
      "v.optional(v.boolean())",
    );
  });

  it("returns v.boolean() for a required checkbox with defaultValue", () => {
    const meta: CheckboxFieldMeta = {
      type: "checkbox",
      required: true,
      defaultValue: true,
    };
    expect(checkboxToValidatorString(meta, "posts", "featured")).toBe(
      "v.boolean()",
    );
  });

  it("throws when required with no defaultValue", () => {
    const meta: CheckboxFieldMeta = { type: "checkbox", required: true };
    expect(() => checkboxToValidatorString(meta, "posts", "featured")).toThrow(
      "featured",
    );
  });

  it("throws when defaultValue is wrong type", () => {
    const meta: CheckboxFieldMeta = {
      type: "checkbox",
      required: true,
      defaultValue: "yes" as any,
    };
    expect(() => checkboxToValidatorString(meta, "posts", "featured")).toThrow(
      "featured",
    );
  });
});
```

**File: `packages/core/src/fields/select/schema.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { selectToValidatorString } from "./schema";
import type { SelectFieldMeta } from "../../types";

describe("selectToValidatorString", () => {
  it("returns optional union of literals for single-select", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
      ],
    };
    expect(selectToValidatorString(meta, "posts", "status")).toBe(
      'v.optional(v.union(v.literal("draft"), v.literal("published")))',
    );
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
    expect(selectToValidatorString(meta, "posts", "status")).toBe(
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
    expect(selectToValidatorString(meta, "posts", "tags")).toBe(
      'v.optional(v.array(v.union(v.literal("tag1"), v.literal("tag2"))))',
    );
  });

  it("handles single option", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      options: [{ value: "only", label: "Only Option" }],
    };
    expect(selectToValidatorString(meta, "posts", "status")).toBe(
      'v.optional(v.union(v.literal("only")))',
    );
  });

  it("throws on empty options", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      options: [],
    };
    expect(() => selectToValidatorString(meta, "posts", "status")).toThrow();
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
    expect(selectToValidatorString(meta, "posts", "status")).toBe(
      'v.optional(v.union(v.literal("a"), v.literal("b")))',
    );
  });

  it("escapes quotes in option values", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      options: [{ value: 'it\'s "fine"', label: "Quoted" }],
    };
    const result = selectToValidatorString(meta, "posts", "status");
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
    expect(selectToValidatorString(meta, "posts", "status")).toBe(
      'v.optional(v.union(v.literal("a"), v.literal("b")))',
    );
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
    expect(() => selectToValidatorString(meta, "posts", "status")).toThrow(
      "status",
    );
  });

  it("throws when defaultValue is not in options", () => {
    const meta: SelectFieldMeta<string> = {
      type: "select",
      required: true,
      defaultValue: "nonexistent",
      options: [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
    };
    expect(() => selectToValidatorString(meta, "posts", "status")).toThrow(
      "status",
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
    it("text field with required: true and defaultValue", () => {
      const field = text({ required: true, defaultValue: "Untitled" });
      expect(fieldToValidatorString(field, "posts", "title")).toBe(
        "v.string()",
      );
    });

    it("number field with required: true and defaultValue", () => {
      const field = number({ required: true, defaultValue: 0 });
      expect(fieldToValidatorString(field, "items", "count")).toBe(
        "v.float64()",
      );
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
      expect(fieldToValidatorString(field, "posts", "status")).toBe(
        'v.union(v.literal("a"), v.literal("b"))',
      );
    });
  });

  describe("optional fields (wrapped in v.optional)", () => {
    it("text field with no required option", () => {
      const field = text();
      expect(fieldToValidatorString(field, "posts", "subtitle")).toBe(
        "v.optional(v.string())",
      );
    });

    it("text field with required: false", () => {
      const field = text({ required: false });
      expect(fieldToValidatorString(field, "posts", "subtitle")).toBe(
        "v.optional(v.string())",
      );
    });

    it("number field without required", () => {
      const field = number({ min: 0 });
      expect(fieldToValidatorString(field, "items", "price")).toBe(
        "v.optional(v.float64())",
      );
    });

    it("checkbox field without required", () => {
      const field = checkbox();
      expect(fieldToValidatorString(field, "posts", "featured")).toBe(
        "v.optional(v.boolean())",
      );
    });

    it("select field without required", () => {
      const field = select({
        options: [{ value: "x", label: "X" }],
      });
      expect(fieldToValidatorString(field, "posts", "status")).toBe(
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
      expect(fieldToValidatorString(field, "posts", "tags")).toBe(
        'v.optional(v.array(v.union(v.literal("a"), v.literal("b"))))',
      );
    });
  });

  describe("index property does not affect validator", () => {
    it("text field with index still returns same validator", () => {
      const field = text({
        required: true,
        defaultValue: "x",
        index: "by_title",
      });
      expect(fieldToValidatorString(field, "posts", "title")).toBe(
        "v.string()",
      );
    });
  });

  describe("error cases", () => {
    it("throws on unknown field type", () => {
      const field = {
        _type: "",
        _meta: { type: "unknown_type" },
      } as any;
      expect(() => fieldToValidatorString(field, "posts", "mystery")).toThrow(
        "unknown_type",
      );
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

---

### Field Validation Tests

**File: `packages/core/src/schema/validate.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { validateFieldConfig, wrapOptional } from "./validate";
import { VexFieldValidationError } from "../errors";

describe("validateFieldConfig", () => {
  describe("optional fields", () => {
    it("returns isOptional: true when required is undefined", () => {
      const result = validateFieldConfig(
        { type: "text" },
        "posts",
        "title",
        "string",
      );
      expect(result.isOptional).toBe(true);
    });

    it("returns isOptional: true when required is false", () => {
      const result = validateFieldConfig(
        { type: "text", required: false },
        "posts",
        "title",
        "string",
      );
      expect(result.isOptional).toBe(true);
    });

    it("allows optional fields without defaultValue", () => {
      expect(() =>
        validateFieldConfig({ type: "text" }, "posts", "title", "string"),
      ).not.toThrow();
    });
  });

  describe("required fields", () => {
    it("returns isOptional: false when required is true with defaultValue", () => {
      const result = validateFieldConfig(
        { type: "text", required: true, defaultValue: "hello" },
        "posts",
        "title",
        "string",
      );
      expect(result.isOptional).toBe(false);
    });

    it("throws VexFieldValidationError when required with no defaultValue", () => {
      expect(() =>
        validateFieldConfig(
          { type: "text", required: true },
          "posts",
          "title",
          "string",
        ),
      ).toThrow(VexFieldValidationError);
    });

    it("error message includes collection slug and field name", () => {
      try {
        validateFieldConfig(
          { type: "text", required: true },
          "posts",
          "title",
          "string",
        );
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
        validateFieldConfig(
          { type: "text", required: true, defaultValue: "hello" },
          "posts",
          "title",
          "string",
        ),
      ).not.toThrow();
    });

    it("throws when defaultValue is number but expectedType is string", () => {
      expect(() =>
        validateFieldConfig(
          { type: "text", required: true, defaultValue: 42 },
          "posts",
          "title",
          "string",
        ),
      ).toThrow(VexFieldValidationError);
    });

    it("accepts number defaultValue for number expectedType", () => {
      expect(() =>
        validateFieldConfig(
          { type: "number", required: true, defaultValue: 0 },
          "items",
          "count",
          "number",
        ),
      ).not.toThrow();
    });

    it("throws when defaultValue is string but expectedType is number", () => {
      expect(() =>
        validateFieldConfig(
          { type: "number", required: true, defaultValue: "ten" },
          "items",
          "count",
          "number",
        ),
      ).toThrow(VexFieldValidationError);
    });

    it("accepts boolean defaultValue for boolean expectedType", () => {
      expect(() =>
        validateFieldConfig(
          { type: "checkbox", required: true, defaultValue: false },
          "posts",
          "featured",
          "boolean",
        ),
      ).not.toThrow();
    });

    it("throws when defaultValue is string but expectedType is boolean", () => {
      expect(() =>
        validateFieldConfig(
          { type: "checkbox", required: true, defaultValue: "yes" },
          "posts",
          "featured",
          "boolean",
        ),
      ).toThrow(VexFieldValidationError);
    });

    it("skips type checking for select expectedType (handled by select validator)", () => {
      // select validator checks defaultValue against option values, not typeof
      expect(() =>
        validateFieldConfig(
          { type: "select", required: true, defaultValue: "draft" },
          "posts",
          "status",
          "select",
        ),
      ).not.toThrow();
    });

    it("does not type-check defaultValue on optional fields", () => {
      // Optional field with wrong type defaultValue — still allowed
      // (the defaultValue may not be used, and TypeScript would catch this)
      expect(() =>
        validateFieldConfig(
          { type: "text", defaultValue: 42 },
          "posts",
          "title",
          "string",
        ),
      ).not.toThrow();
    });
  });
});

describe("wrapOptional", () => {
  it("wraps validator when isOptional is true", () => {
    expect(wrapOptional("v.string()", true)).toBe("v.optional(v.string())");
  });

  it("returns validator unchanged when isOptional is false", () => {
    expect(wrapOptional("v.string()", false)).toBe("v.string()");
  });

  it("wraps complex validators", () => {
    expect(wrapOptional('v.union(v.literal("a"), v.literal("b"))', true)).toBe(
      'v.optional(v.union(v.literal("a"), v.literal("b")))',
    );
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
import type { VexAuthAdapter } from "../auth/types";
import { VexSlugConflictError } from "../errors";

// Minimal auth adapter for tests that don't focus on auth
const minimalAuth: VexAuthAdapter = {
  name: "better-auth",
  tables: [],
};

describe("SlugRegistry", () => {
  it("registers unique slugs without throwing", () => {
    const registry = new SlugRegistry();
    registry.register("posts", "user-collection", "collections/posts.ts");
    registry.register("users", "user-collection", "collections/users.ts");
    registry.register("account", "auth-table", "@vexcms/better-auth");

    expect(registry.getAll()).toHaveLength(3);
  });

  it("allows auth table slug to overlap with user collection slug (merge)", () => {
    const registry = new SlugRegistry();
    registry.register("user", "user-collection", "collections/user.ts");

    // Auth table "user" overlapping with user collection "user" is expected
    // — this means the user wants to customize the auth table's admin UI
    expect(() =>
      registry.register("user", "auth-table", "@vexcms/better-auth"),
    ).not.toThrow();

    // The user-collection registration should take precedence
    const all = registry.getAll();
    const userRegistrations = all.filter((r) => r.slug === "user");
    expect(userRegistrations).toHaveLength(1);
    expect(userRegistrations[0].source).toBe("user-collection");
  });

  it("throws VexSlugConflictError on non-auth/collection duplicate", () => {
    const registry = new SlugRegistry();
    registry.register("data", "user-collection", "collections/data.ts");

    // Two user collections with same slug: real conflict
    expect(() =>
      registry.register("data", "user-collection", "collections/data2.ts"),
    ).toThrow(VexSlugConflictError);
  });

  it("includes both sources in error message for real conflicts", () => {
    const registry = new SlugRegistry();
    registry.register("data", "user-global", "globals/data.ts");

    try {
      registry.register("data", "auth-table", "@vexcms/better-auth");
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
    registry.register("posts", "user-collection", "collections/posts.ts");
    registry.register("users", "user-collection", "collections/users.ts");

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
    const registry = buildSlugRegistry(config);
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
    const registry = buildSlugRegistry(config);
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
    const registry = buildSlugRegistry(config);
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
    const registry = buildSlugRegistry(config);
    const all = registry.getAll();

    // tableName is used as the slug for the registry, not the collection slug
    expect(all.find((r) => r.slug === "blog_articles")).toBeDefined();
    expect(all.find((r) => r.slug === "articles")).toBeUndefined();
  });
});
```

---

### Field Merge Tests

**File: `packages/core/src/schema/merge.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { mergeAuthTableWithCollection } from "./merge";
import { defineCollection } from "../config/defineCollection";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { select } from "../fields/select";
import type { AuthTableDefinition } from "../auth/types";

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
        createdAt: { validator: "v.float64()" },
        updatedAt: { validator: "v.float64()" },
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

  it("user-only fields converted via fieldToValidatorString", () => {
    const authTable: AuthTableDefinition = {
      slug: "users",
      fields: {
        email: { validator: "v.string()" },
      },
    };

    const result = mergeAuthTableWithCollection(authTable, users);

    // postCount is user-only, number field without required → optional
    expect(result.fields["postCount"]).toBe("v.optional(v.float64())");
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
        createdAt: { validator: "v.float64()" },
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
      expect(output).toContain("count: v.float64()");
      expect(output).toContain("active: v.optional(v.boolean())");
      expect(output).toContain(
        'status: v.union(v.literal("open"), v.literal("closed"))',
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
            createdAt: { validator: "v.float64()" },
            updatedAt: { validator: "v.float64()" },
          },
        },
        {
          slug: "account",
          fields: {
            userId: { validator: 'v.id("users")' },
            accountId: { validator: "v.string()" },
            providerId: { validator: "v.string()" },
            createdAt: { validator: "v.float64()" },
            updatedAt: { validator: "v.float64()" },
          },
          indexes: [{ name: "by_userId", fields: ["userId"] }],
        },
        {
          slug: "session",
          fields: {
            token: { validator: "v.string()" },
            userId: { validator: 'v.id("users")' },
            expiresAt: { validator: "v.float64()" },
            createdAt: { validator: "v.float64()" },
            updatedAt: { validator: "v.float64()" },
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
      expect(output).toContain("createdAt: v.float64()");

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

## Phase C: Implementation Summaries

This section describes what each function must accomplish. The actual implementations are left for the developer, guided by the tests in Phase B.

### `validateFieldConfig`

**Goal:** Validate a field's required/defaultValue configuration. Throw `VexFieldValidationError` if invalid. Return `{ isOptional }` for the caller to use with `wrapOptional()`.

**Steps:**

1. If `required=true` and `defaultValue` is undefined → throw `VexFieldValidationError`
2. If `defaultValue` is provided and `expectedType !== "select"`:
   - Check `typeof defaultValue === expectedType` → throw if mismatch
3. If `expectedType === "select"`: special handling in the select validator (check defaultValue against option values)
4. Return `{ isOptional: !meta.required }`

---

### `textToValidatorString`

**Goal:** Call `validateFieldConfig(meta, collectionSlug, fieldName, "string")`, then return `wrapOptional("v.string()", result.isOptional)`. minLength/maxLength are runtime validation, not schema.

---

### `numberToValidatorString`

**Goal:** Call `validateFieldConfig(meta, collectionSlug, fieldName, "number")`, then return `wrapOptional("v.float64()", result.isOptional)`. min/max/step are runtime validation, not schema.

---

### `checkboxToValidatorString`

**Goal:** Call `validateFieldConfig(meta, collectionSlug, fieldName, "boolean")`, then return `wrapOptional("v.boolean()", result.isOptional)`.

---

### `selectToValidatorString`

**Goal:** Validate config (including that defaultValue is one of the option values), build a union of literal validators, wrap in `v.array()` if `hasMany`.

**Steps:**

1. Call `validateFieldConfig(meta, collectionSlug, fieldName, "select")` for required check
2. If defaultValue is provided, check it's in the options values array → throw if not
3. Deduplicate option values
4. Throw if options array is empty
5. Escape quote characters in values
6. Build `v.literal("value")` for each unique value
7. Join with `v.union(...)`
8. If `hasMany`, wrap in `v.array(...)`
9. Call `wrapOptional()` with result

---

### `fieldToValidatorString`

**Goal:** Dispatch to the correct per-field validator function based on `field._meta.type`. Each per-field function handles its own validation and optional wrapping.

**Steps:**

1. Read `field._meta.type`
2. Switch on type: `"text"` → `textToValidatorString(meta, collectionSlug, fieldName)`, etc.
3. If type is unrecognized, throw with the type string in the error message
4. The `index` property on `_meta` is intentionally ignored — handled by `collectIndexes()`

---

### `collectIndexes`

**Goal:** Gather all indexes for a collection from per-field `index` properties, collection-level `indexes` config, and the auto-generated `useAsTitle` index. Deduplicate by name.

**Steps:**

1. Walk all fields in `collection.config.fields`
2. For each field with a non-empty `_meta.index` string, create `{ name: meta.index, fields: [fieldName] }`
3. Check for duplicate index names among per-field indexes — if two fields claim the same index name, throw
4. Get collection-level indexes from `collection.config.indexes ?? []`
5. Merge: collection-level indexes override per-field indexes with the same name
6. If `collection.config.admin?.useAsTitle` is set:
   a. Check if the referenced field already has an index (either per-field or collection-level)
   b. If no existing index covers that field, auto-create `{ name: "by_<fieldName>", fields: ["<fieldName>"] }`
   c. If an auto-generated index name collides with an existing one, skip (the explicit one wins)
7. Return the deduplicated array

---

### `SlugRegistry.register`

**Goal:** Register a slug. Throw `VexSlugConflictError` immediately if the slug is already registered. This ensures schema generation fails fast at the exact point of conflict, with both the existing and new registration details in the error message.

---

### `buildSlugRegistry`

**Goal:** Create a SlugRegistry and populate it from the full VexConfig. Each `register()` call throws immediately on duplicate slug, except auth table slugs that overlap with user collection slugs (this is expected merge behavior).

**Steps:**

1. Create a new SlugRegistry
2. Register each collection's `tableName ?? slug` as `"user-collection"` (throws on duplicate)
3. Register each global slug as `"user-global"` (throws on duplicate)
4. Register each auth table slug as `"auth-table"` — if an auth table slug matches a user collection slug, the registry allows it (the user collection registration takes precedence; merge happens during schema generation)
5. Return the registry

---

### `mergeAuthTableWithCollection`

**Goal:** Combine an auth table's fields with a user-defined collection's fields for schema generation. The auth table is already fully resolved (no plugin resolution needed here). This works for ANY auth table that has a matching user collection (matched by slug), not just the user table.

**Steps:**

1. For each auth table field: if user also defines it → `overlapping`; if not → `authOnly`
2. For each user field: if auth table doesn't define it → `userOnly`
3. Build merged fields map: auth table fields first (as raw validator strings), then user-only fields (converted via `fieldToValidatorString`)
4. For overlapping fields, use the auth table's validator string

---

### `generateVexSchema`

**Goal:** Produce the complete schema TypeScript source string (written to `config.schema.outputPath`).

**Steps:**

1. Build slug registry from config (throws immediately on duplicate slug; auth table slugs overlapping with user collection slugs are allowed — merge)
2. Auth adapter is already fully resolved (vexBetterAuth() handled plugin resolution)
3. Build the header (warning comment referencing output path + imports)
4. Build a set of auth table slugs for lookup
5. For each user collection:
   a. Check if a matching auth table exists (by slug)
   b. If yes: merge auth table fields with collection fields via `mergeAuthTableWithCollection()` (auth validators win for schema, user admin config wins for UI)
   c. If no matching auth table: convert user fields via `fieldToValidatorString`
   d. Collect indexes via `collectIndexes()` — includes per-field, collection-level, and auto-generated `useAsTitle` indexes
   e. Generate `export const <tableName ?? slug> = defineTable({ ... })`
   f. Chain `.index(...)` calls for each resolved index (including auth table indexes if merged)
6. For each auth table that does NOT have a matching user collection:
   a. Generate `export const <slug> = defineTable({ ... })` — relationship fields use `v.id()` as provided by the auth adapter
   b. Chain `.index(...)` calls for each index definition
7. Join all parts with newlines and return

**Edge cases to handle:**

- Empty fields object → `defineTable({})` (valid but unusual)
- Auth table with no indexes → no `.index()` calls
- Multiple indexes on one table → chain `.index()` calls
- Auth table merged with user collection → indexes from both the auth table and the collection's `collectIndexes()` are combined
- Per-field indexes on user collection fields → collected from the user's field definitions (not from auth fields, which use raw validator strings)
- Auth table relationship fields → output `v.id("<slug>")` as the validator string (already encoded by the auth adapter)
- `admin.useAsTitle` on a collection → auto-generates `by_<fieldName>` index if none exists on that field
- Auth table with no matching user collection → generated as standalone table (no admin UI customization)

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
    timestamp: v.float64(),
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
export type { VexAuthAdapter, AuthTableDefinition, AuthFieldDefinition } from "@vexcms/core";
```

### Extract auth tables

```typescript
// packages/better-auth/src/extract/tables.ts
import type { BetterAuthOptions } from "better-auth";
import type { AuthTableDefinition } from "@vexcms/core";
import { betterAuthTypeToValidator } from "../validators";

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
  // TODO: implement — use getAuthTables() from "better-auth/db"
  // and betterAuthTypeToValidator() to convert field types
  throw new Error("Not implemented");
}
```

### Validator mapping

```typescript
// packages/better-auth/src/validators.ts
import type { AuthFieldDefinition } from "@vexcms/core";

/**
 * Maps a better-auth field type string to a Convex validator string.
 *
 * better-auth uses type strings like "string", "number", "boolean",
 * "string[]", "date", etc. This function converts them to the
 * corresponding Convex validator string representation.
 *
 * @param type - The better-auth field type (e.g., "string", "number", "boolean", "date")
 * @param required - Whether the field is required (determines v.optional() wrapping)
 * @param references - Optional table reference for relationship fields (produces v.id())
 * @returns Convex validator string (e.g., "v.string()", "v.optional(v.float64())")
 *
 * Type mappings:
 * - "string" → "v.string()" / "v.optional(v.string())"
 * - "number" → "v.float64()" / "v.optional(v.float64())"
 * - "boolean" → "v.boolean()" / "v.optional(v.boolean())"
 * - "date" → "v.float64()" / "v.optional(v.float64())" (stored as epoch ms)
 * - "string[]" → "v.array(v.string())" / "v.optional(v.array(v.string()))"
 * - references provided → "v.id(\"<table>\")" / "v.optional(v.id(\"<table>\"))"
 *
 * Edge cases:
 * - Unknown type string: throw with descriptive error
 * - Nullable fields: use v.optional() wrapping
 */
export function betterAuthTypeToValidator(
  type: string,
  required: boolean,
  references?: { model: string },
): string {
  // TODO: implement
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
│   ├── validators.ts                 # betterAuthTypeToValidator()
│   ├── validators.test.ts            # unit tests for validator mapping
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

All tests in `packages/core/src/`:

- [ ] `fields/text/schema.test.ts` — text validator generation
- [ ] `fields/number/schema.test.ts` — number validator generation
- [ ] `fields/checkbox/schema.test.ts` — checkbox validator generation
- [ ] `fields/select/schema.test.ts` — select validator generation (single, multi, empty, dedupe, escape)
- [ ] `schema/extract.test.ts` — dispatcher with required/optional wrapping, index ignored
- [ ] `schema/indexes.test.ts` — per-field indexes, collection-level indexes, dedup, collision detection, useAsTitle auto-index
- [ ] `schema/slugs.test.ts` — slug registry, conflict detection, buildSlugRegistry
- [ ] `schema/merge.test.ts` — auth table merging with user collections
- [ ] `schema/generate.test.ts` — full schema generation with indexes (including useAsTitle auto-index), auth (with v.id() relationship fields), various configs

Run with: `pnpm --filter @vexcms/core test`
