# VexCMS marketing site — developer handoff

Everything needed to build `/`, `/features`, and `/roadmap` in Next.js 16 +
Tailwind v4 + Base UI. Read `VexCMS-Design-Spec.html` first; the other files are
drop-in.

## Contents

| File | What it is | Where it goes |
| --- | --- | --- |
| `VexCMS-Design-Spec.html` | The full design specification — 21 sections, every block with a rendered specimen plus layout / type / token / state / empty+overflow rows, the three page compositions, build order, deviations. Self-contained; open in any browser. | reference only |
| `theme.stark-ember.json` | The theme document. 32 tokens × light and dark, oklch, plus `radius` and `fontFamily`. | load into the `themes` collection, no transformation |
| `globals.tokens.css` | Non-per-theme `@theme` tokens (motion, radius scale, shadow scale, section rhythm, code-pane palette), the entrance/pulse keyframes, reduced-motion stop, base layer. | paste into `src/app/globals.css` |
| `shiki.stark-ember.json` | Minimal shiki theme mapping the five code colours. | `shiki.getHighlighter({ themes: [starkEmber] })`, one server pass |

## Non-negotiables

1. **Semantic tokens only.** No hex, no `bg-zinc-*`. The one exception is the
   code pane, which uses the fixed `--color-code-*` tokens from
   `globals.tokens.css` and stays dark under a light theme.
2. **No motion library.** CSS keyframes only, all disabled under
   `prefers-reduced-motion: reduce`. Entrance animation is budgeted to the hero
   alone.
3. **No Radix.** Base UI + the primitives re-exported from `@vexcms/react`.
4. **No media required.** A freshly scaffolded project has an empty media
   library and must still look finished — `Split` with `media: "image"` and no
   image falls through to `media: "none"`.
5. **Content is CMS data.** Every element maps to a field. No bespoke per-page
   JSX, no rich text, no drafts or versioning claims.
6. **Grid guard for code panes:** `grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]`
   plus `min-w-0` on the pane columns, or long lines escape the frame instead of
   scrolling.

## Build order

1. Theme record + `globals.tokens.css`; verify a light/dark swap on a bare page.
2. Chrome — Header (sticky scroll state, mobile Sheet) + Footer.
3. Hero — `compact` first, then `full` with the install row.
4. CodeShowcase — shiki server pass, pane chrome, copy button, long-line
   scroll, tab mode. Produces the pane primitive Split reuses.
5. CTA, then Features. Home is shippable at the end of this step.
6. Stats, HowItWorks, FAQ.
7. Split — `code`, then `none`, then `image` with its fall-through.
8. Roadmap — statuses and grouping before the tab filter.
9. Seed, then four audits: light theme, reduced motion, keyboard-only
   (including the panes' scroll regions), empty media library.

## Content truth reminders

- Licence is **Apache-2.0**, never MIT (the design-system README is wrong on
  this point).
- Versioning, drafts, and live preview are **in progress** — never described as
  available. Rich text, `json`, `tabs`, hooks, scheduling, API keys, teams,
  TanStack Start, S3/R2, plugins, and the React testing suite are **planned**.
- No user counts, star counts, download figures, testimonials, or customer
  logos — and no empty slot where one could go.

## Two decisions to confirm

- **Roadmap renders In progress → Planned → Exploring → Shipped**, not
  Shipped-first: 15 shipped rows above the 2 rows people came for buries the
  news.
- **Dark-mode `primaryForeground` is near-black**, against the design system's
  "white on the primary button" rule: white on `oklch(68% 0.178 40)` is 2.6:1
  and fails AA. Near-black is 6.0:1.
