# All Field Types Added to Core Package

All field type definitions from the old version have been brought back and adapted to use the Input/Output type pattern.

---

## What Was Added

### 1. Field Type Definitions (Input/Output Pairs)

All field types now have both Input (user-facing) and Output (resolved) versions:

#### Basic Fields
- ✅ **Text** — `VexTextFieldInput` / `VexTextField`
- ✅ **Number** — `VexNumberFieldInput` / `VexNumberField`
- ✅ **Checkbox** — `VexCheckboxFieldInput` / `VexCheckboxField`
- ✅ **Date** — `VexDateFieldInput` / `VexDateField`

#### Selection & Reference Fields
- ✅ **Select** — `VexSelectFieldInput` / `VexSelectField` (discriminated union on `hasMany`)
- ✅ **Relationship** — `VexRelationshipFieldInput` / `VexRelationshipField` (discriminated union on `hasMany`)
- ✅ **Upload** — `VexUploadFieldInput` / `VexUploadField` (discriminated union on `hasMany`)

#### Content Fields
- ✅ **Rich Text** — `VexRichTextFieldInput` / `VexRichTextField`
- ✅ **Blocks** — `VexBlocksFieldInput` / `VexBlocksField`
- ✅ **Image URL** — `VexImageUrlFieldInput` / `VexImageUrlField`
- ✅ **Color** — `VexColorFieldInput` / `VexColorField`

#### Structure Fields
- ✅ **Object** — `VexObjectFieldInput` / `VexObjectField`
- ✅ **Array** — `VexArrayFieldInput` / `VexArrayField`
- ✅ **JSON** — `VexJsonFieldInput` / `VexJsonField`
- ✅ **Tabs** — `VexTabsFieldInput` / `VexTabsField`

#### Special Fields
- ✅ **UI** — `VexUIFieldInput` / `VexUIField` (non-persisted, admin component only)

---

## 2. Supporting Types

### Block Types
- **`BlockDef<TFields>`** — Block definition for reusable content groups
- **`BlockAdminConfig`** — Admin configuration for blocks
- **`RESERVED_BLOCK_FIELD_NAMES`** — Reserved names that can't be used in blocks

### Tab Types
- **`TabDef<TSlug, TFields>`** — Single tab definition within tabs field
- **`StyleTier`** — Style tier for block styling ("container" | "text" | "layout" | "media")

### Select Types
- **`SelectOption<T>`** — Single option in select field with value, label, badgeColor

### Component Props Types
- **`FieldComponentProps<TField>`** — Props for custom field components
- **`CellComponentProps<TField>`** — Props for custom table cell components

### Editor Types (Forward Declarations)
- **`VexEditorAdapter`** — Interface for richtext editor adapters
- **`RichTextDocument`** — Type for richtext document structure

---

## 3. Union Types

### VexFieldInput
Union of all user-facing input types:
```typescript
export type VexFieldInput<TComponent = unknown> =
  | VexTextFieldInput<TComponent>
  | VexNumberFieldInput<TComponent>
  | VexCheckboxFieldInput<TComponent>
  | VexSelectFieldInput<string>
  | VexDateFieldInput<TComponent>
  | VexImageUrlFieldInput<TComponent>
  | VexRelationshipFieldInput<TComponent>
  | VexUploadFieldInput<TComponent>
  | VexJsonFieldInput<TComponent>
  | VexObjectFieldInput<TComponent>
  | VexArrayFieldInput<TComponent>
  | VexRichTextFieldInput<TComponent>
  | VexColorFieldInput<TComponent>
  | VexTabsFieldInput
  | VexUIFieldInput<TComponent>
  | VexBlocksFieldInput<TComponent>;
```

### VexField
Union of all resolved output types:
```typescript
export type VexField<TComponent = unknown> =
  | VexTextField<TComponent>
  | VexNumberField<TComponent>
  | VexCheckboxField<TComponent>
  | VexSelectField<string>
  | VexDateField<TComponent>
  | VexImageUrlField<TComponent>
  | VexRelationshipField<TComponent>
  | VexUploadField<TComponent>
  | VexJsonField<TComponent>
  | VexObjectField<TComponent>
  | VexArrayField<TComponent>
  | VexRichTextField<TComponent>
  | VexColorField<TComponent>
  | VexTabsField
  | VexUIField<TComponent>
  | VexBlocksField<TComponent>;
```

---

## 4. Type Inference Utilities

These utilities enable TypeScript to infer document types from field definitions:

### InferFieldType
Infer the TypeScript value type from a single VexField:
```typescript
export type InferFieldType<F extends VexField> = ...
```

Maps field types to their value types:
- `text` → `string`
- `number` → `number`
- `checkbox` → `boolean`
- `select` (single) → `string`
- `select` (many) → `string[]`
- `date` → `number` (epoch ms)
- `imageUrl` → `string`
- `relationship` (single) → `string` (ID)
- `relationship` (many) → `string[]` (IDs)
- `upload` (single) → `string` (ID)
- `upload` (many) → `string[]` (IDs)
- `json` → `unknown`
- `object` → `Record<string, unknown>`
- `richtext` → `RichTextDocument`
- `blocks` → `Array<InferBlockUnion<F>>`
- `array` → `unknown[]`
- `ui` → `never` (non-persisted)
- `color` → `string`
- `tabs` → `Record<string, unknown>` (expanded by InferFieldsType)

### InferBlockUnion
Infer discriminated union type for blocks field:
```typescript
export type InferBlockUnion<F extends VexField> = ...
```

Generates types like:
```typescript
{ blockType: "hero"; blockName?: string; _key: string; title: string; subtitle: string; }
| { blockType: "cta"; blockName?: string; _key: string; buttonText: string; url: string; }
```

### InferFieldsType
**This is the main utility users will use!**

Infer the complete document type from a record of fields:
```typescript
export type InferFieldsType<F extends Record<string, VexField>> = ...
```

**Key features:**
- Maps each field to its inferred value type
- Expands tabs fields into nested objects (e.g., `light?: { ... }; dark?: { ... }`)
- Handles complex nested structures

**Example:**
```typescript
type Doc = InferFieldsType<{
  title: VexTextField;
  count: VexNumberField;
  tags: VexSelectField<true>; // hasMany
  colors: VexTabsField<[
    { slug: "light"; fields: { bg: VexColorField } },
    { slug: "dark"; fields: { bg: VexColorField } }
  ]>;
}>;

// Result:
// {
//   title: string;
//   count: number;
//   tags: string[];
//   light?: { bg: string };
//   dark?: { bg: string };
// }
```

### Helper Types
- **`TabsFieldKeys<F>`** — Extract keys of tabs fields
- **`NonTabsFieldKeys<F>`** — Extract keys of non-tabs fields
- **`ExpandTabsFields<F>`** — Expand tabs fields into nested objects
- **`InferTabsExpansion<F>`** — Infer expanded structure for a single tabs field
- **`UnionToIntersection<U>`** — Convert union to intersection (for merging tabs)

---

## 5. Utility Types

### DistributiveOmit
Distributive version of `Omit` that preserves union branches:
```typescript
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;
```

Standard `Omit` collapses unions; this applies `Omit` to each branch individually.

---

## Status

### ✅ Types Defined (All Field Types)
All field type definitions are complete with Input/Output pairs.

### ⏳ Factories Not Yet Implemented
Only `text()` has a factory function. The following still need implementation:
- `number()`
- `checkbox()`
- `select()`
- `date()`
- `imageUrl()`
- `relationship()`
- `upload()`
- `json()`
- `object()`
- `array()`
- `richtext()`
- `color()` — **HIGH PRIORITY** (needed for themes)
- `tabs()` — **HIGH PRIORITY** (needed for themes)
- `ui()`
- `blocks()` — **MEDIUM PRIORITY** (needed for pages, headers, footers)
- `defineBlock()` — **MEDIUM PRIORITY** (helper for creating BlockDef)

---

## How to Use InferFieldsType

The `InferFieldsType` utility is what you need for the collections.ts type file:

```typescript
import type { VexField, InferFieldsType } from './fields';

// Define fields
const postFields = {
  title: text({ required: true }),
  slug: text({ required: true, index: "by_slug" }),
  publishedAt: date(),
  tags: select({ options: [...], hasMany: true }),
} satisfies Record<string, VexField>;

// Infer document type
type Post = InferFieldsType<typeof postFields>;
// Result:
// {
//   title: string;
//   slug: string;
//   publishedAt?: number;
//   tags?: string[];
// }
```

For collections:
```typescript
import type { InferFieldsType } from '@vexcms/core';

export interface CollectionConfig<TFields extends Record<string, VexField>> {
  slug: string;
  fields: TFields;
  // ... other config
}

// Infer document type from collection config
export type InferCollectionDocument<T extends CollectionConfig<any>> =
  T extends CollectionConfig<infer TFields>
    ? InferFieldsType<TFields>
    : never;
```

---

## Build Output

**Before**: dist/index.d.ts 25.26 KB
**After**: dist/index.d.ts 36.17 KB

All types compile successfully with no errors.

---

## Next Steps

1. **Implement field factories** in priority order:
   - HIGH: `color()`, `tabs()` (for themes collection)
   - MEDIUM: `imageUrl()`, `blocks()`, `defineBlock()` (for content collections)
   - LOW: All others

2. **Create collections type file** (`src/types/collections.ts`) that uses `InferFieldsType`

3. **Implement `defineCollection()` and `defineConfig()`** functions

4. **Test type inference** with real collection definitions
