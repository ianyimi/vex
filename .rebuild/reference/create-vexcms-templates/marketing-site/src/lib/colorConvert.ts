// @ts-expect-error culori/fn lacks type declarations in v4
import { parse, formatHex, formatHsl, converter } from "culori/fn"

const toOklch = converter("oklch")

/**
 * Convert a color string to the specified format.
 *
 * @param props.color - Input color in any CSS-parseable format
 * @param props.format - Target format: "hex", "hsl", or "oklch"
 * @returns Formatted color string, or the original if parsing fails
 */
export function convertColor(props: {
  color: string
  format: "hex" | "hsl" | "oklch"
}): string {
  if (!props.color || props.color.startsWith("var(")) return props.color

  const parsed = parse(props.color)
  if (!parsed) return props.color

  switch (props.format) {
    case "hex":
      return formatHex(parsed) ?? props.color
    case "hsl":
      return formatHsl(parsed) ?? props.color
    case "oklch": {
      const oklch = toOklch(parsed)
      if (!oklch) return props.color
      const l = (oklch.l ?? 0).toFixed(3)
      const c = (oklch.c ?? 0).toFixed(3)
      const h = (oklch.h ?? 0).toFixed(1)
      return `oklch(${l} ${c} ${h})`
    }
    default:
      return props.color
  }
}

/**
 * Known CSS custom property names that represent colors.
 * These are the standard shadcn/Tailwind CSS variables.
 */
const COLOR_VAR_NAMES = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
]

/**
 * Extract color CSS custom properties from the document's stylesheets.
 * Returns light and dark values for each known color variable.
 */
export function getThemeColorsFromDOM(): {
  name: string
  lightValue: string
  darkValue: string | null
}[] {
  if (typeof document === "undefined") return []

  const results: { name: string; lightValue: string; darkValue: string | null }[] = []

  // Get computed styles for :root (light mode)
  const rootStyles = getComputedStyle(document.documentElement)

  // Try to get dark mode values by reading stylesheets
  const darkValues = new Map<string, string>()
  try {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSStyleRule && rule.selectorText?.includes(".dark")) {
            for (const varName of COLOR_VAR_NAMES) {
              const value = rule.style.getPropertyValue(`--${varName}`).trim()
              if (value) darkValues.set(varName, value)
            }
          }
        }
      } catch {
        // Cross-origin stylesheet — skip
      }
    }
  } catch {
    // No stylesheet access
  }

  for (const varName of COLOR_VAR_NAMES) {
    const lightValue = rootStyles.getPropertyValue(`--${varName}`).trim()
    if (!lightValue) continue

    results.push({
      name: varName,
      lightValue,
      darkValue: darkValues.get(varName) ?? null,
    })
  }

  return results
}

/**
 * Parse CSS text containing :root and .dark variable declarations.
 * Used by the theme import feature to extract color values from pasted CSS.
 *
 * @param props.css - Raw CSS text containing :root { } and optionally .dark { }
 * @returns Parsed light and dark color maps
 */
export function parseThemeCSS(props: { css: string }): {
  light: Record<string, string>
  dark: Record<string, string>
} {
  const light: Record<string, string> = {}
  const dark: Record<string, string> = {}

  // Match :root { ... } block
  const rootMatch = props.css.match(/:root\s*\{([\s\S]+?)\}/)
  if (rootMatch) {
    const vars = rootMatch[1].matchAll(/--([a-z-]+)\s*:\s*([^;]+)/g)
    for (const match of vars) {
      const name = match[1].trim()
      const value = match[2].trim()
      if (COLOR_VAR_NAMES.includes(name)) {
        light[name] = value
      }
    }
  }

  // Match .dark { ... } block
  const darkMatch = props.css.match(/\.dark\s*\{([\s\S]+?)\}/)
  if (darkMatch) {
    const vars = darkMatch[1].matchAll(/--([a-z-]+)\s*:\s*([^;]+)/g)
    for (const match of vars) {
      const name = match[1].trim()
      const value = match[2].trim()
      if (COLOR_VAR_NAMES.includes(name)) {
        dark[name] = value
      }
    }
  }

  return { light, dark }
}
