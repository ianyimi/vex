# 09c — Block Style Controls

## Overview

A per-block style configuration system for the admin panel. Each block instance in a `blocks()` field can have visual styles (margin, padding, background, border, typography, layout, media) configured via a popover UI. Styles are stored as a JSON string (`blockStyles`) on each block instance in Convex, and converted to Tailwind class strings at render time for use in block components.

Blocks opt into style controls via `admin.blockStyles` on `defineBlock()`, where they declare which style tiers they support. The admin popover shows only the relevant style sections. An optional responsive breakpoint system (configured in `vex.config.ts`) adds breakpoint tabs to the popover so styles can vary per viewport.

## Design Decisions

1. **Storage format: JSON string** — `blockStyles` is stored as `v.optional(v.string())` containing a JSON representation of the style object. This enables easy parsing back into the popover form for editing.

2. **Output format: Tailwind classes only (v1)** — A utility converts the JSON to Tailwind class strings. CSS inline style output deferred to a future spec.

3. **Presets ARE Tailwind values** — Spacing, font size, border radius, etc. use Tailwind scale values (0.5, 1, 2, 4, 8...) that map cleanly to both readable labels and Tailwind classes. Each preset shows a px/rem translation hint.

4. **Opt-in via `admin.blockStyles`** — Blocks must declare `admin.blockStyles` to enable the style icon. The value is an array of style tier names (e.g., `["container", "text"]`) or `true` for `["container"]` only.

5. **Responsive breakpoints from config** — If `vex.config.ts` defines `breakpoints`, the popover shows breakpoint tabs (base + each breakpoint). Without breakpoints, just a single "base" view with no tabs.

6. **Copy/paste via localStorage** — Users can copy a block's styles and paste onto other blocks. Stored in localStorage, persists across sessions. Pasting overwrites entirely. Non-applicable tiers are stripped on paste.

7. **`blockStyles` is a reserved field name** — Added to `RESERVED_BLOCK_FIELD_NAMES` so user-defined block fields cannot conflict.

8. **`RenderBlocks` converts JSON → Tailwind** — The conversion happens in `RenderBlocks` so block components receive a ready-to-use class string.

## Out of Scope

- CSS inline style output (only Tailwind classes in v1)
- Cross-collection copy/paste of field definitions
- Hover state / transition / animation config
- Undo/redo for style changes
- Applying styles to non-block fields
- Keyboard shortcuts for copy/paste

## Target Directory Structure

```
packages/core/src/
  types/fields.ts                          # Modified — BlockAdminConfig gains blockStyles, RESERVED updated
  types/index.ts                           # Modified — re-export new types
  blocks/defineBlock.ts                    # Modified — validate admin.blockStyles
  fields/blocks/schemaValueType.ts         # Modified — add blockStyles to generated schema
  styles/                                  # NEW directory
    types.ts                               # Style tier types, preset definitions
    presets.ts                              # Tailwind spacing/sizing/color presets
    blockStylesToTailwind.ts               # JSON → Tailwind class string converter
    blockStylesToTailwind.test.ts           # Tests
    index.ts                               # Re-exports

packages/ui/src/
  components/
    RenderBlocks.tsx                        # Modified — convert blockStyles JSON → Tailwind, pass to components
    form/fields/
      BlocksField.tsx                      # Modified — add style icon + copy/paste buttons to block header
      BlockStylePopover.tsx                # NEW — popover with style controls
      BlockStylePopover.test.tsx           # NEW — tests

apps/www/
  vex.config.ts                            # Modified — add breakpoints config
  src/vexcms/blocks/Hero/config.ts         # Modified — add admin.blockStyles
  src/vexcms/blocks/Hero/index.tsx         # Modified — use blockStyles prop
```

## Implementation Order

1. **Step 1: Style types & presets** (`@vexcms/core`) — Define style tier types, Tailwind preset maps. After this step, types are importable and `pnpm build` works.
2. **Step 2: JSON → Tailwind converter** (`@vexcms/core`) — Pure utility + tests. After this step, `pnpm test` runs converter tests.
3. **Step 3: Update BlockAdminConfig & reserved names** (`@vexcms/core`) — Add `blockStyles` to types, reserved names, defineBlock validation. After this step, `defineBlock({ admin: { blockStyles: ["container", "text"] } })` type-checks.
4. **Step 4: Update schema generation** (`@vexcms/core`) — Add `blockStyles: v.optional(v.string())` to every block object in generated schema + tests. After this step, generated schema includes blockStyles.
5. **Step 5: Add breakpoints to VexConfig** (`@vexcms/core`) — Add optional `breakpoints` to config types and `defineConfig`. After this step, config accepts breakpoints.
6. **Step 6: Update RenderBlocks** (`@vexcms/ui`) — Convert blockStyles JSON → Tailwind, pass as prop. After this step, block components receive `blockStyles` string.
7. **Step 7: BlockStylePopover component** (`@vexcms/ui`) — The popover UI with style controls, breakpoint tabs, accordion sections. After this step, popover renders.
8. **Step 8: Integrate into BlocksField** (`@vexcms/ui`) — Add style icon to block header, wire popover, copy/paste buttons. After this step, full admin UI works.
9. **Step 9: Wire up www app** (`apps/www`) — Add breakpoints to config, enable blockStyles on Hero block, use blockStyles in HeroBlock component. After this step, e2e testable.

---

## Step 1: Style types & presets

- [ ] Create `packages/core/src/styles/types.ts`
- [ ] Create `packages/core/src/styles/presets.ts`
- [ ] Create `packages/core/src/styles/index.ts`
- [ ] Update `packages/core/src/index.ts` to re-export styles
- [ ] Run `pnpm build` and verify

**File: `packages/core/src/styles/types.ts`**

Style tier names and the shape of each tier's config. Only properties that the popover reads/writes and the converter consumes.

````typescript
// =============================================================================
// STYLE TIER NAMES
// =============================================================================

/**
 * The style tier identifiers that a block can declare in admin.blockStyles.
 * Each tier corresponds to a section in the style popover and a set of CSS properties.
 */
export type StyleTier = "container" | "text" | "layout" | "media";

// =============================================================================
// STYLE CONFIG SHAPES (per tier)
// =============================================================================

/**
 * Container styles — universal layout/visual properties applied to the block's outer wrapper.
 * All values are Tailwind scale keys (e.g., "4" → 1rem/16px) or color strings.
 */
export interface ContainerStyleConfig {
  /** Tailwind margin scale value. Shorthand: applies to all sides. */
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  /** Tailwind padding scale value. */
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  /** Tailwind width class key (e.g., "full", "1/2", "screen"). */
  width?: string;
  /** Tailwind max-width class key. */
  maxWidth?: string;
  /** Background color — CSS color string or CSS variable reference. */
  backgroundColor?: string;
  /** Border width — Tailwind border width key (e.g., "", "2", "4"). */
  borderWidth?: string;
  /** Border color — CSS color string or CSS variable reference. */
  borderColor?: string;
  /** Border style. */
  borderStyle?: "solid" | "dashed" | "dotted" | "none";
  /** Tailwind border radius key (e.g., "sm", "md", "lg", "full"). */
  borderRadius?: string;
  /** Tailwind box shadow key (e.g., "sm", "md", "lg", "xl", "2xl", "none"). */
  boxShadow?: string;
  /** Tailwind opacity value (e.g., "0", "25", "50", "75", "100"). */
  opacity?: string;
  /** Display value. */
  display?: "block" | "flex" | "grid" | "none" | "inline-flex";
  /** Overflow value. */
  overflow?: "hidden" | "scroll" | "auto" | "visible";
}

/**
 * Text styles — typography properties for text-heavy blocks.
 */
export interface TextStyleConfig {
  /** Text alignment. */
  textAlign?: "left" | "center" | "right" | "justify";
  /** Tailwind font size key (e.g., "sm", "base", "lg", "xl", "2xl"). */
  fontSize?: string;
  /** Tailwind font weight key (e.g., "normal", "medium", "semibold", "bold"). */
  fontWeight?: string;
  /** Text color — CSS color string or CSS variable reference. */
  color?: string;
  /** Tailwind line height key (e.g., "tight", "snug", "normal", "relaxed"). */
  lineHeight?: string;
  /** Tailwind letter spacing key (e.g., "tighter", "tight", "normal", "wide"). */
  letterSpacing?: string;
}

/**
 * Layout styles — for blocks that contain child elements in flex/grid layouts.
 */
export interface LayoutStyleConfig {
  /** Tailwind gap scale value. */
  gap?: string;
  /** Flex direction. */
  flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
  /** Align items. */
  alignItems?: "start" | "center" | "end" | "stretch" | "baseline";
  /** Justify content. */
  justifyContent?: "start" | "center" | "end" | "between" | "around" | "evenly";
  /** Flex wrap. */
  flexWrap?: "wrap" | "nowrap" | "wrap-reverse";
}

/**
 * Media styles — for blocks with background images or media elements.
 */
export interface MediaStyleConfig {
  /** Object fit for background/media elements. */
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  /** Aspect ratio (e.g., "video", "square", "auto", or custom like "4/3"). */
  aspectRatio?: string;
  /** Object position (e.g., "center", "top", "bottom"). */
  objectPosition?: string;
}

// =============================================================================
// COMBINED BLOCK STYLES (the shape stored as JSON in blockStyles field)
// =============================================================================

/**
 * Combined style config for a single breakpoint.
 * Which properties are present depends on the block's declared style tiers.
 */
export interface BlockStyleValues
  extends
    ContainerStyleConfig,
    TextStyleConfig,
    LayoutStyleConfig,
    MediaStyleConfig {}

/**
 * The full blockStyles structure stored as JSON string.
 * Keys are breakpoint names ("base" is always present, others come from config).
 *
 * @example
 * ```json
 * {
 *   "base": { "margin": "4", "padding": "2", "backgroundColor": "#fff" },
 *   "sm": { "margin": "6" },
 *   "lg": { "margin": "8", "padding": "4" }
 * }
 */
export type BlockStylesData = Record<string, BlockStyleValues>;
````

**File: `packages/core/src/styles/presets.ts`**

Tailwind preset option maps. Each preset has a value (Tailwind scale key), a label, and a hint (px/rem equivalent).

```typescript
export interface StylePreset {
  /** Tailwind scale value (stored in blockStyles JSON). */
  value: string;
  /** Display label in the popover. */
  label: string;
  /** Size hint shown next to the label (e.g., "16px / 1rem"). */
  hint: string;
}

// ---------------------------------------------------------------------------
// Spacing presets (margin, padding, gap)
// ---------------------------------------------------------------------------

export const SPACING_PRESETS: StylePreset[] = [
  { value: "0", label: "0", hint: "0px" },
  { value: "0.5", label: "0.5", hint: "2px / 0.125rem" },
  { value: "1", label: "1", hint: "4px / 0.25rem" },
  { value: "1.5", label: "1.5", hint: "6px / 0.375rem" },
  { value: "2", label: "2", hint: "8px / 0.5rem" },
  { value: "3", label: "3", hint: "12px / 0.75rem" },
  { value: "4", label: "4", hint: "16px / 1rem" },
  { value: "5", label: "5", hint: "20px / 1.25rem" },
  { value: "6", label: "6", hint: "24px / 1.5rem" },
  { value: "8", label: "8", hint: "32px / 2rem" },
  { value: "10", label: "10", hint: "40px / 2.5rem" },
  { value: "12", label: "12", hint: "48px / 3rem" },
  { value: "16", label: "16", hint: "64px / 4rem" },
  { value: "20", label: "20", hint: "80px / 5rem" },
  { value: "24", label: "24", hint: "96px / 6rem" },
];

// ---------------------------------------------------------------------------
// Font size presets
// ---------------------------------------------------------------------------

export const FONT_SIZE_PRESETS: StylePreset[] = [
  { value: "xs", label: "XS", hint: "12px / 0.75rem" },
  { value: "sm", label: "SM", hint: "14px / 0.875rem" },
  { value: "base", label: "Base", hint: "16px / 1rem" },
  { value: "lg", label: "LG", hint: "18px / 1.125rem" },
  { value: "xl", label: "XL", hint: "20px / 1.25rem" },
  { value: "2xl", label: "2XL", hint: "24px / 1.5rem" },
  { value: "3xl", label: "3XL", hint: "30px / 1.875rem" },
  { value: "4xl", label: "4XL", hint: "36px / 2.25rem" },
  { value: "5xl", label: "5XL", hint: "48px / 3rem" },
];

// ---------------------------------------------------------------------------
// Font weight presets
// ---------------------------------------------------------------------------

export const FONT_WEIGHT_PRESETS: StylePreset[] = [
  { value: "thin", label: "Thin", hint: "100" },
  { value: "light", label: "Light", hint: "300" },
  { value: "normal", label: "Normal", hint: "400" },
  { value: "medium", label: "Medium", hint: "500" },
  { value: "semibold", label: "Semibold", hint: "600" },
  { value: "bold", label: "Bold", hint: "700" },
  { value: "extrabold", label: "Extra Bold", hint: "800" },
];

// ---------------------------------------------------------------------------
// Border radius presets
// ---------------------------------------------------------------------------

export const BORDER_RADIUS_PRESETS: StylePreset[] = [
  { value: "none", label: "None", hint: "0px" },
  { value: "sm", label: "SM", hint: "2px / 0.125rem" },
  { value: "DEFAULT", label: "Default", hint: "4px / 0.25rem" },
  { value: "md", label: "MD", hint: "6px / 0.375rem" },
  { value: "lg", label: "LG", hint: "8px / 0.5rem" },
  { value: "xl", label: "XL", hint: "12px / 0.75rem" },
  { value: "2xl", label: "2XL", hint: "16px / 1rem" },
  { value: "3xl", label: "3XL", hint: "24px / 1.5rem" },
  { value: "full", label: "Full", hint: "9999px" },
];

// ---------------------------------------------------------------------------
// Box shadow presets
// ---------------------------------------------------------------------------

export const BOX_SHADOW_PRESETS: StylePreset[] = [
  { value: "none", label: "None", hint: "no shadow" },
  { value: "sm", label: "SM", hint: "small" },
  { value: "DEFAULT", label: "Default", hint: "medium" },
  { value: "md", label: "MD", hint: "medium" },
  { value: "lg", label: "LG", hint: "large" },
  { value: "xl", label: "XL", hint: "extra large" },
  { value: "2xl", label: "2XL", hint: "xx-large" },
];

// ---------------------------------------------------------------------------
// Opacity presets
// ---------------------------------------------------------------------------

export const OPACITY_PRESETS: StylePreset[] = [
  { value: "0", label: "0%", hint: "invisible" },
  { value: "5", label: "5%", hint: "" },
  { value: "10", label: "10%", hint: "" },
  { value: "25", label: "25%", hint: "" },
  { value: "50", label: "50%", hint: "" },
  { value: "75", label: "75%", hint: "" },
  { value: "100", label: "100%", hint: "fully visible" },
];

// ---------------------------------------------------------------------------
// Width presets
// ---------------------------------------------------------------------------

export const WIDTH_PRESETS: StylePreset[] = [
  { value: "auto", label: "Auto", hint: "auto" },
  { value: "full", label: "Full", hint: "100%" },
  { value: "screen", label: "Screen", hint: "100vw" },
  { value: "1/2", label: "1/2", hint: "50%" },
  { value: "1/3", label: "1/3", hint: "33.33%" },
  { value: "2/3", label: "2/3", hint: "66.67%" },
  { value: "1/4", label: "1/4", hint: "25%" },
  { value: "3/4", label: "3/4", hint: "75%" },
  { value: "max", label: "Max Content", hint: "max-content" },
  { value: "fit", label: "Fit Content", hint: "fit-content" },
];

// ---------------------------------------------------------------------------
// Max-width presets
// ---------------------------------------------------------------------------

export const MAX_WIDTH_PRESETS: StylePreset[] = [
  { value: "none", label: "None", hint: "no limit" },
  { value: "xs", label: "XS", hint: "320px / 20rem" },
  { value: "sm", label: "SM", hint: "384px / 24rem" },
  { value: "md", label: "MD", hint: "448px / 28rem" },
  { value: "lg", label: "LG", hint: "512px / 32rem" },
  { value: "xl", label: "XL", hint: "576px / 36rem" },
  { value: "2xl", label: "2XL", hint: "672px / 42rem" },
  { value: "3xl", label: "3XL", hint: "768px / 48rem" },
  { value: "4xl", label: "4XL", hint: "896px / 56rem" },
  { value: "5xl", label: "5XL", hint: "1024px / 64rem" },
  { value: "6xl", label: "6XL", hint: "1152px / 72rem" },
  { value: "7xl", label: "7XL", hint: "1280px / 80rem" },
  { value: "full", label: "Full", hint: "100%" },
  { value: "screen", label: "Screen", hint: "100vw" },
];

// ---------------------------------------------------------------------------
// Line height presets
// ---------------------------------------------------------------------------

export const LINE_HEIGHT_PRESETS: StylePreset[] = [
  { value: "none", label: "None", hint: "1" },
  { value: "tight", label: "Tight", hint: "1.25" },
  { value: "snug", label: "Snug", hint: "1.375" },
  { value: "normal", label: "Normal", hint: "1.5" },
  { value: "relaxed", label: "Relaxed", hint: "1.625" },
  { value: "loose", label: "Loose", hint: "2" },
];

// ---------------------------------------------------------------------------
// Letter spacing presets
// ---------------------------------------------------------------------------

export const LETTER_SPACING_PRESETS: StylePreset[] = [
  { value: "tighter", label: "Tighter", hint: "-0.05em" },
  { value: "tight", label: "Tight", hint: "-0.025em" },
  { value: "normal", label: "Normal", hint: "0em" },
  { value: "wide", label: "Wide", hint: "0.025em" },
  { value: "wider", label: "Wider", hint: "0.05em" },
  { value: "widest", label: "Widest", hint: "0.1em" },
];

// ---------------------------------------------------------------------------
// Border width presets
// ---------------------------------------------------------------------------

export const BORDER_WIDTH_PRESETS: StylePreset[] = [
  { value: "0", label: "None", hint: "0px" },
  { value: "DEFAULT", label: "Default", hint: "1px" },
  { value: "2", label: "2", hint: "2px" },
  { value: "4", label: "4", hint: "4px" },
  { value: "8", label: "8", hint: "8px" },
];

// ---------------------------------------------------------------------------
// Aspect ratio presets
// ---------------------------------------------------------------------------

export const ASPECT_RATIO_PRESETS: StylePreset[] = [
  { value: "auto", label: "Auto", hint: "auto" },
  { value: "square", label: "Square", hint: "1 / 1" },
  { value: "video", label: "Video", hint: "16 / 9" },
  { value: "4/3", label: "4:3", hint: "4 / 3" },
  { value: "3/2", label: "3:2", hint: "3 / 2" },
];
```

**File: `packages/core/src/styles/index.ts`**

```typescript
export * from "./types";
export * from "./presets";
export { blockStylesToTailwind } from "./blockStylesToTailwind";
```

Update `packages/core/src/index.ts` — add this line near the other re-exports:

```typescript
export * from "./styles";
```

---

## Step 2: JSON → Tailwind converter + tests

- [ ] Create `packages/core/src/styles/blockStylesToTailwind.ts`
- [ ] Create `packages/core/src/styles/blockStylesToTailwind.test.ts`
- [ ] Run `pnpm --filter @vexcms/core test` and verify tests pass

**File: `packages/core/src/styles/blockStylesToTailwind.ts`**

Converts the stored JSON string into a Tailwind class string. Handles responsive breakpoint prefixes.

````typescript
import type { BlockStylesData, BlockStyleValues } from "./types";

/**
 * Property-to-Tailwind class prefix mapping.
 * Maps each style property to the Tailwind utility prefix used to build the class.
 */
const PROPERTY_CLASS_MAP: Record<
  keyof BlockStyleValues,
  string | ((v: string) => string)
> = {
  // Container
  margin: (v) => `m-${v}`,
  marginTop: (v) => `mt-${v}`,
  marginRight: (v) => `mr-${v}`,
  marginBottom: (v) => `mb-${v}`,
  marginLeft: (v) => `ml-${v}`,
  padding: (v) => `p-${v}`,
  paddingTop: (v) => `pt-${v}`,
  paddingRight: (v) => `pr-${v}`,
  paddingBottom: (v) => `pb-${v}`,
  paddingLeft: (v) => `pl-${v}`,
  width: (v) => `w-${v}`,
  maxWidth: (v) => `max-w-${v}`,
  backgroundColor: (v) => {
    if (
      v.startsWith("var(") ||
      v.startsWith("#") ||
      v.startsWith("rgb") ||
      v.startsWith("hsl") ||
      v.startsWith("oklch")
    ) {
      return `bg-[${v}]`;
    }
    return `bg-${v}`;
  },
  borderWidth: (v) => (v === "DEFAULT" ? "border" : `border-${v}`),
  borderColor: (v) => {
    if (
      v.startsWith("var(") ||
      v.startsWith("#") ||
      v.startsWith("rgb") ||
      v.startsWith("hsl") ||
      v.startsWith("oklch")
    ) {
      return `border-[${v}]`;
    }
    return `border-${v}`;
  },
  borderStyle: (v) => `border-${v}`,
  borderRadius: (v) => (v === "DEFAULT" ? "rounded" : `rounded-${v}`),
  boxShadow: (v) => (v === "DEFAULT" ? "shadow" : `shadow-${v}`),
  opacity: (v) => `opacity-${v}`,
  display: (v) => {
    if (v === "inline-flex") return "inline-flex";
    return v;
  },
  overflow: (v) => `overflow-${v}`,

  // Text
  textAlign: (v) => `text-${v}`,
  fontSize: (v) => `text-${v}`,
  fontWeight: (v) => `font-${v}`,
  color: (v) => {
    if (
      v.startsWith("var(") ||
      v.startsWith("#") ||
      v.startsWith("rgb") ||
      v.startsWith("hsl") ||
      v.startsWith("oklch")
    ) {
      return `text-[${v}]`;
    }
    return `text-${v}`;
  },
  lineHeight: (v) => `leading-${v}`,
  letterSpacing: (v) => `tracking-${v}`,

  // Layout
  gap: (v) => `gap-${v}`,
  flexDirection: (v) => {
    const map: Record<string, string> = {
      row: "flex-row",
      column: "flex-col",
      "row-reverse": "flex-row-reverse",
      "column-reverse": "flex-col-reverse",
    };
    return map[v] ?? `flex-${v}`;
  },
  alignItems: (v) => `items-${v}`,
  justifyContent: (v) => `justify-${v}`,
  flexWrap: (v) => `flex-${v}`,

  // Media
  objectFit: (v) => `object-${v}`,
  aspectRatio: (v) => `aspect-${v}`,
  objectPosition: (v) => `object-${v}`,
};

/**
 * Convert a single breakpoint's style values into an array of Tailwind classes.
 */
function stylesToClasses(props: { styles: BlockStyleValues }): string[] {
  // TODO: implement
  //
  // 1. Iterate over each key in props.styles
  //    → Skip keys with undefined/null/"" values
  //
  // 2. Look up the property in PROPERTY_CLASS_MAP
  //    → If found and it's a function, call it with the value
  //    → If found and it's a string, concatenate: `${prefix}-${value}`
  //    → If not found, skip (unknown property)
  //
  // 3. Collect all generated class strings into an array
  //
  // 4. Return the array
  //
  // Edge cases:
  // - Empty styles object → return []
  // - "DEFAULT" values (borderWidth, borderRadius, boxShadow) handled by the map functions
  // - Color values starting with var()/# get wrapped in [] for arbitrary Tailwind values
  throw new Error("Not implemented");
}

/**
 * Convert a blockStyles JSON string into a Tailwind class string.
 *
 * Handles responsive breakpoint prefixes. The "base" breakpoint has no prefix,
 * all other breakpoints use their key as prefix (e.g., "sm:", "md:", "lg:").
 *
 * @param props.blockStylesJson - The raw JSON string from the block instance's blockStyles field
 * @returns Tailwind class string ready to use in className, or empty string if input is empty/invalid
 *
 * @example
 * ```ts
 * blockStylesToTailwind({
 *   blockStylesJson: '{"base":{"margin":"4","padding":"2"},"sm":{"margin":"6"}}'
 * })
 * // → "m-4 p-2 sm:m-6"
 */
export function blockStylesToTailwind(props: {
  blockStylesJson: string | undefined;
}): string {
  // TODO: implement
  //
  // 1. If props.blockStylesJson is undefined, null, or empty string → return ""
  //
  // 2. Parse the JSON string into BlockStylesData
  //    → If JSON.parse throws, return "" (graceful fallback for corrupt data)
  //
  // 3. Process the "base" key first (no breakpoint prefix)
  //    → Call stylesToClasses({ styles: data.base })
  //    → Add each class as-is to the result array
  //
  // 4. For each remaining key in data (sorted alphabetically for deterministic output)
  //    → Call stylesToClasses({ styles: data[breakpoint] })
  //    → Prefix each class with `${breakpoint}:` (e.g., "sm:m-6")
  //    → Add to result array
  //
  // 5. Return result.join(" ")
  //
  // Edge cases:
  // - Invalid JSON → return ""
  // - No "base" key → just process breakpoint keys
  // - Empty values in a breakpoint → skip (stylesToClasses handles this)
  throw new Error("Not implemented");
}
````

**File: `packages/core/src/styles/blockStylesToTailwind.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { blockStylesToTailwind } from "./blockStylesToTailwind";

describe("blockStylesToTailwind", () => {
  it("returns empty string for undefined input", () => {
    expect(blockStylesToTailwind({ blockStylesJson: undefined })).toBe("");
  });

  it("returns empty string for empty string input", () => {
    expect(blockStylesToTailwind({ blockStylesJson: "" })).toBe("");
  });

  it("returns empty string for invalid JSON", () => {
    expect(blockStylesToTailwind({ blockStylesJson: "not json" })).toBe("");
  });

  it("converts base-only styles to Tailwind classes", () => {
    const json = JSON.stringify({
      base: { margin: "4", padding: "2" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("m-4 p-2");
  });

  it("converts individual margin sides", () => {
    const json = JSON.stringify({
      base: { marginTop: "2", marginBottom: "4" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("mt-2 mb-4");
  });

  it("converts individual padding sides", () => {
    const json = JSON.stringify({
      base: { paddingLeft: "3", paddingRight: "3" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("pl-3 pr-3");
  });

  it("handles DEFAULT border radius", () => {
    const json = JSON.stringify({
      base: { borderRadius: "DEFAULT" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("rounded");
  });

  it("handles named border radius", () => {
    const json = JSON.stringify({
      base: { borderRadius: "lg" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("rounded-lg");
  });

  it("handles DEFAULT border width", () => {
    const json = JSON.stringify({
      base: { borderWidth: "DEFAULT" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("border");
  });

  it("handles numbered border width", () => {
    const json = JSON.stringify({
      base: { borderWidth: "2" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("border-2");
  });

  it("handles DEFAULT box shadow", () => {
    const json = JSON.stringify({
      base: { boxShadow: "DEFAULT" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("shadow");
  });

  it("converts backgroundColor with hex to arbitrary value", () => {
    const json = JSON.stringify({
      base: { backgroundColor: "#3b82f6" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "bg-[#3b82f6]",
    );
  });

  it("converts backgroundColor with CSS variable to arbitrary value", () => {
    const json = JSON.stringify({
      base: { backgroundColor: "var(--primary)" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "bg-[var(--primary)]",
    );
  });

  it("converts text color with hex to arbitrary value", () => {
    const json = JSON.stringify({
      base: { color: "#ffffff" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "text-[#ffffff]",
    );
  });

  it("converts border color with CSS variable", () => {
    const json = JSON.stringify({
      base: { borderColor: "var(--border)" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "border-[var(--border)]",
    );
  });

  it("converts text style properties", () => {
    const json = JSON.stringify({
      base: { textAlign: "center", fontSize: "xl", fontWeight: "bold" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "text-center text-xl font-bold",
    );
  });

  it("converts line height and letter spacing", () => {
    const json = JSON.stringify({
      base: { lineHeight: "tight", letterSpacing: "wide" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "leading-tight tracking-wide",
    );
  });

  it("converts layout properties", () => {
    const json = JSON.stringify({
      base: { gap: "4", flexDirection: "column", alignItems: "center" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "gap-4 flex-col items-center",
    );
  });

  it("converts justify content", () => {
    const json = JSON.stringify({
      base: { justifyContent: "between" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "justify-between",
    );
  });

  it("converts media properties", () => {
    const json = JSON.stringify({
      base: { objectFit: "cover", aspectRatio: "video" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "object-cover aspect-video",
    );
  });

  it("converts width and maxWidth", () => {
    const json = JSON.stringify({
      base: { width: "full", maxWidth: "7xl" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "w-full max-w-7xl",
    );
  });

  it("converts opacity and display", () => {
    const json = JSON.stringify({
      base: { opacity: "50", display: "flex" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "opacity-50 flex",
    );
  });

  it("converts overflow", () => {
    const json = JSON.stringify({
      base: { overflow: "hidden" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "overflow-hidden",
    );
  });

  it("converts border style", () => {
    const json = JSON.stringify({
      base: { borderStyle: "dashed" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "border-dashed",
    );
  });

  it("adds breakpoint prefixes for non-base keys", () => {
    const json = JSON.stringify({
      base: { margin: "4" },
      sm: { margin: "6" },
      lg: { margin: "8", padding: "4" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "m-4 lg:m-8 lg:p-4 sm:m-6",
    );
  });

  it("handles only breakpoint styles with no base", () => {
    const json = JSON.stringify({
      md: { padding: "4" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("md:p-4");
  });

  it("skips undefined/empty values", () => {
    const json = JSON.stringify({
      base: { margin: "4", padding: "", fontSize: undefined },
    });
    // JSON.stringify drops undefined, keeps empty string
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("m-4");
  });

  it("handles complex multi-breakpoint multi-property example", () => {
    const json = JSON.stringify({
      base: {
        margin: "4",
        padding: "2",
        backgroundColor: "var(--background)",
        borderRadius: "lg",
      },
      sm: { margin: "6", padding: "4" },
      md: { margin: "8" },
      lg: { margin: "12", padding: "6", maxWidth: "7xl" },
    });
    const result = blockStylesToTailwind({ blockStylesJson: json });
    expect(result).toContain("m-4");
    expect(result).toContain("p-2");
    expect(result).toContain("bg-[var(--background)]");
    expect(result).toContain("rounded-lg");
    expect(result).toContain("sm:m-6");
    expect(result).toContain("sm:p-4");
    expect(result).toContain("md:m-8");
    expect(result).toContain("lg:m-12");
    expect(result).toContain("lg:p-6");
    expect(result).toContain("lg:max-w-7xl");
  });

  it("returns empty string for empty base object", () => {
    const json = JSON.stringify({ base: {} });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("");
  });

  it("handles flexDirection row-reverse", () => {
    const json = JSON.stringify({
      base: { flexDirection: "row-reverse" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "flex-row-reverse",
    );
  });

  it("handles inline-flex display", () => {
    const json = JSON.stringify({
      base: { display: "inline-flex" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "inline-flex",
    );
  });

  it("handles flexWrap", () => {
    const json = JSON.stringify({
      base: { flexWrap: "wrap" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("flex-wrap");
  });

  it("handles object position", () => {
    const json = JSON.stringify({
      base: { objectPosition: "top" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("object-top");
  });
});
```

---

## Step 3: Update BlockAdminConfig & reserved names

- [ ] Modify `packages/core/src/types/fields.ts` — add `blockStyles` to `BlockAdminConfig` and `RESERVED_BLOCK_FIELD_NAMES`
- [ ] Modify `packages/core/src/blocks/defineBlock.ts` — validate `admin.blockStyles` values
- [ ] Run `pnpm --filter @vexcms/core test` to verify existing tests still pass

**Modify: `packages/core/src/types/fields.ts`**

Update `BlockAdminConfig`:

```typescript
// BEFORE:
export interface BlockAdminConfig {
  /** Icon identifier for the block picker UI (e.g., "layout-template"). */
  icon?: string;
  /** Custom admin components for this block (future — Spec 09b). */
  components?: {
    Editor?: ComponentType<any>;
  };
}

// AFTER:
export interface BlockAdminConfig {
  /** Icon identifier for the block picker UI (e.g., "layout-template"). */
  icon?: string;
  /** Custom admin components for this block (future — Spec 09b). */
  components?: {
    Editor?: ComponentType<any>;
  };
  /**
   * Enable block style controls in the admin panel.
   *
   * - `true` — enables container styles only (equivalent to `["container"]`)
   * - `StyleTier[]` — enables specific style tiers (e.g., `["container", "text", "media"]`)
   * - `undefined` / omitted — no style controls shown
   *
   * Available tiers: "container", "text", "layout", "media"
   */
  blockStyles?: true | StyleTier[];
}
```

Add the `StyleTier` import at the top of `fields.ts`:

```typescript
import type { StyleTier } from "../styles/types";
```

Update `RESERVED_BLOCK_FIELD_NAMES`:

```typescript
// BEFORE:
export const RESERVED_BLOCK_FIELD_NAMES = [
  "blockType",
  "blockName",
  "_key",
] as const;

// AFTER:
export const RESERVED_BLOCK_FIELD_NAMES = [
  "blockType",
  "blockName",
  "_key",
  "blockStyles",
] as const;
```

**Modify: `packages/core/src/blocks/defineBlock.ts`**

Add validation for `admin.blockStyles` values. After the existing reserved field name check:

```typescript
// Add after the reserved field name validation block:
const VALID_STYLE_TIERS = ["container", "text", "layout", "media"];

if (props.admin?.blockStyles && props.admin.blockStyles !== true) {
  if (!Array.isArray(props.admin.blockStyles)) {
    throw new VexBlockValidationError(
      props.slug,
      `admin.blockStyles must be true or an array of style tier names. Got: ${typeof props.admin.blockStyles}`,
    );
  }
  for (const tier of props.admin.blockStyles) {
    if (!VALID_STYLE_TIERS.includes(tier)) {
      throw new VexBlockValidationError(
        props.slug,
        `Invalid style tier "${tier}" in admin.blockStyles. Valid tiers: ${VALID_STYLE_TIERS.join(", ")}`,
      );
    }
  }
}
```

---

## Step 4: Update schema generation + tests

- [ ] Modify `packages/core/src/fields/blocks/schemaValueType.ts` — add `blockStyles` field to generated block objects
- [ ] Update `packages/core/src/fields/blocks/schemaValueType.test.ts` — verify blockStyles appears
- [ ] Run `pnpm --filter @vexcms/core test`

**Modify: `packages/core/src/fields/blocks/schemaValueType.ts`**

In the `blocksToValueTypeString` function, add `blockStyles` to `fieldEntries` after the existing reserved fields:

```typescript
// BEFORE:
const fieldEntries: string[] = [
  `blockType: v.literal("${block.slug}")`,
  `blockName: v.optional(v.string())`,
  `_key: v.string()`,
];

// AFTER:
const fieldEntries: string[] = [
  `blockType: v.literal("${block.slug}")`,
  `blockName: v.optional(v.string())`,
  `blockStyles: v.optional(v.string())`,
  `_key: v.string()`,
];
```

**Update tests in `schemaValueType.test.ts`:**

Add a test that confirms `blockStyles` is present:

```typescript
it("includes blockStyles field in generated schema for every block", () => {
  const result = blocksToValueTypeString({
    field: {
      type: "blocks",
      blocks: [{ slug: "hero", label: "Hero", fields: {} }],
    } as BlocksFieldDef,
    collectionSlug: "pages",
    fieldName: "content",
    resolveInnerField: () => "v.string()",
  });
  expect(result).toContain("blockStyles: v.optional(v.string())");
});
```

Update any existing snapshot/string-match tests that assert the exact generated output to include the new `blockStyles` line.

---

## Step 5: Add breakpoints to VexConfig

- [ ] Add `BreakpointConfig` type to `packages/core/src/types/index.ts`
- [ ] Add optional `breakpoints` to `VexConfig`, `ClientVexConfig`, and `VexConfigInput`
- [ ] Update `defineConfig` to pass through breakpoints
- [ ] Run `pnpm build`

**Add to `packages/core/src/types/index.ts`** (before the VexConfig interface):

````typescript
/**
 * Responsive breakpoint configuration for block style controls.
 * Keys are breakpoint names (used as Tailwind prefixes), values are min-width in pixels.
 *
 * @example
 * ```ts
 * breakpoints: {
 *   sm: 640,
 *   md: 768,
 *   lg: 1024,
 *   xl: 1280,
 * }
 */
export type BreakpointConfig = Record<string, number>;
````

Add to `VexConfig`, `ClientVexConfig`, and `VexConfigInput`:

```typescript
/** Responsive breakpoints for block style controls. If not set, styles apply to all viewports. */
breakpoints?: BreakpointConfig;
```

**Modify `defineConfig`** — pass through breakpoints:

```typescript
// In defineConfig, add after the schema merge:
breakpoints: vexConfig.breakpoints,
```

---

## Step 6: Update RenderBlocks

- [ ] Modify `packages/ui/src/components/RenderBlocks.tsx` — import converter, pass `blockStyles` as Tailwind string to components
- [ ] Update `BlockComponentProps` to include `blockStyles`

**Modify: `packages/ui/src/components/RenderBlocks.tsx`**

```typescript
// BEFORE:
import React, { ComponentPropsWithRef } from "react";

// AFTER:
import React, { ComponentPropsWithRef } from "react";
import { blockStylesToTailwind } from "@vexcms/core";
```

Update `BlockComponentProps`:

```typescript
// BEFORE:
export interface BlockComponentProps<
  TBlock extends { blockType: string; _key: string } = {
    blockType: string;
    _key: string;
  },
> {
  block: TBlock;
  index: number;
}

// AFTER:
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
  /** Tailwind class string generated from the block's blockStyles JSON. Empty string if no styles configured. */
  blockStyles: string;
}
```

Update the rendering logic to convert and pass `blockStyles`:

```typescript
// BEFORE:
const elements = blocks.map((block, index) => {
  const Component = components[block.blockType];
  if (Component) {
    return <Component block={block} index={index} key={block._key} />;
  }
  if (fallback) {
    const Fallback = fallback;
    return <Fallback block={block} index={index} key={block._key} />;
  }
  return null;
});

// AFTER:
const elements = blocks.map((block, index) => {
  const blockStylesJson = (block as Record<string, unknown>).blockStyles as string | undefined;
  const blockStylesClass = blockStylesToTailwind({ blockStylesJson });

  const Component = components[block.blockType];
  if (Component) {
    return <Component block={block} index={index} blockStyles={blockStylesClass} key={block._key} />;
  }
  if (fallback) {
    const Fallback = fallback;
    return <Fallback block={block} index={index} blockStyles={blockStylesClass} key={block._key} />;
  }
  return null;
});
```

---

## Step 7: BlockStylePopover component

- [ ] Create `packages/ui/src/components/form/fields/BlockStylePopover.tsx`
- [ ] Run `pnpm build` and verify it compiles

**File: `packages/ui/src/components/form/fields/BlockStylePopover.tsx`**

This is a guided stub — the popover UI with style controls grouped in accordions, breakpoint tabs, and color pickers. This is the largest component in the spec.

```tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  StyleTier,
  BlockStylesData,
  BlockStyleValues,
  BreakpointConfig,
} from "@vexcms/core";
import {
  SPACING_PRESETS,
  FONT_SIZE_PRESETS,
  FONT_WEIGHT_PRESETS,
  BORDER_RADIUS_PRESETS,
  BOX_SHADOW_PRESETS,
  OPACITY_PRESETS,
  WIDTH_PRESETS,
  MAX_WIDTH_PRESETS,
  LINE_HEIGHT_PRESETS,
  LETTER_SPACING_PRESETS,
  BORDER_WIDTH_PRESETS,
  ASPECT_RATIO_PRESETS,
} from "@vexcms/core";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { Info, Copy, ClipboardPaste } from "lucide-react";

// ---------------------------------------------------------------------------
// localStorage helpers for copy/paste
// ---------------------------------------------------------------------------

const BLOCK_STYLES_CLIPBOARD_KEY = "vex-block-styles-clipboard";

function copyStylesToClipboard(props: { stylesJson: string }): void {
  try {
    localStorage.setItem(BLOCK_STYLES_CLIPBOARD_KEY, props.stylesJson);
  } catch {
    // Ignore quota errors
  }
}

function getClipboardStyles(): string | null {
  try {
    return localStorage.getItem(BLOCK_STYLES_CLIPBOARD_KEY);
  } catch {
    return null;
  }
}

/**
 * Strip non-applicable style tiers from pasted data.
 * Only keeps properties that belong to the target block's declared tiers.
 */
function stripNonApplicableTiers(props: {
  data: BlockStylesData;
  tiers: StyleTier[];
}): BlockStylesData {
  // TODO: implement
  //
  // 1. Build a set of allowed property names based on props.tiers
  //    → "container" tier allows: margin*, padding*, width, maxWidth, backgroundColor,
  //      borderWidth, borderColor, borderStyle, borderRadius, boxShadow, opacity, display, overflow
  //    → "text" tier allows: textAlign, fontSize, fontWeight, color, lineHeight, letterSpacing
  //    → "layout" tier allows: gap, flexDirection, alignItems, justifyContent, flexWrap
  //    → "media" tier allows: objectFit, aspectRatio, objectPosition
  //
  // 2. For each breakpoint in props.data, filter to only allowed properties
  //
  // 3. Remove breakpoints that end up with zero properties
  //
  // 4. Return the filtered data
  throw new Error("Not implemented");
}

// ---------------------------------------------------------------------------
// Preset Select Component (reusable)
// ---------------------------------------------------------------------------

interface PresetSelectProps {
  label: string;
  value: string | undefined;
  presets: { value: string; label: string; hint: string }[];
  onChange: (value: string | undefined) => void;
}

function PresetSelect(props: PresetSelectProps) {
  // TODO: implement
  //
  // 1. Render a <Label> with props.label
  //
  // 2. Render a <select> (native select for simplicity) with:
  //    → A blank "—" option that clears the value (calls props.onChange(undefined))
  //    → One <option> per preset showing: `${preset.label}` with `${preset.hint}` as title attr
  //    → Each option's value is preset.value
  //
  // 3. The select's current value is props.value ?? ""
  //
  // 4. On change, call props.onChange with the selected value (or undefined if blank)
  //
  // 5. Below the select, show the hint text for the currently selected preset in
  //    a small muted text span (e.g., "16px / 1rem")
  throw new Error("Not implemented");
}

// ---------------------------------------------------------------------------
// Color Picker Field (wraps existing ColorField)
// ---------------------------------------------------------------------------

interface ColorPickerProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

function StyleColorPicker(props: ColorPickerProps) {
  // TODO: implement
  //
  // 1. Render a <Label> with props.label
  //
  // 2. Render a compact color picker that reuses the existing ColorField's
  //    color picker UI from @uiw/react-color-sketch
  //    → Show a small color swatch preview of the current value
  //    → On click, open a popover with the color picker
  //    → Include the "Theme Colors" tab that reads CSS variables from
  //      document.documentElement's computed styles (same as ColorField.tsx)
  //    → Include a "clear" button to set value to undefined
  //
  // 3. On color select, call props.onChange with the color string
  //
  // Edge cases:
  // - undefined value → show no color / transparent indicator
  // - CSS variable values (var(--primary)) → show the variable name, resolve for preview
  throw new Error("Not implemented");
}

// ---------------------------------------------------------------------------
// Enum Select Component (for fixed options like textAlign, display, etc.)
// ---------------------------------------------------------------------------

interface EnumSelectProps {
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
}

function EnumSelect(props: EnumSelectProps) {
  // TODO: implement
  //
  // 1. Render a <Label> with props.label
  // 2. Render a native <select> with a blank "—" option + one option per entry
  // 3. On change, call props.onChange
  throw new Error("Not implemented");
}

// ---------------------------------------------------------------------------
// Style Tier Sections (accordion items)
// ---------------------------------------------------------------------------

function ContainerStyleSection(props: {
  values: BlockStyleValues;
  onChange: (key: keyof BlockStyleValues, value: string | undefined) => void;
}) {
  // TODO: implement
  //
  // Render the following controls in a vertical layout:
  //
  // **Spacing group:**
  // - Margin (all): PresetSelect with SPACING_PRESETS
  // - Margin Top/Right/Bottom/Left: 4x PresetSelect with SPACING_PRESETS (in a 2x2 grid)
  // - Padding (all): PresetSelect with SPACING_PRESETS
  // - Padding Top/Right/Bottom/Left: 4x PresetSelect with SPACING_PRESETS (in a 2x2 grid)
  //
  // **Sizing group:**
  // - Width: PresetSelect with WIDTH_PRESETS
  // - Max Width: PresetSelect with MAX_WIDTH_PRESETS
  //
  // **Background group:**
  // - Background Color: StyleColorPicker
  //
  // **Border group:**
  // - Border Width: PresetSelect with BORDER_WIDTH_PRESETS
  // - Border Color: StyleColorPicker
  // - Border Style: EnumSelect with solid/dashed/dotted/none
  // - Border Radius: PresetSelect with BORDER_RADIUS_PRESETS
  //
  // **Effects group:**
  // - Box Shadow: PresetSelect with BOX_SHADOW_PRESETS
  // - Opacity: PresetSelect with OPACITY_PRESETS
  //
  // **Display group:**
  // - Display: EnumSelect with block/flex/grid/none/inline-flex
  // - Overflow: EnumSelect with hidden/scroll/auto/visible
  //
  // Each control reads from props.values[key] and calls props.onChange(key, value)
  throw new Error("Not implemented");
}

function TextStyleSection(props: {
  values: BlockStyleValues;
  onChange: (key: keyof BlockStyleValues, value: string | undefined) => void;
}) {
  // TODO: implement
  //
  // Render:
  // - Text Align: EnumSelect with left/center/right/justify
  // - Font Size: PresetSelect with FONT_SIZE_PRESETS
  // - Font Weight: PresetSelect with FONT_WEIGHT_PRESETS
  // - Text Color: StyleColorPicker
  // - Line Height: PresetSelect with LINE_HEIGHT_PRESETS
  // - Letter Spacing: PresetSelect with LETTER_SPACING_PRESETS
  throw new Error("Not implemented");
}

function LayoutStyleSection(props: {
  values: BlockStyleValues;
  onChange: (key: keyof BlockStyleValues, value: string | undefined) => void;
}) {
  // TODO: implement
  //
  // Render:
  // - Gap: PresetSelect with SPACING_PRESETS
  // - Flex Direction: EnumSelect with row/column/row-reverse/column-reverse
  // - Align Items: EnumSelect with start/center/end/stretch/baseline
  // - Justify Content: EnumSelect with start/center/end/between/around/evenly
  // - Flex Wrap: EnumSelect with wrap/nowrap/wrap-reverse
  throw new Error("Not implemented");
}

function MediaStyleSection(props: {
  values: BlockStyleValues;
  onChange: (key: keyof BlockStyleValues, value: string | undefined) => void;
}) {
  // TODO: implement
  //
  // Render:
  // - Object Fit: EnumSelect with cover/contain/fill/none/scale-down
  // - Aspect Ratio: PresetSelect with ASPECT_RATIO_PRESETS
  // - Object Position: EnumSelect with center/top/bottom/left/right/top-left/top-right/bottom-left/bottom-right
  throw new Error("Not implemented");
}

// ---------------------------------------------------------------------------
// Main Popover Component
// ---------------------------------------------------------------------------

export interface BlockStylePopoverProps {
  /** Current blockStyles JSON string (from the block instance). */
  blockStylesJson: string | undefined;
  /** Called when styles change. Pass the new JSON string, or undefined to clear. */
  onChange: (blockStylesJson: string | undefined) => void;
  /** Style tiers this block supports. */
  tiers: StyleTier[];
  /** Breakpoint config from vex.config.ts. If undefined, no breakpoint tabs shown. */
  breakpoints?: BreakpointConfig;
}

export function BlockStylePopover(props: BlockStylePopoverProps) {
  // TODO: implement
  //
  // 1. Parse props.blockStylesJson into BlockStylesData (default to { base: {} })
  //    → Use a try/catch around JSON.parse for safety
  //
  // 2. State: activeBreakpoint (default "base"), popoverOpen
  //
  // 3. Compute breakpoint tabs:
  //    → If props.breakpoints is defined: ["base", ...Object.keys(props.breakpoints)] sorted by px value
  //    → If undefined: just ["base"] (no tab UI shown)
  //
  // 4. Render trigger: small Info icon button (same size as other block header icons)
  //    → <PopoverTrigger asChild><Button variant="ghost" size="icon-xs"><Info /></Button></PopoverTrigger>
  //
  // 5. Render PopoverContent (wide enough for controls, ~360-400px):
  //    → Header: "Block Styles" title + Copy/Paste buttons
  //       - Copy: calls copyStylesToClipboard with current styles JSON
  //       - Paste: calls getClipboardStyles(), strips non-applicable tiers,
  //         merges into current data, calls props.onChange
  //
  //    → If multiple breakpoints: render tab buttons for each breakpoint
  //       - Active tab highlighted
  //       - Each tab shows breakpoint name + min-width hint (e.g., "sm (640px)")
  //       - "base" tab shows "Base (all sizes)"
  //
  //    → Scrollable content area with accordion sections:
  //       - Show ContainerStyleSection if "container" in props.tiers
  //       - Show TextStyleSection if "text" in props.tiers
  //       - Show LayoutStyleSection if "layout" in props.tiers
  //       - Show MediaStyleSection if "media" in props.tiers
  //       - Each section has an accordion header (e.g., "Container", "Typography")
  //       - Sections are collapsible, default open
  //
  //    → Each control's onChange:
  //       a. Clone the current BlockStylesData
  //       b. Update data[activeBreakpoint][property] = value (or delete if undefined)
  //       c. Clean up: remove breakpoints with empty objects
  //       d. If the entire data is just { base: {} }, call props.onChange(undefined)
  //       e. Otherwise call props.onChange(JSON.stringify(data))
  //
  // 6. "Clear all" button at the bottom → calls props.onChange(undefined)
  //
  // Edge cases:
  // - Corrupt JSON in blockStylesJson → fall back to { base: {} }
  // - Pasting styles when clipboard is empty → no-op, show toast or ignore
  // - Pasting styles with tiers the target doesn't support → strip them
  // - All values cleared → store undefined (not empty JSON)
  throw new Error("Not implemented");
}
```

---

## Step 8: Integrate into BlocksField

- [ ] Modify `packages/ui/src/components/form/fields/BlocksField.tsx` — add style icon + copy/paste to block header
- [ ] Run `pnpm build` and verify

**Modify: `packages/ui/src/components/form/fields/BlocksField.tsx`**

Add imports:

```typescript
import { BlockStylePopover } from "./BlockStylePopover";
import { Info } from "lucide-react"; // already imported? check — may need to add
import type { StyleTier, BreakpointConfig } from "@vexcms/core";
```

Update `BlocksFieldProps` to accept breakpoints:

```typescript
interface BlocksFieldProps {
  name: string;
  field?: any;
  fieldDef?: BlocksFieldDef;
  renderField?: RenderFieldCallback;
  /** Breakpoint config from vex.config.ts for responsive style tabs. */
  breakpoints?: BreakpointConfig;
}
```

Update `BlockItem` to accept and render the style popover. Add to BlockItem's props:

```typescript
// Add to BlockItem props:
blockStyleTiers: StyleTier[] | undefined;
breakpoints?: BreakpointConfig;
onBlockStylesChange: (blockStylesJson: string | undefined) => void;
```

In BlockItem's header row (between the block name input and the action buttons), add the style popover trigger — **only if `blockStyleTiers` is defined and non-empty**:

```tsx
{
  /* Style popover — shown even when collapsed */
}
{
  props.blockStyleTiers && props.blockStyleTiers.length > 0 && (
    <BlockStylePopover
      blockStylesJson={props.block.blockStyles as string | undefined}
      onChange={props.onBlockStylesChange}
      tiers={props.blockStyleTiers}
      breakpoints={props.breakpoints}
    />
  );
}
```

Add a new callback in the main `BlocksField` component to handle blockStyles changes:

```typescript
const updateBlockStyles = useCallback(
  (key: string, blockStylesJson: string | undefined) => {
    setValue(
      value.map((b) =>
        b._key === key ? { ...b, blockStyles: blockStylesJson } : b,
      ),
    );
  },
  [value, setValue],
);
```

When rendering `<BlockItem>`, pass the new props:

```tsx
<BlockItem
  // ... existing props ...
  blockStyleTiers={resolveStyleTiers(blockDefMap.get(block.blockType))}
  breakpoints={breakpoints}
  onBlockStylesChange={(json) => updateBlockStyles(block._key, json)}
/>
```

Add the helper to resolve style tiers from a BlockDef:

```typescript
function resolveStyleTiers(
  blockDef: BlockDef | undefined,
): StyleTier[] | undefined {
  if (!blockDef?.admin?.blockStyles) return undefined;
  if (blockDef.admin.blockStyles === true) return ["container"];
  return blockDef.admin.blockStyles;
}
```

Also update `BlockInstance` interface to include `blockStyles`:

```typescript
interface BlockInstance {
  blockType: string;
  blockName?: string;
  blockStyles?: string;
  _key: string;
  [field: string]: unknown;
}
```

---

## Step 9: Wire up www app

- [ ] Modify `apps/www/vex.config.ts` — add breakpoints
- [ ] Modify `apps/www/src/vexcms/blocks/Hero/config.ts` — add `admin.blockStyles`
- [ ] Modify `apps/www/src/vexcms/blocks/Hero/index.tsx` — use `blockStyles` prop
- [ ] Run the www app and test the full flow in the admin panel

**Modify: `apps/www/vex.config.ts`**

```typescript
// BEFORE:
export default defineConfig({
  admin: {
    meta: {
      titleSuffix: " | My Site",
    },
    user: TABLE_SLUG_USERS,
  },
  // ...
});

// AFTER:
export default defineConfig({
  admin: {
    meta: {
      titleSuffix: " | My Site",
    },
    user: TABLE_SLUG_USERS,
  },
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  // ...
});
```

**Modify: `apps/www/src/vexcms/blocks/Hero/config.ts`**

```typescript
// BEFORE:
admin: {
  icon: "sparkles",
},

// AFTER:
admin: {
  icon: "sparkles",
  blockStyles: ["container", "text"],
},
```

**Modify: `apps/www/src/vexcms/blocks/Hero/index.tsx`**

Update the component to receive and use `blockStyles`:

```tsx
// BEFORE:
export default function HeroBlock({ block }: BlockComponentProps) {
  // ...
  return (
    <div className="overflow-hidden">

// AFTER:
export default function HeroBlock({ block, blockStyles }: BlockComponentProps) {
  // ...
  return (
    <div className={cn("overflow-hidden", blockStyles)}>
```

The `cn()` utility (clsx + tailwind-merge) ensures the blockStyles classes merge correctly with the component's own classes, with blockStyles taking precedence where there are conflicts.

---

## Success Criteria

- [ ] `blockStyles: v.optional(v.string())` appears in generated Convex schema for all block objects
- [ ] `blockStylesToTailwind` converts JSON to correct Tailwind class strings (all tests pass)
- [ ] `defineBlock({ admin: { blockStyles: ["container", "text"] } })` type-checks and validates
- [ ] `defineBlock({ admin: { blockStyles: ["invalid"] } })` throws VexBlockValidationError
- [ ] Reserved field name "blockStyles" cannot be used as a user-defined block field
- [ ] Info icon appears on Hero block headers in the www admin panel (even when collapsed)
- [ ] Clicking the icon opens a popover with Container and Text style sections
- [ ] Popover shows breakpoint tabs (Base, sm, md, lg, xl) since www config has breakpoints
- [ ] Selecting a spacing preset (e.g., margin "4") saves to the block instance
- [ ] Color picker shows both custom color and CSS variable theme colors tabs
- [ ] Copy styles button saves current block's styles to localStorage
- [ ] Paste styles button applies copied styles, stripping non-applicable tiers
- [ ] Block duplication copies blockStyles along with other fields
- [ ] HeroBlock on the frontend renders with the Tailwind classes from blockStyles
- [ ] Removing all style values sets blockStyles to undefined (not empty JSON)
- [ ] `pnpm build` succeeds across all packages
- [ ] `pnpm --filter @vexcms/core test` passes all existing + new tests
