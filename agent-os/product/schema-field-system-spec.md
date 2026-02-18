# Schema & Field System Implementation Spec

This document defines the implementation plan for the Vex CMS schema and field system. It covers the type definitions, required functions, and edge cases for building a fully type-safe, Convex-native CMS configuration layer.

**Referenced by**: [roadmap.md](./roadmap.md) - Phase 1.1, 1.2, 1.5

**Depends on**: None (foundation spec - all other specs build on this)

---

## Design Goals

1. **Full type safety** - Field defaults, options, and relationships are type-checked at compile time
2. **Convex-native** - Wraps Convex validators, no translation layer or code generation step
3. **Distributed configs** - Blocks and fields can be defined anywhere and aggregated via imports
4. **Payload-like DX** - Familiar patterns for Payload CMS users with improved type inference
5. **Metadata separation** - CMS metadata (labels, admin config) is separate from database schema

---

## Type Definitions

### Core Field Types

```typescript
import { Validator, GenericValidator } from "convex/values";

/**
 * Branded type marker for VexField identification
 */
type VexFieldBrand = { readonly _brand: "VexField" };

/**
 * Base field representation carrying both Convex validator and CMS metadata
 */
interface VexField<
  TValidator extends GenericValidator,
  TMeta extends BaseFieldMeta = BaseFieldMeta
> extends VexFieldBrand {
  readonly _validator: TValidator;
  readonly _meta: TMeta;
}

/**
 * Extract the TypeScript type from a VexField's validator
 */
type InferFieldType<F> = F extends VexField<infer V, any>
  ? V extends Validator<infer T, any, any>
    ? T
    : never
  : never;

/**
 * Extract field type from a record of VexFields
 */
type InferFieldsType<F extends Record<string, VexField<any, any>>> = {
  [K in keyof F]: InferFieldType<F[K]>;
};
```

### Field Metadata Types

```typescript
/**
 * Access control function signature
 */
type AccessFn<TDoc = any> = (context: {
  user: User | null;
  doc?: TDoc;
  data?: Partial<TDoc>;
}) => boolean | Promise<boolean>;

/**
 * Hook function signature
 */
type HookFn<TDoc = any, TReturn = TDoc> = (context: {
  data: TDoc;
  originalDoc?: TDoc;
  user: User | null;
  operation: "create" | "update" | "delete";
}) => TReturn | Promise<TReturn>;

/**
 * Base metadata shared by all field types
 */
interface BaseFieldMeta {
  readonly type: string;
  label?: string;
  description?: string;
  required?: boolean;
  localized?: boolean;
  admin?: BaseAdminConfig;
  access?: {
    read?: AccessFn;
    update?: AccessFn;
  };
  hooks?: {
    beforeChange?: (value: any, context: HookContext) => any;
    afterRead?: (value: any, context: HookContext) => any;
  };
}

/**
 * Admin panel configuration for fields
 */
interface BaseAdminConfig {
  hidden?: boolean | ((context: AdminContext) => boolean);
  readOnly?: boolean | ((context: AdminContext) => boolean);
  position?: "main" | "sidebar";
  width?: "full" | "half" | "third";
  condition?: (data: any, siblingData: any) => boolean;
}

/**
 * Text field specific metadata
 */
interface TextFieldMeta extends BaseFieldMeta {
  readonly type: "text";
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
  admin?: BaseAdminConfig & {
    placeholder?: string;
    multiline?: boolean;
  };
}

/**
 * Number field specific metadata
 */
interface NumberFieldMeta extends BaseFieldMeta {
  readonly type: "number";
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  admin?: BaseAdminConfig & {
    placeholder?: string;
  };
}

/**
 * Select field specific metadata with constrained options
 */
interface SelectFieldMeta<T extends string> extends BaseFieldMeta {
  readonly type: "select";
  options: readonly SelectOption<T>[];
  defaultValue?: T;
  hasMany?: boolean;
  admin?: BaseAdminConfig & {
    isClearable?: boolean;
    isSortable?: boolean;
  };
}

interface SelectOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

/**
 * Checkbox field specific metadata
 */
interface CheckboxFieldMeta extends BaseFieldMeta {
  readonly type: "checkbox";
  defaultValue?: boolean;
}

/**
 * Date field specific metadata
 */
interface DateFieldMeta extends BaseFieldMeta {
  readonly type: "date";
  defaultValue?: number | (() => number);
  admin?: BaseAdminConfig & {
    pickerAppearance?: "dayOnly" | "dayAndTime" | "timeOnly";
    displayFormat?: string;
  };
}

/**
 * Relationship field specific metadata
 */
interface RelationshipFieldMeta extends BaseFieldMeta {
  readonly type: "relationship";
  to: string;
  hasMany?: boolean;
  admin?: BaseAdminConfig & {
    displayField?: string;
    allowCreate?: boolean;
  };
}

/**
 * Array field specific metadata
 */
interface ArrayFieldMeta<TFields extends Record<string, VexField<any, any>>>
  extends BaseFieldMeta {
  readonly type: "array";
  fields: TFields;
  minRows?: number;
  maxRows?: number;
  defaultValue?: InferFieldsType<TFields>[];
  admin?: BaseAdminConfig & {
    initCollapsed?: boolean;
    components?: {
      RowLabel?: React.ComponentType<{ data: any; index: number }>;
    };
  };
}

/**
 * Group field specific metadata (non-repeating nested fields)
 */
interface GroupFieldMeta<TFields extends Record<string, VexField<any, any>>>
  extends BaseFieldMeta {
  readonly type: "group";
  fields: TFields;
  defaultValue?: Partial<InferFieldsType<TFields>>;
  admin?: BaseAdminConfig & {
    hideGutter?: boolean;
  };
}

/**
 * Blocks field specific metadata
 */
interface BlocksFieldMeta<TBlocks extends readonly VexBlock<any>[]>
  extends BaseFieldMeta {
  readonly type: "blocks";
  blocks: TBlocks;
  minRows?: number;
  maxRows?: number;
  defaultValue?: InferBlocksType<TBlocks>[];
  admin?: BaseAdminConfig & {
    initCollapsed?: boolean;
  };
}

/**
 * Upload field specific metadata
 */
interface UploadFieldMeta extends BaseFieldMeta {
  readonly type: "upload";
  collection: string;
  hasMany?: boolean;
  admin?: BaseAdminConfig & {
    allowCreate?: boolean;
  };
}
```

### Block Types

```typescript
/**
 * Block definition with typed fields
 */
interface VexBlock<TFields extends Record<string, VexField<any, any>>> {
  readonly slug: string;
  readonly fields: TFields;
  labels?: {
    singular: string;
    plural: string;
  };
  admin?: {
    group?: string;
  };
  /** Dynamic import for the React component */
  component?: () => Promise<{ default: React.ComponentType<any> }>;
}

/**
 * Infer the document type from a block
 */
type InferBlockType<B> = B extends VexBlock<infer F>
  ? { blockType: B["slug"] } & InferFieldsType<F>
  : never;

/**
 * Infer union type from array of blocks
 */
type InferBlocksType<B extends readonly VexBlock<any>[]> = {
  [K in keyof B]: InferBlockType<B[K]>;
}[number];
```

### Collection Types

```typescript
/**
 * Collection configuration
 */
interface CollectionConfig<TFields extends Record<string, VexField<any, any>>> {
  fields: TFields;

  labels?: {
    singular: string;
    plural: string;
  };

  admin?: {
    group?: string;
    icon?: string;
    useAsTitle?: keyof TFields;
    defaultColumns?: (keyof TFields)[];
    disableCreate?: boolean;
    disableDelete?: boolean;
  };

  livePreview?: {
    url: string | ((doc: InferFieldsType<TFields>) => string);
    breakpoints?: { label: string; width: number; height: number }[];
  };

  versions?: {
    drafts?: boolean;
    maxVersions?: number;
    autosave?: {
      interval: number;
    };
  };

  uploads?: {
    mimeTypes?: string[];
    maxSize?: number;
    imageSizes?: ImageSize[];
    storage?: "convex" | "s3" | StorageAdapter;
  };

  hooks?: {
    beforeCreate?: HookFn<InferFieldsType<TFields>>;
    afterCreate?: HookFn<InferFieldsType<TFields>, void>;
    beforeUpdate?: HookFn<InferFieldsType<TFields>>;
    afterUpdate?: HookFn<InferFieldsType<TFields>, void>;
    beforeDelete?: HookFn<InferFieldsType<TFields>, void>;
    afterDelete?: HookFn<InferFieldsType<TFields>, void>;
  };

  access?: {
    create?: AccessFn<InferFieldsType<TFields>>;
    read?: AccessFn<InferFieldsType<TFields>>;
    update?: AccessFn<InferFieldsType<TFields>>;
    delete?: AccessFn<InferFieldsType<TFields>>;
  };
}

/**
 * Defined collection with inferred document type
 */
interface VexCollection<TFields extends Record<string, VexField<any, any>>> {
  readonly name: string;
  readonly config: CollectionConfig<TFields>;
  /** Type helper for document shape (runtime value is empty object) */
  readonly _docType: InferFieldsType<TFields>;
}
```

### Global Types

```typescript
/**
 * Global (singleton) configuration - same as collection but no list view
 */
interface GlobalConfig<TFields extends Record<string, VexField<any, any>>> {
  fields: TFields;

  label?: string;

  admin?: {
    group?: string;
    icon?: string;
  };

  livePreview?: {
    url: string | ((doc: InferFieldsType<TFields>) => string);
    breakpoints?: { label: string; width: number; height: number }[];
  };

  versions?: {
    drafts?: boolean;
    maxVersions?: number;
  };

  hooks?: {
    beforeUpdate?: HookFn<InferFieldsType<TFields>>;
    afterUpdate?: HookFn<InferFieldsType<TFields>, void>;
  };

  access?: {
    read?: AccessFn<InferFieldsType<TFields>>;
    update?: AccessFn<InferFieldsType<TFields>>;
  };
}

/**
 * Defined global with inferred document type
 */
interface VexGlobal<TFields extends Record<string, VexField<any, any>>> {
  readonly slug: string;
  readonly config: GlobalConfig<TFields>;
  readonly _docType: InferFieldsType<TFields>;
}
```

### Top-Level Config Types

```typescript
/**
 * Main Vex CMS configuration
 */
interface VexConfig {
  collections: VexCollection<any>[];
  globals?: VexGlobal<any>[];

  admin?: {
    user: string;
    meta?: {
      titleSuffix?: string;
      favicon?: string;
      ogImage?: string;
    };
    components?: {
      Logo?: React.ComponentType;
      Nav?: React.ComponentType;
    };
    livePreview?: {
      url?: string;
      breakpoints?: { label: string; width: number; height: number }[];
    };
  };

  hooks?: {
    afterInit?: () => void | Promise<void>;
  };

  upload?: {
    storage: "convex" | StorageAdapter;
  };
}
```

---

## Required Functions

### Field Factory Functions

#### `text(meta?: TextFieldMeta): VexField`

Creates a text field wrapping `v.string()`.

**Must accomplish:**
- Return object with `_validator` set to `v.string()`
- Attach `_meta` with type: "text" and provided options
- Ensure `defaultValue` only accepts `string` type via TypeScript

**Edge cases:**
- `minLength` > `maxLength` should warn at runtime or be caught by Zod validation
- Empty string vs undefined: decide if empty string is valid for required field
- `multiline: true` affects admin UI only, not validator

---

#### `number(meta?: NumberFieldMeta): VexField`

Creates a number field wrapping `v.number()`.

**Must accomplish:**
- Return object with `_validator` set to `v.number()`
- Attach `_meta` with type: "number" and provided options
- Ensure `defaultValue` only accepts `number` type

**Edge cases:**
- `min` > `max` should warn
- Integer vs float: Convex `v.number()` accepts both; consider adding `integer: true` option that validates at runtime
- `step` is for admin UI stepper, not validation

---

#### `select<T extends string>(meta: SelectFieldMeta<T>): VexField`

Creates a select field wrapping `v.union(v.literal(...))`.

**Must accomplish:**
- Extract values from `options` array and create `v.union(v.literal(opt1), v.literal(opt2), ...)`
- Constrain `defaultValue` type to be one of the option values via generic `T`
- Handle `hasMany: true` by wrapping validator in `v.array()`

**Edge cases:**
- Empty options array: should error at compile time or runtime
- Single option: `v.union()` with one argument - verify Convex handles this
- `hasMany` changes validator from `T` to `T[]` - return type must reflect this
- Options with same value but different labels: deduplicate values in validator

---

#### `checkbox(meta?: CheckboxFieldMeta): VexField`

Creates a boolean field wrapping `v.boolean()`.

**Must accomplish:**
- Return object with `_validator` set to `v.boolean()`
- Ensure `defaultValue` only accepts `boolean`

**Edge cases:**
- Consider if `required` makes sense for checkbox (it's always true/false, never undefined unless optional)

---

#### `date(meta?: DateFieldMeta): VexField`

Creates a date field wrapping `v.number()` (Unix timestamp).

**Must accomplish:**
- Return `v.number()` validator (dates stored as timestamps)
- Support `defaultValue` as number or function returning number (e.g., `() => Date.now()`)

**Edge cases:**
- Function default must be evaluated at document creation time, not config parse time
- Timezone handling: admin UI concern, not schema concern
- Null vs 0: decide if 0 timestamp is valid

---

#### `relationship(meta: RelationshipFieldMeta): VexField`

Creates a relationship field wrapping `v.id()` or `v.array(v.id())`.

**Must accomplish:**
- Use `v.id(meta.to)` for the validator
- Handle `hasMany: true` by wrapping in `v.array()`
- Store collection name in metadata for admin UI relationship picker

**Edge cases:**
- `to` referencing non-existent collection: can only validate at schema build time, not compile time (unless using string literal union of collection names)
- Self-referential relationships: `to: "posts"` inside posts collection
- Circular relationships: A references B, B references A - must not cause infinite loops in schema generation
- Polymorphic relationships (multiple `to` collections): consider `to: ["posts", "pages"]` syntax for future

---

#### `array<TFields>(meta: ArrayFieldMeta<TFields>): VexField`

Creates a repeating field group wrapping `v.array(v.object(...))`.

**Must accomplish:**
- Accept `fields` as record of VexFields
- Extract validators from each field and compose into `v.object()`
- Wrap in `v.array()`
- Preserve nested field metadata for admin form rendering

**Edge cases:**
- Empty fields object: should error
- Nested arrays: array containing array field - verify depth handling
- `minRows`/`maxRows` are runtime validation, not Convex schema constraints
- `defaultValue` must match the inferred array item type
- Optional fields within array items: handle `v.optional()` wrapping

---

#### `group<TFields>(meta: GroupFieldMeta<TFields>): VexField`

Creates a non-repeating nested field group wrapping `v.object()`.

**Must accomplish:**
- Accept `fields` as record of VexFields
- Extract validators and compose into `v.object()`
- NOT wrap in array (unlike `array()`)
- Preserve nested field metadata

**Edge cases:**
- Empty fields object: should error
- Deeply nested groups: group containing group containing group
- Whether group validator should be optional if no required fields inside

---

#### `blocks<TBlocks>(meta: BlocksFieldMeta<TBlocks>): VexField`

Creates a flexible content field wrapping `v.array(v.union(...))`.

**Must accomplish:**
- Accept array of `VexBlock` definitions
- For each block, create `v.object({ blockType: v.literal(slug), ...fieldValidators })`
- Combine all block validators with `v.union()`
- Wrap union in `v.array()`

**Edge cases:**
- Empty blocks array: should error
- Duplicate block slugs: should error at config time
- Blocks containing blocks field: recursive blocks - must handle without infinite loop
- Block slug must be valid Convex literal (no special characters)
- Very large number of block types: verify Convex handles large unions

---

#### `upload(meta?: UploadFieldMeta): VexField`

Creates a file reference field wrapping `v.id()` or `v.array(v.id())`.

**Must accomplish:**
- Reference the media/upload collection via `v.id(meta.collection)`
- Handle `hasMany: true` with `v.array()`
- Store collection reference for admin file picker

**Edge cases:**
- Upload collection must be configured with `uploads` option
- Non-upload collection reference: should warn

---

### Block & Collection Definition Functions

#### `defineBlock<TFields>(slug: string, config: { fields: TFields, ... }): VexBlock<TFields>`

Creates a block definition for use in `blocks()` fields.

**Must accomplish:**
- Store slug and fields together
- Preserve field type information for type inference
- Optionally attach component reference for frontend rendering

**Edge cases:**
- Slug must be unique across all blocks (validated at schema build time)
- Slug must be valid identifier (lowercase, no spaces, etc.)
- Empty fields: should error
- Component lazy import must not be evaluated during config parsing

---

#### `defineCollection<TFields>(name: string, config: CollectionConfig<TFields>): VexCollection<TFields>`

Creates a collection definition.

**Must accomplish:**
- Store name and full config
- Expose `_docType` for type inference (value is `{}`, type is inferred)
- Validate that `useAsTitle` references an existing field
- Validate that `defaultColumns` reference existing fields

**Edge cases:**
- Name must be valid Convex table name (lowercase, alphanumeric, underscores)
- Duplicate collection names: error at config time
- Empty fields: should error
- Reserved names: avoid "vex_*" prefix (used for CMS system tables)

---

#### `defineGlobal<TFields>(slug: string, config: GlobalConfig<TFields>): VexGlobal<TFields>`

Creates a global (singleton) definition.

**Must accomplish:**
- Similar to `defineCollection` but for singletons
- No list view, only single document
- Store in separate globals table or dedicated row

**Edge cases:**
- Global document creation: auto-create on first access or require explicit init
- Multiple deployments: ensure single document per global
- Slug must be unique across globals (but can overlap with collection names)

---

#### `defineConfig(config: VexConfig): VexConfig`

Top-level config wrapper.

**Must accomplish:**
- Aggregate all collections and globals
- Validate no duplicate names
- Provide entry point for schema generation and admin setup

**Edge cases:**
- Empty collections array: warn but allow (maybe only globals)
- Circular references between collections via relationships: must not cause issues
- `admin.user` must reference a collection with auth enabled

---

### Schema Generation Functions

#### `buildConvexSchema(config: VexConfig): SchemaDefinition`

Generates Convex schema from Vex config.

**Must accomplish:**
- Traverse all collections and extract field validators
- Handle nested structures (array, group, blocks) recursively
- Add system fields (`_status`, `_version`) for versioned collections
- Add CMS system tables (`vex_versions`, `vex_globals`)
- Deduplicate block validators (same block used in multiple places)
- Return valid input for Convex `defineSchema()`

**Edge cases:**
- Recursive blocks: blocks field containing reference to parent block type
- Very deep nesting: verify no stack overflow
- Optional vs required: wrap optional field validators with `v.optional()`
- Relationship validation: verify referenced collections exist in config
- Global storage: store in `vex_globals` table with `slug` field

---

#### `extractValidator(field: VexField): GenericValidator`

Extracts the Convex validator from a VexField.

**Must accomplish:**
- Return the raw `_validator` property
- Handle optional wrapping based on `required` meta

**Edge cases:**
- Nested fields (array/group/blocks): must recursively extract and compose
- `required: false` vs field not having `required` key: decide default behavior

---

#### `collectBlocks(fields: Record<string, VexField>, accumulator: Map<string, VexBlock>): void`

Recursively collects all blocks from a field tree.

**Must accomplish:**
- Walk field tree depth-first
- Add each unique block to accumulator by slug
- Recurse into array, group, and blocks fields
- Detect and handle circular block references

**Edge cases:**
- Same block used multiple times: only add once
- Block A contains blocks field with Block B, Block B contains blocks field with Block A
- Null/undefined fields: skip gracefully

---

#### `buildBlockValidator(block: VexBlock): Validator`

Creates a Convex validator for a single block type.

**Must accomplish:**
- Create `v.object()` with `blockType: v.literal(slug)` plus all field validators
- Recursively handle nested structures

**Edge cases:**
- Block with no fields: `v.object({ blockType: v.literal(slug) })`
- Reserved field name `blockType`: should not allow user to define field named "blockType"

---

### Admin/Runtime Utility Functions

#### `getFieldMeta(field: VexField): BaseFieldMeta`

Extracts metadata from a VexField for admin panel rendering.

**Must accomplish:**
- Return the `_meta` property
- Type should narrow based on field type

**Edge cases:**
- None significant

---

#### `getCollectionFields(collection: VexCollection): Record<string, VexField>`

Returns the fields from a collection for form generation.

**Must accomplish:**
- Return `collection.config.fields`
- Preserve type information

**Edge cases:**
- None significant

---

#### `resolveDefaultValue<T>(field: VexField<any, { defaultValue?: T | (() => T) }>): T | undefined`

Resolves a default value, calling function if needed.

**Must accomplish:**
- If `defaultValue` is function, call it and return result
- If value, return directly
- If undefined, return undefined

**Edge cases:**
- Async default value functions: decide if supported (probably not for simplicity)
- Default value function throwing: let error propagate

---

#### `validateFieldValue(field: VexField, value: unknown): ValidationResult`

Validates a value against field constraints.

**Must accomplish:**
- Check `required` constraint
- Check type-specific constraints (`minLength`, `max`, `minRows`, etc.)
- Return structured error or success

**Edge cases:**
- Nested validation for array/group/blocks fields
- Relationship validation: check if referenced document exists (async)
- Custom validation functions: decide if supported at field level

---

## File Structure

```
@vex/core/
├── fields/
│   ├── types.ts          # All type definitions
│   ├── text.ts           # text() function
│   ├── number.ts         # number() function
│   ├── select.ts         # select() function
│   ├── checkbox.ts       # checkbox() function
│   ├── date.ts           # date() function
│   ├── relationship.ts   # relationship() function
│   ├── array.ts          # array() function
│   ├── group.ts          # group() function
│   ├── blocks.ts         # blocks() function
│   ├── upload.ts         # upload() function
│   └── index.ts          # Re-exports all fields
├── collection.ts         # defineCollection()
├── global.ts             # defineGlobal()
├── block.ts              # defineBlock()
├── config.ts             # defineConfig()
├── utils.ts              # Utility functions
└── index.ts              # Main entry point

@vex/convex/
├── schema.ts             # buildConvexSchema(), schema generation
├── crud.ts               # CRUD mutation/query generators
├── hooks.ts              # Hook execution utilities
├── access.ts             # Access control utilities
└── index.ts              # Re-exports
```

---

## Type Safety Guarantees

1. **Field defaults match field type**: `text({ defaultValue: 123 })` is a compile error
2. **Select defaults constrained to options**: `select({ options: [{value: "a"}], defaultValue: "b" })` is a compile error
3. **Array/group field inference**: Nested fields are fully typed
4. **Block union types**: Document type includes discriminated union of all block shapes
5. **Hook context typing**: `beforeCreate` receives typed `data` based on collection fields
6. **Access function typing**: `read({ doc })` receives typed `doc` based on collection fields
7. **Relationship collection names**: Can be narrowed to literal union of defined collection names

---

## Testing Requirements

- Unit tests for each field factory function
- Unit tests for type inference (compile-time tests via tsd or similar)
- Unit tests for schema generation with various field combinations
- Integration tests for nested structures (array of groups with blocks)
- Edge case tests for circular references, empty configs, invalid inputs
