"use client";

import type { VexWhereNode } from "@vexcms/core";
import { useListViewContext } from "../ListViewContext";
import { ListViewFilterBuilder } from "./ListViewFilterBuilder";

/**
 * The `vex.list.filters` built-in — renders {@link ListViewFilterBuilder} wired
 * to the active list's `collection` and `effectiveFilterWhere`/
 * `urlState.setFilter` from `useListViewContext()`. `effectiveFilterWhere`
 * (not `urlState.filter` alone, developer-reported follow-up —
 * access-system-fields.md Decision 11) also surfaces an ACTIVE, fully
 * readable SHARED view's own saved filter for an unmodified link, whose
 * state never reaches `urlState.filter` directly the way a local view's
 * does — editing it still writes through `setFilter` the same as any other
 * filter. Takes no props of its own (Decision 37) — the chip-visibility
 * eye toggle this slot used to also forward (Decision 10 revised
 * 2026-10-27) moved OUT to `ListViewToolbar`'s own direct
 * `ListViewFilterChips`/`ListViewFilterVisibilityToggle` rendering (further
 * developer revision: chips always inline, between the Filter trigger and
 * the eye, never through this slot).
 *
 * @returns {@link ListViewFilterBuilder}.
 */
export function ListViewFiltersAction() {
  const list = useListViewContext();
  return (
    <ListViewFilterBuilder
      collection={list.collection}
      // `effectiveFilterWhere` is `VexWhereNodeOf<unknown>` (same
      // type-erased shape `resolveListViewQueryState`'s own `where` already
      // uses — this literally came from one, `resolveEffectiveFilterWhere`
      // in `useSavedListViews.ts`) — the SAME cast `useSavedListViewPrefetch.ts`
      // already applies wherever a `resolved.where`-shaped value feeds a
      // prop typed against the collection's OWN real field-slug union.
      where={list.effectiveFilterWhere as VexWhereNode<string> | undefined}
      onWhereChange={list.urlState.setFilter}
    />
  );
}
