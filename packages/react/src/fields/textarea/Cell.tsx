import { TDocument, type CellComponentProps, type TextareaField } from "@vexcms/core";
import { VexLink } from "../../ui";
import { adminHref } from "../../admin/adminHref";
import { useVexConfig } from "../../config/VexConfigContext";

/** Truncation threshold — matches `text/Cell.tsx`'s own cutoff. */
const TRUNCATE_LENGTH = 77;

/**
 * Textarea field cell component for the data-table list view.
 *
 * Collapses the multi-line value down to a single line (newlines and
 * repeated whitespace collapsed to a single space) before truncating —
 * a data-table row must never grow taller than one line for this field.
 * Null/undefined values show an em-dash placeholder. The full raw value is
 * kept on the `title` attribute for hover.
 *
 * @param props - Component props
 * @param props.value - Raw value from the document (may be null or undefined)
 * @param props.fieldDef - Resolved `TextareaField` definition
 * @returns The Cell Component for this field type
 *
 * @example
 * ```tsx
 * <TextareaFieldCell value={doc.bio} fieldDef={bioField} row={row} />
 * ```
 */
export function TextareaFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<TextareaField, TData>,
) {
  const config = useVexConfig();
  if (props.value === undefined || props.value === null) return <span>—</span>;

  const singleLine = props.value.replace(/\s+/g, " ").trim();
  const display =
    singleLine.length > TRUNCATE_LENGTH ? `${singleLine.slice(0, TRUNCATE_LENGTH)}...` : singleLine;

  if (props.isTitleField) {
    return (
      <VexLink
        href={adminHref(
          { type: "document", slug: props.collection.slug, id: props.row.original._id },
          config.basePath,
        )}
      >
        <span className="font-bold" title={props.value}>
          {display}
        </span>
      </VexLink>
    );
  }
  return (
    <span title={props.value}>
      {display}
    </span>
  );
}
