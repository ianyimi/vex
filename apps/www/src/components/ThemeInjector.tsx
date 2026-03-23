"use client"

import { useQuery } from "convex/react"
import { anyApi } from "convex/server"

/**
 * CSS variable name mapping from camelCase field names to CSS custom property names.
 * e.g., "cardForeground" → "card-foreground"
 */
const FIELD_TO_CSS_VAR: Record<string, string> = {
  background: "background",
  foreground: "foreground",
  card: "card",
  cardForeground: "card-foreground",
  popover: "popover",
  popoverForeground: "popover-foreground",
  primary: "primary",
  primaryForeground: "primary-foreground",
  secondary: "secondary",
  secondaryForeground: "secondary-foreground",
  muted: "muted",
  mutedForeground: "muted-foreground",
  accent: "accent",
  accentForeground: "accent-foreground",
  destructive: "destructive",
  destructiveForeground: "destructive-foreground",
  border: "border",
  input: "input",
  ring: "ring",
  chart1: "chart-1",
  chart2: "chart-2",
  chart3: "chart-3",
  chart4: "chart-4",
  chart5: "chart-5",
  sidebar: "sidebar",
  sidebarForeground: "sidebar-foreground",
  sidebarPrimary: "sidebar-primary",
  sidebarPrimaryForeground: "sidebar-primary-foreground",
  sidebarAccent: "sidebar-accent",
  sidebarAccentForeground: "sidebar-accent-foreground",
  sidebarBorder: "sidebar-border",
  sidebarRing: "sidebar-ring",
}

/**
 * Build CSS variable declarations from a theme color object.
 */
function buildCSSVars(colors: Record<string, unknown> | null | undefined): string {
  if (!colors) return ""

  const vars: string[] = []
  for (const [fieldName, cssVar] of Object.entries(FIELD_TO_CSS_VAR)) {
    const value = colors[fieldName]
    if (typeof value === "string" && value) {
      vars.push(`  --${cssVar}: ${value};`)
    }
  }
  return vars.join("\n")
}

/**
 * Client component that reads the active theme and injects CSS variables.
 *
 * Queries site_settings for the activeTheme relationship, then fetches
 * the theme document and generates inline CSS variables for light and dark modes.
 *
 * @param props.siteSettingsSlug - The collection slug for site settings
 */
export function ThemeInjector(props: { siteSettingsSlug: string }) {
  // Fetch the first site_settings document (it's a singleton-like collection)
  const settings = useQuery(anyApi.vex.api[props.siteSettingsSlug]?.list, {
    paginationOpts: { numItems: 1, cursor: null },
  })

  const settingsDoc = (settings as any)?.page?.[0] as Record<string, unknown> | undefined
  const activeThemeId = settingsDoc?.activeTheme as string | undefined

  // Fetch the active theme document
  const theme = useQuery(
    anyApi.vex.api.themes?.get,
    activeThemeId ? { id: activeThemeId } : "skip",
  ) as Record<string, unknown> | null | undefined

  if (!theme) return null

  const lightColors = theme.light as Record<string, unknown> | undefined
  const darkColors = theme.dark as Record<string, unknown> | undefined

  const lightVars = buildCSSVars(lightColors)
  const darkVars = buildCSSVars(darkColors)

  if (!lightVars && !darkVars) return null

  const css = [
    lightVars ? `:root {\n${lightVars}\n}` : "",
    darkVars ? `.dark {\n${darkVars}\n}` : "",
  ]
    .filter(Boolean)
    .join("\n\n")

  // Also apply radius and font if present
  const radius = theme.radius as string | undefined
  const fontFamily = theme.fontFamily as string | undefined
  const extraVars: string[] = []
  if (radius) extraVars.push(`  --radius: ${radius};`)
  if (fontFamily) extraVars.push(`  --font-sans: ${fontFamily};`)

  const extraCSS = extraVars.length > 0 ? `\n:root {\n${extraVars.join("\n")}\n}` : ""

  return (
    <style dangerouslySetInnerHTML={{ __html: css + extraCSS }} />
  )
}
