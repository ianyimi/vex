import type { CellComponentProps } from "@vexcms/core";
import type { TextField } from "@vexcms/core";

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
export function TextFieldCell(props: CellComponentProps<TextField>) {
  if (props.value.length > 80) {
    return <span title={props.value}>{props.value.slice(0, 77)}...</span>;
  }

  return <span>{props.value}</span>;
}
