import { defineCollection, text } from "@vexcms/core"

import { TABLE_SLUG_HEADERS } from "~/db/constants"

export const headers = defineCollection({
  slug: TABLE_SLUG_HEADERS,
  interfaceName: "Header",
  labels: {
    singular: "Header",
    plural: "Headers",
  },
  admin: {
    useAsTitle: "name",
  },
  fields: {
    name: text({
      label: "Name",
      required: true,
      index: "by_name",
      description: "Internal identifier for this header config. Used for idempotent lookups.",
    }),
    logoText: text({
      label: "Logo Text",
      defaultValue: "Vex CMS",
      description: "Brand name rendered as the logo. Falls back to site settings name.",
    }),
    logoHref: text({
      label: "Logo Link",
      defaultValue: "/",
      description: "URL the logo links to. Typically / for the home page.",
    }),
    menuItems: text({
      label: "Menu Items",
      description:
        'JSON array of navigation links. Each item: { label: string, href: string }. Example: [{"label":"Features","href":"/features"}]',
      defaultValue:
        '[{"label":"Features","href":"/features"},{"label":"Pricing","href":"/pricing"},{"label":"Roadmap","href":"/roadmap"},{"label":"Docs","href":"/docs"}]',
    }),
    actionButtons: text({
      label: "Action Buttons",
      description:
        "JSON array of CTA buttons. Each item: { label, href, variant }. Variant options: default, outline, ghost.",
      defaultValue:
        '[{"label":"GitHub","href":"https://github.com/vexcms/vex","variant":"ghost"},{"label":"Get Started","href":"/docs","variant":"default"}]',
    }),
  },
})
