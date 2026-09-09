"use client";

import {
  addLeadingSlash,
  type CellComponentProps,
  type BlocksField,
  type GenericBlock,
  TDocument,
} from "@vexcms/core";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";

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
  const basePath = addLeadingSlash(config.basePath);

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
    <VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>
      {content}
    </VexLink>
  );
}
