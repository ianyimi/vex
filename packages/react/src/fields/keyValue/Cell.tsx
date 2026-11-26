"use client";

import { type CellComponentProps, type KeyValueField, TDocument } from "@vexcms/core";
import { adminHref } from "../../admin/adminHref";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../config/VexConfigContext";

/**
 * KeyValue field cell component for the admin list-table view.
 *
 * Shows the entry count ("3 entries"/"1 entry"). Renders `—` when the value
 * is absent — NOT a flat serialization like `GroupFieldCell`'s, since a
 * record's size is the meaningful list-column summary.
 *
 * @param props - Component props.
 * @returns The entry count, or an em-dash placeholder when the value is absent.
 */
export function KeyValueFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<KeyValueField, TData>,
) {
  const value = props.value as Record<string, unknown> | null | undefined;
  const config = useVexConfig();

  if (value == null || typeof value !== "object") {
    return <span className="text-muted-foreground">—</span>;
  }

  const entryCount = Object.keys(value).length;
  const content = (
    <span>
      {entryCount} {entryCount === 1 ? "entry" : "entries"}
    </span>
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
