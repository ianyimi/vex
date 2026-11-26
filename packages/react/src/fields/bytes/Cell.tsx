"use client";

import { formatBytes, TDocument, type CellComponentProps, type BytesField } from "@vexcms/core";
import { VexLink } from "../../ui";
import { adminHref } from "../../admin/adminHref";
import { useVexConfig } from "../../config/VexConfigContext";

/**
 * Bytes field cell component for the data-table list view.
 *
 * Shows the stored payload's byte size (`formatBytes`, e.g. `"12 B"` /
 * `"1.5 KB"`). Absent values show an em-dash placeholder.
 *
 * @param props - Component props.
 * @param props.value - Raw value from the document (may be null or undefined)
 * @param props.fieldDef - Resolved `BytesField` definition
 * @returns The Cell component for this field type
 *
 * @example
 * ```tsx
 * <BytesFieldCell value={doc.payload} fieldDef={payloadField} row={row} />
 * ```
 */
export function BytesFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<BytesField, TData>,
) {
  const config = useVexConfig();
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const size = formatBytes(props.value.byteLength);
  if (props.isTitleField) {
    return (
      <VexLink
        href={adminHref(
          { type: "document", slug: props.collection.slug, id: props.row.original._id },
          config.basePath,
        )}
      >
        <span className="font-mono font-bold">{size}</span>
      </VexLink>
    );
  }
  return <span className="font-mono tabular-nums">{size}</span>;
}
