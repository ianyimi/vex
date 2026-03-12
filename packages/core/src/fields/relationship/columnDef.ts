import type { ColumnDef } from "@tanstack/react-table";
import type { RelationshipFieldDef } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for a relationship field.
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.field.label ?? toTitleCase(props.fieldKey)
 * - meta: includes relationship info (type, to) for DataTable to fetch related docs
 * - cell: shows raw ID (DataTable component resolves to useAsTitle at render time)
 */
export function relationshipColumnDef(props: {
  fieldKey: string;
  field: RelationshipFieldDef;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: (props.field.hasMany ? props.field.labels?.singular : props.field.label) ?? toTitleCase(props.fieldKey),
    meta: { type: "relationship", to: props.field.to, align: props.field.admin?.cellAlignment ?? "left" },
    cell: (info) => {
      const value = info.getValue();
      if (value == null) return "";
      if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
      return String(value);
    },
  };
}
