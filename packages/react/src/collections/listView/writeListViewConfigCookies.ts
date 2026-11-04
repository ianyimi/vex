"use client";

import { applyListViewSkeletonRowCountUpdate, type ListDensity } from "@vexcms/core";
import { writeAdminCollectionCookie, writeAdminCookie } from "../../adminCookie";

/**
 * Writes the list density cookie client-side, so the next server render
 * (`NextAdminPage` → `parseListViewConfigCookies`) seeds
 * `CollectionListView` with the new value instead of flashing back to
 * `"comfortable"`. Merges into the consolidated `vex-admin`
 * cookie via {@link writeAdminCookie} rather than writing its own
 * dedicated `vex-list-density` cookie.
 * @param props.basePath - The project's `config.basePath` — the cookie's `Path` attribute.
 * @param props.density - The new density to persist.
 */
export function writeListViewDensityCookie(props: { basePath: string; density: ListDensity }): void {
  writeAdminCookie({ basePath: props.basePath, patch: { density: props.density } });
}

/**
 * Writes the Inspect peek panel's remembered tab cookie client-side —
 * the write side of
 * `parseListViewConfigCookies`'s `peekTab` field. Admin-wide (same split
 * `writeListViewDensityCookie` above already draws), not per-collection —
 * merges into the consolidated GLOBAL `vex-admin` cookie via
 * {@link writeAdminCookie}.
 * @param props.basePath - The project's `config.basePath` — the cookie's `Path` attribute.
 * @param props.tab - The tab the user just switched to.
 */
export function writeListViewPeekTabCookie(props: { basePath: string; tab: "fields" | "json" }): void {
  writeAdminCookie({ basePath: props.basePath, patch: { peekTab: props.tab } });
}

/**
 * Writes the Inspect peek panel's width cookie client-side — the write
 * side of
 * `parseListViewConfigCookies`'s `peekWidth` field. Merges into
 * the consolidated `vex-admin:<collectionSlug>` cookie via
 * {@link writeAdminCollectionCookie}, same split every other collection-
 * scoped preference here draws.
 * @param props.basePath - The project's `config.basePath` — the cookie's `Path` attribute.
 * @param props.collectionSlug - The collection the peek belongs to.
 * @param props.width - The new width (px) to persist, or `undefined` to clear it (Reset — falls back to {@link PEEK_PANEL_DEFAULT_WIDTH_PX} on the next read).
 */
export function writeListViewPeekWidthCookie(props: {
  basePath: string;
  collectionSlug: string;
  width: number | undefined;
}): void {
  writeAdminCollectionCookie({
    basePath: props.basePath,
    collection: props.collectionSlug,
    patch: { peekWidth: props.width },
  });
}

/**
 * Writes the filter-chip row's visibility cookie client-side
 * — the write side of `parseListViewConfigCookies`'s `chipsVisible` field.
 * Merges into the consolidated `vex-admin:<collectionSlug>`
 * cookie via {@link writeAdminCollectionCookie}.
 *
 * @param props.basePath - The project's `config.basePath` — the cookie's `Path` attribute.
 * @param props.collectionSlug - The collection the chip row belongs to.
 * @param props.visible - The new visibility to persist.
 */
export function writeListViewChipsVisibleCookie(props: { basePath: string; collectionSlug: string; visible: boolean }): void {
  writeAdminCollectionCookie({
    basePath: props.basePath,
    collection: props.collectionSlug,
    patch: { chipsVisible: props.visible },
  });
}

/**
 * Writes this collection's row-count cookie client-side — whenever a list view's result settles, {@link CollectionListViewData} (Collection
 * ListView.tsx) calls this with the visible row count AND whether the view was fully loaded
 * (its footer showed "That's everything" vs a Load More `Button`) so the NEXT server render's
 * `<Suspense>` loading skeleton (read via `parseListViewSkeletonRowCountCookie`) shows the SAME row count
 * AND footer variant instead of a fixed `pageSize`/Load-More-height guess. Merges into the
 * EXISTING map (every other view's own last entry, capped at `LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_MAX_ENTRIES`
 * entries, oldest dropped — {@link applyListViewSkeletonRowCountUpdate}) rather than overwriting it. The merged map is written into the consolidated `vex-admin:<collectionSlug>` cookie's own
 * `rowCounts` field via {@link writeAdminCollectionCookie}, which already reads-merges-writes the
 * rest of that cookie's fields — this function only needs to merge the row-count MAP itself
 * (view id → entry) before handing it off.
 *
 * @param props.basePath - The project's `config.basePath` — the cookie's `Path` attribute.
 * @param props.collectionSlug - The collection the view belongs to.
 * @param props.viewId - The view whose result just settled (the collection's default view, `"default"`, included).
 * @param props.count - The settled row count, already capped at that load's `pageSize` by the caller.
 * @param props.done - Whether that result was the view's last page (`pagination.isDone`).
 */
export function writeListViewSkeletonRowCountCookie(props: {
  basePath: string;
  collectionSlug: string;
  viewId: string;
  count: number;
  done: boolean;
}): void {
  // A SINGLE read — `writeAdminCollectionCookie`'s
  // own functional-patch form hands this the SAME fresh `current` it reads internally,
  // so `rowCounts`' own LRU cap (`applyListViewSkeletonRowCountUpdate`, which needs the dedicated
  // merge logic a plain object patch can't express) is computed from EXACTLY the cookie
  // state this write is about to land on top of — never a separate, earlier read that
  // could in principle observe a different value than the one this function commits
  // against a moment later.
  writeAdminCollectionCookie({
    basePath: props.basePath,
    collection: props.collectionSlug,
    patch: (current) => ({
      rowCounts: applyListViewSkeletonRowCountUpdate({
        map: current.rowCounts ?? {},
        viewId: props.viewId,
        count: props.count,
        done: props.done,
      }),
    }),
  });
}


