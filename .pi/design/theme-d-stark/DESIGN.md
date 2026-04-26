---
version: alpha
name: VexCMS — Stark
description: >
  Pure near-black/white neutrals with a single electric spring-green accent.
  This palette fights directly in Payload and Vercel territory but wins on
  surprise: where those tools are coldly monochrome, Stark has one sudden,
  vivid pop. The green is unexpected, memorable, and signals "healthy system."

colors:
  primary: "#22C55E"
  primary-hover: "#34D96E"
  primary-dark: "#16A34A"
  primary-tint: "#DCFCE7"
  on-primary: "#052E16"

  surface-900: "#0A0A0A"
  surface-800: "#141414"
  surface-700: "#1E1E1E"
  surface-600: "#2A2A2A"

  ink: "#0A0A0A"
  ink-secondary: "#3A3A3A"
  ink-muted: "#717171"
  ink-subtle: "#A0A0A0"

  border-dark: "#2A2A2A"
  border-light: "#E4E4E4"

  surface-100: "#F5F5F5"
  surface-50: "#FAFAFA"
  white: "#FFFFFF"

  success: "#22C55E"
  on-success: "#052E16"
  warning: "#EAB308"
  on-warning: "#1A1000"
  destructive: "#EF4444"
  on-destructive: "#FFFFFF"

  code-bg-dark: "#111111"
  code-bg-light: "#F5F5F5"

typography:
  display:
    fontFamily: Geist
    fontSize: 4.5rem
    fontWeight: 800
    lineHeight: 1.0
    letterSpacing: -0.04em
  h1:
    fontFamily: Geist
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.1
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
    letterSpacing: 0.08em
  code:
    fontFamily: Geist Mono
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.7

rounded:
  none: 0px
  sm: 1px
  md: 2px
  lg: 4px
  xl: 8px
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
    backgroundColor: "{colors.surface-100}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 10px 20px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 10px 20px
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.ink}"
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
    textColor: "{colors.primary}"
  badge-brand:
    backgroundColor: "{colors.primary-tint}"
    textColor: "{colors.primary-dark}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  badge-neutral:
    backgroundColor: "{colors.surface-100}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  badge-neutral-dark:
    backgroundColor: "{colors.surface-600}"
    textColor: "{colors.ink-subtle}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  code-block:
    backgroundColor: "{colors.code-bg-dark}"
    textColor: "{colors.surface-100}"
    rounded: "{rounded.lg}"
    padding: 20px 24px
---

## Overview

**Radical Reduction. One Pop.** Stark is built on a constraint: pure near-black, pure near-white, and exactly one color. That color is electric spring green — not mint, not lime, not emerald. The exact Tailwind `green-500` (`#22C55E`), the color of a passing test suite, a healthy CI pipeline, a document set to Published.

Payload uses mono. Vercel uses mono. They both avoid color as a design decision. Stark doesn't avoid it — it weaponizes the absence of color to make the single instance of green land with maximum force. The green says: *working, live, healthy, shipped.*

Typography is all Geist, all the time. No mixing. At `800` weight display sizes, Geist produces headlines that feel engineered. At `400` body weight, it gets out of the way.

**Competitive positioning:** This is the palette for developers who love Vercel's aesthetic but want something with a heartbeat. The green is the heartbeat.

## Colors

The palette is deliberately restricted. No hue-family neutrals. Exact black, exact white, pure grays.

- **Primary (#22C55E):** Electric Spring Green — the only color in the system. Used with surgical precision: exactly where the user needs to act, exactly where the system is healthy. In dark mode, slightly brighter: `#34D96E`.
- **Primary Tint (#DCFCE7):** Pale green for light mode hover states and badges. Just barely green — closer to white. Disappears unless you're looking for it.
- **On Primary (#052E16):** Dark forest green for text on green buttons. White would also work, but this deep green creates a more sophisticated result and passes AAA.
- **Surface 900 (#0A0A0A):** Near-pure black page background. Slightly off pure black to avoid the harshness of `#000000`.
- **Surface 700 (#1E1E1E):** Card surfaces. The exact gray you see in VS Code's editor background. Familiar to every developer.
- **Surface 600 (#2A2A2A):** Borders in dark mode. The standard "dark separator."
- **Ink Muted (#717171):** Mid-gray muted text. Pure neutral — no chromatic tinting.
- **Border Light (#E4E4E4):** Light mode border. Pure neutral.

The palette has no warm or cool bias in the neutrals. The green is the only hue. This is intentional.

## Typography

One font. Geist. Every context.

Display headlines at `800` weight and `-0.04em` tracking: this is Geist at maximum tension. The wide, slightly geometric letterforms compress into something that feels almost mechanical. This is appropriate for a product that generates schemas and types.

Body at `400` weight: readable, clean, disappears. Geist body copy is not as warm as Inter, but it is more on-brand.

Labels at `500` weight with `0.08em` tracking (uppercase): tighter uppercase labels feel sharp and administrative — right for a CMS admin panel.

Geist Mono for code: self-evident.

**Why all-Geist?** Because this palette gets its personality from the green and the extreme weight contrast (display `800` vs body `400`), not from mixing typefaces. Adding a second typeface would dilute the effect.

## Layout

Maximum content width: `1280px`. Grid: 12 columns, `24px` gutters.

Section spacing: very generous. `80px` vertical padding on desktop. On a palette this neutral, whitespace is the only atmospheric tool. Use it liberally.

The Stark palette particularly benefits from **monospaced code demos** on the marketing homepage. A large code block in dark mode (near-black `#111111`, green accents on keywords, white text) is the most powerful visual element in this system.

## Elevation & Depth

Pure brightness steps, no hue shifts:

1. **Base:** `#0A0A0A` (Surface 900)
2. **Raised:** `#141414` (Surface 800)
3. **Floating:** `#1E1E1E` (Surface 700)

Dividers: `#2A2A2A` (Surface 600). A `1px` rule at this color is barely visible against `#1E1E1E` — just enough to define edges.

On the marketing site, consider using pure white sections between dark hero sections. The sharp contrast between `#0A0A0A` and `#FFFFFF` is this theme's most dramatic moment.

## Shapes

**Sharp.** No rounding at all on most elements. The Stark aesthetic is about precision and engineering.

- Buttons: `2px` — barely perceptibly rounded
- Inputs: `2px`
- Cards: `4px`
- Badges/chips: pill (the one shape exception — because chips float)
- Modals: `8px`
- Code blocks: `4px` with visible `1px` border

The near-zero radius is a deliberate design statement: this is not a SaaS consumer product with friendly pill buttons. This is a developer tool.

## Components

**CTA Button:** Electric Green (`#22C55E`) background, deep forest (`#052E16`) text. `10px 20px` padding, `2px` radius. This is the most memorable button in the CMS space. On hover: `#34D96E`.

**Secondary Button:** Light gray (`#F5F5F5`) background, black text. The neutrality of the secondary CTA makes the green primary land harder by contrast.

**Admin Sidebar:** Surface 900 background. Active items: `surface-600` background, `#22C55E` text — the green appears only on the active item. Hover: `surface-700`. The sidebar has no color except the single active item.

**Code Block:** `#111111` background (slightly lighter than page), `surface-100` body text. Single-pixel `surface-600` border. The code block is where syntax highlighting can optionally introduce the brand green for string literals or success paths.

**Badge/Tag — Brand:** `#DCFCE7` background, `#16A34A` text. Barely-green on light. Used for "Published" status, field type labels.

**Badge/Tag — Neutral:** `#F5F5F5` / `#2A2A2A` background, muted text. Used for "Draft", version numbers, metadata.

## Do's and Don'ts

**Do:**
- Use green exactly once per primary action per page
- Exploit the dramatic contrast between `#0A0A0A` and `#FFFFFF` in layout
- Use very generous whitespace — this palette needs room to be impactful
- Use near-zero border radius (`2px`) consistently
- Show large code blocks — this theme loves them
- Treat the green as a "health indicator" — use it where things are working

**Don't:**
- Don't use the green decoratively (backgrounds, illustrations, icons at rest)
- Don't introduce any chromatic neutrals — pure gray only
- Don't mix fonts — all-Geist is non-negotiable
- Don't add border-radius beyond `8px` on any non-pill element
- Don't use box-shadow in dark mode
- Don't dilute the impact by using multiple shades of green simultaneously
