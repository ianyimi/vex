import type { DateField, FilterInputProps } from "@vexcms/core";
import { DateTimePicker } from "../../ui/datetime/date-picker";

/**
 * Date field filter row value control — the shared `DateTimePicker`,
 * registered as `reactAdapter.fields.date.filterInput` (Decision 50).
 * Moved verbatim from `ListViewFilterBuilder.tsx`'s own hand-coded
 * `renderFilterValueInput` `date` branch, now this package's single
 * source of truth for it.
 *
 * Fills the value cell like every other control (developer revision: "the
 * date picker fills the value cell, no fixed width any more") —
 * `date-picker.tsx`'s own truncate support on its default trigger still
 * keeps the row one line even for a long locale-formatted date, now by
 * shrinking WITH the grid cell rather than a literal `w-48`.
 *
 * @param props - Component props.
 * @returns The `DateTimePicker`.
 */
export function DateFilterInput(props: FilterInputProps<DateField>) {
  const dateValue = typeof props.value === "number" ? new Date(props.value) : undefined;
  return (
    <DateTimePicker
      value={dateValue}
      onChange={(date) => props.onChange(date ? date.getTime() : undefined)}
      classNames={{ trigger: "w-full min-w-0" }}
      disabled={props.disabled}
    />
  );
}
