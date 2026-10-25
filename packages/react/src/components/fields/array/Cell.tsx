import {
  type CellComponentProps,
  type ArrayField,
  ArrayType,
  arrayItemLabel,
  arrayPluralLabel,
  TDocument,
} from "@vexcms/core";
import { VexLink } from "../../ui";
import { adminHref } from "../../../utils/adminHref";
import { useVexConfig } from "../../../context/VexConfigContext";
import type { VexResourceSlug } from "@vexcms/core";

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
>(props: CellComponentProps<ArrayField<VexResourceSlug, TArrayType>, TData>) {
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const config = useVexConfig();

  const itemCount = props.value.length;
  const isSingle = props.value.length === 1;
  const label = isSingle ? arrayItemLabel(props.fieldDef) : arrayPluralLabel(props.fieldDef);
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
    <VexLink
      href={adminHref(
        { type: "document", slug: props.collection.slug, id: props.row.original._id },
        config.basePath,
      )}
    >
      {content}
    </VexLink>
  );
}
