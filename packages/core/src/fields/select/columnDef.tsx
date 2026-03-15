import type { ColumnDef } from "@tanstack/react-table";
import type { SelectFieldDef } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Default hex colors rotated through when options don't specify a `badgeColor`.
 */
const DEFAULT_BADGE_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#a855f7", // purple
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#06b6d4", // cyan
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#f97316", // orange
  "#d946ef", // fuchsia
] as const;

/**
 * Builds a ColumnDef for a select field.
 *
 * @param props.fieldKey - The field name (used as accessorKey)
 * @param props.field - The select field definition (includes options for label lookup)
 * @returns A ColumnDef for the select field
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.field.label ?? toTitleCase(props.fieldKey)
 * - cell: renders option values as colored badges in a scrollable flex grid
 */
export function selectColumnDef(props: {
  fieldKey: string;
  field: SelectFieldDef;
}): ColumnDef<Record<string, unknown>> {
  const optionMap = new Map(
    props.field.options.map((opt, i) => [
      opt.value,
      {
        label: opt.label,
        color: opt.badgeColor ?? DEFAULT_BADGE_COLORS[i % DEFAULT_BADGE_COLORS.length],
      },
    ]),
  );

  return {
    accessorKey: props.fieldKey,
    header:
      (props.field.hasMany
        ? props.field.labels?.singular
        : props.field.label) ?? toTitleCase(props.fieldKey),
    meta: {
      align: props.field.admin?.cellAlignment ?? "left",
      noTruncate: true,
    },
    cell: (info) => {
      const raw = info.getValue();
      const values = Array.isArray(raw)
        ? (raw as string[])
        : raw != null
          ? [String(raw)]
          : [];

      if (values.length === 0) return null;

      return (
        <div className="flex flex-wrap gap-1 max-w-[240px] max-h-[60px] overflow-auto">
          {values.map((v) => {
            const opt = optionMap.get(v);
            return (
              <span
                key={v}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white shrink-0"
                style={{ backgroundColor: opt?.color }}
              >
                {opt?.label ?? v}
              </span>
            );
          })}
        </div>
      );
    },
  };
}
