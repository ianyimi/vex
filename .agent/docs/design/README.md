# VexCMS — Design System Assets

This folder contains all design assets for VexCMS. It is structured for use with Claude Design — load any theme folder's `DESIGN.md` as the primary design system context.

## Folder Structure

```
.agent/docs/design/
  README.md                  ← this file
  claude-design/             ← Visual source of truth from Claude Design sessions
    README.md                ← READ FIRST. Token translation table + file guide.
    admin/                   ← Admin UI mockups (original session)
      vexcms-design.html     ← Canvas index
      admin.css              ← Visual reference only. Do NOT import.
      globals.css            ← Smaller Stark × Ember shadcn snapshot.
      *.jsx                  ← Admin component implementations
    www/                     ← Marketing site mockups (new session)
      index.html             ← Canvas index
      site.css               ← Visual reference only. Do NOT import.
      globals.css            ← Canonical Stark × Ember shadcn globals (Tailwind v4)
      pages.jsx              ← 6 marketing pages (Home, Features, Pricing, Roadmap, Docs, FAQ)
      components.jsx         ← Shared marketing components (Nav, Footer, Logo, CodeBlock, etc.)
      assets/                ← Static assets (favicon, logos, admin screenshots)
  theme-a-vex-violet/        ← Electric violet. Technical premium. (alt theme)
    DESIGN.md
    globals.css
    brand-guidelines.md
  theme-b-ember/             ← Warm amber-orange. Convex-native feel. (alt theme)
    DESIGN.md
    globals.css
    brand-guidelines.md
  theme-c-signal/            ← Teal/cyan. Real-time, reactive. (alt theme)
    DESIGN.md
    globals.css
    brand-guidelines.md
  theme-d-stark/             ← Near-black/white + electric lime pop. (alt theme)
    DESIGN.md
    globals.css
    brand-guidelines.md
```

**Active design — marketing site:** `www/` is the source of truth. It is the
2026-09-01 design-agent handoff against
`.agent/docs/specs/2026-09-01-www-content-spec/`, and it is normative for
`apps/www` and for `packages/create-vexcms/templates/marketing-site`.

```
www/
  design-spec.txt          ← READ FIRST. 21 sections, every block normative.
  VexCMS-Design-Spec.html  ← same content, rendered. JS-driven; use the .txt for tooling.
  theme.stark-ember.json   ← loads into the `themes` collection unchanged
  globals.tokens.css       ← the non-per-theme `@theme` block for globals.css
  shiki.stark-ember.json   ← 5-colour shiki theme for the code panes
  README.md                ← handoff notes, build order, two confirmed deviations
```

**Active design — admin UI:** `claude-design/admin/` remains the source of truth.

**Superseded:** `claude-design/www/` — an earlier exploration. Its mockups are
factually stale (they show a pricing page, "16 field types", and drafts/versions
as shipped) and must not be used for content. Retained only for
`claude-design/www/assets/` (logos, favicon, admin screenshots), which are still
live assets. The `theme-*/` folders are earlier palette explorations; the shipped
palette is `www/theme.stark-ember.json`.

> ⚠️ Claude Design's CSS files (`admin.css`, `site.css`) use **different token
> names** for the same concepts as the project's shadcn `globals.css`. Do not
> copy them into the project. See `claude-design/README.md` for the full
> translation table.

## How to use

1. Marketing site: read `www/design-spec.txt`. Section B is normative per block;
   section C is only the seed order.
2. Admin UI: reference `claude-design/admin/` JSX when porting screens.
3. The palette is a **database record**, not a stylesheet — load
   `www/theme.stark-ember.json` into the `themes` collection. Do not copy a
   `globals.css` over the app's; only `www/globals.tokens.css` (the non-per-theme
   `@theme` block) is pasted in.

## Competitor Color Map (for reference)

| Tool       | Primary Colors              | Notes                           |
|------------|-----------------------------|---------------------------------|
| Convex     | Orange #F97316, Warm amber  | The platform VexCMS runs on     |
| Payload    | Pure mono #000/#fff         | Direct CMS competitor           |
| Vercel     | Pure mono + blue (#2C8CE1)  | Deployment platform             |
| Stagehand  | Dark bg + neutral           | Dev tooling, dark-first         |
| Sanity     | Pink/coral accent           | CMS competitor                  |
| Contentful | Blue corporate              | Enterprise CMS                  |
| Linear     | Violet/purple               | Inspiration for precision feel  |

## Theme Quick-Reference

| Theme         | Primary        | Background (dark) | Vibe                        |
|---------------|----------------|-------------------|-----------------------------|
| A — Vex Violet | #6741D9       | #0C0B14           | Technical premium, editorial |
| B — Ember      | #E8622A       | #100C08           | Warm, Convex-adjacent        |
| C — Signal     | #0AACA0       | #060E0D           | Real-time data, reactive     |
| D — Stark      | #22C55E       | #0A0A0A           | Minimal, one bold pop        |

## Applying a Theme to `apps/www`

```bash
cp .agent/docs/design/claude-design/www/globals.css apps/www/src/app/globals.css
```

Then set the matching font in `apps/www/src/app/layout.tsx` per the font stack listed in that theme's `brand-guidelines.md`.
