"use client";

import type { FilterInputProps, TextField } from "@vexcms/core";
import { Input } from "../../ui";

/**
 * Text field filter row value control — a plain text `Input`, registered as
 * `reactAdapter.fields.text.filterInput`. `w-full min-w-0`
 * fills the filter row's fixed-width value cell (`ListViewFilterBuilder.tsx`'s
 * 4-column grid), shrinking with it rather than reserving a literal width.
 *
 * @param props - Component props.
 * @returns The value `Input`.
 */
export function TextFilterInput(props: FilterInputProps<TextField>) {
  return (
    <Input
      className="w-full min-w-0"
      aria-label={props.field.label || "Filter value"}
      value={String(props.value ?? "")}
      onChange={(e) => props.onChange(e.target.value)}
      disabled={props.disabled}
    />
  );
}
