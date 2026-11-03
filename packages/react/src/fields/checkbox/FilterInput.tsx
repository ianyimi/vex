import type { CheckboxField, FilterInputProps } from "@vexcms/core";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui";

/** `Select` options for a `checkbox` field's filter value — Decision 10 ships no boolean-specific widget, so this reuses the field-type-dispatch `Select` with fixed labels. Moved from `ListViewFilterBuilder.tsx`'s own `FILTER_BUILDER_BOOLEAN_OPTIONS`. */
export const CHECKBOX_FILTER_BOOLEAN_OPTIONS = [
  { label: "True", value: "true" },
  { label: "False", value: "false" },
] as const;

/**
 * Checkbox field filter row value control — a true/false `Select`,
 * registered as `reactAdapter.fields.checkbox.filterInput` (Decision 50).
 * Moved verbatim from `ListViewFilterBuilder.tsx`'s own hand-coded
 * `renderFilterValueInput` `checkbox` branch, now this package's single
 * source of truth for it. `SelectValue`'s children render function shows
 * the option's own label (`"True"`/`"False"`), not the raw stored value
 * (`"true"`/`"false"`) — the same convention `ListViewFilterBuilder.tsx`'s
 * own operator `Select` and `DataTablePageSizeSelect.tsx` already use
 * (developer-reported: the raw value was visibly wrong, not just an
 * accessibility gap). `aria-label` reuses the SAME resolved label, so the
 * spoken name and the screen always agree.
 *
 * @param props - Component props.
 * @returns The value `Select`.
 */
export function CheckboxFilterInput(props: FilterInputProps<CheckboxField>) {
  const stringValue = props.value === true ? "true" : props.value === false ? "false" : "";
  const labelFor = (value: string) =>
    CHECKBOX_FILTER_BOOLEAN_OPTIONS.find((option) => option.value === value)?.label ?? "Value";
  const visibleLabel = labelFor(stringValue);
  return (
    <Select
      value={stringValue}
      onValueChange={(value) => props.onChange(value === "true")}
      disabled={props.disabled}
    >
      <SelectTrigger
        aria-label={`Filter value: ${visibleLabel}`}
        size="sm"
        className="w-full min-w-0"
      >
        <SelectValue>{(value: string) => labelFor(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CHECKBOX_FILTER_BOOLEAN_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
