import {
  addLeadingSlash,
  type CellComponentProps,
  type ArrayField,
  ArrayType,
  TDocument,
} from "@vexcms/core";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";

/**
 * Array field cell component for the data-table list view.
 *
 * Renders the item count of an array field (e.g. "3 items."). Shows an em-dash
 * placeholder when the array is empty. The `title` attribute shows the array's
 * own items, joined into one string — never the static field type/label config
 * text a prior version showed.
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
export function ArrayFieldCell<
  TData extends TDocument = TDocument,
  TArrayType extends ArrayType = ArrayType,
>(props: CellComponentProps<ArrayField<TArrayType>, TData>) {
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  const itemCount = props.value.length;
  const isSingle = props.value.length === 1;
  const labels = props.fieldDef.labels;
  const label = labels ? (isSingle ? labels.singular : labels.plural) : isSingle ? "item" : "items";
  const summary = props.value
    .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
    .join(", ");
  const content = (
    <span title={summary}>
      {itemCount} {label}
    </span>
  );
  if (!props.isTitleField) return content;
  return (
    <VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>
      {content}
    </VexLink>
  );
}
