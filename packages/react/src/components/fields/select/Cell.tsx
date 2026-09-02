import type { CellComponentProps, TDocument } from "@vexcms/core";
import type { SelectField } from "@vexcms/core";
import { Badge } from "../../ui";

/**
 * Select field cell component for the data-table list view.
 *
 * Renders each selected option as a `Badge`. Options not present in the stored
 * value are omitted. Renders an empty `div` when the value is empty or undefined.
 *
 * @param props - Component props
 * @param props.value - Array of selected option values from the document
 * @param props.fieldDef - Resolved `SelectField` definition
 * @returns A row of Badge components, one per selected option
 *
 * @example
 * ```tsx
 * <SelectFieldCell value={doc.tags} fieldDef={tagsField} row={row} />
 * ```
 */
export function SelectFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<SelectField, TData>,
) {
  const value = props.value ?? [];
  const fields = props.fieldDef.options.filter((o) => value.includes(o.value));
  return (
    <div className="flex gap-1">
      {fields.map((f) => (
        <Badge key={f.value}>{f.label}</Badge>
      ))}
    </div>
  );
}
