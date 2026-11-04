"use client";

import { useListViewContext } from "../ListViewContext";
import { DataTableColumnsMenu } from "../../../ui/data-table/DataTableColumnsMenu";
import type { ActionPlacement } from "../../../ui/ActionsMenu";

/** Props for {@link ListViewColumnsAction}. */
export interface ListViewColumnsActionProps {
  /**
   * Which surface this render is for (mirrors the edit view's
   * `DocumentCancelAction`/`LivePreviewToggleAction` convention), forwarded
   * straight to `DataTableColumnsMenu`. `ListViewToolbar` mounts this component
   * TWICE — once with `placement` omitted (inline), once with
   * `placement="menu"` — each wrapped in a CSS class showing it on
   * opposite sides of the `@xl/list` breakpoint, matching the toolbar's
   * fixed CSS fold order: Copy link, then Columns, then Rows per load.
   */
  placement?: ActionPlacement;
}

/**
 * The `vex.list.columns` built-in — renders {@link DataTableColumnsMenu}
 * wired to `useListViewContext()`'s `columnMenuEntries`/`columns`/
 * `onColumnsChange`/`hasActiveView`/`density`/`onDensityChange`.
 * Mounted directly by `ListViewToolbar` (not through the `list.toolbar`
 * `SlotOutlet`, unlike `ListViewSearchAction`) — its CSS-driven fold needs two
 * live instances at once, which a single `SlotOutlet` resolution can't
 * produce without rendering `vex.list.search` twice too.
 *
 * @param props - See {@link ListViewColumnsActionProps}.
 * @returns {@link DataTableColumnsMenu}, or `null` when the collection has
 *   no readable columns (handled inside `DataTableColumnsMenu`).
 */
export function ListViewColumnsAction(props: ListViewColumnsActionProps) {
  const list = useListViewContext();
  return (
    <DataTableColumnsMenu
      columnMenuEntries={list.columnMenuEntries}
      columns={list.columns}
      onColumnsChange={list.onColumnsChange}
      hasActiveView={list.hasActiveView}
      density={list.density}
      onDensityChange={list.onDensityChange}
      placement={props.placement}
    />
  );
}
