"use client";

import {
  type CellComponentProps,
  type BlocksField,
  type GenericBlock,
  TDocument,
} from "@vexcms/core";
import { VexLink } from "../../ui";
import { adminHref } from "../../admin/adminHref";
import { useVexConfig } from "../../config/VexConfigContext";

/**
 * Blocks field cell component for the admin list-table view.
 *
 * Shows a compact count badge: `"3 blocks"`. Renders `—` when absent or empty.
 *
 * @param props - Component props.
 * @returns The count badge, or an em-dash placeholder when there are no blocks.
 */
export function BlocksFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<BlocksField, TData>,
) {
  const value = props.value as GenericBlock[] | null | undefined;
  const config = useVexConfig();

  if (!value || !Array.isArray(value) || value.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const { singular, plural } = props.fieldDef.labels;

  const preview = JSON.stringify(value);
  const content = (
    <span className="text-xs text-muted-foreground" title={preview}>
      {value.length} {value.length === 1 ? singular : plural}
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
