"use client";

import { useMemo, useState, type ReactNode } from "react";
import { getDataFields } from "@vexcms/core";
import { Button } from "../../../ui/button";
import { useListViewContext } from "../ListViewContext";
import { resolveFilterFieldLabel } from "../filters/ListViewFilterChips";

/**
 * Dismissible toolbar notice for a stale saved view (polish fix, Decision
 * 7) — shown when the active view's own saved `sort.field`/`searchField`
 * no longer exists on the live collection (removed, its index dropped, or
 * dropped from `admin.view.state.searchFields`) and `resolveListViewQueryState`
 * (server)/`resolveEffectiveViewState` (client) fell back to the
 * collection's own default for that part — or (access-system-fields.md
 * Decision 11) a user-added filter condition named a field the caller can
 * no longer read and `resolveListViewQueryState` dropped it before the query
 * ever ran, rather than sending a condition the server would reject
 * (Decision 26) while leaving the chip that could remove it hidden
 * client-side (`ListViewFilterChips`' own gate) — a dead end without this.
 * The view itself is never rewritten by either fallback — only an explicit
 * Save on the active view (`ListViewModifiedControls`) writes a corrected
 * value.
 *
 * Reads `staleSortField`/`staleSearchField`/`staleFilterField` off
 * `useListViewContext()` (`CollectionListView.tsx` seeds them straight from
 * its own `resolved`, the SAME `resolveListViewQueryState` call that drives the
 * actual query — server and client resolve identically, so this never
 * flashes in/out between SSR and hydration). Every field name shown is its
 * display LABEL, not the raw key — `resolveFilterFieldLabel` (developer-
 * reported: "exactly like the filter chips do"), the SAME resolver
 * `ListViewFilterChips` itself calls for a chip's own field label, so a raw key
 * never reaches a user-facing surface from either one independently.
 * Dismissal is keyed to the RAW field name(s), not the label (distinct raw
 * keys could theoretically share a label) — dismissing this notice for
 * "author" doesn't permanently suppress it if the user later opens a
 * DIFFERENT view whose own sort/filter is stale on a different field.
 *
 * The dropped-filter case gets its OWN sentence, not folded into the
 * sort/search one — "showing the collection's default instead" (accurate
 * for sort/search, which both have a real collection-level default to fall
 * back to) would be misleading for a filter, which has no such default; it
 * is simply dropped, leaving the view unfiltered (or, when a declared
 * view's own hidden filter is ALSO active, filtered by that alone — never
 * described here, since it was never user-visible to begin with).
 *
 * Renders nothing — zero layout footprint — while nothing is stale or the
 * current staleness has been dismissed. `ListViewLayout` renders this as its
 * own row directly below `ListViewToolbar`, so it never competes for space
 * with the toolbar's own fold logic.
 *
 * @returns The notice row, or `null`.
 */
export function StaleSavedListViewNotice(): ReactNode {
  const { collection, staleSortField, staleSearchField, staleFilterField } = useListViewContext();
  const dataFields = useMemo(() => getDataFields({ fields: collection.fields }), [collection.fields]);
  const key = `${staleSortField ?? ""}\u0000${staleSearchField ?? ""}\u0000${staleFilterField ?? ""}`;
  const [dismissedKey, setDismissedKey] = useState<string | undefined>(undefined);

  if (staleSortField === undefined && staleSearchField === undefined && staleFilterField === undefined) {
    return null;
  }
  if (dismissedKey === key) return null;

  const sentences: string[] = [];
  const defaultFallbackParts: string[] = [];
  if (staleSortField !== undefined) {
    defaultFallbackParts.push(`sort on "${resolveFilterFieldLabel(staleSortField, dataFields)}"`);
  }
  if (staleSearchField !== undefined) {
    defaultFallbackParts.push(`search field "${resolveFilterFieldLabel(staleSearchField, dataFields)}"`);
  }
  if (defaultFallbackParts.length > 0) {
    sentences.push(
      `This view's ${defaultFallbackParts.join(" and ")} ${defaultFallbackParts.length > 1 ? "are" : "is"} no longer available — showing the collection's default instead.`,
    );
  }
  if (staleFilterField !== undefined) {
    sentences.push(
      `This view's filter on "${resolveFilterFieldLabel(staleFilterField, dataFields)}" isn't available — showing unfiltered results instead.`,
    );
  }
  const message = sentences.join(" ");

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-2 rounded-md border border-dashed px-3 py-1.5 text-sm text-muted-foreground"
    >
      <span>{message}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto shrink-0 p-0 text-muted-foreground"
        onClick={() => setDismissedKey(key)}
      >
        Dismiss
      </Button>
    </div>
  );
}
