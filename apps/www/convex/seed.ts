import { mutation } from "./_generated/server"

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
 * - 4 pages: home, features, pricing, roadmap
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
        { label: "npm", href: "https://www.npmjs.com/package/@vexcms/core" },
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

    // ── PAGES ──

    // HOME
    await insertIfMissing("pages", "by_slug", "slug", "home", {
      title: "Vex CMS — The CMS for Convex",
      slug: "home",
      content: [
        "Real-time content. Type-safe by default.",
        "",
        "Vex CMS gives you a full-featured content management system powered by Convex — real-time data, type-safe schemas, and a beautiful admin panel out of the box.",
        "",
        "--- FEATURES ---",
        "Real-Time by Default: Every query is live. Content updates appear instantly across all connected clients — no polling, no webhooks.",
        "Type-Safe Schemas: Define your collections with TypeScript. Vex generates Convex schemas, Zod validators, and typed queries automatically.",
        "Developer First: Code-first configuration, CLI tooling, and a clean API. Build with the tools you already know and love.",
        "",
        "--- HOW IT WORKS ---",
        "1. Scaffold your project — Run npx create-vexcms@latest to get a Next.js app with Convex, authentication, and the admin panel pre-configured.",
        "2. Define your schema — Use defineCollection() and field helpers to declare your content model in TypeScript. Vex generates your Convex schema, types, and queries automatically.",
        "3. Build with blocks — Compose pages from reusable content blocks. Each block is a React component with a typed config.",
        "4. Deploy and go live — Push to Convex and deploy your Next.js app. Real-time content updates flow to every connected client instantly.",
        "",
        "--- FAQ ---",
        "What is Vex CMS? A headless CMS built on Convex with real-time data, type-safe schemas, draft/publish workflows, live preview, and an admin panel.",
        "How is Vex different? Unlike traditional headless CMS platforms, Vex is powered by Convex's real-time database. Content updates are instant across all clients.",
        "Is Vex CMS free? Yes, open source and free. You only pay for Convex usage, which has a generous free tier.",
        "How do I get started? Run npx create-vexcms@latest to scaffold a new project in under a minute.",
      ].join("\n"),
      metaTitle: "Vex CMS — The CMS Built for Convex",
      metaDescription: "A headless content management system powered by Convex. Real-time data, type-safe schemas, and a beautiful admin panel out of the box.",
    }, "page:home")

    // FEATURES
    await insertIfMissing("pages", "by_slug", "slug", "features", {
      title: "Everything you need to manage content",
      slug: "features",
      content: [
        "Built on Convex's real-time infrastructure with a developer experience that doesn't compromise on power.",
        "",
        "--- CORE FEATURES ---",
        "16 Field Types: Text, number, select, date, relationship, upload, richtext, blocks, color, tabs, and more.",
        "Admin Panel: Full-featured admin UI with list views, edit forms, media library, and draft/publish workflow.",
        "Real-Time Queries: Every query is live via Convex. Content updates appear instantly across all connected clients.",
        "Live Preview: Side-by-side iframe preview with responsive breakpoints and real-time updates as you edit.",
        "Block System: Compose pages from reusable content blocks with drag-and-drop reordering and inline editing.",
        "Authentication & RBAC: Better Auth integration with role-based access control at the document and field level.",
        "Rich Text Editor: Plate.js-powered editor with media uploads, links, tables, and custom elements.",
        "CLI & Scaffolding: vex dev with watch/generate, and create-vexcms for instant project setup.",
        "Theme System: Database-driven themes with light/dark mode, CSS variables, and OKLCH color support.",
        "Block Styles: Per-block responsive styling with Tailwind presets — margin, padding, typography, layout, and more.",
        "",
        "--- DEVELOPER EXPERIENCE ---",
        "TypeScript-First: Every collection, field, and query is fully typed. Schema changes propagate to your IDE instantly.",
        "Code Generation: Vex generates Convex schemas, typed queries, and Zod validators from your collection definitions.",
        "Auto-Migration: Schema changes automatically create Convex indexes and tables — no manual migration scripts.",
        "",
        "--- CONTENT MANAGEMENT ---",
        "Draft/Publish: Save drafts and publish when ready. Full version history for every document.",
        "Versioning: Track every change with automatic version snapshots. Roll back to any previous state.",
        "RBAC: Control who can see and edit each collection, document, and field.",
        "Media Library: Upload, organize, and reference files with Convex storage.",
      ].join("\n"),
      metaTitle: "Features — Vex CMS",
      metaDescription: "16 field types, real-time queries, type-safe schemas, live preview, and a beautiful admin panel. Everything you need to manage content.",
    }, "page:features")

    // PRICING
    await insertIfMissing("pages", "by_slug", "slug", "pricing", {
      title: "Simple, transparent pricing",
      slug: "pricing",
      content: [
        "Vex CMS is open source and free. You only pay for Convex usage.",
        "",
        "--- OPEN SOURCE (FREE) ---",
        "MIT licensed. All core features included: admin panel, field types, CLI, real-time queries, draft/publish, authentication, RBAC, media library, live preview, and more.",
        "",
        "--- ENTERPRISE (COMING SOON) ---",
        "Environments: Project-level content branching with staging and production environments and atomic promotion.",
        "SSO: SAML/OIDC single sign-on with IdP group to role mapping.",
        "Workflows: Review and approval steps before content goes live. Configurable multi-step approval chains.",
        "Audit Log: Full audit log with retention, export, and compliance reports.",
        "Localization: i18n field variants with per-locale versioning and content translation workflows.",
        "",
        "--- FAQ ---",
        "Is it really free? Yes, Vex CMS is MIT licensed. You only pay for Convex hosting, which has a generous free tier.",
        "What about Convex costs? Convex's free tier handles most small projects. Paid plans start when you exceed free tier limits.",
        "What does enterprise include? Content environments, SSO, approval workflows, audit log, and localization.",
      ].join("\n"),
      metaTitle: "Pricing — Vex CMS",
      metaDescription: "Vex CMS is open source and free. Enterprise features coming soon.",
    }, "page:pricing")

    // ROADMAP
    await insertIfMissing("pages", "by_slug", "slug", "roadmap", {
      title: "Roadmap",
      slug: "roadmap",
      content: [
        "What we've shipped and what's coming next. Vex CMS is actively developed — here's where we're headed.",
        "",
        "--- SHIPPED ---",
        "16 Field Types | Text, number, select, date, relationship, upload, richtext, blocks, color, tabs, and more.",
        "Admin Panel | Full-featured admin UI with list views, edit forms, media library, and draft/publish workflow.",
        "Real-Time Queries | Every query is live via Convex. Content updates appear instantly across all connected clients.",
        "Live Preview | Side-by-side iframe preview with responsive breakpoints and real-time updates as you edit.",
        "Block System | Compose pages from reusable content blocks with drag-and-drop reordering and inline editing.",
        "Authentication & RBAC | Better Auth integration with role-based access control at the document and field level.",
        "Rich Text Editor | Plate.js-powered editor with media uploads, links, tables, and custom elements.",
        "CLI & Scaffolding | vex dev with watch/generate, and create-vexcms for instant project setup.",
        "Theme System | Database-driven themes with light/dark mode, CSS variables, and OKLCH color support.",
        "Block Styles | Per-block responsive styling with Tailwind presets.",
        "",
        "--- COMING SOON ---",
        "Content Scheduling | Set a publishAt timestamp and content goes live automatically.",
        "Team Management | Invite users, assign roles, and manage pending invitations.",
        "API Keys | Read-only API tokens for external integrations with configurable rate limiting.",
        "Audit Log | Track who changed what and when across all collections and documents.",
        "",
        "--- PLANNED ---",
        "Environments | Project-level content branching with staging and production environments.",
        "Localization | i18n field variants with per-locale versioning and content translation workflows.",
        "Approval Workflows | Review and sign-off steps before content goes live.",
        "Plugin System | Extend VEX with community plugins for custom fields, integrations, and admin panel features.",
      ].join("\n"),
      metaTitle: "Roadmap — Vex CMS",
      metaDescription: "What we've shipped and what's coming next. Vex CMS is actively developed.",
    }, "page:roadmap")

    return {
      created,
      skipped,
      message: `Initialized ${created.length} items. Skipped ${skipped.length} (already exist).`,
    }
  },
})
