import { defineCollection, text } from "@vexcms/core"

import { TABLE_SLUG_THEMES } from "~/db/constants"

export const themes = defineCollection({
  slug: TABLE_SLUG_THEMES,
  interfaceName: "Theme",
  labels: {
    singular: "Theme",
    plural: "Themes",
  },
  admin: {
    useAsTitle: "name",
  },
  fields: {
    name: text({
      label: "Theme Name",
      required: true,
      index: "by_name",
      description: "Internal identifier for this theme. Used for idempotent lookups and admin display.",
    }),
    fontFamily: text({
      label: "Font Family",
      defaultValue: "Geist, Inter, system-ui, sans-serif",
      description: "CSS font-family stack applied to the body. First available font is used.",
    }),
    radius: text({
      label: "Border Radius",
      defaultValue: "0.25rem",
      description:
        "Base border radius in rem. Applied to the shadcn --radius CSS custom property.",
    }),
    primaryLight: text({
      label: "Primary (Light)",
      defaultValue: "#E8622A",
      description:
        "Primary brand color for light mode. Hex format. Applied to --primary and its OKLCH conversion.",
    }),
    primaryDark: text({
      label: "Primary (Dark)",
      defaultValue: "#F07040",
      description:
        "Primary brand color for dark mode. Hex format. Applied to --primary when dark mode is active.",
    }),
    bgDark: text({
      label: "Background (Dark)",
      defaultValue: "#0A0A0A",
      description:
        "Page background for dark mode. Hex format. Applied to --background when dark mode is active.",
    }),
    bgLight: text({
      label: "Background (Light)",
      defaultValue: "#F5F5F5",
      description:
        "Page background for light mode. Hex format. Applied to --background when light mode is active.",
    }),
  },
})
