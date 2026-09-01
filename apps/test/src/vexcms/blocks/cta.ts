import { defineBlock, text, url, select } from "@vexcms/core"

/**
 * CTA — call-to-action section with a heading, description, and button.
 * Often placed mid-page or at the bottom before the footer.
 */
export const ctaBlock = defineBlock({
  slug: "cta",
  label: "CTA",
  name: "cta",
  admin: { icon: "Megaphone" },
  fields: {
    title: text({ required: true, label: "Title" }),
    description: text({ label: "Description" }),
    buttonLabel: text({ label: "Button Label" }),
    buttonHref: url({ label: "Button URL" }),
    variant: select({
      label: "Variant",
      defaultValue: ["default"],
      options: [
        { label: "Default", value: "default" },
        { label: "Outlined", value: "outline" },
        { label: "Ghost", value: "ghost" },
      ],
    }),
  },
})
