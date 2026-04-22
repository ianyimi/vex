# Spec 29 — Color Field & Theme System

## Overview

Adds a `color()` field type to `@vexcms/core` with a color picker admin component, a theme CSS variable injection system, and a theme import UI. The color field stores a string value (hex, HSL, or OKLCH based on a `format` config option) and optionally shows a "Theme Colors" tab that reads CSS variables from the current page's computed styles. Also includes a theme toggle component for the admin panel, enhanced themes and site_settings collections, and color conversion utilities.

## Design Decisions

- **Color stored as string:** `v.optional(v.string())` in Convex schema. The `format` config option (`"hex" | "hsl" | "oklch"`) determines the output format. No `v.object()` — just a formatted color string.
- **`themeColors` config option:** `color({ themeColors: true })` enables a second tab in the picker showing CSS variables from the page. When `false` (default), only the custom color picker tab is shown.
- **Theme colors read from DOM:** The color picker reads CSS variables via `getComputedStyle(document.documentElement)`. No database query from the field component — the theme is already applied to the page via the CSS injection component.
- **Diagonal split preview:** When light and dark mode CSS variables exist, the theme color option shows a box split diagonally — light color (left/top) and dark color (right/bottom). Single mode shows a solid color box.
- **Searchable theme colors:** The theme colors tab includes a search input to filter by CSS variable name.
- **Theme CSS injection:** A server component reads the active theme document (via site_settings relationship) and renders an inline `<style>` tag with CSS variables. This makes the theme reactive — change a color in admin, refresh the page, see it.
- **Theme import:** A custom admin component on the themes collection lets users paste CSS from tweakcn/shadcn and auto-parse it into structured color fields.
- **Color conversion via culori:** The `culori` library handles hex ↔ HSL ↔ OKLCH conversion.
- **Admin theme toggle:** A light/dark mode toggle component added to the admin panel.
- **Changes in apps/www first:** All development happens in the www app for testing, then copied to the create-vexcms template.

## Out of Scope

- Marketing blocks (Spec 34)
- Marketing site pages/layouts (Spec 33)
- Demo site (Spec 35)
- Theme marketplace/sharing
- Multiple active themes per site
- Theme editor for editing colors inline (users edit the themes collection directly)

## Target Directory Structure

```
packages/core/src/
├── fields/
│   └── color/
│       ├── index.ts                    # NEW — re-exports
│       ├── config.ts                   # NEW — color() factory function
│       ├── config.test.ts              # NEW — factory tests
│       ├── schemaValueType.ts          # NEW — v.optional(v.string())
│       ├── schemaValueType.test.ts     # NEW
│       └── columnDef.ts               # NEW — color swatch in table
│       └── columnDef.test.ts          # NEW
├── types/
│   └── fields.ts                      # MODIFIED — add ColorFieldDef
├── valueTypes/
│   └── extract.ts                     # MODIFIED — add color case
├── typeGen/
│   └── fieldToTypeString.ts           # MODIFIED — color → "string"
├── formSchema/
│   ├── generateFormSchema.ts          # MODIFIED — color → z.string()
│   └── generateFormDefaultValues.ts   # MODIFIED — color → ""
├── columns/
│   └── generateColumns.ts            # MODIFIED — add color case

packages/ui/src/
├── components/
│   └── form/
│       └── fields/
│           └── ColorField.tsx         # NEW — color picker with theme tab

apps/www/src/
├── components/
│   └── ThemeInjector.tsx              # NEW — reads theme, injects CSS vars
│   └── ThemeToggle.tsx                # NEW — light/dark toggle
├── lib/
│   └── colorConvert.ts               # NEW — hex/hsl/oklch conversion
├── vexcms/
│   └── collections/
│       └── themes.ts                  # MODIFIED — structured color fields

agent-os/standards/
└── adding-a-field-type.md             # NEW — field type checklist (already created)
```

## Implementation Order

1. **Step 1:** Field type checklist standard doc — already created at `agent-os/standards/adding-a-field-type.md`
2. **Step 2:** `ColorFieldDef` type in `fields.ts` + `color()` factory function + tests — after this, `color()` can be called and type-checked
3. **Step 3:** Schema value type + extract dispatcher — after this, `vex dev` generates schema with color fields
4. **Step 4:** TypeScript type generation + form schema + default values — after this, types and forms work
5. **Step 5:** Column definition + dispatcher — after this, admin list views show color swatches
6. **Step 6:** Exports in core package — after this, `import { color } from "@vexcms/core"` works
7. **Step 7:** Color conversion utilities — after this, hex/hsl/oklch conversion available
8. **Step 8:** Color picker admin component in `@vexcms/ui` — after this, the admin panel renders the color picker
9. **Step 9:** Enhanced themes collection in www app — after this, themes have structured color fields
10. **Step 10:** Theme CSS injection component — after this, the frontend applies theme colors
11. **Step 11:** Theme import UI — after this, users can paste tweakcn/shadcn CSS
12. **Step 12:** Admin theme toggle — after this, light/dark mode toggle in admin
13. **Step 13:** Enhanced site_settings with active theme — after this, site settings reference a theme
14. **Step 14:** Copy to create-vexcms template + final integration

---

## Step 1: Field Type Checklist Standard

- [x] Create `agent-os/standards/adding-a-field-type.md` — already done

---

## Step 2: ColorFieldDef Type + Factory Function

- [ ] Add `ColorFieldDef` interface to `packages/core/src/types/fields.ts`
- [ ] Add `"color"` to the `VexField` discriminated union
- [ ] Add `"color"` case to `InferFieldType`
- [ ] Create `packages/core/src/fields/color/config.ts` with `color()` factory
- [ ] Create `packages/core/src/fields/color/config.test.ts`
- [ ] Run `pnpm --filter @vexcms/core test` — passes

### `File: packages/core/src/types/fields.ts` (additions)

Add to the interfaces section:

```typescript
/**
 * Color picker field. Stores a color string in the configured format.
 *
 * @example
 * ```ts
 * accentColor: color({ label: "Accent Color", format: "hex" })
 * primaryColor: color({ label: "Primary", format: "oklch", themeColors: true })
 * ```
 */
export interface ColorFieldDef extends BaseField {
  readonly type: "color";
  /**
   * Output format for the color value.
   * - "hex" — e.g., "#3b82f6" (default)
   * - "hsl" — e.g., "hsl(217, 91%, 60%)"
   * - "oklch" — e.g., "oklch(0.623 0.214 259.1)"
   */
  format?: "hex" | "hsl" | "oklch";
  /**
   * When true, shows a "Theme Colors" tab in the color picker
   * that displays CSS variables from the current page's computed styles.
   * Users can select a theme color variable instead of picking a custom color.
   *
   * Default: false
   */
  themeColors?: boolean;
}
```

Add to `VexField` union and `InferFieldType`:

```typescript
// In VexField union:
| ColorFieldDef

// In InferFieldType:
F extends ColorFieldDef ? string :
```

### `File: packages/core/src/fields/color/config.ts`

```typescript
import type { ColorFieldDef } from "../../types/fields";

/**
 * Creates a color field definition.
 *
 * @param props - Color field configuration
 * @param props.label - Display label in admin panel
 * @param props.format - Output format: "hex" (default), "hsl", or "oklch"
 * @param props.themeColors - When true, shows theme CSS variable picker tab
 * @returns ColorFieldDef
 */
export function color(props?: Omit<ColorFieldDef, "type">): ColorFieldDef {
  return {
    ...props,
    type: "color" as const,
  };
}
```

### `File: packages/core/src/fields/color/config.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { color } from "./config";

describe("color field factory", () => {
  it("creates a color field with default options", () => {
    const field = color({ label: "Color" });
    expect(field.type).toBe("color");
    expect(field.label).toBe("Color");
    expect(field.format).toBeUndefined();
    expect(field.themeColors).toBeUndefined();
  });

  it("accepts format option", () => {
    const field = color({ label: "Color", format: "oklch" });
    expect(field.format).toBe("oklch");
  });

  it("accepts themeColors option", () => {
    const field = color({ label: "Color", themeColors: true });
    expect(field.themeColors).toBe(true);
  });

  it("creates with no args", () => {
    const field = color();
    expect(field.type).toBe("color");
  });

  it("accepts required and defaultValue", () => {
    const field = color({ label: "Color", required: true, defaultValue: "#000000" });
    expect(field.required).toBe(true);
    expect(field.defaultValue).toBe("#000000");
  });
});
```

---

## Step 3: Schema Value Type + Dispatcher

- [ ] Create `packages/core/src/fields/color/schemaValueType.ts`
- [ ] Create `packages/core/src/fields/color/schemaValueType.test.ts`
- [ ] Add case in `packages/core/src/valueTypes/extract.ts`
- [ ] Run `pnpm --filter @vexcms/core test` — passes

### `File: packages/core/src/fields/color/schemaValueType.ts`

```typescript
import type { ColorFieldDef } from "../../types/fields";
import { TEXT_VALUETYPE } from "../constants";
import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";

/**
 * Convert a color field to its Convex schema value type string.
 * Color fields store strings (hex, hsl, or oklch) so they use v.string().
 */
export function colorToValueTypeString(props: {
  field: ColorFieldDef;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    baseValueType: TEXT_VALUETYPE,
    field: props.field,
  });
}
```

### `File: packages/core/src/fields/color/schemaValueType.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { colorToValueTypeString } from "./schemaValueType";
import { color } from "./config";

describe("colorToValueTypeString", () => {
  it("generates v.optional(v.string()) for optional color", () => {
    const result = colorToValueTypeString({
      field: color({ label: "Color" }),
      collectionSlug: "test",
      fieldName: "color",
    });
    expect(result).toBe("v.optional(v.string())");
  });

  it("generates v.string() for required color", () => {
    const result = colorToValueTypeString({
      field: color({ label: "Color", required: true, defaultValue: "#000" }),
      collectionSlug: "test",
      fieldName: "color",
    });
    expect(result).toBe("v.string()");
  });
});
```

### Changes to `packages/core/src/valueTypes/extract.ts`

Add import and case:

```typescript
import { colorToValueTypeString } from "../fields/color/schemaValueType";

// In fieldToValueType switch:
case "color":
  return colorToValueTypeString({ field, collectionSlug, fieldName });
```

---

## Step 4: TypeScript Type Gen + Form Schema + Default Values

- [ ] Add `"color"` case to `packages/core/src/typeGen/fieldToTypeString.ts`
- [ ] Add `"color"` case to `packages/core/src/formSchema/generateFormSchema.ts`
- [ ] Add `"color"` case to `packages/core/src/formSchema/generateFormDefaultValues.ts`
- [ ] Update existing test files with color field cases
- [ ] Run `pnpm --filter @vexcms/core test` — passes

### Changes to `fieldToTypeString.ts`

```typescript
case "color":
  return "string";
```

### Changes to `generateFormSchema.ts`

```typescript
case "color":
  return z.string();
```

### Changes to `generateFormDefaultValues.ts`

```typescript
case "color":
  return props.field.defaultValue ?? "";
```

---

## Step 5: Column Definition + Dispatcher

- [ ] Create `packages/core/src/fields/color/columnDef.ts`
- [ ] Create `packages/core/src/fields/color/columnDef.test.ts`
- [ ] Add case in `packages/core/src/columns/generateColumns.ts`
- [ ] Run `pnpm --filter @vexcms/core test` — passes

### `File: packages/core/src/fields/color/columnDef.ts`

```typescript
import type { ColumnDef } from "@tanstack/react-table";
import type { ColorFieldDef } from "../../types/fields";

/**
 * Generate a column definition for a color field.
 * Shows the color value as text with a color swatch.
 */
export function colorColumnDef(props: {
  fieldKey: string;
  field: ColorFieldDef;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.field.label ?? props.fieldKey,
    size: 120,
    cell: (info) => {
      const value = info.getValue() as string | undefined;
      if (!value) return "";
      return value;
    },
    meta: {
      type: "color" as const,
    },
  };
}
```

### `File: packages/core/src/fields/color/columnDef.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { colorColumnDef } from "./columnDef";
import { color } from "./config";

describe("colorColumnDef", () => {
  it("creates column with field label as header", () => {
    const col = colorColumnDef({
      fieldKey: "primaryColor",
      field: color({ label: "Primary Color" }),
    });
    expect(col.header).toBe("Primary Color");
    expect((col as any).accessorKey).toBe("primaryColor");
  });

  it("falls back to field key when no label", () => {
    const col = colorColumnDef({
      fieldKey: "color",
      field: color(),
    });
    expect(col.header).toBe("color");
  });
});
```

### Changes to `generateColumns.ts`

```typescript
import { colorColumnDef } from "../fields/color/columnDef";

// In buildColumnDef switch:
case "color":
  return colorColumnDef({ fieldKey, field });
```

---

## Step 6: Exports

- [ ] Create `packages/core/src/fields/color/index.ts`
- [ ] Add export to `packages/core/src/fields/index.ts`
- [ ] Add export to `packages/core/src/index.ts`
- [ ] Run `pnpm --filter @vexcms/core build` — passes

### `File: packages/core/src/fields/color/index.ts`

```typescript
export { color } from "./config";
export { colorToValueTypeString } from "./schemaValueType";
export { colorColumnDef } from "./columnDef";
```

### Changes to `packages/core/src/fields/index.ts`

```typescript
export { color } from "./color";
```

### Changes to `packages/core/src/index.ts`

Add to field helpers:
```typescript
export { color } from "./fields/color";
```

Add to type exports:
```typescript
ColorFieldDef,
```

---

## Step 7: Color Conversion Utilities

- [ ] Install `culori` in apps/www: `pnpm --filter www add culori`
- [ ] Create `apps/www/src/lib/colorConvert.ts`
- [ ] Verify build

### `File: apps/www/src/lib/colorConvert.ts`

```typescript
import { parse, formatHex, formatHsl, converter } from "culori";

const toOklch = converter("oklch");

/**
 * Convert a color string to the specified format.
 *
 * @param props.color - Input color in any CSS-parseable format
 * @param props.format - Target format: "hex", "hsl", or "oklch"
 * @returns Formatted color string, or the original if parsing fails
 */
export function convertColor(props: {
  color: string;
  format: "hex" | "hsl" | "oklch";
}): string {
  // TODO: implement
  //
  // 1. Parse the input color with culori's parse()
  //    → If null (unparseable), return props.color as-is
  //
  // 2. Switch on props.format:
  //    a. "hex" → return formatHex(parsed)
  //    b. "hsl" → return formatHsl(parsed)
  //    c. "oklch" → convert to oklch, format as "oklch(L C H)"
  //       with L to 3 decimals, C to 3 decimals, H to 1 decimal
  //
  // Edge cases:
  // - Input is already in target format → still convert (normalizes)
  // - Input is a CSS variable like "var(--primary)" → return as-is (can't parse)
  // - Input is empty string → return ""
  throw new Error("Not implemented");
}

/**
 * Extract CSS custom properties from the document's computed styles.
 * Returns an array of { name, lightValue, darkValue } objects.
 *
 * @returns Array of theme color entries
 */
export function getThemeColorsFromDOM(): {
  name: string;
  lightValue: string;
  darkValue: string | null;
}[] {
  // TODO: implement
  //
  // 1. Get all CSS custom properties from :root via getComputedStyle
  //    → document.documentElement
  //
  // 2. Filter to only color-related variables (--background, --foreground,
  //    --primary, --secondary, etc.)
  //    → Skip non-color vars like --radius, --spacing, --font-*
  //
  // 3. For each variable, get the light mode value from :root
  //
  // 4. Check if a .dark class exists — if so, temporarily add it to get
  //    dark mode values, then remove it
  //    → Or read from stylesheet rules directly
  //
  // 5. Return sorted array of { name, lightValue, darkValue }
  //
  // Edge cases:
  // - No CSS variables on page → return empty array
  // - No .dark class defined → darkValue is null for all
  // - SSR/server context → return empty array (no document)
  throw new Error("Not implemented");
}
```

---

## Step 8: Color Picker Admin Component

- [ ] Install `@uiw/react-color-sketch` in `@vexcms/ui`: `pnpm --filter @vexcms/ui add @uiw/react-color-sketch`
- [ ] Create `packages/ui/src/components/form/fields/ColorField.tsx`
- [ ] Export from `packages/ui/src/components/form/fields/index.ts`
- [ ] Add case in `packages/ui/src/components/form/AppForm.tsx`
- [ ] Run `pnpm build` — passes

### `File: packages/ui/src/components/form/fields/ColorField.tsx`

```tsx
"use client";

// TODO: implement
//
// 1. Component receives: field (from TanStack Form), fieldDef (ColorFieldDef), name (string)
//
// 2. Render a Popover trigger button showing:
//    a. A color swatch square (16x16) with the current color value as background
//    b. The color string value next to it (or "No color" placeholder)
//
// 3. Popover content has tabs (only if fieldDef.themeColors is true):
//    Tab 1: "Custom" — color picker
//      - @uiw/react-color-sketch component
//      - Hex/HSL/OKLCH input below based on fieldDef.format
//      - On change, convert to target format and call field.handleChange
//
//    Tab 2: "Theme" (only if themeColors: true)
//      - Search input at top for filtering
//      - Grid of theme color options
//      - Each option shows:
//        - CSS variable name (e.g., "--primary")
//        - Diagonal split box: light color (top-left) / dark color (bottom-right)
//        - If no dark mode, solid color box
//      - On click, set the field value to the CSS variable's computed color
//        in the configured format
//
// 4. If themeColors is false, just show the color picker directly (no tabs)
//
// 5. Read theme colors from DOM via getComputedStyle:
//    - Get all CSS custom properties from :root
//    - Filter to color variables
//    - For dark mode: check stylesheet rules for .dark class
//
// Edge cases:
// - No theme applied → theme tab shows "No theme colors found"
// - Field is disabled → picker is read-only
// - Field is required → show required indicator
// - Color value is invalid → swatch shows transparent/checker pattern
```

---

## Step 9: Enhanced Themes Collection

- [ ] Update `apps/www/src/vexcms/collections/themes.ts` with structured color fields
- [ ] Add color fields for all ~35 shadcn CSS variables (light + dark groups)
- [ ] Run `pnpm --filter www vex:dev` — schema generates

The themes collection should have:
- Name (text, required)
- Light mode colors group (collapsible) — ~18 color fields
- Dark mode colors group (collapsible) — ~18 color fields
- Common styles group — radius, font family, spacing

Each color field uses `color({ themeColors: false })` since these ARE the theme definitions — they shouldn't reference themselves.

---

## Step 10: Theme CSS Injection Component

- [ ] Create `apps/www/src/components/ThemeInjector.tsx`
- [ ] Wire into the frontend layout
- [ ] Verify colors apply on page load

### `File: apps/www/src/components/ThemeInjector.tsx`

```tsx
// TODO: implement
//
// Server component that:
// 1. Queries the active theme from site_settings (via Convex fetchQuery)
// 2. If no active theme, render nothing (fall back to globals.css defaults)
// 3. Build CSS variable declarations from the theme document's color fields
//    → `:root { --background: #fff; --foreground: #000; ... }`
//    → `.dark { --background: #000; --foreground: #fff; ... }`
// 4. Render as <style dangerouslySetInnerHTML={{ __html: css }} />
//
// Edge cases:
// - Theme has some colors undefined → skip those variables (use CSS defaults)
// - Theme has no dark mode colors → skip .dark block
// - No site_settings document → render nothing
```

---

## Step 11: Theme Import UI

- [ ] Create custom admin component for the themes collection
- [ ] Parse CSS input (`:root { }` and `.dark { }`) into color field values
- [ ] Wire as a UI field on the themes collection

The import UI is a `ui()` field on the themes collection that renders a textarea + "Import" button. When clicked, it parses the CSS and fills in all the color fields.

---

## Step 12: Admin Theme Toggle

- [ ] Create `apps/www/src/components/ThemeToggle.tsx`
- [ ] Add to the admin layout (in NavUser dropdown or header)
- [ ] Verify light/dark switching works

### `File: apps/www/src/components/ThemeToggle.tsx`

```tsx
"use client";

import { useTheme } from "next-themes";

// TODO: implement
//
// Simple toggle button using next-themes:
// - Shows sun icon in dark mode, moon icon in light mode
// - Cycles: light → dark → system → light
// - Or dropdown: Light, Dark, System options
```

---

## Step 13: Enhanced Site Settings

- [ ] Add `activeTheme` relationship field to site_settings collection
- [ ] Point to themes collection slug
- [ ] The ThemeInjector reads from this relationship

---

## Step 14: Copy to Template + Final Integration

- [ ] Copy enhanced themes collection to `packages/create-cli/templates/marketing-site/`
- [ ] Copy enhanced site_settings to marketing-site overlay
- [ ] Copy ThemeInjector component to base-nextjs template
- [ ] Copy ThemeToggle component to base-nextjs template
- [ ] Copy colorConvert utilities to base-nextjs template
- [ ] Rebuild create-vexcms: `pnpm --filter create-vexcms build`
- [ ] Delete and re-scaffold apps/www to verify everything works
- [ ] Run full test suite: `pnpm --filter @vexcms/core test`
- [ ] Run full build: `pnpm build`

## Success Criteria

- [ ] `color()` field factory works with `format` and `themeColors` options
- [ ] Schema generates `v.optional(v.string())` for color fields
- [ ] TypeScript types generate `string` for color fields
- [ ] Admin panel renders color picker with hex/hsl/oklch input
- [ ] Theme colors tab shows CSS variables with light/dark split preview when `themeColors: true`
- [ ] Theme colors tab is searchable
- [ ] Theme colors tab hidden when `themeColors: false`
- [ ] Themes collection has structured light/dark color fields
- [ ] ThemeInjector renders CSS variables from active theme
- [ ] Theme import parses tweakcn/shadcn CSS into color fields
- [ ] Admin theme toggle switches light/dark mode
- [ ] Site settings references active theme
- [ ] Color field shows swatch in admin list view columns
- [ ] All existing tests pass — no regressions
- [ ] `pnpm build` succeeds across monorepo
- [ ] Fresh scaffold from create-vexcms works with enhanced themes
- [ ] `adding-a-field-type.md` standard doc exists and is accurate
