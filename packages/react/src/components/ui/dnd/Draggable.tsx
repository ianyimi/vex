"use client";

import React, {
  ComponentPropsWithRef,
  isValidElement,
  ReactNode,
  ReactElement,
  createContext,
  useContext,
} from "react";

import {
  Draggable as DNDDraggable,
  type DraggableProps as DNDDraggableProps,
  type DraggableProvided,
  type DraggableStateSnapshot,
  type DraggableProvidedDragHandleProps,
  type DraggableRubric,
} from "@hello-pangea/dnd";
import { cn } from "../../../styles/utils";

export interface DragHandleContextValue {
  dragHandleProps: DraggableProvidedDragHandleProps | null;
  isDragging: boolean;
}

export const DraggableInstanceContext =
  createContext<DragHandleContextValue | null>(null);

export function useDraggableInstanceContext(): DragHandleContextValue {
  const dragContext = useContext(DraggableInstanceContext);
  if (!dragContext) {
    throw new Error(
      "useDraggableInstanceContext must be called from within a Draggable component, or with access to DragHandleContextValue",
    );
  }
  return dragContext;
}

interface DraggableProps extends Omit<
  DNDDraggableProps,
  "children" | "draggableId"
> {
  id: string;
  isDragHandle?: boolean;
  children: ReactNode | DNDDraggableProps["children"];
  div?: ComponentPropsWithRef<"div">;
}

type DraggableChildrenFn = (
  provided: DraggableProvided,
  snapshot: DraggableStateSnapshot,
  rubric: DraggableRubric,
) => ReactNode | null;

export function Draggable({
  id,
  index,
  isDragHandle = false,
  children,
  div,
  ...draggableProps
}: DraggableProps) {
  return (
    <DNDDraggable draggableId={id} index={index} {...draggableProps}>
      {(provided, snapshot, rubric) => {
        const dragHandleProps = provided.dragHandleProps;
        const { className, ...divProps } = div ?? { className: "" };

        // Create context value for DragHandle
        const dragHandleContextValue: DragHandleContextValue = {
          dragHandleProps,
          isDragging: snapshot.isDragging,
        };

        // Build wrapper props: always draggableProps; dragHandleProps only when
        // isDragHandle=true (the whole wrapper is the handle, no child DragHandle).
        // When isDragHandle=false, dragHandleProps are provided via context to a
        // child DragHandle component — putting them on the outer wrapper too would
        // create two elements with the same data-rfd-drag-handle-* attrs, corrupting
        // @hello-pangea/dnd's position tracking after the first drag.
        const wrapperProps: Record<string, unknown> = {};
        wrapperProps.ref = provided.innerRef;
        wrapperProps.className = cn(isDragHandle && "cursor-grab", className);

        if (provided.draggableProps) {
          const dp = provided.draggableProps as unknown as Record<
            string,
            unknown
          >;
          for (const key of Object.keys(dp)) {
            wrapperProps[key] = dp[key];
          }
        }

        if (isDragHandle && dragHandleProps) {
          const dhp = dragHandleProps as unknown as Record<string, unknown>;
          for (const key of Object.keys(dhp)) {
            wrapperProps[key] = dhp[key];
          }
        }

        if (divProps) {
          for (const key of Object.keys(divProps)) {
            wrapperProps[key] = (
              divProps as unknown as Record<string, unknown>
            )[key];
          }
        }

        if (typeof children === "function") {
          const childrenResult = (children as DraggableChildrenFn)(
            provided,
            snapshot,
            rubric,
          );
          return (
            <DraggableInstanceContext.Provider value={dragHandleContextValue}>
              <div {...wrapperProps}>{childrenResult}</div>
            </DraggableInstanceContext.Provider>
          );
        }

        if (isValidElement(children)) {
          const element = children as ReactElement;
          const elementProps = element.props as Record<string, unknown>;
          const { children: elementChildren, ...restProps } = elementProps;

          return (
            <DraggableInstanceContext.Provider value={dragHandleContextValue}>
              <div {...wrapperProps}>
                {React.createElement(
                  element.type as React.ComponentType<Record<string, unknown>>,
                  restProps as Record<string, unknown>,
                  elementChildren as ReactNode,
                )}
              </div>
            </DraggableInstanceContext.Provider>
          );
        }

        return (
          <DraggableInstanceContext.Provider value={dragHandleContextValue}>
            <div {...wrapperProps}>{children}</div>
          </DraggableInstanceContext.Provider>
        );
      }}
    </DNDDraggable>
  );
}
