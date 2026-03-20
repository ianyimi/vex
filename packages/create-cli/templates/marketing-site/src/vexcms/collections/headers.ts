import { checkbox, defineCollection, text, upload } from "@vexcms/core"

import { TABLE_SLUG_HEADERS, TABLE_SLUG_MEDIA } from "~/db/constants"

export const headers = defineCollection({
  slug: TABLE_SLUG_HEADERS,
  admin: {
    group: "Site Builder",
    useAsTitle: "name",
  },
  fields: {
    name: text({
      label: "Name",
      required: true,
    }),
    logoText: text({
      label: "Logo Text",
    }),
    logoUrl: upload({
      admin: {
        description: "URL for the header logo image",
      },
      label: "Logo URL",
      to: TABLE_SLUG_MEDIA,
    }),
    sticky: checkbox({
      defaultValue: false,
      label: "Sticky Header",
    }),
  },
  labels: {
    plural: "Headers",
    singular: "Header",
  },
})
