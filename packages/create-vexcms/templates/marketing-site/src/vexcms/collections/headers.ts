import { blocks, defineCollection, text } from "@vexcms/core"

import { TABLE_SLUG_HEADERS } from "~/db/constants"
import { headerBlocks } from "~/vexcms/blocks/config"

export const headers = defineCollection({
  slug: TABLE_SLUG_HEADERS,
  admin: {
    useAsTitle: "name",
  },
  fields: {
    name: text({
      label: "Name",
      required: true,
      index: "by_name",
    }),
    content: blocks({
      blocks: headerBlocks,
      label: "Header",
      max: 1,
      labels: {
        singular: "Header",
        plural: "Headers",
      },
    }),
  },
  labels: {
    plural: "Headers",
    singular: "Header",
  },
})
