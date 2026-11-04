import { ADMIN_COOKIE_NAME, adminCollectionCookieName, parseAdminCollectionCookie, parseAdminCookie } from "../../adminCookie";

/**
 * Per-browser list-view preferences that affect LAYOUT — read
 * from cookies on the server (`NextAdminPage`, via
 * {@link parseListViewConfigCookies}) and written only by the client
 * (`listView/writeListViewConfigCookies.ts`'s `writeListViewDensityCookie`/
 * `writeListViewChipsVisibleCookie`), the same split `livePreview/panelCookie.ts`
 * draws between the name/parser living in `@vexcms/core` and the write
 * happening in a `"use client"` hook.
 *
 * `density`/`chipsVisible` now live inside the consolidated `vex-admin`/
 * `vex-admin:<collection>` cookies rather than their own
 * dedicated `vex-list-density`/`vex-list-chips:<collection>` cookies —
 * {@link parseListViewConfigCookies} is the only thing that changed; every
 * export below keeps its exact name/signature (some, like
 * {@link listChipsVisibleCookieName}, are still needed to compute the
 * now-retired cookie NAME for `AdminLayout`'s one-time best-effort clear).
 */
export type ListDensity = "comfortable" | "compact";

/**
 * The Inspect peek panel's default width in px (`w-96`'s own `24rem`,
 * matching the fixed value `ListViewPeek` used before it became
 * resizable) — applied when no `vex-admin:<collection>` cookie entry
 * exists yet.
 */
export const PEEK_PANEL_DEFAULT_WIDTH_PX = 384;
/** The peek panel's resize floor — narrow enough for a field's label/value, wide enough to stay usable. */
export const PEEK_PANEL_MIN_WIDTH_PX = 320;
/** The peek panel's resize ceiling, as a fraction of the viewport width — never lets the panel crowd out the entire list. */
export const PEEK_PANEL_MAX_WIDTH_VIEWPORT_FRACTION = 0.6;

/** The parsed shape {@link parseListViewConfigCookies} returns. */
export interface ListViewConfigCookieValues {
  /** Row density, or the default `"comfortable"` with no cookie yet. */
  density: ListDensity;
  /** Whether the filter-chip row is visible, or the default `true` with no cookie yet. */
  chipsVisible: boolean;
  /** The Inspect peek panel's width in px, or {@link PEEK_PANEL_DEFAULT_WIDTH_PX} with no cookie yet. */
  peekWidth: number;
  /** The Inspect peek panel's remembered tab, or the default `"fields"` with no cookie yet — admin-wide, not per-collection/per-view. */
  peekTab: "fields" | "json";
}

/**
 * Cookie names backing {@link ListViewConfigCookieValues}. Density is a single,
 * collection-agnostic cookie ("stored per browser") — unlike
 * `livePreviewPanelCookieName`, it needs no slug-scoped name-builder
 * function. `chipsVisible` IS collection-scoped (see
 * {@link listChipsVisibleCookieName}) — this entry holds only its prefix.
 */
export const LIST_VIEW_CONFIG_COOKIES = {
  density: "vex-list-density",
  chipsVisible: "vex-list-chips",
} as const;

/** One cookie jar entry — matches both `next/headers`'s `cookies()` return value and the shape `NextAdminPage` already destructures elsewhere (`cookieStore.get(name)?.value`). */
export interface ListViewConfigCookieReader {
  get: (name: string) => { value: string } | undefined;
}

/**
 * Cookie name holding one collection's filter-chip-row visibility choice
 * — scoped per collection, unlike `density`, because
 * visibility is a per-browser call about THIS collection's filters, not a
 * global list preference. Mirrors `livePreviewPanelCookieName`.
 *
 * @param props.collectionSlug - The collection the chip row belongs to.
 * @returns The fully-qualified cookie name, e.g. `vex-list-chips:posts`.
 */
export function listChipsVisibleCookieName(props: { collectionSlug: string }): string {
  return `${LIST_VIEW_CONFIG_COOKIES.chipsVisible}:${props.collectionSlug}`;
}

/**
 * Resolves every layout-affecting list preference from the request's
 * cookies. Pure, like `readLivePreviewPanelCookie`, so the server
 * component (`NextAdminPage`) and any other reader share one
 * interpretation of the stored values.
 *
 * Reads `density` off the consolidated `vex-admin` cookie and
 * `chipsVisible` off `vex-admin:<collectionSlug>` —
 * unchanged signature/behavior from the caller's point of view.
 *
 * @param props.cookies - The request's cookie jar.
 * @param props.collectionSlug - The collection whose chip-row visibility
 *   cookie to read (`chipsVisible` is collection-scoped; `density` is not).
 * @returns `{ density, chipsVisible }` — `density` falls back to
 *   `"comfortable"` when the cookie is absent or holds anything other than
 *   `"comfortable"`/`"compact"`; `chipsVisible` falls back to `true`
 *   (chips show by default) unless the cookie holds exactly
 *   `false`.
 */
export function parseListViewConfigCookies(props: {
  cookies: ListViewConfigCookieReader;
  collectionSlug: string;
}): ListViewConfigCookieValues {
  const global = parseAdminCookie({ cookieValue: props.cookies.get(ADMIN_COOKIE_NAME)?.value });
  const collection = parseAdminCollectionCookie({
    cookieValue: props.cookies.get(adminCollectionCookieName({ collection: props.collectionSlug }))?.value,
  });
  return {
    density: global.density ?? "comfortable",
    chipsVisible: collection.chipsVisible ?? true,
    peekWidth: collection.peekWidth ?? PEEK_PANEL_DEFAULT_WIDTH_PX,
    peekTab: global.peekTab ?? "fields",
  };
}
