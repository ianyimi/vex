import {
  type CellComponentProps,
  type ArrayField,
  ArrayType,
} from "@vexcms/core";

/**
 * Array field cell component for the data-table list view.
 *
 * Renders the item count of an array field (e.g. "3 items."). Shows an em-dash
 * placeholder when the array is empty. The `title` attribute shows the field
 * type and label for accessibility.
 *
 * @param props - Component props
 * @param props.value - Raw array from the document (may be null or undefined — defaults to empty array)
 * @param props.fieldDef - Resolved `ArrayField` definition
 * @returns The cell component for this field type
 *
 * @example
 * ```tsx
 * <ArrayFieldCell value={doc.tags ?? []} fieldDef={tagsField} row={row} />
 * ```
 */
export function ArrayFieldCell(
  props: CellComponentProps<ArrayField<ArrayType>>,
) {
  const itemCount = props.value.length;
  const isSingle = props.value.length === 1;
  const labels = props.fieldDef.labels;
  const label = labels
    ? isSingle
      ? labels.singular
      : labels.plural
    : isSingle
      ? "item"
      : "items";
  return (
    <span title={`${props.fieldDef.type} - ${props.fieldDef.label}`}>
      {itemCount} {label}
    </span>
  );
}
