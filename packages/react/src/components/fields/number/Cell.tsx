import type { CellComponentProps, TDocument } from "@vexcms/core";
import type { NumberField } from "@vexcms/core";

/**
 * Number field cell component for the data-table list view.
 *
 * Renders the numeric value of a number field.
 *
 * @param props - Component props
 * @param props.value - Raw numeric value from the document
 * @param props.fieldDef - Resolved `NumberField` definition
 * @returns The Cell Component for this field type
 *
 * @example
 * ```tsx
 * <NumberFieldCell value={doc.price} fieldDef={priceField} row={row} />
 * ```
 */
export function NumberFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<NumberField, TData>,
) {
  return <span>{props.value}</span>;
}
