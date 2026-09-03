import { array, defineBlock, group, select, text, upload } from "@vexcms/core"

import { TABLE_SLUG_IMAGES } from "~/db/constants"

import { BLOCK_SLUG_HEADER } from "../constants"

export const headerBlock = defineBlock({
  slug: BLOCK_SLUG_HEADER,
  label: "Header",
  fields: {
    logoText: text({
      label: "Logo Text",
      defaultValue: "Vex CMS",
      description: "Text to display as the logo",
    }),
    logoImage: upload({
      label: "Logo Image",
      to: TABLE_SLUG_IMAGES,
      description: "Image to display as the logo (overrides text)",
    }),
    logoHref: text({
      label: "Logo Link",
      defaultValue: "/",
    }),
    menuItems: array({
      label: "Menu Items",
      items: group({
        label: "Menu Item",
        fields: {
          label: text({ label: "Label", required: true }),
          href: text({ label: "Link", required: true }),
        },
      }),
      defaultValue: [
        { label: "Features", href: "/features" },
        { label: "Pricing", href: "/pricing" },
        { label: "Roadmap", href: "/roadmap" },
        { label: "Docs", href: "https://docs.vexcms.dev" },
      ],
    }),
    actionButtons: array({
      label: "Action Buttons",
      items: group({
        label: "Action Button",
        fields: {
          label: text({ label: "Button Label", required: true }),
          href: text({ label: "Button Link", required: true }),
          variant: select({
            label: "Variant",
            options: [
              { label: "Default", value: "default" },
              { label: "Outline", value: "outline" },
              { label: "Ghost", value: "ghost" },
            ],
            defaultValue: ["default"],
          }),
        },
      }),
      defaultValue: [
        { label: "GitHub", href: "https://github.com/ianyimi/vex", variant: "ghost" },
        {
          label: "Get Started",
          href: "https://docs.vexcms.dev/guides/quickstart/",
          variant: "default",
        },
      ],
    }),
  },
  admin: {
    icon: "PanelTop",
  },
})
