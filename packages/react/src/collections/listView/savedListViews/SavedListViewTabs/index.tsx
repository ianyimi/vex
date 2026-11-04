"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  VEX_VIEW_SOURCES,
  VIEW_ACTIONS,
  truncateLocalViewName,
  type CollectionConfig,
  type ColumnEntry,
  type CollectionSlug,
  type LocalSavedListViewsIndexEntry,
  type VexStoredView,
  type VexViewConfig,
} from "@vexcms/core";
import { useRemoveView } from "../../../api/removeView/client";
import { useSaveView } from "../../../api/saveView/client";
import { useVexConfig } from "../../../../config/VexConfigContext";
import { usePermission } from "../../../../access";
import { getVexErrorMessage } from "../../../../utils/errors";
import { generateViewId, removeLocalSavedListView, saveLocalSavedListView } from "../localSavedListViewsStore";
import { useCanAccessSharedSavedListViews } from "../useCanAccessSharedSavedListViews";
import type { UseListViewPrefetchReturn } from "../useSavedListViewPrefetch";
import type { ListViewUrlStateSlice } from "../../useListViewUrlState";
import {
  decodeViewUrlValue,
  encodeViewUrlValue,
  resolveEffectiveViewState,
  toDefaultEntry,
  useSavedListViews,
  useSavedListViewsCommon,
  type SavedListViewEntry,
  type PendingViewSaveState,
} from "../useSavedListViews";
import { SaveListViewDialog, type SaveListViewTarget } from "../SaveListViewDialog";
import { SavedListViewActionsMenu } from "./SavedListViewActionsMenu";
import { SavedListViewDeleteDialog } from "./SavedListViewDeleteDialog";
import { SavedListViewPromoteDialog } from "./SavedListViewPromoteDialog";
import { SavedListViewSwitcherMenu, sortViewsForDisplay } from "./SavedListViewSwitcherMenu";
import {
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
} from "../../../../ui";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../ui/tooltip";
import { DataTableResponsiveMenu } from "../../../../ui/data-table/DataTableResponsiveMenu";

/** Props for {@link SavedListViewTabs}. */
export interface SavedListViewTabsProps<TFieldSlug extends string = string> {
  collection: CollectionSlug;
  urlState: ListViewUrlStateSlice<TFieldSlug>;
  /** `collection.admin.view.state.pageSize` — `urlState.size`'s value when omitted. */
  defaultPageSize: number;
  /** The active view's FULL column list — owned by `ListViewLayout` (`useListViewContext().columns`). */
  columns: ColumnEntry<TFieldSlug>[];
  /** Replaces the full `columns` array AND writes `cols=`, atomically — used by Reset. A view SWITCH uses `onColumnsStateChange` + `urlState.applyView` instead (below) — see that method's own doc comment for why. */
  onColumnsChange: (columns: ColumnEntry<TFieldSlug>[]) => void;
  /** LOCAL STATE ONLY (no URL write) — used by `applyView` below, which writes `cols=` itself as part of `urlState.applyView`'s single atomic write. See `ListViewContext.tsx`'s own doc comment for why a separate `urlState.setCols` call here would reintroduce the stale-baseline bug. */
  onColumnsStateChange: (columns: ColumnEntry<TFieldSlug>[]) => void;
  /** The peek panel's live width in px — the cookie's current value, mirroring `columns` above. */
  peekWidth: number;
  /** Whether the user has explicitly resized the peek since the active view last changed — forwarded to `ListViewTabStripContent`'s own `openSaveAsNewDialog`. */
  peekWidthTouched: boolean;
  /** Persists a new width via `writeListViewPeekWidthCookie` (drag/keyboard commit, Reset, or a view switch restoring the TARGET view's own saved width) — `CollectionListView`'s own `onPeekWidthChange`. `source: "view"` (used by this component's own `applyView`) persists without counting as the user having touched the width. */
  onPeekWidthChange: (width: number | undefined, source?: "user" | "view") => void;
  /** Server-prefetched shared views — forwarded to `useSavedListViews`. Unused by the Suspense-driven tab strip, which reads the dehydrated `useSuspenseQuery` cache instead; kept optional for non-`NextAdminPage` callers and tests that don't go through streaming SSR. */
  initialViews?: VexStoredView[];
  /** Server-read local-view cookie index — forwarded to `useSavedListViews`. */
  initialLocalIndex?: LocalSavedListViewsIndexEntry[];
  /** Tab hover/focus prefetch handlers — owned by `ListViewLayout` (`useListViewContext().viewPrefetch`), passed down the same explicit-prop way `visibleColumns`/`onVisibleColumnsChange` already are. Hover/focus prefetching itself stays silent (no icon) — only `isQueryPending` below drives the spinner. */
  viewPrefetch: UseListViewPrefetchReturn<TFieldSlug>;
  /** Whether the REAL list query (not a hover prefetch) is pending for the currently active view — `CollectionListView`'s own `pagination.isPending`, forwarded through `ListViewLayout`. The spinner is driven off the real query's own pending state (not `viewPrefetch.pendingViewId`, which stays set for a silent hover-only prefetch too) so the icon only appears once a switch is actually in flight, and only on the view being switched TO. */
  isQueryPending?: boolean;
}

interface PendingSaveDialog<TFieldSlug extends string> {
  mode: "create" | "rename";
  viewId: string;
  name: string;
  description: string;
  target: SaveListViewTarget;
  state: PendingViewSaveState<TFieldSlug>;
}

/** Props the tab-strip-rendering piece needs — supplied by {@link ListViewTabStrip}, which resolves `views`/`resolved`/`collectionConfig` via the plain `useSavedListViews`. */
interface ListViewTabStripContentProps<TFieldSlug extends string> {
  urlState: ListViewUrlStateSlice<TFieldSlug>;
  views: SavedListViewEntry<TFieldSlug>[];
  /** `true` only once the shared-views source has genuinely resolved — gates the "this view no longer exists" banner, which must never flash for a shared view that just hasn't arrived yet. */
  resolved: boolean;
  /** The resolved `CollectionConfig`, from the SAME `useSavedListViews` call that resolved `views` — `undefined` only for an unknown collection slug. Needed by `openSaveAsNewDialog` to validate a stale `sort`/`searchField` before writing it into a new view. */
  collectionConfig: CollectionConfig | undefined;
  canCreateViews: boolean;
  canUpdateViews: boolean;
  canDeleteViews: boolean;
  /** Whether shared views are usable at all for the current caller (`useCanAccessSharedSavedListViews`) — hides "Promote to shared" entirely when `false`, same reasoning as `SaveListViewDialog`'s own `sharedViewsAvailable`. */
  canAccessSharedViews: boolean;
  viewPrefetch: UseListViewPrefetchReturn<TFieldSlug>;
  isQueryPending?: boolean;
  applyView: (view: SavedListViewEntry<TFieldSlug>) => void;
  onOpenSaveDialog: (dialog: PendingSaveDialog<TFieldSlug>) => void;
  onOpenDeleteDialog: (view: SavedListViewEntry<TFieldSlug>) => void;
  onOpenPromoteDialog: (view: SavedListViewEntry<TFieldSlug>) => void;
  defaultPageSize: number;
  columns: ColumnEntry<TFieldSlug>[];
  peekWidth: number;
  peekWidthTouched: boolean;
}

/**
 * Pure presentational tab-strip rendering — the unknownView banner, the tab row (tabs +
 * the single "All views"/view-switcher trigger + Save view button + the active view's
 * ellipsis actions menu, merged across every width — see the tab row's own inline comment
 * for the overflow/single-trigger design). Used by {@link ListViewTabStrip}; its own doc
 * comment covers why this no longer splits into a separate Suspense/fallback pair.
 * @param props - See {@link ListViewTabStripContentProps}.
 * @returns The unknownView banner (when applicable) and the tab/overflow/Save/actions-menu row.
 */
function ListViewTabStripContent<TFieldSlug extends string>(props: ListViewTabStripContentProps<TFieldSlug>) {
  const [menuOpen, setMenuOpen] = useState(false);

  const orderedViews = useMemo(() => sortViewsForDisplay(props.views), [props.views]);
  const defaultView = props.views.find((view) => view.viewId === "default");
  const activeViewId = decodeViewUrlValue(props.urlState.view) ?? "default";
  const activeView = props.views.find((view) => view.viewId === activeViewId);
  // "default" and "config" views are declared in code, never
  // persisted as a `vex_views` row — Rename/Delete are never actionable for
  // either, but STAY VISIBLE (disabled, not hidden) so the menu's shape
  // doesn't shift depending on which view is active (previously Rename/Delete
  // for the default view were gated the SAME
  // loose way a `local`/`shared` view's are — `source === local || canX` —
  // which doesn't exclude `default`/`config` at all).
  const canRenameActiveView =
    activeView !== undefined &&
    activeView.source !== VEX_VIEW_SOURCES.default &&
    activeView.source !== VEX_VIEW_SOURCES.config &&
    (activeView.source === VEX_VIEW_SOURCES.local || props.canUpdateViews);
  const canDeleteActiveView =
    activeView !== undefined &&
    activeView.source !== VEX_VIEW_SOURCES.default &&
    activeView.source !== VEX_VIEW_SOURCES.config &&
    (activeView.source === VEX_VIEW_SOURCES.local || props.canDeleteViews);
  // Gated on `resolved` (never during the fallback, which hasn't heard from
  // the shared-views source at all yet) — a shared view that simply hasn't
  // arrived must never flash this banner.
  const unknownView = props.urlState.view !== undefined && props.resolved && activeView === undefined;

  function handleSelectViewId(viewId: string): void {
    const view = props.views.find((entry) => entry.viewId === viewId);
    if (view !== undefined) props.applyView(view);
    setMenuOpen(false);
  }

  function openSaveAsNewDialog(): void {
    // `props.collectionConfig` only resolves to `undefined` for an unknown
    // collection slug — a caller bug no handler in this shell can meaningfully act on.
    if (props.collectionConfig === undefined) return;
    const effectiveViewState = resolveEffectiveViewState({
      collection: props.collectionConfig,
      q: props.urlState.q ?? "",
      qf: props.urlState.qf,
      sort: props.urlState.sort,
      filter: props.urlState.filter,
      size: props.urlState.size,
      activeView,
    });
    props.onOpenSaveDialog({
      mode: "create",
      viewId: generateViewId(),
      name: "",
      description: "",
      target: VEX_VIEW_SOURCES.local,
      state: {
        search: effectiveViewState.search,
        searchField: effectiveViewState.searchField,
        sort: effectiveViewState.sort,
        where: effectiveViewState.where,
        columns: props.columns,
        pageSize: effectiveViewState.pageSize ?? props.defaultPageSize,
        // Save only starts persisting a peekWidth — same rule
        // `ListViewModifiedControls`' own Save applies — only captures the
        // live width when the active view already had its own, or the user
        // explicitly resized the peek while on it.
        peekWidth: activeView?.peekWidth !== undefined || props.peekWidthTouched ? props.peekWidth : undefined,
      },
    });
  }

  function openRenameDialog(view: SavedListViewEntry<TFieldSlug>): void {
    // Defense-in-depth: the Rename menu item is disabled for `default`/
    // `config` views, but this guard means a future call site can't
    // accidentally open a rename dialog for either.
    if (view.source === VEX_VIEW_SOURCES.default || view.source === VEX_VIEW_SOURCES.config) return;
    props.onOpenSaveDialog({
      mode: "rename",
      viewId: view.viewId,
      name: view.name,
      description: view.description ?? "",
      target: view.source === VEX_VIEW_SOURCES.shared ? VEX_VIEW_SOURCES.shared : VEX_VIEW_SOURCES.local,
      state: {
        where: view.where,
        sort: view.sort,
        search: view.search,
        searchField: view.searchField,
        columns: view.columns,
        pageSize: view.pageSize ?? props.defaultPageSize,
        // Preserves `view`'s own width exactly as it is — Rename never
        // introduces a NEW width for a view that never saved one; no
        // `?? props.peekWidth` fallback (the `view` being renamed may not
        // even be the active one).
        peekWidth: view.peekWidth,
      },
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {unknownView && (
        <p className="text-sm text-muted-foreground">
          This view no longer exists.{" "}
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={() => {
              if (defaultView !== undefined) props.applyView(defaultView);
            }}
          >
            Clear it
          </Button>{" "}
          to keep your remaining filters.
        </p>
      )}

      {/* ONE ROW, every width (a fixed-height, overflow-clipping wrap container, replacing an earlier per-breakpoint tab-reveal design that had two
       * live bugs in the old breakpoint-count design. (1) Clicking "All
       * views" opened TWO menus — up to 4 `TAB_OVERFLOW_STAGES` Popovers were
       * simultaneously mounted (whichever satisfied `totalTabs > stage.count`
       * at THIS exact view count, independent of width) sharing ONE `menuOpen`
       * boolean; opening the one whose CSS-visible trigger was clicked also
       * opened every other mounted stage's content, including a CSS-HIDDEN
       * one, whose zero-size (`display:none`) anchor portalled its popup to
       * the viewport's top-left corner. (2) `TAB_REVEAL_CLASSNAMES` guessed a
       * FIXED tab count per breakpoint, independent of each view's actual
       * NAME length — a container wide enough for 4 short names but not 4
       * long ones still "revealed" all 4, overflowing/wrapping unpredictably.
       *
       * Both are fixed by construction here: exactly ONE "All views" trigger
       * total (no per-breakpoint duplicates, so no shared-state double-open
       * is even possible), and the tab row wraps via the browser's own
       * CONTENT-AWARE flex layout — `h-9 overflow-hidden` on the wrapping
       * div (NOT `TabsList` itself, whose own `h-9` stays as `tabsListVariants`
       * already sets it — this wrapper is the clipping viewport) caps it at
       * exactly one tab's height; whatever doesn't fit the first line wraps
       * onto an invisible second-plus line and is fully clipped — never
       * partially cut, never scrollable — matching the developer's
       * suggested approach. Still pure CSS/container-query, zero
       * `ResizeObserver` measurement — the server render is the final
       * render; `@md/list` is literal (Tailwind's literal-class-scan
       * requirement, same reasoning `TAB_REVEAL_CLASSNAMES`'s own doc
       * comment already established for this file).
       *
       * Below `@md/list`, the tab row and Save view/⋯ all hide — ONLY the
       * views trigger remains, full-width (same breakpoint and shape the
       * old separate mobile block used) — merging what used to be two
       * separate subtrees (a `md:flex`/`md:hidden` CSS swap between an
       * entirely different desktop row and a `DataTableResponsiveMenu`
       * mobile block) into the ONE trigger below, so there is no second,
       * narrower-only copy to ever duplicate state with either. */}
      <div className="flex min-h-9 items-center gap-2">
        <div className="hidden h-9 min-w-0 overflow-hidden @md/list:block">
          <Tabs value={activeViewId} onValueChange={(value) => handleSelectViewId(value as string)}>
            <TabsList variant="line" className="flex-wrap justify-start">
              {orderedViews.map((view) => {
                const isSwitchPending = view.viewId === activeViewId && props.isQueryPending;
                const trigger = (
                  <TabsTrigger
                    value={view.viewId}
                    onPointerEnter={() => props.viewPrefetch.onTabPointerEnter(view)}
                    onPointerLeave={props.viewPrefetch.onTabPointerLeave}
                    onFocus={() => props.viewPrefetch.onTabFocus(view)}
                  >
                    {/* Layout shift fix: the spinner used to
                     * sit inline after the label, growing the tab's own
                     * min-content size and pushing neighboring tabs sideways
                     * the instant a hover-prefetch started — `TabsList` has
                     * no fixed width of its own (each tab is sized by its
                     * own content, not a true equal flex share, confirmed
                     * live), so even RESERVING space via padding on the
                     * label (an earlier attempt) grew the trigger by the
                     * same amount — padding still adds to an element's own
                     * width regardless of `truncate`/`min-w-0`, which only
                     * help when something ELSE already constrains the
                     * width. A `mask-image` fade has ZERO layout footprint
                     * (purely visual, like `opacity`) — the label's own
                     * intrinsic width, and therefore the trigger's, is
                     * identical whether prefetching or not; only the fade
                     * and the absolutely-positioned (`TabsTrigger`'s own
                     * `relative`, so this never contributes to its size
                     * either) spinner appear on top, each while in flight. */}
                    <span
                      className={
                        isSwitchPending
                          ? "[mask-image:linear-gradient(to_right,black_calc(100%-1.25rem),transparent)]"
                          : undefined
                      }
                    >
                      {/* Zero-shift fix: a local view's
                       * cookie-index entry (`localIndex`, the SSR/
                       * first-paint source) truncates its NAME to
                       * `ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS` code points
                       * (`serializeAdminCollectionCookie`) — but `view.name`
                       * here is `localStorage`'s own FULL, untruncated name
                       * once `useLocalSavedListViews`'s post-hydration resync lands
                       * (same commit as hydration, not a later effect).
                       * Rendering the full name unconditionally would flash
                       * long names from truncated-SSR to full-hydrated, the
                       * same one-frame shift `layout-stability.md` forbids —
                       * so the TAB LABEL (display only) always shows the
                       * SAME truncated form the cookie would, via the exact
                       * function the cookie write side uses, for EVERY local
                       * view regardless of hydration state. The view's own
                       * `name` field stays full everywhere else (the rename
                       * dialog's seed, the view-switcher `CommandItem` list
                       * above) — only this visible label is capped. */}
                      {view.source === VEX_VIEW_SOURCES.local ? truncateLocalViewName(view.name) : view.name}
                    </span>
                    {isSwitchPending && (
                      <Loader2Icon
                        className="absolute right-2 top-1/2 size-3 shrink-0 -translate-y-1/2 animate-spin"
                        role="status"
                        aria-label="Loading views"
                      />
                    )}
                  </TabsTrigger>
                );
                if (!view.description) return <Fragment key={view.viewId}>{trigger}</Fragment>;
                return (
                  <TooltipProvider key={view.viewId} delay={1000}>
                    <Tooltip>
                      <TooltipTrigger render={trigger} />
                      <TooltipContent>{view.description}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        <Button
          variant="ghost"
          size="sm"
          icon="Plus"
          onClick={openSaveAsNewDialog}
          className="hidden shrink-0 @md/list:inline-flex"
        >
          Save view
        </Button>

        {activeView && (
          <SavedListViewActionsMenu
            canRename={canRenameActiveView}
            canDelete={canDeleteActiveView}
            canPromote={
              activeView.source === VEX_VIEW_SOURCES.local && props.canCreateViews && props.canAccessSharedViews
            }
            onRename={() => openRenameDialog(activeView)}
            onPromote={() => props.onOpenPromoteDialog(activeView)}
            onDelete={() => props.onOpenDeleteDialog(activeView)}
          />
        )}

        {/* The ONE "All views"/view-switcher trigger, every width. This
         * split: on `@md/list` and up (where the tab row itself is visible), the label is
         * the static "All views" string — unrelated to which view is active, since the
         * active tab's own underline/active state already shows that. Below `@md/list`
         * (where the tab row and Save view/⋯ all hide and this trigger is the ONLY thing
         * left), the label becomes the active view's own name (or "All" on the default
         * view) — the edge-case fix (if the active view's own tab
         * wraps off the visible line — only possible ABOVE `@md/list`, where tabs show at
         * all — the caller must still see which view is active; below `@md/list` there are
         * no tabs to look at in the first place, so the trigger itself is the only place
         * this can show). BOTH spans render unconditionally, every width, every render —
         * CSS alone (`hidden @md/list:inline` / `@md/list:hidden`) decides which is
         * visible, so the SSR'd markup is IDENTICAL to the hydrated DOM; no client-only
         * computation decides which label shows. */}
        <DataTableResponsiveMenu
          open={menuOpen}
          onOpenChange={setMenuOpen}
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="w-full shrink-0 @md/list:w-auto"
              icon="ChevronsUpDown"
              iconPosition="right"
              contentJustify="between"
            >
              <span className="hidden min-w-0 truncate @md/list:inline">All views</span>
              <span className="min-w-0 truncate @md/list:hidden">
                {activeView
                  ? activeView.source === VEX_VIEW_SOURCES.local
                    ? truncateLocalViewName(activeView.name)
                    : activeView.name
                  : "All"}
              </span>
            </Button>
          }
          title="Views"
        >
          <SavedListViewSwitcherMenu
            orderedViews={orderedViews}
            defaultView={defaultView}
            activeViewId={activeViewId}
            onSelect={handleSelectViewId}
          />
        </DataTableResponsiveMenu>
      </div>
    </div>
  );
}

/** Props {@link ListViewTabStrip} needs. */
interface ListViewTabStripProps<TCollectionSlug extends CollectionSlug, TFieldSlug extends string>
  extends Omit<ListViewTabStripContentProps<TFieldSlug>, "views" | "resolved" | "collectionConfig"> {
  collection: TCollectionSlug;
  initialLocalIndex?: LocalSavedListViewsIndexEntry[];
  /** Server-prefetched shared views — forwarded to `useSavedListViews`. */
  initialViews?: VexStoredView[];
}

/**
 * The tab strip — reads every view source via the plain {@link useSavedListViews} (`useQuery`,
 * no Suspense boundary). This used to be split into `ListViewTabStripSuspended`
 * (`useSuspenseQuery` inside a nested `<Suspense>`) and `ListViewTabStripFallback`
 * (default/config/local only, reserving the shared tabs' display position) — the earlier
 * streaming follow-up, built because `NextAdminPage`'s `listViews` prefetch used
 * to be un-awaited (to stream the admin shell instead of blocking on it), which committed
 * SSR "pending" into the HTML and hydrated with fresher client data — a confirmed,
 * reproducible "Hydration failed" error a plain `useQuery` alone couldn't avoid.
 *
 * `NextAdminPage`'s `listViews` prefetch is now unconditionally awaited (a later
 * pop-in regression fix) — by the time ANYTHING renders, the dehydrated cache
 * already has `status: "success"` data, so the precondition for that hydration bug is gone,
 * and so is the Suspense split's own reason to exist. Removed instead of kept dormant —
 * even a nested `<Suspense>` boundary has a cost of its OWN
 * even with already-resolved data — React's streaming SSR ships the boundary's fallback in
 * the FIRST flush and the resolved content as a later chunk regardless of whether the
 * underlying query had to wait at all (confirmed live: a JS-disabled load of a shared-view
 * URL rendered the view-switcher trigger's fallback label, "All", not the active view's real
 * name — the "always show the active view's name" edge-case fix needed this gone, not just
 * worked around). A plain `useQuery` has no fallback to flash in the first place.
 *
 * Error surfacing moves from a `<QueryErrorBoundary>` catching a Suspense rejection to a
 * plain `useEffect` watching `useSavedListViews`'s own `isError` — same "Couldn't load shared
 * views · Retry" toast, fired once per distinct error, with
 * `views` ALREADY falling back to default/config/local only while the shared query is in
 * this state (`mergeListViews`'s own `shared: []` when `sharedQuery.data` is `undefined` on
 * error) — the same tab-row shape a loading/not-yet-resolved state already has, so the
 * error toast changes nothing about the tab row's own layout (zero shift). Retry calls
 * `useSavedListViews`'s own exposed `refetch` (TanStack Query's `sharedQuery.refetch` directly,
 * not `queryClient.invalidateQueries` — a more targeted re-attempt of just this query).
 *
 * @param props - See {@link ListViewTabStripProps}.
 * @returns The tab strip markup.
 */
function ListViewTabStrip<TCollectionSlug extends CollectionSlug, TFieldSlug extends string>(
  props: ListViewTabStripProps<TCollectionSlug, TFieldSlug>,
) {
  const { views, collection, isPending, isError, refetch } = useSavedListViews<TCollectionSlug, TFieldSlug>({
    collection: props.collection,
    initialLocalIndex: props.initialLocalIndex,
    initialViews: props.initialViews,
  });
  useEffect(() => {
    if (!isError) return;
    toast.error("Couldn't load shared views", {
      action: { label: "Retry", onClick: refetch },
    });
    // Fires once per NEW error — `isError` flipping true is the signal, not every render
    // while it stays true. `refetch` intentionally excluded from the dep array: `useSavedListViews`
    // wraps TanStack's own (stable) `refetch` in a new arrow function every render, so
    // including it here would re-fire this effect on every render while `isError` stays
    // true — the effect's own closure still calls whatever `refetch` was current at the
    // moment it ran, which is all a "click Retry" handler needs.
  }, [isError]);
  return (
    <ListViewTabStripContent
      {...props}
      views={views}
      resolved={!isPending}
      collectionConfig={collection}
    />
  );
}

/**
 * The tab strip (All, then config/shared/local in that order, overflowing
 * into an "All views" search menu — a fixed-height,
 * overflow-clipping wrap container rather than per-breakpoint tab-reveal
 * classes) and the modified-state controls. The view
 * IDENTITY itself (source label, name, description) is NOT rendered
 * here — see `ListViewModifiedControls` for the Modified/Reset/Save UI.
 *
 * This function owns the dialog/mutation state (the rename/delete/promote/save dialogs and
 * the handlers that drive them) and renders {@link ListViewTabStrip} for the actual tab row —
 * split for readability, not for any Suspense-related reason anymore (see
 * `ListViewTabStrip`'s own doc comment for why the earlier Suspense split was removed).
 * @param props - See {@link SavedListViewTabsProps}.
 * @returns The tab strip plus the save/delete/promote dialogs this shell owns.
 */
export function SavedListViewTabs<TFieldSlug extends string = string>(props: SavedListViewTabsProps<TFieldSlug>) {
  const config = useVexConfig();
  // Lightweight, shared-query-free plumbing (default view + project) —
  // everything this shell's own dialogs/handlers need that's ALWAYS
  // synchronously known, never gated on the shared-views source. Never the full
  // `useSavedListViews` — this shell must not subscribe to the shared-views query itself
  // (it renders no tabs of its own; `ListViewTabStrip` below does, exactly once).
  const { defaultView: rawDefaultView, project, collection } = useSavedListViewsCommon<CollectionSlug, TFieldSlug>({
    collection: props.collection,
    initialLocalIndex: props.initialLocalIndex,
  });
  const defaultView = toDefaultEntry(rawDefaultView, collection);
  const canCreateViews = usePermission({ resource: props.collection, action: VIEW_ACTIONS.createView });
  const canUpdateViews = usePermission({ resource: props.collection, action: VIEW_ACTIONS.updateView });
  const canDeleteViews = usePermission({ resource: props.collection, action: VIEW_ACTIONS.deleteView });
  const canAccessSharedViews = useCanAccessSharedSavedListViews();
  const removeViewMutationFn = useRemoveView();
  const removeViewMutation = useMutation({ mutationFn: removeViewMutationFn });
  const saveViewMutationFn = useSaveView();
  const saveViewMutation = useMutation({ mutationFn: saveViewMutationFn });

  const [saveDialog, setSaveDialog] = useState<PendingSaveDialog<TFieldSlug> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedListViewEntry<TFieldSlug> | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<SavedListViewEntry<TFieldSlug> | null>(null);
  const [promoting, setPromoting] = useState(false);

  const activeViewId = decodeViewUrlValue(props.urlState.view) ?? "default";

  // "default" is never written to the URL — selecting it
  // clears `view=` the same way the old sentinel "All" selection used to,
  // but every OTHER field is still set directly to its own (now always
  // fully resolved) saved state, exactly like switching to any other view.
  function applyView(view: SavedListViewEntry<TFieldSlug>): void {
    // ONE atomic URL write (`q`/`qf`/`sort`/`filter`/`size`/`view`/`cols`
    // together), diffed against `view`'s OWN baseline — the
    // OLD per-field `setQ`/`setQf`/.../`setView` sequence
    // (plus a separate `onColumnsChange` → `setCols` call) diffed every
    // field against the STALE pre-switch `viewState` (it only updates on
    // a re-render, never mid-function-body), so switching FROM a
    // shared/config view (a real baseline) left params that merely
    // differed from that OLD baseline explicitly in the URL instead of
    // omitted against the NEW target's — e.g. shared→All left a
    // redundant `cols=` behind. `view.columns` is ALREADY
    // fully resolved by `useSavedListViews()` via `completeListViewColumnOrder` — no
    // further completion or default-fallback needed here.
    // `onColumnsStateChange` below is LOCAL STATE ONLY — the URL's own
    // `cols=` is already written by `urlState.applyView` above.
    props.urlState.applyView(view);
    props.onColumnsStateChange(view.columns);
    // A target view with no saved width
    // leaves `peekWidth` exactly as it is — switching to it must not
    // silently reset this browser's own remembered preference to the
    // hardcoded default (same reasoning as `CollectionListView`'s own
    // passive view-sync effect, which this mirrors for an explicit
    // tab-click switch). `"view"` — restoring the TARGET view's own
    // width is not the user "touching" the width on it.
    if (view.peekWidth !== undefined) {
      props.onPeekWidthChange(view.peekWidth, "view");
    }
  }

  async function handleSaveDialogSubmit(values: {
    name: string;
    description: string;
    target: SaveListViewTarget;
  }): Promise<void> {
    if (saveDialog === null) return;
    const view: VexViewConfig<TFieldSlug> = {
      viewId: saveDialog.viewId,
      name: values.name,
      description: values.description === "" ? undefined : values.description,
      state: {
        where: saveDialog.state.where,
        sort: saveDialog.state.sort,
        search: saveDialog.state.search,
        searchField: saveDialog.state.searchField,
        columns: saveDialog.state.columns,
        pageSize: saveDialog.state.pageSize,
        peekWidth: saveDialog.state.peekWidth,
      },
    };
    try {
      if (values.target === VEX_VIEW_SOURCES.shared) {
        await saveViewMutation.mutateAsync({ collection: props.collection, view });
      } else {
        saveLocalSavedListView({ basePath: config.basePath, project, collection: props.collection, view });
      }
      if (saveDialog.mode === "create") {
        applyView({
          viewId: view.viewId,
          name: view.name,
          description: view.description,
          where: view.state.where,
          sort: view.state.sort,
          search: view.state.search,
          searchField: view.state.searchField,
          columns: saveDialog.state.columns,
          pageSize: view.state.pageSize,
          source: values.target,
          hasHiddenFilter: false,
          hiddenFilterCount: 0,
        });
      }
      setSaveDialog(null);
    } catch (error) {
      toast.error(saveDialog.mode === "create" ? "Save view failed" : "Rename view failed", {
        description: getVexErrorMessage(error),
      });
    }
  }

  async function handleConfirmDelete(): Promise<void> {
    if (deleteTarget === null) return;
    // Defense-in-depth: the Delete menu item is disabled for `default`/
    // `config` views — this guard means a future call site can't
    // accidentally delete either (neither is ever a real `vex_views` row
    // or local-storage entry to begin with).
    if (deleteTarget.source === VEX_VIEW_SOURCES.default || deleteTarget.source === VEX_VIEW_SOURCES.config) {
      setDeleteTarget(null);
      return;
    }
    try {
      if (deleteTarget.source === VEX_VIEW_SOURCES.shared) {
        await removeViewMutation.mutateAsync({ collection: props.collection, viewId: deleteTarget.viewId });
      } else {
        removeLocalSavedListView({ basePath: config.basePath, project, collection: props.collection, viewId: deleteTarget.viewId });
      }
      if (activeViewId === deleteTarget.viewId && defaultView !== undefined) applyView(defaultView);
    } catch (error) {
      toast.error("Delete view failed", { description: getVexErrorMessage(error) });
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleConfirmPromote(): Promise<void> {
    if (promoteTarget === null) return;
    setPromoting(true);
    try {
      await saveViewMutation.mutateAsync({
        collection: props.collection,
        view: {
          viewId: promoteTarget.viewId,
          name: promoteTarget.name,
          description: promoteTarget.description,
          state: {
            where: promoteTarget.where,
            sort: promoteTarget.sort,
            search: promoteTarget.search,
            searchField: promoteTarget.searchField,
            columns: promoteTarget.columns,
            pageSize: promoteTarget.pageSize,
            peekWidth: promoteTarget.peekWidth,
          },
        },
      });
      // Promotion is a move — the local entry is removed only
      // after the shared save succeeds; on failure it stays untouched.
      removeLocalSavedListView({ basePath: config.basePath, project, collection: props.collection, viewId: promoteTarget.viewId });
      if (activeViewId === promoteTarget.viewId) {
        props.urlState.setView(encodeViewUrlValue({ source: VEX_VIEW_SOURCES.shared, viewId: promoteTarget.viewId }));
      }
    } catch (error) {
      toast.error("Promote view failed", { description: getVexErrorMessage(error) });
    } finally {
      setPromoting(false);
      setPromoteTarget(null);
    }
  }

  const stripProps: ListViewTabStripProps<CollectionSlug, TFieldSlug> = {
    collection: props.collection,
    initialLocalIndex: props.initialLocalIndex,
    initialViews: props.initialViews,
    urlState: props.urlState,
    canCreateViews,
    canUpdateViews,
    canDeleteViews,
    canAccessSharedViews,
    viewPrefetch: props.viewPrefetch,
    isQueryPending: props.isQueryPending,
    applyView,
    onOpenSaveDialog: setSaveDialog,
    onOpenDeleteDialog: setDeleteTarget,
    onOpenPromoteDialog: setPromoteTarget,
    defaultPageSize: props.defaultPageSize,
    columns: props.columns,
    peekWidth: props.peekWidth,
    peekWidthTouched: props.peekWidthTouched,
  };

  return (
    <>
      <ListViewTabStrip {...stripProps} />

      <SaveListViewDialog
        // Forces a fresh mount — and therefore fresh internal form state —
        // each time a DIFFERENT save/rename request opens. Base UI's Dialog
        // keeps `Popup` mounted across an open/close cycle (for its own
        // exit animation), so a plain `open` prop toggle alone would reuse
        // the same instance and its stale `useState(props.name)` seed —
        // confirmed live: reopening "Save as new" after an earlier save
        // showed the PREVIOUS attempt's typed name instead of a blank
        // field. `saveDialog`'s own `viewId` is unique per open (a fresh
        // `generateViewId()` for "create", the view's own id for "rename"),
        // so keying on `mode-viewId` (falling back to a stable constant
        // while closed, which key value never matters) is exactly the
        // "identity that should force a remount" React wants here.
        key={saveDialog ? `${saveDialog.mode}-${saveDialog.viewId}` : "closed"}
        open={saveDialog !== null}
        onOpenChange={(open) => {
          if (!open) setSaveDialog(null);
        }}
        mode={saveDialog?.mode ?? "create"}
        name={saveDialog?.name ?? ""}
        description={saveDialog?.description ?? ""}
        target={saveDialog?.target ?? VEX_VIEW_SOURCES.local}
        canCreateShared={canCreateViews}
        sharedViewsAvailable={canAccessSharedViews}
        isPending={saveViewMutation.isPending}
        onSubmit={(values) => void handleSaveDialogSubmit(values)}
      />

      <SavedListViewDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        viewName={deleteTarget?.name}
        isShared={deleteTarget?.source === VEX_VIEW_SOURCES.shared}
        isPending={removeViewMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />

      <SavedListViewPromoteDialog
        open={promoteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPromoteTarget(null);
        }}
        viewName={promoteTarget?.name}
        isPending={promoting}
        onConfirm={() => void handleConfirmPromote()}
      />
    </>
  );
}
