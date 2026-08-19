"use client";

import { type DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import { ComponentPropsWithoutRef } from "react";
import { cn } from "../../../styles/utils";
import { useDraggableInstanceContext } from "./Draggable";
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
  if (!dnd.mounted || disabled) {
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

  const ctx = useDraggableInstanceContext();
  const resolvedProps = dragHandlePropsProp ?? ctx.dragHandleProps ?? {};

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
