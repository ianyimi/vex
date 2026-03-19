"use client";

import type { CellComponentProps } from "@vexcms/core";

export default function ColorCell({ value }: CellComponentProps) {
  const hex = typeof value === "string" ? value : "";
  if (!hex) return <span className="text-muted-foreground">—</span>;

  return (
    <span className="font-mono text-sm font-medium" style={{ color: hex }}>
      {hex}
    </span>
  );
}
