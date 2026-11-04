"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  adminCollectionCookieName,
  parseAdminCollectionCookie,
  type LocalSavedListViewsIndexEntry,
  type VexViewConfig,
} from "@vexcms/core";
import { writeAdminCollectionCookie } from "../../../adminCookie";

/**
 * `localStorage` key for one collection's local saved views — namespaced by
 * `project` (the current Convex deployment's URL, `useConvex().url`) and
 * `collection`, so the same collection slug across two different VexCMS
 * projects sharing a browser profile stays isolated.
 * @returns The `vex:views:<project>:<collection>` storage key string.
 */
export function localViewsStorageKey(props: { project: string; collection: string }): string {
  return `vex:views:${props.project}:${props.collection}`;
}

const LOCAL_VIEWS_EVENT = "vex:views-change";

interface LocalViewsEnvelope {
  version: 1;
  views: VexViewConfig[];
}

function isLocalViewsEnvelope(value: unknown): value is LocalViewsEnvelope {
  return (
    value !== null &&
    typeof value === "object" &&
    "version" in value &&
    "views" in value &&
    value.version === 1 &&
    Array.isArray(value.views)
  );
}

/** Stable empty-array reference — `useSyncExternalStore`'s snapshot must not change identity when nothing changed. */
const EMPTY_VIEWS: VexViewConfig[] = [];

const cachedRaw = new Map<string, string>();
const cachedViews = new Map<string, VexViewConfig[]>();

/**
 * Reads the local views stored at `localViewsStorageKey(props)`, SSR-safe
 * and guarded against a blocked/unavailable `localStorage` (Safari private
 * mode, a jsdom test environment with no backing store). Caches by raw
 * string per key so repeated reads between writes return the SAME array
 * reference — required for `useSyncExternalStore`'s snapshot stability.
 *
 * A view is `VexViewConfig`'s shape (a nested `state`): `{
 * viewId, name, description?, state: { where?, sort?, search?,
 * searchField?, columns?, pageSize? } }`.
 *
 * @param props.project - The Convex deployment URL this browser is pointed at.
 * @param props.collection - The collection slug.
 * @returns The stored views, or `[]` when unset, unreadable, or malformed.
 */
function readLocalViews(props: { project: string; collection: string }): VexViewConfig[] {
  if (typeof window === "undefined") return EMPTY_VIEWS;
  const key = localViewsStorageKey(props);
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return EMPTY_VIEWS;
  }
  if (raw === null) return EMPTY_VIEWS;
  if (raw === cachedRaw.get(key)) return cachedViews.get(key) ?? EMPTY_VIEWS;
  cachedRaw.set(key, raw);
  try {
    const parsed: unknown = JSON.parse(raw);
    const views = isLocalViewsEnvelope(parsed) ? parsed.views : EMPTY_VIEWS;
    cachedViews.set(key, views);
    return views;
  } catch {
    cachedViews.set(key, EMPTY_VIEWS);
    return EMPTY_VIEWS;
  }
}

/**
 * Mirrors `views` into the consolidated `vex-admin:<collection>` cookie's
 * own `localViews` field as a `{ viewId, name }[]` index, so
 * the server can render the local-view tabs on first paint without
 * touching `localStorage`. {@link writeAdminCollectionCookie} already
 * swallows a blocked/unavailable `document.cookie` — losing the
 * server-prerendered tab is not worth crashing the write.
 *
 * @param props.basePath - The project's `config.basePath` — the cookie's `Path` attribute.
 * @param props.collection - The collection slug the cookie is scoped to.
 * @param props.views - The full local view list to mirror.
 */
function writeListViewsCookie(props: { basePath: string; collection: string; views: VexViewConfig[] }): void {
  if (typeof document === "undefined") return;
  const index: LocalSavedListViewsIndexEntry[] = props.views.map((view) => ({ viewId: view.viewId, name: view.name }));
  writeAdminCollectionCookie({
    basePath: props.basePath,
    collection: props.collection,
    patch: { localViews: index },
  });
}

function writeLocalViews(props: { basePath: string; project: string; collection: string; views: VexViewConfig[] }): void {
  if (typeof window === "undefined") return;
  const key = localViewsStorageKey(props);
  const envelope: LocalViewsEnvelope = { version: 1, views: props.views };
  try {
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    return;
  }
  writeListViewsCookie({ basePath: props.basePath, collection: props.collection, views: props.views });
  window.dispatchEvent(new Event(LOCAL_VIEWS_EVENT));
}

/**
 * Saves (inserts or, on a matching `viewId`, replaces in place) one view
 * into this browser's local store for `props.collection`, and mirrors the
 * updated index into the consolidated `vex-admin:<collection>` cookie's
 * `localViews` field.
 *
 * @param props.basePath - The project's `config.basePath` — the cookie's `Path` attribute.
 * @param props.project - The Convex deployment URL (`useSavedListViews()`'s `project`).
 * @param props.collection - The collection slug.
 * @param props.view - The view to save, keyed by its own `viewId`.
 * @throws {Error} When `view.viewId` is `"default"` — the collection's
 *   reserved default-view id is never a real local view.
 *   Defense-in-depth: every UI path that could reach this is already
 *   disabled for the default view; this is the backstop.
 */
export function saveLocalSavedListView(props: {
  basePath: string;
  project: string;
  collection: string;
  view: VexViewConfig;
}): void {
  if (props.view.viewId === "default") {
    throw new Error(
      'saveLocalSavedListView: "default" is the collection\'s reserved default-view id and can never be saved as a local view.',
    );
  }
  const existing = readLocalViews(props);
  const index = existing.findIndex((view) => view.viewId === props.view.viewId);
  const views =
    index === -1 ? [...existing, props.view] : existing.map((view, i) => (i === index ? props.view : view));
  writeLocalViews({ basePath: props.basePath, project: props.project, collection: props.collection, views });
}

/**
 * Removes one view, by `viewId`, from this browser's local store for
 * `props.collection`, and mirrors the updated index into the cookie
 * (`localViews`). A no-op when no local view has that `viewId`.
 *
 * @param props.basePath - The project's `config.basePath` — the cookie's `Path` attribute.
 * @param props.project - The Convex deployment URL.
 * @param props.collection - The collection slug.
 * @param props.viewId - The view to remove.
 * @throws {Error} When `viewId` is `"default"` — same reserved-id
 *   defense-in-depth backstop as {@link saveLocalSavedListView}.
 */
export function removeLocalSavedListView(props: {
  basePath: string;
  project: string;
  collection: string;
  viewId: string;
}): void {
  if (props.viewId === "default") {
    throw new Error(
      'removeLocalSavedListView: "default" is the collection\'s reserved default-view id and can never be removed.',
    );
  }
  const existing = readLocalViews(props);
  writeLocalViews({
    basePath: props.basePath,
    project: props.project,
    collection: props.collection,
    views: existing.filter((view) => view.viewId !== props.viewId),
  });
}

/**
 * Generates a client-side `viewId` for a new local view. Stable across
 * promotion: saving the same view shared reuses this id, so
 * `saveView`'s idempotent upsert patches the same `vex_views` row rather
 * than creating a second one.
 *
 * @returns A fresh random id.
 */
export function generateViewId(): string {
  return crypto.randomUUID();
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LOCAL_VIEWS_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LOCAL_VIEWS_EVENT, onStoreChange);
  };
}

const getServerSnapshot = (): VexViewConfig[] => EMPTY_VIEWS;

const prunedForKey = new Set<string>();

/**
 * Reconciles the consolidated `vex-admin:<collection>` cookie's
 * `localViews` field against `props.views` — the REAL,
 * just-read `localStorage` content — on mount. Writes whenever the two
 * don't mirror each other EXACTLY (same `viewId`s with the same `name`s,
 * order-independent), in EITHER direction: a stale cookie entry with no
 * matching local view (an earlier bug, a manually cleared `localStorage`,
 * another device's leftover index) gets pruned, AND a local view missing
 * from the cookie — including an entirely EMPTY cookie while real local
 * views exist, e.g. from a prior bug run or a cookie cleared independently
 * of `localStorage` — gets written back in. The earlier version only ever
 * pruned (`cookieIndex.length === 0` short-circuited before ever reaching
 * a write), so an empty-but-wrong cookie could never self-heal; this is
 * bidirectional and self-heals either way.
 *
 * @param props.basePath - The project's `config.basePath` — the cookie's `Path` attribute.
 * @param props.collection - The collection slug the cookie is scoped to.
 * @param props.views - The CURRENT local views, freshly read from `localStorage`.
 */
function pruneStaleListViewsCookie(props: { basePath: string; collection: string; views: VexViewConfig[] }): void {
  if (typeof document === "undefined") return;
  if (prunedForKey.has(props.collection)) return;
  prunedForKey.add(props.collection);
  const name = adminCollectionCookieName({ collection: props.collection });
  const prefix = `${name}=`;
  const raw = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix))
    ?.slice(prefix.length);
  const cookieIndex = parseAdminCollectionCookie({ cookieValue: raw }).localViews ?? [];
  const cookieNameById = new Map(cookieIndex.map((entry) => [entry.viewId, entry.name]));
  const matches =
    cookieIndex.length === props.views.length &&
    props.views.every((view) => cookieNameById.get(view.viewId) === view.name);
  if (!matches) writeListViewsCookie({ basePath: props.basePath, collection: props.collection, views: props.views });
}

/**
 * Reads this browser's local saved views for one collection, re-rendering on
 * any write — this tab's (`vex:views-change`) or another tab's writing the
 * same key (`storage`). SSR-safe: `getServerSnapshot` returns `[]`.
 *
 * On mount, once `localStorage` is readable, reconciles the consolidated
 * `vex-admin:<collection>` cookie's `localViews` field against it (the
 * accepted tradeoff: a mismatched cookie — stale entries, missing
 * entries, or an empty/wrong cookie from an earlier bug — shows whatever
 * it already said, or nothing, until this hydration pass, then is
 * corrected in EITHER direction, not just pruned).
 *
 * @param props.basePath - The project's `config.basePath` — the cookie's `Path` attribute.
 * @param props.project - The Convex deployment URL this browser is pointed at.
 * @param props.collection - The collection slug.
 * @returns The current local views for `props.collection`.
 */
export function useLocalSavedListViews(props: { basePath: string; project: string; collection: string }): VexViewConfig[] {
  const views = useSyncExternalStore(
    subscribe,
    useCallback(() => readLocalViews(props), [props.project, props.collection]),
    getServerSnapshot,
  );
  // Deliberately reads `localStorage` directly via `readLocalViews(props)` again here,
  // rather than pruning against the `views` value this render returned: on the very
  // first client commit after a fresh navigation, `useSyncExternalStore` intentionally
  // renders `getServerSnapshot()`'s placeholder (`[]`) to match the SSR'd HTML exactly
  // (hydration-mismatch avoidance) — and `useEffect` for THAT commit still fires before
  // React's own follow-up resync render, so an effect keyed on `views` would prune using
  // the placeholder `[]` on a navigation where real local views already exist, treat
  // every cookie entry as "stale" (no match in an empty set), and overwrite a CORRECT
  // cookie with `[]` — permanently, since the one-shot `prunedForKey` guard below means
  // it never runs again for this collection this page load. `localStorage` itself has no
  // such hydration-matching constraint — it is synchronously readable the instant this
  // effect runs, real value or not — so reading it directly here is unaffected by which
  // of the two post-navigation commits triggered the effect.
  useEffect(() => {
    pruneStaleListViewsCookie({ basePath: props.basePath, collection: props.collection, views: readLocalViews(props) });
  }, [props.basePath, props.collection, props.project]);
  return views;
}
