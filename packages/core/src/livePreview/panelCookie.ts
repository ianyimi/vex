import {
  DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE,
  LIVE_PREVIEW_LAYOUT_COOKIE_PREFIX,
  LIVE_PREVIEW_MIN_PANEL_WIDTH_PX,
  LIVE_PREVIEW_MIN_PREVIEW_PANEL_WIDTH_PX,
  LIVE_PREVIEW_PANEL_COOKIE_PREFIX,
  MAX_DERIVED_LIVE_PREVIEW_PANEL_MIN_SIZE,
  MAX_DERIVED_LIVE_PREVIEW_PREVIEW_MIN_SIZE,
  MAX_LIVE_PREVIEW_FORM_PANEL_SIZE,
  MIN_LIVE_PREVIEW_FORM_PANEL_SIZE,
} from "./constants";

/**
 * Cookie name holding one collection or global's panel open/closed choice.
 *
 * Lives in `@vexcms/core`, not beside the `useLivePreviewPanelState` hook, because
 * both sides of the boundary need it: the server component that reads the cookie
 * (`NextAdminPage`) and the client hook that writes it. The hook's module carries
 * `"use client"`, which would make every export in it unreachable from the server.
 *
 * @param props.slug - The collection or global slug the cookie is scoped to.
 * @returns The fully-qualified cookie name.
 */
export function livePreviewPanelCookieName(props: { slug: string }): string {
  return `${LIVE_PREVIEW_PANEL_COOKIE_PREFIX}${props.slug}`;
}

/**
 * Resolves the preview panel's initial open state from its cookie.
 *
 * Pure, so the server component reading `cookies()` and any other caller share
 * one interpretation of the stored value.
 *
 * @param props.cookieValue - The already-parsed value of the one cookie this reads.
 * @param props.defaultOpen - The collection/global's `admin.livePreview.defaultOpen` —
 *   the fallback used when no cookie has been written yet.
 * @returns `true`/`false` when the cookie holds an explicit `"1"`/`"0"`, else
 *   `props.defaultOpen`.
 */
export function readLivePreviewPanelCookie(props: {
  cookieValue: string | undefined;
  defaultOpen: boolean;
}): boolean {
  if (props.cookieValue === "1") return true;
  if (props.cookieValue === "0") return false;
  return props.defaultOpen;
}

/**
 * Cookie name holding one collection or global's split-handle position.
 *
 * Server-read for the same reason as the open/closed cookie: the split has to
 * render at its remembered width on the first paint, not snap to it afterwards.
 *
 * @param props.slug - The collection or global slug the cookie is scoped to.
 * @returns The fully-qualified cookie name.
 */
export function livePreviewLayoutCookieName(props: { slug: string }): string {
  return `${LIVE_PREVIEW_LAYOUT_COOKIE_PREFIX}${props.slug}`;
}

/**
 * Resolves the form column's share of the split from its cookie.
 *
 * Clamps to the same bounds the panels declare as their `minSize`, so a
 * hand-edited or stale cookie can never render a split the user cannot drag
 * back — and a non-numeric value falls back to the default rather than
 * producing `NaN` percentages.
 *
 * @param props.cookieValue - The raw cookie value, or `undefined` when unset.
 * @returns The form panel's percentage of the split.
 */
export function readLivePreviewLayoutCookie(props: { cookieValue: string | undefined }): number {
  const parsedSize = Number(props.cookieValue);
  if (!Number.isFinite(parsedSize)) return DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE;
  return Math.min(
    MAX_LIVE_PREVIEW_FORM_PANEL_SIZE,
    Math.max(MIN_LIVE_PREVIEW_FORM_PANEL_SIZE, parsedSize),
  );
}

/** Which column of the split a minimum is being resolved for. */
export type LivePreviewPanelColumn = "form" | "preview";

/**
 * Narrowest share one split column may be dragged to, for a split of this
 * width.
 *
 * Converts that column's pixel floor into a percentage of the space actually
 * available, so the same physical minimum applies on every display and a wider
 * screen buys real freedom rather than a fixed ratio. The preview's floor is
 * the larger of the two: a narrow form still works, a narrow preview stops
 * representing the page.
 *
 * Each result is capped so the two floors cannot sum to 100 — at that point
 * there is no range left and the handle reads as stuck.
 *
 * Pure, so the rule is testable without a DOM; the React side only supplies
 * the measured width.
 *
 * @param props.splitWidth - Width of the split container, in CSS pixels.
 * @param props.column - Which column to resolve for. Defaults to `"form"`.
 * @returns The minimum percentage for that column.
 */
export function resolveLivePreviewPanelMinSize(props: {
  splitWidth: number;
  column?: LivePreviewPanelColumn;
}): number {
  if (!Number.isFinite(props.splitWidth) || props.splitWidth <= 0) {
    return MIN_LIVE_PREVIEW_FORM_PANEL_SIZE;
  }

  const isPreview = props.column === "preview";
  const minPanelWidthPx = isPreview
    ? LIVE_PREVIEW_MIN_PREVIEW_PANEL_WIDTH_PX
    : LIVE_PREVIEW_MIN_PANEL_WIDTH_PX;
  const maxDerivedMinSize = isPreview
    ? MAX_DERIVED_LIVE_PREVIEW_PREVIEW_MIN_SIZE
    : MAX_DERIVED_LIVE_PREVIEW_PANEL_MIN_SIZE;

  const pixelFloorAsPercentage = (minPanelWidthPx / props.splitWidth) * 100;
  return Math.min(
    maxDerivedMinSize,
    Math.max(MIN_LIVE_PREVIEW_FORM_PANEL_SIZE, Math.round(pixelFloorAsPercentage)),
  );
}
