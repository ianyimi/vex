import { defineCollection, text } from "@vexcms/core"

import { TABLE_SLUG_THEMES } from "~/db/constants"

export const themes = defineCollection({
  slug: TABLE_SLUG_THEMES,
  admin: {
    group: "Site Builder",
    useAsTitle: "name",
  },
  fields: {
    name: text({
      label: "Name",
      required: true,
    }),
    backgroundColor: text({
      defaultValue: "#ffffff",
      label: "Background Color",
    }),
    fontFamily: text({
      defaultValue: "Inter, sans-serif",
      label: "Font Family",
    }),
    primaryColor: text({
      defaultValue: "#3b82f6",
      label: "Primary Color",
    }),
    secondaryColor: text({
      defaultValue: "#6b7280",
      label: "Secondary Color",
    }),
  },
  labels: {
    plural: "Themes",
    singular: "Theme",
  },
})
