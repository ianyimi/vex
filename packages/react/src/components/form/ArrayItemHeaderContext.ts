"use client";

import { createContext, type ReactNode } from "react";

/** A request from `FormArray`'s Collapse all / Expand all to every item. */
export interface ArrayItemsOpenSignal {
  /** Bumped on every request; `0` means none has been made. */
  version: number;
  /** Whether the request opens (`true`) or collapses (`false`) every item. */
  open: boolean;
}

/**
 * What a group-shaped `array()` item's own `FormGroup` renders on its
 * accordion header: the drag handle before the label, the item actions
 * (duplicate, move, remove, project additions) before the chevron, and the
 * array's latest Collapse all / Expand all request. `FormGroup` resets it to
 * `null` for its own fields, so a nested group never inherits its parent
 * item's header.
 */
export interface ArrayItemHeader {
  dragHandle: ReactNode;
  actions: ReactNode;
  openSignal: ArrayItemsOpenSignal;
}

/** Carries the enclosing array item's header content down to its `FormGroup`. */
export const ArrayItemHeaderContext = createContext<ArrayItemHeader | null>(null);
