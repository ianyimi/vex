import { array, defineBlock, object, text } from "@vexcms/core"

import IconPickerField from "~/components/admin/IconPickerField"
import { BLOCK_SLUG_HOW_IT_WORKS } from "../constants"

export const howItWorksBlock = defineBlock({
  slug: BLOCK_SLUG_HOW_IT_WORKS,
  label: "How It Works",
  fields: {
    heading: text({
      label: "Heading",
      required: true,
      defaultValue: "Get started in minutes",
    }),
    subheading: text({
      label: "Subheading",
      defaultValue:
        "From zero to a fully functional CMS in four steps. No boilerplate, no config files to wrestle with.",
    }),
    steps: array({
      label: "Steps",
      required: true,
      items: object({
        fields: {
          icon: text({
            label: "Icon",
            admin: {
              description: "Lucide icon name",
              components: { Field: IconPickerField },
            },
          }),
          title: text({ label: "Title", required: true }),
          description: text({ label: "Description", required: true }),
        },
      }),
      defaultValue: [
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
    }),
  },
  admin: {
    icon: "list-ordered",
    blockStyles: ["container", "text"],
  },
})
