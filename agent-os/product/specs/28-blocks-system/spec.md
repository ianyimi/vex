# Spec 28 — Blocks System

## Overview

Blocks are reusable field groups that can be composed into ordered lists on documents. This spec adds `defineBlock()` to define block shapes, `blocks()` as a new field type, full Convex schema generation with typed `v.union()` validators (not `v.any()`), Zod form validation, column definitions, type inference, and a `RenderBlocks` frontend component. All code lives in `@vexcms/core` except `RenderBlocks` which lives in `@vexcms/ui`.

## Design Decisions

- **Inline storage with typed schema (Option C):** Blocks are stored as a typed `v.array(v.union(...))` directly on the parent document field. Each block type generates a `v.object()` with `blockType: v.literal("slug")` as discriminant. This gives runtime validation from Convex, atomic reads/writes, and implicit ordering — no separate table needed.
- **Code-defined blocks:** Block types are defined via `defineBlock()` in code (like `defineCollection()`), not created in the admin UI. The `blocks()` field carries its allowed blocks directly — no global registry needed.
- **No nesting depth limit:** Blocks can contain `blocks()` fields (nested blocks). Cycle detection during schema generation prevents infinite recursion, but there's no artificial depth cap.
- **`_key` field:** Each block instance has a `_key: v.string()` for stable React keys and reordering. The admin UI generates these — this spec just includes the field in the schema.

## Out of Scope

- Admin block editor UI (picker, reorder, inline edit, drag-and-drop) — separate spec
- Custom block editor components (Spec 09b dependency)
- Block-level validation rules beyond field-level
- Versioning/drafts interaction
- Rich text block embeds (Spec 17b)
- `_key` generation utility (admin UI concern)

## Target Directory Structure

```
packages/core/src/
├── blocks/
│   ├── defineBlock.ts           # defineBlock() factory + validation
│   └── defineBlock.test.ts      # Tests for defineBlock()
├── fields/
│   ├── blocks/
│   │   ├── config.ts            # blocks() factory function
│   │   ├── schemaValueType.ts   # Convex schema generation (v.union pattern)
│   │   ├── schemaValueType.test.ts
│   │   ├── columnDef.ts         # Data table column ("3 blocks")
│   │   ├── columnDef.test.ts
│   │   └── index.ts             # Re-exports
│   └── constants.ts             # (updated — no new constant needed for blocks)
├── formSchema/
│   ├── generateFormSchema.ts    # (updated — add blocks case)
│   └── generateFormSchema.test.ts # (updated — add blocks tests)
├── formSchema/
│   └── generateFormDefaultValues.ts # (updated — add blocks case)
├── types/
│   └── fields.ts                # (updated — BlockDef, BlocksFieldDef, VexField union, InferFieldType)
├── valueTypes/
│   └── extract.ts               # (updated — add blocks case to fieldToValueType)
├── columns/
│   └── generateColumns.ts       # (updated — add blocks case to buildColumnDef)
├── index.ts                     # (updated — export defineBlock, blocks, BlockDef, BlocksFieldDef)
└── errors/
    └── index.ts                 # (updated — add VexBlockValidationError)

packages/ui/src/
├── components/
│   └── RenderBlocks.tsx         # RenderBlocks component
└── index.ts                     # (updated — export RenderBlocks)
```

## Implementation Order

1. **Step 1: Types & Error class** — Add `BlockDef`, `BlocksFieldDef` to type system, update `VexField` union, add `VexBlockValidationError`. After this, `pnpm build` passes.
2. **Step 2: `defineBlock()` factory + tests** — Create the factory function with validation (reserved field names, slug format). Tests verify valid and invalid inputs.
3. **Step 3: `blocks()` field factory + tests** — Create the field factory with duplicate slug detection. Tests verify config output.
4. **Step 4: Schema generation (`blocksToValueTypeString`) + tests** — Generate `v.array(v.union(v.object(...)))` from block definitions. Wire into `fieldToValueType`. Tests cover single block, multiple blocks, nested blocks, empty-fields blocks, and cycle detection.
5. **Step 5: Zod form validation + tests** — Add blocks case to `fieldMetaToZod` and `generateFormSchema`. Tests cover valid/invalid block data.
6. **Step 6: Column definition + tests** — Add blocks column def ("3 blocks" display). Wire into `generateColumns`.
7. **Step 7: Form default values + `InferFieldType`** — Add blocks case to `generateFormDefaultValues`. Add blocks branch to `InferFieldType`.
8. **Step 8: Core package exports** — Update `index.ts` to export all new symbols.
9. **Step 9: `RenderBlocks` component + tests** — Create the component in `@vexcms/ui`. Tests cover rendering, missing components, empty array.

---

## Step 1: Types & Error Class

- [ ] Update `packages/core/src/types/fields.ts` — add `BlockDef`, `BlocksFieldDef`, update `VexField`, update `InferFieldType`
- [ ] Update `packages/core/src/errors/index.ts` — add `VexBlockValidationError`
- [ ] Run `pnpm build` and verify it passes

### File: `packages/core/src/types/fields.ts`

Add the following types. Insert `BlockDef` before the `VexField` union, and add `BlocksFieldDef` to the union.

````typescript
// =============================================================================
// BLOCK TYPES
// =============================================================================

/**
 * Admin configuration specific to block definitions.
 */
export interface BlockAdminConfig {
  /** Icon identifier for the block picker UI (e.g., "layout-template"). */
  icon?: string;
  /** Custom admin components for this block (future — Spec 09b). */
  components?: {
    Editor?: ComponentType<any>;
  };
}

/**
 * A block definition created by `defineBlock()`.
 * Blocks are reusable field groups composed into ordered lists via the `blocks()` field type.
 *
 * @example
 * ```ts
 * const heroBlock = defineBlock({
 *   slug: "hero",
 *   label: "Hero Section",
 *   fields: { heading: text({ required: true }), subheading: text() },
 * })
 */
export interface BlockDef<
  TFields extends Record<string, VexField> = Record<string, VexField>,
> {
  /** Unique identifier for this block type. Used as the `blockType` discriminant in stored data. */
  readonly slug: string;
  /** Display label for the block in the admin picker. */
  label: string;
  /** Field definitions for this block's data shape. */
  fields: TFields;
  /** Admin UI configuration. */
  admin?: BlockAdminConfig;
}

/** Reserved field names that cannot be used in block field definitions. */
export const RESERVED_BLOCK_FIELD_NAMES = ["blockType", "_key"] as const;

// =============================================================================
// BLOCKS FIELD TYPE
// =============================================================================

/** Blocks field definition. Stores an ordered array of block instances. */
export interface BlocksFieldDef extends BaseField {
  readonly type: "blocks";
  /** The block definitions allowed in this field. */
  blocks: BlockDef[];
  /** Display labels for the field (singular/plural). */
  labels?: Labels;
  /** Minimum number of blocks. */
  min?: number;
  /** Maximum number of blocks. */
  max?: number;
}
````

Update the `VexField` union to include `BlocksFieldDef`:

```typescript
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
  | ArrayFieldDef
  | RichTextFieldDef
  | UIFieldDef
  | BlocksFieldDef; // ← ADD
```

Update `InferFieldType` — add a blocks branch before the array branch:

```typescript
// Inside InferFieldType conditional chain, add before the array branch:
: F extends { type: "blocks" }
  ? Array<InferBlockUnion<F>>
  : F extends { type: "array" }
    ? unknown[]
    // ...rest
```

Add the helper type for block inference:

```typescript
/**
 * Infer the discriminated union type for a blocks field.
 * Each block becomes an object type with `blockType` literal + `_key` + its field types.
 */
export type InferBlockUnion<F extends VexField> = F extends BlocksFieldDef
  ? F["blocks"][number] extends infer B
    ? B extends BlockDef<infer TFields>
      ? { blockType: B["slug"]; _key: string } & {
          [K in keyof TFields]: InferFieldType<TFields[K] & VexField>;
        }
      : never
    : never
  : never;
```

### File: `packages/core/src/errors/index.ts`

Add the following error class:

```typescript
/**
 * Thrown when a block definition is invalid.
 * For example: reserved field name used, duplicate block slug.
 */
export class VexBlockValidationError extends VexError {
  constructor(
    public readonly blockSlug: string,
    public readonly detail: string,
  ) {
    super(`Block "${blockSlug}": ${detail}`);
    this.name = "VexBlockValidationError";
  }
}
```

---

## Step 2: `defineBlock()` Factory + Tests

- [ ] Create `packages/core/src/blocks/defineBlock.ts`
- [ ] Create `packages/core/src/blocks/defineBlock.test.ts`
- [ ] Run `pnpm --filter @vexcms/core test`

### File: `packages/core/src/blocks/defineBlock.ts`

````typescript
import type { BlockDef, VexField, RESERVED_BLOCK_FIELD_NAMES } from "../types";
import { RESERVED_BLOCK_FIELD_NAMES as RESERVED } from "../types/fields";
import { VexBlockValidationError } from "../errors";

/**
 * Define a block type for use with the `blocks()` field.
 *
 * @param props.slug - Unique identifier for this block type
 * @param props.label - Display label for the admin picker
 * @param props.fields - Field definitions for this block's data shape
 * @param props.admin - Optional admin UI configuration (icon, custom components)
 * @returns A frozen BlockDef object
 *
 * @throws VexBlockValidationError if slug is empty or contains invalid characters
 * @throws VexBlockValidationError if any field name is reserved (blockType, _key)
 *
 * @example
 * ```ts
 * const heroBlock = defineBlock({
 *   slug: "hero",
 *   label: "Hero Section",
 *   fields: {
 *     heading: text({ required: true }),
 *     subheading: text(),
 *   },
 * })
 */
export function defineBlock<TFields extends Record<string, VexField>>(props: {
  slug: string;
  label: string;
  fields: TFields;
  admin?: BlockDef["admin"];
}): BlockDef<TFields> {
  // TODO: implement
  //
  // 1. Validate props.slug is non-empty and matches /^[a-zA-Z][a-zA-Z0-9_-]*$/
  //    → throw VexBlockValidationError if invalid
  //
  // 2. Validate no field name in props.fields is reserved
  //    → iterate Object.keys(props.fields)
  //    → if any key is in RESERVED array, throw VexBlockValidationError
  //       with message like 'Field name "blockType" is reserved in block definitions'
  //
  // 3. Return the block definition object: { slug, label, fields, admin }
  //
  // Edge cases:
  // - Empty fields ({}) is valid — represents a content-less block like a divider
  // - slug with hyphens/underscores is valid (e.g., "feature-grid")
  throw new Error("Not implemented");
}
````

### File: `packages/core/src/blocks/defineBlock.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { defineBlock } from "./defineBlock";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { VexBlockValidationError } from "../errors";

describe("defineBlock", () => {
  it("returns a BlockDef with correct slug, label, and fields", () => {
    const block = defineBlock({
      slug: "hero",
      label: "Hero Section",
      fields: {
        heading: text({ required: true, defaultValue: "" }),
        subheading: text(),
      },
    });

    expect(block.slug).toBe("hero");
    expect(block.label).toBe("Hero Section");
    expect(block.fields.heading.type).toBe("text");
    expect(block.fields.subheading.type).toBe("text");
  });

  it("accepts empty fields (divider block)", () => {
    const block = defineBlock({
      slug: "divider",
      label: "Divider",
      fields: {},
    });

    expect(block.slug).toBe("divider");
    expect(Object.keys(block.fields)).toHaveLength(0);
  });

  it("accepts admin config with icon", () => {
    const block = defineBlock({
      slug: "hero",
      label: "Hero",
      fields: {},
      admin: { icon: "layout-template" },
    });

    expect(block.admin?.icon).toBe("layout-template");
  });

  it("accepts slugs with hyphens and underscores", () => {
    const block = defineBlock({
      slug: "feature-grid_v2",
      label: "Feature Grid",
      fields: {},
    });

    expect(block.slug).toBe("feature-grid_v2");
  });

  it("throws on empty slug", () => {
    expect(() => defineBlock({ slug: "", label: "Test", fields: {} })).toThrow(
      VexBlockValidationError,
    );
  });

  it("throws on slug starting with a number", () => {
    expect(() =>
      defineBlock({ slug: "123hero", label: "Test", fields: {} }),
    ).toThrow(VexBlockValidationError);
  });

  it("throws on slug with spaces", () => {
    expect(() =>
      defineBlock({ slug: "my block", label: "Test", fields: {} }),
    ).toThrow(VexBlockValidationError);
  });

  it("throws when field name 'blockType' is used", () => {
    expect(() =>
      defineBlock({
        slug: "hero",
        label: "Hero",
        fields: { blockType: text() },
      }),
    ).toThrow(VexBlockValidationError);
    expect(() =>
      defineBlock({
        slug: "hero",
        label: "Hero",
        fields: { blockType: text() },
      }),
    ).toThrow(/reserved/i);
  });

  it("throws when field name '_key' is used", () => {
    expect(() =>
      defineBlock({
        slug: "hero",
        label: "Hero",
        fields: { _key: text() },
      }),
    ).toThrow(VexBlockValidationError);
  });
});
```

---

## Step 3: `blocks()` Field Factory + Tests

- [ ] Create `packages/core/src/fields/blocks/config.ts`
- [ ] Create `packages/core/src/fields/blocks/config.test.ts`
- [ ] Create `packages/core/src/fields/blocks/index.ts`
- [ ] Run `pnpm --filter @vexcms/core test`

### File: `packages/core/src/fields/blocks/config.ts`

````typescript
import type { BlocksFieldDef, BlockDef } from "../../types";
import { VexBlockValidationError } from "../../errors";

/**
 * Create a blocks field that stores an ordered array of block instances.
 *
 * @param props.blocks - Array of BlockDef objects allowed in this field
 * @param props.labels - Optional singular/plural display labels
 * @param props.min - Minimum number of blocks
 * @param props.max - Maximum number of blocks
 * @returns A BlocksFieldDef
 *
 * @throws VexBlockValidationError if two blocks share the same slug
 *
 * @example
 * ```ts
 * content: blocks({
 *   blocks: [heroBlock, ctaBlock, featureGridBlock],
 * })
 */
export function blocks(props: {
  blocks: BlockDef[];
  labels?: BlocksFieldDef["labels"];
  min?: number;
  max?: number;
  label?: string;
  description?: string;
  required?: boolean;
  admin?: BlocksFieldDef["admin"];
}): BlocksFieldDef {
  // TODO: implement
  //
  // 1. Check for duplicate block slugs within props.blocks
  //    → build a Set<string> of seen slugs
  //    → if any slug appears twice, throw VexBlockValidationError
  //       with message like 'Duplicate block slug "hero" in blocks field'
  //
  // 2. Return the BlocksFieldDef: { type: "blocks", blocks, labels?, min?, max?, ...baseField }
  //
  // Edge cases:
  // - Empty blocks array ([]) is valid — field exists but no block types available
  // - Same block object referenced twice (same JS reference) — still a duplicate slug error
  throw new Error("Not implemented");
}
````

### File: `packages/core/src/fields/blocks/config.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { blocks } from "./config";
import { defineBlock } from "../../blocks/defineBlock";
import { text } from "../text";
import { VexBlockValidationError } from "../../errors";

const heroBlock = defineBlock({
  slug: "hero",
  label: "Hero",
  fields: { heading: text({ required: true, defaultValue: "" }) },
});

const ctaBlock = defineBlock({
  slug: "cta",
  label: "CTA",
  fields: { label: text() },
});

describe("blocks()", () => {
  it("returns a BlocksFieldDef with type 'blocks'", () => {
    const field = blocks({ blocks: [heroBlock, ctaBlock] });

    expect(field.type).toBe("blocks");
    expect(field.blocks).toHaveLength(2);
    expect(field.blocks[0].slug).toBe("hero");
    expect(field.blocks[1].slug).toBe("cta");
  });

  it("passes through optional config", () => {
    const field = blocks({
      blocks: [heroBlock],
      label: "Page Content",
      required: true,
      min: 1,
      max: 10,
      labels: { singular: "block", plural: "blocks" },
    });

    expect(field.label).toBe("Page Content");
    expect(field.required).toBe(true);
    expect(field.min).toBe(1);
    expect(field.max).toBe(10);
    expect(field.labels).toEqual({ singular: "block", plural: "blocks" });
  });

  it("accepts empty blocks array", () => {
    const field = blocks({ blocks: [] });
    expect(field.blocks).toHaveLength(0);
  });

  it("throws on duplicate block slugs", () => {
    const heroBlock2 = defineBlock({
      slug: "hero",
      label: "Hero v2",
      fields: {},
    });

    expect(() => blocks({ blocks: [heroBlock, heroBlock2] })).toThrow(
      VexBlockValidationError,
    );
    expect(() => blocks({ blocks: [heroBlock, heroBlock2] })).toThrow(
      /[Dd]uplicate/,
    );
  });

  it("throws when same block passed twice", () => {
    expect(() => blocks({ blocks: [heroBlock, heroBlock] })).toThrow(
      VexBlockValidationError,
    );
  });
});
```

### File: `packages/core/src/fields/blocks/index.ts`

```typescript
export { blocks } from "./config";
export { blocksToValueTypeString } from "./schemaValueType";
export { blocksColumnDef } from "./columnDef";
```

---

## Step 4: Schema Generation + Tests

- [ ] Create `packages/core/src/fields/blocks/schemaValueType.ts`
- [ ] Create `packages/core/src/fields/blocks/schemaValueType.test.ts`
- [ ] Update `packages/core/src/valueTypes/extract.ts` — add `blocks` case
- [ ] Run `pnpm --filter @vexcms/core test`

### File: `packages/core/src/fields/blocks/schemaValueType.ts`

```typescript
import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { BlocksFieldDef, BlockDef, VexField } from "../../types";
import { VexBlockValidationError } from "../../errors";

/**
 * Converts a blocks field definition to a Convex value type string.
 *
 * Generates `v.array(v.union(v.object({...}), v.object({...})))` where each
 * v.object corresponds to a block type with `blockType: v.literal("slug")`
 * as the discriminant, `_key: v.string()`, and each block field converted
 * to its Convex value type.
 *
 * @param props.field - The BlocksFieldDef
 * @param props.collectionSlug - Parent collection slug (for error messages)
 * @param props.fieldName - Field name on the parent collection (for error messages)
 * @param props.resolveInnerField - Callback to resolve inner field value types (avoids circular imports)
 * @param props.visitedBlockSlugs - Set of block slugs already being processed (cycle detection)
 * @returns Convex value type string, e.g. `"v.array(v.union(v.object({...}), ...))"`
 *
 * @throws VexBlockValidationError if a cycle is detected in nested blocks
 */
export function blocksToValueTypeString(props: {
  field: BlocksFieldDef;
  collectionSlug: string;
  fieldName: string;
  resolveInnerField: (props: {
    field: VexField;
    collectionSlug: string;
    fieldName: string;
    visitedBlockSlugs?: Set<string>;
  }) => string;
  visitedBlockSlugs?: Set<string>;
}): string {
  // TODO: implement
  //
  // 1. Initialize visited set: props.visitedBlockSlugs ?? new Set()
  //
  // 2. If props.field.blocks is empty, generate v.array(v.any())
  //    → no block types means no union members, fall back gracefully
  //    → wrap with processFieldValueTypeOptions for optional handling
  //    → return early
  //
  // 3. For each block in props.field.blocks:
  //    a. Check if block.slug is in visited set
  //       → if yes, throw VexBlockValidationError with cycle message
  //       e.g., 'Circular block reference detected: block "columns" references itself'
  //    b. Add block.slug to a NEW copy of visited (so sibling blocks don't share state)
  //       → const blockVisited = new Set(visited); blockVisited.add(block.slug)
  //    c. Build object fields string:
  //       - Start with: blockType: v.literal("${block.slug}"), _key: v.string()
  //       - For each [fieldName, field] in Object.entries(block.fields):
  //         → call props.resolveInnerField({ field, collectionSlug, fieldName: `${props.fieldName}.${block.slug}.${fieldName}`, visitedBlockSlugs: blockVisited })
  //         → append: ${fieldName}: ${valueType}
  //    d. Combine into v.object({ ...fields })
  //
  // 4. If only one block type: valueType = v.array(v.object({...}))
  //    If multiple block types: valueType = v.array(v.union(v.object({...}), v.object({...}), ...))
  //
  // 5. Wrap with processFieldValueTypeOptions for optional handling and return
  //
  // Edge cases:
  // - Block with empty fields: v.object({ blockType: v.literal("divider"), _key: v.string() })
  // - Nested blocks: recursive call with updated visitedBlockSlugs
  // - Single block type: no v.union wrapper needed, just v.array(v.object(...))
  throw new Error("Not implemented");
}
```

### File: `packages/core/src/valueTypes/extract.ts` (update)

Add the import and case for blocks:

```typescript
// Add import at top:
import { blocksToValueTypeString } from "../fields/blocks";

// Add case before "ui" in the switch:
    case "blocks":
      return blocksToValueTypeString({
        field,
        collectionSlug,
        fieldName,
        resolveInnerField: (innerProps) =>
          fieldToValueType({
            field: innerProps.field,
            collectionSlug: innerProps.collectionSlug,
            fieldName: innerProps.fieldName,
          }),
      });
```

**Note on cycle detection wiring:** The `fieldToValueType` dispatcher currently has no `visitedBlockSlugs` parameter. To thread cycle detection through, `blocksToValueTypeString` needs to pass the visited set through the `resolveInnerField` callback. The cleanest approach:

Update `fieldToValueType` to accept an optional `visitedBlockSlugs` parameter:

```typescript
export function fieldToValueType(props: {
  field: VexField;
  collectionSlug: string;
  fieldName: string;
  visitedBlockSlugs?: Set<string>;
}): string {
```

And in the `blocks` case, pass it through:

```typescript
    case "blocks":
      return blocksToValueTypeString({
        field,
        collectionSlug,
        fieldName,
        resolveInnerField: (innerProps) =>
          fieldToValueType({
            field: innerProps.field,
            collectionSlug: innerProps.collectionSlug,
            fieldName: innerProps.fieldName,
            visitedBlockSlugs: innerProps.visitedBlockSlugs,
          }),
        visitedBlockSlugs: props.visitedBlockSlugs,
      });
```

The `array` case also calls `resolveInnerField` — it should pass through `visitedBlockSlugs` too. Update `arrayToValueTypeString` to accept and forward `visitedBlockSlugs` (no behavior change for arrays, just threading the parameter through for nested blocks-inside-arrays cases).

### File: `packages/core/src/fields/blocks/schemaValueType.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { blocksToValueTypeString } from "./schemaValueType";
import { blocks } from "./config";
import { defineBlock } from "../../blocks/defineBlock";
import { text } from "../text";
import { number } from "../number";
import { checkbox } from "../checkbox";
import { VexBlockValidationError } from "../../errors";

// Simple resolver for test isolation
function resolveInnerField(props: {
  field: any;
  collectionSlug: string;
  fieldName: string;
  visitedBlockSlugs?: Set<string>;
}): string {
  const type = props.field.type;
  if (type === "text")
    return props.field.required ? "v.string()" : "v.optional(v.string())";
  if (type === "number")
    return props.field.required ? "v.number()" : "v.optional(v.number())";
  if (type === "checkbox")
    return props.field.required ? "v.boolean()" : "v.optional(v.boolean())";
  if (type === "blocks") {
    return blocksToValueTypeString({
      field: props.field,
      collectionSlug: props.collectionSlug,
      fieldName: props.fieldName,
      resolveInnerField,
      visitedBlockSlugs: props.visitedBlockSlugs,
    });
  }
  throw new Error(`Unknown type: ${type}`);
}

const heroBlock = defineBlock({
  slug: "hero",
  label: "Hero",
  fields: {
    heading: text({ required: true, defaultValue: "" }),
    subheading: text(),
  },
});

const ctaBlock = defineBlock({
  slug: "cta",
  label: "CTA",
  fields: {
    label: text({ required: true, defaultValue: "" }),
    url: text(),
  },
});

const dividerBlock = defineBlock({
  slug: "divider",
  label: "Divider",
  fields: {},
});

describe("blocksToValueTypeString", () => {
  it("generates v.union with multiple block types", () => {
    const field = blocks({ blocks: [heroBlock, ctaBlock], required: true });
    const result = blocksToValueTypeString({
      field,
      collectionSlug: "pages",
      fieldName: "content",
      resolveInnerField,
    });

    // Should contain v.array(v.union(...))
    expect(result).toMatch(/^v\.array\(v\.union\(/);
    // Should contain blockType literals
    expect(result).toContain('v.literal("hero")');
    expect(result).toContain('v.literal("cta")');
    // Should contain _key
    expect(result).toContain("_key: v.string()");
    // Should contain field value types
    expect(result).toContain("heading: v.string()");
    expect(result).toContain("subheading: v.optional(v.string())");
    expect(result).toContain("label: v.string()");
    expect(result).toContain("url: v.optional(v.string())");
  });

  it("generates v.array(v.object(...)) for a single block type (no union)", () => {
    const field = blocks({ blocks: [heroBlock], required: true });
    const result = blocksToValueTypeString({
      field,
      collectionSlug: "pages",
      fieldName: "content",
      resolveInnerField,
    });

    // Single block — no v.union wrapper
    expect(result).toMatch(/^v\.array\(v\.object\(\{/);
    expect(result).not.toContain("v.union");
    expect(result).toContain('blockType: v.literal("hero")');
  });

  it("wraps with v.optional for non-required field", () => {
    const field = blocks({ blocks: [heroBlock] });
    const result = blocksToValueTypeString({
      field,
      collectionSlug: "pages",
      fieldName: "content",
      resolveInnerField,
    });

    expect(result).toMatch(/^v\.optional\(v\.array\(/);
  });

  it("handles block with no fields (divider)", () => {
    const field = blocks({ blocks: [dividerBlock], required: true });
    const result = blocksToValueTypeString({
      field,
      collectionSlug: "pages",
      fieldName: "content",
      resolveInnerField,
    });

    expect(result).toContain('blockType: v.literal("divider")');
    expect(result).toContain("_key: v.string()");
    // Only blockType and _key — no other fields
    const objectContent = result.match(/v\.object\(\{(.+?)\}\)/)?.[1] ?? "";
    const fieldCount = objectContent
      .split(",")
      .filter((s) => s.includes(":")).length;
    expect(fieldCount).toBe(2); // blockType + _key
  });

  it("handles empty blocks array gracefully", () => {
    const field = blocks({ blocks: [], required: true });
    const result = blocksToValueTypeString({
      field,
      collectionSlug: "pages",
      fieldName: "content",
      resolveInnerField,
    });

    expect(result).toBe("v.array(v.any())");
  });

  it("handles nested blocks (blocks within blocks)", () => {
    const innerBlock = defineBlock({
      slug: "text-block",
      label: "Text",
      fields: { body: text() },
    });

    const columnsBlock = defineBlock({
      slug: "columns",
      label: "Columns",
      fields: {
        items: blocks({ blocks: [innerBlock], required: true }),
      },
    });

    const field = blocks({ blocks: [columnsBlock], required: true });
    const result = blocksToValueTypeString({
      field,
      collectionSlug: "pages",
      fieldName: "content",
      resolveInnerField,
    });

    // Should contain the nested block structure
    expect(result).toContain('v.literal("columns")');
    expect(result).toContain('v.literal("text-block")');
  });

  it("detects direct cycle (block references itself)", () => {
    // Manually construct a cyclic block (can't use defineBlock for this since
    // the block doesn't exist yet when defining fields)
    const selfRef: any = {
      type: "blocks" as const,
      blocks: [],
      required: true,
    };
    const cyclicBlock = {
      slug: "recursive",
      label: "Recursive",
      fields: { children: selfRef },
    };
    selfRef.blocks = [cyclicBlock];

    const field = {
      type: "blocks" as const,
      blocks: [cyclicBlock],
      required: true,
    } as any;

    expect(() =>
      blocksToValueTypeString({
        field,
        collectionSlug: "pages",
        fieldName: "content",
        resolveInnerField,
      }),
    ).toThrow(VexBlockValidationError);
    expect(() =>
      blocksToValueTypeString({
        field,
        collectionSlug: "pages",
        fieldName: "content",
        resolveInnerField,
      }),
    ).toThrow(/[Cc]ircular|[Cc]ycle/);
  });

  it("allows same block type in sibling blocks fields (no false cycle)", () => {
    const sharedBlock = defineBlock({
      slug: "card",
      label: "Card",
      fields: { title: text() },
    });

    // Two different blocks fields on the same collection, both using sharedBlock — NOT a cycle
    const field = blocks({ blocks: [sharedBlock], required: true });

    expect(() =>
      blocksToValueTypeString({
        field,
        collectionSlug: "pages",
        fieldName: "sidebar",
        resolveInnerField,
      }),
    ).not.toThrow();
  });
});
```

---

## Step 5: Zod Form Validation + Tests

- [ ] Update `packages/core/src/formSchema/generateFormSchema.ts` — add `blocks` case
- [ ] Update `packages/core/src/formSchema/generateFormSchema.test.ts` — add blocks tests
- [ ] Run `pnpm --filter @vexcms/core test`

### File: `packages/core/src/formSchema/generateFormSchema.ts` (update)

Add the `blocks` case to the `fieldMetaToZod` switch:

```typescript
    case "blocks": {
      // Each block instance is validated as an object with blockType discriminant
      const blockSchemas = props.field.blocks.map((blockDef) => {
        const shape: Record<string, ZodTypeAny> = {
          blockType: z.literal(blockDef.slug),
          _key: z.string(),
        };
        for (const [fieldName, field] of Object.entries(blockDef.fields)) {
          let validator = fieldMetaToZod({ field: field as VexField });
          if (!(field as VexField).required) {
            validator = validator.optional();
          }
          shape[fieldName] = validator;
        }
        return z.object(shape);
      });

      if (blockSchemas.length === 0) {
        let schema = z.array(z.any());
        if (props.field.min != null) schema = schema.min(props.field.min);
        if (props.field.max != null) schema = schema.max(props.field.max);
        return schema;
      }

      const union =
        blockSchemas.length === 1
          ? blockSchemas[0]
          : z.discriminatedUnion("blockType", blockSchemas as [z.ZodObject<any>, z.ZodObject<any>, ...z.ZodObject<any>[]]);

      let schema = z.array(union);
      if (props.field.min != null) schema = schema.min(props.field.min);
      if (props.field.max != null) schema = schema.max(props.field.max);
      return schema;
    }
```

### Tests to add to `packages/core/src/formSchema/generateFormSchema.test.ts`

```typescript
import { defineBlock } from "../blocks/defineBlock";
import { blocks } from "../fields/blocks";

// Add these tests within the existing describe block:

describe("fieldMetaToZod — blocks", () => {
  const heroBlock = defineBlock({
    slug: "hero",
    label: "Hero",
    fields: {
      heading: text({ required: true, defaultValue: "" }),
      subheading: text(),
    },
  });

  const ctaBlock = defineBlock({
    slug: "cta",
    label: "CTA",
    fields: { label: text({ required: true, defaultValue: "" }) },
  });

  it("validates a correct block instance", () => {
    const schema = fieldMetaToZod({
      field: blocks({ blocks: [heroBlock, ctaBlock] }),
    });

    const result = schema.safeParse([
      { blockType: "hero", _key: "abc", heading: "Welcome", subheading: "Hi" },
      { blockType: "cta", _key: "def", label: "Click me" },
    ]);

    expect(result.success).toBe(true);
  });

  it("rejects block with wrong blockType", () => {
    const schema = fieldMetaToZod({
      field: blocks({ blocks: [heroBlock] }),
    });

    const result = schema.safeParse([
      { blockType: "unknown", _key: "abc", heading: "Hi" },
    ]);

    expect(result.success).toBe(false);
  });

  it("rejects block missing required field", () => {
    const schema = fieldMetaToZod({
      field: blocks({ blocks: [heroBlock] }),
    });

    const result = schema.safeParse([
      { blockType: "hero", _key: "abc" }, // missing required "heading"
    ]);

    expect(result.success).toBe(false);
  });

  it("accepts empty array", () => {
    const schema = fieldMetaToZod({
      field: blocks({ blocks: [heroBlock] }),
    });

    const result = schema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it("enforces min/max constraints", () => {
    const schema = fieldMetaToZod({
      field: blocks({ blocks: [heroBlock], min: 1, max: 3 }),
    });

    expect(schema.safeParse([]).success).toBe(false); // below min
    expect(
      schema.safeParse([
        { blockType: "hero", _key: "a", heading: "1" },
        { blockType: "hero", _key: "b", heading: "2" },
        { blockType: "hero", _key: "c", heading: "3" },
        { blockType: "hero", _key: "d", heading: "4" },
      ]).success,
    ).toBe(false); // above max
  });

  it("validates block with no fields (divider)", () => {
    const divider = defineBlock({
      slug: "divider",
      label: "Divider",
      fields: {},
    });
    const schema = fieldMetaToZod({
      field: blocks({ blocks: [divider] }),
    });

    const result = schema.safeParse([{ blockType: "divider", _key: "abc" }]);
    expect(result.success).toBe(true);
  });
});
```

---

## Step 6: Column Definition + Tests

- [ ] Create `packages/core/src/fields/blocks/columnDef.ts`
- [ ] Create `packages/core/src/fields/blocks/columnDef.test.ts`
- [ ] Update `packages/core/src/columns/generateColumns.ts` — add `blocks` case
- [ ] Run `pnpm --filter @vexcms/core test`

### File: `packages/core/src/fields/blocks/columnDef.ts`

```typescript
import type { ColumnDef } from "@tanstack/react-table";
import type { BlocksFieldDef } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for a blocks field.
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.field.label ?? toTitleCase(props.fieldKey)
 * - cell: shows block count — "no blocks", "1 block", "3 blocks"
 *   Uses field.labels if provided (e.g., "1 section", "3 sections").
 */
export function blocksColumnDef(props: {
  fieldKey: string;
  field: BlocksFieldDef;
}): ColumnDef<Record<string, unknown>> {
  const singular = props.field.labels?.singular ?? "block";
  const plural = props.field.labels?.plural ?? "blocks";

  return {
    accessorKey: props.fieldKey,
    header: props.field.label ?? toTitleCase(props.fieldKey),
    meta: { align: props.field.admin?.cellAlignment ?? "left" },
    cell: (info) => {
      const value = info.getValue();
      if (!Array.isArray(value) || value.length === 0) return `no ${plural}`;
      if (value.length === 1) return `1 ${singular}`;
      return `${value.length} ${plural}`;
    },
  };
}
```

### File: `packages/core/src/fields/blocks/columnDef.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { blocksColumnDef } from "./columnDef";
import { blocks } from "./config";
import { defineBlock } from "../../blocks/defineBlock";
import { text } from "../text";

const heroBlock = defineBlock({
  slug: "hero",
  label: "Hero",
  fields: { heading: text() },
});

describe("blocksColumnDef", () => {
  it("uses field label as header when provided", () => {
    const col = blocksColumnDef({
      fieldKey: "content",
      field: blocks({ blocks: [heroBlock], label: "Page Content" }),
    });

    expect(col.header).toBe("Page Content");
  });

  it("uses toTitleCase(fieldKey) as header when no label", () => {
    const col = blocksColumnDef({
      fieldKey: "pageContent",
      field: blocks({ blocks: [heroBlock] }),
    });

    expect(col.header).toBe("Page Content");
  });

  it("shows 'no blocks' for empty array", () => {
    const col = blocksColumnDef({
      fieldKey: "content",
      field: blocks({ blocks: [heroBlock] }),
    });

    const cellFn = (col as any).cell;
    expect(cellFn({ getValue: () => [] })).toBe("no blocks");
    expect(cellFn({ getValue: () => null })).toBe("no blocks");
  });

  it("shows '1 block' for single item", () => {
    const col = blocksColumnDef({
      fieldKey: "content",
      field: blocks({ blocks: [heroBlock] }),
    });

    const cellFn = (col as any).cell;
    expect(cellFn({ getValue: () => [{ blockType: "hero" }] })).toBe("1 block");
  });

  it("shows 'N blocks' for multiple items", () => {
    const col = blocksColumnDef({
      fieldKey: "content",
      field: blocks({ blocks: [heroBlock] }),
    });

    const cellFn = (col as any).cell;
    expect(cellFn({ getValue: () => [{}, {}, {}] })).toBe("3 blocks");
  });

  it("uses custom labels when provided", () => {
    const col = blocksColumnDef({
      fieldKey: "content",
      field: blocks({
        blocks: [heroBlock],
        labels: { singular: "section", plural: "sections" },
      }),
    });

    const cellFn = (col as any).cell;
    expect(cellFn({ getValue: () => [] })).toBe("no sections");
    expect(cellFn({ getValue: () => [{}] })).toBe("1 section");
    expect(cellFn({ getValue: () => [{}, {}] })).toBe("2 sections");
  });
});
```

### File: `packages/core/src/columns/generateColumns.ts` (update)

Add import and case:

```typescript
// Add import:
import { blocksColumnDef } from "../fields/blocks/columnDef";

// Add case in buildColumnDef switch, before default:
    case "blocks":
      return blocksColumnDef({ fieldKey, field });
```

---

## Step 7: Form Default Values + InferFieldType

- [ ] Update `packages/core/src/formSchema/generateFormDefaultValues.ts` — add `blocks` case
- [ ] Verify `InferFieldType` update from Step 1 compiles correctly
- [ ] Run `pnpm --filter @vexcms/core test`

### File: `packages/core/src/formSchema/generateFormDefaultValues.ts` (update)

Add the `blocks` case to the `getFormDefaultValue` switch, before the `ui` case:

```typescript
    case "blocks":
      return [];
```

---

## Step 8: Core Package Exports

- [ ] Update `packages/core/src/index.ts` — add exports
- [ ] Run `pnpm build`
- [ ] Verify no type errors

### File: `packages/core/src/index.ts` (update)

Add the following exports:

```typescript
// Block helpers
export { defineBlock } from "./blocks/defineBlock";
export { blocks } from "./fields/blocks";
```

Add to the type exports block:

```typescript
  // Block types
  BlockDef,
  BlockAdminConfig,
  BlocksFieldDef,
  InferBlockUnion,
```

---

## Step 9: `RenderBlocks` Component + Tests

- [ ] Create `packages/ui/src/components/RenderBlocks.tsx`
- [ ] Create `packages/ui/src/components/RenderBlocks.test.tsx`
- [ ] Update `packages/ui/src/components/index.ts` — export RenderBlocks
- [ ] Run tests

### File: `packages/ui/src/components/RenderBlocks.tsx`

````tsx
import React from "react";

/**
 * Props for a block component rendered by RenderBlocks.
 * Each block component receives its full block data plus the index.
 */
export interface BlockComponentProps<
  TBlock extends { blockType: string; _key: string } = {
    blockType: string;
    _key: string;
  },
> {
  /** The full block data object including blockType, _key, and all field values. */
  block: TBlock;
  /** The index of this block in the array (0-based). */
  index: number;
}

/**
 * A lightweight component that renders an ordered list of blocks using a component map.
 *
 * @param props.blocks - Array of block instances (each must have `blockType` and `_key`)
 * @param props.components - Map of blockType slug → React component
 * @param props.fallback - Optional component to render when a block's type has no matching component
 *
 * @example
 * ```tsx
 * import { RenderBlocks } from "@vexcms/ui"
 *
 * const components = {
 *   hero: HeroComponent,
 *   cta: CTAComponent,
 * }
 *
 * <RenderBlocks blocks={page.content} components={components} />
 */
export function RenderBlocks<
  TBlock extends { blockType: string; _key: string },
>(props: {
  blocks: TBlock[] | null | undefined;
  components: Record<string, React.ComponentType<BlockComponentProps<any>>>;
  fallback?: React.ComponentType<BlockComponentProps<any>>;
}): React.ReactElement | null {
  // TODO: implement
  //
  // 1. If props.blocks is null/undefined or empty array, return null
  //
  // 2. Map over props.blocks:
  //    a. For each block, look up props.components[block.blockType]
  //    b. If found: render <Component block={block} index={index} key={block._key} />
  //    c. If not found and props.fallback exists: render <Fallback block={block} index={index} key={block._key} />
  //    d. If not found and no fallback: skip (return null for this item)
  //
  // 3. Return the mapped elements wrapped in a React fragment
  //
  // Edge cases:
  // - blocks is null or undefined → return null
  // - block.blockType not in components map and no fallback → silently skip
  // - _key used as React key for stable rendering during reorder
  throw new Error("Not implemented");
}
````

### File: `packages/ui/src/components/RenderBlocks.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RenderBlocks, type BlockComponentProps } from "./RenderBlocks";

function HeroComponent({
  block,
  index,
}: BlockComponentProps<{ blockType: "hero"; _key: string; heading: string }>) {
  return (
    <div data-block="hero" data-index={index}>
      {block.heading}
    </div>
  );
}

function CTAComponent({
  block,
}: BlockComponentProps<{ blockType: "cta"; _key: string; label: string }>) {
  return <button>{block.label}</button>;
}

function FallbackComponent({ block }: BlockComponentProps) {
  return <div data-fallback>{block.blockType}</div>;
}

const components = {
  hero: HeroComponent,
  cta: CTAComponent,
};

describe("RenderBlocks", () => {
  it("renders blocks using the component map", () => {
    const html = renderToStaticMarkup(
      <RenderBlocks
        blocks={[
          { blockType: "hero", _key: "a", heading: "Welcome" },
          { blockType: "cta", _key: "b", label: "Click" },
        ]}
        components={components}
      />,
    );

    expect(html).toContain("Welcome");
    expect(html).toContain("Click");
    expect(html).toContain('data-block="hero"');
  });

  it("returns null for null blocks", () => {
    const result = renderToStaticMarkup(
      <RenderBlocks blocks={null} components={components} />,
    );
    expect(result).toBe("");
  });

  it("returns null for undefined blocks", () => {
    const result = renderToStaticMarkup(
      <RenderBlocks blocks={undefined} components={components} />,
    );
    expect(result).toBe("");
  });

  it("returns null for empty array", () => {
    const result = renderToStaticMarkup(
      <RenderBlocks blocks={[]} components={components} />,
    );
    expect(result).toBe("");
  });

  it("skips blocks with no matching component and no fallback", () => {
    const html = renderToStaticMarkup(
      <RenderBlocks
        blocks={[
          { blockType: "hero", _key: "a", heading: "Hi" },
          { blockType: "unknown", _key: "b" },
        ]}
        components={components}
      />,
    );

    expect(html).toContain("Hi");
    expect(html).not.toContain("unknown");
  });

  it("renders fallback for unrecognized block types", () => {
    const html = renderToStaticMarkup(
      <RenderBlocks
        blocks={[{ blockType: "unknown", _key: "a" }]}
        components={components}
        fallback={FallbackComponent}
      />,
    );

    expect(html).toContain("unknown");
    expect(html).toContain("data-fallback");
  });

  it("passes correct index to each block component", () => {
    const html = renderToStaticMarkup(
      <RenderBlocks
        blocks={[
          { blockType: "hero", _key: "a", heading: "First" },
          { blockType: "hero", _key: "b", heading: "Second" },
        ]}
        components={components}
      />,
    );

    expect(html).toContain('data-index="0"');
    expect(html).toContain('data-index="1"');
  });
});
```

### File: `packages/ui/src/components/index.ts` (update)

Add the export:

```typescript
export { RenderBlocks, type BlockComponentProps } from "./RenderBlocks";
```

---

## Success Criteria

- [ ] `defineBlock()` validates slug format and rejects reserved field names
- [ ] `blocks()` detects duplicate block slugs within a single field
- [ ] Schema generation produces `v.array(v.union(v.object({blockType: v.literal("..."), _key: v.string(), ...}), ...))` for multi-block fields
- [ ] Schema generation produces `v.array(v.object({...}))` (no union) for single-block fields
- [ ] Schema generation wraps with `v.optional(...)` for non-required blocks fields
- [ ] Schema generation handles nested blocks (blocks within blocks)
- [ ] Schema generation detects and rejects circular block references
- [ ] Schema generation handles empty-fields blocks (divider pattern)
- [ ] Zod validation validates block instances against their block definition's fields
- [ ] Zod validation uses `z.discriminatedUnion("blockType", ...)` for multi-block fields
- [ ] Column definition shows "N blocks" with customizable labels
- [ ] `InferFieldType` produces a discriminated union of block shapes
- [ ] `RenderBlocks` dispatches to correct components via blockType lookup
- [ ] `RenderBlocks` handles null/undefined/empty gracefully
- [ ] `RenderBlocks` supports a fallback component for unknown block types
- [ ] All new code exported from `@vexcms/core` and `@vexcms/ui`
- [ ] `pnpm build` passes
- [ ] All new tests pass
