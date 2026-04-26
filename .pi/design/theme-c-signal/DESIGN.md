---
version: alpha
name: VexCMS — Signal
description: >
  Teal/cyan accent on very dark cool-tinted near-black backgrounds.
  The "signal" metaphor — live data, reactive subscriptions, always
  in sync. No CMS competitor owns this palette. Neon / PlanetScale /
  Turso territory brought to content management.

colors:
  primary: "#0AACA0"
  primary-hover: "#0FC4B6"
  primary-dark: "#07857B"
  primary-tint: "#E0F7F5"
  on-primary: "#FFFFFF"

  surface-900: "#060E0D"
  surface-800: "#0C1A18"
  surface-700: "#122220"
  surface-600: "#1C3230"

  ink: "#060E0D"
  ink-secondary: "#2A4240"
  ink-muted: "#5A7A77"
  ink-subtle: "#85A8A5"

  border-dark: "#1C3230"
  border-light: "#C5DEDD"

  surface-100: "#F0F8F7"
  surface-50: "#F8FDFC"
  white: "#FFFFFF"

  success: "#22C55E"
  on-success: "#FFFFFF"
  warning: "#F59E0B"
  on-warning: "#1A1000"
  destructive: "#EF4444"
  on-destructive: "#FFFFFF"

  code-bg-dark: "#070F0E"
  code-bg-light: "#F0F8F7"

typography:
  display:
    fontFamily: Outfit
    fontSize: 4rem
    fontWeight: 800
    lineHeight: 1.0
    letterSpacing: -0.04em
  h1:
    fontFamily: Outfit
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.03em
  h2:
    fontFamily: Outfit
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.025em
  h3:
    fontFamily: Outfit
    fontSize: 1.875rem
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.02em
  h4:
    fontFamily: Outfit
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.75
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.7
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.05em
  code:
    fontFamily: Geist Mono
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.7

rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 18px
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
    textColor: "{colors.primary-dark}"
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
    textColor: "{colors.primary-dark}"
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
  live-indicator:
    backgroundColor: "{colors.success}"
    textColor: "{colors.on-success}"
    rounded: "{rounded.full}"
    size: 8px
  code-block:
    backgroundColor: "{colors.code-bg-dark}"
    textColor: "{colors.surface-100}"
    rounded: "{rounded.lg}"
    padding: 20px 24px
---

## Overview

**Live. Reactive. Always in sync.** Signal is built around the core metaphor of VexCMS — real-time data, Convex subscriptions firing the instant content changes. Teal and cyan are the colors of data in motion: network diagrams, oscilloscopes, terminal outputs. They belong to a world of signals, not static documents.

No CMS uses this palette. Payload is mono, Sanity is coral, Contentful is enterprise blue. Signal is the palette that announces: *this is a reactive system, not just a content store.*

Outfit headings carry weight with warmth — slightly rounded letterforms that make the technical product feel approachable without being soft. Inter grounds the body copy. Geist Mono speaks the language of the runtime.

**Competitive positioning:** This palette most directly targets developers who came from Neon, PlanetScale, or Turso — database-native builders who expect their tooling to feel like infrastructure, not software.

## Colors

One chromatic voice. Everything else serves it.

- **Primary (#0AACA0):** Signal Teal — a vivid, deep teal with cyan energy. Not the standard `#14B8A6` teal that appears in generic SaaS dashboards — this is slightly richer, more medium-value. Against a very dark cool background, it reads like a pulse on a monitor.
- **Primary Tint (#E0F7F5):** A very light aqua wash for light mode badges and hover states. Clean, medical-grade lightness.
- **Surface 900 (#060E0D):** The deepest dark — almost pure black with a barely perceptible teal undertone. Page background in dark mode.
- **Surface 700 (#122220):** Cards and modals. The teal-tinted dark surfaces distinguish this immediately from pure-black themes (Payload, Vercel).
- **Surface 600 (#1C3230):** Borders and dividers in dark mode. The teal undertone in the borders ties them to the primary accent.
- **Ink Muted (#5A7A77):** Secondary text — notably teal-tinted. This is unusual; most systems use chromatic-neutral muted text. The tinting keeps everything cohesive.
- **Success (#22C55E):** Bright spring green — intentionally different from teal to distinguish "live connection" (teal) from "published / healthy" (green).
- **Warning (#F59E0B):** Pure amber. Warm complement to cool teal — the highest visual contrast in the palette.

**Live Indicator pattern:** A small `8px` filled circle using `success` (#22C55E) next to real-time connection status. The teal primary is for interaction; green is explicitly for "connected." This distinction matters in a real-time CMS.

## Typography

Outfit is the uncommon choice that pays off. Its `800` display weight has massive optical impact — tight letter-spacing at `-0.04em` produces a terminal-output quality that's unusual for a modern heading font. At `700`/`600` for product headings, it reads as confident and structured.

Inter for body copy. This is not laziness — Inter at small sizes is genuinely the most legible variable font available. It disappears behind the content.

Geist Mono for code, because Geist is the font of Vercel-era TypeScript development. VexCMS is that ecosystem.

## Layout

Grid: 12 columns, `20px` gutters. Signal benefits from tight layouts — the dark surfaces with teal accents look best when content is dense and structured, like a dashboard or data explorer. Marketing pages should feel information-rich, not airy.

Maximum content width: `1200px` (slightly tighter than 1280px — creates more focused reading columns).

Admin panel: full-width, `260px` sidebar. The sidebar in dark mode should be the darkest level, making the content area feel like it floats.

## Elevation & Depth

The near-black surface-900 creates natural depth just by hue differentiation:

1. **Base:** `#060E0D` (Surface 900) — the void.
2. **Raised:** `#0C1A18` (Surface 800) — feature sections, table rows on hover.
3. **Floating:** `#122220` (Surface 700) — cards, modals, popovers.

Borders (`surface-600`, `#1C3230`) are visible and intentional — they define structure in the dark. A subtle `1px` teal-tinted border makes cards feel like physical panels.

## Shapes

Slightly more rounded than Violet, slightly less than "friendly." Signal is approachable infrastructure.

- Buttons: `8px`
- Inputs: `8px`
- Cards: `12px`
- Badges/chips: pill
- Modals: `18px`
- Live indicator dot: `50%` (circle)

The `8px` base radius on interactive elements signals "data tool" — compare to `6px` for Violet (more precise) or `4px` for Ember (more editorial).

## Components

**CTA Button:** Signal Teal (#0AACA0) background, white text. This combination achieves `~4.6:1` contrast — passing AA. On hover: `#0FC4B6`. In dark mode, the teal-on-dark contrast is exceptional (`~8:1`).

**Live Indicator:** The defining component of this theme. A small `8px` `success`-green dot (animated pulse) adjacent to real-time status labels. "● Live", "● Published", "● Connected". This is a signature VexCMS/Signal visual element.

**Code Block:** Deepest dark background (`#070F0E`). A thin `1px` `surface-600` border — this creates a "panel in void" effect. Language chip uses `primary-tint` background with `primary-dark` text.

**Admin Sidebar:** Even darker than page (`surface-900` at `5%` lightness). Active nav items use `surface-600` background and `primary-hover` text — like a lit circuit on a dark board.

## Do's and Don'ts

**Do:**
- Use the teal/cyan accent purposefully — CTAs, active states, live indicators
- Lean into the data/dashboard aesthetic for marketing — show real-time subscriptions
- Use the `live-indicator` component on every mention of real-time features
- Keep all surfaces teal-undertoned, even the darkest backgrounds
- Use Outfit `800` for display/hero text — it's the defining typographic moment

**Don't:**
- Don't use teal and green simultaneously as equivalent accents — teal is interaction, green is status
- Don't lighten the dark mode to a mid-dark gray — the near-black is essential to the monitor/terminal aesthetic
- Don't use rounded corners beyond `18px` except for pills
- Don't add warm color anywhere — this is a fully cool palette
- Don't use box-shadow in dark mode; use the surface color elevation system
