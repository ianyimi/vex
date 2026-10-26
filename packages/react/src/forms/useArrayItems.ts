"use client";

import { useRef, useState } from "react";

/** A request from "Collapse all" / "Expand all" to every item. */
export interface ArrayItemsOpenSignal {
  /** Bumped on every request; `0` means none has been made. */
  version: number;
  /** Whether the request opens (`true`) or collapses (`false`) every item. */
  open: boolean;
}

/** The subset of a TanStack array-mode `FieldApi` the hook needs. */
export interface ArrayItemsField<TItem> {
  state: { value: TItem[] | undefined };
  pushValue: (item: TItem) => void;
  insertValue: (index: number, item: TItem) => void;
  removeValue: (index: number) => void;
  moveValue: (from: number, to: number) => void;
  handleChange: (value: TItem[]) => void;
}

/** Options for {@link useArrayItems}. */
export interface UseArrayItemsOptions<TItem> {
  field: ArrayItemsField<TItem>;
  /** Builds a new item for "Add". */
  createItem: () => TItem;
  /**
   * Builds a duplicate from a source item — defaults to a shallow `{ ...source }`
   * copy for an object item, or the item itself for a primitive (a string/number/
   * boolean array item has no identity field to strip, so by-value duplication is
   * already a copy). Callers whose items carry an identity field (e.g. a stable
   * `id`) should strip or regenerate it here; the hook does not know the item shape.
   */
  cloneItem?: (item: TItem) => TItem;
  /** Caps `atMax`/add/duplicate growth; `undefined` means unbounded. */
  max?: number;
  /**
   * When an item already carries its own persisted id (an object-shaped
   * array item), returning it here makes the item's React/drag key that
   * stored id instead of a synthetic one — the key then follows the item
   * automatically on any reorder, including one driven by a mutation that
   * bypasses this hook's own mutators (e.g. `field.moveValue` called
   * directly by an admin-layer action). Return `undefined` for an item with
   * no stored id (e.g. a scalar item), which falls back to a synthetic
   * per-position key tracked internally.
   */
  getStoredId?: (item: TItem) => string | undefined;
}

/** Return value of {@link useArrayItems}. */
export interface UseArrayItemsResult<TItem> {
  items: TItem[];
  /** Stable per-position keys — same length and order as `items`, survives reorders. */
  itemKeys: string[];
  atMax: boolean;
  openSignal: ArrayItemsOpenSignal;
  collapseAll: () => void;
  expandAll: () => void;
  add: () => void;
  duplicate: (index: number) => void;
  remove: (index: number) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
  reorder: (from: number, to: number) => void;
  /** Appends several items at the tail in one call, keeping `itemKeys` in sync. */
  pushMany: (newItems: TItem[]) => void;
  /** Inserts several items starting at `index`, keeping `itemKeys` in sync. */
  insertMany: (index: number, newItems: TItem[]) => void;
  /** Replaces the whole array, regenerating every synthetic key. */
  replaceAll: (newItems: TItem[]) => void;
}

function defaultCloneItem<TItem>(item: TItem): TItem {
  return typeof item === "object" && item !== null ? ({ ...(item as object) } as TItem) : item;
}

/**
 * Generic list mechanics shared by `ArrayField` and `BlocksField`: stable
 * React keys independent of the array's own index/identity, plus
 * add/duplicate/remove/move/reorder wired straight to the field's
 * `pushValue`/`insertValue`/`removeValue`/`moveValue`. Ported from
 * `FormArray.tsx`'s internal `keysRef`/`handle*` functions, generalized past
 * `withArrayItemId`/`fieldDef.items` (both admin-only) via the optional
 * `getStoredId` callback.
 *
 * Every mutator below (including `pushMany`/`insertMany`/`replaceAll`)
 * splices the synthetic-key tracking ref in lockstep with the field
 * mutation it performs — callers MUST route every array mutation through
 * one of these functions (never call the raw field API directly) to keep
 * `itemKeys` aligned with `items`.
 *
 * @param options - See {@link UseArrayItemsOptions}.
 * @returns See {@link UseArrayItemsResult}.
 */
export function useArrayItems<TItem>(options: UseArrayItemsOptions<TItem>): UseArrayItemsResult<TItem> {
  const items = options.field.state.value ?? [];
  const atMax = options.max !== undefined && items.length >= options.max;

  // Per-position fallback keys for items with no stored id of their own.
  // Only ever read for a given index when `getStoredId` returns `undefined`
  // for that item, but kept the same length as `items` regardless so a mix
  // of stored-id and synthetic-key items can't desync between each other.
  const syntheticKeysRef = useRef<string[]>([]);
  if (syntheticKeysRef.current.length < items.length) {
    syntheticKeysRef.current = [
      ...syntheticKeysRef.current,
      ...Array.from(
        { length: items.length - syntheticKeysRef.current.length },
        () => crypto.randomUUID(),
      ),
    ];
  } else if (syntheticKeysRef.current.length > items.length) {
    syntheticKeysRef.current = syntheticKeysRef.current.slice(0, items.length);
  }

  const itemKeys = items.map(
    (item, index) => options.getStoredId?.(item) ?? syntheticKeysRef.current[index]!,
  );

  const [openSignal, setOpenSignal] = useState<ArrayItemsOpenSignal>({ version: 0, open: true });

  function collapseAll(): void {
    setOpenSignal((signal) => ({ version: signal.version + 1, open: false }));
  }

  function expandAll(): void {
    setOpenSignal((signal) => ({ version: signal.version + 1, open: true }));
  }

  function add(): void {
    syntheticKeysRef.current = [...syntheticKeysRef.current, crypto.randomUUID()];
    options.field.pushValue(options.createItem());
  }

  function duplicate(index: number): void {
    const source = items[index];
    if (source === undefined) return;
    const clone = (options.cloneItem ?? defaultCloneItem)(source);
    const newKeys = [...syntheticKeysRef.current];
    newKeys.splice(index + 1, 0, crypto.randomUUID());
    syntheticKeysRef.current = newKeys;
    options.field.insertValue(index + 1, clone);
  }

  function remove(index: number): void {
    const newKeys = [...syntheticKeysRef.current];
    newKeys.splice(index, 1);
    syntheticKeysRef.current = newKeys;
    options.field.removeValue(index);
  }

  function moveUp(index: number): void {
    if (index === 0) return;
    const newKeys = [...syntheticKeysRef.current];
    [newKeys[index - 1], newKeys[index]] = [newKeys[index]!, newKeys[index - 1]!];
    syntheticKeysRef.current = newKeys;
    options.field.moveValue(index, index - 1);
  }

  function moveDown(index: number): void {
    if (index === items.length - 1) return;
    const newKeys = [...syntheticKeysRef.current];
    [newKeys[index + 1], newKeys[index]] = [newKeys[index]!, newKeys[index + 1]!];
    syntheticKeysRef.current = newKeys;
    options.field.moveValue(index, index + 1);
  }

  function reorder(from: number, to: number): void {
    const newKeys = [...syntheticKeysRef.current];
    const [moved] = newKeys.splice(from, 1);
    newKeys.splice(to, 0, moved!);
    syntheticKeysRef.current = newKeys;
    options.field.moveValue(from, to);
  }

  function pushMany(newItems: TItem[]): void {
    syntheticKeysRef.current = [
      ...syntheticKeysRef.current,
      ...newItems.map(() => crypto.randomUUID()),
    ];
    for (const item of newItems) options.field.pushValue(item);
  }

  function insertMany(index: number, newItems: TItem[]): void {
    const newKeys = [...syntheticKeysRef.current];
    newKeys.splice(index, 0, ...newItems.map(() => crypto.randomUUID()));
    syntheticKeysRef.current = newKeys;
    newItems.forEach((item, offset) => options.field.insertValue(index + offset, item));
  }

  function replaceAll(newItems: TItem[]): void {
    syntheticKeysRef.current = newItems.map(() => crypto.randomUUID());
    options.field.handleChange(newItems);
  }

  return {
    items,
    itemKeys,
    atMax,
    openSignal,
    collapseAll,
    expandAll,
    add,
    duplicate,
    remove,
    moveUp,
    moveDown,
    reorder,
    pushMany,
    insertMany,
    replaceAll,
  };
}
