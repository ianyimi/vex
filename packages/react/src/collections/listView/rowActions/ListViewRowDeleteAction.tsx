"use client";

import { useState, type ReactNode } from "react";
import { Trash2Icon } from "lucide-react";
import { CRUD_ACTIONS, PERMISSION_SCOPES, vexConvexApi } from "@vexcms/core";
import { usePermission } from "../../../access";
import { useVexMutation } from "../../../hooks";
import { DropdownMenuItem } from "../../../ui/dropdown-menu";
import { DataTableBulkDeleteModal } from "../../../ui/data-table/DataTableBulkDeleteModal";
import { useListViewContext } from "../ListViewContext";
import type { ListViewRowSlotProps } from "./ListViewRowOpenAction";

/**
 * `vex.list.row.delete` — per-row delete, self-gated on `CRUD_ACTIONS.delete` (mirrors
 * `ListViewCreateAction`'s own self-check rather than a slot-level `access` predicate — every
 * built-in self-gates, Decision 37's "mirror the edit view"). Renders last in the ⋯ menu
 * (`LIST_BUILTIN_ORDER.rowDelete`, Decision 28), destructive-styled.
 *
 * A versioned collection's draft/published pair is already merged to one row
 * server-side (`find`/`search`'s `mergeDraftCounterparts`, core), so
 * `props.docs[0]._id` deletes only that merged row's own id — it never
 * cascades to a paired version, matching today's bulk-delete behavior.
 *
 * @param props - {@link ListViewRowSlotProps}; `props.docs` is always exactly one document here.
 * @returns A destructive `DropdownMenuItem` that confirms via {@link DataTableBulkDeleteModal} before deleting, or `null` without delete access.
 */
export function ListViewRowDeleteAction(props: ListViewRowSlotProps): ReactNode {
  const { collection, selection } = useListViewContext();
  const canDelete = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.delete,
    scope: PERMISSION_SCOPES.any,
  });
  const [open, setOpen] = useState(false);
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

  if (!canDelete) return null;

  const doc = props.docs[0]!;

  return (
    <>
      <DropdownMenuItem
        variant="destructive"
        // Base UI's `Menu.Item` has no `onSelect`, only `onClick` — and by default
        // (`closeOnClick: true`) closing the menu unmounts every item inside
        // `DropdownMenuContent`, including this one, before `setOpen(true)` could ever be
        // observed (see `EditActionsMenuDialogContext.tsx`'s own note on the same Base UI
        // behavior). `closeOnClick={false}` keeps this item — and its local `open` state —
        // mounted so {@link DataTableBulkDeleteModal} can render over the still-open ⋯ menu.
        closeOnClick={false}
        onClick={() => setOpen(true)}
      >
        <Trash2Icon className="size-4" />
        Delete
      </DropdownMenuItem>
      <DataTableBulkDeleteModal
        open={open}
        onOpenChange={setOpen}
        selectedCount={1}
        entityName={collection.labels.plural.toLowerCase()}
        isDeleting={removeMutation.isPending}
        onConfirm={async () => {
          await removeMutation.mutateAsync({ ids: [doc._id], collection: collection.slug });
          setOpen(false);
          if (selection.selectedIds.includes(doc._id)) {
            selection.setSelectedIds(selection.selectedIds.filter((id) => id !== doc._id));
          }
        }}
      />
    </>
  );
}
