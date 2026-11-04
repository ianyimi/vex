"use client";

import { useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  VEX_VIEW_SOURCES,
  VIEW_ACTIONS,
  type ColumnEntry,
  type CollectionSlug,
  type LocalSavedListViewsIndexEntry,
  type VexStoredView,
  type VexViewConfig,
} from "@vexcms/core";
import { useSaveView } from "../../api/saveView/client";
import { useVexConfig } from "../../../config/VexConfigContext";
import { usePermission } from "../../../access";
import { getVexErrorMessage } from "../../../utils/errors";
import { generateViewId, saveLocalSavedListView } from "./localSavedListViewsStore";
import { useCanAccessSharedSavedListViews } from "./useCanAccessSharedSavedListViews";
import {
  decodeViewUrlValue,
  diffViewState,
  isPlaceholderLocalView,
  resolveEffectiveViewState,
  useSavedListViews,
  type ListViewDiff,
  type ListViewDiffCategory,
  type ListViewStateSnapshot,
  type PendingViewSaveState,
} from "./useSavedListViews";
import { SaveListViewDialog, type SaveListViewTarget } from "./SaveListViewDialog";
import { Button } from "../../../ui";
import type { ListViewUrlStateSlice } from "../useListViewUrlState";

/** "Modified: …" summary diff-category labels (shared with `SavedListViewTabs.tsx`'s own copy). */
const DIFF_LABELS: Record<Exclude<ListViewDiffCategory, "filters">, string> = {
  search: "search",
  sort: "sort",
  columns: "columns",
  pageSize: "rows per load",
  peekWidth: "preview width",
};

function formatDiffLabel(diff: ListViewDiff | undefined): string {
  if (diff === undefined) return "";
  return diff.categories
    .map((category) =>
      category === "filters" ? `${diff.filterCount} filter${diff.filterCount === 1 ? "" : "s"}` : DIFF_LABELS[category],
    )
    .join(", ");
}

interface PendingCopyDialog<TFieldSlug extends string> {
  viewId: string;
  name: string;
  state: PendingViewSaveState<TFieldSlug>;
}

/** Props for {@link ListViewModifiedControls}. */
export interface ListViewModifiedControlsProps<TFieldSlug extends string = string> {
  collection: CollectionSlug;
  urlState: ListViewUrlStateSlice<TFieldSlug>;
  /** `collection.admin.view.state.pageSize` — `urlState.size`'s value when omitted. */
  defaultPageSize: number;
  /** The active view's FULL column list — owned by `ListViewLayout` (`useListViewContext().columns`). */
  columns: ColumnEntry<TFieldSlug>[];
  /** Replaces the full `columns` array AND writes `cols=`, atomically — used by Reset. Saving-as-copy uses `onColumnsStateChange` + `urlState.applyView` instead (below) — see that method's own doc comment for why. */
  onColumnsChange: (columns: ColumnEntry<TFieldSlug>[]) => void;
  /** LOCAL STATE ONLY (no URL write) — used by `handleCopyDialogSubmit`, which writes `cols=` itself as part of `urlState.applyView`'s single atomic write (a separate `urlState.setCols` call here would diff against the STALE pre-switch baseline). */
  onColumnsStateChange: (columns: ColumnEntry<TFieldSlug>[]) => void;
  /** The peek panel's live width in px — the cookie's current value, read by `CollectionListView` and threaded down for the "Modified" diff/Reset/Save. */
  peekWidth: number;
  /** Whether the user has explicitly resized the peek since the active view last changed — Save only starts persisting a `peekWidth` into a view that never had one of its own when this is `true`. */
  peekWidthTouched: boolean;
  /** Persists a new width (drag/keyboard commit) or `undefined` (Reset) via `writeListViewPeekWidthCookie` — `CollectionListView`'s own `onPeekWidthChange`. `source: "view"` (used by this component's own Reset) persists without counting as the user having touched the width. */
  onPeekWidthChange: (width: number | undefined, source?: "user" | "view") => void;
  /** Server-prefetched shared views — forwarded to `useSavedListViews`. */
  initialViews?: VexStoredView[];
  /** Server-read local-view cookie index — forwarded to `useSavedListViews`. */
  initialLocalIndex?: LocalSavedListViewsIndexEntry[];
}

/**
 * The active view's modified-state controls — a dot, "Modified: …"
 * summary, Reset, and Save — rendered inline in `ListViewToolbar`'s row,
 * immediately right of the Filter+eye control group. Returns `null` whenever there is no active
 * view or nothing has changed — this takes NO layout space at all while inactive; every
 * control here shares the toolbar's own `size="default"` height (every toolbar control is one height,
 * matching the search input's `h-8`), so the
 * toolbar row never changes height when these appear.
 *
 * Save's target branches on whether the caller may overwrite the active
 * view in place: a local view
 * always saves in place; a shared view saves in place only with
 * `updateView`; a shared view WITHOUT `updateView`, or any config view
 * (never updatable), instead opens the save dialog
 * pre-filled as a NEW LOCAL view named `"<view name> (copy)"` from the
 * CURRENT state. A config view's hidden filter is never part of that
 * state (`currentState.where` is always the user's own
 * visible filter, composed with the hidden condition only at the query
 * layer), so the copy never carries it forward.
 *
 * **Responsive:**
 * sized by `@container/list`, not `md:` — below `@md/list` the "Modified: …" summary text
 * and the Reset/Save labels hide, leaving the dot plus two icon-only buttons
 * (`RotateCcw`/`Save`, fixed `aria-label`s so the accessible name never changes with width —
 * the same single-instance, CSS-toggled-label pattern `DataTableBulkActions` uses, not a
 * duplicated trigger with the same accessible name twice). This keeps the group from pushing
 * the Filter trigger (or the bulk-selection row swap, also `@lg/list`-gated) off a narrow
 * toolbar row.
 *
 * Calls `useSavedListViews()` independently of `SavedListViewTabs`' own call —
 * both pass the same `collection`/`initialViews`/`initialLocalIndex`, so
 * TanStack Query dedupes them to one network fetch and one shared cache
 * entry; the two components just read it from separate places in the
 * tree (the title row vs. the toolbar), which don't share a common
 * ancestor close enough to thread this through props cleanly.
 *
 * @param props - {@link ListViewModifiedControlsProps}.
 * @returns The compact controls, or `null` when nothing is modified.
 */
export function ListViewModifiedControls<TFieldSlug extends string = string>(
  props: ListViewModifiedControlsProps<TFieldSlug>,
): ReactNode {
  const config = useVexConfig();
  const { views, project, collection } = useSavedListViews<CollectionSlug, TFieldSlug>({
    collection: props.collection,
    initialViews: props.initialViews,
    initialLocalIndex: props.initialLocalIndex,
  });
  const canUpdateViews = usePermission({ resource: props.collection, action: VIEW_ACTIONS.updateView });
  const canCreateViews = usePermission({ resource: props.collection, action: VIEW_ACTIONS.createView });
  const canAccessSharedViews = useCanAccessSharedSavedListViews();
  const saveViewMutationFn = useSaveView();
  const saveViewMutation = useMutation({ mutationFn: saveViewMutationFn });
  const [copyDialog, setCopyDialog] = useState<PendingCopyDialog<TFieldSlug> | null>(null);

  // An absent `?view=` resolves to the default ("All")
  // view instead of `undefined` — it is a real, diffable view now, so
  // state changed away from it (sort, filter, columns, …) now correctly
  // shows "Modified: …" here too, not just for a named saved view.
  const activeViewId = decodeViewUrlValue(props.urlState.view) ?? "default";
  const activeView = views.find((view) => view.viewId === activeViewId);

  // An unknown `props.collection` slug is a caller bug this component
  // can't meaningfully degrade from (every check below assumes a real
  // collection) — render nothing rather than crash `resolveEffectiveViewState`.
  if (collection === undefined) return null;

  const effectiveViewState = resolveEffectiveViewState({
    collection,
    q: props.urlState.q,
    qf: props.urlState.qf,
    sort: props.urlState.sort,
    filter: props.urlState.filter,
    size: props.urlState.size,
    activeView,
  });
  const currentState: ListViewStateSnapshot<TFieldSlug> = {
    search: effectiveViewState.search,
    searchField: effectiveViewState.searchField,
    sort: effectiveViewState.sort,
    where: effectiveViewState.where,
    columns: props.columns,
    pageSize: effectiveViewState.pageSize ?? props.defaultPageSize,
    peekWidth: props.peekWidth,
  };
  // A local view's full state already lives in the URL —
  // until the REAL `localStorage` data hydrates (replacing the
  // cookie-index placeholder, `useSavedListViews.ts`'s `toIndexEntry`), the
  // placeholder's own where/sort/search/columns are all empty/`undefined`,
  // which would falsely diff against the URL's real (non-empty) values —
  // e.g. "Modified: 1 filter" flashing on every cold SSR/reload of a
  // local view with a saved filter, self-correcting only once hydration
  // completes. Fix: while still a placeholder, treat
  // the URL's OWN current state as the saved baseline too (diffing
  // `currentState` against itself is always empty) — the real diff
  // resumes the instant `activeView` resolves to the real local view.
  const diff =
    activeView === undefined
      ? undefined
      : diffViewState({
          current: currentState,
          saved: isPlaceholderLocalView(activeView) ? { ...activeView, ...currentState } : activeView,
        });
  const isModified = (diff?.categories.length ?? 0) > 0;
  const canSaveInPlace =
    activeView?.source === VEX_VIEW_SOURCES.local ||
    (activeView?.source === VEX_VIEW_SOURCES.shared && canUpdateViews);
  // Save only starts persisting a
  // `peekWidth` into a view that never had one of its own when the user explicitly resized
  // the peek WHILE viewing THIS view (`props.peekWidthTouched`) — saving some OTHER change
  // (search/sort/filter/…) must not silently bake in whatever unrelated width this browser
  // currently remembers. A view that ALREADY has its own saved width keeps saving the
  // live value as normal (the standard "Modified state gets saved" behavior).
  const peekWidthForSave =
    activeView?.peekWidth !== undefined || props.peekWidthTouched ? currentState.peekWidth : undefined;

  function handleReset(): void {
    if (activeView === undefined) return;
    props.urlState.setQ(activeView.search);
    props.urlState.setQf(activeView.searchField);
    props.urlState.setSort(activeView.sort);
    props.urlState.setFilter(activeView.where);
    props.urlState.setSize(activeView.pageSize);
    // `activeView.columns` is ALREADY fully resolved by
    // `useSavedListViews()` via `completeListViewColumnOrder` — every field, visible or
    // not, with its own width/pin/hidden overrides intact. No fallback to
    // `defaultView.columns` needed anymore (that was the earlier
    // "a view with no explicit columns means inherit the default" special
    // case for a now-superseded separate visible-subset `columns` field
    // — `completeListViewColumnOrder` already handles an empty/undeclared view's
    // columns identically to the default).
    props.onColumnsChange(activeView.columns);
    // Reset on a view with NO saved width has
    // nothing to restore — `peekWidth` was never part of this view's
    // "Modified" diff in the first place (see `diffViewState`'s own
    // skip-when-undefined check), so Reset leaves it exactly as it is,
    // same as `columns` above would if it had no notion of "undeclared".
    if (activeView.peekWidth !== undefined) {
      props.onPeekWidthChange(activeView.peekWidth, "view");
    }
  }

  async function handleSaveInPlace(): Promise<void> {
    if (activeView === undefined) return;
    const view: VexViewConfig<TFieldSlug> = {
      viewId: activeView.viewId,
      name: activeView.name,
      description: activeView.description,
      state: {
        where: currentState.where,
        sort: currentState.sort,
        search: currentState.search === "" ? undefined : currentState.search,
        searchField: currentState.searchField,
        columns: currentState.columns,
        pageSize: currentState.pageSize,
        peekWidth: peekWidthForSave,
      },
    };
    try {
      if (activeView.source === VEX_VIEW_SOURCES.shared) {
        await saveViewMutation.mutateAsync({ collection: props.collection, view });
      } else {
        saveLocalSavedListView({ basePath: config.basePath, project, collection: props.collection, view });
      }
    } catch (error) {
      toast.error("Save view failed", { description: getVexErrorMessage(error) });
    }
  }

  function handleSave(): void {
    if (activeView === undefined) return;
    if (canSaveInPlace) {
      void handleSaveInPlace();
      return;
    }
    // No permission to overwrite a shared view in place, or the active
    // view is a read-only config view — fall back to
    // creating a new local view from the current state instead.
    setCopyDialog({
      viewId: generateViewId(),
      name: `${activeView.name} (copy)`,
      state: { ...currentState, peekWidth: peekWidthForSave },
    });
  }

  async function handleCopyDialogSubmit(values: {
    name: string;
    description: string;
    target: SaveListViewTarget;
  }): Promise<void> {
    if (copyDialog === null) return;
    const view: VexViewConfig<TFieldSlug> = {
      viewId: copyDialog.viewId,
      name: values.name,
      description: values.description === "" ? undefined : values.description,
      state: {
        where: copyDialog.state.where,
        sort: copyDialog.state.sort,
        search: copyDialog.state.search === "" ? undefined : copyDialog.state.search,
        searchField: copyDialog.state.searchField,
        columns: copyDialog.state.columns,
        pageSize: copyDialog.state.pageSize,
        peekWidth: copyDialog.state.peekWidth,
      },
    };
    try {
      if (values.target === VEX_VIEW_SOURCES.shared) {
        await saveViewMutation.mutateAsync({ collection: props.collection, view });
      } else {
        saveLocalSavedListView({ basePath: config.basePath, project, collection: props.collection, view });
      }
      // ONE atomic URL write, diffed against the JUST-SAVED view's own
      // baseline — the old per-field `setX` sequence
      // (plus a separate `onColumnsChange` → `setCols` call) diffed every
      // field against the STALE pre-switch view (the one being saved AS
      // A COPY FROM), so a field that merely differed from THAT old
      // baseline got written explicitly instead of omitted against the
      // new copy's own. `copyDialog.state.columns` is
      // already fully resolved (carried straight through from
      // `currentState` at dialog-open time).
      props.urlState.applyView({
        viewId: view.viewId,
        name: view.name,
        where: view.state.where,
        sort: view.state.sort,
        search: view.state.search,
        searchField: view.state.searchField,
        columns: copyDialog.state.columns,
        pageSize: view.state.pageSize,
        source: values.target,
        hasHiddenFilter: false,
        hiddenFilterCount: 0,
      });
      // LOCAL STATE ONLY — the URL's own `cols=` is already written above.
      props.onColumnsStateChange(copyDialog.state.columns);
      setCopyDialog(null);
    } catch (error) {
      toast.error("Save view failed", { description: getVexErrorMessage(error) });
    }
  }

  if (!(activeView && isModified)) return null;

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        <span className="hidden truncate text-xs whitespace-nowrap text-muted-foreground @md/list:inline">
          Modified: {formatDiffLabel(diff)}
        </span>
        <Button variant="ghost" size="default" onClick={handleReset} icon="RotateCcw" aria-label="Reset">
          <span className="hidden @md/list:inline">Reset</span>
        </Button>
        <Button
          size="default"
          isPending={saveViewMutation.isPending}
          onClick={handleSave}
          icon="Save"
          aria-label="Save"
        >
          <span className="hidden @md/list:inline">Save</span>
        </Button>
      </div>

      <SaveListViewDialog
        // Same remount-on-reopen rationale as `SavedListViewTabs`' own dialog
        // instance (Base UI keeps `Popup` mounted across close for its
        // exit animation) — keyed on the fresh `viewId` each open gets.
        key={copyDialog ? copyDialog.viewId : "closed"}
        open={copyDialog !== null}
        onOpenChange={(open) => {
          if (!open) setCopyDialog(null);
        }}
        mode="create"
        name={copyDialog?.name ?? ""}
        description=""
        target={VEX_VIEW_SOURCES.local}
        canCreateShared={canCreateViews}
        sharedViewsAvailable={canAccessSharedViews}
        isPending={saveViewMutation.isPending}
        onSubmit={(values) => void handleCopyDialogSubmit(values)}
      />
    </>
  );
}
