"use client"

import type { CellComponentProps } from "@vexcms/core"

export default function ColorCell({ value }: CellComponentProps) {
  const hex = typeof value === "string" ? value : ""
  if (!hex) {
    return (
      <div className="ml-2.5 w-16 grid place-items-center">
        <span className="text-muted-foreground">—</span>
      </div>
    )
  }

  return (
    <div className="ml-2.5">
      <span
        className="inline-flex items-center rounded px-2 py-0.5 font-mono text-xs font-medium"
        style={{ backgroundColor: hex, color: getContrastColor(hex) }}
      >
        {hex}
      </span>
    </div>
  )
}

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
