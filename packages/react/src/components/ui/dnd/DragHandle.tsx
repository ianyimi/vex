"use client";

import { type DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import { ComponentPropsWithoutRef, useContext } from "react";
import { cn } from "../../../styles/utils";
import { DraggableInstanceContext } from "./Draggable";
import { useDndContext } from "./DndProvider";

export function DragHandle({
  dragHandleProps: dragHandlePropsProp,
  children,
  className,
  disabled = false,
  ...divProps
}: {
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  disabled?: boolean;
} & ComponentPropsWithoutRef<"div">) {
  const dnd = useDndContext();
  // Read the Draggable ancestor's context directly (nullable) instead of the
  // throwing `useDraggableInstanceContext` — rows that render outside a
  // `Draggable` wrapper (e.g. a non-reorderable single-value list item) are
  // a normal, supported case, not a misuse error. Only degrade to the
  // static/inert render below when there's genuinely no way to get real
  // drag handle props.
  const draggableCtx = useContext(DraggableInstanceContext);
  const inactive = !dnd.mounted || disabled || (!dragHandlePropsProp && !draggableCtx);

  if (inactive) {
    if (children) {
      return (
        <div
          className={cn("shrink-0 opacity-50 cursor-default pointer-events-none", className)}
          {...divProps}
        >
          {children}
        </div>
      );
    }
    return (
      <div
        className={cn("shrink-0 opacity-50 cursor-default pointer-events-none", className)}
        {...divProps}
      >
        <GripVertical size={16} />
      </div>
    );
  }

  const resolvedProps = dragHandlePropsProp ?? draggableCtx?.dragHandleProps ?? {};

  if (children) {
    return (
      <div className={cn("cursor-grab shrink-0", className)} {...resolvedProps} {...divProps}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("cursor-grab shrink-0", className)} {...resolvedProps} {...divProps}>
      <GripVertical size={16} />
    </div>
  );
}

DragHandle.displayName = "DragHandle";
