import { addLeadingSlash, TDocument, type CellComponentProps, type TextField } from "@vexcms/core";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";

/**
 * Text field cell component for the data-table list view.
 *
 * Renders the string value of a text field. Null/undefined values show an
 * em-dash placeholder. Values longer than 80 characters are truncated with
 * the full text shown on hover via the `title` attribute.
 *
 * @param props - Component props
 * @param props.value - Raw value from the document (may be null or undefined)
 * @param props.fieldDef - Resolved `TextField` definition
 * @returns The Cell Component for this field type
 *
 * @example
 * ```tsx
 * <TextFieldCell value={doc.title} fieldDef={titleField} row={row} />
 * ```
 */
export function TextFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<TextField, TData>,
) {
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  if (props.isTitleField) {
    return (
      <VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>
        <span className="font-bold" title={props.value}>
          {props.value.length > 77 ? `${props.value.slice(0, 77)}...` : props.value}
        </span>
      </VexLink>
    );
  }
  return (
    <span title={props.value}>
      {props.value.length > 77 ? `${props.value.slice(0, 77)}...` : props.value}
    </span>
  );
}
