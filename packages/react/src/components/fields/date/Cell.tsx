"use client";

import {
  addLeadingSlash,
  TDocument,
  type CellComponentProps,
  type DateField,
} from "@vexcms/core";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";

/**
 * Date field cell component for the data-table list view.
 *
 * Renders a Unix ms timestamp as a locale date string via `Date.toLocaleDateString()`.
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
  const basePath = addLeadingSlash(config.basePath);
  const date = new Date(props.value);
  const content = <span>{date.toDateString()}</span>;
  if (!props.isTitleField) return content;
  return (
    <VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>
      {content}
    </VexLink>
  );
}
