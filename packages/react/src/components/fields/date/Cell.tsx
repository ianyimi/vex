"use client";

import {
  TDocument,
  type CellComponentProps,
  type DateField,
} from "@vexcms/core";
import { VexLink } from "../../ui";
import { adminHref } from "../../../utils/adminHref";
import { useVexConfig } from "../../../context/VexConfigContext";
import { formatDateFieldValue } from "./utils";

/**
 * Date field cell component for the data-table list view.
 *
 * Renders a Unix ms timestamp via {@link formatDateFieldValue} — date-only
 * when `fieldDef.time.hidden`, date+time otherwise.
 *
 * @param props - Component props
 * @param props.value - Raw Unix timestamp in milliseconds from the document
 * @param props.fieldDef - Resolved `DateField` definition
 * @returns The Cell Component for this field type
 *
 * @example
 * ```tsx
 * <DateFieldCell value={doc.publishedAt} fieldDef={publishedAtField} row={row} />
 * ```
 */
export function DateFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<DateField, TData>,
) {
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const config = useVexConfig();
  const content = (
    <span>{formatDateFieldValue({ value: props.value, time: props.fieldDef.time })}</span>
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
