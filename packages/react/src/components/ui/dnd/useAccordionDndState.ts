"use client";

import { useState } from "react";
import { useDndContext } from "./DndProvider";

/**
 * Manages accordion open/closed state that survives DragDropContext remounts
 * and correctly follows array items when they are reordered.
 *
 * Reads from DndContext (lives above the keyed DragDropContext) to access:
 * - itemStableKeysRef: stable UUID per array slot, shifted on every drag to
 *   mirror TanStack Form's moveValue so the UUID travels with its item.
 * - accordionStateRef: boolean open/closed keyed by stable UUID (not index).
 *
 * Usage — group, array, or blocks field accordion:
 *   const { itemValue, openItems, handleValueChange } = useAccordionDndState(
 *     name,
 *     index,
 *     fieldDef.defaultOpen !== false,
 *   );
 *
 * For block ITEMS (not the blocks field itself) pass the block's stable data id
 * as the fourth argument to bypass the slot-map lookup entirely:
 *   const { itemValue, openItems, handleValueChange } = useAccordionDndState(
 *     name,
 *     index,
 *     !admin.defaultCollapsed,
 *     blockItem.id,
 *   );
 */
export function useAccordionDndState({
  name,
  index,
  defaultOpen,
  dataStableId,
}: {
  name: string;
  index: number | undefined;
  defaultOpen: boolean;
  /** Optional stable id from the item's data (e.g. block item.id).
   *  When provided, skips the slot-map lookup — use for items that already
   *  carry a stable UUID in their form value. */
  dataStableId?: string;
}): {
  /** Value for <AccordionItem value={itemValue}> */
  itemValue: string;
  /** Value for <Accordion value={openItems}> */
  openItems: string[];
  /** Handler for <Accordion onValueChange={handleValueChange}> */
  handleValueChange: (value: string[]) => void;
} {
  const itemValue = index !== undefined ? `${name}-${index}` : name;

  const dnd = useDndContext();
  const accordionStateRef = dnd.accordionStateRef;
  const itemStableKeysRef = dnd.itemStableKeysRef;

  // Greedy match finds the LAST [N] in the path — the innermost array.
  // "outer[0].inner[1].settings" → droppableId="outer[0].inner", arrayIndex=1
  const arrayMatch = name.match(/^(.*)\[(\d+)\]/);
  const arrayDroppableId = arrayMatch?.[1] ?? null;
  const arrayIndex = arrayMatch ? parseInt(arrayMatch[2]) : null;

  // On every mount, find or create the stable UUID for this slot.
  // If dataStableId is provided (e.g. block item.id), use it directly.
  // Otherwise look up the slot map — after a drag, moveItemStableKey has
  // already shifted the array so slots[arrayIndex] holds the UUID that
  // travelled here with its item.
  const [stableSlotId] = useState<string | null>(() => {
    if (dataStableId) return dataStableId;
    if (
      !itemStableKeysRef ||
      arrayDroppableId === null ||
      arrayIndex === null
    ) {
      return null;
    }
    const slots = itemStableKeysRef.current.get(arrayDroppableId) ?? [];
    if (!slots[arrayIndex]) {
      slots[arrayIndex] = crypto.randomUUID();
      itemStableKeysRef.current.set(arrayDroppableId, slots);
    }
    return slots[arrayIndex] ?? null;
  });

  // Strip array indices from name so two group fields in the same item get
  // distinct keys: "items[0].seo" → "items.seo", "items[0].settings" → "items.settings"
  const baseName = name.replace(/\[\d+\]/g, "");
  const storeKey =
    stableSlotId !== null ? `${stableSlotId}-${baseName}` : itemValue;

  const [openItems, setOpenItems] = useState<string[]>(() => {
    const stored = accordionStateRef?.current.get(storeKey);
    const isOpen = stored !== undefined ? stored : defaultOpen;
    return isOpen ? [itemValue] : [];
  });

  function handleValueChange(value: string[]) {
    setOpenItems(value);
    accordionStateRef?.current.set(storeKey, value.length > 0);
  }

  return { itemValue, openItems, handleValueChange };
}
