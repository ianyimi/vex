"use client"

import type { CellComponentProps } from "@vexcms/core";
import type { DateField } from "@vexcms/core";

/**
 * Date field cell component for the data-table list view.
 *
 * Renders a Unix ms timestamp as a locale date string via `Date.toLocaleDateString()`.
 *
 * @param props - Component props
 * @param props.value - Raw Unix timestamp in milliseconds from the document
 * @param props.fieldDef - Resolved `DateField` definition
 * @returns The Cell Component for this field type
 *
 * @example
 * ```tsx
 * <DateFieldCell value={doc.publishedAt} fieldDef={publishedAtField} row={row} />
 * ```
 */
export function DateFieldCell(props: CellComponentProps<DateField>) {
  if (!props.value) {
    return null;
  }
  const date = new Date(props.value);
  return <span>{date.toDateString()}</span>;
}
