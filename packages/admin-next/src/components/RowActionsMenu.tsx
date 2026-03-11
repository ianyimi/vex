"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button, Popover, PopoverTrigger, PopoverContent } from "@vexcms/ui";

interface RowActionsMenuProps {
  /** Callback to navigate to the edit view for this document */
  onEdit: () => void;
  /** Callback to trigger the delete modal for this document */
  onDelete: () => void;
  /** Whether delete is disabled (e.g., disableDelete flag on collection) */
  disableDelete?: boolean;
}

export function RowActionsMenu(props: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon-sm" />}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Actions</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-1 w-40">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 h-8 px-2 text-sm"
          onClick={() => {
            setOpen(false);
            props.onEdit();
          }}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
        {!props.disableDelete && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 px-2 text-sm text-destructive hover:text-destructive"
            onClick={() => {
              setOpen(false);
              props.onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
