import type { WithoutSystemFields } from "convex/server"

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
  BLOCK_SLUG_FOOTER,
  BLOCK_SLUG_HEADER,
  BLOCK_SLUG_HERO,
  BLOCK_SLUG_HOW_IT_WORKS,
  BLOCK_SLUG_ROADMAP,
  BLOCK_SLUG_SPLIT,
  BLOCK_SLUG_STATS,
} from "~/vexcms/blocks/constants"

import type { Doc } from "./_generated/dataModel"

import { internalMutation, type MutationCtx } from "./_generated/server"

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

/** How `runSeed` treats a document that already exists. */
type SeedMode = "insert" | "patch"

/** Per-document outcome of a seed run, keyed by a stable natural label. */
export type SeedReport = {
  /** Documents that did not exist and were inserted. */
  created: string[]
  /** Documents that existed and were reconciled against this file. */
  patched: string[]
  /** Documents that existed and were left exactly as they were. */
  skipped: string[]
}

/**
 * Builds the whole marketing site: the 4 theme presets ("Stark × Ember" active
 * by default), site settings, a header, a footer, and the three pages, every
 * one assembled from block field data rather than bespoke JSX.
 *
 * Every document is located by a natural identifier — theme/header/footer name,
 * page slug, or the `siteSettings` singleton — never by id, so both modes are
 * safe to run repeatedly and neither can ever duplicate a row.
 *
 * `mode` decides what happens to a document that is already there:
 * - `"insert"` leaves it untouched. Correct for a fresh deployment, and the
 *   reason editing this file has no effect on one that is already seeded.
 * - `"patch"` reconciles it in place, so this file is the source of truth and
 *   content changes ship by re-running rather than by hand-editing documents.
 *   Patching overwrites editor changes to the fields seeded here, which is the
 *   point; it is not a merge.
 */
async function runSeed(ctx: MutationCtx, mode: SeedMode): Promise<SeedReport> {
  const created: string[] = []
  const patched: string[] = []
  const skipped: string[] = []

  let activeThemeId: null | string = null
  for (const preset of THEME_PRESETS) {
    const existing = await ctx.db
      .query(TABLE_SLUG_THEMES)
      .withIndex("by_name", (q) => q.eq("name", preset.name))
      .first()
    if (existing) {
      if (mode === "patch") {
        await ctx.db.patch(TABLE_SLUG_THEMES, existing._id, preset)
        patched.push(`theme:${preset.name}`)
      } else {
        skipped.push(`theme:${preset.name}`)
      }
      if (preset.name === "Stark × Ember") {
        activeThemeId = existing._id
      }
      continue
    }
    const id = await ctx.db.insert(TABLE_SLUG_THEMES, preset)
    created.push(`theme:${preset.name}`)
    if (preset.name === "Stark × Ember") {
      activeThemeId = id
    }
  }

  const existingSettings = await getGlobal({
    ctx,
    config,
    slug: GLOBAL_SLUG_SITE_SETTINGS,
    access: { bypass: true },
  })
  const siteSettingsDoc = {
    name: "VexCMS",
    description:
      "Define your collections in TypeScript. VexCMS generates the Convex schema and types, and ships a real-time admin panel your whole team can use.",
    activeTheme: activeThemeId ? [activeThemeId] : [],
  }
  if (existingSettings && mode !== "patch") {
    skipped.push("siteSettings")
  } else {
    // `upsertGlobal` merges field by field, so passing only the seeded keys
    // leaves `adminTheme` and every SEO field an editor had set untouched.
    await upsertGlobal({
      ctx,
      config,
      slug: GLOBAL_SLUG_SITE_SETTINGS,
      data: siteSettingsDoc,
      access: { bypass: true },
    })
    if (existingSettings) {
      patched.push("siteSettings")
    } else {
      created.push("siteSettings")
    }
  }

  const existingHeader = await ctx.db
    .query(TABLE_SLUG_HEADERS)
    .withIndex("by_name", (q) => q.eq("name", "Main Header"))
    .first()
  const headerDoc: WithoutSystemFields<Doc<typeof TABLE_SLUG_HEADERS>> = {
    name: "Main Header",
    content: [
      {
        blockType: BLOCK_SLUG_HEADER,
        blockName: "Site Header",
        id: "main-header",
        logoText: "VexCMS",
        logoHref: "/",
        menuItems: [
          { label: "Features", href: "/features" },
          { label: "Roadmap", href: "/roadmap" },
          { label: "Docs", href: "https://docs.vexcms.dev" },
        ],
        actionButtons: [
          { label: "GitHub", href: "https://github.com/ianyimi/vex", variant: ["ghost"] },
          {
            label: "Get started",
            href: "https://docs.vexcms.dev/guides/quickstart/",
            variant: ["default"],
          },
        ],
      },
    ],
  }
  if (existingHeader) {
    if (mode === "patch") {
      await ctx.db.patch(TABLE_SLUG_HEADERS, existingHeader._id, headerDoc)
      patched.push("header")
    } else {
      skipped.push("header")
    }
  } else {
    await ctx.db.insert(TABLE_SLUG_HEADERS, headerDoc)
    created.push("header")
  }

  const existingFooter = await ctx.db
    .query(TABLE_SLUG_FOOTERS)
    .withIndex("by_name", (q) => q.eq("name", "Main Footer"))
    .first()
  const footerDoc: WithoutSystemFields<Doc<typeof TABLE_SLUG_FOOTERS>> = {
    name: "Main Footer",
    content: [
      {
        blockType: BLOCK_SLUG_FOOTER,
        blockName: "Site Footer",
        id: "main-footer",
        logoText: "VexCMS",
        copyright: "VexCMS. Apache-2.0 licensed. Built on Convex.",
        links: [
          { label: "Features", href: "/features" },
          { label: "Roadmap", href: "/roadmap" },
          { label: "Docs", href: "https://docs.vexcms.dev" },
          { label: "Quickstart", href: "https://docs.vexcms.dev/guides/quickstart/" },
          { label: "Admin demo", href: "/admin" },
          { label: "npm", href: "https://www.npmjs.com/package/@vexcms/core" },
          { label: "Licence", href: "https://github.com/ianyimi/vex/blob/master/LICENSE" },
          { label: "Convex", href: "https://convex.dev" },
          { label: "Convex docs", href: "https://docs.convex.dev" },
        ],
        socialLinks: [
          { platform: "GitHub", href: "https://github.com/ianyimi/vex", icon: "Github" },
        ],
      },
    ],
  }
  if (existingFooter) {
    if (mode === "patch") {
      await ctx.db.patch(TABLE_SLUG_FOOTERS, existingFooter._id, footerDoc)
      patched.push("footer")
    } else {
      skipped.push("footer")
    }
  } else {
    await ctx.db.insert(TABLE_SLUG_FOOTERS, footerDoc)
    created.push("footer")
  }

  const existingHome = await ctx.db
    .query(TABLE_SLUG_PAGES)
    .withIndex("by_slug", (q) => q.eq("slug", "home"))
    .first()
  const homePageDoc: WithoutSystemFields<Doc<typeof TABLE_SLUG_PAGES>> = {
    title: "Home",
    slug: "home",
    blocks: [
      {
        blockType: BLOCK_SLUG_HERO,
        blockName: "Hero",
        id: "home-hero",
        variant: ["full"],
        installCommand: "pnpm create vexcms@alpha",
        badgeText: "Public alpha — now on npm",
        badgeLink: "https://www.npmjs.com/package/@vexcms/core",
        heading: "The content backend for everything Convex.",
        subheading:
          "Define your collections in TypeScript. Vex generates the Convex schema and types. Your app gets typed queries. Your clients get a real-time admin panel. No API layer. No second database.",
        primaryCtaLabel: "Get started",
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
            value: "1",
            label: "command to a running CMS",
            description:
              "pnpm create vexcms@alpha scaffolds Next.js, Convex, auth, and the admin panel in one step",
          },
          {
            value: "0",
            label: "API layers to maintain",
            description:
              "Convex is the database. No connection string, no REST or GraphQL tier in between",
          },
          {
            value: "12",
            label: "field types",
            description:
              "text, url, number, checkbox, select, date, color, upload, relationship, group, array, blocks",
          },
          {
            value: "8",
            label: "packages on npm",
            description:
              "core, react, next, cli, better-auth, file-storage-convex, richtext-plate, create-vexcms",
          },
        ],
      },
      {
        blockType: BLOCK_SLUG_FEATURES,
        blockName: "Features",
        id: "home-features",
        heading: "One config. The whole backend.",
        subheading:
          "Your collection definitions are the only place you write your content model. The Convex tables, the TypeScript types, the Zod validators, the admin forms, and the access rules all come from them.",
        features: [
          {
            title: "Schema and types, generated",
            description:
              "vex dev watches your collections and writes the Convex schema, the TypeScript interfaces, and the Zod validators. You never hand-maintain schema.ts again.",
            icon: "Wand",
          },
          {
            title: "Typed reads, ready to use",
            description:
              "The packages export find, get, create, update, and remove for both the server and the client. Call them inside your own Convex functions, or through the local API from a server component.",
            icon: "Plug",
          },
          {
            title: "Types all the way to the component",
            description:
              "Fields, relationships, and return shapes are checked from the table to the JSX. Rename a field and the compiler hands you every call site.",
            icon: "ShieldCheck",
          },
          {
            title: "An admin panel you can hand to a client",
            description:
              "It is a route in your own app, not a dashboard on someone else's domain. Every list view is a live Convex subscription. Rows and totals update as people work.",
            icon: "Radio",
          },
          {
            title: "Access control that runs in the query",
            description:
              "Rules per document and per field. Constraints compile to a withIndex range inside the Convex query. Per-call overrides and an anonymous role are built in.",
            icon: "Lock",
          },
          {
            title: "Page building from typed blocks",
            description:
              "A blocks field composes typed content blocks into a discriminated union. Each block pairs one config with one React renderer. This page is built from them.",
            icon: "LayoutGrid",
          },
        ],
      },
      {
        blockType: BLOCK_SLUG_CODE_SHOWCASE,
        blockName: "Code Showcase",
        id: "home-code-showcase",
        heading: "You write the collection. Vex writes the schema.",
        subheading:
          "On the left, a blog's Posts collection, written once by hand. On the right, the Convex table vex dev emits from it. Validators, ids, and indexes included. Never edited by hand.",
        panes: [
          {
            label: "You write",
            filename: "src/vexcms/collections/posts.ts",
            language: ["ts"],
            authored: ["authored"],
            code: `export const posts = defineCollection({
  slug: "posts",
  admin: { useAsTitle: "title", icon: "Newspaper" },
  fields: {
    title: text({ label: "Title", required: true }),
    slug: text({ label: "Slug", required: true, index: "by_slug" }),
    excerpt: text({ label: "Excerpt" }),
    featured: checkbox({ label: "Featured" }),
    readingMinutes: number({ label: "Reading Minutes" }),
    coverImage: upload({ to: "images", label: "Cover Image" }),
    author: relationship({ label: "Author", collection: { slug: "authors" } }),
    tags: array({ label: "Tags", items: text({ label: "Tag" }) }),
    seo: group({
      label: "SEO",
      fields: {
        metaTitle: text({ label: "Meta Title" }),
        metaDescription: text({ label: "Meta Description" }),
      },
    }),
  },
  labels: { singular: "Post", plural: "Posts" },
})`,
          },
          {
            label: "Vex generates",
            filename: "convex/vex.schema.ts",
            language: ["ts"],
            authored: ["generated"],
            code: `// ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️
// Run 'vex dev' or 'vex generate' to update this file.

import { defineTable } from "convex/server"
import { v } from "convex/values"

export const posts = defineTable({
  title: v.string(),
  slug: v.string(),
  excerpt: v.optional(v.string()),
  featured: v.optional(v.boolean()),
  readingMinutes: v.optional(v.number()),
  coverImage: v.optional(v.array(v.id("images"))),
  author: v.optional(v.array(v.id("authors"))),
  tags: v.optional(v.array(v.string())),
  seo: v.optional(
    v.object({ metaTitle: v.optional(v.string()), metaDescription: v.optional(v.string()) })
  ),
})
  .index("by_slug", ["slug"])
  .index("by_author", ["author"])`,
          },
        ],
      },
      {
        blockType: BLOCK_SLUG_SPLIT,
        blockName: "Built on Convex",
        id: "home-split-convex",
        eyebrow: "Built on Convex",
        heading: "Everything Convex does, your CMS does too.",
        body: "VexCMS is built for Convex and nothing else. That is the trade. In return, none of the guarantees below are features we had to build. They are Convex's, and they come with the install. Every one is documented on convex.dev.",
        bullets: [
          {
            icon: "Radio",
            text: "Live queries. Every read is a subscription, so edits land in every open client. Nothing to poll, no cache to invalidate.",
          },
          {
            icon: "ShieldCheck",
            text: "ACID transactions. A mutation that touches five documents either lands completely or not at all.",
          },
          {
            icon: "Clock",
            text: "Scheduling and crons. Publish at a time, expire a banner, reindex overnight.",
          },
          {
            icon: "HardDrive",
            text: "File storage. The media library is Convex storage sitting behind an upload field.",
          },
          {
            icon: "Search",
            text: "Full-text and vector search over your content, from the same backend that stores it.",
          },
          {
            icon: "Lock",
            text: "Convex's security and compliance posture, inherited whole rather than re-implemented.",
          },
        ],
        media: ["code"],
        mediaPosition: ["right"],
        codeFilename: "convex/posts.ts",
        codeLanguage: ["ts"],
        code: `import { find } from "@vexcms/core/server"

import { query } from "./_generated/server"

// An ordinary Convex query. Because it is an ordinary Convex
// query, every client reading it is subscribed to it — that is
// Convex's doing, not something VexCMS bolted on top.
export const featuredPosts = query({
  args: {},
  handler: async (ctx) =>
    find({
      ctx,
      collection: "posts",
      withIndex: { name: "by_featured", range: (q) => q.eq("featured", true) },
      access: { bypass: true },
    }),
})`,
      },
      {
        blockType: BLOCK_SLUG_SPLIT,
        blockName: "Coming from Payload",
        id: "home-split-payload",
        eyebrow: "Coming from Payload",
        heading: "The config you already know, on a backend that subscribes.",
        body: "Collections, fields, globals, blocks, access control: the shapes are the ones you already write. Your content modelling carries over. What changes is the layer underneath.",
        bullets: [
          {
            icon: "FileCode",
            text: "defineCollection and defineGlobal, with the field helpers you expect from a code-first CMS.",
          },
          {
            icon: "Blocks",
            text: "A blocks field that composes typed content blocks into a real page builder.",
          },
          {
            icon: "Lock",
            text: "Document- and field-level access control, with constraints that compile to an indexed range.",
          },
          {
            icon: "Image",
            text: "An upload field over a searchable media library, backed by Convex file storage.",
          },
          {
            icon: "Users",
            text: "Email, password, and OAuth through Better Auth, with organisations and API keys as plugins.",
          },
          {
            icon: "Database",
            text: "No database to run, no adapter to pick, no cache to invalidate. Convex is all three.",
          },
        ],
        media: ["none"],
        mediaPosition: ["right"],
      },
      {
        blockType: BLOCK_SLUG_HOW_IT_WORKS,
        blockName: "How It Works",
        id: "home-how-it-works",
        heading: "From nothing to a live CMS in four steps.",
        subheading:
          "The scaffolder wires Convex, auth, and the admin panel together. Your part is the field definitions.",
        steps: [
          {
            icon: "Terminal",
            title: "Scaffold the project",
            description:
              "pnpm create vexcms@alpha gives you a Next.js app with Convex, Better Auth, and the admin panel already wired together",
          },
          {
            icon: "Code",
            title: "Define your collections",
            description:
              "Declare fields with defineCollection and the field helpers. vex dev watches the file and regenerates the Convex schema, the types, and the validators as you type",
          },
          {
            icon: "LayoutGrid",
            title: "Build the pages",
            description:
              "Compose pages from typed blocks. Each block pairs one config with one renderer. Editors manage them from the admin panel",
          },
          {
            icon: "Rocket",
            title: "Deploy",
            description:
              "Push to Convex and deploy the Next.js app. Every read is a subscription, so content changes reach open clients on their own",
          },
        ],
      },
      {
        blockType: BLOCK_SLUG_FAQ,
        blockName: "FAQ",
        id: "home-faq",
        heading: "Questions we keep getting.",
        subheading: "",
        supportLink: "https://github.com/ianyimi/vex/issues",
        items: [
          {
            question: "What is VexCMS?",
            answer:
              "A headless CMS that runs inside your Convex backend. You define collections in TypeScript. VexCMS generates the Convex schema and types, exports typed read and write functions, and gives your team a real-time admin panel.",
          },
          {
            question: "How is this different from other headless CMS platforms?",
            answer:
              "Most of them put a REST or GraphQL API in front of a database you configure and pay for separately. VexCMS has neither. Convex is the database and your schema is code. Every read is a live subscription, not a request.",
          },
          {
            question: "Does it generate my queries?",
            answer:
              "No. vex dev generates the Convex schema, the TypeScript types, and the Zod validators. The read and write functions — find, get, create, update, remove — ship in the packages. You call them inside your own Convex functions, or through the local API from a server component. Your query layer stays yours.",
          },
          {
            question: "I already use Payload. Why would I switch?",
            answer:
              "The config is familiar, so your content modelling transfers. You drop the database to operate, the adapter layer, and the cache invalidation. You pick up everything Convex ships: live queries, transactions, scheduling, file storage, and search.",
          },
          {
            question: "Do I need to know Convex?",
            answer:
              "It helps, and it pays off. Everything you learn about Convex applies to your app, not to a CMS abstraction. Day to day, you write field definitions and the CLI does the rest.",
          },
          {
            question: "Is it production ready?",
            answer:
              "Not yet. Ten specs stand between the current alpha and the 0.1.0 tag, in a published order. The big ones: lifecycle hooks with server-side validation, live preview, versioning and drafts, and the richtext field. The roadmap page has the full list.",
          },
          {
            question: "Which frameworks does it support?",
            answer:
              "The data layer works with any Convex client. The admin panel is Next.js today, through @vexcms/next and @vexcms/react. Those packages also ship prerendering, sitemap and robots helpers, and cache purging on save. A TanStack Start adapter is on the post-launch list.",
          },
          {
            question: "What does it cost?",
            answer:
              "The core is Apache-2.0 and stays that way: every field type, the admin panel, the CLI, RBAC, drafts, live preview, and hooks. You pay Convex for usage, and Convex has a free tier. Paid enterprise add-ons come later: environment branching, SSO, approval workflows, audit logs, and localization, as separate packages under a flat annual licence. Nothing free today becomes paid later.",
          },
        ],
      },
      {
        blockType: BLOCK_SLUG_CTA,
        blockName: "CTA",
        id: "home-cta",
        heading: "Scaffold it and see.",
        subheading:
          "One command gives you a Next.js app, a Convex deployment, auth, the admin panel, and a marketing site like this one. Seeded, editable, and yours.",
        actions: [
          { label: "Get started", href: "https://docs.vexcms.dev/guides/quickstart/" },
          { label: "View on GitHub", href: "https://github.com/ianyimi/vex" },
          { label: "Why Convex", href: "https://docs.convex.dev/realtime" },
        ],
      },
    ],
  }
  if (existingHome) {
    if (mode === "patch") {
      await ctx.db.patch(TABLE_SLUG_PAGES, existingHome._id, homePageDoc)
      patched.push("page:home")
    } else {
      skipped.push("page:home")
    }
  } else {
    await ctx.db.insert(TABLE_SLUG_PAGES, homePageDoc)
    created.push("page:home")
  }

  const existingFeatures = await ctx.db
    .query(TABLE_SLUG_PAGES)
    .withIndex("by_slug", (q) => q.eq("slug", "features"))
    .first()
  const featuresPageDoc: WithoutSystemFields<Doc<typeof TABLE_SLUG_PAGES>> = {
    title: "Features",
    slug: "features",
    blocks: [
      {
        blockType: BLOCK_SLUG_HERO,
        blockName: "Hero",
        id: "features-hero",
        variant: ["compact"],
        badgeText: "Features",
        heading: "Everything that comes out of one collection definition.",
        subheading:
          "The Convex tables, the TypeScript types, the Zod validators, the admin forms, the typed read and write functions, and the access rules. Written once, in TypeScript.",
        primaryCtaLabel: "Get started",
        primaryCtaHref: "https://docs.vexcms.dev/guides/quickstart/",
      },
      {
        blockType: BLOCK_SLUG_FEATURES,
        blockName: "Features",
        id: "features-features",
        heading: "What you get, concretely.",
        subheading:
          "Everything below is shipped in the published packages and running in this site's admin panel. Anything still in progress lives on the roadmap.",
        features: [
          {
            title: "Twelve field types",
            description:
              "text, url, number, checkbox, select, date, color, upload, relationship, group, array, and blocks. Richtext lands with 0.1.0. json, email, and textarea follow after.",
            icon: "Type",
          },
          {
            title: "Schema and type generation",
            description:
              "vex generate and vex dev write convex/vex.schema.ts, your TypeScript interfaces, and matching Zod validators straight from defineCollection.",
            icon: "Wand",
          },
          {
            title: "Real-time data tables",
            description:
              "Pagination, live totals, and bulk operations over a Convex subscription. Two editors working the same collection watch each other's changes arrive.",
            icon: "Table",
          },
          {
            title: "Media library",
            description:
              "An upload field with a searchable, paginated picker over Convex file storage, available anywhere a document takes an image.",
            icon: "Image",
          },
          {
            title: "Roles, documents, and fields",
            description:
              "Rules per collection, per operation, per document, and per field, plus per-call access.action and access.bypass overrides and an anonymous role for public reads.",
            icon: "Lock",
          },
          {
            title: "Globals for the one-off content",
            description:
              "defineGlobal gives you singletons — site settings, a header, a footer — with the same fields, the same forms, and the same access rules as a collection.",
            icon: "Boxes",
          },
          {
            title: "Database-driven themes",
            description:
              "32 shadcn tokens per mode, light and dark, stored as OKLCH and applied on first paint. Change one and every open tab follows without a reload.",
            icon: "Palette",
          },
          {
            title: "SEO, prerendering, and purge on save",
            description:
              "vexMetadata, vexStaticParams, createVexSitemap, and createVexRobots for the public side, plus a revalidate route that drops the cached page when an editor hits save.",
            icon: "Search",
          },
          {
            title: "A test kit for your own components",
            description:
              "@vexcms/react/testing exports the suites we run against every field input. Your custom fields can be held to the same contract.",
            icon: "CircleCheck",
          },
        ],
      },
      {
        blockType: BLOCK_SLUG_SPLIT,
        blockName: "Admin panel",
        id: "features-split-admin",
        eyebrow: "Admin panel",
        heading: "A panel you can hand to a client.",
        body: "The admin panel is a route in your own Next.js app, behind your own auth, on your own domain. It reads the same collection definitions your code does. Add a field and the form updates with no UI work.",
        bullets: [
          {
            icon: "Radio",
            text: "Every list view is a Convex subscription, so rows and totals update while you watch.",
          },
          {
            icon: "Users",
            text: "Roles decide what each person can see and change, down to the individual field.",
          },
          {
            icon: "Palette",
            text: "Themes live in the database. Branding the panel is content work, not a deploy.",
          },
          {
            icon: "Image",
            text: "A media picker with search and pagination over Convex file storage.",
          },
        ],
        media: ["code"],
        mediaPosition: ["right"],
        codeFilename: "app/(vexcms)/admin/[[...path]]/page.tsx",
        codeLanguage: ["tsx"],
        code: `import { NextAdminPage } from "@vexcms/next/server"
import { redirect } from "next/navigation"

import { getToken } from "~/auth/server"
import config from "~/vex.config"

// The whole panel is one route in your app. Gate it however you
// gate anything else, then hand it the config you already wrote.
export default async function AdminPage({
  params,
}: {
  params: Promise<{ path?: string[] }>
}) {
  const token = await getToken()
  if (!token) redirect("/auth/sign-in?redirectTo=/admin")

  return <NextAdminPage config={config} params={params} token={token} />
}`,
      },
      {
        blockType: BLOCK_SLUG_CODE_SHOWCASE,
        blockName: "Code Showcase",
        id: "features-code-showcase",
        heading: "One collection. Every layer, typed.",
        subheading:
          "A testimonials collection any marketing site would have, and the Convex table vex dev writes from it. Validators, media ids, and the index you asked for, none of it typed out by hand.",
        panes: [
          {
            label: "You write",
            filename: "src/vexcms/collections/testimonials.ts",
            language: ["ts"],
            authored: ["authored"],
            code: `export const testimonials = defineCollection({
  slug: "testimonials",
  admin: { useAsTitle: "author", icon: "Quote" },
  fields: {
    quote: text({ label: "Quote", required: true }),
    author: text({ label: "Author", required: true }),
    role: text({ label: "Role" }),
    company: text({ label: "Company", index: "by_company" }),
    companyUrl: url({ label: "Company URL" }),
    avatar: upload({ to: "images", label: "Avatar" }),
    rating: number({ label: "Rating" }),
    featured: checkbox({ label: "Featured" }),
    plan: select({
      label: "Plan",
      options: [
        { label: "Free", value: "free" },
        { label: "Pro", value: "pro" },
        { label: "Enterprise", value: "enterprise" },
      ],
      defaultValue: ["pro"],
    }),
  },
  labels: { singular: "Testimonial", plural: "Testimonials" },
})`,
          },
          {
            label: "Vex generates",
            filename: "convex/vex.schema.ts",
            language: ["ts"],
            authored: ["generated"],
            code: `// ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️
// Run 'vex dev' or 'vex generate' to update this file.

import { defineTable } from "convex/server"
import { v } from "convex/values"

export const testimonials = defineTable({
  quote: v.string(),
  author: v.string(),
  role: v.optional(v.string()),
  company: v.optional(v.string()),
  companyUrl: v.optional(v.string()),
  avatar: v.optional(v.array(v.id("images"))),
  rating: v.optional(v.number()),
  featured: v.optional(v.boolean()),
  plan: v.optional(v.array(v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")))),
}).index("by_company", ["company"])`,
          },
        ],
      },
      {
        blockType: BLOCK_SLUG_SPLIT,
        blockName: "Access control",
        id: "features-split-access",
        eyebrow: "Access control",
        heading: "A scoped read stays scoped, inside the query.",
        body: "Access rules carry constraints, and constraints compile to a withIndex range on the query itself. The narrowing happens in the database, not in a filter over documents you already paid to read.",
        bullets: [
          {
            icon: "Lock",
            text: "Rules per collection, per operation, per document, and per field.",
          },
          {
            icon: "Search",
            text: "Indexed constraints rather than filtering a page of results after the fact.",
          },
          {
            icon: "Users",
            text: "An anonymous role, so public pages read without a session.",
          },
          {
            icon: "ShieldCheck",
            text: "Per-call access.action and access.bypass for server code you already trust.",
          },
        ],
        media: ["code"],
        mediaPosition: ["left"],
        codeFilename: "src/vexcms/access.ts",
        codeLanguage: ["ts"],
        code: `export const access = defineAccess({
  roles: ["admin", "editor", "guest"] as const,
  anonRole: "guest",
  resources: [posts],
  permissions: {
    admin: { "*": true },
    editor: {
      posts: {
        // Editors browse their own posts, resolved straight off
        // the by_author index — no post-read filtering.
        read: {
          constraints: ({ user, q }) =>
            q.withIndex("by_author", (ix) => ix.eq("authorId", user._id)),
        },
        update: true,
      },
    },
    guest: {
      posts: {
        // Compiles to withIndex("by_status", ix => ix.eq("status", "published"))
        // on the query itself, so drafts are never read at all.
        read: {
          constraints: ({ q }) =>
            q.withIndex("by_status", (ix) => ix.eq("status", "published")),
        },
      },
    },
  },
})`,
      },
      {
        blockType: BLOCK_SLUG_CTA,
        blockName: "CTA",
        id: "features-cta",
        heading: "Scaffold it and see.",
        subheading:
          "One command gives you a Next.js app, a Convex deployment, auth, the admin panel, and a marketing site like this one. Seeded, editable, and yours.",
        actions: [
          { label: "Get started", href: "https://docs.vexcms.dev/guides/quickstart/" },
          { label: "View on GitHub", href: "https://github.com/ianyimi/vex" },
          { label: "Why Convex", href: "https://docs.convex.dev/realtime" },
        ],
      },
    ],
  }
  if (existingFeatures) {
    if (mode === "patch") {
      await ctx.db.patch(TABLE_SLUG_PAGES, existingFeatures._id, featuresPageDoc)
      patched.push("page:features")
    } else {
      skipped.push("page:features")
    }
  } else {
    await ctx.db.insert(TABLE_SLUG_PAGES, featuresPageDoc)
    created.push("page:features")
  }

  const existingRoadmapPage = await ctx.db
    .query(TABLE_SLUG_PAGES)
    .withIndex("by_slug", (q) => q.eq("slug", "roadmap"))
    .first()
  const roadmapPageDoc: WithoutSystemFields<Doc<typeof TABLE_SLUG_PAGES>> = {
    title: "Roadmap",
    slug: "roadmap",
    blocks: [
      {
        blockType: BLOCK_SLUG_HERO,
        blockName: "Hero",
        id: "roadmap-hero",
        variant: ["compact"],
        badgeText: "Roadmap",
        heading: "What's shipped, what's next, and what's still an idea.",
        subheading:
          "VexCMS is in public alpha. Ten specs stand between the current alpha and the 0.1.0 tag, and they ship in the order below. This page itself is edited in the admin panel, not in a source file.",
        primaryCtaLabel: "Get started",
        primaryCtaHref: "https://docs.vexcms.dev/guides/quickstart/",
      },
      {
        blockType: BLOCK_SLUG_STATS,
        blockName: "Stats",
        id: "roadmap-stats",
        items: [
          {
            value: "11",
            label: "shipped",
            description:
              "Field types, codegen, the admin panel, globals, media, RBAC, themes, auth, SEO, the CLI, and the test kit",
          },
          {
            value: "10",
            label: "specs to v0.1.0",
            description:
              "Each spec consumes what the last one built. The mobile pass is the final gate",
          },
          {
            value: "0.1.0-alpha.16",
            label: "on npm today",
            description:
              "Published from the dev branch. The whole track lands before anything is tagged 0.1.0",
          },
        ],
      },
      {
        blockType: BLOCK_SLUG_ROADMAP,
        blockName: "Roadmap",
        id: "roadmap-roadmap",
        heading: "Roadmap",
        subheading:
          "Shipped means it is in the published packages and running in this site. Planned means it is committed to 0.1.0, listed in the order it ships. Everything past that is an intention, not a promise.",
        items: [
          {
            feature: "12 Field Types",
            description:
              "text, url, color, number, checkbox, date, select, relationship, array, group, blocks, and upload.",
            status: ["shipped"],
          },
          {
            feature: "Convex Schema & Type Codegen",
            description:
              "vex dev and vex generate write your Convex schema, TypeScript types, and Zod validators from defineCollection. There is no hand-written schema.ts to drift.",
            status: ["shipped"],
          },
          {
            feature: "Real-Time Admin Panel",
            description:
              "A data table with pagination, live totals, and bulk operations. Every list view is a Convex subscription. Two people on one collection see each other work.",
            status: ["shipped"],
          },
          {
            feature: "Globals",
            description:
              "defineGlobal singletons for site settings, headers, footers, and anything else there is exactly one of.",
            status: ["shipped"],
          },
          {
            feature: "Media Library",
            description:
              "A Convex file storage adapter with a searchable, paginated picker built into every upload field.",
            status: ["shipped"],
          },
          {
            feature: "Document & Field-Level RBAC",
            description:
              "Rules per collection, operation, document, and field. Constraints compile to withIndex ranges inside the query. Per-call overrides and an anonRole fallback are built in.",
            status: ["shipped"],
          },
          {
            feature: "Custom Theme System",
            description:
              "Themes in the database with 32 shadcn tokens per mode, light and dark, stored as OKLCH and applied on first paint. Changing one updates every open tab.",
            status: ["shipped"],
          },
          {
            feature: "Better Auth Integration",
            description:
              "Email, password, and OAuth out of the box, with organisations and API keys available as plugins.",
            status: ["shipped"],
          },
          {
            feature: "SEO, Prerendering & Revalidation",
            description:
              "vexMetadata, vexStaticParams, createVexSitemap, and createVexRobots, plus a revalidate route that purges the cached page when an editor saves.",
            status: ["shipped"],
          },
          {
            feature: "CLI & Scaffolder",
            description:
              "vex dev, vex generate, and create-vexcms. The scaffolder offers a bare project or a full marketing-site template.",
            status: ["shipped"],
          },
          {
            feature: "React Test Kit",
            description:
              "@vexcms/react/testing exports the contract suites we run against every field input. Your own custom fields can be held to them too.",
            status: ["shipped"],
          },
          {
            feature: "Data-Table Integrity & Config Honesty",
            description:
              "First in the launch track. Every key under admin.table gets a consumer or gets deleted. No README documents a flag that does nothing.",
            status: ["planned"],
          },
          {
            feature: "Public API Honesty Pass",
            description:
              "Nothing exported may lie about what it does. The auto-migration stubs leave the public surface. The localization model gets decided before anyone has data to migrate.",
            status: ["planned"],
          },
          {
            feature: "Lifecycle Hooks & Server-Side Validation",
            description:
              "beforeChange and afterChange, plus one write-validation stage. min and max become enforced through the Local API, not only in the admin form. An async validate() receives ctx, so transactional uniqueness checks are sound.",
            status: ["planned"],
          },
          {
            feature: "Live Preview",
            description:
              "Unsaved form state, streamed over postMessage and overlaid on your real route. The preview is your production page, not a parallel render path. Origin-allowlisted and gated per request.",
            status: ["planned"],
          },
          {
            feature: "Versioning & Drafts",
            description:
              "A real draft and publish workflow. Reads return the published document, readDrafts returns drafts, and publish promotes. Autosave never touches what is live. Prior versions are restorable from the edit view.",
            status: ["planned"],
          },
          {
            feature: "Richtext Field",
            description:
              "A richtext() field in core, wired to the Plate.js editor and renderer that @vexcms/richtext-plate already ships. The @ts-nocheck pragmas go with it.",
            status: ["planned"],
          },
          {
            feature: "Field Input Consistency Pass",
            description:
              "Every input gets correct empty, loading, error, and read-only states. The relationship field is the named offender. The media picker finally honours the upload field's accept filter.",
            status: ["planned"],
          },
          {
            feature: "Edit-View Overhaul",
            description:
              "An unsaved-changes guard, so a misclick cannot cost you work. Duplicate for documents and for blocks. A validation summary that jumps to the failing field.",
            status: ["planned"],
          },
          {
            feature: "List-View Overhaul",
            description:
              "Per-collection search, sortable columns, column visibility, page-size control, and saved views. Each control ships together with the config key that drives it.",
            status: ["planned"],
          },
          {
            feature: "Responsive & Mobile Pass",
            description:
              "The final gate. Every admin and marketing surface audited at seven widths, from 375 to 1536. No clipped controls, and every primary action reachable on a phone.",
            status: ["planned"],
          },
          {
            feature: "JSON, Email & Textarea Fields",
            description:
              "Deliberately cut from 0.1.0, not forgotten. Leaf fields are cheap to add once the track is done. ui and tabs are a separate question; both change core invariants.",
            status: ["future"],
          },
          {
            feature: "Content Scheduling",
            description:
              "publishAt on a document, promoted by a Convex scheduled function. The scheduling Convex already has, put to work on content.",
            status: ["future"],
          },
          {
            feature: "Team Management & API Keys",
            description:
              "A UI for inviting people and assigning roles. Scoped read-only tokens for anything that reads your content from outside.",
            status: ["future"],
          },
          {
            feature: "TanStack Start Adapter",
            description:
              "The data layer already works with any Convex client. This is the admin panel and the caching helpers on a second framework.",
            status: ["future"],
          },
          {
            feature: "S3, R2 & Vercel Blob Adapters",
            description:
              "Storage adapters beside the Convex one, for teams whose assets have to live somewhere specific.",
            status: ["future"],
          },
          {
            feature: "Form Builder",
            description:
              "defineFormCollection: fields for collecting input rather than editing content. Generated validation, stored submissions.",
            status: ["future"],
          },
          {
            feature: "Plugin System",
            description:
              "Third-party extensions over collections, fields, and admin views, including custom field types. The panel grows without forking.",
            status: ["future"],
          },
          {
            feature: "Enterprise Add-Ons",
            description:
              "Content branching between environments, SAML and OIDC SSO, approval workflows, a retained audit log, and localization. Separate paid packages on a flat annual licence. The core stays Apache-2.0, and nothing free today moves behind it.",
            status: ["exploring"],
          },
          {
            feature: "Multi-Component Workspaces",
            description:
              "defineComponent, per-component schema generation, and workspace routing. This is where support for the wider Convex component ecosystem starts.",
            status: ["exploring"],
          },
        ],
      },
      {
        blockType: BLOCK_SLUG_CTA,
        blockName: "CTA",
        id: "roadmap-cta",
        heading: "Scaffold it and see.",
        subheading:
          "One command gives you a Next.js app, a Convex deployment, auth, the admin panel, and a marketing site like this one. Seeded, editable, and yours.",
        actions: [
          { label: "Get started", href: "https://docs.vexcms.dev/guides/quickstart/" },
          { label: "View on GitHub", href: "https://github.com/ianyimi/vex" },
          { label: "Why Convex", href: "https://docs.convex.dev/realtime" },
        ],
      },
    ],
  }
  if (existingRoadmapPage) {
    if (mode === "patch") {
      await ctx.db.patch(TABLE_SLUG_PAGES, existingRoadmapPage._id, roadmapPageDoc)
      patched.push("page:roadmap")
    } else {
      skipped.push("page:roadmap")
    }
  } else {
    await ctx.db.insert(TABLE_SLUG_PAGES, roadmapPageDoc)
    created.push("page:roadmap")
  }

  return { created, patched, skipped }
}

/**
 * Seed a deployment, inserting only what is missing.
 *
 * This is what a fresh scaffold runs. It deliberately does NOT update a
 * document that already exists, so it can never clobber an editor's work —
 * which also means editing this file does nothing to an already-seeded
 * deployment. Use `reinit` for that.
 *
 * Run from terminal: `pnpm seed` (`npx convex run seed:init`)
 */
export const init = internalMutation({
  args: {},
  handler: async (ctx) => runSeed(ctx, "insert"),
})

/**
 * Re-seed a deployment, reconciling every seeded document in place.
 *
 * Same content as `init`, but an existing document is patched instead of
 * skipped, so this file becomes the source of truth for seeded content and a
 * content change ships by editing it and re-running. Nothing is deleted and
 * nothing is duplicated: documents are matched on name or slug, so ids,
 * relationships pointing at them, and any field this file does not set all
 * survive.
 *
 * This overwrites admin-panel edits to the fields seeded here. That is the
 * intended behaviour — it is a reconcile, not a merge.
 *
 * Run from terminal: `pnpm seed:reinit` (`npx convex run seed:reinit`)
 */
export const reinit = internalMutation({
  args: {},
  handler: async (ctx) => runSeed(ctx, "patch"),
})
