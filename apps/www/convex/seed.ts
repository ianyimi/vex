import { internalMutation } from "./_generated/server"

/**
 * Seed the database with marketing site pages, header, and footer.
 *
 * Run from terminal:
 *   npx convex run seed:seedMarketingSite
 *
 * This will create 4 pages (home, features, pricing, roadmap),
 * a header, and a footer — all with full block content.
 *
 * Safe to run multiple times — skips pages/headers/footers that already exist.
 */
export const seedMarketingSite = internalMutation({
  args: {},
  handler: async (ctx) => {
    const created: string[] = []
    const skipped: string[] = []

    // --- Helper: check if page slug already exists ---
    async function pageExists(slug: string) {
      return await ctx.db
        .query("pages")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first()
    }

    // --- Helper: check if header/footer name already exists ---
    async function headerExists(name: string) {
      return await ctx.db
        .query("headers")
        .withIndex("by_name", (q) => q.eq("name", name))
        .first()
    }

    async function footerExists(name: string) {
      return await ctx.db
        .query("footers")
        .withIndex("by_name", (q) => q.eq("name", name))
        .first()
    }

    // ===========================
    // PAGE: Home
    // ===========================
    if (await pageExists("home")) {
      skipped.push("home")
    } else {
      await ctx.db.insert("pages", {
        title: "Home",
        slug: "home",
        vex_status: "published",
        vex_version: 1,
        vex_publishedAt: Date.now(),
        content: [
          {
            blockType: "hero",
            blockName: "Hero",
            _key: "home-hero",
            badgeText: "Now in public beta",
            badgeLink: "/roadmap",
            heading: "The CMS built for Convex",
            subheading:
              "Vex CMS gives you a full-featured content management system powered by Convex — real-time data, type-safe schemas, and a beautiful admin panel out of the box.",
            primaryCtaLabel: "Get Started",
            primaryCtaHref: "/docs",
            secondaryCtaLabel: "View on GitHub",
            secondaryCtaHref: "https://github.com/vexcms/vex",
          },
          {
            blockType: "features",
            blockName: "Core Features",
            _key: "home-features",
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
            blockType: "how_it_works",
            blockName: "How It Works",
            _key: "home-how-it-works",
            heading: "Get started in minutes",
            subheading:
              "From zero to a fully functional CMS in four steps. No boilerplate, no config files to wrestle with.",
            steps: [
              {
                icon: "Terminal",
                title: "Scaffold your project",
                description:
                  "Run npx create-vexcms@latest to get a Next.js app with Convex, authentication, and the admin panel pre-configured.",
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
                  "Compose pages from reusable content blocks. Each block is a React component with a typed config — drag, drop, and edit inline from the admin panel.",
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
            blockType: "faq",
            blockName: "FAQ",
            _key: "home-faq",
            heading: "Frequently Asked Questions",
            subheading:
              "Everything you need to know about Vex CMS and building with Convex.",
            supportLink: "https://github.com/vexcms/vex/issues",
            items: [
              {
                question: "What is Vex CMS?",
                answer:
                  "Vex CMS is a headless content management system built on Convex. It provides real-time data, type-safe schemas, draft/publish workflows, live preview, and a beautiful admin panel — all configured with TypeScript.",
              },
              {
                question:
                  "How is Vex different from other headless CMS platforms?",
                answer:
                  "Unlike traditional headless CMS platforms that use REST or GraphQL APIs, Vex is powered by Convex's real-time database. This means content updates are instant across all clients, with no polling or webhooks needed. Your schema is defined in code, giving you full type safety from database to frontend.",
              },
              {
                question: "Do I need to know Convex to use Vex CMS?",
                answer:
                  "Basic familiarity with Convex helps, but Vex handles most of the complexity for you. The CLI generates your Convex schema, queries, and types automatically from your collection definitions. You just define your fields and Vex does the rest.",
              },
              {
                question: "Can I use Vex with any frontend framework?",
                answer:
                  "Vex CMS is framework-agnostic at the data layer — any app that can use Convex can use Vex. The admin panel and UI components are built for Next.js, but the core package and generated queries work with any Convex-compatible frontend.",
              },
              {
                question: "Is Vex CMS free?",
                answer:
                  "Yes, Vex CMS is open source and free to use. You only pay for your Convex usage, which has a generous free tier for most projects.",
              },
              {
                question: "How do I get started?",
                answer:
                  "Run `npx create-vexcms@latest` to scaffold a new project with Vex CMS pre-configured. The CLI sets up your Next.js app, Convex backend, authentication, and admin panel in under a minute.",
              },
            ],
          },
          {
            blockType: "cta",
            blockName: "CTA",
            _key: "home-cta",
            heading: "Ready to build with Vex CMS?",
            subheading:
              "Get started in minutes with create-vexcms. Real-time content management powered by Convex.",
            actions: [
              { label: "Get Started", href: "/docs" },
              {
                label: "View on GitHub",
                href: "https://github.com/vexcms/vex",
              },
            ],
          },
        ],
      })
      created.push("home")
    }

    // ===========================
    // PAGE: Features
    // ===========================
    if (await pageExists("features")) {
      skipped.push("features")
    } else {
      await ctx.db.insert("pages", {
        title: "Features",
        slug: "features",
        vex_status: "published",
        vex_version: 1,
        vex_publishedAt: Date.now(),
        content: [
          {
            blockType: "hero",
            blockName: "Features Hero",
            _key: "features-hero",
            heading: "Everything you need to manage content",
            subheading:
              "Vex CMS is a complete headless CMS built from the ground up for Convex. 16 field types, a full admin panel, real-time queries, and a CLI that does the heavy lifting.",
            primaryCtaLabel: "Get Started",
            primaryCtaHref: "/docs",
            secondaryCtaLabel: "View Pricing",
            secondaryCtaHref: "/pricing",
          },
          {
            blockType: "features",
            blockName: "Core Platform",
            _key: "features-core",
            heading: "Core Platform",
            subheading:
              "The foundation that makes Vex different from every other CMS.",
            features: [
              {
                title: "16 Field Types",
                description:
                  "Text, number, select, date, relationship, upload, richtext, blocks, color, tabs, object, array, checkbox, json, imageUrl, and UI fields.",
                icon: "Layers",
              },
              {
                title: "Real-Time Queries",
                description:
                  "Every query is a live subscription via Convex. Content changes propagate instantly to all connected clients — no polling, no cache invalidation.",
                icon: "Zap",
              },
              {
                title: "Admin Panel",
                description:
                  "A complete admin UI with list views, edit forms, media library, and a block-based page builder. Works out of the box.",
                icon: "LayoutDashboard",
              },
              {
                title: "Block System",
                description:
                  "Compose pages from reusable content blocks with drag-and-drop reordering, inline editing, and a visual block picker.",
                icon: "Blocks",
              },
              {
                title: "CLI Tooling",
                description:
                  "vex dev watches your config and auto-generates Convex schemas, TypeScript types, and collection queries. create-vexcms scaffolds new projects instantly.",
                icon: "Terminal",
              },
              {
                title: "Theme System",
                description:
                  "Database-driven themes with light/dark mode, OKLCH color support, and CSS variable injection. Edit colors live from the admin panel.",
                icon: "Palette",
              },
            ],
          },
          {
            blockType: "features",
            blockName: "Developer Experience",
            _key: "features-dx",
            heading: "Developer Experience",
            subheading:
              "Built by developers, for developers. Every API is typed, every pattern is documented.",
            features: [
              {
                title: "TypeScript-First",
                description:
                  "defineCollection(), defineBlock(), and field helpers give you full type inference from your config all the way to your frontend components.",
                icon: "FileCode",
              },
              {
                title: "Code Generation",
                description:
                  "The CLI generates Convex schemas, Zod validators, TypeScript interfaces, and CRUD queries from your collection definitions. No boilerplate.",
                icon: "Sparkles",
              },
              {
                title: "Auto-Migration",
                description:
                  "Schema changes are detected automatically. The CLI generates and applies migration steps so you never have to write migration scripts by hand.",
                icon: "RefreshCw",
              },
              {
                title: "Live Preview",
                description:
                  "Side-by-side iframe preview with responsive breakpoints. See changes in real-time as you edit content in the admin panel.",
                icon: "Eye",
              },
              {
                title: "Block Styles",
                description:
                  "Per-block responsive styling with Tailwind presets. Control margin, padding, typography, and layout from a visual panel — per breakpoint.",
                icon: "PaintBucket",
              },
              {
                title: "Custom Components",
                description:
                  "Pass React components directly to field and block configs. No path strings, no magic — just components with typed props.",
                icon: "Component",
              },
            ],
          },
          {
            blockType: "features",
            blockName: "Content Management",
            _key: "features-content",
            heading: "Content Management",
            subheading:
              "Everything your content team needs to create, review, and publish with confidence.",
            features: [
              {
                title: "Draft & Publish",
                description:
                  "Full versioning with draft/published workflow. Save drafts, preview changes, and publish when ready. Roll back to any previous version.",
                icon: "FileCheck",
              },
              {
                title: "Rich Text Editor",
                description:
                  "Plate.js-powered editor with media uploads, links, tables, and custom elements. Renders to React Server Components.",
                icon: "Type",
              },
              {
                title: "Authentication & RBAC",
                description:
                  "Better Auth integration with role-based access control. Set permissions at the collection, document, and field level.",
                icon: "Shield",
              },
              {
                title: "Media Library",
                description:
                  "Upload, browse, and manage images and files with Convex file storage. Drag-and-drop uploads with MIME type filtering.",
                icon: "Image",
              },
              {
                title: "Globals",
                description:
                  "Define site-wide settings like SEO metadata, active theme, and navigation with defineGlobal(). Draft-aware with versioning support.",
                icon: "Globe",
              },
              {
                title: "Onboarding",
                description:
                  "Guided tours for new admin users powered by driver.js. Per-user tracking so the tour only shows once.",
                icon: "GraduationCap",
              },
            ],
          },
          {
            blockType: "cta",
            blockName: "CTA",
            _key: "features-cta",
            heading: "Start building today",
            subheading:
              "Scaffold a new project in under a minute with create-vexcms.",
            actions: [
              { label: "Get Started", href: "/docs" },
              {
                label: "View on GitHub",
                href: "https://github.com/vexcms/vex",
              },
            ],
          },
        ],
      })
      created.push("features")
    }

    // ===========================
    // PAGE: Pricing
    // ===========================
    if (await pageExists("pricing")) {
      skipped.push("pricing")
    } else {
      await ctx.db.insert("pages", {
        title: "Pricing",
        slug: "pricing",
        vex_status: "published",
        vex_version: 1,
        vex_publishedAt: Date.now(),
        content: [
          {
            blockType: "hero",
            blockName: "Pricing Hero",
            _key: "pricing-hero",
            heading: "Simple, transparent pricing",
            subheading:
              "Vex CMS is open source and free to use. You only pay for your Convex usage, which has a generous free tier for most projects.",
            primaryCtaLabel: "Get Started Free",
            primaryCtaHref: "/docs",
            secondaryCtaLabel: "View Features",
            secondaryCtaHref: "/features",
          },
          {
            blockType: "features",
            blockName: "Pricing Tiers",
            _key: "pricing-tiers",
            heading: "Choose your plan",
            subheading:
              "Everything in the core is free forever. Enterprise features are coming for teams that need more.",
            features: [
              {
                title: "Open Source — Free",
                description:
                  "MIT licensed. 16 field types, admin panel, CLI, real-time queries, blocks, draft/publish, live preview, rich text, authentication, RBAC, media library, themes, and auto-migration. Everything you need to ship.",
                icon: "Heart",
              },
              {
                title: "Enterprise — Coming Soon",
                description:
                  "Environments with staging/production branching, SSO/SAML, approval workflows, advanced audit logs, localization, and priority support. Flat annual license — not per-seat.",
                icon: "Building",
              },
            ],
          },
          {
            blockType: "faq",
            blockName: "Pricing FAQ",
            _key: "pricing-faq",
            heading: "Pricing FAQ",
            subheading:
              "Common questions about pricing, licensing, and what's included.",
            supportLink: "https://github.com/vexcms/vex/issues",
            items: [
              {
                question: "Is Vex CMS really free?",
                answer:
                  "Yes. The entire core CMS — all 16 field types, the admin panel, CLI, real-time queries, blocks, versioning, authentication, and everything else — is MIT licensed and free forever. We will never put core CMS features behind a paywall.",
              },
              {
                question: "What will enterprise features cost?",
                answer:
                  "Enterprise packages will be priced as a flat annual license (not per-seat). We're targeting $500-2000/year depending on the package. Pricing details will be announced when the first enterprise packages ship.",
              },
              {
                question: "What about Convex costs?",
                answer:
                  "Convex has a generous free tier that covers most development and small production workloads. You pay Convex directly for usage beyond the free tier. Vex CMS itself adds no additional hosting or infrastructure costs.",
              },
              {
                question: "Can I self-host?",
                answer:
                  "Vex CMS runs on Convex's infrastructure — there's no separate server to host. Your Next.js frontend can be deployed anywhere (Vercel, Netlify, etc.), and the CMS backend runs entirely on Convex.",
              },
              {
                question: "What enterprise features are planned?",
                answer:
                  "Environments (staging/production content branching), SSO/SAML authentication, approval workflows, advanced audit logs with compliance reports, and localization with i18n field variants. Check the roadmap for the latest status.",
              },
            ],
          },
          {
            blockType: "cta",
            blockName: "CTA",
            _key: "pricing-cta",
            heading: "Get started for free",
            subheading:
              "No credit card, no sign-up. Just run the CLI and start building.",
            actions: [
              { label: "Get Started", href: "/docs" },
              { label: "View Roadmap", href: "/roadmap" },
            ],
          },
        ],
      })
      created.push("pricing")
    }

    // ===========================
    // PAGE: Roadmap
    // ===========================
    if (await pageExists("roadmap")) {
      skipped.push("roadmap")
    } else {
      await ctx.db.insert("pages", {
        title: "Roadmap",
        slug: "roadmap",
        vex_status: "published",
        vex_version: 1,
        vex_publishedAt: Date.now(),
        content: [
          {
            blockType: "hero",
            blockName: "Roadmap Hero",
            _key: "roadmap-hero",
            heading: "Roadmap",
            subheading:
              "Vex CMS is actively developed in the open. Here's what we've shipped, what's coming next, and where we're headed.",
            primaryCtaLabel: "Get Started",
            primaryCtaHref: "/docs",
            secondaryCtaLabel: "GitHub Discussions",
            secondaryCtaHref: "https://github.com/vexcms/vex/discussions",
          },
          {
            blockType: "roadmap",
            blockName: "Roadmap",
            _key: "roadmap-main",
            heading: "What's shipped and what's next",
            subheading:
              "What we've shipped and what's coming next. Vex CMS is actively developed — here's where we're headed.",
            items: [
              {
                feature: "16 Field Types",
                description:
                  "Text, number, select, date, relationship, upload, richtext, blocks, color, tabs, and more.",
                status: "shipped" as const,
              },
              {
                feature: "Admin Panel",
                description:
                  "Full-featured admin UI with list views, edit forms, media library, and draft/publish workflow.",
                status: "shipped" as const,
              },
              {
                feature: "Real-Time Queries",
                description:
                  "Every query is live via Convex. Content updates appear instantly across all connected clients.",
                status: "shipped" as const,
              },
              {
                feature: "Live Preview",
                description:
                  "Side-by-side iframe preview with responsive breakpoints and real-time updates as you edit.",
                status: "shipped" as const,
              },
              {
                feature: "Block System",
                description:
                  "Compose pages from reusable content blocks with drag-and-drop reordering and inline editing.",
                status: "shipped" as const,
              },
              {
                feature: "Authentication & RBAC",
                description:
                  "Better Auth integration with role-based access control at the document and field level.",
                status: "shipped" as const,
              },
              {
                feature: "Rich Text Editor",
                description:
                  "Plate.js-powered editor with media uploads, links, tables, and custom elements.",
                status: "shipped" as const,
              },
              {
                feature: "CLI & Scaffolding",
                description:
                  "vex dev with watch/generate, and create-vexcms for instant project setup.",
                status: "shipped" as const,
              },
              {
                feature: "Theme System",
                description:
                  "Database-driven themes with light/dark mode, CSS variables, and OKLCH color support.",
                status: "shipped" as const,
              },
              {
                feature: "Block Styles",
                description:
                  "Per-block responsive styling with Tailwind presets — margin, padding, typography, layout, and more.",
                status: "shipped" as const,
              },
              {
                feature: "Content Scheduling",
                description:
                  "Set a publishAt timestamp and content goes live automatically via Convex scheduled functions.",
                status: "coming-soon" as const,
              },
              {
                feature: "Team Management",
                description:
                  "Invite users, assign roles, and manage pending invitations from the admin panel.",
                status: "coming-soon" as const,
              },
              {
                feature: "API Keys",
                description:
                  "Read-only API tokens for external integrations with configurable rate limiting.",
                status: "coming-soon" as const,
              },
              {
                feature: "Audit Log",
                description:
                  "Track who changed what and when across all collections and documents.",
                status: "coming-soon" as const,
              },
              {
                feature: "Environments",
                description:
                  "Project-level content branching with staging and production environments and atomic promotion.",
                status: "planned" as const,
              },
              {
                feature: "Localization",
                description:
                  "i18n field variants with per-locale versioning and content translation workflows.",
                status: "planned" as const,
              },
              {
                feature: "Approval Workflows",
                description:
                  "Review and sign-off steps before content goes live. Configurable multi-step approval chains.",
                status: "planned" as const,
              },
              {
                feature: "Plugin System",
                description:
                  "Extend VEX with community plugins for custom fields, integrations, and admin panel features.",
                status: "planned" as const,
              },
            ],
          },
          {
            blockType: "cta",
            blockName: "CTA",
            _key: "roadmap-cta",
            heading: "Want to shape the roadmap?",
            subheading:
              "Vex CMS is built in the open. Share your ideas, vote on features, and help us prioritize what matters most.",
            actions: [
              {
                label: "GitHub Issues",
                href: "https://github.com/vexcms/vex/issues",
              },
              {
                label: "Join Discussions",
                href: "https://github.com/vexcms/vex/discussions",
              },
            ],
          },
        ],
      })
      created.push("roadmap")
    }

    // ===========================
    // HEADER
    // ===========================
    if (await headerExists("Main Header")) {
      skipped.push("header")
    } else {
      await ctx.db.insert("headers", {
        name: "Main Header",
        vex_status: "published",
        content: [
          {
            blockType: "header",
            blockName: "Site Header",
            _key: "main-header",
            logoText: "Vex CMS",
            logoHref: "/",
            menuItems: [
              { label: "Features", href: "/features" },
              { label: "Pricing", href: "/pricing" },
              { label: "Roadmap", href: "/roadmap" },
              { label: "Docs", href: "/docs" },
            ],
            actionButtons: [
              {
                label: "GitHub",
                href: "https://github.com/vexcms/vex",
                variant: "ghost" as const,
              },
              {
                label: "Get Started",
                href: "/docs",
                variant: "default" as const,
              },
            ],
          },
        ],
      })
      created.push("header")
    }

    // ===========================
    // FOOTER
    // ===========================
    if (await footerExists("Main Footer")) {
      skipped.push("footer")
    } else {
      await ctx.db.insert("footers", {
        name: "Main Footer",
        vex_status: "published",
        content: [
          {
            blockType: "footer",
            blockName: "Site Footer",
            _key: "main-footer",
            logoText: "Vex CMS",
            copyright: "Vex CMS. All rights reserved.",
            links: [
              { label: "Features", href: "/features" },
              { label: "Pricing", href: "/pricing" },
              { label: "Roadmap", href: "/roadmap" },
              { label: "Documentation", href: "/docs" },
              { label: "GitHub", href: "https://github.com/vexcms/vex" },
              {
                label: "npm",
                href: "https://www.npmjs.com/package/@vexcms/core",
              },
              { label: "Convex", href: "https://convex.dev" },
            ],
            socialLinks: [
              {
                platform: "GitHub",
                href: "https://github.com/vexcms/vex",
                icon: "Github",
              },
              {
                platform: "X",
                href: "https://x.com/vexcms",
                icon: "Twitter",
              },
            ],
          },
        ],
      })
      created.push("footer")
    }

    return {
      created,
      skipped,
      message: `Seeded ${created.length} items. Skipped ${skipped.length} (already exist).`,
    }
  },
})

/**
 * Delete all seeded marketing pages, header, and footer, then re-run the seed.
 *
 * Run from terminal:
 *   npx convex run seed:reseedMarketingSite
 */
export const reseedMarketingSite = internalMutation({
  args: {},
  handler: async (ctx) => {
    const slugs = ["home", "features", "pricing", "roadmap"]
    for (const slug of slugs) {
      const page = await ctx.db
        .query("pages")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first()
      if (page) await ctx.db.delete(page._id)
    }

    const header = await ctx.db
      .query("headers")
      .withIndex("by_name", (q) => q.eq("name", "Main Header"))
      .first()
    if (header) await ctx.db.delete(header._id)

    const footer = await ctx.db
      .query("footers")
      .withIndex("by_name", (q) => q.eq("name", "Main Footer"))
      .first()
    if (footer) await ctx.db.delete(footer._id)

    // Now call the seed logic inline (can't call mutations from mutations)
    // Just return instructions
    return {
      deleted: [...slugs, "header", "footer"],
      message:
        "Deleted all marketing content. Run `npx convex run seed:seedMarketingSite` to re-seed.",
    }
  },
})
