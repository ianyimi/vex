import { getGlobal, upsertGlobal } from "@vexcms/core/server"

import {
  GLOBAL_SLUG_SITE_SETTINGS,
  TABLE_SLUG_FOOTERS,
  TABLE_SLUG_HEADERS,
  TABLE_SLUG_PAGES,
  TABLE_SLUG_THEMES,
} from "~/db/constants"
import config from "~/vex.config"
import {
  BLOCK_SLUG_CODE_SHOWCASE,
  BLOCK_SLUG_CTA,
  BLOCK_SLUG_FAQ,
  BLOCK_SLUG_FEATURES,
  BLOCK_SLUG_HOW_IT_WORKS,
  BLOCK_SLUG_ROADMAP,
  BLOCK_SLUG_STATS,
} from "~/vexcms/blocks/constants"

import { internalMutation } from "./_generated/server"

/**
 * The 4 tweakcn theme presets, lifted verbatim from
 * `apps/test/convex/seed.ts`'s `THEME_PRESETS` (32-token light/dark palettes
 * matching `themeColors.ts`'s `ThemeColorTokenKey` set).
 */
const THEME_PRESETS = [
  {
    name: "Stark × Ember",
    fontFamily: "Geist, Inter, system-ui, sans-serif",
    radius: "4px",
    light: {
      background: "oklch(96.1% 0 0)",
      foreground: "oklch(13.7% 0 0)",
      card: "oklch(100% 0 0)",
      cardForeground: "oklch(13.7% 0 0)",
      popover: "oklch(100% 0 0)",
      popoverForeground: "oklch(13.7% 0 0)",
      primary: "oklch(60.5% 0.175 42)",
      primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(98% 0 0)",
      secondaryForeground: "oklch(13.7% 0 0)",
      muted: "oklch(98% 0 0)",
      mutedForeground: "oklch(50.5% 0 0)",
      accent: "oklch(96% 0.025 42)",
      accentForeground: "oklch(52% 0.180 40)",
      destructive: "oklch(57.7% 0.198 27)",
      destructiveForeground: "oklch(98% 0 0)",
      border: "oklch(85% 0 0)",
      input: "oklch(54.6% 0 0)",
      ring: "oklch(60.5% 0.175 42)",
      chart1: "oklch(60.5% 0.175 42)",
      chart2: "oklch(45% 0 0)",
      chart3: "oklch(72% 0.100 60)",
      chart4: "oklch(60% 0.040 30)",
      chart5: "oklch(78% 0 0)",
      sidebar: "oklch(98% 0 0)",
      sidebarForeground: "oklch(13.7% 0 0)",
      sidebarPrimary: "oklch(60.5% 0.175 42)",
      sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(96.1% 0 0)",
      sidebarAccentForeground: "oklch(13.7% 0 0)",
      sidebarBorder: "oklch(85% 0 0)",
      sidebarRing: "oklch(60.5% 0.175 42)",
    },
    dark: {
      background: "oklch(13.7% 0 0)",
      foreground: "oklch(95% 0 0)",
      card: "oklch(17.4% 0 0)",
      cardForeground: "oklch(95% 0 0)",
      popover: "oklch(17.4% 0 0)",
      popoverForeground: "oklch(95% 0 0)",
      primary: "oklch(72% 0.175 50)",
      primaryForeground: "oklch(13.7% 0 0)",
      secondary: "oklch(20% 0 0)",
      secondaryForeground: "oklch(95% 0 0)",
      muted: "oklch(20% 0 0)",
      mutedForeground: "oklch(70% 0 0)",
      accent: "oklch(72% 0.175 50 / 0.12)",
      accentForeground: "oklch(72% 0.175 50)",
      destructive: "oklch(63% 0.210 27)",
      destructiveForeground: "oklch(95% 0 0)",
      border: "oklch(25% 0 0)",
      input: "oklch(40% 0 0)",
      ring: "oklch(72% 0.175 50)",
      chart1: "oklch(72% 0.175 50)",
      chart2: "oklch(78% 0 0)",
      chart3: "oklch(78% 0.120 65)",
      chart4: "oklch(60% 0.060 30)",
      chart5: "oklch(45% 0 0)",
      sidebar: "oklch(7% 0 0)",
      sidebarForeground: "oklch(95% 0 0)",
      sidebarPrimary: "oklch(72% 0.175 50)",
      sidebarPrimaryForeground: "oklch(13.7% 0 0)",
      sidebarAccent: "oklch(20% 0 0)",
      sidebarAccentForeground: "oklch(95% 0 0)",
      sidebarBorder: "oklch(25% 0 0)",
      sidebarRing: "oklch(72% 0.175 50)",
    },
  },
  {
    name: "Modern Minimal",
    fontFamily: "Inter, sans-serif",
    radius: "0.375rem",
    light: {
      background: "oklch(100% 0 0)",
      foreground: "oklch(32.11% 0 0)",
      card: "oklch(100% 0 0)",
      cardForeground: "oklch(32.11% 0 0)",
      popover: "oklch(100% 0 0)",
      popoverForeground: "oklch(32.11% 0 0)",
      primary: "oklch(62.31% 0.18801 259.81)",
      primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(96.7% 0.00287 264.54)",
      secondaryForeground: "oklch(44.61% 0.02631 256.8)",
      muted: "oklch(98.46% 0.00171 247.84)",
      mutedForeground: "oklch(55.1% 0.02336 264.36)",
      accent: "oklch(95.14% 0.02503 236.82)",
      accentForeground: "oklch(37.91% 0.13776 265.52)",
      destructive: "oklch(63.68% 0.20785 25.33)",
      destructiveForeground: "oklch(100% 0 0)",
      border: "oklch(92.76% 0.00581 264.53)",
      input: "oklch(92.76% 0.00581 264.53)",
      ring: "oklch(62.31% 0.18801 259.81)",
      chart1: "oklch(62.31% 0.18801 259.81)",
      chart2: "oklch(54.61% 0.21521 262.88)",
      chart3: "oklch(48.82% 0.21717 264.38)",
      chart4: "oklch(42.44% 0.18087 265.64)",
      chart5: "oklch(37.91% 0.13776 265.52)",
      sidebar: "oklch(98.46% 0.00171 247.84)",
      sidebarForeground: "oklch(32.11% 0 0)",
      sidebarPrimary: "oklch(62.31% 0.18801 259.81)",
      sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(95.14% 0.02503 236.82)",
      sidebarAccentForeground: "oklch(37.91% 0.13776 265.52)",
      sidebarBorder: "oklch(92.76% 0.00581 264.53)",
      sidebarRing: "oklch(62.31% 0.18801 259.81)",
    },
    dark: {
      background: "oklch(20.46% 0 0)",
      foreground: "oklch(92.19% 0 0)",
      card: "oklch(26.86% 0 0)",
      cardForeground: "oklch(92.19% 0 0)",
      popover: "oklch(26.86% 0 0)",
      popoverForeground: "oklch(92.19% 0 0)",
      primary: "oklch(62.31% 0.18801 259.81)",
      primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(26.86% 0 0)",
      secondaryForeground: "oklch(92.19% 0 0)",
      muted: "oklch(23.93% 0 0)",
      mutedForeground: "oklch(71.55% 0 0)",
      accent: "oklch(37.91% 0.13776 265.52)",
      accentForeground: "oklch(88.23% 0.05706 254.13)",
      destructive: "oklch(63.68% 0.20785 25.33)",
      destructiveForeground: "oklch(100% 0 0)",
      border: "oklch(37.15% 0 0)",
      input: "oklch(37.15% 0 0)",
      ring: "oklch(62.31% 0.18801 259.81)",
      chart1: "oklch(71.37% 0.14338 254.62)",
      chart2: "oklch(62.31% 0.18801 259.81)",
      chart3: "oklch(54.61% 0.21521 262.88)",
      chart4: "oklch(48.82% 0.21717 264.38)",
      chart5: "oklch(42.44% 0.18087 265.64)",
      sidebar: "oklch(20.46% 0 0)",
      sidebarForeground: "oklch(92.19% 0 0)",
      sidebarPrimary: "oklch(62.31% 0.18801 259.81)",
      sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(37.91% 0.13776 265.52)",
      sidebarAccentForeground: "oklch(88.23% 0.05706 254.13)",
      sidebarBorder: "oklch(37.15% 0 0)",
      sidebarRing: "oklch(62.31% 0.18801 259.81)",
    },
  },
  {
    name: "Violet Bloom",
    fontFamily: "Plus Jakarta Sans, sans-serif",
    radius: "1.4rem",
    light: {
      background: "oklch(99.4% 0 0)",
      foreground: "oklch(0% 0 0)",
      card: "oklch(99.4% 0 0)",
      cardForeground: "oklch(0% 0 0)",
      popover: "oklch(99.11% 0 0)",
      popoverForeground: "oklch(0% 0 0)",
      primary: "oklch(53.93% 0.27129 286.75)",
      primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(95.4% 0.00626 255.48)",
      secondaryForeground: "oklch(13.44% 0 0)",
      muted: "oklch(97.02% 0 0)",
      mutedForeground: "oklch(43.86% 0 0)",
      accent: "oklch(93.93% 0.02876 266.37)",
      accentForeground: "oklch(54.45% 0.19034 259.48)",
      destructive: "oklch(62.9% 0.19024 23.07)",
      destructiveForeground: "oklch(100% 0 0)",
      border: "oklch(93% 0.00939 286.22)",
      input: "oklch(94.01% 0 0)",
      ring: "oklch(0% 0 0)",
      chart1: "oklch(74.59% 0.14834 156.45)",
      chart2: "oklch(53.93% 0.27129 286.75)",
      chart3: "oklch(73.36% 0.17578 50.55)",
      chart4: "oklch(58.28% 0.18094 259.73)",
      chart5: "oklch(55.9% 0 0)",
      sidebar: "oklch(97.77% 0.00513 247.88)",
      sidebarForeground: "oklch(0% 0 0)",
      sidebarPrimary: "oklch(0% 0 0)",
      sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(94.01% 0 0)",
      sidebarAccentForeground: "oklch(0% 0 0)",
      sidebarBorder: "oklch(94.01% 0 0)",
      sidebarRing: "oklch(0% 0 0)",
    },
    dark: {
      background: "oklch(22.23% 0.00601 271.14)",
      foreground: "oklch(95.51% 0 0)",
      card: "oklch(25.68% 0.00762 274.65)",
      cardForeground: "oklch(95.51% 0 0)",
      popover: "oklch(25.68% 0.00762 274.65)",
      popoverForeground: "oklch(95.51% 0 0)",
      primary: "oklch(61.32% 0.22941 291.74)",
      primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(29.4% 0.01301 272.93)",
      secondaryForeground: "oklch(95.51% 0 0)",
      muted: "oklch(29.4% 0.01301 272.93)",
      mutedForeground: "oklch(70.58% 0 0)",
      accent: "oklch(27.95% 0.03685 260.03)",
      accentForeground: "oklch(78.57% 0.11535 246.66)",
      destructive: "oklch(71.06% 0.16615 22.22)",
      destructiveForeground: "oklch(100% 0 0)",
      border: "oklch(32.89% 0.00922 268.38)",
      input: "oklch(32.89% 0.00922 268.38)",
      ring: "oklch(61.32% 0.22941 291.74)",
      chart1: "oklch(80.03% 0.18206 151.71)",
      chart2: "oklch(61.32% 0.22941 291.74)",
      chart3: "oklch(80.77% 0.10349 19.57)",
      chart4: "oklch(66.91% 0.15686 260.11)",
      chart5: "oklch(70.58% 0 0)",
      sidebar: "oklch(20.11% 0.00394 286.04)",
      sidebarForeground: "oklch(95.51% 0 0)",
      sidebarPrimary: "oklch(61.32% 0.22941 291.74)",
      sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(29.4% 0.01301 272.93)",
      sidebarAccentForeground: "oklch(61.32% 0.22941 291.74)",
      sidebarBorder: "oklch(32.89% 0.00922 268.38)",
      sidebarRing: "oklch(61.32% 0.22941 291.74)",
    },
  },
  {
    name: "T3 Chat",
    fontFamily: "Geist, Inter, system-ui, sans-serif",
    radius: "0.5rem",
    light: {
      background: "oklch(97.54% 0.00844 325.64)",
      foreground: "oklch(32.57% 0.11612 325.04)",
      card: "oklch(97.54% 0.00844 325.64)",
      cardForeground: "oklch(32.57% 0.11612 325.04)",
      popover: "oklch(100% 0 0)",
      popoverForeground: "oklch(32.57% 0.11612 325.04)",
      primary: "oklch(53.16% 0.14089 355.2)",
      primaryForeground: "oklch(100% 0 0)",
      secondary: "oklch(86.96% 0.06751 334.9)",
      secondaryForeground: "oklch(44.48% 0.13406 324.8)",
      muted: "oklch(93.95% 0.02604 331.55)",
      mutedForeground: "oklch(49.24% 0.12445 324.45)",
      accent: "oklch(86.96% 0.06751 334.9)",
      accentForeground: "oklch(44.48% 0.13406 324.8)",
      destructive: "oklch(52.48% 0.13678 20.83)",
      destructiveForeground: "oklch(100% 0 0)",
      border: "oklch(85.68% 0.08288 328.91)",
      input: "oklch(85.17% 0.05582 336.6)",
      ring: "oklch(59.16% 0.21798 0.58)",
      chart1: "oklch(60.38% 0.23628 344.47)",
      chart2: "oklch(44.45% 0.22507 300.62)",
      chart3: "oklch(37.9% 0.04376 226.15)",
      chart4: "oklch(83.3% 0.11852 88.35)",
      chart5: "oklch(78.43% 0.12563 59)",
      sidebar: "oklch(93.6% 0.02881 320.58)",
      sidebarForeground: "oklch(49.48% 0.19094 354.54)",
      sidebarPrimary: "oklch(39.63% 0.02513 285.2)",
      sidebarPrimaryForeground: "oklch(96.68% 0.01243 337.52)",
      sidebarAccent: "oklch(97.89% 0.00132 106.42)",
      sidebarAccentForeground: "oklch(39.63% 0.02513 285.2)",
      sidebarBorder: "oklch(93.83% 0.00255 48.72)",
      sidebarRing: "oklch(59.16% 0.21798 0.58)",
    },
    dark: {
      background: "oklch(24.09% 0.0201 307.53)",
      foreground: "oklch(83.98% 0.03874 309.54)",
      card: "oklch(28.03% 0.02323 307.54)",
      cardForeground: "oklch(84.56% 0.03016 341.46)",
      popover: "oklch(15.48% 0.01316 338.9)",
      popoverForeground: "oklch(96.47% 0.00914 341.8)",
      primary: "oklch(46.07% 0.18535 4.1)",
      primaryForeground: "oklch(85.6% 0.06185 346.37)",
      secondary: "oklch(31.37% 0.03057 310.06)",
      secondaryForeground: "oklch(84.83% 0.03825 307.96)",
      muted: "oklch(26.34% 0.02189 309.47)",
      mutedForeground: "oklch(79.4% 0.0372 307.1)",
      accent: "oklch(36.49% 0.05079 308.49)",
      accentForeground: "oklch(96.47% 0.00914 341.8)",
      destructive: "oklch(22.58% 0.05243 12.61)",
      destructiveForeground: "oklch(100% 0 0)",
      border: "oklch(32.86% 0.01535 343.45)",
      input: "oklch(33.87% 0.0195 332.83)",
      ring: "oklch(59.16% 0.21798 0.58)",
      chart1: "oklch(53.16% 0.14089 355.2)",
      chart2: "oklch(56.33% 0.19123 306.86)",
      chart3: "oklch(72.27% 0.1502 60.58)",
      chart4: "oklch(61.93% 0.20294 312.74)",
      chart5: "oklch(61.18% 0.2093 6.14)",
      sidebar: "oklch(18.93% 0.01632 331.05)",
      sidebarForeground: "oklch(86.07% 0.02927 343.66)",
      sidebarPrimary: "oklch(48.82% 0.21717 264.38)",
      sidebarPrimaryForeground: "oklch(100% 0 0)",
      sidebarAccent: "oklch(23.37% 0.02608 338.2)",
      sidebarAccentForeground: "oklch(96.74% 0.00133 286.38)",
      sidebarBorder: "oklch(0% 0 0)",
      sidebarRing: "oklch(59.16% 0.21798 0.58)",
    },
  },
]

/**
 * Initialize a fresh scaffold with a complete marketing site: the 4 theme
 * presets ("Stark × Ember" active by default), site settings, a header, a
 * footer, and a fully assembled home page built from every block's shipped
 * defaults.
 *
 * Safe to run repeatedly — every insert is guarded by an existence check
 * keyed on a natural identifier (theme/header/footer name, page slug, or the
 * `siteSettings` singleton), so re-running after hand-edits in the admin
 * panel never duplicates or clobbers them.
 *
 * Run from terminal: `npx convex run seed:init`
 */
export const init = internalMutation({
  args: {},
  handler: async (ctx) => {
    const created: string[] = []
    const skipped: string[] = []

    let activeThemeId: null | string = null
    for (const preset of THEME_PRESETS) {
      const existing = await ctx.db
        .query(TABLE_SLUG_THEMES)
        .withIndex("by_name", (q) => q.eq("name", preset.name))
        .first()
      if (existing) {
        skipped.push(`theme:${preset.name}`)
        if (preset.name === "Stark × Ember") {activeThemeId = existing._id}
        continue
      }
      const id = await ctx.db.insert(TABLE_SLUG_THEMES, preset)
      created.push(`theme:${preset.name}`)
      if (preset.name === "Stark × Ember") {activeThemeId = id}
    }

    const existingSettings = await getGlobal({
      ctx,
      config,
      slug: GLOBAL_SLUG_SITE_SETTINGS,
      access: { bypass: true },
    })
    if (existingSettings) {
      skipped.push("siteSettings")
    } else {
      await upsertGlobal({
        ctx,
        config,
        slug: GLOBAL_SLUG_SITE_SETTINGS,
        data: {
          name: "VexCMS",
          description: "A headless CMS built natively on Convex.",
          activeTheme: activeThemeId ? [activeThemeId] : [],
        },
        access: { bypass: true },
      })
      created.push("siteSettings")
    }

    const existingHeader = await ctx.db
      .query(TABLE_SLUG_HEADERS)
      .withIndex("by_name", (q) => q.eq("name", "Main Header"))
      .first()
    if (existingHeader) {
      skipped.push("header")
    } else {
      await ctx.db.insert(TABLE_SLUG_HEADERS, {
        name: "Main Header",
        content: [
          {
            blockType: "header",
            blockName: "Site Header",
            id: "main-header",
            logoText: "VexCMS",
            logoHref: "/",
            menuItems: [
              { label: "Features", href: "/features" },
              { label: "Roadmap", href: "/roadmap" },
              { label: "Docs", href: "https://docs.vexcms.dev" },
              { label: "Admin demo", href: "/admin" },
            ],
            actionButtons: [
              { label: "GitHub", href: "https://github.com/ianyimi/vex", variant: ["ghost"] },
              { label: "Get started", href: "https://docs.vexcms.dev/guides/quickstart/", variant: ["default"] },
            ],
          },
        ],
      })
      created.push("header")
    }

    const existingFooter = await ctx.db
      .query(TABLE_SLUG_FOOTERS)
      .withIndex("by_name", (q) => q.eq("name", "Main Footer"))
      .first()
    if (existingFooter) {
      skipped.push("footer")
    } else {
      await ctx.db.insert(TABLE_SLUG_FOOTERS, {
        name: "Main Footer",
        content: [
          {
            blockType: "footer",
            blockName: "Site Footer",
            id: "main-footer",
            logoText: "VexCMS",
            copyright: "VexCMS. Apache-2.0 licensed.",
            links: [
              { label: "Features", href: "/features" },
              { label: "Roadmap", href: "/roadmap" },
              { label: "Docs", href: "https://docs.vexcms.dev" },
              { label: "Quickstart", href: "https://docs.vexcms.dev/guides/quickstart/" },
              { label: "Admin demo", href: "/admin" },
              { label: "npm", href: "https://www.npmjs.com/package/@vexcms/core" },
              { label: "Licence", href: "https://github.com/ianyimi/vex/blob/master/LICENSE" },
              { label: "Convex", href: "https://convex.dev" },
            ],
            socialLinks: [{ platform: "GitHub", href: "https://github.com/ianyimi/vex", icon: "Github" }],
          },
        ],
      })
      created.push("footer")
    }

    const existingHome = await ctx.db
      .query(TABLE_SLUG_PAGES)
      .withIndex("by_slug", (q) => q.eq("slug", "home"))
      .first()
    if (existingHome) {
      skipped.push("page:home")
    } else {
      await ctx.db.insert(TABLE_SLUG_PAGES, {
        title: "Home",
        slug: "home",
        blocks: [
          {
            blockType: "hero",
            blockName: "Hero",
            id: "home-hero",
            variant: ["full"],
            installCommand: "pnpm create vexcms@latest",
            badgeText: "v0.1.0-alpha — now on npm",
            badgeLink: "https://www.npmjs.com/package/@vexcms/core",
            heading: "The CMS that thinks in types.",
            subheading:
              "A headless CMS built natively on Convex. Declare your collections in TypeScript and Vex generates the Convex schema, the types, and the queries — no translation layer. Every edit reaches every subscriber in milliseconds.",
            primaryCtaLabel: "Read the docs",
            primaryCtaHref: "https://docs.vexcms.dev/guides/quickstart/",
            secondaryCtaLabel: "View on GitHub",
            secondaryCtaHref: "https://github.com/ianyimi/vex",
          },
          {
            blockType: BLOCK_SLUG_STATS,
            blockName: "Stats",
            id: "home-stats",
            items: [
              {
                value: "12",
                label: "field types",
                description:
                  "text, url, number, checkbox, select, date, color, upload, relationship, group, array, blocks",
              },
              {
                value: "8",
                label: "published packages",
                description:
                  "core, react, next, cli, better-auth, file-storage-convex, richtext-plate, create-vexcms",
              },
              {
                value: "0",
                label: "database config",
                description: "Convex is the database. There is no connection string",
              },
              {
                value: "1",
                label: "command to start",
                description:
                  "pnpm create vexcms@latest scaffolds Next.js, Convex, auth, and the admin panel",
              },
            ],
          },
          {
            blockType: "features",
            blockName: "Features",
            id: "home-features",
            heading: "Everything comes from one schema.",
            subheading:
              "Collections, the Convex tables behind them, the TypeScript types, the Zod validators, the admin forms, and the access rules are all derived from the same declaration.",
            features: [
              {
                title: "Convex-native codegen",
                description:
                  "vex dev writes your Convex schema, TypeScript interfaces, and Zod validators straight from defineCollection(). There is no hand-maintained schema.ts",
                icon: "Wand",
              },
              {
                title: "End-to-end types",
                description:
                  "Fields, relationships, and query return types are checked from the database to the component. Rename a field and the compiler names every call site",
                icon: "ShieldCheck",
              },
              {
                title: "Real-time admin panel",
                description:
                  "Every list view is a Convex subscription. Pagination, live totalDocs, and bulk operations update without a refetch",
                icon: "Radio",
              },
              {
                title: "RBAC with indexed access",
                description:
                  "Document-level rules with { constraints } that compile to withIndex ranges inside the query, plus per-call access.action / access.bypass and an anonRole fallback",
                icon: "Lock",
              },
              {
                title: "Globals and themes",
                description:
                  "defineGlobal() gives you singletons like site settings. Themes are a collection — 32 shadcn tokens × light and dark, stored as oklch and applied on first paint",
                icon: "Boxes",
              },
              {
                title: "Page-builder blocks",
                description:
                  "A blocks field composes typed content blocks into a discriminated union. Each block is a config plus a React renderer, colocated",
                icon: "LayoutGrid",
              },
            ],
          },
          {
            blockType: BLOCK_SLUG_CODE_SHOWCASE,
            blockName: "Code Showcase",
            id: "home-code-showcase",
            heading: "Write the config. Get the types.",
            subheading:
              "Two files from this site. The left one is hand-written; the right one is generated by vex dev and never edited.",
            panes: [
              {
                label: "You write",
                filename: "src/vexcms/blocks/Features/config.ts",
                language: ["ts"],
                authored: ["authored"],
                code: `export const featuresBlock = defineBlock({
  slug: BLOCK_SLUG_FEATURES,
  label: "Features",
  fields: {
    heading: text({ label: "Heading", required: true }),
    subheading: text({ label: "Subheading" }),
    features: array({
      label: "Features",
      required: true,
      items: group({
        fields: {
          title: text({ label: "Title", required: true }),
          description: text({ required: true }),
          icon: text({ label: "Icon" }),
        },
      }),
    }),
  },
  admin: { icon: "LayoutGrid" },
})`,
              },
              {
                label: "Vex generates",
                filename: "src/vex.types.ts",
                language: ["ts"],
                authored: ["generated"],
                code: `/* AUTO-GENERATED BY VEX CMS — DO NOT EDIT */

export type FeaturesBlock = {
  blockType: "features"
  blockName?: string
  id: string
  heading: string
  subheading?: string
  features: {
    title: string
    description: string
    /**
     * Lucide icon name
     */
    icon?: string
  }[]
}`,
              },
            ],
          },
          {
            blockType: "how_it_works",
            blockName: "How It Works",
            id: "home-how-it-works",
            heading: "From zero to a live CMS in four steps.",
            subheading: "No boilerplate and no config files to wrestle with — the scaffolder wires Convex, auth, and the admin panel for you.",
            steps: [
              {
                icon: "Terminal",
                title: "Scaffold your project",
                description:
                  "pnpm create vexcms@latest gives you a Next.js app with Convex, Better Auth, and the admin panel already wired",
              },
              {
                icon: "Code",
                title: "Define your schema",
                description:
                  "Declare collections with defineCollection() and the field helpers. vex dev watches and regenerates your Convex schema, types, and validators",
              },
              {
                icon: "LayoutGrid",
                title: "Build with blocks",
                description:
                  "Compose pages from typed content blocks. Each block is a config plus a renderer, edited from the admin panel",
              },
              {
                icon: "Rocket",
                title: "Deploy and go live",
                description:
                  "Push to Convex, deploy the Next.js app. Content changes propagate to every subscriber with no cache invalidation",
              },
            ],
          },
          {
            blockType: "roadmap",
            blockName: "Roadmap",
            id: "home-roadmap",
            heading: "Roadmap",
            subheading:
              "What we've shipped and what's coming next. VexCMS is actively developed and everything ships as 0.1.0-alpha.",
            items: [
              {
                feature: "12 Field Types",
                description:
                  "text, url, color, number, checkbox, date, select, relationship, array, group, blocks, and upload — no richtext, json, or tabs yet.",
                status: ["shipped"],
              },
              {
                feature: "Convex Schema Codegen",
                description:
                  "vex dev / vex generate write your Convex schema, TypeScript types, and Zod validators from defineCollection() — no hand-written schema.ts.",
                status: ["shipped"],
              },
              {
                feature: "Real-Time Admin Panel",
                description:
                  "DataTable with pagination, live totalDocs, and bulk operations — every list view is a Convex subscription.",
                status: ["shipped"],
              },
              {
                feature: "Media Library",
                description:
                  "Convex file storage adapter with a searchable, paginated media picker built into every upload field.",
                status: ["shipped"],
              },
              {
                feature: "RBAC & Access Control",
                description:
                  "Document-level access rules, indexed constraints that compile to withIndex ranges, per-call access.action/bypass overrides, and an anonRole fallback for public reads.",
                status: ["shipped"],
              },
              {
                feature: "Custom Theme System",
                description:
                  "Database-driven themes with light/dark mode, 32 shadcn tokens per mode, and OKLCH color support — live-updates with zero page reload.",
                status: ["shipped"],
              },
              {
                feature: "Better Auth Integration",
                description: "Email/password and OAuth out of the box, with organizations and API keys as opt-in plugins.",
                status: ["shipped"],
              },
              {
                feature: "CLI & Scaffolder",
                description:
                  "vex dev, vex generate, and create-vexcms for instant project setup — bare or full marketing-site templates.",
                status: ["shipped"],
              },
              {
                feature: "Versioning & Drafts",
                description: "Draft/publish workflow with autosave and version history — in active development.",
                status: ["in-progress"],
              },
              {
                feature: "Live Preview",
                description:
                  "Side-by-side preview of draft content against the real frontend before publishing — builds on the drafts infrastructure.",
                status: ["in-progress"],
              },
              {
                feature: "Form Builder",
                description:
                  "Composable form fields beyond content editing, with generated validation and submission storage.",
                status: ["planned"],
              },
              {
                feature: "Field Input Consistency Pass",
                description:
                  "Touch-ups across field inputs — starting with the relationship field — for consistent interaction patterns in the admin panel.",
                status: ["planned"],
              },
              {
                feature: "Richtext, JSON, Email & Textarea Fields",
                description: "Plate.js-powered rich text, plus structured JSON, email, and multi-line text inputs.",
                status: ["planned"],
              },
              {
                feature: "Team Management & API Keys",
                description: "Invite users, assign roles, and issue scoped read-only API tokens for external integrations.",
                status: ["planned"],
              },
              {
                feature: "Lifecycle Hooks",
                description:
                  "beforeChange/afterChange hooks for custom side effects around document writes.",
                status: ["future"],
              },
              {
                feature: "Analytics Adapter",
                description:
                  "Per-document and per-block metrics surfaced directly in the admin panel.",
                status: ["future"],
              },
              {
                feature: "Multi-Component Workspaces",
                description: "Compose several Convex components into one workspace.",
                status: ["future"],
              },
              {
                feature: "Plugin System",
                description: "Third-party extensions over collections, fields, and admin views.",
                status: ["future"],
              },
              {
                feature: "React Package Testing Suite",
                description:
                  "Exportable Vitest suite from @vexcms/react for testing custom field components and admin extensions in consumer projects.",
                status: ["planned"],
              },
            ],
          },
          {
            blockType: "faq",
            blockName: "FAQ",
            id: "home-faq",
            heading: "Questions we keep getting.",
            subheading: "",
            supportLink: "https://github.com/ianyimi/vex/issues",
            items: [
              {
                question: "What is VexCMS?",
                answer:
                  "A headless CMS built on Convex. You define collections in TypeScript; Vex generates the Convex schema, the TypeScript types, and the queries, and gives you a real-time admin panel over them.",
              },
              {
                question: "How is this different from other headless CMS platforms?",
                answer:
                  "Most of them put a REST or GraphQL API in front of a database you configure separately. Vex has no API layer and no database configuration: Convex is the database, your schema is code, and every read is a live subscription.",
              },
              {
                question: "Do I need to know Convex?",
                answer:
                  "Some familiarity helps, but the CLI generates the schema, queries, and types from your collection definitions. You mostly write field declarations.",
              },
              {
                question: "Is it production ready?",
                answer:
                  "No. Everything ships as 0.1.0-alpha. Versioning, drafts, and live preview are in progress. There are 12 field types today; richtext, json, tabs, and ui are planned, not built. See the roadmap.",
              },
              {
                question: "Which frameworks does it support?",
                answer:
                  "The data layer works with any Convex client. The admin panel is Next.js today, via @vexcms/next and @vexcms/react. A TanStack Start adapter is planned.",
              },
              {
                question: "What does it cost?",
                answer:
                  "Nothing. VexCMS is Apache-2.0 licensed. You pay for your Convex usage, which has a free tier.",
              },
            ],
          },
          {
            blockType: "cta",
            blockName: "CTA",
            id: "home-cta",
            heading: "Start with a schema. Ship in an hour.",
            subheading: "Scaffold a Next.js + Convex project with authentication, the admin panel, and this marketing site already seeded.",
            actions: [
              { label: "Read the docs", href: "https://docs.vexcms.dev/guides/quickstart/" },
              { label: "View on GitHub", href: "https://github.com/ianyimi/vex" },
            ],
          },
        ],
      })
      created.push("page:home")
    }

    const existingFeatures = await ctx.db
      .query(TABLE_SLUG_PAGES)
      .withIndex("by_slug", (q) => q.eq("slug", "features"))
      .first()
    if (existingFeatures) {
      skipped.push("page:features")
    } else {
      await ctx.db.insert(TABLE_SLUG_PAGES, {
        title: "Features",
        slug: "features",
        blocks: [
          {
            blockType: "hero",
            blockName: "Hero",
            id: "features-hero",
            variant: ["compact"],
            heading: "Everything comes from one schema.",
            subheading:
              "Collections, the Convex tables behind them, the TypeScript types, the Zod validators, the admin forms, and the access rules are all derived from the same declaration.",
            primaryCtaLabel: "Read the docs",
            primaryCtaHref: "https://docs.vexcms.dev/guides/quickstart/",
          },
          {
            blockType: BLOCK_SLUG_FEATURES,
            blockName: "Features",
            id: "features-features",
            heading: "Everything you need to manage content",
            subheading:
              "Built on Convex's real-time infrastructure with a developer experience that doesn't compromise on power.",
            features: [
              {
                title: "Real-Time by Default",
                description:
                  "Every query is live. Content updates appear instantly across all connected clients — no polling, no webhooks.",
                icon: "Zap",
              },
              {
                title: "Type-Safe Schemas",
                description:
                  "Define your collections with TypeScript. Vex generates Convex schemas, Zod validators, and typed queries automatically.",
                icon: "Shield",
              },
              {
                title: "Developer First",
                description:
                  "Code-first configuration, CLI tooling, and a clean API. Build with the tools you already know and love.",
                icon: "Code",
              },
            ],
          },
          {
            blockType: BLOCK_SLUG_HOW_IT_WORKS,
            blockName: "How It Works",
            id: "features-how-it-works",
            heading: "Get started in minutes",
            subheading:
              "From zero to a fully functional CMS in four steps. No boilerplate, no config files to wrestle with.",
            steps: [
              {
                icon: "Terminal",
                title: "Scaffold your project",
                description:
                  "pnpm create vexcms@latest gives you a Next.js app with Convex, Better Auth, and the admin panel already wired",
              },
              {
                icon: "Code",
                title: "Define your schema",
                description:
                  "Use defineCollection() and field helpers to declare your content model in TypeScript. Vex generates your Convex schema, types, and queries automatically.",
              },
              {
                icon: "LayoutGrid",
                title: "Build with blocks",
                description:
                  "Compose pages from typed content blocks. Each block is a config plus a renderer, edited from the admin panel",
              },
              {
                icon: "Rocket",
                title: "Deploy and go live",
                description:
                  "Push to Convex and deploy your Next.js app. Real-time content updates flow to every connected client instantly — no cache invalidation needed.",
              },
            ],
          },
          {
            blockType: BLOCK_SLUG_CTA,
            blockName: "CTA",
            id: "features-cta",
            heading: "Start with a schema. Ship in an hour.",
            subheading:
              "Scaffold a Next.js + Convex project with authentication, the admin panel, and this marketing site already seeded.",
            actions: [
              { label: "Read the docs", href: "https://docs.vexcms.dev/guides/quickstart/" },
              { label: "View on GitHub", href: "https://github.com/ianyimi/vex" },
            ],
          },
        ],
      })
      created.push("page:features")
    }

    const existingRoadmapPage = await ctx.db
      .query(TABLE_SLUG_PAGES)
      .withIndex("by_slug", (q) => q.eq("slug", "roadmap"))
      .first()
    if (existingRoadmapPage) {
      skipped.push("page:roadmap")
    } else {
      await ctx.db.insert(TABLE_SLUG_PAGES, {
        title: "Roadmap",
        slug: "roadmap",
        blocks: [
          {
            blockType: "hero",
            blockName: "Hero",
            id: "roadmap-hero",
            variant: ["compact"],
            heading: "Shipped, in progress, and being explored.",
            subheading:
              "VexCMS is under active development. Everything ships as 0.1.0-alpha until the core feature set is stable enough for a v0.1.0 release. This page is edited from the admin panel, not from a source file.",
            primaryCtaLabel: "Read the docs",
            primaryCtaHref: "https://docs.vexcms.dev/guides/quickstart/",
          },
          {
            blockType: BLOCK_SLUG_ROADMAP,
            blockName: "Roadmap",
            id: "roadmap-roadmap",
            heading: "Roadmap",
            subheading:
              "What we've shipped and what's coming next. VexCMS is actively developed and everything ships as 0.1.0-alpha.",
            items: [
              {
                feature: "12 Field Types",
                description:
                  "text, url, color, number, checkbox, date, select, relationship, array, group, blocks, and upload — no richtext, json, or tabs yet.",
                status: ["shipped"],
              },
              {
                feature: "Convex Schema Codegen",
                description:
                  "vex dev / vex generate write your Convex schema, TypeScript types, and Zod validators from defineCollection() — no hand-written schema.ts.",
                status: ["shipped"],
              },
              {
                feature: "Real-Time Admin Panel",
                description:
                  "DataTable with pagination, live totalDocs, and bulk operations — every list view is a Convex subscription.",
                status: ["shipped"],
              },
              {
                feature: "Media Library",
                description:
                  "Convex file storage adapter with a searchable, paginated media picker built into every upload field.",
                status: ["shipped"],
              },
              {
                feature: "RBAC & Access Control",
                description:
                  "Document-level access rules, indexed constraints that compile to withIndex ranges, per-call access.action/bypass overrides, and an anonRole fallback for public reads.",
                status: ["shipped"],
              },
              {
                feature: "Custom Theme System",
                description:
                  "Database-driven themes with light/dark mode, 32 shadcn tokens per mode, and OKLCH color support — live-updates with zero page reload.",
                status: ["shipped"],
              },
              {
                feature: "Better Auth Integration",
                description:
                  "Email/password and OAuth out of the box, with organizations and API keys as opt-in plugins.",
                status: ["shipped"],
              },
              {
                feature: "CLI & Scaffolder",
                description:
                  "vex dev, vex generate, and create-vexcms for instant project setup — bare or full marketing-site templates.",
                status: ["shipped"],
              },
              {
                feature: "Versioning & Drafts",
                description: "Draft/publish workflow with autosave and version history — in active development.",
                status: ["in-progress"],
              },
              {
                feature: "Live Preview",
                description:
                  "Side-by-side preview of draft content against the real frontend before publishing — builds on the drafts infrastructure.",
                status: ["in-progress"],
              },
              {
                feature: "Form Builder",
                description:
                  "Composable form fields beyond content editing, with generated validation and submission storage.",
                status: ["planned"],
              },
              {
                feature: "Field Input Consistency Pass",
                description:
                  "Touch-ups across field inputs — starting with the relationship field — for consistent interaction patterns in the admin panel.",
                status: ["planned"],
              },
              {
                feature: "Richtext, JSON, Email & Textarea Fields",
                description:
                  "Plate.js-powered rich text, plus structured JSON, email, and multi-line text inputs.",
                status: ["planned"],
              },
              {
                feature: "Team Management & API Keys",
                description:
                  "Invite users, assign roles, and issue scoped read-only API tokens for external integrations.",
                status: ["planned"],
              },
              {
                feature: "Lifecycle Hooks",
                description:
                  "beforeChange/afterChange hooks for custom side effects around document writes.",
                status: ["future"],
              },
              {
                feature: "Analytics Adapter",
                description:
                  "Per-document and per-block metrics surfaced directly in the admin panel.",
                status: ["future"],
              },
              {
                feature: "Multi-Component Workspaces",
                description: "Compose several Convex components into one workspace.",
                status: ["future"],
              },
              {
                feature: "Plugin System",
                description: "Third-party extensions over collections, fields, and admin views.",
                status: ["future"],
              },
              {
                feature: "React Package Testing Suite",
                description:
                  "Exportable Vitest suite from @vexcms/react for testing custom field components and admin extensions in consumer projects.",
                status: ["planned"],
              },
            ],
          },
          {
            blockType: BLOCK_SLUG_CTA,
            blockName: "CTA",
            id: "roadmap-cta",
            heading: "Start with a schema. Ship in an hour.",
            subheading:
              "Scaffold a Next.js + Convex project with authentication, the admin panel, and this marketing site already seeded.",
            actions: [
              { label: "Read the docs", href: "https://docs.vexcms.dev/guides/quickstart/" },
              { label: "View on GitHub", href: "https://github.com/ianyimi/vex" },
            ],
          },
        ],
      })
      created.push("page:roadmap")
    }

    return { created, skipped }
  },
})
