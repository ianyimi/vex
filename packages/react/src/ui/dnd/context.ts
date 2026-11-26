"use client"

import { createContext, useContext } from "react";

import { globalSingleton } from "../../utils/globalSingleton";
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

export interface DroppableContextValue {
  droppableProps: object;
  innerRef: (node: HTMLElement | null) => void;
  isDraggingOver: boolean;
}
export const DroppableContext = globalSingleton("ui/dnd/context/DroppableContext", () =>
  createContext<DroppableContextValue | null>(null),
);

/**
 * Access isDraggingOver, innerRef, and droppableProps from the nearest <Droppable>.
 * @throws {Error} if used outside a <Droppable> component tree
 */
export function useDroppableContext(): DroppableContextValue {
  const ctx = useContext(DroppableContext);
  if (!ctx)
    throw new Error("useDroppableContext must be used inside <Droppable>");
  return ctx;
}

// ── DraggableContext ────────────────────────────────────────────────────────
export interface DraggableContextValue {
  dragHandleProps: DraggableProvidedDragHandleProps | null;
  isDragging: boolean;
}
export const DraggableContext = globalSingleton("ui/dnd/context/DraggableContext", () =>
  createContext<DraggableContextValue | null>(null),
);

/**
 * Access dragHandleProps and isDragging from the nearest <Draggable>.
 * @throws {Error} if used outside a <Draggable> component tree
 */
export function useDraggableContext(): DraggableContextValue {
  const ctx = useContext(DraggableContext);
  if (!ctx)
    throw new Error("useDraggableContext must be used inside <Draggable>");
  return ctx;
}

