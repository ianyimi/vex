# ✅ COMPLETED 2026-05-01

# Spec 23 — Design Tokens (Stark × Ember)

## Overview

Replaces the default shadcn palette in `apps/www` with the Stark × Ember design system
and updates the sidebar CSS variable defaults in `@vexcms/react` to match. After this
spec the admin panel renders with ember orange as the primary accent, sharp 4px radii,
graphite neutral surfaces, and Geist Sans as the only body font.

## Design Decisions

- **Tokens go in `apps/www/src/app/globals.css`** — this is already the root stylesheet
  for the whole app. No scoping class needed; Stark × Ember applies everywhere in the app.
- **`packages/react/styles.css` gets concrete defaults** — previously it aliased sidebar
  vars to `--background`/`--accent` etc. Those aliases now become explicit Stark × Ember
  values so a consumer who imports `@vexcms/react/styles` without their own globals.css
  gets sensible colours out of the box. Kept in `@layer base` so consumers can override
  with a plain `:root { }` rule in their own stylesheet.
- **No dark block in `packages/react/styles.css` previously** — adding one so dark mode
  sidebar defaults are correct for all consumers, not just `apps/www`.
- **Inter removed** — Geist Sans becomes `--font-sans` app-wide. Inter was never visible
  in the admin; removing it eliminates an extra font load.
- **`packages/next/styles.css` untouched** — it already exists and forwards to
  `@vexcms/react/styles`. No change needed.

## Out of Scope

- Any component visual changes — those are Week 1b–1g specs
- Dark-mode toggle UI
- Marketing site palette (no public-facing pages exist in the rebuild yet)

## Target File Changes

```
packages/react/styles.css          ← update sidebar defaults (light + dark)
apps/www/src/app/globals.css       ← replace :root, .dark, @theme inline, @layer base
apps/www/src/app/layout.tsx        ← remove Inter, Geist → --font-sans
```

## Implementation Order

> **Key:**
> - `[agent]` — Copy-paste ready; no logic to write
> - `[dev]` — Developer implements

| Step | Tag | Description |
|------|-----|-------------|
| 1 | `[agent]` | Update `packages/react/styles.css` — Stark × Ember sidebar defaults |
| 2 | `[agent]` | Replace `apps/www/src/app/globals.css` |
| 3 | `[agent]` | Update `apps/www/src/app/layout.tsx` — font variables |
| 4 | `[agent]` | Verification |

---

## Step 1 — Update `packages/react/styles.css`

- [ ] Replace the `@layer base` block with the version below
- [ ] Run `pnpm --filter @vexcms/react typecheck` — must pass

**`packages/react/styles.css`**

```css
/**
 * @vexcms/react styles
 *
 * Add to your app's global CSS:
 *   @import "@vexcms/react/styles";
 *
 * Or use @vexcms/next/styles which includes this automatically.
 *
 * All component styles use your app's CSS variables
 * (--background, --foreground, --primary, etc.) so colours stay
 * consistent with your own theme.
 *
 * Sidebar variable defaults use the Stark × Ember palette.
 * Override any variable in your own globals.css :root { } block —
 * unlayered :root declarations win over these @layer base defaults.
 */
@source "./dist/**/*.js";

/* ── Sidebar defaults — Stark × Ember ──────────────────────────────────────
   Light: near-white raised surface (#FAFAFA), ember primary accent.
   Dark:  near-black surface (#050505), hotter ember for contrast.
   ────────────────────────────────────────────────────────────────────────── */
@layer base {
  :root {
    --sidebar:                    oklch(98% 0 0);           /* #FAFAFA */
    --sidebar-foreground:         oklch(13.7% 0 0);
    --sidebar-border:             oklch(89% 0 0);
    --sidebar-ring:               oklch(68.5% 0.165 45);   /* ember */
    --sidebar-primary:            oklch(68.5% 0.165 45);   /* ember */
    --sidebar-primary-foreground: oklch(100% 0 0);
    --sidebar-accent:             oklch(94.5% 0 0);        /* hover bg */
    --sidebar-accent-foreground:  oklch(13.7% 0 0);
  }

  .dark {
    --sidebar:                    oklch(10.5% 0 0);         /* #050505 */
    --sidebar-foreground:         oklch(96.1% 0 0);
    --sidebar-border:             oklch(28% 0 0);
    --sidebar-ring:               oklch(72% 0.175 50);     /* hotter ember */
    --sidebar-primary:            oklch(72% 0.175 50);
    --sidebar-primary-foreground: oklch(13.7% 0 0);
    --sidebar-accent:             oklch(22.5% 0 0);
    --sidebar-accent-foreground:  oklch(96.1% 0 0);
  }
}
```

---

## Step 2 — Replace `apps/www/src/app/globals.css`

- [ ] Replace the entire file with the content below
- [ ] Run `pnpm dev:app` and open `http://localhost:3020` — page should still load without errors

Key changes from the previous file:
- `:root` — full Stark × Ember palette replaces the default shadcn blue-gray
- `.dark` — graphite dark surfaces, hotter ember
- `@theme inline` — radius scale changes from `calc(var(--radius) - Npx)` to pinned pixel values (`--radius-sm: 2px`, `--radius-md: 4px`). This matters because `--radius` is now `4px`, not `0.5rem`, so the old `calc()` expressions would produce `0px` and `2px` — wrong.
- `@layer base body` — adds `font-feature-settings` and `-webkit-font-smoothing` (was previously only in `antialiased` Tailwind class on `<body>`)

**`apps/www/src/app/globals.css`**

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "@vexcms/next/styles";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background:         var(--background);
  --color-foreground:         var(--foreground);
  --font-sans:                var(--font-sans);
  --font-mono:                var(--font-geist-mono);

  --color-sidebar:                    var(--sidebar);
  --color-sidebar-foreground:         var(--sidebar-foreground);
  --color-sidebar-primary:            var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent:             var(--sidebar-accent);
  --color-sidebar-accent-foreground:  var(--sidebar-accent-foreground);
  --color-sidebar-border:             var(--sidebar-border);
  --color-sidebar-ring:               var(--sidebar-ring);

  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  --color-ring:                   var(--ring);
  --color-input:                  var(--input);
  --color-border:                 var(--border);
  --color-destructive:            var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-accent-foreground:      var(--accent-foreground);
  --color-accent:                 var(--accent);
  --color-muted-foreground:       var(--muted-foreground);
  --color-muted:                  var(--muted);
  --color-secondary-foreground:   var(--secondary-foreground);
  --color-secondary:              var(--secondary);
  --color-primary-foreground:     var(--primary-foreground);
  --color-primary:                var(--primary);
  --color-popover-foreground:     var(--popover-foreground);
  --color-popover:                var(--popover);
  --color-card-foreground:        var(--card-foreground);
  --color-card:                   var(--card);

  /* Sharp radii — Vex is square. sm/md are pinned; lg+ scale from --radius. */
  --radius-sm:  2px;
  --radius-md:  4px;
  --radius-lg:  var(--radius);
  --radius-xl:  calc(var(--radius) + 2px);
  --radius-2xl: calc(var(--radius) + 6px);
  --radius-3xl: calc(var(--radius) + 10px);
  --radius-4xl: calc(var(--radius) + 14px);
}

/* ── Light — Stark × Ember ──────────────────────────────────────────────────
   page  #F5F5F5  ·  surface #FFFFFF  ·  fg #0A0A0A
   ember #E8622A (primary accent in light mode)
   ─────────────────────────────────────────────────────────────────────────── */
:root {
  --background:            oklch(96.1% 0 0);        /* #F5F5F5 */
  --foreground:            oklch(13.7% 0 0);        /* #0A0A0A */

  --card:                  oklch(100% 0 0);         /* #FFFFFF */
  --card-foreground:       oklch(13.7% 0 0);
  --popover:               oklch(100% 0 0);
  --popover-foreground:    oklch(13.7% 0 0);

  /* primary = graphite (text emphasis, default buttons); accent = ember (CTA) */
  --primary:               oklch(13.7% 0 0);
  --primary-foreground:    oklch(98% 0 0);

  --secondary:             oklch(96.9% 0 0);
  --secondary-foreground:  oklch(13.7% 0 0);

  --muted:                 oklch(96.9% 0 0);
  --muted-foreground:      oklch(45.7% 0 0);

  --accent:                oklch(68.5% 0.165 45);   /* ember #E8622A */
  --accent-foreground:     oklch(100% 0 0);

  --destructive:           oklch(57.7% 0.198 27);
  --destructive-foreground: oklch(98% 0 0);

  --border:                oklch(82% 0 0);
  --input:                 oklch(82% 0 0);
  --ring:                  oklch(68.5% 0.165 45);   /* ember focus ring */

  --radius: 4px;

  /* Sidebar — slightly raised vs page in light mode */
  --sidebar:                    oklch(98% 0 0);           /* #FAFAFA */
  --sidebar-foreground:         oklch(13.7% 0 0);
  --sidebar-primary:            oklch(68.5% 0.165 45);   /* ember */
  --sidebar-primary-foreground: oklch(100% 0 0);
  --sidebar-accent:             oklch(94.5% 0 0);        /* hover bg */
  --sidebar-accent-foreground:  oklch(13.7% 0 0);
  --sidebar-border:             oklch(89% 0 0);
  --sidebar-ring:               oklch(68.5% 0.165 45);

  /* Charts — ember-anchored series */
  --chart-1: oklch(68.5% 0.165 45);   /* ember */
  --chart-2: oklch(45% 0 0);          /* graphite */
  --chart-3: oklch(72% 0.10 60);      /* warm peach */
  --chart-4: oklch(60% 0.04 30);      /* dusty terracotta */
  --chart-5: oklch(78% 0 0);          /* light gray */
}

/* ── Dark — Stark × Ember dark ──────────────────────────────────────────────
   page  #0A0A0A  ·  surface #141414  ·  fg #F5F5F5
   ember slightly hotter for dark-mode contrast
   ─────────────────────────────────────────────────────────────────────────── */
.dark {
  --background:            oklch(13.7% 0 0);        /* #0A0A0A */
  --foreground:            oklch(96.1% 0 0);        /* #F5F5F5 */

  --card:                  oklch(17.4% 0 0);        /* #141414 */
  --card-foreground:       oklch(96.1% 0 0);
  --popover:               oklch(17.4% 0 0);
  --popover-foreground:    oklch(96.1% 0 0);

  --primary:               oklch(96.1% 0 0);
  --primary-foreground:    oklch(13.7% 0 0);

  --secondary:             oklch(22.5% 0 0);
  --secondary-foreground:  oklch(96.1% 0 0);

  --muted:                 oklch(22.5% 0 0);
  --muted-foreground:      oklch(63.9% 0 0);

  --accent:                oklch(72% 0.175 50);     /* hotter ember in dark */
  --accent-foreground:     oklch(13.7% 0 0);

  --destructive:           oklch(63% 0.21 27);
  --destructive-foreground: oklch(96.1% 0 0);

  --border:                oklch(34% 0 0);
  --input:                 oklch(34% 0 0);
  --ring:                  oklch(72% 0.175 50);

  --sidebar:                    oklch(10.5% 0 0);         /* #050505 */
  --sidebar-foreground:         oklch(96.1% 0 0);
  --sidebar-primary:            oklch(72% 0.175 50);
  --sidebar-primary-foreground: oklch(13.7% 0 0);
  --sidebar-accent:             oklch(22.5% 0 0);
  --sidebar-accent-foreground:  oklch(96.1% 0 0);
  --sidebar-border:             oklch(28% 0 0);
  --sidebar-ring:               oklch(72% 0.175 50);

  --chart-1: oklch(72% 0.175 50);
  --chart-2: oklch(78% 0 0);
  --chart-3: oklch(78% 0.12 65);
  --chart-4: oklch(60% 0.06 30);
  --chart-5: oklch(45% 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "ss01" 1, "cv11" 1;
    -webkit-font-smoothing: antialiased;
  }
}
```

---

## Step 3 — Update `apps/www/src/app/layout.tsx`

- [ ] Remove the `Inter` import and its font instance
- [ ] Change the `Geist` font variable from `"--font-geist-sans"` to `"--font-sans"`
- [ ] Update the `<html>` className to use `geistSans.variable` and `geistMono.variable` instead of `inter.variable`
- [ ] Remove `antialiased` from `<body>` className (now handled in `@layer base body` in `globals.css`)
- [ ] Run `pnpm --filter www typecheck` — must pass

**`apps/www/src/app/layout.tsx`**

```tsx
import type { Metadata } from "next"

import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"

import ClientProviders from "~/components/providers/client"
import ServerProviders from "~/components/providers/server"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  description: "Generated by create next app",
  icons: { icon: "/favicons/favicon.ico" },
  title: "Create Next App",
}

export default function RootLayout({
  auth,
  children,
}: Readonly<{
  auth: React.ReactNode
  children: React.ReactNode
}>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <ServerProviders>
          <ClientProviders>
            {children}
            {auth}
          </ClientProviders>
        </ServerProviders>
      </body>
    </html>
  )
}
```

---

## Verification

- [ ] `pnpm --filter @vexcms/react typecheck` — passes (styles.css is not TypeScript but check nothing regressed in TS files)
- [ ] `pnpm --filter www typecheck` — passes (layout.tsx changes are type-clean)
- [ ] `pnpm dev:app` — app starts without errors
- [ ] Open `http://localhost:3020/admin` in browser and confirm:

| Check | Expected |
|-------|---------|
| Page background | Warm neutral gray `#F5F5F5`, not white |
| Sidebar background | Slightly lighter `#FAFAFA`, distinct from page |
| Primary buttons | Near-black graphite background — not blue |
| Body font | Geist Sans — clean geometric sans, not Inter |
| Border radius on inputs/cards | Sharp — visually square corners, not rounded |
| Focus ring | Ember orange glow, not a blue ring |
| Dark mode toggle (if accessible) | Page goes to `#0A0A0A` graphite, ember accent stays warm |

## Success Criteria

- [ ] `--radius` resolves to `4px` (inspect in DevTools > Computed)
- [ ] `--accent` in light mode is `oklch(68.5% 0.165 45)` — ember orange
- [ ] `--font-sans` resolves to the Geist Sans font family
- [ ] No `Inter` network request in DevTools > Network (font tab)
- [ ] `packages/react/styles.css` dark sidebar vars present and correct
- [ ] `pnpm typecheck` passes across workspace
