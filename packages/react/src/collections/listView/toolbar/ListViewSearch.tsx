"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CRUD_ACTIONS, getDataFields, PERMISSION_SCOPES, readableListViewSearchFields, resolveListViewSearchField, type CollectionConfig } from "@vexcms/core";
import { useFieldPermissions } from "../../../access";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { Input } from "../../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select";
import type { ListViewUrlSetOptions } from "../useListViewUrlState";

/**
 * Props for {@link ListViewSearch}.
 *
 * @typeParam TFieldSlug - The collection's field slugs, matched against
 *   `collection.admin.view.state.searchFields`.
 */
export interface ListViewSearchProps<TFieldSlug extends string = string> {
  /** The collection whose `admin.view.state.searchFields` drives the field picker; the control renders nothing when the READABLE subset of that list is empty (Decision 2 + Decision 26). */
  collection: CollectionConfig;
  /** The current search text — mirrors `useListViewUrlState`'s `q`. */
  q: string;
  /** The current search field — `undefined` defaults to the first readable entry. */
  qf: TFieldSlug | undefined;
  /** Called with the debounced search text as the user types (`push: false`), or immediately with `push: true` on Enter. */
  onQChange: (q: string, options?: ListViewUrlSetOptions) => void;
  /** Called immediately when the field picker's selection changes — a discrete choice, no debounce. */
  onQfChange: (qf: TFieldSlug) => void;
  /** Whether a search fetch is currently in flight for `q`/`qf` — shows the input's own `Input` `isPending` spinner while the previous page's rows stay on screen (`useVexListQuery`'s keep-previous-data behavior). */
  isFetching?: boolean;
}

/**
 * Debounced search input paired with a field picker, for a collection
 * list's toolbar. Never collapses (Decision 22) — `ListViewToolbar` always
 * renders it inline.
 *
 * Renders `null` when no entry in `collection.admin.view.state.searchFields` is
 * readable by the current caller (Decision 2 + Decision 26's "the client
 * hides unreadable fields from … the search field picker"). While search is
 * active, sort headers elsewhere in the list disable themselves
 * (`DataTableSortHeader`'s `disabled` prop) — this component only owns the
 * input and field choice, not that coordination.
 *
 * @param props - Component props. See {@link ListViewSearchProps}.
 * @returns The search control, or `null` when no readable search field exists.
 */
export function ListViewSearch<TFieldSlug extends string = string>(
  props: ListViewSearchProps<TFieldSlug>,
) {
  const fieldPermissions = useFieldPermissions({
    resource: props.collection.slug,
    action: CRUD_ACTIONS.read,
    scope: PERMISSION_SCOPES.any,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const readableFields = readableListViewSearchFields<TFieldSlug>({
    collection: props.collection,
    fieldPermissions,
  });
  const resolvedField = resolveListViewSearchField<TFieldSlug>({
    collection: props.collection,
    qf: props.qf,
    fieldPermissions,
  });
  const dataFields = getDataFields({ fields: props.collection.fields });
  const fieldLabel = (field: string | undefined) => (field ? dataFields[field]?.label || field : "Field");

  const [localValue, setLocalValue] = useState(props.q);
  // Developer-reported regression fix (2026-11-01): `@ts-hooks-kit/core`'s `useDebounceValue`
  // (and the `debounce()` utility it wraps) has a genuine bug — its internal `lastCallTime`
  // is only updated the FIRST time a call starts a new window, not on every subsequent call
  // within it, so the window's own deadline stays pinned to 250ms after the FIRST keystroke
  // of a burst rather than resetting to 250ms after the MOST RECENT one. Confirmed live:
  // typing at a realistic ~150ms/key pace still fired `onQChange` roughly every 250-300ms
  // DURING typing instead of once after the user actually stopped, each firing a real
  // search that visibly swapped rows and toggled the spinner mid-type.
  // `useDebouncedValue` (the shared, correct replacement — same fix applied everywhere
  // else in this package that debounces a search term) is what correctly restarts the
  // 250ms window on every keystroke now.
  const debouncedValue = useDebouncedValue(localValue, 250);

  useEffect(() => {
    // Only fires when the DEBOUNCED value settles, not on every `props.q`
    // change (a saved view or browser back/forward) — those are synced by
    // the effect below instead, without re-triggering a URL write.
    if (debouncedValue !== props.q) {
      props.onQChange(debouncedValue);
    }
  }, [debouncedValue]);

  useEffect(() => {
    // Externally-driven `q` change (a "Clear search" elsewhere, a saved
    // view, browser back/forward) — sync `localValue` immediately (not
    // waiting out the 250ms debounce window, which would leave stale text
    // in this input for a moment). The debounce effect above's own guard
    // (`debouncedValue !== props.q`) already no-ops once they match again,
    // so this never re-fires `onQChange` for a value it just received.
    if (props.q !== localValue) {
      setLocalValue(props.q);
    }
  }, [props.q]);

  if (readableFields.length === 0) return null;

  function handleChange(value: string) {
    setLocalValue(value);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      props.onQChange(localValue, { push: true });
    } else if (e.key === "Escape") {
      if (localValue !== "") {
        handleChange("");
        props.onQChange("");
      } else {
        inputRef.current?.blur();
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={readableFields.length === 1 ? readableFields[0] : "Search…"}
        iconLeft={{ name: "Search" }}
        isPending={props.isFetching}
        // Developer-reported (binding): below `@3xl/list` (the toolbar's
        // own container-query boundary where room gets tight) — 140px,
        // the developer's own final value after iterating from an
        // earlier, stricter wrap-free ceiling (see the list-view-overhaul
        // spec digest for the full iteration history and measured wrap
        // tables at each width tried). `max-w-none` at/above `@3xl/list`
        // restores today's exact width — zero shift above that
        // container size.
        className="max-w-[140px] @3xl/list:max-w-none"
      />
      {readableFields.length > 1 && (
        <Select
          value={resolvedField}
          onValueChange={(v) => props.onQfChange(v as TFieldSlug)}
        >
          <SelectTrigger aria-label={`Search field: ${fieldLabel(resolvedField)}`}>
            <SelectValue>{(value: string) => fieldLabel(value)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {readableFields.map((field) => (
              <SelectItem key={field} value={field}>
                {fieldLabel(field)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
