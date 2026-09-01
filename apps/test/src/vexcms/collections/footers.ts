import { defineCollection, text } from "@vexcms/core"

import { TABLE_SLUG_FOOTERS } from "~/db/constants"

export const footers = defineCollection({
  slug: TABLE_SLUG_FOOTERS,
  interfaceName: "Footer",
  labels: {
    singular: "Footer",
    plural: "Footers",
  },
  admin: {
    useAsTitle: "name",
  },
  fields: {
    name: text({
      label: "Name",
      required: true,
      index: "by_name",
      description: "Internal identifier for this footer config. Used for idempotent lookups.",
    }),
    logoText: text({
      label: "Logo Text",
      defaultValue: "Vex CMS",
      description: "Brand name shown in the footer. Falls back to site settings name.",
    }),
    copyright: text({
      label: "Copyright Text",
      defaultValue: "Vex CMS. All rights reserved.",
      description: "Copyright line displayed at the bottom of the footer. Auto-prepends © and the current year.",
    }),
    links: text({
      label: "Links",
      description:
        "JSON array of footer navigation links. Each item: { label: string, href: string }. Grouped by section in the UI.",
      defaultValue:
        '[{"label":"Features","href":"/features"},{"label":"Pricing","href":"/pricing"},{"label":"Roadmap","href":"/roadmap"},{"label":"Documentation","href":"/docs"},{"label":"GitHub","href":"https://github.com/vexcms/vex"},{"label":"npm","href":"https://www.npmjs.com/package/@vexcms/core"},{"label":"Convex","href":"https://convex.dev"}]',
    }),
    socialLinks: text({
      label: "Social Links",
      description:
        "JSON array of social profile links. Each item: { platform: string, href: string, icon: string }. Icon maps to a Lucide icon name.",
      defaultValue:
        '[{"platform":"GitHub","href":"https://github.com/vexcms/vex","icon":"Github"},{"platform":"X","href":"https://x.com/vexcms","icon":"Twitter"}]',
    }),
  },
})
