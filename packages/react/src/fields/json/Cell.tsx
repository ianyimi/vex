import { TDocument, type CellComponentProps, type JsonField } from "@vexcms/core";
import { VexLink } from "../../ui";
import { adminHref } from "../../admin/adminHref";
import { useVexConfig } from "../../config/VexConfigContext";

/** Cell preview truncation threshold, in characters of the serialized JSON. */
const JSON_CELL_TRUNCATE_LENGTH = 80;

/**
 * Formats a JSON field's value for the data-table cell: a one-line
 * `JSON.stringify`, cut at {@link JSON_CELL_TRUNCATE_LENGTH} characters.
 *
 * @param value - The field's stored value.
 * @returns The (possibly truncated) one-line JSON preview.
 */
function formatJsonCellPreview(value: unknown): string {
  const serialized = JSON.stringify(value);
  return serialized.length > JSON_CELL_TRUNCATE_LENGTH
    ? `${serialized.slice(0, JSON_CELL_TRUNCATE_LENGTH)}...`
    : serialized;
}

/**
 * JSON field cell component for the data-table list view.
 *
 * Renders a truncated one-line `JSON.stringify` preview of the stored value.
 * Null/undefined values show an em-dash placeholder. The full serialized
 * value is always available on the `title` attribute.
 *
 * @param props - Component props.
 * @param props.value - Raw value from the document (may be null or undefined).
 * @param props.fieldDef - Resolved `JsonField` definition.
 * @returns The Cell component for this field type.
 *
 * @example
 * ```tsx
 * <JsonFieldCell value={doc.settings} fieldDef={settingsField} row={row} />
 * ```
 */
export function JsonFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<JsonField, TData>,
) {
  const config = useVexConfig();
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const serialized = JSON.stringify(props.value);
  const preview = formatJsonCellPreview(props.value);
  if (props.isTitleField) {
    return (
      <VexLink
        href={adminHref(
          { type: "document", slug: props.collection.slug, id: props.row.original._id },
          config.basePath,
        )}
      >
        <span className="font-mono font-bold" title={serialized}>
          {preview}
        </span>
      </VexLink>
    );
  }
  return (
    <span className="font-mono" title={serialized}>
      {preview}
    </span>
  );
}
