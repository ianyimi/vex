"use client";

import { DragDropContext } from "@hello-pangea/dnd";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
  useEffect,
} from "react";

export interface DndContextValue {
  register: (id: string, handler: (from: number, to: number) => void) => () => void;
  /** The droppableId that currently owns the active drag, or null when idle. */
  activeDroppableId: string | null;
  /**
   * Accordion open/closed state per stable key. Map<stableKey, boolean>.
   * For a group inside an array item: the item's stored `id` plus the group's
   * path below that item. Otherwise: the field name. Lives above every form
   * scroller, so open state survives the edit view swapping scrollers when
   * the live preview opens or closes.
   */
  accordionStateRef: RefObject<Map<string, boolean>>;
  /** Whether the DnD is mounted on the client (false on server). */
  mounted: boolean;
}

export const DndContext = createContext<DndContextValue | null>(null);

export function useDndContext(): DndContextValue {
  const dnd = useContext(DndContext);
  if (!dnd) {
    throw new Error(
      "useDndContext must be called inside a DndProvider, or with access to a DndContext",
    );
  }
  return dnd;
}

/**
 * Backward-compat shim for Droppable — returns only the registry fields.
 * Droppable.tsx does not need to be changed.
 */
export function useDndRegistry() {
  const dnd = useContext(DndContext);
  if (!dnd) {
    throw new Error(
      "useDndContext must be called inside a DndProvider, or with access to a DndContext",
    );
  }
  return { register: dnd.register, activeDroppableId: dnd.activeDroppableId, mounted: dnd.mounted };
}

/**
 * Provides a single shared DragDropContext for all Droppable descendants.
 *
 * Each Droppable registers its onReorder callback by droppableId. When a drag
 * starts, the owning droppableId is broadcast via context so every other
 * Droppable can set isDropDisabled — preventing cross-list drops.
 *
 * Cross-list isDraggingOver highlights are prevented at the @hello-pangea/dnd
 * level via the type system: each Droppable defaults its type to its own id,
 * and child Draggables inherit that type, so the library itself never marks an
 * unrelated droppable as isDraggingOver regardless of geometry or render timing.
 */
export function DndProvider({ children }: { children: ReactNode }) {
  const registry = useRef(new Map<string, (from: number, to: number) => void>());
  const accordionStateRef = useRef(new Map<string, boolean>());
  const [activeDroppableId, setActiveDroppableId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const register = useCallback(
    (id: string, handler: (from: number, to: number) => void): (() => void) => {
      registry.current.set(id, handler);
      return () => {
        registry.current.delete(id);
      };
    },
    [],
  );

  const contextValue = useMemo<DndContextValue>(
    () => ({
      register,
      activeDroppableId,
      accordionStateRef,
      mounted,
    }),
    [register, activeDroppableId, mounted],
  );

  return (
    <DndContext.Provider value={contextValue}>
      <DragDropContext
        onDragStart={(result) => {
          document.body.style.overflowX = "hidden";
          setActiveDroppableId(result.source.droppableId);
        }}
        onDragEnd={(result) => {
          document.body.style.overflowX = "";
          setActiveDroppableId(null);
          if (!result.destination) return;
          if (result.source.droppableId !== result.destination.droppableId) return;
          const handler = registry.current.get(result.source.droppableId);
          handler?.(result.source.index, result.destination.index);
        }}
      >
        {children}
      </DragDropContext>
    </DndContext.Provider>
  );
}
