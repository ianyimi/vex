import { parseAdminCollectionCookie } from "../../adminCookie";

const LIST_VIEWS_COOKIE_PREFIX = "vex-list-views:";

/** One local view's entry in the cookie index — deliberately NOT the full `VexViewConfig`; only enough to render a tab. */
export interface LocalSavedListViewsIndexEntry {
  viewId: string;
  name: string;
}

/**
 * Cookie name holding one collection's local saved-view index.
 *
 * No longer the cookie ACTUALLY written/read on the wire (consolidated
 * into `vex-admin:<collection>`'s own `localViews` field) — retained for
 * `AdminLayout`'s one-time best-effort clear of the now-retired cookie
 * name.
 *
 * @param props.collection - The collection slug the cookie is scoped to.
 * @returns The fully-qualified cookie name.
 */
export function localSavedListViewsCookieName(props: { collection: string }): string {
  return `${LIST_VIEWS_COOKIE_PREFIX}${props.collection}`;
}

/**
 * Parses the `localViews` field off a `vex-admin:<collection>` cookie's
 * raw value (`props.cookieValue` is now that consolidated cookie's own
 * value, not a dedicated `vex-list-views:<collection>` one).
 * Tolerant of a missing, malformed, or stale-shaped cookie — a bad index
 * degrades to "no local view tabs on first paint" (the store still
 * hydrates the real list from `localStorage` moments later), never a
 * server render error.
 *
 * @param props.cookieValue - The raw `vex-admin:<collection>` cookie value, or `undefined` when unset.
 * @returns The index entries, or `[]` when the cookie is unset or malformed.
 */
export function parseLocalSavedListViewsIndexCookie(props: {
  cookieValue: string | undefined;
}): LocalSavedListViewsIndexEntry[] {
  return parseAdminCollectionCookie({ cookieValue: props.cookieValue }).localViews ?? [];
}
