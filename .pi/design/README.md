# VexCMS — Design System Assets

This folder contains all design assets for VexCMS. It is structured for use with Claude Design — load any theme folder's `DESIGN.md` as the primary design system context.

## Folder Structure

```
.pi/design/
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

**Active design:** `claude-design/` is the current source of truth for both
the admin UI and the marketing site visuals. The `theme-*/` folders are
alternative palette options from an earlier exploration; keep them for
reference but the live `apps/www/src/app/globals.css` is built off
`claude-design/www/globals.css` (Stark × Ember).

> ⚠️ Claude Design's CSS files (`admin.css`, `site.css`) use **different token
> names** for the same concepts as the project's shadcn `globals.css`. Do not
> copy them into the project. See `claude-design/README.md` for the full
> translation table.

## How to use with Claude Design

1. Read `claude-design/README.md` first — it has the token translation table and file guide.
2. For admin UI: reference `claude-design/admin/` JSX files when porting screens to React.
3. For marketing site: reference `claude-design/www/` JSX files and `site.css` for visual specs.
4. When a theme is selected, copy its `globals.css` to `apps/www/src/app/globals.css`.

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
cp .pi/design/claude-design/www/globals.css apps/www/src/app/globals.css
```

Then set the matching font in `apps/www/src/app/layout.tsx` per the font stack listed in that theme's `brand-guidelines.md`.
