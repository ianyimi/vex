"use client";

import { Button } from "../button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../tooltip";

/**
 * Props for {@link DataTableSortHeader}.
 *
 * @typeParam TFieldSlug - The collection's field slugs (plus `"_creationTime"`).
 */
export interface DataTableSortHeaderProps<TFieldSlug extends string = string> {
  /** The column's display label. */
  label: string;
  /** The field this header sorts by. */
  field: TFieldSlug | "_creationTime";
  /** The list's current sort, or `undefined` (falls back to `defaultView.sort`). */
  sort: { field: TFieldSlug | "_creationTime"; order: "asc" | "desc" } | undefined;
  /** Called with the next sort state on click — `undefined` clears back to `defaultView.sort`. */
  onSortChange: (sort: { field: TFieldSlug | "_creationTime"; order: "asc" | "desc" } | undefined) => void;
  /** Whether this field has `admin.enableSorting: true` and an index leading with it (Decision 6). A `false` value renders plain, unclickable text. Because `DataTable`'s caller (`CollectionListView`) already drops unreadable fields from `columns` entirely, a header only ever reaches this component for a readable field — no separate read-access prop is needed here (Decision 26). */
  enableSorting: boolean;
  /** `true` while a search is active — sort is disabled and shows "Sorted by relevance" (Decision 7). */
  disabled?: boolean;
  /** Optional field-type hint shown in the header's tooltip body (DESIGN-NOTES.md §1). Skipped entirely when absent. */
  typeHint?: string;
}

/**
 * A clickable TanStack Table column header that cycles a field's sort state:
 * unsorted → `asc` → `desc` → unsorted (clears `sort`, falling back to
 * `defaultView.sort`).
 *
 * Renders as plain, unclickable text when `enableSorting` is `false` (the
 * field has no leading index, Decision 6) or `disabled` is `true` (a search
 * is active, Decision 7 — parked sort, shown with a "Sorted by relevance"
 * tooltip).
 *
 * @param props - Component props. See {@link DataTableSortHeaderProps}.
 * @returns A sortable header button, or plain text when sorting is unavailable.
 */
export function DataTableSortHeader<TFieldSlug extends string = string>(
  props: DataTableSortHeaderProps<TFieldSlug>,
) {
  if (!props.enableSorting) {
    return <span>{props.label}</span>;
  }

  if (props.disabled) {
    return <span title="Sorted by relevance">{props.label}</span>;
  }

  const isActive = props.sort?.field === props.field;
  const order = isActive ? props.sort?.order : undefined;

  function handleClick() {
    if (!isActive) {
      props.onSortChange({ field: props.field, order: "asc" });
    } else if (order === "asc") {
      props.onSortChange({ field: props.field, order: "desc" });
    } else {
      props.onSortChange(undefined);
    }
  }

  const header = (
    <Button
      variant="ghost"
      onClick={handleClick}
      icon={order === "asc" ? "ArrowUp" : order === "desc" ? "ArrowDown" : "ArrowUpDown"}
      iconPosition="right"
      // Matches the plain, unsortable header text exactly (same font, size,
      // weight, left edge, baseline) — only the sort icon is new. The shared
      // `Button`'s own base classes (`font-mono text-[13px] h-8 px-3 border`,
      // Decision: "override in DataTableSortHeader, not ui/button.tsx") are
      // tuned for standalone buttons, not for standing in for a `<th>`'s own
      // plain-text content — every box-model/typography class that would
      // shift the label's position or restyle it is reset here instead. No
      // icon-gap override needed: `ui/button.tsx`'s own `iconPosition="right"`
      // icon margin (`ml-1`, fixed from a `mr-1` bug that left it trailing
      // into nothing) now correctly spaces the icon from this label, matching
      // every other icon+text button in the app.
      className="h-auto border-0 p-0 font-sans text-sm font-medium"
    >
      {props.label}
    </Button>
  );

  if (!props.typeHint) return header;

  return (
    <TooltipProvider delay={600}>
      <Tooltip>
        <TooltipTrigger render={header} />
        <TooltipContent>
          {props.label.toLowerCase()} · {props.typeHint}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
