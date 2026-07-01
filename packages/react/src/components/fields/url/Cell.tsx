import { addLeadingSlash, TDocument, type CellComponentProps, type UrlField } from "@vexcms/core";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";

/**
 * URL field cell component for the data-table list view.
 *
 * Always renders the value as a `VexLink`. For title fields the link
 * navigates to the document edit page; for non-title fields the link
 * navigates to the URL value itself. Values longer than 77 characters are
 * truncated with the full URL shown on hover via the `title` attribute.
 *
 * @param props - Component props.
 * @param props.value - Raw URL value from the document.
 * @param props.fieldDef - Resolved `UrlField` definition.
 * @param props.isTitleField - When `true`, renders an edit-page link instead of the URL.
 * @returns The cell component for this field type.
 *
 * @example
 * ```tsx
 * <UrlFieldCell value={doc.website} fieldDef={websiteField} row={row} isTitleField={false} />
 * ```
 */
export function UrlFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<UrlField, TData>,
) {
  if (!props.value) return null;
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  const href = props.isTitleField
    ? `${basePath}/${props.collection.slug}/${props.row.original._id}`
    : props.value;
  return (
    <VexLink href={href}>
      <span className="font-bold" title={props.value}>
        {props.value.length > 77 ? `${props.value.slice(0, 77)}...` : props.value}
      </span>
    </VexLink>
  );
}
