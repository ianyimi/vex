import { array, defineBlock, object, select, text } from "@vexcms/core"

import { BLOCK_SLUG_ROADMAP } from "../constants"

export const roadmapBlock = defineBlock({
  slug: BLOCK_SLUG_ROADMAP,
  label: "Roadmap",
  fields: {
    heading: text({
      label: "Heading",
      required: true,
      defaultValue: "Roadmap",
    }),
    subheading: text({
      label: "Subheading",
      defaultValue:
        "What we've shipped and what's coming next. Vex CMS is actively developed — here's where we're headed.",
    }),
    items: array({
      label: "Roadmap Items",
      required: true,
      items: object({
        fields: {
          feature: text({ label: "Feature Name", required: true }),
          description: text({ label: "Description" }),
          status: select({
            label: "Status",
            required: true,
            options: [
              { label: "Shipped", value: "shipped" },
              { label: "Coming Soon", value: "coming-soon" },
              { label: "Planned", value: "planned" },
            ],
            defaultValue: "shipped",
          }),
        },
      }),
      defaultValue: [
        {
          feature: "16 Field Types",
          description:
            "Text, number, select, date, relationship, upload, richtext, blocks, color, tabs, and more.",
          status: "shipped",
        },
        {
          feature: "Admin Panel",
          description:
            "Full-featured admin UI with list views, edit forms, media library, and draft/publish workflow.",
          status: "shipped",
        },
        {
          feature: "Real-Time Queries",
          description:
            "Every query is live via Convex. Content updates appear instantly across all connected clients.",
          status: "shipped",
        },
        {
          feature: "Live Preview",
          description:
            "Side-by-side iframe preview with responsive breakpoints and real-time updates as you edit.",
          status: "shipped",
        },
        {
          feature: "Block System",
          description:
            "Compose pages from reusable content blocks with drag-and-drop reordering and inline editing.",
          status: "shipped",
        },
        {
          feature: "Authentication & RBAC",
          description:
            "Better Auth integration with role-based access control at the document and field level.",
          status: "shipped",
        },
        {
          feature: "Rich Text Editor",
          description:
            "Plate.js-powered editor with media uploads, links, tables, and custom elements.",
          status: "shipped",
        },
        {
          feature: "CLI & Scaffolding",
          description:
            "vex dev with watch/generate, and create-vexcms for instant project setup.",
          status: "shipped",
        },
        {
          feature: "Theme System",
          description:
            "Database-driven themes with light/dark mode, CSS variables, and OKLCH color support.",
          status: "shipped",
        },
        {
          feature: "Block Styles",
          description:
            "Per-block responsive styling with Tailwind presets — margin, padding, typography, layout, and more.",
          status: "shipped",
        },
        {
          feature: "Content Scheduling",
          description:
            "Set a publishAt timestamp and content goes live automatically via Convex scheduled functions.",
          status: "coming-soon",
        },
        {
          feature: "Team Management",
          description:
            "Invite users, assign roles, and manage pending invitations from the admin panel.",
          status: "coming-soon",
        },
        {
          feature: "API Keys",
          description:
            "Read-only API tokens for external integrations with configurable rate limiting.",
          status: "coming-soon",
        },
        {
          feature: "Audit Log",
          description:
            "Track who changed what and when across all collections and documents.",
          status: "coming-soon",
        },
        {
          feature: "Environments",
          description:
            "Project-level content branching with staging and production environments and atomic promotion.",
          status: "planned",
        },
        {
          feature: "Localization",
          description:
            "i18n field variants with per-locale versioning and content translation workflows.",
          status: "planned",
        },
        {
          feature: "Approval Workflows",
          description:
            "Review and sign-off steps before content goes live. Configurable multi-step approval chains.",
          status: "planned",
        },
        {
          feature: "Plugin System",
          description:
            "Extend VEX with community plugins for custom fields, integrations, and admin panel features.",
          status: "planned",
        },
      ],
    }),
  },
  admin: {
    icon: "map",
    blockStyles: ["container"],
  },
})
