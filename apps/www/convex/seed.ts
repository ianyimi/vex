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
      label: string,
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

    async function insertIfEmpty(
      table: string,
      data: Record<string, unknown>,
      label: string,
    ) {
      const first = await ctx.db.query(table as any).first()
      if (first) {
        skipped.push(label)
      } else {
        await ctx.db.insert(table as any, data as any)
        created.push(label)
      }
    }

    // ── SITE SETTINGS ──
    await insertIfEmpty("site_settings", {
      name: "Vex CMS",
    }, "site_settings")

    // ── HEADER ──
    await insertIfMissing("headers", "by_name", "name", "Main Header", {
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
    }, "header")

    // ── FOOTER ──
    await insertIfMissing("footers", "by_name", "name", "Main Footer", {
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
    }, "footer")

    // ── THEME — Stark × Ember ──
    await insertIfMissing("themes", "by_name", "name", "Stark × Ember", {
      name: "Stark × Ember",
      fontFamily: "Geist, Inter, system-ui, sans-serif",
      radius: "0.25rem",
      primaryLight: "#E8622A",
      primaryDark: "#F07040",
      bgDark: "#0A0A0A",
      bgLight: "#F5F5F5",
    }, "theme")

    // ── PAGES — block-based content ──

    // HOME
    await insertIfMissing("pages", "by_slug", "slug", "home", {
      title: "Vex CMS — The CMS for Convex",
      slug: "home",
      metaTitle: "Vex CMS — The CMS Built for Convex",
      metaDescription: "A headless content management system powered by Convex. Real-time data, type-safe schemas, and a beautiful admin panel out of the box.",
      blocks: homeBlocks(),
    }, "page:home")

    // FEATURES
    await insertIfMissing("pages", "by_slug", "slug", "features", {
      title: "Everything you need to manage content",
      slug: "features",
      metaTitle: "Features — Vex CMS",
      metaDescription: "16 field types, real-time queries, type-safe schemas, live preview, and a beautiful admin panel. Everything you need to manage content.",
      blocks: featuresBlocks(),
    }, "page:features")

    // PRICING
    await insertIfMissing("pages", "by_slug", "slug", "pricing", {
      title: "Simple, transparent pricing",
      slug: "pricing",
      metaTitle: "Pricing — Vex CMS",
      metaDescription: "Vex CMS is open source and free. Enterprise features coming soon.",
      blocks: pricingBlocks(),
    }, "page:pricing")

    // ROADMAP
    await insertIfMissing("pages", "by_slug", "slug", "roadmap", {
      title: "Roadmap",
      slug: "roadmap",
      metaTitle: "Roadmap — Vex CMS",
      metaDescription: "What we've shipped and what's coming next. Vex CMS is actively developed.",
      blocks: roadmapBlocks(),
    }, "page:roadmap")

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
    const results: { slug: string; status: "migrated" | "skipped" | "error"; message: string }[] = []

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
        { name: "TypeScript", image: "/logos/typescript.svg", link: "https://www.typescriptlang.org" },
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
          answer: "Yes, open source and free. You only pay for Convex usage, which has a generous free tier.",
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
      description:
        "vex dev with watch/generate, and create-vexcms for instant project setup.",
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
      body:
        "**Content Scheduling** — Set a publishAt timestamp and content goes live automatically.\n\n**Team Management** — Invite users, assign roles, and manage pending invitations.\n\n**API Keys** — Read-only API tokens for external integrations with configurable rate limiting.\n\n**Audit Log** — Track who changed what and when across all collections and documents.",
      align: ["left"],
      maxWidth: ["wide"],
    },
    {
      id: crypto.randomUUID(),
      blockType: "content",
      blockName: "Planned",
      body:
        "**Environments** — Project-level content branching with staging and production environments.\n\n**Localization** — i18n field variants with per-locale versioning and content translation workflows.\n\n**Approval Workflows** — Review and sign-off steps before content goes live.\n\n**Plugin System** — Extend Vex with community plugins for custom fields, integrations, and admin panel features.",
      align: ["left"],
      maxWidth: ["wide"],
    },
    {
      id: crypto.randomUUID(),
      blockType: "cta",
      blockName: "Roadmap CTA",
      title: "Want to shape the roadmap?",
      description:
        "Join our community and help us prioritize what matters most to you.",
      buttonLabel: "Join the Discussion",
      buttonHref: "https://github.com/vexcms/vex/discussions",
      variant: ["outline"],
    },
  ]
}
