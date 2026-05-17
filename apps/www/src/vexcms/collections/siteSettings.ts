import { defineCollection, text } from "@vexcms/core"

import { TABLE_SLUG_SITE_SETTINGS } from "~/db/constants"

export const siteSettings = defineCollection({
  slug: TABLE_SLUG_SITE_SETTINGS,
  interfaceName: "SiteSettings",
  labels: {
    singular: "Site Setting",
    plural: "Site Settings",
  },
  admin: {
    useAsTitle: "name",
  },
  fields: {
    name: text({
      label: "Site Name",
      required: true,
      description: "Global site name used as fallback for logo text, page titles, and meta tags.",
    }),
  },
})
