# VexCMS Brand Guidelines — Stark

## Identity Summary

**Name:** VexCMS  
**Tagline options:** "Open source. Type-safe. Ships." / "Zero config. Zero compromise." / "The CMS that gets out of the way."  
**Tone:** Terse. Confident. Zero padding. The voice of a developer who has already built the thing and just wants you to use it. No marketing-speak. One idea per sentence.

---

## Color Palette

| Token            | Hex        | Usage                                              |
|------------------|------------|----------------------------------------------------|
| Electric Green   | `#22C55E`  | The only accent. CTAs, active states, success      |
| Green Bright     | `#34D96E`  | Dark mode primary (brighter on dark surface)       |
| Green Dark       | `#16A34A`  | Pressed states, badges on light bg                 |
| Green Tint       | `#DCFCE7`  | Badge bg, hover bg (barely visible)                |
| On Green         | `#052E16`  | Text on green buttons — deep forest, not white     |
| Surface 900      | `#0A0A0A`  | Dark mode page background (near-pure black)        |
| Surface 800      | `#141414`  | Dark raised sections                               |
| Surface 700      | `#1E1E1E`  | Dark cards, modals — VS Code editor territory      |
| Surface 600      | `#2A2A2A`  | Dark mode borders and dividers                     |
| Ink Muted        | `#717171`  | Secondary text, nav labels, timestamps             |
| Ink Subtle       | `#A0A0A0`  | Placeholder text, disabled states                  |
| Border Light     | `#E4E4E4`  | Light mode borders (pure neutral)                  |
| Surface 100      | `#F5F5F5`  | Light mode page background (neutral near-white)    |
| Surface 50       | `#FAFAFA`  | Light mode card background                         |
| Warning          | `#EAB308`  | Unsaved changes — warm yellow                      |
| Destructive      | `#EF4444`  | Errors, delete, denied                             |

### The Single Green Rule

**There is one color in this palette.** Use it in exactly these contexts:

1. The primary CTA button (maximum one per section)
2. The active navigation item
3. The focus ring on inputs and interactive elements
4. Published/success status indicators
5. Syntax highlighting for success paths in code demos

**Everywhere else is black, white, or gray.** If you find yourself wanting to use green for a second thing on the same page, remove one of them.

### WCAG Contrast Notes

- `#22C55E` on `#FFFFFF`: **~2.7:1** — only use as background (white text fails; use `#052E16` text)
- `#052E16` on `#22C55E`: **~7.1:1** — passes AAA
- `#34D96E` on `#0A0A0A`: **~8.0:1** — passes AAA
- `#A0A0A0` on `#0A0A0A`: **~6.8:1** — passes AA

> **Always use `#052E16` (deep forest green) as text on the green button, not white.** White on green fails AA at `22C55E`. The dark forest text is also more distinctive.

---

## Typography

### One Font: Geist

No exceptions. All contexts. All weights.

| Context  | Font  | Weight | Notes                              |
|----------|-------|--------|------------------------------------|
| Display  | Geist | 800    | Hero headlines, `-0.04em` tracking |
| Headings | Geist | 700    | H1–H2                              |
| Subheads | Geist | 600    | H3–H4                              |
| Body     | Geist | 400    | Body copy, docs, admin text        |
| Labels   | Geist | 500    | Form labels, table headers         |
| Code     | Geist Mono | 400 | All code contexts               |

**Why all-Geist?** The design impact comes from the single green accent and extreme weight contrast. A second typeface would dilute both. Geist at `800` weight is designed precisely and creates memorable display moments. Geist at `400` is clean and technical at small sizes.

### Next.js Font Setup (layout.tsx)

```tsx
import { Geist, Geist_Mono } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});
```

### Type Scale

| Token       | Size    | Weight | Tracking  | Context                            |
|-------------|---------|--------|-----------|------------------------------------|
| display     | 4.5rem  | 800    | -0.04em   | Hero sections — largest moment     |
| h1          | 3rem    | 700    | -0.03em   | Page titles                        |
| h2          | 2.25rem | 700    | -0.025em  | Section headings                   |
| h3          | 1.875rem| 600    | -0.02em   | Sub-section headings               |
| h4          | 1.5rem  | 600    | -0.015em  | Card titles, admin headings        |
| body-lg     | 1.125rem| 400    | —         | Feature descriptions               |
| body-md     | 1rem    | 400    | —         | Standard body, docs                |
| body-sm     | 0.875rem| 400    | —         | Captions, labels, fine print       |
| label       | 0.75rem | 500    | +0.08em   | Form labels — uppercase caps       |
| code        | 0.875rem| 400    | —         | All code contexts                  |

---

## Logo Direction

**Wordmark:** "VexCMS" in Geist ExtraBold (`800`). Very tight letter-spacing (`-0.04em`). Color: `#22C55E` on black/dark, black on white, white on green. No gradients.

**Icon variant:** A minimal geometric mark — a checkmark integrated into the "V" shape, or a simple forward chevron. The green mark on black background is the primary icon expression. At 16px favicon size: green `#22C55E` on black `#0A0A0A`.

**Key constraint:** The logo should work in two colors only: black+green or white+green. Never full-color, never gradient, never on a colored background (other than the brand green itself).

---

## Spacing & Layout

- Section padding: `80px` desktop / `48px` mobile — the whitespace is doing design work here
- Max content width: `1280px`
- Admin sidebar: `260px`
- Border radius: `2px` buttons/inputs, `4px` cards, `9999px` pills only

---

## Code as Hero

In the Stark theme, **code blocks are the primary visual element** on the marketing homepage. A full-width or half-width dark code block with VexCMS schema/field definitions is the most compelling visual this palette produces.

```
Background: #111111
Text: #F5F5F5
Keywords: #22C55E (green)
Strings: #A0A0A0
Comments: #4A4A4A
```

This is the Stark signature moment.

---

## Tone of Voice

**Headlines:** Factual. Declarative. No adjectives unless they're precise.
- ✅ "Type-safe. Real-time. Open source."
- ✅ "Define once. Query anywhere. Ship."
- ❌ "The powerful headless CMS that developers love."
- ❌ "Unlock the future of content creation."

**Body:** Write like README documentation. Direct, accurate, no filler.

---

## Dos and Don'ts

| Do                                                         | Don't                                              |
|------------------------------------------------------------|----------------------------------------------------|
| Use green for exactly one CTA per section                  | Use green decoratively on illustrations or icons   |
| Use `#052E16` (not white) as text on green buttons         | Introduce any chromatic neutral (warm or cool gray)|
| Let whitespace carry the atmosphere                        | Crowd elements — this palette needs room           |
| Show code blocks prominently on the marketing page         | Use Geist at different optical sizes without scale |
| Keep near-zero radius (`2px`) on all interactive elements  | Use border-radius beyond `8px` on non-pill items   |
| Accept that this theme competes directly with Payload       | Add a second accent color to "liven things up"     |
