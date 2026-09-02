# Spec 29 — Color Field

## Status: Notes (pre-spec)

These are design notes gathered from conversation. A full spec should be written before implementation.

---

## Overview

A new `color()` field type that stores a string value — either a CSS variable name or a hex color string. The admin component is a popover with two tabs.

## Field Definition

```ts
primaryColor: color({ label: "Primary Color" })
// stored value examples: "var(--primary)" or "#3b82f6"
```

Returns a `string`. No special Convex type needed — maps to `v.string()`.

## Admin Component

A popover triggered by a color swatch button (shows the current color). Two tabs:

### Tab 1: Theme Colors (CSS Variables)

- Reads color tokens from the **current site's theme document** (resolved via the site → theme relationship)
- Displays a grid of swatches, each labeled with the variable name
- Clicking a swatch sets the value to the CSS variable (e.g., `"var(--primary)"`)
- If **no theme is set for the current site**:
  - Show message: "No theme set for this site"
  - Provide a link to the admin page for the site's theme section (e.g., `/admin/main/theme`) where the user can select or create a theme
- If there is **no site defined at all** (user isn't using `defineSite`):
  - Either hide this tab entirely, or show a message explaining themes require a site config

### Tab 2: Custom Color

- Full color picker using `@uiw/react-color-sketch` (Sketch-style picker with gradient area, hue slider, and hex/rgb inputs)
- Hex input field (text input, validates hex format)
- Clicking/typing sets the value to the hex string (e.g., `"#3b82f6"`)

### Reference Implementation

Existing color field from uifoundry Payload project: `/Users/zaye/Documents/Projects/uifoundry.git/dev/src/payload/fields/color/index.tsx`

Key patterns to reuse for the custom color tab:
- **`@uiw/react-color-sketch`** — Sketch component for the color picker UI. Use `color` prop for current value and `onChange` with `color.hex` for updates.
- **Popover pattern** — Button trigger showing current color as background (`style={{ background: value }}`), popover content contains the picker. Use shadcn `Popover`, `PopoverTrigger`, `PopoverContent`.
- **`useField<string>({ path })`** — VEX already has its own `useField` hook that works the same way. Wire `setValue(color.hex)` from the Sketch onChange.
- **Default value** — Fall back to `"#000000"` when value is empty/undefined.

The VEX version will wrap this in a tabbed interface (shadcn `Tabs`) where Tab 1 is theme colors and Tab 2 contains the Sketch picker from this reference.

## Theme Integration

The color field needs to resolve the current site's theme at render time:
1. Determine which site the current document belongs to (or the active site context)
2. Follow the site's `theme` relationship to get the theme document
3. Read the theme document's color fields to populate the swatches tab

This means the color field admin component needs access to the site context — either via a React context provider in the admin layout, or by querying the site document directly.

## Where It Ships

- Field definition (`color()` factory function): `@vexcms/core`
- Admin component: `@vexcms/admin-next` (same as all other field admin components)
- Convex value type: `v.string()`

## Dependencies

- Spec 30 (Site Builder) — for theme integration. The color field CAN work without a site/theme (just the custom hex tab), but the CSS variables tab requires a theme document to read from.
- The field should degrade gracefully when no site/theme exists.

## Open Questions

- Should the color field support opacity/alpha values?
- Should it support named CSS colors (e.g., "red", "blue") or only hex?
- Should the theme tab also show Tailwind's default palette as a fallback when no custom theme exists?
- RGB/HSL input formats in addition to hex?
