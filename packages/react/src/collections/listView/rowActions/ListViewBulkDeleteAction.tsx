"use client";

import { useState, type ReactNode } from "react";
import { CRUD_ACTIONS, PERMISSION_SCOPES, vexConvexApi } from "@vexcms/core";
import { usePermission } from "../../../access";
import { useVexMutation } from "../../../hooks";
import { Button } from "../../../ui/button";
import { DataTableBulkDeleteModal } from "../../../ui/data-table/DataTableBulkDeleteModal";
import { useListViewContext } from "../ListViewContext";
import type { ListViewRowSlotProps } from "./ListViewRowOpenAction";

/**
 * `vex.list.bulk.delete` — the Delete action inside `ListViewToolbar`'s own inline bulk group
 * (count / "Select all N loaded" / this `list.bulkActions` slot / Clear — Decision 22,
 * Decision 28), self-gated on `CRUD_ACTIONS.delete`. Renders nothing while `props.docs` is
 * empty, so the surrounding `SlotOutlet` mounts no empty group. Ordered last within
 * `list.bulkActions` (`LIST_BUILTIN_ORDER.bulkDelete`), after any project contribution.
 *
 * A bare `Button` + confirmation modal — NOT {@link DataTableBulkActions}, which bundles its
 * own count text, card styling, and Clear button into one self-contained group. `ListViewToolbar`
 * already owns the count, "Select all N loaded", and Clear for its surrounding bulk group;
 * wrapping this slot's own contribution in `DataTableBulkActions` too produced two visibly
 * separate bulk bars (duplicate count, duplicate Clear) once mounted through `ListViewToolbar`'s
 * `list.bulkActions` `SlotOutlet` (developer-reported live). `DataTableBulkActions` itself is
 * unchanged — still used standalone, unmodified, by `MediaCollectionListView`, which has no
 * surrounding toolbar group of its own to own that chrome.
 *
 * @param props - {@link ListViewRowSlotProps}; `props.docs` is every currently-selected row.
 * @returns A destructive "Delete" button + {@link DataTableBulkDeleteModal}, or `null` when nothing
 *   is selected or the caller lacks delete access.
 */
export function ListViewBulkDeleteAction(props: ListViewRowSlotProps): ReactNode {
  const { collection, selection } = useListViewContext();
  const canDelete = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.delete,
    scope: PERMISSION_SCOPES.any,
  });
  const [open, setOpen] = useState(false);
  // Moved verbatim from `CollectionListView`'s prior `removeMutation`.
  const removeMutation = useVexMutation({
    collection: collection.slug,
    mutationFn: vexConvexApi.remove,
    operation: "remove",
    getChanges: ({ args }) =>
      args.ids.flatMap((id) => {
        const row = props.docs.find((doc) => doc._id === id);
        return row === undefined ? [] : [{ before: row }];
      }),
  });

  if (props.docs.length === 0 || !canDelete) return null;

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={removeMutation.isPending}
        icon="Trash2"
      >
        Delete
      </Button>
      <DataTableBulkDeleteModal
        open={open}
        onOpenChange={setOpen}
        selectedCount={props.docs.length}
        entityName={collection.labels.plural.toLowerCase()}
        isDeleting={removeMutation.isPending}
        onConfirm={async () => {
          await removeMutation.mutateAsync({
            ids: props.docs.map((doc) => doc._id),
            collection: collection.slug,
          });
          setOpen(false);
          selection.setSelectedIds([]);
        }}
      />
    </>
  );
}
