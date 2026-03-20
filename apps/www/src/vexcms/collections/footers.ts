import { defineCollection, richtext, text } from "@vexcms/core"

import { TABLE_SLUG_FOOTERS, TABLE_SLUG_MEDIA } from "~/db/constants"

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
    content: richtext({
      label: "Content",
      mediaCollection: TABLE_SLUG_MEDIA,
    }),
    copyright: text({
      label: "Copyright Text",
    }),
  },
  labels: {
    plural: "Footers",
    singular: "Footer",
  },
})
