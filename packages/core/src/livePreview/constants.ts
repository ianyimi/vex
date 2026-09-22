import type { LivePreviewBreakpoint } from "./types";

/**
 * Query param a preview link carries to request preview mode. Read by the
 * project's own middleware (e.g. `proxy.ts`), never by application code directly.
 */
export const LIVE_PREVIEW_QUERY_PARAM = "vexLivePreview";

/**
 * Query param carrying an unsaved document's client-generated temp id, appended
 * by `resolveLivePreviewUrl` only when the document has no saved `_id` yet.
 */
export const LIVE_PREVIEW_ID_PARAM = "vexLivePreviewId";

/** Query param carrying the collection slug alongside `LIVE_PREVIEW_ID_PARAM`. */
export const LIVE_PREVIEW_COLLECTION_PARAM = "vexLivePreviewCollection";

/**
 * Marker cookie the project's own middleware sets after verifying a
 * `LIVE_PREVIEW_QUERY_PARAM` request carries a valid admin session.
 * `LivePreviewProvider` requires BOTH this cookie and the query param before
 * it attaches a transport listener.
 *
 * A cookie rather than a request header specifically so the public page stays
 * statically prerenderable: reading a header (`next/headers`) in a layout opts
 * the whole route out of static generation, which would undo the prerendering
 * the SEO work delivered. The cookie carries no secret — only `"1"` — and is
 * deliberately readable from script, because the client is what gates on it.
 */
export const LIVE_PREVIEW_COOKIE = "vex-live-preview";

/**
 * Lifetime of {@link LIVE_PREVIEW_COOKIE}. One hour: long enough for an
 * editing session, short enough that a shared preview link stops granting
 * preview mode soon after.
 */
export const LIVE_PREVIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60;

/**
 * Prefix of the per-collection/global cookie remembering whether the admin
 * panel's preview pane was last left open — `vex-live-preview-panel:<slug>`.
 */
export const LIVE_PREVIEW_PANEL_COOKIE_PREFIX = "vex-live-preview-panel:";

/**
 * Prefix of the per-collection/global cookie remembering how wide the admin
 * panel's form column was last dragged — `vex-live-preview-layout:<slug>`,
 * holding the form panel's percentage of the split.
 *
 * A cookie, not `react-resizable-panels`' own `autoSaveId` (localStorage):
 * localStorage is unreadable on the server, so the split would always render
 * at {@link DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE} and then jump to the saved
 * width after hydration — the same first-paint shift the open/closed cookie
 * exists to avoid.
 */
export const LIVE_PREVIEW_LAYOUT_COOKIE_PREFIX = "vex-live-preview-layout:";

/** Form column's share of the split before the editor has ever dragged the handle. */
export const DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE = 60;

/**
 * Smallest useful width for the FORM column, in CSS pixels.
 *
 * Expressed in pixels and converted to a share of the available width, rather
 * than being a percentage itself: the same physical minimum then yields a
 * stricter share on a laptop and a looser one on a large display, which is the
 * behaviour wanted. 560px is ~40% of a 1440px laptop (the intended limit) and
 * ~22% of a 2560px display.
 *
 * The derived value is capped by {@link MAX_DERIVED_LIVE_PREVIEW_PANEL_MIN_SIZE}:
 * this floor and the preview's must never sum past 100, or there is no range
 * left to drag and the handle reads as stuck.
 */
export const LIVE_PREVIEW_MIN_PANEL_WIDTH_PX = 560;

/**
 * Absolute floor for either column, in percent — the hard clamp applied to the
 * pixel-derived minimum, and to the stored layout cookie.
 *
 * The cookie is clamped to THIS rather than to the current viewport's derived
 * floor: clamping to a laptop's stricter floor would permanently rewrite a
 * wide-display layout the first time that editor opened the document small.
 */
export const MIN_LIVE_PREVIEW_FORM_PANEL_SIZE = 10;

/** Widest either column may be dragged, in percent — the mirror of the floor. */
export const MAX_LIVE_PREVIEW_FORM_PANEL_SIZE = 100 - MIN_LIVE_PREVIEW_FORM_PANEL_SIZE;

/**
 * Ceiling on the form column's derived minimum, in percent.
 *
 * Paired with {@link MAX_DERIVED_LIVE_PREVIEW_PREVIEW_MIN_SIZE}: the two must
 * leave a usable band. 35 + 50 = 85, so the narrowest window has fifteen
 * points of travel; at 40 + 55 it would be five, which reads as stuck.
 */
export const MAX_DERIVED_LIVE_PREVIEW_PANEL_MIN_SIZE = 35;

/**
 * Smallest useful width for the PREVIEW column specifically, in CSS pixels.
 *
 * Larger than the form's floor because the two columns are not equivalent: the
 * form reflows into a narrow column and stays usable, whereas a squeezed
 * preview stops representing the page it is previewing. Measured against the
 * split's own width (not the viewport), 720px is well past half of a laptop
 * split — so the cap below governs there — while a 2560px display derives
 * roughly 31%, handing the freedom back.
 */
export const LIVE_PREVIEW_MIN_PREVIEW_PANEL_WIDTH_PX = 720;

/**
 * Ceiling on the preview column's derived minimum, in percent — the preview
 * keeps at least half of a laptop-sized split.
 */
export const MAX_DERIVED_LIVE_PREVIEW_PREVIEW_MIN_SIZE = 50;

/**
 * Minimum used before the split has been measured — server render, and the
 * first client frame. Deliberately small: a too-large starting floor locks the
 * handle until the real measurement lands.
 */
export const DEFAULT_LIVE_PREVIEW_PANEL_MIN_SIZE = MIN_LIVE_PREVIEW_FORM_PANEL_SIZE;

/**
 * Default `admin.livePreview.debounceMs` when a collection/global omits it, and
 * `useLivePreviewSync`'s own fallback when called directly.
 */
export const DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS = 150;

/**
 * Default breakpoints for `livePreview.breakpoints` — the exact viewport matrix
 * the launch plan's spec J already uses for responsive QA, reused rather than
 * inventing a second "device size" concept. Labeled with Tailwind's own
 * breakpoint names for the four that are Tailwind breakpoints, and given a
 * device icon per J's own device correlation for each width.
 */
export const DEFAULT_LIVE_PREVIEW_BREAKPOINTS: LivePreviewBreakpoint[] = [
  { label: "iPhone SE", width: 375, icon: "Smartphone" },
  { label: "iPhone 14/15", width: 390, icon: "Smartphone" },
  { label: "sm", width: 640, icon: "Smartphone" },
  { label: "md", width: 768, icon: "Tablet" },
  { label: "lg", width: 1024, icon: "Tablet" },
  { label: "xl", width: 1280, icon: "Laptop" },
  { label: "2xl", width: 1536, icon: "Monitor" },
];

/**
 * Appends the params that turn a public URL into a preview request.
 *
 * Lives in core, not beside the panel, because BOTH sides need it: the browser
 * resolving a string/client `url`, and `NextAdminPage` resolving a `{ server }`
 * one. Skipping it produces a URL that loads a perfectly normal page which
 * listens to nothing — a silent failure, which is exactly what happened when
 * the server-resolved path had its own un-appended copy.
 *
 * @param props.url - The resolved public URL.
 * @param props.collectionSlug - The collection or global being previewed.
 * @param props.tempId - The temp id, only while the document is unsaved.
 * @returns The URL with `vexLivePreview=1` and, when unsaved, the temp-id params.
 */
export function appendLivePreviewParams(props: {
  url: string;
  collectionSlug: string;
  tempId?: string;
}): string {
  const previewParams = new URLSearchParams({ [LIVE_PREVIEW_QUERY_PARAM]: "1" });
  if (props.tempId) {
    previewParams.set(LIVE_PREVIEW_ID_PARAM, props.tempId);
    previewParams.set(LIVE_PREVIEW_COLLECTION_PARAM, props.collectionSlug);
  }

  const querySeparator = props.url.includes("?") ? "&" : "?";
  return `${props.url}${querySeparator}${previewParams.toString()}`;
}
