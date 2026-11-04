import { parseAdminCollectionCookie } from "../../adminCookie";

/** `vex-list-rows:<collection>` cookie name prefix. */
export const LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_PREFIX = "vex-list-rows:";

/** Oldest entries beyond this count are dropped on write (LRU, by insertion order) so the cookie stays small. */
export const LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_MAX_ENTRIES = 10;

/**
 * One view's last-settled loading-state hint — `n` is the row count (capped at that load's
 * `pageSize`), `done` is whether the footer showed "That's everything" (`true`) or a Load More
 * `Button` (`false`) — both needed so the `<Suspense>` fallback can reproduce the
 * settled footer's own height exactly (a `Button` is taller than the "That's everything" text),
 * not just the row count. `seq` is {@link applyListViewSkeletonRowCountUpdate}'s own monotonic insertion
 * counter — the LRU cap orders by THIS, never by the map's own JS object key
 * order, which silently reorders an integer-like `viewId` (e.g. `"1"`, a legal config view id)
 * to the front regardless of actual insertion order. `undefined` only for a legacy entry
 * written before this field existed — treated as "oldest" (tied with any other legacy entry,
 * self-healing the next time that view's own result settles and gets a real `seq`).
 */
export interface ListViewSkeletonRowCountEntry {
  n: number;
  done: boolean;
  seq?: number;
}

/** One collection's row-count cookie value — maps a view id (including `"default"`) to its last-settled {@link ListViewSkeletonRowCountEntry}. */
export type ListViewSkeletonRowCountMap = Record<string, ListViewSkeletonRowCountEntry>;

/**
 * Cookie name holding one collection's per-view last-settled-row-count map — the table's own
 * `<Suspense>` loading skeleton reads this server-side to render the SAME row
 * count AND footer variant the settled content is about to show, instead of a fixed `pageSize`
 * guess that nearly always over- or under-shoots for a view with fewer rows than a full page.
 * Scoped per collection, like {@link localSavedListViewsCookieName} — a view id is only unique within its
 * own collection.
 *
 * @param props.collection - The collection the row counts belong to.
 * @returns The fully-qualified cookie name, e.g. `vex-list-rows:posts`.
 */
export function listViewSkeletonRowCountCookieName(props: { collection: string }): string {
  return `${LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_PREFIX}${props.collection}`;
}

/**
 * Parses the `rowCounts` field off a {@link listViewSkeletonRowCountCookieName}
 * cookie's value into its view-id → {@link ListViewSkeletonRowCountEntry} map.
 * `props.cookieValue` is the consolidated
 * `vex-admin:<collection>` cookie's own value, not a dedicated
 * `vex-list-rows:<collection>` one — tolerant of a missing, malformed, or
 * stale-shaped cookie (including the PRE-footer-tracking shape,
 * `Record<string, number>`, a bare count, which a returning browser may
 * still carry) in exactly the way {@link parseAdminCollectionCookie}
 * already is: degrades to `{}` (every view's skeleton falls back to
 * `pageSize` rows / the Load More footer variant), never throws.
 *
 * @param props.cookieValue - The raw `vex-admin:<collection>` cookie value, or `undefined`.
 * @returns The parsed map, with every malformed entry dropped rather than failing the whole parse.
 */
export function parseListViewSkeletonRowCountCookie(props: { cookieValue: string | undefined }): ListViewSkeletonRowCountMap {
  return parseAdminCollectionCookie({ cookieValue: props.cookieValue }).rowCounts ?? {};
}

/**
 * Updates `map` with `viewId`'s new {@link ListViewSkeletonRowCountEntry}, re-inserted with a fresh,
 * monotonically-increasing `seq` (most-recently-used) and capped at
 * {@link LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_MAX_ENTRIES} — the entries with the LOWEST `seq` (oldest) are
 * dropped once the cap is exceeded, so a caller visiting many different views over time never
 * grows this cookie unboundedly.
 *
 * Orders by each entry's own `seq` field, NEVER by the map's JS object key order — a plain
 * object's own key enumeration promotes an integer-LIKE string key (e.g. a config view's
 * `viewId: "1"`, legal and common) to the FRONT, in ascending numeric order, regardless of
 * actual insertion order (the JS spec's `[[OwnPropertyKeys]]` enumeration rule) — and that
 * reordering is baked into the object ITSELF, not just one call's own iteration, so even
 * rebuilding a `Map` from `Object.entries(props.map)` within a single call cannot recover true
 * order once `props.map` already contains such a key (confirmed live: a `Map`-only fix still
 * failed this exact scenario across two sequential calls). `seq` sidesteps the problem
 * entirely by never depending on key order at all.
 *
 * @param props.map - The current map (from {@link parseListViewSkeletonRowCountCookie}).
 * @param props.viewId - The view whose result just settled.
 * @param props.count - The settled row count (already capped at that load's `pageSize` by the
 *   caller — this function does no capping of the VALUE itself, only of the map's entry count).
 * @param props.done - Whether that result was the view's last page (`pagination.isDone`).
 * @returns The updated, LRU-capped map — a new object, `map` is never mutated.
 */
export function applyListViewSkeletonRowCountUpdate(props: {
  map: ListViewSkeletonRowCountMap;
  viewId: string;
  count: number;
  done: boolean;
}): ListViewSkeletonRowCountMap {
  const existingSeqs = Object.values(props.map).map((entry) => entry.seq ?? 0);
  const nextSeq = existingSeqs.length > 0 ? Math.max(...existingSeqs) + 1 : 0;
  const next: ListViewSkeletonRowCountMap = {
    ...props.map,
    [props.viewId]: { n: props.count, done: props.done, seq: nextSeq },
  };
  const entries = Object.entries(next);
  if (entries.length <= LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_MAX_ENTRIES) return next;
  // Keep the entries with the HIGHEST `seq` (most recent), dropping the rest — sorted
  // ascending by `seq` (a legacy entry with no `seq` sorts as 0, oldest), then taking the
  // last `LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_MAX_ENTRIES`. `Array.prototype.sort` is stable (ES2019+),
  // so ties (multiple legacy entries) keep their original relative order as a tie-break —
  // a best-effort degrade until each gets a real `seq` from its own next settle.
  const sorted = entries.sort((a, b) => (a[1].seq ?? 0) - (b[1].seq ?? 0));
  return Object.fromEntries(sorted.slice(sorted.length - LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_MAX_ENTRIES));
}
