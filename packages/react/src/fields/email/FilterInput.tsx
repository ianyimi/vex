"use client";

import type { EmailField, FilterInputProps } from "@vexcms/core";
import { Input } from "../../ui";

/**
 * Email field filter row value control — a plain text `Input`, registered
 * as `reactAdapter.fields.email.filterInput`. Same body as
 * the `text` field's own filter input — this package's established
 * one-component-per-type convention, mirroring `Cell.tsx`'s own
 * identical-body split for `text`/`email`/`url`/`textarea`.
 *
 * @param props - Component props.
 * @returns The value `Input`.
 */
export function EmailFilterInput(props: FilterInputProps<EmailField>) {
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
