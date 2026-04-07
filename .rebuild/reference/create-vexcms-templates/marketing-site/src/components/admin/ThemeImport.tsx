"use client"

import { useState } from "react"

import { parseThemeCSS } from "~/lib/colorConvert"

/**
 * CSS variable name → form field path mapping.
 * Maps CSS custom property names (from :root / .dark blocks)
 * to the field paths in the themes collection form.
 *
 * Tabs with slugs create nested paths: "light.background", "dark.background"
 * This maps the CSS var name to the camelCase field name used in themeColorFields().
 */
const CSS_VAR_TO_FIELD: Record<string, string> = {
  background: "background",
  foreground: "foreground",
  card: "card",
  "card-foreground": "cardForeground",
  popover: "popover",
  "popover-foreground": "popoverForeground",
  primary: "primary",
  "primary-foreground": "primaryForeground",
  secondary: "secondary",
  "secondary-foreground": "secondaryForeground",
  muted: "muted",
  "muted-foreground": "mutedForeground",
  accent: "accent",
  "accent-foreground": "accentForeground",
  destructive: "destructive",
  "destructive-foreground": "destructiveForeground",
  border: "border",
  input: "input",
  ring: "ring",
  "chart-1": "chart1",
  "chart-2": "chart2",
  "chart-3": "chart3",
  "chart-4": "chart4",
  "chart-5": "chart5",
  sidebar: "sidebar",
  "sidebar-foreground": "sidebarForeground",
  "sidebar-primary": "sidebarPrimary",
  "sidebar-primary-foreground": "sidebarPrimaryForeground",
  "sidebar-accent": "sidebarAccent",
  "sidebar-accent-foreground": "sidebarAccentForeground",
  "sidebar-border": "sidebarBorder",
  "sidebar-ring": "sidebarRing",
}

interface ThemeImportProps {
  /** Callback to set a form field value by path. e.g., setFieldValue("light.background", "#fff") */
  onImport: (updates: Record<string, string>) => void
}

/**
 * Theme import component — paste CSS from tweakcn/shadcn to populate color fields.
 *
 * Parses :root { } and .dark { } blocks from the CSS, maps variable names to
 * form field paths, and calls onImport with all matched field updates.
 *
 * Designed to work with any CSS file — only updates fields that match known
 * CSS variable names. Unmatched variables are silently ignored.
 */
export function ThemeImport({ onImport }: ThemeImportProps) {
  const [css, setCss] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  const handleImport = () => {
    if (!css.trim()) return

    const parsed = parseThemeCSS({ css })
    const updates: Record<string, string> = {}
    let count = 0

    // Map light colors to light.{fieldName} paths
    for (const [cssVar, value] of Object.entries(parsed.light)) {
      const fieldName = CSS_VAR_TO_FIELD[cssVar]
      if (fieldName) {
        updates[`light.${fieldName}`] = value
        count++
      }
    }

    // Map dark colors to dark.{fieldName} paths
    for (const [cssVar, value] of Object.entries(parsed.dark)) {
      const fieldName = CSS_VAR_TO_FIELD[cssVar]
      if (fieldName) {
        updates[`dark.${fieldName}`] = value
        count++
      }
    }

    if (count > 0) {
      onImport(updates)
      setImportResult(`Imported ${count} color values`)
      setCss("")
      setTimeout(() => setImportResult(null), 3000)
    } else {
      setImportResult("No matching CSS variables found")
      setTimeout(() => setImportResult(null), 3000)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 mb-6">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium w-full text-left"
      >
        <span className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>▶</span>
        Import Theme from CSS
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            Paste CSS from{" "}
            <a
              href="https://tweakcn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              tweakcn
            </a>
            {" "}or{" "}
            <a
              href="https://ui.shadcn.com/themes"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              shadcn/ui themes
            </a>
            . The importer will match CSS variable names to color fields and fill them in.
          </p>

          <textarea
            value={css}
            onChange={(e) => setCss(e.target.value)}
            placeholder={`:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --primary: #171717;
  ...
}

.dark {
  --background: #0a0a0a;
  ...
}`}
            className="w-full h-40 rounded-md border bg-background px-3 py-2 text-xs font-mono resize-y"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleImport}
              disabled={!css.trim()}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Import
            </button>
            {importResult && (
              <span className="text-xs text-muted-foreground">{importResult}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
