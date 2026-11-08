import type { FilterInputProps, UrlField } from "@vexcms/core";
import { Input } from "../../ui";

/**
 * URL field filter row value control — a plain text `Input`, registered as
 * `reactAdapter.fields.url.filterInput`. Same body as the
 * `text` field's own filter input — this package's established
 * one-component-per-type convention, mirroring `Cell.tsx`'s own
 * identical-body split for `text`/`email`/`url`/`textarea`.
 *
 * @param props - Component props.
 * @returns The value `Input`.
 */
export function UrlFilterInput(props: FilterInputProps<UrlField>) {
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
