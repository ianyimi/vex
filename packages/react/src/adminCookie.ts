"use client";

import {
  ADMIN_COOKIE_NAME,
  adminCollectionCookieName,
  parseAdminCollectionCookie,
  parseAdminCookie,
  serializeAdminCollectionCookie,
  serializeAdminCookie,
  type AdminCookieCollection,
  type AdminCookieGlobal,
} from "@vexcms/core";

/**
 * Client-side write side of `@vexcms/core`'s `adminCookie.ts` codec.
 * Every OTHER client-side cookie writer in `@vexcms/react`
 * (`writeListViewConfigCookies.ts`'s `writeListViewDensityCookie`/
 * `writeListViewChipsVisibleCookie`/`writeListViewSkeletonRowCountCookie`,
 * `localSavedListViewsStore.ts`'s local-view-index write, and
 * `useLivePreviewPanelState.ts`'s panel/layout writes) delegates to
 * {@link writeAdminCookie}/{@link writeAdminCollectionCookie} rather than
 * writing `document.cookie` directly — this file is the ONLY place that
 * does. `SidebarProvider` (`ui/sidebar.tsx`) also writes through this
 * file directly, since `sidebarOpen` has no OTHER dedicated wrapper.
 *
 * `basePath` is a required parameter, not read internally via
 * `useVexConfig()`, because these are plain functions (callable from
 * event handlers, not just component bodies) — every call site threads
 * its own already-in-scope `config.basePath` through.
 */

/**
 * Reads one cookie's raw value out of `document.cookie`'s own semicolon-separated
 * string. Exported so the rest of
 * `@vexcms/react`'s cookie writers (`writeListViewConfigCookies.ts`, `localSavedListViewsStore.ts`)
 * reuse this ONE implementation instead of each carrying a byte-identical copy.
 *
 * @param name - The cookie's name.
 * @returns Its raw (still URI-component-encoded) value, or `undefined` when unset.
 */
export function readCookieValue(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`));
  return match?.[1];
}

const ADMIN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function writeCookieValue(name: string, serializedValue: string, basePath: string): void {
  document.cookie = `${name}=${encodeURIComponent(serializedValue)}; path=${basePath}; max-age=${ADMIN_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

/**
 * Read-merge-write for the global `vex-admin` cookie: reads the current
 * value, merges `props.patch` on top of it, and writes the result back —
 * skipping the write entirely when the merged result would serialize to
 * the SAME value already on the wire (no-op `Set-Cookie`, matching the
 * existing writers' "only write what changed" spirit).
 *
 * Guarded the way every pre-consolidation writer already was —
 * `document.cookie` can throw under Safari private mode / strict cookie
 * settings; losing a UI preference is not worth crashing the view.
 *
 * @param props.basePath - The project's `config.basePath` (`useVexConfig().basePath`) — the cookie's `Path` attribute.
 * @param props.patch - The fields to merge into the current cookie value, OR a
 *   function that COMPUTES them from the SAME fresh `current` this function
 *   already reads — see {@link writeAdminCollectionCookie}'s own doc comment
 *   for why a writer whose patch isn't a flat value needs this form
 *   (`writeSidebarSectionCountsCookie`'s per-section merge, `sidebarSectionCountsCookie.ts`'s
 *   `applySidebarSectionCountsUpdate`).
 */
export function writeAdminCookie(props: {
  basePath: string;
  patch: Partial<Omit<AdminCookieGlobal, "v">> | ((current: AdminCookieGlobal) => Partial<Omit<AdminCookieGlobal, "v">>);
}): void {
  try {
    const rawCurrent = readCookieValue(ADMIN_COOKIE_NAME);
    const current = parseAdminCookie({ cookieValue: rawCurrent });
    const patch = typeof props.patch === "function" ? props.patch(current) : props.patch;
    const next: AdminCookieGlobal = { ...current, ...patch, v: 1 };
    const nextSerialized = serializeAdminCookie(next);
    if (rawCurrent !== undefined && decodeURIComponent(rawCurrent) === nextSerialized) return;
    writeCookieValue(ADMIN_COOKIE_NAME, nextSerialized, props.basePath);
  } catch {
    // document.cookie can throw under Safari private mode / strict cookie settings.
  }
}

/**
 * Read-merge-write for one collection's `vex-admin:<collection>` cookie —
 * see {@link writeAdminCookie}'s own doc comment for the shared contract.
 *
 * @param props.basePath - The project's `config.basePath` (`useVexConfig().basePath`) — the cookie's `Path` attribute.
 * @param props.collection - The collection slug the cookie is scoped to.
 * @param props.patch - The fields to merge into the current cookie value, OR a
 *   function that COMPUTES them from the SAME fresh `current` this function
 *   already reads — for a writer whose patch isn't a flat value (developer-
 *   reported fix: `writeListViewSkeletonRowCountCookie`'s own LRU-capped `rowCounts`
 *   merge used to do a SEPARATE, EARLIER `readCookieValue` of its own just to
 *   compute the map it then handed over as a flat patch — a second,
 *   redundant read that could in principle observe a different cookie state
 *   than the fresh one this function reads a moment later. A function patch
 *   closes that gap entirely: there is only ever ONE read per write call.
 */
export function writeAdminCollectionCookie(props: {
  basePath: string;
  collection: string;
  patch:
    | Partial<Omit<AdminCookieCollection, "v">>
    | ((current: AdminCookieCollection) => Partial<Omit<AdminCookieCollection, "v">>);
}): void {
  try {
    const name = adminCollectionCookieName({ collection: props.collection });
    const rawCurrent = readCookieValue(name);
    const current = parseAdminCollectionCookie({ cookieValue: rawCurrent });
    const patch = typeof props.patch === "function" ? props.patch(current) : props.patch;
    const next: AdminCookieCollection = { ...current, ...patch, v: 1 };
    const nextSerialized = serializeAdminCollectionCookie(next);
    if (rawCurrent !== undefined && decodeURIComponent(rawCurrent) === nextSerialized) return;
    writeCookieValue(name, nextSerialized, props.basePath);
  } catch {
    // document.cookie can throw under Safari private mode / strict cookie settings.
  }
}
