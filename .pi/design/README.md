# VexCMS — Design System Assets

This folder contains all design assets for VexCMS. It is structured for use with Claude Design — load any theme folder's `DESIGN.md` as the primary design system context.

## Folder Structure

```
.pi/design/
  README.md                  ← this file
  theme-a-vex-violet/        ← Electric violet. Technical premium.
    DESIGN.md
    globals.css
    brand-guidelines.md
  theme-b-ember/             ← Warm amber-orange. Convex-native feel.
    DESIGN.md
    globals.css
    brand-guidelines.md
  theme-c-signal/            ← Teal/cyan. Real-time, reactive.
    DESIGN.md
    globals.css
    brand-guidelines.md
  theme-d-stark/             ← Near-black/white + electric lime pop.
    DESIGN.md
    globals.css
    brand-guidelines.md
```

## How to use with Claude Design

1. Upload the chosen theme's `DESIGN.md` as your design system file during onboarding
2. Reference `brand-guidelines.md` for copywriting tone, logo direction, and usage rules
3. When a theme is selected, copy its `globals.css` to `apps/www/src/app/globals.css`

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
cp .pi/design/theme-a-vex-violet/globals.css apps/www/src/app/globals.css
```

Then set the matching font in `apps/www/src/app/layout.tsx` per the font stack listed in that theme's `brand-guidelines.md`.
