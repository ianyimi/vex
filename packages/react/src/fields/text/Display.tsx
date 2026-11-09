"use client";

import { type DisplayComponentProps, type TDocument, type TextField } from "@vexcms/core";

/**
 * Text field read-only display — the peek's Fields tab (and anywhere else
 * `fieldToDisplayComponent` is called for a `text` field), registered as
 * `reactAdapter.fields.text.display`.
 *
 * Unlike `TextFieldCell` (truncated at 77 characters for the data table's
 * fixed-width column), shows the FULL value, wrapped — a read-only display
 * panel has no column width to respect.
 *
 * @param props - Component props.
 * @returns The full text value, wrapped, or an em-dash for an empty value.
 */
export function TextFieldDisplay<TData extends TDocument = TDocument>(
  props: DisplayComponentProps<TextField, TData>,
) {
  if (!props.value) return <span className="text-muted-foreground">—</span>;
  return <p className="text-sm whitespace-pre-wrap break-words">{props.value}</p>;
}
