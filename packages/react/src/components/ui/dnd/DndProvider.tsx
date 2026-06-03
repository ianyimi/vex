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
} from "react";

export interface DndContextValue {
  register: (
    id: string,
    handler: (from: number, to: number) => void,
  ) => () => void;
  /** The droppableId that currently owns the active drag, or null when idle. */
  activeDroppableId: string | null;
  /**
   * Stable UUID slots per droppable. Map<droppableId, UUID[]>.
   * One UUID per array item slot. Shifted by moveItemStableKey on each drag to
   * mirror TanStack Form's moveValue — so a UUID follows its item across reorders.
   * Lives outside <DragDropContext key={dndKey}> and survives every remount.
   */
  itemStableKeysRef: RefObject<Map<string, (string | undefined)[]>>;
  /**
   * Accordion open/closed state per stable key. Map<stableKey, boolean>.
   * For array-item group fields: stableKey is the slot UUID from itemStableKeysRef.
   * For top-level group fields: stableKey is the field name.
   * Lives outside <DragDropContext key={dndKey}> and survives every remount.
   */
  accordionStateRef: RefObject<Map<string, boolean>>;
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
  return { register: dnd.register, activeDroppableId: dnd.activeDroppableId };
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
  const registry = useRef(
    new Map<string, (from: number, to: number) => void>(),
  );
  const itemStableKeysRef = useRef(new Map<string, (string | undefined)[]>());
  const accordionStateRef = useRef(new Map<string, boolean>());
  const [activeDroppableId, setActiveDroppableId] = useState<string | null>(
    null,
  );
  const [dndKey, setDndKey] = useState(0);

  const register = useCallback(
    (id: string, handler: (from: number, to: number) => void): (() => void) => {
      registry.current.set(id, handler);
      return () => {
        registry.current.delete(id);
      };
    },
    [],
  );

  // Mirrors TanStack Form's moveValue on the UUID slot array so stable keys
  // travel with their items when a drag reorders them.
  function moveItemStableKey(droppableId: string, from: number, to: number) {
    const slots = itemStableKeysRef.current.get(droppableId);
    if (!slots) return;
    const [moved] = slots.splice(from, 1);
    slots.splice(to, 0, moved);
  }

  const contextValue = useMemo<DndContextValue>(
    () => ({
      register,
      activeDroppableId,
      itemStableKeysRef,
      accordionStateRef,
    }),
    [register, activeDroppableId],
  );

  return (
    <DndContext.Provider value={contextValue}>
      <DragDropContext
        key={dndKey}
        onDragStart={(result) => {
          document.body.style.overflowX = "hidden";
          setActiveDroppableId(result.source.droppableId);
        }}
        onDragEnd={(result) => {
          document.body.style.overflowX = "";
          setActiveDroppableId(null);
          if (!result.destination) return;
          if (result.source.droppableId !== result.destination.droppableId)
            return;
          const droppableId = result.source.droppableId;
          const from = result.source.index;
          const to = result.destination.index;
          const handler = registry.current.get(result.source.droppableId);
          handler?.(result.source.index, result.destination.index);
          moveItemStableKey(droppableId, from, to);
          setDndKey((k) => k + 1);
        }}
      >
        {children}
      </DragDropContext>
    </DndContext.Provider>
  );
}
