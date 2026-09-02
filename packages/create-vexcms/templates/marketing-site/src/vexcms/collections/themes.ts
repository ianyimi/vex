import { defineCollection, group, text } from "@vexcms/core";

import { TABLE_SLUG_THEMES } from "~/db/constants";

import { themeColors } from "./themeColors";

export const themes = defineCollection({
  slug: TABLE_SLUG_THEMES,
  interfaceName: "Theme",
  labels: {
    singular: "Theme",
    plural: "Themes",
  },
  admin: {
    useAsTitle: "name",
    icon: "Palette",
  },
  fields: {
    name: text({
      label: "Theme Name",
      required: true,
      index: "by_name",
      description:
        "Internal identifier for this theme. Used for idempotent lookups and admin display.",
    }),
    fontFamily: text({
      label: "Font Family",
      defaultValue: "Geist, Inter, system-ui, sans-serif",
      description:
        "CSS font-family stack applied to --font-sans. The first available font wins, so a stack naming an unloaded font degrades rather than breaking.",
    }),
    radius: text({
      label: "Border Radius",
      defaultValue: "4px",
      description: "Applied to the --radius custom property. Any CSS length.",
    }),
    light: group({
      label: "Light Mode",
      description: "Tokens emitted under :root.",
      fields: themeColors("light"),
    }),
    dark: group({
      label: "Dark Mode",
      description: "Tokens emitted under .dark.",
      fields: themeColors("dark"),
    }),
  },
});
