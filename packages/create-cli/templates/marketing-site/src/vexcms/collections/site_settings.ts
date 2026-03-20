import { defineCollection, text, upload } from "@vexcms/core"

import { TABLE_SLUG_MEDIA, TABLE_SLUG_SITE_SETTINGS } from "~/db/constants"

export const siteSettings = defineCollection({
  slug: TABLE_SLUG_SITE_SETTINGS,
  admin: {
    group: "Site Builder",
    useAsTitle: "name",
  },
  fields: {
    name: text({
      label: "Site Name",
      required: true,
    }),
    description: text({
      label: "Site Description",
    }),
    favicon: upload({
      admin: {
        description: "Site favicon image",
      },
      label: "Favicon",
      to: TABLE_SLUG_MEDIA,
    }),
  },
  labels: {
    plural: "Site Settings",
    singular: "Site Settings",
  },
})
