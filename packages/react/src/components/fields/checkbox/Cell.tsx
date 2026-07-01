import type { CellComponentProps, TDocument } from "@vexcms/core";
import type { CheckboxField } from "@vexcms/core";

/**
 * Checkbox field cell component for the data-table list view.
 *
 * Renders a boolean value as `"Yes"` or `"No"`. Falls back to an em-dash
 * when the value is `undefined`.
 *
 * @param props - Component props
 * @param props.value - Raw boolean value from the document
 * @param props.fieldDef - Resolved `CheckboxField` definition
 * @returns The cell content for this field
 *
 * @example
 * ```tsx
 * <CheckboxFieldCell value={doc.published} fieldDef={publishedField} row={row} />
 * ```
 */
export function CheckboxFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<CheckboxField, TData>,
) {
  if (props.value === undefined || props.value === null) return <span>—</span>;
  return <span>{props.value ? "Yes" : "No"}</span>;
}
