import { isFieldAllowed, type ResolvedFieldPermissions } from "../../access";
import type { VexWhereNodeOf } from "../../access/queryConstraintTypes";
import { referencedWhereFields, type VexWhere } from "../../db/queryArgs";
import { completeListViewColumnOrder } from "./listViewColumnOrder";
import { composeSavedListViewWhere } from "../savedListViews/composeSavedListViewWhere";
import type { ListViewUrlState } from "./listViewUrlState";
import { resolveCollectionIndexes } from "../resolveCollectionIndexes";
import type { ColumnEntry, CollectionConfig, CollectionTableSort, VexStoredView, VexViewConfig, VexViewState } from "../types";

/** {@link resolveListViewQueryState}'s result — one list query's fully-resolved, view-aware state, ready for `buildListViewFindQueryArgs`/`buildListViewSearchQueryArgs` (`collections/listView/listViewQueryArgs.ts`). */
export interface ResolvedListViewQueryState<TFieldSlug extends string = string> {
  /** A declared view's (default or config) hidden filter ANDed with the caller's own (Design Decision 25/45/48), or a shared/local view's own filter, or just the caller's filter. */
  where: VexWhereNodeOf<unknown> | undefined;
  /** Parked (`undefined`) whenever `search` is non-empty (Design Decision 7) — callers must check `search` before reading this. */
  sort: CollectionTableSort<TFieldSlug> | undefined;
  /** `""` means no search is active. */
  search: string;
  searchField: TFieldSlug | undefined;
  pageSize: number;
  /**
   * Set (to the field that was dropped) when the resolved `sort.field` — from a
   * shared/local view's own saved state, or the raw URL — no longer exists on the
   * live collection or leads no declared index, and {@link sort} fell back to the
   * collection default's own sort instead (polish fix, Decision 7). `undefined`
   * when `sort` needed no correction. The saved view itself is never rewritten —
   * this is a read-time degrade only, surfaced so the toolbar can show a dismissible
   * notice ("This view's sort on 'X' is no longer available").
   */
  staleSortField?: string;
  /**
   * Same as {@link staleSortField}, for {@link searchField} — set when the resolved
   * value no longer names one of `collection.admin.view.state.searchFields`.
   */
  staleSearchField?: string;
  /**
   * Set (to the field that was dropped) when a USER-added filter condition —
   * `params.filter`, or a shared/local view's own saved `where` (NEVER a
   * declared/config view's hidden `where`, which stays exempt and applied
   * regardless of field readability, Decision 11 of
   * `access-system-fields.md`) — names a field `props.fieldPermissions`
   * says the caller can't read, and that condition was dropped from
   * {@link where} instead of being sent to the server (which would reject
   * it, Decision 26, leaving the user with a now-hidden chip and no way to
   * remove it — the gap this closes). `undefined` when `props.fieldPermissions`
   * was not supplied (the check is skipped entirely, matching the old
   * unguarded behavior) or when no condition needed dropping. Same
   * dismissible-notice shape as {@link staleSortField}/{@link staleSearchField}
   * — the saved view/URL itself is never rewritten.
   */
  staleFilterField?: string;
  /**
   * The FULL column list (Decision 48), ALWAYS complete — every one of
   * the collection's own data fields, exactly once, in display order,
   * each a {@link ColumnEntry} (possibly carrying `width`/`pinned`/
   * `hidden`/`enableSorting`/`enableHiding` overrides). Resolved from
   * three layers, narrowest first (`params.cols ?? viewState?.columns ??
   * collection.admin.view.state.columns`), then completed
   * (`completeListViewColumnOrder`) so a field none of the three layers names
   * still gets a definite position (appended, declaration order,
   * explicitly hidden) — the SAME completion Decision 47 established,
   * now entry-aware. Every per-field width/sort/hide/pin value a
   * consumer (`getCollectionColumnDefs`, `DataTable`, `NextAdminPage`)
   * needs comes from passing an entry here through `resolveListViewColumnConfig`
   * — this function does not resolve those itself.
   */
  columns: ColumnEntry<TFieldSlug>[];
  /**
   * The active view's OWN saved peek-panel width (px), `undefined` when it
   * never saved one (Decision, developer-approved "peek-resize" — the
   * default/most config views never do). Deliberately NOT merged with the
   * `vex-admin:<collection>` cookie's own collection-wide `peekWidth`
   * default here — this function has no cookie access and stays pure,
   * exactly like `columns` above draws only from `configView`/`sharedView`/
   * `collection`; the caller (`CollectionListView`/`ListViewModifiedControls`'s
   * diff, Decision "peek-resize-view-sync" below) applies
   * `?? initialPreferences.peekWidth` itself. A `local` view's own width
   * never reaches here either (its full state lives in the URL/localStorage,
   * Decision 41, not `configView`/`sharedView`) — `CollectionListView`'s own
   * view-sync effect (the same one that already re-syncs `columnEntries` once
   * `localStorage` hydrates) picks that case up directly from the merged
   * `SavedListViewEntry.peekWidth` instead.
   */
  peekWidth?: number;
}

/**
 * Whether `field` leads a declared index (or is `"_creationTime"`, always sortable) —
 * the same rule `validateSavedListViewConfig` enforces at config-definition time for a
 * CODE-declared view's own `sort.field`. A SHARED/LOCAL view's `sort.field` is never
 * checked at definition time (it's user data, not code), so it can go stale after the
 * field is removed or its index dropped — this re-checks it at resolve time instead.
 *
 * Exported (polish fix, Decision 7) so `@vexcms/react`'s `resolveEffectiveViewState`
 * can apply the IDENTICAL check — not just an equivalent one — to the "Modified"
 * diff/"Save as new"/"Save in place" state it builds client-side, so the two never
 * drift on what counts as stale.
 *
 * @returns `true` when `field` is `undefined`, `"_creationTime"`, or leads one of
 *   `collection`'s declared indexes; `false` otherwise.
 */
export function isSortFieldValid(props: { collection: CollectionConfig; field: string | undefined }): boolean {
  if (props.field === undefined || props.field === "_creationTime") return true;
  return resolveCollectionIndexes({ collection: props.collection }).some((index) => index.fields[0] === props.field);
}

/**
 * Whether `field` is one of the collection's own declared `admin.view.state.searchFields` — same staleness reasoning, and same cross-package reuse, as {@link isSortFieldValid}.
 *
 * @returns `true` when `field` is `undefined` or is listed in
 *   `collection.admin.view.state.searchFields`; `false` otherwise.
 */
export function isSearchFieldValid(props: { collection: CollectionConfig; field: string | undefined }): boolean {
  if (props.field === undefined) return true;
  return ((props.collection.admin.view.state.searchFields as readonly string[] | undefined) ?? []).includes(
    props.field,
  );
}

/**
 * Resolves one list query's effective state by merging three layers, narrowest first: the
 * parsed URL (`params`, Design Decision 40's codec), the active view's own saved state
 * (`configView`/`sharedView`, whichever the caller resolved `params.view` to — or, when
 * neither resolves and `params.view` is unset, the collection's own resolved default
 * ("All") view, `collection.admin.view`, Decision 45/48), and that same default view as the
 * terminal fallback below an incomplete shared/local view.
 *
 * This merge is what makes a bare `?view=shared:<id>` link — unmodified from the saved
 * view, so `serializeListViewUrlState` wrote none of its matching params (Design Decision 9:
 * "only params that differ from the saved view appear") — render the SAME rows as the
 * view's own tab: without it, an omitted `sort`/`filter` would silently fall back to the
 * collection default instead of the view's. A **local** view never reaches here with
 * `configView`/`sharedView` set — its full state is always in the URL already (Design
 * Decision 41), so `params` alone is already complete for it, and `params.view` being set
 * (to a `local:…` value) keeps this function from ALSO substituting the default view.
 *
 * Called by `NextAdminPage` (server prerender, Design Decision 39, this step) and by
 * `CollectionListView` (client, Steps 9/10/12) before either builds its query args — the
 * ONE place this merge lives, so a link to an unmodified view can't render different rows
 * on the two sides (`layout-stability.md`).
 *
 * Decision 7 (polish fix): `sort`/`searchField` are validated against the live
 * collection before being returned — a stale value (the field no longer exists, or
 * leads no declared index/isn't in `searchFields`) falls back to the collection
 * default's own value for that part ONLY, and the fallback is reported via
 * `staleSortField`/`staleSearchField` so the caller can show a dismissible notice.
 * Same shape for a USER-added filter condition naming an unreadable field
 * (access-system-fields.md Decision 11) — dropped, reported via
 * `staleFilterField`, when `props.fieldPermissions` is supplied.
 * The saved view/URL itself is never rewritten.
 *
 * @param props - Input props.
 * @param props.collection - The resolved collection config — supplies
 *   `admin.view`, the resolved default ("All") view (`sort`/`columns`/
 *   `pageSize` always present, `where`/`searchField` optional), both as the
 *   ACTIVE view when nothing else is and as the terminal fallback beneath
 *   an incomplete shared/config view.
 * @param props.sharedView - The `shared`-source view `params.view` names, from the
 *   fetched/cached `listViews` result — `undefined` for any other source.
 * @param props.fieldPermissions - The caller's resolved field-read permissions
 *   (`resolveFieldPermissions`/`useFieldPermissions`). `undefined` (the
 *   default) skips the unreadable-filter-field drop entirely — matches the
 *   old unguarded behavior for a caller that hasn't been updated to supply it.
 * @returns The resolved state.
 */
export function resolveListViewQueryState<TFieldSlug extends string = string>(props: {
  collection: CollectionConfig;
  params: ListViewUrlState<TFieldSlug>;
  configView?: VexViewConfig<TFieldSlug>;
  sharedView?: VexStoredView<TFieldSlug>;
  fieldPermissions?: ResolvedFieldPermissions;
}): ResolvedListViewQueryState<TFieldSlug> {
  // The default ("All") view is the ACTIVE declared view whenever the URL
  // names no view at all — a local view's full state already lives in
  // `params` (Decision 41), so this never substitutes for one; a resolved
  // config/shared view always wins over it.
  const isDefaultActive =
    props.configView === undefined && props.sharedView === undefined && props.params.view === undefined;
  const declaredView: VexViewConfig<TFieldSlug> | undefined =
    props.configView ?? (isDefaultActive ? (props.collection.admin.view as unknown as VexViewConfig<TFieldSlug>) : undefined);
  const viewState: VexViewState<TFieldSlug> | undefined = declaredView?.state ?? props.sharedView?.state;
  // Decision 11 (access-system-fields.md, corrected — DraftPairPagination
  // caught this live on a shared "Published" view, signed out): ONLY a
  // truly USER-SUPPLIED condition is subject to the unreadable-field drop
  // below — a raw URL `filter=` override, or a LOCAL view's own saved
  // filter (its full state always lives in the URL already, Decision 41,
  // indistinguishable from "the user typed this just now"). A declared
  // view's own hidden `where` (config/default) AND a SHARED view's own
  // saved `where` are BOTH "declared filters" per Decision 11's literal
  // grouping ("config/shared-view filters still apply server-side... the
  // exemption must handle vex_status") — curated by whoever created/
  // shared the view, trusted and enforced for every viewer regardless of
  // THEIR OWN field-read permissions, the same way `statusQueryConstraint`'s
  // own `vex_status` exemption already works server-side. Neither is ever
  // checked or dropped here, and neither ever reaches `ListViewFilterChips`
  // as a chip either way (it renders only the raw URL's own `filter=`,
  // `ListViewToolbar.tsx`'s `where={list.urlState.filter}` — never a view-
  // inherited one) — only `SavedListViewHiddenFilterBadge` surfaces it.
  const isSharedViewActive =
    declaredView === undefined && props.sharedView !== undefined && props.params.filter === undefined;
  // The USER-editable part of the filter — `params.filter` when a declared
  // view is active (its OWN hidden `where`, composed below, is NEVER part
  // of this), else `params.filter` when set, else a LOCAL view's own saved
  // `where` (`undefined` here whenever a shared view's own where applies
  // instead — composed back in directly below, exempt from the check).
  // Same sub-expression the final `where` below already needed —
  // extracted so it can be checked for readability BEFORE composing,
  // without re-deriving the fallback chain.
  let userFilter: VexWhereNodeOf<unknown> | undefined = isSharedViewActive
    ? undefined
    : declaredView !== undefined || props.params.filter !== undefined
      ? ((props.params.filter ?? undefined) as VexWhereNodeOf<unknown> | undefined)
      : viewState?.where;
  // Decision 11: a user-added filter condition naming a field the caller
  // can't read must be dropped here, before it ever reaches the server —
  // `find`/`search` reject such a condition (Decision 26), and
  // `ListViewFilterChips` hides the chip that would let the user remove it, a
  // dead end without this. Never applied to `isSharedViewActive`'s own
  // where (`userFilter` is already `undefined` in that case, so there is
  // nothing here to check) or a declared view's own hidden `where`
  // (composed below from `declaredView.state.where` directly, untouched
  // by this) — both stay exempt and enforced regardless of readability.
  let staleFilterField: string | undefined;
  if (props.fieldPermissions !== undefined && userFilter !== undefined) {
    const referenced = referencedWhereFields({ where: userFilter as VexWhere<string> });
    const unreadable = referenced.find((field) => !isFieldAllowed(props.fieldPermissions!, field));
    if (unreadable !== undefined) {
      staleFilterField = unreadable;
      userFilter = undefined;
    }
  }
  const where =
    declaredView !== undefined
      ? composeSavedListViewWhere({
          viewWhere: declaredView.state.where,
          // A declared view has no "own visible filter" to inherit at all
          // (Decision 25 — only its hidden `where` exists, composed above
          // via AND) — `null` (explicit clear) and `undefined` (absent)
          // both collapse to "no additional user filter," so normalizing
          // here changes nothing for this branch.
          filter: userFilter,
        })
      : isSharedViewActive
        ? viewState?.where
        : userFilter;
  const rawColumns =
    props.params.cols ??
    viewState?.columns ??
    (props.collection.admin.view.state.columns as ColumnEntry<TFieldSlug>[]);

  const defaultSort = props.collection.admin.view.state.sort as CollectionTableSort<TFieldSlug>;
  const resolvedSort = props.params.sort ?? viewState?.sort ?? defaultSort;
  // Decision 7: a stale sort — the field no longer exists or leads no declared index —
  // falls back to the collection default's own sort, server and client identically
  // (this function is the one place both sides call); the saved view itself is never
  // rewritten, only this read's OWN result. `defaultSort` is config-time-validated
  // (`validateSavedListViewConfig`), so it is always itself valid and safe as the fallback.
  const sortValid = isSortFieldValid({ collection: props.collection, field: resolvedSort?.field });
  const sort = sortValid ? resolvedSort : defaultSort;
  const staleSortField = sortValid ? undefined : resolvedSort?.field;

  const defaultSearchField = props.collection.admin.view.state.searchField as TFieldSlug | undefined;
  const resolvedSearchField = props.params.qf ?? viewState?.searchField ?? defaultSearchField;
  const searchFieldValid = isSearchFieldValid({ collection: props.collection, field: resolvedSearchField });
  const searchField = searchFieldValid ? resolvedSearchField : defaultSearchField;
  const staleSearchField = searchFieldValid ? undefined : resolvedSearchField;

  return {
    where,
    sort,
    search: props.params.q !== undefined ? props.params.q : (viewState?.search ?? ""),
    searchField,
    pageSize: props.params.size ?? viewState?.pageSize ?? props.collection.admin.view.state.pageSize,
    columns: completeListViewColumnOrder({ order: rawColumns, collection: props.collection }),
    peekWidth: viewState?.peekWidth,
    ...(staleSortField !== undefined ? { staleSortField } : {}),
    ...(staleSearchField !== undefined ? { staleSearchField } : {}),
    ...(staleFilterField !== undefined ? { staleFilterField } : {}),
  };
}
