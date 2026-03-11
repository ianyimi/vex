import type { ColumnDef } from "@tanstack/react-table";
import type { UploadFieldMeta } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for an upload field.
 *
 * The cell renders the raw document ID by default. Consumers (e.g., admin-next)
 * can replace the cell renderer using the column meta to show a file preview.
 *
 * Meta includes `type: "upload"` and `to` (target collection slug) so that
 * the rendering layer can detect upload columns and provide custom rendering.
 */
export function uploadColumnDef(props: {
  fieldKey: string;
  meta: UploadFieldMeta;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.meta.label ?? toTitleCase(props.fieldKey),
    meta: {
      type: "upload",
      to: props.meta.to,
      noTruncate: true,
    },
    cell: (info) => {
      const value = info.getValue();
      if (!value || typeof value !== "string") return "";
      return value;
    },
  };
}
