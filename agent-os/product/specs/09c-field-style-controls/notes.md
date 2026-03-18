# Spec 09c — Field Style Controls & Cross-Collection Copy/Paste

**Depends on:** Spec 09b (Custom Component Registration) — must land first so custom admin components can receive and apply style configs.

**Phase:** 2 (after Spec 09b)

---

## Overview

A universal field-level style configuration system. Each field in the admin panel gets a popover (opened via tooltip icon on the input) containing a form for minute visual/interaction controls. These styles apply to the HTML wrapper of every field component — built-in or custom.

Additionally, a clipboard system for copying field/block definitions and style configs across collections.

---

## Style Config Tiers

### Tier 1: ContainerStyleConfig (universal, all field types)

Applied automatically by the admin panel to the outer `<div>` wrapping every field component. The field component itself does not need to know about these.

```ts
type ContainerStyleConfig = {
  margin?: SpacingValue          // top/right/bottom/left
  padding?: SpacingValue         // top/right/bottom/left
  width?: string                 // %, px, auto
  maxWidth?: string
  minWidth?: string
  backgroundColor?: string
  borderWidth?: string
  borderColor?: string
  borderStyle?: string
  borderRadius?: string
  boxShadow?: string             // preset options or custom
  opacity?: number
  cursor?: CSSCursor             // pointer, not-allowed, grab, etc.
  display?: 'block' | 'flex' | 'none'
  overflow?: 'hidden' | 'scroll' | 'auto'
  hover?: {
    backgroundColor?: string
    borderColor?: string
    boxShadow?: string
    opacity?: number
  }
  transition?: string            // duration/easing for hover states
}
```

### Tier 2: Inner style configs (type-specific, passed as props)

These are passed to the field component which decides how/where to apply them internally.

```ts
type TextStyleConfig = {
  textAlign?: 'left' | 'center' | 'right'
  fontSize?: string
  fontWeight?: string
  color?: string
}

type MediaStyleConfig = {
  objectFit?: 'cover' | 'contain' | 'fill'
  aspectRatio?: string
}

type LayoutStyleConfig = {
  gap?: string
  flexDirection?: 'row' | 'column'
}
```

### Field Type → Style Config Mapping

```ts
type FieldStyleMap = {
  text:         ContainerStyleConfig & TextStyleConfig
  textarea:     ContainerStyleConfig & TextStyleConfig
  richtext:     ContainerStyleConfig & TextStyleConfig
  number:       ContainerStyleConfig & TextStyleConfig
  image:        ContainerStyleConfig & MediaStyleConfig
  file:         ContainerStyleConfig & MediaStyleConfig
  upload:       ContainerStyleConfig & MediaStyleConfig
  array:        ContainerStyleConfig & LayoutStyleConfig
  blocks:       ContainerStyleConfig & LayoutStyleConfig
  group:        ContainerStyleConfig & LayoutStyleConfig
  checkbox:     ContainerStyleConfig
  select:       ContainerStyleConfig
  relationship: ContainerStyleConfig
  date:         ContainerStyleConfig
}
```

---

## Custom Block Style Registration

Custom components declare which inner style tiers they accept:

```ts
defineBlock({
  slug: 'hero-banner',
  admin: {
    component: HeroBanner,
    styleConfig: ['container', 'text', 'media'], // popover shows all three sections
  }
})
```

If `styleConfig` is omitted, defaults to `['container']` only.

Custom component receives styles as separate props:

```tsx
const HeroBanner = ({ containerStyles, innerStyles }) => {
  // containerStyles already applied by admin panel on outer div
  // innerStyles contains type-specific styles for internal use
  return (
    <div>
      <h1 style={innerStyles.text}>...</h1>
      <img style={innerStyles.media} />
    </div>
  )
}
```

---

## Popover UI

- Trigger: small icon/tooltip on each field input in the admin panel
- Opens a popover form with collapsible sections
- Sections shown are determined by field type (or custom block's `styleConfig` declaration):
  - **Container** (always shown): spacing, background, border, cursor, hover, opacity, shadow
  - **Text** (text-like fields): alignment, font size, weight, color
  - **Media** (image/file fields): object-fit, aspect ratio
  - **Layout** (array/blocks/group): gap, flex direction
- Changes apply immediately (live preview in admin)
- Stored per-field in the collection config / document metadata

```ts
const getStyleSections = (fieldType: string, customStyleConfig?: string[]) => {
  if (customStyleConfig) return customStyleConfig
  const sections: string[] = ['container']
  if (['text', 'textarea', 'richtext', 'number'].includes(fieldType)) {
    sections.push('text')
  }
  if (['image', 'file', 'upload'].includes(fieldType)) {
    sections.push('media')
  }
  if (['array', 'blocks', 'group'].includes(fieldType)) {
    sections.push('layout')
  }
  return sections
}
```

---

## Cross-Collection Copy/Paste System

Payload CMS has a duplicate option for blocks/array fields, but it doesn't allow copying layouts or blocks to another page even if that page can render the same block type. This system fixes that limitation.

### Two copy modes

**A) Copy style config only** — copies just the `ContainerStyleConfig` + inner styles. Can paste onto any field in any collection. Useful for making fields visually consistent across collections.

**B) Copy field/block definition** — copies the full field config (type, validation, default value, style config, and for blocks: the entire block definition including nested fields). Can paste into any collection that accepts that field type or block type.

### Clipboard data structure

```ts
type ClipboardEntry = {
  type: 'field-style' | 'field-definition' | 'block-definition'
  payload: ContainerStyleConfig | FieldConfig | BlockConfig
  source: {
    collection: string
    fieldPath: string
  }
  timestamp: number
}
```

### Storage

In-memory store + localStorage for persistence across browser tabs/sessions.

### Paste validation

- Style-only paste: always valid (container styles are universal)
- Field definition paste: target must accept the field type
- Block definition paste: target collection must have a blocks field that accepts the block's slug

### UI

- Right-click context menu or dedicated copy/paste icons on fields
- Copy: "Copy styles" / "Copy field definition" / "Copy block definition"
- Paste: "Paste styles" / "Paste field" / "Paste block" (greyed out if incompatible)

---

## Storage & Persistence

Style configs are stored per-field in the collection's document data (not in the collection config definition). This means:

- Styles are per-document-instance, not per-schema-field
- Editors can customize the visual presentation of individual documents
- Schema definition stays clean — style overrides are content-layer data

Alternatively (decision needed at spec time): store as collection-level admin config if styles should be uniform across all documents in a collection.

---

## Key Design Decisions to Finalize at Spec Time

1. **Storage location**: per-document (editors customize each doc) vs per-collection-config (uniform across all docs)?
2. **Style persistence format**: inline CSS object vs Tailwind class names vs CSS custom properties?
3. **Hover state implementation**: CSS-in-JS vs dynamic stylesheet injection?
4. **Copy/paste keyboard shortcuts**: Ctrl+C/V with modifier, or UI-only?
5. **Undo/redo for style changes**: integrate with existing form undo or separate?
