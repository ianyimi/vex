"use client";

import {
  DragDropContext,
  Droppable as DNDDroppable,
  type DroppableProps as DNDDroppableProps,
  type DroppableProvided,
  type DroppableStateSnapshot,
  type DragDropContextProps,
} from "@hello-pangea/dnd";
import React, {
  createContext,
  type ReactNode,
  type ComponentPropsWithoutRef,
  type ReactElement,
  useEffect,
  useRef,
} from "react";
import { cn } from "../../../styles/utils";
import { useDndRegistry } from "./DndProvider";

/**
 * Provides the parent droppable's effective type to child Draggable components.
 * Draggable reads this and passes it as `type` to DNDDraggable, so that the
 * package @hello-pangea/dnd's type system prevents cross-list isDraggingOver
 * signals — including the flash that occurs when a nested droppable is
 * geometrically inside an outer droppable and shares the same DragDropContext.
 */
export const DroppableTypeContext = createContext<string | null>(null);

interface DroppableProps extends Omit<DNDDroppableProps, "children" | "droppableId"> {
  id: string;
  children: ReactNode | DNDDroppableProps["children"];
  dndContext?: DragDropContextProps;
  /** Swap function called on drag end: (fromIndex, toIndex) => void */
  onReorder: (from: number, to: number) => void;
  /** Key for the wrapper div (needed for list items) */
  wrapperKey?: string | number;
  /**
   * Only used in standalone mode (no DndProvider ancestor).
   * Forces DragDropContext to re-mount after reorders.
   * Not needed when DndProvider is present.
   */
  dndKey?: string | number;
  div?: ComponentPropsWithoutRef<"div">;
}

type RenderFn = (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => ReactNode;

export function Droppable({
  id,
  direction = "vertical",
  div,
  dndContext,
  children,
  wrapperKey,
  dndKey,
  onReorder,
  ...droppableProps
}: DroppableProps) {
  const registry = useDndRegistry();
  const activeDroppableId = registry?.activeDroppableId ?? null;
  const mounted = registry.mounted ?? false;

  // Always keep a fresh ref to onReorder so registered handlers never stale-close.
  const onReorderRef = useRef(onReorder);
  useEffect(() => {
    onReorderRef.current = onReorder;
  });

  // Register with the shared DragDropContext when DndProvider is present.
  useEffect(() => {
    if (!registry || !mounted) return;
    return registry.register(id, (from, to) => onReorderRef.current(from, to));
  }, [id, registry, mounted]);

  if (!mounted) {
    const { className, ...divProps } = div ?? { className: "" };
    return (
      <div
        suppressHydrationWarning
        className={cn("flex flex-col gap-2 border-border rounded-sm min-h-[4px]", className)}
        {...divProps}
      >
        {typeof children === "function" ? null : children}
      </div>
    );
  }

  const renderInner = () => {
    // Extract type so we can use the same value for both the DNDDroppable prop
    // and the DroppableTypeContext — keeping them in sync if the user overrides.
    const {
      isDropDisabled: userIsDropDisabled,
      type: userType,
      ...restDroppableProps
    } = droppableProps as typeof droppableProps & {
      isDropDisabled?: boolean;
      type?: string;
    };

    // Default type is the droppable's own id — guaranteed unique per list.
    // Child Draggables read this from DroppableTypeContext and pass it as their
    // own type, so @hello-pangea/dnd's type system prevents isDraggingOver from
    // ever firing on a droppable whose type doesn't match the dragging item.
    const droppableType = userType ?? id;

    const isDropDisabled =
      !!userIsDropDisabled || (activeDroppableId !== null && activeDroppableId !== id);

    return (
      <DroppableTypeContext.Provider value={droppableType}>
        <DNDDroppable
          droppableId={id}
          type={droppableType}
          direction={direction}
          isDropDisabled={isDropDisabled}
          {...restDroppableProps}
        >
          {(provided, snapshot) => {
            const { className, ...divProps } = div ?? { className: "" };

            const wrapperClassName = cn(
              "flex flex-col gap-2 border-border rounded-sm",
              snapshot.isDraggingOver && !isDropDisabled && "bg-border/50",
              className,
            );

            const wrapperBaseProps = {
              ref: provided.innerRef,
              ...(provided.droppableProps as unknown as Record<string, unknown>),
              className: wrapperClassName,
              ...(divProps as unknown as Record<string, unknown>),
            };

            if (typeof children === "function") {
              return (
                <div key={wrapperKey} {...wrapperBaseProps}>
                  {(children as RenderFn)(provided, snapshot)}
                  {provided.placeholder}
                </div>
              );
            }

            if (React.isValidElement(children)) {
              const element = children as ReactElement;
              const elementProps = element.props as Record<string, unknown>;
              return (
                <div key={wrapperKey} {...wrapperBaseProps}>
                  {React.createElement(
                    element.type,
                    { ...elementProps, provided, snapshot },
                    elementProps.children as ReactNode,
                  )}
                  {provided.placeholder}
                </div>
              );
            }

            return (
              <div key={wrapperKey} {...wrapperBaseProps}>
                {children}
                {provided.placeholder}
              </div>
            );
          }}
        </DNDDroppable>
      </DroppableTypeContext.Provider>
    );
  };

  // Shared context: no local DragDropContext needed.
  if (registry) {
    return renderInner();
  }

  // Standalone fallback: create a local DragDropContext.
  const { onDragStart, onDragEnd, ...dragContext } =
    dndContext ??
    ({
      onDragStart: () => {},
      onDragEnd: () => {},
    } as {
      onDragStart: DragDropContextProps["onDragStart"];
      onDragEnd: DragDropContextProps["onDragEnd"];
    });

  return (
    <DragDropContext
      key={dndKey}
      onDragStart={(start, provided) => {
        document.body.style.overflowX = "hidden";
        if (onDragStart) onDragStart(start, provided);
      }}
      onDragEnd={(res, provided) => {
        document.body.style.overflowX = "";
        if (!res.destination) return;
        onReorder(res.source.index, res.destination.index);
        if (onDragEnd) onDragEnd(res, provided);
      }}
      {...dragContext}
    >
      {renderInner()}
    </DragDropContext>
  );
}
