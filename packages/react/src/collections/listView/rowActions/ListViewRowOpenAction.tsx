"use client";

import { ExternalLinkIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { TDocument } from "@vexcms/core";
import { useVexConfig } from "../../../config/VexConfigContext";
import { adminHref } from "../../../admin/adminHref";
import { VexLink } from "../../../ui/VexLink";
import { DropdownMenuItem } from "../../../ui/dropdown-menu";
import { useListViewContext } from "../ListViewContext";

/** Props every `list.row.actions`/`list.bulkActions` contribution receives — one row for `row.actions`, every selected row for `bulkActions`. The rest of the list's state comes from `useListViewContext()`. */
export interface ListViewRowSlotProps {
  docs: TDocument[];
}

/**
 * `vex.list.row.open` — a `DropdownMenuItem` linking to this row's edit view. Exists for
 * users who prefer menu-driven navigation, and for the narrow-container layout where the
 * horizontally-scrolling table (sticky first column) makes menu-driven navigation more
 * discoverable than relying on a row click alone. Never gated — seeing the row at all
 * already required read access.
 *
 * @param props - {@link ListViewRowSlotProps}; `props.docs` is always exactly one document here.
 * @returns A `DropdownMenuItem` rendering a {@link VexLink} to the edit view.
 */
export function ListViewRowOpenAction(props: ListViewRowSlotProps): ReactNode {
  const { collection } = useListViewContext();
  const config = useVexConfig();
  return (
    <DropdownMenuItem
      render={
        <VexLink
          href={adminHref(
            { type: "document", slug: collection.slug, id: props.docs[0]!._id },
            config.basePath,
          )}
        />
      }
    >
      <ExternalLinkIcon className="size-4" />
      Edit
    </DropdownMenuItem>
  );
}
