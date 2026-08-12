---
version: alpha
name: VexCMS — Vex Violet
description: >
  Electric violet-indigo as the hero accent on deep near-black backgrounds.
  Technical premium. The palette that no CMS competitor owns — it reads
  "type-safe reactive systems" (Linear, Liveblocks, Resend territory) while
  staying distinct from Payload's mono and Convex's warm orange.

colors:
  primary: "#6741D9"
  primary-hover: "#7B52E8"
  primary-dark: "#4D29B0"
  primary-tint: "#EDE8FF"
  on-primary: "#FFFFFF"

  surface-900: "#0C0B14"
  surface-800: "#14112B"
  surface-700: "#1E1C2E"
  surface-600: "#2B2840"

  ink: "#0C0B14"
  ink-secondary: "#3A3750"
  ink-muted: "#6E6B85"
  ink-subtle: "#9E9BB5"

  border-dark: "#2B2840"
  border-light: "#D4D2E0"

  surface-100: "#F2F1F8"
  surface-50: "#F9F8FD"
  white: "#FFFFFF"

  success: "#10B981"
  on-success: "#FFFFFF"
  warning: "#F59E0B"
  on-warning: "#1A1200"
  destructive: "#EF4444"
  on-destructive: "#FFFFFF"

  code-bg-dark: "#111028"
  code-bg-light: "#F2F1F8"

typography:
  display:
    fontFamily: Instrument Serif
    fontSize: 4rem
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -0.03em
  h1:
    fontFamily: Geist
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.03em
  h2:
    fontFamily: Geist
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.025em
  h3:
    fontFamily: Geist
    fontSize: 1.875rem
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.02em
  h4:
    fontFamily: Geist
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Geist
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.7
  body-md:
    fontFamily: Geist
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.65
  body-sm:
    fontFamily: Geist
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: Geist
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.06em
  code:
    fontFamily: Geist Mono
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.7

rounded:
  none: 0px
  sm: 3px
  md: 6px
  lg: 10px
  xl: 16px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 64px
  3xl: 96px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 10px 20px
    typography: body-sm
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.primary-tint}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 10px 20px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 10px 20px
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 10px 20px
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 10px 14px
  input-dark:
    backgroundColor: "{colors.surface-700}"
    textColor: "{colors.surface-50}"
  card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 24px
  card-dark:
    backgroundColor: "{colors.surface-700}"
    textColor: "{colors.surface-50}"
    rounded: "{rounded.lg}"
  nav-item:
    backgroundColor: transparent
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    padding: 6px 12px
  nav-item-active:
    backgroundColor: "{colors.primary-tint}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 6px 12px
  nav-item-active-dark:
    backgroundColor: "{colors.surface-600}"
    textColor: "{colors.primary-hover}"
  badge-brand:
    backgroundColor: "{colors.primary-tint}"
    textColor: "{colors.primary-dark}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  badge-success:
    backgroundColor: "#DCFCE7"
    textColor: "#15803D"
    rounded: "{rounded.full}"
    padding: 2px 10px
  code-block:
    backgroundColor: "{colors.code-bg-dark}"
    textColor: "{colors.surface-100}"
    rounded: "{rounded.lg}"
    padding: 20px 24px
---

## Overview

**Architectural Precision meets Editorial Depth.** VexCMS Violet is built for developers who value craft — Convex-native, type-safe, real-time by default. The palette anchors everything in deep near-black backgrounds with violet undertones, then punctuates with an electric indigo-violet that signals: *this is a system that thinks in types and reacts in milliseconds.*

The tone is technical but never cold. Clean headings in Geist carry the product story. Instrument Serif makes brief appearances in hero display moments to add gravity. Geist Mono is the language of schemas, field configs, and code demos.

**Competitive positioning:** Payload is monochrome. Convex is warm orange. Vercel is stark black/white. VexCMS Violet owns the violet-indigo register — the color of precision tooling (Linear, Liveblocks, Resend) — and brings it to the CMS space for the first time.

## Colors

The palette has two registers: deep near-black surfaces and a single high-intensity violet accent. Everything else is subordinate.

- **Primary (#6741D9):** Electric Violet — the hero brand color. Used for CTAs, active navigation states, links, and interactive highlights. In dark mode, brighten to `#7B52E8` or `#8B65F7` to maintain contrast against dark surfaces.
- **Primary Tint (#EDE8FF):** Subtle violet wash for tags, badges, hover backgrounds in light mode. Never use for text.
- **Surface 900 (#0C0B14):** The deepest dark — near-black with a violet undertone that subconsciously ties surfaces to the brand. Page background in dark mode.
- **Surface 700 (#1E1C2E):** Elevated dark surface. Cards, modals, code blocks, admin sidebar.
- **Surface 600 (#2B2840):** Borders and dividers in dark mode. Never used for text.
- **Ink Muted (#6E6B85):** The workhorse muted text. Navigation labels, metadata, timestamps.
- **Success (#10B981):** Emerald — reserved for live indicators, publish status, real-time connection signals. This is the "Convex is connected" color.
- **Warning (#F59E0B):** Amber. Use for unsaved changes banners and advisory states.
- **Destructive (#EF4444):** Red. Delete confirmations, error states, permission violations.

**Don't:** introduce a second accent color. The violet is the only chromatic voice. Success/warning/destructive are functional, not brand.

## Typography

Two typefaces. One optical serif. One monospace.

**Geist** is the workhorse — clean, geometric, designed for developer interfaces. It carries all headings (H1–H4), all body copy, labels, and UI strings. Its tight letter-spacing at large sizes produces the precise, modern feel this product deserves.

**Instrument Serif** appears *only* at display scale — hero headlines on the marketing site where a contrast of organic form against a tech product creates a memorable editorial moment. Use it sparingly. One instance per page maximum. Never in the admin panel.

**Geist Mono** is used in all code contexts: code blocks, inline `code`, schema output, field config examples. It is the language of the product itself.

**Scale discipline:** Marketing headlines (H1) sit at `3rem / -0.03em`. Admin panel headings should max at `1.5rem`. Don't mix sizes — use the defined scale.

## Layout

Maximum content width: `1280px` on marketing pages. Admin panel uses full-width with a `280px` fixed sidebar.

Grid: 12 columns, `16px` gutters on mobile, `24px` on desktop. Content sections use `24px–40px` vertical spacing between blocks.

The marketing site should breathe — generous whitespace on dark backgrounds amplifies the violet accent. Don't crowd elements. Let the background work.

**Key breakpoints:** `640px` (sm), `768px` (md), `1024px` (lg), `1280px` (xl).

## Elevation & Depth

Three elevation levels, all defined through background color shifts (never box-shadows in dark mode):

1. **Base:** `surface-900` (#0C0B14) — the page.
2. **Raised:** `surface-800` (#14112B) — section backgrounds, containers.
3. **Floating:** `surface-700` (#1E1C2E) — cards, modals, dropdowns, popovers.

In light mode, use `white` for floating elements and `surface-50` (#F9F8FD) for raised. Subtle `box-shadow: 0 1px 3px rgba(0,0,0,0.08)` is acceptable on light mode cards.

Never stack more than 3 elevation levels on a single screen. The admin panel sidebar always sits at the lowest elevation level (even darker than the page — `oklch(5% 0.012 285)`).

## Shapes

- **Buttons:** `rounded-md` (6px). Not pill-shaped — this is precision tooling, not a consumer app.
- **Inputs and form fields:** `rounded-md` (6px). Consistent with buttons.
- **Cards and panels:** `rounded-lg` (10px).
- **Tags, badges, chips:** `rounded-full` (pill). The only fully-rounded element in the system.
- **Code blocks:** `rounded-lg` (10px) with a `1px` border at `surface-600`.
- **Modals and dialogs:** `rounded-xl` (16px).
- **Images:** `rounded-lg` (10px) for editorial images, `rounded-full` for avatars only.

## Components

**CTA Button:** Electric Violet (`#6741D9`) background, white text. `10px 20px` padding, `6px` radius. On hover: `#7B52E8`. Never use rounded-full for CTAs — this is not a SaaS consumer product.

**Secondary Button:** Violet tint (`#EDE8FF`) background, Electric Violet text. Same sizing. Communicates a lower-hierarchy action.

**Admin Sidebar:** Background `oklch(5% 0.012 285)` (darkest surface). Active item: `surface-600` background, `#7B52E8` text. Hover: `surface-700`. The sidebar should feel like it recedes behind the content area.

**Code Block:** Background `#111028` (warm near-black with violet tint). Monospace text in `surface-100`. A thin 1px border at `surface-600`. Always include a copy-to-clipboard button.

**Badge / Status Chip:** Pill-shaped. Brand badges use violet tint background + primary-dark text. Success badges use `#DCFCE7` background + `#15803D` text. These appear next to publish status and field types.

**Navigation Active State (Marketing):** `primary-tint` (#EDE8FF) background, `primary` (#6741D9) text. Transitions are `150ms ease`. Don't animate width — animate opacity and background only.

## Do's and Don'ts

**Do:**
- Use Electric Violet for exactly one interactive CTA per section
- Use Geist at `700` weight for all product headings
- Let dark surfaces breathe — at least `64px` vertical padding per major section
- Use Emerald (#10B981) to show real-time/live connection status
- Put Geist Mono on every code snippet, no exceptions
- Use `oklch()` color space throughout the codebase for perceptual consistency

**Don't:**
- Don't use `primary` color for decorative elements (illustrations, icons at rest)
- Don't use Instrument Serif in the admin panel — it belongs to marketing only
- Don't apply box-shadow to dark-mode surfaces — use background shifts instead
- Don't use more than 3 font weights on a single page (400, 500, 700)
- Don't create new grays by mixing — use only the defined neutral scale
- Don't let the Convex orange bleed into VexCMS brand materials — they are separate products
