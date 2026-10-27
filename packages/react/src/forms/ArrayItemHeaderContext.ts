"use client";

import { createContext, type ReactNode } from "react";
import type { ArrayItemsOpenSignal } from "./useArrayItems";

/**
 * What a group-shaped array item's own `GroupField` renders on its accordion
 * header: the drag handle before the label, the item actions (duplicate,
 * move, remove, project additions) before the chevron, and the array's
 * latest Collapse all / Expand all request. `GroupField` resets it to `null`
 * for its own `children`, so a nested group never inherits its parent item's
 * header.
 */
export interface ArrayItemHeader {
  dragHandle: ReactNode;
  actions: ReactNode;
  openSignal: ArrayItemsOpenSignal;
}

/** Carries the enclosing array item's header content down to its `GroupField`. */
export const ArrayItemHeaderContext = createContext<ArrayItemHeader | null>(null);
