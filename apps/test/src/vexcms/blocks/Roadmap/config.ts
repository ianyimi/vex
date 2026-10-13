import { array, defineBlock, group, select, text } from "@vexcms/core"

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
      items: group({
        label: "Roadmap Item",
        fields: {
          feature: text({ label: "Feature Name", required: true }),
          description: text({ label: "Description" }),
          status: select({
            label: "Status",
            required: true,
            options: [
              { label: "Shipped", value: "shipped" },
              { label: "In progress", value: "in-progress" },
              { label: "Planned", value: "planned" },
              { label: "Exploring", value: "exploring" },
              { label: "Future", value: "future" },
            ],
            defaultValue: ["shipped"],
          }),
        },
      }),
      defaultValue: [
        {
          feature: "12 Field Types",
          description:
            "text, url, color, number, checkbox, date, select, relationship, array, group, blocks, and upload — no richtext, json, or tabs yet.",
          status: "shipped",
        },
        {
          feature: "Convex Schema Codegen",
          description:
            "vex dev / vex generate write your Convex schema, TypeScript types, and Zod validators from defineCollection() — no hand-written schema.ts.",
          status: "shipped",
        },
        {
          feature: "Real-Time Admin Panel",
          description:
            "DataTable with pagination, live totalDocs, and bulk operations — every list view is a Convex subscription.",
          status: "shipped",
        },
        {
          feature: "Media Library",
          description:
            "Convex file storage adapter with a searchable, paginated media picker built into every upload field.",
          status: "shipped",
        },
        {
          feature: "RBAC & Access Control",
          description:
            "Document-level access rules, indexed constraints that compile to withIndex ranges, per-call access.action/bypass overrides, and an anonRole fallback for public reads.",
          status: "shipped",
        },
        {
          feature: "Custom Theme System",
          description:
            "Database-driven themes with light/dark mode, 32 shadcn tokens per mode, and OKLCH color support — live-updates with zero page reload.",
          status: "shipped",
        },
        {
          feature: "Better Auth Integration",
          description:
            "Email/password and OAuth out of the box, with organizations and API keys as opt-in plugins.",
          status: "shipped",
        },
        {
          feature: "CLI & Scaffolder",
          description:
            "vex dev, vex generate, and create-vexcms for instant project setup — bare or full marketing-site templates.",
          status: "shipped",
        },
        {
          feature: "Live Preview",
          description:
            "Unsaved form state, streamed onto your real route — the preview is your production page, not a parallel render path. Collections and globals alike, with the preview URL declared centrally or per collection, and resolvable on the server when the path lives in the database. Origin-allowlisted and gated per request.",
          status: "shipped",
        },
        {
          feature: "Versioning & Drafts",
          description: "Draft/publish workflow with autosave and version history — in active development.",
          status: "in-progress",
        },
        {
          feature: "Lifecycle Hooks & Validation",
          description:
            "beforeChange/beforeDelete and afterChange/afterDelete, plus an async validate() that receives a ctx typed to your own data model — min and max are enforced on every write, not only in the admin form.",
          status: "shipped",
        },
        {
          feature: "Field Input Consistency Pass",
          description:
            "Touch-ups across field inputs — starting with the relationship field — for consistent interaction patterns in the admin panel.",
          status: "in-progress",
        },
        {
          feature: "Richtext, JSON, Email & Textarea Fields",
          description: "Plate.js-powered rich text, plus structured JSON, email, and multi-line text inputs.",
          status: "planned",
        },
        {
          feature: "Team Management & API Keys",
          description: "Invite users, assign roles, and issue scoped read-only API tokens for external integrations.",
          status: "planned",
        },
        {
          feature: "React Package Testing Suite",
          description:
            "Exportable Vitest suite from @vexcms/react for testing custom field components and admin extensions in consumer projects.",
          status: "planned",
        },
      ],
    }),
  },
  admin: {
    icon: "Map",
  },
})
