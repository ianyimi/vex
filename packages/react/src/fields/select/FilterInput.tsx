import type { FilterInputProps, SelectField } from "@vexcms/core";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui";

/**
 * Select field filter row value control — the field's own declared
 * options in a `Select`, registered as `reactAdapter.fields.select.filterInput`.
 * Moved verbatim from `ListViewFilterBuilder.tsx`'s own
 * hand-coded `renderFilterValueInput` `select` branch, now this package's
 * single source of truth for it — the synthetic `vex_status` filter field
 * is itself `type: "select"` (`VERSION_SYSTEM_FIELDS.status`), so it
 * free-rides this component with no special case. `SelectValue`'s
 * children render function shows the matching option's own label, not
 * the raw stored value (the raw value was visibly
 * wrong, not just an accessibility gap) — the same convention
 * `ListViewFilterBuilder.tsx`'s own operator `Select` and
 * `DataTablePageSizeSelect.tsx` already use. `aria-label` reuses the
 * SAME resolved label, so the spoken name and the screen always agree.
 *
 * @param props - Component props.
 * @returns The value `Select`.
 */
export function SelectFilterInput(props: FilterInputProps<SelectField>) {
  const stringValue = String(props.value ?? "");
  const labelFor = (value: string) => props.field.options.find((option) => option.value === value)?.label ?? "Value";
  const visibleLabel = labelFor(stringValue);
  return (
    <Select
      value={stringValue}
      onValueChange={(value) => props.onChange(value)}
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
        {props.field.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
