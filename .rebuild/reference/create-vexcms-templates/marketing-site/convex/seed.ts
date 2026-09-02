import { internalMutation } from "./_generated/server"

/**
 * Initialize the site with default data.
 *
 * Run from terminal:
 *   npx convex run seed:init
 *
 * Creates:
 * - Site settings global (required for theme and SEO)
 * - A default header
 * - A default footer
 *
 * Safe to run multiple times — skips items that already exist.
 */
export const init = internalMutation({
  args: {},
  handler: async (ctx) => {
    const created: string[] = []
    const skipped: string[] = []

    // Site Settings
    const existingSettings = await ctx.db.query("site_settings").first()
    if (existingSettings) {
      skipped.push("site_settings")
    } else {
      await ctx.db.insert("site_settings", {
        name: "My Site",
        vex_status: "published",
        vex_version: 1,
        vex_publishedAt: Date.now(),
      })
      created.push("site_settings")
    }

    // Default Header
    const existingHeader = await ctx.db
      .query("headers")
      .withIndex("by_name", (q) => q.eq("name", "Main Header"))
      .first()
    if (existingHeader) {
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
            logoText: "My Site",
            logoHref: "/",
            menuItems: [
              { label: "Features", href: "/features" },
              { label: "Docs", href: "/docs" },
            ],
            actionButtons: [
              { label: "Get Started", href: "/docs", variant: "default" as const },
            ],
          },
        ],
      })
      created.push("header")
    }

    // Default Footer
    const existingFooter = await ctx.db
      .query("footers")
      .withIndex("by_name", (q) => q.eq("name", "Main Footer"))
      .first()
    if (existingFooter) {
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
            logoText: "My Site",
            copyright: "My Site. All rights reserved.",
            links: [
              { label: "Home", href: "/" },
            ],
            socialLinks: [],
          },
        ],
      })
      created.push("footer")
    }

    return {
      created,
      skipped,
      message: `Initialized ${created.length} items. Skipped ${skipped.length} (already exist).`,
    }
  },
})
