"use client";

import { addLeadingSlash, type CellComponentProps, type GroupField, TDocument } from "@vexcms/core";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";

/**
 * Group field cell component for the admin list-table view.
 *
 * Shows a serialized preview of the group's own fields (e.g.
 * `{"title":"Hello","body":"World"}`), cut at 77 characters with the full
 * serialization on `title`. Renders `—` when the value is absent.
 *
 * A rendered nested-field layout is intentionally out of scope here — the list
 * view is not the right place for nested object data, so the preview stays a
 * flat serialization.
 *
 * @param props - Component props.
 * @returns The serialized field preview, or an em-dash placeholder when the value is absent.
 *
 * @example
 * ```tsx
 * <GroupFieldCell value={{ title: "Hello", body: "World" }} ... />
 * // → renders `{"title":"Hello","body":"World"}`
 * ```
 */
export function GroupFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<GroupField, TData>,
) {
  const value = props.value as Record<string, unknown> | null | undefined;
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);

  if (value == null || typeof value !== "object") {
    return <span className="text-muted-foreground">—</span>;
  }

  const preview = JSON.stringify(value);

  const content = (
    <span className="text-xs text-muted-foreground font-mono" title={preview}>
      {preview.length > 77 ? `${preview.slice(0, 77)}...` : preview}
    </span>
  );
  if (!props.isTitleField) return content;
  return (
    <VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>
      {content}
    </VexLink>
  );
}
