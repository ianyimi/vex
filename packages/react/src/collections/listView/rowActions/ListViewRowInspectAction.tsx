"use client";

import { EyeIcon } from "lucide-react";
import type { ReactNode } from "react";
import { DropdownMenuItem } from "../../../ui/dropdown-menu";
import { useListViewContext } from "../ListViewContext";
import type { ListViewRowSlotProps } from "./ListViewRowOpenAction";

/**
 * `vex.list.row.inspect` — opens the Inspect peek for this row. Never gated — see
 * `ListViewRowOpenAction`'s own note.
 *
 * Does not close or toggle an already-open peek for a different row — it just sets the
 * peek target to this row's id (Step 13); switching rows while the peek is open swaps its
 * content in place.
 *
 * @param props - {@link ListViewRowSlotProps}; `props.docs` is always exactly one document here.
 * @returns A `DropdownMenuItem` calling `useListViewContext().onInspect(props.docs[0]._id)`.
 */
export function ListViewRowInspectAction(props: ListViewRowSlotProps): ReactNode {
  const { onInspect } = useListViewContext();
  return (
    <DropdownMenuItem onClick={() => onInspect?.(props.docs[0]!._id)}>
      <EyeIcon className="size-4" />
      Inspect
    </DropdownMenuItem>
  );
}
