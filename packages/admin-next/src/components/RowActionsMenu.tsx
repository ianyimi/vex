"use client";

import { ComponentPropsWithRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button, Popover, PopoverTrigger, PopoverContent } from "@vexcms/ui";

interface RowActionsMenuProps extends ComponentPropsWithRef<"button"> {
  /** Callback to navigate to the edit view for this document */
  onEdit: () => void;
  /** Callback to trigger the delete modal for this document */
  onDelete: () => void;
  /** Whether delete is hidden entirely (e.g., disableDelete flag on collection) */
  hideDelete?: boolean;
  /** Whether delete is disabled for this specific document (greyed out but visible) */
  disableDelete?: boolean;
  /** Whether edit is disabled (e.g., no update permission) */
  disableEdit?: boolean;
}

export function RowActionsMenu({
  onEdit,
  onDelete,
  hideDelete,
  disableDelete,
  disableEdit,
  ...divProps
}: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon-sm" {...divProps} />}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Actions</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-1 w-40">
        {!disableEdit && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 px-2 text-sm"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}
        {!hideDelete && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 px-2 text-sm text-destructive hover:text-destructive disabled:text-muted-foreground disabled:opacity-50"
            onClick={() => {
              if (disableDelete) return;
              setOpen(false);
              onDelete();
            }}
            disabled={disableDelete}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
