# VexCMS Brand Guidelines — Vex Violet

## Identity Summary

**Name:** VexCMS  
**Tagline options:** "The Convex-native CMS." / "Real-time content. Type-safe by default." / "The CMS that thinks in types."  
**Tone:** Technical but approachable. Precise without being cold. The voice of a senior developer who has opinions, but explains them clearly.

---

## Color Palette

| Token            | Hex        | Usage                                          |
|------------------|------------|------------------------------------------------|
| Electric Violet  | `#6741D9`  | CTAs, active states, links, interactive focus  |
| Violet Light     | `#7B52E8`  | Hover states (light surfaces)                  |
| Violet Bright    | `#8B65F7`  | Dark mode primary (brighter on dark bg)        |
| Violet Dark      | `#4D29B0`  | Pressed states, strong emphasis                |
| Violet Tint      | `#EDE8FF`  | Badge bg, hover bg (light mode), subtle wash   |
| Surface 900      | `#0C0B14`  | Dark mode page background                      |
| Surface 800      | `#14112B`  | Dark raised section backgrounds                |
| Surface 700      | `#1E1C2E`  | Dark cards, modals, code blocks                |
| Surface 600      | `#2B2840`  | Dark mode borders and dividers                 |
| Ink Muted        | `#6E6B85`  | Secondary text, nav labels, metadata           |
| Ink Subtle       | `#9E9BB5`  | Placeholder text, disabled state text          |
| Border Light     | `#D4D2E0`  | Light mode borders                             |
| Surface 100      | `#F2F1F8`  | Light mode page background                     |
| Surface 50       | `#F9F8FD`  | Light mode card / popover background           |
| Success          | `#10B981`  | Live/connected status, published, success      |
| Warning          | `#F59E0B`  | Unsaved changes, advisory states               |
| Destructive      | `#EF4444`  | Errors, delete, denied permission              |

### WCAG Contrast Notes

- `#6741D9` on `#FFFFFF`: **~5.2:1** — passes AA
- `#FFFFFF` on `#6741D9`: **~5.2:1** — passes AA
- `#8B65F7` on `#0C0B14`: **~8.4:1** — passes AAA
- `#9E9BB5` on `#0C0B14`: **~6.1:1** — passes AA

---

## Typography

### Font Stack

| Role    | Font             | Fallback                          | Usage                                     |
|---------|------------------|-----------------------------------|-------------------------------------------|
| Display | Instrument Serif | Georgia, Times New Roman, serif   | Hero headlines on marketing site only     |
| Sans    | Geist            | Inter, system-ui, sans-serif      | All product text, headings, UI, body copy |
| Mono    | Geist Mono       | JetBrains Mono, monospace         | Code blocks, inline code, schema output   |

### Next.js Font Setup (layout.tsx)

```tsx
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});
```

### Type Scale

| Token       | Size    | Weight | Tracking  | Context                            |
|-------------|---------|--------|-----------|------------------------------------|
| display     | 4rem    | 400    | -0.03em   | Hero sections (marketing), serif   |
| h1          | 3rem    | 700    | -0.03em   | Page titles (marketing)            |
| h2          | 2.25rem | 700    | -0.025em  | Section headings                   |
| h3          | 1.875rem| 600    | -0.02em   | Sub-section headings               |
| h4          | 1.5rem  | 600    | -0.015em  | Card titles, admin panel headings  |
| body-lg     | 1.125rem| 400    | —         | Feature descriptions, intro copy   |
| body-md     | 1rem    | 400    | —         | Standard body, docs content        |
| body-sm     | 0.875rem| 400    | —         | Captions, UI labels, fine print    |
| label       | 0.75rem | 500    | +0.06em   | Form labels, table headers (UPPER) |
| code        | 0.875rem| 400    | —         | All code contexts                  |

---

## Logo Direction

**Wordmark:** "VexCMS" in Geist Bold. The "V" has geometric angularity — optionally stylized as a slight downward chevron that implies a reactive data flow (arrow down = data coming in). Color: `#6741D9` on light, white on dark.

**Icon variant:** A geometric "V" or downward chevron. Optionally: two overlapping V-shapes creating a subtle optical illusion of data streaming. Works at 16px favicon scale.

**Do not:** use gradients on the logo. Flat single-color only. Violet on white/dark, white on violet.

---

## Spacing & Layout

- Base unit: `4px`
- Component padding: `8px` / `16px` / `24px`
- Section vertical padding: `64px` (desktop) / `40px` (mobile)
- Max content width: `1280px`
- Admin sidebar width: `280px`
- Border radius base: `6px` (buttons, inputs), `10px` (cards), `9999px` (badges)

---

## Tone of Voice

**Headline style:** Short, declarative, developer-first. Never marketing-speak.
- ✅ "Real-time by default."
- ✅ "Your schema. Your types. Your rules."
- ❌ "Unlock the power of content management."
- ❌ "Supercharge your workflow."

**Body copy:** Write like a senior developer explaining a design decision. Precise, direct, uses technical terms accurately. Occasional dry humour is OK. Never hype.

**Code examples in marketing:** Real, working TypeScript. Not pseudocode. Not dumbed down. The target reader understands type inference.

---

## Dos and Don'ts

| Do                                                        | Don't                                            |
|-----------------------------------------------------------|--------------------------------------------------|
| Use `#6741D9` for the single CTA per section              | Use violet for decorative illustrations          |
| Geist 700 for all product headlines                       | Mix more than 3 font weights per page            |
| Emerald (`#10B981`) for live/connected status indicators  | Use Instrument Serif in the admin panel          |
| Dark backgrounds with `64px+` section padding             | Stack box-shadows in dark mode                   |
| Geist Mono for every code snippet                         | Introduce a second accent color                  |
| Use `oklch()` in all CSS for perceptual consistency       | Use Convex orange anywhere in VexCMS materials   |
