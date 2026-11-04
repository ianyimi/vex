import type { FilterInputProps, NumberField } from "@vexcms/core";
import { Input } from "../../ui";

/**
 * Number field filter row value control — a number `Input`, registered as
 * `reactAdapter.fields.number.filterInput`. Moved verbatim
 * from `ListViewFilterBuilder.tsx`'s own hand-coded `renderFilterValueInput`
 * `number` branch, now this package's single source of truth for it.
 *
 * @param props - Component props.
 * @returns The value `Input`.
 */
export function NumberFilterInput(props: FilterInputProps<NumberField>) {
  return (
    <Input
      type="number"
      className="w-full min-w-0"
      value={String(props.value ?? "")}
      onChange={(e) => props.onChange(Number(e.target.value))}
      disabled={props.disabled}
    />
  );
}
