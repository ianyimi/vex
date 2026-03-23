import { blocks, defineCollection, text } from "@vexcms/core"

import { TABLE_SLUG_FOOTERS } from "~/db/constants"
import { footerBlocks } from "~/vexcms/blocks/config"

export const footers = defineCollection({
  slug: TABLE_SLUG_FOOTERS,
  admin: {
    group: "Site Builder",
    useAsTitle: "name",
  },
  fields: {
    name: text({
      label: "Name",
      required: true,
    }),
    content: blocks({
      blocks: footerBlocks,
      label: "Footer",
      max: 1,
      labels: {
        singular: "Footer",
        plural: "Footers",
      },
    }),
  },
  labels: {
    plural: "Footers",
    singular: "Footer",
  },
})
