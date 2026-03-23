"use client"

import { useQuery } from "convex/react"
import { useVexPreview } from "@vexcms/ui"
import { anyApi } from "convex/server"

/**
 * CSS variable name mapping from camelCase field names to CSS custom property names.
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
 * Client component that reads the active theme from the site_settings global
 * and injects CSS variables for light and dark modes.
 *
 * @param props.siteSettingsSlug - The global slug for site settings
 * @param props.drafts - When "snapshot", reads draft/preview data instead of published
 */
export function ThemeInjector({
  siteSettingsSlug,
  drafts,
}: {
  siteSettingsSlug: string
  drafts?: "snapshot" | false
}) {
  // Use globals.get which supports draft awareness
  const settingsDoc = useQuery(
    anyApi.vex.globals?.get,
    {
      globalSlug: siteSettingsSlug,
      ...(drafts ? { _vexDrafts: drafts } : {}),
    },
  ) as Record<string, unknown> | null | undefined

  const activeThemeId = settingsDoc?.activeTheme as string | undefined

  // Fetch the active theme document
  // In draft mode, use versioned query to pick up unpublished theme changes
  const theme = useQuery(
    drafts
      ? anyApi.vex.versions?.getDocumentForEdit
      : anyApi.vex.api.themes?.get,
    activeThemeId
      ? drafts
        ? { collectionSlug: "themes", documentId: activeThemeId }
        : { id: activeThemeId }
      : "skip",
  ) as Record<string, unknown> | null | undefined

  // In draft mode, notify the admin panel when settings or theme data changes
  // so the live preview spinner stops
  useVexPreview({ data: drafts ? { settings: settingsDoc, theme } : undefined })

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
