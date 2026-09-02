import { array, defineBlock, group, text } from "@vexcms/core"

import { BLOCK_SLUG_STATS } from "../constants"

export const statsBlock = defineBlock({
  slug: BLOCK_SLUG_STATS,
  label: "Stats",
  fields: {
    heading: text({
      label: "Heading",
      description: "Optional. Leave blank to let the numbers be the whole section.",
    }),
    subheading: text({ label: "Subheading" }),
    items: array({
      label: "Stats",
      required: true,
      items: group({
        label: "Stat",
        fields: {
          value: text({
            label: "Value",
            required: true,
            description:
              'Free text, not a number — "0", "12" and "~30s" all render. Any unit belongs in the string.',
          }),
          label: text({ label: "Label", required: true }),
          description: text({ label: "Description" }),
        },
      }),
    }),
  },
  admin: {
    icon: "Gauge",
  },
})
