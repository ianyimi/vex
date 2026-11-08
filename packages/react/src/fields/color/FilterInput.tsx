import type { ColorField, FilterInputProps } from "@vexcms/core";
import { Input } from "../../ui";

/**
 * Colour field filter row value control — a small swatch (background from
 * the current value) beside the existing hex text `Input`, registered as
 * `reactAdapter.fields.color.filterInput`. NOT the full
 * swatch-picker popover the edit-view `ColorField` uses — a filter
 * compares one exact stored hex string, not a chosen-from-swatches UX.
 * The swatch mirrors `Cell.tsx`'s own `size-4 shrink-0 rounded border
 * border-token` pattern; `style={{ backgroundColor }}` lets a
 * `var(--token)` reference resolve through CSS like the cell's does.
 *
 * @param props - Component props.
 * @returns The swatch + hex `Input`.
 */
export function ColorFilterInput(props: FilterInputProps<ColorField>) {
  const value = typeof props.value === "string" ? props.value : "";
  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <span
        aria-hidden="true"
        className="size-4 shrink-0 rounded border border-border"
        style={value ? { backgroundColor: value } : undefined}
      />
      <Input
        className="min-w-0 flex-1"
        aria-label={props.field.label || "Filter value"}
        value={value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.disabled}
      />
    </div>
  );
}
