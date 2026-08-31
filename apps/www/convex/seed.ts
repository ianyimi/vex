import type { Id } from "./_generated/dataModel"

import { GLOBAL_SLUG_SITE_SETTINGS } from "~/db/constants"

import { mutation } from "./_generated/server"

// ============================================================================
// INIT — Fresh seed with block-based pages
// ============================================================================

/**
 * Initialize the site with default data for the Vex CMS marketing site.
 *
 * Run from terminal:
 *   npx convex run seed:init
 *
 * Creates:
 * - Site settings (site_settings collection)
 * - Default header with marketing nav
 * - Default footer with marketing links
 * - Default theme (Stark × Ember)
 * - 4 pages with block-based content: home, features, pricing, roadmap
 *
 * Safe to run multiple times — skips items that already exist.
 */
export const init = mutation({
  args: {},
  handler: async (ctx) => {
    const created: string[] = []
    const skipped: string[] = []

    async function insertIfMissing(
      table: string,
      indexName: string,
      indexField: string,
      lookupValue: string,
      data: Record<string, unknown>,
      label: string
    ) {
      const existing = await ctx.db
        .query(table as any)
        .withIndex(indexName, (q: any) => q.eq(indexField, lookupValue))
        .first()
      if (existing) {
        skipped.push(label)
      } else {
        await ctx.db.insert(table as any, data as any)
        created.push(label)
      }
    }

    async function insertIfEmpty(table: string, data: Record<string, unknown>, label: string) {
      const first = await ctx.db.query(table as any).first()
      if (first) {
        skipped.push(label)
      } else {
        await ctx.db.insert(table as any, data as any)
        created.push(label)
      }
    }

    // ── SITE SETTINGS ── singleton global, stored in vex_globals as { slug, data }
    const existingSettings = await ctx.db
      .query("vex_globals")
      .withIndex("by_slug", (q) => q.eq("slug", GLOBAL_SLUG_SITE_SETTINGS))
      .first()
    if (existingSettings) {
      skipped.push("siteSettings")
    } else {
      await ctx.db.insert("vex_globals", {
        slug: GLOBAL_SLUG_SITE_SETTINGS,
        data: { name: "Vex CMS", activeTheme: [], adminTheme: [] },
      })
      created.push("siteSettings")
    }

    // ── HEADER ──
    await insertIfMissing(
      "headers",
      "by_name",
      "name",
      "Main Header",
      {
        name: "Main Header",
        logoText: "Vex CMS",
        logoHref: "/",
        menuItems: JSON.stringify([
          { label: "Features", href: "/features" },
          { label: "Pricing", href: "/pricing" },
          { label: "Roadmap", href: "/roadmap" },
          { label: "Docs", href: "/docs" },
        ]),
        actionButtons: JSON.stringify([
          { label: "GitHub", href: "https://github.com/vexcms/vex", variant: "ghost" },
          { label: "Get Started", href: "/docs", variant: "default" },
        ]),
      },
      "header"
    )

    // ── FOOTER ──
    await insertIfMissing(
      "footers",
      "by_name",
      "name",
      "Main Footer",
      {
        name: "Main Footer",
        logoText: "Vex CMS",
        copyright: "Vex CMS. All rights reserved.",
        links: JSON.stringify([
          { label: "Features", href: "/features" },
          { label: "Pricing", href: "/pricing" },
          { label: "Roadmap", href: "/roadmap" },
          { label: "Documentation", href: "/docs" },
          { label: "GitHub", href: "https://github.com/vexcms/vex" },
          { label: "npm", href: "https://www.npmjs.com/package/vexcms" },
          { label: "Convex", href: "https://convex.dev" },
        ]),
        socialLinks: JSON.stringify([
          { platform: "GitHub", href: "https://github.com/vexcms/vex", icon: "Github" },
          { platform: "X", href: "https://x.com/vexcms", icon: "Twitter" },
        ]),
      },
      "footer"
    )

    // ── THEMES ── seeded by `seed:themes`, which also sets the active reference.

    // ── PAGES — block-based content ──

    // HOME
    await insertIfMissing(
      "pages",
      "by_slug",
      "slug",
      "home",
      {
        title: "Vex CMS — The CMS for Convex",
        slug: "home",
        metaTitle: "Vex CMS — The CMS Built for Convex",
        metaDescription:
          "A headless content management system powered by Convex. Real-time data, type-safe schemas, and a beautiful admin panel out of the box.",
        blocks: homeBlocks(),
      },
      "page:home"
    )

    // FEATURES
    await insertIfMissing(
      "pages",
      "by_slug",
      "slug",
      "features",
      {
        title: "Everything you need to manage content",
        slug: "features",
        metaTitle: "Features — Vex CMS",
        metaDescription:
          "16 field types, real-time queries, type-safe schemas, live preview, and a beautiful admin panel. Everything you need to manage content.",
        blocks: featuresBlocks(),
      },
      "page:features"
    )

    // PRICING
    await insertIfMissing(
      "pages",
      "by_slug",
      "slug",
      "pricing",
      {
        title: "Simple, transparent pricing",
        slug: "pricing",
        metaTitle: "Pricing — Vex CMS",
        metaDescription: "Vex CMS is open source and free. Enterprise features coming soon.",
        blocks: pricingBlocks(),
      },
      "page:pricing"
    )

    // ROADMAP
    await insertIfMissing(
      "pages",
      "by_slug",
      "slug",
      "roadmap",
      {
        title: "Roadmap",
        slug: "roadmap",
        metaTitle: "Roadmap — Vex CMS",
        metaDescription:
          "What we've shipped and what's coming next. Vex CMS is actively developed.",
        blocks: roadmapBlocks(),
      },
      "page:roadmap"
    )

    return {
      created,
      skipped,
      message: `Initialized ${created.length} items. Skipped ${skipped.length} (already exist).`,
    }
  },
})

// ============================================================================
// MIGRATE — Patch existing pages from legacy content → blocks
// ============================================================================

/**
 * Migration: Patch all existing pages with block-based content.
 *
 * Run from terminal:
 *   npx convex run seed:migratePagesToBlocks
 *
 * For each page in the `pages` table:
 * 1. If the page already has `blocks` data, it is skipped.
 * 2. If the page has legacy `content` text, it is parsed into structured blocks.
 * 3. If the page has neither, a default content block is added.
 *
 * The legacy `content` field is left intact for reference but is no longer used
 * by the page renderer.
 */
/**
 * Clear all test fields from pages and remove their data.
 *
 * Run from terminal:
 *   npx convex run seed:clearTestFields
 *
 * Unsets these fields on all pages:
 * - test (array field)
 * - test2 (nested array field)
 * - seo (group field)
 * - anotherTest (nested group field)
 *
 * Uses `undefined` to truly remove the fields from documents (not just empty strings).
 * After running, you can safely remove these fields from the pages collection schema.
 */
export const clearTestFields = mutation({
  args: {},
  handler: async (ctx) => {
    const pages = await ctx.db.query("pages").collect()
    const results: { slug: string; cleared: string[]; error?: string }[] = []

    for (const page of pages as any[]) {
      try {
        const cleared: string[] = []
        const unset: Record<string, undefined> = {}

        if (page.test !== undefined) {
          unset.test = undefined
          cleared.push("test")
        }
        if (page.test2 !== undefined) {
          unset.test2 = undefined
          cleared.push("test2")
        }
        if (page.seo !== undefined) {
          unset.seo = undefined
          cleared.push("seo")
        }
        if (page.anotherTest !== undefined) {
          unset.anotherTest = undefined
          cleared.push("anotherTest")
        }

        if (cleared.length > 0) {
          await ctx.db.patch(page._id, unset as any)
        }

        results.push({ slug: page.slug, cleared })
      } catch (err) {
        results.push({
          slug: page.slug,
          cleared: [],
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    const totalCleared = results.reduce((sum, r) => sum + r.cleared.length, 0)

    return {
      totalPages: pages.length,
      totalFieldsCleared: totalCleared,
      results,
      message: `Cleared ${totalCleared} test field instances across ${pages.length} pages.`,
    }
  },
})

export const migratePagesToBlocks = mutation({
  args: {},
  handler: async (ctx) => {
    const pages = await ctx.db.query("pages").collect()
    const results: { slug: string; status: "migrated" | "skipped" | "error"; message: string }[] =
      []

    for (const page of pages as any[]) {
      try {
        // Skip if blocks already exist and are non-empty
        if (page.blocks && Array.isArray(page.blocks) && page.blocks.length > 0) {
          results.push({ slug: page.slug, status: "skipped", message: "Already has blocks" })
          continue
        }

        const blocks = generateBlocksForPage(page)
        await ctx.db.patch(page._id, { blocks } as any)
        results.push({
          slug: page.slug,
          status: "migrated",
          message: `Created ${blocks.length} blocks`,
        })
      } catch (err) {
        results.push({
          slug: page.slug,
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return {
      total: pages.length,
      migrated: results.filter((r) => r.status === "migrated").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      errors: results.filter((r) => r.status === "error").length,
      results,
    }
  },
})

/**
 * Generates structured blocks for a page based on its existing content or slug.
 */
function generateBlocksForPage(page: {
  slug: string
  title: string
  content?: string
  metaTitle?: string
  metaDescription?: string
}) {
  // Try parsing legacy content first
  if (page.content && typeof page.content === "string" && page.content.includes("---")) {
    return parseLegacyContent(page.content, page.title)
  }

  // Fallback: generate blocks based on slug
  return generateDefaultBlocksForSlug(page.slug, page.title)
}

/**
 * Parses legacy content text with `--- SECTION ---` dividers into structured blocks.
 */
function parseLegacyContent(content: string, title: string) {
  const sections = content.split(/\n---\s*[^-\n]+\s*---\n/)
  const headers = content.match(/---\s*([^-\n]+)\s*---/g) || []
  const blocks: any[] = []

  // First section → hero if it's short enough, otherwise content
  const firstSection = sections[0]?.trim()
  if (firstSection) {
    const lines = firstSection.split("\n").filter((l) => l.trim())
    if (lines.length <= 3) {
      blocks.push({
        id: crypto.randomUUID(),
        blockType: "hero",
        blockName: "Imported Hero",
        title: lines[0] || title,
        subtitle: lines.slice(1).join(" ").substring(0, 200),
      })
    } else {
      blocks.push({
        id: crypto.randomUUID(),
        blockType: "content",
        blockName: "Imported Content",
        body: firstSection,
        align: ["left"],
        maxWidth: ["prose"],
      })
    }
  }

  // Remaining sections → content blocks
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i]?.trim()
    if (!section) continue

    const header = headers[i - 1]?.replace(/---/g, "").trim() || `Section ${i}`
    blocks.push({
      id: crypto.randomUUID(),
      blockType: "content",
      blockName: header,
      body: section,
      align: ["left"],
      maxWidth: ["prose"],
    })
  }

  // If no blocks were created, add a default content block
  if (blocks.length === 0) {
    blocks.push({
      id: crypto.randomUUID(),
      blockType: "content",
      blockName: "Content",
      body: content,
      align: ["left"],
      maxWidth: ["prose"],
    })
  }

  return blocks
}

/**
 * Generates default blocks for a page based on its slug.
 */
function generateDefaultBlocksForSlug(slug: string, title: string) {
  switch (slug) {
    case "home":
      return homeBlocks()
    case "features":
      return featuresBlocks()
    case "pricing":
      return pricingBlocks()
    case "roadmap":
      return roadmapBlocks()
    default:
      return [
        {
          id: crypto.randomUUID(),
          blockType: "hero",
          blockName: "Hero",
          title,
          subtitle: `Welcome to the ${title} page.`,
          primaryCtaLabel: "Learn More",
          primaryCtaHref: `/${slug}`,
        },
        {
          id: crypto.randomUUID(),
          blockType: "content",
          blockName: "Content",
          body: `Content for the ${title} page goes here. Edit this block in the admin panel.`,
          align: ["left"],
          maxWidth: ["prose"],
        },
      ]
  }
}

// ============================================================================
// Block generators — proper copy for each page type
// ============================================================================

function homeBlocks() {
  return [
    {
      id: crypto.randomUUID(),
      blockType: "hero",
      blockName: "Main Hero",
      badge: "Now in Public Beta",
      title: "The CMS for Convex",
      subtitle:
        "Vex CMS gives you a full-featured content management system powered by Convex — real-time data, type-safe schemas, and a beautiful admin panel out of the box.",
      primaryCtaLabel: "Get Started",
      primaryCtaHref: "/docs",
      secondaryCtaLabel: "View on GitHub",
      secondaryCtaHref: "https://github.com/vexcms/vex",
    },
    {
      id: crypto.randomUUID(),
      blockType: "stats",
      blockName: "Key Metrics",
      title: "Trusted by developers worldwide",
      stats: [
        { value: "16+", label: "Field Types" },
        { value: "100%", label: "TypeScript" },
        { value: "<50ms", label: "Avg Query Time" },
        { value: "∞", label: "Real-Time Updates" },
      ],
    },
    {
      id: crypto.randomUUID(),
      blockType: "feature",
      blockName: "Real-Time by Default",
      icon: "Zap",
      title: "Real-Time by Default",
      description:
        "Every query is live. Content updates appear instantly across all connected clients — no polling, no webhooks.",
    },
    {
      id: crypto.randomUUID(),
      blockType: "feature",
      blockName: "Type-Safe Schemas",
      icon: "ShieldCheck",
      title: "Type-Safe Schemas",
      description:
        "Define your collections with TypeScript. Vex generates Convex schemas, Zod validators, and typed queries automatically.",
    },
    {
      id: crypto.randomUUID(),
      blockType: "feature",
      blockName: "Developer First",
      icon: "Code",
      title: "Developer First",
      description:
        "Code-first configuration, CLI tooling, and a clean API. Build with the tools you already know and love.",
    },
    {
      id: crypto.randomUUID(),
      blockType: "logo-cloud",
      blockName: "Trusted By",
      title: "Built on technology you trust",
      logos: [
        { name: "Convex", image: "/logos/convex.svg", link: "https://convex.dev" },
        {
          name: "TypeScript",
          image: "/logos/typescript.svg",
          link: "https://www.typescriptlang.org",
        },
        { name: "Next.js", image: "/logos/nextjs.svg", link: "https://nextjs.org" },
        { name: "Tailwind", image: "/logos/tailwind.svg", link: "https://tailwindcss.com" },
        { name: "Vercel", image: "/logos/vercel.svg", link: "https://vercel.com" },
      ],
    },
    {
      id: crypto.randomUUID(),
      blockType: "testimonial",
      blockName: "Developer Quote",
      quote:
        "Vex CMS cut our content workflow in half. Real-time previews mean our editors never wait for a deploy — and the type safety means our devs never guess.",
      authorName: "Sarah Chen",
      authorRole: "Lead Engineer, Acme Inc.",
      company: "Acme Inc.",
      rating: 5,
    },
    {
      id: crypto.randomUUID(),
      blockType: "faq",
      blockName: "FAQ",
      title: "Frequently asked questions",
      questions: [
        {
          question: "What is Vex CMS?",
          answer:
            "A headless CMS built on Convex with real-time data, type-safe schemas, draft/publish workflows, live preview, and an admin panel.",
        },
        {
          question: "How is Vex different?",
          answer:
            "Unlike traditional headless CMS platforms, Vex is powered by Convex's real-time database. Content updates are instant across all clients.",
        },
        {
          question: "Is Vex CMS free?",
          answer:
            "Yes, open source and free. You only pay for Convex usage, which has a generous free tier.",
        },
        {
          question: "How do I get started?",
          answer: "Run npx create-vexcms@latest to scaffold a new project in under a minute.",
        },
      ],
    },
    {
      id: crypto.randomUUID(),
      blockType: "cta",
      blockName: "Final CTA",
      title: "Ready to build?",
      description: "Scaffold your first Vex CMS project in under a minute.",
      buttonLabel: "Get Started",
      buttonHref: "/docs",
      variant: ["default"],
    },
  ]
}

function featuresBlocks() {
  return [
    {
      id: crypto.randomUUID(),
      blockType: "hero",
      blockName: "Features Hero",
      badge: "Features",
      title: "Everything You Need to Manage Content",
      subtitle:
        "Built on Convex's real-time infrastructure with a developer experience that doesn't compromise on power.",
    },
    {
      id: crypto.randomUUID(),
      blockType: "feature",
      blockName: "16 Field Types",
      icon: "Layers",
      title: "16 Field Types",
      description:
        "Text, number, select, date, relationship, upload, richtext, blocks, color, tabs, and more.",
    },
    {
      id: crypto.randomUUID(),
      blockType: "feature",
      blockName: "Admin Panel",
      icon: "LayoutDashboard",
      title: "Full Admin Panel",
      description:
        "List views, edit forms, media library, and draft/publish workflow — all out of the box.",
    },
    {
      id: crypto.randomUUID(),
      blockType: "feature",
      blockName: "Real-Time Queries",
      icon: "Activity",
      title: "Real-Time Queries",
      description:
        "Every query is live via Convex. Content updates appear instantly across all connected clients.",
    },
    {
      id: crypto.randomUUID(),
      blockType: "feature",
      blockName: "Live Preview",
      icon: "Eye",
      title: "Live Preview",
      description:
        "Side-by-side iframe preview with responsive breakpoints and real-time updates as you edit.",
    },
    {
      id: crypto.randomUUID(),
      blockType: "feature",
      blockName: "Block System",
      icon: "Blocks",
      title: "Composable Blocks",
      description:
        "Compose pages from reusable content blocks with drag-and-drop reordering and inline editing.",
    },
    {
      id: crypto.randomUUID(),
      blockType: "feature",
      blockName: "Auth & RBAC",
      icon: "ShieldCheck",
      title: "Auth & RBAC",
      description:
        "Better Auth integration with role-based access control at the document and field level.",
    },
    {
      id: crypto.randomUUID(),
      blockType: "feature",
      blockName: "Rich Text Editor",
      icon: "Type",
      title: "Rich Text Editor",
      description:
        "Plate.js-powered editor with media uploads, links, tables, and custom elements.",
    },
    {
      id: crypto.randomUUID(),
      blockType: "feature",
      blockName: "CLI & Scaffolding",
      icon: "Terminal",
      title: "CLI & Scaffolding",
      description: "vex dev with watch/generate, and create-vexcms for instant project setup.",
    },
    {
      id: crypto.randomUUID(),
      blockType: "feature",
      blockName: "Theme System",
      icon: "Palette",
      title: "Theme System",
      description:
        "Database-driven themes with light/dark mode, CSS variables, and OKLCH color support.",
    },
    {
      id: crypto.randomUUID(),
      blockType: "feature",
      blockName: "Block Styles",
      icon: "Paintbrush",
      title: "Block Styles",
      description:
        "Per-block responsive styling with Tailwind presets — margin, padding, typography, layout, and more.",
    },
    {
      id: crypto.randomUUID(),
      blockType: "cta",
      blockName: "Dev Experience CTA",
      title: "TypeScript-First, Code-First",
      description:
        "Every collection, field, and query is fully typed. Schema changes propagate to your IDE instantly. Vex generates Convex schemas, typed queries, and Zod validators automatically.",
      buttonLabel: "Read the Docs",
      buttonHref: "/docs",
      variant: ["outline"],
    },
    {
      id: crypto.randomUUID(),
      blockType: "cta",
      blockName: "Content Management CTA",
      title: "Draft, Publish, Version, Repeat",
      description:
        "Save drafts and publish when ready. Full version history for every document. Track every change with automatic version snapshots. Roll back to any previous state.",
      buttonLabel: "Try It Out",
      buttonHref: "/admin",
      variant: ["ghost"],
    },
  ]
}

function pricingBlocks() {
  return [
    {
      id: crypto.randomUUID(),
      blockType: "hero",
      blockName: "Pricing Hero",
      badge: "Open Source",
      title: "Simple, Transparent Pricing",
      subtitle: "Vex CMS is free and open source. You only pay for Convex usage.",
      primaryCtaLabel: "Get Started Free",
      primaryCtaHref: "/docs",
      secondaryCtaLabel: "View on GitHub",
      secondaryCtaHref: "https://github.com/vexcms/vex",
    },
    {
      id: crypto.randomUUID(),
      blockType: "pricing",
      blockName: "Open Source Plan",
      planName: "Open Source",
      price: "Free",
      period: "forever",
      description: "All core features included. MIT licensed.",
      features: [
        "All 16 field types",
        "Admin panel with list views & edit forms",
        "Real-time queries via Convex",
        "Live preview with responsive breakpoints",
        "Block system with drag-and-drop",
        "Authentication & RBAC",
        "Rich text editor (Plate.js)",
        "CLI & scaffolding tools",
        "Theme system with CSS variables",
        "Block styles with Tailwind presets",
      ],
      ctaLabel: "Get Started",
      ctaHref: "/docs",
    },
    {
      id: crypto.randomUUID(),
      blockType: "pricing",
      blockName: "Enterprise Plan",
      planName: "Enterprise",
      price: "Coming Soon",
      period: "",
      description: "Advanced features for teams and organizations.",
      features: [
        "Content environments (staging & production)",
        "SAML/OIDC single sign-on",
        "Multi-step approval workflows",
        "Audit log with retention policies",
        "i18n field variants & translation workflows",
        "Priority support",
      ],
      ctaLabel: "Join Waitlist",
      ctaHref: "/contact",
      highlighted: true,
      badge: "Coming Soon",
    },
    {
      id: crypto.randomUUID(),
      blockType: "faq",
      blockName: "Pricing FAQ",
      title: "Frequently asked questions",
      questions: [
        {
          question: "Is it really free?",
          answer:
            "Yes, Vex CMS is MIT licensed. You only pay for Convex hosting, which has a generous free tier.",
        },
        {
          question: "What about Convex costs?",
          answer:
            "Convex's free tier handles most small projects. Paid plans start when you exceed free tier limits.",
        },
        {
          question: "What does Enterprise include?",
          answer:
            "Content environments, SSO, approval workflows, audit log, and localization — all built for team and compliance needs.",
        },
      ],
    },
  ]
}

function roadmapBlocks() {
  return [
    {
      id: crypto.randomUUID(),
      blockType: "hero",
      blockName: "Roadmap Hero",
      badge: "Roadmap",
      title: "What We've Shipped & What's Coming Next",
      subtitle: "Vex CMS is actively developed. Here's where we're headed.",
    },
    {
      id: crypto.randomUUID(),
      blockType: "stats",
      blockName: "Shipped Stats",
      title: "Shipped",
      stats: [
        { value: "16", label: "Field Types" },
        { value: "✓", label: "Admin Panel" },
        { value: "✓", label: "Real-Time" },
        { value: "✓", label: "Live Preview" },
        { value: "✓", label: "Blocks" },
        { value: "✓", label: "Auth & RBAC" },
        { value: "✓", label: "Rich Text" },
        { value: "✓", label: "CLI" },
        { value: "✓", label: "Themes" },
        { value: "✓", label: "Block Styles" },
      ],
    },
    {
      id: crypto.randomUUID(),
      blockType: "content",
      blockName: "Coming Soon",
      body: "**Content Scheduling** — Set a publishAt timestamp and content goes live automatically.\n\n**Team Management** — Invite users, assign roles, and manage pending invitations.\n\n**API Keys** — Read-only API tokens for external integrations with configurable rate limiting.\n\n**Audit Log** — Track who changed what and when across all collections and documents.",
      align: ["left"],
      maxWidth: ["wide"],
    },
    {
      id: crypto.randomUUID(),
      blockType: "content",
      blockName: "Planned",
      body: "**Environments** — Project-level content branching with staging and production environments.\n\n**Localization** — i18n field variants with per-locale versioning and content translation workflows.\n\n**Approval Workflows** — Review and sign-off steps before content goes live.\n\n**Plugin System** — Extend Vex with community plugins for custom fields, integrations, and admin panel features.",
      align: ["left"],
      maxWidth: ["wide"],
    },
    {
      id: crypto.randomUUID(),
      blockType: "cta",
      blockName: "Roadmap CTA",
      title: "Want to shape the roadmap?",
      description: "Join our community and help us prioritize what matters most to you.",
      buttonLabel: "Join the Discussion",
      buttonHref: "https://github.com/vexcms/vex/discussions",
      variant: ["outline"],
    },
  ]
}

// ============================================================================
// EDITORIAL — Seed data for exercising the shared access rules
// ============================================================================

/**
 * Seed the editorial collections with rows spanning every access outcome.
 *
 * Run from terminal:
 *   npx convex run seed:editorial
 *
 * Assigns authorship to the two oldest users so ownership rules have something to
 * discriminate on: user A authors the published rows plus one draft, user B authors
 * the rest. Sign in as each and the same rule set yields visibly different tables.
 *
 * What each role should see afterwards, per `~/auth/access.ts`:
 * - `admin`        — everything.
 * - `editor`       — everything in articles/case_studies/changelog/comments.
 * - `contributor`  — only the rows they authored, any status.
 * - `user`         — only `published` rows, and no comments at all.
 *
 * Safe to run multiple times — skips rows whose slug already exists.
 */
export const editorial = mutation({
  args: {},
  handler: async (ctx) => {
    const created: string[] = []
    const skipped: string[] = []

    const users = await ctx.db.query("user").take(2)
    if (users.length === 0) {
      throw new Error("seed:editorial needs at least one user — sign in once, then run this again.")
    }
    // Falls back to the same author when only one user exists: the status rules still
    // demonstrate, only the ownership split goes flat.
    const authorA = users[0]._id
    const authorB = users[1]?._id ?? users[0]._id

    // Generic over the table so the returned id narrows to it — `comments` below needs
    // a real `Id<"articles">`, not a union across all three. Convex's generated query
    // types cannot resolve a shared index name through a generic table parameter, so
    // the table is widened to one concrete literal INSIDE the helper. All three declare
    // `by_slug` over `["slug"]`, which is what makes that widening sound.
    type EditorialTable = "articles" | "case_studies" | "changelog"
    async function insertBySlug<T extends EditorialTable>(
      table: T,
      slug: string,
      data: Record<string, unknown>
    ): Promise<Id<T>> {
      const existing = await ctx.db
        .query(table as "articles")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first()
      if (existing) {
        skipped.push(`${table}/${slug}`)
        return existing._id as Id<T>
      }
      const id = await ctx.db.insert(table, { slug, ...data } as never)
      created.push(`${table}/${slug}`)
      return id
    }

    // ── Articles ───────────────────────────────────────────────────────────
    const publishedArticle = await insertBySlug("articles", "why-convex", {
      title: "Why we built VexCMS on Convex",
      excerpt: "Reactive queries turn out to be the right primitive for a CMS.",
      body: "Convex gives us live queries, transactional mutations, and typed indexes.",
      status: ["published"],
      publishedAt: Date.now() - 86_400_000 * 14,
      readingMinutes: 7,
      featured: true,
      authorId: [authorA],
    })

    await insertBySlug("articles", "field-types-deep-dive", {
      title: "A deep dive on field types",
      excerpt: "Every field is a value, and that is the whole trick.",
      body: "Draft in progress.",
      status: ["draft"],
      readingMinutes: 12,
      featured: false,
      authorId: [authorA],
    })

    await insertBySlug("articles", "access-control-patterns", {
      title: "Access control patterns that scale",
      excerpt: "Define the constraint once, apply it everywhere.",
      body: "In review.",
      status: ["review"],
      readingMinutes: 9,
      featured: false,
      authorId: [authorB],
    })

    // ── Case studies ───────────────────────────────────────────────────────
    await insertBySlug("case_studies", "maprios", {
      title: "Maprios cuts publish time by 60%",
      excerpt: "Migrating off a Node CMS onto Convex.",
      status: ["published"],
      publishedAt: Date.now() - 86_400_000 * 30,
      clientName: "Maprios",
      industry: "Logistics",
      clientUrl: "https://maprios.com",
      outcomeSummary: "Publish-to-live dropped from 90s to 35s.",
      contractValue: 48_000,
      authorId: [authorA],
    })

    await insertBySlug("case_studies", "northwind-rebuild", {
      title: "Northwind rebuilds its docs site",
      excerpt: "Unreleased — pricing still under review.",
      status: ["draft"],
      clientName: "Northwind",
      industry: "Manufacturing",
      outcomeSummary: "Pending sign-off.",
      contractValue: 22_500,
      authorId: [authorB],
    })

    // ── Changelog ──────────────────────────────────────────────────────────
    await insertBySlug("changelog", "v0-4-0", {
      title: "Shared access rules",
      excerpt: "One constraint, many resources.",
      status: ["published"],
      publishedAt: Date.now() - 86_400_000 * 3,
      version: "0.4.0",
      releaseType: ["minor"],
      breaking: false,
      notes: "- composable access checks\n- index pushdown per resource",
      authorId: [authorA],
    })

    await insertBySlug("changelog", "v0-5-0", {
      title: "Versioning and drafts",
      excerpt: "Unreleased.",
      status: ["draft"],
      version: "0.5.0",
      releaseType: ["minor"],
      breaking: true,
      notes: "- draft/publish workflow",
      authorId: [authorB],
    })

    // ── Comments ───────────────────────────────────────────────────────────
    // No `status` field, so only the ownership rules reach these — which is the
    // partial-overlap case the shared rules are meant to prove.
    const existingComments = await ctx.db
      .query("comments")
      .withIndex("by_article", (q) => q.eq("article", [publishedArticle]))
      .collect()
    if (existingComments.length > 0) {
      skipped.push("comments (already seeded)")
    } else {
      await ctx.db.insert("comments", {
        body: "This matches what we saw migrating our own site.",
        article: [publishedArticle],
        approved: true,
        authorId: [authorB],
      })
      await ctx.db.insert("comments", {
        body: "Awaiting moderation — should be hidden from readers.",
        article: [publishedArticle],
        approved: false,
        authorId: [authorA],
      })
      created.push("comments x2")
    }

    return {
      authorA,
      authorB,
      created,
      skipped,
      note: "Sign in as each author and compare the tables: contributor sees only their own rows, user sees only published ones.",
    }
  },
})

// ============================================================================
// THEMES — full 32-token shadcn palettes
// ============================================================================

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
 * Seed the theme presets and point `siteSettings.activeTheme` at one.
 *
 * Run from terminal:
 *   npx convex run seed:themes
 *   npx convex run seed:themes '{"activate":"Violet Bloom"}'
 *
 * Requires `seed:init` to have run first — that is what creates the
 * siteSettings global. Safe to run repeatedly: existing themes are skipped by
 * name, and only the active reference is rewritten. `adminTheme` is left alone,
 * so the admin panel keeps following the site theme unless you set it by hand.
 *
 * @param activate - Theme name to set active. Defaults to "Stark × Ember".
 */
export const themes = mutation({
  args: {},
  handler: async (ctx, args: { activate?: string }) => {
    const created: string[] = []
    const skipped: string[] = []

    for (const preset of THEME_PRESETS) {
      const existing = await ctx.db
        .query("themes")
        .withIndex("by_name", (q) => q.eq("name", preset.name))
        .first()
      if (existing) {
        skipped.push(preset.name)
      } else {
        await ctx.db.insert("themes", preset)
        created.push(preset.name)
      }
    }

    const activateName = args.activate ?? "Stark × Ember"
    const target = await ctx.db
      .query("themes")
      .withIndex("by_name", (q) => q.eq("name", activateName))
      .first()
    if (!target) {
      throw new Error(
        `No theme named "${activateName}". Seeded: ${THEME_PRESETS.map((p) => p.name).join(", ")}.`
      )
    }

    const settings = await ctx.db
      .query("vex_globals")
      .withIndex("by_slug", (q) => q.eq("slug", GLOBAL_SLUG_SITE_SETTINGS))
      .first()
    if (!settings) {
      throw new Error("siteSettings global not found — run 'npx convex run seed:init' first.")
    }
    // The vex_globals schema stores `data: v.any()`; getGlobal owns the real
    // shape, so name the record type once instead of spreading `any`.
    const settingsData = (settings.data ?? {}) as Record<string, unknown>
    await ctx.db.patch(settings._id, {
      data: { ...settingsData, activeTheme: [target._id] },
    })

    return {
      created,
      skipped,
      active: activateName,
      note: "Reload the app — both site and admin follow siteSettings.activeTheme.",
    }
  },
})
