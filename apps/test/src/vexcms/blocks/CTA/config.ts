import {
  array,
  defineBlock,
  group,
  relationship,
  select,
  text,
  url,
} from "@vexcms/core"

import { TABLE_SLUG_PAGES } from "~/db/constants"

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
          linkType: select({
            label: "Link Type",
            defaultValue: ["external"],
            options: [
              { label: "External URL", value: "external" },
              { label: "Internal Page", value: "internal" },
            ],
          }),
          internalPage: relationship({
            label: "Internal Page",
            collection: {
              slug: TABLE_SLUG_PAGES,
            },
            admin: {
              condition: ({ siblingData }) =>
                (siblingData.linkType as string[] | undefined)?.[0] === "internal",
            },
          }),
          externalUrl: url({
            label: "External URL",
            admin: {
              condition: ({ siblingData }) =>
                (siblingData.linkType as string[] | undefined)?.[0] === "external",
            },
          }),
        },
      }),
      defaultValue: [
        { label: "Get Started", linkType: ["external"], externalUrl: "https://docs.vexcms.dev/guides/quickstart/" },
        { label: "View on GitHub", linkType: ["external"], externalUrl: "https://github.com/ianyimi/vex" },
      ],
    }),
  },
  admin: {
    icon: "Megaphone",
  },
})
