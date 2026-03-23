import { color, defineCollection, tabs, text, ui } from "@vexcms/core"

import ThemeImportField from "~/components/admin/ThemeImportField"
import { TABLE_SLUG_THEMES } from "~/db/constants"

/**
 * Helper to create a set of shadcn/Tailwind color fields for a theme mode.
 */
function themeColorFields() {
  return {
    background: color({ label: "Background", defaultValue: "#ffffff" }),
    foreground: color({ label: "Foreground", defaultValue: "#0a0a0a" }),
    card: color({ label: "Card", defaultValue: "#ffffff" }),
    cardForeground: color({ label: "Card Foreground", defaultValue: "#0a0a0a" }),
    popover: color({ label: "Popover", defaultValue: "#ffffff" }),
    popoverForeground: color({ label: "Popover Foreground", defaultValue: "#0a0a0a" }),
    primary: color({ label: "Primary", defaultValue: "#171717" }),
    primaryForeground: color({ label: "Primary Foreground", defaultValue: "#fafafa" }),
    secondary: color({ label: "Secondary", defaultValue: "#f5f5f5" }),
    secondaryForeground: color({ label: "Secondary Foreground", defaultValue: "#171717" }),
    muted: color({ label: "Muted", defaultValue: "#f5f5f5" }),
    mutedForeground: color({ label: "Muted Foreground", defaultValue: "#737373" }),
    accent: color({ label: "Accent", defaultValue: "#f5f5f5" }),
    accentForeground: color({ label: "Accent Foreground", defaultValue: "#171717" }),
    destructive: color({ label: "Destructive", defaultValue: "#ef4444" }),
    destructiveForeground: color({ label: "Destructive Foreground", defaultValue: "#fafafa" }),
    border: color({ label: "Border", defaultValue: "#e5e5e5" }),
    input: color({ label: "Input", defaultValue: "#e5e5e5" }),
    ring: color({ label: "Ring", defaultValue: "#0a0a0a" }),
    chart1: color({ label: "Chart 1", defaultValue: "#e76e50" }),
    chart2: color({ label: "Chart 2", defaultValue: "#2a9d90" }),
    chart3: color({ label: "Chart 3", defaultValue: "#264653" }),
    chart4: color({ label: "Chart 4", defaultValue: "#e8c468" }),
    chart5: color({ label: "Chart 5", defaultValue: "#f4a261" }),
    sidebar: color({ label: "Sidebar", defaultValue: "#fafafa" }),
    sidebarForeground: color({ label: "Sidebar Foreground", defaultValue: "#0a0a0a" }),
    sidebarPrimary: color({ label: "Sidebar Primary", defaultValue: "#171717" }),
    sidebarPrimaryForeground: color({ label: "Sidebar Primary FG", defaultValue: "#fafafa" }),
    sidebarAccent: color({ label: "Sidebar Accent", defaultValue: "#f5f5f5" }),
    sidebarAccentForeground: color({ label: "Sidebar Accent FG", defaultValue: "#171717" }),
    sidebarBorder: color({ label: "Sidebar Border", defaultValue: "#e5e5e5" }),
    sidebarRing: color({ label: "Sidebar Ring", defaultValue: "#0a0a0a" }),
  } as const
}

export const themes = defineCollection({
  slug: TABLE_SLUG_THEMES,
  admin: {
    group: "Site Builder",
    useAsTitle: "name",
  },
  fields: {
    name: text({
      label: "Theme Name",
      required: true,
    }),
    importTheme: ui({
      admin: {
        components: {
          Field: ThemeImportField,
        },
      },
    }),
    colors: tabs({
      label: "Theme Colors",
      tabs: [
        {
          label: "Light",
          slug: "light",
          fields: themeColorFields(),
        },
        {
          label: "Dark",
          slug: "dark",
          fields: {
            ...themeColorFields(),
            // Override dark mode defaults
            background: color({ label: "Background", defaultValue: "#0a0a0a" }),
            foreground: color({ label: "Foreground", defaultValue: "#fafafa" }),
            card: color({ label: "Card", defaultValue: "#0a0a0a" }),
            cardForeground: color({ label: "Card Foreground", defaultValue: "#fafafa" }),
            popover: color({ label: "Popover", defaultValue: "#0a0a0a" }),
            popoverForeground: color({ label: "Popover Foreground", defaultValue: "#fafafa" }),
            primary: color({ label: "Primary", defaultValue: "#fafafa" }),
            primaryForeground: color({ label: "Primary Foreground", defaultValue: "#171717" }),
            secondary: color({ label: "Secondary", defaultValue: "#262626" }),
            secondaryForeground: color({ label: "Secondary Foreground", defaultValue: "#fafafa" }),
            muted: color({ label: "Muted", defaultValue: "#262626" }),
            mutedForeground: color({ label: "Muted Foreground", defaultValue: "#a3a3a3" }),
            accent: color({ label: "Accent", defaultValue: "#262626" }),
            accentForeground: color({ label: "Accent Foreground", defaultValue: "#fafafa" }),
            border: color({ label: "Border", defaultValue: "#262626" }),
            input: color({ label: "Input", defaultValue: "#262626" }),
            ring: color({ label: "Ring", defaultValue: "#d4d4d4" }),
            sidebar: color({ label: "Sidebar", defaultValue: "#171717" }),
            sidebarForeground: color({ label: "Sidebar Foreground", defaultValue: "#fafafa" }),
            sidebarPrimary: color({ label: "Sidebar Primary", defaultValue: "#fafafa" }),
            sidebarPrimaryForeground: color({ label: "Sidebar Primary FG", defaultValue: "#171717" }),
            sidebarAccent: color({ label: "Sidebar Accent", defaultValue: "#262626" }),
            sidebarAccentForeground: color({ label: "Sidebar Accent FG", defaultValue: "#fafafa" }),
            sidebarBorder: color({ label: "Sidebar Border", defaultValue: "#262626" }),
            sidebarRing: color({ label: "Sidebar Ring", defaultValue: "#d4d4d4" }),
          },
        },
      ],
    }),
    radius: text({
      label: "Border Radius",
      defaultValue: "0.625rem",
    }),
    fontFamily: text({
      label: "Font Family",
      defaultValue: "Inter, sans-serif",
    }),
  },
  labels: {
    plural: "Themes",
    singular: "Theme",
  },
})
