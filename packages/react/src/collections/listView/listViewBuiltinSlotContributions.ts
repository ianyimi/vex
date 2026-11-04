import type { ComponentContributionInput } from "@vexcms/core";
import { BUILTIN_CONTRIBUTION_IDS } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { ListViewCreateAction } from "./toolbar/ListViewCreateAction";
import { ListViewRowOpenAction } from "./rowActions/ListViewRowOpenAction";
import { ListViewRowInspectAction } from "./rowActions/ListViewRowInspectAction";
import { ListViewRowCopyIdAction } from "./rowActions/ListViewRowCopyIdAction";
import { ListViewRowDeleteAction } from "./rowActions/ListViewRowDeleteAction";
import { ListViewBulkDeleteAction } from "./rowActions/ListViewBulkDeleteAction";
import { ListViewSearchAction } from "./toolbar/ListViewSearchAction";
import { ListViewFiltersAction } from "./filters/ListViewFiltersAction";
import type { ListViewFiltersSlotProps } from "./filters/ListViewFilterBuilder";
import type { ListViewRowSlotProps } from "./rowActions/ListViewRowOpenAction";

/**
 * `order` values that keep the row-menu order (Edit, Inspect, Copy ID,
 * contributions, Delete last) and bulk-delete-last regardless of how many contributions a
 * project adds — any contribution's own `order` defaults to `0`, which always lands between
 * `rowCopyId`/project contributions and the matching `Delete`.
 */
export const LIST_BUILTIN_ORDER = {
  rowOpen: -30,
  rowInspect: -20,
  rowCopyId: -10,
  rowDelete: 1000,
  bulkDelete: 1000,
} as const;

/**
 * `list.header.actions`' built-in contributions — just `vex.list.create`.
 * @returns A single-entry contribution array mounting {@link ListViewCreateAction}.
 */
export function listHeaderActionsBuiltins(): ComponentContributionInput<ReactHKT, Record<string, never>>[] {
  return [{ id: BUILTIN_CONTRIBUTION_IDS.list.create, component: ListViewCreateAction }];
}

/**
 * `list.row.actions`' built-in contributions, in Edit/Inspect/Copy ID/Delete order.
 * @returns The Edit/Inspect/Copy ID/Delete row-action contributions, each tagged with its {@link LIST_BUILTIN_ORDER} value.
 */
export function listRowActionsBuiltins(): ComponentContributionInput<ReactHKT, ListViewRowSlotProps>[] {
  return [
    { id: BUILTIN_CONTRIBUTION_IDS.list.rowOpen, component: ListViewRowOpenAction, order: LIST_BUILTIN_ORDER.rowOpen },
    { id: BUILTIN_CONTRIBUTION_IDS.list.rowInspect, component: ListViewRowInspectAction, order: LIST_BUILTIN_ORDER.rowInspect },
    { id: BUILTIN_CONTRIBUTION_IDS.list.rowCopyId, component: ListViewRowCopyIdAction, order: LIST_BUILTIN_ORDER.rowCopyId },
    { id: BUILTIN_CONTRIBUTION_IDS.list.rowDelete, component: ListViewRowDeleteAction, order: LIST_BUILTIN_ORDER.rowDelete },
  ];
}

/**
 * `list.bulkActions`' built-in contributions — just `vex.list.bulk.delete`, ordered last.
 * @returns A single-entry contribution array mounting {@link ListViewBulkDeleteAction}, ordered via `LIST_BUILTIN_ORDER.bulkDelete`.
 */
export function listBulkActionsBuiltins(): ComponentContributionInput<ReactHKT, ListViewRowSlotProps>[] {
  return [{ id: BUILTIN_CONTRIBUTION_IDS.list.bulkDelete, component: ListViewBulkDeleteAction, order: LIST_BUILTIN_ORDER.bulkDelete }];
}

/**
 * `list.toolbar`'s built-in contributions — just `vex.list.search`.
 * `vex.list.columns` is NOT resolved here even though
 * `BUILTIN_CONTRIBUTION_IDS.list.columns` exists: the
 * CSS-only fold needs `ListViewColumnsAction` mounted TWICE at once (inline +
 * menu placement), which a single `SlotOutlet` resolution of this slot
 * can't produce without rendering `vex.list.search` twice too (search
 * never collapses). `ListViewToolbar` mounts `ListViewColumnsAction`
 * directly instead, the same way it already owns Copy link/Rows-per-load
 * (neither of which has a `vex.list.*` id either).
 * @returns A single-entry contribution array mounting {@link ListViewSearchAction}.
 */
export function listToolbarContributions(): ComponentContributionInput<ReactHKT, Record<string, never>>[] {
  return [{ id: BUILTIN_CONTRIBUTION_IDS.list.search, component: ListViewSearchAction }];
}

/**
 * `list.filters`' built-in contributions — just `vex.list.filters`.
 * @returns A single-entry contribution array mounting {@link ListViewFiltersAction}.
 */
export function listFiltersContributions(): ComponentContributionInput<ReactHKT, ListViewFiltersSlotProps>[] {
  return [{ id: BUILTIN_CONTRIBUTION_IDS.list.filters, component: ListViewFiltersAction }];
}
