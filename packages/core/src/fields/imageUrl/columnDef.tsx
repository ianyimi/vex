import type { ColumnDef } from "@tanstack/react-table";
import type { ImageUrlFieldDef } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for an imageUrl field.
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.field.label ?? toTitleCase(props.fieldKey)
 * - cell: renders an <img> thumbnail with fallback on error
 */
export function imageUrlColumnDef(props: {
  fieldKey: string;
  field: ImageUrlFieldDef;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.field.label ?? toTitleCase(props.fieldKey),
    meta: { align: props.field.admin?.cellAlignment ?? "center" },
    cell: (info) => {
      const value = info.getValue();
      if (!value || typeof value !== "string") return "";
      const size = props.field.width ?? 28;
      const height = props.field.height ?? size;
      return (
        <img
          src={value}
          alt=""
          width={size}
          height={height}
          className="rounded-full object-cover bg-muted"
          style={{ width: size, height }}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as any).style.display = "none";
          }}
        />
      );
    },
  };
}
