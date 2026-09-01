import { array, defineBlock, group, text, url } from "@vexcms/core"

/**
 * Logo Cloud — a grid of logos for "Trusted by" or "Integrates with" sections.
 */
export const logoCloudBlock = defineBlock({
  slug: "logo-cloud",
  label: "Logo Cloud",
  name: "logo-cloud",
  admin: { icon: "LayoutGrid" },
  fields: {
    title: text({ label: "Title", description: "Optional heading, e.g. 'Trusted by'." }),
    logos: array({
      label: "Logos",
      labels: { singular: "logo", plural: "logos" },
      items: group({
        label: "Logo",
        fields: {
          name: text({ required: true, label: "Company Name" }),
          image: url({ required: true, label: "Logo Image URL" }),
          link: url({ label: "Link URL" }),
        },
      }),
    }),
  },
})
