import { TDocument, type CellComponentProps, type EmailField } from "@vexcms/core";
import { VexLink } from "../../ui";
import { adminHref } from "../../../utils/adminHref";
import { useVexConfig } from "../../../context/VexConfigContext";

/**
 * Email field cell component for the data-table list view.
 *
 * Always renders the value as a `VexLink`. For title fields the link
 * navigates to the document edit page (matching every other title-field
 * cell); for non-title fields the link is a `mailto:` link to the address
 * itself. Null/undefined/empty values show an em-dash placeholder. Values
 * longer than 77 characters are truncated with the full address shown on
 * hover via the `title` attribute.
 *
 * @param props - Component props.
 * @param props.value - Raw email value from the document (may be null, undefined, or empty).
 * @param props.fieldDef - Resolved `EmailField` definition.
 * @param props.isTitleField - When `true`, renders an edit-page link instead of a `mailto:` link.
 * @returns The cell component for this field type.
 *
 * @example
 * ```tsx
 * <EmailFieldCell value={doc.contactEmail} fieldDef={contactEmailField} row={row} isTitleField={false} />
 * ```
 */
export function EmailFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<EmailField, TData>,
) {
  if (props.value === undefined || props.value === null || props.value === "") return <span>—</span>;
  const config = useVexConfig();
  const href = props.isTitleField
    ? adminHref(
        { type: "document", slug: props.collection.slug, id: props.row.original._id },
        config.basePath,
      )
    : `mailto:${props.value}`;
  return (
    <VexLink href={href}>
      <span className="font-bold" title={props.value}>
        {props.value.length > 77 ? `${props.value.slice(0, 77)}...` : props.value}
      </span>
    </VexLink>
  );
}
