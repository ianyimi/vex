"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select";
import { RadioGroup, RadioGroupItem } from "../radio-group";
import type { ActionPlacement } from "../ActionsMenu";

/** Props for {@link DataTablePageSizeSelect}. */
export interface DataTablePageSizeSelectProps {
  /** The current page size — the client-side `numItems` for the next fetch/`loadMore()` call. */
  pageSize: number;
  /** The configured options (`collection.admin.view.state.pageSizeOptions`). */
  pageSizeOptions: number[];
  /** Called with the newly selected page size. This resets the list to the first page at the new size — the caller (`useVexListQuery`), not this component, owns that reset. */
  onPageSizeChange: (pageSize: number) => void;
  /**
   * Which surface this render is for (mirrors the edit view's
   * `DocumentCancelAction`/`LivePreviewToggleAction` convention) —
   * `"inline"` (default) renders the `Select`, `"menu"` renders a labeled
   * `RadioGroup` section for `ListViewToolbar`'s ⋯ overflow (the overflow
   * is itself a `DataTableResponsiveMenu` — a
   * `Popover`/`Sheet`, never a `DropdownMenu` — so this form can't depend
   * on Base UI's Menu primitives either).
   */
  placement?: ActionPlacement;
}

/**
 * Chooses the list's page size from `collection.admin.view.state.pageSizeOptions`,
 * labelled "Rows per load" (DESIGN-NOTES.md §5) — a `Select`
 * (`placement` omitted/`"inline"`) or a labeled `RadioGroup` section
 * (`placement="menu"`) nested inside `ListViewToolbar`'s ⋯ overflow.
 *
 * Pagination itself stays cursor Load More — this control only
 * changes how many items the NEXT fetch/`loadMore()` call requests; it
 * never jumps to a numbered page. Rendered by `ListViewToolbar`, in its
 * collapsible group alongside Copy link (not `DataTable`'s
 * own footer, which only shows the Load More button and the capped-count
 * status line). It has no `vex.list.*` id,
 * so it bypasses the slot system either way.
 *
 * @param props - Component props. See {@link DataTablePageSizeSelectProps}.
 * @returns The page size control, or `null` when `pageSizeOptions` has one or fewer entries.
 */
export function DataTablePageSizeSelect(props: DataTablePageSizeSelectProps) {
  if (props.pageSizeOptions.length <= 1) return null;

  if (props.placement === "menu") {
    return (
      <div className="flex flex-col gap-2 border-t pt-2 first:border-t-0 first:pt-0">
        <p className="px-2 text-xs font-medium text-muted-foreground">Rows per load</p>
        <RadioGroup
          value={String(props.pageSize)}
          onValueChange={(value) => props.onPageSizeChange(Number(value))}
          className="px-2"
        >
          {props.pageSizeOptions.map((n) => (
            <label key={n} className="flex items-center gap-2 text-sm">
              <RadioGroupItem value={String(n)} aria-label={`${n} per load`} />
              {n} per load
            </label>
          ))}
        </RadioGroup>
      </div>
    );
  }

  return (
    <Select
      value={String(props.pageSize)}
      onValueChange={(value) => props.onPageSizeChange(Number(value))}
    >
      <SelectTrigger aria-label={`Rows per load: ${props.pageSize} per load`}>
        <SelectValue>{(value: string) => `${value} per load`}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {props.pageSizeOptions.map((n) => (
          <SelectItem key={n} value={String(n)}>
            {n} per load
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
