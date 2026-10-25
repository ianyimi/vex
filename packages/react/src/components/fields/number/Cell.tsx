import {
  TDocument,
  type CellComponentProps,
  type NumberField,
} from "@vexcms/core";
import { VexLink } from "../../ui";
import { adminHref } from "../../../utils/adminHref";
import { useVexConfig } from "../../../context/VexConfigContext";

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
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const config = useVexConfig();
  const content = <span>{props.value}</span>;
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
