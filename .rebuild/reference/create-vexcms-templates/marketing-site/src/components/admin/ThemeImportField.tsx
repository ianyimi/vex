"use client"

import { useVexFormContext } from "@vexcms/ui"

import { ThemeImport } from "./ThemeImport"

/**
 * Custom admin field component that renders the theme CSS import UI.
 * Uses the VexForm context to programmatically set color field values
 * when CSS is imported.
 *
 * Register on a ui() field in the themes collection:
 * ```ts
 * importTheme: ui({ admin: { components: { Field: ThemeImportField } } })
 * ```
 */
export default function ThemeImportField() {
  const { form } = useVexFormContext()

  const handleImport = (updates: Record<string, string>) => {
    for (const [path, value] of Object.entries(updates)) {
      // Path is like "light.background" or "dark.foreground"
      // Tabs expand to top-level keys, so the form field path is just the path directly
      try {
        form.setFieldValue(path as any, value)
      } catch {
        // Field might not exist in this form — silently skip
      }
    }
  }

  return <ThemeImport onImport={handleImport} />
}
