"use client";

import {
  TDocument,
  type CellComponentProps,
  type CommitTsField,
} from "@vexcms/core";
import { VexLink } from "../../ui";
import { adminHref } from "../../admin/adminHref";
import { useVexConfig } from "../../config/VexConfigContext";
import { formatCommitTsFieldValue } from "./utils";

/**
 * `commitTs` field cell component for the data-table list view.
 *
 * @param props - Component props
 * @param props.value - Ms timestamp (already converted from `bigint` by `find`/`search`)
 * @param props.fieldDef - Resolved `CommitTsField` definition
 * @returns An em dash when the value is `undefined`/`null`; otherwise the formatted
 *   value, wrapped in a link to the document when this is the title field.
 */
export function CommitTsFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<CommitTsField, TData>,
) {
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const config = useVexConfig();
  const content = (
    <span>{formatCommitTsFieldValue({ value: props.value, format: props.fieldDef.admin.format })}</span>
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
