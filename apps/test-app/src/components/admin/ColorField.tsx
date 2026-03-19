"use client"

import type { FieldComponentProps } from "@vexcms/core"

import { toTitleCase } from "@vexcms/core"
import { useVexField } from "@vexcms/ui"

/**
 * Custom color picker field component.
 * Demonstrates the custom component registration system.
 * Stores a hex color string (e.g., "#3b82f6").
 */
export default function ColorField({ name, readOnly }: FieldComponentProps) {
  const { errors, fieldDef, handleBlur, setValue, showError, value } = useVexField<string>({ name })

  const label = fieldDef.label ?? toTitleCase(name)
  const description = fieldDef.admin?.description

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none" htmlFor={name}>
        {label}
      </label>

      <div className="flex items-center gap-3">
        {/* Color swatch */}
        <input
          className="h-10 w-10 cursor-pointer rounded border p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={readOnly}
          id={`${name}-picker`}
          onBlur={handleBlur}
          onChange={(e) => setValue(e.target.value)}
          type="color"
          value={value || "#000000"}
        />

        {/* Hex input */}
        <input
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={readOnly}
          id={name}
          onBlur={handleBlur}
          onChange={(e) => setValue(e.target.value)}
          placeholder="#000000"
          type="text"
          value={value ?? ""}
        />

        {/* Preview badge */}
        {value && (
          <div
            className="flex h-10 items-center gap-2 rounded-md border px-3 text-xs"
            style={{ backgroundColor: value, color: getContrastColor(value) }}
          >
            {value}
          </div>
        )}
      </div>

      {description && <p className="text-xs text-muted-foreground">{description}</p>}

      {showError && errors.length > 0 && (
        <div>
          {errors.map((error, i) => (
            <p className="text-xs text-destructive" key={i}>
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

/** Returns black or white depending on the background color for contrast. */
function getContrastColor(hex: string): string {
  const clean = hex.replace("#", "")
  if (clean.length !== 6) {
    return "#000000"
  }
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? "#000000" : "#ffffff"
}
