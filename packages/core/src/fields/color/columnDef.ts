import type { ColumnDef } from "@tanstack/react-table";
import type { ColorFieldDef } from "../../types/fields";

/**
 * Generate a column definition for a color field.
 * Shows the color value as text with a color swatch indicator.
 */
export function colorColumnDef(props: {
  fieldKey: string;
  field: ColorFieldDef;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.field.label ?? props.fieldKey,
    size: 120,
    cell: (info) => {
      const value = info.getValue() as string | undefined;
      if (!value) return "";
      return value;
    },
    meta: {
      type: "color" as const,
    },
  };
}
