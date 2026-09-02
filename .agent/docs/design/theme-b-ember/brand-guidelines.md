# VexCMS Brand Guidelines — Ember

## Identity Summary

**Name:** VexCMS  
**Tagline options:** "Built on Convex. Built for content." / "The warm side of type safety." / "Content infrastructure, forged for real-time."  
**Tone:** Authoritative and warm. The voice of someone who has shipped a lot and knows what matters. Not a startup, not an enterprise — a craftsperson's tool.

---

## Color Palette

| Token            | Hex        | Usage                                              |
|------------------|------------|----------------------------------------------------|
| Ember Orange     | `#E8622A`  | CTAs, active states, links, key highlights         |
| Orange Light     | `#F07040`  | Hover states, dark mode primary                    |
| Orange Dark      | `#C04E1E`  | Pressed states, strong emphasis, light mode badges |
| Orange Tint      | `#FEF0E8`  | Badge bg, hover bg (light mode), subtle wash       |
| Surface 900      | `#100C08`  | Dark mode page background (warm near-black)        |
| Surface 800      | `#1C1510`  | Dark raised sections                               |
| Surface 700      | `#271E16`  | Dark cards, modals, code blocks                    |
| Surface 600      | `#362A1F`  | Dark mode borders and dividers                     |
| Ink Muted        | `#7A6A5C`  | Secondary text, nav labels, timestamps             |
| Ink Subtle       | `#A8968A`  | Placeholder text, disabled states                  |
| Border Light     | `#E0D5CB`  | Light mode borders (warm tint)                     |
| Surface 100      | `#FAF6F2`  | Light mode page background (warm off-white)        |
| Surface 50       | `#FFFCFA`  | Light mode card / popover background               |
| Success          | `#16A34A`  | Published, connected, healthy state                |
| Warning          | `#CA8A04`  | Unsaved, advisory — deep gold (not amber, distinct)|
| Destructive      | `#DC2626`  | Errors, delete, denied                             |

### WCAG Contrast Notes

- `#E8622A` on `#FFFFFF`: **~3.7:1** — borderline AA, use only at large text sizes on white
- `#E8622A` on `#FAF6F2`: **~3.5:1** — use at `18px+` or bold
- `#F07040` on `#100C08`: **~7.2:1** — passes AAA
- `#FFFFFF` on `#E8622A`: **~3.7:1** — passes AA for large text; prefer on dark surfaces

> **Note:** Orange has inherently lower contrast on white than violet or teal. Compensate by using the orange primarily on dark surfaces or as background (not foreground text on white).

---

## Typography

### Font Stack

| Role    | Font           | Fallback                      | Usage                                     |
|---------|----------------|-------------------------------|-------------------------------------------|
| Sans    | Space Grotesk  | Inter, system-ui, sans-serif  | Headings, nav, UI labels, marketing copy  |
| Body    | Inter          | system-ui, sans-serif         | All body text, docs content               |
| Mono    | JetBrains Mono | Geist Mono, monospace         | Code blocks, inline code, schema output   |

### Next.js Font Setup (layout.tsx)

```tsx
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
```

> Apply `--font-body` for `body-md` and `body-sm` contexts, `--font-sans` for headings.

### Type Scale

| Token       | Size    | Weight | Tracking  | Context                            |
|-------------|---------|--------|-----------|------------------------------------|
| display     | 4rem    | 700    | -0.04em   | Hero sections (marketing)          |
| h1          | 3rem    | 700    | -0.035em  | Page titles                        |
| h2          | 2.25rem | 700    | -0.025em  | Section headings                   |
| h3          | 1.875rem| 600    | -0.02em   | Sub-section headings               |
| h4          | 1.5rem  | 600    | -0.015em  | Card titles, admin headings        |
| body-lg     | 1.125rem| 400    | —         | Feature descriptions               |
| body-md     | 1rem    | 400    | —         | Standard body, docs                |
| body-sm     | 0.875rem| 400    | —         | Captions, labels, fine print       |
| label       | 0.75rem | 500    | +0.06em   | Form labels (uppercase caps)       |
| code        | 0.875rem| 400    | —         | All code contexts                  |

---

## Logo Direction

**Wordmark:** "VexCMS" in Space Grotesk Bold. The letterforms of Space Grotesk have strong geometric "G" and "V" shapes that lend themselves to an iconic treatment. Color: Ember Orange `#E8622A` on light, `#F07040` on dark, white on orange.

**Icon variant:** The "V" from Space Grotesk Bold, or a geometric ember/spark — a three-point flame or minimal fire glyph that reads at small sizes. Avoid literal fire imagery — keep it abstract.

**Don't:** use photographic textures, gradients, or coal/fire photography in logo contexts.

---

## Spacing & Layout

- Base unit: `4px`
- Component padding: `8px` / `16px` / `24px`
- Section vertical padding: `72px` (desktop) / `48px` (mobile) — warm dark needs more air
- Max content width: `1280px`
- Admin sidebar width: `280px`
- Border radius base: `4px` (buttons, inputs), `8px` (cards), `9999px` (badges only)

---

## Tone of Voice

**Headline style:** Deliberate. Minimal adjectives. Lets the technical fact speak.
- ✅ "Convex-native. Real-time by default."
- ✅ "Define your schema once. Get types everywhere."
- ❌ "The CMS that empowers teams to do more."
- ❌ "Revolutionize your content workflow."

**Code examples:** Always real TypeScript. Show Convex queries, field definitions, type inference. Make developers feel seen.

---

## Relationship with Convex

VexCMS Ember deliberately echoes Convex's warm palette to signal: *this is the CMS for Convex apps.* But it is not Convex. The orange is darker, more editorial. The surfaces are deeper. The type is heavier.

**Rule:** Never use Convex's exact brand colors (`#F97316`, `#FBBF24`) in VexCMS materials. The kinship should be felt through family resemblance, not direct borrowing.

---

## Dos and Don'ts

| Do                                                         | Don't                                              |
|------------------------------------------------------------|----------------------------------------------------|
| Use Ember Orange primarily on dark or white backgrounds    | Use orange text on the warm-light surface-100 bg   |
| Apply `700` weight Space Grotesk to all headings           | Use Inter for headings — it's body-only here       |
| Keep all neutrals warm-tinted                             | Introduce cool-gray elements anywhere              |
| Use `#CA8A04` for warning to distinguish from primary      | Use amber warning near the orange primary          |
| Use forest green (`#16A34A`) for published/success states  | Overuse the primary on decorative elements         |
| Sharp `4px` radius on buttons and inputs                   | Round corners on cards beyond `8px`               |
