import { array, defineBlock, object, text, upload } from "@vexcms/core"

import { TABLE_SLUG_MEDIA } from "~/db/constants"
import { BLOCK_SLUG_FOOTER } from "../constants"

export const footerBlock = defineBlock({
  slug: BLOCK_SLUG_FOOTER,
  label: "Footer",
  fields: {
    logoText: text({
      label: "Logo Text",
      defaultValue: "Vex CMS",
    }),
    logoImage: upload({
      label: "Logo Image",
      to: TABLE_SLUG_MEDIA,
    }),
    copyright: text({
      label: "Copyright Text",
      defaultValue: "Vex CMS. All rights reserved.",
    }),
    links: array({
      label: "Links",
      items: object({
        fields: {
          label: text({ label: "Label", required: true }),
          href: text({ label: "Link", required: true }),
        },
      }),
      defaultValue: [
        { label: "Documentation", href: "/docs" },
        { label: "GitHub", href: "https://github.com/vexcms/vex" },
        { label: "npm", href: "https://www.npmjs.com/package/create-vexcms" },
        { label: "Convex", href: "https://convex.dev" },
      ],
    }),
    socialLinks: array({
      label: "Social Links",
      items: object({
        fields: {
          platform: text({ label: "Platform", required: true }),
          href: text({ label: "URL", required: true }),
          icon: text({
            label: "Icon",
            admin: { description: "Lucide icon name (e.g. Twitter, Github, Linkedin)" },
          }),
        },
      }),
      defaultValue: [
        { platform: "GitHub", href: "https://github.com/vexcms/vex", icon: "Github" },
        { platform: "X", href: "https://x.com/vexcms", icon: "Twitter" },
      ],
    }),
  },
  admin: {
    icon: "panel-bottom",
  },
})
