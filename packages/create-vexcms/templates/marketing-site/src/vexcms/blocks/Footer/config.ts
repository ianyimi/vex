import { array, defineBlock, group, text, upload } from "@vexcms/core"

import { TABLE_SLUG_IMAGES } from "~/db/constants"

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
      to: TABLE_SLUG_IMAGES,
    }),
    copyright: text({
      label: "Copyright Text",
      defaultValue: "Vex CMS. All rights reserved.",
    }),
    links: array({
      label: "Links",
      items: group({
        label: "Link",
        fields: {
          label: text({ label: "Label", required: true }),
          href: text({ label: "Link", required: true }),
        },
      }),
      defaultValue: [
        { label: "Features", href: "/features" },
        { label: "Pricing", href: "/pricing" },
        { label: "Roadmap", href: "/roadmap" },
        { label: "Documentation", href: "https://docs.vexcms.dev" },
        { label: "GitHub", href: "https://github.com/ianyimi/vex" },
        { label: "npm", href: "https://www.npmjs.com/package/@vexcms/core" },
        { label: "Convex", href: "https://convex.dev" },
      ],
    }),
    socialLinks: array({
      label: "Social Links",
      items: group({
        label: "Social Link",
        fields: {
          platform: text({ label: "Platform", required: true }),
          href: text({ label: "URL", required: true }),
          icon: text({
            label: "Icon",
            description: "Lucide icon name",
          }),
        },
      }),
      defaultValue: [
        { platform: "GitHub", href: "https://github.com/ianyimi/vex", icon: "Github" },
        { platform: "X", href: "https://x.com/vexcms", icon: "Twitter" },
      ],
    }),
  },
  admin: {
    icon: "PanelBottom",
  },
})
