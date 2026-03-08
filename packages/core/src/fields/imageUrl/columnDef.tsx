import type { ColumnDef } from "@tanstack/react-table";
import type { ImageUrlFieldMeta } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for an imageUrl field.
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.meta.label ?? toTitleCase(props.fieldKey)
 * - cell: renders an <img> thumbnail
 */
export function imageUrlColumnDef(props: {
  fieldKey: string;
  meta: ImageUrlFieldMeta;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.meta.label ?? toTitleCase(props.fieldKey),
    meta: { align: props.meta.admin?.cellAlignment ?? "center" },
    cell: (info) => {
      const value = info.getValue();
      if (!value || typeof value !== "string") return "";
      const size = props.meta.width ?? 28;
      return (
        <img
          src={value}
          width={size}
          height={props.meta.height ?? size}
          className="rounded-full object-cover"
          style={{ width: size, height: props.meta.height ?? size }}
        />
      );
    },
  };
}
