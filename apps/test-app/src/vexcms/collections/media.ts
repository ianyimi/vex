import { defineMediaCollection } from "@vexcms/core"

import { TABLE_SLUG_MEDIA } from "~/db/constants"

export const media = defineMediaCollection({
  slug: TABLE_SLUG_MEDIA,
  admin: {
    group: "Media",
    useAsTitle: "filename",
  },
  labels: {
    plural: "Media",
    singular: "Media",
  },
})
