import { fetchQuery } from "convex/nextjs"

import { api } from "@convex/_generated/api"

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
 * Server component that fetches the active theme and inlines CSS variables
 * into the initial HTML. This eliminates the flash of unstyled content
 * that occurs when theme variables are injected client-side.
 *
 * @param props.drafts - When true, fetches the draft/preview theme instead of published.
 *                       Use this in the preview layout so the server-rendered CSS
 *                       matches the draft state the admin is editing.
 */
export async function ThemeStyle({ drafts }: { drafts?: boolean } = {}) {
  let theme: Record<string, unknown> | null = null
  try {
    theme = drafts
      ? await fetchQuery(api.theme.getActivePreview) as Record<string, unknown> | null
      : await fetchQuery(api.theme.getActive) as Record<string, unknown> | null
  } catch {
    // Convex not available during build — use default styles
    return null
  }

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
