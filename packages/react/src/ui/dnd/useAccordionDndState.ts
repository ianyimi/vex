"use client";

import { useId, useState } from "react";
import { useDndContext } from "./DndProvider";

/**
 * Open/closed state for a single-item accordion (a `group()` field) that
 * follows its item through reorders and survives remounts.
 *
 * The accordion item's value is a per-instance constant (`useId`), never an
 * index-derived string — a reordered array item keeps its component (it is
 * keyed by the item's stored `id`), so its open state simply stays with it.
 * The state is also mirrored into `DndProvider`'s `accordionStateRef` under
 * `storeKey`, so a remount (the edit view swapping scrollers when the live
 * preview toggles) restores it.
 *
 * @param props.storeKey - Identity of this accordion that survives reorders —
 *   for a group inside an array item, the item's stored `id` plus the group's
 *   path below the item; otherwise the field name.
 * @param props.defaultOpen - Open state when nothing is stored for `storeKey`.
 */
export function useAccordionDndState(props: { storeKey: string; defaultOpen: boolean }): {
  /** Value for <AccordionItem value={itemValue}> */
  itemValue: string;
  /** Value for <Accordion value={openItems}> */
  openItems: string[];
  /** Handler for <Accordion onValueChange={handleValueChange}> */
  handleValueChange: (value: string[]) => void;
} {
  const itemValue = useId();
  const accordionStateRef = useDndContext().accordionStateRef;

  const [openItems, setOpenItems] = useState<string[]>(() => {
    const stored = accordionStateRef.current.get(props.storeKey);
    return (stored ?? props.defaultOpen) ? [itemValue] : [];
  });

  function handleValueChange(value: string[]) {
    setOpenItems(value);
    accordionStateRef.current.set(props.storeKey, value.length > 0);
  }

  return { itemValue, openItems, handleValueChange };
}
