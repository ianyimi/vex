# Field Types Migration Plan

## Overview

To migrate the www app from the old VexCMS version to the alpha rebuild, you need to implement **5 additional field types** beyond the already-completed `text` field.

This document analyzes each required field type, provides implementation priorities, and outlines dependencies.

---

## Field Types Status

| Field Type | Status | Priority | Complexity | Collections Using It |
|------------|--------|----------|------------|---------------------|
| ✅ `text` | **DONE** | - | Simple | All collections |
| `color` | TODO | **HIGH** | Simple | themes (30+ fields) |
| `tabs` | TODO | **HIGH** | Medium | themes |
| `imageUrl` | TODO | **MEDIUM** | Simple | pages |
| `blocks` | TODO | **MEDIUM** | Complex | pages, headers, footers |
| `ui` | TODO | **LOW** | Simple | themes (1 field) |

---

## Priority 1: HIGH — Essential for Themes Collection

### 1. `color` Field Type

**Used in**: `themes` collection (30+ color fields for shadcn/Tailwind CSS variables)

**Complexity**: ⭐ Simple

**Why High Priority**: The themes collection is heavily dependent on color fields. Without this field type, you cannot migrate the themes system, which is critical infrastructure for the www app's design system.

#### Key Properties

```typescript
export interface VexColorField extends BaseField {
  readonly type: "color";
  defaultValue?: string;
  format?: "hex" | "hsl" | "oklch"; // Output format
  themeColors?: boolean; // Shows CSS variable picker tab
}
```

#### Example Usage from themes.ts

```typescript
background: color({
  label: "Background",
  format: "hsl"
}),
foreground: color({
  label: "Foreground",
  format: "hsl"
}),
```

#### Implementation Notes

- Factory function is straightforward (similar to `text`)
- Schema validator: `v.string()` (stores color as string in chosen format)
- Helper functions needed:
  - `getColorFieldLabel(field, fieldKey): string`
  - `getColorFieldAlignment(field): Alignment` (probably "center")
  - `formatColorCellValue(value, format): string` (format for table display)
  - `validateColorValue(value, field): string | null` (validate format)
  - `getColorFieldDefaultValue(field): string | undefined`
- The `themeColors` option is admin UI only (framework package concern)

#### Files to Create

```
src/fields/color/
  ├── config.ts          # color() factory function
  ├── utils.ts           # helper functions
  ├── schemaValidator.ts # colorToValidator()
  └── index.ts           # re-exports
```

---

### 2. `tabs` Field Type

**Used in**: `themes` collection (organizes light/dark mode color fields)

**Complexity**: ⭐⭐ Medium

**Why High Priority**: Required to properly structure the themes collection. The themes use tabs to organize 30+ color fields into light/dark mode sections, making the admin UI manageable.

#### Key Properties

```typescript
export interface TabDef<
  TSlug extends string = string,
  TFields extends Record<string, VexField> = Record<string, VexField>,
> {
  label: string;
  slug: TSlug; // Creates nested object: { [slug]: { ...fields } }
  fields: TFields;
}

export interface VexTabsField<TTabs extends TabDef[] = TabDef[]> extends BaseField {
  readonly type: "tabs";
  tabs: TTabs;
}
```

#### Example Usage from themes.ts

```typescript
themeColors: tabs({
  label: "Theme Colors",
  tabs: [
    {
      label: "Light",
      slug: "light",
      fields: {
        background: color({ label: "Background", format: "hsl" }),
        foreground: color({ label: "Foreground", format: "hsl" }),
        // ... 15 more color fields
      },
    },
    {
      label: "Dark",
      slug: "dark",
      fields: {
        background: color({ label: "Background", format: "hsl" }),
        foreground: color({ label: "Foreground", format: "hsl" }),
        // ... 15 more color fields
      },
    },
  ],
}),
```

#### Implementation Notes

- **Complex generic type**: `tabs<const TTabs extends TabDef[]>` preserves tab structure
- Schema generation is more complex:
  - Each tab with a `slug` creates a nested object
  - Must recursively convert `tab.fields` using field validators
  - Example output: `v.object({ light: v.object({ background: v.string(), ... }), dark: v.object({ ... }) })`
- Helper functions:
  - `getTabsFieldLabel(field, fieldKey): string`
  - No cell formatting (tabs is structural, not displayed in tables)
  - Validation must recursively validate nested fields
  - Default values must handle nested structure
- Factory function uses `as const` type assertion

#### Files to Create

```
src/fields/tabs/
  ├── config.ts          # tabs() factory function with generics
  ├── utils.ts           # helper functions (recursive field handling)
  ├── schemaValidator.ts # tabsToValidator() - recursively converts nested fields
  └── index.ts           # re-exports
```

#### Dependencies

- **Must have `color` field implemented first** (tabs contain color fields in www app)
- Requires recursive field processing utility (may need to add to `src/utils/`)

---

## Priority 2: MEDIUM — Needed for Content Collections

### 3. `imageUrl` Field Type

**Used in**: `pages` collection (Open Graph images)

**Complexity**: ⭐ Simple

**Why Medium Priority**: Only used for OG images in pages. Important for SEO, but not blocking core functionality.

#### Key Properties

```typescript
export interface VexImageUrlField extends BaseField {
  readonly type: "imageUrl";
  defaultValue?: string;
  width?: number;  // Display width in pixels
  height?: number; // Display height in pixels
}
```

#### Example Usage from pages.ts

```typescript
ogImage: imageUrl({
  label: "Open Graph Image",
  description: "Image shown when sharing on social media",
  width: 1200,
  height: 630,
}),
```

#### Implementation Notes

- Very similar to `text` field (stores a URL string)
- Schema validator: `v.optional(v.string())` or `v.string()` if required
- Helper functions:
  - `getImageUrlFieldLabel(field, fieldKey): string`
  - `getImageUrlFieldAlignment(field): Alignment` (probably "center")
  - `formatImageUrlCellValue(value): string` (maybe show thumbnail in admin table?)
  - `validateImageUrlValue(value, field): string | null` (validate URL format)
  - `getImageUrlFieldDefaultValue(field): string | undefined`
- The `width` and `height` are for admin UI display only

#### Files to Create

```
src/fields/imageUrl/
  ├── config.ts          # imageUrl() factory function
  ├── utils.ts           # helper functions
  ├── schemaValidator.ts # imageUrlToValidator()
  └── index.ts           # re-exports
```

---

### 4. `blocks` Field Type

**Used in**: `pages`, `headers`, `footers` collections (dynamic content areas)

**Complexity**: ⭐⭐⭐ Complex

**Why Medium Priority**: Critical for content editing, but complex to implement. Can start with basic structure and enhance later.

#### Key Properties

```typescript
export interface BlockDef<TFields extends Record<string, VexField> = Record<string, VexField>> {
  readonly slug: string;
  label: string;
  fields: TFields;
  admin?: BlockAdminConfig;
  interfaceName?: string; // For TypeScript generation
}

export interface VexBlocksField extends BaseField {
  readonly type: "blocks";
  blocks: BlockDef[];
  labels?: Labels; // { singular: "Block", plural: "Blocks" }
  min?: number;
  max?: number;
}
```

#### Example Usage from pages.ts

```typescript
content: blocks({
  blocks: [heroBlock, ctaBlock, featureGridBlock],
  labels: { singular: "Section", plural: "Sections" },
}),
```

#### Implementation Notes

- **Complex schema generation**:
  - Generates a discriminated union of block types
  - Each block becomes: `v.object({ blockType: v.literal("hero"), blockName: v.optional(v.string()), ...fields })`
  - Final schema: `v.array(v.union(heroBlockValidator, ctaBlockValidator, ...))`
  - Must handle reserved field names: `blockType`, `blockName`, `_key`, `blockStyles`
- Factory function must validate:
  - No duplicate block slugs
  - Block fields don't use reserved names
  - Throws `VexBlockValidationError` on violations
- Helper functions:
  - `getBlocksFieldLabel(field, fieldKey): string`
  - `formatBlocksCellValue(value): string` (show count: "3 blocks")
  - `validateBlocksValue(value, field): string | null` (check min/max)
  - `getBlocksFieldDefaultValue(field): any[]` (empty array or min blocks)
- Need separate `defineBlock()` helper function for creating `BlockDef` objects

#### Files to Create

```
src/fields/blocks/
  ├── config.ts          # blocks() factory function with validation
  ├── defineBlock.ts     # defineBlock() helper for BlockDef creation
  ├── utils.ts           # helper functions
  ├── schemaValidator.ts # blocksToValidator() - generates discriminated union
  └── index.ts           # re-exports

src/errors/
  └── VexBlockValidationError.ts  # Custom error class
```

#### Dependencies

- Blocks can contain ANY field type (including other blocks, theoretically)
- Should implement after `color`, `tabs`, `imageUrl`, and `text` are all complete
- Requires recursive field processing

---

## Priority 3: LOW — Optional Enhancement

### 5. `ui` Field Type

**Used in**: `themes` collection (1 field: custom theme import component)

**Complexity**: ⭐ Simple

**Why Low Priority**: Only used for one field in themes. This is a non-persisted field (admin UI only), so it doesn't block data model migration. Can implement last or defer entirely.

#### Key Properties

```typescript
export interface VexUIField extends BaseField {
  readonly type: "ui";
  admin: FieldAdminConfig & {
    components: {
      Field: ComponentType<FieldComponentProps>; // React component
    };
  };
}
```

#### Example Usage from themes.ts

```typescript
import ThemeImporter from "~/components/admin/ThemeImporter";

themeImport: ui({
  label: "Import Theme",
  description: "Import colors from shadcn themes",
  admin: {
    components: { Field: ThemeImporter },
    position: "sidebar",
  },
}),
```

#### Implementation Notes

- **Non-persisted field**: Skipped during schema generation, validation, and storage
- No schema validator needed (or returns `null` / empty validator)
- Helper functions:
  - `getUIFieldLabel(field, fieldKey): string`
  - No cell formatting (not shown in tables)
  - No validation (doesn't store data)
  - No default value
- Factory function must require `admin.components.Field`
- The `ComponentType` import creates React dependency in core types
  - **Solution**: Use generic `TComponent` parameter like other fields

#### Files to Create

```
src/fields/ui/
  ├── config.ts          # ui() factory function
  ├── utils.ts           # minimal helpers
  ├── schemaValidator.ts # uiToValidator() - returns null or undefined
  └── index.ts           # re-exports
```

#### Implementation Strategy

Since this field doesn't persist data, you could:
1. Implement it minimally (factory + types only)
2. Defer until admin UI work begins
3. Skip entirely if not needed in alpha

---

## Recommended Implementation Order

### Phase 1: Themes Infrastructure (Days 1-2)
**Goal**: Enable themes collection migration

1. **`color` field** (2-3 hours)
   - Simple field, similar to `text`
   - Test with basic color values in different formats

2. **`tabs` field** (4-6 hours)
   - More complex due to generics and recursive field handling
   - Test with nested color fields
   - May need to create recursive schema conversion utility

**Milestone**: Can migrate themes collection to alpha version

---

### Phase 2: Content Infrastructure (Days 3-4)
**Goal**: Enable pages, headers, footers migration

3. **`imageUrl` field** (1-2 hours)
   - Quick implementation, similar to `text`
   - Test with URL validation

4. **`blocks` field** (8-12 hours)
   - Most complex field type
   - Requires careful testing of:
     - Discriminated union schema generation
     - Validation errors for duplicate slugs
     - Nested field recursion
     - Type generation for each block type
   - Create helper `defineBlock()` function
   - Test with progressively complex block definitions

**Milestone**: Can migrate all collections to alpha version

---

### Phase 3: Polish (Day 5, optional)
**Goal**: Complete all field types

5. **`ui` field** (1-2 hours)
   - Minimal implementation
   - Test admin integration

**Milestone**: Feature parity with old version

---

## Technical Considerations

### Recursive Field Processing

Both `tabs` and `blocks` require recursively processing nested fields. You may want to create a shared utility:

```typescript
// src/utils/fieldProcessing.ts

export function fieldsToValidator(
  fields: Record<string, VexField>
): string {
  const entries = Object.entries(fields).map(([key, field]) => {
    const validator = fieldToValidator(field);
    return `${key}: ${validator}`;
  });
  return `v.object({ ${entries.join(", ")} })`;
}

export function fieldToValidator(field: VexField): string {
  switch (field.type) {
    case "text":
      return textToValidator(field);
    case "color":
      return colorToValidator(field);
    case "tabs":
      return tabsToValidator(field); // Recursively calls fieldsToValidator
    case "blocks":
      return blocksToValidator(field); // Recursively calls fieldsToValidator
    case "imageUrl":
      return imageUrlToValidator(field);
    case "ui":
      return ""; // Non-persisted
    default:
      const _exhaustive: never = field;
      throw new Error(`Unknown field type: ${(field as any).type}`);
  }
}
```

This utility would be used by:
- CLI schema generator
- Validation helper functions
- Type generation

### Type System Updates

As you add each field type, update:

1. **`src/types/fields.ts`**:
   ```typescript
   export type VexField<TComponent = unknown> =
     | VexTextField<TComponent>
     | VexColorField<TComponent>
     | VexTabsField<TComponent>
     | VexImageUrlField<TComponent>
     | VexBlocksField<TComponent>
     | VexUIField<TComponent>;
   ```

2. **`src/fields/index.ts`**:
   ```typescript
   export { text } from "./text";
   export { color } from "./color";
   export { tabs } from "./tabs";
   // ... etc
   ```

3. **`src/index.ts`**:
   - Export factory functions
   - Export helper functions
   - Export types

### Testing Strategy

For each field type, create tests for:
1. Factory function returns correct shape
2. Schema validator generates valid Convex validators
3. Helper functions handle edge cases
4. Validation catches errors
5. Generic types preserve type information (especially for `tabs` and `blocks`)

---

## Summary

**To migrate www app to alpha version, implement in this order:**

1. ✅ `text` — **DONE**
2. `color` — HIGH priority, simple implementation
3. `tabs` — HIGH priority, medium complexity (depends on `color`)
4. `imageUrl` — MEDIUM priority, simple implementation
5. `blocks` — MEDIUM priority, complex implementation (depends on all above)
6. `ui` — LOW priority, simple implementation (optional)

**Estimated Total Time**: 2-3 days of focused implementation + testing

**Critical Path**: `color` → `tabs` → themes collection migration
**Parallel Path**: `imageUrl` → `blocks` → content collections migration

Once `color` and `tabs` are complete, you can start migrating the themes collection while working on `blocks` for content collections.
