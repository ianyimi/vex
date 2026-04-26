# VexCMS Brand Guidelines — Signal

## Identity Summary

**Name:** VexCMS  
**Tagline options:** "The reactive CMS." / "Content infrastructure for real-time apps." / "Your schema. Live on every screen."  
**Tone:** Systems-builder. You're talking to the developer who reads the Convex architecture docs for fun. Precise, confident, infrastructure-first. Approachable through clarity, not friendliness.

---

## Color Palette

| Token            | Hex        | Usage                                                 |
|------------------|------------|-------------------------------------------------------|
| Signal Teal      | `#0AACA0`  | CTAs, active states, links, interactive highlights    |
| Teal Bright      | `#14C5B8`  | Dark mode primary (brighter for dark surface contrast)|
| Teal Dark        | `#07857B`  | Pressed states, strong emphasis, light mode badges    |
| Teal Tint        | `#E0F7F5`  | Badge bg, hover bg (light mode), aqua wash            |
| Surface 900      | `#060E0D`  | Dark mode page background (teal-undertoned near-black)|
| Surface 800      | `#0C1A18`  | Dark raised sections                                  |
| Surface 700      | `#122220`  | Dark cards, modals, code blocks                       |
| Surface 600      | `#1C3230`  | Dark mode borders and dividers                        |
| Ink Muted        | `#5A7A77`  | Secondary text, nav labels, timestamps                |
| Ink Subtle       | `#85A8A5`  | Placeholder text, disabled states                     |
| Border Light     | `#C5DEDD`  | Light mode borders (teal tint)                        |
| Surface 100      | `#F0F8F7`  | Light mode page background (teal-tinted near-white)   |
| Surface 50       | `#F8FDFC`  | Light mode card / popover background                  |
| Success (Green)  | `#22C55E`  | Published, healthy, live connection pulse indicator   |
| Warning          | `#F59E0B`  | Unsaved, advisory — warm amber complement to cool     |
| Destructive      | `#EF4444`  | Errors, delete, denied                                |

### Color Roles: Teal vs. Green

This is critical: **teal is interaction, green is status.**

| Use Teal (#0AACA0)         | Use Green (#22C55E)               |
|----------------------------|-----------------------------------|
| CTA buttons                | "Published" status badge          |
| Active nav items           | "Live" connection indicator dot   |
| Link color                 | Successful save toast             |
| Input focus ring           | "Connected to Convex" indicator   |
| Selected state             | Healthy / passing state           |

Never swap them. The distinction carries meaning.

### WCAG Contrast Notes

- `#0AACA0` on `#FFFFFF`: **~3.6:1** — use at large text or as background
- `#FFFFFF` on `#0AACA0`: **~3.6:1** — use at `18px+` or bold
- `#14C5B8` on `#060E0D`: **~9.2:1** — passes AAA
- `#85A8A5` on `#060E0D`: **~7.8:1** — passes AA

> **Note:** Like orange, teal has moderate contrast on white. Reserve teal as button backgrounds (white text on teal) or use it on dark backgrounds where contrast is exceptional.

---

## Typography

### Font Stack

| Role    | Font       | Fallback                      | Usage                                     |
|---------|------------|-------------------------------|-------------------------------------------|
| Sans    | Outfit     | Inter, system-ui, sans-serif  | Headings, nav, UI labels, marketing copy  |
| Body    | Inter      | system-ui, sans-serif         | Body text, docs, admin field labels       |
| Mono    | Geist Mono | JetBrains Mono, monospace     | Code blocks, inline code, schema output   |

### Next.js Font Setup (layout.tsx)

```tsx
import { Outfit, Inter, Geist_Mono } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});
```

### Type Scale

| Token       | Size    | Weight | Tracking  | Context                            |
|-------------|---------|--------|-----------|------------------------------------|
| display     | 4rem    | 800    | -0.04em   | Hero sections                      |
| h1          | 3rem    | 700    | -0.03em   | Page titles                        |
| h2          | 2.25rem | 700    | -0.025em  | Section headings                   |
| h3          | 1.875rem| 600    | -0.02em   | Sub-section headings               |
| h4          | 1.5rem  | 600    | -0.01em   | Card titles, admin headings        |
| body-lg     | 1.125rem| 400    | —         | Feature descriptions               |
| body-md     | 1rem    | 400    | —         | Standard body, docs                |
| body-sm     | 0.875rem| 400    | —         | Captions, labels, fine print       |
| label       | 0.75rem | 500    | +0.05em   | Form labels (uppercase caps)       |
| code        | 0.875rem| 400    | —         | All code contexts                  |

---

## Logo Direction

**Wordmark:** "VexCMS" in Outfit Bold. The "V" in Outfit has a slightly mechanical quality that evokes signal diagrams. Color: Signal Teal `#0AACA0` on white/light, `#14C5B8` on dark, white on teal.

**Icon variant:** A waveform or pulse icon — a simple sine wave or signal spike — that ties directly to the brand metaphor. Should read clearly at 16px. Alternative: geometric "V" as a signal spike (steep left side, gradual right side).

**Animated variant (optional):** On the marketing hero, the icon pulse can animate — a slow, real-time pulse that visually demonstrates "always in sync." Use the success green (#22C55E) for the pulse dot.

---

## The Live Indicator Component

Signal's signature UI element. Use it consistently across marketing and product:

```html
<!-- Pulse indicator -->
<span class="live-indicator">
  <span class="dot"></span>
  Live
</span>
```

CSS: `8px` circle, `success` green, with a `@keyframes ping` animation (Tailwind's `animate-ping`) at `75%` opacity. This visual element should appear in:
- The hero section of the marketing site
- Admin panel connection status
- Published document indicators
- "Real-time subscriptions" feature callout

---

## Spacing & Layout

- Base unit: `4px`
- Section vertical padding: `64px` (desktop) / `40px` (mobile)
- Max content width: `1200px` (tighter than 1280px — information-dense)
- Admin sidebar width: `260px`
- Border radius base: `8px` (buttons, inputs), `12px` (cards), `9999px` (badges, live dot)

---

## Tone of Voice

**Headline style:** Data-driven. Architecture-aware. Speaks in systems.
- ✅ "Every field. Every subscription. Type-safe."
- ✅ "Reactive mutations. Real-time queries. Zero polling."
- ❌ "Connect your team with seamless content management."
- ❌ "The future of content is here."

**Marketing copy:** Should feel like reading good documentation — clear, precise, no padding. One idea per sentence.

---

## Dos and Don'ts

| Do                                                          | Don't                                             |
|-------------------------------------------------------------|---------------------------------------------------|
| Use teal for all interactive/action elements                | Use teal and green interchangeably                |
| Use green exclusively for status/health indicators          | Warm any neutral — this palette is fully cool     |
| Show the live indicator on every real-time feature mention  | Round corners beyond 12px on most components      |
| Use Outfit `800` for display/hero text only                 | Use Outfit at low weights for body copy           |
| Keep dark mode very dark — Surface 900 at `#060E0D`         | Use box-shadows on dark mode surfaces             |
| Use `oklch()` in all CSS                                    | Use `hsl()` or legacy hex values in theme tokens  |
