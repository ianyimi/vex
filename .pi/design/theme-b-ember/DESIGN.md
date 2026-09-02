---
version: alpha
name: VexCMS — Ember
description: >
  Warm amber-orange accent on deep warm-dark near-black backgrounds.
  VexCMS is Convex-native — this palette embraces that kinship through
  warm undertones without copying Convex's brighter orange. Darker,
  more editorial. Think glowing coal, not a startup gradient.

colors:
  primary: "#E8622A"
  primary-hover: "#F07040"
  primary-dark: "#C04E1E"
  primary-tint: "#FEF0E8"
  on-primary: "#FFFFFF"

  surface-900: "#100C08"
  surface-800: "#1C1510"
  surface-700: "#271E16"
  surface-600: "#362A1F"

  ink: "#100C08"
  ink-secondary: "#4A3A2D"
  ink-muted: "#7A6A5C"
  ink-subtle: "#A8968A"

  border-dark: "#362A1F"
  border-light: "#E0D5CB"

  surface-100: "#FAF6F2"
  surface-50: "#FFFCFA"
  white: "#FFFFFF"

  success: "#16A34A"
  on-success: "#FFFFFF"
  warning: "#CA8A04"
  on-warning: "#1A1000"
  destructive: "#DC2626"
  on-destructive: "#FFFFFF"

  code-bg-dark: "#18110A"
  code-bg-light: "#FAF6F2"

typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 4rem
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -0.04em
  h1:
    fontFamily: Space Grotesk
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.035em
  h2:
    fontFamily: Space Grotesk
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.025em
  h3:
    fontFamily: Space Grotesk
    fontSize: 1.875rem
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.02em
  h4:
    fontFamily: Space Grotesk
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.72
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.68
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.62
  label:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.06em
  code:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.7

rounded:
  none: 0px
  sm: 2px
  md: 4px
  lg: 8px
  xl: 12px
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
  code-block:
    backgroundColor: "{colors.code-bg-dark}"
    textColor: "{colors.surface-100}"
    rounded: "{rounded.lg}"
    padding: 20px 24px
---

## Overview

**Coal Dark meets Convex Warmth.** Ember was designed with one truth in mind: VexCMS is Convex-native, and Convex runs warm. But where Convex's palette is bright and energetic, Ember turns the heat down — embers, not flames. Deep warm near-blacks that feel like heated iron, punctuated by a rich amber-orange that glows without shouting.

Space Grotesk carries the headings — geometric and modern with a slightly heavier optical weight than Geist. Inter handles body copy with quiet efficiency. JetBrains Mono brings familiarity to developers already living in their editors.

**Competitive positioning:** Payload is cold mono. Vercel is pure black. This is warm dark. Nobody in the CMS space owns warm-dark editorial. It's also the most natural palette for communicating "runs on Convex" without being derivative of it.

## Colors

The entire palette draws from a single warm hue family: orange (H≈40–50) as the accent, with neutrals shifted warm throughout.

- **Primary (#E8622A):** Ember Orange — a rich, saturated amber-orange that sits between Convex's brighter `#F97316` and a muted rust. It glows on dark backgrounds without overwhelming.
- **Primary Tint (#FEF0E8):** Very subtle warm wash for light mode badges and hover states. Nearly skin-tone neutral at rest.
- **Surface 900 (#100C08):** The darkest dark — warm near-black, like looking into a cooling forge. Page background in dark mode.
- **Surface 700 (#271E16):** Card and modal surfaces in dark mode. Perceptibly warmer than the page.
- **Surface 600 (#362A1F):** Borders and dividers. The warm equivalent of a dark neutral separator.
- **Ink Muted (#7A6A5C):** Secondary text. Warm, readable, not harsh.
- **Success (#16A34A):** Forest green — deliberately darker than emerald to stay readable on warm backgrounds.
- **Warning (#CA8A04):** Deep gold — shifted away from amber since primary IS amber. This reads "caution" without competing.
- **Destructive (#DC2626):** A standard red. No warm tint needed here — red is already warm.

## Typography

Space Grotesk headings give the brand a geometric editorial quality — the "G" shapes feel almost like letterpress printing, which is appropriate for a content management system. It has slightly more character than Geist while remaining technical.

Inter handles body copy because it is the most battle-tested readable sans at small sizes. It disappears into the content, which is exactly what body type should do.

JetBrains Mono is the developer's mono. It's the font that most developers already see in their editor daily — it signals "this is technical, this is yours" more than Geist Mono does for users who don't already use Geist.

The type scale uses tighter letter-spacing at large sizes (`-0.04em` at display) and relaxes toward zero at body sizes. This creates visual tension that makes headings feel designed.

## Layout

Maximum content width: `1280px` marketing, full-width admin. The warm palette needs generous whitespace to breathe — particularly on the dark backgrounds where warm neutrals can feel dense if crowded.

**Admin sidebar:** `280px` fixed. Uses `surface-900` background (same as page) with `surface-700` active items — the sidebar recedes visually.

Section padding: `72px` vertical on desktop, `48px` on mobile. Slightly more generous than neutral palettes because warm dark needs more air.

## Elevation & Depth

- **Base:** `#100C08` (Surface 900) — the forge floor.
- **Raised:** `#1C1510` (Surface 800) — lifted sections, feature rows.
- **Floating:** `#271E16` (Surface 700) — cards, dropdowns, modals.

Borders between elevation levels use `surface-600` (#362A1F). Never box-shadow in dark mode.

Light mode elevation uses standard white / `surface-50` / `surface-100` hierarchy with warm-toned subtle borders.

## Shapes

**Sharp and purposeful.** The Ember theme uses a tighter radius than Violet because warm colors already feel approachable — you don't need rounded corners to soften the effect. The precision communicates: this is professional tooling.

- Buttons: `4px` (rounded-md)
- Inputs: `4px`
- Cards: `8px`
- Badges/chips: pill (full)
- Modals: `12px`

## Components

**CTA Button:** Ember Orange (#E8622A) background, white text. `10px 20px` padding, `4px` radius. The orange-on-dark-background contrast ratio is high enough to pass AA. On hover: `#F07040`.

**Secondary Button:** Warm tint (#FEF0E8) background, dark orange (#C04E1E) text. Only for light mode — in dark mode use a semi-transparent overlay.

**Admin Sidebar:** `surface-900` background (matches page — sidebar blends in). Active items get `surface-700` background with `#F07040` text. Hover uses `surface-800`. This is a recessed, quiet sidebar — the content area is the focus.

**Code Block:** Background `#18110A` (deepest warm dark). Monospace text in `surface-100`. Thin `surface-600` border. Language label in `ink-subtle`.

## Do's and Don'ts

**Do:**
- Use the warm undertone throughout — warm near-blacks, warm borders, warm muted text
- Let the orange glow on dark — don't use it on warm-light backgrounds where it clashes
- Use Space Grotesk `700` for all headings at weight
- Use JetBrains Mono for code exclusively
- Pair with Convex documentation and tools without copying their exact orange

**Don't:**
- Don't use both primary orange AND a warm warning simultaneously — the reader won't distinguish them
- Don't use the primary tint (#FEF0E8) for large background areas — it becomes skin-toned and odd
- Don't round corners beyond `8px` on most components — the sharpness is intentional
- Don't use cool grays anywhere — every neutral in this palette is warm-tinted
- Don't use box-shadows in dark mode
