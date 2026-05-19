# 29 — Array, Object, and Blocks Field Types

**Status:** Draft (not started)

**Overview:** Implement three field types:
1. **Array field** - for arrays of other field types (supports recursion for nested arrays)
2. **Object field** - for nested object structures with multiple fields
3. **Blocks field** - for custom UI blocks with recursive support (blocks within blocks, but not same block within itself)

---

## Part 1: Array Field

### Design

The array field stores an ordered list of items, where each item is another field type.

```ts
import { array, text, number, select, object, array as arr } from "@vexcms/core"

// Basic array of strings
const tags = array({
  items: text(),
})

// Array with constraints
const socialLinks = array({
  items: text(),
  min: 1,
  max: 10,
})

// Array of select options
const colors = array({
  items: select({
    options: [
      { value: "red", label: "Red" },
      { value: "blue", label: "Blue" },
    ],
  }),
})

// Nested arrays (recursive)
const matrix = arr({
  items: arr({
    items: number(),
  }),
})

// Array of objects
const addresses = array({
  items: object({
    fields: {
      street: text(),
      city: text(),
      zip: number(),
    },
  }),
})
```

### Field Config Type

```ts
type ArrayFieldConfig = FieldConfig & {
  type: "array"
  items: FieldConfig  // Can be any field type including another array
  min?: number        // Minimum number of items
  max?: number        // Maximum number of items
}
```

### Function Signature

```ts
export function array(
  config: ArrayFieldConfig & { items: FieldConfig }
): FieldConfig {
  return {
    type: "array",
    items: config.items,
    min: config.min,
    max: config.max,
    admin: config.admin,
    meta: { ...config.meta, fieldType: "array" },
  }
}
```

### Convex Validator Mapping

```ts
function fieldConfigToConvexValidator(field: FieldConfig): any {
  // ...
  case "array":
    return v.array(fieldConfigToConvexValidator(field.items!))
  // ...
}
```

### Validation (runtime)

```ts
// In admin or before save
function validateArray(field: ArrayFieldConfig, value: unknown[]): ValidationResult {
  if (field.min !== undefined && value.length < field.min) {
    return { valid: false, error: `Minimum ${field.min} items required` }
  }
  if (field.max !== undefined && value.length > field.max) {
    return { valid: false, error: `Maximum ${field.max} items allowed` }
  }
  return { valid: true }
}
```

### Admin UI

- Array field renders as expandable list
- Each item has add/remove/reorder controls
- Nested array renders within each item
- Shows item count, respects min/max constraints

---

## Part 2: Object Field

### Design

The object field stores nested structured data with multiple named fields.

```ts
import { object, text, number, checkbox } from "@vexcms/core"

// Basic object
const address = object({
  fields: {
    street: text(),
    city: text(),
    state: text(),
    zip: number(),
    country: text({ defaultValue: "USA" }),
  },
})

// Object with constraints
const userProfile = object({
  fields: {
    displayName: text(),
    bio: text(),
    avatar: text(),
    isPublic: checkbox(),
  },
  meta: { description: "User profile information" },
})

// Nested objects
const company = object({
  fields: {
    name: text(),
    address: object({
      fields: {
        street: text(),
        city: text(),
      },
    }),
    employees: array({
      items: object({
        fields: {
          name: text(),
          role: text(),
        },
      }),
    }),
  },
})
```

### Field Config Type

```ts
type ObjectFieldConfig = FieldConfig & {
  type: "object"
  fields: Record<string, FieldConfig>  // Named sub-fields
}
```

### Function Signature

```ts
export function object(
  config: ObjectFieldConfig & { fields: Record<string, FieldConfig> }
): FieldConfig {
  return {
    type: "object",
    fields: config.fields,
    admin: config.admin,
    meta: { ...config.meta, fieldType: "object" },
  }
}
```

### Convex Validator Mapping

```ts
case "object":
  return v.object(
    Object.fromEntries(
      Object.entries(field.fields!).map(([key, subField]) => [
        key,
        fieldConfigToConvexValidator(subField)
      ])
    )
  )
```

### Admin UI

- Object field renders as nested form section
- Collapsible with field count indicator
- Sub-fields are typed and validated
- Nested objects/arrays render recursively

---

## Part 3: Blocks Field

### Design

Blocks are custom UI components stored as data. Each block has a type and fields.

```ts
import { blocks, text, number, select, array } from "@vexcms/react"

// Define block types
const headingBlock = defineBlock({
  type: "heading",
  fields: {
    level: select({
      options: [
        { value: "1", label: "H1" },
        { value: "2", label: "H2" },
        { value: "3", label: "H3" },
      ],
    }),
    text: text(),
  },
})

const paragraphBlock = defineBlock({
  type: "paragraph",
  fields: {
    content: text(),
  },
})

const columnsBlock = defineBlock({
  type: "columns",
  fields: {
    columns: number({ defaultValue: 2 }),
    children: array({
      items: blocks({
        blocks: [headingBlock, paragraphBlock], // Recursive - but NOT same block
      }),
    }),
  },
})

// Use in collection
const pages = defineCollection({
  slug: "pages",
  fields: {
    title: text(),
    blocks: blocks({
      blocks: [headingBlock, paragraphBlock, columnsBlock],
    }),
  },
})
```

### Block Data Structure

```ts
type Block = {
  _id: string                    // Unique block ID
  _blockType: string             // Block type identifier
  [key: string]: unknown         // Custom fields based on block type
}
```

Example block data:
```json
{
  "_id": "abc123",
  "_blockType": "heading",
  "level": "1",
  "text": "Welcome to the site"
}
```

### Block Definition

```ts
type BlockDefinition = {
  type: string
  fields: Record<string, FieldConfig>
  admin?: FieldAdminConfigInput
  meta?: FieldMetaConfig
}

export function defineBlock(config: BlockDefinition): BlockDefinition {
  return config
}
```

### Blocks Field Config

```ts
type BlocksFieldConfig = FieldConfig & {
  type: "blocks"
  blocks: BlockDefinition[]  // Allowed block types
}
```

### Function Signature

```ts
export function blocks(
  config: BlocksFieldConfig & { blocks: BlockDefinition[] }
): FieldConfig {
  return {
    type: "blocks",
    blocks: config.blocks,
    admin: config.admin,
    meta: { ...config.meta, fieldType: "blocks" },
  }
}
```

### Recursive Block Constraint

Blocks can contain other blocks (e.g., columns with headings/paragraphs), but a block type cannot contain itself:

```ts
// Valid - columns can contain heading and paragraph
const columnsBlock = defineBlock({
  type: "columns",
  fields: {
    children: array({
      items: blocks({
        blocks: [headingBlock, paragraphBlock], // ✅ Allowed
      }),
    }),
  },
})

// Invalid - heading cannot contain heading (same type)
const headingBlock = defineBlock({
  type: "heading",
  fields: {
    children: array({
      items: blocks({
        blocks: [headingBlock], // ❌ Not allowed - same block within itself
      }),
    }),
  },
})
```

Implementation will validate this at config time.

### RenderBlocks Component

Located in `apps/www/src/components/RenderBlocks.tsx` (stays in www, not moved to react package).

```tsx
type BlockProps<TBlockType extends string, TContext extends object> = {
  block: Block
  blocksComponent: Record<string, (props: {
    fields: Record<string, unknown>
    context: TContext
    block: Block
  }) => ReactNode>
  context: TContext
}

function RenderBlocks<TBlockType extends string, TContext extends object>({
  blocks,
  blocksComponent,
  context,
}: {
  blocks: Block[]
  blocksComponent: Record<TBlockType, (props: {
    fields: Record<string, unknown>
    context: TContext
    block: Block
  }) => ReactNode>
  context: TContext
}) {
  return (
    <div className="blocks">
      {blocks.map((block) => {
        const Component = blocksComponent[block._blockType as TBlockType]
        if (!Component) return null
        
        return (
          <div key={block._id} className={`block block-${block._blockType}`}>
            <Component
              fields={block}
              context={context}
              block={block}
            />
          </div>
        )
      })}
    </div>
  )
}
```

### Usage Example

```tsx
// Define block components
const myBlocksComponent = {
  heading: ({ fields, context }) => (
    <h1 style={{ color: context.themeColor }}>{fields.text}</h1>
  ),
  paragraph: ({ fields, context }) => (
    <p style={{ fontSize: context.fontSize }}>{fields.content}</p>
  ),
  columns: ({ fields, context }) => (
    <div style={{ columns: fields.columns }}>
      <RenderBlocks
        blocks={fields.children}
        blocksComponent={myBlocksComponent}
        context={context}
      />
    </div>
  ),
} satisfies Record<string, (props: {
  fields: Record<string, unknown>
  context: { themeColor: string; fontSize: number }
  block: Block
}) => ReactNode>

// Use in page
function PageContent({ page }) {
  return (
    <RenderBlocks
      blocks={page.blocks}
      blocksComponent={myBlocksComponent}
      context={{ themeColor: "#000", fontSize: 16 }}
    />
  )
}
```

### Free Blocks for WWW

Blocks included in www app without requiring plugins:

| Block Type | Fields | Description |
|------------|--------|-------------|
| `heading` | `level`, `text` | H1-H6 heading |
| `paragraph` | `content` | Rich text paragraph |
| `button` | `text`, `href`, `variant` | CTA button |
| `image` | `src`, `alt`, `caption` | Image with caption |
| `video` | `url`, `caption` | Video embed (YouTube/Vimeo) |
| `spacer` | `height` | Vertical spacing |
| `divider` | `style` | Horizontal line |
| `columns` | `columns`, `children` | Multi-column layout |
| `quote` | `text`, `citation` | Blockquote |
| `code` | `code`, `language` | Code block |
| `callout` | `type`, `content` | Alert/info box |

---

## Status / Progress

- [ ] ⏳ Add `array` field type to `@vexcms/core`
- [ ] ⏳ Add `object` field type to `@vexcms/core`
- [ ] ⏳ Add `blocks` field type to `@vexcms/react`
- [ ] ⏳ Create `defineBlock()` function
- [ ] ⏳ Implement recursive block constraint validation
- [ ] ⏳ Create `RenderBlocks` component in www app
- [ ] ⏳ Implement free block types in www app
- [ ] ⏳ Update pages collection to use blocks field
- [ ] ⏳ Test block rendering in pages

---

## Design Decisions

| # | Decision |
|---|----------|
| D1 | Array field uses `items` property for nested field type |
| D2 | Array field supports recursive nesting (array of arrays) |
| D3 | Array field has `min`/`max` constraints for item count |
| D4 | Object field uses `fields` property for sub-field definitions |
| D5 | Blocks field uses `blocks` property for block type definitions |
| D6 | Block data uses `_id` and `_blockType` as special fields |
| D7 | Blocks are recursive but block cannot contain itself (validated at config time) |
| D8 | `RenderBlocks` stays in www app, not moved to react package |
| D9 | `RenderBlocks` takes `blocksComponent` as Record for user control |
| D10 | Additional context passed to all blocks via `context` prop |

---

## Implementation Order

### Step 1 — Add array field [dev]

**File:** `packages/core/src/fields/array/index.ts`

```ts
import { defineField } from "../define"
import type { FieldConfig, FieldInput, FieldMetaConfig } from "../types"

export type ArrayFieldMeta = FieldMetaConfig & {
  fieldType: "array"
  minItems?: number
  maxItems?: number
}

export function array(
  config: FieldInput<ArrayFieldMeta> & {
    items: FieldConfig
    min?: number
    max?: number
  }
): FieldConfig {
  return defineField({
    type: "array",
    items: config.items,
    min: config.min,
    max: config.max,
    admin: config.admin,
    meta: { ...config.meta, fieldType: "array", minItems: config.min, maxItems: config.max },
  })
}
```

Update `fieldConfigToConvexValidator`:
```ts
case "array":
  return v.array(fieldConfigToConvexValidator(field.items!))
```

Update field type exports in `packages/core/src/index.ts`.

### Step 2 — Add object field [dev]

**File:** `packages/core/src/fields/object/index.ts`

```ts
import { defineField } from "../define"
import type { FieldConfig, FieldInput, FieldMetaConfig } from "../types"

export type ObjectFieldMeta = FieldMetaConfig & {
  fieldType: "object"
}

export function object(
  config: FieldInput<ObjectFieldMeta> & {
    fields: Record<string, FieldConfig>
  }
): FieldConfig {
  return defineField({
    type: "object",
    fields: config.fields,
    admin: config.admin,
    meta: { ...config.meta, fieldType: "object" },
  })
}
```

Update `fieldConfigToConvexValidator`:
```ts
case "object":
  return v.object(
    Object.fromEntries(
      Object.entries(field.fields!).map(([key, subField]) => [
        key,
        fieldConfigToConvexValidator(subField)
      ])
    )
  )
```

Update field type exports in `packages/core/src/index.ts`.

### Step 3 — Create blocks field [dev]

**File:** `packages/react/src/fields/blocks/index.tsx`

```ts
import type { FieldConfig } from "@vexcms/core"

export type BlockDefinition = {
  type: string
  fields: Record<string, FieldConfig>
  admin?: FieldAdminConfigInput
  meta?: FieldMetaConfig
}

export type Block = {
  _id: string
  _blockType: string
  [key: string]: unknown
}

export function defineBlock(config: BlockDefinition): BlockDefinition {
  return config
}

export type BlocksFieldMeta = FieldMetaConfig & {
  fieldType: "blocks"
  allowedBlocks?: string[]
}

export function blocks(
  config: FieldConfig & {
    blocks: BlockDefinition[]
  }
): FieldConfig {
  // Validate no block contains itself
  validateBlockRecursion(config.blocks)
  
  return {
    ...config,
    type: "blocks",
    blocks: config.blocks,
    meta: { ...config.meta, fieldType: "blocks" },
  }
}

function validateBlockRecursion(blockDefs: BlockDefinition[]) {
  // Check that no block type appears in its own children
  // Implementation detail: traverse block types and detect cycles
}
```

### Step 4 — Create RenderBlocks component [dev]

**File:** `apps/www/src/components/RenderBlocks.tsx`

```tsx
import type { Block } from "@vexcms/react"

type BlockComponent<TContext extends object> = (props: {
  fields: Record<string, unknown>
  context: TContext
  block: Block
}) => React.ReactNode

type RenderBlocksProps<TBlockType extends string, TContext extends object> = {
  blocks: Block[]
  blocksComponent: Record<TBlockType, BlockComponent<TContext>>
  context: TContext
}

export function RenderBlocks<TBlockType extends string, TContext extends object>({
  blocks,
  blocksComponent,
  context,
}: RenderBlocksProps<TBlockType, TContext>) {
  return (
    <div className="blocks">
      {blocks.map((block) => {
        const Component = blocksComponent[block._blockType as TBlockType]
        if (!Component) return null
        
        return (
          <div key={block._id} className={`block block-${block._blockType}`}>
            <Component
              fields={block}
              context={context}
              block={block}
            />
          </div>
        )
      })}
    </div>
  )
}
```

### Step 5 — Create free block definitions [dev]

**File:** `apps/www/src/blocks/definitions.ts`

Export block definitions for heading, paragraph, button, image, video, spacer, divider, columns, quote, code, callout.

### Step 6 — Update pages collection [dev]

Update `apps/www/vex.config.ts` to use blocks field for pages.

---

## Verification

```bash
pnpm typecheck
pnpm test

# Test in www:
# 1. Create page with blocks
# 2. Render blocks correctly
# 3. Nested blocks work (columns with headings)
# 4. Recursive constraint enforced (heading can't contain heading)
```

---

## Success Criteria

1. `array` field works with any nested field type including recursion
2. `object` field works with named sub-fields
3. `blocks` field works with block definitions
4. Recursive blocks work (columns contain headings)
5. Block self-reference is prevented at config time
6. `RenderBlocks` renders blocks with context
7. User can build custom block components
8. Free blocks available in www app

---

## References

- `packages/core/src/fields/` — existing field implementations
- `packages/react/src/fields/` — field implementations
- `apps/www/src/components/RenderBlocks.tsx` — (needs to be created)
- `apps/www/src/blocks/` — (needs to be created)
- `apps/www/vex.config.ts` — current config