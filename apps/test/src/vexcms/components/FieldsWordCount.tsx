"use client";

import type { UIFieldCellProps, UIFieldComponentProps } from "@vexcms/core";

import { type TABLE_SLUG_FIELDS } from "~/db/constants";

/** Same `ui()` field's list-view column — proves a `Cell` surfaces one. */
export function FieldsWordCountCell(props: UIFieldCellProps<typeof TABLE_SLUG_FIELDS>) {
  return <span>{countWords(props.data.bio)}</span>;
}

/**
 * `ui()` dogfood: live word count of the `bio` field, no stored value.
 * Rendered in the admin edit form's sidebar (`admin.position: "sidebar"`).
 */
export function FieldsWordCountField(props: UIFieldComponentProps<typeof TABLE_SLUG_FIELDS>) {
  const words = countWords(props.data.bio);
  return (
    <p className="text-sm text-muted-foreground">
      {words} word{words === 1 ? "" : "s"} in Bio
    </p>
  );
}

function countWords(value: unknown): number {
  const text = typeof value === "string" ? value : "";
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}
