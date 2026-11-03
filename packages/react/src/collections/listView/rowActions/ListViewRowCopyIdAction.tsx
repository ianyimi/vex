"use client";

import { CopyIcon } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { DropdownMenuItem } from "../../../ui/dropdown-menu";
import type { ListViewRowSlotProps } from "./ListViewRowOpenAction";

/**
 * `vex.list.row.copyId` — copies this row's `_id` to the clipboard. Never gated — see
 * `ListViewRowOpenAction`'s own note.
 *
 * @param props - {@link ListViewRowSlotProps}; `props.docs` is always exactly one document here.
 * @returns A `DropdownMenuItem` copying `props.docs[0]._id`.
 */
export function ListViewRowCopyIdAction(props: ListViewRowSlotProps): ReactNode {
  return (
    <DropdownMenuItem
      onClick={async () => {
        await navigator.clipboard.writeText(props.docs[0]!._id);
        toast.success("Copied ID");
      }}
    >
      <CopyIcon className="size-4" />
      Copy ID
    </DropdownMenuItem>
  );
}
