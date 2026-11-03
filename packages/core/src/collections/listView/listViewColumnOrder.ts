import { getDataFields } from "../../fields";
import { VERSION_SYSTEM_FIELDS } from "../../versions";
import { columnEntryField, type ColumnEntry, type CollectionConfig } from "../types";

/**
 * Completes a (possibly partial, possibly back-compat bare-slug) stored
 * column-entry array into a full array covering every one of `collection`'s
 * own data fields, exactly once, in display order (Decision 48), PLUS the
 * synthetic version-status column (`VERSION_SYSTEM_FIELDS.status.slug`,
 * `"vex_status"`) on a versioned collection (`collection.versions.drafts`)
 * — developer-reported: resizing/pinning/hiding/reordering it used to
 * silently no-op (`CollectionListView`'s `buildStatusColumn()` rendered it
 * OUTSIDE this entry-driven model entirely, hardcoded always-first/always-
 * visible/never-pinnable), since there was no `ColumnEntry` for a resize
 * commit or a pin toggle to write to. It now participates FULLY, like any
 * real field — reorderable, hideable, pinnable, resizable, saved in
 * views/the URL `cols=`, prerendered, counted by Reset/Modified — with
 * ONE deliberate difference from a real field's own back-fill default: an
 * entry `order` already names keeps its own position AND its own `width`/
 * `pinned`/`hidden`/`enableSorting`/`enableHiding` overrides untouched,
 * same as any field; a REAL field `order` does NOT name is APPENDED, in
 * the collection's own field-declaration order, as an explicitly hidden
 * bare-shape entry (`{ field, hidden: true }`) — this is what lets an OLD,
 * pre-Decision-48 stored view (which only ever listed its VISIBLE fields,
 * Decision 11's original shape, still true of every Step-20-saved
 * `cols=`/view after its own Round-3 fix) resolve correctly under the
 * unified model: a field it never named becomes an explicit `hidden: true`
 * entry instead of silently missing from the table's column set/drag-
 * reorder menu/columns menu row list. `vex_status` instead defaults to
 * VISIBLE (a bare `{ field }`, no `hidden` override) when `order` doesn't
 * name it — EVERY stored view predates this column's own participation in
 * `ColumnEntry`/`cols=` at all (it could never have been named, visible or
 * hidden, before this change existed), so treating its absence the same
 * as a real field's (silently hidden) would make the status column vanish
 * from every existing saved view the instant this ships, not a neutral
 * "field never interacted with" default, and is UNSHIFTED to the very
 * FRONT of the whole result (not merely sorted first within the
 * back-filled tail, which would still land it after every already-named
 * real field) — preserving today's "status column shows first" default
 * for every existing view, none of which can have named it yet.
 *
 * Also drops any entry naming a field that no longer exists on
 * `collection` (renamed/removed since the view was saved) and deduplicates
 * a repeated field entry, keeping its FIRST occurrence — defensive, since
 * a stale/duplicate entry would otherwise either crash or double-render a
 * column.
 *
 * @param props - Input props.
 * @param props.order - The stored/URL column-entry array, or `undefined`
 *   for "nothing stored" (every REAL field appended hidden, `vex_status`
 *   — on a versioned collection — appended visible; see this function's
 *   own doc comment for why the two defaults differ).
 * @param props.collection - Resolves the full field-declaration order
 *   (and `versions.drafts`, which decides whether `vex_status` is a known
 *   field at all).
 * @returns Every one of `collection`'s own data field keys, exactly once,
 *   each a {@link ColumnEntry}, in the resolved display order — plus
 *   `vex_status` (versioned collections only).
 */
export function completeListViewColumnOrder<TFieldSlug extends string = string>(props: {
  order: ColumnEntry<TFieldSlug>[] | undefined;
  collection: CollectionConfig;
}): ColumnEntry<TFieldSlug>[] {
  const declaredFields = Object.keys(getDataFields({ fields: props.collection.fields })) as TFieldSlug[];
  const statusField: TFieldSlug | undefined = props.collection.versions.drafts
    ? (VERSION_SYSTEM_FIELDS.status.slug as TFieldSlug)
    : undefined;
  const knownSet = new Set<TFieldSlug>(statusField !== undefined ? [statusField, ...declaredFields] : declaredFields);
  const seen = new Set<TFieldSlug>();
  const named: ColumnEntry<TFieldSlug>[] = [];
  for (const entry of props.order ?? []) {
    const field = columnEntryField(entry);
    if (knownSet.has(field) && !seen.has(field)) {
      seen.add(field);
      named.push(entry);
    }
  }
  const remaining = declaredFields.filter((field) => !seen.has(field));
  const result: ColumnEntry<TFieldSlug>[] = [
    ...named,
    ...remaining.map((field): ColumnEntry<TFieldSlug> => ({ field, hidden: true })),
  ];
  // Unnamed `vex_status` is UNSHIFTED to the very front of the whole
  // result, not merely sorted within the back-filled tail above (which
  // would land it AFTER every already-named real field, same as any
  // ordinary unnamed field) — preserves today's "status column shows
  // first" default for every existing view, none of which can have named
  // it yet (this participation is new). A view that HAS named it (any
  // position) already took the `named` branch above and is skipped here.
  if (statusField !== undefined && !seen.has(statusField)) {
    result.unshift({ field: statusField });
  }
  return result;
}

/**
 * One {@link ColumnEntry}'s own fields, each normalized to a definite
 * value (a bare-slug entry is equivalent to every override being unset) —
 * the shape {@link columnEntriesEqual} compares attribute-by-attribute,
 * never via `JSON.stringify` (an object entry's own key INSERTION order
 * can legitimately differ between two call sites that construct an
 * equivalent entry, which `JSON.stringify` would wrongly treat as
 * unequal).
 *
 * @param entry - A bare field slug, or an object entry carrying overrides.
 * @returns `entry`'s `field`/`width`/`pinned`/`hidden`, with a bare slug's
 *   `width`/`pinned` as `undefined` and `hidden` as `false`, and an object
 *   entry's own `hidden` defaulted to `false` when unset.
 */
function normalizeEntry<TFieldSlug extends string>(
  entry: ColumnEntry<TFieldSlug>,
): { field: TFieldSlug; width: number | undefined; pinned: "left" | "right" | undefined; hidden: boolean } {
  if (typeof entry === "string") {
    return { field: entry, width: undefined, pinned: undefined, hidden: false };
  }
  return { field: entry.field, width: entry.width, pinned: entry.pinned, hidden: entry.hidden ?? false };
}

/**
 * Deep-equal, order-sensitive comparison of two {@link ColumnEntry} arrays
 * — `field`/`width`/`pinned`/`hidden` only (Decision 48's `cols=` URL
 * grammar never carries `enableSorting`/`enableHiding`, so those two never
 * factor into "does this differ from the saved baseline" for URL-diffing
 * purposes; `useSavedListViews.ts`'s `diffViewState` reuses this same function
 * for the SAME reason — a view's own capability overrides, when a saved
 * view happens to declare them, aren't something any current UI control
 * can produce a user-visible "Modified" state for). Used by
 * `listViewUrlState.ts`'s `serializeListViewUrlState` (is `cols=` redundant against
 * the active view's own baseline?) and `useSavedListViews.ts`'s `diffViewState`
 * (does the active view's live `columns` state differ from what's saved?).
 *
 * @param a - One column-entry array.
 * @param b - The other.
 * @returns Whether every position's field/width/pinned/hidden match.
 */
export function columnEntriesEqual<TFieldSlug extends string>(
  a: ColumnEntry<TFieldSlug>[],
  b: ColumnEntry<TFieldSlug>[],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = normalizeEntry(a[i]!);
    const y = normalizeEntry(b[i]!);
    if (x.field !== y.field || x.width !== y.width || x.pinned !== y.pinned || x.hidden !== y.hidden) {
      return false;
    }
  }
  return true;
}
