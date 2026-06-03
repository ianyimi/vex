"use client";

import { type DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import { ComponentPropsWithoutRef } from "react";
import { cn } from "../../../styles/utils";
import { useDraggableInstanceContext } from "./Draggable";

export function DragHandle({
  dragHandleProps: dragHandlePropsProp,
  children,
  className,
  ...divProps
}: {
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
} & ComponentPropsWithoutRef<"div">) {
  const ctx = useDraggableInstanceContext();
  const resolvedProps = dragHandlePropsProp ?? ctx.dragHandleProps ?? {};

  if (children) {
    return (
      <div
        className={cn("cursor-grab shrink-0", className)}
        {...resolvedProps}
        {...divProps}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn("cursor-grab shrink-0", className)}
      {...resolvedProps}
      {...divProps}
    >
      <GripVertical size={16} />
    </div>
  );
}

DragHandle.displayName = "DragHandle";

