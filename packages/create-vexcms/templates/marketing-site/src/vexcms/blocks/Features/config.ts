import { array, defineBlock, group, text } from "@vexcms/core"

import { BLOCK_SLUG_FEATURES } from "../constants"

export const featuresBlock = defineBlock({
  slug: BLOCK_SLUG_FEATURES,
  label: "Features",
  fields: {
    heading: text({
      label: "Heading",
      required: true,
      defaultValue: "Everything you need to manage content",
    }),
    subheading: text({
      label: "Subheading",
      defaultValue:
        "Built on Convex's real-time infrastructure with a developer experience that doesn't compromise on power.",
    }),
    features: array({
      label: "Features",
      required: true,
      items: group({
        label: "Feature",
        fields: {
          title: text({ label: "Title", required: true }),
          description: text({ label: "Description", required: true }),
          icon: text({
            label: "Icon",
            description: "Lucide icon name",
          }),
        },
      }),
      defaultValue: [
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
    }),
  },
  admin: {
    icon: "LayoutGrid",
  },
})
