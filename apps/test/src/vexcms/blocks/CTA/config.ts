import { array, defineBlock, group, text } from "@vexcms/core"

import { BLOCK_SLUG_CTA } from "../constants"

export const ctaBlock = defineBlock({
  slug: BLOCK_SLUG_CTA,
  label: "Call to Action",
  fields: {
    heading: text({
      label: "Heading",
      required: true,
      defaultValue: "Ready to build with Vex CMS?",
    }),
    subheading: text({
      label: "Subheading",
      defaultValue:
        "Get started in minutes with create-vexcms. Real-time content management powered by Convex.",
    }),
    actions: array({
      label: "Actions",
      items: group({
        label: "Action",
        fields: {
          label: text({ label: "Button Label", required: true }),
          href: text({ label: "Button Link", required: true }),
        },
      }),
      defaultValue: [
        { label: "Get Started", href: "https://docs.vexcms.dev/guides/quickstart/" },
        { label: "View on GitHub", href: "https://github.com/ianyimi/vex" },
      ],
    }),
  },
  admin: {
    icon: "Megaphone",
  },
})
