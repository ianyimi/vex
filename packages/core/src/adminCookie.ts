import type { ListDensity } from "./collections/listView/listViewConfigCookies";
import type { ListViewSkeletonRowCountEntry, ListViewSkeletonRowCountMap } from "./collections/listView/listViewSkeletonRowCountCookie";
import type { LocalSavedListViewsIndexEntry } from "./collections/savedListViews/localSavedListViewsCookie";

/**
 * Consolidated admin-cookie codec — replaces up to five
 * separately-named, `path=/` cookies per collection (`vex-list-density`,
 * `vex-list-chips:<collection>`, `vex-list-views:<collection>`,
 * `vex-list-rows:<collection>`, `vex-live-preview-panel:<slug>`,
 * `vex-live-preview-layout:<slug>`, `sidebar_state`) with exactly TWO JSON
 * cookies, both scoped to the project's own `basePath` instead of the
 * whole domain: `vex-admin` (one per browser — density, sidebar open
 * state, and the live-preview panel state for whichever GLOBAL is
 * currently being edited, since a caller only ever views one global edit
 * page at a time) and `vex-admin:<collection>` (one per collection — the
 * chip row's visibility, the local-view cookie index, the row-count map,
 * and that collection's own live-preview panel state).
 *
 * Every `parseXxxCookie` function elsewhere in `@vexcms/core` (density/
 * chips, the local-view index, the row-count map, the live-preview panel/
 * layout) keeps its own exported name and signature — only its OWN
 * implementation changes, to read the relevant field off
 * {@link parseAdminCookie}/{@link parseAdminCollectionCookie} instead of
 * its own now-retired dedicated cookie. Zero caller-facing API change.
 *
 * `AdminCookieGlobal` and `AdminCookieCollection` intentionally do NOT
 * import each other's — or their own field types' — VALIDATION logic from
 * `savedListViews/localSavedListViewsCookie.ts`/`listView/listViewSkeletonRowCountCookie.ts` (only their TYPES, via
 * `import type`, which erases at compile time and so can't create a
 * runtime circular import even though those files import BACK from this
 * one) — this file owns the one, canonical tolerant-parse implementation
 * for every sub-shape it carries; the downstream files no longer parse a
 * raw cookie string themselves at all, just extract a field from this
 * file's own already-validated result.
 */

/** The ONE cookie name holding every browser-wide (not collection-scoped) admin preference. */
export const ADMIN_COOKIE_NAME = "vex-admin";

/**
 * Cookie name holding one collection's own admin preferences
 * — `vex-admin:<collection>`. Replaces `vex-list-chips:<collection>`,
 * `vex-list-views:<collection>`, `vex-list-rows:<collection>`, and (for a
 * COLLECTION's own edit/list views specifically) `vex-live-preview-panel:<collection>`
 * /`vex-live-preview-layout:<collection>`.
 *
 * @param props.collection - The collection slug the cookie is scoped to.
 * @returns The fully-qualified cookie name, e.g. `vex-admin:posts`.
 */
export function adminCollectionCookieName(props: { collection: string }): string {
  return `${ADMIN_COOKIE_NAME}:${props.collection}`;
}

/** The live-preview panel's open/closed + split-handle position — same shape whether it lives on {@link AdminCookieGlobal} (a global edit view) or {@link AdminCookieCollection} (a collection's edit/list views). */
export interface AdminCookieLivePreview {
  /** Whether the panel is open. `undefined` means "no cookie yet" — the caller falls back to `admin.livePreview.defaultOpen`. */
  panelOpen?: boolean;
  /** The form column's percentage share of the split. `undefined` means "no cookie yet" — the caller falls back to the layout's own default. */
  panelSize?: number;
}

/**
 * `vex-admin`'s parsed shape — one per browser, never per collection.
 * `v: 1` is a schema version tag: a future shape change bumps this and
 * {@link parseAdminCookie} degrades anything with a different (or
 * missing) `v` to all-defaults, the same "never throw, never render a
 * half-migrated value" contract the cookie-index parse already
 * established.
 */
export interface AdminCookieGlobal {
  v: 1;
  /** Row density — collection-agnostic, "stored per browser". */
  density?: ListDensity;
  /** The admin sidebar's open/collapsed state (shadcn's own `sidebar_state`, now scoped and consolidated). */
  sidebarOpen?: boolean;
  /**
   * The live-preview panel state for whichever GLOBAL is currently being
   * edited — NOT keyed by global slug: a caller only ever has one global
   * edit page open at a time, so "the last global you had the panel open
   * for" is the one state worth remembering, same tradeoff a single
   * browser tab already makes for everything else in this cookie.
   */
  livePreview?: AdminCookieLivePreview;
  /** The Inspect peek panel's remembered tab — admin-wide, NOT per-collection/per-view: the same "last used" tradeoff `density`/`sidebarOpen` already make. */
  peekTab?: "fields" | "json";
}

/**
 * `vex-admin:<collection>`'s parsed shape — one per collection.
 */
export interface AdminCookieCollection {
  v: 1;
  /** Whether the filter-chip row is visible for this collection. */
  chipsVisible?: boolean;
  /** This collection's local saved-view cookie index — tabs render on first paint before `localStorage` hydrates. */
  localViews?: LocalSavedListViewsIndexEntry[];
  /** This collection's per-view last-settled row-count map — the `<Suspense>` skeleton's row count/footer variant. */
  rowCounts?: ListViewSkeletonRowCountMap;
  /** This collection's own live-preview panel state. */
  livePreview?: AdminCookieLivePreview;
  /** The Inspect peek panel's current width in px — the collection-wide "last set" value; a saved view's own `peekWidth` (if it has one) overrides this on view switch, same split `columns`/URL state vs this cookie already draws. */
  peekWidth?: number;
}

/**
 * Soft byte cap on `vex-admin:<collection>`'s SERIALIZED (JSON, before
 * URI-encoding) value — most browsers cap a single cookie around 4096
 * bytes including its name/attributes, so this leaves headroom for the
 * `vex-admin:<collection>=` prefix and `path=/<basePath>; max-age=…;
 * samesite=lax` attributes. {@link serializeAdminCollectionCookie} drops
 * `rowCounts` FIRST (the skeleton falls back to a `pageSize` guess —
 * cosmetic, no data loss) if the serialized value would exceed this, then
 * the OLDEST `localViews` entries one at a time (a real saved view's own
 * full state still lives in `localStorage`; the cookie index is only a
 * first-paint hint) until it fits.
 */
export const ADMIN_COOKIE_MAX_BYTES = 3800;

/** A local view's cookie-index NAME longer than this is truncated (the index is a first-paint hint, not the source of truth — `localStorage`'s own full `VexViewConfig.name` is never touched). */
export const ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS = 40;

/** One cookie jar entry — matches both `next/headers`'s `cookies()` return value and the shape `NextAdminPage` already destructures elsewhere (`cookieStore.get(name)?.value`). */
export interface AdminCookieReader {
  get: (name: string) => { value: string } | undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function tryDecodeJson(cookieValue: string | undefined): unknown {
  if (cookieValue === undefined) return undefined;
  try {
    return JSON.parse(decodeURIComponent(cookieValue));
  } catch {
    return undefined;
  }
}

function parseLivePreview(value: unknown): AdminCookieLivePreview | undefined {
  if (!isPlainObject(value)) return undefined;
  const result: AdminCookieLivePreview = {};
  if (typeof value.panelOpen === "boolean") result.panelOpen = value.panelOpen;
  if (typeof value.panelSize === "number" && Number.isFinite(value.panelSize)) result.panelSize = value.panelSize;
  return Object.keys(result).length > 0 ? result : undefined;
}

function isListViewsIndexEntry(item: unknown): item is LocalSavedListViewsIndexEntry {
  return (
    isPlainObject(item) &&
    typeof item.viewId === "string" &&
    typeof item.name === "string"
  );
}

function parseLocalViews(value: unknown): LocalSavedListViewsIndexEntry[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const entries = value.filter(isListViewsIndexEntry);
  return entries.length > 0 ? entries : undefined;
}

function isRowCountEntry(value: unknown): value is ListViewSkeletonRowCountEntry {
  return (
    isPlainObject(value) &&
    typeof value.n === "number" &&
    Number.isInteger(value.n) &&
    value.n >= 0 &&
    typeof value.done === "boolean" &&
    (value.seq === undefined || (typeof value.seq === "number" && Number.isInteger(value.seq)))
  );
}

function parseRowCounts(value: unknown): ListViewSkeletonRowCountMap | undefined {
  if (!isPlainObject(value)) return undefined;
  const result: ListViewSkeletonRowCountMap = {};
  for (const [key, entry] of Object.entries(value)) {
    if (isRowCountEntry(entry)) {
      result[key] = entry.seq === undefined ? { n: entry.n, done: entry.done } : { n: entry.n, done: entry.done, seq: entry.seq };
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Parses the `vex-admin` cookie's value. Tolerant: a missing, malformed,
 * stale-shaped, or version-mismatched cookie degrades to `{ v: 1 }` (every
 * field `undefined`, so every reader falls back to its own default) rather
 * than throwing — the same "a bad cookie never crashes the server render"
 * contract {@link parseLocalSavedListViewsIndexCookie}/{@link parseListViewSkeletonRowCountCookie}
 * already established individually.
 *
 * @param props.cookieValue - The raw `vex-admin` cookie value, or `undefined` when unset.
 * @returns The parsed, tolerant shape.
 */
export function parseAdminCookie(props: { cookieValue: string | undefined }): AdminCookieGlobal {
  const parsed = tryDecodeJson(props.cookieValue);
  if (!isPlainObject(parsed) || parsed.v !== 1) return { v: 1 };
  const result: AdminCookieGlobal = { v: 1 };
  if (parsed.density === "comfortable" || parsed.density === "compact") result.density = parsed.density;
  if (typeof parsed.sidebarOpen === "boolean") result.sidebarOpen = parsed.sidebarOpen;
  if (parsed.peekTab === "fields" || parsed.peekTab === "json") result.peekTab = parsed.peekTab;
  const livePreview = parseLivePreview(parsed.livePreview);
  if (livePreview !== undefined) result.livePreview = livePreview;
  return result;
}

/**
 * Parses a `vex-admin:<collection>` cookie's value. Tolerant, same
 * contract as {@link parseAdminCookie}.
 *
 * Also doubles as the GLOBAL-slug live-preview source: passing the
 * `vex-admin` cookie's own raw value here still correctly resolves
 * `.livePreview` (this function validates each field independently, so an
 * `AdminCookieGlobal`-shaped JSON blob — missing `chipsVisible`/
 * `localViews`/`rowCounts`, which this function simply leaves
 * `undefined` — parses just as cleanly as a real `AdminCookieCollection`
 * one; same shape, different cookie, for the live-preview
 * sub-object).
 *
 * @param props.cookieValue - The raw cookie value, or `undefined` when unset.
 * @returns The parsed, tolerant shape.
 */
export function parseAdminCollectionCookie(props: { cookieValue: string | undefined }): AdminCookieCollection {
  const parsed = tryDecodeJson(props.cookieValue);
  if (!isPlainObject(parsed) || parsed.v !== 1) return { v: 1 };
  const result: AdminCookieCollection = { v: 1 };
  if (typeof parsed.chipsVisible === "boolean") result.chipsVisible = parsed.chipsVisible;
  const localViews = parseLocalViews(parsed.localViews);
  if (localViews !== undefined) result.localViews = localViews;
  const rowCounts = parseRowCounts(parsed.rowCounts);
  if (rowCounts !== undefined) result.rowCounts = rowCounts;
  const livePreview = parseLivePreview(parsed.livePreview);
  if (livePreview !== undefined) result.livePreview = livePreview;
  if (typeof parsed.peekWidth === "number") result.peekWidth = parsed.peekWidth;
  return result;
}

function byteLength(value: string): number {
  // `TextEncoder` is available in both the Node.js server runtime (`NextAdminPage`) and every
  // browser (the client writer, `@vexcms/react/adminCookie.ts`) — no platform-specific fallback needed.
  return new TextEncoder().encode(value).length;
}

/**
 * Serializes {@link AdminCookieGlobal} to its cookie value (JSON, NOT yet
 * URI-encoded — the caller's own `document.cookie`/`Set-Cookie` write does
 * that, the same split {@link parseAdminCookie} already draws against
 * `decodeURIComponent`). No size cap: every field is a small, fixed-size
 * scalar (never an unbounded collection, unlike the collection cookie's
 * `localViews`/`rowCounts`), so it can never approach
 * {@link ADMIN_COOKIE_MAX_BYTES}.
 *
 * @param value - The value to serialize. `v` is forced to `1` regardless of what's passed.
 * @returns The JSON string to assign as the cookie's value.
 */
export function serializeAdminCookie(value: Omit<AdminCookieGlobal, "v">): string {
  return JSON.stringify({ ...value, v: 1 });
}

/**
 * Truncates a local view's NAME to {@link ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS}
 * code points (not UTF-16 code units — never splits a surrogate pair), or
 * returns it unchanged when already at or under the cap. The SAME function
 * backs both sides of the zero-shift guarantee a long local-view name needs
 * — {@link serializeAdminCollectionCookie} (what the
 * server reads back out of the cookie for SSR) and `@vexcms/react`'s own
 * local-view TAB LABEL render (what `localStorage`'s full, untruncated name
 * displays as once hydrated) both call this ONE function, so a name over the
 * cap renders identically before and after hydration — never a from-truncated
 * to-full flash. Only the TAB LABEL is capped this way; the view's own
 * `name` field (the rename dialog's seed, the view-switcher list, etc.)
 * always uses the full, untruncated `localStorage` value — this function is
 * never applied there.
 *
 * @param name - The local view's full name.
 * @returns `name`, or its first {@link ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS} code points.
 */
export function truncateLocalViewName(name: string): string {
  const codePoints = [...name];
  return codePoints.length > ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS
    ? codePoints.slice(0, ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS).join("")
    : name;
}

/**
 * Serializes {@link AdminCookieCollection} to its cookie value.
 * `localViews` entry NAMES longer than {@link ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS}
 * code points are truncated via {@link truncateLocalViewName} (not dropped —
 * a first-paint tab label has no use for more than 40 characters anyway, and
 * trimming it buys back space without losing a real saved view's own
 * first-paint tab entirely). `rowCounts`
 * is NOT re-capped here — the caller (the react writer's
 * `writeListViewSkeletonRowCountCookie`) already runs {@link applyListViewSkeletonRowCountUpdate}
 * (which enforces `LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_MAX_ENTRIES`) before this is
 * ever called, the same "cap on write, not on serialize" split the
 * pre-consolidation cookie already used.
 *
 * If the result still exceeds {@link ADMIN_COOKIE_MAX_BYTES}, `rowCounts`
 * is dropped entirely first (cosmetic — the skeleton falls back to a
 * `pageSize` guess), then the OLDEST `localViews` entries one at a time
 * (insertion order) until the serialized value fits, or `localViews` is
 * empty.
 *
 * @param value - The value to serialize. `v` is forced to `1` regardless of what's passed.
 * @returns The JSON string to assign as the cookie's value, guaranteed to serialize at or under {@link ADMIN_COOKIE_MAX_BYTES}.
 */
export function serializeAdminCollectionCookie(value: Omit<AdminCookieCollection, "v">): string {
  const truncatedLocalViews = value.localViews?.map((entry) => {
    const truncatedName = truncateLocalViewName(entry.name);
    return truncatedName === entry.name ? entry : { ...entry, name: truncatedName };
  });

  let candidate: AdminCookieCollection = {
    ...value,
    ...(truncatedLocalViews !== undefined ? { localViews: truncatedLocalViews } : {}),
    v: 1,
  };
  let serialized = JSON.stringify(candidate);
  if (byteLength(serialized) <= ADMIN_COOKIE_MAX_BYTES) return serialized;

  // Over budget — drop `rowCounts` first (cosmetic skeleton-size hint only).
  if (candidate.rowCounts !== undefined) {
    const { rowCounts: _dropped, ...rest } = candidate;
    candidate = rest;
    serialized = JSON.stringify(candidate);
    if (byteLength(serialized) <= ADMIN_COOKIE_MAX_BYTES) return serialized;
  }

  // Still over budget — drop the OLDEST `localViews` entries one at a time.
  let remainingLocalViews = candidate.localViews ?? [];
  while (remainingLocalViews.length > 0 && byteLength(serialized) > ADMIN_COOKIE_MAX_BYTES) {
    remainingLocalViews = remainingLocalViews.slice(1);
    candidate = { ...candidate, localViews: remainingLocalViews.length > 0 ? remainingLocalViews : undefined };
    serialized = JSON.stringify(candidate);
  }
  return serialized;
}
